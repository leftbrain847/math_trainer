/** Integrals, six ways: the area ∫₀ᵇ xⁿ dx. Each drawing turns src/topics/integrals.ts into a Scene. */
import {
  byParts,
  dart,
  exactFraction,
  f,
  ftc,
  INTEGRAL,
  monteCarlo,
  riemannRows,
  simpsonParabola,
  simpsonRows,
  trapezoidRows,
  type Estimate,
} from '../../topics/integrals';
import type { GridSpec } from '../grid';
import { Scene } from '../scene';

/** Drawing sizes (SVG units). */
const G = {
  plotW: 160,
  plotH: 80,
  curveSamples: 48,
  parabolaSamples: 12,
  /** Strip counts small enough to draw; larger ones are listed only. */
  maxDrawnN: 16,
  dartR: 1.7,
  font: 13,
  row: 17,
  lineFont: 15,
  lineH: 24,
};

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const SUB = '₀₁₂₃₄₅₆₇₈₉';
const map = (k: number, set: string): string => String(k).split('').map((d) => set[Number(d)] ?? d).join('');
const sup = (k: number) => map(k, SUP);
const sub = (k: number) => map(k, SUB);
const xPow = (k: number): string => (k === 0 ? '1' : k === 1 ? 'x' : `x${sup(k)}`);
function fmt(v: number, dp = 2): string {
  const s = v.toFixed(dp);
  const t = s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s;
  return t === '-0' ? '0' : t;
}
const signed = (v: number, dp = 2): string => (v >= 0 ? `+${fmt(v, dp)}` : `−${fmt(-v, dp)}`);
/** An error for the table: enough decimals to show it, or 0 when it is exact. */
function errText(e: number): string {
  const m = Math.abs(e);
  if (m < 1e-9) return '0';
  return signed(e, m >= 100 ? 0 : m >= 10 ? 1 : m >= 0.1 ? 2 : m >= 0.001 ? 3 : 4);
}
/** The exact area: "9", "25/2 = 12.5" or "2048/3 ≈ 682.67". */
function exactText(n: number, b: number): string {
  const { num, den } = exactFraction(n, b);
  if (den === 1) return String(num);
  const v = num / den;
  return `${num}/${den} ${Number.isInteger(v * 100) ? '=' : '≈'} ${fmt(v)}`;
}
const integral = (n: number, b: number) => `∫${sub(0)}${sup(b)} ${xPow(n)} dx`;
const kName = (N: number) => (N >= 1000 ? `${N / 1000}k` : String(N));

interface Plot {
  X: (x: number) => number;
  Y: (y: number) => number;
}

/** Axes and y = xⁿ on [0, b], scaled to fill the plot box. */
function plot(sc: Scene, n: number, b: number): Plot {
  const ymax = f(n, b);
  const X = (x: number) => (x / b) * G.plotW;
  const Y = (y: number) => G.plotH - (y / ymax) * G.plotH;
  sc.line(0, G.plotH, G.plotW, G.plotH, { cls: 'stroke thin' });
  sc.line(0, 0, 0, G.plotH, { cls: 'stroke thin' });
  sc.text(0, G.plotH + 9, '0', { size: 11, cls: 'muted-text' });
  sc.text(G.plotW, G.plotH + 9, String(b), { size: 11, cls: 'muted-text' });
  return { X, Y };
}
function curve(sc: Scene, n: number, b: number, P: Plot): void {
  const pts: [number, number][] = Array.from({ length: G.curveSamples + 1 }, (_, i) => {
    const x = (b * i) / G.curveSamples;
    return [P.X(x), P.Y(f(n, x))];
  });
  sc.poly(pts);
}

/** The estimates table under the plot: N | value | error. Returns the y of the next free row. */
function table(sc: Scene, rows: Estimate[], label: string, caption: (r: Estimate) => string): number {
  const top = G.plotH + 26;
  rows.forEach((r, k) => {
    const step = k + 1;
    const y = top + k * G.row;
    sc.text(0, y, `${label}${kName(r.N)}`, { step, anchor: 'start', size: G.font, cls: 'muted-text' });
    sc.text(108, y, fmt(r.value), { step, anchor: 'end', size: G.font });
    sc.text(G.plotW, y, errText(r.error), { step, anchor: 'end', size: 11, cls: 'muted-text' });
    sc.caption(step, caption(r));
  });
  return top + rows.length * G.row;
}

function finish(sc: Scene, step: number, y: number, n: number, b: number, caption: string): Scene {
  sc.text(G.plotW / 2, y + 6, `= ${exactText(n, b)}`, { step, cls: 'answer', size: G.lineFont });
  sc.caption(step, caption);
  return sc.fit();
}

function drawRiemann(n: number, b: number): Scene {
  const sc = new Scene();
  const P = plot(sc, n, b);
  const rows = riemannRows(n, b);
  rows.forEach((r, k) => {
    if (r.N > G.maxDrawnN) return;
    const w = b / r.N;
    for (let i = 0; i < r.N; i++) {
      const h = f(n, i * w);
      sc.rect(P.X(i * w), P.Y(h), P.X(w), G.plotH - P.Y(h), { step: k + 1, hot: [k + 1] });
    }
  });
  curve(sc, n, b, P);
  sc.caption(0, `Area under ${xPow(n)} from 0 to ${b}: stack thin rectangles`);
  const y = table(sc, rows, 'N=', (r) => `${r.N} strips (left edges): ${fmt(r.value)}, under by ${fmt(-r.error)}`);
  return finish(sc, rows.length + 1, y, n, b, `Error shrinks like 1/N, towards the exact ${exactText(n, b)}`);
}

function drawTrapezoid(n: number, b: number): Scene {
  const sc = new Scene();
  const P = plot(sc, n, b);
  const rows = trapezoidRows(n, b);
  rows.forEach((r, k) => {
    if (r.N > G.maxDrawnN) return;
    const w = b / r.N;
    for (let i = 0; i < r.N; i++) {
      const x0 = i * w;
      const x1 = x0 + w;
      sc.poly([[P.X(x0), G.plotH], [P.X(x0), P.Y(f(n, x0))], [P.X(x1), P.Y(f(n, x1))], [P.X(x1), G.plotH]], { closed: true, step: k + 1, hot: [k + 1] });
    }
  });
  curve(sc, n, b, P);
  sc.caption(0, `Area under ${xPow(n)} from 0 to ${b}: join the points with straight lines`);
  const y = table(sc, rows, 'N=', (r) => `${r.N} trapezoids: ${fmt(r.value)}, ${r.error > 1e-9 ? `over by ${fmt(r.error)}` : 'exact'}`);
  const cap = n === 1 ? `A straight line is exact for every N: ${exactText(n, b)}` : `Error shrinks like 1/N²: double N, a quarter of the error`;
  return finish(sc, rows.length + 1, y, n, b, cap);
}

function drawSimpson(n: number, b: number): Scene {
  const sc = new Scene();
  const P = plot(sc, n, b);
  const rows = simpsonRows(n, b);
  rows.forEach((r, k) => {
    const w = b / r.N;
    for (let i = 0; i < r.N; i += 2) {
      const x0 = i * w;
      const arc: [number, number][] = Array.from({ length: G.parabolaSamples + 1 }, (_, j) => {
        const x = x0 + (2 * w * j) / G.parabolaSamples;
        return [P.X(x), P.Y(simpsonParabola(n, x0, w, x))];
      });
      sc.poly([[P.X(x0), G.plotH], ...arc, [P.X(x0 + 2 * w), G.plotH]], { closed: true, step: k + 1, hot: [k + 1] });
    }
  });
  curve(sc, n, b, P);
  sc.caption(0, `Area under ${xPow(n)} from 0 to ${b}: fit a parabola to each pair of strips`);
  const y = table(sc, rows, 'N=', (r) => `${r.N} strips: ${fmt(r.value, 3)}, ${Math.abs(r.error) < 1e-9 ? 'exact' : `off by ${errText(r.error)}`}`);
  const cap = n <= 3 ? `Exact for cubics and below, even with N = 2: ${exactText(n, b)}` : 'Error shrinks like 1/N⁴: double N, 1/16 of the error';
  return finish(sc, rows.length + 1, y, n, b, cap);
}

function drawMonte(n: number, b: number): Scene {
  const sc = new Scene();
  const P = plot(sc, n, b);
  const M = monteCarlo(n, b);
  sc.rect(0, 0, G.plotW, G.plotH, { cls: 'box' });
  const firstN = M.rows[0]?.N ?? 0;
  for (let k = 0; k < INTEGRAL.drawn; k++) {
    const [u, v] = dart(k);
    sc.dot(u * G.plotW, G.plotH - v * G.plotH, G.dartR, { step: k < firstN ? 1 : 2, cls: v < f(n, u) ? 'dot' : 'dot faint' });
  }
  curve(sc, n, b, P);
  sc.caption(0, `Throw darts at the ${b} × ${f(n, b)} box: the share under ${xPow(n)} is the area`);
  const hits = new Map(M.rows.map((r) => [r.N, r.hits]));
  const y = table(sc, M.rows, '', (r) => `${hits.get(r.N)} of ${r.N} darts under: ${M.box} × ${hits.get(r.N)}/${r.N} = ${fmt(r.value)}`);
  return finish(sc, M.rows.length + 1, y, n, b, 'Random error shrinks like 1/√N: 100k darts get within about 1%');
}

/** A column of formula lines, one per step; the last one is the answer. */
function lines(sc: Scene, rows: { text: string; caption: string }[]): Scene {
  rows.forEach((r, k) => {
    const last = k === rows.length - 1;
    sc.text(0, k * G.lineH, r.text, { step: k, anchor: 'start', size: G.lineFont, cls: last ? 'answer' : undefined });
    sc.caption(k, r.caption);
  });
  return sc.fit();
}

function drawFtc(n: number, b: number): Scene {
  const F = ftc(n, b);
  const p = n + 1;
  return lines(new Scene(), [
    { text: integral(n, b), caption: `The area under ${xPow(n)} from 0 to ${b}` },
    { text: `F(x) = ${xPow(p)}/${p}`, caption: 'Antiderivative: raise the power by one, divide by the new power' },
    { text: `F′(x) = ${xPow(n)} ✓`, caption: `Check: F′(x) = ${p}·${xPow(n)}/${p} = ${xPow(n)}, the curve itself` },
    { text: `F(${b}) − F(0)`, caption: 'Fundamental theorem: area = F(b) − F(0)' },
    { text: `= ${b ** p}/${p} − 0`, caption: `F(${b}) = ${b}${sup(p)}/${p} = ${b ** p}/${p}, F(0) = 0` },
    { text: `= ${exactText(n, b)}`, caption: `Exact: ${integral(n, b)} = ${fmt(F.answer)}` },
  ]);
}

function drawParts(n: number, b: number): Scene {
  const P = byParts(n, b);
  const du = n === 1 ? 'dx' : `${n}${xPow(n - 1)} dx`;
  const nI = n === 1 ? 'I' : `${n}I`;
  return lines(new Scene(), [
    { text: `I = ${integral(n, b)}`, caption: `Call the area I` },
    { text: `u = ${xPow(n)}, v = x`, caption: `By parts with u = ${xPow(n)} and dv = dx, so v = x` },
    { text: `du = ${du}`, caption: `Differentiate u: du = ${du}` },
    { text: `I = [uv]${sub(0)}${sup(b)} − ∫v du`, caption: '∫u dv = [uv] − ∫v du' },
    { text: `I = ${P.boundary} − ${nI}`, caption: `[x·${xPow(n)}] = ${b}${sup(n + 1)} = ${P.boundary}; ∫x·${du} = ${nI}, the same integral` },
    { text: `${n + 1}I = ${P.boundary}`, caption: `Move ${nI} across: I appears on one side only` },
    { text: `I = ${exactText(n, b)}`, caption: `Divide by ${n + 1}: I = ${fmt(P.answer)}` },
  ]);
}

export const grid: GridSpec = {
  id: 'integrals',
  sliders: [
    { label: 'n', start: 2, min: 1, max: 5 },
    { label: 'b', start: 3, min: 1, max: 5 },
  ],
  methods: [
    { id: 'riemann', title: 'Riemann sums', draw: ([n = 2, b = 3]) => drawRiemann(n, b) },
    { id: 'trapezoid', title: 'Trapezoid rule', draw: ([n = 2, b = 3]) => drawTrapezoid(n, b) },
    { id: 'simpson', title: "Simpson's rule", draw: ([n = 2, b = 3]) => drawSimpson(n, b) },
    { id: 'ftc', title: 'Antiderivative (FTC)', draw: ([n = 2, b = 3]) => drawFtc(n, b) },
    { id: 'parts', title: 'By parts', draw: ([n = 2, b = 3]) => drawParts(n, b) },
    { id: 'monte', title: 'Monte Carlo', draw: ([n = 2, b = 3]) => drawMonte(n, b) },
  ],
  problem: ([n = 2, b = 3]) => `${integral(n, b)} = ${exactText(n, b)}`,
};
