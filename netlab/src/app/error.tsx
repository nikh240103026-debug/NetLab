'use client';

import { Button, EmptyState } from '@/components/ui/primitives';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <EmptyState
      title="Something went wrong on this page"
      description="Your progress is safe in this browser. Try loading the page again."
      action={
        <Button variant="primary" onClick={reset}>
          Try again
        </Button>
      }
    />
  );
}
