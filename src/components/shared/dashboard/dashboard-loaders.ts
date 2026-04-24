import { apiClient } from '@/lib/api-client';
import {
  generateDemoStudents, generateDemoStats, generateDemoStreams, generateDemoClasses,
  generateDemoPendingPayments, generateDemoPaymentHistory, generateDemoLessonRatings,
} from '@/lib/demo-data';
import type {
  Academy, Class, EnrolledStudent, PendingEnrollment, RatingsData,
  StreamRecord, PaymentHistoryItem, StudentPaymentStatus,
} from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeFetch(path: string): Promise<any> {
  try {
    const res = await apiClient(path);
    return await res.json();
  } catch {
    console.warn(`[Dashboard] Failed to fetch ${path}`);
    return { success: false };
  }
}

export interface DashboardLoadResult {
  academyInfo?: { id: string; name: string; paymentStatus?: string } | null;
  paymentStatus: string;
  classes: Class[];
  enrolledStudents: EnrolledStudent[];
  pendingEnrollments: PendingEnrollment[];
  ratingsData: RatingsData | null;
  rejectedCount: number;
  allStreams: StreamRecord[];
  classWatchTime: { hours: number; minutes: number };
  allCompletedPayments: PaymentHistoryItem[];
  studentPaymentStatus: StudentPaymentStatus;
  academies: Academy[];
}

const defaultResult: DashboardLoadResult = {
  paymentStatus: 'NOT PAID', classes: [], enrolledStudents: [], pendingEnrollments: [],
  ratingsData: null, rejectedCount: 0, allStreams: [],
  classWatchTime: { hours: 0, minutes: 0 }, allCompletedPayments: [],
  studentPaymentStatus: { alDia: 0, atrasados: 0, total: 0, uniqueAlDia: 0, uniqueAtrasados: 0, uniqueTotal: 0 },
  academies: [],
};

function buildDemoState(): Partial<DashboardLoadResult> {
  void generateDemoStats(); // referenced in original
  const demoStudents = generateDemoStudents();
  const demoStreams = generateDemoStreams();
  const demoClasses = generateDemoClasses();
  const classNameToId: Record<string, string> = {
    'Programación Web': 'demo-c1', 'Matemáticas Avanzadas': 'demo-c2',
    'Física Cuántica': 'demo-c4', 'Diseño Gráfico': 'demo-c3',
  };
  const classes: Class[] = (demoClasses || []).map(c => ({
    id: c.id, name: c.name, description: c.description,
    slug: c.name.toLowerCase().replace(/\s+/g, '-'),
    academyName: 'Mi Academia Demo', enrollmentCount: c.studentCount,
  }));
  const seen = new Set<string>();
  const enrolledStudents: EnrolledStudent[] = (demoStudents || []).map(s => ({
    id: s.id, name: `${s.firstName} ${s.lastName}`, email: s.email,
    classId: classNameToId[s.className] || 'demo-c1', className: s.className,
    lessonsCompleted: Math.floor(Math.random() * 5) + 2, totalLessons: 10, lastActive: s.lastLoginAt,
  })).filter(s => { const k = `${s.email}__${s.classId}`; if (seen.has(k)) return false; seen.add(k); return true; });
  const ratingsData = generateDemoLessonRatings();
  const totalMin = [{ h: 15, m: 45 }, { h: 12, m: 30 }, { h: 10, m: 15 }, { h: 7, m: 0 }]
    .reduce((s, d) => s + d.h * 60 + d.m, 0);
  const demoHistory = generateDemoPaymentHistory();
  const allCompletedPayments: PaymentHistoryItem[] = demoHistory
    .filter(p => p.paymentStatus === 'PAID')
    .map(p => ({ paymentStatus: p.paymentStatus, paymentAmount: p.paymentAmount, paymentMethod: p.paymentMethod, classId: p.classId }));
  const demoPending = generateDemoPendingPayments();
  const pendingEnrollments: PendingEnrollment[] = demoPending.map((p, i) => ({
    id: `demo-pending-${i + 1}`,
    student: { id: `demo-sp-${i + 1}`, firstName: p.studentFirstName, lastName: p.studentLastName, email: p.studentEmail },
    class: { id: classNameToId[p.className] || 'demo-c1', name: p.className },
    enrolledAt: p.createdAt,
  }));
  return {
    classes, enrolledStudents, pendingEnrollments, ratingsData,
    rejectedCount: demoHistory.filter(p => p.paymentStatus === 'REJECTED').length,
    allStreams: demoStreams,
    classWatchTime: { hours: Math.floor(totalMin / 60), minutes: totalMin % 60 },
    allCompletedPayments,
    studentPaymentStatus: { alDia: 8, atrasados: 3, total: 11, uniqueAlDia: 6, uniqueAtrasados: 2, uniqueTotal: 8 },
  };
}

export async function fetchAcademyData(): Promise<DashboardLoadResult> {
  const result: DashboardLoadResult = { ...defaultResult };
  const summaryResult = await safeFetch('/dashboard/summary');

  // If the academy hasn't paid, fall back to demo data
  if (summaryResult.success && summaryResult.data) {
    const data = summaryResult.data;
    if (data.paymentStatus === 'NOT PAID') {
      result.academyInfo = data.academyInfo ?? null;
      result.paymentStatus = 'NOT PAID';
      return { ...result, ...buildDemoState() };
    }
    result.academyInfo = data.academyInfo ?? null;
    result.paymentStatus = data.paymentStatus || 'NOT PAID';
    result.classes = data.classes || [];
    result.enrolledStudents = data.enrolledStudents || [];
    result.pendingEnrollments = data.pendingEnrollments || [];
    result.ratingsData = data.ratingsData ?? null;
    result.rejectedCount = data.rejectedCount || 0;
    result.allStreams = data.allStreams || [];
    result.classWatchTime = data.classWatchTime || { hours: 0, minutes: 0 };
    result.allCompletedPayments = data.allCompletedPayments || [];
    result.studentPaymentStatus = data.studentPaymentStatus || defaultResult.studentPaymentStatus;
  }
  return result;
}

export async function fetchAdminData(): Promise<DashboardLoadResult> {
  const result: DashboardLoadResult = { ...defaultResult, paymentStatus: 'PAID' };
  const summaryResult = await safeFetch('/dashboard/summary');

  if (summaryResult.success && summaryResult.data) {
    const data = summaryResult.data;
    result.classes = data.classes || [];
    result.enrolledStudents = data.enrolledStudents || [];
    result.pendingEnrollments = data.pendingEnrollments || [];
    result.ratingsData = data.ratingsData ?? null;
    result.rejectedCount = data.rejectedCount || 0;
    result.allStreams = data.allStreams || [];
    result.classWatchTime = data.classWatchTime || { hours: 0, minutes: 0 };
    result.allCompletedPayments = data.allCompletedPayments || [];
    result.studentPaymentStatus = data.studentPaymentStatus || defaultResult.studentPaymentStatus;
    if (Array.isArray(data.academies) && data.academies.length > 0) {
      result.academies = data.academies;
    }
  }
  return result;
}
