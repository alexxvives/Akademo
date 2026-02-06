'use client';
// Force rebuild - removed search/filteredTeachers

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { SkeletonList } from '@/components/ui/SkeletonLoader';

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  academyName?: string;
  classCount: number;
  classNames?: string;
  studentCount: number;
  createdAt: string;
}

export default function AdminTeachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [academies, setAcademies] = useState<Array<{id: string; name: string}>>([]);
  const [selectedAcademy, setSelectedAcademy] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      const [teachersRes, academiesRes] = await Promise.all([
        apiClient('/admin/teachers'),
        apiClient('/admin/academies')
      ]);
      
      const [teachersResult, academiesResult] = await Promise.all([
        teachersRes.json(),
        academiesRes.json()
      ]);
      
      if (teachersResult.success) {
        setTeachers(teachersResult.data || []);
      }
      if (academiesResult.success) {
        setAcademies((academiesResult.data || []).map((a: any) => ({
          id: a.id,
          name: a.name
        })));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTeachers = async () => {
    try {
      const res = await apiClient('/admin/teachers');
      const result = await res.json();
      if (result.success) {
        setTeachers(result.data || []);
      }
    } catch (error) {
      console.error('Error loading teachers:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Filter teachers by academy
  const filteredTeachers = teachers.filter(t => {
    if (selectedAcademy === 'ALL') return true;
    const academy = academies.find(a => a.id === selectedAcademy);
    return t.academyName === academy?.name;
  });

  if (loading) {
    return <SkeletonList rows={10} />;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Profesores</h1>
            <p className="text-sm text-gray-500 mt-1">AKADEMO PLATFORM</p>
          </div>
          
          {/* Academy Filter - Top Right */}
          {academies.length > 0 && (
            <div className='relative'>
              <select
                value={selectedAcademy}
                onChange={(e) => setSelectedAcademy(e.target.value)}
                className='appearance-none w-full md:w-64 pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent'
              >
                <option value="ALL">Todas las Academias</option>
                {academies.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500'>
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                </svg>
              </div>
            </div>
          )}
        </div>

        {filteredTeachers.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay profesores</h3>
            <p className="text-gray-500">Los profesores aparecerán aquí cuando se registren</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profesor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Academia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clases
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estudiantes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registrado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 font-medium">
                            {teacher.firstName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{teacher.firstName} {teacher.lastName}</div>
                          <div className="text-sm text-gray-500">{teacher.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{teacher.academyName || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      {teacher.classNames ? (
                        <div className="flex flex-wrap gap-1">
                          {teacher.classNames.split(',').map((name, i) => (
                            <span key={i} className="inline-block bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-700">
                              {name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{teacher.studentCount}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">
                        {new Date(teacher.createdAt).toLocaleDateString('es')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
