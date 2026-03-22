'use client';

import { useState, useEffect } from 'react';
import { apiClient, apiPost } from '@/lib/api-client';

interface QuizQuestion {
  id: string;
  questionText: string;
  questionOrder: number;
  options: { id: string; text: string }[];
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
  answers: { questionId: string; selectedOptionId: string; correct: boolean; correctOptionIds: string[]; explanation?: string }[];
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
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [officialResult, setOfficialResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState('');

  // Always load questions; also load official result if already attempted
  useEffect(() => {
    const init = async () => {
      await loadQuestions();
      if (alreadyAttempted) await loadOfficialResult();
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    } catch {
      // non-fatal
    }
  }
  async function handleSubmit() {
    const unanswered = questions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
      setError(`Faltan ${unanswered.length} pregunta${unanswered.length > 1 ? 's' : ''} por responder`);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const answerArray = questions.map(q => ({
        questionId: q.id,
        selectedOptionId: answers[q.id],
      }));

      const res = await apiPost(`/assignments/${assignmentId}/quiz-submit`, { answers: answerArray });
      const data = await res.json();
      if (data.success) {
        setResult({ ...data.data, maxScore, questions });
        if (!data.data.isRetry) onCompleted(); // only refresh on first attempt
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
        <div className="bg-white rounded-xl max-w-3xl w-full p-6 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Cargando cuestionario...</p>
        </div>
      </div>
    );
  }

  // Show results view
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
            <div className={`text-4xl font-bold mt-4 ${scoreColor}`}>
              {displayScore}/{result.maxScore}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {result.correctAnswers} de {result.totalQuestions} correctas
            </p>
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
                return (
                  <div key={q.id} className={`p-4 rounded-lg border ${answer?.correct ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                    <p className="font-medium text-gray-900 mb-2">{i + 1}. {q.questionText}</p>
                    <div className="space-y-1">
                      {q.options.map(opt => {
                        const isSelected = answer?.selectedOptionId === opt.id;
                        const isCorrect = answer?.correctOptionIds?.includes(opt.id) ?? false;
                        let optStyle = 'text-gray-600';
                        if (isCorrect) optStyle = 'text-green-700 font-medium';
                        if (isSelected && !isCorrect) optStyle = 'text-red-600 line-through';
                        return (
                          <div key={opt.id} className={`flex items-center gap-2 text-sm ${optStyle}`}>
                            {isCorrect && <span>✓</span>}
                            {isSelected && !isCorrect && <span>✗</span>}
                            {!isSelected && !isCorrect && <span className="w-3" />}
                            <span>{opt.text}</span>
                          </div>
                        );
                      })}
                    </div>
                    {answer && !answer.correct && answer.explanation && (
                      <p className="text-sm text-gray-600 mt-2 italic">💡 {answer.explanation}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-3 justify-between">
            <button
              onClick={() => { setResult(null); setAnswers({}); }}
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

  // Quiz taking view
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-2xl font-semibold">{assignmentTitle}</h2>
          <span className="text-sm text-gray-500 mt-1 ml-4 shrink-0">{Object.keys(answers).length}/{questions.length} respondidas</span>
        </div>
        <p className="text-sm text-gray-500 mb-4">{questions.length} preguntas · {maxScore} puntos</p>

        {(alreadyAttempted || officialResult) && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            Ya has completado este cuestionario.{officialResult ? <> Nota oficial: <span className="font-bold">{officialResult.score}/{maxScore}</span>.</> : null} Puedes repetirlo las veces que quieras, pero tu nota oficial no cambiará.
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        )}

        <div className="space-y-6 mb-6">
          {questions.map((q, i) => (
            <div key={q.id} className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900 mb-3">{i + 1}. {q.questionText}</p>
              <div className="space-y-2">
                {q.options.map(opt => (
                  <label
                    key={opt.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      answers[q.id] === opt.id
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-gray-200 hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${q.id}`}
                      value={opt.id}
                      checked={answers[q.id] === opt.id}
                      onChange={() => setAnswers(prev => ({ ...prev, [q.id]: opt.id }))}
                      className="text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-sm text-gray-700">{opt.text}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 justify-center pt-4 border-t">
          <button onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || Object.keys(answers).length === 0}
            className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Enviando...' : 'Enviar Cuestionario'}
          </button>
        </div>
      </div>
    </div>
  );
}
