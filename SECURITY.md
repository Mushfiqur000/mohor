# Security

- Secrets live only in Cloudflare (`wrangler secret put`). The repo contains no tokens or passwords.
- Passwords: PBKDF2-SHA256 (100k iterations, per-user salt); legacy hashes upgraded on login.
- Sessions: signed HS256 tokens, 30-day expiry, revocable ("sign out everywhere", password change). Roles are always read from the database.
- Admin: bootstrapped only from `ADMIN_EMAIL` + `ADMIN_PASSWORD` secret; the admin email cannot be registered publicly.
- Orders: prices, discounts, delivery fee and stock are recalculated on the server.
- Rate limiting on login, register, order and tracking endpoints.
- Strict CSP, HSTS, frame denial, same-origin API writes; all rendered data is HTML-escaped.

Report a vulnerability privately via the contact details on https://mohor.me/about.
