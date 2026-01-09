import { getCloudflareContext } from '@/lib/cloudflare';
import { requireRole } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/api-utils';

// Initialize multipart upload
export async function POST(request: Request) {
  try {
    await requireRole(['ADMIN', 'TEACHER']);
    const { fileName, fileType, folder } = await request.json();

    const ctx = getCloudflareContext();
    const bucket = ctx?.STORAGE;
    if (!bucket) {
      return errorResponse('R2 storage not available', 500);
    }

    // Generate unique key
    const id = crypto.randomUUID().replace(/-/g, '');
    const key = `${folder}/${id}-${fileName}`;

    // Create multipart upload
    const multipartUpload = await bucket.createMultipartUpload(key, {
      httpMetadata: {
        contentType: fileType,
      },
      customMetadata: {
        originalName: fileName,
        uploadedAt: new Date().toISOString(),
      },
    });

    return Response.json(successResponse({
      uploadId: multipartUpload.uploadId,
      key: multipartUpload.key,
    }));
  } catch (error: any) {
    console.error('Multipart upload init error:', error);
    return errorResponse(error.message || 'Failed to initialize multipart upload', 500);
  }
}
