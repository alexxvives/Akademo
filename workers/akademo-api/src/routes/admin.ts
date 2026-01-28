import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';

const admin = new Hono<{ Bindings: Bindings }>();

// GET /admin/academies - Get all academies with detailed stats (admin only)
admin.get('/academies', async (c) => {
  try {
    const session = await requireAuth(c);
    
    if (session.role !== 'ADMIN') {
      return c.json(errorResponse('Forbidden'), 403);
    }

    // Query academies with owner info and counts
    const query = `
      SELECT 
        a.id,
        a.name,
        a.description,
        a.paymentStatus,
        a.createdAt,
        a.ownerId,
        u.firstName || ' ' || u.lastName as ownerName,
        u.email as ownerEmail,
        COUNT(DISTINCT c.id) as classCount,
        COUNT(DISTINCT t.id) as teacherCount,
        COUNT(DISTINCT e.id) as studentCount
      FROM Academy a
      LEFT JOIN User u ON a.ownerId = u.id
      LEFT JOIN Class c ON a.id = c.academyId
      LEFT JOIN Teacher t ON a.id = t.academyId
      LEFT JOIN ClassEnrollment e ON c.id = e.classId AND e.status = 'APPROVED'
      GROUP BY a.id
      ORDER BY a.createdAt DESC
    `;

    const result = await c.env.DB.prepare(query).all();
    
    console.log('[Admin Academies] Found', result.results?.length || 0, 'academies');
    
    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    console.error('[Admin Academies] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// GET /admin/payments - Get all payments (admin only)
admin.get('/payments', async (c) => {
  try {
    const session = await requireAuth(c);
    
    if (session.role !== 'ADMIN') {
      return c.json(errorResponse('Forbidden'), 403);
    }

    const type = c.req.query('type'); // 'STUDENT_TO_ACADEMY' or 'ACADEMY_TO_PLATFORM'
    
    let query = `
      SELECT 
        p.*,
        CASE 
          WHEN p.type = 'STUDENT_TO_ACADEMY' THEN a.name
          ELSE NULL
        END as academyName,
        CASE 
          WHEN p.type = 'STUDENT_TO_ACADEMY' THEN c.name
          ELSE NULL
        END as className
      FROM Payment p
      LEFT JOIN Academy a ON p.receiverId = a.id AND p.type = 'STUDENT_TO_ACADEMY'
      LEFT JOIN Class c ON p.classId = c.id
    `;
    
    if (type) {
      query += ` WHERE p.type = ?`;
    }
    
    query += ` ORDER BY p.createdAt DESC`;
    
    const result = type 
      ? await c.env.DB.prepare(query).bind(type).all()
      : await c.env.DB.prepare(query).all();
    
    console.log('[Admin Payments] Found', result.results?.length || 0, 'payments');
    
    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    console.error('[Admin Payments] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// GET /admin/classes - Get all classes across all academies (admin only)
admin.get('/classes', async (c) => {
  try {
    console.log('[Admin Classes] Starting request');
    const session = await requireAuth(c);
    console.log('[Admin Classes] Session:', { id: session.id, role: session.role });
    
    if (session.role !== 'ADMIN') {
      console.log('[Admin Classes] Forbidden - not admin');
      return c.json(errorResponse('Forbidden'), 403);
    }

    const query = `
      SELECT 
        c.id,
        c.name,
        c.slug,
        c.description,
        c.academyId,
        a.name as academyName,
        c.teacherId,
        u.firstName,
        u.lastName,
        u.firstName || ' ' || u.lastName as teacherName,
        c.zoomAccountId,
        z.accountName as zoomAccountName,
        COUNT(DISTINCT e.userId) as studentCount,
        COUNT(DISTINCT l.id) as lessonCount,
        c.createdAt
      FROM Class c
      LEFT JOIN Academy a ON c.academyId = a.id
      LEFT JOIN User u ON c.teacherId = u.id
      LEFT JOIN ZoomAccount z ON c.zoomAccountId = z.id
      LEFT JOIN ClassEnrollment e ON c.id = e.classId AND e.status = 'APPROVED'
      LEFT JOIN Lesson l ON c.id = l.classId
      GROUP BY c.id, c.name, c.slug, c.description, c.academyId, a.name, c.teacherId, u.firstName, u.lastName, c.zoomAccountId, z.accountName, c.createdAt
      ORDER BY c.createdAt DESC
    `;

    console.log('[Admin Classes] Executing query');
    const result = await c.env.DB.prepare(query).all();
    
    console.log('[Admin Classes] Query result:', {
      success: result.success,
      resultsCount: result.results?.length || 0,
      meta: result.meta
    });

    if (result.results && result.results.length > 0) {
      console.log('[Admin Classes] Sample result:', result.results[0]);
    }
    
    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    console.error('[Admin Classes] Error:', error);
    console.error('[Admin Classes] Error stack:', error.stack);
    console.error('[Admin Classes] Error message:', error.message);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// GET /admin/lessons - Get all lessons across all academies (admin only)
admin.get('/lessons', async (c) => {
  try {
    const session = await requireAuth(c);
    
    if (session.role !== 'ADMIN') {
      return c.json(errorResponse('Forbidden'), 403);
    }

    const query = `
      SELECT 
        l.id,
        l.title,
        l.description,
        l.classId,
        c.name as className,
        c.academyId,
        a.name as academyName,
        COUNT(DISTINCT v.id) as videoCount,
        COUNT(DISTINCT d.id) as documentCount,
        l.releaseDate,
        l.createdAt
      FROM Lesson l
      LEFT JOIN Class c ON l.classId = c.id
      LEFT JOIN Academy a ON c.academyId = a.id
      LEFT JOIN Video v ON l.id = v.lessonId
      LEFT JOIN Document d ON l.id = d.lessonId
      GROUP BY l.id
      ORDER BY l.createdAt DESC
    `;

    const result = await c.env.DB.prepare(query).all();
    
    console.log('[Admin Lessons] Found', result.results?.length || 0, 'lessons');
    
    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    console.error('[Admin Lessons] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// PATCH /admin/academy/:id - Update academy (admin only)
admin.patch('/academy/:id', async (c) => {
  try {
    const session = await requireAuth(c);
    
    if (session.role !== 'ADMIN') {
      return c.json(errorResponse('Forbidden'), 403);
    }

    const academyId = c.req.param('id');
    const body = await c.req.json();
    
    const { paymentStatus, status, name, description } = body;
    
    const updates = [];
    const params = [];
    
    if (paymentStatus !== undefined) {
      updates.push('paymentStatus = ?');
      params.push(paymentStatus);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }
    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    
    if (updates.length === 0) {
      return c.json(errorResponse('No fields to update'), 400);
    }
    
    params.push(academyId);
    
    const query = `UPDATE Academy SET ${updates.join(', ')} WHERE id = ?`;
    await c.env.DB.prepare(query).bind(...params).run();
    
    console.log('[Admin Update Academy] Updated academy', academyId);
    
    return c.json(successResponse({ id: academyId, updated: true }));
  } catch (error: any) {
    console.error('[Admin Update Academy] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// GET /admin/teachers - Get all teachers (admin only)
admin.get('/teachers', async (c) => {
  try {
    const session = await requireAuth(c);
    
    if (session.role !== 'ADMIN') {
      return c.json(errorResponse('Forbidden'), 403);
    }

    const query = `
      SELECT 
        u.id,
        u.firstName,
        u.lastName,
        u.email,
        a.name as academyName,
        COUNT(DISTINCT c.id) as classCount,
        COUNT(DISTINCT e.userId) as studentCount,
        GROUP_CONCAT(DISTINCT c.name) as classNames,
        u.createdAt
      FROM User u
      LEFT JOIN Teacher t ON u.id = t.userId
      LEFT JOIN Academy a ON t.academyId = a.id
      LEFT JOIN Class c ON u.id = c.teacherId
      LEFT JOIN ClassEnrollment e ON c.id = e.classId AND e.status = 'APPROVED'
      WHERE u.role = 'TEACHER'
      GROUP BY u.id
      ORDER BY u.createdAt DESC
    `;

    const result = await c.env.DB.prepare(query).all();
    
    console.log('[Admin Teachers] Found', result.results?.length || 0, 'teachers');
    
    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    console.error('[Admin Teachers] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// GET /admin/students - Get all students (admin only)
admin.get('/students', async (c) => {
  try {
    const session = await requireAuth(c);
    
    if (session.role !== 'ADMIN') {
      return c.json(errorResponse('Forbidden'), 403);
    }

    const query = `
      SELECT 
        u.id,
        u.firstName,
        u.lastName,
        u.email,
        GROUP_CONCAT(DISTINCT a.name, ', ') as academyNames,
        COUNT(DISTINCT c.id) as classCount,
        COUNT(DISTINCT e.id) as enrollmentCount,
        u.createdAt
      FROM User u
      LEFT JOIN ClassEnrollment e ON u.id = e.userId AND e.status = 'APPROVED'
      LEFT JOIN Class c ON e.classId = c.id
      LEFT JOIN Academy a ON c.academyId = a.id
      WHERE u.role = 'STUDENT'
      GROUP BY u.id
      ORDER BY u.createdAt DESC
    `;

    const result = await c.env.DB.prepare(query).all();
    
    console.log('[Admin Students] Found', result.results?.length || 0, 'students');
    
    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    console.error('[Admin Students] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// GET /admin/zoom-accounts - Get all Zoom accounts (admin only)
admin.get('/zoom-accounts', async (c) => {
  try {
    const session = await requireAuth(c);
    
    if (session.role !== 'ADMIN') {
      return c.json(errorResponse('Forbidden'), 403);
    }

    const query = `
      SELECT 
        id,
        accountId,
        accountName,
        createdAt,
        updatedAt
      FROM ZoomAccount
      ORDER BY createdAt DESC
    `;

    const result = await c.env.DB.prepare(query).all();
    
    console.log('[Admin Zoom Accounts] Found', result.results?.length || 0, 'accounts');
    
    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    console.error('[Admin Zoom Accounts] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// GET /admin/classes - Enhanced to include Zoom account info
// (Already exists above but needs to be updated to include zoomAccountId and zoomAccountName)

// PATCH /admin/classes/:id/assign-zoom - Assign Zoom account to class (admin only)
admin.patch('/classes/:id/assign-zoom', async (c) => {
  try {
    const session = await requireAuth(c);
    
    if (session.role !== 'ADMIN') {
      return c.json(errorResponse('Forbidden'), 403);
    }

    const classId = c.req.param('id');
    const body = await c.req.json();
    const { zoomAccountId } = body;
    
    // Verify class exists
    const classCheck = await c.env.DB.prepare('SELECT id FROM Class WHERE id = ?').bind(classId).first();
    if (!classCheck) {
      return c.json(errorResponse('Class not found'), 404);
    }

    // If zoomAccountId provided, verify it exists
    if (zoomAccountId) {
      const zoomCheck = await c.env.DB.prepare('SELECT id FROM ZoomAccount WHERE id = ?').bind(zoomAccountId).first();
      if (!zoomCheck) {
        return c.json(errorResponse('Zoom account not found'), 404);
      }
    }

    // Update class with new Zoom account
    await c.env.DB.prepare(
      'UPDATE Class SET zoomAccountId = ? WHERE id = ?'
    ).bind(zoomAccountId || null, classId).run();

    console.log('[Admin] Assigned Zoom account', zoomAccountId, 'to class', classId);
    
    return c.json(successResponse({ message: 'Zoom account assigned successfully' }));
  } catch (error: any) {
    console.error('[Admin Assign Zoom] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// DELETE /admin/users/:id - Delete user account (admin only)
admin.delete('/users/:id', async (c) => {
  try {
    const session = await requireAuth(c);
    
    if (session.role !== 'ADMIN') {
      return c.json(errorResponse('Forbidden - Admin access required'), 403);
    }

    const userId = c.req.param('id');

    // Get user details first
    const user = await c.env.DB.prepare('SELECT * FROM User WHERE id = ?').bind(userId).first<any>();
    
    if (!user) {
      return c.json(errorResponse(`User ${userId} not found`), 404);
    }

    console.log(`[Admin Delete Account] Deleting ${user.role} user: ${user.email} (${userId})`);

    // Role-specific deletion logic (same as the user self-delete endpoint)
    if (user.role === 'STUDENT') {
      // Delete student-specific data
      await c.env.DB.prepare('DELETE FROM ClassEnrollment WHERE userId = ?').bind(userId).run();
      await c.env.DB.prepare('DELETE FROM LessonRating WHERE studentId = ?').bind(userId).run();
      await c.env.DB.prepare('DELETE FROM VideoPlayState WHERE studentId = ?').bind(userId).run();
      console.log('[Admin Delete Account] Deleted STUDENT enrollments, ratings, and video states');
      
    } else if (user.role === 'TEACHER') {
      // Unassign teacher from classes
      await c.env.DB.prepare('UPDATE Class SET teacherId = NULL WHERE teacherId = ?').bind(userId).run();
      await c.env.DB.prepare('DELETE FROM Teacher WHERE userId = ?').bind(userId).run();
      await c.env.DB.prepare('DELETE FROM LiveStream WHERE teacherId = ?').bind(userId).run();
      console.log('[Admin Delete Account] Deleted TEACHER records and unassigned from classes');
      
    } else if (user.role === 'ACADEMY') {
      // CASCADE DELETE: Delete entire academy
      const academies = await c.env.DB.prepare('SELECT id FROM Academy WHERE ownerId = ?').bind(userId).all();
      
      for (const academy of (academies.results || [])) {
        const academyId = (academy as any).id;
        console.log(`[Admin Delete Account] Deleting academy: ${academyId}`);
        
        // Get all classes in this academy
        const classes = await c.env.DB.prepare('SELECT id FROM Class WHERE academyId = ?').bind(academyId).all();
        
        for (const cls of (classes.results || [])) {
          const classId = (cls as any).id;
          
          // Get all lessons in this class
          const lessons = await c.env.DB.prepare('SELECT id FROM Lesson WHERE classId = ?').bind(classId).all();
          
          for (const lesson of (lessons.results || [])) {
            const lessonId = (lesson as any).id;
            
            // Delete videos and documents
            await c.env.DB.prepare('DELETE FROM Video WHERE lessonId = ?').bind(lessonId).run();
            await c.env.DB.prepare('DELETE FROM Document WHERE lessonId = ?').bind(lessonId).run();
            await c.env.DB.prepare('DELETE FROM LessonRating WHERE lessonId = ?').bind(lessonId).run();
          }
          
          // Delete lessons
          await c.env.DB.prepare('DELETE FROM Lesson WHERE classId = ?').bind(classId).run();
          
          // Delete enrollments
          await c.env.DB.prepare('DELETE FROM ClassEnrollment WHERE classId = ?').bind(classId).run();
        }
        
        // Delete classes
        await c.env.DB.prepare('DELETE FROM Class WHERE academyId = ?').bind(academyId).run();
        
        // Delete teachers
        await c.env.DB.prepare('DELETE FROM Teacher WHERE academyId = ?').bind(academyId).run();
        
        // Delete academy
        await c.env.DB.prepare('DELETE FROM Academy WHERE id = ?').bind(academyId).run();
      }
      
      console.log('[Admin Delete Account] CASCADE deleted ACADEMY and all related data');
    }

    // Delete device sessions
    await c.env.DB.prepare('DELETE FROM DeviceSession WHERE userId = ?').bind(userId).run();
    
    // Delete notifications
    await c.env.DB.prepare('DELETE FROM Notification WHERE userId = ?').bind(userId).run();
    
    // Finally, delete the user
    await c.env.DB.prepare('DELETE FROM User WHERE id = ?').bind(userId).run();
    
    console.log(`[Admin Delete Account] Successfully deleted user ${userId}`);
    
    return c.json(successResponse({ message: `User ${user.email} deleted successfully` }));
  } catch (error: any) {
    console.error('[Admin Delete Account] Error:', error);
    return c.json(errorResponse(error.message || 'Failed to delete user account'), 500);
  }
});

export default admin;
