'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import Tabs from '@/components/ui/Tabs';
import { Badge, Button, Card, HeaderBand } from '@/components/ui/primitives';
import { chapters, getChapter } from '@/content/chapters';
import { useProgress } from '@/hooks/useProgress';
import { chapterCode } from '@/lib/utils';
import Flashcards from './Flashcards';
import FormulaSheet from './FormulaSheet';
import ImportantQuestions from './ImportantQuestions';
import MockExam from './MockExam';
import Numericals from './Numericals';
import QuizRunner from './QuizRunner';

const VIEWS = [
  { id: 'tests', label: 'Chapter tests' },
  { id: 'mock', label: 'Mock exam' },
  { id: 'flashcards', label: 'Flashcards' },
  { id: 'formulas', label: 'Formula sheet' },
  { id: 'questions', label: 'Important questions' },
  { id: 'numericals', label: 'Numericals' },
];

function ChapterTests() {
  const { state } = useProgress();
  const [slug, setSlug] = useState<string | null>(null);
  const active = slug ? getChapter(slug) : undefined;

  if (active) return <QuizRunner key={active.slug} chapter={active} onExit={() => setSlug(null)} />;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {chapters.map((c) => {
        const result = state.quizResults[c.slug];
        return (
          <Card key={c.slug} className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="mono-label">{chapterCode(c.number)}</p>
              <p className="truncate text-sm font-medium">{c.title}</p>
              <p className="mt-1 text-xs text-muted">
                {c.quiz.length} questions
                {result ? ` / best ${result.best}% / ${result.attempts} attempts` : ''}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {result && <Badge tone={result.best >= 70 ? 'success' : 'warning'}>{result.best}%</Badge>}
              <Button size="sm" onClick={() => setSlug(c.slug)}>
                {result ? 'Retake' : 'Start'}
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export default function PracticeHub() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const requested = params.get('view');
  const view = VIEWS.some((v) => v.id === requested) ? (requested as string) : 'tests';

  return (
    <div>
      <div className="no-print">
        <HeaderBand
          label="TEST PREPARATION"
          title="Practice"
          subtitle="Chapter tests, timed mock exams, flashcards, formula revision, important questions and numericals."
        />
      </div>
      <Tabs
        items={VIEWS}
        value={view}
        onChange={(id) => router.replace(`${pathname}?view=${id}`, { scroll: false })}
        label="Practice views"
        className="mt-4"
      />
      <div className="mt-5">
        {view === 'tests' && <ChapterTests />}
        {view === 'mock' && <MockExam />}
        {view === 'flashcards' && <Flashcards />}
        {view === 'formulas' && <FormulaSheet />}
        {view === 'questions' && <ImportantQuestions />}
        {view === 'numericals' && <Numericals />}
      </div>
    </div>
  );
}
