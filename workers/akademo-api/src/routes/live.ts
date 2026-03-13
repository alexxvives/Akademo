import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';
import { createZoomMeeting, getZoomRecording, getZoomRecordingDownloadUrl } from '../lib/zoom';
import { isPaymentOverdue } from '../lib/payment-utils';

const live = new Hono<{ Bindings: Bindings }>();

// GET /live - Get live streams for a class
live.get('/', async (c) => {
  try {
    const session = await requireAuth(c);
    const { classId } = c.req.query();

    if (!classId) {
      return c.json(errorResponse('classId required'), 400);
    }

    // ── Stream access restriction enforcement ──
    // Only check for STUDENT role (teachers, academy owners, admins always have access)
    if (session.role === 'STUDENT') {
      const enrollment = await c.env.DB
        .prepare(`
          SELECT e.id FROM ClassEnrollment e
          WHERE e.classId = ? AND e.userId = ? AND e.status = 'APPROVED'
          LIMIT 1
        `)
        .bind(classId, session.id)
        .first() as any;

      if (!enrollment) {
        return c.json(errorResponse('Acceso restringido: debes estar matriculado en esta asignatura'), 403);
      }

      // Check Payment table directly — ClassEnrollment.nextPaymentDue is unreliable for Stripe users
      if (await isPaymentOverdue(c.env.DB, session.id, classId)) {
        return c.json(errorResponse('Acceso restringido: tienes un pago pendiente en esta asignatura'), 403);
      }
    }

    const isHost = ['TEACHER', 'ACADEMY', 'ADMIN'].includes(session.role);

    const result = await c.env.DB
      .prepare(`
        SELECT ls.id, ls.classId, ls.teacherId, ls.status, ls.title, ls.startedAt, ls.endedAt, 
               ls.recordingId, ls.createdAt, ls.zoomLink, ls.zoomMeetingId, ls.zoomStartUrl, 
               ls.dailyRoomUrl, ls.participantCount, ls.currentCount, ls.participantsFetchedAt,
               u.firstName, u.lastName
        FROM LiveStream ls
        JOIN User u ON ls.teacherId = u.id
        WHERE ls.classId = ? 
          AND (
            ls.status = 'active'
            OR (ls.status = 'scheduled' AND ls.createdAt > datetime('now', '-24 hours'))
            OR (? = 1 AND ls.status = 'ended' AND ls.dailyRoomUrl IS NOT NULL AND ls.endedAt > datetime('now', '-12 hours'))
          )
        ORDER BY ls.createdAt DESC
      `)
      .bind(classId, isHost ? 1 : 0)
      .all();

    // Strip zoomStartUrl (host-only URL) from student responses to prevent
    // students from gaining host privileges in the Zoom meeting.
    const streams = (result.results || []).map((s: any) => {
      if (session.role === 'STUDENT') {
        const { zoomStartUrl, ...safe } = s;
        return safe;
      }
      return s;
    });

    return c.json(successResponse(streams));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Get Live Streams] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// POST /live - Create live stream with Daily.co embedded room
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
        SELECT c.name, c.teacherId, c.academyId,
               u.firstName, u.lastName,
               a.ownerId as academyOwnerId
        FROM Class c 
        LEFT JOIN User u ON c.teacherId = u.id 
        LEFT JOIN Academy a ON c.academyId = a.id
        WHERE c.id = ?
      `)
      .bind(classId)
      .first() as any;

    if (!classInfo) {
      return c.json(errorResponse('Class not found'), 404);
    }

    // Verify permissions
    if (session.role === 'TEACHER') {
      if (!classInfo.teacherId || classInfo.teacherId !== session.id) {
        return c.json(errorResponse('Not authorized to create stream for this class'), 403);
      }
    } else if (session.role === 'ACADEMY') {
      if (classInfo.academyOwnerId !== session.id) {
        return c.json(errorResponse('Not authorized to create stream for this class'), 403);
      }
    }

    // Check for existing active stream on this class
    const activeStream = await c.env.DB
      .prepare("SELECT id FROM LiveStream WHERE classId = ? AND status IN ('active', 'LIVE', 'scheduled')")
      .bind(classId)
      .first();

    if (activeStream) {
      return c.json(errorResponse('Esta clase ya tiene una transmisión en vivo activa. Finalízala antes de crear otra.'), 409);
    }

    const streamId = crypto.randomUUID();
    const now = new Date().toISOString();

    // ── Zoom path: use Zoom if the class has a linked Zoom account ──
    const classZoomInfo = await c.env.DB
      .prepare('SELECT zoomAccountId FROM Class WHERE id = ?')
      .bind(classId)
      .first<{ zoomAccountId: string | null }>();

    if (classZoomInfo?.zoomAccountId) {
      const zoomAccount = await c.env.DB
        .prepare('SELECT accessToken, refreshToken, expiresAt, provider, accountId FROM ZoomAccount WHERE id = ?')
        .bind(classZoomInfo.zoomAccountId)
        .first() as { accessToken: string; refreshToken: string; expiresAt: string; provider: string; accountId: string } | null;

      if (zoomAccount) {
        let token = zoomAccount.accessToken;
        const isGTM = zoomAccount.provider === 'gotomeeting';

        if (new Date(zoomAccount.expiresAt) <= new Date(Date.now() + 5 * 60 * 1000)) {
          if (isGTM) {
            const { refreshGTMToken } = await import('./zoom-accounts');
            const refreshed = await refreshGTMToken(c, classZoomInfo.zoomAccountId);
            if (!refreshed) {
              // Refresh token has expired — user must reconnect the GTM account
              return c.json(errorResponse('La sesión de GoToMeeting ha expirado. Por favor, desconecta y vuelve a conectar tu cuenta de GoToMeeting en Ajustes → Streaming.'), 400);
            }
            token = refreshed;
          } else {
            const { refreshZoomToken } = await import('./zoom-accounts');
            token = (await refreshZoomToken(c, classZoomInfo.zoomAccountId)) ?? token;
          }
        }

        if (isGTM) {
          // GoToMeeting meeting creation (v1 API - developer.goto.com/GoToMeetingV1)
          // Docs: https://developer.goto.com/GoToMeetingV1/#operation/createMeeting
          // - Body must be a plain JSON object {} (response comes back as array)
          // - starttime/endtime MUST be a future date (not "now") in ISO8601 UTC format
          // - timezonekey is DEPRECATED but must be present as empty string ''
          // - meetingtype: "immediate" | "scheduled" | "recurring"
          const startTime = new Date(Date.now() + 2 * 60 * 1000).toISOString(); // 2 min in future
          const endTime = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours later
          const gtmResponse = await fetch('https://api.getgo.com/G2M/rest/meetings', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              subject: title,
              starttime: startTime,
              endtime: endTime,
              passwordrequired: false,
              conferencecallinfo: 'VoIP',
              timezonekey: '',
              meetingtype: 'scheduled'
            })
          });

          const errText = await gtmResponse.text();
          if (!gtmResponse.ok) {
            console.error('GTM meeting creation failed:', gtmResponse.status, errText);
            // Check for token-related errors and give a clear reconnect message
            const isTokenError = errText.includes('InvalidToken') || errText.includes('Invalid token') || gtmResponse.status === 401;
            if (isTokenError) {
              return c.json(errorResponse('Tu sesión de GoToMeeting ha expirado o no es válida. Por favor, desconecta y vuelve a conectar tu cuenta de GoToMeeting en Ajustes → Streaming.'), 400);
            }
            return c.json(errorResponse(`Failed to create GoToMeeting meeting: ${errText}`), 500);
          }

          const gtmMeeting = JSON.parse(errText) as any;
          // v1 API returns an array of meeting objects
          const meetingData = Array.isArray(gtmMeeting) ? gtmMeeting[0] : gtmMeeting;
          const joinUrl = meetingData.joinURL || meetingData.joinUrl || meetingData.joinurl || '';
          const meetingId = String(meetingData.meetingId || meetingData.meetingid || '');

          // Fetch host start URL to open the GTM desktop app directly (like Zoom's start_url)
          // GET /meetings/{meetingId}/start → { hostURL: "gotomeeting://..." }
          let gtmHostUrl: string | null = null;
          try {
            const startResp = await fetch(`https://api.getgo.com/G2M/rest/meetings/${meetingId}/start`, {
              headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
            });
            if (startResp.ok) {
              const startData = await startResp.json() as any;
              gtmHostUrl = startData.hostURL || startData.startURL || startData.startUrl || null;
            } else {
              console.warn(`[GTM] Could not fetch hostURL for meeting ${meetingId}:`, await startResp.text());
            }
          } catch (startErr) {
            console.warn('[GTM] Failed to fetch hostURL:', startErr);
          }

          await c.env.DB
            .prepare(`
              INSERT INTO LiveStream (id, classId, teacherId, title, status, zoomLink, zoomMeetingId, zoomStartUrl, createdAt) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `)
            .bind(streamId, classId, classInfo.teacherId ?? session.id, title, 'scheduled',
                  joinUrl, meetingId, gtmHostUrl, now)
            .run();
        } else {
          // Zoom meeting creation
          const meeting = await createZoomMeeting({ topic: title, config: { accessToken: token } });

          await c.env.DB
            .prepare(`
              INSERT INTO LiveStream (id, classId, teacherId, title, status, zoomLink, zoomMeetingId, zoomStartUrl, createdAt) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `)
            .bind(streamId, classId, classInfo.teacherId ?? session.id, title, 'scheduled',
                  meeting.join_url, String(meeting.id), meeting.start_url, now)
            .run();
        }

        const stream = await c.env.DB.prepare('SELECT * FROM LiveStream WHERE id = ?').bind(streamId).first();
        return c.json(successResponse(stream), 201);
      }
    }

    // ── Daily.co path: fallback when no Zoom account is configured ──
    // Room is created lazily when the host joins (GET /live/:id/join-token)
    if (!c.env.DAILY_API_KEY) {
      return c.json(errorResponse('No hay cuenta Zoom ni Daily.co configurados para esta asignatura'), 500);
    }

    await c.env.DB
      .prepare(`
        INSERT INTO LiveStream (id, classId, teacherId, title, status, createdAt) 
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .bind(streamId, classId, classInfo.teacherId ?? session.id, title, 'scheduled', now)
      .run();

    const stream = await c.env.DB
      .prepare('SELECT * FROM LiveStream WHERE id = ?')
      .bind(streamId)
      .first();

    return c.json(successResponse(stream), 201);
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Create Live Stream] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
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
          COALESCE(c.name, '[Clase eliminada]') as className,
          COALESCE(c.slug, '') as classSlug,
          COALESCE(u.firstName || ' ' || u.lastName, '') as teacherName,
          CASE WHEN c.id IS NULL THEN 1 ELSE 0 END as classDeleted,
          (SELECT v.lessonId FROM Video v 
           JOIN Upload up ON v.uploadId = up.id 
           WHERE up.bunnyGuid = ls.recordingId 
           LIMIT 1) as validRecordingId
        FROM LiveStream ls
        LEFT JOIN Class c ON ls.classId = c.id
        LEFT JOIN User u ON ls.teacherId = u.id
        LEFT JOIN Academy a ON c.academyId = a.id
        WHERE (a.ownerId = ? OR (c.id IS NULL AND ls.teacherId IN (
          SELECT t.userId FROM Teacher t JOIN Academy a2 ON t.academyId = a2.id WHERE a2.ownerId = ?
        )))
        ORDER BY ls.createdAt DESC
      `;
      params = [session.id, session.id];
    } else if (session.role === 'TEACHER') {
      query = `
        SELECT 
          ls.*,
          c.academyId,
          COALESCE(c.name, '[Clase eliminada]') as className,
          COALESCE(c.slug, '') as classSlug,
          COALESCE(u.firstName || ' ' || u.lastName, '') as teacherName,
          CASE WHEN c.id IS NULL THEN 1 ELSE 0 END as classDeleted,
          (SELECT v.lessonId FROM Video v 
           JOIN Upload up ON v.uploadId = up.id 
           WHERE up.bunnyGuid = ls.recordingId 
           LIMIT 1) as validRecordingId
        FROM LiveStream ls
        LEFT JOIN Class c ON ls.classId = c.id
        LEFT JOIN User u ON ls.teacherId = u.id
        WHERE ls.teacherId = ?
        ORDER BY ls.createdAt DESC
      `;
      params = [session.id];
    } else {
      query = `
        SELECT 
          ls.*,
          c.academyId,
          COALESCE(c.name, '[Clase eliminada]') as className,
          COALESCE(c.slug, '') as classSlug,
          COALESCE(a.name, '') as academyName,
          COALESCE(u.firstName || ' ' || u.lastName, '') as teacherName,
          CASE WHEN c.id IS NULL THEN 1 ELSE 0 END as classDeleted,
          (SELECT v.lessonId FROM Video v 
           JOIN Upload up ON v.uploadId = up.id 
           WHERE up.bunnyGuid = ls.recordingId 
           LIMIT 1) as validRecordingId
        FROM LiveStream ls
        LEFT JOIN Class c ON ls.classId = c.id
        LEFT JOIN Academy a ON c.academyId = a.id
        LEFT JOIN User u ON ls.teacherId = u.id
        ORDER BY ls.createdAt DESC
        LIMIT 100
      `;
    }

    const result = await c.env.DB.prepare(query).bind(...params).all();
    const streams = result.results || [];

    // Fetch Bunny status for streams that have a recordingId
    const streamsWithStatus = await Promise.all(
      streams.map(async (stream: any) => {
        if (!stream.recordingId) return stream;
        try {
          const bunnyRes = await fetch(
            `https://video.bunnycdn.com/library/${c.env.BUNNY_STREAM_LIBRARY_ID}/videos/${stream.recordingId}`,
            { headers: { 'AccessKey': c.env.BUNNY_STREAM_API_KEY } }
          );
          if (bunnyRes.ok) {
            const bunnyData = await bunnyRes.json() as any;
            return { ...stream, bunnyStatus: bunnyData.status ?? null };
          }
        } catch {}
        return stream;
      })
    );

    return c.json(successResponse(streamsWithStatus));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Live History] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
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
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Active Streams] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// GET /live/:id - Get stream details
live.get('/:id', async (c) => {
  try {
    const session = await requireAuth(c);
    const streamId = c.req.param('id');

    const stream: any = await c.env.DB
      .prepare(`
        SELECT ls.id, ls.classId, ls.teacherId, ls.status, ls.title, ls.startedAt, ls.endedAt, 
               ls.recordingId, ls.createdAt, ls.zoomLink, ls.zoomMeetingId, ls.zoomStartUrl, ls.zoomPassword,
               ls.participantCount, ls.currentCount, ls.participantsFetchedAt,
               ls.dailyRoomName, ls.dailyRoomUrl,
               u.firstName, u.lastName, c.name as className, c.slug as classSlug, c.academyId,
               c.whatsappGroupLink,
               a.name as academyName, a.logoUrl as academyLogoUrl
        FROM LiveStream ls
        JOIN User u ON ls.teacherId = u.id
        JOIN Class c ON ls.classId = c.id
        JOIN Academy a ON c.academyId = a.id
        WHERE ls.id = ?
      `)
      .bind(streamId)
      .first();

    if (!stream) {
      return c.json(errorResponse('Stream not found'), 404);
    }

    // Access control: verify the user belongs to this class
    if (session.role === 'STUDENT') {
      const enrolled: any = await c.env.DB
        .prepare('SELECT id FROM ClassEnrollment WHERE userId = ? AND classId = ? AND status = ?')
        .bind(session.id, stream.classId, 'APPROVED')
        .first();
      if (!enrolled) return c.json(errorResponse('Not authorized'), 403);
    } else if (session.role === 'TEACHER') {
      if (stream.teacherId !== session.id) return c.json(errorResponse('Not authorized'), 403);
    } else if (session.role === 'ACADEMY') {
      const owns: any = await c.env.DB
        .prepare('SELECT id FROM Academy WHERE id = ? AND ownerId = ?')
        .bind(stream.academyId, session.id)
        .first();
      if (!owns) return c.json(errorResponse('Not authorized'), 403);
    }
    // ADMIN passes through

    // Strip sensitive fields for students
    if (session.role === 'STUDENT') {
      delete stream.zoomStartUrl;
      delete stream.zoomPassword;
      delete stream.dailyRoomName; // Room name is host-internal; URL is enough to join
    }

    return c.json(successResponse(stream));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Get Stream] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// POST /live/:id/start-recording - Trigger Daily.co cloud recording to start
live.post('/:id/start-recording', async (c) => {
  try {
    const session = await requireAuth(c);
    const streamId = c.req.param('id');

    if (!['ADMIN', 'TEACHER', 'ACADEMY'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const stream: any = await c.env.DB
      .prepare('SELECT ls.*, a.ownerId as academyOwnerId FROM LiveStream ls JOIN Class c ON ls.classId = c.id JOIN Academy a ON c.academyId = a.id WHERE ls.id = ?')
      .bind(streamId)
      .first();

    if (!stream) return c.json(errorResponse('Stream not found'), 404);
    if (!stream.dailyRoomName) return c.json(successResponse({ started: false, reason: 'Not a Daily.co stream' }));

    if (session.role === 'TEACHER' && stream.teacherId !== session.id) return c.json(errorResponse('Not authorized'), 403);
    if (session.role === 'ACADEMY' && stream.academyOwnerId !== session.id) return c.json(errorResponse('Not authorized'), 403);

    const apiKey = c.env.DAILY_API_KEY;
    if (!apiKey) return c.json(errorResponse('Daily.co not configured'), 500);

    const recRes = await fetch('https://api.daily.co/v1/recordings/start', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ room_name: stream.dailyRoomName }),
    });

    if (!recRes.ok) {
      const err = await recRes.text();
      console.warn('[Start Recording] Daily.co response:', err);
      // Non-fatal — host may not have joined yet; Daily webhook will still fire when session ends
      return c.json(successResponse({ started: false, reason: err }));
    }

    return c.json(successResponse({ started: true }));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Start Recording] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// GET /live/:id/join-token - Generate a Daily.co meeting token for the authenticated user
live.get('/:id/join-token', async (c) => {
  try {
    const session = await requireAuth(c);
    const streamId = c.req.param('id');

    const stream: any = await c.env.DB
      .prepare('SELECT ls.id, ls.classId, ls.teacherId, ls.status, ls.dailyRoomName, ls.dailyRoomUrl, c.academyId, a.ownerId as academyOwnerId, a.dailyEnabled FROM LiveStream ls JOIN Class c ON ls.classId = c.id JOIN Academy a ON c.academyId = a.id WHERE ls.id = ?')
      .bind(streamId)
      .first();

    if (!stream) return c.json(errorResponse('Stream not found'), 404);
    // If this is a Zoom stream (no Daily.co), reject
    if (!stream.dailyRoomName && stream.zoomMeetingId) return c.json(errorResponse('Esta sesión no usa videoconferencia integrada'), 400);

    // Access control
    if (session.role === 'STUDENT') {
      const enrolled: any = await c.env.DB
        .prepare("SELECT id FROM ClassEnrollment WHERE userId = ? AND classId = ? AND status = 'APPROVED'")
        .bind(session.id, stream.classId)
        .first();
      if (!enrolled) return c.json(errorResponse('No estás matriculado en esta asignatura'), 403);
    } else if (session.role === 'TEACHER') {
      if (stream.teacherId !== session.id) return c.json(errorResponse('Not authorized'), 403);
    } else if (session.role === 'ACADEMY') {
      if (stream.academyOwnerId !== session.id) return c.json(errorResponse('Not authorized'), 403);
    }

    const apiKey = c.env.DAILY_API_KEY;
    if (!apiKey) return c.json(errorResponse('Daily.co no configurado'), 500);

    // Check per-academy Daily.co enablement
    if (!stream.dailyEnabled) return c.json(errorResponse('La videoconferencia integrada no está habilitada para esta academia'), 403);

    // If room not yet created (host is joining for first time), create it now
    if (!stream.dailyRoomName) {
      if (session.role === 'STUDENT') {
        return c.json(errorResponse('La sesión no ha comenzado todavía. Espera a que el host inicie la clase.'), 503);
      }
      const roomName = `akademo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const roomRes = await fetch('https://api.daily.co/v1/rooms', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roomName,
          properties: {
            enable_screenshare: true,
            enable_chat: true,
            enable_recording: 'cloud',
            start_video_off: false,
            start_audio_off: false,
            exp: Math.floor(Date.now() / 1000) + 6 * 60 * 60,
            redirect_on_exit: `${c.env.FRONTEND_URL}/dashboard/streaming`,
          },
        }),
      });
      if (!roomRes.ok) {
        const err = await roomRes.text();
        console.error('[Join Token] Daily.co room creation failed:', err);
        return c.json(errorResponse('Error al crear sala de videoconferencia'), 500);
      }
      const room = await roomRes.json() as { name: string; url: string };
      await c.env.DB
        .prepare("UPDATE LiveStream SET dailyRoomName = ?, dailyRoomUrl = ?, status = 'active', startedAt = ? WHERE id = ?")
        .bind(room.name, room.url, new Date().toISOString(), stream.id)
        .run();
      stream.dailyRoomName = room.name;
      stream.dailyRoomUrl = room.url;
    } else if (stream.status === 'scheduled' || stream.status === 'ended') {
      // Room exists but stream is not active yet — activate it
      await c.env.DB.prepare("UPDATE LiveStream SET status = 'active', endedAt = NULL WHERE id = ?")
        .bind(stream.id).run();
    }

    const isHost = ['TEACHER', 'ACADEMY', 'ADMIN'].includes(session.role);
    const userName = `${session.firstName} ${session.lastName}`.trim() || session.email;

    const tokenRes = await fetch('https://api.daily.co/v1/meeting-tokens', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        properties: {
          room_name: stream.dailyRoomName,
          is_owner: isHost,
          user_name: userName,
          exp: Math.floor(Date.now() / 1000) + 6 * 60 * 60,
          ...(isHost ? { start_cloud_recording: true } : {}),
        },
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error('[Join Token] Daily.co token error:', err);
      return c.json(errorResponse('Error al generar token de acceso'), 500);
    }

    const tokenData = await tokenRes.json() as { token: string };
    return c.json(successResponse({ token: tokenData.token, roomUrl: stream.dailyRoomUrl, isHost, userName }));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Join Token] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
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

    // If already has recording, check actual Bunny status
    if (stream.recordingId) {
      try {
        const guidToCheck = (() => {
          try {
            const parsed = JSON.parse(stream.recordingId as string);
            return Array.isArray(parsed) ? parsed[0] : stream.recordingId;
          } catch { return stream.recordingId; }
        })();
        const bunnyResp = await fetch(
          `https://video.bunnycdn.com/library/${c.env.BUNNY_STREAM_LIBRARY_ID}/videos/${guidToCheck}`,
          { headers: { 'AccessKey': c.env.BUNNY_STREAM_API_KEY } }
        );
        if (bunnyResp.ok) {
          const bunnyData = await bunnyResp.json() as { status: number };
          return c.json(successResponse({ recordingId: stream.recordingId, bunnyStatus: bunnyData.status }));
        }
      } catch { /* fall through to default */ }
      return c.json(successResponse({ recordingId: stream.recordingId, bunnyStatus: 4 }));
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

      const videos = await response.json() as any;
      const streamTitle = ((stream as any).title as string).toLowerCase().trim();
      const streamTime = new Date((stream as any).createdAt as string).getTime();

      // Look for videos matching title (fuzzy) and created around the same time (±2 hours)
      const matchingVideo = (videos.items || []).find((video: any) => {
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
      if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
      console.error('[Check Recording] Bunny check error:', error);
      return c.json(successResponse({ recordingId: null, bunnyStatus: null }));
    }
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Check Recording] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// PATCH /live/:id - Update stream (status changes OR scheduled stream edits)
live.patch('/:id', async (c) => {
  try {
    const session = await requireAuth(c);
    const streamId = c.req.param('id');

    if (!['ADMIN', 'TEACHER', 'ACADEMY'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    // Verify ownership
    const stream = await c.env.DB
      .prepare(`SELECT ls.*, COALESCE(a.ownerId, '') as academyOwnerId FROM LiveStream ls LEFT JOIN Class c ON ls.classId = c.id LEFT JOIN Academy a ON c.academyId = a.id WHERE ls.id = ?`)
      .bind(streamId)
      .first() as any;

    if (!stream) {
      return c.json(errorResponse('Stream not found'), 404);
    }

    if (session.role === 'TEACHER' && stream.teacherId !== session.id) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    if (session.role === 'ACADEMY' && stream.academyOwnerId !== session.id) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const body = await c.req.json<{ status?: string; title?: string; scheduledAt?: string; zoomLink?: string | null; zoomMeetingId?: string | null; classId?: string | null; location?: string | null }>();
    const { status, title, scheduledAt, zoomLink, zoomMeetingId, classId, location } = body;

    // ── Delete old Zoom meeting when zoom link is being removed ──
    // Trigger when zoomLink is explicitly set to null/empty AND the stream had a zoomMeetingId
    const zoomLinkBeingCleared = zoomLink !== undefined && !zoomLink?.trim();
    const oldZoomMeetingId = (stream.zoomMeetingId as string | null);
    if (zoomLinkBeingCleared && oldZoomMeetingId) {
      try {
        const { deleteZoomMeeting } = await import('../lib/zoom');
        const classInfo2 = await c.env.DB
          .prepare('SELECT zoomAccountId FROM Class WHERE id = ?')
          .bind(stream.classId)
          .first<{ zoomAccountId: string | null }>();
        let zoomToken2: string | undefined;
        let isGtm2 = false;
        if (classInfo2?.zoomAccountId) {
          const zoomAccount2 = await c.env.DB
            .prepare('SELECT accessToken, refreshToken, expiresAt, provider FROM ZoomAccount WHERE id = ?')
            .bind(classInfo2.zoomAccountId)
            .first() as { accessToken: string; refreshToken: string; expiresAt: string; provider: string | null } | null;
          if (zoomAccount2) {
            if (zoomAccount2.provider === 'gotomeeting') {
              isGtm2 = true;
            } else {
              let token2 = zoomAccount2.accessToken;
              if (new Date(zoomAccount2.expiresAt) <= new Date(Date.now() + 5 * 60 * 1000)) {
                const { refreshZoomToken } = await import('./zoom-accounts');
                token2 = (await refreshZoomToken(c, classInfo2.zoomAccountId)) ?? token2;
              }
              zoomToken2 = token2;
            }
          }
        }
        if (!isGtm2) {
          await deleteZoomMeeting(oldZoomMeetingId, zoomToken2 ? { accessToken: zoomToken2 } : undefined);
        }
      } catch (zoomDeleteErr) {
        console.error('[PATCH Stream] Failed to delete Zoom meeting on unlink:', zoomDeleteErr);
        // Non-fatal — continue
      }
    }

    const now = new Date().toISOString();
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

    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title?.trim() || stream.title);
    }

    if (scheduledAt !== undefined) {
      updates.push('scheduledAt = ?');
      params.push(scheduledAt || stream.scheduledAt);
    }

    if (zoomLink !== undefined) {
      updates.push('zoomLink = ?');
      params.push(zoomLink?.trim() || null);
    }

    // Update or clear zoomMeetingId
    if (zoomMeetingId !== undefined) {
      updates.push('zoomMeetingId = ?');
      params.push(zoomMeetingId || null);
    } else if (zoomLinkBeingCleared && oldZoomMeetingId) {
      // Also clear stored meeting id when zoom link is removed
      updates.push('zoomMeetingId = ?');
      params.push(null);
    }

    if (classId !== undefined) {
      updates.push('classId = ?');
      params.push(classId || stream.classId);
    }

    if (location !== undefined) {
      updates.push('location = ?');
      params.push(location?.trim() || null);
    }

    if (updates.length === 0) {
      return c.json(errorResponse('No updates provided'), 400);
    }

    const query = 'UPDATE LiveStream SET ' + updates.join(', ') + ' WHERE id = ?';
    params.push(streamId);

    await c.env.DB.prepare(query).bind(...params).run();

    // ── Sync linked CalendarScheduledEvent ──
    if (stream.calendarEventId) {
      try {
        const calUpdates: string[] = [];
        const calParams: any[] = [];
        if (title !== undefined) { calUpdates.push('title = ?'); calParams.push(title?.trim() || stream.title); }
        if (scheduledAt !== undefined) {
          calUpdates.push('eventDate = ?');
          calParams.push((scheduledAt || stream.scheduledAt)?.split('T')[0] ?? null);
        }
        if (classId !== undefined) { calUpdates.push('classId = ?'); calParams.push(classId || stream.classId); }
        if (location !== undefined) { calUpdates.push('location = ?'); calParams.push(location?.trim() || null); }
        if (zoomLink !== undefined) { calUpdates.push('zoomLink = ?'); calParams.push(zoomLink?.trim() || null); }
        if (calUpdates.length > 0) {
          calParams.push(stream.calendarEventId);
          await c.env.DB
            .prepare('UPDATE CalendarScheduledEvent SET ' + calUpdates.join(', ') + ' WHERE id = ?')
            .bind(...calParams)
            .run();
        }
      } catch (calErr) {
        console.error('[PATCH Stream] CalendarScheduledEvent sync failed:', calErr);
        // Non-fatal
      }
    }

    const updated = await c.env.DB
      .prepare('SELECT * FROM LiveStream WHERE id = ?')
      .bind(streamId)
      .first();

    return c.json(successResponse(updated));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Update Stream] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
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

      // Allow deletion when classInfo is null — class was deleted but stream is orphaned
      if (classInfo && (!academy || classInfo.academyId !== academy.id)) {
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

        // Delete each recording from Bunny (stream is being intentionally removed)
        for (const guid of recordingGuids) {
          await fetch(
            `https://video.bunnycdn.com/library/${c.env.BUNNY_STREAM_LIBRARY_ID}/videos/${guid}`,
            {
              method: 'DELETE',
              headers: { 'AccessKey': c.env.BUNNY_STREAM_API_KEY },
            }
          );
        }
      } catch (bunnyError) {
        console.error('[Delete Stream] Failed to delete from Bunny:', bunnyError);
        // Continue with DB deletion even if Bunny fails
      }
    }

    // Delete the associated Zoom meeting if one was created
    if (stream.zoomMeetingId) {
      try {
        const { deleteZoomMeeting } = await import('../lib/zoom');
        // Look up the class's Zoom account for per-account OAuth token
        const classInfo = await c.env.DB
          .prepare('SELECT zoomAccountId FROM Class WHERE id = ?')
          .bind(stream.classId)
          .first<{ zoomAccountId: string | null }>();
        let zoomToken: string | undefined;
        let isGtm = false;
        if (classInfo?.zoomAccountId) {
          const zoomAccount = await c.env.DB
            .prepare('SELECT accessToken, refreshToken, expiresAt, provider FROM ZoomAccount WHERE id = ?')
            .bind(classInfo.zoomAccountId)
            .first() as { accessToken: string; refreshToken: string; expiresAt: string; provider: string | null } | null;
          if (zoomAccount) {
            if (zoomAccount.provider === 'gotomeeting') {
              isGtm = true;
            } else {
              let token = zoomAccount.accessToken;
              if (new Date(zoomAccount.expiresAt) <= new Date(Date.now() + 5 * 60 * 1000)) {
                const { refreshZoomToken } = await import('./zoom-accounts');
                token = (await refreshZoomToken(c, classInfo.zoomAccountId)) ?? token;
              }
              zoomToken = token;
            }
          }
        }
        if (!isGtm) {
          await deleteZoomMeeting(stream.zoomMeetingId, zoomToken ? { accessToken: zoomToken } : undefined);
        }
      } catch (zoomErr) {
        console.error('[Delete Stream] Failed to delete Zoom meeting:', zoomErr);
        // Continue with DB deletion even if Zoom API fails
      }
    }

    // Permanently delete the record
    const streamToDelete = await c.env.DB
      .prepare('SELECT calendarEventId FROM LiveStream WHERE id = ?')
      .bind(streamId)
      .first<{ calendarEventId: string | null }>();

    await c.env.DB
      .prepare('DELETE FROM LiveStream WHERE id = ?')
      .bind(streamId)
      .run();

    // Cascade: delete the linked calendar event if any
    if (streamToDelete?.calendarEventId) {
      try {
        await c.env.DB
          .prepare('DELETE FROM CalendarScheduledEvent WHERE id = ?')
          .bind(streamToDelete.calendarEventId)
          .run();
      } catch (calErr) {
        console.error('[Delete Stream] CalendarScheduledEvent delete failed:', calErr);
      }
    }

    return c.json(successResponse({ message: 'Stream deleted' }));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Delete Stream] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// POST /live/create-lesson - Create a lesson from a stream recording
live.post('/create-lesson', async (c) => {
  try {
    const session = await requireAuth(c);

    if (!['ADMIN', 'TEACHER', 'ACADEMY'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const { streamId, title, description, topicId, releaseDate, classId: targetClassId, maxWatchTimeMultiplier, watermarkIntervalMins } = await c.req.json();

    if (!streamId) {
      return c.json(errorResponse('streamId is required'), 400);
    }

    // Get the stream with class info (LEFT JOIN so orphaned/deleted-class streams still work)
    const stream = await c.env.DB.prepare(`
      SELECT ls.id, ls.classId, ls.teacherId, ls.status, ls.title, ls.startedAt, ls.endedAt, 
             ls.recordingId, ls.createdAt, ls.zoomLink, ls.zoomMeetingId, ls.zoomStartUrl, 
             ls.participantCount, ls.currentCount, ls.participantsFetchedAt,
             c.academyId, c.teacherId as classTeacherId, a.ownerId as academyOwnerId,
             CASE WHEN c.id IS NULL THEN 1 ELSE 0 END as classDeleted
      FROM LiveStream ls
      LEFT JOIN Class c ON ls.classId = c.id
      LEFT JOIN Academy a ON c.academyId = a.id
      WHERE ls.id = ?
    `).bind(streamId).first() as any;

    if (!stream) {
      return c.json(errorResponse('Stream not found'), 404);
    }

    // Verify ownership — for orphaned streams (class deleted), fall back to Teacher table
    let isOwner = false;
    if (session.role === 'ADMIN') {
      isOwner = true;
    } else if (session.role === 'TEACHER') {
      isOwner = stream.teacherId === session.id;
    } else if (session.role === 'ACADEMY') {
      if (!stream.classDeleted) {
        isOwner = stream.academyOwnerId === session.id;
      } else {
        // Class was deleted — verify teacher belongs to this academy via Teacher table
        const teacherInAcademy = await c.env.DB.prepare(
          `SELECT t.userId FROM Teacher t JOIN Academy a ON t.academyId = a.id WHERE t.userId = ? AND a.ownerId = ?`
        ).bind(stream.teacherId, session.id).first();
        isOwner = !!teacherInAcademy;
      }
    }

    if (!isOwner) {
      return c.json(errorResponse('Not authorized to create lesson from this stream'), 403);
    }

    // Determine final classId: use provided override or fall back to stream's classId
    const finalClassId = targetClassId || stream.classId;

    // Check if stream has a recording
    if (!stream.recordingId) {
      return c.json(errorResponse('El stream aún no tiene una grabación. Espera a que Zoom procese la grabación e inténtalo de nuevo.'), 400);
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
          return c.json(errorResponse(`La grabación "${stream.title || 'stream'}" no se encontró en Bunny. Es posible que haya sido eliminada.`), 404);
        }
      } catch (e) {
        console.error(`[Create Lesson] Failed to check Bunny status for ${guid}:`, e);
        return c.json(errorResponse(`Error al verificar la grabación "${stream.title || 'stream'}". Por favor inténtalo de nuevo.`), 500);
      }
    }

    // Warn if any video is still processing
    for (let i = 0; i < videoStatuses.length; i++) {
      const videoStatus = videoStatuses[i];
      if (videoStatus.status === 0 || videoStatus.status === 1 || videoStatus.status === 2 || videoStatus.status === 3) {
        return c.json(errorResponse(`La grabación "${stream.title}" aún se está procesando en Bunny. Por favor espera unos minutos e inténtalo de nuevo.`), 400);
      }
      if (videoStatus.status === 6) {
        return c.json(errorResponse(`La grabación "${stream.title}" tuvo un error al procesarse en Bunny. Por favor contacta a soporte.`), 400);
      }
    }

    const now = new Date().toISOString();

    // Create lesson ID
    const lessonId = crypto.randomUUID();

    // Determine lesson title
    const lessonTitle = title || stream.title || 'Grabación de clase en vivo';

    // Create Lesson record first
    await c.env.DB.prepare(`
      INSERT INTO Lesson (id, title, description, classId, topicId, releaseDate, maxWatchTimeMultiplier, watermarkIntervalMins, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      lessonId,
      lessonTitle,
      description || null,
      finalClassId,
      topicId || null,
      releaseDate || now,
      maxWatchTimeMultiplier ?? 2.0,
      watermarkIntervalMins ?? 5,
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
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Create Lesson from Stream] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
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

    const notified = enrollments.results.length;

    return c.json(successResponse({ notified, message: `${notified} estudiantes notificados` }));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Notify Students] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
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

    // Get per-class Zoom credentials (respects per-academy accounts and guards GTM streams)
    let zoomConfig: { ZOOM_ACCOUNT_ID?: string; ZOOM_CLIENT_ID?: string; ZOOM_CLIENT_SECRET?: string; accessToken?: string };
    const classZoomInfo = await c.env.DB
      .prepare('SELECT zoomAccountId FROM Class WHERE id = ?')
      .bind((stream as any).classId)
      .first<{ zoomAccountId: string | null }>();

    if (classZoomInfo?.zoomAccountId) {
      const zoomAccount = await c.env.DB
        .prepare('SELECT accessToken, refreshToken, expiresAt, provider FROM ZoomAccount WHERE id = ?')
        .bind(classZoomInfo.zoomAccountId)
        .first() as { accessToken: string; refreshToken: string; expiresAt: string; provider: string } | null;

      if (zoomAccount) {
        if (zoomAccount.provider === 'gotomeeting') {
          return c.json(errorResponse('Este stream usa GoToMeeting. Usa el botón "Sincronizar" en la lista de streams para sincronizar la grabación.'), 400);
        }
        let token = zoomAccount.accessToken;
        if (new Date(zoomAccount.expiresAt) <= new Date(Date.now() + 5 * 60 * 1000)) {
          const { refreshZoomToken } = await import('./zoom-accounts');
          token = (await refreshZoomToken(c, classZoomInfo.zoomAccountId)) ?? token;
        }
        zoomConfig = { accessToken: token };
      } else {
        return c.json(errorResponse('La cuenta de Zoom asociada a esta clase fue eliminada. Reasigna una cuenta de Zoom en la configuración de la clase.'), 400);
      }
    } else {
      zoomConfig = { ZOOM_ACCOUNT_ID: c.env.ZOOM_ACCOUNT_ID || '', ZOOM_CLIENT_ID: c.env.ZOOM_CLIENT_ID || '', ZOOM_CLIENT_SECRET: c.env.ZOOM_CLIENT_SECRET || '' };
    }

    // Check recording in Zoom
    const recordingData = await getZoomRecording((stream as any).zoomMeetingId as string, zoomConfig);
    
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


    // Get academy name for Bunny collection assignment
    let bunnyCollectionId: string | undefined;
    try {
      const academyRow = await c.env.DB
        .prepare('SELECT a.name FROM Academy a JOIN Class c ON c.academyId = a.id WHERE c.id = ?')
        .bind((stream as any).classId)
        .first() as any;

      if (academyRow?.name) {
        const collectionsRes = await fetch(
          `https://video.bunnycdn.com/library/${c.env.BUNNY_STREAM_LIBRARY_ID}/collections?itemsPerPage=100`,
          { headers: { 'AccessKey': c.env.BUNNY_STREAM_API_KEY } }
        );
        if (collectionsRes.ok) {
          const collectionsData = await collectionsRes.json() as any;
          const existing = (collectionsData.items || []).find((col: any) => col.name === academyRow.name);
          if (existing) {
            bunnyCollectionId = existing.guid;
          } else {
            const createRes = await fetch(
              `https://video.bunnycdn.com/library/${c.env.BUNNY_STREAM_LIBRARY_ID}/collections`,
              {
                method: 'POST',
                headers: { 'AccessKey': c.env.BUNNY_STREAM_API_KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: academyRow.name }),
              }
            );
            if (createRes.ok) {
              const createData = await createRes.json() as any;
              bunnyCollectionId = createData.guid;
            }
          }
        }
      }
    } catch (collectionError: any) {
      console.error('[Check Recording] Failed to get/create Bunny collection:', collectionError.message);
      // Continue without collection
    }

    // Upload each segment to Bunny Stream
    const bunnyGuids: string[] = [];
    
    for (let i = 0; i < mp4Files.length; i++) {
      const mp4File = mp4Files[i];
      const partSuffix = mp4Files.length > 1 ? ` - Parte ${i + 1}` : '';
      const videoTitle = `${(stream as any).title || 'Zoom Recording'}${partSuffix}`;

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

      const bunnyData = await bunnyResponse.json() as any;
      const bunnyGuid = bunnyData.guid || bunnyData.id;

      if (bunnyGuid) {
        bunnyGuids.push(bunnyGuid);

        // Apply academy collection if available
        if (bunnyCollectionId) {
          try {
            await fetch(
              `https://video.bunnycdn.com/library/${c.env.BUNNY_STREAM_LIBRARY_ID}/videos/${bunnyGuid}`,
              {
                method: 'POST',
                headers: { 'AccessKey': c.env.BUNNY_STREAM_API_KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify({ collectionId: bunnyCollectionId }),
              }
            );
          } catch (patchErr: any) {
            console.error('[Check Recording] Failed to set Bunny collection on video:', patchErr.message);
          }
        }
      } else {
        console.error(`[Check Recording] Bunny returned success but no GUID for segment ${i + 1}:`, bunnyData);
      }
    }

    if (bunnyGuids.length === 0) {
      return c.json(errorResponse('Failed to upload any recording segments to Bunny'), 502);
    }

    // Store single guid as string, multiple as JSON array (consistent with webhook)
    const recordingIds = bunnyGuids.length === 1 ? bunnyGuids[0] : JSON.stringify(bunnyGuids);
    
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
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Check Recording] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
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
               ls.currentCount, ls.participantsFetchedAt, ls.zoomMeetingId
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
      currentCount: stream.currentCount || 0,
      participantsFetchedAt: stream.participantsFetchedAt,
    }));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Get Participants] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// POST /live/:id/check-recording-gtm - Manually sync GTM cloud recording to Bunny
live.post('/:id/check-recording-gtm', async (c) => {
  try {
    const session = await requireAuth(c);

    if (!['ADMIN', 'TEACHER', 'ACADEMY'].includes(session.role)) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const streamId = c.req.param('id');
    const stream = await c.env.DB.prepare('SELECT * FROM LiveStream WHERE id = ?').bind(streamId).first() as any;
    if (!stream) return c.json(errorResponse('Stream not found'), 404);
    if (!stream.zoomMeetingId) return c.json(errorResponse('No GTM meeting ID on this stream'), 400);

    // Verify permission and get the GTM access token
    const classInfo = await c.env.DB
      .prepare('SELECT c.teacherId, c.zoomAccountId, a.ownerId FROM Class c JOIN Academy a ON c.academyId = a.id WHERE c.id = ?')
      .bind(stream.classId)
      .first() as any;

    if (!classInfo) return c.json(errorResponse('Class not found'), 404);
    if (session.role === 'TEACHER' && classInfo.teacherId !== session.id) {
      return c.json(errorResponse('Not authorized'), 403);
    }
    if (session.role === 'ACADEMY' && classInfo.ownerId !== session.id) {
      return c.json(errorResponse('Not authorized'), 403);
    }

    if (!classInfo.zoomAccountId) return c.json(errorResponse('No GTM account linked to this class'), 400);

    const zoomAccount = await c.env.DB
      .prepare('SELECT accessToken, refreshToken, expiresAt, provider FROM ZoomAccount WHERE id = ?')
      .bind(classInfo.zoomAccountId)
      .first() as any;

    if (!zoomAccount || zoomAccount.provider !== 'gotomeeting') {
      return c.json(errorResponse('No GoToMeeting account found'), 400);
    }

    let token = zoomAccount.accessToken;
    if (new Date(zoomAccount.expiresAt) <= new Date(Date.now() + 5 * 60 * 1000)) {
      const { refreshGTMToken } = await import('./zoom-accounts');
      const refreshed = await refreshGTMToken(c, classInfo.zoomAccountId);
      if (!refreshed) return c.json(errorResponse('GTM session expired — please reconnect the account'), 400);
      token = refreshed;
    }

    // GET /meetings/{meetingId}/recordings — returns GTM cloud recordings
    const recResp = await fetch(`https://api.getgo.com/G2M/rest/meetings/${stream.zoomMeetingId}/recordings`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
    });

    if (!recResp.ok) {
      const errBody = await recResp.text();
      console.error('[GTM Recording] Fetch failed:', recResp.status, errBody);
      if (recResp.status === 404) return c.json(errorResponse('No recording found for this GTM meeting yet'), 404);
      return c.json(errorResponse(`GTM recordings API error: ${errBody}`), 502);
    }

    const recData = await recResp.json() as any;
    // GTM /recordings response: { recordingList: [{ recordingId, downloadUrl, contentType, ... }] }
    const recordings = recData.recordingList || recData.recordings || (Array.isArray(recData) ? recData : []);
    const mp4Recordings = recordings.filter((r: any) =>
      (r.contentType || r.fileType || '').toLowerCase().includes('mp4') ||
      (r.downloadUrl || '').toLowerCase().includes('.mp4')
    );

    if (mp4Recordings.length === 0) {
      return c.json(errorResponse('No MP4 recording found in GTM yet. Cloud recording may still be processing.'), 404);
    }

    // Sort by start time if available
    mp4Recordings.sort((a: any, b: any) =>
      new Date(a.startDate || a.recordingStartTime || 0).getTime() -
      new Date(b.startDate || b.recordingStartTime || 0).getTime()
    );

    // Get or create Bunny collection for this academy
    let bunnyCollectionId: string | undefined;
    try {
      const academyRow = await c.env.DB
        .prepare('SELECT a.name FROM Academy a JOIN Class c ON c.academyId = a.id WHERE c.id = ?')
        .bind(stream.classId)
        .first() as any;

      if (academyRow?.name) {
        const collectionsRes = await fetch(
          `https://video.bunnycdn.com/library/${c.env.BUNNY_STREAM_LIBRARY_ID}/collections?itemsPerPage=100`,
          { headers: { 'AccessKey': c.env.BUNNY_STREAM_API_KEY } }
        );
        if (collectionsRes.ok) {
          const collectionsData = await collectionsRes.json() as any;
          const existing = (collectionsData.items || []).find((col: any) => col.name === academyRow.name);
          if (existing) {
            bunnyCollectionId = existing.guid;
          } else {
            const createRes = await fetch(
              `https://video.bunnycdn.com/library/${c.env.BUNNY_STREAM_LIBRARY_ID}/collections`,
              {
                method: 'POST',
                headers: { 'AccessKey': c.env.BUNNY_STREAM_API_KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: academyRow.name }),
              }
            );
            if (createRes.ok) {
              const createData = await createRes.json() as any;
              bunnyCollectionId = createData.guid;
            }
          }
        }
      }
    } catch (collectionError: any) {
      console.error('[GTM Recording] Failed to get/create Bunny collection:', collectionError.message);
    }

    // Upload each MP4 segment to Bunny Stream
    const bunnyGuids: string[] = [];
    for (let i = 0; i < mp4Recordings.length; i++) {
      const rec = mp4Recordings[i];
      const partSuffix = mp4Recordings.length > 1 ? ` - Parte ${i + 1}` : '';
      const videoTitle = `${stream.title || 'GTM Recording'}${partSuffix}`;

      // GTM recordings require auth token for download
      const downloadUrl: string = rec.downloadUrl || rec.download_url || '';
      if (!downloadUrl) {
        console.error(`[GTM Recording] No downloadUrl on recording ${i + 1}`);
        continue;
      }

      // Append GTM access token as query param (GTM requires auth for download)
      const authedUrl = downloadUrl.includes('?')
        ? `${downloadUrl}&access_token=${token}`
        : `${downloadUrl}?access_token=${token}`;

      const bunnyResponse = await fetch(`https://video.bunnycdn.com/library/${c.env.BUNNY_STREAM_LIBRARY_ID}/videos/fetch`, {
        method: 'POST',
        headers: { 'AccessKey': c.env.BUNNY_STREAM_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: authedUrl, title: videoTitle }),
      });

      if (!bunnyResponse.ok) {
        const errorText = await bunnyResponse.text();
        console.error(`[GTM Recording] Bunny fetch failed for segment ${i + 1}:`, errorText);
        continue;
      }

      const bunnyData = await bunnyResponse.json() as any;
      const bunnyGuid = bunnyData.guid || bunnyData.id;
      if (bunnyGuid) {
        bunnyGuids.push(bunnyGuid);

        if (bunnyCollectionId) {
          try {
            await fetch(`https://video.bunnycdn.com/library/${c.env.BUNNY_STREAM_LIBRARY_ID}/videos/${bunnyGuid}`, {
              method: 'POST',
              headers: { 'AccessKey': c.env.BUNNY_STREAM_API_KEY, 'Content-Type': 'application/json' },
              body: JSON.stringify({ collectionId: bunnyCollectionId }),
            });
          } catch (patchErr: any) {
            console.error('[GTM Recording] Failed to set Bunny collection:', patchErr.message);
          }
        }
      }
    }

    if (bunnyGuids.length === 0) {
      return c.json(errorResponse('Failed to upload any GTM recording segments to Bunny'), 502);
    }

    const recordingIds = bunnyGuids.length === 1 ? bunnyGuids[0] : JSON.stringify(bunnyGuids);

    await c.env.DB
      .prepare('UPDATE LiveStream SET recordingId = ?, status = ? WHERE id = ?')
      .bind(recordingIds, 'ended', streamId)
      .run();

    return c.json(successResponse({
      message: `GTM recording synced successfully (${bunnyGuids.length} segment${bunnyGuids.length > 1 ? 's' : ''})`,
      recordingIds: bunnyGuids,
      segmentCount: bunnyGuids.length,
    }));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[GTM Check Recording] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

export default live;
