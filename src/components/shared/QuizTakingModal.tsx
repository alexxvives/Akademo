'use client';

import { useState, useEffect, useRef } from 'react';
import { apiClient, apiPost } from '@/lib/api-client';

interface QuizQuestion {
  id: string;
  questionText: string;
  questionOrder: number;
  options: { id: string; text: string }[];
}

interface GradedAnswer {
  questionId: string;
  selectedOptionId: string | null;
  selectedOptionIds?: string[];
  correct: boolean;
  correctOptionIds: string[];
  explanation?: string;
}

interface QuizResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  maxScore: number;
  isRetry?: boolean;
  officialScore?: number;
  officialTotalQuestions?: number;
  officialCorrectAnswers?: number;
  answers: GradedAnswer[];
  questions?: QuizQuestion[];
}

interface Props {
  assignmentId: string;
  assignmentTitle: string;
  maxScore: number;
  alreadyAttempted?: boolean;
  onClose: () => void;
  onCompleted: () => void;
}

export default function QuizTakingModal({ assignmentId, assignmentTitle, maxScore, alreadyAttempted, onClose, onCompleted }: Props) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [officialResult, setOfficialResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState('');
  const restored = useRef(false);
  const storageKey = `quiz-progress-${assignmentId}`;

  useEffect(() => {
    const init = async () => {
      await loadQuestions();
      if (alreadyAttempted) await loadOfficialResult();
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore progress once questions are loaded
  useEffect(() => {
    if (questions.length > 0 && !restored.current) {
      restored.current = true;
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const { savedAnswers, savedIndex } = JSON.parse(saved);
          if (savedAnswers && Object.keys(savedAnswers).length > 0) setAnswers(savedAnswers);
          if (typeof savedIndex === 'number') setCurrentIndex(Math.min(savedIndex, questions.length - 1));
        }
      } catch { /* ignore */ }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions]);

  // Save progress whenever answers or index change
  useEffect(() => {
    if (restored.current) {
      localStorage.setItem(storageKey, JSON.stringify({ savedAnswers: answers, savedIndex: currentIndex }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, currentIndex]);

  async function loadQuestions() {
    try {
      const res = await apiClient(`/assignments/${assignmentId}/questions`);
      const data = await res.json();
      if (data.success) {
        setQuestions(data.data);
      } else {
        setError(data.error || 'Error al cargar preguntas');
      }
    } catch {
      setError('Error al cargar preguntas');
    } finally {
      setLoading(false);
    }
  }

  async function loadOfficialResult() {
    try {
      const res = await apiClient(`/assignments/${assignmentId}/quiz-result`);
      const data = await res.json();
      if (data.success) {
        const qRes = await apiClient(`/assignments/${assignmentId}/questions`);
        const qData = await qRes.json();
        setOfficialResult({ ...data.data, maxScore, questions: qData.success ? qData.data : [] });
      }
    } catch { /* non-fatal */ }
  }

  const toggleAnswer = (questionId: string, optionId: string) => {
    setAnswers(prev => {
      const current = prev[questionId] || [];
      const updated = current.includes(optionId)
        ? current.filter(id => id !== optionId)
        : [...current, optionId];
      return { ...prev, [questionId]: updated };
    });
  };

  async function handleSubmit() {
    const unanswered = questions.filter(q => !(answers[q.id] || []).length);
    if (unanswered.length > 0) {
      setError(`Faltan ${unanswered.length} pregunta${unanswered.length > 1 ? 's' : ''} por responder`);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const answerArray = questions.map(q => ({
        questionId: q.id,
        selectedOptionIds: answers[q.id] || [],
      }));

      const res = await apiPost(`/assignments/${assignmentId}/quiz-submit`, { answers: answerArray });
      const data = await res.json();
      if (data.success) {
        localStorage.removeItem(storageKey);
        setResult({ ...data.data, maxScore, questions });
        if (!data.data.isRetry) onCompleted();
      } else {
        setError(data.error || 'Error al enviar cuestionario');
      }
    } catch {
      setError('Error al enviar cuestionario');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full p-6 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Cargando cuestionario...</p>
        </div>
      </div>
    );
  }

  // Results view
  if (result) {
    const isRetry = !!result.isRetry;
    const displayScore = result.score;
    const officialScore = result.officialScore ?? (isRetry ? (officialResult?.score ?? 0) : displayScore);
    const pct = result.maxScore > 0 ? (displayScore / result.maxScore) * 100 : 0;
    const officialPct = result.maxScore > 0 ? (officialScore / result.maxScore) * 100 : 0;
    const scoreColor = pct <= 50 ? 'text-red-600' : pct <= 69 ? 'text-orange-500' : pct <= 90 ? 'text-green-500' : 'text-green-700';
    const officialScoreColor = officialPct <= 50 ? 'text-red-600' : officialPct <= 69 ? 'text-orange-500' : officialPct <= 90 ? 'text-green-500' : 'text-green-700';

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold mb-1">{isRetry ? 'Resultado del Intento' : 'Resultado del Cuestionario'}</h2>
            <p className="text-gray-600">{assignmentTitle}</p>
            <div className={`text-4xl font-bold mt-4 ${scoreColor}`}>{displayScore}/{result.maxScore}</div>
            <p className="text-sm text-gray-500 mt-1">{result.correctAnswers} de {result.totalQuestions} correctas</p>
            {isRetry && (
              <div className="mt-3 inline-block px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">Nota oficial (primer intento): <span className={`font-bold ${officialScoreColor}`}>{officialScore}/{result.maxScore}</span></p>
              </div>
            )}
          </div>

          {result.answers && result.questions && result.questions.length > 0 && (
            <div className="space-y-4 mb-6">
              {result.questions.map((q, i) => {
                const answer = result.answers.find(a => a.questionId === q.id);
                const selectedIds = answer?.selectedOptionIds ?? (answer?.selectedOptionId ? [answer.selectedOptionId] : []);
                return (
                  <div key={q.id} className={`p-4 rounded-lg border ${answer?.correct ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                    <p className="font-medium text-gray-900 mb-2">{i + 1}. {q.questionText}</p>
                    <div className="space-y-1">
                      {q.options.map(opt => {
                        const isSelected = selectedIds.includes(opt.id);
                        const isCorrect = answer?.correctOptionIds?.includes(opt.id) ?? false;
                        let optStyle = 'text-gray-600';
                        if (isCorrect) optStyle = 'text-green-700 font-medium';
                        if (isSelected && !isCorrect) optStyle = 'text-red-600 line-through';
                        return (
                          <div key={opt.id} className={`flex items-center gap-2 text-sm ${optStyle}`}>
                            {isCorrect && <span>âœ“</span>}
                            {isSelected && !isCorrect && <span>âœ—</span>}
                            {!isSelected && !isCorrect && <span className="w-3" />}
                            <span>{opt.text}</span>
                          </div>
                        );
                      })}
                    </div>
                    {answer && !answer.correct && answer.explanation && (
                      <p className="text-sm text-gray-600 mt-2 italic">ðŸ’¡ {answer.explanation}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-3 justify-between">
            <button
              onClick={() => { setResult(null); setAnswers({}); setCurrentIndex(0); }}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Repetir
            </button>
            <button onClick={onClose} className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz taking view â€” one question at a time
  const currentQuestion = questions[currentIndex];
  const currentAnswers = answers[currentQuestion?.id] || [];
  const totalAnswered = questions.filter(q => (answers[q.id] || []).length > 0).length;
  const allAnswered = totalAnswered === questions.length;
  const isLast = currentIndex === questions.length - 1;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-semibold">{assignmentTitle}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress text */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-500">Pregunta {currentIndex + 1} de {questions.length}</span>
          <span className="text-sm text-gray-500">{totalAnswered}/{questions.length} respondidas</span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100 rounded-full mb-5">
          <div
            className="h-full bg-black rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Already attempted notice */}
        {(alreadyAttempted || officialResult) && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            Ya has completado este cuestionario.{officialResult ? <> Nota oficial: <span className="font-bold">{officialResult.score}/{maxScore}</span>.</> : null} Puedes repetirlo, pero tu nota oficial no cambiarÃ¡.
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        )}

        {/* Current question */}
        {currentQuestion && (
          <div className="p-5 bg-gray-50 rounded-xl mb-5">
            <p className="font-semibold text-gray-900 mb-4">{currentQuestion.questionText}</p>
            <div className="space-y-2">
              {currentQuestion.options.map(opt => (
                <label
                  key={opt.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    currentAnswers.includes(opt.id)
                      ? 'border-gray-900 bg-gray-100'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={currentAnswers.includes(opt.id)}
                    onChange={() => toggleAnswer(currentQuestion.id, opt.id)}
                    className="w-4 h-4 rounded text-gray-900 focus:ring-gray-900 accent-black"
                  />
                  <span className="text-sm text-gray-700">{opt.text}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Question dots nav */}
        <div className="flex flex-wrap justify-center gap-1.5 mb-5">
          {questions.map((q, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-7 h-7 rounded-full text-xs font-medium transition-colors ${
                i === currentIndex
                  ? 'bg-black text-white'
                  : (answers[q.id] || []).length > 0
                  ? 'bg-green-200 text-green-800 hover:bg-green-300'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentIndex(i => Math.max(i - 1, 0))}
            disabled={currentIndex === 0}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            â† Anterior
          </button>
          <div className="flex-1" />
          {!isLast ? (
            <button
              onClick={() => setCurrentIndex(i => Math.min(i + 1, questions.length - 1))}
              className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 transition-colors"
            >
              Siguiente â†’
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !allAnswered}
              className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Enviando...' : 'Enviar Cuestionario'}
            </button>
          )}
        </div>

        {isLast && !allAnswered && (
          <p className="text-center text-xs text-amber-600 mt-3">
            Faltan {questions.length - totalAnswered} pregunta{questions.length - totalAnswered !== 1 ? 's' : ''} por responder
          </p>
        )}
      </div>
    </div>
  );
}
