// Bunny Stream upload utility — uploads directly from browser to Bunny CDN via TUS protocol.
// This completely bypasses the Cloudflare Worker proxy, removing all size limits (up to 10 GB).
import { apiClient } from '@/lib/api-client';

export interface BunnyUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface BunnyUploadOptions {
  file: File;
  title: string;
  collectionName?: string;        // Class name (subfolder in Bunny Stream)
  parentCollectionName?: string;  // Academy name (top-level folder in Bunny Stream)
  onProgress?: (progress: BunnyUploadProgress) => void;
  signal?: AbortSignal;
}

export interface BunnyUploadResult {
  videoGuid: string;
  title: string;
}

// Encode a string to base64 handling UTF-8 characters (Spanish accents etc.)
function tusBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach(b => { binary += String.fromCharCode(b); });
  return btoa(binary);
}

// TUS auth credentials needed on every PATCH
interface TusAuth {
  tusSignature: string;
  tusExpiry: number;
  tusLibraryId: string;
  videoGuid: string;
}

// Upload one chunk via XHR PATCH (returns a progress-tracked promise)
function uploadChunk(
  location: string,
  chunk: Blob,
  offset: number,
  baseUploaded: number,
  totalSize: number,
  auth: TusAuth,
  onProgress: ((p: BunnyUploadProgress) => void) | undefined,
  signal: AbortSignal | undefined,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PATCH', location);
    xhr.setRequestHeader('Tus-Resumable', '1.0.0');
    xhr.setRequestHeader('Content-Type', 'application/offset+octet-stream');
    xhr.setRequestHeader('Upload-Offset', String(offset));
    // Bunny requires auth headers on every PATCH, not just the initial POST
    xhr.setRequestHeader('AuthorizationSignature', auth.tusSignature);
    xhr.setRequestHeader('AuthorizationExpire', String(auth.tusExpiry));
    xhr.setRequestHeader('VideoId', auth.videoGuid);
    xhr.setRequestHeader('LibraryId', auth.tusLibraryId);
    // Content-Length is a forbidden header — the browser sets it automatically from the body

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress({
          loaded: baseUploaded + event.loaded,
          total: totalSize,
          percentage: ((baseUploaded + event.loaded) / totalSize) * 100,
        });
      }
    };

    xhr.onload = () => {
      if (xhr.status === 204) {
        resolve();
      } else {
        reject(new Error(`Chunk upload failed (HTTP ${xhr.status}): ${xhr.responseText}`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during chunk upload'));
    xhr.onabort = () => reject(new Error('Upload aborted'));

    if (signal) {
      signal.addEventListener('abort', () => xhr.abort(), { once: true });
    }

    xhr.send(chunk);
  });
}

const CHUNK_SIZE = 100 * 1024 * 1024; // 100 MB per chunk

export async function uploadToBunny({
  file,
  title,
  collectionName,
  parentCollectionName,
  onProgress,
  signal,
}: BunnyUploadOptions): Promise<BunnyUploadResult> {
  // Step 1: Create video entry in Bunny Stream (server-side) and get TUS credentials
  const createRes = await apiClient('/bunny/video/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, collectionName, parentCollectionName, fileName: file.name }),
    signal,
  });

  if (!createRes.ok) {
    const error = await createRes.json();
    throw new Error(error.message || 'Failed to create video entry');
  }

  const { data } = await createRes.json();
  const { videoGuid, tusSignature, tusExpiry, tusLibraryId } = data;

  if (!videoGuid) throw new Error('Failed to create video: no videoGuid returned');
  if (!tusSignature) throw new Error('Failed to create video: no TUS credentials returned');

  // Step 2: Create TUS upload directly with Bunny CDN (browser → Bunny, no proxy)
  const metadata = `filetype ${tusBase64(file.type || 'video/mp4')},title ${tusBase64(title)}`;

  const tusCreateRes = await fetch('https://video.bunnycdn.com/tusupload', {
    method: 'POST',
    headers: {
      'AuthorizationSignature': tusSignature,
      'AuthorizationExpire': String(tusExpiry),
      'VideoId': videoGuid,
      'LibraryId': tusLibraryId,
      'Tus-Resumable': '1.0.0',
      'Upload-Length': String(file.size),
      'Upload-Metadata': metadata,
    },
    signal,
  });

  // Bunny returns 201 Created with a Location header for the upload endpoint
  if (tusCreateRes.status !== 201) {
    const body = await tusCreateRes.text();
    throw new Error(`TUS create failed (HTTP ${tusCreateRes.status}): ${body}`);
  }

  const rawLocation = tusCreateRes.headers.get('Location');
  if (!rawLocation) throw new Error('TUS create succeeded but returned no Location header');
  // Bunny may return a relative path like /tusupload/{videoId} — resolve to the full URL
  const location = rawLocation.startsWith('/')
    ? `https://video.bunnycdn.com${rawLocation}`
    : rawLocation;

  // Step 3: Upload file in 100 MB chunks directly to Bunny (completely bypasses our Worker)
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  let uploadedBytes = 0;

  for (let i = 0; i < totalChunks; i++) {
    if (signal?.aborted) throw new Error('Upload aborted');

    const chunkStart = i * CHUNK_SIZE;
    const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, file.size);
    const chunk = file.slice(chunkStart, chunkEnd);

    await uploadChunk(location, chunk, chunkStart, uploadedBytes, file.size, { tusSignature, tusExpiry, tusLibraryId, videoGuid }, onProgress, signal);

    uploadedBytes = chunkEnd;
    // Report 100% for this chunk boundary
    onProgress?.({ loaded: uploadedBytes, total: file.size, percentage: (uploadedBytes / file.size) * 100 });
  }

  return { videoGuid, title };
}
