/** The five squaring drawings. Each turns the pure maths in src/topics/squares.ts into a step-by-step Scene. */
import { areaPicture, diffSquares, endsIn5, expansion, nearBase } from '../../topics/squares';
import type { GridSpec } from '../grid';
import { Scene } from '../scene';

/** Squaring drawing sizes (SVG units). The scene scales to its tile, so only the proportions matter. */
const SQ = {
  font: 16,
  text: 14,
  small: 12,
  eqGap: 6,
  eqRow: 22,
  /** The area picture's side, and the narrowest the ones strip may be drawn so its numbers fit. */
  side: 160,
  minStrip: 40,
};

/** One centred equation row: "left = right". */
function eq(sc: Scene, y: number, left: string, right: string, step: number, cls?: string): void {
  sc.text(0, y, `${left} = ${right}`, { step, size: SQ.text, cls });
}

const signed = (d: number) => (d < 0 ? `− ${-d}` : `+ ${d}`);
const minus = (d: number) => (d < 0 ? `−${-d}` : String(d));

function drawExpansion(n: number): Scene {
  const sc = new Scene();
  const E = expansion(n);
  const r = SQ.eqRow;
  sc.text(0, 0, `${n}² = (${E.a} + ${E.b})²`, { size: SQ.font });
  sc.caption(0, `Split ${n} into ${E.a} + ${E.b}; (a + b)² = a² + 2ab + b²`);
  eq(sc, r * 1.5, `${E.a}²`, String(E.aa), 1);
  sc.caption(1, `a² = ${E.a} × ${E.a} = ${E.aa}`);
  eq(sc, r * 2.5, `2 × ${E.a} × ${E.b}`, String(E.ab2), 2);
  sc.caption(2, `2ab = 2 × ${E.a} × ${E.b} = ${E.ab2}`);
  eq(sc, r * 3.5, `${E.b}²`, String(E.bb), 3);
  sc.caption(3, `b² = ${E.b} × ${E.b} = ${E.bb}`);
  eq(sc, r * 4.7, `${E.aa} + ${E.ab2} + ${E.bb}`, String(E.result), 4, 'answer');
  sc.caption(4, `Add: ${E.aa} + ${E.ab2} + ${E.bb} = ${E.result}`);
  return sc.fit();
}

function drawFive(n: number): Scene {
  const sc = new Scene();
  const F = endsIn5(n);
  const r = SQ.eqRow;
  const exact = F.m === n;
  sc.text(0, 0, `${n}²`, { size: SQ.font });
  sc.caption(0, exact ? `${n} ends in 5: there's a shortcut` : `${n}²: start from ${F.m}², which ends in 5`);
  eq(sc, r * 1.4, `${F.tens} × ${F.tens + 1}`, String(F.head), 1);
  sc.caption(1, `Tens digit times the next number up: ${F.tens} × ${F.tens + 1} = ${F.head}`);
  const last = exact ? 2 : 4;
  eq(sc, r * 2.4, `${F.m}²`, String(F.mm), 2, exact ? 'answer' : undefined);
  sc.caption(2, `Write 25 after it: ${F.m}² = ${F.mm}`);
  if (!exact) {
    const op = F.gap > 0 ? '−' : '+';
    eq(sc, r * 3.6, `${Math.abs(F.gap)} × ${F.sum}`, String(Math.abs(F.adjust)), 3);
    const [hiSq, loSq] = F.gap > 0 ? [F.m, n] : [n, F.m];
    sc.caption(3, `${hiSq}² − ${loSq}² = (${hiSq} − ${loSq}) × (${hiSq} + ${loSq}) = ${Math.abs(F.adjust)}`);
    eq(sc, r * 4.8, `${F.mm} ${op} ${Math.abs(F.adjust)}`, String(F.result), last, 'answer');
    sc.caption(last, `${F.mm} ${op} ${Math.abs(F.adjust)} = ${F.result}`);
  } else {
    sc.caption(last, `${n}² = ${F.result}`);
  }
  return sc.fit();
}

function drawBase(n: number): Scene {
  const sc = new Scene();
  const B = nearBase(n);
  const r = SQ.eqRow;
  const away = B.d === 0 ? `${n} is the base` : `${n} is ${Math.abs(B.d)} ${B.d < 0 ? 'below' : 'above'} ${B.base}`;
  sc.text(0, 0, `${n}²`, { size: SQ.font });
  sc.caption(0, `${n}²: work from the nearby base ${B.base}`);
  eq(sc, r * 1.4, `${n} − ${B.base}`, B.d < 0 ? `−${-B.d}` : String(B.d), 1);
  sc.caption(1, `${away}: d = ${minus(B.d)}`);
  eq(sc, r * 2.4, `${n} ${signed(B.d)}`, String(B.hi), 2);
  sc.caption(2, `Move ${n} the same way again: ${n} ${signed(B.d)} = ${B.hi}`);
  eq(sc, r * 3.4, `${B.hi} × ${B.base}`, String(B.part), 3);
  sc.caption(3, B.base === 100 ? `× 100: add two zeros, ${B.part}` : B.base === 50 ? `× 50 is × 100 then halve: ${B.part}` : `× 10: add a zero, ${B.part}`);
  eq(sc, r * 4.4, `${B.d < 0 ? `(−${-B.d})` : B.d}²`, String(B.dd), 4);
  sc.caption(4, `Square the distance: (${minus(B.d)})² = ${B.dd}`);
  eq(sc, r * 5.6, `${B.part} + ${B.dd}`, String(B.result), 5, 'answer');
  sc.caption(5, `${B.part} + ${B.dd} = ${B.result}`);
  return sc.fit();
}

function drawDifference(n: number): Scene {
  const sc = new Scene();
  const D = diffSquares(n);
  const r = SQ.eqRow;
  sc.text(0, 0, `${n}²`, { size: SQ.font });
  if (!D.d) {
    sc.caption(0, `${n} is already a round number`);
    eq(sc, r * 1.5, `${n} × ${n}`, String(D.result), 1, 'answer');
    sc.caption(1, `Nothing to shift: ${n} × ${n} = ${D.result}`);
    return sc.fit();
  }
  sc.caption(0, `n² − d² = (n − d)(n + d), so n² = (n − d)(n + d) + d²`);
  sc.text(0, r * 1.3, `d = ${D.d}`, { step: 1, size: SQ.text, cls: 'carry' });
  sc.caption(1, `Pick d = ${D.d} so one factor is the round ${D.round}`);
  eq(sc, r * 2.5, `${n} − ${D.d}`, String(D.lo), 2);
  eq(sc, r * 3.5, `${n} + ${D.d}`, String(D.hi), 2);
  sc.caption(2, `${n} − ${D.d} = ${D.lo},  ${n} + ${D.d} = ${D.hi}`);
  eq(sc, r * 4.5, `${D.lo} × ${D.hi}`, String(D.prod), 3);
  sc.caption(3, `Easy product with a round number: ${D.lo} × ${D.hi} = ${D.prod}`);
  eq(sc, r * 5.7, `${D.prod} + ${D.d}²`, String(D.result), 4, 'answer');
  sc.caption(4, `Add back d² = ${D.dd}: ${D.prod} + ${D.dd} = ${D.result}`);
  return sc.fit();
}

function drawArea(n: number): Scene {
  const sc = new Scene();
  const A = areaPicture(n);
  const S = SQ.side;
  // Not to scale: the ones strip gets a minimum width so its numbers stay readable.
  const bw = A.b ? Math.max(SQ.minStrip, (S * A.b) / n) : 0;
  const aw = S - bw;
  sc.text(aw / 2, -12, String(A.a), { size: SQ.text });
  sc.text(-6, aw / 2, String(A.a), { anchor: 'end', size: SQ.text });
  if (bw) {
    sc.text(aw + bw / 2, -12, String(A.b), { size: SQ.text });
    sc.text(-6, aw + bw / 2, String(A.b), { anchor: 'end', size: SQ.text });
  }
  sc.caption(0, `An ${n} by ${n} square, each side cut into ${A.a} + ${A.b}`);
  const [aa = 0, ab = 0, , bb = 0] = A.pieces;
  const boxes: { x: number; y: number; w: number; h: number; v: number; cap: string }[] = [
    { x: 0, y: 0, w: aw, h: aw, v: aa, cap: `${A.a} × ${A.a} = ${aa}` },
    { x: aw, y: 0, w: bw, h: aw, v: ab, cap: `${A.a} × ${A.b} = ${ab}` },
    { x: 0, y: aw, w: aw, h: bw, v: ab, cap: `${A.b} × ${A.a} = ${ab}, the same strip again` },
    { x: aw, y: aw, w: bw, h: bw, v: bb, cap: `${A.b} × ${A.b} = ${bb}` },
  ];
  let step = 0;
  for (const b of boxes) {
    if (!b.w || !b.h) {
      sc.rect(b.x, b.y, b.w, b.h, { cls: 'box grid' });
      continue;
    }
    step++;
    const node = sc.rect(b.x, b.y, b.w, b.h, { cls: 'box grid' });
    sc.heat(node, [step]);
    sc.text(b.x + b.w / 2, b.y + b.h / 2, String(b.v), { step, size: b.w < 60 || b.h < 60 ? SQ.small : SQ.text });
    sc.caption(step, b.cap);
  }
  const fin = step + 1;
  const used = A.b ? A.pieces : [aa];
  sc.text(S / 2, S + 20, `= ${A.result}`, { step: fin, cls: 'answer', size: SQ.font });
  sc.caption(fin, used.length > 1 ? `Add the four pieces: ${used.join(' + ')} = ${A.result}` : `${n}² = ${A.result}`);
  return sc.fit();
}

const METHODS: { id: string; title: string; draw: (n: number) => Scene }[] = [
  { id: 'expansion', title: '(a+b)² expansion', draw: drawExpansion },
  { id: 'five', title: 'Ends in 5 trick', draw: drawFive },
  { id: 'base', title: 'Near a base', draw: drawBase },
  { id: 'difference', title: 'Difference of squares', draw: drawDifference },
  { id: 'area', title: 'Area picture', draw: drawArea },
];

export const grid: GridSpec = {
  id: 'squares',
  sliders: [{ label: 'n', start: 43, min: 11, max: 125 }],
  methods: METHODS.map((m) => ({ id: m.id, title: m.title, draw: ([n = 11]) => m.draw(n) })),
  problem: ([n = 11]) => `${n}² = ${n * n}`,
};
