import Link from 'next/link';

interface ClassHeaderProps {
  classData: {
    id: string;
    name: string;
    description?: string | null;
    enrollments: Array<{ status: string }>;
  };
  classId: string;
  lessonsCount: number;
  pendingCount: number;
  creatingStream: boolean;
  showPendingRequests: boolean;
  onCreateLesson: () => void;
  onCreateStream: () => void;
  onTogglePendingRequests: () => void;
}

export default function ClassHeader({
  classData,
  classId,
  lessonsCount,
  pendingCount,
  creatingStream,
  showPendingRequests,
  onCreateLesson,
  onCreateStream,
  onTogglePendingRequests,
}: ClassHeaderProps) {
  const approvedCount = (classData.enrollments || []).filter((e) => e.status === 'APPROVED').length;

  return (
    <>
      {/* Back to classes link */}
      <Link href="/dashboard/teacher" className="text-sm text-gray-500 hover:text-gray-900 inline-block">
        ← Volver a clases
      </Link>
      
      {/* Title and Actions */}
      <div className="flex items-start justify-between mb-4 mt-0">
        <div className="flex-1">
          <div className="flex items-center gap-4 flex-wrap mb-2">
            <h1 className="text-2xl font-semibold text-gray-900">{classData.name}</h1>
            {/* Stats moved inline with title as requested */}
            <div className="flex items-center gap-3 text-sm">
              <div className="px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-1.5">
                <span className="font-semibold text-blue-900">{lessonsCount}</span>
                <span className="text-blue-700">lecciones</span>
              </div>
              <div className="px-2.5 py-1 bg-green-50 border border-green-200 rounded-lg flex items-center gap-1.5">
                <span className="font-semibold text-green-900">{approvedCount}</span>
                <span className="text-green-700">estudiantes</span>
              </div>
              {pendingCount > 0 && (
                <div
                  className="px-2.5 py-1 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-1.5"
                >
                  <span className="font-semibold text-red-900">{pendingCount}</span>
                  <span className="text-red-700">solicitud{pendingCount !== 1 ? 'es' : ''}</span>
                </div>
              )}
            </div>
          </div>
          {classData.description && (
            <p className="text-gray-600 text-lg max-w-3xl">{classData.description}</p>
          )}
        </div>
        <div className="flex gap-3 ml-auto">
          <button
            onClick={onCreateLesson}
            className="px-5 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-all"
          >
            + Nueva Lección
          </button>
          <button
            onClick={onCreateStream}
            disabled={creatingStream}
            className="px-5 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
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
