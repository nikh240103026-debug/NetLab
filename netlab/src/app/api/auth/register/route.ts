import { NextResponse } from 'next/server';
import {
  SESSION_COOKIE,
  hasAuthSecret,
  hashPassword,
  missingSecretResponse,
  sessionCookieOptions,
  signSession,
  toPublicUser,
} from '@/lib/auth';
import { DuplicateEmailError, userStore } from '@/lib/userStore';
import { validateRegistration } from '@/lib/utils';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  if (!hasAuthSecret()) return missingSecretResponse();

  let body: { name?: unknown; email?: unknown; password?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  const fields = validateRegistration({ name, email, password });
  if (Object.keys(fields).length > 0) {
    return NextResponse.json({ error: 'Please fix the highlighted fields', fields }, { status: 400 });
  }

  try {
    const user = await userStore.createUser({ name, email, passwordHash: await hashPassword(password) });
    const res = NextResponse.json({ user: toPublicUser(user) }, { status: 201 });
    res.cookies.set(SESSION_COOKIE, await signSession(user.id), sessionCookieOptions());
    return res;
  } catch (err) {
    if (err instanceof DuplicateEmailError) {
      return NextResponse.json(
        { error: 'An account with this email already exists', fields: { email: 'This email is already registered' } },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: 'Could not create the account. Try again.' }, { status: 500 });
  }
}
