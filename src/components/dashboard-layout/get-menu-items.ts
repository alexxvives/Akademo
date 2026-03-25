import type { MenuItem, Academy, ActiveStream } from './types';

export interface MenuItemsConfig {
  role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'ACADEMY';
  academy: Academy | null;
  unreadValoracionesCount: number;
  ungradedAssignmentsCount: number;
  activeStreams: ActiveStream[];
  unpaidClassesCount: number;
  newGradesCount: number;
  pendingPaymentsCount: number;
  newSubmissionsCount: number;
  studentPendingPaymentsCount: number;
}

export function getMenuItems(config: MenuItemsConfig): MenuItem[] {
  const {
    role, academy, unreadValoracionesCount, ungradedAssignmentsCount,
    activeStreams, unpaidClassesCount, newGradesCount,
    pendingPaymentsCount, newSubmissionsCount, studentPendingPaymentsCount,
  } = config;

  switch (role) {
    case 'ADMIN':
      return [
        { label: 'Panel de Control', href: '/dashboard/admin', iconType: 'chart' as const, group: 'General' },
        { label: 'Leads', href: '/dashboard/admin/leads', iconType: 'users' as const, group: 'General' },
        { label: 'Asignaturas', href: '/dashboard/admin/subjects', iconType: 'book' as const, group: 'Contenido' },
        { label: 'Streams', href: '/dashboard/admin/streams', iconType: 'clap' as const, group: 'Contenido', showPulse: activeStreams.length > 0 },
        { label: 'Mediateca', href: '/dashboard/admin/media', iconType: 'folderOpen' as const, group: 'Contenido' },
        { label: 'Ejercicios', href: '/dashboard/admin/assignments', iconType: 'fileText' as const, badge: ungradedAssignmentsCount > 0 ? ungradedAssignmentsCount : undefined, badgeColor: 'bg-[#b0e788]', group: 'Contenido' },
        { label: 'Calificaciones', href: '/dashboard/admin/grades', iconType: 'star' as const, group: 'Contenido' },
        { label: 'Profesores', href: '/dashboard/admin/teachers', iconType: 'botMessage' as const, group: 'Comunidad' },
        { label: 'Estudiantes', href: '/dashboard/admin/students', iconType: 'users' as const, group: 'Comunidad' },
        { label: 'Academias', href: '/dashboard/admin/academies', iconType: 'home' as const, group: 'Comunidad' },
        ...(academy?.feedbackEnabled !== 0 ? [{
          label: 'Valoraciones',
          href: '/dashboard/admin/feedback',
          iconType: 'message' as const,
          badge: unreadValoracionesCount > 0 ? unreadValoracionesCount : undefined,
          badgeColor: 'bg-blue-500',
          group: 'Comunidad',
        }] : []),
        { label: 'Pagos', href: '/dashboard/admin/pagos', iconType: 'handCoins' as const, badge: pendingPaymentsCount > 0 ? pendingPaymentsCount : undefined, badgeColor: 'bg-[#b0e788]', group: 'Gestión' },
        { label: 'Calendario', href: '/dashboard/admin/calendar', iconType: 'calendar' as const, group: 'Gestión' },
      ];

    case 'TEACHER':
      return [
        { label: 'Panel de Control', href: '/dashboard/teacher', iconType: 'chart', group: 'General' },
        { label: 'Asignaturas', href: '/dashboard/teacher/subjects', matchPaths: ['/dashboard/teacher/subject'], iconType: 'book', group: 'Contenido' },
        ...(academy?.feedbackEnabled !== 0 ? [{ label: 'Valoraciones', href: '/dashboard/teacher/feedback', iconType: 'message' as const, badge: unreadValoracionesCount > 0 ? unreadValoracionesCount : undefined, badgeColor: 'bg-[#b0e788]', group: 'Contenido' }] : []),
        { label: 'Streams', href: '/dashboard/teacher/streams', iconType: 'clap', group: 'Contenido', showPulse: activeStreams.length > 0 },
        { label: 'Mediateca', href: '/dashboard/teacher/media', iconType: 'folderOpen' as const, group: 'Contenido' },
        { label: 'Ejercicios', href: '/dashboard/teacher/assignments', iconType: 'fileText', badge: academy?.requireGrading !== 0 && ungradedAssignmentsCount > 0 ? ungradedAssignmentsCount : undefined, badgeColor: 'bg-[#b0e788]', group: 'Contenido' },
        ...(academy?.requireGrading !== 0 ? [{ label: 'Calificaciones', href: '/dashboard/teacher/grades', iconType: 'star' as const, group: 'Contenido' }] : []),
        { label: 'Estudiantes', href: '/dashboard/teacher/progress', iconType: 'users', group: 'Comunidad' },
        { label: 'Calendario', href: '/dashboard/teacher/calendar', iconType: 'calendar' as const, group: 'Gestión' },
      ];

    case 'STUDENT':
      return [
        { label: 'Mis Asignaturas', href: '/dashboard/student/subjects', matchPaths: ['/dashboard/student/subject'], showPulse: activeStreams.length > 0, iconType: 'book' as const, badge: unpaidClassesCount > 0 ? unpaidClassesCount : undefined, badgeColor: 'bg-[#b0e788]' },
        { label: 'Ejercicios', href: '/dashboard/student/assignments', badge: academy?.requireGrading !== 0 && newGradesCount > 0 ? newGradesCount : undefined, badgeColor: 'bg-[#b0e788]', iconType: 'fileText' as const },
        { label: 'Mis Pagos', href: '/dashboard/student/pagos', iconType: 'handCoins' as const, badge: studentPendingPaymentsCount > 0 ? studentPendingPaymentsCount : undefined, badgeColor: 'bg-[#b0e788]' },
        { label: 'Calendario', href: '/dashboard/student/calendar', iconType: 'calendar' as const },
      ];

    case 'ACADEMY': {
      const academyMenuItems: MenuItem[] = [
        { label: 'Panel de Control', href: '/dashboard/academy', iconType: 'chart' as const, group: 'General' },
        { label: 'Asignaturas', href: '/dashboard/academy/subjects', matchPaths: ['/dashboard/academy/subject'], iconType: 'book' as const, group: 'Contenido' },
        ...(academy?.feedbackEnabled !== 0 ? [{ label: 'Valoraciones', href: '/dashboard/academy/feedback', iconType: 'message' as const, badge: unreadValoracionesCount > 0 ? unreadValoracionesCount : undefined, badgeColor: 'bg-[#b0e788]', group: 'Contenido' }] : []),
        { label: 'Streams', href: '/dashboard/academy/streams', iconType: 'clap' as const, group: 'Contenido', showPulse: activeStreams.length > 0 },
        { label: 'Mediateca', href: '/dashboard/academy/media', iconType: 'folderOpen' as const, group: 'Contenido' },
        { label: 'Ejercicios', href: '/dashboard/academy/assignments', iconType: 'fileText' as const, badge: academy?.requireGrading !== 0 && newSubmissionsCount > 0 ? newSubmissionsCount : undefined, badgeColor: 'bg-[#b0e788]', group: 'Contenido' },
        ...(academy?.requireGrading !== 0 ? [{ label: 'Calificaciones', href: '/dashboard/academy/grades', iconType: 'star' as const, group: 'Contenido' }] : []),
        { label: 'Profesores', href: '/dashboard/academy/teachers', iconType: 'botMessage' as const, group: 'Comunidad' },
        { label: 'Estudiantes', href: '/dashboard/academy/students', iconType: 'users' as const, group: 'Comunidad' },
        { label: 'Pagos', href: '/dashboard/academy/payments', iconType: 'handCoins' as const, badge: pendingPaymentsCount > 0 ? pendingPaymentsCount : undefined, badgeColor: 'bg-[#b0e788]', group: 'Gestión' },
        { label: 'Calendario', href: '/dashboard/academy/calendar', iconType: 'calendar' as const, group: 'Gestión' },
      ];
      return academyMenuItems;
    }

    default:
      return [];
  }
}

export function getFilteredMenuItems(items: MenuItem[], academy: Academy | null): MenuItem[] {
  if (!academy?.hiddenMenuItems) return items;
  try {
    const hidden: string[] = JSON.parse(academy.hiddenMenuItems);
    if (!hidden.length) return items;
    return items.filter(item => !hidden.includes(item.label));
  } catch { return items; }
}
