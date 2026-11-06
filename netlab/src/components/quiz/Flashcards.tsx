'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, RotateCcw } from 'lucide-react';
import { Button, Chip, EmptyState, IconButton, Skeleton } from '@/components/ui/primitives';
import { chapters } from '@/content/chapters';
import { useProgress } from '@/hooks/useProgress';
import { chapterCode, cn, isTypingTarget } from '@/lib/utils';

export default function Flashcards() {
  const { state, ready, setFlashcard, touchStudyDay } = useProgress();
  const [scope, setScope] = useState('all');
  const [onlyReview, setOnlyReview] = useState(false);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const allCards = useMemo(
    () =>
      chapters
        .filter((c) => scope === 'all' || c.slug === scope)
        .flatMap((c) =>
          c.flashcards.map((card, i) => ({
            key: `${c.slug}:${i}`,
            front: card.front,
            back: card.back,
            code: chapterCode(c.number),
          })),
        ),
    [scope],
  );

  const cards = useMemo(
    () => (onlyReview ? allCards.filter((c) => state.flashcards[c.key] === 'review') : allCards),
    [allCards, onlyReview, state.flashcards],
  );

  const safeIndex = cards.length ? Math.min(index, cards.length - 1) : 0;
  const card = cards[safeIndex];
  const known = allCards.filter((c) => state.flashcards[c.key] === 'known').length;
  const review = allCards.filter((c) => state.flashcards[c.key] === 'review').length;

  useEffect(() => {
    setIndex(0);
    setFlipped(false);
  }, [scope, onlyReview]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || isTypingTarget(e.target) || e.target instanceof HTMLButtonElement) return;
      e.preventDefault();
      setFlipped((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function go(delta: number) {
    if (cards.length === 0) return;
    setIndex((safeIndex + delta + cards.length) % cards.length);
    setFlipped(false);
  }

  function rate(value: 'known' | 'review') {
    if (!card) return;
    setFlashcard(card.key, value);
    touchStudyDay();
    setFlipped(false);
    // In the review-only list a card rated "known" leaves the list, so the next card already sits at this index.
    if (!(onlyReview && value === 'known')) setIndex((safeIndex + 1) % Math.max(1, cards.length));
  }

  if (!ready) return <Skeleton className="h-72" />;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm">
          <span className="sr-only">Choose chapter</span>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className="h-9 rounded border border-line bg-surface px-2 text-sm"
          >
            <option value="all">All chapters</option>
            {chapters.map((c) => (
              <option key={c.slug} value={c.slug}>
                {chapterCode(c.number)} {c.shortTitle}
              </option>
            ))}
          </select>
        </label>
        <Chip active={onlyReview} onClick={() => setOnlyReview((v) => !v)}>
          Only review cards
        </Chip>
        <span className="ml-auto font-mono text-xs text-muted">
          Known {known} / Review {review} / Total {allCards.length}
        </span>
      </div>

      {!card ? (
        <div className="mt-5">
          <EmptyState
            title="No cards to review"
            description="Cards you mark with Review again appear here."
            action={<Button onClick={() => setOnlyReview(false)}>Show all cards</Button>}
          />
        </div>
      ) : (
        <div className="mx-auto mt-5 max-w-reading">
          <div className="flip h-64">
            <button
              type="button"
              onClick={() => setFlipped((v) => !v)}
              aria-label={flipped ? 'Show question side' : 'Show answer side'}
              className={cn('flip-inner block text-left', flipped && 'is-flipped')}
            >
              <span className="flip-face flex flex-col rounded-md border border-line bg-surface p-5">
                <span className="mono-label">
                  {card.code} / Question {safeIndex + 1} of {cards.length}
                </span>
                <span className="flex flex-1 items-center justify-center text-center text-lg font-medium">{card.front}</span>
                <span className="text-center text-xs text-muted">Click or press Space to flip</span>
              </span>
              <span className="flip-face flip-back flex flex-col overflow-auto rounded-md border border-accent bg-accent-soft p-5">
                <span className="mono-label">Answer</span>
                <span className="flex flex-1 items-center justify-center text-center text-[15px] leading-6">{card.back}</span>
              </span>
            </button>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <IconButton label="Previous card" onClick={() => go(-1)}>
              <ArrowLeft size={16} />
            </IconButton>
            <div className="flex gap-2">
              <Button onClick={() => rate('review')}>
                <RotateCcw size={14} aria-hidden="true" />
                Review again
              </Button>
              <Button variant="primary" onClick={() => rate('known')}>
                <Check size={14} aria-hidden="true" />I knew it
              </Button>
            </div>
            <IconButton label="Next card" onClick={() => go(1)}>
              <ArrowRight size={16} />
            </IconButton>
          </div>
        </div>
      )}
    </div>
  );
}
