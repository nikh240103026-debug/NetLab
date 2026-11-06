import type { Metadata } from 'next';
import { Suspense } from 'react';
import AuthForm from '@/components/AuthForm';
import { Skeleton } from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Log in' };

export default function LoginPage() {
  return (
    <Suspense fallback={<Skeleton className="h-80" />}>
      <AuthForm mode="login" />
    </Suspense>
  );
}
