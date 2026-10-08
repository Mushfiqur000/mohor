// MOHOR admin studio: sign-in gate, app shell, hash router.
import { boot } from '/assets/js/core/layout.js';
import { html, mount, on, $ } from '/assets/js/core/dom.js';
import { t, onLangChange, getLang } from '/assets/js/core/i18n.js';
import { login, logout } from '/assets/js/core/auth.js';
import { icon, toast, sheet, busy } from '/assets/js/core/ui.js';
import { leaveOk, dirty } from './admin/shared.js';
import * as dashboard from './admin/dashboard.js';
import * as orders from './admin/orders.js';
import * as historyView from './admin/history.js';
import * as products from './admin/products.js';
import * as banners from './admin/banners.js';
import * as settings from './admin/settings.js';
import * as notify from './admin/notify.js';
import * as customers from './admin/customers.js';

const SECTIONS = [
  { key: 'dashboard', label: 'admDashboard', icon: 'grid', mod: dashboard, primary: true },
  { key: 'orders', label: 'admOrders', icon: 'package', mod: orders, primary: true },
  { key: 'products', label: 'admProducts', icon: 'bag', mod: products, primary: true },
  { key: 'history', label: 'admHistory', icon: 'rows', mod: historyView },
  { key: 'customers', label: 'admCustomers', icon: 'user', mod: customers },
  { key: 'banners', label: 'admBanners', icon: 'sparkle', mod: banners },
  { key: 'notifications', label: 'admNotify', icon: 'bell', mod: notify },
  { key: 'settings', label: 'admSettings', icon: 'filter', mod: settings },
];
const root = document.getElementById('main');
let current = '';
let user = null;

const sectionFromHash = () => {
  const key = location.hash.slice(1);
  return SECTIONS.find(s => s.key === key) ? key : 'dashboard';
};

function renderLogin(message = '') {
  mount(root, html`
    <section class="adm-login">
      <form class="panel adm-login-card" novalidate>
        <img class="adm-login-logo" src="/assets/logo-ink.png" alt="MOHOR" width="120" height="40">
        <p class="eyebrow">${t('adm')}</p>
        <h1 class="display">${t('admSignInTitle')}</h1>
        <p class="muted">${t('admSignInText')}</p>
        ${message ? html`<p class="field-error" role="alert">${message}</p>` : ''}
        <label class="field"><span>${t('admEmail')}</span><input class="input" name="email" type="email" autocomplete="username" required></label>
        <label class="field"><span>${t('admPassword')}</span><input class="input" name="password" type="password" autocomplete="current-password" required></label>
        <button class="btn btn-primary btn-block" type="submit">${t('signIn')}</button>
        <a class="link" href="/">${t('admViewStore')}</a>
      </form>
    </section>`);
  const form = $('form', root);
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const restore = busy($('button[type=submit]', form));
    try {
      const u = await login(form.email.value.trim(), form.password.value);
      if (u?.role !== 'admin') { logout(); renderLogin(t('admNotAdmin')); return; }
      user = u; renderShell();
    } catch (error) { restore(); renderLogin(error.message || t('errorGeneric')); }
  });
}

function navLinks(cls) {
  return SECTIONS.map(s => html`<a class="${cls}" href="#${s.key}" data-nav="${s.key}" aria-current="${s.key === current ? 'page' : 'false'}">${icon(s.icon, 20)}<span>${t(s.label)}</span></a>`);
}

function renderShell() {
  current = sectionFromHash();
  mount(root, html`
    <div class="adm-shell">
      <aside class="adm-side">
        <a class="adm-brand" href="/"><img src="/assets/logo-ink.png" alt="MOHOR" width="96" height="32"><span class="eyebrow">${t('adm')}</span></a>
        <nav class="adm-side-nav" aria-label="${t('adm')}">${navLinks('adm-side-link')}</nav>
        <div class="adm-side-foot">
          <p class="muted adm-who">${user?.name || user?.email || ''}</p>
          <button class="btn btn-ghost btn-sm" type="button" data-lang>${t('language')}</button>
          <button class="btn btn-ghost btn-sm" type="button" data-theme-toggle>${t('theme')}</button>
          <button class="btn btn-ghost btn-sm" type="button" data-signout>${icon('logout', 16)} ${t('admSignOut')}</button>
        </div>
      </aside>
      <div class="adm-main">
        <header class="adm-top">
          <h1 class="adm-top-title" id="adm-title"></h1>
          <div class="adm-top-actions">
            <button class="icon-btn" type="button" data-lang aria-label="${t('language')}">${icon('globe', 20)}</button>
            <button class="icon-btn" type="button" data-refresh aria-label="${t('admRefresh')}">${icon('refresh', 20)}</button>
          </div>
        </header>
        <div class="adm-view" id="adm-view"></div>
      </div>
      <nav class="adm-tabbar" aria-label="${t('adm')}">
        ${SECTIONS.filter(s => s.primary).map(s => html`<a class="adm-tab" href="#${s.key}" data-nav="${s.key}" aria-current="${s.key === current ? 'page' : 'false'}">${icon(s.icon, 22)}<span>${t(s.label)}</span></a>`)}
        <button class="adm-tab" type="button" data-more aria-current="${SECTIONS.find(s => s.key === current)?.primary ? 'false' : 'page'}">${icon('menu', 22)}<span>${t('admMore')}</span></button>
      </nav>
    </div>`);
  show(current, true);
}

async function show(key, force = false) {
  if (key === current && !force) return;
  current = key;
  const section = SECTIONS.find(s => s.key === key);
  document.querySelectorAll('[data-nav]').forEach(a => a.setAttribute('aria-current', a.dataset.nav === key ? 'page' : 'false'));
  $('[data-more]')?.setAttribute('aria-current', section.primary ? 'false' : 'page');
  const titleEl = $('#adm-title');
  if (titleEl) titleEl.textContent = t(section.label);
  document.title = `${t(section.label)} — MOHOR ${t('adm')}`;
  const view = $('#adm-view');
  if (!view) return;
  view.scrollTop = 0; scrollTo(0, 0);
  await section.mod.render(view, { user });
}

function moreSheet() {
  const s = sheet({ id: 'adm-more', side: 'bottom', title: t('admMore'), body: html`<nav class="adm-more-list">${navLinks('adm-more-link')}
      <button class="adm-more-link" type="button" data-lang>${icon('globe', 20)}<span>${t('language')}</span></button>
      <button class="adm-more-link" type="button" data-theme-toggle>${icon('moon', 20)}<span>${t('theme')}</span></button>
      <button class="adm-more-link" type="button" data-signout>${icon('logout', 20)}<span>${t('admSignOut')}</span></button></nav>`,
    onClose: () => s.el.remove() });
  s.body.addEventListener('click', e => { if (e.target.closest('a,button')) s.close(); });
  s.open();
}

// Navigation with unsaved-change guard.
on(document, 'click', '[data-nav]', async (e, a) => {
  e.preventDefault();
  if (a.dataset.nav === current) return;
  if (!(await leaveOk())) return;
  window.history.pushState(null, '', `#${a.dataset.nav}`);
  show(a.dataset.nav);
});
addEventListener('popstate', async () => {
  const key = sectionFromHash();
  if (key === current) return;
  if (!(await leaveOk())) { window.history.pushState(null, '', `#${current}`); return; }
  show(key);
});
on(document, 'click', '[data-more]', () => moreSheet());
on(document, 'click', '[data-refresh]', async () => { if (await leaveOk()) show(current, true); });
on(document, 'click', '[data-signout]', async () => { if (!(await leaveOk())) return; logout(); user = null; renderLogin(); });
addEventListener('mohor:signed-out', e => {
  if (e.detail?.reason === 'expired') { dirty.value = false; user = null; toast(t('admLoadError'), { type: 'error' }); renderLogin(); }
});
onLangChange(() => { if (user && !dirty.value) renderShell(); else if (!user) renderLogin(); });

user = await boot({ page: 'admin', chrome: false });
document.documentElement.lang = getLang();
if (user?.role === 'admin') renderShell();
else renderLogin(user ? t('admNotAdmin') : '');
