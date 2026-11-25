import { describe, expect, it } from 'vitest';
import { countAll, formula, listChoices, orderedPicks, pascal, tree } from '../src/topics/counting';

const choose = (n: number, r: number): number => {
  let v = 1;
  for (let k = 1; k <= r; k++) v = (v * (n - r + k)) / k;
  return v;
};

describe('five ways to count choices', () => {
  it('all five give n choose r for every slider pair (n 1..8, r 0..n), plus n up to 12', () => {
    for (let n = 1; n <= 12; n++) for (let r = 0; r <= n; r++) for (const [method, got] of Object.entries(countAll(n, r))) expect(got, `${method} ${n}C${r}`).toBe(choose(n, r));
  });

  it('textbook values: 5C3 = 10, 8C4 = 70, 6C2 = 15', () => {
    expect(countAll(5, 3).list).toBe(10);
    expect(countAll(8, 4).tree).toBe(70);
    expect(formula(6, 2)).toMatchObject({ top: [6, 5], bottom: [2, 1], count: 15 });
    expect(orderedPicks(5, 3)).toMatchObject({ ordered: 60, orders: 6, count: 10 });
    expect(pascal(4, 2).rows).toEqual([[1], [1, 1], [1, 2, 1], [1, 3, 3, 1], [1, 4, 6, 4, 1]]);
  });

  it('lists every choice once, in order', () => {
    expect(listChoices(4, 2).sets).toEqual([[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]]);
    const leaves = tree(4, 2);
    expect(leaves.leaves.map((i) => leaves.nodes[i]?.path)).toEqual([[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]]);
  });

  it('edges: r = 0 and r = n give 1 way', () => {
    for (let n = 1; n <= 8; n++) {
      expect(Object.values(countAll(n, 0)), `${n}C0`).toEqual([1, 1, 1, 1, 1]);
      expect(Object.values(countAll(n, n)), `${n}C${n}`).toEqual([1, 1, 1, 1, 1]);
    }
  });
});
