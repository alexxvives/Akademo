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

    const db = await getDB();

    const { id } = await context.params;
    const { title, description, maxWatchTimeMultiplier, durationSeconds } = await req.json();

    // Get video and verify access
    const video = await db
      .prepare(
        `SELECT v.id, v.lessonId, v.durationSeconds, l.classId, c.academyId, a.ownerId
         FROM Video v
         JOIN Lesson l ON v.lessonId = l.id 
         JOIN Class c ON l.classId = c.id 
         JOIN Academy a ON c.academyId = a.id
         WHERE v.id = ?`
      )
      .bind(id)
      .first<{ id: string; lessonId: string; durationSeconds: number | null; classId: string; academyId: string; ownerId: string }>();

    if (!video) {
      return NextResponse.json(
        { success: false, message: 'Video not found' },
        { status: 404 }
      );
    }

    // Students can only update durationSeconds if it's currently null/0
    if (session.role === 'STUDENT') {
      // Only allow setting duration if it was missing
      if (durationSeconds && (!video.durationSeconds || video.durationSeconds === 0)) {
        // Verify student has enrollment in this class
        const enrollment = await db
          .prepare(
            `SELECT id FROM Enrollment WHERE classId = ? AND studentId = ?`
          )
          .bind(video.classId, session.id)
          .first();

        if (enrollment) {
          await db
            .prepare(`UPDATE Video SET durationSeconds = ? WHERE id = ? AND (durationSeconds IS NULL OR durationSeconds = 0)`)
            .bind(durationSeconds, id)
            .run();
          return NextResponse.json({ success: true, message: 'Video duration updated' });
        }
      }
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    if (session.role !== 'TEACHER' && session.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      );
    }

    // Teachers can edit if they own the class through Teacher table
    // Admins can edit anything
    if (session.role === 'TEACHER') {
      const classData = await db
        .prepare('SELECT teacherId FROM Class WHERE id = ?')
        .bind(video.classId)
        .first() as any;

      if (classData?.teacherId !== session.id) {
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
             maxWatchTimeMultiplier = COALESCE(?, maxWatchTimeMultiplier),
             durationSeconds = COALESCE(?, durationSeconds)
         WHERE id = ?`
      )
      .bind(title, description, maxWatchTimeMultiplier, durationSeconds, id)
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
        `SELECT v.id, v.lessonId, v.uploadId, l.classId, c.academyId, a.ownerId
         FROM Video v
         JOIN Lesson l ON v.lessonId = l.id 
         JOIN Class c ON l.classId = c.id 
         JOIN Academy a ON c.academyId = a.id
         WHERE v.id = ?`
      )
      .bind(id)
      .first<{ id: string; lessonId: string; uploadId: string; classId: string; academyId: string; ownerId: string }>();

    if (!video) {
      return NextResponse.json(
        { success: false, message: 'Video not found' },
        { status: 404 }
      );
    }

    // Teachers can delete if they own the class through Teacher table
    // Admins can delete anything
    if (session.role === 'TEACHER') {
      const classData = await db
        .prepare('SELECT teacherId FROM Class WHERE id = ?')
        .bind(video.classId)
        .first() as any;

      if (classData?.teacherId !== session.id) {
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
