'use client';

import { useRef, useState, type RefObject } from 'react';
import Link from 'next/link';
import {
  ChartNoAxesColumnIncreasingIcon,
  BookTextIcon,
  UserRoundPlusIcon,
  MessageSquareMoreIcon,
  ClapIcon,
  FileTextIcon,
  ClipboardCheckIcon,
  ActivityIcon,
} from '@/components/ui';
import { UsersIcon } from '@/components/ui/UsersIcon';
import { BotMessageSquareIcon } from '@/components/ui/BotMessageSquareIcon';
import { HandCoinsIcon } from '@/components/ui/HandCoinsIcon';
import { PenToolIcon, type PenToolIconHandle } from '@/components/ui/PenToolIcon';
import { HomeIcon, type HomeIconHandle } from '@/components/ui/HomeIcon';
import { CalendarDaysIcon } from '@/components/ui/CalendarDaysIcon';
import { FolderOpenIcon, type FolderOpenIconHandle } from '@/components/ui/FolderOpenIcon';
import type { MenuItem, IconHandle } from './SidebarTypes';

interface SidebarNavProps {
  menuItems: MenuItem[];
  role: string;
  pathname: string;
  collapsed?: boolean;
}

export function SidebarNav({ menuItems, role, pathname, collapsed: sidebarCollapsed = false }: SidebarNavProps) {
  const iconRefs = useRef<Record<string, { current: IconHandle | null }>>({});
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (label: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const renderIcon = (item: MenuItem) => {
    const iconType = item.iconType;

    if (!iconRefs.current[item.href]) {
      iconRefs.current[item.href] = { current: null };
    }
    const iconRef = iconRefs.current[item.href];

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
    } else if (iconType === 'handCoins') {
      return <HandCoinsIcon ref={iconRef} size={20} />;
    } else if (iconType === 'star') {
      return <PenToolIcon ref={iconRef as RefObject<PenToolIconHandle>} size={20} />;
    } else if (iconType === 'calendar') {
      return <CalendarDaysIcon ref={iconRef} size={20} />;
    } else if (iconType === 'home') {
      return <HomeIcon ref={iconRef as RefObject<HomeIconHandle>} size={20} />;
    } else if (iconType === 'folderOpen') {
      return <FolderOpenIcon ref={iconRef as RefObject<FolderOpenIconHandle>} size={20} />;
    } else if (item.icon) {
      return item.icon;
    }
    return null;
  };

  const groups: { label: string | null; items: MenuItem[] }[] = [];
  for (const item of menuItems) {
    const g = item.group ?? null;
    const last = groups[groups.length - 1];
    if (!last || last.label !== g) groups.push({ label: g, items: [item] });
    else last.items.push(item);
  }

  return (
    <nav className={sidebarCollapsed ? 'px-1 pb-3' : 'px-1.5 pb-3'}>
      {groups.map((group, gi) => {
        const isCollapsed = group.label ? collapsedGroups.has(group.label) : false;
        return (
          <div key={gi}>
            {group.label && !sidebarCollapsed && (
              <button
                onClick={() => toggleGroup(group.label!)}
                className={`w-full flex items-center justify-between px-3 pb-1 text-[10px] font-semibold tracking-widest text-gray-500 hover:text-gray-300 uppercase transition-colors ${gi > 0 ? 'pt-4' : 'pt-0'}`}
              >
                <span>{group.label}</span>
                <svg className={`w-3 h-3 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
            {sidebarCollapsed && gi > 0 && (
              <div className="mx-2 my-1 border-t border-gray-700/40" />
            )}
            {(!isCollapsed || sidebarCollapsed) && (
              <div className="space-y-0">
                {group.items.map((item) => {
                  const isDashboardRoute = item.href === `/dashboard/${role.toLowerCase()}`;
                  const matchesPath = item.matchPaths?.some((p: string) => pathname.startsWith(p));
                  const isActive = isDashboardRoute
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(item.href + '/') || matchesPath;

                  const showPulse = item.showPulse === true;
                  const iconRef = iconRefs.current[item.href];

                  const handleMouseEnter = () => {
                    if (iconRef && iconRef.current && typeof iconRef.current.startAnimation === 'function') {
                      iconRef.current.startAnimation();
                    }
                  };

                  const handleMouseLeave = () => {
                    if (iconRef && iconRef.current && typeof iconRef.current.stopAnimation === 'function') {
                      iconRef.current.stopAnimation();
                    }
                  };

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`relative flex items-center rounded-xl transition-all group ${
                        sidebarCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-3 py-3'
                      } ${
                        isActive
                          ? 'bg-gray-800/50 text-white'
                          : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                      }`}
                      title={sidebarCollapsed ? item.label : undefined}
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#b1e787] rounded-r-full" />
                      )}
                      <span className={`relative flex-shrink-0 ${
                        isActive ? 'text-[#b1e787]' : 'text-gray-400 group-hover:text-white'
                      }`}>
                        {renderIcon(item)}
                      </span>
                      {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                      {!sidebarCollapsed && showPulse && (
                        <span className="ml-auto w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                      )}
                      {!sidebarCollapsed && !showPulse && item.badge !== undefined && item.badge > 0 && (
                        <span className={`ml-auto ${item.badgeColor || 'bg-[#b2e788]'} text-[#1a1c29] text-xs font-bold px-2.5 py-1 rounded-full shadow-sm`}>
                          {item.badge}
                        </span>
                      )}
                      {sidebarCollapsed && showPulse && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
