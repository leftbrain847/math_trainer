import { describe, expect, it } from 'vitest';
import { addAll, bridging, columnAdd, compensation, leftToRight, numberLine, partitioning } from '../src/topics/addition';

describe('six addition methods', () => {
  it('all six give a + b across the slider range (1–999)', () => {
    const vals = [1, 2, 9, 10, 11, 99, 100, 101, 478, 365, 500, 999];
    for (let v = 1; v <= 999; v += 13) vals.push(v);
    for (const a of vals) {
      for (const b of vals) {
        for (const [method, got] of Object.entries(addAll(a, b))) expect(got, `${method} ${a}+${b}`).toBe(a + b);
      }
    }
  });

  it('column: 478 + 365 carries 1 out of the ones and the tens', () => {
    expect(columnAdd(478, 365).columns.map((c) => [c.digit, c.carryOut])).toEqual([[3, 1], [4, 1], [8, 0]]);
    expect(columnAdd(999, 999).result).toBe(1998);
  });

  it('left to right: 478 + 365 writes 7, fixes it to 8, then fixes 3 to 4', () => {
    const L = leftToRight(478, 365);
    expect(L.steps.map((s) => s.slots.join(''))).toEqual(['0700', '0830', '0843']);
    expect(L.steps.map((s) => s.bumped)).toEqual([[], [1], [2]]);
    expect(leftToRight(999, 1).steps.at(-1)?.bumped).toEqual([2, 1, 0]);
  });

  it('partitioning, number line, compensation and bridging take the textbook steps', () => {
    expect(partitioning(478, 365).sums.map((s) => s.sum)).toEqual([700, 130, 13]);
    expect(numberLine(478, 365).hops.map((h) => h.to)).toEqual([778, 838, 843]);
    expect(compensation(478, 365)).toEqual({ round: 370, extra: 5, over: 848, result: 843 });
    expect(compensation(46, 40)).toMatchObject({ round: 100, extra: 60 });
    expect(bridging(478, 365)).toEqual({ gap: 22, target: 500, rest: 343, result: 843 });
    expect(bridging(478, 9)).toMatchObject({ gap: 2, target: 480 });
    expect(bridging(500, 7)).toMatchObject({ gap: 0, target: 500 });
  });
});
