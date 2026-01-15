/**
 * API Response Types for AKADEMO
 * 
 * Re-exports from @akademo/types for backwards compatibility.
 * New code should import directly from '@akademo/types'.
 * 
 * @deprecated Import from '@akademo/types' instead
 */

// Re-export all API types from shared package
export type {
  ApiResponse,
  PaginatedResponse,
  UserRole,
  EnrollmentStatus,
  LiveStreamStatus,
  BunnyStatus,
  SessionUser,
  AuthResponse,
  ErrorCode,
  ErrorResponse,
} from '@akademo/types';

