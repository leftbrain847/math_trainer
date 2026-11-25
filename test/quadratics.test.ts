import { describe, expect, it } from 'vitest';
import { completeSquare, factoring, fmtFactors, fmtQuad, formula, fromRoots, poShenLoh, QUAD, solveAll } from '../src/topics/quadratics';

describe('quadratics, five ways', () => {
  it('every method recovers both roots for every slider pair, double roots included', () => {
    for (let r1 = QUAD.min; r1 <= QUAD.max; r1++) {
      for (let r2 = QUAD.min; r2 <= QUAD.max; r2++) {
        const want = r1 <= r2 ? [r1 + 0, r2 + 0] : [r2 + 0, r1 + 0];
        for (const [method, got] of Object.entries(solveAll(r1, r2))) expect(got, `${method} roots ${r1}, ${r2}`).toEqual(want);
      }
    }
  });

  it('textbook: x² − 5x + 6 = (x − 2)(x − 3)', () => {
    const Q = fromRoots(2, 3);
    expect(fmtQuad(Q)).toBe('x² − 5x + 6');
    const F = factoring(Q);
    expect(fmtFactors(F.p, F.q)).toBe('(x − 2)(x − 3)');
    expect(F.roots).toEqual([2, 3]);
  });

  it('textbook: x² − 4x − 5 by formula, square and Po-Shen Loh', () => {
    const Q = fromRoots(-1, 5);
    expect(fmtQuad(Q)).toBe('x² − 4x − 5');
    expect(formula(Q)).toMatchObject({ disc: 36, sqrt: 6 });
    expect(completeSquare(Q)).toMatchObject({ half: -2, rhs: 9, root: 3 });
    expect(poShenLoh(Q)).toMatchObject({ m: 2, uSq: 9, u: 3 });
  });

  it('a double root: x² − 6x + 9 = (x − 3)²', () => {
    const Q = fromRoots(3, 3);
    expect(formula(Q).disc).toBe(0);
    expect(fmtFactors(factoring(Q).p, factoring(Q).q)).toBe('(x − 3)²');
    expect(solveAll(3, 3).graphing).toEqual([3, 3]);
  });

  it('factoring tries at most six pairs', () => {
    for (let r1 = QUAD.min; r1 <= QUAD.max; r1++)
      for (let r2 = QUAD.min; r2 <= QUAD.max; r2++) expect(factoring(fromRoots(r1, r2)).trials.length).toBeLessThanOrEqual(6);
  });
});
