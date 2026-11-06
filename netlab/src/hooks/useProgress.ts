'use client';

import { useCallback, useMemo } from 'react';
import { chapters, getChapter } from '@/content/chapters';
import { useAuth } from '@/context/AuthProvider';
import type { Bookmark, ChapterStatus, MockResult, ProgressState } from '@/lib/types';
import { toISODate, uid } from '@/lib/utils';
import { useLocalStorage } from './useLocalStorage';

export const emptyProgress: ProgressState = {
  completedChapters: [],
  lastVisited: {},
  quizResults: {},
  mockHistory: [],
  flashcards: {},
  bookmarks: [],
  notes: {},
  checklist: {},
  studyDays: [],
  activity: [],
};

function computeStreak(days: string[]): number {
  const set = new Set(days);
  const d = new Date();
  if (!set.has(toISODate(d))) d.setDate(d.getDate() - 1);
  let streak = 0;
  while (set.has(toISODate(d))) {
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function useProgress() {
  const { user } = useAuth();
  const key = user ? `netlab-progress:${user.id}` : null;
  const [raw, setRaw, storageReady] = useLocalStorage<ProgressState>(key, emptyProgress);
  const state = useMemo<ProgressState>(() => ({ ...emptyProgress, ...raw }), [raw]);
  const ready = Boolean(user) && storageReady;

  const update = useCallback(
    (fn: (s: ProgressState) => ProgressState) => {
      setRaw((prev) => {
        const base = { ...emptyProgress, ...prev };
        const next = fn(base);
        return next === base ? prev : next;
      });
    },
    [setRaw],
  );

  const addActivity = useCallback(
    (label: string, href?: string) => {
      update((s) => {
        if (s.activity[0]?.label === label) return s;
        const item = { id: uid(), label, href, at: new Date().toISOString() };
        return { ...s, activity: [item, ...s.activity].slice(0, 20) };
      });
    },
    [update],
  );

  const markComplete = useCallback(
    (slug: string) => {
      update((s) =>
        s.completedChapters.includes(slug) ? s : { ...s, completedChapters: [...s.completedChapters, slug] },
      );
    },
    [update],
  );

  const unmarkComplete = useCallback(
    (slug: string) => {
      update((s) => ({ ...s, completedChapters: s.completedChapters.filter((c) => c !== slug) }));
    },
    [update],
  );

  const setLastVisited = useCallback(
    (slug: string) => {
      update((s) => ({ ...s, lastVisited: { ...s.lastVisited, [slug]: new Date().toISOString() } }));
    },
    [update],
  );

  const saveQuizResult = useCallback(
    (slug: string, percent: number, wrongTopics: string[]) => {
      update((s) => {
        const prev = s.quizResults[slug];
        return {
          ...s,
          quizResults: {
            ...s.quizResults,
            [slug]: {
              best: Math.max(prev?.best ?? 0, percent),
              last: percent,
              attempts: (prev?.attempts ?? 0) + 1,
              wrongTopics,
              at: new Date().toISOString(),
            },
          },
        };
      });
    },
    [update],
  );

  const saveMock = useCallback(
    (result: MockResult) => {
      update((s) => ({ ...s, mockHistory: [result, ...s.mockHistory].slice(0, 50) }));
    },
    [update],
  );

  const setFlashcard = useCallback(
    (cardKey: string, value: 'known' | 'review') => {
      update((s) => ({ ...s, flashcards: { ...s.flashcards, [cardKey]: value } }));
    },
    [update],
  );

  const toggleBookmark = useCallback(
    (bookmark: Omit<Bookmark, 'at'>) => {
      update((s) => {
        const exists = s.bookmarks.some((b) => b.id === bookmark.id);
        return {
          ...s,
          bookmarks: exists
            ? s.bookmarks.filter((b) => b.id !== bookmark.id)
            : [{ ...bookmark, at: new Date().toISOString() }, ...s.bookmarks],
        };
      });
    },
    [update],
  );

  const saveNote = useCallback(
    (slug: string, text: string) => {
      update((s) => (s.notes[slug] === text ? s : { ...s, notes: { ...s.notes, [slug]: text } }));
    },
    [update],
  );

  const toggleChecklist = useCallback(
    (itemKey: string) => {
      update((s) => ({ ...s, checklist: { ...s.checklist, [itemKey]: !s.checklist[itemKey] } }));
    },
    [update],
  );

  const touchStudyDay = useCallback(() => {
    const today = toISODate();
    update((s) => (s.studyDays.includes(today) ? s : { ...s, studyDays: [...s.studyDays, today] }));
  }, [update]);

  const chapterStatus = useCallback(
    (slug: string): ChapterStatus => {
      if (state.completedChapters.includes(slug)) return 'completed';
      if (state.lastVisited[slug] || state.quizResults[slug]) return 'in-progress';
      return 'not-started';
    },
    [state],
  );

  const chapterPercent = useCallback(
    (slug: string): number => {
      if (state.completedChapters.includes(slug)) return 100;
      let percent = state.lastVisited[slug] ? 15 : 0;
      const quiz = state.quizResults[slug];
      if (quiz) percent += Math.round(quiz.best * 0.5);
      const chapter = getChapter(slug);
      if (chapter && chapter.handsOnChecklist.length > 0) {
        const done = chapter.handsOnChecklist.filter((_, i) => state.checklist[`${slug}:${i}`]).length;
        percent += Math.round((done / chapter.handsOnChecklist.length) * 30);
      }
      return Math.min(95, percent);
    },
    [state],
  );

  const isBookmarked = useCallback((id: string) => state.bookmarks.some((b) => b.id === id), [state.bookmarks]);

  const derived = useMemo(() => {
    const scores = Object.values(state.quizResults).map((r) => r.best);
    const counts = new Map<string, number>();
    const tally = (topics: string[]) => {
      for (const t of topics) counts.set(t, (counts.get(t) ?? 0) + 1);
    };
    Object.values(state.quizResults).forEach((r) => tally(r.wrongTopics));
    state.mockHistory.forEach((m) => tally(m.wrongTopics));
    const visited = Object.entries(state.lastVisited).sort((a, b) => b[1].localeCompare(a[1]));
    return {
      overallPercent: Math.round((state.completedChapters.length / Math.max(1, chapters.length)) * 100),
      averageScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      streak: computeStreak(state.studyDays),
      weakTopics: Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([topic, count]) => ({ topic, count })),
      continueSlug: visited[0]?.[0] ?? null,
    };
  }, [state]);

  return {
    state,
    ready,
    markComplete,
    unmarkComplete,
    setLastVisited,
    saveQuizResult,
    saveMock,
    setFlashcard,
    toggleBookmark,
    saveNote,
    toggleChecklist,
    touchStudyDay,
    addActivity,
    chapterStatus,
    chapterPercent,
    isBookmarked,
    ...derived,
  };
}
