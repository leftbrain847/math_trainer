/**
 * Subtraction, six ways: x − y with x ≥ y (the client swaps the numbers when b > a and makes the answer negative).
 * Every function is pure; test/subtraction.test.ts checks each one lands on x − y.
 */
import { digits, parts } from '../math';

export const digitAt = (n: number, place: number): number => Math.floor(n / 10 ** place) % 10;
const ceilTo = (n: number, unit: number): number => Math.ceil(n / unit) * unit;
const floorTo = (n: number, unit: number): number => Math.floor(n / unit) * unit;

/** a − b as a larger − smaller problem: neg says the true answer is −(x − y). */
export function order(a: number, b: number): { x: number; y: number; neg: boolean } {
  return a >= b ? { x: a, y: b, neg: false } : { x: b, y: a, neg: true };
}

// 1. Column with borrowing (decomposition): when the top digit is too small, take a ten from the next column.
export interface Change {
  place: number;
  from: number;
  to: number;
}
export interface BorrowColumn {
  place: number;
  top: number;
  bottom: number;
  digit: number;
  /** Every top digit this column changed, in order (lenders first, then this column getting its ten). */
  changes: Change[];
}
export function columnBorrow(x: number, y: number): { columns: BorrowColumn[]; result: number } {
  const L = digits(x).length;
  const top = Array.from({ length: L }, (_, p) => digitAt(x, p));
  const columns: BorrowColumn[] = [];
  for (let place = 0; place < L; place++) {
    const bottom = digitAt(y, place);
    const changes: Change[] = [];
    if ((top[place] ?? 0) < bottom) {
      let lender = place + 1;
      while ((top[lender] ?? 0) === 0) lender++;
      // Lender gives one; every zero between becomes 9 (it gets ten and gives one on).
      for (let p = lender; p > place; p--) {
        const from = top[p] ?? 0;
        const to = p === lender ? from - 1 : from + 9;
        changes.push({ place: p, from, to });
        top[p] = to;
      }
      const from = top[place] ?? 0;
      changes.push({ place, from, to: from + 10 });
      top[place] = from + 10;
    }
    const t = top[place] ?? 0;
    columns.push({ place, top: t, bottom, digit: t - bottom, changes });
  }
  return { columns, result: Number(columns.map((c) => c.digit).reverse().join('')) };
}

// 2. Equal addition: add ten to the top digit and pay it back as one more on the bottom of the next column.
export interface EqualColumn {
  place: number;
  top: number;
  /** The bottom digit plus any 1 paid back from the column before. */
  bottom: number;
  payback: number;
  addedTen: boolean;
  digit: number;
}
export function equalAddition(x: number, y: number): { columns: EqualColumn[]; result: number } {
  const L = digits(x).length;
  const columns: EqualColumn[] = [];
  let payback = 0;
  for (let place = 0; place < L; place++) {
    const bottom = digitAt(y, place) + payback;
    const raw = digitAt(x, place);
    const addedTen = raw < bottom;
    const top = addedTen ? raw + 10 : raw;
    columns.push({ place, top, bottom, payback, addedTen, digit: top - bottom });
    payback = addedTen ? 1 : 0;
  }
  return { columns, result: Number(columns.map((c) => c.digit).reverse().join('')) };
}

// 3. Counting up: hop from y to x via friendly numbers (next ten, next hundred, …) and add the hops.
export interface Hop {
  from: number;
  size: number;
  to: number;
}
export function countingUp(x: number, y: number): { hops: Hop[]; result: number } {
  const hops: Hop[] = [];
  let at = y;
  for (const stop of [ceilTo(y, 10), ceilTo(y, 100), floorTo(x, 100), x]) {
    if (stop > at && stop <= x) {
      hops.push({ from: at, size: stop - at, to: stop });
      at = stop;
    }
  }
  return { hops, result: hops.reduce((s, h) => s + h.size, 0) };
}

// 4. Compensation: take away a round number near y, then give back the difference.
export function compensation(x: number, y: number): { round: number; adjust: number; mid: number; result: number } {
  let round = y % 10 ? ceilTo(y, 10) : y % 100 ? ceilTo(y, 100) : y;
  if (round > x) round = floorTo(y, 10);
  // adjust > 0: took too much, give it back; adjust < 0: took too little, take more.
  const adjust = round - y;
  const mid = x - round;
  return { round, adjust, mid, result: mid + adjust };
}

// 5. Number line: start at x and jump back by each place-value part of y.
export function numberLine(x: number, y: number): { hops: Hop[]; result: number } {
  const hops: Hop[] = [];
  let at = x;
  for (const size of y ? parts(y) : []) {
    hops.push({ from: at, size, to: at - size });
    at -= size;
  }
  return { hops, result: at };
}

// 6. Nines' complement: add 999…9 − y (no borrowing needed), add 1, and drop the leading 1.
export function ninesComplement(x: number, y: number): { n: number; nines: number; comp: number; sum: number; plusOne: number; result: number } {
  const n = digits(x).length;
  const nines = 10 ** n - 1;
  const comp = nines - y;
  const sum = x + comp;
  const plusOne = sum + 1;
  return { n, nines, comp, sum, plusOne, result: plusOne - 10 ** n };
}

export const SUBTRACTION_IDS = ['column', 'equal', 'countup', 'compensation', 'line', 'nines'] as const;
export type SubtractionId = (typeof SUBTRACTION_IDS)[number];

export function subtractAll(x: number, y: number): Record<SubtractionId, number> {
  return {
    column: columnBorrow(x, y).result,
    equal: equalAddition(x, y).result,
    countup: countingUp(x, y).result,
    compensation: compensation(x, y).result,
    line: numberLine(x, y).result,
    nines: ninesComplement(x, y).result,
  };
}
