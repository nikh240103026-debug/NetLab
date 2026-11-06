import type { ReactNode } from 'react';
import { Logo } from '@/components/ui/primitives';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="blueprint flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <Logo />
          <p className="text-sm text-muted">Computer Networks, from theory to how it really runs.</p>
        </div>
        {children}
      </div>
    </div>
  );
}
