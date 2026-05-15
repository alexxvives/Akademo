'use client';

import { useState, useEffect } from 'react';
import { openDocument, apiClient } from '@/lib/api-client';
import ProtectedVideoPlayer from '@/components/ProtectedVideoPlayer';
import type { LessonDetail, LessonVideo, LessonFeedback } from './types';

interface Assignment {
  id: string; title: string; description?: string; type: string;
  dueDate?: string; submissionCount: number; gradedCount: number;
}

interface LessonDetailViewProps {
  lesson: LessonDetail;
  classId: string;
  selectedVideo: LessonVideo | null;
  currentUserId: string;
  feedbackEnabled: boolean;
  lessonFeedback: LessonFeedback[];
  onGoBack: () => void;
  onSelectVideo: (video: LessonVideo) => void;
}

export default function LessonDetailView({
  lesson,
  classId,
  selectedVideo,
  currentUserId,
  feedbackEnabled,
  lessonFeedback,
  onGoBack,
  onSelectVideo,
}: LessonDetailViewProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  useEffect(() => {
    setAssignments([]);
    apiClient(`/assignments?classId=${classId}&lessonId=${lesson.id}`)
      .then(r => r.json())
      .then(data => { if (data.success) setAssignments(data.data || []); })
      .catch(() => {});
  }, [classId, lesson.id]);

  return (
    <div className="space-y-6">
      <div>
        <button onClick={onGoBack} className="text-sm text-gray-500 hover:text-gray-900 mb-2">
          ← Volver a Clases
        </button>
        <h2 className="text-xl font-semibold text-gray-900">{lesson.title}</h2>
        {lesson.description ? (
          <p className="text-gray-600 mt-1">{lesson.description}</p>
        ) : (
          <p className="text-gray-400 italic mt-1">Sin descripción</p>
        )}
      </div>

      {/* Video Player and Documents Side by Side */}
      <div className="flex flex-col lg:flex-row gap-6 items-start mt-6">
        {/* Video Player - Left Side */}
        <div className="flex-1 min-w-0 max-w-3xl">
          <h3 className="font-semibold text-gray-900 mb-3 text-lg text-center">VIDEOS</h3>
          {selectedVideo && (
            <div className="relative bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-3 pointer-events-none">
                <span>Multiplicador: {lesson.maxWatchTimeMultiplier}x</span>
                <span className="w-px h-3 bg-white/40"></span>
                <span>Marca de agua: {lesson.watermarkIntervalMins === 0 ? 'siempre visible' : lesson.watermarkIntervalMins < 1 ? `cada ${lesson.watermarkIntervalMins * 60}s` : `cada ${lesson.watermarkIntervalMins} min`}</span>
              </div>
              <ProtectedVideoPlayer
                key={selectedVideo.id}
                videoUrl={(selectedVideo.upload?.storageType === 'bunny' || selectedVideo.bunnyGuid) ? '' : `/api/video/stream/${selectedVideo.id}`}
                videoId={selectedVideo.id}
                studentId={currentUserId}
                maxWatchTimeMultiplier={lesson.maxWatchTimeMultiplier}
                durationSeconds={selectedVideo.durationSeconds || 0}
                initialPlayState={{ totalWatchTimeSeconds: 0, sessionStartTime: null }}
                userRole="TEACHER"
                bunnyGuid={(selectedVideo.upload?.storageType === 'bunny' ? selectedVideo.upload?.bunnyGuid : selectedVideo.bunnyGuid) || undefined}
              />
            </div>
          )}

          {lesson.videos.length === 0 && (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 sm:p-8 text-center">
              <p className="text-gray-600">No videos in this lesson.</p>
            </div>
          )}

          {/* Video Switcher */}
          {lesson.videos.length > 1 && (
            <div className="flex gap-2 flex-wrap justify-center mt-4">
              {lesson.videos.map((video, index) => (
                <button
                  key={video.id}
                  onClick={() => onSelectVideo(video)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    selectedVideo?.id === video.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Video {index + 1}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Documents - Right Side */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 mb-3 text-lg text-center">DOCUMENTOS</h3>
          {lesson.documents.length > 0 ? (
            <div className="space-y-2">
              {lesson.documents
                .filter(doc => doc.upload?.storagePath)
                .map((doc) => {
                const isDemo = doc.upload!.storagePath.startsWith('/demo/');
                return (
                <a
                  key={doc.id}
                  href={isDemo ? doc.upload!.storagePath : '#'}
                  target={isDemo ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors group"
                  onClick={isDemo ? undefined : async (e) => { e.preventDefault(); try { await openDocument(doc.upload!.storagePath, !!doc.allowDownload); } catch { alert('Error al abrir'); } }}
                >
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-gray-900 group-hover:text-emerald-600 truncate">{doc.title}</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 italic text-sm text-center">No documentos</p>
          )}
          {lesson.links && lesson.links.length > 0 && (
            <div className="mt-3 space-y-2">
              {lesson.links.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors group"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-gray-900 group-hover:text-blue-600 truncate">{link.title}</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ejercicios Section */}
      {assignments.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3 text-lg text-center">EJERCICIOS</h3>
          <div className="rounded-xl border border-gray-200 p-4 space-y-2">
            {assignments.map(a => (
              <div key={a.id} className="flex items-center gap-3 p-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${a.type === 'quiz' ? 'bg-amber-100' : 'bg-orange-100'}`}>
                  {a.type === 'quiz' ? (
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  ) : (
                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-gray-900 truncate">{a.title}</p>
                  {a.dueDate && <p className="text-xs text-gray-500">Entrega: {new Date(a.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xs text-gray-500">{a.submissionCount} entregas{a.gradedCount > 0 ? ` · ${a.gradedCount} calificadas` : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feedback Section */}
      {feedbackEnabled && (
      <div className="pt-6">
        <h3 className="font-semibold text-gray-900 mb-3 text-lg text-center">VALORACIONES</h3>
        <div className="rounded-xl border border-gray-200 p-3 sm:p-6 animate-in slide-in-from-top-2 shadow-sm">
          <div>
          {lessonFeedback.filter(f => f.comment && f.comment.trim().length > 0).length > 0 ? (
            <div className="space-y-4">
              {lessonFeedback.filter(f => f.comment && f.comment.trim().length > 0).map(feedback => {
                const fullStars = Math.floor(feedback.rating);
                const remainder = feedback.rating - fullStars;
                const partialFill = remainder >= 0.875 ? 1 : remainder >= 0.625 ? 0.75 : remainder >= 0.375 ? 0.5 : remainder >= 0.125 ? 0.25 : 0;
                
                return (
                  <div key={feedback.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-all shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map(starIndex => {
                            let fillPercentage = 0;
                            if (starIndex <= fullStars) {
                              fillPercentage = 100;
                            } else if (starIndex === fullStars + 1) {
                              fillPercentage = partialFill * 100;
                            }
                            
                            return (
                              <div key={starIndex} className="relative w-5 h-5">
                                <svg className="absolute inset-0 w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                {fillPercentage > 0 && (
                                  <svg className="absolute inset-0 w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" style={{ clipPath: `inset(0 ${100 - fillPercentage}% 0 0)` }}>
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <span className="text-xs text-gray-500">{new Date(feedback.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                    {feedback.comment && (
                      <p className="text-sm text-gray-700 leading-relaxed">{feedback.comment}</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              <p className="text-sm font-medium">No hay comentarios para esta lección</p>
            </div>
          )}
        </div>
      </div>
      </div>
      )}
    </div>
  );
}
