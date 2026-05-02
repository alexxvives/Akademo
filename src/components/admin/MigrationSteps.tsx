'use client';


import { type ImportRow, type ClassRow, type QuizRow, type QuestionRow, type FileRow, type UrlRow, type ImportSummary } from './migration-utils';

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
          Sube un archivo <span className="font-semibold text-gray-700">.xlsx</span> con hojas separadas, o <span className="font-semibold text-gray-700">varios archivos .csv</span> (se detectan automáticamente por columnas).
        </p>

        <div className="grid grid-cols-2 gap-4 items-start">
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Hoja &ldquo;Usuarios&rdquo; (obligatoria)</p>
            <table className="text-xs text-gray-500 w-full">
              <thead>
                <tr className="text-gray-600">
                  <th className="text-left pr-4 pb-2 font-medium">Columna</th>
                  <th className="text-left pb-2 font-medium">Nota</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="pr-4 py-1 font-semibold text-gray-700">email</td><td><em className="text-gray-300 not-italic">Sin nota</em></td></tr>
                <tr><td className="pr-4 py-1 font-semibold text-gray-700">nombre</td><td><em className="text-gray-300 not-italic">Sin nota</em></td></tr>
                <tr><td className="pr-4 py-1 font-semibold text-gray-700">apellido</td><td><em className="text-gray-300 not-italic">Sin nota</em></td></tr>
                <tr><td className="pr-4 py-1 font-semibold text-gray-700">moodle_rol</td><td>student / editingteacher</td></tr>
                <tr><td className="pr-4 py-1 font-semibold text-gray-700">asignatura</td><td>Nombre del curso</td></tr>
              </tbody>
            </table>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Hoja &ldquo;Asignaturas&rdquo; (opcional)</p>
            <table className="text-xs text-gray-500 w-full">
              <thead>
                <tr className="text-gray-600">
                  <th className="text-left pr-4 pb-2 font-medium">Columna</th>
                  <th className="text-left pb-2 font-medium">Nota</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="pr-4 py-1 font-semibold text-gray-700">nombre</td><td><em className="text-gray-300 not-italic">Sin nota</em></td></tr>
                <tr><td className="pr-4 py-1 text-gray-400">fechaInicio <span className="text-gray-300">(opcional)</span></td><td>DD/MM/YYYY</td></tr>
                <tr><td className="pr-4 py-1 text-gray-400">precio <span className="text-gray-300">(opcional)</span></td><td>€ por cuota o total</td></tr>
                <tr><td className="pr-4 py-1 text-gray-400">cuotas <span className="text-gray-300">(opcional)</span></td><td>Nº de meses</td></tr>
              </tbody>
            </table>
          </div>
        </div>

          <div className="grid grid-cols-3 gap-4 items-start mt-4 pt-4 border-t border-gray-200">
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Hoja &ldquo;Quizzes&rdquo; (opcional)</p>
            <table className="text-xs text-gray-500 w-full">
              <thead>
                <tr className="text-gray-600">
                  <th className="text-left pr-4 pb-2 font-medium">Columna</th>
                  <th className="text-left pb-2 font-medium">Nota</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="pr-4 py-1 font-semibold text-gray-700">course_name</td><td>Nombre de asignatura</td></tr>
                <tr><td className="pr-4 py-1 font-semibold text-gray-700">quiz_id</td><td>ID del quiz (Moodle)</td></tr>
                <tr><td className="pr-4 py-1 font-semibold text-gray-700">quiz_name</td><td>Título del quiz</td></tr>
                <tr><td className="pr-4 py-1 text-gray-400">quiz_description</td><td>Descripción (HTML OK)</td></tr>
              </tbody>
            </table>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Hoja &ldquo;Questions&rdquo; (opcional)</p>
            <table className="text-xs text-gray-500 w-full">
              <thead>
                <tr className="text-gray-600">
                  <th className="text-left pr-4 pb-2 font-medium">Columna</th>
                  <th className="text-left pb-2 font-medium">Nota</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="pr-4 py-1 font-semibold text-gray-700">quiz_id</td><td>Enlaza con Quizzes</td></tr>
                <tr><td className="pr-4 py-1 font-semibold text-gray-700">question_id</td><td>ID de pregunta</td></tr>
                <tr><td className="pr-4 py-1 font-semibold text-gray-700">question_text</td><td>Texto (HTML OK)</td></tr>
                <tr><td className="pr-4 py-1 font-semibold text-gray-700">answer_id</td><td>ID de respuesta</td></tr>
                <tr><td className="pr-4 py-1 font-semibold text-gray-700">answer_text</td><td>Texto respuesta</td></tr>
                <tr><td className="pr-4 py-1 font-semibold text-gray-700">is_correct</td><td>1.0 = correcta</td></tr>
              </tbody>
            </table>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Hoja &ldquo;Files&rdquo; (opcional &mdash; manifiesto de archivos)</p>
            <table className="text-xs text-gray-500 w-full">
              <thead>
                <tr className="text-gray-600">
                  <th className="text-left pr-4 pb-2 font-medium">Columna</th>
                  <th className="text-left pb-2 font-medium">Nota</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="pr-4 py-1 font-semibold text-gray-700">file_title</td><td>Nombre del archivo</td></tr>
                <tr><td className="pr-4 py-1 font-semibold text-gray-700">course_name</td><td>Asignatura</td></tr>
                <tr><td className="pr-4 py-1 font-semibold text-gray-700">filename</td><td>Nombre de archivo</td></tr>
                <tr><td className="pr-4 py-1 text-gray-400">filesize</td><td>Bytes</td></tr>
                <tr><td className="pr-4 py-1 font-semibold text-gray-700">file_path</td><td>Ruta en SiteGround</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 items-start mt-4 pt-4 border-t border-gray-200">
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Hoja &ldquo;URLs&rdquo; (opcional)</p>
            <table className="text-xs text-gray-500 w-full max-w-md">
              <thead>
                <tr className="text-gray-600">
                  <th className="text-left pr-4 pb-2 font-medium">Columna</th>
                  <th className="text-left pb-2 font-medium">Nota</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="pr-4 py-1 font-semibold text-gray-700">link_title</td><td>Título del enlace</td></tr>
                <tr><td className="pr-4 py-1 font-semibold text-gray-700">url</td><td>URL del recurso</td></tr>
                <tr><td className="pr-4 py-1 font-semibold text-gray-700">course_name</td><td>Nombre de asignatura</td></tr>
                <tr><td className="pr-4 py-1 text-gray-400">section_number <span className="text-gray-300">(opcional)</span></td><td>Nº sección</td></tr>
                <tr><td className="pr-4 py-1 text-gray-400">section_name <span className="text-gray-300">(opcional)</span></td><td>Nombre sección</td></tr>
                <tr><td className="pr-4 py-1 text-gray-400">description <span className="text-gray-300">(opcional)</span></td><td>Descripción</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center">
        <label className="px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors cursor-pointer">
          Seleccionar Excel / CSV
          <input
            ref={fileRef as React.RefObject<HTMLInputElement>}
            type="file"
            accept=".csv,.xlsx,.xls"
            multiple
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
  quizPreview: QuizRow[];
  questionPreview: QuestionRow[];
  filePreview: FileRow[];
  urlPreview: UrlRow[];
  importing: boolean;
  reset: () => void;
  handleImport: () => void;
}

export function PreviewStep({ preview, classPreview, quizPreview, questionPreview, filePreview, urlPreview, importing, reset, handleImport }: PreviewStepProps) {
  const classNamesInFile = new Set(classPreview.map(c => c.name.toLowerCase().trim()));
  const classWarnings = preview
    .filter(row => row.classNames)
    .flatMap(row => {
      const names = row.classNames.split(',').map((n: string) => n.trim().toLowerCase()).filter(Boolean);
      const unmatched = names.filter((n: string) => !classNamesInFile.has(n));
      return unmatched.length > 0 ? [{ email: row.email, unmatched }] : [];
    });

  const teacherCount = preview.filter(r => r.role === 'TEACHER').length;
  const studentCount = preview.filter(r => r.role === 'STUDENT').length;

  return (
    <div className="space-y-4">
      {/* Detected summary */}
      <div className="flex flex-wrap gap-2 justify-center">
        {classPreview.length > 0 && <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold">{classPreview.length} asignaturas</span>}
        {teacherCount > 0 && <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold">{teacherCount} profesores</span>}
        {studentCount > 0 && <span className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-semibold">{studentCount} alumnos</span>}
        {quizPreview.length > 0 && <span className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-semibold">{quizPreview.length} cuestionarios</span>}
        {questionPreview.length > 0 && <span className="px-3 py-1.5 bg-pink-50 text-pink-700 rounded-lg text-xs font-semibold">{questionPreview.length} preguntas</span>}
        {filePreview.length > 0 && <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold">{filePreview.length} archivos</span>}
        {urlPreview.length > 0 && <span className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-xs font-semibold">{urlPreview.length} enlaces</span>}
      </div>
      {classWarnings.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold text-amber-800 mb-2">
            ⚠ Asignaturas no encontradas en este archivo ({classWarnings.length} usuario{classWarnings.length !== 1 ? 's' : ''} afectado{classWarnings.length !== 1 ? 's' : ''})
          </p>
          <ul className="text-xs text-amber-700 space-y-1 max-h-24 overflow-y-auto">
            {classWarnings.map((w, i) => (
              <li key={i}><span className="font-medium">{w.email}</span> → {w.unmatched.join(', ')}</li>
            ))}
          </ul>
          <p className="text-xs text-amber-600 mt-2">Si estas asignaturas ya existen en la base de datos no hay problema. Si no, añádelas a la hoja &ldquo;Clases&rdquo;.</p>
        </div>
      )}

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
  onClose: () => void;
}

export function ResultsStep({ summary, onClose }: ResultsStepProps) {
  const classesCreated = summary.classesCreated ?? 0;
  const quizzesCreated = summary.quizzesCreated ?? 0;
  const questionsCreated = summary.questionsCreated ?? 0;
  const documentsCreated = summary.documentsCreated ?? 0;
  const linksCreated = summary.linksCreated ?? 0;
  const teachersCreated = (summary.results || []).filter(r => r.status === 'created' && r.role === 'TEACHER').length;
  const teachersSkipped = (summary.results || []).filter(r => r.status === 'skipped' && r.role === 'TEACHER').length;
  const studentsCreated = (summary.results || []).filter(r => r.status === 'created' && r.role === 'STUDENT').length;
  const studentsSkipped = (summary.results || []).filter(r => r.status === 'skipped' && r.role === 'STUDENT').length;
  const classesExisted = (summary.classResults || []).filter(r => r.status === 'existed').length;
  const quizzesSkipped = (summary.quizResults || []).filter(r => r.status === 'skipped').length;
  const contentCardCount = [
    quizzesCreated > 0 || quizzesSkipped > 0,
    questionsCreated > 0,
    documentsCreated > 0,
    linksCreated > 0,
  ].filter(Boolean).length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <div className="border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Profesores</p>
          <p className="text-2xl font-bold text-gray-900">{teachersCreated}</p>
          <p className="text-xs text-gray-500 mt-0.5">Creados</p>
          {teachersSkipped > 0 && <p className="text-xs text-yellow-600 mt-1">{teachersSkipped} omitidos</p>}
        </div>
        <div className="border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Alumnos</p>
          <p className="text-2xl font-bold text-gray-900">{studentsCreated}</p>
          <p className="text-xs text-gray-500 mt-0.5">Creados</p>
          {studentsSkipped > 0 && <p className="text-xs text-yellow-600 mt-1">{studentsSkipped} omitidos</p>}
        </div>
        <div className="border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Asignaturas</p>
          <p className="text-2xl font-bold text-gray-900">{classesCreated}</p>
          <p className="text-xs text-gray-500 mt-0.5">Creadas</p>
          {classesExisted > 0 && <p className="text-xs text-yellow-600 mt-1">{classesExisted} ya existían</p>}
        </div>
      </div>
      {(quizzesCreated > 0 || questionsCreated > 0 || documentsCreated > 0 || linksCreated > 0 || quizzesSkipped > 0) && (
        <div className="grid grid-cols-2 gap-3">
          {(quizzesCreated > 0 || quizzesSkipped > 0) && (
            <div className="border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Cuestionarios</p>
              <p className="text-2xl font-bold text-gray-900">{quizzesCreated}</p>
              <p className="text-xs text-gray-500 mt-0.5">Creados</p>
              {quizzesSkipped > 0 && <p className="text-xs text-yellow-600 mt-1">{quizzesSkipped} omitidos</p>}
            </div>
          )}
          {questionsCreated > 0 && (
            <div className="border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Preguntas</p>
              <p className="text-2xl font-bold text-gray-900">{questionsCreated}</p>
              <p className="text-xs text-gray-500 mt-0.5">Creadas</p>
            </div>
          )}
          {documentsCreated > 0 && (
            <div className="border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Archivos</p>
              <p className="text-2xl font-bold text-gray-900">{documentsCreated}</p>
              <p className="text-xs text-gray-500 mt-0.5">Importados</p>
            </div>
          )}
          {linksCreated > 0 && (
            <div className={`border border-gray-200 rounded-xl p-4 text-center ${contentCardCount % 2 !== 0 ? 'col-span-2' : ''}`}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Enlaces</p>
              <p className="text-2xl font-bold text-gray-900">{linksCreated}</p>
              <p className="text-xs text-gray-500 mt-0.5">Creados</p>
            </div>
          )}
        </div>
      )}

      {summary.classResults && summary.classResults.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Asignaturas</p>
          <div className="overflow-x-auto max-h-60 overflow-y-auto border border-gray-200 rounded-xl">
            <table className="w-full text-sm">
              <thead className="text-gray-500 text-xs bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2.5">Nombre</th>
                  <th className="text-left px-4 py-2.5">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {summary.classResults.map((cr, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-900 font-medium">{cr.name}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        cr.status === 'created' ? 'bg-green-100 text-green-700' :
                        cr.status === 'error' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {cr.status === 'created' ? 'Creada' : cr.status === 'error' ? 'Error' : 'Ya existía'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Usuarios</p>
        <div className="overflow-x-auto max-h-60 overflow-y-auto border border-gray-200 rounded-xl">
          <table className="w-full text-sm">
            <thead className="text-gray-500 text-xs sticky top-0 bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2.5">#</th>
                <th className="text-left px-4 py-2.5">Email</th>
                <th className="text-left px-4 py-2.5">Estado</th>
                <th className="text-left px-4 py-2.5">Rol</th>

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
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.role === 'TEACHER' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {r.role === 'TEACHER' ? 'Profesor' : 'Alumno'}
                    </span>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>



      {summary.quizResults && summary.quizResults.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Detalle cuestionarios</p>
          <div className="overflow-x-auto max-h-48 overflow-y-auto border border-gray-200 rounded-xl">
            <table className="w-full text-sm">
              <thead className="text-gray-500 text-xs sticky top-0 bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2.5">Quiz</th>
                  <th className="text-left px-4 py-2.5">Asignatura</th>
                  <th className="text-left px-4 py-2.5">Preguntas</th>
                  <th className="text-left px-4 py-2.5">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {summary.quizResults.map((qr, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-900 font-medium">{qr.quizName}</td>
                    <td className="px-4 py-2 text-gray-500">{qr.courseName}</td>
                    <td className="px-4 py-2 text-gray-500">{qr.questionsCount}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        qr.status === 'created' ? 'bg-green-100 text-green-700' :
                        qr.status === 'error' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {qr.status === 'created' ? 'Creado' : qr.status === 'error' ? 'Error' : 'Omitido'}
                        {qr.message ? ` — ${qr.message}` : ''}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {summary.pdfManifest && summary.pdfManifest.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Manifiesto de archivos &mdash; descarga manual desde SiteGround</p>
          <div className="overflow-x-auto max-h-60 overflow-y-auto border border-gray-200 rounded-xl">
            <table className="w-full text-sm">
              <thead className="text-gray-500 text-xs sticky top-0 bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2.5">Título</th>
                  <th className="text-left px-4 py-2.5">Asignatura</th>
                  <th className="text-left px-4 py-2.5">Archivo</th>
                  <th className="text-left px-4 py-2.5">Tamaño</th>
                  <th className="text-left px-4 py-2.5">Ruta SiteGround</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {summary.pdfManifest.map((f, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-900 font-medium text-xs">{f.fileTitle}</td>
                    <td className="px-4 py-2 text-gray-500 text-xs">{f.courseName}</td>
                    <td className="px-4 py-2 text-gray-500 text-xs">{f.filename}</td>
                    <td className="px-4 py-2 text-gray-500 text-xs">{f.fileSizeKB} KB</td>
                    <td className="px-4 py-2 font-mono text-xs text-gray-400 break-all">{f.sitegroundPath}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-center gap-3 pt-2">
        <button onClick={onClose} className="px-6 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors">
          Cerrar
        </button>
      </div>
    </div>
  );
}
