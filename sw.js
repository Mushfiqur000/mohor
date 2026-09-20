// ==========================================================================
// MOHOR CLOTHINGS — sw.js
//
// GitHub Pages doesn't let this site set its own Cache-Control headers, so
// repeat visits are at the mercy of whatever the CDN's default is. This
// service worker adds a second, much longer-lived cache layer entirely
// under the site's own control:
//
//   - Same-origin static files (style.css, app.js, cart.js, products.js,
//     images/icons/fonts under assets/) are cache-first: once fetched, they
//     load instantly from the cache on every later visit.
//   - HTML pages are network-first with a cache fallback: a visitor always
//     gets the latest shell when online, but the page still loads from
//     cache if the network is slow or unavailable.
//   - Firebase/Firestore, the Meta pixel/CAPI worker, Google Fonts, and any
//     other cross-origin request are left completely alone and always go
//     straight to the network — caching those could serve stale product
//     data, break auth, or interfere with tracking.
//
// CACHE_VERSION is tied to the site's own ?v= cache-busting number. Bump it
// whenever style.css/app.js/cart.js/products.js/auth.js change so old,
// cached copies are dropped rather than lingering forever.
// ==========================================================================

const CACHE_VERSION = 'v26';
const CACHE_NAME = `mohor-static-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  '/style.css?v=26',
  '/products.js?v=26',
  '/app.js?v=26',
  '/cart.js?v=26',
  '/assets/logo-ink.png',
  '/assets/logo-white.png',
  '/assets/favicon-32.png',
  '/assets/image-placeholder.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch((err) => {
        // Precaching is a best-effort optimization; a single missing asset
        // (e.g. a stale URL after a deploy) shouldn't block installation.
        console.warn('SW precache skipped some assets:', err);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name.startsWith('mohor-static-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// A same-origin request counts as a "static asset" if it points at one of
// the site's own versioned files or lives under /assets/.
function isCacheableStaticAsset(url) {
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith('/assets/')) return true;
  if (/\.(?:css|js)$/.test(url.pathname) && url.searchParams.has('v')) return true;
  return false;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never touch cross-origin requests (Firebase, Firestore, the Meta pixel
  // and its CAPI worker, Google Fonts, WhatsApp, etc.) — always network.
  if (url.origin !== self.location.origin) return;

  // HTML navigations: network-first, falling back to a cached copy (of this
  // same URL, or the cached homepage as a last resort) if the network fails.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match('/'))
        )
    );
    return;
  }

  // Static assets: cache-first, refreshing the cache in the background.
  if (isCacheableStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((response) => {
            if (response && response.ok) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return response;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    );
  }
});
