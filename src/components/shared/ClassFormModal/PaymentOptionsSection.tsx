'use client';

import React from 'react';
import type { ClassFormData } from './types';

interface PaymentOptionsSectionProps {
  formData: ClassFormData;
  setFormData: React.Dispatch<React.SetStateAction<ClassFormData>>;
  paymentOptionsError: boolean;
}

export function PaymentOptionsSection({
  formData,
  setFormData,
  paymentOptionsError,
}: PaymentOptionsSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">Opciones de pago</label>
        <span
          className={`text-xs px-2 py-1 rounded-full transition-all ${
            paymentOptionsError
              ? 'bg-red-100 text-red-700 border-2 border-red-400 font-medium'
              : 'text-gray-500 bg-gray-100'
          }`}
        >
          Selecciona al menos una
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Pago Único */}
        <button
          type="button"
          onClick={() => setFormData((f) => ({ ...f, allowOneTime: !f.allowOneTime }))}
          className={`relative p-4 border-2 rounded-xl transition-all duration-200 text-left ${
            formData.allowOneTime ? 'border-green-500 bg-green-50 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
              formData.allowOneTime ? 'border-green-500 bg-green-500' : 'border-gray-300'
            }`}>
              {formData.allowOneTime && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className={`text-sm font-semibold ${formData.allowOneTime ? 'text-green-900' : 'text-gray-700'}`}>Pago Único</span>
          </div>
          {formData.allowOneTime && (
            <p className="text-sm font-medium text-green-700 mt-2">
              Total: ${formData.price ? parseFloat(formData.price).toFixed(2) : '0.00'}
            </p>
          )}
        </button>

        {/* Pago Mensual */}
        <button
          type="button"
          onClick={() => setFormData((f) => ({ ...f, allowMonthly: !f.allowMonthly }))}
          className={`relative p-4 border-2 rounded-xl transition-all duration-200 text-left ${
            formData.allowMonthly ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
              formData.allowMonthly ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
            }`}>
              {formData.allowMonthly && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className={`text-sm font-semibold ${formData.allowMonthly ? 'text-blue-900' : 'text-gray-700'}`}>Pago Mensual</span>
          </div>
          {formData.allowMonthly && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <span className="text-xs text-blue-700 font-medium whitespace-nowrap">Nº cuotas</span>
              <input
                type="number"
                min="1"
                step="1"
                value={formData.numCobros}
                onChange={(e) => {
                  const numCobros = e.target.value;
                  setFormData((f) => ({
                    ...f,
                    numCobros,
                    monthlyPrice: numCobros && f.price
                      ? (parseFloat(f.price) / parseInt(numCobros)).toFixed(2)
                      : '',
                  }));
                }}
                className="w-20 px-2 py-1 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                placeholder=""
              />
            </div>
          )}
          {formData.allowMonthly && formData.numCobros && formData.price && parseInt(formData.numCobros) > 0 && (
            <p className="text-xs text-blue-600 mt-1.5 font-medium">
              ${(parseFloat(formData.price) / parseInt(formData.numCobros)).toFixed(2)}/mes × {formData.numCobros} mes{parseInt(formData.numCobros) !== 1 ? 'es' : ''}
            </p>
          )}
        </button>
      </div>
    </div>
  );
}
