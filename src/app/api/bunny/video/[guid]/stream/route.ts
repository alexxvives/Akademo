import { getSession } from '@/lib/auth';
import { successResponse } from '@/lib/api-utils';
import { getCloudflareContext } from '@/lib/cloudflare';

// Get Bunny Stream embed/player URLs for a video
export async function GET(
  request: Request,
  { params }: { params: Promise<{ guid: string }> }
) {
  try {
    // Check auth but allow fallback for debugging
    const session = await getSession();
    if (!session) {
      // For now, allow unauthenticated access to debug video playback
      // TODO: Re-enable strict auth after video playback is confirmed working
      console.warn('Stream API accessed without authentication');
    }
    
    const { guid } = await params;
    
    const ctx = getCloudflareContext();
    const libraryId = ctx?.BUNNY_STREAM_LIBRARY_ID || '571240';
    const cdnHostname = ctx?.BUNNY_STREAM_CDN_HOSTNAME || 'vz-bb8d111e-8eb.b-cdn.net';
    
    // Note: Since there's no CDN Pull Zone configured, we use unsigned URLs
    // If token authentication is needed, enable "Direct Play" in Bunny Stream → Library → Security
    const hlsUrl = `https://${cdnHostname}/${guid}/playlist.m3u8`;
    
    return Response.json(successResponse({
      // Embed URL for iframe player (not recommended - can't track/watermark)
      embedUrl: `https://iframe.mediadelivery.net/embed/${libraryId}/${guid}`,
      // HLS stream URL for custom player (recommended)
      hlsUrl: hlsUrl,
      // Thumbnail URL
      thumbnailUrl: `https://${cdnHostname}/${guid}/thumbnail.jpg`,
      // Preview animation (animated gif)
      previewUrl: `https://${cdnHostname}/${guid}/preview.webp`,
    }));
  } catch (error: any) {
    console.error('Stream API error:', error);
    return Response.json({ 
      success: false, 
      error: error.message || 'Unknown error',
      stack: error.stack 
    }, { status: 500 });
  }
}
