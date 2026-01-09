import { getCloudflareContext } from '@/lib/cloudflare';
import { requireRole } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/api-utils';

// Complete multipart upload
export async function POST(request: Request) {
  try {
    await requireRole(['ADMIN', 'TEACHER']);
    const { key, uploadId, parts } = await request.json();

    if (!key || !uploadId || !parts) {
      return errorResponse('Missing required parameters', 400);
    }

    const ctx = getCloudflareContext();
    const bucket = ctx?.STORAGE;
    if (!bucket) {
      return errorResponse('R2 storage not available', 500);
    }

    // Resume the multipart upload and complete it
    const multipartUpload = bucket.resumeMultipartUpload(key, uploadId);
    await multipartUpload.complete(parts);

    return Response.json(successResponse({ key }));
  } catch (error: any) {
    console.error('Multipart upload complete error:', error);
    return errorResponse(error.message || 'Failed to complete multipart upload', 500);
  }
}
