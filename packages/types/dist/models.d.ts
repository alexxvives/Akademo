/**
 * Domain Model Types for AKADEMO
 * Shared between Next.js Frontend and Hono Worker
 */
import type { UserRole, EnrollmentStatus, LiveStreamStatus, BunnyStatus } from './api';
/**
 * User entity
 */
export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    createdAt: string;
    updatedAt: string;
}
/**
 * Academy entity
 */
export interface Academy {
    id: string;
    name: string;
    description: string | null;
    ownerId: string;
    owner?: User;
    createdAt: string;
    updatedAt: string;
}
/**
 * Class entity
 */
export interface Class {
    id: string;
    name: string;
    description: string | null;
    slug: string | null;
    academyId: string;
    teacherId: string;
    feedbackEnabled?: boolean;
    academy?: Academy;
    teacher?: User;
    academyName?: string;
    createdAt: string;
    updatedAt: string;
}
/**
 * Class with enrollment info (for students)
 */
export interface ClassWithEnrollment extends Class {
    enrollmentStatus?: EnrollmentStatus;
    documentSigned?: boolean;
    enrolledAt?: string;
}
/**
 * Lesson entity
 */
export interface Lesson {
    id: string;
    title: string;
    description: string | null;
    externalUrl: string | null;
    releaseDate: string;
    maxWatchTimeMultiplier: number;
    watermarkIntervalMins: number;
    classId: string;
    createdAt: string;
    updatedAt: string;
}
/**
 * Lesson with content counts (from list endpoint)
 */
export interface LessonSummary extends Lesson {
    videoCount: number;
    documentCount: number;
    firstVideoBunnyGuid?: string;
    isTranscoding?: number;
    isUploading?: boolean;
    uploadProgress?: number;
}
/**
 * Lesson with full content (from detail endpoint)
 */
export interface LessonDetail extends Lesson {
    videos: Video[];
    documents: Document[];
}
/**
 * Video entity
 */
export interface Video {
    id: string;
    title: string;
    lessonId: string;
    uploadId: string;
    durationSeconds: number | null;
    createdAt: string;
    updatedAt: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    storagePath?: string;
    bunnyGuid?: string;
    bunnyStatus?: BunnyStatus;
}
/**
 * Video with play state (for students)
 */
export interface VideoWithProgress extends Video {
    playStates?: VideoPlayState[];
    progress?: number;
}
/**
 * Document entity
 */
export interface Document {
    id: string;
    title: string;
    lessonId: string;
    uploadId: string;
    createdAt: string;
    upload?: {
        storagePath: string;
        fileName: string;
        mimeType?: string;
        fileSize?: number;
    };
}
/**
 * Upload entity
 */
export interface Upload {
    id: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    storagePath: string | null;
    bunnyGuid: string | null;
    bunnyStatus: BunnyStatus | null;
    uploadedBy: string;
    createdAt: string;
    updatedAt: string;
}
/**
 * Video play state for tracking progress
 */
export interface VideoPlayState {
    id: string;
    videoId: string;
    studentId: string;
    currentTime: number;
    maxTimeWatched: number;
    completed: boolean;
    createdAt: string;
    updatedAt: string;
}
/**
 * Class enrollment
 */
export interface ClassEnrollment {
    id: string;
    classId: string;
    userId: string;
    status: EnrollmentStatus;
    documentSigned: boolean;
    createdAt: string;
    updatedAt: string;
}
/**
 * Teacher entity (links User to Academy)
 */
export interface Teacher {
    id: string;
    userId: string;
    academyId: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
    updatedAt: string;
    user?: User;
    academy?: Academy;
}
/**
 * Live stream entity
 */
export interface LiveStream {
    id: string;
    title: string;
    classId: string;
    teacherId: string;
    status: LiveStreamStatus;
    zoomMeetingId: string | null;
    zoomLink: string | null;
    zoomPassword: string | null;
    recordingId: string | null;
    participantCount: number | null;
    createdAt: string;
    startedAt: string | null;
    endedAt: string | null;
}
/**
 * Notification entity
 */
export interface Notification {
    id: string;
    userId: string;
    type: 'LIVE_CLASS' | 'NEW_LESSON' | 'ENROLLMENT_APPROVED' | 'ENROLLMENT_REJECTED' | 'SYSTEM';
    title: string;
    message: string;
    data: string | null;
    isRead: boolean;
    createdAt: string;
}
/**
 * Lesson rating entity
 */
export interface LessonRating {
    id: string;
    lessonId: string;
    studentId: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    updatedAt: string;
}
/**
 * Topic entity
 */
export interface Topic {
    id: string;
    name: string;
    lessonId: string;
    startTime: number;
    createdAt: string;
}
//# sourceMappingURL=models.d.ts.map