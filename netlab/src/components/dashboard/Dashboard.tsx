'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { Card, EmptyState, HeaderBand, ProgressRing, Skeleton } from '@/components/ui/primitives';
import { chapters, getChapter } from '@/content/chapters';
import { useAuth } from '@/context/AuthProvider';
import { useProgress } from '@/hooks/useProgress';
import { chapterCode, chapterLabel, timeAgo, toISODate } from '@/lib/utils';
import ChapterCard from './ChapterCard';
import { ActivityChart, ScoreChart } from './Charts';

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <Card className="p-4">
      <p className="mono-label">{label}</p>
      <p className="mt-2 font-mono text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted">{note}</p>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const {
    state,
    ready,
    overallPercent,
    averageScore,
    streak,
    weakTopics,
    continueSlug,
    chapterStatus,
    chapterPercent,
  } = useProgress();

  const scoreData = useMemo(
    () => chapters.map((c) => ({ name: chapterCode(c.number), score: state.quizResults[c.slug]?.best ?? 0 })),
    [state.quizResults],
  );

  const activityData = useMemo(() => {
    const days: { name: string; actions: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = toISODate(d);
      const logged = state.activity.filter((a) => toISODate(new Date(a.at)) === iso).length;
      days.push({
        name: `${d.getDate()}/${d.getMonth() + 1}`,
        actions: Math.max(logged, state.studyDays.includes(iso) ? 1 : 0),
      });
    }
    return days;
  }, [state.activity, state.studyDays]);

  const firstName = user?.name.split(' ')[0] ?? '';
  const nextChapter =
    (continueSlug ? getChapter(continueSlug) : undefined) ??
    chapters.find((c) => !state.completedChapters.includes(c.slug)) ??
    chapters[0];

  if (!ready) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <HeaderBand
        label="DASHBOARD"
        title={firstName ? `Hello, ${firstName}` : 'Hello'}
        subtitle="Here is where your Computer Networks preparation stands today."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex items-center gap-4 p-4">
          <ProgressRing value={overallPercent} />
          <div>
            <p className="mono-label">Overall</p>
            <p className="mt-1 text-xs text-muted">Chapters marked complete</p>
          </div>
        </Card>
        <Stat label="Chapters done" value={`${state.completedChapters.length}/${chapters.length}`} note="Marked complete" />
        <Stat label="Average score" value={`${averageScore}%`} note="Best quiz score per chapter" />
        <Stat label="Streak" value={`${streak} ${streak === 1 ? 'day' : 'days'}`} note="Consecutive study days" />
      </div>

      {nextChapter && (
        <Link
          href={`/chapters/${nextChapter.slug}`}
          className="flex items-center justify-between gap-4 rounded-md border border-accent bg-accent-soft p-4"
        >
          <span className="min-w-0">
            <span className="mono-label">{continueSlug ? 'Continue' : 'Start here'} / {chapterLabel(nextChapter)}</span>
            <span className="mt-1 block font-semibold">{nextChapter.title}</span>
          </span>
          <ArrowRight size={18} className="shrink-0 text-accent" aria-hidden="true" />
        </Link>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <p className="mono-label">Best score per chapter</p>
          <div className="mt-3 h-56">
            <ScoreChart data={scoreData} />
          </div>
        </Card>
        <Card className="p-4">
          <p className="mono-label">Study activity, last 14 days</p>
          <div className="mt-3 h-56">
            <ActivityChart data={activityData} />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <p className="mono-label">Weak topics</p>
          {weakTopics.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Take a chapter test and the topics you miss will appear here.</p>
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {weakTopics.map((t) => (
                <li key={t.topic} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="min-w-0 truncate">{t.topic}</span>
                  <span className="font-mono text-xs text-danger-ink">{t.count} wrong</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="p-4">
          <p className="mono-label">Recent activity</p>
          {state.activity.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Your study history will show here once you open a chapter.</p>
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {state.activity.slice(0, 6).map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  {a.href ? (
                    <Link href={a.href} className="min-w-0 truncate hover:text-accent">
                      {a.label}
                    </Link>
                  ) : (
                    <span className="min-w-0 truncate">{a.label}</span>
                  )}
                  <span className="shrink-0 text-xs text-muted">{timeAgo(a.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <section>
        <h2 className="mono-label">All chapters</h2>
        {chapters.length === 0 ? (
          <EmptyState title="No chapters found" />
        ) : (
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {chapters.map((c) => (
              <ChapterCard key={c.slug} chapter={c} status={chapterStatus(c.slug)} percent={chapterPercent(c.slug)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
