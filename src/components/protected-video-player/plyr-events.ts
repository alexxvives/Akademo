import { MutableRefObject } from 'react';
import { apiClient } from '@/lib/api-client';
import type { PlyrInstance, CompletionFlags } from './types';

interface PlyrEventBindings {
  plyr: PlyrInstance;
  canPlay: boolean;
  isLocked: boolean;
  isPlaying: boolean;
  isUnlimitedUser: boolean;
  videoDuration: number;
  durationSeconds: number;
  videoId: string;
  initialLastPosition?: number;
  isPlayingRef: MutableRefObject<boolean>;
  currentTimeRef: MutableRefObject<number>;
  completionFlagsRef: MutableRefObject<CompletionFlags>;
  setIsPlaying: (v: boolean) => void;
  setCurrentTime: (v: number) => void;
  setPlaybackRate: (v: number) => void;
  setIsLocked: (v: boolean) => void;
  setVideoDuration: (v: number) => void;
  setIsLoading: (v: boolean) => void;
  setPlyrContainer: (v: HTMLElement | null) => void;
  triggerWatermark: () => void;
}

export function bindPlyrEvents(b: PlyrEventBindings) {
  b.plyr.on('play', () => {
    if (!b.canPlay || b.isLocked) {
      b.plyr.pause();
      b.setIsPlaying(false);
      return;
    }
    b.isPlayingRef.current = true;
    b.setIsPlaying(true);
    b.completionFlagsRef.current.lastPlayStartWallTime = Date.now();
  });

  b.plyr.on('pause', () => {
    if (b.isPlayingRef.current) {
      const elapsed =
        (Date.now() - b.completionFlagsRef.current.lastPlayStartWallTime) / 1000;
      b.completionFlagsRef.current.accumulatedWallSeconds += elapsed;
      b.completionFlagsRef.current.hadPauseWhilePlaying = true;
    }
    b.isPlayingRef.current = false;
    b.setIsPlaying(false);
  });

  b.plyr.on('ended', () => {
    if (b.isPlayingRef.current) {
      const elapsed =
        (Date.now() - b.completionFlagsRef.current.lastPlayStartWallTime) / 1000;
      b.completionFlagsRef.current.accumulatedWallSeconds += elapsed;
    }
    b.isPlayingRef.current = false;
    b.setIsPlaying(false);

    // Only report completion for students
    if (!b.isUnlimitedUser) {
      const duration = b.plyr.duration || b.videoDuration || b.durationSeconds;
      // realtimeWatch: wall-clock time spent playing ≥ 90% of video duration
      const realtimeWatch =
        duration > 10 &&
        b.completionFlagsRef.current.accumulatedWallSeconds / duration >= 0.9;

      const flags = {
        videoId: b.videoId,
        watchedFull: true,
        noPause: !b.completionFlagsRef.current.hadPauseWhilePlaying,
        noTabSwitch: !b.completionFlagsRef.current.hadTabSwitchWhilePlaying,
        realtimeWatch,
      };

      apiClient('/videos/completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flags),
      }).catch((err) => console.error('[Completion] Error reporting completion:', err));
    }
  });

  b.plyr.on('timeupdate', () => {
    const newTime = b.plyr.currentTime;
    if (Math.abs(newTime - b.currentTimeRef.current) > 0.1) {
      b.setCurrentTime(newTime);
      b.currentTimeRef.current = newTime;
    }

    if (!b.canPlay && b.isPlaying) {
      b.plyr.pause();
      b.setIsPlaying(false);
      b.setIsLocked(true);
    }
  });

  b.plyr.on('ratechange', () => {
    b.setPlaybackRate(b.plyr.speed);
  });

  // Show watermark on seek/interaction
  b.plyr.on('seeking', b.triggerWatermark);
  b.plyr.on('seeked', b.triggerWatermark);

  // Save Plyr container for Portal rendering
  b.setPlyrContainer(b.plyr.elements.container);

  b.plyr.on('loadedmetadata', async () => {
    const duration = b.plyr.duration;
    if (duration && !isNaN(duration) && duration !== Infinity) {
      b.setVideoDuration(duration);

      if (!b.durationSeconds || b.durationSeconds === 0) {
        try {
          await apiClient(`/videos/${b.videoId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ durationSeconds: Math.round(duration) }),
          });
        } catch (e) {
          console.error('Failed to update video duration:', e);
        }
      }
    }

    // Restore position on initial load
    if (
      b.initialLastPosition &&
      b.initialLastPosition > 0 &&
      b.currentTimeRef.current === 0
    ) {
      b.plyr.currentTime = b.initialLastPosition;
      b.setCurrentTime(b.initialLastPosition);
    }
  });

  b.plyr.on('ready', () => b.setIsLoading(false));
}
