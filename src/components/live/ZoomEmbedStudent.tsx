'use client';

import { useEffect, useRef, useState } from 'react';
import ZoomMtgEmbedded from '@zoom/meetingsdk/embedded';

interface ZoomEmbedStudentProps {
  meetingNumber: string;
  password?: string;
  userName: string;
  userEmail: string;
  signature: string;
  zoomLink?: string;
  onLeave?: () => void;
}

export default function ZoomEmbedStudent({
  meetingNumber,
  password,
  userName,
  userEmail,
  signature,
  zoomLink,
  onLeave,
}: ZoomEmbedStudentProps) {
  const clientRef = useRef<ReturnType<typeof ZoomMtgEmbedded.createClient> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!signature || !meetingNumber) {
      console.log('[Zoom] Missing requirements');
      return;
    }

    const meetingSDKElement = document.getElementById('meetingSDKElement');
    if (!meetingSDKElement) {
      console.log('[Zoom] Container not found');
      return;
    }

    console.log('[Zoom] Initializing Meeting SDK...');

    const startMeeting = async () => {
      try {
        const client = ZoomMtgEmbedded.createClient();
        clientRef.current = client;

        // Initialize with minimal config - exactly like Zoom's official sample
        await client.init({
          zoomAppRoot: meetingSDKElement,
          language: 'es-ES',
          patchJsMedia: true,
          leaveOnPageUnload: true,
        });

        console.log('[Zoom] Joining meeting...');

        await client.join({
          signature: signature,
          meetingNumber: meetingNumber,
          password: password || '',
          userName: userName,
          userEmail: userEmail || undefined,
        });

        console.log('[Zoom] ✅ Joined successfully');
        setIsLoading(false);
      } catch (err) {
        console.error('[Zoom] ❌ Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to join meeting');
        setIsLoading(false);
      }
    };

    startMeeting();

    // Cleanup
    return () => {
      if (clientRef.current) {
        try {
          clientRef.current.leaveMeeting();
        } catch (e) {
          console.log('[Zoom] Leave error:', e);
        }
      }
    };
  }, [meetingNumber, signature, password, userName, userEmail]);

  // Expose leave handler to window for parent access
  useEffect(() => {
    (window as any).zoomCustomLeave = async () => {
      if (clientRef.current) {
        await clientRef.current.leaveMeeting();
      }
      if (onLeave) {
        onLeave();
      } else {
        window.location.href = '/dashboard';
      }
    };
    return () => {
      delete (window as any).zoomCustomLeave;
    };
  }, [onLeave]);

  if (!signature) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Generando credenciales...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center max-w-md p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Error al unirse</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          {zoomLink && (
            <a
              href={zoomLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              Abrir en Zoom directamente
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Zoom SDK Container - needs sized parent */}
      <div id="meetingSDKElement"></div>
      
      {/* Zoom's required CSS from official docs */}
      <style jsx global>{`
        html, body {
          min-width: 0 !important;
        }

        #zmmtg-root {
          display: none;
          min-width: 0 !important;
        }

        /* Let SDK fill the container */
        #meetingSDKElement {
          width: 100%;
          height: 100%;
        }
      `}</style>
    </div>
  );
}
