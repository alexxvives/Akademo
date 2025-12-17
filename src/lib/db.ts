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
        (SELECT COUNT(*) FROM Video v JOIN Lesson l ON v.lessonId = l.id WHERE l.classId = ?) as videos,
        (SELECT COUNT(*) FROM Document d JOIN Lesson l ON d.lessonId = l.id WHERE l.classId = ?) as documents
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
      SELECT c.*, a.name as academyName, ce.status as enrollmentStatus,
        (SELECT COUNT(*) FROM ClassEnrollment WHERE classId = c.id) as enrollmentCount,
        (SELECT COUNT(*) FROM Video v JOIN Lesson l ON v.lessonId = l.id WHERE l.classId = c.id) as videoCount,
        (SELECT COUNT(*) FROM Document d JOIN Lesson l ON d.lessonId = l.id WHERE l.classId = c.id) as documentCount
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
        (SELECT COUNT(*) FROM Video v JOIN Lesson l ON v.lessonId = l.id WHERE l.classId = c.id) as videoCount,
        (SELECT COUNT(*) FROM Document d JOIN Lesson l ON d.lessonId = l.id WHERE l.classId = c.id) as documentCount
      FROM Class c
      JOIN Academy a ON c.academyId = a.id
      JOIN AcademyMembership m ON a.id = m.academyId
      WHERE m.userId = ?
    `;
    const params: any[] = [teacherId];
    
    console.log('[classQueries.findByTeacher] Query:', query);
    console.log('[classQueries.findByTeacher] Params:', params);
    
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
        (SELECT COUNT(*) FROM Video v JOIN Lesson l ON v.lessonId = l.id WHERE l.classId = c.id) as videoCount,
        (SELECT COUNT(*) FROM Document d JOIN Lesson l ON d.lessonId = l.id WHERE l.classId = c.id) as documentCount
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

  async findApprovedByClassAndStudent(classId: string, studentId: string) {
    const db = await getDB();
    return db.prepare("SELECT * FROM ClassEnrollment WHERE classId = ? AND studentId = ? AND status = 'APPROVED'").bind(classId, studentId).first();
  },

  async create(data: { classId: string; studentId: string; status?: string }) {
    const db = await getDB();
    const id = generateId();
    const now = new Date().toISOString();
    const status = data.status || 'PENDING';
    const approvedAt = status === 'APPROVED' ? now : null;
    await db.prepare(`
      INSERT INTO ClassEnrollment (id, classId, studentId, status, enrolledAt, approvedAt, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, data.classId, data.studentId, status, now, approvedAt, now, now).run();
    return { id, ...data, status, enrolledAt: now, approvedAt };
  },

  async findByClassWithStudent(classId: string, statusFilter?: string) {
    const db = await getDB();
    let query = `
      SELECT e.*, u.email, u.firstName, u.lastName
      FROM ClassEnrollment e
      JOIN users u ON e.studentId = u.id
      WHERE e.classId = ?
    `;
    const params: any[] = [classId];
    
    if (statusFilter) {
      query += ' AND e.status = ?';
      params.push(statusFilter);
    }
    query += ' ORDER BY e.enrolledAt DESC';
    
    const result = await db.prepare(query).bind(...params).all();
    
    return (result.results || []).map((e: any) => ({
      ...e,
      student: { id: e.studentId, email: e.email, firstName: e.firstName, lastName: e.lastName }
    }));
  },

  async findPendingByTeacher(teacherId: string) {
    const db = await getDB();
    const result = await db.prepare(`
      SELECT e.*, u.email, u.firstName, u.lastName, c.name as className, c.id as classId
      FROM ClassEnrollment e
      JOIN users u ON e.studentId = u.id
      JOIN Class c ON e.classId = c.id
      JOIN Academy a ON c.academyId = a.id
      JOIN AcademyMembership m ON a.id = m.academyId
      WHERE m.userId = ? AND m.status = 'APPROVED' AND e.status = 'PENDING'
      ORDER BY e.enrolledAt DESC
    `).bind(teacherId).all();
    
    return (result.results || []).map((e: any) => ({
      ...e,
      student: { id: e.studentId, email: e.email, firstName: e.firstName, lastName: e.lastName },
      class: { id: e.classId, name: e.className }
    }));
  },

  async updateStatus(id: string, status: string) {
    const db = await getDB();
    const now = new Date().toISOString();
    const approvedAt = status === 'APPROVED' ? now : null;
    await db.prepare(`
      UPDATE ClassEnrollment SET status = ?, approvedAt = ?, updatedAt = ? WHERE id = ?
    `).bind(status, approvedAt, now, id).run();
  },

  async findById(id: string) {
    const db = await getDB();
    return db.prepare('SELECT * FROM ClassEnrollment WHERE id = ?').bind(id).first();
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
      SELECT v.*, u.fileName, u.fileSize, u.mimeType, u.storagePath,
        l.maxWatchTimeMultiplier as lessonMultiplier, l.watermarkIntervalMins
      FROM Video v
      JOIN Upload u ON v.uploadId = u.id
      JOIN Lesson l ON v.lessonId = l.id
      WHERE l.classId = ?
      ORDER BY v.createdAt DESC
    `).bind(classId).all();
    
    return (result.results || []).map((v: any) => ({
      ...v,
      maxWatchTimeMultiplier: v.lessonMultiplier || 2.0,
      upload: { fileName: v.fileName, fileSize: v.fileSize, mimeType: v.mimeType, storagePath: v.storagePath }
    }));
  },

  async findByLesson(lessonId: string) {
    const db = await getDB();
    const result = await db.prepare(`
      SELECT v.*, u.fileName, u.fileSize, u.mimeType, u.storagePath
      FROM Video v
      JOIN Upload u ON v.uploadId = u.id
      WHERE v.lessonId = ?
      ORDER BY v.createdAt ASC
    `).bind(lessonId).all();
    
    return (result.results || []).map((v: any) => ({
      ...v,
      upload: { fileName: v.fileName, fileSize: v.fileSize, mimeType: v.mimeType, storagePath: v.storagePath }
    }));
  },

  async create(data: { title: string; description?: string; lessonId: string; uploadId: string; durationSeconds?: number }) {
    const db = await getDB();
    const id = generateId();
    const now = new Date().toISOString();
    await db.prepare(`
      INSERT INTO Video (id, title, description, lessonId, uploadId, durationSeconds, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, data.title, data.description || null, data.lessonId, data.uploadId, data.durationSeconds || null, now, now).run();
    return { id, ...data, createdAt: now, updatedAt: now };
  },

  async findWithDetails(id: string) {
    const db = await getDB();
    return db.prepare(`
      SELECT v.*, u.fileName, u.fileSize, u.mimeType, u.storagePath,
        l.classId, l.maxWatchTimeMultiplier as lessonMultiplier, l.watermarkIntervalMins,
        c.name as className, c.academyId, a.ownerId as academyOwnerId
      FROM Video v
      JOIN Upload u ON v.uploadId = u.id
      LEFT JOIN Lesson l ON v.lessonId = l.id
      LEFT JOIN Class c ON l.classId = c.id
      LEFT JOIN Academy a ON c.academyId = a.id
      WHERE v.id = ?
    `).bind(id).first();
  },

  async update(id: string, data: { title?: string; description?: string; durationSeconds?: number }) {
    const db = await getDB();
    const now = new Date().toISOString();
    const video = await this.findById(id) as any;
    if (!video) throw new Error('Video not found');
    
    await db.prepare(`
      UPDATE Video SET title = ?, description = ?, durationSeconds = ?, updatedAt = ? WHERE id = ?
    `).bind(
      data.title ?? video.title,
      data.description ?? video.description,
      data.durationSeconds ?? video.durationSeconds,
      now, id
    ).run();
    
    return this.findById(id);
  },

  async delete(id: string) {
    const db = await getDB();
    await db.prepare('DELETE FROM Video WHERE id = ?').bind(id).run();
  },
};

// Document queries
export const documentQueries = {
  async findByClass(classId: string) {
    const db = await getDB();
    const result = await db.prepare(`
      SELECT d.*, u.fileName, u.fileSize, u.mimeType, u.storagePath
      FROM Document d
      JOIN Upload u ON d.uploadId = u.id
      JOIN Lesson l ON d.lessonId = l.id
      WHERE l.classId = ?
      ORDER BY d.createdAt DESC
    `).bind(classId).all();
    
    return (result.results || []).map((d: any) => ({
      ...d,
      upload: { fileName: d.fileName, fileSize: d.fileSize, mimeType: d.mimeType, storagePath: d.storagePath }
    }));
  },

  async findByLesson(lessonId: string) {
    const db = await getDB();
    const result = await db.prepare(`
      SELECT d.*, u.fileName, u.fileSize, u.mimeType, u.storagePath
      FROM Document d
      JOIN Upload u ON d.uploadId = u.id
      WHERE d.lessonId = ?
      ORDER BY d.createdAt DESC
    `).bind(lessonId).all();
    
    return (result.results || []).map((d: any) => ({
      ...d,
      upload: { fileName: d.fileName, fileSize: d.fileSize, mimeType: d.mimeType, storagePath: d.storagePath }
    }));
  },

  async create(data: { title: string; description?: string; lessonId: string; uploadId: string }) {
    const db = await getDB();
    const id = generateId();
    const now = new Date().toISOString();
    await db.prepare(`
      INSERT INTO Document (id, title, description, lessonId, uploadId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(id, data.title, data.description || null, data.lessonId, data.uploadId, now, now).run();
    return { id, ...data, createdAt: now, updatedAt: now };
  },
};

// Lesson queries
export const lessonQueries = {
  async findById(id: string) {
    const db = await getDB();
    return db.prepare('SELECT * FROM Lesson WHERE id = ?').bind(id).first();
  },

  async findByClass(classId: string) {
    const db = await getDB();
    const result = await db.prepare(`
      SELECT l.*,
        (SELECT COUNT(*) FROM Video WHERE lessonId = l.id) as videoCount,
        (SELECT COUNT(*) FROM Document WHERE lessonId = l.id) as documentCount
      FROM Lesson l
      WHERE l.classId = ?
      ORDER BY l.releaseDate DESC
    `).bind(classId).all();
    
    return result.results || [];
  },

  async findWithContent(id: string) {
    const db = await getDB();
    const lesson = await db.prepare(`
      SELECT l.*, c.name as className, c.academyId, a.ownerId as academyOwnerId
      FROM Lesson l
      JOIN Class c ON l.classId = c.id
      JOIN Academy a ON c.academyId = a.id
      WHERE l.id = ?
    `).bind(id).first() as any;
    
    if (!lesson) return null;
    
    const videos = await db.prepare(`
      SELECT v.*, u.fileName, u.fileSize, u.mimeType, u.storagePath
      FROM Video v
      JOIN Upload u ON v.uploadId = u.id
      WHERE v.lessonId = ?
      ORDER BY v.createdAt ASC
    `).bind(id).all();
    
    const documents = await db.prepare(`
      SELECT d.*, u.fileName, u.fileSize, u.mimeType, u.storagePath
      FROM Document d
      JOIN Upload u ON d.uploadId = u.id
      WHERE d.lessonId = ?
      ORDER BY d.createdAt ASC
    `).bind(id).all();
    
    return {
      ...lesson,
      class: { id: lesson.classId, name: lesson.className, academyId: lesson.academyId },
      videos: (videos.results || []).map((v: any) => ({
        ...v,
        upload: { fileName: v.fileName, fileSize: v.fileSize, mimeType: v.mimeType, storagePath: v.storagePath }
      })),
      documents: (documents.results || []).map((d: any) => ({
        ...d,
        upload: { fileName: d.fileName, fileSize: d.fileSize, mimeType: d.mimeType, storagePath: d.storagePath }
      })),
      academyOwnerId: lesson.academyOwnerId
    };
  },

  async create(data: { title: string; description?: string; classId: string; releaseDate?: string; maxWatchTimeMultiplier?: number; watermarkIntervalMins?: number }) {
    const db = await getDB();
    const id = generateId();
    const now = new Date().toISOString();
    const releaseDate = data.releaseDate || now;
    await db.prepare(`
      INSERT INTO Lesson (id, title, description, classId, releaseDate, maxWatchTimeMultiplier, watermarkIntervalMins, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, data.title, data.description || null, data.classId, releaseDate, data.maxWatchTimeMultiplier || 2.0, data.watermarkIntervalMins || 5, now, now).run();
    return { id, ...data, releaseDate, createdAt: now, updatedAt: now };
  },

  async update(id: string, data: { title?: string; description?: string; releaseDate?: string; maxWatchTimeMultiplier?: number; watermarkIntervalMins?: number }) {
    const db = await getDB();
    const now = new Date().toISOString();
    const lesson = await this.findById(id) as any;
    if (!lesson) throw new Error('Lesson not found');
    
    await db.prepare(`
      UPDATE Lesson SET title = ?, description = ?, releaseDate = ?, maxWatchTimeMultiplier = ?, watermarkIntervalMins = ?, updatedAt = ? WHERE id = ?
    `).bind(
      data.title ?? lesson.title,
      data.description ?? lesson.description,
      data.releaseDate ?? lesson.releaseDate,
      data.maxWatchTimeMultiplier ?? lesson.maxWatchTimeMultiplier,
      data.watermarkIntervalMins ?? lesson.watermarkIntervalMins,
      now, id
    ).run();
    
    return this.findById(id);
  },

  async delete(id: string) {
    const db = await getDB();
    await db.prepare('DELETE FROM Lesson WHERE id = ?').bind(id).run();
  },
};

// Upload queries
export const uploadQueries = {
  async create(data: { fileName: string; fileSize: number; mimeType: string; storagePath: string; uploadedById: string }) {
    const db = await getDB();
    const id = generateId();
    const now = new Date().toISOString();
    await db.prepare(`
      INSERT INTO Upload (id, fileName, fileSize, mimeType, storagePath, uploadedById, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(id, data.fileName, data.fileSize, data.mimeType, data.storagePath, data.uploadedById, now).run();
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
    
    // Use INSERT OR IGNORE to prevent duplicates if UNIQUE constraint fails
    await db.prepare(`
      INSERT OR IGNORE INTO VideoPlayState (id, videoId, studentId, totalWatchTimeSeconds, lastPositionSeconds, status, sessionStartTime, lastWatchedAt, createdAt, updatedAt)
      VALUES (?, ?, ?, 0, 0, 'ACTIVE', ?, ?, ?, ?)
    `).bind(id, videoId, studentId, now, now, now, now).run();
    
    // Return the record (either just created or existing)
    return this.findByVideoAndStudent(videoId, studentId);
  },

  async upsert(videoId: string, studentId: string, data: { totalWatchTimeSeconds?: number; lastPositionSeconds?: number; status?: string }) {
    const db = await getDB();
    const existing = await this.findByVideoAndStudent(videoId, studentId);
    const now = new Date().toISOString();
    
    if (existing) {
      await db.prepare(`
        UPDATE VideoPlayState 
        SET totalWatchTimeSeconds = ?, 
            lastPositionSeconds = ?, 
            status = ?,
            sessionStartTime = COALESCE(sessionStartTime, ?),
            lastWatchedAt = ?, 
            updatedAt = ?
        WHERE videoId = ? AND studentId = ?
      `).bind(
        data.totalWatchTimeSeconds ?? (existing as any).totalWatchTimeSeconds,
        data.lastPositionSeconds ?? (existing as any).lastPositionSeconds,
        data.status ?? (existing as any).status,
        now, now, now, videoId, studentId
      ).run();
    } else {
      const id = generateId();
      await db.prepare(`
        INSERT INTO VideoPlayState (id, videoId, studentId, totalWatchTimeSeconds, lastPositionSeconds, status, sessionStartTime, lastWatchedAt, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(id, videoId, studentId, data.totalWatchTimeSeconds || 0, data.lastPositionSeconds || 0, data.status || 'ACTIVE', now, now, now, now).run();
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

// LiveStream queries for Daily.co integration
export const liveStreamQueries = {
  async findById(id: string) {
    const db = await getDB();
    const row = await db.prepare(`
      SELECT ls.*, c.name as className, u.firstName, u.lastName
      FROM LiveStream ls
      JOIN Class c ON ls.classId = c.id
      JOIN users u ON ls.teacherId = u.id
      WHERE ls.id = ?
    `).bind(id).first() as any;
    if (!row) return null;
    return {
      ...row,
      teacher: { firstName: row.firstName, lastName: row.lastName },
      class: { name: row.className },
    };
  },

  async findActiveByClass(classId: string) {
    const db = await getDB();
    const row = await db.prepare(`
      SELECT ls.*, u.firstName, u.lastName
      FROM LiveStream ls
      JOIN users u ON ls.teacherId = u.id
      WHERE ls.classId = ? AND ls.status IN ('PENDING', 'LIVE')
      ORDER BY ls.createdAt DESC LIMIT 1
    `).bind(classId).first() as any;
    if (!row) return null;
    return {
      ...row,
      teacher: { firstName: row.firstName, lastName: row.lastName },
    };
  },

  async findByClass(classId: string) {
    const db = await getDB();
    const result = await db.prepare(`
      SELECT ls.*, u.firstName, u.lastName
      FROM LiveStream ls
      JOIN users u ON ls.teacherId = u.id
      WHERE ls.classId = ?
      ORDER BY ls.createdAt DESC
    `).bind(classId).all() as any;
    return (result.results || []).map((row: any) => ({
      ...row,
      teacher: { firstName: row.firstName, lastName: row.lastName },
    }));
  },

  async create(data: {
    classId: string;
    teacherId: string;
    roomName: string;
    roomUrl: string;
    title?: string;
  }) {
    const db = await getDB();
    const id = generateId();
    await db.prepare(`
      INSERT INTO LiveStream (id, classId, teacherId, roomName, roomUrl, title, status, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, 'PENDING', datetime('now'))
    `).bind(id, data.classId, data.teacherId, data.roomName, data.roomUrl, data.title || null).run();
    return this.findById(id);
  },

  async updateStatus(id: string, status: 'PENDING' | 'LIVE' | 'ENDED') {
    const db = await getDB();
    if (status === 'LIVE') {
      await db.prepare(`UPDATE LiveStream SET status = ?, startedAt = datetime('now') WHERE id = ?`).bind(status, id).run();
    } else if (status === 'ENDED') {
      await db.prepare(`UPDATE LiveStream SET status = ?, endedAt = datetime('now') WHERE id = ?`).bind(status, id).run();
    } else {
      await db.prepare(`UPDATE LiveStream SET status = ? WHERE id = ?`).bind(status, id).run();
    }
    return this.findById(id);
  },

  async setRecordingId(id: string, recordingId: string) {
    const db = await getDB();
    await db.prepare(`UPDATE LiveStream SET recordingId = ? WHERE id = ?`).bind(recordingId, id).run();
    return this.findById(id);
  },

  async delete(id: string) {
    const db = await getDB();
    await db.prepare('DELETE FROM LiveStream WHERE id = ?').bind(id).run();
  },
};

// Settings queries removed - PlatformSettings table dropped
// Defaults are now set at Academy/Class/Lesson levels
