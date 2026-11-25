import { describe, expect, it } from 'vitest';
import { binomialExpansion, centralDifferences, deriveAll, DERIVATIVE_IDS, exact, limitDefinition, productRule } from '../src/topics/derivatives';

// Slider ranges in src/client/topics/derivatives.ts: n 1–6, a 1–5.
const NS = [1, 2, 3, 4, 5, 6];
const AS = [1, 2, 3, 4, 5];

describe('derivatives of xⁿ at x = a', () => {
  it('the exact methods all give n·aⁿ⁻¹ across the sliders', () => {
    for (const n of NS)
      for (const a of AS) {
        const got = deriveAll(n, a);
        for (const id of ['power', 'product', 'log', 'binomial'] as const) expect(got[id], `${id} n=${n} a=${a}`).toBeCloseTo(n * a ** (n - 1), 9);
      }
  });

  it('the limit definition closes in: each smaller h is nearer, and h = 0.001 is within 0.5%', () => {
    for (const n of NS)
      for (const a of AS) {
        const errs = limitDefinition(n, a).rows.map((r) => Math.abs(r.error));
        for (let i = 1; i < errs.length; i++) expect(errs[i], `n=${n} a=${a}`).toBeLessThanOrEqual((errs[i - 1] ?? 0) + 1e-9);
        expect(Math.abs((errs[errs.length - 1] ?? 1) / exact(n, a)), `n=${n} a=${a}`).toBeLessThan(5e-3);
      }
  });

  it('central differences are exact for n ≤ 2 and within 0.1% at h = 0.01 otherwise', () => {
    for (const n of NS)
      for (const a of AS) {
        const rows = centralDifferences(n, a).rows;
        if (n <= 2) for (const r of rows) expect(r.error).toBeCloseTo(0, 9);
        const last = rows[rows.length - 1];
        expect(Math.abs((last?.error ?? 1) / exact(n, a)), `n=${n} a=${a}`).toBeLessThan(1e-3);
      }
  });

  it('textbook cases: (x³)′ at 2 is 12, (x²)′ at 5 is 10, (x)′ is 1', () => {
    expect(deriveAll(3, 2).power).toBe(12);
    expect(deriveAll(2, 5).product).toBe(10);
    expect(deriveAll(1, 4).log).toBe(1);
    expect(limitDefinition(3, 2).rows[0]?.slope).toBe(19);
  });

  it('the product rule builds (x³)′ = 1, 4, 12 at x = 2', () => {
    expect(productRule(3, 2).rows.map((r) => r.value)).toEqual([1, 4, 12]);
  });

  it('the binomial expansion of (2 + h)³ is 8 + 12h + 6h² + h³', () => {
    expect(binomialExpansion(3, 2).terms.map((t) => t.coef)).toEqual([8, 12, 6, 1]);
  });

  it('has six methods', () => expect(DERIVATIVE_IDS).toHaveLength(6));
});
