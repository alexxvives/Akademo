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
    
    // Parse body with error handling
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return errorResponse(`JSON Parse Error: ${e}`, 400);
    }
    
    const { status, title, description } = body;

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

    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const bindParams: any[] = [];
    
    if (status !== undefined && status !== null) {
      updates.push('status = ?');
      bindParams.push(status);
      if (status === 'live') {
        updates.push('startedAt = ?');
        bindParams.push(now);
      } else if (status === 'ended') {
        updates.push('endedAt = ?');
        bindParams.push(now);
      }
    }
    
    // Check if title is a valid string with content
    if (title !== undefined && title !== null && typeof title === 'string' && title.trim().length > 0) {
      updates.push('title = ?');
      bindParams.push(title.trim());
    } else if (title !== undefined) {
      // Title was provided but invalid
      return errorResponse(`Invalid title: type=${typeof title}, value=${JSON.stringify(title)}, isNull=${title === null}, isEmpty=${typeof title === 'string' && title.trim().length === 0}`, 400);
    }
    
    if (description !== undefined && description !== null) {
      updates.push('description = ?');
      bindParams.push(description);
    }
    
    if (updates.length === 0) {
      return errorResponse(`No valid fields to update. Received: status=${status}, title=${JSON.stringify(title)}, description=${JSON.stringify(description)}`, 400);
    }
    
    // LiveStream table doesn't have updatedAt column, skip it
    bindParams.push(id);
    
    const result = await db.prepare(`
      UPDATE LiveStream 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).bind(...bindParams).run();
    
    if (!result.success) {
      return errorResponse(`Database update failed: meta=${JSON.stringify(result.meta)}`, 500);
    }

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
