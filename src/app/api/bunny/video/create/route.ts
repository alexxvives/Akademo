import { requireRole } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/api-utils';
import { createBunnyVideo } from '@/lib/bunny-stream';

// Create a new video entry in Bunny Stream and return the upload URL
export async function POST(request: Request) {
  try {
    await requireRole(['ADMIN', 'TEACHER']);
    
    const { title, fileName } = await request.json();
    
    if (!title || !fileName) {
      return errorResponse('Title and fileName are required', 400);
    }

    // Create video entry in Bunny Stream
    const video = await createBunnyVideo(title);
    
    return Response.json(successResponse({
      videoGuid: video.guid,
      title: video.title,
      // Client will use this to upload directly to Bunny
      uploadUrl: `https://video.bunnycdn.com/library/${process.env.BUNNY_STREAM_LIBRARY_ID || '571240'}/videos/${video.guid}`,
    }));
  } catch (error: any) {
    console.error('Bunny video create error:', error);
    return errorResponse(error.message || 'Failed to create video', 500);
  }
}
