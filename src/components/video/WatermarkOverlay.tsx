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
  // Don't show for unlimited users or if no email
  if (isUnlimitedUser || !studentEmail || !showWatermark) {
    return null;
  }

  const watermarkContent = (
    <div className="absolute inset-0 flex items-center justify-center z-[20] pointer-events-none animate-fade-in">
      <div className="bg-black/50 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-1.5 shadow-lg">
        <div className="text-white/85 text-sm font-semibold tracking-wide text-center">
          {studentEmail}
        </div>
        {studentName && (
          <div className="text-white/55 text-[10px] font-black mt-0.5 text-center tracking-wider uppercase">
            {studentName}
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
