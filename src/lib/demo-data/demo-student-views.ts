import { DEMO_VIDEO_GUID } from './types';
import { generateDemoAssignments } from './demo-assignments';
import { generateDemoClasses, generateDemoLessons } from './demo-classes';

export interface DemoStudentAssignment {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  maxScore: number;
  attachmentName?: string;
  attachmentIds?: string;
  submittedAt?: string;
  score?: number;
  feedback?: string;
  gradedAt?: string;
  createdAt: string;
  className?: string;
  classId?: string;
  submissionUploadId?: string;
  submissionStoragePath?: string;
}

export function generateDemoStudentAssignments(): DemoStudentAssignment[] {
  const assignments = generateDemoAssignments();

  const studentAssignments: DemoStudentAssignment[] = assignments.map((a) => {
    const base: DemoStudentAssignment = {
      id: a.id,
      title: a.title,
      description: a.description,
      dueDate: a.dueDate,
      maxScore: a.maxScore,
      attachmentName: a.attachmentName,
      attachmentIds: a.attachmentIds,
      createdAt: a.createdAt,
      className: a.className,
      classId: a.classId,
    };

    switch (a.id) {
      case 'demo-a1':
        return { ...base, submittedAt: new Date(Date.UTC(2026, 1, 14, 18, 30)).toISOString(), score: 92, feedback: '¡Excelente trabajo con los componentes!', gradedAt: new Date(Date.UTC(2026, 1, 16, 10, 0)).toISOString(), submissionUploadId: 'demo-sub-s1', submissionStoragePath: 'demo/submissions/componente_react.pdf' };
      case 'demo-a2':
        return { ...base, submittedAt: new Date(Date.UTC(2026, 1, 19, 20, 15)).toISOString(), submissionUploadId: 'demo-sub-s2', submissionStoragePath: 'demo/submissions/hooks_estado.pdf' };
      case 'demo-a4':
        return { ...base, submittedAt: new Date(Date.UTC(2026, 1, 16, 14, 45)).toISOString(), score: 85, feedback: 'Buen manejo de derivadas, revisa el ejercicio 3', gradedAt: new Date(Date.UTC(2026, 1, 18, 9, 30)).toISOString(), submissionUploadId: 'demo-sub-s3', submissionStoragePath: 'demo/submissions/derivadas.pdf' };
      case 'demo-a5':
        return { ...base, submittedAt: new Date(Date.UTC(2026, 1, 21, 22, 0)).toISOString(), submissionUploadId: 'demo-sub-s4', submissionStoragePath: 'demo/submissions/integrales.pdf' };
      case 'demo-a6':
        return { ...base, submittedAt: new Date(Date.UTC(2026, 1, 15, 11, 20)).toISOString(), score: 95, feedback: '¡Fantástico diseño de logo!', gradedAt: new Date(Date.UTC(2026, 1, 17, 14, 0)).toISOString(), submissionUploadId: 'demo-sub-s5', submissionStoragePath: 'demo/submissions/logo_design.pdf' };
      case 'demo-a7':
        return { ...base, submittedAt: new Date(Date.UTC(2026, 1, 18, 16, 30)).toISOString(), score: 78, feedback: 'Buena composición, mejora el contraste', gradedAt: new Date(Date.UTC(2026, 1, 20, 11, 45)).toISOString(), submissionUploadId: 'demo-sub-s6', submissionStoragePath: 'demo/submissions/tipografia.pdf' };
      case 'demo-a9':
        return { ...base, submittedAt: new Date(Date.UTC(2026, 1, 17, 19, 0)).toISOString(), score: 88, feedback: 'Muy bien resuelto, excelente comprensión', gradedAt: new Date(Date.UTC(2026, 1, 19, 15, 30)).toISOString(), submissionUploadId: 'demo-sub-s7', submissionStoragePath: 'demo/submissions/schrodinger.pdf' };
      default:
        return base;
    }
  });

  return studentAssignments;
}

// ============================================
// STUDENT ENROLLED CLASSES (for student demo)
// ============================================

export interface DemoStudentEnrolledClass {
  id: string;
  slug?: string;
  name: string;
  description?: string;
  academyName: string;
  teacherFirstName: string;
  teacherLastName: string;
  videoCount: number;
  documentCount: number;
  lessonCount: number;
  studentCount: number;
  createdAt: string;
  startDate?: string;
  enrollmentStatus: 'APPROVED';
  documentSigned: number;
  whatsappGroupLink?: string;
  paymentStatus: string;
  paymentMethod: string;
  monthlyPrice?: number | null;
  oneTimePrice?: number | null;
  maxStudents?: number | null;
}

export function generateDemoStudentEnrolledClasses(): DemoStudentEnrolledClass[] {
  const demoClasses = generateDemoClasses();
  const demoLessons = generateDemoLessons();

  return demoClasses.map(c => {
    const classLessons = demoLessons.filter(l => l.classId === c.id);
    const teacherParts = c.teacherName.split(' ');
    return {
      id: c.id,
      slug: c.name.toLowerCase().replace(/\s+/g, '-'),
      name: c.name,
      description: c.description,
      academyName: 'Academia Demo',
      teacherFirstName: teacherParts[0],
      teacherLastName: teacherParts.slice(1).join(' '),
      videoCount: c.videoCount,
      documentCount: c.documentCount,
      lessonCount: classLessons.length,
      studentCount: c.studentCount,
      createdAt: c.createdAt,
      startDate: c.startDate,
      enrollmentStatus: 'APPROVED',
      documentSigned: 1,
      whatsappGroupLink: c.whatsappGroupLink || undefined,
      paymentStatus: 'PAID',
      paymentMethod: 'stripe',
      monthlyPrice: c.monthlyPrice,
      oneTimePrice: c.oneTimePrice,
      maxStudents: c.maxStudents,
    };
  });
}

// ============================================
// STUDENT CLASS DETAIL (lessons with videos for student view)
// ============================================

export interface DemoStudentLesson {
  id: string;
  title: string;
  description: string | null;
  releaseDate: string;
  topicId: string | null;
  topicName?: string;
  maxWatchTimeMultiplier: number;
  watermarkIntervalMins: number;
  videos: Array<{
    id: string;
    title: string;
    description: string | null;
    durationSeconds: number | null;
    bunnyGuid: string;
    playStates: Array<{
      totalWatchTimeSeconds: number;
      sessionStartTime: string | null;
    }>;
    upload: {
      storageType: string;
      bunnyGuid: string;
      storagePath: string;
    };
  }>;
  documents: Array<{
    id: string;
    title: string;
    description: string | null;
    upload: {
      fileName: string;
      storagePath: string;
      mimeType: string;
    };
  }>;
  firstVideoBunnyGuid?: string;
  videoCount: number;
  documentCount: number;
  totalVideoDuration: number;
  totalWatchedSeconds: number;
}

export function generateDemoStudentLessons(classId: string): DemoStudentLesson[] {
  const allLessons = generateDemoLessons();
  const classLessons = allLessons.filter(l => l.classId === classId);

  return classLessons.map((lesson, idx) => ({
    id: lesson.id,
    title: lesson.title,
    description: `Lección ${idx + 1} del curso`,
    releaseDate: new Date(Date.now() - (30 - idx * 5) * 24 * 60 * 60 * 1000).toISOString(),
    topicId: null,
    maxWatchTimeMultiplier: 3,
    watermarkIntervalMins: 5,
    videos: [
      {
        id: `${lesson.id}-v1`,
        title: lesson.title,
        description: null,
        durationSeconds: lesson.duration,
        bunnyGuid: DEMO_VIDEO_GUID,
        playStates: [
          {
            totalWatchTimeSeconds: Math.floor(Math.random() * lesson.duration * 0.8),
            sessionStartTime: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000).toISOString(),
          },
        ],
        upload: {
          storageType: 'bunny',
          bunnyGuid: DEMO_VIDEO_GUID,
          storagePath: `demo/videos/${lesson.id}.mp4`,
        },
      },
    ],
    documents: (lesson.documents || []).map((doc, dIdx) => ({
      id: `${lesson.id}-d${dIdx + 1}`,
      title: doc.title,
      description: null,
      upload: {
        fileName: `${doc.title}.pdf`,
        storagePath: doc.url,
        mimeType: 'application/pdf',
      },
    })),
    firstVideoBunnyGuid: DEMO_VIDEO_GUID,
    videoCount: 1,
    documentCount: (lesson.documents || []).length,
    totalVideoDuration: lesson.duration,
    totalWatchedSeconds: Math.floor(Math.random() * lesson.duration * 0.6),
  }));
}
