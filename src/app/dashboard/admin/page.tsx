'use client';

import { useEffect, useState } from 'react';
import { BarChart, DonutChart, StatCard } from '@/components/Charts';

interface Academy {
  id: string;
  name: string;
  owner: {
    email: string;
    firstName: string;
    lastName: string;
  };
  _count: {
    memberships: number;
    classes: number;
  };
  createdAt: string;
}

export default function AdminDashboard() {
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await fetch('/api/academies');
      const result = await response.json();

      if (result.success) {
        setAcademies(result.data);
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

  const totalStudents = academies.reduce((sum, a) => sum + a._count.memberships, 0);
  const totalClasses = academies.reduce((sum, a) => sum + a._count.classes, 0);

  // Calculate growth (mock data for demo)
  const growth = {
    academies: '+12%',
    students: '+24%',
    classes: '+18%',
    teachers: '+8%',
  };

  // Prepare chart data
  const academyData = academies.slice(0, 6).map((a, i) => ({
    label: a.name.length > 15 ? a.name.substring(0, 15) + '...' : a.name,
    value: a._count.memberships + a._count.classes,
  }));

  const distributionData = [
    { label: 'Estudiantes', value: totalStudents, color: '#3B82F6' },
    { label: 'Profesores', value: academies.length, color: '#10B981' },
    { label: 'Clases', value: totalClasses, color: '#F59E0B' },
  ];

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
          <p className="text-gray-500 mt-1">Monitorea y gestiona toda la plataforma</p>
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
            title="Profesores"
            value={academies.length}
            change={growth.teachers}
            trend="up"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
          />
        </div>

        {/* Charts Row */}
        {academies.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BarChart
              data={academyData}
              title="Actividad por Academia"
              height={300}
            />
            <DonutChart
              data={distributionData}
              title="Distribución de Usuarios"
              size={240}
            />
          </div>
        )}

        {/* All Academies */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Todas las Academias</h2>
          
          {academies.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">No academies yet</h3>
              <p className="text-gray-500 text-sm">Teachers will appear here once they create academies</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Academy</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Owner</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">Students</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">Classes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {academies.map((academy) => (
                      <tr key={academy.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-gray-900">{academy.name}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">{academy.owner.firstName} {academy.owner.lastName}</div>
                          <div className="text-xs text-gray-500">{academy.owner.email}</div>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-600">{academy._count.memberships}</td>
                        <td className="px-4 py-3 text-center text-sm text-gray-600">{academy._count.classes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="sm:hidden divide-y divide-gray-100">
                {academies.map((academy) => (
                  <div key={academy.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {academy.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{academy.name}</h3>
                        <p className="text-sm text-gray-500">{academy.owner.firstName} {academy.owner.lastName}</p>
                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                          <span>{academy._count.memberships} students</span>
                          <span>{academy._count.classes} classes</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
