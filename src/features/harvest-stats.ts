import type { HarvestEntry } from '@/store/harvest';
import { dayKey } from '@/utils/format';

export interface DaySummary {
  key: string;
  ts: number;
  entries: HarvestEntry[];
  count: number;
  weight: number;
  species: { id: string; count: number }[];
}

/** Groups harvest entries by calendar day (newest first) and sums counts / weights / species. */
export function groupByDay(entries: HarvestEntry[]): DaySummary[] {
  const map = new Map<string, DaySummary>();
  for (const e of entries) {
    const key = dayKey(e.createdAt);
    let d = map.get(key);
    if (!d) {
      d = { key, ts: e.createdAt, entries: [], count: 0, weight: 0, species: [] };
      map.set(key, d);
    }
    d.entries.push(e);
    d.count += e.count;
    d.weight += e.weightKg ?? 0;
    const s = d.species.find((x) => x.id === e.speciesId);
    if (s) s.count += e.count;
    else d.species.push({ id: e.speciesId, count: e.count });
  }
  return [...map.values()].sort((a, b) => b.ts - a.ts).map((d) => ({ ...d, species: d.species.sort((a, b) => b.count - a.count) }));
}

/** Mushroom counts for the last `days` days, oldest → newest. */
export function lastDays(entries: HarvestEntry[], days = 7, now = Date.now()): { key: string; label: string; count: number }[] {
  const names = ['nd', 'pn', 'wt', 'śr', 'cz', 'pt', 'sb'];
  const out: { key: string; label: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const t = now - i * 86400000;
    const key = dayKey(t);
    out.push({ key, label: names[new Date(t).getDay()], count: entries.filter((e) => dayKey(e.createdAt) === key).reduce((s, e) => s + e.count, 0) });
  }
  return out;
}
