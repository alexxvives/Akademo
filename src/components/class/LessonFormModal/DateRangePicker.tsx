'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface DateRangePickerProps {
  fromDate: string; fromTime: string;
  untilDate: string; untilTime: string;
  onFromDateChange: (v: string) => void; onFromTimeChange: (v: string) => void;
  onUntilDateChange: (v: string) => void; onUntilTimeChange: (v: string) => void;
}

function pad(n: number) { return String(n).padStart(2, '0'); }
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const WDS = ['Lu','Ma','Mi','Ju','Vi','Sa','Do'];

function MiniTimePicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const hRef = useRef<HTMLDivElement>(null);
  const mRef = useRef<HTMLDivElement>(null);
  const [h, m] = (value || '09:00').split(':').map(Number);
  const hrs  = Array.from({ length: 24 }, (_, i) => i);
  const mins = Array.from({ length: 12 }, (_, i) => i * 5);
  useEffect(() => {
    requestAnimationFrame(() => {
      (hRef.current?.querySelector('[data-s]') as HTMLElement | null)?.scrollIntoView({ block: 'center', behavior: 'instant' });
      (mRef.current?.querySelector('[data-s]') as HTMLElement | null)?.scrollIntoView({ block: 'center', behavior: 'instant' });
    });
  }, []);
  return (
    <div>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <div className="flex border border-gray-200 rounded-lg overflow-hidden" style={{ height: 88 }}>
        <div ref={hRef} className="flex-1 overflow-y-auto">
          {hrs.map(hh => (
            <button key={hh} type="button" data-s={hh === h ? '' : undefined}
              onClick={() => onChange(`${pad(hh)}:${pad(m)}`)}
              className={`w-full py-1 text-xs text-center transition-colors ${hh === h ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
              {pad(hh)}
            </button>
          ))}
        </div>
        <div className="w-px bg-gray-100 self-stretch flex-shrink-0" />
        <div ref={mRef} className="flex-1 overflow-y-auto">
          {mins.map(mm => (
            <button key={mm} type="button" data-s={mm === m ? '' : undefined}
              onClick={() => onChange(`${pad(h)}:${pad(mm)}`)}
              className={`w-full py-1 text-xs text-center transition-colors ${mm === m ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
              {pad(mm)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DateRangePicker({ fromDate, fromTime, untilDate, untilTime, onFromDateChange, onFromTimeChange, onUntilDateChange, onUntilTimeChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<'from' | 'until'>('from');
  const [hovered, setHovered] = useState<string | null>(null);
  const [dropPos, setDropPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  const init = fromDate ? new Date(fromDate + 'T12:00:00') : today;
  const [vy, setVy] = useState(init.getFullYear());
  const [vm, setVm] = useState(init.getMonth());

  useEffect(() => {
    if (!open) return;
    const fn = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!triggerRef.current?.contains(t) && !dropdownRef.current?.contains(t)) setOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [open]);

  const goMonth = (d: -1 | 1) => {
    let mo = vm + d, yr = vy;
    if (mo < 0) { mo = 11; yr--; } if (mo > 11) { mo = 0; yr++; }
    setVm(mo); setVy(yr);
  };

  const fdow = (() => { const d = new Date(vy, vm, 1).getDay() - 1; return d < 0 ? 6 : d; })();
  const dim = new Date(vy, vm + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(fdow).fill(null), ...Array.from({ length: dim }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const getRange = () => {
    if (stage === 'until' && fromDate && hovered)
      return hovered >= fromDate ? { rF: fromDate, rU: hovered } : { rF: hovered, rU: fromDate };
    return { rF: fromDate, rU: untilDate };
  };

  const click = (ds: string) => {
    if (stage === 'from') { onFromDateChange(ds); onUntilDateChange(''); setStage('until'); }
    else {
      if (ds <= fromDate) { onUntilDateChange(fromDate); onFromDateChange(ds); }
      else onUntilDateChange(ds);
      setStage('from');
    }
  };

  const styles = (ds: string) => {
    const { rF, rU } = getRange();
    const hr = !!(rF && rU && rF !== rU);
    const isF = !!(rF && ds === rF), isU = !!(rU && ds === rU);
    const mid = !!(rF && rU && ds > rF && ds < rU);
    const dot = untilDate ? 'bg-blue-600 text-white font-semibold' : 'bg-blue-400 text-white';
    const todayRing = ds === todayStr ? ' ring-1 ring-inset ring-blue-400' : '';
    if (isF && hr) return { s: true,  e: false, mid: false, circle: dot };
    if (isU && hr) return { s: false, e: true,  mid: false, circle: dot };
    if (isF || isU) return { s: false, e: false, mid: false, circle: 'bg-blue-600 text-white font-semibold' };
    if (mid) return { s: false, e: false, mid: true, circle: 'text-blue-900' };
    return { s: false, e: false, mid: false, circle: `text-gray-700 hover:bg-gray-100${todayRing}` };
  };

  const fmt = (d: string) => d ? new Date(d + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : null;

  const openAt = (s: 'from' | 'until') => {
    setStage(s);
    const d = s === 'from' ? fromDate : (untilDate || fromDate);
    if (d) { const dt = new Date(d + 'T12:00:00'); setVy(dt.getFullYear()); setVm(dt.getMonth()); }
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setDropPos({ top: r.bottom + 6, left: r.left, width: Math.max(r.width, 320) });
    }
    setOpen(true);
  };

  const dropdown = open && dropPos && (
    <div
      ref={dropdownRef}
      style={{ position: 'fixed', top: dropPos.top, left: dropPos.left, width: Math.min(dropPos.width, 360), zIndex: 9999 }}
      className="bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
    >
      {/* Stage pills */}
      <div className="flex items-center gap-1.5 px-4 pt-3 pb-2">
        <button type="button" onClick={() => setStage('from')}
          className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors ${stage === 'from' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
          Inicio
        </button>
        <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        <button type="button" onClick={() => { if (fromDate) setStage('until'); }}
          className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors ${stage === 'until' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
          Fin
        </button>
        <span className="ml-auto text-[11px] text-gray-400">{stage === 'from' ? 'Elige inicio' : 'Elige fin'}</span>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between px-4 pb-1">
        <button type="button" onClick={() => goMonth(-1)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="text-sm font-semibold text-gray-800">{MONTHS[vm]} {vy}</span>
        <button type="button" onClick={() => goMonth(1)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 px-3">
        {WDS.map(d => <div key={d} className="text-[10px] font-semibold text-gray-400 text-center py-1 uppercase">{d}</div>)}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 px-3 pb-2">
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} className="h-8" />;
          const ds = `${vy}-${pad(vm + 1)}-${pad(day)}`;
          const { s, e, mid, circle } = styles(ds);
          return (
            <div key={ds} className={`relative flex items-center justify-center h-8 ${mid ? 'bg-blue-100' : ''}`}
              onMouseEnter={() => setHovered(ds)} onMouseLeave={() => setHovered(null)}>
              {s && <span className="absolute inset-y-1 left-1/2 right-0 bg-blue-100" />}
              {e && <span className="absolute inset-y-1 right-1/2 left-0 bg-blue-100" />}
              <button type="button" onClick={() => click(ds)}
                className={`relative z-10 w-7 h-7 flex items-center justify-center rounded-full text-sm transition-colors ${circle}`}>
                {day}
              </button>
            </div>
          );
        })}
      </div>

      {/* Inline time pickers */}
      <div className="border-t border-gray-100 px-4 py-3 grid grid-cols-2 gap-3">
        <MiniTimePicker label="Hora inicio" value={fromTime} onChange={onFromTimeChange} />
        <MiniTimePicker label="Hora fin"    value={untilTime} onChange={onUntilTimeChange} />
      </div>
    </div>
  );

  return (
    <div ref={triggerRef} className="relative">
      {/* Trigger bar */}
      <div className="flex items-stretch border border-gray-200 rounded-xl overflow-hidden bg-white hover:border-gray-300 transition-colors">
        <button type="button" onClick={() => openAt('from')}
          className={`flex-1 flex items-center gap-2.5 px-3.5 py-2.5 transition-colors ${open && stage === 'from' ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
          <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <div className="text-left min-w-0">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Desde</p>
            {fromDate
              ? <p className="text-sm font-medium text-gray-900">{fmt(fromDate)} <span className="font-normal text-gray-500">· {fromTime}</span></p>
              : <p className="text-sm text-gray-400">Selecciona fecha</p>}
          </div>
        </button>

        <div className="w-px bg-gray-200 self-stretch flex-shrink-0" />
        <div className="flex items-center px-2 text-gray-300 flex-shrink-0">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
        </div>
        <div className="w-px bg-gray-200 self-stretch flex-shrink-0" />

        <button type="button" onClick={() => openAt('until')}
          className={`flex-1 flex items-center gap-2.5 px-3.5 py-2.5 transition-colors ${open && stage === 'until' ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
          <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <div className="text-left min-w-0">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Hasta</p>
            {untilDate
              ? <p className="text-sm font-medium text-gray-900">{fmt(untilDate)} <span className="font-normal text-gray-500">· {untilTime}</span></p>
              : <p className="text-sm text-gray-400">Selecciona fecha</p>}
          </div>
        </button>
      </div>

      {typeof document !== 'undefined' && dropdown && createPortal(dropdown, document.body)}
    </div>
  );
}
