'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

export default function ZoomOAuthCallback() {
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

        const result = await response.json();

        if (result.success) {
          router.push('/dashboard/academy/profile?zoom=connected');
        } else {
          alert('Error connecting Zoom account');
          router.push('/dashboard/academy/profile');
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        alert('Error connecting Zoom account');
        router.push('/dashboard/academy/profile');
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Conectando con Zoom...</p>
      </div>
    </div>
  );
}
