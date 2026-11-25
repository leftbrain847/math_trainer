/**
 * Derivatives, six ways: the slope of f(x) = xⁿ at x = a. Every function is pure (no clock, no randomness).
 * The exact answer is n·aⁿ⁻¹; the numerical methods return their approximations so the drawings can show them closing in.
 */

/** Tunable step sizes for the numerical methods, largest first. */
export const DERIV = {
  /** Forward difference quotients for the limit definition. */
  limitHs: [1, 0.1, 0.01, 0.001],
  /** Central differences converge faster, so fewer steps show the same story. */
  centralHs: [1, 0.1, 0.01],
};

export const f = (n: number, x: number): number => x ** n;
export const exact = (n: number, a: number): number => n * a ** (n - 1);

export interface Approx {
  h: number;
  slope: number;
  /** slope − exact */
  error: number;
}

// 1. Limit definition: (f(a+h) − f(a)) / h as h shrinks.
export function limitDefinition(n: number, a: number, hs: number[] = DERIV.limitHs): { rows: Approx[]; answer: number } {
  const want = exact(n, a);
  const rows = hs.map((h) => {
    const slope = (f(n, a + h) - f(n, a)) / h;
    return { h, slope, error: slope - want };
  });
  return { rows, answer: want };
}

// 2. Power rule: bring the power down, lower it by one.
export function powerRule(n: number, a: number): { coef: number; power: number; aPow: number; answer: number } {
  const aPow = a ** (n - 1);
  return { coef: n, power: n - 1, aPow, answer: n * aPow };
}

// 3. Product rule: xᵏ = x · xᵏ⁻¹, so (xᵏ)′ = 1·xᵏ⁻¹ + x·(xᵏ⁻¹)′, built up from (x)′ = 1.
export interface ProductRow {
  k: number;
  /** u′v = 1 · aᵏ⁻¹ */
  uPrimeV: number;
  /** the previous derivative (xᵏ⁻¹)′ at a, so uv′ = a · prev */
  prev: number;
  value: number;
}
export function productRule(n: number, a: number): { rows: ProductRow[]; answer: number } {
  const rows: ProductRow[] = [{ k: 1, uPrimeV: 1, prev: 0, value: 1 }];
  for (let k = 2; k <= n; k++) {
    const prev = rows[rows.length - 1]?.value ?? 0;
    const uPrimeV = a ** (k - 1);
    rows.push({ k, uPrimeV, prev, value: uPrimeV + a * prev });
  }
  return { rows, answer: rows[rows.length - 1]?.value ?? 0 };
}

// 4. Logarithmic: ln y = n ln x, so y′/y = n/x and y′ = y · n/x.
export function logarithmic(n: number, a: number): { y: number; answer: number } {
  const y = f(n, a);
  return { y, answer: (y * n) / a };
}

// 5. Finite differences (central): (f(a+h) − f(a−h)) / 2h, error shrinks like h².
export function centralDifferences(n: number, a: number, hs: number[] = DERIV.centralHs): { rows: Approx[]; answer: number } {
  const want = exact(n, a);
  const rows = hs.map((h) => {
    const slope = (f(n, a + h) - f(n, a - h)) / (2 * h);
    return { h, slope, error: slope - want };
  });
  return { rows, answer: want };
}

// 6. Binomial expansion: (a+h)ⁿ = Σ C(n,k)·aⁿ⁻ᵏ·hᵏ. Subtract aⁿ, divide by h, let h → 0: the h¹ coefficient is left.
export function binomial(n: number, k: number): number {
  let c = 1;
  for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i;
  return Math.round(c);
}
export function binomialExpansion(n: number, a: number): { terms: { k: number; coef: number }[]; answer: number } {
  const terms = Array.from({ length: n + 1 }, (_, k) => ({ k, coef: binomial(n, k) * a ** (n - k) }));
  return { terms, answer: terms[1]?.coef ?? 0 };
}

export const DERIVATIVE_IDS = ['limit', 'power', 'product', 'log', 'central', 'binomial'] as const;
export type DerivativeId = (typeof DERIVATIVE_IDS)[number];

/** Each method's final value: exact methods give n·aⁿ⁻¹; numerical ones give their smallest-h estimate. */
export function deriveAll(n: number, a: number): Record<DerivativeId, number> {
  const lastSlope = (rows: Approx[]) => rows[rows.length - 1]?.slope ?? NaN;
  return {
    limit: lastSlope(limitDefinition(n, a).rows),
    power: powerRule(n, a).answer,
    product: productRule(n, a).answer,
    log: logarithmic(n, a).answer,
    central: lastSlope(centralDifferences(n, a).rows),
    binomial: binomialExpansion(n, a).answer,
  };
}
