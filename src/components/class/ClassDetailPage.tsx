'use client';

import Link from 'next/link';
import { SkeletonClassDetail } from '@/components/ui/SkeletonLoader';
import { ClassHeader, PendingEnrollments, TopicsLessonsList } from '@/components/class';
import LessonFormModal from '@/components/class/LessonFormModal';
import LessonDetailView from '@/components/class/LessonDetailView';
import LiveStreamBanner from '@/components/class/LiveStreamBanner';
import RescheduleModal from '@/components/class/RescheduleModal';
import StreamNameModal from '@/components/class/StreamNameModal';
import { useClassDetail } from './useClassDetail';
import { useClassActions } from './useClassActions';
import { useLessonCreateEdit } from './useLessonCreateEdit';

export interface ClassDetailPageProps {
  role: 'academy' | 'teacher' | 'admin';
}

export default function ClassDetailPage({ role }: ClassDetailPageProps) {
  const s = useClassDetail(role);
  const {
    router, classId, basePath, currentUser,
    classData, lessons, topics,
    selectedLesson, selectedVideo,
    loading, lessonFeedback, highlightLessonId,
    showLessonForm, setShowLessonForm, editingLessonId, setEditingLessonId,
    editingLessonMedia, setEditingLessonMedia, lessonFormData, setLessonFormData,
    uploading, uploadProgress, uploadSpeed, uploadETA,
    showStreamNameModal, setShowStreamNameModal, streamNameInput, setStreamNameInput,
    showRescheduleModal, setShowRescheduleModal, reschedulingLesson, setReschedulingLesson,
    rescheduleDate, setRescheduleDate, rescheduleTime, setRescheduleTime,
    expandTopicId, showPendingRequests, setShowPendingRequests,
    copiedLink, setCopiedLink,
    pendingEnrollments, liveClasses, creatingStream, paymentStatus,
    feedbackEnabled, availableStreamRecordings,
    loadData, setTopics, setLessons,
  } = s;

  const {
    selectLesson, goBackToLessons, selectVideoInLesson,
    createLiveClass, confirmCreateStream, deleteLiveClass,
    handleEnrollmentAction, handleDeleteLesson, handleToggleRelease, handleBulkToggleRelease,
    handleLessonMove, handleRescheduleLesson, handleRescheduleSubmit, handleHideLesson,
    addVideoToForm, addDocumentToForm, handleDeleteVideo, handleDeleteDocument,
  } = useClassActions(s);

  const { handleLessonCreate, handleEditLesson, handleUpdateLesson } = useLessonCreateEdit(s);

  if (loading) {
    return <SkeletonClassDetail />;
  }

  if (!classData) {
    return (
      <div className="max-w-6xl mx-auto text-center py-12">
        <p className="text-gray-500">Class not found</p>
        <Link href={basePath} className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!selectedLesson && (
        <ClassHeader
          classData={classData}
          backLink={`${basePath}/subjects`}
          creatingStream={creatingStream}
          showPendingRequests={showPendingRequests}
          paymentStatus={paymentStatus}
          onCreateLesson={() => { router.push(`${basePath}/subject/${classId}?action=create`); }}
          onCreateStream={createLiveClass}
          onTogglePendingRequests={() => setShowPendingRequests(!showPendingRequests)}
        />
      )}

      {!selectedLesson && (
        <PendingEnrollments
          pendingEnrollments={pendingEnrollments}
          showPendingRequests={showPendingRequests}
          onApprove={(id) => handleEnrollmentAction(id, 'approve')}
          onReject={(id) => handleEnrollmentAction(id, 'reject')}
          onClose={() => setShowPendingRequests(false)}
        />
      )}

      {selectedLesson && currentUser && (
        <LessonDetailView
          lesson={selectedLesson}
          classId={classId}
          selectedVideo={selectedVideo}
          currentUserId={currentUser.id}
          feedbackEnabled={!!feedbackEnabled}
          lessonFeedback={lessonFeedback}
          onGoBack={goBackToLessons}
          onSelectVideo={selectVideoInLesson}
        />
      )}

      {!selectedLesson && (
        <>
          <LiveStreamBanner
            liveClasses={liveClasses}
            classData={classData}
            basePath={basePath}
            copiedLink={copiedLink}
            setCopiedLink={setCopiedLink}
            onDeleteStream={deleteLiveClass}
            onNavigate={(path) => router.push(path)}
          />

          {showLessonForm && (
            <LessonFormModal
              formData={lessonFormData}
              setFormData={setLessonFormData}
              topics={topics}
              editingLessonId={editingLessonId}
              editingLessonMedia={editingLessonMedia}
              uploading={uploading}
              uploadProgress={uploadProgress}
              uploadSpeed={uploadSpeed}
              uploadETA={uploadETA}
              paymentStatus={paymentStatus}
              availableStreamRecordings={availableStreamRecordings}
              onSubmitCreate={handleLessonCreate}
              onSubmitUpdate={handleUpdateLesson}
              onClose={() => { setShowLessonForm(false); setEditingLessonId(null); setEditingLessonMedia(null); router.push(`${basePath}/subject/${classId}`); }}
              onDeleteVideo={handleDeleteVideo}
              onDeleteDocument={handleDeleteDocument}
              onAddVideo={addVideoToForm}
              onAddDocument={addDocumentToForm}
            />
          )}

          <TopicsLessonsList
            lessons={lessons}
            topics={topics}
            classId={classData?.id || ''}
            totalStudents={(classData.enrollments || []).filter(e => e.status === 'APPROVED').length}
            expandTopicId={expandTopicId}
            highlightLessonId={highlightLessonId}
            paymentStatus={paymentStatus}
            onSelectLesson={selectLesson}
            onEditLesson={handleEditLesson}
            onDeleteLesson={handleDeleteLesson}
            onRescheduleLesson={handleRescheduleLesson}
            onTopicsChange={loadData}
            onLessonMove={handleLessonMove}
            onToggleRelease={handleToggleRelease}
            onBulkToggleRelease={handleBulkToggleRelease}
            onTopicsUpdate={setTopics}
            onLessonsUpdate={setLessons}
          />

          {showRescheduleModal && reschedulingLesson && (
            <RescheduleModal
              rescheduleDate={rescheduleDate}
              rescheduleTime={rescheduleTime}
              paymentStatus={paymentStatus}
              onDateChange={setRescheduleDate}
              onTimeChange={setRescheduleTime}
              onSubmit={handleRescheduleSubmit}
              onClose={() => { setShowRescheduleModal(false); setReschedulingLesson(null); }}
            />
          )}
        </>
      )}

      {showStreamNameModal && (
        <StreamNameModal
          streamNameInput={streamNameInput}
          paymentStatus={paymentStatus}
          onInputChange={setStreamNameInput}
          onConfirm={confirmCreateStream}
          onClose={() => { setShowStreamNameModal(false); setStreamNameInput(''); }}
        />
      )}
    </div>
  );
}
