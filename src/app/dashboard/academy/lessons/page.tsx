'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  classId: string;
  className: string;
  teacherName: string;
  teacherId: string;
  releaseDate: string | null;
  videoGuid: string | null;
  videoDuration: number | null;
  createdAt: string;
}

export default function AcademyLessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTeacher, setFilterTeacher] = useState<string>('all');

  useEffect(() => {
    loadLessons();
  }, []);

  const loadLessons = async () => {
    try {
      const response = await fetch('/api/lessons');
      const result = await response.json();
      if (result.success) {
        setLessons(result.data);
      }
    } catch (error) {
      console.error('Error loading lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  const uniqueTeachers = Array.from(new Set(lessons.map(l => l.teacherId)))
    .map(id => lessons.find(l => l.teacherId === id))
    .filter(Boolean) as Lesson[];

  const filteredLessons = lessons.filter(lesson => {
    const matchesSearch = lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lesson.className.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTeacher = filterTeacher === 'all' || lesson.teacherId === filterTeacher;
    return matchesSearch && matchesTeacher;
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
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Lecciones</h1>
          <p className="text-gray-600 text-sm">Todas las lecciones de la academia</p>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por título o clase..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Profesor</label>
              <select
                value={filterTeacher}
                onChange={(e) => setFilterTeacher(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos los profesores</option>
                {uniqueTeachers.map((teacher) => (
                  <option key={teacher.teacherId} value={teacher.teacherId}>
                    {teacher.teacherName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando lecciones...</p>
          </div>
        ) : filteredLessons.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No se encontraron lecciones</h3>
            <p className="text-gray-600">
              {searchTerm || filterTeacher !== 'all'
                ? 'Intenta ajustar los filtros de búsqueda.'
                : 'Los profesores pueden crear lecciones desde sus clases.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLessons.map((lesson) => (
              <div key={lesson.id} className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-blue-300 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{lesson.title}</h3>
                      {lesson.videoGuid && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                          Video
                        </span>
                      )}
                    </div>

                    {lesson.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{lesson.description}</p>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span className="text-gray-700">{lesson.className}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-gray-700">{lesson.teacherName}</span>
                      </div>
                      {lesson.videoDuration && (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-gray-700">{formatDuration(lesson.videoDuration)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-gray-700">
                          {lesson.releaseDate ? formatDate(lesson.releaseDate) : 'Publicado'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/academy/class/${lesson.classId}`}
                    className="ml-4 px-4 py-2 text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm flex-shrink-0"
                  >
                    Ver Clase →
                  </Link>
                </div>
              </div>
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
                <span className="font-semibold text-blue-900">{uniqueTeachers.length}</span>
                <span className="text-blue-700"> profesor{uniqueTeachers.length !== 1 ? 'es' : ''}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
