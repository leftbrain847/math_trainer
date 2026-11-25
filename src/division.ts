/**
 * Division, six ways: n ÷ d with a whole-number quotient and remainder. Every function is pure.
 * The client draws these; the tests check each one gives q and r with q × d + r = n and 0 ≤ r < d.
 */
import { digits } from './math';

export interface QR {
  q: number;
  r: number;
}

// 1. Long division: bring down a digit, ask how many times d fits, multiply, subtract, repeat.
export interface LongStep {
  /** Index of the dividend digit this step ends on (the quotient digit sits above it). */
  end: number;
  partial: number;
  qDigit: number;
  product: number;
  rem: number;
}
export function longDivision(n: number, d: number): QR & { steps: LongStep[]; digits: number[] } {
  const D = digits(n);
  const steps: LongStep[] = [];
  let i = 0;
  let partial = D[0] ?? 0;
  while (partial < d && i < D.length - 1) partial = partial * 10 + (D[++i] ?? 0);
  for (;;) {
    const qDigit = Math.floor(partial / d);
    const product = qDigit * d;
    const rem = partial - product;
    steps.push({ end: i, partial, qDigit, product, rem });
    if (i >= D.length - 1) break;
    partial = rem * 10 + (D[++i] ?? 0);
  }
  const q = Number(steps.map((s) => s.qDigit).join('')) || 0;
  return { q, r: steps[steps.length - 1]?.rem ?? n, steps, digits: D };
}

// 2. Short division ("bus stop"): the same idea, but each remainder is carried as a small digit, not written out.
export interface ShortStep {
  index: number;
  carryIn: number;
  value: number;
  qDigit: number;
  carryOut: number;
}
export function shortDivision(n: number, d: number): QR & { steps: ShortStep[]; digits: number[] } {
  const D = digits(n);
  let carry = 0;
  const steps = D.map((digit, index) => {
    const value = carry * 10 + digit;
    const step = { index, carryIn: carry, value, qDigit: Math.floor(value / d), carryOut: value % d };
    carry = step.carryOut;
    return step;
  });
  return { q: Number(steps.map((s) => s.qDigit).join('')) || 0, r: carry, steps, digits: D };
}

/** Friendly chunk sizes for chunking, largest first: easy multiples of the divisor to take away. */
export const CHUNKS = [1000, 500, 200, 100, 50, 20, 10, 5, 2, 1];

// 3. Chunking: keep taking away easy multiples of d (100 lots, 50 lots, 10 lots…) until less than d is left.
export interface Chunk {
  count: number;
  value: number;
  left: number;
}
export function chunking(n: number, d: number, sizes: number[] = CHUNKS): QR & { chunks: Chunk[] } {
  const chunks: Chunk[] = [];
  let left = n;
  while (left >= d) {
    const count = sizes.find((c) => c * d <= left) ?? 1;
    left -= count * d;
    chunks.push({ count, value: count * d, left });
  }
  return { q: chunks.reduce((s, c) => s + c.count, 0), r: left, chunks };
}

// 4. Partial quotients: per place value, take away the biggest (digit × 10^k) lots of d that fit.
export function partialQuotients(n: number, d: number): QR & { chunks: Chunk[] } {
  const chunks: Chunk[] = [];
  let left = n;
  for (let p = digits(n).length - 1; p >= 0; p--) {
    const unit = 10 ** p;
    const k = Math.floor(left / (unit * d));
    if (k === 0) continue;
    left -= k * unit * d;
    chunks.push({ count: k * unit, value: k * unit * d, left });
  }
  return { q: chunks.reduce((s, c) => s + c.count, 0), r: left, chunks };
}

// 5. Doubling (Egyptian): list 1×d, 2×d, 4×d… then take the biggest doublings that still fit.
export interface Doubling {
  times: number;
  value: number;
  take: boolean;
}
export function doubling(n: number, d: number): QR & { rows: Doubling[] } {
  const rows: Doubling[] = [];
  for (let t = 1; t * d <= n; t *= 2) rows.push({ times: t, value: t * d, take: false });
  let left = n;
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i];
    if (row && row.value <= left) {
      row.take = true;
      left -= row.value;
    }
  }
  return { q: rows.filter((x) => x.take).reduce((s, x) => s + x.times, 0), r: left, rows };
}

// 6. Area model: a rectangle d tall whose area is n; its width (split by place value) is the quotient.
export function areaModel(n: number, d: number): QR & { pieces: Chunk[] } {
  const { q, r, chunks } = partialQuotients(n, d);
  return { q, r, pieces: chunks };
}

export const DIVISION_IDS = ['long', 'short', 'chunking', 'partial', 'doubling', 'area'] as const;
export type DivisionId = (typeof DIVISION_IDS)[number];

export function divideAll(n: number, d: number): Record<DivisionId, QR> {
  const pick = ({ q, r }: QR): QR => ({ q, r });
  return {
    long: pick(longDivision(n, d)),
    short: pick(shortDivision(n, d)),
    chunking: pick(chunking(n, d)),
    partial: pick(partialQuotients(n, d)),
    doubling: pick(doubling(n, d)),
    area: pick(areaModel(n, d)),
  };
}
