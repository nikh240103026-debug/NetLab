import Link from 'next/link';
import { EmptyState } from '@/components/ui/primitives';

export default function NotFound() {
  return (
    <EmptyState
      title="404: destination unreachable"
      description="This page does not exist or has moved."
      action={
        <Link href="/" className="text-sm font-medium text-accent underline">
          Back to the dashboard
        </Link>
      }
    />
  );
}
