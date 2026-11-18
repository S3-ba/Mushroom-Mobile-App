import { MUSHROOMS } from '@/data/mushrooms';
import type { Mushroom, PaletteName, Underside } from '@/data/types';
import { PALETTE_LABEL, UNDER_LABEL } from '@/data/types';
import type { PhotoAnalysis } from './analysis';

export type Place = 'ground' | 'wood' | 'meadow';
export type Form = 'cap' | 'funnel' | 'ball' | 'shelf';

/** Traits the user can confirm to narrow the result (offline "identification key"). */
export interface TraitSelection {
  under?: Underside;
  place?: Place;
  ring?: boolean;
  form?: Form;
}

export interface Candidate {
  mushroom: Mushroom;
  p: number; // relative likelihood among the candidates (0–1)
  reasons: string[];
}

const NEIGHBOURS: Record<PaletteName, PaletteName[]> = {
  white: ['cream', 'gray'],
  cream: ['white', 'tan', 'yellow'],
  yellow: ['orange', 'cream', 'olive'],
  orange: ['yellow', 'red', 'tan'],
  red: ['orange', 'brown'],
  tan: ['cream', 'brown', 'orange'],
  brown: ['tan', 'darkbrown', 'red'],
  darkbrown: ['brown'],
  gray: ['white', 'tan', 'olive'],
  olive: ['yellow', 'gray', 'brown'],
};

export const placeOf = (m: Mushroom): Place => (m.habitats.includes('wood') ? 'wood' : m.habitats.length === 1 && m.habitats[0] === 'meadow' ? 'meadow' : 'ground');
export const formOf = (m: Mushroom): Form => {
  switch (m.model.shape) {
    case 'funnel': return 'funnel';
    case 'ball':
    case 'morel': return 'ball';
    case 'shelf': return 'shelf';
    default: return 'cap';
  }
};

function affinity(m: Mushroom, p: PaletteName): number {
  const idx = m.colors.indexOf(p);
  if (idx === 0) return 1;
  if (idx > 0) return 0.7;
  return m.colors.some((c) => NEIGHBOURS[c].includes(p)) ? 0.3 : 0.04;
}

function colorScore(m: Mushroom, a: PhotoAnalysis): { s: number; best?: PaletteName } {
  let s = 0;
  let best: PaletteName | undefined;
  let bestShare = 0;
  for (const p of Object.keys(a.palette) as PaletteName[]) {
    const share = a.palette[p];
    s += share * affinity(m, p);
    if (share > bestShare && affinity(m, p) >= 0.7) { bestShare = share; best = p; }
  }
  if (m.spotted) s *= a.whiteSpeckle > 0.04 && a.whiteSpeckle < 0.4 ? 1.3 : 0.85;
  return { s: Math.max(s, 0.02), best };
}

export function traitCount(t: TraitSelection): number {
  return [t.under, t.place, t.ring, t.form].filter((v) => v !== undefined).length;
}

/** Ranks the whole atlas against the photo analysis and the traits confirmed by the user. */
export function rankCandidates(a: PhotoAnalysis | null, t: TraitSelection): Candidate[] {
  const raw = MUSHROOMS.map((m) => {
    const reasons: string[] = [];
    let s = 0.35;
    if (a) {
      const c = colorScore(m, a);
      s = c.s;
      if (c.best) reasons.push(`kolor: ${PALETTE_LABEL[c.best]}`);
    }
    const apply = (given: boolean, match: boolean, label: string) => {
      if (!given) return;
      if (match) { s *= 1.7; reasons.push(label); } else s *= 0.15;
    };
    apply(t.under !== undefined, m.under === t.under, UNDER_LABEL[m.under].toLowerCase());
    apply(t.place !== undefined, placeOf(m) === t.place, t.place === 'wood' ? 'rośnie na drewnie' : t.place === 'meadow' ? 'łąka / trawnik' : 'rośnie na ziemi');
    apply(t.ring !== undefined, m.ring === t.ring, m.ring ? 'ma pierścień' : 'bez pierścienia');
    apply(t.form !== undefined, formOf(m) === t.form, 'kształt owocnika');
    return { mushroom: m, s, reasons };
  });
  const pow = raw.map((r) => Math.pow(r.s, 1.6));
  const sum = pow.reduce((x, y) => x + y, 0) || 1;
  return raw
    .map((r, i) => ({ mushroom: r.mushroom, p: pow[i] / sum, reasons: r.reasons }))
    .sort((x, y) => y.p - x.p);
}

export type Confidence = 'low' | 'medium' | 'high';

export function confidenceOf(list: Candidate[], traits: number): Confidence {
  const [a, b] = list;
  if (!a) return 'low';
  const gap = a.p - (b?.p ?? 0);
  if (traits >= 2 && a.p >= 0.5 && gap >= 0.2) return 'high';
  if ((traits >= 1 && a.p >= 0.35) || a.p >= 0.5) return 'medium';
  return 'low';
}

/** Displayed "match" – deliberately capped: this is a hint, never a certainty. */
export const displayPercent = (p: number) => Math.min(92, Math.round(p * 100));
