// Product catalog: loading (with a short session cache), pricing, stock and
// colour helpers shared by every page. The server is the source of truth for
// prices at checkout; these helpers only drive display.

import { api } from './api.js';
import { localized, t } from './i18n.js';

const CACHE_KEY = 'mohor:catalog:v2';
const CACHE_TTL = 2 * 60 * 1000;
let catalogPromise = null;
let settingsPromise = null;

/** @typedef {{ id: string, title: any, description?: any, category: string, price: number, originalPrice: number,
 *  images: string[], thumbnail?: string, sizes: string[], colors?: any, sizeQuantities?: Record<string, number>,
 *  variantStock?: Record<string, number>, quantity: number, displayOrder: number, featured?: boolean, createdAt?: string,
 *  details?: any, materials?: any, care?: any, sizeMeasurements?: any, measurementsGuide?: any }} Product */

/** @returns {Promise<Product[]>} */
export function loadProducts({ fresh = false } = {}) {
  if (catalogPromise && !fresh) return catalogPromise;
  if (!fresh) {
    try {
      const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null');
      if (cached && Date.now() - cached.time < CACHE_TTL && Array.isArray(cached.products)) {
        catalogPromise = Promise.resolve(cached.products);
        return catalogPromise;
      }
    } catch { /* ignore */ }
  }
  catalogPromise = api.get('/api/products').then(products => {
    const list = Array.isArray(products) ? products : [];
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), products: list })); } catch { /* quota */ }
    return list;
  }).catch(error => { catalogPromise = null; throw error; });
  return catalogPromise;
}

export async function getProduct(id) {
  const list = await loadProducts().catch(() => []);
  return list.find(p => p.id === String(id)) || api.get(`/api/products?id=${encodeURIComponent(id)}`);
}

export function loadSettings() {
  settingsPromise ||= api.get('/api/settings').catch(() => ({}));
  return settingsPromise;
}

// ---- Pricing --------------------------------------------------------------

let storeSale = { active: false, percent: 0 };
loadSettings().then(s => {
  const running = s.saleActive && Number(s.discountPercent) > 0 && (!s.saleEndTime || Date.parse(s.saleEndTime) > Date.now());
  storeSale = { active: Boolean(running), percent: Number(s.discountPercent) || 0 };
});

/** @param {Product} p */
export function pricing(p) {
  let price = Number(p.price) || 0;
  let original = Number(p.originalPrice) > price ? Number(p.originalPrice) : 0;
  if (!original && storeSale.active) { original = price; price = Math.round(price * (1 - storeSale.percent / 100)); }
  const percent = original ? Math.round((1 - price / original) * 100) : 0;
  return { price, original, percent, onSale: percent > 0, savings: original ? original - price : 0 };
}

// ---- Colours & stock ------------------------------------------------------

/** @returns {{ key: string, label: string, hex: string }[]} */
export function colorsOf(p) {
  const en = Array.isArray(p.colors) ? p.colors : (p.colors?.en || []);
  const bn = Array.isArray(p.colors) ? [] : (p.colors?.bn || []);
  return en.map((c, i) => {
    const key = typeof c === 'string' ? c : (c?.name?.en || c?.name || '');
    const label = typeof c === 'string' ? (localized({ en: c, bn: typeof bn[i] === 'string' ? bn[i] : c })) : localized(c?.name) || key;
    return { key, label, hex: typeof c === 'object' && /^#[0-9a-f]{3,8}$/i.test(c?.hex || '') ? c.hex : guessHex(key) };
  }).filter(c => c.key);
}

const NAMED = { maroon: '#6b1e2e', olive: '#6b6b2e', navy: '#1f2a44', black: '#1a1a1a', white: '#f6f3ee', red: '#b3261e',
  pink: '#e8a6b8', 'blush pink': '#e9b8c0', blue: '#2f5d8a', green: '#2f6b4f', yellow: '#e2b33c', mustard: '#c99a2e',
  purple: '#5b3a78', orange: '#d9772b', grey: '#8a8a8a', gray: '#8a8a8a', beige: '#d9c7a7', cream: '#efe5d2', brown: '#6d4c35',
  teal: '#2b7a78', magenta: '#a3246b', gold: '#b08d57', peach: '#f0b89a', lavender: '#b8a6d9', mint: '#a8d5ba', sky: '#8ec5e8' };
const guessHex = name => NAMED[String(name).toLowerCase()] || NAMED[String(name).toLowerCase().split(' ').pop()] || '#c8bfb3';

export function stockFor(p, size, color) {
  const sizeKey = String(size || 'Standard');
  const v = p.variantStock;
  if (v && color) {
    if (v[`${color}::${sizeKey}`] !== undefined) return Math.max(0, Number(v[`${color}::${sizeKey}`]) || 0);
    if (v[color]?.[sizeKey] !== undefined) return Math.max(0, Number(v[color][sizeKey]) || 0);
  }
  if (p.sizeQuantities?.[sizeKey] !== undefined) return Math.max(0, Number(p.sizeQuantities[sizeKey]) || 0);
  return Math.max(0, Number(p.quantity) || 0);
}

export function inStock(p) {
  const sizes = p.sizes?.length ? p.sizes : ['Standard'];
  const colors = colorsOf(p);
  const keys = colors.length ? colors.map(c => c.key) : [''];
  return keys.some(color => sizes.some(size => stockFor(p, size, color) > 0));
}

export const totalStock = p => {
  const sizes = p.sizes?.length ? p.sizes : ['Standard'];
  const colors = colorsOf(p);
  const keys = colors.length ? colors.map(c => c.key) : [''];
  if (p.variantStock && Object.keys(p.variantStock).length) return keys.reduce((s, c) => s + sizes.reduce((x, z) => x + stockFor(p, z, c), 0), 0);
  return sizes.reduce((s, z) => s + stockFor(p, z, ''), 0);
};

// ---- Display helpers ------------------------------------------------------

export const titleOf = p => localized(p?.title) || 'Untitled';
export const imageOf = (p, index = 0) => (index === 0 && p?.thumbnail) || p?.images?.[index] || p?.images?.[0] || '/assets/image-placeholder.svg';
export const productUrl = p => `/product?id=${encodeURIComponent(p.id)}`;

export const CATEGORIES = [
  { key: 'three-piece', label: () => t('catThreePiece') },
  { key: 'kurti', label: () => t('catKurti') },
  { key: 'khadi', label: () => t('catKhadi') },
  { key: 'saree', label: () => t('catSaree') },
];
export const categoryLabel = key => CATEGORIES.find(c => c.key === key)?.label() || (key ? key.replace(/-/g, ' ') : t('catOther'));

/** Accent- and case-insensitive search across both languages. */
export function matches(p, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = [p.title?.en, p.title?.bn, p.title, p.category, categoryLabel(p.category), ...(p.seoKeywords || []),
    ...colorsOf(p).map(c => c.key)].filter(x => typeof x === 'string').join(' ').toLowerCase();
  return q.split(/\s+/).every(word => hay.includes(word));
}
