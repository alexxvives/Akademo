'use client';

import { useEffect, useState } from 'react';

interface BunnyVideoPlayerProps {
  videoGuid: string;
  title?: string;
  autoplay?: boolean;
  className?: string;
}

// Bunny Stream embed player with adaptive bitrate
export default function BunnyVideoPlayer({
  videoGuid,
  title,
  autoplay = false,
  className = '',
}: BunnyVideoPlayerProps) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStreamUrls() {
      try {
        const res = await fetch(`/api/bunny/video/${videoGuid}/stream`);
        if (!res.ok) throw new Error('Failed to load video');
        const { data } = await res.json();
        setEmbedUrl(data.embedUrl);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load video');
      } finally {
        setLoading(false);
      }
    }

    if (videoGuid) {
      fetchStreamUrls();
    }
  }, [videoGuid]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 rounded-lg ${className}`} style={{ aspectRatio: '16/9' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
          <span className="text-white text-sm">Cargando video...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 rounded-lg ${className}`} style={{ aspectRatio: '16/9' }}>
        <div className="text-red-400 text-center p-4">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`} style={{ aspectRatio: '16/9' }}>
      <iframe
        src={`${embedUrl}?autoplay=${autoplay}&preload=true&responsive=true`}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title={title || 'Video'}
      />
    </div>
  );
}

// Status indicator for videos being transcoded
export function BunnyVideoStatus({ videoGuid }: { videoGuid: string }) {
  const [status, setStatus] = useState<{ text: string; isReady: boolean } | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch(`/api/bunny/video/${videoGuid}`);
        if (!res.ok) throw new Error('Failed to check status');
        const { data } = await res.json();
        setStatus({ text: data.statusText, isReady: data.isReady });
        
        if (data.isReady || data.status === 5) {
          // Stop polling when ready or error
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Status check error:', err);
      } finally {
        setChecking(false);
      }
    }

    checkStatus();
    const interval = setInterval(checkStatus, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [videoGuid]);

  if (checking || !status) {
    return <span className="text-gray-500">Verificando...</span>;
  }

  if (status.isReady) {
    return <span className="text-green-600 font-medium">✓ Listo</span>;
  }

  return (
    <span className="text-amber-600 font-medium flex items-center gap-1">
      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      {status.text}
    </span>
  );
}
