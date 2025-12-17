// Daily.co API integration for live streaming

import { getCloudflareContext } from '@opennextjs/cloudflare';

const DAILY_API_URL = 'https://api.daily.co/v1';

// Helper to get API key from Cloudflare environment
async function getApiKey(): Promise<string> {
  const ctx = await getCloudflareContext();
  const env = ctx?.env as any;
  return env?.DAILY_API_KEY || process.env.DAILY_API_KEY || '';
}

interface DailyRoom {
  id: string;
  name: string;
  url: string;
  created_at: string;
  config: {
    enable_recording?: string;
    enable_chat?: boolean;
    start_video_off?: boolean;
    start_audio_off?: boolean;
  };
}

interface CreateRoomOptions {
  name: string;
  enableRecording?: boolean;
  expiryMinutes?: number;
}

export async function createRoom(options: CreateRoomOptions): Promise<DailyRoom> {
  const { name, enableRecording = true, expiryMinutes = 480 } = options; // 8 hours max by default
  
  const expiryTime = Math.floor(Date.now() / 1000) + (expiryMinutes * 60);
  const apiKey = await getApiKey();
  
  const response = await fetch(`${DAILY_API_URL}/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      name,
      privacy: 'public', // Students can join via URL
      properties: {
        exp: expiryTime,
        enable_recording: enableRecording ? 'cloud' : undefined,
        enable_chat: true,
        enable_screenshare: true,
        enable_knocking: false,
        start_video_off: false,
        start_audio_off: true, // Students join muted
        owner_only_broadcast: true, // Only teacher can broadcast
        max_participants: 50,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create Daily room: ${error.error || response.statusText}`);
  }

  return response.json();
}

export async function getRoom(roomName: string): Promise<DailyRoom | null> {
  const apiKey = await getApiKey();
  const response = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to get Daily room: ${response.statusText}`);
  }

  return response.json();
}

export async function deleteRoom(roomName: string): Promise<boolean> {
  const apiKey = await getApiKey();
  const response = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  return response.ok;
}

interface DailyRecording {
  id: string;
  room_name: string;
  start_ts: number;
  duration: number;
  max_participants: number;
  download_link?: string;
  s3_key?: string;
}

export async function getRecordings(roomName: string): Promise<DailyRecording[]> {
  const apiKey = await getApiKey();
  const response = await fetch(`${DAILY_API_URL}/recordings?room_name=${roomName}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get recordings: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || [];
}

export async function getRecordingAccessLink(recordingId: string): Promise<string> {
  const apiKey = await getApiKey();
  const response = await fetch(`${DAILY_API_URL}/recordings/${recordingId}/access-link`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get recording access link: ${response.statusText}`);
  }

  const data = await response.json();
  return data.download_link;
}

// Generate a meeting token for a participant
interface TokenOptions {
  roomName: string;
  userName: string;
  isOwner: boolean;
  userId?: string;
  expiryMinutes?: number;
}

export async function createMeetingToken(options: TokenOptions): Promise<string> {
  const { roomName, userName, isOwner, userId, expiryMinutes = 480 } = options;
  
  const expiryTime = Math.floor(Date.now() / 1000) + (expiryMinutes * 60);
  const apiKey = await getApiKey();
  
  const response = await fetch(`${DAILY_API_URL}/meeting-tokens`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        user_name: userName,
        user_id: userId,
        is_owner: isOwner,
        exp: expiryTime,
        start_video_off: !isOwner,
        start_audio_off: !isOwner,
        enable_recording: isOwner ? 'cloud' : undefined,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create meeting token: ${error.error || response.statusText}`);
  }

  const data = await response.json();
  return data.token;
}
