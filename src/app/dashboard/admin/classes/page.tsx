'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { SkeletonList } from '@/components/ui/SkeletonLoader';

interface Class {
  id: string;
  name: string;
  slug?: string | null;
  description: string | null;
  academyId: string;
  academyName: string;
  teacherId: string | null;
  teacherName: string | null;
  teacherFirstName?: string;
  teacherLastName?: string;
  studentCount: number;
  lessonCount: number;
  videoCount?: number;
  documentCount?: number;
  avgRating?: number | null;
  createdAt: string;
  updatedAt: string;
}

interface Academy {
  id: string;
  name: string;
}

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [selectedAcademy, setSelectedAcademy] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [classesRes, academiesRes] = await Promise.all([
        apiClient('/admin/classes'),
        apiClient('/admin/academies')
      ]);
      
      if (classesRes.ok) {
        const json = await classesRes.json();
        const data = json.success && json.data ? json.data : json;
        setClasses(Array.isArray(data) ? data : []);
      }

      if (academiesRes.ok) {
        const json = await academiesRes.json();
        const data = json.success && json.data ? json.data : json;
        setAcademies(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClasses = selectedAcademy === 'all' 
    ? classes 
    : classes.filter(c => c.academyId === selectedAcademy);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Asignaturas</h1>
          <p className="text-sm text-gray-500 mt-1">Gestionar todas las asignaturas de la plataforma</p>
        </div>
        
        {/* Academy Filter */}
        {academies.length > 0 && (
          <div className="relative">
            <select
              value={selectedAcademy}
              onChange={(e) => setSelectedAcademy(e.target.value)}
              className="appearance-none w-full md:w-64 pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas las Academias</option>
              {academies.map((academy) => (
                <option key={academy.id} value={academy.id}>
                  {academy.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <SkeletonList rows={10} />
      ) : filteredClasses.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay clases registradas</h3>
          <p className="text-gray-600">
            {selectedAcademy === 'all' 
              ? 'No hay clases en la plataforma aún.' 
              : 'No hay clases en esta academia.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredClasses.map((cls) => (
            <Link
              key={cls.id}
              href={`/dashboard/admin/class/${cls.id}`}
              className="block bg-white rounded-xl border-2 border-gray-200 hover:border-brand-400 hover:shadow-xl transition-all p-6 group cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-brand-600 transition-colors">
                      {cls.name}
                    </h3>
                    {cls.avgRating != null && cls.avgRating > 0 && (
                      <div className="flex items-center gap-1.5 px-2 py-1">
                        <svg className="w-5 h-5 text-amber-500 fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm font-bold text-gray-900">{cls.avgRating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  
                  {cls.description ? (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{cls.description}</p>
                  ) : (
                    <p className="text-sm text-gray-400 italic mb-4">Sin descripción</p>
                  )}
                  
                  {/* Teacher Info */}
                  <div className="flex items-center gap-2 text-sm mb-4 text-gray-700">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-medium">Profesor:</span>
                    <span>
                      {cls.teacherFirstName && cls.teacherLastName 
                        ? `${cls.teacherFirstName} ${cls.teacherLastName} (${cls.academyName})` 
                        : cls.teacherName ? `${cls.teacherName} (${cls.academyName})` : 'Sin asignar'
                      }
                    </span>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span className="font-semibold text-gray-700">{cls.studentCount}</span> Estudiante{cls.studentCount !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span className="font-semibold text-gray-700">{cls.lessonCount}</span> Lección{cls.lessonCount !== 1 ? 'es' : ''}
                    </span>
                    {cls.videoCount !== undefined && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="font-semibold text-gray-700">{cls.videoCount}</span> Video{cls.videoCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    {cls.documentCount !== undefined && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="font-semibold text-gray-700">{cls.documentCount || 0}</span> Documento{(cls.documentCount || 0) !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
