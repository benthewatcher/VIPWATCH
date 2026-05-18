'use client';

import { track } from '@/lib/track';

const KEY = 'vipwatch:wishlist';

function read(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent('wishlist:change'));
}

export function getWishlist(): string[] {
  return read();
}

export function isLiked(id: string): boolean {
  return read().includes(id);
}

export function toggleLiked(id: string): boolean {
  const current = read();
  const i = current.indexOf(id);
  if (i === -1) {
    current.push(id);
    write(current);
    track({ event_type: 'wishlist_add', metadata: { commission_id: id } });
    syncWishlist(current);
    return true;
  }
  current.splice(i, 1);
  write(current);
  track({ event_type: 'wishlist_remove', metadata: { commission_id: id } });
  syncWishlist(current);
  return false;
}

// Fire-and-forget sync to the server. Server reconciles against wishlist_items
// for the current visitor (no-op if not signed in).
function syncWishlist(ids: string[]): void {
  if (typeof window === 'undefined') return;
  fetch('/api/wishlist/sync', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ commission_ids: ids }),
    keepalive: true,
  }).catch(() => {
    /* never disturb the user */
  });
}

export function subscribe(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => cb();
  window.addEventListener('wishlist:change', handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener('wishlist:change', handler);
    window.removeEventListener('storage', handler);
  };
}
