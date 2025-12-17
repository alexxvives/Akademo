'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface LiveStreamPlayerProps {
  roomUrl: string;
  token: string;
  isOwner: boolean;
  userName: string;
  watermarkText?: string;
  onLeave?: () => void;
  onStreamEnd?: () => void;
}

declare global {
  interface Window {
    DailyIframe: any;
  }
}

export default function LiveStreamPlayer({
  roomUrl,
  token,
  isOwner,
  userName,
  watermarkText,
  onLeave,
  onStreamEnd,
}: LiveStreamPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callFrameRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInCall, setIsInCall] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  // Watermark position randomizer
  const [watermarkPos, setWatermarkPos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    // Randomize watermark position every 30 seconds
    const interval = setInterval(() => {
      setWatermarkPos({
        x: 10 + Math.random() * 80,
        y: 10 + Math.random() * 80,
      });
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDailyScript = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      if (window.DailyIframe) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@daily-co/daily-js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Daily.co script'));
      document.head.appendChild(script);
    });
  }, []);

  const initializeCall = useCallback(async () => {
    try {
      await loadDailyScript();

      if (!containerRef.current || callFrameRef.current) return;

      const callFrame = window.DailyIframe.createFrame(containerRef.current, {
        showLeaveButton: true,
        showFullscreenButton: true,
        showLocalVideo: isOwner,
        showParticipantsBar: isOwner,
        iframeStyle: {
          width: '100%',
          height: '100%',
          border: '0',
          borderRadius: '12px',
        },
      });

      callFrameRef.current = callFrame;

      // Event listeners
      callFrame.on('loaded', () => {
        setIsLoading(false);
      });

      callFrame.on('joined-meeting', () => {
        setIsInCall(true);
        setIsLoading(false);
      });

      callFrame.on('left-meeting', () => {
        setIsInCall(false);
        onLeave?.();
      });

      callFrame.on('participant-joined', () => {
        const participants = callFrame.participants();
        setParticipantCount(Object.keys(participants).length);
      });

      callFrame.on('participant-left', () => {
        const participants = callFrame.participants();
        setParticipantCount(Object.keys(participants).length);
      });

      callFrame.on('recording-started', () => {
        setIsRecording(true);
      });

      callFrame.on('recording-stopped', () => {
        setIsRecording(false);
      });

      callFrame.on('error', (e: any) => {
        console.error('Daily.co error:', e);
        setError(e.errorMsg || 'An error occurred');
        setIsLoading(false);
      });

      // Meeting ended by owner
      callFrame.on('meeting-session-state-updated', (event: any) => {
        if (event.meetingSessionState?.topology === 'none') {
          onStreamEnd?.();
        }
      });

      // Join the meeting
      await callFrame.join({
        url: roomUrl,
        token,
        userName,
      });

    } catch (err) {
      console.error('Error initializing call:', err);
      setError('Failed to initialize video call');
      setIsLoading(false);
    }
  }, [roomUrl, token, userName, isOwner, loadDailyScript, onLeave, onStreamEnd]);

  useEffect(() => {
    initializeCall();

    return () => {
      if (callFrameRef.current) {
        callFrameRef.current.destroy();
        callFrameRef.current = null;
      }
    };
  }, [initializeCall]);

  const startRecording = async () => {
    if (callFrameRef.current && isOwner) {
      try {
        await callFrameRef.current.startRecording();
      } catch (e) {
        console.error('Failed to start recording:', e);
      }
    }
  };

  const stopRecording = async () => {
    if (callFrameRef.current && isOwner) {
      try {
        await callFrameRef.current.stopRecording();
      } catch (e) {
        console.error('Failed to stop recording:', e);
      }
    }
  };

  const endMeeting = async () => {
    if (callFrameRef.current && isOwner) {
      try {
        if (isRecording) {
          await stopRecording();
        }
        await callFrameRef.current.leave();
        onStreamEnd?.();
      } catch (e) {
        console.error('Failed to end meeting:', e);
      }
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
        <p className="text-red-600 font-medium">Error: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Reload
        </button>
      </div>
    );
  }

  return (
    <div className="relative bg-gray-900 rounded-xl overflow-hidden">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-20">
          <div className="text-center text-white">
            <div className="w-8 h-8 border-2 border-gray-600 border-t-white rounded-full animate-spin mx-auto mb-4" />
            <p>Connecting to stream...</p>
          </div>
        </div>
      )}

      {/* Video container */}
      <div 
        ref={containerRef} 
        className="w-full aspect-video"
        style={{ minHeight: '400px' }}
      />

      {/* Watermark overlay (for students) */}
      {watermarkText && !isOwner && isInCall && (
        <div 
          className="absolute pointer-events-none z-10 transition-all duration-1000"
          style={{
            left: `${watermarkPos.x}%`,
            top: `${watermarkPos.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <span className="text-white/40 text-sm font-medium select-none">
            {watermarkText}
          </span>
        </div>
      )}

      {/* Owner controls */}
      {isOwner && isInCall && (
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <span className="bg-black/60 text-white px-3 py-1.5 rounded-lg text-sm">
              {participantCount} viewer{participantCount !== 1 ? 's' : ''}
            </span>
            {isRecording && (
              <span className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                Recording
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Start Recording
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Stop Recording
              </button>
            )}
            <button
              onClick={endMeeting}
              className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              End Stream
            </button>
          </div>
        </div>
      )}

      {/* Live indicator */}
      {isInCall && (
        <div className="absolute top-4 left-4 z-10">
          <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            LIVE
          </span>
        </div>
      )}
    </div>
  );
}
