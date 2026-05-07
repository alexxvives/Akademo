import { ApiResponse } from '../types';

export function successResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
  };
}

export function errorResponse(error: string, details?: Array<{ field: string; message: string }>): ApiResponse {
  const res: ApiResponse & { details?: Array<{ field: string; message: string }> } = {
    success: false,
    error,
  };
  if (details) res.details = details;
  return res;
}

/** Escape user-provided strings for safe HTML embedding in emails */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Check whether a TEACHER (by user.id) can access a class.
 *
 * IMPORTANT — semantics of the columns (verified against production data):
 *   - `Class.teacherId` stores `User.id` of the assigned teacher (NOT `Teacher.id`).
 *     The column name is historical; do NOT join `c.teacherId = Teacher.id` (that
 *     returns no rows and silently breaks access checks). Compare directly to a
 *     User.id, or join `c.teacherId = Teacher.userId` if you also need teacher row data.
 *   - `LiveStream.teacherId` stores `User.id` (same semantics).
 *   - `Assignment.teacherId` stores `User.id` (has FK to User).
 *
 * Access rules (any one is sufficient):
 *   1. The teacher is the assigned teacher of the class.
 *   2. The teacher belongs to the same Academy as the class (academy fallback —
 *      lets co-teachers in the same academy collaborate on each other's classes).
 */
export async function teacherCanAccessClass(
  db: D1Database,
  userId: string,
  classId: string,
): Promise<boolean> {
  const row = await db
    .prepare(`SELECT teacherId, academyId FROM Class WHERE id = ? LIMIT 1`)
    .bind(classId)
    .first<{ teacherId: string | null; academyId: string }>();
  if (!row) return false;
  if (row.teacherId && row.teacherId === userId) return true;
  const inAcademy = await db
    .prepare('SELECT 1 FROM Teacher WHERE userId = ? AND academyId = ? LIMIT 1')
    .bind(userId, row.academyId)
    .first();
  return !!inAcademy;
}

/**
 * Check whether a TEACHER can access a Lesson (resolves the lesson's class
 * and delegates to `teacherCanAccessClass`). Returns false if the lesson
 * does not exist.
 */
export async function teacherCanAccessLesson(
  db: D1Database,
  userId: string,
  lessonId: string,
): Promise<boolean> {
  const row = await db
    .prepare('SELECT classId FROM Lesson WHERE id = ? LIMIT 1')
    .bind(lessonId)
    .first<{ classId: string }>();
  if (!row) return false;
  return teacherCanAccessClass(db, userId, row.classId);
}

/**
 * Check whether a TEACHER can access a LiveStream (assigned teacher OR same-academy teacher).
 */
export async function teacherCanAccessLiveStream(
  db: D1Database,
  userId: string,
  liveStreamId: string,
): Promise<boolean> {
  const row = await db
    .prepare('SELECT classId, teacherId FROM LiveStream WHERE id = ? LIMIT 1')
    .bind(liveStreamId)
    .first<{ classId: string; teacherId: string | null }>();
  if (!row) return false;
  if (row.teacherId && row.teacherId === userId) return true;
  return teacherCanAccessClass(db, userId, row.classId);
}

/**
 * Check whether an email address is allowed to enroll in / sign up for a given academy.
 * If the academy has `allowedEmailDomains` configured (comma-separated list of domains),
 * the email's domain must match one of them. Otherwise any email is allowed.
 *
 * Returns { allowed: true } on success, or { allowed: false, allowedDomains } on failure.
 */
export async function checkAcademyEmailDomain(
  db: D1Database,
  academyId: string,
  email: string,
): Promise<{ allowed: boolean; allowedDomains?: string[] }> {
  const academy = await db
    .prepare('SELECT allowedEmailDomains FROM Academy WHERE id = ? LIMIT 1')
    .bind(academyId)
    .first<{ allowedEmailDomains: string | null }>();
  if (!academy || !academy.allowedEmailDomains) return { allowed: true };
  const domains = academy.allowedEmailDomains
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  if (domains.length === 0) return { allowed: true };
  const emailDomain = email.toLowerCase().split('@')[1] || '';
  if (!emailDomain) return { allowed: false, allowedDomains: domains };
  // Allow either exact match or subdomain match (e.g. allow "alumno.myuax.com" if "myuax.com" is whitelisted)
  const ok = domains.some((d) => emailDomain === d || emailDomain.endsWith(`.${d}`));
  return ok ? { allowed: true } : { allowed: false, allowedDomains: domains };
}

