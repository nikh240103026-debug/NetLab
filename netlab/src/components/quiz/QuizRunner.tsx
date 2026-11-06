'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Check, RotateCcw, X } from 'lucide-react';
import { Badge, Button, Card, ProgressBar } from '@/components/ui/primitives';
import { useProgress } from '@/hooks/useProgress';
import type { Chapter, QuizQuestion } from '@/lib/types';
import { cn, isTypingTarget, shuffle } from '@/lib/utils';

type Prepared = { q: QuizQuestion; order: number[] };
type Answer = { chosen: number; correct: boolean };

const LEVELS: QuizQuestion['difficulty'][] = ['easy', 'medium', 'hard'];

export default function QuizRunner({ chapter, onExit }: { chapter: Chapter; onExit?: () => void }) {
  const { saveQuizResult, addActivity, touchStudyDay, state } = useProgress();
  const [stage, setStage] = useState<'intro' | 'running' | 'done'>('intro');
  const [items, setItems] = useState<Prepared[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);

  const best = state.quizResults[chapter.slug];
  const current = items[index];

  function start() {
    setItems(chapter.quiz.map((q) => ({ q, order: shuffle(q.options.map((_, i) => i)) })));
    setIndex(0);
    setSelected(null);
    setChecked(false);
    setAnswers([]);
    setStage('running');
  }

  function check() {
    if (selected === null || !current) return;
    const chosen = current.order[selected];
    setAnswers((prev) => [...prev, { chosen, correct: chosen === current.q.answerIndex }]);
    setChecked(true);
  }

  function next() {
    if (index + 1 < items.length) {
      setIndex(index + 1);
      setSelected(null);
      setChecked(false);
      return;
    }
    const correct = answers.filter((a) => a.correct).length;
    const percent = Math.round((correct / Math.max(1, items.length)) * 100);
    const wrongTopics = items.filter((_, i) => !answers[i]?.correct).map((it) => it.q.topic);
    saveQuizResult(chapter.slug, percent, wrongTopics);
    touchStudyDay();
    addActivity(`Scored ${percent}% on the ${chapter.shortTitle} quiz`, `/chapters/${chapter.slug}#quiz`);
    setStage('done');
  }

  useEffect(() => {
    if (stage !== 'running') return;
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (!checked && ['1', '2', '3', '4'].includes(e.key)) {
        const i = Number(e.key) - 1;
        if (current && i < current.order.length) setSelected(i);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (checked) next();
        else if (selected !== null) check();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (stage === 'intro') {
    return (
      <Card className="p-5">
        <p className="mono-label">Chapter test</p>
        <h2 className="mt-1 text-lg font-semibold">{chapter.title}</h2>
        <p className="mt-1 text-sm text-muted">
          {chapter.quiz.length} questions with instant explanations. Use keys 1 to 4 to select and Enter to continue.
        </p>
        {best && (
          <p className="mt-2 font-mono text-xs text-muted">
            Best {best.best}% / Last {best.last}% / Attempts {best.attempts}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="primary" onClick={start}>
            Start test
          </Button>
          {onExit && <Button onClick={onExit}>Back</Button>}
        </div>
      </Card>
    );
  }

  if (stage === 'done') {
    const correct = answers.filter((a) => a.correct).length;
    const percent = Math.round((correct / Math.max(1, items.length)) * 100);
    const wrong = items
      .map((item, i) => ({ item, answer: answers[i] }))
      .filter((row) => row.answer && !row.answer.correct);
    return (
      <div className="space-y-4">
        <Card className="p-5">
          <p className="mono-label">Result</p>
          <p className="mt-1 text-3xl font-semibold">{percent}%</p>
          <p className="text-sm text-muted">
            {correct} of {items.length} correct
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {LEVELS.map((level) => {
              const rows = items.map((it, i) => ({ it, a: answers[i] })).filter((r) => r.it.q.difficulty === level);
              const right = rows.filter((r) => r.a?.correct).length;
              return (
                <div key={level} className="rounded border border-line p-3">
                  <p className="mono-label">{level}</p>
                  <p className="mt-1 font-mono text-sm">
                    {right}/{rows.length}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="primary" onClick={start}>
              <RotateCcw size={14} aria-hidden="true" />
              Retry
            </Button>
            {onExit && <Button onClick={onExit}>Back to tests</Button>}
          </div>
        </Card>
        {wrong.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold">Wrong answer review</h3>
            <ul className="mt-2 space-y-3">
              {wrong.map(({ item, answer }) => (
                <li key={item.q.id}>
                  <Card className="p-4 text-sm">
                    <p className="font-medium">{item.q.question}</p>
                    <p className="mt-2 text-danger-ink">Your answer: {item.q.options[answer.chosen]}</p>
                    <p className="mt-1 text-success-ink">Correct: {item.q.options[item.q.answerIndex]}</p>
                    <p className="mt-2 text-muted">{item.q.explanation}</p>
                  </Card>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  if (!current) return null;
  const isLast = index + 1 === items.length;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-xs text-muted">
          Q{index + 1} / {items.length}
        </span>
        <Badge tone={current.q.difficulty === 'hard' ? 'danger' : current.q.difficulty === 'medium' ? 'warning' : 'success'}>
          {current.q.difficulty}
        </Badge>
      </div>
      <div className="mt-2">
        <ProgressBar value={Math.round((index / items.length) * 100)} label="Test progress" />
      </div>
      <h3 className="mt-4 font-medium leading-6">{current.q.question}</h3>
      <div role="radiogroup" aria-label="Answer options" className="mt-4 space-y-2">
        {current.order.map((optionIndex, display) => {
          const isSelected = selected === display;
          const isAnswer = optionIndex === current.q.answerIndex;
          return (
            <button
              key={optionIndex}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={checked}
              onClick={() => setSelected(display)}
              className={cn(
                'flex w-full items-start gap-3 rounded border px-3 py-2.5 text-left text-sm transition-colors',
                !checked && isSelected && 'border-accent bg-accent-soft',
                !checked && !isSelected && 'border-line hover:border-accent',
                checked && isAnswer && 'border-success bg-success-soft',
                checked && isSelected && !isAnswer && 'border-danger bg-danger-soft',
                checked && !isSelected && !isAnswer && 'border-line opacity-70',
              )}
            >
              <span className="font-mono text-xs text-muted">{display + 1}</span>
              <span className="min-w-0 flex-1">{current.q.options[optionIndex]}</span>
              {checked && isAnswer && <Check size={15} className="shrink-0 text-success-ink" aria-label="Correct answer" />}
              {checked && isSelected && !isAnswer && <X size={15} className="shrink-0 text-danger-ink" aria-label="Your answer" />}
            </button>
          );
        })}
      </div>
      {checked && (
        <div className="mt-4 rounded border border-line bg-bg p-3 text-sm" aria-live="polite">
          <p className="mono-label">Explanation</p>
          <p className="mt-1">{current.q.explanation}</p>
        </div>
      )}
      <div className="mt-4 flex justify-end">
        {checked ? (
          <Button variant="primary" onClick={next}>
            {isLast ? 'See result' : 'Next question'}
            <ArrowRight size={14} aria-hidden="true" />
          </Button>
        ) : (
          <Button variant="primary" onClick={check} disabled={selected === null}>
            Check
          </Button>
        )}
      </div>
    </Card>
  );
}
