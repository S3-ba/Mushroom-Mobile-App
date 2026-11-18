import { decode } from 'jpeg-js';
import type { PaletteName } from '@/data/types';
import { downscaleToBase64 } from '@/services/image';
import { base64ToBytes } from '@/utils/base64';

type RGB = [number, number, number];

/** Reference colours of mushroom caps (sRGB). */
export const PALETTE: Record<PaletteName, RGB> = {
  white: [240, 238, 230],
  cream: [231, 218, 178],
  yellow: [232, 194, 30],
  orange: [222, 128, 34],
  red: [198, 40, 34],
  tan: [186, 142, 90],
  brown: [122, 74, 36],
  darkbrown: [66, 42, 24],
  gray: [138, 138, 130],
  olive: [138, 140, 56],
};

export interface PhotoAnalysis {
  /** share of "mushroom-like" pixels that fall closest to each palette colour (sums to 1) */
  palette: Record<PaletteName, number>;
  /** how much of the central area looked like a mushroom at all (0–1) */
  coverage: number;
  /** share of near-white pixels – white speckles typical for Amanita caps */
  whiteSpeckle: number;
  dominant: PaletteName[];
}

const lin = (c: number) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};

function rgbToLab(r: number, g: number, b: number): RGB {
  const R = lin(r), G = lin(g), B = lin(b);
  const X = (R * 0.4124564 + G * 0.3575761 + B * 0.1804375) / 0.95047;
  const Y = R * 0.2126729 + G * 0.7151522 + B * 0.072175;
  const Z = (R * 0.0193339 + G * 0.119192 + B * 0.9503041) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(X), fy = f(Y), fz = f(Z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

const NAMES = Object.keys(PALETTE) as PaletteName[];
const LABS = NAMES.map((n) => rgbToLab(...PALETTE[n]));

/** Typical background colours (foliage, grass, sky, deep shadow) – pixels closest to these are ignored. */
const BACKGROUND: RGB[] = [
  [52, 82, 38],
  [40, 60, 30],
  [92, 128, 52],
  [120, 150, 70],
  [135, 170, 205],
  [28, 28, 28],
];
const BG_LABS = BACKGROUND.map((c) => rgbToLab(...c));

/**
 * Pure colour analysis of an RGBA bitmap (testable without any native module):
 * the centre of the frame is matched pixel-by-pixel to a palette of typical cap colours in CIE-Lab space.
 * Pixels far from every cap colour, or closer to a typical background colour (foliage, sky, shadow), are ignored.
 */
export function analyseRgba(data: ArrayLike<number>, w: number, h: number): PhotoAnalysis {
  const x0 = Math.floor(w * 0.2), x1 = Math.ceil(w * 0.8);
  const y0 = Math.floor(h * 0.2), y1 = Math.ceil(h * 0.8);
  const cx = w / 2, cy = h / 2;
  const sigma = Math.min(w, h) * 0.3;

  const acc = Object.fromEntries(NAMES.map((n) => [n, 0])) as Record<PaletteName, number>;
  let total = 0, matched = 0;

  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * w + x) * 4;
      const weight = Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (2 * sigma * sigma));
      total += weight;
      const [L, A, B] = rgbToLab(data[i], data[i + 1], data[i + 2]);
      let best = 0, bestD = Infinity;
      for (let k = 0; k < LABS.length; k++) {
        const d = Math.hypot(L - LABS[k][0], A - LABS[k][1], B - LABS[k][2]);
        if (d < bestD) { bestD = d; best = k; }
      }
      if (bestD > 40) continue; // not close to any cap colour
      let bgD = Infinity;
      for (let k = 0; k < BG_LABS.length; k++) bgD = Math.min(bgD, Math.hypot(L - BG_LABS[k][0], A - BG_LABS[k][1], B - BG_LABS[k][2]));
      if (bgD < bestD) continue; // foliage / sky / shadow
      acc[NAMES[best]] += weight;
      matched += weight;
    }
  }

  const palette = Object.fromEntries(NAMES.map((n) => [n, matched > 0 ? acc[n] / matched : 0])) as Record<PaletteName, number>;
  const dominant = NAMES.filter((n) => palette[n] >= 0.12).sort((a, b) => palette[b] - palette[a]);
  return { palette, coverage: total > 0 ? matched / total : 0, whiteSpeckle: palette.white, dominant };
}

/**
 * Offline photo analysis (pure JS, no network, no native ML module):
 * the photo is shrunk to ~96 px with expo-image-manipulator, decoded with jpeg-js and analysed by `analyseRgba`.
 */
export async function analysePhoto(uri: string): Promise<PhotoAnalysis> {
  const b64 = await downscaleToBase64(uri, 96);
  const img = decode(base64ToBytes(b64), { useTArray: true, formatAsRGBA: true });
  return analyseRgba(img.data, img.width, img.height);
}
