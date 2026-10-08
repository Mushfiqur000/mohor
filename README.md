# Mohor Clothings — mohor.me

Heritage womenswear from Sylhet. Mobile-first storefront and admin panel, running on **Cloudflare Workers + D1** (free plan).

## Architecture
| Piece | Where |
|---|---|
| API (auth, products, cart, orders, admin, uploads, Telegram, Meta CAPI) | `_worker.js` |
| Config | `wrangler.jsonc`, `_headers` (CSP & security), `_redirects` |
| Design system | `assets/css/mohor.css` (+ `assets/css/pages/*`) |
| Shared front-end modules | `assets/js/core/*` (no build step, ES modules + JSDoc types) |
| Pages | `*.html` + `assets/js/pages/*` |
| Admin | `/admin` |
| Offline / PWA | `sw.js`, `manifest.webmanifest` |

Pages: home, shop (search · sort · filter), product, cart, checkout, order success, order detail, orders & tracking,
account, login/sign-up, wishlist, about, policy, 404, admin.

## Setup
See **[docs/DEPLOY.md](docs/DEPLOY.md)**. Secrets are set in Cloudflare, never in this repo.

## Local dev
```sh
npx wrangler dev   # uses your D1 binding; add --remote for live data
```
