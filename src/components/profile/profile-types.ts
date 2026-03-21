export interface ZoomAccount {
  id: string;
  accountName: string;
  accountId: string;
  provider?: string;
  createdAt: string;
  classes?: Array<{ id: string; name: string; startDate?: string | null }>;
}

export interface StripeStatus {
  connected: boolean;
  charges_enabled: boolean;
  details_submitted: boolean;
  accountId?: string;
  email?: string;
}

export interface Academy {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  address?: string;
  phone?: string;
  email?: string;
  feedbackEnabled?: number;
  defaultWatermarkIntervalMins?: number;
  defaultMaxWatchTimeMultiplier?: number;
  logoUrl?: string;
  allowedPaymentMethods?: string;
  transferenciaIban?: string;
  bizumPhone?: string;
  requireGrading?: number;
  hiddenMenuItems?: string;
}

export interface AcademicYear {
  id: string;
  academyId: string;
  name: string;
  startDate: string;
  endDate?: string | null;
  isCurrent: number;
  createdAt: string;
}

export interface ProfileFormData {
  name: string;
  address: string;
  phone: string;
  email: string;
  feedbackEnabled: boolean;
  defaultWatermarkIntervalMins: number;
  defaultMaxWatchTimeMultiplier: number;
  allowedPaymentMethods: string[];
  transferenciaIban: string;
  bizumPhone: string;
  requireGrading: boolean;
  hiddenMenuItems: string[];
}

export const WATERMARK_OPTIONS = [
  { value: 1, label: '1 minuto' }, { value: 3, label: '3 minutos' },
  { value: 5, label: '5 minutos' }, { value: 10, label: '10 minutos' },
  { value: 15, label: '15 minutos' }, { value: 30, label: '30 minutos' },
];

export const MULTIPLIER_OPTIONS = [
  { value: 1.0, label: '1x (una vez)' }, { value: 1.5, label: '1.5x' },
  { value: 2.0, label: '2x (dos veces)' }, { value: 2.5, label: '2.5x' },
  { value: 3.0, label: '3x (tres veces)' }, { value: 5.0, label: '5x (cinco veces)' },
  { value: 10.0, label: '10x (ilimitado)' },
];

export const DEFAULT_ALLOWED_PAYMENT_METHODS = ['cash'];
export const SUPPORTED_PAYMENT_METHODS = ['stripe', 'cash', 'transferencia', 'bizum'] as const;

export function normalizeAllowedPaymentMethods(value?: string | string[] | null): string[] {
  let methods: string[] = [...DEFAULT_ALLOWED_PAYMENT_METHODS];
  if (Array.isArray(value)) {
    methods = value;
  } else if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) methods = parsed;
    } catch (error) {
      console.error('Failed to parse allowedPaymentMethods:', error);
    }
  }
  const filtered = methods.filter((method): method is string =>
    (SUPPORTED_PAYMENT_METHODS as readonly string[]).includes(method)
  );
  if (filtered.length === 0) return [...DEFAULT_ALLOWED_PAYMENT_METHODS];
  return [...SUPPORTED_PAYMENT_METHODS].filter((method) => filtered.includes(method));
}

export function formatSpanishIbanInput(value: string): string {
  const sanitized = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const core = (sanitized.startsWith('ES') ? sanitized.slice(2) : sanitized.replace(/^[A-Z]{0,2}/, ''))
    .replace(/[^0-9]/g, '').slice(0, 22);
  const full = `ES${core}`;
  return full.match(/.{1,4}/g)?.join(' ') ?? full;
}

export function isValidSpanishIban(value: string): boolean {
  return /^ES\d{22}$/.test(value.replace(/\s+/g, ''));
}

export function formatSpanishBizumPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  const localNumber = (digits.startsWith('34') ? digits.slice(2) : digits).slice(0, 9);
  if (!localNumber) return '';
  const groups = localNumber.match(/\d{1,3}/g)?.join(' ') ?? localNumber;
  return `+34 ${groups}`;
}

export function isValidSpanishBizumPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  const localNumber = digits.startsWith('34') ? digits.slice(2) : digits;
  return /^[6789]\d{8}$/.test(localNumber);
}
