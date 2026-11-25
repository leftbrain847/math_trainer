/** Is n prime? Five ways. Each drawing turns the pure maths in src/topics/primes.ts into a Scene. */
import { digits } from '../../math';
import { divisibilityRules, fermat, sieve, trialDivision, wilson } from '../../topics/primes';
import type { GridSpec } from '../grid';
import { Scene } from '../scene';

/** Drawing sizes (SVG units). The scene scales to its tile, so only the proportions matter. */
const P = {
  font: 14,
  small: 12,
  rowH: 22,
  sieveCols: 10,
  cellW: 25,
  cellH: 20,
  /** Every drawing is at least this wide, so small n doesn't blow up to fill the tile. */
  minW: 150,
  /** Wilson multiplies 1…n−1 in at most this many blocks. */
  wilsonBlocks: 9,
};

const SUP: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
const sup = (n: number) => String(n).split('').map((c) => SUP[c] ?? c).join('');

/** The answer line every method ends on. */
function verdict(n: number, prime: boolean): string {
  if (prime) return `${n} is prime`;
  const p = [2, 3, 5, 7, 11].find((q) => n % q === 0) ?? n;
  return `${n} = ${p} × ${n / p}: not prime`;
}

/** The answer in the drawing: one short line, or two when there's a factor to show. */
function answer(sc: Scene, y: number, n: number, prime: boolean, step: number, probably = false): void {
  const b = { step, anchor: 'start' as const, cls: 'answer', size: P.font };
  if (prime) {
    sc.text(0, y, probably ? `${n}: probably prime` : `${n} is prime`, b);
    return;
  }
  const p = [2, 3, 5, 7, 11].find((q) => n % q === 0) ?? n;
  sc.text(0, y, `${n} = ${p} × ${n / p}`, b);
  sc.text(0, y + 18, 'not prime', b);
}

/** Keep the drawing at least P.minW wide. */
const widen = (sc: Scene, y = 0) => sc.text(P.minW, y, '', { size: 1 });

function drawTrial(n: number): Scene {
  const sc = new Scene();
  const T = trialDivision(n);
  const root = Math.sqrt(n);
  widen(sc);
  sc.text(0, 0, `√${n} ≈ ${root.toFixed(1)}`, { anchor: 'start', size: P.small, cls: 'muted-text' });
  sc.caption(0, T.tries.length ? `Try each prime up to √${n} ≈ ${root.toFixed(1)}` : `No prime is ≤ √${n} ≈ ${root.toFixed(1)}, so nothing to try`);
  const rows: SVGElement[] = [];
  T.tries.forEach((t, k) => {
    const step = k + 1;
    const y = (k + 1) * P.rowH;
    rows.push(sc.text(0, y, `${n} ÷ ${t.p} = ${t.q} r ${t.r}`, { step, anchor: 'start', size: P.font }));
    sc.text(P.minW + 4, y, t.r ? '✗' : '✓', { step, size: P.font, cls: t.r ? 'muted-text' : 'carry' });
    sc.caption(step, t.r ? `${t.p} leaves ${t.r}: not a factor` : `${t.p} goes in exactly: ${n} = ${t.p} × ${t.q}`);
  });
  const fin = T.tries.length + 1;
  const hit = rows[rows.length - 1];
  if (!T.prime && hit) sc.heat(hit, [fin]);
  answer(sc, (T.tries.length + 1) * P.rowH + 8, n, T.prime, fin);
  sc.caption(fin, T.prime ? `No prime up to √${n} divides it: ${n} is prime` : `Found a factor: ${n} is not prime`);
  return sc.fit();
}

function drawSieve(n: number): Scene {
  const sc = new Scene();
  const S = sieve(n);
  const { sieveCols: cols, cellW: w, cellH: h } = P;
  const at = (k: number) => ({ x: ((k - 1) % cols) * w + w / 2, y: Math.floor((k - 1) / cols) * h + h / 2 });
  const target = at(n);
  // The box behind n goes in first so the digits sit on top of it.
  const box = sc.rect(target.x - w / 2 + 1, target.y - h / 2 + 1, w - 2, h - 2, { cls: 'box' });
  for (let k = 1; k <= n; k++) {
    const { x, y } = at(k);
    sc.text(x, y, String(k), { size: P.small, cls: k === n ? 'answer' : undefined });
  }
  sc.text(cols * w, h / 2, '', { size: 1 });
  const strike = (k: number, step: number) => {
    const { x, y } = at(k);
    sc.line(x - 8, y + 6, x + 8, y - 6, { step, cls: 'stroke strike' });
  };
  strike(1, 0);
  sc.caption(0, `Write 1 to ${n}; cross out 1, it isn't prime`);
  S.steps.forEach((s, i) => {
    const step = i + 1;
    const { x, y } = at(s.p);
    sc.ring(x, y, 9, { step, cls: 'stroke ring lineA' });
    for (const m of s.crossed) strike(m, step);
    const hitN = s.crossed.includes(n);
    if (hitN) sc.heat(box, [step]);
    sc.caption(step, `Keep ${s.p}, cross out its multiples from ${s.p * s.p}${hitN ? `: ${n} goes` : ''}`);
  });
  const fin = S.steps.length + 1;
  sc.heat(box, [fin]);
  if (S.prime) sc.ring(target.x, target.y, 10, { step: fin, cls: 'stroke ring lineB' });
  const rows = Math.ceil(n / cols);
  answer(sc, rows * h + 14, n, S.prime, fin);
  sc.caption(fin, S.prime ? `${n} survives every prime up to √${n}: prime` : `${n} was crossed out as a multiple of ${S.crossedBy}`);
  return sc.fit();
}

function drawFermat(n: number): Scene {
  const sc = new Scene();
  const F = fermat(n);
  widen(sc);
  sc.text(0, 0, `prime ⇒ a${sup(n - 1)} ≡ 1 mod ${n}`, { anchor: 'start', size: P.small, cls: 'muted-text' });
  sc.caption(0, `If ${n} is prime, a^${n - 1} leaves 1 when divided by ${n}`);
  F.tries.forEach((t, k) => {
    const step = k + 1;
    const y = (k + 1) * P.rowH + 4;
    sc.text(0, y, `${t.a}${sup(n - 1)} ≡ ${t.r}`, { step, anchor: 'start', size: P.font });
    sc.text(P.minW - 10, y, t.r === 1 ? '✓' : '✗', { step, size: P.font, cls: t.r === 1 ? 'muted-text' : 'carry' });
    sc.caption(step, t.r === 1 ? `Base ${t.a}: remainder 1, passes` : `Base ${t.a}: remainder ${t.r}, not 1, so certainly not prime`);
  });
  const fin = F.tries.length + 1;
  const tested = F.tries.map((t) => t.a).join(', ');
  answer(sc, (F.tries.length + 1) * P.rowH + 12, n, F.prime, fin, F.tries.length > 0);
  sc.caption(
    fin,
    F.prime ? (F.tries.length ? `Passes base ${tested}: probably prime (fakes like 341 exist)` : `No base between 1 and ${n} to try: 2 is prime`) : `One failed base proves it: ${n} is not prime`,
  );
  return sc.fit();
}

/** What the digit rule for p says about n, as a short line. */
function ruleLine(n: number, p: number, value: number): string {
  const ds = digits(n);
  const last = ds[ds.length - 1] ?? 0;
  if (p === 2 || p === 5) return `ends in ${last}`;
  if (p === 3) return `${ds.join('+')} = ${value}`;
  if (p === 7) return `${Math.floor(n / 10)} − 2×${last} = ${value}`;
  return `alt. sum = ${value}`;
}
const RULE: Record<number, string> = {
  2: 'last digit even?',
  3: 'digit sum a multiple of 3?',
  5: 'last digit 0 or 5?',
  7: 'rest − 2 × last a multiple of 7?',
  11: 'alternating digit sum a multiple of 11?',
};

function drawRules(n: number): Scene {
  const sc = new Scene();
  const R = divisibilityRules(n);
  widen(sc);
  sc.text(0, 0, `primes up to √${n}`, { anchor: 'start', size: P.small, cls: 'muted-text' });
  sc.caption(0, R.checks.length ? `Test ${n} with digit rules, no dividing` : `No prime is ≤ √${n}, so no rule to check`);
  R.checks.forEach((c, k) => {
    const step = k + 1;
    const y = (k + 1) * P.rowH + 2;
    sc.text(0, y, `÷${c.p}`, { step, anchor: 'start', size: P.small, cls: 'muted-text' });
    sc.text(30, y, ruleLine(n, c.p, c.value), { step, anchor: 'start', size: P.font - 1 });
    sc.text(P.minW - 10, y, c.divides ? '✓' : '✗', { step, size: P.font, cls: c.divides ? 'carry' : 'muted-text' });
    sc.caption(step, `÷${c.p}: ${RULE[c.p] ?? ''} ${c.divides ? 'Yes' : 'No'}`);
  });
  const fin = R.checks.length + 1;
  answer(sc, (R.checks.length + 1) * P.rowH + 10, n, R.prime, fin);
  sc.caption(fin, R.prime ? `No rule fits: ${n} is prime` : `A rule fits: ${n} is not prime`);
  return sc.fit();
}

function drawWilson(n: number): Scene {
  const sc = new Scene();
  const W = wilson(n, P.wilsonBlocks);
  widen(sc);
  sc.text(0, 0, `prime ⇔ ${n - 1}! ≡ ${n - 1} mod ${n}`, { anchor: 'start', size: P.small, cls: 'muted-text' });
  sc.caption(0, `Wilson: ${n} is prime exactly when ${n - 1}! leaves ${n - 1}`);
  const rs: SVGElement[] = [];
  W.blocks.forEach((b, k) => {
    const step = k + 1;
    const y = (k + 1) * P.rowH + 2;
    sc.text(0, y, b.from === b.to ? `×${b.from}` : `×${b.from}×…×${b.to}`, { step, anchor: 'start', size: P.font - 1 });
    rs.push(sc.text(P.minW - 4, y, `≡ ${b.r}`, { step, anchor: 'end', size: P.font, cls: b.r === 0 ? 'carry' : undefined }));
    sc.caption(step, b.r === 0 ? `Hits 0: two factors of ${n} are in, it stays 0` : `Multiply in ${b.from === b.to ? b.from : `${b.from} to ${b.to}`}, keep the remainder: ${b.r}`);
  });
  const fin = W.blocks.length + 1;
  const last = rs[rs.length - 1];
  if (last) sc.heat(last, [fin]);
  answer(sc, (W.blocks.length + 1) * P.rowH + 10, n, W.prime, fin);
  sc.caption(fin, `${n - 1}! ≡ ${W.r}${W.prime ? '' : `, not ${n - 1}`}: ${W.prime ? 'prime' : 'not prime'}`);
  return sc.fit();
}

const METHODS: { id: string; title: string; draw: (n: number) => Scene }[] = [
  { id: 'trial', title: 'Trial division', draw: drawTrial },
  { id: 'sieve', title: 'Sieve of Eratosthenes', draw: drawSieve },
  { id: 'fermat', title: 'Fermat test', draw: drawFermat },
  { id: 'rules', title: 'Divisibility rules', draw: drawRules },
  { id: 'wilson', title: "Wilson's theorem", draw: drawWilson },
];

export const grid: GridSpec = {
  id: 'primes',
  sliders: [{ label: 'n', start: 91, min: 2, max: 120 }],
  methods: METHODS.map((m) => ({ id: m.id, title: m.title, draw: ([n = 2]) => m.draw(n) })),
  problem: ([n = 2]) => verdict(n, trialDivision(n).prime),
};
