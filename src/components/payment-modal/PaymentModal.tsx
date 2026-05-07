'use client';

import { createPortal } from 'react-dom';
import type { PaymentModalProps } from './types';
import { usePaymentModal } from './usePaymentModal';
import { PaymentHeader } from './PaymentHeader';
import { ClassFullMessage } from './ClassFullMessage';
import { FrequencySelector } from './FrequencySelector';
import { PaymentMethodList } from './PaymentMethodList';

export default function PaymentModal(props: PaymentModalProps) {
  const {
    isOpen,
    onClose,
    className,
    academyName,
    currentPaymentStatus,
    currentPaymentMethod,
    monthlyPrice,
    oneTimePrice,
    maxStudents,
    currentStudentCount,
    firstPaymentAmount,
    missedCycles,
  } = props;

  const modal = usePaymentModal(props);

  if (!isOpen) return null;

  const isClassFull = maxStudents && currentStudentCount && currentStudentCount >= maxStudents;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl max-h-[94dvh] flex flex-col overflow-hidden">
        <PaymentHeader className={className} academyName={academyName} onClose={onClose} />

        {isClassFull ? (
          <div className="overflow-y-auto">
            <ClassFullMessage maxStudents={maxStudents} />
          </div>
        ) : (
          <div className="p-4 sm:p-8 overflow-y-auto">
            <FrequencySelector
              hasMonthly={modal.hasMonthly}
              hasOneTime={modal.hasOneTime}
              paymentFrequency={modal.paymentFrequency}
              setPaymentFrequency={modal.setPaymentFrequency}
              monthlyPrice={monthlyPrice}
              oneTimePrice={oneTimePrice}
              currency={modal.currency}
              missedCycles={missedCycles}
              firstPaymentAmount={firstPaymentAmount}
            />
            <PaymentMethodList
              paymentFrequency={modal.paymentFrequency}
              processing={modal.processing}
              allowedPaymentMethods={modal.allowedPaymentMethods}
              transferenciaAvailable={modal.transferenciaAvailable}
              bizumAvailable={modal.bizumAvailable}
              transferenciaInfo={modal.transferenciaInfo}
              bizumInfo={modal.bizumInfo}
              copiedField={modal.copiedField}
              copyToClipboard={modal.copyToClipboard}
              currentPaymentStatus={currentPaymentStatus}
              currentPaymentMethod={currentPaymentMethod}
              handleStripePayment={modal.handleStripePayment}
              handleTransferenciaPayment={modal.handleTransferenciaPayment}
              handleBizumPayment={modal.handleBizumPayment}
              handleCashPayment={modal.handleCashPayment}
            />
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
