import { describe, expect, it } from 'vitest';
import { binaryGcd, cutSquares, euclid, gcdAll, ladder, listFactors, primeFactors, sharedPrimes } from '../src/topics/gcd';

const brute = (a: number, b: number): number => {
  for (let k = Math.min(a, b); k > 1; k--) if (a % k === 0 && b % k === 0) return k;
  return 1;
};

describe('six ways to find the gcd', () => {
  it('all six agree with brute force for every pair on the sliders (2..150)', () => {
    for (let a = 2; a <= 150; a++)
      for (let b = 2; b <= 150; b++) {
        const want = brute(a, b);
        for (const [method, got] of Object.entries(gcdAll(a, b))) expect(got, `${method} ${a},${b}`).toBe(want);
      }
  });

  it('gcd(84, 60) = 12, textbook working', () => {
    expect(euclid(84, 60).rows.map((r) => [r.a, r.q, r.b, r.r])).toEqual([[84, 1, 60, 24], [60, 2, 24, 12], [24, 2, 12, 0]]);
    expect(cutSquares(84, 60).cuts.map((c) => c.count)).toEqual([1, 2, 2]);
    expect(sharedPrimes(84, 60).shared).toEqual([2, 2, 3]);
    expect(listFactors(84, 60).common).toEqual([1, 2, 3, 4, 6, 12]);
    expect(ladder(84, 60).rungs.map((r) => r.p)).toEqual([2, 2, 3]);
  });

  it('gcd(48, 18) = 6 and coprime pairs give 1', () => {
    expect(binaryGcd(48, 18)).toMatchObject({ twos: 1, gcd: 6 });
    expect(gcdAll(35, 64)).toEqual({ euclid: 1, squares: 1, primes: 1, list: 1, binary: 1, ladder: 1 });
    expect(primeFactors(84)).toEqual([2, 2, 3, 7]);
  });

  it('keeps the drawings small: at most 10 Euclid rows and 12 binary rows on the sliders', () => {
    let e = 0;
    let s = 0;
    for (let a = 2; a <= 150; a++)
      for (let b = 2; b <= 150; b++) {
        e = Math.max(e, euclid(a, b).rows.length);
        s = Math.max(s, binaryGcd(a, b).rows.length);
      }
    expect(e).toBeLessThanOrEqual(10);
    expect(s).toBeLessThanOrEqual(12);
  });
});
