/**
 * API Response Types for AKADEMO
 * Shared between Next.js Frontend and Hono Worker
 */
/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}
/**
 * Paginated response for list endpoints
 */
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
/**
 * User roles in the system
 */
export type UserRole = 'ADMIN' | 'ACADEMY' | 'TEACHER' | 'STUDENT';
/**
 * Enrollment status
 */
export type EnrollmentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
/**
 * Live stream status
 */
export type LiveStreamStatus = 'scheduled' | 'active' | 'ended';
/**
 * Bunny video encoding status
 * 0 = Queued, 1 = Processing, 2 = Encoding, 3 = Finished, 4 = Resolution Finished, 5 = Failed
 */
export type BunnyStatus = 0 | 1 | 2 | 3 | 4 | 5;
/**
 * Session user (authenticated user context)
 */
export interface SessionUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
}
/**
 * Authentication response
 */
export interface AuthResponse {
    user: SessionUser;
    token?: string;
}
/**
 * Error codes for structured error handling
 */
export type ErrorCode = 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'VALIDATION_ERROR' | 'CONFLICT' | 'INTERNAL_ERROR';
/**
 * Structured error response
 */
export interface ErrorResponse {
    success: false;
    error: string;
    code?: ErrorCode;
    details?: Record<string, string>;
}
//# sourceMappingURL=api.d.ts.map