'use client';

import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { WatermarkOverlay } from '@/components/video/WatermarkOverlay';
import ZoomMtgEmbedded from '@zoom/meetingsdk/embedded';

interface ZoomEmbedStudentProps {
  meetingNumber: string;
  password?: string;
  userName: string;
  userEmail: string;
  signature: string;
  zoomLink?: string;
}

const ZoomEmbedStudentComponent = function ZoomEmbedStudent({
  meetingNumber,
  password,
  userName,
  userEmail,
  signature,
  zoomLink,
}: ZoomEmbedStudentProps) {
  const renderCount = useRef(0);
  renderCount.current++;
  
  console.log('[ZoomEmbedStudent] RENDER #' + renderCount.current + ' - Props:', {
    meetingNumber,
    userName,
    userEmail,
    hasSignature: !!signature,
    signatureLength: signature?.length,
  });
  
  const meetingContainerRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<ReturnType<typeof ZoomMtgEmbedded.createClient> | null>(null);
  const [showWatermark, setShowWatermark] = useState(false);
  const [joinComplete, setJoinComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watermarkInterval = useRef<NodeJS.Timeout | null>(null);
  const watermarkDisplay = useRef<NodeJS.Timeout | null>(null);
  const joinInitiated = useRef(false);

  // Watermark logic
  const triggerWatermark = useCallback(() => {
    setShowWatermark(true);
    watermarkDisplay.current = setTimeout(() => {
      setShowWatermark(false);
    }, 5000);
  }, []);

  // Setup watermark interval when joined
  useEffect(() => {
    if (!joinComplete) return;
    
    // Initial watermark after 10 seconds
    const initialTimeout = setTimeout(() => {
      triggerWatermark();
    }, 10000);
    
    // Random interval watermarks (every 2-5 minutes)
    watermarkInterval.current = setInterval(() => {
      const randomDelay = Math.random() * 180000 + 120000; // 2-5 min
      setTimeout(triggerWatermark, randomDelay);
    }, 300000);

    return () => {
      clearTimeout(initialTimeout);
      if (watermarkInterval.current) clearInterval(watermarkInterval.current);
      if (watermarkDisplay.current) clearTimeout(watermarkDisplay.current);
    };
  }, [joinComplete, triggerWatermark]);

  // Main effect: Initialize and join meeting
  useEffect(() => {
    if (!signature || !meetingNumber || !meetingContainerRef.current) {
      console.log('[ZoomEmbedStudent] Missing requirements:', { 
        hasSignature: !!signature, 
        hasMeetingNumber: !!meetingNumber,
        hasContainer: !!meetingContainerRef.current 
      });
      return;
    }

    if (joinInitiated.current) {
      console.log('[ZoomEmbedStudent] Join already initiated, skipping');
      return;
    }

    joinInitiated.current = true;
    console.log('[ZoomEmbedStudent] Starting Zoom Meeting SDK (Component View)...');

    const initAndJoin = async () => {
      try {
        // Create the Zoom client
        const client = ZoomMtgEmbedded.createClient();
        clientRef.current = client;
        console.log('[ZoomEmbedStudent] Client created');

        // Initialize the client with our container
        await client.init({
          zoomAppRoot: meetingContainerRef.current!,
          language: 'es-ES',
          patchJsMedia: true,
          customize: {
            video: {
              isResizable: true,
              viewSizes: {
                default: {
                  width: 1000,
                  height: 600,
                },
              },
            },
            meetingInfo: ['topic', 'host', 'participant', 'dc'],
          },
        });
        console.log('[ZoomEmbedStudent] Client initialized');

        // Join the meeting
        const sdkKey = process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID;
        if (!sdkKey) {
          throw new Error('ZOOM_CLIENT_ID not configured');
        }

        console.log('[ZoomEmbedStudent] Joining meeting:', {
          meetingNumber,
          userName,
          userEmail,
          hasPassword: !!password,
        });

        await client.join({
          sdkKey: sdkKey,
          signature: signature,
          meetingNumber: meetingNumber,
          password: password || '',
          userName: userName,
          userEmail: userEmail,
          tk: '', // tracking id (optional)
          zak: '', // host key (not needed for attendees)
        });

        console.log('[ZoomEmbedStudent] ✅ Successfully joined meeting!');
        setJoinComplete(true);

        // Listen for meeting events
        client.on('connection-change', (payload: { state: string }) => {
          console.log('[ZoomEmbedStudent] Connection changed:', payload);
          if (payload.state === 'Connected') {
            console.log('[ZoomEmbedStudent] 🎉 Fully connected to meeting!');
          }
        });

        client.on('user-added', (payload: unknown) => {
          console.log('[ZoomEmbedStudent] User added:', payload);
        });

        client.on('user-removed', (payload: unknown) => {
          console.log('[ZoomEmbedStudent] User removed:', payload);
        });

        client.on('user-updated', (payload: unknown) => {
          console.log('[ZoomEmbedStudent] User updated:', payload);
        });

      } catch (err) {
        console.error('[ZoomEmbedStudent] ❌ Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to join meeting');
        joinInitiated.current = false; // Allow retry
      }
    };

    initAndJoin();

    // Cleanup on unmount
    return () => {
      if (clientRef.current) {
        try {
          console.log('[ZoomEmbedStudent] Leaving meeting...');
          clientRef.current.leaveMeeting();
        } catch (e) {
          console.log('[ZoomEmbedStudent] Leave error (may be expected):', e);
        }
      }
    };
  }, [signature, meetingNumber, password, userName, userEmail]);

  // Loading state
  if (!signature) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Generando credenciales...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
        <div className="text-center max-w-md p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Error al unirse</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              joinInitiated.current = false;
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
          {zoomLink && (
            <a
              href={zoomLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-4 text-blue-400 hover:underline"
            >
              Abrir en Zoom directamente
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[600px] bg-gray-900">
      {/* Zoom Meeting Container - Component View renders here */}
      <div
        ref={meetingContainerRef}
        id="zoom-meeting-container"
        style={{
          width: '100%',
          height: '100%',
          minHeight: '600px',
        }}
      />

      {/* CSS for Zoom Component View */}
      <style jsx global>{`
        /* Ensure Zoom container is visible */
        #zoom-meeting-container {
          position: relative !important;
          display: block !important;
          visibility: visible !important;
        }
        
        /* Zoom Component View styling */
        .zmwebsdk-makeStyles-inMeeting-3 {
          width: 100% !important;
          height: 100% !important;
        }
        
        /* Video container */
        .zmwebsdk-MuiPaper-root {
          background: transparent !important;
        }
      `}</style>

      {/* Watermark Overlay - Works because Component View uses regular DOM */}
      <WatermarkOverlay
        showWatermark={showWatermark}
        studentName={userName}
        studentEmail={userEmail}
        plyrContainer={null}
        isUnlimitedUser={false}
      />

      {/* Connecting indicator */}
      {!joinComplete && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 pointer-events-none">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white">Conectando a la clase...</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Wrap with memo to prevent unnecessary re-renders
const ZoomEmbedStudent = memo(ZoomEmbedStudentComponent, (prevProps, nextProps) => {
  const shouldNotRerender = 
    prevProps.meetingNumber === nextProps.meetingNumber &&
    prevProps.signature === nextProps.signature &&
    prevProps.userName === nextProps.userName &&
    prevProps.userEmail === nextProps.userEmail;
  
  return shouldNotRerender;
});

export default ZoomEmbedStudent;
