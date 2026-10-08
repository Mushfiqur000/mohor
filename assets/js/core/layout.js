// Shared chrome injected into every storefront page: announcement bar,
// header, menu, search, bag drawer, support sheet, bottom tab bar, footer.
// Pages contain <div id="app-header"></div> … <div id="app-footer"></div>
// and call `await boot({ page: 'home' })` from their module.

import { html, mount, raw, on, safeUrl, debounce, $ } from './dom.js';
import { t, applyTranslations, toggleLang, onLangChange, getLang } from './i18n.js';
import { money } from './format.js';
import { icon, sheet, toast, emptyState } from './ui.js';
import { initAuth, session } from './auth.js';
import * as bag from './cart.js';
import { wishlist } from './wishlist.js';
import { loadProducts, loadSettings, matches, titleOf, imageOf, productUrl, pricing, categoryLabel, CATEGORIES } from './catalog.js';
import { track } from './analytics.js';

export const CONTACT = {
  whatsapp: '8801330113027',
  phone: '+8801330113027',
  phoneLabel: '+880 1330-113027',
  facebook: 'https://www.facebook.com/mohor0000',
  messenger: 'https://m.me/mohor0000',
  instagram: 'https://www.instagram.com/mohorclothings',
};

const NAV = [
  { href: '/', key: 'navHome', page: 'home' },
  { href: '/shop', key: 'navShop', page: 'shop' },
  { href: '/about', key: 'navAbout', page: 'about' },
  { href: '/policy', key: 'navPolicy', page: 'policy' },
];

// ---- Theme ----------------------------------------------------------------

const THEME_KEY = 'mohor:theme';
const storedTheme = () => { try { return localStorage.getItem(THEME_KEY) || localStorage.getItem('mohor_theme') || ''; } catch { return ''; } };
export function applyTheme(theme = storedTheme()) {
  const value = theme === 'dark' || theme === 'light' ? theme : '';
  if (value) document.documentElement.dataset.theme = value; else delete document.documentElement.dataset.theme;
  const dark = value ? value === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#16110f' : '#faf6f0');
}
function toggleTheme() {
  const dark = document.documentElement.dataset.theme
    ? document.documentElement.dataset.theme === 'dark'
    : matchMedia('(prefers-color-scheme: dark)').matches;
  const next = dark ? 'light' : 'dark';
  try { localStorage.setItem(THEME_KEY, next); } catch { /* ignore */ }
  applyTheme(next);
}
applyTheme();

// ---- Markup ---------------------------------------------------------------

const logo = () => html`<a class="logo" href="/" aria-label="${t('brand')} — ${t('navHome')}">
  <img class="logo-img logo-light" src="/assets/logo-ink.png" alt="" width="132" height="40">
  <img class="logo-img logo-dark" src="/assets/logo-white.png" alt="" width="132" height="40"></a>`;

const header = page => html`
  <a class="skip" href="#main">Skip to content</a>
  <div class="announce" id="announce" hidden></div>
  <header class="site-header" id="site-header">
    <div class="wrap header-row">
      <button class="icon-btn header-menu" type="button" data-open="menu" aria-label="${t('navMenu')}">${icon('menu')}</button>
      ${logo()}
      <nav class="header-nav" aria-label="Primary">
        ${NAV.map(n => html`<a href="${n.href}" ${n.page === page ? raw('aria-current="page"') : ''} data-i18n="${n.key}">${t(n.key)}</a>`)}
      </nav>
      <div class="header-actions">
        <button class="icon-btn" type="button" data-open="search" aria-label="${t('navSearch')}">${icon('search')}</button>
        <button class="icon-btn hide-sm" type="button" data-lang aria-label="Language"><span class="lang-chip">${getLang() === 'en' ? 'বাং' : 'EN'}</span></button>
        <a class="icon-btn hide-sm" href="/wishlist" aria-label="${t('navWishlist')}">${icon('heart')}<span class="dot-count" data-wish-count hidden></span></a>
        <a class="icon-btn hide-sm" href="/account" aria-label="${t('navAccount')}">${icon('user')}</a>
        <button class="icon-btn" type="button" data-open="bag" aria-label="${t('navCart')}">${icon('bag')}<span class="dot-count" data-bag-count hidden></span></button>
      </div>
    </div>
  </header>`;

const tabbar = page => {
  const tab = (href, name, key, pageKey, extra = '') => html`<a href="${href}" class="tab" ${page === pageKey ? raw('aria-current="page"') : ''}>
    <span class="tab-icon">${icon(name, 22)}${raw(extra)}</span><span class="tab-label" data-i18n="${key}">${t(key)}</span></a>`;
  return html`<nav class="tabbar" aria-label="Quick">
    ${tab('/', 'home', 'navHome', 'home')}
    ${tab('/shop', 'grid', 'navShop', 'shop')}
    ${tab('/wishlist', 'heart', 'navWishlist', 'wishlist', '<span class="dot-count" data-wish-count hidden></span>')}
    <button class="tab" type="button" data-open="bag"><span class="tab-icon">${icon('bag', 22)}<span class="dot-count" data-bag-count hidden></span></span><span class="tab-label" data-i18n="navCart">${t('navCart')}</span></button>
    ${tab('/account', 'user', 'navAccount', 'account')}
  </nav>`;
};

const footer = () => html`
  <footer class="site-footer">
    <div class="wrap footer-grid">
      <div class="footer-brand">${logo()}<p data-i18n="footerAbout">${t('footerAbout')}</p>
        <div class="footer-social">
          <a href="${CONTACT.facebook}" target="_blank" rel="noopener" aria-label="Facebook">${icon('facebook')}</a>
          <a href="${CONTACT.instagram}" target="_blank" rel="noopener" aria-label="Instagram">${icon('instagram')}</a>
          <a href="https://wa.me/${CONTACT.whatsapp}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon('whatsapp')}</a>
        </div></div>
      <div><h3 data-i18n="footerShop">${t('footerShop')}</h3><ul>
        <li><a href="/shop">${t('all')}</a></li>
        ${CATEGORIES.map(c => html`<li><a href="/shop?cat=${c.key}">${c.label()}</a></li>`)}
      </ul></div>
      <div><h3 data-i18n="footerHelp">${t('footerHelp')}</h3><ul>
        <li><a href="/policy" data-i18n="navPolicy">${t('navPolicy')}</a></li>
        <li><a href="/orders" data-i18n="navTrack">${t('navTrack')}</a></li>
        <li><a href="/about" data-i18n="navAbout">${t('navAbout')}</a></li>
        <li><button class="linklike" type="button" data-open="support" data-i18n="navSupport">${t('navSupport')}</button></li>
      </ul></div>
      <div><h3>${t('supportCall')}</h3><ul>
        <li><a href="tel:${CONTACT.phone}">${CONTACT.phoneLabel}</a></li>
        <li><a href="https://wa.me/${CONTACT.whatsapp}" target="_blank" rel="noopener">WhatsApp</a></li>
        <li class="muted" data-i18n="supportHours">${t('supportHours')}</li>
      </ul></div>
    </div>
    <div class="wrap footer-base"><span>© ${new Date().getFullYear()} ${t('brand')}. <span data-i18n="footerRights">${t('footerRights')}</span></span>
      <span class="footer-toggles"><button class="linklike" type="button" data-lang>${t('language')}</button> · <button class="linklike" type="button" data-theme-toggle>${t('theme')}</button></span></div>
  </footer>`;

// ---- Sheets ---------------------------------------------------------------

function menuSheet(page) {
  const user = session.get();
  return sheet({
    id: 'menu-sheet', side: 'left', title: t('navMenu'),
    body: html`
      <nav class="menu-nav" aria-label="Menu">
        ${NAV.map(n => html`<a href="${n.href}" ${n.page === page ? raw('aria-current="page"') : ''}>${t(n.key)}${icon('chevronRight', 18)}</a>`)}
        <a href="/wishlist">${t('navWishlist')}${icon('chevronRight', 18)}</a>
        <a href="/orders">${t('navOrders')}${icon('chevronRight', 18)}</a>
      </nav>
      <p class="menu-label">${t('footerShop')}</p>
      <div class="chip-row">${CATEGORIES.map(c => html`<a class="chip" href="/shop?cat=${c.key}">${c.label()}</a>`)}</div>
      <div class="menu-tools">
        <button class="btn btn-ghost" type="button" data-lang>${icon('globe', 18)} ${t('language')}</button>
        <button class="btn btn-ghost" type="button" data-theme-toggle>${icon('moon', 18)} ${t('theme')}</button>
      </div>
      <button class="menu-help" type="button" data-open="support">${icon('chat', 20)}<span><b>${t('supportTitle')}</b><small>${t('supportHours')}</small></span></button>`,
    footer: user
      ? html`<a class="btn btn-ghost btn-block" href="/account">${icon('user', 18)} ${user.name || user.email}</a>`
      : html`<a class="btn btn-primary btn-block" href="/login">${t('signIn')}</a>`,
  });
}

function supportSheet() {
  const faqs = [
    ['faqDeliveryQ', 'faqDeliveryA'], ['faqPaymentQ', 'faqPaymentA'], ['faqExchangeQ', 'faqExchangeA'], ['faqSizeQ', 'faqSizeA'],
  ];
  return sheet({
    id: 'support-sheet', side: 'bottom', title: t('supportTitle'),
    body: html`
      <div class="support-grid">
        <a class="support-card is-wa" href="https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent('Hi Mohor! ')}" target="_blank" rel="noopener" data-contact>${icon('whatsapp', 24)}<b>${t('supportWhatsapp')}</b><small>${t('supportReply')}</small></a>
        <a class="support-card" href="tel:${CONTACT.phone}" data-contact>${icon('phone', 24)}<b>${t('supportCall')}</b><small>${CONTACT.phoneLabel}</small></a>
        <a class="support-card" href="${CONTACT.messenger}" target="_blank" rel="noopener" data-contact>${icon('facebook', 24)}<b>${t('supportMessenger')}</b><small>Messenger</small></a>
        <a class="support-card" href="/orders">${icon('truck', 24)}<b>${t('supportTrack')}</b><small>${t('supportTrackHint')}</small></a>
      </div>
      <h3 class="menu-label">${t('supportFaq')}</h3>
      <div class="faq">${faqs.map(([q, a]) => html`<details><summary>${t(q)}${icon('chevronDown', 18)}</summary><p>${t(a)}</p></details>`)}</div>
      <p class="muted center">${t('supportHours')}</p>`,
  });
}

function searchSheet() {
  const s = sheet({
    id: 'search-sheet', side: 'top', className: 'sheet-search', label: t('navSearch'),
    body: html`
      <form class="search-bar" role="search" action="/shop">
        ${icon('search', 20)}
        <input type="search" name="q" autocomplete="off" enterkeyhint="search" placeholder="${t('searchPlaceholder')}" aria-label="${t('navSearch')}">
        <button class="icon-btn" type="button" data-close aria-label="${t('close')}">${icon('close')}</button>
      </form>
      <div class="search-results" aria-live="polite"></div>`,
  });
  const input = $('input', s.el);
  const results = $('.search-results', s.el);
  const renderSuggestions = async () => {
    const q = input.value.trim();
    const products = await loadProducts().catch(() => []);
    if (!q) {
      mount(results, html`<p class="menu-label">${t('searchTrending')}</p>
        <div class="chip-row">${CATEGORIES.map(c => html`<a class="chip" href="/shop?cat=${c.key}">${c.label()}</a>`)}</div>
        <div class="search-list">${products.filter(p => p.featured).concat(products).slice(0, 4).map(resultRow)}</div>`);
      return;
    }
    const found = products.filter(p => matches(p, q));
    mount(results, found.length
      ? html`<div class="search-list">${found.slice(0, 6).map(resultRow)}</div>
        <a class="btn btn-ghost btn-block" href="/shop?q=${encodeURIComponent(q)}">${t('searchViewAll')} (${found.length})</a>`
      : html`<p class="muted center">${t('searchEmpty')}</p>`);
  };
  const resultRow = p => {
    const { price } = pricing(p);
    return html`<a class="search-row" href="${productUrl(p)}"><img src="${safeUrl(imageOf(p))}" alt="" width="48" height="64" loading="lazy">
      <span><b>${titleOf(p)}</b><small>${categoryLabel(p.category)}</small></span><span class="price-now">${money(price)}</span></a>`;
  };
  input.addEventListener('input', debounce(renderSuggestions, 120));
  $('form', s.el).addEventListener('submit', () => track('Search', { search_string: input.value }));
  const open = s.open;
  s.open = () => { open(); renderSuggestions(); setTimeout(() => input.focus(), 50); };
  return s;
}

function bagSheet() {
  const s = sheet({ id: 'bag-sheet', side: 'right', title: t('cartTitle') });
  const render = async () => {
    const { lines, subtotal, savings } = await bag.hydrate();
    if (!lines.length) {
      s.setBody(emptyState({ iconName: 'bag', title: t('cartEmpty'), text: t('cartEmptyHint'), action: { href: '/shop', label: t('cartContinue') } }));
      s.setFooter(null);
      return;
    }
    s.setBody(html`<ul class="bag-list">${lines.map(l => html`
      <li class="bag-line" data-line="${JSON.stringify({ id: l.id, size: l.size, color: l.color })}">
        <a href="${productUrl(l.product)}"><img src="${safeUrl(imageOf(l.product))}" alt="" width="76" height="100" loading="lazy"></a>
        <div class="bag-info">
          <a class="bag-title" href="${productUrl(l.product)}">${titleOf(l.product)}</a>
          <p class="bag-meta">${l.size !== 'Standard' ? html`${t('size')}: ${l.size}` : ''}${l.color ? html` · ${l.color}` : ''}</p>
          <div class="bag-row">
            <div class="stepper" role="group" aria-label="${t('qty')}">
              <button type="button" data-step="-1" aria-label="−">${icon('minus', 16)}</button>
              <output>${l.qty}</output>
              <button type="button" data-step="1" ${l.qty >= l.available ? 'disabled' : ''} aria-label="+">${icon('plus', 16)}</button>
            </div>
            <span class="price-now">${money(l.lineTotal)}</span>
          </div>
          ${l.qty > l.available ? html`<p class="warn">${l.available ? t('onlyLeft', { n: l.available }) : t('soldOut')}</p>` : ''}
        </div>
        <button class="icon-btn bag-remove" type="button" data-remove aria-label="${t('cartRemove')}">${icon('close', 18)}</button>
      </li>`)}</ul>`);
    s.setFooter(html`
      ${savings ? html`<p class="bag-savings">${t('cartSaved')} <b>${money(savings)}</b></p>` : ''}
      <div class="bag-total"><span>${t('cartSubtotal')}</span><b>${money(subtotal)}</b></div>
      <a class="btn btn-primary btn-block" href="/cart">${t('cartCheckout')} ${icon('arrowRight', 18)}</a>`);
  };
  s.el.addEventListener('click', async e => {
    const lineEl = e.target.closest('[data-line]');
    if (!lineEl) return;
    const line = JSON.parse(lineEl.dataset.line);
    const current = bag.cart.get().find(i => i.id === line.id && i.size === line.size && i.color === line.color);
    if (e.target.closest('[data-remove]')) { bag.remove(line); toast(t('removed')); }
    const step = e.target.closest('[data-step]');
    if (step && current) await bag.setQty(current, current.qty + Number(step.dataset.step));
  });
  bag.cart.subscribe(() => s.el.open && render());
  const open = s.open;
  s.open = () => { render(); open(); };
  return s;
}

// ---- Boot -----------------------------------------------------------------

let sheets = {};
function updateCounts() {
  const n = bag.count();
  document.querySelectorAll('[data-bag-count]').forEach(el => { el.hidden = !n; el.textContent = n > 9 ? '9+' : String(n); });
  const w = wishlist.get().length;
  document.querySelectorAll('[data-wish-count]').forEach(el => { el.hidden = !w; el.textContent = w > 9 ? '9+' : String(w); });
}

async function announcement() {
  const s = await loadSettings();
  const el = document.getElementById('announce');
  if (!el) return;
  const text = s.saleActive && s.bannerText ? s.bannerText : s.announcement;
  const ended = s.saleEndTime && Date.parse(s.saleEndTime) < Date.now();
  if (!text || (s.saleActive && ended)) return;
  mount(el, html`<div class="wrap announce-row">${s.bannerBadge ? html`<span class="announce-badge">${s.bannerBadge}</span>` : ''}<span>${text}</span>
    ${s.saleActive && s.saleEndTime ? html`<span class="announce-timer" data-ends="${s.saleEndTime}"></span>` : ''}</div>`);
  el.hidden = false;
  const timer = el.querySelector('[data-ends]');
  if (timer) {
    const tick = () => {
      const left = Math.max(0, Date.parse(timer.dataset.ends) - Date.now());
      const h = Math.floor(left / 36e5), m = Math.floor(left % 36e5 / 6e4), sec = Math.floor(left % 6e4 / 1e3);
      timer.textContent = `${h}h ${String(m).padStart(2, '0')}m ${String(sec).padStart(2, '0')}s`;
      if (!left) el.hidden = true;
    };
    tick(); setInterval(tick, 1000);
  }
}

/**
 * @param {{ page: string, chrome?: boolean }} opts — chrome:false skips header/footer (admin).
 */
export async function boot({ page, chrome = true }) {
  document.documentElement.classList.add('js');
  if (chrome) {
    mount(document.getElementById('app-header'), header(page));
    mount(document.getElementById('app-footer'), html`${footer()}${tabbar(page)}`);
    sheets = { menu: () => menuSheet(page), search: searchSheet(), bag: bagSheet(), support: () => supportSheet() };
    on(document, 'click', '[data-open]', (e, btn) => {
      e.preventDefault();
      document.querySelectorAll('dialog[open]').forEach(d => { if (d.contains(btn)) d.close(); });
      const target = sheets[btn.dataset.open];
      const s = typeof target === 'function' ? target() : target;
      s?.open();
    });
    on(document, 'click', '[data-contact]', () => track('Contact'));
    // Header gains a hairline once the page scrolls.
    const headerEl = document.getElementById('site-header');
    const onScroll = () => headerEl?.classList.toggle('is-scrolled', scrollY > 8);
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
    announcement();
  }
  on(document, 'click', '[data-lang]', () => toggleLang());
  on(document, 'click', '[data-theme-toggle]', () => toggleTheme());
  onLangChange(() => {
    if (!chrome) return;
    mount(document.getElementById('app-header'), header(page));
    mount(document.getElementById('app-footer'), html`${footer()}${tabbar(page)}`);
    ['menu-sheet', 'support-sheet'].forEach(id => document.getElementById(id)?.remove());
    updateCounts(); announcement();
  });
  bag.cart.subscribe(updateCounts);
  wishlist.subscribe(updateCounts);
  updateCounts();
  applyTranslations();

  addEventListener('offline', () => toast(t('offline'), { type: 'error' }));
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
  }
  track('PageView');
  const user = await initAuth();
  if (user) bag.syncOnLoad();
  return user;
}

/** Opens the bag drawer (used after "Add to bag"). */
export const openBag = () => sheets.bag?.open();
