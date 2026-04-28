import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';

const dashboard = new Hono<{ Bindings: Bindings }>();

// GET /dashboard/summary - Combined dashboard data (replaces 9 separate API calls)
// Returns all data needed for the ACADEMY or ADMIN panel in a single request.
dashboard.get('/summary', async (c) => {
  try {
    const session = await requireAuth(c);

    if (session.role !== 'ACADEMY' && session.role !== 'ADMIN') {
      return c.json(errorResponse('Not authorized'), 403);
    }

    const DB = c.env.DB;
    const userId = session.id;

    if (session.role === 'ACADEMY') {
      // ── All 10 queries run in one D1 batch (single HTTP round-trip to D1) ──
      const [
        academyResult,
        classesResult,
        pendingResult,
        rejectedResult,
        streamsResult,
        progressResult,
        paymentsResult,
        paymentStatusResult,
        ratingsStatsResult,
        ratingsLessonsResult,
      ] = await DB.batch([
        // 1. Academy info
        DB.prepare('SELECT id, name, paymentStatus FROM Academy WHERE ownerId = ?').bind(userId),

        // 2. Classes with enrollment count
        DB.prepare(`
          SELECT
            c.id, c.name, c.slug, c.description, c.academyId, c.startDate,
            c.monthlyPrice, c.oneTimePrice, c.isPublished,
            COUNT(CASE WHEN e.status = 'APPROVED' THEN 1 END) as enrollmentCount
          FROM Class c
          JOIN Academy a ON c.academyId = a.id
          LEFT JOIN ClassEnrollment e ON e.classId = c.id
          WHERE a.ownerId = ?
          GROUP BY c.id
          ORDER BY c.name
        `).bind(userId),

        // 3. Pending enrollments (list)
        DB.prepare(`
          SELECT
            e.id, e.classId, e.userId, e.status, e.documentSigned, e.enrolledAt,
            u.id as student_id, u.firstName as student_firstName,
            u.lastName as student_lastName, u.email as student_email,
            c.name as class_name, c.id as class_id, c.academyId as class_academyId,
            c.teacherId,
            teacher.firstName || ' ' || teacher.lastName as teacherName
          FROM ClassEnrollment e
          JOIN User u ON e.userId = u.id
          JOIN Class c ON e.classId = c.id
          JOIN Academy a ON c.academyId = a.id
          LEFT JOIN User teacher ON c.teacherId = teacher.id
          WHERE a.ownerId = ? AND e.status = 'PENDING'
          ORDER BY e.enrolledAt DESC
          LIMIT 500
        `).bind(userId),

        // 4. Rejected count
        DB.prepare(`
          SELECT COUNT(*) as count
          FROM ClassEnrollment e
          JOIN Class c ON e.classId = c.id
          JOIN Academy a ON c.academyId = a.id
          WHERE a.ownerId = ? AND e.status = 'REJECTED'
        `).bind(userId),

        // 5. Live stream history (basic fields only — no validRecordingId subquery)
        DB.prepare(`
          SELECT
            ls.id, ls.classId, ls.startedAt, ls.endedAt, ls.participantCount,
            ls.dailyRoomName, ls.zoomMeetingId, ls.status,
            c.academyId,
            COALESCE(c.name, '[Clase eliminada]') as className
          FROM LiveStream ls
          LEFT JOIN Class c ON ls.classId = c.id
          LEFT JOIN Academy a ON c.academyId = a.id
          WHERE (a.ownerId = ? OR (c.id IS NULL AND ls.teacherId IN (
            SELECT t.userId FROM Teacher t JOIN Academy a2 ON t.academyId = a2.id WHERE a2.ownerId = ?
          )))
          ORDER BY ls.createdAt DESC
          LIMIT 300
        `).bind(userId, userId),

        // 6. Student progress — CTE replaces N×5 correlated subqueries
        DB.prepare(`
          WITH academy_classes AS (
            SELECT c.id as classId
            FROM Class c
            JOIN Academy a ON c.academyId = a.id
            WHERE a.ownerId = ?
          ),
          lesson_progress AS (
            SELECT
              vps.studentId,
              l.classId,
              COUNT(DISTINCT v.lessonId) AS lessonsCompleted,
              SUM(vps.totalWatchTimeSeconds) AS totalWatchTime
            FROM Lesson l
            JOIN Video v ON v.lessonId = l.id
            JOIN VideoPlayState vps ON vps.videoId = v.id
            WHERE l.classId IN (SELECT classId FROM academy_classes)
            GROUP BY vps.studentId, l.classId
          ),
          lesson_counts AS (
            SELECT classId, COUNT(*) AS totalLessons
            FROM Lesson
            WHERE classId IN (SELECT classId FROM academy_classes)
            GROUP BY classId
          ),
          payments_agg AS (
            SELECT payerId, classId, SUM(amount) AS totalPaid
            FROM Payment
            WHERE status IN ('PAID', 'COMPLETED')
              AND classId IN (SELECT classId FROM academy_classes)
            GROUP BY payerId, classId
          )
          SELECT
            u.id,
            u.firstName,
            u.lastName,
            u.email,
            u.lastLoginAt as lastActive,
            u.suspicionCount,
            c.name as className,
            c.id as classId,
            e.id as enrollmentId,
            ut.firstName || ' ' || ut.lastName as teacherName,
            e.paymentFrequency,
            c.monthlyPrice,
            c.oneTimePrice,
            c.startDate as classStartDate,
            e.enrolledAt,
            COALESCE(pa.totalPaid, 0) as totalPaid,
            COALESCE(lp.lessonsCompleted, 0) as lessonsCompleted,
            COALESCE(lc.totalLessons, 0) as totalLessons,
            COALESCE(lp.totalWatchTime, 0) as totalWatchTime,
            0 as averageRating
          FROM User u
          JOIN ClassEnrollment e ON e.userId = u.id AND e.status = 'APPROVED'
          JOIN Class c ON e.classId = c.id
          JOIN Academy a ON c.academyId = a.id AND a.ownerId = ?
          LEFT JOIN User ut ON c.teacherId = ut.id
          LEFT JOIN lesson_progress lp ON lp.studentId = u.id AND lp.classId = c.id
          LEFT JOIN lesson_counts lc ON lc.classId = c.id
          LEFT JOIN payments_agg pa ON pa.payerId = u.id AND pa.classId = c.id
          ORDER BY u.lastName, u.firstName, c.name
        `).bind(userId, userId),

        // 7. Payment history (most recent 50)
        DB.prepare(`
          SELECT
            p.id as paymentId,
            p.classId,
            p.amount as paymentAmount,
            p.paymentMethod,
            p.status as paymentStatus
          FROM Payment p
          JOIN Class c ON p.classId = c.id
          JOIN Academy a ON c.academyId = a.id
          WHERE a.ownerId = ?
            AND p.status IN ('PAID', 'COMPLETED')
            AND p.type = 'STUDENT_TO_ACADEMY'
          ORDER BY p.completedAt DESC
          LIMIT 50
        `).bind(userId),

        // 8. Payment status — CTE avoids N+1 for ONE_TIME payments
        DB.prepare(`
          WITH paid_once AS (
            SELECT payerId, classId
            FROM Payment
            WHERE status IN ('PAID', 'COMPLETED')
              AND type = 'STUDENT_TO_ACADEMY'
            GROUP BY payerId, classId
          )
          SELECT
            e.userId,
            e.paymentFrequency,
            CASE
              WHEN e.paymentFrequency = 'MONTHLY'
                AND e.nextPaymentDue IS NOT NULL
                AND e.nextPaymentDue < datetime('now') THEN 'atrasado'
              WHEN e.paymentFrequency = 'ONE_TIME'
                AND po.payerId IS NULL THEN 'atrasado'
              ELSE 'alDia'
            END as status
          FROM ClassEnrollment e
          JOIN Class c ON e.classId = c.id
          JOIN Academy a ON c.academyId = a.id
          LEFT JOIN paid_once po ON po.payerId = e.userId AND po.classId = e.classId
          WHERE a.ownerId = ? AND e.status = 'APPROVED'
        `).bind(userId),

        // 9. Ratings overall stats
        DB.prepare(`
          SELECT
            COUNT(lr.id) as totalRatings,
            AVG(lr.rating) as averageRating,
            COUNT(DISTINCT lr.lessonId) as ratedLessons
          FROM LessonRating lr
          JOIN Lesson l ON lr.lessonId = l.id
          JOIN Class c ON l.classId = c.id
          JOIN Academy a ON c.academyId = a.id
          WHERE a.ownerId = ?
        `).bind(userId),

        // 10. Ratings per lesson (flat — for the RatingsCard)
        DB.prepare(`
          SELECT
            l.id as lessonId,
            l.title as lessonTitle,
            c.id as classId,
            c.name as className,
            c.academyId,
            COALESCE(AVG(lr.rating), 0) as averageRating,
            COUNT(lr.id) as ratingCount
          FROM Class c
          JOIN Lesson l ON l.classId = c.id
          JOIN Academy a ON c.academyId = a.id
          LEFT JOIN LessonRating lr ON lr.lessonId = l.id
          WHERE a.ownerId = ?
          GROUP BY l.id
          HAVING COUNT(lr.id) > 0
          ORDER BY c.name, l.title
        `).bind(userId),
      ]);

      // ── Transform raw rows into the shapes expected by the frontend ──

      const academy = (academyResult.results ?? [])[0] as any;
      if (!academy) {
        return c.json(errorResponse('Academy not found'), 404);
      }

      const classes = classesResult.results ?? [];

      const pendingEnrollments = ((pendingResult.results ?? []) as any[]).map((row: any) => ({
        id: row.id,
        classId: row.classId,
        userId: row.userId,
        status: row.status,
        documentSigned: row.documentSigned,
        enrolledAt: row.enrolledAt,
        student: {
          id: row.student_id,
          firstName: row.student_firstName,
          lastName: row.student_lastName,
          email: row.student_email,
        },
        class: {
          id: row.class_id,
          name: row.class_name,
          teacherId: row.teacherId,
          teacherName: row.teacherName,
          academyId: row.class_academyId,
        },
      }));

      const rejectedCount = (rejectedResult.results?.[0] as any)?.count ?? 0;

      const allStreams = streamsResult.results ?? [];

      const progressRows = (progressResult.results ?? []) as any[];
      const totalSeconds = progressRows.reduce((sum: number, s: any) => sum + (s.totalWatchTime ?? 0), 0);
      const totalMin = Math.floor(totalSeconds / 60);
      const classWatchTime = { hours: Math.floor(totalMin / 60), minutes: totalMin % 60 };
      const enrolledStudents = progressRows.map((s: any) => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        email: s.email,
        classId: s.classId,
        className: s.className,
        lessonsCompleted: s.lessonsCompleted ?? 0,
        totalLessons: s.totalLessons ?? 0,
        lastActive: s.lastActive,
      }));

      const allCompletedPayments = (paymentsResult.results ?? []) as any[];

      // Compute payment status counts from the pre-aggregated rows
      const payStatusRows = (paymentStatusResult.results ?? []) as any[];
      let alDia = 0;
      let atrasados = 0;
      const studentStatus: Record<string, 'alDia' | 'atrasado'> = {};
      for (const row of payStatusRows) {
        const uid = row.userId as string;
        if (row.status === 'atrasado') {
          atrasados++;
          studentStatus[uid] = 'atrasado';
        } else {
          alDia++;
          if (!studentStatus[uid]) studentStatus[uid] = 'alDia';
        }
      }
      const uniqueAlDia = Object.values(studentStatus).filter(s => s === 'alDia').length;
      const uniqueAtrasados = Object.values(studentStatus).filter(s => s === 'atrasado').length;
      const studentPaymentStatus = {
        alDia, atrasados, total: payStatusRows.length,
        uniqueAlDia, uniqueAtrasados, uniqueTotal: Object.keys(studentStatus).length,
      };

      const ratingStats = (ratingsStatsResult.results?.[0] as any) ?? {};
      const ratingsData = {
        overall: {
          averageRating: Number(ratingStats.averageRating) || 0,
          totalRatings: Number(ratingStats.totalRatings) || 0,
          ratedLessons: Number(ratingStats.ratedLessons) || 0,
        },
        lessons: ratingsLessonsResult.results ?? [],
      };

      return c.json(successResponse({
        academyInfo: academy,
        paymentStatus: academy.paymentStatus || 'NOT PAID',
        classes,
        enrolledStudents,
        pendingEnrollments,
        rejectedCount,
        allStreams,
        classWatchTime,
        allCompletedPayments,
        studentPaymentStatus,
        ratingsData,
        academies: [],
      }));

    } else {
      // ADMIN — keep parallel calls but with CTE-based progress
      const [
        academiesResult,
        classesResult,
        pendingResult,
        rejectedResult,
        streamsResult,
        progressResult,
        paymentStatusResult,
        adminPaymentsResult,
        ratingsStatsResult,
        ratingsLessonsResult,
      ] = await DB.batch([
        // 1. All paid academies
        DB.prepare(`SELECT id, name, paymentStatus, logoUrl FROM Academy ORDER BY name`),

        // 2. All classes
        DB.prepare(`
          SELECT c.id, c.name, c.slug, c.description, c.academyId, c.startDate,
            c.monthlyPrice, c.oneTimePrice, c.isPublished,
            COUNT(CASE WHEN e.status = 'APPROVED' THEN 1 END) as enrollmentCount,
            a.name as academyName
          FROM Class c
          JOIN Academy a ON c.academyId = a.id
          LEFT JOIN ClassEnrollment e ON e.classId = c.id
          GROUP BY c.id
          ORDER BY a.name, c.name
        `),

        // 3. Pending enrollments (all)
        DB.prepare(`
          SELECT
            e.id, e.classId, e.userId, e.status, e.documentSigned, e.enrolledAt,
            u.id as student_id, u.firstName as student_firstName,
            u.lastName as student_lastName, u.email as student_email,
            c.name as class_name, c.id as class_id, c.academyId as class_academyId,
            c.teacherId,
            teacher.firstName || ' ' || teacher.lastName as teacherName,
            a.name as academyName, a.id as academyId
          FROM ClassEnrollment e
          JOIN User u ON e.userId = u.id
          JOIN Class c ON e.classId = c.id
          JOIN Academy a ON c.academyId = a.id
          LEFT JOIN User teacher ON c.teacherId = teacher.id
          WHERE e.status = 'PENDING'
          ORDER BY e.enrolledAt DESC
          LIMIT 500
        `),

        // 4. Rejected count (all)
        DB.prepare(`SELECT COUNT(*) as count FROM ClassEnrollment WHERE status = 'REJECTED'`),

        // 5. Live streams (all)
        DB.prepare(`
          SELECT
            ls.id, ls.classId, ls.startedAt, ls.endedAt, ls.participantCount,
            ls.dailyRoomName, ls.zoomMeetingId, ls.status,
            c.academyId,
            COALESCE(c.name, '[Clase eliminada]') as className
          FROM LiveStream ls
          LEFT JOIN Class c ON ls.classId = c.id
          ORDER BY ls.createdAt DESC
          LIMIT 500
        `),

        // 6. Student progress — CTE (all academies)
        DB.prepare(`
          WITH lesson_progress AS (
            SELECT
              vps.studentId,
              l.classId,
              COUNT(DISTINCT v.lessonId) AS lessonsCompleted,
              SUM(vps.totalWatchTimeSeconds) AS totalWatchTime
            FROM VideoPlayState vps
            JOIN Video v ON v.id = vps.videoId
            JOIN Lesson l ON l.id = v.lessonId
            GROUP BY vps.studentId, l.classId
          ),
          lesson_counts AS (
            SELECT classId, COUNT(*) AS totalLessons
            FROM Lesson
            GROUP BY classId
          ),
          payments_agg AS (
            SELECT payerId, classId, SUM(amount) AS totalPaid
            FROM Payment
            WHERE status IN ('PAID', 'COMPLETED')
            GROUP BY payerId, classId
          )
          SELECT
            u.id, u.firstName, u.lastName, u.email,
            u.lastLoginAt as lastActive, u.suspicionCount,
            c.name as className, c.id as classId, c.academyId,
            e.id as enrollmentId,
            ut.firstName || ' ' || ut.lastName as teacherName,
            e.paymentFrequency, c.monthlyPrice, c.oneTimePrice,
            c.startDate as classStartDate, e.enrolledAt,
            COALESCE(pa.totalPaid, 0) as totalPaid,
            COALESCE(lp.lessonsCompleted, 0) as lessonsCompleted,
            COALESCE(lc.totalLessons, 0) as totalLessons,
            COALESCE(lp.totalWatchTime, 0) as totalWatchTime,
            0 as averageRating
          FROM User u
          JOIN ClassEnrollment e ON e.userId = u.id AND e.status = 'APPROVED'
          JOIN Class c ON e.classId = c.id
          LEFT JOIN User ut ON c.teacherId = ut.id
          LEFT JOIN lesson_progress lp ON lp.studentId = u.id AND lp.classId = c.id
          LEFT JOIN lesson_counts lc ON lc.classId = c.id
          LEFT JOIN payments_agg pa ON pa.payerId = u.id AND pa.classId = c.id
          ORDER BY u.lastName, u.firstName, c.name
        `),

        // 7. Payment status (all)
        DB.prepare(`
          WITH paid_once AS (
            SELECT payerId, classId
            FROM Payment
            WHERE status IN ('PAID', 'COMPLETED')
              AND type = 'STUDENT_TO_ACADEMY'
            GROUP BY payerId, classId
          )
          SELECT
            e.userId,
            e.paymentFrequency,
            CASE
              WHEN e.paymentFrequency = 'MONTHLY'
                AND e.nextPaymentDue IS NOT NULL
                AND e.nextPaymentDue < datetime('now') THEN 'atrasado'
              WHEN e.paymentFrequency = 'ONE_TIME'
                AND po.payerId IS NULL THEN 'atrasado'
              ELSE 'alDia'
            END as status
          FROM ClassEnrollment e
          LEFT JOIN paid_once po ON po.payerId = e.userId AND po.classId = e.classId
          WHERE e.status = 'APPROVED'
        `),

        // 8. Admin payments
        DB.prepare(`
          SELECT
            p.classId,
            p.amount as paymentAmount,
            p.paymentMethod,
            p.status as paymentStatus,
            c.academyId
          FROM Payment p
          JOIN Class c ON p.classId = c.id
          WHERE p.status IN ('PAID', 'COMPLETED')
            AND p.type = 'STUDENT_TO_ACADEMY'
          ORDER BY p.completedAt DESC
          LIMIT 500
        `),

        // 9. Ratings stats (all)
        DB.prepare(`
          SELECT
            COUNT(lr.id) as totalRatings,
            AVG(lr.rating) as averageRating,
            COUNT(DISTINCT lr.lessonId) as ratedLessons
          FROM LessonRating lr
        `),

        // 10. Ratings per lesson (all)
        DB.prepare(`
          SELECT
            l.id as lessonId, l.title as lessonTitle,
            c.id as classId, c.name as className, c.academyId,
            COALESCE(AVG(lr.rating), 0) as averageRating,
            COUNT(lr.id) as ratingCount
          FROM Class c
          JOIN Lesson l ON l.classId = c.id
          LEFT JOIN LessonRating lr ON lr.lessonId = l.id
          GROUP BY l.id
          HAVING COUNT(lr.id) > 0
          ORDER BY c.name, l.title
        `),
      ]);

      const allAcademies = (academiesResult.results ?? []) as any[];
      const paidAcademies = allAcademies.filter((a: any) => a.paymentStatus === 'PAID');
      const paidAcademyIds = new Set(paidAcademies.map((a: any) => a.id as string));

      const classes = classesResult.results ?? [];

      const pendingEnrollments = ((pendingResult.results ?? []) as any[]).map((row: any) => ({
        id: row.id, classId: row.classId, userId: row.userId,
        status: row.status, documentSigned: row.documentSigned, enrolledAt: row.enrolledAt,
        student: {
          id: row.student_id, firstName: row.student_firstName,
          lastName: row.student_lastName, email: row.student_email,
        },
        class: {
          id: row.class_id, name: row.class_name, teacherId: row.teacherId,
          teacherName: row.teacherName, academyId: row.class_academyId,
        },
        academyName: row.academyName,
        academyId: row.academyId,
      }));

      const rejectedCount = (rejectedResult.results?.[0] as any)?.count ?? 0;

      const allStreams = ((streamsResult.results ?? []) as any[])
        .filter((s: any) => !s.academyId || paidAcademyIds.has(s.academyId));

      const progressRows = ((progressResult.results ?? []) as any[])
        .filter((s: any) => !s.academyId || paidAcademyIds.has(s.academyId));
      const totalSeconds = progressRows.reduce((sum: number, s: any) => sum + (s.totalWatchTime ?? 0), 0);
      const totalMin = Math.floor(totalSeconds / 60);
      const classWatchTime = { hours: Math.floor(totalMin / 60), minutes: totalMin % 60 };
      const enrolledStudents = progressRows.map((s: any) => ({
        id: s.id, name: `${s.firstName} ${s.lastName}`, email: s.email,
        classId: s.classId, className: s.className || 'Sin clase',
        academyId: s.academyId,
        lessonsCompleted: s.lessonsCompleted ?? 0,
        totalLessons: s.totalLessons ?? 0,
        lastActive: s.lastActive,
      }));

      const payStatusRows = (paymentStatusResult.results ?? []) as any[];
      let alDia = 0;
      let atrasados = 0;
      const studentStatus: Record<string, 'alDia' | 'atrasado'> = {};
      for (const row of payStatusRows) {
        const uid = row.userId as string;
        if (row.status === 'atrasado') {
          atrasados++;
          studentStatus[uid] = 'atrasado';
        } else {
          alDia++;
          if (!studentStatus[uid]) studentStatus[uid] = 'alDia';
        }
      }
      const uniqueAlDia = Object.values(studentStatus).filter(s => s === 'alDia').length;
      const uniqueAtrasados = Object.values(studentStatus).filter(s => s === 'atrasado').length;
      const studentPaymentStatus = {
        alDia, atrasados, total: payStatusRows.length,
        uniqueAlDia, uniqueAtrasados, uniqueTotal: Object.keys(studentStatus).length,
      };

      const allCompletedPayments = ((adminPaymentsResult.results ?? []) as any[])
        .filter((p: any) => !p.academyId || paidAcademyIds.has(p.academyId));

      const ratingStats = (ratingsStatsResult.results?.[0] as any) ?? {};
      const ratingsData = {
        overall: {
          averageRating: Number(ratingStats.averageRating) || 0,
          totalRatings: Number(ratingStats.totalRatings) || 0,
          ratedLessons: Number(ratingStats.ratedLessons) || 0,
        },
        lessons: ratingsLessonsResult.results ?? [],
      };

      return c.json(successResponse({
        academyInfo: null,
        paymentStatus: 'PAID',
        classes,
        enrolledStudents,
        pendingEnrollments,
        rejectedCount,
        allStreams,
        classWatchTime,
        allCompletedPayments,
        studentPaymentStatus,
        ratingsData,
        academies: paidAcademies,
      }));
    }
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') throw error;
    console.error('[Dashboard Summary] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

export default dashboard;
