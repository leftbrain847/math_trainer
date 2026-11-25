/** Two equations, six ways: each turns the pure maths in src/topics/systems.ts into a step-by-step Scene. */
import { buildSystem, clipLine, cramer, elimination, equating, fmtEq, gaussian, num, substitution, SYSTEM, type Equation, type Row } from '../../topics/systems';
import type { GridSpec } from '../grid';
import { Scene } from '../scene';

/** Systems drawing sizes (SVG units). */
const SY = {
  font: 14,
  small: 12,
  row: 20,
  /** Graph units per x or y step. */
  unit: 9,
  /** Graph grid line spacing, in x/y units. */
  gridEvery: 5,
  /** Matrix column width and block spacing for the Gaussian method. */
  col: 26,
  blockW: 112,
  blockH: 66,
};

/** "3x − y + 2", skipping zero terms: each part is [coefficient, variable] ('' for a constant). */
function lin(parts: [number, string][]): string {
  let s = '';
  for (const [k, v] of parts) {
    if (k === 0) continue;
    const mag = Math.abs(k) === 1 && v ? '' : String(Math.abs(k));
    s += s ? ` ${k < 0 ? '−' : '+'} ${mag}${v}` : `${k < 0 ? '−' : ''}${mag}${v}`;
  }
  return s || '0';
}
/** A number in a product: 3 or (−3). */
const par = (v: number) => (v < 0 ? `(${num(v)})` : String(v));
/** Line i of a system as y = …: "y = 3x − 3", or "y = (8 − x)/2" when b isn't ±1. */
function yForm(e: Equation): string {
  if (Math.abs(e.b) === 1) return `y = ${lin([[-e.a / e.b, 'x'], [e.c / e.b, '']])}`;
  return `y = (${lin([[e.c, ''], [-e.a, 'x']])})/${par(e.b)}`;
}
const pair = (x: number, y: number) => `(${num(x)}, ${num(y)})`;

/** The two equations at the top of a drawing, with a brace. Returns the y of the next free row. */
function header(sc: Scene, e1: Equation, e2: Equation): number {
  sc.text(-4, SY.row / 2, '{', { anchor: 'end', size: SY.font * 2.4, cls: 'muted-text' });
  sc.text(0, 0, fmtEq(e1), { anchor: 'start', size: SY.font });
  sc.text(0, SY.row, fmtEq(e2), { anchor: 'start', size: SY.font });
  return SY.row * 2.3;
}

function drawSubstitution(x: number, y: number): Scene {
  const sc = new Scene();
  const [e1, e2] = buildSystem(x, y);
  const S = substitution([e1, e2]);
  let r = header(sc, e1, e2);
  sc.caption(0, 'Solve one equation for x, then put it into the other');
  const xExpr = lin([[e1.c, ''], [-e1.b, 'y']]);
  sc.text(0, r, `x = ${xExpr}`, { step: 1, anchor: 'start', size: SY.font });
  sc.caption(1, `From the first: x = ${xExpr}`);
  r += SY.row;
  const mult = e2.a === 1 ? '' : e2.a === -1 ? '−' : String(e2.a);
  sc.text(0, r, `${mult}(${xExpr}) ${e2.b < 0 ? '−' : '+'} ${Math.abs(e2.b) === 1 ? '' : Math.abs(e2.b)}y = ${num(e2.c)}`, { step: 2, anchor: 'start', size: SY.font });
  sc.caption(2, 'Put it into the second: now only y is left');
  r += SY.row;
  sc.text(0, r, `${lin([[e2.a * e1.c, ''], [S.coefY, 'y']])} = ${num(e2.c)}`, { step: 3, anchor: 'start', size: SY.font });
  sc.caption(3, 'Multiply out the bracket and collect the y terms');
  r += SY.row;
  sc.text(0, r, `${lin([[S.coefY, 'y']])} = ${num(S.rhs)}`, { step: 4, anchor: 'start', size: SY.font });
  sc.caption(4, `Move ${num(e2.a * e1.c)} across: ${lin([[S.coefY, 'y']])} = ${num(S.rhs)}`);
  r += SY.row;
  sc.text(0, r, `y = ${num(S.y)}`, { step: 5, anchor: 'start', size: SY.font, cls: 'answer' });
  sc.caption(5, `Divide by ${num(S.coefY)}: y = ${num(S.y)}`);
  r += SY.row;
  sc.text(0, r, `x = ${num(e1.c)} ${e1.b < 0 ? '+' : '−'} ${Math.abs(e1.b)}·${par(S.y)} = ${num(S.x)}`, { step: 6, anchor: 'start', size: SY.font, cls: 'answer' });
  sc.caption(6, `Back into x = ${xExpr}: the answer is ${pair(S.x, S.y)}`);
  return sc.fit();
}

function drawElimination(x: number, y: number): Scene {
  const sc = new Scene();
  const [e1, e2] = buildSystem(x, y);
  const E = elimination([e1, e2]);
  const mx = -6;
  sc.text(0, 0, fmtEq(e1), { anchor: 'start', size: SY.font });
  sc.text(0, SY.row, fmtEq(e2), { anchor: 'start', size: SY.font });
  sc.caption(0, 'Scale the equations so the y terms cancel');
  let r = SY.row * 2.4;
  sc.text(mx, r, `×${E.m1}`, { step: 1, anchor: 'end', size: SY.small, cls: 'muted-text' });
  sc.text(0, r, fmtEq(E.s1), { step: 1, anchor: 'start', size: SY.font });
  sc.text(mx, r + SY.row, `×${E.m2}`, { step: 1, anchor: 'end', size: SY.small, cls: 'muted-text' });
  sc.text(0, r + SY.row, fmtEq(E.s2), { step: 1, anchor: 'start', size: SY.font });
  sc.caption(1, `Times ${E.m1} and times ${E.m2}: ${lin([[E.s1.b, 'y']])} and ${lin([[E.s2.b, 'y']])}`);
  r += SY.row * 2;
  sc.text(mx, r - 7, E.add ? '+' : '−', { step: 2, anchor: 'end', size: SY.font });
  sc.line(0, r - 7, 120, r - 7, { step: 2 });
  r += 6;
  sc.text(0, r, `${lin([[E.sum.a, 'x']])} = ${num(E.sum.c)}`, { step: 2, anchor: 'start', size: SY.font });
  sc.caption(2, `${E.add ? 'Add' : 'Subtract'} them: the y terms cancel`);
  r += SY.row;
  sc.text(0, r, `x = ${num(E.x)}`, { step: 3, anchor: 'start', size: SY.font, cls: 'answer' });
  sc.caption(3, `Divide by ${num(E.sum.a)}: x = ${num(E.x)}`);
  r += SY.row;
  sc.text(0, r, `${lin([[e1.a * E.x, ''], [e1.b, 'y']])} = ${num(e1.c)}`, { step: 4, anchor: 'start', size: SY.font });
  sc.caption(4, `Put x = ${num(E.x)} back into the first equation`);
  r += SY.row;
  sc.text(0, r, `y = ${num(E.y)}`, { step: 5, anchor: 'start', size: SY.font, cls: 'answer' });
  sc.caption(5, `So y = ${num(E.y)}: the answer is ${pair(E.x, E.y)}`);
  return sc.fit();
}

function drawGraphing(x: number, y: number): Scene {
  const sc = new Scene();
  const sys = buildSystem(x, y);
  const R = SYSTEM.axis;
  const u = SY.unit;
  // SVG y points down, so flip: a point (px, py) is drawn at (px·u, −py·u).
  const P = (px: number, py: number): [number, number] => [px * u, -py * u];
  for (let k = -R; k <= R; k += SY.gridEvery) {
    if (k === 0) continue;
    sc.line(...P(k, -R), ...P(k, R), { cls: 'thin faint' });
    sc.line(...P(-R, k), ...P(R, k), { cls: 'thin faint' });
  }
  sc.line(...P(-R, 0), ...P(R, 0), { cls: 'thin' });
  sc.line(...P(0, -R), ...P(0, R), { cls: 'thin' });
  sc.text(...P(R - 0.6, 1.2), 'x', { size: SY.small, cls: 'muted-text' });
  sc.text(...P(0.9, R - 0.6), 'y', { size: SY.small, cls: 'muted-text' });
  sc.text(...P(SY.gridEvery, -1.4), String(SY.gridEvery), { size: SY.small, cls: 'muted-text' });
  sc.caption(0, 'Each equation is a straight line; draw both');
  const legendY = R * u + 18;
  sys.forEach((e, i) => {
    const step = i + 1;
    const seg = clipLine(e, R);
    const cls = i === 0 ? 'stroke lineA' : 'stroke lineB';
    if (seg) sc.line(...P(...seg[0]), ...P(...seg[1]), { step, cls });
    const ly = legendY + i * SY.row;
    sc.line(-R * u, ly, -R * u + 16, ly, { step, cls });
    sc.text(-R * u + 22, ly, fmtEq(e), { step, anchor: 'start', size: SY.font });
    sc.caption(step, `${fmtEq(e)} is the line ${yForm(e)}`);
  });
  const [px, py] = P(x, y);
  sc.line(px, py, px, 0, { step: 3, cls: 'stroke zero' });
  sc.line(px, py, 0, py, { step: 3, cls: 'stroke zero' });
  sc.dot(px, py, 4, { step: 3 });
  sc.caption(3, 'Both equations hold where the lines cross');
  const right = x > 3;
  sc.text(px + (right ? -8 : 8), py + (y > 7 ? 14 : -12), pair(x, y), { step: 4, anchor: right ? 'end' : 'start', size: SY.font, cls: 'answer' });
  sc.caption(4, `Read it off the grid: x = ${num(x)}, y = ${num(y)}`);
  return sc.fit();
}

/** A 2 × 2 determinant |p q; r s| at (x0, y0), with the column `hot` (0 or 1) marked. Returns its right edge. */
function det(sc: Scene, x0: number, y0: number, m: [[number, number], [number, number]], step: number, hot: number | null): number {
  const w = SY.col * 2;
  sc.line(x0, y0 - 9, x0, y0 + SY.row + 9, { step });
  sc.line(x0 + w + 4, y0 - 9, x0 + w + 4, y0 + SY.row + 9, { step });
  m.forEach((row, i) =>
    row.forEach((v, j) => sc.text(x0 + 2 + SY.col * (j + 0.5), y0 + i * SY.row, num(v), { step, size: SY.font - 1, cls: j === hot ? 'carry' : undefined })),
  );
  return x0 + w + 4;
}

function drawCramer(x: number, y: number): Scene {
  const sc = new Scene();
  const [e1, e2] = buildSystem(x, y);
  const C = cramer([e1, e2]);
  let r = header(sc, e1, e2);
  sc.caption(0, "Cramer's rule: three 2 × 2 determinants");
  const blocks: [string, [[number, number], [number, number]], number, number | null, string][] = [
    ['D', [[e1.a, e1.b], [e2.a, e2.b]], C.D, null, `D = ${e1.a}·${par(e2.b)} − ${e1.b}·${par(e2.a)} = ${num(C.D)}`],
    ['Dx', [[e1.c, e1.b], [e2.c, e2.b]], C.Dx, 0, `Dx: put the answers in the x column: ${num(C.Dx)}`],
    ['Dy', [[e1.a, e1.c], [e2.a, e2.c]], C.Dy, 1, `Dy: put the answers in the y column: ${num(C.Dy)}`],
  ];
  blocks.forEach(([name, m, v, hot, cap], k) => {
    const step = k + 1;
    sc.text(26, r + SY.row / 2, `${name} =`, { step, anchor: 'end', size: SY.font });
    const end = det(sc, 32, r, m, step, hot);
    sc.text(end + 8, r + SY.row / 2, `= ${num(v)}`, { step, anchor: 'start', size: SY.font });
    sc.caption(step, cap);
    r += SY.row * 2.3;
  });
  sc.text(0, r, `x = Dx/D = ${num(C.x)}`, { step: 4, anchor: 'start', size: SY.font, cls: 'answer' });
  sc.caption(4, `x = ${num(C.Dx)} ÷ ${par(C.D)} = ${num(C.x)}`);
  sc.text(0, r + SY.row, `y = Dy/D = ${num(C.y)}`, { step: 5, anchor: 'start', size: SY.font, cls: 'answer' });
  sc.caption(5, `y = ${num(C.Dy)} ÷ ${par(C.D)} = ${num(C.y)}`);
  return sc.fit();
}

/** An augmented matrix [a b | c] block at (x0, y0); `hot` lights the changed row. */
function matrix(sc: Scene, x0: number, y0: number, rows: [Row, Row], step: number, hot: number | null): void {
  const c = SY.col;
  const h = SY.row + 18;
  const bar = x0 + c * 2 + 6;
  sc.poly([[x0 + 4, y0 - 9], [x0, y0 - 9], [x0, y0 - 9 + h], [x0 + 4, y0 - 9 + h]], { step, cls: 'stroke curve' });
  const right = bar + c * 1.8;
  sc.poly([[right - 4, y0 - 9], [right, y0 - 9], [right, y0 - 9 + h], [right - 4, y0 - 9 + h]], { step, cls: 'stroke curve' });
  sc.line(bar, y0 - 7, bar, y0 - 11 + h, { step, cls: 'thin' });
  rows.forEach((row, i) => {
    const cls = i === hot ? 'carry' : undefined;
    sc.text(x0 + c * 0.6, y0 + i * SY.row, num(row[0]), { step, size: SY.font - 1, cls });
    sc.text(x0 + c * 1.6, y0 + i * SY.row, num(row[1]), { step, size: SY.font - 1, cls });
    sc.text(right - 5, y0 + i * SY.row, num(row[2]), { step, anchor: 'end', size: SY.font - 1, cls });
  });
}

function drawGaussian(x: number, y: number): Scene {
  const sc = new Scene();
  const G = gaussian(buildSystem(x, y));
  const at = (k: number): [number, number] => [(k % 2) * SY.blockW, Math.floor(k / 2) * SY.blockH];
  matrix(sc, 0, 0, G.start, 0, null);
  sc.caption(0, 'Write the coefficients as a matrix [x y | answer]');
  G.ops.forEach((op, i) => {
    const step = i + 1;
    const [bx, by] = at(i + 1);
    sc.text(bx + 4, by - 20, op.label, { step, anchor: 'start', size: SY.small, cls: 'muted-text' });
    matrix(sc, bx, by, op.rows, step, op.changed);
    const what = i === 0 ? 'clear x from row 2' : op.label.startsWith('R2 ÷') ? 'make the y entry 1' : op.label.startsWith('R1 ÷') ? 'make the x entry 1' : 'clear y from row 1';
    sc.caption(step, `${op.label}: ${what}`);
  });
  const fin = G.ops.length + 1;
  const [, by] = at(G.ops.length + 1);
  sc.text(SY.blockW - 6, by + (G.ops.length % 2 ? -SY.blockH + 50 : 4), `x = ${num(G.x)}, y = ${num(G.y)}`, { step: fin, size: SY.font, cls: 'answer' });
  sc.caption(fin, `Read the last column: x = ${num(G.x)}, y = ${num(G.y)}`);
  return sc.fit();
}

function drawEquating(x: number, y: number): Scene {
  const sc = new Scene();
  const [e1, e2] = buildSystem(x, y);
  const Q = equating([e1, e2]);
  let r = header(sc, e1, e2);
  sc.caption(0, 'Write both equations as y = …');
  const y1 = yForm(e1);
  const y2 = yForm(e2);
  sc.text(0, r, y1, { step: 1, anchor: 'start', size: SY.font });
  sc.text(0, r + SY.row, y2, { step: 1, anchor: 'start', size: SY.font });
  sc.caption(1, 'Solve each one for y');
  r += SY.row * 2.2;
  sc.text(0, r, `${y1.slice(4)} = ${y2.slice(4)}`, { step: 2, anchor: 'start', size: SY.font });
  sc.caption(2, 'Both equal y, so they equal each other');
  r += SY.row;
  sc.text(0, r, `${lin([[Q.coefX, 'x']])} = ${num(Q.rhs)}`, { step: 3, anchor: 'start', size: SY.font });
  sc.caption(3, 'Clear the fraction and gather the x terms');
  r += SY.row;
  sc.text(0, r, `x = ${num(Q.x)}`, { step: 4, anchor: 'start', size: SY.font, cls: 'answer' });
  sc.caption(4, `Divide by ${num(Q.coefX)}: x = ${num(Q.x)}`);
  r += SY.row;
  sc.text(0, r, `y = ${num(Q.y)}`, { step: 5, anchor: 'start', size: SY.font, cls: 'answer' });
  sc.caption(5, `Into ${y2}: y = ${num(Q.y)}`);
  return sc.fit();
}

const X0 = 2;
const Y0 = 3;

export const grid: GridSpec = {
  id: 'systems',
  sliders: [
    { label: 'x', start: X0, min: SYSTEM.min, max: SYSTEM.max },
    { label: 'y', start: Y0, min: SYSTEM.min, max: SYSTEM.max },
  ],
  methods: [
    { id: 'substitution', title: 'Substitution', draw: ([x = X0, y = Y0]) => drawSubstitution(x, y) },
    { id: 'elimination', title: 'Elimination', draw: ([x = X0, y = Y0]) => drawElimination(x, y) },
    { id: 'graphing', title: 'Graphing', draw: ([x = X0, y = Y0]) => drawGraphing(x, y) },
    { id: 'cramer', title: "Cramer's rule", draw: ([x = X0, y = Y0]) => drawCramer(x, y) },
    { id: 'gaussian', title: 'Matrix (Gaussian)', draw: ([x = X0, y = Y0]) => drawGaussian(x, y) },
    { id: 'equating', title: 'Equating', draw: ([x = X0, y = Y0]) => drawEquating(x, y) },
  ],
  problem: ([x = X0, y = Y0]) => {
    const [e1, e2] = buildSystem(x, y);
    return `${fmtEq(e1)}, ${fmtEq(e2)} → ${pair(x, y)}`;
  },
};
