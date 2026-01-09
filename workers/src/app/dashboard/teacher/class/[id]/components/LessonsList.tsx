import { getBunnyThumbnailUrl } from '@/lib/bunny-stream';

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  releaseDate: string;
  maxWatchTimeMultiplier: number;
  watermarkIntervalMins: number;
  videoCount: number;
  documentCount: number;
  studentsWatching?: number;
  avgProgress?: number;
  avgRating?: number;
  ratingCount?: number;
  firstVideoBunnyGuid?: string;
  firstVideoUpload?: { bunnyGuid?: string };
  isTranscoding?: number;
  isUploading?: boolean;
  uploadProgress?: number;
}

interface LessonsListProps {
  lessons: Lesson[];
  onSelectLesson: (lesson: Lesson) => void;
  onEditLesson: (lesson: Lesson) => void;
  onDeleteLesson: (lessonId: string) => void;
}

export default function LessonsList({
  lessons,
  onSelectLesson,
  onEditLesson,
  onDeleteLesson,
}: LessonsListProps) {
  const formatDate = (d: string) => {
    const date = new Date(d);
    const formatted = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
    // Split by 'de' to find the month part and capitalize it
    const parts = formatted.split(' de ');
    if (parts.length === 2) {
      const month = parts[1];
      return `${parts[0]} de ${month.charAt(0).toUpperCase()}${month.slice(1)}`;
    }
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };
  
  const isReleased = (d: string) => new Date(d) <= new Date();

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Lecciones</h2>
      {lessons.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">Aún no hay lecciones</h3>
          <p className="text-gray-500 text-sm">Crea tu primera lección para comenzar</p>
        </div>
      ) : (
        <div className="max-h-[600px] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lessons.map((lesson) => {
            const videoCount = lesson.videoCount || 0;
            const docCount = lesson.documentCount || 0;
            
            return (
              <div
                key={lesson.id}
                onClick={(e) => {
                  // Check if click is on action buttons container
                  const target = e.target as HTMLElement;
                  if (target.closest('[data-action-buttons]')) {
                    return; // Don't navigate if clicking action buttons area
                  }
                  if (!lesson.isUploading) {
                    onSelectLesson(lesson);
                  }
                }}
                className={`bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden transition-all duration-300 group border border-gray-200 shadow-sm ${
                  lesson.isUploading
                    ? 'cursor-default'
                    : 'hover:border-brand-400 hover:shadow-xl hover:shadow-brand-500/10 cursor-pointer hover:scale-[1.02]'
                }`}
              >
                <div className="flex flex-col h-full">
                  {/* Header with Title and Action Buttons */}
                  <div className="px-4 pt-4 pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-bold text-gray-900 line-clamp-2 flex-1">
                        {lesson.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Action Buttons */}
                        <div className="flex gap-1.5" data-action-buttons>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!lesson.isUploading) {
                                onEditLesson(lesson);
                              }
                            }}
                            disabled={lesson.isUploading}
                            className="p-2 bg-brand-50 text-brand-600 rounded-lg hover:bg-brand-100 hover:scale-105 transition-all border border-brand-200 disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Editar lección"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!lesson.isUploading) {
                                onDeleteLesson(lesson.id);
                              }
                            }}
                            disabled={lesson.isUploading}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 hover:scale-105 transition-all border border-red-200 disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Eliminar lección"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Thumbnail with play button overlay and content badges */}
                  <div className="relative" style={{ height: '160px' }}>
                    {lesson.isUploading || lesson.isTranscoding ? (
                      <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400 mb-2 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span className="text-xs text-gray-400">
                          {lesson.isUploading ? 'Subiendo...' : 'Procesando...'}
                        </span>
                      </div>
                    ) : (lesson.firstVideoBunnyGuid || lesson.firstVideoUpload?.bunnyGuid) ? (
                      <>
                        <img
                          src={getBunnyThumbnailUrl(lesson.firstVideoBunnyGuid || lesson.firstVideoUpload?.bunnyGuid || '')}
                          alt={lesson.title}
                          className="w-full h-full object-cover"
                        />
                        {/* Date Badge - Top Right - Always show */}
                        <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 text-xs bg-gray-100/90 text-gray-600 px-2.5 py-1.5 rounded-lg backdrop-blur-sm border border-gray-300/50 shadow-lg">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="font-medium">
                            {lesson.releaseDate ? formatDate(lesson.releaseDate) : 'Sin fecha'}
                          </span>
                        </div>
                        {/* Play Button Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                          <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                            <svg className="w-8 h-8 text-brand-600 ml-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                            </svg>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                        <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                        </svg>
                      </div>
                    )}

                    {/* Content Badge Overlay on Thumbnail - Bottom */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                      <div className="flex items-center gap-2">
                        {videoCount > 0 && (
                          <div className="flex items-center gap-1.5 bg-blue-500/90 px-2.5 py-1 rounded-lg border border-blue-400/50">
                            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                            </svg>
                            <span className="text-white font-bold text-xs">{videoCount}</span>
                          </div>
                        )}
                        {docCount > 0 && (
                          <div className="flex items-center gap-1.5 bg-purple-500/90 px-2.5 py-1 rounded-lg border border-purple-400/50">
                            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                            </svg>
                            <span className="text-white font-bold text-xs">{docCount}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4">
                    {/* Student Engagement Progress with Stars and Percentage */}
                    {!lesson.isUploading && !lesson.isTranscoding && lesson.studentsWatching !== undefined && (
                      <>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-500 text-base">
                              {'★'.repeat(Math.round((lesson.avgRating || 0)))}
                            </span>
                            <span className="text-gray-300 text-base">
                              {'★'.repeat(5 - Math.round((lesson.avgRating || 0)))}
                            </span>
                            {lesson.ratingCount !== undefined && lesson.ratingCount > 0 && (
                              <span className="text-xs text-gray-500 ml-1">({lesson.ratingCount})</span>
                            )}
                          </div>
                          <span 
                            className="text-gray-900 font-bold text-sm cursor-help" 
                            title="Porcentaje de estudiantes que han accedido a la lección"
                          >
                            {Math.round(lesson.avgProgress || 0)}% ({lesson.studentsWatching || 0}/{(lesson as any).totalStudentsInClass || 0})
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full transition-all"
                            style={{ 
                              width: `${lesson.avgProgress || 0}%`,
                              background: (lesson.avgProgress || 0) >= 75
                                ? 'linear-gradient(to right, #15803d, #166534)' // dark green
                                : (lesson.avgProgress || 0) >= 50
                                ? 'linear-gradient(to right, #22c55e, #15803d)' // green to dark green
                                : (lesson.avgProgress || 0) >= 25
                                ? 'linear-gradient(to right, #eab308, #22c55e)' // yellow to green
                                : (lesson.avgProgress || 0) >= 10
                                ? 'linear-gradient(to right, #ef4444, #eab308)' // red to yellow
                                : 'linear-gradient(to right, #dc2626, #ef4444)' // dark red to red
                            }}
                          />
                        </div>
                      </>
                    )}

                    {/* Uploading Progress */}
                    {lesson.isUploading && (
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <div className="flex items-center justify-between text-sm text-blue-700 mb-2">
                          <span className="font-medium flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                            Subiendo archivos...
                          </span>
                          <span className="font-bold">{Math.round(lesson.uploadProgress || 0)}%</span>
                        </div>
                        <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-600 transition-all"
                            style={{ width: `${lesson.uploadProgress || 0}%` }}
                          />
                        </div>
                      </div>
                    )}
                  
                    {/* Transcoding Status */}
                    {lesson.isTranscoding === 1 && !lesson.isUploading && (
                      <div className="bg-purple-50 rounded-lg p-3 border border-purple-200 text-center">
                        <span className="text-sm font-medium text-purple-700 flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-purple-600/30 border-t-purple-600 rounded-full animate-spin" />
                          Transcodificando video...
                        </span>
                        <p className="text-xs text-purple-600 mt-1">Esto puede tomar varios minutos</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}
    </div>
  );
}
