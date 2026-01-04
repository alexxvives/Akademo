interface PendingEnrollmentsProps {
  pendingEnrollments: Array<{
    id: string;
    enrolledAt: string;
    student: {
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;
  showPendingRequests: boolean;
  onApprove: (enrollmentId: string) => void;
  onReject: (enrollmentId: string) => void;
  onClose: () => void;
}

export default function PendingEnrollments({
  pendingEnrollments,
  showPendingRequests,
  onApprove,
  onReject,
  onClose,
}: PendingEnrollmentsProps) {
  if (!showPendingRequests || pendingEnrollments.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border border-blue-200 rounded-xl overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 px-6 py-3 border-b border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Solicitudes Pendientes</h2>
              <p className="text-xs text-gray-600">
                {pendingEnrollments.length} estudiante{pendingEnrollments.length !== 1 ? 's' : ''} esperando tu aprobación
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="p-4">
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {pendingEnrollments.map((enrollment) => (
            <div 
              key={enrollment.id} 
              className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md hover:border-blue-300 transition-all flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">
                  {enrollment.student.firstName.charAt(0)}{enrollment.student.lastName.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">
                  {enrollment.student.firstName} {enrollment.student.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{enrollment.student.email}</p>
                <p className="text-xs text-gray-400">
                  Solicitado {new Date(enrollment.enrolledAt).toLocaleDateString('es-ES', { 
                    day: 'numeric', 
                    month: 'short', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => onReject(enrollment.id)}
                  className="p-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all"
                  title="Rechazar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <button
                  onClick={() => onApprove(enrollment.id)}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                  title="Aprobar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
