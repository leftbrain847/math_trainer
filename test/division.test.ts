import { describe, expect, it } from 'vitest';
import { chunking, divideAll, doubling, longDivision, partialQuotients, shortDivision } from '../src/division';

describe('six division methods', () => {
  it('all six give q and r with q × d + r = n and 0 ≤ r < d', () => {
    for (let n = 1; n <= 9999; n += 37) {
      for (const d of [2, 3, 7, 9, 10, 12, 25, 47, 99]) {
        const want = { q: Math.floor(n / d), r: n % d };
        for (const [method, got] of Object.entries(divideAll(n, d))) expect(got, `${method} ${n}÷${d}`).toEqual(want);
      }
    }
  });

  it('handles a dividend smaller than the divisor', () => {
    for (const got of Object.values(divideAll(5, 12))) expect(got).toEqual({ q: 0, r: 5 });
  });

  it('long division: 1597 ÷ 12 brings down digits in order', () => {
    const L = longDivision(1597, 12);
    expect(L.steps.map((s) => [s.partial, s.qDigit, s.rem])).toEqual([[15, 1, 3], [39, 3, 3], [37, 3, 1]]);
  });

  it('short division carries each remainder to the next digit', () => {
    expect(shortDivision(1597, 12).steps.map((s) => s.carryOut)).toEqual([1, 3, 3, 1]);
  });

  it('chunking takes friendly chunks; partial quotients take place-value chunks', () => {
    expect(chunking(1597, 12).chunks.map((c) => c.count)).toEqual([100, 20, 10, 2, 1]);
    expect(partialQuotients(1597, 12).chunks.map((c) => c.count)).toEqual([100, 30, 3]);
  });

  it('doubling takes 128 + 4 + 1 for 1597 ÷ 12', () => {
    expect(doubling(1597, 12).rows.filter((r) => r.take).map((r) => r.times)).toEqual([1, 4, 128]);
  });
});

describe('division topic', () => {
  it('is built, with one catalog method per drawn method', async () => {
    const { TOPICS } = await import('../src/catalog');
    const { DIVISION_IDS } = await import('../src/division');
    const t = TOPICS.find((x) => x.id === 'division');
    expect(t?.built).toBe(true);
    expect(t?.methods).toHaveLength(DIVISION_IDS.length);
  });
});
