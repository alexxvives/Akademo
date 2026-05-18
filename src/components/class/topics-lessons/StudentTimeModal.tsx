'use client';

import { useState } from 'react';
import type { Lesson, StudentTimeData } from './types';

interface StudentTimeModalProps {
  show: boolean;
  lesson: Lesson | null;
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  studentData: StudentTimeData[];
  isDisabled: boolean;
  onUpdateTime: (studentId: string, videoId: string, newTimeSeconds: number) => void;
  onAddExtension: (studentId: string, videoId: string, extraMinutes: number, validFrom: string, validUntil: string) => Promise<void>;
  onDeleteExtension: (extensionId: string) => Promise<void>;
  onClose: () => void;
}

export function StudentTimeModal({
  show, lesson, isLoading, searchQuery, onSearchChange, studentData, isDisabled, onUpdateTime, onAddExtension, onDeleteExtension, onClose,
}: StudentTimeModalProps) {
  const [extFormKey, setExtFormKey] = useState<string | null>(null);
  const defaultFrom = () => { const d = new Date(); d.setSeconds(0, 0); return d.toISOString().slice(0, 16); };
  const defaultUntil = () => { const d = new Date(Date.now() + 2 * 3600000); d.setSeconds(0, 0); return d.toISOString().slice(0, 16); };
  const [extForm, setExtForm] = useState({ extraMinutes: 60, validFrom: defaultFrom(), validUntil: defaultUntil() });
  const [savingExt, setSavingExt] = useState(false);

  const openExtForm = (studentId: string, videoId: string) => {
    setExtFormKey(`${studentId}:${videoId}`);
    setExtForm({ extraMinutes: 60, validFrom: defaultFrom(), validUntil: defaultUntil() });
  };

  const handleExtSubmit = async (studentId: string, videoId: string) => {
    setSavingExt(true);
    try {
      await onAddExtension(studentId, videoId, extForm.extraMinutes, extForm.validFrom + ':00', extForm.validUntil + ':00');
      setExtFormKey(null);
    } finally {
      setSavingExt(false);
    }
  };
  if (!show || !lesson) return null;

  const hasNoVideos = studentData.length > 0 && studentData.every(s => s.videos.length === 0);

  const filteredData = searchQuery
    ? studentData.filter(s => s.studentName.toLowerCase().includes(searchQuery.toLowerCase()))
    : studentData;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95dvh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Gestionar tiempos de estudiantes</h3>
              <p className="text-sm text-gray-600 mt-1">{lesson.title}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : hasNoVideos ? (
            <div className="text-center py-12 text-gray-500">
              <p>Esta clase no tiene ningún video</p>
            </div>
          ) : studentData.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No hay datos de estudiantes para esta lección</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar estudiante..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={() => onSearchChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {filteredData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No se encontraron estudiantes con &quot;{searchQuery}&quot;</p>
                </div>
              ) : filteredData.map((student) => (
                <div key={student.studentId} className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">{student.studentName}</h4>
                  {student.videos.length === 0 ? (
                    <p className="text-sm text-gray-500">No ha visto ningún video aún</p>
                  ) : (
                    <div className="space-y-3">
                      {student.videos.map((video, videoIndex) => (
                        <div key={video.videoId} className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1">
                              <p className="font-medium text-gray-900 text-sm">Video {videoIndex + 1}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-600">
                                  Tiempo usado: {video.totalWatchTimeSeconds < 0 ? '-' : ''}{Math.floor(Math.abs(video.totalWatchTimeSeconds) / 60)}:{String(Math.floor(Math.abs(video.totalWatchTimeSeconds) % 60)).padStart(2, '0')}
                                </span>
                                <span className="text-xs text-gray-400">/</span>
                                <span className="text-xs text-gray-600">
                                  Máx: {Math.floor((video.effectiveMaxWatchTimeSeconds ?? video.maxWatchTimeSeconds) / 60)}:{String(Math.floor((video.effectiveMaxWatchTimeSeconds ?? video.maxWatchTimeSeconds) % 60)).padStart(2, '0')}
                                  {video.effectiveMaxWatchTimeSeconds && video.effectiveMaxWatchTimeSeconds > video.maxWatchTimeSeconds && (
                                    <span className="ml-1 text-emerald-600 font-semibold">(+{Math.round((video.effectiveMaxWatchTimeSeconds - video.maxWatchTimeSeconds) / 60)}min extra)</span>
                                  )}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  video.status === 'BLOCKED'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-green-100 text-green-700'
                                }`}>
                                  {video.status === 'BLOCKED' ? 'Bloqueado' : 'Activo'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap justify-end">
                              <button
                                onClick={() => onUpdateTime(student.studentId, video.videoId, 0)}
                                disabled={isDisabled}
                                className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                                title={isDisabled ? 'Active su academia para modificar tiempos' : 'Reiniciar completamente'}
                              >
                                Reiniciar
                              </button>
                              <button
                                onClick={() => onUpdateTime(student.studentId, video.videoId, video.totalWatchTimeSeconds - 900)}
                                disabled={isDisabled}
                                className="px-2 py-1 bg-gray-900 text-white rounded text-xs hover:bg-gray-800 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                                title={isDisabled ? 'Active su academia para modificar tiempos' : 'Reducir 15 minutos'}
                              >
                                +15min
                              </button>
                              <button
                                onClick={() => onUpdateTime(student.studentId, video.videoId, video.totalWatchTimeSeconds - 1800)}
                                disabled={isDisabled}
                                className="px-2 py-1 bg-gray-900 text-white rounded text-xs hover:bg-gray-800 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                                title={isDisabled ? 'Active su academia para modificar tiempos' : 'Reducir 30 minutos'}
                              >
                                +30min
                              </button>
                              <button
                                onClick={() => onUpdateTime(student.studentId, video.videoId, video.totalWatchTimeSeconds - 3600)}
                                disabled={isDisabled}
                                className="px-2 py-1 bg-gray-900 text-white rounded text-xs hover:bg-gray-800 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                                title={isDisabled ? 'Active su academia para modificar tiempos' : 'Reducir 1 hora'}
                              >
                                +1hr
                              </button>
                              <button
                                onClick={() => extFormKey === `${student.studentId}:${video.videoId}` ? setExtFormKey(null) : openExtForm(student.studentId, video.videoId)}
                                disabled={isDisabled}
                                className="px-2 py-1 bg-emerald-600 text-white rounded text-xs hover:bg-emerald-700 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                                title={isDisabled ? 'Active su academia para modificar tiempos' : 'Dar tiempo extra con ventana de acceso'}
                              >
                                ⊕ Extra
                              </button>
                            </div>
                          </div>

                          {/* Existing extensions */}
                          {(video.extensions ?? []).length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {(video.extensions ?? []).map(ext => (
                                <span key={ext.id} className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border ${
                                  ext.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'
                                }`}>
                                  {ext.isActive && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>}
                                  +{Math.round(ext.extraSeconds / 60)}min · {new Date(ext.validFrom).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })}–{new Date(ext.validUntil).toLocaleTimeString('es', { timeStyle: 'short' })}
                                  <button onClick={() => onDeleteExtension(ext.id)} className="ml-0.5 text-gray-400 hover:text-red-500 leading-none" title="Eliminar extensión">×</button>
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Extension form */}
                          {extFormKey === `${student.studentId}:${video.videoId}` && (
                            <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200 space-y-2">
                              <p className="text-xs font-semibold text-emerald-800">Tiempo extra con ventana de acceso</p>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div>
                                  <label className="block text-xs text-gray-600 mb-0.5">Minutos extra</label>
                                  <input
                                    type="number" min={1} max={600}
                                    value={extForm.extraMinutes}
                                    onChange={e => setExtForm(f => ({ ...f, extraMinutes: Number(e.target.value) }))}
                                    className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-0.5">Válido desde</label>
                                  <input
                                    type="datetime-local"
                                    value={extForm.validFrom}
                                    onChange={e => setExtForm(f => ({ ...f, validFrom: e.target.value }))}
                                    className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-0.5">Válido hasta</label>
                                  <input
                                    type="datetime-local"
                                    value={extForm.validUntil}
                                    onChange={e => setExtForm(f => ({ ...f, validUntil: e.target.value }))}
                                    className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleExtSubmit(student.studentId, video.videoId)}
                                  disabled={savingExt}
                                  className="px-3 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700 disabled:opacity-50"
                                >
                                  {savingExt ? 'Guardando...' : 'Guardar'}
                                </button>
                                <button onClick={() => setExtFormKey(null)} className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300">Cancelar</button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
