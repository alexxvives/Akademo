'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { apiClient } from '@/lib/api-client';
import { parseDateString } from '@/lib/formatters';

export interface AcademicPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  isCurrent: number;
}

interface PeriodContextValue {
  periods: AcademicPeriod[];
  /** 'all' means no date filter — show everything */
  activePeriodId: string;
  activePeriod: AcademicPeriod | null;
  setActivePeriodId: (id: string) => void;
  /** Returns true if the given ISO date string falls within the active period (always true when 'all') */
  isClassInPeriod: (date: string | null | undefined) => boolean;
}

const PeriodContext = createContext<PeriodContextValue>({
  periods: [],
  activePeriodId: 'all',
  activePeriod: null,
  setActivePeriodId: () => {},
  isClassInPeriod: () => true,
});

const LS_KEY = 'akademo_active_period';

export function PeriodProvider({
  children,
  role,
}: {
  children: ReactNode;
  role: string;
}) {
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  // Read saved preference immediately from localStorage so the correct period is
  // available on the very first render — before the API call completes. This prevents
  // the dashboard from briefly showing unfiltered payment-status numbers on refresh.
  const [activePeriodId, setActivePeriodIdState] = useState<string>(() => {
    if (typeof window === 'undefined') return 'all';
    try { return localStorage.getItem(LS_KEY) ?? 'all'; } catch { return 'all'; }
  });

  useEffect(() => {
    if (role !== 'ACADEMY' && role !== 'TEACHER') return;

    apiClient('/academic-years')
      .then((r) => r.json())
      .then((result: { success: boolean; data?: AcademicPeriod[] }) => {
        if (!result.success || !Array.isArray(result.data)) return;
        const data = result.data;
        // Sort by startDate descending so data[0] is always the most recent period
        data.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
        setPeriods(data);

        // Validate the saved preference — if the saved ID no longer exists in the
        // API response, fall back to the most recent period.
        try {
          const saved = localStorage.getItem(LS_KEY);
          if (saved === 'all') return; // 'all' is always valid
          if (saved && data.find((p) => p.id === saved)) return; // still valid
        } catch { /* ignore */ }

        // Saved ID is missing or invalid — default to most recent
        const defaultId = data.length > 0 ? data[0].id : 'all';
        setActivePeriodIdState(defaultId);
        try { localStorage.setItem(LS_KEY, defaultId); } catch { /* ignore */ }
      })
      .catch(() => { /* silent — no periods yet */ });
  }, [role]);

  const setActivePeriodId = (id: string) => {
    setActivePeriodIdState(id);
    try { localStorage.setItem(LS_KEY, id); } catch { /* ignore */ }
  };

  const activePeriod = periods.find((p) => p.id === activePeriodId) ?? null;

  const isClassInPeriod = (date: string | null | undefined): boolean => {
    if (activePeriodId === 'all' || !activePeriod) return true;
    if (!date) return false;
    const d = parseDateString(date);
    const start = new Date(activePeriod.startDate);
    if (d < start) return false;
    if (activePeriod.endDate) {
      const end = new Date(activePeriod.endDate);
      end.setHours(23, 59, 59, 999);
      if (d > end) return false;
    }
    return true;
  };

  return (
    <PeriodContext.Provider value={{ periods, activePeriodId, activePeriod, setActivePeriodId, isClassInPeriod }}>
      {children}
    </PeriodContext.Provider>
  );
}

export const usePeriod = () => useContext(PeriodContext);
