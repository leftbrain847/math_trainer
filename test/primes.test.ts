import { describe, expect, it } from 'vitest';
import { divisibilityRules, fermat, modPow, ruleValue, sieve, trialDivision, verdicts, wilson } from '../src/topics/primes';

const isPrime = (n: number): boolean => {
  if (n < 2) return false;
  for (let k = 2; k < n; k++) if (n % k === 0) return false;
  return true;
};

describe('five ways to test for a prime', () => {
  it('every method reaches the true verdict for every n on the slider (2..120) and beyond to 168', () => {
    for (let n = 2; n <= 168; n++) for (const [method, got] of Object.entries(verdicts(n))) expect(got, `${method} ${n}`).toBe(isPrime(n));
  });

  it('91 = 7 × 13 is caught by each method', () => {
    expect(trialDivision(91)).toMatchObject({ divisor: 7, prime: false });
    expect(sieve(91)).toMatchObject({ crossedBy: 7, prime: false });
    expect(fermat(91).tries).toEqual([{ a: 2, r: 64 }]);
    expect(divisibilityRules(91).checks.map((c) => [c.p, c.value, c.divides])).toEqual([[2, 1, false], [3, 10, false], [5, 1, false], [7, 7, true]]);
    expect(wilson(91).r).toBe(0);
  });

  it('97 is prime: no factor up to 7, Fermat passes bases 2, 3, 5, Wilson ends on 96', () => {
    expect(trialDivision(97).tries.map((t) => t.p)).toEqual([2, 3, 5, 7]);
    expect(fermat(97).tries.map((t) => t.r)).toEqual([1, 1, 1]);
    expect(wilson(97).r).toBe(96);
  });

  it('rules: 7 uses rest − 2 × last, 11 uses the alternating digit sum', () => {
    expect(ruleValue(119, 7)).toBe(-7);
    expect(ruleValue(121, 11)).toBe(0);
    expect(modPow(2, 10, 1000)).toBe(24);
  });

  it('every rule verdict matches real divisibility', () => {
    for (let n = 2; n <= 168; n++) for (const p of [2, 3, 5, 7, 11]) {
      const v = ruleValue(n, p);
      const says = p === 2 ? v % 2 === 0 : p === 5 ? v === 0 || v === 5 : v % p === 0;
      expect(says, `${n} by ${p}`).toBe(n % p === 0);
    }
  });
});
