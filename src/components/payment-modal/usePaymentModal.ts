'use client';

import { useState, useEffect } from 'react';
import { apiClient, apiPost } from '@/lib/api-client';
import type { PaymentModalProps, AcademyPaymentInfo } from './types';
import { formatDisplayIban, formatDisplayBizumPhone } from './types';

export function usePaymentModal(props: PaymentModalProps) {
  const {
    isOpen,
    classId,
    monthlyPrice,
    oneTimePrice,
    onPaymentComplete,
  } = props;

  const hasMonthly = monthlyPrice != null && monthlyPrice > 0;
  const hasOneTime = oneTimePrice != null && oneTimePrice > 0;
  const defaultFrequency = hasMonthly && !hasOneTime ? 'monthly' : !hasMonthly && hasOneTime ? 'one-time' : null;

  const [paymentFrequency, setPaymentFrequency] = useState<'monthly' | 'one-time' | null>(null);
  const [processing, setProcessing] = useState(false);
  const [_confirmingCash, _setConfirmingCash] = useState(false);
  const [_confirmingTransferencia, _setConfirmingTransferencia] = useState(false);
  const [allowedPaymentMethods, setAllowedPaymentMethods] = useState<string[]>(['cash']);
  const [academyPaymentInfo, setAcademyPaymentInfo] = useState<AcademyPaymentInfo | null>(null);
  const [copiedField, setCopiedField] = useState<'iban' | 'bizum' | null>(null);

  const copyToClipboard = (text: string, field: 'iban' | 'bizum') => {
    navigator.clipboard.writeText(text.replace(/\s/g, '')).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  // Fetch academy's allowed payment methods
  useEffect(() => {
    if (isOpen && classId) {
      apiClient(`/classes/${classId}`)
        .then(res => res.json())
        .then(result => {
          if (result.success && result.data?.academyId) {
            return apiClient(`/academies/${result.data.academyId}`);
          }
          return null;
        })
        .then(res => res?.json())
        .then(result => {
          if (result?.success && result.data) {
            let methods = result.data.allowedPaymentMethods;

            if (typeof methods === 'string') {
              try {
                methods = JSON.parse(methods);
              } catch (e) {
                console.error('[PaymentModal] Failed to parse allowedPaymentMethods:', e);
                methods = ['cash'];
              }
            }

            if (!Array.isArray(methods)) {
              console.warn('[PaymentModal] allowedPaymentMethods is not an array, using default');
              methods = ['cash'];
            }

            if (!result.data.hasStripe) {
              methods = methods.filter((m: string) => m !== 'stripe');
            }

            setAllowedPaymentMethods(methods);
            setAcademyPaymentInfo(result.data);
          }
        })
        .catch(err => {
          console.error('[PaymentModal] Failed to fetch allowed payment methods:', err);
        });
    }
  }, [isOpen, classId]);

  // Auto-select payment frequency when modal opens
  useEffect(() => {
    if (isOpen) {
      setPaymentFrequency(defaultFrequency);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, defaultFrequency]);

  const needsFrequencySelection = hasMonthly && hasOneTime;
  const resolvedFrequency = paymentFrequency || (hasMonthly ? 'monthly' : 'one-time');

  const validateFrequency = (): boolean => {
    if (!paymentFrequency && needsFrequencySelection) {
      alert('Por favor selecciona un tipo de pago primero');
      return false;
    }
    return true;
  };

  const handleCashPayment = async () => {
    if (!validateFrequency()) return;
    setProcessing(true);
    try {
      const res = await apiPost('/payments/initiate', {
        classId,
        paymentMethod: 'cash',
        paymentFrequency: resolvedFrequency,
      });
      const result = await res.json();
      if (result.success) {
        alert(result.data?.message || 'Solicitud enviada. La academia confirmará la recepción del efectivo.');
        onPaymentComplete();
      } else {
        throw new Error(result.error || 'Error al registrar pago');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al registrar pago';
      console.error('[PaymentModal] Cash payment error:', error);
      alert('Error: ' + message);
    } finally {
      setProcessing(false);
    }
  };

  const handleStripePayment = async () => {
    if (!validateFrequency()) return;
    setProcessing(true);
    try {
      const res = await apiPost('/payments/stripe-session', {
        classId,
        paymentFrequency: resolvedFrequency,
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP error! status: ${res.status} - ${errorText}`);
      }
      const result = await res.json();
      if (result.success && result.data?.url) {
        window.location.href = result.data.url;
      } else {
        throw new Error(result.error || 'Error al crear sesión de pago');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al crear sesión de pago';
      console.error('Stripe payment error:', error);
      alert('Error: ' + message);
      setProcessing(false);
    }
  };

  const handleTransferenciaPayment = async () => {
    if (!validateFrequency()) return;
    setProcessing(true);
    try {
      const res = await apiPost('/payments/initiate', {
        classId,
        paymentMethod: 'transferencia',
        paymentFrequency: resolvedFrequency,
      });
      const result = await res.json();
      if (result.success) {
        alert(result.data?.message || 'Solicitud enviada. La academia confirmará la recepción del pago por Transferencia.');
        onPaymentComplete();
      } else {
        throw new Error(result.error || 'Error al registrar pago por Transferencia');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al registrar pago por Transferencia';
      alert('Error: ' + message);
    } finally {
      setProcessing(false);
    }
  };

  const handleBizumPayment = async () => {
    if (!validateFrequency()) return;
    setProcessing(true);
    try {
      const res = await apiPost('/payments/initiate', {
        classId,
        paymentMethod: 'bizum',
        paymentFrequency: resolvedFrequency,
      });
      const result = await res.json();
      if (result.success) {
        alert(result.data?.message || 'Solicitud enviada. La academia confirmará la recepción del pago por Bizum.');
        onPaymentComplete();
      } else {
        throw new Error(result.error || 'Error al registrar pago por Bizum');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al registrar pago por Bizum';
      alert('Error: ' + message);
    } finally {
      setProcessing(false);
    }
  };

  const currency = 'EUR';
  const transferenciaInfo = formatDisplayIban(academyPaymentInfo?.transferenciaIban);
  const bizumInfo = formatDisplayBizumPhone(academyPaymentInfo?.bizumPhone);
  const transferenciaAvailable = allowedPaymentMethods.includes('transferencia') && Boolean(transferenciaInfo);
  const bizumAvailable = allowedPaymentMethods.includes('bizum') && Boolean(bizumInfo);

  return {
    hasMonthly,
    hasOneTime,
    paymentFrequency,
    setPaymentFrequency,
    processing,
    needsFrequencySelection,
    allowedPaymentMethods,
    copiedField,
    copyToClipboard,
    currency,
    transferenciaInfo,
    bizumInfo,
    transferenciaAvailable,
    bizumAvailable,
    handleCashPayment,
    handleStripePayment,
    handleTransferenciaPayment,
    handleBizumPayment,
  };
}
