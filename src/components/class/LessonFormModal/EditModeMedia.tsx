'use client';

import { useState } from 'react';
import type { LessonFormData, EditingLessonMedia } from '../types';
import { StreamRecordingSelector } from './StreamRecordingSelector';

interface EditModeMediaProps {
  formData: LessonFormData;
  setFormData: React.Dispatch<React.SetStateAction<LessonFormData>>;
  editingLessonMedia: EditingLessonMedia;
  availableStreamRecordings: Array<{ id: string; title: string; createdAt: string }>;
  onDeleteVideo: (id: string) => void;
  onDeleteDocument: (id: string) => void;
  onToggleDocumentDownload: (id: string, allowDownload: boolean) => Promise<void>;
  onAddVideo: (file: File) => void;
  onAddDocument: (file: File) => void;
  onAddLink: (title: string, url: string) => Promise<void>;
  onDeleteLink: (linkId: string) => Promise<void>;
}

export function EditModeMedia({
  formData,
  setFormData,
  editingLessonMedia,
  availableStreamRecordings,
  onDeleteVideo,
  onDeleteDocument,
  onToggleDocumentDownload,
  onAddVideo,
  onAddDocument,
  onAddLink,
  onDeleteLink,
}: EditModeMediaProps) {
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [addingLink, setAddingLink] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [deletingLinkId, setDeletingLinkId] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      {/* Current Videos */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Videos actuales ({editingLessonMedia.videos.length})
        </label>
        {editingLessonMedia.videos.length > 0 ? (
          <div className="space-y-2">
            {editingLessonMedia.videos.map((v, i) => (
              <div key={v.id} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
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
              <div key={d.id} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{d.title || d.fileName}</p>
                  <p className="text-xs text-gray-500 truncate">{d.fileName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleDocumentDownload(d.id, !d.allowDownload)}
                  className={`p-1.5 rounded-lg transition-all border ${d.allowDownload ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' : 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200'}`}
                  title={d.allowDownload ? 'Descarga permitida — click para bloquear' : 'Descarga bloqueada — click para permitir'}
                >
                  {d.allowDownload ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                </button>
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

      {/* Links actuales */}
      {editingLessonMedia.links.length > 0 && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Links actuales ({editingLessonMedia.links.length})
          </label>
          <div className="space-y-2">
            {editingLessonMedia.links.map((link) => (
              <div key={link.id} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{link.title}</p>
                  <p className="text-xs text-gray-500 truncate">{link.url}</p>
                </div>
                <button
                  type="button"
                  disabled={deletingLinkId === link.id}
                  onClick={async () => {
                    setDeletingLinkId(link.id);
                    try { await onDeleteLink(link.id); } finally { setDeletingLinkId(null); }
                  }}
                  className="text-xs text-red-600 bg-red-100 hover:bg-red-200 px-2 py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingLinkId === link.id ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
              className="w-full h-[38px] px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 file:mr-4 file:py-0.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            />
            {formData.videos.length > 0 && (
              <div className="mt-2 space-y-2">
                {formData.videos.map((v, i) => (
                  <div key={`video-${i}-${v.file.name}`} className="relative p-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
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
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Nuevos documentos</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              multiple
              onChange={e => { if (e.target.files) Array.from(e.target.files).forEach(onAddDocument); e.target.value = ''; }}
              className="w-full h-[38px] px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 file:mr-4 file:py-0.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            />
            {formData.documents.length > 0 && (
              <div className="mt-2 space-y-2">
                {formData.documents.map((d, i) => (
                  <div key={`doc-${i}-${d.file.name}`} className="relative p-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                    <span className="text-xs text-gray-700 truncate flex-1">{d.file.name}</span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, documents: prev.documents.map((doc, j) => j === i ? { ...doc, allowDownload: !doc.allowDownload } : doc) }))}
                      className={`p-1 rounded transition-all border ${d.allowDownload ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-100'}`}
                      title={d.allowDownload ? 'Descarga permitida — click para bloquear' : 'Descarga bloqueada — click para permitir'}
                    >
                      {d.allowDownload ? (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      )}
                    </button>
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
          <StreamRecordingSelector
            formData={formData}
            setFormData={setFormData}
            availableStreamRecordings={availableStreamRecordings}
            compact
          />
        </div>

        {/* Add Link */}
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-1.5">
            <label className="block text-xs font-medium text-gray-600">Nuevo link</label>
            {!showAddLink && (
              <button
                type="button"
                onClick={() => setShowAddLink(true)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Añadir enlace
              </button>
            )}
          </div>
          {showAddLink && (
            <div className="space-y-2">
              <input
                type="text"
                value={newLinkTitle}
                onChange={e => setNewLinkTitle(e.target.value)}
                placeholder="Título del enlace"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
              />
              <input
                type="url"
                value={newLinkUrl}
                onChange={e => setNewLinkUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={addingLink || !newLinkTitle.trim() || !newLinkUrl.trim()}
                  onClick={async () => {
                    setAddingLink(true);
                    try {
                      await onAddLink(newLinkTitle.trim(), newLinkUrl.trim());
                      setNewLinkTitle('');
                      setNewLinkUrl('');
                      setShowAddLink(false);
                    } finally {
                      setAddingLink(false);
                    }
                  }}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingLink ? 'Guardando...' : 'Guardar enlace'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddLink(false); setNewLinkTitle(''); setNewLinkUrl(''); }}
                  className="px-3 py-1.5 text-gray-600 hover:text-gray-900 text-xs font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
