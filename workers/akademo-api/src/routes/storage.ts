import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth, getSession } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';
import { isPaymentOverdue } from '../lib/payment-utils';

// ============ Upload Security ============

const ALLOWED_MIME_TYPES = new Set([
  // Images (SVG excluded — stored XSS vector)
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
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

/**
 * Magic byte signatures for common file types.
 * Used to verify that the file content matches its declared Content-Type.
 * Prevents Content-Type spoofing (e.g., uploading HTML as image/jpeg).
 */
const MAGIC_BYTES: { mimeType: string; bytes: number[] }[] = [
  { mimeType: 'image/jpeg', bytes: [0xFF, 0xD8, 0xFF] },
  { mimeType: 'image/png', bytes: [0x89, 0x50, 0x4E, 0x47] },
  { mimeType: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38] },
  { mimeType: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF header
  { mimeType: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { mimeType: 'video/mp4', bytes: [] }, // MP4 uses ftyp box at offset 4 — checked separately
  { mimeType: 'video/webm', bytes: [0x1A, 0x45, 0xDF, 0xA3] },
];

/** Verify file content matches declared MIME type using magic bytes */
function verifyMagicBytes(data: ArrayBuffer, declaredMime: string): boolean {
  const header = new Uint8Array(data.slice(0, 12));

  // Special case: MP4 uses 'ftyp' box at offset 4
  if (declaredMime === 'video/mp4') {
    return header.length >= 8
      && header[4] === 0x66 && header[5] === 0x74 && header[6] === 0x79 && header[7] === 0x70;
  }

  const match = MAGIC_BYTES.find(m => m.mimeType === declaredMime);
  if (!match || match.bytes.length === 0) {
    // No magic bytes defined for this type — allow (e.g., office docs, audio)
    return true;
  }

  if (header.length < match.bytes.length) return false;
  return match.bytes.every((b, i) => header[i] === b);
}

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
      if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
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

    // SECURITY: Validate upload path based on user role
    // Students can only upload to assignment/ and avatar/ paths
    if (session.role === 'STUDENT') {
      const allowedStudentPrefixes = ['assignment/', 'avatar/', 'assignment_submission/'];
      if (!allowedStudentPrefixes.some(prefix => path.startsWith(prefix))) {
        return c.json(errorResponse('Students can only upload assignments and avatars'), 403);
      }
    }

    // Read file as ArrayBuffer
    const fileData = await file.arrayBuffer();

    // Verify file content matches declared MIME type (magic byte check)
    if (!verifyMagicBytes(fileData, file.type)) {
      return c.json(errorResponse(`El contenido del archivo no coincide con el tipo declarado (${file.type}). Archivo rechazado.`), 400);
    }

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
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Simple Upload] Error:', error);
    return c.json(errorResponse('Failed to upload file'), 500);
  }
});

// GET /storage/upload/:id - Get upload metadata
storage.get('/upload/:id', async (c) => {
  try {
    const session = await requireAuth(c);
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
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
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
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
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
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
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
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
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
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Abort Upload] Error:', error);
    return c.json(errorResponse('Failed to abort upload'), 500);
  }
});

// GET /storage/serve/:key - Serve file from R2
// Requires either: (1) valid session cookie, or (2) signed token query param for public assets (logos, avatars)
storage.get('/serve/*', async (c) => {
  try {
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

    // Public folders — logos and avatars are public-facing assets (shown on unauthenticated
    // join pages, landing pages, etc.). No token or session required.
    const publicFolders = ['logo/', 'avatar/', 'academy-logo/', 'academy-logos/'];
    const isPublicAsset = publicFolders.some(folder => key.startsWith(folder));

    if (isPublicAsset) {
      // No auth needed — fall through to serve the file below
    } else {
      // Private assets: require authenticated session + ownership verification
      const session = await getSession(c);
      if (!session) {
        return c.json(errorResponse('Authentication required'), 401);
      }

      // ADMIN can access everything
      if (session.role !== 'ADMIN') {
        // For assignment/ and document/ paths, verify the user has a relationship to the file
        const isAssignment = key.startsWith('assignment/');
        const isDocument = key.startsWith('document/') || key.startsWith('documents/');

        if (isAssignment || isDocument) {
          // Check if user uploaded this file
          const upload = await c.env.DB.prepare(
            'SELECT id, uploadedById, storagePath FROM Upload WHERE storagePath = ?'
          ).bind(key).first() as { id: string; uploadedById: string; storagePath: string } | null;

          if (upload) {
            const isUploader = upload.uploadedById === session.id;
            if (!isUploader) {
              // Not the uploader — check if user belongs to the same academy/class
              // Find the class this file belongs to via lesson/video/document relationships
              let hasAccess = false;

              if (session.role === 'STUDENT') {
                // Student must be enrolled in a class that uses this file
                // Check 1: lesson video/document access
                const enrollment = await c.env.DB.prepare(`
                  SELECT e.id, e.classId FROM ClassEnrollment e
                  JOIN Lesson l ON l.classId = e.classId
                  LEFT JOIN Video v ON v.lessonId = l.id AND v.uploadId = ?
                  LEFT JOIN Document d ON d.lessonId = l.id AND d.uploadId = ?
                  WHERE e.userId = ? AND e.status = 'APPROVED' AND (v.id IS NOT NULL OR d.id IS NOT NULL)
                  LIMIT 1
                `).bind(upload.id, upload.id, session.id).first() as { id: string; classId: string } | null;
                hasAccess = !!enrollment;

                // Check 2: assignment attachment access (teacher's files on assignments)
                if (!hasAccess) {
                  const assignmentEnrollment = await c.env.DB.prepare(`
                    SELECT e.id, e.classId FROM ClassEnrollment e
                    JOIN Assignment a ON a.classId = e.classId
                    JOIN AssignmentAttachment aa ON aa.assignmentId = a.id AND aa.uploadId = ?
                    WHERE e.userId = ? AND e.status = 'APPROVED'
                    LIMIT 1
                  `).bind(upload.id, session.id).first() as { id: string; classId: string } | null;
                  hasAccess = !!assignmentEnrollment;
                  if (!hasAccess) {
                    // Check legacy Assignment.uploadId
                    const legacyEnrollment = await c.env.DB.prepare(`
                      SELECT e.id, e.classId FROM ClassEnrollment e
                      JOIN Assignment a ON a.classId = e.classId AND a.uploadId = ?
                      WHERE e.userId = ? AND e.status = 'APPROVED'
                      LIMIT 1
                    `).bind(upload.id, session.id).first() as { id: string; classId: string } | null;
                    hasAccess = !!legacyEnrollment;
                  }
                }

                // Block overdue students from downloading documents/assignments
                if (hasAccess) {
                  const classIdToCheck = enrollment?.classId || (upload.storagePath.startsWith('assignment/') ? upload.storagePath : null);
                  if (classIdToCheck && enrollment && await isPaymentOverdue(c.env.DB, session.id, enrollment.classId)) {
                    return c.json(errorResponse('Acceso bloqueado por pago pendiente.'), 403);
                  }
                }
              } else if (session.role === 'TEACHER') {
                // Teacher must be assigned to the class (via lesson/video/doc or assignment)
                const classAccess = await c.env.DB.prepare(`
                  SELECT c.id FROM Class c
                  JOIN Lesson l ON l.classId = c.id
                  LEFT JOIN Video v ON v.lessonId = l.id AND v.uploadId = ?
                  LEFT JOIN Document d ON d.lessonId = l.id AND d.uploadId = ?
                  WHERE c.teacherId = ? AND (v.id IS NOT NULL OR d.id IS NOT NULL)
                  LIMIT 1
                `).bind(upload.id, upload.id, session.id).first();
                hasAccess = !!classAccess;
                if (!hasAccess) {
                  // Check assignment attachment access
                  const assignmentAccess = await c.env.DB.prepare(`
                    SELECT c.id FROM Class c
                    JOIN Assignment a ON a.classId = c.id
                    JOIN AssignmentAttachment aa ON aa.assignmentId = a.id AND aa.uploadId = ?
                    WHERE c.teacherId = ?
                    LIMIT 1
                  `).bind(upload.id, session.id).first();
                  hasAccess = !!assignmentAccess;
                }
                if (!hasAccess) {
                  // Check student submission access (teacher of the class)
                  const submissionAccess = await c.env.DB.prepare(`
                    SELECT c.id FROM Class c
                    JOIN Assignment a ON a.classId = c.id
                    JOIN AssignmentSubmission s ON s.assignmentId = a.id AND s.uploadId = ?
                    WHERE c.teacherId = ?
                    LIMIT 1
                  `).bind(upload.id, session.id).first();
                  hasAccess = !!submissionAccess;
                }
              } else if (session.role === 'ACADEMY') {
                // Academy owner must own the academy that the class belongs to
                const academyAccess = await c.env.DB.prepare(`
                  SELECT c.id FROM Class c
                  JOIN Academy a ON c.academyId = a.id
                  JOIN Lesson l ON l.classId = c.id
                  LEFT JOIN Video v ON v.lessonId = l.id AND v.uploadId = ?
                  LEFT JOIN Document d ON d.lessonId = l.id AND d.uploadId = ?
                  WHERE a.ownerId = ? AND (v.id IS NOT NULL OR d.id IS NOT NULL)
                  LIMIT 1
                `).bind(upload.id, upload.id, session.id).first();
                hasAccess = !!academyAccess;
                if (!hasAccess) {
                  // Check assignment attachment access
                  const assignmentAccess = await c.env.DB.prepare(`
                    SELECT c.id FROM Class c
                    JOIN Academy ac ON c.academyId = ac.id
                    JOIN Assignment a ON a.classId = c.id
                    JOIN AssignmentAttachment aa ON aa.assignmentId = a.id AND aa.uploadId = ?
                    WHERE ac.ownerId = ?
                    LIMIT 1
                  `).bind(upload.id, session.id).first();
                  hasAccess = !!assignmentAccess;
                }
              }

              if (!hasAccess) {
                return c.json(errorResponse('Forbidden'), 403);
              }
            }
          }
          // No Upload record found — deny access (no backward-compat fallback)
          if (!upload) {
            return c.json(errorResponse('Forbidden'), 403);
          }
        }
      }
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
            'Cache-Control': isPublicAsset ? 'public, max-age=31536000, immutable' : 'private, max-age=3600',
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
        'Cache-Control': isPublicAsset ? 'public, max-age=31536000, immutable' : 'private, max-age=3600',
      },
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Serve File] Error:', error);
    return c.json(errorResponse('Failed to serve file'), 500);
  }
});

// GET /storage/signed-url - Generate a signed URL for a public asset
storage.get('/signed-url', async (c) => {
  try {
    await requireAuth(c);
    const key = c.req.query('key');
    if (!key) {
      return c.json(errorResponse('key query parameter required'), 400);
    }
    const expires = Math.floor(Date.now() / 1000) + 86400; // 24 hours
    const secret = (c.env as unknown as Record<string, unknown>).SESSION_SECRET as string;
    if (!secret) {
      return c.json(errorResponse('Server configuration error'), 500);
    }
    const encoder = new TextEncoder();
    const hmacKey = await crypto.subtle.importKey(
      'raw', encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', hmacKey, encoder.encode(`${key}:${expires}`));
    const token = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');

    return c.json(successResponse({ token, expires }));
  } catch (error: unknown) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Signed URL] Error:', error);
    return c.json(errorResponse('Failed to generate signed URL'), 500);
  }
});

export default storage;
