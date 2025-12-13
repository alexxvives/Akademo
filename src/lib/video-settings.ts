import { videoQueries, classQueries, academyQueries, settingsQueries } from './db';

// Types for database records
interface Video {
  classId: string;
  maxWatchTimeMultiplier?: number | null;
}

interface Class {
  academyId: string;
  defaultMaxWatchTimeMultiplier?: number | null;
}

interface Academy {
  defaultMaxWatchTimeMultiplier?: number | null;
}

interface PlatformSettings {
  defaultMaxWatchTimeMultiplier: number;
}

export async function getPlatformSettings() {
  return await settingsQueries.get();
}

export async function getEffectiveVideoSettings(videoId: string) {
  const video = await videoQueries.findById(videoId) as Video | null;

  if (!video) {
    throw new Error('Video not found');
  }

  const classData = await classQueries.findById(video.classId) as Class | null;
  if (!classData) {
    throw new Error('Class not found');
  }

  const academy = await academyQueries.findById(classData.academyId) as Academy | null;
  if (!academy) {
    throw new Error('Academy not found');
  }

  const platformSettings = await getPlatformSettings() as PlatformSettings;

  // Priority: Video > Class > Academy > Platform
  const maxWatchTimeMultiplier =
    video.maxWatchTimeMultiplier ??
    classData.defaultMaxWatchTimeMultiplier ??
    academy.defaultMaxWatchTimeMultiplier ??
    platformSettings.defaultMaxWatchTimeMultiplier;

  return {
    maxWatchTimeMultiplier,
  };
}
