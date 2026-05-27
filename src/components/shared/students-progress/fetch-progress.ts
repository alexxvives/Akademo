import { apiClient } from '@/lib/api-client';
import type { StudentProgress } from '../StudentsProgressTable';
import type { Academy, Class, ClassBreakdownItem, StudentProgressApiRecord, StudentProgressAggregate } from './types';
import { computePaymentStatus } from './constants';

interface ProgressResult {
  academies: Academy[];
  classes: Class[];
  students: StudentProgress[];
}

export async function fetchStudentProgress(role: 'TEACHER' | 'ACADEMY' | 'ADMIN'): Promise<ProgressResult> {
  const result: ProgressResult = { academies: [], classes: [], students: [] };

  // Load academies if ADMIN (only paid/onboarded ones)
  if (role === 'ADMIN') {
    const academiesRes = await apiClient('/admin/academies');
    const academiesData = await academiesRes.json();
    if (academiesData.success && Array.isArray(academiesData.data)) {
      result.academies = academiesData.data.filter((a: { paymentStatus?: string }) => a.paymentStatus === 'PAID');
    }
  }

  // Load classes
  const classesEndpoint = role === 'ADMIN' ? '/admin/classes' : role === 'TEACHER' ? '/classes' : '/academies/classes';
  const classesRes = await apiClient(classesEndpoint);
  const classesData = await classesRes.json();
  if (classesData.success && Array.isArray(classesData.data)) {
    result.classes = classesData.data;
  }

  // Load student progress
  const response = await apiClient('/students/progress');
  const data = await response.json();

  if (data.success && data.data) {
    // Group by unique student ID to show each student once (aggregate across all classes)
    const studentMap = new Map<string, StudentProgressAggregate>();

    // For ADMIN: exclude students from unpaid academies using the paid-only classes list
    const paidClassIds = role === 'ADMIN' && result.classes.length > 0
      ? new Set(result.classes.map((c: Class) => c.id))
      : null;
    const records: StudentProgressApiRecord[] = paidClassIds
      ? (data.data as StudentProgressApiRecord[]).filter(s => paidClassIds.has(s.classId))
      : (data.data as StudentProgressApiRecord[]);

    records.forEach((student: StudentProgressApiRecord) => {
      const paymentResult = computePaymentStatus(
        student.paymentFrequency,
        student.monthlyPrice,
        student.oneTimePrice,
        student.classStartDate,
        student.enrolledAt,
        student.totalPaid,
      );
      const classRecord: ClassBreakdownItem = {
        className: student.className,
        classId: student.classId,
        teacherName: student.teacherName ?? undefined,
        totalWatchTime: student.totalWatchTime ?? 0,
        videosWatched: student.lessonsCompleted ?? 0,
        totalVideos: student.totalLessons ?? 0,
        lastActive: student.lastActive ?? null,
        enrollmentId: student.enrollmentId ?? undefined,
        enrollmentStatus: student.enrollmentStatus ?? undefined,
        paymentStatus: paymentResult.status,
        monthsBehind: paymentResult.monthsBehind,
      };

      if (!studentMap.has(student.id)) {
        studentMap.set(student.id, {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          classes: [student.className],
          classIds: [student.classId],
          teacherNames: student.teacherName ? [student.teacherName] : [],
          totalWatchTime: student.totalWatchTime ?? 0,
          lessonsCompleted: student.lessonsCompleted ?? 0,
          totalLessons: student.totalLessons ?? 0,
          lastActive: student.lastActive ?? undefined,
          enrollmentIds: student.enrollmentId ? [student.enrollmentId] : [],
          perClassRecords: [classRecord],
          suspicionCount: student.suspicionCount ?? 0,
        });
      } else {
        const existing = studentMap.get(student.id);
        if (existing) {
          existing.classes.push(student.className);
          existing.classIds.push(student.classId);
          if (student.teacherName && !existing.teacherNames.includes(student.teacherName)) {
            existing.teacherNames.push(student.teacherName);
          }
          existing.totalWatchTime += student.totalWatchTime ?? 0;
          existing.lessonsCompleted += student.lessonsCompleted ?? 0;
          existing.totalLessons += student.totalLessons ?? 0;
          if (student.enrollmentId) {
            existing.enrollmentIds.push(student.enrollmentId);
          }
          existing.perClassRecords.push(classRecord);
          if (student.lastActive && (!existing.lastActive || new Date(student.lastActive) > new Date(existing.lastActive))) {
            existing.lastActive = student.lastActive;
          }
        }
      }
    });

    // Convert map to array with aggregated data
    result.students = Array.from(studentMap.values()).map(student => {
      const statuses = student.perClassRecords.map(r => r.paymentStatus);
      const totalMonthsBehind = student.perClassRecords
        .filter(r => r.paymentStatus === 'BEHIND')
        .reduce((max, r) => Math.max(max, r.monthsBehind || 0), 0);
      let aggregatePaymentStatus: 'UP_TO_DATE' | 'BEHIND' | 'FREE' = 'FREE';
      if (statuses.some(s => s === 'BEHIND')) {
        aggregatePaymentStatus = 'BEHIND';
      } else if (statuses.some(s => s === 'UP_TO_DATE')) {
        aggregatePaymentStatus = 'UP_TO_DATE';
      }

      return {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        email: student.email,
        className: student.classes.length === 1 ? student.classes[0] : `${student.classes.length} asignaturas`,
        classId: student.classIds[0],
        teacherName: student.teacherNames.join(', '),
        totalWatchTime: student.totalWatchTime,
        videosWatched: student.lessonsCompleted,
        totalVideos: student.totalLessons,
        lastActive: student.lastActive ?? null,
        enrollmentId: student.enrollmentIds[0],
        enrollmentStatus: student.perClassRecords[0]?.enrollmentStatus,
        classBreakdown: student.perClassRecords.length > 1 ? student.perClassRecords : undefined,
        paymentStatus: aggregatePaymentStatus,
        monthsBehind: totalMonthsBehind,
        suspicionCount: student.suspicionCount,
      };
    });
  }

  return result;
}
