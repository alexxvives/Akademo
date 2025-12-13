'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

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
      <DashboardLayout role="ADMIN">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const totalStudents = academies.reduce((sum, a) => sum + a._count.memberships, 0);
  const totalClasses = academies.reduce((sum, a) => sum + a._count.classes, 0);

  return (
    <DashboardLayout role="ADMIN">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Monitor and manage the platform</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Academies</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{academies.length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Students</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalStudents}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Classes</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalClasses}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Teachers</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{academies.length}</p>
          </div>
        </div>

        {/* All Academies */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">All Academies</h2>
          
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
    </DashboardLayout>
  );
}
