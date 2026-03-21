'use client';

import { DeleteIcon } from '@/components/ui/DeleteIcon';
import { MONTHS } from '../types';
import type { BillingRecord } from '../types';

export function BillingRow({ record, onDelete }: { record: BillingRecord; onDelete: (id: string) => void }) {
  const total = record.enrollmentCount * record.pricePerEnrollment;
  return (
    <tr className="hover:bg-gray-50 text-xs">
      <td className="px-4 py-2 font-medium text-gray-800">{MONTHS[record.month - 1]} {record.year}</td>
      <td className="px-4 py-2 text-gray-600 text-center">{record.enrollmentCount}</td>
      <td className="px-4 py-2 text-gray-600 text-center">€{record.pricePerEnrollment.toFixed(2)}</td>
      <td className="px-4 py-2 font-semibold text-gray-900 text-center">€{total.toFixed(2)}</td>
      <td className="px-4 py-2 text-center">
        {record.paidAt
          ? <span className="text-xs text-gray-700">{new Date(record.paidAt).toLocaleDateString('es')}</span>
          : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Pendiente</span>}
      </td>
      <td className="px-4 py-2">
        <button onClick={() => onDelete(record.id)} className="text-gray-300 hover:text-red-500 transition-colors">
          <DeleteIcon size={14} />
        </button>
      </td>
    </tr>
  );
}
