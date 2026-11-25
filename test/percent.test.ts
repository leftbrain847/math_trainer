import { describe, expect, it } from 'vitest';
import { asFraction, buildingBlocks, fmt, percentAll, swap } from '../src/topics/percent';

describe('six percent methods', () => {
  it('all six give p × n hundredths across the slider range (p 1–100, n 1–400)', () => {
    const ps = [1, 4, 5, 9, 10, 25, 35, 50, 99, 100];
    const ns = [1, 7, 10, 47, 80, 99, 250, 399, 400];
    for (let v = 1; v <= 100; v += 3) ps.push(v);
    for (let v = 1; v <= 400; v += 17) ns.push(v);
    for (const p of ps) {
      for (const n of ns) {
        for (const [method, got] of Object.entries(percentAll(p, n))) expect(got, `${method} ${p}% of ${n}`).toBe(p * n);
        expect(Number(fmt(p * n)), `${p}% of ${n}`).toBeCloseTo((p * n) / 100, 9);
      }
    }
  });

  it('formats hundredths as short decimals', () => {
    expect([fmt(2800), fmt(1645), fmt(350), fmt(5), fmt(0)]).toEqual(['28', '16.45', '3.5', '0.05', '0']);
  });

  it('35% of 80 = 28 by fraction, blocks and swap', () => {
    expect(asFraction(35, 80)).toMatchObject({ num: 7, den: 20, divides: true, share: 4 });
    const B = buildingBlocks(35, 80);
    expect([B.tens.count, B.fives.count, B.ones.count, B.result]).toEqual([3, 1, 0, 2800]);
    expect(swap(35, 80)).toEqual({ byTen: true, unit: 350, times: 8, result: 2800 });
  });

  it('textbook cases: 15% of 60 = 9, 8% of 50 = 4, 12% of 47 = 5.64', () => {
    expect(fmt(percentAll(15, 60).decimal)).toBe('9');
    expect(swap(8, 50)).toMatchObject({ byTen: true, unit: 80, times: 5 });
    expect(fmt(percentAll(8, 50).swap)).toBe('4');
    expect(fmt(percentAll(12, 47).blocks)).toBe('5.64');
  });
});
