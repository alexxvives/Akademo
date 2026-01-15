'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { ErrorBoundary } from '@/components/ui';

export default function TeacherDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <DashboardLayout role="TEACHER">{children}</DashboardLayout>
    </ErrorBoundary>
  );
}
