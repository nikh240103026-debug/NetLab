import { NextResponse } from 'next/server';
import {
  SESSION_COOKIE,
  burnPasswordCheck,
  hasAuthSecret,
  missingSecretResponse,
  sessionCookieOptions,
  signSession,
  toPublicUser,
  verifyPassword,
} from '@/lib/auth';
import { userStore } from '@/lib/userStore';
import { createRateLimiter } from '@/lib/utils';

export const runtime = 'nodejs';

const limiter = createRateLimiter(10, 10 * 60 * 1000);
const INVALID = 'Invalid email or password';

function clientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'local';
}

export async function POST(req: Request) {
  if (!hasAuthSecret()) return missingSecretResponse();

  let body: { email?: unknown; password?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const limitKey = `${clientIp(req)}|${email}`;

  const limit = limiter.check(limitKey);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again in a few minutes.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } },
    );
  }

  if (!email || !password) return NextResponse.json({ error: INVALID }, { status: 401 });

  try {
    const user = await userStore.findByEmail(email);
    if (!user) {
      await burnPasswordCheck(password);
      return NextResponse.json({ error: INVALID }, { status: 401 });
    }
    if (!(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: INVALID }, { status: 401 });
    }
    limiter.reset(limitKey);
    const res = NextResponse.json({ user: toPublicUser(user) });
    res.cookies.set(SESSION_COOKIE, await signSession(user.id), sessionCookieOptions());
    return res;
  } catch {
    return NextResponse.json({ error: 'Could not log in. Try again.' }, { status: 500 });
  }
}
