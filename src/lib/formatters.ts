/**
 * Shared formatting utilities for dates, durations, and numbers.
 * Centralizes formatting logic used across the application.
 */

/**
 * Formats a duration in seconds to a human-readable string.
 * @param seconds - Duration in seconds
 * @returns Formatted string like "2h 30m" or "45m"
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0m 0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
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
