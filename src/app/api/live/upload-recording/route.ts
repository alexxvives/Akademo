import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getDB, generateId } from '@/lib/db';
import { handleApiError, successResponse, errorResponse } from '@/lib/api-utils';

const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || 'akademo';
const BUNNY_STORAGE_KEY = process.env.BUNNY_STORAGE_KEY || '';
const BUNNY_STORAGE_REGION = process.env.BUNNY_STORAGE_REGION || 'ny';

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['TEACHER']);
    const db = await getDB();

    const { streamId, filename, contentType } = await request.json();

    if (!streamId || !filename) {
      return errorResponse('Stream ID and filename required', 400);
    }

    // Verify the stream exists and belongs to a class the teacher owns
    const stream = await db.prepare(`
      SELECT cl.id, cl.classId, cl.title, c.teacherId
      FROM ClassLive cl
      JOIN Class c ON c.id = cl.classId
      WHERE cl.id = ? AND c.teacherId = ?
    `).bind(streamId, user.id).first();

    if (!stream) {
      return errorResponse('Stream not found or unauthorized', 404);
    }

    // Generate unique video path
    const ext = filename.split('.').pop() || 'mp4';
    const timestamp = Date.now();
    const videoPath = `stream-recordings/${streamId}-${timestamp}.${ext}`;

    // Build upload URL for Bunny CDN
    const storageHost = BUNNY_STORAGE_REGION === 'de' 
      ? 'storage.bunnycdn.com' 
      : `${BUNNY_STORAGE_REGION}.storage.bunnycdn.com`;
    const uploadUrl = `https://${storageHost}/${BUNNY_STORAGE_ZONE}/${videoPath}`;

    return Response.json(successResponse({
      uploadUrl,
      accessKey: BUNNY_STORAGE_KEY,
      videoPath,
    }));

  } catch (error) {
    return handleApiError(error);
  }
}
