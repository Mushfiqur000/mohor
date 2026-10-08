// Bilingual (EN / বাংলা) strings. Pages add their own keys with extend().
// Markup opts in with data-i18n="key", data-i18n-placeholder, data-i18n-aria.

const STORAGE_KEY = 'mohor:lang';
const listeners = new Set();

const dict = {
  en: {
    brand: 'Mohor Clothings',
    tagline: 'Handcrafted in Sylhet',
    navHome: 'Home', navShop: 'Shop', navAbout: 'Our Story', navPolicy: 'Delivery & Returns',
    navWishlist: 'Wishlist', navCart: 'Bag', navAccount: 'Account', navSearch: 'Search', navOrders: 'My Orders',
    navSupport: 'Help', navMenu: 'Menu', navTrack: 'Track order',
    searchPlaceholder: 'Search sets, kurtis, khadi…', searchEmpty: 'No pieces match that search.',
    searchTrending: 'Popular', searchViewAll: 'See all results',
    cartTitle: 'Your bag', cartEmpty: 'Your bag is empty', cartEmptyHint: 'Pieces you add will wait for you here.',
    cartSubtotal: 'Subtotal', cartCheckout: 'Checkout', cartContinue: 'Continue shopping', cartRemove: 'Remove',
    cartSaved: 'You save', added: 'Added to your bag', removed: 'Removed from bag',
    wishlistAdded: 'Saved to wishlist', wishlistRemoved: 'Removed from wishlist',
    size: 'Size', color: 'Colour', qty: 'Qty', soldOut: 'Sold out', onlyLeft: 'Only {n} left', sale: 'Sale',
    addToBag: 'Add to bag', buyNow: 'Buy now', chooseSize: 'Choose a size', chooseColor: 'Choose a colour',
    supportTitle: 'How can we help?', supportWhatsapp: 'Chat on WhatsApp', supportCall: 'Call us',
    supportMessenger: 'Message on Facebook', supportHours: 'Every day, 10am – 10pm',
    supportFaq: 'Quick answers', supportTrack: 'Track an order',
    footerAbout: 'Three-piece sets, kurtis and khadi, cut and finished by hand in Sylhet.',
    footerShop: 'Shop', footerHelp: 'Help', footerFollow: 'Follow', footerRights: 'All rights reserved.',
    supportReply: 'Replies within minutes', supportTrackHint: 'Order ID + phone',
    faqDeliveryQ: 'How long does delivery take?', faqDeliveryA: 'Inside Sylhet City 1–3 business days (৳70). Everywhere else in Bangladesh 3–5 business days (৳140).',
    faqPaymentQ: 'How do I pay?', faqPaymentA: 'Cash on delivery — pay the rider when your parcel arrives. We call to confirm every order first.',
    faqExchangeQ: 'Can I exchange a piece?', faqExchangeA: 'Yes. Tell us within 24 hours of delivery if a size or item is wrong; unworn pieces with tags can be exchanged.',
    faqSizeQ: 'How do I pick my size?', faqSizeA: 'Every product has a size guide with measurements. Still unsure? Send us your bust and length on WhatsApp.',
    signIn: 'Sign in', signOut: 'Sign out', close: 'Close', back: 'Back', retry: 'Try again', loading: 'Loading…',
    errorGeneric: 'Something went wrong. Please try again.', offline: 'You are offline — showing saved pages.',
    language: 'বাংলা', theme: 'Theme', all: 'All', viewDetails: 'View full details',
    catThreePiece: 'Three-piece', catKurti: 'Kurti', catKhadi: 'Khadi', catSaree: 'Saree', catOther: 'Other',
  },
  bn: {
    brand: 'মোহর ক্লোদিংস',
    tagline: 'সিলেটে হাতে তৈরি',
    navHome: 'হোম', navShop: 'শপ', navAbout: 'আমাদের গল্প', navPolicy: 'ডেলিভারি ও রিটার্ন',
    navWishlist: 'উইশলিস্ট', navCart: 'ব্যাগ', navAccount: 'অ্যাকাউন্ট', navSearch: 'খুঁজুন', navOrders: 'আমার অর্ডার',
    navSupport: 'সাহায্য', navMenu: 'মেনু', navTrack: 'অর্ডার ট্র্যাক',
    searchPlaceholder: 'থ্রি-পিস, কুর্তি, খাদি খুঁজুন…', searchEmpty: 'এই নামে কোনো পণ্য পাওয়া যায়নি।',
    searchTrending: 'জনপ্রিয়', searchViewAll: 'সব ফলাফল দেখুন',
    cartTitle: 'আপনার ব্যাগ', cartEmpty: 'আপনার ব্যাগ খালি', cartEmptyHint: 'যা যোগ করবেন, এখানে অপেক্ষা করবে।',
    cartSubtotal: 'সাবটোটাল', cartCheckout: 'চেকআউট', cartContinue: 'কেনাকাটা চালিয়ে যান', cartRemove: 'সরান',
    cartSaved: 'আপনি বাঁচাচ্ছেন', added: 'ব্যাগে যোগ হয়েছে', removed: 'ব্যাগ থেকে সরানো হয়েছে',
    wishlistAdded: 'উইশলিস্টে সংরক্ষিত', wishlistRemoved: 'উইশলিস্ট থেকে সরানো হয়েছে',
    size: 'সাইজ', color: 'রং', qty: 'পরিমাণ', soldOut: 'স্টক শেষ', onlyLeft: 'মাত্র {n}টি বাকি', sale: 'সেল',
    addToBag: 'ব্যাগে যোগ করুন', buyNow: 'এখনই কিনুন', chooseSize: 'সাইজ বাছুন', chooseColor: 'রং বাছুন',
    supportTitle: 'কীভাবে সাহায্য করতে পারি?', supportWhatsapp: 'হোয়াটসঅ্যাপে কথা বলুন', supportCall: 'কল করুন',
    supportMessenger: 'ফেসবুকে মেসেজ দিন', supportHours: 'প্রতিদিন, সকাল ১০টা – রাত ১০টা',
    supportFaq: 'দ্রুত উত্তর', supportTrack: 'অর্ডার ট্র্যাক করুন',
    footerAbout: 'থ্রি-পিস, কুর্তি ও খাদি — সিলেটে হাতে কাটা ও হাতে ফিনিশ করা।',
    footerShop: 'শপ', footerHelp: 'সাহায্য', footerFollow: 'ফলো করুন', footerRights: 'সর্বস্বত্ব সংরক্ষিত।',
    supportReply: 'কয়েক মিনিটে উত্তর', supportTrackHint: 'অর্ডার আইডি + ফোন',
    faqDeliveryQ: 'ডেলিভারিতে কত দিন লাগে?', faqDeliveryA: 'সিলেট সিটির ভেতরে ১–৩ কার্যদিবস (৳৭০)। বাংলাদেশের অন্য সব জায়গায় ৩–৫ কার্যদিবস (৳১৪০)।',
    faqPaymentQ: 'কীভাবে পেমেন্ট করব?', faqPaymentA: 'ক্যাশ অন ডেলিভারি — পার্সেল পেয়ে রাইডারকে পেমেন্ট দিন। প্রতিটি অর্ডার আমরা কল করে কনফার্ম করি।',
    faqExchangeQ: 'পণ্য কি বদলানো যাবে?', faqExchangeA: 'হ্যাঁ। ডেলিভারির ২৪ ঘণ্টার মধ্যে সাইজ বা পণ্য ভুল হলে জানান; ট্যাগসহ অব্যবহৃত পণ্য বদলানো যাবে।',
    faqSizeQ: 'সাইজ কীভাবে বাছব?', faqSizeA: 'প্রতিটি পণ্যে মাপসহ সাইজ গাইড আছে। নিশ্চিত না হলে হোয়াটসঅ্যাপে বুক ও লম্বার মাপ পাঠান।',
    signIn: 'সাইন ইন', signOut: 'সাইন আউট', close: 'বন্ধ', back: 'পেছনে', retry: 'আবার চেষ্টা করুন', loading: 'লোড হচ্ছে…',
    errorGeneric: 'কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।', offline: 'আপনি অফলাইনে — সংরক্ষিত পেজ দেখানো হচ্ছে।',
    language: 'English', theme: 'থিম', all: 'সব', viewDetails: 'বিস্তারিত দেখুন',
    catThreePiece: 'থ্রি-পিস', catKurti: 'কুর্তি', catKhadi: 'খাদি', catSaree: 'শাড়ি', catOther: 'অন্যান্য',
  },
};

let lang = (() => {
  try { return (localStorage.getItem(STORAGE_KEY) || localStorage.getItem('mohor_lang')) === 'bn' ? 'bn' : 'en'; } catch { return 'en'; }
})();

export const getLang = () => lang;

/** Merge page-specific strings: extend({ en: {...}, bn: {...} }). */
export function extend(strings) {
  for (const code of ['en', 'bn']) Object.assign(dict[code], strings[code] || {});
}

/** t('onlyLeft', { n: 2 }) */
export function t(key, vars) {
  let value = dict[lang][key] ?? dict.en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) value = value.replaceAll(`{${k}}`, v);
  return value;
}

/** Picks the right side of a { en, bn } value (or returns plain strings unchanged). */
export function localized(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value[lang] || value.en || value.bn || '';
  return value ?? '';
}

export function applyTranslations(root = document) {
  document.documentElement.lang = lang === 'bn' ? 'bn' : 'en';
  root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  root.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
}

export function setLang(next) {
  lang = next === 'bn' ? 'bn' : 'en';
  try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* private mode */ }
  applyTranslations();
  listeners.forEach(fn => fn(lang));
}

export const toggleLang = () => setLang(lang === 'en' ? 'bn' : 'en');
export const onLangChange = fn => { listeners.add(fn); return () => listeners.delete(fn); };
