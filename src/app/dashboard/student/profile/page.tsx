'use client';

import { SkeletonProfile } from '@/components/ui/SkeletonLoader';
import { useStudentProfile } from './useStudentProfile';
import { ProfileInfoCard } from './ProfileInfoCard';
import { PasswordSection } from './PasswordSection';

export default function StudentProfile() {
  const {
    user,
    loading,
    isEditing,
    setIsEditing,
    formData,
    setFormData,
    passwordData,
    setPasswordData,
    showPasswordForm,
    setShowPasswordForm,
    handleSaveProfile,
    handleChangePassword,
  } = useStudentProfile();

  if (loading) {
    return <SkeletonProfile />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Mi Perfil</h1>
          <p className="text-sm text-gray-600 mt-1">Administra tu información personal</p>
        </div>
      </div>

      <ProfileInfoCard
        user={user}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        formData={formData}
        setFormData={setFormData}
        handleSaveProfile={handleSaveProfile}
      />

      <PasswordSection
        passwordData={passwordData}
        setPasswordData={setPasswordData}
        showPasswordForm={showPasswordForm}
        setShowPasswordForm={setShowPasswordForm}
        handleChangePassword={handleChangePassword}
      />
    </div>
  );
}
