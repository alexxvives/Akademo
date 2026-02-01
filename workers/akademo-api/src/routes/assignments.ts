import { Hono } from 'hono';
import { requireAuth } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';
import { nanoid } from 'nanoid';

const assignments = new Hono();

// GET /assignments - List assignments for a class (for teachers and students)
assignments.get('/', async (c) => {
  try {
    const session = await requireAuth(c);
    const classId = c.req.query('classId');

    if (!classId) {
      return c.json(errorResponse('classId query parameter is required'), 400);
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
          u.fileName as attachmentName,
          COUNT(DISTINCT s.id) as submissionCount,
          COUNT(DISTINCT CASE WHEN s.gradedAt IS NOT NULL THEN s.id END) as gradedCount
        FROM Assignment a
        JOIN Class c ON a.classId = c.id
        LEFT JOIN Upload u ON a.uploadId = u.id
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
          u.fileName as attachmentName,
          COUNT(DISTINCT s.id) as submissionCount,
          COUNT(DISTINCT CASE WHEN s.gradedAt IS NOT NULL THEN s.id END) as gradedCount
        FROM Assignment a
        JOIN Class c ON a.classId = c.id
        JOIN Academy ac ON c.academyId = ac.id
        LEFT JOIN Upload u ON a.uploadId = u.id
        LEFT JOIN AssignmentSubmission s ON a.id = s.assignmentId
        WHERE a.classId = ? AND ac.ownerId = ?
        GROUP BY a.id
        ORDER BY a.dueDate DESC, a.createdAt DESC
      `;
      bindings = [classId, session.id];
    } else if (session.role === 'STUDENT') {
      // Students see assignments with their submission status
      query = `
        SELECT 
          a.id, a.classId, a.title, a.description, 
          a.dueDate, a.maxScore, a.uploadId, a.createdAt,
          u.fileName as attachmentName,
          s.id as submissionId,
          s.uploadId as submissionUploadId,
          s.score,
          s.feedback,
          s.submittedAt,
          s.gradedAt
        FROM Assignment a
        LEFT JOIN Upload u ON a.uploadId = u.id
        LEFT JOIN AssignmentSubmission s ON a.id = s.assignmentId AND s.studentId = ?
        WHERE a.classId = ?
        ORDER BY a.dueDate DESC, a.createdAt DESC
      `;
      bindings = [session.id, classId];
    } else {
      return c.json(errorResponse('Unauthorized'), 403);
    }

    const result = await c.env.DB.prepare(query).bind(...bindings).all();

    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    console.error('[Assignments GET] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// POST /assignments - Create new assignment (teachers and academy owners)
assignments.post('/', async (c) => {
  try {
    const session = await requireAuth(c);

    if (session.role !== 'TEACHER' && session.role !== 'ACADEMY') {
      return c.json(errorResponse('Only teachers and academy owners can create assignments'), 403);
    }

    const body = await c.req.json();
    const { classId, title, description, dueDate, maxScore, uploadId } = body;

    if (!classId || !title) {
      return c.json(errorResponse('classId and title are required'), 400);
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

    await c.env.DB.prepare(`
      INSERT INTO Assignment (id, classId, teacherId, title, description, dueDate, maxScore, uploadId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      assignmentId,
      classId,
      session.id,
      title,
      description || null,
      dueDate || null,
      maxScore || 100,
      uploadId || null
    ).run();

    const assignment = await c.env.DB.prepare(`
      SELECT * FROM Assignment WHERE id = ?
    `).bind(assignmentId).first();

    return c.json(successResponse(assignment), 201);
  } catch (error: any) {
    console.error('[Assignments POST] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
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
        u.fileName as attachmentName
      FROM Assignment a
      JOIN Class c ON a.classId = c.id
      LEFT JOIN Upload u ON a.uploadId = u.id
      WHERE a.id = ?
    `).bind(assignmentId).first();

    if (!assignment) {
      return c.json(errorResponse('Assignment not found'), 404);
    }

    // For teachers and academy owners, include all submissions
    if ((session.role === 'TEACHER' && assignment.teacherId === session.id) || 
        (session.role === 'ACADEMY')) {
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
      
      const submissions = await c.env.DB.prepare(`
        SELECT 
          s.*,
          u.firstName || ' ' || u.lastName as studentName,
          u.email as studentEmail,
          up.fileName as submissionFileName,
          up.fileSize as submissionFileSize
        FROM AssignmentSubmission s
        JOIN User u ON s.studentId = u.id
        JOIN Upload up ON s.uploadId = up.id
        WHERE s.assignmentId = ?
        ORDER BY s.submittedAt DESC
      `).bind(assignmentId).all();

      return c.json(successResponse({ ...assignment, submissions: submissions.results || [] }));
    }

    // For students, include only their own submission
    if (session.role === 'STUDENT') {
      const submission = await c.env.DB.prepare(`
        SELECT s.*, up.fileName as submissionFileName
        FROM AssignmentSubmission s
        LEFT JOIN Upload up ON s.uploadId = up.id
        WHERE s.assignmentId = ? AND s.studentId = ?
      `).bind(assignmentId, session.id).first();

      return c.json(successResponse({ ...assignment, submission }));
    }

    return c.json(errorResponse('Unauthorized'), 403);
  } catch (error: any) {
    console.error('[Assignments/:id GET] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
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
    const { uploadId } = body;

    if (!uploadId) {
      return c.json(errorResponse('uploadId is required'), 400);
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
    const existingSubmission = await c.env.DB.prepare(`
      SELECT id FROM AssignmentSubmission 
      WHERE assignmentId = ? AND studentId = ?
    `).bind(assignmentId, session.id).first();

    const submissionId = existingSubmission?.id || nanoid();

    if (existingSubmission) {
      // Update existing submission
      await c.env.DB.prepare(`
        UPDATE AssignmentSubmission 
        SET uploadId = ?, submittedAt = datetime('now'), score = NULL, feedback = NULL, gradedAt = NULL, gradedBy = NULL
        WHERE id = ?
      `).bind(uploadId, submissionId).run();
    } else {
      // Create new submission
      await c.env.DB.prepare(`
        INSERT INTO AssignmentSubmission (id, assignmentId, studentId, uploadId)
        VALUES (?, ?, ?, ?)
      `).bind(submissionId, assignmentId, session.id, uploadId).run();
    }

    const submission = await c.env.DB.prepare(`
      SELECT * FROM AssignmentSubmission WHERE id = ?
    `).bind(submissionId).first();

    return c.json(successResponse(submission), 201);
  } catch (error: any) {
    console.error('[Assignments/:id/submit POST] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// PATCH /assignments/submissions/:submissionId/grade - Grade submission (teachers only)
assignments.patch('/submissions/:submissionId/grade', async (c) => {
  try {
    const session = await requireAuth(c);

    if (session.role !== 'TEACHER') {
      return c.json(errorResponse('Only teachers can grade assignments'), 403);
    }

    const submissionId = c.req.param('submissionId');
    const body = await c.req.json();
    const { score, feedback } = body;

    // Verify submission exists and teacher has access
    const submission = await c.env.DB.prepare(`
      SELECT s.id, a.teacherId
      FROM AssignmentSubmission s
      JOIN Assignment a ON s.assignmentId = a.id
      WHERE s.id = ?
    `).bind(submissionId).first();

    if (!submission) {
      return c.json(errorResponse('Submission not found'), 404);
    }

    if (submission.teacherId !== session.id) {
      return c.json(errorResponse('You do not have permission to grade this assignment'), 403);
    }

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
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
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
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

// DELETE /assignments/:id - Delete assignment (teachers only)
assignments.delete('/:id', async (c) => {
  try {
    const session = await requireAuth(c);

    if (session.role !== 'TEACHER') {
      return c.json(errorResponse('Only teachers can delete assignments'), 403);
    }

    const assignmentId = c.req.param('id');

    // Verify assignment exists and teacher has access
    const assignment = await c.env.DB.prepare(`
      SELECT id, teacherId FROM Assignment WHERE id = ?
    `).bind(assignmentId).first();

    if (!assignment) {
      return c.json(errorResponse('Assignment not found'), 404);
    }

    if (assignment.teacherId !== session.id) {
      return c.json(errorResponse('You do not have permission'), 403);
    }

    await c.env.DB.prepare(`
      DELETE FROM Assignment WHERE id = ?
    `).bind(assignmentId).run();

    return c.json(successResponse({ message: 'Assignment deleted successfully' }));
  } catch (error: any) {
    console.error('[Assignments/:id DELETE] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

export default assignments;
