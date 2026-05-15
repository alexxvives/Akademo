'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Lesson, TopicAssignment, TopicsLessonsListProps } from './types';
import { useTopicsLessons } from './useTopicsLessons';
import { LessonCard } from './LessonCard';
import { TopicSection } from './TopicSection';
import { StudentTimeModal } from './StudentTimeModal';

export default function TopicsLessonsList({
  lessons, topics, classId, totalStudents, expandTopicId, highlightLessonId,
  paymentStatus, onSelectLesson, onEditLesson, onDeleteLesson, onRescheduleLesson,
  onTopicsChange, onTopicsUpdate, onLessonsUpdate, onLessonMove, onToggleRelease, onBulkToggleRelease, onToggleTopicHidden,
  dashboardBase, assignments = [],
}: TopicsLessonsListProps) {
  const h = useTopicsLessons({
    lessons, topics, classId, expandTopicId, highlightLessonId, paymentStatus,
    onTopicsChange, onTopicsUpdate, onLessonsUpdate, onLessonMove,
  });

  const assignmentsByTopic = useMemo(() => {
    const map = new Map<string | null, TopicAssignment[]>();
    for (const a of assignments) {
      const key = a.topicId || null;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    return map;
  }, [assignments]);

  const [viewMode, setViewMode] = useState<'cards' | 'rows'>('cards');
  useEffect(() => {
    const saved = localStorage.getItem('lessons-view');
    if (saved === 'cards' || saved === 'rows') setViewMode(saved);
  }, []);
  const handleViewModeChange = (mode: 'cards' | 'rows') => {
    setViewMode(mode);
    localStorage.setItem('lessons-view', mode);
  };

  const renderLesson = (lesson: Lesson) => (
    <LessonCard
      key={lesson.id}
      lesson={lesson}
      viewMode={viewMode}
      glowLessonId={h.glowLessonId}
      onHighlightRef={h.setHighlightCardRef}
      draggedLesson={h.draggedLesson}
      isDisabled={h.isDisabled}
      totalStudents={totalStudents}
      onDragStart={h.handleDragStart}
      onDragEnd={h.handleDragEnd}
      onSelectLesson={onSelectLesson}
      onEditLesson={onEditLesson}
      onDeleteLesson={onDeleteLesson}
      onRescheduleLesson={onRescheduleLesson}
      onToggleRelease={onToggleRelease}
      onManageStudentTimes={h.handleManageStudentTimes}
    />
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Clases</h2>
          <div className="relative group/hideall">
            <button
              onClick={() => {
                const hasVisible = lessons.some(l => new Date(l.releaseDate) <= new Date());
                if (hasVisible && !window.confirm('¿Ocultar todas las clases visibles?')) return;
                onBulkToggleRelease(lessons);
              }}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 rounded-lg transition-all duration-200"
            >
              {lessons.some(l => new Date(l.releaseDate) <= new Date()) ? (
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
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-2 bg-slate-800 text-slate-200 text-xs rounded-lg shadow-xl border border-slate-700 opacity-0 invisible group-hover/hideall:opacity-100 group-hover/hideall:visible transition-all duration-200 whitespace-nowrap z-20">
              <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-slate-800 border-l border-t border-slate-700 rotate-45"></div>
              {lessons.some(l => new Date(l.releaseDate) <= new Date()) ? 'Ocultar todas las Clases visibles' : 'Mostrar todas las Clases'}
            </div>
          </div>
        </div>
        {h.showNewTopicInput ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={h.newTopicName}
              onChange={(e) => h.setNewTopicName(e.target.value)}
              placeholder="Nombre del tema"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && h.handleCreateTopic()}
              autoFocus
            />
            <button
              onClick={h.handleCreateTopic}
              disabled={h.creatingTopic || !h.newTopicName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {h.creatingTopic ? 'Creando...' : 'Crear'}
            </button>
            <button
              onClick={() => { h.setShowNewTopicInput(false); h.setNewTopicName(''); }}
              className="px-3 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => handleViewModeChange('cards')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'cards' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                title="Vista cuadrícula"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
              </button>
              <button
                onClick={() => handleViewModeChange('rows')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'rows' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                title="Vista lista"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            <button
              onClick={() => h.setShowNewTopicInput(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Tema
            </button>
          </div>
        )}
      </div>

      {lessons.length === 0 && topics.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">Aún no hay Clases</h3>
          <p className="text-gray-500 text-sm">Crea tu primera lección para comenzar</p>
        </div>
      ) : lessons.length === 0 && topics.length > 0 ? (
        <div ref={h.scrollContainerRef} className="max-h-[calc(100dvh-14rem)] overflow-y-auto space-y-3 scroll-smooth py-2">
          {topics.map((topic, index) => (
            <div
              key={topic.id}
              className="relative"
              onDragOver={(e) => h.handleTopicDragOver(e, index)}
              onDrop={h.handleTopicDrop}
            >
              {h.draggedTopicId && h.draggedTopicId !== topic.id && h.topicInsertIndex === index && (
                <div className="absolute -top-2 left-0 right-0 h-0.5 bg-blue-400 rounded-full z-20 shadow-[0_0_6px_2px_rgba(96,165,250,0.6)]" />
              )}
              <TopicSection
                topicId={topic.id}
                topicName={topic.name}
                topicLessons={[]}
                isExpanded={h.expandedTopics.has(topic.id)}
                isDragOver={h.dragOverTopic === topic.id}
                isDraggingThis={h.draggedTopicId === topic.id}
                onToggle={() => h.toggleTopic(topic.id)}
                onDragOver={(e) => h.handleDragOver(e, topic.id)}
                onDrop={(e) => h.handleDrop(e, topic.id)}
                onTopicDragStart={(e) => h.handleTopicDragStart(e, topic.id)}
                onTopicDragEnd={h.handleTopicDragEnd}
                onDeleteTopic={() => h.handleDeleteTopic(topic.id)}
                onHideAllLessons={() => onBulkToggleRelease(h.lessonsByTopic.get(topic.id) || [])}
                onToggleTopicHidden={onToggleTopicHidden ? () => onToggleTopicHidden(topic.id, !(topic.hidden === 1 || topic.hidden === true)) : undefined}
                topicHidden={topic.hidden === 1 || topic.hidden === true}
                renderLesson={renderLesson}
                viewMode={viewMode}
                quizCount={topic.quizCount}
                dashboardBase={dashboardBase}
                classId={classId}
                topicAssignments={assignmentsByTopic.get(topic.id) || []}
              />
              {h.draggedTopicId && h.draggedTopicId !== topic.id && h.topicInsertIndex === index + 1 && index === topics.length - 1 && (
                <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-blue-400 rounded-full z-20 shadow-[0_0_6px_2px_rgba(96,165,250,0.6)]" />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div ref={h.scrollContainerRef} className="max-h-[calc(100dvh-14rem)] overflow-y-auto space-y-3 scroll-smooth py-2">
          {topics.map((topic, index) => (
            <div
              key={topic.id}
              className="relative"
              onDragOver={(e) => h.handleTopicDragOver(e, index)}
              onDrop={h.handleTopicDrop}
            >
              {h.draggedTopicId && h.draggedTopicId !== topic.id && h.topicInsertIndex === index && (
                <div className="absolute -top-2 left-0 right-0 h-0.5 bg-blue-400 rounded-full z-20 shadow-[0_0_6px_2px_rgba(96,165,250,0.6)]" />
              )}
              <TopicSection
                topicId={topic.id}
                topicName={topic.name}
                topicLessons={h.lessonsByTopic.get(topic.id) || []}
                isExpanded={h.expandedTopics.has(topic.id)}
                isDragOver={h.dragOverTopic === topic.id}
                isDraggingThis={h.draggedTopicId === topic.id}
                onToggle={() => h.toggleTopic(topic.id)}
                onDragOver={(e) => h.handleDragOver(e, topic.id)}
                onDrop={(e) => h.handleDrop(e, topic.id)}
                onTopicDragStart={(e) => h.handleTopicDragStart(e, topic.id)}
                onTopicDragEnd={h.handleTopicDragEnd}
                onDeleteTopic={() => h.handleDeleteTopic(topic.id)}
                onHideAllLessons={() => onBulkToggleRelease(h.lessonsByTopic.get(topic.id) || [])}
                onToggleTopicHidden={onToggleTopicHidden ? () => onToggleTopicHidden(topic.id, !(topic.hidden === 1 || topic.hidden === true)) : undefined}
                topicHidden={topic.hidden === 1 || topic.hidden === true}
                renderLesson={renderLesson}
                viewMode={viewMode}
                quizCount={topic.quizCount}
                dashboardBase={dashboardBase}
                classId={classId}
                topicAssignments={assignmentsByTopic.get(topic.id) || []}
              />
              {h.draggedTopicId && h.draggedTopicId !== topic.id && h.topicInsertIndex === index + 1 && index === topics.length - 1 && (
                <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-blue-400 rounded-full z-20 shadow-[0_0_6px_2px_rgba(96,165,250,0.6)]" />
              )}
            </div>
          ))}
          <TopicSection
            topicId={null}
            topicName="Sin tema"
            topicLessons={h.lessonsByTopic.get(null) || []}
            isExpanded={h.expandedTopics.has('uncategorized')}
            isDragOver={h.dragOverTopic === 'uncategorized'}
            onToggle={() => h.toggleTopic('uncategorized')}
            onDragOver={(e) => h.handleDragOver(e, null)}
            onDrop={(e) => h.handleDrop(e, null)}
            renderLesson={renderLesson}
            viewMode={viewMode}
            topicAssignments={assignmentsByTopic.get(null) || []}
            dashboardBase={dashboardBase}
          />
        </div>
      )}

      <StudentTimeModal
        show={h.showTimeModal}
        lesson={h.selectedLessonForTime}
        isLoading={h.isLoadingStudentTimes}
        searchQuery={h.timeSearchQuery}
        onSearchChange={h.setTimeSearchQuery}
        studentData={h.studentTimesData}
        isDisabled={h.isDisabled}
        onUpdateTime={h.handleUpdateStudentTime}
        onClose={h.closeTimeModal}
      />
    </div>
  );
}
