'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { PageLoader, LoadingSpinner, EmptyState } from '@/components/ui';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Rating {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  studentName: string;
}

interface Lesson {
  id: string;
  title: string;
  totalRatings: number;
  averageRating: number;
  ratings: Rating[];
}

interface Topic {
  id: string;
  name: string;
  totalRatings: number;
  averageRating: number;
  lessons: Lesson[];
}

interface ClassFeedback {
  id: string;
  name: string;
  academyName?: string;
  totalRatings: number;
  averageRating: number;
  topics: Topic[];
}

export default function TeacherFeedbackPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassFeedback[]>([]);
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    try {
      const response = await apiClient('/ratings/teacher');
      const result = await response.json();
      if (result.success) {
        setClasses(result.data);
        // Expand all classes by default
        const allClassIds = new Set<string>(result.data.map((c: ClassFeedback) => c.id));
        setExpandedClasses(allClassIds);
      }
    } catch (error) {
      console.error('Failed to load feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleClass = (classId: string) => {
    setExpandedClasses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(classId)) {
        newSet.delete(classId);
      } else {
        newSet.add(classId);
      }
      return newSet;
    });
  };

  const toggleTopic = (topicId: string) => {
    setExpandedTopics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(topicId)) {
        newSet.delete(topicId);
      } else {
        newSet.add(topicId);
      }
      return newSet;
    });
  };

  const toggleLesson = (lessonId: string) => {
    setExpandedLessons(prev => {
      const newSet = new Set(prev);
      if (newSet.has(lessonId)) {
        newSet.delete(lessonId);
      } else {
        newSet.add(lessonId);
      }
      return newSet;
    });
  };

  const renderStars = (rating: number, size = "w-4 h-4") => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`${size} ${
              star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ))}
      </div>
    );
  };

  if (loading) return <PageLoader />;

  // Assuming all classes belong to the same academy
  const academyName = classes.length > 0 ? classes[0].academyName : 'Akademo';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Feedback</h1>
        <p className="text-sm text-gray-500 mt-1">{academyName}</p>
      </div>

      {classes.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          }
          title="Sin valoraciones aún"
          description="Tus estudiantes aún no han dejado valoraciones en tus clases."
        />
      ) : (
        <div className="space-y-4">
          {classes.map((cls) => {
            const isClassExpanded = expandedClasses.has(cls.id);
            return (
              <div 
                key={cls.id} 
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Class Header */}
                <button 
                  onClick={() => toggleClass(cls.id)}
                  className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  type="button"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-semibold text-lg">
                      {cls.name.charAt(0)}
                    </div>
                    <div className="text-left">
                      <h2 className="text-xl font-semibold text-gray-900">{cls.name}</h2>
                      <p className="text-sm text-gray-500 mt-1">{cls.totalRatings} valoraciones • {cls.averageRating}⭐</p>
                    </div>
                  </div>
                  <svg 
                    className={`w-6 h-6 text-gray-400 transform transition-transform duration-200 ${isClassExpanded ? 'rotate-180' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Topics */}
                {isClassExpanded && (
                  <div className="border-t border-gray-200">
                    {cls.topics.map((topic) => {
                      const isTopicExpanded = expandedTopics.has(topic.id);
                      return (
                        <div key={topic.id} className="border-b border-gray-100 last:border-b-0">
                          {/* Topic Header */}
                          <button
                            onClick={() => toggleTopic(topic.id)}
                            className="w-full px-8 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors bg-gray-50/30"
                            type="button"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 font-semibold text-sm">
                                T
                              </div>
                              <div className="text-left">
                                <h3 className="text-base font-semibold text-gray-900">{topic.name}</h3>
                                <p className="text-xs text-gray-500 mt-0.5">{topic.totalRatings} valoraciones • {topic.averageRating}⭐</p>
                              </div>
                            </div>
                            <svg 
                              className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${isTopicExpanded ? 'rotate-180' : ''}`} 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {/* Lessons */}
                          {isTopicExpanded && (
                            <div className="bg-white">
                              {topic.lessons.map((lesson) => {
                                const isLessonExpanded = expandedLessons.has(lesson.id);
                                return (
                                  <div key={lesson.id} className="border-t border-gray-100">
                                    {/* Lesson Header */}
                                    <button
                                      onClick={() => toggleLesson(lesson.id)}
                                      className="w-full px-12 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                      type="button"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="h-7 w-7 rounded bg-emerald-50 flex items-center justify-center text-emerald-600 font-semibold text-xs">
                                          L
                                        </div>
                                        <div className="text-left">
                                          <h4 className="text-sm font-semibold text-gray-900">{lesson.title}</h4>
                                          <p className="text-xs text-gray-500 mt-0.5">{lesson.totalRatings} valoraciones • {lesson.averageRating}⭐</p>
                                        </div>
                                      </div>
                                      <svg 
                                        className={`w-4 h-4 text-gray-400 transform transition-transform duration-200 ${isLessonExpanded ? 'rotate-180' : ''}`} 
                                        fill="none" 
                                        viewBox="0 0 24 24" 
                                        stroke="currentColor"
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </button>

                                    {/* Ratings */}
                                    {isLessonExpanded && (
                                      <div className="px-14 py-3 space-y-3 bg-gray-50/50">
                                        {lesson.ratings.map((rating) => (
                                          <div key={rating.id} className="bg-white p-4 rounded-lg border border-gray-200">
                                            <div className="flex items-start justify-between gap-4 mb-2">
                                              <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1">
                                                  {renderStars(rating.rating, "w-3.5 h-3.5")}
                                                </div>
                                                <span className="text-sm font-medium text-gray-700">{rating.studentName}</span>
                                              </div>
                                              <span className="text-xs text-gray-400 whitespace-nowrap">
                                                {format(new Date(rating.createdAt), "d MMM yyyy", { locale: es })}
                                              </span>
                                            </div>
                                            
                                            {rating.comment && (
                                              <p className="text-gray-700 leading-relaxed text-sm mt-2">
                                                "{rating.comment}"
                                              </p>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
