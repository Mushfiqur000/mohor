// Wishlist: saved product ids (device-local store) rendered as product cards.
// Supports a shared list via /wishlist?ids=a,b,c (view + "save all").
import { boot } from '/assets/js/core/layout.js';
import { extend, t, onLangChange } from '/assets/js/core/i18n.js';
import { html, mount, on, $ } from '/assets/js/core/dom.js';
import { icon, toast, skeletonCards, emptyState, copyText, confirmDialog } from '/assets/js/core/ui.js';
import { productCard, bindCards, openQuickAdd } from '/assets/js/core/cards.js';
import { loadProducts, inStock } from '/assets/js/core/catalog.js';
import { wishlist } from '/assets/js/core/wishlist.js';
import { number } from '/assets/js/core/format.js';
import { track } from '/assets/js/core/analytics.js';

extend({
  en: {
    wlEyebrow: 'Saved for later', wlTitle1: 'Your', wlTitle2: 'wishlist', wlSharedTitle1: 'A shared', wlSharedTitle2: 'wishlist',
    wlCount: '{n} saved pieces', wlCountOne: '1 saved piece', wlEmpty: 'Nothing saved yet',
    wlEmptyHint: 'Tap the heart on any piece to keep it here for later.', wlBrowse: 'Browse the shop',
    wlShare: 'Share list', wlShared: 'Link copied — share it with anyone', wlClear: 'Clear all',
    wlClearQ: 'Clear your wishlist?', wlClearText: 'All saved pieces will be removed from this device.',
    wlRemove: 'Remove', wlQuickAdd: 'Add to bag', wlSaveAll: 'Save all to my wishlist', wlSavedAll: 'Saved to your wishlist',
    wlMissing: 'Some saved pieces are no longer available.', wlLoadError: 'We could not load the collection.',
    wlShareText: 'My Mohor wishlist', wlBack: 'View my wishlist',
  },
  bn: {
    wlEyebrow: 'পরে কেনার জন্য', wlTitle1: 'আপনার', wlTitle2: 'উইশলিস্ট', wlSharedTitle1: 'শেয়ার করা', wlSharedTitle2: 'উইশলিস্ট',
    wlCount: '{n}টি সংরক্ষিত পণ্য', wlCountOne: '১টি সংরক্ষিত পণ্য', wlEmpty: 'এখনো কিছু সংরক্ষণ করেননি',
    wlEmptyHint: 'যেকোনো পণ্যের হার্টে ট্যাপ করুন, পরে দেখার জন্য এখানে থাকবে।', wlBrowse: 'শপ ঘুরে দেখুন',
    wlShare: 'লিস্ট শেয়ার', wlShared: 'লিংক কপি হয়েছে — যে কাউকে পাঠান', wlClear: 'সব মুছুন',
    wlClearQ: 'উইশলিস্ট খালি করবেন?', wlClearText: 'এই ডিভাইস থেকে সব সংরক্ষিত পণ্য সরিয়ে ফেলা হবে।',
    wlRemove: 'সরান', wlQuickAdd: 'ব্যাগে যোগ', wlSaveAll: 'সব আমার উইশলিস্টে রাখুন', wlSavedAll: 'আপনার উইশলিস্টে সংরক্ষিত',
    wlMissing: 'কিছু সংরক্ষিত পণ্য আর পাওয়া যাচ্ছে না।', wlLoadError: 'কালেকশন লোড করা যায়নি।',
    wlShareText: 'আমার মোহর উইশলিস্ট', wlBack: 'আমার উইশলিস্ট দেখুন',
  },
});

await boot({ page: 'wishlist' });

const params = new URLSearchParams(location.search);
const sharedIds = (params.get('ids') || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 60);
const shared = sharedIds.length > 0;
const grid = $('#wl-grid');
const actions = $('#wl-actions');
/** @type {any[]} */ let products = [];
let state = 'loading';

const ids = () => (shared ? sharedIds : wishlist.get());
const items = () => ids().map(id => products.find(p => String(p.id) === String(id))).filter(Boolean);

function render() {
  mount($('#wl-title'), shared ? html`${t('wlSharedTitle1')} <em>${t('wlSharedTitle2')}</em>` : html`${t('wlTitle1')} <em>${t('wlTitle2')}</em>`);
  const n = state === 'ready' ? items().length : ids().length;
  $('#wl-count').textContent = n ? (n === 1 ? t('wlCountOne') : t('wlCount', { n: number(n) })) : '';

  if (state === 'loading') { mount(grid, skeletonCards(Math.min(Math.max(n, 2), 6))); mount(actions, ''); return; }
  if (state === 'error') {
    grid.classList.remove('grid');
    mount(grid, html`<div class="empty"><p class="empty-text">${t('wlLoadError')}</p><button class="btn btn-primary" type="button" data-retry>${t('retry')}</button></div>`);
    mount(actions, '');
    return;
  }
  const list = items();
  if (!list.length) {
    grid.classList.remove('grid');
    mount(grid, emptyState({ iconName: 'heart', title: t('wlEmpty'), text: t('wlEmptyHint'), action: { href: '/shop', label: t('wlBrowse') } }));
    mount(actions, shared ? html`<a class="link" href="/wishlist">${t('wlBack')}</a>` : '');
    return;
  }
  grid.classList.add('grid');
  const missing = ids().length > list.length;
  mount(actions, html`
    ${missing ? html`<p class="muted wl-note">${t('wlMissing')}</p>` : ''}
    <div class="wl-buttons">
      ${shared
        ? html`<button class="btn btn-primary btn-sm" type="button" data-save-all>${icon('heart', 16)} ${t('wlSaveAll')}</button>
               <a class="btn btn-ghost btn-sm" href="/wishlist">${t('wlBack')}</a>`
        : html`<button class="btn btn-ghost btn-sm" type="button" data-share>${icon('share', 16)} ${t('wlShare')}</button>
               <button class="btn btn-ghost btn-sm" type="button" data-clear>${icon('trash', 16)} ${t('wlClear')}</button>`}
    </div>`);
  mount(grid, list.map((p, i) => html`
    <div class="wl-item">
      ${productCard(p, { eager: i < 2 })}
      <div class="wl-item-actions">
        ${inStock(p) ? html`<button class="btn btn-primary btn-sm" type="button" data-wl-add="${p.id}">${t('wlQuickAdd')}</button>` : html`<span class="badge badge-ink">${t('soldOut')}</span>`}
        ${shared ? '' : html`<button class="btn btn-ghost btn-sm" type="button" data-wl-remove="${p.id}" aria-label="${t('wlRemove')}">${icon('trash', 16)}</button>`}
      </div>
    </div>`));
}

async function load() {
  state = 'loading'; render();
  try { products = await loadProducts(); state = 'ready'; } catch { state = 'error'; }
  render();
}

bindCards(grid, () => products);
on(grid, 'click', '[data-wl-add]', (e, btn) => {
  const p = products.find(x => String(x.id) === btn.dataset.wlAdd);
  if (p) openQuickAdd(p);
});
on(grid, 'click', '[data-wl-remove]', (e, btn) => {
  const id = btn.dataset.wlRemove;
  const before = wishlist.get();
  wishlist.set(list => list.filter(x => x !== id));
  toast(t('wishlistRemoved'), { type: 'success', action: { label: t('back'), onClick: () => wishlist.set(before) } });
});
on(grid, 'click', '[data-retry]', () => load());
on(actions, 'click', '[data-share]', async () => {
  const url = `${location.origin}/wishlist?ids=${encodeURIComponent(wishlist.get().join(','))}`;
  track('Share', { content_type: 'wishlist' });
  if (navigator.share) {
    try { await navigator.share({ title: t('wlShareText'), url }); return; } catch (err) { if (err?.name === 'AbortError') return; }
  }
  toast((await copyText(url)) ? t('wlShared') : url, { type: 'success' });
});
on(actions, 'click', '[data-clear]', async () => {
  if (await confirmDialog({ title: t('wlClearQ'), message: t('wlClearText'), confirm: t('wlClear'), danger: true })) wishlist.set([]);
});
on(actions, 'click', '[data-save-all]', () => {
  wishlist.set(list => [...new Set([...sharedIds, ...list])]);
  toast(t('wlSavedAll'), { type: 'success', action: { label: t('navWishlist'), href: '/wishlist' } });
});

// The heart on a card toggles the store; re-render so the grid stays in sync.
wishlist.subscribe(() => { if (!shared && state === 'ready') render(); });
onLangChange(render);
load();
