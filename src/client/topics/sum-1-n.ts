/** Sum 1 to n, five ways: each turns the pure maths in src/topics/sum-1-n.ts into a step-by-step Scene. */
import { formula, gaussPairing, halfSquare, induction, SUM, twoStaircases } from '../../topics/sum-1-n';
import type { GridSpec } from '../grid';
import { Scene } from '../scene';

/** Sum drawing sizes (SVG units). */
const SM = {
  font: 14,
  small: 12,
  row: 20,
  /** Pairing list cell width. */
  cell: 28,
  /** The staircase pictures fit in this many units. */
  picture: 170,
  /** Largest cell size in the staircase pictures. */
  maxCell: 40,
  /** Small pictures are padded out to about this width so they don't blow up. */
  minWidth: 150,
  domino: { w: 9, h: 22, gap: 4 },
};

const half = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));
const capNote = (n: number) => (n > SUM.drawCap ? ` (grid hidden above ${SUM.drawCap})` : '');

function drawPairing(n: number): Scene {
  const sc = new Scene();
  const G = gaussPairing(n);
  const long = n > SUM.listAll;
  const shown: (number | null)[] = long
    ? [...Array.from({ length: SUM.listEnds }, (_, k) => k + 1), null, ...Array.from({ length: SUM.listEnds }, (_, k) => n - SUM.listEnds + 1 + k)]
    : Array.from({ length: n }, (_, k) => k + 1);
  const xs = shown.map((_, k) => k * SM.cell);
  const nodes = shown.map((v, k) => sc.text(xs[k] ?? 0, 0, v === null ? '…' : String(v), { size: SM.font }));
  sc.caption(0, `1 + 2 + … + ${n}: pair the ends`);
  const arcs = Math.min(G.pairs.length, long ? SUM.listEnds : G.pairs.length);
  let step = 0;
  let deepest = 12;
  for (let i = 0; i < arcs; i++) {
    step++;
    const j = shown.length - 1 - i;
    const x1 = xs[i] ?? 0;
    const x2 = xs[j] ?? 0;
    const rx = (x2 - x1) / 2;
    const depth = rx * 0.75 + 10;
    const pts: [number, number][] = [];
    for (let t = 0; t <= 16; t++) pts.push([x1 + rx - rx * Math.cos((Math.PI * t) / 16), 12 + depth * Math.sin((Math.PI * t) / 16)]);
    sc.poly(pts, { step, cls: 'stroke curve lineA' });
    sc.text(x1 + rx, 12 + depth - 9, String(G.pairSum), { step, size: SM.small, cls: 'carry' });
    deepest = Math.max(deepest, 12 + depth + 8);
    for (const node of [nodes[i], nodes[j]]) if (node) sc.heat(node, [step]);
    const p = G.pairs[i];
    if (p) sc.caption(step, `${p.lo} + ${p.hi} = ${G.pairSum}`);
  }
  const width = xs[xs.length - 1] ?? 0;
  let y = deepest + 8;
  if (G.pairs.length) {
    step++;
    sc.text(width / 2, y, `${G.pairs.length} × ${G.pairSum} = ${G.pairs.length * G.pairSum}`, { step, size: SM.font });
    sc.caption(step, `Every pair makes ${G.pairSum}, and there are ${G.pairs.length} pair${G.pairs.length === 1 ? '' : 's'}`);
    y += SM.row;
  }
  if (G.middle) {
    step++;
    const k = shown.indexOf(G.middle);
    if (k >= 0) sc.ring(xs[k] ?? 0, 0, 11, { step });
    sc.text(width / 2, y, `+ ${G.middle}`, { step, size: SM.font });
    sc.caption(step, `${n} is odd: ${G.middle} in the middle has no partner`);
    y += SM.row;
  }
  step++;
  sc.text(width / 2, y + 4, `= ${G.total}`, { step, size: SM.font + 2, cls: 'answer' });
  sc.caption(step, `1 + 2 + … + ${n} = ${G.total}`);
  return sc.fit(Math.max(8, (SM.minWidth - width) / 2));
}

/** The staircase 1, 2, …, n as a polygon: column k (from 1) is k cells tall, standing on y = 0 (drawn upwards). */
function stairs(n: number, s: number): [number, number][] {
  const pts: [number, number][] = [[0, 0]];
  for (let k = 1; k <= n; k++) pts.push([(k - 1) * s, -k * s], [k * s, -k * s]);
  pts.push([n * s, 0]);
  return pts;
}

function gridLines(sc: Scene, cols: number, rows: number, s: number, step: number): void {
  for (let i = 1; i < cols; i++) sc.line(i * s, 0, i * s, -rows * s, { step, cls: 'thin' });
  for (let j = 1; j < rows; j++) sc.line(0, -j * s, cols * s, -j * s, { step, cls: 'thin' });
}

function drawStaircases(n: number): Scene {
  const sc = new Scene();
  const T = twoStaircases(n);
  const s = Math.min(SM.maxCell, SM.picture / (n + 1));
  const W = n * s;
  const H = (n + 1) * s;
  if (n <= SUM.drawCap) gridLines(sc, n, n + 1, s, 2);
  sc.poly(stairs(n, s), { closed: true, cls: 'fill' });
  sc.caption(0, `1 + 2 + … + ${n} as a staircase of squares${capNote(n)}`);
  // The same staircase turned round fills the rest of the n × (n + 1) rectangle.
  const top: [number, number][] = [[0, -s], [0, -H], [W, -H], [W, -n * s]];
  for (let k = n; k >= 1; k--) top.push([(k - 1) * s, -k * s]);
  const B = sc.poly(top, { step: 1, closed: true, cls: 'dot faint' });
  sc.heat(B, [1]);
  sc.caption(1, 'A second copy, turned round, fits on top');
  sc.text(W / 2, 14, String(T.width), { step: 2, size: SM.font });
  sc.text(-8, -H / 2, String(T.height), { step: 2, size: SM.font, anchor: 'end' });
  const frame = sc.rect(0, -H, W, H, { step: 2, cls: 'box' });
  sc.heat(frame, [2]);
  sc.caption(2, `Together: a ${T.width} × ${T.height} rectangle`);
  sc.text(W / 2, 36, `${T.width} × ${T.height} = ${T.rectangle}`, { step: 3, size: SM.font });
  sc.caption(3, `Two staircases = ${T.rectangle} squares`);
  sc.text(W / 2, 58, `÷ 2 = ${T.total}`, { step: 4, size: SM.font + 2, cls: 'answer' });
  sc.caption(4, `One staircase is half: ${T.rectangle} ÷ 2 = ${T.total}`);
  return sc.fit();
}

function drawHalfSquare(n: number): Scene {
  const sc = new Scene();
  const Hs = halfSquare(n);
  const s = Math.min(SM.maxCell, SM.picture / n);
  const W = n * s;
  if (n <= SUM.drawCap) gridLines(sc, n, n, s, 0);
  sc.rect(0, -W, W, W, { cls: 'box' });
  const st = sc.poly(stairs(n, s), { closed: true, cls: 'stroke curve lineB' });
  sc.heat(st, [0]);
  sc.caption(0, `The staircase 1 + … + ${n} inside a ${n} × ${n} square${capNote(n)}`);
  sc.poly([[0, 0], [W, -W], [W, 0]], { step: 1, closed: true, cls: 'fill' });
  sc.line(0, 0, W, -W, { step: 1, cls: 'stroke lineA' });
  sc.text(W / 2, 14, `${n}²/2 = ${half(Hs.half)}`, { step: 1, size: SM.font });
  sc.caption(1, `The diagonal cuts the square in half: ${n}² ÷ 2 = ${half(Hs.half)}`);
  for (let k = 1; k <= n; k++) sc.poly([[(k - 1) * s, -(k - 1) * s], [(k - 1) * s, -k * s], [k * s, -k * s]], { step: 2, closed: true, cls: 'dot' });
  sc.text(W / 2, 14 + SM.row, `+ ${n} halves = ${half(Hs.diagonalHalves)}`, { step: 2, size: SM.font });
  sc.caption(2, `The steps stick out by ${n} half squares: ${half(Hs.diagonalHalves)}`);
  sc.text(W / 2, 18 + SM.row * 2, `= ${Hs.total}`, { step: 3, size: SM.font + 2, cls: 'answer' });
  sc.caption(3, `${half(Hs.half)} + ${half(Hs.diagonalHalves)} = ${Hs.total}`);
  return sc.fit();
}

function drawInduction(n: number): Scene {
  const sc = new Scene();
  const I = induction(n);
  const r = SM.row;
  sc.text(0, 0, 'S(k) = 1 + 2 + … + k', { anchor: 'start', size: SM.small, cls: 'muted-text' });
  sc.caption(0, 'Claim: S(k) = k(k + 1)/2 for every k');
  sc.text(0, r * 1.3, 'S(1) = 1 = 1·2/2 ✓', { step: 1, anchor: 'start', size: SM.small + 1 });
  sc.caption(1, 'Base: it holds for k = 1');
  sc.text(0, r * 2.5, 'S(k+1) = S(k) + (k+1)', { step: 2, anchor: 'start', size: SM.small + 1 });
  sc.caption(2, 'Step: if it holds for k, add the next number k + 1');
  sc.text(0, r * 3.5, '  = k(k+1)/2 + (k+1)', { step: 3, anchor: 'start', size: SM.small + 1 });
  sc.caption(3, 'Use the claim for k');
  sc.text(0, r * 4.5, '  = (k+1)(k+2)/2 ✓', { step: 4, anchor: 'start', size: SM.small + 1 });
  sc.caption(4, 'Take out (k + 1): the same formula for k + 1');
  // Dominoes: each true case knocks over the next, all the way to n.
  const shownN = Math.min(n, SUM.drawCap);
  const d = SM.domino;
  const y0 = r * 5.6;
  for (let k = 0; k < shownN; k++) {
    const dom = sc.rect(k * (d.w + d.gap), y0, d.w, d.h, { step: 5, cls: 'box' });
    sc.heat(dom, [5, 6]);
  }
  const endX = shownN * (d.w + d.gap) - d.gap;
  sc.text(endX + 6, y0 + d.h / 2, n > shownN ? `… ${n}` : '', { step: 5, anchor: 'start', size: SM.small, cls: 'muted-text' });
  sc.caption(5, `True for 1, so for 2, so for 3 … up to ${n}${n > shownN ? ` (${shownN} drawn)` : ''}`);
  const last = I.rungs[I.rungs.length - 1];
  const prev = I.rungs[I.rungs.length - 2];
  sc.text(0, y0 + d.h + r, `S(${n}) = ${n}·${n + 1}/2`, { step: 6, anchor: 'start', size: SM.small + 1 });
  sc.text(0, y0 + d.h + r * 2.1, `= ${I.total}`, { step: 6, anchor: 'start', size: SM.font + 2, cls: 'answer' });
  sc.caption(6, prev && last ? `S(${n}) = S(${prev.k}) + ${n} = ${prev.sum} + ${n} = ${I.total} ✓` : `S(1) = 1`);
  return sc.fit();
}

function drawFormula(n: number): Scene {
  const sc = new Scene();
  const F = formula(n);
  const r = SM.row + 4;
  const cx = 70;
  sc.text(cx, 0, 'n(n + 1) ÷ 2', { size: SM.font + 2 });
  sc.caption(0, 'The formula: n(n + 1) ÷ 2');
  sc.text(cx, r, `${n} × ${n + 1} ÷ 2`, { step: 1, size: SM.font });
  sc.caption(1, `Put in n = ${n}, so n + 1 = ${n + 1}`);
  sc.text(cx, r * 2, `${F.even} ÷ 2 = ${F.halved}`, { step: 2, size: SM.font });
  sc.caption(2, `One of ${n} and ${n + 1} is even: halve ${F.even} first`);
  sc.text(cx, r * 3, `${F.halved} × ${F.other}`, { step: 3, size: SM.font });
  sc.caption(3, `Multiply what's left: ${F.halved} × ${F.other}`);
  sc.text(cx, r * 4, `= ${F.total}`, { step: 4, size: SM.font + 4, cls: 'answer' });
  sc.text(cx, r * 5, `mean ${half(F.average)} × ${n} terms`, { step: 4, size: SM.small, cls: 'muted-text' });
  sc.caption(4, `${F.total}: the mean ${half(F.average)} times ${n} numbers`);
  return sc.fit();
}

export const grid: GridSpec = {
  id: 'sum-1-n',
  sliders: [{ label: 'n', start: 10, min: 1, max: 100 }],
  methods: [
    { id: 'pairing', title: 'Gauss pairing', draw: ([n = 10]) => drawPairing(n) },
    { id: 'staircases', title: 'Two staircases', draw: ([n = 10]) => drawStaircases(n) },
    { id: 'half-square', title: 'Half a square', draw: ([n = 10]) => drawHalfSquare(n) },
    { id: 'induction', title: 'Induction', draw: ([n = 10]) => drawInduction(n) },
    { id: 'formula', title: 'Formula n(n+1)/2', draw: ([n = 10]) => drawFormula(n) },
  ],
  problem: ([n = 10]) => `1 + 2 + … + ${n} = ${(n * (n + 1)) / 2}`,
};
