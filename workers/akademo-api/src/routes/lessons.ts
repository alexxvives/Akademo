import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';

const lessons = new Hono<{ Bindings: Bindings }>();

// GET /lessons - List lessons for a class
lessons.get('/', async (c) => {
  try {
    const session = await requireAuth(c);
    const classId = c.req.query('classId');
    const checkTranscoding = c.req.query('checkTranscoding') === 'true';

    if (!classId) {
      return c.json(errorResponse('classId is required'), 400);
    }

    // Verify access to the class
    const classRecord = await c.env.DB.prepare(`
      SELECT c.*, a.ownerId as academyOwnerId
      FROM Class c
      JOIN Academy a ON c.academyId = a.id
      WHERE c.id = ?
    `).bind(classId).first();

    if (!classRecord) {
      return c.json(errorResponse(`Class ${classId} not found`), 404);
    }

    // Check permissions
    let hasAccess = false;
    if (session.role === 'ADMIN') {
      hasAccess = true;
    } else if (session.role === 'ACADEMY') {
      hasAccess = classRecord.academyOwnerId === session.id;
    } else if (session.role === 'TEACHER') {
      hasAccess = classRecord.teacherId === session.id;
    } else if (session.role === 'STUDENT') {
      const enrollment = await c.env.DB.prepare(`
        SELECT id FROM ClassEnrollment 
        WHERE userId = ? AND classId = ? AND status = 'APPROVED'
      `).bind(session.id, classId).first();
      hasAccess = !!enrollment;
    }

    if (!hasAccess) {
      return c.json(errorResponse(`No access to class ${classId}`), 403);
    }

    // Build query with conditional progress tracking for students
    let progressSelect = '0 as totalWatchedSeconds';
    const bindParams: any[] = [];

    // If student, fetch their specific watch progress
    if (session.role === 'STUDENT') {
      progressSelect = `(
        SELECT COALESCE(SUM(vps.totalWatchTimeSeconds), 0) 
        FROM VideoPlayState vps 
        JOIN Video v ON vps.videoId = v.id 
        WHERE v.lessonId = l.id AND vps.studentId = ?
      ) as totalWatchedSeconds`;
      bindParams.push(session.id);
    }

    // Always fetch total video duration to calculate progress percentage
    const durationSelect = `(
      SELECT COALESCE(SUM(v.durationSeconds), 0) 
      FROM Video v 
      WHERE v.lessonId = l.id
    ) as totalVideoDuration`;

    const query = `
      SELECT 
        l.*,
        (SELECT COUNT(*) FROM Video v WHERE v.lessonId = l.id) as videoCount,
        (SELECT COUNT(*) FROM Document d WHERE d.lessonId = l.id) as documentCount,
        (SELECT u.bunnyGuid FROM Video v 
         JOIN Upload u ON v.uploadId = u.id 
         WHERE v.lessonId = l.id 
         ORDER BY v.createdAt ASC LIMIT 1) as firstVideoBunnyGuid,
        (SELECT CASE WHEN u.bunnyStatus = 0 OR u.bunnyStatus = 1 OR u.bunnyStatus = 2 THEN 1 ELSE 0 END 
         FROM Video v 
         JOIN Upload u ON v.uploadId = u.id 
         WHERE v.lessonId = l.id AND u.bunnyStatus IN (0, 1, 2)
         LIMIT 1) as isTranscoding,
        (SELECT ROUND(AVG(lr.rating), 1) FROM LessonRating lr WHERE lr.lessonId = l.id) as avgRating,
        (SELECT COUNT(DISTINCT vps.studentId) FROM VideoPlayState vps 
         JOIN Video v ON vps.videoId = v.id 
         WHERE v.lessonId = l.id) as studentsAccessed,
        t.name as topicName,
        ${durationSelect},
        ${progressSelect}
      FROM Lesson l
      LEFT JOIN Topic t ON l.topicId = t.id
      WHERE l.classId = ?
      ORDER BY l.releaseDate DESC, l.createdAt DESC
    `;
    
    bindParams.push(classId);

    // Get lessons with video and document counts
    const lessonsResult = await c.env.DB.prepare(query).bind(...bindParams).all();

    // If checkTranscoding is true, update Bunny status for any transcoding videos
    if (checkTranscoding) {
      const transcodingLessons = (lessonsResult.results || []).filter((l: any) => l.isTranscoding === 1);
      
      for (const lesson of transcodingLessons) {
        if (lesson.firstVideoBunnyGuid) {
          try {
            // Call Bunny API to get current status
            const response = await fetch(
              `https://video.bunnycdn.com/library/${c.env.BUNNY_STREAM_LIBRARY_ID}/videos/${lesson.firstVideoBunnyGuid}`,
              {
                headers: {
                  'AccessKey': c.env.BUNNY_STREAM_API_KEY,
                },
              }
            );
            
            if (response.ok) {
              const video = await response.json() as { status: number };
              // Update the Upload record with the new status
              await c.env.DB.prepare(
                'UPDATE Upload SET bunnyStatus = ? WHERE bunnyGuid = ?'
              ).bind(video.status, lesson.firstVideoBunnyGuid).run();
              
              // Update local lesson data for response
              if (video.status >= 4) {
                lesson.isTranscoding = 0;
              }
            }
          } catch (e) {
            console.error('[Lessons] Failed to check Bunny status for', lesson.firstVideoBunnyGuid, e);
          }
        }
      }
    }

    return c.json(successResponse(lessonsResult.results || []));
  } catch (error: any) {
    console.error('[List Lessons] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// GET /lessons/:id - Get lesson with content
lessons.get('/:id', async (c) => {
  try {
    const session = await requireAuth(c);
    const lessonId = c.req.param('id');

    // Handle demo lessons
    if (lessonId.startsWith('demo-')) {
      // Return demo lesson data
      const demoLessons = [
        { id: 'demo-l1', title: 'Introducción al Curso', classId: 'demo-c1', className: 'Programación Web', videoGuid: '912efe98-e6af-4c29-ada3-2617f0ff6674', duration: 3600 },
        { id: 'demo-l2', title: 'Variables y Tipos de Datos', classId: 'demo-c1', className: 'Programación Web', videoGuid: '912efe98-e6af-4c29-ada3-2617f0ff6674', duration: 3600 },
        { id: 'demo-l3', title: 'Funciones y Scope', classId: 'demo-c1', className: 'Programación Web', videoGuid: '912efe98-e6af-4c29-ada3-2617f0ff6674', duration: 3600 },
        { id: 'demo-l4', title: 'Arrays y Objetos', classId: 'demo-c1', className: 'Programación Web', videoGuid: '912efe98-e6af-4c29-ada3-2617f0ff6674', duration: 3600 },
        { id: 'demo-l5', title: 'Límites y Continuidad', classId: 'demo-c2', className: 'Matemáticas Avanzadas', videoGuid: '912efe98-e6af-4c29-ada3-2617f0ff6674', duration: 3600 },
        { id: 'demo-l6', title: 'Derivadas', classId: 'demo-c2', className: 'Matemáticas Avanzadas', videoGuid: '912efe98-e6af-4c29-ada3-2617f0ff6674', duration: 3600 },
        { id: 'demo-l7', title: 'Integrales Definidas', classId: 'demo-c2', className: 'Matemáticas Avanzadas', videoGuid: '912efe98-e6af-4c29-ada3-2617f0ff6674', duration: 3600 },
        { id: 'demo-l8', title: 'Principios de Diseño', classId: 'demo-c3', className: 'Diseño Gráfico', videoGuid: '912efe98-e6af-4c29-ada3-2617f0ff6674', duration: 3600 },
      ];
      
      const demoLesson = demoLessons.find(l => l.id === lessonId);
      if (!demoLesson) {
        return c.json(errorResponse('Demo lesson not found'), 404);
      }

      return c.json({
        success: true,
        data: {
          id: demoLesson.id,
          title: demoLesson.title,
          description: 'Lección de demostración con video de 1 hora',
          externalUrl: null,
          releaseDate: new Date().toISOString(),
          maxWatchTimeMultiplier: 2.0,
          watermarkIntervalMins: 5,
          className: demoLesson.className,
          classId: demoLesson.classId,
          videos: [{
            id: `${demoLesson.id}-video`,
            title: demoLesson.title,
            description: null,
            durationSeconds: 3600,
            upload: {
              bunnyGuid: demoLesson.videoGuid,
              storageType: 'bunny',
              fileName: 'demo-timer-1hour.mp4',
              mimeType: 'video/mp4',
            },
          }],
          documents: [],
        },
      });
    }

    // Get lesson with videos and documents
    const lesson = await c.env.DB
      .prepare(`
        SELECT 
          l.*,
          c.name as className,
          c.id as classId,
          c.teacherId,
          a.id as academyId
        FROM Lesson l
        JOIN Class c ON l.classId = c.id
        JOIN Academy a ON c.academyId = a.id
        WHERE l.id = ?
      `)
      .bind(lessonId)
      .first();

    if (!lesson) {
      return c.json(errorResponse('Lesson not found'), 404);
    }

    // Check access
    if (session.role === 'STUDENT') {
      const enrollment = await c.env.DB
        .prepare('SELECT * FROM ClassEnrollment WHERE userId = ? AND classId = ? AND status = ?')
        .bind(session.id, lesson.classId, 'APPROVED')
        .first();

      if (!enrollment) {
        return c.json(errorResponse('Not enrolled in this class'), 403);
      }
    } else if (session.role === 'TEACHER') {
      if (lesson.teacherId !== session.id) {
        return c.json(errorResponse('Not authorized'), 403);
      }
    } else if (session.role === 'ACADEMY') {
      const academy = await c.env.DB
        .prepare('SELECT * FROM Academy WHERE id = ? AND ownerId = ?')
        .bind(lesson.academyId, session.id)
        .first();

      if (!academy) {
        return c.json(errorResponse('Not authorized'), 403);
      }
    }

    // Get videos with playStates for the current student
    const videosQuery = session.role === 'STUDENT'
      ? `
        SELECT 
          v.*, 
          u.fileName, u.fileSize, u.mimeType, u.storagePath, u.bunnyGuid, u.bunnyStatus, u.storageType,
          vps.id as playStateId,
          vps.totalWatchTimeSeconds,
          vps.lastPositionSeconds,
          vps.sessionStartTime,
          vps.status as playStateStatus
        FROM Video v
        LEFT JOIN Upload u ON v.uploadId = u.id
        LEFT JOIN VideoPlayState vps ON v.id = vps.videoId AND vps.studentId = ?
        WHERE v.lessonId = ?
        ORDER BY v.createdAt
      `
      : `
        SELECT v.*, u.fileName, u.fileSize, u.mimeType, u.storagePath, u.bunnyGuid, u.bunnyStatus, u.storageType
        FROM Video v
        LEFT JOIN Upload u ON v.uploadId = u.id
        WHERE v.lessonId = ?
        ORDER BY v.createdAt
      `;

    const videos = session.role === 'STUDENT'
      ? await c.env.DB.prepare(videosQuery).bind(session.id, lessonId).all()
      : await c.env.DB.prepare(videosQuery).bind(lessonId).all();

    // Get documents
    const documents = await c.env.DB
      .prepare(`
        SELECT d.*, u.fileName, u.fileSize, u.mimeType, u.storagePath, u.storageType
        FROM Document d
        LEFT JOIN Upload u ON d.uploadId = u.id
        WHERE d.lessonId = ?
        ORDER BY d.createdAt
      `)
      .bind(lessonId)
      .all();

    // Transform videos to include upload object and playStates for frontend compatibility
    const videosWithUpload = (videos.results || []).map((v: any) => {
      const videoData: any = {
        id: v.id,
        title: v.title,
        lessonId: v.lessonId,
        uploadId: v.uploadId,
        durationSeconds: v.durationSeconds,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
        upload: {
          id: v.uploadId,
          fileName: v.fileName,
          fileSize: v.fileSize,
          mimeType: v.mimeType,
          storagePath: v.storagePath,
          bunnyGuid: v.bunnyGuid,
          bunnyStatus: v.bunnyStatus,
          storageType: v.storageType,
        }
      };

      // Add playStates array if available (for students)
      if (v.playStateId) {
        videoData.playStates = [{
          totalWatchTimeSeconds: v.totalWatchTimeSeconds || 0,
          lastPositionSeconds: v.lastPositionSeconds || 0,
          sessionStartTime: v.sessionStartTime,
          status: v.playStateStatus
        }];
      } else {
        videoData.playStates = [];
      }

      return videoData;
    });

    // Transform documents similarly
    const documentsWithUpload = (documents.results || []).map((d: any) => ({
      id: d.id,
      title: d.title,
      lessonId: d.lessonId,
      uploadId: d.uploadId,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      upload: {
        id: d.uploadId,
        fileName: d.fileName,
        fileSize: d.fileSize,
        mimeType: d.mimeType,
        storagePath: d.storagePath,
        storageType: d.storageType,
      }
    }));

    return c.json(successResponse({
      ...lesson,
      videos: videosWithUpload,
      documents: documentsWithUpload,
    }));
  } catch (error: any) {
    console.error('[Get Lesson] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// PATCH /lessons/:id - Update lesson
lessons.patch('/:id', async (c) => {
  try {
    const session = await requireAuth(c);
    const lessonId = c.req.param('id');
    const body = await c.req.json();

    if (!['ADMIN', 'TEACHER', 'ACADEMY'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    // Verify access
    const lesson = await c.env.DB
      .prepare('SELECT l.*, c.teacherId, a.ownerId FROM Lesson l JOIN Class c ON l.classId = c.id JOIN Academy a ON c.academyId = a.id WHERE l.id = ?')
      .bind(lessonId)
      .first() as any;

    if (!lesson) {
      return c.json(errorResponse('Lesson not found'), 404);
    }

    if (session.role === 'TEACHER' && lesson.teacherId !== session.id) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    if (session.role === 'ACADEMY' && lesson.ownerId !== session.id) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    // Build dynamic UPDATE query with only provided fields
    const updates: string[] = [];
    const values: any[] = [];

    if (body.title !== undefined) {
      updates.push('title = ?');
      values.push(body.title);
    }
    if (body.description !== undefined) {
      updates.push('description = ?');
      values.push(body.description || null);
    }
    
    // Check if resetTimers flag is set (lesson being moved to future)
    const resetTimers = body.resetTimers === true;
    
    if (body.releaseDate !== undefined) {
      updates.push('releaseDate = ?');
      values.push(body.releaseDate);
    }
    
    // Check if multiplier is being increased
    let multiplierIncreased = false;
    if (body.maxWatchTimeMultiplier !== undefined) {
      const oldMultiplier = lesson.maxWatchTimeMultiplier || 2.0;
      const newMultiplier = body.maxWatchTimeMultiplier;
      multiplierIncreased = newMultiplier > oldMultiplier;
      
      updates.push('maxWatchTimeMultiplier = ?');
      values.push(body.maxWatchTimeMultiplier);
    }
    
    if (body.watermarkIntervalMins !== undefined) {
      updates.push('watermarkIntervalMins = ?');
      values.push(body.watermarkIntervalMins);
    }
    if (body.topicId !== undefined) {
      updates.push('topicId = ?');
      values.push(body.topicId || null);
    }

    if (updates.length === 0) {
      return c.json(errorResponse('No fields to update'), 400);
    }

    // Add updatedAt
    updates.push('updatedAt = datetime("now")');
    values.push(lessonId);

    await c.env.DB
      .prepare(`UPDATE Lesson SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();

    // If multiplier increased, reset all BLOCKED video play states for this lesson
    if (multiplierIncreased) {
      // Get all videos in this lesson
      const videos = await c.env.DB
        .prepare('SELECT id FROM Video WHERE lessonId = ?')
        .bind(lessonId)
        .all();
      
      if (videos.results && videos.results.length > 0) {
        const videoIds = videos.results.map((v: any) => v.id);
        
        // Reset BLOCKED states by setting status to ACTIVE and keeping totalWatchTimeSeconds unchanged
        // This allows students to continue watching from where they were blocked
        for (const videoId of videoIds) {
          await c.env.DB
            .prepare(`
              UPDATE VideoPlayState 
              SET status = 'ACTIVE', updatedAt = datetime('now')
              WHERE videoId = ? AND status = 'BLOCKED'
            `)
            .bind(videoId)
            .run();
        }
        
        console.log(`[Lesson Update] Unblocked videos for lesson ${lessonId} due to multiplier increase`);
      }
    }
    
    // If resetTimers flag is set (lesson moved to future), reset ALL video play states
    if (resetTimers) {
      // Get all videos in this lesson
      const videos = await c.env.DB
        .prepare('SELECT id FROM Video WHERE lessonId = ?')
        .bind(lessonId)
        .all();
      
      if (videos.results && videos.results.length > 0) {
        const videoIds = videos.results.map((v: any) => v.id);
        
        // Delete all play states for these videos (reset to fresh state)
        for (const videoId of videoIds) {
          await c.env.DB
            .prepare('DELETE FROM VideoPlayState WHERE videoId = ?')
            .bind(videoId)
            .run();
        }
        
        console.log(`[Lesson Update] Reset all timers for lesson ${lessonId} due to reschedule to future`);
      }
    }

    const updated = await c.env.DB
      .prepare('SELECT * FROM Lesson WHERE id = ?')
      .bind(lessonId)
      .first();

    return c.json(successResponse(updated));
  } catch (error: any) {
    console.error('[Update Lesson] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// PUT /lessons/:id/move - Move lesson to a different topic
lessons.put('/:id/move', async (c) => {
  try {
    const session = await requireAuth(c);
    const lessonId = c.req.param('id');
    const { topicId } = await c.req.json();

    if (!['ADMIN', 'TEACHER', 'ACADEMY'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    // Verify access to the lesson
    const lesson = await c.env.DB
      .prepare('SELECT l.*, c.teacherId, a.ownerId, c.id as classId FROM Lesson l JOIN Class c ON l.classId = c.id JOIN Academy a ON c.academyId = a.id WHERE l.id = ?')
      .bind(lessonId)
      .first() as any;

    if (!lesson) {
      return c.json(errorResponse('Lesson not found'), 404);
    }

    if (session.role === 'TEACHER' && lesson.teacherId !== session.id) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    if (session.role === 'ACADEMY' && lesson.ownerId !== session.id) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    // If topicId is provided, verify it belongs to the same class
    if (topicId) {
      const topic = await c.env.DB
        .prepare('SELECT * FROM Topic WHERE id = ? AND classId = ?')
        .bind(topicId, lesson.classId)
        .first();

      if (!topic) {
        return c.json(errorResponse('Topic not found in this class'), 404);
      }
    }

    // Update lesson's topicId
    await c.env.DB
      .prepare('UPDATE Lesson SET topicId = ?, updatedAt = datetime("now") WHERE id = ?')
      .bind(topicId || null, lessonId)
      .run();

    const updated = await c.env.DB
      .prepare('SELECT * FROM Lesson WHERE id = ?')
      .bind(lessonId)
      .first();

    return c.json(successResponse(updated));
  } catch (error: any) {
    console.error('[Move Lesson] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// DELETE /lessons/:id - Delete lesson
lessons.delete('/:id', async (c) => {
  try {
    const session = await requireAuth(c);
    const lessonId = c.req.param('id');

    if (!['ADMIN', 'TEACHER', 'ACADEMY'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    // Verify access
    const lesson = await c.env.DB
      .prepare('SELECT l.*, c.teacherId, a.ownerId FROM Lesson l JOIN Class c ON l.classId = c.id JOIN Academy a ON c.academyId = a.id WHERE l.id = ?')
      .bind(lessonId)
      .first();

    if (!lesson) {
      return c.json(errorResponse('Lesson not found'), 404);
    }

    if (session.role === 'TEACHER' && lesson.teacherId !== session.id) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    if (session.role === 'ACADEMY' && lesson.ownerId !== session.id) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    // Get all videos for this lesson to delete from Bunny
    const videos = await c.env.DB
      .prepare('SELECT v.id, u.bunnyGuid FROM Video v JOIN Upload u ON v.uploadId = u.id WHERE v.lessonId = ?')
      .bind(lessonId)
      .all();

    // Delete videos from Bunny CDN
    const apiKey = c.env.BUNNY_STREAM_API_KEY;
    const libraryId = c.env.BUNNY_STREAM_LIBRARY_ID;

    for (const video of (videos.results || [])) {
      const bunnyGuid = (video as any).bunnyGuid;
      if (bunnyGuid) {
        try {
          const deleteUrl = `https://video.bunnycdn.com/library/${libraryId}/videos/${bunnyGuid}`;
          const response = await fetch(deleteUrl, {
            method: 'DELETE',
            headers: { 'AccessKey': apiKey },
          });
          if (!response.ok) {
            console.error(`[Delete Lesson] Failed to delete video ${bunnyGuid} from Bunny:`, await response.text());
          } else {
            console.log(`[Delete Lesson] Deleted video ${bunnyGuid} from Bunny`);
          }
        } catch (err) {
          console.error(`[Delete Lesson] Error deleting video ${bunnyGuid} from Bunny:`, err);
        }
      }
    }

    // Delete lesson (cascade will handle videos/documents/play states in DB)
    await c.env.DB
      .prepare('DELETE FROM Lesson WHERE id = ?')
      .bind(lessonId)
      .run();

    return c.json(successResponse({ message: 'Lesson deleted' }));
  } catch (error: any) {
    console.error('[Delete Lesson] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// DELETE /lessons/document/:id - Delete document from lesson
lessons.delete('/document/:id', async (c) => {
  try {
    const session = await requireAuth(c);
    const documentId = c.req.param('id');

    if (!['ADMIN', 'TEACHER', 'ACADEMY'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    // Get document and verify access
    const document = await c.env.DB.prepare(`
      SELECT d.*, l.classId, c.teacherId, a.ownerId
      FROM Document d
      JOIN Lesson l ON d.lessonId = l.id
      JOIN Class c ON l.classId = c.id
      JOIN Academy a ON c.academyId = a.id
      WHERE d.id = ?
    `).bind(documentId).first();

    if (!document) {
      return c.json(errorResponse('Document not found'), 404);
    }

    // Check permissions
    if (session.role === 'TEACHER' && document.teacherId !== session.id) {
      return c.json(errorResponse('Not authorized'), 403);
    }
    if (session.role === 'ACADEMY' && document.ownerId !== session.id) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    // Delete document
    await c.env.DB.prepare('DELETE FROM Document WHERE id = ?').bind(documentId).run();

    return c.json(successResponse({ message: 'Document deleted' }));
  } catch (error: any) {
    console.error('[Delete Document] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// DELETE /lessons/video/:id - Delete video from lesson
lessons.delete('/video/:id', async (c) => {
  try {
    const session = await requireAuth(c);
    const videoId = c.req.param('id');

    if (!['ADMIN', 'TEACHER', 'ACADEMY'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    // Get video and verify access
    const video = await c.env.DB.prepare(`
      SELECT v.*, l.classId, c.teacherId, a.ownerId
      FROM Video v
      JOIN Lesson l ON v.lessonId = l.id
      JOIN Class c ON l.classId = c.id
      JOIN Academy a ON c.academyId = a.id
      WHERE v.id = ?
    `).bind(videoId).first();

    if (!video) {
      return c.json(errorResponse('Video not found'), 404);
    }

    // Check permissions
    if (session.role === 'TEACHER' && video.teacherId !== session.id) {
      return c.json(errorResponse('Not authorized'), 403);
    }
    if (session.role === 'ACADEMY' && video.ownerId !== session.id) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    // Delete video
    await c.env.DB.prepare('DELETE FROM Video WHERE id = ?').bind(videoId).run();

    return c.json(successResponse({ message: 'Video deleted' }));
  } catch (error: any) {
    console.error('[Delete Video] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// POST /lessons/create-with-uploaded - Create lesson with pre-uploaded files
lessons.post('/create-with-uploaded', async (c) => {
  try {
    const session = await requireAuth(c);
    
    if (!['ADMIN', 'TEACHER', 'ACADEMY'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }
    
    const { 
      classId, title, description, releaseDate, 
      maxWatchTimeMultiplier, watermarkIntervalMins,
      videos, documents, topicId 
    } = await c.req.json();

    if (!classId || !title) {
      return c.json(errorResponse('classId and title are required'), 400);
    }

    // Verify access to the class
    const classRecord = await c.env.DB.prepare(`
      SELECT c.*, a.ownerId as academyOwnerId
      FROM Class c
      JOIN Academy a ON c.academyId = a.id
      WHERE c.id = ?
    `).bind(classId).first();

    if (!classRecord) {
      return c.json(errorResponse(`Class ${classId} not found`), 404);
    }

    // Check permissions
    let hasAccess = false;
    if (session.role === 'ADMIN') {
      hasAccess = true;
    } else if (session.role === 'ACADEMY') {
      hasAccess = classRecord.academyOwnerId === session.id;
    } else if (session.role === 'TEACHER') {
      hasAccess = classRecord.teacherId === session.id;
    }

    if (!hasAccess) {
      return c.json(errorResponse(`No access to class ${classId}`), 403);
    }

    // Create lesson with topicId support
    const lessonId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO Lesson (id, title, description, classId, releaseDate, maxWatchTimeMultiplier, watermarkIntervalMins, topicId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      lessonId, 
      title, 
      description || null, 
      classId, 
      releaseDate || null,
      maxWatchTimeMultiplier ?? 2.0,
      watermarkIntervalMins ?? 5,
      topicId || null
    ).run();

    // Process videos - create Upload and Video records
    const createdVideos = [];
    for (const video of (videos || [])) {
      const uploadId = crypto.randomUUID();
      
      // Create Upload record for Bunny video
      await c.env.DB.prepare(`
        INSERT INTO Upload (id, fileName, fileSize, mimeType, storagePath, uploadedById, bunnyGuid, bunnyStatus, storageType)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'bunny')
      `).bind(
        uploadId,
        video.fileName,
        video.fileSize,
        video.mimeType,
        '', // storagePath not used for Bunny
        session.id,
        video.bunnyGuid,
        video.bunnyStatus ?? 1
      ).run();

      // Create Video record
      const videoId = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT INTO Video (id, title, lessonId, uploadId, durationSeconds)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        videoId,
        video.title || video.fileName,
        lessonId,
        uploadId,
        video.durationSeconds ?? 0
      ).run();

      createdVideos.push({
        id: videoId,
        title: video.title || video.fileName,
        lessonId,
        uploadId,
        durationSeconds: video.durationSeconds ?? 0,
        upload: {
          id: uploadId,
          fileName: video.fileName,
          fileSize: video.fileSize,
          mimeType: video.mimeType,
          bunnyGuid: video.bunnyGuid,
          bunnyStatus: video.bunnyStatus ?? 1,
          storageType: 'bunny',
        }
      });
    }

    // Process documents - create Upload and Document records
    const createdDocuments = [];
    for (const doc of (documents || [])) {
      console.log('[Create Lesson] Processing document:', doc.title, 'storagePath:', doc.storagePath);
      
      if (!doc.storagePath) {
        console.error('[Create Lesson] Document missing storagePath:', JSON.stringify(doc));
        throw new Error(`Document "${doc.title || doc.fileName}" is missing storagePath`);
      }
      
      const uploadId = crypto.randomUUID();
      
      // Create Upload record for R2 document
      await c.env.DB.prepare(`
        INSERT INTO Upload (id, fileName, fileSize, mimeType, storagePath, uploadedById, storageType)
        VALUES (?, ?, ?, ?, ?, ?, 'r2')
      `).bind(
        uploadId,
        doc.fileName,
        doc.fileSize,
        doc.mimeType,
        doc.storagePath,
        session.id
      ).run();

      // Create Document record
      const documentId = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT INTO Document (id, title, lessonId, uploadId)
        VALUES (?, ?, ?, ?)
      `).bind(
        documentId,
        doc.title || doc.fileName,
        lessonId,
        uploadId
      ).run();

      createdDocuments.push({
        id: documentId,
        title: doc.title || doc.fileName,
        lessonId,
        uploadId,
        upload: {
          id: uploadId,
          fileName: doc.fileName,
          fileSize: doc.fileSize,
          mimeType: doc.mimeType,
          storagePath: doc.storagePath,
          storageType: 'r2',
        }
      });
    }

    // Return created lesson with videos and documents
    const lesson = await c.env.DB.prepare('SELECT * FROM Lesson WHERE id = ?').bind(lessonId).first();

    return c.json(successResponse({
      ...lesson,
      videos: createdVideos,
      documents: createdDocuments,
      videoCount: createdVideos.length,
      documentCount: createdDocuments.length,
    }));
  } catch (error: any) {
    console.error('[Create Lesson With Uploaded] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// POST /lessons/:id/rating - Rate a lesson
lessons.post('/:id/rating', async (c) => {
  try {
    const session = await requireAuth(c);
    const lessonId = c.req.param('id');
    const { rating, comment } = await c.req.json();

    if (session.role !== 'STUDENT') {
      return c.json(errorResponse('Only students can rate lessons'), 403);
    }

    if (!rating || rating < 1 || rating > 5) {
      return c.json(errorResponse('Rating must be between 1 and 5'), 400);
    }

    // Check if enrolled
    const lesson = await c.env.DB
      .prepare('SELECT classId FROM Lesson WHERE id = ?')
      .bind(lessonId)
      .first();

    if (!lesson) {
      return c.json(errorResponse('Lesson not found'), 404);
    }

    const enrollment = await c.env.DB
      .prepare('SELECT * FROM ClassEnrollment WHERE userId = ? AND classId = ? AND status = ?')
      .bind(session.id, lesson.classId, 'APPROVED')
      .first();

    if (!enrollment) {
      return c.json(errorResponse('Not enrolled'), 403);
    }

    // Check if already rated
    const existing = await c.env.DB
      .prepare('SELECT id FROM LessonRating WHERE lessonId = ? AND studentId = ?')
      .bind(lessonId, session.id)
      .first();

    if (existing) {
      // Update existing rating
      await c.env.DB
        .prepare('UPDATE LessonRating SET rating = ?, comment = ? WHERE id = ?')
        .bind(rating, comment || null, existing.id)
        .run();
    } else {
      // Create new rating
      const ratingId = crypto.randomUUID();
      await c.env.DB
        .prepare('INSERT INTO LessonRating (id, lessonId, studentId, rating, comment) VALUES (?, ?, ?, ?, ?)')
        .bind(ratingId, lessonId, session.id, rating, comment || null)
        .run();
    }

    return c.json(successResponse({ message: 'Rating saved' }));
  } catch (error: any) {
    console.error('[Rate Lesson] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// POST /lessons/:id/add-files - Add videos and documents to an existing lesson
lessons.post('/:id/add-files', async (c) => {
  try {
    const session = await requireAuth(c);
    const lessonId = c.req.param('id');
    
    if (!['ADMIN', 'TEACHER', 'ACADEMY'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const { videos, documents } = await c.req.json();

    // Get lesson and verify access
    const lesson = await c.env.DB.prepare(`
      SELECT l.*, c.teacherId, a.ownerId as academyOwnerId
      FROM Lesson l
      JOIN Class c ON l.classId = c.id
      JOIN Academy a ON c.academyId = a.id
      WHERE l.id = ?
    `).bind(lessonId).first();

    if (!lesson) {
      return c.json(errorResponse('Lesson not found'), 404);
    }

    // Check permissions
    if (session.role === 'TEACHER' && lesson.teacherId !== session.id) {
      return c.json(errorResponse('Not authorized'), 403);
    }
    if (session.role === 'ACADEMY' && lesson.academyOwnerId !== session.id) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    let addedVideos = 0;
    let addedDocuments = 0;

    // Add videos
    if (videos && videos.length > 0) {
      for (const video of videos) {
        const uploadId = crypto.randomUUID();
        const videoId = crypto.randomUUID();

        // Create Upload record for video
        await c.env.DB.prepare(`
          INSERT INTO Upload (id, storageType, storagePath, fileName, fileSize, mimeType, bunnyGuid, bunnyStatus, uploadedById)
          VALUES (?, 'bunny', '', ?, ?, ?, ?, ?, ?)
        `).bind(
          uploadId,
          video.fileName,
          video.fileSize,
          video.mimeType || 'video/mp4',
          video.bunnyGuid,
          video.bunnyStatus || 1,
          session.id
        ).run();

        // Create Video record
        await c.env.DB.prepare(`
          INSERT INTO Video (id, lessonId, uploadId, title, durationSeconds)
          VALUES (?, ?, ?, ?, ?)
        `).bind(
          videoId,
          lessonId,
          uploadId,
          video.title || video.fileName,
          video.durationSeconds || null
        ).run();

        addedVideos++;
      }
    }

    // Add documents
    if (documents && documents.length > 0) {
      for (const doc of documents) {
        const uploadId = crypto.randomUUID();
        const documentId = crypto.randomUUID();

        // Create Upload record for document
        await c.env.DB.prepare(`
          INSERT INTO Upload (id, storageType, storagePath, fileName, fileSize, mimeType, uploadedById)
          VALUES (?, 'r2', ?, ?, ?, ?, ?)
        `).bind(
          uploadId,
          doc.storagePath,
          doc.fileName,
          doc.fileSize,
          doc.mimeType || 'application/pdf',
          session.id
        ).run();

        // Create Document record
        await c.env.DB.prepare(`
          INSERT INTO Document (id, lessonId, uploadId, title)
          VALUES (?, ?, ?, ?)
        `).bind(
          documentId,
          lessonId,
          uploadId,
          doc.title || doc.fileName
        ).run();

        addedDocuments++;
      }
    }

    return c.json(successResponse({ 
      message: `Added ${addedVideos} video(s) and ${addedDocuments} document(s)`,
      addedVideos,
      addedDocuments
    }));
  } catch (error: any) {
    console.error('[Add Files] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// GET /lessons/:id/ratings - Get all ratings/feedback for a specific lesson (for teachers)
lessons.get('/:id/ratings', async (c) => {
  try {
    const session = await requireAuth(c);
    const lessonId = c.req.param('id');

    // Only teachers and academy owners can view lesson feedback
    if (session.role !== 'TEACHER' && session.role !== 'ACADEMY') {
      return c.json(errorResponse('Unauthorized'), 403);
    }

    // Verify the lesson exists and user has access
    const lesson = await c.env.DB.prepare(`
      SELECT l.*, c.teacherId, c.academyId
      FROM Lesson l
      JOIN Class c ON l.classId = c.id
      WHERE l.id = ?
    `).bind(lessonId).first();

    if (!lesson) {
      return c.json(errorResponse('Lesson not found'), 404);
    }

    // Check authorization
    if (session.role === 'TEACHER' && lesson.teacherId !== session.id) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    if (session.role === 'ACADEMY') {
      const academy = await c.env.DB.prepare(
        'SELECT * FROM Academy WHERE id = ? AND ownerId = ?'
      ).bind(lesson.academyId, session.id).first();
      
      if (!academy) {
        return c.json(errorResponse('Not authorized'), 403);
      }
    }

    // Get all ratings for this lesson with student names
    const ratings = await c.env.DB.prepare(`
      SELECT 
        lr.id,
        lr.rating,
        lr.comment,
        lr.createdAt,
        u.firstName || ' ' || u.lastName as studentName
      FROM LessonRating lr
      JOIN User u ON lr.studentId = u.id
      WHERE lr.lessonId = ?
      ORDER BY lr.createdAt DESC
    `).bind(lessonId).all();

    return c.json(successResponse(ratings.results || []));
  } catch (error: any) {
    console.error('[Lesson Ratings] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// GET /lessons/:id/student-times - Get all student video times for a lesson
lessons.get('/:id/student-times', async (c) => {
  try {
    const session = await requireAuth(c);
    const lessonId = c.req.param('id');

    if (!['ADMIN', 'TEACHER', 'ACADEMY'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    // Verify lesson access
    const lesson = await c.env.DB
      .prepare('SELECT l.*, c.teacherId, a.ownerId FROM Lesson l JOIN Class c ON l.classId = c.id JOIN Academy a ON c.academyId = a.id WHERE l.id = ?')
      .bind(lessonId)
      .first() as any;

    if (!lesson) {
      return c.json(errorResponse('Lesson not found'), 404);
    }

    if (session.role === 'TEACHER' && lesson.teacherId !== session.id) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    if (session.role === 'ACADEMY' && lesson.ownerId !== session.id) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    // Get all videos for this lesson
    const videos = await c.env.DB
      .prepare('SELECT id, title, durationSeconds FROM Video WHERE lessonId = ? ORDER BY createdAt')
      .bind(lessonId)
      .all();

    if (!videos.results || videos.results.length === 0) {
      return c.json(successResponse([]));
    }

    // Get all enrolled students for this class
    const students = await c.env.DB
      .prepare(`
        SELECT DISTINCT u.id, u.firstName, u.lastName
        FROM User u
        JOIN ClassEnrollment ce ON u.id = ce.userId
        WHERE ce.classId = ? AND ce.status = 'APPROVED'
        ORDER BY u.firstName, u.lastName
      `)
      .bind(lesson.classId)
      .all();

    if (!students.results || students.results.length === 0) {
      return c.json(successResponse([]));
    }

    // Build student times data
    const studentTimesData = await Promise.all(
      students.results.map(async (student: any) => {
        const videoTimes = await Promise.all(
          videos.results.map(async (video: any) => {
            const playState = await c.env.DB
              .prepare('SELECT * FROM VideoPlayState WHERE videoId = ? AND studentId = ?')
              .bind(video.id, student.id)
              .first() as any;

            const maxWatchTimeSeconds = (video.durationSeconds || 0) * (lesson.maxWatchTimeMultiplier || 2.0);

            return {
              videoId: video.id,
              videoTitle: video.title,
              totalWatchTimeSeconds: playState?.totalWatchTimeSeconds || 0,
              maxWatchTimeSeconds,
              status: playState?.status || 'ACTIVE',
            };
          })
        );

        // Include all enrolled students, even if they haven't watched yet
        return {
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          videos: videoTimes, // Always include all videos, even with 0 watch time
        };
      })
    );

    // Include all students (don't filter by watch time)
    const filteredData = studentTimesData;

    return c.json(successResponse(filteredData));
  } catch (error: any) {
    console.error('[Student Times] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// POST /lessons/:id/add-stream - Add a stream recording to a lesson
lessons.post('/:id/add-stream', async (c) => {
  try {
    const session = await requireAuth(c);
    const lessonId = c.req.param('id');
    const { streamId } = await c.req.json();

    if (!streamId) {
      return c.json(errorResponse('streamId is required'), 400);
    }

    // Verify the lesson exists and user has access
    const lesson = await c.env.DB.prepare(`
      SELECT l.*, c.teacherId, c.academyId, a.ownerId as academyOwnerId
      FROM Lesson l
      JOIN Class c ON l.classId = c.id
      JOIN Academy a ON c.academyId = a.id
      WHERE l.id = ?
    `).bind(lessonId).first() as any;

    if (!lesson) {
      return c.json(errorResponse('Lesson not found'), 404);
    }

    // Check authorization
    const isOwner = session.role === 'ADMIN' ||
      (session.role === 'TEACHER' && lesson.teacherId === session.id) ||
      (session.role === 'ACADEMY' && lesson.academyOwnerId === session.id);

    if (!isOwner) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    // Get the stream
    const stream = await c.env.DB.prepare(`
      SELECT * FROM LiveStream WHERE id = ?
    `).bind(streamId).first() as any;

    if (!stream) {
      return c.json(errorResponse('Stream not found'), 404);
    }

    if (!stream.recordingId) {
      return c.json(errorResponse('Stream does not have a recording'), 400);
    }

    // Parse recording IDs (can be single GUID string or JSON array of GUIDs)
    let recordingGuids: string[] = [];
    try {
      recordingGuids = JSON.parse(stream.recordingId);
      if (!Array.isArray(recordingGuids)) {
        recordingGuids = [stream.recordingId];
      }
    } catch {
      recordingGuids = [stream.recordingId];
    }

    const now = new Date().toISOString();
    const createdVideos = [];

    // Create Upload and Video for each recording segment
    for (let i = 0; i < recordingGuids.length; i++) {
      const guid = recordingGuids[i];
      const partSuffix = recordingGuids.length > 1 ? ` - PARTE ${i + 1}` : '';
      
      // Check if an Upload already exists for this bunnyGuid
      let uploadId = crypto.randomUUID();
      const existingUpload = await c.env.DB.prepare(`
          SELECT * FROM Upload WHERE bunnyGuid = ?
      `).bind(guid).first() as any;

      if (existingUpload) {
          uploadId = existingUpload.id;
      } else {
          // Create new Upload record
          const fileName = stream.title ? `${stream.title}${partSuffix}.mp4` : `Stream Recording${partSuffix}.mp4`;
          await c.env.DB.prepare(`
              INSERT INTO Upload (id, userId, storageType, bunnyGuid, fileName, mimeType, size, status, createdAt)
              VALUES (?, ?, 'bunny', ?, ?, 'video/mp4', 0, 'completed', ?)
          `).bind(uploadId, session.id, guid, fileName, now).run();
      }
      
      // Create Video record linked to Lesson
      const videoId = crypto.randomUUID();
      
      // Create Video
      const videoTitle = stream.title ? `${stream.title}${partSuffix}` : `Stream Recording${partSuffix}`;
      await c.env.DB.prepare(`
        INSERT INTO Video (id, lessonId, uploadId, title, description, durationSeconds, position, status, createdAt)
        VALUES (?, ?, ?, ?, ?, 0, 0, 'ready', ?)
    `).bind(videoId, lessonId, uploadId, videoTitle, 'Grabación de clase en vivo', now).run();
    
    createdVideos.push({ id: videoId, title: videoTitle });
    }
    
    // Increment video count by number of segments added
    await c.env.DB.prepare(`
        UPDATE Lesson SET videoCount = videoCount + ? WHERE id = ?
    `).bind(recordingGuids.length, lessonId).run();

    return c.json(successResponse({ 
      videos: createdVideos,
      message: `Added ${createdVideos.length} video${createdVideos.length > 1 ? 's' : ''} from stream recording`
    }));

  } catch (error: any) {
    console.error('[Add Stream] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

export default lessons;
