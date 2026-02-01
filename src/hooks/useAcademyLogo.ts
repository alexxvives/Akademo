'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { apiClient } from '@/lib/api-client';

export function useAcademyLogo() {
  const { user } = useAuth();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [academyName, setAcademyName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadLogo = async () => {
      if (!user) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        if (user.role === 'ACADEMY') {
          // Get academy logo
          const res = await apiClient('/academies');
          const result = await res.json();
          if (isMounted && result.success && result.data.length > 0) {
            setLogoUrl(result.data[0].logoUrl || null);
            setAcademyName(result.data[0].name || null);
          }
        } else if (user.role === 'TEACHER') {
          // Get teacher's academy logo
          const res = await apiClient('/academies/my-academy');
          const result = await res.json();
          if (isMounted && result.success && result.data?.logoUrl) {
            setLogoUrl(result.data.logoUrl);
            setAcademyName(result.data.name || null);
          }
        } else if (user.role === 'STUDENT') {
          // Get first enrolled class's academy logo
          const res = await apiClient('/enrollments');
          const result = await res.json();
          if (isMounted && result.success && result.data.length > 0) {
            const firstEnrollment = result.data[0];
            if (firstEnrollment.academyLogoUrl) {
              setLogoUrl(firstEnrollment.academyLogoUrl);
            }
            if (firstEnrollment.academyName) {
              setAcademyName(firstEnrollment.academyName);
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
