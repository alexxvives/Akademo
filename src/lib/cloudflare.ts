// Type definitions for Cloudflare bindings (frontend-side)
// Full D1/R2 types are in packages/types and workers/akademo-api
export interface CloudflareEnv {
  DB: unknown;
  STORAGE: unknown;
  JWT_SECRET: string;
  STORAGE_TYPE: string;
  // Bunny Stream
  BUNNY_STREAM_LIBRARY_ID: string;
  BUNNY_STREAM_API_KEY: string;
  BUNNY_STREAM_CDN_HOSTNAME: string;
  BUNNY_STREAM_TOKEN_KEY?: string;
  BUNNY_STREAM_LIVE_API_KEY?: string;
  // Zoom
  ZOOM_ACCOUNT_ID?: string;
  ZOOM_CLIENT_ID?: string;
  ZOOM_CLIENT_SECRET?: string;
  ZOOM_WEBHOOK_SECRET?: string;
}

// Helper to get Cloudflare bindings in Next.js API routes
export function getCloudflareContext(): CloudflareEnv | null {
  // In Cloudflare Workers, the env is available via @opennextjs/cloudflare
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext: getCtx } = require('@opennextjs/cloudflare');
    const ctx = getCtx();
    return ctx?.env as CloudflareEnv;
  } catch {
    return null;
  }
}
