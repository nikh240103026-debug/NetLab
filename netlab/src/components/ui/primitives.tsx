'use client';

import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Check, Copy } from 'lucide-react';
import type { ChapterStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
};

const BUTTON_VARIANTS = {
  primary: 'border-accent bg-accent text-on-accent hover:opacity-90',
  secondary: 'border-line bg-surface text-ink hover:border-accent',
  ghost: 'border-transparent bg-transparent text-muted hover:bg-accent-soft hover:text-ink',
  danger: 'border-danger bg-surface text-danger-ink hover:bg-danger-soft',
};

export function Button({ variant = 'secondary', size = 'md', className, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded border font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'h-8 px-3 text-xs' : 'h-10 px-4 text-sm',
        BUTTON_VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}

export function IconButton({
  label,
  active,
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; active?: boolean }) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={cn(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded border border-transparent transition-colors hover:bg-accent-soft hover:text-ink',
        active ? 'text-accent' : 'text-muted',
        className,
      )}
      {...props}
    />
  );
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2 text-ink">
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path d="M5 5L17 5M5 5L11 17M17 5L11 17" stroke="var(--accent)" strokeWidth="1.5" />
        <circle cx="5" cy="5" r="3" fill="var(--accent)" />
        <circle cx="17" cy="5" r="3" fill="var(--accent)" />
        <circle cx="11" cy="17" r="3" fill="var(--accent)" />
      </svg>
      <span className="font-mono text-sm font-semibold tracking-widest">NETLAB</span>
    </span>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('rounded-md border border-line bg-surface', className)}>{children}</div>;
}

export function MonoLabel({ className, children }: { className?: string; children: ReactNode }) {
  return <span className={cn('mono-label', className)}>{children}</span>;
}

const BADGE_TONES = {
  neutral: 'border-line text-muted',
  accent: 'border-accent bg-accent-soft text-accent',
  success: 'border-success bg-success-soft text-success-ink',
  warning: 'border-warning bg-warning-soft text-warning-ink',
  danger: 'border-danger bg-danger-soft text-danger-ink',
};

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: keyof typeof BADGE_TONES;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide',
        BADGE_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const STATUS_META: Record<ChapterStatus, { label: string; tone: keyof typeof BADGE_TONES }> = {
  'not-started': { label: 'Not started', tone: 'neutral' },
  'in-progress': { label: 'In progress', tone: 'accent' },
  completed: { label: 'Completed', tone: 'success' },
};

export function StatusBadge({ status }: { status: ChapterStatus }) {
  const meta = STATUS_META[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md border border-line bg-accent-soft', className)} aria-hidden="true" />;
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-md border border-dashed border-line px-6 py-10 text-center">
      <p className="font-medium">{title}</p>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? 'Progress'}
      className="h-1.5 w-full overflow-hidden rounded bg-accent-soft"
    >
      <div className="h-full rounded bg-accent" style={{ width: `${clamped}%` }} />
    </div>
  );
}

export function ProgressRing({ value, size = 64 }: { value: number; size?: number }) {
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, value));
  const offset = circumference - (clamped / 100) * circumference;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${clamped} percent`}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--accent-soft)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="butt"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        fill="var(--ink)"
        fontSize={size * 0.24}
        fontFamily="var(--font-mono)"
      >
        {clamped}%
      </text>
    </svg>
  );
}

export function HeaderBand({
  label,
  title,
  subtitle,
  actions,
}: {
  label: string;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="blueprint rounded-md border border-line bg-surface p-5 md:p-6">
      <MonoLabel>{label}</MonoLabel>
      <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold md:text-2xl">{title}</h1>
          {subtitle && <div className="mt-1 max-w-reading text-sm text-muted">{subtitle}</div>}
        </div>
        {actions && <div className="no-print flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export function Chip({
  active,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        'rounded border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide transition-colors',
        active ? 'border-accent bg-accent-soft text-accent' : 'border-line text-muted hover:text-ink',
        className,
      )}
      {...props}
    />
  );
}

export function CopyButton({ text, label = 'Copy', className }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded border border-current opacity-70 transition-opacity hover:opacity-100',
        className,
      )}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}
