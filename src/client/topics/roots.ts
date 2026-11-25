/** Square roots, five ways: each turns the pure maths in src/topics/roots.ts into a step-by-step Scene. */
import { babylonian, binarySearch, digitByDigit, estimateRefine, factorRoot, fmtRoot, fmtScaled, fmtSquare, ROOTS, rootLine, UNIT, type RootAnswer } from '../../topics/roots';
import type { GridSpec } from '../grid';
import { Scene } from '../scene';

/** Roots drawing sizes (SVG units). */
const RT = {
  font: 14,
  small: 12,
  row: 18,
  /** Width of one digit pair in the digit-by-digit layout. */
  pairW: 24,
  /** Extra room for the decimal point. */
  pointGap: 6,
  /** The Babylonian rectangles' longest side. */
  rectMax: 130,
  /** Number line length for estimate and binary search. */
  lineW: 150,
  /** Sparse drawings are padded out to about this width. */
  minWidth: 170,
  /** Decimal places shown for working values. */
  work: 4,
};

/** "≈ 12.25" or "= 12" */
const eq = (r: RootAnswer) => `${r.exact ? '=' : '≈'} ${fmtRoot(r)}`;
/** A working value with up to RT.work decimals, trailing zeros trimmed. */
const w4 = (v: number) => String(Number(v.toFixed(RT.work)));

function drawDigits(n: number): Scene {
  const sc = new Scene();
  const D = digitByDigit(n);
  const groups = D.intDigits + D.steps.filter((s) => s.decimal).length;
  const gx = (i: number) => i * RT.pairW + (i >= D.intDigits ? RT.pointGap : 0);
  const right = (i: number) => gx(i) + RT.pairW - 2;
  const end = right(groups - 1) + 4;
  // The radical sign and the pairs under it.
  sc.line(-4, -12, end, -12);
  sc.poly([[-14, 2], [-10, -2], [-5, 10], [-4, -12]], { cls: 'stroke curve' });
  const pairNodes: SVGElement[] = [];
  for (let i = 0; i < groups; i++) {
    const p = i < D.intDigits ? D.pairs[i] ?? 0 : 0;
    const s = i === 0 ? String(p) : String(p).padStart(2, '0');
    pairNodes.push(sc.text(right(i), 0, s, { anchor: 'end', size: RT.font, cls: i >= D.intDigits ? 'muted-text' : undefined }));
  }
  if (groups > D.intDigits) {
    sc.text(gx(D.intDigits) - 2, 2, '.', { size: RT.font });
    sc.text(gx(D.intDigits) - 2, -28, '.', { step: D.intDigits + 1, size: RT.font, cls: 'answer' });
  }
  sc.caption(0, `Split ${n} into pairs from the point: ${D.pairs.join(' | ')}`);
  // One row per digit: what's left after bringing the pair down, and the trial that fits it.
  const colR = Math.max(right(groups - 1), 4 * RT.pairW + RT.pointGap + RT.pairW);
  D.steps.forEach((s, k) => {
    const step = k + 1;
    sc.text(right(k) - 6, -28, String(s.x), { step, size: RT.font, cls: 'answer' });
    const node = pairNodes[k];
    if (node) sc.heat(node, [step]);
    const y = RT.row * (k + 1.4);
    const div = 20 * s.p + s.x;
    sc.text(colR - 70, y, String(s.current), { step, anchor: 'end', size: RT.font });
    sc.text(colR - 62, y, `${div}×${s.x}`, { step, anchor: 'start', size: RT.font, cls: 'muted-text' });
    sc.caption(
      step,
      s.p === 0
        ? `${s.x}×${s.x} = ${s.take} is the biggest square in ${s.current}`
        : `Double ${s.p} → ${2 * s.p}_: ${div}×${s.x} = ${s.take} ≤ ${s.current}, ${s.rem} left`,
    );
  });
  const fin = D.steps.length + 1;
  const yEnd = RT.row * (D.steps.length + 1.4) + 6;
  sc.text(colR / 2, yEnd, eq(D), { step: fin, size: RT.font + 2, cls: 'answer' });
  const digits = D.steps.map((s) => s.x).join('');
  const shown = `${digits.slice(0, D.intDigits)}.${digits.slice(D.intDigits)}`;
  sc.caption(fin, D.exact ? `Nothing left over: √${n} = ${fmtRoot(D)} exactly` : `${shown}… rounds to ${fmtRoot(D)}`);
  return sc.fit();
}

function drawBabylonian(n: number): Scene {
  const sc = new Scene();
  const B = babylonian(n);
  // Keep the rows that still change at the shown precision.
  const rows = B.steps.filter((s, k) => k === 0 || w4(s.x) !== w4(B.steps[k - 1]?.x ?? 0));
  const first = rows[0] ?? { x: 1, other: n };
  const scale = RT.rectMax / Math.max(first.x, first.other);
  const tx = RT.rectMax + 14;
  sc.text(tx, -RT.rectMax, 'side', { anchor: 'start', size: RT.small, cls: 'muted-text' });
  rows.forEach((s, k) => {
    const step = k;
    const wpx = s.x * scale;
    const hpx = s.other * scale;
    const r = sc.rect(0, -hpx, wpx, hpx, { step, cls: k === rows.length - 1 ? 'fill' : 'box' });
    sc.heat(r, [step]);
    sc.text(tx, -RT.rectMax + RT.row * (k + 1), w4(s.x), { step, anchor: 'start', size: RT.font, cls: k === rows.length - 1 ? 'answer' : undefined });
    if (k === 0) sc.caption(0, `A ${w4(s.x)} × ${w4(s.other)} rectangle has area ${n}. Make it square`);
    else {
      const prev = rows[k - 1] ?? s;
      sc.caption(step, `Average the sides ${w4(prev.x)} and ${w4(prev.other)}: ${w4(s.x)}`);
    }
  });
  const fin = rows.length;
  sc.text(tx, -RT.rectMax + RT.row * (rows.length + 1) + 4, eq(B), { step: fin, anchor: 'start', size: RT.font, cls: 'answer' });
  sc.caption(fin, B.exact ? `A ${fmtRoot(B)} × ${fmtRoot(B)} square: √${n} = ${fmtRoot(B)}` : `The sides agree to ${RT.work} places: √${n} ≈ ${fmtRoot(B)}`);
  return sc.fit();
}

function drawFactors(n: number): Scene {
  const sc = new Scene();
  const F = factorRoot(n);
  sc.text(0, 0, `${n} =`, { anchor: 'start', size: RT.font });
  // Lay the primes out in a row, boxing each equal pair.
  const y = RT.row * 1.6;
  const gap = 6;
  let x = 0;
  const pos: { x: number; w: number }[] = [];
  for (const f of F.factors) {
    const wpx = String(f).length * 8.7 + 4;
    pos.push({ x, w: wpx });
    sc.text(x + wpx / 2, y, String(f), { size: RT.font });
    x += wpx + gap;
  }
  sc.caption(0, `Break ${n} into primes: ${F.factors.join('·')}`);
  for (let i = 0; i < F.factors.length; i++) {
    const a = pos[i];
    const b = pos[i + 1];
    if (a && b && F.factors[i] === F.factors[i + 1] && F.paired.length) {
      const r = sc.rect(a.x - 3, y - 11, b.x + b.w - a.x + 6, 22, { step: 1, cls: 'box grid' });
      sc.heat(r, [1, 2]);
      i++;
    }
  }
  sc.caption(1, F.paired.length ? `Pair equal primes: ${F.paired.map((p) => `${p}·${p}`).join(', ')}` : `No equal primes to pair, so √${n} won't simplify`);
  const y2 = y + RT.row * 1.6;
  const outside = F.outside === 1 ? '' : String(F.outside);
  if (F.exact) {
    sc.text(0, y2, `√${n} = ${F.paired.join('·')}`, { step: 2, anchor: 'start', size: RT.font });
    sc.text(0, y2 + RT.row * 1.4, `= ${F.outside}`, { step: 3, anchor: 'start', size: RT.font + 2, cls: 'answer' });
    sc.caption(2, 'Each pair comes out of the root as one prime');
    sc.caption(3, `All paired: √${n} = ${F.outside} exactly`);
    return sc.fit();
  }
  if (F.paired.length) sc.text(0, y2, `√${n} = ${outside}√${F.inside}`, { step: 2, anchor: 'start', size: RT.font });
  sc.caption(2, F.paired.length ? `Each pair leaves the root as one: ${outside}√${F.inside}` : `√${n} stays as it is`);
  const look = F.lookup.toFixed(ROOTS.lookupDecimals);
  sc.text(0, y2 + RT.row * 1.3, `√${F.inside} ≈ ${look}`, { step: 3, anchor: 'start', size: RT.font, cls: 'muted-text' });
  sc.caption(3, `Look up the small root: √${F.inside} ≈ ${look}`);
  sc.text(0, y2 + RT.row * 2.8, `${outside ? `${outside} × ${look} ` : ''}${eq(F)}`, { step: 4, anchor: 'start', size: RT.font, cls: 'answer' });
  sc.caption(4, outside ? `${outside} × ${look} = ${(F.outside * F.lookup).toFixed(ROOTS.lookupDecimals)} ≈ ${fmtRoot(F)}` : `√${n} ≈ ${fmtRoot(F)}`);
  // A prime n draws very little: pad it so it doesn't blow up to fill the tile.
  const wide = Math.max(x, `√${F.inside} ≈ ${look}`.length * 8.7);
  return sc.fit(Math.max(8, (RT.minWidth - wide) / 2));
}

/** The number line a² … (a+1)² with the squares above and their roots below. */
function squaresLine(sc: Scene, a: number, step: number): void {
  const L = RT.lineW;
  sc.line(0, 0, L, 0, { step });
  for (const [x, v, sq] of [[0, a, a * a], [L, a + 1, (a + 1) * (a + 1)]] as const) {
    sc.line(x, -5, x, 5, { step });
    sc.text(x, -14, String(sq), { step, size: RT.small, cls: 'muted-text' });
    sc.text(x, 15, String(v), { step, size: RT.font });
  }
}

function drawEstimate(n: number): Scene {
  const sc = new Scene();
  const E = estimateRefine(n);
  const a = E.a;
  sc.caption(0, `√${n}: which squares is ${n} between?`);
  sc.text(RT.lineW / 2, -34, `√${n}`, { size: RT.font });
  if (E.exact) {
    sc.text(RT.lineW / 2, 0, `${a}² = ${n}`, { step: 1, size: RT.font });
    sc.text(RT.lineW / 2, RT.row * 2, `= ${a}`, { step: 2, size: RT.font + 2, cls: 'answer' });
    sc.caption(1, `${n} is a square: ${a} × ${a} = ${n}`);
    sc.caption(2, `√${n} = ${a} exactly`);
    return sc.fit();
  }
  squaresLine(sc, a, 1);
  sc.caption(1, `${a}² = ${a * a} ≤ ${n} < ${(a + 1) * (a + 1)} = ${a + 1}²`);
  const fx = ((n - a * a) / (2 * a + 1)) * RT.lineW;
  sc.dot(fx, 0, 3, { step: 2 });
  sc.text(fx, -14, String(n), { step: 2, size: RT.small, cls: 'carry' });
  sc.text(fx, 15, fmtScaled(E.estimate), { step: 2, size: RT.small, cls: 'carry' });
  sc.caption(2, `${n} is ${n - a * a}/${2 * a + 1} of the way: guess ${fmtScaled(E.estimate)}`);
  let step = 2;
  let y = RT.row * 2.4;
  for (const t of E.trials) {
    step++;
    const dp = t.size === 1 ? ROOTS.decimals : ROOTS.decimals - 1;
    const v = t.size === 1 ? t.value : t.value / t.size;
    const shown = fmtScaled(v, dp);
    sc.text(0, y, `${shown}² = ${fmtSquare(v, dp)} ${t.ok ? '✓' : '✗'}`, { step, anchor: 'start', size: RT.font - 1, cls: t.ok ? undefined : 'muted-text' });
    sc.caption(step, `${shown}² ${t.ok ? '≤' : '>'} ${n}: ${t.ok ? 'still under, go up' : `too big, so ${t.size === 1 ? 'the hundredth' : 'the tenth'} stops below`}`);
    y += RT.row;
  }
  step++;
  const half = fmtScaled(E.floor * 10 + 5, ROOTS.decimals + 1);
  sc.text(0, y, `${half}² ${E.up ? '<' : '>'} ${n}`, { step, anchor: 'start', size: RT.font - 1, cls: 'muted-text' });
  sc.caption(step, `${half}² ${E.up ? '<' : '>'} ${n}: round ${E.up ? 'up' : 'down'}`);
  step++;
  sc.text(RT.lineW / 2, y + RT.row * 1.4, eq(E), { step, size: RT.font + 2, cls: 'answer' });
  sc.caption(step, `√${n} ≈ ${fmtRoot(E)}`);
  return sc.fit();
}

function drawBinary(n: number): Scene {
  const sc = new Scene();
  const S = binarySearch(n);
  const a = S.a;
  sc.caption(0, `√${n}: trap it between two numbers, then halve the gap`);
  if (S.exact) {
    sc.text(RT.lineW / 2, 0, `${a}² = ${n}`, { step: 1, size: RT.font });
    sc.text(RT.lineW / 2, RT.row * 2, `= ${a}`, { step: 2, size: RT.font + 2, cls: 'answer' });
    sc.caption(1, `${n} is a square: ${a} × ${a} = ${n}`);
    sc.caption(2, `√${n} = ${a} exactly`);
    return sc.fit();
  }
  const x0 = 56;
  const L = RT.lineW - x0 + 40;
  const at = (v: number) => x0 + ((v - a * UNIT) / UNIT) * L;
  sc.line(x0, 0, x0 + L, 0, { step: 1 });
  sc.text(x0, 15, String(a), { step: 1, size: RT.font });
  sc.text(x0 + L, 15, String(a + 1), { step: 1, size: RT.font });
  sc.text(x0, -14, String(a * a), { step: 1, size: RT.small, cls: 'muted-text' });
  sc.text(x0 + L, -14, String((a + 1) * (a + 1)), { step: 1, size: RT.small, cls: 'muted-text' });
  sc.caption(1, `${a}² = ${a * a} ≤ ${n} < ${(a + 1) * (a + 1)} = ${a + 1}²: start with ${a} to ${a + 1}`);
  let step = 1;
  let y = RT.row * 2;
  for (const h of S.halvings) {
    step++;
    const lo = h.ok ? h.mid : h.lo;
    const hi = h.ok ? h.hi : h.mid;
    sc.text(0, y, `${fmtScaled(h.mid)} ${h.ok ? '✓' : '✗'}`, { step, anchor: 'start', size: RT.font - 1, cls: h.ok ? undefined : 'muted-text' });
    const bx = at(lo);
    sc.rect(bx, y - 4, Math.max(2, at(hi) - bx), 8, { step, cls: 'fill' });
    sc.caption(step, `${fmtScaled(h.mid)}² = ${fmtSquare(h.mid, ROOTS.decimals)} ${h.ok ? '≤' : '>'} ${n}: keep the ${h.ok ? 'upper' : 'lower'} half`);
    y += RT.row;
  }
  step++;
  const half = fmtScaled(S.floor * 10 + 5, ROOTS.decimals + 1);
  sc.text(0, y, `${half}² ${S.up ? '<' : '>'} ${n}`, { step, anchor: 'start', size: RT.font - 1, cls: 'muted-text' });
  sc.caption(step, `Between ${fmtScaled(S.floor)} and ${fmtScaled(S.floor + 1)}; ${half}² ${S.up ? '<' : '>'} ${n}: round ${S.up ? 'up' : 'down'}`);
  step++;
  sc.text(x0 + L / 2, y + RT.row * 1.4, eq(S), { step, size: RT.font + 2, cls: 'answer' });
  sc.caption(step, `√${n} ≈ ${fmtRoot(S)}`);
  return sc.fit();
}

export const grid: GridSpec = {
  id: 'roots',
  sliders: [{ label: 'n', start: 150, min: 2, max: 999 }],
  methods: [
    { id: 'digits', title: 'Digit by digit', draw: ([n = 150]) => drawDigits(n) },
    { id: 'babylonian', title: 'Babylonian (Newton)', draw: ([n = 150]) => drawBabylonian(n) },
    { id: 'factors', title: 'Prime factors', draw: ([n = 150]) => drawFactors(n) },
    { id: 'estimate', title: 'Estimate and refine', draw: ([n = 150]) => drawEstimate(n) },
    { id: 'binary', title: 'Binary search', draw: ([n = 150]) => drawBinary(n) },
  ],
  problem: ([n = 150]) => rootLine(n),
};
