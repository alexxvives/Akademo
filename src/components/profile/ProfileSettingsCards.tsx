'use client';

import { WATERMARK_OPTIONS, MULTIPLIER_OPTIONS } from './profile-types';
import { PasswordInput } from '@/components/ui';
import { StyledSelect } from '@/components/ui/StyledSelect';
import type { ProfileState } from './useProfileData';
import type { ProfileActions } from './useProfileActions';

export function AdvancedSettingsCard({ s, actions }: { s: ProfileState; actions: ProfileActions }) {
  const { formData } = s;
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
      <div className="px-4 sm:px-8 py-5 bg-gray-50 border-b border-gray-200 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Configuración Avanzada</h3>
            <p className="text-sm text-gray-600">Feedback y reproducción de videos</p>
          </div>
        </div>
      </div>
      <div className="px-4 sm:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-4 gap-x-8">
          <ToggleSetting label="Habilitar feedback" desc="Permitir valoraciones de estudiantes en las clases" checked={formData.feedbackEnabled} onToggle={() => actions.handleSettingChange('feedbackEnabled', formData.feedbackEnabled ? 0 : 1)} />
          <SelectSetting label="Marca de agua" desc="Frecuencia de aparición" value={formData.defaultWatermarkIntervalMins} options={WATERMARK_OPTIONS} onChange={(v) => actions.handleSettingChange('defaultWatermarkIntervalMins', parseFloat(v))} />
          <ToggleSetting label="Calificación obligatoria" desc="Requiere que los profesores califiquen los ejercicios" checked={formData.requireGrading} onToggle={() => actions.handleSettingChange('requireGrading', formData.requireGrading ? 0 : 1)} />
          <SelectSetting label="Límite de visualización" desc="Veces que puede ver el contenido" value={formData.defaultMaxWatchTimeMultiplier} options={MULTIPLIER_OPTIONS} onChange={(v) => actions.handleSettingChange('defaultMaxWatchTimeMultiplier', parseFloat(v))} />
          <ToggleSetting label="Ocultar lecciones completadas" desc="Oculta automáticamente las lecciones cuando el estudiante ha agotado el tiempo de todos sus videos" checked={formData.hideCompletedLessons} onToggle={() => actions.handleSettingChange('hideCompletedLessons', formData.hideCompletedLessons ? 0 : 1)} />
        </div>
      </div>
    </div>
  );
}

function ToggleSetting({ label, desc, checked, onToggle }: { label: string; desc: string; checked: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <div><label className="block text-sm font-medium text-gray-900">{label}</label><p className="text-xs text-gray-500">{desc}</p></div>
      <div className="flex items-center gap-3 ml-4 shrink-0">
        <button onClick={onToggle} className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer ${checked ? 'bg-brand-600' : 'bg-gray-300'}`}>
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>
    </div>
  );
}

function SelectSetting({ label, desc, value, options, onChange }: { label: string; desc: string; value: number; options: { value: number; label: string }[]; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between">
      <div><label className="block text-sm font-medium text-gray-900">{label}</label><p className="text-xs text-gray-500">{desc}</p></div>
      <div className="ml-4 shrink-0 w-40">
        <StyledSelect
          value={String(value)}
          onChange={onChange}
          options={options.map(o => ({ value: String(o.value), label: o.label }))}
        />
      </div>
    </div>
  );
}

export function SidebarMenuCard({ s, actions }: { s: ProfileState; actions: ProfileActions }) {
  const { formData } = s;
  const menuItems = [
    { label: 'Valoraciones', description: 'Valoraciones de estudiantes' },
    { label: 'Streams', description: 'Clases en vivo por Zoom' },
    { label: 'Ejercicios', description: 'Gestión de ejercicios y entregas' },
    { label: 'Calificaciones', description: 'Sistema de calificaciones' },
  ];
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 sm:px-8 py-5 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Menú lateral</h3>
        <p className="text-sm text-gray-600">Personaliza las opciones visibles en el menú lateral de la academia</p>
      </div>
      <div className="px-4 sm:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map(item => {
            const isHidden = formData.hiddenMenuItems.includes(item.label);
            return (
              <div key={item.label} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500 truncate">{item.description}</p>
                </div>
                <button
                  onClick={() => {
                    const newHidden = isHidden ? formData.hiddenMenuItems.filter((l: string) => l !== item.label) : [...formData.hiddenMenuItems, item.label];
                    actions.handleSettingChange('hiddenMenuItems', newHidden);
                  }}
                  className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors cursor-pointer flex-shrink-0 ml-3 ${!isHidden ? 'bg-brand-600' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${!isHidden ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function PasswordCard({ s, actions }: { s: ProfileState; actions: ProfileActions }) {
  const { showPasswordForm, setShowPasswordForm, passwordData, setPasswordData } = s;
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 sm:px-8 py-4 sm:py-6 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Seguridad</h2>
            <p className="text-sm text-gray-600 mt-1">Cambia tu contraseña</p>
          </div>
          {!showPasswordForm ? (
            <button onClick={() => setShowPasswordForm(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium text-sm shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
              Cambiar Contraseña
            </button>
          ) : (
            <button onClick={() => { setShowPasswordForm(false); setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); }} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium text-sm">Cancelar</button>
          )}
        </div>
      </div>
      {showPasswordForm && (
        <div className="px-4 sm:px-8 py-4 sm:py-6">
          <form onSubmit={actions.handleChangePassword} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña Actual</label>
                <PasswordInput value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nueva Contraseña</label>
                <PasswordInput value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Nueva Contraseña</label>
              <PasswordInput value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" required />
            </div>
            <div className="flex gap-2 pt-4">
              <button type="button" onClick={() => { setShowPasswordForm(false); setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); }} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium text-sm">Cancelar</button>
              <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-all font-medium text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Actualizar Contraseña
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
