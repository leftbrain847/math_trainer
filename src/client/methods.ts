/** The six multiplication drawings. Each turns the pure maths in src/math.ts into a step-by-step Scene. */
import { area, digits, lattice, lines, partialProducts, peasant, standard, type MethodId } from '../math';
import { Scene } from './scene';

/** Drawing sizes (SVG units). The scene scales to its tile, so only the proportions matter. */
export const DRAW = {
  digitW: 11,
  rowH: 22,
  font: 16,
  latticeCell: 40,
  boxW: 62,
  boxH: 40,
  lineGap: 6,
  groupGap: 16,
  dotR: 2.2,
};

const sum = (xs: number[]): number => xs.reduce((s, x) => s + x, 0);

/** Right-aligned digits of n ending at x = 0; returns one node per digit, ones first. */
function digitRow(sc: Scene, n: number, y: number, step: number, cls?: string): SVGElement[] {
  return digits(n)
    .reverse()
    .map((d, k) => sc.text(-k * DRAW.digitW - DRAW.digitW / 2, y, String(d), { step, cls, size: DRAW.font }));
}

function drawStandard(a: number, b: number): Scene {
  const sc = new Scene();
  const s = standard(a, b);
  const width = (String(s.result).length + 1) * DRAW.digitW;
  const aRow = digitRow(sc, a, 0, 0);
  sc.text(-width, DRAW.rowH, '×', { size: DRAW.font });
  const bRow = digitRow(sc, b, DRAW.rowH, 0);
  sc.line(-width - 4, DRAW.rowH * 1.6, 2, DRAW.rowH * 1.6);
  sc.caption(0, `${a} × ${b}, one digit of ${b} at a time`);
  s.rows.forEach((r, i) => {
    const step = i + 1;
    digitRow(sc, r.value, DRAW.rowH * (2.2 + i), step);
    const bd = bRow[i];
    if (bd) sc.heat(bd, [step]);
    for (const n of aRow) sc.heat(n, [step]);
    sc.caption(step, `${r.digit} × ${a} = ${a * r.digit}${r.shift ? `, shifted ${r.shift} place${r.shift > 1 ? 's' : ''}` : ''}`);
  });
  const last = s.rows.length + 1;
  const y = DRAW.rowH * (2.2 + s.rows.length);
  sc.line(-width - 4, y - DRAW.rowH * 0.55, 2, y - DRAW.rowH * 0.55, { step: last });
  digitRow(sc, s.result, y + 4, last, 'answer');
  sc.caption(last, `Add the rows: ${s.rows.map((r) => r.value).join(' + ')} = ${s.result}`);
  return sc.fit();
}

function drawLattice(a: number, b: number): Scene {
  const sc = new Scene();
  const L = lattice(a, b);
  const c = DRAW.latticeCell;
  const m = L.top.length;
  const n = L.side.length;
  const topN = L.top.map((d, col) => sc.text(col * c + c / 2, -12, String(d), { size: DRAW.font }));
  const sideN = L.side.map((d, row) => sc.text(m * c + 12, row * c + c / 2, String(d), { size: DRAW.font }));
  const halves: { diag: number; node: SVGElement }[] = [];
  L.cells.forEach((cell, k) => {
    const x = cell.col * c;
    const y = cell.row * c;
    sc.rect(x, y, c, c, { cls: 'box grid' });
    sc.line(x + c, y, x, y + c, { cls: 'stroke thin' });
    const step = k + 1;
    halves.push({ diag: cell.diag + 1, node: sc.text(x + c * 0.3, y + c * 0.32, String(cell.tens), { step, size: 13 }) });
    halves.push({ diag: cell.diag, node: sc.text(x + c * 0.7, y + c * 0.7, String(cell.ones), { step, size: 13 }) });
    const t = topN[cell.col];
    const sd = sideN[cell.row];
    if (t) sc.heat(t, [step]);
    if (sd) sc.heat(sd, [step]);
    sc.caption(step, `${L.top[cell.col]} × ${L.side[cell.row]} = ${cell.tens}${cell.ones}`);
  });
  sc.caption(0, `${a} × ${b}: one cell per pair of digits`);
  const base = L.cells.length + 1;
  L.columns.forEach((col, k) => {
    const step = base + k;
    const inDiag = halves.filter((h) => h.diag === k);
    for (const h of inDiag) sc.heat(h.node, [step]);
    const at = k < m ? { x: (m - 1 - k) * c + c / 2, y: n * c + 14 } : { x: -14, y: (m + n - 1 - k) * c + c / 2 };
    sc.text(at.x, at.y, String(col.digit), { step, cls: 'answer', size: DRAW.font });
    if (col.carryOut) {
      const nx = k + 1 < m ? { x: (m - 2 - k) * c + c / 2, y: n * c + 30 } : { x: -28, y: (m + n - 2 - k) * c + c / 2 };
      sc.text(nx.x, nx.y, `+${col.carryOut}`, { step, cls: 'carry', size: 10 });
    }
    const terms = inDiag.map((h) => h.node.textContent ?? '0');
    if (!terms.length) terms.push('0');
    sc.caption(step, `Diagonal: ${terms.join(' + ')}${col.carryIn ? ` + ${col.carryIn} carried` : ''} = ${col.sum + col.carryIn} → ${col.digit}`);
  });
  const last = base + L.columns.length;
  sc.text((m * c) / 2, n * c + 46, `= ${L.result}`, { step: last, cls: 'answer', size: DRAW.font });
  sc.caption(last, `Read down the left and along the bottom: ${L.result}`);
  return sc.fit();
}

function drawArea(a: number, b: number): Scene {
  const sc = new Scene();
  const A = area(a, b);
  const { boxW: w, boxH: h } = DRAW;
  const topN = A.top.map((v, col) => sc.text(col * w + w / 2, -12, String(v), { size: 13 }));
  const sideN = A.side.map((v, row) => sc.text(-6, row * h + h / 2, String(v), { size: 13, anchor: 'end' }));
  sc.caption(0, `Split: ${A.top.join(' + ')} by ${A.side.join(' + ')}`);
  A.boxes.forEach((bx, k) => {
    const step = k + 1;
    const r = sc.rect(bx.col * w, bx.row * h, w, h, { cls: 'box grid' });
    sc.heat(r, [step]);
    sc.text(bx.col * w + w / 2, bx.row * h + h / 2, String(bx.value), { step, size: 13 });
    const t = topN[bx.col];
    const sd = sideN[bx.row];
    if (t) sc.heat(t, [step]);
    if (sd) sc.heat(sd, [step]);
    sc.caption(step, `${bx.a} × ${bx.b} = ${bx.value}`);
  });
  const last = A.boxes.length + 1;
  sc.text((A.top.length * w) / 2, A.side.length * h + 18, `= ${A.result}`, { step: last, cls: 'answer', size: DRAW.font });
  sc.caption(last, `Add the boxes: ${A.boxes.map((x) => x.value).join(' + ')} = ${A.result}`);
  return sc.fit();
}

function drawPartial(a: number, b: number): Scene {
  const sc = new Scene();
  const P = partialProducts(a, b);
  sc.text(0, 0, `${a} × ${b}`, { anchor: 'end', size: DRAW.font });
  sc.caption(0, 'Multiply every place-value part by every other part');
  P.lines.forEach((ln, k) => {
    const step = k + 1;
    const y = (k + 1) * DRAW.rowH;
    sc.text(-70, y, `${ln.a} × ${ln.b}`, { step, anchor: 'end', size: 13, cls: 'muted-text' });
    sc.text(0, y, String(ln.value), { step, anchor: 'end', size: DRAW.font });
    sc.caption(step, `${ln.a} × ${ln.b} = ${ln.value}`);
  });
  const last = P.lines.length + 1;
  const y = (P.lines.length + 1) * DRAW.rowH;
  sc.line(-66, y - DRAW.rowH * 0.5, 2, y - DRAW.rowH * 0.5, { step: last });
  sc.text(0, y + 4, String(P.result), { step: last, anchor: 'end', cls: 'answer', size: DRAW.font });
  sc.caption(last, `Add them up: ${P.result}`);
  return sc.fit();
}

function drawPeasant(a: number, b: number): Scene {
  const sc = new Scene();
  const P = peasant(a, b);
  const right = 120;
  sc.text(0, 0, 'halve', { anchor: 'end', size: 11, cls: 'muted-text' });
  sc.text(right, 0, 'double', { anchor: 'end', size: 11, cls: 'muted-text' });
  sc.caption(0, `Halve ${a} (drop remainders), double ${b}`);
  const strike = P.rows.length + 1;
  const keep = strike + 1;
  const kept: SVGElement[] = [];
  P.rows.forEach((r, k) => {
    const step = k + 1;
    const y = (k + 1) * (DRAW.rowH - 2);
    sc.text(0, y, String(r.half), { step, anchor: 'end', size: 14 });
    const d = sc.text(right, y, String(r.double), { step, anchor: 'end', size: 14 });
    if (r.keep) kept.push(d);
    else sc.line(-40, y, right + 4, y, { step: strike, cls: 'stroke strike' });
    sc.caption(step, k === 0 ? `${r.half} | ${r.double}` : `${P.rows[k - 1]?.half} ÷ 2 → ${r.half},  ${P.rows[k - 1]?.double} × 2 → ${r.double}`);
  });
  sc.caption(strike, 'Cross out rows where the left number is even');
  for (const k of kept) sc.heat(k, [keep]);
  const y = (P.rows.length + 1) * (DRAW.rowH - 2) + 6;
  sc.text(right, y, `= ${P.result}`, { step: keep, anchor: 'end', cls: 'answer', size: DRAW.font });
  sc.caption(keep, `Add what's left: ${kept.map((k) => k.textContent).join(' + ')} = ${P.result}`);
  return sc.fit();
}

function drawLines(a: number, b: number): Scene {
  const sc = new Scene();
  const L = lines(a, b);
  const { lineGap: g, groupGap: G, dotR } = DRAW;
  // Lay out in (u, v), then turn 45° so crossings of the same place line up in columns: x = (u+v)/√2, y = (v−u)/√2.
  const offsets = (ds: number[]) => {
    let at = 0;
    return ds.map((d) => {
      const k = Math.max(1, d);
      const pos = Array.from({ length: k }, (_, i) => at + i * g);
      at += (k - 1) * g + G;
      return pos;
    });
  };
  const vA = offsets(L.aDigits);
  const uB = offsets(L.bDigits);
  const uMax = Math.max(...uB.flat()) + 10;
  const vMax = Math.max(...vA.flat()) + 10;
  const R = Math.SQRT1_2;
  const P = (u: number, v: number) => ({ x: (u + v) * R * 1.6, y: (v - u) * R * 1.6 });
  L.aDigits.forEach((d, i) =>
    (vA[i] ?? []).forEach((v) => {
      const p = P(-10, v);
      const q = P(uMax, v);
      sc.line(p.x, p.y, q.x, q.y, { step: 0, cls: d === 0 ? 'stroke lineA zero' : 'stroke lineA' });
    }),
  );
  sc.caption(0, `${a}: ${L.aDigits.join(', ')} lines`);
  L.bDigits.forEach((d, j) =>
    (uB[j] ?? []).forEach((u) => {
      const p = P(u, -10);
      const q = P(u, vMax);
      sc.line(p.x, p.y, q.x, q.y, { step: 1, cls: d === 0 ? 'stroke lineB zero' : 'stroke lineB' });
    }),
  );
  sc.caption(1, `${b}: ${L.bDigits.join(', ')} lines across`);
  const bottom = Math.max(P(uMax, vMax).y, P(-10, vMax).y) + 18;
  const colX: number[] = [];
  for (let place = 0; place < L.aDigits.length + L.bDigits.length - 1; place++) {
    const step = 2 + place;
    const xs: number[] = [];
    for (const cr of L.crossings.filter((x) => x.place === place)) {
      if (cr.count === 0) continue;
      for (const v of vA[cr.aIndex] ?? []) for (const u of uB[cr.bIndex] ?? []) {
        const p = P(u, v);
        xs.push(p.x);
        sc.dot(p.x, p.y, dotR, { step });
      }
    }
    const group = L.crossings.filter((x) => x.place === place);
    const mean = (ps: number[]) => sum(ps) / Math.max(1, ps.length);
    const x = xs.length ? mean(xs) : P(mean(uB[group[0]?.bIndex ?? 0] ?? [0]), mean(vA[group[0]?.aIndex ?? 0] ?? [0])).x;
    colX[place] = x;
    sc.text(x, bottom, String(sum(group.map((cr) => cr.count))), { step, size: 13 });
    sc.caption(step, `Count the crossings: ${group.map((cr) => cr.count).join(' + ')} = ${sum(group.map((cr) => cr.count))}`);
  }
  const carryStep = 2 + (L.aDigits.length + L.bDigits.length - 1);
  L.columns.forEach((col, k) => {
    const x = colX[k] ?? (colX[k - 1] ?? 0) - 30;
    sc.text(x, bottom + 22, String(col.digit), { step: carryStep, cls: 'answer', size: DRAW.font });
  });
  const carries = L.columns.filter((c) => c.carryOut).length;
  sc.caption(carryStep, `${carries ? 'Carry the tens leftward' : 'No carrying needed'}: ${L.result}`);
  return sc.fit();
}

export interface Method {
  id: MethodId;
  title: string;
  draw: (a: number, b: number) => Scene;
}

export const METHODS: Method[] = [
  { id: 'standard', title: 'Standard', draw: drawStandard },
  { id: 'lattice', title: 'Lattice', draw: drawLattice },
  { id: 'area', title: 'Area / box', draw: drawArea },
  { id: 'partial', title: 'Partial products', draw: drawPartial },
  { id: 'peasant', title: 'Halve & double', draw: drawPeasant },
  { id: 'lines', title: 'Lines', draw: drawLines },
];
