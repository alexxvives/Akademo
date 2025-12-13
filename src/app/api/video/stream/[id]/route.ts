import { requireAuth } from '@/lib/auth';
import { handleApiError, errorResponse } from '@/lib/api-utils';
import { videoQueries, enrollmentQueries, playStateQueries, uploadQueries } from '@/lib/db';
import { getStorageAdapter } from '@/lib/storage';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireAuth();

    // Get video
    const video = await videoQueries.findById(id) as { uploadId: string; classId: string } | null;
    if (!video) {
      return errorResponse('Video not found', 404);
    }

    // Get the upload info
    const upload = await uploadQueries.findById(video.uploadId) as { storagePath: string; mimeType?: string } | null;
    if (!upload) {
      return errorResponse('Video file not found', 404);
    }

    // Check if user has access (admin, teacher of academy, or enrolled student)
    if (session.role === 'STUDENT') {
      const enrollment = await enrollmentQueries.findByClassAndStudent(video.classId, session.id);
      if (!enrollment) {
        return errorResponse('Not enrolled in this class', 403);
      }
    }

    // Get or create play state
    let playState = await playStateQueries.findByVideoAndStudent(id, session.id);
    if (!playState) {
      await playStateQueries.create(id, session.id);
    }

    // Serve video file from R2
    const storage = getStorageAdapter();
    const object = await storage.getObject(upload.storagePath);
    
    if (!object) {
      return errorResponse('Video file not found in storage', 404);
    }

    const fileSize = object.size;
    const contentType = upload.mimeType || object.contentType || 'video/mp4';
    const range = request.headers.get('range');

    if (range) {
      // Handle range request for seeking
      // For R2, we need to get the full object and slice it
      // In production, you'd want to use R2's range parameter
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;

      // For now, read full body and slice (not ideal but works)
      // A better approach would be to use R2's range option
      const arrayBuffer = await new Response(object.body).arrayBuffer();
      const chunk = arrayBuffer.slice(start, end + 1);

      return new Response(chunk, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize.toString(),
          'Content-Type': contentType,
        },
      });
    } else {
      // Send entire file
      return new Response(object.body, {
        headers: {
          'Content-Length': fileSize.toString(),
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes',
        },
      });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
