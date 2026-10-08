// Cart page: live-priced lines, stepper, undoable remove, move to wishlist,
// stock warnings, savings, delivery estimate and a sticky mobile checkout bar.
import { boot } from '/assets/js/core/layout.js';
import { html, mount, on, safeUrl, $ } from '/assets/js/core/dom.js';
import { t, extend, onLangChange } from '/assets/js/core/i18n.js';
import { money, number } from '/assets/js/core/format.js';
import { icon, toast, emptyState } from '/assets/js/core/ui.js';
import * as bag from '/assets/js/core/cart.js';
import { wishlist } from '/assets/js/core/wishlist.js';
import { titleOf, imageOf, productUrl, colorsOf } from '/assets/js/core/catalog.js';
import { track } from '/assets/js/core/analytics.js';

extend({
  en: {
    cpItems: '{n} pieces', cpSummary: 'Order summary', cpDelivery: 'Delivery', cpDeliveryEst: '৳70 inside Sylhet City · ৳140 outside',
    cpDeliveryTime: 'Arrives in 1–3 business days in Sylhet City, 3–5 business days elsewhere.', cpEstTotal: 'Estimated total',
    cpSaveLater: 'Move to wishlist', cpMoved: 'Moved to your wishlist', cpUndo: 'Undo',
    cpMissing: '{n} piece(s) in your bag are no longer available and were set aside.', cpClearMissing: 'Remove them',
    cpOut: 'Sold out in this size — please remove it', cpOver: 'Only {n} left — quantity reduced', cpCapped: 'That is all we have in stock',
    cpCod: 'Cash on delivery · We call to confirm every order', cpExchange: 'Exchange within 24 hours of delivery',
    cpSaveOrder: 'You save {amount} on this order', cpFixFirst: 'Please fix the highlighted items first', cpEach: '{price} each',
    cpLoadError: 'We could not load your bag.',
  },
  bn: {
    cpItems: '{n}টি পণ্য', cpSummary: 'অর্ডার সারাংশ', cpDelivery: 'ডেলিভারি', cpDeliveryEst: 'সিলেট সিটির ভেতরে ৳৭০ · বাইরে ৳১৪০',
    cpDeliveryTime: 'সিলেট সিটিতে ১–৩ কার্যদিবসে, অন্যত্র ৩–৫ কার্যদিবসে পৌঁছাবে।', cpEstTotal: 'আনুমানিক মোট',
    cpSaveLater: 'উইশলিস্টে সরান', cpMoved: 'উইশলিস্টে সরানো হয়েছে', cpUndo: 'ফিরিয়ে আনুন',
    cpMissing: 'আপনার ব্যাগের {n}টি পণ্য আর পাওয়া যাচ্ছে না, তাই আলাদা রাখা হয়েছে।', cpClearMissing: 'সেগুলো সরান',
    cpOut: 'এই সাইজে স্টক শেষ — অনুগ্রহ করে সরিয়ে দিন', cpOver: 'মাত্র {n}টি বাকি — পরিমাণ কমানো হয়েছে', cpCapped: 'স্টকে এর বেশি নেই',
    cpCod: 'ক্যাশ অন ডেলিভারি · প্রতিটি অর্ডার কল করে কনফার্ম করা হয়', cpExchange: 'ডেলিভারির ২৪ ঘণ্টার মধ্যে এক্সচেঞ্জ',
    cpSaveOrder: 'এই অর্ডারে আপনি {amount} বাঁচাচ্ছেন', cpFixFirst: 'আগে চিহ্নিত পণ্যগুলো ঠিক করুন', cpEach: 'প্রতিটি {price}',
    cpLoadError: 'আপনার ব্যাগ লোড করা যায়নি।',
  },
});

await boot({ page: 'cart' });
const root = $('#cart-root');
const bar = $('#cart-bar');
/** @type {Awaited<ReturnType<typeof bag.hydrate>> | null} */
let state = null;

const keyOf = l => JSON.stringify({ id: l.id, size: l.size, color: l.color });
const colorLabel = l => colorsOf(l.product).find(c => c.key === l.color)?.label || l.color;

async function render() {
  try { state = await bag.hydrate(); } catch {
    mount(root, html`<div class="empty"><p class="empty-text">${t('cpLoadError')}</p><button class="btn" type="button" data-retry>${t('retry')}</button></div>`);
    bar.hidden = true; return;
  }
  // Auto-cap quantities that exceed stock (but keep sold-out lines visible).
  for (const l of state.lines) {
    if (l.available > 0 && l.qty > l.available) { l.capped = true; toast(t("cpOver", { n: number(l.available) }), { type: "error" }); bag.setQty(l, l.available); }
  }
  const { lines, subtotal, savings, missing } = state;
  if (!lines.length && !missing.length) {
    mount(root, emptyState({ title: t('cartEmpty'), text: t('cartEmptyHint'), action: { href: '/shop', label: t('cartContinue') } }));
    bar.hidden = true; return;
  }
  const blocked = lines.some(l => l.available < 1) || !lines.length;
  const items = lines.reduce((s, l) => s + Math.min(l.qty, l.available || l.qty), 0);
  mount(root, html`
    <section class="cart-lines" aria-label="${t('cartTitle')}">
      <p class="muted cart-count">${t('cpItems', { n: number(items) })}</p>
      ${missing.length ? html`<div class="cart-alert" role="alert">${icon('info', 18)}<span>${t('cpMissing', { n: number(missing.length) })}</span>
        <button class="linklike" type="button" data-clear-missing>${t('cpClearMissing')}</button></div>` : ''}
      <ul class="bag-list cart-list">${lines.map(l => html`
        <li class="bag-line cart-line ${l.available < 1 ? 'is-out' : ''}" data-line="${keyOf(l)}">
          <a href="${productUrl(l.product)}"><img src="${safeUrl(imageOf(l.product), '/assets/image-placeholder.svg')}" alt="" width="76" height="100" loading="lazy"></a>
          <div>
            <a class="bag-title" href="${productUrl(l.product)}">${titleOf(l.product)}</a>
            <p class="bag-meta">${l.size !== 'Standard' ? html`${t('size')}: ${l.size}` : ''}${l.color ? html` · ${t('color')}: ${colorLabel(l)}` : ''}</p>
            <p class="price"><span class="price-now">${money(l.lineTotal)}</span>${l.original ? html`<s class="price-was">${money(l.original * l.qty)}</s>` : ''}</p>
            ${l.qty > 1 ? html`<p class="muted cart-each">${t('cpEach', { price: money(l.price) })}</p>` : ''}
            <div class="bag-row cart-actions">
              <div class="stepper" role="group" aria-label="${t('qty')}">
                <button type="button" data-step="-1" aria-label="−">${icon(l.qty <= 1 ? 'trash' : 'minus', 18)}</button>
                <output aria-live="polite">${number(l.qty)}</output>
                <button type="button" data-step="1" aria-label="+" ${l.qty >= l.available ? 'disabled' : ''}>${icon('plus', 18)}</button>
              </div>
              <button class="linklike cart-wish" type="button" data-wish>${icon('heart', 16)} ${t('cpSaveLater')}</button>
            </div>
            ${l.available < 1 ? html`<p class="warn">${t('cpOut')}</p>` : l.capped ? html`<p class="warn">${t('cpOver', { n: number(l.available) })}</p>` : l.available <= 3 ? html`<p class="warn">${t('onlyLeft', { n: number(l.available) })}</p>` : ''}
          </div>
          <button class="icon-btn bag-remove" type="button" data-remove aria-label="${t('cartRemove')}">${icon('close', 18)}</button>
        </li>`)}</ul>
      <a class="link cart-continue" href="/shop">← ${t('cartContinue')}</a>
    </section>
    <aside class="panel cart-summary" aria-label="${t('cpSummary')}">
      <h2 class="panel-title">${t('cpSummary')}</h2>
      <dl class="cart-totals">
        <div><dt>${t('cartSubtotal')}</dt><dd>${money(subtotal)}</dd></div>
        ${savings > 0 ? html`<div class="bag-savings"><dt>${t('cartSaved')}</dt><dd>−${money(savings)}</dd></div>` : ''}
        <div><dt>${t('cpDelivery')}</dt><dd class="muted">${t('cpDeliveryEst')}</dd></div>
        <div class="bag-total"><dt>${t('cpEstTotal')}</dt><dd>${money(subtotal + 70)}–${money(subtotal + 140)}</dd></div>
      </dl>
      ${savings > 0 ? html`<p class="bag-savings cart-save-note">${icon('sparkle', 16)} ${t('cpSaveOrder', { amount: money(savings) })}</p>` : ''}
      <a class="btn btn-primary btn-block btn-lg" href="/checkout" data-checkout ${blocked ? 'aria-disabled="true"' : ''}>${t('cartCheckout')}</a>
      <ul class="cart-assure muted">
        <li>${icon('truck', 16)} ${t('cpDeliveryTime')}</li>
        <li>${icon('shield', 16)} ${t('cpCod')}</li>
        <li>${icon('refresh', 16)} ${t('cpExchange')}</li>
      </ul>
    </aside>`);
  mount(bar, html`<div class="sticky-bar-inner"><div><span class="muted">${t('cartSubtotal')}</span><strong>${money(subtotal)}</strong></div>
    <a class="btn btn-primary" href="/checkout" data-checkout ${blocked ? 'aria-disabled="true"' : ''}>${t('cartCheckout')}</a></div>`);
  bar.hidden = false;
}

const lineFrom = el => /** @type {any} */ (JSON.parse(el.closest('[data-line]').dataset.line));
const fullLine = line => bag.cart.get().find(i => i.id === line.id && i.size === line.size && i.color === line.color);

function removeWithUndo(line, message = t('removed'), after) {
  const snapshot = bag.cart.get().slice();
  bag.remove(line);
  toast(message, { action: { label: t('cpUndo'), onClick: () => { bag.cart.set(snapshot); after?.(); } }, duration: 5000 });
}

on(root, 'click', '[data-step]', async (e, btn) => {
  const line = fullLine(lineFrom(btn)); if (!line) return;
  const next = line.qty + Number(btn.dataset.step);
  if (next < 1) return removeWithUndo(line);
  const ok = await bag.setQty(line, next);
  if (!ok) toast(t('cpCapped'), { type: 'error' });
});
on(root, 'click', '[data-remove]', (e, btn) => { const line = fullLine(lineFrom(btn)); if (line) removeWithUndo(line); });
on(root, 'click', '[data-wish]', (e, btn) => {
  const line = fullLine(lineFrom(btn)); if (!line) return;
  const had = wishlist.get().includes(line.id);
  if (!had) wishlist.set(list => [line.id, ...list]);
  track('AddToWishlist', { contents: [{ id: line.id, quantity: 1 }] });
  removeWithUndo(line, t('cpMoved'), () => { if (!had) wishlist.set(list => list.filter(x => x !== line.id)); });
});
on(root, 'click', '[data-clear-missing]', () => {
  const gone = new Set((state?.missing || []).map(keyOf));
  bag.cart.set(items => items.filter(i => !gone.has(keyOf(i))));
});
on(root, 'click', '[data-retry]', () => render());
on(document, 'click', '[data-checkout]', (e, a) => {
  if (a.getAttribute('aria-disabled') === 'true') { e.preventDefault(); toast(t('cpFixFirst'), { type: 'error' }); }
});

bag.cart.subscribe(() => render());
onLangChange(() => render());
render();
