import { AlertCircle, CheckCircle2, Clock3, LoaderCircle, RotateCcw, ShieldAlert, X } from 'lucide-react';
import type { GeneratorState } from '../types/study';

interface StatusBannersProps {
  state: GeneratorState;
  onCancel: () => void;
  onRetry: () => void;
  onRestore: () => void;
  hasPreviousSession: boolean;
}

export default function StatusBanners({ state, onCancel, onRetry, onRestore, hasPreviousSession }: StatusBannersProps) {
  return (
    <div className="space-y-3" aria-live="polite">
      {state.status === 'loading' && (
        <div className="surface rounded-2xl border border-indigo-100 bg-indigo-50/80 p-4 dark:border-indigo-400/20 dark:bg-indigo-500/10">
          <div className="flex items-center gap-3">
            <LoaderCircle className="shrink-0 animate-spin text-indigo-600 dark:text-indigo-300" size={20} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-indigo-950 dark:text-indigo-100">Building your study pack</p>
              <p className="mt-0.5 text-xs text-indigo-700/80 dark:text-indigo-200/80">Organizing your notes into focused recall and practice blocks.</p>
            </div>
            <span className="hidden text-xs font-medium text-indigo-700 dark:text-indigo-200 sm:block">Usually under 20 seconds</span>
          </div>
          {state.isSlowLoading && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-400/30 dark:bg-amber-500/10">
              <div className="flex items-center gap-2 text-sm text-amber-900 dark:text-amber-100">
                <Clock3 size={17} />
                <span>Still working—the AI is taking longer than usual...</span>
              </div>
              <button type="button" onClick={onCancel} className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 dark:border-amber-400/40 dark:bg-slate-900 dark:text-amber-100">
                Cancel request
              </button>
            </div>
          )}
        </div>
      )}

      {state.status === 'loading' && !state.data && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Loading study content">
          {[0, 1, 2].map((item) => (
            <div key={item} className="surface animate-pulse rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="mt-4 h-20 rounded-xl bg-slate-100 dark:bg-slate-800" />
              <div className="mt-3 h-3 w-3/4 rounded bg-slate-100 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      )}

      {state.status === 'partial' && state.warnings.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-400/25 dark:bg-amber-500/10">
          <ShieldAlert className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-300" size={19} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">A few items were skipped, but your study pack is ready.</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs leading-5 text-amber-900/80 dark:text-amber-100/80">
              {state.warnings.map((warning, index) => <li key={`${index}-${warning}`}>{warning}</li>)}
            </ul>
          </div>
        </div>
      )}

      {state.status === 'error' && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-400/25 dark:bg-rose-500/10">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 shrink-0 text-rose-700 dark:text-rose-300" size={20} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-rose-950 dark:text-rose-100">We couldn't build this study pack</p>
              <p className="mt-1 text-sm leading-6 text-rose-900/85 dark:text-rose-100/85">{state.error || 'An unexpected error occurred.'}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={onRetry} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-700 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-800">
                  <RotateCcw size={14} /> Retry
                </button>
                <button type="button" onClick={onRestore} disabled={!hasPreviousSession} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs font-semibold text-rose-900 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-rose-300/30 dark:bg-slate-900 dark:text-rose-100">
                  <CheckCircle2 size={14} /> Restore previous study pack
                </button>
              </div>
            </div>
            <span className="hidden rounded-full bg-white/70 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:bg-slate-900/60 dark:text-rose-200 sm:inline">Input preserved</span>
          </div>
          <details className="mt-3 rounded-xl border border-rose-200/80 bg-white/70 p-3 dark:border-rose-300/15 dark:bg-slate-950/40">
              <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-semibold text-rose-900 dark:text-rose-100">
                <X size={13} /> View raw response diagnostics
              </summary>
              <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-950 p-3 text-[11px] leading-5 text-slate-200">{state.rawResponse || '(No raw response was returned.)'}</pre>
          </details>
        </div>
      )}

      {state.status === 'cancelled' && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/70">
          <p className="text-sm text-slate-700 dark:text-slate-200">{state.error || 'The request was cancelled.'}</p>
          <button type="button" onClick={onRetry} className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900 dark:text-indigo-300">
            <RotateCcw size={14} /> Try again
          </button>
        </div>
      )}

      {state.status === 'success' && state.provider && (
        <p className="text-right text-[11px] text-slate-400">Generated with {state.provider}</p>
      )}
    </div>
  );
}
