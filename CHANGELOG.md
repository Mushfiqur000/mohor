# Changelog — performance & reliability pass (2026-09-20)

This pass focused on load speed and fixing bugs found while reviewing every
file, while preserving all existing features and the changes made during
this same window (clean URLs, delivery pricing, order-success page, the
stock/wishlist/menu redesign). Nothing was removed; where something looked
broken it was fixed to match its own evident intent rather than replaced
with something new.

## Bugs fixed

- **Storewide discount banner never worked.** `admin.html`'s "Apply
  Storewide Discount" wrote to `settings/banner` with fields `active` /
  `text` / `expiresAt`. The storefront's banner code in `app.js` reads
  `settings/storefront` with fields `saleActive` / `bannerText` /
  `saleEndTime`. The percentage discount applied to products correctly; the
  banner itself just never appeared. Admin now writes to the document and
  field names the storefront actually reads.
- **`order-history.html` showed the wrong renderer.** The page defined its
  own detailed order-history template, but because it's a plain script and
  `auth.js` loads as a deferred module, auth.js actually ran *after* it and
  silently overwrote `window.loadUserOrders`. Fixed by loading the
  page-specific renderer as a module too, so it (correctly) wins.
- **`order-history.html`'s cart drawer was missing checkout fields** (name,
  phone, address, delivery zone) entirely — completing checkout from that
  page would have failed. Brought in line with every other page's drawer.
- **Meta Pixel `PageView` fired twice** on every page (once from the static
  snippet, once from `trackMetaEvent`), inflating ad account numbers. Now
  fires once, consistently, everywhere.
- **Duplicate `AddToCart` pixel events** from the quick-view modal's
  buttons (now unreachable dead code since the modal markup was removed
  from `index.html`, but fixed for whenever it's reintroduced).
- **`products.js`'s "related products" cards lost their styling** after the
  shop-grid redesign removed the `.card-cta` button CSS they depended on.
  Rewritten to match the current card template (color swatches, stock
  badges, wishlist heart, no button).
- **`product.html`'s main image used `loading="lazy"`** despite being the
  page's LCP element — switched to eager + `fetchpriority="high"`.
- **`order.html`** permanently forced a dark theme regardless of the site's
  theme toggle, used a different font pairing than every other page, and
  had an incomplete Firebase config (missing `storageBucket` /
  `messagingSenderId` / `appId`). Rebuilt to match the shared design system.
- **`about.html` and `policy.html`'s header logo never adapted for dark
  mode** (only `index.html`, `login.html`, `order.html`, and
  `order-history.html` had the light/dark logo pair). Added.
- **`robots.txt`'s `Disallow` rules were grouped under the wrong
  `User-agent` block** (after `Googlebot-Image` with no new `User-agent: *`
  line), so they likely didn't apply to Google's main crawler. Regrouped.
- **WhatsApp checkout messages didn't URL-encode customer name/address** —
  a `&` or `#` in an address could corrupt the message. Now encoded.
- **Script version numbers had drifted** into `v=18/20/21/22/23/24`
  coexisting across different pages. Unified to `v=25` everywhere,
  including the new service worker's cache name, so a stale cached copy of
  `app.js`/`cart.js`/etc. can't linger on a page that wasn't touched in a
  given update.
- **The wishlist page was missing the site's fonts, favicon, meta tags,
  Meta Pixel, theme/language toggles, cart badge, and dark-mode-safe
  logo**, and had no `wishlist.html` twin (every other page has both a
  `name.html` and a `name/` clean URL). Brought up to the same standard as
  every other page.

## Flagged, not fixed

- **The Telegram bot token is hardcoded in `app.js`**, sent directly from
  the browser. Anyone can read it from the page source and send messages as
  that bot. Left working (removing it would break real order notifications
  without your say-so), but this needs a proper fix — see the Security note
  in `README.md`. Please rotate the token via BotFather regardless of when
  you get to the proxy.

## Performance

- **Script loading**: every page now defers `style.css`'s dependent scripts
  (Firebase SDKs, `products.js`, `app.js`, `cart.js`) instead of blocking
  the parser, matching the pattern `index.html` had already pioneered.
- **Auth loads off the critical path** on every page via
  `requestIdleCallback` (not gated behind a click a signed-in customer
  might never make, which would have silently detached their order from
  their account) — except `login.html` (needs it immediately) and
  `product.html`/`order-success.html` (never need it at all).
- **Meta Pixel loads on idle**, after first render, on every page.
- **Product catalog & promo-banner caching**: both are now cached in
  `sessionStorage` for a few minutes (stale-while-revalidate), so
  navigating between pages in the same session doesn't re-fetch the same
  Firestore data on every load.
- **New service worker (`sw.js`)**: cache-first for static assets,
  network-first for HTML pages. GitHub Pages doesn't allow custom
  `Cache-Control` headers, so this is the main lever available for
  making repeat visits fast.
- **New `manifest.webmanifest`** for basic install/PWA support.

## Also

- `sitemap.xml` and `robots.txt` were already fixed for the stale image
  paths in an earlier update in this same window — this pass only fixed the
  `User-agent` grouping issue and added `lastmod` dates.
- `README.md` was updated to reflect the current file structure (clean
  URLs, the new pages, the service worker) and to document the Telegram
  token issue.
