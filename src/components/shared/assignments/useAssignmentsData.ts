'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { generateDemoAssignments, generateDemoClasses } from '@/lib/demo-data';
import { usePeriod } from '@/contexts/PeriodContext';
import { createEmptyQuestion } from '../QuizQuestionBuilder';
import type { QuizQuestionForm } from '../QuizQuestionBuilder';
import type { Class, Assignment, Submission, Academy, AssignmentsPageProps } from './assignments-types';

export function useAssignmentsData(role: AssignmentsPageProps['role']) {
  const isAcademy = role === 'ACADEMY';
  const isAdmin = role === 'ADMIN';
  const isTeacher = role === 'TEACHER';
  const { activePeriodId, isClassInPeriod } = usePeriod();
  const searchParams = useSearchParams();

  const [classes, setClasses] = useState<Class[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingAssignmentId, setDeletingAssignmentId] = useState<string | null>(null);
  const [glowId, setGlowId] = useState<string | null>(null);
  const highlightRef = useRef<HTMLTableRowElement | null>(null);
  const classIdFromUrl = searchParams.get('classId') || '';
  const [selectedClassId, setSelectedClassId] = useState(classIdFromUrl);
  const [selectedClassForCreate, setSelectedClassForCreate] = useState('');
  const [selectedLessonForCreate, setSelectedLessonForCreate] = useState('');
  const [selectedTopicForCreate, setSelectedTopicForCreate] = useState('');
  const [academyName, setAcademyName] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editUploadFiles, setEditUploadFiles] = useState<File[]>([]);
  const [editQuizQuestions, setEditQuizQuestions] = useState<QuizQuestionForm[]>([]);
  const [updating, setUpdating] = useState(false);
  const [editClassId, setEditClassId] = useState('');
  const [editTopicId, setEditTopicId] = useState('');
  const [editLessonId, setEditLessonId] = useState('');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [gradeScore, setGradeScore] = useState(0);
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [creating, setCreating] = useState(false);
  const [requireGrading, setRequireGrading] = useState(true);
  const [uploadingSolutionId, setUploadingSolutionId] = useState<string | null>(null);
  const solutionFileRef = useRef<HTMLInputElement>(null);
  const solutionAssignmentRef = useRef<string | null>(null);
  const [assignmentType, setAssignmentType] = useState<'file' | 'quiz'>('file');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestionForm[]>([createEmptyQuestion()]);
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [selectedAcademy, setSelectedAcademy] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  const loadAcademyAssignments = useCallback(async () => {
    try {
      if (paymentStatus === 'NOT PAID') {
        const demoAssignments = generateDemoAssignments();
        const filtered = selectedClassId
          ? demoAssignments.filter(a => a.classId === selectedClassId)
          : demoAssignments;
        setAssignments(filtered.map((a) => ({
          id: a.id, title: a.title, description: a.description, dueDate: a.dueDate,
          maxScore: a.maxScore, submissionCount: a.submissionCount, gradedCount: a.gradedCount,
          attachmentName: a.attachmentName, createdAt: a.createdAt, className: a.className,
          attachmentIds: a.attachmentIds,
        })));
        return;
      }
      const url = selectedClassId ? `/assignments?classId=${selectedClassId}` : '/assignments/all';
      const res = await apiClient(url);
      const result = await res.json();
      if (result.success) setAssignments(result.data);
    } catch (error) {
      console.error('Failed to load assignments:', error);
    }
  }, [paymentStatus, selectedClassId]);

  useEffect(() => {
    if ((isAcademy || isTeacher) && userEmail && paymentStatus) loadAcademyAssignments();
  }, [isAcademy, isTeacher, loadAcademyAssignments, userEmail, paymentStatus]);

  const loadAcademyData = async () => {
    try {
      setLoading(true);
      const userRes = await apiClient('/auth/me');
      const userResult = await userRes.json();
      setUserEmail(userResult.success && userResult.data ? userResult.data.email || '' : '');
      const academyRes = await apiClient('/academies');
      const academyResult = await academyRes.json();
      if (academyResult.success && Array.isArray(academyResult.data) && academyResult.data.length > 0) {
        const academy = academyResult.data[0];
        setAcademyName(academy.name || '');
        const status = academy.paymentStatus || 'PAID';
        setPaymentStatus(status);
        setRequireGrading(academy.requireGrading !== 0);
        if (status === 'NOT PAID') {
          const demoClasses = generateDemoClasses();
          setClasses(demoClasses.map(c => ({ id: c.id, name: c.name })));
          setLoading(false);
          return;
        }
      }
      const teacherRes = await apiClient('/requests/teacher');
      const teacherResult = await teacherRes.json();
      if (Array.isArray(teacherResult) && teacherResult.length > 0) {
        setAcademyName(teacherResult[0].academyName || '');
      }
      const classRes = await apiClient('/classes');
      const classResult = await classRes.json();
      if (classResult.success && classResult.data) setClasses(classResult.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally { setLoading(false); }
  };

  const loadTeacherData = async () => {
    try {
      setLoading(true);
      const userRes = await apiClient('/auth/me');
      const userResult = await userRes.json();
      setUserEmail(userResult.success && userResult.data ? userResult.data.email || '' : '');
      const academyRes = await apiClient('/teacher/academy');
      if (academyRes.ok) {
        const academyResult = await academyRes.json() as {
          data?: { academy?: { name?: string; paymentStatus?: string; requireGrading?: number } }
        };
        if (academyResult.data?.academy) {
          setAcademyName(academyResult.data.academy.name || '');
          const status = academyResult.data.academy.paymentStatus || 'PAID';
          setPaymentStatus(status);
          setRequireGrading(academyResult.data.academy.requireGrading !== 0);
          if (status === 'NOT PAID') {
            const demoClasses = generateDemoClasses();
            setClasses(demoClasses.map(c => ({ id: c.id, name: c.name })));
            setLoading(false);
            return;
          }
        }
      }
      const classRes = await apiClient('/classes');
      const classResult = await classRes.json();
      if (classResult.success && classResult.data) setClasses(classResult.data);
    } catch (error) {
      console.error('Failed to load teacher data:', error);
    } finally { setLoading(false); }
  };

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const res = await apiClient('/admin/academies');
      const result = await res.json();
      if (result.success) {
        const paid = (result.data || []).filter((a: { paymentStatus?: string }) => a.paymentStatus === 'PAID');
        setAcademies(paid);
      }
    } catch (error) {
      console.error('Failed to load academies:', error);
    } finally { setLoading(false); }
  };

  const loadAdminClasses = async () => {
    if (!selectedAcademy) { setClasses([]); return; }
    try {
      const res = await apiClient(`/academies/${selectedAcademy}/classes`);
      const result = await res.json();
      if (result.success) setClasses(result.data || []);
    } catch (error) { console.error('Failed to load classes:', error); }
  };

  const loadAdminAssignments = async () => {
    try {
      let url = '/assignments/all';
      if (selectedClass) {
        url = `/assignments?classId=${selectedClass}`;
      } else if (selectedAcademy) {
        const res = await apiClient(`/academies/${selectedAcademy}/classes`);
        const classesResult = await res.json();
        if (classesResult.success && classesResult.data) {
          const classIds = classesResult.data.map((c: Class) => c.id);
          if (classIds.length > 0) {
            const promises = classIds.map((cid: string) =>
              apiClient(`/assignments?classId=${cid}`).then(r => r.json())
            );
            const results = await Promise.all(promises);
            setAssignments(results.flatMap(r => r.success ? r.data : []));
            return;
          }
        }
        setAssignments([]); return;
      }
      const res = await apiClient(url);
      const result = await res.json();
      if (result.success) setAssignments(result.data || []);
    } catch (error) { console.error('Failed to load assignments:', error); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (isAcademy) loadAcademyData(); else if (isTeacher) loadTeacherData(); else loadAdminData(); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (isAdmin) loadAdminClasses(); }, [selectedAcademy]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (isAdmin) loadAdminAssignments(); }, [selectedAcademy, selectedClass]);

  useEffect(() => {
    const highlightId = searchParams.get('highlight');
    if (!highlightId || assignments.length === 0) return;
    setGlowId(highlightId);
    setTimeout(() => { highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 300);
    const timer = setTimeout(() => setGlowId(null), 3300);
    return () => clearTimeout(timer);
  }, [searchParams, assignments]);

  const filteredClasses = (() => {
    let result = (isAdmin && selectedAcademy) ? classes.filter(c => c.academyId === selectedAcademy) : classes;
    if (activePeriodId !== 'all') result = result.filter(c => isClassInPeriod(c.startDate));
    return result;
  })();
  const periodClassIds = activePeriodId !== 'all' ? new Set(filteredClasses.map(c => c.id)) : null;
  const visibleAssignments = periodClassIds
    ? assignments.filter(a => a.classId ? periodClassIds.has(a.classId) : false) : assignments;

  return {
    isAcademy, isAdmin, isTeacher, canManage: isAcademy || isTeacher || isAdmin,
    classes, assignments, setAssignments, loading,
    deletingAssignmentId, setDeletingAssignmentId, glowId, highlightRef,
    selectedClassId, setSelectedClassId, selectedClassForCreate, setSelectedClassForCreate,
    selectedLessonForCreate, setSelectedLessonForCreate,
    selectedTopicForCreate, setSelectedTopicForCreate,
    academyName, paymentStatus, userEmail,
    showCreateModal, setShowCreateModal, showEditModal, setShowEditModal,
    showSubmissionsModal, setShowSubmissionsModal, showGradeModal, setShowGradeModal,
    selectedAssignment, setSelectedAssignment,
    editTitle, setEditTitle, editDescription, setEditDescription, editDueDate, setEditDueDate,
    editUploadFiles, setEditUploadFiles, editQuizQuestions, setEditQuizQuestions, updating, setUpdating,
    editClassId, setEditClassId, editTopicId, setEditTopicId, editLessonId, setEditLessonId,
    submissions, setSubmissions, selectedSubmission, setSelectedSubmission,
    newTitle, setNewTitle, newDescription, setNewDescription, newDueDate, setNewDueDate,
    uploadFiles, setUploadFiles, uploadProgress, setUploadProgress,
    gradeScore, setGradeScore, gradeFeedback, setGradeFeedback, creating, setCreating,
    requireGrading, uploadingSolutionId, setUploadingSolutionId,
    solutionFileRef, solutionAssignmentRef,
    assignmentType, setAssignmentType, quizQuestions, setQuizQuestions,
    academies, selectedAcademy, setSelectedAcademy, selectedClass, setSelectedClass,
    filteredClasses, visibleAssignments, loadAcademyAssignments,
  };
}

export type AssignmentsDataReturn = ReturnType<typeof useAssignmentsData>;
