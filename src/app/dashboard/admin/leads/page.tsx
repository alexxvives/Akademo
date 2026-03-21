'use client';

import { FILTER_TABS } from './components/leads-types';
import { useLeads } from './components/useLeads';
import { LeadRow } from './components/LeadRow';

export default function AdminLeadsPage() {
  const {
    leads,
    loading,
    filter,
    setFilter,
    expandedId,
    setExpandedId,
    editingNotes,
    setEditingNotes,
    notesValue,
    setNotesValue,
    updateStatus,
    saveNotes,
    deleteLead,
    statusCounts,
  } = useLeads();

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
            <LeadRow
              key={lead.id}
              lead={lead}
              expandedId={expandedId}
              setExpandedId={setExpandedId}
              editingNotes={editingNotes}
              setEditingNotes={setEditingNotes}
              notesValue={notesValue}
              setNotesValue={setNotesValue}
              updateStatus={updateStatus}
              saveNotes={saveNotes}
              deleteLead={deleteLead}
            />
          ))}
        </div>
      )}
    </div>
  );
}
