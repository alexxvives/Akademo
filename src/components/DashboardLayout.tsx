'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { NotificationPanel } from '@/components/layout/NotificationPanel';

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
  iconType?: 'chart' | 'book' | 'userPlus' | 'message' | 'clap' | 'fileText' | 'clipboard' | 'activity' | 'users' | 'botMessage';
  badge?: number;
  matchPaths?: string[];
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
  
  // Pending requests count for teachers
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  
  // Academy state for academy join link
  const [academyId, setAcademyId] = useState<string | null>(null);

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

  const loadPendingRequestsCount = useCallback(async () => {
    try {
      const response = await apiClient('/enrollments/pending');
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setPendingRequestsCount(result.data.length);
      }
    } catch (error) {
      console.error('Failed to load pending requests count:', error);
    }
  }, []);

  const loadAcademy = useCallback(async () => {
    try {
      const response = await apiClient('/academies');
      const result = await response.json();
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        setAcademyId(result.data[0].id);
      }
    } catch (error) {
      console.error('Failed to load academy:', error);
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
    
    if (role === 'TEACHER') {
      loadPendingRequestsCount();
      const requestsInterval = setInterval(loadPendingRequestsCount, 15000);
      
      return () => {
        clearInterval(requestsInterval);
      };
    }
    
    if (role === 'ACADEMY') {
      loadAcademy();
    }
  }, [role, loadNotifications, loadActiveStreams, loadPendingRequestsCount, loadAcademy]);

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
            label: 'Analíticas',
            href: '/dashboard/admin',
            icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>),
          },
          { label: 'Ingresos', href: '/dashboard/admin/revenue', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>) },
          { label: 'Estudiantes', href: '/dashboard/admin/students', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>) },
          { label: 'Profesores', href: '/dashboard/admin/teachers', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>) },
          { label: 'Academias', href: '/dashboard/admin/academies', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>) },
          { label: 'Reportes', href: '/dashboard/admin/reports', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>) },
        ];
      case 'TEACHER':
        return [
          { label: 'Dashboard', href: '/dashboard/teacher', iconType: 'chart' },
          { label: 'Clases', href: '/dashboard/teacher/classes', matchPaths: ['/dashboard/teacher/class'], iconType: 'book' },
          { label: 'Solicitudes', href: '/dashboard/teacher/requests', badge: pendingRequestsCount, iconType: 'userPlus' },
          { label: 'Feedback', href: '/dashboard/teacher/feedback', iconType: 'message' },
          { label: 'Streams', href: '/dashboard/teacher/streams', iconType: 'clap' },
          { label: 'Tareas', href: '/dashboard/teacher/assignments', iconType: 'fileText' },
          { label: 'Calificaciones', href: '/dashboard/teacher/grading', iconType: 'clipboard' },
          { label: 'Estudiantes', href: '/dashboard/teacher/progress', iconType: 'users' },
        ];
      case 'STUDENT':
        return [
          { label: 'Mis Clases', href: '/dashboard/student/classes', matchPaths: ['/dashboard/student/class'], badge: activeStreams.length > 0 ? activeStreams.length : undefined, icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>) },
          { label: 'Tareas', href: '/dashboard/student/assignments', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>) },
          { label: 'Cuestionarios', href: '/dashboard/student/quizzes', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>) },
        ];
      case 'ACADEMY':
        return [
          { label: 'Dashboard', href: '/dashboard/academy', iconType: 'chart' },
          { label: 'Profesores', href: '/dashboard/academy/teachers', iconType: 'botMessage' },
          { label: 'Clases', href: '/dashboard/academy/classes', matchPaths: ['/dashboard/academy/class'], iconType: 'book' },
          { label: 'Solicitudes', href: '/dashboard/academy/requests', badge: pendingRequestsCount, iconType: 'userPlus' },
          { label: 'Feedback', href: '/dashboard/academy/feedback', iconType: 'message' },
          { label: 'Streams', href: '/dashboard/academy/streams', iconType: 'clap' },
          { label: 'Estudiantes', href: '/dashboard/academy/students', iconType: 'users' },
          { label: 'Facturas', href: '/dashboard/academy/facturas', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>) },
        ];
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
    <div className="dashboard-layout h-screen bg-gray-50 flex overflow-hidden">
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
  );
}
