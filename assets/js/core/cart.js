// Cart: [{ id, size, color, qty }]. Prices are never stored — they are looked
// up from the catalog for display and re-computed by the server at checkout.
// Signed-in carts sync to D1 so they follow the customer across devices.

import { api } from './api.js';
import { createStore } from './store.js';
import { session } from './auth.js';
import { loadProducts, pricing, stockFor } from './catalog.js';

/** @typedef {{ id: string, size: string, color: string, qty: number }} CartLine */

const clean = value => (Array.isArray(value) ? value : [])
  .filter(i => i && i.id)
  .map(i => ({ id: String(i.id), size: String(i.size || 'Standard'), color: String(i.color || ''), qty: Math.max(1, Math.min(99, Math.floor(Number(i.qty) || 1))) }));

export const cart = createStore(/** @type {CartLine[]} */([]), { persist: 'mohor:cart:v2', validate: clean });

// One-time migration from the v1 cart format.
try {
  const legacy = JSON.parse(localStorage.getItem('mohor_cart') || 'null');
  if (Array.isArray(legacy) && legacy.length && !cart.get().length) {
    cart.set(clean(legacy.map(i => ({ id: i.id ?? i.productId, size: i.size, color: i.color ?? i.colorKey, qty: i.qty ?? i.quantity }))));
  }
  localStorage.removeItem('mohor_cart');
} catch { /* ignore */ }

const same = (a, b) => a.id === b.id && a.size === b.size && a.color === b.color;
export const count = () => cart.get().reduce((s, i) => s + i.qty, 0);

/** @returns {Promise<{ ok: boolean, reason?: 'stock'|'missing', available?: number }>} */
export async function add({ id, size = 'Standard', color = '', qty = 1 }) {
  const products = await loadProducts().catch(() => []);
  const product = products.find(p => p.id === String(id));
  if (!product) return { ok: false, reason: 'missing' };
  const line = { id: String(id), size: String(size), color: String(color), qty };
  const existing = cart.get().find(i => same(i, line));
  const available = stockFor(product, size, color);
  const wanted = (existing?.qty || 0) + qty;
  if (available < wanted) return { ok: false, reason: 'stock', available: Math.max(0, available - (existing?.qty || 0)) };
  cart.set(items => existing ? items.map(i => (same(i, line) ? { ...i, qty: wanted } : i)) : [...items, line]);
  return { ok: true };
}

export async function setQty(line, qty) {
  if (qty < 1) return remove(line);
  const products = await loadProducts().catch(() => []);
  const product = products.find(p => p.id === line.id);
  const capped = product ? Math.min(qty, Math.max(1, stockFor(product, line.size, line.color))) : qty;
  cart.set(items => items.map(i => (same(i, line) ? { ...i, qty: capped } : i)));
  return capped === qty;
}

export const remove = line => cart.set(items => items.filter(i => !same(i, line)));
export const clear = () => cart.set([]);

/**
 * Joins cart lines with live product data for rendering.
 * @returns {Promise<{ lines: Array<CartLine & { product: any, price: number, original: number, available: number, lineTotal: number }>, subtotal: number, savings: number, missing: CartLine[] }>}
 */
export async function hydrate() {
  const products = await loadProducts().catch(() => []);
  const lines = [];
  const missing = [];
  for (const line of cart.get()) {
    const product = products.find(p => p.id === line.id);
    if (!product) { missing.push(line); continue; }
    const { price, original } = pricing(product);
    lines.push({ ...line, product, price, original, available: stockFor(product, line.size, line.color), lineTotal: price * line.qty });
  }
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const savings = lines.reduce((s, l) => s + (l.original ? (l.original - l.price) * l.qty : 0), 0);
  return { lines, subtotal, savings, missing };
}

/** Server-priced quote — use this for the checkout summary. */
export const quote = zone => api.post('/api/orders/quote', { items: cart.get(), zone });

// ---- Account sync ---------------------------------------------------------

let syncTimer;
let syncing = false;
cart.subscribe(items => {
  if (!session.get() || syncing) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => api.put('/api/cart', { items }).catch(() => {}), 800);
});

async function mergeFromServer() {
  try {
    const { items } = await api.get('/api/cart');
    const merged = [...clean(items)];
    for (const local of cart.get()) {
      const match = merged.find(i => same(i, local));
      if (match) match.qty = Math.max(match.qty, local.qty); else merged.push(local);
    }
    syncing = true;
    cart.set(merged);
    syncing = false;
    await api.put('/api/cart', { items: merged });
  } catch { syncing = false; }
}

window.addEventListener('mohor:signed-in', mergeFromServer);
window.addEventListener('mohor:signed-out', event => {
  // A deliberate sign-out leaves nothing behind on a shared phone.
  if (event.detail?.reason === 'logout') { syncing = true; cart.set([]); syncing = false; }
});
export const syncOnLoad = () => { if (session.get()) mergeFromServer(); };
