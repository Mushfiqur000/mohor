import { boot } from '/assets/js/core/layout.js';
import { extend, t, onLangChange } from '/assets/js/core/i18n.js';
import { html, mount, $ } from '/assets/js/core/dom.js';
import { icon } from '/assets/js/core/ui.js';

extend({
  en: { nfTitle1: 'This page has', nfTitle2: 'wandered off', nfText: 'The link may be old or mistyped. Search for a piece, or find your way back below.', nfShop: 'Shop the collection', nfSearch: 'Search pieces', nfHome: 'Home', nfHelp: 'Need help?' },
  bn: { nfTitle1: 'এই পেজটি', nfTitle2: 'হারিয়ে গেছে', nfText: 'লিংকটি পুরোনো বা ভুল হতে পারে। কোনো পণ্য খুঁজুন, অথবা নিচ থেকে ফিরে যান।', nfShop: 'কালেকশন দেখুন', nfSearch: 'পণ্য খুঁজুন', nfHome: 'হোম', nfHelp: 'সাহায্য লাগবে?' },
});

await boot({ page: '404' });

function render() {
  mount($('#nf-title'), html`${t('nfTitle1')} <em>${t('nfTitle2')}</em>`);
  $('#nf-text').textContent = t('nfText');
  mount($('#nf-actions'), html`
    <button class="btn btn-primary" type="button" data-open="search">${icon('search', 18)} ${t('nfSearch')}</button>
    <a class="btn btn-ghost" href="/shop">${t('nfShop')}</a>
    <a class="btn btn-ghost" href="/">${t('nfHome')}</a>
    <button class="btn btn-ghost" type="button" data-open="support">${t('nfHelp')}</button>`);
}
render();
onLangChange(render);
