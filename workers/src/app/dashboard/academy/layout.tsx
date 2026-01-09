'use client';

import DashboardLayout from '@/components/DashboardLayout';

export default function AcademyDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout role="ACADEMY">{children}</DashboardLayout>;
}
