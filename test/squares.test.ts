import { describe, expect, it } from 'vitest';
import { diffSquares, endsIn5, expansion, nearBase, squareAll } from '../src/topics/squares';

describe('five squaring methods', () => {
  it('all five give n × n across and beyond the slider range (11–125)', () => {
    for (let n = 1; n <= 200; n++) {
      for (const [method, got] of Object.entries(squareAll(n))) expect(got, `${method} ${n}²`).toBe(n * n);
    }
  });

  it('textbook cases', () => {
    expect(expansion(43)).toMatchObject({ aa: 1600, ab2: 240, bb: 9, result: 1849 });
    expect(endsIn5(65)).toMatchObject({ m: 65, head: 42, mm: 4225, adjust: 0 });
    expect(endsIn5(43)).toMatchObject({ m: 45, mm: 2025, gap: 2, sum: 88, adjust: 176 });
    expect(nearBase(97)).toMatchObject({ base: 100, d: -3, hi: 94, part: 9400, dd: 9 });
    expect(nearBase(43)).toMatchObject({ base: 50, d: -7, hi: 36, part: 1800, dd: 49 });
    expect(diffSquares(43)).toMatchObject({ lo: 40, hi: 46, prod: 1840, dd: 9 });
  });
});
