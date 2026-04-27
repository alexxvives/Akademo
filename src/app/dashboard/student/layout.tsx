'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { ErrorBoundary } from '@/components/ui';
import { StudentTutorial } from '@/components/student/StudentTutorial';

export default function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <DashboardLayout role="STUDENT">{children}</DashboardLayout>
      <StudentTutorial />
    </ErrorBoundary>
  );
}
