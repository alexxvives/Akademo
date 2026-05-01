'use client';

/**
 * Standard form textarea — use this everywhere instead of raw <textarea>.
 * Ensures consistent border, padding, and focus ring with FormInput.
 */
export function FormTextarea({ className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors resize-y ${className}`}
    />
  );
}
