import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { PublicUser, StoredUser } from './types';
import { userStore } from './userStore';

export const SESSION_COOKIE = 'netlab_session';
const SESSION_SECONDS = 60 * 60 * 24 * 7;
const BCRYPT_COST = 10;

export function hasAuthSecret(): boolean {
  return Boolean(process.env.AUTH_SECRET);
}

export function missingSecretResponse(): NextResponse {
  return NextResponse.json({ error: 'AUTH_SECRET is not set. Add it to .env.local' }, { status: 500 });
}

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET is not set');
  return new TextEncoder().encode(secret);
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

let dummyHash: Promise<string> | null = null;

export function burnPasswordCheck(password: string): Promise<boolean> {
  if (!dummyHash) dummyHash = bcrypt.hash('netlab-timing-guard', BCRYPT_COST);
  return dummyHash.then((hash) => bcrypt.compare(password, hash));
}

export function signSession(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySession(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ['HS256'] });
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_SECONDS,
  };
}

export function toPublicUser(user: StoredUser): PublicUser {
  return { id: user.id, name: user.name, email: user.email };
}

export async function getSessionUser(): Promise<PublicUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const userId = await verifySession(token);
  if (!userId) return null;
  const user = await userStore.findById(userId);
  return user ? toPublicUser(user) : null;
}
