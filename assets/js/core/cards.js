// Product card + quick-add sheet, shared by home, shop, wishlist and related.

import { html, safeUrl, responsiveImageUrl, responsiveImageSrcset, on, mount } from './dom.js';
import { t } from './i18n.js';
import { money } from './format.js';
import { pricing, inStock, titleOf, imageOf, productUrl, colorsOf, stockFor, categoryLabel, totalStock } from './catalog.js';
import * as wish from './wishlist.js';
import * as bag from './cart.js';
import { icon, sheet, toast } from './ui.js';
import { track } from './analytics.js';

/** @param {any} p @param {{ eager?: boolean }} [opts] */
export function productCard(p, { eager = false } = {}) {
  const { price, original, percent } = pricing(p);
  const available = inStock(p);
  const stock = totalStock(p);
  const saved = wish.has(p.id);
  const images = (Array.isArray(p.images) ? p.images : []).filter(Boolean);
  const slides = images.length ? images : [imageOf(p)];
  const colors = colorsOf(p).slice(0, 5);
  const imageSizes = '(max-width: 639px) 46vw, (max-width: 1099px) 31vw, 300px';
  return html`
    <article class="card${available ? '' : ' is-soldout'}" data-id="${p.id}">
      <div class="card-media" data-card-slider>
        <a class="card-media-link" href="${productUrl(p)}" aria-label="${titleOf(p)}">
          <div class="card-slides">
            ${slides.map((src, i) => html`<img class="card-slide${i === 0 ? ' is-active' : ''}" data-slide="${i}" ${i === 0 ? `src="${responsiveImageUrl(src, 480)}" srcset="${responsiveImageSrcset(src)}"` : `data-src="${responsiveImageUrl(src, 480)}" data-srcset="${responsiveImageSrcset(src)}"`} sizes="${imageSizes}" alt="" loading="${i === 0 && eager ? 'eager' : 'lazy'}" decoding="async" width="480" height="640">`)}
          </div>
        </a>
        ${slides.length > 1 ? html`<div class="card-slider-dots" aria-label="${titleOf(p)} images">
          ${slides.map((_, i) => html`<button type="button" class="card-slider-dot${i === 0 ? ' is-active' : ''}" data-slider-dot="${i}" aria-label="${t('pdpImage', { n: i + 1, m: slides.length })}" aria-current="${i === 0}"></button>`)}
        </div>` : ''}
        <span class="card-badges">
          ${!available ? html`<span class="badge badge-ink">${t('soldOut')}</span>`
            : percent ? html`<span class="badge badge-sale">−${percent}%</span>` : ''}
          ${available && stock > 0 && stock <= 3 ? html`<span class="badge badge-soft">${t('onlyLeft', { n: stock })}</span>` : ''}
        </span>
      </div>
      <button class="card-wish${saved ? ' is-on' : ''}" type="button" data-wish="${p.id}" aria-pressed="${saved}" aria-label="${t('navWishlist')}">${icon('heart', 20)}</button>
      <div class="card-info">
        <p class="card-cat">${categoryLabel(p.category)}</p>
        <h3 class="card-title"><a href="${productUrl(p)}">${titleOf(p)}</a></h3>
        <div class="card-row">
          <p class="price"><span class="price-now">${money(price)}</span>${original ? html` <s class="price-was">${money(original)}</s>` : ''}</p>
          ${colors.length > 1 ? html`<span class="card-swatches" aria-hidden="true">${colors.map(c => html`<i style="--sw:${/^#[0-9a-f]{3,8}$/i.test(c.hex) ? c.hex : '#ccc'}"></i>`)}</span>` : ''}
        </div>
      </div>
      ${available ? html`<button class="card-add" type="button" data-quick="${p.id}" aria-label="${t('addToBag')}">${icon('plus', 18)}</button>` : ''}
    </article>`;
}

/** Wires wishlist + quick-add buttons inside a grid. `getProducts` returns the current list. */
export function bindCards(root, getProducts) {
  const sliders = new WeakMap();
  const setupSlider = (card, cardIndex = 0) => {
    if (sliders.has(card)) return;
    const track = card.querySelector('.card-slides');
    const slides = [...card.querySelectorAll('[data-slide]')];
    const dots = [...card.querySelectorAll('[data-slider-dot]')];
    if (!track || slides.length < 2) return;
    let index = 0;
    let startX = null;
    let startTimer = 0;
    let slideTimer = 0;
    let visible = true;
    const loadSlide = slide => {
      if (!slide) return;
      if (!slide.src && slide.dataset.src) slide.src = slide.dataset.src;
      if (!slide.srcset && slide.dataset.srcset) slide.srcset = slide.dataset.srcset;
      slide.removeAttribute('data-src');
      slide.removeAttribute('data-srcset');
    };
    const show = next => {
      index = (next + slides.length) % slides.length;
      loadSlide(slides[index]);
      slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index));
      dots.forEach((dot, i) => {
        dot.classList.toggle('is-active', i === index);
        dot.setAttribute('aria-current', String(i === index));
      });
    };
    const stop = () => {
      window.clearTimeout(startTimer);
      window.clearInterval(slideTimer);
      startTimer = 0;
      slideTimer = 0;
    };
    const start = () => {
      stop();
      if (!visible || document.hidden) return;
      // Stagger cards so a product grid does not animate as one large block.
      const delay = 5000 + ((cardIndex % 4) * 1500);
      startTimer = window.setTimeout(() => {
        if (!visible || document.hidden) return;
        show(index + 1);
        slideTimer = window.setInterval(() => show(index + 1), 5000);
      }, delay);
    };
    track.addEventListener('touchstart', e => { startX = e.touches.length === 1 ? e.touches[0].clientX : null; }, { passive: true });
    track.addEventListener('touchend', e => {
      if (startX === null) return;
      const delta = e.changedTouches[0].clientX - startX;
      startX = null;
      if (Math.abs(delta) > 40) {
        show(index + (delta < 0 ? 1 : -1));
        start();
      }
    }, { passive: true });
    dots.forEach(dot => dot.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      show(Number(dot.dataset.sliderDot));
      start();
    }));
    sliders.set(card, {
      stop,
      start,
      setVisible(value) {
        visible = value;
        if (visible) start();
        else stop();
      },
    });
    loadSlide(slides[0]);
    start();
  };
  const visibility = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const slider = sliders.get(entry.target);
      if (!slider) return;
      slider.setVisible(entry.isIntersecting);
    });
  }, { threshold: 0.15 }) : null;
  const observe = new MutationObserver(() => root.querySelectorAll('[data-card-slider]').forEach((card, i) => {
    setupSlider(card, i);
    visibility?.observe(card);
  }));
  observe.observe(root, { childList: true, subtree: true });
  root.querySelectorAll('[data-card-slider]').forEach((card, i) => {
    setupSlider(card, i);
    visibility?.observe(card);
  });
  document.addEventListener('visibilitychange', () => {
    root.querySelectorAll('[data-card-slider]').forEach(card => {
      const slider = sliders.get(card);
      if (document.hidden) slider?.stop();
      else slider?.start();
    });
  });
  on(root, 'click', '[data-wish]', (e, btn) => {
    e.preventDefault();
    const on = wish.toggle(btn.dataset.wish);
    btn.classList.toggle('is-on', on);
    btn.setAttribute('aria-pressed', String(on));
    toast(on ? t('wishlistAdded') : t('wishlistRemoved'), { type: 'success', action: on ? { label: t('navWishlist'), href: '/wishlist' } : undefined });
    if (on) track('AddToWishlist', { contents: [{ id: btn.dataset.wish, quantity: 1 }] });
  });
  on(root, 'click', '[data-quick]', (e, btn) => {
    e.preventDefault();
    const product = getProducts().find(p => p.id === btn.dataset.quick);
    if (product) openQuickAdd(product);
  });
}

/** Size/colour picker in a bottom sheet. */
export function openQuickAdd(p) {
  const colors = colorsOf(p);
  const sizes = p.sizes?.length ? p.sizes : ['Standard'];
  const state = { color: colors.length === 1 ? colors[0].key : (colors.find(c => sizes.some(s => stockFor(p, s, c.key) > 0))?.key || ''), size: '' };
  if (sizes.length === 1) state.size = sizes[0];
  const { price, original } = pricing(p);

  const s = sheet({ id: 'quick-add', side: 'bottom', title: t('addToBag') });
  const render = () => {
    s.setBody(html`
      <div class="qa-head">
        <img src="${safeUrl(imageOf(p))}" alt="" width="72" height="96">
        <div><p class="qa-title">${titleOf(p)}</p>
          <p class="price"><span class="price-now">${money(price)}</span>${original ? html` <s class="price-was">${money(original)}</s>` : ''}</p>
          <a class="link" href="${productUrl(p)}">${t('viewDetails')}</a></div>
      </div>
      ${colors.length ? html`<fieldset class="opt"><legend>${t('color')}: <b>${colors.find(c => c.key === state.color)?.label || '—'}</b></legend>
        <div class="swatches">${colors.map(c => html`<button type="button" class="swatch${c.key === state.color ? ' is-on' : ''}" data-color="${c.key}" style="--sw:${c.hex}" aria-label="${c.label}" aria-pressed="${c.key === state.color}"></button>`)}</div></fieldset>` : ''}
      <fieldset class="opt"><legend>${t('size')}</legend>
        <div class="sizes">${sizes.map(size => {
          const n = stockFor(p, size, state.color);
          return html`<button type="button" class="size${size === state.size ? ' is-on' : ''}" data-size="${size}" ${n ? '' : 'disabled'} aria-pressed="${size === state.size}">${size}${n && n <= 3 ? html`<small>${t('onlyLeft', { n })}</small>` : ''}</button>`;
        })}</div></fieldset>`);
    s.setFooter(html`<button class="btn btn-primary btn-block" type="button" data-qa-add ${state.size ? '' : 'disabled'}>${state.size ? t('addToBag') : t('chooseSize')}</button>`);
  };
  render();
  s.el.onclick = async e => {
    const color = e.target.closest('[data-color]');
    const size = e.target.closest('[data-size]');
    if (color) { state.color = color.dataset.color; if (state.size && !stockFor(p, state.size, state.color)) state.size = ''; render(); }
    if (size) { state.size = size.dataset.size; render(); }
    if (e.target.closest('[data-qa-add]')) {
      const result = await bag.add({ id: p.id, size: state.size, color: state.color, qty: 1 });
      if (!result.ok) { toast(result.reason === 'stock' ? t('onlyLeft', { n: result.available || 0 }) : t('errorGeneric'), { type: 'error' }); return; }
      s.close();
      track('AddToCart', { value: price, contents: [{ id: p.id, quantity: 1 }] });
      toast(t('added'), { type: 'success', action: { label: t('cartCheckout'), href: '/cart' } });
    }
  };
  s.open();
}

export function renderGrid(el, products, opts = {}) {
  mount(el, products.map((p, i) => productCard(p, { eager: i < (opts.eagerCount ?? 2) })));
}
