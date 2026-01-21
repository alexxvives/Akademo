'use client';

import { createPortal } from 'react-dom';

interface WatermarkOverlayProps {
  showWatermark: boolean;
  studentName?: string;
  studentEmail?: string;
  plyrContainer: HTMLElement | null;
  isUnlimitedUser: boolean;
}

export function WatermarkOverlay({
  showWatermark,
  studentName,
  studentEmail,
  plyrContainer,
  isUnlimitedUser,
}: WatermarkOverlayProps) {
  // Don't show for unlimited users or if no name
  if (isUnlimitedUser || !studentName || !showWatermark) {
    return null;
  }

  const watermarkContent = (
    <div className="absolute inset-0 flex items-center justify-center z-[20] pointer-events-none animate-fade-in">
      <div className="bg-black/50 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-3 shadow-lg">
        <div className="text-white/80 text-lg font-semibold tracking-wide text-center">
          {studentName}
        </div>
        {studentEmail && (
          <div className="text-white/60 text-xs font-medium mt-1 text-center">
            {studentEmail}
          </div>
        )}
      </div>
    </div>
  );

  // Use portal if available, otherwise render directly
  return plyrContainer ? createPortal(watermarkContent, plyrContainer) : watermarkContent;
}

export function BrandWatermark() {
  return (
    <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-xs font-bold tracking-wider z-[9999] pointer-events-none">
      AKADEMO
    </div>
  );
}
