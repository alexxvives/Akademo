import type { DemoAssignment, DemoSubmission } from './types';

export function generateDemoAssignments(): DemoAssignment[] {
  return [
    // Programación Web (demo-c1) - 3 assignments
    {
      id: 'demo-a1',
      title: 'Crear Componente React',
      description: 'Desarrollar un componente de tarjeta reutilizable con props',
      dueDate: new Date(Date.UTC(2026, 1, 15, 23, 59)).toISOString(),
      maxScore: 100,
      submissionCount: 18,
      gradedCount: 15,
      className: 'Programación Web',
      classId: 'demo-c1',
      createdAt: new Date(Date.UTC(2026, 1, 8)).toISOString(),
      attachmentIds: 'demo-upload-1',
      attachmentName: 'Instrucciones_Componente.pdf',
    },
    {
      id: 'demo-a2',
      title: 'Hooks y Estado',
      description: 'Implementar useState y useEffect en una aplicación práctica',
      dueDate: new Date(Date.UTC(2026, 1, 20, 23, 59)).toISOString(),
      maxScore: 100,
      submissionCount: 12,
      gradedCount: 12,
      className: 'Programación Web',
      classId: 'demo-c1',
      createdAt: new Date(Date.UTC(2026, 1, 12)).toISOString(),
      attachmentIds: 'demo-upload-2,demo-upload-3',
      attachmentName: 'Hooks_Guia.pdf',
    },
    {
      id: 'demo-a3',
      title: 'Proyecto Final React',
      description: 'Aplicación completa con routing y gestión de estado',
      dueDate: new Date(Date.UTC(2026, 1, 28, 23, 59)).toISOString(),
      maxScore: 200,
      submissionCount: 8,
      gradedCount: 0,
      className: 'Programación Web',
      classId: 'demo-c1',
      createdAt: new Date(Date.UTC(2026, 1, 18)).toISOString(),
      attachmentIds: 'demo-upload-4',
      attachmentName: 'Proyecto_Requisitos.pdf',
    },
    // Matemáticas Avanzadas (demo-c2) - 2 assignments
    {
      id: 'demo-a4',
      title: 'Derivadas Parciales',
      description: 'Resolver problemas de optimización con derivadas',
      dueDate: new Date(Date.UTC(2026, 1, 17, 23, 59)).toISOString(),
      maxScore: 100,
      submissionCount: 15,
      gradedCount: 15,
      className: 'Matemáticas Avanzadas',
      classId: 'demo-c2',
      createdAt: new Date(Date.UTC(2026, 1, 10)).toISOString(),
      attachmentIds: 'demo-upload-5',
      attachmentName: 'Ejercicios_Derivadas.pdf',
    },
    {
      id: 'demo-a5',
      title: 'Integrales Dobles',
      description: 'Calcular volúmenes usando integrales múltiples',
      dueDate: new Date(Date.UTC(2026, 1, 22, 23, 59)).toISOString(),
      maxScore: 100,
      submissionCount: 10,
      gradedCount: 7,
      className: 'Matemáticas Avanzadas',
      classId: 'demo-c2',
      createdAt: new Date(Date.UTC(2026, 1, 14)).toISOString(),
      attachmentIds: 'demo-upload-6',
      attachmentName: 'Integrales_Teoria.pdf',
    },
    // Diseño Gráfico (demo-c3) - 3 assignments
    {
      id: 'demo-a6',
      title: 'Diseño de Logo',
      description: 'Crear identidad visual para marca ficticia',
      dueDate: new Date(Date.UTC(2026, 1, 16, 23, 59)).toISOString(),
      maxScore: 100,
      submissionCount: 25,
      gradedCount: 20,
      className: 'Diseño Gráfico',
      classId: 'demo-c3',
      createdAt: new Date(Date.UTC(2026, 1, 9)).toISOString(),
      attachmentIds: 'demo-upload-7,demo-upload-8',
      attachmentName: 'Brief_Logo.pdf',
    },
    {
      id: 'demo-a7',
      title: 'Composición Tipográfica',
      description: 'Poster usando principios de jerarquía y contraste',
      dueDate: new Date(Date.UTC(2026, 1, 19, 23, 59)).toISOString(),
      maxScore: 100,
      submissionCount: 20,
      gradedCount: 18,
      className: 'Diseño Gráfico',
      classId: 'demo-c3',
      createdAt: new Date(Date.UTC(2026, 1, 11)).toISOString(),
      attachmentIds: 'demo-upload-9',
      attachmentName: 'Tipografia_Ejemplos.pdf',
    },
    {
      id: 'demo-a8',
      title: 'Paleta de Colores',
      description: 'Desarrollo de esquema cromático basado en teoría del color',
      dueDate: new Date(Date.UTC(2026, 1, 25, 23, 59)).toISOString(),
      maxScore: 100,
      submissionCount: 15,
      gradedCount: 10,
      className: 'Diseño Gráfico',
      classId: 'demo-c3',
      createdAt: new Date(Date.UTC(2026, 1, 16)).toISOString(),
      attachmentIds: 'demo-upload-10',
      attachmentName: 'Color_Teoria.pdf',
    },
    // Física Cuántica (demo-c4) - 2 assignments
    {
      id: 'demo-a9',
      title: 'Ecuación de Schrödinger',
      description: 'Resolver casos básicos de partícula en una caja',
      dueDate: new Date(Date.UTC(2026, 1, 18, 23, 59)).toISOString(),
      maxScore: 100,
      submissionCount: 12,
      gradedCount: 12,
      className: 'Física Cuántica',
      classId: 'demo-c4',
      createdAt: new Date(Date.UTC(2026, 1, 11)).toISOString(),
      attachmentIds: 'demo-upload-11',
      attachmentName: 'Schrodinger_Problemas.pdf',
    },
    {
      id: 'demo-a10',
      title: 'Principio de Incertidumbre',
      description: 'Aplicar principio de Heisenberg en problemas prácticos',
      dueDate: new Date(Date.UTC(2026, 1, 24, 23, 59)).toISOString(),
      maxScore: 100,
      submissionCount: 8,
      gradedCount: 5,
      className: 'Física Cuántica',
      classId: 'demo-c4',
      createdAt: new Date(Date.UTC(2026, 1, 15)).toISOString(),
      attachmentIds: 'demo-upload-12',
      attachmentName: 'Heisenberg_Ejercicios.pdf',
    },
  ];
}

export function generateDemoSubmissions(assignmentId: string): DemoSubmission[] {
  const firstNames = ['Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Carmen', 'José', 'Laura', 'Pedro', 'Isabel', 'Miguel', 'Rosa', 'Antonio', 'Elena', 'Francisco', 'Sofía', 'David', 'Marta', 'Javier', 'Patricia', 'Diego', 'Lucía', 'Rafael', 'Beatriz', 'Alberto'];
  const lastNames = ['García', 'Rodríguez', 'Martínez', 'López', 'Sánchez', 'Pérez', 'Gómez', 'Fernández'];
  
  const assignments = generateDemoAssignments();
  const assignment = assignments.find(a => a.id === assignmentId);
  if (!assignment) return [];
  
  const submissions: DemoSubmission[] = [];
  const submissionCount = assignment.submissionCount;
  const gradedCount = assignment.gradedCount;
  
  for (let i = 0; i < submissionCount; i++) {
    const studentName = `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`;
    const isGraded = i < gradedCount;
    
    let score: number | undefined;
    if (isGraded) {
      if (i === 0) score = assignment.maxScore;
      else if (i >= 1 && i <= 4) score = Math.round(assignment.maxScore * (0.88 + Math.random() * 0.06));
      else if (i >= 5 && i <= 7) score = Math.round(assignment.maxScore * (0.68 + Math.random() * 0.06));
      else score = Math.round(assignment.maxScore * (0.35 + Math.random() * 0.23));
    }
    
    const submittedAt = new Date(new Date(assignment.dueDate).getTime() - (Math.random() * 5 * 24 * 60 * 60 * 1000));
    
    const isDownloaded = i >= Math.floor(submissionCount * 0.15);
    const downloadedAt = isDownloaded ? new Date(submittedAt.getTime() + (Math.random() * 24 * 60 * 60 * 1000)).toISOString() : undefined;
    
    const version = i % 8 === 0 ? 3 : i % 5 === 0 ? 2 : 1;
    
    submissions.push({
      id: `demo-sub-${assignmentId}-${i + 1}`,
      assignmentId,
      studentName,
      studentEmail: `${studentName.toLowerCase().replace(' ', '.')}@demo.com`,
      submissionFileName: `${studentName.replace(' ', '_')}_tarea${version > 1 ? `_v${version}` : ''}.pdf`,
      submissionFileSize: Math.floor(Math.random() * 2000000) + 500000,
      submittedAt: submittedAt.toISOString(),
      fileUrl: '/demo/Documento.pdf',
      score: isGraded ? Math.round(score!) : undefined,
      feedback: isGraded ? (score! >= assignment.maxScore * 0.9 ? 'Excelente trabajo, sigue así!' : score! >= assignment.maxScore * 0.8 ? 'Buen esfuerzo, revisa los comentarios' : 'Necesita mejorar, por favor estudia más el material') : undefined,
      gradedAt: isGraded ? new Date(submittedAt.getTime() + (Math.random() * 3 * 24 * 60 * 60 * 1000)).toISOString() : undefined,
      downloadedAt,
      version,
    });
  }
  
  return submissions;
}

export function countNewDemoSubmissions(assignmentId: string): number {
  if (assignmentId !== 'demo-a1' && assignmentId !== 'demo-a2') {
    return 0;
  }
  const submissions = generateDemoSubmissions(assignmentId);
  return submissions.filter(s => !s.downloadedAt).length;
}

export function countTotalNewDemoSubmissions(): number {
  const assignments = generateDemoAssignments();
  let total = 0;
  for (const assignment of assignments) {
    total += countNewDemoSubmissions(assignment.id);
  }
  return total;
}

export function countUngradedDemoSubmissions(assignmentId: string): number {
  const submissions = generateDemoSubmissions(assignmentId);
  return submissions.filter(s => s.score === undefined).length;
}

export function countTotalUngradedDemoSubmissions(): number {
  const assignments = generateDemoAssignments();
  let total = 0;
  for (const assignment of assignments) {
    total += countUngradedDemoSubmissions(assignment.id);
  }
  return total;
}
