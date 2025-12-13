import { getCloudflareContext } from '@opennextjs/cloudflare';

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1ExecResult>;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown>(): Promise<T[]>;
}

export interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  error?: string;
  meta?: object;
}

export interface D1ExecResult {
  count: number;
  duration: number;
}

// Get D1 database from Cloudflare context
export async function getDB(): Promise<D1Database> {
  const ctx = await getCloudflareContext();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = ctx?.env as any;
  if (!env?.DB) {
    throw new Error('D1 Database not available');
  }
  return env.DB as D1Database;
}

// Helper to generate CUID-like IDs
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `c${timestamp}${randomPart}`;
}

// User queries
export const userQueries = {
  async findByEmail(email: string) {
    const db = await getDB();
    return db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  },

  async findById(id: string) {
    const db = await getDB();
    return db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
  },

  async create(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
  }) {
    const db = await getDB();
    const id = generateId();
    const now = new Date().toISOString();
    await db.prepare(`
      INSERT INTO users (id, email, password, firstName, lastName, role, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, data.email, data.password, data.firstName, data.lastName, data.role, now, now).run();
    return { id, ...data, createdAt: now, updatedAt: now };
  },
};

// Academy queries
export const academyQueries = {
  async findById(id: string) {
    const db = await getDB();
    return db.prepare('SELECT * FROM Academy WHERE id = ?').bind(id).first();
  },

  async findByOwner(ownerId: string) {
    const db = await getDB();
    const result = await db.prepare('SELECT * FROM Academy WHERE ownerId = ? ORDER BY createdAt DESC').bind(ownerId).all();
    return result.results || [];
  },

  async findAll() {
    const db = await getDB();
    const result = await db.prepare('SELECT * FROM Academy ORDER BY createdAt DESC').all();
    return result.results || [];
  },

  async create(data: { name: string; description?: string; ownerId: string }) {
    const db = await getDB();
    const id = generateId();
    const now = new Date().toISOString();
    await db.prepare(`
      INSERT INTO Academy (id, name, description, ownerId, defaultMaxWatchTimeMultiplier, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, 2.0, ?, ?)
    `).bind(id, data.name, data.description || null, data.ownerId, now, now).run();
    return { id, ...data, createdAt: now, updatedAt: now };
  },

  async findWithOwner(id: string) {
    const db = await getDB();
    const academy = await db.prepare('SELECT * FROM Academy WHERE id = ?').bind(id).first() as any;
    if (!academy) return null;
    const owner = await db.prepare('SELECT id, email, firstName, lastName FROM users WHERE id = ?').bind(academy.ownerId).first();
    return { ...academy, owner };
  },

  async findAllWithCounts() {
    const db = await getDB();
    const academies = await db.prepare(`
      SELECT a.*, u.email as ownerEmail, u.firstName as ownerFirstName, u.lastName as ownerLastName,
        (SELECT COUNT(*) FROM AcademyMembership WHERE academyId = a.id) as membershipCount,
        (SELECT COUNT(*) FROM Class WHERE academyId = a.id) as classCount
      FROM Academy a
      JOIN users u ON a.ownerId = u.id
      ORDER BY a.createdAt DESC
    `).all();
    return (academies.results || []).map((a: any) => ({
      ...a,
      owner: { email: a.ownerEmail, firstName: a.ownerFirstName, lastName: a.ownerLastName },
      _count: { memberships: a.membershipCount, classes: a.classCount }
    }));
  },
};

// Class queries
export const classQueries = {
  async findById(id: string) {
    const db = await getDB();
    return db.prepare('SELECT * FROM Class WHERE id = ?').bind(id).first();
  },

  async findByAcademy(academyId: string) {
    const db = await getDB();
    const result = await db.prepare('SELECT * FROM Class WHERE academyId = ? ORDER BY createdAt DESC').bind(academyId).all();
    return result.results || [];
  },

  async create(data: { name: string; description?: string; academyId: string }) {
    const db = await getDB();
    const id = generateId();
    const now = new Date().toISOString();
    await db.prepare(`
      INSERT INTO Class (id, name, description, academyId, defaultMaxWatchTimeMultiplier, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, 2.0, ?, ?)
    `).bind(id, data.name, data.description || null, data.academyId, now, now).run();
    return { id, ...data, createdAt: now, updatedAt: now };
  },

  async findWithAcademyAndCounts(id: string) {
    const db = await getDB();
    const classData = await db.prepare(`
      SELECT c.*, a.name as academyName, a.ownerId as academyOwnerId
      FROM Class c
      JOIN Academy a ON c.academyId = a.id
      WHERE c.id = ?
    `).bind(id).first() as any;
    if (!classData) return null;
    
    const counts = await db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM ClassEnrollment WHERE classId = ?) as enrollments,
        (SELECT COUNT(*) FROM Video WHERE classId = ?) as videos,
        (SELECT COUNT(*) FROM Document WHERE classId = ?) as documents
    `).bind(id, id, id).first() as any;
    
    return {
      ...classData,
      academy: { id: classData.academyId, name: classData.academyName, ownerId: classData.academyOwnerId },
      _count: counts
    };
  },

  async findByStudentEnrollment(studentId: string) {
    const db = await getDB();
    const result = await db.prepare(`
      SELECT c.*, a.name as academyName,
        (SELECT COUNT(*) FROM ClassEnrollment WHERE classId = c.id) as enrollmentCount,
        (SELECT COUNT(*) FROM Video WHERE classId = c.id) as videoCount,
        (SELECT COUNT(*) FROM Document WHERE classId = c.id) as documentCount
      FROM Class c
      JOIN Academy a ON c.academyId = a.id
      JOIN ClassEnrollment ce ON c.id = ce.classId
      WHERE ce.studentId = ?
      ORDER BY c.createdAt DESC
    `).bind(studentId).all();
    
    return (result.results || []).map((c: any) => ({
      ...c,
      academy: { name: c.academyName },
      _count: { enrollments: c.enrollmentCount, videos: c.videoCount, documents: c.documentCount }
    }));
  },

  async findByTeacher(teacherId: string, academyId?: string) {
    const db = await getDB();
    let query = `
      SELECT c.*, a.name as academyName,
        (SELECT COUNT(*) FROM ClassEnrollment WHERE classId = c.id) as enrollmentCount,
        (SELECT COUNT(*) FROM Video WHERE classId = c.id) as videoCount,
        (SELECT COUNT(*) FROM Document WHERE classId = c.id) as documentCount
      FROM Class c
      JOIN Academy a ON c.academyId = a.id
      JOIN AcademyMembership m ON a.id = m.academyId
      WHERE m.userId = ?
    `;
    const params: any[] = [teacherId];
    
    if (academyId) {
      query += ' AND c.academyId = ?';
      params.push(academyId);
    }
    query += ' ORDER BY c.createdAt DESC';
    
    const stmt = db.prepare(query);
    const result = await stmt.bind(...params).all();
    
    return (result.results || []).map((c: any) => ({
      ...c,
      academy: { name: c.academyName },
      _count: { enrollments: c.enrollmentCount, videos: c.videoCount, documents: c.documentCount }
    }));
  },

  async findByAcademyOwner(ownerId: string) {
    const db = await getDB();
    const result = await db.prepare(`
      SELECT c.*, a.name as academyName,
        (SELECT COUNT(*) FROM ClassEnrollment WHERE classId = c.id) as enrollmentCount,
        (SELECT COUNT(*) FROM Video WHERE classId = c.id) as videoCount,
        (SELECT COUNT(*) FROM Document WHERE classId = c.id) as documentCount
      FROM Class c
      JOIN Academy a ON c.academyId = a.id
      WHERE a.ownerId = ?
      ORDER BY c.createdAt DESC
    `).bind(ownerId).all();
    
    return (result.results || []).map((c: any) => ({
      ...c,
      academy: { name: c.academyName },
      _count: { enrollments: c.enrollmentCount, videos: c.videoCount, documents: c.documentCount }
    }));
  },
};

// Membership queries
export const membershipQueries = {
  async findByUserAndAcademy(userId: string, academyId: string) {
    const db = await getDB();
    return db.prepare('SELECT * FROM AcademyMembership WHERE userId = ? AND academyId = ?').bind(userId, academyId).first();
  },

  async create(data: { userId: string; academyId: string; status?: string }) {
    const db = await getDB();
    const id = generateId();
    const now = new Date().toISOString();
    await db.prepare(`
      INSERT INTO AcademyMembership (id, userId, academyId, status, requestedAt, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(id, data.userId, data.academyId, data.status || 'PENDING', now, now, now).run();
    return { id, ...data, status: data.status || 'PENDING', createdAt: now };
  },

  async findByAcademyWithUser(academyId: string) {
    const db = await getDB();
    const result = await db.prepare(`
      SELECT m.*, u.email, u.firstName, u.lastName
      FROM AcademyMembership m
      JOIN users u ON m.userId = u.id
      WHERE m.academyId = ?
      ORDER BY m.createdAt DESC
    `).bind(academyId).all();
    
    return (result.results || []).map((m: any) => ({
      ...m,
      user: { id: m.userId, email: m.email, firstName: m.firstName, lastName: m.lastName }
    }));
  },

  async updateStatus(id: string, status: string) {
    const db = await getDB();
    const now = new Date().toISOString();
    const approvedAt = status === 'APPROVED' ? now : null;
    await db.prepare(`
      UPDATE AcademyMembership SET status = ?, approvedAt = ?, updatedAt = ? WHERE id = ?
    `).bind(status, approvedAt, now, id).run();
  },

  async findById(id: string) {
    const db = await getDB();
    return db.prepare('SELECT * FROM AcademyMembership WHERE id = ?').bind(id).first();
  },

  async findByUser(userId: string) {
    const db = await getDB();
    const result = await db.prepare(`
      SELECT m.*, a.name as academyName
      FROM AcademyMembership m
      JOIN Academy a ON m.academyId = a.id
      WHERE m.userId = ?
      ORDER BY m.createdAt DESC
    `).bind(userId).all();
    
    return (result.results || []).map((m: any) => ({
      ...m,
      academy: { id: m.academyId, name: m.academyName }
    }));
  },
};

// Enrollment queries
export const enrollmentQueries = {
  async findByClassAndStudent(classId: string, studentId: string) {
    const db = await getDB();
    return db.prepare('SELECT * FROM ClassEnrollment WHERE classId = ? AND studentId = ?').bind(classId, studentId).first();
  },

  async create(data: { classId: string; studentId: string }) {
    const db = await getDB();
    const id = generateId();
    const now = new Date().toISOString();
    await db.prepare(`
      INSERT INTO ClassEnrollment (id, classId, studentId, enrolledAt, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(id, data.classId, data.studentId, now, now, now).run();
    return { id, ...data, enrolledAt: now };
  },

  async findByClassWithStudent(classId: string) {
    const db = await getDB();
    const result = await db.prepare(`
      SELECT e.*, u.email, u.firstName, u.lastName
      FROM ClassEnrollment e
      JOIN users u ON e.studentId = u.id
      WHERE e.classId = ?
      ORDER BY e.enrolledAt DESC
    `).bind(classId).all();
    
    return (result.results || []).map((e: any) => ({
      ...e,
      student: { id: e.studentId, email: e.email, firstName: e.firstName, lastName: e.lastName }
    }));
  },

  async delete(classId: string, studentId: string) {
    const db = await getDB();
    await db.prepare('DELETE FROM ClassEnrollment WHERE classId = ? AND studentId = ?').bind(classId, studentId).run();
  },
};

// Video queries
export const videoQueries = {
  async findById(id: string) {
    const db = await getDB();
    return db.prepare('SELECT * FROM Video WHERE id = ?').bind(id).first();
  },

  async findByClass(classId: string) {
    const db = await getDB();
    const result = await db.prepare(`
      SELECT v.*, u.fileName, u.fileSize, u.mimeType, u.storagePath, u.storageType
      FROM Video v
      JOIN Upload u ON v.uploadId = u.id
      WHERE v.classId = ?
      ORDER BY v.createdAt DESC
    `).bind(classId).all();
    
    return (result.results || []).map((v: any) => ({
      ...v,
      upload: { fileName: v.fileName, fileSize: v.fileSize, mimeType: v.mimeType, storagePath: v.storagePath, storageType: v.storageType }
    }));
  },

  async create(data: { title: string; description?: string; classId: string; uploadId: string; durationSeconds?: number; maxWatchTimeMultiplier?: number }) {
    const db = await getDB();
    const id = generateId();
    const now = new Date().toISOString();
    await db.prepare(`
      INSERT INTO Video (id, title, description, classId, uploadId, durationSeconds, maxWatchTimeMultiplier, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, data.title, data.description || null, data.classId, data.uploadId, data.durationSeconds || null, data.maxWatchTimeMultiplier || 2.0, now, now).run();
    return { id, ...data, createdAt: now, updatedAt: now };
  },

  async findWithDetails(id: string) {
    const db = await getDB();
    return db.prepare(`
      SELECT v.*, u.fileName, u.fileSize, u.mimeType, u.storagePath, u.storageType,
        c.name as className, c.academyId, a.ownerId as academyOwnerId
      FROM Video v
      JOIN Upload u ON v.uploadId = u.id
      JOIN Class c ON v.classId = c.id
      JOIN Academy a ON c.academyId = a.id
      WHERE v.id = ?
    `).bind(id).first();
  },
};

// Document queries
export const documentQueries = {
  async findByClass(classId: string) {
    const db = await getDB();
    const result = await db.prepare(`
      SELECT d.*, u.fileName, u.fileSize, u.mimeType, u.storagePath, u.storageType
      FROM Document d
      JOIN Upload u ON d.uploadId = u.id
      WHERE d.classId = ?
      ORDER BY d.createdAt DESC
    `).bind(classId).all();
    
    return (result.results || []).map((d: any) => ({
      ...d,
      upload: { fileName: d.fileName, fileSize: d.fileSize, mimeType: d.mimeType, storagePath: d.storagePath, storageType: d.storageType }
    }));
  },

  async create(data: { title: string; description?: string; classId: string; uploadId: string }) {
    const db = await getDB();
    const id = generateId();
    const now = new Date().toISOString();
    await db.prepare(`
      INSERT INTO Document (id, title, description, classId, uploadId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(id, data.title, data.description || null, data.classId, data.uploadId, now, now).run();
    return { id, ...data, createdAt: now, updatedAt: now };
  },
};

// Upload queries
export const uploadQueries = {
  async create(data: { fileName: string; fileSize: number; mimeType: string; storageType: string; storagePath: string; uploadedById: string }) {
    const db = await getDB();
    const id = generateId();
    const now = new Date().toISOString();
    await db.prepare(`
      INSERT INTO Upload (id, fileName, fileSize, mimeType, storageType, storagePath, uploadedById, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, data.fileName, data.fileSize, data.mimeType, data.storageType, data.storagePath, data.uploadedById, now).run();
    return { id, ...data, createdAt: now };
  },

  async findById(id: string) {
    const db = await getDB();
    return db.prepare('SELECT * FROM Upload WHERE id = ?').bind(id).first();
  },
};

// VideoPlayState queries
export const playStateQueries = {
  async findByVideoAndStudent(videoId: string, studentId: string) {
    const db = await getDB();
    return db.prepare('SELECT * FROM VideoPlayState WHERE videoId = ? AND studentId = ?').bind(videoId, studentId).first();
  },

  async create(videoId: string, studentId: string) {
    const db = await getDB();
    const id = generateId();
    const now = new Date().toISOString();
    await db.prepare(`
      INSERT INTO VideoPlayState (id, videoId, studentId, totalWatchTimeSeconds, lastPositionSeconds, createdAt, updatedAt)
      VALUES (?, ?, ?, 0, 0, ?, ?)
    `).bind(id, videoId, studentId, now, now).run();
    return { id, videoId, studentId, totalWatchTimeSeconds: 0, lastPositionSeconds: 0, createdAt: now, updatedAt: now };
  },

  async upsert(videoId: string, studentId: string, data: { totalWatchTimeSeconds?: number; lastPositionSeconds?: number }) {
    const db = await getDB();
    const existing = await this.findByVideoAndStudent(videoId, studentId);
    const now = new Date().toISOString();
    
    if (existing) {
      await db.prepare(`
        UPDATE VideoPlayState 
        SET totalWatchTimeSeconds = ?, lastPositionSeconds = ?, lastWatchedAt = ?, updatedAt = ?
        WHERE videoId = ? AND studentId = ?
      `).bind(
        data.totalWatchTimeSeconds ?? (existing as any).totalWatchTimeSeconds,
        data.lastPositionSeconds ?? (existing as any).lastPositionSeconds,
        now, now, videoId, studentId
      ).run();
    } else {
      const id = generateId();
      await db.prepare(`
        INSERT INTO VideoPlayState (id, videoId, studentId, totalWatchTimeSeconds, lastPositionSeconds, lastWatchedAt, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(id, videoId, studentId, data.totalWatchTimeSeconds || 0, data.lastPositionSeconds || 0, now, now, now).run();
    }
    
    return this.findByVideoAndStudent(videoId, studentId);
  },
};

// DeviceSession queries
export const sessionQueries = {
  async findByUserAndFingerprint(userId: string, fingerprint: string) {
    const db = await getDB();
    return db.prepare('SELECT * FROM DeviceSession WHERE userId = ? AND deviceFingerprint = ?').bind(userId, fingerprint).first();
  },

  async upsert(userId: string, fingerprint: string, data: { userAgent?: string; browser?: string; os?: string }) {
    const db = await getDB();
    const existing = await this.findByUserAndFingerprint(userId, fingerprint);
    const now = new Date().toISOString();
    
    if (existing) {
      await db.prepare(`
        UPDATE DeviceSession SET isActive = 1, lastActiveAt = ? WHERE userId = ? AND deviceFingerprint = ?
      `).bind(now, userId, fingerprint).run();
    } else {
      // Deactivate other sessions for this user
      await db.prepare('UPDATE DeviceSession SET isActive = 0 WHERE userId = ?').bind(userId).run();
      
      const id = generateId();
      await db.prepare(`
        INSERT INTO DeviceSession (id, userId, deviceFingerprint, userAgent, browser, os, isActive, lastActiveAt, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
      `).bind(id, userId, fingerprint, data.userAgent || null, data.browser || null, data.os || null, now, now).run();
    }
    
    return this.findByUserAndFingerprint(userId, fingerprint);
  },

  async deactivateOthers(userId: string, currentFingerprint: string) {
    const db = await getDB();
    await db.prepare('UPDATE DeviceSession SET isActive = 0 WHERE userId = ? AND deviceFingerprint != ?').bind(userId, currentFingerprint).run();
  },

  async getActiveSession(userId: string) {
    const db = await getDB();
    return db.prepare('SELECT * FROM DeviceSession WHERE userId = ? AND isActive = 1').bind(userId).first();
  },
};

// Platform settings
export const settingsQueries = {
  async get() {
    const db = await getDB();
    let settings = await db.prepare('SELECT * FROM PlatformSettings WHERE id = ?').bind('platform_settings').first();
    if (!settings) {
      const now = new Date().toISOString();
      await db.prepare(`
        INSERT INTO PlatformSettings (id, defaultMaxWatchTimeMultiplier, createdAt, updatedAt)
        VALUES ('platform_settings', 2.0, ?, ?)
      `).bind(now, now).run();
      settings = await db.prepare('SELECT * FROM PlatformSettings WHERE id = ?').bind('platform_settings').first();
    }
    return settings;
  },
};
