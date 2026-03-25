'use client';

import { useEffect, useState, useMemo } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { NotificationPanel } from '@/components/layout/NotificationPanel';
import { DemoDataBanner } from '@/components/academy/DemoDataBanner';
import { DemoBanner } from '@/components/shared/DemoBanner';
import { PeriodProvider } from '@/contexts/PeriodContext';
import { apiClient } from '@/lib/api-client';
import type { DashboardLayoutProps } from './types';
import { useDashboardAuth } from './use-dashboard-auth';
import { useDashboardBadges } from './use-dashboard-badges';
import { getMenuItems, getFilteredMenuItems } from './get-menu-items';
import { SuspicionModal } from './SuspicionModal';
import { LoadingSkeleton } from './LoadingSkeleton';
import { MobileHeader } from './MobileHeader';

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const {
    user, loading, showSuspicionWarning, setShowSuspicionWarning,
    handleLogout, checkSession, checkAuth,
  } = useDashboardAuth(role);

  const {
    notifications, unreadCount, activeStreams,
    pendingPaymentsCount, unreadValoracionesCount, ungradedAssignmentsCount,
    newSubmissionsCount, newGradesCount, unpaidClassesCount, studentPendingPaymentsCount,
    academyId, academyPaymentStatus, academy,
    loadNotifications, loadActiveStreams, loadAcademy,
    loadUnreadValoraciones, loadUngradedAssignments,
    loadNewGrades, loadUnpaidClasses, loadStudentPendingPayments, loadPendingPaymentsCount,
    markNotificationAsRead, joinLiveClass, markAllAsRead,
  } = useDashboardBadges();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    checkAuth();

    if (role === 'STUDENT') {
      if (sessionStorage.getItem('akademo_suspicion_warning')) {
        sessionStorage.removeItem('akademo_suspicion_warning');
        setShowSuspicionWarning(true);
      }
      apiClient('/auth/session/check', { method: 'POST' });
      const interval = setInterval(checkSession, 3000);
      loadActiveStreams();
      const streamInterval = setInterval(loadActiveStreams, 10000);
      loadNewGrades();
      const gradesInterval = setInterval(loadNewGrades, 15000);
      loadUnpaidClasses();
      loadStudentPendingPayments();
      const paymentsInterval = setInterval(loadStudentPendingPayments, 15000);
      return () => {
        clearInterval(interval);
        clearInterval(streamInterval);
        clearInterval(gradesInterval);
        clearInterval(paymentsInterval);
      };
    }

    if (role === 'ACADEMY') {
      loadAcademy().then((status) => {
        loadUnreadValoraciones(status);
        loadUngradedAssignments(status);
      });
      loadActiveStreams();
      const academyInterval = setInterval(() => {
        loadAcademy().then((status) => {
          loadUnreadValoraciones(status);
          loadUngradedAssignments(status);
        });
        loadActiveStreams();
      }, 15000);
      return () => clearInterval(academyInterval);
    }

    if (role === 'TEACHER') {
      loadUnreadValoraciones();
      loadUngradedAssignments();
      loadActiveStreams();
      const teacherInterval = setInterval(() => {
        loadUnreadValoraciones();
        loadUngradedAssignments();
        loadActiveStreams();
      }, 15000);
      return () => clearInterval(teacherInterval);
    }

    if (role === 'ADMIN') {
      loadActiveStreams();
      loadUnreadValoraciones();
      loadUngradedAssignments();
      loadPendingPaymentsCount();
      const adminInterval = setInterval(() => {
        loadActiveStreams();
        loadUnreadValoraciones();
        loadUngradedAssignments();
        loadPendingPaymentsCount();
      }, 15000);
      return () => clearInterval(adminInterval);
    }
  }, [checkAuth, checkSession, role, loadNotifications, loadActiveStreams, loadAcademy, loadUnreadValoraciones, loadUngradedAssignments, loadNewGrades, loadStudentPendingPayments, loadUnpaidClasses, loadPendingPaymentsCount]);

  const copyJoinLink = () => {
    if (!user) return;
    const link = `${window.location.origin}/join/${user.id}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const copyAcademyJoinLink = () => {
    if (!academyId) return;
    const link = `${window.location.origin}/join/academy/${academyId}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const menuItems = useMemo(() => {
    const items = getMenuItems({
      role, academy, unreadValoracionesCount, ungradedAssignmentsCount,
      activeStreams, unpaidClassesCount, newGradesCount,
      pendingPaymentsCount, newSubmissionsCount, studentPendingPaymentsCount,
    });
    return getFilteredMenuItems(items, academy);
  }, [role, academy, unreadValoracionesCount, ungradedAssignmentsCount,
    activeStreams, unpaidClassesCount, newGradesCount,
    pendingPaymentsCount, newSubmissionsCount, studentPendingPaymentsCount]);

  if (loading) return <LoadingSkeleton />;

  return (
    <PeriodProvider role={role}>
    <div className="h-[100dvh] flex flex-col bg-gray-50">
      {role !== 'ADMIN' && <DemoBanner userEmail={user?.email} />}
      {(role === 'ACADEMY' && academyPaymentStatus === 'NOT PAID' && !user?.email?.toLowerCase().includes("demo")) && (
        <DemoDataBanner />
      )}
      <div className="dashboard-layout flex-1 flex overflow-hidden">
      <Sidebar
        role={role}
        menuItems={menuItems}
        academyId={academyId}
        linkCopied={linkCopied}
        onCopyJoinLink={copyJoinLink}
        onCopyAcademyLink={copyAcademyJoinLink}
        onLogout={handleLogout}
        user={user}
        academyPaymentStatus={academyPaymentStatus}
      />
      <MobileSidebar
        isOpen={mobileMenuOpen}
        role={role}
        menuItems={menuItems}
        linkCopied={linkCopied}
        onClose={() => setMobileMenuOpen(false)}
        onCopyJoinLink={copyJoinLink}
        onCopyAcademyLink={copyAcademyJoinLink}
        onLogout={handleLogout}
        user={user}
        academyPaymentStatus={academyPaymentStatus}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <MobileHeader
          role={role}
          unreadCount={unreadCount}
          showNotifications={showNotifications}
          onToggleNotifications={() => setShowNotifications(!showNotifications)}
          onOpenMenu={() => setMobileMenuOpen(true)}
        />
        {role === 'STUDENT' && showNotifications && (
          <NotificationPanel
            notifications={notifications}
            unreadCount={unreadCount}
            onClose={() => setShowNotifications(false)}
            onMarkAsRead={markNotificationAsRead}
            onMarkAllAsRead={markAllAsRead}
            onJoinLiveClass={joinLiveClass}
          />
        )}
        <main className="flex-1 overflow-y-auto bg-gray-100 overscroll-contain">
          <div className="pt-4 pb-2 px-4 md:py-8 md:px-10 lg:py-12 lg:pl-20 lg:pr-20">
            {children}
          </div>
        </main>
      </div>
      </div>
    </div>
      {showSuspicionWarning && (
        <SuspicionModal onClose={() => setShowSuspicionWarning(false)} />
      )}
    </PeriodProvider>
  );
}
