/**
 * API Client for AKADEMO
 * 
 * Centralized fetch wrapper for calling the separate Hono API worker.
 * Automatically includes credentials (cookies) and handles JSON responses.
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://akademo-api.alexxvives.workers.dev';

export interface ApiClientOptions extends RequestInit {
  skipCredentials?: boolean;
  /** When true, a 401 response will NOT trigger the global redirect-to-login. The caller handles auth errors itself. */
  skipAutoRedirect?: boolean;
  /** Internal: set on retried requests after a silent refresh to prevent infinite loops. */
  _isRetry?: boolean;
}

// ─── Silent token refresh with mutex ─────────────────────────────────────────
// Only one refresh in-flight at a time. Concurrent 401s all wait for the same
// refresh promise so we don't rotate the refresh token multiple times.
let _refreshPromise: Promise<boolean> | null = null;

/**
 * Store a session token in localStorage and set the middleware cookie via the
 * same-origin Next.js API route. Always call this instead of writing to
 * localStorage directly so that hard-reloads (especially on Safari iOS) don't
 * lose the authenticated state.
 */
export async function setAuthSession(token: string): Promise<void> {
  localStorage.setItem('auth_token', token);
  // Fire-and-forget — cookie failure is non-fatal (localStorage auth still works).
  fetch('/api/auth/set-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  }).catch(() => { /* non-fatal */ });
}

/**
 * Remove the session token from localStorage and clear the middleware cookie.
 */
export function clearAuthSession(): void {
  localStorage.removeItem('auth_token');
  fetch('/api/auth/set-session', { method: 'DELETE' }).catch(() => { /* non-fatal */ });
}

async function _doRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });
    if (!res.ok) return false;
    const data = await res.json() as { success: boolean; data: { token: string } };
    if (!data.success || !data.data?.token) return false;
    await setAuthSession(data.data.token);
    return true;
  } catch {
    return false;
  }
}

function attemptSilentRefresh(): Promise<boolean> {
  if (!_refreshPromise) {
    _refreshPromise = _doRefresh().finally(() => { _refreshPromise = null; });
  }
  return _refreshPromise;
}
// ─────────────────────────────────────────────────────────────────────────────

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
  const { skipCredentials, skipAutoRedirect, _isRetry, signal: callerSignal, ...fetchOptions } = options;
  
  const url = `${API_BASE_URL}${path}`;
  
  // Get token from local storage if available (Client-side)
  let token = '';
  if (typeof window !== 'undefined') {
      token = localStorage.getItem('auth_token') || '';
  }

  // Timeout of 30s to prevent fetch from hanging indefinitely on bad connections
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);
  if (callerSignal) {
    callerSignal.addEventListener('abort', () => controller.abort());
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      credentials: skipCredentials ? 'omit' : 'include', // Include cookies for auth
      headers: {
        // Don't set Content-Type for FormData (it sets its own with boundary)
        ...(fetchOptions.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        'X-Requested-With': 'XMLHttpRequest',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...fetchOptions.headers,
      },
    });
  } finally {
    clearTimeout(timeoutId);
  }

  // Global 401 handler: attempt silent token refresh first, then decide what to do on failure.
  // Skip for: auth endpoints (avoid loops), retried requests.
  // `skipAutoRedirect` only controls whether a failed refresh redirects to login — it no longer
  // prevents the refresh attempt itself, so background calls also benefit from token renewal.
  if (response.status === 401 && typeof window !== 'undefined' && !_isRetry) {
    const isAuthEndpoint = path.startsWith('/auth/');
    if (!isAuthEndpoint) {
      const refreshed = await attemptSilentRefresh();
      if (refreshed) {
        // Token renewed — retry the original request once with the new token
        return apiClient(path, { ...options, _isRetry: true });
      }
      // Refresh failed — session truly expired
      if (!skipAutoRedirect) {
        const hadToken = !!localStorage.getItem('auth_token');
        clearAuthSession();
        // Only show 'expired' banner if we actually had a token (not a manual logout race)
        window.location.href = hadToken ? '/?modal=login&expired=1' : '/?modal=login';
      }
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
export async function openDocument(storagePath: string, allowDownload = false): Promise<void> {
  const res = await apiClient(`/storage/signed-url?key=${encodeURIComponent(storagePath)}`);
  if (!res.ok) throw new Error('Failed to get signed URL');
  const json = await res.json() as { success: boolean; data: { token: string; expires: number; name: string; email: string; academyName: string; serverWm: boolean } };
  if (!json.success) throw new Error('Failed to get signed URL');
  const { token, expires, name, email, academyName, serverWm } = json.data;
  const encodedKey = storagePath.split('/').map(encodeURIComponent).join('/');
  const qs = new URLSearchParams({ token, expires: String(expires), name: name ?? '', email: email ?? '', academyName: academyName ?? '' });
  const url = `/api/storage/serve/${encodedKey}?${qs}`;

  // PDFs open in the in-app viewer (no browser download toolbar) unless allowDownload is set
  const lower = storagePath.toLowerCase();
  const isPdf = lower.endsWith('.pdf');
  const isOffice = /\.(docx?|xlsx?|pptx?)$/.test(lower);
  const isImage = /\.(jpe?g|png|gif|webp)$/i.test(lower);
  if (!allowDownload && (isPdf || isOffice || isImage)) {
    const rawName = storagePath.split('/').pop() ?? '';
    const title = decodeURIComponent(rawName).replace(/\.[^.]+$/, '');
    if (isPdf) {
      window.dispatchEvent(new CustomEvent('open-pdf', { detail: { url, title, serverWm: serverWm ?? false } }));
    } else if (isImage) {
      window.dispatchEvent(new CustomEvent('open-image', { detail: { url, title } }));
    } else {
      // Office viewer requires an absolute URL; build it here.
      const absolute = new URL(url, window.location.origin).toString();
      window.dispatchEvent(new CustomEvent('open-office', { detail: { url: absolute, title } }));
    }
  } else {
    window.open(url, '_blank');
  }
}

/**
 * Download a document by fetching a signed URL and triggering a file download.
 */
export async function downloadDocument(storagePath: string, fileName: string): Promise<void> {
  const res = await apiClient(`/storage/signed-url?key=${encodeURIComponent(storagePath)}`);
  if (!res.ok) throw new Error('Failed to get signed URL');
  const json = await res.json() as { success: boolean; data: { token: string; expires: number; name: string; email: string; academyName: string } };
  if (!json.success) throw new Error('Failed to get signed URL');
  const { token, expires, name, email, academyName } = json.data;
  const encodedKey = storagePath.split('/').map(encodeURIComponent).join('/');
  const qs = new URLSearchParams({ token, expires: String(expires), name: name ?? '', email: email ?? '', academyName: academyName ?? '' });
  const url = `/api/storage/serve/${encodedKey}?${qs}`;
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
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


