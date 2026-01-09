'use client';

import DashboardLayout from '@/components/DashboardLayout';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout role="ADMIN">{children}</DashboardLayout>;
}
