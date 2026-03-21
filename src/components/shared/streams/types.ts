export interface Stream {
  id: string;
  title: string;
  classId: string;
  classSlug?: string;
  className: string;
  teacherName?: string;
  academyName?: string;
  academyId?: string;
  status: string;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  zoomMeetingId: string | null;
  zoomStartUrl?: string;
  zoomLink?: string;
  dailyRoomName?: string | null;
  recordingId: string | null;
  participantCount?: number | null;
  participantsFetchedAt?: string | null;
  bunnyStatus?: number | null;
  duration?: number;
  validRecordingId?: string;
  classDeleted?: boolean;
}

export interface Academy {
  id: string;
  name: string;
}

export interface ClassOption {
  id: string;
  name: string;
  academyId?: string;
  startDate?: string;
}

export interface StreamsPageProps {
  role: 'ACADEMY' | 'ADMIN' | 'TEACHER';
}
