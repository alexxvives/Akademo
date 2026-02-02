'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api-client';
import { WatermarkOverlay } from '@/components/video/WatermarkOverlay';
import dynamic from 'next/dynamic';

// Dynamically import ZoomEmbedStudent to avoid SSR issues (now default export)
const ZoomEmbedStudent = dynamic(() => import('@/components/live/ZoomEmbedStudent'), { ssr: false });

interface LiveStream {
  id: string;
  classId: string;
  className: string;
  teacherName: string;
  title: string;
  zoomLink: string;
  zoomMeetingId: string;
  status: 'scheduled' | 'active' | 'LIVE';
  startedAt: string;
}

interface UserSession {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export default function StudentLivePage() {
  const renderCount = useRef(0);
  renderCount.current++;
  console.log('[StudentLivePage] RENDER #' + renderCount.current);
  
  const [activeStreams, setActiveStreams] = useState<LiveStream[]>([]);
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWatermark, setShowWatermark] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [zoomSignature, setZoomSignature] = useState('');
  const watermarkInterval = useRef<NodeJS.Timeout | null>(null);
  const watermarkDisplay = useRef<NodeJS.Timeout | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const autoJoinedRef = useRef(false); // Track if we've already auto-joined
  
  // Log all state changes
  useEffect(() => {
    console.log('[StudentLivePage] State update:', {
      activeStreamsCount: activeStreams.length,
      hasSelectedStream: !!selectedStream,
      loading,
      hasSignature: !!zoomSignature,
      studentName,
      studentEmail,
    });
  });

  // Define all functions FIRST
  const triggerWatermark = useCallback(() => {
    setShowWatermark(true);
    // Hide after 5 seconds
    watermarkDisplay.current = setTimeout(() => {
      setShowWatermark(false);
    }, 5000);
  }, []);

  const loadUserInfo = async () => {
    try {
      const res = await apiClient('/auth/me');
      const result = await res.json();
      if (result.success && result.data) {
        const user: UserSession = result.data;
        setStudentName(`${user.firstName} ${user.lastName}`);
        setStudentEmail(user.email);
      }
    } catch (error) {
      console.error('Failed to load user info:', error);
    }
  };

  const loadActiveStreams = async () => {
    try {
      const res = await apiClient('/explore/my-live-streams');
      const result = await res.json();
      if (result.success && result.data) {
        // Only update state if data actually changed (prevent unnecessary re-renders)
        const newStreams = result.data || [];
        setActiveStreams(prev => {
          const prevIds = prev.map(s => s.id).join(',');
          const newIds = newStreams.map((s: LiveStream) => s.id).join(',');
          if (prevIds === newIds) {
            console.log('[StudentLivePage] Streams unchanged, skipping state update');
            return prev; // Same reference = no re-render
          }
          console.log('[StudentLivePage] Streams changed:', prevIds, '->', newIds);
          return newStreams;
        });
      }
    } catch (error) {
      console.error('Failed to load active streams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinStream = useCallback(async (stream: LiveStream) => {
    console.log('[handleJoinStream] Starting join process for stream:', stream);
    setSelectedStream(stream);
    
    // Generate Zoom signature
    try {
      console.log('[handleJoinStream] Requesting signature for meeting:', stream.zoomMeetingId);
      const res = await apiClient('/zoom/signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingNumber: stream.zoomMeetingId,
          role: 0, // 0 = participant
        }),
      });
      const result = await res.json();
      console.log('[handleJoinStream] Signature response:', result);
      if (result.success) {
        console.log('[handleJoinStream] Setting signature:', result.data.signature);
        setZoomSignature(result.data.signature);
      } else {
        console.error('[handleJoinStream] Failed to get signature:', result);
      }
    } catch (error) {
      console.error('Failed to get Zoom signature:', error);
    }
    
    // Start watermark interval (every 5 minutes)
    triggerWatermark();
    watermarkInterval.current = setInterval(triggerWatermark, 5 * 60 * 1000);
  }, [triggerWatermark]);

  const handleLeaveStream = () => {
    setSelectedStream(null);
    setShowWatermark(false);
    if (watermarkInterval.current) {
      clearInterval(watermarkInterval.current);
      watermarkInterval.current = null;
    }
    if (watermarkDisplay.current) {
      clearTimeout(watermarkDisplay.current);
      watermarkDisplay.current = null;
    }
  };

  // Track if polling is needed (stop when we have a selected stream)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadDone = useRef(false);

  // Initial load - only runs ONCE on mount
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;
    
    console.log('[StudentLivePage] Initial load - fetching user info and streams');
    loadUserInfo();
    loadActiveStreams();
    
    return () => {
      if (watermarkInterval.current) clearInterval(watermarkInterval.current);
      if (watermarkDisplay.current) clearTimeout(watermarkDisplay.current);
    };
  }, []);

  // Polling control - separate effect to start/stop polling
  useEffect(() => {
    // Clear any existing interval first
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    // Only poll if NO stream is selected
    if (!selectedStream) {
      console.log('[StudentLivePage] Starting polling (no stream selected)');
      pollingIntervalRef.current = setInterval(loadActiveStreams, 5000);
    } else {
      console.log('[StudentLivePage] Stopping polling (stream selected)');
    }
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [selectedStream]); // Only re-run when selectedStream changes

  // Auto-join when first active stream becomes available
  useEffect(() => {
    if (activeStreams.length > 0 && !selectedStream && !autoJoinedRef.current) {
      // Only auto-join if there's an active stream (not just scheduled)
      const activeStream = activeStreams.find(s => s.status === 'active' || s.status === 'LIVE');
      if (activeStream) {
        console.log('[Auto-join] Initiating auto-join for stream:', activeStream.id);
        autoJoinedRef.current = true;
        handleJoinStream(activeStream);
      }
    }
  }, [activeStreams, selectedStream, handleJoinStream]);

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Video Container with Fixed Height */}
        <div className="flex flex-col bg-black rounded-xl overflow-hidden shadow-2xl" style={{ height: '700px' }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4 flex items-center justify-between border-b border-gray-700">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <h1 className="text-lg font-bold text-white">AKADEMO Live Stream</h1>
            </div>
            {selectedStream && (
              <button
                onClick={handleLeaveStream}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Salir de clase
              </button>
            )}
          </div>

          {/* Main Video Area */}
          <div className="flex-1 relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-400">Cargando...</p>
                </div>
              </div>
            ) : selectedStream && zoomSignature ? (
              /* Active Stream - Embedded Zoom */
              <ZoomEmbedStudent
                meetingNumber={selectedStream.zoomMeetingId}
                userName={studentName}
                userEmail={studentEmail}
                signature={zoomSignature}
                zoomLink={selectedStream.zoomLink}
              />
            ) : activeStreams.length > 0 && (activeStreams[0].status === 'active' || activeStreams[0].status === 'LIVE') ? (
              /* Stream Available - Show Join Prompt */
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10"/>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    🔴 Clase en Vivo
                  </h3>
                  <p className="text-xl text-gray-300 mb-2">{activeStreams[0].className}</p>
                  <p className="text-gray-400 mb-6">Profesor: {activeStreams[0].teacherName}</p>
                  <button
                    onClick={() => handleJoinStream(activeStreams[0])}
                    className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
                  >
                    Unirse Ahora
                  </button>
                </div>
              </div>
            ) : (
              /* No Stream - OFF State */
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center max-w-lg">
                  <div className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-gray-700">
                    <svg className="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-400 mb-4">
                    Transmisión Apagada
                  </h3>
                  <p className="text-gray-500 text-lg">
                    Esperando a que tu profesor inicie una clase en vivo...
                  </p>
                  {activeStreams.length > 0 && (
                    <div className="mt-6 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                      <p className="text-blue-400 text-sm">📅 Próxima clase programada:</p>
                      <p className="text-white font-semibold">{activeStreams[0].className}</p>
                      <p className="text-gray-400 text-sm">Esperando inicio...</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Status Bar */}
          <div className="bg-gray-900 px-6 py-3 flex items-center justify-between border-t border-gray-700">
            <div className="flex items-center gap-4">
              {selectedStream ? (
                <>
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-red-500 text-white animate-pulse">
                    🔴 EN VIVO
                  </span>
                  <span className="text-sm text-gray-400">{selectedStream.className}</span>
                </>
              ) : activeStreams.length > 0 && (activeStreams[0].status === 'active' || activeStreams[0].status === 'LIVE') ? (
                <>
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-red-500 text-white animate-pulse">
                    🔴 CLASE DISPONIBLE
                  </span>
                  <span className="text-sm text-gray-400">Haz clic en "Unirse Ahora"</span>
                </>
              ) : activeStreams.length > 0 ? (
                <>
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-blue-500 text-white">
                    📅 PROGRAMADA
                  </span>
                  <span className="text-sm text-gray-400">Esperando inicio...</span>
                </>
              ) : (
                <>
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-gray-700 text-gray-400">
                    ⚫ SIN TRANSMISIÓN
                  </span>
                  <span className="text-sm text-gray-500">No hay clases activas</span>
                </>
              )}
            </div>
            <div className="text-xs text-gray-500">
              Actualización automática cada 5 segundos
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
