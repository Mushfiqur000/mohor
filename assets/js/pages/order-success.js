// Order confirmation: id + copy, summary (server if signed in, else the
// snapshot saved at checkout), and what happens next.
import { boot, CONTACT } from '/assets/js/core/layout.js';
import { html, mount, on, $, safeUrl } from '/assets/js/core/dom.js';
import { t, extend, onLangChange, getLang } from '/assets/js/core/i18n.js';
import { money, number } from '/assets/js/core/format.js';
import { icon, toast, copyText } from '/assets/js/core/ui.js';
import { api } from '/assets/js/core/api.js';

extend({
  en: {
    osEyebrow: 'Order received', osTitle: 'Thank you, <em>truly</em>.', osThanks: 'Thank you, {name}.', osLede: 'Your order is in. Keep your order ID for reference.',
    osId: 'Order ID', osCopy: 'Copy', osCopied: 'Copied', osSummary: 'Summary', osTotal: 'Total (cash on delivery)', osDelivery: 'Delivery',
    osNext: 'What happens next', osStep1: 'We call you within a few hours to confirm.', osStep2: 'Your pieces are checked and packed by hand.',
    osStep3: 'The courier delivers — 1–3 business days in Sylhet City, 3–5 business days elsewhere. Pay the rider.',
    osStep4: 'Something not right? Tell us within 24 hours of delivery for an exchange.',
    osView: 'View & track order', osShop: 'Continue shopping', osQuestions: 'Questions? We are here.', osCopyPhone: 'Copy number',
    osNoId: 'We could not find an order reference.', osWaMsg: 'Hello Mohor! I just placed order #{id}.',
  },
  bn: {
    osEyebrow: 'অর্ডার গ্রহণ করা হয়েছে', osTitle: 'আন্তরিক <em>ধন্যবাদ</em>।', osThanks: 'ধন্যবাদ, {name}।', osLede: 'আপনার অর্ডার পেয়েছি। রেফারেন্সের জন্য অর্ডার আইডি রেখে দিন।',
    osId: 'অর্ডার আইডি', osCopy: 'কপি', osCopied: 'কপি হয়েছে', osSummary: 'সারাংশ', osTotal: 'মোট (ক্যাশ অন ডেলিভারি)', osDelivery: 'ডেলিভারি',
    osNext: 'এরপর কী হবে', osStep1: 'কয়েক ঘণ্টার মধ্যে কনফার্ম করতে আমরা কল করব।', osStep2: 'আপনার পণ্য হাতে যাচাই করে প্যাক করা হবে।',
    osStep3: 'কুরিয়ার পৌঁছে দেবে — সিলেট সিটিতে ১–৩ কার্যদিবস, অন্যত্র ৩–৫ কার্যদিবস। রাইডারকে পেমেন্ট দিন।',
    osStep4: 'কিছু ঠিক না থাকলে ডেলিভারির ২৪ ঘণ্টার মধ্যে এক্সচেঞ্জের জন্য জানান।',
    osView: 'অর্ডার দেখুন ও ট্র্যাক করুন', osShop: 'কেনাকাটা চালিয়ে যান', osQuestions: 'প্রশ্ন আছে? আমরা আছি।', osCopyPhone: 'নম্বর কপি',
    osNoId: 'কোনো অর্ডার রেফারেন্স পাওয়া যায়নি।', osWaMsg: 'হ্যালো মোহর! আমি এইমাত্র অর্ডার #{id} করেছি।',
  },
});

const user = await boot({ page: 'order-success' });
const root = $('#success-root');
const id = new URLSearchParams(location.search).get('id') || '';
let order = null;
try { const s = JSON.parse(sessionStorage.getItem('mohor:last-order') || 'null'); if (s?.id === id) order = s; } catch { /* ignore */ }

const itemTitle = i => (getLang() === 'bn' && i.titleBn) || i.title || 'Item';
const rawTitle = () => { const s = document.createElement('span'); s.innerHTML = t('osTitle'); return s.innerHTML; };

function render() {
  if (!id) {
    mount(root, html`<div class="empty"><h1 class="empty-title">${t('osNoId')}</h1><a class="btn btn-primary" href="/orders">${t('navTrack')}</a></div>`); return;
  }
  const wa = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(t('osWaMsg', { id }))}`;
  const first = order?.customerName?.split(' ')[0];
  mount(root, html`
    <header class="success-head">
      <span class="success-seal">${icon('check', 30)}</span>
      <p class="eyebrow">${t('osEyebrow')}</p>
      <h1 class="display">${first ? t('osThanks', { name: first }) : html`<span data-title></span>`}</h1>
      <p class="lede">${t('osLede')}</p>
      <div class="success-id"><span class="muted">${t('osId')}</span><strong>#${id}</strong>
        <button class="btn btn-sm" type="button" data-copy="${id}">${icon('copy', 16)} ${t('osCopy')}</button></div>
    </header>
    ${order ? html`<section class="panel"><h2 class="panel-title">${t('osSummary')}</h2>
      <ul class="checkout-items">${(order.items || []).map(i => html`<li><img src="${safeUrl(i.image, '/assets/image-placeholder.svg')}" alt="" width="48" height="64" loading="lazy">
        <div><span class="bag-title">${itemTitle(i)}</span><span class="bag-meta">${i.size && i.size !== 'Standard' ? i.size : ''}${i.color ? ` · ${i.color}` : ''} × ${number(i.qty)}</span></div>
        <span class="price-now">${money(i.lineTotal)}</span></li>`)}</ul>
      <dl class="cart-totals">
        <div><dt>${t('cartSubtotal')}</dt><dd>${money(order.subtotal)}</dd></div>
        ${order.discount > 0 ? html`<div class="bag-savings"><dt>${t('cartSaved')}</dt><dd>−${money(order.discount)}</dd></div>` : ''}
        <div><dt>${t('osDelivery')} <small class="muted">${order.deliveryZone}</small></dt><dd>${money(order.deliveryFee)}</dd></div>
        <div class="bag-total"><dt>${t('osTotal')}</dt><dd>${money(order.totalAmount)}</dd></div>
      </dl></section>` : ''}
    <section class="panel"><h2 class="panel-title">${t('osNext')}</h2>
      <ol class="success-steps">
        <li>${icon('phone', 18)}<span>${t('osStep1')}</span></li><li>${icon('package', 18)}<span>${t('osStep2')}</span></li>
        <li>${icon('truck', 18)}<span>${t('osStep3')}</span></li><li>${icon('refresh', 18)}<span>${t('osStep4')}</span></li>
      </ol></section>
    <div class="order-actions success-cta">
      <a class="btn btn-primary btn-lg" href="/order?id=${encodeURIComponent(id)}">${t('osView')}</a>
      <a class="btn btn-lg" href="/shop">${t('osShop')}</a>
    </div>
    <section class="success-help"><p>${t('osQuestions')}</p>
      <div class="order-actions">
        <a class="btn btn-wa btn-sm" href="${wa}" target="_blank" rel="noopener" data-contact>${icon('whatsapp', 16)} ${t('supportWhatsapp')}</a>
        <a class="btn btn-sm" href="tel:${CONTACT.phone}" data-contact>${icon('phone', 16)} ${CONTACT.phoneLabel}</a>
        <button class="btn btn-ghost btn-sm" type="button" data-copy="${CONTACT.phoneLabel}">${icon('copy', 16)} ${t('osCopyPhone')}</button>
      </div></section>`);
  const slot = root.querySelector('[data-title]');
  if (slot) slot.innerHTML = rawTitle(); // trusted translation string with <em>
}

on(root, 'click', '[data-copy]', async (e, b) => { if (await copyText(b.dataset.copy)) toast(t('osCopied'), { type: 'success' }); });
onLangChange(render);
render();
if (user && id) {
  api.get(`/api/orders?id=${encodeURIComponent(id)}`).then(r => { order = r.order; render(); }).catch(() => {});
}
