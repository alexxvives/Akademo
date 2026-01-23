'use client';

import { useEffect, useState } from 'react';
import { BarChart, DonutChart, StatCard } from '@/components/Charts';
import { apiClient } from '@/lib/api-client';
import { useAnimatedNumber } from '@/hooks';

interface Academy {
  id: string;
  name: string;
  ownerName: string;
  ownerEmail: string;
  status: string;
  paymentStatus?: string;
  teacherCount: number;
  studentCount: number;
  classCount: number;
  createdAt: string;
}

interface Lesson {
  id: string;
  title: string;
  academyId: string;
  academyName: string;
  className: string;
  videoCount: number;
  documentCount: number;
}

interface Teacher {
  id: string;
  academyName: string;
  classCount: number;
}

interface Student {
  id: string;
  academyNames?: string;
}

// Animated Number Component
function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const animatedValue = useAnimatedNumber(value);
  return <div className={className}>{animatedValue}</div>;
}

export default function AdminDashboard() {
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [academiesRes, lessonsRes, teachersRes, studentsRes] = await Promise.all([
        apiClient('/admin/academies'),
        apiClient('/admin/lessons'),
        apiClient('/admin/teachers'),
        apiClient('/admin/students'),
      ]);

      const [academiesResult, lessonsResult, teachersResult, studentsResult] = await Promise.all([
        academiesRes.json(),
        lessonsRes.json(),
        teachersRes.json(),
        studentsRes.json(),
      ]);

      if (academiesResult.success) {
        setAcademies(academiesResult.data || []);
      }
      if (lessonsResult.success) {
        setLessons(lessonsResult.data || []);
      }
      if (teachersResult.success) {
        setTeachers(teachersResult.data || []);
      }
      if (studentsResult.success) {
        setStudents(studentsResult.data || []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      </>
    );
  }

  const totalStudents = academies.reduce((sum, a) => sum + (a.studentCount || 0), 0);
  const totalClasses = academies.reduce((sum, a) => sum + (a.classCount || 0), 0);
  const totalTeachers = teachers.length;
  const totalLessons = lessons.length;

  // Calculate growth (mock data for demo)
  const growth = {
    academies: '+12%',
    students: '+24%',
    classes: '+18%',
    teachers: '+8%',
  };

  // Lessons per academy for bar chart
  const lessonsPerAcademy = academies.slice(0, 6).map((a) => ({
    label: a.name.length > 15 ? a.name.substring(0, 15) + '...' : a.name,
    value: lessons.filter(l => l.academyId === a.id).length,
  }));

  // User distribution for donut chart
  const distributionData = [
    { label: 'Estudiantes', value: totalStudents, color: '#3B82F6' },
    { label: 'Profesores', value: totalTeachers, color: '#10B981' },
    { label: 'Dueños', value: academies.length, color: '#F59E0B' },
  ];

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">AKADEMO PLATFORM</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Academias"
            value={academies.length}
            change={growth.academies}
            trend="up"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />
          <StatCard
            title="Estudiantes"
            value={totalStudents}
            change={growth.students}
            trend="up"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          />
          <StatCard
            title="Clases"
            value={totalClasses}
            change={growth.classes}
            trend="up"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            }
          />
          <StatCard
            title="Clases"
            value={totalLessons}
            change={'+15%'}
            trend="up"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            }
          />
        </div>

        {/* Charts Row */}
        {academies.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BarChart
              data={lessonsPerAcademy}
              title="Clases por Academia"
              height={300}
            />
            <DonutChart
              data={distributionData}
              title="Distribución de Usuarios"
              size={240}
            />
          </div>
        )}
      </div>
    </>
  );
}
