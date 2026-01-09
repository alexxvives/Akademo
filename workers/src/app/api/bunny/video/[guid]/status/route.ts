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
    
    console.log('[status] Checking status for Bunny video:', guid);
    
    // Get status from Bunny
    let video;
    try {
      video = await getBunnyVideo(guid);
      console.log('[status] Bunny API response:', {
        guid: video.guid,
        status: video.status,
        length: video.length,
      });
    } catch (bunnyError: any) {
      console.error('[status] Bunny API error:', bunnyError.message);
      // Return error but don't throw 500 - Bunny might be temporarily unavailable
      return Response.json(successResponse({
        guid,
        status: -1,
        statusText: 'error_checking_status',
        isReady: false,
        duration: 0,
        error: 'Could not reach Bunny Stream API',
      }));
    }
    
    // Update database with new status - wrap in try/catch so failures don't block response
    try {
      // Check if Upload record exists
      const upload = await uploadQueries.findByBunnyGuid(guid);
      if (upload) {
        await uploadQueries.updateBunnyStatusByGuid(guid, video.status);
        console.log('[status] Updated Upload status to:', video.status);
      } else {
        console.warn('[status] No Upload record found for bunnyGuid:', guid);
      }
      
      // If video is finished transcoding and has a duration, update the video record
      if (video.status === 4 && video.length > 0) {
        await videoQueries.updateDurationByBunnyGuid(guid, video.length);
        console.log('[status] Updated Video duration to:', video.length);
      }
    } catch (dbError: any) {
      console.error('[status] Database update error (non-fatal):', dbError.message);
      // Don't fail the request - we still want to return the status
    }
    
    return Response.json(successResponse({
      guid: video.guid,
      status: video.status,
      statusText: getStatusText(video.status),
      isReady: video.status === 4,
      duration: video.length,
    }));
  } catch (error: any) {
    console.error('[status] Unexpected error:', error);
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
