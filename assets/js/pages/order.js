// Order detail: /order?id=… — signed-in owners load directly; guests verify
// with the phone number used at checkout (POST /api/orders/track).
import { boot, CONTACT } from '/assets/js/core/layout.js';
import { html, mount, on, $, safeUrl } from '/assets/js/core/dom.js';
import { t, extend, onLangChange, getLang } from '/assets/js/core/i18n.js';
import { money, number, dateTime, isBdPhone, normalizePhone } from '/assets/js/core/format.js';
import { icon, toast, busy, copyText } from '/assets/js/core/ui.js';
import { api } from '/assets/js/core/api.js';

const ORDER_STRINGS = {
  en: {
    odTitle: 'Order', odPlaced: 'Placed {date}', odStatus: 'Status', odItems: 'Items', odDelivery: 'Delivery', odTotal: 'Total',
    odAddress: 'Delivery to', odPayment: 'Payment', odNote: 'Your note', odHelp: 'Need help with this order?',
    stPending: 'Pending', stConfirmed: 'Confirmed', stShipped: 'Shipped', stCompleted: 'Delivered', stCancelled: 'Cancelled',
    stPendingD: 'We received your order and will call to confirm.', stConfirmedD: 'Confirmed and being prepared by hand.',
    stShippedD: 'With the courier, on its way to you.', stCompletedD: 'Delivered. Exchanges within 24 hours.', stCancelledD: 'This order was cancelled.',
    odVerifyTitle: 'Verify to view this order', odVerifyText: 'Enter the mobile number used at checkout.',
    odOrderId: 'Order ID', odPhone: 'Mobile number', odView: 'View order', odNotFound: 'No order matches that ID and phone number.',
    odCopied: 'Order ID copied', odCopy: 'Copy order ID', odWaMsg: 'Hello Mohor! I have a question about order #{id}.',
    odBadPhone: 'Enter the order ID and a valid 11-digit mobile number.', odAll: 'All orders', odShop: 'Continue shopping', odCod: 'Cash on delivery',
  },
  bn: {
    odTitle: 'অর্ডার', odPlaced: '{date} তারিখে করা', odStatus: 'অবস্থা', odItems: 'পণ্য', odDelivery: 'ডেলিভারি', odTotal: 'মোট',
    odAddress: 'ডেলিভারি ঠিকানা', odPayment: 'পেমেন্ট', odNote: 'আপনার নোট', odHelp: 'এই অর্ডার নিয়ে সাহায্য লাগবে?',
    stPending: 'অপেক্ষমাণ', stConfirmed: 'কনফার্মড', stShipped: 'পাঠানো হয়েছে', stCompleted: 'ডেলিভারি সম্পন্ন', stCancelled: 'বাতিল',
    stPendingD: 'আপনার অর্ডার পেয়েছি, কনফার্ম করতে কল করব।', stConfirmedD: 'কনফার্ম হয়েছে, হাতে তৈরি করা হচ্ছে।',
    stShippedD: 'কুরিয়ারের কাছে, আপনার দিকে আসছে।', stCompletedD: 'ডেলিভারি হয়েছে। ২৪ ঘণ্টার মধ্যে এক্সচেঞ্জ।', stCancelledD: 'এই অর্ডারটি বাতিল করা হয়েছে।',
    odVerifyTitle: 'অর্ডার দেখতে যাচাই করুন', odVerifyText: 'চেকআউটে ব্যবহৃত মোবাইল নম্বর দিন।',
    odOrderId: 'অর্ডার আইডি', odPhone: 'মোবাইল নম্বর', odView: 'অর্ডার দেখুন', odNotFound: 'এই আইডি ও ফোন নম্বরে কোনো অর্ডার পাওয়া যায়নি।',
    odCopied: 'অর্ডার আইডি কপি হয়েছে', odCopy: 'অর্ডার আইডি কপি করুন', odWaMsg: 'হ্যালো মোহর! অর্ডার #{id} নিয়ে একটি প্রশ্ন আছে।',
    odBadPhone: 'অর্ডার আইডি ও সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।', odAll: 'সব অর্ডার', odShop: 'কেনাকাটা চালিয়ে যান', odCod: 'ক্যাশ অন ডেলিভারি',
  },
};
extend(ORDER_STRINGS);

const FLOW = ['Pending', 'Confirmed', 'Shipped', 'Completed'];
const statusKey = s => { const v = String(s || 'Pending').toLowerCase(); return ['pending', 'confirmed', 'shipped', 'completed', 'cancelled'].includes(v) ? v : 'pending'; };
const cap = s => s[0].toUpperCase() + s.slice(1);
const statusBadge = s => html`<span class="status status-${statusKey(s)}">${t('st' + cap(statusKey(s)))}</span>`;

function timeline(status) {
  const key = statusKey(status);
  if (key === 'cancelled') return html`<ol class="timeline is-cancelled"><li class="is-done"><span class="tl-dot">${icon('close', 14)}</span><div><strong>${t('stCancelled')}</strong><p class="muted">${t('stCancelledD')}</p></div></li></ol>`;
  const at = FLOW.findIndex(s => s.toLowerCase() === key);
  return html`<ol class="timeline">${FLOW.map((s, i) => html`<li class="${i < at ? 'is-done' : i === at ? 'is-current is-done' : ''}" ${i === at ? 'aria-current="step"' : ''}>
    <span class="tl-dot">${i <= at ? icon('check', 14) : ''}</span><div><strong>${t('st' + s)}</strong>${i === at ? html`<p class="muted">${t('st' + s + 'D')}</p>` : ''}</div></li>`)}</ol>`;
}

const itemTitle = i => (getLang() === 'bn' && i.titleBn) || i.title || i.name || 'Item';

function detail(o) {
  const wa = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(t('odWaMsg', { id: o.id }))}`;
  return html`
  <header class="page-head order-head">
    <p class="eyebrow">${t('odTitle')}</p>
    <h1 class="display order-id"><em>#${o.id}</em> <button class="icon-btn" type="button" data-copy="${o.id}" aria-label="${t('odCopy')}">${icon('copy', 18)}</button></h1>
    <p class="muted">${t('odPlaced', { date: dateTime(o.createdAt) })} · ${statusBadge(o.status)}</p>
  </header>
  <div class="order-grid">
    <section class="panel"><h2 class="panel-title">${t('odStatus')}</h2>${timeline(o.status)}</section>
    <section class="panel"><h2 class="panel-title">${t('odItems')}</h2>
      <ul class="checkout-items">${(o.items || []).map(i => html`<li>
        <img src="${safeUrl(i.image, '/assets/image-placeholder.svg')}" alt="" width="48" height="64" loading="lazy">
        <div>${i.id ? html`<a class="bag-title" href="/product?id=${encodeURIComponent(i.id)}">${itemTitle(i)}</a>` : html`<span class="bag-title">${itemTitle(i)}</span>`}
        <span class="bag-meta">${i.size && i.size !== 'Standard' ? i.size : ''}${i.color ? ` · ${i.color}` : ''} × ${number(i.qty || 1)}</span></div>
        <span class="price-now">${money(i.lineTotal ?? (Number(i.price) || 0) * (Number(i.qty) || 1))}</span></li>`)}</ul>
      <dl class="cart-totals">
        <div><dt>${t('cartSubtotal')}</dt><dd>${money(o.subtotal)}</dd></div>
        ${o.discount > 0 ? html`<div class="bag-savings"><dt>${t('cartSaved')}</dt><dd>−${money(o.discount)}</dd></div>` : ''}
        <div><dt>${t('odDelivery')} <small class="muted">${o.deliveryZone}</small></dt><dd>${money(o.deliveryFee)}</dd></div>
        <div class="bag-total"><dt>${t('odTotal')}</dt><dd>${money(o.totalAmount)}</dd></div>
      </dl></section>
    <section class="panel order-meta">
      <h2 class="panel-title">${t('odAddress')}</h2>
      <p><strong>${o.customerName}</strong><br>${o.customerPhone}<br>${o.deliveryAddress}</p>
      <p class="muted">${t('odPayment')}: ${t('odCod')}</p>
      ${o.note ? html`<p class="muted">${t('odNote')}: ${o.note}</p>` : ''}
    </section>
    <section class="panel order-help"><h2 class="panel-title">${t('odHelp')}</h2>
      <div class="order-actions">
        <a class="btn btn-wa" href="${wa}" target="_blank" rel="noopener" data-contact>${icon('whatsapp', 18)} ${t('supportWhatsapp')}</a>
        <a class="btn" href="tel:${CONTACT.phone}" data-contact>${icon('phone', 18)} ${t('supportCall')}</a>
        <a class="btn btn-ghost" href="${CONTACT.messenger}" target="_blank" rel="noopener" data-contact>${icon('chat', 18)} ${t('supportMessenger')}</a>
      </div>
      <p class="order-links"><a class="link" href="/orders">${t('odAll')}</a> · <a class="link" href="/shop">${t('odShop')}</a> · <a class="link" href="/policy">${t('navPolicy')}</a></p>
    </section>
  </div>`;
}

const user = await boot({ page: 'order' });
const root = $('#order-root');
const id = new URLSearchParams(location.search).get('id') || '';
let order = null;

const verifyForm = (error = '') => html`
  <section class="panel order-verify"><h1 class="h2">${t('odVerifyTitle')}</h1><p class="muted">${t('odVerifyText')}</p>
    <form class="form-grid" id="verify" novalidate>
      <label class="field"><span>${t('odOrderId')}</span><input class="input" name="id" required value="${id}" autocomplete="off" placeholder="MH…"></label>
      <label class="field"><span>${t('odPhone')}</span><input class="input" name="phone" type="tel" inputmode="tel" autocomplete="tel" required placeholder="01XXXXXXXXX"></label>
      ${error ? html`<p class="field-error" role="alert">${error}</p>` : ''}
      <button class="btn btn-primary btn-block" type="submit">${t('odView')}</button>
    </form></section>`;

function render() { mount(root, order ? detail(order) : verifyForm()); document.title = order ? `${t('odTitle')} #${order.id} — Mohor` : document.title; }

async function load() {
  if (user && id) {
    try { ({ order } = await api.get(`/api/orders?id=${encodeURIComponent(id)}`)); } catch { order = null; }
  }
  if (!order) {
    try { const saved = JSON.parse(sessionStorage.getItem('mohor:last-order') || 'null'); if (saved?.id === id) order = saved; } catch { /* ignore */ }
  }
  render();
}

on(root, 'submit', '#verify', async (e, f) => {
  e.preventDefault();
  const d = new FormData(/** @type {HTMLFormElement} */ (f));
  const oid = String(d.get('id') || '').trim(); const phone = String(d.get('phone') || '');
  if (!oid || !isBdPhone(phone)) { mount(root, verifyForm(t('odBadPhone'))); return; }
  const restore = busy(f.querySelector('button[type=submit]'));
  try {
    ({ order } = await api.post('/api/orders/track', { id: oid, phone: normalizePhone(phone) }));
    history.replaceState(null, '', `/order?id=${encodeURIComponent(order.id)}`);
    render();
  } catch (error) { restore(); mount(root, verifyForm(error.status === 404 ? t('odNotFound') : error.message)); }
});
on(root, 'click', '[data-copy]', async (e, b) => { if (await copyText(b.dataset.copy)) toast(t('odCopied'), { type: 'success' }); });
onLangChange(render);
load();
