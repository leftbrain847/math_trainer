/**
 * Percentages, six ways: p% of n for whole p and n. Every amount is kept as a whole number of hundredths
 * (p% of n = p × n hundredths), so the maths stays exact; fmt() turns hundredths into a short decimal.
 * Every function is pure; test/percent.test.ts checks each one lands on p × n ÷ 100.
 */

/** Hundredths as a decimal string with no trailing zeros: 2800 → "28", 1645 → "16.45", 350 → "3.5". */
export function fmt(h: number): string {
  const sign = h < 0 ? '−' : '';
  const v = Math.abs(h);
  const whole = Math.floor(v / 100);
  const frac = v % 100;
  if (frac === 0) return `${sign}${whole}`;
  return `${sign}${whole}.${frac % 10 ? String(frac).padStart(2, '0') : String(frac / 10)}`;
}

export function gcd(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
}

// 1. Decimal multiply: p% = p ÷ 100 as a decimal; multiply p × n as whole numbers, then put the point back.
export function decimalMultiply(p: number, n: number): { decimal: string; whole: number; result: number } {
  return { decimal: fmt(p), whole: p * n, result: p * n };
}

// 2. As a fraction: p/100 in lowest terms, divide n by the bottom, multiply by the top.
export function asFraction(p: number, n: number): { g: number; num: number; den: number; divides: boolean; share: number; top: number; result: number } {
  const g = gcd(p, 100);
  const num = p / g;
  const den = 100 / g;
  const divides = n % den === 0;
  // share: n ÷ den when it divides evenly; top: num × n otherwise (then ÷ den).
  return { g, num, den, divides, share: divides ? n / den : 0, top: num * n, result: p * n };
}

// 3. Proportion: p/100 = ?/n, so 100 × ? = p × n.
export function proportion(p: number, n: number): { cross: number; result: number } {
  return { cross: p * n, result: p * n };
}

// 4. 10% building blocks: 10% = n ÷ 10, 5% = half of that, 1% = 10% ÷ 10; build p from them.
export interface Block {
  pct: number;
  count: number;
  /** One block's value in hundredths. */
  each: number;
}
export function buildingBlocks(p: number, n: number): { tens: Block; fives: Block; ones: Block; result: number } {
  const t = Math.floor(p / 10);
  const f = p % 10 >= 5 ? 1 : 0;
  const u = p % 10 - 5 * f;
  const tens = { pct: 10, count: t, each: 10 * n };
  const fives = { pct: 5, count: f, each: 5 * n };
  const ones = { pct: 1, count: u, each: n };
  const result = [tens, fives, ones].reduce((s, x) => s + x.count * x.each, 0);
  return { tens, fives, ones, result };
}

// 5. Swap: p% of n = n% of p (both are p × n ÷ 100). Work out n% of p from 10% of p, or 1% of p.
export function swap(p: number, n: number): { byTen: boolean; unit: number; times: number; result: number } {
  const byTen = n % 10 === 0;
  // unit: 10% (or 1%) of p, in hundredths; times: how many of those make n%.
  const unit = byTen ? 10 * p : p;
  const times = byTen ? n / 10 : n;
  return { byTen, unit, times, result: unit * times };
}

// 6. Hundred grid (unitary): 100 squares make n, so one square (1%) is n ÷ 100; shade p of them.
export function hundredGrid(p: number, n: number): { cell: number; result: number } {
  return { cell: n, result: p * n };
}

export const PERCENT_IDS = ['decimal', 'fraction', 'proportion', 'blocks', 'swap', 'grid'] as const;
export type PercentId = (typeof PERCENT_IDS)[number];

/** Every method's answer in hundredths. */
export function percentAll(p: number, n: number): Record<PercentId, number> {
  return {
    decimal: decimalMultiply(p, n).result,
    fraction: asFraction(p, n).result,
    proportion: proportion(p, n).cross,
    blocks: buildingBlocks(p, n).result,
    swap: swap(p, n).result,
    grid: hundredGrid(p, n).cell * p,
  };
}
