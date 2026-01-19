interface StudentsListProps {
  enrollments: Array<{
    id: string;
    enrolledAt: string;
    status: string;
    student: {
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;
}

export default function StudentsList({ enrollments }: StudentsListProps) {
  // Show both approved (active) and rejected/inactive students
  const visibleEnrollments = (enrollments || []).filter(e => ['APPROVED', 'REJECTED', 'INACTIVE'].includes(e.status));

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Estudiantes</h2>
      {visibleEnrollments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500 text-sm">No hay estudiantes inscritos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {visibleEnrollments.map(e => (
            <div key={e.id} className="bg-white rounded-xl border border-gray-200 p-3 hover:shadow-md transition-shadow relative group">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {e.student.firstName[0]}{e.student.lastName[0]}
                  {/* Status dot: Green for active/approved, Red for inactive/rejected */}
                  <div 
                    className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                      e.status === 'APPROVED' ? 'bg-green-500' : 'bg-red-500'
                    }`} 
                    title={e.status === 'APPROVED' ? 'Activo' : 'Inactivo'}
                  ></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{e.student.firstName} {e.student.lastName}</p>
                  <p className="text-xs text-gray-500 truncate">{e.student.email}</p>
                </div>
                {e.status === 'APPROVED' && (
                  <button
                    onClick={async () => {
                      if (!confirm(`¿Eliminar a ${e.student.firstName} ${e.student.lastName} de esta clase?`)) return;
                      try {
                        const { apiClient } = await import('@/lib/api-client');
                        const response = await apiClient(`/enrollments/${e.id}/reject`, { method: 'POST' });
                        const result = await response.json();
                        if (result.success) {
                          window.location.reload();
                        } else {
                          alert(result.error || 'Error al eliminar estudiante');
                        }
                      } catch (error) {
                        console.error('Error removing student:', error);
                        alert('Error al eliminar estudiante');
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Eliminar de clase"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
