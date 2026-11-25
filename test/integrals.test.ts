import { describe, expect, it } from 'vitest';
import { exact, exactFraction, integrateAll, INTEGRAL_IDS, monteCarlo, riemannRows, simpsonRows, trapezoidRows } from '../src/topics/integrals';

// Slider ranges in src/client/topics/integrals.ts: n 1–5, b 1–5.
const NS = [1, 2, 3, 4, 5];
const BS = [1, 2, 3, 4, 5];

const shrinking = (errs: number[]) => {
  for (let i = 1; i < errs.length; i++) expect(Math.abs(errs[i] ?? 0)).toBeLessThanOrEqual(Math.abs(errs[i - 1] ?? 0) + 1e-9);
};

describe('∫₀ᵇ xⁿ dx', () => {
  it('FTC and by parts are exact across the sliders', () => {
    for (const n of NS)
      for (const b of BS) {
        const got = integrateAll(n, b);
        expect(got.ftc).toBeCloseTo(exact(n, b), 9);
        expect(got.parts).toBeCloseTo(exact(n, b), 9);
      }
  });

  it('Riemann, trapezoid and Simpson errors shrink and stay inside their textbook bounds', () => {
    for (const n of NS)
      for (const b of BS) {
        const I = exact(n, b);
        const R = riemannRows(n, b);
        shrinking(R.map((r) => r.error));
        // Left sum of an increasing function: under by at most (f(b) − f(0))·b/N.
        for (const r of R) {
          expect(r.error).toBeLessThanOrEqual(1e-9);
          expect(-r.error).toBeLessThanOrEqual((b ** n * b) / r.N + 1e-9);
        }
        const T = trapezoidRows(n, b);
        shrinking(T.map((r) => r.error));
        // |error| ≤ b³·max|f″|/(12N²), and f″ is largest at b.
        for (const r of T) expect(Math.abs(r.error)).toBeLessThanOrEqual((b ** 3 * n * (n - 1) * b ** Math.max(0, n - 2)) / (12 * r.N ** 2) + 1e-9);
        const S = simpsonRows(n, b);
        shrinking(S.map((r) => r.error));
        if (n <= 3) for (const r of S) expect(r.error / I).toBeCloseTo(0, 9);
        expect(Math.abs((S[S.length - 1]?.error ?? 1) / I)).toBeLessThan(1e-3);
        expect(Math.abs((R[R.length - 1]?.error ?? 1) / I)).toBeLessThan(0.06);
        expect(Math.abs((T[T.length - 1]?.error ?? 1) / I)).toBeLessThan(1e-3);
      }
  });

  it('Monte Carlo is deterministic and lands within 1.5% with 100 000 darts', () => {
    for (const n of NS)
      for (const b of BS) {
        const M = monteCarlo(n, b);
        expect(monteCarlo(n, b)).toEqual(M);
        const last = M.rows[M.rows.length - 1];
        expect(Math.abs((last?.error ?? 1) / exact(n, b)), `n=${n} b=${b}`).toBeLessThan(0.015);
      }
  });

  it('textbook cases: ∫₀³ x² = 9, ∫₀² x³ = 4, ∫₀¹ x = 1/2', () => {
    expect(integrateAll(2, 3).ftc).toBe(9);
    expect(exactFraction(3, 2)).toEqual({ num: 4, den: 1 });
    expect(exactFraction(1, 1)).toEqual({ num: 1, den: 2 });
    expect(exactFraction(5, 4)).toEqual({ num: 2048, den: 3 });
    expect(integrateAll(2, 3).simpson).toBeCloseTo(9, 12);
  });

  it('has six methods', () => expect(INTEGRAL_IDS).toHaveLength(6));
});
