/**
 * Greatest common divisor, six ways. Every function is pure and returns its working plus the answer.
 * The client draws these; the tests check each one against a brute-force gcd.
 */

/** Euclid's remainder loop: the plain gcd every other method is checked against in the tests. */
export function gcdOf(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x;
}

/** Prime factors of n, smallest first, with repeats: 84 → [2, 2, 3, 7]. 1 has none. */
export function primeFactors(n: number): number[] {
  const out: number[] = [];
  let m = n;
  for (let p = 2; p * p <= m; p++) {
    while (m % p === 0) {
      out.push(p);
      m /= p;
    }
  }
  if (m > 1) out.push(m);
  return out;
}

/** Every factor of n, smallest first. */
export function factorsOf(n: number): number[] {
  const out: number[] = [];
  for (let k = 1; k <= n; k++) if (n % k === 0) out.push(k);
  return out;
}

// 1. Euclid: a = q × b + r, then repeat with (b, r) until the remainder is 0. The last divisor is the gcd.
export interface EuclidRow {
  a: number;
  b: number;
  q: number;
  r: number;
}
export function euclid(a: number, b: number): { rows: EuclidRow[]; gcd: number } {
  let x = Math.max(a, b);
  let y = Math.min(a, b);
  const rows: EuclidRow[] = [];
  while (y > 0) {
    const row = { a: x, b: y, q: Math.floor(x / y), r: x % y };
    rows.push(row);
    [x, y] = [y, row.r];
  }
  return { rows, gcd: x };
}

// 2. Cut squares: from an a × b rectangle cut the biggest squares you can; the last square's side is the gcd.
export interface SquareCut {
  /** The rectangle before this cut (w ≥ h). */
  w: number;
  h: number;
  /** How many h × h squares are cut off. */
  count: number;
}
export function cutSquares(a: number, b: number): { cuts: SquareCut[]; gcd: number } {
  let w = Math.max(a, b);
  let h = Math.min(a, b);
  const cuts: SquareCut[] = [];
  while (h > 0) {
    const count = Math.floor(w / h);
    cuts.push({ w, h, count });
    [w, h] = [h, w - count * h];
  }
  return { cuts, gcd: w };
}

// 3. Prime factors: line up both factorisations by prime; the primes they share multiply to the gcd.
export interface PrimeColumn {
  p: number;
  inA: boolean;
  inB: boolean;
}
export function sharedPrimes(a: number, b: number): { fa: number[]; fb: number[]; columns: PrimeColumn[]; shared: number[]; gcd: number } {
  const fa = primeFactors(a);
  const fb = primeFactors(b);
  const ps = [...new Set([...fa, ...fb])].sort((x, y) => x - y);
  const count = (xs: number[], p: number) => xs.filter((x) => x === p).length;
  const columns: PrimeColumn[] = [];
  for (const p of ps) {
    const ea = count(fa, p);
    const eb = count(fb, p);
    for (let k = 0; k < Math.max(ea, eb); k++) columns.push({ p, inA: k < ea, inB: k < eb });
  }
  const shared = columns.filter((c) => c.inA && c.inB).map((c) => c.p);
  return { fa, fb, columns, shared, gcd: shared.reduce((s, p) => s * p, 1) };
}

// 4. List the factors: write out every factor of each number; the biggest one on both lists is the gcd.
export function listFactors(a: number, b: number): { fa: number[]; fb: number[]; common: number[]; gcd: number } {
  const fa = factorsOf(a);
  const fb = factorsOf(b);
  const common = fa.filter((x) => fb.includes(x));
  return { fa, fb, common, gcd: Math.max(...common) };
}

// 5. Binary (Stein): only halving and subtracting. Pull out shared 2s, then subtract the smaller odd from the larger.
export interface BinaryRow {
  a: number;
  b: number;
  /** What was done to reach this pair. */
  note: 'start' | 'both even' | 'halve' | 'subtract';
}
export function binaryGcd(a: number, b: number): { rows: BinaryRow[]; twos: number; gcd: number } {
  let x = a;
  let y = b;
  const rows: BinaryRow[] = [{ a: x, b: y, note: 'start' }];
  let twos = 0;
  while (x % 2 === 0 && y % 2 === 0) {
    x /= 2;
    y /= 2;
    twos++;
  }
  if (twos) rows.push({ a: x, b: y, note: 'both even' });
  const odd = (v: number) => {
    let m = v;
    while (m > 0 && m % 2 === 0) m /= 2;
    return m;
  };
  if (x % 2 === 0 || y % 2 === 0) {
    x = odd(x);
    y = odd(y);
    rows.push({ a: x, b: y, note: 'halve' });
  }
  while (x !== y) {
    if (x > y) x = odd(x - y);
    else y = odd(y - x);
    rows.push({ a: x, b: y, note: 'subtract' });
  }
  return { rows, twos, gcd: x * 2 ** twos };
}

// 6. Ladder (cake): divide both numbers by a prime that goes into both, again and again; multiply the divisors.
export interface LadderRung {
  p: number;
  a: number;
  b: number;
}
export function ladder(a: number, b: number): { rungs: LadderRung[]; gcd: number } {
  let x = a;
  let y = b;
  const rungs: LadderRung[] = [];
  for (let p = 2; p <= Math.min(x, y); ) {
    if (x % p === 0 && y % p === 0) {
      x /= p;
      y /= p;
      rungs.push({ p, a: x, b: y });
    } else p++;
  }
  return { rungs, gcd: rungs.reduce((s, r) => s * r.p, 1) };
}

export const GCD_IDS = ['euclid', 'squares', 'primes', 'list', 'binary', 'ladder'] as const;
export type GcdId = (typeof GCD_IDS)[number];

export function gcdAll(a: number, b: number): Record<GcdId, number> {
  return {
    euclid: euclid(a, b).gcd,
    squares: cutSquares(a, b).gcd,
    primes: sharedPrimes(a, b).gcd,
    list: listFactors(a, b).gcd,
    binary: binaryGcd(a, b).gcd,
    ladder: ladder(a, b).gcd,
  };
}
