'use client';

import { useEffect, useRef, useState } from 'react';

interface VideoPlayState {
  totalWatchTimeSeconds: number;
  sessionStartTime: string | null;
  status?: string;
}

interface ProtectedVideoPlayerProps {
  videoUrl: string;
  videoId: string;
  studentId: string;
  maxWatchTimeMultiplier: number;
  durationSeconds: number;
  initialPlayState: VideoPlayState;
  userRole?: string;
}

export default function ProtectedVideoPlayer({
  videoUrl,
  videoId,
  studentId,
  maxWatchTimeMultiplier,
  durationSeconds,
  initialPlayState,
  userRole,
}: ProtectedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSaveTimeRef = useRef<number>(0);
  const playTimeTracker = useRef<number>(0);
  const lastUpdateTime = useRef<number | null>(null);

  const [playState, setPlayState] = useState<VideoPlayState>(initialPlayState);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(durationSeconds);
  const [isLocked, setIsLocked] = useState(initialPlayState?.status === 'BLOCKED');

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
        throw new Error(data.error || 'Failed to save progress');
      }

      // Don't update local state with API response - causes jumps
      // Local state already has the latest accumulated time
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

    const handleLoadedMetadata = () => {
      if (video.duration && !isNaN(video.duration) && video.duration !== Infinity) {
        setVideoDuration(video.duration);
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
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    
    // Check if metadata already loaded
    if (video.duration && !isNaN(video.duration) && video.duration !== Infinity) {
      setVideoDuration(video.duration);
    }
    
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [canPlay, isPlaying]);

  // Prevent context menu
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const preventContextMenu = (e: MouseEvent) => e.preventDefault();
    video.addEventListener('contextmenu', preventContextMenu);
    
    return () => video.removeEventListener('contextmenu', preventContextMenu);
  }, []);

  const handlePlayPause = () => {
    if (!videoRef.current || !canPlay) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    
    const newTime = parseFloat(e.target.value);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const skipTime = (seconds: number) => {
    if (!videoRef.current) return;
    
    const newTime = Math.max(0, Math.min(videoDuration || durationSeconds, currentTime + seconds));
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

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
          
          <p className="text-gray-600 mb-6">
            You've used all {formatTime(maxWatchTimeSeconds)} of watch time for this video.
            Please contact your teacher if you need more time.
          </p>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">Total Watch Time Used</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatTime(playState?.totalWatchTimeSeconds || 0)} / {formatTime(maxWatchTimeSeconds)}
            </div>
          </div>
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
        className="relative bg-black group"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        {/* Watermark */}
        <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded text-xs font-medium z-10 pointer-events-none">
          ACADEMO
        </div>

        {/* Video Element */}
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full aspect-video"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          controlsList="nodownload nofullscreen"
          disablePictureInPicture
          style={{ pointerEvents: isLocked ? 'none' : 'auto' }}
        />

        {/* Custom Controls */}
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent 
                     p-4 transition-opacity duration-300 ${
                       showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
                     }`}
        >
          {/* Progress Bar */}
          <div className="mb-3">
            <input
              type="range"
              min="0"
              max={videoDuration || durationSeconds}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer 
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 
                       [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full 
                       [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer
                       [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 
                       [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500 
                       [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
            />
            <div className="flex justify-between text-xs text-white mt-1">
              <span>{formatTime(currentTime)} / {formatTime(videoDuration || durationSeconds)}</span>
              <span>{formatTime(watchTimeRemaining)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Skip Back 10s */}
            <button
              onClick={() => skipTime(-10)}
              className="text-white hover:text-blue-300 transition-colors p-1"
              title="Skip back 10 seconds"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
              </svg>
            </button>

            {/* Play/Pause */}
            <button
              onClick={handlePlayPause}
              className="text-white hover:text-blue-300 transition-colors p-1"
            >
              {isPlaying ? (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </button>

            {/* Skip Forward 10s */}
            <button
              onClick={() => skipTime(10)}
              className="text-white hover:text-blue-300 transition-colors p-1"
              title="Skip forward 10 seconds"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
              </svg>
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-2 ml-auto">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5
                         [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer
                         [&::-moz-range-thumb]:w-2.5 [&::-moz-range-thumb]:h-2.5
                         [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white
                         [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Panel */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-gray-500 mb-1">Current Position</div>
            <div className="text-sm font-semibold text-gray-900">{formatTime(currentTime)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Total Watch Time</div>
            <div className="text-sm font-semibold text-gray-900">
              {formatTime(playState?.totalWatchTimeSeconds || 0)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Time Remaining</div>
            <div className="text-sm font-semibold text-gray-900">{formatTime(watchTimeRemaining)}</div>
          </div>
        </div>
        
        {/* Progress Bar for Total Watch Time - Only show for students */}
        {!isUnlimitedUser && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Watch Time Progress</span>
              <span>{Math.round(((playState?.totalWatchTimeSeconds || 0) / maxWatchTimeSeconds) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, ((playState?.totalWatchTimeSeconds || 0) / maxWatchTimeSeconds) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
