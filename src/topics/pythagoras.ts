/**
 * Pythagoras, five proofs that a² + b² = c² for a right triangle with legs a and b. Every function is pure.
 * Each proof returns the shapes it moves (as polygons, y pointing up) plus the areas its argument compares,
 * so the tests can check the pieces really tile what the proof claims.
 */

export type Pt = [number, number];

/** Shoelace area of a polygon (0 for a degenerate one). */
export function polygonArea(pts: Pt[]): number {
  let s = 0;
  pts.forEach(([x1, y1], i) => {
    const [x2, y2] = pts[(i + 1) % pts.length] ?? [x1, y1];
    s += x1 * y2 - x2 * y1;
  });
  return Math.abs(s) / 2;
}

/** ⌊√x⌋ for whole x ≥ 0. */
export function isqrt(x: number): number {
  let s = Math.floor(Math.sqrt(x));
  while (s * s > x) s--;
  while ((s + 1) * (s + 1) <= x) s++;
  return s;
}

export interface Hyp {
  c2: number;
  c: number;
  /** True when c is a whole number. */
  whole: boolean;
}
export function hypotenuse(a: number, b: number): Hyp {
  const c2 = a * a + b * b;
  const s = isqrt(c2);
  const whole = s * s === c2;
  return { c2, c: whole ? s : Math.sqrt(c2), whole };
}
/** c exactly when whole ("5"), otherwise to 2 decimals ("3.61"). */
export function cText(a: number, b: number): string {
  const h = hypotenuse(a, b);
  return h.whole ? String(h.c) : h.c.toFixed(2);
}

// 1. Rearranged squares: an (a+b) square holds 4 triangles and a tilted c² square; moved, the same triangles leave a² and b².
export function rearranged(a: number, b: number) {
  const s = a + b;
  const tilted: Pt[] = [[a, 0], [s, a], [b, s], [0, b]];
  const leftTris: Pt[][] = [
    [[0, 0], [a, 0], [0, b]],
    [[a, 0], [s, 0], [s, a]],
    [[s, a], [s, s], [b, s]],
    [[b, s], [0, s], [0, b]],
  ];
  const a2: Pt[] = [[0, 0], [a, 0], [a, a], [0, a]];
  const b2: Pt[] = [[a, a], [s, a], [s, s], [a, s]];
  const rightTris: Pt[][] = [
    [[a, 0], [s, 0], [s, a]],
    [[a, 0], [s, a], [a, a]],
    [[0, a], [a, a], [a, s]],
    [[0, a], [a, s], [0, s]],
  ];
  const big = s * s;
  const tris = 2 * a * b;
  return { s, tilted, leftTris, a2, b2, rightTris, big, tris, gapLeft: big - tris, gapRight: a * a + b * b, ...hypotenuse(a, b) };
}

// 2. Similar triangles: the altitude to the hypotenuse cuts two copies of the triangle, scaled by a/c and b/c.
// Their areas add up to the whole: (a/c)² + (b/c)² = 1.
export function similar(a: number, b: number) {
  const h = hypotenuse(a, b);
  const c = Math.sqrt(h.c2);
  const p = (a * a) / c;
  const height = (a * b) / c;
  const A: Pt = [0, 0];
  const B: Pt = [c, 0];
  const C: Pt = [p, height];
  const D: Pt = [p, 0];
  const wholeArea = (a * b) / 2;
  const left = polygonArea([A, D, C]);
  const right = polygonArea([D, B, C]);
  return { A, B, C, D, p, q: c - p, height, wholeArea, left, right, ratioA: a / c, ratioB: b / c, ...h };
}

// 3. Garfield's trapezoid: two copies of the triangle and a right isosceles triangle with legs c make a trapezoid.
// ½(a+b)(a+b) = 2·½ab + ½c², so c² = a² + b².
export function garfield(a: number, b: number) {
  const s = a + b;
  const tri1: Pt[] = [[0, 0], [a, 0], [0, b]];
  const tri2: Pt[] = [[a, 0], [s, 0], [s, a]];
  const middle: Pt[] = [[0, b], [a, 0], [s, a]];
  const trapezoid: Pt[] = [[0, 0], [s, 0], [s, a], [0, b]];
  return { tri1, tri2, middle, trapezoid, trapArea: (s * s) / 2, triArea: (a * b) / 2, ...hypotenuse(a, b) };
}

// 4. Euclid (Elements I.47): squares on all three sides; the altitude splits the c² square into two rectangles
// equal to a² and b².
export function euclid(a: number, b: number) {
  const h = hypotenuse(a, b);
  const c = Math.sqrt(h.c2);
  const p = (b * b) / c;
  const q = c - p;
  const height = (a * b) / c;
  const A: Pt = [0, 0];
  const B: Pt = [c, 0];
  const C: Pt = [p, height];
  const sqC: Pt[] = [A, B, [c, -c], [0, -c]];
  const sqB: Pt[] = [A, C, [p - height, height + p], [-height, p]];
  const sqA: Pt[] = [B, C, [p + height, height + q], [c + height, q]];
  const rectB: Pt[] = [A, [p, 0], [p, -c], [0, -c]];
  const rectA: Pt[] = [[p, 0], B, [c, -c], [p, -c]];
  return { A, B, C, p, q, height, sqA, sqB, sqC, rectA, rectB, ...h };
}

// 5. Bhaskara: inside the c² square sit 4 triangles and a small square of side |b − a|.
// c² = 4·½ab + (b − a)² = a² + b².
export function bhaskara(a: number, b: number) {
  const s = a + b;
  const outer: Pt[] = [[a, 0], [s, a], [b, s], [0, b]];
  const tris: Pt[][] = [
    [[a, 0], [s, a], [a, a]],
    [[s, a], [b, s], [b, a]],
    [[b, s], [0, b], [b, b]],
    [[0, b], [a, 0], [a, b]],
  ];
  const inner: Pt[] = [[a, a], [b, a], [b, b], [a, b]];
  const d = b - a;
  return { outer, tris, inner, tris4: 2 * a * b, innerArea: d * d, ...hypotenuse(a, b) };
}

export const PYTHAGORAS_IDS = ['rearranged', 'similar', 'garfield', 'euclid', 'bhaskara'] as const;
export type PythagorasId = (typeof PYTHAGORAS_IDS)[number];
