import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { isRateLimitError, streamAnswer } from '@/lib/gemini';
import { buildSystemInstruction, isChatMode } from '@/lib/prompts';
import type { ChatMessage } from '@/lib/types';
import { createRateLimiter } from '@/lib/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_MESSAGES = 20;
const MAX_CONTENT = 4000;
const limiter = createRateLimiter(20, 60 * 1000);

function parseMessages(value: unknown): ChatMessage[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const latest = value.slice(-MAX_MESSAGES);
  const out: ChatMessage[] = [];
  for (const item of latest) {
    const { role, content } = (item ?? {}) as { role?: unknown; content?: unknown };
    if (role !== 'user' && role !== 'assistant') return null;
    if (typeof content !== 'string' || content.length === 0 || content.length > MAX_CONTENT) return null;
    out.push({ role, content });
  }
  return out;
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  let body: { messages?: unknown; mode?: unknown; chapterSlug?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const messages = parseMessages(body.messages);
  if (!messages) {
    return NextResponse.json(
      { error: `messages must be a non-empty array of strings up to ${MAX_CONTENT} characters` },
      { status: 400 },
    );
  }
  if (!isChatMode(body.mode)) return NextResponse.json({ error: 'Unknown mode' }, { status: 400 });
  const chapterSlug = typeof body.chapterSlug === 'string' ? body.chapterSlug : undefined;

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY is not set. Add it to .env.local' }, { status: 500 });
  }
  if (!process.env.GEMINI_MODEL) {
    return NextResponse.json({ error: 'GEMINI_MODEL is not set. Add it to .env.local' }, { status: 500 });
  }

  const limit = limiter.check(user.id);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'You are sending messages too quickly. Wait a moment and try again.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } },
    );
  }

  try {
    const stream = await streamAnswer(messages, buildSystemInstruction(body.mode, chapterSlug));
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err) {
    if (isRateLimitError(err)) {
      return NextResponse.json({ error: 'The AI service is busy right now. Try again shortly.' }, { status: 429 });
    }
    return NextResponse.json({ error: 'The AI service could not answer. Try again.' }, { status: 502 });
  }
}
