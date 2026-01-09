export interface Bindings {
  DB: D1Database;
  STORAGE: R2Bucket;
  STORAGE_TYPE: string;
  BUNNY_STREAM_LIBRARY_ID: string;
  BUNNY_STREAM_API_KEY: string;
  BUNNY_STREAM_CDN_HOSTNAME: string;
  BUNNY_STREAM_TOKEN_KEY: string;
  ZOOM_ACCOUNT_ID: string;
  ZOOM_CLIENT_ID: string;
  ZOOM_CLIENT_SECRET: string;
  ZOOM_WEBHOOK_SECRET: string;
  RESEND_API_KEY: string;
  FRONTEND_URL: string;
}

export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'ACADEMY' | 'TEACHER' | 'STUDENT';
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
