import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ChapterView from '@/components/chapter/ChapterView';
import { chapters, getChapter } from '@/content/chapters';

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return chapters.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const chapter = getChapter(params.slug);
  if (!chapter) return { title: 'Chapter not found' };
  return { title: chapter.title, description: chapter.summary };
}

export default function ChapterPage({ params }: Props) {
  if (!getChapter(params.slug)) notFound();
  return <ChapterView key={params.slug} slug={params.slug} />;
}
