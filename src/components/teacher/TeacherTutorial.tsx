'use client';

import { useState, useEffect, useCallback } from 'react';

interface Step {
  selector: string;
  title: string;
  description: string;
  icon: string;
}

const STEPS: Step[] = [
  {
    selector: 'a[href="/dashboard/teacher/subjects"]',
    title: 'Tus Asignaturas',
    description: 'Aquí gestionas todas tus asignaturas. Añade lecciones, sube vídeos y organiza el temario de cada clase.',
    icon: '📚',
  },
  {
    selector: 'a[href="/dashboard/teacher/streams"]',
    title: 'Clases en Directo',
    description: 'Consulta el historial de tus clases en directo grabadas. Las nuevas clases se crean desde cada asignatura.',
    icon: '🎥',
  },
  {
    selector: 'a[href="/dashboard/teacher/assignments"]',
    title: 'Ejercicios y Tareas',
    description: 'Crea ejercicios, revisa entregas de los alumnos y asigna calificaciones con comentarios.',
    icon: '📝',
  },
  {
    selector: 'a[href="/dashboard/teacher/progress"]',
    title: 'Progreso de Alumnos',
    description: 'Consulta el tiempo de visualización, lecciones completadas y actividad reciente de cada alumno.',
    icon: '📊',
  },
  {
    selector: 'a[href="/dashboard/teacher/calendar"]',
    title: 'Calendario',
    description: 'Planifica tu agenda: programa clases, establece fechas de entrega y mantén todo organizado en un solo lugar.',
    icon: '📅',
  },
  {
    selector: 'button[title*="invitaci"], button[title*="Copiar"]',
    title: 'Enlace de Invitación',
    description: 'Comparte este enlace con tus alumnos para que puedan unirse directamente a tus asignaturas.',
    icon: '🔗',
  },
];

const STORAGE_KEY = 'akademo_teacher_tutorial_v1';
const PAD = 8;

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function getTooltipStyle(
  rect: SpotlightRect,
  viewportW: number,
  viewportH: number
): React.CSSProperties {
  const TOOLTIP_W = 340;
  const TOOLTIP_H = 290; // estimated max height
  const TOOLTIP_GAP = 20;

  const clampTop = (t: number) => Math.max(12, Math.min(t, viewportH - TOOLTIP_H - 12));
  const clampLeft = (l: number) => Math.max(12, Math.min(l, viewportW - TOOLTIP_W - 12));

  // Try to place tooltip to the right of the spotlight
  const rightX = rect.left + rect.width + TOOLTIP_GAP;
  if (rightX + TOOLTIP_W < viewportW) {
    return { position: 'fixed', left: rightX, top: clampTop(rect.top), width: TOOLTIP_W };
  }

  // Fall back to below
  const belowY = rect.top + rect.height + TOOLTIP_GAP;
  if (belowY + TOOLTIP_H < viewportH) {
    return { position: 'fixed', top: belowY, left: clampLeft(rect.left), width: TOOLTIP_W };
  }

  // Above
  const aboveY = rect.top - TOOLTIP_GAP - TOOLTIP_H;
  return { position: 'fixed', top: clampTop(aboveY), left: clampLeft(rect.left), width: TOOLTIP_W };
}

export function TeacherTutorial() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
  const [viewportW, setViewportW] = useState(0);
  const [viewportH, setViewportH] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(STORAGE_KEY)) return;
    // Only show on desktop (lg breakpoint: >= 1024px) where sidebar is visible
    if (window.innerWidth < 1024) return;
    const t = setTimeout(() => {
      setViewportW(window.innerWidth);
      setViewportH(window.innerHeight);
      setVisible(true);
    }, 900);
    return () => clearTimeout(t);
  }, []);

  // Recompute bounding rect when step changes or window resizes
  useEffect(() => {
    if (!visible) return;
    const compute = () => {
      const el = document.querySelector(STEPS[step].selector);
      if (el) {
        const r = el.getBoundingClientRect();
        setSpotlightRect({
          top: r.top - PAD,
          left: r.left - PAD,
          width: r.width + PAD * 2,
          height: r.height + PAD * 2,
        });
        setViewportW(window.innerWidth);
        setViewportH(window.innerHeight);
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [step, visible]);

  const dismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  }, []);

  const next = useCallback(() => {
    if (step >= STEPS.length - 1) { dismiss(); return; }
    setStep(s => s + 1);
  }, [step, dismiss]);

  const prev = useCallback(() => setStep(s => Math.max(0, s - 1)), []);

  if (!visible || !spotlightRect) return null;

  const s = STEPS[step];
  const hl = spotlightRect;
  const tooltipStyle = getTooltipStyle(hl, viewportW, viewportH);

  return (
    <div className="fixed inset-0 z-[9000] pointer-events-none">
      {/* 4 dark overlay quadrants */}
      {/* Top */}
      <div
        className="absolute bg-black/60"
        style={{ top: 0, left: 0, right: 0, height: Math.max(0, hl.top) }}
      />
      {/* Bottom */}
      <div
        className="absolute bg-black/60"
        style={{ top: hl.top + hl.height, left: 0, right: 0, bottom: 0 }}
      />
      {/* Left */}
      <div
        className="absolute bg-black/60"
        style={{ top: hl.top, left: 0, width: Math.max(0, hl.left), height: hl.height }}
      />
      {/* Right */}
      <div
        className="absolute bg-black/60"
        style={{ top: hl.top, left: hl.left + hl.width, right: 0, height: hl.height }}
      />

      {/* Spotlight border */}
      <div
        className="absolute rounded-xl ring-2 ring-[#b1e787] ring-offset-0"
        style={{ top: hl.top, left: hl.left, width: hl.width, height: hl.height }}
      />

      {/* Tooltip card — pointer-events-auto so buttons work */}
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-5 pointer-events-auto"
        style={tooltipStyle}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-[#b1e787]/20 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
            {s.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#5a8a30] uppercase tracking-wide mb-0.5">
              Paso {step + 1} de {STEPS.length}
            </p>
            <h3 className="text-base font-bold text-gray-900 leading-tight">{s.title}</h3>
          </div>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed mb-5">{s.description}</p>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5 mb-4">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-5 bg-[#b1e787]' : i < step ? 'w-2 bg-[#b1e787]/50' : 'w-2 bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={dismiss}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-1"
          >
            Saltar tutorial
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={prev}
                className="px-3.5 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                ← Atrás
              </button>
            )}
            <button
              onClick={next}
              className="px-4 py-2 text-sm font-semibold bg-[#b1e787] hover:bg-[#9dd46f] text-gray-900 rounded-xl transition-colors shadow-sm"
            >
              {step === STEPS.length - 1 ? '¡Listo! 🎉' : 'Siguiente →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
