import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth, getSession } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';
import { isAccessBlocked } from '../lib/payment-utils';

const bunny = new Hono<{ Bindings: Bindings }>();

// Compute TUS upload signature for direct browser→Bunny uploads:
// SHA256(libraryId + apiKey + expirationTime + videoGuid)
async function computeTusSignature(libraryId: string, apiKey: string, expiry: number, videoGuid: string): Promise<string> {
  const data = `${libraryId}${apiKey}${expiry}${videoGuid}`;
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

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

    const { title, collectionName, parentCollectionName, fileName } = await c.req.json();

    if (!title) {
      return c.json(errorResponse('title required'), 400);
    }

    const apiKey = c.env.BUNNY_STREAM_API_KEY;
    const libraryId = c.env.BUNNY_STREAM_LIBRARY_ID;

    // If collectionName provided, get or create the collection (supports nested: parent=academy, child=class)
    let collectionId: string | undefined;
    if (collectionName) {
      try {
        // Fetch all existing collections once
        const listResponse = await bunnyApi(`/library/${libraryId}/collections?itemsPerPage=1000`, {}, apiKey) as any;
        const allCollections: any[] = listResponse.items || [];

        if (parentCollectionName) {
          // Two-level nesting: find/create academy (parent) then class (child)
          const parentExisting = allCollections.find(
            (col: any) => col.name === parentCollectionName && !col.parentId,
          );
          let parentId: string;
          if (parentExisting) {
            parentId = parentExisting.guid;
          } else {
            const newParent = await bunnyApi(`/library/${libraryId}/collections`, {
              method: 'POST',
              body: JSON.stringify({ name: parentCollectionName }),
            }, apiKey) as any;
            parentId = newParent.guid;
          }

          const childExisting = allCollections.find(
            (col: any) => col.name === collectionName && col.parentId === parentId,
          );
          if (childExisting) {
            collectionId = childExisting.guid;
          } else {
            const newChild = await bunnyApi(`/library/${libraryId}/collections`, {
              method: 'POST',
              body: JSON.stringify({ name: collectionName, parentId }),
            }, apiKey) as any;
            collectionId = newChild.guid;
          }
        } else {
          // Single-level fallback
          const existing = allCollections.find((col: any) => col.name === collectionName);
          if (existing) {
            collectionId = existing.guid;
          } else {
            const newCollection = await bunnyApi(`/library/${libraryId}/collections`, {
              method: 'POST',
              body: JSON.stringify({ name: collectionName }),
            }, apiKey) as any;
            collectionId = newCollection.guid;
          }
        }
      } catch (error: any) {
        if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
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

    // Generate TUS credentials so the browser can upload directly to Bunny (no proxy)
    const tusExpiry = Math.floor(Date.now() / 1000) + 6 * 3600; // 6 hours
    const tusSignature = await computeTusSignature(String(libraryId), apiKey, tusExpiry, video.guid);

    return c.json(successResponse({
      videoGuid: video.guid,
      title: video.title,
      collectionId: collectionId || null,
      uploadUrl: `https://video.bunnycdn.com/library/${libraryId}/videos/${video.guid}`,
      tusSignature,
      tusExpiry,
      tusLibraryId: String(libraryId),
    }));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
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

    // Guard: check Content-Length before reading body into memory.
    // Cloudflare Workers have a ~128MB memory limit; reject oversized uploads early.
    const MAX_PROXY_UPLOAD_BYTES = 100 * 1024 * 1024; // 100 MB
    const contentLength = parseInt(c.req.header('Content-Length') || '0', 10);
    if (contentLength > MAX_PROXY_UPLOAD_BYTES) {
      return c.json(errorResponse(`El archivo es demasiado grande para subir por proxy (máx ${Math.round(MAX_PROXY_UPLOAD_BYTES / 1024 / 1024)} MB). Usa la subida directa a Bunny.`), 413);
    }

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
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Bunny Upload] Error:', error);
    return c.json(errorResponse('Failed to upload'), 500);
  }
});

// GET /bunny/video/:guid - Get video info
bunny.get('/video/:guid', async (c) => {
  try {
    const session = await requireAuth(c);
    if (!['TEACHER', 'ACADEMY', 'ADMIN'].includes(session.role)) {
      return c.json(errorResponse('Forbidden'), 403);
    }
    const guid = c.req.param('guid');

    const apiKey = c.env.BUNNY_STREAM_API_KEY;
    const libraryId = c.env.BUNNY_STREAM_LIBRARY_ID;

    const video = await bunnyApi(`/library/${libraryId}/videos/${guid}`, {
      method: 'GET',
    }, apiKey) as any;

    return c.json(successResponse(video));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Bunny Get Video] Error:', error);
    return c.json(errorResponse('Failed to get video'), 500);
  }
});

// GET /bunny/video/:guid/status - Get processing status
bunny.get('/video/:guid/status', async (c) => {
  try {
    const session = await requireAuth(c);
    if (!['TEACHER', 'ACADEMY', 'ADMIN'].includes(session.role)) {
      return c.json(errorResponse('Forbidden'), 403);
    }
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
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Bunny Status] Error:', error);
    return c.json(errorResponse('Failed to get status'), 500);
  }
});

// GET /bunny/video/:guid/stream - Get stream URL with token
bunny.get('/video/:guid/stream', async (c) => {
  try {
    const session = await requireAuth(c);
    const guid = c.req.param('guid');

    // Students must be enrolled in the class that owns this video.
    // Teachers, academy owners and admins skip this check.
    if (session.role === 'STUDENT') {
      const upload = await c.env.DB
        .prepare(`
          SELECT ce.id, l.classId
          FROM Upload u
          JOIN Video v ON v.uploadId = u.id
          JOIN Lesson l ON v.lessonId = l.id
          JOIN ClassEnrollment ce ON ce.classId = l.classId
          WHERE u.bunnyGuid = ? AND ce.userId = ? AND ce.status = 'APPROVED'
          LIMIT 1
        `)
        .bind(guid, session.id)
        .first() as { id: string; classId: string } | null;
      if (!upload) {
        return c.json(errorResponse('Not enrolled in this class'), 403);
      }

      // Block students without signed document or with overdue payments
      if (await isAccessBlocked(c.env.DB, session.id, upload.classId)) {
        return c.json(errorResponse('Acceso bloqueado. Firma el documento y regulariza tu situación de pago.'), 403);
      }
    }

    // Generate HMAC-SHA256 signed token for Bunny CDN streaming
    const tokenKey = c.env.BUNNY_STREAM_TOKEN_KEY;
    const cdnHostname = c.env.BUNNY_STREAM_CDN_HOSTNAME;
    const expires = Math.floor(Date.now() / 1000) + 3600; // 1 hour

    // Sign with HMAC-SHA256: sign(tokenKey, guid + expirationTime)
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(tokenKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const data = encoder.encode(`${guid}${expires}`);
    const sigBuffer = await crypto.subtle.sign('HMAC', key, data);
    const token = Array.from(new Uint8Array(sigBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const streamUrl = `https://${cdnHostname}/${guid}/playlist.m3u8?token=${token}&expires=${expires}`;

    return c.json(successResponse({
      streamUrl,
      expires,
    }));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
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
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
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

// ─── Bunny Storage (archived videos) ────────────────────────────────────────

// PUT /bunny/archive/upload?filename=...&title=...
// Streams the request body directly to Bunny Storage, then saves metadata to DB.
bunny.put('/archive/upload', async (c) => {
  try {
    const session = await requireAuth(c);
    if (!['ACADEMY', 'ADMIN', 'TEACHER'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const { filename, title } = c.req.query();
    if (!filename) return c.json(errorResponse('filename required'), 400);

    const storageZone = c.env.BUNNY_STORAGE_ZONE_NAME;
    const storageApiKey = c.env.BUNNY_STORAGE_API_KEY;
    if (!storageZone || !storageApiKey) {
      return c.json(errorResponse('Bunny Storage not configured — contact admin'), 500);
    }

    // Resolve academyId
    let academyId: string;
    if (session.role === 'ACADEMY') {
      const academy = await c.env.DB.prepare('SELECT id FROM Academy WHERE ownerId = ?').bind(session.id).first() as any;
      if (!academy) return c.json(errorResponse('Academy not found'), 404);
      academyId = academy.id;
    } else if (session.role === 'TEACHER') {
      const teacher = await c.env.DB.prepare('SELECT academyId FROM Teacher WHERE userId = ?').bind(session.id).first() as any;
      if (!teacher) return c.json(errorResponse('Teacher not found'), 404);
      academyId = teacher.academyId;
    } else {
      const { academyId: qAcademyId } = c.req.query();
      if (!qAcademyId) return c.json(errorResponse('academyId required for admin'), 400);
      academyId = qAcademyId;
    }

    const uuid = crypto.randomUUID();
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const { classId } = c.req.query();

    // Resolve class name for folder (use class name, not classId UUID)
    let resolvedClassName: string | null = null;
    if (classId) {
      const cls = await c.env.DB.prepare('SELECT name FROM Class WHERE id = ?').bind(classId).first() as any;
      resolvedClassName = cls?.name ?? null;
    }
    const safeFolderName = resolvedClassName
      ? resolvedClassName.replace(/[^a-zA-Z0-9._\-\s]/g, '').replace(/\s+/g, '_').slice(0, 80)
      : null;
    const storageKey = safeFolderName
      ? `${academyId}/${safeFolderName}/${uuid}-${safeFilename}`
      : `${academyId}/${uuid}-${safeFilename}`;
    const contentLength = parseInt(c.req.header('Content-Length') || '0', 10);

    const storageHostname = c.env.BUNNY_STORAGE_HOSTNAME || 'uk.storage.bunnycdn.com';
    console.log(`[Archive Upload] BUNNY_STORAGE_HOSTNAME env value: '${c.env.BUNNY_STORAGE_HOSTNAME}', resolved: '${storageHostname}'`);
    console.log(`[Archive Upload] Uploading to ${storageHostname}/${storageZone}/${storageKey}, size: ${contentLength}`);

    const uploadRes = await fetch(
      `https://${storageHostname}/${storageZone}/${storageKey}`,
      {
        method: 'PUT',
        headers: {
          'AccessKey': storageApiKey,
          'Content-Type': 'application/octet-stream',
          ...(contentLength > 0 ? { 'Content-Length': String(contentLength) } : {}),
        },
        // Stream body directly to avoid buffering entire file in Worker memory
        body: c.req.raw.body,
        // @ts-ignore — duplex required for streaming request bodies
        duplex: 'half',
      }
    );

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      console.error(`[Archive Upload] Bunny Storage error ${uploadRes.status}:`, err);
      return c.json(errorResponse(`Upload failed (${uploadRes.status}) via ${storageHostname}: ${err.slice(0, 200)}`), 500);
    }

    const id = crypto.randomUUID();
    await c.env.DB.prepare(
      'INSERT INTO ArchivedVideo (id, academyId, classId, className, title, fileName, fileSize, storageKey, uploadedById) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, academyId, classId || null, resolvedClassName, title || filename, filename, contentLength || null, storageKey, session.id).run();

    return c.json(successResponse({ id, storageKey, title: title || filename }));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Archive Upload] Error:', error);
    return c.json(errorResponse('Upload failed'), 500);
  }
});

// GET /bunny/archive — list archived videos for the current academy
bunny.get('/archive', async (c) => {
  try {
    const session = await requireAuth(c);
    if (!['ACADEMY', 'ADMIN', 'TEACHER'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    let academyId: string | null = null;
    if (session.role === 'ACADEMY') {
      const academy = await c.env.DB.prepare('SELECT id FROM Academy WHERE ownerId = ?').bind(session.id).first() as any;
      if (!academy) return c.json(successResponse({ videos: [], total: 0 }));
      academyId = academy.id;
    } else if (session.role === 'ADMIN') {
      const { academyId: qId } = c.req.query();
      if (qId) academyId = qId;
      // If no filter, admin sees all (academyId remains null)
    } else {
      const teacher = await c.env.DB.prepare('SELECT academyId FROM Teacher WHERE userId = ?').bind(session.id).first() as any;
      if (teacher) academyId = teacher.academyId;
    }

    // Non-admin must have an academyId resolved
    if (!academyId && session.role !== 'ADMIN') return c.json(successResponse({ videos: [], total: 0 }));

    const { classId: filterClassId } = c.req.query();
    let query = "SELECT av.*, (u.firstName || ' ' || u.lastName) as uploaderName FROM ArchivedVideo av LEFT JOIN User u ON av.uploadedById = u.id WHERE 1=1";
    const params: any[] = [];
    if (academyId) {
      query += ' AND av.academyId = ?';
      params.push(academyId);
    }
    if (filterClassId) {
      query += ' AND av.classId = ?';
      params.push(filterClassId);
    }
    query += ' ORDER BY av.createdAt DESC';
    const result = params.length > 0
      ? await c.env.DB.prepare(query).bind(...params).all()
      : await c.env.DB.prepare(query).all();

    return c.json(successResponse({ videos: result.results || [], total: result.results?.length || 0 }));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Archive List] Error:', error);
    return c.json(errorResponse('Failed to list archived videos'), 500);
  }
});

// DELETE /bunny/archive/:id — delete archived video from DB + Storage
bunny.delete('/archive/:id', async (c) => {
  try {
    const session = await requireAuth(c);
    if (!['ACADEMY', 'ADMIN'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const id = c.req.param('id');
    const video = await c.env.DB.prepare('SELECT * FROM ArchivedVideo WHERE id = ?').bind(id).first() as any;
    if (!video) return c.json(errorResponse('Video not found'), 404);

    if (session.role === 'ACADEMY') {
      const academy = await c.env.DB.prepare('SELECT id FROM Academy WHERE ownerId = ?').bind(session.id).first() as any;
      if (!academy || academy.id !== video.academyId) return c.json(errorResponse('Forbidden'), 403);
    }

    const storageZone = c.env.BUNNY_STORAGE_ZONE_NAME;
    const storageApiKey = c.env.BUNNY_STORAGE_API_KEY;
    if (storageZone && storageApiKey) {
      try {
        const storageHostname = c.env.BUNNY_STORAGE_HOSTNAME || 'uk.storage.bunnycdn.com';
        await fetch(`https://${storageHostname}/${storageZone}/${video.storageKey}`, {
          method: 'DELETE',
          headers: { 'AccessKey': storageApiKey },
        });
      } catch (e) {
        console.error('[Archive Delete] Failed to delete from storage:', e);
      }
    }

    await c.env.DB.prepare('DELETE FROM ArchivedVideo WHERE id = ?').bind(id).run();
    return c.json(successResponse({ deleted: true }));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Archive Delete] Error:', error);
    return c.json(errorResponse('Failed to delete archived video'), 500);
  }
});

// GET /bunny/video/:guid/download-url — return authenticated CDN download URL
bunny.get('/video/:guid/download-url', async (c) => {
  try {
    const session = await requireAuth(c);
    if (!['ACADEMY', 'TEACHER', 'ADMIN'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const guid = c.req.param('guid');
    const db = c.env.DB;

    // Verify the video exists and belongs to the user's scope
    const video = await db.prepare(`
      SELECT v.id, c.academyId, a.ownerId
      FROM Video v
      JOIN Upload up ON v.uploadId = up.id
      JOIN Lesson l ON v.lessonId = l.id
      JOIN Class c ON l.classId = c.id
      JOIN Academy a ON c.academyId = a.id
      WHERE up.bunnyGuid = ?
    `).bind(guid).first() as any;

    // Also check stream recordings
    const recording = !video ? await db.prepare(`
      SELECT ls.id, c.academyId, a.ownerId
      FROM LiveStream ls
      LEFT JOIN Class c ON ls.classId = c.id
      LEFT JOIN Academy a ON c.academyId = a.id
      WHERE ls.recordingId = ?
    `).bind(guid).first() as any : null;

    const item = video || recording;
    if (!item) return c.json(errorResponse('Video not found'), 404);

    if (session.role === 'ACADEMY' && item.ownerId !== session.id) {
      return c.json(errorResponse('Forbidden'), 403);
    }
    if (session.role === 'TEACHER') {
      const teacher = await db.prepare('SELECT academyId FROM Teacher WHERE userId = ?').bind(session.id).first() as any;
      if (!teacher || teacher.academyId !== item.academyId) {
        return c.json(errorResponse('Forbidden'), 403);
      }
    }

    const hostname = c.env.BUNNY_STREAM_CDN_HOSTNAME || 'vz-bb8d111e-8eb.b-cdn.net';
    // Try 720p; Bunny also serves at /original for the raw upload
    const url = `https://${hostname}/${guid}/play_720p.mp4`;

    return c.json(successResponse({ url, guid }));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Bunny Download URL] Error:', error);
    return c.json(errorResponse('Failed to get download URL'), 500);
  }
});

// POST /bunny/videos/:videoId/archive — move a lesson video to the archive tab
// The video file stays in Bunny Stream; we create an ArchivedVideo record and
// delete the Video + Upload DB rows so it no longer appears in lessons.
bunny.post('/videos/:videoId/archive', async (c) => {
  try {
    const session = await requireAuth(c);
    if (!['ACADEMY', 'ADMIN', 'TEACHER'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const videoId = c.req.param('videoId');

    // Fetch video + upload + lesson + class in one query
    const row = await c.env.DB.prepare(`
      SELECT v.id, v.title, v.durationSeconds,
             up.bunnyGuid, up.fileName, up.fileSize, up.mimeType,
             l.id AS lessonId, l.classId,
             cl.name AS className, cl.academyId
      FROM Video v
      JOIN Upload up ON v.uploadId = up.id
      JOIN Lesson l ON v.lessonId = l.id
      JOIN Class cl ON l.classId = cl.id
      WHERE v.id = ?
    `).bind(videoId).first() as any;

    if (!row) return c.json(errorResponse('Video not found'), 404);
    if (!row.bunnyGuid) return c.json(errorResponse('Video has no Bunny Stream GUID'), 400);

    // Authorization: academy must own the class, teacher must teach it
    if (session.role === 'ACADEMY') {
      const academy = await c.env.DB.prepare('SELECT id FROM Academy WHERE ownerId = ?').bind(session.id).first() as any;
      if (!academy || academy.id !== row.academyId) return c.json(errorResponse('Forbidden'), 403);
    } else if (session.role === 'TEACHER') {
      const teacher = await c.env.DB.prepare('SELECT academyId FROM Teacher WHERE userId = ?').bind(session.id).first() as any;
      if (!teacher || teacher.academyId !== row.academyId) return c.json(errorResponse('Forbidden'), 403);
    }

    const newId = crypto.randomUUID();
    const storageKey = `bunnystream:${row.bunnyGuid}`;

    // Create ArchivedVideo pointing to the existing Bunny Stream video
    await c.env.DB.prepare(
      'INSERT INTO ArchivedVideo (id, academyId, classId, className, title, fileName, fileSize, mimeType, storageKey, durationSeconds, uploadedById) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(newId, row.academyId, row.classId, row.className, row.title, row.fileName || `${row.title}.mp4`, row.fileSize, 'video/stream', storageKey, row.durationSeconds, session.id).run();

    // Delete Video record (VideoPlayState cascades automatically)
    await c.env.DB.prepare('DELETE FROM Video WHERE id = ?').bind(videoId).run();
    // Delete Upload record (no cascade from Video deletion)
    await c.env.DB.prepare('DELETE FROM Upload WHERE bunnyGuid = ?').bind(row.bunnyGuid).run();

    return c.json(successResponse({ archivedId: newId }));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Archive Video] Error:', error);
    return c.json(errorResponse('Failed to archive video'), 500);
  }
});

// DELETE /bunny/videos/:videoId — permanently delete a lesson video or stream recording from Bunny + DB
bunny.delete('/videos/:videoId', async (c) => {
  try {
    const session = await requireAuth(c);
    if (!['ACADEMY', 'ADMIN', 'TEACHER'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const videoId = c.req.param('videoId');

    // Try lesson video first
    const lessonRow = await c.env.DB.prepare(`
      SELECT v.id, v.title, up.bunnyGuid, cl.academyId, 'lesson' as source
      FROM Video v
      JOIN Upload up ON v.uploadId = up.id
      JOIN Lesson l ON v.lessonId = l.id
      JOIN Class cl ON l.classId = cl.id
      WHERE v.id = ?
    `).bind(videoId).first() as any;

    // Fall back to stream recording
    const recRow = !lessonRow ? await c.env.DB.prepare(`
      SELECT ls.id, COALESCE(ls.title, 'Grabación') as title, ls.recordingId as bunnyGuid, c.academyId, 'recording' as source
      FROM LiveStream ls
      LEFT JOIN Class c ON ls.classId = c.id
      WHERE ls.id = ?
    `).bind(videoId).first() as any : null;

    const row = lessonRow || recRow;
    if (!row) return c.json(errorResponse('Video not found'), 404);

    // Authorization
    if (session.role === 'ACADEMY') {
      const academy = await c.env.DB.prepare('SELECT id FROM Academy WHERE ownerId = ?').bind(session.id).first() as any;
      if (!academy || academy.id !== row.academyId) return c.json(errorResponse('Forbidden'), 403);
    } else if (session.role === 'TEACHER') {
      const teacher = await c.env.DB.prepare('SELECT academyId FROM Teacher WHERE userId = ?').bind(session.id).first() as any;
      if (!teacher || teacher.academyId !== row.academyId) return c.json(errorResponse('Forbidden'), 403);
    }

    const apiKey = c.env.BUNNY_STREAM_API_KEY;
    const libraryId = c.env.BUNNY_STREAM_LIBRARY_ID;

    // Delete from Bunny Stream (best-effort — don't fail if already gone)
    if (row.bunnyGuid && apiKey && libraryId) {
      try {
        await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${row.bunnyGuid}`, {
          method: 'DELETE',
          headers: { 'AccessKey': apiKey },
        });
      } catch (e) {
        console.error('[Video Delete] Bunny delete failed (ignored):', e);
      }
    }

    if (row.source === 'recording') {
      await c.env.DB.prepare('DELETE FROM LiveStream WHERE id = ?').bind(videoId).run();
    } else {
      // Delete Video record (VideoPlayState cascades from Video)
      await c.env.DB.prepare('DELETE FROM Video WHERE id = ?').bind(videoId).run();
      if (row.bunnyGuid) {
        await c.env.DB.prepare('DELETE FROM Upload WHERE bunnyGuid = ?').bind(row.bunnyGuid).run();
      }
    }

    return c.json(successResponse({ deleted: true }));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Video Delete] Error:', error);
    return c.json(errorResponse('Failed to delete video'), 500);
  }
});

// GET /bunny/archive/:id/download — authenticated proxy download
bunny.get('/archive/:id/download', async (c) => {
  try {
    const session = await requireAuth(c);
    const id = c.req.param('id');
    const video = await c.env.DB.prepare('SELECT * FROM ArchivedVideo WHERE id = ?').bind(id).first() as any;
    if (!video) return c.json(errorResponse('Video not found'), 404);

    if (session.role === 'ACADEMY') {
      const academy = await c.env.DB.prepare('SELECT id FROM Academy WHERE ownerId = ?').bind(session.id).first() as any;
      if (!academy || academy.id !== video.academyId) return c.json(errorResponse('Forbidden'), 403);
    } else if (session.role === 'TEACHER') {
      const teacher = await c.env.DB.prepare('SELECT academyId FROM Teacher WHERE userId = ?').bind(session.id).first() as any;
      if (!teacher || teacher.academyId !== video.academyId) return c.json(errorResponse('Forbidden'), 403);
    } else if (session.role !== 'ADMIN') {
      return c.json(errorResponse('Forbidden'), 403);
    }

    const storageZone = c.env.BUNNY_STORAGE_ZONE_NAME;
    const storageApiKey = c.env.BUNNY_STORAGE_API_KEY;

    // Bunny Stream-backed archived video: redirect to CDN download URL
    if (video.mimeType === 'video/stream' && video.storageKey.startsWith('bunnystream:')) {
      const guid = video.storageKey.replace('bunnystream:', '');
      const cdnHostname = c.env.BUNNY_STREAM_CDN_HOSTNAME || 'vz-bb8d111e-8eb.b-cdn.net';
      const downloadUrl = `https://${cdnHostname}/${guid}/play_720p.mp4`;
      return Response.redirect(downloadUrl, 302);
    }

    if (!storageZone || !storageApiKey) return c.json(errorResponse('Storage not configured'), 500);

    const storageHostname = c.env.BUNNY_STORAGE_HOSTNAME || 'uk.storage.bunnycdn.com';
    const res = await fetch(`https://${storageHostname}/${storageZone}/${video.storageKey}`, {
      headers: { 'AccessKey': storageApiKey },
    });
    if (!res.ok) return c.json(errorResponse('File not found in storage'), 404);

    return new Response(res.body, {
      headers: {
        'Content-Type': video.mimeType || 'video/mp4',
        'Content-Disposition': `attachment; filename="${video.fileName}"`,
        ...(video.fileSize ? { 'Content-Length': String(video.fileSize) } : {}),
      },
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Archive Download] Error:', error);
    return c.json(errorResponse('Download failed'), 500);
  }
});

export default bunny;
