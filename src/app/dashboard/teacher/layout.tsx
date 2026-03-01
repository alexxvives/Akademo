'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { ErrorBoundary } from '@/components/ui';
import { TeacherTutorial } from '@/components/teacher/TeacherTutorial';

export default function TeacherDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <DashboardLayout role="TEACHER">
        {children}
        <TeacherTutorial />
      </DashboardLayout>
    </ErrorBoundary>
  );
}
