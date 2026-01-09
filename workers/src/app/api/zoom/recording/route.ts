import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getDB, generateId } from '@/lib/db';
import { handleApiError, successResponse, errorResponse } from '@/lib/api-utils';
import { getZoomRecordingDownloadUrl } from '@/lib/zoom';
import { fetchVideoFromUrl } from '@/lib/bunny-stream';

// Manually fetch and process a Zoom recording for a stream
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['TEACHER', 'ACADEMY', 'ADMIN']);
    const db = await getDB();
    
    const { streamId } = await request.json();
    
    if (!streamId) {
      return errorResponse('Stream ID required', 400);
    }

    // Get the stream with zoom meeting info
    const stream = await db.prepare(`
      SELECT ls.*, c.academyId, a.ownerId
      FROM LiveStream ls
      JOIN Class c ON c.id = ls.classId
      LEFT JOIN Academy a ON c.academyId = a.id
      WHERE ls.id = ?
    `).bind(streamId).first() as any;

    if (!stream) {
      return errorResponse('Stream not found', 404);
    }

    // Check authorization
    const isTeacher = stream.teacherId === user.id;
    const isAcademyOwner = stream.ownerId === user.id;
    const isAdmin = user.role === 'ADMIN';
    
    if (!isTeacher && !isAcademyOwner && !isAdmin) {
      return errorResponse('Not authorized', 403);
    }

    if (!stream.zoomMeetingId) {
      return errorResponse('No Zoom meeting ID found for this stream', 400);
    }

    // Fetch recording from Zoom API
    const zoomResponse = await fetch(
      `https://api.zoom.us/v2/meetings/${stream.zoomMeetingId}/recordings`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.ZOOM_SERVER_TO_SERVER_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!zoomResponse.ok) {
      if (zoomResponse.status === 404) {
        return errorResponse('No recording found for this meeting', 404);
      }
      throw new Error(`Zoom API error: ${zoomResponse.status}`);
    }

    const recordingData = await zoomResponse.json() as any;
    const recordings = recordingData.recording_files || [];
    
    if (recordings.length === 0) {
      return errorResponse('No recording files available', 404);
    }

    // Find best quality video recording
    const videoRecordings = recordings.filter((r: any) => 
      r.file_type?.toLowerCase() === 'mp4' && 
      r.recording_type === 'shared_screen_with_speaker_view'
    );

    const bestRecording = videoRecordings.length > 0 
      ? videoRecordings[0] 
      : recordings.find((r: any) => r.file_type?.toLowerCase() === 'mp4');

    if (!bestRecording) {
      return errorResponse('No video recording found', 404);
    }

    // Get authenticated download URL
    const downloadUrl = await getZoomRecordingDownloadUrl(bestRecording.download_url);
    
    // Upload to Bunny Stream
    const bunnyVideo = await fetchVideoFromUrl(downloadUrl, stream.title || 'Recording');
    const videoGuid = bunnyVideo.id || bunnyVideo.guid;

    if (!videoGuid) {
      throw new Error('Bunny Stream did not return video ID');
    }

    // Check if lesson already exists for this stream
    const existingLesson = await db.prepare(`
      SELECT l.id, v.id as videoId, u.id as uploadId
      FROM Lesson l
      JOIN Video v ON v.lessonId = l.id
      JOIN Upload u ON u.id = v.uploadId
      WHERE l.id = ?
    `).bind(stream.recordingId).first() as any;

    if (existingLesson) {
      // Update existing upload with Bunny GUID
      await db.prepare(`
        UPDATE Upload 
        SET bunnyGuid = ?, storagePath = ?, storageType = 'bunny'
        WHERE id = ?
      `).bind(videoGuid, videoGuid, existingLesson.uploadId).run();

      return Response.json(successResponse({
        message: 'Recording uploaded successfully',
        lessonId: existingLesson.id,
        bunnyGuid: videoGuid,
      }));
    }

    // No existing lesson - save Bunny GUID to recordingId for future lesson creation
    await db.prepare(`
      UPDATE LiveStream 
      SET status = 'ended', recordingId = ?
      WHERE id = ?
    `).bind(videoGuid, streamId).run();

    return Response.json(successResponse({
      message: 'Grabación subida a Bunny Stream. La lección usará este video ya transcodificado.',
      bunnyGuid: videoGuid,
    }));

  } catch (error) {
    console.error('Recording fetch error:', error);
    return handleApiError(error);
  }
}
