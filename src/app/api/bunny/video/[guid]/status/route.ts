import { getSession } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { getBunnyVideo } from '@/lib/bunny-stream';
import { uploadQueries, videoQueries } from '@/lib/db';

// Get and update Bunny video transcoding status
export async function GET(
  request: Request,
  { params }: { params: Promise<{ guid: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return errorResponse('Not authenticated', 401);
    }
    
    const { guid } = await params;
    
    // Get status from Bunny
    const video = await getBunnyVideo(guid);
    
    // Update database with new status
    // Find upload by bunnyGuid and update status
    await uploadQueries.updateBunnyStatusByGuid(guid, video.status);
    
    // If video is finished transcoding and has a duration, update the video record
    if (video.status === 4 && video.length > 0) {
      await videoQueries.updateDurationByBunnyGuid(guid, video.length);
    }
    
    return Response.json(successResponse({
      guid: video.guid,
      status: video.status,
      statusText: getStatusText(video.status),
      isReady: video.status === 4,
      duration: video.length,
    }));
  } catch (error: any) {
    console.error('Bunny status check error:', error);
    return Response.json({ 
      success: false, 
      error: error.message || 'Unknown error'
    }, { status: 500 });
  }
}

function getStatusText(status: number): string {
  switch (status) {
    case 0: return 'created';
    case 1: return 'uploaded';
    case 2: return 'processing';
    case 3: return 'transcoding';
    case 4: return 'finished';
    case 5: return 'error';
    default: return 'unknown';
  }
}
