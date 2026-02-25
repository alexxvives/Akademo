'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { SkeletonTable } from '@/components/ui/SkeletonLoader';
import { DeleteIcon } from '@/components/ui/DeleteIcon';

interface Academy {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  status: string;
  paymentStatus?: string;
  teacherCount: number;
  studentCount: number;
  enrollmentCount: number;
  classCount: number;
  createdAt: string;
}

interface BillingRecord {
  id: string; academyId: string;
  month: number; year: number;
  studentCount: number; enrollmentCount: number; teacherCount: number;
  pricePerEnrollment: number; notes: string | null; paidAt: string | null;
  createdAt: string;
}

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function BillingRow({ record, onDelete }: { record: BillingRecord; onDelete: (id: string) => void }) {
  const total = record.enrollmentCount * record.pricePerEnrollment;
  return (
    <tr className="hover:bg-gray-50 text-xs">
      <td className="px-4 py-2 font-medium text-gray-800">{MONTHS[record.month - 1]} {record.year}</td>
      <td className="px-4 py-2 text-gray-600 text-center">{record.enrollmentCount}</td>
      <td className="px-4 py-2 text-gray-600 text-center">€{record.pricePerEnrollment.toFixed(2)}</td>
      <td className="px-4 py-2 font-semibold text-gray-900 text-center">€{total.toFixed(2)}</td>
      <td className="px-4 py-2 text-center">
        {record.paidAt
          ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">{new Date(record.paidAt).toLocaleDateString('es')}</span>
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

function AddBillingForm({ academyId, onAdded }: { academyId: string; onAdded: (r: BillingRecord) => void }) {
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
    const today = new Date();
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
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 items-end pt-2 border-t border-gray-100 mt-2">
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

export default function AdminAcademies() {
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [billingByAcademy, setBillingByAcademy] = useState<Record<string, BillingRecord[]>>({});
  const [showDemo, setShowDemo] = useState(false);
  const filteredAcademies = academies.filter(a => showDemo || !a.name.toLowerCase().includes('demo'));

  useEffect(() => { loadAcademies(); }, []);

  const loadAcademies = async () => {
    try {
      const res = await apiClient('/admin/academies');
      const result = await res.json();
      if (result.success) setAcademies(result.data || []);
    } catch { /* skip */ } finally { setLoading(false); }
  };

  const loadBilling = useCallback(async (academyId: string) => {
    if (billingByAcademy[academyId]) return;
    try {
      const res = await apiClient(`/admin/academy/${academyId}/billing`);
      const result = await res.json();
      if (result.success) setBillingByAcademy(prev => ({ ...prev, [academyId]: result.data as BillingRecord[] }));
    } catch { /* skip */ }
  }, [billingByAcademy]);

  const handleToggleExpand = (academyId: string) => {
    if (expandedId === academyId) { setExpandedId(null); return; }
    setExpandedId(academyId);
    loadBilling(academyId);
  };

  const handleTogglePayment = async (academy: Academy) => {
    if (togglingId === academy.id) return;
    setTogglingId(academy.id);
    const newStatus = academy.paymentStatus === 'PAID' ? 'NOT PAID' : 'PAID';
    try {
      const res = await apiClient(`/admin/academy/${academy.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: newStatus }),
      });
      const result = await res.json();
      if (result.success) {
        setAcademies(prev => prev.map(a => a.id === academy.id ? { ...a, paymentStatus: newStatus } : a));
      }
    } catch { /* skip */ } finally { setTogglingId(null); }
  };

  const handleDelete = async (ownerId: string, academyName: string) => {
    if (!confirm(`¿Eliminar la academia "${academyName}" y todos sus datos? Esta acción no se puede deshacer.`)) return;
    setDeletingId(ownerId);
    try {
      const res = await apiClient(`/admin/users/${ownerId}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) await loadAcademies();
      else alert('Error: ' + result.error);
    } catch { alert('Error al eliminar la academia'); } finally { setDeletingId(null); }
  };

  const handleBillingAdded = (academyId: string, record: BillingRecord) => {
    setBillingByAcademy(prev => {
      const existing = (prev[academyId] ?? []).filter(r => r.id !== record.id);
      return { ...prev, [academyId]: [record, ...existing].sort((a, b) => b.year - a.year || b.month - a.month) };
    });
  };

  const handleBillingDeleted = async (academyId: string, billingId: string) => {
    try {
      await apiClient(`/admin/academy/${academyId}/billing/${billingId}`, { method: 'DELETE' });
      setBillingByAcademy(prev => ({ ...prev, [academyId]: (prev[academyId] ?? []).filter(r => r.id !== billingId) }));
    } catch { /* skip */ }
  };

  if (loading) return <SkeletonTable rows={10} cols={7} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Academias</h1>
          <p className="text-sm text-gray-500 mt-1">AKADEMO PLATFORM</p>
        </div>
        <button
          onClick={() => setShowDemo(prev => !prev)}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
            showDemo ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
          }`}
        >
          {showDemo ? 'Ocultar demo' : 'Mostrar demo'}
        </button>
      </div>

      {filteredAcademies.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Las academias aparecerán aquí cuando se registren</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="overflow-x-auto max-h-[700px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academia</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clases</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profesores</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estudiantes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matrículas</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado de Pago</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creada</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAcademies.map((academy) => (
                  <>
                    <tr key={academy.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => handleToggleExpand(academy.id)}>
                        <div className="flex items-center gap-2">
                          <svg className={`w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform ${expandedId === academy.id ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                          onClick={() => handleTogglePayment(academy)}
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
                        <span className="text-sm text-gray-500">{new Date(academy.createdAt).toLocaleDateString('es')}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleDelete(academy.ownerId, academy.name)}
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
                      </td>
                    </tr>

                    {expandedId === academy.id && (
                      <tr key={`billing-${academy.id}`}>
                        <td colSpan={8} className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Facturación mensual — {academy.ownerName}</p>
                          {!billingByAcademy[academy.id] ? (
                            <p className="text-xs text-gray-400">Cargando...</p>
                          ) : billingByAcademy[academy.id].length === 0 ? (
                            <p className="text-xs text-gray-400 mb-3">Sin registros de facturación todavía.</p>
                          ) : (
                            <div className="overflow-x-auto mb-3">
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
                                  {billingByAcademy[academy.id].map(r => (
                                    <BillingRow
                                      key={r.id}
                                      record={r}
                                      onDelete={(id) => handleBillingDeleted(academy.id, id)}
                                    />
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                          <AddBillingForm
                            academyId={academy.id}
                            onAdded={(r) => handleBillingAdded(academy.id, r)}
                          />
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
