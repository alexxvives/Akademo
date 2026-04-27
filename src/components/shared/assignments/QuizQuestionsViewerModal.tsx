'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { decodeHtmlEntities } from '@/lib/utils';

interface QuizOption {
  id: string;
  text: string;
}

interface QuizQuestion {
  id: string;
  questionText: string;
  questionOrder: number;
  options: QuizOption[];
  correctOptionIds?: string[];
  explanation?: string;
}

interface Props {
  assignmentId: string;
  title: string;
  onClose: () => void;
}

export function QuizQuestionsViewerModal({ assignmentId, title, onClose }: Props) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient(`/assignments/${assignmentId}/questions`);
        const result = await res.json();
        if (result.success) setQuestions(result.data);
        else setError(result.error || 'Error al cargar preguntas');
      } catch {
        setError('Error de red');
      } finally {
        setLoading(false);
      }
    })();
  }, [assignmentId]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-xl max-w-[700px] w-full flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate pr-4">{title}</h3>
          <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-4 flex-1">
          {loading && <div className="py-8 text-center text-gray-400 text-sm">Cargando preguntas...</div>}
          {error && <div className="py-8 text-center text-red-500 text-sm">{error}</div>}
          {!loading && !error && questions.length === 0 && (
            <div className="py-8 text-center text-gray-400 text-sm">No hay preguntas</div>
          )}
          <div className="space-y-5">
            {questions.map((q, idx) => (
              <div key={q.id} className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 mb-3">
                  {idx + 1}. {decodeHtmlEntities(q.questionText)}
                </p>
                <div className="space-y-2">
                  {q.options.map((opt) => {
                    const isCorrect = q.correctOptionIds?.includes(opt.id);
                    return (
                      <div
                        key={opt.id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                          isCorrect
                            ? 'bg-green-50 border border-green-300 text-green-800'
                            : 'bg-gray-50 border border-gray-200 text-gray-600'
                        }`}
                      >
                        {isCorrect && (
                          <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        <span>{decodeHtmlEntities(opt.text)}</span>
                      </div>
                    );
                  })}
                </div>
                {q.explanation && (
                  <p className="mt-2 text-xs text-gray-500 italic">
                    Explicación: {decodeHtmlEntities(q.explanation)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
