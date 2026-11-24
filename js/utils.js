/* Small shared helpers */

export function pad(n) { return String(n).padStart(2, '0'); }

export function dateKey(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayKey() { return dateKey(new Date()); }

export function daysBack(n, from = new Date()) {
  const d = new Date(from);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function weekday(d, long = false) {
  return (long ? WEEKDAYS_LONG : WEEKDAYS)[d.getDay()];
}

export function shortDate(d) { return `${d.getDate()} ${MONTHS[d.getMonth()]}`; }

export function niceNumber(n, digits = 1) {
  if (!isFinite(n)) return '0';
  if (Math.abs(n) >= 1000) return n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  return n.toLocaleString('en-IN', { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}

export function money(n, digits = 2) {
  return '₹' + (isFinite(n) ? n : 0).toLocaleString('en-IN', {
    minimumFractionDigits: digits, maximumFractionDigits: digits
  });
}

export function uid(prefix = 'a') {
  return prefix + '_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
}

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}

export function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

export function timeAgo(ts) {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

export function pct(part, total) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}
