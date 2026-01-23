import { EnrolledStudent } from '@/hooks/useTeacherDashboard';
import { BarChart, DonutChart } from '@/components/Charts';
import { RatingsData } from '@/hooks/useTeacherDashboard';
import { useAnimatedNumber } from '@/hooks';
import { PendingEnrollment } from '@/hooks/useTeacherDashboard';

function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const animatedValue = useAnimatedNumber(value);
  return <div className={className}>{animatedValue}</div>;
}

interface DashboardChartsGridProps {
  filteredStudents: EnrolledStudent[];
  pendingEnrollments: PendingEnrollment[];
  rejectedCount: number;
  streamStats: { total: number; avgParticipants: number; thisMonth: number; totalHours: number };
  ratingsData: RatingsData | null;
  selectedClass: string;
}

export function DashboardChartsGrid({ 
  filteredStudents, 
  pendingEnrollments,
  rejectedCount, 
  streamStats, 
  ratingsData,
  selectedClass 
}: DashboardChartsGridProps) {
  // Calculate average lesson progress for filtered students
  const avgLessonProgress = (() => {
    if (filteredStudents.length === 0) return 0;
    
    const studentsWithLessons = filteredStudents.filter(s => s.totalLessons && s.totalLessons > 0);
    if (studentsWithLessons.length === 0) return 0;
    
    const totalProgress = studentsWithLessons.reduce((sum, s) => {
      const progress = (s.lessonsCompleted || 0) / (s.totalLessons || 1);
      return sum + progress;
    }, 0);
    
    return Math.round((totalProgress / studentsWithLessons.length) * 100);
  })();

  if (filteredStudents.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 p-12 text-center">
        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-gray-900 mb-1">Sin estudiantes inscritos</h3>
        <p className="text-xs text-gray-500">Cuando los estudiantes se inscriban, verás sus datos aquí</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Engagement Metrics */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm h-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Participación</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Progreso Promedio (Clases)</span>
              <span className="text-sm font-semibold text-gray-900">{avgLessonProgress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${avgLessonProgress}%`, animation: 'slideIn 1s ease-out' }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Asistencia Promedio (Streams)</span>
              <span className="text-sm font-semibold text-gray-900">
                {streamStats.total > 0 && filteredStudents.length > 0
                  ? Math.round(((streamStats.avgParticipants - 1) / filteredStudents.length) * 100)
                  : 0}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-purple-500 h-2 rounded-full" 
                style={{ 
                  width: `${streamStats.total > 0 && filteredStudents.length > 0
                    ? Math.round(((streamStats.avgParticipants - 1) / filteredStudents.length) * 100)
                    : 0}%`, 
                  animation: 'slideIn 1s ease-out 0.1s backwards' 
                }} 
              />
            </div>
          </div>
          <style jsx>{`
            @keyframes slideIn {
              from {
                width: 0;
              }
            }
          `}</style>
          {/* Tiempo de visualización total removed - needs proper tracking */}
        </div>
      </div>

      {/* Student Summary */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm h-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Estudiantes</h3>
        <div className="space-y-6">
          <div className="text-center">
            <AnimatedNumber value={filteredStudents.length} className="text-5xl font-bold text-gray-900 mb-2" />
            <div className="text-sm text-gray-500">estudiantes {selectedClass === 'all' ? 'totales' : 'en esta clase'}</div>
          </div>
          <div className="flex justify-between gap-4 pt-4 border-t border-gray-100">
            <div className="flex-1 text-center group/accepted relative cursor-help">
              <AnimatedNumber value={filteredStudents.length} className="text-2xl font-bold text-green-600" />
              <div className="text-xs text-gray-500">aceptados</div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-slate-200 text-xs rounded-lg shadow-xl border border-slate-700 opacity-0 invisible group-hover/accepted:opacity-100 group-hover/accepted:visible transition-all duration-200 whitespace-nowrap z-20">
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-slate-800 border-b border-r border-slate-700 rotate-45"></div>
                Estudiantes aprobados
              </div>
            </div>
            <div className="flex-1 text-center group/pending relative cursor-help">
              <AnimatedNumber value={pendingEnrollments.length} className="text-2xl font-bold text-amber-600" />
              <div className="text-xs text-gray-500">pendientes</div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-slate-200 text-xs rounded-lg shadow-xl border border-slate-700 opacity-0 invisible group-hover/pending:opacity-100 group-hover/pending:visible transition-all duration-200 whitespace-nowrap z-20">
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-slate-800 border-b border-r border-slate-700 rotate-45"></div>
                Esperando aprobación
              </div>
            </div>
            <div className="flex-1 text-center group/rejected relative cursor-help">
              <AnimatedNumber value={rejectedCount} className="text-2xl font-bold text-red-600" />
              <div className="text-xs text-gray-500">rechazados</div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-slate-200 text-xs rounded-lg shadow-xl border border-slate-700 opacity-0 invisible group-hover/rejected:opacity-100 group-hover/rejected:visible transition-all duration-200 whitespace-nowrap z-20">
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-slate-800 border-b border-r border-slate-700 rotate-45"></div>
                Solicitudes denegadas
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Star Ratings Distribution */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm h-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Valoraciones</h3>
        {ratingsData && ratingsData.overall.totalRatings > 0 ? (
          <BarChart
            data={[
              { label: '1★', value: ratingsData.lessons.filter(l => (selectedClass === 'all' || l.classId === selectedClass) && l.averageRating && l.averageRating >= 1 && l.averageRating < 1.5).length, color: '#ef4444' },
              { label: '2★', value: ratingsData.lessons.filter(l => (selectedClass === 'all' || l.classId === selectedClass) && l.averageRating && l.averageRating >= 1.5 && l.averageRating < 2.5).length, color: '#f97316' },
              { label: '3★', value: ratingsData.lessons.filter(l => (selectedClass === 'all' || l.classId === selectedClass) && l.averageRating && l.averageRating >= 2.5 && l.averageRating < 3.5).length, color: '#a3e635' },
              { label: '4★', value: ratingsData.lessons.filter(l => (selectedClass === 'all' || l.classId === selectedClass) && l.averageRating && l.averageRating >= 3.5 && l.averageRating < 4.5).length, color: '#84cc16' },
              { label: '5★', value: ratingsData.lessons.filter(l => (selectedClass === 'all' || l.classId === selectedClass) && l.averageRating && l.averageRating >= 4.5).length, color: '#22c55e' },
            ]}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <p className="text-sm">Sin valoraciones aún</p>
          </div>
        )}
      </div>

      {/* Student Status */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm h-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Actividad</h3>
        <div className="h-64 flex items-center justify-center">
          <DonutChart
            size={250}
            data={[
              { label: 'Activos', value: Math.round(filteredStudents.length * 0.65), color: '#22c55e' },
              { label: 'Inactivos', value: Math.round(filteredStudents.length * 0.35), color: '#ef4444' },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
