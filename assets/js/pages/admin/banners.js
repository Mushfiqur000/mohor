import { html, mount, $, safeUrl } from '/assets/js/core/dom.js';
import { t } from '/assets/js/core/i18n.js';
import { api } from '/assets/js/core/api.js';
import { number } from '/assets/js/core/format.js';
import { icon, toast, busy } from '/assets/js/core/ui.js';
import { fail, ask, dirty, leaveOk, loadingView, errorView, freshView } from './shared.js';
import { uploadImage } from './upload.js';

let banners = [];

export async function render() {
  const view = freshView();
  loadingView(view);
  try { banners = await api.get('/api/banners?all=1'); } catch (error) { errorView(view, error, render); return; }
  mount(view, html`
    <div class="adm-toolbar"><button class="btn btn-primary btn-sm" type="button" data-new>${icon('plus', 16)} ${t('admNewBanner')}</button></div>
    ${banners.length ? html`<ul class="adm-banners">${banners.map(b => html`
      <li class="panel adm-banner">
        <img src="${safeUrl(b.imageUrl, '/assets/image-placeholder.svg')}" alt="" style="object-position:${b.objectPosition || '50% 50%'}" loading="lazy">
        <div class="adm-row-main"><strong>${b.title || '—'}</strong><span class="muted adm-small">${b.subtitle}</span>
          <span class="adm-small"><span class="badge ${b.active ? 'badge-ok' : 'badge-ink'}">${b.active ? t('admActive') : t('admHidden')}</span> · ${t('admOrderNo')} ${number(b.displayOrder)}</span></div>
        <div class="adm-actions">
          <button class="icon-btn" type="button" data-toggle="${b.id}" aria-label="${b.active ? t('admHidden') : t('admActive')}">${icon('eye', 18)}</button>
          <button class="icon-btn" type="button" data-edit="${b.id}" aria-label="${t('admEdit')}">${icon('edit', 18)}</button>
          <button class="icon-btn" type="button" data-del="${b.id}" aria-label="${t('admDelete')}">${icon('trash', 18)}</button></div>
      </li>`)}</ul>` : html`<div class="empty"><h3 class="empty-title">${t('admNone')}</h3></div>`}`);
  view.addEventListener('click', async e => {
    const el = e.target.closest('button'); if (!el) return;
    if (el.matches('[data-new]')) edit(null);
    else if (el.dataset.edit) edit(banners.find(b => b.id === el.dataset.edit));
    else if (el.dataset.toggle) {
      const b = banners.find(x => x.id === el.dataset.toggle);
      try { await api.put('/api/banners', { id: b.id, active: !b.active }); toast(t('admUpdated'), { type: 'success' }); render(); } catch (error) { fail(error); }
    } else if (el.dataset.del) {
      if (!(await ask(t('admDeleteQ')))) return;
      try { await api.del(`/api/banners?id=${encodeURIComponent(el.dataset.del)}`); toast(t('admDeleted'), { type: 'success' }); render(); } catch (error) { fail(error); }
    }
  });
}

function edit(b) {
  const view = freshView();
  const d = { id: b?.id || '', title: b?.title || '', subtitle: b?.subtitle || '', imageUrl: b?.imageUrl || '', link: b?.link || '/shop', buttonText: b?.buttonText || '',
    active: b ? Boolean(b.active) : true, objectPosition: b?.objectPosition || '50% 50%', displayOrder: b?.displayOrder ?? banners.length };
  const [px, py] = d.objectPosition.split(' ').map(v => parseInt(v, 10));
  dirty.value = false;
  mount(view, html`
    <form class="adm-editor" novalidate>
      <div class="adm-editor-head"><button class="btn btn-ghost btn-sm" type="button" data-back>${icon('chevronLeft', 16)} ${t('back')}</button>
        <h2 class="adm-h2">${d.id ? t('admEdit') : t('admNewBanner')}</h2></div>
      <section class="panel stack">
        <div class="adm-banner-preview"><img data-preview src="${safeUrl(d.imageUrl, '/assets/image-placeholder.svg')}" alt="${t('admPreview')}" style="object-position:${d.objectPosition}">
          <div class="adm-banner-copy"><strong data-pv-title>${d.title}</strong><span data-pv-sub>${d.subtitle}</span></div></div>
        <div class="adm-toolbar">
          <label class="btn btn-ghost btn-sm adm-file">${icon('plus', 16)} <span data-upl-label>${t('admUpload')}</span><input type="file" accept="image/*" data-upload></label>
          <input class="input" name="imageUrl" type="url" placeholder="${t('admImageUrl')}" value="${d.imageUrl}" aria-label="${t('admImage')}">
        </div>
        <div class="form-grid cols-2">
          <label class="field"><span>${t('admFocus')} X</span><input type="range" min="0" max="100" name="px" value="${px || 50}"></label>
          <label class="field"><span>${t('admFocus')} Y</span><input type="range" min="0" max="100" name="py" value="${py || 50}"></label>
          <label class="field"><span>${t('admBannerTitle')}</span><input class="input" name="title" value="${d.title}"></label>
          <label class="field"><span>${t('admSubtitle')}</span><input class="input" name="subtitle" value="${d.subtitle}"></label>
          <label class="field"><span>${t('admLink')}</span><input class="input" name="link" value="${d.link}"></label>
          <label class="field"><span>${t('admButton')}</span><input class="input" name="buttonText" value="${d.buttonText}"></label>
          <label class="field"><span>${t('admOrderNo')}</span><input class="input" type="number" name="displayOrder" value="${d.displayOrder}"></label>
          <label class="check adm-check-pad"><input type="checkbox" name="active" ${d.active ? 'checked' : ''}> <span>${t('admActive')}</span></label>
        </div>
      </section>
      <div class="adm-savebar"><button class="btn btn-ghost" type="button" data-back>${t('admCancel')}</button><button class="btn btn-primary" type="submit">${t('admSave')}</button></div>
    </form>`);
  const form = $('form', view);
  const pos = () => `${form.px.value}% ${form.py.value}%`;
  const preview = () => {
    const img = $('[data-preview]', view);
    img.src = safeUrl(form.imageUrl.value, '/assets/image-placeholder.svg');
    img.style.objectPosition = pos();
    $('[data-pv-title]', view).textContent = form.title.value;
    $('[data-pv-sub]', view).textContent = form.subtitle.value;
  };
  form.addEventListener('input', () => { dirty.value = true; preview(); });
  form.addEventListener('change', async e => {
    if (!e.target.matches('[data-upload]') || !e.target.files[0]) return;
    const label = $('[data-upl-label]', view); label.textContent = t('admUploading');
    try { form.imageUrl.value = await uploadImage(e.target.files[0], 'banner'); dirty.value = true; preview(); } catch (error) { fail(error); }
    label.textContent = t('admUpload');
  });
  view.addEventListener('click', async e => { if (e.target.closest('[data-back]') && await leaveOk()) { dirty.value = false; render(); } });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!form.imageUrl.value.trim()) { toast(t('admImage') + '?', { type: 'error' }); return; }
    const body = { title: form.title.value.trim(), subtitle: form.subtitle.value.trim(), imageUrl: form.imageUrl.value.trim(), link: form.link.value.trim(),
      buttonText: form.buttonText.value.trim(), active: form.active.checked, objectPosition: pos(), displayOrder: Number(form.displayOrder.value) || 0 };
    const restore = busy($('[type=submit]', form));
    try {
      d.id ? await api.put('/api/banners', { id: d.id, ...body }) : await api.post('/api/banners', body);
      dirty.value = false; toast(t('admSaved'), { type: 'success' }); render();
    } catch (error) { restore(); fail(error); }
  });
}
