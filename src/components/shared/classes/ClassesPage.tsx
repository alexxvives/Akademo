'use client';

import { SkeletonClasses } from '@/components/ui/SkeletonLoader';
import { ClassFormModal } from '../ClassFormModal';
import { useClassesData } from './useClassesData';
import { useClassesCrud } from './useClassesCrud';
import { ClassesHeader } from './ClassesHeader';
import { ClassesEmptyState } from './ClassesEmptyState';
import { ClassCard } from './ClassCard';
import type { ClassesPageProps } from './types';

export function ClassesPage({ role }: ClassesPageProps) {
  const data = useClassesData(role);
  const crud = useClassesCrud({
    formData: data.formData,
    setFormData: data.setFormData,
    editingClass: data.editingClass,
    setEditingClass: data.setEditingClass,
    setShowCreateModal: data.setShowCreateModal,
    setShowEditModal: data.setShowEditModal,
    setSaving: data.setSaving,
    setError: data.setError,
    setPaymentOptionsError: data.setPaymentOptionsError,
    isDemo: data.isDemo,
    loadData: data.loadData,
  });

  if (data.loading) {
    return <SkeletonClasses />;
  }

  return (
    <>
      <div className="space-y-6">
        <ClassesHeader
          role={role}
          academyName={data.academyName}
          teachers={data.teachers}
          classes={data.classes}
          academies={data.academies}
          selectedAcademy={data.selectedAcademy}
          setSelectedAcademy={data.setSelectedAcademy}
          selectedClassId={data.selectedClassId}
          setSelectedClassId={data.setSelectedClassId}
          onCreateClass={crud.openCreateModal}
          activePeriodId={data.activePeriodId}
          isClassInPeriod={data.isClassInPeriod}
        />

        {data.filteredClasses.length === 0 ? (
          <ClassesEmptyState role={role} selectedAcademy={data.selectedAcademy} />
        ) : (
          <div className="space-y-4 pb-8">
            {data.filteredClasses.map((cls) => (
              <ClassCard
                key={cls.id}
                cls={cls}
                role={role}
                dashboardBase={data.dashboardBase}
                onEdit={crud.openEditModal}
                onDelete={crud.handleDeleteClass}
              />
            ))}
          </div>
        )}
      </div>

      {role === 'ACADEMY' && data.showCreateModal && (
        <ClassFormModal
          mode="create"
          formData={data.formData}
          setFormData={data.setFormData}
          teachers={data.teachers}
          zoomAccounts={data.zoomAccounts}
          classes={data.classes}
          editingClass={null}
          saving={data.saving}
          error={data.error}
          paymentOptionsError={data.paymentOptionsError}
          isDemo={data.isDemo}
          onSubmit={crud.handleCreateClass}
          onClose={() => data.setShowCreateModal(false)}
        />
      )}

      {(role === 'ACADEMY' || role === 'ADMIN') && data.showEditModal && data.editingClass && (
        <ClassFormModal
          mode="edit"
          formData={data.formData}
          setFormData={data.setFormData}
          teachers={data.teachers}
          zoomAccounts={data.zoomAccounts}
          classes={data.classes}
          editingClass={data.editingClass}
          saving={data.saving}
          error={data.error}
          paymentOptionsError={data.paymentOptionsError}
          isDemo={data.isDemo}
          onSubmit={crud.handleEditClass}
          onClose={() => {
            data.setShowEditModal(false);
            data.setEditingClass(null);
          }}
        />
      )}
    </>
  );
}
