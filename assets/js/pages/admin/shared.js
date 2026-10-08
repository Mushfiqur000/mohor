// Shared helpers & strings for the admin app.
import { extend, t, localized } from '/assets/js/core/i18n.js';
import { toast, confirmDialog } from '/assets/js/core/ui.js';

export const STATUSES = ['Pending', 'Confirmed', 'Shipped', 'Completed', 'Cancelled'];
export const PRODUCT_STATUSES = ['active', 'draft', 'archived'];

extend({
  en: {
    adm: 'Admin', admDashboard: 'Dashboard', admOrders: 'Orders', admHistory: 'History', admProducts: 'Products', admBanners: 'Banners',
    admSettings: 'Settings', admNotify: 'Notifications', admCustomers: 'Customers', admMore: 'More',
    admSignInTitle: 'Studio sign-in', admSignInText: 'Only MOHOR administrators can enter.', admEmail: 'Email', admPassword: 'Password',
    admNotAdmin: 'This account is not an administrator.', admViewStore: 'View store',
    admRevenue: 'Revenue', admOrdersCount: 'Orders', admPending: 'Pending', admAvg: 'Avg. order', admCustomersCount: 'Customers', admProductsCount: 'Products',
    admLast14: 'Revenue — last 14 days', admStatusMix: 'Order status', admTop: 'Top products', admLow: 'Low stock', admSold: 'sold', admLeft: 'left',
    admNone: 'Nothing here yet.', admSearch: 'Search…', admAllStatus: 'All statuses', admExport: 'Export CSV', admSelected: '{n} selected',
    admSetStatus: 'Set status…', admApply: 'Apply', admDelete: 'Delete', admDeleteQ: 'Delete this permanently?', admDeleteManyQ: 'Delete {n} item(s) permanently?',
    admDeleted: 'Deleted', admSaved: 'Saved', admUpdated: 'Updated', admOrder: 'Order', admCustomer: 'Customer', admPhone: 'Phone', admAddress: 'Address',
    admZone: 'Zone', admItems: 'Items', admSubtotal: 'Subtotal', admDiscount: 'Discount', admDelivery: 'Delivery', admTotal: 'Total', admNote: 'Note',
    admPrint: 'Print invoice', admCall: 'Call', admWhatsApp: 'WhatsApp', admStatus: 'Status', admDate: 'Date', admFrom: 'From', admTo: 'To',
    admPrev: 'Previous', admNext: 'Next', admPage: 'Page {a} of {b}', admNoDate: '{n} order(s) have no date and are not on the calendar.',
    admNewProduct: 'New product', admEdit: 'Edit', admDuplicate: 'Duplicate', admCopyOf: 'Copy of', admSave: 'Save', admCancel: 'Cancel',
    admTitleEn: 'Title (English)', admTitleBn: 'Title (Bangla)', admDescEn: 'Description (English)', admDescBn: 'Description (Bangla)',
    admPrice: 'Price', admOriginal: 'Original price (for sale)', admCategory: 'Category', admColors: 'Colours', admAddColor: 'Add colour',
    admColorEn: 'Name (EN)', admColorBn: 'Name (BN)', admSizes: 'Sizes (comma separated)', admStock: 'Stock by colour & size', admStockTotal: 'Total stock: {n}',
    admQuantity: 'Quantity', admMeasure: 'Size measurements', admGuideEn: 'Measurements guide (EN)', admGuideBn: 'Measurements guide (BN)',
    admDetails: 'Details', admMaterials: 'Materials', admCare: 'Care', admOnePerLine: 'One per line', admSeo: 'SEO keywords (comma separated)',
    admFeatured: 'Featured', admOrderNo: 'Display order', admImages: 'Images', admUpload: 'Upload images', admUploading: 'Uploading…',
    admThumb: 'Thumbnail', admMakeThumb: 'Use as thumbnail', admLeftMove: 'Move left', admRightMove: 'Move right', admImageUrl: 'Or paste image URL',
    admAdd: 'Add', admUnsaved: 'You have unsaved changes. Discard them?', admDiscard: 'Discard', admRequired: 'Title and price are required.',
    admBulkDiscount: 'Discount %', admClearDiscount: 'Clear discount', admMoveUp: 'Move up', admMoveDown: 'Move down', admSaveOrder: 'Save order', admUndo: 'Undo',
    admStorewide: 'Store-wide discount', admStorewideQ: 'Apply {n}% to ALL products?', admResetAll: 'Reset all discounts', admResetAllQ: 'Restore all prices and turn off the sale banner?',
    admLowThreshold: 'Low-stock threshold', admInventory: 'Inventory', admActive: 'Active', admDraft: 'Draft', admArchived: 'Archived',
    admNewBanner: 'New banner', admBannerTitle: 'Title', admSubtitle: 'Subtitle', admImage: 'Image', admLink: 'Link', admButton: 'Button text',
    admFocus: 'Focus point (x% y%)', admPreview: 'Preview', admHidden: 'Hidden',
    admDeliveryIn: 'Delivery inside Sylhet (৳)', admDeliveryOut: 'Delivery outside Sylhet (৳)', admFree: 'Free delivery over (৳, 0 = off)',
    admSale: 'Sale', admSaleOn: 'Sale banner active', admSalePct: 'Sale percent', admSaleText: 'Banner text', admSaleBadge: 'Badge', admSaleEnd: 'Sale ends',
    admContact: 'Contact', admAnnouncement: 'Announcement bar', admMaxQty: 'Max quantity per item', admTelegram: 'Send Telegram test', admTelegramOk: 'Telegram message sent',
    admSend: 'Send', admSendTo: 'Recipient', admAllCustomers: 'All customers', admUserEmail: 'Customer email', admMsgTitle: 'Title', admMessage: 'Message',
    admSent: 'Notification sent', admRecent: 'Recent', admRole: 'Role', admSpent: 'Spent', admJoined: 'Joined', admMakeAdmin: 'Make admin', admMakeCustomer: 'Make customer',
    admRoleQ: 'Change role of {name} to {role}?', admRetry: 'Retry', admLoadError: 'Could not load.', admRefresh: 'Refresh', admSignOut: 'Sign out', admClose: 'Close',
    admInvoice: 'Invoice', admThanks: 'Thank you for shopping with MOHOR.',
  },
  bn: {
    adm: 'অ্যাডমিন', admDashboard: 'ড্যাশবোর্ড', admOrders: 'অর্ডার', admHistory: 'ইতিহাস', admProducts: 'পণ্য', admBanners: 'ব্যানার',
    admSettings: 'সেটিংস', admNotify: 'নোটিফিকেশন', admCustomers: 'গ্রাহক', admMore: 'আরও',
    admSignInTitle: 'স্টুডিও সাইন-ইন', admSignInText: 'শুধু মোহর অ্যাডমিনরা প্রবেশ করতে পারবেন।', admEmail: 'ইমেইল', admPassword: 'পাসওয়ার্ড',
    admNotAdmin: 'এই অ্যাকাউন্টটি অ্যাডমিন নয়।', admViewStore: 'স্টোর দেখুন',
    admRevenue: 'আয়', admOrdersCount: 'অর্ডার', admPending: 'অপেক্ষমাণ', admAvg: 'গড় অর্ডার', admCustomersCount: 'গ্রাহক', admProductsCount: 'পণ্য',
    admLast14: 'আয় — গত ১৪ দিন', admStatusMix: 'অর্ডারের অবস্থা', admTop: 'সেরা পণ্য', admLow: 'স্টক কম', admSold: 'বিক্রি', admLeft: 'বাকি',
    admNone: 'এখনো কিছু নেই।', admSearch: 'খুঁজুন…', admAllStatus: 'সব অবস্থা', admExport: 'CSV এক্সপোর্ট', admSelected: '{n}টি নির্বাচিত',
    admSetStatus: 'অবস্থা বাছুন…', admApply: 'প্রয়োগ', admDelete: 'মুছুন', admDeleteQ: 'স্থায়ীভাবে মুছে ফেলবেন?', admDeleteManyQ: '{n}টি আইটেম স্থায়ীভাবে মুছবেন?',
    admDeleted: 'মুছে ফেলা হয়েছে', admSaved: 'সংরক্ষিত', admUpdated: 'হালনাগাদ হয়েছে', admOrder: 'অর্ডার', admCustomer: 'গ্রাহক', admPhone: 'ফোন', admAddress: 'ঠিকানা',
    admZone: 'এলাকা', admItems: 'পণ্যসমূহ', admSubtotal: 'সাবটোটাল', admDiscount: 'ছাড়', admDelivery: 'ডেলিভারি', admTotal: 'মোট', admNote: 'নোট',
    admPrint: 'ইনভয়েস প্রিন্ট', admCall: 'কল', admWhatsApp: 'হোয়াটসঅ্যাপ', admStatus: 'অবস্থা', admDate: 'তারিখ', admFrom: 'থেকে', admTo: 'পর্যন্ত',
    admPrev: 'আগের', admNext: 'পরের', admPage: 'পৃষ্ঠা {a} / {b}', admNoDate: '{n}টি অর্ডারের তারিখ নেই, ক্যালেন্ডারে দেখাবে না।',
    admNewProduct: 'নতুন পণ্য', admEdit: 'সম্পাদনা', admDuplicate: 'কপি করুন', admCopyOf: 'কপি:', admSave: 'সংরক্ষণ', admCancel: 'বাতিল',
    admTitleEn: 'শিরোনাম (ইংরেজি)', admTitleBn: 'শিরোনাম (বাংলা)', admDescEn: 'বিবরণ (ইংরেজি)', admDescBn: 'বিবরণ (বাংলা)',
    admPrice: 'দাম', admOriginal: 'আসল দাম (সেলের জন্য)', admCategory: 'ক্যাটাগরি', admColors: 'রং', admAddColor: 'রং যোগ করুন',
    admColorEn: 'নাম (EN)', admColorBn: 'নাম (BN)', admSizes: 'সাইজ (কমা দিয়ে)', admStock: 'রং ও সাইজ অনুযায়ী স্টক', admStockTotal: 'মোট স্টক: {n}',
    admQuantity: 'পরিমাণ', admMeasure: 'সাইজের মাপ', admGuideEn: 'মাপের গাইড (EN)', admGuideBn: 'মাপের গাইড (BN)',
    admDetails: 'বিস্তারিত', admMaterials: 'উপকরণ', admCare: 'যত্ন', admOnePerLine: 'প্রতি লাইনে একটি', admSeo: 'SEO কীওয়ার্ড (কমা দিয়ে)',
    admFeatured: 'ফিচার্ড', admOrderNo: 'প্রদর্শনের ক্রম', admImages: 'ছবি', admUpload: 'ছবি আপলোড', admUploading: 'আপলোড হচ্ছে…',
    admThumb: 'থাম্বনেইল', admMakeThumb: 'থাম্বনেইল করুন', admLeftMove: 'বামে সরান', admRightMove: 'ডানে সরান', admImageUrl: 'অথবা ছবির লিংক দিন',
    admAdd: 'যোগ', admUnsaved: 'অসংরক্ষিত পরিবর্তন আছে। বাদ দেবেন?', admDiscard: 'বাদ দিন', admRequired: 'শিরোনাম ও দাম আবশ্যক।',
    admBulkDiscount: 'ছাড় %', admClearDiscount: 'ছাড় তুলে দিন', admMoveUp: 'উপরে', admMoveDown: 'নিচে', admSaveOrder: 'ক্রম সংরক্ষণ', admUndo: 'আগের মতো',
    admStorewide: 'পুরো স্টোরে ছাড়', admStorewideQ: 'সব পণ্যে {n}% ছাড় দেবেন?', admResetAll: 'সব ছাড় তুলে দিন', admResetAllQ: 'সব দাম আগের মতো করে সেল ব্যানার বন্ধ করবেন?',
    admLowThreshold: 'কম স্টকের সীমা', admInventory: 'ইনভেন্টরি', admActive: 'সক্রিয়', admDraft: 'খসড়া', admArchived: 'আর্কাইভ',
    admNewBanner: 'নতুন ব্যানার', admBannerTitle: 'শিরোনাম', admSubtitle: 'উপশিরোনাম', admImage: 'ছবি', admLink: 'লিংক', admButton: 'বাটনের লেখা',
    admFocus: 'ফোকাস পয়েন্ট (x% y%)', admPreview: 'প্রিভিউ', admHidden: 'লুকানো',
    admDeliveryIn: 'সিলেট শহরের ভেতরে ডেলিভারি (৳)', admDeliveryOut: 'সিলেটের বাইরে ডেলিভারি (৳)', admFree: 'এর বেশি হলে ফ্রি ডেলিভারি (৳, ০ = বন্ধ)',
    admSale: 'সেল', admSaleOn: 'সেল ব্যানার চালু', admSalePct: 'সেলের শতাংশ', admSaleText: 'ব্যানারের লেখা', admSaleBadge: 'ব্যাজ', admSaleEnd: 'সেল শেষ',
    admContact: 'যোগাযোগ', admAnnouncement: 'ঘোষণা বার', admMaxQty: 'প্রতি পণ্যে সর্বোচ্চ পরিমাণ', admTelegram: 'টেলিগ্রাম টেস্ট পাঠান', admTelegramOk: 'টেলিগ্রাম বার্তা পাঠানো হয়েছে',
    admSend: 'পাঠান', admSendTo: 'প্রাপক', admAllCustomers: 'সব গ্রাহক', admUserEmail: 'গ্রাহকের ইমেইল', admMsgTitle: 'শিরোনাম', admMessage: 'বার্তা',
    admSent: 'নোটিফিকেশন পাঠানো হয়েছে', admRecent: 'সাম্প্রতিক', admRole: 'ভূমিকা', admSpent: 'খরচ', admJoined: 'যোগদান', admMakeAdmin: 'অ্যাডমিন করুন', admMakeCustomer: 'গ্রাহক করুন',
    admRoleQ: '{name}-এর ভূমিকা {role} করবেন?', admRetry: 'আবার চেষ্টা', admLoadError: 'লোড করা যায়নি।', admRefresh: 'রিফ্রেশ', admSignOut: 'সাইন আউট', admClose: 'বন্ধ',
    admInvoice: 'ইনভয়েস', admThanks: 'মোহর থেকে কেনাকাটার জন্য ধন্যবাদ।',
  },
});

export const statusLabel = s => s;
export const statusClass = s => `status status-${String(s || 'pending').toLowerCase()}`;
export const pStatusLabel = s => t({ active: 'admActive', draft: 'admDraft', archived: 'admArchived' }[s] || 'admActive');
export const title = p => localized(p?.title) || p?.title?.en || 'Untitled';
export const fail = error => toast(error?.message || t('errorGeneric'), { type: 'error' });
export const ask = (message, danger = true, confirm = t('admDelete')) => confirmDialog({ title: message, confirm, cancel: t('admCancel'), danger });

/** Unsaved-change guard shared across sections. */
export const dirty = { value: false };
addEventListener('beforeunload', e => { if (dirty.value) { e.preventDefault(); e.returnValue = ''; } });
export async function leaveOk() {
  if (!dirty.value) return true;
  const ok = await confirmDialog({ title: t('admUnsaved'), confirm: t('admDiscard'), cancel: t('admCancel'), danger: true });
  if (ok) dirty.value = false;
  return ok;
}

export function csvDownload(filename, rows) {
  const esc = v => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const blob = new Blob(['﻿' + rows.map(r => r.map(esc).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export const waNumber = phone => { const d = String(phone || '').replace(/\D/g, ''); return d.startsWith('880') ? d : d.startsWith('0') ? '88' + d : d; };

import { html, mount } from '/assets/js/core/dom.js';
export const loadingView = view => mount(view, html`<div class="adm-skel"><div class="skeleton adm-skel-block"></div><div class="skeleton adm-skel-block"></div><div class="skeleton adm-skel-block short"></div></div>`);
export function errorView(view, error, retry) {
  mount(view, html`<div class="empty"><h3 class="empty-title">${t('admLoadError')}</h3><p class="empty-text">${error?.message || ''}</p><button class="btn btn-primary" type="button" data-retry>${t('admRetry')}</button></div>`);
  view.querySelector('[data-retry]').addEventListener('click', retry);
}
/** Replaces #adm-view with a clean clone (drops listeners from the previous render). */
export function freshView() {
  const old = document.getElementById('adm-view');
  const next = old.cloneNode(false);
  old.replaceWith(next);
  return next;
}
