'use client';

import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { WatermarkOverlay } from '@/components/video/WatermarkOverlay';

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
    timestamp: new Date().toISOString(),
  });
  
  const meetingSDKElement = useRef<HTMLDivElement>(null);
  const [showWatermark, setShowWatermark] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [joinComplete, setJoinComplete] = useState(false);
  const watermarkInterval = useRef<NodeJS.Timeout | null>(null);
  const watermarkDisplay = useRef<NodeJS.Timeout | null>(null);
  const joinInitiated = useRef(false); // Prevent multiple joins
  
  // *** CRITICAL FIX: Store props in refs so callbacks don't need them as dependencies ***
  // This keeps callbacks STABLE (same reference forever) while having access to current values
  const propsRef = useRef({ meetingNumber, password, userName, userEmail, signature });
  
  // Update refs when props change (but DON'T recreate callbacks)
  useEffect(() => {
    propsRef.current = { meetingNumber, password, userName, userEmail, signature };
  }, [meetingNumber, password, userName, userEmail, signature]);

  const triggerWatermark = useCallback(() => {
    setShowWatermark(true);
    // Hide after 5 seconds
    watermarkDisplay.current = setTimeout(() => {
      setShowWatermark(false);
    }, 5000);
  }, []);
  
  // Use a ref to track if we've set up event listeners
  const eventListenersSetup = useRef(false);

  // Setup Zoom SDK event listeners - this is MORE RELIABLE than callbacks
  const setupZoomEventListeners = useCallback(() => {
    const ZoomMtg = (window as any).ZoomMtg;
    if (!ZoomMtg || eventListenersSetup.current) return;
    
    eventListenersSetup.current = true;
    console.log('[ZoomEmbedStudent] Setting up Zoom event listeners...');
    
    // Listen for meeting status changes
    ZoomMtg.inMeetingServiceListener('onMeetingStatus', function(data: any) {
      console.log('[ZoomEmbedStudent] 🔔 Meeting status changed:', data);
      if (data.meetingStatus === 1 || data.meetingStatus === 2) { // 1=connecting, 2=connected
        console.log('[ZoomEmbedStudent] ✅ MEETING CONNECTED!');
        setJoinComplete(true);
      }
    });
    
    // Listen for user join
    ZoomMtg.inMeetingServiceListener('onUserJoin', function(data: any) {
      console.log('[ZoomEmbedStudent] 👤 User joined:', data);
    });
    
    // Listen for connection change
    ZoomMtg.inMeetingServiceListener('onConnectionChange', function(data: any) {
      console.log('[ZoomEmbedStudent] 🔗 Connection change:', data);
    });
  }, []);

  // Handle when join completes (called from init success)
  const executeJoin = useCallback(() => {
    console.log('[ZoomEmbedStudent] >>> executeJoin() ENTERED <<<');
    
    const ZoomMtg = (window as any).ZoomMtg;
    console.log('[ZoomEmbedStudent] ZoomMtg available:', !!ZoomMtg);
    
    if (!ZoomMtg) {
      console.error('[ZoomEmbedStudent] ZoomMtg not available for join');
      return;
    }
    
    // Setup event listeners BEFORE joining
    console.log('[ZoomEmbedStudent] About to setup event listeners...');
    setupZoomEventListeners();
    console.log('[ZoomEmbedStudent] Event listeners setup done');
    
    // Read CURRENT values from ref (not from closure - closures cause stale data)
    console.log('[ZoomEmbedStudent] Reading from propsRef...');
    const { meetingNumber, password, userName, userEmail, signature } = propsRef.current;
    console.log('[ZoomEmbedStudent] propsRef values:', { meetingNumber, userName, userEmail, hasSignature: !!signature });
    
    console.log('[ZoomEmbedStudent] About to call ZoomMtg.join() with:', {
      meetingNumber,
      userName,
      userEmail,
      hasSignature: !!signature,
      sdkKey: process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID,
    });

    console.log('[ZoomEmbedStudent] Executing ZoomMtg.join() NOW...');
    ZoomMtg.join({
      signature: signature,
      sdkKey: process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID,
      meetingNumber: meetingNumber,
      passWord: password || '', // CRITICAL: Zoom uses camelCase passWord, not password
      userName: userName,
      userEmail: userEmail,
      success: function(success: any) {
        console.log('[ZoomEmbedStudent] ✅ JOIN SUCCESS CALLBACK FIRED:', success);
        setJoinComplete(true);
        
        // Official Zoom pattern: call getAttendeeslist after join
        try {
          ZoomMtg.getAttendeeslist({});
          console.log('[ZoomEmbedStudent] getAttendeeslist called');
        } catch (e) {
          console.log('[ZoomEmbedStudent] getAttendeeslist error (may be expected):', e);
        }
        
        // Get current user info (Zoom official pattern)
        try {
          ZoomMtg.getCurrentUser({
            success: function(res: any) {
              console.log('[ZoomEmbedStudent] Current user:', res);
            }
          });
        } catch (e) {
          console.log('[ZoomEmbedStudent] getCurrentUser error:', e);
        }
        
        // Enable video and audio after joining
        setTimeout(() => {
          try {
            console.log('[ZoomEmbedStudent] Starting video and audio...');
            ZoomMtg.startVideo({
              success: () => console.log('[ZoomEmbedStudent] Video started'),
              error: (e: any) => console.log('[ZoomEmbedStudent] Video start error (may be expected):', e)
            });
            
            ZoomMtg.unmuteAudio({
              success: () => console.log('[ZoomEmbedStudent] Audio unmuted'),
              error: (e: any) => console.log('[ZoomEmbedStudent] Audio unmute error (may be expected):', e)
            });
          } catch (e) {
            console.log('[ZoomEmbedStudent] Video/audio control error (may be expected):', e);
          }
        }, 2000);
      },
      error: function(error: any) {
        console.error('[ZoomEmbedStudent] ❌ JOIN ERROR CALLBACK:', error);
        joinInitiated.current = false; // Allow retry
      },
    });
    console.log('[ZoomEmbedStudent] ZoomMtg.join() call completed (waiting for callbacks/events)...');
  }, [setupZoomEventListeners]);

  // Handle init success
  const handleInitSuccess = useCallback((success: any) => {
    console.log('[ZoomEmbedStudent] Zoom SDK initialized:', success);
    console.log('[ZoomEmbedStudent] Calling executeJoin() now...');
    try {
      executeJoin();
      console.log('[ZoomEmbedStudent] executeJoin() completed without error');
    } catch (err) {
      console.error('[ZoomEmbedStudent] ERROR in executeJoin():', err);
    }
  }, [executeJoin]);

  useEffect(() => {
    // Start watermark interval (every 5 minutes)
    triggerWatermark();
    watermarkInterval.current = setInterval(triggerWatermark, 5 * 60 * 1000);

    return () => {
      if (watermarkInterval.current) clearInterval(watermarkInterval.current);
      if (watermarkDisplay.current) clearTimeout(watermarkDisplay.current);
    };
  }, [triggerWatermark]);

  useEffect(() => {
    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
      });
    };

    const loadZoomSDK = async () => {
      try {
        // Check if Zoom SDK script is already loaded
        if (typeof window !== 'undefined' && !(window as any).ZoomMtg) {
          console.log('[ZoomEmbedStudent] Loading Zoom SDK dependencies sequentially...');
          
          // CRITICAL: Load Lodash FIRST before anything else
          await loadScript('https://source.zoom.us/3.8.10/lib/vendor/lodash.min.js');
          console.log('[ZoomEmbedStudent] Lodash loaded');
          
          // Then load React
          await loadScript('https://source.zoom.us/3.8.10/lib/vendor/react.min.js');
          console.log('[ZoomEmbedStudent] React loaded');
          
          await loadScript('https://source.zoom.us/3.8.10/lib/vendor/react-dom.min.js');
          console.log('[ZoomEmbedStudent] React-DOM loaded');
          
          // Then Redux
          await loadScript('https://source.zoom.us/3.8.10/lib/vendor/redux.min.js');
          console.log('[ZoomEmbedStudent] Redux loaded');
          
          await loadScript('https://source.zoom.us/3.8.10/lib/vendor/redux-thunk.min.js');
          console.log('[ZoomEmbedStudent] Redux-Thunk loaded');
          
          // Finally load Zoom SDK (after all dependencies are ready)
          await loadScript('https://source.zoom.us/zoom-meeting-3.8.10.min.js');
          console.log('[ZoomEmbedStudent] Zoom SDK loaded successfully');
          
          // Load Zoom CSS
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://source.zoom.us/3.8.10/css/bootstrap.css';
          document.head.appendChild(link);

          const link2 = document.createElement('link');
          link2.rel = 'stylesheet';
          link2.href = 'https://source.zoom.us/3.8.10/css/react-select.css';
          document.head.appendChild(link2);
          
          setSdkReady(true);
        } else {
          setSdkReady(true);
        }
      } catch (error) {
        console.error('[ZoomEmbedStudent] Failed to load Zoom SDK:', error);
      }
    };

    loadZoomSDK();
  }, []);

  useEffect(() => {
    console.log('[ZoomEmbedStudent] useEffect triggered - sdkReady:', sdkReady, 'hasElement:', !!meetingSDKElement.current, 'signature:', !!signature, 'joinInitiated:', joinInitiated.current);
    
    if (!sdkReady || !meetingSDKElement.current || !signature || joinInitiated.current) {
      console.log('[ZoomEmbedStudent] Skipping init - not ready (sdkReady:', sdkReady, 'signature:', !!signature, 'joinInitiated:', joinInitiated.current, ')');
      return;
    }

    const ZoomMtg = (window as any).ZoomMtg;
    if (!ZoomMtg) {
      console.error('[ZoomEmbedStudent] ZoomMtg not found on window');
      return;
    }

    // Mark as initiated FIRST to prevent re-runs
    joinInitiated.current = true;
    console.log('[ZoomEmbedStudent] Initializing Zoom SDK (join initiated flag set)...');
    
    ZoomMtg.setZoomJSLib('https://source.zoom.us/3.8.10/lib', '/av');
    ZoomMtg.preLoadWasm();
    ZoomMtg.prepareWebSDK();

    // CRITICAL: Zoom official pattern - wrap init in i18n.onLoad callback
    ZoomMtg.i18n.load('es-ES');
    ZoomMtg.i18n.onLoad(function() {
      console.log('[ZoomEmbedStudent] i18n loaded, now calling init...');
      
      ZoomMtg.init({
        leaveUrl: window.location.origin + '/dashboard/student/live',
        disableCORP: !window.crossOriginIsolated, // Zoom recommended
        disableInvite: true,
        disableCallOut: true,
        disableRecord: true,
        disableJoinAudio: false,
        audioPanelAlwaysOpen: true,
        showMeetingHeader: true,
        disablePreview: false,
        videoHeader: true,
        meetingInfo: ['topic', 'host', 'participant'],
        success: handleInitSuccess,
        error: (error: any) => {
          console.error('[ZoomEmbedStudent] Failed to initialize Zoom SDK:', error);
          joinInitiated.current = false; // Allow retry
        },
      });
    });

    // *** NO CLEANUP - We don't want to end the meeting when component re-renders ***
    // The meeting should only end when user navigates away (handled by leaveUrl)
  }, [sdkReady, signature, handleInitSuccess]);

  // Debug: Monitor Zoom container visibility
  useEffect(() => {
    if (!joinComplete) return;
    
    const checkZoomContainer = () => {
      const zmmtgRoot = document.getElementById('zmmtg-root');
      const meetingClient = document.querySelector('.meeting-client');
      const videoContainer = document.querySelector('.video-container');
      
      console.log('[ZoomEmbedStudent] 🔍 Container check:', {
        zmmtgRootExists: !!zmmtgRoot,
        zmmtgRootVisible: zmmtgRoot ? window.getComputedStyle(zmmtgRoot).display !== 'none' : false,
        zmmtgRootChildren: zmmtgRoot ? zmmtgRoot.children.length : 0,
        meetingClientExists: !!meetingClient,
        videoContainerExists: !!videoContainer,
        zmmtgRootHTML: zmmtgRoot ? zmmtgRoot.innerHTML.substring(0, 200) : 'N/A',
      });
    };
    
    // Check immediately and periodically
    checkZoomContainer();
    const interval = setInterval(checkZoomContainer, 5000);
    
    return () => clearInterval(interval);
  }, [joinComplete]);

  // Show loading state while waiting for signature
  if (!signature) {
    console.log('[ZoomEmbedStudent] Rendering fallback - no signature yet');
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Conectando a la clase...</p>
        </div>
      </div>
    );
  }

  // Fallback: If SDK doesn't load, use external link
  if (!sdkReady) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <div className="mb-4">
          <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Unirse a la clase en vivo
        </h3>
        <p className="text-gray-600 mb-4">
          Haz clic en el botón para unirte a la clase en Zoom
        </p>
        {zoomLink && (
          <a
            href={zoomLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-semibold"
          >
            Abrir Zoom
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[600px] bg-black rounded-lg overflow-hidden">
      {/* Zoom SDK Container */}
      <div 
        ref={meetingSDKElement} 
        id="meetingSDKElement" 
        className="w-full h-full"
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          minHeight: '600px',
        }}
      />

      {/* CSS Override to ensure Zoom UI is visible and contained */}
      <style jsx global>{`
        /* Main Zoom container - MUST be visible */
        #zmmtg-root {
          position: relative !important;
          width: 100% !important;
          height: 100% !important;
          max-width: 100% !important;
          max-height: 100% !important;
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          z-index: 1 !important;
        }
        
        /* Zoom app container */
        .meeting-app {
          position: relative !important;
          width: 100% !important;
          height: 100% !important;
          display: block !important;
          visibility: visible !important;
        }
        
        /* Meeting client container */
        .meeting-client {
          position: relative !important;
          display: block !important;
          visibility: visible !important;
        }
        
        /* Video containers */
        .full-screen-video-container,
        .video-container {
          position: relative !important;
          display: block !important;
          visibility: visible !important;
        }
        
        /* Make sure video elements are visible */
        .zoom-canvas-container,
        .speaker-bar-container,
        .video-avatar {
          display: block !important;
          visibility: visible !important;
        }
        
        /* Audio must be enabled */
        .join-audio-container {
          display: block !important;
        }
      `}</style>

      {/* Watermark Overlay */}
      <WatermarkOverlay
        showWatermark={showWatermark}
        studentName={userName}
        studentEmail={userEmail}
        plyrContainer={null}
        isUnlimitedUser={false}
      />
    </div>
  );
};

// Wrap with memo to prevent unnecessary re-renders
const ZoomEmbedStudent = memo(ZoomEmbedStudentComponent, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  const shouldNotRerender = 
    prevProps.meetingNumber === nextProps.meetingNumber &&
    prevProps.signature === nextProps.signature &&
    prevProps.userName === nextProps.userName &&
    prevProps.userEmail === nextProps.userEmail;
  
  if (!shouldNotRerender) {
    console.log('[ZoomEmbedStudent] Props changed, will re-render:', {
      meetingChanged: prevProps.meetingNumber !== nextProps.meetingNumber,
      signatureChanged: prevProps.signature !== nextProps.signature,
      userNameChanged: prevProps.userName !== nextProps.userName,
      emailChanged: prevProps.userEmail !== nextProps.userEmail,
    });
  }
  
  return shouldNotRerender;
});

export default ZoomEmbedStudent;
