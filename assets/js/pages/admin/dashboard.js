import { html, mount, raw } from '/assets/js/core/dom.js';
import { t } from '/assets/js/core/i18n.js';
import { api } from '/assets/js/core/api.js';
import { money, number, date } from '/assets/js/core/format.js';
import { STATUSES, statusClass, loadingView, errorView, freshView } from './shared.js';

const dhakaDay = ms => new Date(ms + 6 * 36e5).toISOString().slice(0, 10);

function chart(byDay) {
  const days = Array.from({ length: 14 }, (_, i) => dhakaDay(Date.now() - (13 - i) * 864e5));
  const vals = days.map(d => byDay?.[d]?.revenue || 0);
  const max = Math.max(1, ...vals);
  const W = 560, H = 200, pad = 24, bw = (W - pad * 2) / 14;
  const bars = days.map((d, i) => {
    const h = Math.round((vals[i] / max) * (H - pad * 2));
    const x = pad + i * bw + 3, y = H - pad - h;
    return html`<g><title>${date(d + 'T06:00:00Z')}: ${money(vals[i])} · ${number(byDay?.[d]?.orders || 0)} ${t('admOrdersCount')}</title>
      <rect class="adm-bar${i === 13 ? ' is-today' : ''}" x="${x}" y="${y}" width="${bw - 6}" height="${Math.max(h, 1)}" rx="3"></rect>
      ${i % 2 === 1 ? html`<text class="adm-axis" x="${x + (bw - 6) / 2}" y="${H - 6}" text-anchor="middle">${number(Number(d.slice(8)))}</text>` : ''}</g>`;
  });
  return html`<svg class="adm-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${t('admLast14')}">
    <line class="adm-baseline" x1="${pad}" x2="${W - pad}" y1="${H - pad}" y2="${H - pad}"></line>
    <text class="adm-axis" x="${pad}" y="14">${money(max)}</text>${bars}</svg>`;
}

export async function render() {
  const view = freshView();
  loadingView(view);
  let s;
  try { s = await api.get('/api/admin/stats'); } catch (error) { errorView(view, error, () => render(view)); return; }
  const kpi = (label, value, href) => html`<a class="adm-kpi" href="${href}"><span class="adm-kpi-label">${label}</span><span class="adm-kpi-value">${value}</span></a>`;
  const total = Math.max(1, STATUSES.reduce((a, k) => a + (s.statusCounts?.[k] || 0), 0));
  mount(view, html`
    <div class="adm-kpis">
      ${kpi(t('admRevenue'), money(s.revenue), '#history')}
      ${kpi(t('admOrdersCount'), number(s.orders), '#orders')}
      ${kpi(t('admPending'), number(s.pending), '#orders')}
      ${kpi(t('admAvg'), money(s.averageOrder), '#history')}
      ${kpi(t('admCustomersCount'), number(s.customers), '#customers')}
      ${kpi(t('admProductsCount'), number(s.products), '#products')}
    </div>
    <div class="adm-grid2">
      <section class="panel"><h2 class="panel-title">${t('admLast14')}</h2>${chart(s.byDay)}</section>
      <section class="panel"><h2 class="panel-title">${t('admStatusMix')}</h2>
        <div class="adm-stack-bar">${STATUSES.map(k => html`<span class="adm-seg adm-seg-${k.toLowerCase()}" style="${raw(`flex:${s.statusCounts?.[k] || 0}`)}"></span>`)}</div>
        <ul class="adm-list">${STATUSES.map(k => html`<li><span class="${statusClass(k)}">${k}</span><strong>${number(s.statusCounts?.[k] || 0)}</strong><span class="muted">${number(Math.round(((s.statusCounts?.[k] || 0) / total) * 100))}%</span></li>`)}</ul>
      </section>
      <section class="panel"><h2 class="panel-title">${t('admTop')}</h2>
        ${s.topProducts?.length ? html`<ol class="adm-list adm-ol">${s.topProducts.map(p => html`<li><span>${p.title}</span><strong>${number(p.qty)}</strong><span class="muted">${t('admSold')}</span></li>`)}</ol>` : html`<p class="muted">${t('admNone')}</p>`}
      </section>
      <section class="panel"><h2 class="panel-title">${t('admLow')}</h2>
        ${s.lowStock?.length ? html`<ul class="adm-list">${s.lowStock.map(p => html`<li><a class="link" href="#products" data-edit-product="${p.id}">${p.title}</a><strong class="${p.quantity ? '' : 'adm-danger'}">${number(p.quantity)}</strong><span class="muted">${t('admLeft')}</span></li>`)}</ul>` : html`<p class="muted">${t('admNone')}</p>`}
      </section>
    </div>`);
}
