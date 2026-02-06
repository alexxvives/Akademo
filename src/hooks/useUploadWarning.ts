'use client';

import { useEffect } from 'react';

/**
 * Hook to warn users and block navigation when an upload is in progress.
 * Handles:
 * - Window close/refresh (beforeunload)
 * - Browser back/forward buttons (popstate)
 * - Link clicks
 * 
 * @param uploading - Whether an upload is currently in progress
 * @param warningMessage - Optional custom warning message
 */
export function useUploadWarning(
  uploading: boolean,
  warningMessage = 'Hay un video subiendo. Si sales de esta página, se cancelará la subida.'
) {
  // Warn user when trying to close/refresh browser during upload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (uploading) {
        e.preventDefault();
        e.returnValue = warningMessage;
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [uploading, warningMessage]);

  // Block navigation during active upload using popstate
  useEffect(() => {
    if (!uploading) return;

    const handlePopState = () => {
      if (uploading) {
        const confirmLeave = window.confirm(
          '⚠️ ADVERTENCIA: ' + warningMessage + '\n\n¿Estás seguro de que quieres salir?'
        );
        if (!confirmLeave) {
          window.history.pushState(null, '', window.location.href);
        }
      }
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [uploading, warningMessage]);

  // Intercept link clicks during upload
  useEffect(() => {
    if (!uploading) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (anchor && anchor.href && !anchor.href.includes(window.location.pathname)) {
        e.preventDefault();
        e.stopPropagation();
        
        const confirmLeave = window.confirm(
          '⚠️ ADVERTENCIA: ' + warningMessage + '\n\n¿Estás seguro de que quieres salir?'
        );
        
        if (confirmLeave) {
          window.location.href = anchor.href;
        }
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [uploading, warningMessage]);
}
