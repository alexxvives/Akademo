'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt?: string;
}

export function useTeacherProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [academyName, setAcademyName] = useState<string>('');

  useEffect(() => {
    loadProfile();
    loadAcademyName();
  }, []);

  const loadAcademyName = async () => {
    try {
      const res = await apiClient('/requests/teacher');
      const result = await res.json();
      if (Array.isArray(result) && result.length > 0) {
        setAcademyName(result[0].academyName || '');
      } else if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        setAcademyName(result.data[0].academyName || '');
      }
    } catch (error) {
      console.error('Failed to load academy name:', error);
    }
  };

  const loadProfile = async () => {
    try {
      const res = await apiClient('/auth/me');
      const result = await res.json();
      if (result.success) {
        setUser(result.data);
        setFormData({
          firstName: result.data.firstName,
          lastName: result.data.lastName,
          email: result.data.email,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient('/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: formData.firstName, lastName: formData.lastName }),
      });
      const result = await res.json();
      if (result.success) {
        await loadProfile();
        setIsEditing(false);
      } else {
        alert(result.error || 'Error al guardar el perfil');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error al guardar el perfil');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    try {
      const res = await apiClient('/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword }),
      });
      const result = await res.json();
      if (result.success) {
        alert('Contraseña actualizada correctamente');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswordForm(false);
      } else {
        alert(result.error || 'Error al cambiar la contraseña');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Error al cambiar la contraseña');
    }
  };

  return {
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
    handleSaveProfile,
    handleChangePassword,
  };
}
