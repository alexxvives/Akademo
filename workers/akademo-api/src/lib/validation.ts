/**
 * Zod Validation Schemas for API Routes
 * 
 * Provides input validation for all API endpoints.
 * Use with Hono's validator middleware.
 */

import { z } from 'zod';

// ============ Common Schemas ============

export const uuidSchema = z.string().uuid();

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ============ Auth Schemas ============

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email format').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  academyName: z.string().min(1).max(200).optional(),
  monoacademy: z.boolean().optional().default(false),
  role: z.enum(['STUDENT', 'TEACHER', 'ACADEMY']).default('STUDENT'),
  academyId: z.string().min(1).optional(),
  classId: z.string().min(1).optional(),
  classIds: z.array(z.string().min(1)).optional().default([]),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

// ============ Academy Schemas ============

export const createAcademySchema = z.object({
  name: z.string().min(1, 'Academy name is required').max(200),
  description: z.string().max(2000).optional(),
  address: z.string().max(500).optional(),
  phone: z.string().max(50).optional(),
  website: z.string().url().optional().or(z.literal('')),
});

export const updateAcademySchema = createAcademySchema.partial();

// ============ Class Schemas ============

export const createClassSchema = z.object({
  name: z.string().min(1, 'Class name is required').max(200),
  description: z.string().max(2000).optional(),
  monthlyPrice: z.coerce.number().min(0).optional(),
  oneTimePrice: z.coerce.number().min(0).optional(),
  startDate: z.string().optional(),
  teacherId: z.string().optional(),
  academyId: z.string().min(1, 'Academy ID is required'),
  whatsappGroupLink: z.string().url().optional().or(z.literal('')).or(z.literal(null)).optional(),
  maxStudents: z.coerce.number().int().min(0).optional(),
  university: z.string().max(200).optional().nullable(),
  carrera: z.string().max(200).optional().nullable(),
});

export const updateClassSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  teacherId: z.string().optional(),
  slug: z.string().optional(),
  whatsappGroupLink: z.string().optional().nullable(),
  zoomAccountId: z.string().optional().nullable(),
  monthlyPrice: z.coerce.number().min(0).optional().nullable(),
  oneTimePrice: z.coerce.number().min(0).optional().nullable(),
  maxStudents: z.coerce.number().int().min(0).optional(),
  startDate: z.string().optional(),
  university: z.string().max(200).optional().nullable(),
  carrera: z.string().max(200).optional().nullable(),
});

// ============ Lesson Schemas ============

export const createLessonSchema = z.object({
  title: z.string().min(1, 'Lesson title is required').max(200),
  description: z.string().max(2000).optional(),
  classId: z.string().min(1, 'Class ID is required'),
  topicId: z.string().optional().nullable(),
  releaseDate: z.string().optional().nullable(),
  orderIndex: z.coerce.number().int().min(0).optional(),
  maxWatchTimeMultiplier: z.coerce.number().min(1).max(10).optional(),
  watermarkIntervalMins: z.coerce.number().min(1).max(60).optional(),
}).passthrough(); // Allow extra fields like videos, documents

export const updateLessonSchema = createLessonSchema.partial().omit({ classId: true }).extend({
  resetTimers: z.boolean().optional(),
});

// ============ Topic Schemas ============

export const createTopicSchema = z.object({
  name: z.string().min(1, 'Topic name is required').max(200),
  classId: z.string().uuid(),
  orderIndex: z.coerce.number().int().min(0).optional(),
});

export const updateTopicSchema = createTopicSchema.partial().omit({ classId: true });

// ============ Enrollment Schemas ============

export const signDocumentSchema = z.object({
  classId: z.string().min(1, 'Class ID is required'),
});

export const enrollmentRequestSchema = z.object({
  classId: z.string().min(1, 'Class ID is required'),
  paymentMethod: z.enum(['STRIPE', 'CASH', 'TRANSFER']).optional(),
});

export const approveEnrollmentSchema = z.object({
  enrollmentId: z.string().min(1, 'Enrollment ID is required'),
  action: z.enum(['APPROVE', 'REJECT'], { message: 'Action must be APPROVE or REJECT' }),
});

// ============ Payment Schemas ============

export const initiatePaymentSchema = z.object({
  classId: z.string().min(1, 'Class ID is required'),
  paymentMethod: z.enum(['cash', 'stripe', 'bizum'], { message: 'Must be: cash, stripe, or bizum' }),
  paymentFrequency: z.enum(['monthly', 'one-time'], { message: 'Must be: monthly or one-time' }),
});

export const approveCashPaymentSchema = z.object({
  notes: z.string().max(500).optional(),
});

// ============ Assignment Schemas ============

export const createAssignmentSchema = z.object({
  title: z.string().min(1, 'Assignment title is required').max(200),
  description: z.string().max(2000).optional(),
  classId: z.string().min(1, 'Class ID is required'),
  dueDate: z.string().optional(),
  maxScore: z.coerce.number().int().min(0).max(1000).default(100),
  uploadId: z.string().optional(),
  uploadIds: z.array(z.string()).optional(),
});

export const gradeSubmissionSchema = z.object({
  score: z.coerce.number().int().min(0),
  feedback: z.string().max(2000).optional(),
});

// ============ Rating Schemas ============

export const createRatingSchema = z.object({
  lessonId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

// ============ Notification Schemas ============

export const createNotificationSchema = z.object({
  classId: z.string().uuid().optional(),
  liveStreamId: z.string().uuid().optional(),
  message: z.string().min(1).max(500),
  type: z.enum(['LIVE_STREAM', 'ANNOUNCEMENT', 'REMINDER']).default('ANNOUNCEMENT'),
});

// ============ Live Stream Schemas ============

export const createLiveStreamSchema = z.object({
  title: z.string().min(1, 'Stream title is required').max(200),
  classId: z.string().uuid(),
  scheduledFor: z.string().optional(),
});

// ============ Video Progress Schemas ============

export const videoProgressSchema = z.object({
  videoId: z.string().min(1, 'Video ID is required'),
  studentId: z.string().optional(),
  currentPositionSeconds: z.coerce.number().min(0).optional(),
  watchTimeElapsed: z.coerce.number().min(0),
});

// ============ Validation Helper ============

import type { Context, Next } from 'hono';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMiddleware = (c: any, next: Next) => Promise<Response | void>;

/**
 * Validation middleware for JSON body.
 * Validates the body against the schema. If invalid, returns 400.
 * If valid, continues to the handler. The handler reads body via c.req.json() (cached).
 */
export function validateBody<T extends z.ZodSchema>(schema: T): AnyMiddleware {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json();
      const result = schema.safeParse(body);
      
      if (!result.success) {
        const errors = result.error.errors.map((e: z.ZodIssue) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return c.json({
          success: false,
          error: 'Validation failed',
          details: errors,
        }, 400);
      }
      
      await next();
    } catch {
      return c.json({
        success: false,
        error: 'Invalid JSON body',
      }, 400);
    }
  };
}

/**
 * Create a validation middleware for query parameters
 */
export function validateQuery<T extends z.ZodSchema>(schema: T): AnyMiddleware {
  return async (c: Context, next: Next) => {
    const query = Object.fromEntries(new URL(c.req.url).searchParams);
    const result = schema.safeParse(query);
    
    if (!result.success) {
      const errors = result.error.errors.map((e: z.ZodIssue) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return c.json({
        success: false,
        error: 'Invalid query parameters',
        details: errors,
      }, 400);
    }
    
    c.set('validatedQuery' as never, result.data as never);
    await next();
  };
}

/**
 * Create a validation middleware for URL parameters
 */
export function validateParams<T extends z.ZodSchema>(schema: T): AnyMiddleware {
  return async (c: Context, next: Next) => {
    const params = c.req.param();
    const result = schema.safeParse(params);
    
    if (!result.success) {
      const errors = result.error.errors.map((e: z.ZodIssue) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return c.json({
        success: false,
        error: 'Invalid URL parameters',
        details: errors,
      }, 400);
    }
    
    c.set('validatedParams' as never, result.data as never);
    await next();
  };
}

// Type helpers for accessing validated data
export type ValidatedBody<T extends z.ZodSchema> = z.infer<T>;
