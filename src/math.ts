/**
 * Multiplication, six ways. Every function is pure: same inputs, same output, no clock or randomness.
 * The client draws these; the tests check each one lands on a × b.
 */

/** Digits of n, most significant first. 0 → [0]. */
export function digits(n: number): number[] {
  return String(Math.abs(Math.trunc(n))).split('').map(Number);
}

/** Place-value parts of n, largest first, zeros dropped: 347 → [300, 40, 7]. */
export function parts(n: number): number[] {
  const d = digits(n);
  const out = d.map((v, i) => v * 10 ** (d.length - 1 - i)).filter((v) => v !== 0);
  return out.length ? out : [0];
}

/** Add place-value column sums (index 0 = ones) with carries. Returns each column's sum, carry-in, and digit. */
export interface Column {
  place: number;
  sum: number;
  carryIn: number;
  digit: number;
  carryOut: number;
}
export function carryColumns(sums: number[]): { columns: Column[]; result: number } {
  const columns: Column[] = [];
  let carry = 0;
  let place = 0;
  while (place < sums.length || carry > 0) {
    const sum = sums[place] ?? 0;
    const total = sum + carry;
    columns.push({ place, sum, carryIn: carry, digit: total % 10, carryOut: Math.floor(total / 10) });
    carry = Math.floor(total / 10);
    place++;
  }
  const result = Number(columns.map((c) => c.digit).reverse().join('')) || 0;
  return { columns, result };
}

// 1. Standard long multiplication: one partial row per digit of b (ones first).
export interface StandardRow {
  digit: number;
  shift: number;
  value: number;
}
export function standard(a: number, b: number): { rows: StandardRow[]; result: number } {
  const bd = digits(b).reverse();
  const rows = bd.map((digit, shift) => ({ digit, shift, value: a * digit * 10 ** shift }));
  return { rows, result: rows.reduce((s, r) => s + r.value, 0) };
}

// 2. Lattice: a's digits across the top, b's down the right; each cell splits its product into tens / ones,
//    then the diagonals are summed from the bottom right with carries.
export interface LatticeCell {
  row: number;
  col: number;
  tens: number;
  ones: number;
  /** Diagonal index (0 = bottom right) of the ones half; the tens half sits on diagonal + 1. */
  diag: number;
}
export function lattice(a: number, b: number): { top: number[]; side: number[]; cells: LatticeCell[]; columns: Column[]; result: number } {
  const top = digits(a);
  const side = digits(b);
  const cells: LatticeCell[] = [];
  const sums = new Array<number>(top.length + side.length).fill(0);
  side.forEach((bv, row) =>
    top.forEach((av, col) => {
      const p = av * bv;
      const diag = top.length - 1 - col + (side.length - 1 - row);
      const cell = { row, col, tens: Math.floor(p / 10), ones: p % 10, diag };
      cells.push(cell);
      sums[diag] = (sums[diag] ?? 0) + cell.ones;
      sums[diag + 1] = (sums[diag + 1] ?? 0) + cell.tens;
    }),
  );
  while (sums.length > 1 && sums[sums.length - 1] === 0) sums.pop();
  const { columns, result } = carryColumns(sums);
  return { top, side, cells, columns, result };
}

// 3. Area / box: split both numbers into place-value parts; each rectangle is one part times another.
export interface Box {
  row: number;
  col: number;
  a: number;
  b: number;
  value: number;
}
export function area(a: number, b: number): { top: number[]; side: number[]; boxes: Box[]; result: number } {
  const top = parts(a);
  const side = parts(b);
  const boxes = side.flatMap((bv, row) => top.map((av, col) => ({ row, col, a: av, b: bv, value: av * bv })));
  return { top, side, boxes, result: boxes.reduce((s, x) => s + x.value, 0) };
}

// 4. Partial products: the same pieces as the box, written as a list and added down.
export function partialProducts(a: number, b: number): { lines: Box[]; result: number } {
  const { boxes, result } = area(a, b);
  return { lines: boxes, result };
}

// 5. Russian peasant (halve and double): halve a (dropping remainders), double b; add b where a is odd.
export interface PeasantRow {
  half: number;
  double: number;
  keep: boolean;
}
export function peasant(a: number, b: number): { rows: PeasantRow[]; result: number } {
  const rows: PeasantRow[] = [];
  for (let h = a, d = b; h >= 1; h = Math.floor(h / 2), d *= 2) rows.push({ half: h, double: d, keep: h % 2 === 1 });
  return { rows, result: rows.filter((r) => r.keep).reduce((s, r) => s + r.double, 0) };
}

// 6. Line (stick) method: each digit is a bundle of parallel lines; crossings are counted per place group.
export interface Crossing {
  aIndex: number;
  bIndex: number;
  count: number;
  place: number;
}
export function lines(a: number, b: number): { aDigits: number[]; bDigits: number[]; crossings: Crossing[]; columns: Column[]; result: number } {
  const aDigits = digits(a);
  const bDigits = digits(b);
  const crossings: Crossing[] = [];
  const sums = new Array<number>(aDigits.length + bDigits.length - 1).fill(0);
  aDigits.forEach((av, i) =>
    bDigits.forEach((bv, j) => {
      const place = aDigits.length - 1 - i + (bDigits.length - 1 - j);
      crossings.push({ aIndex: i, bIndex: j, count: av * bv, place });
      sums[place] = (sums[place] ?? 0) + av * bv;
    }),
  );
  const { columns, result } = carryColumns(sums);
  return { aDigits, bDigits, crossings, columns, result };
}

export const METHOD_IDS = ['standard', 'lattice', 'area', 'partial', 'peasant', 'lines'] as const;
export type MethodId = (typeof METHOD_IDS)[number];

/** Each method's answer, so a test can check all six agree. */
export function solveAll(a: number, b: number): Record<MethodId, number> {
  return {
    standard: standard(a, b).result,
    lattice: lattice(a, b).result,
    area: area(a, b).result,
    partial: partialProducts(a, b).result,
    peasant: peasant(a, b).result,
    lines: lines(a, b).result,
  };
}
