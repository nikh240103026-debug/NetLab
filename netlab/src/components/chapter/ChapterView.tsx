'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Bookmark,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileText,
  FlaskConical,
  GitBranch,
  MessageCircleQuestion,
  PlayCircle,
} from 'lucide-react';
import VideoSlot from '@/components/VideoSlot';
import QuizRunner from '@/components/quiz/QuizRunner';
import Tabs, { type TabItem } from '@/components/ui/Tabs';
import { Button, Card, Chip, EmptyState, HeaderBand, IconButton, StatusBadge } from '@/components/ui/primitives';
import { getChapter } from '@/content/chapters';
import { useProgress } from '@/hooks/useProgress';
import type { Block, Chapter, DiagramBlock, DiagramKind } from '@/lib/types';
import { chapterLabel, cn, parseTerm } from '@/lib/utils';
import BlockRenderer from './BlockRenderer';
import DiagramFrame from './DiagramFrame';
import NotesView from './NotesView';
import ReadingProgress from './ReadingProgress';

const TABS: TabItem[] = [
  { id: 'notes', label: 'Notes', icon: <FileText size={14} aria-hidden="true" /> },
  { id: 'diagrams', label: 'Diagrams', icon: <GitBranch size={14} aria-hidden="true" /> },
  { id: 'video', label: 'Video', icon: <PlayCircle size={14} aria-hidden="true" /> },
  { id: 'practical', label: 'Practical', icon: <FlaskConical size={14} aria-hidden="true" /> },
  { id: 'quiz', label: 'Quiz', icon: <ClipboardCheck size={14} aria-hidden="true" /> },
  { id: 'ask', label: 'Ask AI', icon: <MessageCircleQuestion size={14} aria-hidden="true" /> },
];

const TAB_IDS = new Set(TABS.map((t) => t.id));

const KIND_FILTERS: { id: 'all' | DiagramKind; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'block', label: 'Block' },
  { id: 'flowchart', label: 'Flowchart' },
  { id: 'working-diagram', label: 'Working' },
  { id: 'working-flowchart', label: 'Workflow' },
];

const PRACTICAL_TYPES = new Set<Block['type']>(['command-lab', 'mini-lab', 'wireshark', 'case-study', 'troubleshoot']);

function DiagramsTab({ chapter }: { chapter: Chapter }) {
  const [kind, setKind] = useState<'all' | DiagramKind>('all');
  const diagrams = useMemo(
    () =>
      chapter.sections.flatMap((s) => s.blocks.filter((b): b is DiagramBlock => b.type === 'diagram')),
    [chapter],
  );
  const shown = diagrams.filter((d) => kind === 'all' || d.kind === kind);
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {KIND_FILTERS.map((f) => (
          <Chip key={f.id} active={kind === f.id} onClick={() => setKind(f.id)}>
            {f.label}
          </Chip>
        ))}
      </div>
      {shown.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="No diagrams of this kind" description="Pick another filter to see more." />
        </div>
      ) : (
        shown.map((d) => <DiagramFrame key={d.id} diagram={d} />)
      )}
    </div>
  );
}

function VideoTab({ chapter }: { chapter: Chapter }) {
  const sectionVideos = chapter.sections.filter((s) => s.videoId);
  return (
    <div>
      <VideoSlot videoId={chapter.overviewVideoId} />
      <h2 className="mb-3 mt-8 text-sm font-semibold">Topic videos</h2>
      <div className="grid gap-6 md:grid-cols-2">
        {sectionVideos.map((s) => (
          <div key={s.id}>
            <p className="mb-2 text-sm font-medium">{s.title}</p>
            <VideoSlot videoId={s.videoId as string} />
          </div>
        ))}
      </div>
    </div>
  );
}

function PracticalTab({ chapter }: { chapter: Chapter }) {
  const { state, toggleChecklist } = useProgress();
  const blocks = useMemo(
    () => chapter.sections.flatMap((s) => s.blocks.filter((b) => PRACTICAL_TYPES.has(b.type))),
    [chapter],
  );
  return (
    <div>
      <Card className="p-4">
        <p className="mono-label">Hands-on checklist</p>
        <ul className="mt-3 space-y-2">
          {chapter.handsOnChecklist.map((task, i) => {
            const key = `${chapter.slug}:${i}`;
            const id = `check-${chapter.slug}-${i}`;
            return (
              <li key={key} className="flex items-start gap-2.5 text-sm">
                <input
                  id={id}
                  type="checkbox"
                  checked={Boolean(state.checklist[key])}
                  onChange={() => toggleChecklist(key)}
                  className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
                />
                <label htmlFor={id} className={cn(state.checklist[key] && 'text-muted line-through')}>
                  {task}
                </label>
              </li>
            );
          })}
        </ul>
      </Card>
      {blocks.map((b, i) => (
        <BlockRenderer key={i} block={b} />
      ))}
    </div>
  );
}

function AskTab({ chapter }: { chapter: Chapter }) {
  const suggestions = useMemo(() => {
    const firstTerm = chapter.keyTerms[0] ? parseTerm(chapter.keyTerms[0]).term : chapter.title;
    const topic = chapter.sections[1]?.title ?? chapter.title;
    return [
      `Explain ${firstTerm} with a real-world example`,
      `How is "${topic}" implemented in a real network?`,
      chapter.importantQuestions[0]?.q ?? `Give me a 5 mark exam answer on ${chapter.title}`,
    ];
  }, [chapter]);
  return (
    <Card className="p-5">
      <h2 className="font-semibold">Ask the AI tutor about this chapter</h2>
      <p className="mt-1 text-sm text-muted">It already knows the sections and key terms of {chapter.title}.</p>
      <ul className="mt-4 space-y-2">
        {suggestions.map((q) => (
          <li key={q}>
            <Link
              href={`/doubt?chapter=${chapter.slug}&q=${encodeURIComponent(q)}`}
              className="block rounded border border-line px-3 py-2 text-sm hover:border-accent"
            >
              {q}
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href={`/doubt?chapter=${chapter.slug}`}
        className="mt-4 inline-flex h-10 items-center gap-2 rounded border border-accent bg-accent px-4 text-sm font-medium text-on-accent hover:opacity-90"
      >
        <MessageCircleQuestion size={16} aria-hidden="true" />
        Open the doubt solver
      </Link>
    </Card>
  );
}

function ChapterBody({ chapter }: { chapter: Chapter }) {
  const {
    ready,
    chapterStatus,
    markComplete,
    unmarkComplete,
    isBookmarked,
    toggleBookmark,
    touchStudyDay,
    setLastVisited,
    addActivity,
  } = useProgress();
  const [tab, setTab] = useState('notes');
  const { slug, title } = chapter;

  useEffect(() => {
    const apply = () => {
      const hash = decodeURIComponent(window.location.hash.slice(1));
      if (!hash) return;
      if (TAB_IDS.has(hash)) {
        setTab(hash);
        return;
      }
      setTab('notes');
      window.requestAnimationFrame(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    };
    apply();
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, []);

  useEffect(() => {
    if (!ready) return;
    touchStudyDay();
    setLastVisited(slug);
    addActivity(`Studied ${title}`, `/chapters/${slug}`);
  }, [ready, slug, title, touchStudyDay, setLastVisited, addActivity]);

  function selectTab(id: string) {
    setTab(id);
    window.history.replaceState(null, '', `#${id}`);
  }

  const status = ready ? chapterStatus(slug) : 'not-started';
  const completed = status === 'completed';
  const bookmarkId = `chapter:${slug}`;
  const marked = isBookmarked(bookmarkId);

  return (
    <div>
      {tab === 'notes' && <ReadingProgress />}
      <HeaderBand
        label={chapterLabel(chapter)}
        title={title}
        subtitle={
          <>
            <p>{chapter.summary}</p>
            <p className="mt-2 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1 font-mono text-xs">
                <Clock size={12} aria-hidden="true" /> {chapter.estMinutes} min
              </span>
              <StatusBadge status={status} />
            </p>
          </>
        }
        actions={
          <>
            <IconButton
              label={marked ? 'Remove chapter bookmark' : 'Bookmark chapter'}
              active={marked}
              onClick={() =>
                toggleBookmark({ id: bookmarkId, kind: 'chapter', slug, title, href: `/chapters/${slug}` })
              }
            >
              <Bookmark size={16} fill={marked ? 'currentColor' : 'none'} />
            </IconButton>
            <Button
              variant={completed ? 'secondary' : 'primary'}
              size="sm"
              disabled={!ready}
              onClick={() => {
                if (completed) {
                  unmarkComplete(slug);
                } else {
                  markComplete(slug);
                  addActivity(`Completed ${title}`, `/chapters/${slug}`);
                }
              }}
            >
              <CheckCircle2 size={14} aria-hidden="true" />
              {completed ? 'Completed' : 'Mark chapter complete'}
            </Button>
          </>
        }
      />

      <div className="sticky top-14 z-20 mt-4 bg-bg">
        <Tabs items={TABS} value={tab} onChange={selectTab} label="Chapter views" />
      </div>

      <div className="mt-6">
        <div className={cn(tab === 'notes' ? 'block' : 'hidden print:block')}>
          <NotesView chapter={chapter} />
        </div>
        {tab === 'diagrams' && (
          <div className="no-print">
            <DiagramsTab chapter={chapter} />
          </div>
        )}
        {tab === 'video' && (
          <div className="no-print">
            <VideoTab chapter={chapter} />
          </div>
        )}
        {tab === 'practical' && (
          <div className="no-print">
            <PracticalTab chapter={chapter} />
          </div>
        )}
        {tab === 'quiz' && (
          <div className="no-print">
            <QuizRunner chapter={chapter} />
          </div>
        )}
        {tab === 'ask' && (
          <div className="no-print">
            <AskTab chapter={chapter} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChapterView({ slug }: { slug: string }) {
  const chapter = getChapter(slug);
  if (!chapter) return null;
  return <ChapterBody chapter={chapter} />;
}
