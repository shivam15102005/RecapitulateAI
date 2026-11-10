import { BookOpen, Brain, FileText, Sparkles } from 'lucide-react';
import { samplePresets, type SamplePreset } from '../lib/samplePresets';
import type { Difficulty } from '../types/study';

interface StudyInputStudioProps {
  notes: string;
  onNotesChange: (value: string) => void;
  difficulty: Difficulty;
  onDifficultyChange: (value: Difficulty) => void;
  flashcardCount: number;
  onFlashcardCountChange: (value: number) => void;
  quizCount: number;
  onQuizCountChange: (value: number) => void;
  isLoading: boolean;
  onGenerate: () => void;
  onSelectPreset: (preset: SamplePreset) => void;
}

export default function StudyInputStudio({
  notes,
  onNotesChange,
  difficulty,
  onDifficultyChange,
  flashcardCount,
  onFlashcardCountChange,
  quizCount,
  onQuizCountChange,
  isLoading,
  onGenerate,
  onSelectPreset,
}: StudyInputStudioProps) {
  const canGenerate = notes.trim().length >= 8;

  return (
    <section className="surface h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
          <FileText size={21} />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Study input studio</h2>
          <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">Paste class notes, a chapter, or just a topic.</p>
        </div>
      </div>

      <label htmlFor="study-notes" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
        Your notes or topic
      </label>
      <textarea
        id="study-notes"
        value={notes}
        onChange={(event) => onNotesChange(event.target.value)}
        maxLength={30000}
        rows={12}
        placeholder="Paste your study notes here. You can also enter a topic, such as ‘Photosynthesis’ or ‘AC circuit analysis’. The AI will structure it into recall and practice activities."
        className="field w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 dark:focus:bg-slate-900"
      />
      <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
        <span>Keep key definitions, formulas, and examples in the source.</span>
        <span className="tabular-nums">{notes.length.toLocaleString()}/30,000</span>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Try a sample preset</h3>
          <span className="text-xs text-slate-400">One click to load</span>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {samplePresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(preset)}
              className="surface-muted group flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50/70 dark:hover:border-indigo-400/50 dark:hover:bg-indigo-500/10"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-indigo-300">
                {preset.id === 'cell-biology' ? <Brain size={17} /> : preset.id === 'newton-laws' ? <Sparkles size={17} /> : <BookOpen size={17} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">{preset.label}</span>
                <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">{preset.description}</span>
              </span>
              <span className="text-xs font-semibold text-indigo-600 opacity-0 transition group-hover:opacity-100 dark:text-indigo-300">Load</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Difficulty</span>
          <select
            value={difficulty}
            onChange={(event) => onDifficultyChange(event.target.value as Difficulty)}
            className="field w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:bg-slate-900"
          >
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Flashcards</span>
          <select
            value={flashcardCount}
            onChange={(event) => onFlashcardCountChange(Number(event.target.value))}
            className="field w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:bg-slate-900"
          >
            {[6, 8, 10, 12, 16, 20, 24, 30].map((count) => <option key={count} value={count}>{count}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Quiz questions</span>
          <select
            value={quizCount}
            onChange={(event) => onQuizCountChange(Number(event.target.value))}
            className="field w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:bg-slate-900"
          >
            {[5, 8, 10, 12, 15, 20, 25].map((count) => <option key={count} value={count}>{count}</option>)}
          </select>
        </label>
      </div>

      <button
        type="button"
        onClick={onGenerate}
        disabled={!canGenerate}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/15 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
      >
        <Sparkles size={18} />
        {isLoading ? 'Generate again (replace request)' : 'Generate study pack'}
      </button>
      <p className="mt-3 text-center text-xs leading-5 text-slate-400">Your source text stays in this browser. AI calls are made from the secure backend.</p>
    </section>
  );
}
