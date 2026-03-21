'use client';

import ProtectedVideoPlayer from '@/components/ProtectedVideoPlayer';
import { openDocument } from '@/lib/api-client';
import type { Video, Lesson } from './types';

interface LessonContentViewProps {
  selectedLesson: Lesson;
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
  selectedLesson, selectedVideo, user,
  academyFeedbackEnabled, lessonRating, ratingHover,
  tempRating, showRatingSuccess, feedbackText,
  goBackToLessons, selectVideoInLesson, handleStarClick,
  setRatingHover, setFeedbackText, submitRating,
}: LessonContentViewProps) {
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
        </div>
      </div>
    </div>
  );
}
