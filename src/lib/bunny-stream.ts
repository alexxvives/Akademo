// Bunny Stream URL helpers for video thumbnails, embeds, and downloads
// Full API operations are in workers/akademo-api

import { getCloudflareContext } from './cloudflare';

interface BunnyEnv {
  BUNNY_STREAM_LIBRARY_ID: string;
  BUNNY_STREAM_CDN_HOSTNAME: string;
}

function getConfig(): BunnyEnv {
  const ctx = getCloudflareContext();
  return {
    BUNNY_STREAM_LIBRARY_ID: ctx?.BUNNY_STREAM_LIBRARY_ID || process.env.BUNNY_STREAM_LIBRARY_ID || '',
    BUNNY_STREAM_CDN_HOSTNAME: ctx?.BUNNY_STREAM_CDN_HOSTNAME || process.env.BUNNY_STREAM_CDN_HOSTNAME || '',
  };
}

// Get thumbnail URL
export function getBunnyThumbnailUrl(videoGuid: string, thumbnailFileName?: string): string {
  const config = getConfig();
  const thumb = thumbnailFileName || 'thumbnail.jpg';
  const hostname = config.BUNNY_STREAM_CDN_HOSTNAME || 'vz-bb8d111e-8eb.b-cdn.net'; // Fallback to known hostname
  
  if (!hostname || hostname === '') {
    console.warn('BUNNY_STREAM_CDN_HOSTNAME is not configured, using fallback');
  }
  
  return `https://${hostname}/${videoGuid}/${thumb}`;
}

// Get Bunny iframe embed/player URL (opens video player in browser)
export function getBunnyEmbedUrl(videoGuid: string): string {
  const config = getConfig();
  const libraryId = config.BUNNY_STREAM_LIBRARY_ID || '571240'; // Fallback to known library ID
  return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoGuid}`;
}

// Get Bunny direct MP4 download URL (720p fallback)
export function getBunnyDownloadUrl(videoGuid: string): string {
  const config = getConfig();
  const hostname = config.BUNNY_STREAM_CDN_HOSTNAME || 'vz-bb8d111e-8eb.b-cdn.net';
  return `https://${hostname}/${videoGuid}/play_720p.mp4`;
}
