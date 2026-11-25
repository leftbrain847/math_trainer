/** The six addition drawings. Each turns the pure maths in src/topics/addition.ts into a step-by-step Scene. */
import { bridging, columnAdd, compensation, leftToRight, numberLine, partitioning, width, type Hop } from '../../topics/addition';
import type { GridSpec } from '../grid';
import { Scene } from '../scene';

/** Addition drawing sizes (SVG units). The scene scales to its tile, so only the proportions matter. */
const ADD = {
  col: 16,
  row: 24,
  font: 16,
  text: 14,
  small: 12,
  /** Gap between the left and right halves of an equation row. */
  eqGap: 6,
  eqRow: 22,
  hopMin: 36,
  hopSpan: 80,
  arcH: 30,
  arcPts: 12,
  /** A hop narrower than this drops its landing label to a second row so neighbours don't touch. */
  hopTight: 50,
  lineFont: 15,
  strikeHalf: 6,
  versionDy: 18,
};

const PLACE = ['ones', 'tens', 'hundreds', 'thousands'];
const placeName = (p: number) => PLACE[p] ?? `10^${p}`;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const colX = (place: number) => -(place + 0.5) * ADD.col;

/** The two numbers right-aligned in columns, with the + sign and the answer line. Returns one node per digit, by place. */
function columns(sc: Scene, a: number, b: number): { top: SVGElement[]; bottom: SVGElement[]; L: number; lineY: number; ansY: number } {
  const L = width(a, b);
  const row = (n: number, y: number) => String(n).split('').reverse().map((d, p) => sc.text(colX(p), y, d, { size: ADD.font }));
  const top = row(a, 0);
  const bottom = row(b, ADD.row);
  const left = -(L + 1) * ADD.col;
  sc.text(left + ADD.col / 2, ADD.row, '+', { size: ADD.font });
  const lineY = ADD.row * 1.6;
  sc.line(left, lineY, 4, lineY);
  return { top, bottom, L, lineY, ansY: ADD.row * 2.3 };
}

/** One equation row: left part right-aligned at x = 0, "= right" left-aligned just after. */
function eq(sc: Scene, y: number, left: string, right: string, step: number, cls?: string): SVGElement[] {
  const out = [sc.text(0, y, left, { step, anchor: 'end', size: ADD.text })];
  if (right) out.push(sc.text(ADD.eqGap, y, `= ${right}`, { step, anchor: 'start', size: ADD.text, cls }));
  return out;
}

/** An arc from xa to xb above a number line at y = 0. */
function arc(sc: Scene, xa: number, xb: number, step: number): void {
  const pts: [number, number][] = [];
  for (let t = 0; t <= ADD.arcPts; t++) pts.push([xa + ((xb - xa) * t) / ADD.arcPts, -ADD.arcH * Math.sin((Math.PI * t) / ADD.arcPts)]);
  sc.poly(pts, { step });
}

/** Hops along an empty number line (not to scale: small hops get a minimum width). Returns the line's width. */
function hopLine(sc: Scene, start: number, hops: Hop[], first: number): number {
  const total = hops.reduce((s, h) => s + h.size, 0) || 1;
  const widths = hops.map((h) => ADD.hopMin + (ADD.hopSpan * h.size) / total);
  const W = widths.reduce((s, w) => s + w, 0);
  sc.line(-6, 0, W + 6, 0);
  sc.line(0, -5, 0, 5);
  sc.text(0, 18, String(start), { size: ADD.lineFont });
  let x = 0;
  let low = false;
  hops.forEach((h, k) => {
    const step = first + k;
    const w = widths[k] ?? ADD.hopMin;
    arc(sc, x, x + w, step);
    sc.text(x + w / 2, -ADD.arcH - 10, `+${h.size}`, { step, size: ADD.lineFont, cls: 'carry' });
    x += w;
    sc.dot(x, 0, 2.5, { step });
    low = w < ADD.hopTight && !low;
    sc.text(x, low ? 36 : 18, String(h.to), { step, size: ADD.lineFont });
  });
  return W;
}

function drawColumn(a: number, b: number): Scene {
  const sc = new Scene();
  const C = columnAdd(a, b);
  const { top, bottom, L, ansY } = columns(sc, a, b);
  sc.caption(0, `${a} + ${b}: add each column, ones first`);
  const answer: SVGElement[] = [];
  const carries: SVGElement[] = [];
  C.columns.forEach((c, k) => {
    const step = k + 1;
    for (const n of [top[c.place], bottom[c.place], carries[c.place]]) if (n) sc.heat(n, [step]);
    answer.push(sc.text(colX(c.place), ansY, String(c.digit), { step, cls: 'answer', size: ADD.font }));
    if (c.carryOut) {
      if (c.place + 1 < L) carries[c.place + 1] = sc.text(colX(c.place + 1), -ADD.row * 0.75, '1', { step, cls: 'carry', size: ADD.small });
      else answer.push(sc.text(colX(L), ansY, String(c.carryOut), { step, cls: 'answer', size: ADD.font }));
    }
    const total = c.top + c.bottom + c.carryIn;
    sc.caption(step, `${cap(placeName(c.place))}: ${c.top} + ${c.bottom}${c.carryIn ? ' + 1' : ''} = ${total}${c.carryOut ? `, write ${c.digit}, carry 1` : ''}`);
  });
  const fin = C.columns.length + 1;
  for (const n of answer) sc.heat(n, [fin]);
  sc.caption(fin, `${a} + ${b} = ${C.result}`);
  return sc.fit();
}

function drawLeft(a: number, b: number): Scene {
  const sc = new Scene();
  const R = leftToRight(a, b);
  const { top, bottom, L, ansY } = columns(sc, a, b);
  sc.caption(0, `${a} + ${b}: biggest column first, fix digits as you go`);
  // Answer slot j sits over place L − j; a fixed digit is struck and its new value written underneath.
  const shown: ({ node: SVGElement; y: number } | undefined)[] = [];
  let lowest = ansY;
  const prefix = (slots: number[], from: number, to: number) => slots.slice(from, to + 1).join('').replace(/^0+(?=\d)/, '');
  let prev = Array.from({ length: L + 1 }, () => 0);
  R.steps.forEach((s, k) => {
    const step = k + 1;
    for (const n of [top[s.place], bottom[s.place]]) if (n) sc.heat(n, [step]);
    const x = colX(s.place);
    shown[k + 1] = { node: sc.text(x, ansY, String(s.slots[k + 1]), { step, size: ADD.font }), y: ansY };
    for (const j of [...s.bumped].reverse()) {
      const old = shown[j];
      const xj = colX(L - j);
      let y = ansY;
      if (old) {
        sc.line(xj - ADD.strikeHalf, old.y, xj + ADD.strikeHalf, old.y, { step, cls: 'stroke strike' });
        y = old.y + ADD.versionDy;
      }
      shown[j] = { node: sc.text(xj, y, String(s.slots[j]), { step, size: ADD.font, cls: 'carry' }), y };
      lowest = Math.max(lowest, y);
    }
    const from = Math.min(...s.bumped, k + 1);
    const fix = s.bumped.length ? `, fix ${prefix(prev, from, k) || '0'} → ${prefix(s.slots, from, k)}` : '';
    sc.caption(step, `${cap(placeName(s.place))}: ${digit(a, s.place)} + ${digit(b, s.place)} = ${s.sum}, write ${s.sum % 10}${fix}`);
    prev = s.slots;
  });
  const fin = R.steps.length + 1;
  sc.text(-((L + 1) * ADD.col) / 2, lowest + ADD.row, `= ${R.result}`, { step: fin, cls: 'answer', size: ADD.font });
  sc.caption(fin, `Read the latest digit in each column: ${R.result}`);
  return sc.fit();
}

const digit = (n: number, place: number) => Math.floor(n / 10 ** place) % 10;

function drawPartition(a: number, b: number): Scene {
  const sc = new Scene();
  const P = partitioning(a, b);
  const r = ADD.eqRow;
  const t = (y: number, s: string, step: number, cls?: string) => sc.text(0, y, s, { step, size: ADD.text, cls });
  t(0, `${a} + ${b}`, 0);
  sc.caption(0, `${a} + ${b}: split both into hundreds, tens and ones`);
  const split = (which: 'a' | 'b') => P.sums.map((s) => s[which]).filter((v) => v).join(' + ') || '0';
  t(r * 1.3, `${a} → ${split('a')}`, 1, 'muted-text');
  t(r * 2.3, `${b} → ${split('b')}`, 1, 'muted-text');
  sc.caption(1, `${a} = ${split('a')},  ${b} = ${split('b')}`);
  P.sums.forEach((s, k) => {
    const step = k + 2;
    t(r * (3.6 + k), `${s.a} + ${s.b} = ${s.sum}`, step);
    sc.caption(step, `Add the ${placeName(s.place)}: ${s.a} + ${s.b} = ${s.sum}`);
  });
  const fin = P.sums.length + 2;
  t(r * (3.9 + P.sums.length), `${P.sums.map((s) => s.sum).join(' + ')} = ${P.result}`, fin, 'answer');
  sc.caption(fin, `Add the totals: ${P.sums.map((s) => s.sum).join(' + ')} = ${P.result}`);
  return sc.fit();
}

function drawLine(a: number, b: number): Scene {
  const sc = new Scene();
  const N = numberLine(a, b);
  sc.caption(0, `Start at ${a}, jump on by ${b} in place-value jumps`);
  const W = hopLine(sc, a, N.hops, 1);
  N.hops.forEach((h, k) => sc.caption(k + 1, `${h.from} + ${h.size} = ${h.to}`));
  const fin = N.hops.length + 1;
  sc.text(W / 2, 62, `= ${N.result}`, { step: fin, cls: 'answer', size: ADD.font });
  sc.caption(fin, `Landed on ${N.result}`);
  return sc.fit();
}

function drawCompensation(a: number, b: number): Scene {
  const sc = new Scene();
  const C = compensation(a, b);
  const r = ADD.eqRow;
  sc.text(0, 0, `${a} + ${b}`, { size: ADD.font });
  if (!C.extra) {
    sc.caption(0, `${a} + ${b}: ${b} is already a round number`);
    eq(sc, r * 1.4, `${a} + ${b}`, String(C.result), 1, 'answer');
    sc.caption(1, `Nothing to round: ${a} + ${b} = ${C.result}`);
    return sc.fit();
  }
  sc.caption(0, `${a} + ${b}: add a round number, then fix it`);
  eq(sc, r * 1.4, `${b} + ${C.extra}`, String(C.round), 1);
  sc.caption(1, `${b} is ${C.extra} short of ${C.round}: add ${C.round} instead`);
  eq(sc, r * 2.4, `${a} + ${C.round}`, String(C.over), 2);
  sc.caption(2, `${a} + ${C.round} = ${C.over}`);
  eq(sc, r * 3.6, `${C.over} − ${C.extra}`, String(C.result), 3, 'answer');
  sc.caption(3, `That was ${C.extra} too many: take ${C.extra} back, ${C.result}`);
  return sc.fit();
}

function drawBridging(a: number, b: number): Scene {
  const sc = new Scene();
  const B = bridging(a, b);
  const xL = 44;
  const xR = 190;
  const r = ADD.row;
  sc.text(xL, 0, String(a), { anchor: 'end', size: ADD.font });
  sc.text(0, r, '+', { size: ADD.font });
  sc.text(xL, r, String(b), { anchor: 'end', size: ADD.font });
  sc.caption(0, `${a} + ${b}: move some of ${b} over to make ${a} round`);
  let step = 1;
  if (B.gap) {
    // A curved arrow from the bottom number up to the top one, carrying the gap.
    const pts: [number, number][] = [];
    for (let t = 0; t <= ADD.arcPts; t++) {
      const th = Math.PI / 2 - (Math.PI * t) / ADD.arcPts;
      pts.push([xL + 8 + 14 * Math.cos(th), r / 2 + (r / 2) * Math.sin(th)]);
    }
    sc.poly(pts, { step, cls: 'stroke curve lineA' });
    sc.poly([[xL + 13, -4], [xL + 8, 0], [xL + 13, 4]], { step, cls: 'stroke curve lineA' });
    sc.text(xL + 26, r / 2, String(B.gap), { step, anchor: 'start', size: ADD.small, cls: 'carry' });
    sc.caption(step, `${a} is ${B.gap} short of ${B.target}: take ${B.gap} from ${b}`);
    step++;
  }
  sc.text(xL + 66, 0, '→', { step, size: ADD.text, cls: 'muted-text' });
  sc.text(xL + 66, r, '→', { step, size: ADD.text, cls: 'muted-text' });
  sc.text(xR, 0, String(B.target), { step, anchor: 'end', size: ADD.font });
  sc.text(xR - 50, r, '+', { step, size: ADD.font });
  sc.text(xR, r, String(B.rest), { step, anchor: 'end', size: ADD.font });
  sc.caption(step, B.gap ? `${a} + ${B.gap} = ${B.target},  ${b} − ${B.gap} = ${B.rest}: same total` : `${a} is already round: nothing to move`);
  const fin = step + 1;
  sc.line(xR - 58, r * 1.6, xR + 4, r * 1.6, { step: fin });
  sc.text(xR, r * 2.3, String(B.result), { step: fin, anchor: 'end', cls: 'answer', size: ADD.font });
  sc.caption(fin, `${B.target} + ${B.rest} = ${B.result}`);
  return sc.fit();
}

const METHODS: { id: string; title: string; draw: (a: number, b: number) => Scene }[] = [
  { id: 'column', title: 'Column with carrying', draw: drawColumn },
  { id: 'left', title: 'Left to right', draw: drawLeft },
  { id: 'line', title: 'Number line jumps', draw: drawLine },
  { id: 'compensation', title: 'Compensation', draw: drawCompensation },
  { id: 'partition', title: 'Partitioning', draw: drawPartition },
  { id: 'bridging', title: 'Bridging to 100', draw: drawBridging },
];

export const grid: GridSpec = {
  id: 'addition',
  sliders: [
    { label: 'a', start: 478, min: 1, max: 999 },
    { label: 'b', start: 365, min: 1, max: 999 },
  ],
  methods: METHODS.map((m) => ({ id: m.id, title: m.title, draw: ([a = 1, b = 1]) => m.draw(a, b) })),
  problem: ([a = 1, b = 1]) => `${a} + ${b} = ${a + b}`,
};
