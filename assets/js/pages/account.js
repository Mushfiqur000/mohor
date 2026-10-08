// Account: profile, notifications, recent orders, preferences and security.
import { boot, applyTheme } from '/assets/js/core/layout.js';
import { extend, t, onLangChange, getLang, setLang } from '/assets/js/core/i18n.js';
import { html, mount, on, $, safeUrl } from '/assets/js/core/dom.js';
import { icon, toast, busy, confirmDialog, sheet } from '/assets/js/core/ui.js';
import { requireSignIn, session, updateProfile, changePassword, logout, logoutEverywhere, deleteAccount } from '/assets/js/core/auth.js';
import { api } from '/assets/js/core/api.js';
import { money, date, relativeTime, isBdPhone, number } from '/assets/js/core/format.js';

extend({
  en: {
    acEyebrow: 'Your account', acHello: 'Hello,', acMember: 'Member since {d}', acAdmin: 'Open admin dashboard',
    acNavProfile: 'Profile', acNavNotes: 'Notifications', acNavOrders: 'Orders', acNavPrefs: 'Preferences', acNavSecurity: 'Security',
    acProfile: 'Profile & delivery details', acProfileHint: 'Saved details pre-fill checkout.',
    acName: 'Full name', acEmail: 'Email', acPhone: 'Mobile number', acGender: 'Gender', acDob: 'Date of birth',
    acGenderNone: 'Prefer not to say', acFemale: 'Female', acMale: 'Male', acOther: 'Other',
    acAddress: 'Delivery address', acAddressPh: 'House, road, area, city', acZone: 'Delivery zone',
    acZoneInside: 'Inside Sylhet City · ৳70', acZoneOutside: 'Outside Sylhet City · ৳140',
    acSave: 'Save details', acSaved: 'Your details are saved', acErrName: 'Please enter your name.', acErrPhone: 'Please enter a valid Bangladeshi mobile number.',
    acNotes: 'Notifications', acMarkAll: 'Mark all read', acNoNotes: 'No notifications yet. Order updates will appear here.',
    acNotesError: 'Could not load notifications.', acUnread: '{n} unread', acOpen: 'Open',
    acOrders: 'Recent orders', acAllOrders: 'View all orders', acNoOrders: 'You have not placed an order yet.', acShop: 'Start shopping',
    acOrdersError: 'Could not load your orders.', acItems: '{n} items',
    acPrefs: 'Preferences', acLanguage: 'Language', acTheme: 'Appearance', acSystem: 'System', acLight: 'Light', acDark: 'Dark',
    acSecurity: 'Password & security', acPassword: 'Password', acCurrent: 'Current password', acNew: 'New password', acConfirm: 'Confirm new password',
    acChange: 'Change password', acChanged: 'Password changed. Other devices were signed out.',
    acErrShort: 'New password must be at least 8 characters.', acErrMatch: 'Passwords do not match.', acErrCurrent: 'Enter your current password.',
    acSignOut: 'Sign out', acSignOutAll: 'Sign out everywhere', acSignOutAllQ: 'Sign out of all devices?',
    acSignOutAllText: 'You will be signed out here and on every other phone or computer.', acSignedOut: 'You have been signed out.',
    acDanger: 'Delete account', acDangerText: 'Permanently delete your account. Your past orders remain with us for records.',
    acDeleteQ: 'Delete your account?', acDeleteText: 'This cannot be undone. Enter your password to confirm.',
    acDeleteConfirm: 'Delete permanently', acDeleted: 'Your account has been deleted.', acAdminNoDelete: 'The admin account cannot be deleted.',
    acHelp: 'Need help with an order?', acHelpText: 'Message us on WhatsApp — we reply within minutes.',
  },
  bn: {
    acEyebrow: 'আপনার অ্যাকাউন্ট', acHello: 'হ্যালো,', acMember: '{d} থেকে সদস্য', acAdmin: 'অ্যাডমিন ড্যাশবোর্ড খুলুন',
    acNavProfile: 'প্রোফাইল', acNavNotes: 'নোটিফিকেশন', acNavOrders: 'অর্ডার', acNavPrefs: 'পছন্দ', acNavSecurity: 'নিরাপত্তা',
    acProfile: 'প্রোফাইল ও ডেলিভারি তথ্য', acProfileHint: 'সংরক্ষিত তথ্য চেকআউটে আগে থেকে বসে যাবে।',
    acName: 'পূর্ণ নাম', acEmail: 'ইমেইল', acPhone: 'মোবাইল নম্বর', acGender: 'লিঙ্গ', acDob: 'জন্মতারিখ',
    acGenderNone: 'বলতে চাই না', acFemale: 'নারী', acMale: 'পুরুষ', acOther: 'অন্যান্য',
    acAddress: 'ডেলিভারি ঠিকানা', acAddressPh: 'বাসা, রোড, এলাকা, শহর', acZone: 'ডেলিভারি এলাকা',
    acZoneInside: 'সিলেট সিটির ভেতরে · ৳৭০', acZoneOutside: 'সিলেট সিটির বাইরে · ৳১৪০',
    acSave: 'তথ্য সংরক্ষণ করুন', acSaved: 'আপনার তথ্য সংরক্ষিত হয়েছে', acErrName: 'আপনার নাম লিখুন।', acErrPhone: 'সঠিক বাংলাদেশি মোবাইল নম্বর দিন।',
    acNotes: 'নোটিফিকেশন', acMarkAll: 'সব পড়া হয়েছে', acNoNotes: 'এখনো কোনো নোটিফিকেশন নেই। অর্ডারের আপডেট এখানে আসবে।',
    acNotesError: 'নোটিফিকেশন লোড করা যায়নি।', acUnread: '{n}টি অপঠিত', acOpen: 'খুলুন',
    acOrders: 'সাম্প্রতিক অর্ডার', acAllOrders: 'সব অর্ডার দেখুন', acNoOrders: 'আপনি এখনো কোনো অর্ডার করেননি।', acShop: 'কেনাকাটা শুরু করুন',
    acOrdersError: 'আপনার অর্ডার লোড করা যায়নি।', acItems: '{n}টি পণ্য',
    acPrefs: 'পছন্দসমূহ', acLanguage: 'ভাষা', acTheme: 'থিম', acSystem: 'সিস্টেম', acLight: 'লাইট', acDark: 'ডার্ক',
    acSecurity: 'পাসওয়ার্ড ও নিরাপত্তা', acPassword: 'পাসওয়ার্ড', acCurrent: 'বর্তমান পাসওয়ার্ড', acNew: 'নতুন পাসওয়ার্ড', acConfirm: 'নতুন পাসওয়ার্ড আবার দিন',
    acChange: 'পাসওয়ার্ড বদলান', acChanged: 'পাসওয়ার্ড বদলানো হয়েছে। অন্য ডিভাইস থেকে সাইন আউট করা হয়েছে।',
    acErrShort: 'নতুন পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।', acErrMatch: 'পাসওয়ার্ড মিলছে না।', acErrCurrent: 'বর্তমান পাসওয়ার্ড দিন।',
    acSignOut: 'সাইন আউট', acSignOutAll: 'সব ডিভাইস থেকে সাইন আউট', acSignOutAllQ: 'সব ডিভাইস থেকে সাইন আউট করবেন?',
    acSignOutAllText: 'এখানে এবং অন্য সব ফোন বা কম্পিউটারে সাইন আউট হয়ে যাবে।', acSignedOut: 'আপনি সাইন আউট করেছেন।',
    acDanger: 'অ্যাকাউন্ট মুছুন', acDangerText: 'অ্যাকাউন্ট স্থায়ীভাবে মুছে ফেলুন। রেকর্ডের জন্য পুরোনো অর্ডার আমাদের কাছে থাকবে।',
    acDeleteQ: 'অ্যাকাউন্ট মুছে ফেলবেন?', acDeleteText: 'এটি আর ফেরানো যাবে না। নিশ্চিত করতে পাসওয়ার্ড দিন।',
    acDeleteConfirm: 'স্থায়ীভাবে মুছুন', acDeleted: 'আপনার অ্যাকাউন্ট মুছে ফেলা হয়েছে।', acAdminNoDelete: 'অ্যাডমিন অ্যাকাউন্ট মোছা যায় না।',
    acHelp: 'অর্ডার নিয়ে সাহায্য লাগবে?', acHelpText: 'হোয়াটসঅ্যাপে মেসেজ দিন — কয়েক মিনিটেই উত্তর দিই।',
  },
});

const ZONE_KEY = 'mohor:zone';
const THEME_KEY = 'mohor:theme';
const read = k => { try { return localStorage.getItem(k) || ''; } catch { return ''; } };
const write = (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch { /* ignore */ } };

/** Legacy links like /order/?id=X or /order-history/ → clean URLs. */
export function normaliseLink(link) {
  let v = String(link || '').trim();
  if (!v) return '';
  try { const u = new URL(v, location.origin); if (u.origin === location.origin) v = u.pathname + u.search + u.hash; } catch { return ''; }
  v = v.replace(/^([^?#]*?)\.html(?=[?#]|$)/, '$1').replace(/^(\/[^?#]*?)\/+(?=[?#]|$)/, '$1');
  v = v.replace(/^\/order-history(?=[?#]|$)/, '/orders').replace(/^\/order-success(?=[?#]|$)/, '/order');
  return safeUrl(v, '');
}

await boot({ page: 'account' });
let user = await requireSignIn();
const root = $('#account-root');
let leaving = false;

/** @type {{ status: 'loading'|'ready'|'error', list: any[] }} */
const notes = { status: 'loading', list: [] };
/** @type {{ status: 'loading'|'ready'|'error', list: any[] }} */
const orders = { status: 'loading', list: [] };
/** @type {Record<string,string>} */ let profileErrors = {};
/** @type {Record<string,string>} */ let pwErrors = {};

const val = (form, name) => String(new FormData(form).get(name) ?? '').trim();
const err = (map, key) => html`<small class="field-error" id="e-${key}" role="alert">${map[key] || ''}</small>`;
const ivalid = (map, key) => html`aria-invalid="${map[key] ? 'true' : 'false'}" aria-describedby="e-${key}"`;
const initials = u => (u.name || u.email || 'M').trim().split(/\s+/).slice(0, 2).map(s => s[0]).join('').toUpperCase();

function notesBlock() {
  if (notes.status === 'loading') return html`<div class="skeleton acc-skel-sm"></div><div class="skeleton acc-skel-sm"></div>`;
  if (notes.status === 'error') return html`<p class="muted">${t('acNotesError')} <button class="link" type="button" data-reload="notes">${t('retry')}</button></p>`;
  if (!notes.list.length) return html`<p class="muted acc-empty">${icon('bell', 18)} ${t('acNoNotes')}</p>`;
  return html`<ul class="notes">${notes.list.slice(0, 20).map(n => {
    const link = normaliseLink(n.link);
    return html`<li class="note${n.is_read ? '' : ' is-unread'}">
      <div class="note-body"><p class="note-title">${n.title || ''}</p>${n.message ? html`<p class="note-text">${n.message}</p>` : ''}
        <p class="note-time">${relativeTime(n.created_at || n.createdAt)}</p></div>
      <div class="note-actions">
        ${link ? html`<a class="btn btn-ghost btn-sm" href="${link}" data-note-open="${n.id}">${t('acOpen')}</a>` : ''}
        ${n.is_read ? '' : html`<button class="icon-btn" type="button" data-note-read="${n.id}" aria-label="${t('acMarkAll')}">${icon('check', 18)}</button>`}
      </div></li>`;
  })}</ul>`;
}

function ordersBlock() {
  if (orders.status === 'loading') return html`<div class="skeleton acc-skel-sm"></div><div class="skeleton acc-skel-sm"></div>`;
  if (orders.status === 'error') return html`<p class="muted">${t('acOrdersError')} <button class="link" type="button" data-reload="orders">${t('retry')}</button></p>`;
  if (!orders.list.length) return html`<p class="muted acc-empty">${icon('package', 18)} ${t('acNoOrders')}</p><a class="btn btn-primary btn-sm" href="/shop">${t('acShop')}</a>`;
  return html`<ul class="acc-orders">${orders.list.slice(0, 3).map(o => {
    const status = String(o.status || 'Pending');
    const n = (o.items || []).reduce((s, i) => s + (Number(i.qty ?? i.quantity) || 1), 0);
    return html`<li><a class="acc-order" href="/order?id=${encodeURIComponent(o.id)}">
      <span><b>#${o.id}</b><small class="muted">${date(o.createdAt)} · ${t('acItems', { n: number(n) })}</small></span>
      <span class="acc-order-end"><span class="status status-${status.toLowerCase()}">${status}</span><b>${money(o.totalAmount)}</b></span>
    </a></li>`;
  })}</ul><a class="link" href="/orders">${t('acAllOrders')} →</a>`;
}

function render() {
  const u = user;
  const zone = read(ZONE_KEY);
  const theme = read(THEME_KEY);
  const unread = notes.list.filter(n => !n.is_read).length;
  const sel = (a, b) => (a === b ? 'selected' : '');
  const chk = (a, b) => (a === b ? 'checked' : '');
  mount(root, html`
    <header class="page-head acc-head">
      <span class="acc-avatar" aria-hidden="true">${initials(u)}</span>
      <div>
        <p class="eyebrow">${t('acEyebrow')}</p>
        <h1 class="display">${t('acHello')} <em>${(u.name || '').split(' ')[0] || u.email}</em></h1>
        <p class="muted">${u.email}${u.createdAt ? html` · ${t('acMember', { d: date(u.createdAt, { month: 'long', year: 'numeric' }) })}` : ''}</p>
        ${u.role === 'admin' ? html`<a class="btn btn-ink btn-sm acc-admin" href="/admin">${icon('shield', 16)} ${t('acAdmin')}</a>` : ''}
      </div>
    </header>
    ${unread ? html`<button class="acc-notice" type="button" data-scroll-notifications>
      ${icon('bell', 22)} <span><b>${t('acUnread', { n: number(unread) })}</b><small>${notes.list.find(n => !n.is_read)?.title || t('acNotes')}</small></span>
      <span class="acc-notice-arrow">${t('acOpen')}</span>
    </button>` : ''}
    <nav class="chip-row acc-nav" aria-label="${t('acEyebrow')}">
      <a class="chip" href="#profile">${t('acNavProfile')}</a>
      <a class="chip" href="#notifications">${t('acNavNotes')}${unread ? html` <span class="badge badge-sale">${number(unread)}</span>` : ''}</a>
      <a class="chip" href="#orders">${t('acNavOrders')}</a>
      <a class="chip" href="#preferences">${t('acNavPrefs')}</a>
      <a class="chip" href="#security">${t('acNavSecurity')}</a>
    </nav>
    <div class="acc-grid">
      <section class="panel" id="notifications">
        <div class="acc-panel-head"><h2 class="panel-title">${t('acNotes')}${unread ? html` <small class="muted">${t('acUnread', { n: number(unread) })}</small>` : ''}</h2>
          ${unread ? html`<button class="btn btn-ghost btn-sm" type="button" data-mark-all>${t('acMarkAll')}</button>` : ''}</div>
        ${notesBlock()}
      </section>
      <section class="panel" id="orders">
        <div class="acc-panel-head"><h2 class="panel-title">${t('acOrders')}</h2></div>
        ${ordersBlock()}
      </section>
      <section class="panel acc-wide" id="profile">
        <h2 class="panel-title">${t('acProfile')}</h2><p class="field-hint acc-hint">${t('acProfileHint')}</p>
        <form class="form-grid cols-2" id="profile-form" novalidate>
          <label class="field"><span>${t('acName')}</span><input class="input" name="name" value="${u.name}" autocomplete="name" required ${ivalid(profileErrors, 'name')}>${err(profileErrors, 'name')}</label>
          <label class="field"><span>${t('acEmail')}</span><input class="input" value="${u.email}" disabled></label>
          <label class="field"><span>${t('acPhone')}</span><input class="input" name="phone" type="tel" inputmode="tel" value="${u.phone}" autocomplete="tel" placeholder="01XXXXXXXXX" ${ivalid(profileErrors, 'phone')}>${err(profileErrors, 'phone')}</label>
          <label class="field"><span>${t('acGender')}</span><select class="select input" name="gender">
            <option value="" ${sel(u.gender, '')}>${t('acGenderNone')}</option><option value="Female" ${sel(u.gender, 'Female')}>${t('acFemale')}</option>
            <option value="Male" ${sel(u.gender, 'Male')}>${t('acMale')}</option><option value="Other" ${sel(u.gender, 'Other')}>${t('acOther')}</option></select></label>
          <label class="field"><span>${t('acDob')}</span><input class="input" name="dob" type="date" value="${u.dob}" max="${new Date().toISOString().slice(0, 10)}"></label>
          <div class="field"><span>${t('acZone')}</span><div class="segmented">
            <label><input type="radio" name="zone" value="inside" ${chk(zone, 'inside')}>${t('acZoneInside')}</label>
            <label><input type="radio" name="zone" value="outside" ${chk(zone, 'outside')}>${t('acZoneOutside')}</label></div></div>
          <label class="field span-2"><span>${t('acAddress')}</span><textarea class="textarea" name="address" rows="3" autocomplete="street-address" placeholder="${t('acAddressPh')}">${u.address}</textarea></label>
          <div class="span-2"><button class="btn btn-primary" type="submit">${t('acSave')}</button></div>
        </form>
      </section>
      <section class="panel" id="preferences">
        <h2 class="panel-title">${t('acPrefs')}</h2>
        <div class="form-grid">
          <div class="field"><span>${t('acLanguage')}</span><div class="segmented" data-pref="lang">
            <label><input type="radio" name="pref-lang" value="en" ${chk(getLang(), 'en')}>English</label>
            <label><input type="radio" name="pref-lang" value="bn" ${chk(getLang(), 'bn')}>বাংলা</label></div></div>
          <div class="field"><span>${t('acTheme')}</span><div class="segmented" data-pref="theme">
            <label><input type="radio" name="pref-theme" value="" ${chk(theme, '')}>${t('acSystem')}</label>
            <label><input type="radio" name="pref-theme" value="light" ${chk(theme, 'light')}>${t('acLight')}</label>
            <label><input type="radio" name="pref-theme" value="dark" ${chk(theme, 'dark')}>${t('acDark')}</label></div></div>
        </div>
        <hr class="rule">
        <p class="acc-help"><b>${t('acHelp')}</b> <span class="muted">${t('acHelpText')}</span></p>
        <button class="btn btn-wa btn-sm" type="button" data-open="support">${icon('whatsapp', 16)} ${t('supportWhatsapp')}</button>
      </section>
      <section class="panel" id="security">
        <h2 class="panel-title">${t('acSecurity')}</h2>
        <form class="form-grid" id="pw-form" novalidate>
          <input type="text" name="username" value="${u.email}" autocomplete="username" hidden>
          <label class="field"><span>${t('acCurrent')}</span><input class="input" type="password" name="current" autocomplete="current-password" ${ivalid(pwErrors, 'current')}>${err(pwErrors, 'current')}</label>
          <label class="field"><span>${t('acNew')}</span><input class="input" type="password" name="next" autocomplete="new-password" minlength="8" ${ivalid(pwErrors, 'next')}>${err(pwErrors, 'next')}</label>
          <label class="field"><span>${t('acConfirm')}</span><input class="input" type="password" name="confirm" autocomplete="new-password" ${ivalid(pwErrors, 'confirm')}>${err(pwErrors, 'confirm')}</label>
          <button class="btn btn-ink" type="submit">${t('acChange')}</button>
        </form>
        <hr class="rule">
        <div class="acc-signout">
          <button class="btn btn-ghost" type="button" data-signout>${icon('logout', 18)} ${t('acSignOut')}</button>
          <button class="btn btn-ghost" type="button" data-signout-all>${t('acSignOutAll')}</button>
        </div>
        ${u.role === 'admin' ? '' : html`<div class="acc-danger"><h3 class="h3">${t('acDanger')}</h3><p class="muted">${t('acDangerText')}</p>
          <button class="btn btn-ghost acc-danger-btn" type="button" data-delete>${icon('trash', 18)} ${t('acDanger')}</button></div>`}
      </section>
    </div>`);
  root.removeAttribute('aria-busy');
}

async function loadNotes() {
  notes.status = 'loading'; render();
  try { notes.list = (await api.get('/api/notifications')).notifications || []; notes.status = 'ready'; } catch { notes.status = 'error'; }
  render();
}
async function loadOrders() {
  orders.status = 'loading'; render();
  try { orders.list = (await api.get('/api/orders')).orders || []; orders.status = 'ready'; } catch { orders.status = 'error'; }
  render();
}
const markRead = id => api.post('/api/notifications/mark-read', id ? { notificationId: id } : { markAll: true });

on(root, 'click', '[data-reload]', (e, b) => (b.dataset.reload === 'notes' ? loadNotes() : loadOrders()));
on(root, 'click', '[data-scroll-notifications]', () => $('#notifications')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
on(root, 'click', '[data-mark-all]', async (e, b) => {
  const restore = busy(b);
  try { await markRead(); notes.list = notes.list.map(n => ({ ...n, is_read: true })); render(); }
  catch (error) { restore(); toast(error.message || t('errorGeneric'), { type: 'error' }); }
});
on(root, 'click', '[data-note-read]', async (e, b) => {
  const id = b.dataset.noteRead;
  notes.list = notes.list.map(n => (String(n.id) === id ? { ...n, is_read: true } : n)); render();
  markRead(id).catch(() => {});
});
on(root, 'click', '[data-note-open]', (e, a) => {
  const n = notes.list.find(x => String(x.id) === a.dataset.noteOpen);
  if (n && !n.is_read) { e.preventDefault(); markRead(n.id).catch(() => {}).finally(() => { location.href = a.getAttribute('href'); }); }
});

on(root, 'submit', '#profile-form', async (e, form) => {
  e.preventDefault();
  const data = { name: val(form, 'name'), phone: val(form, 'phone'), gender: val(form, 'gender'), dob: val(form, 'dob'), address: val(form, 'address') };
  profileErrors = {};
  if (!data.name) profileErrors.name = t('acErrName');
  if (data.phone && !isBdPhone(data.phone)) profileErrors.phone = t('acErrPhone');
  const zone = val(form, 'zone');
  if (Object.keys(profileErrors).length) { user = { ...user, ...data }; render(); $('#profile [aria-invalid="true"]')?.focus(); return; }
  const restore = busy(form.querySelector('[type=submit]'));
  try {
    user = await updateProfile(data);
    write(ZONE_KEY, zone);
    toast(t('acSaved'), { type: 'success' });
    render();
  } catch (error) { restore(); toast(error.message || t('errorGeneric'), { type: 'error' }); }
});

on(root, 'change', '[data-pref] input', (e, input) => {
  if (input.name === 'pref-lang') setLang(input.value);
  else { write(THEME_KEY, input.value); applyTheme(input.value); }
});

on(root, 'submit', '#pw-form', async (e, form) => {
  e.preventDefault();
  const current = String(new FormData(form).get('current') || '');
  const next = String(new FormData(form).get('next') || '');
  const confirm = String(new FormData(form).get('confirm') || '');
  pwErrors = {};
  if (!current) pwErrors.current = t('acErrCurrent');
  if (next.length < 8) pwErrors.next = t('acErrShort');
  else if (next !== confirm) pwErrors.confirm = t('acErrMatch');
  if (Object.keys(pwErrors).length) { render(); $('#security [aria-invalid="true"]')?.focus(); return; }
  const restore = busy(form.querySelector('[type=submit]'));
  try { await changePassword(current, next); form.reset(); restore(); toast(t('acChanged'), { type: 'success' }); }
  catch (error) {
    restore();
    pwErrors = { current: error.message || t('errorGeneric') };
    render(); $('#security [name=current]')?.focus();
  }
});

on(root, 'click', '[data-signout]', () => { leaving = true; logout(); toast(t('acSignedOut')); location.replace('/'); });
on(root, 'click', '[data-signout-all]', async (e, b) => {
  if (!(await confirmDialog({ title: t('acSignOutAllQ'), message: t('acSignOutAllText'), confirm: t('acSignOutAll'), danger: true }))) return;
  const restore = busy(b);
  try { leaving = true; await logoutEverywhere(); location.replace('/login'); } catch (error) { leaving = false; restore(); toast(error.message || t('errorGeneric'), { type: 'error' }); }
});
on(root, 'click', '[data-delete]', async () => {
  if (user.role === 'admin') { toast(t('acAdminNoDelete'), { type: 'error' }); return; }
  if (!(await confirmDialog({ title: t('acDeleteQ'), message: t('acDeleteText'), confirm: t('acDeleteConfirm'), danger: true }))) return;
  // Second step: password entry in a centred sheet.
  const s = sheet({ side: 'center', className: 'sheet-confirm', label: t('acDeleteQ'),
    body: html`<form class="form-grid" id="delete-form" novalidate>
      <h2 class="confirm-title">${t('acDeleteQ')}</h2><p class="confirm-text">${t('acDeleteText')}</p>
      <input type="text" value="${user.email}" autocomplete="username" hidden>
      <label class="field"><span>${t('acPassword')}</span>
        <input class="input" type="password" name="password" autocomplete="current-password" required aria-describedby="e-del"></label>
      <small class="field-error" id="e-del" role="alert"></small>
      <div class="confirm-actions"><button class="btn btn-ghost" type="button" data-close>${t('close')}</button>
        <button class="btn btn-danger" type="submit">${t('acDeleteConfirm')}</button></div></form>`,
    onClose: () => s.el.remove() });
  s.open();
  const form = /** @type {HTMLFormElement} */ (s.el.querySelector('#delete-form'));
  form.querySelector('input[name=password]').focus();
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const password = String(new FormData(form).get('password') || '');
    const errEl = form.querySelector('#e-del');
    if (!password) { errEl.textContent = t('acErrCurrent'); return; }
    const restore = busy(form.querySelector('[type=submit]'));
    try { leaving = true; await deleteAccount(password); s.close(); toast(t('acDeleted')); setTimeout(() => location.replace('/'), 600); }
    catch (error) { leaving = false; restore(); errEl.textContent = error.message || t('errorGeneric'); }
  });
});

session.subscribe(u => { if (!u && !leaving) location.replace(`/login?next=${encodeURIComponent('/account')}`); });
onLangChange(render);
render();
loadNotes();
loadOrders();
