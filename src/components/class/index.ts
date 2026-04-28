/**
 * Shared Class Components
 * 
 * Used by: Academy, Admin, and Teacher class detail pages
 * Purpose: Eliminate duplicate components across dashboard roles
 */

export { default as TopicsLessonsList } from './TopicsLessonsList';
export type { TopicsLessonsListProps, Topic, Lesson as TopicLesson } from './TopicsLessonsList';

export { default as PendingEnrollments } from './PendingEnrollments';
export type { PendingEnrollmentsProps } from './PendingEnrollments';

export { default as ClassHeader } from './ClassHeader';
export type { ClassHeaderProps } from './ClassHeader';

export { default as ClassDetailPage } from './ClassDetailPage';
export type { ClassDetailPageProps } from './ClassDetailPage';
