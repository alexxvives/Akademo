import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';
import { createZoomMeeting, getZoomRecording, getZoomRecordingDownloadUrl } from '../lib/zoom';

const live = new Hono<{ Bindings: Bindings }>();

// GET /live - Get live streams for a class
live.get('/', async (c) => {
  try {
    const session = await requireAuth(c);
    const { classId } = c.req.query();

    if (!classId) {
      return c.json(errorResponse('classId required'), 400);
    }

    const result = await c.env.DB
      .prepare(`
        SELECT ls.id, ls.classId, ls.teacherId, ls.status, ls.title, ls.startedAt, ls.endedAt, 
               ls.recordingId, ls.createdAt, ls.zoomLink, ls.zoomMeetingId, ls.zoomStartUrl, 
               ls.participantCount, ls.participantsFetchedAt, ls.participantsData, 
               u.firstName, u.lastName
        FROM LiveStream ls
        JOIN User u ON ls.teacherId = u.id
        WHERE ls.classId = ? 
          AND (ls.status IN ('scheduled', 'active'))
          AND (
            ls.status = 'active' 
            OR (ls.status = 'scheduled' AND ls.createdAt > datetime('now', '-24 hours'))
          )
        ORDER BY ls.createdAt DESC
      `)
      .bind(classId)
      .all();

    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    console.error('[Get Live Streams] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// POST /live - Create live stream with Zoom meeting
live.post('/', async (c) => {
  try {
    const session = await requireAuth(c);

    if (!['ADMIN', 'TEACHER', 'ACADEMY'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const { classId, title } = await c.req.json();

    if (!classId || !title) {
      return c.json(errorResponse('classId and title required'), 400);
    }

    // Get class info with academy and teacher details
    const classInfo = await c.env.DB
      .prepare(`
        SELECT c.name, c.teacherId, c.academyId, c.zoomAccountId,
               u.firstName, u.lastName,
               a.ownerId as academyOwnerId
        FROM Class c 
        JOIN User u ON c.teacherId = u.id 
        JOIN Academy a ON c.academyId = a.id
        WHERE c.id = ?
      `)
      .bind(classId)
      .first() as any;

    if (!classInfo) {
      return c.json(errorResponse('Class not found'), 404);
    }

    // Verify permissions
    if (session.role === 'TEACHER') {
      // Teacher must own the class
      if (classInfo.teacherId !== session.id) {
        return c.json(errorResponse('Not authorized to create stream for this class'), 403);
      }
    } else if (session.role === 'ACADEMY') {
      // Academy owner must own the academy
      if (classInfo.academyOwnerId !== session.id) {
        return c.json(errorResponse('Not authorized to create stream for this class'), 403);
      }
    }

    // Get Zoom credentials - use class's Zoom account if assigned, otherwise platform credentials
    let zoomConfig;
    if (classInfo.zoomAccountId) {
      const zoomAccount = await c.env.DB
        .prepare('SELECT accessToken, refreshToken, expiresAt FROM ZoomAccount WHERE id = ?')
        .bind(classInfo.zoomAccountId)
        .first() as any;
      
      if (!zoomAccount) {
        return c.json(errorResponse('Assigned Zoom account not found'), 404);
      }

      // Check if token needs refresh
      const expiresAt = new Date(zoomAccount.expiresAt);
      if (expiresAt <= new Date(Date.now() + 5 * 60 * 1000)) {
        // Token expires in < 5 minutes, refresh it
        const { refreshZoomToken } = await import('./zoom-accounts');
        const newToken = await refreshZoomToken(c, classInfo.zoomAccountId);
        if (!newToken) {
          return c.json(errorResponse('Failed to refresh Zoom token'), 500);
        }
        zoomConfig = { accessToken: newToken };
      } else {
        zoomConfig = { accessToken: zoomAccount.accessToken };
      }
    } else {
      // No Zoom account assigned - teachers must contact academy
      return c.json(errorResponse('Esta clase no tiene una cuenta de Zoom asignada. Por favor contacta a la academia para que asigne una cuenta de Zoom a esta clase.'), 400);
    }

    // Create Zoom meeting
    let zoomMeeting;
    try {
      zoomMeeting = await createZoomMeeting({
        topic: `${title} - ${classInfo.name}`,
        duration: 120, // 2 hours default
        waitingRoom: false,
        config: zoomConfig,
      });
    } catch (zoomError: any) {
      console.error('[Create Live Stream] Zoom error:', zoomError);
      // Check if error is due to no Zoom account
      if (zoomError.message?.includes('Failed to get Zoom access token') || zoomError.message?.includes('unsupported_grant_type')) {
        return c.json(errorResponse('Esta clase no tiene una cuenta de Zoom asignada. Por favor asigna una cuenta en la configuración de la clase.'), 400);
      }
      return c.json(errorResponse(`Error al crear reunión Zoom: ${zoomError.message}`), 500);
    }

    // Create livestream record with Zoom details
    const streamId = crypto.randomUUID();
    const now = new Date().toISOString();

    await c.env.DB
      .prepare(`
        INSERT INTO LiveStream (id, classId, teacherId, title, status, zoomLink, zoomMeetingId, zoomStartUrl, createdAt) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        streamId, 
        classId, 
        classInfo.teacherId,  // Use the class's actual teacherId, not session.id
        title, 
        'scheduled', 
        zoomMeeting.join_url,
        String(zoomMeeting.id),
        zoomMeeting.start_url,
        now
      )
      .run();

    const stream = await c.env.DB
      .prepare('SELECT * FROM LiveStream WHERE id = ?')
      .bind(streamId)
      .first();

    // Create notifications for all enrolled students
    try {
      const enrolledStudents = await c.env.DB
        .prepare('SELECT userId FROM ClassEnrollment WHERE classId = ? AND status = "APPROVED"')
        .bind(classId)
        .all();
      
      const teacherName = `${classInfo.firstName} ${classInfo.lastName}`;
      
      for (const enrollment of (enrolledStudents.results || [])) {
        const notificationId = crypto.randomUUID();
        await c.env.DB.prepare(`
          INSERT INTO Notification (id, userId, type, title, message, data, isRead, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          notificationId,
          (enrollment as any).userId,
          'LIVE_CLASS',
          '🔴 Clase en Vivo',
          `${teacherName} ha iniciado una transmisión en ${classInfo.name}`,
          JSON.stringify({
            liveStreamId: streamId,
            classId,
            zoomLink: zoomMeeting.join_url,
            className: classInfo.name,
            teacherName,
          }),
          0,
          now
        ).run();
      }
      
      console.log('[Create Live Stream] Created notifications for', enrolledStudents.results?.length || 0, 'students');
    } catch (notifError: any) {
      console.error('[Create Live Stream] Failed to create notifications:', notifError);
      // Don't fail the request if notifications fail
    }

    return c.json(successResponse(stream), 201);
  } catch (error: any) {
    console.error('[Create Live Stream] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// GET /live/history - Get stream history
live.get('/history', async (c) => {
  try {
    const session = await requireAuth(c);

    if (!['ADMIN', 'TEACHER', 'ACADEMY'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    let query = '';
    let params: any[] = [];

    // Include a check for whether the recording is already used in a lesson
    // validRecordingId will be the lesson ID if recording is already used, NULL otherwise
    if (session.role === 'ACADEMY') {
      query = `
        SELECT 
          ls.*,
          c.academyId,
          c.name as className,
          c.slug as classSlug,
          u.firstName || ' ' || u.lastName as teacherName,
          (SELECT v.lessonId FROM Video v 
           JOIN Upload up ON v.uploadId = up.id 
           WHERE up.bunnyGuid = ls.recordingId 
           LIMIT 1) as validRecordingId
        FROM LiveStream ls
        JOIN Class c ON ls.classId = c.id
        JOIN User u ON ls.teacherId = u.id
        JOIN Academy a ON c.academyId = a.id
        WHERE a.ownerId = ? AND ls.status != 'scheduled'
        ORDER BY ls.createdAt DESC
      `;
      params = [session.id];
    } else if (session.role === 'TEACHER') {
      query = `
        SELECT 
          ls.*,
          c.academyId,
          c.name as className,
          c.slug as classSlug,
          (SELECT v.lessonId FROM Video v 
           JOIN Upload up ON v.uploadId = up.id 
           WHERE up.bunnyGuid = ls.recordingId 
           LIMIT 1) as validRecordingId
        FROM LiveStream ls
        JOIN Class c ON ls.classId = c.id
        WHERE ls.teacherId = ? AND ls.status != 'scheduled'
        ORDER BY ls.createdAt DESC
      `;
      params = [session.id];
    } else {
      query = `
        SELECT 
          ls.*,
          c.academyId,
          c.name as className,
          c.slug as classSlug,
          a.name as academyName,
          u.firstName || ' ' || u.lastName as teacherName,
          (SELECT v.lessonId FROM Video v 
           JOIN Upload up ON v.uploadId = up.id 
           WHERE up.bunnyGuid = ls.recordingId 
           LIMIT 1) as validRecordingId
        FROM LiveStream ls
        JOIN Class c ON ls.classId = c.id
        JOIN Academy a ON c.academyId = a.id
        JOIN User u ON ls.teacherId = u.id
        WHERE ls.status != 'scheduled'
        ORDER BY ls.createdAt DESC
      `;
    }

    const result = await c.env.DB.prepare(query).bind(...params).all();

    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    console.error('[Live History] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// GET /live/active - Get active streams for student
live.get('/active', async (c) => {
  try {
    const session = await requireAuth(c);

    if (session.role !== 'STUDENT') {
      return c.json(errorResponse('Only students can access this'), 403);
    }

    const result = await c.env.DB
      .prepare(`
        SELECT 
          ls.*,
          c.name as className,
          u.firstName || ' ' || u.lastName as teacherName
        FROM LiveStream ls
        JOIN Class c ON ls.classId = c.id
        JOIN User u ON ls.teacherId = u.id
        JOIN ClassEnrollment ce ON ce.classId = c.id
        WHERE ce.userId = ? 
          AND ce.status = 'APPROVED'
          AND ls.status = 'active'
        ORDER BY ls.createdAt DESC
      `)
      .bind(session.id)
      .all();

    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    console.error('[Active Streams] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// GET /live/:id - Get stream details
live.get('/:id', async (c) => {
  try {
    const session = await requireAuth(c);
    const streamId = c.req.param('id');

    const stream = await c.env.DB
      .prepare(`
        SELECT ls.id, ls.classId, ls.teacherId, ls.status, ls.title, ls.startedAt, ls.endedAt, 
               ls.recordingId, ls.createdAt, ls.zoomLink, ls.zoomMeetingId, ls.zoomStartUrl, 
               ls.participantCount, ls.participantsFetchedAt, ls.participantsData, 
               u.firstName, u.lastName, c.name as className
        FROM LiveStream ls
        JOIN User u ON ls.teacherId = u.id
        JOIN Class c ON ls.classId = c.id
        WHERE ls.id = ?
      `)
      .bind(streamId)
      .first();

    if (!stream) {
      return c.json(errorResponse('Stream not found'), 404);
    }

    return c.json(successResponse(stream));
  } catch (error: any) {
    console.error('[Get Stream] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// GET /live/:id/check-recording - Check if recording is available in Bunny
live.get('/:id/check-recording', async (c) => {
  try {
    const session = await requireAuth(c);
    const streamId = c.req.param('id');

    if (!['ADMIN', 'TEACHER', 'ACADEMY'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const stream = await c.env.DB
      .prepare('SELECT * FROM LiveStream WHERE id = ?')
      .bind(streamId)
      .first();

    if (!stream) {
      return c.json(errorResponse('Stream not found'), 404);
    }

    // If already has recording, return it
    if (stream.recordingId) {
      return c.json(successResponse({ 
        recordingId: stream.recordingId,
        bunnyStatus: 4 // Assume ready if we have the ID
      }));
    }

    // If not ended yet, can't have recording
    if (stream.status !== 'ended') {
      return c.json(successResponse({ recordingId: null, bunnyStatus: null }));
    }

    // Check Bunny for recordings matching this stream's title/time
    try {
      const bunnyApiKey = c.env.BUNNY_STREAM_API_KEY || c.env.BUNNY_API_KEY;
      const bunnyLibraryId = c.env.BUNNY_STREAM_LIBRARY_ID || c.env.BUNNY_LIBRARY_ID;

      const response = await fetch(
        `https://video.bunnycdn.com/library/${bunnyLibraryId}/videos`,
        {
          headers: {
            'AccessKey': bunnyApiKey,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error('[Check Recording] Bunny API error:', response.status);
        return c.json(successResponse({ recordingId: null, bunnyStatus: null }));
      }

      const videos = await response.json();
      const streamTitle = stream.title.toLowerCase().trim();
      const streamTime = new Date(stream.createdAt).getTime();

      // Look for videos matching title (fuzzy) and created around the same time (±2 hours)
      const matchingVideo = videos.items?.find((video: any) => {
        const videoTitle = video.title.toLowerCase().trim();
        const videoTime = new Date(video.dateUploaded).getTime();
        const timeDiff = Math.abs(streamTime - videoTime);
        const twoHours = 2 * 60 * 60 * 1000;

        const titleMatch = videoTitle.includes(streamTitle) || streamTitle.includes(videoTitle);
        const timeMatch = timeDiff < twoHours;

        return titleMatch && timeMatch && video.status >= 4; // Only ready videos
      });

      if (matchingVideo) {
        // Update the stream with the recording ID
        await c.env.DB
          .prepare('UPDATE LiveStream SET recordingId = ? WHERE id = ?')
          .bind(matchingVideo.guid, streamId)
          .run();

        return c.json(successResponse({ 
          recordingId: matchingVideo.guid,
          bunnyStatus: matchingVideo.status
        }));
      }

      return c.json(successResponse({ recordingId: null, bunnyStatus: null }));
    } catch (error: any) {
      console.error('[Check Recording] Bunny check error:', error);
      return c.json(successResponse({ recordingId: null, bunnyStatus: null }));
    }
  } catch (error: any) {
    console.error('[Check Recording] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// PATCH /live/:id - Update stream
live.patch('/:id', async (c) => {
  try {
    const session = await requireAuth(c);
    const streamId = c.req.param('id');
    const { status, title } = await c.req.json();

    if (!['ADMIN', 'TEACHER'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    // Verify ownership
    const stream = await c.env.DB
      .prepare('SELECT * FROM LiveStream WHERE id = ?')
      .bind(streamId)
      .first();

    if (!stream) {
      return c.json(errorResponse('Stream not found'), 404);
    }

    if (session.role === 'TEACHER' && stream.teacherId !== session.id) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const now = new Date().toISOString();
    let query = 'UPDATE LiveStream SET ';
    const updates: string[] = [];
    const params: any[] = [];

    if (status) {
      updates.push('status = ?');
      params.push(status);
      if (status === 'active') {
        updates.push('startedAt = ?');
        params.push(now);
      } else if (status === 'ended') {
        updates.push('endedAt = ?');
        params.push(now);
      }
    }

    if (title) {
      updates.push('title = ?');
      params.push(title);
    }

    if (updates.length === 0) {
      return c.json(errorResponse('No updates provided'), 400);
    }

    query += updates.join(', ') + ' WHERE id = ?';
    params.push(streamId);

    await c.env.DB.prepare(query).bind(...params).run();

    const updated = await c.env.DB
      .prepare('SELECT * FROM LiveStream WHERE id = ?')
      .bind(streamId)
      .first();

    return c.json(successResponse(updated));
  } catch (error: any) {
    console.error('[Update Stream] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// DELETE /live/:id - Delete stream
live.delete('/:id', async (c) => {
  try {
    const session = await requireAuth(c);
    const streamId = c.req.param('id');

    if (!['ADMIN', 'TEACHER', 'ACADEMY'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    // Verify ownership
    const stream = await c.env.DB
      .prepare('SELECT * FROM LiveStream WHERE id = ?')
      .bind(streamId)
      .first() as any;

    if (!stream) {
      return c.json(errorResponse('Stream not found'), 404);
    }

    if (session.role === 'TEACHER' && stream.teacherId !== session.id) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    if (session.role === 'ACADEMY') {
      // Check if academy owns the class
      const classInfo = await c.env.DB
        .prepare('SELECT academyId FROM Class WHERE id = ?')
        .bind(stream.classId)
        .first();
      
      const academy = await c.env.DB
        .prepare('SELECT id FROM Academy WHERE ownerId = ?')
        .bind(session.id)
        .first();

      if (!classInfo || !academy || classInfo.academyId !== academy.id) {
        return c.json(errorResponse('Not authorized'), 403);
      }
    }

    // If there is a recording, try to delete it from Bunny
    if (stream.recordingId) {
      try {
        // Parse recording IDs (can be single GUID string or JSON array)
        let recordingGuids: string[] = [];
        try {
          recordingGuids = JSON.parse(stream.recordingId);
          if (!Array.isArray(recordingGuids)) {
            recordingGuids = [stream.recordingId];
          }
        } catch {
          recordingGuids = [stream.recordingId];
        }

        // Check each recording and delete if not used
        for (const guid of recordingGuids) {
          const existingUpload = await c.env.DB.prepare(`
            SELECT id FROM Upload WHERE bunnyGuid = ?
          `).bind(guid).first();

          // Only delete from Bunny if NOT used in any upload/lesson
          if (!existingUpload) {
            await fetch(
              `https://video.bunnycdn.com/library/${c.env.BUNNY_STREAM_LIBRARY_ID}/videos/${guid}`,
              {
                method: 'DELETE',
                headers: { 'AccessKey': c.env.BUNNY_STREAM_API_KEY },
              }
            );
          }
        }
      } catch (bunnyError) {
        console.error('[Delete Stream] Failed to delete from Bunny:', bunnyError);
        // Continue with DB deletion even if Bunny fails
      }
    }

    // Permanently delete the record
    await c.env.DB
      .prepare('DELETE FROM LiveStream WHERE id = ?')
      .bind(streamId)
      .run();

    return c.json(successResponse({ message: 'Stream deleted' }));
  } catch (error: any) {
    console.error('[Delete Stream] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// POST /live/create-lesson - Create a lesson from a stream recording
live.post('/create-lesson', async (c) => {
  try {
    const session = await requireAuth(c);

    if (!['ADMIN', 'TEACHER', 'ACADEMY'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const { streamId, title, description, releaseDate } = await c.req.json();

    if (!streamId) {
      return c.json(errorResponse('streamId is required'), 400);
    }

    // Get the stream with class info
    const stream = await c.env.DB.prepare(`
      SELECT ls.id, ls.classId, ls.teacherId, ls.status, ls.title, ls.startedAt, ls.endedAt, 
             ls.recordingId, ls.createdAt, ls.zoomLink, ls.zoomMeetingId, ls.zoomStartUrl, 
             ls.participantCount, ls.participantsFetchedAt, ls.participantsData, 
             c.academyId, c.teacherId as classTeacherId, a.ownerId as academyOwnerId
      FROM LiveStream ls
      JOIN Class c ON ls.classId = c.id
      JOIN Academy a ON c.academyId = a.id
      WHERE ls.id = ?
    `).bind(streamId).first() as any;

    if (!stream) {
      return c.json(errorResponse('Stream not found'), 404);
    }

    // Verify ownership
    const isOwner = session.role === 'ADMIN' ||
      (session.role === 'TEACHER' && stream.teacherId === session.id) ||
      (session.role === 'ACADEMY' && stream.academyOwnerId === session.id);

    if (!isOwner) {
      return c.json(errorResponse('Not authorized to create lesson from this stream'), 403);
    }

    // Check if stream has a recording
    if (!stream.recordingId) {
      return c.json(errorResponse('Stream does not have a recording yet. Wait for Zoom to process the recording.'), 400);
    }

    // Parse recording IDs (can be single GUID string or JSON array of GUIDs)
    let recordingGuids: string[] = [];
    try {
      // Try parsing as JSON array first
      recordingGuids = JSON.parse(stream.recordingId);
      if (!Array.isArray(recordingGuids)) {
        // If not an array, treat as single GUID
        recordingGuids = [stream.recordingId];
      }
    } catch {
      // If JSON parse fails, treat as single GUID string
      recordingGuids = [stream.recordingId];
    }

    console.log(`[Create Lesson] Found ${recordingGuids.length} recording segment(s)`);

    // Check if any recording is already used in another lesson
    for (const guid of recordingGuids) {
      const existingUpload = await c.env.DB.prepare(`
        SELECT u.id, v.lessonId 
        FROM Upload u 
        JOIN Video v ON v.uploadId = u.id 
        WHERE u.bunnyGuid = ?
      `).bind(guid).first();

      if (existingUpload) {
        return c.json(errorResponse(`Recording segment ${guid} is already used in another lesson`), 400);
      }
    }

    // Check Bunny video status for all segments
    const videoStatuses: { guid: string; status: number; duration: number; title: string }[] = [];
    
    for (let i = 0; i < recordingGuids.length; i++) {
      const guid = recordingGuids[i];
      const partSuffix = recordingGuids.length > 1 ? ` - PARTE ${i + 1}` : '';
      
      try {
        const bunnyResponse = await fetch(
          `https://video.bunnycdn.com/library/${c.env.BUNNY_STREAM_LIBRARY_ID}/videos/${guid}`,
          {
            headers: { 'AccessKey': c.env.BUNNY_STREAM_API_KEY },
          }
        );

        if (bunnyResponse.ok) {
          const bunnyVideo = await bunnyResponse.json() as { status: number; length: number; title?: string };
          videoStatuses.push({
            guid,
            status: bunnyVideo.status,
            duration: bunnyVideo.length || 0,
            title: bunnyVideo.title || `${stream.title || 'Grabación'}${partSuffix}`
          });
        } else {
          console.error(`[Create Lesson] Bunny video not found: ${guid}`);
          return c.json(errorResponse(`Recording segment ${i + 1} not found in Bunny. It may have been deleted.`), 404);
        }
      } catch (e) {
        console.error(`[Create Lesson] Failed to check Bunny status for ${guid}:`, e);
        return c.json(errorResponse(`Failed to check status for recording segment ${i + 1}`), 500);
      }
    }

    // Warn if any video is still processing
    for (let i = 0; i < videoStatuses.length; i++) {
      const videoStatus = videoStatuses[i];
      if (videoStatus.status === 0) {
        return c.json(errorResponse(`Recording segment ${i + 1} is still being uploaded to Bunny. Please wait a few minutes.`), 400);
      }
      if (videoStatus.status === 6) {
        return c.json(errorResponse(`Recording segment ${i + 1} failed to process. Please contact support.`), 400);
      }
      if (videoStatus.status === 1 || videoStatus.status === 2 || videoStatus.status === 3) {
        console.log(`[Create Lesson] Segment ${i + 1} still processing, status: ${videoStatus.status}`);
      }
    }

    const now = new Date().toISOString();

    // Create lesson ID
    const lessonId = crypto.randomUUID();

    // Determine lesson title
    const lessonTitle = title || stream.title || 'Grabación de clase en vivo';

    // Create Lesson record first
    await c.env.DB.prepare(`
      INSERT INTO Lesson (id, title, description, classId, releaseDate, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      lessonId,
      lessonTitle,
      description || null,
      stream.classId,
      releaseDate || now,
      now
    ).run();

    // Create Upload and Video records for each segment
    const createdVideos = [];
    for (let i = 0; i < videoStatuses.length; i++) {
      const videoStatus = videoStatuses[i];
      const uploadId = crypto.randomUUID();
      const videoId = crypto.randomUUID();
      const partSuffix = videoStatuses.length > 1 ? ` - PARTE ${i + 1}` : '';

      // Create Upload record for the Bunny video
      await c.env.DB.prepare(`
        INSERT INTO Upload (id, fileName, fileSize, mimeType, storagePath, uploadedById, bunnyGuid, bunnyStatus, storageType, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        uploadId,
        `${lessonTitle}${partSuffix}.mp4`,
        0, // We don't know the exact size
        'video/mp4',
        videoStatus.guid, // Use bunnyGuid as storage path
        session.id,
        videoStatus.guid,
        videoStatus.status,
        'bunny',
        now
      ).run();

      // Create Video record linking Upload to Lesson
      await c.env.DB.prepare(`
        INSERT INTO Video (id, title, lessonId, uploadId, durationSeconds, createdAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        videoId,
        `${lessonTitle}${partSuffix}`,
        lessonId,
        uploadId,
        videoStatus.duration,
        now
      ).run();

      createdVideos.push({
        id: videoId,
        title: `${lessonTitle}${partSuffix}`,
        uploadId,
        bunnyGuid: videoStatus.guid
      });
    }

    // Get the created lesson
    const lesson = await c.env.DB.prepare('SELECT * FROM Lesson WHERE id = ?').bind(lessonId).first();

    // Determine overall video status (all must be ready for status to be ready)
    const allReady = videoStatuses.every(v => v.status === 4 || v.status === 5);
    const videoStatus = allReady ? 'ready' : 'processing';

    return c.json(successResponse({
      lesson,
      videos: createdVideos,
      message: `Lesson created from stream recording (${createdVideos.length} segment${createdVideos.length > 1 ? 's' : ''})`,
      videoStatus
    }), 201);

  } catch (error: any) {
    console.error('[Create Lesson from Stream] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// DELETE /live/:id - Delete stream and its Bunny recording
live.delete('/:id', async (c) => {
  try {
    const session = await requireAuth(c);
    const streamId = c.req.param('id');

    console.log('[Delete Stream] Request to delete stream:', streamId, 'by user:', session.id);

    if (!['ADMIN', 'TEACHER', 'ACADEMY'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    // Get stream details
    const stream = await c.env.DB
      .prepare('SELECT * FROM LiveStream WHERE id = ?')
      .bind(streamId)
      .first();

    if (!stream) {
      console.log('[Delete Stream] Stream not found:', streamId);
      return c.json(errorResponse('Stream not found'), 404);
    }

    console.log('[Delete Stream] Found stream:', stream);

    // Verify ownership
    if (session.role === 'TEACHER' && stream.teacherId !== session.id) {
      return c.json(errorResponse('Not authorized to delete this stream'), 403);
    }

    if (session.role === 'ACADEMY') {
      // Check if academy owns the class
      const classInfo = await c.env.DB
        .prepare('SELECT academyId FROM Class WHERE id = ?')
        .bind(stream.classId)
        .first();
      
      const academy = await c.env.DB
        .prepare('SELECT id FROM Academy WHERE ownerId = ?')
        .bind(session.id)
        .first();

      if (!classInfo || !academy || classInfo.academyId !== academy.id) {
        return c.json(errorResponse('Not authorized to delete this stream'), 403);
      }
    }

    // Delete from Bunny if recording exists
    if (stream.recordingId) {
      try {
        const BUNNY_LIBRARY_ID = c.env.BUNNY_STREAM_LIBRARY_ID;
        const BUNNY_API_KEY = c.env.BUNNY_STREAM_API_KEY;

        // Parse recording IDs (can be single GUID string or JSON array)
        let recordingGuids: string[] = [];
        try {
          recordingGuids = JSON.parse(stream.recordingId);
          if (!Array.isArray(recordingGuids)) {
            recordingGuids = [stream.recordingId];
          }
        } catch {
          recordingGuids = [stream.recordingId];
        }

        console.log(`[Delete Stream] Attempting Bunny deletion of ${recordingGuids.length} segment(s)`);
        
        for (const guid of recordingGuids) {
          const bunnyResponse = await fetch(
            `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${guid}`,
            {
              method: 'DELETE',
              headers: {
                'AccessKey': BUNNY_API_KEY,
              },
            }
          );

          if (!bunnyResponse.ok) {
            const bunnyError = await bunnyResponse.text();
            console.error(`[Delete Stream] Bunny deletion failed for ${guid}:`, bunnyResponse.status, bunnyError);
          } else {
            console.log(`[Delete Stream] Successfully deleted from Bunny: ${guid}`);
          }
        }
      } catch (bunnyError: any) {
        console.error('[Delete Stream] Bunny error:', bunnyError.message);
        // Continue with database deletion even if Bunny fails
      }
    }

    // Delete from database
    console.log('[Delete Stream] Deleting from database:', streamId);
    const deleteResult = await c.env.DB
      .prepare('DELETE FROM LiveStream WHERE id = ?')
      .bind(streamId)
      .run();

    console.log('[Delete Stream] Database deletion result:', deleteResult);

    // Verify deletion
    const verification = await c.env.DB
      .prepare('SELECT id FROM LiveStream WHERE id = ?')
      .bind(streamId)
      .first();

    if (verification) {
      console.error('[Delete Stream] Stream still exists after deletion!', verification);
      return c.json(errorResponse('Failed to delete stream from database'), 500);
    }

    console.log('[Delete Stream] Stream successfully deleted:', streamId);
    return c.json(successResponse({ message: 'Stream deleted successfully' }));
  } catch (error: any) {
    console.error('[Delete Stream] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// POST /live/:id/notify - Notify enrolled students about live stream
live.post('/:id/notify', async (c) => {
  try {
    const session = await requireAuth(c);
    const streamId = c.req.param('id');

    // Get stream info
    const stream = await c.env.DB
      .prepare('SELECT * FROM LiveStream WHERE id = ?')
      .bind(streamId)
      .first();

    if (!stream) {
      return c.json(errorResponse('Stream not found'), 404);
    }

    // Verify teacher owns this stream
    if (session.role !== 'ADMIN' && stream.teacherId !== session.id) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    // Get all approved enrolled students
    const enrollments = await c.env.DB
      .prepare(`
        SELECT userId 
        FROM ClassEnrollment 
        WHERE classId = ? AND status = 'APPROVED'
      `)
      .bind(stream.classId)
      .all();

    if (!enrollments.results || enrollments.results.length === 0) {
      return c.json(successResponse({ notified: 0, message: 'No hay estudiantes inscritos' }));
    }

    // Create notifications for each student
    const now = new Date().toISOString();
    let notified = 0;

    for (const enrollment of enrollments.results) {
      const notificationId = crypto.randomUUID();
      await c.env.DB
        .prepare(`
          INSERT INTO Notification (id, userId, title, message, type, metadata, isRead, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          notificationId,
          enrollment.userId,
          '🔴 Clase en Vivo',
          `${stream.title} - ¡La clase está en vivo ahora!`,
          'STREAM_STARTED',
          JSON.stringify({ streamId: stream.id, classId: stream.classId, zoomLink: stream.zoomLink }),
          0,
          now
        )
        .run();
      
      notified++;
    }

    return c.json(successResponse({ notified, message: `${notified} estudiantes notificados` }));
  } catch (error: any) {
    console.error('[Notify Students] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// POST /live/:id/check-recording - Manually check for Zoom recording (Sync recovery)
live.post('/:id/check-recording', async (c) => {
  try {
    const session = await requireAuth(c);
    const streamId = c.req.param('id');

    const stream = await c.env.DB
      .prepare('SELECT * FROM LiveStream WHERE id = ?')
      .bind(streamId)
      .first();

    if (!stream) return c.json(errorResponse('Stream not found'), 404);

    // Get Zoom config
    const zoomConfig = {
      ZOOM_ACCOUNT_ID: c.env.ZOOM_ACCOUNT_ID || '',
      ZOOM_CLIENT_ID: c.env.ZOOM_CLIENT_ID || '',
      ZOOM_CLIENT_SECRET: c.env.ZOOM_CLIENT_SECRET || '',
    };

    // Check recording in Zoom
    const recordingData = await getZoomRecording(stream.zoomMeetingId, zoomConfig);
    
    if (!recordingData || !recordingData.recording_files) {
      return c.json(errorResponse('No recording found in Zoom yet'), 404);
    }

    // Find ALL MP4 recording files (handles multiple segments when recording is paused/restarted)
    const mp4Files = recordingData.recording_files.filter((f: any) => f.file_type === 'MP4');
    if (mp4Files.length === 0) {
      return c.json(errorResponse('No MP4 file found in recording'), 404);
    }

    // Sort by recording_start timestamp to maintain chronological order
    mp4Files.sort((a: any, b: any) => {
      const dateA = new Date(a.recording_start || 0).getTime();
      const dateB = new Date(b.recording_start || 0).getTime();
      return dateA - dateB;
    });

    console.log(`[Check Recording] Found ${mp4Files.length} MP4 recording file(s)`);

    // Upload each segment to Bunny Stream
    const bunnyGuids: string[] = [];
    
    for (let i = 0; i < mp4Files.length; i++) {
      const mp4File = mp4Files[i];
      const partSuffix = mp4Files.length > 1 ? ` - PARTE ${i + 1}` : '';
      const videoTitle = `${stream.title || 'Zoom Recording'}${partSuffix}`;
      
      console.log(`[Check Recording] Uploading segment ${i + 1}/${mp4Files.length}: ${mp4File.id}`);

      // Prepare download URL safely using OAuth token
      const downloadUrl = await getZoomRecordingDownloadUrl(mp4File.download_url, zoomConfig);

      // Upload to Bunny
      const bunnyResponse = await fetch(`https://video.bunnycdn.com/library/${c.env.BUNNY_STREAM_LIBRARY_ID}/videos/fetch`, {
        method: 'POST',
        headers: {
          'AccessKey': c.env.BUNNY_STREAM_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: downloadUrl,
          title: videoTitle,
        })
      });

      if (!bunnyResponse.ok) {
        const errorText = await bunnyResponse.text();
        console.error(`[Check Recording] Bunny upload failed for segment ${i + 1}:`, errorText);
        // Continue with other segments even if one fails
        continue;
      }

      const bunnyData = await bunnyResponse.json();
      console.log(`[Check Recording] Bunny response for segment ${i + 1}:`, bunnyData);
      
      const bunnyGuid = bunnyData.guid || bunnyData.id;

      if (bunnyGuid) {
        bunnyGuids.push(bunnyGuid);
      } else {
        console.error(`[Check Recording] Bunny returned success but no GUID for segment ${i + 1}:`, bunnyData);
      }
    }

    if (bunnyGuids.length === 0) {
      return c.json(errorResponse('Failed to upload any recording segments to Bunny'), 502);
    }

    // Store all bunnyGuids as JSON array in recordingId field
    const recordingIds = JSON.stringify(bunnyGuids);
    
    // Update DB
    await c.env.DB
        .prepare('UPDATE LiveStream SET recordingId = ?, status = ? WHERE id = ?')
        .bind(recordingIds, 'ended', streamId)
        .run();

    return c.json(successResponse({ 
      message: `Recording synced successfully (${bunnyGuids.length} segment${bunnyGuids.length > 1 ? 's' : ''})`,
      recordingIds: bunnyGuids,
      segmentCount: bunnyGuids.length
    }));

  } catch (error: any) {
    console.error('[Check Recording] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// GET /live/:id/participants - Get real-time participant info
live.get('/:id/participants', async (c) => {
  try {
    const session = await requireAuth(c);
    const streamId = c.req.param('id');

    if (!['ADMIN', 'TEACHER', 'ACADEMY'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    // Get stream with participant data
    const stream = await c.env.DB
      .prepare(`
        SELECT ls.id, ls.classId, ls.teacherId, ls.status, ls.title, ls.participantCount, 
               ls.participantsFetchedAt, ls.participantsData, ls.zoomMeetingId
        FROM LiveStream ls
        WHERE ls.id = ?
      `)
      .bind(streamId)
      .first() as any;

    if (!stream) {
      return c.json(errorResponse('Stream not found'), 404);
    }

    // Verify permissions
    if (session.role === 'TEACHER' && stream.teacherId !== session.id) {
      return c.json(errorResponse('Not authorized to view participants'), 403);
    } else if (session.role === 'ACADEMY') {
      // Verify academy ownership
      const classInfo = await c.env.DB
        .prepare('SELECT c.academyId, a.ownerId FROM Class c JOIN Academy a ON c.academyId = a.id WHERE c.id = ?')
        .bind(stream.classId)
        .first() as any;
      
      if (!classInfo || classInfo.ownerId !== session.id) {
        return c.json(errorResponse('Not authorized to view participants'), 403);
      }
    }

    return c.json(successResponse({
      streamId: stream.id,
      participantCount: stream.participantCount || 0,
      participantsFetchedAt: stream.participantsFetchedAt,
      participantsData: stream.participantsData ? JSON.parse(stream.participantsData) : null,
    }));
  } catch (error: any) {
    console.error('[Get Participants] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

export default live;
