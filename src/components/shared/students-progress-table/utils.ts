export function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return hours > 0 ? `${hours}h ${minutes}m` : minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

export function getProgressBarColor(_lastActive: string | null): string {
  return 'bg-blue-500';
}

export function getActivityStatus(lastActive: string | null): { color: string; label: string; textColor: string } {
  if (!lastActive) return { color: 'bg-gray-400', label: 'Sin actividad', textColor: 'text-gray-500' };

  const now = new Date();
  const lastActiveDate = new Date(lastActive);
  const hoursSinceActive = (now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60);

  if (hoursSinceActive <= 24) {
    return { color: 'bg-green-500', label: 'Activo hace menos de 24h', textColor: 'text-green-600' };
  } else if (hoursSinceActive <= 168) {
    return { color: 'bg-yellow-500', label: 'Activo hace menos de 7 días', textColor: 'text-yellow-600' };
  } else {
    return { color: 'bg-red-500', label: 'Inactivo hace más de 7 días', textColor: 'text-red-600' };
  }
}
