import { describe, expect, it } from 'vitest';
import { addAll, areaModel, butterfly, commonDenominator, lowestCommon, numberLine, simplify } from '../src/topics/fractions';

/** The exact sum in lowest terms, found by brute force (no shared code with the methods). */
function truth(a: number, b: number, c: number, d: number): { n: number; d: number } {
  const top = a * d + c * b;
  const bottom = b * d;
  for (let q = 1; q <= bottom; q++) if ((top * q) % bottom === 0) return { n: (top * q) / bottom, d: q };
  return { n: top, d: bottom };
}

describe('five ways to add fractions', () => {
  it('all five give the exact sum in lowest terms across the whole slider range', () => {
    for (let a = 1; a <= 12; a++)
      for (let b = 2; b <= 12; b++)
        for (let c = 1; c <= 12; c++)
          for (let d = 2; d <= 12; d++) {
            const want = truth(a, b, c, d);
            for (const [method, got] of Object.entries(addAll(a, b, c, d))) expect(got, `${method} ${a}/${b}+${c}/${d}`).toEqual(want);
          }
  });

  it('3/4 + 1/6 = 11/12: product denominator 24, lowest 12', () => {
    const C = commonDenominator(3, 4, 1, 6);
    expect([C.an, C.cn, C.den, C.answer.n, C.answer.d]).toEqual([18, 4, 24, 11, 12]);
    const L = lowestCommon(3, 4, 1, 6);
    expect([L.multiples, L.an, L.cn, L.den]).toEqual([[6, 12], 9, 2, 12]);
  });

  it('1/2 + 1/3 = 5/6 and 1/6 + 1/3 = 1/2 (simplified)', () => {
    expect(butterfly(1, 2, 1, 3)).toMatchObject({ left: 3, right: 2, top: 5, bottom: 6, answer: { n: 5, d: 6 } });
    expect(lowestCommon(1, 6, 1, 3).answer).toMatchObject({ n: 1, d: 2, g: 3 });
  });

  it('area model and number line count cells and steps', () => {
    expect(areaModel(1, 2, 2, 3)).toMatchObject({ cellsA: 3, cellsC: 4, wholesSum: 2, answer: { n: 7, d: 6 } });
    expect(numberLine(12, 12, 12, 12)).toMatchObject({ L: 12, landing: 24, wholes: 2, answer: { n: 2, d: 1 } });
    expect(simplify(22, 24)).toEqual({ n: 11, d: 12, g: 2 });
  });
});
