import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchJson } from './http';

export interface OccCell {
  lat: number; // south-west corner
  lng: number;
  n: number;
}
export interface OccData {
  total: number; // all matching records in Poland (GBIF count)
  sample: number; // records used to draw the grid
  cells: OccCell[];
  maxN: number;
  fetchedAt: number;
}

export const CELL_LAT = 0.2;
export const CELL_LNG = 0.3;
const MAX_AGE = 14 * 24 * 3600 * 1000;

interface GbifPage {
  count: number;
  results: { decimalLatitude?: number; decimalLongitude?: number }[];
}

const url = (name: string, offset: number) =>
  'https://api.gbif.org/v1/occurrence/search' +
  `?scientificName=${encodeURIComponent(name)}&country=PL&hasCoordinate=true&hasGeospatialIssue=false` +
  `&occurrenceStatus=PRESENT&limit=300&offset=${offset}`;

function aggregate(points: [number, number][], total: number): OccData {
  const grid = new Map<string, OccCell>();
  for (const [lat, lng] of points) {
    const i = Math.floor(lat / CELL_LAT);
    const j = Math.floor(lng / CELL_LNG);
    const k = `${i}:${j}`;
    const cell = grid.get(k);
    if (cell) cell.n += 1;
    else grid.set(k, { lat: i * CELL_LAT, lng: j * CELL_LNG, n: 1 });
  }
  const cells = [...grid.values()];
  return { total, sample: points.length, cells, maxN: cells.reduce((m, c) => Math.max(m, c.n), 1), fetchedAt: Date.now() };
}

export async function readCachedOccurrences(latin: string): Promise<OccData | null> {
  try {
    const raw = await AsyncStorage.getItem(`occ:v1:${latin}`);
    return raw ? (JSON.parse(raw) as OccData) : null;
  } catch {
    return null;
  }
}

/**
 * Real observations of a species in Poland from GBIF (free, keyless API),
 * aggregated into a grid and cached for offline use.
 */
export async function getOccurrences(latin: string, online: boolean): Promise<{ data: OccData; cached: boolean } | null> {
  const cached = await readCachedOccurrences(latin);
  if (cached && (!online || Date.now() - cached.fetchedAt < MAX_AGE)) return { data: cached, cached: true };
  if (!online) return null;
  try {
    const [p1, p2] = await Promise.all([fetchJson<GbifPage>(url(latin, 0), 25000), fetchJson<GbifPage>(url(latin, 300), 25000).catch(() => null)]);
    const pts: [number, number][] = [];
    for (const page of [p1, p2]) {
      for (const r of page?.results ?? []) if (typeof r.decimalLatitude === 'number' && typeof r.decimalLongitude === 'number') pts.push([r.decimalLatitude, r.decimalLongitude]);
    }
    const data = aggregate(pts, p1.count);
    AsyncStorage.setItem(`occ:v1:${latin}`, JSON.stringify(data)).catch(() => {});
    return { data, cached: false };
  } catch {
    return cached ? { data: cached, cached: true } : null;
  }
}
