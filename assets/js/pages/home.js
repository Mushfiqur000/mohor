// Home: banner carousel (D1 banners, bundled fallback), editorial intro,
// trust row, sale strip, categories, featured + new arrivals, story, help.

import { boot, CONTACT } from '/assets/js/core/layout.js';
import { html, mount, $, safeUrl, prefersReducedMotion } from '/assets/js/core/dom.js';
import { t, extend, onLangChange, localized } from '/assets/js/core/i18n.js';
import { api } from '/assets/js/core/api.js';
import { loadProducts, loadSettings, pricing, inStock, imageOf, CATEGORIES } from '/assets/js/core/catalog.js';
import { renderGrid, bindCards, productCard } from '/assets/js/core/cards.js';
import { icon, skeletonCards, emptyState } from '/assets/js/core/ui.js';

extend({
  en: {
    homeEyebrow: 'Est. in Sylhet', homeTitleA: 'Hand-finished in Sylhet,', homeTitleB: 'made with pride.',
    homeLede: 'Handmade in Sylhet, in small batches — delivered anywhere in Bangladesh.',
    homeShopCta: 'Shop the collection', homeStoryCta: 'Our story', shopNow: 'Shop now', bannerN: 'Show banner {n}',
    trustDelivery: 'Delivery across Bangladesh', trustDeliveryText: '৳70 inside Sylhet City, ৳140 outside',
    trustCod: 'Cash on delivery', trustCodText: 'Pay when the parcel reaches you',
    trustExchange: 'Exchange within 24 hours', trustExchangeText: 'Of delivery — unworn pieces with tags',
    trustBatch: 'Made in small batches', trustBatchText: 'Hand-finished embroidery throughout',
    catEyebrow: 'Browse', catHeading: 'Shop by category', catOnSale: 'On sale', catCount: '{n} pieces',
    catHintThreePiece: 'Soft cotton sets', catHintKurti: 'Everyday & office wear', catHintKhadi: 'Handwoven, breathable',
    catHintSaree: 'For the occasions', catHintSale: 'Reduced this week',
    featEyebrow: 'Our collection', featHeading: 'Featured pieces', newEyebrow: 'Just in', newHeading: 'New arrivals', seeAll: 'See all',
    saleOff: '{n}% off storewide', saleEnds: 'Ends in', saleShop: 'Shop the sale',
    promiseHeading: 'Why shop with Mohor',
    promise1: 'Handcrafted detail', promise1Text: 'Embroidery and finishing worked by hand into every piece.',
    promise2: 'Premium fabric', promise2Text: 'Breathable soft cotton and authentic khadi, chosen for comfort.',
    promise3: 'Nationwide delivery', promise3Text: 'From Sylhet to every district of Bangladesh.',
    storyA: 'About', storyText: 'Welcome to Mohor Clothings, a home for handcrafted fashion in Bangladesh. From breathable soft-cotton three-piece sets to tailored kurtis and authentic khadi, every piece is designed for the modern woman — for the classroom, the office or a festive evening. Proudly made in Sylhet and delivered nationwide.',
    helpTitle: 'Need help choosing?', helpText: 'Send us a photo or your measurements — we reply within minutes, every day 10am – 10pm.',
    noProducts: 'New pieces are on their way', noProductsText: 'Check back soon, or message us on WhatsApp.',
  },
  bn: {
    homeEyebrow: 'সিলেটে প্রতিষ্ঠিত', homeTitleA: 'সিলেটে হাতে তৈরি,', homeTitleB: 'গর্বের সঙ্গে পরুন।',
    homeLede: 'সিলেটে হাতে তৈরি, অল্প অল্প করে — বাংলাদেশের যেকোনো জায়গায় ডেলিভারি।',
    homeShopCta: 'কালেকশন দেখুন', homeStoryCta: 'আমাদের গল্প', shopNow: 'এখনই কিনুন', bannerN: 'ব্যানার {n} দেখুন',
    trustDelivery: 'সারা বাংলাদেশে ডেলিভারি', trustDeliveryText: 'সিলেট সিটিতে ৳৭০, বাইরে ৳১৪০',
    trustCod: 'ক্যাশ অন ডেলিভারি', trustCodText: 'পার্সেল হাতে পেয়ে টাকা দিন',
    trustExchange: '২৪ ঘণ্টার মধ্যে এক্সচেঞ্জ', trustExchangeText: 'ডেলিভারির পর — ট্যাগসহ অব্যবহৃত পণ্য',
    trustBatch: 'অল্প পরিমাণে তৈরি', trustBatchText: 'পুরোটাই হাতে ফিনিশ করা এমব্রয়ডারি',
    catEyebrow: 'ব্রাউজ', catHeading: 'ক্যাটাগরি অনুযায়ী', catOnSale: 'সেল চলছে', catCount: '{n}টি পণ্য',
    catHintThreePiece: 'নরম সুতির সেট', catHintKurti: 'প্রতিদিন ও অফিসের জন্য', catHintKhadi: 'হাতে বোনা, আরামদায়ক',
    catHintSaree: 'বিশেষ দিনের জন্য', catHintSale: 'এই সপ্তাহে কম দামে',
    featEyebrow: 'আমাদের কালেকশন', featHeading: 'বাছাই করা পণ্য', newEyebrow: 'নতুন এসেছে', newHeading: 'নতুন কালেকশন', seeAll: 'সব দেখুন',
    saleOff: 'সব পণ্যে {n}% ছাড়', saleEnds: 'শেষ হবে', saleShop: 'সেলের পণ্য দেখুন',
    promiseHeading: 'কেন মোহর',
    promise1: 'হাতের কাজ', promise1Text: 'প্রতিটি পণ্যে হাতে করা এমব্রয়ডারি ও ফিনিশিং।',
    promise2: 'উন্নত কাপড়', promise2Text: 'আরামের জন্য বাছাই করা নরম সুতি ও খাঁটি খাদি।',
    promise3: 'সারা দেশে ডেলিভারি', promise3Text: 'সিলেট থেকে বাংলাদেশের প্রতিটি জেলায়।',
    storyA: 'পরিচিতি', storyText: 'মোহর ক্লোদিংসে স্বাগতম — বাংলাদেশে হাতে তৈরি পোশাকের ঠিকানা। নরম সুতির থ্রি-পিস থেকে শুরু করে মানানসই কুর্তি ও খাঁটি খাদি — প্রতিটি পণ্য আধুনিক নারীর জন্য ডিজাইন করা, ক্লাসরুম, অফিস কিংবা উৎসবের সন্ধ্যায়। সিলেটে তৈরি, সারা দেশে ডেলিভারি।',
    helpTitle: 'বাছাই করতে সাহায্য লাগবে?', helpText: 'ছবি বা মাপ পাঠান — প্রতিদিন সকাল ১০টা থেকে রাত ১০টা, কয়েক মিনিটে উত্তর দিই।',
    noProducts: 'নতুন পণ্য আসছে', noProductsText: 'শিগগিরই আবার দেখুন, অথবা হোয়াটসঅ্যাপে মেসেজ দিন।',
  },
});

await boot({ page: 'home' });

let products = [];
let settings = {};
let banners = [];
let bannerIndex = 0;
let bannerTimer = 0;
let saleTimer = 0;

// ---- Hero -------------------------------------------------------------------

function renderHero() {
  const hero = $('#hero');
  const img = $('#hero-img');
  const copy = $('#hero-copy');
  const dots = $('#hero-dots');
  if (!banners.length) { copy.hidden = true; mount(dots, ''); return; }
  const b = banners[bannerIndex];
  const src = safeUrl(b.imageUrl);
  if (!src) return;
  // Drop the bundled srcset so the browser can't keep picking a fallback candidate.
  img.removeAttribute('srcset'); img.removeAttribute('sizes');
  img.src = src;
  img.alt = localized(b.title) || 'Mohor Clothings collection';
  img.style.objectPosition = /^\d{1,3}% \d{1,3}%$/.test(b.objectPosition || '') ? b.objectPosition : '50% 50%';
  const label = localized(b.buttonText) || t('shopNow');
  const href = !b.link || label.trim().toLowerCase() === 'shop now' ? '/shop' : safeUrl(b.link, '/shop');
  copy.hidden = !(b.title || b.subtitle);
  mount(copy, html`
    ${b.title ? html`<p class="hero-title">${localized(b.title)}</p>` : ''}
    ${b.subtitle ? html`<p class="hero-sub">${localized(b.subtitle)}</p>` : ''}
    <a class="btn btn-primary" href="${href}">${label}</a>`);
  hero.classList.add('has-banner');
  mount(dots, banners.length > 1 ? banners.map((_, i) => html`<button type="button" data-dot="${i}" aria-label="${t('bannerN', { n: i + 1 })}" aria-current="${i === bannerIndex}"></button>`) : '');
}

function schedule() {
  clearInterval(bannerTimer);
  if (banners.length > 1 && !prefersReducedMotion()) bannerTimer = setInterval(() => { bannerIndex = (bannerIndex + 1) % banners.length; renderHero(); }, 6000);
}

$('#hero-dots').addEventListener('click', e => {
  const dot = e.target.closest('[data-dot]');
  if (!dot) return;
  bannerIndex = Number(dot.dataset.dot); renderHero(); schedule();
});
$('#hero-img').addEventListener('error', () => {
  // A broken D1 banner falls back to the bundled artwork.
  const img = $('#hero-img');
  if (img.src.includes('/assets/banner-')) return;
  banners = []; $('#hero').classList.remove('has-banner');
  img.src = '/assets/banner-800.webp';
  img.srcset = '/assets/banner-800.webp 800w, /assets/banner-1280.webp 1280w, /assets/banner-1920.webp 1920w, /assets/banner-2560.webp 2560w';
  img.sizes = '100vw'; img.style.objectPosition = '';
  renderHero();
});

async function loadBanners() {
  try {
    const list = await api.get('/api/banners');
    banners = (Array.isArray(list) ? list : []).filter(b => typeof b.imageUrl === 'string' && safeUrl(b.imageUrl.trim()))
      .sort((a, b) => Number(a.displayOrder ?? 0) - Number(b.displayOrder ?? 0));
  } catch { banners = []; }
  bannerIndex = 0; renderHero(); schedule();
}

// ---- Static sections -----------------------------------------------------------

function renderIntro() {
  mount($('#home-title'), html`${t('homeTitleA')} <em>${t('homeTitleB')}</em>`);
  mount($('#story-heading'), html`${t('storyA')} <em>${t('brand')}</em>`);
  mount($('#trust'), [
    ['truck', 'trustDelivery', 'trustDeliveryText'], ['shield', 'trustCod', 'trustCodText'],
    ['refresh', 'trustExchange', 'trustExchangeText'], ['sparkle', 'trustBatch', 'trustBatchText'],
  ].map(([i, a, b]) => html`<div class="trust-item">${icon(i, 22)}<p><b>${t(a)}</b><span>${t(b)}</span></p></div>`));
  mount($('#promise'), [['sparkle', 'promise1'], ['package', 'promise2'], ['location', 'promise3']]
    .map(([i, k]) => html`<div class="promise-item">${icon(i, 26)}<h3 class="h3">${t(k)}</h3><p>${t(k + 'Text')}</p></div>`));
  mount($('#help-cta'), html`
    <div><p class="eyebrow">${t('navSupport')}</p><h2 class="h2" id="help-heading">${t('helpTitle')}</h2><p class="muted">${t('helpText')}</p></div>
    <div class="help-actions">
      <a class="btn btn-wa" href="https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent('Hi Mohor! ')}" target="_blank" rel="noopener" data-contact>${icon('whatsapp', 20)}<span>${t('supportWhatsapp')}</span></a>
      <a class="btn btn-ghost" href="tel:${CONTACT.phone}" data-contact>${icon('phone', 20)}<span>${t('supportCall')}</span></a>
      <button class="btn btn-ghost" type="button" data-open="support">${icon('chat', 20)}<span>${t('supportFaq')}</span></button>
    </div>`);
}

const HINTS = { 'three-piece': 'catHintThreePiece', kurti: 'catHintKurti', khadi: 'catHintKhadi', saree: 'catHintSaree' };

function renderCategories() {
  const tiles = CATEGORIES.map(c => {
    const items = products.filter(p => p.category === c.key);
    return { href: `/shop?cat=${encodeURIComponent(c.key)}`, label: c.label(), hint: t(HINTS[c.key]), count: items.length, img: items[0] ? imageOf(items[0]) : '' };
  }).filter(tile => !products.length || tile.count);
  const sale = products.filter(p => pricing(p).onSale);
  if (sale.length) tiles.push({ href: '/shop?sale=1', label: t('catOnSale'), hint: t('catHintSale'), count: sale.length, img: imageOf(sale[0]), sale: true });
  mount($('#cat-tiles'), tiles.map(tile => html`
    <a class="cat-tile${tile.sale ? ' is-sale' : ''}" href="${tile.href}">
      ${tile.img ? html`<img src="${safeUrl(tile.img, '/assets/image-placeholder.svg')}" alt="" loading="lazy" decoding="async" width="400" height="500">` : html`<span class="cat-tile-blank" aria-hidden="true"></span>`}
      <span class="cat-tile-text"><b>${tile.label}</b><small>${tile.hint}${tile.count ? html` · ${t('catCount', { n: tile.count })}` : ''}</small></span>
    </a>`));
}

function renderSale() {
  clearInterval(saleTimer);
  const el = $('#sale-strip');
  const end = settings.saleEndTime ? Date.parse(settings.saleEndTime) : 0;
  const running = settings.saleActive && Number(settings.discountPercent) > 0 && (!end || end > Date.now());
  if (!running) { mount(el, ''); return; }
  const timer = () => {
    const left = Math.max(0, end - Date.now());
    if (end && !left) { renderSale(); return ''; }
    const h = Math.floor(left / 3.6e6), m = Math.floor(left / 6e4) % 60, s = Math.floor(left / 1e3) % 60;
    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  };
  mount(el, html`<section class="sale-strip" aria-label="${t('sale')}"><div class="wrap sale-row">
    <p><span class="badge badge-sale">${settings.bannerBadge || t('sale')}</span>
      <b>${settings.bannerText || t('saleOff', { n: settings.discountPercent })}</b></p>
    ${end ? html`<p class="sale-timer">${t('saleEnds')} <strong id="sale-timer">${timer()}</strong></p>` : ''}
    <a class="btn btn-sm btn-ink" href="/shop?sale=1">${t('saleShop')}</a></div></section>`);
  if (end) saleTimer = setInterval(() => { const n = $('#sale-timer'); if (n) n.textContent = timer(); }, 1000);
}

// ---- Products -------------------------------------------------------------------

function renderProducts() {
  const featuredEl = $('#featured-grid');
  if (!products.length) {
    mount(featuredEl, emptyState({ iconName: 'sparkle', title: t('noProducts'), text: t('noProductsText'), action: { href: `https://wa.me/${CONTACT.whatsapp}`, label: t('supportWhatsapp') } }));
    $('#new-section').hidden = true;
    return;
  }
  const live = products.filter(inStock);
  const pool = live.length ? live : products;
  const flagged = pool.filter(p => p.featured);
  const featured = (flagged.length >= 4 ? flagged : [...flagged, ...pool.filter(p => !p.featured)]).slice(0, 8);
  renderGrid(featuredEl, featured, { eagerCount: 2 });
  const newest = [...products].sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))).slice(0, 10);
  $('#new-section').hidden = newest.length < 3;
  mount($('#new-grid'), newest.map(p => productCard(p)));
}

function errorState(retry) {
  mount($('#featured-grid'), html`<div class="empty"><div class="empty-icon">${icon('info', 30)}</div><h3 class="empty-title">${t('errorGeneric')}</h3><button class="btn btn-primary" type="button" id="retry">${t('retry')}</button></div>`);
  $('#retry').addEventListener('click', retry, { once: true });
}

async function loadCatalog(fresh = false) {
  mount($('#featured-grid'), skeletonCards(4));
  mount($('#new-grid'), skeletonCards(4));
  try {
    products = await loadProducts({ fresh });
    renderProducts(); renderCategories();
  } catch {
    errorState(() => loadCatalog(true));
    renderCategories();
  }
}

bindCards($('#featured-grid'), () => products);
bindCards($('#new-grid'), () => products);

// Scroll reveal, restrained.
function reveal() {
  const els = document.querySelectorAll('.section, .trust');
  if (prefersReducedMotion() || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => { if (el.getBoundingClientRect().top > innerHeight) { el.classList.add('reveal'); io.observe(el); } });
}

renderIntro();
renderCategories();
loadBanners();
loadSettings().then(s => { settings = s || {}; renderSale(); });
loadCatalog();
reveal();

onLangChange(() => { renderIntro(); renderHero(); renderCategories(); renderSale(); if (products.length) renderProducts(); });
