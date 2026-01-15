'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { ErrorBoundary } from '@/components/ui';

export default function AcademyDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <DashboardLayout role="ACADEMY">{children}</DashboardLayout>
    </ErrorBoundary>
  );
}
