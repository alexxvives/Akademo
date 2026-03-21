'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import type { BillingRecord } from '../types';

export function AddBillingForm({ academyId, onAdded }: { academyId: string; onAdded: (r: BillingRecord) => void }) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [month, setMonth] = useState(String(today.getMonth() + 1));
  const [year, setYear] = useState(String(today.getFullYear()));
  const [enrollmentCount, setEnrollmentCount] = useState('');
  const [price, setPrice] = useState('');
  const [paidAt, setPaidAt] = useState(todayStr);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiClient(`/admin/academy/${academyId}/billing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: Number(month),
          year: Number(year),
          enrollmentCount: enrollmentCount !== '' ? Number(enrollmentCount) : undefined,
          pricePerEnrollment: price !== '' ? Number(price) : 0,
          paidAt: paidAt || null,
        }),
      });
      const result = await res.json();
      if (result.success && result.data) { onAdded(result.data as BillingRecord); setEnrollmentCount(''); setPrice(''); }
    } catch { /* skip */ }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 items-end">
      <div className="flex flex-col gap-0.5">
        <label className="text-[10px] text-gray-500 uppercase tracking-wide">Mes</label>
        <select value={month} onChange={e => setMonth(e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-1 w-20">
          {['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'].map((m, i) => (
            <option key={i+1} value={String(i+1)}>{m}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-0.5">
        <label className="text-[10px] text-gray-500 uppercase tracking-wide">Año</label>
        <input type="number" value={year} onChange={e => setYear(e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-1 w-20" />
      </div>
      <div className="flex flex-col gap-0.5">
        <label className="text-[10px] text-gray-500 uppercase tracking-wide">Matrículas</label>
        <input placeholder="auto" type="number" value={enrollmentCount} onChange={e => setEnrollmentCount(e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-1 w-20" />
      </div>
      <div className="flex flex-col gap-0.5">
        <label className="text-[10px] text-gray-500 uppercase tracking-wide">€/matrícula</label>
        <input required type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" className="text-xs border border-gray-200 rounded px-2 py-1 w-20" />
      </div>
      <div className="flex flex-col gap-0.5">
        <label className="text-[10px] text-gray-500 uppercase tracking-wide">Pagado el</label>
        <input type="date" value={paidAt} onChange={e => setPaidAt(e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-1" />
      </div>
      <button type="submit" disabled={saving} className="px-3 py-1.5 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors">
        {saving ? '...' : 'Guardar'}
      </button>
    </form>
  );
}
