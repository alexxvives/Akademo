'use client';

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
  onClose: () => void;
}

export function StudentTimeModal({
  show, lesson, isLoading, searchQuery, onSearchChange, studentData, isDisabled, onUpdateTime, onClose,
}: StudentTimeModalProps) {
  if (!show || !lesson) return null;

  const filteredData = searchQuery
    ? studentData.filter(s => s.studentName.toLowerCase().includes(searchQuery.toLowerCase()))
    : studentData;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
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
                                  Máximo: {Math.floor(video.maxWatchTimeSeconds / 60)}:{String(Math.floor(video.maxWatchTimeSeconds % 60)).padStart(2, '0')}
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
                            </div>
                          </div>
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
