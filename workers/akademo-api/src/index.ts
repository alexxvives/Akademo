import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
    console.error('[Teacher Academy] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// PATCH /teacher/tutorial-seen - Mark onboarding tutorial as seen (persisted in DB)
app.patch('/teacher/tutorial-seen', async (c) => {
  try {
    const session = await requireAuth(c);
    if (session.role !== 'TEACHER') {
      return c.json(errorResponse('Only teachers can use this endpoint'), 403);
    }
    await c.env.DB
      .prepare('UPDATE Teacher SET tutorialSeenAt = ? WHERE userId = ?')
      .bind(new Date().toISOString(), session.id)
      .run();
    return c.json(successResponse({ ok: true }));
  } catch (error: unknown) {
    console.error('[Teacher Tutorial] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// GET /teacher/tutorial-status - Check if tutorial has been seen
app.get('/teacher/tutorial-status', async (c) => {
  try {
    const session = await requireAuth(c);
    if (session.role !== 'TEACHER') {
      return c.json(errorResponse('Only teachers can use this endpoint'), 403);
    }
      } catch (error) {
        console.error(`[Cron] Error creating payment for enrollment ${enrollment.enrollmentId}:`, error);
      }
    }

    console.log(`[Cron] Created ${created} pending payment(s)`);
  } catch (error) {
    console.error('[Cron] Error in monthly payment generation:', error);
  }
}

// ============ Orphan Cleanup ============
// Deletes R2 objects that have no matching Upload row in D1.
// Runs daily — only removes objects older than 24 hours to avoid
// racing with in-progress uploads.
async function handleOrphanCleanup(env: Bindings) {
  console.log('[Cleanup] Orphan R2 object scan started');
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const cutoff = new Date(Date.now() - ONE_DAY_MS);
  let deleted = 0;
  let scanned = 0;
  let cursor: string | undefined;

  try {
    do {
      const listed = await env.STORAGE.list({ limit: 500, cursor });
      for (const obj of listed.objects) {
        scanned++;
        // Skip objects newer than 24h — they may still be in-progress
        if (obj.uploaded && new Date(obj.uploaded) > cutoff) continue;

        // Check if a matching Upload record exists
        const row = await env.DB
          .prepare('SELECT id FROM Upload WHERE storagePath = ? LIMIT 1')
          .bind(obj.key)
          .first();

        if (!row) {
          await env.STORAGE.delete(obj.key);
          deleted++;
          console.log(`[Cleanup] Deleted orphan: ${obj.key}`);
        }
      }
      cursor = listed.truncated ? listed.cursor : undefined;
    } while (cursor);

    console.log(`[Cleanup] Done — scanned ${scanned}, deleted ${deleted} orphan(s)`);
  } catch (error) {
    console.error('[Cleanup] Error during orphan scan:', error);
  }
}

// Export handler that supports both HTTP requests and scheduled events
export default {
  fetch: app.fetch,
  scheduled: async (event: any, env: Bindings, ctx: any) => {
    ctx.waitUntil(handleOrphanCleanup(env));
  },
};
