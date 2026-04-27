'use client';

import { useState } from 'react';
import { StudentsProgressTable } from '@/components/shared';
import { ClassSearchDropdown } from '@/components/ui/ClassSearchDropdown';
import { AcademySearchDropdown } from '@/components/ui/AcademySearchDropdown';
import { apiClient } from '@/lib/api-client';
import type { StudentsProgressPageProps } from './types';
import { useStudentsData } from './use-students-data';
import { LoadingSkeleton } from './LoadingSkeleton';

export function StudentsProgressPage({ role }: StudentsProgressPageProps) {
  const {
    students,
    academies,
    loading,
    academyName,
    paymentStatus,
    userEmail,
    searchQuery,
    setSearchQuery,
    selectedAcademy,
    setSelectedAcademy,
    selectedClass,
    setSelectedClass,
    filteredClasses,
    activePeriodId,
    isClassInPeriod,
    handleBanStudent,
    pendingWelcomeStudents,
    sendingWelcome,
    sendStudentWelcomeEmails,
  } = useStudentsData(role);

  const [welcomeResult, setWelcomeResult] = useState<{ sent: number; failed: number } | null>(null);

  if (loading) {
    return <LoadingSkeleton />;
  }

  const handleSendWelcome = async () => {
    try {
      const classId = selectedClass !== 'all' ? selectedClass : undefined;
      const result = await sendStudentWelcomeEmails(classId);
      setWelcomeResult(result);
    } catch {
      alert('Error al enviar los emails de bienvenida. Intenta de nuevo.');
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header with Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Progreso de Estudiantes</h1>
          {academyName && <p className="text-sm text-gray-500 mt-1">{academyName}</p>}
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              id="student-search"
              name="studentSearch"
              placeholder="Buscar estudiante"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-48 pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {/* Class Filter - Shows when academy is selected for ADMIN or always for others */}
          {(role !== 'ADMIN' || selectedAcademy !== 'all') && (
            <ClassSearchDropdown
              classes={activePeriodId === 'all' ? filteredClasses : filteredClasses.filter(c => isClassInPeriod(c.startDate))}
              value={selectedClass}
              onChange={setSelectedClass}
              allLabel="Todas las asignaturas"
              className="w-full sm:w-56"
            />
          )}
          {/* Academy Filter - Only for ADMIN */}
          {role === 'ADMIN' && academies.length > 0 && (
            <AcademySearchDropdown
              academies={academies}
              value={selectedAcademy}
              onChange={(v) => { setSelectedAcademy(v); setSelectedClass('all'); }}
              allLabel="Todas las Academias"
              allValue="all"
              className="w-full sm:w-56"
            />
          )}
        </div>
      </div>

      {/* Pending Welcome Emails Banner - ACADEMY only */}
      {role === 'ACADEMY' && pendingWelcomeStudents > 0 && !welcomeResult && (
        <div className="flex items-center justify-between gap-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {pendingWelcomeStudents} {pendingWelcomeStudents === 1 ? 'estudiante tiene' : 'estudiantes tienen'} credenciales pendientes de enviar
              </p>
              <p className="text-xs text-amber-700">Estos estudiantes fueron importados pero aún no han recibido su email de bienvenida con contraseña temporal.</p>
            </div>
          </div>
          <button
            onClick={handleSendWelcome}
            disabled={sendingWelcome}
            className="flex-shrink-0 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-60 transition-colors"
          >
            {sendingWelcome ? 'Enviando...' : 'Enviar bienvenida'}
          </button>
        </div>
      )}
      {role === 'ACADEMY' && welcomeResult && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <span className="text-green-500 text-lg">✓</span>
          <p className="text-sm font-semibold text-green-800">
            {welcomeResult.sent} email{welcomeResult.sent !== 1 ? 's' : ''} de bienvenida enviado{welcomeResult.sent !== 1 ? 's' : ''} correctamente
            {welcomeResult.failed > 0 && ` · ${welcomeResult.failed} fallaron`}
          </p>
        </div>
      )}

      <StudentsProgressTable
        students={students}
        loading={loading}
        searchQuery={searchQuery}
        selectedClass={selectedClass}
        showTeacherColumn={role === 'ACADEMY'}
        showBanButton={role === 'ACADEMY' || role === 'ADMIN'}
        disableBanButton={paymentStatus === 'NOT PAID' && userEmail.toLowerCase().includes('demo')}
        onBanStudent={role === 'ACADEMY' || role === 'ADMIN' ? handleBanStudent : undefined}
        onAlertStudent={role === 'ACADEMY' || role === 'ADMIN' ? async (studentId: string, studentName: string) => {
          try {
            const res = await apiClient(`/students/${studentId}/warn`, { method: 'PATCH' });
            const result = await res.json();
            if (result.success) {
              alert(`Se ha enviado la alerta de actividad sospechosa a ${studentName}. Verá el aviso en su próximo inicio de sesión.`);
            } else {
              alert('Error al enviar la alerta: ' + (result.error || 'Error desconocido'));
            }
          } catch {
            alert('Error de conexión al enviar la alerta.');
          }
        } : undefined}
      />
    </div>
  );
}
