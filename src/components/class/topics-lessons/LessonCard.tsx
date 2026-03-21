'use client';

import { DragEvent } from 'react';
import { isReleased } from '@/lib/formatters';
import { DeleteIcon } from '@/components/ui/DeleteIcon';
import type { Lesson } from './types';
import { LessonCardThumbnail } from './LessonCardThumbnail';

interface LessonCardProps {
  lesson: Lesson;
  glowLessonId: string | null;
  onHighlightRef?: (el: HTMLDivElement | null) => void;
  draggedLesson: string | null;
  isDisabled: boolean;
  totalStudents: number;
  onDragStart: (e: DragEvent, lessonId: string) => void;
  onDragEnd: () => void;
  onSelectLesson: (lesson: Lesson) => void;
  onEditLesson: (lesson: Lesson) => void;
  onDeleteLesson: (lessonId: string) => void;
  onRescheduleLesson: (lesson: Lesson) => void;
  onToggleRelease: (lesson: Lesson) => void;
  onManageStudentTimes: (lesson: Lesson) => void;
}

export function LessonCard({
  lesson, glowLessonId, onHighlightRef, draggedLesson, isDisabled, totalStudents,
  onDragStart, onDragEnd, onSelectLesson, onEditLesson,
  onDeleteLesson, onRescheduleLesson, onToggleRelease, onManageStudentTimes,
}: LessonCardProps) {
  const released = isReleased(lesson.releaseDate);

  return (
    <div
      ref={glowLessonId === lesson.id ? onHighlightRef : undefined}
      draggable={!lesson.isUploading}
      onDragStart={(e) => onDragStart(e, lesson.id)}
      onDragEnd={onDragEnd}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('[data-action-buttons]')) return;
        if (!lesson.isUploading) onSelectLesson(lesson);
      }}
      className={`bg-[#1a1d29] rounded-xl overflow-hidden transition-all duration-300 group border shadow-sm ${
        glowLessonId === lesson.id
          ? 'border-blue-400 border-2 ring-4 ring-blue-400/80 shadow-[0_0_60px_rgba(96,165,250,0.7),0_0_120px_rgba(96,165,250,0.4)]'
          : 'border-gray-700'
      } ${
        lesson.isUploading
          ? 'cursor-default'
          : 'hover:border-accent-500 hover:shadow-xl hover:shadow-accent-500/20 cursor-pointer hover:scale-[1.03]'
      } ${draggedLesson === lesson.id ? 'opacity-50' : ''} ${!released ? 'opacity-70 grayscale sepia-[.2]' : ''}`}
    >
      <div className="flex flex-col h-full">
        {/* Header with Title and Action Buttons */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-bold text-white line-clamp-2 flex-1">{lesson.title}</h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex gap-1.5" data-action-buttons>
                <button
                  onClick={(e) => { e.stopPropagation(); onManageStudentTimes(lesson); }}
                  className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 hover:scale-105 transition-all border border-blue-500/30"
                  title="Gestionar tiempos de estudiantes"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onRescheduleLesson(lesson); }}
                  className="p-2 bg-violet-500/20 text-violet-400 rounded-lg hover:bg-violet-500/30 hover:scale-105 transition-all border border-violet-500/30"
                  title="Reprogramar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); if (!lesson.isUploading) onEditLesson(lesson); }}
                  disabled={lesson.isUploading}
                  className="p-2 bg-accent-500/20 text-accent-400 rounded-lg hover:bg-accent-500/30 hover:scale-105 transition-all border border-accent-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Editar lección"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); if (!lesson.isUploading && !isDisabled) onDeleteLesson(lesson.id); }}
                  disabled={lesson.isUploading || isDisabled}
                  className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 hover:scale-105 transition-all border border-red-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
                  title={isDisabled ? 'Active su academia para eliminar lecciones' : 'Eliminar lección'}
                >
                  <DeleteIcon size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Thumbnail */}
        <LessonCardThumbnail lesson={lesson} released={released} onToggleRelease={onToggleRelease} />

        {/* Card Body */}
        <div className="p-4">
          {!lesson.isUploading && !lesson.isTranscoding && (
            <>
              <div className="flex items-center justify-between text-sm mb-2">
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500 text-base">{'★'.repeat(Math.round(lesson.avgRating || 0))}</span>
                  <span className="text-gray-600 text-base">{'★'.repeat(5 - Math.round(lesson.avgRating || 0))}</span>
                  {lesson.ratingCount !== undefined && lesson.ratingCount > 0 && (
                    <span className="text-xs text-gray-400 ml-1">({lesson.ratingCount})</span>
                  )}
                </div>
                <span
                  className="text-gray-300 font-bold text-sm cursor-help"
                  title="Número de estudiantes que han accedido a la clase"
                >
                  {lesson.studentsAccessed || 0}/{totalStudents} estudiantes
                </span>
              </div>
              <div
                className="h-2 bg-gray-700 rounded-full overflow-hidden cursor-help"
                title="Número de estudiantes que han accedido a la clase"
              >
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${totalStudents > 0 ? Math.min(100, ((lesson.studentsAccessed || 0) / totalStudents) * 100) : 0}%`,
                    background: totalStudents > 0 && ((lesson.studentsAccessed || 0) / totalStudents) >= 0.75
                      ? 'linear-gradient(to right, #15803d, #166534)'
                      : totalStudents > 0 && ((lesson.studentsAccessed || 0) / totalStudents) >= 0.50
                      ? 'linear-gradient(to right, #22c55e, #15803d)'
                      : totalStudents > 0 && ((lesson.studentsAccessed || 0) / totalStudents) >= 0.25
                      ? 'linear-gradient(to right, #eab308, #22c55e)'
                      : 'linear-gradient(to right, #ef4444, #eab308)',
                  }}
                />
              </div>
            </>
          )}
          {lesson.isUploading && (
            <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/30">
              <div className="flex items-center justify-between text-sm text-blue-400 mb-2">
                <span className="font-medium flex items-center gap-2">
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-400/30 border-t-blue-400" />
                  Subiendo...
                </span>
                <span className="font-bold">{Math.round(lesson.uploadProgress || 0)}%</span>
              </div>
              <div className="h-1.5 bg-blue-500/20 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all" style={{ width: `${lesson.uploadProgress || 0}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
