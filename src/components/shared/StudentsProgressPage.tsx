'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { StudentsProgressTable, type StudentProgress } from '@/components/shared';
import type { ClassBreakdownItem } from './StudentsProgressTable';
import { generateDemoStudents } from '@/lib/demo-data';
import { ClassSearchDropdown } from '@/components/ui/ClassSearchDropdown';

interface Class {
  id: string;
  name: string;
  academyId?: string;
}

interface Academy {
  id: string;
  name: string;
}

interface StudentsProgressPageProps {
  role: 'TEACHER' | 'ACADEMY' | 'ADMIN';
}

interface DemoStudentAggregate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  classes: string[];
  classIds: string[];
  lastLoginAt?: string | null;
  watchTimeBase: number;
  perClassTeachers: string[];
}

interface StudentProgressApiRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  className: string;
  classId: string;
  teacherName?: string | null;
  totalWatchTime?: number | null;
  lessonsCompleted?: number | null;
  totalLessons?: number | null;
  lastActive?: string | null;
  enrollmentId?: string | null;
  paymentFrequency?: string | null;
  monthlyPrice?: number | null;
  oneTimePrice?: number | null;
  classStartDate?: string | null;
  enrolledAt?: string | null;
  totalPaid?: number | null;
}

interface StudentProgressAggregate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  classes: string[];
  classIds: string[];
  teacherNames: string[];
  totalWatchTime: number;
  lessonsCompleted: number;
  totalLessons: number;
  lastActive?: string | null;
  enrollmentIds: string[];
  perClassRecords: ClassBreakdownItem[];
}

function computePaymentStatus(
  paymentFrequency: string | null | undefined,
  monthlyPrice: number | null | undefined,
  oneTimePrice: number | null | undefined,
  classStartDate: string | null | undefined,
  enrolledAt: string | null | undefined,
  totalPaid: number | null | undefined,
): { status: 'UP_TO_DATE' | 'BEHIND' | 'FREE'; monthsBehind: number } {
  // Free class: no prices set or both zero
  const hasMonthly = monthlyPrice != null && monthlyPrice > 0;
  const hasOneTime = oneTimePrice != null && oneTimePrice > 0;
  if (!hasMonthly && !hasOneTime) return { status: 'FREE', monthsBehind: 0 };

  const paid = totalPaid ?? 0;

  if (paymentFrequency === 'MONTHLY' && hasMonthly) {
    // Calculate expected months from class start (or enrollment) to now
    const startStr = classStartDate || enrolledAt;
    if (!startStr) {
      const monthsBehind = paid < monthlyPrice ? 1 : 0;
      return { status: paid >= monthlyPrice ? 'UP_TO_DATE' : 'BEHIND', monthsBehind };
    }
    const start = new Date(startStr);
    const now = new Date();
    let monthsDiff = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    // Adjust for day-of-month: if we haven't reached the billing day yet, subtract a month
    if (now.getDate() < start.getDate()) monthsDiff = Math.max(0, monthsDiff - 1);
    const expectedMonths = Math.max(1, monthsDiff + 1); // At least 1 month due
    const expectedAmount = expectedMonths * monthlyPrice;
    const paidMonths = Math.floor(paid / monthlyPrice);
    const monthsBehind = Math.max(0, expectedMonths - paidMonths);
    return { status: paid >= expectedAmount ? 'UP_TO_DATE' : 'BEHIND', monthsBehind };
  }

  // One-time payment or default
  const price = hasOneTime ? oneTimePrice! : monthlyPrice!;
  return { status: paid >= price ? 'UP_TO_DATE' : 'BEHIND', monthsBehind: 0 };
}

export function StudentsProgressPage({ role }: StudentsProgressPageProps) {
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [loading, setLoading] = useState(true);
  const [academyName, setAcademyName] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<string>('PAID');
  const [userEmail, setUserEmail] = useState<string>('');
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAcademy, setSelectedAcademy] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);

  useEffect(() => {
    // Filter classes when academy is selected (for ADMIN role)
    if (role === 'ADMIN' && selectedAcademy && selectedAcademy !== 'all') {
      const filtered = classes.filter(c => c.academyId === selectedAcademy);
      setFilteredClasses(filtered);
      setSelectedClass('all');
    } else {
      setFilteredClasses(classes);
    }
  }, [selectedAcademy, classes, role]);

  const DEMO_CLASS_NAME_TO_ID: Record<string, string> = {
    'Programación Web': 'demo-c1',
    'Matemáticas Avanzadas': 'demo-c2',
    'Física Cuántica': 'demo-c4',
    'Diseño Gráfico': 'demo-c3',
  };

  const DEMO_CLASSES = [
    { id: 'demo-c1', name: 'Programación Web' },
    { id: 'demo-c2', name: 'Matemáticas Avanzadas' },
    { id: 'demo-c3', name: 'Diseño Gráfico' },
    { id: 'demo-c4', name: 'Física Cuántica' },
  ];

  // Source of truth: must match generateDemoClasses() in demo-data.ts
  const DEMO_CLASS_TEACHER: Record<string, string> = {
    'demo-c1': 'Carlos Rodríguez',
    'demo-c2': 'María García',
    'demo-c3': 'Ana Martínez',
    'demo-c4': 'Luis López',
  };

  const buildDemoStudentProgress = useCallback((): StudentProgress[] => {
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

      // Build per-class breakdown if student is in multiple classes
      let classBreakdown: ClassBreakdownItem[] | undefined;
      if (student.classes.length > 1) {
        classBreakdown = student.classes.map((cls, ci) => {
          const maxClsVideos = Math.floor(totalVideos / student.classes.length + 2);
          const clsVideos = maxClsVideos > 0 ? ((index * 3 + ci * 5 + 2) % maxClsVideos) : 0;
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
            totalVideos: Math.floor(totalVideos / student.classes.length),
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
      };
    });
  }, []);

  const loadProgress = useCallback(async () => {
    try {
      // Load academies if ADMIN
      if (role === 'ADMIN') {
        const academiesRes = await apiClient('/admin/academies');
        const academiesData = await academiesRes.json();
        if (academiesData.success && Array.isArray(academiesData.data)) {
          setAcademies(academiesData.data);
        }
      }

      // Load classes
      const classesEndpoint = role === 'ADMIN' ? '/admin/classes' : role === 'TEACHER' ? '/classes' : '/academies/classes';
      const classesRes = await apiClient(classesEndpoint);
      const classesData = await classesRes.json();
      if (classesData.success && Array.isArray(classesData.data)) {
        setClasses(classesData.data);
        setFilteredClasses(classesData.data);
      }

      // Load student progress
      const response = await apiClient('/students/progress');
      const data = await response.json();
      
      if (data.success && data.data) {
        // Group by unique student ID to show each student once (aggregate across all classes)
        const studentMap = new Map<string, StudentProgressAggregate>();
        
        data.data.forEach((student: StudentProgressApiRecord) => {
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
            paymentStatus: paymentResult.status,
            monthsBehind: paymentResult.monthsBehind,
          };

          if (!studentMap.has(student.id)) {
            // First time seeing this student
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
            });
          } else {
            // Add this class to existing student
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
              // Keep most recent lastActive
              if (student.lastActive && (!existing.lastActive || new Date(student.lastActive) > new Date(existing.lastActive))) {
                existing.lastActive = student.lastActive;
              }
            }
          }
        });
        
        // Convert map to array with aggregated data
        const progressData: StudentProgress[] = Array.from(studentMap.values()).map(student => {
          // Aggregate payment status: if ANY class is BEHIND, student is BEHIND overall
          // If all FREE, student is FREE. Otherwise UP_TO_DATE.
          // For months behind, use the MAX (not sum) across all classes
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
            enrollmentId: student.enrollmentIds[0], // Use first enrollment for actions
            classBreakdown: student.perClassRecords.length > 1 ? student.perClassRecords : undefined,
            paymentStatus: aggregatePaymentStatus,
            monthsBehind: totalMonthsBehind,
          };
        });
        
        setStudents(progressData);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  }, [role]);

  const loadAcademyName = useCallback(async () => {
    try {
      // For TEACHER role, check /teacher/academy for demo mode
      if (role === 'TEACHER') {
        const [teacherAcademyRes, userRes] = await Promise.all([
          apiClient('/teacher/academy'),
          apiClient('/auth/me')
        ]);
        const userResult = await userRes.json();
        if (userResult.success && userResult.data?.email) {
          setUserEmail(userResult.data.email);
        }
        if (teacherAcademyRes.ok) {
          const teacherAcademyData = await teacherAcademyRes.json();
          const academy = teacherAcademyData.data?.academy;
          if (academy) {
            setAcademyName(academy.name || '');
            const status = academy.paymentStatus || 'PAID';
            setPaymentStatus(status);
            if (status === 'NOT PAID') {
              setStudents(buildDemoStudentProgress());
              setClasses(DEMO_CLASSES);
              setLoading(false);
              return;
            }
          }
        }
        await loadProgress();
        return;
      }

      const endpoint = role === 'ADMIN' ? '/admin/academies' : '/academies';
      const [res, userRes] = await Promise.all([
        apiClient(endpoint),
        apiClient('/auth/me')
      ]);
      const result = await res.json();
      const userResult = await userRes.json();
      
      // Load user email
      if (userResult.success && userResult.data?.email) {
        setUserEmail(userResult.data.email);
      }
      
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        // Academy/Admin endpoint returns { success, data }
        const academy = result.data[0];
        setAcademyName(academy.name || '');
        const status = academy.paymentStatus || 'PAID';
        setPaymentStatus(status);
        
        // If NOT PAID, show demo students
        if (status === 'NOT PAID' && role === 'ACADEMY') {
          setStudents(buildDemoStudentProgress());
          setClasses(DEMO_CLASSES);
          setLoading(false);
          return;
        }
        await loadProgress();
      } else {
        // If API returns unexpected format, show demo data as fallback
        if (role === 'ACADEMY') {
          setStudents(buildDemoStudentProgress());
          setClasses(DEMO_CLASSES);
          setLoading(false);
        } else {
          await loadProgress();
        }
      }
    } catch (error) {
      console.error('Failed to load academy name:', error);
      // On error, show demo data for academy/teacher role
      if (role === 'ACADEMY' || role === 'TEACHER') {
        setStudents(buildDemoStudentProgress());
        setClasses(DEMO_CLASSES);
      }
      setLoading(false);
    }
  }, [loadProgress, role, buildDemoStudentProgress]);

  useEffect(() => {
    loadAcademyName();
  }, [loadAcademyName]);

  const handleBanStudent = async (enrollmentId: string) => {
    try {
      const res = await apiClient(`/enrollments/${enrollmentId}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        alert('Estudiante expulsado exitosamente');
        loadProgress();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Failed to ban student:', error);
      alert('Error al expulsar estudiante');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-48 sm:w-56 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-32 sm:w-40 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="h-10 w-full sm:w-64 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-10 w-full sm:w-48 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
        
        {/* Chart Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="h-6 w-64 bg-gray-200 rounded mb-4 animate-pulse"></div>
          <div className="h-80 bg-gray-100 rounded animate-pulse"></div>
        </div>
        
        {/* Table Card */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Info row */}
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
          {/* Table header */}
          <div className="bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-5 gap-4 px-6 py-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
          {/* Table rows */}
          <div className="divide-y divide-gray-200">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="grid grid-cols-5 gap-4 px-6 py-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="h-5 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header with Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Progreso de Estudiantes</h1>
          {academyName && <p className="text-sm text-gray-500 mt-1">{academyName}</p>}
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              id="student-search"
              name="studentSearch"
              placeholder="Buscar estudiante..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-48 pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {/* Class Filter - Shows when academy is selected for ADMIN or always for others */}
          {(role !== 'ADMIN' || selectedAcademy !== 'all') && (
            <ClassSearchDropdown
              classes={filteredClasses}
              value={selectedClass}
              onChange={setSelectedClass}
              allLabel="Todas las asignaturas"
              className="w-full sm:w-48"
            />
          )}
          {/* Academy Filter - Only for ADMIN */}
          {role === 'ADMIN' && academies.length > 0 && (
            <div className="relative">
              <select
                id="academy-filter"
                name="academyFilter"
                value={selectedAcademy}
                onChange={(e) => setSelectedAcademy(e.target.value)}
                className="appearance-none w-full sm:w-56 pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                <option value="all">Todas las Academias</option>
                {academies.map((academy) => (
                  <option key={academy.id} value={academy.id}>{academy.name}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>

      <StudentsProgressTable
        students={students}
        loading={loading}
        searchQuery={searchQuery}
        selectedClass={selectedClass}
        showTeacherColumn={role === 'ACADEMY'}
        showBanButton={role === 'ACADEMY'}
        disableBanButton={paymentStatus === 'NOT PAID' && userEmail.toLowerCase().includes('demo')}
        onBanStudent={role === 'ACADEMY' ? handleBanStudent : undefined}
      />
    </div>
  );
}

