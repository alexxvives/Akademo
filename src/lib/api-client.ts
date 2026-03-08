/**
 * API Client for AKADEMO
 * 
 * Centralized fetch wrapper for calling the separate Hono API worker.
 * Automatically includes credentials (cookies) and handles JSON responses.
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://akademo-api.alexxvives.workers.dev';

export interface ApiClientOptions extends RequestInit {
  skipCredentials?: boolean;
}

/**
 * Make an API request to the Hono worker
 * @param path - API path (e.g., '/auth/me', '/classes')
 * @param options - Fetch options
 * @returns Fetch Response object
 */
export async function apiClient(
  path: string,
  options: ApiClientOptions = {}
): Promise<Response> {
  const { skipCredentials, ...fetchOptions } = options;
  
  const url = `${API_BASE_URL}${path}`;
  
  // Get token from local storage if available (Client-side)
  let token = '';
  if (typeof window !== 'undefined') {
      token = localStorage.getItem('auth_token') || '';
  }
  
  const response = await fetch(url, {
    ...fetchOptions,
    credentials: skipCredentials ? 'omit' : 'include', // Include cookies for auth
    headers: {
      // Don't set Content-Type for FormData (it sets its own with boundary)
      ...(fetchOptions.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      'X-Requested-With': 'XMLHttpRequest',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...fetchOptions.headers,
    },
  });

  // Global 401 handler: redirect to login on expired/invalid session
  // Skip for auth endpoints to avoid redirect loops
  if (response.status === 401 && typeof window !== 'undefined') {
    const isAuthEndpoint = path.startsWith('/auth/');
    if (!isAuthEndpoint) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login?expired=1';
      // Return the response so callers don't throw before redirect completes
      return response;
    }
  }
  
  return response;
}

/**
 * Open a private document in a new browser tab using a pre-signed URL.
 * 
 * Direct navigation to /api/documents/... fails because auth is via localStorage
 * (not cookies), and the server-side proxy cannot forward credentials cross-worker.
 * This gets a short-lived signed URL from the API (using JS auth) and opens it directly.
 */
export async function openDocument(storagePath: string): Promise<void> {
  const res = await apiClient(`/storage/signed-url?key=${encodeURIComponent(storagePath)}`);
  if (!res.ok) throw new Error('Failed to get signed URL');
  const json = await res.json() as { success: boolean; data: { token: string; expires: number } };
  if (!json.success) throw new Error('Failed to get signed URL');
  const { token, expires } = json.data;
  const encodedKey = storagePath.split('/').map(encodeURIComponent).join('/');
  window.open(`${API_BASE_URL}/storage/serve/${encodedKey}?token=${token}&expires=${expires}`, '_blank');
}

/**
 * Make a GET request
 */
export async function apiGet(path: string, options?: ApiClientOptions): Promise<Response> {
  return apiClient(path, { ...options, method: 'GET' });
}

/**
 * Make a POST request
 */
export async function apiPost(path: string, body?: unknown, options?: ApiClientOptions): Promise<Response> {
  return apiClient(path, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Make a PATCH request
 */
export async function apiPatch(path: string, body?: unknown, options?: ApiClientOptions): Promise<Response> {
  return apiClient(path, {
    ...options,
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Make a DELETE request
 */
export async function apiDelete(path: string, options?: ApiClientOptions): Promise<Response> {
  return apiClient(path, { ...options, method: 'DELETE' });
}

/**
 * Make a PUT request
 */
export async function apiPut(path: string, body?: unknown, options?: ApiClientOptions): Promise<Response> {
  return apiClient(path, {
    ...options,
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}
