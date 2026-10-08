// Sign in / create account. ?mode=signup opens the sign-up tab; ?next=/path returns there.
import { boot } from '/assets/js/core/layout.js';
import { extend, t, onLangChange } from '/assets/js/core/i18n.js';
import { html, mount, on, $ } from '/assets/js/core/dom.js';
import { icon, toast, busy } from '/assets/js/core/ui.js';
import { login, register } from '/assets/js/core/auth.js';
import { isBdPhone, normalizePhone } from '/assets/js/core/format.js';
import { track } from '/assets/js/core/analytics.js';

extend({
  en: {
    lgEyebrow: 'Mohor account', lgTitleIn1: 'Welcome', lgTitleIn2: 'back', lgTitleUp1: 'Join', lgTitleUp2: 'Mohor',
    lgLedeIn: 'Sign in to track orders, keep your bag in sync and check out faster.',
    lgLedeUp: 'Create an account to save your details, follow every order and hear about new pieces first.',
    lgTabIn: 'Sign in', lgTabUp: 'Create account', lgEmail: 'Email', lgPassword: 'Password', lgName: 'Full name',
    lgPhone: 'Mobile number (optional)', lgPhoneHint: 'Bangladeshi number, e.g. 01XXXXXXXXX', lgShow: 'Show password', lgHide: 'Hide password',
    lgSubmitIn: 'Sign in', lgSubmitUp: 'Create account', lgNoAccount: "New to Mohor?", lgHaveAccount: 'Already have an account?',
    lgSwitchUp: 'Create an account', lgSwitchIn: 'Sign in', lgForgot: 'Forgot your password? Message us on WhatsApp and we will help.',
    lgErrEmail: 'Please enter a valid email address.', lgErrPassword: 'Please enter your password.',
    lgErrShort: 'Password must be at least 8 characters.', lgErrName: 'Please enter your name.',
    lgErrPhone: 'Please enter a valid Bangladeshi mobile number.',
    lgStrength0: 'At least 8 characters', lgStrength1: 'Weak — add more characters', lgStrength2: 'Fair — mix in numbers or symbols', lgStrength3: 'Strong password',
    lgWelcome: 'Welcome, {name}', lgGuest: 'You can also check out as a guest — no account needed.',
    lgTerms: 'By creating an account you agree to our', lgPolicy: 'policies',
  },
  bn: {
    lgEyebrow: 'মোহর অ্যাকাউন্ট', lgTitleIn1: 'আবার', lgTitleIn2: 'স্বাগতম', lgTitleUp1: 'মোহরে', lgTitleUp2: 'যোগ দিন',
    lgLedeIn: 'অর্ডার ট্র্যাক, ব্যাগ সিঙ্ক আর দ্রুত চেকআউটের জন্য সাইন ইন করুন।',
    lgLedeUp: 'তথ্য সংরক্ষণ, প্রতিটি অর্ডার অনুসরণ আর নতুন কালেকশনের খবর আগে পেতে অ্যাকাউন্ট খুলুন।',
    lgTabIn: 'সাইন ইন', lgTabUp: 'অ্যাকাউন্ট খুলুন', lgEmail: 'ইমেইল', lgPassword: 'পাসওয়ার্ড', lgName: 'পূর্ণ নাম',
    lgPhone: 'মোবাইল নম্বর (ঐচ্ছিক)', lgPhoneHint: 'বাংলাদেশি নম্বর, যেমন 01XXXXXXXXX', lgShow: 'পাসওয়ার্ড দেখুন', lgHide: 'পাসওয়ার্ড লুকান',
    lgSubmitIn: 'সাইন ইন', lgSubmitUp: 'অ্যাকাউন্ট খুলুন', lgNoAccount: 'মোহরে নতুন?', lgHaveAccount: 'আগে থেকেই অ্যাকাউন্ট আছে?',
    lgSwitchUp: 'অ্যাকাউন্ট খুলুন', lgSwitchIn: 'সাইন ইন', lgForgot: 'পাসওয়ার্ড ভুলে গেছেন? হোয়াটসঅ্যাপে মেসেজ দিন, আমরা সাহায্য করব।',
    lgErrEmail: 'সঠিক ইমেইল ঠিকানা দিন।', lgErrPassword: 'পাসওয়ার্ড দিন।',
    lgErrShort: 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।', lgErrName: 'আপনার নাম লিখুন।',
    lgErrPhone: 'সঠিক বাংলাদেশি মোবাইল নম্বর দিন।',
    lgStrength0: 'কমপক্ষে ৮ অক্ষর', lgStrength1: 'দুর্বল — আরও অক্ষর যোগ করুন', lgStrength2: 'মোটামুটি — সংখ্যা বা চিহ্ন মেশান', lgStrength3: 'শক্তিশালী পাসওয়ার্ড',
    lgWelcome: 'স্বাগতম, {name}', lgGuest: 'অ্যাকাউন্ট ছাড়াও গেস্ট হিসেবে চেকআউট করতে পারেন।',
    lgTerms: 'অ্যাকাউন্ট খুলে আপনি আমাদের', lgPolicy: 'নীতিমালায় সম্মত হচ্ছেন',
  },
});

/** Only same-origin absolute paths; never protocol-relative or back to /login. */
function safeNext(value) {
  const v = String(value || '');
  if (!v.startsWith('/') || v.startsWith('//') || v.startsWith('/\\') || /^\/login(\/|\?|$)/.test(v)) return '/account';
  return v;
}

const params = new URLSearchParams(location.search);
const next = safeNext(params.get('next'));
let mode = params.get('mode') === 'signup' ? 'signup' : 'signin';
let showPw = false;
/** @type {Record<string,string>} */ let errors = {};
let formError = '';
/** @type {Record<string,string>} */ const values = { email: '', password: '', name: '', phone: '' };

const user = await boot({ page: 'account' });
if (user) { location.replace(next); await new Promise(() => {}); }

const root = $('#auth-root');
const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

function strength(pw) {
  if (pw.length < 8) return pw.length ? 1 : 0;
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter(r => r.test(pw)).length;
  return pw.length >= 12 || kinds >= 3 ? 3 : 2;
}

const field = (name, label, type, extra = {}) => html`
  <label class="field">
    <span>${label}</span>
    <input class="input" name="${name}" id="f-${name}" type="${type}" value="${values[name]}" autocomplete="${extra.autocomplete || 'on'}"
      ${extra.inputmode ? html`inputmode="${extra.inputmode}"` : ''} ${extra.required ? 'required' : ''}
      aria-invalid="${errors[name] ? 'true' : 'false'}" aria-describedby="e-${name}">
    ${extra.hint && !errors[name] ? html`<small class="field-hint">${extra.hint}</small>` : ''}
    <small class="field-error" id="e-${name}" role="alert">${errors[name] || ''}</small>
  </label>`;

function render() {
  const up = mode === 'signup';
  const s = strength(values.password);
  mount(root, html`
    <header class="auth-head">
      <p class="eyebrow">${t('lgEyebrow')}</p>
      <h1 class="display">${up ? t('lgTitleUp1') : t('lgTitleIn1')} <em>${up ? t('lgTitleUp2') : t('lgTitleIn2')}</em></h1>
      <p class="muted">${up ? t('lgLedeUp') : t('lgLedeIn')}</p>
    </header>
    <div class="panel auth-panel">
      <div class="auth-tabs" role="tablist">
        <button type="button" role="tab" class="auth-tab" data-mode="signin" aria-selected="${!up}">${t('lgTabIn')}</button>
        <button type="button" role="tab" class="auth-tab" data-mode="signup" aria-selected="${up}">${t('lgTabUp')}</button>
      </div>
      <form class="form-grid" id="auth-form" novalidate>
        ${formError ? html`<p class="auth-alert" role="alert">${icon('info', 18)} <span>${formError}</span></p>` : ''}
        ${up ? field('name', t('lgName'), 'text', { autocomplete: 'name', required: true }) : ''}
        ${field('email', t('lgEmail'), 'email', { autocomplete: 'email', inputmode: 'email', required: true })}
        ${up ? field('phone', t('lgPhone'), 'tel', { autocomplete: 'tel', inputmode: 'tel', hint: t('lgPhoneHint') }) : ''}
        <label class="field">
          <span>${t('lgPassword')}</span>
          <span class="pw-wrap">
            <input class="input" name="password" id="f-password" type="${showPw ? 'text' : 'password'}" value="${values.password}" required minlength="${up ? 8 : 1}"
              autocomplete="${up ? 'new-password' : 'current-password'}" aria-invalid="${errors.password ? 'true' : 'false'}" aria-describedby="e-password pw-meter">
            <button type="button" class="icon-btn pw-toggle" data-toggle-pw aria-pressed="${showPw}" aria-label="${showPw ? t('lgHide') : t('lgShow')}">${icon('eye', 20)}</button>
          </span>
          ${up ? html`<span class="pw-meter" id="pw-meter" data-level="${s}" aria-live="polite"><i></i><i></i><i></i><small>${t('lgStrength' + s)}</small></span>` : ''}
          <small class="field-error" id="e-password" role="alert">${errors.password || ''}</small>
        </label>
        <button class="btn btn-primary btn-block btn-lg" type="submit">${up ? t('lgSubmitUp') : t('lgSubmitIn')}</button>
        ${up ? html`<p class="field-hint center">${t('lgTerms')} <a class="link" href="/policy#terms">${t('lgPolicy')}</a>.</p>`
          : html`<p class="field-hint center">${t('lgForgot')}</p>`}
      </form>
      <p class="auth-switch">${up ? t('lgHaveAccount') : t('lgNoAccount')}
        <button type="button" class="link" data-mode="${up ? 'signin' : 'signup'}">${up ? t('lgSwitchIn') : t('lgSwitchUp')}</button></p>
    </div>
    <p class="muted center auth-guest">${t('lgGuest')}</p>`);
}

function setMode(m) {
  if (m === mode) return;
  mode = m; errors = {}; formError = '';
  const url = new URL(location.href);
  if (m === 'signup') url.searchParams.set('mode', 'signup'); else url.searchParams.delete('mode');
  history.replaceState(null, '', url);
  document.title = `${m === 'signup' ? t('lgTabUp') : t('lgTabIn')} — Mohor`;
  render();
  $(`#f-${m === 'signup' ? 'name' : 'email'}`)?.focus();
}

function validate() {
  errors = {};
  if (!isEmail(values.email)) errors.email = t('lgErrEmail');
  if (!values.password) errors.password = t('lgErrPassword');
  else if (mode === 'signup' && values.password.length < 8) errors.password = t('lgErrShort');
  if (mode === 'signup') {
    if (!values.name.trim()) errors.name = t('lgErrName');
    if (values.phone.trim() && !isBdPhone(values.phone)) errors.phone = t('lgErrPhone');
  }
  return !Object.keys(errors).length;
}

on(root, 'click', '[data-mode]', (e, btn) => setMode(btn.dataset.mode));
on(root, 'click', '[data-toggle-pw]', () => {
  showPw = !showPw;
  const input = /** @type {HTMLInputElement} */ ($('#f-password'));
  input.type = showPw ? 'text' : 'password';
  const btn = $('[data-toggle-pw]');
  btn.setAttribute('aria-pressed', String(showPw));
  btn.setAttribute('aria-label', showPw ? t('lgHide') : t('lgShow'));
  input.focus();
});
on(root, 'input', 'input', (e, input) => {
  values[input.name] = input.value;
  if (errors[input.name]) { delete errors[input.name]; input.setAttribute('aria-invalid', 'false'); const el = $(`#e-${input.name}`); if (el) el.textContent = ''; }
  if (input.name === 'password' && mode === 'signup') {
    const meter = $('#pw-meter'); const s = strength(input.value);
    if (meter) { meter.dataset.level = String(s); meter.querySelector('small').textContent = t('lgStrength' + s); }
  }
});
on(root, 'submit', '#auth-form', async (e, form) => {
  e.preventDefault();
  new FormData(form).forEach((v, k) => { values[k] = String(v); });
  formError = '';
  if (!validate()) { render(); $('[aria-invalid="true"]', root)?.focus(); return; }
  const restore = busy(form.querySelector('[type=submit]'));
  try {
    const u = mode === 'signup'
      ? await register({ name: values.name.trim(), email: values.email.trim(), phone: values.phone.trim() ? normalizePhone(values.phone) : '', password: values.password })
      : await login(values.email.trim(), values.password);
    track(mode === 'signup' ? 'CompleteRegistration' : 'Login');
    toast(t('lgWelcome', { name: u?.name || u?.email || '' }), { type: 'success' });
    location.replace(next);
  } catch (error) {
    restore();
    formError = error?.status === 429 ? (error.message || t('errorGeneric')) : (error?.message || t('errorGeneric'));
    if (error?.status === 409) mode = 'signin';
    values.password = mode === 'signup' ? values.password : '';
    render();
    $('#f-password')?.focus();
  }
});

render();
onLangChange(render);
