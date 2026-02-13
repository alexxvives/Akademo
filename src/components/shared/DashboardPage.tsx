'use client';

import { useEffect, useState, useMemo } from 'react';
import { BarChart, DonutChart } from '@/components/Charts';
import { apiClient } from '@/lib/api-client';
import { useAnimatedNumber } from '@/hooks';
import {
  generateDemoStudents, generateDemoStats, generateDemoStreams, generateDemoClasses,
  generateDemoPendingPayments, generateDemoPaymentHistory, generateDemoRatings, generateDemoLessonRatings,
} from '@/lib/demo-data';
import { SkeletonDashboard } from '@/components/ui/SkeletonLoader';

// ─── Types ───
interface Academy { id: string; name: string; ownerName: string; ownerEmail: string; status: string; paymentStatus?: string; teacherCount: number; studentCount: number; classCount: number; createdAt: string; }
interface Class { id: string; name: string; slug?: string | null; description: string | null; academyId?: string; academyName: string; teacherFirstName?: string; teacherLastName?: string; enrollmentCount: number; }
interface EnrolledStudent { id: string; name: string; email: string; classId: string; className: string; academyId?: string; lessonsCompleted?: number; totalLessons?: number; lastActive?: string | null; }
interface PendingEnrollment { id: string; student: { id: string; firstName: string; lastName: string; email: string }; class: { id: string; name: string; academyId?: string }; enrolledAt: string; }
interface RatingsData { overall: { averageRating: number | null; totalRatings: number; ratedLessons: number }; lessons: Array<{ lessonId: string; lessonTitle: string; className: string; classId: string; academyId?: string; averageRating: number | null; ratingCount: number }>; }
interface StreamRecord { classId?: string | null; participantCount?: number | null; startedAt?: string | null; endedAt?: string | null; createdAt?: string | null; academyId?: string; }
interface ProgressRecord { id: string; firstName: string; lastName: string; email: string; classId: string; className: string; academyId?: string; lessonsCompleted?: number | null; totalLessons?: number | null; lastActive?: string | null; totalWatchTime?: number | null; }
interface PaymentHistoryItem { paymentStatus?: string | null; amount?: number | null; paymentMethod?: string | null; classId?: string | null; }
interface EnrollmentRecord { student: { id: string; firstName: string; lastName: string; email: string } }

// ─── Animated helpers ───
function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const animatedValue = useAnimatedNumber(value);
  return <div className={className}>{animatedValue.toLocaleString('es-ES')}</div>;
}
function AnimatedCurrency({ value, className }: { value: number; className?: string }) {
  const animatedCents = useAnimatedNumber(Math.round(value * 100));
  const display = new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(animatedCents / 100);
  return <div className={className}>{display}€</div>;
}

interface DashboardPageProps { role: 'ACADEMY' | 'ADMIN'; }

export function DashboardPage({ role }: DashboardPageProps) {
  const isAcademy = role === 'ACADEMY';
  const isAdmin = role === 'ADMIN';

  // Shared state
  const [classes, setClasses] = useState<Class[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [pendingEnrollments, setPendingEnrollments] = useState<PendingEnrollment[]>([]);
  const [ratingsData, setRatingsData] = useState<RatingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [allStreams, setAllStreams] = useState<StreamRecord[]>([]);
  const [classWatchTime, setClassWatchTime] = useState({ hours: 0, minutes: 0 });
  const [selectedClass, setSelectedClass] = useState('all');

  // Academy-only state
  const [academyInfo, setAcademyInfo] = useState<{ id: string; name: string; paymentStatus?: string } | null>(null);
  const [paymentStatus, setPaymentStatus] = useState('NOT PAID');
  const [allCompletedPayments, setAllCompletedPayments] = useState<PaymentHistoryItem[]>([]);

  // Admin-only state
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [selectedAcademy, setSelectedAcademy] = useState('all');
  const [academyClasses, setAcademyClasses] = useState<Class[]>([]);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (isAdmin) {
      if (selectedAcademy !== 'all') {
        setAcademyClasses(classes.filter(c => c.academyId === selectedAcademy));
        setSelectedClass('all');
      } else {
        setAcademyClasses(classes);
      }
    }
  }, [selectedAcademy, classes, isAdmin]);

  const loadData = async () => {
    try {
      if (isAcademy) await loadAcademyData();
      else await loadAdminData();
    } catch (error) {
      console.error('❌ Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ─── Academy data loading ───
  const loadAcademyData = async () => {
    const [academiesRes, classesRes, pendingRes, ratingsRes, rejectedRes, streamsRes, progressRes, paymentsRes] = await Promise.all([
      apiClient('/academies'), apiClient('/academies/classes'), apiClient('/enrollments/pending'),
      apiClient('/ratings'), apiClient('/enrollments/rejected'), apiClient('/live/history'),
      apiClient('/students/progress'), apiClient('/payments/history'),
    ]);
    const [academiesResult, classesResult, pendingResult, ratingsResult, rejectedResult, streamsResult, progressResult, paymentsResult] = await Promise.all([
      academiesRes.json(), classesRes.json(), pendingRes.json(), ratingsRes.json(),
      rejectedRes.json(), streamsRes.json(), progressRes.json(), paymentsRes.json(),
    ]);

    if (academiesResult.success && Array.isArray(academiesResult.data) && academiesResult.data.length > 0) {
      const academy = academiesResult.data[0];
      setAcademyInfo(academy);
      setPaymentStatus(academy.paymentStatus || 'NOT PAID');
      if (academy.paymentStatus === 'NOT PAID') {
        loadDemoData();
        return;
      }
    }

    if (rejectedResult.success && rejectedResult.data) setRejectedCount(rejectedResult.data.count || 0);
    if (paymentsResult.success && Array.isArray(paymentsResult.data)) {
      const completed = (paymentsResult.data as PaymentHistoryItem[]).filter(p => p.paymentStatus === 'COMPLETED' || p.paymentStatus === 'PAID');
      setAllCompletedPayments(completed);
    }
    if (streamsResult.success && Array.isArray(streamsResult.data)) setAllStreams(streamsResult.data);
    if (progressResult.success && Array.isArray(progressResult.data)) {
      const totalSeconds = (progressResult.data as ProgressRecord[]).reduce((sum, s) => sum + (s.totalWatchTime ?? 0), 0);
      const totalMin = Math.floor(totalSeconds / 60);
      setClassWatchTime({ hours: Math.floor(totalMin / 60), minutes: totalMin % 60 });
    }
    if (pendingResult.success && Array.isArray(pendingResult.data)) setPendingEnrollments(pendingResult.data);
    if (ratingsResult.success) setRatingsData(ratingsResult.data);
    if (classesResult.success && Array.isArray(classesResult.data)) {
      setClasses(classesResult.data);
      if (progressResult.success && Array.isArray(progressResult.data)) {
        setEnrolledStudents((progressResult.data as ProgressRecord[]).map(s => ({
          id: s.id, name: `${s.firstName} ${s.lastName}`, email: s.email,
          classId: s.classId, className: s.className,
          lessonsCompleted: s.lessonsCompleted ?? 0, totalLessons: s.totalLessons ?? 0, lastActive: s.lastActive,
        })));
      } else {
        const responses = await Promise.all(classesResult.data.map((cls: Class) => apiClient(`/enrollments?classId=${cls.id}`).then(r => r.json())));
        const all: EnrolledStudent[] = [];
        classesResult.data.forEach((cls: Class, i: number) => {
          const d = responses[i] as { success?: boolean; data?: EnrollmentRecord[] };
          if (d.success && Array.isArray(d.data)) {
            all.push(...d.data.map(e => ({ id: e.student.id, name: `${e.student.firstName} ${e.student.lastName}`, email: e.student.email, classId: cls.id, className: cls.name, lessonsCompleted: 0, totalLessons: 0, lastActive: null })));
          }
        });
        setEnrolledStudents(all);
      }
    }
  };

  const loadDemoData = () => {
    const demoStats = generateDemoStats();
    const demoStudents = generateDemoStudents();
    const demoStreams = generateDemoStreams();
    const demoClasses = generateDemoClasses();
    void demoStats; // used for reference constants
    setClasses((demoClasses || []).map(c => ({ id: c.id, name: c.name, description: c.description, slug: c.name.toLowerCase().replace(/\s+/g, '-'), academyName: 'Mi Academia Demo', enrollmentCount: c.studentCount })));
    const classNameToId: Record<string, string> = { 'Programación Web': 'demo-c1', 'Matemáticas Avanzadas': 'demo-c2', 'Física Cuántica': 'demo-c4', 'Diseño Gráfico': 'demo-c3' };
    const seen = new Set<string>();
    setEnrolledStudents((demoStudents || []).map(s => ({
      id: s.id, name: `${s.firstName} ${s.lastName}`, email: s.email,
      classId: classNameToId[s.className] || 'demo-c1', className: s.className,
      lessonsCompleted: Math.floor(Math.random() * 5) + 2, totalLessons: 10, lastActive: s.lastLoginAt,
    })).filter(s => { const k = `${s.email}__${s.classId}`; if (seen.has(k)) return false; seen.add(k); return true; }));
    setRatingsData(generateDemoLessonRatings());
    const totalMin = [{ h: 15, m: 45 }, { h: 12, m: 30 }, { h: 10, m: 15 }, { h: 7, m: 0 }].reduce((s, d) => s + d.h * 60 + d.m, 0);
    setClassWatchTime({ hours: Math.floor(totalMin / 60), minutes: totalMin % 60 });
    const demoPending = generateDemoPendingPayments();
    const demoHistory = generateDemoPaymentHistory();
    setAllCompletedPayments(demoHistory.filter(p => p.paymentStatus === 'PAID').map(p => ({ paymentStatus: p.paymentStatus, amount: p.paymentAmount, paymentMethod: p.paymentMethod, classId: p.classId })));
    setPendingEnrollments(demoPending.map((p, i) => ({
      id: `demo-pending-${i + 1}`, student: { id: `demo-sp-${i + 1}`, firstName: p.studentFirstName, lastName: p.studentLastName, email: p.studentEmail },
      class: { id: classNameToId[p.className] || 'demo-c1', name: p.className }, enrolledAt: p.createdAt,
    })));
    setRejectedCount(demoHistory.filter(p => p.paymentStatus === 'REJECTED').length);
    setAllStreams(demoStreams);
  };

  // ─── Admin data loading ───
  const loadAdminData = async () => {
    const [academiesRes, classesRes, pendingRes, ratingsRes, rejectedRes, streamsRes, progressRes] = await Promise.all([
      apiClient('/admin/academies'), apiClient('/admin/classes'), apiClient('/enrollments/pending'),
      apiClient('/ratings'), apiClient('/enrollments/rejected'), apiClient('/live/history'), apiClient('/students/progress'),
    ]);
    const [academiesResult, classesResult, pendingResult, ratingsResult, rejectedResult, streamsResult, progressResult] = await Promise.all([
      academiesRes.json(), classesRes.json(), pendingRes.json(), ratingsRes.json(), rejectedRes.json(), streamsRes.json(), progressRes.json(),
    ]);
    if (academiesResult.success && Array.isArray(academiesResult.data)) setAcademies(academiesResult.data);
    if (rejectedResult.success && rejectedResult.data) setRejectedCount(rejectedResult.data.count || 0);
    if (streamsResult.success && Array.isArray(streamsResult.data)) setAllStreams(streamsResult.data);
    if (progressResult.success && Array.isArray(progressResult.data)) {
      const totalSeconds = (progressResult.data as ProgressRecord[]).reduce((sum, s) => sum + (s.totalWatchTime ?? 0), 0);
      const totalMin = Math.floor(totalSeconds / 60);
      setClassWatchTime({ hours: Math.floor(totalMin / 60), minutes: totalMin % 60 });
    }
    if (pendingResult.success && Array.isArray(pendingResult.data)) setPendingEnrollments(pendingResult.data);
    if (ratingsResult.success) setRatingsData(ratingsResult.data);
    if (classesResult.success && Array.isArray(classesResult.data)) setClasses(classesResult.data);
    if (progressResult.success && Array.isArray(progressResult.data)) {
      setEnrolledStudents((progressResult.data as ProgressRecord[]).map(s => ({
        id: s.id, name: `${s.firstName} ${s.lastName}`, email: s.email,
        classId: s.classId, className: s.className || 'Sin clase', academyId: s.academyId,
        lessonsCompleted: s.lessonsCompleted ?? 0, totalLessons: s.totalLessons ?? 0, lastActive: s.lastActive,
      })));
    }
  };

  // ─── Computed values ───
  const filteredStudents = useMemo(() => {
    let filtered = enrolledStudents;
    if (isAdmin && selectedAcademy !== 'all') filtered = filtered.filter(s => s.academyId === selectedAcademy);
    if (selectedClass !== 'all') filtered = filtered.filter(s => s.classId === selectedClass);
    return filtered;
  }, [enrolledStudents, selectedAcademy, selectedClass, isAdmin]);

  const uniqueStudentCount = useMemo(() => new Set(filteredStudents.map(s => s.email)).size, [filteredStudents]);

  const avgLessonProgress = useMemo(() => {
    if (filteredStudents.length === 0) return 0;
    const withLessons = filteredStudents.filter(s => s.totalLessons && s.totalLessons > 0);
    if (withLessons.length === 0) return 0;
    const total = withLessons.reduce((sum, s) => sum + (s.lessonsCompleted || 0) / (s.totalLessons || 1), 0);
    return Math.round((total / withLessons.length) * 100);
  }, [filteredStudents]);

  const filteredStreamStats = useMemo(() => {
    let filtered = allStreams;
    if (isAdmin && selectedAcademy !== 'all') filtered = filtered.filter(s => s.academyId === selectedAcademy);
    if (selectedClass !== 'all') filtered = filtered.filter(s => s.classId === selectedClass);
    if (filtered.length === 0) return { avgParticipants: 0, total: 0, totalHours: 0, totalMinutes: 0 };
    const withP = filtered.filter(s => s.participantCount != null && s.participantCount > 0);
    const totalP = withP.reduce((sum, s) => sum + (s.participantCount || 0), 0);
    const totalMs = filtered.reduce((sum, s) => {
      if (s.startedAt && s.endedAt) return sum + (new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime());
      return sum;
    }, 0);
    const totalMin = Math.floor(totalMs / (1000 * 60));
    return { avgParticipants: withP.length > 0 ? Math.round(totalP / withP.length) : 0, total: filtered.length, totalHours: Math.floor(totalMin / 60), totalMinutes: totalMin % 60 };
  }, [allStreams, selectedAcademy, selectedClass, isAdmin]);

  const paymentStats = useMemo(() => {
    if (!isAcademy) return { totalPaid: 0, bizumCount: 0, cashCount: 0, stripeCount: 0 };
    const filtered = selectedClass === 'all' ? allCompletedPayments : allCompletedPayments.filter(p => p.classId === selectedClass);
    return {
      totalPaid: filtered.reduce((sum, p) => sum + (p.amount ?? 0), 0),
      bizumCount: filtered.filter(p => p.paymentMethod === 'bizum').length,
      cashCount: filtered.filter(p => p.paymentMethod === 'cash').length,
      stripeCount: filtered.filter(p => p.paymentMethod === 'stripe').length,
    };
  }, [allCompletedPayments, selectedClass, isAcademy]);

  const filteredClassWatchTime = useMemo(() => {
    if (isAcademy && paymentStatus === 'NOT PAID') {
      const demoData = [
        { classId: 'demo-c1', hours: 7, minutes: 54 }, { classId: 'demo-c2', hours: 5, minutes: 55 },
        { classId: 'demo-c3', hours: 1, minutes: 58 }, { classId: 'demo-c4', hours: 0, minutes: 0 },
      ];
      if (selectedClass === 'all') return { hours: 15, minutes: 45 };
      return demoData.find(d => d.classId === selectedClass) || { hours: 0, minutes: 0 };
    }
    return classWatchTime;
  }, [selectedClass, classWatchTime, paymentStatus, isAcademy]);

  if (loading) return <SkeletonDashboard />;

  // ─── Render ───
  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Panel de Control</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isAcademy ? (academyInfo?.name || '') : 'AKADEMO PLATFORM'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Admin: class filter (only when academy selected) */}
          {isAdmin && selectedAcademy !== 'all' && (
            <div className="relative">
              <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}
                className="appearance-none w-full md:w-56 pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent">
                <option value="all">Todas las clases</option>
                {academyClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          )}
          {/* Admin: academy filter */}
          {isAdmin && academies.length > 0 && (
            <div className="relative">
              <select value={selectedAcademy} onChange={(e) => setSelectedAcademy(e.target.value)}
                className="appearance-none w-full md:w-56 pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent">
                <option value="all">Todas las Academias</option>
                {academies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          )}
          {/* Academy: class filter */}
          {isAcademy && classes.length > 0 && (
            <div className="relative">
              <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}
                className="appearance-none w-full md:w-56 pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent">
                <option value="all">Todas las asignaturas</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2×2 Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderEngagementCard()}
        {renderStudentsCard()}
        {renderRatingsCard()}
        {renderActivityCard()}
      </div>
    </div>
  );

  // ─── Card: Participación ───
  function renderEngagementCard() {
    const attendancePct = filteredStreamStats.total > 0 && filteredStudents.length > 0 && filteredStreamStats.avgParticipants > 0
      ? Math.round((filteredStreamStats.avgParticipants / filteredStudents.length) * 100) : 0;
    return (
      <div className={`bg-white rounded-lg p-4 sm:p-6 border border-gray-200 shadow-sm h-full animate-fade-in ${isAcademy ? 'order-4 lg:order-1' : ''}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-3 sm:mb-6">Participación</h3>
        {filteredStudents.length > 0 ? (
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
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${Math.min(100, attendancePct)}%`, animation: 'slideIn 1s ease-out 0.1s backwards' }} />
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
            <style jsx>{`@keyframes slideIn { from { width: 0; } }`}</style>
          </div>
        ) : (
          <EmptyState icon="chart" title="Sin datos de participación" subtitle="Espera a que los estudiantes se inscriban" />
        )}
      </div>
    );
  }

  // ─── Card: Estudiantes ───
  function renderStudentsCard() {
    const hasData = filteredStudents.length > 0 || pendingEnrollments.length > 0 || rejectedCount > 0;
    return (
      <div className={`bg-white rounded-lg p-4 sm:p-6 border border-gray-200 shadow-sm h-full ${isAcademy ? 'order-1 lg:order-2' : ''}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-3 sm:mb-6">Estudiantes</h3>
        {hasData ? (
          isAcademy ? renderAcademyStudentsContent() : renderAdminStudentsContent()
        ) : (
          <EmptyState icon="users" title="Sin estudiantes" subtitle="Cuando los estudiantes se inscriban aparecerán aquí" />
        )}
      </div>
    );
  }

  function renderAcademyStudentsContent() {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <AnimatedNumber value={uniqueStudentCount} className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1" />
              <div className="text-xs text-gray-500">Estudiantes</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <AnimatedNumber value={filteredStudents.length} className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1" />
              <div className="text-xs text-gray-500">Matrículas</div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <AnimatedCurrency value={paymentStats.totalPaid} className="text-3xl sm:text-4xl font-bold text-green-700 mb-1" />
              <div className="text-xs text-gray-500">Total Cobrado</div>
            </div>
            <div className="flex items-center justify-center gap-3 p-3 bg-gray-50 rounded-lg">
              {[{ label: 'Bizum', value: paymentStats.bizumCount }, { label: 'Efectivo', value: paymentStats.cashCount }, { label: 'Stripe', value: paymentStats.stripeCount }].map(m => (
                <div key={m.label} className="text-center min-w-[60px]">
                  <div className="text-xs text-gray-500 mb-0.5">{m.label}</div>
                  <AnimatedNumber value={m.value} className="text-lg font-bold text-gray-900" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderAdminStudentsContent() {
    const filteredPending = selectedClass !== 'all'
      ? pendingEnrollments.filter(p => p.class.id === selectedClass)
      : selectedAcademy !== 'all'
        ? pendingEnrollments.filter(p => p.class.academyId === selectedAcademy)
        : pendingEnrollments;
    const filteredRejected = selectedClass === 'all' && selectedAcademy === 'all'
      ? rejectedCount
      : Math.round(rejectedCount * (filteredStudents.length / (enrolledStudents.length || 1)));
    return (
      <div className="space-y-6">
        <div className="text-center">
          <AnimatedNumber value={filteredStudents.length} className="text-3xl sm:text-5xl font-bold text-gray-900 mb-2" />
          <div className="text-sm text-gray-500">{selectedClass === 'all' ? 'Número de matriculados' : 'matriculados en esta clase'}</div>
        </div>
        <div className="flex justify-between gap-4 pt-4 border-t border-gray-100">
          <TooltipStat value={Math.ceil(filteredStudents.length * 1.05)} color="green" label="aceptados" tooltip="Estudiantes aprobados (5% más que matriculados)" />
          <TooltipStat value={filteredPending.length} color="amber" label="pendientes" tooltip="Esperando aprobación" />
          <TooltipStat value={filteredRejected} color="red" label="rechazados" tooltip="Solicitudes rechazadas" />
        </div>
      </div>
    );
  }

  // ─── Card: Valoraciones ───
  function renderRatingsCard() {
    if (!ratingsData?.lessons) {
      return <div className={`bg-white rounded-lg p-4 sm:p-6 border border-gray-200 shadow-sm h-full ${isAcademy ? 'order-3 lg:order-3' : ''}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-3 sm:mb-6">Valoraciones</h3>
        <EmptyState icon="star" title="Sin valoraciones" subtitle="Las valoraciones de los estudiantes aparecerán aquí" />
      </div>;
    }

    let filteredLessons = ratingsData.lessons;
    if (isAdmin && selectedAcademy !== 'all') filteredLessons = filteredLessons.filter(l => l.academyId === selectedAcademy);
    if (selectedClass !== 'all') filteredLessons = filteredLessons.filter(l => l.classId === selectedClass);
    const totalRatings = filteredLessons.reduce((sum, l) => sum + l.ratingCount, 0);

    if (totalRatings === 0) {
      return <div className={`bg-white rounded-lg p-4 sm:p-6 border border-gray-200 shadow-sm h-full ${isAcademy ? 'order-3 lg:order-3' : ''}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-3 sm:mb-6">Valoraciones</h3>
        <EmptyState icon="star" title="Sin valoraciones" subtitle="Las valoraciones de los estudiantes aparecerán aquí" />
      </div>;
    }

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

  // ─── Card: Actividad ───
  function renderActivityCard() {
    return (
      <div className={`bg-white rounded-lg p-4 sm:p-6 border border-gray-200 shadow-sm h-full flex flex-col ${isAcademy ? 'order-2 lg:order-4' : ''}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-3 sm:mb-6">Actividad</h3>
        {filteredStudents.length > 0 ? (
          <div className="flex-1 flex items-center justify-center min-h-40">
            <DonutChart data={(() => {
              const now = Date.now();
              const d1 = now - 86400000, d7 = now - 604800000, d30 = now - 2592000000;
              const activos = filteredStudents.filter(s => s.lastActive && new Date(s.lastActive).getTime() >= d1).length;
              const a7 = filteredStudents.filter(s => { if (!s.lastActive) return false; const t = new Date(s.lastActive).getTime(); return t < d1 && t >= d7; }).length;
              const a30 = filteredStudents.filter(s => { if (!s.lastActive) return false; const t = new Date(s.lastActive).getTime(); return t < d7 && t >= d30; }).length;
              const inact = filteredStudents.filter(s => !s.lastActive || new Date(s.lastActive).getTime() < d30).length;
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
}

// ─── Shared sub-components ───
function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  const paths: Record<string, string> = {
    chart: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    users: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    star: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
    bolt: 'M13 10V3L4 14h7v7l9-11h-7z',
  };
  return (
    <div className="flex flex-col items-center justify-center h-40 text-gray-400">
      <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={paths[icon] || paths.chart} />
      </svg>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
    </div>
  );
}

function TooltipStat({ value, color, label, tooltip }: { value: number; color: string; label: string; tooltip: string }) {
  const colorClass = color === 'green' ? 'text-green-600' : color === 'amber' ? 'text-amber-600' : 'text-red-600';
  return (
    <div className={`flex-1 text-center group/stat relative cursor-help`}>
      <AnimatedNumber value={value} className={`text-lg sm:text-2xl font-bold ${colorClass}`} />
      <div className="text-xs text-gray-500">{label}</div>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-slate-200 text-xs rounded-lg shadow-xl border border-slate-700 opacity-0 invisible group-hover/stat:opacity-100 group-hover/stat:visible transition-all duration-200 whitespace-nowrap z-20">
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-slate-800 border-b border-r border-slate-700 rotate-45"></div>
        {tooltip}
      </div>
    </div>
  );
}
