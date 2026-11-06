'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/primitives';

type MermaidApi = typeof import('mermaid').default;
type MermaidTheme = 'dark' | 'neutral';

let loader: Promise<MermaidApi> | null = null;
let activeTheme: MermaidTheme | null = null;
let queue: Promise<unknown> = Promise.resolve();
let sequence = 0;

function loadMermaid(): Promise<MermaidApi> {
  if (!loader) loader = import('mermaid').then((m) => m.default);
  return loader;
}

// initialize() and render() share global state, so renders must not interleave across a theme change.
function enqueue<T>(job: () => Promise<T>): Promise<T> {
  const run = queue.then(job, job);
  queue = run.catch(() => undefined);
  return run;
}

function useIsDark(): boolean | null {
  const [dark, setDark] = useState<boolean | null>(null);
  useEffect(() => {
    const root = document.documentElement;
    const read = () => setDark(root.classList.contains('dark'));
    read();
    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return dark;
}

export default function Mermaid({ chart, className }: { chart: string; className?: string }) {
  const dark = useIsDark();
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (dark === null) return;
    let cancelled = false;
    setSvg(null);
    setFailed(false);
    const theme: MermaidTheme = dark ? 'dark' : 'neutral';
    enqueue(async () => {
      if (cancelled) return;
      const mermaid = await loadMermaid();
      if (activeTheme !== theme) {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme,
          suppressErrorRendering: true,
        });
        activeTheme = theme;
      }
      await mermaid.parse(chart);
      sequence += 1;
      const { svg: rendered } = await mermaid.render(`mermaid-${sequence}`, chart);
      if (!cancelled) setSvg(rendered);
    }).catch(() => {
      if (!cancelled) setFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, [chart, dark]);

  if (failed) {
    return (
      <div className={cn('rounded border border-danger bg-danger-soft p-3', className)}>
        <p className="text-sm font-medium text-danger-ink">This diagram could not be rendered.</p>
        <pre className="mt-2 overflow-x-auto font-mono text-xs text-ink">{chart}</pre>
      </div>
    );
  }

  if (!svg) return <Skeleton className={cn('h-56 w-full', className)} />;

  return (
    <div
      className={cn('overflow-x-auto [&_svg]:mx-auto', className)}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
