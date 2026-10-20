import { useSyncExternalStore } from 'react';

// Tiny built-in router: real URLs (/modes, /events ...) with no extra package. The Cloudflare
// Worker serves index.html for unknown paths, so deep links and refreshes both work.

const NAV_EVENT = 'voidmc:navigate';

function currentPath(): string {
  const p = window.location.pathname.replace(/\/+$/, '') || '/';
  return p.toLowerCase();
}

function subscribe(cb: () => void) {
  window.addEventListener('popstate', cb);
  window.addEventListener(NAV_EVENT, cb);
  return () => {
    window.removeEventListener('popstate', cb);
    window.removeEventListener(NAV_EVENT, cb);
  };
}

export function usePath(): string {
  return useSyncExternalStore(subscribe, currentPath, () => '/');
}

export function navigate(to: string, opts?: { replace?: boolean }) {
  let url: URL;
  try {
    url = new URL(to, window.location.origin);
  } catch {
    return;
  }
  if (url.origin !== window.location.origin) {
    window.location.href = to;
    return;
  }
  const target = url.pathname + url.search + url.hash;
  if (opts?.replace) window.history.replaceState({}, '', target);
  else if (target !== window.location.pathname + window.location.search + window.location.hash) {
    window.history.pushState({}, '', target);
  }
  window.dispatchEvent(new Event(NAV_EVENT));
  window.scrollTo({ top: 0, behavior: 'auto' });
}

/** Makes every normal <a href="/..."> navigate without a full page reload. */
export function installLinkInterceptor() {
  const onClick = (e: MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element | null)?.closest?.('a');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || a.getAttribute('target') === '_blank' || a.hasAttribute('download')) return;
    if (!href.startsWith('/') || href.startsWith('//')) return;
    e.preventDefault();
    navigate(href);
  };
  document.addEventListener('click', onClick);
  return () => document.removeEventListener('click', onClick);
}

export type PageKey =
  | 'home'
  | 'modes'
  | 'events'
  | 'builds'
  | 'rules'
  | 'join'
  | 'notfound';

const PAGES: Record<string, PageKey> = {
  '/': 'home',
  '/index.html': 'home',
  '/modes': 'modes',
  '/modes.html': 'modes',
  '/game-modes': 'modes',
  '/events': 'events',
  '/events.html': 'events',
  '/builds': 'builds',
  '/builds.html': 'builds',
  '/showcase': 'builds',
  '/rules': 'rules',
  '/rules.html': 'rules',
  '/staff': 'rules',
  '/join': 'join',
  '/join.html': 'join',
  '/server': 'join',
  '/faq': 'join',
  '/faq.html': 'join',
};

export function parseRoute(path: string): { page: PageKey } {
  // The console path is deliberately absent from this table: it is matched by digest in App.tsx,
  // so the literal URL never appears in the bundle.
  return { page: PAGES[path] || 'notfound' };
}

/** Nav order and labels — the header and the mobile sheet both render from this. */
export const NAV: Array<{ href: string; label: string; page: PageKey }> = [
  { href: '/', label: 'Home', page: 'home' },
  { href: '/modes', label: 'Modes', page: 'modes' },
  { href: '/events', label: 'Events', page: 'events' },
  { href: '/builds', label: 'Builds', page: 'builds' },
  { href: '/rules', label: 'Rules & Staff', page: 'rules' },
  { href: '/join', label: 'Join', page: 'join' },
];
