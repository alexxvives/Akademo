'use client';

import { useEffect, useRef, useState } from 'react';
import { apiClient } from '@/lib/api-client';

export function useSignedUrl(bunnyGuid?: string) {
  const transcodingPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [signedHlsUrl, setSignedHlsUrl] = useState<string | null>(null);
  const [transcodingStatus, setTranscodingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!bunnyGuid) {
      setSignedHlsUrl(null);
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
            // Poll for status updates every 5 seconds
            transcodingPollRef.current = setInterval(async () => {
              const pollResponse = await apiClient(`/bunny/video/${bunnyGuid}/status`);
              if (pollResponse.ok) {
                const pollData = await pollResponse.json();
                if (pollData.success && pollData.data?.status === 4) {
                  setTranscodingStatus('finished');
                  if (transcodingPollRef.current) clearInterval(transcodingPollRef.current);
                  transcodingPollRef.current = null;
                  window.location.reload(); // Reload to load the video
                }
              }
            }, 5000);
            return;
          }
        }

        const response = await apiClient(`/bunny/video/${bunnyGuid}/stream`);
        const data = await response.json();

        if (data.success && data.data?.streamUrl) {
          setSignedHlsUrl(data.data.streamUrl);
        } else if (data.data?.error) {
          // Token key not configured or error, use direct URL as fallback
          console.warn('Signed URL not available:', data.data.error);
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
    return () => {
      if (transcodingPollRef.current) {
        clearInterval(transcodingPollRef.current);
        transcodingPollRef.current = null;
      }
    };
  }, [bunnyGuid]);

  return { signedHlsUrl, transcodingStatus };
}
