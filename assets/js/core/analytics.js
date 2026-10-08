// Meta Pixel (browser) + server relay (/api/track → Conversions API), sharing
// event ids so Meta de-duplicates them. Purchase is sent by the server only.

const PIXEL_ID = '920711640501746';
let loaded = false;

function loadPixel() {
  if (loaded || navigator.doNotTrack === '1') return;
  loaded = true;
  /* eslint-disable */
  const f = window, b = document;
  if (f.fbq) return;
  const n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
  if (!f._fbq) f._fbq = n;
  n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
  const s = b.createElement('script'); s.async = true; s.src = 'https://connect.facebook.net/en_US/fbevents.js';
  b.head.append(s);
  /* eslint-enable */
  window.fbq('init', PIXEL_ID);
}

/**
 * @param {'PageView'|'ViewContent'|'AddToCart'|'AddToWishlist'|'InitiateCheckout'|'Search'|'Contact'} event
 * @param {{ value?: number, contents?: { id: string, quantity: number }[], search_string?: string }} [data]
 */
export function track(event, data = {}) {
  try {
    loadPixel();
    const eventId = `${event}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const custom = { ...data };
    if (data.value !== undefined) custom.currency = 'BDT';
    if (data.contents) { custom.content_ids = data.contents.map(c => c.id); custom.content_type = 'product'; }
    window.fbq?.('track', event, custom, { eventID: eventId });
    const body = JSON.stringify({ event, eventId, value: data.value, contents: data.contents, url: location.href });
    navigator.sendBeacon?.('/api/track', new Blob([body], { type: 'application/json' }))
      || fetch('/api/track', { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'application/json' } }).catch(() => {});
  } catch { /* analytics must never break the page */ }
}
