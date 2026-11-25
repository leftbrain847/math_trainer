/**
 * The six subtraction drawings. Each turns the pure maths in src/topics/subtraction.ts into a step-by-step Scene.
 * When b > a every drawing works out b − a (larger − smaller) and a last step makes the answer negative.
 */
import { digits } from '../../math';
import { columnBorrow, compensation, countingUp, equalAddition, ninesComplement, numberLine, order, type Hop } from '../../topics/subtraction';
import type { GridSpec } from '../grid';
import { Scene } from '../scene';

/** Subtraction drawing sizes (SVG units). The scene scales to its tile, so only the proportions matter. */
const SUB = {
  col: 20,
  row: 24,
  font: 16,
  text: 14,
  small: 12,
  /** Height of each restacked top digit above the one it replaces. */
  versionDy: 17,
  strikeHalf: 6,
  eqGap: 6,
  eqRow: 22,
  hopMin: 36,
  hopSpan: 80,
  arcH: 30,
  arcPts: 12,
  hopTight: 50,
  lineFont: 15,
};

const PLACE = ['ones', 'tens', 'hundreds', 'thousands'];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const placeName = (p: number) => cap(PLACE[p] ?? `10^${p}`);
const colX = (place: number) => -(place + 0.5) * SUB.col;

/** The setup caption: the method's own when a ≥ b, else a note that we swap. */
const intro = (a: number, b: number, own: string) => (a >= b ? own : `${b} > ${a}: work out ${b} − ${a}, then make it negative`);

/** When b > a, one extra step turns x − y = d into a − b = −d. Returns the step after the drawing's last. */
function negTail(sc: Scene, a: number, b: number, d: number, step: number, x: number, y: number): void {
  if (a >= b) return;
  sc.text(x, y, `so ${a} − ${b} = −${d}`, { step, cls: 'answer', size: SUB.text });
  sc.caption(step, `${b} − ${a} = ${d}, so ${a} − ${b} = −${d}`);
}

function eq(sc: Scene, y: number, left: string, right: string, step: number, cls?: string): void {
  sc.text(0, y, left, { step, anchor: 'end', size: SUB.text });
  sc.text(SUB.eqGap, y, `= ${right}`, { step, anchor: 'start', size: SUB.text, cls });
}

/** Two numbers right-aligned in columns with a − sign. Returns one node per digit, by place. */
function columns(sc: Scene, x: number, y: number, yBottom: number): { top: SVGElement[]; bottom: SVGElement[]; L: number } {
  const L = digits(x).length;
  const row = (n: number, yy: number) => String(n).split('').reverse().map((d, p) => sc.text(colX(p), yy, d, { size: SUB.font }));
  const top = row(x, 0);
  const bottom = row(y, yBottom);
  sc.text(-(L + 0.5) * SUB.col, yBottom, '−', { size: SUB.font });
  return { top, bottom, L };
}

function arc(sc: Scene, xa: number, xb: number, step: number): void {
  const pts: [number, number][] = [];
  for (let t = 0; t <= SUB.arcPts; t++) pts.push([xa + ((xb - xa) * t) / SUB.arcPts, -SUB.arcH * Math.sin((Math.PI * t) / SUB.arcPts)]);
  sc.poly(pts, { step });
}

/** Hops along an empty number line (not to scale). dir 1 runs left to right, −1 right to left. Returns the line's width. */
function hopLine(sc: Scene, start: number, hops: Hop[], first: number, dir: 1 | -1): number {
  const total = hops.reduce((s, h) => s + h.size, 0) || 1;
  const widths = hops.map((h) => SUB.hopMin + (SUB.hopSpan * h.size) / total);
  const W = Math.max(SUB.hopMin, widths.reduce((s, w) => s + w, 0));
  sc.line(-6, 0, W + 6, 0);
  let x = dir === 1 ? 0 : W;
  sc.line(x, -5, x, 5);
  sc.text(x, 18, String(start), { size: SUB.lineFont });
  let low = false;
  hops.forEach((h, k) => {
    const step = first + k;
    const w = (widths[k] ?? SUB.hopMin) * dir;
    arc(sc, x, x + w, step);
    sc.text(x + w / 2, -SUB.arcH - 10, `${dir === 1 ? '+' : '−'}${h.size}`, { step, size: SUB.lineFont, cls: 'carry' });
    x += w;
    sc.dot(x, 0, 2.5, { step });
    low = Math.abs(w) < SUB.hopTight && !low;
    sc.text(x, low ? 36 : 18, String(h.to), { step, size: SUB.lineFont });
  });
  return W;
}

function drawColumn(a: number, b: number): Scene {
  const sc = new Scene();
  const { x, y } = order(a, b);
  const C = columnBorrow(x, y);
  const { top, bottom, L } = columns(sc, x, y, SUB.row);
  const lineY = SUB.row * 1.6;
  const ansY = SUB.row * 2.3;
  sc.line(-(L + 1) * SUB.col, lineY, 4, lineY);
  sc.caption(0, intro(a, b, `${x} − ${y}: ones first, borrow when the top is too small`));
  // Each top digit's latest version; a changed digit is struck and its new value stacked above.
  const cur: { node: SVGElement; y: number }[] = top.map((node) => ({ node, y: 0 }));
  const answer: SVGElement[] = [];
  C.columns.forEach((c, k) => {
    const step = k + 1;
    for (const ch of c.changes) {
      const old = cur[ch.place];
      if (!old) continue;
      const cx = colX(ch.place);
      sc.line(cx - SUB.strikeHalf, old.y, cx + SUB.strikeHalf, old.y, { step, cls: 'stroke strike' });
      const ny = old.y - SUB.versionDy;
      cur[ch.place] = { node: sc.text(cx, ny, String(ch.to), { step, size: SUB.text, cls: 'carry' }), y: ny };
    }
    const t = cur[c.place];
    if (t) sc.heat(t.node, [step]);
    const bn = bottom[c.place];
    if (bn) sc.heat(bn, [step]);
    const lead = c.digit === 0 && C.columns.slice(k).every((z) => z.digit === 0) && k > 0;
    answer.push(sc.text(colX(c.place), ansY, String(c.digit), { step, cls: lead ? 'muted-text' : 'answer', size: SUB.font }));
    const across = c.changes.length > 2 ? ' (across the 0)' : '';
    const borrow = c.changes.length ? `${c.top - 10} < ${c.bottom}, borrow a ten${across}: ` : '';
    sc.caption(step, `${placeName(c.place)}: ${borrow}${c.top} − ${c.bottom} = ${c.digit}`);
  });
  const fin = C.columns.length + 1;
  for (const n of answer) sc.heat(n, [fin]);
  sc.caption(fin, `${x} − ${y} = ${C.result}`);
  negTail(sc, a, b, C.result, fin + 1, -(L * SUB.col) / 2, ansY + SUB.row);
  return sc.fit();
}

function drawEqual(a: number, b: number): Scene {
  const sc = new Scene();
  const { x, y } = order(a, b);
  const E = equalAddition(x, y);
  const { top, bottom, L } = columns(sc, x, y, SUB.row);
  const payY = SUB.row * 1.7;
  const lineY = SUB.row * 2.2;
  const ansY = SUB.row * 2.9;
  sc.line(-(L + 1) * SUB.col, lineY, 4, lineY);
  sc.caption(0, intro(a, b, `${x} − ${y}: add the same to both numbers instead of borrowing`));
  const pays: SVGElement[] = [];
  const answer: SVGElement[] = [];
  E.columns.forEach((c, k) => {
    const step = k + 1;
    const cx = colX(c.place);
    const t = top[c.place];
    if (c.addedTen) {
      sc.line(cx - SUB.strikeHalf, 0, cx + SUB.strikeHalf, 0, { step, cls: 'stroke strike' });
      sc.text(cx, -SUB.versionDy, String(c.top), { step, size: SUB.text, cls: 'carry' });
      if (c.place + 1 < L) pays[c.place + 1] = sc.text(colX(c.place + 1), payY, '+1', { step, size: SUB.small, cls: 'carry' });
    } else if (t) sc.heat(t, [step]);
    for (const n of [bottom[c.place], pays[c.place]]) if (n) sc.heat(n, [step]);
    answer.push(sc.text(cx, ansY, String(c.digit), { step, cls: 'answer', size: SUB.font }));
    const bot = c.payback ? `(${c.bottom - 1} + 1)` : String(c.bottom);
    sc.caption(
      step,
      c.addedTen
        ? `${placeName(c.place)}: add 10 on top, 1 below next door: ${c.top} − ${bot} = ${c.digit}`
        : `${placeName(c.place)}: ${c.top} − ${bot} = ${c.digit}`,
    );
  });
  const fin = E.columns.length + 1;
  for (const n of answer) sc.heat(n, [fin]);
  sc.caption(fin, `Both grew by the same, so the gap is the same: ${E.result}`);
  negTail(sc, a, b, E.result, fin + 1, -(L * SUB.col) / 2, ansY + SUB.row);
  return sc.fit();
}

function drawCountUp(a: number, b: number): Scene {
  const sc = new Scene();
  const { x, y } = order(a, b);
  const U = countingUp(x, y);
  sc.caption(0, intro(a, b, `${x} − ${y}: count up from ${y} to ${x} in friendly hops`));
  const W = hopLine(sc, y, U.hops, 1, 1);
  U.hops.forEach((h, k) => sc.caption(k + 1, `${h.from} + ${h.size} = ${h.to}`));
  const fin = U.hops.length + 1;
  const sizes = U.hops.map((h) => h.size);
  if (sizes.length > 1) sc.text(W / 2, 62, sizes.join(' + '), { step: fin, size: SUB.text, cls: 'muted-text' });
  sc.text(W / 2, 84, `= ${U.result}`, { step: fin, cls: 'answer', size: SUB.font });
  sc.caption(fin, sizes.length ? `Add the hops: ${sizes.join(' + ')} = ${U.result}` : `Same number: the difference is 0`);
  negTail(sc, a, b, U.result, fin + 1, W / 2, 106);
  return sc.fit();
}

function drawCompensation(a: number, b: number): Scene {
  const sc = new Scene();
  const { x, y } = order(a, b);
  const C = compensation(x, y);
  const r = SUB.eqRow;
  sc.text(0, 0, `${x} − ${y}`, { size: SUB.font });
  let fin: number;
  if (!C.adjust) {
    sc.caption(0, intro(a, b, `${x} − ${y}: ${y} is already round`));
    eq(sc, r * 1.4, `${x} − ${y}`, String(C.result), 1, 'answer');
    sc.caption(1, `Nothing to round: ${x} − ${y} = ${C.result}`);
    fin = 1;
  } else {
    const adj = Math.abs(C.adjust);
    sc.caption(0, intro(a, b, `${x} − ${y}: take away a round number, then fix it`));
    eq(sc, r * 1.4, `${y} ${C.adjust > 0 ? '+' : '−'} ${adj}`, String(C.round), 1);
    sc.caption(1, `${y} is ${adj} ${C.adjust > 0 ? 'short of' : 'more than'} ${C.round}: take ${C.round} instead`);
    eq(sc, r * 2.4, `${x} − ${C.round}`, String(C.mid), 2);
    sc.caption(2, `${x} − ${C.round} = ${C.mid}`);
    eq(sc, r * 3.6, `${C.mid} ${C.adjust > 0 ? '+' : '−'} ${adj}`, String(C.result), 3, 'answer');
    sc.caption(3, C.adjust > 0 ? `Took ${adj} too many: give ${adj} back, ${C.result}` : `Took ${adj} too few: take ${adj} more, ${C.result}`);
    fin = 3;
  }
  negTail(sc, a, b, C.result, fin + 1, 0, r * (fin + 1.8));
  return sc.fit();
}

function drawLine(a: number, b: number): Scene {
  const sc = new Scene();
  const { x, y } = order(a, b);
  const N = numberLine(x, y);
  sc.caption(0, intro(a, b, `Start at ${x}, jump back ${y} in place-value jumps`));
  const W = hopLine(sc, x, N.hops, 1, -1);
  N.hops.forEach((h, k) => sc.caption(k + 1, `${h.from} − ${h.size} = ${h.to}`));
  const fin = N.hops.length + 1;
  sc.text(W / 2, 62, `= ${N.result}`, { step: fin, cls: 'answer', size: SUB.font });
  sc.caption(fin, `Landed on ${N.result}`);
  negTail(sc, a, b, N.result, fin + 1, W / 2, 84);
  return sc.fit();
}

function drawNines(a: number, b: number): Scene {
  const sc = new Scene();
  const { x, y } = order(a, b);
  const N = ninesComplement(x, y);
  const r = SUB.eqRow;
  sc.text(0, 0, `${x} − ${y}`, { size: SUB.font });
  sc.caption(0, intro(a, b, `${x} − ${y}: turn it into an addition`));
  eq(sc, r * 1.4, `${N.nines} − ${y}`, String(N.comp).padStart(N.n, '0'), 1);
  const yd = String(y).padStart(N.n, '0');
  sc.caption(1, `Nines' complement: each digit of ${yd} from 9, no borrowing`);
  eq(sc, r * 2.4, `${x} + ${N.comp}`, String(N.sum), 2);
  sc.caption(2, `Add it on: ${x} + ${N.comp} = ${N.sum}`);
  eq(sc, r * 3.4, `${N.sum} + 1`, String(N.plusOne), 3);
  sc.caption(3, `Add 1 (so we've added ${10 ** N.n} − ${y}): ${N.plusOne}`);
  // Strike the leading 1 of plusOne: it's the extra 1000 we added.
  const s = String(N.plusOne);
  const cw = SUB.text * 0.62;
  const y4 = r * 4.6;
  const left = -s.length * cw;
  sc.text(0, y4, s, { step: 4, anchor: 'end', size: SUB.text });
  sc.line(left - 1, y4, left + cw + 1, y4, { step: 4, cls: 'stroke strike' });
  sc.text(SUB.eqGap, y4, `= ${N.result}`, { step: 4, anchor: 'start', size: SUB.text, cls: 'answer' });
  sc.caption(4, `Cross off the leading 1 (take ${10 ** N.n} back): ${N.result}`);
  negTail(sc, a, b, N.result, 5, 0, r * 5.8);
  return sc.fit();
}

const METHODS: { id: string; title: string; draw: (a: number, b: number) => Scene }[] = [
  { id: 'column', title: 'Column with borrowing', draw: drawColumn },
  { id: 'equal', title: 'Equal addition', draw: drawEqual },
  { id: 'countup', title: 'Counting up', draw: drawCountUp },
  { id: 'compensation', title: 'Compensation', draw: drawCompensation },
  { id: 'line', title: 'Number line', draw: drawLine },
  { id: 'nines', title: "Nines' complement", draw: drawNines },
];

export const grid: GridSpec = {
  id: 'subtraction',
  sliders: [
    { label: 'a', start: 523, min: 1, max: 999 },
    { label: 'b', start: 278, min: 1, max: 999 },
  ],
  methods: METHODS.map((m) => ({ id: m.id, title: m.title, draw: ([a = 1, b = 1]) => m.draw(a, b) })),
  problem: ([a = 1, b = 1]) => `${a} − ${b} = ${a < b ? `−${b - a}` : a - b}`,
};

