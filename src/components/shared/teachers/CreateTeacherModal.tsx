'use client';

import React, { type FormEvent } from 'react';
import type { ClassSummary } from './types';

interface CreateTeacherModalProps {
  classes: ClassSummary[];
  formData: { email: string; fullName: string; classIds: string[] };
  onFormChange: (data: { email: string; fullName: string; classIds: string[] }) => void;
  creating: boolean;
  isDemo: boolean;
  onSubmit: (e: FormEvent) => void;
  onClose: () => void;
}

export function CreateTeacherModal({
  classes, formData, onFormChange, creating, isDemo, onSubmit, onClose,
}: CreateTeacherModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Crear Nuevo Profesor</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => onFormChange({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => onFormChange({ ...formData, fullName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: David Garcia"
              required
            />
            <p className="mt-1 text-xs text-gray-500">Se enviará un email con las credenciales de acceso</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Asignaturas
              {formData.classIds.length > 0 && (
                <span className="ml-2 text-xs font-normal text-blue-600">
                  {formData.classIds.length} seleccionada{formData.classIds.length !== 1 ? 's' : ''}
                </span>
              )}
            </label>
            {classes.length === 0 ? (
              <p className="text-sm text-gray-400">No hay asignaturas disponibles</p>
            ) : (
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-52 overflow-y-auto">
                {classes.map((cls) => {
                  const checked = formData.classIds.includes(cls.id);
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
                            ? formData.classIds.filter((id) => id !== cls.id)
                            : [...formData.classIds, cls.id];
                          onFormChange({ ...formData, classIds: next });
                        }}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
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
              disabled={creating}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              disabled={creating || isDemo}
              title={isDemo ? 'Función no disponible en modo demo' : ''}
            >
              {creating ? 'Creando...' : isDemo ? 'No disponible (Demo)' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
