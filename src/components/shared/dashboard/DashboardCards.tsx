'use client';

import { BarChart, DonutChart } from '@/components/Charts';
import { generateDemoRatings } from '@/lib/demo-data';
import { EmptyState } from './DashboardHelpers';
import type { EnrolledStudent, RatingsData, Class, StreamStats } from './types';

// ─── Engagement Card ───
interface EngagementCardProps {
  isAcademy: boolean; isAdmin: boolean;
  filteredStudents: EnrolledStudent[];
  avgLessonProgress: number;
  filteredClassWatchTime: { hours: number; minutes: number };
  filteredStreamStats: StreamStats;
}

export function EngagementCard({ isAcademy, isAdmin, filteredStudents, avgLessonProgress, filteredClassWatchTime, filteredStreamStats }: EngagementCardProps) {
  const attendancePct = filteredStreamStats.total > 0 && filteredStudents.length > 0 && filteredStreamStats.avgParticipants > 0
    ? Math.round((filteredStreamStats.avgParticipants / filteredStudents.length) * 100) : 0;
  return (
    <div className={`bg-white rounded-lg p-4 sm:p-6 border border-gray-200 shadow-sm h-full animate-fade-in ${isAcademy ? 'order-4 lg:order-2' : ''}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-3 sm:mb-6">Participación</h3>
      {filteredStudents.length > 0 ? (
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Progreso Promedio (Clases)</span>
              <span className="text-sm font-semibold text-gray-900">{avgLessonProgress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${avgLessonProgress}%`, transition: 'width 1s ease-out' }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Tiempo Total de Clases</span>
              <span className="text-sm font-semibold text-gray-900">
                {filteredClassWatchTime.hours > 0 || filteredClassWatchTime.minutes > 0 ? `${filteredClassWatchTime.hours}h ${filteredClassWatchTime.minutes}min` : '0h 0min'}
              </span>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Asistencia Promedio (Streams)</span>
              <span className="text-sm font-semibold text-gray-900">{attendancePct}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${Math.min(100, attendancePct)}%`, transition: 'width 1s ease-out' }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Tiempo Total de Streams</span>
              <span className="text-sm font-semibold text-gray-900">
                {filteredStreamStats.totalHours > 0 || filteredStreamStats.totalMinutes > 0 ? `${filteredStreamStats.totalHours}h ${filteredStreamStats.totalMinutes}min` : '0h 0min'}
              </span>
            </div>
          </div>
          {isAdmin && (
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Minutos Daily.co</span>
                <span className="text-sm font-semibold text-blue-700">
                  {filteredStreamStats.dailyCoHours > 0 || filteredStreamStats.dailyCoMinutes > 0 ? `${filteredStreamStats.dailyCoHours}h ${filteredStreamStats.dailyCoMinutes}min` : '0h 0min'}
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyState icon="chart" title="Sin datos de participación" subtitle="Espera a que los estudiantes se inscriban" />
      )}
    </div>
  );
}

// ─── Ratings Card ───
interface RatingsCardProps {
  isAcademy: boolean; isAdmin: boolean;
  ratingsData: RatingsData | null;
  selectedAcademy: string; selectedClass: string;
  activePeriodId: string; classes: Class[];
  isClassInPeriod: (startDate?: string) => boolean;
  paymentStatus: string;
}

export function RatingsCard({ isAcademy, isAdmin, ratingsData, selectedAcademy, selectedClass, activePeriodId, classes, isClassInPeriod, paymentStatus }: RatingsCardProps) {
  const emptyCard = (
    <div className={`bg-white rounded-lg p-4 sm:p-6 border border-gray-200 shadow-sm h-full ${isAcademy ? 'order-3 lg:order-3' : ''}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-3 sm:mb-6">Valoraciones</h3>
      <EmptyState icon="star" title="Sin valoraciones" subtitle="Las valoraciones de los estudiantes aparecerán aquí" />
    </div>
  );
  if (!ratingsData?.lessons) return emptyCard;

  let filteredLessons = ratingsData.lessons;
  if (isAdmin && selectedAcademy !== 'all') filteredLessons = filteredLessons.filter(l => l.academyId === selectedAcademy);
  if (selectedClass !== 'all') {
    filteredLessons = filteredLessons.filter(l => l.classId === selectedClass);
  } else if (isAcademy && activePeriodId !== 'all') {
    const periodClassIds = new Set(classes.filter(c => isClassInPeriod(c.startDate)).map(c => c.id));
    filteredLessons = filteredLessons.filter(l => periodClassIds.has(l.classId));
  }
  const totalRatings = filteredLessons.reduce((sum, l) => sum + l.ratingCount, 0);
  if (totalRatings === 0) return emptyCard;

  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  if (isAcademy && paymentStatus === 'NOT PAID') {
    const allDemoRatings = generateDemoRatings();
    const filtered = selectedClass === 'all' ? allDemoRatings : allDemoRatings.filter(r => r.classId === selectedClass);
    filtered.forEach(r => { ratingCounts[r.rating as 1|2|3|4|5]++; });
  } else {
    filteredLessons.forEach(l => {
      if (l.averageRating != null) {
        const avg = Math.round(l.averageRating);
        if (avg >= 1 && avg <= 5) ratingCounts[avg as 1|2|3|4|5] += l.ratingCount;
      }
    });
  }

  return (
    <div className={`bg-white rounded-lg p-4 sm:p-6 border border-gray-200 shadow-sm h-full ${isAcademy ? 'order-3 lg:order-3' : ''}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-3 sm:mb-6">Valoraciones</h3>
      <BarChart data={[
        { label: '1★', value: ratingCounts[1], color: '#ef4444' },
        { label: '2★', value: ratingCounts[2], color: '#f97316' },
        { label: '3★', value: ratingCounts[3], color: '#a3e635' },
        { label: '4★', value: ratingCounts[4], color: '#84cc16' },
        { label: '5★', value: ratingCounts[5], color: '#22c55e' },
      ]} />
    </div>
  );
}

// ─── Activity Card ───
interface ActivityCardProps {
  isAcademy: boolean;
  filteredStudents: EnrolledStudent[];
}

export function ActivityCard({ isAcademy, filteredStudents }: ActivityCardProps) {
  return (
    <div className={`bg-white rounded-lg p-4 sm:p-6 border border-gray-200 shadow-sm h-full flex flex-col ${isAcademy ? 'order-2 lg:order-4' : ''}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-3 sm:mb-6">Actividad</h3>
      {filteredStudents.length > 0 ? (
        <div className="flex-1 flex items-center justify-center min-h-40">
          <DonutChart data={(() => {
            const now = Date.now();
            const d1 = now - 86400000, d7 = now - 604800000, d30 = now - 2592000000;
            // Deduplicate by student id, keeping the most recent lastActive per student
            const studentMap = new Map<string, EnrolledStudent>();
            for (const s of filteredStudents) {
              const cur = studentMap.get(s.id);
              if (!cur || (s.lastActive ?? '') > (cur.lastActive ?? '')) studentMap.set(s.id, s);
            }
            const uniqueStudents = [...studentMap.values()];
            const activos = uniqueStudents.filter(s => s.lastActive && new Date(s.lastActive).getTime() >= d1).length;
            const a7 = uniqueStudents.filter(s => { if (!s.lastActive) return false; const t = new Date(s.lastActive).getTime(); return t < d1 && t >= d7; }).length;
            const a30 = uniqueStudents.filter(s => { if (!s.lastActive) return false; const t = new Date(s.lastActive).getTime(); return t < d7 && t >= d30; }).length;
            const inact = uniqueStudents.filter(s => !s.lastActive || new Date(s.lastActive).getTime() < d30).length;
            return [
              { label: 'Activos (<24h)', value: activos, color: '#22c55e' },
              { label: 'Activos 7d', value: a7, color: '#f97316' },
              { label: 'Activos 30d', value: a30, color: '#ef4444' },
              { label: 'Inactivos', value: inact, color: '#9ca3af' },
            ];
          })()} />
        </div>
      ) : (
        <EmptyState icon="bolt" title="Sin datos de actividad" subtitle="La actividad de los estudiantes se mostrará aquí" />
      )}
    </div>
  );
}
