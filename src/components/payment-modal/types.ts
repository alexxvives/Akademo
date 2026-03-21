export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  className: string;
  academyName: string;
  currentPaymentStatus?: string;
  currentPaymentMethod?: string;
  onPaymentComplete: () => void;
  monthlyPrice?: number | null;
  oneTimePrice?: number | null;
  maxStudents?: number;
  currentStudentCount?: number;
  firstPaymentAmount?: number;
  missedCycles?: number;
}

export interface AcademyPaymentInfo {
  allowedPaymentMethods?: string | string[];
  stripeAccountId?: string;
  transferenciaIban?: string | null;
  bizumPhone?: string | null;
}

export function formatDisplayIban(value?: string | null): string {
  if (!value) return '';
  return value.toUpperCase().replace(/\s+/g, '').match(/.{1,4}/g)?.join(' ') ?? value;
}

export function formatDisplayBizumPhone(value?: string | null): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  const localNumber = (digits.startsWith('34') ? digits.slice(2) : digits).slice(0, 9);
  if (!localNumber) return value;
  const groups = localNumber.match(/\d{1,3}/g)?.join(' ') ?? localNumber;
  return `+34 ${groups}`;
}

export function formatPrice(amount: number, curr: string) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: curr || 'EUR',
  }).format(amount);
}
