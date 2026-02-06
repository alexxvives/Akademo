// Type definitions for Cloudflare bindings
export interface CloudflareEnv {
  DB: D1Database;
  STORAGE: R2Bucket;
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

// D1 Database interface (from Cloudflare Workers types)
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  dump(): Promise<ArrayBuffer>;
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
  meta: {
    duration: number;
    changes: number;
    last_row_id: number;
    served_by: string;
    internal_stats?: unknown;
  };
}

export interface D1ExecResult {
  count: number;
  duration: number;
}

// R2 Bucket interface
export interface R2Bucket {
  head(key: string): Promise<R2Object | null>;
  get(key: string, options?: R2GetOptions): Promise<R2ObjectBody | null>;
  put(key: string, value: ReadableStream | ArrayBuffer | string | Blob, options?: R2PutOptions): Promise<R2Object>;
  delete(keys: string | string[]): Promise<void>;
  list(options?: R2ListOptions): Promise<R2Objects>;
  createMultipartUpload(key: string, options?: R2PutOptions): Promise<R2MultipartUpload>;
  resumeMultipartUpload(key: string, uploadId: string): R2MultipartUpload;
  uploadPart(key: string, uploadId: string, partNumber: number, value: ReadableStream | ArrayBuffer | string | Blob): Promise<R2UploadedPart>;
  completeMultipartUpload(key: string, uploadId: string, uploadedParts: R2UploadedPart[]): Promise<R2Object>;
  abortMultipartUpload(key: string, uploadId: string): Promise<void>;
}

export interface R2Object {
  key: string;
  version: string;
  size: number;
  etag: string;
  httpEtag: string;
  checksums: R2Checksums;
  uploaded: Date;
  httpMetadata?: R2HTTPMetadata;
  customMetadata?: Record<string, string>;
}

export interface R2ObjectBody extends R2Object {
  body: ReadableStream;
  bodyUsed: boolean;
  arrayBuffer(): Promise<ArrayBuffer>;
  text(): Promise<string>;
  json<T>(): Promise<T>;
  blob(): Promise<Blob>;
}

export interface R2GetOptions {
  onlyIf?: R2Conditional;
  range?: R2Range;
}

export interface R2PutOptions {
  onlyIf?: R2Conditional;
  httpMetadata?: R2HTTPMetadata;
  customMetadata?: Record<string, string>;
  md5?: ArrayBuffer | string;
  sha1?: ArrayBuffer | string;
  sha256?: ArrayBuffer | string;
  sha384?: ArrayBuffer | string;
  sha512?: ArrayBuffer | string;
}

export interface R2ListOptions {
  limit?: number;
  prefix?: string;
  cursor?: string;
  delimiter?: string;
  include?: ('httpMetadata' | 'customMetadata')[];
}

export interface R2Objects {
  objects: R2Object[];
  truncated: boolean;
  cursor?: string;
  delimitedPrefixes: string[];
}

export interface R2Checksums {
  md5?: ArrayBuffer;
  sha1?: ArrayBuffer;
  sha256?: ArrayBuffer;
  sha384?: ArrayBuffer;
  sha512?: ArrayBuffer;
}

export interface R2HTTPMetadata {
  contentType?: string;
  contentLanguage?: string;
  contentDisposition?: string;
  contentEncoding?: string;
  cacheControl?: string;
  cacheExpiry?: Date;
}

export interface R2Conditional {
  etagMatches?: string;
  etagDoesNotMatch?: string;
  uploadedBefore?: Date;
  uploadedAfter?: Date;
}

export interface R2Range {
  offset?: number;
  length?: number;
  suffix?: number;
}

export interface R2MultipartUpload {
  uploadId: string;
  key: string;
  uploadPart(partNumber: number, value: ReadableStream | ArrayBuffer | string | Blob): Promise<R2UploadedPart>;
  abort(): Promise<void>;
  complete(uploadedParts: R2UploadedPart[]): Promise<R2Object>;
}

export interface R2UploadedPart {
  partNumber: number;
  etag: string;
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
