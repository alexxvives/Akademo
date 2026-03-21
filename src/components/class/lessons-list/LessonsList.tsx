'use client';

/**
 * Shared LessonsList Component
 * Used by: Academy, Admin, and Teacher class detail pages
 */

import LessonCard from './LessonCard';
import type { LessonsListProps } from './types';

export default function LessonsList({
  lessons,
  onSelectLesson,
  onEditLesson,
  onDeleteLesson,
  onToggleRelease,
}: LessonsListProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Clases</h2>
      {lessons.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-12 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">Aún no hay Clases</h3>
          <p className="text-gray-500 text-sm">Crea tu primera lección para comenzar</p>
        </div>
      ) : (
        <div className="max-h-[600px] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-2">
            {lessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                onSelectLesson={onSelectLesson}
                onEditLesson={onEditLesson}
                onDeleteLesson={onDeleteLesson}
                onToggleRelease={onToggleRelease}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
