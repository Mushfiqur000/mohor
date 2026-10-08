// Device-local wishlist of product ids.
import { createStore } from './store.js';

export const wishlist = createStore(/** @type {string[]} */([]), {
  persist: 'mohor:wishlist:v2',
  validate: v => (Array.isArray(v) ? [...new Set(v.map(String))] : []),
});

try {
  const legacy = JSON.parse(localStorage.getItem('mohor_wishlist') || 'null');
  if (Array.isArray(legacy) && legacy.length && !wishlist.get().length) wishlist.set(legacy.map(x => String(x?.id ?? x)));
  localStorage.removeItem('mohor_wishlist');
} catch { /* ignore */ }

export const has = id => wishlist.get().includes(String(id));
/** @returns {boolean} true when the item is now saved */
export function toggle(id) {
  const key = String(id);
  const saved = has(key);
  wishlist.set(list => (saved ? list.filter(x => x !== key) : [key, ...list]));
  return !saved;
}
