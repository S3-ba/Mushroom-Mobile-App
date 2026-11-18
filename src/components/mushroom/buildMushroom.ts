import * as THREE from 'three';
import type { Model3D } from '@/data/types';

/**
 * Procedural 3D mushrooms: every species is generated from its parametric `Model3D` spec
 * (lathe profiles for cap & stem, vertex colours, spots, gills, rings, tufts, brackets…).
 * No external model files are needed, so the 3D viewer works fully offline.
 */

const TAU = Math.PI * 2;

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash = (x: number, y: number, z: number) => {
  const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
  return s - Math.floor(s);
};
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const std = (extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ roughness: 0.62, metalness: 0, side: THREE.DoubleSide, ...extra });

function colorize(geo: THREE.BufferGeometry, fn: (x: number, y: number, z: number) => THREE.Color) {
  const pos = geo.getAttribute('position');
  const data = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const c = fn(pos.getX(i), pos.getY(i), pos.getZ(i));
    data[i * 3] = c.r;
    data[i * 3 + 1] = c.g;
    data[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(data, 3));
}

/** Height of the cap's upper surface at normalised radius u (0 = centre, 1 = rim), in units of cap height. */
function topY(shape: Model3D['shape'], u: number): number {
  switch (shape) {
    case 'flat': return (1 - Math.pow(u, 2.6)) * (0.8 + 0.2 * Math.exp(-Math.pow(u / 0.25, 2)));
    case 'funnel': return -0.55 * (1 - Math.pow(u, 1.7)) + 0.12 * Math.sin(u * Math.PI);
    case 'bell': return Math.pow(Math.max(0, 1 - u * u), 0.62);
    default: return Math.sqrt(Math.max(0, 1 - u * u));
  }
}

function stemRadius(shape: Model3D['stemShape'], s: number, r: number): number {
  switch (shape) {
    case 'club': return r * (1 + 0.5 * Math.pow(1 - s, 2.2));
    case 'bulb': return r * (1 + 1.2 * Math.pow(Math.max(0, 1 - s / 0.2), 1.6));
    case 'taper': return r * (1.25 - 0.4 * s);
    default: return r;
  }
}

function buildStem(spec: Model3D, len: number, radiusAt?: (s: number) => number): THREE.Mesh {
  const rad = radiusAt ?? ((s: number) => stemRadius(spec.stemShape, s, spec.stemR));
  const pts: THREE.Vector2[] = [new THREE.Vector2(0.0005, 0)];
  const N = 16;
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    pts.push(new THREE.Vector2(rad(s), s * len));
  }
  const geo = new THREE.LatheGeometry(pts, 40);
  const base = new THREE.Color(spec.stem);
  colorize(geo, (x, y, z) => {
    const s = len > 0 ? y / len : 0;
    const streak = 0.96 + 0.04 * Math.sin(Math.atan2(z, x) * 16);
    return base.clone().multiplyScalar((0.78 + 0.22 * smooth(0, 0.35, s)) * streak);
  });
  return new THREE.Mesh(geo, std({ vertexColors: true }));
}

/** Cap + stem (+ ring, spots) for all "classic" mushrooms. */
function buildCapped(spec: Model3D, seed: number): THREE.Group {
  const g = new THREE.Group();
  const R = spec.capR;
  const H = spec.capR * spec.capH;
  const tRim = 0.05 * R;
  const yTop = (u: number) => topY(spec.shape, u) * H;
  const yUnder = (u: number) => Math.min(yTop(u) - 0.06 * R, -tRim + 0.4 * (yTop(u) + tRim));
  const stemU = Math.min(0.5, (spec.stemR * 1.08) / R);

  // stem
  const stemLen = Math.max(0.12, spec.stemH + (yUnder(0) + yTop(0)) / 2);
  g.add(buildStem(spec, stemLen));

  // cap (placed so that the rim sits at the top of the visible stem)
  const cap = new THREE.Group();
  cap.position.y = spec.stemH;

  const N = 22;
  const top: THREE.Vector2[] = [new THREE.Vector2(R, yUnder(1)), new THREE.Vector2(R, 0)];
  for (let i = N - 1; i >= 0; i--) {
    const u = i / N;
    top.push(new THREE.Vector2(Math.max(u * R, 0.0005), yTop(u)));
  }
  const topGeo = new THREE.LatheGeometry(top, 72);
  const cCap = new THREE.Color(spec.cap);
  const cEdge = new THREE.Color(spec.edge);
  colorize(topGeo, (x, y, z) => {
    const u = Math.min(1, Math.hypot(x, z) / R);
    const c = cCap.clone().lerp(cEdge, Math.pow(u, 1.5));
    c.multiplyScalar(0.93 + 0.14 * hash(x * 9, y * 9, z * 9));
    if (y < 0) c.multiplyScalar(0.85);
    return c;
  });
  cap.add(new THREE.Mesh(topGeo, std({ vertexColors: true })));

  const under: THREE.Vector2[] = [];
  const M = 10;
  for (let i = 0; i <= M; i++) {
    const u = stemU + ((1 - stemU) * i) / M;
    under.push(new THREE.Vector2(u * R, yUnder(u)));
  }
  const underGeo = new THREE.LatheGeometry(under, 128);
  const cUnder = new THREE.Color(spec.under);
  colorize(underGeo, (x, y, z) => {
    const c = cUnder.clone();
    if (spec.underType === 'gills') {
      const k = Math.floor(((Math.atan2(z, x) + Math.PI) / TAU) * 64);
      c.multiplyScalar(k % 2 === 0 ? 1 : 0.8);
    } else {
      c.multiplyScalar(0.94 + 0.1 * hash(x * 40, y * 40, z * 40));
    }
    return c;
  });
  cap.add(new THREE.Mesh(underGeo, std({ vertexColors: true, roughness: 0.8 })));

  // spots / scales
  if (spec.spots) {
    const r = rng(seed * 31 + 5);
    const white = spec.spots === 'white';
    const geo = new THREE.SphereGeometry(1, 8, 6);
    const mat = std({ color: white ? '#F7F2E2' : '#6B5230', roughness: 0.85 });
    const n = white ? 34 : 24;
    for (let i = 0; i < n; i++) {
      const u = Math.sqrt(r()) * 0.88;
      const t = r() * TAU;
      const s = R * (0.03 + r() * 0.04) * (1 - u * 0.3);
      const m = new THREE.Mesh(geo, mat);
      m.position.set(Math.cos(t) * u * R, yTop(u) + s * 0.1, Math.sin(t) * u * R);
      m.scale.set(s, s * 0.45, s);
      cap.add(m);
    }
  }
  g.add(cap);

  // ring (annulus)
  if (spec.ring) {
    const h = Math.max(0.07, R * 0.14);
    const ring = new THREE.Mesh(
      new THREE.CylinderGeometry(spec.stemR * 1.25, spec.stemR * 2.5, h, 36, 1, true),
      std({ color: new THREE.Color(spec.stem).lerp(new THREE.Color('#ffffff'), 0.35) }),
    );
    ring.position.y = stemLen * 0.72;
    g.add(ring);
  }
  return g;
}

function buildBall(spec: Model3D, seed: number): THREE.Group {
  const g = new THREE.Group();
  const R = spec.capR;
  const headY = spec.stemH + R * 0.85;
  const stem = buildStem(spec, headY, (s) => spec.stemR * (0.62 + 0.8 * s));
  g.add(stem);

  const geo = new THREE.SphereGeometry(R, 40, 28);
  const cTop = new THREE.Color(spec.cap);
  const cLow = new THREE.Color(spec.edge);
  colorize(geo, (x, y, z) => {
    const c = cTop.clone().lerp(cLow, smooth(0.45, 1, 1 - (y / R + 1) / 2));
    return c.multiplyScalar(0.94 + 0.12 * hash(x * 8, y * 8, z * 8));
  });
  const head = new THREE.Mesh(geo, std({ vertexColors: true, roughness: 0.85 }));
  head.scale.set(1, 0.9, 1);
  head.position.y = headY;
  g.add(head);

  if (spec.spots) {
    const r = rng(seed * 17 + 3);
    const wart = new THREE.SphereGeometry(1, 6, 5);
    const mat = std({ color: '#BFAE8C', roughness: 0.9 });
    for (let i = 0; i < 90; i++) {
      const d = new THREE.Vector3(r() * 2 - 1, r() * 1.4 - 0.2, r() * 2 - 1).normalize();
      const w = new THREE.Mesh(wart, mat);
      w.position.set(d.x * R, headY + d.y * R * 0.9, d.z * R);
      w.scale.setScalar(R * 0.035);
      g.add(w);
    }
  }
  return g;
}

function buildMorel(spec: Model3D): THREE.Group {
  const g = new THREE.Group();
  const R = spec.capR;
  const Hc = spec.capR * spec.capH;
  const baseY = spec.stemH - 0.04;
  g.add(buildStem(spec, baseY + 0.1));

  const pts: THREE.Vector2[] = [];
  const N = 30;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const r = spec.stemR * 1.05 * (1 - t) + R * Math.sin(Math.PI * Math.pow(t, 0.78));
    pts.push(new THREE.Vector2(Math.max(r, 0.0005), t * Hc));
  }
  const geo = new THREE.LatheGeometry(pts, 72);
  const pos = geo.getAttribute('position');
  const data = new Float32Array(pos.count * 3);
  const cCap = new THREE.Color(spec.cap);
  const cPit = new THREE.Color(spec.edge);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const t = y / Hc;
    const pit = Math.sin(Math.atan2(z, x) * 11 + Math.sin(t * 7) * 1.4) * Math.sin(t * Math.PI * 8.5);
    const k = 1 + 0.06 * pit * Math.min(1, t * 4);
    pos.setXYZ(i, x * k, y, z * k);
    const c = cCap.clone().multiplyScalar(0.72 + 0.28 * smooth(-0.5, 0.6, pit)).lerp(cPit, 0.4 * (1 - smooth(-0.5, 0.2, pit)));
    data[i * 3] = c.r;
    data[i * 3 + 1] = c.g;
    data[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(data, 3));
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  const cap = new THREE.Mesh(geo, std({ vertexColors: true, roughness: 0.9 }));
  cap.position.y = baseY;
  g.add(cap);
  return g;
}

function makeShelf(spec: Model3D, size: number, angle: number, y: number): THREE.Group {
  const grp = new THREE.Group();
  const cCap = new THREE.Color(spec.cap);
  const cEdge = new THREE.Color(spec.edge);
  const sx = 0.95 * size, sy = 0.36 * size * (spec.capH / 0.35), sz = 0.72 * size;

  const dome = new THREE.SphereGeometry(1, 36, 14, 0, TAU, 0, Math.PI / 2);
  colorize(dome, (x, yy, z) => {
    const u = Math.min(1, Math.hypot(x, z));
    return cCap.clone().lerp(cEdge, Math.pow(u, 2.4)).multiplyScalar(0.92 + 0.12 * hash(x * 7, yy * 7, z * 7));
  });
  const top = new THREE.Mesh(dome, std({ vertexColors: true }));
  top.scale.set(sx, sy, sz);
  grp.add(top);

  const disc = new THREE.CircleGeometry(1, 36);
  disc.rotateX(Math.PI / 2);
  const bottom = new THREE.Mesh(disc, std({ color: spec.under, roughness: 0.85 }));
  bottom.scale.set(sx, 1, sz);
  grp.add(bottom);

  grp.position.set(Math.cos(angle) * 0.36, y, Math.sin(angle) * 0.36);
  grp.rotation.y = -angle;
  return grp;
}

function buildShelf(spec: Model3D): THREE.Group {
  const g = new THREE.Group();
  const bark = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.4, 2.0, 28), std({ color: '#4B3524', roughness: 0.95 }));
  bark.position.y = 1.0;
  g.add(bark);
  const n = spec.shelves ?? 1;
  for (let i = 0; i < n; i++) {
    const size = (n === 1 ? 1 : 0.62 + (n - i) * 0.08) * spec.capR;
    g.add(makeShelf(spec, size, n === 1 ? 0.4 : (i / n) * TAU + 0.5, n === 1 ? 1.1 : 0.55 + i * 0.5));
  }
  return g;
}

function buildCluster(single: THREE.Group, count: number): THREE.Group {
  const g = new THREE.Group();
  const layout: [number, number, number, number][] = [
    [0, 0, 1, 0],
    [0.55, 0.12, 0.66, 0.22],
    [-0.5, 0.3, 0.72, -0.2],
    [0.18, -0.52, 0.55, 0.3],
    [-0.28, -0.4, 0.6, -0.28],
  ];
  for (let i = 0; i < Math.min(count, layout.length); i++) {
    const [x, z, s, tilt] = layout[i];
    const c = single.clone();
    c.scale.setScalar(s);
    c.position.set(x, 0, z);
    c.rotation.set(tilt, i, -tilt * 0.6);
    g.add(c);
  }
  return g;
}

/** Centres the model, puts it on y = 0 and scales it to a fixed height so every species fits the viewer. */
function fit(body: THREE.Group): THREE.Group {
  const box = new THREE.Box3().setFromObject(body);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const k = 1.9 / Math.max(size.y, Math.max(size.x, size.z) * 0.85, 0.01);
  const inner = new THREE.Group();
  body.position.set(-center.x, -box.min.y, -center.z);
  inner.add(body);
  inner.scale.setScalar(k);
  inner.position.y = -(size.y * k) / 2;
  const holder = new THREE.Group();
  holder.add(inner);
  return holder;
}

export function buildMushroom(spec: Model3D, seed = 1): THREE.Group {
  let body: THREE.Group;
  switch (spec.shape) {
    case 'shelf': body = buildShelf(spec); break;
    case 'ball': body = buildBall(spec, seed); break;
    case 'morel': body = buildMorel(spec); break;
    default: body = buildCapped(spec, seed);
  }
  if (spec.cluster && spec.cluster > 1) body = buildCluster(body, spec.cluster);
  return fit(body);
}

export function disposeGroup(group: THREE.Object3D) {
  group.traverse((o) => {
    const mesh = o as THREE.Mesh;
    mesh.geometry?.dispose?.();
    const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
    else mat?.dispose?.();
  });
}
