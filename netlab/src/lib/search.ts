import { chapters } from '@/content/chapters';
import { chapterCode, parseTerm } from './utils';

export type SearchGroup = 'Chapter' | 'Section' | 'Term';

export type SearchResult = {
  id: string;
  group: SearchGroup;
  title: string;
  hint: string;
  href: string;
  score: number;
};

type Entry = Omit<SearchResult, 'score'> & { lowerTitle: string; weight: number };

export const SEARCH_GROUPS: SearchGroup[] = ['Chapter', 'Section', 'Term'];

let cached: Entry[] | null = null;

function entries(): Entry[] {
  if (cached) return cached;
  const list: Entry[] = [];
  const add = (group: SearchGroup, id: string, title: string, hint: string, href: string, weight: number) => {
    list.push({ id, group, title, hint, href, weight, lowerTitle: title.toLowerCase() });
  };
  for (const c of chapters) {
    const code = chapterCode(c.number);
    add('Chapter', `chapter:${c.slug}`, c.title, code, `/chapters/${c.slug}`, 8);
    c.sections.forEach((s, i) => {
      add('Section', `section:${c.slug}:${s.id}`, s.title, `${c.number}.${i + 1} in ${code}`, `/chapters/${c.slug}#${s.id}`, 5);
    });
    c.keyTerms.forEach((raw, i) => {
      const { term } = parseTerm(raw);
      add('Term', `term:${c.slug}:${i}`, term, `Key term, ${code}`, `/chapters/${c.slug}#notes`, 3);
    });
    c.flashcards.forEach((card, i) => {
      add('Term', `card:${c.slug}:${i}`, card.front, `Flashcard, ${code}`, '/practice?view=flashcards', 1);
    });
  }
  cached = list;
  return list;
}

export function search(query: string, perGroup = 6): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const tokens = q.split(/\s+/);
  const scored: SearchResult[] = [];
  for (const e of entries()) {
    if (!tokens.every((t) => e.lowerTitle.includes(t))) continue;
    let score = e.weight;
    if (e.lowerTitle === q) score += 6;
    else if (e.lowerTitle.startsWith(q)) score += 4;
    else if (e.lowerTitle.includes(q)) score += 2;
    scored.push({ id: e.id, group: e.group, title: e.title, hint: e.hint, href: e.href, score });
  }
  scored.sort((a, b) => b.score - a.score);
  const out: SearchResult[] = [];
  for (const group of SEARCH_GROUPS) {
    out.push(...scored.filter((r) => r.group === group).slice(0, perGroup));
  }
  return out;
}
