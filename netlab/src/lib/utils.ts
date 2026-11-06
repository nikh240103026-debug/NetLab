export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function toISODate(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function chapterCode(n: number): string {
  return `CH-${pad2(n)}`;
}

export function chapterLabel(c: { number: number; shortTitle: string }): string {
  return `${chapterCode(c.number)} / ${c.shortTitle.toUpperCase()}`;
}

export function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
  return (first + last).toUpperCase();
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  return `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`;
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  return `${days} d ago`;
}

export function parseTerm(raw: string): { term: string; definition: string } {
  const i = raw.indexOf(': ');
  if (i === -1) return { term: raw, definition: '' };
  return { term: raw.slice(0, i), definition: raw.slice(i + 2) };
}

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

export function createRateLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return {
    check(key: string): { allowed: boolean; retryAfterSec: number } {
      const now = Date.now();
      if (hits.size > 5000) {
        hits.forEach((value, k) => {
          if (value.resetAt <= now) hits.delete(k);
        });
      }
      const entry = hits.get(key);
      if (!entry || entry.resetAt <= now) {
        hits.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, retryAfterSec: 0 };
      }
      entry.count += 1;
      if (entry.count > limit) {
        return { allowed: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
      }
      return { allowed: true, retryAfterSec: 0 };
    },
    reset(key: string): void {
      hits.delete(key);
    },
  };
}

export type RegistrationFields = { name?: string; email?: string; password?: string };

export function validateEmail(email: string): string | undefined {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? undefined : 'Enter a valid email address';
}

export function validateRegistration(input: {
  name: string;
  email: string;
  password: string;
}): RegistrationFields {
  const fields: RegistrationFields = {};
  const name = input.name.trim();
  if (name.length < 2 || name.length > 60) fields.name = 'Name must be 2 to 60 characters';
  const emailError = validateEmail(input.email.trim());
  if (emailError) fields.email = emailError;
  if (input.password.length < 8 || !/[A-Za-z]/.test(input.password) || !/\d/.test(input.password)) {
    fields.password = 'Use at least 8 characters with a letter and a number';
  }
  return fields;
}
