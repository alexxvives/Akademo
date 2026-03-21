export interface MenuItem {
  label: string;
  href: string;
  icon?: JSX.Element;
  iconType?: 'chart' | 'book' | 'userPlus' | 'message' | 'clap' | 'fileText' | 'clipboard' | 'activity' | 'users' | 'botMessage' | 'handCoins' | 'star' | 'calendar' | 'home' | 'folderOpen';
  badge?: number;
  badgeColor?: string;
  matchPaths?: string[];
  showPulse?: boolean;
  group?: string;
}

export interface IconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

export interface SidebarProps {
  role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'ACADEMY';
  menuItems: MenuItem[];
  academyId: string | null;
  linkCopied: boolean;
  onCopyJoinLink: () => void;
  onCopyAcademyLink: () => void;
  onLogout: () => void;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  academyPaymentStatus?: string | null;
}
