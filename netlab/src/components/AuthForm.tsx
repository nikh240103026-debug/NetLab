'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { cn, validateEmail, validateRegistration, type RegistrationFields } from '@/lib/utils';
import { Button } from '@/components/ui/primitives';

function safeNext(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return '/';
  return value;
}

const inputClass =
  'mt-1 h-10 w-full rounded border bg-surface px-3 text-sm text-ink placeholder:text-muted focus:border-accent';

export default function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const params = useSearchParams();
  const next = safeNext(params.get('next'));
  const isRegister = mode === 'register';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fields, setFields] = useState<RegistrationFields>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    const local: RegistrationFields = isRegister
      ? validateRegistration({ name, email, password })
      : {
          email: validateEmail(email.trim()),
          password: password ? undefined : 'Enter your password',
        };
    if (local.name || local.email || local.password) {
      setFields(local);
      return;
    }
    setFields({});
    setBusy(true);

    try {
      const res = await fetch(isRegister ? '/api/auth/register' : '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isRegister ? { name, email, password } : { email, password }),
      });
      if (res.ok) {
        window.location.assign(next);
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string; fields?: RegistrationFields };
      if (data.fields) setFields(data.fields);
      setFormError(data.error ?? 'Something went wrong. Try again.');
    } catch {
      setFormError('Could not reach the server. Check your connection and try again.');
    }
    setBusy(false);
  }

  const switchHref = `${isRegister ? '/login' : '/register'}${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`;

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-md border border-line bg-surface p-6">
      <h1 className="text-lg font-semibold">{isRegister ? 'Create your account' : 'Log in to NetLab'}</h1>

      {formError && (
        <p role="alert" className="mt-3 rounded border border-danger bg-danger-soft px-3 py-2 text-sm text-danger-ink">
          {formError}
        </p>
      )}

      <div className="mt-4 space-y-4">
        {isRegister && (
          <div>
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              aria-invalid={Boolean(fields.name)}
              aria-describedby={fields.name ? 'name-error' : undefined}
              className={cn(inputClass, fields.name ? 'border-danger' : 'border-line')}
            />
            {fields.name && (
              <p id="name-error" className="mt-1 text-xs text-danger-ink">
                {fields.name}
              </p>
            )}
          </div>
        )}

        <div>
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            aria-invalid={Boolean(fields.email)}
            aria-describedby={fields.email ? 'email-error' : undefined}
            className={cn(inputClass, fields.email ? 'border-danger' : 'border-line')}
          />
          {fields.email && (
            <p id="email-error" className="mt-1 text-xs text-danger-ink">
              {fields.email}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              aria-invalid={Boolean(fields.password)}
              aria-describedby={fields.password ? 'password-error' : undefined}
              className={cn(inputClass, 'pr-10', fields.password ? 'border-danger' : 'border-line')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded text-muted hover:text-ink"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {fields.password && (
            <p id="password-error" className="mt-1 text-xs text-danger-ink">
              {fields.password}
            </p>
          )}
        </div>
      </div>

      <Button type="submit" variant="primary" disabled={busy} className="mt-6 w-full">
        {busy && <Loader2 size={16} className="animate-spin" />}
        {isRegister ? 'Create account' : 'Log in'}
      </Button>

      <p className="mt-4 text-center text-sm text-muted">
        {isRegister ? 'Already have an account?' : 'New to NetLab?'}{' '}
        <Link href={switchHref} className="font-medium text-accent underline">
          {isRegister ? 'Log in' : 'Create an account'}
        </Link>
      </p>
    </form>
  );
}
