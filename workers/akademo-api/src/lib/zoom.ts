// Zoom API client for Server-to-Server OAuth
// Docs: https://developers.zoom.us/docs/api/

export interface ZoomConfig {
  ZOOM_ACCOUNT_ID?: string;
  ZOOM_CLIENT_ID?: string;
  ZOOM_CLIENT_SECRET?: string;
  accessToken?: string; // Custom access token (for academy-owned accounts)
}

// Cache for access token (per-request, not truly persistent in Workers)
let cachedToken: { token: string; expiresAt: number } | null = null;

// Get OAuth access token using Server-to-Server OAuth or use provided token
export async function getAccessToken(config?: ZoomConfig): Promise<string> {
  // If custom access token provided, use it directly
  if (config?.accessToken) {
    return config.accessToken;
  }

  // Check if we have a valid cached token
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  if (!config || !config.ZOOM_ACCOUNT_ID || !config.ZOOM_CLIENT_ID || !config.ZOOM_CLIENT_SECRET) {
    throw new Error('Zoom configuration required to fetch access token');
  }

  
  const credentials = btoa(`${config.ZOOM_CLIENT_ID}:${config.ZOOM_CLIENT_SECRET}`);
  
  const response = await fetch('https://zoom.us/oauth/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=account_credentials&account_id=${config.ZOOM_ACCOUNT_ID}`,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[Zoom] OAuth error:', error);
    throw new Error(`Failed to get Zoom access token: ${error}`);
  }

  const data = await response.json() as any;
  
  // Cache the token (expires in ~1 hour, we cache for 50 minutes to be safe)
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (50 * 60 * 1000), // 50 minutes
  };

  return data.access_token;
}

export interface ZoomMeeting {
  id: number;
  uuid: string;
  topic: string;
  start_url: string;  // Host URL (to start the meeting)
  join_url: string;   // Participant URL (to join)
  password?: string;
  duration: number;
  created_at: string;
}

export interface CreateMeetingOptions {
  topic: string;
  duration?: number; // in minutes, default 60
  password?: string;
  waitingRoom?: boolean;
  startTime?: string; // ISO 8601 e.g. "2024-11-30T10:00:00Z" — schedules the meeting for a specific date/time
  config: ZoomConfig; // Required: pass env config
}

// Create a new Zoom meeting
export async function createZoomMeeting(options: CreateMeetingOptions): Promise<ZoomMeeting> {
  const token = await getAccessToken(options.config);

  // Fetch the account's authentication profiles to get the correct profile ID.
  // meeting_authentication: true is silently ignored by Zoom without a valid authentication_option ID.
  let authenticationOption: string | null = null;
  try {
    const profilesRes = await fetch('https://api.zoom.us/v2/accounts/me/settings/meeting_authentication', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (profilesRes.ok) {
      const profilesData = await profilesRes.json() as any;
      const profiles: any[] = profilesData.authentication_options ?? [];
      // Prefer a profile that allows any Zoom user (not restricted to specific domains)
      const profile = profiles.find((p: any) => p.type === 'enforce_login') ?? profiles[0] ?? null;
      authenticationOption = profile?.id ?? null;
      console.log('[Zoom] Auth profiles:', JSON.stringify(profiles.map((p: any) => ({ id: p.id, type: p.type, name: p.name }))));
    } else {
      console.warn('[Zoom] Could not fetch auth profiles:', profilesRes.status, await profilesRes.text());
    }
  } catch (e: any) {
    console.warn('[Zoom] Failed to fetch auth profiles:', e.message);
  }

  // Create meeting using /users/me/meetings (OAuth user-managed app)
  // This works with meeting:write:meeting scope (no :admin needed)
  const meetingResponse = await fetch('https://api.zoom.us/v2/users/me/meetings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topic: options.topic,
      type: options.startTime ? 2 : 1, // 1 = Instant, 2 = Scheduled
      ...(options.startTime ? { start_time: options.startTime } : {}),
      duration: options.duration || 60,
      settings: {
        waiting_room: true, // Teacher manually admits participants from Zoom app
        join_before_host: false,
        mute_upon_entry: true,
        auto_recording: 'cloud',
        embed_password_in_join_link: true,
        watermark: true,
        enforce_login: true,
        meeting_authentication: true,
        ...(authenticationOption ? { authentication_option: authenticationOption } : {}),
      },
    }),
  });

  if (!meetingResponse.ok) {
    const error = await meetingResponse.text();
    console.error('[Zoom] ❌ Create meeting error:', error);
    console.error('[Zoom] Status:', meetingResponse.status);
    throw new Error(`Failed to create Zoom meeting: ${error}`);
  }

  const meeting = await meetingResponse.json() as ZoomMeeting;

  // Log full settings response to diagnose watermark and authentication issues.
  console.log('[Zoom] Meeting created — full settings echo:', JSON.stringify({
    id: (meeting as any).id,
    settings: (meeting as any).settings,
  }));
  
  return meeting;
}

// Delete a meeting
// Pass config.accessToken to use a specific class-level Zoom OAuth token; omit to use the global token
export async function deleteZoomMeeting(meetingId: string | number, config?: { accessToken?: string }): Promise<void> {
  const token = config?.accessToken ?? await getAccessToken();
  
  const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok && response.status !== 404) {
    const error = await response.text();
    throw new Error(`Failed to delete Zoom meeting: ${error}`);
  }
}

// Get download URL with access token appended
export async function getZoomRecordingDownloadUrl(downloadUrl: string, config?: ZoomConfig): Promise<string> {
  const token = await getAccessToken(config);
  // Append access token to download URL for authentication
  const separator = downloadUrl.includes('?') ? '&' : '?';
  return `${downloadUrl}${separator}access_token=${token}`;
}

// Get meeting recordings
export async function getZoomRecording(meetingId: string, config: ZoomConfig): Promise<any> {
  const token = await getAccessToken(config);
  
  // Use past_meetings endpoint to find the uuid if needed, or query recordings directly
  
  const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}/recordings`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[Zoom] Failed to get recordings:', error);
    // If 404, it might mean no recording exists yet
    if (response.status === 404) return null;
    throw new Error(`Failed to get Zoom recordings: ${error}`);
  }

  const data = await response.json();
  return data;
}

