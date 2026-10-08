// Shop: search, sort, filters (sidebar ≥ 900px, bottom sheet on mobile),
// active chips, grid/rows view, load-more. All state lives in the URL.

import { boot } from '/assets/js/core/layout.js';
import { html, mount, $, on, debounce } from '/assets/js/core/dom.js';
import { t, extend, onLangChange } from '/assets/js/core/i18n.js';
import { loadProducts, pricing, inStock, colorsOf, matches, categoryLabel, CATEGORIES } from '/assets/js/core/catalog.js';
import { renderGrid, bindCards } from '/assets/js/core/cards.js';
import { icon, sheet, skeletonCards, emptyState } from '/assets/js/core/ui.js';
import { money, number } from '/assets/js/core/format.js';
import { track } from '/assets/js/core/analytics.js';

extend({
  en: {
    shopEyebrow: 'Est. in Sylhet', shopTitleA: 'The', shopTitleB: 'collection',
    shopLede: 'Handcrafted three-piece sets, kurtis and khadi wear — cut and stitched in small batches.',
    sortLabel: 'Sort', sortFeatured: 'Featured', sortNewest: 'Newest', sortPriceAsc: 'Price: low to high',
    sortPriceDesc: 'Price: high to low', sortDiscount: 'Biggest discount',
    filters: 'Filters', filterCategory: 'Category', filterPrice: 'Price', filterSize: 'Size', filterColor: 'Colour',
    filterAvailability: 'Availability', filterInStock: 'In stock only', filterOnSale: 'On sale',
    priceMin: 'Min ৳', priceMax: 'Max ৳', priceUnder: 'Under ৳1,500', priceMid: '৳1,500 – ৳2,500', priceOver: 'Above ৳2,500',
    clearAll: 'Clear all', showResults: 'Show {n} results', results: '{n} pieces', resultsOne: '1 piece',
    viewGrid: 'Grid view', viewRows: 'Large view', loadMore: 'Load more', showing: 'Showing {a} of {b}',
    noResults: 'Nothing matches those filters', noResultsText: 'Try removing a filter or searching for something else.',
    searchShop: 'Search the collection', removeFilter: 'Remove filter: {x}', inStockChip: 'In stock', saleChip: 'On sale',
  },
  bn: {
    shopEyebrow: 'সিলেটে প্রতিষ্ঠিত', shopTitleA: 'আমাদের', shopTitleB: 'কালেকশন',
    shopLede: 'হাতে তৈরি থ্রি-পিস, কুর্তি ও খাদি — অল্প পরিমাণে কাটা ও সেলাই করা।',
    sortLabel: 'সাজান', sortFeatured: 'বাছাই করা', sortNewest: 'নতুন আগে', sortPriceAsc: 'দাম: কম থেকে বেশি',
    sortPriceDesc: 'দাম: বেশি থেকে কম', sortDiscount: 'সবচেয়ে বেশি ছাড়',
    filters: 'ফিল্টার', filterCategory: 'ক্যাটাগরি', filterPrice: 'দাম', filterSize: 'সাইজ', filterColor: 'রং',
    filterAvailability: 'প্রাপ্যতা', filterInStock: 'শুধু স্টকে আছে', filterOnSale: 'সেলে আছে',
    priceMin: 'সর্বনিম্ন ৳', priceMax: 'সর্বোচ্চ ৳', priceUnder: '৳১,৫০০-এর নিচে', priceMid: '৳১,৫০০ – ৳২,৫০০', priceOver: '৳২,৫০০-এর বেশি',
    clearAll: 'সব মুছুন', showResults: '{n}টি ফলাফল দেখুন', results: '{n}টি পণ্য', resultsOne: '১টি পণ্য',
    viewGrid: 'গ্রিড ভিউ', viewRows: 'বড় ভিউ', loadMore: 'আরও দেখুন', showing: '{b}টির মধ্যে {a}টি',
    noResults: 'এই ফিল্টারে কিছু পাওয়া যায়নি', noResultsText: 'একটি ফিল্টার সরিয়ে দেখুন বা অন্য কিছু খুঁজুন।',
    searchShop: 'কালেকশনে খুঁজুন', removeFilter: 'ফিল্টার সরান: {x}', inStockChip: 'স্টকে আছে', saleChip: 'সেল',
  },
});

await boot({ page: 'shop' });

const PAGE = 12;
const SORTS = ['featured', 'newest', 'price-asc', 'price-desc', 'discount'];
const SORT_KEYS = { featured: 'sortFeatured', newest: 'sortNewest', 'price-asc': 'sortPriceAsc', 'price-desc': 'sortPriceDesc', discount: 'sortDiscount' };
const PRESETS = [{ key: 'priceUnder', min: '', max: '1499' }, { key: 'priceMid', min: '1500', max: '2500' }, { key: 'priceOver', min: '2501', max: '' }];

let products = [];
let status = 'loading';
let filterSheet = null;

/** @typedef {{ q: string, cat: string[], sort: string, min: string, max: string, size: string[], color: string[], stock: boolean, sale: boolean, view: string, page: number }} State */

/** @returns {State} */
function readState() {
  const p = new URLSearchParams(location.search);
  const list = key => p.getAll(key).flatMap(v => v.split(',')).map(v => v.trim()).filter(Boolean);
  const cat = [...list('cat'), ...list('category')];
  // Legacy ?category=on-sale / sort values.
  let sale = p.get('sale') === '1';
  const catClean = cat.filter(c => { if (c === 'on-sale') { sale = true; return false; } return true; });
  const legacySort = { 'low-high': 'price-asc', 'high-low': 'price-desc' }[p.get('sort') || ''];
  const sort = legacySort || (SORTS.includes(p.get('sort')) ? p.get('sort') : 'featured');
  let view = p.get('view') === 'rows' ? 'rows' : '';
  if (!view) { try { view = localStorage.getItem('mohor_view_mode') === 'list' ? 'rows' : 'grid'; } catch { view = 'grid'; } }
  return {
    q: (p.get('q') || '').slice(0, 80), cat: [...new Set(catClean)], sort,
    min: /^\d+$/.test(p.get('min') || '') ? p.get('min') : '', max: /^\d+$/.test(p.get('max') || '') ? p.get('max') : '',
    size: list('size'), color: list('color'), stock: p.get('stock') === '1', sale, view,
    page: Math.max(1, Math.min(50, parseInt(p.get('page') || '1', 10) || 1)),
  };
}

let state = readState();

function writeState(next, { replace = false } = {}) {
  state = { ...state, ...next };
  const p = new URLSearchParams();
  if (state.q) p.set('q', state.q);
  if (state.cat.length) p.set('cat', state.cat.join(','));
  if (state.sort !== 'featured') p.set('sort', state.sort);
  if (state.min) p.set('min', state.min);
  if (state.max) p.set('max', state.max);
  if (state.size.length) p.set('size', state.size.join(','));
  if (state.color.length) p.set('color', state.color.join(','));
  if (state.stock) p.set('stock', '1');
  if (state.sale) p.set('sale', '1');
  if (state.view === 'rows') p.set('view', 'rows');
  if (state.page > 1) p.set('page', String(state.page));
  const url = `${location.pathname}${p.toString() ? `?${p}` : ''}`;
  if (url !== location.pathname + location.search) history[replace ? 'replaceState' : 'pushState'](null, '', url);
  try { localStorage.setItem('mohor_view_mode', state.view === 'rows' ? 'list' : 'grid'); } catch { /* ignore */ }
  render();
}

addEventListener('popstate', () => { state = readState(); render(); renderToolbar(); });

// ---- Derived data ------------------------------------------------------------------

function facets() {
  const cats = new Map(CATEGORIES.map(c => [c.key, 0]));
  const sizes = new Map(); const colors = new Map();
  for (const p of products) {
    if (p.category) cats.set(p.category, (cats.get(p.category) || 0) + 1);
    for (const s of p.sizes || []) if (s !== 'Standard') sizes.set(s, (sizes.get(s) || 0) + 1);
    for (const c of colorsOf(p)) if (!colors.has(c.key)) colors.set(c.key, c);
  }
  const order = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL'];
  const rank = s => (order.indexOf(s) + 1) || (parseFloat(s) || 0) + 100;
  return {
    cats: [...cats].filter(([key, n]) => n || CATEGORIES.some(c => c.key === key) && !products.length).map(([key, n]) => ({ key, n })),
    sizes: [...sizes.keys()].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b)),
    colors: [...colors.values()],
  };
}

function filtered() {
  const min = state.min ? Number(state.min) : -Infinity;
  const max = state.max ? Number(state.max) : Infinity;
  const list = products.filter(p => {
    const pr = pricing(p);
    if (state.q && !matches(p, state.q)) return false;
    if (state.cat.length && !state.cat.includes(p.category)) return false;
    if (pr.price < min || pr.price > max) return false;
    if (state.size.length && !(p.sizes || []).some(s => state.size.includes(s))) return false;
    if (state.color.length && !colorsOf(p).some(c => state.color.includes(c.key))) return false;
    if (state.stock && !inStock(p)) return false;
    if (state.sale && !pr.onSale) return false;
    return true;
  });
  const by = {
    newest: (a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')),
    'price-asc': (a, b) => pricing(a).price - pricing(b).price,
    'price-desc': (a, b) => pricing(b).price - pricing(a).price,
    discount: (a, b) => pricing(b).percent - pricing(a).percent,
    featured: (a, b) => Number(inStock(b)) - Number(inStock(a)) || Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || (a.displayOrder || 0) - (b.displayOrder || 0),
  }[state.sort];
  return list.map((p, i) => [p, i]).sort((x, y) => by(x[0], y[0]) || x[1] - y[1]).map(x => x[0]);
}

const activeCount = () => state.cat.length + state.size.length + state.color.length + (state.min || state.max ? 1 : 0) + (state.stock ? 1 : 0) + (state.sale ? 1 : 0);

// ---- Rendering ----------------------------------------------------------------------

function filtersMarkup(idPrefix) {
  const f = facets();
  const box = (name, value, checked, label, extra = '') => html`<label class="check"><input type="checkbox" data-f="${name}" value="${value}" ${checked ? 'checked' : ''}><span>${label}</span>${extra ? html`<small class="muted">${extra}</small>` : ''}</label>`;
  return html`
    <form class="filters" data-filters novalidate>
      <fieldset class="filter-group"><legend>${t('filterCategory')}</legend>
        ${f.cats.map(c => box('cat', c.key, state.cat.includes(c.key), categoryLabel(c.key), c.n ? number(c.n) : ''))}
      </fieldset>
      <fieldset class="filter-group"><legend>${t('filterPrice')}</legend>
        <div class="price-presets">${PRESETS.map(pr => html`<button type="button" class="chip" data-preset="${pr.min}-${pr.max}" aria-pressed="${state.min === pr.min && state.max === pr.max}">${t(pr.key)}</button>`)}</div>
        <div class="price-range">
          <label class="field"><span class="sr-only">${t('priceMin')}</span><input class="input" type="number" inputmode="numeric" min="0" step="50" id="${idPrefix}-min" data-f="min" value="${state.min}" placeholder="${t('priceMin')}"></label>
          <span aria-hidden="true">–</span>
          <label class="field"><span class="sr-only">${t('priceMax')}</span><input class="input" type="number" inputmode="numeric" min="0" step="50" id="${idPrefix}-max" data-f="max" value="${state.max}" placeholder="${t('priceMax')}"></label>
        </div>
      </fieldset>
      ${f.sizes.length ? html`<fieldset class="filter-group"><legend>${t('filterSize')}</legend>
        <div class="sizes">${f.sizes.map(s => html`<button type="button" class="size${state.size.includes(s) ? ' is-on' : ''}" data-toggle="size" data-value="${s}" aria-pressed="${state.size.includes(s)}">${s}</button>`)}</div></fieldset>` : ''}
      ${f.colors.length ? html`<fieldset class="filter-group"><legend>${t('filterColor')}</legend>
        <div class="swatches">${f.colors.map(c => html`<button type="button" class="swatch${state.color.includes(c.key) ? ' is-on' : ''}" data-toggle="color" data-value="${c.key}" data-sw="${c.hex}" aria-pressed="${state.color.includes(c.key)}" aria-label="${c.label}" title="${c.label}"></button>`)}</div></fieldset>` : ''}
      <fieldset class="filter-group"><legend>${t('filterAvailability')}</legend>
        ${box('stock', '1', state.stock, t('filterInStock'))}
        ${box('sale', '1', state.sale, t('filterOnSale'))}
      </fieldset>
      ${activeCount() ? html`<button type="button" class="btn btn-ghost btn-block" data-clear>${t('clearAll')}</button>` : ''}
    </form>`;
}

/** Swatch colours are applied via CSSOM (no inline style attributes under CSP). */
function paintSwatches(root) {
  root.querySelectorAll('[data-sw]').forEach(el => el.style.setProperty('--sw', /^#[0-9a-f]{3,8}$/i.test(el.dataset.sw) ? el.dataset.sw : '#ccc'));
}

function renderToolbar() {
  const n = activeCount();
  mount($('#shop-toolbar'), html`
    <form class="search-bar shop-search" role="search" data-search>
      ${icon('search', 20)}
      <label class="sr-only" for="shop-q">${t('searchShop')}</label>
      <input class="input" id="shop-q" type="search" name="q" value="${state.q}" placeholder="${t('searchPlaceholder')}" autocomplete="off" enterkeyhint="search">
    </form>
    <div class="shop-tools">
      <button class="btn btn-ghost btn-sm shop-filter-btn" type="button" data-open-filters aria-haspopup="dialog">${icon('filter', 18)}<span>${t('filters')}</span>${n ? html`<span class="dot-count">${number(n)}</span>` : ''}</button>
      <label class="shop-sort"><span class="sr-only">${t('sortLabel')}</span>
        <select class="input" id="shop-sort" aria-label="${t('sortLabel')}">${SORTS.map(s => html`<option value="${s}" ${s === state.sort ? 'selected' : ''}>${t(SORT_KEYS[s])}</option>`)}</select></label>
      <div class="view-toggle" role="group">
        <button class="icon-btn" type="button" data-view="grid" aria-pressed="${state.view !== 'rows'}" aria-label="${t('viewGrid')}" title="${t('viewGrid')}">${icon('grid', 20)}</button>
        <button class="icon-btn" type="button" data-view="rows" aria-pressed="${state.view === 'rows'}" aria-label="${t('viewRows')}" title="${t('viewRows')}">${icon('rows', 20)}</button>
      </div>
    </div>`);
}

function renderChips() {
  const chips = [];
  if (state.q) chips.push({ label: `“${state.q}”`, clear: { q: '' } });
  state.cat.forEach(c => chips.push({ label: categoryLabel(c), clear: { cat: state.cat.filter(x => x !== c) } }));
  if (state.min || state.max) chips.push({ label: `${state.min ? money(Number(state.min)) : '৳0'} – ${state.max ? money(Number(state.max)) : '∞'}`, clear: { min: '', max: '' } });
  state.size.forEach(s => chips.push({ label: `${t('size')}: ${s}`, clear: { size: state.size.filter(x => x !== s) } }));
  const colorMap = new Map(facets().colors.map(c => [c.key, c.label]));
  state.color.forEach(c => chips.push({ label: colorMap.get(c) || c, clear: { color: state.color.filter(x => x !== c) } }));
  if (state.stock) chips.push({ label: t('inStockChip'), clear: { stock: false } });
  if (state.sale) chips.push({ label: t('saleChip'), clear: { sale: false } });
  chipClears = chips.map(c => c.clear);
  const el = $('#shop-chips');
  el.hidden = !chips.length;
  mount(el, chips.length ? html`${chips.map((c, i) => html`<button type="button" class="chip is-on" data-chip="${i}" aria-label="${t('removeFilter', { x: c.label })}">${c.label} ${icon('close', 14)}</button>`)}
    ${chips.length > 1 ? html`<button type="button" class="chip" data-clear>${t('clearAll')}</button>` : ''}` : '');
}
let chipClears = [];

function render() {
  const grid = $('#shop-grid');
  grid.classList.toggle('is-list', state.view === 'rows');
  $('#shop-toolbar').querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === state.view || (b.dataset.view === 'grid' && state.view !== 'rows'))));
  renderChips();
  const side = $('#shop-side');
  mount(side, html`<h2 class="panel-title">${t('filters')}</h2>${filtersMarkup('side')}`);
  paintSwatches(side);
  if (filterSheet?.el.isConnected && filterSheet.el.open) { filterSheet.setBody(filtersMarkup('sheet')); paintSwatches(filterSheet.body); updateSheetFooter(); }

  if (status === 'loading') { mount(grid, skeletonCards(8)); mount($('#shop-count'), ''); mount($('#shop-more'), ''); return; }
  if (status === 'error') {
    mount(grid, html`<div class="empty shop-empty"><div class="empty-icon">${icon('info', 30)}</div><h3 class="empty-title">${t('errorGeneric')}</h3><button class="btn btn-primary" type="button" data-retry>${t('retry')}</button></div>`);
    mount($('#shop-count'), ''); mount($('#shop-more'), ''); return;
  }
  const list = filtered();
  const shown = list.slice(0, state.page * PAGE);
  mount($('#shop-count'), list.length === 1 ? t('resultsOne') : t('results', { n: number(list.length) }));
  if (!list.length) {
    mount(grid, html`<div class="shop-empty">${emptyState({ iconName: 'search', title: t('noResults'), text: t('noResultsText') })}
      ${activeCount() || state.q ? html`<p class="center"><button class="btn btn-primary" type="button" data-clear>${t('clearAll')}</button></p>` : ''}</div>`);
    mount($('#shop-more'), ''); return;
  }
  renderGrid(grid, shown, { eagerCount: 4 });
  mount($('#shop-more'), shown.length < list.length ? html`
    <p class="muted">${t('showing', { a: number(shown.length), b: number(list.length) })}</p>
    <button class="btn btn-ghost" type="button" data-more>${t('loadMore')}</button>` : '');
}

// ---- Filter sheet (mobile) ---------------------------------------------------------------

function updateSheetFooter() {
  filterSheet.setFooter(html`<div class="filter-foot">
    <button class="btn btn-ghost" type="button" data-clear>${t('clearAll')}</button>
    <button class="btn btn-primary" type="button" data-close>${t('showResults', { n: number(products.length ? filtered().length : 0) })}</button></div>`);
}

function openFilters() {
  if (matchMedia('(min-width: 900px)').matches) { $('#shop-side').querySelector('input,button')?.focus(); return; }
  filterSheet = sheet({ id: 'filter-sheet', side: 'bottom', title: t('filters'), className: 'filter-sheet' });
  filterSheet.setBody(filtersMarkup('sheet')); paintSwatches(filterSheet.body); updateSheetFooter();
  if (!filterSheet.el.dataset.bound) { filterSheet.el.dataset.bound = '1'; bindFilters(filterSheet.el); }
  filterSheet.open();
}

// ---- Events ----------------------------------------------------------------------------------

function bindFilters(root) {
  root.addEventListener('change', e => {
    const input = e.target.closest('[data-f]');
    if (!input) return;
    const key = input.dataset.f;
    if (key === 'cat') writeState({ cat: input.checked ? [...state.cat, input.value] : state.cat.filter(c => c !== input.value), page: 1 });
    else if (key === 'stock' || key === 'sale') writeState({ [key]: input.checked, page: 1 });
    else if (key === 'min' || key === 'max') writeState({ [key]: /^\d+$/.test(input.value) ? input.value : '', page: 1 }, { replace: true });
  });
  root.addEventListener('submit', e => e.preventDefault());
  on(root, 'click', '[data-toggle]', (e, b) => {
    const key = b.dataset.toggle; const v = b.dataset.value;
    writeState({ [key]: state[key].includes(v) ? state[key].filter(x => x !== v) : [...state[key], v], page: 1 });
  });
  on(root, 'click', '[data-preset]', (e, b) => {
    const [min, max] = b.dataset.preset.split('-');
    const same = state.min === min && state.max === max;
    writeState({ min: same ? '' : min, max: same ? '' : max, page: 1 });
  });
  on(root, 'click', '[data-clear]', clearAll);
}

function clearAll() { writeState({ q: '', cat: [], min: '', max: '', size: [], color: [], stock: false, sale: false, page: 1 }); renderToolbar(); }

const toolbar = $('#shop-toolbar');
const runSearch = debounce(value => {
  const q = value.trim().slice(0, 80);
  if (q === state.q) return;
  writeState({ q, page: 1 }, { replace: Boolean(state.q && q) });
  if (q.length > 1) track('Search', { search_string: q });
}, 250);
toolbar.addEventListener('input', e => { if (e.target.id === 'shop-q') runSearch(e.target.value); });
toolbar.addEventListener('submit', e => { e.preventDefault(); runSearch($('#shop-q').value); $('#shop-q').blur(); });
toolbar.addEventListener('change', e => { if (e.target.id === 'shop-sort') writeState({ sort: e.target.value, page: 1 }); });
on(toolbar, 'click', '[data-view]', (e, b) => writeState({ view: b.dataset.view }, { replace: true }));
on(toolbar, 'click', '[data-open-filters]', openFilters);

bindFilters($('#shop-side'));
on($('#shop-chips'), 'click', '[data-chip]', (e, b) => { writeState({ ...chipClears[Number(b.dataset.chip)], page: 1 }); renderToolbar(); });
on($('#shop-chips'), 'click', '[data-clear]', clearAll);
on($('#shop-grid'), 'click', '[data-clear]', clearAll);
on($('#shop-grid'), 'click', '[data-retry]', () => load(true));
on($('#shop-more'), 'click', '[data-more]', () => {
  const before = state.page * PAGE;
  writeState({ page: state.page + 1 }, { replace: true });
  $('#shop-grid').children[before]?.querySelector('a')?.focus({ preventScroll: true });
});
bindCards($('#shop-grid'), () => products);

// ---- Boot --------------------------------------------------------------------------------------

function renderStatic() {
  mount($('#shop-title'), html`${t('shopTitleA')} <em>${t('shopTitleB')}</em>`);
  const cat = state.cat.length === 1 ? categoryLabel(state.cat[0]) : '';
  document.title = `${cat || t('navShop')} — Mohor`;
}

async function load(fresh = false) {
  status = 'loading'; render();
  try { products = await loadProducts({ fresh }); status = 'ready'; } catch { status = 'error'; }
  render();
  if (state.q) track('Search', { search_string: state.q });
}

renderStatic();
renderToolbar();
// Normalise legacy params (?category=, sort=low-high) into the canonical URL.
writeState({}, { replace: true });
load();

onLangChange(() => { renderStatic(); renderToolbar(); render(); filterSheet?.el.remove(); filterSheet = null; });
