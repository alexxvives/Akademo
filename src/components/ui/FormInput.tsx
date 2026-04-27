'use client';

import React from 'react';

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

/**
 * Standard form input. Enforces the platform's canonical input style:
 * border border-gray-200 rounded-lg px-3 py-2 text-sm, brand focus ring.
 */
export function FormInput({ className = '', ...props }: FormInputProps) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm ${className}`}
    />
  );
}
