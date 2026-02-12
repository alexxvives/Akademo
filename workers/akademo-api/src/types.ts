/**
 * Cloudflare Worker Bindings for AKADEMO API
 * 
 * Shared types are imported from @akademo/types package (monorepo).
 * This file contains worker-specific bindings only.
 */

// Import shared types from monorepo package
import type { UserRole, SessionUser, ApiResponse } from '@akademo/types';

// Re-export for convenience within worker
export type { UserRole, SessionUser, ApiResponse };

/**
 * Environment bindings for the Hono worker
 */
export interface Bindings {
  // Database
  DB: D1Database;
  
  // Storage
  STORAGE: R2Bucket;
  STORAGE_TYPE: string;
  
  // Bunny Stream
  BUNNY_STREAM_LIBRARY_ID: string;
  BUNNY_STREAM_API_KEY: string;
  BUNNY_STREAM_CDN_HOSTNAME: string;
  BUNNY_STREAM_TOKEN_KEY: string;
  BUNNY_API_KEY: string;
  BUNNY_LIBRARY_ID: string;
  
  // Zoom
  ZOOM_ACCOUNT_ID: string;
  ZOOM_CLIENT_ID: string;
  ZOOM_CLIENT_SECRET: string;
  ZOOM_WEBHOOK_SECRET: string;
  
  // Email
  RESEND_API_KEY: string;
  
  // Stripe
  STRIPE_WEBHOOK_SECRET: string;
  
  // Session
  SESSION_SECRET: string;
  
  // Frontend
  FRONTEND_URL: string;
}

