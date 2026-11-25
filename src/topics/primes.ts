/**
 * Is n prime? Five ways. Every function is pure and returns its working plus the verdict.
 * The tests check every method agrees with a brute-force check over the whole slider range.
 */
import { digits } from '../math';

/** The primes the checks try, in order. Enough for every n below 13² = 169. */
export const SMALL_PRIMES = [2, 3, 5, 7, 11];
/** Fixed Fermat bases: no randomness. Base 2 alone has no liar below 341, so for n < 341 the verdict is exact. */
export const FERMAT_BASES = [2, 3, 5];

export function modPow(base: number, exp: number, mod: number): number {
  let result = 1 % mod;
  let b = base % mod;
  let e = exp;
  while (e > 0) {
    if (e % 2 === 1) result = (result * b) % mod;
    b = (b * b) % mod;
    e = Math.floor(e / 2);
  }
  return result;
}

/** The primes p with p² ≤ n: the only ones a factor check needs. */
const checkPrimes = (n: number): number[] => SMALL_PRIMES.filter((p) => p * p <= n);

// 1. Trial division: divide by each prime up to √n. A remainder of 0 means a factor; none means prime.
export interface Trial {
  p: number;
  q: number;
  r: number;
}
export function trialDivision(n: number): { tries: Trial[]; divisor: number | null; prime: boolean } {
  const tries: Trial[] = [];
  for (const p of checkPrimes(n)) {
    tries.push({ p, q: Math.floor(n / p), r: n % p });
    if (n % p === 0) return { tries, divisor: p, prime: false };
  }
  return { tries, divisor: null, prime: n >= 2 };
}

// 2. Sieve of Eratosthenes: cross out 1, then the multiples of each prime from p² up. What survives is prime.
export interface SieveStep {
  p: number;
  /** The numbers ≤ n this prime crosses out that no earlier prime did. */
  crossed: number[];
}
export function sieve(n: number): { steps: SieveStep[]; prime: boolean; crossedBy: number | null } {
  const out = new Set<number>([1]);
  const steps: SieveStep[] = [];
  for (let p = 2; p * p <= n; p++) {
    if (out.has(p)) continue;
    const crossed: number[] = [];
    for (let m = p * p; m <= n; m += p) {
      if (!out.has(m)) {
        out.add(m);
        crossed.push(m);
      }
    }
    steps.push({ p, crossed });
    if (out.has(n)) return { steps, prime: false, crossedBy: p };
  }
  return { steps, prime: !out.has(n), crossedBy: null };
}

// 3. Fermat test: if n is prime then aⁿ⁻¹ leaves remainder 1 (mod n) for every base a. One failure proves composite.
export interface FermatTry {
  a: number;
  r: number;
}
export function fermat(n: number, bases: number[] = FERMAT_BASES): { tries: FermatTry[]; prime: boolean } {
  const tries: FermatTry[] = [];
  for (const a of bases.filter((x) => x < n)) {
    const r = modPow(a, n - 1, n);
    tries.push({ a, r });
    if (r !== 1) return { tries, prime: false };
  }
  return { tries, prime: n >= 2 };
}

// 4. Divisibility rules: test 2, 3, 5, 7, 11 by looking at the digits instead of dividing.
export interface RuleCheck {
  p: number;
  /** The number the rule looks at: last digit (2, 5), digit sum (3), rest − 2 × last (7), alternating sum (11). */
  value: number;
  divides: boolean;
}
export function ruleValue(n: number, p: number): number {
  const ds = digits(n);
  const last = ds[ds.length - 1] ?? 0;
  if (p === 2 || p === 5) return last;
  if (p === 3) return ds.reduce((s, x) => s + x, 0);
  if (p === 7) return Math.floor(n / 10) - 2 * last;
  if (p === 11) return ds.reverse().reduce((s, x, k) => s + (k % 2 ? -x : x), 0);
  return n;
}
const ruleSays = (p: number, v: number): boolean => (p === 2 ? v % 2 === 0 : p === 5 ? v === 0 || v === 5 : v % p === 0);
export function divisibilityRules(n: number): { checks: RuleCheck[]; prime: boolean } {
  const checks: RuleCheck[] = [];
  for (const p of checkPrimes(n)) {
    const value = ruleValue(n, p);
    const divides = ruleSays(p, value);
    checks.push({ p, value, divides });
    if (divides) return { checks, prime: false };
  }
  return { checks, prime: n >= 2 };
}

// 5. Wilson's theorem: n is prime exactly when (n − 1)! leaves remainder n − 1. Multiply in blocks, keeping remainders.
export interface WilsonBlock {
  from: number;
  to: number;
  /** (to)! mod n. */
  r: number;
}
export const WILSON = { maxBlocks: 7 };
export function wilson(n: number, maxBlocks = WILSON.maxBlocks): { blocks: WilsonBlock[]; r: number; prime: boolean } {
  const top = n - 1;
  const size = Math.max(1, Math.ceil(top / maxBlocks));
  const blocks: WilsonBlock[] = [];
  let r = 1 % n;
  for (let from = 1; from <= top; from += size) {
    const to = Math.min(top, from + size - 1);
    for (let k = from; k <= to; k++) r = (r * k) % n;
    blocks.push({ from, to, r });
    if (r === 0) break;
  }
  return { blocks, r, prime: n >= 2 && r === top % n };
}

export const PRIME_IDS = ['trial', 'sieve', 'fermat', 'rules', 'wilson'] as const;
export type PrimeId = (typeof PRIME_IDS)[number];

export function verdicts(n: number): Record<PrimeId, boolean> {
  return {
    trial: trialDivision(n).prime,
    sieve: sieve(n).prime,
    fermat: fermat(n).prime,
    rules: divisibilityRules(n).prime,
    wilson: wilson(n).prime,
  };
}
