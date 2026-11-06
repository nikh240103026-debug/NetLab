import type { Metadata } from 'next';
import ChapterList from '@/components/chapter/ChapterList';

export const metadata: Metadata = { title: 'Chapters' };

export default function ChaptersPage() {
  return <ChapterList />;
}
