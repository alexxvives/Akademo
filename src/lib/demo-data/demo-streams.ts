import { DEMO_VIDEO_GUID } from './types';
import type { DemoStream } from './types';

export function generateDemoStreams(): DemoStream[] {
  // Base date: 2026-02-10 00:00:00
  const baseDate = new Date('2026-02-10T00:00:00Z');
  
  // Helper to calculate dates relative to base
  const daysAgo = (days: number, hoursOffset = 0, minutesOffset = 0) => {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - days);
    date.setHours(date.getHours() + hoursOffset);
    date.setMinutes(date.getMinutes() + minutesOffset);
    return date.toISOString();
  };
  
  return [
    {
      id: 'demo-stream1',
      title: 'Clase en Vivo - Introducción a React',
      className: 'Programación Web',
      teacherName: 'Carlos Rodríguez',
      participantCount: 11,
      startedAt: daysAgo(7), // Feb 3, 00:00
      endedAt: daysAgo(7, 1, 15), // Feb 3, 01:15 (75 min duration)
      createdAt: daysAgo(7, -1), // Feb 2, 23:00 (created 1h before)
      status: 'ended',
      duration: 75,
      recordingId: DEMO_VIDEO_GUID,
      classId: 'demo-c1',
      participantsData: JSON.stringify({
        totalRecords: 11,
        uniqueCount: 11,
        participants: [
          { name: 'Juan García', email: 'juan@example.com', joinTime: daysAgo(7), duration: 4500 },
          { name: 'María López', email: 'maria@example.com', joinTime: daysAgo(7, 0, 5), duration: 4200 },
          { name: 'Carlos Martínez', email: 'carlos@example.com', joinTime: daysAgo(7, 0, 10), duration: 4100 },
        ]
      }),
    },
    {
      id: 'demo-stream2',
      title: 'Repaso de Matemáticas',
      className: 'Matemáticas Avanzadas',
      teacherName: 'María García',
      participantCount: 20,
      startedAt: daysAgo(5), // Feb 5, 00:00
      endedAt: daysAgo(5, 0, 50), // Feb 5, 00:50 (50 min duration)
      createdAt: daysAgo(5, -0.5), // Feb 4, 23:30 (created 30m before)
      status: 'ended',
      duration: 50,
      recordingId: DEMO_VIDEO_GUID,
      classId: 'demo-c2',
      participantsData: JSON.stringify({ totalRecords: 20, uniqueCount: 20, participants: [{ name: 'Ana Rodríguez', email: 'ana@example.com', duration: 3000 }] }),
    },
    {
      id: 'demo-stream3',
      title: 'Diseño de Logotipos',
      className: 'Diseño Gráfico',
      teacherName: 'Ana Martínez',
      participantCount: 32,
      startedAt: daysAgo(3), // Feb 7, 00:00
      endedAt: daysAgo(3, 2), // Feb 7, 02:00 (120 min duration)
      createdAt: daysAgo(3, -0.75), // Feb 6, 23:15 (created 45m before)
      status: 'ended',
      duration: 120,
      recordingId: DEMO_VIDEO_GUID,
      classId: 'demo-c3',
      participantsData: JSON.stringify({ totalRecords: 32, uniqueCount: 32, participants: [{ name: 'Luis Fernández', email: 'luis@example.com', duration: 7200 }] }),
    },
    // Live stream - EN VIVO right now
    {
      id: 'demo-stream-live',
      title: 'Clase En Vivo - Programación Avanzada',
      className: 'Programación Web',
      teacherName: 'Carlos Rodríguez',
      participantCount: 8,
      startedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // Started 15 minutes ago
      endedAt: '', // Empty for live stream
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // Created 30 minutes ago
      status: 'active',
      duration: 0,
      recordingId: '',
      classId: 'demo-c1',
      participantsData: JSON.stringify({ totalRecords: 8, uniqueCount: 8, participants: [{ name: 'Pedro Sánchez', email: 'pedro@example.com', duration: 900 }] }),
    },
    {
      id: 'demo-stream4',
      title: 'Sesión de Consultas',
      className: 'Programación Web',
      teacherName: 'Carlos Rodríguez',
      participantCount: 10,
      startedAt: daysAgo(2), // Feb 8, 00:00
      endedAt: daysAgo(2, 0, 45), // Feb 8, 00:45 (45 min duration)
      createdAt: daysAgo(2, -0.33), // Feb 7, 23:40 (created 20m before)
      status: 'ended',
      duration: 45,
      recordingId: DEMO_VIDEO_GUID,
      classId: 'demo-c1',
      participantsData: JSON.stringify({ totalRecords: 10, uniqueCount: 10, participants: [{ name: 'Pedro Sánchez', email: 'pedro@example.com', duration: 2700 }] }),
    },
    {
      id: 'demo-stream5',
      title: 'Clase Especial',
      className: 'Diseño Gráfico',
      teacherName: 'Ana Martínez',
      participantCount: 35,
      startedAt: daysAgo(1), // Feb 9, 00:00
      endedAt: daysAgo(1, 1, 5), // Feb 9, 01:05 (65 min duration)
      createdAt: daysAgo(1, -0.25), // Feb 8, 23:45 (created 15m before)
      status: 'ended',
      duration: 65,
      recordingId: DEMO_VIDEO_GUID,
      classId: 'demo-c3',
      participantsData: JSON.stringify({ totalRecords: 35, uniqueCount: 35, participants: [{ name: 'Laura Gómez', email: 'laura@example.com', duration: 3900 }] }),
    },
  ];
}
