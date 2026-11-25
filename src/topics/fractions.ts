/**
 * Adding fractions a/b + c/d, five ways. Every function is pure and returns its working plus the answer
 * in lowest terms. The client draws these; the tests check each one against the exact sum.
 */
import { gcdOf } from './gcd';

export interface Frac {
  n: number;
  d: number;
}

export const lcmOf = (x: number, y: number): number => (x / gcdOf(x, y)) * y;

/** Divide top and bottom by their gcd. */
export function simplify(n: number, d: number): Frac & { g: number } {
  const g = gcdOf(n, d) || 1;
  return { n: n / g, d: d / g, g };
}

/** The working shared by the methods that bring both fractions over one denominator, then add and simplify. */
export interface OverOne {
  den: number;
  /** a/b and c/d rewritten over `den`. */
  an: number;
  cn: number;
  sum: number;
  answer: Frac & { g: number };
}

// 1. Common denominator: multiply the denominators, so a/b = ad/bd and c/d = cb/bd.
export function commonDenominator(a: number, b: number, c: number, d: number): OverOne {
  const den = b * d;
  const an = a * d;
  const cn = c * b;
  return { den, an, cn, sum: an + cn, answer: simplify(an + cn, den) };
}

// 2. Lowest common denominator: count up the multiples of the bigger denominator until the smaller one divides it.
export function lowestCommon(a: number, b: number, c: number, d: number): OverOne & { multiples: number[]; ka: number; kc: number } {
  const big = Math.max(b, d);
  const small = Math.min(b, d);
  const multiples: number[] = [];
  for (let m = big; ; m += big) {
    multiples.push(m);
    if (m % small === 0) break;
  }
  const den = multiples[multiples.length - 1] ?? big;
  const ka = den / b;
  const kc = den / d;
  return { den, an: a * ka, cn: c * kc, sum: a * ka + c * kc, answer: simplify(a * ka + c * kc, den), multiples, ka, kc };
}

// 3. Butterfly: the wings are a × d and c × b (the new top), the body b × d is the new bottom.
export function butterfly(a: number, b: number, c: number, d: number): { left: number; right: number; top: number; bottom: number; answer: Frac & { g: number } } {
  const left = a * d;
  const right = c * b;
  return { left, right, top: left + right, bottom: b * d, answer: simplify(left + right, b * d) };
}

// 4. Area model: a/b is a columns of b, c/d is c rows of d; cutting both ways turns every whole into b × d cells.
export function areaModel(a: number, b: number, c: number, d: number): {
  cols: number;
  rows: number;
  cellsA: number;
  cellsC: number;
  wholesA: number;
  wholesC: number;
  wholesSum: number;
  answer: Frac & { g: number };
} {
  const cells = b * d;
  const cellsA = a * d;
  const cellsC = c * b;
  const wholes = (k: number) => Math.max(1, Math.ceil(k / cells));
  return { cols: b, rows: d, cellsA, cellsC, wholesA: wholes(cellsA), wholesC: wholes(cellsC), wholesSum: wholes(cellsA + cellsC), answer: simplify(cellsA + cellsC, cells) };
}

// 5. Number line: jump a/b from 0, then c/d more; measured in steps of 1/L (L = lowest common denominator) you land on the sum.
export function numberLine(a: number, b: number, c: number, d: number): { L: number; first: number; second: number; landing: number; wholes: number; answer: Frac & { g: number } } {
  const L = lcmOf(b, d);
  const first = (a * L) / b;
  const second = (c * L) / d;
  const landing = first + second;
  return { L, first, second, landing, wholes: Math.max(1, Math.ceil(landing / L)), answer: simplify(landing, L) };
}

export const FRACTION_IDS = ['common', 'lowest', 'butterfly', 'area', 'line'] as const;
export type FractionId = (typeof FRACTION_IDS)[number];

export function addAll(a: number, b: number, c: number, d: number): Record<FractionId, Frac> {
  const pick = ({ n, d: den }: Frac): Frac => ({ n, d: den });
  return {
    common: pick(commonDenominator(a, b, c, d).answer),
    lowest: pick(lowestCommon(a, b, c, d).answer),
    butterfly: pick(butterfly(a, b, c, d).answer),
    area: pick(areaModel(a, b, c, d).answer),
    line: pick(numberLine(a, b, c, d).answer),
  };
}

/** a/b as text, whole numbers without a denominator. */
export const fracText = (f: Frac): string => (f.d === 1 ? String(f.n) : `${f.n}/${f.d}`);
