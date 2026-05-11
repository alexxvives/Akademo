export type PlyrInstance = InstanceType<typeof import('plyr')>;

export interface VideoPlayState {
  totalWatchTimeSeconds: number;
  sessionStartTime: string | null;
  status?: string;
  lastPositionSeconds?: number;
}

export interface ProtectedVideoPlayerProps {
  videoUrl: string;
  videoId: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  maxWatchTimeMultiplier: number;
  durationSeconds: number;
  initialPlayState: VideoPlayState;
  userRole?: string;
  watermarkIntervalMins?: number;
  hlsUrl?: string;
  bunnyGuid?: string;
  academyName?: string;
}

export interface CompletionFlags {
  hadPauseWhilePlaying: boolean;
  hadTabSwitchWhilePlaying: boolean;
  lastPlayStartWallTime: number;
  accumulatedWallSeconds: number;
}
