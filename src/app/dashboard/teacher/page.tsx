'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { apiClient } from '@/lib/api-client';
import confetti from 'canvas-confetti';
import { SkeletonDashboard } from '@/components/ui/SkeletonLoader';
import { useTeacherDashboard } from '@/hooks/useTeacherDashboard';
import { TeacherDashboardHeader } from './components/TeacherDashboardHeader';
import { JoinAcademyPrompt } from './components/JoinAcademyPrompt';
import { BrowseAcademies } from './components/BrowseAcademies';
import { DashboardChartsGrid } from './components/DashboardChartsGrid';

export default function TeacherDashboard() {
  const {
    memberships,
    availableAcademies,
    classes,
    enrolledStudents,
    pendingEnrollments,
    ratingsData,
    academyName,
    loading,
    rejectedCount,
    streamStats,
    classWatchTime,
    paymentStatusCounts,
    setPaymentStatusCounts,
    loadData,
  } = useTeacherDashboard();

  const [showBrowse, setShowBrowse] = useState(false);
  const [selectedClass, setSelectedClass] = useState('all');
  const paymentInitRef = useRef(true); // skip first fire after initial load

  // Confetti for new registrations
  useEffect(() => {
    if (sessionStorage.getItem('akademo_new_user')) {
      sessionStorage.removeItem('akademo_new_user');
      setTimeout(() => {
        const end = Date.now() + 3 * 1000;
        const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"];
        const frame = () => {
          if (Date.now() > end) return;
          confetti({ particleCount: 2, angle: 60, spread: 55, startVelocity: 60, origin: { x: 0, y: 0.5 }, colors });
          confetti({ particleCount: 2, angle: 120, spread: 55, startVelocity: 60, origin: { x: 1, y: 0.5 }, colors });
          requestAnimationFrame(frame);
        };
        frame();
      }, 600);
    }
  }, []);

  // Re-fetch payment status counts when class filter changes
  useEffect(() => {
    if (paymentInitRef.current) { paymentInitRef.current = false; return; }
    const url = selectedClass === 'all'
      ? '/enrollments/payment-status'
      : `/enrollments/payment-status?classId=${selectedClass}`;
    apiClient(url).then(r => r.json()).then(result => {
      if (result.success && result.data) {
        setPaymentStatusCounts({
          alDia: result.data.alDia || 0,
          atrasados: result.data.atrasados || 0,
          uniqueAlDia: result.data.uniqueAlDia || 0,
          uniqueAtrasados: result.data.uniqueAtrasados || 0,
        });
      }
    }).catch(() => {/* silent */});
  }, [selectedClass, setPaymentStatusCounts]);

  const handleRequestMembership = async (academyId: string) => {
    try {
      const response = await apiClient('/requests/teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ academyId }),
      });

      const result = await response.json();

      if (result.success) {
        alert('Request sent to academy!');
        setShowBrowse(false);
        loadData();
      } else {
        alert(result.error || 'Failed to send request');
      }
    } catch (error) {
      alert('An error occurred');
    }
  };

  const approvedMemberships = memberships.filter(m => m.status === 'APPROVED');
  const hasAcademy = approvedMemberships.length > 0;

  const filteredStudents = useMemo(() => {
    if (selectedClass === 'all') return enrolledStudents;
    return enrolledStudents.filter(s => s.classId === selectedClass);
  }, [enrolledStudents, selectedClass]);

  const shouldShowJoinPrompt = !hasAcademy && !showBrowse && memberships.length === 0;

  if (loading) {
    return <SkeletonDashboard />;
  }

  if (shouldShowJoinPrompt) {
    return <JoinAcademyPrompt onBrowse={() => setShowBrowse(true)} />;
  }

  if (showBrowse) {
    return (
      <BrowseAcademies
        academies={availableAcademies}
        memberships={memberships}
        onBack={() => setShowBrowse(false)}
        onRequest={handleRequestMembership}
      />
    );
  }

  return (
    <div className="w-full space-y-6">
      <TeacherDashboardHeader
        academyName={academyName}
        hasAcademy={hasAcademy}
        classes={classes}
        selectedClass={selectedClass}
        onClassChange={setSelectedClass}
      />

      <DashboardChartsGrid
        filteredStudents={filteredStudents}
        streamStats={streamStats}
        classWatchTime={classWatchTime}
        ratingsData={ratingsData}
        selectedClass={selectedClass}
        paymentStatusCounts={paymentStatusCounts}
      />
    </div>
  );
}
