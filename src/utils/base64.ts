const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const LOOKUP = new Uint8Array(256);
for (let i = 0; i < CHARS.length; i++) LOOKUP[CHARS.charCodeAt(i)] = i;

/** Tiny dependency-free base64 → bytes decoder (no Buffer/atob polyfills needed). */
export function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const len = clean.length;
  const out = new Uint8Array(Math.floor((len * 3) / 4));
  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const a = LOOKUP[clean.charCodeAt(i)];
    const b = LOOKUP[clean.charCodeAt(i + 1)];
    const c = LOOKUP[clean.charCodeAt(i + 2)] || 0;
    const d = LOOKUP[clean.charCodeAt(i + 3)] || 0;
    out[p++] = (a << 2) | (b >> 4);
    if (i + 2 < len) out[p++] = ((b & 15) << 4) | (c >> 2);
    if (i + 3 < len) out[p++] = ((c & 3) << 6) | d;
  }
  return out;
}
