'use client';

import type { Assignment } from './types';

interface UploadModalProps {
  assignment: Assignment;
  uploadFiles: File[];
  setUploadFiles: React.Dispatch<React.SetStateAction<File[]>>;
  uploading: boolean;
  dragActive: boolean;
  onDrag: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function UploadModal({
  assignment, uploadFiles, setUploadFiles,
  uploading, dragActive, onDrag, onDrop, onSubmit, onClose,
}: UploadModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-5 sm:p-6 max-h-[92dvh] overflow-y-auto">
        <h2 className="text-2xl font-semibold mb-2">
          {assignment.submittedAt ? 'Reenviar Ejercicio' : 'Entregar Ejercicio'}
        </h2>
        <p className="text-gray-600 mb-2">{assignment.title}</p>
        {assignment.submittedAt && (
          <p className="text-sm text-amber-600 mb-4">
            ⚠️ Esto reemplazará tu entrega anterior.
          </p>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div
            onDragEnter={onDrag}
            onDragLeave={onDrag}
            onDragOver={onDrag}
            onDrop={onDrop}
            className={`border-2 border-dashed rounded-lg p-6 sm:p-12 text-center ${
              dragActive ? 'border-brand-500 bg-brand-50' : 'border-gray-300'
            }`}
          >
            <input
              type="file"
              id="fileInput"
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  const newFiles = Array.from(e.target.files);
                  setUploadFiles(prev => [...prev, ...newFiles]);
                }
              }}
              className="hidden"
            />
            {uploadFiles.length > 0 ? (
              <div className="space-y-3">
                {uploadFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadFiles(prev => prev.filter((_, i) => i !== index))}
                      className="text-red-600 hover:text-red-800"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <label
                  htmlFor="fileInput"
                  className="inline-block w-full text-center px-4 py-2 border-2 border-dashed border-brand-300 text-brand-600 rounded-lg hover:border-brand-500 hover:bg-brand-50 cursor-pointer transition-colors"
                >
                  + Agregar más archivos
                </label>
              </div>
            ) : (
              <div>
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Arrastra tus archivos aquí
                </p>
                <p className="text-sm text-gray-500 mb-4">o</p>
                <label
                  htmlFor="fileInput"
                  className="inline-block px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 cursor-pointer"
                >
                  Seleccionar archivos
                </label>
              </div>
            )}
          </div>

          <div className="flex gap-4 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={uploadFiles.length === 0 || uploading}
              className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Entregando...' : `Entregar ${uploadFiles.length > 0 ? `(${uploadFiles.length} archivo${uploadFiles.length > 1 ? 's' : ''})` : 'Ejercicio'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
