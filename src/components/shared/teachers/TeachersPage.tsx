'use client';

import React, { useState } from 'react';
import { SkeletonTeachers } from '@/components/ui/SkeletonLoader';
import type { TeachersPageProps } from './types';
import { useTeachersData } from './useTeachersData';
import { useTeacherActions } from './useTeacherActions';
import { TeachersHeader } from './TeachersHeader';
import { TeachersTable } from './TeachersTable';
import { CreateTeacherModal } from './CreateTeacherModal';
import { EditTeacherModal } from './EditTeacherModal';
import { MigrationModal } from '@/components/admin/MigrationModal';

export function TeachersPage({ role }: TeachersPageProps) {
  const data = useTeachersData(role);
  const [showMigration, setShowMigration] = useState(false);
  const [teacherWelcomeResult, setTeacherWelcomeResult] = useState<{ sent: number; failed: number } | null>(null);
  const actions = useTeacherActions({
    setDeleting: data.setDeleting,
    setEditingTeacher: data.setEditingTeacher,
    setEditFormData: data.setEditFormData,
    setShowEditModal: data.setShowEditModal,
    setUpdating: data.setUpdating,
    setShowCreateModal: data.setShowCreateModal,
    setCreating: data.setCreating,
    formData: data.formData,
    setFormData: data.setFormData,
    setCopiedId: data.setCopiedId,
    loadTeachers: data.loadTeachers,
    editingTeacher: data.editingTeacher,
    editFormData: data.editFormData,
  });

  if (data.loading) return <SkeletonTeachers />;

  const handleSendTeacherWelcome = async () => {
    try {
      const result = await data.sendTeacherWelcomeEmails();
      setTeacherWelcomeResult(result);
    } catch {
      alert('Error al enviar los emails de bienvenida. Intenta de nuevo.');
    }
  };

  return (
    <>
      <div className="space-y-6">
        <TeachersHeader
          role={role}
          academyName={data.academyName}
          academies={data.academies}
          selectedAcademy={data.selectedAcademy}
          onSelectAcademy={data.setSelectedAcademy}
          searchQuery={data.searchQuery}
          onSearchChange={data.setSearchQuery}
          onCreateClick={() => data.setShowCreateModal(true)}
          onMigrationClick={role === 'ACADEMY' ? () => setShowMigration(true) : undefined}
        />

        {/* Pending Welcome Emails Banner - ACADEMY only */}
        {role === 'ACADEMY' && data.pendingWelcomeTeachers > 0 && !teacherWelcomeResult && (
          <div className="flex items-center justify-between gap-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  {data.pendingWelcomeTeachers} {data.pendingWelcomeTeachers === 1 ? 'profesor tiene' : 'profesores tienen'} credenciales pendientes de enviar
                </p>
                <p className="text-xs text-amber-700">Estos profesores fueron importados pero aún no han recibido su email de bienvenida con contraseña temporal.</p>
              </div>
            </div>
            <button
              onClick={handleSendTeacherWelcome}
              disabled={data.sendingTeacherWelcome}
              className="flex-shrink-0 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-60 transition-colors"
            >
              {data.sendingTeacherWelcome ? 'Enviando...' : 'Enviar bienvenida'}
            </button>
          </div>
        )}
        {role === 'ACADEMY' && teacherWelcomeResult && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <span className="text-green-500 text-lg">✓</span>
            <p className="text-sm font-semibold text-green-800">
              {teacherWelcomeResult.sent} email{teacherWelcomeResult.sent !== 1 ? 's' : ''} de bienvenida enviado{teacherWelcomeResult.sent !== 1 ? 's' : ''} correctamente
              {teacherWelcomeResult.failed > 0 && ` · ${teacherWelcomeResult.failed} fallaron`}
            </p>
          </div>
        )}

        <TeachersTable
          role={role}
          teachers={data.filteredTeachers}
          expandedTeachers={data.expandedTeachers}
          isDemo={data.isDemo}
          copiedId={data.copiedId}
          deleting={data.deleting}
          classes={data.classes}
          activePeriodId={data.activePeriodId}
          isClassInPeriod={data.isClassInPeriod}
          onToggleExpand={data.toggleExpand}
          onCopyJoinLink={actions.copyJoinLink}
          onEdit={actions.openEditModal}
          onDelete={actions.handleDeleteTeacher}
        />
      </div>

      {(role === 'ACADEMY' || role === 'ADMIN') && data.showCreateModal && (
        <CreateTeacherModal
          classes={data.classes}
          formData={data.formData}
          onFormChange={data.setFormData}
          creating={data.creating}
          isDemo={data.isDemo}
          onSubmit={actions.handleCreateTeacher}
          onClose={() => {
            data.setShowCreateModal(false);
            data.setFormData({ email: '', fullName: '', classId: '' });
          }}
        />
      )}

      {role === 'ACADEMY' && data.showEditModal && data.editingTeacher && (
        <EditTeacherModal
          classes={data.classes}
          editFormData={data.editFormData}
          onFormChange={data.setEditFormData}
          updating={data.updating}
          onSubmit={actions.handleUpdateTeacher}
          onClose={() => {
            data.setShowEditModal(false);
            data.setEditingTeacher(null);
          }}
        />
      )}
      {role === 'ACADEMY' && showMigration && data.academyId && (
        <MigrationModal
          academyId={data.academyId}
          academyName={data.academyName}
          onClose={() => setShowMigration(false)}
        />
      )}
    </>
  );
}
