import { requireRole } from '@/lib/auth';
import { handleApiError, successResponse, errorResponse } from '@/lib/api-utils';
import { getBunnyLiveStream, deleteBunnyLiveStream } from '@/lib/bunny-stream';
import { getDB } from '@/lib/db';

// Get live stream details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(['ADMIN', 'TEACHER', 'STUDENT']);
    const { id } = await params;

    const db = await getDB();
    
    const stream = await db.prepare(`
      SELECT ls.*, u.firstName, u.lastName, c.name as className
      FROM LiveStream ls
      JOIN User u ON ls.teacherId = u.id
      JOIN Class c ON ls.classId = c.id
      WHERE ls.id = ?
    `).bind(id).first() as any;

    if (!stream) {
      return errorResponse('Stream not found', 404);
    }

    // If stream has a bunny ID, get live status
    if (stream.bunnyStreamId) {
      try {
        const bunnyStream = await getBunnyLiveStream(stream.bunnyStreamId);
        stream.liveStatus = bunnyStream.status;
        stream.viewerCount = bunnyStream.viewerCount;
      } catch (e) {
        console.error('Failed to get Bunny stream status:', e);
      }
    }

    return Response.json(successResponse(stream));
  } catch (error) {
    return handleApiError(error);
  }
}

// Update live stream status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(['ADMIN', 'TEACHER']);
    const { id } = await params;
    const { status, title, description } = await request.json();

    const db = await getDB();
    const now = new Date().toISOString();

    // Get stream
    const stream = await db.prepare('SELECT * FROM LiveStream WHERE id = ?').bind(id).first() as any;
    
    if (!stream) {
      return errorResponse('Stream not found', 404);
    }

    // Verify ownership
    if (session.role !== 'ADMIN' && stream.teacherId !== session.id) {
      return errorResponse('Not authorized', 403);
    }

    // Update stream
    await db.prepare(`
      UPDATE LiveStream 
      SET status = COALESCE(?, status),
          title = COALESCE(?, title),
          description = COALESCE(?, description),
          startedAt = CASE WHEN ? = 'live' THEN ? ELSE startedAt END,
          endedAt = CASE WHEN ? = 'ended' THEN ? ELSE endedAt END,
          updatedAt = ?
      WHERE id = ?
    `).bind(
      status,
      title,
      description,
      status, now,
      status, now,
      now,
      id
    ).run();

    return Response.json(successResponse({ updated: true }));
  } catch (error) {
    return handleApiError(error);
  }
}

// Delete live stream
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(['ADMIN', 'TEACHER']);
    const { id } = await params;

    const db = await getDB();

    // Get stream
    const stream = await db.prepare('SELECT * FROM LiveStream WHERE id = ?').bind(id).first() as any;
    
    if (!stream) {
      return errorResponse('Stream not found', 404);
    }

    // Verify ownership
    if (session.role !== 'ADMIN' && stream.teacherId !== session.id) {
      return errorResponse('Not authorized', 403);
    }

    // Delete from Bunny
    if (stream.bunnyStreamId) {
      try {
        await deleteBunnyLiveStream(stream.bunnyStreamId);
      } catch (e) {
        console.error('Failed to delete from Bunny:', e);
      }
    }

    // Delete from database
    await db.prepare('DELETE FROM LiveStream WHERE id = ?').bind(id).run();

    return Response.json(successResponse({ deleted: true }));
  } catch (error) {
    return handleApiError(error);
  }
}
