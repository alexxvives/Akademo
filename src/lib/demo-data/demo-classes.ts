import { DEMO_VIDEO_GUID } from './types';
import type { DemoZoomAccount, DemoClass, DemoLesson } from './types';
import { generateDemoStudents } from './demo-students';

export function generateDemoZoomAccounts(): DemoZoomAccount[] {
  return [
    {
      id: 'demo-zoom-1',
      accountName: 'info@akademo-edu.com',
      accountId: 'demo-zoom-account-1',
    },
  ];
}

export function generateDemoClasses(): DemoClass[] {
  const now = new Date().toISOString();
  
  const students = generateDemoStudents();
  const classNameToId: Record<string, string> = {
    'Programación Web': 'demo-c1',
    'Matemáticas Avanzadas': 'demo-c2',
    'Física Cuántica': 'demo-c4',
    'Diseño Gráfico': 'demo-c3',
  };
  
  const counts: Record<string, number> = {};
  students.forEach(s => {
    const classId = classNameToId[s.className] || 'demo-c1';
    counts[classId] = (counts[classId] || 0) + 1;
  });
  
  const demoAvgRating = 4.0;
  
  return [
    {
      id: 'demo-c1',
      name: 'Programación Web',
      description: 'Aprende React, Next.js y TypeScript desde cero hasta nivel avanzado',
      teacherName: 'Carlos Rodríguez',
      teacherId: 'demo-t2',
      studentCount: counts['demo-c1'] || 0,
      videoCount: 8,
      documentCount: 5,
      price: 49.99,
      monthlyPrice: 49.99,
      oneTimePrice: null,
      currency: 'EUR',
      createdAt: now,
      startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      avgRating: demoAvgRating,
      zoomAccountId: 'demo-zoom-1',
      zoomAccountName: 'info@akademo-edu.com',
      whatsappGroupLink: 'https://chat.whatsapp.com/EVwr6bNsKng5Rk965ZuM4U',
      maxStudents: 50,
      university: 'UPC',
      carrera: 'Ingeniería Informática',
    },
    {
      id: 'demo-c2',
      name: 'Matemáticas Avanzadas',
      description: 'Cálculo diferencial e integral con aplicaciones prácticas',
      teacherName: 'María García',
      teacherId: 'demo-t1',
      studentCount: counts['demo-c2'] || 0,
      videoCount: 12,
      documentCount: 8,
      price: 39.99,
      monthlyPrice: null,
      oneTimePrice: 39.99,
      currency: 'EUR',
      createdAt: now,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      avgRating: demoAvgRating,
      zoomAccountId: 'demo-zoom-1',
      zoomAccountName: 'info@akademo-edu.com',
      whatsappGroupLink: 'https://chat.whatsapp.com/EVwr6bNsKng5Rk965ZuM4U',
      maxStudents: 40,
      university: 'UAB',
      carrera: 'Matemáticas',
    },
    {
      id: 'demo-c3',
      name: 'Diseño Gráfico',
      description: 'Domina Adobe Creative Suite y crea diseños impactantes',
      teacherName: 'Ana Martínez',
      teacherId: 'demo-t3',
      studentCount: counts['demo-c3'] || 0,
      videoCount: 15,
      documentCount: 10,
      price: 59.99,
      monthlyPrice: 59.99,
      oneTimePrice: null,
      currency: 'EUR',
      createdAt: now,
      startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      avgRating: demoAvgRating,
      zoomAccountId: 'demo-zoom-1',
      zoomAccountName: 'info@akademo-edu.com',
      whatsappGroupLink: 'https://chat.whatsapp.com/EVwr6bNsKng5Rk965ZuM4U',
      maxStudents: 70,
      university: 'UPC',
      carrera: 'Diseño y Creación Digital',
    },
    {
      id: 'demo-c4',
      name: 'Física Cuántica',
      description: 'Introducción a la mecánica cuántica y sus aplicaciones',
      teacherName: 'Luis López',
      teacherId: 'demo-t4',
      studentCount: counts['demo-c4'] || 0,
      videoCount: 6,
      documentCount: 4,
      price: 44.99,
      monthlyPrice: 44.99,
      oneTimePrice: null,
      currency: 'EUR',
      createdAt: now,
      startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      avgRating: demoAvgRating,
      zoomAccountId: null,
      zoomAccountName: null,
      whatsappGroupLink: null,
      maxStudents: 35,
      university: 'UAB',
      carrera: 'Física',
    },
  ];
}

export function generateDemoLessons(): DemoLesson[] {
  const now = new Date().toISOString();
  const demoDoc = [{ title: 'Material de Apoyo', url: '/demo/Documento.pdf' }];
  return [
    { id: 'demo-l1', title: 'Introducción al Curso', classId: 'demo-c1', className: 'Programación Web', videoGuid: DEMO_VIDEO_GUID, duration: 3600, createdAt: now, documents: demoDoc },
    { id: 'demo-l2', title: 'Variables y Tipos de Datos', classId: 'demo-c1', className: 'Programación Web', videoGuid: DEMO_VIDEO_GUID, duration: 3600, createdAt: now, documents: demoDoc },
    { id: 'demo-l3', title: 'Funciones y Scope', classId: 'demo-c1', className: 'Programación Web', videoGuid: DEMO_VIDEO_GUID, duration: 3600, createdAt: now, documents: demoDoc },
    { id: 'demo-l4', title: 'Arrays y Objetos', classId: 'demo-c1', className: 'Programación Web', videoGuid: DEMO_VIDEO_GUID, duration: 3600, createdAt: now, documents: demoDoc },
    { id: 'demo-l5', title: 'Límites y Continuidad', classId: 'demo-c2', className: 'Matemáticas', videoGuid: DEMO_VIDEO_GUID, duration: 3600, createdAt: now, documents: demoDoc },
    { id: 'demo-l6', title: 'Derivadas', classId: 'demo-c2', className: 'Matemáticas', videoGuid: DEMO_VIDEO_GUID, duration: 3600, createdAt: now, documents: demoDoc },
    { id: 'demo-l7', title: 'Integrales Definidas', classId: 'demo-c2', className: 'Matemáticas', videoGuid: DEMO_VIDEO_GUID, duration: 3600, createdAt: now, documents: demoDoc },
    { id: 'demo-l8', title: 'Principios de Diseño', classId: 'demo-c3', className: 'Diseño Gráfico', videoGuid: DEMO_VIDEO_GUID, duration: 3600, createdAt: now, documents: demoDoc },
  ];
}
