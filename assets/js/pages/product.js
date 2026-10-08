// Product detail: gallery (scroll-snap + dots on mobile, thumbnails on
// desktop, fullscreen zoom), variant picker with live stock, qty, sticky buy
// bar, wishlist, share, size guide, accordions, WhatsApp order, related,
// JSON-LD and Meta events.

import { boot, CONTACT } from '/assets/js/core/layout.js';
import { html, mount, $, $$, on, safeUrl, prefersReducedMotion } from '/assets/js/core/dom.js';
import { t, extend, onLangChange, localized } from '/assets/js/core/i18n.js';
import { getProduct, loadProducts, pricing, colorsOf, stockFor, inStock, titleOf, categoryLabel, productUrl } from '/assets/js/core/catalog.js';
import { productCard, bindCards } from '/assets/js/core/cards.js';
import * as bag from '/assets/js/core/cart.js';
import * as wish from '/assets/js/core/wishlist.js';
import { icon, toast, sheet, copyText, emptyState } from '/assets/js/core/ui.js';
import { money, number } from '/assets/js/core/format.js';
import { track } from '/assets/js/core/analytics.js';

extend({
  en: {
    pdpSave: 'Save to wishlist', pdpSaved: 'Saved', pdpShare: 'Share', pdpCopied: 'Link copied',
    pdpSizeGuide: 'Size guide', pdpMeasure: 'Measurements', pdpNoGuide: 'Message us your bust and length and we will suggest a size.',
    pdpDescription: 'Description', pdpDetails: 'The details', pdpMaterials: 'Materials', pdpCare: 'Care',
    pdpDelivery: 'Delivery & exchange', pdpDeliveryIn: 'Inside Sylhet City — ৳70, 1–3 business days',
    pdpDeliveryOut: 'Rest of Bangladesh — ৳140, 3–5 business days', pdpCod: 'Cash on delivery — pay when it arrives',
    pdpExchange: 'Exchange within 24 hours of delivery (unworn, tags on)', pdpPolicy: 'Full delivery & returns policy',
    pdpWhatsapp: 'Order on WhatsApp', pdpInStock: 'In stock', pdpOut: 'Out of stock', pdpOutSel: 'This combination is sold out',
    pdpSavePct: 'Save {n}%', pdpZoom: 'Tap to zoom', pdpImage: 'Image {n} of {m}', pdpNotFound: 'We could not find that piece',
    pdpNotFoundText: 'It may have sold out or moved. Browse the collection instead.', pdpMaxQty: 'Only {n} available',
    pdpWaMsg: 'Hi Mohor! I would like to order:', relEyebrow: 'Recommended', relHeading: 'Curated for you',
    pdpPrev: 'Previous image', pdpNext: 'Next image', pdpZoomIn: 'Zoom in', pdpZoomOut: 'Zoom out',
  },
  bn: {
    pdpSave: 'উইশলিস্টে রাখুন', pdpSaved: 'সংরক্ষিত', pdpShare: 'শেয়ার', pdpCopied: 'লিংক কপি হয়েছে',
    pdpSizeGuide: 'সাইজ গাইড', pdpMeasure: 'মাপ', pdpNoGuide: 'আপনার বুক ও লম্বার মাপ পাঠান, আমরা সাইজ বলে দেব।',
    pdpDescription: 'বিবরণ', pdpDetails: 'বিস্তারিত', pdpMaterials: 'কাপড়', pdpCare: 'যত্ন',
    pdpDelivery: 'ডেলিভারি ও এক্সচেঞ্জ', pdpDeliveryIn: 'সিলেট সিটির ভেতরে — ৳৭০, ১–৩ কার্যদিবস',
    pdpDeliveryOut: 'বাংলাদেশের অন্য জায়গায় — ৳১৪০, ৩–৫ কার্যদিবস', pdpCod: 'ক্যাশ অন ডেলিভারি — হাতে পেয়ে টাকা দিন',
    pdpExchange: 'ডেলিভারির ২৪ ঘণ্টার মধ্যে এক্সচেঞ্জ (অব্যবহৃত, ট্যাগসহ)', pdpPolicy: 'পুরো ডেলিভারি ও রিটার্ন নীতি',
    pdpWhatsapp: 'হোয়াটসঅ্যাপে অর্ডার', pdpInStock: 'স্টকে আছে', pdpOut: 'স্টক শেষ', pdpOutSel: 'এই রং/সাইজ স্টকে নেই',
    pdpSavePct: '{n}% সাশ্রয়', pdpZoom: 'বড় করে দেখুন', pdpImage: '{m}টির মধ্যে {n} নং ছবি', pdpNotFound: 'পণ্যটি খুঁজে পাওয়া যায়নি',
    pdpNotFoundText: 'হয়তো বিক্রি হয়ে গেছে বা সরানো হয়েছে। কালেকশন দেখুন।', pdpMaxQty: 'মাত্র {n}টি আছে',
    pdpWaMsg: 'হ্যালো মোহর! আমি অর্ডার করতে চাই:', relEyebrow: 'আপনার জন্য', relHeading: 'বাছাই করা আরও কিছু',
    pdpPrev: 'আগের ছবি', pdpNext: 'পরের ছবি', pdpZoomIn: 'বড় করুন', pdpZoomOut: 'ছোট করুন',
  },
});

await boot({ page: 'product' });

const root = $('#product-root');
const id = new URLSearchParams(location.search).get('id') || '';
const PLACEHOLDER = '/assets/image-placeholder.svg';

/** @type {any} */ let product = null;
let related = [];
const sel = { color: '', size: '', qty: 1, image: 0 };

// ---- Helpers ---------------------------------------------------------------------

const plain = value => String(value ?? '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
const listOf = value => (Array.isArray(value) ? value : (localized(value) || value?.en || [])).filter(x => typeof x === 'string' && x.trim());
const images = () => (product.images?.length ? product.images : [product.thumbnail || PLACEHOLDER]).map(src => safeUrl(src, PLACEHOLDER));
const sizes = () => (product.sizes?.length ? product.sizes : ['Standard']);
const hasSizeChoice = () => !(sizes().length === 1 && sizes()[0] === 'Standard');
const available = () => (sel.size ? stockFor(product, sel.size, sel.color) : 0);
const colorLabel = () => colorsOf(product).find(c => c.key === sel.color)?.label || '';
const measurementFor = size => { const m = product.sizeMeasurements?.[size]; return m ? plain(localized(m)) : ''; };

function pickDefaults() {
  const colors = colorsOf(product);
  sel.color = colors.length === 1 ? colors[0].key : '';
  const stocked = sizes().filter(s => stockFor(product, s, sel.color) > 0);
  sel.size = sizes().length === 1 && stocked.length ? sizes()[0] : '';
  sel.qty = 1; sel.image = 0;
}

// ---- Rendering -----------------------------------------------------------------------

function galleryMarkup() {
  const list = images();
  const title = titleOf(product);
  return html`
    <div class="pdp-gallery">
      <div class="pdp-track" id="pdp-track" tabindex="0" aria-roledescription="carousel" aria-label="${title}">
        ${list.map((src, i) => html`<button type="button" class="pdp-slide" data-zoom="${i}" aria-label="${t('pdpZoom')} — ${t('pdpImage', { n: i + 1, m: list.length })}">
          <img src="${src}" alt="${title} — ${t('pdpImage', { n: i + 1, m: list.length })}" width="800" height="1000" loading="${i ? 'lazy' : 'eager'}" fetchpriority="${i ? 'auto' : 'high'}" decoding="async"></button>`)}
      </div>
      ${list.length > 1 ? html`
        <div class="pdp-dots" aria-hidden="true">${list.map((_, i) => html`<i class="${i === sel.image ? 'is-on' : ''}"></i>`)}</div>
        <div class="pdp-thumbs" role="group">${list.map((src, i) => html`<button type="button" class="pdp-thumb${i === sel.image ? ' is-on' : ''}" data-thumb="${i}" aria-label="${t('pdpImage', { n: i + 1, m: list.length })}" aria-current="${i === sel.image}"><img src="${src}" alt="" width="80" height="100" loading="lazy" decoding="async"></button>`)}</div>
        <button class="icon-btn pdp-arrow is-prev" type="button" data-step="-1" aria-label="${t('pdpPrev')}">${icon('chevronLeft')}</button>
        <button class="icon-btn pdp-arrow is-next" type="button" data-step="1" aria-label="${t('pdpNext')}">${icon('chevronRight')}</button>` : ''}
      ${(() => { const { percent } = pricing(product); return !inStock(product) ? html`<span class="badge badge-ink pdp-badge">${t('soldOut')}</span>` : percent ? html`<span class="badge badge-sale pdp-badge">−${percent}%</span>` : ''; })()}
    </div>`;
}

function optionsMarkup() {
  const colors = colorsOf(product);
  const n = available();
  const anyStock = inStock(product);
  return html`
    ${colors.length ? html`<fieldset class="opt"><legend>${t('color')}: <b>${colorLabel() || t('chooseColor')}</b></legend>
      <div class="swatches">${colors.map(c => {
        const has = sizes().some(s => stockFor(product, s, c.key) > 0);
        return html`<button type="button" class="swatch${c.key === sel.color ? ' is-on' : ''}${has ? '' : ' is-out'}" data-color="${c.key}" data-sw="${c.hex}" aria-pressed="${c.key === sel.color}" aria-label="${c.label}${has ? '' : ` — ${t('soldOut')}`}" title="${c.label}"></button>`;
      })}</div></fieldset>` : ''}
    ${hasSizeChoice() ? html`<fieldset class="opt"><legend class="opt-legend"><span>${t('size')}${sel.size ? html`: <b>${sel.size}</b>` : ''}</span>
        <button type="button" class="link pdp-guide-btn" data-guide>${icon('ruler', 18)} ${t('pdpSizeGuide')}</button></legend>
      <div class="sizes">${sizes().map(size => {
        const k = stockFor(product, size, sel.color);
        return html`<button type="button" class="size${size === sel.size ? ' is-on' : ''}" data-size="${size}" ${k ? '' : 'disabled'} aria-pressed="${size === sel.size}" aria-label="${size}${k ? '' : ` — ${t('soldOut')}`}">${size}${k && k <= 3 ? html`<small>${t('onlyLeft', { n: k })}</small>` : ''}</button>`;
      })}</div>
      ${sel.size && measurementFor(sel.size) ? html`<p class="pdp-measure">${icon('ruler', 16)} ${measurementFor(sel.size)}</p>` : ''}
    </fieldset>` : ''}
    <p class="pdp-stock ${anyStock && (!sel.size || n) ? 'is-ok' : 'is-out'}" role="status">
      ${!anyStock ? t('pdpOut') : sel.size && !n ? t('pdpOutSel') : sel.size && n <= 3 ? t('onlyLeft', { n }) : t('pdpInStock')}</p>
    <div class="pdp-qty-row">
      <span class="muted">${t('qty')}</span>
      <div class="stepper"><button type="button" data-qty="-1" aria-label="−" ${sel.qty <= 1 ? 'disabled' : ''}>${icon('minus', 18)}</button>
        <output aria-live="polite">${number(sel.qty)}</output>
        <button type="button" data-qty="1" aria-label="+" ${sel.size && sel.qty >= n ? 'disabled' : ''}>${icon('plus', 18)}</button></div>
    </div>`;
}

function ctaMarkup(compact = false) {
  const ok = inStock(product);
  const needs = (colorsOf(product).length && !sel.color) ? t('chooseColor') : (!sel.size ? t('chooseSize') : '');
  return html`
    <button class="btn btn-ghost${compact ? '' : ' btn-lg'}" type="button" data-add ${ok ? '' : 'disabled'}>${icon('bag', 20)}<span>${ok ? t('addToBag') : t('soldOut')}</span></button>
    <button class="btn btn-primary${compact ? '' : ' btn-lg'}" type="button" data-buy ${ok ? '' : 'disabled'} title="${needs}">${t('buyNow')}</button>`;
}

function infoMarkup() {
  const { price, original, percent, savings } = pricing(product);
  const desc = plain(localized(product.description));
  const sections = [['pdpDetails', listOf(product.details)], ['pdpMaterials', listOf(product.materials)], ['pdpCare', listOf(product.care)]];
  const saved = wish.has(product.id);
  return html`
    <div class="pdp-info">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="/">${t('navHome')}</a><span aria-hidden="true">/</span>
        <a href="/shop?cat=${encodeURIComponent(product.category || '')}">${categoryLabel(product.category)}</a></nav>
      <h1 class="display pdp-title">${titleOf(product)}</h1>
      <p class="price pdp-price"><span class="price-now">${money(price)}</span>
        ${original ? html` <s class="price-was">${money(original)}</s> <span class="badge badge-sale">${t('pdpSavePct', { n: percent })}</span>` : ''}</p>
      ${savings ? html`<p class="muted pdp-savings">${t('cartSaved')} ${money(savings)}</p>` : ''}
      <div class="pdp-actions-mini">
        <button class="chip${saved ? ' is-on' : ''}" type="button" data-wish-toggle aria-pressed="${saved}">${icon('heart', 18)} ${saved ? t('pdpSaved') : t('pdpSave')}</button>
        <button class="chip" type="button" data-share>${icon('share', 18)} ${t('pdpShare')}</button>
      </div>
      <div id="pdp-options">${optionsMarkup()}</div>
      <div class="pdp-cta" id="pdp-cta">${ctaMarkup()}</div>
      <a class="btn btn-wa btn-block" id="pdp-wa" href="${waLink()}" target="_blank" rel="noopener" data-contact>${icon('whatsapp', 20)}<span>${t('pdpWhatsapp')}</span></a>
      <div class="faq pdp-acc">
        ${desc ? html`<details open><summary>${t('pdpDescription')} ${icon('chevronDown', 18)}</summary>${desc.split(/\n{2,}|\n/).map(p => html`<p>${p}</p>`)}</details>` : ''}
        ${sections.filter(([, items]) => items.length).map(([key, items]) => html`<details><summary>${t(key)} ${icon('chevronDown', 18)}</summary><ul class="pdp-list">${items.map(i => html`<li>${i}</li>`)}</ul></details>`)}
        <details><summary>${t('pdpDelivery')} ${icon('chevronDown', 18)}</summary>
          <ul class="pdp-list pdp-delivery">
            <li>${icon('truck', 18)} ${t('pdpDeliveryIn')}</li><li>${icon('location', 18)} ${t('pdpDeliveryOut')}</li>
            <li>${icon('shield', 18)} ${t('pdpCod')}</li><li>${icon('refresh', 18)} ${t('pdpExchange')}</li>
          </ul><p><a class="link" href="/policy">${t('pdpPolicy')}</a></p></details>
      </div>
    </div>`;
}

function buybarMarkup() {
  const { price } = pricing(product);
  return html`<div class="buybar-row"><div class="buybar-price"><b>${money(price * sel.qty)}</b><small>${[colorLabel(), sel.size && hasSizeChoice() ? sel.size : ''].filter(Boolean).join(' · ') || titleOf(product)}</small></div>
    <div class="buybar-cta">${ctaMarkup(true)}</div></div>`;
}

function paint(rootEl) {
  rootEl.querySelectorAll('[data-sw]').forEach(el => el.style.setProperty('--sw', /^#[0-9a-f]{3,8}$/i.test(el.dataset.sw) ? el.dataset.sw : '#ccc'));
}

function render() {
  mount(root, html`<div class="pdp">${galleryMarkup()}${infoMarkup()}</div>`);
  root.removeAttribute('aria-busy');
  paint(root);
  bindGallery();
  const bar = $('#buybar');
  bar.hidden = false; mount(bar, buybarMarkup());
  if (sel.image) scrollToImage(sel.image, false);
}

/** Re-renders only the parts affected by a selection change (keeps gallery scroll). */
function refresh() {
  mount($('#pdp-options'), optionsMarkup()); paint($('#pdp-options'));
  mount($('#pdp-cta'), ctaMarkup());
  mount($('#buybar'), buybarMarkup());
  $('#pdp-wa').href = waLink();
}

function waLink() {
  const { price } = pricing(product);
  const lines = [t('pdpWaMsg'), `• ${titleOf(product)}`, colorLabel() && `${t('color')}: ${colorLabel()}`,
    sel.size && hasSizeChoice() && `${t('size')}: ${sel.size}`, `${t('qty')}: ${sel.qty}`, `${money(price * sel.qty)}`, location.origin + productUrl(product)].filter(Boolean);
  return `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`;
}

// ---- Gallery ---------------------------------------------------------------------------

function scrollToImage(i, smooth = true) {
  const track = $('#pdp-track');
  if (!track) return;
  const n = images().length;
  sel.image = (i + n) % n;
  track.scrollTo({ left: track.clientWidth * sel.image, behavior: smooth && !prefersReducedMotion() ? 'smooth' : 'auto' });
  syncIndicators();
}

function syncIndicators() {
  $$('.pdp-dots i', root).forEach((d, k) => d.classList.toggle('is-on', k === sel.image));
  $$('.pdp-thumb', root).forEach((b, k) => { b.classList.toggle('is-on', k === sel.image); b.setAttribute('aria-current', String(k === sel.image)); });
}

function bindGallery() {
  const track = $('#pdp-track');
  let raf = 0;
  track.addEventListener('scroll', () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => { const i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth)); if (i !== sel.image) { sel.image = i; syncIndicators(); } });
  }, { passive: true });
  track.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); scrollToImage(sel.image + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); scrollToImage(sel.image - 1); }
  });
  $$('img', root).forEach(img => img.addEventListener('error', () => { if (!img.src.endsWith(PLACEHOLDER)) img.src = PLACEHOLDER; }, { once: true }));
}

function openZoom(start) {
  const list = images();
  let i = start; let scale = 1;
  const z = sheet({ id: 'zoom-sheet', side: 'bottom', className: 'zoom-sheet', label: titleOf(product), body: '' });
  const draw = () => {
    z.setBody(html`<div class="zoom-stage${scale > 1 ? ' is-zoomed' : ''}" id="zoom-stage">
        <img src="${list[i]}" alt="${titleOf(product)} — ${t('pdpImage', { n: i + 1, m: list.length })}" id="zoom-img"></div>
      <div class="zoom-bar">
        <button class="icon-btn" type="button" data-close aria-label="${t('close')}">${icon('close')}</button>
        ${list.length > 1 ? html`<button class="icon-btn" type="button" data-zstep="-1" aria-label="${t('pdpPrev')}">${icon('chevronLeft')}</button>
          <span class="zoom-count">${number(i + 1)} / ${number(list.length)}</span>
          <button class="icon-btn" type="button" data-zstep="1" aria-label="${t('pdpNext')}">${icon('chevronRight')}</button>` : ''}
        <button class="icon-btn" type="button" data-zscale="-1" aria-label="${t('pdpZoomOut')}">${icon('minus')}</button>
        <button class="icon-btn" type="button" data-zscale="1" aria-label="${t('pdpZoomIn')}">${icon('plus')}</button>
      </div>`);
    $('#zoom-img', z.el).style.transform = `scale(${scale})`;
  };
  const setScale = (next, e) => {
    scale = Math.max(1, Math.min(3, next));
    const img = $('#zoom-img', z.el);
    if (e && img) { const r = img.getBoundingClientRect(); img.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`; }
    if (img) img.style.transform = `scale(${scale})`;
    $('#zoom-stage', z.el)?.classList.toggle('is-zoomed', scale > 1);
  };
  draw();
  z.el.onclick = e => {
    const step = e.target.closest('[data-zstep]'); const sc = e.target.closest('[data-zscale]');
    if (step) { i = (i + Number(step.dataset.zstep) + list.length) % list.length; scale = 1; draw(); }
    else if (sc) setScale(scale + Number(sc.dataset.zscale) * 0.5);
    else if (e.target.id === 'zoom-img') setScale(scale > 1 ? 1 : 2, e);
  };
  z.el.onwheel = e => { if (e.target.closest('#zoom-stage')) { e.preventDefault(); setScale(scale + (e.deltaY < 0 ? 0.25 : -0.25), e); } };
  z.el.onkeydown = e => { if (list.length > 1 && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { i = (i + (e.key === 'ArrowRight' ? 1 : -1) + list.length) % list.length; scale = 1; draw(); } };
  let x0 = null;
  z.el.ontouchstart = e => { x0 = e.touches.length === 1 && scale === 1 ? e.touches[0].clientX : null; };
  z.el.ontouchend = e => {
    if (x0 === null || list.length < 2) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) { i = (i + (dx < 0 ? 1 : -1) + list.length) % list.length; draw(); }
  };
  z.open();
}

function openGuide() {
  const rows = sizes().filter(s => measurementFor(s));
  const guide = plain(localized(product.measurementsGuide));
  const g = sheet({
    id: 'guide-sheet', side: 'bottom', title: t('pdpSizeGuide'),
    body: html`
      ${guide ? guide.split(/\n+/).map(p => html`<p class="pdp-guide-text">${p}</p>`) : ''}
      ${rows.length ? html`<table class="pdp-guide-table"><thead><tr><th scope="col">${t('size')}</th><th scope="col">${t('pdpMeasure')}</th></tr></thead>
        <tbody>${rows.map(s => html`<tr class="${s === sel.size ? 'is-on' : ''}"><th scope="row">${s}</th><td>${measurementFor(s)}</td></tr>`)}</tbody></table>` : ''}
      ${!guide && !rows.length ? html`<p class="muted">${t('pdpNoGuide')}</p>` : ''}
      <a class="btn btn-wa btn-block" href="https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(`${t('pdpSizeGuide')} — ${titleOf(product)}`)}" target="_blank" rel="noopener" data-contact>${icon('whatsapp', 20)}<span>${t('supportWhatsapp')}</span></a>`,
  });
  g.open();
}

// ---- Actions ------------------------------------------------------------------------------

function validate() {
  if (colorsOf(product).length && !sel.color) { toast(t('chooseColor'), { type: 'error' }); $('#pdp-options .swatches')?.scrollIntoView({ block: 'center', behavior: 'smooth' }); return false; }
  if (!sel.size) { toast(t('chooseSize'), { type: 'error' }); $('#pdp-options .sizes')?.scrollIntoView({ block: 'center', behavior: 'smooth' }); return false; }
  if (!available()) { toast(t('pdpOutSel'), { type: 'error' }); return false; }
  return true;
}

async function addToBag() {
  if (!validate()) return false;
  const result = await bag.add({ id: product.id, size: sel.size, color: sel.color, qty: sel.qty });
  if (!result.ok) {
    toast(result.reason === 'stock' ? t('pdpMaxQty', { n: number(result.available || 0) }) : t('errorGeneric'), { type: 'error' });
    return false;
  }
  track('AddToCart', { value: pricing(product).price * sel.qty, contents: [{ id: product.id, quantity: sel.qty }] });
  return true;
}

function bindPage() {
  on(document, 'click', '[data-color]', (e, b) => {
    if (!root.contains(b) && !b.closest('#buybar')) return;
    sel.color = sel.color === b.dataset.color && colorsOf(product).length > 1 ? '' : b.dataset.color;
    if (sel.size && !stockFor(product, sel.size, sel.color)) sel.size = '';
    sel.qty = Math.max(1, Math.min(sel.qty, available() || 1));
    refresh();
  });
  on(root, 'click', '[data-size]', (e, b) => {
    sel.size = sel.size === b.dataset.size && sizes().length > 1 ? '' : b.dataset.size;
    sel.qty = Math.max(1, Math.min(sel.qty, available() || 1));
    refresh();
  });
  on(root, 'click', '[data-qty]', (e, b) => {
    const next = sel.qty + Number(b.dataset.qty);
    const cap = sel.size ? available() : 10;
    if (next > cap) { toast(t('pdpMaxQty', { n: number(cap) })); return; }
    sel.qty = Math.max(1, Math.min(10, next)); refresh();
  });
  on(root, 'click', '[data-thumb]', (e, b) => scrollToImage(Number(b.dataset.thumb)));
  on(root, 'click', '[data-step]', (e, b) => scrollToImage(sel.image + Number(b.dataset.step)));
  on(root, 'click', '[data-zoom]', (e, b) => openZoom(Number(b.dataset.zoom)));
  on(root, 'click', '[data-guide]', openGuide);
  on(root, 'click', '[data-wish-toggle]', (e, b) => {
    const now = wish.toggle(product.id);
    b.classList.toggle('is-on', now); b.setAttribute('aria-pressed', String(now));
    mount(b, html`${icon('heart', 18)} ${now ? t('pdpSaved') : t('pdpSave')}`);
    toast(now ? t('wishlistAdded') : t('wishlistRemoved'), { type: 'success', action: now ? { label: t('navWishlist'), href: '/wishlist' } : undefined });
    if (now) track('AddToWishlist', { contents: [{ id: product.id, quantity: 1 }] });
  });
  on(root, 'click', '[data-share]', async () => {
    const url = location.origin + productUrl(product);
    if (navigator.share) { try { await navigator.share({ title: titleOf(product), text: `${titleOf(product)} — Mohor`, url }); return; } catch (err) { if (err?.name === 'AbortError') return; } }
    toast((await copyText(url)) ? t('pdpCopied') : url, { type: 'success' });
  });
  const handlers = async (e, b) => {
    if (b.hasAttribute('data-add')) {
      if (await addToBag()) toast(t('added'), { type: 'success', action: { label: t('cartCheckout'), href: '/cart' } });
    } else if (await addToBag()) location.assign('/checkout');
  };
  on(root, 'click', '[data-add],[data-buy]', handlers);
  on($('#buybar'), 'click', '[data-add],[data-buy]', handlers);
  // Hide the sticky bar while the inline CTA is visible.
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(([entry]) => $('#buybar').classList.toggle('is-hidden', entry.isIntersecting));
    const watch = () => { const cta = $('#pdp-cta'); if (cta) io.observe(cta); };
    watch();
    new MutationObserver(() => { io.disconnect(); watch(); }).observe(root, { childList: true });
  }
}

// ---- SEO --------------------------------------------------------------------------------

function seo() {
  const title = titleOf(product);
  const { price } = pricing(product);
  const url = `https://mohor.me${productUrl(product)}`;
  const abs = src => new URL(src, 'https://mohor.me').href;
  const desc = plain(localized(product.description)).slice(0, 160) || `${title} — handcrafted by Mohor Clothings in Sylhet.`;
  document.title = `${title} — Mohor`;
  const setMeta = (attr, key, value) => {
    let m = document.head.querySelector(`meta[${attr}="${key}"]`);
    if (!m) { m = document.createElement('meta'); m.setAttribute(attr, key); document.head.append(m); }
    m.setAttribute('content', value);
  };
  setMeta('name', 'description', desc);
  setMeta('property', 'og:title', `${title} — Mohor`);
  setMeta('property', 'og:description', desc);
  setMeta('property', 'og:url', url);
  setMeta('property', 'og:image', abs(images()[0]));
  setMeta('property', 'product:price:amount', String(price));
  setMeta('property', 'product:price:currency', 'BDT');
  document.head.querySelector('link[rel="canonical"]')?.setAttribute('href', url);
  const data = {
    '@context': 'https://schema.org/', '@type': 'Product', name: title, sku: product.id,
    image: images().filter(s => !s.endsWith(PLACEHOLDER)).map(abs), description: desc, category: categoryLabel(product.category),
    brand: { '@type': 'Brand', name: 'Mohor Clothings', alternateName: ['Mohor', 'Mohor Cloth', 'Mohor Dress'] },
    offers: {
      '@type': 'Offer', url, priceCurrency: 'BDT', price, itemCondition: 'https://schema.org/NewCondition',
      availability: inStock(product) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'Mohor Clothings' },
    },
  };
  let tag = document.getElementById('product-ld');
  if (!tag) { tag = document.createElement('script'); tag.type = 'application/ld+json'; tag.id = 'product-ld'; document.head.append(tag); }
  tag.textContent = JSON.stringify(data).replace(/</g, '\\u003c');
}

// ---- Related ------------------------------------------------------------------------------

async function loadRelated() {
  const all = await loadProducts().catch(() => []);
  const others = all.filter(p => p.id !== product.id && inStock(p));
  const { price } = pricing(product);
  const score = p => (p.category === product.category ? 0 : 1e6) + Math.abs(pricing(p).price - price);
  related = others.sort((a, b) => score(a) - score(b)).slice(0, 8);
  const section = $('#related');
  section.hidden = !related.length;
  mount($('#related-grid'), related.map(p => productCard(p)));
}
bindCards($('#related-grid'), () => related);
on($('#related'), 'click', '[data-rail]', (e, b) => { const g = $('#related-grid'); g.scrollBy({ left: g.clientWidth * 0.8 * Number(b.dataset.rail), behavior: prefersReducedMotion() ? 'auto' : 'smooth' }); });

// ---- Boot -----------------------------------------------------------------------------------

function notFound() {
  root.removeAttribute('aria-busy');
  document.title = `${t('pdpNotFound')} — Mohor`;
  mount(root, html`<div class="section">${emptyState({ iconName: 'search', title: t('pdpNotFound'), text: t('pdpNotFoundText'), action: { href: '/shop', label: t('navShop') } })}</div>`);
}

function failed() {
  root.removeAttribute('aria-busy');
  mount(root, html`<div class="section empty"><div class="empty-icon">${icon('info', 30)}</div><h2 class="empty-title">${t('errorGeneric')}</h2><button class="btn btn-primary" type="button" data-retry>${t('retry')}</button></div>`);
  $('[data-retry]', root).addEventListener('click', start, { once: true });
}

async function start() {
  if (!id) { notFound(); return; }
  try {
    product = await getProduct(id);
  } catch (error) {
    if (error?.status === 404) notFound(); else failed();
    return;
  }
  if (!product) { notFound(); return; }
  pickDefaults();
  render();
  seo();
  track('ViewContent', { value: pricing(product).price, contents: [{ id: product.id, quantity: 1 }] });
  loadRelated();
}

bindPage();
await start();

onLangChange(() => {
  if (!product) return;
  render(); seo();
  ['zoom-sheet', 'guide-sheet'].forEach(x => document.getElementById(x)?.remove());
  if (related.length) mount($('#related-grid'), related.map(p => productCard(p)));
});
