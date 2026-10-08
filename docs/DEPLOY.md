# Deploying Mohor v2 (Cloudflare Workers + D1, free plan)

Everything — pages, API, database, Telegram alerts — runs on **one Worker named `mohor`**.
Firebase is no longer used anywhere.

## 1. Replace the repo contents

1. Unzip this package over a fresh checkout of your repo.
2. **Delete these legacy files/folders** (they are replaced or no longer needed):
   - Twin folders: `about/ account/ cart/ login/ order/ order-history/ order-success/ policy/ product/ wishlist/`
     (clean URLs are now handled by Cloudflare — `/about` serves `about.html`).
   - `functions/` (old Pages Functions — the Worker handles the API).
   - Legacy JS/CSS: `app.js auth.js cart.js products.js wishlist.js account.js admin.js style.css home.css`
   - `signup.html` (now `/login?mode=signup`, redirect included), `order-history.html` (now `/orders`).
   - Root `telegram-worker.js` (hardened copy is in `workers/`).
   - Any Firebase config files.
3. Commit and push.

## 2. Secrets (set in the dashboard or with Wrangler — NEVER in files)

Dashboard: **Workers & Pages → mohor → Settings → Variables and Secrets → Add → type "Secret"**.
Or from a terminal:

```sh
npx wrangler secret put JWT_SECRET          # long random string, 32+ chars (e.g. `openssl rand -base64 48`)
npx wrangler secret put ADMIN_PASSWORD      # your NEW admin password
npx wrangler secret put TELEGRAM_BOT_TOKEN  # NEW token from @BotFather (/revoke the old one)
npx wrangler secret put TELEGRAM_CHAT_ID
npx wrangler secret put UPLOAD_SECRET        # matches the existing uploader secret name
# UPLOADER_SECRET is also accepted for compatibility.
# optional
npx wrangler secret put META_CAPI_TOKEN
npx wrangler secret put TWILIO_ACCOUNT_SID
npx wrangler secret put TWILIO_AUTH_TOKEN
npx wrangler secret put TWILIO_FROM_NUMBER
```

Plain (non-secret) vars are in `wrangler.jsonc`: `ADMIN_EMAIL`, `PUBLIC_ORIGIN`, `R2_PUBLIC_URL`, `UPLOADER_URL`, `META_PIXEL_ID`.

### Rotate leaked credentials (important)
The old repo was public and contained the Telegram bot token, the R2 upload secret and a JWT fallback.
- Revoke the Telegram token in @BotFather and set the new one.
- Change the uploader secret on the `mohor-uploader` worker and set the same value as `UPLOAD_SECRET` here.
- Use a **new** admin password and a **new** JWT secret (setting a new JWT secret signs everyone out once — expected).

## 3. Database

`wrangler.jsonc` binds your existing D1 database `mohor-db` as `DB`. The Worker upgrades the schema itself
on first request (adds missing tables/columns, never drops data). Existing users keep working;
their passwords are re-hashed with PBKDF2 automatically when they next sign in.

## 4. Images (optional, recommended)

To upload straight to R2 instead of the separate uploader worker, uncomment `r2_buckets` in
`wrangler.jsonc` (binding `IMAGES`, your bucket name) and set `R2_PUBLIC_URL` to the bucket's public URL.

## 5. Deploy

Connected to Git: pushing deploys automatically. Manual: `npx wrangler deploy`.

Check: open `https://mohor.me/api/health` → `{"ok":true}`. Sign in at `/admin` with `ADMIN_EMAIL` + `ADMIN_PASSWORD`,
then press **Settings → Send Telegram test**.

## 6. Other workers
- `mohor-telegram`: no longer required (alerts are sent by `mohor`). Keep or redeploy `workers/telegram-worker.js` (needs `RELAY_SECRET`).
- `meta-capi`: no longer required — conversions are sent server-side by `mohor` when `META_CAPI_TOKEN` is set.
