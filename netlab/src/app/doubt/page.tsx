import type { Metadata } from 'next';
import { Suspense } from 'react';
import DoubtClient from '@/components/doubt/DoubtClient';
import { Skeleton } from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Ask AI' };

export default function DoubtPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <DoubtClient />
    </Suspense>
  );
}
