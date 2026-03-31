'use client';

import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  type StudentPaymentDetailModalProps,
  formatCurrency,
  formatDate,
  PaymentListContent,
} from './StudentPaymentDetailHelpers';

export type { StudentPayment, StudentPaymentDetailModalProps } from './StudentPaymentDetailHelpers';

export function StudentPaymentDetailModal({
  isOpen,
  onClose,
  studentName,
  studentEmail,
  className,
  payments,
  paymentFrequency: _paymentFrequency,
  enrollmentDate,
  availableClasses = [],
  currentClassId: externalClassId,
  onClassChange,
}: StudentPaymentDetailModalProps) {
  // Internal state for class filtering
  const [internalClassId, setInternalClassId] = React.useState<string>(externalClassId || 'all');
  const [isFilterChanging, setIsFilterChanging] = React.useState(false);
  
  // Use internal state for filtering
  const currentClassId = internalClassId;
  
  // Update internal state when external prop changes
  React.useEffect(() => {
    setInternalClassId(externalClassId || 'all');
  }, [externalClassId]);
  
  // Reset filter loading when payments data changes
  React.useEffect(() => {
    setIsFilterChanging(false);
  }, [payments]);
  
  // Handle class change with internal state
  const handleClassChange = (classId: string) => {
    setIsFilterChanging(true);
    setInternalClassId(classId);
    onClassChange?.(classId);
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
                                Todas las asignaturas
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
                  
                  <PaymentListContent isFilterChanging={isFilterChanging} filteredPayments={filteredPayments} />
                </div>


              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
