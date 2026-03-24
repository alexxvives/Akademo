import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';

const media = new Hono<{ Bindings: Bindings }>();

// GET /media - List all videos and/or documents for an academy
media.get('/', async (c) => {
  try {
    const session = await requireAuth(c);
    if (session.role !== 'ACADEMY' && session.role !== 'ADMIN' && session.role !== 'TEACHER') {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const type = c.req.query('type') || 'all'; // 'videos' | 'documents' | 'all'
    const classId = c.req.query('classId');
    const search = c.req.query('search');
    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = Math.min(parseInt(c.req.query('limit') || '50', 10), 100);
    const offset = (page - 1) * limit;

    const db = c.env.DB;

    // Resolve academy scope
    let academyFilter = '';
    let recAcademyFilter = ''; // for stream recordings (different table aliases)
    const baseParams: string[] = [];
    const recBaseParams: string[] = [];

    if (session.role === 'ADMIN') {
      const academyId = c.req.query('academyId');
      if (academyId) {
        academyFilter = 'AND c.academyId = ?';
        recAcademyFilter = 'AND c.academyId = ?';
        baseParams.push(academyId);
        recBaseParams.push(academyId);
      }
    } else if (session.role === 'ACADEMY') {
      academyFilter = 'AND a.ownerId = ?';
      recAcademyFilter = 'AND a.ownerId = ?';
      baseParams.push(session.id);
      recBaseParams.push(session.id);
    } else if (session.role === 'TEACHER') {
      academyFilter = 'AND c.teacherId = ?';
      recAcademyFilter = 'AND ls.teacherId = ?'; // LiveStream has teacherId directly
      baseParams.push(session.id);
      recBaseParams.push(session.id);
    }

    const classFilter = classId ? 'AND c.id = ?' : '';
    const recClassFilter = classId ? 'AND ls.classId = ?' : '';
    const classParams = classId ? [classId] : [];

    const results: { videos?: any[]; documents?: any[]; totalVideos?: number; totalDocuments?: number } = {};

    // Fetch videos (lesson uploads + stream recordings)
    if (type === 'all' || type === 'videos') {
      const searchFilter = search ? "AND (v.title LIKE ? OR l.title LIKE ? OR c.name LIKE ?)" : '';
      const searchParams = search ? [`%${search}%`, `%${search}%`, `%${search}%`] : [];

      // Lesson videos
      const lessonVideoParams = [...baseParams, ...classParams, ...searchParams];
      const lessonVideosQuery = `
        SELECT 
          v.id,
          v.title,
          v.durationSeconds,
          v.createdAt,
          l.id as lessonId,
          l.title as lessonTitle,
          c.id as classId,
          c.name as className,
          up.bunnyGuid,
          up.bunnyStatus,
          up.fileName,
          up.fileSize,
          'lesson' as source
        FROM Video v
        JOIN Upload up ON v.uploadId = up.id
        JOIN Lesson l ON v.lessonId = l.id
        JOIN Class c ON l.classId = c.id
        JOIN Academy a ON c.academyId = a.id
        WHERE up.bunnyGuid IS NOT NULL
        ${academyFilter}
        ${classFilter}
        ${searchFilter}
      `;

      // Stream recordings
      const recSearchFilter = search ? "AND (ls.title LIKE ? OR c.name LIKE ?)" : '';
      const recSearchParams = search ? [`%${search}%`, `%${search}%`] : [];
      const recParams = [...recBaseParams, ...classParams, ...recSearchParams];
      const streamRecordingsQuery = `
        SELECT 
          ls.id,
          COALESCE(ls.title, 'Grabación ' || DATE(ls.startedAt)) as title,
          CAST(
            CASE WHEN ls.startedAt IS NOT NULL AND ls.endedAt IS NOT NULL
            THEN (strftime('%s', ls.endedAt) - strftime('%s', ls.startedAt))
            ELSE NULL END
          AS INTEGER) as durationSeconds,
          ls.createdAt,
          NULL as lessonId,
          NULL as lessonTitle,
          c.id as classId,
          COALESCE(c.name, '[Clase eliminada]') as className,
          ls.recordingId as bunnyGuid,
          4 as bunnyStatus,
          NULL as fileName,
          NULL as fileSize,
          'recording' as source
        FROM LiveStream ls
        LEFT JOIN Class c ON ls.classId = c.id
        LEFT JOIN Academy a ON c.academyId = a.id
        WHERE ls.recordingId IS NOT NULL
        ${recAcademyFilter}
        ${recClassFilter}
        ${recSearchFilter}
      `;

      // Count each separately (D1 doesn't support nested subqueries with bound params)
      const [lessonCount, recCount] = await Promise.all([
        db.prepare(`SELECT COUNT(*) as total FROM (${lessonVideosQuery})`).bind(...lessonVideoParams).first<{ total: number }>(),
        db.prepare(`SELECT COUNT(*) as total FROM (${streamRecordingsQuery})`).bind(...recParams).first<{ total: number }>(),
      ]);

      // Wrap UNION ALL in subquery so ORDER BY works in D1 (D1/SQLite doesn't allow
      // ORDER BY on bare column names from a compound SELECT without an outer query)
      const videosQuery = `
        SELECT * FROM (
          ${lessonVideosQuery}
          UNION ALL
          ${streamRecordingsQuery}
        ) ORDER BY createdAt DESC
        LIMIT ? OFFSET ?
      `;
      const videosResult = await db.prepare(videosQuery).bind(...lessonVideoParams, ...recParams, limit, offset).all();

      results.videos = videosResult.results || [];
      results.totalVideos = (lessonCount?.total || 0) + (recCount?.total || 0);

      // For recording-source items, fetch actual video duration from Bunny
      const recordingItems = (results.videos as any[]).filter((v: any) => v.source === 'recording' && v.bunnyGuid);
      if (recordingItems.length > 0) {
        await Promise.all(recordingItems.map(async (item: any) => {
          try {
            const bunnyRes = await fetch(
              `https://video.bunnycdn.com/library/${c.env.BUNNY_STREAM_LIBRARY_ID}/videos/${item.bunnyGuid}`,
              { headers: { 'AccessKey': c.env.BUNNY_STREAM_API_KEY } }
            );
            if (bunnyRes.ok) {
              const bunnyData = await bunnyRes.json() as any;
              item.durationSeconds = bunnyData.length || item.durationSeconds;
              item.bunnyStatus = bunnyData.status ?? item.bunnyStatus;
            }
          } catch { /* keep DB-computed duration as fallback */ }
        }));
      }
    }

    // Fetch documents
    if (type === 'all' || type === 'documents') {
      const searchFilter = search ? "AND (d.title LIKE ? OR l.title LIKE ? OR c.name LIKE ?)" : '';
      const searchParams = search ? [`%${search}%`, `%${search}%`, `%${search}%`] : [];
      const docParams = [...baseParams, ...classParams, ...searchParams];

      const docsQuery = `
        SELECT 
          d.id,
          d.title,
          d.createdAt,
          l.id as lessonId,
          l.title as lessonTitle,
          c.id as classId,
          c.name as className,
          up.fileName,
          up.fileSize,
          up.mimeType,
          up.storagePath
        FROM Document d
        JOIN Upload up ON d.uploadId = up.id
        JOIN Lesson l ON d.lessonId = l.id
        JOIN Class c ON l.classId = c.id
        JOIN Academy a ON c.academyId = a.id
        WHERE 1=1
        ${academyFilter}
        ${classFilter}
        ${searchFilter}
      `;

      const countQuery = `SELECT COUNT(*) as total FROM (${docsQuery})`;
      const countResult = await db.prepare(countQuery).bind(...docParams).first<{ total: number }>();

      const pagedQuery = `${docsQuery} ORDER BY d.createdAt DESC LIMIT ? OFFSET ?`;
      const docsResult = await db.prepare(pagedQuery).bind(...docParams, limit, offset).all();

      results.documents = docsResult.results || [];
      results.totalDocuments = countResult?.total || 0;
    }

    return c.json(successResponse({
      ...results,
      page,
      limit,
    }));
  } catch (error) {
    console.error('[Media List Error]', error);
    return c.json(errorResponse('Failed to load media'), 500);
  }
});

// GET /media/export - Export content list (videos, documents, archived) with date + class filters
media.get('/export', async (c) => {
  try {
    const session = await requireAuth(c);
    if (!['ACADEMY', 'ADMIN'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const db = c.env.DB;
    const classId = c.req.query('classId');
    const startDate = c.req.query('startDate');
    const endDate = c.req.query('endDate');

    // Build academy scope filter (via Class → Academy join)
    let academyFilter = '';
    const baseParams: string[] = [];
    if (session.role === 'ACADEMY') {
      academyFilter = 'AND a.ownerId = ?';
      baseParams.push(session.id);
    } else {
      const qAcademyId = c.req.query('academyId');
      if (qAcademyId) {
        academyFilter = 'AND c.academyId = ?';
        baseParams.push(qAcademyId);
      }
    }

    const classFilter = classId ? 'AND c.id = ?' : '';
    const classParams = classId ? [classId] : [];

    // Videos (lesson uploads with Bunny Stream)
    const videoDateFilter = (startDate && endDate) ? 'AND SUBSTR(v.createdAt, 1, 10) BETWEEN ? AND ?' : '';
    const videoDateParams = (startDate && endDate) ? [startDate, endDate] : [];
    const videoParams = [...baseParams, ...classParams, ...videoDateParams];
    let videoResults: any[] = [];
    try {
      const videoRows = await db.prepare(`
        SELECT v.id, v.title, up.bunnyGuid, up.fileName, v.createdAt,
               c.id as classId, c.name as className
        FROM Video v
        JOIN Upload up ON v.uploadId = up.id
        JOIN Lesson l ON v.lessonId = l.id
        JOIN Class c ON l.classId = c.id
        JOIN Academy a ON c.academyId = a.id
        WHERE up.bunnyGuid IS NOT NULL
        ${academyFilter} ${classFilter} ${videoDateFilter}
        ORDER BY v.createdAt DESC
      `).bind(...videoParams).all();
      videoResults = videoRows.results || [];
    } catch (e: any) {
      console.error('[Media Export] Video query failed:', e.message);
    }

    // Documents (R2 storage)
    const docDateFilter = (startDate && endDate) ? 'AND SUBSTR(d.createdAt, 1, 10) BETWEEN ? AND ?' : '';
    const docDateParams = (startDate && endDate) ? [startDate, endDate] : [];
    const docParams = [...baseParams, ...classParams, ...docDateParams];
    let docResults: any[] = [];
    try {
      const docRows = await db.prepare(`
        SELECT d.id, d.title, up.storagePath, up.fileName, up.fileSize, up.mimeType,
               d.createdAt, c.id as classId, c.name as className
        FROM Document d
        JOIN Upload up ON d.uploadId = up.id
        JOIN Lesson l ON d.lessonId = l.id
        JOIN Class c ON l.classId = c.id
        JOIN Academy a ON c.academyId = a.id
        WHERE 1=1
        ${academyFilter} ${classFilter} ${docDateFilter}
        ORDER BY d.createdAt DESC
      `).bind(...docParams).all();
      docResults = docRows.results || [];
    } catch (e: any) {
      console.error('[Media Export] Document query failed:', e.message);
    }

    // Archived videos (Bunny Storage)
    let archAcademyFilter = '';
    const archBaseParams: string[] = [];
    if (session.role === 'ACADEMY') {
      const academy = await db.prepare('SELECT id FROM Academy WHERE ownerId = ?').bind(session.id).first() as any;
      if (academy) {
        archAcademyFilter = 'AND av.academyId = ?';
        archBaseParams.push(academy.id);
      }
    } else {
      const qAcademyId = c.req.query('academyId');
      if (qAcademyId) {
        archAcademyFilter = 'AND av.academyId = ?';
        archBaseParams.push(qAcademyId);
      }
    }
    const archClassFilter = classId ? 'AND av.classId = ?' : '';
    const archClassParams = classId ? [classId] : [];
    const archDateFilter = (startDate && endDate) ? 'AND SUBSTR(av.createdAt, 1, 10) BETWEEN ? AND ?' : '';
    const archDateParams = (startDate && endDate) ? [startDate, endDate] : [];
    const archParams = [...archBaseParams, ...archClassParams, ...archDateParams];
    let archResults: any[] = [];
    try {
      const archRows = await db.prepare(`
        SELECT av.id, av.title, av.fileName, av.fileSize, av.className,
               av.classId, av.createdAt
        FROM ArchivedVideo av
        WHERE 1=1 ${archAcademyFilter} ${archClassFilter} ${archDateFilter}
        ORDER BY av.createdAt DESC
      `).bind(...archParams).all();
      archResults = archRows.results || [];
    } catch (e: any) {
      console.error('[Media Export] ArchivedVideo query failed:', e.message);
    }

    return c.json(successResponse({
      videos: videoResults,
      documents: docResults,
      archived: archResults,
    }));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Media Export Error]', error);
    return c.json(errorResponse('Failed to export media'), 500);
  }
});

export default media;
