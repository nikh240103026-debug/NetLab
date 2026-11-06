'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Clock, Flag, RotateCcw } from 'lucide-react';
import { PerChapterChart } from '@/components/dashboard/Charts';
import Dialog from '@/components/ui/Dialog';
import { Button, Card, Chip, EmptyState } from '@/components/ui/primitives';
import { chapters } from '@/content/chapters';
import { useProgress } from '@/hooks/useProgress';
import type { Chapter, MockResult, QuizQuestion } from '@/lib/types';
import { chapterCode, chapterLabel, cn, formatClock, shuffle, timeAgo, uid } from '@/lib/utils';

type ExamQuestion = { q: QuizQuestion; chapter: Chapter; order: number[] };
type Review = { question: ExamQuestion; chosen: number | null };

const COUNTS = [20, 30, 40];

function buildExam(slugs: string[], count: number): ExamQuestion[] {
  const pool = chapters.filter((c) => slugs.includes(c.slug)).flatMap((c) => c.quiz.map((q) => ({ q, chapter: c })));
  return shuffle(pool)
    .slice(0, count)
    .map((item) => ({ ...item, order: shuffle(item.q.options.map((_, i) => i)) }));
}

export default function MockExam() {
  const { state, saveMock, addActivity, touchStudyDay } = useProgress();
  const [stage, setStage] = useState<'setup' | 'exam' | 'result'>('setup');
  const [selected, setSelected] = useState<string[]>(() => chapters.map((c) => c.slug));
  const [count, setCount] = useState(20);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [marked, setMarked] = useState<boolean[]>([]);
  const [current, setCurrent] = useState(0);
  const [endAt, setEndAt] = useState(0);
  const [now, setNow] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<MockResult | null>(null);
  const [review, setReview] = useState<Review[]>([]);
  const startedAt = useRef(0);

  const availableQuestions = chapters
    .filter((c) => selected.includes(c.slug))
    .reduce((sum, c) => sum + c.quiz.length, 0);

  function toggleChapter(slug: string) {
    setSelected((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }

  function startExam() {
    const exam = buildExam(selected, count);
    if (exam.length === 0) return;
    const nowMs = Date.now();
    setQuestions(exam);
    setAnswers(exam.map(() => null));
    setMarked(exam.map(() => false));
    setCurrent(0);
    startedAt.current = nowMs;
    setEndAt(nowMs + exam.length * 60 * 1000);
    setNow(nowMs);
    setResult(null);
    setStage('exam');
  }

  const submit = useCallback(() => {
    const perChapter = new Map<number, { correct: number; total: number }>();
    const wrongTopics: string[] = [];
    const reviewRows: Review[] = [];
    let correct = 0;
    questions.forEach((question, i) => {
      const display = answers[i];
      const chosen = display === null || display === undefined ? null : question.order[display];
      const isRight = chosen === question.q.answerIndex;
      const bucket = perChapter.get(question.chapter.number) ?? { correct: 0, total: 0 };
      bucket.total += 1;
      if (isRight) {
        bucket.correct += 1;
        correct += 1;
      } else {
        wrongTopics.push(question.q.topic);
        reviewRows.push({ question, chosen });
      }
      perChapter.set(question.chapter.number, bucket);
    });
    const total = questions.length;
    const percent = Math.round((correct / Math.max(1, total)) * 100);
    const outcome: MockResult = {
      id: uid(),
      at: new Date().toISOString(),
      total,
      correct,
      percent,
      durationSec: Math.round((Date.now() - startedAt.current) / 1000),
      perChapter: Array.from(perChapter.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([chapter, v]) => ({ chapter, ...v })),
      wrongTopics,
    };
    saveMock(outcome);
    touchStudyDay();
    addActivity(`Scored ${percent}% on a ${total} question mock exam`, '/practice?view=mock');
    setResult(outcome);
    setReview(reviewRows);
    setConfirming(false);
    setStage('result');
  }, [questions, answers, saveMock, touchStudyDay, addActivity]);

  useEffect(() => {
    if (stage !== 'exam') return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [stage]);

  const remaining = Math.max(0, Math.ceil((endAt - now) / 1000));

  useEffect(() => {
    if (stage === 'exam' && endAt > 0 && remaining === 0) submit();
  }, [stage, endAt, remaining, submit]);

  if (stage === 'setup') {
    return (
      <div className="space-y-4">
        <Card className="p-5">
          <h2 className="font-semibold">Set up a mock exam</h2>
          <p className="mt-1 text-sm text-muted">One minute per question. Unanswered questions count as wrong.</p>
          <fieldset className="mt-4">
            <legend className="mono-label">Chapters</legend>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {chapters.map((c) => (
                <Chip key={c.slug} active={selected.includes(c.slug)} onClick={() => toggleChapter(c.slug)}>
                  {chapterCode(c.number)} {c.shortTitle}
                </Chip>
              ))}
            </div>
          </fieldset>
          <fieldset className="mt-4">
            <legend className="mono-label">Questions</legend>
            <div className="mt-2 flex gap-1.5">
              {COUNTS.map((n) => (
                <Chip key={n} active={count === n} onClick={() => setCount(n)}>
                  {n}
                </Chip>
              ))}
            </div>
          </fieldset>
          {availableQuestions > 0 && availableQuestions < count && (
            <p className="mt-3 text-sm text-warning-ink">
              The selected chapters hold {availableQuestions} questions, so the exam will use all of them.
            </p>
          )}
          <Button variant="primary" className="mt-5" disabled={availableQuestions === 0} onClick={startExam}>
            Start exam
          </Button>
        </Card>
        {state.mockHistory.length > 0 && (
          <Card className="p-5">
            <p className="mono-label">Recent attempts</p>
            <ul className="mt-2 divide-y divide-line">
              {state.mockHistory.slice(0, 5).map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="font-mono">
                    {m.correct}/{m.total} ({m.percent}%)
                  </span>
                  <span className="text-xs text-muted">{timeAgo(m.at)}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    );
  }

  if (stage === 'result' && result) {
    return (
      <div className="space-y-4">
        <Card className="p-5">
          <p className="mono-label">Exam result</p>
          <p className="mt-1 text-3xl font-semibold">{result.percent}%</p>
          <p className="text-sm text-muted">
            {result.correct} of {result.total} correct in {formatClock(result.durationSec)}
          </p>
          <div className="mt-4 h-56">
            <PerChapterChart
              data={result.perChapter.map((p) => ({
                name: chapterCode(p.chapter),
                percent: Math.round((p.correct / Math.max(1, p.total)) * 100),
              }))}
            />
          </div>
          <Button className="mt-3" onClick={() => setStage('setup')}>
            <RotateCcw size={14} aria-hidden="true" />
            New exam
          </Button>
        </Card>
        {review.length === 0 ? (
          <EmptyState title="No wrong answers" description="Every question was correct." />
        ) : (
          <div>
            <h3 className="text-sm font-semibold">Wrong answer review</h3>
            <ul className="mt-2 space-y-3">
              {review.map(({ question, chosen }) => (
                <li key={question.q.id}>
                  <Card className="p-4 text-sm">
                    <p className="mono-label">{chapterLabel(question.chapter)}</p>
                    <p className="mt-1 font-medium">{question.q.question}</p>
                    <p className="mt-2 text-danger-ink">
                      Your answer: {chosen === null ? 'Not answered' : question.q.options[chosen]}
                    </p>
                    <p className="mt-1 text-success-ink">Correct: {question.q.options[question.q.answerIndex]}</p>
                    <p className="mt-2 text-muted">{question.q.explanation}</p>
                  </Card>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  const q = questions[current];
  if (!q) return null;
  const answeredCount = answers.filter((a) => a !== null).length;
  const lowTime = remaining <= 60;

  function setAnswer(value: number | null) {
    setAnswers((prev) => prev.map((a, i) => (i === current ? value : a)));
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
      <Card className="p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-xs text-muted">
            Q{current + 1} / {questions.length} / {chapterCode(q.chapter.number)}
          </span>
          <span
            role="timer"
            aria-label="Time remaining"
            className={cn(
              'inline-flex items-center gap-1 rounded border px-2 py-1 font-mono text-sm',
              lowTime ? 'border-danger text-danger-ink' : 'border-line',
            )}
          >
            <Clock size={13} aria-hidden="true" />
            {formatClock(remaining)}
          </span>
        </div>
        <h3 className="mt-4 font-medium leading-6">{q.q.question}</h3>
        <div role="radiogroup" aria-label="Answer options" className="mt-4 space-y-2">
          {q.order.map((optionIndex, display) => {
            const active = answers[current] === display;
            return (
              <button
                key={optionIndex}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setAnswer(display)}
                className={cn(
                  'flex w-full items-start gap-3 rounded border px-3 py-2.5 text-left text-sm transition-colors',
                  active ? 'border-accent bg-accent-soft' : 'border-line hover:border-accent',
                )}
              >
                <span className="font-mono text-xs text-muted">{display + 1}</span>
                <span className="min-w-0">{q.q.options[optionIndex]}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Button size="sm" disabled={current === 0} onClick={() => setCurrent(current - 1)}>
            Previous
          </Button>
          <Button size="sm" disabled={current + 1 === questions.length} onClick={() => setCurrent(current + 1)}>
            Next
          </Button>
          <Button
            size="sm"
            variant={marked[current] ? 'primary' : 'secondary'}
            onClick={() => setMarked((prev) => prev.map((m, i) => (i === current ? !m : m)))}
          >
            <Flag size={13} aria-hidden="true" />
            {marked[current] ? 'Marked' : 'Mark for review'}
          </Button>
          <Button size="sm" variant="ghost" disabled={answers[current] === null} onClick={() => setAnswer(null)}>
            Clear answer
          </Button>
        </div>
      </Card>

      <Card className="p-4">
        <p className="mono-label">Question palette</p>
        <div className="mt-3 grid grid-cols-6 gap-1.5 lg:grid-cols-5">
          {questions.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              aria-label={`Question ${i + 1}${answers[i] !== null ? ', answered' : ', unanswered'}${marked[i] ? ', marked for review' : ''}`}
              aria-current={i === current ? 'true' : undefined}
              className={cn(
                'h-8 rounded border font-mono text-xs',
                answers[i] !== null ? 'border-accent bg-accent text-on-accent' : 'border-line',
                marked[i] && 'border-2 border-warning',
                i === current && 'ring-2 ring-accent ring-offset-1 ring-offset-surface',
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <ul className="mt-4 space-y-1 text-xs text-muted">
          <li className="flex items-center gap-2">
            <span className="h-3 w-3 rounded border border-accent bg-accent" aria-hidden="true" /> Answered
          </li>
          <li className="flex items-center gap-2">
            <span className="h-3 w-3 rounded border-2 border-warning" aria-hidden="true" /> Marked
          </li>
          <li className="flex items-center gap-2">
            <span className="h-3 w-3 rounded border border-line" aria-hidden="true" /> Unanswered
          </li>
          <li className="flex items-center gap-2">
            <span className="h-3 w-3 rounded ring-2 ring-accent" aria-hidden="true" /> Current
          </li>
        </ul>
        <Button variant="primary" className="mt-4 w-full" onClick={() => setConfirming(true)}>
          Submit exam
        </Button>
      </Card>

      <Dialog open={confirming} onClose={() => setConfirming(false)} title="Submit exam?" size="sm">
        <div className="p-4 text-sm">
          <p>
            You answered {answeredCount} of {questions.length} questions. You cannot change answers after submitting.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button size="sm" onClick={() => setConfirming(false)}>
              Keep working
            </Button>
            <Button size="sm" variant="primary" onClick={submit}>
              Submit
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
