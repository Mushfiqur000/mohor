import { html, mount, $ } from '/assets/js/core/dom.js';
import { t } from '/assets/js/core/i18n.js';
import { api } from '/assets/js/core/api.js';
import { toast, busy } from '/assets/js/core/ui.js';
import { fail, dirty, loadingView, errorView, freshView } from './shared.js';

// datetime-local works in local time; the stored value is ISO.
const toLocal = iso => { const ms = Date.parse(iso || ''); if (!ms) return ''; const d = new Date(ms - new Date().getTimezoneOffset() * 6e4); return d.toISOString().slice(0, 16); };

export async function render() {
  const view = freshView();
  loadingView(view);
  let s;
  try { s = await api.get('/api/settings'); } catch (error) { errorView(view, error, render); return; }
  const num = (name, label, extra = '') => html`<label class="field"><span>${label}</span><input class="input" type="number" min="0" inputmode="numeric" name="${name}" value="${s[name] ?? 0}" ${extra}></label>`;
  const txt = (name, label, type = 'text') => html`<label class="field"><span>${label}</span><input class="input" type="${type}" name="${name}" value="${s[name] ?? ''}"></label>`;
  mount(view, html`
    <form class="adm-editor" novalidate>
      <section class="panel form-grid cols-2"><h3 class="panel-title span-2">${t('admDelivery')}</h3>
        ${num('deliveryInside', t('admDeliveryIn'))}${num('deliveryOutside', t('admDeliveryOut'))}${num('freeDeliveryThreshold', t('admFree'))}${num('maxQtyPerItem', t('admMaxQty'), 'min="1"')}
      </section>
      <section class="panel form-grid cols-2"><h3 class="panel-title span-2">${t('admSale')}</h3>
        <label class="check span-2"><input type="checkbox" name="saleActive" ${s.saleActive ? 'checked' : ''}> <span>${t('admSaleOn')}</span></label>
        ${num('discountPercent', t('admSalePct'), 'max="90"')}
        <label class="field"><span>${t('admSaleEnd')}</span><input class="input" type="datetime-local" name="saleEndTime" value="${toLocal(s.saleEndTime)}"></label>
        ${txt('bannerText', t('admSaleText'))}${txt('bannerBadge', t('admSaleBadge'))}
      </section>
      <section class="panel form-grid cols-2"><h3 class="panel-title span-2">${t('admContact')}</h3>
        ${txt('whatsapp', 'WhatsApp (8801…)')}${txt('phone', t('admPhone'), 'tel')}${txt('email', t('admEmail'), 'email')}
        <label class="field span-2"><span>${t('admAnnouncement')}</span><textarea class="textarea" name="announcement" rows="2">${s.announcement || ''}</textarea></label>
      </section>
      <section class="panel"><button class="btn btn-ghost" type="button" data-telegram>${t('admTelegram')}</button></section>
      <div class="adm-savebar"><button class="btn btn-primary" type="submit">${t('admSave')}</button></div>
    </form>`);
  const form = $('form', view);
  form.addEventListener('input', () => { dirty.value = true; });
  $('[data-telegram]', view).addEventListener('click', async e => {
    const restore = busy(e.currentTarget);
    try { await api.post('/api/admin/telegram-test', {}); toast(t('admTelegramOk'), { type: 'success' }); } catch (error) { fail(error); }
    restore();
  });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const f = form.elements;
    const n = k => Math.max(0, Number(f[k].value) || 0);
    const body = {
      deliveryInside: n('deliveryInside'), deliveryOutside: n('deliveryOutside'), freeDeliveryThreshold: n('freeDeliveryThreshold'),
      maxQtyPerItem: Math.max(1, n('maxQtyPerItem')), saleActive: f.saleActive.checked, discountPercent: Math.min(90, n('discountPercent')),
      saleEndTime: f.saleEndTime.value ? new Date(f.saleEndTime.value).toISOString() : '', bannerText: f.bannerText.value.trim(), bannerBadge: f.bannerBadge.value.trim(),
      whatsapp: f.whatsapp.value.replace(/\D/g, ''), phone: f.phone.value.trim(), email: f.email.value.trim(), announcement: f.announcement.value.trim(),
    };
    const restore = busy($('[type=submit]', form));
    try { await api.put('/api/settings', body); dirty.value = false; toast(t('admSaved'), { type: 'success' }); } catch (error) { fail(error); }
    restore();
  });
}
