'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Bookmark, ChevronDown } from 'lucide-react';
import VideoSlot from '@/components/VideoSlot';
import { Card, IconButton } from '@/components/ui/primitives';
import { chapters } from '@/content/chapters';
import { useProgress } from '@/hooks/useProgress';
import type { Chapter } from '@/lib/types';
import { chapterCode, cn, parseTerm } from '@/lib/utils';
import BlockRenderer from './BlockRenderer';

function PersonalNotes({ slug }: { slug: string }) {
  const { state, ready, saveNote } = useProgress();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [saved, setSaved] = useState(true);
  const loaded = useRef(false);
  const timer = useRef<number>();
  const pending = useRef<string | null>(null);
  const saveRef = useRef(saveNote);
  saveRef.current = saveNote;

  useEffect(() => {
    if (!ready || loaded.current) return;
    loaded.current = true;
    const existing = state.notes[slug] ?? '';
    setText(existing);
    if (existing.trim()) setOpen(true);
  }, [ready, slug, state.notes]);

  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      if (pending.current !== null) saveRef.current(slug, pending.current);
    },
    [slug],
  );

  function onChange(value: string) {
    setText(value);
    setSaved(false);
    pending.current = value;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      saveRef.current(slug, value);
      pending.current = null;
      setSaved(true);
    }, 600);
  }

  return (
    <Card className="no-print mt-8">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium"
      >
        My notes for this chapter
        <ChevronDown size={16} className={cn('text-muted transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>
      {open && (
        <div className="border-t border-line p-4">
          <label htmlFor={`notes-${slug}`} className="sr-only">
            My notes
          </label>
          <textarea
            id={`notes-${slug}`}
            value={text}
            onChange={(e) => onChange(e.target.value)}
            rows={6}
            placeholder="Write your own summary, doubts or exam reminders. Saved automatically."
            className="w-full resize-y rounded border border-line bg-bg p-3 text-sm placeholder:text-muted"
          />
          <p className="mt-1 text-right font-mono text-[11px] text-muted">{saved ? 'Saved' : 'Saving...'}</p>
        </div>
      )}
    </Card>
  );
}

export default function NotesView({ chapter }: { chapter: Chapter }) {
  const { isBookmarked, toggleBookmark } = useProgress();
  const [activeId, setActiveId] = useState(chapter.sections[0]?.id ?? '');
  const index = chapters.findIndex((c) => c.slug === chapter.slug);
  const prev = index > 0 ? chapters[index - 1] : null;
  const next = index >= 0 && index < chapters.length - 1 ? chapters[index + 1] : null;

  useEffect(() => {
    const elements = chapter.sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-120px 0px -65% 0px' },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [chapter]);

  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_210px] xl:gap-8">
      <div className="min-w-0">
        <Card className="mb-6 p-4">
          <p className="mono-label">Learning objectives</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm marker:text-accent">
            {chapter.learningObjectives.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </Card>

        {chapter.sections.map((section, i) => {
          const bookmarkId = `section:${chapter.slug}:${section.id}`;
          const marked = isBookmarked(bookmarkId);
          return (
            <section key={section.id} id={section.id} className="mb-10 scroll-mt-32">
              <div className="flex items-start justify-between gap-2 border-b border-line pb-2">
                <h2 className="text-lg font-semibold">
                  <span className="mr-2 font-mono text-sm text-accent">
                    {chapter.number}.{i + 1}
                  </span>
                  {section.title}
                </h2>
                <IconButton
                  label={marked ? `Remove bookmark for ${section.title}` : `Bookmark ${section.title}`}
                  active={marked}
                  className="no-print"
                  onClick={() =>
                    toggleBookmark({
                      id: bookmarkId,
                      kind: 'section',
                      slug: chapter.slug,
                      title: section.title,
                      href: `/chapters/${chapter.slug}#${section.id}`,
                    })
                  }
                >
                  <Bookmark size={15} fill={marked ? 'currentColor' : 'none'} />
                </IconButton>
              </div>
              {section.blocks.map((block, b) => (
                <BlockRenderer key={b} block={block} />
              ))}
              {section.videoId && <VideoSlot videoId={section.videoId} className="my-5" />}
            </section>
          );
        })}

        <div className="mt-8">
          <p className="mono-label">Key terms</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {chapter.keyTerms.map((raw, i) => {
              const { term, definition } = parseTerm(raw);
              return (
                <span
                  key={i}
                  title={definition || undefined}
                  className="rounded border border-line bg-surface px-2 py-1 font-mono text-xs"
                >
                  {term}
                </span>
              );
            })}
          </div>
        </div>

        <PersonalNotes slug={chapter.slug} />

        <nav aria-label="Chapter navigation" className="no-print mt-8 grid gap-3 sm:grid-cols-2">
          {prev ? (
            <Link href={`/chapters/${prev.slug}`} className="rounded-md border border-line bg-surface p-3 hover:border-accent">
              <span className="mono-label inline-flex items-center gap-1">
                <ArrowLeft size={12} aria-hidden="true" /> {chapterCode(prev.number)}
              </span>
              <span className="mt-1 block text-sm font-medium">{prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link href={`/chapters/${next.slug}`} className="rounded-md border border-line bg-surface p-3 text-right hover:border-accent">
              <span className="mono-label inline-flex items-center gap-1">
                {chapterCode(next.number)} <ArrowRight size={12} aria-hidden="true" />
              </span>
              <span className="mt-1 block text-sm font-medium">{next.title}</span>
            </Link>
          )}
        </nav>
      </div>

      <aside className="no-print hidden xl:block">
        <nav aria-label="On this page" className="sticky top-32 max-h-[calc(100vh-9rem)] overflow-y-auto">
          <p className="mono-label mb-2">On this page</p>
          <ul className="space-y-1 border-l border-line">
            {chapter.sections.map((section, i) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  aria-current={activeId === section.id ? 'location' : undefined}
                  className={cn(
                    '-ml-px block border-l-2 py-1 pl-3 text-xs leading-5',
                    activeId === section.id ? 'border-accent font-medium text-accent' : 'border-transparent text-muted hover:text-ink',
                  )}
                >
                  {chapter.number}.{i + 1} {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </div>
  );
}
