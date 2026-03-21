'use client';

import { DeleteIcon } from '@/components/ui/DeleteIcon';
import type { Lead } from './leads-types';
import { STATUS_OPTIONS, StatusBadge, formatDate } from './leads-types';

interface LeadRowProps {
  lead: Lead;
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  editingNotes: string | null;
  setEditingNotes: (id: string | null) => void;
  notesValue: string;
  setNotesValue: (v: string) => void;
  updateStatus: (id: string, status: string) => void;
  saveNotes: (id: string) => void;
  deleteLead: (id: string) => void;
}

export function LeadRow({
  lead,
  expandedId,
  setExpandedId,
  editingNotes,
  setEditingNotes,
  notesValue,
  setNotesValue,
  updateStatus,
  saveNotes,
  deleteLead,
}: LeadRowProps) {
  const isExpanded = expandedId === lead.id;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Lead Row */}
      <div
        className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpandedId(isExpanded ? null : lead.id)}
      >
        <button
          onClick={(e) => { e.stopPropagation(); deleteLead(lead.id); }}
          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg flex-shrink-0 transition-colors"
        >
          <DeleteIcon size={16} />
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
        <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Expanded Detail */}
      {isExpanded && (
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-4">
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
          </div>
        </div>
      )}
    </div>
  );
}
