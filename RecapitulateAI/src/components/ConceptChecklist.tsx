import { useState } from 'react';
import { Check, ChevronDown, ChevronRight, ListChecks, Target } from 'lucide-react';
import type { StudyConcept } from '../types/study';
import { formatStudyText } from '../lib/formatStudyText';

interface ConceptChecklistProps {
  concepts: StudyConcept[];
  mastery: Record<string, boolean>;
  onMasteryChange: (id: string, mastered: boolean) => void;
}

export default function ConceptChecklist({ concepts, mastery, onMasteryChange }: ConceptChecklistProps) {
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const masteredCount = concepts.filter((concept) => mastery[concept.id]).length;

  const toggleExpanded = (id: string) => {
    setExpandedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  return (
    <section className="surface rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"><ListChecks size={18} /></span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Key concept checklist</h2>
          </div>
          <p className="mt-1 pl-11 text-xs text-slate-500 dark:text-slate-400">Expand each concept, then mark it mastered when you can explain it.</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">{masteredCount}/{concepts.length} mastered</span>
      </div>

      {concepts.length > 0 && (
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(masteredCount / concepts.length) * 100}%` }} />
        </div>
      )}

      {concepts.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">No concept checklist items were returned for this pack.</div>
      ) : (
        <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
          {concepts.map((concept, index) => {
            const isExpanded = expandedIds.includes(concept.id);
            const isMastered = Boolean(mastery[concept.id]);
            return (
              <article key={concept.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <button type="button" onClick={() => onMasteryChange(concept.id, !isMastered)} aria-label={isMastered ? `Mark ${formatStudyText(concept.title)} as not mastered` : `Mark ${formatStudyText(concept.title)} as mastered`} aria-pressed={isMastered} className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition ${isMastered ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white text-transparent hover:border-emerald-400 dark:border-slate-600 dark:bg-slate-900'}`}>
                    <Check size={14} strokeWidth={3} />
                  </button>
                  <button type="button" onClick={() => toggleExpanded(concept.id)} aria-expanded={isExpanded} className="flex min-w-0 flex-1 items-start gap-2 text-left">
                    <span className="mt-0.5 text-slate-400">{isExpanded ? <ChevronDown size={17} /> : <ChevronRight size={17} />}</span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-sm font-semibold ${isMastered ? 'text-emerald-800 line-through decoration-emerald-300 dark:text-emerald-200' : 'text-slate-800 dark:text-slate-100'}`}>{formatStudyText(concept.title)}</span>
                      {!isExpanded && <span className="mt-1 line-clamp-1 block text-xs text-slate-500 dark:text-slate-400">{formatStudyText(concept.description)}</span>}
                    </span>
                    <span className="hidden text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:inline">{String(index + 1).padStart(2, '0')}</span>
                  </button>
                  {isMastered && <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">Done</span>}
                </div>

                {isExpanded && (
                  <div className="ml-9 mt-3 animate-fade-in rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                    <p className="text-sm leading-6 text-slate-700 dark:text-slate-200">{formatStudyText(concept.description)}</p>
                    {concept.keyPoints.length > 0 && (
                      <ul className="mt-3 space-y-2">
                        {concept.keyPoints.map((point, pointIndex) => (
                          <li key={`${concept.id}-${pointIndex}`} className="flex gap-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />{formatStudyText(point)}
                          </li>
                        ))}
                      </ul>
                    )}
                    {concept.selfCheck && (
                      <div className="mt-3 flex gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2.5 text-xs leading-5 text-indigo-900 dark:border-indigo-400/20 dark:bg-indigo-500/10 dark:text-indigo-100">
                        <Target size={15} className="mt-0.5 shrink-0" />
                        <span><strong>Self-check:</strong> {formatStudyText(concept.selfCheck)}</span>
                      </div>
                    )}
                    <button type="button" onClick={() => onMasteryChange(concept.id, !isMastered)} className={`mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold ${isMastered ? 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
                      <Check size={14} /> {isMastered ? 'Undo mastery' : 'Mark as mastered'}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
