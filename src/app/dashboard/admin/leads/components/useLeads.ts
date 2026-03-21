'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { Lead } from './leads-types';

export function useLeads() {
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

  return {
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
  };
}
