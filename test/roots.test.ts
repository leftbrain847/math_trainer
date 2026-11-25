import { describe, expect, it } from 'vitest';
import { babylonian, binarySearch, digitByDigit, estimateRefine, factorRoot, fmtRoot, rootAll, rootLine, trueRoot, UNIT } from '../src/topics/roots';

describe('square roots, five ways', () => {
  it('the true answer is √n rounded to the shown decimals, or exact for perfect squares', () => {
    for (let n = 1; n <= 9999; n++) {
      const r = trueRoot(n);
      expect(r.scaled, `√${n}`).toBe(Math.round(Math.sqrt(n) * UNIT));
      expect(r.exact).toBe(Number.isInteger(Math.sqrt(n)));
    }
  });

  it('every method agrees with the true answer for every slider value (and beyond)', () => {
    for (let n = 2; n <= 9999; n++) {
      const want = trueRoot(n);
      for (const [method, got] of Object.entries(rootAll(n))) expect(got, `${method} √${n}`).toEqual(want);
    }
  });

  it('textbook cases', () => {
    expect(rootLine(144)).toBe('√144 = 12');
    expect(rootLine(2)).toBe('√2 ≈ 1.41');
    expect(rootLine(150)).toBe('√150 ≈ 12.25');
    expect(fmtRoot(trueRoot(999))).toBe('31.61');
  });

  it('digit by digit: √150 finds 1, 2, then 2, 4, 7', () => {
    expect(digitByDigit(150).steps.map((s) => s.x)).toEqual([1, 2, 2, 4, 7]);
    expect(digitByDigit(1225).steps.map((s) => s.x)).toEqual([3, 5]);
  });

  it('prime factors: √150 = 5√6, √144 = 12', () => {
    expect(factorRoot(150)).toMatchObject({ outside: 5, inside: 6 });
    expect(factorRoot(144)).toMatchObject({ outside: 12, inside: 1, exact: true });
  });

  it('the stepwise methods stay short enough to draw', () => {
    for (let n = 2; n <= 999; n++) {
      expect(babylonian(n).steps.length, `babylonian ${n}`).toBeLessThanOrEqual(8);
      expect(estimateRefine(n).trials.length, `estimate ${n}`).toBeLessThanOrEqual(7);
      expect(binarySearch(n).halvings.length, `binary ${n}`).toBeLessThanOrEqual(7);
    }
  });
});
