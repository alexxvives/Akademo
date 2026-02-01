'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { apiClient } from '@/lib/api-client';

const LOGO_CACHE_KEY = 'akademo_academy_logo';
const LOGO_CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export function useAcademyLogo() {
  const { user } = useAuth();
  // Try to load from cache immediately
  const getCachedLogo = () => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = localStorage.getItem(LOGO_CACHE_KEY);
      if (cached) {
        const { logoUrl, academyName, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < LOGO_CACHE_EXPIRY) {
          return { logoUrl, academyName };
        }
      }
    } catch (e) {
      console.error('Failed to load cached logo:', e);
    }
    return null;
  };

  const cached = getCachedLogo();
  const [logoUrl, setLogoUrl] = useState<string | null>(cached?.logoUrl || null);
  const [academyName, setAcademyName] = useState<string | null>(cached?.academyName || null);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    let isMounted = true;

    const loadLogo = async () => {
      if (!user) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        let fetchedLogoUrl: string | null = null;
        let fetchedName: string | null = null;

        if (user.role === 'ACADEMY') {
          // Get academy logo
          const res = await apiClient('/academies');
          const result = await res.json();
          if (result.success && result.data.length > 0) {
            fetchedLogoUrl = result.data[0].logoUrl || null;
            fetchedName = result.data[0].name || null;
          }
        } else if (user.role === 'TEACHER') {
          // Get teacher's academy logo
          const res = await apiClient('/academies/my-academy');
          const result = await res.json();
          if (result.success && result.data?.logoUrl) {
            fetchedLogoUrl = result.data.logoUrl;
            fetchedName = result.data.name || null;
          }
        } else if (user.role === 'STUDENT') {
          // Get first enrolled class's academy logo
          const res = await apiClient('/enrollments');
          const result = await res.json();
          if (result.success && result.data.length > 0) {
            const firstEnrollment = result.data[0];
            if (firstEnrollment.academyLogoUrl) {
              fetchedLogoUrl = firstEnrollment.academyLogoUrl;
            }
            if (firstEnrollment.academyName) {
              fetchedName = firstEnrollment.academyName;
            }
          }
        }

        if (isMounted) {
          setLogoUrl(fetchedLogoUrl);
          setAcademyName(fetchedName);

          // Cache the logo
          if (fetchedLogoUrl && fetchedName) {
            try {
              localStorage.setItem(LOGO_CACHE_KEY, JSON.stringify({
                logoUrl: fetchedLogoUrl,
                academyName: fetchedName,
                timestamp: Date.now(),
              }));
            } catch (e) {
              console.error('Failed to cache logo:', e);
            }
          }
        }
      } catch (error) {
        console.error('Error loading academy logo:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadLogo();

    return () => {
      isMounted = false;
    };
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  return { logoUrl, academyName, loading };
}
