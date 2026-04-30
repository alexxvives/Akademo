'use client';

import { useState, useEffect } from 'react';
import ProtectedVideoPlayer from '@/components/ProtectedVideoPlayer';
import { openDocument, apiClient } from '@/lib/api-client';
import type { Video, Lesson } from './types';

interface StudentAssignment {
  id: string; title: string; type: string; dueDate?: string;
  submissionId?: string; score?: number; submittedAt?: string; gradedAt?: string;
  quizAttemptId?: string; quizScore?: number;
}

interface LessonContentViewProps {
  selectedLesson: Lesson;
  classId: string;
  selectedVideo: Video | null;
  user: { id: string; firstName: string; lastName: string; email: string; role: string };
  academyFeedbackEnabled: boolean;
  lessonRating: number | null;
  ratingHover: number;
  tempRating: number | null;
  showRatingSuccess: boolean;
  feedbackText: string;
  goBackToLessons: () => void;
  selectVideoInLesson: (video: Video) => void;
  handleStarClick: (rating: number) => void;
  setRatingHover: (n: number) => void;
  setFeedbackText: (s: string) => void;
  submitRating: (n: number) => void;
}

export default function LessonContentView({
  selectedLesson, classId, selectedVideo, user,
  academyFeedbackEnabled, lessonRating, ratingHover,
  tempRating, showRatingSuccess, feedbackText,
  goBackToLessons, selectVideoInLesson, handleStarClick,
  setRatingHover, setFeedbackText, submitRating,
}: LessonContentViewProps) {
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);

  useEffect(() => {
    setAssignments([]);
    apiClient(`/assignments?classId=${classId}&lessonId=${selectedLesson.id}`)
      .then(r => r.json())
      .then(data => { if (data.success) setAssignments(data.data || []); })
      .catch(() => {});
  }, [classId, selectedLesson.id]);

  return (
    <div className="space-y-6">
      <div>
        <button onClick={goBackToLessons} className="text-sm text-gray-500 hover:text-gray-900 mb-2">
          ← Volver a Clases
        </button>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{selectedLesson.title}</h2>

        {academyFeedbackEnabled && (
          <div className="flex items-center gap-4 mb-2">
            <div className="flex gap-1 group/rating relative">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => setRatingHover(star)}
                  onMouseLeave={() => setRatingHover(0)}
                  className="text-xl transition-all focus:outline-none hover:scale-110"
                  disabled={showRatingSuccess}
                >
                  <span className={
                    (ratingHover ? star <= ratingHover : star <= (tempRating ?? lessonRating ?? 0))
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  }>
                    ★
                  </span>
                </button>
              ))}
            </div>

            {showRatingSuccess && (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-600 font-semibold text-sm">¡Gracias!</span>
              </div>
            )}

            {tempRating !== null && !showRatingSuccess && (
              <div className="flex-1 max-w-2xl">
                <div className="bg-white border-2 border-[#b2e787] rounded-xl p-3 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="Comparte tu opinión (opcional)..."
                        className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b2e787] focus:border-[#b2e787] transition-all text-sm text-gray-900 placeholder:text-gray-400"
                        autoFocus
                      />
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => submitRating(tempRating)}
                        className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        Omitir
                      </button>
                      <button
                        onClick={() => submitRating(tempRating)}
                        className="px-4 py-1.5 bg-[#b2e787] text-[#1a1c29] rounded-lg hover:bg-[#a1d676] text-sm font-medium shadow-sm hover:shadow transition-all"
                      >
                        Enviar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {selectedLesson.description && (
          <p className="text-gray-600 mt-1">{selectedLesson.description}</p>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 min-w-0 max-w-3xl">
          <h3 className="font-semibold text-gray-900 mb-3 text-lg text-center">VIDEOS</h3>
          {selectedLesson.videos.length > 0 && selectedVideo && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <ProtectedVideoPlayer
                key={selectedVideo.id}
                videoUrl={(selectedVideo.upload?.storageType === 'bunny' || selectedVideo.bunnyGuid) ? '' : `/api/video/stream/${selectedVideo.id}`}
                videoId={selectedVideo.id}
                studentId={user.id}
                studentName={`${user.firstName} ${user.lastName}`}
                studentEmail={user.email}
                maxWatchTimeMultiplier={selectedLesson.maxWatchTimeMultiplier}
                durationSeconds={selectedVideo.durationSeconds || 0}
                initialPlayState={selectedVideo.playStates?.[0] || { totalWatchTimeSeconds: 0, sessionStartTime: null }}
                userRole={user.role}
                watermarkIntervalMins={selectedLesson.watermarkIntervalMins}
                bunnyGuid={(selectedVideo.upload?.storageType === 'bunny' ? selectedVideo.upload?.bunnyGuid : selectedVideo.bunnyGuid) || undefined}
              />
            </div>
          )}

          {selectedLesson.videos.length === 0 && (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-gray-600">Aún no hay videos en esta lección.</p>
            </div>
          )}

          {selectedLesson.videos.length > 1 && (
            <div className="flex gap-2 flex-wrap justify-center mt-4">
              {selectedLesson.videos.map((video, index) => (
                <button
                  key={video.id}
                  onClick={() => selectVideoInLesson(video)}
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

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 mb-3 text-lg text-center">DOCUMENTOS</h3>
          {selectedLesson.documents.length > 0 ? (
            <div className="space-y-2">
              {selectedLesson.documents
                .filter(doc => doc.upload?.storagePath)
                .map((doc) => (
                <a
                  key={doc.id}
                  href="#"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors group"
                  onClick={async (e) => { e.preventDefault(); try { await openDocument(doc.upload.storagePath); } catch { alert('Error al abrir'); } }}
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
              ))}
            </div>
          ) : (
            <p className="text-gray-400 italic text-sm text-center">No documentos</p>
          )}
          {selectedLesson.links && selectedLesson.links.length > 0 && (
            <div className="mt-3 space-y-2">
              {selectedLesson.links.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors group"
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
            {assignments.map(a => {
              const isSubmitted = !!a.submissionId || !!a.quizAttemptId;
              const isGraded = !!a.gradedAt;
              const isPastDue = a.dueDate && new Date(a.dueDate) < new Date();
              return (
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
                  <div className="flex-shrink-0">
                    {isGraded ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        {a.score !== undefined ? `${a.score} pts` : 'Calificado'}
                      </span>
                    ) : isSubmitted ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Entregado</span>
                    ) : isPastDue ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Vencido</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Pendiente</span>
                    )}
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
