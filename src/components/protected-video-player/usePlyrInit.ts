'use client';

import { useEffect, MutableRefObject, Dispatch, SetStateAction } from 'react';
import Hls from 'hls.js';
import type { PlyrInstance, CompletionFlags } from './types';
import { bindPlyrEvents } from './plyr-events';

const HLS_CONFIG = {
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
} as const;

const PLYR_OPTIONS = {
  controls: [
    'play-large', 'play', 'progress', 'current-time', 'duration',
    'mute', 'volume', 'settings', 'fullscreen',
  ],
  settings: ['quality', 'speed'] as ('quality' | 'speed')[],
  speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] },
  keyboard: { focused: true, global: false },
  tooltips: { controls: true, seek: true },
  captions: { active: false, update: true },
  ratio: '16:9',
  fullscreen: { enabled: true, fallback: true, iosNative: false },
  clickToPlay: true,
  disableContextMenu: true,
  hideControls: true,
  resetOnEnd: false,
  invertTime: false,
  toggleInvert: false,
};

interface UsePlyrInitParams {
  videoRef: MutableRefObject<HTMLVideoElement | null>;
  containerRef: MutableRefObject<HTMLDivElement | null>;
  plyrRef: MutableRefObject<PlyrInstance | null>;
  hlsRef: MutableRefObject<Hls | null>;
  isPlayingRef: MutableRefObject<boolean>;
  currentTimeRef: MutableRefObject<number>;
  completionFlagsRef: MutableRefObject<CompletionFlags>;
  videoUrl: string;
  hlsUrl?: string;
  signedHlsUrl: string | null;
  bunnyGuid?: string;
  canPlay: boolean;
  isLocked: boolean;
  isPlaying: boolean;
  isUnlimitedUser: boolean;
  videoDuration: number;
  durationSeconds: number;
  videoId: string;
  initialLastPosition?: number;
  triggerWatermark: () => void;
  setIsPlaying: Dispatch<SetStateAction<boolean>>;
  setCurrentTime: Dispatch<SetStateAction<number>>;
  setPlaybackRate: Dispatch<SetStateAction<number>>;
  setIsLocked: Dispatch<SetStateAction<boolean>>;
  setVideoDuration: Dispatch<SetStateAction<number>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  setPlyrContainer: Dispatch<SetStateAction<HTMLElement | null>>;
  setError: Dispatch<SetStateAction<string | null>>;
}

export function usePlyrInit(p: UsePlyrInitParams) {
  useEffect(() => {
    const video = p.videoRef.current;
    const container = p.containerRef.current;
    if (!video || !container) return;

    // For Bunny videos, wait for the signed URL to be fetched
    if (p.bunnyGuid && !p.signedHlsUrl) {
      p.setIsLoading(true);
      return;
    }

    // Use signed URL for Bunny, or fallback to provided hlsUrl or videoUrl
    const videoSrc = p.signedHlsUrl || p.hlsUrl || p.videoUrl;
    if (!videoSrc) {
      p.setError('No video source provided');
      p.setIsLoading(false);
      return;
    }

    const isHls = videoSrc.includes('.m3u8');
    let plyrInstance: PlyrInstance | null = null;

    const initPlyr = async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const PlyrClass = (await import('plyr')).default || require('plyr');
      const plyr = new PlyrClass(video, PLYR_OPTIONS);

      plyrInstance = plyr;
      p.plyrRef.current = plyr;

      bindPlyrEvents({
        plyr,
        canPlay: p.canPlay,
        isLocked: p.isLocked,
        isPlaying: p.isPlaying,
        isUnlimitedUser: p.isUnlimitedUser,
        videoDuration: p.videoDuration,
        durationSeconds: p.durationSeconds,
        videoId: p.videoId,
        initialLastPosition: p.initialLastPosition,
        isPlayingRef: p.isPlayingRef,
        currentTimeRef: p.currentTimeRef,
        completionFlagsRef: p.completionFlagsRef,
        setIsPlaying: p.setIsPlaying,
        setCurrentTime: p.setCurrentTime,
        setPlaybackRate: p.setPlaybackRate,
        setIsLocked: p.setIsLocked,
        setVideoDuration: p.setVideoDuration,
        setIsLoading: p.setIsLoading,
        setPlyrContainer: p.setPlyrContainer,
        triggerWatermark: p.triggerWatermark,
      });

      // Initialize HLS if needed
      if (isHls) {
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // Safari supports HLS natively
          video.src = videoSrc;
          p.setIsLoading(false);
        } else if (Hls.isSupported()) {
          const hls = new Hls(HLS_CONFIG);
          hls.loadSource(videoSrc);
          hls.attachMedia(video);

          hls.on(Hls.Events.MANIFEST_PARSED, () => p.setIsLoading(false));

          hls.on(Hls.Events.ERROR, (_, data) => {
            if (!data.fatal) return;
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              if (data.response?.code === 403) {
                p.setError(
                  'Error 403: El video requiere configuración de seguridad. Por favor habilita "Direct Play" en Bunny Stream → Library → Security.'
                );
              } else {
                p.setError('Error de red al cargar el video. Verifica tu conexión.');
              }
            } else {
              p.setError('Error al cargar el stream de video.');
            }
            p.setIsLoading(false);
          });

          p.hlsRef.current = hls;
        } else {
          p.setError('Your browser does not support HLS video playback');
          p.setIsLoading(false);
        }
      } else {
        // Regular video file
        video.src = videoSrc;
        p.setIsLoading(false);
      }
    };

    initPlyr();

    return () => {
      if (plyrInstance) plyrInstance.destroy();
      p.plyrRef.current = null;
      if (p.hlsRef.current) {
        p.hlsRef.current.destroy();
        p.hlsRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.hlsUrl, p.videoUrl, p.signedHlsUrl, p.bunnyGuid, p.triggerWatermark]);
}
