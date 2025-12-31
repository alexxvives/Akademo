import { getCloudflareContext } from '@/lib/cloudflare';
import { requireRole } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/api-utils';

// Upload a single part
export async function PUT(request: Request) {
  try {
    await requireRole(['ADMIN', 'TEACHER']);
    
    const url = new URL(request.url);
    const key = url.searchParams.get('key');
    const uploadId = url.searchParams.get('uploadId');
    const partNumber = parseInt(url.searchParams.get('partNumber') || '0');

    if (!key || !uploadId || !partNumber) {
      return errorResponse('Missing required parameters', 400);
    }

    const ctx = getCloudflareContext();
    const bucket = ctx?.STORAGE;
    if (!bucket) {
      return errorResponse('R2 storage not available', 500);
    }

    // Get the chunk data
    const arrayBuffer = await request.arrayBuffer();

    // Resume the multipart upload and upload this part
    const multipartUpload = bucket.resumeMultipartUpload(key, uploadId);
    const uploadedPart = await multipartUpload.uploadPart(partNumber, arrayBuffer);

    return Response.json(successResponse({
      partNumber,
      etag: uploadedPart.etag,
    }));
  } catch (error: any) {
    console.error('Multipart upload part error:', error);
    return errorResponse(error.message || 'Failed to upload part', 500);
  }
}
