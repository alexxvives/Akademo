'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

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
}

export default function StudentLessons() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLessons();
  }, []);

  const loadLessons = async () => {
    try {
      // Get enrolled classes first
      const classesRes = await fetch('/api/classes');
      const classesResult = await classesRes.json();
      
      if (classesResult.success && classesResult.data) {
        // Aggregate lessons from all classes
        const allLessons: Lesson[] = [];
        for (const cls of classesResult.data) {
          const classRes = await fetch(`/api/classes/${cls.id}`);
          const classData = await classRes.json();
          if (classData.success && classData.data.lessons) {
            classData.data.lessons.forEach((lesson: any) => {
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
              });
            });
          }
        }
        setLessons(allLessons);
      }
    } catch (error) {
      console.error('Error loading lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="STUDENT">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="STUDENT">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Lecciones</h1>
          <p className="text-gray-500 mt-1">Todas las lecciones de tus clases</p>
        </div>

        {lessons.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay lecciones</h3>
            <p className="text-gray-500">Inscríbete en una clase para ver las lecciones</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.map((lesson) => (
              <Link
                key={lesson.id}
                href={`/dashboard/student/class/${lesson.classSlug || lesson.classId}`}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow hover:border-brand-300"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {lesson.className}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{lesson.title}</h3>
                {lesson.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4">{lesson.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-500">
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
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
