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
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...fetchOptions.headers,
    },
  });
  
  return response;
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
export async function apiPost(path: string, body?: any, options?: ApiClientOptions): Promise<Response> {
  return apiClient(path, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Make a PATCH request
 */
export async function apiPatch(path: string, body?: any, options?: ApiClientOptions): Promise<Response> {
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
export async function apiPut(path: string, body?: any, options?: ApiClientOptions): Promise<Response> {
  return apiClient(path, {
    ...options,
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}
