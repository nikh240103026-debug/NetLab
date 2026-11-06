'use client';

import { CheckCircle2, FlaskConical, Search, Terminal, Wrench } from 'lucide-react';
import type { Block } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CopyButton } from '@/components/ui/primitives';
import DiagramFrame from './DiagramFrame';

export function InlineText({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
          return (
            <code key={i} className="rounded bg-accent-soft px-1 py-0.5 font-mono text-[0.88em]">
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

const CALLOUTS = {
  formula: { label: 'FORMULA', box: 'border-accent bg-accent-soft', tag: 'text-accent' },
  remember: { label: 'REMEMBER', box: 'border-warning bg-warning-soft', tag: 'text-warning-ink' },
  'exam-tip': { label: 'EXAM TIP', box: 'border-success bg-success-soft', tag: 'text-success-ink' },
  'real-world': { label: 'REAL WORLD', box: 'border-realworld bg-realworld-soft', tag: 'text-realworld' },
};

function NumberedList({ items }: { items: string[] }) {
  return (
    <ol className="space-y-1.5 text-sm">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="mt-0.5 w-5 shrink-0 text-right font-mono text-xs text-muted">{i + 1}.</span>
          <span className="min-w-0">
            <InlineText text={item} />
          </span>
        </li>
      ))}
    </ol>
  );
}

function PracticalCard({
  kicker,
  icon,
  title,
  children,
}: {
  kicker: string;
  icon: React.ReactNode;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="my-5 rounded-md border border-line bg-surface">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <span className="text-accent">{icon}</span>
        <span className="mono-label">{kicker}</span>
        {title && <span className="min-w-0 truncate text-sm font-medium">{title}</span>}
      </div>
      <div className="space-y-3 p-4">{children}</div>
    </div>
  );
}

export default function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case 'paragraph':
      return (
        <p className="my-3 max-w-reading text-[15px] leading-7">
          <InlineText text={block.text} />
        </p>
      );
    case 'points':
      return (
        <ul className="my-3 max-w-reading list-disc space-y-1.5 pl-5 text-[15px] leading-7 marker:text-accent">
          {block.items.map((item, i) => (
            <li key={i}>
              <InlineText text={item} />
            </li>
          ))}
        </ul>
      );
    case 'callout': {
      const meta = CALLOUTS[block.variant];
      return (
        <aside className={cn('my-4 max-w-reading rounded-r border-l-2 px-4 py-3', meta.box)}>
          <p className={cn('font-mono text-[11px] font-semibold tracking-wider', meta.tag)}>{meta.label}</p>
          <p className="mt-1 text-sm leading-6">
            <InlineText text={block.text} />
          </p>
        </aside>
      );
    }
    case 'diagram':
      return <DiagramFrame diagram={block} />;
    case 'table':
      return (
        <div className="my-4 overflow-x-auto rounded-md border border-line">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-accent-soft text-left">
                {block.headers.map((h, i) => (
                  <th key={i} scope="col" className="border-b border-line px-3 py-2 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r} className="border-b border-line last:border-b-0">
                  {row.map((cell, c) => (
                    <td key={c} className="px-3 py-2 align-top">
                      <InlineText text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'example':
      return (
        <PracticalCard kicker="Worked example" icon={<CheckCircle2 size={14} />} title={block.title}>
          <NumberedList items={block.steps} />
        </PracticalCard>
      );
    case 'command-lab':
      return (
        <div className="my-5 overflow-hidden rounded-md border border-line">
          <div className="flex items-center gap-2 border-b border-line bg-surface px-4 py-2.5">
            <Terminal size={14} className="text-accent" aria-hidden="true" />
            <span className="mono-label">Command lab</span>
            <span className="min-w-0 truncate text-sm font-medium">{block.title}</span>
          </div>
          <div className="terminal p-4 font-mono text-[13px] leading-6">
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 break-all">
                <span className="terminal-prompt">$ </span>
                {block.command}
              </p>
              <CopyButton text={block.command} label="Copy command" className="no-print" />
            </div>
            <pre className="mt-3 overflow-x-auto whitespace-pre text-[12.5px] leading-5 opacity-80">{block.output}</pre>
          </div>
          <div className="bg-surface p-4">
            <p className="mono-label mb-2">Line by line</p>
            <NumberedList items={block.explanation} />
          </div>
        </div>
      );
    case 'mini-lab':
      return (
        <PracticalCard kicker="Mini lab" icon={<FlaskConical size={14} />} title={block.title}>
          <p className="text-sm">
            <span className="font-medium">Goal: </span>
            <InlineText text={block.goal} />
          </p>
          <div>
            <p className="mono-label mb-2">Steps</p>
            <NumberedList items={block.steps} />
          </div>
          <div className="rounded border border-success bg-success-soft px-3 py-2 text-sm">
            <p className="font-mono text-[11px] font-semibold tracking-wider text-success-ink">EXPECTED RESULT</p>
            <p className="mt-1">
              <InlineText text={block.expected} />
            </p>
          </div>
        </PracticalCard>
      );
    case 'wireshark':
      return (
        <PracticalCard kicker="Wireshark" icon={<Search size={14} />}>
          <div className="flex flex-wrap items-center gap-2">
            <code className="rounded border border-accent bg-accent-soft px-2 py-1 font-mono text-xs text-accent">
              {block.filter}
            </code>
            <CopyButton text={block.filter} label="Copy filter" className="no-print text-accent" />
          </div>
          <div>
            <p className="mono-label mb-2">What to look for</p>
            <ul className="list-disc space-y-1 pl-5 text-sm marker:text-accent">
              {block.whatToLook.map((item, i) => (
                <li key={i}>
                  <InlineText text={item} />
                </li>
              ))}
            </ul>
          </div>
        </PracticalCard>
      );
    case 'case-study':
      return (
        <PracticalCard kicker="Case study" icon={<CheckCircle2 size={14} />} title={block.title}>
          <p className="text-sm">
            <span className="font-medium">Scenario: </span>
            <InlineText text={block.scenario} />
          </p>
          <NumberedList items={block.steps} />
        </PracticalCard>
      );
    case 'troubleshoot':
      return (
        <PracticalCard kicker="Troubleshoot" icon={<Wrench size={14} />}>
          <p className="text-sm">
            <span className="font-medium text-danger-ink">Symptom: </span>
            <InlineText text={block.symptom} />
          </p>
          <div>
            <p className="mono-label mb-2">Checks</p>
            <NumberedList items={block.checks} />
          </div>
          <p className="text-sm">
            <span className="font-medium text-success-ink">Fix: </span>
            <InlineText text={block.fix} />
          </p>
        </PracticalCard>
      );
  }
}
