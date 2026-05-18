import StudentLessonCard from './StudentLessonCard';
import { AssignmentCard } from '@/components/class/topics-lessons/AssignmentCard';
import type { TopicSectionProps } from './StudentTopicsLessonsTypes';

export default function StudentTopicSection({
  topicId,
  topicName,
  lessons,
  assignments,
  isExpanded,
  onToggle,
  onSelectLesson,
  onOpenAssignment,
  quizCount,
}: TopicSectionProps) {
  if (lessons.length === 0 && assignments.length === 0) return null;

  return (
    <div
      key={topicId || 'uncategorized'}
      className="rounded-xl border-2 border-slate-600/40 transition-all duration-200"
    >
      {/* Topic Header */}
      <div
        className="flex items-center justify-between px-4 py-3.5 cursor-pointer rounded-t-xl transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <svg
            className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="font-semibold text-gray-900">{topicName}</span>
          <span className="text-xs text-gray-600 bg-gray-200 px-2.5 py-1 rounded-full font-medium">
            {lessons.length} {lessons.length === 1 ? 'lección' : 'Clases'}
          </span>
          {assignments.length > 0 && (
            <a
              href="/dashboard/student/assignments"
              onClick={e => e.stopPropagation()}
              className="text-xs text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full font-medium hover:bg-blue-200 transition-colors"
            >
              {assignments.length} {assignments.length === 1 ? 'ejercicio' : 'ejercicios'}
            </a>
          )}
        </div>
      </div>

      {/* Lessons + Assignments Grid */}
      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-2">
            {lessons.map(lesson => (
              <StudentLessonCard
                key={lesson.id}
                lesson={lesson}
                onSelectLesson={onSelectLesson}
              />
            ))}
            {assignments.map(assignment => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                viewMode="cards"
                dashboardBase="/dashboard/student"
                totalStudents={0}
                isStudentView={true}
                completed={assignment.completed}
                onOpen={onOpenAssignment ? () => onOpenAssignment(assignment) : undefined}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
