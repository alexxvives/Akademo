'use client';

import React, { type FormEvent } from 'react';
import type { ClassSummary } from './types';

interface EditTeacherModalProps {
  classes: ClassSummary[];
  editFormData: { fullName: string; email: string; classIds: string[] };
  onFormChange: (data: { fullName: string; email: string; classIds: string[] }) => void;
  updating: boolean;
  onSubmit: (e: FormEvent) => void;
  onClose: () => void;
}

export function EditTeacherModal({
  classes, editFormData, onFormChange, updating, onSubmit, onClose,
}: EditTeacherModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Editar Profesor</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
            <input
              type="text"
              value={editFormData.fullName}
              onChange={(e) => onFormChange({ ...editFormData, fullName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={editFormData.email}
              onChange={(e) => onFormChange({ ...editFormData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Asignaturas
              {editFormData.classIds.length > 0 && (
                <span className="ml-2 text-xs font-normal text-brand-600">
                  {editFormData.classIds.length} seleccionada{editFormData.classIds.length !== 1 ? 's' : ''}
                </span>
              )}
            </label>
            {classes.length === 0 ? (
              <p className="text-sm text-gray-400">No hay asignaturas disponibles</p>
            ) : (
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-52 overflow-y-auto">
                {classes.map((cls) => {
                  const checked = editFormData.classIds.includes(cls.id);
                  return (
                    <label
                      key={cls.id}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const next = checked
                            ? editFormData.classIds.filter((id) => id !== cls.id)
                            : [...editFormData.classIds, cls.id];
                          onFormChange({ ...editFormData, classIds: next });
                        }}
                        className="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500"
                      />
                      <span className="text-sm text-gray-700">{cls.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              disabled={updating}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 text-sm font-medium"
              disabled={updating}
            >
              {updating ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
