import { generateDemoClasses, generateDemoStudents, generateDemoLessonRatings, generateDemoStreams, generateDemoStats } from '@/lib/demo-data';
import type { Membership, Class, EnrolledStudent, PendingEnrollment, RatingsData, StreamStats, ClassWatchTime, PaymentStatusCounts } from './teacher-dashboard-types';

interface DemoTeacherData {
  memberships: Membership[];
  classes: Class[];
  enrolledStudents: EnrolledStudent[];
  pendingEnrollments: PendingEnrollment[];
  ratingsData: RatingsData;
  rejectedCount: number;
  streamStats: StreamStats;
  classWatchTime: ClassWatchTime;
  paymentStatusCounts: PaymentStatusCounts;
}

export function buildDemoTeacherData(): DemoTeacherData {
  const demoClasses = generateDemoClasses();
  const demoStudentsRaw = generateDemoStudents();
  const demoRatings = generateDemoLessonRatings();
  const demoStreams = generateDemoStreams();
  const demoStats = generateDemoStats();

  const memberships: Membership[] = [{
    id: 'demo-m1',
    status: 'APPROVED',
    academyName: 'Academia Demo',
    academyDescription: 'Academia de demostración',
    requestedAt: new Date().toISOString(),
  }];

  const classes: Class[] = demoClasses.map(c => ({
    id: c.id,
    name: c.name,
    slug: c.name.toLowerCase().replace(/\s+/g, '-'),
    description: c.description || null,
    academyName: 'Academia Demo',
    enrollmentCount: c.studentCount || 0,
  }));

  const classNameToId: Record<string, string> = {
    'Programación Web': 'demo-c1',
    'Matemáticas Avanzadas': 'demo-c2',
    'Física Cuántica': 'demo-c4',
    'Diseño Gráfico': 'demo-c3',
  };
  const seen = new Set<string>();
  const enrolledStudents: EnrolledStudent[] = demoStudentsRaw
    .map(s => ({
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      email: s.email,
      classId: classNameToId[s.className] || 'demo-c1',
      className: s.className,
      lessonsCompleted: Math.floor(Math.random() * 5) + 2,
      totalLessons: 10,
      lastActive: s.lastLoginAt || null,
    }))
    .filter(s => {
      const key = `${s.email}__${s.classId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  const streamsWithParticipants = demoStreams.filter(s => s.participantCount > 0);
  const totalParticipants = streamsWithParticipants.reduce((sum, s) => sum + s.participantCount, 0);
  const streamStats: StreamStats = {
    total: demoStreams.length,
    avgParticipants: streamsWithParticipants.length > 0 ? Math.round(totalParticipants / streamsWithParticipants.length) : 0,
    thisMonth: demoStats.totalStreams,
    totalHours: demoStats.totalStreamHours,
    totalMinutes: 0,
  };

  return {
    memberships,
    classes,
    enrolledStudents,
    pendingEnrollments: [],
    ratingsData: demoRatings,
    rejectedCount: 0,
    streamStats,
    classWatchTime: { hours: 45, minutes: 30 },
    paymentStatusCounts: { alDia: 18, atrasados: 4, uniqueAlDia: 15, uniqueAtrasados: 3 },
  };
}
