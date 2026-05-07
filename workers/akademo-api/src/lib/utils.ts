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
 * `Class.teacherId` references `Teacher.id`, NOT `User.id`. To grant access we either:
 *   - resolve Teacher.id → Teacher.userId and compare to the session userId, OR
 *   - allow any teacher belonging to the same Academy.
 * Returns true if either condition holds.
 */
export async function teacherCanAccessClass(
  db: D1Database,
  userId: string,
  classId: string,
): Promise<boolean> {
  const row = await db
    .prepare(
      `SELECT t.userId AS teacherUserId, c.academyId
       FROM Class c
       LEFT JOIN Teacher t ON c.teacherId = t.id
       WHERE c.id = ?
       LIMIT 1`,
    )
    .bind(classId)
    .first<{ teacherUserId: string | null; academyId: string }>();
  if (!row) return false;
  if (row.teacherUserId === userId) return true;
  const inAcademy = await db
    .prepare('SELECT 1 FROM Teacher WHERE userId = ? AND academyId = ? LIMIT 1')
    .bind(userId, row.academyId)
    .first();
  return !!inAcademy;
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

