# Changelog

## 2.0.0 — 2026-10
- Moved fully to Cloudflare Workers + D1; removed Firebase and Pages Functions.
- Telegram order alerts kept, sent from the main Worker (escaped HTML, non-blocking).
- New mobile-first design system, bottom tab bar, bilingual (EN/BN) UI, dark mode.
- Rebuilt every page; shop gains search, sort, filters and shareable URLs.
- Server-side pricing & stock, guest order tracking, policy acceptance at checkout.
- New admin: dashboard, orders (bulk, CSV, print), full product editor with variant stock and image upload, banners, settings, notifications, customers.
- Security: no secrets in repo, PBKDF2 passwords, expiring revocable tokens, rate limits, CSP.
- Clean URLs; twin `folder/index.html` pages removed; redirects for old links.
