import { describe, expect, it } from 'vitest';
import { bruteSum, formula, gaussPairing, induction, sumAll } from '../src/topics/sum-1-n';

describe('sum 1 to n, five ways', () => {
  it('every method matches adding them up, for every slider value and beyond', () => {
    for (let n = 1; n <= 500; n++) {
      const want = bruteSum(n);
      for (const [method, got] of Object.entries(sumAll(n))) expect(got, `${method} n=${n}`).toBe(want);
    }
  });

  it('textbook cases: Gauss 1..100 = 5050, 1..10 = 55', () => {
    expect(sumAll(100).pairing).toBe(5050);
    expect(sumAll(10).formula).toBe(55);
  });

  it('pairing: 50 pairs of 101 for n = 100; n = 9 leaves 5 in the middle', () => {
    expect(gaussPairing(100)).toMatchObject({ pairSum: 101, middle: 0 });
    expect(gaussPairing(100).pairs).toHaveLength(50);
    expect(gaussPairing(9)).toMatchObject({ middle: 5, total: 45 });
    expect(gaussPairing(1)).toMatchObject({ pairs: [], middle: 1, total: 1 });
  });

  it('induction: every rung equals the formula', () => {
    for (const r of induction(60).rungs) expect(r.sum).toBe(r.formula);
  });

  it('formula halves the even one of n and n + 1', () => {
    expect(formula(10)).toMatchObject({ even: 10, halved: 5, other: 11 });
    expect(formula(9)).toMatchObject({ even: 10, halved: 5, other: 9 });
  });
});
