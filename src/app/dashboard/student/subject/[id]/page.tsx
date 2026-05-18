'use client';

import { useState } from 'react';
import { SkeletonStudentClass } from '@/components/ui/SkeletonLoader';
import StudentTopicsLessonsList from './components/StudentTopicsLessonsList';
import ClassHeader from './components/ClassHeader';
import LessonContentView from './components/LessonContentView';
import { AccessLockedView, ClassNotStartedView } from './components/AccessBlockedViews';
import { useClassPageData } from './components/useClassPageData';
import { useClassPageActions } from './components/useClassPageActions';
import { parseDateString } from '@/lib/formatters';
import { UploadModal } from '@/app/dashboard/student/assignments/UploadModal';
import QuizTakingModal from '@/components/shared/QuizTakingModal';
import { apiClient, apiPost } from '@/lib/api-client';
import type { StudentAssignment } from './components/StudentTopicsLessonsTypes';

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

  const [modalAssignment, setModalAssignment] = useState<StudentAssignment | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleOpenAssignment = (assignment: StudentAssignment) => {
    setModalAssignment(assignment);
    if (assignment.type === 'quiz') {
      setShowQuizModal(true);
    } else {
      setShowUploadModal(true);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setUploadFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadFiles.length === 0 || !modalAssignment) return;
    setUploading(true);
    try {
      const uploadIds: string[] = [];
      for (const file of uploadFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'assignment_submission');
        const uploadRes = await apiClient('/storage/upload', { method: 'POST', body: formData });
        const uploadResult = await uploadRes.json();
        if (!uploadResult.success) throw new Error(uploadResult.error || 'Error al subir archivo');
        uploadIds.push(uploadResult.data.uploadId);
      }
      const res = await apiPost(`/assignments/${modalAssignment.id}/submit`, { uploadIds });
      const result = await res.json();
      if (result.success) {
        setShowUploadModal(false);
        setUploadFiles([]);
        setModalAssignment(null);
        data.loadData();
      } else {
        throw new Error(result.error || 'Error al entregar ejercicio');
      }
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Error al entregar ejercicio');
    } finally {
      setUploading(false);
    }
  };

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
            assignments={data.assignments}
            expandedTopics={data.expandedTopics}
            setExpandedTopics={data.setExpandedTopics}
            onSelectLesson={actions.selectLesson}
            onOpenAssignment={handleOpenAssignment}
          />
        )}
      </div>

      {showUploadModal && modalAssignment && (
        <UploadModal
          assignment={modalAssignment as any}
          uploadFiles={uploadFiles}
          setUploadFiles={setUploadFiles}
          uploading={uploading}
          dragActive={dragActive}
          onDrag={handleDrag}
          onDrop={handleDrop}
          onSubmit={handleSubmit}
          onClose={() => { setShowUploadModal(false); setUploadFiles([]); setModalAssignment(null); }}
        />
      )}

      {showQuizModal && modalAssignment && (
        <QuizTakingModal
          assignmentId={modalAssignment.id}
          assignmentTitle={modalAssignment.title}
          maxScore={modalAssignment.maxScore ?? 10}
          alreadyAttempted={modalAssignment.completed}
          feedbackMode={modalAssignment.feedbackMode}
          onClose={() => { setShowQuizModal(false); setModalAssignment(null); }}
          onCompleted={() => { setShowQuizModal(false); setModalAssignment(null); data.loadData(); }}
        />
      )}
    </>
  );
}
