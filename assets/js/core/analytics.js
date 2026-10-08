const PIXEL_ID = '920711640501746';
let loaded = false;
function loadPixel() {
  if (loaded || navigator.doNotTrack === '1') return false;
  loaded = true;
  /* eslint-disable */
  const f = window, b = document;
  if (f.fbq) return true;
  const n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
  if (!f._fbq) f._fbq = n;
  n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
  const s = b.createElement('script'); s.async = true; s.src = 'https://connect.facebook.net/en_US/fbevents.js';
  b.head.append(s); /* eslint-enable */
  window.fbq('init', PIXEL_ID); return true;
}
const makeEventId = event => `${event}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
function relay(event, eventId, data = {}) {
  const body = JSON.stringify({ event, eventId, value: data.value, contents: data.contents, url: location.href });
  navigator.sendBeacon?.('/api/track', new Blob([body], { type: 'application/json' }))
    || fetch('/api/track', { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'application/json' } }).catch(() => {});
}
export function track(event, data = {}) {
  try {
    const eventId = makeEventId(event), custom = { ...data };
    if (data.value !== undefined) custom.currency = 'BDT';
    if (data.contents) { custom.content_ids = data.contents.map(c => c.id); custom.content_type = 'product'; }
    loadPixel(); window.fbq?.('track', event, custom, { eventID: eventId }); relay(event, eventId, data);
  } catch {}
}
export function trackPageView() {
  const event = 'PageView', eventId = makeEventId(event);
  relay(event, eventId);
  const startPixel = () => { if (loadPixel()) window.fbq?.('track', event, {}, { eventID: eventId }); };
  if ('requestIdleCallback' in window) window.requestIdleCallback(startPixel, { timeout: 2500 }); else setTimeout(startPixel, 1500);
}
