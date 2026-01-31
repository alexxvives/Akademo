'use client';

import { useEffect, useState, useMemo } from 'react';
import { apiClient } from '@/lib/api-client';
import { StudentsProgressTable, type StudentProgress } from '@/components/shared';
import { generateDemoStudents } from '@/lib/demo-data';

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

export function StudentsProgressPage({ role }: StudentsProgressPageProps) {
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [loading, setLoading] = useState(true);
  const [academyName, setAcademyName] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<string>('PAID');
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAcademy, setSelectedAcademy] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);

  useEffect(() => {
    loadAcademyName();
  }, []);

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

  const loadAcademyName = async () => {
    try {
      const endpoint = role === 'ADMIN' ? '/admin/academies' : role === 'TEACHER' ? '/requests/teacher' : '/academies';
      const res = await apiClient(endpoint);
      const result = await res.json();
      
      if (Array.isArray(result)) {
        // Teacher endpoint returns array directly
        if (result.length > 0) {
          setAcademyName(result[0].academyName || '');
        }
        await loadProgress();
      } else if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        // Academy endpoint returns { success, data }
        const academy = result.data[0];
        setAcademyName(academy.name || '');
        const status = academy.paymentStatus || 'PAID';
        setPaymentStatus(status);
        
        // If NOT PAID, show demo students
        if (status === 'NOT PAID' && role === 'ACADEMY') {
          const demoStudents = generateDemoStudents(); // Uses DEMO_STUDENT_COUNT.TOTAL (164)
          // Map class names to demo class IDs
          const classNameToId: Record<string, string> = {
            'Programación Web': 'demo-c1',
            'Matemáticas Avanzadas': 'demo-c2',
            'Física Cuántica': 'demo-c4',
            'Diseño Gráfico': 'demo-c3',
          };
          setStudents(demoStudents.map(s => ({
            id: s.id,
            name: `${s.firstName} ${s.lastName}`,
            email: s.email,
            className: s.className,
            classId: classNameToId[s.className] || 'demo-c1',
            teacherName: ['Carlos Rodríguez', 'María García', 'Ana Martínez'][Math.floor(Math.random() * 3)],
            totalWatchTime: Math.floor(Math.random() * 7200),
            videosWatched: Math.floor(Math.random() * 15),
            totalVideos: 20,
            lastActive: s.lastLoginAt, // Use the properly distributed lastLoginAt from generateDemoStudents
          })));
          // Load demo classes for filter
          setClasses([
            { id: 'demo-c1', name: 'Programación Web' },
            { id: 'demo-c2', name: 'Matemáticas Avanzadas' },
            { id: 'demo-c3', name: 'Diseño Gráfico' },
            { id: 'demo-c4', name: 'Física Cuántica' },
          ]);
          setLoading(false);
          return;
        }
        await loadProgress();
      } else {
        // If API returns unexpected format, show demo data as fallback
        if (role === 'ACADEMY') {
          const demoStudents = generateDemoStudents(); // Uses DEMO_STUDENT_COUNT.TOTAL (164)
          const classNameToId: Record<string, string> = {
            'Programación Web': 'demo-c1',
            'Matemáticas Avanzadas': 'demo-c2',
            'Física Cuántica': 'demo-c4',
            'Diseño Gráfico': 'demo-c3',
          };
          setStudents(demoStudents.map(s => ({
            id: s.id,
            name: `${s.firstName} ${s.lastName}`,
            email: s.email,
            className: s.className,
            classId: classNameToId[s.className] || 'demo-c1',
            teacherName: ['Carlos Rodríguez', 'María García', 'Ana Martínez'][Math.floor(Math.random() * 3)],
            totalWatchTime: Math.floor(Math.random() * 7200),
            videosWatched: Math.floor(Math.random() * 15),
            totalVideos: 20,
            lastActive: s.lastLoginAt,
          })));
          setClasses([
            { id: 'demo-c1', name: 'Programación Web' },
            { id: 'demo-c2', name: 'Matemáticas Avanzadas' },
            { id: 'demo-c3', name: 'Diseño Gráfico' },
            { id: 'demo-c4', name: 'Física Cuántica' },
          ]);
          setLoading(false);
        } else {
          await loadProgress();
        }
      }
    } catch (error) {
      console.error('Failed to load academy name:', error);
      // On error, show demo data for academy role
      if (role === 'ACADEMY') {
        const demoStudents = generateDemoStudents(); // Uses DEMO_STUDENT_COUNT.TOTAL (164)
        const classNameToId: Record<string, string> = {
          'Programación Web': 'demo-c1',
          'Matemáticas Avanzadas': 'demo-c2',
          'Física Cuántica': 'demo-c4',
          'Diseño Gráfico': 'demo-c3',
        };
        setStudents(demoStudents.map(s => ({
          id: s.id,
          name: `${s.firstName} ${s.lastName}`,
          email: s.email,
          className: s.className,
          classId: classNameToId[s.className] || 'demo-c1',
          teacherName: ['Carlos Rodríguez', 'María García', 'Ana Martínez'][Math.floor(Math.random() * 3)],
          totalWatchTime: Math.floor(Math.random() * 7200),
          videosWatched: Math.floor(Math.random() * 15),
          totalVideos: 20,
          lastActive: s.lastLoginAt,
        })));
        setClasses([
          { id: 'demo-c1', name: 'Programación Web' },
          { id: 'demo-c2', name: 'Matemáticas Avanzadas' },
          { id: 'demo-c3', name: 'Diseño Gráfico' },
          { id: 'demo-c4', name: 'Física Cuántica' },
        ]);
      }
      setLoading(false);
    }
  };

  const loadProgress = async () => {
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
        const progressData: StudentProgress[] = data.data.map((student: any) => ({
          id: student.id,
          name: `${student.firstName} ${student.lastName}`,
          email: student.email,
          className: student.className || `${student.classCount} ${student.classCount === 1 ? 'clase' : 'clases'}`,
          classId: student.classId, // Include classId for filtering
          teacherName: student.teacherName,
          totalWatchTime: student.totalWatchTime || 0, // Already in seconds - formatTime expects seconds
          videosWatched: student.lessonsCompleted || 0,
          totalVideos: student.totalLessons || 0,
          lastActive: student.lastActive,
        }));
        
        setStudents(progressData);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique class names from classes array
  const uniqueClasses = useMemo(() => {
    return classes.map(c => c.name);
  }, [classes]);

  return (
    <div className="space-y-6 pb-8">
      {/* Header with Filters */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Progreso de Estudiantes</h1>
          {academyName && <p className="text-sm text-gray-500 mt-1">{academyName}</p>}
        </div>
        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              id="student-search"
              name="studentSearch"
              placeholder="Buscar estudiante..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {/* Class Filter - Shows when academy is selected for ADMIN or always for others */}
          {(role !== 'ADMIN' || selectedAcademy !== 'all') && (
            <div className="relative">
              <select
                id="class-filter"
                name="classFilter"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="appearance-none w-48 pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                <option value="all">Todas las clases</option>
                {filteredClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          )}
          {/* Academy Filter - Only for ADMIN */}
          {role === 'ADMIN' && academies.length > 0 && (
            <div className="relative">
              <select
                id="academy-filter"
                name="academyFilter"
                value={selectedAcademy}
                onChange={(e) => setSelectedAcademy(e.target.value)}
                className="appearance-none w-56 pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
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
        onSearchChange={setSearchQuery}
        onClassFilterChange={setSelectedClass}
        uniqueClasses={uniqueClasses}
        showClassFilter={false}
        showTeacherColumn={role === 'ACADEMY'}
      />
    </div>
  );
}

