// Safe DOM helpers. Every interpolation in `html` is escaped unless wrapped
// in raw(); this is the only way markup is built from data anywhere.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' };
export const escapeHtml = value => String(value ?? '').replace(/[&<>"'`]/g, c => ESC[c]);

class Raw { constructor(value) { this.value = String(value ?? ''); } toString() { return this.value; } }
/** Marks a string as trusted markup. Only use for markup produced by `html`. */
export const raw = value => (value instanceof Raw ? value : new Raw(value));

const render = value => {
  if (value === null || value === undefined || value === false) return '';
  if (value instanceof Raw) return value.value;
  if (Array.isArray(value)) return value.map(render).join('');
  return escapeHtml(value);
};

/** Tagged template: html`<p>${name}</p>` → Raw with escaped values. */
export function html(strings, ...values) {
  let out = strings[0];
  values.forEach((value, i) => { out += render(value) + strings[i + 1]; });
  return new Raw(out);
}

/** Only http(s), root-relative, data:image and blob URLs survive. */
export function safeUrl(value, fallback = '') {
  const url = String(value ?? '').trim();
  if (!url) return fallback;
  if (url.startsWith('/') && !url.startsWith('//')) return url;
  if (/^data:image\/(png|jpe?g|webp|gif|avif|svg\+xml);/i.test(url) || url.startsWith('blob:')) return url;
  try {
    const parsed = new URL(url, location.origin);
    return ['https:', 'http:'].includes(parsed.protocol) ? parsed.href : fallback;
  } catch { return fallback; }
}

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

/** Replaces children of `el` with the given markup. */
export function mount(el, markup) {
  if (!el) return el;
  el.innerHTML = render(markup);
  return el;
}

/** Event delegation: on(root, 'click', '[data-action=add]', (event, target) => …) */
export function on(root, type, selector, handler, options) {
  root.addEventListener(type, event => {
    const target = event.target instanceof Element ? event.target.closest(selector) : null;
    if (target && root.contains(target)) handler(event, target);
  }, options);
}

export const debounce = (fn, wait = 200) => {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), wait); };
};

export const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
