import { html, mount, on, $ } from '/assets/js/core/dom.js';
import { t, getLang } from '/assets/js/core/i18n.js';
import { money, number, dateTime } from '/assets/js/core/format.js';
import { fetchOrders, openOrder } from './orders.js';
import { statusClass, loadingView, errorView, freshView } from './shared.js';

const PER_PAGE = 20;
const st = { orders: [], month: null, day: '', page: 1 };
const dayKey = ms => new Date(ms + 6 * 36e5).toISOString().slice(0, 10); // Asia/Dhaka

export async function render() {
  const view = freshView();
  loadingView(view);
  try { st.orders = await fetchOrders(); } catch (error) { errorView(view, error, () => render(view)); return; }
  if (!st.month) st.month = dayKey(Date.now()).slice(0, 7);
  draw(view);
}

function draw(view) {
  const [y, m] = st.month.split('-').map(Number);
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const firstDow = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const per = {};
  let undated = 0;
  for (const o of st.orders) {
    const tm = Date.parse(o.createdAt || '');
    if (!tm) { undated++; continue; }
    const k = dayKey(tm);
    if (!k.startsWith(st.month)) continue;
    per[k] = per[k] || { n: 0, rev: 0 };
    per[k].n++; if (o.status !== 'Cancelled') per[k].rev += o.totalAmount;
  }
  const max = Math.max(1, ...Object.values(per).map(v => v.n));
  const scoped = st.orders.filter(o => { const tm = Date.parse(o.createdAt || ''); if (!tm) return false; const k = dayKey(tm); return st.day ? k === st.day : k.startsWith(st.month); });
  const monthRev = scoped.filter(o => o.status !== 'Cancelled').reduce((s, o) => s + o.totalAmount, 0);
  const pages = Math.max(1, Math.ceil(scoped.length / PER_PAGE));
  st.page = Math.min(st.page, pages);
  const label = new Intl.DateTimeFormat(getLang() === 'bn' ? 'bn-BD' : 'en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(Date.UTC(y, m - 1, 1));
  const W = 560, H = 140, bw = (W - 20) / days, maxRev = Math.max(1, ...Object.values(per).map(v => v.rev));
  mount(view, html`
    <div class="adm-grid2">
      <section class="panel">
        <div class="adm-cal-head"><button class="icon-btn" type="button" data-month="-1" aria-label="${t('admPrev')}">‹</button>
          <h2 class="panel-title">${label}</h2><button class="icon-btn" type="button" data-month="1" aria-label="${t('admNext')}">›</button></div>
        <div class="adm-cal">${Array.from({ length: firstDow }, () => html`<span></span>`)}
          ${Array.from({ length: days }, (_, i) => {
            const k = `${st.month}-${String(i + 1).padStart(2, '0')}`; const v = per[k];
            const lvl = v ? Math.ceil((v.n / max) * 4) : 0;
            return html`<button type="button" class="adm-cal-day lvl-${lvl}" data-day="${k}" aria-pressed="${st.day === k}" title="${v ? `${v.n} · ${money(v.rev)}` : ''}"><span>${number(i + 1)}</span>${v ? html`<small>${number(v.n)}</small>` : ''}</button>`;
          })}</div>
        ${undated ? html`<p class="muted adm-small">${t('admNoDate', { n: number(undated) })}</p>` : ''}
      </section>
      <section class="panel"><h2 class="panel-title">${t('admRevenue')} · ${money(monthRev)} · ${number(scoped.length)} ${t('admOrdersCount')}</h2>
        <svg class="adm-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${t('admRevenue')}">
          ${Array.from({ length: days }, (_, i) => { const k = `${st.month}-${String(i + 1).padStart(2, '0')}`; const h = Math.round(((per[k]?.rev || 0) / maxRev) * (H - 20));
            return html`<rect class="adm-bar${st.day === k ? ' is-today' : ''}" x="${10 + i * bw + 1}" y="${H - 10 - h}" width="${Math.max(bw - 2, 1)}" height="${Math.max(h, 1)}" rx="2"><title>${k}: ${money(per[k]?.rev || 0)}</title></rect>`; })}
        </svg>
        ${st.day ? html`<button class="btn btn-ghost btn-sm" type="button" data-day="">${t('all')} — ${label}</button>` : ''}
      </section>
    </div>
    <ul class="adm-cards">${scoped.slice((st.page - 1) * PER_PAGE, st.page * PER_PAGE).map(o => html`
      <li class="adm-row" data-hist-order="${o.id}"><div class="adm-row-main"><div class="adm-row-top"><strong>#${o.id}</strong><span class="${statusClass(o.status)}">${o.status}</span></div>
        <div>${o.customerName} · <span class="muted">${o.customerPhone}</span></div></div>
        <div class="adm-row-side"><strong>${money(o.totalAmount)}</strong><span class="muted adm-small">${dateTime(o.createdAt)}</span></div></li>`)}</ul>
    ${scoped.length ? '' : html`<div class="empty"><h3 class="empty-title">${t('admNone')}</h3></div>`}
    ${pages > 1 ? html`<nav class="adm-pager"><button class="btn btn-ghost btn-sm" type="button" data-hpage="${st.page - 1}" ${st.page <= 1 ? 'disabled' : ''}>${t('admPrev')}</button>
      <span class="muted">${t('admPage', { a: number(st.page), b: number(pages) })}</span>
      <button class="btn btn-ghost btn-sm" type="button" data-hpage="${st.page + 1}" ${st.page >= pages ? 'disabled' : ''}>${t('admNext')}</button></nav>` : ''}`);
  bind(view);
}

function bind(view) {
  // Handlers attach once per view element (view is reused across sections, so use onclick property).
  view.onclick = e => {
    const el = e.target.closest('[data-month],[data-day],[data-hpage],[data-hist-order]');
    if (!el || !view.contains(el)) return;
    if (el.dataset.month) {
      const [y, m] = st.month.split('-').map(Number);
      const d = new Date(Date.UTC(y, m - 1 + Number(el.dataset.month), 1));
      st.month = d.toISOString().slice(0, 7); st.day = ''; st.page = 1; draw(view);
    } else if (el.dataset.day !== undefined) { st.day = st.day === el.dataset.day ? '' : el.dataset.day; st.page = 1; draw(view); }
    else if (el.dataset.hpage) { st.page = Number(el.dataset.hpage); draw(view); }
    else if (el.dataset.histOrder) openOrder(el.dataset.histOrder, view, st.orders, () => render(view));
  };
}
