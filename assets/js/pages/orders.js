// Order history (signed in) with status filters, plus guest tracking by id + phone.
import { boot } from '/assets/js/core/layout.js';
import { html, mount, on, $ } from '/assets/js/core/dom.js';
import { t, extend, onLangChange } from '/assets/js/core/i18n.js';
import { money, number, date, isBdPhone, normalizePhone } from '/assets/js/core/format.js';
import { icon, busy, emptyState } from '/assets/js/core/ui.js';
import { api } from '/assets/js/core/api.js';

extend({
  en: {
    ohTrackTitle: 'Track an order', ohTrackText: 'Use the order ID from your confirmation and the phone number you ordered with.',
    ohId: 'Order ID', ohPhone: 'Mobile number', ohTrack: 'Track', ohNotFound: 'No order matches that ID and phone number.',
    ohBad: 'Enter the order ID and a valid 11-digit mobile number.', ohHistory: 'Your orders', ohEmpty: 'No orders yet',
    ohEmptyText: 'When you place an order it will appear here.', ohNoMatch: 'No orders with this status.', ohPieces: '{n} pieces',
    ohSignIn: 'Sign in to see all your orders', ohLoadError: 'We could not load your orders.',
    stPending: 'Pending', stConfirmed: 'Confirmed', stShipped: 'Shipped', stCompleted: 'Delivered', stCancelled: 'Cancelled',
  },
  bn: {
    ohTrackTitle: 'অর্ডার ট্র্যাক করুন', ohTrackText: 'কনফার্মেশনের অর্ডার আইডি ও অর্ডারে ব্যবহৃত ফোন নম্বর দিন।',
    ohId: 'অর্ডার আইডি', ohPhone: 'মোবাইল নম্বর', ohTrack: 'ট্র্যাক', ohNotFound: 'এই আইডি ও ফোন নম্বরে কোনো অর্ডার পাওয়া যায়নি।',
    ohBad: 'অর্ডার আইডি ও সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।', ohHistory: 'আপনার অর্ডার', ohEmpty: 'এখনো কোনো অর্ডার নেই',
    ohEmptyText: 'অর্ডার করলে এখানে দেখা যাবে।', ohNoMatch: 'এই অবস্থার কোনো অর্ডার নেই।', ohPieces: '{n}টি পণ্য',
    ohSignIn: 'সব অর্ডার দেখতে সাইন ইন করুন', ohLoadError: 'আপনার অর্ডার লোড করা যায়নি।',
    stPending: 'অপেক্ষমাণ', stConfirmed: 'কনফার্মড', stShipped: 'পাঠানো হয়েছে', stCompleted: 'ডেলিভারি সম্পন্ন', stCancelled: 'বাতিল',
  },
});

const STATUSES = ['Pending', 'Confirmed', 'Shipped', 'Completed', 'Cancelled'];
const key = s => (STATUSES.find(x => x.toLowerCase() === String(s || '').toLowerCase()) || 'Pending');

const user = await boot({ page: 'orders' });
const root = $('#orders-root');
let orders = null; let loadError = false; let filter = new URLSearchParams(location.search).get('status') || 'all';
let trackError = '';

const trackForm = () => html`
  <section class="panel orders-track" id="track"><h2 class="panel-title">${t('ohTrackTitle')}</h2><p class="muted">${t('ohTrackText')}</p>
    <form class="orders-track-form" id="track-form" novalidate>
      <label class="field"><span>${t('ohId')}</span><input class="input" name="id" required autocomplete="off" placeholder="MH…"></label>
      <label class="field"><span>${t('ohPhone')}</span><input class="input" name="phone" type="tel" inputmode="tel" autocomplete="tel" required placeholder="01XXXXXXXXX"></label>
      <button class="btn btn-primary" type="submit">${icon('search', 18)} ${t('ohTrack')}</button>
    </form>${trackError ? html`<p class="field-error" role="alert">${trackError}</p>` : ''}</section>`;

function history() {
  if (!user) return html`<p class="orders-signin"><a class="btn" href="/login?next=/orders">${icon('user', 18)} ${t('ohSignIn')}</a></p>`;
  if (loadError) return html`<div class="empty"><p class="empty-text">${t('ohLoadError')}</p><button class="btn" type="button" data-retry>${t('retry')}</button></div>`;
  if (!orders) return html`<div class="orders-list">${[1, 2, 3].map(() => html`<div class="panel"><div class="skeleton skeleton-line"></div><div class="skeleton skeleton-line short"></div></div>`)}</div>`;
  if (!orders.length) return emptyState({ iconName: 'package', title: t('ohEmpty'), text: t('ohEmptyText'), action: { href: '/shop', label: t('navShop') } });
  const counts = Object.fromEntries(STATUSES.map(s => [s, orders.filter(o => key(o.status) === s).length]));
  const list = filter === 'all' ? orders : orders.filter(o => key(o.status) === filter);
  return html`<section><h2 class="h3 orders-h">${t('ohHistory')}</h2>
    <div class="chip-row" role="group">
      <button class="chip" type="button" data-filter="all" aria-pressed="${filter === 'all'}">${t('all')} · ${number(orders.length)}</button>
      ${STATUSES.filter(s => counts[s]).map(s => html`<button class="chip" type="button" data-filter="${s}" aria-pressed="${filter === s}">${t('st' + s)} · ${number(counts[s])}</button>`)}
    </div>
    ${list.length ? html`<ul class="orders-list">${list.map(o => html`<li><a class="panel order-row" href="/order?id=${encodeURIComponent(o.id)}">
      <div><strong>#${o.id}</strong><span class="muted">${date(o.createdAt)} · ${t('ohPieces', { n: number((o.items || []).reduce((s, i) => s + (Number(i.qty) || 1), 0)) })}</span></div>
      <div class="order-row-end"><span class="status status-${key(o.status).toLowerCase()}">${t('st' + key(o.status))}</span><span class="price-now">${money(o.totalAmount)}</span></div>
    </a></li>`)}</ul>` : html`<p class="muted orders-none">${t('ohNoMatch')}</p>`}</section>`;
}

const render = () => mount(root, html`${history()}${trackForm()}`);

async function load() {
  if (!user) return render();
  loadError = false; orders = null; render();
  try { ({ orders } = await api.get('/api/orders')); } catch { loadError = true; }
  render();
}

on(root, 'click', '[data-filter]', (e, b) => {
  filter = b.dataset.filter; render();
  const u = new URL(location.href); filter === 'all' ? u.searchParams.delete('status') : u.searchParams.set('status', filter); window.history.replaceState(null, '', u);
});
on(root, 'click', '[data-retry]', load);
on(root, 'submit', '#track-form', async (e, f) => {
  e.preventDefault();
  const d = new FormData(/** @type {HTMLFormElement} */ (f));
  const id = String(d.get('id') || '').trim().replace(/^#/, ''); const phone = String(d.get('phone') || '');
  if (!id || !isBdPhone(phone)) { trackError = t('ohBad'); render(); return; }
  const restore = busy(f.querySelector('button[type=submit]'));
  try {
    const { order } = await api.post('/api/orders/track', { id, phone: normalizePhone(phone) });
    try { sessionStorage.setItem('mohor:last-order', JSON.stringify(order)); } catch { /* ignore */ }
    location.href = `/order?id=${encodeURIComponent(order.id)}`;
  } catch (error) { restore(); trackError = error.status === 404 ? t('ohNotFound') : error.message; render(); }
});
onLangChange(render);
load();
