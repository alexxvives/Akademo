'use client';

import { DeleteIcon } from '@/components/ui/DeleteIcon';
import { BillingRow } from './BillingRow';
import { AddBillingForm } from './AddBillingForm';
import type { Academy, BillingRecord } from '../types';

interface AcademyRowProps {
  academy: Academy;
  expandedId: string | null;
  deletingId: string | null;
  togglingId: string | null;
  togglingDailyId: string | null;
  billingRecords: BillingRecord[] | undefined;
  onToggleExpand: (id: string) => void;
  onTogglePayment: (academy: Academy) => void;
  onToggleDaily: (academy: Academy) => void;
  onDelete: (ownerId: string, name: string) => void;
  onMigration: (academy: { id: string; name: string }) => void;
  onBillingAdded: (academyId: string, record: BillingRecord) => void;
  onBillingDeleted: (academyId: string, billingId: string) => void;
}

export function AcademyRow({
  academy, expandedId, deletingId, togglingId, togglingDailyId,
  billingRecords, onToggleExpand, onTogglePayment, onToggleDaily,
  onDelete, onMigration, onBillingAdded, onBillingDeleted,
}: AcademyRowProps) {
  const isExpanded = expandedId === academy.id;

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => onToggleExpand(academy.id)}>
          <div className="flex items-center gap-2">
            <svg className={`w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <div>
              <div className="text-sm font-medium text-gray-900">{academy.ownerName}</div>
              <div className="text-sm text-gray-500">{academy.ownerEmail}</div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap"><span className="text-sm text-gray-900">{academy.classCount || 0}</span></td>
        <td className="px-6 py-4 whitespace-nowrap"><span className="text-sm text-gray-900">{academy.teacherCount || 0}</span></td>
        <td className="px-6 py-4 whitespace-nowrap"><span className="text-sm text-gray-900">{academy.studentCount || 0}</span></td>
        <td className="px-6 py-4 whitespace-nowrap"><span className="text-sm text-gray-900">{academy.enrollmentCount || 0}</span></td>
        <td className="px-6 py-4 whitespace-nowrap">
          <button
            disabled={togglingId === academy.id}
            onClick={() => onTogglePayment(academy)}
            title="Haz clic para cambiar el estado"
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-all disabled:opacity-50 cursor-pointer hover:ring-2 hover:ring-offset-1 ${
              academy.paymentStatus === 'PAID'
                ? 'bg-green-100 text-green-800 hover:ring-green-400'
                : 'bg-red-100 text-red-800 hover:ring-red-400'
            }`}
          >
            {togglingId === academy.id ? (
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            ) : (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={academy.paymentStatus === 'PAID' ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'} />
              </svg>
            )}
            {academy.paymentStatus === 'PAID' ? 'PAGADO' : 'NO PAGADO'}
          </button>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          {academy.paymentStatus === 'PAID' ? (
            <span className="text-sm text-blue-700 font-medium">
              {academy.dailyCoMinutes ? `${Math.floor((academy.dailyCoMinutes || 0) / 60)}h ${(academy.dailyCoMinutes || 0) % 60}min` : '0h 0min'}
            </span>
          ) : (
            <span className="text-sm text-gray-400">—</span>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className="text-sm text-gray-500">{new Date(academy.createdAt).toLocaleDateString('es')}</span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onToggleDaily(academy)}
              disabled={togglingDailyId === academy.id}
              title={academy.dailyEnabled ? 'Deshabilitar Daily.co' : 'Habilitar Daily.co'}
              className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                academy.dailyEnabled
                  ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                  : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              {togglingDailyId === academy.id ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
            {academy.paymentStatus === 'PAID' && (
            <button
              onClick={() => onMigration({ id: academy.id, name: academy.ownerName })}
              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Migración CSV"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </button>
            )}
            <button
              onClick={() => onDelete(academy.ownerId, academy.name)}
              disabled={deletingId === academy.ownerId}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              title="Eliminar academia"
            >
              {deletingId === academy.ownerId ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              ) : (
                <DeleteIcon size={16} />
              )}
            </button>
          </div>
        </td>
      </tr>

      {isExpanded && (
        <tr>
          <td colSpan={9} className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Facturación mensual — {academy.ownerName}</p>
              <AddBillingForm
                academyId={academy.id}
                onAdded={(r) => onBillingAdded(academy.id, r)}
              />
            </div>
            {!billingRecords ? (
              <p className="text-xs text-gray-400">Cargando...</p>
            ) : billingRecords.length === 0 ? (
              <p className="text-xs text-gray-400">Sin registros de facturación todavía.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-400 uppercase tracking-wider">
                      <th className="px-4 py-1.5 text-left font-medium">Mes</th>
                      <th className="px-4 py-1.5 text-center font-medium">Matrículas</th>
                      <th className="px-4 py-1.5 text-center font-medium">€/matrícula</th>
                      <th className="px-4 py-1.5 text-center font-medium">Total</th>
                      <th className="px-4 py-1.5 text-center font-medium">Pagado</th>
                      <th className="px-4 py-1.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {billingRecords.map(r => (
                      <BillingRow
                        key={r.id}
                        record={r}
                        onDelete={(id) => onBillingDeleted(academy.id, id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
