export interface Step {
  selector: string;
  title: string;
  description: string;
  icon: string;
}

export const STEPS: Step[] = [
  {
    selector: 'a[href="/dashboard/teacher/subjects"]',
    title: 'Tus Asignaturas',
    description:
      'Aquí gestionas todas tus asignaturas. Añade lecciones, sube vídeos y organiza el temario de cada clase.',
    icon: '📚',
  },
  {
    selector: 'a[href="/dashboard/teacher/streams"]',
    title: 'Clases en Directo',
    description:
      'Consulta el historial de tus clases en directo grabadas. Las nuevas clases se crean desde cada asignatura.',
    icon: '🎥',
  },
  {
    selector: 'a[href="/dashboard/teacher/assignments"]',
    title: 'Ejercicios y Tareas',
    description:
      'Crea ejercicios, revisa entregas de los alumnos y asigna calificaciones con comentarios.',
    icon: '📝',
  },
  {
    selector: 'a[href="/dashboard/teacher/progress"]',
    title: 'Progreso de Alumnos',
    description:
      'Consulta el tiempo de visualización, lecciones completadas y actividad reciente de cada alumno.',
    icon: '📊',
  },
  {
    selector: 'a[href="/dashboard/teacher/calendar"]',
    title: 'Calendario',
    description:
      'Planifica tu agenda: programa clases, establece fechas de entrega y mantén todo organizado en un solo lugar.',
    icon: '📅',
  },
  {
    selector: 'button[title*="invitaci"], button[title*="Copiar"]',
    title: 'Enlace de Invitación',
    description:
      'Comparte este enlace con tus alumnos para que puedan unirse directamente a tus asignaturas.',
    icon: '🔗',
  },
];

export const STORAGE_KEY = 'akademo_teacher_tutorial_v1';
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
  const TOOLTIP_W = 340;
  const TOOLTIP_H = 290;
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
