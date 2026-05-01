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
      className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors ${className}`}
    />
  );
}
