'use client';

import { Suspense, useEffect } from 'react';
import { SkeletonForm } from '@/components/ui/SkeletonLoader';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');

      if (!code || !state) {
        alert('Error: Missing OAuth parameters');
        router.push('/dashboard/academy/profile');
        return;
      }

      try {
        const response = await apiClient('/zoom-accounts/oauth/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, state })
        });

        // Check if response is ok before parsing
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API error response:', errorText);
          throw new Error(`API returned ${response.status}: ${errorText}`);
        }

        const result = await response.json();

        if (result.success) {
          router.push('/dashboard/academy/profile?zoom=connected');
        } else {
          alert('Error connecting Zoom account');
          router.push('/dashboard/academy/profile');
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        alert(`Error connecting Zoom account: ${error instanceof Error ? error.message : 'Unknown error'}`);
        router.push('/dashboard/academy/profile');
      }
    };

    handleCallback();
  }, [searchParams, router]);
  
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <SkeletonForm />
        <p className="text-gray-600 mt-4">Conectando tu cuenta de Zoom...</p>
      </div>
    </div>
  );
}

export default function ZoomOAuthCallback() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <SkeletonForm />
          <p className="text-gray-600 mt-4">Conectando tu cuenta de Zoom...</p>
        </div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
