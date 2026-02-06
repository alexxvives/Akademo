'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { NotificationPanel } from '@/components/layout/NotificationPanel';
import { DemoDataBanner } from '@/components/academy/DemoDataBanner';

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
  
  // Pending enrollments count for academy
  const [pendingEnrollmentsCount, setPendingEnrollmentsCount] = useState(0);
  
  // Unread valoraciones count for teacher/academy
  const [unreadValoracionesCount, setUnreadValoracionesCount] = useState(0);
  
  // Academy state for academy join link and feedbackEnabled
  const [academyId, setAcademyId] = useState<string | null>(null);
  const [academyPaymentStatus, setAcademyPaymentStatus] = useState<string>('PAID');
  const [academy, setAcademy] = useState<any>(null);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await apiClient('/notifications?unread=true');
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setNotifications(result.data);
        setUnreadCount(result.data.filter((n: Notification) => !n.isRead).length);
      }
    } catch (error) {
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

  const loadAcademy = useCallback(async () => {
    try {
      const response = await apiClient('/academies');
      const result = await response.json();
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        setAcademyId(result.data[0].id);
        setAcademyPaymentStatus(result.data[0].paymentStatus || 'PAID');
        setAcademy(result.data[0]);
      }
      
      // Load pending cash/bizum payments count for badge
      const pendingRes = await apiClient('/payments/pending-count');
      const pendingResult = await pendingRes.json();
      if (pendingResult.success && typeof pendingResult.data === 'number') {
        setPendingEnrollmentsCount(pendingResult.data);
      }
    } catch (error) {
      console.error('Failed to load academy:', error);
    }
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

  const loadUnreadValoraciones = useCallback(async () => {
    try {
      const response = await apiClient('/lessons/ratings/unread-count');
      const result = await response.json();
      if (result.success && result.data) {
        setUnreadValoracionesCount(result.data.count || 0);
      }
    } catch (error) {
      console.error('Failed to load unread valoraciones:', error);
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
      
      return () => {
        clearInterval(interval);
        clearInterval(notificationInterval);
        clearInterval(streamInterval);
      };
    }
    
    if (role === 'ACADEMY') {
      loadAcademy();
      loadUnreadValoraciones();
      // Poll every 15 seconds for pending enrollments and valoraciones
      const academyInterval = setInterval(() => {
        loadAcademy();
        loadUnreadValoraciones();
      }, 15000);
      return () => clearInterval(academyInterval);
    }
    
    if (role === 'TEACHER') {
      loadUnreadValoraciones();
      // Poll every 15 seconds for valoraciones
      const teacherInterval = setInterval(loadUnreadValoraciones, 15000);
      return () => clearInterval(teacherInterval);
    }
  }, [role, loadNotifications, loadActiveStreams, loadAcademy, loadUnreadValoraciones]);

  const checkAuth = async () => {
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
  };

  const checkSession = async () => {
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
  };

  const handleLogout = async () => {
    await apiClient('/auth/logout', { method: 'POST' });
    router.push('/');
  };

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
            href: '/dashboard/admin/classes', 
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
            label: 'Facturas', 
            href: '/dashboard/admin/facturas', 
            iconType: 'handCoins' as const,
          },
        ];
      case 'TEACHER':
        return [
          { label: 'Panel de Control', href: '/dashboard/teacher', iconType: 'chart' },
          { label: 'Asignaturas', href: '/dashboard/teacher/classes', matchPaths: ['/dashboard/teacher/class'], iconType: 'book' },
          ...(academy?.feedbackEnabled !== 0 ? [{ label: 'Valoraciones', href: '/dashboard/teacher/feedback', iconType: 'message' as const, badge: unreadValoracionesCount > 0 ? unreadValoracionesCount : undefined, badgeColor: 'bg-[#b0e788]' }] : []),
          { label: 'Streams', href: '/dashboard/teacher/streams', iconType: 'clap' },
          { label: 'Ejercicios', href: '/dashboard/teacher/assignments', iconType: 'fileText' },
          { label: 'Calificaciones', href: '/dashboard/teacher/grades', iconType: 'star' as const },
          { label: 'Estudiantes', href: '/dashboard/teacher/progress', iconType: 'users' },
        ];
      case 'STUDENT':
        return [
          { label: 'Mis Asignaturas', href: '/dashboard/student/classes', matchPaths: ['/dashboard/student/class'], showPulse: activeStreams.length > 0, icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>) },
          { label: 'Ejercicios', href: '/dashboard/student/assignments', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>) },
        ];
      case 'ACADEMY':
        const academyMenuItems: MenuItem[] = [
          { label: 'Panel de Control', href: '/dashboard/academy', iconType: 'chart' as const },
          { label: 'Asignaturas', href: '/dashboard/academy/classes', matchPaths: ['/dashboard/academy/class'], iconType: 'book' as const },
          ...(academy?.feedbackEnabled !== 0 ? [{ label: 'Valoraciones', href: '/dashboard/academy/feedback', iconType: 'message' as const, badge: unreadValoracionesCount > 0 ? unreadValoracionesCount : undefined, badgeColor: 'bg-[#b0e788]' }] : []),
          { label: 'Streams', href: '/dashboard/academy/streams', iconType: 'clap' as const },
          { label: 'Ejercicios', href: '/dashboard/academy/assignments', iconType: 'fileText' as const },
          { label: 'Calificaciones', href: '/dashboard/academy/grades', iconType: 'star' as const },
          { label: 'Profesores', href: '/dashboard/academy/teachers', iconType: 'botMessage' as const },
          { label: 'Estudiantes', href: '/dashboard/academy/students', iconType: 'users' as const },
          { label: 'Pagos', href: '/dashboard/academy/payments', iconType: 'handCoins' as const, badge: pendingEnrollmentsCount > 0 ? pendingEnrollmentsCount : undefined, badgeColor: 'bg-[#b0e788]' },
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

  const menuItems = getMenuItems();

  if (loading) {
    return (
      <div className="dashboard-layout min-h-screen bg-[#111318] flex">
        <aside className="hidden lg:flex flex-col bg-[#1a1d29] w-64">
          <div className="h-20 flex items-center px-4">
            <div className="w-12 h-12 bg-gray-700 rounded-xl animate-pulse" />
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {[1,2,3,4,5].map(i => (<div key={i} className="h-12 bg-gray-800 rounded-xl animate-pulse" />))}
          </nav>
        </aside>
        <div className="flex-1 flex flex-col">
          <header className="h-16 bg-gray-100 border-b" />
          <main className="flex-1 p-8">
            <div className="w-48 h-8 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="w-96 h-4 bg-gray-200 rounded animate-pulse" />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {(role === 'ACADEMY' && academyPaymentStatus === 'NOT PAID') && (
        <DemoDataBanner />
      )}
      <div className="dashboard-layout flex-1 flex overflow-hidden">
      <Sidebar
        role={role}
        menuItems={menuItems}
        activeStreams={activeStreams}
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
        activeStreams={activeStreams}
        linkCopied={linkCopied}
        onClose={() => setMobileMenuOpen(false)}
        onCopyJoinLink={copyJoinLink}
        onSwitchRole={handleSwitchRole}
        onLogout={handleLogout}
        user={user}
        academyPaymentStatus={academyPaymentStatus}
      />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
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

        <main className="flex-1 overflow-y-auto bg-gray-100">
          <div className="py-12 pl-20 pr-20">
            {children}
          </div>
        </main>
      </div>
    </div>
    </div>
  );
}
