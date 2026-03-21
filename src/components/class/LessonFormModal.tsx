'use client';

import { StyledSelect } from '@/components/ui/StyledSelect';
import type { Topic, LessonFormData, EditingLessonMedia } from './types';

interface LessonFormModalProps {
  formData: LessonFormData;
  setFormData: React.Dispatch<React.SetStateAction<LessonFormData>>;
  topics: Topic[];
  editingLessonId: string | null;
  editingLessonMedia: EditingLessonMedia | null;
  uploading: boolean;
  uploadProgress: number;
  uploadSpeed: number;
  uploadETA: number;
  paymentStatus: string;
  availableStreamRecordings: Array<{ id: string; title: string; createdAt: string }>;
  onSubmitCreate: (e: React.FormEvent) => void;
  onSubmitUpdate: (e: React.FormEvent) => void;
  onClose: () => void;
  onDeleteVideo: (id: string) => void;
  onDeleteDocument: (id: string) => void;
  onAddVideo: (file: File) => void;
  onAddDocument: (file: File) => void;
}

export default function LessonFormModal({
  formData,
  setFormData,
  topics,
  editingLessonId,
  editingLessonMedia,
  uploading,
  uploadProgress,
  uploadSpeed,
  uploadETA,
  paymentStatus,
  availableStreamRecordings,
  onSubmitCreate,
  onSubmitUpdate,
  onClose,
  onDeleteVideo,
  onDeleteDocument,
  onAddVideo,
  onAddDocument,
}: LessonFormModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 !m-0 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex justify-between items-center flex-shrink-0">
          <h3 className="text-xl font-semibold text-gray-900">
            {editingLessonId ? 'Editar Clase' : 'Crear Nueva Clase'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={editingLessonId ? onSubmitUpdate : onSubmitCreate} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Row 1: Title | Topic */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Título</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
                placeholder="Titulo de la clase"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tema</label>
              <StyledSelect
                value={formData.topicId}
                onChange={(v) => setFormData(prev => ({ ...prev, topicId: v }))}
                options={[
                  { value: '', label: 'Sin tema' },
                  ...topics.map(topic => ({ value: topic.id, label: topic.name })),
                ]}
                placeholder="Sin tema"
              />
            </div>
          </div>

          {/* Row 2: Publish options — CREATE mode only */}
          {!editingLessonId && (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Publicación</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, publishImmediately: true }))}
                    className={`flex-1 h-[42px] px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      formData.publishImmediately
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Ahora
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, publishImmediately: false }))}
                    className={`flex-1 h-[42px] px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      !formData.publishImmediately
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Programar
                    </div>
                  </button>
                </div>
              </div>
              {!formData.publishImmediately && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha y Hora</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={formData.releaseDate}
                      onChange={e => setFormData(prev => ({ ...prev, releaseDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
                    />
                    <input
                      type="time"
                      value={formData.releaseTime}
                      onChange={e => setFormData(prev => ({ ...prev, releaseTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors resize-y"
              placeholder="Descripcion de la clase"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Multiplicador <span className="text-xs font-normal text-gray-500">(El video podrá verse durante X veces su duración)</span></label>
              <input type="number" min="1" max="10" step="0.5" value={formData.maxWatchTimeMultiplier} onChange={e => setFormData(prev => ({ ...prev, maxWatchTimeMultiplier: parseFloat(e.target.value) }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Marca de agua <span className="text-xs font-normal text-gray-500">(Cada cuántos minutos aparece)</span></label>
              <input type="number" min="1" max="60" value={formData.watermarkIntervalMins} onChange={e => setFormData(prev => ({ ...prev, watermarkIntervalMins: parseInt(e.target.value) }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"/>
            </div>
          </div>

          {/* CREATE MODE: File upload fields */}
          {!editingLessonId && (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Video/s</label>
                  <input
                    type="file"
                    accept="video/mp4"
                    multiple
                    onChange={e => { if (e.target.files) Array.from(e.target.files).forEach(onAddVideo); e.target.value = ''; }}
                    className="w-full h-[38px] px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 file:mr-4 file:py-0.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                  />
                  {formData.videos.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {formData.videos.map((v, i) => (
                        <div key={`video-${i}-${v.file.name}`} className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-gray-900 truncate block">{v.file.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, videos: prev.videos.filter((_, j) => j !== i) }))}
                            className="text-xs text-red-600 bg-red-100 hover:bg-red-200 px-2 py-1 rounded transition-colors"
                          >
                            Eliminar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Stream Recording Selection */}
                <StreamRecordingSelector
                  formData={formData}
                  setFormData={setFormData}
                  availableStreamRecordings={availableStreamRecordings}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Documentos (PDF)</label>
                <input type="file" accept=".pdf" multiple onChange={e => { if (e.target.files) Array.from(e.target.files).forEach(onAddDocument); e.target.value = ''; }} className="w-full h-[38px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 file:mr-4 file:py-0.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"/>
                {formData.documents.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {formData.documents.map((d, i) => (
                      <div key={`doc-${i}-${d.file.name}`} className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-gray-900 truncate block">{d.file.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, documents: prev.documents.filter((_, j) => j !== i) }))}
                          className="text-xs text-red-600 bg-red-100 hover:bg-red-200 px-2 py-1 rounded transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* EDIT MODE: Current media + add more */}
          {editingLessonId && editingLessonMedia && (
            <div className="space-y-4">
              {/* Current Videos */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Videos actuales ({editingLessonMedia.videos.length})
                </label>
                {editingLessonMedia.videos.length > 0 ? (
                  <div className="space-y-2">
                    {editingLessonMedia.videos.map((v, i) => (
                      <div key={v.id} className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{v.title || `Video ${i + 1}`}</p>
                          {v.durationSeconds && (
                            <p className="text-xs text-gray-500">
                              {Math.floor(v.durationSeconds / 60)}:{(v.durationSeconds % 60).toString().padStart(2, '0')}
                            </p>
                          )}
                        </div>
                        <button type="button" onClick={() => onDeleteVideo(v.id)} className="text-xs text-red-600 bg-red-100 hover:bg-red-200 px-2 py-1 rounded transition-colors">
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No hay videos en esta lección</p>
                )}
              </div>

              {/* Current Documents */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Documentos actuales ({editingLessonMedia.documents.length})
                </label>
                {editingLessonMedia.documents.length > 0 ? (
                  <div className="space-y-2">
                    {editingLessonMedia.documents.map((d) => (
                      <div key={d.id} className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{d.title || d.fileName}</p>
                          <p className="text-xs text-gray-500 truncate">{d.fileName}</p>
                        </div>
                        <button type="button" onClick={() => onDeleteDocument(d.id)} className="text-xs text-red-600 bg-red-100 hover:bg-red-200 px-2 py-1 rounded transition-colors">
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No hay documentos en esta lección</p>
                )}
              </div>

              {/* Add More Files */}
              <div className="pt-4 border-t border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Agregar más archivos</label>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Nuevos videos</label>
                    <input
                      type="file"
                      accept="video/mp4"
                      multiple
                      onChange={e => { if (e.target.files) Array.from(e.target.files).forEach(onAddVideo); e.target.value = ''; }}
                      className="w-full h-[38px] px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 file:mr-4 file:py-0.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                    />
                    {formData.videos.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {formData.videos.map((v, i) => (
                          <div key={`video-${i}-${v.file.name}`} className="relative p-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                              </svg>
                            </div>
                            <span className="text-xs text-gray-700 truncate flex-1">{v.file.name}</span>
                            <button type="button" onClick={() => setFormData(prev => ({ ...prev, videos: prev.videos.filter((_, j) => j !== i) }))} className="w-5 h-5 flex items-center justify-center text-red-500 hover:text-red-700 rounded">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Nuevos documentos (PDF)</label>
                    <input
                      type="file"
                      accept=".pdf"
                      multiple
                      onChange={e => { if (e.target.files) Array.from(e.target.files).forEach(onAddDocument); e.target.value = ''; }}
                      className="w-full h-[38px] px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 file:mr-4 file:py-0.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                    />
                    {formData.documents.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {formData.documents.map((d, i) => (
                          <div key={`doc-${i}-${d.file.name}`} className="relative p-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                              </svg>
                            </div>
                            <span className="text-xs text-gray-700 truncate flex-1">{d.file.name}</span>
                            <button type="button" onClick={() => setFormData(prev => ({ ...prev, documents: prev.documents.filter((_, j) => j !== i) }))} className="w-5 h-5 flex items-center justify-center text-red-500 hover:text-red-700 rounded">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">O utiliza grabaciones de stream</label>
                  <StreamRecordingSelector
                    formData={formData}
                    setFormData={setFormData}
                    availableStreamRecordings={availableStreamRecordings}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Upload Progress Bar */}
          {uploading && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-medium">Subiendo archivos...</span>
                  {uploadSpeed > 0 && (
                    <span className="text-xs text-gray-500">
                      {(uploadSpeed / 1024 / 1024).toFixed(1)} MB/s
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {uploadETA > 0 && uploadProgress < 99 && (
                    <span className="text-xs text-gray-500">
                      ~{Math.ceil(uploadETA / 60)}min restante{Math.ceil(uploadETA / 60) !== 1 ? 's' : ''}
                    </span>
                  )}
                  <span className="font-bold">{Math.round(uploadProgress)}%</span>
                </div>
              </div>
              <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-amber-600 mt-2 font-medium">
                ⚠️ No salgas de esta página ni cierres el navegador hasta que termine la subida.
              </p>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <button
              type="submit"
              disabled={paymentStatus === 'NOT PAID'}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title={paymentStatus === 'NOT PAID' ? 'Active su academia para crear lecciones' : ''}
            >
              {uploading ? 'Creando...' : editingLessonId ? 'Actualizar Lección' : 'Crear Lección'}
            </button>
            <button type="button" onClick={onClose} className="px-6 py-2.5 text-gray-600 hover:text-gray-900 font-medium text-sm">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StreamRecordingSelector({
  formData,
  setFormData,
  availableStreamRecordings,
}: {
  formData: LessonFormData;
  setFormData: React.Dispatch<React.SetStateAction<LessonFormData>>;
  availableStreamRecordings: Array<{ id: string; title: string; createdAt: string }>;
}) {
  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">O utiliza grabaciones de stream</label>
      <details className="w-full border border-gray-200 rounded-lg text-sm bg-white">
        <summary className="px-3 py-2 cursor-pointer hover:bg-gray-50 rounded-lg flex items-center justify-between">
          <span>
            {formData.selectedStreamRecordings.length > 0
              ? `${formData.selectedStreamRecordings.length} grabaciones seleccionadas`
              : availableStreamRecordings.length === 0
                ? 'No hay grabaciones disponibles'
                : 'Seleccionar grabaciones'}
          </span>
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <div className="absolute left-0 right-0 mt-1 px-3 py-2 max-h-[200px] overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-lg z-50">
          {availableStreamRecordings.length === 0 ? (
            <p className="text-gray-500 text-sm py-1">No hay grabaciones disponibles</p>
          ) : (
            <div className="space-y-2">
              {availableStreamRecordings.map(recording => (
                <label key={recording.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={formData.selectedStreamRecordings.includes(recording.id)}
                    onChange={e => {
                      const checked = e.target.checked;
                      setFormData(prev => ({
                        ...prev,
                        selectedStreamRecordings: checked
                          ? [...prev.selectedStreamRecordings, recording.id]
                          : prev.selectedStreamRecordings.filter(id => id !== recording.id)
                      }));
                    }}
                    className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                  />
                  <span className="text-sm text-gray-700 flex-1">
                    {recording.title} ({new Date(recording.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })})
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      </details>
    </div>
  );
}
