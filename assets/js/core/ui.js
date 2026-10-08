// UI primitives: toasts, modal sheets (native <dialog>, so focus trapping and
// Esc come for free), confirm prompts, icons and loading skeletons.

import { html, mount, raw, $ } from './dom.js';
import { t } from './i18n.js';

// ---- Icons (inline SVG, stroke = currentColor) -----------------------------

const PATHS = {
  menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
  bag: '<path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  home: '<path d="m3 11 9-7 9 7"/><path d="M5 10v10h14V10"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  chevronRight: '<path d="m9 6 6 6-6 6"/>',
  chevronLeft: '<path d="m15 6-6 6 6 6"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
  rows: '<rect x="4" y="4" width="16" height="7" rx="1"/><rect x="4" y="13" width="16" height="7" rx="1"/>',
  check: '<path d="m5 12 5 5 9-10"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  truck: '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6"/>',
  shield: '<path d="M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>',
  chat: '<path d="M4 5h16v11H8l-4 4V5Z"/>',
  whatsapp: '<path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3Z"/><path d="M8.5 8.5c.3 2.8 2.2 5 5 6l1.4-1.4 2 1c-.3 1.2-1.4 2-2.6 1.8C10.7 15.4 8.6 13.3 8 9.7 7.8 8.5 8.6 7.4 9.8 7.1l1 2-1.3 1.4"/>',
  facebook: '<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8Z"/>',
  instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r=".8" fill="currentColor"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6 19 19M5 19l1.4-1.4M17.6 6.4 19 5"/>',
  package: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2Z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  logout: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
  ruler: '<path d="M3 16 16 3l5 5L8 21l-5-5Z"/><path d="m7 12 2 2M10 9l2 2M13 6l2 2"/>',
  share: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16v4Z"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  location: '<path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
};

/** @param {keyof typeof PATHS} name */
export const icon = (name, size = 22, extra = '') => raw(
  `<svg class="icon ${extra}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${PATHS[name] || ''}</svg>`,
);

// ---- Toasts ---------------------------------------------------------------

let stack;
/** @param {string} message @param {{ type?: 'info'|'success'|'error', action?: { label: string, href?: string, onClick?: () => void }, duration?: number }} [opts] */
export function toast(message, { type = 'info', action, duration = 3200 } = {}) {
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    stack.setAttribute('role', 'status');
    stack.setAttribute('aria-live', 'polite');
    document.body.append(stack);
  }
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  mount(el, html`<span class="toast-icon">${icon(type === 'error' ? 'info' : 'check', 18)}</span><span class="toast-text">${message}</span>${action ? html`<a class="toast-action" href="${action.href || '#'}">${action.label}</a>` : ''}`);
  if (action?.onClick) el.querySelector('.toast-action').addEventListener('click', e => { e.preventDefault(); action.onClick(); });
  stack.append(el);
  requestAnimationFrame(() => el.classList.add('is-in'));
  const dismiss = () => { el.classList.remove('is-in'); setTimeout(() => el.remove(), 250); };
  setTimeout(dismiss, duration);
  el.addEventListener('click', e => { if (!e.target.closest('.toast-action')) dismiss(); });
}

// ---- Sheets (bottom sheet on mobile, side drawer ≥ 768px) -----------------

/**
 * @param {{ id?: string, title?: string, side?: 'right'|'left'|'bottom'|'center', className?: string, body: any, footer?: any, onClose?: () => void, label?: string }} opts
 * @returns {{ el: HTMLDialogElement, body: HTMLElement, footer: HTMLElement, open: () => void, close: () => void, setBody: (m: any) => void, setFooter: (m: any) => void }}
 */
export function sheet({ id, title = '', side = 'right', className = '', body, footer, onClose, label }) {
  let el = id ? document.getElementById(id) : null;
  if (!el) {
    el = document.createElement('dialog');
    if (id) el.id = id;
    el.className = `sheet sheet-${side} ${className}`;
    el.setAttribute('aria-label', label || title);
    mount(el, html`
      <div class="sheet-panel">
        ${title ? html`<header class="sheet-head"><h2 class="sheet-title">${title}</h2>
          <button class="icon-btn" type="button" data-close aria-label="${t('close')}">${icon('close')}</button></header>` : ''}
        <div class="sheet-body"></div>
        <footer class="sheet-foot" hidden></footer>
      </div>`);
    document.body.append(el);
    el.addEventListener('click', e => {
      if (e.target === el || e.target.closest('[data-close]')) api.close();
    });
    el.addEventListener('close', () => { document.documentElement.classList.remove('has-sheet'); onClose?.(); });
    // Swipe-down to dismiss on touch devices.
    let startY = null;
    const panel = el.querySelector('.sheet-panel');
    panel.addEventListener('touchstart', e => { startY = panel.scrollTop <= 0 && e.target.closest('.sheet-head, .sheet-grab') ? e.touches[0].clientY : null; }, { passive: true });
    panel.addEventListener('touchmove', e => {
      if (startY === null) return;
      const dy = Math.max(0, e.touches[0].clientY - startY);
      panel.style.transform = `translateY(${dy}px)`;
    }, { passive: true });
    panel.addEventListener('touchend', e => {
      if (startY === null) return;
      const dy = e.changedTouches[0].clientY - startY;
      panel.style.transform = '';
      startY = null;
      if (dy > 90) api.close();
    });
  }
  const bodyEl = $('.sheet-body', el);
  const footEl = $('.sheet-foot', el);
  const api = {
    el, body: bodyEl, footer: footEl,
    open() {
      if (el.open) return;
      el.showModal();
      document.documentElement.classList.add('has-sheet');
      requestAnimationFrame(() => el.classList.add('is-open'));
    },
    close() {
      if (!el.open) return;
      el.classList.remove('is-open');
      const done = () => el.open && el.close();
      matchMedia('(prefers-reduced-motion: reduce)').matches ? done() : setTimeout(done, 260);
    },
    setBody(m) { mount(bodyEl, m); },
    setFooter(m) { footEl.hidden = !m; if (m) mount(footEl, m); },
  };
  if (body !== undefined) api.setBody(body);
  if (footer !== undefined) api.setFooter(footer);
  return api;
}

/** @returns {Promise<boolean>} */
export function confirmDialog({ title, message, confirm = 'OK', cancel = t('close'), danger = false }) {
  return new Promise(resolve => {
    const s = sheet({
      side: 'center', className: 'sheet-confirm', label: title,
      body: html`<h2 class="confirm-title">${title}</h2>${message ? html`<p class="confirm-text">${message}</p>` : ''}
        <div class="confirm-actions"><button class="btn btn-ghost" data-answer="no" type="button">${cancel}</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-answer="yes" type="button">${confirm}</button></div>`,
      onClose: () => { resolve(answer); s.el.remove(); },
    });
    let answer = false;
    s.body.addEventListener('click', e => {
      const btn = e.target.closest('[data-answer]');
      if (!btn) return;
      answer = btn.dataset.answer === 'yes';
      s.close();
    });
    s.open();
  });
}

// ---- Misc -----------------------------------------------------------------

export const skeletonCards = (n = 6) => raw(Array.from({ length: n }, () =>
  '<div class="card card-skeleton" aria-hidden="true"><div class="card-media skeleton"></div><div class="skeleton skeleton-line"></div><div class="skeleton skeleton-line short"></div></div>').join(''));

export const emptyState = ({ iconName = 'bag', title, text = '', action }) => html`
  <div class="empty">
    <div class="empty-icon">${icon(iconName, 30)}</div>
    <h3 class="empty-title">${title}</h3>
    ${text ? html`<p class="empty-text">${text}</p>` : ''}
    ${action ? html`<a class="btn btn-primary" href="${action.href}">${action.label}</a>` : ''}
  </div>`;

/** Sets button busy state; returns a function that restores it. */
export function busy(button, label = t('loading')) {
  if (!button) return () => {};
  const previous = button.innerHTML;
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  mount(button, html`<span class="spinner" aria-hidden="true"></span><span>${label}</span>`);
  return () => { button.disabled = false; button.removeAttribute('aria-busy'); button.innerHTML = previous; };
}

export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}
