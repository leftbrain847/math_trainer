/** Adding fractions a/b + c/d, five ways. Each drawing turns the pure maths in src/topics/fractions.ts into a Scene. */
import { areaModel, butterfly, commonDenominator, fracText, lowestCommon, numberLine, type Frac } from '../../topics/fractions';
import type { GridSpec } from '../grid';
import { Scene, type Bits } from '../scene';

/** Drawing sizes (SVG units). The scene scales to its tile, so only the proportions matter. */
const FR = {
  font: 14,
  small: 12,
  rowH: 50,
  /** Widest a drawing may grow before shapes shrink to fit. */
  width: 220,
  areaMax: 56,
  areaGap: 4,
  /** Draw cut lines only when the pieces are at least this wide. */
  minCut: 2.5,
  lineW: 170,
  lineArcHigh: 64,
  lineArcLow: 38,
  wingGap: 110,
  wingRise: 20,
  wingMinor: 13,
  wingReach: 22,
};

/** Text width estimate, matching Scene.text. */
const textW = (s: string, size: number) => s.length * size * 0.62;

/** A stacked fraction centred on (x, y). Returns its nodes and width. */
function frac(sc: Scene, x: number, y: number, f: Frac, b: Bits = {}): { top: SVGElement; bar: SVGElement; bottom: SVGElement; w: number } {
  const w = Math.max(textW(String(f.n), FR.font), textW(String(f.d), FR.font)) + 6;
  const top = sc.text(x, y - 11, String(f.n), { ...b, size: FR.font });
  const bar = sc.line(x - w / 2, y, x + w / 2, y, { step: b.step, cls: b.cls === 'answer' ? 'stroke lineA' : 'stroke' });
  const bottom = sc.text(x, y + 11, String(f.d), { ...b, size: FR.font });
  return { top, bar, bottom, w };
}

type Part = Frac | string;
/** A row of fractions and operators starting at x; returns the fraction nodes in order. */
function expr(sc: Scene, x0: number, y: number, parts: Part[], b: Bits = {}): ReturnType<typeof frac>[] {
  let x = x0;
  const out: ReturnType<typeof frac>[] = [];
  for (const p of parts) {
    if (typeof p === 'string') {
      const w = textW(p, FR.font) + 8;
      sc.text(x + w / 2, y, p, { step: b.step, size: FR.font });
      x += w;
    } else if (p.d === 1) {
      const w = textW(String(p.n), FR.font) + 6;
      sc.text(x + w / 2, y, String(p.n), { ...b, size: FR.font });
      x += w;
    } else {
      const w = Math.max(textW(String(p.n), FR.font), textW(String(p.d), FR.font)) + 6;
      out.push(frac(sc, x + w / 2, y, p, b));
      x += w;
    }
  }
  return out;
}

const F = (n: number, d: number): Frac => ({ n, d });
const plus = (a: number, b: number, c: number, d: number) => `${a}/${b} + ${c}/${d}`;

/** The simplify step shared by the "bring over one denominator" methods. */
function finish(sc: Scene, y: number, step: number, sum: number, den: number, ans: Frac & { g: number }): void {
  if (ans.g > 1) {
    expr(sc, 0, y, ['=', ans], { step, cls: 'answer' });
    sc.caption(step, `Divide top and bottom by ${ans.g}: ${sum}/${den} = ${fracText(ans)}`);
  }
}

function drawCommon(a: number, b: number, c: number, d: number): Scene {
  const sc = new Scene();
  const C = commonDenominator(a, b, c, d);
  const [fa, fc] = expr(sc, 0, 0, [F(a, b), '+', F(c, d)]);
  sc.caption(0, `${plus(a, b, c, d)}: make the bottoms match`);
  expr(sc, 0, FR.rowH, ['=', F(C.an, C.den)], { step: 1 });
  if (fc) sc.heat(fc.bottom, [1]);
  sc.caption(1, `Times ${a}/${b} top and bottom by ${d}: ${C.an}/${C.den}`);
  const w1 = textW('=', FR.font) + 8 + Math.max(textW(String(C.an), FR.font), textW(String(C.den), FR.font)) + 6;
  expr(sc, w1, FR.rowH, ['+', F(C.cn, C.den)], { step: 2 });
  if (fa) sc.heat(fa.bottom, [2]);
  sc.caption(2, `Times ${c}/${d} top and bottom by ${b}: ${C.cn}/${C.den}`);
  const done = C.answer.g === 1;
  expr(sc, 0, FR.rowH * 2, ['=', F(C.sum, C.den)], { step: 3, cls: done ? 'answer' : undefined });
  sc.caption(3, `Same bottoms, add the tops: ${C.an} + ${C.cn} = ${C.sum}${done ? ', already simplest' : ''}`);
  finish(sc, FR.rowH * 3, 4, C.sum, C.den, C.answer);
  return sc.fit();
}

function drawLowest(a: number, b: number, c: number, d: number): Scene {
  const sc = new Scene();
  const L = lowestCommon(a, b, c, d);
  const [fa, fc] = expr(sc, 0, 0, [F(a, b), '+', F(c, d)]);
  sc.caption(0, `${plus(a, b, c, d)}: find the smallest shared bottom`);
  const big = Math.max(b, d);
  const small = Math.min(b, d);
  const m = L.multiples;
  const shown = m.length <= 4 ? m.join(', ') : `${m[0]}, ${m[1]}, …, ${L.den}`;
  sc.text(0, FR.rowH * 0.8, `${big}s: ${shown}`, { step: 1, anchor: 'start', size: FR.small, cls: 'muted-text' });
  if (fa) sc.heat(fa.bottom, [1]);
  if (fc) sc.heat(fc.bottom, [1]);
  sc.caption(1, `Count in ${big}s until ${small} goes in: ${L.den}`);
  const y = FR.rowH * 1.6;
  const [ra] = expr(sc, 0, y, ['=', F(L.an, L.den)], { step: 2 });
  sc.caption(2, `${a}/${b} = ${L.an}/${L.den} (top and bottom × ${L.ka})`);
  const w1 = textW('=', FR.font) + 8 + (ra?.w ?? 20);
  expr(sc, w1, y, ['+', F(L.cn, L.den)], { step: 3 });
  sc.caption(3, `${c}/${d} = ${L.cn}/${L.den} (top and bottom × ${L.kc})`);
  const done = L.answer.g === 1;
  expr(sc, 0, y + FR.rowH, ['=', F(L.sum, L.den)], { step: 4, cls: done ? 'answer' : undefined });
  sc.caption(4, `Add the tops: ${L.an} + ${L.cn} = ${L.sum}${done ? ', already simplest' : ''}`);
  finish(sc, y + FR.rowH * 2, 5, L.sum, L.den, L.answer);
  return sc.fit();
}

/** A closed loop around the segment p→q: the butterfly's wing. */
function wing(p: [number, number], q: [number, number], minor: number): [number, number][] {
  const cx = (p[0] + q[0]) / 2;
  const cy = (p[1] + q[1]) / 2;
  const dx = q[0] - p[0];
  const dy = q[1] - p[1];
  const len = Math.hypot(dx, dy) || 1;
  const major = len / 2 + FR.wingReach;
  const ux = dx / len;
  const uy = dy / len;
  return Array.from({ length: 24 }, (_, k) => {
    const t = (k / 24) * Math.PI * 2;
    const a = Math.cos(t) * major;
    const m = Math.sin(t) * minor;
    return [cx + a * ux - m * uy, cy + a * uy + m * ux];
  });
}

function drawButterfly(a: number, b: number, c: number, d: number): Scene {
  const sc = new Scene();
  const B = butterfly(a, b, c, d);
  const gap = FR.wingGap;
  const y = 50;
  const h = FR.wingRise;
  /** A tall stacked fraction, so the wings clear the other fraction's numbers. */
  const tall = (x: number, f: Frac) => {
    const w = Math.max(textW(String(f.n), FR.font), textW(String(f.d), FR.font)) + 6;
    sc.line(x - w / 2, y, x + w / 2, y);
    return { top: sc.text(x, y - h, String(f.n), { size: FR.font }), bottom: sc.text(x, y + h, String(f.d), { size: FR.font }) };
  };
  const fa = tall(0, F(a, b));
  sc.text(gap / 2, y, '+', { size: FR.font });
  const fc = tall(gap, F(c, d));
  sc.caption(0, `${plus(a, b, c, d)}: multiply along the wings`);
  sc.poly(wing([0, y - h], [gap, y + h], FR.wingMinor), { step: 1, closed: true, cls: 'stroke curve lineA' });
  sc.text(0, y - h - 30, String(B.left), { step: 1, size: FR.font });
  sc.heat(fa.top, [1]);
  sc.heat(fc.bottom, [1]);
  sc.caption(1, `Left wing: ${a} × ${d} = ${B.left}`);
  sc.poly(wing([gap, y - h], [0, y + h], FR.wingMinor), { step: 2, closed: true, cls: 'stroke curve lineB' });
  sc.text(gap, y - h - 30, String(B.right), { step: 2, size: FR.font });
  sc.heat(fc.top, [2]);
  sc.heat(fa.bottom, [2]);
  sc.caption(2, `Right wing: ${c} × ${b} = ${B.right}`);
  sc.poly(
    [
      [0, y + h + 16],
      [gap / 2, y + h + 26],
      [gap, y + h + 16],
    ],
    { step: 3, cls: 'stroke curve' },
  );
  sc.text(gap / 2, y + h + 40, String(B.bottom), { step: 3, size: FR.font });
  sc.heat(fa.bottom, [3]);
  sc.heat(fc.bottom, [3]);
  sc.caption(3, `Body: ${b} × ${d} = ${B.bottom}, the new bottom`);
  const done = B.answer.g === 1;
  const yr = y + h + 80;
  expr(sc, 0, yr, ['=', F(B.top, B.bottom)], { step: 4, cls: done ? 'answer' : undefined });
  sc.caption(4, `Add the wings on top: ${B.left} + ${B.right} = ${B.top}${done ? ', already simplest' : ''}`);
  finish(sc, yr + FR.rowH, 5, B.top, B.bottom, B.answer);
  return sc.fit();
}

function drawArea(a: number, b: number, c: number, d: number): Scene {
  const sc = new Scene();
  const A = areaModel(a, b, c, d);
  const g = FR.areaGap;
  const opW = 22;
  const topN = A.wholesA + A.wholesC;
  const S = Math.min(FR.areaMax, (FR.width - opW - g * (topN - 2)) / topN, (FR.width - opW - g * (A.wholesSum - 1)) / A.wholesSum);
  const xOf = (k: number, x0: number) => x0 + k * (S + g);
  const xC = A.wholesA * (S + g) - g + opW;
  const yTop = 0;
  const yBot = S + 34;
  const cutCols = (x0: number, y0: number, wholes: number, step: number) => {
    if (S / b < FR.minCut) return;
    for (let w = 0; w < wholes; w++) for (let k = 1; k < b; k++) sc.line(xOf(w, x0) + (S * k) / b, y0, xOf(w, x0) + (S * k) / b, y0 + S, { step, cls: 'stroke thin' });
  };
  const cutRows = (x0: number, y0: number, wholes: number, step: number) => {
    if (S / d < FR.minCut) return;
    for (let w = 0; w < wholes; w++) for (let k = 1; k < d; k++) sc.line(xOf(w, x0), y0 + (S * k) / d, xOf(w, x0) + S, y0 + (S * k) / d, { step, cls: 'stroke thin' });
  };
  /** Shade `cols` whole columns (each 1/b of a whole) starting at global column `from`, plus `extra` cells of the next column. */
  const shadeCols = (x0: number, y0: number, from: number, cols: number, extra: number, step: number, cls: string) => {
    for (let j = from; j < from + cols; ) {
      const w = Math.floor(j / b);
      const end = Math.min(from + cols, (w + 1) * b);
      sc.rect(xOf(w, x0) + (S * (j % b)) / b, y0, (S * (end - j)) / b, S, { step, cls });
      j = end;
    }
    if (extra) {
      const j = from + cols;
      const w = Math.floor(j / b);
      sc.rect(xOf(w, x0) + (S * (j % b)) / b, y0, S / b, (S * extra) / d, { step, cls });
    }
  };
  const shadeRows = (x0: number, y0: number, rows: number, step: number, cls: string) => {
    for (let i = 0; i < rows; ) {
      const w = Math.floor(i / d);
      const end = Math.min(rows, (w + 1) * d);
      sc.rect(xOf(w, x0), y0 + (S * (i % d)) / d, S, (S * (end - i)) / d, { step, cls });
      i = end;
    }
  };
  const outline = (x0: number, y0: number, wholes: number, step: number) => {
    for (let w = 0; w < wholes; w++) sc.rect(xOf(w, x0), y0, S, S, { step, cls: 'box' });
  };
  const label = (x0: number, wholes: number, y: number, s: string, step: number) => sc.text(x0 + (wholes * (S + g) - g) / 2, y, s, { step, size: FR.small });

  outline(0, yTop, A.wholesA, 0);
  outline(xC, yTop, A.wholesC, 0);
  sc.text(xC - opW / 2, yTop + S / 2, '+', { size: FR.font });
  label(0, A.wholesA, yTop - 12, `${a}/${b}`, 0);
  label(xC, A.wholesC, yTop - 12, `${c}/${d}`, 0);
  sc.caption(0, `${plus(a, b, c, d)} as areas of unit squares`);

  shadeCols(0, yTop, 0, a, 0, 1, 'fill');
  cutCols(0, yTop, A.wholesA, 1);
  sc.caption(1, `${a}/${b}: cut into ${b} columns, shade ${a}`);
  shadeRows(xC, yTop, c, 2, 'answer faint');
  cutRows(xC, yTop, A.wholesC, 2);
  sc.caption(2, `${c}/${d}: cut into ${d} rows, shade ${c}`);
  cutRows(0, yTop, A.wholesA, 3);
  cutCols(xC, yTop, A.wholesC, 3);
  sc.caption(3, `Cut both ways: ${b * d} cells each, so ${A.cellsA}/${b * d} and ${A.cellsC}/${b * d}`);

  const x0 = opW;
  sc.text(opW / 2, yBot + S / 2, '=', { step: 4, size: FR.font });
  outline(x0, yBot, A.wholesSum, 4);
  shadeCols(x0, yBot, 0, a, 0, 4, 'fill');
  shadeCols(x0, yBot, a, Math.floor(A.cellsC / d), A.cellsC % d, 4, 'answer faint');
  cutCols(x0, yBot, A.wholesSum, 4);
  cutRows(x0, yBot, A.wholesSum, 4);
  const total = A.cellsA + A.cellsC;
  sc.caption(4, `Put the cells together: ${A.cellsA} + ${A.cellsC} = ${total}/${b * d}`);
  const ans = fracText(A.answer);
  sc.text(x0 + (A.wholesSum * (S + g) - g) / 2, yBot + S + 16, `= ${ans}`, { step: 5, cls: 'answer', size: FR.font });
  sc.caption(5, A.answer.g > 1 ? `Simplify: ${total}/${b * d} = ${ans}` : `${total}/${b * d} is already simplest`);
  return sc.fit();
}

/** An arc jump from x1 to x2 along the line at y = 0, peaking at height h. */
function arc(x1: number, x2: number, h: number): [number, number][] {
  return Array.from({ length: 17 }, (_, k) => {
    const t = k / 16;
    return [x1 + (x2 - x1) * t, -h * Math.sin(Math.PI * t)];
  });
}

function drawLine(a: number, b: number, c: number, d: number): Scene {
  const sc = new Scene();
  const N = numberLine(a, b, c, d);
  const unit = FR.lineW / N.wholes;
  const at = (v: number) => v * unit;
  sc.line(0, 0, FR.lineW, 0);
  for (let w = 0; w <= N.wholes; w++) {
    sc.line(at(w), -7, at(w), 7);
    if (unit >= 20 || w === 0 || w === N.wholes) sc.text(at(w), 18, String(w), { size: FR.font, cls: 'muted-text' });
  }
  sc.caption(0, `${plus(a, b, c, d)} on a number line`);
  const p = a / b;
  const s = N.landing / N.L;
  const ticks = (from: number, to: number, den: number, step: number) => {
    if (unit / den < FR.minCut) return;
    for (let k = Math.ceil(from * den - 1e-9); k <= to * den + 1e-9; k++) sc.line(at(k / den), -5, at(k / den), 0, { step, cls: 'stroke thin' });
  };
  ticks(0, p, b, 1);
  sc.poly(arc(0, at(p), FR.lineArcHigh), { step: 1, cls: 'stroke curve lineA' });
  sc.text(at(p) / 2, -FR.lineArcHigh - 12, `${a}/${b}`, { step: 1, size: FR.font });
  sc.caption(1, `Jump ${a}/${b}: ${a} step${a > 1 ? 's' : ''} of 1/${b}`);
  ticks(p, s, d, 2);
  sc.poly(arc(at(p), at(s), FR.lineArcLow), { step: 2, cls: 'stroke curve lineB' });
  sc.text((at(p) + at(s)) / 2, -FR.lineArcLow - 12, `+${c}/${d}`, { step: 2, size: FR.font });
  sc.caption(2, `Then ${c}/${d} more: ${c} step${c > 1 ? 's' : ''} of 1/${d}`);
  const fine = unit / N.L >= FR.minCut;
  if (fine) for (let k = 1; k <= N.landing; k++) sc.line(at(k / N.L), 0, at(k / N.L), 5, { step: 3, cls: 'stroke thin' });
  sc.caption(3, `In ${N.L}ths: ${N.first}/${N.L} + ${N.second}/${N.L} = ${N.landing}/${N.L}${fine ? '' : ' (too fine to tick)'}`);
  sc.dot(at(s), 0, 4, { step: 4 });
  const ans = fracText(N.answer);
  sc.text(Math.min(FR.lineW - 12, Math.max(12, at(s))), 42, ans, { step: 4, cls: 'answer', size: FR.font + 2 });
  sc.caption(4, `Land on ${N.answer.g > 1 ? `${N.landing}/${N.L} = ` : ''}${ans}`);
  return sc.fit();
}

const METHODS: { id: string; title: string; draw: (a: number, b: number, c: number, d: number) => Scene }[] = [
  { id: 'common', title: 'Common denominator', draw: drawCommon },
  { id: 'lowest', title: 'Lowest common denom.', draw: drawLowest },
  { id: 'butterfly', title: 'Butterfly', draw: drawButterfly },
  { id: 'area', title: 'Area model', draw: drawArea },
  { id: 'line', title: 'Number line', draw: drawLine },
];

export const grid: GridSpec = {
  id: 'fractions',
  sliders: [
    { label: 'a', start: 3, min: 1, max: 12 },
    { label: 'b', start: 4, min: 2, max: 12 },
    { label: 'c', start: 1, min: 1, max: 12 },
    { label: 'd', start: 6, min: 2, max: 12 },
  ],
  methods: METHODS.map((m) => ({ id: m.id, title: m.title, draw: ([a = 1, b = 2, c = 1, d = 2]) => m.draw(a, b, c, d) })),
  problem: ([a = 1, b = 2, c = 1, d = 2]) => `${plus(a, b, c, d)} = ${fracText(commonDenominator(a, b, c, d).answer)}`,
};
