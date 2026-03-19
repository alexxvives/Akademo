'use client';

import { useState, useRef } from 'react';
import { apiClient } from '@/lib/api-client';

interface ImportRow {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  classNames: string;
}

interface ImportResult {
  row: number;
  email: string;
  status: 'created' | 'skipped' | 'error';
  message: string;
  tempPassword?: string;
}

interface ImportSummary {
  created: number;
  skipped: number;
  errors: number;
  total: number;
  results: ImportResult[];
}

function parseCSV(text: string): ImportRow[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  const emailIdx = header.findIndex(h => h === 'email');
  const firstIdx = header.findIndex(h => h === 'firstname' || h === 'nombre');
  const lastIdx = header.findIndex(h => h === 'lastname' || h === 'apellido' || h === 'apellidos');
  const roleIdx = header.findIndex(h => h === 'role' || h === 'rol');
  const classIdx = header.findIndex(h => h === 'classes' || h === 'clases' || h === 'classnames');

  if (emailIdx === -1 || firstIdx === -1 || lastIdx === -1) return [];

  return lines.slice(1).map(line => {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { fields.push(current.trim()); current = ''; continue; }
      current += ch;
    }
    fields.push(current.trim());

    return {
      email: fields[emailIdx] || '',
      firstName: fields[firstIdx] || '',
      lastName: fields[lastIdx] || '',
      role: roleIdx !== -1 ? (fields[roleIdx] || 'STUDENT') : 'STUDENT',
      classNames: classIdx !== -1 ? (fields[classIdx] || '') : '',
    };
  }).filter(r => r.email);
}

interface MigrationModalProps {
  academyId: string;
  academyName: string;
  onClose: () => void;
}

export function MigrationModal({ academyId, academyName, onClose }: MigrationModalProps) {
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<ImportRow[]>([]);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'upload' | 'preview' | 'results'>('upload');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setSummary(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Solo se aceptan archivos .csv');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length === 0) {
        setError('No se pudo leer el CSV. Columnas requeridas: email, firstName (o nombre), lastName (o apellido). Opcionales: role, classes.');
        return;
      }
      setPreview(rows);
      setStep('preview');
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setImporting(true);
    setError('');
    try {
      const res = await apiClient('/admin/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ academyId, users: preview }),
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
    setSummary(null);
    setStep('upload');
    setError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
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
        <div className="px-6 py-5 overflow-y-auto max-h-[calc(85vh-70px)]">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-5">
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Formato del CSV (un solo archivo)</h3>
                <p className="text-xs text-gray-500 mb-3">
                  La primera fila debe ser el encabezado. Columnas requeridas en <span className="font-semibold text-gray-700">negrita</span>:
                </p>
                <table className="text-xs text-gray-500 w-full">
                  <thead>
                    <tr className="text-gray-600">
                      <th className="text-left pr-4 pb-2 font-medium">Columna</th>
                      <th className="text-left pr-4 pb-2 font-medium">Nombres aceptados</th>
                      <th className="text-left pb-2 font-medium">Nota</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="pr-4 py-1 font-semibold text-gray-700">Email</td><td className="pr-4">email</td><td>Obligatorio</td></tr>
                    <tr><td className="pr-4 py-1 font-semibold text-gray-700">Nombre</td><td className="pr-4">firstName, nombre</td><td>Obligatorio</td></tr>
                    <tr><td className="pr-4 py-1 font-semibold text-gray-700">Apellido</td><td className="pr-4">lastName, apellido, apellidos</td><td>Obligatorio</td></tr>
                    <tr><td className="pr-4 py-1">Rol</td><td className="pr-4">role, rol</td><td>STUDENT o TEACHER (default: STUDENT)</td></tr>
                    <tr><td className="pr-4 py-1">Clases</td><td className="pr-4">classes, clases, classNames</td><td>Nombres separados por coma (entre comillas)</td></tr>
                  </tbody>
                </table>

                <div className="mt-4 bg-white rounded-lg border border-gray-200 p-3 font-mono text-xs text-gray-500">
                  <p className="text-gray-400 mb-1"># Ejemplo:</p>
                  <p>email,nombre,apellido,rol,clases</p>
                  <p>juan@gmail.com,Juan,García,STUDENT,&quot;Matemáticas 1,Inglés B2&quot;</p>
                  <p>maria@gmail.com,María,López,TEACHER,&quot;Matemáticas 1&quot;</p>
                </div>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 file:cursor-pointer"
              />
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">Vista previa — {preview.length} filas</h3>
                <div className="flex gap-2">
                  <button onClick={reset} className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                    Cancelar
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={importing}
                    className="px-5 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {importing ? 'Importando...' : `Importar ${preview.length} usuarios`}
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto max-h-72 overflow-y-auto border border-gray-200 rounded-xl">
                <table className="w-full text-sm">
                  <thead className="text-gray-500 text-xs sticky top-0 bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-2.5">#</th>
                      <th className="text-left px-4 py-2.5">Email</th>
                      <th className="text-left px-4 py-2.5">Nombre</th>
                      <th className="text-left px-4 py-2.5">Apellido</th>
                      <th className="text-left px-4 py-2.5">Rol</th>
                      <th className="text-left px-4 py-2.5">Clases</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {preview.slice(0, 100).map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                        <td className="px-4 py-2 text-gray-900 font-medium">{row.email}</td>
                        <td className="px-4 py-2 text-gray-600">{row.firstName}</td>
                        <td className="px-4 py-2 text-gray-600">{row.lastName}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${row.role === 'TEACHER' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                            {row.role}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-gray-500 text-xs">{row.classNames || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 100 && (
                  <p className="text-xs text-gray-400 px-4 py-2 bg-gray-50">Mostrando 100 de {preview.length} filas</p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Results */}
          {step === 'results' && summary && (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-green-700">{summary.created}</p>
                  <p className="text-xs text-green-600">Creados</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-700">{summary.skipped}</p>
                  <p className="text-xs text-yellow-600">Omitidos</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-red-700">{summary.errors}</p>
                  <p className="text-xs text-red-600">Errores</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-amber-600 font-medium">
                  Descarga el CSV — contiene las contraseñas temporales para el primer login.
                </p>
                <div className="flex gap-2">
                  <button onClick={downloadResults} className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                    Descargar CSV
                  </button>
                  <button onClick={reset} className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                    Nueva importación
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto max-h-60 overflow-y-auto border border-gray-200 rounded-xl">
                <table className="w-full text-sm">
                  <thead className="text-gray-500 text-xs sticky top-0 bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-2.5">#</th>
                      <th className="text-left px-4 py-2.5">Email</th>
                      <th className="text-left px-4 py-2.5">Estado</th>
                      <th className="text-left px-4 py-2.5">Contraseña temp.</th>
                      <th className="text-left px-4 py-2.5">Mensaje</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {summary.results.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-400">{r.row}</td>
                        <td className="px-4 py-2 text-gray-900 font-medium">{r.email}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            r.status === 'created' ? 'bg-green-100 text-green-700' :
                            r.status === 'skipped' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {r.status === 'created' ? 'Creado' : r.status === 'skipped' ? 'Omitido' : 'Error'}
                          </span>
                        </td>
                        <td className="px-4 py-2 font-mono text-xs text-gray-500">{r.tempPassword || '—'}</td>
                        <td className="px-4 py-2 text-gray-500 text-xs">{r.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
