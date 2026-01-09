import { videoQueries, academyQueries } from './db';

// Types for database records
interface VideoWithDetails {
  classId: string;
  academyId: string;
  lessonMultiplier?: number | null;
}

interface Academy {
  defaultMaxWatchTimeMultiplier?: number | null;
}

// Default platform settings (no longer in database)
const DEFAULT_MAX_WATCH_TIME_MULTIPLIER = 2.0;

export async function getEffectiveVideoSettings(videoId: string) {
  // Use findWithDetails to get video with classId and academyId from Lesson join
  const video = await videoQueries.findWithDetails(videoId) as VideoWithDetails | null;

  if (!video) {
    throw new Error('Video not found');
  }

  if (!video.classId || !video.academyId) {
    throw new Error('Video has no associated class');
  }

  const academy = await academyQueries.findById(video.academyId) as Academy | null;
  if (!academy) {
    throw new Error('Academy not found');
  }

  // Priority: Lesson > Academy > Default
  const maxWatchTimeMultiplier =
    video.lessonMultiplier ??
    academy.defaultMaxWatchTimeMultiplier ??
    DEFAULT_MAX_WATCH_TIME_MULTIPLIER;

  return {
    maxWatchTimeMultiplier,
  };
}
