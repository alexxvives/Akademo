'use client';

import { useEffect, useState } from 'react';

interface Academy {
  id: string;
  name: string;
  ownerName: string;
  ownerEmail: string;
  status: string;
  teacherCount: number;
  studentCount: number;
  createdAt: string;
}

export default function AdminAcademies() {
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadAcademies();
  }, []);

  const loadAcademies = async () => {
    try {
      const res = await fetch('/api/academies');
      const result = await res.json();
      if (result.success) {
        setAcademies(result.data || []);
      }
    } catch (error) {
      console.error('Error loading academies:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAcademies = academies.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.ownerEmail?.toLowerCase().includes(search.toLowerCase())
  );

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
            <h1 className="text-3xl font-bold text-gray-900">Academias</h1>
            <p className="text-gray-500 mt-1">Todas las academias de la plataforma</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-lg border border-gray-200">
              <span className="font-medium">{academies.length}</span> total
            </div>
          </div>
        </div>

        {academies.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay academias</h3>
            <p className="text-gray-500">Las academias aparecerán aquí cuando se registren</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAcademies.map((academy) => (
              <div key={academy.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                    {academy.name.charAt(0).toUpperCase()}
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    academy.status === 'approved' 
                      ? 'bg-green-100 text-green-800'
                      : academy.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {academy.status === 'approved' ? 'Aprobada' : academy.status === 'pending' ? 'Pendiente' : academy.status}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{academy.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{academy.ownerEmail}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500 pt-4 border-t border-gray-100">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    {academy.teacherCount || 0} profesores
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    {academy.studentCount || 0} estudiantes
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
