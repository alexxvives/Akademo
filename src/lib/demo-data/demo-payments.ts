import type { DemoPendingEnrollment, DemoPayment } from './types';
import { generateDemoStudents } from './demo-students';

export function generateDemoPendingEnrollments(): DemoPendingEnrollment[] {
  const baseDate = new Date('2026-02-01T00:00:00.000Z');
  return [
    { id: 'demo-pending-1', student: { id: 'demo-student-pending-1', firstName: 'Juan', lastName: 'García', email: 'estudiante.pendiente1@demo.com' }, class: { id: 'demo-c1', name: 'Programación Web' }, enrolledAt: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-pending-2', student: { id: 'demo-student-pending-2', firstName: 'María', lastName: 'Rodríguez', email: 'estudiante.pendiente2@demo.com' }, class: { id: 'demo-c2', name: 'Matemáticas Avanzadas' }, enrolledAt: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-pending-3', student: { id: 'demo-student-pending-3', firstName: 'Pedro', lastName: 'Martínez', email: 'estudiante.pendiente3@demo.com' }, class: { id: 'demo-c3', name: 'Diseño Gráfico' }, enrolledAt: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-pending-4', student: { id: 'demo-student-pending-4', firstName: 'Laura', lastName: 'López', email: 'estudiante.pendiente4@demo.com' }, class: { id: 'demo-c4', name: 'Física Cuántica' }, enrolledAt: new Date(baseDate.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-pending-5', student: { id: 'demo-student-pending-5', firstName: 'Diego', lastName: 'Sánchez', email: 'estudiante.pendiente5@demo.com' }, class: { id: 'demo-c1', name: 'Programación Web' }, enrolledAt: new Date(baseDate.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-pending-6', student: { id: 'demo-student-pending-6', firstName: 'Carmen', lastName: 'Pérez', email: 'estudiante.pendiente6@demo.com' }, class: { id: 'demo-c2', name: 'Matemáticas Avanzadas' }, enrolledAt: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-pending-7', student: { id: 'demo-student-pending-7', firstName: 'Luis', lastName: 'Gómez', email: 'estudiante.pendiente7@demo.com' }, class: { id: 'demo-c3', name: 'Diseño Gráfico' }, enrolledAt: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-pending-8', student: { id: 'demo-student-pending-8', firstName: 'Ana', lastName: 'Díaz', email: 'estudiante.pendiente8@demo.com' }, class: { id: 'demo-c4', name: 'Física Cuántica' }, enrolledAt: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-pending-9', student: { id: 'demo-student-pending-9', firstName: 'José', lastName: 'García', email: 'estudiante.pendiente9@demo.com' }, class: { id: 'demo-c1', name: 'Programación Web' }, enrolledAt: new Date(baseDate.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-pending-10', student: { id: 'demo-student-pending-10', firstName: 'Isabel', lastName: 'Rodríguez', email: 'estudiante.pendiente10@demo.com' }, class: { id: 'demo-c2', name: 'Matemáticas Avanzadas' }, enrolledAt: new Date(baseDate.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-pending-11', student: { id: 'demo-student-pending-11', firstName: 'Carlos', lastName: 'Martínez', email: 'estudiante.pendiente11@demo.com' }, class: { id: 'demo-c3', name: 'Diseño Gráfico' }, enrolledAt: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-pending-12', student: { id: 'demo-student-pending-12', firstName: 'Elena', lastName: 'López', email: 'estudiante.pendiente12@demo.com' }, class: { id: 'demo-c4', name: 'Física Cuántica' }, enrolledAt: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-pending-13', student: { id: 'demo-student-pending-13', firstName: 'Miguel', lastName: 'Sánchez', email: 'estudiante.pendiente13@demo.com' }, class: { id: 'demo-c1', name: 'Programación Web' }, enrolledAt: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-pending-14', student: { id: 'demo-student-pending-14', firstName: 'Sofía', lastName: 'Pérez', email: 'estudiante.pendiente14@demo.com' }, class: { id: 'demo-c2', name: 'Matemáticas Avanzadas' }, enrolledAt: new Date(baseDate.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-pending-15', student: { id: 'demo-student-pending-15', firstName: 'Javier', lastName: 'Gómez', email: 'estudiante.pendiente15@demo.com' }, class: { id: 'demo-c3', name: 'Diseño Gráfico' }, enrolledAt: new Date(baseDate.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  ];
}

export function generateDemoPendingPayments(): DemoPayment[] {
  const demoStudents = generateDemoStudents();

  const CLASS_NAME_TO_ID: Record<string, string> = {
    'Programación Web': 'demo-c1',
    'Matemáticas Avanzadas': 'demo-c2',
    'Física Cuántica': 'demo-c4',
    'Diseño Gráfico': 'demo-c3',
  };

  const CLASS_PRICES: Record<string, number> = {
    'Programación Web': 49.99,
    'Matemáticas Avanzadas': 39.99,
    'Diseño Gráfico': 59.99,
    'Física Cuántica': 44.99,
  };

  interface AggStudent {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    classes: string[];
    classIds: string[];
  }
  const studentMap = new Map<string, AggStudent>();
  demoStudents.forEach((s) => {
    const key = `${s.firstName}-${s.lastName}`;
    const classId = CLASS_NAME_TO_ID[s.className] || 'demo-c1';
    if (!studentMap.has(key)) {
      studentMap.set(key, {
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.email,
        classes: [s.className],
        classIds: [classId],
      });
    } else {
      const existing = studentMap.get(key);
      if (existing && !existing.classes.includes(s.className)) {
        existing.classes.push(s.className);
        existing.classIds.push(classId);
      }
    }
  });

  const BEHIND_INDICES: Record<number, number> = { 2: 3, 7: 2, 15: 1, 22: 2 };

  const baseDate = new Date('2026-02-05T00:00:00.000Z');
  const payments: DemoPayment[] = [];
  let paymentIdx = 0;

  const students = Array.from(studentMap.values());
  const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;
  for (let index = 0; index < students.length; index++) {
    if (!(index in BEHIND_INDICES)) continue;
    const student = students[index];
    const monthsBehind = BEHIND_INDICES[index];
    const cls = student.classes[0];
    for (let m = 0; m < monthsBehind; m++) {
      paymentIdx++;
      const dueDate = new Date(baseDate.getTime() - (monthsBehind - m) * ONE_MONTH_MS);
      payments.push({
        enrollmentId: `demo-payment-pending-${paymentIdx}`,
        studentId: student.id,
        studentFirstName: student.firstName,
        studentLastName: student.lastName,
        studentEmail: `${student.firstName.toLowerCase()}.${student.lastName.toLowerCase()}@demo.com`,
        className: cls,
        paymentAmount: CLASS_PRICES[cls] || 49.99,
        currency: 'EUR',
        paymentMethod: paymentIdx % 3 === 0 ? 'transferencia' : 'cash',
        paymentStatus: 'CASH_PENDING',
        enrolledAt: dueDate.toISOString(),
        createdAt: dueDate.toISOString(),
        updatedAt: dueDate.toISOString(),
      });
    }
  }

  return payments;
}

export function generateDemoPaymentHistory(): DemoPayment[] {
  const baseDate = new Date('2026-01-01T00:00:00.000Z');
  const records = [
    { firstName: 'Juan', lastName: 'García', className: 'Programación Web', amount: 79.99, teacher: 'Carlos Rodríguez', approver: 'Carlos Rodríguez', status: 'PAID', daysAgo: 45 },
    { firstName: 'Juan', lastName: 'García', className: 'Diseño Gráfico', amount: 89.99, teacher: 'Carlos Rodríguez', approver: 'Ana Martínez', status: 'PAID', daysAgo: 20 },
    { firstName: 'Juan', lastName: 'García', className: 'Física Cuántica', amount: 64.99, teacher: 'Luis Fernández', approver: 'Pedro Administrador', status: 'PAID', daysAgo: 7 },
    { firstName: 'María', lastName: 'Rodríguez', className: 'Matemáticas Avanzadas', amount: 59.99, teacher: 'María García', approver: 'María García', status: 'PAID', daysAgo: 42 },
    { firstName: 'María', lastName: 'Rodríguez', className: 'Física Cuántica', amount: 64.99, teacher: 'María García', approver: 'Pedro Administrador', status: 'PAID', daysAgo: 18 },
    { firstName: 'María', lastName: 'Rodríguez', className: 'Programación Web', amount: 79.99, teacher: 'Carlos Rodríguez', approver: 'Carlos Rodríguez', status: 'PAID', daysAgo: 5 },
    { firstName: 'Pedro', lastName: 'Martínez', className: 'Diseño Gráfico', amount: 89.99, teacher: 'Ana Martínez', approver: 'Ana Martínez', status: 'PAID', daysAgo: 40 },
    { firstName: 'Pedro', lastName: 'Martínez', className: 'Programación Web', amount: 79.99, teacher: 'Ana Martínez', approver: 'Carlos Rodríguez', status: 'PAID', daysAgo: 15 },
    { firstName: 'Pedro', lastName: 'Martínez', className: 'Matemáticas Avanzadas', amount: 59.99, teacher: 'María García', approver: 'María García', status: 'PAID', daysAgo: 3 },
    { firstName: 'Laura', lastName: 'López', className: 'Física Cuántica', amount: 64.99, teacher: 'Luis Fernández', approver: 'Pedro Administrador', status: 'PAID', daysAgo: 38 },
    { firstName: 'Diego', lastName: 'Sánchez', className: 'Programación Web', amount: 79.99, teacher: 'Carmen López', approver: 'Carlos Rodríguez', status: 'PAID', daysAgo: 35 },
    { firstName: 'Carmen', lastName: 'García', className: 'Matemáticas Avanzadas', amount: 59.99, teacher: 'Carlos Rodríguez', approver: 'María García', status: 'PAID', daysAgo: 32 },
    { firstName: 'Luis', lastName: 'Rodríguez', className: 'Diseño Gráfico', amount: 89.99, teacher: 'María García', approver: 'Ana Martínez', status: 'PAID', daysAgo: 30 },
    { firstName: 'Ana', lastName: 'Martínez', className: 'Física Cuántica', amount: 64.99, teacher: 'Ana Martínez', approver: 'Pedro Administrador', status: 'REJECTED', daysAgo: 28 },
    { firstName: 'José', lastName: 'López', className: 'Programación Web', amount: 79.99, teacher: 'Luis Fernández', approver: 'Carlos Rodríguez', status: 'PAID', daysAgo: 25 },
    { firstName: 'Isabel', lastName: 'Sánchez', className: 'Matemáticas Avanzadas', amount: 59.99, teacher: 'Carmen López', approver: 'María García', status: 'PAID', daysAgo: 22 },
    { firstName: 'Laura', lastName: 'López', className: 'Matemáticas Avanzadas', amount: 59.99, teacher: 'Luis Fernández', approver: 'María García', status: 'PAID', daysAgo: 12 },
    { firstName: 'Diego', lastName: 'Sánchez', className: 'Diseño Gráfico', amount: 89.99, teacher: 'Carmen López', approver: 'Ana Martínez', status: 'REJECTED', daysAgo: 10 },
    { firstName: 'Carmen', lastName: 'García', className: 'Física Cuántica', amount: 64.99, teacher: 'Carlos Rodríguez', approver: 'Pedro Administrador', status: 'PAID', daysAgo: 8 },
    { firstName: 'Luis', lastName: 'Rodríguez', className: 'Programación Web', amount: 79.99, teacher: 'María García', approver: 'Carlos Rodríguez', status: 'PAID', daysAgo: 6 },
    { firstName: 'Ana', lastName: 'Martínez', className: 'Matemáticas Avanzadas', amount: 59.99, teacher: 'Ana Martínez', approver: 'María García', status: 'PAID', daysAgo: 4 },
    { firstName: 'José', lastName: 'López', className: 'Diseño Gráfico', amount: 89.99, teacher: 'Luis Fernández', approver: 'Ana Martínez', status: 'PAID', daysAgo: 2 },
    { firstName: 'Isabel', lastName: 'Sánchez', className: 'Física Cuántica', amount: 64.99, teacher: 'Carmen López', approver: 'Pedro Administrador', status: 'PAID', daysAgo: 1 },
  ];
  
  return records.map((r, i) => ({
    enrollmentId: `demo-payment-history-${i + 1}`,
    studentId: 'demo-s1',
    classId: r.className === 'Programación Web' ? 'demo-c1' :
              r.className === 'Matemáticas Avanzadas' ? 'demo-c2' :
              r.className === 'Diseño Gráfico' ? 'demo-c3' : 'demo-c4',
    studentFirstName: r.firstName,
    studentLastName: r.lastName,
    studentEmail: `${r.firstName.toLowerCase()}.${r.lastName.toLowerCase()}@demo.com`,
    className: r.className,
    teacherName: r.teacher,
    approvedByName: r.approver,
    paymentAmount: r.amount,
    currency: 'EUR',
    paymentMethod: i % 3 === 0 ? 'cash' : 'stripe',
    paymentStatus: r.status,
    enrolledAt: new Date(baseDate.getTime() - r.daysAgo * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(baseDate.getTime() - r.daysAgo * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(baseDate.getTime() - r.daysAgo * 24 * 60 * 60 * 1000).toISOString(),
  }));
}
