# Mohor Clothings

Storefront and admin dashboard for **Mohor Clothings** — handcrafted three-piece
sets, kurtis, and khadi wear, based in Sylhet, Bangladesh. Live at
[mohor.me](https://mohor.me).

A static, framework-free site (HTML/CSS/vanilla JS) backed by Firebase
(Firestore + Auth), deployed on GitHub Pages via the `CNAME` file. No build
step — every file is served as-is.

## Structure

```
index.html          Homepage — hero, shop grid, filters/menu drawer
about.html          Brand story
policy.html         Delivery & return policy
product.html        Product detail page (gallery, sizes/colors, wishlist)
cart.html           Standalone checkout page
login.html          Standalone login / signup page
order.html          Single order detail / receipt view
order-history.html  A signed-in customer's past orders
order-success.html  Post-checkout confirmation (lightweight, no Firebase)
wishlist.html       Saved items (device-local, via localStorage)
admin.html          Admin dashboard (orders, products, inventory, stock,
                    storewide discounts, CSV export) — not linked from the
                    storefront nav; bookmark it directly

Every page above also exists as <name>/index.html (e.g. about/index.html),
identical to the top-level file plus a single <base href="../"> tag. This
gives the site clean URLs (/about/ instead of /about.html) on GitHub Pages,
which has no server-side rewrite support. When editing a page, edit the
top-level *.html file and regenerate its folder twin from it — don't hand-edit
the twin, since the two must stay byte-identical apart from that one tag.

style.css       Shared design system for every storefront page above
app.js          i18n (EN/BN), product catalog loading + rendering, cart/
                account sidebars, wishlist read/write, per-size stock
                helpers, promo banner, nav interactions, Meta Pixel/CAPI
                tracking helper (trackMetaEvent)
cart.js         Cart state, stock-aware add-to-cart, pricing verification,
                WhatsApp + website checkout, order creation
auth.js         Firebase Auth, saved profile, order history
products.js     Static fallback product catalog (used only if Firestore is
                empty/unreachable) + the "related products" renderer
wishlist.js     Wishlist page orchestrator (reuses app.js's renderProducts)
sw.js           Service worker: cache-first for static assets, network-first
                for HTML, to reduce reliance on GitHub Pages' default caching
manifest.webmanifest  Basic PWA manifest (icons, theme color, install)

assets/         Logo marks, favicons, hero images, OG image, placeholder art
assets/banner-*.webp Responsive hero photography (800/1280/1920/2560w)
assets/favicon-*.png Favicons and app icons
CNAME           GitHub Pages custom domain (mohor.me)
_nojekyll       Disables Jekyll processing on GitHub Pages
```

## Local development

No build step is required. Serve the folder with any static file server, e.g.:

```
python3 -m http.server 8080
```

then open `http://localhost:8080`.

## Firebase

The storefront uses the Firebase **compat** SDK (loaded from the
`gstatic.com` CDN) for:

- **Firestore** — `products` collection (live catalog, managed from
  `admin.html`), `orders` collection (placed from the storefront), and a
  `settings/storefront` document driving the storewide sale banner.
- **Auth** — email/password accounts, used to save a customer's name, phone
  and address for faster repeat checkout, and to show their order history.

Auth is loaded automatically shortly after each page settles (via
`requestIdleCallback`, off the critical rendering path) rather than eagerly,
except on `login.html` where it's the page's whole purpose, and `product.html`
and `order-success.html`, which never need it at all.

`admin.html` is a separate app and uses the **modular** Firebase SDK with its
own auth/session handling — it does not share code with the storefront pages.

The Firebase config object (API key, project ID, etc.) is intentionally
public in the client code — this is normal for Firebase web apps. Actual
access control is enforced through **Firestore Security Rules**, configured
in the Firebase console, not in this repository.

Order totals are recomputed from the live catalog before being saved (see
`getCanonicalItemDetails` in `cart.js`), so a tampered client-side price can't
be submitted directly. This is a client-side mitigation only — for a hard
guarantee, validate totals again in Firestore Security Rules or a Cloud
Function. The same is true of per-size stock checks: they prevent obviously
over-limit adds in the UI, but nothing server-side stops two customers from
racing for the last unit — a Cloud Function or transaction would be needed
to close that gap completely.

## Admin dashboard

`admin.html` is a self-contained dashboard (overview, orders, order history
with a calendar/chart view, products, per-colour/per-size stock, storewide
discounts, CSV export) for managing the store day-to-day. It isn't linked
from the public nav — bookmark `/admin.html` directly, and sign in with a
Firebase Auth account that your Firestore rules grant admin access to.

## Security note

Telegram order notifications are sent through a server-side proxy configured
with the public `window.MOHOR_TELEGRAM_ENDPOINT` value before `app.js` loads.
The proxy must keep `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` in its own
secret store, validate the request, and forward the message to Telegram's
`sendMessage` API. The browser never receives either secret. If the endpoint
is not configured, checkout still succeeds and the notification is skipped
with a console warning. Rotate any token that was previously exposed in the
client via BotFather before enabling the proxy.

## Deployment

Push to the branch configured for GitHub Pages. The `CNAME` file points the
custom domain (`mohor.me`) at this repository; `_nojekyll` tells GitHub
Pages to serve the files exactly as they are, without running them through
Jekyll first. Remember to bump the `?v=` query string on `style.css`/
`app.js`/`cart.js`/`auth.js`/`products.js` (and in `sw.js`'s `CACHE_VERSION`)
whenever their content changes, so returning visitors — and the service
worker's cache — pick up the new version instead of a stale cached copy.

## Language

The storefront supports English and Bengali via a client-side toggle
(top-right of the nav), persisted in `localStorage` under `mohor_lang`. All
UI strings live in `window.uiTranslations` in `app.js`; product content
(title, description, etc.) can be a `{ en, bn }` object in
Firestore/`products.js` or a plain string.
<!-- pages: rebuild trigger -->
