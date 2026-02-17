'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { SkeletonList } from '@/components/ui/SkeletonLoader';

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  classId: string;
  classSlug?: string | null;
  className: string;
  teacherName: string;
  teacherId: string;
  releaseDate: string | null;
  videoGuid: string | null;
  videoDuration: number | null;
  createdAt: string;
}

interface ClassSummary {
  id: string;
  name: string;
  teacherFirstName?: string | null;
  teacherLastName?: string | null;
}

export default function AcademyLessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState<string>('all');

  const loadClasses = useCallback(async () => {
    try {
      const response = await apiClient('/academies/classes');
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setClasses(result.data as ClassSummary[]);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  }, []);

  const loadLessons = useCallback(async () => {
    try {
      // Load lessons for all classes
      const allLessons = await Promise.all(
        classes.map(async (cls) => {
          const response = await apiClient(`/lessons?classId=${cls.id}`);
          const result = await response.json();
          if (result.success && Array.isArray(result.data)) {
            return (result.data as Lesson[]).map((lesson) => ({
              ...lesson,
              className: cls.name,
              teacherName: cls.teacherFirstName && cls.teacherLastName 
                ? `${cls.teacherFirstName} ${cls.teacherLastName}` 
                : 'Sin asignar',
            }));
          }
          return [];
        })
      );
      setLessons(allLessons.flat());
    } catch (error) {
      console.error('Error loading lessons:', error);
    } finally {
      setLoading(false);
    }
  }, [classes]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    if (classes.length > 0) {
      loadLessons();
    }
  }, [classes, loadLessons]);

  const uniqueClasses = Array.from(new Set(classes.map(c => c.id)))
    .map(id => classes.find(c => c.id === id))
    .filter((cls): cls is ClassSummary => Boolean(cls));

  const filteredLessons = lessons.filter(lesson => {
    const matchesClass = filterClass === 'all' || lesson.classId === filterClass;
    return matchesClass;
  });

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Asignaturas</h1>
          <p className="text-gray-600 text-sm">Todas las Asignaturas de la academia</p>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Clase</label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full h-[38px] px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm bg-white appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20fill%3D%27none%27%20viewBox%3D%270%200%2020%2020%27%3E%3Cpath%20stroke%3D%27%236b7280%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%20stroke-width%3D%271.5%27%20d%3D%27M6%208l4%204%204-4%27%2F%3E%3C%2Fsvg%3E')] bg-[length:1.5em] bg-[right_0.5rem_center] bg-no-repeat"
            >
              <option value="all">Todas las clases</option>
              {uniqueClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <SkeletonList rows={12} />
        ) : filteredLessons.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No se encontraron Asignaturas</h3>
            <p className="text-gray-600">
              {filterClass !== 'all'
                ? 'Intenta ajustar el filtro de clase.'
                : 'Los profesores pueden crear Asignaturas desde sus clases.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLessons.map((lesson) => (
              <Link
                key={lesson.id}
                href={`/dashboard/academy/subject/${lesson.classSlug || lesson.classId}`}
                className="block bg-white rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all p-5 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 flex-1">
                    {lesson.title}
                  </h3>
                  {lesson.videoGuid && (
                    <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium flex-shrink-0">
                      Video
                    </span>
                  )}
                </div>

                {lesson.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">{lesson.description}</p>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span className="text-gray-700 truncate">{lesson.className}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-gray-700 truncate">{lesson.teacherName}</span>
                  </div>
                  {lesson.videoDuration && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-700">{formatDuration(lesson.videoDuration)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-700 text-xs">
                      {lesson.releaseDate ? formatDate(lesson.releaseDate) : 'Publicado'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Summary */}
        {!loading && lessons.length > 0 && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="font-semibold text-blue-900">{filteredLessons.length}</span>
                <span className="text-blue-700"> lección{filteredLessons.length !== 1 ? 'es' : ''} mostrada{filteredLessons.length !== 1 ? 's' : ''}</span>
              </div>
              <div>
                <span className="font-semibold text-blue-900">{lessons.length}</span>
                <span className="text-blue-700"> total</span>
              </div>
              <div>
                <span className="font-semibold text-blue-900">{uniqueClasses.length}</span>
                <span className="text-blue-700"> clase{uniqueClasses.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
