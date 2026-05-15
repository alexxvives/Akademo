'use client';

import React, { useRef } from 'react';
import { nanoid } from 'nanoid';

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestionForm {
  questionText: string;
  options: QuizOption[];
  correctOptionIds: string[];
  explanation: string;
}

interface QuizQuestionBuilderProps {
  questions: QuizQuestionForm[];
  setQuestions: (q: QuizQuestionForm[]) => void;
}

function createEmptyQuestion(): QuizQuestionForm {
  const opt1 = nanoid(6);
  const opt2 = nanoid(6);
  return {
    questionText: '',
    options: [{ id: opt1, text: '' }, { id: opt2, text: '' }],
    correctOptionIds: [],
    explanation: '',
  };
}

export function QuizQuestionBuilder({ questions, setQuestions }: QuizQuestionBuilderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addQuestion = () => setQuestions([...questions, createEmptyQuestion()]);

  /**
   * Parser de TXT para crear preguntas en bloque.
   *
   * Formato esperado (separa preguntas con una línea en blanco):
   *   Q: ¿Texto de la pregunta?
   *   A) Opción incorrecta
   *   B) Opción correcta *
   *   C) Otra opción
   *   D) Otra opción
   *   E: Explicación opcional
   *
   * - Se admite "Q:", "P:" o número ("1.") como inicio de pregunta.
   * - Se admite "A)", "A.", "A:", "-" o "*" como inicio de opción.
   * - Una opción marcada con "*" al final (o prefijo "[x]") se considera correcta.
   * - Se permiten varias correctas.
   */
  const parseQuizTxt = (text: string): QuizQuestionForm[] => {
    const blocks = text.replace(/\r\n/g, '\n').split(/\n\s*\n+/);
    const result: QuizQuestionForm[] = [];
    for (const block of blocks) {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length === 0) continue;
      let questionText = '';
      let explanation = '';
      const opts: { text: string; correct: boolean }[] = [];
      for (const line of lines) {
        const qMatch = line.match(/^(?:Q|P|Pregunta)\s*[:\.\)]\s*(.*)$/i) || line.match(/^\d+\s*[\.\)]\s*(.*)$/);
        const eMatch = line.match(/^(?:E|Explicaci[oó]n|Explanation)\s*[:\.\)]\s*(.*)$/i);
        const oMatch = line.match(/^(?:\[(x| )\]\s*)?(?:[A-Fa-f]\s*[:\.\)]|[-*])\s*(.*)$/);
        if (qMatch && !questionText) {
          questionText = qMatch[1].trim();
        } else if (eMatch) {
          explanation = eMatch[1].trim();
        } else if (oMatch) {
          let txt = oMatch[2].trim();
          let correct = false;
          if (oMatch[1] && oMatch[1].toLowerCase() === 'x') correct = true;
          if (txt.endsWith('*')) { correct = true; txt = txt.slice(0, -1).trim(); }
          opts.push({ text: txt, correct });
        } else if (!questionText) {
          questionText = line;
        }
      }
      if (!questionText || opts.length < 2) continue;
      const optionObjs = opts.map(o => ({ id: nanoid(6), text: o.text }));
      const correctIds = opts.map((o, i) => o.correct ? optionObjs[i].id : '').filter(Boolean);
      result.push({ questionText, options: optionObjs, correctOptionIds: correctIds, explanation });
    }
    return result;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseQuizTxt(text);
      if (parsed.length === 0) {
        alert('No se pudo leer ninguna pregunta del archivo. Revisa el formato.');
        return;
      }
      const hasContent = questions.some(q => q.questionText.trim() !== '' || q.options.some(o => o.text.trim() !== ''));
      const append = hasContent ? confirm(`Se han leído ${parsed.length} preguntas. ¿Añadirlas a las existentes? (Cancelar = reemplazar todo)`) : false;
      setQuestions(append ? [...questions, ...parsed] : parsed);
    } catch {
      alert('Error leyendo el archivo.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx: number, field: 'questionText' | 'explanation', value: string) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], [field]: value };
    setQuestions(updated);
  };

  const toggleCorrectOption = (qIdx: number, optId: string) => {
    const updated = [...questions];
    const current = updated[qIdx].correctOptionIds;
    const newCorrect = current.includes(optId)
      ? current.filter((id) => id !== optId)
      : [...current, optId];
    updated[qIdx] = { ...updated[qIdx], correctOptionIds: newCorrect };
    setQuestions(updated);
  };

  const updateOption = (qIdx: number, oIdx: number, text: string) => {
    const updated = [...questions];
    const opts = [...updated[qIdx].options];
    opts[oIdx] = { ...opts[oIdx], text };
    updated[qIdx] = { ...updated[qIdx], options: opts };
    setQuestions(updated);
  };

  const addOption = (qIdx: number) => {
    if (questions[qIdx].options.length >= 6) return;
    const updated = [...questions];
    updated[qIdx] = { ...updated[qIdx], options: [...updated[qIdx].options, { id: nanoid(6), text: '' }] };
    setQuestions(updated);
  };

  const removeOption = (qIdx: number, oIdx: number) => {
    if (questions[qIdx].options.length <= 2) return;
    const updated = [...questions];
    const removedOpt = updated[qIdx].options[oIdx];
    const opts = updated[qIdx].options.filter((_, i) => i !== oIdx);
    updated[qIdx] = {
      ...updated[qIdx],
      options: opts,
      correctOptionIds: updated[qIdx].correctOptionIds.filter((id) => id !== removedOpt.id),
    };
    setQuestions(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
        <div className="text-xs text-blue-900">
          <p className="font-semibold mb-1">¿Muchas preguntas? Importa desde un archivo .txt</p>
          <p className="text-blue-700">
            Formato: <code className="bg-white px-1 rounded">Q: pregunta</code>, opciones con <code className="bg-white px-1 rounded">A) ...</code> y marca las correctas con <code className="bg-white px-1 rounded">*</code> al final. Separa preguntas con una línea en blanco.
          </p>
        </div>
        <input ref={fileInputRef} type="file" accept=".txt" className="hidden" onChange={handleFileUpload} />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="ml-3 shrink-0 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Subir .txt
        </button>
      </div>
      {questions.map((q, qIdx) => (
        <div key={qIdx} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Pregunta {qIdx + 1}</span>
            {questions.length > 1 && (
              <button type="button" onClick={() => removeQuestion(qIdx)} className="text-red-500 hover:text-red-700 text-sm">
                Eliminar
              </button>
            )}
          </div>

          <input
            type="text" value={q.questionText} placeholder="Escribe la pregunta..."
            onChange={(e) => updateQuestion(qIdx, 'questionText', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 text-sm"
            required
          />

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600">Opciones (marca las correctas)</label>
            {q.options.map((opt, oIdx) => (
              <div key={opt.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={q.correctOptionIds.includes(opt.id)}
                  onChange={() => toggleCorrectOption(qIdx, opt.id)}
                  className="w-4 h-4 rounded text-green-600 focus:ring-green-500"
                />
                <input
                  type="text" value={opt.text} placeholder={`Opción ${oIdx + 1}`}
                  onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                  className={`flex-1 px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 ${
                    q.correctOptionIds.includes(opt.id) ? 'border-green-400 bg-green-50' : 'border-gray-300'
                  }`}
                  required
                />
                {q.options.length > 2 && (
                  <button type="button" onClick={() => removeOption(qIdx, oIdx)}
                    className="text-gray-400 hover:text-red-500 text-sm p-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            {q.options.length < 6 && (
              <button type="button" onClick={() => addOption(qIdx)}
                className="text-sm text-brand-600 hover:text-brand-700 font-medium">
                + Añadir opción
              </button>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">Explicación (opcional)</label>
            <input
              type="text" value={q.explanation} placeholder="Se muestra al estudiante después de responder"
              onChange={(e) => updateQuestion(qIdx, 'explanation', e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 mt-1"
            />
          </div>
        </div>
      ))}

      <button type="button" onClick={addQuestion}
        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-brand-400 hover:text-brand-600 transition-colors">
        + Añadir pregunta
      </button>
    </div>
  );
}

export { createEmptyQuestion };
