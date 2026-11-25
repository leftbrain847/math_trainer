/**
 * Squaring, five ways: n² for a whole number n. Every function is pure; test/squares.test.ts checks each one lands on n × n.
 */

/** Bases the "near a base" method can lean on, smallest first. */
export const BASES = [10, 50, 100];

// 1. (a+b)² expansion: split n into tens and ones, n² = a² + 2ab + b².
export function expansion(n: number): { a: number; b: number; aa: number; ab2: number; bb: number; result: number } {
  const b = n % 10;
  const a = n - b;
  const aa = a * a;
  const ab2 = 2 * a * b;
  const bb = b * b;
  return { a, b, aa, ab2, bb, result: aa + ab2 + bb };
}

// 2. Ends in 5: m5² = m × (m+1) hundreds + 25. For other n, step from the nearest such square: n² = m² − (m − n)(m + n).
export function endsIn5(n: number): { m: number; tens: number; head: number; mm: number; gap: number; sum: number; adjust: number; result: number } {
  const up = Math.floor(n / 10) * 10 + 5;
  const down = up - 10;
  const m = n % 10 === 5 ? n : down >= 5 && n - down <= up - n ? down : up;
  const tens = (m - 5) / 10;
  const head = tens * (tens + 1);
  const mm = head * 100 + 25;
  const gap = m - n;
  const sum = m + n;
  const adjust = gap * sum;
  return { m, tens, head, mm, gap, sum, adjust, result: mm - adjust };
}

// 3. Near a base: with d = n − B, n² = (n + d) × B + d².
export function nearBase(n: number): { base: number; d: number; hi: number; part: number; dd: number; result: number } {
  let base = BASES[0] ?? 10;
  for (const B of BASES) if (Math.abs(n - B) <= Math.abs(n - base)) base = B;
  const d = n - base;
  const hi = n + d;
  const part = hi * base;
  const dd = d * d;
  return { base, d, hi, part, dd, result: part + dd };
}

// 4. Difference of squares: n² − d² = (n − d)(n + d), with d the distance to the nearest ten.
export function diffSquares(n: number): { round: number; d: number; lo: number; hi: number; prod: number; dd: number; result: number } {
  const round = Math.round(n / 10) * 10;
  const d = Math.abs(n - round);
  const lo = n - d;
  const hi = n + d;
  const prod = lo * hi;
  const dd = d * d;
  return { round, d, lo, hi, prod, dd, result: prod + dd };
}

// 5. Area picture: an n-by-n square cut into a², two a×b strips and b².
export function areaPicture(n: number): { a: number; b: number; pieces: number[]; result: number } {
  const { a, b, aa, bb } = expansion(n);
  const pieces = [aa, a * b, a * b, bb];
  return { a, b, pieces, result: pieces.reduce((s, x) => s + x, 0) };
}

export const SQUARE_IDS = ['expansion', 'five', 'base', 'difference', 'area'] as const;
export type SquareId = (typeof SQUARE_IDS)[number];

export function squareAll(n: number): Record<SquareId, number> {
  return {
    expansion: expansion(n).result,
    five: endsIn5(n).result,
    base: nearBase(n).result,
    difference: diffSquares(n).result,
    area: areaPicture(n).result,
  };
}
