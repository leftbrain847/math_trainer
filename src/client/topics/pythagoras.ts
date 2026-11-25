/** Pythagoras, five proofs. Each drawing turns the shapes in src/topics/pythagoras.ts into a Scene. */
import { bhaskara, euclid, garfield, hypotenuse, rearranged, similar, type Pt } from '../../topics/pythagoras';
import type { GridSpec } from '../grid';
import { Scene } from '../scene';

/** Drawing sizes (SVG units): each figure is scaled so its main length fits these. */
const G = {
  rearrangedSide: 90,
  rearrangedGap: 12,
  similarBase: 190,
  garfieldWidth: 150,
  euclidWidth: 180,
  bhaskaraSide: 130,
  font: 13,
  small: 12,
  row: 19,
  lineFont: 15,
  /** Labels sit this far outside an edge. */
  labelGap: 9,
};

function fmt(v: number, dp = 2): string {
  const s = v.toFixed(dp);
  const t = s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s;
  return t === '-0' ? '0' : t;
}
/** "c = 5" or "c = √13 ≈ 3.61". */
function cAnswer(a: number, b: number): string {
  const h = hypotenuse(a, b);
  return h.whole ? `c = ${h.c}` : `c = √${h.c2} ≈ ${h.c.toFixed(2)}`;
}
const cShort = (a: number, b: number): string => {
  const h = hypotenuse(a, b);
  return h.whole ? `= ${h.c}` : `≈ ${h.c.toFixed(2)}`;
};

/** Map shape points (y up) into the drawing at origin (ox, oy) with scale k, y flipped. */
const place = (pts: Pt[], ox: number, oy: number, k: number): [number, number][] => pts.map(([x, y]) => [ox + x * k, oy - y * k]);
const centre = (pts: [number, number][]): [number, number] => {
  const n = pts.length || 1;
  return [pts.reduce((s, p) => s + p[0], 0) / n, pts.reduce((s, p) => s + p[1], 0) / n];
};
/** A label just outside edge p→q, on the side away from point `away`. */
function edgeLabel(sc: Scene, p: [number, number], q: [number, number], away: [number, number], s: string, step = 0): void {
  const mx = (p[0] + q[0]) / 2;
  const my = (p[1] + q[1]) / 2;
  let nx = -(q[1] - p[1]);
  let ny = q[0] - p[0];
  const len = Math.hypot(nx, ny) || 1;
  nx /= len;
  ny /= len;
  if ((away[0] - mx) * nx + (away[1] - my) * ny > 0) {
    nx = -nx;
    ny = -ny;
  }
  sc.text(mx + nx * G.labelGap, my + ny * G.labelGap, s, { step, size: G.small, cls: 'muted-text' });
}

function drawRearranged(a: number, b: number): Scene {
  const sc = new Scene();
  const R = rearranged(a, b);
  const S = G.rearrangedSide;
  const k = S / R.s;
  const ox2 = S + G.rearrangedGap;
  sc.rect(0, 0, S, S, { cls: 'box' });
  sc.text(a * k * 0.5, S + G.labelGap, 'a', { size: G.small, cls: 'muted-text' });
  sc.text(a * k + b * k * 0.5, S + G.labelGap, 'b', { size: G.small, cls: 'muted-text' });
  sc.caption(0, `Legs a = ${a}, b = ${b}: a square with side a + b = ${R.s}`);
  for (const t of R.leftTris) sc.poly(place(t, 0, S, k), { closed: true, step: 1, hot: [1, 3] });
  sc.caption(1, 'Put four copies of the triangle in its corners');
  const tilted = place(R.tilted, 0, S, k);
  const gapL = sc.poly(tilted, { closed: true, step: 2, hot: [2, 5] });
  const [tcx, tcy] = centre(tilted);
  sc.text(tcx, tcy, 'c²', { step: 2, size: G.font });
  sc.heat(gapL, [5]);
  sc.caption(2, 'The space left over is a square of side c: area c²');
  sc.rect(ox2, 0, S, S, { step: 3, cls: 'box' });
  for (const t of R.rightTris) sc.poly(place(t, ox2, S, k), { closed: true, step: 3, hot: [3] });
  sc.caption(3, 'Same big square, same four triangles, moved around');
  for (const [sq, v] of [[R.a2, a * a], [R.b2, b * b]] as const) {
    const pts = place(sq, ox2, S, k);
    sc.poly(pts, { closed: true, step: 4, hot: [4, 5] });
    const [x, y] = centre(pts);
    sc.text(x, y, String(v), { step: 4, size: G.font });
  }
  sc.caption(4, `Now the space left is a² + b² = ${a * a} + ${b * b}`);
  sc.text(S + G.rearrangedGap / 2, S + 26, `c² = ${a * a} + ${b * b} = ${R.c2}`, { step: 5, size: G.font });
  sc.caption(5, `Equal big squares minus equal triangles: c² = a² + b² = ${R.c2}`);
  sc.text(S + G.rearrangedGap / 2, S + 26 + G.row + 2, cAnswer(a, b), { step: 6, size: G.lineFont, cls: 'answer' });
  sc.caption(6, cAnswer(a, b));
  return sc.fit();
}

function drawSimilar(a: number, b: number): Scene {
  const sc = new Scene();
  const S = similar(a, b);
  const c = Math.sqrt(S.c2);
  const k = G.similarBase / c;
  const oy = S.height * k;
  const [A, B, C, D] = place([S.A, S.B, S.C, S.D], 0, oy, k) as [[number, number], [number, number], [number, number], [number, number]];
  sc.poly([A, B, C], { closed: true });
  edgeLabel(sc, A, C, B, 'a');
  edgeLabel(sc, C, B, A, 'b');
  edgeLabel(sc, A, B, C, 'c');
  sc.caption(0, `A right triangle, legs a = ${a} and b = ${b}, hypotenuse c`);
  sc.line(C[0], C[1], D[0], D[1], { step: 1, cls: 'stroke zero' });
  sc.caption(1, 'Drop a line from the right angle, square onto c');
  sc.poly([A, D, C], { closed: true, step: 2, hot: [2, 4] });
  sc.caption(2, 'The left piece has the same angles: the whole scaled by a/c');
  sc.poly([D, B, C], { closed: true, step: 3, hot: [3, 4] });
  sc.caption(3, 'The right piece too, scaled by b/c');
  const y = oy + 24;
  sc.text(G.similarBase / 2, y, `(a/c)² + (b/c)² = 1`, { step: 4, size: G.font });
  sc.caption(4, 'Areas scale by the square: the two pieces fill the whole triangle');
  sc.text(G.similarBase / 2, y + G.row, `${a * a}/c² + ${b * b}/c² = 1`, { step: 5, size: G.font });
  sc.caption(5, `Multiply by c²: c² = a² + b² = ${a * a} + ${b * b} = ${S.c2}`);
  sc.text(G.similarBase / 2, y + 2 * G.row + 4, cAnswer(a, b), { step: 6, size: G.lineFont, cls: 'answer' });
  sc.caption(6, cAnswer(a, b));
  return sc.fit();
}

function drawGarfield(a: number, b: number): Scene {
  const sc = new Scene();
  const Gf = garfield(a, b);
  const s = a + b;
  const k = G.garfieldWidth / s;
  const oy = Math.max(a, b) * k;
  const trap = place(Gf.trapezoid, 0, oy, k);
  sc.poly(trap, { closed: true });
  const [p0, p1, p2, p3] = trap as [[number, number], [number, number], [number, number], [number, number]];
  const mid: [number, number] = [a * k, oy];
  edgeLabel(sc, p0, mid, p3, 'a');
  edgeLabel(sc, mid, p1, p2, 'b');
  edgeLabel(sc, p3, p0, p1, 'b');
  edgeLabel(sc, p1, p2, p0, 'a');
  sc.caption(0, `A trapezoid: parallel sides a = ${a} and b = ${b}, width a + b = ${s}`);
  sc.poly(place(Gf.tri1, 0, oy, k), { closed: true, step: 1, hot: [1] });
  sc.poly(place(Gf.tri2, 0, oy, k), { closed: true, step: 1, hot: [1] });
  sc.caption(1, `Two copies of the triangle: 2 × ½ab = ${a * b}`);
  const midT = place(Gf.middle, 0, oy, k);
  sc.poly(midT, { closed: true, step: 2, hot: [2] });
  const [mx, my] = centre(midT);
  sc.text(mx, my, '½c²', { step: 2, size: G.font });
  sc.caption(2, 'The middle is a right triangle with both legs c: area ½c²');
  const y = oy + 24;
  sc.text(G.garfieldWidth / 2, y, `½·${s}² = ${a * b} + ½c²`, { step: 3, size: G.font });
  sc.caption(3, `Whole trapezoid: ½(a + b)(a + b) = ½·${s * s} = ${fmt(Gf.trapArea)}`);
  sc.text(G.garfieldWidth / 2, y + G.row, `c² = ${s * s} − ${2 * a * b} = ${Gf.c2}`, { step: 4, size: G.font });
  sc.caption(4, `Double it: c² = (a + b)² − 2ab = a² + b² = ${Gf.c2}`);
  sc.text(G.garfieldWidth / 2, y + 2 * G.row + 4, cAnswer(a, b), { step: 5, size: G.lineFont, cls: 'answer' });
  sc.caption(5, cAnswer(a, b));
  return sc.fit();
}

function drawEuclid(a: number, b: number): Scene {
  const sc = new Scene();
  const E = euclid(a, b);
  const c = Math.sqrt(E.c2);
  const k = G.euclidWidth / (c + 2 * E.height);
  const ox = E.height * k;
  const oy = Math.max(E.height + E.p, E.height + E.q) * k;
  const P = (pts: Pt[]) => place(pts, ox, oy, k);
  const label = (pts: [number, number][], s: string, step: number) => {
    const [x, y] = centre(pts);
    sc.text(x, y, s, { step, size: G.font });
  };
  sc.poly(P([E.A, E.B, E.C]), { closed: true });
  const sqA = sc.poly(P(E.sqA), { closed: true, hot: [3] });
  const sqB = sc.poly(P(E.sqB), { closed: true, hot: [2] });
  sc.poly(P(E.sqC), { closed: true });
  label(P(E.sqA), 'a²', 0);
  label(P(E.sqB), 'b²', 0);
  sc.caption(0, `Squares on all three sides: a² = ${a * a}, b² = ${b * b}, and c²`);
  const [foot] = P([[E.p, 0]]);
  const [bottom] = P([[E.p, -c]]);
  const [Cp] = P([E.C]);
  if (foot && bottom && Cp) sc.line(Cp[0], Cp[1], bottom[0], bottom[1], { step: 1, cls: 'stroke zero' });
  sc.caption(1, 'Drop a line from the right angle through the c² square');
  sc.poly(P(E.rectB), { closed: true, step: 2, hot: [2, 4] });
  label(P(E.rectB), String(b * b), 2);
  sc.heat(sqB, [2]);
  sc.caption(2, `Shear b² twice, keeping its area: it becomes this rectangle, ${b * b}`);
  sc.poly(P(E.rectA), { closed: true, step: 3, hot: [3, 4] });
  label(P(E.rectA), String(a * a), 3);
  sc.heat(sqA, [3]);
  sc.caption(3, `The same for a²: the other rectangle, ${a * a}`);
  const yb = oy + c * k + 18;
  sc.text(ox + (c * k) / 2, yb, `c² = ${a * a} + ${b * b} = ${E.c2}`, { step: 4, size: G.font });
  sc.caption(4, `The two rectangles make the c² square: c² = a² + b² = ${E.c2}`);
  sc.text(ox + (c * k) / 2, yb + G.row + 2, cAnswer(a, b), { step: 5, size: G.lineFont, cls: 'answer' });
  sc.caption(5, cAnswer(a, b));
  return sc.fit();
}

function drawBhaskara(a: number, b: number): Scene {
  const sc = new Scene();
  const B = bhaskara(a, b);
  const s = a + b;
  const k = G.bhaskaraSide / s;
  const P = (pts: Pt[]) => place(pts, 0, G.bhaskaraSide, k);
  const outer = P(B.outer);
  sc.poly(outer, { closed: true });
  const [o0, o1, o2] = outer as [[number, number], [number, number], [number, number]];
  edgeLabel(sc, o0, o1, o2, 'c');
  sc.caption(0, `A square on the hypotenuse c, legs a = ${a}, b = ${b}`);
  for (const t of B.tris) sc.poly(P(t), { closed: true, step: 1, hot: [1] });
  sc.caption(1, `Four copies of the triangle inside it: 4 × ½ab = ${B.tris4}`);
  const inner = P(B.inner);
  sc.poly(inner, { closed: true, step: 2, hot: [2] });
  const d = Math.abs(b - a);
  sc.caption(2, d ? `A small square is left, side |b − a| = ${d}: area ${B.innerArea}` : 'a = b, so the middle square has side 0');
  const y = G.bhaskaraSide + 20;
  sc.text(G.bhaskaraSide / 2, y, `c² = ${B.tris4} + ${B.innerArea} = ${B.c2}`, { step: 3, size: G.font });
  sc.caption(3, `c² = 2ab + (b − a)² = a² + b² = ${B.c2}`);
  sc.text(G.bhaskaraSide / 2, y + G.row + 2, cAnswer(a, b), { step: 4, size: G.lineFont, cls: 'answer' });
  sc.caption(4, cAnswer(a, b));
  return sc.fit();
}

export const grid: GridSpec = {
  id: 'pythagoras',
  sliders: [
    { label: 'a', start: 3, min: 1, max: 12 },
    { label: 'b', start: 4, min: 1, max: 12 },
  ],
  methods: [
    { id: 'rearranged', title: 'Rearranged squares', draw: ([a = 3, b = 4]) => drawRearranged(a, b) },
    { id: 'similar', title: 'Similar triangles', draw: ([a = 3, b = 4]) => drawSimilar(a, b) },
    { id: 'garfield', title: "Garfield's trapezoid", draw: ([a = 3, b = 4]) => drawGarfield(a, b) },
    { id: 'euclid', title: "Euclid's proof", draw: ([a = 3, b = 4]) => drawEuclid(a, b) },
    { id: 'bhaskara', title: "Bhaskara's square", draw: ([a = 3, b = 4]) => drawBhaskara(a, b) },
  ],
  problem: ([a = 3, b = 4]) => `c = √${a * a + b * b} ${cShort(a, b)}`,
};
