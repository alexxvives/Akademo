'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { apiClient } from '@/lib/api-client';
import { type ImportRow, type ClassRow, type ImportSummary, XLSX, normalizeRows, normalizeClassRows, parseCSV } from './migration-utils';
import { UploadStep, PreviewStep, ResultsStep } from './MigrationSteps';

interface MigrationModalProps {
  academyId: string;
  academyName: string;
  onClose: () => void;
}

export function MigrationModal({ academyId, academyName, onClose }: MigrationModalProps) {
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<ImportRow[]>([]);
  const [classPreview, setClassPreview] = useState<ClassRow[]>([]);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'upload' | 'preview' | 'results'>('upload');
  const [mounted, setMounted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setSummary(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const isXlsx = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    const isCsv = file.name.endsWith('.csv');
    if (!isXlsx && !isCsv) {
      setError('Solo se aceptan archivos .xlsx o .csv');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      let rows: ImportRow[] = [];
      let classRows: ClassRow[] = [];

      if (isXlsx) {
        const wb = XLSX.read(result, { type: 'array' });
        // Parse users from first sheet named "Usuarios" or the first sheet
        const usersSheetName = wb.SheetNames.find(n => n.toLowerCase() === 'usuarios') || wb.SheetNames[0];
        const ws = wb.Sheets[usersSheetName];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
        rows = normalizeRows(json);
        // Parse classes from sheet named "Clases" if present
        const clasesSheetName = wb.SheetNames.find(n => n.toLowerCase() === 'clases');
        if (clasesSheetName) {
          const wsClases = wb.Sheets[clasesSheetName];
          const jsonClases = XLSX.utils.sheet_to_json<Record<string, unknown>>(wsClases, { defval: '' });
          classRows = normalizeClassRows(jsonClases);
        }
      } else {
        rows = parseCSV(result as string);
      }

      if (rows.length === 0) {
        setError('No se pudo leer el archivo. Columnas requeridas: email, firstName (o nombre), lastName (o apellido). Opcionales: role, classes.');
        return;
      }
      setPreview(rows);
      setClassPreview(classRows);
      setStep('preview');
    };

    if (isXlsx) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setError('');
    try {
      const res = await apiClient('/admin/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ academyId, users: preview, classes: classPreview }),
      });
      const data = await res.json();
      if (data.success) {
        setSummary(data.data);
        setStep('results');
      } else {
        setError(data.error || 'Error en la importación');
      }
    } catch {
      setError('Error de red durante la importación');
    } finally {
      setImporting(false);
    }
  };

  const downloadResults = () => {
    if (!summary) return;
    const header = 'Row,Email,Status,Message,Temp Password\n';
    const csv = summary.results
      .map(r => `${r.row},"${r.email}",${r.status},"${r.message}",${r.tempPassword || ''}`)
      .join('\n');
    const blob = new Blob([header + csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `migration-results-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setPreview([]);
    setClassPreview([]);
    setSummary(null);
    setStep('upload');
    setError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSendWelcomeEmails = async (): Promise<{ sent: number; failed: number }> => {
    if (!summary) throw new Error('No summary');
    const users = summary.results
      .filter(r => r.status === 'created' && r.tempPassword)
      .map(r => {
        const row = preview.find(p => p.email.toLowerCase() === r.email.toLowerCase());
        return {
          email: r.email,
          firstName: row?.firstName || '',
          role: row?.role || 'STUDENT',
          tempPassword: r.tempPassword!,
        };
      });
    const res = await apiClient('/admin/send-welcome-emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ academyName, users }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Error sending emails');
    return data.data;
  };

  if (!mounted) return null;

  const maxWidth = step === 'preview' ? 'max-w-5xl' : 'max-w-3xl';

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[92vh] overflow-hidden`} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Migración CSV</h2>
            <p className="text-sm text-gray-500">{academyName}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto max-h-[calc(92vh-72px)]">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {step === 'upload' && <UploadStep fileRef={fileRef} handleFileUpload={handleFileUpload} />}
          {step === 'preview' && <PreviewStep preview={preview} classPreview={classPreview} importing={importing} reset={reset} handleImport={handleImport} />}
          {step === 'results' && summary && <ResultsStep summary={summary} downloadResults={downloadResults} reset={reset} onClose={onClose} onSendEmails={handleSendWelcomeEmails} />}
        </div>
      </div>
    </div>,
    document.body
  );
}
