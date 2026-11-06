'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  BookOpen,
  Bookmark,
  ClipboardCheck,
  Flame,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircleQuestion,
  Search,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react';
import CommandPalette from '@/components/CommandPalette';
import ThemeToggle from '@/components/ThemeToggle';
import { SidebarChapterList } from '@/components/chapter/ChapterList';
import { IconButton, Logo } from '@/components/ui/primitives';
import { useAuth } from '@/context/AuthProvider';
import { useProgress } from '@/hooks/useProgress';
import { cn, initials } from '@/lib/utils';

type NavItem = { href: string; label: string; icon: LucideIcon };

const NAV: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/chapters', label: 'Chapters', icon: BookOpen },
  { href: '/practice', label: 'Practice', icon: ClipboardCheck },
  { href: '/tools', label: 'Tools', icon: Wrench },
  { href: '/doubt', label: 'Ask AI', icon: MessageCircleQuestion },
  { href: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
];

const BOTTOM_NAV = ['/', '/chapters', '/practice', '/doubt'];
const BARE_PATHS = ['/login', '/register'];

function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

function SidebarBody({ pathname }: { pathname: string }) {
  return (
    <>
      <div className="flex h-14 shrink-0 items-center border-b border-line px-4">
        <Link href="/" aria-label="NetLab home">
          <Logo />
        </Link>
      </div>
      <nav aria-label="Main" className="shrink-0 space-y-0.5 p-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-2.5 rounded px-2.5 py-2 text-sm transition-colors',
                active ? 'bg-accent-soft font-medium text-accent' : 'text-muted hover:text-ink',
              )}
            >
              <Icon size={16} aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="min-h-0 flex-1 overflow-y-auto border-t border-line p-2">
        <p className="mono-label px-2.5 pb-1 pt-2">Chapters</p>
        <SidebarChapterList pathname={pathname} />
      </div>
      <div className="shrink-0 border-t border-line p-3">
        <ThemeToggle />
      </div>
    </>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return <div className="h-8 w-8 rounded-full border border-line" aria-hidden="true" />;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-accent font-mono text-xs font-semibold text-on-accent"
      >
        {initials(user.name)}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-10 z-40 w-60 rounded-md border border-line bg-surface p-2">
          <div className="border-b border-line px-2 pb-2">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => void logout()}
            className="mt-1 flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm text-muted hover:bg-accent-soft hover:text-ink"
          >
            <LogOut size={14} aria-hidden="true" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { streak, ready } = useProgress();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const setPalette = useCallback((open: boolean) => setPaletteOpen(open), []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  if (BARE_PATHS.includes(pathname)) return <>{children}</>;

  return (
    <div className="min-h-screen">
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-surface lg:flex">
        <SidebarBody pathname={pathname} />
      </aside>

      {drawerOpen && (
        <div className="no-print fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 h-full w-full bg-black/50"
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-line bg-surface">
            <IconButton label="Close menu" onClick={() => setDrawerOpen(false)} className="absolute right-2 top-2.5 z-10">
              <X size={18} />
            </IconButton>
            <SidebarBody pathname={pathname} />
          </aside>
        </div>
      )}

      <div className="print-shell lg:pl-60">
        <header className="no-print sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-surface px-3 md:px-6">
          <IconButton label="Open menu" onClick={() => setDrawerOpen(true)} className="lg:hidden">
            <Menu size={18} />
          </IconButton>
          <span className="lg:hidden">
            <Logo />
          </span>
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            aria-label="Search chapters, sections and terms"
            className="ml-auto inline-flex h-9 items-center gap-2 rounded border border-line px-2.5 text-sm text-muted transition-colors hover:text-ink lg:ml-0 lg:w-64"
          >
            <Search size={14} aria-hidden="true" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="ml-auto hidden rounded border border-line px-1 font-mono text-[10px] sm:inline">Ctrl K</kbd>
          </button>
          <div className="flex items-center gap-2 lg:ml-auto">
            <span
              title="Study streak in days"
              className="inline-flex h-8 items-center gap-1 rounded border border-line px-2 font-mono text-xs text-warning-ink"
            >
              <Flame size={13} aria-hidden="true" />
              {ready ? streak : 0}
              <span className="sr-only">day study streak</span>
            </span>
            <UserMenu />
          </div>
        </header>

        <main id="main" className="mx-auto w-full max-w-content px-4 py-6 pb-24 md:px-8 lg:pb-10">
          {children}
        </main>
      </div>

      <nav
        aria-label="Quick navigation"
        className="no-print fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-surface lg:hidden"
      >
        {NAV.filter((n) => BOTTOM_NAV.includes(n.href)).map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center gap-0.5 py-2 text-[11px]',
                active ? 'font-medium text-accent' : 'text-muted',
              )}
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>

      <CommandPalette open={paletteOpen} onOpenChange={setPalette} />
    </div>
  );
}
