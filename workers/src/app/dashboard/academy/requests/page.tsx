'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface PendingEnrollment {
  id: string;
  studentName: string;
  studentEmail: string;
  className: string;
  classId: string;
  teacherName: string;
  teacherId: string;
  createdAt: string;
}

export default function AcademyRequestsPage() {
  const [pendingEnrollments, setPendingEnrollments] = useState<PendingEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPendingEnrollments();
  }, []);

  const loadPendingEnrollments = async () => {
    try {
      const response = await apiClient('/enrollments/pending');
      const result = await response.json();
      if (result.success) {
        // Map nested API response to flat structure with teacher info
        const mapped = result.data.map((e: any) => ({
          id: e.id,
          studentName: `${e.student.firstName} ${e.student.lastName}`,
          studentEmail: e.student.email,
          className: e.class.name,
          classId: e.class.id,
          teacherName: e.class.teacherName || 'Sin profesor',
          teacherId: e.class.teacherId || '',
          createdAt: e.enrolledAt || e.createdAt,
        }));
        setPendingEnrollments(mapped);
      }
    } catch (error) {
      console.error('Error loading pending enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (enrollmentId: string) => {
    setProcessingIds(prev => new Set(prev).add(enrollmentId));
    try {
      const response = await apiClient('/enrollments/pending', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId, action: 'APPROVE' }),
      });

      const result = await response.json();
      if (result.success) {
        setPendingEnrollments(prev => prev.filter(e => e.id !== enrollmentId));
      } else {
        alert(result.error || 'Failed to approve enrollment');
      }
    } catch (error) {
      console.error('Error approving enrollment:', error);
      alert('An error occurred');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(enrollmentId);
        return next;
      });
    }
  };

  const handleReject = async (enrollmentId: string) => {
    setProcessingIds(prev => new Set(prev).add(enrollmentId));
    try {
      const response = await apiClient('/enrollments/pending', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId, action: 'REJECT' }),
      });

      const result = await response.json();
      if (result.success) {
        setPendingEnrollments(prev => prev.filter(e => e.id !== enrollmentId));
      } else {
        alert(result.error || 'Failed to reject enrollment');
      }
    } catch (error) {
      console.error('Error rejecting enrollment:', error);
      alert('An error occurred');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(enrollmentId);
        return next;
      });
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Solicitudes de Inscripción</h1>
          <p className="text-gray-600 text-sm mt-1">Revisa y aprueba las solicitudes de estudiantes de toda la academia</p>
        </div>

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando solicitudes...</p>
          </div>
        ) : pendingEnrollments.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay solicitudes pendientes</h3>
            <p className="text-gray-600">Cuando los estudiantes soliciten inscribirse, aparecerán aquí.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingEnrollments.map((enrollment) => (
              <div key={enrollment.id} className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-all">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex items-center gap-8">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">{enrollment.studentName}</h3>
                        <p className="text-sm text-gray-600">{enrollment.studentEmail}</p>
                      </div>
                      <div className="border-l border-gray-200 pl-8">
                        <div className="flex items-center gap-2 text-sm mb-0.5">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          <span className="text-gray-900 font-medium">{enrollment.className}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>Profesor: {enrollment.teacherName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Solicitado {(() => {
                            const formatted = new Date(enrollment.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
                            return formatted.charAt(0).toUpperCase() + formatted.slice(1);
                          })()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <button
                      onClick={() => handleReject(enrollment.id)}
                      disabled={processingIds.has(enrollment.id)}
                      className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingIds.has(enrollment.id) ? 'Procesando...' : 'Rechazar'}
                    </button>
                    <button
                      onClick={() => handleApprove(enrollment.id)}
                      disabled={processingIds.has(enrollment.id)}
                      className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingIds.has(enrollment.id) ? 'Procesando...' : 'Aprobar'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
