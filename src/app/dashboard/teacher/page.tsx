'use client';

import { useState, useMemo } from 'react';
import { apiClient } from '@/lib/api-client';
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
    loadData,
  } = useTeacherDashboard();

  const [showBrowse, setShowBrowse] = useState(false);
  const [selectedClass, setSelectedClass] = useState('all');

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
        pendingEnrollments={pendingEnrollments}
        rejectedCount={rejectedCount}
        streamStats={streamStats}
        classWatchTime={classWatchTime}
        ratingsData={ratingsData}
        selectedClass={selectedClass}
        paymentStatusCounts={paymentStatusCounts}
      />
    </div>
  );
}
