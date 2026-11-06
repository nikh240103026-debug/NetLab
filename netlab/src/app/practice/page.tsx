import type { Metadata } from 'next';
import { Suspense } from 'react';
import PracticeHub from '@/components/quiz/PracticeHub';
import { Skeleton } from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Practice' };

export default function PracticePage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <PracticeHub />
    </Suspense>
  );
}
