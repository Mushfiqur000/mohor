// Delivery, exchange, privacy & terms. Static content + Bangla via data-i18n.
import { boot } from '/assets/js/core/layout.js';
import { extend } from '/assets/js/core/i18n.js';
import { $$ } from '/assets/js/core/dom.js';

extend({
  en: {
    poEyebrow: 'Please read before ordering', poTitle1: 'Delivery, exchange', poTitle2: '& policies', poUpdated: 'Last updated: October 2026',
    poNavDelivery: 'Delivery', poNavExchange: 'Exchange & returns', poNavPrivacy: 'Privacy', poNavTerms: 'Terms',
    poDelTitle: 'Delivery information & rates',
    poDel1: 'We deliver nationwide across Bangladesh. The delivery charge is calculated automatically at checkout.',
    poInside: 'Inside Sylhet City', poInsideTime: '1–3 business days', poOutside: 'Outside Sylhet City', poOutsideTime: '3–5 business days',
    poCodTitle: 'Cash on delivery', poCod: 'Pay the rider in cash when your parcel arrives. Please check the parcel in front of the rider.',
    poConfTitle: 'Order confirmation', poConf: 'Once you place an order on the website or via WhatsApp, our team verifies availability and calls or messages you with the final bill, including delivery charge, before dispatch.',
    poExTitle: '24-hour exchange policy',
    poEx1: 'We take pride in the quality of our handcrafted clothing. If you receive a defective, wrong-size or incorrect item, please notify us within 24 hours of receiving the delivery.',
    poRetTitle: 'Return conditions',
    poRet1: 'The item must be unused, unwashed and in its original packaging with tags intact.',
    poRet2: 'Please record an unboxing video to claim any damage or defect.',
    poRet3: 'Exchanges are subject to stock; if unavailable we offer another piece of equal value.',
    poRet4: 'Delivery charges for exchanges caused by our mistake are covered by us.',
    poColorTitle: 'Colour disclaimer', poColor: "Actual colours may vary slightly due to lighting during photography or your device's display. Exchanges are not accommodated purely for slight colour variations.",
    poPrivTitle: 'Privacy',
    poPriv1: 'We collect only what we need to deliver your order: your name, phone number, address and, if you create an account, your email.',
    poPriv2: 'We never sell your information. It is shared only with our delivery partner to bring your parcel to you. Passwords are stored securely hashed.',
    poPriv3: 'You can edit your profile or permanently delete your account at any time from your account page.',
    poTermsTitle: 'Terms',
    poTerms1: 'Prices are in Bangladeshi Taka and may change without notice. An order is final once we confirm it with you by phone or message.',
    poTerms2: 'We may cancel an order if an item becomes unavailable or details cannot be confirmed. All content and photography on this site belong to Mohor Clothings.',
    poHelpTitle: 'Questions? We are here to help.',
  },
  bn: {
    poEyebrow: 'অর্ডারের আগে পড়ে নিন', poTitle1: 'ডেলিভারি, এক্সচেঞ্জ', poTitle2: 'ও নীতিমালা', poUpdated: 'সর্বশেষ হালনাগাদ: অক্টোবর ২০২৬',
    poNavDelivery: 'ডেলিভারি', poNavExchange: 'এক্সচেঞ্জ ও রিটার্ন', poNavPrivacy: 'গোপনীয়তা', poNavTerms: 'শর্তাবলি',
    poDelTitle: 'ডেলিভারি তথ্য ও চার্জ',
    poDel1: 'আমরা সারা বাংলাদেশে ডেলিভারি দিই। চেকআউটে ডেলিভারি চার্জ স্বয়ংক্রিয়ভাবে হিসাব হয়।',
    poInside: 'সিলেট সিটির ভেতরে', poInsideTime: '১–৩ কার্যদিবস', poOutside: 'সিলেট সিটির বাইরে', poOutsideTime: '৩–৫ কার্যদিবস',
    poCodTitle: 'ক্যাশ অন ডেলিভারি', poCod: 'পার্সেল হাতে পেয়ে রাইডারকে নগদ টাকা দিন। রাইডারের সামনেই পার্সেল দেখে নিন।',
    poConfTitle: 'অর্ডার কনফার্মেশন', poConf: 'ওয়েবসাইট বা হোয়াটসঅ্যাপে অর্ডার করার পর আমাদের টিম স্টক যাচাই করে ডেলিভারি চার্জসহ চূড়ান্ত বিল জানিয়ে কল বা মেসেজ করে, তারপর পাঠানো হয়।',
    poExTitle: '২৪ ঘণ্টার এক্সচেঞ্জ নীতি',
    poEx1: 'আমাদের হাতে তৈরি পোশাকের মান নিয়ে আমরা গর্বিত। ত্রুটিপূর্ণ, ভুল সাইজ বা ভুল পণ্য পেলে ডেলিভারি পাওয়ার ২৪ ঘণ্টার মধ্যে আমাদের জানান।',
    poRetTitle: 'রিটার্নের শর্ত',
    poRet1: 'পণ্যটি অব্যবহৃত, না-ধোয়া এবং ট্যাগসহ মূল প্যাকেটে থাকতে হবে।',
    poRet2: 'ক্ষতি বা ত্রুটির দাবির জন্য আনবক্সিং ভিডিও রাখুন।',
    poRet3: 'এক্সচেঞ্জ স্টকের ওপর নির্ভরশীল; না থাকলে সমমূল্যের অন্য পণ্য দেওয়া হবে।',
    poRet4: 'আমাদের ভুলের কারণে এক্সচেঞ্জ হলে ডেলিভারি চার্জ আমরাই বহন করি।',
    poColorTitle: 'রং সংক্রান্ত সতর্কতা', poColor: 'ছবি তোলার আলো বা আপনার ডিভাইসের ডিসপ্লের কারণে আসল রং সামান্য ভিন্ন হতে পারে। শুধু সামান্য রঙের পার্থক্যের জন্য এক্সচেঞ্জ করা হয় না।',
    poPrivTitle: 'গোপনীয়তা',
    poPriv1: 'অর্ডার পৌঁছাতে যা দরকার শুধু তা-ই নিই: নাম, ফোন নম্বর, ঠিকানা এবং অ্যাকাউন্ট খুললে ইমেইল।',
    poPriv2: 'আমরা কখনো আপনার তথ্য বিক্রি করি না। শুধু ডেলিভারি পার্টনারের সাথে শেয়ার করা হয়। পাসওয়ার্ড নিরাপদে হ্যাশ করে রাখা হয়।',
    poPriv3: 'অ্যাকাউন্ট পেজ থেকে যেকোনো সময় প্রোফাইল বদলাতে বা অ্যাকাউন্ট স্থায়ীভাবে মুছে ফেলতে পারবেন।',
    poTermsTitle: 'শর্তাবলি',
    poTerms1: 'দাম বাংলাদেশি টাকায় এবং পূর্বঘোষণা ছাড়াই বদলাতে পারে। ফোন বা মেসেজে কনফার্ম করার পর অর্ডার চূড়ান্ত হয়।',
    poTerms2: 'পণ্য না থাকলে বা তথ্য যাচাই করা না গেলে অর্ডার বাতিল হতে পারে। এই সাইটের সব কনটেন্ট ও ছবি মোহর ক্লোদিংসের।',
    poHelpTitle: 'প্রশ্ন আছে? আমরা সাহায্য করতে প্রস্তুত।',
  },
});

await boot({ page: 'policy' });

// Highlight the section index chip for the section in view.
const chips = $$('.policy-chips a');
const byId = new Map(chips.map(a => [a.getAttribute('href').slice(1), a]));
const setActive = id => chips.forEach(a => {
  const on = a === byId.get(id);
  a.classList.toggle('is-on', on);
  if (on) { a.setAttribute('aria-current', 'true'); a.scrollIntoView?.({ block: 'nearest', inline: 'nearest' }); } else a.removeAttribute('aria-current');
});
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => {
    const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
    if (visible) setActive(visible.target.id);
  }, { rootMargin: '-30% 0px -60% 0px' });
  byId.forEach((_, id) => { const el = document.getElementById(id); if (el) io.observe(el); });
}
if (location.hash) {
  const id = location.hash.slice(1);
  if (byId.has(id)) { setActive(id); requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView()); }
}
