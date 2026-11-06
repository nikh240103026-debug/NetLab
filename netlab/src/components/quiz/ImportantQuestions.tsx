'use client';

import { useState } from 'react';
import { Bookmark, ChevronDown } from 'lucide-react';
import { Badge, Card, Chip, EmptyState, IconButton } from '@/components/ui/primitives';
import { chapters } from '@/content/chapters';
import { useProgress } from '@/hooks/useProgress';
import { chapterCode, chapterLabel, cn } from '@/lib/utils';

const MARK_FILTERS = [0, 2, 5, 10];

export default function ImportantQuestions() {
  const { isBookmarked, toggleBookmark } = useProgress();
  const [scope, setScope] = useState('all');
  const [marks, setMarks] = useState(0);
  const [open, setOpen] = useState<string | null>(null);

  const groups = chapters
    .filter((c) => scope === 'all' || c.slug === scope)
    .map((c) => ({
      chapter: c,
      questions: c.importantQuestions
        .map((q, index) => ({ ...q, index }))
        .filter((q) => marks === 0 || q.marks === marks),
    }))
    .filter((g) => g.questions.length > 0);

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
        <div className="flex gap-1.5">
          {MARK_FILTERS.map((m) => (
            <Chip key={m} active={marks === m} onClick={() => setMarks(m)}>
              {m === 0 ? 'All marks' : `${m} marks`}
            </Chip>
          ))}
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="mt-5">
          <EmptyState title="No questions match" description="Try a different chapter or marks filter." />
        </div>
      ) : (
        <div className="mt-5 space-y-6">
          {groups.map(({ chapter, questions }) => (
            <section key={chapter.slug}>
              <p className="mono-label">{chapterLabel(chapter)}</p>
              <ul className="mt-2 space-y-2">
                {questions.map((q) => {
                  const key = `${chapter.slug}:${q.index}`;
                  const bookmarkId = `question:${key}`;
                  const marked = isBookmarked(bookmarkId);
                  const isOpen = open === key;
                  return (
                    <li key={key}>
                      <Card>
                        <div className="flex items-start gap-2 p-2">
                          <button
                            type="button"
                            onClick={() => setOpen(isOpen ? null : key)}
                            aria-expanded={isOpen}
                            className="flex min-w-0 flex-1 items-start gap-2 rounded p-1.5 text-left text-sm"
                          >
                            <Badge tone="accent" className="mt-0.5 shrink-0">
                              {q.marks} M
                            </Badge>
                            <span className="min-w-0 flex-1 font-medium">{q.q}</span>
                            <ChevronDown
                              size={16}
                              className={cn('mt-0.5 shrink-0 text-muted transition-transform', isOpen && 'rotate-180')}
                              aria-hidden="true"
                            />
                          </button>
                          <IconButton
                            label={marked ? 'Remove bookmark for this question' : 'Bookmark this question'}
                            active={marked}
                            onClick={() =>
                              toggleBookmark({
                                id: bookmarkId,
                                kind: 'question',
                                slug: chapter.slug,
                                title: q.q,
                                href: '/practice?view=questions',
                              })
                            }
                          >
                            <Bookmark size={15} fill={marked ? 'currentColor' : 'none'} />
                          </IconButton>
                        </div>
                        {isOpen && (
                          <div className="border-t border-line p-4 text-sm leading-6">
                            <p className="mono-label mb-1">Model answer</p>
                            <p className="whitespace-pre-line">{q.modelAnswer}</p>
                          </div>
                        )}
                      </Card>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
