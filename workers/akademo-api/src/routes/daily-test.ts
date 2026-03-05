import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';

const dailyTest = new Hono<{ Bindings: Bindings }>();

interface DailyRoom {
  name: string;
  url: string;
}

interface DailyToken {
  token: string;
}

interface DailyTestRoomRow {
  id: string;
  roomName: string;
  roomUrl: string;
  createdAt: string;
  recordingId?: string;
  recordingStatus?: string;
}

// POST /daily-test/rooms - Create a Daily.co room and return host embed URL
dailyTest.post('/rooms', async (c) => {
  const session = await requireAuth(c);
  if (!['TEACHER', 'ACADEMY', 'ADMIN'].includes(session.role)) {
    return c.json(errorResponse('Not authorized'), 403);
  }

  const apiKey = c.env.DAILY_API_KEY;
  if (!apiKey) {
    return c.json(errorResponse('Daily.co not configured — set DAILY_API_KEY secret'), 500);
  }

  // Generate a short room name with timestamp
  const roomName = `akademo-${Date.now().toString(36)}`;

  // Create room via Daily.co REST API
  const roomRes = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: roomName,
      properties: {
        enable_screenshare: true,
        enable_chat: true,
        enable_recording: 'cloud',
        start_video_off: false,
        start_audio_off: false,
        // Room expires after 4 hours
        exp: Math.floor(Date.now() / 1000) + 4 * 60 * 60,
      },
    }),
  });

  if (!roomRes.ok) {
    const err = await roomRes.text();
    console.error('[Daily Test] Create room error:', err);
    return c.json(errorResponse(`Failed to create Daily.co room: ${err}`), 500);
  }

  const room = await roomRes.json() as DailyRoom;

  // Generate owner/host token
  const tokenRes = await fetch('https://api.daily.co/v1/meeting-tokens', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        is_owner: true,
        enable_screenshare: true,
        start_video_off: false,
        start_audio_off: false,
        user_name: `${session.firstName} ${session.lastName}`.trim() || session.email,
        exp: Math.floor(Date.now() / 1000) + 4 * 60 * 60,
      },
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error('[Daily Test] Create token error:', err);
    return c.json(errorResponse('Failed to create host token'), 500);
  }

  const tokenData = await tokenRes.json() as DailyToken;

  // Persist room so students can discover it
  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    'INSERT INTO DailyTestRoom (id, roomName, roomUrl, status, createdAt) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, roomName, room.url, 'active', new Date().toISOString()).run();

  return c.json(successResponse({
    id,
    roomName,
    roomUrl: room.url,
    embedUrl: `${room.url}?t=${tokenData.token}`,
  }), 201);
});

// GET /daily-test/rooms - List active rooms (all authenticated roles)
dailyTest.get('/rooms', async (c) => {
  await requireAuth(c);

  const result = await c.env.DB.prepare(
    "SELECT id, roomName, roomUrl, createdAt FROM DailyTestRoom WHERE status = 'active' ORDER BY createdAt DESC LIMIT 10"
  ).all<DailyTestRoomRow>();

  return c.json(successResponse(result.results || []));
});

// POST /daily-test/token - Get a participant or owner meeting token
dailyTest.post('/token', async (c) => {
  const session = await requireAuth(c);
  const body = await c.req.json<{ roomName: string }>();
  const { roomName } = body;
  if (!roomName) return c.json(errorResponse('roomName required'), 400);

  const apiKey = c.env.DAILY_API_KEY;
  if (!apiKey) return c.json(errorResponse('Daily.co not configured'), 500);

  const isOwner = ['TEACHER', 'ACADEMY', 'ADMIN'].includes(session.role);

  const tokenRes = await fetch('https://api.daily.co/v1/meeting-tokens', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        is_owner: isOwner,
        enable_screenshare: true,
        start_video_off: false,
        start_audio_off: false,
        user_name: `${session.firstName} ${session.lastName}`.trim() || session.email,
        exp: Math.floor(Date.now() / 1000) + 4 * 60 * 60,
      },
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error('[Daily Test] Token error:', err);
    return c.json(errorResponse('Failed to create meeting token'), 500);
  }

  const tokenData = await tokenRes.json() as DailyToken;
  return c.json(successResponse({ token: tokenData.token, isOwner }));
});

// DELETE /daily-test/rooms/:id - End/delete a test room and trigger recording upload
dailyTest.delete('/rooms/:id', async (c) => {
  const session = await requireAuth(c);
  if (!['TEACHER', 'ACADEMY', 'ADMIN'].includes(session.role)) {
    return c.json(errorResponse('Not authorized'), 403);
  }

  const id = c.req.param('id');
  const room = await c.env.DB.prepare(
    'SELECT id, roomName FROM DailyTestRoom WHERE id = ?'
  ).bind(id).first<{ id: string; roomName: string }>();

  if (!room) return c.json(errorResponse('Room not found'), 404);

  const apiKey = c.env.DAILY_API_KEY;
  if (apiKey) {
    // Best-effort: delete room from Daily.co (this also stops any active recording)
    await fetch(`https://api.daily.co/v1/rooms/${room.roomName}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${apiKey}` },
    }).catch(() => {/* ignore */});
  }

  await c.env.DB.prepare(
    "UPDATE DailyTestRoom SET status = 'ended', recordingStatus = 'processing' WHERE id = ?"
  ).bind(id).run();

  // Kick off recording upload in the background (waitUntil keeps the worker alive)
  const env = c.env;
  const ctx = c.executionCtx;
  ctx.waitUntil((async () => {
    if (!apiKey) return;
    try {
      // Daily.co needs a moment to finalize the recording after the room is deleted.
      // Poll up to 10 times with 6-second gaps (total ~1 minute).
      let recordingId: string | null = null;
      for (let attempt = 0; attempt < 10; attempt++) {
        await new Promise(r => setTimeout(r, 6000));

        const listRes = await fetch(
          `https://api.daily.co/v1/recordings?room_name=${room.roomName}`,
          { headers: { 'Authorization': `Bearer ${apiKey}` } }
        );
        if (!listRes.ok) continue;

        const listData = await listRes.json() as { data: Array<{ id: string; status: string }> };
        const finished = (listData.data || []).find(r => r.status === 'finished');
        if (finished) {
          recordingId = finished.id;
          break;
        }
      }

      if (!recordingId) {
        console.log(`[Daily Recording] No finished recording found for room ${room.roomName}`);
        await env.DB.prepare(
          "UPDATE DailyTestRoom SET recordingStatus = 'none' WHERE id = ?"
        ).bind(id).run();
        return;
      }

      // Get a temporary download link
      const linkRes = await fetch(
        `https://api.daily.co/v1/recordings/${recordingId}/access-link`,
        { headers: { 'Authorization': `Bearer ${apiKey}` } }
      );
      if (!linkRes.ok) {
        console.error('[Daily Recording] Failed to get access link:', await linkRes.text());
        await env.DB.prepare(
          "UPDATE DailyTestRoom SET recordingStatus = 'error' WHERE id = ?"
        ).bind(id).run();
        return;
      }

      const linkData = await linkRes.json() as { download_link: string };

      // Fetch the recording into Bunny
      const videoTitle = `Daily.co Recording — ${room.roomName} — ${new Date().toLocaleDateString()}`;
      const bunnyRes = await fetch(
        `https://video.bunnycdn.com/library/${env.BUNNY_STREAM_LIBRARY_ID}/videos/fetch`,
        {
          method: 'POST',
          headers: {
            'AccessKey': env.BUNNY_STREAM_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: linkData.download_link, title: videoTitle }),
        }
      );

      if (!bunnyRes.ok) {
        console.error('[Daily Recording] Bunny fetch failed:', await bunnyRes.text());
        await env.DB.prepare(
          "UPDATE DailyTestRoom SET recordingStatus = 'error' WHERE id = ?"
        ).bind(id).run();
        return;
      }

      const bunnyData = await bunnyRes.json() as any;
      const videoGuid: string = bunnyData.guid || bunnyData.videoGuid || bunnyData.id;

      if (videoGuid) {
        await env.DB.prepare(
          "UPDATE DailyTestRoom SET recordingId = ?, recordingStatus = 'ready' WHERE id = ?"
        ).bind(videoGuid, id).run();
        console.log(`[Daily Recording] Uploaded to Bunny: ${videoGuid} for room ${id}`);
      } else {
        console.error('[Daily Recording] No GUID in Bunny response:', JSON.stringify(bunnyData));
        await env.DB.prepare(
          "UPDATE DailyTestRoom SET recordingStatus = 'error' WHERE id = ?"
        ).bind(id).run();
      }
    } catch (err: any) {
      console.error('[Daily Recording] Upload error:', err.message);
      await env.DB.prepare(
        "UPDATE DailyTestRoom SET recordingStatus = 'error' WHERE id = ?"
      ).bind(id).run();
    }
  })());

  return c.json(successResponse({ ended: true }));
});

// GET /daily-test/rooms/:id/recording - Get recording info for a room
dailyTest.get('/rooms/:id/recording', async (c) => {
  await requireAuth(c);

  const id = c.req.param('id');
  const room = await c.env.DB.prepare(
    'SELECT id, recordingId, recordingStatus FROM DailyTestRoom WHERE id = ?'
  ).bind(id).first<{ id: string; recordingId?: string; recordingStatus?: string }>();

  if (!room) return c.json(errorResponse('Room not found'), 404);

  if (!room.recordingId) {
    return c.json(successResponse({ available: false, recordingStatus: room.recordingStatus || 'none' }));
  }

  const cdnHostname = c.env.BUNNY_STREAM_CDN_HOSTNAME;
  return c.json(successResponse({
    available: true,
    recordingId: room.recordingId,
    playUrl: `https://${cdnHostname}/${room.recordingId}/play_720p.mp4`,
    embedUrl: `https://iframe.mediadelivery.net/embed/${c.env.BUNNY_STREAM_LIBRARY_ID}/${room.recordingId}`,
    recordingStatus: room.recordingStatus,
  }));
});

export default dailyTest;
