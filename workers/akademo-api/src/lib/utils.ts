import { ApiResponse } from '../types';

export function successResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
  };
}

export function errorResponse(error: string, details?: Array<{ field: string; message: string }>): ApiResponse {
  const res: ApiResponse & { details?: Array<{ field: string; message: string }> } = {
    success: false,
    error,
  };
  if (details) res.details = details;
  return res;
}

/** Escape user-provided strings for safe HTML embedding in emails */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
