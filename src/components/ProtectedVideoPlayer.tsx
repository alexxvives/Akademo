'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Hls from 'hls.js';
import 'plyr/dist/plyr.css';
import { apiClient } from '@/lib/api-client';

// CSS to hide Plyr controls when video is locked
const hiddenControlsStyle = `
  .plyr-controls-hidden .plyr__controls,
  .plyr-controls-hidden .plyr__control--overlaid {
    display: none !important;
    opacity: 0 !important;
    visibility: hidden !important;
    pointer-events: none !important;
  }
`;

// Plyr type for TypeScript
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
  const playTimeTracker = useRef<number>(0);
  const watchTimeInterval = useRef<NodeJS.Timeout | null>(null);

  const [playState, setPlayState] = useState<VideoPlayState>(initialPlayState);
  const [currentTime, setCurrentTime] = useState(0);
  const currentTimeRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(durationSeconds);
  const [isLocked, setIsLocked] = useState(initialPlayState?.status === 'BLOCKED');
  const [showWatermark, setShowWatermark] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [signedHlsUrl, setSignedHlsUrl] = useState<string | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [transcodingStatus, setTranscodingStatus] = useState<string | null>(null);
  const [plyrContainer, setPlyrContainer] = useState<HTMLElement | null>(null);
  const watermarkTimeoutRef = useRef<NodeJS.Timeout | null>(null);



  // Update play state when video changes (only re-run on videoId change to avoid excessive updates)
  useEffect(() => {
    console.log('[VideoPlayer] Updating playState from props:', initialPlayState);
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
        console.log('Stream API response:', data);
        
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

  // Teachers and admins have unlimited watch time
  const isUnlimitedUser = userRole === 'TEACHER' || userRole === 'ADMIN';
  const effectiveDuration = videoDuration || durationSeconds || 0;
  const maxWatchTimeSeconds = isUnlimitedUser ? Infinity : effectiveDuration * maxWatchTimeMultiplier;
  const watchTimeRemaining = isUnlimitedUser ? Infinity : Math.max(0, maxWatchTimeSeconds - (playState?.totalWatchTimeSeconds || 0));
  const canPlay = !isLocked && (isUnlimitedUser || effectiveDuration === 0 || watchTimeRemaining > 0);

  const triggerWatermark = useCallback(() => {
    if (isUnlimitedUser || !studentName) return;
    setShowWatermark(true);
    if (watermarkTimeoutRef.current) clearTimeout(watermarkTimeoutRef.current);
    watermarkTimeoutRef.current = setTimeout(() => setShowWatermark(false), 5000);
  }, [isUnlimitedUser, studentName]);

  // Format time display
  const formatTime = useCallback((seconds: number): string => {
    if (!isFinite(seconds)) return '∞';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Save progress to server - use ref for currentTime to avoid dependency changes
  const saveProgress = useCallback(async (elapsedSeconds: number) => {
    if (elapsedSeconds <= 0) return;

    try {
      console.log('[VideoPlayer] Saving progress:', {
        videoId,
        studentId,
        watchTimeElapsed: elapsedSeconds,
        currentPosition: currentTimeRef.current
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
        console.error('[VideoPlayer] Progress save failed:', data);
        if (response.status === 403) {
          setIsLocked(true);
          setPlayState(prev => ({ ...prev, status: 'BLOCKED' }));
          plyrRef.current?.pause();
        }
        throw new Error(data.error || 'Failed to save progress');
      }

      const data = await response.json();
      console.log('[VideoPlayer] Progress saved successfully:', data);
      
      if (data.success && data.data?.playState) {
        // Update local playState with server response
        setPlayState(data.data.playState);
        
        if (data.data.playState.status === 'BLOCKED') {
          console.log('[VideoPlayer] Video blocked due to watch time limit');
          setIsLocked(true);
          plyrRef.current?.pause();
        }
      }
    } catch (err) {
      console.error('[VideoPlayer] Failed to save progress:', err);
    }
  }, [videoId, studentId]);

  // Lock video when limit reached
  useEffect(() => {
    if (!isUnlimitedUser && watchTimeRemaining <= 0 && effectiveDuration > 0) {
      setIsLocked(true);
      plyrRef.current?.pause();
    }
  }, [watchTimeRemaining, isUnlimitedUser, effectiveDuration]);

  // Track play time - use refs to avoid dependency issues
  const isPlayingRef = useRef(isPlaying);
  const canPlayRef = useRef(canPlay);
  const playbackRateRef = useRef(playbackRate);
  
  useEffect(() => {
    isPlayingRef.current = isPlaying;
    canPlayRef.current = canPlay;
    playbackRateRef.current = playbackRate;
  }, [isPlaying, canPlay, playbackRate]);

  // Track play time - separate effect that only depends on isPlaying
  useEffect(() => {
    // Don't track for unlimited users
    if (isUnlimitedUser) {
      return;
    }

    if (isPlaying) {
      // Start the interval
      watchTimeInterval.current = setInterval(() => {
        // Check if we should still be tracking
        if (!isPlayingRef.current || !canPlayRef.current) {
          return;
        }

        // Multiply by playback rate so time passes faster at higher speeds
        const increment = playbackRateRef.current;

        setPlayState(prev => {
          const newTotal = (prev?.totalWatchTimeSeconds || 0) + increment;
          return {
            ...prev,
            totalWatchTimeSeconds: newTotal,
            sessionStartTime: prev?.sessionStartTime || new Date().toISOString(),
          };
        });
        
        playTimeTracker.current += increment;
        
        // Save every 5 seconds
        if (playTimeTracker.current >= 5) {
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
    }
  }, [isPlaying, isUnlimitedUser]); // saveProgress is stable now, don't need it as dep

  // Save remaining progress when component unmounts or video stops
  useEffect(() => {
    return () => {
      if (playTimeTracker.current > 0) {
        saveProgress(playTimeTracker.current);
        playTimeTracker.current = 0;
      }
    };
  }, [saveProgress]);

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

      plyr.on('enterfullscreen', () => setIsFullscreen(true));
      plyr.on('exitfullscreen', () => setIsFullscreen(false));
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
      // Pause and reset to beginning via Plyr
      if (plyrRef.current) {
        plyrRef.current.pause();
        plyrRef.current.currentTime = 0;
      }
      // Also reset directly on video element as backup
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
      setCurrentTime(0);
      currentTimeRef.current = 0;
      
      // Hide Plyr controls by adding a class to the container
      const container = containerRef.current;
      if (container) {
        container.classList.add('plyr-controls-hidden');
      }
    } else {
      // Show controls again when unlocked
      const container = containerRef.current;
      if (container) {
        container.classList.remove('plyr-controls-hidden');
      }
    }
  }, [showLockedOverlay]);

  return (
    <div className="w-full bg-black rounded-xl overflow-hidden border border-gray-800 relative">
      {/* Inject CSS to hide Plyr controls when locked */}
      <style dangerouslySetInnerHTML={{ __html: hiddenControlsStyle }} />
      
      {error && (
        <div className="bg-red-900/50 border-l-4 border-red-500 p-4">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 text-red-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-200">{error}</p>
          </div>
        </div>
      )}

      <div ref={containerRef} id={`video-container-${videoId}`} className="relative bg-black">
        {/* Video Element - Plyr adds custom controls */}
        <video
          ref={videoRef}
          className="w-full bg-black"
          disablePictureInPicture
          preload="auto"
          playsInline
        />

        {/* Locked State Overlay - shown when time runs out */}
        {showLockedOverlay && (
          <div className="absolute inset-0 z-[10000] bg-gray-900 flex items-center justify-center">
            {/* Solid background layer to completely cover video and controls */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"></div>
            <div className="relative max-w-md mx-auto text-center p-8">
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Límite de Tiempo Alcanzado</h3>
              <p className="text-gray-400 text-sm">
                Has usado todo tu tiempo disponible para este video 
                ({formatTime(maxWatchTimeSeconds)}). Contacta a tu profesor si necesitas más tiempo.
              </p>
            </div>
          </div>
        )}

        {/* Brand Watermark */}
        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-xs font-bold tracking-wider z-[9999] pointer-events-none">
          AKADEMO
        </div>

        {/* Student Watermark - appears periodically or on interaction */}
        {showWatermark && studentName && (
          plyrContainer 
            ? createPortal(
                <div className="absolute inset-0 flex items-center justify-center z-[20] pointer-events-none animate-fade-in">
                  <div className="bg-black/50 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-3 shadow-lg">
                    <div className="text-white/80 text-lg font-semibold tracking-wide text-center">{studentName}</div>
                    {studentEmail && (
                      <div className="text-white/60 text-xs font-medium mt-1 text-center">{studentEmail}</div>
                    )}
                  </div>
                </div>,
                plyrContainer
              )
            : (
                <div className="absolute inset-0 flex items-center justify-center z-[9999] pointer-events-none animate-fade-in">
                  <div className="bg-black/50 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-3 shadow-lg">
                    <div className="text-white/80 text-lg font-semibold tracking-wide text-center">{studentName}</div>
                    {studentEmail && (
                      <div className="text-white/60 text-xs font-medium mt-1 text-center">{studentEmail}</div>
                    )}
                  </div>
                </div>
              )
        )}

        {/* Loading/Transcoding Indicator - Full video size */}
        {isLoading && transcodingStatus !== 'processing' && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-40">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              <span className="text-white text-sm">Cargando video...</span>
            </div>
          </div>
        )}

        {/* Transcoding Status Indicator */}
        {transcodingStatus === 'processing' && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-40">
            <div className="flex flex-col items-center gap-4 max-w-md px-6" style={{ minHeight: '400px' }}>
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-white text-lg font-semibold mb-2">Video en proceso de transcodificación</h3>
                <p className="text-gray-400 text-sm mb-3">
                  El video se está procesando y optimizando para su reproducción.
                  Este proceso puede tardar unos minutos dependiendo de la duración del video.
                </p>
                <div className="flex items-center justify-center gap-2 text-blue-400 text-xs">
                  <div className="animate-pulse w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Actualizando automáticamente...</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Progress Stats Bar */}
      {!isUnlimitedUser && (
        <div className="bg-gray-900 px-4 py-2 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <span>Posición: {formatTime(currentTime)}</span>
            <span>Duración: {formatTime(videoDuration)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Tiempo visto: {formatTime(playState?.totalWatchTimeSeconds || 0)}</span>
            <span className="text-gray-600">|</span>
            <span className={watchTimeRemaining < 60 ? 'text-red-400' : ''}>
              Restante: {formatTime(watchTimeRemaining)}
            </span>
          </div>
        </div>
      )}

      {/* Plyr Custom Styles */}
      <style jsx global>{`
        .plyr {
          --plyr-color-main: #00b3ff;
          --plyr-video-background: #000;
          --plyr-menu-background: rgba(0,0,0,0.9);
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
        .plyr:-webkit-full-screen .plyr__controls {
          z-index: 10 !important;
        }
        .plyr:fullscreen .plyr__controls {
          z-index: 10 !important;
        }
      `}</style>
    </div>
  );
}
