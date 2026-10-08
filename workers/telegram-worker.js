/**
 * OPTIONAL standalone Telegram relay (worker name: mohor-telegram).
 *
 * The main `mohor` worker already sends order alerts directly, so you only
 * need this if another service must push messages to the bot.
 *
 * Secrets (never hard-code them):  wrangler secret put TELEGRAM_BOT_TOKEN
 *                                  wrangler secret put TELEGRAM_CHAT_ID
 *                                  wrangler secret put RELAY_SECRET
 * Call: POST / with header `Authorization: Bearer <RELAY_SECRET>` and JSON {"text": "..."}.
 */
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });

function safeEqual(a = '', b = '') {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    if (!env.RELAY_SECRET || !env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return json({ error: 'Relay not configured' }, 500);
    const auth = request.headers.get('authorization') || '';
    if (!safeEqual(auth, `Bearer ${env.RELAY_SECRET}`)) return json({ error: 'Unauthorized' }, 401);

    let body;
    try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
    const text = String(body?.text ?? '').slice(0, 4000);
    if (!text.trim()) return json({ error: 'text is required' }, 400);

    const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text, disable_web_page_preview: true }),
    });
    return json({ ok: res.ok }, res.ok ? 200 : 502);
  },
};
