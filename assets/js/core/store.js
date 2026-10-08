// Minimal observable state with optional localStorage persistence.

/**
 * @template T
 * @param {T} initial
 * @param {{ persist?: string, validate?: (value: any) => T }} [options]
 */
export function createStore(initial, { persist, validate } = {}) {
  let state = initial;
  if (persist) {
    try {
      const saved = localStorage.getItem(persist);
      if (saved !== null) state = validate ? validate(JSON.parse(saved)) : JSON.parse(saved);
    } catch { state = initial; }
  }
  const listeners = new Set();
  const store = {
    /** @returns {T} */
    get: () => state,
    /** @param {T | ((prev: T) => T)} next */
    set(next) {
      state = typeof next === 'function' ? next(state) : next;
      if (persist) { try { localStorage.setItem(persist, JSON.stringify(state)); } catch { /* quota */ } }
      listeners.forEach(fn => fn(state));
    },
    /** @param {(value: T) => void} fn */
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  };
  // Keep tabs in sync.
  if (persist) {
    window.addEventListener('storage', event => {
      if (event.key !== persist || event.newValue === null) return;
      try { state = validate ? validate(JSON.parse(event.newValue)) : JSON.parse(event.newValue); } catch { return; }
      listeners.forEach(fn => fn(state));
    });
  }
  return store;
}
