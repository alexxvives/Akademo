'use client';

import { createPortal } from 'react-dom';
import { useRef, useState } from 'react';
import { ClassSearchDropdown } from '@/components/ui/ClassSearchDropdown';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://akademo-api.alexxvives.workers.dev';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  classes?: { id: string; name: string }[];
}

export function ArchiveUploadModal({ onClose, onSuccess, classes }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadingRef = useRef(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f && !title) setTitle(f.name.replace(/\.[^/.]+$/, ''));
  };

  const handleUpload = () => {
    if (!file || uploadingRef.current) return;
    uploadingRef.current = true;
    setUploading(true);
    setError('');
    setProgress(0);

    const xhr = new XMLHttpRequest();
    const params = new URLSearchParams({
      filename: file.name,
      title: title || file.name,
    });
    if (selectedClassId) params.set('classId', selectedClassId);
    xhr.open('PUT', `${API_URL}/bunny/archive/upload?${params}`);
    xhr.withCredentials = true;
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      uploadingRef.current = false;
      setUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        onSuccess();
        onClose();
      } else {
        try {
          const body = JSON.parse(xhr.responseText);
          setError(body.error || `Error ${xhr.status}`);
        } catch {
          setError(`Error ${xhr.status}`);
        }
      }
    };

    xhr.onerror = () => { uploadingRef.current = false; setUploading(false); setError('Error de red durante la subida'); };
    xhr.onabort = () => { uploadingRef.current = false; setUploading(false); setError('Subida cancelada'); };
    xhr.send(file);
  };

  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Subir video al archivo</h2>
          <button onClick={onClose} disabled={uploading} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-40">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* File picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Archivo de video</label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-brand-400 hover:bg-brand-50/40 transition-colors disabled:opacity-50"
            >
              {file ? (
                <span className="text-sm text-gray-700 font-medium">{file.name} ({(file.size / (1024 * 1024)).toFixed(1)} MB)</span>
              ) : (
                <span className="text-sm text-gray-500">Haz clic para seleccionar un video</span>
              )}
            </button>
            <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nombre descriptivo del video"
              disabled={uploading}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
            />
          </div>

          {/* Asignatura selector */}
          {classes && classes.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Asignatura (opcional)</label>
              <ClassSearchDropdown
                classes={classes}
                value={selectedClassId}
                onChange={setSelectedClassId}
                allLabel="Sin asignatura"
                placeholder="Filtrar por asignatura..."
                disabled={uploading}
              />
            </div>
          )}

          {/* Progress bar */}
          {uploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Subiendo...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-brand-600 rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* Error */}
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-3 px-6 pb-5">
          <button onClick={onClose} disabled={uploading} className="px-4 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">
            Cancelar
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {uploading && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            )}
            {uploading ? 'Subiendo...' : 'Subir video'}
          </button>
        </div>
      </div>
    </div>
  , document.body);
}
