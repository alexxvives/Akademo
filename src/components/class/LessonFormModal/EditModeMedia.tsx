'use client';

import type { LessonFormData, EditingLessonMedia } from '../types';
import { StreamRecordingSelector } from './StreamRecordingSelector';

interface EditModeMediaProps {
  formData: LessonFormData;
  setFormData: React.Dispatch<React.SetStateAction<LessonFormData>>;
  editingLessonMedia: EditingLessonMedia;
  availableStreamRecordings: Array<{ id: string; title: string; createdAt: string }>;
  onDeleteVideo: (id: string) => void;
  onDeleteDocument: (id: string) => void;
  onAddVideo: (file: File) => void;
  onAddDocument: (file: File) => void;
}

export function EditModeMedia({
  formData,
  setFormData,
  editingLessonMedia,
  availableStreamRecordings,
  onDeleteVideo,
  onDeleteDocument,
  onAddVideo,
  onAddDocument,
}: EditModeMediaProps) {
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
          <StreamRecordingSelector
            formData={formData}
            setFormData={setFormData}
            availableStreamRecordings={availableStreamRecordings}
          />
        </div>
      </div>
    </div>
  );
}
