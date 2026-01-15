'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { ErrorBoundary } from '@/components/ui';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <DashboardLayout role="ADMIN">{children}</DashboardLayout>
    </ErrorBoundary>
  );
}
