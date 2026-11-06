import type { Metadata } from 'next';
import { Suspense } from 'react';
import AuthForm from '@/components/AuthForm';
import { Skeleton } from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Create account' };

export default function RegisterPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <AuthForm mode="register" />
    </Suspense>
  );
}
