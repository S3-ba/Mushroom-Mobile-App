import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import type { Model3D } from '@/data/types';

const CAP_PATH = {
  convex: 'M10 52 C10 26 28 12 50 12 C72 12 90 26 90 52 C78 57 22 57 10 52 Z',
  flat: 'M5 50 C9 32 28 24 50 24 C72 24 91 32 95 50 C80 55 20 55 5 50 Z',
  funnel: 'M8 32 C22 46 36 54 43 62 L57 62 C64 54 78 46 92 32 C74 40 26 40 8 32 Z',
  bell: 'M32 66 C30 26 40 8 50 8 C60 8 70 26 68 66 C58 70 42 70 32 66 Z',
} as const;
const CAP_BOTTOM = { convex: 54, flat: 52, funnel: 62, bell: 68 } as const;
const SPOTS: [number, number, number][] = [[28, 32, 4], [48, 22, 3.4], [67, 31, 4.2], [40, 41, 3], [58, 43, 3.4], [77, 43, 2.6], [20, 44, 2.6]];

function shade(hex: string, k = 0.78): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.round(Math.max(0, Math.min(255, v * k)));
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

/** Offline 2D illustration generated from the same parametric spec as the 3D model. */
export function MushroomIllustration({ spec, size = '100%' }: { spec: Model3D; size?: number | string }) {
  const w = Math.max(5, Math.min(16, (spec.stemR / spec.capR) * 52));
  const defs = (
    <Defs>
      <LinearGradient id="cap" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor={spec.edge} />
        <Stop offset="1" stopColor={spec.cap} />
      </LinearGradient>
      <LinearGradient id="stem" x1="0" y1="0" x2="1" y2="0">
        <Stop offset="0" stopColor={spec.stem} />
        <Stop offset="1" stopColor={shade(spec.stem)} />
      </LinearGradient>
    </Defs>
  );

  let body;
  if (spec.shape === 'shelf') {
    const n = spec.shelves ?? 1;
    body = (
      <>
        <Rect x="14" y="8" width="24" height="86" rx="6" fill="#4B3524" />
        {Array.from({ length: n }, (_, i) => {
          const y = n === 1 ? 46 : 28 + i * 24;
          const k = n === 1 ? 1.25 : 1;
          return <Path key={i} d={`M36 ${y} C48 ${y - 16 * k} 84 ${y - 16 * k} 92 ${y + 2} C80 ${y + 11} 50 ${y + 11} 36 ${y} Z`} fill="url(#cap)" />;
        })}
      </>
    );
  } else if (spec.shape === 'ball') {
    body = (
      <>
        <Path d="M42 66 L58 66 L62 92 Q50 97 38 92 Z" fill="url(#stem)" />
        <Circle cx="50" cy="46" r="30" fill="url(#cap)" />
        {SPOTS.map(([x, y, r], i) => <Circle key={i} cx={x + 2} cy={y + 8} r={r * 0.45} fill={shade(spec.cap, 0.8)} />)}
      </>
    );
  } else if (spec.shape === 'morel') {
    body = (
      <>
        <Rect x="39" y="62" width="22" height="32" rx="9" fill="url(#stem)" />
        <Path d="M36 72 C28 40 38 10 50 8 C62 10 72 40 64 72 Z" fill="url(#cap)" />
        {[[44, 24], [56, 28], [40, 38], [51, 40], [62, 42], [44, 52], [56, 54], [48, 64], [60, 64], [49, 14]].map(([x, y], i) => (
          <Ellipse key={i} cx={x} cy={y} rx="3.2" ry="4.4" fill={spec.edge} opacity={0.85} />
        ))}
      </>
    );
  } else {
    const shape = spec.shape as keyof typeof CAP_PATH;
    const bottom = CAP_BOTTOM[shape];
    const top = bottom - 4;
    const half = shape === 'bell' ? 34 : 45;
    let stem;
    switch (spec.stemShape) {
      case 'bulb':
        stem = `M${50 - w} ${top} L${50 + w} ${top} L${50 + w} 78 Q${50 + w * 2.3} 80 ${50 + w * 2} 90 Q50 97 ${50 - w * 2} 90 Q${50 - w * 2.3} 80 ${50 - w} 78 Z`;
        break;
      case 'club':
        stem = `M${50 - w} ${top} L${50 + w} ${top} L${50 + w * 1.7} 90 Q50 96 ${50 - w * 1.7} 90 Z`;
        break;
      case 'taper':
        stem = `M${50 - w * 0.8} ${top} L${50 + w * 0.8} ${top} L${50 + w * 1.3} 92 L${50 - w * 1.3} 92 Z`;
        break;
      default:
        stem = `M${50 - w} ${top} L${50 + w} ${top} L${50 + w * 0.9} 92 L${50 - w * 0.9} 92 Z`;
    }
    body = (
      <>
        <Path d={stem} fill="url(#stem)" strokeLinejoin="round" />
        {spec.ring ? <Ellipse cx="50" cy={bottom + 9} rx={w * 2.1} ry="3.2" fill={shade(spec.stem, 0.92)} /> : null}
        <Path d={CAP_PATH[shape]} fill="url(#cap)" />
        <Ellipse cx="50" cy={bottom + (shape === 'funnel' ? -1 : 0)} rx={half * 0.82} ry="2.6" fill={spec.under} opacity={0.9} />
        {spec.spots && shape !== 'funnel'
          ? SPOTS.map(([x, y, r], i) => <Circle key={i} cx={x} cy={shape === 'flat' ? y + 8 : shape === 'bell' ? 20 + i * 6 : y} r={r * (spec.spots === 'white' ? 1 : 0.6)} fill={spec.spots === 'white' ? '#F7F2E2' : '#6B5230'} opacity={0.92} />)
          : null}
      </>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {defs}
      {body}
    </Svg>
  );
}
