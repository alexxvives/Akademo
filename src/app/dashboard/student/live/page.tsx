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

// Zoom SDK internal render size - this is what Zoom actually renders at
const ZOOM_INTERNAL_WIDTH = 1000;
const ZOOM_INTERNAL_HEIGHT = 600;

// Our container size for normal view
const CONTAINER_WIDTH = 1200;
const CONTAINER_HEIGHT = 700;

export default function StudentLivePage() {
  const [activeStreams, setActiveStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showWatermark, setShowWatermark] = useState(false);
  const [userInfo, setUserInfo] = useState<{ firstName: string; lastName: string; email: string } | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const clientRef = useRef<any>(null);
  const initStarted = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const watermarkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate scale to fit Zoom content within container
  const calculateScale = useCallback((containerW: number, containerH: number) => {
    const scaleX = containerW / ZOOM_INTERNAL_WIDTH;
    const scaleY = containerH / ZOOM_INTERNAL_HEIGHT;
    // Use the smaller scale to ensure everything fits
    return Math.min(scaleX, scaleY, 2); // Cap at 2x max
  }, []);

  useEffect(() => {
    loadActiveStreams();
    const interval = setInterval(loadActiveStreams, 5000);
    return () => {
      clearInterval(interval);
      if (watermarkIntervalRef.current) {
        clearInterval(watermarkIntervalRef.current);
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

  // Start watermark interval when joined
  useEffect(() => {
    if (joined && userInfo) {
      // Show watermark immediately
      setShowWatermark(true);
      setTimeout(() => setShowWatermark(false), 5000);

      // Then every 5 minutes
      watermarkIntervalRef.current = setInterval(() => {
        setShowWatermark(true);
        setTimeout(() => setShowWatermark(false), 5000);
      }, 5 * 60 * 1000); // 5 minutes

      return () => {
        if (watermarkIntervalRef.current) {
          clearInterval(watermarkIntervalRef.current);
        }
      };
    }
  }, [joined, userInfo]);

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

      // Get user info
      const userResponse = await apiClient('/auth/me');
      const userResult = await userResponse.json();
      
      if (!userResult.success) {
        throw new Error('Failed to get user info');
      }

      const user = userResult.data;
      const userName = `${user.firstName} ${user.lastName}`;
      const userEmail = user.email;

      // Store user info for watermark
      setUserInfo({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      });

      // Get signature
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

      // Import Zoom SDK
      const ZoomMtgEmbedded = await import('@zoom/meetingsdk/embedded');
      const client = ZoomMtgEmbedded.default.createClient();
      clientRef.current = client;

      const meetingSDKElement = document.getElementById('meetingSDKElement');
      if (!meetingSDKElement) {
        throw new Error('Meeting container element not found');
      }
      
      // Show container FIRST
      setJoined(true);
      
      // Wait for DOM to update
      await new Promise(resolve => setTimeout(resolve, 100));

      // Initialize Zoom SDK with fixed internal size
      // We'll use CSS transform to scale this to fit our container
      const initConfig = {
        zoomAppRoot: meetingSDKElement,
        language: 'es-ES' as const,
        patchJsMedia: true,
        leaveOnPageUnload: true,
        customize: {
          video: {
            isResizable: false,
            popper: {
              disableDraggable: true
            },
            viewSizes: {
              default: {
                width: ZOOM_INTERNAL_WIDTH,
                height: ZOOM_INTERNAL_HEIGHT
              },
              ribbon: {
                width: 300,
                height: ZOOM_INTERNAL_HEIGHT
              }
            }
          }
        }
      };
      console.log('[Join Meeting] Initializing Zoom SDK with internal size:', ZOOM_INTERNAL_WIDTH, 'x', ZOOM_INTERNAL_HEIGHT);
      
      try {
        await client.init(initConfig);
        console.log('[Join Meeting] ✅ Zoom SDK initialized');
      } catch (initError) {
        console.error('[Join Meeting] ❌ Init failed:', initError);
        throw initError;
      }

      // Join the meeting
      console.log('[Join Meeting] Joining meeting...');
      
      await client.join({
        signature,
        meetingNumber: stream.zoomMeetingId,
        password: stream.zoomPassword || '',
        userName: userName,
        userEmail: userEmail,
      });

      console.log('[Join Meeting] ✅ Successfully joined meeting!');
      
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
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  // Listen for fullscreen changes and recalculate scale
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);
      
      // Calculate new scale based on container size
      if (isNowFullscreen) {
        const scale = calculateScale(window.innerWidth, window.innerHeight);
        setZoomScale(scale);
        console.log('[Zoom] Fullscreen scale:', scale);
      } else {
        const scale = calculateScale(CONTAINER_WIDTH, CONTAINER_HEIGHT);
        setZoomScale(scale);
        console.log('[Zoom] Normal scale:', scale);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    // Set initial scale
    const initialScale = calculateScale(CONTAINER_WIDTH, CONTAINER_HEIGHT);
    setZoomScale(initialScale);
    
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [calculateScale]);

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
    <div className="relative">
      {/* Stream Container */}
      <div 
        ref={containerRef}
        className="relative bg-black rounded-lg mx-auto overflow-hidden"
        style={{ 
          width: isFullscreen ? '100vw' : `${CONTAINER_WIDTH}px`, 
          height: isFullscreen ? '100vh' : `${CONTAINER_HEIGHT}px`, 
          maxWidth: isFullscreen ? '100vw' : '100%',
        }}
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

        {/* Zoom Meeting Container - Fixed internal size, scaled with CSS transform */}
        <div 
          id="meetingSDKElement"
          className={joined ? 'block' : 'hidden'}
          style={{ 
            width: `${ZOOM_INTERNAL_WIDTH}px`,
            height: `${ZOOM_INTERNAL_HEIGHT}px`,
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${zoomScale})`,
            transformOrigin: 'center center',
            backgroundColor: '#000',
          }}
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

        {/* Watermark Overlay */}
        {showWatermark && userInfo && (
          <div className="absolute inset-0 pointer-events-none z-40 flex items-center justify-center">
            <div className="bg-black/30 backdrop-blur-sm px-8 py-4 rounded-lg border border-white/20">
              <p className="text-white text-2xl font-semibold">
                {userInfo.firstName} {userInfo.lastName}
              </p>
              <p className="text-white/80 text-sm text-center mt-1">
                {userInfo.email}
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* CSS for Zoom SDK - minimal overrides, let transform handle sizing */}
      <style jsx global>{`
        /* Hide the standalone Zoom root that appears outside our container */
        #zmmtg-root {
          display: none !important;
        }
        
        /* Ensure Zoom SDK content doesn't overflow its container */
        #meetingSDKElement {
          overflow: visible !important;
        }
        
        /* Keep Zoom content at fixed size - we scale the container */
        #meetingSDKElement > div {
          position: relative !important;
          width: ${ZOOM_INTERNAL_WIDTH}px !important;
          height: ${ZOOM_INTERNAL_HEIGHT}px !important;
        }
      `}</style>
    </div>
  );
}
