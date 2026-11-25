/** Derivatives, six ways: the slope of f(x) = xⁿ at x = a. Each drawing turns src/topics/derivatives.ts into a Scene. */
import { binomialExpansion, centralDifferences, exact, f, limitDefinition, logarithmic, powerRule, productRule } from '../../topics/derivatives';
import type { GridSpec } from '../grid';
import { Scene } from '../scene';

/** Drawing sizes (SVG units). */
const G = {
  plotW: 160,
  plotH: 84,
  curveSamples: 48,
  dotR: 3,
  font: 13,
  row: 17,
  /** Longest product-rule row (characters) drawn with its sum. */
  productRowChars: 24,
  lineFont: 15,
  lineH: 24,
  /** How far past the point the line extends to the left, in x units. */
  reachLeft: 0.9,
};

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sup = (k: number): string => String(k).split('').map((d) => SUP[Number(d)] ?? d).join('');
const xPow = (k: number): string => (k === 1 ? 'x' : `x${sup(k)}`);
/** Up to dp decimals, trailing zeros dropped. */
function fmt(v: number, dp = 3): string {
  const s = v.toFixed(dp);
  const t = s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s;
  return t === '-0' ? '0' : t;
}
const signed = (v: number, dp = 3): string => (v >= 0 ? `+${fmt(v, dp)}` : `−${fmt(-v, dp)}`);

interface Plot {
  X: (x: number) => number;
  Y: (y: number) => number;
  x1: number;
  ymax: number;
}

/** Axes and the curve y = xⁿ on [0, a+1], with the point (a, aⁿ) marked. */
function plot(sc: Scene, n: number, a: number): Plot {
  const x1 = a + 1;
  const ymax = f(n, x1);
  const X = (x: number) => (x / x1) * G.plotW;
  const Y = (y: number) => G.plotH - (y / ymax) * G.plotH;
  sc.line(0, G.plotH, G.plotW, G.plotH, { cls: 'stroke thin' });
  sc.line(0, 0, 0, G.plotH, { cls: 'stroke thin' });
  const pts: [number, number][] = Array.from({ length: G.curveSamples + 1 }, (_, i) => {
    const x = (x1 * i) / G.curveSamples;
    return [X(x), Y(f(n, x))];
  });
  sc.poly(pts);
  sc.dot(X(a), Y(f(n, a)), G.dotR);
  sc.text(X(a), G.plotH + 9, `x=${a}`, { size: 11, cls: 'muted-text' });
  return { X, Y, x1, ymax };
}

/** The line through (px, py) with slope m, clipped to the plot box. */
function slopeLine(sc: Scene, P: Plot, px: number, py: number, m: number, step: number, cls: string, hot: number[] = []): SVGElement {
  let lo = Math.max(0, px - G.reachLeft);
  let hi = P.x1;
  if (m > 0) {
    lo = Math.max(lo, px - py / m);
    hi = Math.min(hi, px + (P.ymax - py) / m);
  }
  const y = (x: number) => py + m * (x - px);
  return sc.line(P.X(lo), P.Y(y(lo)), P.X(hi), P.Y(y(hi)), { step, hot, cls });
}

const fName = (n: number) => `f(x) = ${xPow(n)}`;

function drawLimit(n: number, a: number): Scene {
  const sc = new Scene();
  const L = limitDefinition(n, a);
  const P = plot(sc, n, a);
  const fa = f(n, a);
  sc.caption(0, `Slope of ${xPow(n)} at ${a}: (f(${a}+h) − f(${a})) ÷ h, shrinking h`);
  const top = G.plotH + 26;
  L.rows.forEach((r, k) => {
    const step = k + 1;
    slopeLine(sc, P, a, fa, r.slope, step, 'stroke lineB', [step]);
    sc.dot(P.X(a + r.h), P.Y(f(n, a + r.h)), G.dotR - 1, { step });
    const y = top + k * G.row;
    sc.text(0, y, `h = ${r.h}`, { step, anchor: 'start', size: G.font, cls: 'muted-text' });
    sc.text(G.plotW, y, fmt(r.slope), { step, anchor: 'end', size: G.font });
    sc.caption(step, `h = ${r.h}: slope ${fmt(r.slope)}, off by ${fmt(r.error)}`);
  });
  const fin = L.rows.length + 1;
  slopeLine(sc, P, a, fa, L.answer, fin, 'stroke lineA');
  sc.text(G.plotW / 2, top + L.rows.length * G.row + 6, `f′(${a}) = ${L.answer}`, { step: fin, cls: 'answer', size: G.lineFont });
  sc.caption(fin, `As h → 0 the slopes close in on the tangent's: ${L.answer}`);
  return sc.fit();
}

/** A column of formula lines, one per step, the last one the answer. */
function lines(sc: Scene, rows: { text: string; caption: string }[]): void {
  rows.forEach((r, k) => {
    const last = k === rows.length - 1;
    sc.text(0, k * G.lineH, r.text, { step: k, anchor: 'start', size: G.lineFont, cls: last ? 'answer' : undefined });
    sc.caption(k, r.caption);
  });
}

function drawPower(n: number, a: number): Scene {
  const sc = new Scene();
  const R = powerRule(n, a);
  lines(sc, [
    { text: fName(n), caption: `${fName(n)}: find the slope at x = ${a}` },
    { text: `f′(x) = ${n}x${sup(R.power)}`, caption: `Bring the power ${n} down, lower the power by one` },
    { text: `f′(${a}) = ${n}·${a}${sup(R.power)}`, caption: `Put x = ${a} in` },
    { text: `= ${n}·${R.aPow}`, caption: `${a}${sup(R.power)} = ${R.aPow}` },
    { text: `= ${R.answer}`, caption: `f′(${a}) = ${n} × ${R.aPow} = ${R.answer}` },
  ]);
  return sc.fit();
}

function drawProduct(n: number, a: number): Scene {
  const sc = new Scene();
  const R = productRule(n, a);
  sc.text(0, 0, `${fName(n)}, x = ${a}`, { anchor: 'start', size: G.font, cls: 'muted-text' });
  sc.caption(0, `Write xᵏ = x·xᵏ⁻¹ and use (uv)′ = u′v + uv′`);
  R.rows.forEach((r, k) => {
    const step = k + 1;
    const y = (k + 1) * G.row + 4;
    const label = `(${xPow(r.k)})′`;
    const full = r.k === 1 ? '= 1' : `= ${r.uPrimeV} + ${a}·${r.prev} = ${r.value}`;
    // Long sums would shrink the whole tile; the caption always spells the sum out.
    const body = full.length + label.length < G.productRowChars ? full : `= ${r.value}`;
    sc.text(0, y, `${label} ${body}`, { step, anchor: 'start', size: G.font });
    sc.caption(
      step,
      r.k === 1 ? 'Start from (x)′ = 1' : `(x·${xPow(r.k - 1)})′ = 1·${xPow(r.k - 1)} + x·(${xPow(r.k - 1)})′ = ${r.uPrimeV} + ${a}·${r.prev}`,
    );
  });
  const fin = R.rows.length + 1;
  sc.text(0, (R.rows.length + 1) * G.row + 14, `f′(${a}) = ${R.answer}`, { step: fin, anchor: 'start', size: G.lineFont, cls: 'answer' });
  sc.caption(fin, `Each power built on the one before: f′(${a}) = ${R.answer}`);
  return sc.fit();
}

function drawLog(n: number, a: number): Scene {
  const sc = new Scene();
  const R = logarithmic(n, a);
  lines(sc, [
    { text: `y = ${xPow(n)}`, caption: `y = ${xPow(n)}: find y′ at x = ${a}` },
    { text: `ln y = ${n} ln x`, caption: 'Take logs: the power comes down as a factor' },
    { text: `y′/y = ${n}/x`, caption: 'Differentiate both sides: (ln y)′ = y′/y by the chain rule' },
    { text: `y′ = y · ${n}/x`, caption: 'Multiply by y' },
    { text: `= ${R.y} · ${n}/${a}`, caption: `At x = ${a}: y = ${a}${sup(n)} = ${R.y}` },
    { text: `= ${fmt(R.answer)}`, caption: `f′(${a}) = ${R.y} × ${n} ÷ ${a} = ${fmt(R.answer)}` },
  ]);
  return sc.fit();
}

function drawCentral(n: number, a: number): Scene {
  const sc = new Scene();
  const C = centralDifferences(n, a);
  const P = plot(sc, n, a);
  sc.caption(0, `Central difference: (f(${a}+h) − f(${a}−h)) ÷ 2h`);
  const top = G.plotH + 26;
  C.rows.forEach((r, k) => {
    const step = k + 1;
    const lo = a - r.h;
    slopeLine(sc, P, lo, f(n, lo), r.slope, step, 'stroke lineB', [step]);
    sc.dot(P.X(lo), P.Y(f(n, lo)), G.dotR - 1, { step });
    sc.dot(P.X(a + r.h), P.Y(f(n, a + r.h)), G.dotR - 1, { step });
    const y = top + k * G.row;
    sc.text(0, y, `h = ${r.h}`, { step, anchor: 'start', size: G.font, cls: 'muted-text' });
    sc.text(G.plotW, y, fmt(r.slope, 4), { step, anchor: 'end', size: G.font });
    sc.caption(step, `h = ${r.h}: ${fmt(r.slope, 4)}, off by ${signed(r.error, 4)}`);
  });
  const fin = C.rows.length + 1;
  slopeLine(sc, P, a, f(n, a), C.answer, fin, 'stroke lineA');
  sc.text(G.plotW / 2, top + C.rows.length * G.row + 6, `f′(${a}) = ${C.answer}`, { step: fin, cls: 'answer', size: G.lineFont });
  sc.caption(fin, n <= 2 ? `Exact at every h: for n ≤ 2 the errors cancel. f′(${a}) = ${C.answer}` : `Error shrinks like h²: 10× smaller h, 100× smaller error → ${C.answer}`);
  return sc.fit();
}

function drawBinomial(n: number, a: number): Scene {
  const sc = new Scene();
  const B = binomialExpansion(n, a);
  const size = G.font;
  sc.text(0, 0, `(${a}+h)${sup(n)} =`, { anchor: 'start', size: G.lineFont });
  sc.caption(0, `f(${a}+h) = (${a}+h)${sup(n)}: expand it with the binomial theorem`);
  const rows = B.terms.map((t, k) => {
    const y = (k + 1) * G.row + 6;
    const hPart = t.k === 0 ? '' : t.k === 1 ? 'h' : `h${sup(t.k)}`;
    const coef = t.k > 0 && t.coef === 1 ? '' : String(t.coef);
    const s = `${t.k ? '+ ' : ''}${coef}${hPart}`;
    const node = sc.text(12, y, s, { step: 1, anchor: 'start', size });
    return { k: t.k, y, w: s.length * size * 0.62, node };
  });
  sc.caption(1, 'One term per power of h');
  const strike = (r: { y: number; w: number }, step: number) => sc.line(8, r.y, 12 + r.w + 4, r.y, { step, cls: 'stroke strike' });
  const first = rows[0];
  if (first) strike(first, 2);
  sc.caption(2, `Subtract f(${a}) = ${B.terms[0]?.coef ?? 0}`);
  for (const r of rows) if (r.k >= 2) strike(r, 3);
  sc.caption(3, n >= 2 ? 'Divide by h; as h → 0 every term still holding h vanishes' : 'Divide by h: nothing else is left');
  const fin = 4;
  const one = rows[1];
  if (one) sc.heat(one.node, [fin]);
  sc.text(0, (rows.length + 1) * G.row + 14, `f′(${a}) = ${B.answer}`, { step: fin, anchor: 'start', size: G.lineFont, cls: 'answer' });
  sc.caption(fin, `Only the h-term's coefficient survives: f′(${a}) = ${B.answer}`);
  return sc.fit();
}

export const grid: GridSpec = {
  id: 'derivatives',
  sliders: [
    { label: 'n', start: 3, min: 1, max: 6 },
    { label: 'a', start: 2, min: 1, max: 5 },
  ],
  methods: [
    { id: 'limit', title: 'Limit definition', draw: ([n = 3, a = 2]) => drawLimit(n, a) },
    { id: 'power', title: 'Power rule', draw: ([n = 3, a = 2]) => drawPower(n, a) },
    { id: 'product', title: 'Product rule', draw: ([n = 3, a = 2]) => drawProduct(n, a) },
    { id: 'log', title: 'Logarithmic', draw: ([n = 3, a = 2]) => drawLog(n, a) },
    { id: 'central', title: 'Finite differences', draw: ([n = 3, a = 2]) => drawCentral(n, a) },
    { id: 'binomial', title: 'Binomial expansion', draw: ([n = 3, a = 2]) => drawBinomial(n, a) },
  ],
  problem: ([n = 3, a = 2]) => `(${xPow(n)})′ at ${a} = ${exact(n, a)}`,
};
