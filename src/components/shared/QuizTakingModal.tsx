'use client';

import { useState, useEffect, useRef } from 'react';
import { apiClient, apiPost } from '@/lib/api-client';
import { decodeHtmlEntities } from '@/lib/utils';

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
  feedbackMode?: 'at_end' | 'after_each';
}

function getStorageUserId(): string {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) return 'anon';
    const payload = JSON.parse(atob(token.split('.')[1]));
    return String(payload.sub || payload.userId || 'anon');
  } catch { return 'anon'; }
}

export default function QuizTakingModal({ assignmentId, assignmentTitle, maxScore, alreadyAttempted, onClose, onCompleted, feedbackMode = 'at_end' }: Props) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [immediateResults, setImmediateResults] = useState<Record<string, { correct: boolean; correctOptionIds: string[]; explanation: string | null }>>({});
  const [confirming, setConfirming] = useState(false);
  const [officialResult, setOfficialResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState('');
  const [showRetryNotice, setShowRetryNotice] = useState(!!alreadyAttempted);
  const [showNoBackWarning, setShowNoBackWarning] = useState(false);
  const hasShownWarningRef = useRef(false);
  const [quizRating, setQuizRating] = useState(0);
  const [quizRatingSubmitted, setQuizRatingSubmitted] = useState(false);
  const restored = useRef(false);
  const [userId] = useState(() => getStorageUserId());
  const storageKey = `quiz-progress-${userId}-${assignmentId}`;

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

  async function handleConfirmAnswer() {
    if (!currentQuestion || currentAnswers.length === 0 || confirming) return;
    setConfirming(true);
    setError('');
    try {
      const res = await apiPost(`/assignments/${assignmentId}/quiz-check-question`, {
        questionId: currentQuestion.id,
        selectedOptionIds: currentAnswers,
      });
      const data = await res.json();
      if (data.success) {
        setImmediateResults(prev => ({
          ...prev,
          [currentQuestion.id]: {
            correct: data.data.correct,
            correctOptionIds: data.data.correctOptionIds,
            explanation: data.data.explanation,
          },
        }));
      } else {
        setError(data.error || 'Error al verificar respuesta');
      }
    } catch {
      setError('Error al verificar respuesta');
    } finally {
      setConfirming(false);
    }
  }

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
    const _officialScoreColor = officialPct <= 50 ? 'text-red-600' : officialPct <= 69 ? 'text-orange-500' : officialPct <= 90 ? 'text-green-500' : 'text-green-700';

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-3xl w-full max-h-[92dvh] overflow-y-auto p-4 sm:p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold mb-1">{isRetry ? 'Resultado del Intento' : 'Resultado del Cuestionario'}</h2>
            <p className="text-gray-600">{assignmentTitle}</p>
            <div className={`text-4xl font-bold mt-4 ${scoreColor}`}>{displayScore}/{result.maxScore}</div>
            <p className="text-sm text-gray-500 mt-1">{result.correctAnswers} de {result.totalQuestions} correctas</p>

          </div>

          {result.answers && result.questions && result.questions.length > 0 && (
            <div className="space-y-4 mb-6">
              {result.questions.map((q, i) => {
                const answer = result.answers.find(a => a.questionId === q.id);
                const selectedIds = answer?.selectedOptionIds ?? (answer?.selectedOptionId ? [answer.selectedOptionId] : []);
                return (
                  <div key={q.id} className={`p-4 rounded-lg border ${answer?.correct ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                    <p className="font-medium text-gray-900 mb-2">{i + 1}. {decodeHtmlEntities(q.questionText)}</p>
                    <div className="space-y-1">
                      {q.options.map(opt => {
                        const isSelected = selectedIds.includes(opt.id);
                        const isCorrect = answer?.correctOptionIds?.includes(opt.id) ?? false;
                        let optStyle = 'text-gray-600';
                        if (isCorrect) optStyle = 'text-green-700 font-medium';
                        if (isSelected && !isCorrect) optStyle = 'text-red-600 line-through';
                        return (
                          <div key={opt.id} className={`flex items-center gap-2 text-sm ${optStyle}`}>
                          {isCorrect && <span>✓</span>}
                            {isSelected && !isCorrect && <span>✗</span>}
                            {!isSelected && !isCorrect && <span className="w-3" />}
                            <span>{decodeHtmlEntities(opt.text)}</span>
                          </div>
                        );
                      })}
                    </div>
                    {answer && !answer.correct && answer.explanation && (
                      <p className="text-sm text-gray-600 mt-2"><span className="font-medium">Explicación:</span> {answer.explanation}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!isRetry && (
            <div className="border-t border-gray-100 pt-4 mb-4">
              <p className="text-sm text-gray-600 text-center mb-3">¿Cómo valorarías este cuestionario?</p>
              {quizRatingSubmitted ? (
                <p className="text-center text-sm text-green-600 font-medium">¡Gracias por tu valoración!</p>
              ) : (
                <div className="flex justify-center gap-2">
                  {[1,2,3,4,5].map(star => (
                    <button
                      key={star}
                      onClick={async () => {
                        setQuizRating(star);
                        try {
                          await apiPost(`/assignments/${assignmentId}/rate`, { rating: star });
                          setQuizRatingSubmitted(true);
                        } catch { /* silent */ }
                      }}
                      className={`text-2xl transition-transform hover:scale-110 ${star <= quizRating ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end">
            <button onClick={onClose} className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz taking view — one question at a time
  const isAfterEach = feedbackMode === 'after_each';
  const currentQuestion = questions[currentIndex];
  const currentAnswers = answers[currentQuestion?.id] || [];
  const currentResult = isAfterEach ? immediateResults[currentQuestion?.id] : undefined;
  const currentConfirmed = isAfterEach ? !!currentResult : true;
  const totalAnswered = questions.filter(q => (answers[q.id] || []).length > 0).length;
  const totalConfirmed = isAfterEach ? Object.keys(immediateResults).length : totalAnswered;
  const allAnswered = totalAnswered === questions.length;
  const allConfirmed = isAfterEach ? totalConfirmed === questions.length : allAnswered;
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

        {/* Retry notice popup */}
        {showRetryNotice && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-10">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 text-center">
              <p className="text-gray-800 font-medium mb-2">Ya has completado este cuestionario</p>
              <p className="text-sm text-gray-500 mb-5">Puedes repetirlo, pero tu nota oficial no cambiará.</p>
              <button
                onClick={() => setShowRetryNotice(false)}
                className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
              >
                Entendido
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        )}

        {/* Current question */}
        {currentQuestion && (
          <div className="p-5 bg-gray-50 rounded-xl mb-5">
            <p className="font-semibold text-gray-900 mb-4">{decodeHtmlEntities(currentQuestion.questionText)}</p>
            <div className="space-y-2">
              {currentQuestion.options.map(opt => {
                const isSelected = currentAnswers.includes(opt.id);
                const isConfirmedQ = isAfterEach && !!currentResult;
                const isCorrectOpt = isConfirmedQ ? currentResult!.correctOptionIds.includes(opt.id) : false;
                let optClass = '';
                if (isConfirmedQ) {
                  if (isCorrectOpt) optClass = 'border-green-500 bg-green-50';
                  else if (isSelected) optClass = 'border-red-400 bg-red-50';
                  else optClass = 'border-gray-200 bg-white opacity-50';
                } else {
                  optClass = isSelected ? 'border-gray-900 bg-gray-100' : 'border-gray-200 bg-white hover:bg-gray-50';
                }
                return (
                  <label
                    key={opt.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${isConfirmedQ ? 'cursor-default' : 'cursor-pointer'} ${optClass}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => { if (!isConfirmedQ) toggleAnswer(currentQuestion.id, opt.id); }}
                      disabled={isConfirmedQ}
                      className="w-4 h-4 rounded text-gray-900 focus:ring-gray-900 accent-black"
                    />
                    <span className={`text-sm flex items-center gap-1 ${
                      isConfirmedQ && isSelected && !isCorrectOpt ? 'line-through text-red-500' :
                      isConfirmedQ && isCorrectOpt ? 'text-green-700 font-medium' :
                      'text-gray-700'
                    }`}>
                      {isConfirmedQ && isCorrectOpt && <span>✓</span>}
                      {isConfirmedQ && isSelected && !isCorrectOpt && <span>✗</span>}
                      {decodeHtmlEntities(opt.text)}
                    </span>
                  </label>
                );
              })}
            </div>
            {isAfterEach && currentResult && (
              <div className={`mt-3 p-3 rounded-lg text-sm border ${currentResult.correct ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                {currentResult.correct ? '¡Respuesta correcta!' : 'Respuesta incorrecta'}
                {!currentResult.correct && currentResult.explanation && (
                  <p className="mt-1 text-gray-700"><span className="font-medium">Explicación:</span> {decodeHtmlEntities(currentResult.explanation)}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Question dots nav */}
        <div className="flex flex-wrap justify-center gap-1.5 mb-5">
          {questions.map((q, i) => {
            const qResult = isAfterEach ? immediateResults[q.id] : undefined;
            let dotClass = '';
            if (i === currentIndex) dotClass = 'bg-black text-white';
            else if (qResult) dotClass = qResult.correct ? 'bg-green-200 text-green-800 hover:bg-green-300' : 'bg-red-200 text-red-800 hover:bg-red-300';
            else if ((answers[q.id] || []).length > 0) dotClass = isAfterEach ? 'bg-amber-200 text-amber-800 hover:bg-amber-300' : 'bg-green-200 text-green-800 hover:bg-green-300';
            else dotClass = 'bg-gray-100 text-gray-500 hover:bg-gray-200';
            // Locked = already answered (and not the current question)
            const isAnswered = isAfterEach ? !!immediateResults[q.id] : (answers[q.id] || []).length > 0;
            const isLocked = isAnswered && i !== currentIndex;
            return (
              <button key={i} onClick={() => !isLocked && setCurrentIndex(i)}
                disabled={isLocked}
                className={`w-7 h-7 rounded-full text-xs font-medium transition-colors ${isLocked ? 'cursor-not-allowed opacity-60' : ''} ${dotClass}`}>
                {i + 1}
              </button>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3">
          <div className="flex-1" />
          {isAfterEach && !currentConfirmed ? (
            <button
              onClick={handleConfirmAnswer}
              disabled={currentAnswers.length === 0 || confirming}
              className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {confirming ? 'Verificando...' : 'Confirmar respuesta'}
            </button>
          ) : !isLast ? (
            <button
              onClick={() => {
                if (currentAnswers.length > 0 && !hasShownWarningRef.current) {
                  hasShownWarningRef.current = true;
                  setShowNoBackWarning(true);
                } else {
                  setCurrentIndex(i => Math.min(i + 1, questions.length - 1));
                }
              }}
              className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 transition-colors"
            >
              Siguiente →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !allConfirmed}
              className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Enviando...' : 'Enviar Cuestionario'}
            </button>
          )}
        </div>

        {isLast && !allConfirmed && (
          <p className="text-center text-xs text-amber-600 mt-3">
            {isAfterEach
              ? `Faltan ${questions.length - totalConfirmed} pregunta${questions.length - totalConfirmed !== 1 ? 's' : ''} por confirmar`
              : `Faltan ${questions.length - totalAnswered} pregunta${questions.length - totalAnswered !== 1 ? 's' : ''} por responder`
            }
          </p>
        )}
      </div>

      {/* No-back confirmation modal */}
      {showNoBackWarning && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">¿Continuar a la siguiente pregunta?</h3>
            <p className="text-sm text-gray-600 mb-5">
              Una vez avances <span className="font-semibold text-gray-900">no podrás volver</span> a modificar tu respuesta anterior.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowNoBackWarning(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Revisar respuesta
              </button>
              <button
                onClick={() => {
                  setShowNoBackWarning(false);
                  setCurrentIndex(i => Math.min(i + 1, questions.length - 1));
                }}
                className="flex-1 px-4 py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Continuar →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
