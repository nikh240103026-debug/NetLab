import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  SESSION_COOKIE,
  getSessionUser,
  hasAuthSecret,
  missingSecretResponse,
  sessionCookieOptions,
} from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!hasAuthSecret()) return missingSecretResponse();
  const user = await getSessionUser();
  const res = NextResponse.json({ user });
  // A valid token whose account is gone must lose its cookie, or middleware and the client redirect forever.
  if (!user && cookies().get(SESSION_COOKIE)) {
    res.cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 });
  }
  return res;
}
