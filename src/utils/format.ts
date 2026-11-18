const MONTHS = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec', 'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'];
const MONTHS_IN = ['w styczniu', 'w lutym', 'w marcu', 'w kwietniu', 'w maju', 'w czerwcu', 'w lipcu', 'w sierpniu', 'we wrześniu', 'w październiku', 'w listopadzie', 'w grudniu'];
export const MONTHS_SHORT = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];
const DAYS_SHORT = ['niedz.', 'pon.', 'wt.', 'śr.', 'czw.', 'pt.', 'sob.'];

/** @param m 1–12 */
export const monthName = (m: number) => MONTHS[m - 1];
/** @param m 1–12 — "w listopadzie" */
export const monthIn = (m: number) => MONTHS_IN[m - 1];

const pad = (n: number) => String(n).padStart(2, '0');

export function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function dayLabel(ts: number, now = Date.now()): string {
  const k = dayKey(ts);
  if (k === dayKey(now)) return 'Dziś';
  if (k === dayKey(now - 86400000)) return 'Wczoraj';
  const d = new Date(ts);
  return `${DAYS_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

export function timeAgo(ts: number, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 60) return 'przed chwilą';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min temu`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} godz. temu`;
  const d = Math.round(h / 24);
  if (d < 7) return d === 1 ? 'wczoraj' : `${d} dni temu`;
  const dt = new Date(ts);
  return `${dt.getDate()} ${MONTHS_SHORT[dt.getMonth()]}`;
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Polish plural: plural(5, 'grzyb', 'grzyby', 'grzybów') */
export function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  const t = n % 10;
  const h = n % 100;
  return t >= 2 && t <= 4 && !(h >= 12 && h <= 14) ? few : many;
}

/** Lower-case, strip diacritics (incl. ł) – for searching. */
export function fold(s: string): string {
  let out = s.toLowerCase().replace(/ł/g, 'l');
  try {
    out = out.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  } catch {
    /* normalize() unavailable – keep as is */
  }
  return out;
}
