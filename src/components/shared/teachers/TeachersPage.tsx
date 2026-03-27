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
