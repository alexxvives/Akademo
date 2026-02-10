'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { SkeletonClasses } from '@/components/ui/SkeletonLoader';

interface Class {
  id: string;
  name: string;
  slug?: string;
  description: string | null;
  studentCount: number;
  lessonCount: number;
  videoCount: number;
  documentCount: number;
  avgRating?: number | null;
  createdAt: string;
  zoomAccountName?: string | null;
}

interface RatingRecord {
  id: string;
  rating: number;
  comment: string;
  lessonTitle: string;
  topicName: string;
  createdAt: string;
}

interface RatingsLesson {
  className: string;
  averageRating: number | null;
}

export default function TeacherClasses() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [academyName, setAcademyName] = useState<string>('');  const [loading, setLoading] = useState(true);
  const [openFeedbackDropdown, setOpenFeedbackDropdown] = useState<string | null>(null);
  const [feedbackComments, setFeedbackComments] = useState<Array<{ id: string; rating: number; comment: string; lessonTitle: string; topicName: string; createdAt: string }>>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [ratingsData, setRatingsData] = useState<{ overall: { averageRating: number; totalRatings: number } | null; lessons: RatingsLesson[] } | null>(null);
  const [feedbackEnabled, setFeedbackEnabled] = useState<boolean>(true);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadFeedback = async (classId: string) => {
    setLoadingFeedback(true);
    try {
      const res = await apiClient(`/ratings?classId=${classId}`);
      const result = await res.json();
      if (result.success && result.data) {
        // Extract only comments, filter and sort by rating (5 stars first)
        const comments = (result.data.recent || [])
          .filter((r: RatingRecord) => r.comment && r.comment.trim())
          .sort((a: RatingRecord, b: RatingRecord) => b.rating - a.rating || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .map((r: RatingRecord) => ({
            id: r.id,
            rating: r.rating,
            comment: r.comment,
            lessonTitle: r.lessonTitle,
            topicName: r.topicName,
            createdAt: r.createdAt
          }));
        setFeedbackComments(comments);
      }
    } catch (error) {
      console.error('Error loading feedback:', error);
    } finally {
      setLoadingFeedback(false);
    }
  };

  const _handleToggleFeedback = async (classId: string) => {
    if (openFeedbackDropdown === classId) {
      setOpenFeedbackDropdown(null);
    } else {
      setOpenFeedbackDropdown(classId);
      await loadFeedback(classId);
    }
  };

  const loadClasses = async () => {
    try {
      const [classesRes, membershipRes, ratingsRes] = await Promise.all([
        apiClient('/classes'),
        apiClient('/requests/teacher'),
        apiClient('/ratings')
      ]);
      
      const classesResult = await classesRes.json();
      if (classesResult.success) {
        setClasses(classesResult.data || []);
      }
      
      // Get academy name from membership
      const membershipResult = await membershipRes.json();
      if (Array.isArray(membershipResult) && membershipResult.length > 0) {
        setAcademyName(membershipResult[0].academyName);
        // Load feedbackEnabled from academy
        try {
          const academyRes = await apiClient('/academies');
          const academyResult = await academyRes.json();
          if (academyResult.success && Array.isArray(academyResult.data) && academyResult.data.length > 0) {
            setFeedbackEnabled(academyResult.data[0].feedbackEnabled !== 0);
          }
        } catch (e) {
          console.error('Failed to load academy settings:', e);
        }
      }

      // Get ratings summary
      const ratingsResult = await ratingsRes.json();
      if (ratingsResult.success) {
        setRatingsData(ratingsResult.data);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <SkeletonClasses />;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Mis Asignaturas</h1>
            {academyName && <p className="text-sm text-gray-500 mt-1">{academyName}</p>}
          </div>
        </div>

        {classes.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tienes clases</h3>
            <p className="text-gray-500">Las clases son asignadas por tu academia. Contacta con el administrador de tu academia para que te asigne clases.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {classes.map((cls) => {
              const classRatings = ratingsData?.lessons.filter(l => l.className === cls.name) || [];
              const avgClassRating = classRatings.length > 0 
                ? (classRatings.reduce((acc, l) => acc + (l.averageRating || 0), 0) / classRatings.length).toFixed(1) 
                : null;

              return (
              <div key={cls.id} className="relative">
                <Link
                  href={`/dashboard/teacher/class/${cls.slug || cls.id}`}
                  className="block bg-white rounded-xl border-2 border-gray-200 hover:border-brand-400 hover:shadow-xl transition-all p-6 group"
                >
                  {/* Main card layout: content on left, badge on right */}
                  <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                    {/* Left side: all content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-brand-600 transition-colors">{cls.name}</h3>
                          {feedbackEnabled && avgClassRating && (
                            <div className="flex items-center gap-1.5 px-2 py-1">
                              <svg className="w-5 h-5 text-amber-500 fill-current" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="text-sm font-bold text-gray-900">{avgClassRating}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {cls.description ? (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{cls.description}</p>
                      ) : (
                        <p className="text-sm text-gray-400 italic mb-4">Sin descripción</p>
                      )}
                      {/* Stats row - no longer side by side with badge */}
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          <span className="font-semibold text-gray-700">{cls.studentCount}</span> Estudiante{cls.studentCount !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          <span className="font-semibold text-gray-700">{cls.lessonCount}</span> Lección{cls.lessonCount !== 1 ? 'es' : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span className="font-semibold text-gray-700">{cls.videoCount}</span> Video{cls.videoCount !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="font-semibold text-gray-700">{cls.documentCount}</span> Documento{cls.documentCount !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Creada el {new Date(cls.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    {/* Right side: Zoom badge, vertically centered */}
                    <div className="flex-shrink-0">
                      {cls.zoomAccountName ? (
                        <span className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border-2 border-green-200 rounded-lg shadow-sm">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm font-semibold text-green-700">{cls.zoomAccountName}</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border-2 border-gray-200 rounded-lg shadow-sm">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span className="text-sm font-semibold text-gray-500">Sin Zoom</span>
                        </span>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Feedback Dropdown */}
                {feedbackEnabled && openFeedbackDropdown === cls.id && (
                <div className="mt-4 bg-white/95 backdrop-blur-md border-2 border-brand-200 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2">
                  <div className="bg-gradient-to-r from-brand-50/80 to-purple-50/80 px-4 py-3 border-b border-brand-200">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      Comentarios de Estudiantes
                    </h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto p-4">
                    {loadingFeedback ? (
                      <div className="flex items-center justify-center py-8">
                        <p className="text-sm text-gray-500">Cargando...</p>
                      </div>
                    ) : feedbackComments.length > 0 ? (
                      <div className="space-y-3">
                        {feedbackComments.map(comment => {
                          // Calculate partial star fill (0.25 increments)
                          const fullStars = Math.floor(comment.rating);
                          const remainder = comment.rating - fullStars;
                          const partialFill = remainder >= 0.875 ? 1 : remainder >= 0.625 ? 0.75 : remainder >= 0.375 ? 0.5 : remainder >= 0.125 ? 0.25 : 0;
                          
                          return (
                          <div key={comment.id} className="bg-emerald-50/50 backdrop-blur-sm border border-emerald-100 rounded-lg p-3 hover:border-emerald-300 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-1.5">
                                <div className="flex items-center gap-0.5">
                                  {[1, 2, 3, 4, 5].map(starIndex => {
                                    let fillPercentage = 0;
                                    if (starIndex <= fullStars) {
                                      fillPercentage = 100;
                                    } else if (starIndex === fullStars + 1) {
                                      fillPercentage = partialFill * 100;
                                    }
                                    
                                    return (
                                      <div key={starIndex} className="relative w-3.5 h-3.5">
                                        {/* Background star (gray) */}
                                        <svg className="absolute inset-0 w-3.5 h-3.5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                        {/* Filled star (yellow) with clip-path */}
                                        {fillPercentage > 0 && (
                                          <svg className="absolute inset-0 w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" style={{ clipPath: `inset(0 ${100 - fillPercentage}% 0 0)` }}>
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                          </svg>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                                <span className="text-xs font-semibold text-gray-700">• {comment.lessonTitle} {comment.topicName && <span className="text-gray-500 font-normal">({comment.topicName})</span>}</span>
                              </div>
                              <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">{comment.comment}</p>
                          </div>
                        );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p className="text-sm font-medium">No hay comentarios aún</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
          </div>
        )}
      </div>
    </>
  );
}
