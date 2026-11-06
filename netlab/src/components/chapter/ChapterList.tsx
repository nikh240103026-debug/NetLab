'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import ChapterCard from '@/components/dashboard/ChapterCard';
import { Chip, EmptyState, HeaderBand } from '@/components/ui/primitives';
import { chapters } from '@/content/chapters';
import { useProgress } from '@/hooks/useProgress';
import type { ChapterStatus } from '@/lib/types';
import { chapterCode, cn } from '@/lib/utils';

const STATUS_DOT: Record<ChapterStatus, string> = {
  'not-started': 'bg-line',
  'in-progress': 'bg-accent',
  completed: 'bg-success',
};

export function SidebarChapterList({ pathname }: { pathname: string }) {
  const { ready, chapterStatus } = useProgress();
  return (
    <ul className="space-y-0.5">
      {chapters.map((c) => {
        const href = `/chapters/${c.slug}`;
        const active = pathname === href;
        const status = ready ? chapterStatus(c.slug) : 'not-started';
        return (
          <li key={c.slug}>
            <Link
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-2 rounded px-2.5 py-1.5 text-xs transition-colors',
                active ? 'bg-accent-soft font-medium text-accent' : 'text-muted hover:text-ink',
              )}
            >
              <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', STATUS_DOT[status])} aria-hidden="true" />
              <span className="font-mono text-[10px]">{chapterCode(c.number)}</span>
              <span className="truncate">{c.shortTitle}</span>
              <span className="sr-only">{status.replace('-', ' ')}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

const FILTERS: { id: 'all' | ChapterStatus; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'not-started', label: 'Not started' },
  { id: 'in-progress', label: 'In progress' },
  { id: 'completed', label: 'Completed' },
];

export default function ChapterList() {
  const { ready, chapterStatus, chapterPercent } = useProgress();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | ChapterStatus>('all');

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return chapters.filter((c) => {
      const status = ready ? chapterStatus(c.slug) : 'not-started';
      if (filter !== 'all' && status !== filter) return false;
      if (!q) return true;
      const haystack = [c.title, c.summary, ...c.keyTerms, ...c.sections.map((s) => s.title)].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [query, filter, ready, chapterStatus]);

  return (
    <div>
      <HeaderBand
        label="SYLLABUS / 10 CHAPTERS"
        title="Chapters"
        subtitle="Every chapter goes theory first, then how it is really implemented at home, in the office, at the ISP and in the cloud."
      />
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search chapters"
            placeholder="Search chapters, sections or terms"
            className="h-10 w-full rounded border border-line bg-surface pl-9 pr-3 text-sm placeholder:text-muted"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <Chip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.label}
            </Chip>
          ))}
        </div>
      </div>
      {shown.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No chapters match" description="Try another search term or clear the status filter." />
        </div>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {shown.map((c) => (
            <ChapterCard
              key={c.slug}
              chapter={c}
              status={ready ? chapterStatus(c.slug) : 'not-started'}
              percent={ready ? chapterPercent(c.slug) : 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
