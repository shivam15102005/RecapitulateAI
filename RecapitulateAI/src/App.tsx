import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpenCheck,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Moon,
  NotebookPen,
  PanelTop,
  Sun,
} from 'lucide-react';
import ConceptChecklist from './components/ConceptChecklist';
import FaultSimulatorBar, { type FaultMode } from './components/FaultSimulatorBar';
import FlashcardDeck from './components/FlashcardDeck';
import QuizEngine from './components/QuizEngine';
import RefinementBar from './components/RefinementBar';
import SavedSessionPicker from './components/SavedSessionPicker';
import StatusBanners from './components/StatusBanners';
import StudyInputStudio from './components/StudyInputStudio';
import { useLocalStorageDecks } from './hooks/useLocalStorageDecks';
import { useStudyGenerator } from './hooks/useStudyGenerator';
import type { SamplePreset } from './lib/samplePresets';
import { formatStudyText } from './lib/formatStudyText';
import type { Difficulty, SavedStudySession } from './types/study';

function createSessionId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  } catch {
    // Fall through to a timestamp-based identifier for older browsers.
  }
  return `study-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getInitialTheme(): 'light' | 'dark' {
  try {
    const saved = window.localStorage.getItem('recapitulate-ai:theme');
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // Theme preference is optional; use the light theme if storage is unavailable.
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function App() {
  const generator = useStudyGenerator();
  const { sessions, saveSession, restoreSession } = useLocalStorageDecks();
  const { state } = generator;

  const [notes, setNotes] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Intermediate');
  const [flashcardCount, setFlashcardCount] = useState(12);
  const [quizCount, setQuizCount] = useState(8);
  const [flashcardMastery, setFlashcardMastery] = useState<Record<string, 'known' | 'review'>>({});
  const [conceptMastery, setConceptMastery] = useState<Record<string, boolean>>({});
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);
  const [activeSessionId, setActiveSessionId] = useState(() => {
    try {
      const stored = window.localStorage.getItem('recapitulate-ai:last-session-id');
      return stored || 'active-study-session';
    } catch {
      return 'active-study-session';
    }
  });
  const previousParamsRef = useRef({ notes, difficulty, flashcardCount, quizCount });
  const dataSessionIdRef = useRef(activeSessionId);

  const isLoading = state.status === 'loading';
  const data = state.data;

  useEffect(() => {
    if (data || sessions.length === 0) return;
    const saved = sessions.find((session) => session.id === activeSessionId) || sessions[0];
    if (!saved) return;
    setActiveSessionId(saved.id);
    dataSessionIdRef.current = saved.id;
    setFlashcardMastery(saved.flashcardMastery || {});
    setConceptMastery(saved.conceptMastery || {});
    generator.restore(saved.data);
  }, [activeSessionId, data, generator.restore, sessions]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      window.localStorage.setItem('recapitulate-ai:theme', theme);
    } catch (error) {
      console.warn('Could not persist theme preference:', error);
    }
  }, [theme]);

  useEffect(() => {
    try {
      window.localStorage.setItem('recapitulate-ai:last-session-id', activeSessionId);
    } catch (error) {
      console.warn('Could not persist active session id:', error);
    }
  }, [activeSessionId]);

  useEffect(() => {
    const previous = previousParamsRef.current;
    const changed = previous.notes !== notes
      || previous.difficulty !== difficulty
      || previous.flashcardCount !== flashcardCount
      || previous.quizCount !== quizCount;
    previousParamsRef.current = { notes, difficulty, flashcardCount, quizCount };
    if (changed && isLoading) generator.cancel();
  }, [difficulty, flashcardCount, generator.cancel, isLoading, notes, quizCount]);

  useEffect(() => {
    if (!data) return;
    if (state.status === 'success' || state.status === 'partial') {
      dataSessionIdRef.current = activeSessionId;
      saveSession(data, flashcardMastery, conceptMastery, activeSessionId);
    } else if (state.status === 'error' || state.status === 'cancelled') {
      saveSession(data, flashcardMastery, conceptMastery, dataSessionIdRef.current);
    }
  }, [activeSessionId, conceptMastery, data, flashcardMastery, saveSession, state.status]);

  const previousSession = useMemo(() => {
    return sessions.find((session) => session.id !== activeSessionId) || null;
  }, [activeSessionId, sessions]);

  const sortedSessions = useMemo(() => [...sessions].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [sessions]);

  const handleSelectPreset = (preset: SamplePreset) => {
    setNotes(preset.notes);
    setDifficulty(preset.difficulty);
    setFlashcardCount(preset.id === 'cell-biology' ? 14 : 12);
    setQuizCount(preset.id === 'french-revolution' ? 10 : 8);
  };

  const handleGenerate = () => {
    if (notes.trim().length < 8) return;
    setActiveSessionId(createSessionId());
    void generator.generate({
      notes,
      difficulty,
      flashcardCount,
      quizCount,
      mode: 'generate',
    });
  };

  const handleRefine = (instruction: string) => {
    if (!data) return;
    void generator.generate({
      notes: notes.trim() || data.summary || data.title,
      difficulty,
      flashcardCount,
      quizCount,
      mode: 'refine',
      refinement: instruction,
      currentPack: data,
    });
  };

  const handleFault = (faultMode: FaultMode) => {
    const sourceNotes = notes.trim() || data?.summary || data?.title || 'Create a small study pack about active recall and spaced repetition for evaluator testing.';
    if (isLoading) return;
    setActiveSessionId(createSessionId());
    void generator.generate({
      notes: sourceNotes,
      difficulty,
      flashcardCount,
      quizCount,
      mode: 'generate',
      faultMode,
    });
  };

  const handleRestore = (session: SavedStudySession | null) => {
    if (!session) return;
    setActiveSessionId(session.id);
    dataSessionIdRef.current = session.id;
    setFlashcardMastery(session.flashcardMastery || {});
    setConceptMastery(session.conceptMastery || {});
    generator.restore(session.data);
  };

  const handleRestorePrevious = () => handleRestore(previousSession);

  const handleSessionChange = (sessionId: string) => {
    const session = restoreSession(sessionId);
    if (session) handleRestore(session);
  };

  const masteredConcepts = data?.conceptChecklist.filter((concept) => conceptMastery[concept.id]).length || 0;
  const knownCards = data?.flashcards.filter((card) => flashcardMastery[card.id] === 'known').length || 0;
  const studyPackIsVisible = Boolean(data);

  return (
    <div className="min-h-screen bg-canvas text-ink transition-colors duration-200 dark:bg-[#0b1120] dark:text-slate-100">
      <header className="border-b border-slate-200/80 bg-white/85 backdrop-blur-xl dark:border-slate-800 dark:bg-[#0b1120]/85">
        <div className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"><BrainCircuit size={21} /></span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">RecapitulateAI</h1>
                <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-500/10 dark:text-indigo-200">Study workspace</span>
              </div>
              <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">Turn notes into recall, practice, and mastery.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <SavedSessionPicker
              sessions={sortedSessions}
              activeSessionId={activeSessionId}
              onSelect={handleSessionChange}
            />
            <button type="button" onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800">
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </div>
      </header>

      <main className="w-full px-4 pb-12 pt-6 sm:pt-8">
        <section className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">Learn with active recall</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Your personal study studio</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">Start with your notes. RecapitulateAI turns the material into interactive flashcards, a quiz that loops over missed answers, and a checklist to track concept mastery.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-300"><Clock3 size={15} /></span>
            <span>Built for focused study sessions</span>
          </div>
        </section>

        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(340px,0.88fr)_minmax(0,1.45fr)] xl:gap-6">
          <div className="space-y-4 xl:sticky xl:top-5">
            <StudyInputStudio
              notes={notes}
              onNotesChange={setNotes}
              difficulty={difficulty}
              onDifficultyChange={setDifficulty}
              flashcardCount={flashcardCount}
              onFlashcardCountChange={setFlashcardCount}
              quizCount={quizCount}
              onQuizCountChange={setQuizCount}
              isLoading={isLoading}
              onGenerate={handleGenerate}
              onSelectPreset={handleSelectPreset}
            />
            <FaultSimulatorBar isLoading={isLoading} onRun={handleFault} />
            <div className="surface rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"><PanelTop size={14} /> Study workflow</div>
              <div className="mt-3 space-y-3">
                <div className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-xs font-bold text-violet-700 dark:bg-violet-500/10 dark:text-violet-200">1</span><p className="text-xs leading-5 text-slate-600 dark:text-slate-300"><strong className="text-slate-800 dark:text-slate-100">Recall:</strong> try the flashcard before revealing its answer.</p></div>
                <div className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-xs font-bold text-sky-700 dark:bg-sky-500/10 dark:text-sky-200">2</span><p className="text-xs leading-5 text-slate-600 dark:text-slate-300"><strong className="text-slate-800 dark:text-slate-100">Practice:</strong> answer each quiz question and retest what you missed.</p></div>
                <div className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">3</span><p className="text-xs leading-5 text-slate-600 dark:text-slate-300"><strong className="text-slate-800 dark:text-slate-100">Master:</strong> check off concepts you can explain without notes.</p></div>
              </div>
            </div>
          </div>

          <div className="min-w-0 space-y-4">
            <StatusBanners
              state={state}
              onCancel={generator.cancel}
              onRetry={generator.retry}
              onRestore={handleRestorePrevious}
              hasPreviousSession={Boolean(previousSession)}
            />

            {studyPackIsVisible && data ? (
              <div className="space-y-4 animate-float-in">
                <section className="surface rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6 dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300"><BookOpenCheck size={18} /></span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-300">Current study pack</span>
                        {state.status === 'loading' && <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-200">Updating…</span>}
                      </div>
                      <h3 className="mt-3 break-words text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl">{formatStudyText(data.title)}</h3>
                      {data.summary && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">{formatStudyText(data.summary)}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                      <CheckCircle2 size={14} /> Auto-saved
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-violet-50 p-3 dark:bg-violet-500/10"><p className="text-xl font-extrabold text-violet-800 dark:text-violet-200">{data.flashcards.length}</p><p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700/80 dark:text-violet-200/80">Flashcards</p></div>
                    <div className="rounded-xl bg-sky-50 p-3 dark:bg-sky-500/10"><p className="text-xl font-extrabold text-sky-800 dark:text-sky-200">{data.quiz.length}</p><p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700/80 dark:text-sky-200/80">Quiz items</p></div>
                    <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-500/10"><p className="text-xl font-extrabold text-emerald-800 dark:text-emerald-200">{data.conceptChecklist.length}</p><p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700/80 dark:text-emerald-200/80">Key concepts</p></div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>{knownCards}/{data.flashcards.length} flashcards marked known</span>
                    <span>{masteredConcepts}/{data.conceptChecklist.length} concepts mastered</span>
                  </div>
                </section>

                <FlashcardDeck cards={data.flashcards} mastery={flashcardMastery} onMasteryChange={(id, value) => setFlashcardMastery((current) => ({ ...current, [id]: value }))} />
                <QuizEngine questions={data.quiz} />
                <ConceptChecklist concepts={data.conceptChecklist} mastery={conceptMastery} onMasteryChange={(id, value) => setConceptMastery((current) => ({ ...current, [id]: value }))} />
                <RefinementBar isLoading={isLoading} onRefine={handleRefine} />
              </div>
            ) : (
              state.status !== 'loading' && state.status !== 'error' && (
                <div className="surface overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft dark:border-slate-700 dark:bg-slate-900">
                  <div className="relative border-b border-slate-100 bg-gradient-to-br from-indigo-50 via-white to-sky-50 px-5 py-8 dark:border-slate-800 dark:from-indigo-500/10 dark:via-slate-900 dark:to-sky-500/10 sm:px-8 sm:py-10">
                    <span className="absolute right-6 top-6 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-indigo-300"><NotebookPen size={20} /></span>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">Ready when you are</p>
                    <h3 className="mt-2 max-w-xl text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Turn your notes into a study system.</h3>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">Choose a sample above or paste your own material, then generate the three interactive learning blocks.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-3 sm:p-6">
                    <div className="rounded-2xl border border-violet-100 bg-violet-50/70 p-4 dark:border-violet-400/20 dark:bg-violet-500/10"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-violet-600 dark:bg-slate-800 dark:text-violet-300"><BrainCircuit size={18} /></span><h4 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">Flashcard deck</h4><p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">Flip cards, reveal hints, and track what you know.</p></div>
                    <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4 dark:border-sky-400/20 dark:bg-sky-500/10"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sky-600 dark:bg-slate-800 dark:text-sky-300"><BookOpenCheck size={18} /></span><h4 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">Adaptive quiz</h4><p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">Check understanding and retest only missed questions.</p></div>
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 dark:border-emerald-400/20 dark:bg-emerald-500/10"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-emerald-600 dark:bg-slate-800 dark:text-emerald-300"><CheckCircle2 size={18} /></span><h4 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">Concept mastery</h4><p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">Expand key ideas and check off each concept you master.</p></div>
                  </div>
                  {sessions.length > 0 && (
                    <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">You have {sessions.length} saved study session{sessions.length === 1 ? '' : 's'}.</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {sortedSessions.slice(0, 3).map((session) => <button key={session.id} type="button" onClick={() => handleRestore(session)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:border-indigo-200 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-indigo-200">Restore: {session.title.slice(0, 28)}</button>)}
                      </div>
                    </div>
                  )}
                </div>
              )
            )}

            {state.status === 'loading' && !data && (
              <div className="surface rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-soft dark:border-slate-700 dark:bg-slate-900">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300"><BrainCircuit className="animate-pulse" size={27} /></div>
                <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">Preparing your study blocks</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your flashcards, quiz, and concept checklist will appear here.</p>
              </div>
            )}
          </div>
        </div>

        <footer className="mt-10 flex flex-col justify-between gap-2 border-t border-slate-200 pt-5 text-[11px] text-slate-400 dark:border-slate-800 sm:flex-row sm:items-center">
          <span>RecapitulateAI · Structured study, not chatbot conversations.</span>
          <span>Progress is stored locally in this browser. Keep your original notes backed up.</span>
        </footer>
      </main>
    </div>
  );
}
