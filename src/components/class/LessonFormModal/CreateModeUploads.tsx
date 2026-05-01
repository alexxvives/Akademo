'use client';

import { useState } from 'react';
import type { LessonFormData } from '../types';
import { StreamRecordingSelector } from './StreamRecordingSelector';

interface CreateModeUploadsProps {
  formData: LessonFormData;
  setFormData: React.Dispatch<React.SetStateAction<LessonFormData>>;
  availableStreamRecordings: Array<{ id: string; title: string; createdAt: string }>;
  onAddVideo: (file: File) => void;
  onAddDocument: (file: File) => void;
}

export function CreateModeUploads({
  formData,
  setFormData,
  availableStreamRecordings,
  onAddVideo,
  onAddDocument,
}: CreateModeUploadsProps) {
  const [showAddLink, setShowAddLink] = useState(false);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  return (
    <>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Video/s</label>
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
                <div key={`video-${i}-${v.file.name}`} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
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

        <StreamRecordingSelector
          formData={formData}
          setFormData={setFormData}
          availableStreamRecordings={availableStreamRecordings}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Documentos</label>
        <input type="file" accept=".pdf,.doc,.docx" multiple onChange={e => { if (e.target.files) Array.from(e.target.files).forEach(onAddDocument); e.target.value = ''; }} className="w-full h-[38px] px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 file:mr-4 file:py-0.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"/>
        {formData.documents.length > 0 && (
          <div className="mt-2 space-y-2">
            {formData.documents.map((d, i) => (
              <div key={`doc-${i}-${d.file.name}`} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
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

      {/* Links Section */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Links{formData.links.length > 0 ? ` (${formData.links.length})` : ''}
          </label>
          <button
            type="button"
            onClick={() => setShowAddLink(true)}
            disabled={showAddLink}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Añadir enlace
          </button>
        </div>

        {formData.links.length > 0 && (
          <div className="space-y-2 mb-2">
            {formData.links.map((link, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
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
                  onClick={() => setFormData(prev => ({ ...prev, links: prev.links.filter((_, j) => j !== i) }))}
                  className="text-xs text-red-600 bg-red-100 hover:bg-red-200 px-2 py-1 rounded transition-colors"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}

        {showAddLink && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
            <input
              type="text"
              value={newLinkTitle}
              onChange={e => setNewLinkTitle(e.target.value)}
              placeholder="Título del enlace"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
            />
            <input
              type="url"
              value={newLinkUrl}
              onChange={e => setNewLinkUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!newLinkTitle.trim() || !newLinkUrl.trim()}
                onClick={() => {
                  setFormData(prev => ({ ...prev, links: [...prev.links, { title: newLinkTitle.trim(), url: newLinkUrl.trim() }] }));
                  setNewLinkTitle(''); setNewLinkUrl(''); setShowAddLink(false);
                }}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Guardar enlace
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
    </>
  );
}
