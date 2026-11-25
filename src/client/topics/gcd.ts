/** Greatest common divisor, six ways. Each drawing turns the pure maths in src/topics/gcd.ts into a Scene. */
import { binaryGcd, cutSquares, euclid, gcdOf, ladder, listFactors, sharedPrimes } from '../../topics/gcd';
import type { GridSpec } from '../grid';
import { Scene } from '../scene';

/** Drawing sizes (SVG units). The scene scales to its tile, so only the proportions matter. */
const G = {
  font: 14,
  small: 12,
  rowH: 21,
  /** The cut-squares rectangle fits inside this box. */
  boxW: 210,
  boxH: 150,
  /** Squares narrower than this, or more than `maxSquares` in one cut, are drawn as one strip. */
  minSquare: 4,
  maxSquares: 24,
  labelSquare: 24,
  primeCol: 22,
  factorCol: 31,
  factorsPerRow: 6,
};

const product = (ps: number[]) => (ps.length > 4 ? ps.join('×') : ps.join(' × '));

function drawEuclid(a: number, b: number): Scene {
  const sc = new Scene();
  const E = euclid(a, b);
  // Columns: a = q × b + r
  const X = { a: 30, eq: 42, q: 70, times: 80, b: 112, plus: 121, r: 153 };
  sc.caption(0, `gcd(${a}, ${b}): divide, then divide by the remainder`);
  const bs: SVGElement[] = [];
  const rs: SVGElement[] = [];
  E.rows.forEach((row, k) => {
    const step = k + 1;
    const y = k * G.rowH;
    const t = (x: number, s: string, anchor: 'end' | 'middle', cls?: string) => sc.text(x, y, s, { step, anchor, size: G.font, cls });
    const aN = t(X.a, String(row.a), 'end');
    t(X.eq, '=', 'middle', 'muted-text');
    t(X.q, String(row.q), 'end');
    t(X.times, '×', 'middle', 'muted-text');
    const bN = t(X.b, String(row.b), 'end');
    t(X.plus, '+', 'middle', 'muted-text');
    rs.push(t(X.r, String(row.r), 'end', 'carry'));
    bs.push(bN);
    const prevB = bs[k - 1];
    const prevR = rs[k - 1];
    if (prevB) sc.heat(prevB, [step]);
    if (prevR) sc.heat(prevR, [step]);
    if (k > 0) sc.heat(aN, [step]);
    sc.caption(step, row.r ? `${row.a} = ${row.q} × ${row.b} + ${row.r}: now use ${row.b} and ${row.r}` : `${row.a} = ${row.q} × ${row.b}: no remainder, ${row.b} divides both`);
  });
  const fin = E.rows.length + 1;
  const last = bs[bs.length - 1];
  if (last) sc.heat(last, [fin]);
  sc.text(X.r, E.rows.length * G.rowH + 8, `gcd = ${E.gcd}`, { step: fin, anchor: 'end', cls: 'answer', size: G.font });
  sc.caption(fin, `The last divisor is the gcd: ${E.gcd}`);
  return sc.fit();
}

function drawSquares(a: number, b: number): Scene {
  const sc = new Scene();
  const Q = cutSquares(a, b);
  const W = Math.max(a, b);
  const H = Math.min(a, b);
  const k = Math.min(G.boxW / W, G.boxH / H);
  sc.rect(0, 0, W * k, H * k, { cls: 'box' });
  sc.text((W * k) / 2, -12, String(W), { size: G.small, cls: 'muted-text' });
  sc.text(-6, (H * k) / 2, String(H), { anchor: 'end', size: G.small, cls: 'muted-text' });
  sc.caption(0, `A ${W} × ${H} rectangle: cut off the biggest squares`);
  let x = 0;
  let y = 0;
  let w = W;
  let h = H;
  const last: SVGElement[] = [];
  Q.cuts.forEach((c, i) => {
    const step = i + 1;
    const s = Math.min(w, h);
    const along = w >= h;
    const px = s * k;
    const final = i === Q.cuts.length - 1;
    const cls = final ? 'fill' : 'box grid';
    if (px >= G.minSquare && c.count <= G.maxSquares) {
      for (let j = 0; j < c.count; j++) {
        const r = sc.rect((x + (along ? j * s : 0)) * k, (y + (along ? 0 : j * s)) * k, px, px, { step, cls });
        sc.heat(r, [step]);
        if (final) last.push(r);
      }
    } else {
      const r = sc.rect(x * k, y * k, (along ? c.count * s : s) * k, (along ? s : c.count * s) * k, { step, cls });
      sc.heat(r, [step]);
      if (final) last.push(r);
    }
    if (px >= G.labelSquare) sc.text((x + s / 2) * k, (y + s / 2) * k, String(s), { step, size: G.small });
    const leftW = along ? w - c.count * s : w;
    const leftH = along ? h : h - c.count * s;
    sc.caption(step, final ? `${c.count} square${c.count > 1 ? 's' : ''} of ${s} fill it exactly` : `Cut ${c.count} square${c.count > 1 ? 's' : ''} of ${s}: a ${Math.max(leftW, leftH)} × ${Math.min(leftW, leftH)} piece is left`);
    if (along) x += c.count * s;
    else y += c.count * s;
    w = leftW;
    h = leftH;
  });
  const fin = Q.cuts.length + 1;
  for (const r of last) sc.heat(r, [fin]);
  sc.text((W * k) / 2, H * k + 18, `gcd = ${Q.gcd}`, { step: fin, cls: 'answer', size: G.font });
  sc.caption(fin, `The last square's side is the gcd: ${Q.gcd}`);
  return sc.fit();
}

function drawPrimes(a: number, b: number): Scene {
  const sc = new Scene();
  const P = sharedPrimes(a, b);
  const c = G.primeCol;
  const yA = 0;
  const yB = 30;
  sc.text(-6, yA, String(a), { anchor: 'end', size: G.font });
  sc.text(-6, yB, String(b), { anchor: 'end', size: G.font, step: 0 });
  sc.text(c * Math.max(4, P.columns.length) + 4, yA, '', { size: 1 });
  sc.caption(0, `Break ${a} and ${b} into primes`);
  const distinct = [...new Set(P.shared)];
  // Shared columns get a box, drawn first so it sits behind the digits.
  const boxAt = P.columns.map((col, i) => (col.inA && col.inB ? sc.rect(i * c + 5, yA - 12, c - 2, yB - yA + 24, { step: 3 + distinct.indexOf(col.p), cls: 'box' }) : undefined));
  const nodesA: SVGElement[] = [];
  const nodesB: SVGElement[] = [];
  P.columns.forEach((col, i) => {
    const x = i * c + c / 2 + 4;
    nodesA[i] = col.inA ? sc.text(x, yA, String(col.p), { step: 1, size: G.font }) : sc.text(x, yA, '·', { step: 1, size: G.font, cls: 'muted-text' });
    nodesB[i] = col.inB ? sc.text(x, yB, String(col.p), { step: 2, size: G.font }) : sc.text(x, yB, '·', { step: 2, size: G.font, cls: 'muted-text' });
  });
  sc.caption(1, `${a} = ${product(P.fa) || '1'}`);
  sc.caption(2, `${b} = ${product(P.fb) || '1'}`);
  const boxes = boxAt.filter((x): x is SVGElement => !!x);
  distinct.forEach((p, k) => {
    const step = 3 + k;
    const cols = P.columns.map((col, i) => ({ col, i })).filter(({ col }) => col.p === p && col.inA && col.inB);
    for (const { i } of cols) for (const node of [nodesA[i], nodesB[i], boxAt[i]]) if (node) sc.heat(node, [step]);
    sc.caption(step, `Both have ${product(cols.map(({ col }) => col.p))}`);
  });
  const fin = 3 + distinct.length;
  for (const bx of boxes) sc.heat(bx, [fin]);
  sc.text(0, yB + 34, P.shared.length > 1 ? `gcd = ${product(P.shared)} = ${P.gcd}` : `gcd = ${P.gcd}`, { step: fin, anchor: 'start', cls: 'answer', size: G.font });
  sc.caption(fin, P.shared.length ? `Multiply the shared primes: ${P.gcd}` : `No prime in common: gcd = 1`);
  return sc.fit();
}

function drawList(a: number, b: number): Scene {
  const sc = new Scene();
  const L = listFactors(a, b);
  const c = G.factorCol;
  const per = G.factorsPerRow;
  const x0 = 34;
  let y = 0;
  const block = (n: number, fs: number[], step: number) => {
    sc.text(x0 - 10, y, `${n}:`, { anchor: 'end', size: G.small, cls: 'muted-text', step });
    const nodes = fs.map((f, i) => {
      const node = sc.text(x0 + (i % per) * c + c / 2, y + Math.floor(i / per) * G.rowH, String(f), { step, size: G.font });
      return { f, node, x: x0 + (i % per) * c + c / 2, y: y + Math.floor(i / per) * G.rowH };
    });
    y += Math.ceil(fs.length / per) * G.rowH + 8;
    return nodes;
  };
  sc.text(x0 + per * c, 0, '', { size: 1 });
  sc.caption(0, `List every factor of ${a} and of ${b}`);
  const na = block(a, L.fa, 1);
  sc.caption(1, `${a} has ${L.fa.length} factors`);
  const nb = block(b, L.fb, 2);
  sc.caption(2, `${b} has ${L.fb.length} factors`);
  for (const n of [...na, ...nb]) if (L.common.includes(n.f)) sc.heat(n.node, [3]);
  sc.caption(3, `On both lists: ${L.common.join(', ')}`);
  for (const n of [...na, ...nb]) if (n.f === L.gcd) {
    sc.ring(n.x, n.y, 13, { step: 4, cls: 'stroke ring lineA' });
    sc.heat(n.node, [4]);
  }
  sc.text(x0, y + 6, `gcd = ${L.gcd}`, { step: 4, anchor: 'start', cls: 'answer', size: G.font });
  sc.caption(4, `The biggest one on both: ${L.gcd}`);
  return sc.fit();
}

function drawBinary(a: number, b: number): Scene {
  const sc = new Scene();
  const B = binaryGcd(a, b);
  const X = { a: 34, b: 74, note: 84 };
  sc.caption(0, `gcd(${a}, ${b}) with only halving and subtracting`);
  B.rows.forEach((row, k) => {
    const y = k * G.rowH;
    const step = k;
    sc.text(X.a, y, String(row.a), { step, anchor: 'end', size: G.font });
    sc.text(X.b, y, String(row.b), { step, anchor: 'end', size: G.font });
    const prev = B.rows[k - 1];
    if (!prev) return;
    const note = row.note === 'both even' ? `÷2 ×${B.twos}` : row.note === 'halve' ? 'halve' : 'subtract';
    sc.text(X.note, y, note, { step, anchor: 'start', size: G.small, cls: 'muted-text' });
    if (row.note === 'both even') sc.caption(step, `Both even: halve both ${B.twos} time${B.twos > 1 ? 's' : ''}, keep 2^${B.twos} = ${2 ** B.twos}`);
    else if (row.note === 'halve') sc.caption(step, `A factor of 2 in only one can't be shared: halve to odd`);
    else {
      const big = Math.max(prev.a, prev.b);
      const small = Math.min(prev.a, prev.b);
      const now = prev.a > prev.b ? row.a : row.b;
      sc.caption(step, `${big} − ${small} = ${big - small}${now !== big - small ? `, halve to ${now}` : ''}`);
    }
  });
  const fin = B.rows.length;
  const last = B.rows[B.rows.length - 1];
  const odd = last?.a ?? 1;
  sc.text(0, fin * G.rowH + 6, B.twos ? `gcd = ${odd} × ${2 ** B.twos} = ${B.gcd}` : `gcd = ${B.gcd}`, { step: fin, anchor: 'start', cls: 'answer', size: G.font });
  sc.caption(fin, B.twos ? `Equal at ${odd}; put back the 2s: ${odd} × ${2 ** B.twos} = ${B.gcd}` : `Both equal: gcd = ${B.gcd}`);
  return sc.fit();
}

function drawLadder(a: number, b: number): Scene {
  const sc = new Scene();
  const L = ladder(a, b);
  const X = { p: 10, bar: 22, a: 54, b: 96, end: 112 };
  const row = (y: number, x: number, y2: number, step: number) => {
    sc.text(X.a, y, String(x), { step, anchor: 'end', size: G.font });
    sc.text(X.b, y, String(y2), { step, anchor: 'end', size: G.font });
  };
  row(0, a, b, 0);
  sc.text(0, G.rowH * 3, '', { size: 1 });
  sc.text(X.end + 40, 0, '', { size: 1 });
  sc.caption(0, `Divide ${a} and ${b} by a prime that fits both`);
  const ps: SVGElement[] = [];
  L.rungs.forEach((r, k) => {
    const step = k + 1;
    const y = k * G.rowH;
    ps.push(sc.text(X.p, y, String(r.p), { step, size: G.font, cls: 'carry' }));
    sc.line(X.bar, y - G.rowH / 2, X.bar, y + G.rowH / 2, { step });
    sc.line(X.bar, y + G.rowH / 2, X.end, y + G.rowH / 2, { step });
    row(y + G.rowH, r.a, r.b, step);
    sc.caption(step, `${r.p} goes into both: ${r.a * r.p} → ${r.a}, ${r.b * r.p} → ${r.b}`);
  });
  const fin = L.rungs.length + 1;
  for (const p of ps) sc.heat(p, [fin]);
  const ys = (L.rungs.length + 1) * G.rowH + 6;
  sc.text(0, ys, L.rungs.length > 1 ? `gcd = ${product(L.rungs.map((r) => r.p))} = ${L.gcd}` : `gcd = ${L.gcd}`, { step: fin, anchor: 'start', cls: 'answer', size: G.font });
  sc.caption(fin, L.rungs.length ? `No prime fits both now: multiply down the side, ${L.gcd}` : 'No prime goes into both: gcd = 1');
  return sc.fit();
}

const METHODS: { id: string; title: string; draw: (a: number, b: number) => Scene }[] = [
  { id: 'euclid', title: 'Euclid', draw: drawEuclid },
  { id: 'squares', title: 'Cut squares', draw: drawSquares },
  { id: 'primes', title: 'Prime factors', draw: drawPrimes },
  { id: 'list', title: 'List the factors', draw: drawList },
  { id: 'binary', title: 'Binary (Stein)', draw: drawBinary },
  { id: 'ladder', title: 'Ladder', draw: drawLadder },
];

export const grid: GridSpec = {
  id: 'gcd',
  sliders: [
    { label: 'a', start: 84, min: 2, max: 150 },
    { label: 'b', start: 60, min: 2, max: 150 },
  ],
  methods: METHODS.map((m) => ({ id: m.id, title: m.title, draw: ([a = 2, b = 2]) => m.draw(a, b) })),
  problem: ([a = 2, b = 2]) => `gcd(${a}, ${b}) = ${gcdOf(a, b)}`,
};
