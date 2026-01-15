'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { ErrorBoundary } from '@/components/ui';

export default function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <DashboardLayout role="STUDENT">{children}</DashboardLayout>
    </ErrorBoundary>
  );
}
