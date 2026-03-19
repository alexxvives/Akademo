'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

interface Academy {
  id: string;
  name: string;
  classCount: number;
}

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
    // Handle CSV fields with commas inside quotes
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

export default function MigrationPage() {
  const [academies, setAcademies] = useState<Academy[]>([]);
  const searchParams = useSearchParams();
  const [selectedAcademy, setSelectedAcademy] = useState('');
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<ImportRow[]>([]);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'upload' | 'preview' | 'results'>('upload');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAcademies();
  }, []);

  const loadAcademies = async () => {
    try {
      const res = await apiClient('/admin/academies');
      const data = await res.json();
      if (data.success) {
        setAcademies(data.data || []);
        const paramId = searchParams.get('academyId');
        if (paramId && (data.data || []).some((a: Academy) => a.id === paramId)) {
          setSelectedAcademy(paramId);
        }
      }
    } catch {
      setError('Error loading academies');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setSummary(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Only .csv files are accepted');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length === 0) {
        setError('Could not parse CSV. Required columns: email, firstName (or nombre), lastName (or apellido). Optional: role, classes.');
        return;
      }
      setPreview(rows);
      setStep('preview');
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!selectedAcademy) {
      setError('Select an academy first');
      return;
    }
    setImporting(true);
    setError('');
    try {
      const res = await apiClient('/admin/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ academyId: selectedAcademy, users: preview }),
      });
      const data = await res.json();
      if (data.success) {
        setSummary(data.data);
        setStep('results');
      } else {
        setError(data.error || 'Import failed');
      }
    } catch {
      setError('Network error during import');
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-48" />
          <div className="h-64 bg-gray-800 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-white mb-1">Migración de Academia</h1>
      <p className="text-gray-400 text-sm mb-6">
        Importa profesores y estudiantes desde un CSV para una academia existente.
      </p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Academy selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">Academia</label>
        <select
          value={selectedAcademy}
          onChange={(e) => setSelectedAcademy(e.target.value)}
          className="w-full max-w-md bg-[#1a1e2e] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#b1e787]"
        >
          <option value="">Seleccionar academia...</option>
          {academies.map(a => (
            <option key={a.id} value={a.id}>{a.name} ({a.classCount} clases)</option>
          ))}
        </select>
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="bg-[#1a1e2e] border border-gray-700 rounded-xl p-8">
          <h2 className="text-lg font-semibold text-white mb-4">Subir CSV</h2>

          <div className="bg-[#141827] rounded-xl p-6 mb-6">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Formato del CSV</h3>
            <p className="text-xs text-gray-400 mb-3">
              La primera fila debe ser el encabezado. Columnas requeridas en <span className="text-white font-medium">negrita</span>:
            </p>
            <div className="overflow-x-auto">
              <table className="text-xs text-gray-400 border-collapse">
                <thead>
                  <tr className="text-gray-300">
                    <th className="text-left pr-6 pb-2 font-medium">Columna</th>
                    <th className="text-left pr-6 pb-2 font-medium">Nombres aceptados</th>
                    <th className="text-left pb-2 font-medium">Nota</th>
                  </tr>
                </thead>
                <tbody className="space-y-1">
                  <tr><td className="pr-6 py-1 text-white font-medium">Email</td><td className="pr-6">email</td><td>Obligatorio</td></tr>
                  <tr><td className="pr-6 py-1 text-white font-medium">Nombre</td><td className="pr-6">firstName, nombre</td><td>Obligatorio</td></tr>
                  <tr><td className="pr-6 py-1 text-white font-medium">Apellido</td><td className="pr-6">lastName, apellido, apellidos</td><td>Obligatorio</td></tr>
                  <tr><td className="pr-6 py-1">Rol</td><td className="pr-6">role, rol</td><td>STUDENT o TEACHER (default: STUDENT)</td></tr>
                  <tr><td className="pr-6 py-1">Clases</td><td className="pr-6">classes, clases, classNames</td><td>Nombres separados por coma (entre comillas)</td></tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 bg-[#0d1017] rounded-lg p-3 font-mono text-xs text-gray-400">
              <p className="text-gray-500 mb-1"># Ejemplo:</p>
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
            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-[#b1e787] file:text-gray-900 hover:file:bg-[#9ed674] file:cursor-pointer"
          />
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 'preview' && (
        <div className="bg-[#1a1e2e] border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Vista previa ({preview.length} filas)</h2>
            <div className="flex gap-3">
              <button onClick={reset} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleImport}
                disabled={importing || !selectedAcademy}
                className="px-6 py-2 bg-[#b1e787] text-gray-900 text-sm font-medium rounded-xl hover:bg-[#9ed674] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {importing ? 'Importando...' : `Importar ${preview.length} usuarios`}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-400 text-xs sticky top-0 bg-[#1a1e2e]">
                <tr>
                  <th className="text-left pb-3 pr-4">#</th>
                  <th className="text-left pb-3 pr-4">Email</th>
                  <th className="text-left pb-3 pr-4">Nombre</th>
                  <th className="text-left pb-3 pr-4">Apellido</th>
                  <th className="text-left pb-3 pr-4">Rol</th>
                  <th className="text-left pb-3">Clases</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 100).map((row, i) => (
                  <tr key={i} className="border-t border-gray-800">
                    <td className="py-2 pr-4 text-gray-500">{i + 1}</td>
                    <td className="py-2 pr-4 text-white">{row.email}</td>
                    <td className="py-2 pr-4 text-gray-300">{row.firstName}</td>
                    <td className="py-2 pr-4 text-gray-300">{row.lastName}</td>
                    <td className="py-2 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${row.role === 'TEACHER' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                        {row.role}
                      </span>
                    </td>
                    <td className="py-2 text-gray-400 text-xs">{row.classNames || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 100 && (
              <p className="text-xs text-gray-500 mt-2">Mostrando 100 de {preview.length} filas</p>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Results */}
      {step === 'results' && summary && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-400">{summary.created}</p>
              <p className="text-xs text-green-400/70">Creados</p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-yellow-400">{summary.skipped}</p>
              <p className="text-xs text-yellow-400/70">Omitidos (ya existían)</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-red-400">{summary.errors}</p>
              <p className="text-xs text-red-400/70">Errores</p>
            </div>
          </div>

          <div className="bg-[#1a1e2e] border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Resultados detallados</h2>
              <div className="flex gap-3">
                <button onClick={downloadResults} className="px-4 py-2 text-sm bg-[#b1e787] text-gray-900 font-medium rounded-xl hover:bg-[#9ed674] transition-colors">
                  Descargar CSV con contraseñas
                </button>
                <button onClick={reset} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                  Nueva importación
                </button>
              </div>
            </div>

            <p className="text-xs text-yellow-400/80 mb-4">
              Descarga el CSV de resultados — contiene las contraseñas temporales que los usuarios necesitarán para su primer login.
            </p>

            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="text-gray-400 text-xs sticky top-0 bg-[#1a1e2e]">
                  <tr>
                    <th className="text-left pb-3 pr-4">#</th>
                    <th className="text-left pb-3 pr-4">Email</th>
                    <th className="text-left pb-3 pr-4">Estado</th>
                    <th className="text-left pb-3 pr-4">Contraseña temp.</th>
                    <th className="text-left pb-3">Mensaje</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.results.map((r, i) => (
                    <tr key={i} className="border-t border-gray-800">
                      <td className="py-2 pr-4 text-gray-500">{r.row}</td>
                      <td className="py-2 pr-4 text-white">{r.email}</td>
                      <td className="py-2 pr-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          r.status === 'created' ? 'bg-green-500/20 text-green-400' :
                          r.status === 'skipped' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {r.status === 'created' ? 'Creado' : r.status === 'skipped' ? 'Omitido' : 'Error'}
                        </span>
                      </td>
                      <td className="py-2 pr-4 font-mono text-xs text-gray-300">{r.tempPassword || '—'}</td>
                      <td className="py-2 text-gray-400 text-xs">{r.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
