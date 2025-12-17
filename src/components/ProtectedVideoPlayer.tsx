'use client';

import { useEffect, useRef, useState } from 'react';

interface VideoPlayState {
  totalWatchTimeSeconds: number;
  sessionStartTime: string | null;
  status?: string;
  lastPositionSeconds?: number;
}

interface ProtectedVideoPlayerProps {
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
}

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
}: ProtectedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastSaveTimeRef = useRef<number>(0);
  const playTimeTracker = useRef<number>(0);
  const lastUpdateTime = useRef<number | null>(null);

  const [playState, setPlayState] = useState<VideoPlayState>(initialPlayState);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(durationSeconds);
  const [isLocked, setIsLocked] = useState(initialPlayState?.status === 'BLOCKED');
  const [showWatermark, setShowWatermark] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Teachers and admins have unlimited watch time
  const isUnlimitedUser = userRole === 'TEACHER' || userRole === 'ADMIN';
  // Use video duration from metadata if durationSeconds is 0 or not set
  const effectiveDuration = videoDuration || durationSeconds || 0;
  const maxWatchTimeSeconds = isUnlimitedUser ? Infinity : effectiveDuration * maxWatchTimeMultiplier;
  const watchTimeRemaining = isUnlimitedUser ? Infinity : Math.max(0, maxWatchTimeSeconds - (playState?.totalWatchTimeSeconds || 0));
  // If duration is 0, allow unlimited playback until duration is detected
  const canPlay = !isLocked && (isUnlimitedUser || effectiveDuration === 0 || watchTimeRemaining > 0);

  // Lock video when limit reached
  useEffect(() => {
    if (!isUnlimitedUser && watchTimeRemaining <= 0 && effectiveDuration > 0) {
      setIsLocked(true);
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
    }
  }, [watchTimeRemaining, isUnlimitedUser, effectiveDuration]);

  // Save progress to server
  const saveProgress = async (elapsedSeconds: number) => {
    if (elapsedSeconds <= 0) return;

    try {
      const response = await fetch('/api/video/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          studentId,
          currentPositionSeconds: currentTime,
          watchTimeElapsed: elapsedSeconds,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        // Check if video was blocked
        if (response.status === 403) {
          setIsLocked(true);
          setPlayState(prev => ({ ...prev, status: 'BLOCKED' }));
          if (videoRef.current && !videoRef.current.paused) {
            videoRef.current.pause();
          }
        }
        throw new Error(data.error || 'Failed to save progress');
      }

      const data = await response.json();
      if (data.success && data.data.playState) {
        const newPlayState = data.data.playState;
        // Update status if backend marked as blocked
        if (newPlayState.status === 'BLOCKED') {
          setIsLocked(true);
          setPlayState(newPlayState);
          if (videoRef.current && !videoRef.current.paused) {
            videoRef.current.pause();
          }
        }
      }
    } catch (err) {
      console.error('Failed to save progress:', err);
      // Don't set error for progress save failures to avoid disrupting playback
    }
  };

  // Track play time - increment every second when playing
  const watchTimeInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing interval
    if (watchTimeInterval.current) {
      clearInterval(watchTimeInterval.current);
      watchTimeInterval.current = null;
    }

    // Start tracking if playing and not unlimited user
    if (isPlaying && !isUnlimitedUser && canPlay) {
      watchTimeInterval.current = setInterval(() => {
        setPlayState(prev => {
          const newTotalTime = (prev?.totalWatchTimeSeconds || 0) + 1;
          return {
            ...prev,
            totalWatchTimeSeconds: newTotalTime,
            sessionStartTime: prev?.sessionStartTime || new Date().toISOString(),
          };
        });
        
        playTimeTracker.current += 1;
        
        // Save every 5 seconds
        if (playTimeTracker.current >= 5) {
          saveProgress(playTimeTracker.current);
          playTimeTracker.current = 0;
        }
      }, 1000);
    } else {
      // Save any remaining time when paused
      if (playTimeTracker.current > 0) {
        saveProgress(playTimeTracker.current);
        playTimeTracker.current = 0;
      }
    }

    return () => {
      if (watchTimeInterval.current) {
        clearInterval(watchTimeInterval.current);
      }
    };
  }, [isPlaying, isUnlimitedUser, canPlay]);

  // Set initial position from lastPositionSeconds when video loads
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      // Set duration
      if (video.duration && !isNaN(video.duration) && video.duration !== Infinity) {
        setVideoDuration(video.duration);
      }

      // Restore last position if available
      if (initialPlayState?.lastPositionSeconds && initialPlayState.lastPositionSeconds > 0) {
        video.currentTime = initialPlayState.lastPositionSeconds;
        setCurrentTime(initialPlayState.lastPositionSeconds);
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    // Check if metadata already loaded
    if (video.readyState >= 1) {
      handleLoadedMetadata();
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [initialPlayState]);

  // Update current time and detect duration
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const newCurrentTime = video.currentTime;
      setCurrentTime(newCurrentTime);
      
      // Enforce time limit strictly - pause if limit reached
      if (!canPlay && isPlaying) {
        video.pause();
        setIsPlaying(false);
        setIsLocked(true);
      }
    };

    const handlePlay = () => {
      // Prevent play if limit reached or locked
      if (!canPlay || isLocked) {
        video.pause();
        setIsPlaying(false);
        return;
      }
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [canPlay, isPlaying, isLocked]);

  // Prevent context menu
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const preventContextMenu = (e: MouseEvent) => e.preventDefault();
    video.addEventListener('contextmenu', preventContextMenu);
    
    return () => video.removeEventListener('contextmenu', preventContextMenu);
  }, []);

  // Student watermark timer
  // Logic: Watermark appears immediately when video starts playing, stays for 5 seconds, then disappears.
  // After that, it reappears every X minutes (watermarkIntervalMins) for 5 seconds.
  // This prevents screen recording by periodically overlaying student info on the video.
  // Design: Semi-transparent diagonal watermark - discreet but visible enough to identify in recordings.
  useEffect(() => {
    if (isUnlimitedUser || !studentName || !isPlaying) {
      setShowWatermark(false);
      return;
    }

    const intervalMs = watermarkIntervalMins * 60 * 1000; // Convert to milliseconds
    const showDuration = 5000; // Show for 5 seconds

    // Show watermark immediately when video starts
    setShowWatermark(true);
    const hideInitial = setTimeout(() => setShowWatermark(false), showDuration);

    // Then show at intervals
    const intervalId = setInterval(() => {
      setShowWatermark(true);
      setTimeout(() => setShowWatermark(false), showDuration);
    }, intervalMs);

    return () => {
      clearTimeout(hideInitial);
      clearInterval(intervalId);
      setShowWatermark(false);
    };
  }, [isPlaying, watermarkIntervalMins, studentName, isUnlimitedUser]);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleRestart = async () => {
    if (!videoRef.current) return;
    
    videoRef.current.currentTime = 0;
    setCurrentTime(0);
    setError(null);
    
    // Don't reset totalWatchTimeSeconds - it accumulates across restarts
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds)) return 'Unlimited';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };


  if (!canPlay) {
    return (
      <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="h-8 w-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Watch Time Limit Reached
          </h3>
          
          <p className="text-gray-600">
            You've used all your available watch time for this video.
            Please contact your teacher if you need more time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-xl overflow-hidden border border-gray-200">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div 
        ref={containerRef}
        className={`relative bg-black ${isFullscreen ? 'flex items-center justify-center h-screen' : ''}`}
      >
        {/* Brand Watermark */}
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide z-10 pointer-events-none shadow-lg">
          AKADEMO
        </div>

        {/* Student Watermark - discreet but visible for screen recording detection */}
        {showWatermark && studentName && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl px-6 py-3 transform -rotate-12 shadow-lg">
              <div className="text-white/90 text-lg font-semibold tracking-wide">{studentName}</div>
              {studentEmail && (
                <div className="text-white/70 text-xs font-medium mt-0.5">{studentEmail}</div>
              )}
            </div>
          </div>
        )}

        {/* Video Element */}
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full aspect-video bg-black"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          controls
          controlsList="nodownload"
          disablePictureInPicture
          preload="metadata"
          playsInline
          style={{ pointerEvents: isLocked ? 'none' : 'auto' }}
        />
      </div>
    </div>
  );
}
