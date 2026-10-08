// ==========================================================================
// MOHOR CLOTHINGS — Cloudflare Worker API (v2)
// Runs only for /api/* (see wrangler.jsonc "run_worker_first"). Every other
// request is served straight from static assets, so the free plan's daily
// invocation budget is spent on the API alone.
//
// Bindings
//   DB              D1 database (mohor-db)
//   ASSETS          static assets (this folder)
//   IMAGES          optional R2 bucket for product/banner uploads
// Secrets (wrangler secret put … / dashboard → Settings → Variables)
//   JWT_SECRET            required — signs login tokens
//   ADMIN_PASSWORD        required — bootstrap/recovery password for ADMIN_EMAIL
//   TELEGRAM_BOT_TOKEN    order alerts to the owner
//   TELEGRAM_CHAT_ID
//   UPLOADER_SECRET / UPLOAD_SECRET
//                         optional — only if IMAGES is not bound and the legacy
//                         mohor-uploader worker is used instead
//   TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER   optional SMS
//   META_CAPI_TOKEN       optional — Meta Conversions API access token
// Vars (plain text)
//   ADMIN_EMAIL, PUBLIC_ORIGIN, R2_PUBLIC_URL, UPLOADER_URL, META_PIXEL_ID
// ==========================================================================

const JSON_FIELDS = new Set([
  'title', 'description', 'images', 'sizes', 'colors', 'sizeQuantities', 'variantStock',
  'sizeMeasurements', 'measurementsGuide', 'details', 'materials', 'care', 'seoKeywords',
  'items', 'data', 'cart_data',
]);

const PRODUCT_COLUMNS = {
  title: 'TEXT', description: 'TEXT', price: 'REAL', originalPrice: 'REAL', regularPrice: 'REAL',
  salePrice: 'REAL', onSale: 'INTEGER', category: 'TEXT', images: 'TEXT', thumbnail: 'TEXT',
  sizes: 'TEXT', colors: 'TEXT', sizeQuantities: 'TEXT', variantStock: 'TEXT', sizeMeasurements: 'TEXT',
  measurementsGuide: 'TEXT', details: 'TEXT', materials: 'TEXT', care: 'TEXT', seoKeywords: 'TEXT',
  quantity: 'INTEGER', displayOrder: 'INTEGER', featured: 'INTEGER', status: 'TEXT',
  createdAt: 'TEXT', updatedAt: 'TEXT',
};

const SCHEMA = {
  users: {
    create: `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL, name TEXT, phone TEXT, role TEXT DEFAULT 'customer',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP)`,
    columns: { name: 'TEXT', phone: 'TEXT', role: 'TEXT', gender: 'TEXT', dob: 'TEXT', address: 'TEXT',
      status: 'TEXT', token_version: 'INTEGER DEFAULT 0', created_at: 'TEXT' },
  },
  products: {
    create: `CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY)`,
    columns: PRODUCT_COLUMNS,
  },
  orders: {
    create: `CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`,
    columns: { id: 'TEXT', user_id: 'TEXT', user_email: 'TEXT', customer_name: 'TEXT', customer_phone: 'TEXT',
      delivery_address: 'TEXT', delivery_zone: 'TEXT', delivery_fee: 'REAL', items: 'TEXT', subtotal: 'REAL',
      discount: 'REAL', total_amount: 'REAL', status: 'TEXT', payment_method: 'TEXT', note: 'TEXT',
      channel: 'TEXT', created_at: 'TEXT', updated_at: 'TEXT' },
  },
  banners: {
    create: `CREATE TABLE IF NOT EXISTS banners (id TEXT PRIMARY KEY)`,
    columns: { title: 'TEXT', subtitle: 'TEXT', imageUrl: 'TEXT', link: 'TEXT', buttonText: 'TEXT',
      active: 'INTEGER', objectPosition: 'TEXT', displayOrder: 'INTEGER' },
  },
  settings: {
    create: `CREATE TABLE IF NOT EXISTS settings (id TEXT PRIMARY KEY)`,
    columns: { data: 'TEXT' },
  },
  notifications: {
    create: `CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
      title TEXT NOT NULL, message TEXT NOT NULL, type TEXT DEFAULT 'general', link TEXT,
      is_read INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`,
    columns: {},
  },
  user_carts: {
    create: `CREATE TABLE IF NOT EXISTS user_carts (user_id TEXT PRIMARY KEY, cart_data TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`,
    columns: {},
  },
  rate_limits: {
    create: `CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at INTEGER NOT NULL)`,
    columns: {},
  },
};

const ORDER_STATUSES = ['Pending', 'Confirmed', 'Shipped', 'Completed', 'Cancelled'];
const DEFAULT_SETTINGS = {
  deliveryInside: 70, deliveryOutside: 140, freeDeliveryThreshold: 0,
  saleActive: false, discountPercent: 0, bannerText: '', bannerBadge: '', saleEndTime: '',
  whatsapp: '8801330113027', phone: '+8801330113027', email: '',
  announcement: '', maxQtyPerItem: 10,
};
const PBKDF2_ITERATIONS = 100000;
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;

// --------------------------------------------------------------------------
// Small utilities
// --------------------------------------------------------------------------

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const enc = new TextEncoder();
const b64url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64urlDecode = str => {
  const s = str.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(s + '='.repeat((4 - (s.length % 4)) % 4)), c => c.charCodeAt(0));
};
const b64 = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const unb64 = str => Uint8Array.from(atob(str), c => c.charCodeAt(0));
const hex = bytes => [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('');

function timingSafeEqual(a, b) {
  const x = typeof a === 'string' ? enc.encode(a) : a;
  const y = typeof b === 'string' ? enc.encode(b) : b;
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}

const str = (value, max = 500) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const num = (value, fallback = 0) => (Number.isFinite(Number(value)) ? Number(value) : fallback);
const isEmail = value => /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(value);
const normalizeEmail = value => str(value, 254).toLowerCase();
const normalizePhone = value => {
  const digits = String(value || '').replace(/[^\d]/g, '');
  if (digits.startsWith('8801') && digits.length === 13) return '0' + digits.slice(3);
  return digits;
};
const isBdPhone = value => /^01[3-9]\d{8}$/.test(normalizePhone(value));
const safeLink = value => {
  const link = str(value, 500);
  if (!link) return '';
  if (link.startsWith('/') && !link.startsWith('//')) return link;
  if (link.startsWith('#')) return link;
  try {
    const parsed = new URL(link);
    return ['https:', 'http:'].includes(parsed.protocol) ? parsed.href : '';
  } catch { return ''; }
};
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function randomId(prefix, length = 8) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return prefix + [...bytes].map(b => alphabet[b % alphabet.length]).join('');
}

function parseRow(row) {
  if (!row) return row;
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    if (typeof value === 'string' && JSON_FIELDS.has(key)) {
      const trimmed = value.trim();
      if (/^[[{]/.test(trimmed)) {
        try { out[key] = JSON.parse(trimmed); continue; } catch { /* keep raw */ }
      }
    }
    out[key] = value;
  }
  return out;
}

const toDb = value => (value !== null && typeof value === 'object' ? JSON.stringify(value) : value);

// --------------------------------------------------------------------------
// Schema — idempotent, runs once per isolate. Adds any missing columns so
// the existing production tables keep their data.
// --------------------------------------------------------------------------

let schemaReady = null;
const tableColumns = new Map();

async function ensureSchema(env) {
  if (!schemaReady) {
    schemaReady = (async () => {
      for (const [table, def] of Object.entries(SCHEMA)) {
        await env.DB.prepare(def.create).run();
        const { results = [] } = await env.DB.prepare(`PRAGMA table_info(${table})`).all();
        const existing = new Set(results.map(c => c.name));
        for (const [column, type] of Object.entries(def.columns)) {
          if (!existing.has(column)) {
            await env.DB.prepare(`ALTER TABLE ${table} ADD COLUMN "${column}" ${type}`).run();
            existing.add(column);
          }
        }
        tableColumns.set(table, existing);
      }
      // Legacy orders keyed by order_id: backfill the canonical id column.
      if (tableColumns.get('orders').has('order_id')) {
        await env.DB.prepare('UPDATE orders SET id = order_id WHERE id IS NULL').run();
      }
      await env.DB.prepare('DELETE FROM rate_limits WHERE reset_at < ?').bind(Date.now()).run();
    })().catch(error => { schemaReady = null; throw error; });
  }
  return schemaReady;
}

// --------------------------------------------------------------------------
// Crypto: PBKDF2 passwords (legacy SHA-256 hashes upgrade on login) and JWT
// --------------------------------------------------------------------------

async function pbkdf2(password, salt, iterations = PBKDF2_ITERATIONS) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
}

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const bits = await pbkdf2(password, salt);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${b64(salt)}$${b64(bits)}`;
}

/** @returns {Promise<{ ok: boolean, legacy: boolean }>} */
async function verifyPassword(password, stored) {
  if (typeof stored !== 'string' || !stored) return { ok: false, legacy: false };
  if (stored.startsWith('pbkdf2$')) {
    const [, iterations, salt, hash] = stored.split('$');
    const bits = await pbkdf2(password, unb64(salt), Number(iterations));
    return { ok: timingSafeEqual(new Uint8Array(bits), unb64(hash)), legacy: false };
  }
  if (/^[a-f0-9]{64}$/i.test(stored)) {
    const digest = hex(await crypto.subtle.digest('SHA-256', enc.encode(password)));
    return { ok: timingSafeEqual(digest, stored.toLowerCase()), legacy: true };
  }
  return { ok: false, legacy: false };
}

async function hmacKey(secret) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

async function signJWT(payload, secret) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(enc.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body = b64url(enc.encode(JSON.stringify({ ...payload, iat: now, exp: now + TOKEN_TTL_SECONDS })));
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(`${header}.${body}`));
  return `${header}.${body}.${b64url(signature)}`;
}

async function verifyJWT(token, secret) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;
  try {
    const valid = await crypto.subtle.verify('HMAC', await hmacKey(secret), b64urlDecode(parts[2]), enc.encode(`${parts[0]}.${parts[1]}`));
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(parts[1])));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}

// --------------------------------------------------------------------------
// Request context
// --------------------------------------------------------------------------

function createContext(request, env, ctx) {
  const url = new URL(request.url);
  const allowedOrigins = new Set([env.PUBLIC_ORIGIN || 'https://mohor.me', 'https://mohor.me', 'https://www.mohor.me']);
  const origin = request.headers.get('Origin');
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

  const baseHeaders = () => {
    const headers = new Headers({
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      Vary: 'Origin',
    });
    if (origin && (allowedOrigins.has(origin) || url.origin === origin)) {
      headers.set('Access-Control-Allow-Origin', origin);
      headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      headers.set('Access-Control-Max-Age', '86400');
    }
    return headers;
  };

  const json = (body, status = 200, extra = {}) => {
    const headers = baseHeaders();
    for (const [k, v] of Object.entries(extra)) headers.set(k, v);
    return new Response(JSON.stringify(body), { status, headers });
  };

  async function body() {
    const type = request.headers.get('Content-Type') || '';
    if (!type.includes('application/json')) throw new HttpError(415, 'Expected JSON');
    const text = await request.text();
    if (text.length > 512 * 1024) throw new HttpError(413, 'Request too large');
    try { return text ? JSON.parse(text) : {}; } catch { throw new HttpError(400, 'Invalid JSON'); }
  }

  /** Fixed-window limiter stored in D1. */
  async function rateLimit(bucket, limit, windowSeconds) {
    const key = `${bucket}:${ip}`;
    const now = Date.now();
    const row = await env.DB.prepare('SELECT count, reset_at FROM rate_limits WHERE key = ?').bind(key).first();
    if (!row || row.reset_at < now) {
      await env.DB.prepare('INSERT OR REPLACE INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?)')
        .bind(key, now + windowSeconds * 1000).run();
      return;
    }
    if (row.count >= limit) throw new HttpError(429, 'Too many requests. Please wait a moment and try again.');
    await env.DB.prepare('UPDATE rate_limits SET count = count + 1 WHERE key = ?').bind(key).run();
  }

  let cachedUser;
  /** Resolves the bearer token against the database (role is never trusted from the token). */
  async function currentUser() {
    if (cachedUser !== undefined) return cachedUser;
    cachedUser = null;
    const auth = request.headers.get('Authorization') || '';
    if (!auth.startsWith('Bearer ')) return null;
    const payload = await verifyJWT(auth.slice(7), env.JWT_SECRET);
    if (!payload?.sub) return null;
    const user = await env.DB.prepare('SELECT * FROM users WHERE id = ? LIMIT 1').bind(payload.sub).first();
    if (!user || user.status === 'deleted') return null;
    if ((user.token_version || 0) !== (payload.tv || 0)) return null;
    cachedUser = user;
    return user;
  }

  async function requireUser() {
    const user = await currentUser();
    if (!user) throw new HttpError(401, 'Please sign in to continue.');
    return user;
  }

  async function requireAdmin() {
    const user = await requireUser();
    if (user.role !== 'admin') throw new HttpError(403, 'Admin access required.');
    return user;
  }

  const background = promise => ctx.waitUntil(Promise.resolve(promise).catch(e => console.error(e)));

  return { url, request, env, ip, json, body, rateLimit, currentUser, requireUser, requireAdmin, background, baseHeaders };
}

// --------------------------------------------------------------------------
// Domain helpers
// --------------------------------------------------------------------------

function publicUser(user) {
  return {
    id: user.id, email: user.email, name: user.name || '', phone: user.phone || '',
    gender: user.gender || '', dob: user.dob || '', address: user.address || '',
    role: user.role === 'admin' ? 'admin' : 'customer', createdAt: user.created_at || null,
  };
}

async function issueToken(env, user) {
  return signJWT({ sub: user.id, tv: user.token_version || 0 }, env.JWT_SECRET);
}

async function getSettings(env) {
  const row = await env.DB.prepare("SELECT * FROM settings WHERE id = 'storefront' LIMIT 1").first()
    || await env.DB.prepare('SELECT * FROM settings LIMIT 1').first();
  const parsed = parseRow(row || {});
  const { data, id, ...columns } = parsed;
  return { ...DEFAULT_SETTINGS, ...columns, ...(data && typeof data === 'object' ? data : {}) };
}

function normalizeProduct(row) {
  const p = parseRow(row);
  // Legacy pricing fields → canonical price / originalPrice
  const regular = num(p.regularPrice);
  const sale = num(p.salePrice);
  let price = num(p.price);
  let originalPrice = num(p.originalPrice);
  if (!price && sale) price = sale;
  if (!price && regular) price = regular;
  if (!originalPrice && regular > price) originalPrice = regular;
  return {
    ...p,
    id: String(p.id),
    price,
    originalPrice: originalPrice > price ? originalPrice : 0,
    images: Array.isArray(p.images) ? p.images.filter(i => typeof i === 'string') : (p.images ? [String(p.images)] : []),
    sizes: Array.isArray(p.sizes) && p.sizes.length ? p.sizes.map(String) : ['Standard'],
    quantity: num(p.quantity),
    displayOrder: num(p.displayOrder),
    featured: Boolean(num(p.featured)),
    status: p.status || 'active',
  };
}

function colorKeys(product) {
  const list = Array.isArray(product.colors) ? product.colors : (product.colors?.en || []);
  return list.map(c => (typeof c === 'string' ? c : c?.name?.en || c?.name || '')).filter(Boolean);
}

function stockFor(product, size, color) {
  const sizeKey = String(size || 'Standard');
  const variants = product.variantStock;
  if (variants && typeof variants === 'object' && color) {
    if (variants[`${color}::${sizeKey}`] !== undefined) return Math.max(0, num(variants[`${color}::${sizeKey}`]));
    if (variants[color]?.[sizeKey] !== undefined) return Math.max(0, num(variants[color][sizeKey]));
  }
  if (product.sizeQuantities && product.sizeQuantities[sizeKey] !== undefined) {
    return Math.max(0, num(product.sizeQuantities[sizeKey]));
  }
  return Math.max(0, num(product.quantity));
}

/** Mutates stock in-place by delta (negative = sell). Returns the changed fields. */
function adjustStock(product, size, color, delta) {
  const sizeKey = String(size || 'Standard');
  const variants = product.variantStock && typeof product.variantStock === 'object' ? { ...product.variantStock } : null;
  const changed = {};
  if (variants && color && variants[`${color}::${sizeKey}`] !== undefined) {
    variants[`${color}::${sizeKey}`] = Math.max(0, num(variants[`${color}::${sizeKey}`]) + delta);
    changed.variantStock = variants;
  }
  if (product.sizeQuantities && product.sizeQuantities[sizeKey] !== undefined) {
    const sq = { ...product.sizeQuantities };
    sq[sizeKey] = Math.max(0, num(sq[sizeKey]) + delta);
    changed.sizeQuantities = sq;
  }
  changed.quantity = Math.max(0, num(product.quantity) + delta);
  Object.assign(product, changed);
  return changed;
}

/** Selling price for one unit, applying a storewide sale when the product has no own discount. */
function unitPrice(product, settings) {
  let price = product.price;
  const pct = num(settings.discountPercent);
  const saleRunning = settings.saleActive && pct > 0 && pct < 90
    && (!settings.saleEndTime || Date.parse(settings.saleEndTime) > Date.now());
  if (saleRunning && !(product.originalPrice > product.price)) price = Math.round(price * (1 - pct / 100));
  return Math.max(0, Math.round(price));
}

async function updateRow(env, table, id, fields) {
  const available = tableColumns.get(table);
  const columns = Object.keys(fields).filter(c => available.has(c));
  if (!columns.length) return;
  await env.DB.prepare(`UPDATE ${table} SET ${columns.map(c => `"${c}" = ?`).join(', ')} WHERE id = ?`)
    .bind(...columns.map(c => toDb(fields[c])), id).run();
}

async function insertRow(env, table, fields) {
  const available = tableColumns.get(table);
  const columns = Object.keys(fields).filter(c => available.has(c) && fields[c] !== undefined);
  await env.DB.prepare(`INSERT INTO ${table} (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`)
    .bind(...columns.map(c => toDb(fields[c]))).run();
}

async function createNotification(env, { userId, title, message, type = 'general', link = '' }) {
  await env.DB.prepare('INSERT INTO notifications (id, user_id, title, message, type, link, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?)')
    .bind('ntf_' + crypto.randomUUID(), userId, str(title, 120), str(message, 1000), str(type, 30) || 'general', safeLink(link), new Date().toISOString())
    .run();
}

function normalizeOrder(row) {
  const o = parseRow(row);
  return {
    id: o.id ?? o.order_id,
    userId: o.user_id ?? o.userId ?? null,
    userEmail: o.user_email ?? o.userEmail ?? null,
    customerName: o.customer_name ?? o.customerName ?? '',
    customerPhone: o.customer_phone ?? o.customerPhone ?? '',
    deliveryAddress: o.delivery_address ?? o.deliveryAddress ?? '',
    deliveryZone: o.delivery_zone ?? '',
    deliveryFee: num(o.delivery_fee),
    items: Array.isArray(o.items) ? o.items : [],
    subtotal: num(o.subtotal),
    discount: num(o.discount),
    totalAmount: num(o.total_amount ?? o.totalAmount ?? o.total),
    status: o.status || o.order_status || 'Pending',
    paymentMethod: o.payment_method || 'COD',
    note: o.note || '',
    channel: o.channel || 'website',
    createdAt: o.created_at ?? o.orderDate ?? o.order_date ?? null,
    updatedAt: o.updated_at ?? null,
  };
}

const orderSort = (a, b) => (Date.parse(b.createdAt || '') || 0) - (Date.parse(a.createdAt || '') || 0);

async function sendTelegram(env, html) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return;
  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: html, parse_mode: 'HTML', disable_web_page_preview: true }),
  });
  if (!response.ok) console.error('Telegram error', response.status, await response.text());
}

function orderTelegramMessage(order, origin) {
  const items = order.items.map(i => `• ${escapeHtml(i.title)}${i.size ? ` — ${escapeHtml(i.size)}` : ''}${i.color ? ` / ${escapeHtml(i.color)}` : ''} × ${i.qty} = ৳${i.lineTotal}`).join('\n');
  return [
    '🛍️ <b>NEW ORDER — MOHOR</b>',
    '',
    `<b>Order:</b> <code>${escapeHtml(order.id)}</code>`,
    `<b>Customer:</b> ${escapeHtml(order.customerName)}`,
    `<b>Phone:</b> ${escapeHtml(order.customerPhone)}`,
    `<b>Address:</b> ${escapeHtml(order.deliveryAddress)}`,
    `<b>Zone:</b> ${escapeHtml(order.deliveryZone)}`,
    order.note ? `<b>Note:</b> ${escapeHtml(order.note)}` : '',
    '',
    items,
    '',
    `Subtotal: ৳${order.subtotal}`,
    order.discount ? `Discount: −৳${order.discount}` : '',
    `Delivery: ৳${order.deliveryFee}`,
    `<b>Total: ৳${order.totalAmount}</b> (${escapeHtml(order.paymentMethod)})`,
    order.userEmail ? `Account: ${escapeHtml(order.userEmail)}` : 'Guest checkout',
    `${origin}/admin`,
  ].filter(line => line !== '').join('\n');
}

async function sendSms(env, phone, message) {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_FROM_NUMBER) return;
  const local = normalizePhone(phone);
  if (!isBdPhone(local)) return;
  const body = new URLSearchParams({ To: `+88${local}`, From: env.TWILIO_FROM_NUMBER, Body: message });
  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`, {
    method: 'POST',
    headers: { Authorization: `Basic ${btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`)}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
}

async function sha256Hex(value) {
  return hex(await crypto.subtle.digest('SHA-256', enc.encode(String(value).trim().toLowerCase())));
}

/** Server-side Meta Conversions API event. Silently skipped when not configured. */
async function sendMetaEvent(env, c, eventName, { eventId, value, contents, email, phone, sourceUrl } = {}) {
  if (!env.META_CAPI_TOKEN || !env.META_PIXEL_ID) return;
  const user_data = {
    client_ip_address: c.ip,
    client_user_agent: c.request.headers.get('User-Agent') || '',
  };
  if (email) user_data.em = [await sha256Hex(email)];
  if (phone) user_data.ph = [await sha256Hex('88' + normalizePhone(phone))];
  const event = {
    event_name: eventName, event_time: Math.floor(Date.now() / 1000), action_source: 'website',
    event_id: eventId, event_source_url: sourceUrl || c.env.PUBLIC_ORIGIN || 'https://mohor.me', user_data,
    custom_data: value !== undefined ? { currency: 'BDT', value, contents, content_type: 'product' } : undefined,
  };
  await fetch(`https://graph.facebook.com/v19.0/${env.META_PIXEL_ID}/events?access_token=${encodeURIComponent(env.META_CAPI_TOKEN)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: [event] }),
  });
}

// --------------------------------------------------------------------------
// Route handlers
// --------------------------------------------------------------------------

const routes = [];
const route = (method, path, handler) => routes.push({ method, path, handler });

// ---- Health & config ------------------------------------------------------

route('GET', '/api/health', c => c.json({ ok: true, time: new Date().toISOString() }));

route('GET', '/api/settings', async c => {
  const settings = await getSettings(c.env);
  return c.json(settings, 200, { 'Cache-Control': 'public, max-age=60' });
});

route('PUT', '/api/settings', async c => {
  await c.requireAdmin();
  const input = await c.body();
  const current = await getSettings(c.env);
  const allowed = Object.keys(DEFAULT_SETTINGS);
  const next = { ...current };
  for (const key of allowed) {
    if (!(key in input)) continue;
    const def = DEFAULT_SETTINGS[key];
    next[key] = typeof def === 'number' ? Math.max(0, num(input[key], def))
      : typeof def === 'boolean' ? Boolean(input[key])
      : str(input[key], 500);
  }
  next.discountPercent = Math.min(90, next.discountPercent);
  const data = Object.fromEntries(allowed.map(k => [k, next[k]]));
  await c.env.DB.prepare("INSERT INTO settings (id, data) VALUES ('storefront', ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data")
    .bind(JSON.stringify(data)).run();
  return c.json({ success: true, settings: data });
});
route('POST', '/api/settings', c => routes.find(r => r.method === 'PUT' && r.path === '/api/settings').handler(c));

// ---- Auth -----------------------------------------------------------------

route('POST', '/api/auth/register', async c => {
  await c.rateLimit('register', 5, 3600);
  const input = await c.body();
  const email = normalizeEmail(input.email);
  const password = typeof input.password === 'string' ? input.password : '';
  const name = str(input.name, 100);
  const phone = normalizePhone(input.phone);
  if (!isEmail(email)) throw new HttpError(400, 'Please enter a valid email address.');
  if (password.length < 8 || password.length > 128) throw new HttpError(400, 'Password must be 8–128 characters.');
  if (!name) throw new HttpError(400, 'Please enter your name.');
  if (phone && !isBdPhone(phone)) throw new HttpError(400, 'Please enter a valid Bangladeshi mobile number.');
  if (email === normalizeEmail(c.env.ADMIN_EMAIL)) throw new HttpError(400, 'This email cannot be registered here.');
  const existing = await c.env.DB.prepare('SELECT id FROM users WHERE lower(email) = ?').bind(email).first();
  if (existing) throw new HttpError(409, 'An account with this email already exists. Please sign in.');
  const user = { id: 'usr_' + crypto.randomUUID(), email, password_hash: await hashPassword(password), name, phone,
    role: 'customer', status: 'active', token_version: 0, created_at: new Date().toISOString() };
  await insertRow(c.env, 'users', user);
  return c.json({ token: await issueToken(c.env, user), user: publicUser(user) }, 201);
});

route('POST', '/api/auth/login', async c => {
  await c.rateLimit('login', 10, 900);
  const input = await c.body();
  const email = normalizeEmail(input.email);
  const password = typeof input.password === 'string' ? input.password : '';
  if (!email || !password) throw new HttpError(400, 'Email and password are required.');
  let user = await c.env.DB.prepare('SELECT * FROM users WHERE lower(email) = ? LIMIT 1').bind(email).first();
  const isAdminEmail = c.env.ADMIN_EMAIL && email === normalizeEmail(c.env.ADMIN_EMAIL);

  let { ok, legacy } = user ? await verifyPassword(password, user.password_hash) : { ok: false, legacy: false };

  // Admin bootstrap/recovery: the ADMIN_PASSWORD secret always works for ADMIN_EMAIL.
  if (!ok && isAdminEmail && c.env.ADMIN_PASSWORD && timingSafeEqual(password, c.env.ADMIN_PASSWORD)) {
    if (!user) {
      user = { id: 'admin_super', email, password_hash: await hashPassword(password), name: 'Mohor Admin', phone: '',
        role: 'admin', status: 'active', token_version: 0, created_at: new Date().toISOString() };
      await insertRow(c.env, 'users', user);
    }
    ok = true; legacy = true;
  }
  if (!ok || !user || user.status === 'deleted') throw new HttpError(401, 'Incorrect email or password.');

  const updates = {};
  if (legacy) updates.password_hash = await hashPassword(password);
  if (isAdminEmail && user.role !== 'admin') updates.role = 'admin';
  if (Object.keys(updates).length) { await updateRow(c.env, 'users', user.id, updates); Object.assign(user, updates); }
  return c.json({ token: await issueToken(c.env, user), user: publicUser(user) });
});

route('GET', '/api/auth/me', async c => c.json({ user: publicUser(await c.requireUser()) }));

route('PUT', '/api/auth/me', async c => {
  const user = await c.requireUser();
  const input = await c.body();
  const name = str(input.name, 100);
  const phone = normalizePhone(input.phone);
  const gender = str(input.gender, 10);
  const dob = str(input.dob, 10);
  const address = str(input.address, 1000);
  if (!name) throw new HttpError(400, 'Please enter your name.');
  if (phone && !isBdPhone(phone)) throw new HttpError(400, 'Please enter a valid Bangladeshi mobile number.');
  if (gender && !['Female', 'Male', 'Other'].includes(gender)) throw new HttpError(400, 'Invalid gender.');
  if (dob && (!/^\d{4}-\d{2}-\d{2}$/.test(dob) || Number.isNaN(Date.parse(dob)))) throw new HttpError(400, 'Invalid date of birth.');
  const updates = { name, phone, gender, dob, address };
  await updateRow(c.env, 'users', user.id, updates);
  return c.json({ user: publicUser({ ...user, ...updates }) });
});

route('POST', '/api/auth/change-password', async c => {
  await c.rateLimit('password', 10, 900);
  const user = await c.requireUser();
  const { currentPassword, newPassword } = await c.body();
  if (typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 128) {
    throw new HttpError(400, 'New password must be 8–128 characters.');
  }
  const { ok } = await verifyPassword(String(currentPassword || ''), user.password_hash);
  if (!ok) throw new HttpError(400, 'Current password is incorrect.');
  const updates = { password_hash: await hashPassword(newPassword), token_version: (user.token_version || 0) + 1 };
  await updateRow(c.env, 'users', user.id, updates);
  // Every other device is signed out; this one receives a fresh token.
  return c.json({ success: true, token: await issueToken(c.env, { ...user, ...updates }) });
});

route('POST', '/api/auth/logout-all', async c => {
  const user = await c.requireUser();
  await updateRow(c.env, 'users', user.id, { token_version: (user.token_version || 0) + 1 });
  return c.json({ success: true });
});

route('DELETE', '/api/auth/delete-account', async c => {
  const user = await c.requireUser();
  if (user.role === 'admin') throw new HttpError(400, 'The admin account cannot be deleted.');
  const { password } = await c.body();
  const { ok } = await verifyPassword(String(password || ''), user.password_hash);
  if (!ok) throw new HttpError(400, 'Password is incorrect.');
  await updateRow(c.env, 'users', user.id, { status: 'deleted', token_version: (user.token_version || 0) + 1 });
  await c.env.DB.prepare('DELETE FROM user_carts WHERE user_id = ?').bind(user.id).run();
  return c.json({ success: true });
});

// ---- Notifications --------------------------------------------------------

route('GET', '/api/notifications', async c => {
  const user = await c.requireUser();
  const { results = [] } = await c.env.DB.prepare(
    "SELECT * FROM notifications WHERE user_id IN (?, 'ALL') ORDER BY created_at DESC LIMIT 100",
  ).bind(user.id).all();
  return c.json({ notifications: results.map(n => ({ ...n, is_read: Boolean(n.is_read), link: safeLink(n.link) })) });
});

route('POST', '/api/notifications/mark-read', async c => {
  const user = await c.requireUser();
  const input = await c.body();
  if (input.markAll) {
    await c.env.DB.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').bind(user.id).run();
  } else if (input.notificationId) {
    await c.env.DB.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').bind(String(input.notificationId), user.id).run();
  } else throw new HttpError(400, 'notificationId or markAll is required.');
  return c.json({ success: true });
});

route('GET', '/api/admin/notifications', async c => {
  await c.requireAdmin();
  const { results = [] } = await c.env.DB.prepare('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 200').all();
  return c.json({ notifications: results });
});

route('POST', '/api/admin/notifications', async c => {
  await c.requireAdmin();
  const input = await c.body();
  const title = str(input.title, 120);
  const message = str(input.message, 1000);
  if (!title || !message) throw new HttpError(400, 'Title and message are required.');
  let target = str(input.targetUserId, 254) || 'ALL';
  if (target !== 'ALL' && target.includes('@')) {
    const recipient = await c.env.DB.prepare('SELECT id FROM users WHERE lower(email) = ? LIMIT 1').bind(normalizeEmail(target)).first();
    if (!recipient) throw new HttpError(404, 'No customer with that email.');
    target = recipient.id;
  }
  await createNotification(c.env, { userId: target, title, message, type: input.type, link: input.link });
  return c.json({ success: true });
});

route('DELETE', '/api/admin/notifications', async c => {
  await c.requireAdmin();
  const id = c.url.searchParams.get('id');
  if (!id) throw new HttpError(400, 'id is required.');
  await c.env.DB.prepare('DELETE FROM notifications WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});

// ---- Cart sync ------------------------------------------------------------

route('GET', '/api/cart', async c => {
  const user = await c.requireUser();
  const row = await c.env.DB.prepare('SELECT cart_data, updated_at FROM user_carts WHERE user_id = ?').bind(user.id).first();
  let items = [];
  try { items = row ? JSON.parse(row.cart_data) : []; } catch { items = []; }
  return c.json({ items: Array.isArray(items) ? items : [], updatedAt: row?.updated_at || null });
});

route('PUT', '/api/cart', async c => {
  const user = await c.requireUser();
  const input = await c.body();
  const raw = Array.isArray(input.items) ? input.items : Array.isArray(input.cart) ? input.cart : [];
  const items = raw.slice(0, 50).map(i => ({
    id: str(String(i.id ?? ''), 80), size: str(i.size, 30), color: str(i.color, 60),
    qty: Math.min(99, Math.max(1, Math.floor(num(i.qty, 1)))),
  })).filter(i => i.id);
  await c.env.DB.prepare(`INSERT INTO user_carts (user_id, cart_data, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET cart_data = excluded.cart_data, updated_at = excluded.updated_at`)
    .bind(user.id, JSON.stringify(items), new Date().toISOString()).run();
  return c.json({ success: true });
});
route('POST', '/api/cart', c => routes.find(r => r.method === 'PUT' && r.path === '/api/cart').handler(c));

// ---- Products -------------------------------------------------------------

function sanitizeProductInput(input) {
  const out = {};
  const i18n = value => (value && typeof value === 'object' && !Array.isArray(value)
    ? { en: str(value.en, 5000), bn: str(value.bn, 5000) }
    : { en: str(value, 5000), bn: str(value, 5000) });
  const i18nList = value => (value && typeof value === 'object' && !Array.isArray(value)
    ? { en: (value.en || []).map(v => str(v, 300)).filter(Boolean), bn: (value.bn || []).map(v => str(v, 300)).filter(Boolean) }
    : { en: (Array.isArray(value) ? value : []).map(v => str(v, 300)).filter(Boolean), bn: [] });
  const intMap = value => Object.fromEntries(Object.entries(value && typeof value === 'object' ? value : {})
    .slice(0, 400).map(([k, v]) => [str(k, 120), Math.max(0, Math.floor(num(v)))]));

  if ('title' in input) out.title = i18n(input.title);
  if ('description' in input) out.description = i18n(input.description);
  if ('measurementsGuide' in input) out.measurementsGuide = i18n(input.measurementsGuide);
  for (const key of ['details', 'materials', 'care']) if (key in input) out[key] = i18nList(input[key]);
  if ('category' in input) out.category = str(input.category, 60).toLowerCase();
  if ('price' in input) out.price = Math.max(0, Math.round(num(input.price)));
  if ('originalPrice' in input) out.originalPrice = Math.max(0, Math.round(num(input.originalPrice)));
  if ('images' in input) out.images = (Array.isArray(input.images) ? input.images : []).map(safeLink).filter(Boolean).slice(0, 20);
  if ('thumbnail' in input) out.thumbnail = safeLink(input.thumbnail);
  if ('sizes' in input) out.sizes = (Array.isArray(input.sizes) ? input.sizes : []).map(s => str(s, 30)).filter(Boolean).slice(0, 20);
  if ('colors' in input) {
    const clean = list => (Array.isArray(list) ? list : []).slice(0, 30).map(c => (typeof c === 'string'
      ? str(c, 60)
      : { name: { en: str(c?.name?.en ?? c?.name, 60), bn: str(c?.name?.bn ?? c?.name?.en ?? c?.name, 60) },
        hex: /^#[0-9a-f]{3,8}$/i.test(c?.hex || '') ? c.hex : '' })).filter(Boolean);
    out.colors = Array.isArray(input.colors) ? { en: clean(input.colors), bn: [] } : { en: clean(input.colors?.en), bn: (input.colors?.bn || []).map(v => str(v, 60)) };
  }
  if ('sizeMeasurements' in input && typeof input.sizeMeasurements === 'object') {
    out.sizeMeasurements = Object.fromEntries(Object.entries(input.sizeMeasurements || {}).slice(0, 20)
      .map(([k, v]) => [str(k, 30), typeof v === 'object' ? { en: str(v?.en, 300), bn: str(v?.bn, 300) } : str(v, 300)]));
  }
  if ('variantStock' in input) out.variantStock = intMap(input.variantStock);
  if ('sizeQuantities' in input) out.sizeQuantities = intMap(input.sizeQuantities);
  if ('quantity' in input) out.quantity = Math.max(0, Math.floor(num(input.quantity)));
  if ('seoKeywords' in input) out.seoKeywords = (Array.isArray(input.seoKeywords) ? input.seoKeywords : []).map(k => str(k, 60)).filter(Boolean).slice(0, 30);
  if ('displayOrder' in input) out.displayOrder = Math.floor(num(input.displayOrder));
  if ('featured' in input) out.featured = input.featured ? 1 : 0;
  if ('status' in input) out.status = ['active', 'draft', 'archived'].includes(input.status) ? input.status : 'active';
  // Keep the per-size totals consistent with the variant grid.
  if (out.variantStock && Object.keys(out.variantStock).length) {
    const sizes = out.sizes || [...new Set(Object.keys(out.variantStock).map(k => k.split('::')[1]).filter(Boolean))];
    out.sizeQuantities = Object.fromEntries(sizes.map(size => [size,
      Object.entries(out.variantStock).filter(([k]) => k.endsWith(`::${size}`)).reduce((s, [, v]) => s + v, 0)]));
    out.quantity = Object.values(out.variantStock).reduce((s, v) => s + v, 0);
  }
  // A new price clears legacy fields so they can't override it.
  if ('price' in out) { out.salePrice = null; out.regularPrice = null; out.onSale = null; }
  return out;
}

route('GET', '/api/products', async c => {
  const id = c.url.searchParams.get('id');
  const user = await c.currentUser();
  const includeHidden = user?.role === 'admin' && c.url.searchParams.get('all') === '1';
  if (id) {
    const row = await c.env.DB.prepare('SELECT * FROM products WHERE id = ? LIMIT 1').bind(id).first();
    const product = row && normalizeProduct(row);
    if (!product || (!includeHidden && product.status !== 'active')) throw new HttpError(404, 'Product not found.');
    return c.json(product, 200, { 'Cache-Control': includeHidden ? 'no-store' : 'public, max-age=30' });
  }
  const { results = [] } = await c.env.DB.prepare('SELECT * FROM products').all();
  const products = results.map(normalizeProduct)
    .filter(p => includeHidden || p.status === 'active')
    .sort((a, b) => a.displayOrder - b.displayOrder || String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  return c.json(products, 200, { 'Cache-Control': includeHidden ? 'no-store' : 'public, max-age=30' });
});

route('POST', '/api/products', async c => {
  await c.requireAdmin();
  const input = await c.body();
  const product = sanitizeProductInput(input);
  if (!product.title?.en) throw new HttpError(400, 'Product title is required.');
  if (!product.price) throw new HttpError(400, 'Product price is required.');
  const now = new Date().toISOString();
  const id = /^[\w-]{3,80}$/.test(input.id || '') ? input.id : 'prod_' + crypto.randomUUID().slice(0, 12);
  await insertRow(c.env, 'products', { id, status: 'active', displayOrder: 0, ...product, createdAt: now, updatedAt: now });
  return c.json({ success: true, id }, 201);
});

route('PUT', '/api/products', async c => {
  await c.requireAdmin();
  const input = await c.body();
  const id = String(input.id || c.url.searchParams.get('id') || '');
  if (!id) throw new HttpError(400, 'Product id is required.');
  const exists = await c.env.DB.prepare('SELECT id FROM products WHERE id = ?').bind(id).first();
  if (!exists) throw new HttpError(404, 'Product not found.');
  await updateRow(c.env, 'products', id, { ...sanitizeProductInput(input), updatedAt: new Date().toISOString() });
  return c.json({ success: true, id });
});

route('DELETE', '/api/products', async c => {
  await c.requireAdmin();
  const id = c.url.searchParams.get('id');
  if (!id) throw new HttpError(400, 'Product id is required.');
  await c.env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});

/** Bulk price/discount/order operations from the admin dashboard. */
route('POST', '/api/admin/products/bulk', async c => {
  await c.requireAdmin();
  const { ids, action, value } = await c.body();
  if (!Array.isArray(ids) || !ids.length) throw new HttpError(400, 'Select at least one product.');
  const now = new Date().toISOString();
  for (const id of ids.slice(0, 500).map(String)) {
    const row = await c.env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first();
    if (!row) continue;
    const p = normalizeProduct(row);
    let fields = null;
    if (action === 'discount') {
      const pct = Math.min(90, Math.max(1, num(value)));
      const base = p.originalPrice > p.price ? p.originalPrice : p.price;
      fields = { originalPrice: base, price: Math.round(base * (1 - pct / 100)) };
    } else if (action === 'clear-discount') {
      if (p.originalPrice > p.price) fields = { price: p.originalPrice, originalPrice: 0 };
    } else if (action === 'status') {
      fields = { status: ['active', 'draft', 'archived'].includes(value) ? value : 'active' };
    } else if (action === 'reorder') {
      fields = { displayOrder: ids.indexOf(id) };
    } else if (action === 'delete') {
      await c.env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
      continue;
    } else throw new HttpError(400, 'Unknown bulk action.');
    if (fields) await updateRow(c.env, 'products', id, { ...fields, salePrice: null, regularPrice: null, onSale: null, updatedAt: now });
  }
  return c.json({ success: true });
});

// ---- Banners --------------------------------------------------------------

function sanitizeBanner(input) {
  return {
    title: str(input.title, 150), subtitle: str(input.subtitle, 300), imageUrl: safeLink(input.imageUrl),
    link: safeLink(input.link), buttonText: str(input.buttonText, 40), active: input.active === false || input.active === 0 ? 0 : 1,
    objectPosition: /^\d{1,3}% \d{1,3}%$/.test(input.objectPosition || '') ? input.objectPosition : '50% 50%',
    displayOrder: Math.floor(num(input.displayOrder)),
  };
}

route('GET', '/api/banners', async c => {
  const user = await c.currentUser();
  const all = user?.role === 'admin' && c.url.searchParams.get('all') === '1';
  const { results = [] } = await c.env.DB.prepare('SELECT * FROM banners').all();
  const banners = results.map(b => ({ ...b, active: b.active === null || b.active === undefined ? true : Boolean(num(b.active, 1)), displayOrder: num(b.displayOrder) }))
    .filter(b => all || (b.active && b.imageUrl))
    .sort((a, b) => a.displayOrder - b.displayOrder);
  return c.json(banners, 200, { 'Cache-Control': all ? 'no-store' : 'public, max-age=60' });
});

route('POST', '/api/banners', async c => {
  await c.requireAdmin();
  const banner = sanitizeBanner(await c.body());
  if (!banner.imageUrl) throw new HttpError(400, 'Banner image is required.');
  const id = 'bnr_' + crypto.randomUUID().slice(0, 12);
  await insertRow(c.env, 'banners', { id, ...banner });
  return c.json({ success: true, id }, 201);
});

route('PUT', '/api/banners', async c => {
  await c.requireAdmin();
  const input = await c.body();
  const id = String(input.id || c.url.searchParams.get('id') || '');
  if (!id) throw new HttpError(400, 'Banner id is required.');
  const existing = await c.env.DB.prepare('SELECT * FROM banners WHERE id = ?').bind(id).first();
  if (!existing) throw new HttpError(404, 'Banner not found.');
  await updateRow(c.env, 'banners', id, sanitizeBanner({ ...existing, ...input }));
  return c.json({ success: true });
});

route('DELETE', '/api/banners', async c => {
  await c.requireAdmin();
  const id = c.url.searchParams.get('id');
  if (!id) throw new HttpError(400, 'Banner id is required.');
  await c.env.DB.prepare('DELETE FROM banners WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});

// ---- Orders ---------------------------------------------------------------

/**
 * Prices, stock and totals are computed here from D1 — the browser only says
 * which product/size/color and how many.
 */
async function priceCart(env, rawItems, zone) {
  if (!Array.isArray(rawItems) || !rawItems.length) throw new HttpError(400, 'Your cart is empty.');
  if (rawItems.length > 30) throw new HttpError(400, 'Too many items in one order.');
  const settings = await getSettings(env);
  const maxQty = Math.max(1, num(settings.maxQtyPerItem, 10));
  const products = new Map();
  const items = [];
  const problems = [];
  for (const raw of rawItems) {
    const id = String(raw?.id ?? '');
    const qty = Math.floor(num(raw?.qty, 0));
    if (!id || qty < 1) continue;
    if (!products.has(id)) {
      const row = await env.DB.prepare('SELECT * FROM products WHERE id = ? LIMIT 1').bind(id).first();
      products.set(id, row ? normalizeProduct(row) : null);
    }
    const product = products.get(id);
    if (!product || product.status !== 'active') { problems.push({ id, reason: 'unavailable' }); continue; }
    const size = product.sizes.includes(String(raw.size)) ? String(raw.size) : product.sizes.length === 1 ? product.sizes[0] : null;
    if (!size) { problems.push({ id, reason: 'size' }); continue; }
    const colors = colorKeys(product);
    const color = colors.includes(String(raw.color)) ? String(raw.color) : colors.length <= 1 ? (colors[0] || '') : null;
    if (color === null) { problems.push({ id, reason: 'color' }); continue; }
    const alreadyTaken = items.filter(i => i.id === id && i.size === size && i.color === color).reduce((s, i) => s + i.qty, 0);
    const available = stockFor(product, size, color) - alreadyTaken;
    if (available < qty) { problems.push({ id, size, color, reason: 'stock', available: Math.max(0, available) }); continue; }
    if (qty > maxQty) { problems.push({ id, reason: 'limit', available: maxQty }); continue; }
    const price = unitPrice(product, settings);
    items.push({
      id, title: product.title?.en || String(product.title || 'Item'), titleBn: product.title?.bn || '',
      image: product.thumbnail || product.images[0] || '', size, color, qty, price,
      originalPrice: Math.max(product.originalPrice, product.price), lineTotal: price * qty,
    });
  }
  if (problems.length) {
    const error = new HttpError(409, 'Some items in your cart changed. Please review your cart.');
    error.details = problems;
    throw error;
  }
  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const original = items.reduce((s, i) => s + i.originalPrice * i.qty, 0);
  const inside = zone === 'inside';
  let deliveryFee = inside ? num(settings.deliveryInside, 70) : num(settings.deliveryOutside, 140);
  if (num(settings.freeDeliveryThreshold) > 0 && subtotal >= num(settings.freeDeliveryThreshold)) deliveryFee = 0;
  return { items, subtotal, discount: Math.max(0, original - subtotal), deliveryFee, total: subtotal + deliveryFee, products, settings };
}

route('POST', '/api/orders/quote', async c => {
  await c.rateLimit('quote', 120, 600);
  const input = await c.body();
  const zone = input.zone === 'inside' ? 'inside' : 'outside';
  try {
    const { items, subtotal, discount, deliveryFee, total } = await priceCart(c.env, input.items, zone);
    return c.json({ items, subtotal, discount, deliveryFee, total });
  } catch (error) {
    if (error.details) return c.json({ error: error.message, problems: error.details }, 409);
    throw error;
  }
});

route('POST', '/api/orders', async c => {
  await c.rateLimit('order', 6, 3600);
  const input = await c.body();
  const user = await c.currentUser();
  const name = str(input.customerName, 100);
  const phone = normalizePhone(input.customerPhone);
  const address = str(input.deliveryAddress, 500);
  const zone = input.deliveryZone === 'inside' ? 'inside' : 'outside';
  const note = str(input.note, 500);
  const channel = input.channel === 'whatsapp' ? 'whatsapp' : 'website';
  if (!name) throw new HttpError(400, 'Please enter your name.');
  if (!isBdPhone(phone)) throw new HttpError(400, 'Please enter a valid 11-digit mobile number (01XXXXXXXXX).');
  if (address.length < 8) throw new HttpError(400, 'Please enter your full delivery address.');
  if (input.acceptPolicy !== true) throw new HttpError(400, 'Please accept the delivery & return policy.');

  let priced;
  try { priced = await priceCart(c.env, input.items, zone); } catch (error) {
    if (error.details) return c.json({ error: error.message, problems: error.details }, 409);
    throw error;
  }

  const now = new Date();
  const stamp = now.toISOString().slice(2, 10).replace(/-/g, '');
  const order = {
    id: randomId(`MH${stamp}-`, 5), userId: user?.id || null, userEmail: user?.email || null,
    customerName: name, customerPhone: phone, deliveryAddress: address,
    deliveryZone: zone === 'inside' ? 'Inside Sylhet City' : 'Outside Sylhet',
    deliveryFee: priced.deliveryFee, items: priced.items, subtotal: priced.subtotal, discount: priced.discount,
    totalAmount: priced.total, status: 'Pending', paymentMethod: 'Cash on Delivery', note, channel,
    createdAt: now.toISOString(),
  };

  await insertRow(c.env, 'orders', {
    id: order.id, ...(tableColumns.get('orders').has('order_id') ? { order_id: order.id } : {}),
    user_id: order.userId, user_email: order.userEmail, customer_name: name, customer_phone: phone,
    delivery_address: address, delivery_zone: order.deliveryZone, delivery_fee: order.deliveryFee,
    items: order.items, subtotal: order.subtotal, discount: order.discount, total_amount: order.totalAmount,
    status: 'Pending', payment_method: order.paymentMethod, note, channel,
    created_at: order.createdAt, updated_at: order.createdAt,
  });

  // Reserve stock.
  const touched = new Map();
  for (const item of order.items) {
    const product = priced.products.get(item.id);
    touched.set(item.id, { ...(touched.get(item.id) || {}), ...adjustStock(product, item.size, item.color, -item.qty) });
  }
  for (const [id, fields] of touched) await updateRow(c.env, 'products', id, fields);

  if (user) {
    await createNotification(c.env, { userId: user.id, title: 'Order received',
      message: `Your order #${order.id} has been received and is under review. We will call you to confirm.`,
      type: 'order', link: `/order?id=${encodeURIComponent(order.id)}` });
    await c.env.DB.prepare('DELETE FROM user_carts WHERE user_id = ?').bind(user.id).run();
  }
  const admin = await c.env.DB.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").first();
  if (admin) {
    await createNotification(c.env, { userId: admin.id, title: 'New order', message: `${name} placed #${order.id} — ৳${order.totalAmount}`,
      type: 'order', link: '/admin#orders' });
  }

  const origin = c.env.PUBLIC_ORIGIN || c.url.origin;
  c.background(sendTelegram(c.env, orderTelegramMessage(order, origin)));
  c.background(sendSms(c.env, phone, `MOHOR: Your order #${order.id} (৳${order.totalAmount}) has been received. We will call you to confirm.`));
  c.background(sendMetaEvent(c.env, c, 'Purchase', {
    eventId: order.id, value: order.totalAmount, email: order.userEmail, phone,
    contents: order.items.map(i => ({ id: i.id, quantity: i.qty, item_price: i.price })), sourceUrl: `${origin}/cart`,
  }));

  return c.json({ success: true, order }, 201);
});

route('GET', '/api/orders', async c => {
  const user = await c.requireUser();
  const id = c.url.searchParams.get('id');
  if (id) {
    const row = await c.env.DB.prepare('SELECT * FROM orders WHERE id = ? LIMIT 1').bind(id).first();
    const order = row && normalizeOrder(row);
    if (!order || (user.role !== 'admin' && order.userId !== user.id)) throw new HttpError(404, 'Order not found.');
    return c.json({ order });
  }
  // Older rows may have been stored with the email instead of the id.
  const { results = [] } = await c.env.DB.prepare('SELECT * FROM orders WHERE user_id = ? OR (user_id IS NULL AND lower(user_email) = ?) OR user_id = ?')
    .bind(user.id, normalizeEmail(user.email), user.email).all();
  return c.json({ orders: results.map(normalizeOrder).sort(orderSort) });
});

/** Guest order tracking: needs both the order id and the phone used at checkout. */
route('POST', '/api/orders/track', async c => {
  await c.rateLimit('track', 20, 900);
  const { id, phone } = await c.body();
  const row = await c.env.DB.prepare('SELECT * FROM orders WHERE id = ? LIMIT 1').bind(str(id, 40)).first();
  const order = row && normalizeOrder(row);
  if (!order || normalizePhone(order.customerPhone) !== normalizePhone(phone)) {
    throw new HttpError(404, 'No order matches that ID and phone number.');
  }
  return c.json({ order });
});

route('GET', '/api/admin/orders', async c => {
  await c.requireAdmin();
  const { results = [] } = await c.env.DB.prepare('SELECT * FROM orders').all();
  return c.json({ orders: results.map(normalizeOrder).sort(orderSort) });
});

const STATUS_COPY = {
  Confirmed: ['Order confirmed', id => `Your MOHOR order #${id} is confirmed and is being prepared.`],
  Shipped: ['Order shipped', id => `Your MOHOR order #${id} has been handed to the courier and is on its way.`],
  Completed: ['Order delivered', id => `Your MOHOR order #${id} has been delivered. Thank you for choosing MOHOR!`],
  Cancelled: ['Order cancelled', id => `Your MOHOR order #${id} was cancelled. Contact us if you have any questions.`],
  Pending: ['Order pending', id => `Your MOHOR order #${id} is pending review.`],
};

async function setOrderStatus(c, id, status) {
  if (!ORDER_STATUSES.includes(status)) throw new HttpError(400, 'Invalid status.');
  const row = await c.env.DB.prepare('SELECT * FROM orders WHERE id = ? LIMIT 1').bind(id).first();
  if (!row) throw new HttpError(404, 'Order not found.');
  const order = normalizeOrder(row);
  if (order.status === status) return order;

  // Stock goes back when an order is cancelled, and is taken again if it is revived.
  const restoring = status === 'Cancelled' && order.status !== 'Cancelled';
  const retaking = order.status === 'Cancelled' && status !== 'Cancelled';
  if (restoring || retaking) {
    for (const item of order.items) {
      const prow = await c.env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(String(item.id)).first();
      if (!prow) continue;
      const product = normalizeProduct(prow);
      await updateRow(c.env, 'products', product.id, adjustStock(product, item.size, item.color, restoring ? num(item.qty) : -num(item.qty)));
    }
  }
  await updateRow(c.env, 'orders', id, { status, updated_at: new Date().toISOString() });
  const [title, message] = STATUS_COPY[status];
  if (order.userId) {
    await createNotification(c.env, { userId: order.userId, title, message: message(id), type: 'order', link: `/order?id=${encodeURIComponent(id)}` });
  }
  if (status !== 'Pending') c.background(sendSms(c.env, order.customerPhone, `MOHOR: ${message(id)}`));
  return { ...order, status };
}

route('PUT', '/api/admin/orders', async c => {
  await c.requireAdmin();
  const input = await c.body();
  const ids = Array.isArray(input.ids) ? input.ids.map(String) : [String(input.id || '')];
  const status = str(input.status, 20);
  const updated = [];
  for (const id of ids.filter(Boolean).slice(0, 200)) updated.push(await setOrderStatus(c, id, status));
  return c.json({ success: true, orders: updated });
});
// Legacy admin path.
route('PUT', '/api/orders', c => routes.find(r => r.method === 'PUT' && r.path === '/api/admin/orders').handler(c));

route('DELETE', '/api/admin/orders', async c => {
  await c.requireAdmin();
  const id = c.url.searchParams.get('id');
  if (!id) throw new HttpError(400, 'Order id is required.');
  await c.env.DB.prepare('DELETE FROM orders WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});

// ---- Admin: customers & dashboard -----------------------------------------

route('GET', '/api/admin/customers', async c => {
  await c.requireAdmin();
  const { results = [] } = await c.env.DB.prepare("SELECT * FROM users WHERE coalesce(status, 'active') != 'deleted' ORDER BY created_at DESC").all();
  const { results: orders = [] } = await c.env.DB.prepare('SELECT * FROM orders').all();
  const stats = new Map();
  for (const o of orders.map(normalizeOrder)) {
    if (!o.userId || o.status === 'Cancelled') continue;
    const s = stats.get(o.userId) || { orders: 0, spent: 0 };
    s.orders += 1; s.spent += o.totalAmount;
    stats.set(o.userId, s);
  }
  return c.json({ customers: results.map(u => ({ ...publicUser(u), ...(stats.get(u.id) || { orders: 0, spent: 0 }) })) });
});

route('PUT', '/api/admin/customers', async c => {
  const admin = await c.requireAdmin();
  const { id, role } = await c.body();
  if (!['admin', 'customer'].includes(role)) throw new HttpError(400, 'Invalid role.');
  if (id === admin.id) throw new HttpError(400, 'You cannot change your own role.');
  const target = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(String(id)).first();
  if (!target) throw new HttpError(404, 'Customer not found.');
  await updateRow(c.env, 'users', target.id, { role, token_version: (target.token_version || 0) + 1 });
  return c.json({ success: true });
});

route('GET', '/api/admin/stats', async c => {
  await c.requireAdmin();
  const { results: rows = [] } = await c.env.DB.prepare('SELECT * FROM orders').all();
  const orders = rows.map(normalizeOrder);
  const { results: productRows = [] } = await c.env.DB.prepare('SELECT * FROM products').all();
  const products = productRows.map(normalizeProduct);
  const users = await c.env.DB.prepare("SELECT count(*) AS n FROM users WHERE coalesce(status, 'active') != 'deleted'").first();
  const valid = orders.filter(o => o.status !== 'Cancelled');
  const byDay = {};
  const since = Date.now() - 30 * 864e5;
  for (const o of valid) {
    const t = Date.parse(o.createdAt || '');
    if (!t || t < since) continue;
    const day = new Date(t + 6 * 36e5).toISOString().slice(0, 10); // Asia/Dhaka
    byDay[day] = byDay[day] || { revenue: 0, orders: 0 };
    byDay[day].revenue += o.totalAmount; byDay[day].orders += 1;
  }
  const sold = {};
  for (const o of valid) for (const i of o.items) sold[i.id] = (sold[i.id] || 0) + num(i.qty);
  const lowStock = products.filter(p => p.status === 'active')
    .map(p => ({ id: p.id, title: p.title?.en || p.title, quantity: p.quantity }))
    .filter(p => p.quantity <= 3).sort((a, b) => a.quantity - b.quantity).slice(0, 20);
  return c.json({
    revenue: valid.reduce((s, o) => s + o.totalAmount, 0),
    orders: orders.length,
    pending: orders.filter(o => o.status === 'Pending').length,
    statusCounts: Object.fromEntries(ORDER_STATUSES.map(s => [s, orders.filter(o => o.status === s).length])),
    customers: users?.n || 0,
    products: products.length,
    averageOrder: valid.length ? Math.round(valid.reduce((s, o) => s + o.totalAmount, 0) / valid.length) : 0,
    byDay,
    topProducts: Object.entries(sold).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([id, qty]) => {
      const p = products.find(x => x.id === id);
      return { id, qty, title: p?.title?.en || id };
    }),
    lowStock,
  });
});

route('POST', '/api/admin/telegram-test', async c => {
  await c.requireAdmin();
  if (!c.env.TELEGRAM_BOT_TOKEN || !c.env.TELEGRAM_CHAT_ID) throw new HttpError(400, 'TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID secrets are not set.');
  await sendTelegram(c.env, '✅ <b>MOHOR</b> — Telegram alerts are working.');
  return c.json({ success: true });
});

// ---- Image upload (admin) -------------------------------------------------

route('POST', '/api/admin/upload', async c => {
  await c.requireAdmin();
  const type = c.request.headers.get('Content-Type') || '';
  if (!/^image\/(webp|jpeg|png|avif|gif)$/.test(type)) throw new HttpError(415, 'Upload a WebP, JPEG, PNG, AVIF or GIF image.');
  const length = Number(c.request.headers.get('Content-Length') || 0);
  if (length > 8 * 1024 * 1024) throw new HttpError(413, 'Image must be under 8 MB.');
  const ext = type.split('/')[1].replace('jpeg', 'jpg');
  const base = str(c.url.searchParams.get('name'), 80).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '') || 'image';
  const key = `${base}-${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 6)}.${ext}`;
  const publicBase = (c.env.R2_PUBLIC_URL || 'https://images.mohor.me/').replace(/\/?$/, '/');

  if (c.env.IMAGES) {
    await c.env.IMAGES.put(key, c.request.body, { httpMetadata: { contentType: type, cacheControl: 'public, max-age=31536000, immutable' } });
    return c.json({ success: true, url: publicBase + key, key });
  }
  const uploaderSecret = c.env.UPLOADER_SECRET || c.env.UPLOAD_SECRET;
  if (c.env.UPLOADER_URL && uploaderSecret) {
    // Legacy path: forward to the separate mohor-uploader worker; its secret stays server-side.
    const target = new URL(c.env.UPLOADER_URL);
    target.searchParams.set('filename', key);
    const response = await fetch(target, {
      method: 'POST', body: c.request.body,
      headers: { 'Content-Type': type, Authorization: `Bearer ${uploaderSecret}` },
    });
    if (!response.ok) throw new HttpError(502, `Uploader rejected the image (${response.status}).`);
    return c.json({ success: true, url: publicBase + encodeURIComponent(key), key });
  }
  throw new HttpError(500, 'Image storage is not configured (bind an R2 bucket as IMAGES).');
});

// ---- Analytics relay ------------------------------------------------------

const BROWSER_EVENTS = new Set(['PageView', 'ViewContent', 'AddToCart', 'AddToWishlist', 'InitiateCheckout', 'Search', 'Contact']);
route('POST', '/api/track', async c => {
  await c.rateLimit('track-event', 60, 60);
  const input = await c.body();
  if (!BROWSER_EVENTS.has(input.event)) throw new HttpError(400, 'Unsupported event.');
  c.background(sendMetaEvent(c.env, c, input.event, {
    eventId: str(input.eventId, 80), value: input.value !== undefined ? Math.max(0, num(input.value)) : undefined,
    contents: Array.isArray(input.contents) ? input.contents.slice(0, 20).map(i => ({ id: str(String(i.id), 80), quantity: Math.max(1, Math.floor(num(i.quantity, 1))) })) : undefined,
    sourceUrl: safeLink(input.url),
  }));
  return c.json({ success: true }, 202);
});

// --------------------------------------------------------------------------
// Entry point
// --------------------------------------------------------------------------

export default {
  async fetch(request, env, ctx) {
    const c = createContext(request, env, ctx);
    const { url } = c;

    if (!url.pathname.startsWith('/api/')) {
      // Static assets normally never reach the worker; this is a safety net.
      return env.ASSETS.fetch(request);
    }
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: c.baseHeaders() });

    try {
      if (!env.JWT_SECRET || env.JWT_SECRET.length < 16) throw new HttpError(500, 'Server is not configured (JWT_SECRET).');
      // Blocks cross-site form posts against the cookie-less API as defence-in-depth.
      const origin = request.headers.get('Origin');
      if (request.method !== 'GET' && origin && origin !== url.origin && !['https://mohor.me', 'https://www.mohor.me', env.PUBLIC_ORIGIN].includes(origin)) {
        throw new HttpError(403, 'Cross-origin request blocked.');
      }
      await ensureSchema(env);
      const path = url.pathname.replace(/\/+$/, '');
      const match = routes.find(r => r.path === path && (r.method === request.method || (r.method === 'GET' && request.method === 'HEAD')));
      if (!match) {
        const known = routes.some(r => r.path === path);
        throw new HttpError(known ? 405 : 404, known ? 'Method not allowed.' : 'Not found.');
      }
      return await match.handler(c);
    } catch (error) {
      if (error instanceof HttpError) return c.json({ error: error.message }, error.status);
      console.error('Unhandled API error', url.pathname, error?.stack || error);
      return c.json({ error: 'Something went wrong on our side. Please try again.' }, 500);
    }
  },
};
