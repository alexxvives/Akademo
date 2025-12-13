import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// Update video metadata
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();

    if (session.role !== 'TEACHER' && session.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      );
    }

    const db = await getDB();

    const { id } = await context.params;
    const { title, description, maxWatchTimeMultiplier } = await req.json();

    // Get video and verify teacher has access through academy membership
    const video = await db
      .prepare(
        `SELECT v.id, v.classId, c.academyId, a.ownerId
         FROM Video v 
         JOIN Class c ON v.classId = c.id 
         JOIN Academy a ON c.academyId = a.id
         WHERE v.id = ?`
      )
      .bind(id)
      .first<{ id: string; classId: string; academyId: string; ownerId: string }>();

    if (!video) {
      return NextResponse.json(
        { success: false, message: 'Video not found' },
        { status: 404 }
      );
    }

    // Teachers can edit if they're members of the academy (or if they own it)
    // Admins can edit anything
    if (session.role === 'TEACHER') {
      const membership = await db
        .prepare(
          `SELECT id FROM AcademyMembership 
           WHERE userId = ? AND academyId = ? AND status = 'APPROVED'`
        )
        .bind(session.id, video.academyId)
        .first();

      const isOwner = video.ownerId === session.id;

      if (!membership && !isOwner) {
        return NextResponse.json(
          { success: false, message: 'You do not have access to edit this video' },
          { status: 403 }
        );
      }
    }

    // Update video
    await db
      .prepare(
        `UPDATE Video 
         SET title = COALESCE(?, title),
             description = COALESCE(?, description),
             maxWatchTimeMultiplier = COALESCE(?, maxWatchTimeMultiplier)
         WHERE id = ?`
      )
      .bind(title, description, maxWatchTimeMultiplier, id)
      .run();

    return NextResponse.json({
      success: true,
      message: 'Video updated successfully',
    });
  } catch (error) {
    console.error('Error updating video:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete video
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();

    if (session.role !== 'TEACHER' && session.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      );
    }

    const db = await getDB();

    const { id } = await context.params;

    // Get video and verify teacher has access through academy membership
    const video = await db
      .prepare(
        `SELECT v.id, v.classId, v.uploadId, c.academyId, a.ownerId
         FROM Video v 
         JOIN Class c ON v.classId = c.id 
         JOIN Academy a ON c.academyId = a.id
         WHERE v.id = ?`
      )
      .bind(id)
      .first<{ id: string; classId: string; uploadId: string; academyId: string; ownerId: string }>();

    if (!video) {
      return NextResponse.json(
        { success: false, message: 'Video not found' },
        { status: 404 }
      );
    }

    // Teachers can delete if they're members of the academy (or if they own it)
    // Admins can delete anything
    if (session.role === 'TEACHER') {
      const membership = await db
        .prepare(
          `SELECT id FROM AcademyMembership 
           WHERE userId = ? AND academyId = ? AND status = 'APPROVED'`
        )
        .bind(session.id, video.academyId)
        .first();

      const isOwner = video.ownerId === session.id;

      if (!membership && !isOwner) {
        return NextResponse.json(
          { success: false, message: 'You do not have access to delete this video' },
          { status: 403 }
        );
      }
    }

    // Delete video play states first (foreign key constraint)
    await db
      .prepare('DELETE FROM VideoPlayState WHERE videoId = ?')
      .bind(id)
      .run();

    // Delete video
    await db
      .prepare('DELETE FROM Video WHERE id = ?')
      .bind(id)
      .run();

    // Note: We're not deleting the file from storage here
    // You might want to add that functionality later

    return NextResponse.json({
      success: true,
      message: 'Video deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting video:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
