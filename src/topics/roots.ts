/**
 * Square roots, five ways: √n shown exactly when n is a perfect square, otherwise rounded to ROOTS.decimals.
 * Every function is pure and works in whole numbers where it can (hundredths as integers), so the methods agree exactly.
 */

/** Tunables for the roots topic. */
export const ROOTS = {
  /** Decimal places shown for an irrational root. */
  decimals: 2,
  /** Iteration cap for the Babylonian method (it converges in well under this for n ≤ 9999). */
  maxIterations: 12,
  /** The Babylonian method stops once a step moves x by less than this. */
  tolerance: 1e-9,
  /** Decimal places shown for a looked-up root in the prime-factor method. */
  lookupDecimals: 4,
};

/** 10^decimals: the answer is kept as a whole number of these units (hundredths). */
export const UNIT = 10 ** ROOTS.decimals;

export interface RootAnswer {
  /** True when n is a perfect square, so the root is a whole number. */
  exact: boolean;
  /** √n × UNIT, rounded to the nearest whole number (exactly √n × UNIT when exact). */
  scaled: number;
}

/** Largest whole a with a² ≤ m. */
export function isqrt(m: number): number {
  let a = Math.floor(Math.sqrt(m));
  while (a * a > m) a--;
  while ((a + 1) * (a + 1) <= m) a++;
  return a;
}

/** The true answer, by whole-number arithmetic: round(√n × UNIT). */
export function trueRoot(n: number): RootAnswer {
  const a = isqrt(n);
  if (a * a === n) return { exact: true, scaled: a * UNIT };
  return { exact: false, scaled: roundFromFloor(n, isqrt(n * UNIT * UNIT)) };
}

/**
 * Given f = floor(√n × UNIT), round to the nearest unit: round up when (f + ½)² ≤ n × UNIT².
 * (f + ½ can never equal √n × UNIT exactly, since (2f + 1)² is odd and 4n × UNIT² is even.)
 */
export function roundFromFloor(n: number, f: number): number {
  return roundsUp(n, f) ? f + 1 : f;
}
export function roundsUp(n: number, f: number): boolean {
  return (2 * f + 1) * (2 * f + 1) <= 4 * n * UNIT * UNIT;
}

/** Text for a scaled value: 1225 → "12.25". */
export function fmtScaled(scaled: number, decimals = ROOTS.decimals): string {
  const s = String(Math.abs(scaled)).padStart(decimals + 1, '0');
  return decimals ? `${s.slice(0, -decimals)}.${s.slice(-decimals)}` : s;
}

/** The answer as text: "12" or "12.25". */
export function fmtRoot(r: RootAnswer): string {
  return r.exact ? String(r.scaled / UNIT) : fmtScaled(r.scaled);
}

/** The problem line: "√144 = 12" or "√150 ≈ 12.25". */
export function rootLine(n: number): string {
  const r = trueRoot(n);
  return `√${n} ${r.exact ? '=' : '≈'} ${fmtRoot(r)}`;
}

/** Exact text for a square of a scaled value, e.g. 1225² → "150.0625", with "…" past 4 decimals. */
export function fmtSquare(scaled: number, decimals: number): string {
  const sq = scaled * scaled;
  const places = 2 * decimals;
  const s = String(sq).padStart(places + 1, '0');
  const whole = places ? s.slice(0, -places) : s;
  let frac = places ? s.slice(-places) : '';
  const cut = frac.length > 4;
  frac = frac.slice(0, 4).replace(/0+$/, '');
  return `${whole}${frac ? `.${frac}` : ''}${cut && /[1-9]/.test(s.slice(-places).slice(4)) ? '…' : ''}`;
}

// 1. Digit by digit: split n into pairs, and for each pair find the biggest x with (20p + x) × x ≤ what's left.
export interface DigitStep {
  /** The two digits brought down. */
  pair: number;
  /** What's left after bringing the pair down. */
  current: number;
  /** The root so far, before this digit. */
  p: number;
  x: number;
  /** (20p + x) × x */
  take: number;
  rem: number;
  /** True for the pairs after the decimal point. */
  decimal: boolean;
}
export function digitByDigit(n: number): RootAnswer & { pairs: number[]; steps: DigitStep[]; intDigits: number } {
  const pairs: number[] = [];
  for (let m = n; m > 0; m = Math.floor(m / 100)) pairs.unshift(m % 100);
  if (!pairs.length) pairs.push(0);
  const intDigits = pairs.length;
  const steps: DigitStep[] = [];
  let p = 0;
  let rem = 0;
  // One guard digit past the shown decimals, so the last shown digit can be rounded.
  const total = intDigits + ROOTS.decimals + 1;
  for (let i = 0; i < total; i++) {
    const decimal = i >= intDigits;
    if (decimal && rem === 0) break; // a perfect square: nothing left to find
    const pair = pairs[i] ?? 0;
    const current = rem * 100 + pair;
    let x = 9;
    while ((20 * p + x) * x > current) x--;
    const take = (20 * p + x) * x;
    rem = current - take;
    steps.push({ pair, current, p, x, take, rem, decimal });
    p = p * 10 + x;
  }
  const exact = steps.length === intDigits && rem === 0;
  if (exact) return { exact, scaled: p * UNIT, pairs, steps, intDigits };
  // p now holds floor(√n × 10^(decimals+1)): round off the guard digit.
  const guard = p % 10;
  const f = Math.floor(p / 10);
  return { exact, scaled: guard >= 5 ? f + 1 : f, pairs, steps, intDigits };
}

// 2. Babylonian (Newton): a rectangle of area n with sides x and n/x; average the sides to get a squarer one.
export interface BabyStep {
  x: number;
  other: number;
}
/** A first guess from the digit count: 2 × 10^k for an odd count, 6 × 10^k for an even one. */
export function firstGuess(n: number): number {
  const d = String(n).length;
  return d % 2 ? 2 * 10 ** ((d - 1) / 2) : 6 * 10 ** ((d - 2) / 2);
}
export function babylonian(n: number): RootAnswer & { steps: BabyStep[]; x: number } {
  let x = firstGuess(n);
  const steps: BabyStep[] = [{ x, other: n / x }];
  for (let i = 0; i < ROOTS.maxIterations; i++) {
    const next = (x + n / x) / 2;
    const moved = Math.abs(next - x);
    x = next;
    steps.push({ x, other: n / x });
    if (moved < ROOTS.tolerance) break;
  }
  const near = Math.round(x);
  const exact = near * near === n;
  return { exact, scaled: exact ? near * UNIT : Math.round(x * UNIT), steps, x };
}

// 3. Prime factors: pair up equal primes; each pair comes out of the root as one factor.
export function primeFactors(n: number): number[] {
  const out: number[] = [];
  let m = n;
  for (let p = 2; p * p <= m; p++) while (m % p === 0) {
    out.push(p);
    m /= p;
  }
  if (m > 1) out.push(m);
  return out;
}
export function factorRoot(n: number): RootAnswer & { factors: number[]; paired: number[]; outside: number; inside: number; lookup: number } {
  const factors = primeFactors(n);
  const paired: number[] = [];
  const single: number[] = [];
  for (let i = 0; i < factors.length; i++) {
    const f = factors[i] ?? 1;
    if (factors[i + 1] === f) {
      paired.push(f);
      i++;
    } else single.push(f);
  }
  const outside = paired.reduce((a, b) => a * b, 1);
  const inside = single.reduce((a, b) => a * b, 1);
  const lookup = Math.sqrt(inside);
  if (inside === 1) return { exact: true, scaled: outside * UNIT, factors, paired, outside, inside, lookup };
  return { exact: false, scaled: Math.round(outside * lookup * UNIT), factors, paired, outside, inside, lookup };
}

// 4. Estimate and refine: interpolate between the squares either side, then try squares a tenth and a hundredth up.
export interface Trial {
  /** The value tried, in UNITs. */
  value: number;
  ok: boolean;
  /** 'tenth' or 'unit' (hundredth) step. */
  size: number;
}
export function estimateRefine(n: number): RootAnswer & { a: number; estimate: number; trials: Trial[]; floor: number; up: boolean } {
  const a = isqrt(n);
  const N = n * UNIT * UNIT;
  if (a * a === n) return { exact: true, scaled: a * UNIT, a, estimate: a * UNIT, trials: [], floor: a * UNIT, up: false };
  // Straight-line estimate between a² and (a+1)²: a + (n − a²) / (2a + 1), cut to whole UNITs. It is never too big.
  const estimate = a * UNIT + Math.floor(((n - a * a) * UNIT) / (2 * a + 1));
  const trials: Trial[] = [];
  const tenth = UNIT / 10;
  let f = estimate - (estimate % tenth);
  for (;;) {
    const v = f + tenth;
    const ok = v * v <= N;
    trials.push({ value: v, ok, size: tenth });
    if (!ok) break;
    f = v;
  }
  f = Math.max(f, estimate);
  for (;;) {
    const v = f + 1;
    const ok = v * v <= N;
    trials.push({ value: v, ok, size: 1 });
    if (!ok) break;
    f = v;
  }
  const up = roundsUp(n, f);
  return { exact: false, scaled: up ? f + 1 : f, a, estimate, trials, floor: f, up };
}

// 5. Binary search: keep a bracket lo ≤ √n < hi in hundredths and halve it until it is one hundredth wide.
export interface Halving {
  lo: number;
  hi: number;
  mid: number;
  ok: boolean;
}
export function binarySearch(n: number): RootAnswer & { a: number; halvings: Halving[]; floor: number; up: boolean } {
  const a = isqrt(n);
  if (a * a === n) return { exact: true, scaled: a * UNIT, a, halvings: [], floor: a * UNIT, up: false };
  const N = n * UNIT * UNIT;
  let lo = a * UNIT;
  let hi = (a + 1) * UNIT;
  const halvings: Halving[] = [];
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    const ok = mid * mid <= N;
    halvings.push({ lo, hi, mid, ok });
    if (ok) lo = mid;
    else hi = mid;
  }
  const up = roundsUp(n, lo);
  return { exact: false, scaled: up ? lo + 1 : lo, a, halvings, floor: lo, up };
}

export const ROOT_IDS = ['digits', 'babylonian', 'factors', 'estimate', 'binary'] as const;
export type RootId = (typeof ROOT_IDS)[number];

/** Every method's answer, for the tests. */
export function rootAll(n: number): Record<RootId, RootAnswer> {
  const pick = (r: RootAnswer): RootAnswer => ({ exact: r.exact, scaled: r.scaled });
  return {
    digits: pick(digitByDigit(n)),
    babylonian: pick(babylonian(n)),
    factors: pick(factorRoot(n)),
    estimate: pick(estimateRefine(n)),
    binary: pick(binarySearch(n)),
  };
}
