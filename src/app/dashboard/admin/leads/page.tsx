'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  academyName: string | null;
  monthlyEnrollments: string | null;
  teacherCount: string | null;
  subjectCount: string | null;
  message: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_OPTIONS = [
  { value: 'new', label: 'Nuevo', color: 'bg-blue-100 text-blue-800' },
  { value: 'follow_up', label: 'Seguimiento', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'onboarding', label: 'Onboarding', color: 'bg-purple-100 text-purple-800' },
  { value: 'accepted', label: 'Aceptado', color: 'bg-green-100 text-green-800' },
  { value: 'discard', label: 'Descartado', color: 'bg-gray-100 text-gray-600' },
];

const FILTER_TABS = [
  { value: 'all', label: 'Todos' },
  { value: 'new', label: 'Nuevos' },
  { value: 'follow_up', label: 'Seguimiento' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'accepted', label: 'Aceptados' },
  { value: 'discard', label: 'Descartados' },
];

function StatusBadge({ status }: { status: string }) {
  const opt = STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${opt.color}`}>
      {opt.label}
    </span>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'Z');
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState('');

  const loadLeads = useCallback(async () => {
    try {
      const res = await apiClient(`/leads?status=${filter}`);
      const result = await res.json();
      if (result.success) {
        setLeads(result.data || []);
      }
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    loadLeads();
  }, [loadLeads]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await apiClient(`/leads/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await res.json();
      if (result.success) {
        setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: newStatus, updatedAt: new Date().toISOString() } : l)));
      }
    } catch (error) {
      console.error('Error updating lead:', error);
    }
  };

  const saveNotes = async (id: string) => {
    try {
      const res = await apiClient(`/leads/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ notes: notesValue }),
      });
      const result = await res.json();
      if (result.success) {
        setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, notes: notesValue } : l)));
        setEditingNotes(null);
      }
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  };

  const deleteLead = async (id: string) => {
    if (!confirm('¿Eliminar este lead permanentemente?')) return;
    try {
      const res = await apiClient(`/leads/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        setLeads((prev) => prev.filter((l) => l.id !== id));
        if (expandedId === id) setExpandedId(null);
      }
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  const statusCounts = leads.reduce<Record<string, number>>((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500 mt-1">{leads.length} solicitudes de propuesta</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => {
          const count = tab.value === 'all' ? leads.length : (statusCounts[tab.value] || 0);
          return (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === tab.value
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
                  filter === tab.value ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Leads List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 px-6 py-4">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-gray-100 rounded-lg animate-pulse flex-shrink-0" />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-40" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-56" />
                </div>
                <div className="hidden sm:flex flex-1 justify-center gap-6">
                  <div className="h-8 bg-gray-100 rounded animate-pulse w-16" />
                  <div className="h-8 bg-gray-100 rounded animate-pulse w-16" />
                  <div className="h-8 bg-gray-100 rounded animate-pulse w-16" />
                </div>
                <div className="h-3 bg-gray-100 rounded animate-pulse w-20" />
                <div className="w-4 h-4 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay leads</h3>
          <p className="text-gray-500">Las solicitudes de propuesta aparecerán aquí</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <div key={lead.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Lead Row */}
              <div
                className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); deleteLead(lead.id); }}
                  className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg flex-shrink-0 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900">{lead.name}</span>
                    <StatusBadge status={lead.status} />
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    <span>{lead.email}</span>
                    {lead.academyName && <span>• {lead.academyName}</span>}
                  </div>
                </div>
                <div className="hidden sm:flex flex-1 justify-center gap-6 text-sm text-gray-500">
                  {lead.monthlyEnrollments && (
                    <div className="text-center">
                      <div className="text-xs text-gray-400">Matrículas</div>
                      <div className="font-medium text-gray-700">{lead.monthlyEnrollments}</div>
                    </div>
                  )}
                  {lead.teacherCount && (
                    <div className="text-center">
                      <div className="text-xs text-gray-400">Profes</div>
                      <div className="font-medium text-gray-700">{lead.teacherCount}</div>
                    </div>
                  )}
                  {lead.subjectCount && (
                    <div className="text-center">
                      <div className="text-xs text-gray-400">Asignaturas</div>
                      <div className="font-medium text-gray-700">{lead.subjectCount}</div>
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-400 whitespace-nowrap">{formatDate(lead.createdAt)}</div>
                <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${expandedId === lead.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Expanded Detail */}
              {expandedId === lead.id && (
                <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                    {lead.phone && (
                      <div>
                        <span className="text-xs text-gray-400 uppercase tracking-wider">Teléfono</span>
                        <p className="text-sm text-gray-900 mt-0.5">{lead.phone}</p>
                      </div>
                    )}
                    {lead.academyName && (
                      <div>
                        <span className="text-xs text-gray-400 uppercase tracking-wider">Academia</span>
                        <p className="text-sm text-gray-900 mt-0.5">{lead.academyName}</p>
                      </div>
                    )}
                    {lead.monthlyEnrollments && (
                      <div>
                        <span className="text-xs text-gray-400 uppercase tracking-wider">Matrículas/mes</span>
                        <p className="text-sm text-gray-900 mt-0.5">{lead.monthlyEnrollments}</p>
                      </div>
                    )}
                    {lead.teacherCount && (
                      <div>
                        <span className="text-xs text-gray-400 uppercase tracking-wider">Profesores</span>
                        <p className="text-sm text-gray-900 mt-0.5">{lead.teacherCount}</p>
                      </div>
                    )}
                    {lead.subjectCount && (
                      <div>
                        <span className="text-xs text-gray-400 uppercase tracking-wider">Asignaturas</span>
                        <p className="text-sm text-gray-900 mt-0.5">{lead.subjectCount}</p>
                      </div>
                    )}
                    {lead.message && (
                      <div className="col-span-2">
                        <span className="text-xs text-gray-400 uppercase tracking-wider">Mensaje</span>
                        <p className="text-sm text-gray-900 mt-0.5">{lead.message}</p>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="mb-4">
                    <span className="text-xs text-gray-400 uppercase tracking-wider">Notas internas</span>
                    {editingNotes === lead.id ? (
                      <div className="mt-1 flex gap-2">
                        <textarea
                          value={notesValue}
                          onChange={(e) => setNotesValue(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                          rows={2}
                          placeholder="Añadir notas..."
                        />
                        <div className="flex flex-col gap-1">
                          <button onClick={() => saveNotes(lead.id)} className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-500">Guardar</button>
                          <button onClick={() => setEditingNotes(null)} className="px-3 py-1.5 bg-gray-200 text-gray-600 text-xs rounded-lg hover:bg-gray-300">Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="mt-1 text-sm text-gray-600 cursor-pointer hover:text-gray-900 min-h-[32px] flex items-center"
                        onClick={() => { setEditingNotes(lead.id); setNotesValue(lead.notes || ''); }}
                      >
                        {lead.notes || <span className="text-gray-400 italic">Clic para añadir notas...</span>}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-2">
                      <span className="text-xs text-gray-400">Cambiar estado:</span>
                      <div className="grid grid-cols-4 gap-2">
                        {STATUS_OPTIONS.filter((s) => s.value !== lead.status).map((s) => (
                          <button
                            key={s.value}
                            onClick={() => updateStatus(lead.id, s.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${s.color} hover:opacity-80 text-center`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteLead(lead.id)}
                      className="px-3 py-1.5 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
