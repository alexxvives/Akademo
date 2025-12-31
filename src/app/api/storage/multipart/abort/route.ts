import { getCloudflareContext } from '@/lib/cloudflare';
import { requireRole } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/api-utils';

// Abort multipart upload
export async function POST(request: Request) {
  try {
    await requireRole(['ADMIN', 'TEACHER']);
    const { key, uploadId } = await request.json();

    if (!key || !uploadId) {
      return errorResponse('Missing required parameters', 400);
    }

    const ctx = getCloudflareContext();
    const bucket = ctx?.STORAGE;
    if (!bucket) {
      return errorResponse('R2 storage not available', 500);
    }

    // Resume the multipart upload and abort it
    const multipartUpload = bucket.resumeMultipartUpload(key, uploadId);
    await multipartUpload.abort();

    return Response.json(successResponse({ message: 'Upload aborted' }));
  } catch (error: any) {
    console.error('Multipart upload abort error:', error);
    return errorResponse(error.message || 'Failed to abort multipart upload', 500);
  }
}
