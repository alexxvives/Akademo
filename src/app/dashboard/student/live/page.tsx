'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

interface LiveStream {
  id: string;
  classId: string;
  className: string;
  teacherName: string;
  zoomMeetingId: string;
  zoomPassword?: string;
  status: 'scheduled' | 'active' | 'LIVE';
}

// Initial Zoom window size - students can resize/drag from here
const INITIAL_WIDTH = 960;
const INITIAL_HEIGHT = 540;

export default function StudentLivePage() {
  const [activeStreams, setActiveStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showWatermark, setShowWatermark] = useState(false);
  const [userInfo, setUserInfo] = useState<{ firstName: string; lastName: string; email: string } | null>(null);
  const [zoomPosition, setZoomPosition] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const clientRef = useRef<any>(null);
  const initStarted = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const watermarkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);

  // Track Zoom window position for watermark overlay
  const trackZoomWindow = useCallback(() => {
    const zoomVideo = document.querySelector('[class*="react-draggable"]') as HTMLElement;
    if (zoomVideo) {
      const rect = zoomVideo.getBoundingClientRect();
      setZoomPosition({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      });
    }
  }, []);

  useEffect(() => {
    loadActiveStreams();
    const interval = setInterval(loadActiveStreams, 5000);
    return () => {
      clearInterval(interval);
      if (watermarkIntervalRef.current) {
        clearInterval(watermarkIntervalRef.current);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (activeStreams.length > 0 && !joined && !initStarted.current) {
      const activeStream = activeStreams.find(s => s.status === 'active' || s.status === 'LIVE');
      if (activeStream) {
        initStarted.current = true;
        joinMeeting(activeStream);
      }
    }
  }, [activeStreams, joined]);

  // Start watermark interval and position tracking when joined
  useEffect(() => {
    if (joined && userInfo) {
      setShowWatermark(true);
      setTimeout(() => setShowWatermark(false), 5000);

      watermarkIntervalRef.current = setInterval(() => {
        setShowWatermark(true);
        setTimeout(() => setShowWatermark(false), 5000);
      }, 5 * 60 * 1000);

      // Track Zoom window position continuously
      const trackInterval = setInterval(trackZoomWindow, 100);

      // Also observe DOM changes to catch resize/drag
      observerRef.current = new MutationObserver(trackZoomWindow);
      const meetingElement = document.getElementById('meetingSDKElement');
      if (meetingElement) {
        observerRef.current.observe(meetingElement, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['style', 'class']
        });
      }

      return () => {
        if (watermarkIntervalRef.current) {
          clearInterval(watermarkIntervalRef.current);
        }
        clearInterval(trackInterval);
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
      };
    }
  }, [joined, userInfo, trackZoomWindow]);

  async function loadActiveStreams() {
    try {
      const response = await apiClient('/live/active');
      const result = await response.json();
      if (result.success && result.data) {
        setActiveStreams(result.data);
      }
    } catch (err) {
      console.error('Error loading streams:', err);
    } finally {
      setLoading(false);
    }
  }

  async function joinMeeting(stream: LiveStream) {
    try {
      console.log('[Join Meeting] Starting join process for stream:', stream.id);

      const userResponse = await apiClient('/auth/me');
      const userResult = await userResponse.json();
      
      if (!userResult.success) {
        throw new Error('Failed to get user info');
      }

      const user = userResult.data;
      const userName = `${user.firstName} ${user.lastName}`;
      const userEmail = user.email;

      setUserInfo({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      });

      const sigResponse = await apiClient('/zoom/signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          meetingNumber: stream.zoomMeetingId,
          role: 0
        })
      });
      
      if (!sigResponse.ok) {
        throw new Error(`Failed to get signature: ${sigResponse.status}`);
      }

      const sigResult = await sigResponse.json();
      
      if (!sigResult.success || !sigResult.data) {
        throw new Error('Invalid signature response');
      }

      const { signature } = sigResult.data;

      const ZoomMtgEmbedded = await import('@zoom/meetingsdk/embedded');
      const client = ZoomMtgEmbedded.default.createClient();
      clientRef.current = client;

      const meetingSDKElement = document.getElementById('meetingSDKElement');
      if (!meetingSDKElement) {
        throw new Error('Meeting container element not found');
      }
      
      setJoined(true);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Configure with larger initial size, draggable and resizable
      const initConfig = {
        zoomAppRoot: meetingSDKElement,
        language: 'es-ES' as const,
        patchJsMedia: true,
        leaveOnPageUnload: true,
        customize: {
          video: {
            isResizable: true, // Allow student to resize
            popper: {
              disableDraggable: false // Allow dragging
            },
            viewSizes: {
              default: {
                width: INITIAL_WIDTH,
                height: INITIAL_HEIGHT
              },
              ribbon: {
                width: 300,
                height: 500
              }
            }
          }
        }
      };
      
      console.log('[Join Meeting] Initializing Zoom SDK with initial size:', INITIAL_WIDTH, 'x', INITIAL_HEIGHT);
      
      await client.init(initConfig);
      console.log('[Join Meeting] ✅ Zoom SDK initialized');

      await client.join({
        signature,
        meetingNumber: stream.zoomMeetingId,
        password: stream.zoomPassword || '',
        userName: userName,
        userEmail: userEmail,
      });

      console.log('[Join Meeting] ✅ Successfully joined meeting!');
      
      // Initial position tracking
      setTimeout(trackZoomWindow, 500);
      
    } catch (error: any) {
      console.error('[Join Meeting] ❌ ERROR:', error);
      alert(`Error al unirse a la clase: ${error.message}`);
      initStarted.current = false;
      setJoined(false);
    }
  }

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  // Handle fullscreen changes - Zoom is already at max size (1440x720)
  // In fullscreen, we just center the Zoom container on a black background
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '600px' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando transmisión en vivo...</p>
        </div>
      </div>
    );
  }

  const activeStream = activeStreams.find(s => s.status === 'active' || s.status === 'LIVE');

  return (
    <div className="relative w-screen h-screen bg-gray-900">
      {/* Stream Container - Full screen to allow Zoom dragging anywhere */}
      <div 
        ref={containerRef}
        id="zoom-sdk-container"
        className="relative w-full h-full bg-gray-900"
      >
        {/* No Stream UI */}
        {!joined && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-lg">
            <div className="text-center px-6">
              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 bg-blue-500/10 rounded-full animate-pulse"></div>
                </div>
                <div className="relative flex items-center justify-center">
                  <svg className="w-16 h-16 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="2" strokeWidth="2"/>
                    <circle cx="12" cy="12" r="6" strokeWidth="2"/>
                    <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                  </svg>
                </div>
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-4">
                {activeStream ? 'Conectando...' : 'Transmisión Apagada'}
              </h2>
              
              {activeStream ? (
                <div className="space-y-2">
                  <p className="text-gray-300 text-lg">{activeStream.className}</p>
                  <p className="text-gray-400">Profesor: {activeStream.teacherName}</p>
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-500 text-sm font-medium">EN VIVO</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-gray-400 text-lg">No hay clases en vivo en este momento</p>
                  <p className="text-gray-500 text-sm">Esperando a que tu profesor inicie una transmisión...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Zoom Meeting Container - Full screen for dragging */}
        <div 
          id="meetingSDKElement"
          className={joined ? 'absolute inset-0' : 'hidden'}
          style={{ backgroundColor: 'transparent' }}
        />

        {/* Fullscreen Button */}
        {joined && (
          <button
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white p-3 rounded-lg transition-all duration-200 backdrop-blur-sm"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Tracking Watermark - Follows Zoom window position */}
      {showWatermark && userInfo && zoomPosition && (
        <div 
          className="fixed pointer-events-none z-[9999] flex items-center justify-center"
          style={{
            top: zoomPosition.top,
            left: zoomPosition.left,
            width: zoomPosition.width,
            height: zoomPosition.height,
          }}
        >
          <div className="bg-black/40 backdrop-blur-sm px-6 py-3 rounded-lg border border-white/20 shadow-2xl">
            <p className="text-white text-xl font-semibold">
              {userInfo.firstName} {userInfo.lastName}
            </p>
            <p className="text-white/80 text-sm text-center mt-1">
              {userInfo.email}
            </p>
          </div>
        </div>
      )}
      
      {/* CSS for Zoom SDK - ensure dragging works */}
      <style jsx global>{`
        #zmmtg-root {
          display: none !important;
        }
        /* Ensure Zoom draggable elements work properly */
        .react-draggable {
          cursor: move !important;
        }
        /* Make sure Zoom video container is visible and interactive */
        #meetingSDKElement > div {
          position: relative !important;
        }
        /* Remove any overflow constraints */
        #zoom-sdk-container {
          overflow: visible !important;
        }
      `}</style>
    </div>
  );
}
