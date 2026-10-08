// Mohor service worker — offline shell + stale-while-revalidate for static assets.
// The API is never cached: prices, stock and orders must always be live.
const VERSION = 'mohor-v2.0.0';
const SHELL = ['/', '/shop', '/cart', '/404.html', '/assets/css/mohor.css', '/assets/logo-ink.png', '/assets/image-placeholder.svg'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/admin')) return;

  // Pages: network first, cached copy when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put(request, copy)); return res; })
        .catch(() => caches.match(request, { ignoreSearch: true }).then(r => r || caches.match('/')))
    );
    return;
  }

  // Assets: serve cache instantly, refresh in background.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.open(VERSION).then(async cache => {
        const cached = await cache.match(request);
        const network = fetch(request).then(res => { if (res.ok) cache.put(request, res.clone()); return res; }).catch(() => cached);
        return cached || network;
      })
    );
  }
});
