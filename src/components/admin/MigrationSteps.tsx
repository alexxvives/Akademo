'use client';

import { useState } from 'react';
import { type ImportRow, type ClassRow, type ImportSummary } from './migration-utils';

interface UploadStepProps {
  fileRef: React.RefObject<HTMLInputElement | null>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function UploadStep({ fileRef, handleFileUpload }: UploadStepProps) {
  return (
    <div className="space-y-5">
      <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Formato del archivo (CSV o Excel)</h3>
        <p className="text-xs text-gray-500 mb-3">
          Sube un archivo <span className="font-semibold text-gray-700">.xlsx</span> (Excel) o <span className="font-semibold text-gray-700">.csv</span>. La primera fila debe ser el encabezado. Columnas requeridas en <span className="font-semibold text-gray-700">negrita</span>:
        </p>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Hoja &ldquo;Usuarios&rdquo; (obligatoria)</p>
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
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Hoja &ldquo;Clases&rdquo; (opcional — crea asignaturas nuevas)</p>
            <table className="text-xs text-gray-500 w-full">
              <thead>
                <tr className="text-gray-600">
                  <th className="text-left pr-4 pb-2 font-medium">Columna</th>
                  <th className="text-left pr-4 pb-2 font-medium">Nombres aceptados</th>
                  <th className="text-left pb-2 font-medium">Nota</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="pr-4 py-1 font-semibold text-gray-700">Nombre</td><td className="pr-4">nombre, name, asignatura</td><td>Obligatorio</td></tr>
                <tr><td className="pr-4 py-1">Precio</td><td className="pr-4">precio, price</td><td>Opcional (número)</td></tr>
                <tr><td className="pr-4 py-1">Tipo Precio</td><td className="pr-4">tipoPrecio, pricetype, tipo</td><td>MENSUAL o UNICO</td></tr>
                <tr><td className="pr-4 py-1">Fecha Inicio</td><td className="pr-4">fechaInicio, startdate, fecha</td><td>Opcional (ej: 01/09/2026)</td></tr>
                <tr><td className="pr-4 py-1">Profesor Email</td><td className="pr-4">profesorEmail, teacherEmail</td><td>Opcional (email existente)</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 bg-white rounded-lg border border-gray-200 p-3 font-mono text-xs text-gray-500">
          <p className="text-gray-400 mb-1"># Hoja Usuarios:</p>
          <p>email,nombre,apellido,rol,clases</p>
          <p>juan@gmail.com,Juan,García,STUDENT,&quot;Matemáticas 1,Inglés B2&quot;</p>
          <p className="mt-2 text-gray-400"># Hoja Clases:</p>
          <p>nombre,fechaInicio,precio,tipoPrecio,profesorEmail</p>
          <p>Matemáticas 1,01/09/2026,50,MENSUAL,miguel@ejemplo.com</p>
          <p>Inglés B2,,200,UNICO,sofia@ejemplo.com</p>
        </div>
      </div>

      <input
        ref={fileRef as React.RefObject<HTMLInputElement>}
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleFileUpload}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 file:cursor-pointer"
      />
    </div>
  );
}

interface PreviewStepProps {
  preview: ImportRow[];
  classPreview: ClassRow[];
  importing: boolean;
  reset: () => void;
  handleImport: () => void;
}

export function PreviewStep({ preview, classPreview, importing, reset, handleImport }: PreviewStepProps) {
  return (
    <div className="space-y-4">
      {classPreview.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Asignaturas a crear — {classPreview.length}</h3>
          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="w-full text-sm">
              <thead className="text-gray-500 text-xs bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2.5">Nombre</th>
                  <th className="text-left px-4 py-2.5">Precio</th>
                  <th className="text-left px-4 py-2.5">Inicio</th>
                  <th className="text-left px-4 py-2.5">Profesor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {classPreview.map((cls, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-900">{cls.name}</td>
                    <td className="px-4 py-2 text-gray-500">
                      {cls.price != null ? `€${cls.price}${cls.priceType === 'MENSUAL' ? '/mes' : cls.priceType === 'UNICO' ? ' único' : ''}` : '—'}
                    </td>
                    <td className="px-4 py-2 text-gray-500">{cls.startDate ?? '—'}</td>
                    <td className="px-4 py-2 text-gray-500 text-xs">{cls.teacherEmail ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Usuarios — {preview.length} filas</h3>
        <div className="flex gap-2">
          <button onClick={reset} className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleImport}
            disabled={importing}
            className="px-5 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {importing ? 'Importando...' : `Importar ${preview.length} usuarios${classPreview.length > 0 ? ` + ${classPreview.length} clases` : ''}`}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[55vh] overflow-y-auto border border-gray-200 rounded-xl">
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
  );
}

interface ResultsStepProps {
  summary: ImportSummary;
  downloadResults: () => void;
  reset: () => void;
  onClose: () => void;
  onSendEmails: () => Promise<{ sent: number; failed: number }>;
}

export function ResultsStep({ summary, downloadResults, reset, onClose, onSendEmails }: ResultsStepProps) {
  const hasCreated = summary.created > 0;
  const [emailState, setEmailState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [emailResult, setEmailResult] = useState<{ sent: number; failed: number } | null>(null);

  const handleSend = async () => {
    setEmailState('sending');
    try {
      const result = await onSendEmails();
      setEmailResult(result);
      setEmailState('sent');
    } catch {
      setEmailState('idle');
    }
  };

  return (
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

      {hasCreated && (
        <div className="rounded-xl border p-4
          border-amber-200 bg-amber-50
          data-[sent]:border-green-200 data-[sent]:bg-green-50"
          {...(emailState === 'sent' ? { 'data-sent': '' } : {})}>
          {emailState === 'idle' && (
            <>
              <p className="text-sm font-semibold text-amber-800 mb-1">Enviar emails de bienvenida</p>
              <p className="text-xs text-amber-700 mb-3">Cada usuario recibirá su email con contraseña temporal. Solo envía cuando hayas verificado la lista y la academia esté lista para recibir alumnos.</p>
              <button
                onClick={handleSend}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Enviar emails de bienvenida ({summary.created})
              </button>
            </>
          )}
          {emailState === 'sending' && (
            <p className="text-sm text-amber-700 font-medium">Enviando emails...</p>
          )}
          {emailState === 'sent' && emailResult && (
            <>
              <p className="text-sm font-semibold text-green-800 mb-1">✓ Emails enviados</p>
              <p className="text-xs text-green-700">
                {emailResult.sent} enviados correctamente{emailResult.failed > 0 ? ` · ${emailResult.failed} fallaron` : ''}.
              </p>
            </>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div>
          {hasCreated ? (
            <p className="text-xs text-amber-600 font-medium">
              Las contraseñas temporales se muestran en la tabla. Descarga el CSV para guardarlas.
            </p>
          ) : (
            <p className="text-xs text-gray-400">No se crearon usuarios nuevos.</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasCreated && (
            <button onClick={downloadResults} className="px-4 py-1.5 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors">
              Descargar CSV
            </button>
          )}
          <button onClick={reset} className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            Nueva importación
          </button>
          <button onClick={onClose} className="px-4 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
            Cerrar
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
  );
}
