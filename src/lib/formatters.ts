/**
 * Shared formatting utilities for dates, durations, and numbers.
 * Centralizes formatting logic used across the application.
 */

/**
 * Extracts an error message from an unknown error.
 * Use this instead of `catch (error: any)` pattern.
 * @param error - The caught error (unknown type)
 * @returns Error message string
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'An unexpected error occurred';
}

/**
 * Formats a duration in seconds to a human-readable string.
 * @param seconds - Duration in seconds
 * @returns Formatted string like "2h 30m" or "45m"
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/**
 * Formats a date string to Spanish locale format.
 * @param dateString - ISO date string or null
 * @param fallback - String to return if dateString is null/undefined (default: '')
 * @returns Formatted date like "5 feb. 2026" or fallback
 */
export function formatDate(dateString: string | null | undefined, fallback = ''): string {
  if (!dateString) return fallback;
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Formats a date string to a long Spanish locale format.
 * @param dateString - ISO date string
 * @returns Formatted date like "5 de febrero de 2026"
 */
export function formatDateLong(dateString: string): string {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Checks if a date has been released (is in the past or now).
 * @param dateString - ISO date string
 * @returns true if the date is now or in the past
 */
export function isReleased(dateString: string): boolean {
  return new Date(dateString) <= new Date();
}

/**
 * Formats bytes to a human-readable size string.
 * @param bytes - Number of bytes
 * @returns Formatted string like "1.5 MB" or "500 KB"
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Formats a time in seconds to mm:ss format.
 * @param seconds - Time in seconds
 * @returns Formatted string like "05:30"
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formats a percentage value.
 * @param value - Decimal value (e.g., 0.75 for 75%)
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted string like "75%"
 */
export function formatPercent(value: number, decimals = 0): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Formats a currency value in EUR.
 * @param amount - Amount in euros
 * @returns Formatted string like "€25.00"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

/**
 * Gets relative time from a date (e.g., "hace 2 horas").
 * @param dateString - ISO date string
 * @returns Relative time string in Spanish
 */
export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'ahora mismo';
  if (diffMins < 60) return `hace ${diffMins} min`;
  if (diffHours < 24) return `hace ${diffHours}h`;
  if (diffDays < 7) return `hace ${diffDays} días`;
  return formatDate(dateString);
}

/**
 * Formats a date with long month name and capitalization.
 * Used for lesson release dates in lists.
 * @param dateString - ISO date string
 * @returns Formatted date like "5 de Febrero"
 */
export function formatDateWithMonth(dateString: string): string {
  const date = new Date(dateString);
  const formatted = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
  const parts = formatted.split(' de ');
  if (parts.length === 2) {
    const month = parts[1];
    return `${parts[0]} de ${month.charAt(0).toUpperCase()}${month.slice(1)}`;
  }
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/**
 * Formats a date string with long month name + time (HH:mm), capitalized.
 * Used for lesson release dates where time matters.
 * @param dateString - ISO date string
 * @returns Formatted like "29 de Enero, 14:30"
 */
export function formatDateTimeWithMonth(dateString: string): string {
  const date = new Date(dateString);
  const formatted = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
  const parts = formatted.split(' de ');
  let datePart = formatted;
  if (parts.length === 2) {
    const month = parts[1];
    datePart = `${parts[0]} de ${month.charAt(0).toUpperCase()}${month.slice(1)}`;
  } else {
    datePart = formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }
  const hours = date.getHours().toString().padStart(2, '0');
  const mins = date.getMinutes().toString().padStart(2, '0');
  return `${datePart}, ${hours}:${mins}`;
}
