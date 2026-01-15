import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';

const storage = new Hono<{ Bindings: Bindings }>();

// POST /storage/multipart/init - Initialize multipart upload
storage.post('/multipart/init', async (c) => {
  try {
    const session = await requireAuth(c);

    if (!['ADMIN', 'TEACHER'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const { fileName, fileType, folder } = await c.req.json();

    if (!fileName || !fileType || !folder) {
      return c.json(errorResponse('fileName, fileType, and folder required'), 400);
    }

    // Generate unique key
    const id = crypto.randomUUID().replace(/-/g, '');
    const key = `${folder}/${id}-${fileName}`;

    // Create multipart upload
    const multipartUpload = await c.env.STORAGE.createMultipartUpload(key, {
      httpMetadata: {
        contentType: fileType,
      },
      customMetadata: {
        originalName: fileName,
        uploadedAt: new Date().toISOString(),
      },
    });

    return c.json(successResponse({
      uploadId: multipartUpload.uploadId,
      key: multipartUpload.key,
    }));
  } catch (error: any) {
    console.error('[Multipart Init] Error:', error);
    return c.json(errorResponse(error.message || 'Failed to init upload'), 500);
  }
});

// PUT /storage/multipart/upload-part - Upload part
storage.put('/multipart/upload-part', async (c) => {
  try {
    const session = await requireAuth(c);

    if (!['ADMIN', 'TEACHER'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const uploadId = c.req.query('uploadId');
    const key = c.req.query('key');
    const partNumber = parseInt(c.req.query('partNumber') || '0');

    if (!uploadId || !key || !partNumber) {
      return c.json(errorResponse('uploadId, key, and partNumber required'), 400);
    }

    // Get file data from request body
    let fileData: ArrayBuffer;
    try {
      fileData = await c.req.arrayBuffer();
    } catch (e: any) {
      console.error('[Upload Part] Failed to read request body:', e);
      return c.json(errorResponse('Failed to read request body'), 400);
    }
    
    console.log(`[Upload Part] key='${key}', uploadId='${uploadId}', partNumber=${partNumber}, size=${fileData.byteLength}`);

    // Get multipart upload instance
    let multipartUpload;
    try {
      multipartUpload = c.env.STORAGE.resumeMultipartUpload(key, uploadId);
    } catch (e: any) {
      console.error('[Upload Part] Failed to resume multipart upload:', e);
       return c.json(errorResponse(`Failed to resume multipart upload: ${e.message}`), 500);
    }
    
    // Upload the part
    let uploadedPart;
    try {
      uploadedPart = await multipartUpload.uploadPart(partNumber, fileData);
    } catch (e: any) {
       console.error(`[Upload Part] R2 uploadPart failed. key='${key}' uploadId='${uploadId}' part=${partNumber}`, e);
       return c.json(errorResponse(`R2 uploadPart failed: ${e.message}`), 500);
    }

    console.log('[Upload Part] Success, etag:', uploadedPart.etag);

    return c.json(successResponse({
      partNumber,
      etag: uploadedPart.etag,
    }));
  } catch (error: any) {
    console.error('[Upload Part] Critical Error:', error);
    if (error.message === 'Unauthorized') {
        return c.json(errorResponse('Unauthorized'), 401);
    }
    return c.json(errorResponse(error.message || 'Failed to upload part'), 500);
  }
});

// POST /storage/multipart/complete - Complete upload
storage.post('/multipart/complete', async (c) => {
  try {
    const session = await requireAuth(c);

    if (!['ADMIN', 'TEACHER'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const { uploadId, key, parts } = await c.req.json();

    console.log(`[Complete Upload] key=${key}, uploadId=${uploadId}, parts=${parts?.length}`);

    if (!uploadId || !key || !parts) {
      return c.json(errorResponse('uploadId, key, and parts required'), 400);
    }

    const multipartUpload = c.env.STORAGE.resumeMultipartUpload(key, uploadId);
    await multipartUpload.complete(parts);

    return c.json(successResponse({
      key,
      message: 'Upload complete',
    }));
  } catch (error: any) {
    console.error('[Complete Upload] Error:', error);
    return c.json(errorResponse(error.message || 'Failed to complete upload'), 500);
  }
});

// POST /storage/multipart/abort - Abort upload
storage.post('/multipart/abort', async (c) => {
  try {
    const session = await requireAuth(c);

    if (!['ADMIN', 'TEACHER'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const { uploadId, key } = await c.req.json();
    
    console.log(`[Abort Upload] key=${key}, uploadId=${uploadId}`);

    if (!uploadId || !key) {
      return c.json(errorResponse('uploadId and key required'), 400);
    }

    const multipartUpload = c.env.STORAGE.resumeMultipartUpload(key, uploadId);
    await multipartUpload.abort();

    return c.json(successResponse({ message: 'Upload aborted' }));
  } catch (error: any) {
    console.error('[Abort Upload] Error:', error);
    return c.json(errorResponse(error.message || 'Failed to abort upload'), 500);
  }
});

// GET /storage/serve/:key - Serve file from R2
storage.get('/serve/*', async (c) => {
  try {
    // No auth required for serving files - they're accessed via direct links
    
    // Extract path from URL directly instead of using param()
    const url = new URL(c.req.url);
    const basePath = '/storage/serve/';
    
    if (!url.pathname.startsWith(basePath)) {
      console.error('[Serve File] Invalid path:', url.pathname);
      return c.json(errorResponse('Invalid path'), 400);
    }
    
    // Get everything after /storage/serve/
    const rawKey = url.pathname.slice(basePath.length);
    
    if (!rawKey) {
      console.error('[Serve File] No key provided in URL');
      return c.json(errorResponse('No file path provided'), 400);
    }
    
    const key = decodeURIComponent(rawKey); // Handle encoded characters

    console.log('[Serve File] rawKey:', rawKey);
    console.log('[Serve File] decodedKey:', key);
    console.log('[Serve File] Full URL:', c.req.url);

    if (!key || key === 'undefined' || key === 'null') {
      console.error('[Serve File] Invalid key:', key);
      return c.json(errorResponse(`Invalid file path: ${key}`), 400);
    }

    const object = await c.env.STORAGE.get(key);

    if (!object) {
      console.log('[Serve File] Object not found with decoded key:', key);
      // Try raw key as fallback just in case
      const rawObject = await c.env.STORAGE.get(rawKey);
      if (rawObject) {
        console.log('[Serve File] Found with raw key:', rawKey);
         return new Response(rawObject.body, {
          headers: {
            'Content-Type': rawObject.httpMetadata?.contentType || 'application/octet-stream',
            'Content-Length': rawObject.size.toString(),
            'Cache-Control': 'public, max-age=31536000',
          },
        });
      }
      console.error('[Serve File] File not found in R2. Key:', key, 'RawKey:', rawKey);
      return c.json(errorResponse(`File not found: ${key}`), 404);
    }

    console.log('[Serve File] Successfully serving:', key, 'Size:', object.size);
    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
        'Content-Length': object.size.toString(),
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error: any) {
    console.error('[Serve File] Error:', error);
    return c.json(errorResponse(error.message || 'Failed to serve file'), 500);
  }
});

export default storage;
