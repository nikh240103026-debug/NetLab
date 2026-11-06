'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { RotateCcw, Send, Settings2, Trash2 } from 'lucide-react';
import Dialog from '@/components/ui/Dialog';
import { Button, Card, IconButton, Logo } from '@/components/ui/primitives';
import { chapters, getChapter } from '@/content/chapters';
import { useAuth } from '@/context/AuthProvider';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { CHAT_MODES } from '@/lib/prompts';
import type { ChatMode, StoredChatMessage } from '@/lib/types';
import { chapterCode, cn, uid } from '@/lib/utils';
import ChatBubble from './ChatBubble';

const EMPTY_HISTORY: StoredChatMessage[] = [];
const MAX_HISTORY = 40;
const MAX_SENT = 20;
const MAX_CONTENT = 4000;

const STARTERS = [
  'Subnet 192.168.10.0/24 into 4 equal subnets',
  'Explain the TCP three-way handshake with sequence numbers',
  'Why does traceroute show * * *?',
  'How does NAT let many devices share one public IP?',
  'Compare OSPF and RIP',
  'Explain this ping output',
];

export default function DoubtClient() {
  const params = useSearchParams();
  const { user } = useAuth();
  const storageKey = user ? `netlab-chat:${user.id}` : null;
  const [messages, setMessages, ready] = useLocalStorage<StoredChatMessage[]>(storageKey, EMPTY_HISTORY);

  const [mode, setMode] = useState<ChatMode>('explain');
  const [chapterSlug, setChapterSlug] = useState(() => {
    const requested = params.get('chapter');
    return requested && getChapter(requested) ? requested : '';
  });
  const [input, setInput] = useState(() => params.get('q') ?? '');
  const [streaming, setStreaming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [confirmClear, setConfirmClear] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const busy = streaming !== null;

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, streaming, error]);

  async function run(history: StoredChatMessage[]) {
    setError(null);
    setStreaming('');
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          // Long earlier answers are clipped so they stay under the server's per-message limit.
          messages: history.slice(-MAX_SENT).map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CONTENT) })),
          mode,
          chapterSlug: chapterSlug || undefined,
        }),
      });
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? 'The AI service could not answer. Try again.');
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setStreaming(text);
      }
      text += decoder.decode();
      if (!text.trim()) throw new Error('The AI returned an empty answer. Try again.');
      const reply: StoredChatMessage = { id: uid(), role: 'assistant', content: text };
      setMessages((prev) => [...prev, reply].slice(-MAX_HISTORY));
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError(err instanceof Error ? err.message : 'The AI service could not answer. Try again.');
      }
    } finally {
      setStreaming(null);
      abortRef.current = null;
    }
  }

  function send(text: string) {
    const content = text.trim();
    if (!content || busy || !ready) return;
    const question: StoredChatMessage = { id: uid(), role: 'user', content: content.slice(0, MAX_CONTENT) };
    const next = [...messages, question].slice(-MAX_HISTORY);
    setMessages(next);
    setInput('');
    void run(next);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  function clearChat() {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setConfirmClear(false);
  }

  return (
    <div className="flex h-[calc(100dvh-11rem)] min-h-[440px] flex-col gap-3 lg:h-[calc(100dvh-7.5rem)] lg:flex-row">
      <Card className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2">
          <div className="min-w-0">
            <p className="mono-label">AI doubt solver</p>
            <p className="truncate text-xs text-muted">
              {CHAT_MODES.find((m) => m.id === mode)?.label}
              {chapterSlug ? ` / ${getChapter(chapterSlug)?.shortTitle ?? ''}` : ''}
            </p>
          </div>
          <div className="flex items-center">
            <IconButton
              label="Clear chat"
              disabled={messages.length === 0 && !busy}
              onClick={() => setConfirmClear(true)}
            >
              <Trash2 size={15} />
            </IconButton>
            <IconButton
              label={settingsOpen ? 'Hide settings' : 'Show settings'}
              active={settingsOpen}
              onClick={() => setSettingsOpen((v) => !v)}
            >
              <Settings2 size={15} />
            </IconButton>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 md:p-4" aria-live="polite">
          {messages.length === 0 && !busy && (
            <div className="mx-auto flex max-w-reading flex-col items-center py-4 text-center">
              <Logo />
              <p className="mt-3 text-sm text-muted">Ask anything about Computer Networks, or start with one of these.</p>
              <div className="mt-4 grid w-full gap-2 sm:grid-cols-2">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={!ready}
                    onClick={() => send(s)}
                    className="rounded border border-line px-3 py-2 text-left text-sm transition-colors hover:border-accent disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <ChatBubble key={m.id} role={m.role} content={m.content} />
          ))}

          {busy &&
            (streaming ? (
              <ChatBubble role="assistant" content={streaming} streaming />
            ) : (
              <div className="typing inline-flex rounded-md border border-line bg-surface px-3 py-2.5" role="status">
                <span />
                <span />
                <span />
                <p className="sr-only">The tutor is typing</p>
              </div>
            ))}

          {error && (
            <div role="alert" className="rounded-md border border-danger bg-danger-soft p-3 text-sm">
              <p className="text-danger-ink">{error}</p>
              <Button size="sm" className="mt-2" onClick={() => void run(messages)} disabled={messages.length === 0}>
                <RotateCcw size={13} aria-hidden="true" />
                Retry
              </Button>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form
          className="border-t border-line p-3"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <div className="flex items-end gap-2">
            <label htmlFor="doubt-input" className="sr-only">
              Your question
            </label>
            <textarea
              id="doubt-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={2}
              maxLength={MAX_CONTENT}
              placeholder="Type your doubt. Enter sends, Shift+Enter adds a line."
              className="min-w-0 flex-1 resize-none rounded border border-line bg-bg p-2.5 text-sm placeholder:text-muted"
            />
            <Button type="submit" variant="primary" disabled={busy || !ready || !input.trim()} aria-label="Send question">
              <Send size={15} aria-hidden="true" />
            </Button>
          </div>
        </form>
      </Card>

      {settingsOpen && (
        <Card className="shrink-0 space-y-3 p-4 lg:w-64 lg:overflow-y-auto">
          <label className="block text-sm">
            <span className="mono-label">Mode</span>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as ChatMode)}
              className="mt-1 h-9 w-full rounded border border-line bg-surface px-2 text-sm"
            >
              {CHAT_MODES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mono-label">Chapter context</span>
            <select
              value={chapterSlug}
              onChange={(e) => setChapterSlug(e.target.value)}
              className="mt-1 h-9 w-full rounded border border-line bg-surface px-2 text-sm"
            >
              <option value="">No specific chapter</option>
              {chapters.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {chapterCode(c.number)} {c.shortTitle}
                </option>
              ))}
            </select>
          </label>
          <p className={cn('hidden text-xs text-muted lg:block')}>
            The tutor answers networking topics only and can make mistakes, so check important results against your notes.
          </p>
        </Card>
      )}

      <Dialog open={confirmClear} onClose={() => setConfirmClear(false)} title="Clear this chat?" size="sm">
        <div className="p-4 text-sm">
          <p>All saved messages for this account will be deleted from this browser.</p>
          <div className="mt-4 flex justify-end gap-2">
            <Button size="sm" onClick={() => setConfirmClear(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="danger" onClick={clearChat}>
              Clear chat
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
