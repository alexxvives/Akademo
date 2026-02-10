'use client';

import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

interface StudentPayment {
  id: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  paymentDate: string;
  dueDate?: string;
  isLate?: boolean;
  approvedBy?: string;
  monthNumber?: number; // For monthly payments (Month 1, 2, 3...)
  className?: string; // Payment's specific class, if available
}

interface StudentPaymentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  studentEmail: string;
  className: string;
  payments: StudentPayment[];
  paymentFrequency: 'ONE_TIME' | 'MONTHLY';
  enrollmentDate: string;
  availableClasses?: {id: string; name: string}[];
  currentClassId?: string;
  onClassChange?: (classId: string) => void;
}

export function StudentPaymentDetailModal({
  isOpen,
  onClose,
  studentName,
  studentEmail,
  className,
  payments,
  paymentFrequency,
  enrollmentDate,
  availableClasses = [],
  currentClassId: externalClassId,
  onClassChange,
}: StudentPaymentDetailModalProps) {
  // Internal state for class filtering
  const [internalClassId, setInternalClassId] = React.useState<string>(externalClassId || 'all');
  
  // Use internal state for filtering
  const currentClassId = internalClassId;
  
  // Update internal state when external prop changes
  React.useEffect(() => {
    setInternalClassId(externalClassId || 'all');
  }, [externalClassId]);
  
  // Handle class change with internal state
  const handleClassChange = (classId: string) => {
    setInternalClassId(classId);
    onClassChange?.(classId);
  };
  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getPaymentStatusBadge = (payment: StudentPayment) => {
    if (payment.status === 'COMPLETED' || payment.status === 'PAID') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Pagado
        </span>
      );
    } else if (payment.status === 'PENDING' || payment.status === 'CASH_PENDING') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          Pendiente
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        Rechazado
      </span>
    );
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'stripe':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/>
          </svg>
        );
      case 'cash':
      case 'efectivo':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
          </svg>
        );
      case 'bizum':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
            <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  // Filter payments by selected class if not 'all'
  const filteredPayments = currentClassId && currentClassId !== 'all' 
    ? payments.filter(p => {
        // Match by className from the payment
        const matchingClass = availableClasses.find(c => c.id === currentClassId);
        return matchingClass && p.className === matchingClass.name;
      })
    : payments;

  const pendingPayments = filteredPayments.filter(p => p.status === 'PENDING' || p.status === 'CASH_PENDING');
  const completedPayments = filteredPayments.filter(p => p.status === 'COMPLETED' || p.status === 'PAID');
  const _onTimePayments = completedPayments.filter(p => !p.isLate).length;
  const _latePayments = completedPayments.filter(p => p.isLate).length;
  
  // Calculate filtered totals based on current class filter
  const filteredTotalPaid = completedPayments.reduce((sum, p) => sum + p.amount, 0);
  const filteredTotalDue = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                {/* Header */}
                <div className="bg-gradient-to-br from-[#1a1c29] to-[#2a2d3d] px-6 py-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Dialog.Title className="text-2xl font-bold text-white text-center mb-1">
                        {studentName}
                      </Dialog.Title>
                      <p className="text-white/60 text-sm text-center mb-1">{studentEmail}</p>
                      
                      {/* Class Badge - Clickable dropdown if multiple classes */}
                      <div className="flex items-center justify-center gap-3 mt-3">
                        {availableClasses.length > 1 ? (
                          <div className="relative group">
                            <button className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full hover:bg-white/15 transition-colors">
                              <svg className="w-3.5 h-3.5 text-accent-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                              <span className="text-white text-sm font-medium">{className}</span>
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                              <button
                                onClick={() => handleClassChange('all')}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                                  currentClassId === 'all' ? 'bg-accent-50 text-accent-700 font-medium' : 'text-gray-700'
                                }`}
                              >
                                Todas las clases
                              </button>
                              {availableClasses.map(cls => (
                                <button
                                  key={cls.id}
                                  onClick={() => handleClassChange(cls.id)}
                                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                                    cls.id === currentClassId ? 'bg-accent-50 text-accent-700 font-medium' : 'text-gray-700'
                                  }`}
                                >
                                  {cls.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full">
                            <svg className="w-3.5 h-3.5 text-accent-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <span className="text-white text-sm font-medium">{className}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Enrollment Date - Below badge */}
                      <div className="flex items-center justify-center gap-2 text-white/50 text-xs mt-2">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Inscrito el {formatDate(enrollmentDate)}</span>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="text-white/80 hover:text-white transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="p-6 bg-gray-50 border-b border-gray-200">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Total Pagado */}
                    <div className="bg-white rounded-xl p-5 border-2 border-gray-200 shadow-sm text-center">
                      <div className="text-sm font-medium text-gray-600 mb-2">Total Pagado</div>
                      <div className="text-3xl font-bold text-green-600">{formatCurrency(filteredTotalPaid)}</div>
                    </div>

                    {/* Pendiente a Pagar */}
                    <div className="bg-white rounded-xl p-5 border-2 border-gray-200 shadow-sm text-center">
                      <div className="text-sm font-medium text-gray-600 mb-2">Pendiente a Pagar</div>
                      <div className="text-3xl font-bold text-orange-600">{formatCurrency(filteredTotalDue)}</div>
                    </div>
                  </div>
                </div>

                {/* Payment Timeline - Compact Cards */}
                <div className="p-6 max-h-[450px] overflow-y-auto">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">
                    Historial de Pagos
                  </h3>
                  
                  {filteredPayments.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                      <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p className="text-sm font-medium text-gray-500">No hay pagos registrados</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredPayments.map((payment) => {
                        return (
                          <div key={payment.id} className="bg-white border border-gray-200 rounded-lg px-4 py-2.5 hover:border-gray-300 hover:shadow-sm transition-all">
                            <div className="flex items-center justify-between gap-4">
                              {/* Left: Status & Method */}
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                {getPaymentStatusBadge(payment)}
                                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                  {getPaymentMethodIcon(payment.paymentMethod)}
                                  <span className="capitalize truncate">{payment.paymentMethod === 'cash' ? 'Efectivo' : payment.paymentMethod}</span>
                                </div>
                              </div>
                              
                              {/* Center: Class & Date */}
                              <div className="flex flex-col items-center gap-0.5 min-w-0 flex-1">
                                <span className="text-xs font-semibold text-gray-700 truncate max-w-full">{payment.className || className}</span>
                                <span className="text-xs text-gray-500">{formatDate(payment.paymentDate)}</span>
                              </div>
                              
                              {/* Right: Month & Amount */}
                              <div className="flex items-center gap-3 flex-shrink-0">
                                {paymentFrequency === 'MONTHLY' && payment.monthNumber && (
                                  <span className="text-xs font-semibold text-gray-600 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                                    M{payment.monthNumber}
                                  </span>
                                )}
                                <div className="text-right">
                                  <div className="text-sm font-bold text-gray-900 whitespace-nowrap">
                                    {formatCurrency(payment.amount, payment.currency)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 flex justify-end border-t border-gray-200">
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 font-medium text-sm transition-colors shadow-sm"
                  >
                    Cerrar
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
