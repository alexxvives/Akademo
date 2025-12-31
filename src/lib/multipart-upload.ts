// Chunked multipart upload utility for large files
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
const MAX_CONCURRENT_UPLOADS = 4; // Upload 4 chunks in parallel

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface MultipartUploadOptions {
  file: File;
  folder: string;
  onProgress?: (progress: UploadProgress) => void;
  signal?: AbortSignal;
}

export async function multipartUpload({
  file,
  folder,
  onProgress,
  signal,
}: MultipartUploadOptions): Promise<string> {
  // Step 1: Initialize multipart upload
  const initRes = await fetch('/api/storage/multipart/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
      folder,
    }),
    signal,
  });

  if (!initRes.ok) {
    throw new Error('Failed to initialize upload');
  }

  const { data } = await initRes.json();
  const { uploadId, key } = data;

  // Step 2: Split file into chunks
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const chunks: { partNumber: number; start: number; end: number }[] = [];
  
  for (let i = 0; i < totalChunks; i++) {
    chunks.push({
      partNumber: i + 1, // Part numbers start at 1
      start: i * CHUNK_SIZE,
      end: Math.min((i + 1) * CHUNK_SIZE, file.size),
    });
  }

  // Step 3: Upload chunks in parallel batches
  const uploadedParts: { partNumber: number; etag: string }[] = [];
  let totalUploaded = 0;

  try {
    // Upload chunks in batches for parallelism
    for (let i = 0; i < chunks.length; i += MAX_CONCURRENT_UPLOADS) {
      const batch = chunks.slice(i, i + MAX_CONCURRENT_UPLOADS);
      
      const batchPromises = batch.map(async (chunk) => {
        const blob = file.slice(chunk.start, chunk.end);
        
        const uploadRes = await fetch(
          `/api/storage/multipart/upload-part?key=${encodeURIComponent(key)}&uploadId=${encodeURIComponent(uploadId)}&partNumber=${chunk.partNumber}`,
          {
            method: 'PUT',
            body: blob,
            signal,
          }
        );

        if (!uploadRes.ok) {
          throw new Error(`Failed to upload part ${chunk.partNumber}`);
        }

        const { data } = await uploadRes.json();
        
        // Update progress
        totalUploaded += chunk.end - chunk.start;
        if (onProgress) {
          onProgress({
            loaded: totalUploaded,
            total: file.size,
            percentage: (totalUploaded / file.size) * 100,
          });
        }

        return { partNumber: data.partNumber, etag: data.etag };
      });

      const batchResults = await Promise.all(batchPromises);
      uploadedParts.push(...batchResults);
    }

    // Step 4: Complete multipart upload
    const completeRes = await fetch('/api/storage/multipart/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key,
        uploadId,
        parts: uploadedParts,
      }),
      signal,
    });

    if (!completeRes.ok) {
      throw new Error('Failed to complete upload');
    }

    return key;
  } catch (error) {
    // Abort multipart upload on error
    try {
      await fetch('/api/storage/multipart/abort', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, uploadId }),
      });
    } catch (abortError) {
      console.error('Failed to abort upload:', abortError);
    }
    
    throw error;
  }
}
