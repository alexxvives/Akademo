'use client';

import { DragEvent, ReactNode } from 'react';
import Link from 'next/link';
import { DeleteIcon } from '@/components/ui/DeleteIcon';
import type { Lesson } from './types';

interface TopicSectionProps {
  topicId: string | null;
  topicName: string;
  topicLessons: Lesson[];
  isExpanded: boolean;
  isDragOver: boolean;
  isDraggingThis?: boolean;
  onToggle: () => void;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  onTopicDragStart?: (e: DragEvent<HTMLDivElement>) => void;
  onTopicDragEnd?: () => void;
  onDeleteTopic?: () => void;
  onHideAllLessons?: () => void;
  renderLesson: (lesson: Lesson) => ReactNode;
  viewMode?: 'cards' | 'rows';
  quizCount?: number;
  dashboardBase?: string;
  classId?: string;
}

export function TopicSection({
  topicId, topicName, topicLessons, isExpanded, isDragOver, isDraggingThis,
  onToggle, onDragOver, onDrop, onTopicDragStart, onTopicDragEnd,
  onDeleteTopic, onHideAllLessons, renderLesson, viewMode = 'cards',
  quizCount, dashboardBase, classId,
}: TopicSectionProps) {
  return (
    <div
      className={`rounded-xl border-2 transition-all duration-200 ${
        isDragOver
          ? 'border-accent-500 bg-accent-500/10 shadow-lg shadow-accent-500/10'
          : 'border-slate-600/40'
      } ${isDraggingThis ? 'opacity-40' : ''}`}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Topic Header */}
      <div
        className="flex items-center justify-between px-4 py-3.5 cursor-pointer rounded-t-xl transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          {topicId && onTopicDragStart && (
            <div
              draggable
              onDragStart={onTopicDragStart}
              onDragEnd={onTopicDragEnd}
              onClick={(e) => e.stopPropagation()}
              className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Arrastra para reordenar"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="9" cy="5" r="1.5" /><circle cx="15" cy="5" r="1.5" />
                <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
                <circle cx="9" cy="19" r="1.5" /><circle cx="15" cy="19" r="1.5" />
              </svg>
            </div>
          )}
          <svg
            className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="font-semibold text-gray-900">{topicName}</span>
          <span className="text-xs text-gray-600 bg-gray-200 px-2.5 py-1 rounded-full font-medium">
            {topicLessons.length} {topicLessons.length === 1 ? 'clase' : 'clases'}
          </span>
          {topicId && dashboardBase && classId && quizCount != null && quizCount > 0 && (
            <Link
              href={`${dashboardBase}/assignments?tab=quiz&classId=${classId}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full font-medium hover:bg-blue-100 transition-colors"
            >
              {quizCount} {quizCount === 1 ? 'ejercicio' : 'ejercicios'}
            </Link>
          )}
        </div>
        {topicId && (
          <div className="flex items-center gap-1">
            {onHideAllLessons && (
              <div className="relative group/hidetopic">
                <button
                  onClick={(e) => { e.stopPropagation(); onHideAllLessons(); }}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 rounded-lg transition-all duration-200"
                >
                  {topicLessons.some(l => new Date(l.releaseDate) <= new Date()) ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
                <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 px-3 py-2 bg-slate-800 text-slate-200 text-xs rounded-lg shadow-xl border border-slate-700 opacity-0 invisible group-hover/hidetopic:opacity-100 group-hover/hidetopic:visible transition-all duration-200 whitespace-nowrap z-20">
                  <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-2 bg-slate-800 border-r border-b border-slate-700 rotate-45"></div>
                  {topicLessons.some(l => new Date(l.releaseDate) <= new Date()) ? 'Ocultar todas las Clases de este tema' : 'Mostrar todas las Clases de este tema'}
                </div>
              </div>
            )}
            {onDeleteTopic && (
              <div className="relative group/delete">
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteTopic(); }}
                  className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-500/15 rounded-lg transition-all duration-200"
                >
                  <DeleteIcon size={16} />
                </button>
                <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 px-3 py-2 bg-slate-800 text-slate-200 text-xs rounded-lg shadow-xl border border-slate-700 opacity-0 invisible group-hover/delete:opacity-100 group-hover/delete:visible transition-all duration-200 whitespace-nowrap z-20">
                  <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-2 bg-slate-800 border-r border-b border-slate-700 rotate-45"></div>
                  Las Clases se moverán a &quot;Sin tema&quot;
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lessons Grid */}
      {isExpanded && (
        <div className="px-4 pb-4">
          {topicLessons.length === 0 ? (
            <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-500/40 rounded-lg">
              <svg className="w-8 h-8 mx-auto mb-2 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              <p>Arrastra Clases aquí</p>
            </div>
          ) : (
            <div className={viewMode === 'rows' ? 'flex flex-col gap-2 p-2' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-2'}>
              {topicLessons.map(renderLesson)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
