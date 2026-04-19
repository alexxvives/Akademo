export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  linkedUserId?: string | null;
}

export interface MenuItem {
  label: string;
  href: string;
  icon?: JSX.Element;
  iconType?:
    | 'chart'
    | 'book'
    | 'userPlus'
    | 'message'
    | 'clap'
    | 'fileText'
    | 'clipboard'
    | 'activity'
    | 'users'
    | 'botMessage'
    | 'handCoins'
    | 'star'
    | 'calendar'
    | 'home'
    | 'folderOpen';
  badge?: number;
  badgeColor?: string;
  matchPaths?: string[];
  showPulse?: boolean;
  group?: string;
}

export interface ActiveStream {
  id: string;
  classId: string;
  title: string;
  zoomLink: string;
  status: string;
  className: string;
  teacherName: string;
}

export interface Academy {
  id: string;
  paymentStatus?: string | null;
  feedbackEnabled?: number | null;
  hiddenMenuItems?: string | null;
  requireGrading?: number | null;
}

export interface DashboardLayoutProps {
  children: React.ReactNode;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'ACADEMY';
}
