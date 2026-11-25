import { describe, expect, it } from 'vitest';
import { buildSystem, clipLine, cramer, fmtEq, gaussian, solveAll, SYSTEM } from '../src/topics/systems';

describe('two equations, six ways', () => {
  it('every method recovers the chosen (x, y) for every slider pair', () => {
    for (let x = SYSTEM.min; x <= SYSTEM.max; x++) {
      for (let y = SYSTEM.min; y <= SYSTEM.max; y++) {
        for (const [method, got] of Object.entries(solveAll(x, y))) {
          expect(got.x, `${method} (${x}, ${y})`).toBe(x);
          expect(got.y, `${method} (${x}, ${y})`).toBe(y);
        }
      }
    }
  });

  it('builds x + 2y = 8 and 3x − y = 3 for (2, 3)', () => {
    const [e1, e2] = buildSystem(2, 3);
    expect(fmtEq(e1)).toBe('x + 2y = 8');
    expect(fmtEq(e2)).toBe('3x − y = 3');
    expect(fmtEq({ a: 3, b: -1, c: -5 })).toBe('3x − y = −5');
  });

  it("textbook: Cramer's determinants for (2, 3)", () => {
    expect(cramer(buildSystem(2, 3))).toMatchObject({ D: -7, Dx: -14, Dy: -21 });
  });

  it('Gaussian elimination keeps whole numbers in every row', () => {
    for (let x = SYSTEM.min; x <= SYSTEM.max; x++)
      for (let y = SYSTEM.min; y <= SYSTEM.max; y++)
        for (const op of gaussian(buildSystem(x, y)).ops) for (const v of op.rows.flat()) expect(Number.isInteger(v)).toBe(true);
  });

  it('both lines cross the graph window', () => {
    for (const [x, y] of [[SYSTEM.min, SYSTEM.min], [SYSTEM.max, SYSTEM.max], [SYSTEM.min, SYSTEM.max], [SYSTEM.max, SYSTEM.min]] as const)
      for (const e of buildSystem(x, y)) expect(clipLine(e, SYSTEM.axis)).not.toBeNull();
  });
});
