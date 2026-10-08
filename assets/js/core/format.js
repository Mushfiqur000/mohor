import { getLang } from './i18n.js';

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
export const toBnDigits = value => String(value).replace(/\d/g, d => BN_DIGITS[d]);

/** ৳1,250 (or ৳১,২৫০ in Bangla). */
export function money(amount) {
  const formatted = Math.round(Number(amount) || 0).toLocaleString('en-IN');
  return `৳${getLang() === 'bn' ? toBnDigits(formatted) : formatted}`;
}

export const number = value => (getLang() === 'bn' ? toBnDigits(value) : String(value));

export function date(value, options = { day: 'numeric', month: 'short', year: 'numeric' }) {
  const time = Date.parse(value || '');
  if (!time) return '—';
  return new Intl.DateTimeFormat(getLang() === 'bn' ? 'bn-BD' : 'en-GB', { timeZone: 'Asia/Dhaka', ...options }).format(time);
}

export const dateTime = value => date(value, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

export function relativeTime(value) {
  const diff = (Date.parse(value || '') || Date.now()) - Date.now();
  const rtf = new Intl.RelativeTimeFormat(getLang() === 'bn' ? 'bn' : 'en', { numeric: 'auto' });
  const units = [['year', 31536e6], ['month', 2592e6], ['day', 864e5], ['hour', 36e5], ['minute', 6e4]];
  for (const [unit, ms] of units) if (Math.abs(diff) >= ms) return rtf.format(Math.round(diff / ms), unit);
  return rtf.format(0, 'minute');
}

export const normalizePhone = value => {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.startsWith('880') && digits.length === 13 ? '0' + digits.slice(3) : digits;
};
export const isBdPhone = value => /^01[3-9]\d{8}$/.test(normalizePhone(value));
