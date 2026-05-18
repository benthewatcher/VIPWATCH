// Tiny client-side tracking helper. Fire-and-forget — never await.
// Uses sendBeacon when available (survives page unload) and falls back to fetch.

type EventType =
  | 'pageview'
  | 'wishlist_add'
  | 'wishlist_remove'
  | 'share_tap'
  | 'share_open'
  | 'enquiry_submit'
  | 'cta_click'
  | 'commission_view'
  | 'collection_view';

type TrackInput = {
  event_type: EventType;
  path?: string;
  metadata?: Record<string, unknown>;
};

export function track(input: TrackInput): void {
  if (typeof window === 'undefined') return;
  const body = JSON.stringify({
    event_type: input.event_type,
    path: input.path ?? window.location.pathname + window.location.search,
    metadata: input.metadata ?? {},
  });

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon('/api/track', blob);
      return;
    }
  } catch {
    /* sendBeacon can throw on size limits; fall through to fetch. */
  }

  // Fallback — fire-and-forget fetch.
  fetch('/api/track', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {
    /* never disturb the user */
  });
}
