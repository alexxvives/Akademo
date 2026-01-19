'use client';

import { useEffect, useState, useMemo } from 'react';
import { apiClient } from '@/lib/api-client';
import { StudentsProgressTable, type StudentProgress } from '@/components/shared';

interface Class {
  id: string;
  name: string;
}

interface StudentsProgressPageProps {
  role: 'TEACHER' | 'ACADEMY';
}

export function StudentsProgressPage({ role }: StudentsProgressPageProps) {
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [academyName, setAcademyName] = useState<string>('');
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');

  useEffect(() => {
    loadProgress();
    loadAcademyName();
  }, []);

  const loadAcademyName = async () => {
    try {
      const endpoint = role === 'TEACHER' ? '/requests/teacher' : '/academies';
      const res = await apiClient(endpoint);
      const result = await res.json();
      
      if (Array.isArray(result)) {
        // Teacher endpoint returns array directly
        if (result.length > 0) {
          setAcademyName(result[0].academyName || '');
        }
      } else if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        // Academy endpoint returns { success, data }
        setAcademyName(result.data[0].name || '');
      }
    } catch (error) {
      console.error('Failed to load academy name:', error);
    }
  };

  const loadProgress = async () => {
    try {
      // Load classes
      const classesEndpoint = role === 'TEACHER' ? '/classes' : '/academies/classes';
      const classesRes = await apiClient(classesEndpoint);
      const classesData = await classesRes.json();
      if (classesData.success && Array.isArray(classesData.data)) {
        setClasses(classesData.data);
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
          teacherName: student.teacherName,
          totalWatchTime: Math.floor((student.totalWatchTime || 0) / 60), // Convert seconds to minutes
          videosWatched: student.lessonsCompleted || 0,
          totalVideos: student.totalLessons || 0,
          lastActive: student.lastActivity,
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
    <div className="space-y-6">
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
              placeholder="Buscar estudiante..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {/* Class Filter */}
          <div className="relative">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="appearance-none w-48 pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="all">Todas las clases</option>
              {uniqueClasses.map((className) => (
                <option key={className} value={className}>{className}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
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
