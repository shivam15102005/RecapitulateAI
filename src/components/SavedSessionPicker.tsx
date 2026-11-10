import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Clock3, Save } from 'lucide-react';
import type { SavedStudySession } from '../types/study';

interface SavedSessionPickerProps {
  sessions: SavedStudySession[];
  activeSessionId: string;
  onSelect: (sessionId: string) => void;
}

function formatUpdatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Saved session';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export default function SavedSessionPicker({ sessions, activeSessionId, onSelect }: SavedSessionPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? sessions[0] ?? null,
    [activeSessionId, sessions],
  );

  useEffect(() => {
    if (!isOpen) return undefined;
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        const menuButtons = optionRefs.current.filter((button): button is HTMLButtonElement => Boolean(button));
        if (menuButtons.length === 0) return;
        event.preventDefault();
        const currentIndex = menuButtons.indexOf(document.activeElement as HTMLButtonElement);
        const nextIndex = event.key === 'ArrowDown'
          ? (currentIndex + 1 + menuButtons.length) % menuButtons.length
          : (currentIndex - 1 + menuButtons.length) % menuButtons.length;
        menuButtons[nextIndex]?.focus();
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const openMenu = () => setIsOpen((open) => !open);

  const selectSession = (sessionId: string) => {
    onSelect(sessionId);
    setIsOpen(false);
  };

  if (sessions.length === 0) return null;

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        onClick={openMenu}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Saved sessions. Current session: ${activeSession?.title ?? 'None selected'}`}
        className="flex h-10 max-w-[min(19rem,58vw)] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-700 shadow-sm transition hover:border-indigo-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:border-indigo-400 dark:hover:bg-slate-800 sm:px-3"
      >
        <Save size={14} className="shrink-0" aria-hidden="true" />
        <span className="hidden shrink-0 font-medium sm:inline">Saved sessions</span>
        <span className="min-w-0 truncate font-semibold sm:max-w-36" title={activeSession?.title ?? ''}>
          {activeSession?.title ?? 'Choose a session'}
        </span>
        <ChevronDown size={14} className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {isOpen && (
        <div
          role="menu"
          aria-label="Saved study sessions"
          className="saved-session-menu absolute left-0 right-auto z-50 mt-2 max-h-[min(22rem,70vh)] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white p-2 text-slate-800 shadow-[0_18px_50px_rgba(2,6,23,0.22)] ring-1 ring-black/5 dark:border-slate-700 dark:bg-[#111a2d] dark:text-white dark:shadow-[0_18px_50px_rgba(0,0,0,0.55)] dark:ring-white/5 sm:left-auto sm:right-0"
        >
          <div className="px-3 pb-2 pt-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">Your study sessions</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Choose a saved pack to restore your progress.</p>
          </div>
          <div className="space-y-1">
            {sessions.map((session, index) => {
              const isActive = session.id === activeSessionId;
              return (
                <button
                  key={session.id}
                  ref={(element) => { optionRefs.current[index] = element; }}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isActive}
                  onClick={() => selectSession(session.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-950 dark:bg-indigo-400/15 dark:text-white'
                      : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isActive ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-400/20 dark:text-indigo-200' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'}`}>
                    {isActive ? <Check size={15} /> : <Clock3 size={15} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold">{session.title}</span>
                    <span className={`mt-0.5 block text-[10px] ${isActive ? 'text-indigo-700/80 dark:text-indigo-100/80' : 'text-slate-500 dark:text-slate-400'}`}>
                      {formatUpdatedAt(session.updatedAt)}
                    </span>
                  </span>
                  {isActive && <Check size={15} className="shrink-0 text-indigo-600 dark:text-indigo-200" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
