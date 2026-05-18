'use client';

import StudentTopicSection from './StudentTopicSection';
import type { Lesson, StudentAssignment, StudentTopicsLessonsListProps } from './StudentTopicsLessonsTypes';

export default function StudentTopicsLessonsList({
  lessons,
  topics,
  assignments,
  expandedTopics,
  setExpandedTopics,
  onSelectLesson,
}: StudentTopicsLessonsListProps) {
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

  // Group lessons by topic
  const lessonsByTopic = new Map<string | null, Lesson[]>();
  lessons.forEach(lesson => {
    const key = lesson.topicId || null;
    if (!lessonsByTopic.has(key)) {
      lessonsByTopic.set(key, []);
    }
    lessonsByTopic.get(key)!.push(lesson);
  });

  // Group assignments by topic
  const assignmentsByTopic = new Map<string | null, StudentAssignment[]>();
  assignments.forEach(assignment => {
    const key = assignment.topicId || null;
    if (!assignmentsByTopic.has(key)) {
      assignmentsByTopic.set(key, []);
    }
    assignmentsByTopic.get(key)!.push(assignment);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-gray-900">Clases</h2>
      </div>

      {lessons.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">Aún no hay Clases</h3>
          <p className="text-gray-500 text-sm">El profesor aún no ha creado Clases para esta clase.</p>
        </div>
      ) : (
        <div className="max-h-[700px] overflow-y-auto space-y-3 py-2">
          {topics.map(topic => (
            <StudentTopicSection
              key={topic.id}
              topicId={topic.id}
              topicName={topic.name}
              lessons={lessonsByTopic.get(topic.id) || []}
              assignments={assignmentsByTopic.get(topic.id) || []}
              isExpanded={expandedTopics.has(topic.id)}
              onToggle={() => toggleTopic(topic.id)}
              onSelectLesson={onSelectLesson}
              quizCount={topic.quizCount}
            />
          ))}
          <StudentTopicSection
            topicId={null}
            topicName="Sin tema"
            lessons={lessonsByTopic.get(null) || []}
            assignments={assignmentsByTopic.get(null) || []}
            isExpanded={expandedTopics.has('uncategorized')}
            onToggle={() => toggleTopic('uncategorized')}
            onSelectLesson={onSelectLesson}
          />
        </div>
      )}
    </div>
  );
}
