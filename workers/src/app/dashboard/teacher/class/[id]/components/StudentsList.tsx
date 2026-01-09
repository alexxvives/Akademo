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
  const approvedEnrollments = enrollments.filter(e => e.status === 'APPROVED');

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Estudiantes</h2>
      {approvedEnrollments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500 text-sm">No hay estudiantes inscritos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {approvedEnrollments.map(e => (
            <div key={e.id} className="bg-white rounded-xl border border-gray-200 p-3 hover:shadow-md transition-shadow relative">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {e.student.firstName[0]}{e.student.lastName[0]}
                  {/* Green dot for active status - top right of avatar */}
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" title="Activo"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{e.student.firstName} {e.student.lastName}</p>
                  <p className="text-xs text-gray-500 truncate">{e.student.email}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
