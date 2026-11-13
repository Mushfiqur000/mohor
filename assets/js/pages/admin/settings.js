import { html, mount, $, $$ } from '/assets/js/core/dom.js';
import { t, extend } from '/assets/js/core/i18n.js';
import { api } from '/assets/js/core/api.js';
import { toast, busy } from '/assets/js/core/ui.js';
import { uploadImage } from './upload.js';
import { loadCategories } from '/assets/js/core/catalog.js';
import { fail, dirty, loadingView, errorView, freshView } from './shared.js';

extend({
  en: {
    admCategories: 'Store categories', admCategoryKey: 'Key / slug', admCategoryNameEn: 'Name (English)',
    admCategoryNameBn: 'Name (বাংলা)', admCategoryHintEn: 'Short description (English)', admCategoryHintBn: 'Short description (বাংলা)',
    admCategoryOrder: 'Order', admAddCategory: 'Add category', admRemoveCategory: 'Remove category',
    admCategoryImage: 'Category thumbnail', admCategoryImageUrl: 'Image URL (optional)', admCategoryUpload: 'Upload thumbnail',
    admCategoryHint: 'Categories appear in the storefront, filters, footer, and product editor. Edit a built-in category using its existing key. On sale remains automatic.', active: 'Active',
  },
  bn: {
    admCategories: 'স্টোর ক্যাটাগরি', admCategoryKey: 'কী / স্লাগ', admCategoryNameEn: 'নাম (ইংরেজি)',
    admCategoryNameBn: 'নাম (বাংলা)', admCategoryHintEn: 'সংক্ষিপ্ত বর্ণনা (ইংরেজি)', admCategoryHintBn: 'সংক্ষিপ্ত বর্ণনা (বাংলা)',
    admCategoryOrder: 'ক্রম', admAddCategory: 'ক্যাটাগরি যোগ করুন', admRemoveCategory: 'ক্যাটাগরি সরান',
    admCategoryImage: 'ক্যাটাগরির থাম্বনেইল', admCategoryImageUrl: 'ছবির URL (ঐচ্ছিক)', admCategoryUpload: 'থাম্বনেইল আপলোড',
    admCategoryHint: 'ক্যাটাগরি storefront, filter, footer এবং product editor-এ দেখাবে। বিল্ট-ইন ক্যাটাগরি বদলাতে একই key ব্যবহার করুন। On sale স্বয়ংক্রিয় থাকবে।', active: 'চালু',
  },
});

// datetime-local works in local time; the stored value is ISO.
const toLocal = iso => { const ms = Date.parse(iso || ''); if (!ms) return ''; const d = new Date(ms - new Date().getTimezoneOffset() * 6e4); return d.toISOString().slice(0, 16); };
const BUILTIN_CATEGORY_ROWS = [
  { key: 'three-piece', name: { en: 'Three-piece', bn: 'থ্রি-পিস' }, hint: { en: 'Soft cotton sets', bn: 'নরম সুতির সেট' }, displayOrder: 1, active: true },
  { key: 'kurti', name: { en: 'Kurti', bn: 'কুর্তি' }, hint: { en: 'Everyday & office wear', bn: 'প্রতিদিন ও অফিসের জন্য' }, displayOrder: 3, active: true },
  { key: 'khadi', name: { en: 'Khadi', bn: 'খাদি' }, hint: { en: 'Handwoven, breathable', bn: 'হাতে বোনা, আরামদায়ক' }, displayOrder: 4, active: true },
  { key: 'saree', name: { en: 'Saree', bn: 'শাড়ি' }, hint: { en: 'For the occasions', bn: 'বিশেষ দিনের জন্য' }, displayOrder: 5, active: true },
];
const categoryRow = category => html`
  <div class="adm-category-row" data-category-row>
    <label class="field"><span>${t('admCategoryKey')}</span><input class="input" data-cat-key value="${category.key || ''}" placeholder="winter-wear"></label>
    <label class="field"><span>${t('admCategoryNameEn')}</span><input class="input" data-cat-name-en value="${category.name?.en || ''}" required></label>
    <label class="field"><span>${t('admCategoryNameBn')}</span><input class="input" data-cat-name-bn lang="bn" value="${category.name?.bn || ''}"></label>
    <label class="field"><span>${t('admCategoryHintEn')}</span><input class="input" data-cat-hint-en value="${category.hint?.en || ''}"></label>
    <label class="field"><span>${t('admCategoryHintBn')}</span><input class="input" data-cat-hint-bn lang="bn" value="${category.hint?.bn || ''}"></label>
    <label class="field"><span>${t('admCategoryOrder')}</span><input class="input adm-num" type="number" min="0" data-cat-order value="${Number(category.displayOrder || 0)}"></label>
    <div class="adm-category-image">
      <span class="field-label">${t('admCategoryImage')}</span>
      <img data-cat-preview src="${category.imageUrl || '/assets/image-placeholder.svg'}" alt="" loading="lazy">
      <label class="btn btn-ghost btn-sm adm-file">${t('admCategoryUpload')}<input type="file" accept="image/*" data-cat-upload></label>
      <input class="input" data-cat-image value="${category.imageUrl || ''}" placeholder="${t('admCategoryImageUrl')}" aria-label="${t('admCategoryImageUrl')}">
    </div>
    <label class="check"><input type="checkbox" data-cat-active ${category.active !== false ? 'checked' : ''}> <span>${t('active')}</span></label>
    <button class="btn btn-ghost btn-sm" type="button" data-cat-remove>${t('admRemoveCategory')}</button>
  </div>`;

export async function render() {
  const view = freshView();
  loadingView(view);
  let s;
  try { s = await api.get(`/api/settings?adminFresh=${Date.now()}`); } catch (error) { errorView(view, error, render); return; }
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
      <section class="panel stack"><h3 class="panel-title">${t('admCategories')}</h3>
        <p class="muted adm-small">${t('admCategoryHint')}</p>
        <div class="adm-category-list" data-categories>${(() => {
          const configured = Array.isArray(s.categories) ? s.categories : [];
          const configuredKeys = new Set(configured.map(category => category.key));
          return [...BUILTIN_CATEGORY_ROWS.filter(category => !configuredKeys.has(category.key)), ...configured]
            .sort((a, b) => Number(a.displayOrder || 999) - Number(b.displayOrder || 999))
            .map(categoryRow);
        })()}</div>
        <button class="btn btn-ghost btn-sm" type="button" data-cat-add>${t('admAddCategory')}</button>
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
  $('[data-cat-add]', view).addEventListener('click', () => {
    $('[data-categories]', view).insertAdjacentHTML('beforeend', String(categoryRow({ active: true })));
    dirty.value = true;
  });
  view.addEventListener('click', e => {
    if (e.target.closest('[data-cat-remove]')) {
      e.target.closest('[data-category-row]')?.remove();
      dirty.value = true;
    }
  });
  view.addEventListener('change', async e => {
    const input = e.target.closest('[data-cat-upload]');
    if (!input?.files?.[0]) return;
    const row = input.closest('[data-category-row]');
    const label = input.closest('.adm-file');
    const restore = busy(label);
    try {
      const key = $('[data-cat-key]', row).value || 'category';
      const url = await uploadImage(input.files[0], `category-${key}`);
      $('[data-cat-image]', row).value = url;
      $('[data-cat-preview]', row).src = url;
      dirty.value = true;
    } catch (error) { fail(error); }
    restore();
    input.value = '';
  });
  $('[data-telegram]', view).addEventListener('click', async e => {
    const restore = busy(e.currentTarget);
    try { await api.post('/api/admin/telegram-test', {}); toast(t('admTelegramOk'), { type: 'success' }); } catch (error) { fail(error); }
    restore();
  });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const f = form.elements;
    const n = k => Math.max(0, Number(f[k].value) || 0);
    const slug = value => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
    const categories = $$('[data-category-row]', form).map(row => ({
      key: slug($('[data-cat-key]', row).value),
      name: { en: $('[data-cat-name-en]', row).value.trim(), bn: $('[data-cat-name-bn]', row).value.trim() },
      hint: { en: $('[data-cat-hint-en]', row).value.trim(), bn: $('[data-cat-hint-bn]', row).value.trim() },
      imageUrl: $('[data-cat-image]', row).value.trim(),
      active: $('[data-cat-active]', row).checked,
      displayOrder: Math.max(0, Number($('[data-cat-order]', row).value) || 0),
    })).filter(category => category.key && category.name.en);
    const body = {
      deliveryInside: n('deliveryInside'), deliveryOutside: n('deliveryOutside'), freeDeliveryThreshold: n('freeDeliveryThreshold'),
      maxQtyPerItem: Math.max(1, n('maxQtyPerItem')), saleActive: f.saleActive.checked, discountPercent: Math.min(90, n('discountPercent')),
      saleEndTime: f.saleEndTime.value ? new Date(f.saleEndTime.value).toISOString() : '', bannerText: f.bannerText.value.trim(), bannerBadge: f.bannerBadge.value.trim(),
      whatsapp: f.whatsapp.value.replace(/\D/g, ''), phone: f.phone.value.trim(), email: f.email.value.trim(), announcement: f.announcement.value.trim(), categories,
    };
    const restore = busy($('[type=submit]', form));
    try { await api.put('/api/settings', body); await loadCategories({ fresh: true }); dirty.value = false; toast(t('admSaved'), { type: 'success' }); } catch (error) { fail(error); }
    restore();
  });
}
