'use client';

import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BookOpen } from 'lucide-react';
import { CopyButton } from '@/components/ui/primitives';
import { chapters } from '@/content/chapters';
import type { ChatRole } from '@/lib/types';
import { chapterCode, cn } from '@/lib/utils';

function findRelatedChapter(text: string) {
  const match = text.match(/Related chapter:\s*\**\s*(.+?)\s*\**\s*$/im);
  if (!match) return null;
  const name = match[1].replace(/[*_`.]/g, '').trim().toLowerCase();
  if (!name) return null;
  return (
    chapters.find((c) => c.title.toLowerCase().replace(/\./g, '') === name) ??
    chapters.find((c) => name.includes(c.title.toLowerCase()) || c.title.toLowerCase().includes(name)) ??
    null
  );
}

export default function ChatBubble({
  role,
  content,
  streaming,
}: {
  role: ChatRole;
  content: string;
  streaming?: boolean;
}) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-md border border-accent bg-accent-soft px-3 py-2 text-sm">
          {content}
        </p>
      </div>
    );
  }

  const related = streaming ? null : findRelatedChapter(content);

  return (
    <div className={cn('max-w-full rounded-md border border-line bg-surface p-3 md:p-4', streaming && 'border-accent')}>
      <div className="md break-words">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
      {!streaming && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-2">
          <CopyButton text={content} label="Copy answer" className="text-muted" />
          {related && (
            <Link
              href={`/chapters/${related.slug}`}
              className="inline-flex items-center gap-1.5 rounded border border-accent bg-accent-soft px-2 py-1 font-mono text-[11px] text-accent"
            >
              <BookOpen size={12} aria-hidden="true" />
              {chapterCode(related.number)} {related.shortTitle}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
