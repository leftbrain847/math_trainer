/**
 * 1 + 2 + … + n, five ways. Every function is pure; the tests check each one against adding the numbers up.
 */

/** Tunables for the sum topic. */
export const SUM = {
  /** Above this n the pictures drop the cell grid and the pairing shows only the ends of the list. */
  drawCap: 12,
  /** The pairing list shows every number up to this n, else the first and last few. */
  listAll: 7,
  /** How many numbers at each end the pairing list shows for a long list. */
  listEnds: 3,
};

/** Adding them up one at a time: the plain answer the methods must match. */
export function bruteSum(n: number): number {
  let s = 0;
  for (let k = 1; k <= n; k++) s += k;
  return s;
}

// 1. Gauss pairing: 1 + n, 2 + (n − 1), … every pair makes n + 1; an odd n leaves the middle number alone.
export interface Pair {
  lo: number;
  hi: number;
}
export function gaussPairing(n: number): { pairs: Pair[]; pairSum: number; middle: number; total: number } {
  const pairs: Pair[] = [];
  for (let lo = 1, hi = n; lo < hi; lo++, hi--) pairs.push({ lo, hi });
  const pairSum = n + 1;
  const middle = n % 2 ? (n + 1) / 2 : 0;
  return { pairs, pairSum, middle, total: pairs.length * pairSum + middle };
}

// 2. Two staircases: the staircase 1, 2, …, n plus a copy turned round fill an n × (n + 1) rectangle.
export function twoStaircases(n: number): { columns: number[]; width: number; height: number; rectangle: number; total: number } {
  const columns = Array.from({ length: n }, (_, k) => k + 1);
  const width = n;
  const height = n + 1;
  const rectangle = width * height;
  return { columns, width, height, rectangle, total: rectangle / 2 };
}

// 3. Half a square plus half the diagonal: the staircase is half the n × n square plus n half-cells on the diagonal.
export function halfSquare(n: number): { square: number; half: number; diagonalHalves: number; total: number } {
  const square = n * n;
  return { square, half: square / 2, diagonalHalves: n / 2, total: square / 2 + n / 2 };
}

// 4. Induction: S(1) = 1 = 1·2/2, and adding k + 1 to k(k + 1)/2 gives (k + 1)(k + 2)/2, so the formula climbs to n.
export interface Rung {
  k: number;
  /** S(k), built by adding k to the previous rung. */
  sum: number;
  /** k(k + 1)/2: the formula the step proves equal. */
  formula: number;
}
export function induction(n: number): { rungs: Rung[]; total: number } {
  const rungs: Rung[] = [];
  let sum = 0;
  for (let k = 1; k <= n; k++) {
    sum += k;
    rungs.push({ k, sum, formula: (k * (k + 1)) / 2 });
  }
  return { rungs, total: rungs[rungs.length - 1]?.sum ?? 0 };
}

// 5. The formula n(n + 1)/2: one of n and n + 1 is even, so halve that one first and multiply.
export function formula(n: number): { even: number; other: number; halved: number; average: number; total: number } {
  const even = n % 2 === 0 ? n : n + 1;
  const other = n % 2 === 0 ? n + 1 : n;
  const halved = even / 2;
  return { even, other, halved, average: (1 + n) / 2, total: halved * other };
}

export const SUM_IDS = ['pairing', 'staircases', 'half-square', 'induction', 'formula'] as const;
export type SumId = (typeof SUM_IDS)[number];

export function sumAll(n: number): Record<SumId, number> {
  return {
    pairing: gaussPairing(n).total,
    staircases: twoStaircases(n).total,
    'half-square': halfSquare(n).total,
    induction: induction(n).total,
    formula: formula(n).total,
  };
}
