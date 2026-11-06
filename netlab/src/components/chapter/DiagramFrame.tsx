'use client';

import { useRef, useState, type PointerEvent } from 'react';
import { Maximize2, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import Mermaid from '@/components/Mermaid';
import Dialog from '@/components/ui/Dialog';
import { Badge, IconButton } from '@/components/ui/primitives';
import type { DiagramBlock, DiagramKind } from '@/lib/types';

const KIND_LABELS: Record<DiagramKind, string> = {
  block: 'BLOCK',
  flowchart: 'FLOWCHART',
  'working-diagram': 'WORKING',
  'working-flowchart': 'WORKFLOW',
};

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;

export default function DiagramFrame({ diagram }: { diagram: DiagramBlock }) {
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const drag = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

  function zoom(delta: number) {
    setScale((s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, Number((s + delta).toFixed(2)))));
  }

  function reset() {
    setScale(1);
    setPos({ x: 0, y: 0 });
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { startX: e.clientX, startY: e.clientY, originX: pos.x, originY: pos.y };
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d) return;
    setPos({ x: d.originX + e.clientX - d.startX, y: d.originY + e.clientY - d.startY });
  }

  function endDrag() {
    drag.current = null;
  }

  return (
    <figure className="my-5 rounded-md border border-line bg-surface">
      <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <Badge tone="accent">{KIND_LABELS[diagram.kind]}</Badge>
          <span className="truncate text-sm font-medium">{diagram.title}</span>
        </div>
        <IconButton label={`Open ${diagram.title} fullscreen`} onClick={() => setOpen(true)} className="no-print">
          <Maximize2 size={15} />
        </IconButton>
      </div>
      <div className="p-3">
        <Mermaid chart={diagram.mermaid} />
      </div>
      <figcaption className="border-t border-line px-3 py-2 text-xs text-muted">{diagram.caption}</figcaption>

      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          reset();
        }}
        title={diagram.title}
        size="full"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-1 border-b border-line px-3 py-1.5">
            <IconButton label="Zoom out" onClick={() => zoom(-0.25)} disabled={scale <= MIN_SCALE}>
              <ZoomOut size={16} />
            </IconButton>
            <span className="w-14 text-center font-mono text-xs text-muted">{Math.round(scale * 100)}%</span>
            <IconButton label="Zoom in" onClick={() => zoom(0.25)} disabled={scale >= MAX_SCALE}>
              <ZoomIn size={16} />
            </IconButton>
            <IconButton label="Reset view" onClick={reset}>
              <RotateCcw size={15} />
            </IconButton>
            <span className="ml-2 hidden text-xs text-muted sm:inline">Drag to pan</span>
          </div>
          <div
            className="min-h-0 flex-1 cursor-grab touch-none overflow-hidden p-4 active:cursor-grabbing"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <div
              style={{
                transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
                transformOrigin: 'center top',
              }}
            >
              {open && <Mermaid chart={diagram.mermaid} className="overflow-visible" />}
            </div>
          </div>
        </div>
      </Dialog>
    </figure>
  );
}
