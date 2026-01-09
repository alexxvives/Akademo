'use client';

import DashboardLayout from '@/components/DashboardLayout';

export default function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout role="STUDENT">{children}</DashboardLayout>;
}
