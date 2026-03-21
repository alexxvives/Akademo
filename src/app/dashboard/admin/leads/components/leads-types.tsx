export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  academyName: string | null;
  monthlyEnrollments: string | null;
  teacherCount: string | null;
  subjectCount: string | null;
  message: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export const STATUS_OPTIONS = [
  { value: 'new', label: 'Nuevo', color: 'bg-blue-100 text-blue-800' },
  { value: 'follow_up', label: 'Seguimiento', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'onboarding', label: 'Onboarding', color: 'bg-purple-100 text-purple-800' },
  { value: 'accepted', label: 'Aceptado', color: 'bg-green-100 text-green-800' },
  { value: 'discard', label: 'Descartado', color: 'bg-gray-100 text-gray-600' },
];

export const FILTER_TABS = [
  { value: 'all', label: 'Todos' },
  { value: 'new', label: 'Nuevos' },
  { value: 'follow_up', label: 'Seguimiento' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'accepted', label: 'Aceptados' },
  { value: 'discard', label: 'Descartados' },
];

export function StatusBadge({ status }: { status: string }) {
  const opt = STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${opt.color}`}>
      {opt.label}
    </span>
  );
}

export function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'Z');
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
