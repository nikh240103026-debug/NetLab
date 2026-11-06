import type { Metadata } from 'next';
import BookmarksView from '@/components/chapter/BookmarksView';

export const metadata: Metadata = { title: 'Bookmarks' };

export default function BookmarksPage() {
  return <BookmarksView />;
}
