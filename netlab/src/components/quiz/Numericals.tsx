'use client';

import { useState } from 'react';
import { Button, Card, EmptyState } from '@/components/ui/primitives';
import { chapters } from '@/content/chapters';
import { chapterCode, chapterLabel } from '@/lib/utils';

function NumericalCard({ question, steps, answer }: { question: string; steps: string[]; answer: string }) {
  const [showSteps, setShowSteps] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  return (
    <Card className="p-4">
      <p className="text-sm font-medium leading-6">{question}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" aria-expanded={showSteps} onClick={() => setShowSteps((v) => !v)}>
          {showSteps ? 'Hide steps' : 'Show steps'}
        </Button>
        <Button size="sm" aria-expanded={showAnswer} onClick={() => setShowAnswer((v) => !v)}>
          {showAnswer ? 'Hide answer' : 'Show answer'}
        </Button>
      </div>
      {showSteps && (
        <ol className="mt-3 list-decimal space-y-1 pl-5 font-mono text-[13px] leading-6 marker:text-muted">
          {steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      )}
      {showAnswer && (
        <p className="mt-3 rounded border border-success bg-success-soft px-3 py-2 text-sm">
          <span className="font-medium text-success-ink">Answer: </span>
          <span className="font-mono">{answer}</span>
        </p>
      )}
    </Card>
  );
}

export default function Numericals() {
  const [scope, setScope] = useState('all');
  const groups = chapters
    .filter((c) => scope === 'all' || c.slug === scope)
    .filter((c) => c.numericals.length > 0);

  return (
    <div>
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
      {groups.length === 0 ? (
        <div className="mt-5">
          <EmptyState title="No numericals here" description="This chapter has no calculations. Pick another chapter." />
        </div>
      ) : (
        <div className="mt-5 space-y-6">
          {groups.map((c) => (
            <section key={c.slug}>
              <p className="mono-label">{chapterLabel(c)}</p>
              <div className="mt-2 space-y-3">
                {c.numericals.map((n, i) => (
                  <NumericalCard key={i} question={n.question} steps={n.steps} answer={n.answer} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
