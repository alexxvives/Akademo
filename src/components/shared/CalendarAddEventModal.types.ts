export interface ClassOption {
  id: string;
  name: string;
  university?: string | null;
  carrera?: string | null;
}

export interface CalendarAddEventModalProps {
  date: Date;
  classes: ClassOption[];
  onClose: () => void;
  disabled?: boolean; // disables saving (e.g. demo mode)
  editEvent?: { id: string; title: string; type: string; classId?: string; extra?: string; location?: string; startTime?: string; zoomLink?: string; zoomMeetingId?: string };
  onSaved: (event: {
    id: string;
    title: string;
    type: 'physicalClass' | 'scheduledStream';
    eventDate: string;
    notes?: string | null;
    classId?: string | null;
    location?: string | null;
    startTime?: string | null;
    zoomLink?: string | null;
    zoomMeetingId?: string | null;
  }) => void;
}

export function pad(n: number) { return String(n).padStart(2, '0'); }
