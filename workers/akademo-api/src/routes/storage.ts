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

// POST /storage/multipart/upload-part - Upload part
storage.post('/multipart/upload-part', async (c) => {
  try {
    const session = await requireAuth(c);

    if (!['ADMIN', 'TEACHER'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const { uploadId, key, partNumber } = await c.req.json();

    if (!uploadId || !key || !partNumber) {
      return c.json(errorResponse('uploadId, key, and partNumber required'), 400);
    }

    // Get file data from request body
    const fileData = await c.req.arrayBuffer();

    const uploadedPart = await c.env.STORAGE.uploadPart(key, uploadId, partNumber, fileData);

    return c.json(successResponse({
      partNumber,
      etag: uploadedPart.etag,
    }));
  } catch (error: any) {
    console.error('[Upload Part] Error:', error);
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

    if (!uploadId || !key || !parts) {
      return c.json(errorResponse('uploadId, key, and parts required'), 400);
    }

    await c.env.STORAGE.completeMultipartUpload(key, uploadId, parts);

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

    if (!uploadId || !key) {
      return c.json(errorResponse('uploadId and key required'), 400);
    }

    await c.env.STORAGE.abortMultipartUpload(key, uploadId);

    return c.json(successResponse({ message: 'Upload aborted' }));
  } catch (error: any) {
    console.error('[Abort Upload] Error:', error);
    return c.json(errorResponse(error.message || 'Failed to abort upload'), 500);
  }
});

// GET /storage/serve/:key - Serve file from R2
storage.get('/serve/*', async (c) => {
  try {
    const session = await requireAuth(c);
    const key = c.req.param('*'); // Gets everything after /serve/

    const object = await c.env.STORAGE.get(key);

    if (!object) {
      return c.json(errorResponse('File not found'), 404);
    }

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
