'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import 'plyr/dist/plyr.css';
import { apiClient } from '@/lib/api-client';
import { WatermarkOverlay, BrandWatermark } from './video/WatermarkOverlay';
import { useProgressTracker, ProgressStats } from './video/ProgressTracker';
import {
  LockedOverlay,
  LoadingIndicator,
  TranscodingStatus,
  ErrorMessage,
  hiddenControlsStyle,
} from './video/SecurityLayer';

type PlyrInstance = InstanceType<typeof import('plyr')>;

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
  hlsUrl?: string;
  bunnyGuid?: string;
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
  hlsUrl,
  bunnyGuid,
}: ProtectedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const plyrRef = useRef<PlyrInstance | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const currentTimeRef = useRef(0);
  const watermarkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [playState, setPlayState] = useState<VideoPlayState>(initialPlayState);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(durationSeconds);
  const [isLocked, setIsLocked] = useState(initialPlayState?.status === 'BLOCKED');
  const [showWatermark, setShowWatermark] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [signedHlsUrl, setSignedHlsUrl] = useState<string | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [transcodingStatus, setTranscodingStatus] = useState<string | null>(null);
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



  // Update play state when video changes (only re-run on videoId change to avoid excessive updates)
  useEffect(() => {
    setPlayState(initialPlayState);
    setIsLocked(initialPlayState?.status === 'BLOCKED');
  }, [videoId]); // Only re-run when video changes, not when playState object reference changes

  // Fetch signed URL for Bunny videos
  useEffect(() => {
    if (!bunnyGuid) {
      setSignedHlsUrl(null);
      setIsLoading(false);
      return;
    }

    async function fetchSignedUrl() {
      try {
        // First check transcoding status
        const statusResponse = await apiClient(`/bunny/video/${bunnyGuid}/status`);
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          if (statusData.success && statusData.data?.status === 4) {
            setTranscodingStatus('finished');
          } else if (statusData.success && statusData.data?.status === 3) {
            setTranscodingStatus('processing');
            setIsLoading(false);
            // Poll for status updates every 5 seconds
            const pollInterval = setInterval(async () => {
              const pollResponse = await apiClient(`/bunny/video/${bunnyGuid}/status`);
              if (pollResponse.ok) {
                const pollData = await pollResponse.json();
                if (pollData.success && pollData.data?.status === 4) {
                  setTranscodingStatus('finished');
                  clearInterval(pollInterval);
                  window.location.reload(); // Reload to load the video
                }
              }
            }, 5000);
            return () => clearInterval(pollInterval);
          }
        }

        const response = await apiClient(`/bunny/video/${bunnyGuid}/stream`);
        const data = await response.json();
        
        if (data.success && data.data?.streamUrl) {
          setSignedHlsUrl(data.data.streamUrl);
        } else if (data.data?.error) {
          // Token key not configured or error, use direct URL as fallback
          console.warn('Signed URL not available:', data.data.error);
          // Fallback to direct unsigned URL
          setSignedHlsUrl(`https://vz-bb8d111e-8eb.b-cdn.net/${bunnyGuid}/playlist.m3u8`);
        } else {
          // Unexpected response, use direct URL
          console.warn('Unexpected API response, using direct URL');
          setSignedHlsUrl(`https://vz-bb8d111e-8eb.b-cdn.net/${bunnyGuid}/playlist.m3u8`);
        }
      } catch (err) {
        console.error('Failed to fetch signed URL:', err);
        // Fallback to direct unsigned URL
        setSignedHlsUrl(`https://vz-bb8d111e-8eb.b-cdn.net/${bunnyGuid}/playlist.m3u8`);
      }
    }

    fetchSignedUrl();
  }, [bunnyGuid]);

  const triggerWatermark = useCallback(() => {
    if (isUnlimitedUser || !studentName) return;
    setShowWatermark(true);
    if (watermarkTimeoutRef.current) clearTimeout(watermarkTimeoutRef.current);
    watermarkTimeoutRef.current = setTimeout(() => setShowWatermark(false), 5000);
  }, [isUnlimitedUser, studentName]);

  // Lock video when limit reached
  useEffect(() => {
    if (!isUnlimitedUser && watchTimeRemaining <= 0 && effectiveDuration > 0) {
      setIsLocked(true);
      
      // Stop video completely
      if (plyrRef.current) {
        plyrRef.current.pause();
        plyrRef.current.stop();
      }
      
      // Also ensure native video element stops
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
      
      // Exit fullscreen if active
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.error('Error exiting fullscreen:', err));
      }
    }
  }, [watchTimeRemaining, isUnlimitedUser, effectiveDuration]);

  // Initialize HLS.js and Plyr
  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    // For Bunny videos, wait for the signed URL to be fetched
    if (bunnyGuid && !signedHlsUrl) {
      setIsLoading(true);
      return;
    }

    // Use signed URL for Bunny, or fallback to provided hlsUrl or videoUrl
    const videoSrc = signedHlsUrl || hlsUrl || videoUrl;
    if (!videoSrc) {
      setError('No video source provided');
      setIsLoading(false);
      return;
    }

    // Check if it's an HLS stream
    const isHls = videoSrc.includes('.m3u8');

    // Dynamic import of Plyr to avoid SSR issues
    let plyrInstance: PlyrInstance | null = null;
    
    const initPlyr = async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const PlyrClass = (await import('plyr')).default || require('plyr');
      
      // Initialize Plyr with custom controls and ratio
      const plyr = new PlyrClass(video, {
        controls: [
          'play-large',
          'play',
          'progress',
          'current-time',
          'duration',
          'mute',
          'volume',
          'settings',
          'fullscreen',
        ],
        settings: ['quality', 'speed'],
        speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] },
        keyboard: { focused: true, global: false },
        tooltips: { controls: true, seek: true },
        captions: { active: false, update: true },
        ratio: '16:9', // Force 16:9 aspect ratio for consistent dimensions
        fullscreen: {
          enabled: true,
          fallback: true,
          iosNative: false,
        },
        clickToPlay: true,
        disableContextMenu: true,
        hideControls: true,
        resetOnEnd: false,
        invertTime: false,
        toggleInvert: false,
      });

      plyrInstance = plyr;
      plyrRef.current = plyr;

      // Handle Plyr events
      plyr.on('play', () => {
        if (!canPlay || isLocked) {
          plyr.pause();
          setIsPlaying(false);
          return;
        }
        setIsPlaying(true);
      });

      plyr.on('pause', () => setIsPlaying(false));
      plyr.on('ended', () => setIsPlaying(false));
      
      plyr.on('timeupdate', () => {
        const newTime = plyr.currentTime;
        if (Math.abs(newTime - currentTimeRef.current) > 0.1) {
          setCurrentTime(newTime);
          currentTimeRef.current = newTime;
        }
        
        if (!canPlay && isPlaying) {
          plyr.pause();
          setIsPlaying(false);
          setIsLocked(true);
        }
      });

      // Track playback rate changes
      plyr.on('ratechange', () => {
        const rate = plyr.speed;
        setPlaybackRate(rate);
      });

      // Show watermark on seek/interaction
      plyr.on('seeking', triggerWatermark);
      plyr.on('seeked', triggerWatermark);
      plyr.on('controlshidden', () => { /* Optional: maybe hide watermark? No, keep logic simple */ });

      // Save Plyr container for Portal rendering
      setPlyrContainer(plyr.elements.container);



      plyr.on('loadedmetadata', async () => {
        const duration = plyr.duration;
        if (duration && !isNaN(duration) && duration !== Infinity) {
          setVideoDuration(duration);
          
          if (!durationSeconds || durationSeconds === 0) {
            try {
              await apiClient(`/videos/${videoId}`, {
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
        if (initialPlayState?.lastPositionSeconds && initialPlayState.lastPositionSeconds > 0 && currentTime === 0) {
          plyr.currentTime = initialPlayState.lastPositionSeconds;
          setCurrentTime(initialPlayState.lastPositionSeconds);
        }
      });

      plyr.on('ready', () => setIsLoading(false));

      // Initialize HLS if needed
      if (isHls) {
        // Safari supports HLS natively
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = videoSrc;
          setIsLoading(false);
        } else if (Hls.isSupported()) {
          // Use HLS.js for other browsers
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
            startLevel: -1,
            maxBufferLength: 10,
            maxMaxBufferLength: 30,
            maxBufferSize: 60 * 1000 * 1000,
            maxBufferHole: 0.1,
            highBufferWatchdogPeriod: 1,
            backBufferLength: 0,
            liveSyncDurationCount: 3,
            liveMaxLatencyDurationCount: 10,
            manifestLoadingMaxRetry: 3,
            levelLoadingMaxRetry: 3,
            fragLoadingMaxRetry: 3,
            startPosition: -1,
            startFragPrefetch: true,
            testBandwidth: false,
          });

          hls.loadSource(videoSrc);
          hls.attachMedia(video);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setIsLoading(false);
          });

          hls.on(Hls.Events.ERROR, (event, data) => {
            console.error('HLS Error:', data);
            if (!data.fatal) return;
            
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              if (data.response?.code === 403) {
                setError('Error 403: El video requiere configuración de seguridad. Por favor habilita "Direct Play" en Bunny Stream → Library → Security.');
              } else {
                setError('Error de red al cargar el video. Verifica tu conexión.');
              }
            } else {
              setError('Error al cargar el stream de video.');
            }
            setIsLoading(false);
          });

          hlsRef.current = hls;
        } else {
          setError('Your browser does not support HLS video playback');
          setIsLoading(false);
        }
      } else {
        // Regular video file
        video.src = videoSrc;
        setIsLoading(false);
      }
    };

    initPlyr();

    return () => {
      if (plyrInstance) {
        plyrInstance.destroy();
      }
      plyrRef.current = null;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [hlsUrl, videoUrl, signedHlsUrl, bunnyGuid, triggerWatermark]);

  // Watermark timer - shows periodically to prevent screen recording
  useEffect(() => {
    if (isUnlimitedUser || !studentName || !isPlaying) {
      setShowWatermark(false);
      return;
    }

    const intervalMs = watermarkIntervalMins * 60 * 1000;

    // Show immediately when video starts
    triggerWatermark();

    // Then show at intervals
    const intervalId = setInterval(() => {
      triggerWatermark();
    }, intervalMs);

    return () => {
      // Clear interval and timeout
      clearInterval(intervalId);
      if (watermarkTimeoutRef.current) {
        clearTimeout(watermarkTimeoutRef.current);
      }
      setShowWatermark(false);
    };
  }, [isPlaying, watermarkIntervalMins, studentName, isUnlimitedUser, triggerWatermark]);

  // Track if player should be locked (for overlay display)
  const showLockedOverlay = isLocked || !canPlay;

  // When locked, reset video to beginning and hide Plyr controls
  useEffect(() => {
    if (showLockedOverlay) {
      if (plyrRef.current) {
        plyrRef.current.pause();
        plyrRef.current.currentTime = 0;
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
      setCurrentTime(0);
      currentTimeRef.current = 0;

      const container = containerRef.current;
      if (container) {
        container.classList.add('plyr-controls-hidden');
      }
    } else {
      const container = containerRef.current;
      if (container) {
        container.classList.remove('plyr-controls-hidden');
      }
    }
  }, [showLockedOverlay]);

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
