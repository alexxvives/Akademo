// Bunny Stream upload utility for client-side video uploads
import { apiClient } from '@/lib/api-client';

export interface BunnyUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface BunnyUploadOptions {
  file: File;
  title: string;
  onProgress?: (progress: BunnyUploadProgress) => void;
  signal?: AbortSignal;
}

export interface BunnyUploadResult {
  videoGuid: string;
  title: string;
}

export async function uploadToBunny({
  file,
  title,
  onProgress,
  signal,
}: BunnyUploadOptions): Promise<BunnyUploadResult> {
  // Step 1: Create video entry in Bunny Stream
  const createRes = await apiClient('/bunny/video/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title,
      fileName: file.name,
    }),
    signal,
  });

  if (!createRes.ok) {
    const error = await createRes.json();
    throw new Error(error.message || 'Failed to create video entry');
  }

  const { data } = await createRes.json();
  const { videoGuid } = data;

  // Step 2: Upload video content through our proxy
  // We use XMLHttpRequest for progress tracking
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.open('PUT', `/api/bunny/video/upload?videoGuid=${videoGuid}`);
    
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress({
          loaded: event.loaded,
          total: event.total,
          percentage: (event.loaded / event.total) * 100,
        });
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({
          videoGuid,
          title,
        });
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.onabort = () => reject(new Error('Upload aborted'));

    if (signal) {
      signal.addEventListener('abort', () => xhr.abort());
    }

    xhr.send(file);
  });
}

// Poll for video processing status
export async function waitForVideoReady(
  videoGuid: string,
  onStatus?: (status: string) => void,
  maxAttempts: number = 60,
  intervalMs: number = 5000
): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(`/api/bunny/video/${videoGuid}`);
    if (!res.ok) {
      throw new Error('Failed to check video status');
    }
    
    const { data } = await res.json();
    
    if (onStatus) {
      onStatus(data.statusText);
    }
    
    if (data.isReady) {
      return true;
    }
    
    if (data.status === 5) { // Error status
      throw new Error('Video processing failed');
    }
    
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  
  return false;
}

// Get stream URLs for a video
export async function getBunnyStreamUrls(videoGuid: string) {
  const res = await fetch(`/api/bunny/video/${videoGuid}/stream`);
  if (!res.ok) {
    throw new Error('Failed to get stream URLs');
  }
  const { data } = await res.json();
  return data;
}
