import React from 'react';

export interface Step {
  selector: string;
  title: string;
  description: string;
  icon: string;
}

export const STEPS: Step[] = [
  {
    selector: 'a[href="/dashboard/student/subjects"]',
    title: 'Tus Asignaturas',
    description:
      'Aquí tienes acceso a todas tus clases. Entra en cada asignatura para ver las lecciones, vídeos y material del profesor.',
    icon: '📚',
  },
  {
    selector: 'a[href="/dashboard/student/assignments"]',
    title: 'Ejercicios y Tareas',
    description:
      'Aquí recibirás los ejercicios y exámenes de tus profesores. Entrega tus trabajos y consulta las correcciones y calificaciones.',
    icon: '📝',
  },
  {
    selector: 'a[href="/dashboard/student/pagos"]',
    title: 'Mis Pagos',
    description:
      'Gestiona tus pagos y consulta el estado de tus cuotas. Si tienes algún pago pendiente aparecerá aquí.',
    icon: '💳',
  },
  {
    selector: 'a[href="/dashboard/student/calendar"]',
    title: 'Calendario',
    description:
      'Tu agenda de clases. Aquí verás las clases programadas, las clases en directo y las fechas de entrega de ejercicios.',
    icon: '📅',
  },
];

export const STORAGE_KEY = 'akademo_student_tutorial_v1';
export const PAD = 8;

export interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function getTooltipStyle(
  rect: SpotlightRect,
  viewportW: number,
  viewportH: number
): React.CSSProperties {
  const TOOLTIP_W = 400;
  const TOOLTIP_H = 270;
  const TOOLTIP_GAP = 20;

  const clampTop = (t: number) => Math.max(12, Math.min(t, viewportH - TOOLTIP_H - 12));
  const clampLeft = (l: number) => Math.max(12, Math.min(l, viewportW - TOOLTIP_W - 12));

  const rightX = rect.left + rect.width + TOOLTIP_GAP;
  if (rightX + TOOLTIP_W < viewportW) {
    return { position: 'fixed', left: rightX, top: clampTop(rect.top), width: TOOLTIP_W };
  }

  const belowY = rect.top + rect.height + TOOLTIP_GAP;
  if (belowY + TOOLTIP_H < viewportH) {
    return { position: 'fixed', top: belowY, left: clampLeft(rect.left), width: TOOLTIP_W };
  }

  const aboveY = rect.top - TOOLTIP_GAP - TOOLTIP_H;
  return { position: 'fixed', top: clampTop(aboveY), left: clampLeft(rect.left), width: TOOLTIP_W };
}
