/** Counting choices (n choose r), five ways. Each drawing turns the pure maths in src/topics/counting.ts into a Scene. */
import { factorial, firstOrders, formula, listChoices, orderedPicks, pascal, tree } from '../../topics/counting';
import type { GridSpec } from '../grid';
import { Scene } from '../scene';

/** Drawing sizes (SVG units) and caps. The scene scales to its tile, so only the proportions matter. */
const C = {
  font: 14,
  small: 12,
  rowH: 20,
  width: 220,
  listW: 170,
  /** "List them" draws at most this many choices and says so. */
  maxListed: 40,
  treeCol: 26,
  treeH: 200,
  treeLeafGap: 18,
  /** Leaf labels only when leaves are at least this far apart. */
  treeLabelGap: 12,
  pascalCol: 26,
  orders: 6,
};

const LETTERS = 'ABCDEFGHIJKL';
const name = (set: number[]) => (set.length ? set.map((i) => LETTERS[i] ?? '?').join('') : '∅');
const fact = (k: number) => (k <= 1 ? '1' : Array.from({ length: k }, (_, i) => k - i).join('×'));
const ways = (k: number) => `${k} way${k === 1 ? '' : 's'}`;

function drawList(n: number, r: number): Scene {
  const sc = new Scene();
  const L = listChoices(n, r);
  const tokenW = Math.max(1, r) * C.font * 0.62 + 14;
  const per = Math.max(1, Math.floor(C.listW / tokenW));
  sc.text(0, 0, `${LETTERS.slice(0, n).split('').join(' ')}: pick ${r}`, { anchor: 'start', size: C.font });
  sc.text(C.listW - 14, 0, '', { size: 1 });
  sc.caption(0, `${n} things, choose ${r}: write every choice in order`);
  const shown = L.sets.slice(0, C.maxListed);
  const groups = [...new Set(shown.map((s) => s[0] ?? -1))];
  let row = 1;
  groups.forEach((first, g) => {
    const step = g + 1;
    const sets = shown.filter((s) => (s[0] ?? -1) === first);
    sets.forEach((s, i) => sc.text((i % per) * tokenW, (row + Math.floor(i / per)) * C.rowH + 4, name(s), { step, anchor: 'start', size: C.font }));
    row += Math.ceil(sets.length / per);
    sc.caption(step, first < 0 ? 'Choosing nothing is one choice: ∅' : `Starting with ${LETTERS[first]}: ${sets.length} (later letters only, no repeats)`);
  });
  const fin = groups.length + 1;
  const capped = L.count > shown.length;
  sc.text(0, row * C.rowH + 12, `= ${ways(L.count)}`, { step: fin, anchor: 'start', cls: 'answer', size: C.font });
  sc.caption(fin, capped ? `${L.count} in all (first ${shown.length} shown)` : `Count them: ${ways(L.count)}`);
  return sc.fit();
}

function drawTree(n: number, r: number): Scene {
  const sc = new Scene();
  const T = tree(n, r);
  const col = Math.min(C.treeCol, (C.width - 40) / Math.max(1, n));
  const gap = Math.min(C.treeLeafGap, C.treeH / Math.max(1, T.leaves.length));
  const ys: number[] = [];
  T.leaves.forEach((i, k) => {
    ys[i] = k * gap;
  });
  for (let i = T.nodes.length - 1; i >= 0; i--) {
    if (ys[i] !== undefined) continue;
    const kids = T.nodes.map((nd, j) => ({ nd, j })).filter(({ nd }) => nd.parent === i).map(({ j }) => ys[j] ?? 0);
    ys[i] = kids.reduce((s, y) => s + y, 0) / Math.max(1, kids.length);
  }
  const pos = (i: number) => ({ x: (T.nodes[i]?.depth ?? 0) * col, y: ys[i] ?? 0 });
  for (let d = 0; d < n; d++) sc.text((d + 0.5) * col, -16, LETTERS[d] ?? '?', { step: d + 1, size: C.small, cls: 'muted-text' });
  sc.dot(0, pos(0).y, 2.5);
  sc.text(C.listW - 20, pos(0).y, '', { size: 1 });
  sc.caption(0, `For each of ${n} things: in or out? End with exactly ${r} in`);
  T.nodes.forEach((nd, i) => {
    if (nd.parent < 0) return;
    const p = pos(nd.parent);
    const q = pos(i);
    sc.line(p.x, p.y, q.x, q.y, { step: nd.depth, cls: nd.inn ? 'stroke lineA' : 'stroke thin' });
  });
  for (let d = 1; d <= n; d++) sc.caption(d, `${LETTERS[d - 1]}: in (dark) or out (faint); drop branches that can't reach ${r}`);
  const fin = n + 1;
  const labels = gap >= C.treeLabelGap;
  for (const i of T.leaves) {
    const q = pos(i);
    sc.dot(q.x, q.y, 2.2, { step: n, hot: [fin] });
    if (labels) sc.text(q.x + 8, q.y, name(T.nodes[i]?.path ?? []), { step: n, anchor: 'start', size: C.small });
  }
  const bottom = Math.max(...ys.filter((y) => y !== undefined));
  sc.text(0, bottom + 20, `= ${ways(T.count)}`, { step: fin, anchor: 'start', cls: 'answer', size: C.font });
  sc.caption(fin, `Count the leaves: ${ways(T.count)}${labels ? '' : ' (too many to label)'}`);
  return sc.fit();
}

function drawFormula(n: number, r: number): Scene {
  const sc = new Scene();
  const F = formula(n, r);
  const cw = C.font * 0.62;
  /** A stacked fraction left-aligned at x; returns its width. */
  const frac = (x: number, y: number, top: string, bottom: string, step: number, cls?: string) => {
    const w = Math.max(top.length, bottom.length) * cw + 6;
    sc.text(x + w / 2, y - 11, top, { step, size: C.font, cls });
    sc.line(x, y, x + w, y, { step });
    sc.text(x + w / 2, y + 11, bottom, { step, size: C.font, cls });
    return w;
  };
  const lead = (y: number, s: string, step: number) => sc.text(0, y, s, { step, anchor: 'start', size: C.font });
  const x0 = 22;
  sc.text(-4, 0, `C(${n},${r}) =`, { anchor: 'end', size: C.font });
  frac(4, 0, `${n}!`, `${r}! × ${n - r}!`, 0);
  sc.caption(0, `n! / (r! (n − r)!) with n = ${n}, r = ${r}`);
  lead(48, '=', 1);
  const big = Math.max(r, n - r);
  const k = F.top.length;
  const top = fact(n);
  const keep = F.top.join('×');
  const w1 = frac(x0, 48, top, `(${fact(r)})(${fact(n - r)})`, 1);
  sc.caption(1, `Write the factorials out`);
  // Strike the cancelled tail of the top and the matching factorial at the bottom.
  if (big > 1) {
    const topW = top.length * cw;
    const left = x0 + (w1 - topW) / 2 + (k ? (keep.length + 1) * cw : 0);
    sc.line(left, 48 - 11, x0 + (w1 + topW) / 2, 48 - 11, { step: 2, cls: 'stroke strike' });
    const bot = `(${fact(r)})(${fact(n - r)})`;
    const botW = bot.length * cw;
    const bl = x0 + (w1 - botW) / 2;
    const first = `(${fact(r)})`.length * cw;
    if (r >= n - r) sc.line(bl, 48 + 11, bl + first, 48 + 11, { step: 2, cls: 'stroke strike' });
    else sc.line(bl + first, 48 + 11, bl + botW, 48 + 11, { step: 2, cls: 'stroke strike' });
  }
  lead(96, '=', 2);
  frac(x0, 96, k ? keep : '1', k ? fact(k) : '1', 2);
  sc.caption(2, big > 1 ? `Cancel ${big}! from top and bottom` : 'Nothing to cancel');
  lead(144, '=', 3);
  const w3 = frac(x0, 144, String(F.num), String(F.den), 3);
  sc.caption(3, k ? `Multiply out: ${keep} = ${F.num}, ${fact(k)} = ${F.den}` : 'Top and bottom are both 1');
  sc.text(x0 + w3 + 6, 144, `= ${F.count}`, { step: 4, anchor: 'start', cls: 'answer', size: C.font + 2 });
  sc.caption(4, `${F.num} ÷ ${F.den} = ${ways(F.count)}`);
  return sc.fit();
}

function drawPascal(n: number, r: number): Scene {
  const sc = new Scene();
  const P = pascal(n, r);
  const cw = C.pascalCol;
  const at = (i: number, k: number) => ({ x: (k - i / 2) * cw, y: i * C.rowH });
  const nodes: SVGElement[][] = [];
  P.rows.forEach((row, i) => {
    nodes[i] = row.map((v, k) => sc.text(at(i, k).x, at(i, k).y, String(v), { step: i, size: C.small }));
    sc.caption(i, i === 0 ? 'Start with 1; each number is the sum of the two above' : `Row ${i}: ${row.join(' ')}`);
  });
  sc.text(at(4, 0).x - 10, 0, '', { size: 1 });
  sc.text(at(4, 4).x + 10, 0, '', { size: 1 });
  const fin = n + 1;
  const ans = at(n, r);
  sc.ring(ans.x, ans.y, 11, { step: fin, cls: 'stroke ring lineA' });
  const self = nodes[n]?.[r];
  if (self) sc.heat(self, [fin]);
  const up = [nodes[n - 1]?.[r - 1], nodes[n - 1]?.[r]].filter((x): x is SVGElement => !!x);
  for (const u of up) sc.heat(u, [fin]);
  sc.text(0, (n + 1) * C.rowH + 6, `${n}C${r} = ${P.count}`, { step: fin, cls: 'answer', size: C.font });
  const parents = [P.rows[n - 1]?.[r - 1], P.rows[n - 1]?.[r]].filter((x): x is number => x !== undefined);
  sc.caption(fin, `Row ${n}, place ${r} (from 0): ${parents.length === 2 ? `${parents.join(' + ')} = ` : ''}${P.count}`);
  return sc.fit();
}

function drawOrdered(n: number, r: number): Scene {
  const sc = new Scene();
  const O = orderedPicks(n, r);
  const box = r <= 5 ? 30 : 22;
  const gap = r <= 5 ? 14 : 8;
  sc.text(C.width - 40, 0, '', { size: 1 });
  sc.caption(0, r ? `Fill ${r} slot${r > 1 ? 's' : ''} in order, then ignore the order` : 'No slots to fill: choosing nothing is one way');
  for (let i = 0; i < r; i++) {
    const x = i * (box + gap);
    sc.rect(x, 0, box, box, { cls: 'box' });
    if (i) sc.text(x - gap / 2, box / 2, '×', { size: C.small, cls: 'muted-text' });
    const t = sc.text(x + box / 2, box / 2, String(O.slots[i]), { step: i + 1, size: C.font });
    sc.heat(t, [r + 1]);
    sc.caption(i + 1, i ? `Pick ${i + 1}: ${O.slots[i]} left to choose from` : `First pick: any of ${n}`);
  }
  let y = box + 20;
  const s1 = r + 1;
  sc.text(0, y, `= ${O.ordered} in order`, { step: s1, anchor: 'start', size: C.font });
  sc.caption(s1, r ? `${O.slots.join(' × ')} = ${O.ordered} ordered picks` : '1 empty pick');
  const s2 = r + 2;
  const orders = firstOrders(r, C.orders);
  const tokenW = Math.max(1, r) * C.small * 0.62 + 10;
  const per = Math.max(1, Math.min(3, Math.floor((C.width - 40) / tokenW)));
  y += 22;
  orders.forEach((o, i) => sc.text((i % per) * tokenW, y + Math.floor(i / per) * C.rowH, name(o), { step: s2, anchor: 'start', size: C.small, cls: 'muted-text' }));
  const more = O.orders > orders.length;
  if (more) sc.text((orders.length % per) * tokenW, y + Math.floor(orders.length / per) * C.rowH, '…', { step: s2, anchor: 'start', size: C.small, cls: 'muted-text' });
  sc.caption(s2, `Each choice was counted ${r}! = ${O.orders} times, once per order`);
  y += Math.ceil((orders.length + (more ? 1 : 0)) / per) * C.rowH + 8;
  const s3 = r + 3;
  sc.text(0, y, `${O.ordered} ÷ ${factorial(r)} = ${O.count}`, { step: s3, anchor: 'start', cls: 'answer', size: C.font });
  sc.caption(s3, `Divide out the orders: ${ways(O.count)}`);
  return sc.fit();
}

const METHODS: { id: string; title: string; draw: (n: number, r: number) => Scene }[] = [
  { id: 'list', title: 'List them', draw: drawList },
  { id: 'tree', title: 'Tree diagram', draw: drawTree },
  { id: 'formula', title: 'Formula', draw: drawFormula },
  { id: 'pascal', title: "Pascal's triangle", draw: drawPascal },
  { id: 'ordered', title: 'Ordered picks ÷ r!', draw: drawOrdered },
];

/** r can't be more than n: the r slider is clamped to n. */
const nr = (n: number, r: number): [number, number] => [n, Math.min(r, n)];

export const grid: GridSpec = {
  id: 'counting',
  sliders: [
    { label: 'n', start: 5, min: 1, max: 8 },
    { label: 'r', start: 3, min: 0, max: 8 },
  ],
  methods: METHODS.map((m) => ({ id: m.id, title: m.title, draw: ([n = 1, r = 0]) => m.draw(...nr(n, r)) })),
  problem: ([n = 1, r = 0]) => {
    const [a, b] = nr(n, r);
    return `${a} choose ${b} = ${pascal(a, b).count}${r > n ? ` (r capped at ${n})` : ''}`;
  },
};
