'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { apiClient } from '@/lib/api-client';
import { generateDemoPendingPayments } from '@/lib/demo-data';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { NotificationPanel } from '@/components/layout/NotificationPanel';
import { DemoDataBanner } from '@/components/academy/DemoDataBanner';
import { DemoBanner } from '@/components/shared/DemoBanner';
import { LordIconCalendar } from '@/components/ui/LordIconCalendar';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  monoacademy?: boolean;
  linkedUserId?: string | null;
}

interface MenuItem {
  label: string;
  href: string;
  icon?: JSX.Element;
  iconType?: 'chart' | 'book' | 'userPlus' | 'message' | 'clap' | 'fileText' | 'clipboard' | 'activity' | 'users' | 'botMessage' | 'handCoins' | 'star';
  badge?: number;
  badgeColor?: string;
  matchPaths?: string[];
  showPulse?: boolean;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: {
    classId?: string;
    liveStreamId?: string;
    zoomLink?: string;
    className?: string;
    teacherName?: string;
  } | null;
  isRead: boolean;
  createdAt: string;
}

interface ActiveStream {
  id: string;
  classId: string;
  title: string;
  zoomLink: string;
  status: string;
  className: string;
  teacherName: string;
}

interface Academy {
  id: string;
  paymentStatus?: string | null;
  feedbackEnabled?: number | null;
  hiddenMenuItems?: string | null;
  requireGrading?: number | null;
}

export default function DashboardLayout({
  children,
  role,
}: {
  children: React.ReactNode;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'ACADEMY';
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  
  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Active streams state for students
  const [activeStreams, setActiveStreams] = useState<ActiveStream[]>([]);
  
  // Pending payments count for academy (cash/bizum awaiting approval)
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
  
  // Unread valoraciones count for teacher/academy
  const [unreadValoracionesCount, setUnreadValoracionesCount] = useState(0);
  
  // Ungraded assignments count for teacher/academy
  const [ungradedAssignmentsCount, setUngradedAssignmentsCount] = useState(0);
  
  // New submissions count (not yet downloaded) for academy
  const [newSubmissionsCount, setNewSubmissionsCount] = useState(0);
  
  // New grades available count for student
  const [newGradesCount, setNewGradesCount] = useState(0);
  
  // Unpaid classes count for student sidebar badge
  const [unpaidClassesCount, setUnpaidClassesCount] = useState(0);
  
  // Academy state for academy join link and feedbackEnabled
  const [academyId, setAcademyId] = useState<string | null>(null);
  const [academyPaymentStatus, setAcademyPaymentStatus] = useState<string | null>(null);
  const [academy, setAcademy] = useState<Academy | null>(null);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await apiClient('/notifications?unread=true');
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setNotifications(result.data);
        const newCount = result.data.filter((n: Notification) => !n.isRead).length;
        setUnreadCount(newCount);
      }
      // On failure, keep previous count to avoid flickering
    } catch (error) {
      // Silently keep previous state - don't reset count on network errors
      console.error('Failed to load notifications:', error);
    }
  }, []);

  const loadActiveStreams = useCallback(async () => {
    try {
      const response = await apiClient('/live/active');
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setActiveStreams(result.data);
      }
    } catch (error) {
      console.error('Failed to load active streams:', error);
    }
  }, []);

  const loadAcademy = useCallback(async (): Promise<string> => {
    try {
      const academyResponse = await apiClient('/academies');
      const result = await academyResponse.json();
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        const academyData: Academy = result.data[0];
        setAcademyId(academyData.id);
        const paymentStatus = academyData.paymentStatus || 'PAID';
        setAcademyPaymentStatus(paymentStatus);
        setAcademy(academyData);
        
        // Load pending payments count for badge
        if (paymentStatus === 'NOT PAID') {
          // Demo mode: dynamic count from generateDemoPendingPayments()
          setPendingPaymentsCount(generateDemoPendingPayments().length);
        } else {
          // Real mode: query database
          const pendingRes = await apiClient('/payments/pending-count');
          const pendingResult = await pendingRes.json();
          if (pendingResult.success && typeof pendingResult.data === 'number') {
            setPendingPaymentsCount(pendingResult.data);
          }
        }
        return paymentStatus;
      }
    } catch (error) {
      console.error('Failed to load academy:', error);
    }
    return 'PAID';
  }, []);

  // Listen for payment changes and update badge immediately
  useEffect(() => {
    const handlePaymentChange = () => {
      loadAcademy();
    };
    window.addEventListener('pendingPaymentsChanged', handlePaymentChange);
    return () => window.removeEventListener('pendingPaymentsChanged', handlePaymentChange);
  }, [loadAcademy]);

  // Listen for feedback toggle to update academy state and sidebar immediately
  useEffect(() => {
    const handleFeedbackToggle = () => {
      loadAcademy();
    };
    window.addEventListener('feedbackToggled', handleFeedbackToggle);
    return () => window.removeEventListener('feedbackToggled', handleFeedbackToggle);
  }, [loadAcademy]);

  const loadUnreadValoraciones = useCallback(async (overridePaymentStatus?: string) => {
    try {
      const status = overridePaymentStatus || academyPaymentStatus;
      // Show demo unread count if NOT PAID
      if (status === 'NOT PAID') {
        setUnreadValoracionesCount(12); // 12 unread out of 35 total ratings in demo data
        return;
      }
      
      // If PAID or real unpaid academy, load real count
      const response = await apiClient('/lessons/ratings/unread-count');
      const result = await response.json();
      if (result.success && result.data) {
        setUnreadValoracionesCount(result.data.count || 0);
      }
    } catch (error) {
      console.error('Failed to load unread valoraciones:', error);
    }
  }, [academyPaymentStatus]);
  
  const loadUngradedAssignments = useCallback(async (overridePaymentStatus?: string) => {
    try {
      const status = overridePaymentStatus || academyPaymentStatus;
      // Show demo counts if NOT PAID
      if (status === 'NOT PAID') {
        // Demo mode: count actual ungraded demo submissions
        const { countTotalNewDemoSubmissions, countTotalUngradedDemoSubmissions } = await import('@/lib/demo-data');
        const newCount = countTotalNewDemoSubmissions();
        const ungradedCount = countTotalUngradedDemoSubmissions();
        setNewSubmissionsCount(newCount);
        setUngradedAssignmentsCount(ungradedCount);
        return;
      }
      
      // If PAID or real unpaid academy, load real count from API
      const response = await apiClient('/assignments/ungraded-count');
      const result = await response.json();
      if (result.success && typeof result.data === 'number') {
        setUngradedAssignmentsCount(result.data);
      }
    } catch (error) {
      console.error('Failed to load ungraded assignments:', error);
    }
  }, [academyPaymentStatus]);

  const handleLogout = useCallback(async () => {
    // Check if there's an active upload
    if (typeof window !== 'undefined' && (window as { akademoUploading?: boolean }).akademoUploading) {
      const confirmLogout = window.confirm(
        '⚠️ ADVERTENCIA: Hay un video subiendo. Si cierras sesión, se cancelará la subida.\n\n¿Estás seguro de que quieres cerrar sesión?'
      );
      if (!confirmLogout) {
        return;
      }
    }
    await apiClient('/auth/logout', { method: 'POST' });
    router.push('/');
  }, [router]);

  const checkSession = useCallback(async () => {
    try {
      const response = await apiClient('/auth/session/check', { method: 'POST' });
      const result = await response.json();

      if (!result.success || !result.data?.id) {
        if (result.data?.message) {
          alert(result.data.message);
        }
        handleLogout();
      }
    } catch (error) {
      console.error('Session check error:', error);
    }
  }, [handleLogout]);

  const checkAuth = useCallback(async () => {
    try {
      const response = await apiClient('/auth/me');
      const result = await response.json();

      if (result.success && result.data) {
        const userRole = result.data.role;

        const hasAccess = 
          userRole === role || 
          (userRole === 'ACADEMY' && role === 'TEACHER') ||
          userRole === 'ADMIN';

        if (hasAccess) {
          setUser(result.data);
        } else {
          router.push('/?modal=login');
        }
      } else {
        router.push('/?modal=login');
      }
    } catch {
      router.push('/?modal=login');
    } finally {
      setLoading(false);
    }
  }, [role, router]);
  
  const loadNewGrades = useCallback(async () => {
    try {
      const response = await apiClient('/assignments/new-grades-count');
      const result = await response.json();
      if (result.success && typeof result.data === 'number') {
        setNewGradesCount(result.data);
      }
    } catch (error) {
      console.error('Failed to load new grades:', error);
    }
  }, []);

  const loadUnpaidClasses = useCallback(async () => {
    try {
      const response = await apiClient('/classes');
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        // Count classes where the student still needs to take action (no payment submitted yet)
        const needsAction = result.data.filter((c: { paymentStatus?: string | null }) => 
          !c.paymentStatus
        );
        setUnpaidClassesCount(needsAction.length);
      }
    } catch (error) {
      console.error('Failed to load unpaid classes:', error);
    }
  }, []);

  useEffect(() => {
    checkAuth();
    
    if (role === 'STUDENT') {
      // Create initial device session
      apiClient('/auth/session/check', { method: 'POST' });
      // Then check every 10 seconds for faster logout detection
      const interval = setInterval(checkSession, 10000);
      
      // Load notifications and poll for new ones
      loadNotifications();
      const notificationInterval = setInterval(loadNotifications, 15000);
      
      // Load active streams and poll for updates
      loadActiveStreams();
      const streamInterval = setInterval(loadActiveStreams, 10000);
      
      // Load new grades count and poll for updates
      loadNewGrades();
      const gradesInterval = setInterval(loadNewGrades, 15000);
      
      // Load unpaid classes count for sidebar badge
      loadUnpaidClasses();
      
      return () => {
        clearInterval(interval);
        clearInterval(notificationInterval);
        clearInterval(streamInterval);
        clearInterval(gradesInterval);
      };
    }
    
    if (role === 'ACADEMY') {
      // Load academy first (sets paymentStatus), THEN load badges that depend on it
      loadAcademy().then((status) => {
        loadUnreadValoraciones(status);
        loadUngradedAssignments(status);
      });
      // Poll every 15 seconds for pending payments, valoraciones, and assignments
      const academyInterval = setInterval(() => {
        loadAcademy().then((status) => {
          loadUnreadValoraciones(status);
          loadUngradedAssignments(status);
        });
      }, 15000);
      return () => clearInterval(academyInterval);
    }
    
    if (role === 'TEACHER') {
      loadUnreadValoraciones();
      loadUngradedAssignments();
      // Poll every 15 seconds for valoraciones and assignments
      const teacherInterval = setInterval(() => {
        loadUnreadValoraciones();
        loadUngradedAssignments();
      }, 15000);
      return () => clearInterval(teacherInterval);
    }
  }, [checkAuth, checkSession, role, loadNotifications, loadActiveStreams, loadAcademy, loadUnreadValoraciones, loadUngradedAssignments, loadNewGrades]);

  const handleSwitchRole = async () => {
    try {
      const response = await apiClient('/auth/switch-role', { method: 'POST' });
      const result = await response.json();
      
      if (result.success && result.data?.user) {
        const newRole = result.data.user.role.toLowerCase();
        window.location.href = `/dashboard/${newRole}`;
      } else {
        alert(result.error || 'Failed to switch role');
      }
    } catch (error) {
      console.error('Failed to switch role:', error);
      alert('An error occurred while switching roles');
    }
  };

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

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await apiClient('/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      });
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const joinLiveClass = (notification: Notification) => {
    if (notification.data?.zoomLink) {
      markNotificationAsRead(notification.id);
      window.open(notification.data.zoomLink, '_blank');
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient('/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getMenuItems = (): MenuItem[] => {
    switch (role) {
      case 'ADMIN':
        return [
          {
            label: 'Panel de Control',
            href: '/dashboard/admin',
            iconType: 'chart' as const,
          },
          { 
            label: 'Profesores', 
            href: '/dashboard/admin/teachers', 
            iconType: 'botMessage' as const,
          },
          { 
            label: 'Academias', 
            href: '/dashboard/admin/academies', 
            icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>) 
          },
          { 
            label: 'Asignaturas', 
            href: '/dashboard/admin/subjects', 
            iconType: 'book' as const,
          },
          { 
            label: 'Estudiantes', 
            href: '/dashboard/admin/students', 
            iconType: 'users' as const,
          },
          ...(academy?.feedbackEnabled !== 0 ? [{
            label: 'Valoraciones', 
            href: '/dashboard/admin/feedback', 
            iconType: 'message' as const,
            badge: unreadValoracionesCount > 0 ? unreadValoracionesCount : undefined,
            badgeColor: 'bg-blue-500'
          }] : []),
          { 
            label: 'Streams', 
            href: '/dashboard/admin/streams', 
            iconType: 'clap' as const,
          },
          { 
            label: 'Ejercicios', 
            href: '/dashboard/admin/assignments', 
            iconType: 'fileText' as const,
          },
          {
            label: 'Calificaciones',
            href: '/dashboard/admin/grades',
            iconType: 'star' as const,
          },
          { 
            label: 'Gestión de Cuentas', 
            href: '/dashboard/admin/accounts', 
            icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>) 
          },
          { 
            label: 'Pagos', 
            href: '/dashboard/admin/pagos', 
            iconType: 'handCoins' as const,
          },
          {
            label: 'Calendario',
            href: '/dashboard/admin/calendar',
            icon: (<LordIconCalendar size={20} />)
          },
        ];
      case 'TEACHER':
        return [
          { label: 'Panel de Control', href: '/dashboard/teacher', iconType: 'chart' },
          { label: 'Asignaturas', href: '/dashboard/teacher/subjects', matchPaths: ['/dashboard/teacher/subject'], iconType: 'book' },
          ...(academy?.feedbackEnabled !== 0 ? [{ label: 'Valoraciones', href: '/dashboard/teacher/feedback', iconType: 'message' as const, badge: unreadValoracionesCount > 0 ? unreadValoracionesCount : undefined, badgeColor: 'bg-[#b0e788]' }] : []),
          { label: 'Streams', href: '/dashboard/teacher/streams', iconType: 'clap' },
          { label: 'Ejercicios', href: '/dashboard/teacher/assignments', iconType: 'fileText', badge: academy?.requireGrading !== 0 && ungradedAssignmentsCount > 0 ? ungradedAssignmentsCount : undefined, badgeColor: 'bg-[#b0e788]' },
          ...(academy?.requireGrading !== 0 ? [{ label: 'Calificaciones', href: '/dashboard/teacher/grades', iconType: 'star' as const }] : []),
          { label: 'Estudiantes', href: '/dashboard/teacher/progress', iconType: 'users' },
          { label: 'Calendario', href: '/dashboard/teacher/calendar', icon: (<LordIconCalendar size={20} />) },
        ];
      case 'STUDENT':
        return [
          { label: 'Mis Asignaturas', href: '/dashboard/student/subjects', matchPaths: ['/dashboard/student/subject'], showPulse: activeStreams.length > 0, iconType: 'book' as const, badge: unpaidClassesCount > 0 ? unpaidClassesCount : undefined, badgeColor: 'bg-[#b0e788]' },
          { label: 'Ejercicios', href: '/dashboard/student/assignments', badge: academy?.requireGrading !== 0 && newGradesCount > 0 ? newGradesCount : undefined, badgeColor: 'bg-[#b0e788]', iconType: 'fileText' as const },
          { label: 'Calendario', href: '/dashboard/student/calendar', icon: (<LordIconCalendar size={20} />) },
        ];
      case 'ACADEMY':
        const academyMenuItems: MenuItem[] = [
          { label: 'Panel de Control', href: '/dashboard/academy', iconType: 'chart' as const },
          { label: 'Asignaturas', href: '/dashboard/academy/subjects', matchPaths: ['/dashboard/academy/subject'], iconType: 'book' as const },
          ...(academy?.feedbackEnabled !== 0 ? [{ label: 'Valoraciones', href: '/dashboard/academy/feedback', iconType: 'message' as const, badge: unreadValoracionesCount > 0 ? unreadValoracionesCount : undefined, badgeColor: 'bg-[#b0e788]' }] : []),
          { label: 'Streams', href: '/dashboard/academy/streams', iconType: 'clap' as const },
          { label: 'Ejercicios', href: '/dashboard/academy/assignments', iconType: 'fileText' as const, badge: academy?.requireGrading !== 0 && newSubmissionsCount > 0 ? newSubmissionsCount : undefined, badgeColor: 'bg-[#b0e788]' },
          ...(academy?.requireGrading !== 0 ? [{ label: 'Calificaciones', href: '/dashboard/academy/grades', iconType: 'star' as const }] : []),
          { label: 'Profesores', href: '/dashboard/academy/teachers', iconType: 'botMessage' as const },
          { label: 'Estudiantes', href: '/dashboard/academy/students', iconType: 'users' as const },
          { label: 'Pagos', href: '/dashboard/academy/payments', iconType: 'handCoins' as const, badge: pendingPaymentsCount > 0 ? pendingPaymentsCount : undefined, badgeColor: 'bg-[#b0e788]' },
          { label: 'Calendario', href: '/dashboard/academy/calendar', icon: (<LordIconCalendar size={20} />) },
        ];
        
        // Filter out Profesores menu for monoacademies
        if (user?.monoacademy) {
          return academyMenuItems.filter(item => item.label !== 'Profesores');
        }
        
        return academyMenuItems;
      default:
        return [];
    }
  };

  const menuItems = (() => {
    const items = getMenuItems();
    if (!academy?.hiddenMenuItems) return items;
    try {
      const hidden: string[] = JSON.parse(academy.hiddenMenuItems);
      if (!hidden.length) return items;
      return items.filter(item => !hidden.includes(item.label));
    } catch { return items; }
  })();

  if (loading) {
    return (
      <div className="dashboard-layout min-h-screen bg-[#111318] flex flex-col lg:flex-row">
        {/* Mobile loading header */}
        <div className="lg:hidden h-14 bg-[#1a1d29] flex items-center px-4">
          <div className="w-8 h-8 bg-gray-700 rounded animate-pulse" />
          <div className="ml-3 w-24 h-5 bg-gray-700 rounded animate-pulse" />
        </div>
        <aside className="hidden lg:flex flex-col bg-[#1a1d29] w-64">
          <div className="h-20 flex items-center px-4">
            <div className="w-12 h-12 bg-gray-700 rounded-xl animate-pulse" />
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {[1,2,3,4,5].map(i => (<div key={i} className="h-12 bg-gray-800 rounded-xl animate-pulse" />))}
          </nav>
        </aside>
        <div className="flex-1 flex flex-col">
          <header className="hidden lg:block h-16 bg-gray-100 border-b" />
          <main className="flex-1 p-4 md:p-8">
            <div className="w-48 h-8 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="w-full max-w-sm h-4 bg-gray-200 rounded animate-pulse" />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-gray-50">
      <DemoBanner userEmail={user?.email} />
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
        onSwitchRole={handleSwitchRole}
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
        onSwitchRole={handleSwitchRole}
        onLogout={handleLogout}
        user={user}
        academyPaymentStatus={academyPaymentStatus}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header with hamburger */}
        <header className="lg:hidden flex items-center justify-between h-14 px-4 bg-white border-b border-gray-200 flex-shrink-0">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link
            href={`/dashboard/${role.toLowerCase()}`}
            className="flex items-center gap-2"
          >
            <Image
              src="/logo/AKADEMO_logo_OTHER2.svg"
              alt="Akademo"
              width={120}
              height={24}
              className="h-6 w-auto object-contain"
            />
            <span className="font-semibold text-gray-900 text-base font-[family-name:var(--font-montserrat)]">
              AKADEMO
            </span>
          </Link>
          <div className="w-9 flex items-center justify-end">
            {role === 'STUDENT' && (
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Notifications"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </header>

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
  );
}
