'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

interface ClassAssignment {
  id: string;
  title: string;
  type: 'file' | 'quiz';
  topicName?: string | null;
  dueDate?: string | null;
  submissionCount: number;
}

export function ClassAssignmentsSection({
  classId,
  basePath,
}: {
  classId: string;
  basePath: string;
}) {
  const [assignments, setAssignments] = useState<ClassAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'file' | 'quiz'>('file');

  useEffect(() => {
    if (!classId) return;
    setLoading(true);
    apiClient(`/assignments?classId=${classId}`)
      .then(r => r.json())
      .then(data => { if (data.success) setAssignments(data.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [classId]);

  const filtered = assignments.filter(a =>
    activeTab === 'quiz' ? a.type === 'quiz' : a.type !== 'quiz'
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">Ejercicios y Cuestionarios</h3>
        <Link
          href={`${basePath}/assignments?classId=${classId}`}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium text-sm transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Gestionar ejercicios
        </Link>
      </div>

      <div className="p-4">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4 w-fit">
          <button
            onClick={() => setActiveTab('file')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'file' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Ejercicios ({assignments.filter(a => a.type !== 'quiz').length})
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'quiz' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Cuestionarios ({assignments.filter(a => a.type === 'quiz').length})
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-gray-400 text-sm">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-sm">
            No hay {activeTab === 'quiz' ? 'cuestionarios' : 'ejercicios'} en esta asignatura
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map(a => (
              <div key={a.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium text-gray-900 truncate">{a.title}</span>
                  {a.topicName && (
                    <span className="text-xs text-gray-500 shrink-0">· {a.topicName}</span>
                  )}
                  {a.dueDate && (
                    <span className="text-xs text-gray-400 shrink-0">
                      · {new Date(a.dueDate).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400 shrink-0 ml-4">{a.submissionCount} entregas</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
