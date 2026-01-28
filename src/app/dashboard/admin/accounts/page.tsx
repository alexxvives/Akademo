'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
  academyName?: string;
}

export default function AccountsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Load all user types
      const [studentsRes, teachersRes, academiesRes] = await Promise.all([
        apiClient('/admin/students'),
        apiClient('/admin/teachers'),
        apiClient('/admin/academies')
      ]);

      const [studentsData, teachersData, academiesData] = await Promise.all([
        studentsRes.json(),
        teachersRes.json(),
        academiesRes.json()
      ]);

      const allUsers: User[] = [];

      // Process students
      if (studentsData.success && Array.isArray(studentsData.data)) {
        allUsers.push(...studentsData.data.map((s: any) => ({
          id: s.id,
          email: s.email,
          firstName: s.firstName,
          lastName: s.lastName,
          role: 'STUDENT',
          createdAt: s.createdAt
        })));
      }

      // Process teachers
      if (teachersData.success && Array.isArray(teachersData.data)) {
        allUsers.push(...teachersData.data.map((t: any) => ({
          id: t.id,
          email: t.email,
          firstName: t.firstName,
          lastName: t.lastName,
          role: 'TEACHER',
          createdAt: t.createdAt,
          academyName: t.academyName
        })));
      }

      // Process academies
      if (academiesData.success && Array.isArray(academiesData.data)) {
        allUsers.push(...academiesData.data.map((a: any) => ({
          id: a.ownerId,
          email: a.ownerEmail || 'N/A',
          firstName: a.ownerFirstName || 'Academia',
          lastName: a.name,
          role: 'ACADEMY',
          createdAt: a.createdAt,
          academyName: a.name
        })));
      }

      // Sort by creation date (newest first)
      allUsers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filter by role
    if (roleFilter !== 'ALL') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        u.email.toLowerCase().includes(term) ||
        u.firstName.toLowerCase().includes(term) ||
        u.lastName.toLowerCase().includes(term) ||
        (u.academyName && u.academyName.toLowerCase().includes(term))
      );
    }

    setFilteredUsers(filtered);
  };

  const handleDeleteAccount = async (user: User) => {
    const roleText = {
      STUDENT: 'estudiante',
      TEACHER: 'profesor',
      ACADEMY: 'academia (¡ESTO ELIMINARÁ TODA LA ACADEMIA!)'
    }[user.role] || 'usuario';

    const confirmMessage = user.role === 'ACADEMY'
      ? `⚠️ ADVERTENCIA CRÍTICA ⚠️\n\n¿Estás seguro que deseas eliminar la cuenta de ${user.firstName} ${user.lastName}?\n\nEsta acción eliminará:\n- La cuenta del propietario\n- TODA la academia "${user.academyName}"\n- TODAS las clases\n- TODAS las lecciones y contenido\n- TODAS las inscripciones\n- TODOS los profesores asignados\n\n❌ ESTA ACCIÓN NO SE PUEDE DESHACER ❌\n\n¿Continuar?`
      : `¿Estás seguro que deseas eliminar la cuenta de ${user.firstName} ${user.lastName}?\n\nTipo: ${roleText}\nEmail: ${user.email}\n\nEsta acción no se puede deshacer.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    // Extra confirmation for academy deletion
    if (user.role === 'ACADEMY') {
      const confirmation = prompt('Para confirmar, escribe "ELIMINAR" en mayúsculas:');
      if (confirmation !== 'ELIMINAR') {
        alert('Eliminación cancelada.');
        return;
      }
    }

    try {
      setDeletingId(user.id);
      
      // Call admin endpoint to delete user account
      const res = await apiClient(`/admin/users/${user.id}`, {
        method: 'DELETE',
      });

      const result = await res.json();

      if (result.success) {
        alert(`Cuenta de ${user.firstName} ${user.lastName} eliminada exitosamente.`);
        // Reload users
        await loadUsers();
      } else {
        alert(`Error: ${result.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Error al eliminar la cuenta.');
    } finally {
      setDeletingId(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'STUDENT': return 'bg-blue-100 text-blue-800';
      case 'TEACHER': return 'bg-green-100 text-green-800';
      case 'ACADEMY': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'STUDENT': return 'Estudiante';
      case 'TEACHER': return 'Profesor';
      case 'ACADEMY': return 'Academia';
      default: return role;
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex items-center justify-between gap-4 border-b border-gray-100">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Gestión de Cuentas</h1>
          <p className="text-sm text-gray-500 mt-1">Administrar y eliminar cuentas de usuarios</p>
        </div>
        
        {/* Filters in top-right */}
        <div className="flex gap-3">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar..."
              className="appearance-none w-64 pl-3 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="appearance-none w-48 pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="ALL">Todos</option>
              <option value="STUDENT">Estudiantes</option>
              <option value="TEACHER">Profesores</option>
              <option value="ACADEMY">Academias</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Stats - No containers */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-3xl font-bold text-gray-900">{users.length}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Estudiantes</p>
          <p className="text-3xl font-bold text-gray-900">{users.filter(u => u.role === 'STUDENT').length}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Profesores</p>
          <p className="text-3xl font-bold text-gray-900">{users.filter(u => u.role === 'TEACHER').length}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Academias</p>
          <p className="text-3xl font-bold text-gray-900">{users.filter(u => u.role === 'ACADEMY').length}</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden">
        <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Academia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Registro
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No se encontraron usuarios
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.academyName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => handleDeleteAccount(user)}
                        disabled={deletingId === user.id}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingId === user.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Eliminando...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Eliminar
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-yellow-900">Advertencia</p>
            <p className="text-sm text-yellow-700 mt-1">
              La eliminación de cuentas es irreversible. Eliminar una academia eliminará todas sus clases, lecciones, y contenido asociado.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
