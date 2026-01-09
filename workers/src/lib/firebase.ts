// Firebase Realtime Database client for live chat
// We use the REST API to avoid adding firebase-admin SDK (keeps bundle small)

import { getCloudflareContext } from './cloudflare';

interface FirebaseEnv {
  FIREBASE_DATABASE_URL: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_CLIENT_EMAIL: string;
}

function getConfig(): FirebaseEnv {
  const ctx = getCloudflareContext();
  return {
    FIREBASE_DATABASE_URL: ctx?.FIREBASE_DATABASE_URL || process.env.FIREBASE_DATABASE_URL || '',
    FIREBASE_PROJECT_ID: ctx?.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || '',
    FIREBASE_CLIENT_EMAIL: ctx?.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL || '',
  };
}

// Chat message structure
export interface ChatMessage {
  id?: string;
  streamId: string;
  userId: string;
  userName: string;
  userRole: 'TEACHER' | 'STUDENT';
  message: string;
  timestamp: number;
  type: 'message' | 'system' | 'reaction';
}

// For client-side Firebase usage, we'll use the REST API
// This keeps our bundle small and works in Cloudflare Workers

// Get the REST API URL for a path
function getFirebaseUrl(path: string): string {
  const config = getConfig();
  return `${config.FIREBASE_DATABASE_URL}${path}.json`;
}

// Push a new chat message (server-side)
export async function pushChatMessage(streamId: string, message: Omit<ChatMessage, 'id' | 'streamId' | 'timestamp'>): Promise<string> {
  const fullMessage: ChatMessage = {
    ...message,
    streamId,
    timestamp: Date.now(),
  };

  const response = await fetch(getFirebaseUrl(`/streams/${streamId}/messages`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fullMessage),
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  const data = await response.json();
  return data.name; // Firebase returns the new key as "name"
}

// Get recent messages for a stream (server-side)
export async function getRecentMessages(streamId: string, limit: number = 50): Promise<ChatMessage[]> {
  const url = `${getFirebaseUrl(`/streams/${streamId}/messages`)}?orderBy="timestamp"&limitToLast=${limit}`;
  
  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) return [];
    throw new Error('Failed to get messages');
  }

  const data = await response.json();
  if (!data) return [];

  // Convert Firebase object to array
  return Object.entries(data).map(([id, msg]: [string, any]) => ({
    ...msg,
    id,
  }));
}

// Delete all messages for a stream (cleanup)
export async function deleteStreamMessages(streamId: string): Promise<void> {
  const response = await fetch(getFirebaseUrl(`/streams/${streamId}`), {
    method: 'DELETE',
  });

  if (!response.ok && response.status !== 404) {
    throw new Error('Failed to delete stream messages');
  }
}

// Client-side Firebase config for real-time listening
// This will be used in the frontend to subscribe to chat updates
export function getFirebaseClientConfig() {
  const config = getConfig();
  return {
    databaseURL: config.FIREBASE_DATABASE_URL,
    projectId: config.FIREBASE_PROJECT_ID,
  };
}
