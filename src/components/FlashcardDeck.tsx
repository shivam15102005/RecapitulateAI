import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CircleHelp, RotateCw, Shuffle, Sparkles } from 'lucide-react';
import type { Flashcard } from '../types/study';
import { formatStudyText } from '../lib/formatStudyText';

type Mastery = 'known' | 'review';
type MasteryFilter = 'all' | 'review' | 'known';

interface FlashcardDeckProps {
  cards: Flashcard[];
  mastery: Record<string, Mastery>;
  onMasteryChange: (id: string, mastery: Mastery) => void;
}

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

export default function FlashcardDeck({ cards, mastery, onMasteryChange }: FlashcardDeckProps) {
  const [order, setOrder] = useState<string[]>(() => cards.map((card) => card.id));
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const [filter, setFilter] = useState<MasteryFilter>('all');

  useEffect(() => {
    const currentIds = cards.map((card) => card.id);
    setOrder((current) => {
      const currentSet = new Set(currentIds);
      const retained = current.filter((id) => currentSet.has(id));
      const retainedSet = new Set(retained);
      const additions = currentIds.filter((id) => !retainedSet.has(id));
      return [...retained, ...additions];
    });
    setIndex((current) => Math.min(current, Math.max(0, currentIds.length - 1)));
  }, [cards]);

  const filteredCards = useMemo(() => {
    const cardMap = new Map(cards.map((card) => [card.id, card]));
    return order
      .map((id) => cardMap.get(id))
      .filter((card): card is Flashcard => Boolean(card))
      .filter((card) => filter === 'all' || mastery[card.id] === filter);
  }, [cards, filter, mastery, order]);

  useEffect(() => {
    setIndex((current) => Math.min(current, Math.max(0, filteredCards.length - 1)));
    setIsFlipped(false);
    setHintVisible(false);
  }, [filter, filteredCards.length]);

  const currentCard = filteredCards[index];

  useEffect(() => {
    setIsFlipped(false);
    setHintVisible(false);
  }, [currentCard?.id]);

  const knownCount = cards.filter((card) => mastery[card.id] === 'known').length;
  const reviewCount = cards.filter((card) => mastery[card.id] === 'review').length;

  const move = (direction: -1 | 1) => {
    if (filteredCards.length === 0) return;
    setIndex((current) => (current + direction + filteredCards.length) % filteredCards.length);
    setIsFlipped(false);
    setHintVisible(false);
  };

  const flip = () => {
    setIsFlipped((current) => !current);
    setHintVisible(false);
  };

  const rate = (rating: Mastery) => {
    if (!currentCard) return;
    onMasteryChange(currentCard.id, rating);
    move(1);
  };

  const shuffleDeck = () => {
    setOrder((current) => shuffled(current));
    setIndex(0);
    setIsFlipped(false);
    setHintVisible(false);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target?.isContentEditable) return;
      // A focused button already receives Space as its native activation key.
      if (event.code === 'Space' && tagName === 'button') return;

      if (event.code === 'Space') {
        event.preventDefault();
        flip();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        move(1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        move(-1);
      } else if (event.key === '1') {
        event.preventDefault();
        rate('review');
      } else if (event.key === '3') {
        event.preventDefault();
        rate('known');
      } else if (event.key.toLowerCase() === 'h') {
        event.preventDefault();
        setHintVisible((visible) => !visible);
      } else if (event.key.toLowerCase() === 's') {
        event.preventDefault();
        shuffleDeck();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <section className="surface rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300"><Sparkles size={17} /></span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Flashcard deck</h2>
          </div>
          <p className="mt-1 pl-11 text-xs text-slate-500 dark:text-slate-400">Flip, retrieve, then rate how well you knew it.</p>
        </div>
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
          <span className="sr-only">Filter flashcards</span>
          <select value={filter} onChange={(event) => setFilter(event.target.value as MasteryFilter)} className="field rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-indigo-400 dark:bg-slate-900">
            <option value="all">All cards ({cards.length})</option>
            <option value="review">Needs review ({reviewCount})</option>
            <option value="known">Mastered ({knownCount})</option>
          </select>
        </label>
      </div>

      {cards.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
          No flashcards were returned for this pack.
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900/60">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No cards in this filter yet.</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Rate a few cards or switch back to all cards.</p>
        </div>
      ) : currentCard ? (
        <>
          <div className="mt-5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Card {index + 1} of {filteredCards.length}</span>
            <span>{formatStudyText(currentCard.topic || 'Active recall')}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${((index + 1) / filteredCards.length) * 100}%` }} />
          </div>

          <button type="button" onClick={flip} aria-pressed={isFlipped} aria-label={isFlipped ? 'Show flashcard question' : 'Reveal flashcard answer'} className="flip-scene mt-4 block w-full rounded-2xl text-left">
            <div className={`flip-card rounded-2xl ${isFlipped ? 'is-flipped' : ''}`}>
              <div className="flip-face rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-5 shadow-sm dark:border-violet-400/20 dark:from-violet-500/10 dark:to-slate-900 sm:p-7">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-violet-700 dark:bg-violet-400/15 dark:text-violet-200">Question</span>
                  <span className="text-xs text-violet-500 dark:text-violet-300">Reveal answer</span>
                </div>
                <p className="my-6 text-center text-xl font-semibold leading-8 text-slate-900 dark:text-slate-100 sm:px-5 sm:text-2xl">{formatStudyText(currentCard.question)}</p>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Think before revealing</span>
                  {mastery[currentCard.id] === 'known' ? <span className="font-semibold text-emerald-600 dark:text-emerald-300">Mastered</span> : mastery[currentCard.id] === 'review' ? <span className="font-semibold text-amber-600 dark:text-amber-300">Review again</span> : <span>Not rated</span>}
                </div>
              </div>
              <div className="flip-face flip-face-back flashcard-answer-face rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-indigo-50 p-5 shadow-sm dark:border-cyan-300/25 dark:from-[#12324a] dark:via-[#12283e] dark:to-[#0c1728] sm:p-7">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan-800 dark:bg-cyan-300/15 dark:text-cyan-100">Answer</span>
                  <span className="text-xs text-cyan-700 dark:text-cyan-100">Tap to return</span>
                </div>
                <p className="flashcard-answer-copy my-6 overflow-y-auto text-center text-base font-semibold leading-7 text-cyan-950 sm:px-4 sm:text-lg dark:text-cyan-100">{formatStudyText(currentCard.answer)}</p>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-cyan-100/90"><span>Rate your recall below</span><span>Answer revealed</span></div>
              </div>
            </div>
          </button>

          <div id={`flashcard-hint-${currentCard.id}`} hidden={!hintVisible} role="status" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100">
            <span className="mr-2 text-xs font-bold uppercase tracking-wide">Hint</span>{formatStudyText(currentCard.hint)}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <button type="button" onClick={() => setHintVisible((visible) => !visible)} aria-expanded={hintVisible} aria-controls={`flashcard-hint-${currentCard.id}`} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 dark:text-slate-300 dark:hover:bg-slate-800">
              <CircleHelp size={15} /> {hintVisible ? 'Hide hint' : 'Show hint'} <kbd className="ml-1 rounded border border-slate-200 px-1 py-0.5 text-[10px] dark:border-slate-700">H</kbd>
            </button>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => move(-1)} aria-label="Previous flashcard" className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"><ArrowLeft size={16} /></button>
              <button type="button" onClick={() => move(1)} aria-label="Next flashcard" className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"><ArrowRight size={16} /></button>
              <button type="button" onClick={shuffleDeck} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                <Shuffle size={14} /> Shuffle <kbd className="rounded border border-slate-200 px-1 py-0.5 text-[10px] dark:border-slate-600">S</kbd>
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button type="button" onClick={() => rate('review')} className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200 dark:hover:bg-amber-500/20">
              <RotateCw size={16} /> Needs review <kbd className="rounded border border-amber-300 px-1 text-[10px] dark:border-amber-400/30">1</kbd>
            </button>
            <button type="button" onClick={() => rate('known')} className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:bg-emerald-500/20">
              <Check size={16} /> I knew it <kbd className="rounded border border-emerald-300 px-1 text-[10px] dark:border-emerald-400/30">3</kbd>
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}
