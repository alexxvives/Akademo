import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';
import { nanoid } from 'nanoid';
import { validateBody, createAssignmentSchema, gradeSubmissionSchema } from '../lib/validation';

const assignments = new Hono<{ Bindings: Bindings }>();

// GET /assignments/all - List all assignments for teacher or academy owner (no class filter)
assignments.get('/all', async (c) => {
  try {
    const session = await requireAuth(c);

    let query = '';
    let bindings: string[] = [];

    if (session.role === 'TEACHER') {
      // Teachers see all assignments for all their classes
      query = `
        SELECT 
          a.id, a.classId, a.teacherId, a.title, a.description, 
          a.dueDate, a.maxScore, a.uploadId, a.createdAt, a.updatedAt,
          c.name as className,
          GROUP_CONCAT(DISTINCT aa.uploadId) as attachmentIds,
          COUNT(DISTINCT aa.id) as attachmentCount,
          COUNT(DISTINCT s.id) as submissionCount,
          COUNT(DISTINCT CASE WHEN s.gradedAt IS NOT NULL THEN s.id END) as gradedCount
        FROM Assignment a
        JOIN Class c ON a.classId = c.id
        LEFT JOIN AssignmentAttachment aa ON a.id = aa.assignmentId
        LEFT JOIN AssignmentSubmission s ON a.id = s.assignmentId
        WHERE a.teacherId = ?
        GROUP BY a.id
        ORDER BY a.dueDate DESC, a.createdAt DESC
      `;
      bindings = [session.id];
    } else if (session.role === 'ACADEMY') {
      // Academy owners see all assignments for all classes in their academy
      query = `
        SELECT 
          a.id, a.classId, a.teacherId, a.title, a.description, 
          a.dueDate, a.maxScore, a.uploadId, a.createdAt, a.updatedAt,
          c.name as className,
          GROUP_CONCAT(DISTINCT aa.uploadId) as attachmentIds,
          COUNT(DISTINCT aa.id) as attachmentCount,
          COUNT(DISTINCT s.id) as submissionCount,
          COUNT(DISTINCT CASE WHEN s.gradedAt IS NOT NULL THEN s.id END) as gradedCount
        FROM Assignment a
        JOIN Class c ON a.classId = c.id
        JOIN Academy ac ON c.academyId = ac.id
        LEFT JOIN AssignmentAttachment aa ON a.id = aa.assignmentId
        LEFT JOIN AssignmentSubmission s ON a.id = s.assignmentId
        WHERE ac.ownerId = ?
        GROUP BY a.id
        ORDER BY a.dueDate DESC, a.createdAt DESC
      `;
      bindings = [session.id];
    } else if (session.role === 'ADMIN') {
      // Admin sees all assignments from all academies
      query = `
        SELECT 
          a.id, a.classId, a.teacherId, a.title, a.description, 
          a.dueDate, a.maxScore, a.uploadId, a.createdAt, a.updatedAt,
          c.name as className,
          ac.name as academyName,
          GROUP_CONCAT(DISTINCT aa.uploadId) as attachmentIds,
          COUNT(DISTINCT aa.id) as attachmentCount,
          COUNT(DISTINCT s.id) as submissionCount,
          COUNT(DISTINCT CASE WHEN s.gradedAt IS NOT NULL THEN s.id END) as gradedCount
        FROM Assignment a
        JOIN Class c ON a.classId = c.id
        JOIN Academy ac ON c.academyId = ac.id
        LEFT JOIN AssignmentAttachment aa ON a.id = aa.assignmentId
        LEFT JOIN AssignmentSubmission s ON a.id = s.assignmentId
        GROUP BY a.id
        ORDER BY a.dueDate DESC, a.createdAt DESC
      `;
      bindings = [];
    } else {
      return c.json(errorResponse('Only teachers, academy owners, and admins can view all assignments'), 403);
    }

    const result = await c.env.DB.prepare(query).bind(...bindings).all();

    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    console.error('[Assignments GET /all] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// GET /assignments - List assignments for a class (for teachers and students), or all assignments for students
assignments.get('/', async (c) => {
  try {
    const session = await requireAuth(c);
    const classId = c.req.query('classId');

    // Students can fetch all assignments across all enrolled classes if classId is not provided
    if (!classId && session.role === 'STUDENT') {
      // Get all assignments from all enrolled classes
      const query = `
        SELECT 
          a.id, a.classId, a.title, a.description, 
          a.dueDate, a.maxScore, a.uploadId, a.createdAt,
          c.name as className,
          s.id as submissionId,
          s.uploadId as submissionUploadId,
          up.storagePath as submissionStoragePath,
          s.score,
          s.feedback,
          s.submittedAt,
          s.gradedAt,
          s.version,
          GROUP_CONCAT(aa.uploadId) as attachmentIds,
          COUNT(DISTINCT aa.id) as attachmentCount
        FROM Assignment a
        JOIN Class c ON a.classId = c.id
        JOIN ClassEnrollment e ON c.id = e.classId
        LEFT JOIN AssignmentAttachment aa ON a.id = aa.assignmentId
        LEFT JOIN AssignmentSubmission s ON a.id = s.assignmentId AND s.studentId = ? 
          AND s.version = (SELECT MAX(version) FROM AssignmentSubmission WHERE assignmentId = a.id AND studentId = ?)
        LEFT JOIN Upload up ON s.uploadId = up.id
        WHERE e.userId = ? AND e.status = 'APPROVED'
        GROUP BY a.id, s.id
        ORDER BY a.dueDate DESC, a.createdAt DESC
      `;
      const result = await c.env.DB.prepare(query).bind(session.id, session.id, session.id).all();
      return c.json(successResponse(result.results || []));
    }

    if (!classId) {
      return c.json(errorResponse('classId query parameter is required for teachers and academy owners'), 400);
    }

    let query = '';
    let bindings: string[] = [];

    if (session.role === 'TEACHER') {
      // Teachers see all assignments for their classes
      query = `
        SELECT 
          a.id, a.classId, a.teacherId, a.title, a.description, 
          a.dueDate, a.maxScore, a.uploadId, a.createdAt, a.updatedAt,
          c.name as className,
          GROUP_CONCAT(DISTINCT aa.uploadId) as attachmentIds,
          COUNT(DISTINCT aa.id) as attachmentCount,
          COUNT(DISTINCT s.id) as submissionCount,
          COUNT(DISTINCT CASE WHEN s.gradedAt IS NOT NULL THEN s.id END) as gradedCount
        FROM Assignment a
        JOIN Class c ON a.classId = c.id
        LEFT JOIN AssignmentAttachment aa ON a.id = aa.assignmentId
        LEFT JOIN AssignmentSubmission s ON a.id = s.assignmentId
        WHERE a.classId = ? AND a.teacherId = ?
        GROUP BY a.id
        ORDER BY a.dueDate DESC, a.createdAt DESC
      `;
      bindings = [classId, session.id];
    } else if (session.role === 'ACADEMY') {
      // Academy owners see all assignments for classes in their academy
      query = `
        SELECT 
          a.id, a.classId, a.teacherId, a.title, a.description, 
          a.dueDate, a.maxScore, a.uploadId, a.createdAt, a.updatedAt,
          c.name as className,
          GROUP_CONCAT(DISTINCT aa.uploadId) as attachmentIds,
          COUNT(DISTINCT aa.id) as attachmentCount,
          COUNT(DISTINCT s.id) as submissionCount,
          COUNT(DISTINCT CASE WHEN s.gradedAt IS NOT NULL THEN s.id END) as gradedCount
        FROM Assignment a
        JOIN Class c ON a.classId = c.id
        JOIN Academy ac ON c.academyId = ac.id
        LEFT JOIN AssignmentAttachment aa ON a.id = aa.assignmentId
        LEFT JOIN AssignmentSubmission s ON a.id = s.assignmentId
        WHERE a.classId = ? AND ac.ownerId = ?
        GROUP BY a.id
        ORDER BY a.dueDate DESC, a.createdAt DESC
      `;
      bindings = [classId, session.id];
    } else if (session.role === 'STUDENT') {
      // Students see assignments with their submission status for specific class
      query = `
        SELECT 
          a.id, a.classId, a.title, a.description, 
          a.dueDate, a.maxScore, a.uploadId, a.createdAt,
          c.name as className,
          u.fileName as attachmentName,
          s.id as submissionId,
          s.uploadId as submissionUploadId,
          up.storagePath as submissionStoragePath,
          s.score,
          s.feedback,
          s.submittedAt,
          s.gradedAt,
          s.version
        FROM Assignment a
        JOIN Class c ON a.classId = c.id
        LEFT JOIN Upload u ON a.uploadId = u.id
        LEFT JOIN AssignmentSubmission s ON a.id = s.assignmentId AND s.studentId = ?
          AND s.version = (SELECT MAX(version) FROM AssignmentSubmission WHERE assignmentId = a.id AND studentId = ?)
        LEFT JOIN Upload up ON s.uploadId = up.id
        WHERE a.classId = ?
        ORDER BY a.dueDate DESC, a.createdAt DESC
      `;
      bindings = [session.id, session.id, classId];
    } else {
      return c.json(errorResponse('Unauthorized'), 403);
    }

    const result = await c.env.DB.prepare(query).bind(...bindings).all();

    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    console.error('[Assignments GET] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// POST /assignments - Create new assignment (teachers and academy owners)
assignments.post('/', validateBody(createAssignmentSchema), async (c) => {
  try {
    const session = await requireAuth(c);

    if (session.role !== 'TEACHER' && session.role !== 'ACADEMY') {
      return c.json(errorResponse('Only teachers and academy owners can create assignments'), 403);
    }

    const body = await c.req.json();
    const { classId, title, description, dueDate, maxScore, uploadId, uploadIds } = body;

    // Collect all upload IDs (support both single uploadId and array uploadIds)
    let allUploadIds: string[] = [];
    if (uploadIds && Array.isArray(uploadIds) && uploadIds.length > 0) {
      allUploadIds = uploadIds;
    } else if (uploadId) {
      allUploadIds = [uploadId];
    }

    // Verify user has access to this class
    let classCheck;
    if (session.role === 'TEACHER') {
      classCheck = await c.env.DB.prepare(`
        SELECT id FROM Class WHERE id = ? AND teacherId = ?
      `).bind(classId, session.id).first();
    } else if (session.role === 'ACADEMY') {
      // Academy owner can create assignments for any class in their academy
      classCheck = await c.env.DB.prepare(`
        SELECT c.id FROM Class c
        JOIN Academy a ON c.academyId = a.id
        WHERE c.id = ? AND a.ownerId = ?
      `).bind(classId, session.id).first();
    }

    if (!classCheck) {
      return c.json(errorResponse('Class not found or you do not have permission'), 403);
    }

    const assignmentId = nanoid();

    // Create Assignment record (no file columns except legacy uploadId)
    await c.env.DB.prepare(`
      INSERT INTO Assignment (id, classId, teacherId, title, description, dueDate, maxScore, uploadId, attachmentIds)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      assignmentId,
      classId,
      session.id,
      title,
      description || null,
      dueDate || null,
      maxScore || 100,
      allUploadIds.length > 0 ? allUploadIds[0] : null, // Legacy: first file as uploadId
      '[]' // Deprecated column, keep empty for now
    ).run();

    // Create AssignmentAttachment records (state of the art approach)
    for (const uploadId of allUploadIds) {
      const attachmentId = nanoid();
      await c.env.DB.prepare(`
        INSERT INTO AssignmentAttachment (id, assignmentId, uploadId)
        VALUES (?, ?, ?)
      `).bind(attachmentId, assignmentId, uploadId).run();
    }

    const assignment = await c.env.DB.prepare(`
      SELECT * FROM Assignment WHERE id = ?
    `).bind(assignmentId).first();

    return c.json(successResponse(assignment), 201);
  } catch (error: any) {
    console.error('[Assignments POST] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// GET /assignments/ungraded-count - Count of ungraded submissions for teacher/academy
// IMPORTANT: Must be before /:id route to avoid matching "ungraded-count" as an ID
assignments.get('/ungraded-count', async (c) => {
  try {
    const session = await requireAuth(c);
    
    let count = 0;
    
    if (session.role === 'TEACHER') {
      const result: any = await c.env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM AssignmentSubmission s
        JOIN Assignment a ON s.assignmentId = a.id
        WHERE a.teacherId = ?
        AND s.gradedAt IS NULL
      `).bind(session.id).first();
      count = result?.count || 0;
    } else if (session.role === 'ACADEMY') {
      const result: any = await c.env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM AssignmentSubmission s
        JOIN Assignment a ON s.assignmentId = a.id
        JOIN Class c ON a.classId = c.id
        JOIN Academy ac ON c.academyId = ac.id
        WHERE ac.ownerId = ?
        AND s.gradedAt IS NULL
      `).bind(session.id).first();
      count = result?.count || 0;
    } else if (session.role === 'ADMIN') {
      const result: any = await c.env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM AssignmentSubmission
        WHERE gradedAt IS NULL
      `).first();
      count = result?.count || 0;
    }
    
    return c.json(successResponse(count));
  } catch (error: any) {
    console.error('[Assignments ungraded-count] Error:', error);
    return c.json(errorResponse('Failed to fetch ungraded count'), 500);
  }
});

// GET /assignments/new-grades-count - Count of recently graded submissions for student
// IMPORTANT: Must be before /:id route to avoid matching "new-grades-count" as an ID
assignments.get('/new-grades-count', async (c) => {
  try {
    const session = await requireAuth(c);
    
    if (session.role !== 'STUDENT') {
      return c.json(errorResponse('Only students can view new grades count'), 403);
    }
    
    // Count graded submissions from last 30 days
    const result: any = await c.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM AssignmentSubmission
      WHERE studentId = ?
      AND gradedAt IS NOT NULL
      AND gradedAt >= datetime('now', '-30 days')
    `).bind(session.id).first();
    
    const count = result?.count || 0;
    
    return c.json(successResponse(count));
  } catch (error: any) {
    console.error('[Assignments new-grades-count] Error:', error);
    return c.json(errorResponse('Failed to fetch new grades count'), 500);
  }
});

// GET /assignments/:id - Get single assignment with submissions (teachers) or own submission (students)
assignments.get('/:id', async (c) => {
  try {
    const session = await requireAuth(c);
    const assignmentId = c.req.param('id');

    const assignment = await c.env.DB.prepare(`
      SELECT 
        a.*, 
        c.name as className,
        u.fileName as attachmentName,
        u.storagePath as attachmentStoragePath
      FROM Assignment a
      JOIN Class c ON a.classId = c.id
      LEFT JOIN Upload u ON a.uploadId = u.id
      WHERE a.id = ?
    `).bind(assignmentId).first();

    if (!assignment) {
      return c.json(errorResponse('Assignment not found'), 404);
    }

    // For teachers, academy owners, and admins, include all submissions
    if ((session.role === 'TEACHER' && assignment.teacherId === session.id) || 
        (session.role === 'ACADEMY') ||
        (session.role === 'ADMIN')) {
      // For academy owners, verify they own the academy
      if (session.role === 'ACADEMY') {
        const academyCheck = await c.env.DB.prepare(`
          SELECT 1 FROM Class c
          JOIN Academy a ON c.academyId = a.id
          WHERE c.id = ? AND a.ownerId = ?
        `).bind(assignment.classId, session.id).first();
        
        if (!academyCheck) {
          return c.json(errorResponse('Unauthorized'), 403);
        }
      }
      // ADMIN has unrestricted access
      
      const submissions = await c.env.DB.prepare(`
        SELECT 
          s.*,
          u.firstName || ' ' || u.lastName as studentName,
          u.email as studentEmail,
          up.fileName as submissionFileName,
          up.fileSize as submissionFileSize,
          up.storagePath as submissionStoragePath
        FROM AssignmentSubmission s
        JOIN User u ON s.studentId = u.id
        JOIN Upload up ON s.uploadId = up.id
        WHERE s.assignmentId = ?
        ORDER BY u.lastName ASC, u.firstName ASC, s.version DESC
      `).bind(assignmentId).all();

      return c.json(successResponse({ ...assignment, submissions: submissions.results || [] }));
    }

    // For students, include only their own submission (latest version)
    if (session.role === 'STUDENT') {
      const submission = await c.env.DB.prepare(`
        SELECT s.*, up.fileName as submissionFileName, up.storagePath as submissionStoragePath
        FROM AssignmentSubmission s
        LEFT JOIN Upload up ON s.uploadId = up.id
        WHERE s.assignmentId = ? AND s.studentId = ?
          AND s.version = (SELECT MAX(version) FROM AssignmentSubmission WHERE assignmentId = ? AND studentId = ?)
      `).bind(assignmentId, session.id, assignmentId, session.id).first();

      return c.json(successResponse({ ...assignment, submission }));
    }

    return c.json(errorResponse('Unauthorized'), 403);
  } catch (error: any) {
    console.error('[Assignments/:id GET] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// POST /assignments/:id/submit - Submit assignment (students only)
assignments.post('/:id/submit', async (c) => {
  try {
    const session = await requireAuth(c);

    if (session.role !== 'STUDENT') {
      return c.json(errorResponse('Only students can submit assignments'), 403);
    }

    const assignmentId = c.req.param('id');
    const body = await c.req.json();
    const { uploadId, uploadIds } = body;

    // Support both single file (uploadId) and multiple files (uploadIds)
    const fileIds = uploadIds || (uploadId ? [uploadId] : []);

    if (fileIds.length === 0) {
      return c.json(errorResponse('uploadId or uploadIds is required'), 400);
    }

    // Verify assignment exists
    const assignment = await c.env.DB.prepare(`
      SELECT id, classId FROM Assignment WHERE id = ?
    `).bind(assignmentId).first();

    if (!assignment) {
      return c.json(errorResponse('Assignment not found'), 404);
    }

    // Verify student is enrolled in the class
    const enrollment = await c.env.DB.prepare(`
      SELECT id FROM ClassEnrollment 
      WHERE userId = ? AND classId = ? AND status = 'APPROVED'
    `).bind(session.id, assignment.classId).first();

    if (!enrollment) {
      return c.json(errorResponse('You are not enrolled in this class'), 403);
    }

    // Check if submission already exists
    const existingSubmissions = await c.env.DB.prepare(`
      SELECT id, version FROM AssignmentSubmission 
      WHERE assignmentId = ? AND studentId = ?
      ORDER BY version DESC
      LIMIT 1
    `).bind(assignmentId, session.id).first() as any;

    const newVersion = existingSubmissions ? (existingSubmissions.version + 1) : 1;
    const submissionId = nanoid();

    // Store first file as uploadId for backwards compatibility
    const primaryUploadId = fileIds[0];

    // Always create a NEW submission (never update existing)
    await c.env.DB.prepare(`
      INSERT INTO AssignmentSubmission (id, assignmentId, studentId, uploadId, version)
      VALUES (?, ?, ?, ?, ?)
    `).bind(submissionId, assignmentId, session.id, primaryUploadId, newVersion).run();

    const submission = await c.env.DB.prepare(`
      SELECT * FROM AssignmentSubmission WHERE id = ?
    `).bind(submissionId).first();

    return c.json(successResponse(submission), 201);
  } catch (error: any) {
    console.error('[Assignments/:id/submit POST] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// PATCH /assignments/submissions/:submissionId/grade - Grade submission (teachers only)
assignments.patch('/submissions/:submissionId/grade', validateBody(gradeSubmissionSchema), async (c) => {
  const submissionId = c.req.param('submissionId');
  
  try {
    // Handle authentication separately to return proper 401
    let session;
    try {
      session = await requireAuth(c);
    } catch (authError) {
      return c.json(errorResponse('Not authenticated. Please log in.'), 401);
    }

    if (session.role !== 'TEACHER' && session.role !== 'ACADEMY' && session.role !== 'ADMIN') {
      return c.json(errorResponse('Only teachers, academy owners, and admins can grade assignments'), 403);
    }

    const submissionId = c.req.param('submissionId');
    const { score, feedback } = await c.req.json();

    // Verify submission exists and user has access
    const submission:any = await c.env.DB.prepare(`
      SELECT s.id, a.teacherId, c.id as classId
      FROM AssignmentSubmission s
      JOIN Assignment a ON s.assignmentId = a.id
      JOIN Class c ON a.classId = c.id
      WHERE s.id = ?
    `).bind(submissionId).first();

    if (!submission) {
      return c.json(errorResponse('Submission not found'), 404);
    }

    // Check permissions based on role
    if (session.role === 'TEACHER') {
      if (submission.teacherId !== session.id) {
        return c.json(errorResponse('You do not have permission to grade this assignment'), 403);
      }
    } else if (session.role === 'ACADEMY') {
      // Academy owners can grade assignments in their academies
      const academyCheck = await c.env.DB.prepare(`
        SELECT 1 FROM Class c
        JOIN Academy a ON c.academyId = a.id
        WHERE c.id = ? AND a.ownerId = ?
      `).bind(submission.classId, session.id).first();
      
      if (!academyCheck) {
        return c.json(errorResponse('You do not have permission to grade this assignment'), 403);
      }
    }
    // ADMIN has no restrictions

    await c.env.DB.prepare(`
      UPDATE AssignmentSubmission 
      SET score = ?, feedback = ?, gradedAt = datetime('now'), gradedBy = ?
      WHERE id = ?
    `).bind(score || null, feedback || null, session.id, submissionId).run();

    const updatedSubmission = await c.env.DB.prepare(`
      SELECT * FROM AssignmentSubmission WHERE id = ?
    `).bind(submissionId).first();

    return c.json(successResponse(updatedSubmission));
  } catch (error: any) {
    console.error('[Assignments/submissions/:id/grade PATCH] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// GET /assignments/:id/submissions/download - Get all submissions for bulk download (teachers only)
assignments.get('/:id/submissions/download', async (c) => {
  try {
    const session = await requireAuth(c);

    if (session.role !== 'TEACHER') {
      return c.json(errorResponse('Only teachers can download submissions'), 403);
    }

    const assignmentId = c.req.param('id');
    const onlyNew = c.req.query('onlyNew') === 'true';

    // Verify assignment exists and teacher has access
    const assignment = await c.env.DB.prepare(`
      SELECT id, teacherId, title FROM Assignment WHERE id = ?
    `).bind(assignmentId).first();

    if (!assignment) {
      return c.json(errorResponse('Assignment not found'), 404);
    }

    if (assignment.teacherId !== session.id) {
      return c.json(errorResponse('You do not have permission'), 403);
    }

    // Get submissions
    let query = `
      SELECT 
        s.id, s.uploadId, s.studentId, s.submittedAt, s.downloadedAt,
        u.firstName || ' ' || u.lastName as studentName,
        up.fileName, up.storagePath, up.mimeType, up.fileSize
      FROM AssignmentSubmission s
      JOIN User u ON s.studentId = u.id
      JOIN Upload up ON s.uploadId = up.id
      WHERE s.assignmentId = ?
    `;

    if (onlyNew) {
      query += ' AND s.downloadedAt IS NULL';
    }

    query += ' ORDER BY s.submittedAt DESC';

    const result = await c.env.DB.prepare(query).bind(assignmentId).all();

    const submissions = result.results || [];

    // Mark submissions as downloaded
    if (submissions.length > 0) {
      const submissionIds = submissions.map((s: any) => s.id);
      const placeholders = submissionIds.map(() => '?').join(',');
      await c.env.DB.prepare(`
        UPDATE AssignmentSubmission 
        SET downloadedAt = datetime('now')
        WHERE id IN (${placeholders})
      `).bind(...submissionIds).run();
    }

    return c.json(successResponse({
      assignmentTitle: assignment.title,
      submissions
    }));
  } catch (error: any) {
    console.error('[Assignments/:id/submissions/download GET] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// PATCH /assignments/:id - Update assignment (teachers and academy owners)
assignments.patch('/:id', async (c) => {
  try {
    const session = await requireAuth(c);

    if (session.role !== 'TEACHER' && session.role !== 'ACADEMY') {
      return c.json(errorResponse('Only teachers and academy owners can update assignments'), 403);
    }

    const assignmentId = c.req.param('id');
    const { title, description, dueDate, maxScore, uploadId, uploadIds } = await c.req.json();

    // Verify assignment exists
    const assignment = await c.env.DB.prepare(`
      SELECT a.id, a.teacherId, a.classId, c.academyId 
      FROM Assignment a
      JOIN Class c ON a.classId = c.id
      WHERE a.id = ?
    `).bind(assignmentId).first();

    if (!assignment) {
      return c.json(errorResponse('Assignment not found'), 404);
    }

    // Verify permission
    if (session.role === 'TEACHER') {
      // Teacher must be the assignment creator
      if (assignment.teacherId !== session.id) {
        return c.json(errorResponse('You do not have permission to update this assignment'), 403);
      }
    } else if (session.role === 'ACADEMY') {
      // Academy owner must own the academy
      const academy = await c.env.DB.prepare(`
        SELECT id FROM Academy WHERE id = ? AND ownerId = ?
      `).bind(assignment.academyId, session.id).first();

      if (!academy) {
        return c.json(errorResponse('You do not have permission to update this assignment'), 403);
      }
    }

    // Update assignment
    const updatedAt = new Date().toISOString();
    const updateFields = [];
    const bindings = [];

    if (title !== undefined) {
      updateFields.push('title = ?');
      bindings.push(title);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      bindings.push(description);
    }
    if (dueDate !== undefined) {
      updateFields.push('dueDate = ?');
      bindings.push(dueDate);
    }
    if (maxScore !== undefined) {
      updateFields.push('maxScore = ?');
      bindings.push(maxScore);
    }
    if (uploadId !== undefined) {
      updateFields.push('uploadId = ?');
      bindings.push(uploadId);
    }
    if (uploadIds !== undefined) {
      updateFields.push('attachmentIds = ?');
      bindings.push(JSON.stringify(uploadIds));
    }

    updateFields.push('updatedAt = ?');
    bindings.push(updatedAt);
    bindings.push(assignmentId);

    await c.env.DB.prepare(`
      UPDATE Assignment 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `).bind(...bindings).run();

    return c.json(successResponse({ message: 'Assignment updated successfully' }));
  } catch (error: any) {
    console.error('[Assignments/:id PATCH] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// DELETE /assignments/:id - Delete assignment (teachers, academy owners, and admins)
assignments.delete('/:id', async (c) => {
  try {
    const session = await requireAuth(c);

    if (!['TEACHER', 'ACADEMY', 'ADMIN'].includes(session.role)) {
      return c.json(errorResponse('Only teachers, academy owners, and admins can delete assignments'), 403);
    }

    const assignmentId = c.req.param('id');

    // Verify assignment exists and get related info for permission check
    const assignment = await c.env.DB.prepare(`
      SELECT a.id, a.teacherId, a.classId, c.academyId, ac.ownerId
      FROM Assignment a
      JOIN Class c ON a.classId = c.id
      JOIN Academy ac ON c.academyId = ac.id
      WHERE a.id = ?
    `).bind(assignmentId).first();

    if (!assignment) {
      return c.json(errorResponse('Assignment not found'), 404);
    }

    // Permission check based on role
    if (session.role === 'TEACHER' && assignment.teacherId !== session.id) {
      return c.json(errorResponse('You can only delete your own assignments'), 403);
    }
    if (session.role === 'ACADEMY' && assignment.ownerId !== session.id) {
      return c.json(errorResponse('You can only delete assignments from your academy'), 403);
    }
    // ADMIN can delete any assignment

    await c.env.DB.prepare(`
      DELETE FROM Assignment WHERE id = ?
    `).bind(assignmentId).run();

    return c.json(successResponse({ message: 'Assignment deleted successfully' }));
  } catch (error: any) {
    console.error('[Assignments/:id DELETE] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

export default assignments;
