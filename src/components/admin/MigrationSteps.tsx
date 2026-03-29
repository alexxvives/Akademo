'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';
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
                <tr><td className="pr-4 py-1 text-gray-400">Rol <span className="text-gray-400">(opcional)</span></td><td className="pr-4">role, rol</td><td>STUDENT o TEACHER (default: STUDENT)</td></tr>
                <tr><td className="pr-4 py-1 text-gray-400">Clases <span className="text-gray-400">(opcional)</span></td><td className="pr-4">classes, clases, classNames</td><td>Nombres separados por coma (entre comillas)</td></tr>
                <tr><td className="pr-4 py-1 text-gray-400">Pago recibido <span className="text-gray-400">(opcional)</span></td><td className="pr-4">pagado, paid</td><td className="text-amber-600 font-medium">TRUE si ya se cobró el pago (efectivo, transferencia) — el alumno solo deberá firmar el documento</td></tr>
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
                <tr><td className="pr-4 py-1 text-gray-400">Precio <span>(opcional)</span></td><td className="pr-4">precio, price</td><td>Número (ej: 50)</td></tr>
                <tr><td className="pr-4 py-1 text-gray-400">Tipo Precio <span>(opcional)</span></td><td className="pr-4">tipoPrecio, pricetype, tipo</td><td>MENSUAL o UNICO</td></tr>
                <tr><td className="pr-4 py-1 text-gray-400">Fecha Inicio <span>(opcional)</span></td><td className="pr-4">fechaInicio, startdate, fecha</td><td className="text-amber-600 font-medium">Ej: 01/09/2026 — marca el primer día en que los alumnos empezarán a pagar</td></tr>
                <tr><td className="pr-4 py-1 text-gray-400">Profesor Email <span>(opcional)</span></td><td className="pr-4">profesorEmail, teacherEmail</td><td>Email de un profesor importado</td></tr>
                <tr><td className="pr-4 py-1 text-gray-400">Descripción <span>(opcional)</span></td><td className="pr-4">descripcion, description</td><td>Texto libre</td></tr>
                <tr><td className="pr-4 py-1 text-gray-400">Universidad <span>(opcional)</span></td><td className="pr-4">universidad, university</td><td>Nombre de la universidad</td></tr>
                <tr><td className="pr-4 py-1 text-gray-400">Carrera <span>(opcional)</span></td><td className="pr-4">carrera, degree</td><td>Nombre de la carrera</td></tr>
                <tr><td className="pr-4 py-1 text-gray-400">Máx. Estudiantes <span>(opcional)</span></td><td className="pr-4">maxEstudiantes, maxStudents</td><td>Número entero</td></tr>
                <tr><td className="pr-4 py-1 text-gray-400">WhatsApp <span>(opcional)</span></td><td className="pr-4">whatsapp, whatsappLink</td><td>URL del grupo</td></tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <div className="flex justify-center">
        <label className="px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors cursor-pointer">
          Seleccionar archivo
          <input
            ref={fileRef as React.RefObject<HTMLInputElement>}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
            className="sr-only"
          />
        </label>
      </div>
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
                  <th className="text-left px-4 py-2.5">Universidad</th>
                  <th className="text-left px-4 py-2.5">Carrera</th>
                  <th className="text-left px-4 py-2.5">Máx.</th>
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
                    <td className="px-4 py-2 text-gray-500 text-xs">{cls.university ?? '—'}</td>
                    <td className="px-4 py-2 text-gray-500 text-xs">{cls.carrera ?? '—'}</td>
                    <td className="px-4 py-2 text-gray-500 text-xs">{cls.maxStudents ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <h3 className="text-sm font-semibold text-gray-700">Usuarios — {preview.length} filas</h3>

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

      <div className="flex justify-center gap-3 pt-2">
        <button
          onClick={reset}
          disabled={importing}
          className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleImport}
          disabled={importing}
          className="px-6 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {importing && (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          )}
          {importing ? 'Importando...' : 'Importar a la base de datos'}
        </button>
      </div>
    </div>
  );
}

interface ResultsStepProps {
  summary: ImportSummary;
  downloadResults: () => void;
  reset: () => void;
  onClose: () => void;
}

export function ResultsStep({ summary, downloadResults, reset, onClose }: ResultsStepProps) {
  const hasCreated = summary.created > 0;

  useEffect(() => {
    if (summary.created > 0) {
      const end = Date.now() + 2000;
      const fire = () => {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 }, colors: ['#111827', '#6366f1', '#10b981'] });
        if (Date.now() < end) requestAnimationFrame(fire);
      };
      fire();
    }
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

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
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-800 mb-1">Emails de bienvenida</p>
          <p className="text-xs text-blue-700">
            Los usuarios creados recibirán su email de bienvenida con credenciales desde el panel de la academia. La academia decide cuándo enviarlos.
          </p>
        </div>
      )}

      {hasCreated && (
        <p className="text-xs text-amber-600 font-medium text-center">
          Las contraseñas temporales se muestran en la tabla. Descarga el CSV para guardarlas.
        </p>
      )}

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

      <div className="flex justify-center gap-3 pt-2">
        {hasCreated && (
          <button onClick={downloadResults} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
            Descargar CSV
          </button>
        )}
        <button onClick={onClose} className="px-6 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors">
          Cerrar
        </button>
      </div>
    </div>
  );
}
