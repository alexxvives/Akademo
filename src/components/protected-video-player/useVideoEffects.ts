'use client';

import { useEffect, useRef, useCallback, MutableRefObject } from 'react';
import type { PlyrInstance, CompletionFlags, VideoPlayState } from './types';

interface UseVideoEffectsParams {
  videoId: string;
  isUnlimitedUser: boolean;
  effectiveDuration: number;
  watchTimeRemaining: number;
  isPlaying: boolean;
  showLockedOverlay: boolean;
  studentName?: string;
  watermarkIntervalMins: number;
  initialPlayState: VideoPlayState;
  plyrRef: MutableRefObject<PlyrInstance | null>;
  videoRef: MutableRefObject<HTMLVideoElement | null>;
  containerRef: MutableRefObject<HTMLDivElement | null>;
  isPlayingRef: MutableRefObject<boolean>;
  currentTimeRef: MutableRefObject<number>;
  completionFlagsRef: MutableRefObject<CompletionFlags>;
  setPlayState: (v: VideoPlayState) => void;
  setIsLocked: (v: boolean) => void;
  setShowWatermark: (v: boolean) => void;
  setCurrentTime: (v: number) => void;
}

export function useVideoEffects(p: UseVideoEffectsParams) {
  const watermarkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerWatermark = useCallback(() => {
    if (p.isUnlimitedUser || !p.studentName) return;
    p.setShowWatermark(true);
    if (watermarkTimeoutRef.current) clearTimeout(watermarkTimeoutRef.current);
    watermarkTimeoutRef.current = setTimeout(() => p.setShowWatermark(false), 5000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.isUnlimitedUser, p.studentName]);

  // Update play state when video changes
  useEffect(() => {
    p.setPlayState(p.initialPlayState);
    p.setIsLocked(p.initialPlayState?.status === 'BLOCKED');
    // Reset screen-recording detection flags for fresh video
    p.completionFlagsRef.current = {
      hadPauseWhilePlaying: false,
      hadTabSwitchWhilePlaying: false,
      lastPlayStartWallTime: 0,
      accumulatedWallSeconds: 0,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.videoId]); // Only re-run when video changes

  // Track tab/window visibility changes to detect screen recording
  useEffect(() => {
    if (p.isUnlimitedUser) return;
    const handleVisibilityChange = () => {
      if (document.hidden && p.isPlayingRef.current) {
        p.completionFlagsRef.current.hadTabSwitchWhilePlaying = true;
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [p.isUnlimitedUser, p.isPlayingRef, p.completionFlagsRef]);

  // Lock video when limit reached
  useEffect(() => {
    if (!p.isUnlimitedUser && p.watchTimeRemaining <= 0 && p.effectiveDuration > 0) {
      p.setIsLocked(true);

      // Stop video completely
      if (p.plyrRef.current) {
        p.plyrRef.current.pause();
        p.plyrRef.current.stop();
      }

      // Also ensure native video element stops
      if (p.videoRef.current) {
        p.videoRef.current.pause();
        p.videoRef.current.currentTime = 0;
      }

      // Exit fullscreen if active
      if (document.fullscreenElement) {
        document.exitFullscreen().catch((err) => console.error('Error exiting fullscreen:', err));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.watchTimeRemaining, p.isUnlimitedUser, p.effectiveDuration]);

  // Watermark timer - shows periodically to prevent screen recording
  useEffect(() => {
    if (p.isUnlimitedUser || !p.studentName || !p.isPlaying) {
      p.setShowWatermark(false);
      return;
    }

    const intervalMs = p.watermarkIntervalMins * 60 * 1000;

    // Show immediately when video starts
    triggerWatermark();

    // Then show at intervals
    const intervalId = setInterval(triggerWatermark, intervalMs);

    return () => {
      clearInterval(intervalId);
      if (watermarkTimeoutRef.current) clearTimeout(watermarkTimeoutRef.current);
      p.setShowWatermark(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.isPlaying, p.watermarkIntervalMins, p.studentName, p.isUnlimitedUser, triggerWatermark]);

  // When locked, reset video to beginning and hide Plyr controls
  useEffect(() => {
    if (p.showLockedOverlay) {
      if (p.plyrRef.current) {
        p.plyrRef.current.pause();
        p.plyrRef.current.currentTime = 0;
      }
      if (p.videoRef.current) {
        p.videoRef.current.pause();
        p.videoRef.current.currentTime = 0;
      }
      p.setCurrentTime(0);
      p.currentTimeRef.current = 0;
      p.containerRef.current?.classList.add('plyr-controls-hidden');
    } else {
      p.containerRef.current?.classList.remove('plyr-controls-hidden');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.showLockedOverlay]);

  return { triggerWatermark };
}
