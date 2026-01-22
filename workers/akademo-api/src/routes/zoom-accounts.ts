import { Hono } from 'hono';
import type { Context } from '../types';
import { verifySession } from '../lib/auth';
import { errorResponse } from '../lib/utils';
import { generateId } from '../lib/id';

const zoomAccounts = new Hono<Context>();

// Get all Zoom accounts for the academy
zoomAccounts.get('/', async (c) => {
  const session = await verifySession(c);
  if (!session) return errorResponse('Not authorized', 401);
  if (session.role !== 'ACADEMY') return errorResponse('Forbidden', 403);

  try {
    // Get academy ID
    const academyResult = await c.env.DB.prepare(
      'SELECT id FROM Academy WHERE ownerId = ?'
    ).bind(session.id).first();

    if (!academyResult) return errorResponse('Academy not found', 404);

    const accounts = await c.env.DB.prepare(
      'SELECT id, academyId, accountName, accountId, createdAt FROM ZoomAccount WHERE academyId = ?'
    ).bind(academyResult.id).all();

    return c.json({ success: true, data: accounts.results || [] });
  } catch (error) {
    console.error('Error fetching Zoom accounts:', error);
    return errorResponse('Failed to fetch Zoom accounts', 500);
  }
});

// Delete a Zoom account
zoomAccounts.delete('/:id', async (c) => {
  const session = await verifySession(c);
  if (!session) return errorResponse('Not authorized', 401);
  if (session.role !== 'ACADEMY') return errorResponse('Forbidden', 403);

  const accountId = c.req.param('id');

  try {
    // Get academy ID
    const academyResult = await c.env.DB.prepare(
      'SELECT id FROM Academy WHERE ownerId = ?'
    ).bind(session.id).first();

    if (!academyResult) return errorResponse('Academy not found', 404);

    // Verify ownership
    const account = await c.env.DB.prepare(
      'SELECT id FROM ZoomAccount WHERE id = ? AND academyId = ?'
    ).bind(accountId, academyResult.id).first();

    if (!account) return errorResponse('Zoom account not found', 404);

    // Delete the account
    await c.env.DB.prepare(
      'DELETE FROM ZoomAccount WHERE id = ?'
    ).bind(accountId).run();

    // Unassign from classes
    await c.env.DB.prepare(
      'UPDATE Class SET zoomAccountId = NULL WHERE zoomAccountId = ?'
    ).bind(accountId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting Zoom account:', error);
    return errorResponse('Failed to delete Zoom account', 500);
  }
});

// OAuth callback handler
zoomAccounts.post('/oauth/callback', async (c) => {
  try {
    const { code, state } = await c.req.json();
    const academyId = state;

    if (!code || !academyId) {
      return errorResponse('Missing required parameters', 400);
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://zoom.us/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${c.env.ZOOM_CLIENT_ID}:${c.env.ZOOM_CLIENT_SECRET}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${c.req.header('origin')}/api/zoom/oauth/callback`
      })
    });

    if (!tokenResponse.ok) {
      console.error('Zoom token exchange failed:', await tokenResponse.text());
      return errorResponse('Failed to exchange code for tokens', 500);
    }

    const tokens = await tokenResponse.json() as any;

    // Get Zoom account info
    const userResponse = await fetch('https://api.zoom.us/v2/users/me', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    });

    if (!userResponse.ok) {
      return errorResponse('Failed to fetch Zoom user info', 500);
    }

    const userInfo = await userResponse.json() as any;

    // Store tokens in database
    const accountId = generateId();
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    await c.env.DB.prepare(`
      INSERT INTO ZoomAccount (id, academyId, accountName, accessToken, refreshToken, expiresAt, accountId)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      accountId,
      academyId,
      userInfo.first_name + ' ' + userInfo.last_name,
      tokens.access_token,
      tokens.refresh_token,
      expiresAt,
      userInfo.account_id
    ).run();

    return c.json({ success: true, data: { id: accountId } });
  } catch (error) {
    console.error('OAuth callback error:', error);
    return errorResponse('OAuth callback failed', 500);
  }
});

// Refresh token helper (internal use)
async function refreshZoomToken(c: Context, accountId: string): Promise<string | null> {
  try {
    const account = await c.env.DB.prepare(
      'SELECT accessToken, refreshToken, expiresAt FROM ZoomAccount WHERE id = ?'
    ).bind(accountId).first() as any;

    if (!account) return null;

    // Check if token is still valid
    const expiresAt = new Date(account.expiresAt);
    if (expiresAt > new Date(Date.now() + 5 * 60 * 1000)) {
      return account.accessToken;
    }

    // Refresh token
    const tokenResponse = await fetch('https://zoom.us/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${c.env.ZOOM_CLIENT_ID}:${c.env.ZOOM_CLIENT_SECRET}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: account.refreshToken
      })
    });

    if (!tokenResponse.ok) {
      console.error('Failed to refresh token');
      return null;
    }

    const tokens = await tokenResponse.json() as any;
    const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    await c.env.DB.prepare(`
      UPDATE ZoomAccount 
      SET accessToken = ?, refreshToken = ?, expiresAt = ?, updatedAt = datetime('now')
      WHERE id = ?
    `).bind(tokens.access_token, tokens.refresh_token, newExpiresAt, accountId).run();

    return tokens.access_token;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

export { zoomAccounts, refreshZoomToken };
