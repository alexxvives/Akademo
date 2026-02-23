import { Hono } from 'hono';
import { Bindings } from '../types';
import { getSession } from '../lib/auth';
import { errorResponse, successResponse } from '../lib/utils';
import type { Context } from 'hono';

const zoomAccounts = new Hono<{ Bindings: Bindings }>();

// Get all Zoom accounts for the academy
zoomAccounts.get('/', async (c) => {
  const session = await getSession(c);
  if (!session) return c.json(errorResponse('Not authorized'), 401);
  if (session.role !== 'ACADEMY') return c.json(errorResponse('Forbidden'), 403);

  try {
    // Get academy ID
    const academyResult = await c.env.DB.prepare(
      'SELECT id FROM Academy WHERE ownerId = ?'
    ).bind(session.id).first();

    if (!academyResult) return c.json(errorResponse('Academy not found'), 404);

    const accounts = await c.env.DB.prepare(
      'SELECT id, academyId, accountName, accountId, createdAt FROM ZoomAccount WHERE academyId = ?'
    ).bind(academyResult.id).all();

    // For each account, get the classes that use it
    const accountsWithClasses = await Promise.all(
      (accounts.results || []).map(async (account: any) => {
        const classes = await c.env.DB.prepare(
          'SELECT id, name, startDate FROM Class WHERE zoomAccountId = ?'
        ).bind(account.id).all();
        
        return {
          ...account,
          classes: classes.results || []
        };
      })
    );

    return c.json({ success: true, data: accountsWithClasses });
  } catch (error) {
    console.error('Error fetching Zoom accounts:', error);
    return c.json(errorResponse('Failed to fetch Zoom accounts'), 500);
  }
});

// Delete a Zoom account
zoomAccounts.delete('/:id', async (c) => {
  const session = await getSession(c);
  if (!session) return c.json(errorResponse('Not authorized'), 401);
  if (session.role !== 'ACADEMY') return c.json(errorResponse('Forbidden'), 403);

  const accountId = c.req.param('id');

  try {
    // Get academy ID
    const academyResult = await c.env.DB.prepare(
      'SELECT id FROM Academy WHERE ownerId = ?'
    ).bind(session.id).first();

    if (!academyResult) return c.json(errorResponse('Academy not found'), 404);

    // Verify ownership
    const account = await c.env.DB.prepare(
      'SELECT id FROM ZoomAccount WHERE id = ? AND academyId = ?'
    ).bind(accountId, academyResult.id).first();

    if (!account) return c.json(errorResponse('Zoom account not found'), 404);

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
    return c.json(errorResponse('Failed to delete Zoom account'), 500);
  }
});

// OAuth callback handler
zoomAccounts.post('/oauth/callback', async (c) => {
  try {
    const { code, state } = await c.req.json();
    const academyId = state;

    if (!code || !academyId) {
      return c.json(errorResponse('Missing required parameters'), 400);
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
        redirect_uri: 'https://akademo-edu.com/api/zoom/oauth/callback'
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Zoom token exchange failed:', errorText);
      return c.json(errorResponse(`Failed to exchange code for tokens: ${errorText}`), 500);
    }

    const tokens = await tokenResponse.json() as any;

    // Get Zoom account info
    const userResponse = await fetch('https://api.zoom.us/v2/users/me', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    });

    if (!userResponse.ok) {
      return c.json(errorResponse('Failed to fetch Zoom user info'), 500);
    }

    const userInfo = await userResponse.json() as any;

    // Store tokens in database - use email as account name
    const accountName = userInfo.email || `${userInfo.first_name} ${userInfo.last_name}`;
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Check if account already exists (upsert pattern)
    const existingAccount = await c.env.DB.prepare(`
      SELECT id FROM ZoomAccount WHERE accountId = ?
    `).bind(userInfo.account_id).first() as any;

    if (existingAccount) {
      // Update existing account
      await c.env.DB.prepare(`
        UPDATE ZoomAccount 
        SET accountName = ?, accessToken = ?, refreshToken = ?, expiresAt = ?, academyId = ?
        WHERE accountId = ?
      `).bind(
        accountName,
        tokens.access_token,
        tokens.refresh_token,
        expiresAt,
        academyId,
        userInfo.account_id
      ).run();
      
      return c.json({ success: true, data: { id: existingAccount.id } });
    } else {
      // Insert new account
      const newAccountId = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT INTO ZoomAccount (id, academyId, accountName, accessToken, refreshToken, expiresAt, accountId)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        newAccountId,
        academyId,
        accountName,
        tokens.access_token,
        tokens.refresh_token,
        expiresAt,
        userInfo.account_id
      ).run();
      
      return c.json({ success: true, data: { id: newAccountId } });
    }
  } catch (error) {
    console.error('OAuth callback error:', error);
    return c.json(errorResponse('OAuth callback failed'), 500);
  }
});

// Refresh token helper (internal use)
async function refreshZoomToken(c: Context<{ Bindings: Bindings }>, accountId: string): Promise<string | null> {
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

// GET /zoom-accounts/refresh-name/:id - Refresh account name from Zoom API
zoomAccounts.get('/refresh-name/:id', async (c) => {
  try {
    const accountId = c.req.param('id');

    // Get account from database
    const account = await c.env.DB.prepare(
      'SELECT * FROM ZoomAccount WHERE id = ?'
    ).bind(accountId).first() as any;

    if (!account) {
      return c.json(errorResponse('Zoom account not found'), 404);
    }

    // Fetch user info from Zoom API
    const userResponse = await fetch('https://api.zoom.us/v2/users/me', {
      headers: {
        'Authorization': `Bearer ${account.accessToken}`,
      },
    });

    if (!userResponse.ok) {
      return c.json(errorResponse('Failed to fetch Zoom user info'), 500);
    }

    const userInfo = await userResponse.json() as any;
    const accountName = userInfo.email || `${userInfo.first_name} ${userInfo.last_name}`;

    // Update account name
    await c.env.DB.prepare(
      'UPDATE ZoomAccount SET accountName = ? WHERE id = ?'
    ).bind(accountName, accountId).run();

    return c.json(successResponse({ accountName }));
  } catch (error: any) {
    console.error('Refresh name error:', error);
    return c.json(errorResponse('Failed to refresh account name'), 500);
  }
});

export { zoomAccounts, refreshZoomToken };
