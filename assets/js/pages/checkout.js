// Checkout: guest or signed-in, live server quote, policy acceptance, order
// placement (website) or a pre-composed WhatsApp order.
import { boot, CONTACT } from '/assets/js/core/layout.js';
import { html, mount, on, $, debounce, safeUrl } from '/assets/js/core/dom.js';
import { t, extend, onLangChange, getLang } from '/assets/js/core/i18n.js';
import { money, number, normalizePhone, isBdPhone } from '/assets/js/core/format.js';
import { icon, toast, emptyState, busy } from '/assets/js/core/ui.js';
import * as bag from '/assets/js/core/cart.js';
import { api } from '/assets/js/core/api.js';
import { track } from '/assets/js/core/analytics.js';

extend({
  en: {
    coContact: 'Your details', coName: 'Full name', coPhone: 'Mobile number', coPhoneHint: '11 digits, e.g. 01712345678',
    coAddress: 'Delivery address', coAddressHint: 'House, road, area, thana, district', coZone: 'Delivery zone',
    coInside: 'Inside Sylhet City', coOutside: 'Outside Sylhet', coNote: 'Note for us (optional)', coNotePh: 'Preferred call time, gift wrap…',
    coSignedAs: 'Signed in as {name}', coGuest: 'Checking out as a guest.', coSignInFaster: 'Sign in for faster checkout & order history',
    coSummary: 'Your order', coDelivery: 'Delivery', coDiscount: 'Discount', coTotal: 'Total', coFree: 'Free',
    coDecrease: 'Decrease quantity', coIncrease: 'Increase quantity',
    coPolicy: 'I agree to the', coPolicyLink: 'delivery & return policy', coPolicyNote: 'Exchanges within 24 hours of delivery. Cash on delivery.',
    coPlace: 'Place order', coPlacing: 'Placing order…', coOr: 'or', coWhatsapp: 'Order via WhatsApp',
    coPay: 'Payment: Cash on delivery — pay the rider when it arrives.',
    errName: 'Please enter your full name.', errPhone: 'Please enter a valid BD mobile number (01XXXXXXXXX).',
    errAddress: 'Please enter your full delivery address.', errPolicy: 'Please agree to the delivery & return policy.',
    errZone: 'Please choose a delivery zone.',
    coProblems: 'Some items changed since you added them:', coEditBag: 'Review bag',
    prUnavailable: 'is no longer available', prSize: 'needs a size choice', prColor: 'needs a colour choice',
    prStock: 'only {n} left in stock', prLimit: 'maximum {n} per order', coQuoteError: 'Could not refresh prices.',
    coWaOpened: 'WhatsApp opened — send the message to confirm your order.', coPopup: 'Please allow pop-ups to continue to WhatsApp.',
    coCheckingPrices: 'Checking prices…',
  },
  bn: {
    coContact: 'আপনার তথ্য', coName: 'পুরো নাম', coPhone: 'মোবাইল নম্বর', coPhoneHint: '১১ ডিজিট, যেমন 01712345678',
    coAddress: 'ডেলিভারি ঠিকানা', coAddressHint: 'বাসা, রোড, এলাকা, থানা, জেলা', coZone: 'ডেলিভারি জোন',
    coInside: 'সিলেট সিটির ভেতরে', coOutside: 'সিলেটের বাইরে', coNote: 'আমাদের জন্য নোট (ঐচ্ছিক)', coNotePh: 'কল করার সুবিধাজনক সময়, গিফট র‍্যাপ…',
    coSignedAs: '{name} হিসেবে সাইন ইন', coGuest: 'গেস্ট হিসেবে চেকআউট করছেন।', coSignInFaster: 'দ্রুত চেকআউট ও অর্ডার হিস্টোরির জন্য সাইন ইন করুন',
    coSummary: 'আপনার অর্ডার', coDelivery: 'ডেলিভারি', coDiscount: 'ছাড়', coTotal: 'মোট', coFree: 'ফ্রি',
    coDecrease: 'পরিমাণ কমান', coIncrease: 'পরিমাণ বাড়ান',
    coPolicy: 'আমি সম্মত', coPolicyLink: 'ডেলিভারি ও রিটার্ন পলিসিতে', coPolicyNote: 'ডেলিভারির ২৪ ঘণ্টার মধ্যে এক্সচেঞ্জ। ক্যাশ অন ডেলিভারি।',
    coPlace: 'অর্ডার করুন', coPlacing: 'অর্ডার হচ্ছে…', coOr: 'অথবা', coWhatsapp: 'হোয়াটসঅ্যাপে অর্ডার করুন',
    coPay: 'পেমেন্ট: ক্যাশ অন ডেলিভারি — পার্সেল পেয়ে রাইডারকে দিন।',
    errName: 'অনুগ্রহ করে আপনার পুরো নাম দিন।', errPhone: 'সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)।',
    errAddress: 'অনুগ্রহ করে পূর্ণ ডেলিভারি ঠিকানা দিন।', errPolicy: 'অনুগ্রহ করে ডেলিভারি ও রিটার্ন পলিসিতে সম্মতি দিন।',
    errZone: 'অনুগ্রহ করে ডেলিভারি জোন বাছাই করুন।',
    coProblems: 'যোগ করার পর কিছু পণ্যে পরিবর্তন হয়েছে:', coEditBag: 'ব্যাগ দেখুন',
    prUnavailable: 'আর পাওয়া যাচ্ছে না', prSize: 'সাইজ বাছাই করতে হবে', prColor: 'রং বাছাই করতে হবে',
    prStock: 'স্টকে মাত্র {n}টি আছে', prLimit: 'প্রতি অর্ডারে সর্বোচ্চ {n}টি', coQuoteError: 'দাম হালনাগাদ করা যায়নি।',
    coWaOpened: 'হোয়াটসঅ্যাপ খোলা হয়েছে — অর্ডার কনফার্ম করতে মেসেজটি পাঠান।', coPopup: 'হোয়াটসঅ্যাপে যেতে অনুগ্রহ করে পপ-আপ চালু করুন।',
    coCheckingPrices: 'দাম যাচাই হচ্ছে…',
  },
});

const user = await boot({ page: 'checkout' });
const root = $('#checkout-root');
const DRAFT_KEY = 'mohor:checkout-draft';
let quoteData = null;
let problems = [];
let quoteError = false;
let submitting = false;
let quoteSeq = 0;

const readDraft = () => { try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || '{}'); } catch { return {}; } };
/** @type {{ name?: string, phone?: string, address?: string, zone?: string, note?: string, accept?: boolean }} */
let form = { name: user?.name || '', phone: user?.phone || '', address: user?.address || '', zone: (() => { try { const z = localStorage.getItem('mohor:zone'); return z === 'inside' || z === 'outside' ? z : ''; } catch { return ''; } })(), note: '', accept: false, ...readDraft() };
const saveDraft = () => { try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...form, accept: false })); } catch { /* ignore */ } };
const titleOfItem = i => (getLang() === 'bn' && i.titleBn) || i.title;

function shell() {
  if (!bag.cart.get().length) {
    mount(root, emptyState({ title: t('cartEmpty'), text: t('cartEmptyHint'), action: { href: '/shop', label: t('cartContinue') } }));
    return false;
  }
  mount(root, html`
  <form class="checkout" id="checkout-form" novalidate>
    <div class="checkout-main">
      <section class="panel">
        <h2 class="panel-title">${t('coContact')}</h2>
        <p class="muted checkout-who">${user ? t('coSignedAs', { name: user.name || user.email }) : html`${t('coGuest')} <a class="link" href="/login?next=/checkout">${t('coSignInFaster')}</a>`}</p>
        <div class="form-grid">
          <label class="field"><span>${t('coName')}</span><input class="input" name="name" autocomplete="name" required maxlength="100" value="${form.name}"><small class="field-error" data-err="name"></small></label>
          <label class="field"><span>${t('coPhone')}</span><input class="input" name="phone" type="tel" inputmode="tel" autocomplete="tel" required maxlength="17" placeholder="01XXXXXXXXX" value="${form.phone}"><small class="field-hint">${t('coPhoneHint')}</small><small class="field-error" data-err="phone"></small></label>
          <label class="field"><span>${t('coAddress')}</span><textarea class="textarea" name="address" rows="3" autocomplete="street-address" required maxlength="500" placeholder="${t('coAddressHint')}">${form.address}</textarea><small class="field-error" data-err="address"></small></label>
          <fieldset class="field"><legend>${t('coZone')}</legend>
            <div class="segmented" role="radiogroup">
              <label><input type="radio" name="zone" value="inside" ${form.zone === 'inside' ? 'checked' : ''}><span>${t('coInside')}<br><small>${money(70)}</small></span></label>
              <label><input type="radio" name="zone" value="outside" ${form.zone === 'outside' ? 'checked' : ''}><span>${t('coOutside')}<br><small>${money(140)}</small></span></label>
            </div><small class="field-error" data-err="zone"></small></fieldset>
          <label class="field"><span>${t('coNote')}</span><textarea class="textarea" name="note" rows="2" maxlength="500" placeholder="${t('coNotePh')}">${form.note}</textarea></label>
        </div>
      </section>
    </div>
    <aside class="checkout-side">
      <section class="panel checkout-summary" aria-live="polite" id="summary"></section>
      <section class="panel checkout-confirm">
        <label class="check"><input type="checkbox" name="accept" ${form.accept ? 'checked' : ''}><span>${t('coPolicy')} <a class="link" href="/policy" target="_blank" rel="noopener">${t('coPolicyLink')}</a>. <small class="muted">${t('coPolicyNote')}</small></span></label>
        <small class="field-error" data-err="accept"></small>
        <p class="muted checkout-pay">${icon('shield', 16)} ${t('coPay')}</p>
        <button class="btn btn-primary btn-block btn-lg" type="submit" id="place">${t('coPlace')}</button>
        <p class="checkout-or muted"><span>${t('coOr')}</span></p>
        <button class="btn btn-wa btn-block" type="button" id="wa">${icon('whatsapp', 18)} ${t('coWhatsapp')}</button>
      </section>
    </aside>
  </form>`);
  return true;
}

function renderSummary() {
  const el = $('#summary'); if (!el) return;
  if (problems.length) {
    mount(el, html`<h2 class="panel-title">${t('coSummary')}</h2><div class="cart-alert" role="alert">${icon('info', 18)}<div><p>${t('coProblems')}</p>
      <ul>${problems.map(p => html`<li><strong>${p.title || p.id}</strong> — ${problemText(p)}</li>`)}</ul>
      <a class="btn btn-sm" href="/cart">${t('coEditBag')}</a></div></div>`);
    return;
  }
  if (quoteError) { mount(el, html`<h2 class="panel-title">${t('coSummary')}</h2><p class="muted">${t('coQuoteError')}</p><button class="btn btn-sm" type="button" data-requote>${t('retry')}</button>`); return; }
  if (!quoteData) { mount(el, html`<h2 class="panel-title">${t('coSummary')}</h2><div class="skeleton skeleton-line"></div><div class="skeleton skeleton-line short"></div><p class="sr-only">${t('coCheckingPrices')}</p>`); return; }
  const q = quoteData;
  mount(el, html`<h2 class="panel-title">${t('coSummary')}</h2>
    <ul class="checkout-items">${q.items.map(i => html`<li data-checkout-line="${i.id}" data-size="${i.size}" data-color="${i.color}">
      <img src="${safeUrl(i.image, '/assets/image-placeholder.svg')}" alt="" width="48" height="64" loading="lazy">
      <div><span class="bag-title">${titleOfItem(i)}</span><span class="bag-meta">${i.size !== 'Standard' ? i.size : ''}${i.color ? ` · ${i.color}` : ''}</span>
        <div class="stepper checkout-stepper" role="group" aria-label="${t('qty')}">
          <button type="button" data-checkout-step="-1" aria-label="${t('coDecrease')}" ${i.qty <= 1 ? 'disabled' : ''}>−</button>
          <output>${number(i.qty)}</output>
          <button type="button" data-checkout-step="1" aria-label="${t('coIncrease')}">+</button>
        </div></div>
      <span class="price-now">${money(i.lineTotal)}</span></li>`)}</ul>
    <dl class="cart-totals">
      <div><dt>${t('cartSubtotal')}</dt><dd>${money(q.subtotal)}</dd></div>
      ${q.discount > 0 ? html`<div class="bag-savings"><dt>${t('cartSaved')}</dt><dd>−${money(q.discount)}</dd></div>` : ''}
      <div><dt>${t('coDelivery')} <small class="muted">${form.zone === 'inside' ? t('coInside') : form.zone === 'outside' ? t('coOutside') : ''}</small></dt><dd>${form.zone ? (q.deliveryFee ? money(q.deliveryFee) : t('coFree')) : '—'}</dd></div>
      <div class="bag-total"><dt>${t('coTotal')}</dt><dd>${money(form.zone ? q.total : q.subtotal)}</dd></div>
    </dl>`);
}

function problemText(p) {
  const n = number(p.available ?? 0);
  return { unavailable: t('prUnavailable'), size: t('prSize'), color: t('prColor'), stock: t('prStock', { n }), limit: t('prLimit', { n }) }[p.reason] || t('prUnavailable');
}

async function attachTitles(list) {
  const { lines } = await bag.hydrate().catch(() => ({ lines: [] }));
  return list.map(p => ({ ...p, title: lines.find(l => l.id === p.id)?.product?.title?.[getLang()] || lines.find(l => l.id === p.id)?.product?.title?.en || '' }));
}

async function requote() {
  const seq = ++quoteSeq;
  quoteError = false; renderSummary();
  try {
    const q = await bag.quote(form.zone || 'outside');
    if (seq !== quoteSeq) return;
    quoteData = q; problems = [];
  } catch (error) {
    if (seq !== quoteSeq) return;
    if (error.status === 409 && error.data?.problems) problems = await attachTitles(error.data.problems);
    else quoteError = true;
  }
  renderSummary();
}

function readForm() {
  const f = /** @type {HTMLFormElement} */ ($('#checkout-form'));
  const d = new FormData(f);
  form = { name: String(d.get('name') || '').trim(), phone: String(d.get('phone') || '').trim(), address: String(d.get('address') || '').trim(),
    zone: String(d.get('zone') || ''), note: String(d.get('note') || '').trim(), accept: d.get('accept') === 'on' };
  saveDraft();
}

function validate() {
  readForm();
  const errors = {};
  if (!form.name) errors.name = t('errName');
  if (!isBdPhone(form.phone)) errors.phone = t('errPhone');
  if (form.address.length < 8) errors.address = t('errAddress');
  if (!form.zone) errors.zone = t('errZone');
  if (!form.accept) errors.accept = t('errPolicy');
  document.querySelectorAll('[data-err]').forEach(el => {
    const key = /** @type {HTMLElement} */ (el).dataset.err;
    el.textContent = errors[key] || '';
    const input = /** @type {HTMLFormElement} */ ($('#checkout-form')).elements.namedItem(key);
    if (input instanceof HTMLElement && !(input instanceof RadioNodeList)) input.setAttribute('aria-invalid', errors[key] ? 'true' : 'false');
  });
  const first = Object.keys(errors)[0];
  if (first) {
    toast(errors[first], { type: 'error' });
    const el = /** @type {HTMLFormElement} */ ($('#checkout-form')).querySelector(`[name="${first}"]`);
    /** @type {HTMLElement} */ (el)?.focus?.();
    return false;
  }
  if (problems.length) { toast(t('coProblems'), { type: 'error' }); return false; }
  return true;
}

function saveForSuccess(order) {
  try { sessionStorage.setItem('mohor:last-order', JSON.stringify(order)); } catch { /* ignore */ }
}

async function placeOrder(e) {
  e.preventDefault();
  if (submitting || !validate()) return;
  submitting = true;
  const restore = busy($('#place'), t('coPlacing'));
  try {
    const { order } = await api.post('/api/orders', {
      customerName: form.name, customerPhone: normalizePhone(form.phone), deliveryAddress: form.address,
      deliveryZone: form.zone, note: form.note, items: bag.cart.get(), acceptPolicy: true, channel: 'website',
    });
    saveForSuccess(order);
    try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
    bag.clear();
    location.href = `/order-success?id=${encodeURIComponent(order.id)}`;
  } catch (error) {
    submitting = false; restore();
    if (error.status === 409 && error.data?.problems) { problems = await attachTitles(error.data.problems); renderSummary(); $('#summary')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    toast(error.message || t('errorGeneric'), { type: 'error' });
  }
}

function whatsappOrder() {
  if (!validate()) return;
  if (!quoteData) { toast(t('coCheckingPrices')); return; }
  const q = quoteData;
  const zoneText = form.zone === 'inside' ? 'Inside Sylhet City' : 'Outside Sylhet';
  const lines = [
    'Hello Mohor Clothings! I would like to order:', '',
    ...q.items.map((i, n) => `${n + 1}. ${i.title}${i.size && i.size !== 'Standard' ? ` (Size: ${i.size})` : ''}${i.color ? ` (Colour: ${i.color})` : ''} | Qty: ${i.qty} - ৳${i.lineTotal}`),
    '', `*Subtotal: ৳${q.subtotal}*`,
    ...(q.discount > 0 ? [`*Total savings: ৳${q.discount}*`] : []),
    `*Delivery (${zoneText}): ৳${q.deliveryFee}*`, `*TOTAL: ৳${q.total}* (Cash on delivery)`, '',
    '*CUSTOMER DETAILS*', `Name: ${form.name}`, `Phone: ${normalizePhone(form.phone)}`, `Address: ${form.address}`,
    ...(form.note ? [`Note: ${form.note}`] : []),
  ];
  const win = window.open(`https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener');
  track('Contact');
  if (!win) { toast(t('coPopup'), { type: 'error' }); return; }
  toast(t('coWaOpened'), { type: 'success', duration: 6000 });
}

function start() {
  if (!shell()) return;
  renderSummary();
  requote();
}

on(root, 'submit', '#checkout-form', placeOrder);
on(root, 'click', '#wa', () => whatsappOrder());
on(root, 'click', '[data-requote]', () => requote());
on(root, 'click', '[data-checkout-step]', async (e, button) => {
  const line = button.closest('[data-checkout-line]');
  if (!line) return;
  const current = bag.cart.get().find(item => item.id === line.dataset.checkoutLine
    && item.size === line.dataset.size && item.color === line.dataset.color);
  if (!current) return;
  await bag.setQty(current, current.qty + Number(button.dataset.checkoutStep));
});
on(root, 'change', 'input[name="zone"]', () => { readForm(); requote(); });
on(root, 'input', 'input, textarea', debounce(() => { if ($('#checkout-form')) readForm(); }, 300));
on(root, 'blur', 'input[name="phone"]', (e, el) => { const input = /** @type {HTMLInputElement} */ (el); if (isBdPhone(input.value)) input.value = normalizePhone(input.value); }, true);
onLangChange(() => { if ($('#checkout-form')) readForm(); start(); });
bag.cart.subscribe(() => { if (submitting) return; if (!bag.cart.get().length) start(); else requote(); });

start();
if (bag.cart.get().length) {
  bag.hydrate().then(({ lines, subtotal }) => track('InitiateCheckout', { value: subtotal, contents: lines.map(l => ({ id: l.id, quantity: l.qty })) })).catch(() => {});
}
