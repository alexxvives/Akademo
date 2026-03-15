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
  BUNNY_DEMO_VIDEO_GUID?: string;
  
  // Zoom
  ZOOM_ACCOUNT_ID: string;
  ZOOM_CLIENT_ID: string;
  ZOOM_CLIENT_SECRET: string;
  ZOOM_WEBHOOK_SECRET: string;

  // GoToMeeting
  GTM_CLIENT_ID: string;
  GTM_CLIENT_SECRET: string;

  // Daily.co (test/prototype)
  DAILY_API_KEY?: string;
  DAILY_DOMAIN?: string;
  DAILY_WEBHOOK_SECRET?: string;
  
  // Email
  RESEND_API_KEY: string;
  
  // Stripe
  // Toggle: set STRIPE_SANDBOX = "true" to use sandbox keys, anything else (or absent) = live keys
  STRIPE_SANDBOX: string;
  // Sandbox keys (sk_test_*, whsec_ from sandbox endpoint)
  STRIPE_SECRET_KEY_SANDBOX: string;
  STRIPE_WEBHOOK_SECRET_SANDBOX: string;
  // Production keys (sk_live_*, whsec_ from live endpoint)
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  
  // Session
  SESSION_SECRET: string;
  
  // Frontend
  FRONTEND_URL: string;
}

