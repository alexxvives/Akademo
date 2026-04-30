import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';
import { nanoid } from 'nanoid';
import { validateBody, createAssignmentSchema, gradeSubmissionSchema } from '../lib/validation';
import { isAccessBlocked } from '../lib/payment-utils';

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
          a.id, a.classId, a.teacherId, a.title, a.description, a.type,
          a.dueDate, a.maxScore, a.uploadId, a.solutionUploadId, a.createdAt, a.updatedAt,
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
          a.id, a.classId, a.teacherId, a.title, a.description, a.type,
          a.dueDate, a.maxScore, a.uploadId, a.solutionUploadId, a.createdAt, a.updatedAt,
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
          a.id, a.classId, a.teacherId, a.title, a.description, a.type,
          a.dueDate, a.maxScore, a.uploadId, a.solutionUploadId, a.createdAt, a.updatedAt,
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
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Assignments GET /all] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// GET /assignments - List assignments for a class (for teachers and students), or all assignments for students
assignments.get('/', async (c) => {
  try {
    const session = await requireAuth(c);
    const classId = c.req.query('classId');
    const lessonId = c.req.query('lessonId');
    const lessonWhere = lessonId ? 'AND a.lessonId = ?' : '';
    const lessonBinding: string[] = lessonId ? [lessonId] : [];

    // Students can fetch all assignments across all enrolled classes if classId is not provided
    if (!classId && session.role === 'STUDENT') {
      // Get all assignments from all enrolled classes
      const query = `
        SELECT 
          a.id, a.classId, a.title, a.description, a.type,
          a.dueDate, a.maxScore, a.uploadId, a.solutionUploadId, a.createdAt,
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
          COUNT(DISTINCT aa.id) as attachmentCount,
          e.classId as enrolledClassId,
          qa.id as quizAttemptId,
          qa.score as quizScore,
          qa.totalQuestions as quizTotalQuestions,
          qa.correctAnswers as quizCorrectAnswers
        FROM Assignment a
        JOIN Class c ON a.classId = c.id
        JOIN ClassEnrollment e ON c.id = e.classId
        LEFT JOIN AssignmentAttachment aa ON a.id = aa.assignmentId
        LEFT JOIN AssignmentSubmission s ON a.id = s.assignmentId AND s.studentId = ?
        LEFT JOIN Upload up ON s.uploadId = up.id
        LEFT JOIN QuizAttempt qa ON a.id = qa.assignmentId AND qa.studentId = ?
        WHERE e.userId = ? AND e.status = 'APPROVED'
        GROUP BY a.id, s.id
        ORDER BY a.dueDate DESC, a.createdAt DESC
      `;
      const result = await c.env.DB.prepare(query).bind(session.id, session.id, session.id).all();

      // Filter out assignments from classes with overdue payments
      const filtered: any[] = [];
      const overdueCache = new Map<string, boolean>();
      for (const row of (result.results || []) as any[]) {
        const cId = row.enrolledClassId || row.classId;
        if (!overdueCache.has(cId)) {
          overdueCache.set(cId, await isAccessBlocked(c.env.DB, session.id, cId));
        }
        if (!overdueCache.get(cId)) {
          filtered.push(row);
        }
      }
      return c.json(successResponse(filtered));
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
          a.id, a.classId, a.teacherId, a.lessonId, a.title, a.description, a.type,
          a.dueDate, a.maxScore, a.uploadId, a.solutionUploadId, a.createdAt, a.updatedAt,
          c.name as className,
          GROUP_CONCAT(DISTINCT aa.uploadId) as attachmentIds,
          COUNT(DISTINCT aa.id) as attachmentCount,
          COUNT(DISTINCT s.id) as submissionCount,
          COUNT(DISTINCT CASE WHEN s.gradedAt IS NOT NULL THEN s.id END) as gradedCount
        FROM Assignment a
        JOIN Class c ON a.classId = c.id
        LEFT JOIN AssignmentAttachment aa ON a.id = aa.assignmentId
        LEFT JOIN AssignmentSubmission s ON a.id = s.assignmentId
        WHERE a.classId = ? AND a.teacherId = ? ${lessonWhere}
        GROUP BY a.id
        ORDER BY a.dueDate DESC, a.createdAt DESC
      `;
      bindings = [classId, session.id, ...lessonBinding];
    } else if (session.role === 'ACADEMY' || session.role === 'ADMIN') {
      // Academy owners see assignments for classes in their academy; ADMIN sees all
      const ownerFilter = session.role === 'ADMIN' ? '' : 'AND ac.ownerId = ?';
      query = `
        SELECT 
          a.id, a.classId, a.teacherId, a.lessonId, a.title, a.description, a.type,
          a.dueDate, a.maxScore, a.uploadId, a.solutionUploadId, a.createdAt, a.updatedAt,
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
        WHERE a.classId = ? ${ownerFilter} ${lessonWhere}
        GROUP BY a.id
        ORDER BY a.dueDate DESC, a.createdAt DESC
      `;
      bindings = session.role === 'ADMIN' ? [classId, ...lessonBinding] : [classId, session.id, ...lessonBinding];
    } else if (session.role === 'STUDENT') {
      // Verify enrollment before listing assignments for a specific class
      const enrollment = await c.env.DB.prepare(
        "SELECT id FROM ClassEnrollment WHERE userId = ? AND classId = ? AND status = 'APPROVED'"
      ).bind(session.id, classId).first();
      if (!enrollment) {
        return c.json(errorResponse('No estás matriculado en esta clase'), 403);
      }

      // Block students without signed document or with overdue payments
      if (await isAccessBlocked(c.env.DB, session.id, classId)) {
        return c.json(errorResponse('Acceso bloqueado. Firma el documento y regulariza tu situación de pago.'), 403);
      }

      // Students see assignments with their submission status for specific class
      query = `
        SELECT 
          a.id, a.classId, a.lessonId, a.title, a.description, a.type,
          a.dueDate, a.maxScore, a.uploadId, a.solutionUploadId, a.createdAt,
          c.name as className,
          s.id as submissionId,
          s.uploadId as submissionUploadId,
          up.storagePath as submissionStoragePath,
          s.score,
          s.feedback,
          s.submittedAt,
          s.gradedAt,
          s.version,
          GROUP_CONCAT(DISTINCT aa.uploadId) as attachmentIds,
          qa.id as quizAttemptId,
          qa.score as quizScore,
          qa.totalQuestions as quizTotalQuestions,
          qa.correctAnswers as quizCorrectAnswers
        FROM Assignment a
        JOIN Class c ON a.classId = c.id
        LEFT JOIN AssignmentAttachment aa ON a.id = aa.assignmentId
        LEFT JOIN AssignmentSubmission s ON a.id = s.assignmentId AND s.studentId = ?
        LEFT JOIN Upload up ON s.uploadId = up.id
        LEFT JOIN QuizAttempt qa ON a.id = qa.assignmentId AND qa.studentId = ?
        WHERE a.classId = ? ${lessonWhere}
        GROUP BY a.id
        ORDER BY a.dueDate DESC, a.createdAt DESC
      `;
      bindings = [session.id, session.id, classId, ...lessonBinding];
    } else {
      return c.json(errorResponse('Unauthorized'), 403);
    }

    const result = await c.env.DB.prepare(query).bind(...bindings).all();

    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Assignments GET] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// POST /assignments - Create new assignment (teachers and academy owners)
assignments.post('/', async (c) => {
  try {
    const session = await requireAuth(c);

    if (session.role !== 'TEACHER' && session.role !== 'ACADEMY') {
      return c.json(errorResponse('Only teachers and academy owners can create assignments'), 403);
    }

    // Validate body AFTER auth to avoid leaking field names to unauthenticated users
    const body = await c.req.json();
    const validation = createAssignmentSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map((e: any) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return c.json({ success: false, error: 'Validation failed', details: errors }, 400);
    }
    const { classId, lessonId: assignmentLessonId, title, description, dueDate, maxScore, uploadId, uploadIds, type, questions } = body;

    // Validate quiz-specific fields
    if (type === 'quiz') {
      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        return c.json(errorResponse('Quiz must have at least one question'), 400);
      }
    }

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

    // Build all statements for atomic batch insert
    const statements: D1PreparedStatement[] = [
      c.env.DB.prepare(`
        INSERT INTO Assignment (id, classId, teacherId, lessonId, title, description, dueDate, maxScore, uploadId, attachmentIds, type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        assignmentId,
        classId,
        session.id,
        assignmentLessonId || null,
        title,
        description || null,
        dueDate || null,
        maxScore || 100,
        allUploadIds.length > 0 ? allUploadIds[0] : null,
        '[]',
        type || 'file'
      ),
    ];

    // Create AssignmentAttachment records for file type
    if (type !== 'quiz') {
      for (const uploadId of allUploadIds) {
        const attachmentId = nanoid();
        statements.push(
          c.env.DB.prepare(`
            INSERT INTO AssignmentAttachment (id, assignmentId, uploadId)
            VALUES (?, ?, ?)
          `).bind(attachmentId, assignmentId, uploadId)
        );
      }
    }

    // Create QuizQuestion records for quiz type
    if (type === 'quiz' && questions) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const questionId = nanoid();
        statements.push(
          c.env.DB.prepare(`
            INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, explanation)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).bind(
            questionId,
            assignmentId,
            q.questionText,
            i,
            JSON.stringify(q.options),
            JSON.stringify(q.correctOptionIds),
            q.explanation || null
          )
        );
      }
    }

    // Execute all inserts atomically
    await c.env.DB.batch(statements);

    const assignment = await c.env.DB.prepare(`
      SELECT * FROM Assignment WHERE id = ?
    `).bind(assignmentId).first();

    return c.json(successResponse(assignment), 201);
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Assignments POST] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// GET /assignments/grades - All graded submissions for calificaciones page (avoids N+1)
// IMPORTANT: Must be before /:id route
assignments.get('/grades', async (c) => {
  try {
    const session = await requireAuth(c);
    const classId = c.req.query('classId');
    const academyId = c.req.query('academyId');

    let query = '';
    let bindings: string[] = [];

    if (session.role === 'TEACHER') {
      query = `
        SELECT
          s.studentId, s.score, s.gradedAt,
          s.uploadId as submissionUploadId,
          sup.storagePath as submissionStoragePath,
          a.id as assignmentId, a.title as assignmentTitle, a.maxScore,
          a.uploadId as assignmentUploadId,
          aup.storagePath as assignmentStoragePath,
          a.attachmentIds as assignmentAttachmentIds,
          c.name as className,
          u.firstName || ' ' || u.lastName as studentName,
          u.email as studentEmail
        FROM AssignmentSubmission s
        JOIN Assignment a ON s.assignmentId = a.id
        JOIN Class c ON a.classId = c.id
        JOIN User u ON s.studentId = u.id
        LEFT JOIN Upload sup ON s.uploadId = sup.id
        LEFT JOIN Upload aup ON a.uploadId = aup.id
        WHERE a.teacherId = ? AND s.gradedAt IS NOT NULL
        ${classId ? 'AND a.classId = ?' : ''}
        ORDER BY s.gradedAt DESC
      `;
      bindings = classId ? [session.id, classId] : [session.id];
    } else if (session.role === 'ACADEMY') {
      query = `
        SELECT
          s.studentId, s.score, s.gradedAt,
          s.uploadId as submissionUploadId,
          sup.storagePath as submissionStoragePath,
          a.id as assignmentId, a.title as assignmentTitle, a.maxScore,
          a.uploadId as assignmentUploadId,
          aup.storagePath as assignmentStoragePath,
          a.attachmentIds as assignmentAttachmentIds,
          c.name as className,
          u.firstName || ' ' || u.lastName as studentName,
          u.email as studentEmail
        FROM AssignmentSubmission s
        JOIN Assignment a ON s.assignmentId = a.id
        JOIN Class c ON a.classId = c.id
        JOIN Academy ac ON c.academyId = ac.id
        JOIN User u ON s.studentId = u.id
        LEFT JOIN Upload sup ON s.uploadId = sup.id
        LEFT JOIN Upload aup ON a.uploadId = aup.id
        WHERE ac.ownerId = ? AND s.gradedAt IS NOT NULL
        ${classId ? 'AND a.classId = ?' : ''}
        ORDER BY s.gradedAt DESC
      `;
      bindings = classId ? [session.id, classId] : [session.id];
    } else if (session.role === 'ADMIN') {
      const academyFilter = academyId ? 'AND ac.id = ?' : '';
      const classFilter = classId ? 'AND a.classId = ?' : '';
      query = `
        SELECT
          s.studentId, s.score, s.gradedAt,
          s.uploadId as submissionUploadId,
          sup.storagePath as submissionStoragePath,
          a.id as assignmentId, a.title as assignmentTitle, a.maxScore,
          a.uploadId as assignmentUploadId,
          aup.storagePath as assignmentStoragePath,
          a.attachmentIds as assignmentAttachmentIds,
          c.name as className,
          u.firstName || ' ' || u.lastName as studentName,
          u.email as studentEmail
        FROM AssignmentSubmission s
        JOIN Assignment a ON s.assignmentId = a.id
        JOIN Class c ON a.classId = c.id
        JOIN Academy ac ON c.academyId = ac.id
        JOIN User u ON s.studentId = u.id
        LEFT JOIN Upload sup ON s.uploadId = sup.id
        LEFT JOIN Upload aup ON a.uploadId = aup.id
        WHERE s.gradedAt IS NOT NULL ${academyFilter} ${classFilter}
        ORDER BY s.gradedAt DESC
      `;
      if (academyId && classId) bindings = [academyId, classId];
      else if (academyId) bindings = [academyId];
      else if (classId) bindings = [classId];
    } else {
      return c.json(errorResponse('Unauthorized'), 403);
    }

    const result = await c.env.DB.prepare(query).bind(...bindings).all();
    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Assignments GET /grades] Error:', error);
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
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
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
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
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
        ORDER BY u.lastName ASC, u.firstName ASC
      `).bind(assignmentId).all();

      return c.json(successResponse({ ...assignment, submissions: submissions.results || [] }));
    }

    // For students, verify enrollment + payment wall before showing assignment details
    if (session.role === 'STUDENT') {
      const enrollment = await c.env.DB.prepare(
        "SELECT id FROM ClassEnrollment WHERE userId = ? AND classId = ? AND status = 'APPROVED'"
      ).bind(session.id, assignment.classId).first();
      if (!enrollment) {
        return c.json(errorResponse('No estás matriculado en esta clase'), 403);
      }
      if (await isAccessBlocked(c.env.DB, session.id, assignment.classId as string)) {
        return c.json(errorResponse('Acceso bloqueado. Firma el documento y regulariza tu situación de pago.'), 403);
      }

      const submission = await c.env.DB.prepare(`
        SELECT s.*, up.fileName as submissionFileName, up.storagePath as submissionStoragePath
        FROM AssignmentSubmission s
        LEFT JOIN Upload up ON s.uploadId = up.id
        WHERE s.assignmentId = ? AND s.studentId = ?
      `).bind(assignmentId, session.id).first();

      return c.json(successResponse({ ...assignment, submission }));
    }

    return c.json(errorResponse('Unauthorized'), 403);
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
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
      SELECT id, classId, dueDate FROM Assignment WHERE id = ?
    `).bind(assignmentId).first() as any;

    if (!assignment) {
      return c.json(errorResponse('Assignment not found'), 404);
    }

    // Enforce deadline - block submissions after due date
    if (assignment.dueDate && new Date(assignment.dueDate) < new Date()) {
      return c.json(errorResponse('La fecha límite ha pasado. No se pueden entregar ejercicios.'), 403);
    }

    // Verify student is enrolled in the class
    const enrollment = await c.env.DB.prepare(`
      SELECT id FROM ClassEnrollment 
      WHERE userId = ? AND classId = ? AND status = 'APPROVED'
    `).bind(session.id, assignment.classId).first();

    if (!enrollment) {
      return c.json(errorResponse('You are not enrolled in this class'), 403);
    }

    // Block students without signed document or with overdue payments
    if (await isAccessBlocked(c.env.DB, session.id, assignment.classId as string)) {
      return c.json(errorResponse('Acceso bloqueado. Firma el documento y regulariza tu situación de pago.'), 403);
    }

    // Delete any existing submission and create new one — atomic batch
    const submissionId = nanoid();

    // Store first file as uploadId for backwards compatibility
    const primaryUploadId = fileIds[0];

    // Atomic: delete old + insert new in one batch
    await c.env.DB.batch([
      c.env.DB.prepare(`
        DELETE FROM AssignmentSubmission WHERE assignmentId = ? AND studentId = ?
      `).bind(assignmentId, session.id),
      c.env.DB.prepare(`
        INSERT INTO AssignmentSubmission (id, assignmentId, studentId, uploadId, version)
        VALUES (?, ?, ?, ?, 1)
      `).bind(submissionId, assignmentId, session.id, primaryUploadId),
    ]);

    const submission = await c.env.DB.prepare(`
      SELECT * FROM AssignmentSubmission WHERE id = ?
    `).bind(submissionId).first();

    return c.json(successResponse(submission), 201);
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Assignments/:id/submit POST] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// DELETE /assignments/:id/submit - Student deletes their own submission
assignments.delete('/:id/submit', async (c) => {
  try {
    const session = await requireAuth(c);

    if (session.role !== 'STUDENT') {
      return c.json(errorResponse('Only students can delete their own submission'), 403);
    }

    const assignmentId = c.req.param('id');

    await c.env.DB.prepare(`
      DELETE FROM AssignmentSubmission WHERE assignmentId = ? AND studentId = ?
    `).bind(assignmentId, session.id).run();

    return c.json(successResponse({ message: 'Submission deleted' }));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Assignments/:id/submit DELETE] Error:', error);
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
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Assignments/submissions/:id/grade PATCH] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// GET /assignments/:id/submissions/download - Get all submissions for bulk download (teachers/academy/admin)
assignments.get('/:id/submissions/download', async (c) => {
  try {
    const session = await requireAuth(c);

    if (!['TEACHER', 'ACADEMY', 'ADMIN'].includes(session.role)) {
      return c.json(errorResponse('Only teachers, academy owners and admins can download submissions'), 403);
    }

    const assignmentId = c.req.param('id');
    const onlyNew = c.req.query('onlyNew') === 'true';

    // Verify assignment exists and user has access
    const assignment = await c.env.DB.prepare(`
      SELECT a.id, a.teacherId, a.title, a.classId, c.academyId
      FROM Assignment a
      JOIN Class c ON a.classId = c.id
      WHERE a.id = ?
    `).bind(assignmentId).first();

    if (!assignment) {
      return c.json(errorResponse('Assignment not found'), 404);
    }

    // Check permission based on role
    if (session.role === 'TEACHER' && assignment.teacherId !== session.id) {
      return c.json(errorResponse('You do not have permission'), 403);
    }
    if (session.role === 'ACADEMY') {
      const academy = await c.env.DB.prepare('SELECT id FROM Academy WHERE ownerId = ?').bind(session.id).first();
      if (!academy || academy.id !== assignment.academyId) {
        return c.json(errorResponse('You do not have permission'), 403);
      }
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
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
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
    const { title, description, dueDate, maxScore, uploadId, uploadIds, solutionUploadId, questions } = await c.req.json();

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
    if (solutionUploadId !== undefined) {
      updateFields.push('solutionUploadId = ?');
      bindings.push(solutionUploadId);
    }

    updateFields.push('updatedAt = ?');
    bindings.push(updatedAt);
    bindings.push(assignmentId);

    await c.env.DB.prepare(`
      UPDATE Assignment 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `).bind(...bindings).run();

    // If uploadIds provided, replace all AttachmentAttachment records
    if (uploadIds !== undefined && Array.isArray(uploadIds)) {
      await c.env.DB.prepare(`DELETE FROM AssignmentAttachment WHERE assignmentId = ?`).bind(assignmentId).run();
      for (const uid of uploadIds) {
        await c.env.DB.prepare(`INSERT INTO AssignmentAttachment (id, assignmentId, uploadId) VALUES (?, ?, ?)`).bind(nanoid(), assignmentId, uid).run();
      }
    }

    // If quiz questions provided, replace all QuizQuestion records
    if (questions !== undefined && Array.isArray(questions) && questions.length > 0) {
      await c.env.DB.prepare(`DELETE FROM QuizQuestion WHERE assignmentId = ?`).bind(assignmentId).run();
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await c.env.DB.prepare(
          `INSERT INTO QuizQuestion (id, assignmentId, questionText, questionOrder, options, correctOptionId, explanation)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          nanoid(), assignmentId, q.questionText, i,
          JSON.stringify(q.options || []),
          JSON.stringify(q.correctOptionIds || []),
          q.explanation || null
        ).run();
      }
    }

    return c.json(successResponse({ message: 'Assignment updated successfully' }));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
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
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Assignments/:id DELETE] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// DELETE /assignments/:id/submissions/:studentId - Remove a student's submission (teachers/academy/admin)
assignments.delete('/:id/submissions/:studentId', async (c) => {
  try {
    const session = await requireAuth(c);

    if (!['TEACHER', 'ACADEMY', 'ADMIN'].includes(session.role)) {
      return c.json(errorResponse('Unauthorized'), 403);
    }

    const assignmentId = c.req.param('id');
    const studentId = c.req.param('studentId');

    // Verify assignment exists and check permission
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

    if (session.role === 'TEACHER' && assignment.teacherId !== session.id) {
      return c.json(errorResponse('Unauthorized'), 403);
    }
    if (session.role === 'ACADEMY' && assignment.ownerId !== session.id) {
      return c.json(errorResponse('Unauthorized'), 403);
    }

    await c.env.DB.prepare(`
      DELETE FROM AssignmentSubmission WHERE assignmentId = ? AND studentId = ?
    `).bind(assignmentId, studentId).run();

    return c.json(successResponse({ message: 'Submission deleted successfully' }));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Assignments/:id/submissions/:studentId DELETE] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// ============ QUIZ ENDPOINTS ============

// GET /assignments/:id/questions - Get quiz questions (students see without correctOptionId)
assignments.get('/:id/questions', async (c) => {
  try {
    const session = await requireAuth(c);
    const assignmentId = c.req.param('id');

    const assignment = await c.env.DB.prepare(`
      SELECT a.id, a.classId, a.type, a.teacherId, a.dueDate, a.maxScore
      FROM Assignment a WHERE a.id = ? AND a.type = 'quiz'
    `).bind(assignmentId).first() as any;

    if (!assignment) {
      return c.json(errorResponse('Quiz not found'), 404);
    }

    // Verify access
    if (session.role === 'STUDENT') {
      const enrollment = await c.env.DB.prepare(
        "SELECT id FROM ClassEnrollment WHERE userId = ? AND classId = ? AND status = 'APPROVED'"
      ).bind(session.id, assignment.classId).first();
      if (!enrollment) return c.json(errorResponse('No estás matriculado en esta clase'), 403);
      if (await isAccessBlocked(c.env.DB, session.id, assignment.classId)) {
        return c.json(errorResponse('Acceso bloqueado. Firma el documento y regulariza tu situación de pago.'), 403);
      }
    }

    const questions = await c.env.DB.prepare(`
      SELECT id, questionText, questionOrder, options, correctOptionId, explanation
      FROM QuizQuestion WHERE assignmentId = ?
      ORDER BY questionOrder ASC
    `).bind(assignmentId).all();

    const parsed = (questions.results || []).map((q: any) => {
      let correctOptionIds: string[] = [];
      try {
        const raw = q.correctOptionId;
        const p = JSON.parse(raw);
        correctOptionIds = Array.isArray(p) ? p : [raw];
      } catch { correctOptionIds = q.correctOptionId ? [q.correctOptionId] : []; }
      return {
        ...q,
        options: JSON.parse(q.options || '[]'),
        correctOptionId: undefined,
        explanation: session.role === 'STUDENT' ? undefined : q.explanation,
        ...(session.role !== 'STUDENT' ? { correctOptionIds } : {}),
      };
    });

    return c.json(successResponse(parsed));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Quiz questions GET] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// POST /assignments/:id/quiz-submit - Submit quiz attempt (students only, one attempt)
assignments.post('/:id/quiz-submit', async (c) => {
  try {
    const session = await requireAuth(c);
    if (session.role !== 'STUDENT') {
      return c.json(errorResponse('Only students can submit quizzes'), 403);
    }

    const assignmentId = c.req.param('id');
    const body = await c.req.json();
    const { answers } = body; // [{questionId, selectedOptionId}]

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return c.json(errorResponse('Answers are required'), 400);
    }

    const assignment = await c.env.DB.prepare(`
      SELECT id, classId, dueDate, maxScore, type FROM Assignment WHERE id = ? AND type = 'quiz'
    `).bind(assignmentId).first() as any;

    if (!assignment) return c.json(errorResponse('Quiz not found'), 404);

    // Enforce deadline
    if (assignment.dueDate && new Date(assignment.dueDate) < new Date()) {
      return c.json(errorResponse('La fecha límite ha pasado.'), 403);
    }

    // Verify enrollment
    const enrollment = await c.env.DB.prepare(
      "SELECT id FROM ClassEnrollment WHERE userId = ? AND classId = ? AND status = 'APPROVED'"
    ).bind(session.id, assignment.classId).first();
    if (!enrollment) return c.json(errorResponse('No estás matriculado en esta clase'), 403);

    if (await isAccessBlocked(c.env.DB, session.id, assignment.classId)) {
      return c.json(errorResponse('Acceso bloqueado. Firma el documento y regulariza tu situación de pago.'), 403);
    }

    // Check if already attempted (first attempt only counts for grade)
    const existing = await c.env.DB.prepare(`
      SELECT id, score, totalQuestions, correctAnswers FROM QuizAttempt WHERE assignmentId = ? AND studentId = ?
    `).bind(assignmentId, session.id).first() as any;

    // Fetch questions to grade
    const questions = await c.env.DB.prepare(`
      SELECT id, correctOptionId, explanation FROM QuizQuestion WHERE assignmentId = ?
    `).bind(assignmentId).all();

    const questionMap = new Map<string, any>();
    for (const q of (questions.results || []) as any[]) {
      questionMap.set(q.id, q);
    }

    const totalQuestions = questionMap.size;
    let correctAnswers = 0;
    const gradedAnswers = [];

    for (const ans of answers) {
      const question = questionMap.get(ans.questionId);
      if (!question) continue;
      // Support both selectedOptionIds (array, new) and selectedOptionId (string, legacy)
      const selectedIds: string[] = ans.selectedOptionIds
        ? (Array.isArray(ans.selectedOptionIds) ? ans.selectedOptionIds : [ans.selectedOptionIds])
        : (ans.selectedOptionId ? [ans.selectedOptionId] : []);
      const corrIds: string[] = (() => {
        try {
          const raw = question.correctOptionId;
          return Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [raw];
        } catch { return question.correctOptionId ? [question.correctOptionId] : []; }
      })();
      // Exact set-match: must select all correct and no incorrect
      const correct = corrIds.length > 0 &&
        corrIds.length === selectedIds.length &&
        selectedIds.every((id: string) => corrIds.includes(id));
      if (correct) correctAnswers++;
      gradedAnswers.push({
        questionId: ans.questionId,
        selectedOptionId: selectedIds[0] ?? null,
        selectedOptionIds: selectedIds,
        correct,
        correctOptionIds: corrIds,
        explanation: question.explanation || null,
      });
    }

    const score = totalQuestions > 0
      ? Math.round((correctAnswers / totalQuestions) * (assignment.maxScore || 100) * 100) / 100
      : 0;

    // If already attempted: grade in-memory but don't overwrite official grade
    if (existing) {
      return c.json(successResponse({
        score,
        maxScore: assignment.maxScore || 100,
        totalQuestions,
        correctAnswers,
        answers: gradedAnswers,
        isRetry: true,
        officialScore: existing.score,
        officialTotalQuestions: existing.totalQuestions,
        officialCorrectAnswers: existing.correctAnswers,
      }));
    }

    // First attempt: save official grade
    const attemptId = nanoid();
    await c.env.DB.prepare(`
      INSERT INTO QuizAttempt (id, assignmentId, studentId, score, totalQuestions, correctAnswers, answers)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(attemptId, assignmentId, session.id, score, totalQuestions, correctAnswers, JSON.stringify(gradedAnswers)).run();

    return c.json(successResponse({
      attemptId,
      score,
      maxScore: assignment.maxScore || 100,
      totalQuestions,
      correctAnswers,
      answers: gradedAnswers,
      isRetry: false,
      officialScore: score,
    }), 201);
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Quiz submit POST] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// GET /assignments/:id/quiz-result - Get quiz result for student
assignments.get('/:id/quiz-result', async (c) => {
  try {
    const session = await requireAuth(c);
    const assignmentId = c.req.param('id');

    let attempt;
    if (session.role === 'STUDENT') {
      attempt = await c.env.DB.prepare(`
        SELECT * FROM QuizAttempt WHERE assignmentId = ? AND studentId = ?
      `).bind(assignmentId, session.id).first();
    } else {
      // Teachers/academy/admin can view any student's attempt via query param
      const studentId = c.req.query('studentId');
      if (!studentId) return c.json(errorResponse('studentId query param required'), 400);
      attempt = await c.env.DB.prepare(`
        SELECT * FROM QuizAttempt WHERE assignmentId = ? AND studentId = ?
      `).bind(assignmentId, studentId).first();
    }

    if (!attempt) return c.json(errorResponse('No quiz attempt found'), 404);

    return c.json(successResponse({
      ...(attempt as any),
      answers: JSON.parse((attempt as any).answers || '[]'),
    }));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Quiz result GET] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

// GET /assignments/:id/quiz-attempts - Get all quiz attempts for an assignment (teacher/academy/admin)
assignments.get('/:id/quiz-attempts', async (c) => {
  try {
    const session = await requireAuth(c);
    if (!['TEACHER', 'ACADEMY', 'ADMIN'].includes(session.role)) {
      return c.json(errorResponse('Unauthorized'), 403);
    }

    const assignmentId = c.req.param('id');

    const attempts = await c.env.DB.prepare(`
      SELECT qa.*, u.firstName || ' ' || u.lastName as studentName, u.email as studentEmail
      FROM QuizAttempt qa
      JOIN User u ON qa.studentId = u.id
      WHERE qa.assignmentId = ?
      ORDER BY u.lastName ASC, u.firstName ASC
    `).bind(assignmentId).all();

    const parsed = (attempts.results || []).map((a: any) => ({
      ...a,
      answers: JSON.parse(a.answers || '[]'),
    }));

    return c.json(successResponse(parsed));
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Quiz attempts GET] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

export default assignments;
