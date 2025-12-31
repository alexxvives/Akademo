import { requireRole } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/api-utils';
import { getCloudflareContext } from '@/lib/cloudflare';

// Proxy upload to Bunny Stream (handles the actual file upload)
export async function PUT(request: Request) {
  try {
    await requireRole(['ADMIN', 'TEACHER']);
    
    const url = new URL(request.url);
    const videoGuid = url.searchParams.get('videoGuid');
    
    if (!videoGuid) {
      return errorResponse('videoGuid is required', 400);
    }

    const ctx = getCloudflareContext();
    const libraryId = ctx?.BUNNY_STREAM_LIBRARY_ID || '571240';
    const apiKey = ctx?.BUNNY_STREAM_API_KEY || '';

    // Forward the upload to Bunny Stream
    const bunnyResponse = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos/${videoGuid}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/octet-stream',
          'AccessKey': apiKey,
        },
        body: request.body,
        // @ts-ignore - duplex is needed for streaming body
        duplex: 'half',
      }
    );

    if (!bunnyResponse.ok) {
      const error = await bunnyResponse.text();
      console.error('Bunny upload error:', error);
      return errorResponse(`Upload failed: ${error}`, bunnyResponse.status);
    }

    return Response.json(successResponse({
      success: true,
      videoGuid,
    }));
  } catch (error: any) {
    console.error('Bunny upload proxy error:', error);
    return errorResponse(error.message || 'Failed to upload video', 500);
  }
}
