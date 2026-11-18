export type Edibility = 'edible' | 'conditional' | 'inedible' | 'poisonous' | 'deadly';
export type Habitat = 'conifer' | 'deciduous' | 'mixed' | 'meadow' | 'wood';
export type Underside = 'pores' | 'gills' | 'folds' | 'none';
export type PaletteName = 'white' | 'cream' | 'yellow' | 'orange' | 'red' | 'tan' | 'brown' | 'darkbrown' | 'gray' | 'olive';
export type CapShape = 'convex' | 'flat' | 'funnel' | 'bell' | 'ball' | 'morel' | 'shelf';

/** Parametric description of a mushroom – drives both the 3D model and the 2D illustration. */
export interface Model3D {
  shape: CapShape;
  cap: string; // colour at the cap centre
  edge: string; // colour at the cap rim
  stem: string;
  under: string; // colour of pores / gills
  underType: 'pores' | 'gills' | 'none';
  capR: number;
  capH: number; // cap height relative to capR
  stemH: number;
  stemR: number;
  stemShape?: 'straight' | 'club' | 'bulb' | 'taper';
  ring?: boolean;
  spots?: 'white' | 'dark';
  cluster?: number; // number of fruit bodies in a tuft
  shelves?: number; // number of brackets (shelf fungi)
}

export interface Lookalike {
  name: string;
  danger: boolean;
  note: string;
}

export interface Mushroom {
  id: string;
  name: string;
  aka?: string;
  latin: string;
  /** English-Wikipedia article title – used to fetch a photo (API) and for attribution. */
  wiki: string;
  edibility: Edibility;
  /** 1 = easy to recognise, 3 = easy to confuse with a dangerous species. */
  difficulty: 1 | 2 | 3;
  months: number[]; // 1–12
  habitats: Habitat[];
  under: Underside;
  ring: boolean;
  summary: string;
  traits: { cap: string; stem: string; flesh: string; where: string };
  lookalikes: Lookalike[];
  tips: string[];
  warning?: string;
  /** Dominant cap colours (palette names) – used by the offline recognition engine. */
  colors: PaletteName[];
  spotted?: boolean;
  model: Model3D;
}

export const HABITAT_LABEL: Record<Habitat, string> = {
  conifer: 'Las iglasty',
  deciduous: 'Las liściasty',
  mixed: 'Las mieszany',
  meadow: 'Łąka / pobocze',
  wood: 'Martwe drewno',
};

export const UNDER_LABEL: Record<Underside, string> = {
  pores: 'Rurki (gąbka)',
  gills: 'Blaszki',
  folds: 'Fałdy',
  none: 'Brak blaszek i rurek',
};

export const PALETTE_LABEL: Record<PaletteName, string> = {
  white: 'biały',
  cream: 'kremowy',
  yellow: 'żółty',
  orange: 'pomarańczowy',
  red: 'czerwony',
  tan: 'płowy',
  brown: 'brązowy',
  darkbrown: 'ciemnobrązowy',
  gray: 'szary',
  olive: 'oliwkowy',
};

export const DIFFICULTY_LABEL = { 1: 'Łatwy', 2: 'Średni', 3: 'Trudny' } as const;
