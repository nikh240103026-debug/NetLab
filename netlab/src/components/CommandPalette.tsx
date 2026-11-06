'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Search } from 'lucide-react';
import Dialog from '@/components/ui/Dialog';
import { SEARCH_GROUPS, search, type SearchResult } from '@/lib/search';
import { cn } from '@/lib/utils';

export default function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => search(query), [query]);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onOpenChange]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  function choose(result: SearchResult) {
    onOpenChange(false);
    router.push(result.href);
    // App Router hash navigation on the same page does not fire hashchange, and ChapterView listens for it.
    window.setTimeout(() => window.dispatchEvent(new HashChangeEvent('hashchange')), 80);
  }

  function onInputKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (results.length) setActive((a) => (a + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (results.length) setActive((a) => (a - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = results[active];
      if (target) choose(target);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      title="Search NetLab"
      placement="top"
      initialFocusRef={inputRef}
    >
      <div className="flex items-center gap-2 border-b border-line px-3">
        <Search size={15} className="text-muted" aria-hidden="true" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onInputKey}
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls="palette-results"
          aria-activedescendant={results[active] ? `palette-${active}` : undefined}
          aria-label="Search chapters, sections and terms"
          placeholder="Search chapters, sections, terms"
          className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
        />
        <kbd className="rounded border border-line px-1 font-mono text-[10px] text-muted">Esc</kbd>
      </div>
      <div id="palette-results" role="listbox" aria-label="Search results" className="max-h-[50vh] overflow-y-auto p-2">
        {query.trim() && results.length === 0 && <p className="px-2 py-6 text-center text-sm text-muted">No results found.</p>}
        {!query.trim() && (
          <p className="px-2 py-6 text-center text-sm text-muted">Try "subnet", "handshake" or "OSPF". Use the arrow keys and Enter.</p>
        )}
        {SEARCH_GROUPS.map((group) => {
          const items = results.filter((r) => r.group === group);
          if (items.length === 0) return null;
          return (
            <div key={group} className="mb-2" role="group" aria-label={group}>
              <p className="mono-label px-2 py-1">{group}</p>
              {items.map((item) => {
                const index = results.indexOf(item);
                return (
                  <button
                    key={item.id}
                    id={`palette-${index}`}
                    type="button"
                    role="option"
                    aria-selected={index === active}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => choose(item)}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 rounded px-2 py-1.5 text-left text-sm',
                      index === active && 'bg-accent-soft text-accent',
                    )}
                  >
                    <span className="min-w-0 truncate">{item.title}</span>
                    <span className="shrink-0 font-mono text-[10px] text-muted">{item.hint}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </Dialog>
  );
}
