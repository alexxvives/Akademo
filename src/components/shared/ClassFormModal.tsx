'use client';

import React from 'react';

interface Teacher {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface ZoomAccount {
  id: string;
  accountName: string;
  accountId: string;
}

interface ClassItem {
  id: string;
  name: string;
  teacherId: string | null;
  monthlyPrice?: number | null;
  oneTimePrice?: number | null;
  zoomAccountId?: string | null;
  whatsappGroupLink?: string | null;
  maxStudents?: number | null;
  startDate?: string | null;
  description: string | null;
  university?: string | null;
  carrera?: string | null;
}

interface ClassFormData {
  name: string;
  description: string;
  teacherId: string;
  monthlyPrice: string;
  oneTimePrice: string;
  allowMonthly: boolean;
  allowOneTime: boolean;
  zoomAccountId: string;
  whatsappGroupLink: string;
  maxStudents: string;
  startDate: string;
  university: string;
  carrera: string;
}

interface ClassFormModalProps {
  mode: 'create' | 'edit';
  formData: ClassFormData;
  setFormData: React.Dispatch<React.SetStateAction<ClassFormData>>;
  teachers: Teacher[];
  zoomAccounts: ZoomAccount[];
  classes: ClassItem[];
  allowMultipleTeachers: boolean;
  editingClass: ClassItem | null;
  saving: boolean;
  error: string;
  paymentOptionsError: boolean;
  isDemo: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function ClassFormModal({
  mode,
  formData,
  setFormData,
  teachers,
  zoomAccounts,
  classes,
  allowMultipleTeachers,
  editingClass,
  saving,
  error,
  paymentOptionsError,
  isDemo,
  onSubmit,
  onClose,
}: ClassFormModalProps) {
  const title = mode === 'create' ? 'Nueva Asignatura' : 'Editar Asignatura';
  const submitLabel = mode === 'create' ? 'Crear Asignatura' : 'Guardar Cambios';
  const savingLabel = mode === 'create' ? 'Creando...' : 'Guardando...';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-3xl p-6 my-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Row 1: Name and Teacher */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la asignatura *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* University field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Universidad (opcional)
              </label>
              <input
                type="text"
                value={formData.university}
                onChange={(e) => setFormData((f) => ({ ...f, university: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder=""
              />
            </div>

            {/* Carrera field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Carrera (opcional)
              </label>
              <input
                type="text"
                value={formData.carrera}
                onChange={(e) => setFormData((f) => ({ ...f, carrera: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder=""
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Profesor asignado (opcional)</label>
              <div className="relative">
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData((f) => ({ ...f, teacherId: e.target.value }))}
                  className="appearance-none w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                >
                  <option value="">Sin profesor asignado (asignar después)</option>
                  {teachers
                    .filter((teacher) => {
                      if (!allowMultipleTeachers && editingClass) {
                        return (
                          teacher.userId === editingClass.teacherId ||
                          !classes.some((cls) => cls.teacherId === teacher.userId)
                        );
                      }
                      if (!allowMultipleTeachers) {
                        return !classes.some((cls) => cls.teacherId === teacher.userId);
                      }
                      return true;
                    })
                    .map((teacher) => (
                      <option key={teacher.userId} value={teacher.userId}>
                        {teacher.firstName} {teacher.lastName} ({teacher.email})
                      </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de inicio <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData((f) => ({ ...f, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Dejar vacío para sin límite</p>
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

          {/* Payment Options */}
          <div className="space-y-4 p-4 rounded-xl transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 group relative">
                <label className="block text-sm font-medium text-gray-900">Opciones de pago *</label>
                <svg className="w-4 h-4 text-gray-400 cursor-help" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="absolute left-0 top-6 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <p className="font-medium mb-1">Consejo:</p>
                  <p>
                    Si seleccionas ambas opciones, los estudiantes podrán elegir entre pago mensual o pago
                    único al inscribirse.
                  </p>
                </div>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full transition-all ${
                  paymentOptionsError
                    ? 'bg-red-100 text-red-700 border-2 border-red-400 font-medium'
                    : 'text-gray-500 bg-gray-100'
                }`}
              >
                Selecciona al menos una
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Monthly */}
              <PaymentOptionCard
                active={formData.allowMonthly}
                onToggle={() => setFormData((f) => ({ ...f, allowMonthly: !f.allowMonthly }))}
                label="Pago Mensual"
                desc="Cobro recurrente mensual"
                color="blue"
                value={formData.monthlyPrice}
                onChange={(v) => setFormData((f) => ({ ...f, monthlyPrice: v, allowMonthly: true }))}
                placeholder="10.00"
              />
              {/* One-time */}
              <PaymentOptionCard
                active={formData.allowOneTime}
                onToggle={() => setFormData((f) => ({ ...f, allowOneTime: !f.allowOneTime }))}
                label="Pago Único"
                desc="Pago único, acceso vitalicio"
                color="green"
                value={formData.oneTimePrice}
                onChange={(v) => setFormData((f) => ({ ...f, oneTimePrice: v, allowOneTime: true }))}
                placeholder="100.00"
              />
            </div>
          </div>

          {/* Zoom */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta de Zoom (opcional)</label>
            <div className="relative">
              <select
                value={formData.zoomAccountId}
                onChange={(e) => setFormData((f) => ({ ...f, zoomAccountId: e.target.value }))}
                className="appearance-none w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Sin cuenta de Zoom</option>
                {zoomAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.accountName}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {zoomAccounts.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                No hay cuentas de Zoom conectadas.{' '}
                <a href="/dashboard/academy/profile" className="text-blue-600 hover:underline">
                  Conectar cuenta
                </a>
              </p>
            )}
          </div>

          {/* WhatsApp */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Enlace de grupo de WhatsApp (opcional)
            </label>
            <input
              type="url"
              value={formData.whatsappGroupLink}
              onChange={(e) => setFormData((f) => ({ ...f, whatsappGroupLink: e.target.value }))}
              placeholder="https://chat.whatsapp.com/..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
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
              className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
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

function PaymentOptionCard({
  active,
  onToggle,
  label,
  desc,
  color,
  value,
  onChange,
  placeholder,
}: {
  active: boolean;
  onToggle: () => void;
  label: string;
  desc: string;
  color: 'blue' | 'green';
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const colors = {
    blue: {
      border: active ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300',
      check: active ? 'border-blue-500 bg-blue-500' : 'border-gray-300',
      label: active ? 'text-blue-900' : 'text-gray-700',
      input: active
        ? 'border-blue-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
        : 'border-gray-200 bg-gray-50',
      desc: active ? 'text-blue-700' : 'text-gray-500',
    },
    green: {
      border: active ? 'border-green-500 bg-green-50 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300',
      check: active ? 'border-green-500 bg-green-500' : 'border-gray-300',
      label: active ? 'text-green-900' : 'text-gray-700',
      input: active
        ? 'border-green-300 bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500'
        : 'border-gray-200 bg-gray-50',
      desc: active ? 'text-green-700' : 'text-gray-500',
    },
  };
  const c = colors[color];

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative p-4 border-2 rounded-xl transition-all duration-200 text-left ${c.border}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${c.check}`}
          >
            {active && (
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span className={`text-sm font-semibold ${c.label}`}>{label}</span>
        </div>
      </div>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">$</span>
        <input
          type="number"
          step="0.01"
          min="0"
          value={value}
          onChange={(e) => {
            e.stopPropagation();
            onChange(e.target.value);
          }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full pl-7 pr-3 py-2 border rounded-lg text-sm font-medium transition-all ${c.input}`}
          placeholder={placeholder}
          disabled={!active}
        />
      </div>
      <p className={`text-xs mt-2 ${c.desc}`}>{desc}</p>
    </button>
  );
}
