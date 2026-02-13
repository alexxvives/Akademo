import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth, getSession } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';

const bunny = new Hono<{ Bindings: Bindings }>();

// Helper to call Bunny API
async function bunnyApi(endpoint: string, options: RequestInit, apiKey: string) {
  const response = await fetch(`https://video.bunnycdn.com${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'AccessKey': apiKey,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Bunny API error: ${error}`);
  }

  return response.json();
}

// POST /bunny/video/create - Create video in Bunny
bunny.post('/video/create', async (c) => {
  try {
    const session = await requireAuth(c);

    if (!['ADMIN', 'TEACHER', 'ACADEMY'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const { title, collectionName, fileName } = await c.req.json();

    if (!title) {
      return c.json(errorResponse('title required'), 400);
    }

    const apiKey = c.env.BUNNY_STREAM_API_KEY;
    const libraryId = c.env.BUNNY_STREAM_LIBRARY_ID;

    // If collectionName provided, get or create the collection
    let collectionId: string | undefined;
    if (collectionName) {
      try {
        // Get existing collections
        const listResponse = await bunnyApi(`/library/${libraryId}/collections`, {}, apiKey) as any;
        const existing = (listResponse.items || []).find((c: any) => c.name === collectionName);
        
        if (existing) {
          collectionId = existing.guid;
        } else {
          // Create new collection
          const newCollection = await bunnyApi(`/library/${libraryId}/collections`, {
            method: 'POST',
            body: JSON.stringify({ name: collectionName }),
          }, apiKey) as any;
          collectionId = newCollection.guid;
        }
      } catch (error: any) {
        console.error('[Bunny Collection] Failed to get/create collection:', error);
        // Continue without collection if it fails
      }
    }

    // Prepare video creation payload
    const payload: any = { title };
    if (collectionId) {
      payload.collectionId = collectionId;
    }

    const video = await bunnyApi(`/library/${libraryId}/videos`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, apiKey) as any;

    return c.json(successResponse({
      videoGuid: video.guid,
      title: video.title,
      collectionId: collectionId || null,
      uploadUrl: `https://video.bunnycdn.com/library/${libraryId}/videos/${video.guid}`,
    }));
  } catch (error: any) {
    console.error('[Bunny Create] Error:', error);
    return c.json(errorResponse('Failed to create video'), 500);
  }
});

// PUT /bunny/video/upload - Proxy upload to Bunny
bunny.put('/video/upload', async (c) => {
  try {
    // Manual session check with better error handling
    const session = await getSession(c);
    if (!session) {
      console.error('[Bunny Upload] No session found - cookies may not be sent');
      console.error('[Bunny Upload] Cookie header:', c.req.header('Cookie'));
      return c.json(errorResponse('Unauthorized - no session cookie'), 401);
    }

    if (!['ADMIN', 'TEACHER', 'ACADEMY'].includes(session.role)) {
      return c.json(errorResponse(`Not authorized - role ${session.role} not allowed`), 403);
    }

    const { videoGuid } = c.req.query();

    if (!videoGuid) {
      return c.json(errorResponse('videoGuid required'), 400);
    }

    const apiKey = c.env.BUNNY_STREAM_API_KEY;
    const libraryId = c.env.BUNNY_STREAM_LIBRARY_ID;


    // Read body as ArrayBuffer to avoid stream consumption issues
    let bodyBuffer: ArrayBuffer;
    try {
      bodyBuffer = await c.req.arrayBuffer();
    } catch (bodyError: unknown) {
      console.error('[Bunny Upload] Failed to read body:', bodyError);
      return c.json(errorResponse('Failed to read upload body'), 400);
    }

    if (bodyBuffer.byteLength === 0) {
      return c.json(errorResponse('No file data received'), 400);
    }

    // Forward upload to Bunny
    const response = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos/${videoGuid}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/octet-stream',
          'AccessKey': apiKey,
        },
        body: bodyBuffer,
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('[Bunny Upload] Bunny API error:', error, 'Status:', response.status);
      
      // Check for specific Bunny errors
      if (error.includes('No resume URL') || error.includes('not found')) {
        return c.json(errorResponse(`Video ${videoGuid} not found in Bunny Stream. It may have been deleted or expired.`), 404);
      }
      
      return c.json(errorResponse(`Upload failed: ${error}`), 500);
    }

    return c.json(successResponse({ videoGuid }));
  } catch (error: any) {
    console.error('[Bunny Upload] Error:', error);
    return c.json(errorResponse('Failed to upload'), 500);
  }
});

// GET /bunny/video/:guid - Get video info
bunny.get('/video/:guid', async (c) => {
  try {
    const session = await requireAuth(c);
    const guid = c.req.param('guid');

    const apiKey = c.env.BUNNY_STREAM_API_KEY;
    const libraryId = c.env.BUNNY_STREAM_LIBRARY_ID;

    const video = await bunnyApi(`/library/${libraryId}/videos/${guid}`, {
      method: 'GET',
    }, apiKey) as any;

    return c.json(successResponse(video));
  } catch (error: any) {
    console.error('[Bunny Get Video] Error:', error);
    return c.json(errorResponse('Failed to get video'), 500);
  }
});

// GET /bunny/video/:guid/status - Get processing status
bunny.get('/video/:guid/status', async (c) => {
  try {
    const session = await requireAuth(c);
    const guid = c.req.param('guid');

    const apiKey = c.env.BUNNY_STREAM_API_KEY;
    const libraryId = c.env.BUNNY_STREAM_LIBRARY_ID;

    const video = await bunnyApi(`/library/${libraryId}/videos/${guid}`, {
      method: 'GET',
    }, apiKey) as any;

    const isReady = video.status === 4; // 4 = ready
    const statusText = isReady ? 'Ready' : video.status === 3 ? 'Processing' : 'Pending';

    // Update video duration if ready
    if (isReady && video.length > 0) {
      await c.env.DB
        .prepare('UPDATE Video SET durationSeconds = ? WHERE uploadId IN (SELECT id FROM Upload WHERE bunnyGuid = ?)')
        .bind(video.length, guid)
        .run();
    }

    return c.json(successResponse({
      guid: video.guid,
      title: video.title,
      status: video.status,
      statusText,
      isReady,
      duration: video.length,
      width: video.width,
      height: video.height,
    }));
  } catch (error: any) {
    console.error('[Bunny Status] Error:', error);
    return c.json(errorResponse('Failed to get status'), 500);
  }
});

// GET /bunny/video/:guid/stream - Get stream URL with token
bunny.get('/video/:guid/stream', async (c) => {
  try {
    const session = await requireAuth(c);
    const guid = c.req.param('guid');

    // Generate signed token for streaming
    const tokenKey = c.env.BUNNY_STREAM_TOKEN_KEY;
    const cdnHostname = c.env.BUNNY_STREAM_CDN_HOSTNAME;
    const expires = Math.floor(Date.now() / 1000) + 3600; // 1 hour

    // Create token (simplified - real implementation needs proper signing)
    const token = btoa(`${guid}-${expires}-${tokenKey}`);

    const streamUrl = `https://${cdnHostname}/${guid}/playlist.m3u8?token=${token}&expires=${expires}`;

    return c.json(successResponse({
      streamUrl,
      expires,
    }));
  } catch (error: any) {
    console.error('[Bunny Stream URL] Error:', error);
    return c.json(errorResponse('Failed to generate stream URL'), 500);
  }
});

// GET /bunny/video/:videoGuid - Get video info
bunny.get('/video/:videoGuid', async (c) => {
  try {
    const session = await requireAuth(c);
    const { videoGuid } = c.req.param();

    if (!videoGuid) {
      return c.json(errorResponse('videoGuid required'), 400);
    }

    const apiKey = c.env.BUNNY_STREAM_API_KEY;
    const libraryId = c.env.BUNNY_STREAM_LIBRARY_ID;

    const video = await bunnyApi(`/library/${libraryId}/videos/${videoGuid}`, {}, apiKey) as any;

    return c.json(successResponse({
      guid: video.guid,
      title: video.title,
      status: video.status,
      statusText: getStatusText(video.status),
      isReady: video.status === 4,
      duration: video.length,
      thumbnailFileName: video.thumbnailFileName,
      availableResolutions: video.availableResolutions,
    }));
  } catch (error: any) {
    console.error('[Bunny Get Video] Error:', error);
    // Return 404 if video doesn't exist
    if (error.message?.includes('404') || error.message?.includes('not found')) {
      return c.json(errorResponse('Video not found'), 404);
    }
    return c.json(errorResponse('Failed to get video'), 500);
  }
});

// Helper to get human-readable status text
function getStatusText(status: number): string {
  switch (status) {
    case 0: return 'Created';
    case 1: return 'Uploaded';
    case 2: return 'Processing';
    case 3: return 'Transcoding';
    case 4: return 'Ready';
    case 5: return 'Error';
    default: return 'Unknown';
  }
}

export default bunny;
