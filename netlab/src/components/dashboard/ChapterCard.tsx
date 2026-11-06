'use client';

import Link from 'next/link';
import { Clock } from 'lucide-react';
import { ProgressBar, StatusBadge } from '@/components/ui/primitives';
import type { Chapter, ChapterStatus } from '@/lib/types';
import { chapterLabel } from '@/lib/utils';

export default function ChapterCard({
  chapter,
  status,
  percent,
}: {
  chapter: Chapter;
  status: ChapterStatus;
  percent: number;
}) {
  return (
    <Link
      href={`/chapters/${chapter.slug}`}
      className="flex flex-col rounded-md border border-line bg-surface p-4 transition-colors hover:border-accent"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="mono-label">{chapterLabel(chapter)}</span>
        <StatusBadge status={status} />
      </div>
      <h2 className="mt-2 font-semibold leading-snug">{chapter.title}</h2>
      <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted">{chapter.summary}</p>
      <div className="mt-3">
        <ProgressBar value={percent} label={`${chapter.title} progress`} />
        <div className="mt-1.5 flex items-center justify-between font-mono text-[11px] text-muted">
          <span>{percent}%</span>
          <span className="inline-flex items-center gap-1">
            <Clock size={11} aria-hidden="true" /> {chapter.estMinutes} min
          </span>
        </div>
      </div>
    </Link>
  );
}
