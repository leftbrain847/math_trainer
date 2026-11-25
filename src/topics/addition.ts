/**
 * Addition, six ways: a + b for whole numbers. Every function is pure (no clock, no randomness, no I/O).
 * The client draws these; test/addition.test.ts checks each one lands on a + b.
 */
import { digits, parts } from '../math';

/** Digit of n at a place (0 = ones). */
export const digitAt = (n: number, place: number): number => Math.floor(n / 10 ** place) % 10;
/** Number of digits in the longer of a and b. */
export const width = (a: number, b: number): number => Math.max(digits(a).length, digits(b).length);
/** Round n up to the next multiple of unit (n itself if it already is one). */
export const ceilTo = (n: number, unit: number): number => Math.ceil(n / unit) * unit;

// 1. Column with carrying: ones first, carry any ten into the next column.
export interface AddColumn {
  place: number;
  top: number;
  bottom: number;
  carryIn: number;
  digit: number;
  carryOut: number;
}
export function columnAdd(a: number, b: number): { columns: AddColumn[]; result: number } {
  const columns: AddColumn[] = [];
  let carry = 0;
  for (let place = 0; place < width(a, b); place++) {
    const top = digitAt(a, place);
    const bottom = digitAt(b, place);
    const total = top + bottom + carry;
    columns.push({ place, top, bottom, carryIn: carry, digit: total % 10, carryOut: Math.floor(total / 10) });
    carry = Math.floor(total / 10);
  }
  const lead = carry ? String(carry) : '';
  return { columns, result: Number(lead + columns.map((c) => c.digit).reverse().join('')) };
}

// 2. Left to right: add the biggest column first, write it down, then fix earlier digits when a column makes a ten.
export interface LeftStep {
  place: number;
  sum: number;
  /** Answer slots after this step, slot 0 being the extra digit a final carry can make. */
  slots: number[];
  /** Slots whose digit went up by one (a ten carried back), oldest first. */
  bumped: number[];
}
export function leftToRight(a: number, b: number): { steps: LeftStep[]; result: number } {
  const L = width(a, b);
  const slots = Array.from({ length: L + 1 }, () => 0);
  const steps: LeftStep[] = [];
  for (let k = 0; k < L; k++) {
    const place = L - 1 - k;
    const sum = digitAt(a, place) + digitAt(b, place);
    slots[k + 1] = sum % 10;
    const bumped: number[] = [];
    if (sum >= 10) {
      for (let j = k; j >= 0; j--) {
        const v = (slots[j] ?? 0) + 1;
        bumped.push(j);
        slots[j] = v % 10;
        if (v < 10) break;
      }
    }
    steps.push({ place, sum, slots: [...slots], bumped });
  }
  return { steps, result: Number(slots.join('')) };
}

// 3. Partitioning: split both numbers into hundreds, tens and ones, add like parts, then add the totals.
export interface PartSum {
  place: number;
  a: number;
  b: number;
  sum: number;
}
export function partitioning(a: number, b: number): { sums: PartSum[]; result: number } {
  const sums: PartSum[] = [];
  for (let place = width(a, b) - 1; place >= 0; place--) {
    const pa = digitAt(a, place) * 10 ** place;
    const pb = digitAt(b, place) * 10 ** place;
    if (pa || pb) sums.push({ place, a: pa, b: pb, sum: pa + pb });
  }
  return { sums, result: sums.reduce((s, x) => s + x.sum, 0) };
}

// 4. Number line jumps: start at a and jump forward by each place-value part of b.
export interface Hop {
  from: number;
  size: number;
  to: number;
}
export function numberLine(a: number, b: number): { hops: Hop[]; result: number } {
  const hops: Hop[] = [];
  let at = a;
  for (const size of b ? parts(b) : []) {
    hops.push({ from: at, size, to: at + size });
    at += size;
  }
  return { hops, result: at };
}

/** The round number compensation uses for b: the next ten up, or the next hundred if b is already a ten. */
export function roundUp(b: number): number {
  if (b % 10) return ceilTo(b, 10);
  if (b % 100) return ceilTo(b, 100);
  return b;
}

// 5. Compensation: add a round number instead of b, then take back the extra.
export function compensation(a: number, b: number): { round: number; extra: number; over: number; result: number } {
  const round = roundUp(b);
  const extra = round - b;
  const over = a + round;
  return { round, extra, over, result: over - extra };
}

// 6. Bridging: move part of b over to a so a lands on a round number (the next hundred, else the next ten).
export function bridging(a: number, b: number): { gap: number; target: number; rest: number; result: number } {
  const fits = (g: number) => g > 0 && g <= b;
  const gH = ceilTo(a, 100) - a;
  const gT = ceilTo(a, 10) - a;
  const gap = fits(gH) ? gH : fits(gT) ? gT : 0;
  const target = a + gap;
  const rest = b - gap;
  return { gap, target, rest, result: target + rest };
}

export const ADDITION_IDS = ['column', 'left', 'partition', 'line', 'compensation', 'bridging'] as const;
export type AdditionId = (typeof ADDITION_IDS)[number];

export function addAll(a: number, b: number): Record<AdditionId, number> {
  return {
    column: columnAdd(a, b).result,
    left: leftToRight(a, b).result,
    partition: partitioning(a, b).result,
    line: numberLine(a, b).result,
    compensation: compensation(a, b).result,
    bridging: bridging(a, b).result,
  };
}
