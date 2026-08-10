Mohor Clothings
Storefront and admin dashboard for Mohor Clothings — handcrafted three-piece
sets, kurtis, and khadi wear, based in Sylhet, Bangladesh. Live at
mohor.me.
A static, framework-free site (HTML/CSS/vanilla JS) backed by Firebase
(Firestore + Auth), deployed on GitHub Pages via the `CNAME` file. No build
step — every file is served as-is.
Structure
```
index.html      Homepage — hero, shop grid, filters, quick-view modal
about.html      Brand story
policy.html     Delivery & return policy
cart.html       Standalone checkout page (used on mobile / direct link)
product.html    Standalone product detail page (used on mobile)
login.html      Standalone login / signup page
admin.html      Admin dashboard (orders, products, inventory) — not linked
                from the storefront nav; bookmark it directly

style.css       Shared design system for the storefront (all six pages above)
app.js          i18n (EN/BN), product catalog loading + rendering, quick-view
                modal, nav interactions, toast notifications
cart.js         Cart state, cart UI, WhatsApp + website checkout
auth.js         Firebase Auth, saved profile, order history
products.js     Static fallback product catalog (used only if Firestore is
                empty/unreachable — the live catalog is managed from the
                Admin dashboard)

assets/         Logo marks, favicons, hero images, OG image, placeholder art
banner.png      Original hero photography (source asset)
favicon.jpeg    Original logo mark (source asset)
CNAME           GitHub Pages custom domain (mohor.me)
_nojekyll       Disables Jekyll processing on GitHub Pages
```
Local development
No build step is required. Serve the folder with any static file server, e.g.:
```
python3 -m http.server 8080
```
then open `http://localhost:8080`.
Firebase
The site uses the Firebase compat SDK (loaded from the `gstatic.com` CDN
in each page's `<head>`/body) for:
Firestore — `products` collection (live catalog, managed from
`admin.html`) and `orders` collection (placed from the storefront).
Auth — email/password accounts, used to save a customer's name, phone
and address for faster repeat checkout, and to show their order history.
The Firebase config object (API key, project ID, etc.) is intentionally
public in the client code — this is normal for Firebase web apps. Actual
access control is enforced through Firestore Security Rules, configured
in the Firebase console, not in this repository.
Order totals are recomputed from the live catalog before being saved (see
`getCanonicalPrice` in `cart.js`), so a tampered client-side price can't be
submitted directly. This is a client-side mitigation only — for a hard
guarantee, validate totals again in Firestore Security Rules or a Cloud
Function.
Admin dashboard
`admin.html` is a self-contained dashboard (orders, products, inventory,
CSV export) for managing the store day-to-day. It isn't linked from the
public nav — bookmark `/admin.html` directly, and sign in with a Firebase
Auth account that your Firestore rules grant admin access to.
Deployment
Push to the branch configured for GitHub Pages. The `CNAME` file points the
custom domain (`mohor.me`) at this repository; `_nojekyll` tells GitHub
Pages to serve the files exactly as they are, without running them through
Jekyll first.
Language
The storefront supports English and Bengali via a client-side toggle
(top-right of the nav), persisted in `localStorage`. All UI strings live in
`window.uiTranslations` in `app.js`; product content (title, description,
etc.) can be a `{ en, bn }` object in Firestore/`products.js` or a plain
string.
