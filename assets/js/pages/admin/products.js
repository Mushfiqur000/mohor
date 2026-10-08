import { html, mount, on, $, $$, debounce, safeUrl } from '/assets/js/core/dom.js';
import { t } from '/assets/js/core/i18n.js';
import { api } from '/assets/js/core/api.js';
import { money, number } from '/assets/js/core/format.js';
import { icon, toast, busy } from '/assets/js/core/ui.js';
import { CATEGORIES } from '/assets/js/core/catalog.js';
import { PRODUCT_STATUSES, pStatusLabel, title, fail, ask, dirty, leaveOk, loadingView, errorView, freshView } from './shared.js';
import { uploadImage } from './upload.js';

const st = { products: [], q: '', status: '', selected: new Set(), order: null, saved: null };
let pendingEdit = '';
on(document, 'click', '[data-edit-product]', (e, a) => { pendingEdit = a.dataset.editProduct; });
const threshold = () => { try { return Number(localStorage.getItem('mohor:admin:low') ?? 3); } catch { return 3; } };

const productTotal = p => {
  if (p.variantStock && typeof p.variantStock === 'object' && Object.keys(p.variantStock).length) {
    return Object.values(p.variantStock).reduce((s, v) => s + (typeof v === 'object' ? Object.values(v).reduce((a, b) => a + Number(b || 0), 0) : Number(v || 0)), 0);
  }
  return Number(p.quantity || 0);
};

export async function render() {
  const view = freshView();
  loadingView(view);
  try { st.products = await api.get('/api/products?all=1'); } catch (error) { errorView(view, error, render); return; }
  st.selected.clear(); st.order = st.products.map(p => p.id); st.saved = [...st.order];
  if (pendingEdit) { const p = st.products.find(x => x.id === pendingEdit); pendingEdit = ''; if (p) { editor(view, p); return; } }
  listView(view);
}

function listView(view) {
  view.onclick = null;
  mount(view, html`
    <div class="adm-toolbar">
      <input class="input" type="search" data-q placeholder="${t('admSearch')}" value="${st.q}" aria-label="${t('admSearch')}">
      <select class="select" data-status aria-label="${t('admStatus')}"><option value="">${t('admAllStatus')}</option>
        ${PRODUCT_STATUSES.map(s => html`<option value="${s}" ${st.status === s ? 'selected' : ''}>${pStatusLabel(s)}</option>`)}</select>
      <label class="adm-date"><span>${t('admLowThreshold')}</span><input class="input adm-num" type="number" min="0" data-threshold value="${threshold()}"></label>
      <button class="btn btn-primary btn-sm" type="button" data-new>${icon('plus', 16)} ${t('admNewProduct')}</button>
    </div>
    <details class="panel adm-store-sale"><summary>${t('admStorewide')}</summary>
      <div class="adm-toolbar"><input class="input adm-num" type="number" min="1" max="90" data-sw-pct placeholder="%" aria-label="%">
        <button class="btn btn-primary btn-sm" type="button" data-sw-apply>${t('admApply')}</button>
        <button class="btn btn-ghost btn-sm" type="button" data-sw-reset>${t('admResetAll')}</button></div>
    </details>
    <div class="adm-orderbar" hidden><span>${t('admSaveOrder')}?</span>
      <button class="btn btn-primary btn-sm" type="button" data-save-order>${t('admSaveOrder')}</button>
      <button class="btn btn-ghost btn-sm" type="button" data-undo-order>${t('admUndo')}</button></div>
    <div class="adm-bulk" hidden><strong data-count></strong>
      <input class="input adm-num" type="number" min="1" max="90" data-bulk-pct placeholder="${t('admBulkDiscount')}" aria-label="${t('admBulkDiscount')}">
      <button class="btn btn-ghost btn-sm" type="button" data-bulk="discount">${t('admApply')} %</button>
      <button class="btn btn-ghost btn-sm" type="button" data-bulk="clear-discount">${t('admClearDiscount')}</button>
      <select class="select" data-bulk-status aria-label="${t('admStatus')}"><option value="">${t('admSetStatus')}</option>${PRODUCT_STATUSES.map(s => html`<option value="${s}">${pStatusLabel(s)}</option>`)}</select>
      <button class="btn btn-danger btn-sm" type="button" data-bulk="delete">${icon('trash', 16)} ${t('admDelete')}</button>
    </div>
    <div data-list></div>`);
  drawList(view);
  $('[data-q]', view).addEventListener('input', debounce(e => { st.q = e.target.value.trim().toLowerCase(); drawList(view); }, 200));
  $('[data-status]', view).addEventListener('change', e => { st.status = e.target.value; drawList(view); });
  $('[data-threshold]', view).addEventListener('input', e => { try { localStorage.setItem('mohor:admin:low', String(Math.max(0, Number(e.target.value) || 0))); } catch { /* */ } drawList(view); });
  $('[data-new]', view).addEventListener('click', () => editor(view, null));
  $('[data-bulk-status]', view).addEventListener('change', e => { if (e.target.value) bulk(view, 'status', e.target.value); });
  on(view, 'click', '[data-bulk]', (e, b) => {
    const action = b.dataset.bulk;
    if (action === 'discount') { const v = Number($('[data-bulk-pct]', view).value); if (!(v >= 1 && v <= 90)) { toast('1–90%', { type: 'error' }); return; } bulk(view, action, v, b); }
    else bulk(view, action, undefined, b);
  });
  on(view, 'change', '[data-pick]', (e, cb) => { cb.checked ? st.selected.add(cb.dataset.pick) : st.selected.delete(cb.dataset.pick); bulkBar(view); });
  on(view, 'change', '[data-pick-all]', (e, cb) => { $$('[data-pick]', view).forEach(x => { x.checked = cb.checked; cb.checked ? st.selected.add(x.dataset.pick) : st.selected.delete(x.dataset.pick); }); bulkBar(view); });
  on(view, 'click', '[data-edit]', (e, b) => editor(view, st.products.find(p => p.id === b.dataset.edit)));
  on(view, 'click', '[data-dup]', (e, b) => duplicate(st.products.find(p => p.id === b.dataset.dup), b));
  on(view, 'click', '[data-del]', async (e, b) => {
    if (!(await ask(t('admDeleteQ')))) return;
    try { await api.del(`/api/products?id=${encodeURIComponent(b.dataset.del)}`); toast(t('admDeleted'), { type: 'success' }); render(); } catch (error) { fail(error); }
  });
  on(view, 'click', '[data-move]', (e, b) => {
    const i = st.order.indexOf(b.dataset.id); const j = i + Number(b.dataset.move);
    if (i < 0 || j < 0 || j >= st.order.length) return;
    [st.order[i], st.order[j]] = [st.order[j], st.order[i]];
    drawList(view);
  });
  on(view, 'click', '[data-undo-order]', () => { st.order = [...st.saved]; drawList(view); });
  on(view, 'click', '[data-save-order]', async (e, b) => {
    const restore = busy(b);
    try { await api.post('/api/admin/products/bulk', { ids: st.order, action: 'reorder' }); toast(t('admSaved'), { type: 'success' }); render(); } catch (error) { restore(); fail(error); }
  });
  on(view, 'click', '[data-sw-apply]', async (e, b) => {
    const pct = Number($('[data-sw-pct]', view).value);
    if (!(pct >= 1 && pct <= 90)) { toast('1–90%', { type: 'error' }); return; }
    if (!(await ask(t('admStorewideQ', { n: pct }), false, t('admApply')))) return;
    const restore = busy(b);
    try {
      await api.post('/api/admin/products/bulk', { ids: st.products.map(p => p.id), action: 'discount', value: pct });
      await api.put('/api/settings', { saleActive: true, discountPercent: pct });
      toast(t('admUpdated'), { type: 'success' }); render();
    } catch (error) { restore(); fail(error); }
  });
  on(view, 'click', '[data-sw-reset]', async (e, b) => {
    if (!(await ask(t('admResetAllQ'), false, t('admApply')))) return;
    const restore = busy(b);
    try {
      await api.post('/api/admin/products/bulk', { ids: st.products.map(p => p.id), action: 'clear-discount' });
      await api.put('/api/settings', { saleActive: false, bannerText: '', bannerBadge: '', saleEndTime: '', discountPercent: 0 });
      toast(t('admUpdated'), { type: 'success' }); render();
    } catch (error) { restore(); fail(error); }
  });
}

async function bulk(view, action, value, button) {
  const ids = [...st.selected];
  if (!ids.length) return;
  if (action === 'delete' && !(await ask(t('admDeleteManyQ', { n: ids.length })))) return;
  const restore = busy(button);
  try { await api.post('/api/admin/products/bulk', { ids, action, value }); toast(t('admUpdated'), { type: 'success' }); render(); }
  catch (error) { restore(); fail(error); }
}

function bulkBar(view) {
  const bar = $('.adm-bulk', view); bar.hidden = !st.selected.size;
  $('[data-count]', bar).textContent = t('admSelected', { n: number(st.selected.size) });
}

function drawList(view) {
  const low = threshold();
  const byId = new Map(st.products.map(p => [p.id, p]));
  const list = st.order.map(id => byId.get(id)).filter(Boolean).filter(p =>
    (!st.status || p.status === st.status) &&
    (!st.q || [p.id, p.title?.en, p.title?.bn, p.category, ...(p.seoKeywords || [])].some(v => String(v || '').toLowerCase().includes(st.q))));
  $('.adm-orderbar', view).hidden = st.order.join() === st.saved.join();
  mount($('[data-list]', view), list.length ? html`
    <label class="check adm-pick-all"><input type="checkbox" data-pick-all> <span>${t('all')} (${number(list.length)})</span></label>
    <ul class="adm-cards">${list.map(p => { const q = productTotal(p); return html`
      <li class="adm-row adm-prow">
        <input type="checkbox" class="adm-pick" data-pick="${p.id}" aria-label="${title(p)}" ${st.selected.has(p.id) ? 'checked' : ''}>
        <img class="adm-thumb" src="${safeUrl(p.thumbnail || p.images?.[0], '/assets/image-placeholder.svg')}" alt="" width="56" height="70" loading="lazy">
        <div class="adm-row-main">
          <div class="adm-row-top"><strong>${title(p)}</strong>${p.featured ? html`<span class="badge badge-soft">★ ${t('admFeatured')}</span>` : ''}</div>
          <div><strong>${money(p.price)}</strong> ${p.originalPrice > p.price ? html`<s class="muted">${money(p.originalPrice)}</s>` : ''} <span class="muted">· ${p.category || '—'}</span></div>
          <div class="adm-small"><span class="badge ${q <= 0 ? 'badge-sale' : q <= low ? 'badge-soft' : 'badge-ok'}">${t('admQuantity')}: ${number(q)}</span>
            <span class="badge ${p.status === 'active' ? 'badge-ok' : 'badge-ink'}">${pStatusLabel(p.status)}</span></div>
        </div>
        <div class="adm-row-side adm-actions">
          <button class="icon-btn" type="button" data-move="-1" data-id="${p.id}" aria-label="${t('admMoveUp')}">${icon('chevronDown', 18, 'adm-flip')}</button>
          <button class="icon-btn" type="button" data-move="1" data-id="${p.id}" aria-label="${t('admMoveDown')}">${icon('chevronDown', 18)}</button>
          <button class="icon-btn" type="button" data-edit="${p.id}" aria-label="${t('admEdit')}">${icon('edit', 18)}</button>
          <button class="icon-btn" type="button" data-dup="${p.id}" aria-label="${t('admDuplicate')}">${icon('copy', 18)}</button>
          <button class="icon-btn" type="button" data-del="${p.id}" aria-label="${t('admDelete')}">${icon('trash', 18)}</button>
        </div>
      </li>`; })}</ul>` : html`<div class="empty"><h3 class="empty-title">${t('admNone')}</h3></div>`);
  bulkBar(view);
}

async function duplicate(p, button) {
  if (!p) return;
  const restore = busy(button, '');
  const { id, createdAt, updatedAt, salePrice, regularPrice, onSale, ...rest } = p;
  try {
    await api.post('/api/products', { ...rest, title: { en: `${t('admCopyOf')} ${p.title?.en || ''}`.trim(), bn: p.title?.bn || '' }, status: 'draft' });
    toast(t('admSaved'), { type: 'success' }); render();
  } catch (error) { restore(); fail(error); }
}

// ---- Editor ------------------------------------------------------------------

const i18nList = v => (Array.isArray(v) ? { en: v, bn: [] } : { en: v?.en || [], bn: v?.bn || [] });
const both = v => (v && typeof v === 'object' ? { en: v.en || '', bn: v.bn || '' } : { en: v || '', bn: v || '' });

function toDraft(p) {
  p = p || {};
  const rawColors = Array.isArray(p.colors) ? p.colors : (p.colors?.en || []);
  const bnColors = Array.isArray(p.colors) ? [] : (p.colors?.bn || []);
  const sizes = (p.sizes?.length ? p.sizes : ['Standard']).map(String);
  const vs = p.variantStock && typeof p.variantStock === 'object' ? p.variantStock : {};
  const colors = rawColors.map((c, i) => {
    const en = typeof c === 'string' ? c : (c?.name?.en || c?.name || '');
    const bn = typeof c === 'string' ? (bnColors[i] || '') : (c?.name?.bn || '');
    const stock = {};
    for (const s of sizes) stock[s] = Number(vs[`${en}::${s}`] ?? vs[en]?.[s] ?? 0);
    return { en, bn, hex: (typeof c === 'object' && c?.hex) || '#8a2a3d', stock };
  });
  const sizeQty = {};
  for (const s of sizes) sizeQty[s] = Number(p.sizeQuantities?.[s] ?? (sizes.length === 1 ? p.quantity : 0) ?? 0);
  const meas = {};
  for (const [k, v] of Object.entries(p.sizeMeasurements || {})) meas[k] = both(v);
  return {
    id: p.id || '', title: both(p.title), description: both(p.description), price: p.price || '', originalPrice: p.originalPrice || '',
    category: p.category || '', sizes, colors, sizeQty, meas, guide: both(p.measurementsGuide),
    details: i18nList(p.details), materials: i18nList(p.materials), care: i18nList(p.care),
    seo: (p.seoKeywords || []).join(', '), featured: Boolean(p.featured), status: p.status || 'active', displayOrder: p.displayOrder ?? 0,
    images: [...(p.images || [])], thumbnail: p.thumbnail || '',
  };
}

const lines = v => String(v || '').split('\n').map(s => s.trim()).filter(Boolean);

function collect(form, d) {
  const f = n => form.elements[n]?.value ?? '';
  d.title = { en: f('title_en').trim(), bn: f('title_bn').trim() };
  d.description = { en: f('desc_en'), bn: f('desc_bn') };
  d.price = f('price'); d.originalPrice = f('originalPrice'); d.category = f('category').trim().toLowerCase();
  d.guide = { en: f('guide_en'), bn: f('guide_bn') };
  for (const k of ['details', 'materials', 'care']) d[k] = { en: lines(f(`${k}_en`)), bn: lines(f(`${k}_bn`)) };
  d.seo = f('seo'); d.featured = form.elements.featured.checked; d.status = f('status'); d.displayOrder = f('displayOrder');
  const sizes = f('sizes').split(',').map(s => s.trim()).filter(Boolean);
  d.sizes = sizes.length ? [...new Set(sizes)] : ['Standard'];
  $$('[data-color-row]', form).forEach(row => {
    const c = d.colors[Number(row.dataset.colorRow)];
    if (!c) return;
    c.en = $('.c-en', row).value.trim(); c.bn = $('.c-bn', row).value.trim(); c.hex = $('.c-hex', row).value;
  });
  $$('[data-stock]', form).forEach(inp => {
    const [ci, size] = [inp.dataset.stock, inp.dataset.size];
    const n = Math.max(0, Math.floor(Number(inp.value) || 0));
    if (ci === 'x') d.sizeQty[size] = n; else if (d.colors[Number(ci)]) d.colors[Number(ci)].stock[size] = n;
  });
  $$('[data-meas]', form).forEach(inp => { (d.meas[inp.dataset.meas] ||= { en: '', bn: '' })[inp.dataset.lang] = inp.value; });
}

function payload(d) {
  const variantStock = {};
  if (d.colors.length) for (const c of d.colors) for (const s of d.sizes) if (c.en) variantStock[`${c.en}::${s}`] = Number(c.stock[s] || 0);
  const sizeQuantities = Object.fromEntries(d.sizes.map(s => [s, Number(d.sizeQty[s] || 0)]));
  const out = {
    title: d.title, description: d.description, price: Number(d.price), originalPrice: Number(d.originalPrice) || 0, category: d.category,
    sizes: d.sizes, colors: d.colors.filter(c => c.en).map(c => ({ name: { en: c.en, bn: c.bn || c.en }, hex: c.hex })),
    variantStock, measurementsGuide: d.guide, details: d.details, materials: d.materials, care: d.care,
    sizeMeasurements: Object.fromEntries(d.sizes.filter(s => d.meas[s] && (d.meas[s].en || d.meas[s].bn)).map(s => [s, d.meas[s]])),
    seoKeywords: d.seo.split(',').map(s => s.trim()).filter(Boolean), featured: d.featured, status: d.status, displayOrder: Number(d.displayOrder) || 0,
    images: d.images, thumbnail: d.thumbnail && d.images.includes(d.thumbnail) ? d.thumbnail : (d.images[0] || ''),
  };
  if (!d.colors.length) { out.sizeQuantities = sizeQuantities; out.quantity = Object.values(sizeQuantities).reduce((a, b) => a + b, 0); }
  if (d.id) out.id = d.id;
  return out;
}

function editor(view, product) {
  const d = toDraft(product);
  dirty.value = false;
  view.onclick = null;
  const fresh = freshView();
  view = fresh;
  const draw = () => {
    const total = d.colors.length ? d.colors.reduce((s, c) => s + d.sizes.reduce((a, z) => a + Number(c.stock[z] || 0), 0), 0) : d.sizes.reduce((a, z) => a + Number(d.sizeQty[z] || 0), 0);
    mount(view, html`
    <form class="adm-editor" novalidate>
      <div class="adm-editor-head">
        <button class="btn btn-ghost btn-sm" type="button" data-back>${icon('chevronLeft', 16)} ${t('back')}</button>
        <h2 class="adm-h2">${d.id ? title({ title: d.title }) : t('admNewProduct')}</h2>
      </div>
      <section class="panel form-grid cols-2">
        <label class="field"><span>${t('admTitleEn')} *</span><input class="input" name="title_en" required value="${d.title.en}"></label>
        <label class="field"><span>${t('admTitleBn')}</span><input class="input" name="title_bn" lang="bn" value="${d.title.bn}"></label>
        <label class="field"><span>${t('admDescEn')}</span><textarea class="textarea" name="desc_en" rows="5">${d.description.en}</textarea></label>
        <label class="field"><span>${t('admDescBn')}</span><textarea class="textarea" name="desc_bn" lang="bn" rows="5">${d.description.bn}</textarea></label>
        <label class="field"><span>${t('admPrice')} (৳) *</span><input class="input" name="price" type="number" min="0" inputmode="numeric" required value="${d.price}"></label>
        <label class="field"><span>${t('admOriginal')}</span><input class="input" name="originalPrice" type="number" min="0" inputmode="numeric" value="${d.originalPrice}"></label>
        <label class="field"><span>${t('admCategory')}</span><input class="input" name="category" list="adm-cats" value="${d.category}">
          <datalist id="adm-cats">${CATEGORIES.map(c => html`<option value="${c.key}">${c.label()}</option>`)}</datalist></label>
        <label class="field"><span>${t('admStatus')}</span><select class="select" name="status">${PRODUCT_STATUSES.map(s => html`<option value="${s}" ${d.status === s ? 'selected' : ''}>${pStatusLabel(s)}</option>`)}</select></label>
        <label class="field"><span>${t('admOrderNo')}</span><input class="input" name="displayOrder" type="number" value="${d.displayOrder}"></label>
        <label class="check adm-check-pad"><input type="checkbox" name="featured" ${d.featured ? 'checked' : ''}> <span>${t('admFeatured')}</span></label>
      </section>

      <section class="panel stack">
        <h3 class="panel-title">${t('admImages')}</h3>
        <ul class="adm-images">${d.images.map((src, i) => html`
          <li class="${d.thumbnail === src || (!d.thumbnail && i === 0) ? 'is-thumb' : ''}">
            <img src="${safeUrl(src, '/assets/image-placeholder.svg')}" alt="" loading="lazy">
            ${d.thumbnail === src || (!d.thumbnail && i === 0) ? html`<span class="badge badge-ink adm-thumb-badge">${t('admThumb')}</span>` : ''}
            <div class="adm-img-tools">
              <button class="icon-btn" type="button" data-img-move="-1" data-i="${i}" aria-label="${t('admLeftMove')}">${icon('chevronLeft', 16)}</button>
              <button class="icon-btn" type="button" data-img-thumb="${i}" aria-label="${t('admMakeThumb')}">${icon('check', 16)}</button>
              <button class="icon-btn" type="button" data-img-del="${i}" aria-label="${t('admDelete')}">${icon('trash', 16)}</button>
              <button class="icon-btn" type="button" data-img-move="1" data-i="${i}" aria-label="${t('admRightMove')}">${icon('chevronRight', 16)}</button>
            </div></li>`)}</ul>
        <div class="adm-toolbar">
          <label class="btn btn-ghost btn-sm adm-file">${icon('plus', 16)} <span data-upl-label>${t('admUpload')}</span><input type="file" accept="image/*" multiple data-upload></label>
          <input class="input" type="url" data-img-url placeholder="${t('admImageUrl')}" aria-label="${t('admImageUrl')}">
          <button class="btn btn-ghost btn-sm" type="button" data-img-add>${t('admAdd')}</button>
        </div>
      </section>

      <section class="panel stack">
        <h3 class="panel-title">${t('admColors')}</h3>
        ${d.colors.map((c, i) => html`<div class="adm-color-row" data-color-row="${i}">
          <input class="c-hex" type="color" value="${/^#[0-9a-f]{6}$/i.test(c.hex) ? c.hex : '#8a2a3d'}" aria-label="hex">
          <input class="input c-en" placeholder="${t('admColorEn')}" aria-label="${t('admColorEn')}" value="${c.en}">
          <input class="input c-bn" lang="bn" placeholder="${t('admColorBn')}" aria-label="${t('admColorBn')}" value="${c.bn}">
          <button class="icon-btn" type="button" data-color-del="${i}" aria-label="${t('admDelete')}">${icon('trash', 16)}</button></div>`)}
        <button class="btn btn-ghost btn-sm" type="button" data-color-add>${icon('plus', 16)} ${t('admAddColor')}</button>
        <label class="field"><span>${t('admSizes')}</span><input class="input" name="sizes" data-sizes value="${d.sizes.join(', ')}"></label>
        <h3 class="panel-title">${t('admStock')}</h3>
        <div class="adm-grid-wrap"><table class="adm-stock">
          <thead><tr><th></th>${d.sizes.map(s => html`<th>${s}</th>`)}</tr></thead>
          <tbody>${d.colors.length ? d.colors.map((c, i) => html`<tr><th><span class="adm-swatch" style="background:${/^#[0-9a-f]{3,8}$/i.test(c.hex) ? c.hex : 'transparent'}"></span>${c.en || '—'}</th>
            ${d.sizes.map(s => html`<td><input class="input adm-num" type="number" min="0" inputmode="numeric" data-stock="${i}" data-size="${s}" value="${c.stock[s] ?? 0}" aria-label="${c.en} ${s}"></td>`)}</tr>`)
            : html`<tr><th>${t('admQuantity')}</th>${d.sizes.map(s => html`<td><input class="input adm-num" type="number" min="0" inputmode="numeric" data-stock="x" data-size="${s}" value="${d.sizeQty[s] ?? 0}" aria-label="${s}"></td>`)}</tr>`}</tbody>
        </table></div>
        <p class="muted adm-small" data-total>${t('admStockTotal', { n: number(total) })}</p>
      </section>

      <section class="panel stack">
        <h3 class="panel-title">${t('admMeasure')}</h3>
        ${d.sizes.map(s => html`<div class="adm-meas"><strong>${s}</strong>
          <input class="input" data-meas="${s}" data-lang="en" placeholder="EN — e.g. Bust 38in, Length 44in" value="${d.meas[s]?.en || ''}" aria-label="${s} EN">
          <input class="input" data-meas="${s}" data-lang="bn" lang="bn" placeholder="BN" value="${d.meas[s]?.bn || ''}" aria-label="${s} BN"></div>`)}
        <div class="form-grid cols-2">
          <label class="field"><span>${t('admGuideEn')}</span><textarea class="textarea" name="guide_en" rows="3">${d.guide.en}</textarea></label>
          <label class="field"><span>${t('admGuideBn')}</span><textarea class="textarea" name="guide_bn" lang="bn" rows="3">${d.guide.bn}</textarea></label>
        </div>
      </section>

      <section class="panel form-grid cols-2">
        ${['details', 'materials', 'care'].map(k => html`
          <label class="field"><span>${t('adm' + k[0].toUpperCase() + k.slice(1))} (EN)</span><textarea class="textarea" name="${k}_en" rows="3" placeholder="${t('admOnePerLine')}">${d[k].en.join('\n')}</textarea></label>
          <label class="field"><span>${t('adm' + k[0].toUpperCase() + k.slice(1))} (BN)</span><textarea class="textarea" name="${k}_bn" lang="bn" rows="3" placeholder="${t('admOnePerLine')}">${d[k].bn.join('\n')}</textarea></label>`)}
        <label class="field span-2"><span>${t('admSeo')}</span><input class="input" name="seo" value="${d.seo}"></label>
      </section>

      <div class="adm-savebar">
        <button class="btn btn-ghost" type="button" data-back>${t('admCancel')}</button>
        <button class="btn btn-primary" type="submit">${t('admSave')}</button>
      </div>
    </form>`);
  };
  draw();
  const form = () => $('form', view);
  const structural = fn => { collect(form(), d); fn(); dirty.value = true; draw(); };
  view.addEventListener('input', e => {
    dirty.value = true;
    if (e.target.matches('[data-stock]')) {
      collect(form(), d);
      const total = d.colors.length ? d.colors.reduce((s, c) => s + d.sizes.reduce((a, z) => a + Number(c.stock[z] || 0), 0), 0) : d.sizes.reduce((a, z) => a + Number(d.sizeQty[z] || 0), 0);
      $('[data-total]', view).textContent = t('admStockTotal', { n: number(total) });
    }
  });
  view.addEventListener('change', e => {
    if (e.target.matches('[data-sizes], .c-en, .c-hex')) structural(() => {});
    if (e.target.matches('[data-upload]')) upload(e.target);
  });
  view.addEventListener('click', async e => {
    const el = e.target.closest('button');
    if (!el || !view.contains(el)) return;
    if (el.matches('[data-back]')) { if (await leaveOk()) { dirty.value = false; render(); } }
    else if (el.matches('[data-color-add]')) structural(() => d.colors.push({ en: '', bn: '', hex: '#8a2a3d', stock: {} }));
    else if (el.dataset.colorDel !== undefined) structural(() => d.colors.splice(Number(el.dataset.colorDel), 1));
    else if (el.dataset.imgMove) structural(() => { const i = Number(el.dataset.i), j = i + Number(el.dataset.imgMove); if (j >= 0 && j < d.images.length) [d.images[i], d.images[j]] = [d.images[j], d.images[i]]; });
    else if (el.dataset.imgThumb !== undefined) structural(() => { d.thumbnail = d.images[Number(el.dataset.imgThumb)]; });
    else if (el.dataset.imgDel !== undefined) structural(() => { const [gone] = d.images.splice(Number(el.dataset.imgDel), 1); if (d.thumbnail === gone) d.thumbnail = ''; });
    else if (el.matches('[data-img-add]')) {
      const url = safeUrl($('[data-img-url]', view).value);
      if (!/^https?:|^\//.test(url)) { toast('URL?', { type: 'error' }); return; }
      structural(() => d.images.push(url));
    }
  });
  async function upload(input) {
    const files = [...input.files];
    if (!files.length) return;
    collect(form(), d);
    const label = $('[data-upl-label]', view); label.textContent = t('admUploading');
    input.disabled = true;
    const base = (d.title.en || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    for (const file of files) {
      try { d.images.push(await uploadImage(file, base)); } catch (error) { fail(error); }
    }
    dirty.value = true; draw();
  }
  view.addEventListener('submit', async e => {
    e.preventDefault();
    collect(form(), d);
    if (!d.title.en || !(Number(d.price) > 0)) { toast(t('admRequired'), { type: 'error' }); form().elements[d.title.en ? 'price' : 'title_en'].focus(); return; }
    const restore = busy($('[type=submit]', view), t('admSave'));
    try {
      const body = payload(d);
      d.id ? await api.put('/api/products', body) : await api.post('/api/products', body);
      dirty.value = false; toast(t('admSaved'), { type: 'success' }); render();
    } catch (error) { restore(); fail(error); }
  });
}
