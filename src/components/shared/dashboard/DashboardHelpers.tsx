'use client';

import { useAnimatedNumber } from '@/hooks';

export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const animatedValue = useAnimatedNumber(value);
  return <div className={className}>{animatedValue.toLocaleString('es-ES')}</div>;
}

export function AnimatedCurrency({ value, className }: { value: number; className?: string }) {
  const animatedCents = useAnimatedNumber(Math.round(value * 100));
  const display = new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(animatedCents / 100);
  return <div className={className}>{display}€</div>;
}

export function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  const paths: Record<string, string> = {
    chart: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    users: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    star: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
    bolt: 'M13 10V3L4 14h7v7l9-11h-7z',
  };
  return (
    <div className="flex flex-col items-center justify-center h-40 text-gray-400">
      <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={paths[icon] || paths.chart} />
      </svg>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
    </div>
  );
}

export function TooltipStat({ value, color, label, tooltip }: { value: number; color: string; label: string; tooltip: string }) {
  const colorClass = color === 'green' ? 'text-green-600' : color === 'amber' ? 'text-amber-600' : 'text-red-600';
  return (
    <div className={`flex-1 text-center group/stat relative cursor-help`}>
      <AnimatedNumber value={value} className={`text-lg sm:text-2xl font-bold ${colorClass}`} />
      <div className="text-xs text-gray-500">{label}</div>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-slate-200 text-xs rounded-lg shadow-xl border border-slate-700 opacity-0 invisible group-hover/stat:opacity-100 group-hover/stat:visible transition-all duration-200 whitespace-nowrap z-20">
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-slate-800 border-b border-r border-slate-700 rotate-45"></div>
        {tooltip}
      </div>
    </div>
  );
}
