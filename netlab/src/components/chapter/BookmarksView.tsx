'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Bookmark as BookmarkIcon, Pencil } from 'lucide-react';
import Tabs from '@/components/ui/Tabs';
import { Badge, Card, EmptyState, HeaderBand, IconButton, Skeleton } from '@/components/ui/primitives';
import { chapters } from '@/content/chapters';
import { useProgress } from '@/hooks/useProgress';
import { chapterLabel, timeAgo } from '@/lib/utils';

const TABS = [
  { id: 'bookmarks', label: 'Bookmarks' },
  { id: 'notes', label: 'My Notes' },
];

export default function BookmarksView() {
  const { state, ready, toggleBookmark } = useProgress();
  const [tab, setTab] = useState('bookmarks');

  const noteEntries = chapters
    .map((c) => ({ chapter: c, text: (state.notes[c.slug] ?? '').trim() }))
    .filter((n) => n.text.length > 0);

  return (
    <div>
      <HeaderBand label="SAVED / PERSONAL" title="Bookmarks and notes" subtitle="Everything you saved, grouped by chapter." />
      <Tabs items={TABS} value={tab} onChange={setTab} label="Saved items" className="mt-4" />
      <div className="mt-5">
        {!ready ? (
          <Skeleton className="h-48" />
        ) : tab === 'bookmarks' ? (
          state.bookmarks.length === 0 ? (
            <EmptyState
              title="No bookmarks yet"
              description="Use the bookmark icon on any chapter, section or important question to save it here."
              action={
                <Link href="/chapters" className="text-sm font-medium text-accent underline">
                  Browse chapters
                </Link>
              }
            />
          ) : (
            <div className="space-y-6">
              {chapters
                .filter((c) => state.bookmarks.some((b) => b.slug === c.slug))
                .map((c) => (
                  <section key={c.slug}>
                    <p className="mono-label">{chapterLabel(c)}</p>
                    <ul className="mt-2 space-y-2">
                      {state.bookmarks
                        .filter((b) => b.slug === c.slug)
                        .map((b) => (
                          <li key={b.id}>
                            <Card className="flex items-center gap-3 px-3 py-2">
                              <Badge>{b.kind}</Badge>
                              <Link href={b.href} className="min-w-0 flex-1 truncate text-sm hover:text-accent">
                                {b.title}
                              </Link>
                              <span className="hidden text-xs text-muted sm:inline">{timeAgo(b.at)}</span>
                              <IconButton
                                label={`Remove bookmark for ${b.title}`}
                                active
                                onClick={() =>
                                  toggleBookmark({ id: b.id, kind: b.kind, slug: b.slug, title: b.title, href: b.href })
                                }
                              >
                                <BookmarkIcon size={15} fill="currentColor" />
                              </IconButton>
                            </Card>
                          </li>
                        ))}
                    </ul>
                  </section>
                ))}
            </div>
          )
        ) : noteEntries.length === 0 ? (
          <EmptyState
            title="No notes yet"
            description="Open a chapter and use the My notes panel at the end of the Notes tab."
          />
        ) : (
          <ul className="space-y-3">
            {noteEntries.map(({ chapter, text }) => (
              <li key={chapter.slug}>
                <Card className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="mono-label">{chapterLabel(chapter)}</span>
                    <Link
                      href={`/chapters/${chapter.slug}#notes`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-accent underline"
                    >
                      <Pencil size={12} aria-hidden="true" /> Edit
                    </Link>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted">
                    {text.length > 220 ? `${text.slice(0, 220)}...` : text}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
