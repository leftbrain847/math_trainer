/**
 * Area of a circle, five ways: every method derives πr² or squeezes it between approximations that close in.
 * Every function is pure (no clock, no randomness). Shapes are in units of the radius (r = 1), y pointing up.
 */

export type Pt = [number, number];

export const CIRCLE = {
  /** Slice counts for the rearranged-slices strips. */
  sliceKs: [8, 24],
  /** Points per wedge arc when drawing. */
  arcSamples: 8,
  /** Archimedes' polygons: 6, 12, 24, 48, 96 sides (he stopped at 96). */
  polygonSides: [6, 12, 24, 96],
  /** Onion rings: how many rings, coarse to fine. */
  ringKs: [5, 20, 100],
  /** Vertical strips for the integral, coarse to fine. */
  stripNs: [8, 32, 1000],
};

export const area = (r: number): number => Math.PI * r * r;

/** Shoelace area of a polygon. */
export function polygonArea(pts: Pt[]): number {
  let s = 0;
  pts.forEach(([x1, y1], i) => {
    const [x2, y2] = pts[(i + 1) % pts.length] ?? [x1, y1];
    s += x1 * y2 - x2 * y1;
  });
  return Math.abs(s) / 2;
}

// 1. Rearranged slices: cut K wedges and lay them alternately point-up and point-down. The strip is πr wide, r tall.
/** One wedge of a K-slice unit circle with its point at `apex`, opening downwards (up = false) or upwards. */
function wedge(apex: Pt, K: number, opensDown: boolean, samples: number): Pt[] {
  const half = Math.PI / K;
  const mid = opensDown ? -Math.PI / 2 : Math.PI / 2;
  const arc: Pt[] = Array.from({ length: samples + 1 }, (_, i) => {
    const t = mid - half + (2 * half * i) / samples;
    return [apex[0] + Math.cos(t), apex[1] + Math.sin(t)];
  });
  return [apex, ...arc];
}
/** The K wedges of a unit circle laid top-to-tail in a strip between y = 0 and y = 1. */
export function sliceStrip(K: number, samples: number = CIRCLE.arcSamples): Pt[][] {
  const s = 2 * Math.tan(Math.PI / K);
  const out: Pt[][] = [];
  for (let i = 0; i < K / 2; i++) {
    out.push(wedge([i * s + s / 2, 1], K, true, samples));
    out.push(wedge([(i + 1) * s, 0], K, false, samples));
  }
  return out;
}
/** The K wedges in place in the unit circle (centred at the origin). */
export function sliceCircle(K: number, samples: number = CIRCLE.arcSamples): Pt[][] {
  return Array.from({ length: K }, (_, i) => {
    const a0 = (2 * Math.PI * i) / K;
    const arc: Pt[] = Array.from({ length: samples + 1 }, (_, j) => {
      const t = a0 + (2 * Math.PI * j) / (K * samples);
      return [Math.cos(t), Math.sin(t)];
    });
    return [[0, 0], ...arc];
  });
}
export function slices(r: number): { width: number; height: number; answer: number } {
  const width = Math.PI * r;
  return { width, height: r, answer: width * r };
}

// 2. Archimedes: polygons inside and outside the circle squeeze its area.
export interface PolygonRow {
  m: number;
  inner: number;
  outer: number;
}
export function archimedes(r: number, sides: number[] = CIRCLE.polygonSides): PolygonRow[] {
  return sides.map((m) => ({ m, inner: (m / 2) * r * r * Math.sin((2 * Math.PI) / m), outer: m * r * r * Math.tan(Math.PI / m) }));
}
/** Vertices of a regular m-gon inscribed in the unit circle. */
export const polygon = (m: number): Pt[] => Array.from({ length: m }, (_, i) => [Math.cos((2 * Math.PI * i) / m + Math.PI / 2), Math.sin((2 * Math.PI * i) / m + Math.PI / 2)]);

// 3. Onion rings: unroll k thin rings into strips. Each ring unrolls to a trapezoid with exactly its area, and the
// stack is a triangle with base 2πr and height r. Drawn as rectangles (outer length), the staircase over-counts.
export interface RingRow {
  k: number;
  /** Rectangles of the rings' outer lengths: πr²(k+1)/k, too big by πr²/k. */
  staircase: number;
}
export function onionRings(r: number, ks: number[] = CIRCLE.ringKs): { rows: RingRow[]; base: number; height: number; answer: number } {
  const rows = ks.map((k) => {
    let s = 0;
    for (let i = 1; i <= k; i++) s += 2 * Math.PI * ((i * r) / k) * (r / k);
    return { k, staircase: s };
  });
  const base = 2 * Math.PI * r;
  return { rows, base, height: r, answer: (base * r) / 2 };
}
/** Annulus between radii r1 < r2 and the trapezoid it unrolls to have the same area. */
export const ringArea = (r1: number, r2: number): number => Math.PI * (r2 * r2 - r1 * r1);
export const unrolledRing = (r1: number, r2: number): number => ((2 * Math.PI * r1 + 2 * Math.PI * r2) / 2) * (r2 - r1);

// 4. Integration: A = ∫₋ᵣʳ 2√(r² − x²) dx. Midpoint strips approximate it; x = r sin θ turns it into r²∫2cos²θ dθ = πr².
export function stripSum(r: number, N: number): number {
  const w = (2 * r) / N;
  let s = 0;
  for (let i = 0; i < N; i++) {
    const x = -r + (i + 0.5) * w;
    s += 2 * Math.sqrt(Math.max(0, r * r - x * x)) * w;
  }
  return s;
}
export function integration(r: number, Ns: number[] = CIRCLE.stripNs): { rows: { N: number; value: number }[]; answer: number } {
  return { rows: Ns.map((N) => ({ N, value: stripSum(r, N) })), answer: r * r * Math.PI };
}
/** ∫₋π/2^π/2 2cos²θ dθ by the midpoint rule, to check the substitution numerically: it equals π. */
export function cos2Integral(N = 2000): number {
  const w = Math.PI / N;
  let s = 0;
  for (let i = 0; i < N; i++) s += 2 * Math.cos(-Math.PI / 2 + (i + 0.5) * w) ** 2 * w;
  return s;
}

// 5. Counting squares: on a unit grid, count the squares wholly inside a quarter circle and those it touches.
/** ⌊√x⌋ for whole x ≥ 0, safe from floating error. */
export function isqrt(x: number): number {
  let s = Math.floor(Math.sqrt(x));
  while (s * s > x) s--;
  while ((s + 1) * (s + 1) <= x) s++;
  return s;
}
export interface Column {
  i: number;
  /** Squares in column i (x from i to i+1) wholly inside the circle. */
  inside: number;
  /** Squares in column i that the circle's inside reaches. */
  touching: number;
}
export function countSquares(r: number): { columns: Column[]; inside: number; touching: number; estimate: number } {
  const columns: Column[] = [];
  for (let i = 0; i < r; i++) {
    const inside = isqrt(r * r - (i + 1) * (i + 1));
    const top = r * r - i * i;
    const s = isqrt(top);
    columns.push({ i, inside, touching: s * s === top ? s : s + 1 });
  }
  const inside = 4 * columns.reduce((t, c) => t + c.inside, 0);
  const touching = 4 * columns.reduce((t, c) => t + c.touching, 0);
  return { columns, inside, touching, estimate: (inside + touching) / 2 };
}

export const CIRCLE_IDS = ['slices', 'polygons', 'rings', 'integral', 'squares'] as const;
export type CircleId = (typeof CIRCLE_IDS)[number];
