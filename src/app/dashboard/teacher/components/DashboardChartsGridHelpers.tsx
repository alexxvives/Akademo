import { useAnimatedNumber } from '@/hooks';
import { EnrolledStudent, RatingsData } from '@/hooks/useTeacherDashboard';

export type { EnrolledStudent, RatingsData };

export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const animatedValue = useAnimatedNumber(value);
  return <div className={className}>{animatedValue}</div>;
}

export interface DashboardChartsGridProps {
  filteredStudents: EnrolledStudent[];
  streamStats: { total: number; avgParticipants: number; thisMonth: number; totalHours: number; totalMinutes: number };
  classWatchTime: { hours: number; minutes: number };
  ratingsData: RatingsData | null;
  selectedClass: string;
  paymentStatusCounts: { alDia: number; atrasados: number; uniqueAlDia: number; uniqueAtrasados: number };
}
