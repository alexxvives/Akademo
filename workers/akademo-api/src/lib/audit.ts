/**
 * Audit logging — fire-and-forget writes to AuditLog table.
 *
 * Rules:
 *  • NEVER throws — audit failure must NOT break the calling request.
 *  • Call with `void writeAuditLog(c.env.DB, {...})` so it is non-blocking.
 *  • Only covers privileged / destructive actions (not reads).
 */

export interface AuditEvent {
  /** id of the user performing the action */
  actorId: string;
  /** Role of the acting user: ADMIN | ACADEMY | TEACHER */
  actorRole: string;
  /**
   * Structured action name.
   * Convention:  <ROLE>_<VERB>_<ENTITY>
   * Examples:    ADMIN_DELETE_USER, ACADEMY_APPROVE_ENROLLMENT,
   *              ADMIN_UPDATE_ACADEMY, ADMIN_ASSIGN_ZOOM
   */
  action: string;
  /** Entity type affected, e.g. User | Academy | ClassEnrollment */
  targetType?: string;
  /** Primary key of the affected entity */
  targetId?: string;
  /** Optional extra context — will be JSON-stringified */
  meta?: Record<string, unknown>;
  /** Caller IP — from CF-Connecting-IP header */
  ip?: string;
}

// Minimal D1 type so we don't need an extra import
type D1Binding = {
  prepare: (sql: string) => {
    bind: (...args: (string | number | null | undefined)[]) => { run: () => Promise<unknown> };
  };
};

export async function writeAuditLog(db: D1Binding, event: AuditEvent): Promise<void> {
  try {
    await db
      .prepare(
        `INSERT INTO AuditLog (actorId, actorRole, action, targetType, targetId, meta, ip)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        event.actorId,
        event.actorRole,
        event.action,
        event.targetType ?? null,
        event.targetId ?? null,
        event.meta ? JSON.stringify(event.meta) : null,
        event.ip ?? null
      )
      .run();
  } catch (e: unknown) {
    // Swallow — audit log writes must never propagate to the caller
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[AuditLog] Write failed:', msg);
  }
}
