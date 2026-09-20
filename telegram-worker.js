/**
 * Cloudflare Worker endpoint for Mohor order notifications.
 *
 * Configure these Worker secrets:
 *   TELEGRAM_BOT_TOKEN
 *   TELEGRAM_CHAT_ID
 *
 * Deploy this file separately, then expose its URL as
 * window.MOHOR_TELEGRAM_ENDPOINT before app.js loads.
 */

const allowedOrigin = 'https://mohor.me';

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin === allowedOrigin ? origin : allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[character]));
}

function buildMessage(order) {
  const items = Array.isArray(order.items) && order.items.length
    ? order.items.map((item) => (
      `• ${escapeHtml(item.name || 'Item')} (x${Number(item.qty) || 1}) - ৳${Number(item.price) || 0}`
    )).join('\n')
    : 'No items detailed';

  return [
    '<b>NEW ORDER PLACED</b>',
    '',
    `Customer: <b>${escapeHtml(order.customerName || 'N/A')}</b>`,
    `Phone: <b>${escapeHtml(order.customerPhone || 'N/A')}</b>`,
    `Address: <b>${escapeHtml(order.deliveryAddress || 'N/A')}</b>`,
    '',
    '<b>Order Items:</b>',
    items,
    '',
    `Subtotal: ৳${Number(order.subtotal) || 0}`,
    `Total: ৳${Number(order.totalAmount) || 0}`,
    `Order ID: ${escapeHtml(order.id || 'N/A')}`
  ].join('\n');
}

export default {
  async fetch(request, env) {
    const botToken = env.TELEGRAM_BOT_TOKEN || "8931701022:AAFFKEtKLUTgoGctWm-sPtqWXM2DcxljG7k"; 
    const chatId = env.TELEGRAM_CHAT_ID || "8349757290"; 

    const origin = request.headers.get('Origin') || '';
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(origin) });
    }
    if (request.method !== 'POST' || origin !== allowedOrigin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders(origin) });
    }

    try {
      const payload = await request.json();
      const order = payload && payload.order;
      if (!order || !order.customerName || !order.customerPhone || !Array.isArray(order.items)) {
        return new Response(JSON.stringify({ error: 'Invalid order payload' }), { status: 400, headers: corsHeaders(origin) });
      }

      const telegramResponse = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: buildMessage(order),
            parse_mode: 'HTML'
          })
        }
      );

      if (!telegramResponse.ok) {
        return new Response(JSON.stringify({ error: 'Telegram delivery failed' }), { status: 502, headers: corsHeaders(origin) });
      }
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders(origin) });
    } catch (error) {
      console.error('Telegram worker error:', error);
      return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400, headers: corsHeaders(origin) });
    }
  }
};
