'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { SkeletonFeedback } from '@/components/ui/SkeletonLoader';

export interface Rating {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  studentName: string;
  isRead?: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  totalRatings: number;
  averageRating: number;
  ratings: Rating[];
}

export interface Topic {
  id: string;
  name: string;
  totalRatings: number;
  averageRating: number;
  lessons: Lesson[];
}

export interface ClassFeedback {
  id: string;
  name: string;
  academyId?: string;
  academyName?: string;
  teacherName?: string;
  totalRatings: number;
  averageRating: number;
  topics: Topic[];
}

interface FeedbackViewProps {
  classes: ClassFeedback[];
  loading: boolean;
  selectedClass?: string;
  onClassFilterChange?: (classId: string) => void;
  showClassFilter?: boolean;
  onRatingsViewed?: (ratingIds: string[]) => void;
}

export function FeedbackView({
  classes,
  loading,
  selectedClass = 'all',
  onClassFilterChange,
  showClassFilter = true,
  onRatingsViewed,
}: FeedbackViewProps) {
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  const toggleTopic = (topicId: string, topic: Topic) => {
    setExpandedTopics(prev => {
      const newSet = new Set(prev);
      const isExpanding = !newSet.has(topicId);
      
      if (newSet.has(topicId)) {
        newSet.delete(topicId);
      } else {
        newSet.add(topicId);
        
        // If expanding and we have a callback, collect all rating IDs from this topic's lessons
        if (isExpanding && onRatingsViewed) {
          const ratingIds: string[] = [];
          topic.lessons.forEach(lesson => {
            lesson.ratings.forEach(rating => {
              ratingIds.push(rating.id);
            });
          });
          if (ratingIds.length > 0) {
            onRatingsViewed(ratingIds);
          }
        }
      }
      return newSet;
    });
  };

  // Helper to check if topic has unread ratings
  const hasUnreadRatings = (topic: Topic) => {
    return topic.lessons.some(lesson => 
      lesson.ratings.some(rating => rating.isRead === false)
    );
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  const filteredClasses = selectedClass === 'all' 
    ? classes 
    : classes.filter(c => c.id === selectedClass);

  if (loading) {
    return <SkeletonFeedback />;
  }

  if (classes.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Sin retroalimentación</h3>
        <p className="text-gray-500">La retroalimentación de los estudiantes aparecerá aquí</p>
      </div>
    );
  }

  const totalRatings = classes.reduce((sum, c) => sum + c.totalRatings, 0);
  const avgRating = totalRatings > 0
    ? classes.reduce((sum, c) => sum + (c.averageRating * c.totalRatings), 0) / totalRatings
    : 0;

  return (
    <div className="space-y-6">
      {/* Class Filter (only if enabled) */}
      {showClassFilter && classes.length > 1 && onClassFilterChange && (
        <div className="flex justify-end">
          <div className="relative w-full sm:w-48">
            <select
              value={selectedClass}
              onChange={(e) => onClassFilterChange(e.target.value)}
              className="appearance-none w-full pl-3 pr-10 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="all">Todas las clases</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Classes */}
      <div className="space-y-4">
        {filteredClasses.map((classItem) => {
          const classHasUnread = classItem.topics.some(hasUnreadRatings);
          return (
          <div key={classItem.id} className={`bg-white rounded-xl border overflow-hidden ${classHasUnread ? 'border-green-400 ring-2 ring-green-100' : 'border-gray-200'}`}>
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <h3 className="text-xl font-bold text-gray-900">{classItem.name}</h3>
                    {classItem.teacherName && (
                      <span className="text-sm text-gray-500">• {classItem.teacherName}</span>
                    )}
                  </div>
                  {classItem.academyName && (
                    <p className="text-sm text-gray-500 mt-1">{classItem.academyName}</p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="sm:text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-gray-900">{classItem.averageRating.toFixed(1)}</span>
                      {renderStars(Math.round(classItem.averageRating))}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{classItem.totalRatings} calificaciones</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Topics */}
            <div className="divide-y divide-gray-200">
              {classItem.topics.map((topic) => {
                const topicHasUnread = hasUnreadRatings(topic);
                return (
                <div key={topic.id}>
                  <button
                    onClick={() => toggleTopic(topic.id, topic)}
                    className={`w-full px-6 py-4 flex items-center justify-between transition-colors ${topicHasUnread ? 'bg-green-50 hover:bg-green-100' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${expandedTopics.has(topic.id) ? 'rotate-90' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="font-semibold text-gray-900">{topic.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-gray-900">{topic.averageRating.toFixed(1)}</span>
                        {renderStars(Math.round(topic.averageRating))}
                      </div>
                      <span className="text-sm text-gray-500">{topic.totalRatings} calificaciones</span>
                    </div>
                  </button>

                  {expandedTopics.has(topic.id) && (
                    <div className="bg-gray-50 px-6 py-4">
                      {topic.lessons.flatMap(lesson => lesson.ratings).length === 0 ? (
                        <p className="text-sm text-gray-500 italic text-center py-4">Sin comentarios en este tema</p>
                      ) : (
                        <div className="space-y-2 max-h-[51vh] overflow-y-auto pr-2">
                          {topic.lessons.flatMap(lesson => 
                            lesson.ratings.map(rating => ({
                              ...rating,
                              lessonTitle: lesson.title,
                              lessonRating: lesson.averageRating
                            }))
                          ).map((rating) => (
                            <div key={rating.id} className={`bg-white rounded-lg p-3 border transition-all ${rating.isRead === false ? 'shadow-lg shadow-amber-200/80 border-amber-400 ring-2 ring-amber-300/50 bg-gradient-to-br from-amber-50 via-yellow-50/30 to-white animate-pulse' : 'shadow-sm border-gray-200'}`}>
                              <div className="flex items-start justify-between mb-1.5">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <span className="font-medium text-gray-900">{rating.studentName}</span>
                                  <span className="text-sm text-gray-500">• {rating.lessonTitle}</span>
                                  {renderStars(rating.rating)}
                                </div>
                                <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                  {format(new Date(rating.createdAt), 'dd MMM yyyy', { locale: es })}
                                </span>
                              </div>
                              {rating.comment && (
                                <p className="text-sm text-gray-700 mt-1.5">{rating.comment}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
              })}
            </div>
          </div>
        );
        })}
      </div>
    </div>
  );
}
