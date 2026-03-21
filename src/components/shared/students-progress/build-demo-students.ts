import type { StudentProgress } from '../StudentsProgressTable';
import type { ClassBreakdownItem, DemoStudentAggregate } from './types';
import { DEMO_CLASS_NAME_TO_ID, DEMO_CLASS_TEACHER } from './constants';
import { generateDemoStudents } from '@/lib/demo-data';

export function buildDemoStudentProgress(): StudentProgress[] {
  const demoStudents = generateDemoStudents();
  const studentMap = new Map<string, DemoStudentAggregate>();

  demoStudents.forEach((s, index) => {
    const key = `${s.firstName}-${s.lastName}`;
    const classId = DEMO_CLASS_NAME_TO_ID[s.className] || 'demo-c1';

    if (!studentMap.has(key)) {
      studentMap.set(key, {
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.email,
        classes: [s.className],
        classIds: [classId],
        lastLoginAt: s.lastLoginAt,
        watchTimeBase: index,
        perClassTeachers: [DEMO_CLASS_TEACHER[classId] || 'Carlos Rodríguez'],
      });
    } else {
      const existing = studentMap.get(key);
      if (existing) {
        if (!existing.classes.includes(s.className)) {
          existing.classes.push(s.className);
          existing.classIds.push(classId);
          existing.perClassTeachers.push(DEMO_CLASS_TEACHER[classId] || 'Carlos Rodríguez');
        }
        if (s.lastLoginAt && (!existing.lastLoginAt || new Date(s.lastLoginAt) > new Date(existing.lastLoginAt))) {
          existing.lastLoginAt = s.lastLoginAt;
        }
      }
    }
  });

  return Array.from(studentMap.values()).map((student, index) => {
    const teacherName = DEMO_CLASS_TEACHER[student.classIds[0]] || 'Carlos Rodríguez';
    // Deterministic watch time based on index (no Math.random)
    const totalWatchTime = student.watchTimeBase === 0 ? 90000 :
      student.watchTimeBase % 3 === 0 ? ((index * 1234 + 567) % 3600) :
      student.watchTimeBase % 5 === 0 ? ((index * 2345 + 678) % 18000) :
      student.watchTimeBase % 7 === 0 ? ((index * 3456 + 789) % 36000) :
      ((index * 4567 + 890) % 7200);
    const videosWatched = (index * 7 + 3) % 15;
    const totalVideos = 20;

    // Only these 4 student indices are BEHIND (everyone else is UP_TO_DATE)
    // This must match the same set in demo-data.ts generateDemoPendingPayments()
    const BEHIND_INDICES = new Set([2, 7, 15, 22]);
    const isBehind = BEHIND_INDICES.has(index);
    // Demo: assign 1-3 months behind for BEHIND students
    const demoMonthsBehind = isBehind ? (index % 3) + 1 : 0;

    // Demo suspicion counts for a few students
    const SUSPICION_INDICES: Record<number, number> = { 1: 3, 5: 1, 12: 2, 18: 5, 24: 1 };
    const demoSuspicionCount = SUSPICION_INDICES[index] ?? 0;

    // Build per-class breakdown if student is in multiple classes
    let classBreakdown: ClassBreakdownItem[] | undefined;
    if (student.classes.length > 1) {
      classBreakdown = student.classes.map((cls, ci) => {
        const clsMax = Math.floor(totalVideos / student.classes.length);
        const clsVideos = clsMax > 0 ? ((index * 3 + ci * 5 + 2) % (clsMax + 1)) : 0;
        const clsTime = Math.floor(totalWatchTime / student.classes.length) + ((index * 137 + ci * 89) % 600);
        // For BEHIND students, mark their first class as BEHIND
        const classPaymentStatus: 'UP_TO_DATE' | 'BEHIND' = (isBehind && ci === 0) ? 'BEHIND' : 'UP_TO_DATE';
        const classMonthsBehind = (isBehind && ci === 0) ? demoMonthsBehind : 0;
        return {
          className: cls,
          classId: student.classIds[ci],
          enrollmentId: `demo-enroll-${student.id}-${student.classIds[ci]}`,
          teacherName: student.perClassTeachers[ci] || DEMO_CLASS_TEACHER[student.classIds[ci]] || 'Carlos Rodríguez',
          totalWatchTime: clsTime,
          videosWatched: clsVideos,
          totalVideos: clsMax,
          lastActive: student.lastLoginAt ?? null,
          paymentStatus: classPaymentStatus,
          monthsBehind: classMonthsBehind,
        };
      });
    }

    // Demo payment status for aggregate
    const aggregateStatus: 'UP_TO_DATE' | 'BEHIND' = isBehind ? 'BEHIND' : 'UP_TO_DATE';

    return {
      id: student.id,
      name: `${student.firstName} ${student.lastName}`,
      email: student.email,
      className: student.classes.length === 1 ? student.classes[0] : `${student.classes.length} asignaturas`,
      classId: student.classIds[0],
      enrollmentId: `demo-enroll-${student.id}-${student.classIds[0]}`,
      teacherName,
      totalWatchTime,
      videosWatched,
      totalVideos,
      lastActive: student.lastLoginAt ?? null,
      classBreakdown,
      paymentStatus: aggregateStatus,
      monthsBehind: demoMonthsBehind,
      suspicionCount: demoSuspicionCount,
    };
  });
}
