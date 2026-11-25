/** Quadratics, five ways: each turns the pure maths in src/topics/quadratics.ts into a step-by-step Scene. */
import { completeSquare, factoring, fmtFactors, fmtQuad, formula, fromRoots, graphing, num, poShenLoh, QUAD, type Quadratic, type Roots } from '../../topics/quadratics';
import type { GridSpec } from '../grid';
import { Scene } from '../scene';

/** Quadratic drawing sizes (SVG units). */
const QD = {
  font: 14,
  small: 12,
  row: 20,
  /** Graph plot area. */
  plotW: 180,
  plotH: 150,
  /** Po-Shen Loh number line: most units per step, and its longest length. */
  lineUnit: 14,
  lineMax: 150,
};

const par = (v: number) => (v < 0 ? `(${num(v)})` : num(v));
/** "x = −1 or 5", or "x = 3 (double root)" */
const rootsText = ([a, b]: Roots) => (a === b ? `x = ${num(a)} (double)` : `x = ${num(a)} or ${num(b)}`);
/** "(x − 2)²", "(x + 3.5)²", "x²" */
const sq = (h: number) => (h === 0 ? 'x²' : `(x ${h < 0 ? '−' : '+'} ${Math.abs(h)})²`);
/** "x² − 4x" */
const xPart = (B: number) => fmtQuad({ B, C: 0 });

function rows(sc: Scene, start: number): (s: string, step: number, cls?: string) => void {
  let y = start;
  return (s, step, cls) => {
    sc.text(0, y, s, { step, anchor: 'start', size: QD.font, cls });
    y += QD.row;
  };
}

function drawFactoring(Q: Quadratic): Scene {
  const sc = new Scene();
  const F = factoring(Q);
  const add = rows(sc, 0);
  add(`${fmtQuad(Q)} = 0`, 0);
  sc.caption(0, `Factor ${fmtQuad(Q)} as (x + p)(x + q)`);
  add(`p·q = ${num(Q.C)}, p + q = ${num(Q.B)}`, 1, 'muted-text');
  sc.caption(1, `Find two numbers: product ${num(Q.C)}, sum ${num(Q.B)}`);
  let step = 1;
  for (const t of F.trials) {
    step++;
    add(`${num(t.p)}·${par(t.q)}: sum ${num(t.sum)} ${t.ok ? '✓' : '✗'}`, step, t.ok ? undefined : 'muted-text');
    sc.caption(step, t.ok ? `${num(t.p)} and ${num(t.q)} work: sum ${num(t.sum)}` : `${num(t.p)} × ${par(t.q)} = ${num(Q.C)}, but the sum is ${num(t.sum)}`);
  }
  step++;
  add(`${fmtFactors(F.p, F.q)} = 0`, step);
  sc.caption(step, `So ${fmtQuad(Q)} = ${fmtFactors(F.p, F.q)}`);
  step++;
  add(rootsText(F.roots), step, 'answer');
  sc.caption(step, F.roots[0] === F.roots[1] ? `One factor twice: ${rootsText(F.roots)}` : 'A product is 0 when a factor is 0');
  return sc.fit();
}

function drawComplete(Q: Quadratic): Scene {
  const sc = new Scene();
  const S = completeSquare(Q);
  const add = rows(sc, 0);
  add(`${fmtQuad(Q)} = 0`, 0);
  sc.caption(0, 'Make the x terms into a perfect square');
  if (S.half === 0) {
    // No x term: it is already a square, so go straight to the root.
    if (Q.C) add(`x² = ${num(-Q.C)}`, 1);
    sc.caption(1, `No x term: x² = ${num(-Q.C)} is already a square`);
    add(`x = ${S.root ? `±${S.root}` : '0'}`, 2);
    sc.caption(2, S.root ? `Square root, either sign: √${S.rhs} = ${S.root}` : 'x² = 0, so x = 0');
    add(rootsText(S.roots), 3, 'answer');
    sc.caption(3, rootsText(S.roots));
    return sc.fit();
  }
  add(`${xPart(Q.B)} = ${num(-Q.C)}`, 1);
  sc.caption(1, `Move ${num(Q.C)} to the other side`);
  add(`${xPart(Q.B)}${S.halfSq ? ` + ${S.halfSq}` : ''} = ${num(S.rhs)}`, 2);
  sc.caption(2, `Half of ${num(Q.B)} is ${num(S.half)}; add ${par(S.half)}² = ${S.halfSq} to both sides`);
  add(`${sq(S.half)} = ${num(S.rhs)}`, 3);
  sc.caption(3, `The left side is now ${sq(S.half)}`);
  const inner = S.half === 0 ? 'x' : `x ${S.half < 0 ? '−' : '+'} ${Math.abs(S.half)}`;
  add(`${inner} = ${S.root ? `±${S.root}` : '0'}`, 4);
  sc.caption(4, S.root ? `Square root of both sides: √${S.rhs} = ${S.root}, either sign` : 'The square is 0, so the inside is 0');
  add(`x = ${num(-S.half)}${S.root ? ` ± ${S.root}` : ''}`, 5);
  sc.caption(5, `Move ${num(S.half)} across`);
  add(rootsText(S.roots), 6, 'answer');
  sc.caption(6, S.root ? `${num(-S.half)} − ${S.root} = ${num(S.roots[0])} and ${num(-S.half)} + ${S.root} = ${num(S.roots[1])}` : rootsText(S.roots));
  return sc.fit();
}

function drawFormula(Q: Quadratic): Scene {
  const sc = new Scene();
  const F = formula(Q);
  const add = rows(sc, 0);
  add(`${fmtQuad(Q)} = 0`, 0);
  sc.text(0, QD.row, 'x = (−b ± √(b² − 4c)) / 2', { anchor: 'start', size: QD.small, cls: 'muted-text' });
  sc.caption(0, 'The formula, for x² + bx + c = 0');
  const add2 = rows(sc, QD.row * 2.2);
  add2(`b = ${num(Q.B)}, c = ${num(Q.C)}`, 1);
  sc.caption(1, `Read off b = ${num(Q.B)} and c = ${num(Q.C)}`);
  add2(`b² − 4c = ${Q.B * Q.B} ${Q.C <= 0 ? '+' : '−'} ${Math.abs(4 * Q.C)} = ${F.disc}`, 2);
  sc.caption(2, `The discriminant: ${par(Q.B)}² − 4·${par(Q.C)} = ${F.disc}`);
  add2(`√${F.disc} = ${F.sqrt}`, 3);
  sc.caption(3, F.disc ? `Its square root is ${F.sqrt}` : 'It is 0: the two roots are the same');
  add2(`x = (${num(-Q.B)} ± ${F.sqrt}) / 2`, 4);
  sc.caption(4, `−b = ${num(-Q.B)}: take ± ${F.sqrt} and halve`);
  add2(rootsText(F.roots), 5, 'answer');
  sc.caption(5, F.disc ? `(${num(-Q.B)} − ${F.sqrt})/2 = ${num(F.roots[0])}, (${num(-Q.B)} + ${F.sqrt})/2 = ${num(F.roots[1])}` : rootsText(F.roots));
  return sc.fit();
}

function drawGraphing(Q: Quadratic): Scene {
  const sc = new Scene();
  const G = graphing(Q);
  const ys = G.points.map((p) => p[1]);
  const yMin = Math.min(0, ...ys);
  const yMax = Math.max(1, ...ys);
  const sx = QD.plotW / (G.xMax - G.xMin);
  const sy = QD.plotH / (yMax - yMin);
  // SVG y points down: flip so up is up.
  const P = (x: number, y: number): [number, number] => [(x - G.xMin) * sx, -(y - yMin) * sy];
  sc.line(...P(G.xMin, 0), ...P(G.xMax, 0), { cls: 'thin' });
  if (G.xMin < 0 && G.xMax > 0) sc.line(...P(0, yMin), ...P(0, yMax), { cls: 'thin' });
  for (let x = G.xMin; x <= G.xMax; x++) sc.line(P(x, 0)[0], P(x, 0)[1] - 3, P(x, 0)[0], P(x, 0)[1] + 3, { cls: 'thin' });
  sc.caption(0, `Plot y = ${fmtQuad(Q)}`);
  sc.poly(G.points.map(([x, y]) => P(x, y)), { step: 1, cls: 'stroke curve lineA' });
  sc.caption(1, 'A parabola: it dips below the x-axis and comes back');
  const [vx, vy] = G.vertex;
  const V = P(vx, vy);
  sc.dot(V[0], V[1], 3, { step: 2, cls: 'dot faint' });
  if (vy !== 0) sc.text(V[0], V[1] + 14, `(${num(vx)}, ${num(vy)})`, { step: 2, size: QD.small, cls: 'muted-text' });
  sc.caption(2, `Lowest point (${num(vx)}, ${num(vy)}), halfway between the roots`);
  const roots = G.roots[0] === G.roots[1] ? [G.roots[0]] : G.roots;
  for (const r of roots) {
    const [px, py] = P(r, 0);
    sc.dot(px, py, 4, { step: 3 });
    // Label outside the curve: below and outward for a crossing, above the touch point for a double root.
    const side = roots.length === 1 ? 0 : r === roots[0] ? -1 : 1;
    const anchor = side < 0 ? 'end' : side > 0 ? 'start' : 'middle';
    sc.text(px + side * 6, py + (side ? 13 : -14), num(r), { step: 4, anchor, size: QD.font, cls: 'answer' });
  }
  sc.caption(3, roots.length === 1 ? 'It just touches the x-axis once' : 'It crosses the x-axis twice');
  sc.text(QD.plotW / 2, 40, rootsText(G.roots), { step: 4, size: QD.font, cls: 'answer' });
  sc.caption(4, `Read the crossings: ${rootsText(G.roots)}`);
  return sc.fit();
}

function drawLoh(Q: Quadratic): Scene {
  const sc = new Scene();
  const L = poShenLoh(Q);
  const add = rows(sc, 0);
  add(`${fmtQuad(Q)} = 0`, 0);
  sc.caption(0, `Roots add to ${num(-Q.B)} and multiply to ${num(Q.C)}`);
  add(`x = ${num(L.m)} ± u`, 1);
  sc.caption(1, `They average ${num(-Q.B)} ÷ 2 = ${num(L.m)}, so call them ${num(L.m)} ± u`);
  add(`(${num(L.m)} − u)(${num(L.m)} + u) = ${num(Q.C)}`, 2);
  sc.caption(2, `Their product is ${num(Q.C)}`);
  add(`${L.mSq} − u² = ${num(Q.C)}`, 3);
  sc.caption(3, `Difference of squares: ${par(L.m)}² − u² = ${num(Q.C)}`);
  add(`u² = ${L.uSq}, u = ${L.u}`, 4);
  sc.caption(4, `u² = ${L.mSq} ${Q.C < 0 ? '+' : '−'} ${Math.abs(Q.C)} = ${L.uSq}, so u = ${L.u}`);
  // A number line: the two roots sit u either side of the midpoint m.
  const unit = Math.min(QD.lineUnit, QD.lineMax / Math.max(1, 2 * L.u));
  const y = QD.row * 5.6;
  const cx = QD.lineMax / 2;
  const half = Math.max(L.u * unit, 20);
  sc.line(cx - half - 10, y, cx + half + 10, y, { step: 5, cls: 'thin' });
  sc.line(cx, y - 5, cx, y + 5, { step: 5 });
  if (L.u) sc.text(cx, y + 14, num(L.m), { step: 5, size: QD.small, cls: 'muted-text' });
  const pts = L.u ? L.roots : [L.roots[0]];
  for (const r of pts) {
    const px = cx + (r - L.m) * unit;
    sc.dot(px, y, 4, { step: 5 });
    sc.text(px, y - 13, num(r), { step: 5, size: QD.font, cls: 'answer' });
  }
  sc.text(0, y + QD.row * 1.6, rootsText(L.roots), { step: 5, anchor: 'start', size: QD.font, cls: 'answer' });
  sc.caption(5, L.u ? `${num(L.m)} − ${L.u} and ${num(L.m)} + ${L.u}: ${rootsText(L.roots)}` : `u = 0: ${rootsText(L.roots)}`);
  return sc.fit();
}

const R1 = -1;
const R2 = 5;

export const grid: GridSpec = {
  id: 'quadratics',
  sliders: [
    { label: 'r1', start: R1, min: QUAD.min, max: QUAD.max },
    { label: 'r2', start: R2, min: QUAD.min, max: QUAD.max },
  ],
  methods: [
    { id: 'factoring', title: 'Factoring', draw: ([a = R1, b = R2]) => drawFactoring(fromRoots(a, b)) },
    { id: 'complete', title: 'Completing the square', draw: ([a = R1, b = R2]) => drawComplete(fromRoots(a, b)) },
    { id: 'formula', title: 'Quadratic formula', draw: ([a = R1, b = R2]) => drawFormula(fromRoots(a, b)) },
    { id: 'graphing', title: 'Graphing', draw: ([a = R1, b = R2]) => drawGraphing(fromRoots(a, b)) },
    { id: 'loh', title: 'Po-Shen Loh', draw: ([a = R1, b = R2]) => drawLoh(fromRoots(a, b)) },
  ],
  problem: ([a = R1, b = R2]) => `${fmtQuad(fromRoots(a, b))} = 0 → ${rootsText(a <= b ? [a, b] : [b, a])}`,
};
