import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth, getSession } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';

// ============ Upload Security ============

const ALLOWED_MIME_TYPES = new Set([
  // Images
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // Video (for small clips; large videos go through Bunny)
  'video/mp4', 'video/webm',
  // Audio
  'audio/mpeg', 'audio/wav', 'audio/ogg',
]);

// Max file sizes by upload type (in bytes)
const MAX_FILE_SIZES: Record<string, number> = {
  avatar: 5 * 1024 * 1024,       // 5 MB
  logo: 5 * 1024 * 1024,         // 5 MB
  document: 25 * 1024 * 1024,    // 25 MB
  assignment: 50 * 1024 * 1024,  // 50 MB
  uploads: 50 * 1024 * 1024,     // 50 MB (default)
};
const DEFAULT_MAX_SIZE = 50 * 1024 * 1024; // 50 MB

/** Sanitize a file name: remove path traversal, null bytes, control chars */
function sanitizeFileName(name: string): string {
  return name
    .replace(/\0/g, '')           // null bytes
    .replace(/\.\./g, '')         // path traversal
    .replace(/[/\\]/g, '_')       // directory separators
    .replace(/[<>:"|?*]/g, '_')   // Windows-invalid chars
    .replace(/[\x00-\x1f]/g, '')  // control characters
    .slice(0, 255);               // max length
}

/** Sanitize a storage path: allow only alphanumeric, hyphens, underscores, dots, slashes */
function sanitizePath(p: string): string {
  return p
    .replace(/\0/g, '')
    .replace(/\.\.\//g, '')       // path traversal
    .replace(/\.\.\\/g, '')
    .replace(/^\/+/, '')          // leading slashes
    .replace(/[^a-zA-Z0-9\-_./]/g, '_')
    .slice(0, 500);
}

const storage = new Hono<{ Bindings: Bindings }>();

// POST /storage/upload - Simple file upload (for small files like logos)
storage.post('/upload', async (c) => {
  try {
    // Try to get session - catch error for better message
    let session;
    try {
      session = await requireAuth(c);
    } catch (error) {
      console.error('[Upload] Auth error:', error);
      return c.json(errorResponse('Error de autenticación. Intenta cerrar sesión y volver a iniciar.'), 401);
    }
    
    // Allow STUDENT for assignment submissions
    if (!['ADMIN', 'TEACHER', 'ACADEMY', 'STUDENT'].includes(session.role)) {
      console.error('[Upload] Role not authorized:', session.role);
      return c.json(errorResponse('Tu rol no tiene permiso para subir archivos'), 403);
    }
    
    const formData = await c.req.formData();
    const file = formData.get('file') as unknown as File | null;
    const type = formData.get('type') as string; // 'assignment', 'document', 'avatar', etc.
    const customPath = formData.get('path') as string | null; // Optional custom path

    if (!file) {
      return c.json(errorResponse('file is required'), 400);
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return c.json(errorResponse(`Tipo de archivo no permitido: ${file.type}`), 400);
    }

    // Validate file size
    const maxSize = MAX_FILE_SIZES[type] || DEFAULT_MAX_SIZE;
    if (file.size > maxSize) {
      const maxMB = Math.round(maxSize / (1024 * 1024));
      return c.json(errorResponse(`El archivo excede el tamaño máximo de ${maxMB} MB`), 400);
    }

    // Sanitize file name and path
    const safeName = sanitizeFileName(file.name);
    const id = crypto.randomUUID().replace(/-/g, '');
    const folder = type || 'uploads';
    const path = customPath ? sanitizePath(customPath) : `${folder}/${id}-${safeName}`;

    // Read file as ArrayBuffer
    const fileData = await file.arrayBuffer();

    // Upload to R2
    await c.env.STORAGE.put(path, fileData, {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata: {
        originalName: safeName,
        uploadedAt: new Date().toISOString(),
        uploadedBy: session.id,
      },
    });

    // Create Upload record in DB
    const { nanoid } = await import('nanoid');
    const uploadId = nanoid();

    await c.env.DB.prepare(`
      INSERT INTO Upload (id, fileName, fileSize, mimeType, storagePath, uploadedById, storageType)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      uploadId,
      safeName,
      file.size,
      file.type,
      path,
      session.id,
      'r2'
    ).run();

    return c.json(successResponse({
      uploadId,
      path,
      fileName: safeName,
      fileSize: file.size,
      message: 'File uploaded successfully',
    }));
  } catch (error: any) {
    console.error('[Simple Upload] Error:', error);
    return c.json(errorResponse('Failed to upload file'), 500);
  }
});

// GET /storage/upload/:id - Get upload metadata
storage.get('/upload/:id', async (c) => {
  try {
    const uploadId = c.req.param('id');
    
    if (!uploadId) {
      return c.json(errorResponse('Upload ID required'), 400);
    }

    const upload = await c.env.DB.prepare(`
      SELECT id, fileName, fileSize, mimeType, storagePath, storageType, uploadedById, createdAt
      FROM Upload
      WHERE id = ?
    `).bind(uploadId).first();

    if (!upload) {
      return c.json(errorResponse('Upload not found'), 404);
    }

    return c.json(successResponse(upload));
  } catch (error: any) {
    console.error('[Get Upload] Error:', error);
    return c.json(errorResponse('Failed to fetch upload'), 500);
  }
});

// POST /storage/multipart/init - Initialize multipart upload
storage.post('/multipart/init', async (c) => {
  try {
    const session = await requireAuth(c);

    if (!['ADMIN', 'TEACHER', 'ACADEMY'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const { fileName, fileType, folder } = await c.req.json();

    if (!fileName || !fileType || !folder) {
      return c.json(errorResponse('fileName, fileType, and folder required'), 400);
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.has(fileType)) {
      return c.json(errorResponse(`Tipo de archivo no permitido: ${fileType}`), 400);
    }

    // Generate unique key with sanitized file name
    const safeName = sanitizeFileName(fileName);
    const id = crypto.randomUUID().replace(/-/g, '');
    const key = `${sanitizePath(folder)}/${id}-${safeName}`;

    // Create multipart upload
    const multipartUpload = await c.env.STORAGE.createMultipartUpload(key, {
      httpMetadata: {
        contentType: fileType,
      },
      customMetadata: {
        originalName: safeName,
        uploadedAt: new Date().toISOString(),
      },
    });

    return c.json(successResponse({
      uploadId: multipartUpload.uploadId,
      key: multipartUpload.key,
    }));
  } catch (error: any) {
    console.error('[Multipart Init] Error:', error);
    return c.json(errorResponse('Failed to init upload'), 500);
  }
});

// PUT /storage/multipart/upload-part - Upload part
storage.put('/multipart/upload-part', async (c) => {
  try {
    const session = await requireAuth(c);

    if (!['ADMIN', 'TEACHER', 'ACADEMY'].includes(session.role)) {
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
    
    // Get multipart upload instance
    let multipartUpload;
    try {
      multipartUpload = c.env.STORAGE.resumeMultipartUpload(key, uploadId);
    } catch (e: any) {
      console.error('[Upload Part] Failed to resume multipart upload:', e);
       return c.json(errorResponse('Failed to resume multipart upload'), 500);
    }
    
    // Upload the part
    let uploadedPart;
    try {
      uploadedPart = await multipartUpload.uploadPart(partNumber, fileData);
    } catch (e: any) {
       console.error(`[Upload Part] R2 uploadPart failed. key='${key}' uploadId='${uploadId}' part=${partNumber}`, e);
       return c.json(errorResponse('Failed to upload part to storage'), 500);
    }

    return c.json(successResponse({
      partNumber,
      etag: uploadedPart.etag,
    }));
  } catch (error: any) {
    console.error('[Upload Part] Critical Error:', error);
    return c.json(errorResponse('Failed to upload part'), 500);
  }
});

// POST /storage/multipart/complete - Complete upload
storage.post('/multipart/complete', async (c) => {
  try {
    const session = await requireAuth(c);

    if (!['ADMIN', 'TEACHER', 'ACADEMY'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const { uploadId, key, parts } = await c.req.json();

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
    return c.json(errorResponse('Failed to complete upload'), 500);
  }
});

// POST /storage/multipart/abort - Abort upload
storage.post('/multipart/abort', async (c) => {
  try {
    const session = await requireAuth(c);

    if (!['ADMIN', 'TEACHER', 'ACADEMY'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const { uploadId, key } = await c.req.json();
    
    if (!uploadId || !key) {
      return c.json(errorResponse('uploadId and key required'), 400);
    }

    const multipartUpload = c.env.STORAGE.resumeMultipartUpload(key, uploadId);
    await multipartUpload.abort();

    return c.json(successResponse({ message: 'Upload aborted' }));
  } catch (error: any) {
    console.error('[Abort Upload] Error:', error);
    return c.json(errorResponse('Failed to abort upload'), 500);
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

    if (!key || key === 'undefined' || key === 'null') {
      console.error('[Serve File] Invalid key:', key);
      return c.json(errorResponse('Invalid file path'), 400);
    }

    const object = await c.env.STORAGE.get(key);

    if (!object) {
      // Try raw key as fallback just in case
      const rawObject = await c.env.STORAGE.get(rawKey);
      if (rawObject) {
         return new Response(rawObject.body, {
          headers: {
            'Content-Type': rawObject.httpMetadata?.contentType || 'application/octet-stream',
            'Content-Length': rawObject.size.toString(),
            'Cache-Control': 'public, max-age=31536000',
          },
        });
      }
      console.error('[Serve File] File not found in R2. Key:', key);
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
    return c.json(errorResponse('Failed to serve file'), 500);
  }
});

export default storage;
