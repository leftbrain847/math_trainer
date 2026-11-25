/** Area of a circle, five ways. Each drawing turns src/topics/circle-area.ts into a Scene. */
import { archimedes, area, CIRCLE, countSquares, integration, onionRings, polygon, sliceCircle, slices, sliceStrip, stripSum, type Pt } from '../../topics/circle-area';
import type { GridSpec } from '../grid';
import { Scene } from '../scene';

/** Drawing sizes (SVG units). The drawn circle has a fixed size; the slider r changes the numbers. */
const G = {
  slicesR: 34,
  polygonsR: 50,
  ringsR: 30,
  integralR: 46,
  squaresSide: 112,
  circleSamples: 72,
  font: 13,
  small: 12,
  row: 18,
  lineFont: 15,
};

function fmt(v: number, dp = 2): string {
  const s = v.toFixed(v >= 1000 ? Math.min(dp, 1) : dp);
  const t = s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s;
  return t === '-0' ? '0' : t;
}
const piR2 = (r: number) => fmt(area(r));

/** Map unit shapes (y up) into the drawing: centre/origin at (ox, oy), scale k, y flipped. */
const place = (pts: Pt[], ox: number, oy: number, k: number): [number, number][] => pts.map(([x, y]) => [ox + x * k, oy - y * k]);

function drawSlices(r: number): Scene {
  const sc = new Scene();
  const R = G.slicesR;
  const [K1 = 8, K2 = 24] = CIRCLE.sliceKs;
  const stripW = (Math.PI + Math.PI / K1) * R;
  const cx = stripW / 2;
  const cy = R;
  sc.ring(cx, cy, R);
  sc.line(cx, cy, cx + R, cy, { cls: 'stroke thin' });
  sc.text(cx + R / 2, cy - 8, 'r', { size: G.small, cls: 'muted-text' });
  sc.caption(0, `A circle of radius ${r}: its circumference is 2πr = ${fmt(2 * Math.PI * r)}`);
  sliceCircle(K1).forEach((w, i) => sc.poly(place(w, cx, cy, R), { closed: true, step: 1, cls: i % 2 ? 'box' : 'fill' }));
  sc.caption(1, `Cut it into ${K1} slices, half shaded, half plain`);
  const y1 = 2 * R + 10;
  const y2 = y1 + R + 10;
  const strip = (K: number, top: number, step: number) => {
    const width = (Math.PI + Math.PI / K) * R;
    const x0 = (stripW - width) / 2;
    sliceStrip(K).forEach((w, i) => sc.poly(place(w, x0, top + R, R), { closed: true, step, cls: i % 2 ? 'box' : 'fill' }));
  };
  strip(K1, y1, 2);
  sc.caption(2, `Lay them point-up, point-down: shaded arcs make half the circumference`);
  strip(K2, y2, 3);
  sc.caption(3, `${K2} slices: the bumps flatten, nearly a rectangle πr by r`);
  const S = slices(r);
  sc.text(stripW / 2, y2 + R + 12, `πr = ${fmt(S.width)}`, { step: 4, size: G.small, cls: 'muted-text' });
  sc.text(-6, y2 + R / 2, `r=${r}`, { step: 4, anchor: 'end', size: G.small, cls: 'muted-text' });
  sc.text(stripW / 2, y2 + R + 32, `πr × r = ${fmt(S.answer)}`, { step: 4, size: G.lineFont, cls: 'answer' });
  sc.caption(4, `Width πr, height r: area πr × r = πr² = ${fmt(S.answer)}`);
  return sc.fit();
}

function drawPolygons(r: number): Scene {
  const sc = new Scene();
  const R = G.polygonsR;
  const rows = archimedes(r);
  sc.ring(R, R, R);
  sc.caption(0, `Fit polygons inside a circle of radius ${r} and add up their triangles`);
  const tx = 2 * R + 12;
  const right = tx + 88;
  sc.text(tx, 0, 'sides', { anchor: 'start', size: G.small, cls: 'muted-text' });
  sc.text(right, 0, 'area', { anchor: 'end', size: G.small, cls: 'muted-text' });
  rows.forEach((row, k) => {
    const step = k + 1;
    if (row.m <= 24) sc.poly(place(polygon(row.m), R, R, R), { closed: true, step, hot: [step] });
    const y = (k + 1) * G.row;
    sc.text(tx, y, String(row.m), { step, anchor: 'start', size: G.font, cls: 'muted-text' });
    sc.text(right, y, fmt(row.inner), { step, anchor: 'end', size: G.font });
    sc.caption(step, row.m <= 24 ? `${row.m} sides: ${fmt(row.inner)}, short by ${fmt(area(r) - row.inner)}` : `${row.m} sides, too close to see: ${fmt(row.inner)}`);
  });
  const fin = rows.length + 1;
  const last = rows[rows.length - 1];
  sc.text((tx + right) / 2, (rows.length + 1) * G.row + 8, `πr² = ${piR2(r)}`, { step: fin, size: G.lineFont, cls: 'answer' });
  sc.caption(fin, last ? `Outside ${last.m}-gon ${fmt(last.outer)}: πr² = ${piR2(r)} is squeezed between` : `πr² = ${piR2(r)}`);
  return sc.fit();
}

function drawRings(r: number): Scene {
  const sc = new Scene();
  const R = G.ringsR;
  const O = onionRings(r);
  const [k1 = 5, k2 = 20] = CIRCLE.ringKs;
  const base = 2 * Math.PI * R;
  const yBase = 3 * R + 12;
  sc.ring(R, R, R);
  sc.caption(0, `Peel a circle of radius ${r} into thin rings, like an onion`);
  for (let i = 1; i < k1; i++) sc.ring(R, R, (R * i) / k1, { step: 1, cls: 'stroke ring thin' });
  sc.caption(1, `${k1} rings, each a thin band`);
  for (let i = 1; i <= k1; i++) {
    const len = (base * i) / k1;
    const h = R / k1;
    sc.rect(0, yBase - (k1 - i + 1) * h, len, h, { step: 2, hot: [2] });
  }
  const tx = 2 * R + 14;
  const rowText = (k: number, y: number, step: number) => {
    const row = O.rows.find((x) => x.k === k);
    if (!row) return;
    sc.text(tx, y, `${k} rings`, { step, anchor: 'start', size: G.font, cls: 'muted-text' });
    sc.text(base, y, fmt(row.staircase), { step, anchor: 'end', size: G.font });
  };
  rowText(k1, 8, 2);
  sc.caption(2, `Cut and unroll each ring into a strip as long as its circumference`);
  const stairs: [number, number][] = [[0, yBase]];
  for (let i = k2; i >= 1; i--) {
    const len = (base * i) / k2;
    const y = yBase - ((k2 - i) * R) / k2;
    stairs.push([len, y], [len, y - R / k2]);
  }
  stairs.push([0, yBase - R]);
  sc.poly(stairs, { step: 3, cls: 'stroke curve lineB' });
  rowText(k2, 8 + G.row, 3);
  const row2 = O.rows.find((x) => x.k === k2);
  sc.caption(3, `${k2} rings: ${fmt(row2?.staircase ?? 0)}, the steps over-count by only πr²/${k2}`);
  sc.poly([[0, yBase], [base, yBase], [0, yBase - R]], { closed: true, step: 4, cls: 'stroke curve lineA' });
  sc.text(base / 2, yBase + 11, `2πr = ${fmt(O.base)}`, { step: 4, size: G.small, cls: 'muted-text' });
  sc.caption(4, `Thinner rings: the stack becomes a triangle, base 2πr, height r`);
  sc.text(tx + (base - tx) / 2, 8 + 2 * G.row + 6, `½·2πr·r = ${fmt(O.answer)}`, { step: 5, size: G.font, cls: 'answer' });
  sc.caption(5, `Triangle area ½ × 2πr × r = πr² = ${fmt(O.answer)}`);
  return sc.fit();
}

function drawIntegral(r: number): Scene {
  const sc = new Scene();
  const R = G.integralR;
  const I = integration(r);
  const [N1 = 8, N2 = 32] = CIRCLE.stripNs;
  sc.ring(R, R, R);
  sc.line(0, R, 2 * R, R, { cls: 'stroke thin' });
  const strips = (N: number, step: number) => {
    const w = (2 * R) / N;
    for (let i = 0; i < N; i++) {
      const x = -R + (i + 0.5) * w;
      const h = Math.sqrt(R * R - x * x);
      sc.rect(R + x - w / 2, R - h, w, 2 * h, { step, hot: [step] });
    }
  };
  const tx = 2 * R + 12;
  const right = tx + 120;
  const at = (k: number) => k * G.row;
  sc.text(tx, at(0), '∫2√(r²−x²)dx', { anchor: 'start', size: G.small });
  sc.caption(0, `Area = ∫ 2√(r² − x²) dx from −r to r: add up vertical strips`);
  strips(N1, 1);
  sc.text(tx, at(1), `${N1} strips`, { step: 1, anchor: 'start', size: G.small, cls: 'muted-text' });
  sc.text(right, at(1), fmt(stripSum(r, N1)), { step: 1, anchor: 'end', size: G.font });
  sc.caption(1, `${N1} strips: ${fmt(stripSum(r, N1))}`);
  strips(N2, 2);
  sc.text(tx, at(2), `${N2} strips`, { step: 2, anchor: 'start', size: G.small, cls: 'muted-text' });
  sc.text(right, at(2), fmt(stripSum(r, N2)), { step: 2, anchor: 'end', size: G.font });
  sc.caption(2, `${N2} strips: ${fmt(stripSum(r, N2))}, closing in; now do it exactly`);
  sc.text(tx, at(3) + 4, 'x = r sin θ', { step: 3, anchor: 'start', size: G.font });
  sc.caption(3, 'Substitute x = r sin θ: dx = r cos θ dθ, √(r² − x²) = r cos θ');
  sc.text(tx, at(4) + 4, 'r²∫2cos²θ dθ', { step: 4, anchor: 'start', size: G.font });
  sc.caption(4, '∫ 2cos²θ dθ from −π/2 to π/2 = π, so the area is πr²');
  sc.text((tx + right) / 2, at(5) + 10, `πr² = ${fmt(I.answer)}`, { step: 5, size: G.lineFont, cls: 'answer' });
  sc.caption(5, `r² × π = ${r * r}π = ${fmt(I.answer)}`);
  return sc.fit();
}

function drawSquares(r: number): Scene {
  const sc = new Scene();
  const Q = G.squaresSide;
  const c = Q / r;
  const C = countSquares(r);
  for (let i = 0; i <= r; i++) {
    sc.line(i * c, 0, i * c, Q, { cls: 'stroke thin' });
    sc.line(0, i * c, Q, i * c, { cls: 'stroke thin' });
  }
  for (const col of C.columns) {
    if (col.inside) sc.rect(col.i * c, Q - col.inside * c, c, col.inside * c, { step: 1, cls: 'fill' });
  }
  for (const col of C.columns) sc.rect(col.i * c, Q - col.touching * c, c, col.touching * c, { step: 2, cls: 'box lineB', hot: [2] });
  const arc: [number, number][] = Array.from({ length: G.circleSamples + 1 }, (_, i) => {
    const t = (Math.PI / 2) * (i / G.circleSamples);
    return [Q * Math.cos(t), Q - Q * Math.sin(t)];
  });
  sc.poly(arc, { cls: 'stroke curve lineA' });
  sc.caption(0, `A quarter circle of radius ${r} on a grid of unit squares`);
  const tx = Q + 10;
  const right = tx + 90;
  const qIn = C.inside / 4;
  const qTouch = C.touching / 4;
  sc.text(tx, 8, 'inside', { step: 1, anchor: 'start', size: G.small, cls: 'muted-text' });
  sc.text(right, 8, String(C.inside), { step: 1, anchor: 'end', size: G.font });
  sc.caption(1, `${qIn} squares fit wholly inside the quarter: × 4 = ${C.inside}`);
  sc.text(tx, 8 + G.row, 'touched', { step: 2, anchor: 'start', size: G.small, cls: 'muted-text' });
  sc.text(right, 8 + G.row, String(C.touching), { step: 2, anchor: 'end', size: G.font });
  sc.caption(2, `${qTouch} squares hold some of it: × 4 = ${C.touching}`);
  sc.text(tx, 8 + 2 * G.row + 4, `≈ ${fmt(C.estimate, 1)}`, { step: 3, anchor: 'start', size: G.font });
  sc.caption(3, `So ${C.inside} < area < ${C.touching}; halfway is ${fmt(C.estimate, 1)}`);
  sc.text((tx + right) / 2, 8 + 3 * G.row + 12, `πr² = ${piR2(r)}`, { step: 4, size: G.lineFont, cls: 'answer' });
  sc.caption(4, `πr² = ${piR2(r)}; bigger r, finer grid: the gap shrinks like 1/r`);
  return sc.fit();
}

export const grid: GridSpec = {
  id: 'circle-area',
  sliders: [{ label: 'r', start: 5, min: 1, max: 20 }],
  methods: [
    { id: 'slices', title: 'Rearranged slices', draw: ([r = 5]) => drawSlices(r) },
    { id: 'polygons', title: 'Archimedes polygons', draw: ([r = 5]) => drawPolygons(r) },
    { id: 'rings', title: 'Onion rings', draw: ([r = 5]) => drawRings(r) },
    { id: 'integral', title: 'Integration', draw: ([r = 5]) => drawIntegral(r) },
    { id: 'squares', title: 'Counting squares', draw: ([r = 5]) => drawSquares(r) },
  ],
  problem: ([r = 5]) => `r = ${r}: πr² = ${piR2(r)}`,
};
