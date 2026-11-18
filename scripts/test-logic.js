// Pure-logic tests (no React Native runtime needed): TypeScript is transpiled on the fly.
// Run with: npm test
const ts = require('typescript');
const fs = require('fs'), path = require('path'), Module = require('module');
const SRC = path.join(__dirname, '..', 'src');
const cache = {};
function load(file) {
  if (cache[file]) return cache[file].exports;
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const m = { exports: {} }; cache[file] = m;
  const req = (spec) => {
    if (spec.startsWith('@/')) return resolve(path.join(SRC, spec.slice(2)));
    if (spec.startsWith('.')) return resolve(path.join(path.dirname(file), spec));
    if (spec === 'jpeg-js') return { decode: () => { throw new Error('n/a'); } };
    if (spec === 'react-native' || spec.startsWith('expo') || spec.startsWith('@react-native')) return new Proxy({}, { get: () => () => {} });
    return require(spec);
  };
  new Function('exports', 'require', 'module', '__filename', code)(m.exports, req, m, file);
  return m.exports;
}
function resolve(p) { for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) if (fs.existsSync(p + ext)) return load(p + ext); throw new Error('cannot resolve ' + p); }

let fail = 0;
const ok = (c, msg) => { if (!c) { fail++; console.log('  ✗ ' + msg); } else console.log('  ✓ ' + msg); };

// ---- base64
const { base64ToBytes } = load(SRC + '/utils/base64.ts');
const b = base64ToBytes(Buffer.from('Hello, grzyby! ąę').toString('base64'));
ok(Buffer.from(b).toString() === 'Hello, grzyby! ąę', 'base64ToBytes round-trips (incl. UTF-8 and padding)');
ok(base64ToBytes('TQ==').length === 1 && base64ToBytes('TWE=').length === 2 && base64ToBytes('TWFu').length === 3, 'base64 padding lengths');

// ---- format helpers
const f = load(SRC + '/utils/format.ts');
ok(f.plural(1, 'grzyb', 'grzyby', 'grzybów') === 'grzyb' && f.plural(3, 'grzyb', 'grzyby', 'grzybów') === 'grzyby' && f.plural(12, 'grzyb', 'grzyby', 'grzybów') === 'grzybów' && f.plural(22, 'grzyb', 'grzyby', 'grzybów') === 'grzyby', 'Polish plural rules');
ok(f.fold('Łosoś Żółć') === 'losos zolc', 'fold() strips Polish diacritics');
ok(f.monthIn(11) === 'w listopadzie', 'monthIn(11)');
ok(f.dayLabel(Date.now()) === 'Dziś' && f.dayLabel(Date.now() - 86400000) === 'Wczoraj', 'dayLabel today/yesterday');

// ---- data integrity
const { MUSHROOMS } = load(SRC + '/data/mushrooms.ts');
const ids = new Set(MUSHROOMS.map((m) => m.id));
ok(MUSHROOMS.length === 25 && ids.size === 25, '25 unique species');
ok(MUSHROOMS.every((m) => m.months.every((x) => x >= 1 && x <= 12) && /^#[0-9A-Fa-f]{6}$/.test(m.model.cap) && /^#[0-9A-Fa-f]{6}$/.test(m.model.under)), 'months and model colours valid');
ok(MUSHROOMS.every((m) => m.colors.length > 0 && m.traits.cap && m.summary), 'every species has colours, traits, summary');
ok(MUSHROOMS.filter((m) => m.edibility === 'deadly').every((m) => m.warning), 'deadly species all carry a warning');

// ---- atlas filters
const flt = load(SRC + '/features/atlas/filters.ts');
const D = flt.DEFAULT_FILTERS;
ok(flt.applyFilters(MUSHROOMS, D).length === 25, 'no filters → all species');
ok(flt.applyFilters(MUSHROOMS, { ...D, query: 'kurka' })[0].id === 'pieprznik-jadalny', 'search by alias "kurka"');
ok(flt.applyFilters(MUSHROOMS, { ...D, query: 'LAKOWKA' }).length === 0 && flt.applyFilters(MUSHROOMS, { ...D, query: 'czernidlak' }).length === 1, 'search is diacritic-insensitive');
ok(flt.applyFilters(MUSHROOMS, { ...D, edibility: 'deadly' }).length === 2, 'deadly filter → 2 species');
ok(flt.applyFilters(MUSHROOMS, { ...D, under: 'pores' }).every((m) => m.under === 'pores'), 'underside filter');
ok(flt.applyFilters(MUSHROOMS, { ...D, season: true }, 4).map((m) => m.id).includes('smardz-jadalny'), 'season filter: morel in April');

// ---- recognition: synthetic images
const { analyseRgba } = load(SRC + '/features/recognition/analysis.ts');
const rk = load(SRC + '/features/recognition/ranking.ts');
function image(w, h, bg, cap, spots) {
  const d = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const inCap = (x - w / 2) ** 2 / (w * 0.3) ** 2 + (y - h / 2) ** 2 / (h * 0.27) ** 2 < 1;
    let c = inCap ? cap : bg;
    if (inCap && spots && ((x * 7 + y * 13) % 11 === 0 || (x % 9 < 2 && y % 9 < 2))) c = [245, 242, 235];
    d.set([c[0], c[1], c[2], 255], (y * w + x) * 4);
  }
  return d;
}
const forest = [52, 82, 38];
const top = (rgb, spots, traits = {}) => rk.rankCandidates(analyseRgba(image(96, 96, forest, rgb, spots), 96, 96), traits).slice(0, 3).map((c) => c.mushroom.id);
let t = top([198, 40, 34], true); ok(t[0] === 'muchomor-czerwony', 'red cap with white dots → ' + t.join(', '));
t = top([228, 168, 32], false); ok(t[0] === 'pieprznik-jadalny', 'golden-yellow cap → ' + t.join(', '));
t = top([225, 120, 40], false); ok(t.slice(0, 2).includes('mleczaj-rydz'), 'orange cap → ' + t.join(', '));
t = top([120, 72, 36], false); ok(['borowik-szlachetny', 'podgrzybek-brunatny', 'goryczak-zolciowy', 'krowiak-podwiniety', 'borowik-ceglastopory'].includes(t[0]), 'brown cap → ' + t.join(', '));
t = top([120, 72, 36], false, { under: 'pores' }); ok(t.every((id) => MUSHROOMS.find((m) => m.id === id).under === 'pores'), 'brown + pores trait → only pore species: ' + t.join(', '));
t = top([236, 234, 224], false, { under: 'gills', ring: true }); console.log('   white + gills + ring →', t.join(', '));
const a0 = analyseRgba(image(96, 96, forest, forest, false), 96, 96);
ok(a0.coverage < 0.05, 'plain forest-green picture has ~0 mushroom coverage (' + a0.coverage.toFixed(3) + ')');
const ranked = rk.rankCandidates(analyseRgba(image(96, 96, forest, [198, 40, 34], true), 96, 96), {});
ok(Math.abs(ranked.reduce((s, c) => s + c.p, 0) - 1) < 1e-9, 'candidate probabilities sum to 1');
ok(rk.displayPercent(0.99) === 92, 'displayed percent is capped at 92');
ok(rk.confidenceOf(rk.rankCandidates(null, {}), 0) === 'low', 'no photo + no traits → low confidence');

// ---- harvest stats
const hs = load(SRC + '/features/harvest-stats.ts');
const now = Date.now();
const entries = [
  { id: '1', createdAt: now, speciesId: 'a', count: 3, weightKg: 0.5 },
  { id: '2', createdAt: now - 1000, speciesId: 'b', count: 2 },
  { id: '3', createdAt: now - 86400000, speciesId: 'a', count: 5 },
];
const days = hs.groupByDay(entries);
ok(days.length === 2 && days[0].count === 5 && days[0].species.length === 2 && Math.abs(days[0].weight - 0.5) < 1e-9, 'groupByDay totals');
const wk = hs.lastDays(entries);
ok(wk.length === 7 && wk[6].count === 5 && wk[5].count === 5, 'lastDays: today=5, yesterday=5');

// ---- quiz
const qz = load(SRC + '/features/quiz/questions.ts');
ok(qz.QUESTIONS.every((q) => q.options.length >= 3 && q.correct >= 0 && q.correct < q.options.length && q.explain), 'all quiz questions well-formed (' + qz.QUESTIONS.length + ')');
const round = qz.newRound();
ok(round.length === 8 && round.every((r) => { const orig = qz.QUESTIONS.find((q) => q.q === r.q); return orig.options[orig.correct] === r.options[r.correct]; }), 'newRound shuffles answers but keeps the correct one');
ok(new Set(round.map((r) => r.q)).size === 8, 'round has no duplicate questions');

console.log(fail ? `\n${fail} FAILED` : '\nall tests passed');
process.exit(fail ? 1 : 0);
