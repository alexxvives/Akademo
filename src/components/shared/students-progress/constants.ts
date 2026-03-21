import type { Class } from './types';

export const DEMO_CLASS_NAME_TO_ID: Record<string, string> = {
  'Programación Web': 'demo-c1',
  'Matemáticas Avanzadas': 'demo-c2',
  'Física Cuántica': 'demo-c4',
  'Diseño Gráfico': 'demo-c3',
};

export const DEMO_CLASSES: Class[] = [
  { id: 'demo-c1', name: 'Programación Web' },
  { id: 'demo-c2', name: 'Matemáticas Avanzadas' },
  { id: 'demo-c3', name: 'Diseño Gráfico' },
  { id: 'demo-c4', name: 'Física Cuántica' },
];

// Source of truth: must match generateDemoClasses() in demo-data.ts
export const DEMO_CLASS_TEACHER: Record<string, string> = {
  'demo-c1': 'Carlos Rodríguez',
  'demo-c2': 'María García',
  'demo-c3': 'Ana Martínez',
  'demo-c4': 'Luis López',
};

export function computePaymentStatus(
  paymentFrequency: string | null | undefined,
  monthlyPrice: number | null | undefined,
  oneTimePrice: number | null | undefined,
  classStartDate: string | null | undefined,
  enrolledAt: string | null | undefined,
  totalPaid: number | null | undefined,
): { status: 'UP_TO_DATE' | 'BEHIND' | 'FREE'; monthsBehind: number } {
  // Free class: no prices set or both zero
  const hasMonthly = monthlyPrice != null && monthlyPrice > 0;
  const hasOneTime = oneTimePrice != null && oneTimePrice > 0;
  if (!hasMonthly && !hasOneTime) return { status: 'FREE', monthsBehind: 0 };

  const paid = totalPaid ?? 0;

  if (paymentFrequency === 'MONTHLY' && hasMonthly) {
    // Calculate expected months from class start (or enrollment) to now
    const startStr = classStartDate || enrolledAt;
    if (!startStr) {
      const monthsBehind = paid < monthlyPrice ? 1 : 0;
      return { status: paid >= monthlyPrice ? 'UP_TO_DATE' : 'BEHIND', monthsBehind };
    }
    const start = new Date(startStr);
    const now = new Date();
    let monthsDiff = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    // Adjust for day-of-month: if we haven't reached the billing day yet, subtract a month
    if (now.getDate() < start.getDate()) monthsDiff = Math.max(0, monthsDiff - 1);
    const expectedMonths = Math.max(1, monthsDiff + 1); // At least 1 month due
    const expectedAmount = expectedMonths * monthlyPrice;
    const paidMonths = Math.floor(paid / monthlyPrice);
    const monthsBehind = Math.max(0, expectedMonths - paidMonths);
    return { status: paid >= expectedAmount ? 'UP_TO_DATE' : 'BEHIND', monthsBehind };
  }

  // One-time payment or default
  const price = hasOneTime ? oneTimePrice! : monthlyPrice!;
  return { status: paid >= price ? 'UP_TO_DATE' : 'BEHIND', monthsBehind: 0 };
}
