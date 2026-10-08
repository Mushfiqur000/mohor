import { html, mount, on, $, $$, debounce, safeUrl } from '/assets/js/core/dom.js';
import { t } from '/assets/js/core/i18n.js';
import { api } from '/assets/js/core/api.js';
import { money, number, dateTime } from '/assets/js/core/format.js';
import { icon, toast, sheet, busy } from '/assets/js/core/ui.js';
import { STATUSES, statusClass, fail, ask, csvDownload, waNumber, loadingView, errorView, freshView } from './shared.js';

const PER_PAGE = 25;
const state = { orders: [], q: '', status: '', from: '', to: '', page: 1, selected: new Set() };

export const fetchOrders = async () => (await api.get('/api/admin/orders')).orders || [];

function filtered() {
  const q = state.q.toLowerCase();
  const from = state.from ? Date.parse(state.from + 'T00:00:00+06:00') : 0;
  const to = state.to ? Date.parse(state.to + 'T23:59:59+06:00') : Infinity;
  return state.orders.filter(o => {
    if (state.status && o.status !== state.status) return false;
    if (from || to !== Infinity) { const tm = Date.parse(o.createdAt || ''); if (!tm || tm < from || tm > to) return false; }
    if (!q) return true;
    return [o.id, o.customerName, o.customerPhone, o.deliveryAddress, o.userEmail, ...o.items.map(i => i.title)].some(v => String(v || '').toLowerCase().includes(q));
  });
}

const itemLine = i => `${i.title}${i.size ? ` · ${i.size}` : ''}${i.color ? ` · ${i.color}` : ''} × ${i.qty}`;

export async function render() {
  const view = freshView();
  loadingView(view);
  try { state.orders = await fetchOrders(); } catch (error) { errorView(view, error, () => render(view)); return; }
  state.selected.clear();
  mount(view, html`
    <div class="adm-toolbar">
      <input class="input" type="search" data-q placeholder="${t('admSearch')}" value="${state.q}" aria-label="${t('admSearch')}">
      <select class="select" data-status aria-label="${t('admStatus')}"><option value="">${t('admAllStatus')}</option>
        ${STATUSES.map(s => html`<option value="${s}" ${state.status === s ? 'selected' : ''}>${s}</option>`)}</select>
      <label class="adm-date"><span>${t('admFrom')}</span><input class="input" type="date" data-from value="${state.from}"></label>
      <label class="adm-date"><span>${t('admTo')}</span><input class="input" type="date" data-to value="${state.to}"></label>
      <button class="btn btn-ghost btn-sm" type="button" data-csv>${t('admExport')}</button>
    </div>
    <div class="adm-chips chip-row">${['', ...STATUSES].map(s => html`<button class="chip" type="button" data-chip="${s}" aria-pressed="${state.status === s}">${s || t('all')} <span class="muted">${number(s ? state.orders.filter(o => o.status === s).length : state.orders.length)}</span></button>`)}</div>
    <div class="adm-bulk" hidden>
      <strong data-count></strong>
      <select class="select" data-bulk-status aria-label="${t('admSetStatus')}"><option value="">${t('admSetStatus')}</option>${STATUSES.map(s => html`<option value="${s}">${s}</option>`)}</select>
      <button class="btn btn-primary btn-sm" type="button" data-bulk-apply>${t('admApply')}</button>
      <button class="btn btn-danger btn-sm" type="button" data-bulk-delete>${icon('trash', 16)} ${t('admDelete')}</button>
    </div>
    <div data-list></div>`);
  draw(view);

  const refilter = () => { state.page = 1; state.selected.clear(); draw(view); };
  $('[data-q]', view).addEventListener('input', debounce(e => { state.q = e.target.value.trim(); refilter(); }, 200));
  $('[data-status]', view).addEventListener('change', e => { state.status = e.target.value; syncChips(view); refilter(); });
  $('[data-from]', view).addEventListener('change', e => { state.from = e.target.value; refilter(); });
  $('[data-to]', view).addEventListener('change', e => { state.to = e.target.value; refilter(); });
  on(view, 'click', '[data-chip]', (e, b) => { state.status = b.dataset.chip; $('[data-status]', view).value = state.status; syncChips(view); refilter(); });
  on(view, 'click', '[data-page]', (e, b) => { state.page = Number(b.dataset.page); draw(view); view.scrollIntoView({ block: 'start' }); });
  on(view, 'change', '[data-pick]', (e, cb) => { cb.checked ? state.selected.add(cb.dataset.pick) : state.selected.delete(cb.dataset.pick); bulkBar(view); });
  on(view, 'change', '[data-pick-all]', (e, cb) => { $$('[data-pick]', view).forEach(x => { x.checked = cb.checked; cb.checked ? state.selected.add(x.dataset.pick) : state.selected.delete(x.dataset.pick); }); bulkBar(view); });
  on(view, 'click', '[data-open-order]', (e, el) => { if (e.target.closest('input,a,button:not([data-open-order])')) return; openOrder(el.dataset.openOrder, view); });
  on(view, 'click', '[data-csv]', () => exportCsv());
  on(view, 'click', '[data-bulk-apply]', async (e, b) => {
    const status = $('[data-bulk-status]', view).value;
    if (!status || !state.selected.size) return;
    if (!(await ask(`${status}: ${t('admSelected', { n: state.selected.size })}`, false, t('admApply')))) return;
    const restore = busy(b);
    try { await api.put('/api/admin/orders', { ids: [...state.selected], status }); toast(t('admUpdated'), { type: 'success' }); render(view); }
    catch (error) { restore(); fail(error); }
  });
  on(view, 'click', '[data-bulk-delete]', async (e, b) => {
    const ids = [...state.selected];
    if (!ids.length || !(await ask(t('admDeleteManyQ', { n: ids.length })))) return;
    const restore = busy(b);
    const results = await Promise.allSettled(ids.map(id => api.del(`/api/admin/orders?id=${encodeURIComponent(id)}`)));
    const failed = results.filter(r => r.status === 'rejected').length;
    failed ? toast(`${failed} failed`, { type: 'error' }) : toast(t('admDeleted'), { type: 'success' });
    restore(); render(view);
  });
}

const syncChips = view => $$('[data-chip]', view).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.chip === state.status)));

function bulkBar(view) {
  const bar = $('.adm-bulk', view);
  bar.hidden = !state.selected.size;
  $('[data-count]', bar).textContent = t('admSelected', { n: number(state.selected.size) });
}

function draw(view) {
  const list = filtered();
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  state.page = Math.min(state.page, pages);
  const slice = list.slice((state.page - 1) * PER_PAGE, state.page * PER_PAGE);
  mount($('[data-list]', view), list.length ? html`
    <label class="check adm-pick-all"><input type="checkbox" data-pick-all> <span>${t('all')} (${number(slice.length)})</span></label>
    <ul class="adm-cards">${slice.map(o => html`
      <li class="adm-row" data-open-order="${o.id}" tabindex="0">
        <input type="checkbox" class="adm-pick" data-pick="${o.id}" aria-label="#${o.id}" ${state.selected.has(o.id) ? 'checked' : ''}>
        <div class="adm-row-main">
          <div class="adm-row-top"><strong>#${o.id}</strong><span class="${statusClass(o.status)}">${o.status}</span></div>
          <div>${o.customerName} · <span class="muted">${o.customerPhone}</span></div>
          <div class="muted adm-small">${o.items.map(itemLine).join(', ')}</div>
        </div>
        <div class="adm-row-side"><strong>${money(o.totalAmount)}</strong><span class="muted adm-small">${dateTime(o.createdAt)}</span>
          <button class="btn btn-ghost btn-sm" type="button" data-open-order="${o.id}">${t('viewDetails')}</button></div>
      </li>`)}</ul>
    ${pages > 1 ? html`<nav class="adm-pager"><button class="btn btn-ghost btn-sm" type="button" data-page="${state.page - 1}" ${state.page <= 1 ? 'disabled' : ''}>${t('admPrev')}</button>
      <span class="muted">${t('admPage', { a: number(state.page), b: number(pages) })}</span>
      <button class="btn btn-ghost btn-sm" type="button" data-page="${state.page + 1}" ${state.page >= pages ? 'disabled' : ''}>${t('admNext')}</button></nav>` : ''}`
    : html`<div class="empty"><h3 class="empty-title">${t('admNone')}</h3></div>`);
  bulkBar(view);
}

function exportCsv() {
  const rows = [['Order ID', 'Date', 'Status', 'Customer', 'Phone', 'Email', 'Address', 'Zone', 'Items', 'Subtotal', 'Discount', 'Delivery', 'Total', 'Payment', 'Note']];
  filtered().forEach(o => rows.push([o.id, o.createdAt || '', o.status, o.customerName, o.customerPhone, o.userEmail || '', o.deliveryAddress, o.deliveryZone,
    o.items.map(itemLine).join(' | '), o.subtotal, o.discount, o.deliveryFee, o.totalAmount, o.paymentMethod, o.note]));
  csvDownload(`mohor-orders-${new Date().toISOString().slice(0, 10)}.csv`, rows);
}

export function openOrder(id, view, list = state.orders, onChange) {
  const o = list.find(x => String(x.id) === String(id));
  if (!o) return;
  const s = sheet({ id: 'adm-order', title: `${t('admOrder')} #${o.id}`, onClose: () => s.el.remove(), body: html`
    <div class="stack adm-order">
      <div class="adm-row-top"><span class="${statusClass(o.status)}">${o.status}</span><span class="muted">${dateTime(o.createdAt)}</span></div>
      <label class="field"><span>${t('admStatus')}</span><select class="select" data-set-status>${STATUSES.map(st => html`<option value="${st}" ${st === o.status ? 'selected' : ''}>${st}</option>`)}</select></label>
      <dl class="adm-dl">
        <dt>${t('admCustomer')}</dt><dd>${o.customerName}${o.userEmail ? html` <span class="muted">(${o.userEmail})</span>` : ''}</dd>
        <dt>${t('admPhone')}</dt><dd>${o.customerPhone}</dd>
        <dt>${t('admAddress')}</dt><dd>${o.deliveryAddress}</dd>
        <dt>${t('admZone')}</dt><dd>${o.deliveryZone || '—'} · ${o.paymentMethod} · ${o.channel}</dd>
        ${o.note ? html`<dt>${t('admNote')}</dt><dd>${o.note}</dd>` : ''}
      </dl>
      <div class="adm-contact">
        <a class="btn btn-ghost btn-sm" href="tel:${o.customerPhone}">${icon('phone', 16)} ${t('admCall')}</a>
        <a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="https://wa.me/${waNumber(o.customerPhone)}?text=${encodeURIComponent(`Hello ${o.customerName}, this is MOHOR about your order #${o.id}.`)}">${icon('whatsapp', 16)} ${t('admWhatsApp')}</a>
        <button class="btn btn-ghost btn-sm" type="button" data-print>${t('admPrint')}</button>
      </div>
      <h3 class="panel-title">${t('admItems')}</h3>
      <ul class="adm-items">${o.items.map(i => html`<li>
        <img src="${safeUrl(i.image, '/assets/image-placeholder.svg')}" alt="" width="56" height="70" loading="lazy">
        <div><strong>${i.title}</strong><div class="muted adm-small">${[i.size, i.color].filter(Boolean).join(' · ')} × ${number(i.qty)}</div></div>
        <strong>${money(i.lineTotal ?? i.price * i.qty)}</strong></li>`)}</ul>
      <dl class="adm-dl adm-totals">
        <dt>${t('admSubtotal')}</dt><dd>${money(o.subtotal)}</dd>
        ${o.discount ? html`<dt>${t('admDiscount')}</dt><dd>−${money(o.discount)}</dd>` : ''}
        <dt>${t('admDelivery')}</dt><dd>${money(o.deliveryFee)}</dd>
        <dt><strong>${t('admTotal')}</strong></dt><dd><strong>${money(o.totalAmount)}</strong></dd>
      </dl>
    </div>`,
    footer: html`<button class="btn btn-danger btn-sm" type="button" data-del-order>${icon('trash', 16)} ${t('admDelete')}</button>` });
  const refresh = () => (onChange ? onChange() : render(view));
  $('[data-set-status]', s.el).addEventListener('change', async e => {
    const status = e.target.value;
    try { await api.put('/api/admin/orders', { id: o.id, status }); o.status = status; toast(t('admUpdated'), { type: 'success' }); s.close(); refresh(); }
    catch (error) { e.target.value = o.status; fail(error); }
  });
  $('[data-print]', s.el).addEventListener('click', () => printInvoice(o));
  $('[data-del-order]', s.el).addEventListener('click', async () => {
    if (!(await ask(t('admDeleteQ')))) return;
    try { await api.del(`/api/admin/orders?id=${encodeURIComponent(o.id)}`); toast(t('admDeleted'), { type: 'success' }); s.close(); refresh(); } catch (error) { fail(error); }
  });
  s.open();
}

export function printInvoice(o) {
  const w = window.open('', '_blank', 'width=720,height=900');
  if (!w) { toast('Allow pop-ups to print.', { type: 'error' }); return; }
  const tk = n => `৳${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;
  const doc = html`<!doctype html><html><head><meta charset="utf-8"><title>Invoice #${o.id}</title><style>
    body{font:14px/1.5 Georgia,serif;color:#1f1915;margin:32px}h1{font-weight:400;letter-spacing:.2em;margin:0}table{width:100%;border-collapse:collapse;margin:20px 0}
    td,th{padding:8px;border-bottom:1px solid #e6dccf;text-align:left}td.r,th.r{text-align:right}.muted{color:#84776c}.tot td{border:0}.head{display:flex;justify-content:space-between;border-bottom:2px solid #6b1e2e;padding-bottom:12px}
  </style></head><body>
    <div class="head"><div><h1>MOHOR</h1><div class="muted">mohor.me · Sylhet</div></div><div><strong>${t('admInvoice')} #${o.id}</strong><br><span class="muted">${dateTime(o.createdAt)}</span><br>${o.status}</div></div>
    <p><strong>${o.customerName}</strong><br>${o.customerPhone}<br>${o.deliveryAddress}</p>
    <table><thead><tr><th>Item</th><th>Qty</th><th class="r">Price</th><th class="r">Total</th></tr></thead><tbody>
    ${o.items.map(i => html`<tr><td>${i.title}<br><span class="muted">${[i.size, i.color].filter(Boolean).join(' · ')}</span></td><td>${i.qty}</td><td class="r">${tk(i.price)}</td><td class="r">${tk(i.lineTotal ?? i.price * i.qty)}</td></tr>`)}
    </tbody><tbody class="tot"><tr><td colspan="3" class="r">Subtotal</td><td class="r">${tk(o.subtotal)}</td></tr>
    ${o.discount ? html`<tr><td colspan="3" class="r">Discount</td><td class="r">−${tk(o.discount)}</td></tr>` : ''}
    <tr><td colspan="3" class="r">Delivery</td><td class="r">${tk(o.deliveryFee)}</td></tr><tr><td colspan="3" class="r"><strong>Total (${o.paymentMethod})</strong></td><td class="r"><strong>${tk(o.totalAmount)}</strong></td></tr></tbody></table>
    ${o.note ? html`<p class="muted">Note: ${o.note}</p>` : ''}<p class="muted">${t('admThanks')}</p></body></html>`;
  w.document.open(); w.document.write(String(doc)); w.document.close();
  w.focus(); setTimeout(() => w.print(), 300);
}
