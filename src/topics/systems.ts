/**
 * Two linear equations, six ways. The sliders pick the solution (x, y); the equations a·x + b·y = c use the
 * fixed coefficients in SYSTEM, with c worked out from (x, y). Every method then recovers x and y from a, b, c alone.
 * Everything stays in whole numbers: SYSTEM's determinant divides each step exactly.
 */

export interface Equation {
  a: number;
  b: number;
  c: number;
}

/**
 * The fixed coefficients. Defaults: x + 2y = c₁ and 3x − y = c₂ (determinant −7). The drawings assume
 * eq1.a = 1 (so substitution starts from x = c₁ − 2y without fractions) and both b ≠ 0 (so both lines graph as y = …).
 */
export const SYSTEM = {
  eq1: { a: 1, b: 2 },
  eq2: { a: 3, b: -1 },
  /** Slider range for x and y. */
  min: -9,
  max: 9,
  /** The graph shows −axis … axis on both axes. */
  axis: 10,
};

export interface Solution {
  x: number;
  y: number;
}

/** The two equations whose solution is (x, y). */
export function buildSystem(x: number, y: number): [Equation, Equation] {
  const { eq1, eq2 } = SYSTEM;
  return [
    { a: eq1.a, b: eq1.b, c: eq1.a * x + eq1.b * y },
    { a: eq2.a, b: eq2.b, c: eq2.a * x + eq2.b * y },
  ];
}

const minus = (v: number): string => (v < 0 ? `−${-v}` : String(v));
/** Turns −0 into 0 (a division can give −0). */
const z = (v: number): number => v + 0;
/** A signed number for text: −3 with a real minus sign. */
export const num = minus;
/** "3x", "−x", "x", "" (for 0) */
function term(k: number, v: string): string {
  if (k === 0) return '';
  if (k === 1) return v;
  if (k === -1) return `−${v}`;
  return `${minus(k)}${v}`;
}
/** "x + 2y = 8", "3x − y = 3". */
export function fmtEq(e: Equation, vx = 'x', vy = 'y'): string {
  const left = term(e.a, vx);
  const right = term(Math.abs(e.b), vy);
  const lhs = !left ? term(e.b, vy) : e.b === 0 ? left : `${left} ${e.b < 0 ? '−' : '+'} ${right}`;
  return `${lhs || '0'} = ${minus(e.c)}`;
}

// 1. Substitution: x = (c₁ − b₁y)/a₁ from the first equation, put it into the second, solve for y, then x.
export function substitution([e1, e2]: [Equation, Equation]): Solution & { coefY: number; rhs: number } {
  // a₂(c₁ − b₁y)/a₁ + b₂y = c₂, times a₁: (a₁b₂ − a₂b₁)y = a₁c₂ − a₂c₁
  const coefY = e1.a * e2.b - e2.a * e1.b;
  const rhs = e1.a * e2.c - e2.a * e1.c;
  const y = rhs / coefY;
  return { coefY, rhs, y: z(y), x: z((e1.c - e1.b * y) / e1.a) };
}

// 2. Elimination: scale both equations so the y terms cancel when added (or subtracted), solve for x, then y.
export function elimination([e1, e2]: [Equation, Equation]): Solution & { m1: number; m2: number; s1: Equation; s2: Equation; add: boolean; sum: Equation } {
  const m1 = Math.abs(e2.b);
  const m2 = Math.abs(e1.b);
  const s1 = { a: e1.a * m1, b: e1.b * m1, c: e1.c * m1 };
  const s2 = { a: e2.a * m2, b: e2.b * m2, c: e2.c * m2 };
  const add = s1.b === -s2.b;
  const sum = add ? { a: s1.a + s2.a, b: 0, c: s1.c + s2.c } : { a: s1.a - s2.a, b: 0, c: s1.c - s2.c };
  const x = z(sum.c / sum.a);
  return { m1, m2, s1, s2, add, sum, x, y: z((e1.c - e1.a * x) / e1.b) };
}

// 3. Graphing: each equation is a line y = mx + k; the solution is where they cross.
export interface Line {
  m: number;
  k: number;
}
export function asLine(e: Equation): Line {
  return { m: -e.a / e.b, k: e.c / e.b };
}
export function graphing([e1, e2]: [Equation, Equation]): Solution & { l1: Line; l2: Line } {
  const l1 = asLine(e1);
  const l2 = asLine(e2);
  // m₁x + k₁ = m₂x + k₂. Solve exactly from the integer form to dodge float drift: (a₁b₂ − a₂b₁)x = c₁b₂ − c₂b₁.
  const x = z((e1.c * e2.b - e2.c * e1.b) / (e1.a * e2.b - e2.a * e1.b));
  return { l1, l2, x, y: z((e1.c - e1.a * x) / e1.b) };
}
/** The part of a·x + b·y = c inside the square −r…r, as two end points (or null if it misses). */
export function clipLine(e: Equation, r: number): [[number, number], [number, number]] | null {
  const pts: [number, number][] = [];
  const push = (x: number, y: number) => {
    if (Math.abs(x) <= r + 1e-9 && Math.abs(y) <= r + 1e-9 && !pts.some((p) => Math.abs(p[0] - x) < 1e-9 && Math.abs(p[1] - y) < 1e-9)) pts.push([x, y]);
  };
  for (const s of [-r, r]) {
    if (e.b !== 0) push(s, (e.c - e.a * s) / e.b);
    if (e.a !== 0) push((e.c - e.b * s) / e.a, s);
  }
  const [p, q] = pts;
  return p && q ? [p, q] : null;
}

// 4. Cramer's rule: x = Dx / D and y = Dy / D, each a 2 × 2 determinant.
export function cramer([e1, e2]: [Equation, Equation]): Solution & { D: number; Dx: number; Dy: number } {
  const D = e1.a * e2.b - e2.a * e1.b;
  const Dx = e1.c * e2.b - e2.c * e1.b;
  const Dy = e1.a * e2.c - e2.a * e1.c;
  return { D, Dx, Dy, x: z(Dx / D), y: z(Dy / D) };
}

// 5. Gaussian elimination on the augmented matrix [a b | c], with whole-number row operations.
export type Row = [number, number, number];
export interface RowOp {
  /** What was done, e.g. "R2 − 3R1". */
  label: string;
  rows: [Row, Row];
  /** Which row changed (0 or 1). */
  changed: number;
}
export function gaussian([e1, e2]: [Equation, Equation]): Solution & { start: [Row, Row]; ops: RowOp[] } {
  let r1: Row = [e1.a, e1.b, e1.c];
  let r2: Row = [e2.a, e2.b, e2.c];
  const start: [Row, Row] = [r1, r2];
  const ops: RowOp[] = [];
  // Clear x from row 2: a₁R2 − a₂R1.
  const k = r2[0];
  const s = r1[0];
  r2 = [s * r2[0] - k * r1[0], s * r2[1] - k * r1[1], s * r2[2] - k * r1[2]];
  ops.push({ label: `${s === 1 ? '' : s}R2 ${k < 0 ? '+' : '−'} ${Math.abs(k) === 1 ? '' : Math.abs(k)}R1`, rows: [r1, r2], changed: 1 });
  // Make the y pivot 1.
  const p = r2[1];
  r2 = [z(r2[0] / p), z(r2[1] / p), z(r2[2] / p)];
  ops.push({ label: `R2 ÷ ${p < 0 ? `(${minus(p)})` : p}`, rows: [r1, r2], changed: 1 });
  // Clear y from row 1.
  const b = r1[1];
  r1 = [r1[0] - b * r2[0], r1[1] - b * r2[1], r1[2] - b * r2[2]];
  ops.push({ label: `R1 ${b < 0 ? '+' : '−'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}R2`, rows: [r1, r2], changed: 0 });
  if (r1[0] !== 1) {
    const q = r1[0];
    r1 = [1, z(r1[1] / q), z(r1[2] / q)];
    ops.push({ label: `R1 ÷ ${q < 0 ? `(${minus(q)})` : q}`, rows: [r1, r2], changed: 0 });
  }
  return { start, ops, x: z(r1[2]), y: z(r2[2]) };
}

// 6. Equating: write both equations as y = …, set the two right-hand sides equal and solve for x.
export function equating([e1, e2]: [Equation, Equation]): Solution & { l1: Line; l2: Line; coefX: number; rhs: number } {
  // (c₁ − a₁x)/b₁ = (c₂ − a₂x)/b₂; cross-multiply: b₂(c₁ − a₁x) = b₁(c₂ − a₂x) → (b₁a₂ − b₂a₁)x = b₁c₂ − b₂c₁
  const coefX = e1.b * e2.a - e2.b * e1.a;
  const rhs = e1.b * e2.c - e2.b * e1.c;
  const x = z(rhs / coefX);
  return { l1: asLine(e1), l2: asLine(e2), coefX, rhs, x, y: z((e1.c - e1.a * x) / e1.b) };
}

export const SYSTEM_IDS = ['substitution', 'elimination', 'graphing', 'cramer', 'gaussian', 'equating'] as const;
export type SystemId = (typeof SYSTEM_IDS)[number];

export function solveAll(x: number, y: number): Record<SystemId, Solution> {
  const sys = buildSystem(x, y);
  const pick = (s: Solution): Solution => ({ x: s.x, y: s.y });
  return {
    substitution: pick(substitution(sys)),
    elimination: pick(elimination(sys)),
    graphing: pick(graphing(sys)),
    cramer: pick(cramer(sys)),
    gaussian: pick(gaussian(sys)),
    equating: pick(equating(sys)),
  };
}
