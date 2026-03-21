'use client';

import React, { useMemo } from 'react';
import { StyledSelect } from '@/components/ui/StyledSelect';
import { DatePickerInput } from '@/components/ui/DatePickerInput';
import { PaymentOptionsSection } from './PaymentOptionsSection';
import type { ClassFormModalProps } from './types';

export function ClassFormModal({
  mode,
  formData,
  setFormData,
  teachers,
  zoomAccounts,
  classes: _classes,
  editingClass: _editingClass,
  saving,
  error,
  paymentOptionsError,
  isDemo,
  hasEnrollments,
  onSubmit,
  onClose,
}: ClassFormModalProps) {
  const title = mode === 'create' ? 'Nueva Asignatura' : 'Editar Asignatura';
  const submitLabel = mode === 'create' ? 'Crear Asignatura' : 'Guardar Cambios';
  const savingLabel = mode === 'create' ? 'Creando...' : 'Guardando...';

  const teacherOptions = useMemo(() => [
    { value: '', label: 'Sin profesor asignado' },
    ...teachers.map((t) => ({ value: t.userId, label: `${t.firstName} ${t.lastName}` })),
  ], [teachers]);

  const zoomOptions = useMemo(() => [
    { value: '', label: 'Sin cuenta de Streaming' },
    ...zoomAccounts.map((a) => ({ value: a.id, label: `${a.accountName} (${a.provider === 'gotomeeting' ? 'GoToMeeting' : 'Zoom'})` })),
  ], [zoomAccounts]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl p-6 my-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Row 1: Name, Teacher, Start Date — Row 2: University, Carrera, Max Students */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la asignatura</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                className="w-full h-[42px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Profesor asignado (opcional)</label>
              <StyledSelect
                value={formData.teacherId}
                onChange={(v) => setFormData((f) => ({ ...f, teacherId: v }))}
                options={teacherOptions}
                placeholder="Sin profesor asignado"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de inicio
                {mode === 'edit' && hasEnrollments && (
                  <span className="ml-2 text-xs text-gray-400 font-normal">bloqueada</span>
                )}
              </label>
              {mode === 'edit' && hasEnrollments ? (
                <div className="w-full h-[42px] px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm flex items-center">
                  {formData.startDate || '—'}
                </div>
              ) : (
                <DatePickerInput
                  value={formData.startDate}
                  onChange={(v) => setFormData((f) => ({ ...f, startDate: v }))}
                  required
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Universidad (opcional)</label>
              <input
                type="text"
                value={formData.university}
                onChange={(e) => setFormData((f) => ({ ...f, university: e.target.value }))}
                className="w-full h-[42px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder=""
              />
            </div>

            {/* Carrera field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Carrera (opcional)</label>
              <input
                type="text"
                value={formData.carrera}
                onChange={(e) => setFormData((f) => ({ ...f, carrera: e.target.value }))}
                className="w-full h-[42px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder=""
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Máximo de estudiantes (opcional)
              </label>
              <input
                type="number"
                min="1"
                value={formData.maxStudents}
                onChange={(e) => setFormData((f) => ({ ...f, maxStudents: e.target.value }))}
                className="w-full h-[42px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio de la asignatura
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => {
                  const price = e.target.value;
                  setFormData((f) => ({
                    ...f,
                    price,
                    oneTimePrice: price,
                    monthlyPrice: f.numCobros && price
                      ? (parseFloat(price) / parseInt(f.numCobros)).toFixed(2)
                      : f.monthlyPrice,
                  }));
                }}
                className="w-full h-[42px] pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Payment Options */}
          <PaymentOptionsSection
            formData={formData}
            setFormData={setFormData}
            paymentOptionsError={paymentOptionsError}
          />

          {/* Streaming + WhatsApp side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Streaming */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta de Streaming (opcional)</label>
              <StyledSelect
                value={formData.zoomAccountId}
                onChange={(v) => setFormData((f) => ({ ...f, zoomAccountId: v }))}
                options={zoomOptions}
                placeholder="Sin cuenta de Streaming"
              />
              {zoomAccounts.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  No hay cuentas de Streaming conectadas.{' '}
                  <a href="/dashboard/academy/profile" className="text-blue-600 hover:underline">
                    Conectar cuenta
                  </a>
                </p>
              )}
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enlace de WhatsApp (opcional)
              </label>
              <input
                type="url"
                value={formData.whatsappGroupLink}
                onChange={(e) => setFormData((f) => ({ ...f, whatsappGroupLink: e.target.value }))}
                placeholder="https://chat.whatsapp.com/..."
                className="w-full h-[42px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || isDemo}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              title={isDemo ? 'No disponible en modo demostración' : ''}
            >
              {saving ? savingLabel : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
