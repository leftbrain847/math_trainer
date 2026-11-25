/**
 * Integrals, six ways: the area ∫₀ᵇ xⁿ dx = bⁿ⁺¹/(n+1). Every function is pure (no clock, no randomness).
 * Riemann, trapezoid, Simpson and Monte Carlo are approximations; they return their estimates so the drawings
 * can show the error shrinking. FTC and integration by parts are exact.
 *
 * Substitution is left out on purpose: for xⁿ every substitution is either circular (u = xⁿ⁺¹ needs the answer
 * to choose it) or a mere rescaling (x = b·t) that still leaves ∫ tⁿ dt to do another way.
 */

export const INTEGRAL = {
  /** Strip counts for the left Riemann sum and the trapezoid rule. */
  stripNs: [4, 8, 16, 100],
  /** Panel counts (even) for Simpson's rule. */
  simpsonNs: [2, 4, 8],
  /** Darts for Monte Carlo; the drawing shows the first `drawn`. */
  dartNs: [50, 200, 2000, 100000],
  drawn: 200,
  /** Fixed seed so the darts land in the same places every time. */
  seed: 0x9e3779b9,
};

export const f = (n: number, x: number): number => x ** n;
export const exact = (n: number, b: number): number => b ** (n + 1) / (n + 1);

const gcd = (x: number, y: number): number => (y === 0 ? Math.abs(x) : gcd(y, x % y));
/** The exact answer as a reduced fraction bⁿ⁺¹ / (n+1). */
export function exactFraction(n: number, b: number): { num: number; den: number } {
  const num = b ** (n + 1);
  const den = n + 1;
  const g = gcd(num, den);
  return { num: num / g, den: den / g };
}

export interface Estimate {
  N: number;
  value: number;
  /** value − exact */
  error: number;
}

// 1. Left Riemann sum: N rectangles, each as tall as the curve at its left edge.
export function leftRiemann(n: number, b: number, N: number): number {
  const w = b / N;
  let s = 0;
  for (let i = 0; i < N; i++) s += f(n, i * w) * w;
  return s;
}

// 2. Trapezoid rule: join the curve's points with straight lines.
export function trapezoid(n: number, b: number, N: number): number {
  const w = b / N;
  let s = (f(n, 0) + f(n, b)) / 2;
  for (let i = 1; i < N; i++) s += f(n, i * w);
  return s * w;
}

// 3. Simpson's rule: a parabola through each pair of strips (N even). Exact for cubics and below.
export function simpson(n: number, b: number, N: number): number {
  const w = b / N;
  let s = f(n, 0) + f(n, b);
  for (let i = 1; i < N; i++) s += (i % 2 ? 4 : 2) * f(n, i * w);
  return (s * w) / 3;
}

/** The parabola through three equally spaced points, sampled for drawing: y at x for panel [x0, x0 + 2w]. */
export function simpsonParabola(n: number, x0: number, w: number, x: number): number {
  const y0 = f(n, x0);
  const y1 = f(n, x0 + w);
  const y2 = f(n, x0 + 2 * w);
  const t = (x - x0) / w;
  return (y0 * (t - 1) * (t - 2)) / 2 - y1 * t * (t - 2) + (y2 * t * (t - 1)) / 2;
}

const rows = (n: number, b: number, Ns: number[], rule: (n: number, b: number, N: number) => number): Estimate[] =>
  Ns.map((N) => {
    const value = rule(n, b, N);
    return { N, value, error: value - exact(n, b) };
  });

export const riemannRows = (n: number, b: number): Estimate[] => rows(n, b, INTEGRAL.stripNs, leftRiemann);
export const trapezoidRows = (n: number, b: number): Estimate[] => rows(n, b, INTEGRAL.stripNs, trapezoid);
export const simpsonRows = (n: number, b: number): Estimate[] => rows(n, b, INTEGRAL.simpsonNs, simpson);

// 4. Antiderivative (FTC): F(x) = xⁿ⁺¹/(n+1), area = F(b) − F(0).
export function ftc(n: number, b: number): { Fb: number; F0: number; answer: number } {
  const Fb = b ** (n + 1) / (n + 1);
  return { Fb, F0: 0, answer: Fb };
}

// 5. By parts with u = xⁿ, dv = dx: I = [x·xⁿ]₀ᵇ − ∫ x · n xⁿ⁻¹ dx = bⁿ⁺¹ − n·I, so (n+1)·I = bⁿ⁺¹.
export function byParts(n: number, b: number): { boundary: number; again: number; answer: number } {
  const boundary = b * b ** n;
  return { boundary, again: n, answer: boundary / (n + 1) };
}

// 6. Monte Carlo: throw darts at the box [0,b] × [0,bⁿ]; the share under the curve times the box area estimates I.
/** A 32-bit integer hash (lowbias32), so dart k always lands in the same place. */
export function hash32(x: number): number {
  let h = x >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x7feb352d);
  h ^= h >>> 15;
  h = Math.imul(h, 0x846ca68b);
  h ^= h >>> 16;
  return h >>> 0;
}
/** Dart k in the unit square. */
export function dart(k: number, seed: number = INTEGRAL.seed): [number, number] {
  const u = hash32(hash32(seed ^ (2 * k)) + 2 * k) / 2 ** 32;
  const v = hash32(hash32(seed ^ (2 * k + 1)) + 2 * k + 1) / 2 ** 32;
  return [u, v];
}
export function monteCarlo(n: number, b: number, Ns: number[] = INTEGRAL.dartNs): { rows: (Estimate & { hits: number })[]; box: number } {
  const box = b * f(n, b);
  const out: (Estimate & { hits: number })[] = [];
  let hits = 0;
  let k = 0;
  for (const N of Ns) {
    for (; k < N; k++) {
      const [u, v] = dart(k);
      if (v < f(n, u)) hits++;
    }
    const value = (box * hits) / N;
    out.push({ N, hits, value, error: value - exact(n, b) });
  }
  return { rows: out, box };
}

export const INTEGRAL_IDS = ['riemann', 'trapezoid', 'simpson', 'ftc', 'parts', 'monte'] as const;
export type IntegralId = (typeof INTEGRAL_IDS)[number];

/** Each method's final value (the approximations at their finest setting). */
export function integrateAll(n: number, b: number): Record<IntegralId, number> {
  const last = (r: Estimate[]) => r[r.length - 1]?.value ?? NaN;
  return {
    riemann: last(riemannRows(n, b)),
    trapezoid: last(trapezoidRows(n, b)),
    simpson: last(simpsonRows(n, b)),
    ftc: ftc(n, b).answer,
    parts: byParts(n, b).answer,
    monte: last(monteCarlo(n, b).rows),
  };
}
