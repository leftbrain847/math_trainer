/** The six percentage drawings. Each turns the pure maths in src/topics/percent.ts into a step-by-step Scene. */
import { asFraction, buildingBlocks, decimalMultiply, fmt, hundredGrid, proportion, swap } from '../../topics/percent';
import type { GridSpec } from '../grid';
import { Scene } from '../scene';

/** Percentage drawing sizes (SVG units). The scene scales to its tile, so only the proportions matter. */
const PCT = {
  font: 16,
  text: 14,
  small: 12,
  eqGap: 6,
  eqRow: 22,
  /** Half the gap between a fraction's top and bottom numbers. */
  fracHalf: 11,
  fracRow: 46,
  barW: 160,
  barH: 24,
  lineW: 140,
  lineGap: 44,
  cell: 13,
};

const charW = (size: number) => size * 0.62;

/** One centred equation row: "left = right". */
function eq(sc: Scene, y: number, left: string, right: string, step: number, cls?: string): SVGElement {
  return sc.text(0, y, `${left} = ${right}`, { step, size: PCT.text, cls });
}

function drawDecimal(p: number, n: number): Scene {
  const sc = new Scene();
  const D = decimalMultiply(p, n);
  const r = PCT.eqRow;
  sc.text(0, 0, `${p}% of ${n}`, { size: PCT.font });
  sc.caption(0, `${p}% of ${n}: "of" means multiply`);
  eq(sc, r * 1.4, `${p}%`, D.decimal, 1);
  sc.caption(1, `Per cent means per 100: ${p} ÷ 100 = ${D.decimal}`);
  eq(sc, r * 2.4, `${D.decimal} × ${n}`, '?', 2);
  sc.caption(2, `So work out ${D.decimal} × ${n}`);
  eq(sc, r * 3.4, `${p} × ${n}`, String(D.whole), 3);
  sc.caption(3, `Drop the point first: ${p} × ${n} = ${D.whole}`);
  eq(sc, r * 4.6, `${D.whole} ÷ 100`, fmt(D.result), 4, 'answer');
  sc.caption(4, `Put back the 2 decimal places: ÷ 100 → ${fmt(D.result)}`);
  return sc.fit();
}

/** A stacked fraction centred on x; returns its half-width. */
function frac(sc: Scene, x: number, y: number, top: number, bottom: number, step: number, cls?: string): number {
  const half = (Math.max(String(top).length, String(bottom).length) * charW(PCT.text)) / 2 + 3;
  sc.text(x, y - PCT.fracHalf, String(top), { step, size: PCT.text, cls });
  sc.line(x - half, y, x + half, y, { step });
  sc.text(x, y + PCT.fracHalf, String(bottom), { step, size: PCT.text, cls });
  return half;
}

function drawFraction(p: number, n: number): Scene {
  const sc = new Scene();
  const F = asFraction(p, n);
  const R = PCT.fracRow;
  // Every row: "=" then a fraction (or number) centred at fx, then "× n" after it.
  const fx = 40;
  const times = (y: number, half: number, s: string, step: number) => sc.text(fx + half + 6, y, s, { step, anchor: 'start', size: PCT.text });
  const h0 = frac(sc, fx, 0, p, 100, 0);
  times(0, h0, `× ${n}`, 0);
  sc.caption(0, `${p}% of ${n} = ${p}/100 × ${n}`);
  let row = 1;
  if (F.g > 1) {
    sc.text(0, R, '=', { step: row, size: PCT.text });
    times(R, frac(sc, fx, R, F.num, F.den, row, 'carry'), `× ${n}`, row);
    sc.caption(row, `Simplify: divide top and bottom by ${F.g}, ${p}/100 = ${F.num}/${F.den}`);
    row++;
  }
  const y2 = R * row;
  sc.text(0, y2, '=', { step: row, size: PCT.text });
  if (F.divides) {
    sc.text(fx, y2, `${F.num} × ${F.share}`, { step: row, size: PCT.text });
    sc.caption(row, `${n} ÷ ${F.den} = ${F.share}: one ${F.den}th of ${n}`);
  } else {
    frac(sc, fx, y2, F.top, F.den, row);
    sc.caption(row, `Multiply the top: ${F.num} × ${n} = ${F.top}`);
  }
  row++;
  const y3 = R * row;
  sc.text(0, y3, '=', { step: row, size: PCT.text, cls: 'answer' });
  sc.text(fx, y3, fmt(F.result), { step: row, size: PCT.font, cls: 'answer' });
  sc.caption(row, F.divides ? `${F.num} × ${F.share} = ${fmt(F.result)}` : `${F.top} ÷ ${F.den} = ${fmt(F.result)}`);
  return sc.fit();
}

function drawProportion(p: number, n: number): Scene {
  const sc = new Scene();
  const P = proportion(p, n);
  const W = PCT.lineW;
  const G = PCT.lineGap;
  const xp = (W * p) / 100;
  for (const y of [0, G]) {
    sc.line(0, y, W, y);
    sc.line(0, y - 5, 0, y + 5);
    sc.line(W, y - 5, W, y + 5);
  }
  sc.text(-6, 0, '0%', { anchor: 'end', size: PCT.small, cls: 'muted-text' });
  sc.text(-6, G, '0', { anchor: 'end', size: PCT.small, cls: 'muted-text' });
  sc.text(W + 6, 0, '100%', { anchor: 'start', size: PCT.text });
  sc.text(W + 6, G, String(n), { anchor: 'start', size: PCT.text });
  sc.caption(0, `Two lines: 100% matches ${n}`);
  sc.line(xp, -5, xp, G + 5, { step: 1, cls: 'stroke zero' });
  sc.text(xp, -16, `${p}%`, { step: 1, size: PCT.text, cls: 'carry' });
  const q = sc.text(xp, G + 17, '?', { step: 1, size: PCT.text, cls: 'carry' });
  sc.caption(1, `${p}% sits the same fraction of the way along as ?`);
  const r = PCT.eqRow;
  const y0 = G + 44;
  sc.text(W / 2, y0, `${p}/100 = ?/${n}`, { step: 2, size: PCT.text });
  sc.caption(2, `Same fraction: ${p} out of 100 = ? out of ${n}`);
  sc.text(W / 2, y0 + r, `100 × ? = ${P.cross}`, { step: 3, size: PCT.text });
  sc.caption(3, `Cross-multiply: 100 × ? = ${p} × ${n} = ${P.cross}`);
  sc.heat(q, [4]);
  sc.text(W / 2, y0 + r * 2.2, `? = ${fmt(P.result)}`, { step: 4, size: PCT.font, cls: 'answer' });
  sc.caption(4, `? = ${P.cross} ÷ 100 = ${fmt(P.result)}`);
  return sc.fit();
}

function drawBlocks(p: number, n: number): Scene {
  const sc = new Scene();
  const B = buildingBlocks(p, n);
  const W = PCT.barW;
  const H = PCT.barH;
  const tenth = W / 10;
  const x0 = -W / 2;
  sc.text(0, -12, `100% = ${n}`, { size: PCT.small, cls: 'muted-text' });
  // Shading first so the outline and tenth marks draw on top.
  const shade = (x: number, w: number, step: number) => (w > 0 ? sc.rect(x0 + x, 0, w, H, { step, cls: 'fill' }) : undefined);
  const first = sc.rect(x0, 0, tenth, H, { step: 1 });
  sc.rect(x0, 0, W, H);
  for (let k = 1; k < 10; k++) sc.line(x0 + k * tenth, 0, x0 + k * tenth, H, { cls: 'stroke thin' });
  sc.caption(0, `${p}% of ${n}: build ${p}% out of 10%, 5% and 1% blocks`);
  const r = PCT.eqRow;
  let y = H + r;
  let step = 1;
  const pieces: string[] = [];
  eq(sc, y, '10%', fmt(B.tens.each), step);
  sc.heat(first, [step]);
  sc.caption(step, `10% is ${n} ÷ 10 = ${fmt(B.tens.each)}`);
  if (B.tens.count === 1) shade(0, tenth, step);
  if (B.tens.count > 1) {
    step++;
    y += r;
    eq(sc, y, `${B.tens.count * 10}%`, fmt(B.tens.count * B.tens.each), step);
    shade(0, B.tens.count * tenth, step);
    sc.caption(step, `${B.tens.count * 10}% is ${B.tens.count} × ${fmt(B.tens.each)} = ${fmt(B.tens.count * B.tens.each)}`);
  }
  if (B.tens.count) pieces.push(fmt(B.tens.count * B.tens.each));
  let x = B.tens.count * tenth;
  if (B.fives.count) {
    step++;
    y += r;
    eq(sc, y, '5%', fmt(B.fives.each), step);
    shade(x, tenth / 2, step);
    x += tenth / 2;
    pieces.push(fmt(B.fives.each));
    sc.caption(step, `5% is half of 10%: ${fmt(B.tens.each)} ÷ 2 = ${fmt(B.fives.each)}`);
  }
  if (B.ones.count) {
    step++;
    y += r;
    eq(sc, y, '1%', fmt(B.ones.each), step);
    sc.caption(step, `1% is 10% ÷ 10: ${fmt(B.tens.each)} ÷ 10 = ${fmt(B.ones.each)}`);
    const u = B.ones.count;
    if (u > 1) {
      step++;
      y += r;
      eq(sc, y, `${u}%`, fmt(u * B.ones.each), step);
      sc.caption(step, `${u}% is ${u} × ${fmt(B.ones.each)} = ${fmt(u * B.ones.each)}`);
    }
    shade(x, (u * tenth) / 10, step);
    pieces.push(fmt(u * B.ones.each));
  }
  step++;
  y += r * 1.3;
  eq(sc, y, `${p}%`, fmt(B.result), step, 'answer');
  sc.caption(step, pieces.length > 1 ? `Add the blocks: ${pieces.join(' + ')} = ${fmt(B.result)}` : `${p}% of ${n} = ${fmt(B.result)}`);
  return sc.fit();
}

function drawSwap(p: number, n: number): Scene {
  const sc = new Scene();
  const S = swap(p, n);
  const xa = 0;
  const xb = 96;
  const yb = 44;
  sc.text(xa, 0, `${p}%`, { size: PCT.font });
  sc.text((xa + xb) / 2, 0, 'of', { size: PCT.text, cls: 'muted-text' });
  sc.text(xb, 0, String(n), { size: PCT.font });
  sc.caption(0, `${p}% of ${n}: is it easier the other way round?`);
  sc.line(xa + 6, 12, xb - 6, yb - 12, { step: 1, cls: 'stroke lineA' });
  sc.line(xb - 6, 12, xa + 6, yb - 12, { step: 1, cls: 'stroke lineB' });
  sc.text(xa, yb, `${n}%`, { step: 1, size: PCT.font, cls: 'carry' });
  sc.text((xa + xb) / 2, yb, 'of', { step: 1, size: PCT.text, cls: 'muted-text' });
  sc.text(xb, yb, String(p), { step: 1, size: PCT.font, cls: 'carry' });
  sc.caption(1, `Swap: ${p}% of ${n} = ${n}% of ${p} (both are ${p} × ${n} ÷ 100)`);
  const cx = (xa + xb) / 2;
  const r = PCT.eqRow;
  const y1 = yb + r * 1.6;
  const unit = S.byTen ? '10%' : '1%';
  // Equation rows centred under the swap: left part ends just left of centre.
  const row = (y: number, left: string, right: string, step: number, cls?: string) => {
    sc.text(cx + 14, y, left, { step, anchor: 'end', size: PCT.text });
    sc.text(cx + 14 + PCT.eqGap, y, `= ${right}`, { step, anchor: 'start', size: PCT.text, cls });
  };
  row(y1, `${unit} of ${p}`, fmt(S.unit), 2);
  sc.caption(2, S.byTen ? `${n}% is ${S.times} lots of 10%. 10% of ${p} = ${fmt(S.unit)}` : `${n}% is ${n} lots of 1%. 1% of ${p} = ${fmt(S.unit)}`);
  row(y1 + r, `${S.times} × ${fmt(S.unit)}`, fmt(S.result), 3, 'answer');
  sc.caption(3, `${S.times} × ${fmt(S.unit)} = ${fmt(S.result)}`);
  return sc.fit();
}

function drawGrid(p: number, n: number): Scene {
  const sc = new Scene();
  const G = hundredGrid(p, n);
  const c = PCT.cell;
  const side = c * 10;
  const full = Math.floor(p / 10);
  const part = p % 10;
  // Shading first so the grid lines draw on top.
  if (full) sc.rect(0, 0, side, full * c, { step: 2, cls: 'fill' });
  if (part) sc.rect(0, full * c, part * c, c, { step: 2, cls: 'fill' });
  const one = sc.rect(0, 0, c, c, { step: 1 });
  sc.rect(0, 0, side, side, { cls: 'box' });
  for (let k = 1; k < 10; k++) {
    sc.line(k * c, 0, k * c, side, { cls: 'stroke thin' });
    sc.line(0, k * c, side, k * c, { cls: 'stroke thin' });
  }
  const r = PCT.eqRow;
  sc.text(side / 2, side + r * 0.9, `100 squares = ${n}`, { size: PCT.text });
  sc.caption(0, `The whole grid, 100 squares, is ${n}`);
  sc.heat(one, [1]);
  sc.text(side / 2, side + r * 1.9, `1 square = ${fmt(G.cell)}`, { step: 1, size: PCT.text });
  sc.caption(1, `1% is one square: ${n} ÷ 100 = ${fmt(G.cell)}`);
  sc.caption(2, `Shade ${p} squares for ${p}%`);
  sc.text(side / 2, side + r * 3, `${p} × ${fmt(G.cell)} = ${fmt(G.result)}`, { step: 3, size: PCT.text, cls: 'answer' });
  sc.caption(3, `${p} square${p === 1 ? "" : "s"} × ${fmt(G.cell)} = ${fmt(G.result)}`);
  return sc.fit();
}

const METHODS: { id: string; title: string; draw: (p: number, n: number) => Scene }[] = [
  { id: 'decimal', title: 'Decimal multiply', draw: drawDecimal },
  { id: 'fraction', title: 'As a fraction', draw: drawFraction },
  { id: 'proportion', title: 'Proportion', draw: drawProportion },
  { id: 'blocks', title: '10% building blocks', draw: drawBlocks },
  { id: 'swap', title: 'Swap (x% of y = y% of x)', draw: drawSwap },
  { id: 'grid', title: 'Hundred grid (1%)', draw: drawGrid },
];

export const grid: GridSpec = {
  id: 'percent',
  sliders: [
    { label: 'p', start: 35, min: 1, max: 100 },
    { label: 'n', start: 80, min: 1, max: 400 },
  ],
  methods: METHODS.map((m) => ({ id: m.id, title: m.title, draw: ([p = 1, n = 1]) => m.draw(p, n) })),
  problem: ([p = 1, n = 1]) => `${p}% of ${n} = ${fmt(p * n)}`,
};
