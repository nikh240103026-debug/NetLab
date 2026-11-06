'use client';

import { useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import manifest from '@/content/videos.json';
import type { VideoManifest } from '@/lib/types';
import { chapterCode, cn } from '@/lib/utils';

const data = manifest as VideoManifest;

function youtubeEmbed(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : null;
}

export default function VideoSlot({ videoId, className }: { videoId: string; className?: string }) {
  const entry = data.videos.find((v) => v.id === videoId);
  const folder = data.chapters.find((c) => c.number === entry?.chapter)?.folder;
  const externalUrl = entry?.url?.trim() ?? '';
  const embed = externalUrl ? youtubeEmbed(externalUrl) : null;
  const src = externalUrl || (folder ? `/videos/${folder}/${videoId}.mp4` : '');
  const [exists, setExists] = useState(false);

  useEffect(() => {
    if (!src || embed) return;
    let active = true;
    setExists(false);
    // Cross-origin hosts rarely allow CORS on HEAD; an opaque answer still proves the host responded.
    fetch(src, { method: 'HEAD', mode: externalUrl ? 'no-cors' : 'same-origin', cache: 'no-store' })
      .then((res) => {
        if (active) setExists(res.ok || res.type === 'opaque');
      })
      .catch(() => {
        if (active) setExists(false);
      });
    return () => {
      active = false;
    };
  }, [src, embed, externalUrl]);

  if (!entry || !folder) {
    return (
      <div className={cn('no-print rounded-md border border-danger bg-danger-soft p-3 text-sm text-danger-ink', className)}>
        Unknown video id: <code className="font-mono">{videoId}</code>
      </div>
    );
  }

  if (embed) {
    return (
      <figure className={cn('no-print', className)}>
        <iframe
          src={embed}
          title={entry.title}
          className="aspect-video w-full rounded-md border border-line"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </figure>
    );
  }

  if (exists) {
    return (
      <figure className={cn('no-print', className)}>
        <video controls preload="metadata" src={src} className="aspect-video w-full rounded-md border border-line bg-black">
          <track kind="captions" />
        </video>
        <figcaption className="mt-1 text-xs text-muted">{entry.title}</figcaption>
      </figure>
    );
  }

  return (
    <figure className={cn('no-print', className)}>
      <div className="blueprint flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-md border border-line bg-surface p-4 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-line text-accent">
          <Play size={20} aria-hidden="true" />
        </span>
        <p className="text-sm font-medium">Practical lecture video coming soon</p>
        <p className="text-sm text-muted">{entry.title}</p>
        <p className="mono-label break-all normal-case">
          VIDEO SLOT / {chapterCode(entry.chapter)} / {entry.id}
        </p>
      </div>
      <figcaption className="mt-1 break-all font-mono text-[11px] text-muted">
        public/videos/{folder}/{entry.id}.mp4
      </figcaption>
    </figure>
  );
}
