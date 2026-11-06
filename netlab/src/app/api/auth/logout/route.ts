import { NextResponse } from 'next/server';
import { SESSION_COOKIE, hasAuthSecret, missingSecretResponse, sessionCookieOptions } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST() {
  if (!hasAuthSecret()) return missingSecretResponse();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 });
  return res;
}
