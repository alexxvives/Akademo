'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { 
  ChartNoAxesColumnIncreasingIcon, 
  BookTextIcon,
  UserRoundPlusIcon,
  MessageSquareMoreIcon,
  ClapIcon,
  FileTextIcon,
  ClipboardCheckIcon,
  ActivityIcon,
  LogoutIcon,
  LinkIcon,
  PlusIcon,
} from '@/components/ui';
import { UsersIcon } from '@/components/ui/UsersIcon';
import { BotMessageSquareIcon } from '@/components/ui/BotMessageSquareIcon';

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
  const pathname = usePathname();
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

  // Refs for animated icons
  const logoutIconRef = useRef<any>(null);
  const linkIconRef = useRef<any>(null);

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
      const notificationInterval = setInterval(loadNotifications, 15000); // Check every 15 seconds
      
      // Load active streams and poll for updates
      loadActiveStreams();
      const streamInterval = setInterval(loadActiveStreams, 10000); // Check every 10 seconds
      
      return () => {
        clearInterval(interval);
        clearInterval(notificationInterval);
        clearInterval(streamInterval);
      };
    }
    
    if (role === 'TEACHER') {
      // Load pending enrollment requests and poll for updates
      loadPendingRequestsCount();
      const requestsInterval = setInterval(loadPendingRequestsCount, 15000); // Check every 15 seconds
      
      return () => {
        clearInterval(requestsInterval);
      };
    }
    
    if (role === 'ACADEMY') {
      // Load academy data for join link
      loadAcademy();
    }
  }, [role, loadNotifications, loadActiveStreams, loadPendingRequestsCount, loadAcademy]);

  const checkAuth = async () => {
    try {
      const response = await apiClient('/auth/me');
      const result = await response.json();

      if (result.success && result.data) {
        const userRole = result.data.role;
        
        // Allow access if:
        // 1. User role matches the expected role
        // 2. ACADEMY role can access TEACHER routes (they own the academy)
        // 3. ADMIN can access any route
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

      // Session check returns the session object with id, role, etc.
      // If success is true and data has an id, the session is valid
      if (!result.success || !result.data?.id) {
        if (result.data?.message) {
          alert(result.data.message);
        }
        handleLogout();
      }
    } catch (error) {
      console.error('Session check error:', error);
      // Ignore errors - don't log out on network issues
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

  // Menu items by role with sections
  const getMenuItems = (): MenuItem[] => {
    switch (role) {
      case 'ADMIN':
        return [
          // Dashboard Section
          {
            label: 'Analíticas',
            href: '/dashboard/admin',
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            ),
          },
          {
            label: 'Ingresos',
            href: '/dashboard/admin/revenue',
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
          },
          // User Management Section
          {
            label: 'Estudiantes',
            href: '/dashboard/admin/students',
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ),
          },
          {
            label: 'Profesores',
            href: '/dashboard/admin/teachers',
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            ),
          },
          {
            label: 'Academias',
            href: '/dashboard/admin/academies',
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            ),
          },
          // Content Library Section
          {
            label: 'Reportes',
            href: '/dashboard/admin/reports',
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            ),
          },
        ];
      case 'TEACHER':
        return [
          // Dashboard
          {
            label: 'Dashboard',
            href: '/dashboard/teacher',
            iconType: 'chart',
          },
          {
            label: 'Clases',
            href: '/dashboard/teacher/classes',
            matchPaths: ['/dashboard/teacher/class'],
            iconType: 'book',
          },
          {
            label: 'Solicitudes',
            href: '/dashboard/teacher/requests',
            badge: pendingRequestsCount,
            iconType: 'userPlus',
          },
          {
            label: 'Feedback',
            href: '/dashboard/teacher/feedback',
            iconType: 'message',
          },
          {
            label: 'Streams',
            href: '/dashboard/teacher/streams',
            iconType: 'clap',
          },
          {
            label: 'Tareas',
            href: '/dashboard/teacher/assignments',
            iconType: 'fileText',
          },
          {
            label: 'Calificaciones',
            href: '/dashboard/teacher/grading',
            iconType: 'clipboard',
          },
          // Learning Tools
          {
            label: 'Estudiantes',
            href: '/dashboard/teacher/progress',
            iconType: 'users',
          },
        ];
      case 'STUDENT':
        return [
          // Core
          {
            label: 'Mis Clases',
            href: '/dashboard/student/classes',
            matchPaths: ['/dashboard/student/class'],
            badge: activeStreams.length > 0 ? activeStreams.length : undefined,
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            ),
          },
          {
            label: 'Tareas',
            href: '/dashboard/student/assignments',
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            ),
          },
          {
            label: 'Cuestionarios',
            href: '/dashboard/student/quizzes',
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
          },
        ];
      case 'ACADEMY':
        return [
          // Dashboard with animated icon
          {
            label: 'Dashboard',
            href: '/dashboard/academy',
            iconType: 'chart',
          },
          {
            label: 'Profesores',
            href: '/dashboard/academy/teachers',
            iconType: 'botMessage',
          },
          {
            label: 'Clases',
            href: '/dashboard/academy/classes',
            matchPaths: ['/dashboard/academy/class'],
            iconType: 'book',
          },
          {
            label: 'Solicitudes',
            href: '/dashboard/academy/requests',
            badge: pendingRequestsCount,
            iconType: 'userPlus',
          },
          {
            label: 'Feedback',
            href: '/dashboard/academy/feedback',
            iconType: 'message',
          },
          {
            label: 'Streams',
            href: '/dashboard/academy/streams',
            iconType: 'clap',
          },
          {
            label: 'Estudiantes',
            href: '/dashboard/academy/students',
            iconType: 'users',
          },
          {
            label: 'Facturas',
            href: '/dashboard/academy/facturas',
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            ),
          },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  // Create refs for animated icons (must be outside map to follow Rules of Hooks)
  const iconRefs = useRef<{ [key: string]: any }>({});

  if (loading) {
    return (
      <div className="dashboard-layout min-h-screen bg-[#111318] flex">
        {/* Skeleton Sidebar */}
        <aside className="hidden lg:flex flex-col bg-[#1a1d29] w-64">
          <div className="h-20 flex items-center px-4">
            <div className="w-12 h-12 bg-gray-700 rounded-xl animate-pulse" />
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="h-12 bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </nav>
        </aside>
        {/* Skeleton Content */}
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

  const roleLabel = role === 'ADMIN' ? 'Admin' : role === 'TEACHER' ? 'Teacher' : role === 'STUDENT' ? 'Student' : 'Academy';

  return (
    <div className="dashboard-layout h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col bg-[#1a1d29] w-64 h-screen">
        {/* Logo */}
        <div className="h-20 flex items-center justify-center px-4 gap-2">
          <Link href={`/dashboard/${role.toLowerCase()}`} className="flex items-center gap-2">
            <img 
              src="/logo/AKADEMO_logo_OTHER2.svg" 
              alt="Akademo" 
              className="h-8 w-auto object-contain"
            />
            <span className="text-lg font-bold text-gray-400 font-[family-name:var(--font-montserrat)]">AKADEMO</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            // For dashboard routes (e.g., /dashboard/teacher), only highlight on exact match
            const isDashboardRoute = item.href === `/dashboard/${role.toLowerCase()}`;
            const matchesPath = (item as any).matchPaths && (item as any).matchPaths.some((p: string) => pathname.startsWith(p));
            const isActive = isDashboardRoute 
              ? pathname === item.href 
              : pathname === item.href || pathname.startsWith(item.href + '/') || matchesPath;
            
            // Check if this is "Mis Clases" and there are active streams
            const hasLiveStream = role === 'STUDENT' && item.label === 'Mis Clases' && activeStreams.length > 0;
            
            // Get or create ref for this menu item
            if (!iconRefs.current[item.href]) {
              iconRefs.current[item.href] = { current: null };
            }
            const iconRef = iconRefs.current[item.href];

            // Render icon based on type
            const renderIcon = () => {
              const iconType = (item as any).iconType;
              if (iconType === 'chart') {
                return <ChartNoAxesColumnIncreasingIcon ref={iconRef} size={20} />;
              } else if (iconType === 'book') {
                return <BookTextIcon ref={iconRef} size={20} />;
              } else if (iconType === 'userPlus') {
                return <UserRoundPlusIcon ref={iconRef} size={20} />;
              } else if (iconType === 'message') {
                return <MessageSquareMoreIcon ref={iconRef} size={20} />;
              } else if (iconType === 'clap') {
                return <ClapIcon ref={iconRef} size={20} />;
              } else if (iconType === 'fileText') {
                return <FileTextIcon ref={iconRef} size={20} />;
              } else if (iconType === 'clipboard') {
                return <ClipboardCheckIcon ref={iconRef} size={20} />;
              } else if (iconType === 'activity') {
                return <ActivityIcon ref={iconRef} size={20} />;
              } else if (iconType === 'users') {
                return <UsersIcon ref={iconRef} size={20} />;
              } else if (iconType === 'botMessage') {
                return <BotMessageSquareIcon ref={iconRef} size={20} />;
              } else if (item.icon) {
                return item.icon;
              }
              return null;
            };

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all group ${
                  isActive
                    ? 'bg-gray-800/50 text-white'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                }`}
                onMouseEnter={() => {
                  if (iconRef.current?.startAnimation) {
                    iconRef.current.startAnimation();
                  }
                }}
                onMouseLeave={() => {
                  if (iconRef.current?.stopAnimation) {
                    iconRef.current.stopAnimation();
                  }
                }}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#b1e787] rounded-r-full" />
                )}
                <span className={`relative flex-shrink-0 ${
                  isActive ? 'text-[#b1e787]' : 'text-gray-400 group-hover:text-white'
                }`}>
                  {renderIcon()}
                </span>
                <span className="text-sm font-medium">{item.label}</span>
                {hasLiveStream && (
                  <span className="ml-auto w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                )}
                {!hasLiveStream && item.badge !== undefined && item.badge > 0 && (
                  <span className={`ml-auto text-xs font-bold px-2 py-1 rounded-full ${
                    item.label === 'Solicitudes' 
                      ? 'bg-accent-300 text-gray-900' 
                      : 'bg-[#b1e787]/20 text-[#b1e787]'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Quick Action Button - Context based on role */}
        <div className="px-3 pb-3">
          {/* Hide for teachers and academy */}
          {role !== 'TEACHER' && role !== 'ACADEMY' && (
            <Link
              href={
                role === 'STUDENT' ? '/dashboard/student/enrolled-academies/classes' :
                '/dashboard/admin'
              }
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#b1e787] hover:bg-[#9dd46f] text-gray-900 rounded-xl transition-all shadow-lg font-semibold"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm">
                {role === 'STUDENT' ? 'Explorar Clases' : 'Panel Admin'}
              </span>
            </Link>
          )}
        </div>

        {/* Academy Invite Link */}
        {role === 'ACADEMY' && academyId && (
          <div className="px-3 py-2 border-t border-gray-800/50">
            <button
              onClick={copyAcademyJoinLink}
              onMouseEnter={() => linkIconRef.current?.startAnimation()}
              onMouseLeave={() => linkIconRef.current?.stopAnimation()}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                linkCopied 
                  ? 'bg-[#b1e787]/20 text-[#b1e787]' 
                  : 'bg-[#b1e787]/10 text-[#b1e787] hover:bg-[#b1e787]/20'
              }`}
            >
              <LinkIcon ref={linkIconRef} size={20} className="flex-shrink-0" />
              <span className="text-sm font-medium truncate">
                {linkCopied ? '¡Enlace copiado!' : 'Copiar enlace de invitación'}
              </span>
            </button>
          </div>
        )}

        {/* Teacher Invite Link */}
        {role === 'TEACHER' && user && (
          <div className="px-3 py-2 border-t border-gray-800/50">
            <button
              onClick={copyJoinLink}
              onMouseEnter={() => linkIconRef.current?.startAnimation()}
              onMouseLeave={() => linkIconRef.current?.stopAnimation()}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                linkCopied 
                  ? 'bg-[#b1e787]/20 text-[#b1e787]' 
                  : 'bg-[#b1e787]/10 text-[#b1e787] hover:bg-[#b1e787]/20'
              }`}
            >
              <LinkIcon ref={linkIconRef} size={20} className="flex-shrink-0" />
              <span className="text-sm font-medium truncate">
                {linkCopied ? '¡Enlace copiado!' : 'Copiar enlace de invitación'}
              </span>
            </button>
          </div>
        )}

        {/* Role Switcher (MonoAcademy) */}
        {user?.monoacademy && (role === 'ACADEMY' || role === 'TEACHER') && (
          <div className="px-3 py-2 border-t border-gray-800/50">
            <button
              onClick={handleSwitchRole}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span className="text-sm font-medium">
                {role === 'ACADEMY' ? 'Cambiar a Profesor' : 'Cambiar a Academia'}
              </span>
            </button>
          </div>
        )}

        {/* User Profile */}
        {user && (
          <div className="border-t border-gray-800/50 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#b1e787] rounded-xl flex items-center justify-center text-sm font-bold text-gray-900 flex-shrink-0 shadow-lg">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              onMouseEnter={() => logoutIconRef.current?.startAnimation()}
              onMouseLeave={() => logoutIconRef.current?.stopAnimation()}
              className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800/50 rounded-xl transition-colors"
            >
              <LogoutIcon ref={logoutIconRef} size={16} />
              Cerrar Sesión
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed top-0 left-0 bottom-0 w-72 bg-white z-50 transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo & Close */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          <Link
            href={`/dashboard/${role.toLowerCase()}`}
            className="flex items-center gap-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            <img 
              src="/logo/AKADEMO_logo_OTHER2.svg" 
              alt="Akademo" 
              className="h-7 w-auto object-contain"
            />
            <span className="font-semibold text-gray-900 text-lg font-[family-name:var(--font-montserrat)]">AKADEMO</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        <nav className="px-3 py-4 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
          {menuItems.map((item) => {
            const isDashboardRoute = item.href === `/dashboard/${role.toLowerCase()}`;
            const isActive = isDashboardRoute 
              ? pathname === item.href 
              : pathname === item.href || pathname.startsWith(item.href + '/');
            
            // Check if this is "Mis Clases" and there are active streams
            const hasLiveStream = role === 'STUDENT' && item.label === 'Mis Clases' && activeStreams.length > 0;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 font-medium shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className={isActive ? 'text-brand-600' : 'text-gray-500'}>
                  {item.icon}
                </span>
                <span className="text-sm">{item.label}</span>
                {hasLiveStream && (
                  <span className="ml-auto w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                )}
                {!hasLiveStream && item.badge !== undefined && item.badge > 0 && (
                  <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${
                    item.label === 'Solicitudes' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-brand-100 text-brand-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Teacher Invite Link */}
        {role === 'TEACHER' && user && (
          <div className="px-3 py-2">
            <button
              onClick={copyJoinLink}
              onMouseEnter={() => linkIconRef.current?.startAnimation()}
              onMouseLeave={() => linkIconRef.current?.stopAnimation()}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                linkCopied 
                  ? 'bg-green-50 text-green-700' 
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              <LinkIcon ref={linkIconRef} size={20} className="flex-shrink-0" />
              <span className="text-sm font-medium">
                {linkCopied ? '¡Enlace copiado!' : 'Copiar enlace de invitación'}
              </span>
            </button>
          </div>
        )}

        {/* Mobile User Profile */}
        {user && (
          <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-4 bg-white">
            {/* Role Switcher (MonoAcademy) */}
            {user.monoacademy && (role === 'ACADEMY' || role === 'TEACHER') && (
              <button
                onClick={handleSwitchRole}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-all mb-3"
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span className="text-sm font-medium">
                  {role === 'ACADEMY' ? 'Cambiar a Profesor' : 'Cambiar a Academia'}
                </span>
              </button>
            )}

            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-700">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              onMouseEnter={() => logoutIconRef.current?.startAnimation()}
              onMouseLeave={() => logoutIconRef.current?.stopAnimation()}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <LogoutIcon ref={logoutIconRef} size={16} />
              Cerrar Sesión
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Notification Panel */}
        {role === 'STUDENT' && showNotifications && (
          <div className="fixed inset-x-0 lg:right-0 lg:left-auto lg:w-96 top-4 bg-white border border-gray-200 lg:rounded-lg shadow-xl z-40 max-h-96 overflow-y-auto lg:m-4">
            <div className="p-3 border-b border-gray-100 flex items-center justify-between">
              <span className="font-medium text-gray-900">Notificaciones</span>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-brand-600 hover:text-brand-700"
                  >
                    Marcar todas
                  </button>
                )}
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No hay notificaciones
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 ${!notification.isRead ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      {notification.type === 'live_class' && (
                        <span className="text-red-500 animate-pulse">🔴</span>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title.replace('🔴 ', '')}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {notification.message}
                        </p>
                        {notification.type === 'live_class' && notification.data?.zoomLink && (
                          <button
                            onClick={() => joinLiveClass(notification)}
                            className="mt-2 w-full bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                          >
                            Unirse a la clase →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-100">
          <div className="py-12 pl-20 pr-20">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
