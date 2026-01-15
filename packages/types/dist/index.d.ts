/**
 * @akademo/types - Shared TypeScript types for AKADEMO
 *
 * This package provides type definitions shared between:
 * - Next.js Frontend
 * - Hono API Worker
 */
export type { ApiResponse, PaginatedResponse, UserRole, EnrollmentStatus, LiveStreamStatus, BunnyStatus, SessionUser, AuthResponse, ErrorCode, ErrorResponse, } from './api';
export type { User, Academy, Class, ClassWithEnrollment, Lesson, LessonSummary, LessonDetail, Video, VideoWithProgress, Document, Upload, VideoPlayState, ClassEnrollment, Teacher, LiveStream, Notification, LessonRating, Topic, } from './models';
export type { D1Database, D1PreparedStatement, D1Result, D1ExecResult, UserRow, AcademyRow, ClassRow, LessonRow, UploadRow, LiveStreamRow, NotificationRow, ClassEnrollmentRow, TeacherRow, } from './database';
//# sourceMappingURL=index.d.ts.map