import { requireAuth } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/api-utils';
import { getBunnyVideo, isVideoReady, getVideoStatusText } from '@/lib/bunny-stream';
import { videoQueries } from '@/lib/db';

// Get video status from Bunny Stream
export async function GET(
  request: Request,
  { params }: { params: Promise<{ guid: string }> }
) {
  try {
    await requireAuth();
    const { guid } = await params;
    
    const video = await getBunnyVideo(guid);
    
    // If video is finished transcoding and has a duration, update the video record
    if (isVideoReady(video.status) && video.length > 0) {
      await videoQueries.updateDurationByBunnyGuid(guid, video.length);
    }
    
    return Response.json(successResponse({
      guid: video.guid,
      title: video.title,
      status: video.status,
      statusText: getVideoStatusText(video.status),
      isReady: isVideoReady(video.status),
      duration: video.length,
      width: video.width,
      height: video.height,
      resolutions: video.availableResolutions,
      views: video.views,
    }));
  } catch (error: any) {
    console.error('Bunny video status error:', error);
    return errorResponse(error.message || 'Failed to get video status', 500);
  }
}
