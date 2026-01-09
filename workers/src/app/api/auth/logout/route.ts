import { deleteSession } from '@/lib/auth';
import { successResponse } from '@/lib/api-utils';

export async function POST() {
  await deleteSession();
  return Response.json(successResponse({ message: 'Logged out' }));
}
