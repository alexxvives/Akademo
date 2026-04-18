'use client';

import { SkeletonProfile } from '@/components/ui/SkeletonLoader';
import { useTeacherProfile } from './useTeacherProfile';
import { ProfileInfoCard } from './components/ProfileInfoCard';
import { PasswordChangeCard } from './components/PasswordChangeCard';

export default function TeacherProfile() {
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
    academyName,
    emailChangeStep,
    pendingEmailChange,
    emailChangeCode,
    setEmailChangeCode,
    originalEmail,
    handleSaveProfile,
    handleChangePassword,
    handleRequestEmailChange,
    handleConfirmEmailChange,
    handleCancelEmailChange,
  } = useTeacherProfile();

  if (loading) {
    return <SkeletonProfile />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Mi Perfil</h1>
          <p className="text-sm text-gray-600 mt-1">
            {academyName ? `${academyName}` : 'Administra tu información personal'}
          </p>
        </div>
      </div>

      <ProfileInfoCard
        user={user}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        formData={formData}
        setFormData={setFormData}
        handleSaveProfile={handleSaveProfile}
        emailChangeStep={emailChangeStep}
        pendingEmailChange={pendingEmailChange}
        emailChangeCode={emailChangeCode}
        setEmailChangeCode={setEmailChangeCode}
        originalEmail={originalEmail}
        handleRequestEmailChange={handleRequestEmailChange}
        handleConfirmEmailChange={handleConfirmEmailChange}
        handleCancelEmailChange={handleCancelEmailChange}
      />

      <PasswordChangeCard
        showPasswordForm={showPasswordForm}
        setShowPasswordForm={setShowPasswordForm}
        passwordData={passwordData}
        setPasswordData={setPasswordData}
        handleChangePassword={handleChangePassword}
      />
    </div>
  );
}
