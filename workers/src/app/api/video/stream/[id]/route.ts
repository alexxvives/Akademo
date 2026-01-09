import { requireAuth } from '@/lib/auth';
import { handleApiError, errorResponse, successResponse } from '@/lib/api-utils';
import { videoQueries, enrollmentQueries, playStateQueries } from '@/lib/db';
import { getStorageAdapter } from '@/lib/storage';
import { getCloudflareContext } from '@/lib/cloudflare';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireAuth();

    // Get video with details (includes classId from Lesson join and storage info)
    const video = await videoQueries.findWithDetails(id) as { 
      uploadId: string; 
      lessonId: string;
      classId: string | null; 
      storagePath: string;
      storageType?: string;
      bunnyGuid?: string;
      mimeType?: string;
    } | null;
    
    console.log('[Video Stream] Video lookup:', { id, found: !!video, lessonId: video?.lessonId, classId: video?.classId, storageType: video?.storageType });
    
    if (!video) {
      return errorResponse('Video not found', 404);
    }

    // Check if user has access (admin, teacher of academy, or enrolled student)
    if (session.role === 'STUDENT') {
      // Ensure video has a valid classId (from Lesson)
      if (!video.classId) {
        console.log('[Video Stream] Video has no classId:', { videoId: id, lessonId: video.lessonId });
        return errorResponse('Video is not associated with a class', 400);
      }
      const enrollment = await enrollmentQueries.findByClassAndStudent(video.classId, session.id);
      if (!enrollment) {
        return errorResponse('Not enrolled in this class', 403);
      }
    }

    // Get or create play state (only for students)
    if (session.role === 'STUDENT') {
      let playState = await playStateQueries.findByVideoAndStudent(id, session.id) as any;
      if (!playState) {
        await playStateQueries.create(id, session.id);
      } else if (playState.status === 'BLOCKED') {
        return errorResponse('Video access blocked - watch time limit reached', 403);
      }
    }

    // If video is on Bunny Stream, redirect to Bunny's embed/stream URL
    if (video.storageType === 'bunny' && video.bunnyGuid) {
      const ctx = getCloudflareContext();
      const libraryId = ctx?.BUNNY_STREAM_LIBRARY_ID || '571240';
      const cdnHostname = ctx?.BUNNY_STREAM_CDN_HOSTNAME || 'vz-bb8d111e-8eb.b-cdn.net';
      
      // Return stream URLs for client to use
      return Response.json(successResponse({
        type: 'bunny',
        embedUrl: `https://iframe.mediadelivery.net/embed/${libraryId}/${video.bunnyGuid}`,
        hlsUrl: `https://${cdnHostname}/${video.bunnyGuid}/playlist.m3u8`,
        thumbnailUrl: `https://${cdnHostname}/${video.bunnyGuid}/thumbnail.jpg`,
      }));
    }

    // First get the file metadata to know the size (without downloading body)
    const storage = getStorageAdapter();
    const metadata = await storage.getMetadata(video.storagePath);
    
    if (!metadata) {
      return errorResponse('Video file not found in storage', 404);
    }

    const fileSize = metadata.size;
    const contentType = video.mimeType || metadata.contentType || 'video/mp4';
    const range = request.headers.get('range');

    if (range) {
      // Handle range request for seeking using R2 native range support
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      
      // Use smaller chunks for initial load (512KB) for faster startup
      // Larger chunks (2MB) for subsequent requests
      const isInitialLoad = start === 0;
      const maxChunkSize = isInitialLoad ? 512 * 1024 : 2 * 1024 * 1024; // 512KB or 2MB
      const requestedEnd = parts[1] ? parseInt(parts[1], 10) : start + maxChunkSize - 1;
      const end = Math.min(requestedEnd, fileSize - 1, start + maxChunkSize - 1);
      const chunksize = end - start + 1;

      // Use R2's native range request
      const rangedObject = await storage.getObjectWithRange(video.storagePath, {
        offset: start,
        length: chunksize
      });

      if (!rangedObject) {
        return errorResponse('Failed to fetch video chunk', 500);
      }

      return new Response(rangedObject.body, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize.toString(),
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Expose-Headers': 'Content-Range, Accept-Ranges, Content-Length',
        },
      });
    } else {
      // For non-range requests, stream the full file
      const fullObject = await storage.getObject(video.storagePath);
      if (!fullObject) {
        return errorResponse('Video file not found in storage', 404);
      }
      
      return new Response(fullObject.body, {
        headers: {
          'Content-Length': fileSize.toString(),
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
