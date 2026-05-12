'use client';

import { SkeletonStudentClass } from '@/components/ui/SkeletonLoader';
import StudentTopicsLessonsList from './components/StudentTopicsLessonsList';
import ClassHeader from './components/ClassHeader';
import LessonContentView from './components/LessonContentView';
import { AccessLockedView, ClassNotStartedView } from './components/AccessBlockedViews';
import { useClassPageData } from './components/useClassPageData';
import { useClassPageActions } from './components/useClassPageActions';
import { parseDateString } from '@/lib/formatters';

export default function ClassPage() {
  const data = useClassPageData();
  const actions = useClassPageActions({
    classId: data.classId,
    isDemo: data.isDemo,
    selectedLesson: data.selectedLesson,
    router: data.router,
    loadData: data.loadData,
    setLessons: data.setLessons,
    setSelectedLesson: data.setSelectedLesson,
    setSelectedVideo: data.setSelectedVideo,
    setLessonRating: data.setLessonRating,
    setExpandedTopics: data.setExpandedTopics,
    setShowRatingSuccess: data.setShowRatingSuccess,
    setTempRating: data.setTempRating,
    setFeedbackText: data.setFeedbackText,
    showRatingSuccess: data.showRatingSuccess,
    feedbackText: data.feedbackText,
    tempRating: data.tempRating,
  });

  if (data.loading) return <SkeletonStudentClass />;

  if (data.accessLocked) return <AccessLockedView classData={data.classData} />;

  if (data.classData?.startDate) {
    const startDate = parseDateString(data.classData.startDate);
    if (startDate > new Date()) return <ClassNotStartedView classData={data.classData} />;
  }

  return (
    <>
      <div className="space-y-6">
        {!data.selectedLesson && data.classData && (
          <ClassHeader classData={data.classData} activeStream={data.activeStream} />
        )}

        {data.selectedLesson && data.user && (
          <LessonContentView
            selectedLesson={data.selectedLesson}
            classId={data.classData?.id ?? ''}
            selectedVideo={data.selectedVideo}
            user={data.user}
            academyFeedbackEnabled={data.academyFeedbackEnabled}
            lessonRating={data.lessonRating}
            ratingHover={data.ratingHover}
            tempRating={data.tempRating}
            showRatingSuccess={data.showRatingSuccess}
            feedbackText={data.feedbackText}
            academyName={(data.classData as any)?.academyName ?? data.classData?.academy?.name}
            goBackToLessons={actions.goBackToLessons}
            selectVideoInLesson={actions.selectVideoInLesson}
            handleStarClick={actions.handleStarClick}
            setRatingHover={data.setRatingHover}
            setFeedbackText={data.setFeedbackText}
            submitRating={actions.submitRating}
          />
        )}

        {!data.selectedLesson && (
          <StudentTopicsLessonsList
            lessons={data.lessons}
            topics={data.topics}
            expandedTopics={data.expandedTopics}
            setExpandedTopics={data.setExpandedTopics}
            onSelectLesson={actions.selectLesson}
          />
        )}
      </div>
    </>
  );
}
