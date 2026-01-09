// Bunny Stream API client for video hosting
// Docs: https://docs.bunny.net/reference/video

import { getCloudflareContext } from './cloudflare';

interface BunnyEnv {
  BUNNY_STREAM_LIBRARY_ID: string;
  BUNNY_STREAM_API_KEY: string;
  BUNNY_STREAM_CDN_HOSTNAME: string;
  BUNNY_STREAM_TOKEN_KEY?: string; // For signed URLs
}

function getConfig(): BunnyEnv {
  const ctx = getCloudflareContext();
  return {
    BUNNY_STREAM_LIBRARY_ID: ctx?.BUNNY_STREAM_LIBRARY_ID || process.env.BUNNY_STREAM_LIBRARY_ID || '',
    BUNNY_STREAM_API_KEY: ctx?.BUNNY_STREAM_API_KEY || process.env.BUNNY_STREAM_API_KEY || '',
    BUNNY_STREAM_CDN_HOSTNAME: ctx?.BUNNY_STREAM_CDN_HOSTNAME || process.env.BUNNY_STREAM_CDN_HOSTNAME || '',
    BUNNY_STREAM_TOKEN_KEY: ctx?.BUNNY_STREAM_TOKEN_KEY || process.env.BUNNY_STREAM_TOKEN_KEY || '',
  };
}

const BUNNY_API_BASE = 'https://video.bunnycdn.com';

export interface BunnyVideo {
  guid: string;
  title: string;
  status: number; // 0=created, 1=uploaded, 2=processing, 3=transcoding, 4=finished, 5=error
  thumbnailFileName: string;
  length: number; // Duration in seconds
  width: number;
  height: number;
  views: number;
  availableResolutions: string; // e.g., "360p,480p,720p,1080p"
}

export interface CreateVideoResponse {
  guid: string;
  title: string;
  collectionId: string | null;
}

// Create a new video entry in Bunny Stream (before uploading)
export async function createBunnyVideo(title: string, collectionId?: string): Promise<CreateVideoResponse> {
  const config = getConfig();
  
  const response = await fetch(
    `${BUNNY_API_BASE}/library/${config.BUNNY_STREAM_LIBRARY_ID}/videos`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'AccessKey': config.BUNNY_STREAM_API_KEY,
      },
      body: JSON.stringify({
        title,
        collectionId: collectionId || undefined,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create Bunny video: ${error}`);
  }

  return response.json();
}

// Upload video content to Bunny Stream
export async function uploadToBunnyStream(
  videoGuid: string,
  file: ArrayBuffer | ReadableStream,
  onProgress?: (percent: number) => void
): Promise<void> {
  const config = getConfig();
  
  const response = await fetch(
    `${BUNNY_API_BASE}/library/${config.BUNNY_STREAM_LIBRARY_ID}/videos/${videoGuid}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/octet-stream',
        'AccessKey': config.BUNNY_STREAM_API_KEY,
      },
      body: file,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upload to Bunny Stream: ${error}`);
  }
}

// Get video details from Bunny Stream
export async function getBunnyVideo(videoGuid: string): Promise<BunnyVideo> {
  const config = getConfig();
  
  const response = await fetch(
    `${BUNNY_API_BASE}/library/${config.BUNNY_STREAM_LIBRARY_ID}/videos/${videoGuid}`,
    {
      headers: {
        'AccessKey': config.BUNNY_STREAM_API_KEY,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get Bunny video: ${response.status}`);
  }

  return response.json();
}

// Delete a video from Bunny Stream
export async function deleteBunnyVideo(videoGuid: string): Promise<void> {
  const config = getConfig();
  
  const response = await fetch(
    `${BUNNY_API_BASE}/library/${config.BUNNY_STREAM_LIBRARY_ID}/videos/${videoGuid}`,
    {
      method: 'DELETE',
      headers: {
        'AccessKey': config.BUNNY_STREAM_API_KEY,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to delete Bunny video: ${response.status}`);
  }
}

// Get embed URL for iframe player
export function getBunnyEmbedUrl(videoGuid: string): string {
  const config = getConfig();
  return `https://iframe.mediadelivery.net/embed/${config.BUNNY_STREAM_LIBRARY_ID}/${videoGuid}`;
}

// Generate signed token for Bunny Stream URL
// Based on Bunny CDN documentation: https://docs.bunny.net/docs/cdn-token-authentication
// Format: Base64Encode(SHA256_RAW(token_key + signed_url + expiration + optional_params))
export async function generateBunnyStreamToken(videoGuid: string, expirationSeconds: number = 3600): Promise<{ token: string; expires: number; tokenPath: string }> {
  const config = getConfig();
  const tokenKey = config.BUNNY_STREAM_TOKEN_KEY;
  
  if (!tokenKey) {
    throw new Error('BUNNY_STREAM_TOKEN_KEY is not configured');
  }
  
  const expires = Math.floor(Date.now() / 1000) + expirationSeconds;
  
  // Use token_path to cover all files in the video directory (playlist.m3u8 and .ts segments)
  const tokenPath = `/${videoGuid}/`;
  
  // Build the hashable string: token_key + signed_path + expiration + query_params
  // Query params (except token and expires) must be appended in form-encoded format
  // token_path must NOT be URL encoded in the hash
  const queryParams = `token_path=${tokenPath}`;
  const hashableBase = `${tokenKey}${tokenPath}${expires}${queryParams}`;
  
  // Use Web Crypto API for SHA-256 hashing
  const encoder = new TextEncoder();
  const data = encoder.encode(hashableBase);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  
  // Convert to base64
  let binary = '';
  for (let i = 0; i < hashArray.length; i++) {
    binary += String.fromCharCode(hashArray[i]);
  }
  const base64Hash = globalThis.btoa ? globalThis.btoa(binary) : Buffer.from(binary, 'binary').toString('base64');
  
  // URL-safe base64: replace + with -, / with _, remove =
  const token = base64Hash.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  
  return { token, expires, tokenPath };
}

// Get signed HLS stream URL (for protected videos)
export async function getSignedBunnyStreamUrl(videoGuid: string, expirationSeconds: number = 3600): Promise<string> {
  const config = getConfig();
  
  // If no token key configured, return unsigned URL (for libraries with Direct Play enabled)
  if (!config.BUNNY_STREAM_TOKEN_KEY) {
    return getBunnyStreamUrl(videoGuid);
  }
  
  try {
    const { token, expires, tokenPath } = await generateBunnyStreamToken(videoGuid, expirationSeconds);
    // Query parameter format with token_path for video delivery
    // token_path must be URL encoded in the URL
    const encodedTokenPath = encodeURIComponent(tokenPath);
    return `https://${config.BUNNY_STREAM_CDN_HOSTNAME}/${videoGuid}/playlist.m3u8?token=${token}&expires=${expires}&token_path=${encodedTokenPath}`;
  } catch (error) {
    console.error('Failed to generate signed URL, falling back to unsigned:', error);
    return getBunnyStreamUrl(videoGuid);
  }
}

// Get direct HLS stream URL (unsigned - only works if Direct Play is enabled)
// NOTE: Direct Play must be enabled in Bunny Stream library settings for this to work
export function getBunnyStreamUrl(videoGuid: string): string {
  const config = getConfig();
  return `https://${config.BUNNY_STREAM_CDN_HOSTNAME}/${videoGuid}/playlist.m3u8`;
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

// Video status helpers
export const BunnyVideoStatus = {
  CREATED: 0,
  UPLOADED: 1,
  PROCESSING: 2,
  TRANSCODING: 3,
  FINISHED: 4,
  ERROR: 5,
} as const;

export function isVideoReady(status: number): boolean {
  return status === BunnyVideoStatus.FINISHED;
}

export function getVideoStatusText(status: number): string {
  switch (status) {
    case BunnyVideoStatus.CREATED: return 'Creado';
    case BunnyVideoStatus.UPLOADED: return 'Subido';
    case BunnyVideoStatus.PROCESSING: return 'Procesando';
    case BunnyVideoStatus.TRANSCODING: return 'Transcodificando';
    case BunnyVideoStatus.FINISHED: return 'Listo';
    case BunnyVideoStatus.ERROR: return 'Error';
    default: return 'Desconocido';
  }
}

// ===============================
// BUNNY STREAM LIVE INTEGRATION
// ===============================

export interface BunnyLiveStream {
  id: string;
  name: string;
  rtmpUrl: string;
  rtmpKey: string;
  hlsUrl: string;
  thumbnailUrl?: string;
  status: 'idle' | 'connecting' | 'live' | 'disconnected';
  viewerCount?: number;
  startedAt?: string;
}

// Create a new live stream
export async function createBunnyLiveStream(name: string): Promise<BunnyLiveStream> {
  const config = getConfig();
  const ctx = getCloudflareContext();
  
  // Use live-specific API key if available
  const liveApiKey = ctx?.BUNNY_STREAM_LIVE_API_KEY || process.env.BUNNY_STREAM_LIVE_API_KEY || config.BUNNY_STREAM_API_KEY;
  
  console.log('Creating live stream with library:', config.BUNNY_STREAM_LIBRARY_ID);
  
  const response = await fetch(
    `${BUNNY_API_BASE}/library/${config.BUNNY_STREAM_LIBRARY_ID}/livestreams`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'AccessKey': liveApiKey,
      },
      body: JSON.stringify({ name }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Bunny live stream error:', response.status, error);
    throw new Error(`Failed to create live stream: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return formatLiveStream(data, config.BUNNY_STREAM_CDN_HOSTNAME);
}

// Get all live streams
export async function getBunnyLiveStreams(): Promise<BunnyLiveStream[]> {
  const config = getConfig();
  
  const response = await fetch(
    `${BUNNY_API_BASE}/library/${config.BUNNY_STREAM_LIBRARY_ID}/livestreams`,
    {
      headers: {
        'AccessKey': config.BUNNY_STREAM_API_KEY,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to get live streams');
  }

  const data = await response.json();
  return (data.items || []).map((item: any) => formatLiveStream(item, config.BUNNY_STREAM_CDN_HOSTNAME));
}

// Get a specific live stream
export async function getBunnyLiveStream(streamId: string): Promise<BunnyLiveStream> {
  const config = getConfig();
  
  const response = await fetch(
    `${BUNNY_API_BASE}/library/${config.BUNNY_STREAM_LIBRARY_ID}/livestreams/${streamId}`,
    {
      headers: {
        'AccessKey': config.BUNNY_STREAM_API_KEY,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to get live stream');
  }

  const data = await response.json();
  return formatLiveStream(data, config.BUNNY_STREAM_CDN_HOSTNAME);
}

// Delete a live stream
export async function deleteBunnyLiveStream(streamId: string): Promise<void> {
  const config = getConfig();
  
  const response = await fetch(
    `${BUNNY_API_BASE}/library/${config.BUNNY_STREAM_LIBRARY_ID}/livestreams/${streamId}`,
    {
      method: 'DELETE',
      headers: {
        'AccessKey': config.BUNNY_STREAM_API_KEY,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to delete live stream');
  }
}

function formatLiveStream(data: any, cdnHostname: string): BunnyLiveStream {
  return {
    id: data.id || data.guid,
    name: data.name,
    rtmpUrl: data.rtmpUrl || `rtmp://live.bunnycdn.com/live`,
    rtmpKey: data.streamKey || data.rtmpKey || '',
    hlsUrl: data.hlsUrl || `https://${cdnHostname}/live/${data.id || data.guid}/playlist.m3u8`,
    thumbnailUrl: data.thumbnailUrl,
    status: mapStreamStatus(data.status),
    viewerCount: data.viewerCount || 0,
    startedAt: data.startedAt,
  };
}

function mapStreamStatus(status: number | string): 'idle' | 'connecting' | 'live' | 'disconnected' {
  if (typeof status === 'string') return status as any;
  switch (status) {
    case 0: return 'idle';
    case 1: return 'connecting';
    case 2: return 'live';
    default: return 'disconnected';
  }
}

// Fetch video from external URL (useful for Zoom recordings)
export async function fetchVideoFromUrl(
  sourceUrl: string,
  title: string,
  collectionId?: string
): Promise<{ id: string; guid?: string; title?: string; success: boolean }> {
  const config = getConfig();
  
  const response = await fetch(
    `${BUNNY_API_BASE}/library/${config.BUNNY_STREAM_LIBRARY_ID}/videos/fetch`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'AccessKey': config.BUNNY_STREAM_API_KEY,
      },
      body: JSON.stringify({
        url: sourceUrl,
        title,
        collectionId: collectionId || undefined,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch video from URL: ${error}`);
  }

  return response.json();
}
