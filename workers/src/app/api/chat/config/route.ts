import { successResponse } from '@/lib/api-utils';
import { getCloudflareContext } from '@/lib/cloudflare';

// Get Firebase config for client-side real-time connection
export async function GET() {
  const ctx = getCloudflareContext();
  
  return Response.json(successResponse({
    databaseURL: ctx?.FIREBASE_DATABASE_URL || 'https://akademo-a512f-default-rtdb.firebaseio.com',
    projectId: ctx?.FIREBASE_PROJECT_ID || 'akademo-a512f',
  }));
}
