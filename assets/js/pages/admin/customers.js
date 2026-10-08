import { html, mount, $, debounce } from '/assets/js/core/dom.js';
import { t } from '/assets/js/core/i18n.js';
import { api } from '/assets/js/core/api.js';
import { money, number, date } from '/assets/js/core/format.js';
import { icon, toast } from '/assets/js/core/ui.js';
import { fail, ask, csvDownload, waNumber, loadingView, errorView, freshView } from './shared.js';

let q = '';
export async function render(_, { user } = {}) {
  const view = freshView();
  loadingView(view);
  let list;
  try { list = (await api.get('/api/admin/customers')).customers || []; } catch (error) { errorView(view, error, render); return; }
  mount(view, html`<div class="adm-toolbar"><input class="input" type="search" data-q placeholder="${t('admSearch')}" value="${q}" aria-label="${t('admSearch')}">
    <button class="btn btn-ghost btn-sm" type="button" data-csv>${t('admExport')}</button></div><div data-list></div>`);
  const draw = () => {
    const s = q.toLowerCase();
    const rows = list.filter(c => !s || [c.name, c.email, c.phone].some(v => String(v || '').toLowerCase().includes(s)));
    mount($('[data-list]', view), rows.length ? html`<ul class="adm-cards">${rows.map(c => html`<li class="adm-row">
      <div class="adm-row-main"><div class="adm-row-top"><strong>${c.name || c.email}</strong><span class="badge ${c.role === 'admin' ? 'badge-sale' : 'badge-soft'}">${c.role}</span></div>
        <div class="muted adm-small">${c.email}${c.phone ? ` · ${c.phone}` : ''}</div>
        <div class="adm-small">${t('admOrdersCount')}: ${number(c.orders)} · ${t('admSpent')}: ${money(c.spent)} · ${t('admJoined')}: ${date(c.createdAt)}</div></div>
      <div class="adm-actions">
        ${c.phone ? html`<a class="icon-btn" href="tel:${c.phone}" aria-label="${t('admCall')}">${icon('phone', 18)}</a>
          <a class="icon-btn" target="_blank" rel="noopener" href="https://wa.me/${waNumber(c.phone)}" aria-label="${t('admWhatsApp')}">${icon('whatsapp', 18)}</a>` : ''}
        ${c.id !== user?.id ? html`<button class="btn btn-ghost btn-sm" type="button" data-role="${c.id}" data-to="${c.role === 'admin' ? 'customer' : 'admin'}">${c.role === 'admin' ? t('admMakeCustomer') : t('admMakeAdmin')}</button>` : ''}
      </div></li>`)}</ul>` : html`<div class="empty"><h3 class="empty-title">${t('admNone')}</h3></div>`);
  };
  draw();
  $('[data-q]', view).addEventListener('input', debounce(e => { q = e.target.value.trim(); draw(); }, 200));
  view.addEventListener('click', async e => {
    if (e.target.closest('[data-csv]')) {
      csvDownload('mohor-customers.csv', [['Name', 'Email', 'Phone', 'Role', 'Orders', 'Spent', 'Joined'], ...list.map(c => [c.name, c.email, c.phone, c.role, c.orders, c.spent, c.createdAt || ''])]);
      return;
    }
    const b = e.target.closest('[data-role]'); if (!b) return;
    const c = list.find(x => x.id === b.dataset.role);
    if (!(await ask(t('admRoleQ', { name: c.name || c.email, role: b.dataset.to }), b.dataset.to === 'admin', t('admApply')))) return;
    try { await api.put('/api/admin/customers', { id: c.id, role: b.dataset.to }); toast(t('admUpdated'), { type: 'success' }); render(null, { user }); } catch (error) { fail(error); }
  });
}
