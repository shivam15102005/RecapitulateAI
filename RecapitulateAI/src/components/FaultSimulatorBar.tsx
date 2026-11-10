import { useState } from 'react';
import { Bug, Play, ShieldCheck } from 'lucide-react';

export type FaultMode = 'none' | 'partial' | 'malformed' | 'trailing_comma' | 'empty' | 'invalid_types' | 'server_error' | 'slow';

interface FaultSimulatorBarProps {
  isLoading: boolean;
  onRun: (mode: FaultMode) => void;
}

const faultOptions: Array<{ value: FaultMode; label: string }> = [
  { value: 'partial', label: 'Partial salvage (bad items)' },
  { value: 'malformed', label: 'Malformed JSON + prose' },
  { value: 'trailing_comma', label: 'Trailing comma repair' },
  { value: 'empty', label: 'Empty model response' },
  { value: 'invalid_types', label: 'Invalid top-level types' },
  { value: 'server_error', label: 'HTTP 500 provider failure' },
  { value: 'slow', label: 'Slow response (8 seconds)' },
];

export default function FaultSimulatorBar({ isLoading, onRun }: FaultSimulatorBarProps) {
  const [mode, setMode] = useState<FaultMode>('partial');

  return (
    <details className="surface rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200"><Bug size={16} className="text-slate-500" /> Evaluator fault simulator</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Developer tools</span>
      </summary>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Fault simulation mode</span>
          <select value={mode} onChange={(event) => setMode(event.target.value as FaultMode)} className="field w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
            {faultOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <button type="button" disabled={isLoading} onClick={() => onRun(mode)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600">
          <Play size={15} /> Run simulation
        </button>
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-[11px] leading-5 text-slate-500 dark:text-slate-400"><ShieldCheck size={13} /> Fault modes are served by the Express backend and do not require a real AI provider. Production deployments disable them by default.</p>
    </details>
  );
}
