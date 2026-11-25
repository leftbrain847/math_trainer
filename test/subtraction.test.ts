import { describe, expect, it } from 'vitest';
import { columnBorrow, compensation, countingUp, equalAddition, ninesComplement, numberLine, order, subtractAll } from '../src/topics/subtraction';

describe('six subtraction methods', () => {
  it('all six give x − y for every ordered pair across the slider range (1–999)', () => {
    const vals = [1, 2, 9, 10, 11, 99, 100, 101, 278, 503, 523, 999, 1000 - 1];
    for (let v = 1; v <= 999; v += 11) vals.push(v);
    for (const a of vals) {
      for (const b of vals) {
        const { x, y } = order(a, b);
        for (const [method, got] of Object.entries(subtractAll(x, y))) expect(got, `${method} ${x}−${y}`).toBe(x - y);
      }
    }
  });

  it('orders a − b so the larger number comes first', () => {
    expect(order(278, 523)).toEqual({ x: 523, y: 278, neg: true });
    expect(order(523, 278)).toEqual({ x: 523, y: 278, neg: false });
  });

  it('column borrowing: 503 − 278 borrows across the zero', () => {
    const C = columnBorrow(503, 278);
    expect(C.columns[0]?.changes).toEqual([
      { place: 2, from: 5, to: 4 },
      { place: 1, from: 0, to: 9 },
      { place: 0, from: 3, to: 13 },
    ]);
    expect(C.result).toBe(225);
  });

  it('equal addition: 523 − 278 adds ten to the top and pays back on the bottom', () => {
    const E = equalAddition(523, 278);
    expect(E.columns.map((c) => [c.top, c.bottom, c.digit])).toEqual([[13, 8, 5], [12, 8, 4], [5, 3, 2]]);
  });

  it('counting up, compensation, number line and nines take the textbook steps', () => {
    expect(countingUp(523, 278).hops.map((h) => h.size)).toEqual([2, 20, 200, 23]);
    expect(compensation(523, 278)).toEqual({ round: 280, adjust: 2, mid: 243, result: 245 });
    expect(compensation(523, 520)).toMatchObject({ round: 520, adjust: 0 });
    expect(numberLine(523, 278).hops.map((h) => h.to)).toEqual([323, 253, 245]);
    expect(ninesComplement(523, 278)).toEqual({ n: 3, nines: 999, comp: 721, sum: 1244, plusOne: 1245, result: 245 });
    expect(ninesComplement(5, 5).result).toBe(0);
  });
});
