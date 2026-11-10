import { useState, type FormEvent } from 'react';
import { ArrowUpRight, LoaderCircle, WandSparkles } from 'lucide-react';

interface RefinementBarProps {
  isLoading: boolean;
  onRefine: (instruction: string) => void;
}

const suggestions = [
  'Add more application-based questions',
  'Explain difficult ideas in simpler language',
  'Add examples and common misconceptions',
];

export default function RefinementBar({ isLoading, onRefine }: RefinementBarProps) {
  const [instruction, setInstruction] = useState('');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleaned = instruction.trim();
    if (!cleaned) return;
    onRefine(cleaned);
    setInstruction('');
  };

  return (
    <section className="surface rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-white p-5 shadow-soft dark:border-indigo-400/20 dark:from-indigo-500/10 dark:to-slate-900 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-indigo-300"><WandSparkles size={19} /></span>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Refine this study pack</h2>
          <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">Ask for improvements or extra practice. Existing progress is preserved where items remain the same.</p>
        </div>
      </div>
      <form onSubmit={submit} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <label htmlFor="refinement-prompt" className="sr-only">Refinement instruction</label>
        <input
          id="refinement-prompt"
          value={instruction}
          onChange={(event) => setInstruction(event.target.value)}
          maxLength={2000}
          placeholder="e.g. Add 5 harder questions about the key formulas…"
          className="field min-w-0 flex-1 rounded-xl border border-indigo-100 bg-white px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        <button type="submit" disabled={!instruction.trim()} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-400">
          {isLoading ? <LoaderCircle className="animate-spin" size={16} /> : <ArrowUpRight size={16} />}
          {isLoading ? 'Replace request with refinement' : 'Apply refinement'}
        </button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button key={suggestion} type="button" onClick={() => setInstruction(suggestion)} className="rounded-full border border-indigo-100 bg-white/80 px-3 py-1.5 text-[11px] font-medium text-indigo-700 transition hover:border-indigo-300 hover:bg-white dark:border-indigo-400/20 dark:bg-slate-900/70 dark:text-indigo-200 dark:hover:bg-slate-800">
            {suggestion}
          </button>
        ))}
      </div>
    </section>
  );
}
