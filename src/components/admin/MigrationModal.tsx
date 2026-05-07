'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { apiClient, API_BASE_URL } from '@/lib/api-client';
import { type ImportRow, type ClassRow, type QuizRow, type QuestionRow, type FileRow, type UrlRow, type ImportSummary, XLSX, normalizeRows, normalizeClassRows, normalizeQuizRows, normalizeQuestionRows, normalizeFileRows, normalizeUrlRows, parseCSV, parseCSVGeneric } from './migration-utils';
import { UploadStep, PreviewStep, ResultsStep } from './MigrationSteps';

type DocumentManifestEntry = Record<string, unknown>;

interface MigrationModalProps {
  academyId: string;
  academyName: string;
  onClose: () => void;
}

export function MigrationModal({ academyId, academyName, onClose }: MigrationModalProps) {
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<ImportRow[]>([]);
  const [classPreview, setClassPreview] = useState<ClassRow[]>([]);
  const [quizPreview, setQuizPreview] = useState<QuizRow[]>([]);
  const [questionPreview, setQuestionPreview] = useState<QuestionRow[]>([]);
  const [filePreview, setFilePreview] = useState<FileRow[]>([]);
  const [urlPreview, setUrlPreview] = useState<UrlRow[]>([]);
  const [documentManifest, setDocumentManifest] = useState<DocumentManifestEntry[]>([]);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'upload' | 'preview' | 'results'>('upload');
  const [mounted, setMounted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setSummary(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Single xlsx = all sheets in one file
    const firstFile = files[0];
    const isXlsx = firstFile.name.endsWith('.xlsx') || firstFile.name.endsWith('.xls');
    const allCsv = Array.from(files).every(f => f.name.endsWith('.csv') || f.name.endsWith('.json'));
    if (!isXlsx && !allCsv) {
      setError('Sube un archivo .xlsx (con hojas), varios archivos .csv, o incluye el documents-manifest.json');
      return;
    }

    if (isXlsx) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result;
        const wb = XLSX.read(result, { type: 'array' });
        let rows: ImportRow[] = [];
        let classRows: ClassRow[] = [];
        let quizRows: QuizRow[] = [];
        let questionRows: QuestionRow[] = [];
        let fileRows: FileRow[] = [];

        const usersSheetName = wb.SheetNames.find(n => n.toLowerCase() === 'usuarios') || wb.SheetNames[0];
        const ws = wb.Sheets[usersSheetName];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
        rows = normalizeRows(json);

        const clasesSheetName = wb.SheetNames.find(n => ['asignaturas', 'asignatura', 'clases', 'classes'].includes(n.toLowerCase()));
        if (clasesSheetName) {
          const wsClases = wb.Sheets[clasesSheetName];
          classRows = normalizeClassRows(XLSX.utils.sheet_to_json<Record<string, unknown>>(wsClases, { defval: '' }));
        }
        const quizzesSheetName = wb.SheetNames.find(n => ['quizzes', 'cuestionarios', 'quiz'].includes(n.toLowerCase()));
        if (quizzesSheetName) {
          const wsQuiz = wb.Sheets[quizzesSheetName];
          quizRows = normalizeQuizRows(XLSX.utils.sheet_to_json<Record<string, unknown>>(wsQuiz, { defval: '' }));
        }
        const questionsSheetName = wb.SheetNames.find(n => ['questions', 'preguntas'].includes(n.toLowerCase()));
        if (questionsSheetName) {
          const wsQ = wb.Sheets[questionsSheetName];
          questionRows = normalizeQuestionRows(XLSX.utils.sheet_to_json<Record<string, unknown>>(wsQ, { defval: '' }));
        }
        const filesSheetName = wb.SheetNames.find(n => ['files', 'archivos', 'pdfs', 'documentos'].includes(n.toLowerCase()));
        if (filesSheetName) {
          const wsF = wb.Sheets[filesSheetName];
          fileRows = normalizeFileRows(XLSX.utils.sheet_to_json<Record<string, unknown>>(wsF, { defval: '' }));
        }

        if (rows.length === 0 && classRows.length === 0 && quizRows.length === 0) {
          setError('No se pudo leer el archivo. Asegúrate de que las hojas tengan las columnas correctas.');
          return;
        }
        setPreview(rows);
        setClassPreview(classRows);
        setQuizPreview(quizRows);
        setQuestionPreview(questionRows);
        setFilePreview(fileRows);
        setStep('preview');
      };
      reader.readAsArrayBuffer(firstFile);
    } else {
      // Multiple CSVs: auto-detect by filename or column headers
      let rows: ImportRow[] = [];
      let classRows: ClassRow[] = [];
      let quizRows: QuizRow[] = [];
      let questionRows: QuestionRow[] = [];
      let fileRows: FileRow[] = [];
      let urlRows: UrlRow[] = [];
      let filesRead = 0;
      const totalFiles = files.length;

      const decodeCSV = (buf: ArrayBuffer): string => {
        let text = new TextDecoder('utf-8', { fatal: false }).decode(buf);
        if (text.includes('\uFFFD')) text = new TextDecoder('windows-1252').decode(buf);
        return text;
      };

      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          // Handle JSON manifest
          if (file.name.endsWith('.json')) {
            try {
              const text = new TextDecoder('utf-8').decode(ev.target?.result as ArrayBuffer);
              const parsed = JSON.parse(text);
              if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].r2Key) {
                documentManifest.length === 0 && setDocumentManifest(parsed);
              }
            } catch { /* ignore invalid JSON */ }
            filesRead++;
            if (filesRead === totalFiles) {
              if (rows.length === 0 && classRows.length === 0 && quizRows.length === 0 && questionRows.length === 0 && fileRows.length === 0 && urlRows.length === 0 && documentManifest.length === 0) {
                setError('No se pudieron leer los archivos. Comprueba que las columnas sean correctas.');
                return;
              }
              setPreview(rows); setClassPreview(classRows); setQuizPreview(quizRows);
              setQuestionPreview(questionRows); setFilePreview(fileRows); setUrlPreview(urlRows);
              setStep('preview');
            }
            return;
          }
          const text = decodeCSV(ev.target?.result as ArrayBuffer);
          const generic = parseCSVGeneric(text);
          if (generic.length > 0) {
            const headers = Object.keys(generic[0]).map(h => h.toLowerCase().trim().replace(/\s+/g, '').replace(/_/g, ''));
            // Auto-detect CSV type by column headers
            if (headers.some(h => h.includes('quizid')) && headers.some(h => h.includes('questionid') || h.includes('answerid'))) {
              questionRows = normalizeQuestionRows(generic);
            } else if (headers.some(h => h.includes('quizid')) && headers.some(h => h.includes('quizname') || h.includes('coursename'))) {
              quizRows = normalizeQuizRows(generic);
            } else if (headers.some(h => h.includes('filepath')) && headers.some(h => h.includes('filename'))) {
              fileRows = normalizeFileRows(generic);
            } else if (headers.some(h => h.includes('fechainicio') || h.includes('startdate') || h.includes('precio') || h.includes('price'))) {
              classRows = normalizeClassRows(generic);
            } else if (headers.some(h => h === 'email')) {
              rows = normalizeRows(generic);
            } else if (headers.some(h => h === 'url' || h === 'externalurl') && headers.some(h => h === 'linktitle' || h === 'coursename')) {
              urlRows = normalizeUrlRows(generic);
            } else {
              // Fallback: try all parsers, use the one that returns results
              const tryQuestions = normalizeQuestionRows(generic);
              const tryQuizzes = normalizeQuizRows(generic);
              const tryFiles = normalizeFileRows(generic);
              const tryUrls = normalizeUrlRows(generic);
              const tryClasses = normalizeClassRows(generic);
              const tryUsers = normalizeRows(generic);
              if (tryQuestions.length > 0) questionRows = tryQuestions;
              else if (tryQuizzes.length > 0) quizRows = tryQuizzes;
              else if (tryFiles.length > 0) fileRows = tryFiles;
              else if (tryUrls.length > 0) urlRows = tryUrls;
              else if (tryClasses.length > 0) classRows = tryClasses;
              else if (tryUsers.length > 0) rows = tryUsers;
            }
          }
          filesRead++;
          if (filesRead === totalFiles) {
            if (rows.length === 0 && classRows.length === 0 && quizRows.length === 0 && questionRows.length === 0 && fileRows.length === 0 && urlRows.length === 0 && documentManifest.length === 0) {
              setError('No se pudieron leer los archivos. Comprueba que las columnas sean correctas.');
              return;
            }
            setPreview(rows);
            setClassPreview(classRows);
            setQuizPreview(quizRows);
            setQuestionPreview(questionRows);
            setFilePreview(fileRows);
            setUrlPreview(urlRows);
            setStep('preview');
          }
        };
        reader.readAsArrayBuffer(file);
      });
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setError('');

    // Warmup: wake the Worker before the real request so it doesn't cold-start mid-import
    await fetch(`${API_BASE_URL}/`, { method: 'GET', credentials: 'omit' }).catch(() => {});

    try {
      const res = await apiClient('/admin/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ academyId, users: preview, classes: classPreview, quizzes: quizPreview, questions: questionPreview, files: filePreview, urls: urlPreview, documents: documentManifest, approveAll: true }),
        skipAutoRedirect: true,
      });
      const data = await res.json();
      if (data.success) {
        setSummary(data.data);
        setStep('results');
      } else if (res.status === 401) {
        setError('Tu sesión ha expirado. Recarga la página e inténtalo de nuevo.');
      } else {
        setError(data.error || 'Error en la importación');
      }
    } catch {
      setError('Error de red. Si era tu primer intento, puede que los datos ya se hayan guardado — comprueba la lista de usuarios antes de volver a importar.');
    } finally {
      setImporting(false);
    }
  };

  const _downloadResults = () => {
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
    setQuizPreview([]);
    setQuestionPreview([]);
    setFilePreview([]);
    setUrlPreview([]);
    setDocumentManifest([]);
    setSummary(null);
    setStep('upload');
    setError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  if (!mounted) return null;

  const maxWidth = step === 'preview' ? 'max-w-6xl' : 'max-w-5xl';

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[92dvh] overflow-hidden`} onClick={e => e.stopPropagation()}>
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
          {step === 'preview' && <PreviewStep preview={preview} classPreview={classPreview} quizPreview={quizPreview} questionPreview={questionPreview} filePreview={filePreview} urlPreview={urlPreview} documentManifest={documentManifest} importing={importing} reset={reset} handleImport={handleImport} />}
          {step === 'results' && summary && <ResultsStep summary={summary} onClose={onClose} />}
        </div>
      </div>
    </div>,
    document.body
  );
}
