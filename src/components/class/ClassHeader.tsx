'use client';

/**
 * Shared ClassHeader Component
 * Used by: Academy, Admin, and Teacher class detail pages
 * 
 * Differences handled via props:
 * - backLink: Role-specific back navigation URL
 * - paymentStatus: Academy/Admin only - disables stream button when NOT PAID
 */

import Link from 'next/link';

export interface ClassHeaderProps {
  classData: {
    id: string;
    name: string;
    description?: string | null;
    enrollments: Array<{ status: string }>;
  };
  /** URL for back navigation (e.g., /dashboard/academy/classes) */
  backLink: string;
  creatingStream: boolean;
  showPendingRequests: boolean;
  /** Payment status - when 'NOT PAID', streaming is disabled */
  paymentStatus?: string;
  onCreateLesson: () => void;
  onCreateStream: () => void;
  onTogglePendingRequests: () => void;
}

export default function ClassHeader({
  classData,
  backLink,
  creatingStream,
  showPendingRequests,
  paymentStatus = 'PAID',
  onCreateLesson,
  onCreateStream,
  onTogglePendingRequests,
}: ClassHeaderProps) {
  const isStreamDisabled = creatingStream || paymentStatus === 'NOT PAID';

  return (
    <>
      <Link href={backLink} className="text-sm text-gray-500 hover:text-gray-900 inline-block">
        ← Volver a asignaturas
      </Link>
      
      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 mt-0 gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-4 flex-wrap mb-2">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">{classData.name}</h1>
          </div>
          {classData.description && (
            <p className="text-gray-600 text-base sm:text-lg max-w-3xl">{classData.description}</p>
          )}
        </div>
        <div className="flex gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={onCreateLesson}
            className="px-3 py-2 sm:px-5 sm:py-2.5 bg-gray-900 text-white rounded-lg text-sm sm:text-base font-medium hover:bg-gray-800 transition-all"
          >
            + Nueva Clase
          </button>
          <button
            onClick={onCreateStream}
            disabled={isStreamDisabled}
            className="px-3 py-2 sm:px-5 sm:py-2.5 bg-red-500 text-white rounded-lg text-sm sm:text-base font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
            title={paymentStatus === 'NOT PAID' ? 'Active su academia para usar streaming en vivo' : ''}
          >
            {creatingStream ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
            )}
            {creatingStream ? 'Creando...' : 'Stream'}
          </button>
        </div>
      </div>
    </>
  );
}
