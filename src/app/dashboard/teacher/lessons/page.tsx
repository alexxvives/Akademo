'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  className: string;
  classId: string;
  classSlug?: string;
  releaseDate: string | null;
  videoCount: number;
  documentCount: number;
  avgRating?: number | null;
  studentsAccessed?: number;
  totalStudents?: number;
  topicName?: string | null;
}

export default function TeacherLessons() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [academyName, setAcademyName] = useState<string>('');
  const [collapsedTopics, setCollapsedTopics] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadLessons();
    loadAcademyName();
  }, []);

  const loadAcademyName = async () => {
    try {
      const res = await apiClient('/requests/teacher');
      const result = await res.json();
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        setAcademyName(result.data[0].academyName || '');
      }
    } catch (error) {
      console.error('Failed to load academy name:', error);
    }
  };

  const loadLessons = async () => {
    try {
      const classesRes = await apiClient('/classes');
      const classesResult = await classesRes.json();
      
      if (classesResult.success && classesResult.data) {
        const allLessons: Lesson[] = [];
        // Start with all topics collapsed
        const allTopicNames = new Set<string>();
        
        for (const cls of classesResult.data) {
          // Fetch lessons with stats for this class
          const lessonsRes = await apiClient(`/lessons?classId=${cls.id}`);
          const lessonsData = await lessonsRes.json();
          
          if (lessonsData.success && lessonsData.data) {
            lessonsData.data.forEach((lesson: any) => {
              if (lesson.topicName) {
                allTopicNames.add(lesson.topicName);
              }
              allLessons.push({
                id: lesson.id,
                title: lesson.title,
                description: lesson.description,
                className: cls.name,
                classId: cls.id,
                classSlug: cls.slug,
                releaseDate: lesson.releaseDate,
                videoCount: lesson.videoCount || 0,
                documentCount: lesson.documentCount || 0,
                avgRating: lesson.avgRating,
                studentsAccessed: lesson.studentsAccessed || 0,
                totalStudents: cls.studentCount || 0,
                topicName: lesson.topicName,
              });
            });
          }
        }
        setLessons(allLessons);
        // Initially collapse all topics
        setCollapsedTopics(allTopicNames);
      }
    } catch (error) {
      console.error('Error loading lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Mis Asignaturas</h1>
            {academyName && <p className="text-sm text-gray-500 mt-1">{academyName}</p>}
          </div>
          <Link
            href="/dashboard/teacher/classes"
            className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nueva Clase
          </Link>
        </div>

        {lessons.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay Clases</h3>
            <p className="text-gray-500 mb-6">Crea una clase y añade Clases para comenzar</p>
            <Link
              href="/dashboard/teacher/classes"
              className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors inline-block"
            >
              Ir a Clases
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Group lessons by topic */}
            {(() => {
              // Group lessons by topicName
              const grouped = lessons.reduce((acc, lesson) => {
                const key = lesson.topicName || 'Sin Tema';
                if (!acc[key]) acc[key] = [];
                acc[key].push(lesson);
                return acc;
              }, {} as Record<string, Lesson[]>);

              const toggleTopic = (topicName: string) => {
                setCollapsedTopics(prev => {
                  const newSet = new Set(prev);
                  if (newSet.has(topicName)) {
                    newSet.delete(topicName);
                  } else {
                    newSet.add(topicName);
                  }
                  return newSet;
                });
              };

              return Object.entries(grouped).map(([topicName, topicLessons]) => {
                const isCollapsed = collapsedTopics.has(topicName);
                
                return (
                  <div key={topicName} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {/* Topic Header */}
                    <button
                      onClick={() => toggleTopic(topicName)}
                      className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-brand-50 to-purple-50 hover:from-brand-100 hover:to-purple-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-500 text-white rounded-lg flex items-center justify-center font-bold">
                          {topicLessons.length}
                        </div>
                        <div className="text-left">
                          <h3 className="text-lg font-semibold text-gray-900">{topicName}</h3>
                          <p className="text-sm text-gray-500">{topicLessons.length} {topicLessons.length === 1 ? 'lección' : 'Clases'}</p>
                        </div>
                      </div>
                      <svg
                        className={`w-6 h-6 text-gray-600 transition-transform ${isCollapsed ? 'rotate-0' : 'rotate-180'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Topic Lessons */}
                    {!isCollapsed && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                        {topicLessons.map((lesson) => {
              const completionPercent = lesson.totalStudents && lesson.totalStudents > 0
                ? Math.round((lesson.studentsAccessed! / lesson.totalStudents) * 100)
                : 0;
              
              return (
                <Link
                  key={lesson.id}
                  href={`/dashboard/teacher/class/${lesson.classSlug || lesson.classId}`}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all hover:border-brand-300"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex items-center gap-2">
                      {lesson.avgRating && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <svg className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-xs font-bold text-yellow-700">{lesson.avgRating.toFixed(1)}</span>
                        </div>
                      )}
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {lesson.className}
                      </span>
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-2">{lesson.title}</h3>
                  
                  {lesson.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4">{lesson.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      {lesson.videoCount} videos
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {lesson.documentCount} docs
                    </span>
                  </div>
                  
                  {/* Completion Bar */}
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-gray-600">Progreso de estudiantes</span>
                      <span className="text-xs font-bold text-brand-600">{completionPercent}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-brand-500 to-purple-500 transition-all duration-500"
                        style={{ width: `${completionPercent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">
                        {lesson.studentsAccessed} de {lesson.totalStudents} estudiantes
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>
    </>
  );
}
