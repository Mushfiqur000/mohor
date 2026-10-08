import { html, mount, $ } from '/assets/js/core/dom.js';
import { t } from '/assets/js/core/i18n.js';
import { api } from '/assets/js/core/api.js';
import { relativeTime } from '/assets/js/core/format.js';
import { icon, toast, busy } from '/assets/js/core/ui.js';
import { fail, ask, dirty, loadingView, errorView, freshView } from './shared.js';

export async function render() {
  const view = freshView();
  loadingView(view);
  let list, customers = [];
  try {
    [list, customers] = await Promise.all([
      api.get('/api/admin/notifications').then(r => r.notifications || []),
      api.get('/api/admin/customers').then(r => r.customers || []).catch(() => []),
    ]);
  } catch (error) { errorView(view, error, render); return; }
  const who = id => (id === 'ALL' ? t('admAllCustomers') : customers.find(c => c.id === id)?.email || id);
  mount(view, html`
    <form class="panel form-grid adm-notify" novalidate>
      <fieldset class="segmented"><legend class="sr-only">${t('admSendTo')}</legend>
        <label><input type="radio" name="to" value="all" checked> ${t('admAllCustomers')}</label>
        <label><input type="radio" name="to" value="one"> ${t('admUserEmail')}</label></fieldset>
      <label class="field" data-email hidden><span>${t('admUserEmail')}</span><input class="input" type="email" name="email" list="adm-emails">
        <datalist id="adm-emails">${customers.map(c => html`<option value="${c.email}">${c.name}</option>`)}</datalist></label>
      <label class="field"><span>${t('admMsgTitle')}</span><input class="input" name="title" maxlength="120" required></label>
      <label class="field"><span>${t('admMessage')}</span><textarea class="textarea" name="message" rows="3" maxlength="1000" required></textarea></label>
      <label class="field"><span>${t('admLink')}</span><input class="input" name="link" placeholder="/shop"></label>
      <button class="btn btn-primary" type="submit">${icon('bell', 16)} ${t('admSend')}</button>
    </form>
    <h2 class="adm-h2">${t('admRecent')}</h2>
    ${list.length ? html`<ul class="adm-cards">${list.map(n => html`<li class="adm-row">
      <div class="adm-row-main"><div class="adm-row-top"><strong>${n.title}</strong><span class="muted adm-small">${relativeTime(n.created_at)}</span></div>
        <div>${n.message}</div><div class="muted adm-small">${who(n.user_id)} · ${n.type}${Number(n.is_read) ? ' · ✓' : ''}</div></div>
      <button class="icon-btn" type="button" data-del="${n.id}" aria-label="${t('admDelete')}">${icon('trash', 18)}</button></li>`)}</ul>`
      : html`<div class="empty"><h3 class="empty-title">${t('admNone')}</h3></div>`}`);
  const form = $('form', view);
  form.addEventListener('change', () => { $('[data-email]', view).hidden = form.to.value !== 'one'; });
  form.addEventListener('input', () => { dirty.value = true; });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const title = form.title.value.trim(), message = form.message.value.trim();
    const target = form.to.value === 'one' ? form.email.value.trim() : 'ALL';
    if (!title || !message || !target) { toast(t('admRequired'), { type: 'error' }); return; }
    const restore = busy($('[type=submit]', form));
    try { await api.post('/api/admin/notifications', { targetUserId: target, title, message, link: form.link.value.trim(), type: 'general' }); dirty.value = false; toast(t('admSent'), { type: 'success' }); render(); }
    catch (error) { restore(); fail(error); }
  });
  view.addEventListener('click', async e => {
    const b = e.target.closest('[data-del]'); if (!b) return;
    if (!(await ask(t('admDeleteQ')))) return;
    try { await api.del(`/api/admin/notifications?id=${encodeURIComponent(b.dataset.del)}`); toast(t('admDeleted'), { type: 'success' }); render(); } catch (error) { fail(error); }
  });
}
