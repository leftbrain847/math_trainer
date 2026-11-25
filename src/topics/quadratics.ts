/**
 * Quadratics, five ways. The sliders pick the roots r₁ and r₂, giving x² + Bx + C = 0 with B = −(r₁ + r₂) and
 * C = r₁r₂. Every method recovers the roots from B and C alone. Halves (like 3.5) and quarters (like 12.25) are exact
 * in binary floating point, so all the arithmetic here is exact.
 */

/** Tunables for the quadratics topic. */
export const QUAD = {
  /** Slider range for each root. */
  min: -9,
  max: 9,
  /** The graph shows this much x either side of the outer roots. */
  graphMargin: 2,
  /** Points sampled along the drawn parabola. */
  samples: 64,
};

export interface Quadratic {
  B: number;
  C: number;
}

/** Roots, smaller first (equal for a double root). */
export type Roots = [number, number];

export function fromRoots(r1: number, r2: number): Quadratic {
  return { B: -(r1 + r2) + 0, C: r1 * r2 + 0 };
}

/** Largest whole a with a² ≤ m. */
function isqrt(m: number): number {
  let a = Math.floor(Math.sqrt(m));
  while (a * a > m) a--;
  while ((a + 1) * (a + 1) <= m) a++;
  return a;
}
const sorted = (a: number, b: number): Roots => (a <= b ? [a + 0, b + 0] : [b + 0, a + 0]);

/** A number for text, with a real minus sign: −3.5. */
export function num(v: number): string {
  return v < 0 ? `−${-v}` : String(v + 0);
}
/** "x² − 4x − 5", "x² + 9", "x²" */
export function fmtQuad({ B, C }: Quadratic): string {
  let s = 'x²';
  if (B) s += ` ${B < 0 ? '−' : '+'} ${Math.abs(B) === 1 ? '' : Math.abs(B)}x`;
  if (C) s += ` ${C < 0 ? '−' : '+'} ${Math.abs(C)}`;
  return s;
}
/** "(x + 1)(x − 5)" for p = 1, q = −5; "x(x − 5)" when p = 0; "(x − 3)²" for a double root */
export function fmtFactors(p: number, q: number): string {
  const f = (k: number) => (k === 0 ? 'x' : `(x ${k < 0 ? '−' : '+'} ${Math.abs(k)})`);
  if (p === q) return p === 0 ? 'x²' : `${f(p)}²`;
  const [a, b] = p === 0 ? [p, q] : q === 0 ? [q, p] : [p, q];
  return `${f(a)}${f(b)}`;
}

// 1. Factoring: find p and q with p × q = C and p + q = B; then x² + Bx + C = (x + p)(x + q), roots −p and −q.
export interface FactorTrial {
  p: number;
  q: number;
  sum: number;
  ok: boolean;
}
export function factoring({ B, C }: Quadratic): { trials: FactorTrial[]; p: number; q: number; roots: Roots } {
  const trials: FactorTrial[] = [];
  if (C === 0) {
    // x(x + B): one factor is 0.
    trials.push({ p: 0, q: B, sum: B, ok: true });
    return { trials, p: 0, q: B, roots: sorted(0, -B) };
  }
  const m = Math.abs(C);
  for (let d = 1; d * d <= m; d++) {
    if (m % d) continue;
    const e = m / d;
    let p: number;
    let q: number;
    if (C > 0) {
      // Same signs, the sign of B (B can't be 0 here: real roots with C > 0 have the same sign).
      const s = B < 0 ? -1 : 1;
      p = s * d;
      q = s * e;
    } else {
      // Opposite signs; the bigger one takes B's sign.
      const s = B < 0 ? -1 : 1;
      p = -s * d;
      q = s * e;
    }
    const ok = p + q === B;
    trials.push({ p, q, sum: p + q, ok });
    if (ok) return { trials, p, q, roots: sorted(-p, -q) };
  }
  throw new Error(`no factor pair for ${fmtQuad({ B, C })}`);
}

// 2. Completing the square: x² + Bx + C = (x + B/2)² − (B/2)² + C, so (x + B/2)² = (B/2)² − C.
export function completeSquare({ B, C }: Quadratic): { half: number; halfSq: number; rhs: number; root: number; roots: Roots } {
  const half = B / 2;
  const halfSq = half * half;
  const rhs = halfSq - C;
  const root = Math.sqrt(rhs);
  return { half, halfSq, rhs, root, roots: sorted(-half - root, -half + root) };
}

// 3. The quadratic formula: x = (−B ± √(B² − 4C)) / 2.
export function formula({ B, C }: Quadratic): { disc: number; sqrt: number; roots: Roots } {
  const disc = B * B - 4 * C;
  const sqrt = isqrt(disc);
  return { disc, sqrt, roots: sorted((-B - sqrt) / 2, (-B + sqrt) / 2) };
}

// 4. Graphing: draw y = x² + Bx + C and read off where it meets the x-axis.
export function evalQuad({ B, C }: Quadratic, x: number): number {
  return x * x + B * x + C;
}
export function graphing(Q: Quadratic): { vertex: [number, number]; xMin: number; xMax: number; points: [number, number][]; zeros: number[]; roots: Roots } {
  const vx = -Q.B / 2;
  const vy = evalQuad(Q, vx);
  // How far the curve dips below the axis sets how wide to look: it is back at the axis √(−vy) from the vertex.
  const reach = Math.sqrt(Math.max(0, -vy)) + QUAD.graphMargin;
  const xMin = Math.floor(vx - reach);
  const xMax = Math.ceil(vx + reach);
  const points: [number, number][] = [];
  for (let i = 0; i <= QUAD.samples; i++) {
    const x = xMin + ((xMax - xMin) * i) / QUAD.samples;
    points.push([x, evalQuad(Q, x)]);
  }
  // Read the crossings at whole-number grid lines.
  const zeros: number[] = [];
  for (let x = xMin; x <= xMax; x++) if (evalQuad(Q, x) === 0) zeros.push(x + 0);
  const [a = vx, b = a] = zeros;
  return { vertex: [vx, vy], xMin, xMax, points, zeros, roots: sorted(a, b) };
}

// 5. Po-Shen Loh: the roots average −B/2, so call them m − u and m + u; their product m² − u² = C gives u.
export function poShenLoh({ B, C }: Quadratic): { m: number; mSq: number; uSq: number; u: number; roots: Roots } {
  const m = -B / 2;
  const mSq = m * m;
  const uSq = mSq - C;
  const u = Math.sqrt(uSq);
  return { m: m + 0, mSq, uSq, u, roots: sorted(m - u, m + u) };
}

export const QUAD_IDS = ['factoring', 'complete', 'formula', 'graphing', 'loh'] as const;
export type QuadId = (typeof QUAD_IDS)[number];

export function solveAll(r1: number, r2: number): Record<QuadId, Roots> {
  const Q = fromRoots(r1, r2);
  return {
    factoring: factoring(Q).roots,
    complete: completeSquare(Q).roots,
    formula: formula(Q).roots,
    graphing: graphing(Q).roots,
    loh: poShenLoh(Q).roots,
  };
}
