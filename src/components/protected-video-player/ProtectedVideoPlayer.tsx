'use client';

import { useRef, useState } from 'react';
import type Hls from 'hls.js';
import 'plyr/dist/plyr.css';
import { WatermarkOverlay, BrandWatermark } from '../video/WatermarkOverlay';
import { useProgressTracker, ProgressStats } from '../video/ProgressTracker';
import {
  LockedOverlay,
  LoadingIndicator,
  TranscodingStatus,
  ErrorMessage,
  hiddenControlsStyle,
} from '../video/SecurityLayer';
import type { ProtectedVideoPlayerProps, PlyrInstance, CompletionFlags } from './types';
import { useSignedUrl } from './useSignedUrl';
import { usePlyrInit } from './usePlyrInit';
import { useVideoEffects } from './useVideoEffects';

export default function ProtectedVideoPlayer({
  videoUrl,
  videoId,
  studentId,
  studentName,
  studentEmail,
  maxWatchTimeMultiplier,
  durationSeconds,
  initialPlayState,
  userRole,
  watermarkIntervalMins = 5,
  hlsUrl,
  bunnyGuid,
}: ProtectedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const plyrRef = useRef<PlyrInstance | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const currentTimeRef = useRef(0);
  const isPlayingRef = useRef(false);
  const completionFlagsRef = useRef<CompletionFlags>({
    hadPauseWhilePlaying: false,
    hadTabSwitchWhilePlaying: false,
    lastPlayStartWallTime: 0,
    accumulatedWallSeconds: 0,
  });

  const [playState, setPlayState] = useState(initialPlayState);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(durationSeconds);
  const [isLocked, setIsLocked] = useState(initialPlayState?.status === 'BLOCKED');
  const [showWatermark, setShowWatermark] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [plyrContainer, setPlyrContainer] = useState<HTMLElement | null>(null);

  // Teachers and admins have unlimited watch time
  const isUnlimitedUser = userRole === 'TEACHER' || userRole === 'ADMIN';
  const effectiveDuration = videoDuration || durationSeconds || 0;
  const maxWatchTimeSeconds = isUnlimitedUser
    ? Infinity
    : effectiveDuration * maxWatchTimeMultiplier;
  const watchTimeRemaining = isUnlimitedUser
    ? Infinity
    : Math.max(0, maxWatchTimeSeconds - (playState?.totalWatchTimeSeconds || 0));
  const canPlay =
    !isLocked && (isUnlimitedUser || effectiveDuration === 0 || watchTimeRemaining > 0);
  const showLockedOverlay = isLocked || !canPlay;

  // Progress tracking hook
  useProgressTracker({
    videoId,
    studentId,
    isPlaying,
    isUnlimitedUser,
    canPlay,
    playbackRate,
    currentTime,
    onPlayStateUpdate: setPlayState,
    onLocked: () => setIsLocked(true),
    onPause: () => plyrRef.current?.pause(),
  });

  const { signedHlsUrl, transcodingStatus } = useSignedUrl(bunnyGuid);

  const { triggerWatermark } = useVideoEffects({
    videoId,
    isUnlimitedUser,
    effectiveDuration,
    watchTimeRemaining,
    isPlaying,
    showLockedOverlay,
    studentName,
    watermarkIntervalMins,
    initialPlayState,
    plyrRef,
    videoRef,
    containerRef,
    isPlayingRef,
    currentTimeRef,
    completionFlagsRef,
    setPlayState,
    setIsLocked,
    setShowWatermark,
    setCurrentTime,
  });

  usePlyrInit({
    videoRef,
    containerRef,
    plyrRef,
    hlsRef,
    isPlayingRef,
    currentTimeRef,
    completionFlagsRef,
    videoUrl,
    hlsUrl,
    signedHlsUrl,
    bunnyGuid,
    canPlay,
    isLocked,
    isPlaying,
    isUnlimitedUser,
    videoDuration,
    durationSeconds,
    videoId,
    initialLastPosition: initialPlayState?.lastPositionSeconds,
    triggerWatermark,
    setIsPlaying,
    setCurrentTime,
    setPlaybackRate,
    setIsLocked,
    setVideoDuration,
    setIsLoading,
    setPlyrContainer,
    setError,
  });

  return (
    <div className="w-full bg-black rounded-xl overflow-hidden border border-gray-800 relative">
      <style dangerouslySetInnerHTML={{ __html: hiddenControlsStyle }} />

      <ErrorMessage error={error} />

      <div ref={containerRef} id={`video-container-${videoId}`} className="relative bg-black">
        <video
          ref={videoRef}
          className="w-full bg-black"
          disablePictureInPicture
          preload="auto"
          playsInline
        />

        <LockedOverlay isLocked={showLockedOverlay} />
        <BrandWatermark />
        <WatermarkOverlay
          showWatermark={showWatermark}
          studentName={studentName}
          studentEmail={studentEmail}
          plyrContainer={plyrContainer}
          isUnlimitedUser={isUnlimitedUser}
        />
        <LoadingIndicator isLoading={isLoading && transcodingStatus !== 'processing'} />
        <TranscodingStatus transcodingStatus={transcodingStatus} />
      </div>

      <ProgressStats
        currentTime={currentTime}
        videoDuration={videoDuration}
        totalWatchTimeSeconds={playState?.totalWatchTimeSeconds || 0}
        watchTimeRemaining={watchTimeRemaining}
        isUnlimitedUser={isUnlimitedUser}
      />

      <style jsx global>{`
        .plyr {
          --plyr-color-main: #00b3ff;
          --plyr-video-background: #000;
          --plyr-menu-background: rgba(0, 0, 0, 0.9);
          --plyr-menu-color: #fff;
        }
        .plyr__controls {
          z-index: 10 !important;
        }
        .plyr--fullscreen-fallback {
          position: fixed !important;
          inset: 0 !important;
          z-index: 9998 !important;
        }
        .plyr:-webkit-full-screen .plyr__controls,
        .plyr:fullscreen .plyr__controls {
          z-index: 10 !important;
        }
      `}</style>
    </div>
  );
}
