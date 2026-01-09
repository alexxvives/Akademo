import { getSession } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { cookies } from 'next/headers';

export async function GET() {
  console.log('[Auth Me] Request received');
  
  // Debug: Check cookies
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  console.log('[Auth Me] All cookies:', allCookies.map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' })));
  
  const session = await getSession();
  console.log('[Auth Me] Session result:', session ? 'Found' : 'Not found');
  
  if (!session) {
    console.log('[Auth Me] Returning 401 - no session');
    return errorResponse('Not authenticated', 401);
  }

  console.log('[Auth Me] Returning session for user:', session.id);
  return Response.json(successResponse(session));
}
