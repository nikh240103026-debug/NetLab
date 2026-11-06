'use client';

import { useState } from 'react';
import { ChevronDown, Printer } from 'lucide-react';
import { Button, Card } from '@/components/ui/primitives';
import { chapters } from '@/content/chapters';
import { chapterLabel, cn, parseTerm } from '@/lib/utils';

export default function FormulaSheet() {
  const [open, setOpen] = useState<string[]>(chapters[0] ? [chapters[0].slug] : []);

  function toggle(slug: string) {
    setOpen((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }

  return (
    <div>
      <div className="no-print mb-3 flex justify-end">
        <Button size="sm" onClick={() => window.print()}>
          <Printer size={14} aria-hidden="true" />
          Print sheet
        </Button>
      </div>
      <div className="space-y-2">
        {chapters.map((c) => {
          const isOpen = open.includes(c.slug);
          return (
            <Card key={c.slug}>
              <h3>
                <button
                  type="button"
                  onClick={() => toggle(c.slug)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
                >
                  <span className="mono-label">{chapterLabel(c)}</span>
                  <ChevronDown
                    size={16}
                    className={cn('no-print shrink-0 text-muted transition-transform', isOpen && 'rotate-180')}
                    aria-hidden="true"
                  />
                </button>
              </h3>
              <div className={cn('border-t border-line p-4', isOpen ? 'block' : 'hidden print:block')}>
                {c.formulas.length > 0 ? (
                  <div className="overflow-x-auto rounded border border-line">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-accent-soft text-left">
                          <th scope="col" className="px-3 py-2 font-medium">
                            Formula
                          </th>
                          <th scope="col" className="px-3 py-2 font-medium">
                            Expression
                          </th>
                          <th scope="col" className="px-3 py-2 font-medium">
                            Note
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {c.formulas.map((f, i) => (
                          <tr key={i} className="border-t border-line">
                            <td className="px-3 py-2 align-top">{f.name}</td>
                            <td className="px-3 py-2 align-top font-mono text-xs">{f.expression}</td>
                            <td className="px-3 py-2 align-top text-muted">{f.note ?? ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-muted">This chapter has no formulas to memorise.</p>
                )}
                <p className="mono-label mt-4">Key terms</p>
                <dl className="mt-2 grid gap-x-6 gap-y-2 text-sm md:grid-cols-2">
                  {c.keyTerms.map((raw, i) => {
                    const { term, definition } = parseTerm(raw);
                    return (
                      <div key={i}>
                        <dt className="font-mono text-xs font-medium">{term}</dt>
                        {definition && <dd className="text-muted">{definition}</dd>}
                      </div>
                    );
                  })}
                </dl>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
