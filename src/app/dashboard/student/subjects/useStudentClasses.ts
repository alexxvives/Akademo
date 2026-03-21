'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import { apiClient } from '@/lib/api-client';
import { generateDemoStudentEnrolledClasses } from '@/lib/demo-data';
import type { EnrolledClass, ActiveStream } from './types';

export function useStudentClasses() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>([]);
  const [activeStreams, setActiveStreams] = useState<ActiveStream[]>([]);
  const [academyName, setAcademyName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [signingClass, setSigningClass] = useState<EnrolledClass | null>(null);
  const [viewingDocClass, setViewingDocClass] = useState<EnrolledClass | null>(null);
  const [payingClass, setPayingClass] = useState<EnrolledClass | null>(null);

  // When returning from Stripe checkout, verify the payment before loading data
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const classId = searchParams.get('classId');
    const payment = searchParams.get('payment');

    if (payment === 'success' && sessionId && classId) {
      setVerifying(true);
      apiClient(`/payments/stripe-verify?session_id=${encodeURIComponent(sessionId)}&classId=${encodeURIComponent(classId)}`)
        .then(res => res.json())
        .then(() => {
          router.replace('/dashboard/student/subjects');
          loadData();
        })
        .catch(() => loadData())
        .finally(() => setVerifying(false));
    } else {
      loadData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Confetti + streams polling
  useEffect(() => {
    if (sessionStorage.getItem('akademo_new_user')) {
      sessionStorage.removeItem('akademo_new_user');
      setTimeout(() => {
        confetti({ particleCount: 180, spread: 100, origin: { y: 0.55 } });
        setTimeout(() => confetti({ particleCount: 80, spread: 120, origin: { x: 0.1, y: 0.6 } }), 200);
        setTimeout(() => confetti({ particleCount: 80, spread: 120, origin: { x: 0.9, y: 0.6 } }), 400);
      }, 600);
    }

    const pollActiveStreams = () => {
      apiClient('/live/active')
        .then(res => res.json())
        .then(result => {
          if (result.success && Array.isArray(result.data)) {
            setActiveStreams(result.data);
          }
        })
        .catch(err => console.error('Failed to check streams:', err));
    };

    pollActiveStreams();
    const interval = setInterval(pollActiveStreams, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const academiesRes = await apiClient('/academies');
      const academiesResult = await academiesRes.json();

      if (academiesResult.success && Array.isArray(academiesResult.data) && academiesResult.data.length > 0) {
        const academy = academiesResult.data[0];
        if (academy.paymentStatus === 'NOT PAID') {
          const demoClasses = generateDemoStudentEnrolledClasses();
          setEnrolledClasses(demoClasses.map(c => ({
            ...c,
            monthlyPrice: c.monthlyPrice ?? undefined,
            oneTimePrice: c.oneTimePrice ?? undefined,
            maxStudents: c.maxStudents ?? undefined,
          })));
          setAcademyName('Academia Demo');
          setLoading(false);
          return;
        }
      }

      const classesRes = await apiClient('/classes');
      const classesResult = await classesRes.json();

      if (classesResult.success && Array.isArray(classesResult.data)) {
        const classes = classesResult.data.map((c: { id: string; slug?: string; name: string; description?: string; academyName?: string; teacherFirstName?: string; teacherLastName?: string; videoCount?: number; documentCount?: number; lessonCount?: number; studentCount?: number; createdAt: string; startDate?: string; enrollmentStatus?: string; documentSigned?: number; whatsappGroupLink?: string; paymentStatus?: string; paymentMethod?: string; price?: number; currency?: string; allowMonthly?: number; allowOneTime?: number; monthlyPrice?: number; oneTimePrice?: number; maxStudents?: number; firstPaymentAmount?: number; missedCycles?: number; university?: string | null; carrera?: string | null }) => ({
          id: c.id,
          slug: c.slug,
          name: c.name,
          description: c.description,
          academyName: c.academyName || 'Academia',
          teacherFirstName: c.teacherFirstName,
          teacherLastName: c.teacherLastName,
          videoCount: c.videoCount || 0,
          documentCount: c.documentCount || 0,
          lessonCount: c.lessonCount || 0,
          studentCount: c.studentCount || 0,
          createdAt: c.createdAt,
          startDate: c.startDate,
          enrollmentStatus: c.enrollmentStatus || 'APPROVED',
          documentSigned: c.documentSigned ?? 0,
          whatsappGroupLink: c.whatsappGroupLink,
          paymentStatus: c.paymentStatus || 'PENDING',
          paymentMethod: c.paymentMethod || '',
          monthlyPrice: c.monthlyPrice ?? null,
          oneTimePrice: c.oneTimePrice ?? null,
          maxStudents: c.maxStudents,
          firstPaymentAmount: c.firstPaymentAmount,
          missedCycles: c.missedCycles,
          university: c.university,
          carrera: c.carrera,
        }));
        setEnrolledClasses(classes);
        if (classes.length > 0) {
          setAcademyName(classes[0].academyName);
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClassClick = (classItem: EnrolledClass, e: React.MouseEvent) => {
    if (!classItem.documentSigned) {
      e.preventDefault();
      setSigningClass(classItem);
      return;
    }
    if (classItem.paymentStatus !== 'PAID' && classItem.paymentStatus !== 'COMPLETED') {
      e.preventDefault();
      setPayingClass(classItem);
      return;
    }
    setLoading(true);
    router.push(`/dashboard/student/subject/${classItem.slug || classItem.id}`);
  };

  const handleSign = async () => {
    if (!signingClass) return;

    const res = await apiClient('/enrollments/sign-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId: signingClass.id }),
    });
    const result = await res.json();

    if (result.success) {
      const updatedClass = { ...signingClass, documentSigned: 1 };
      setEnrolledClasses(prev =>
        prev.map(c => c.id === signingClass.id ? updatedClass : c)
      );
      setSigningClass(null);

      if (updatedClass.paymentStatus !== 'PAID') {
        setPayingClass(updatedClass);
      } else {
        router.push(`/dashboard/student/subject/${updatedClass.slug || updatedClass.id}`);
      }
    } else {
      throw new Error(result.error || 'Failed to sign document');
    }
  };

  return {
    enrolledClasses,
    activeStreams,
    academyName,
    loading,
    verifying,
    signingClass,
    setSigningClass,
    viewingDocClass,
    setViewingDocClass,
    payingClass,
    setPayingClass,
    handleClassClick,
    handleSign,
    loadData,
  };
}
