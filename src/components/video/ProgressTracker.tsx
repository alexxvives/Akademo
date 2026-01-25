'use client';

import { useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

interface VideoPlayState {
  totalWatchTimeSeconds: number;
  sessionStartTime: string | null;
  status?: string;
  lastPositionSeconds?: number;
}

interface ProgressTrackerProps {
  videoId: string;
  studentId: string;
  isPlaying: boolean;
  isUnlimitedUser: boolean;
  canPlay: boolean;
  playbackRate: number;
  currentTime: number;
  onPlayStateUpdate: (updater: (prev: VideoPlayState) => VideoPlayState) => void;
  onLocked: () => void;
  onPause: () => void;
}

export function useProgressTracker({
  videoId,
  studentId,
  isPlaying,
  isUnlimitedUser,
  canPlay,
  playbackRate,
  currentTime,
  onPlayStateUpdate,
  onLocked,
  onPause,
}: ProgressTrackerProps) {
  const playTimeTracker = useRef<number>(0);
  const watchTimeInterval = useRef<NodeJS.Timeout | null>(null);
  const currentTimeRef = useRef(currentTime);
  const isPlayingRef = useRef(isPlaying);
  const canPlayRef = useRef(canPlay);
  const playbackRateRef = useRef(playbackRate);

  // Update refs
  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
    canPlayRef.current = canPlay;
    playbackRateRef.current = playbackRate;
  }, [isPlaying, canPlay, playbackRate]);

  // Save progress to server
  const saveProgress = useCallback(async (elapsedSeconds: number) => {
    if (elapsedSeconds <= 0) return;

    try {
      console.log('[ProgressTracker] Saving progress:', {
        videoId,
        studentId,
        watchTimeElapsed: elapsedSeconds,
        currentPosition: currentTimeRef.current,
      });

      const response = await apiClient('/videos/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          studentId,
          currentPositionSeconds: currentTimeRef.current,
          watchTimeElapsed: elapsedSeconds,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('[ProgressTracker] Progress save failed:', data);
        if (response.status === 403) {
          onLocked();
          onPause();
        }
        throw new Error(data.error || 'Failed to save progress');
      }

      const data = await response.json();
      console.log('[ProgressTracker] Progress saved successfully:', data);

      if (data.success && data.data?.playState) {
        onPlayStateUpdate(data.data.playState);

        if (data.data.playState.status === 'BLOCKED') {
          console.log('[ProgressTracker] Video blocked due to watch time limit');
          onLocked();
          onPause();
        }
      }
    } catch (err) {
      console.error('[ProgressTracker] Failed to save progress:', err);
    }
  }, [videoId, studentId, onPlayStateUpdate, onLocked, onPause]);

  // Track play time
  useEffect(() => {
    console.log('[ProgressTracker] useEffect triggered', { isUnlimitedUser, isPlaying });
    
    // Don't track for unlimited users
    if (isUnlimitedUser) {
      console.log('[ProgressTracker] Skipping tracking - unlimited user (TEACHER/ADMIN)');
      return;
    }

    if (isPlaying) {
      console.log('[ProgressTracker] Starting interval for video tracking');
      // Start the interval
      watchTimeInterval.current = setInterval(() => {
        // Check if we should still be tracking
        if (!isPlayingRef.current || !canPlayRef.current) {
          console.log('[ProgressTracker] Skipping tick - not playing or cannot play', { 
            isPlaying: isPlayingRef.current, 
            canPlay: canPlayRef.current 
          });
          return;
        }

        // Multiply by playback rate so time passes faster at higher speeds
        const increment = playbackRateRef.current;

        console.log('[ProgressTracker] Incrementing watch time by', increment, 'seconds');

        onPlayStateUpdate((prev: VideoPlayState) => ({
          ...prev,
          totalWatchTimeSeconds: (prev?.totalWatchTimeSeconds || 0) + increment,
          sessionStartTime: prev?.sessionStartTime || new Date().toISOString(),
        }));

        playTimeTracker.current += increment;
        console.log('[ProgressTracker] playTimeTracker now at', playTimeTracker.current, 'seconds');

        // Save every 5 seconds
        if (playTimeTracker.current >= 5) {
          console.log('[ProgressTracker] Saving progress to server...');
          saveProgress(playTimeTracker.current);
          playTimeTracker.current = 0;
        }
      }, 1000);

      return () => {
        if (watchTimeInterval.current) {
          clearInterval(watchTimeInterval.current);
          watchTimeInterval.current = null;
        }
      };
    } else {
      // Clear interval if stopped playing
      if (watchTimeInterval.current) {
        clearInterval(watchTimeInterval.current);
        watchTimeInterval.current = null;
      }
    }
  }, [isPlaying, isUnlimitedUser]); // Removed saveProgress and onPlayStateUpdate to prevent infinite recreation

  // Save remaining progress when unmounting
  useEffect(() => {
    return () => {
      if (playTimeTracker.current > 0) {
        saveProgress(playTimeTracker.current);
        playTimeTracker.current = 0;
      }
    };
  }, [saveProgress]);

  return null;
}

interface ProgressStatsProps {
  currentTime: number;
  videoDuration: number;
  totalWatchTimeSeconds: number;
  watchTimeRemaining: number;
  isUnlimitedUser: boolean;
}

export function ProgressStats({
  currentTime,
  videoDuration,
  totalWatchTimeSeconds,
  watchTimeRemaining,
  isUnlimitedUser,
}: ProgressStatsProps) {
  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds)) return '∞';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isUnlimitedUser) {
    return null;
  }

  return (
    <div className="bg-gray-900 px-4 py-2 flex items-center justify-between text-xs text-gray-400">
      <div className="flex items-center gap-4">
        <span>Posición: {formatTime(currentTime)}</span>
        <span>Duración: {formatTime(videoDuration)}</span>
      </div>
      <div className="flex items-center gap-2">
        <span>Tiempo visto: {formatTime(totalWatchTimeSeconds)}</span>
        <span className="text-gray-600">|</span>
        <span className={watchTimeRemaining < 60 ? 'text-red-400' : ''}>
          Restante: {formatTime(watchTimeRemaining)}
        </span>
      </div>
    </div>
  );
}
