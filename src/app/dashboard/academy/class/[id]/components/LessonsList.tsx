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
  onToggleRelease: (lesson: Lesson) => void;
}

export default function LessonsList({
  lessons,
  onSelectLesson,
  onEditLesson,
  onDeleteLesson,
  onToggleRelease,
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
        <div className="max-h-[600px] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-2">
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
                  !isReleased(lesson.releaseDate) ? 'opacity-70 grayscale sepia-[.2]' : ''
                } ${
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
                    {/* Date Badge - Always visible, handles hidden state internally */}
                    {(isReleased(lesson.releaseDate)) && (
                      <div className={`absolute top-2 left-2 z-10 flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg backdrop-blur-sm shadow-lg border border-gray-300/50 bg-white/90 text-gray-900`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">
                          {formatDate(lesson.releaseDate)}
                        </span>
                      </div>
                    )}

                    {/* Visibility Toggle - Top Right */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleRelease(lesson);
                      }}
                      className={`absolute top-2 right-2 z-10 p-1.5 rounded-lg backdrop-blur-sm shadow-lg transition-all border ${
                        isReleased(lesson.releaseDate)
                          ? 'bg-white/90 text-gray-900 border-gray-300' 
                          : 'bg-gray-800/90 text-gray-400 border-gray-700'
                      }`}
                      title={isReleased(lesson.releaseDate) ? "Visible: Click para ocultar" : "Oculto: Click para publicar"}
                    >
                      {isReleased(lesson.releaseDate) ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      )}
                    </button>

                    {(lesson.firstVideoBunnyGuid || lesson.firstVideoUpload?.bunnyGuid) ? (
                      <>
                        <img
                          src={getBunnyThumbnailUrl(lesson.firstVideoBunnyGuid || lesson.firstVideoUpload?.bunnyGuid || '')}
                          alt={lesson.title}
                          className={`w-full h-full object-cover ${lesson.isUploading || lesson.isTranscoding ? 'opacity-50' : ''}`}
                        />
                        {/* Transcoding/Uploading Overlay */}
                        {(lesson.isUploading || lesson.isTranscoding) && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
                            <div className="w-8 h-8 border-3 border-purple-400/30 border-t-purple-400 rounded-full animate-spin mb-2" />
                            <span className="text-sm font-medium text-white">
                              {lesson.isUploading ? 'Subiendo...' : 'Transcodificando...'}
                            </span>
                          </div>
                        )}
                        
                        {/* Play Button Overlay - Only show when not uploading/transcoding */}
                        {!lesson.isUploading && !lesson.isTranscoding && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                            <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                              <svg className="w-8 h-8 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center relative">
                        {/* Date Badge for document-only lessons */}
                        {(isReleased(lesson.releaseDate)) && (
                          <div className={`absolute top-2 left-2 z-10 flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg backdrop-blur-sm shadow-lg border border-gray-300/50 bg-white/90 text-gray-900`}>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium">
                              {formatDate(lesson.releaseDate)}
                            </span>
                          </div>
                        )}
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
                  <div className="p-4 space-y-3">
                    {/* Star Rating and Completion Stats */}
                    {!lesson.isUploading && !lesson.isTranscoding && (
                      <div className="space-y-2">
                        {/* Star Rating */}
                        {lesson.ratingCount !== undefined && lesson.ratingCount > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map(star => (
                                <svg key={star} className={`w-4 h-4 ${star <= Math.round(lesson.avgRating || 0) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                            <span className="text-sm font-semibold text-gray-700">{(lesson.avgRating || 0).toFixed(1)}</span>
                            <span className="text-xs text-gray-500">({lesson.ratingCount})</span>
                          </div>
                        )}
                        
                        {/* Completion Bar */}
                        {lesson.studentsWatching !== undefined && (
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className="text-gray-600 font-medium">Estudiantes que accedieron</span>
                              <span className="text-gray-900 font-bold">
                                {lesson.studentsWatching || 0}/{(lesson as any).totalStudentsInClass || 0}
                              </span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full transition-all"
                                style={{ 
                                  width: `${lesson.avgProgress || 0}%`,
                                  background: (lesson.avgProgress || 0) >= 75
                                    ? 'linear-gradient(to right, #15803d, #166534)'
                                    : (lesson.avgProgress || 0) >= 50
                                    ? 'linear-gradient(to right, #22c55e, #15803d)'
                                    : (lesson.avgProgress || 0) >= 25
                                    ? 'linear-gradient(to right, #eab308, #22c55e)'
                                    : (lesson.avgProgress || 0) >= 10
                                    ? 'linear-gradient(to right, #ef4444, #eab308)'
                                    : 'linear-gradient(to right, #dc2626, #ef4444)'
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
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
