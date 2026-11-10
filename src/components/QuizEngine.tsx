import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, CircleHelp, RotateCcw, Trophy, XCircle } from 'lucide-react';
import type { QuizQuestion } from '../types/study';
import { formatStudyText } from '../lib/formatStudyText';

interface QuizEngineProps {
  questions: QuizQuestion[];
}

export default function QuizEngine({ questions }: QuizEngineProps) {
  const [queueIds, setQueueIds] = useState<string[]>(() => questions.map((question) => question.id));
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [round, setRound] = useState(1);
  const [hintVisible, setHintVisible] = useState(false);

  const questionIdsKey = questions.map((question) => question.id).join('|');
  const previousQuestionIdsRef = useRef(questions.map((question) => question.id));

  useEffect(() => {
    const nextIds = questions.map((question) => question.id);
    const previousIds = previousQuestionIdsRef.current;
    const hasIdentityOverlap = previousIds.some((id) => nextIds.includes(id));
    previousQuestionIdsRef.current = nextIds;

    if (!hasIdentityOverlap) {
      setQueueIds(nextIds);
      setQuestionIndex(0);
      setSelectedOption(null);
      setIsAnswered(false);
      setIsComplete(false);
      setCorrectCount(0);
      setWrongIds([]);
      setRound(1);
      setHintVisible(false);
      return;
    }

    setQueueIds((current) => {
      const nextSet = new Set(nextIds);
      const retained = current.filter((id) => nextSet.has(id));
      const retainedSet = new Set(retained);
      return [...retained, ...nextIds.filter((id) => !retainedSet.has(id))];
    });
    setWrongIds((current) => current.filter((id) => nextIds.includes(id)));
    setQuestionIndex((current) => Math.min(current, Math.max(0, nextIds.length - 1)));
  }, [questionIdsKey]);

  const questionMap = useMemo(() => new Map(questions.map((question) => [question.id, question])), [questions]);
  const queue = queueIds.map((id) => questionMap.get(id)).filter((question): question is QuizQuestion => Boolean(question));
  const currentQuestion = queue[questionIndex];

  useEffect(() => {
    setHintVisible(false);
  }, [currentQuestion?.id]);

  const wrongCount = wrongIds.length;

  const submitAnswer = () => {
    if (!currentQuestion || selectedOption === null || isAnswered) return;
    setIsAnswered(true);
    if (selectedOption === currentQuestion.correctAnswerIndex) {
      setCorrectCount((count) => count + 1);
    } else {
      setWrongIds((current) => current.includes(currentQuestion.id) ? current : [...current, currentQuestion.id]);
    }
  };

  const nextQuestion = () => {
    if (questionIndex + 1 < queue.length) {
      setQuestionIndex((current) => current + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setHintVisible(false);
    } else {
      setIsComplete(true);
    }
  };

  const restartFullQuiz = () => {
    setQueueIds(questions.map((question) => question.id));
    setQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsComplete(false);
    setCorrectCount(0);
    setWrongIds([]);
    setRound(1);
    setHintVisible(false);
  };

  const startRetest = () => {
    const failed = questions.filter((question) => wrongIds.includes(question.id));
    if (failed.length === 0) return;
    setQueueIds(failed.map((question) => question.id));
    setQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsComplete(false);
    setCorrectCount(0);
    setWrongIds([]);
    setRound((current) => current + 1);
    setHintVisible(false);
  };

  if (questions.length === 0) {
    return (
      <section className="surface rounded-3xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Adaptive quiz</h2>
        <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">No quiz questions were returned for this pack.</p>
      </section>
    );
  }

  return (
    <section className="surface rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300"><CircleHelp size={18} /></span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Adaptive quiz</h2>
          </div>
          <p className="mt-1 pl-11 text-xs text-slate-500 dark:text-slate-400">Answer, review the explanation, then retest missed questions.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">Round {round}</span>
      </div>

      {isComplete ? (
        <div className="mt-5 rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-5 text-center dark:border-sky-400/20 dark:from-sky-500/10 dark:to-slate-900 sm:p-7">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-amber-500 shadow-sm dark:bg-slate-800"><Trophy size={27} /></span>
          <p className="mt-4 text-xs font-bold uppercase tracking-widest text-sky-700 dark:text-sky-300">Round {round} complete</p>
          <h3 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{correctCount}/{queue.length}</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{queue.length > 0 ? Math.round((correctCount / queue.length) * 100) : 0}% correct this round</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs">
            <span className="rounded-full bg-emerald-100 px-3 py-1.5 font-semibold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">{correctCount} correct</span>
            <span className="rounded-full bg-rose-100 px-3 py-1.5 font-semibold text-rose-800 dark:bg-rose-500/15 dark:text-rose-200">{wrongCount} to revisit</span>
          </div>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            {wrongCount > 0 && (
              <button type="button" onClick={startRetest} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700">
                <RotateCcw size={16} /> Re-test wrong answers only ({wrongCount})
              </button>
            )}
            <button type="button" onClick={restartFullQuiz} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
              <RotateCcw size={16} /> Restart full quiz
            </button>
          </div>
          {wrongCount === 0 && <p className="mt-3 text-xs font-medium text-emerald-700 dark:text-emerald-300">Excellent—nothing to retest in this round.</p>}
        </div>
      ) : currentQuestion ? (
        <>
          <div className="mt-5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Question {questionIndex + 1} of {queue.length}</span>
            <span>{correctCount} correct so far</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-full rounded-full bg-sky-500 transition-all" style={{ width: `${((questionIndex + (isAnswered ? 1 : 0)) / queue.length) * 100}%` }} />
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60 sm:p-5">
            <p className="text-base font-semibold leading-7 text-slate-900 dark:text-white sm:text-lg">{formatStudyText(currentQuestion.question)}</p>
            <p id={`quiz-hint-${currentQuestion.id}`} hidden={!hintVisible} role="status" className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900 dark:bg-amber-500/10 dark:text-amber-100">Hint: {formatStudyText(currentQuestion.hint)}</p>
            <div className="mt-4 space-y-2">
              {currentQuestion.options.map((option, optionIndex) => {
                const isCorrect = optionIndex === currentQuestion.correctAnswerIndex;
                const isSelected = optionIndex === selectedOption;
                const stateClass = isAnswered && isCorrect
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-100'
                  : isAnswered && isSelected && !isCorrect
                    ? 'border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-100'
                    : isSelected
                      ? 'border-indigo-400 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-100 dark:border-indigo-400 dark:bg-indigo-500/10 dark:text-indigo-100 dark:ring-indigo-400/10'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-400/40';
                return (
                  <button
                    key={`${currentQuestion.id}-${optionIndex}`}
                    type="button"
                    disabled={isAnswered}
                    onClick={() => setSelectedOption(optionIndex)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left text-sm transition disabled:cursor-default ${stateClass}`}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-current/15 text-xs font-bold opacity-80">{String.fromCharCode(65 + optionIndex)}</span>
                    <span className="min-w-0 flex-1 leading-5">{formatStudyText(option)}</span>
                    {isAnswered && isCorrect && <CheckCircle2 className="shrink-0" size={17} />}
                    {isAnswered && isSelected && !isCorrect && <XCircle className="shrink-0" size={17} />}
                  </button>
                );
              })}
            </div>
          </div>

          {isAnswered && (
            <div className={`mt-3 rounded-xl border p-3.5 ${selectedOption === currentQuestion.correctAnswerIndex ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-400/20 dark:bg-emerald-500/10' : 'border-rose-200 bg-rose-50 dark:border-rose-400/20 dark:bg-rose-500/10'}`}>
              <p className={`text-sm font-bold ${selectedOption === currentQuestion.correctAnswerIndex ? 'text-emerald-900 dark:text-emerald-100' : 'text-rose-900 dark:text-rose-100'}`}>
                {selectedOption === currentQuestion.correctAnswerIndex ? 'Correct answer' : `Not quite. Correct answer: ${formatStudyText(currentQuestion.options[currentQuestion.correctAnswerIndex])}`}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-200">{formatStudyText(currentQuestion.explanation)}</p>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <button type="button" onClick={() => setHintVisible((visible) => !visible)} disabled={isAnswered} aria-expanded={hintVisible} aria-controls={`quiz-hint-${currentQuestion.id}`} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800">
              <CircleHelp size={15} /> {hintVisible ? 'Hide hint' : 'Show hint'}
            </button>
            {!isAnswered ? (
              <button type="button" onClick={submitAnswer} disabled={selectedOption === null} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-400">
                Check answer <ArrowRight size={16} />
              </button>
            ) : (
              <button type="button" onClick={nextQuestion} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
                {questionIndex + 1 === queue.length ? 'View round score' : 'Next question'} <ArrowRight size={16} />
              </button>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}
