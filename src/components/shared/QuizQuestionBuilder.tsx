'use client';

import React from 'react';
import { nanoid } from 'nanoid';

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestionForm {
  questionText: string;
  options: QuizOption[];
  correctOptionId: string;
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
    correctOptionId: '',
    explanation: '',
  };
}

export function QuizQuestionBuilder({ questions, setQuestions }: QuizQuestionBuilderProps) {
  const addQuestion = () => setQuestions([...questions, createEmptyQuestion()]);

  const removeQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx: number, field: keyof QuizQuestionForm, value: string) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], [field]: value };
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
      correctOptionId: updated[qIdx].correctOptionId === removedOpt.id ? '' : updated[qIdx].correctOptionId,
    };
    setQuestions(updated);
  };

  return (
    <div className="space-y-6">
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
            <label className="text-xs font-medium text-gray-600">Opciones (selecciona la correcta)</label>
            {q.options.map((opt, oIdx) => (
              <div key={opt.id} className="flex items-center gap-2">
                <input
                  type="radio" name={`correct-${qIdx}`}
                  checked={q.correctOptionId === opt.id}
                  onChange={() => updateQuestion(qIdx, 'correctOptionId', opt.id)}
                  className="w-4 h-4 text-green-600 focus:ring-green-500"
                  required
                />
                <input
                  type="text" value={opt.text} placeholder={`Opción ${oIdx + 1}`}
                  onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                  className={`flex-1 px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 ${
                    q.correctOptionId === opt.id ? 'border-green-400 bg-green-50' : 'border-gray-300'
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
