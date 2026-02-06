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

  const data = await response.json();
  
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
  config: ZoomConfig; // Required: pass env config
}

// Create a new Zoom meeting
export async function createZoomMeeting(options: CreateMeetingOptions): Promise<ZoomMeeting> {
  const token = await getAccessToken(options.config);
  
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
      type: 2, // Scheduled meeting
      duration: options.duration || 60,
      settings: {
        waiting_room: options.waitingRoom ?? false,
        join_before_host: false, // Students must wait for teacher to start the meeting
        mute_upon_entry: true,
        auto_recording: 'cloud', // Auto-record to cloud
        embed_password_in_join_link: true, // CRITICAL: Allows SDK to extract password automatically
        meeting_authentication: true, // Enforce authenticated users only (account-level setting required)
        watermark: true, // Enable watermark overlay (shows participant email on video/shared content)
      },
    }),
  });

  if (!meetingResponse.ok) {
    const error = await meetingResponse.text();
    console.error('[Zoom] ❌ Create meeting error:', error);
    console.error('[Zoom] Status:', meetingResponse.status);
    throw new Error(`Failed to create Zoom meeting: ${error}`);
  }

  const meeting = await meetingResponse.json();
  
  return meeting;
}

// Get meeting details
export async function getZoomMeeting(meetingId: string | number): Promise<ZoomMeeting> {
  const token = await getAccessToken();
  
  const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Zoom meeting: ${error}`);
  }

  return response.json();
}

// Delete a meeting
export async function deleteZoomMeeting(meetingId: string | number): Promise<void> {
  const token = await getAccessToken();
  
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

// End a meeting (if it's in progress)
export async function endZoomMeeting(meetingId: string | number): Promise<void> {
  const token = await getAccessToken();
  
  const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}/status`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'end' }),
  });

  // 404 means meeting already ended or doesn't exist, which is fine
  if (!response.ok && response.status !== 404) {
    const error = await response.text();
    throw new Error(`Failed to end Zoom meeting: ${error}`);
  }
}

// Get recordings for a meeting
export interface ZoomRecording {
  id: string;
  meeting_id: string;
  recording_start: string;
  recording_end: string;
  file_type: string;
  file_size: number;
  play_url: string;
  download_url: string;
  status: string;
  recording_type: string;
}

export interface ZoomRecordingsResponse {
  uuid: string;
  id: number;
  host_email: string;
  topic: string;
  start_time: string;
  duration: number;
  total_size: number;
  recording_count: number;
  recording_files: ZoomRecording[];
  download_access_token?: string;
}

// Get recordings for a specific meeting
export async function getZoomMeetingRecordings(meetingId: string | number): Promise<ZoomRecordingsResponse | null> {
  const token = await getAccessToken();
  
  const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}/recordings`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (response.status === 404) {
    return null; // No recordings yet
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Zoom recordings: ${error}`);
  }

  return response.json();
}

// Get download URL with access token appended
export async function getZoomRecordingDownloadUrl(downloadUrl: string, config?: ZoomConfig): Promise<string> {
  const token = await getAccessToken(config);
  // Append access token to download URL for authentication
  const separator = downloadUrl.includes('?') ? '&' : '?';
  return `${downloadUrl}${separator}access_token=${token}`;
}

// Extract Zoom meeting ID from various URL formats
// Examples:
//   https://zoom.us/j/1234567890
//   https://us05web.zoom.us/j/1234567890?pwd=abc123
//   https://zoom.us/wc/join/1234567890
export function extractZoomMeetingId(url: string): string | null {
  if (!url) return null;
  
  try {
    // Try regex patterns for different Zoom URL formats
    const patterns = [
      /zoom\.us\/j\/(\d+)/i,           // https://zoom.us/j/1234567890
      /zoom\.us\/wc\/join\/(\d+)/i,    // https://zoom.us/wc/join/1234567890
      /\/j\/(\d+)/i,                   // Any subdomain: us05web.zoom.us/j/1234567890
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting Zoom meeting ID:', error);
    return null;
  }
}

// Get past meeting participant list
export interface ZoomParticipant {
  id: string;
  user_id?: string;
  name: string;
  user_email?: string;
  join_time: string;
  leave_time: string;
  duration: number; // in seconds
}

export interface ZoomParticipantsResponse {
  page_count: number;
  page_size: number;
  total_records: number;
  next_page_token?: string;
  participants: ZoomParticipant[];
}

// Get participants for a past meeting
export async function getZoomMeetingParticipants(meetingId: string | number): Promise<ZoomParticipantsResponse | null> {
  const token = await getAccessToken();
  
  const url = `https://api.zoom.us/v2/past_meetings/${meetingId}/participants?page_size=300`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  
  if (response.status === 404) {
    return null; // Meeting not found or no participant data
  }

  if (!response.ok) {
    const error = await response.text();
    console.error('[Zoom] ❌ Failed to get participants:', error);
    let errorMessage = `Failed to get Zoom participants: ${error}`;
    
    // Check for specific error types
    try {
      const errorData = JSON.parse(error);
      
      // Free account limitation
      if (errorData.code === 200 && errorData.message?.includes('Only available for Paid')) {
        errorMessage = 'El seguimiento de participantes requiere una cuenta Zoom de pago. Esta función no está disponible en cuentas gratuitas.';
      }
      
      // Missing scope error (code 4711)
      if (errorData.code === 4711 || errorData.message?.includes('does not contain scopes')) {
        errorMessage = 'Error de configuración de Zoom: El scope "meeting:read:list_past_participants:admin" no está habilitado. Por favor, ve a https://marketplace.zoom.us/, encuentra tu Server-to-Server OAuth app, ve a la pestaña "Scopes" y agrega el scope requerido.';
      }
    } catch (e) {
      // Not JSON, use original error
    }
    
    throw new Error(errorMessage);
  }

  const data = await response.json();
  
  return data;
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

