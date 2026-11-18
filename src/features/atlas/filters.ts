import type { Edibility, Habitat, Mushroom, Underside } from '@/data/types';
import { fold } from '@/utils/format';

export interface AtlasFilters {
  query: string;
  edibility: Edibility | 'all';
  under: Underside | 'all';
  habitat: Habitat | 'all';
  season: boolean;
  easy: boolean;
}

export const DEFAULT_FILTERS: AtlasFilters = { query: '', edibility: 'all', under: 'all', habitat: 'all', season: false, easy: false };

export function applyFilters(list: Mushroom[], f: AtlasFilters, month = new Date().getMonth() + 1): Mushroom[] {
  const q = fold(f.query.trim());
  return list.filter((m) => {
    if (q && !fold(`${m.name} ${m.aka ?? ''} ${m.latin}`).includes(q)) return false;
    if (f.edibility !== 'all' && m.edibility !== f.edibility) return false;
    if (f.under !== 'all' && m.under !== f.under) return false;
    if (f.habitat !== 'all' && !m.habitats.includes(f.habitat)) return false;
    if (f.season && !m.months.includes(month)) return false;
    if (f.easy && m.difficulty !== 1) return false;
    return true;
  });
}

/** Number of active "trait" filters (shown on the Filters button). */
export const advancedCount = (f: AtlasFilters) => (f.under !== 'all' ? 1 : 0) + (f.habitat !== 'all' ? 1 : 0) + (f.season ? 1 : 0) + (f.easy ? 1 : 0);

export const isFiltered = (f: AtlasFilters) => f.query.trim() !== '' || f.edibility !== 'all' || advancedCount(f) > 0;
