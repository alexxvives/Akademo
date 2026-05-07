'use client';

import { ModalPortal } from '@/components/ui/ModalPortal';
import { CustomDatePicker } from '@/components/ui/CustomDatePicker';
import type { AcademicYear } from './profile-types';
import type { ProfileState } from './useProfileData';
import type { ProfileConnections } from './useProfileConnections';

export function AcademicPeriodsSection({ s, conn }: { s: ProfileState; conn: ProfileConnections }) {
  const { academicYears, activePeriodId, setActivePeriodId, setShowAcademicYearModal, setEditingYear, setEditYearData, showAcademicYearModal, newYearData, setNewYearData, creatingYear, editingYear, editYearData, setEditYearData: _setEditYearData, savingEditYear } = s;
  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-12">
        <div className="px-4 sm:px-8 py-4 sm:py-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold">Períodos Académicos</h2>
              <p className="text-blue-100 mt-1">Organiza tu academia por períodos — año académico, semestre, verano, etc.</p>
            </div>
            <button onClick={() => setShowAcademicYearModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-700 rounded-lg font-medium text-sm hover:bg-blue-50 transition-colors shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Nuevo Período
            </button>
          </div>
        </div>
        <div className="px-4 sm:px-8 py-4 sm:py-6">
          {academicYears.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <p className="text-gray-900 font-medium mb-1">No hay períodos creados</p>
              <p className="text-sm text-gray-500">Crea tu primer período para organizar las asignaturas por etapas de tiempo.</p>
              <button onClick={() => setShowAcademicYearModal(true)} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">Crear primer período</button>
            </div>
          ) : (
            <div className="space-y-3">
              <PeriodRow label="Todos los períodos" desc="Ver datos de todos los períodos sin filtro" isActive={activePeriodId === 'all'} onActivate={() => setActivePeriodId('all')} />
              {(() => {
                const sortedYears = [...academicYears].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
                return academicYears.map((year) => {
                  const warning = getWarning(year, academicYears, sortedYears);
                  return (
                    <div key={year.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${activePeriodId === year.id ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${activePeriodId === year.id ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <div>
                          <p className="font-semibold text-gray-900 inline-flex items-center gap-1">{year.name}{warning && (
                            <span className="relative group inline-flex items-center ml-1">
                              <svg className="w-3.5 h-3.5 text-amber-500 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                              <span className="absolute bottom-full left-0 mb-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-52">{warning.message}</span>
                            </span>
                          )}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(year.startDate + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                            {year.endDate && ` → ${new Date(year.endDate + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setEditingYear(year); setEditYearData({ name: year.name, startDate: year.startDate, endDate: year.endDate || '' }); }} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Editar período">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => conn.handleDeleteAcademicYear(year.id, year.name)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar período">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                        {activePeriodId === year.id ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Período activo</span>
                        ) : (
                          <button onClick={() => conn.handleSetCurrentPeriod(year.id)} className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors">Activar</button>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
              <p className="text-xs text-gray-400 pt-1">Las asignaturas cuya fecha de inicio se encuentre dentro del período activo se mostrarán en el panel principal.</p>
            </div>
          )}
        </div>
      </div>

      {showAcademicYearModal && (
        <PeriodModal title="Nuevo Período" data={newYearData} setData={setNewYearData} onClose={() => setShowAcademicYearModal(false)} onSubmit={conn.handleCreateAcademicYear} loading={creatingYear} submitLabel="Crear período" loadingLabel="Creando..." />
      )}
      {editingYear && (
        <PeriodModal title="Editar Período" data={editYearData} setData={_setEditYearData} onClose={() => setEditingYear(null)} onSubmit={conn.handleEditAcademicYear} loading={savingEditYear} submitLabel="Guardar cambios" loadingLabel="Guardando..." />
      )}
    </>
  );
}

function PeriodRow({ label, desc, isActive, onActivate }: { label: string; desc: string; isActive: boolean; onActivate: () => void }) {
  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isActive ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}>
      <div className="flex items-center gap-3">
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
        <div><p className="font-semibold text-gray-900">{label}</p><p className="text-xs text-gray-500 mt-0.5">{desc}</p></div>
      </div>
      <div className="flex items-center gap-2">
        {isActive ? (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Período activo</span>
        ) : (
          <button onClick={onActivate} className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors">Activar</button>
        )}
      </div>
    </div>
  );
}

function PeriodModal({ title, data, setData, onClose, onSubmit, loading, submitLabel, loadingLabel }: {
  title: string; data: { name: string; startDate: string; endDate: string };
  setData: (fn: (p: { name: string; startDate: string; endDate: string }) => { name: string; startDate: string; endDate: string }) => void;
  onClose: () => void; onSubmit: () => void; loading: boolean; submitLabel: string; loadingLabel: string;
}) {
  return (
    <ModalPortal>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 sm:p-6 max-h-[92dvh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre del período <span className="text-red-500">*</span></label>
              <input type="text" placeholder="Ej: 2025-2026, Verano 2025, Semestre 1..." value={data.name} onChange={(e) => setData(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha de inicio <span className="text-red-500">*</span></label>
              <CustomDatePicker value={data.startDate} onChange={(v) => setData(p => ({ ...p, startDate: v }))} className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha de fin <span className="text-gray-400 text-xs">(opcional)</span></label>
              <CustomDatePicker value={data.endDate} onChange={(v) => setData(p => ({ ...p, endDate: v }))} className="w-full" />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">Cancelar</button>
            <button onClick={onSubmit} disabled={!data.name || !data.startDate || loading} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">{loading ? loadingLabel : submitLabel}</button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

function getWarning(year: AcademicYear, academicYears: AcademicYear[], sortedYears: AcademicYear[]): { type: 'overlap' | 'gap'; message: string } | null {
  for (const other of academicYears) {
    if (other.id === year.id) continue;
    const aStart = new Date(year.startDate + 'T12:00:00');
    const aEnd = year.endDate ? new Date(year.endDate + 'T12:00:00') : null;
    const bStart = new Date(other.startDate + 'T12:00:00');
    const bEnd = other.endDate ? new Date(other.endDate + 'T12:00:00') : null;
    const bEffectiveEnd = bEnd ?? new Date('9999-12-31');
    const aEffectiveEnd = aEnd ?? new Date('9999-12-31');
    if (bStart <= aEffectiveEnd && aStart <= bEffectiveEnd) return { type: 'overlap', message: `Se solapa con "${other.name}"` };
  }
  const idx = sortedYears.findIndex(y => y.id === year.id);
  if (idx > 0) {
    const prev = sortedYears[idx - 1];
    if (prev.endDate && new Date(prev.endDate + 'T12:00:00').getTime() + 86400000 < new Date(year.startDate + 'T12:00:00').getTime())
      return { type: 'gap', message: `Hay un hueco entre "${prev.name}" y este período` };
  }
  if (idx >= 0 && idx < sortedYears.length - 1) {
    const next = sortedYears[idx + 1];
    if (year.endDate && new Date(year.endDate + 'T12:00:00').getTime() + 86400000 < new Date(next.startDate + 'T12:00:00').getTime())
      return { type: 'gap', message: `Hay un hueco entre este período y "${next.name}"` };
  }
  return null;
}
