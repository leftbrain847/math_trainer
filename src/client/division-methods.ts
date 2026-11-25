/** The six division drawings. Each turns the pure maths in src/division.ts into a step-by-step Scene. */
import { areaModel, chunking, doubling, longDivision, partialQuotients, shortDivision, type Chunk, type DivisionId } from '../division';
import { digits } from '../math';
import { DRAW } from './methods';
import { Scene } from './scene';

/** Division drawing sizes (SVG units), on top of the shared DRAW sizes. */
export const DIV = {
  busStopCol: 24,
  carrySize: 10,
  areaH: 70,
  areaW: 170,
  areaMinPiece: 40,
};

const qr = (q: number, r: number) => (r ? `${q} r ${r}` : String(q));
const lotsOf = (k: number) => `${k} lot${k === 1 ? '' : 's'}`;
/** The caption when the divisor is bigger than the number, so no method takes anything away. */
const tooBig = (n: number, d: number) => `${d} doesn't go into ${n}: 0 r ${n}`;

/** Digits of n placed so its last digit ends at xRight; one node per digit, ones first. */
function digitsRight(sc: Scene, n: number, xRight: number, y: number, step: number, cls?: string): SVGElement[] {
  return digits(n)
    .reverse()
    .map((v, k) => sc.text(xRight - k * DRAW.digitW - DRAW.digitW / 2, y, String(v), { step, cls, size: DRAW.font }));
}

function drawLong(n: number, d: number): Scene {
  const sc = new Scene();
  const L = longDivision(n, d);
  const cw = DRAW.digitW;
  const row = DRAW.rowH;
  const width = L.digits.length * cw;
  const dividend = L.digits.map((v, j) => sc.text(j * cw + cw / 2, 0, String(v), { size: DRAW.font }));
  sc.text(-10, 0, String(d), { anchor: 'end', size: DRAW.font });
  sc.line(-5, -row * 0.6, width + 4, -row * 0.6);
  sc.line(-5, -row * 0.6, -5, row * 0.55);
  sc.caption(0, `${n} ÷ ${d}: how many ${d}s fit, one digit at a time`);
  L.steps.forEach((s, k) => {
    const step = k + 1;
    const right = (s.end + 1) * cw;
    sc.text(s.end * cw + cw / 2, -row * 1.2, String(s.qDigit), { step, cls: 'answer', size: DRAW.font });
    const yP = row * (1 + 2 * k);
    sc.text(right - digits(s.product).length * cw - 6, yP, '−', { step, size: 13 });
    digitsRight(sc, s.product, right, yP, step);
    sc.line(right - Math.max(2, digits(s.partial).length) * cw - 4, yP + row * 0.5, right + 2, yP + row * 0.5, { step });
    const last = k === L.steps.length - 1;
    const next = last ? s.rem : s.rem * 10 + (L.digits[s.end + 1] ?? 0);
    digitsRight(sc, next, last ? right : right + cw, yP + row, step, last ? 'carry' : undefined);
    if (k === 0) {
      // The first step reads as many leading digits as it needs (15 of 1597): light them all.
      for (let j = s.end - digits(s.partial).length + 1; j <= s.end; j++) {
        const t = dividend[j];
        if (t) sc.heat(t, [step]);
      }
    }
    const bring = dividend[s.end + 1];
    if (!last && bring) sc.heat(bring, [step]);
    sc.caption(step, `${d} into ${s.partial} goes ${s.qDigit} (${s.qDigit} × ${d} = ${s.product}), leaves ${s.rem}${last ? '' : `; bring down ${L.digits[s.end + 1]}`}`);
  });
  const fin = L.steps.length + 1;
  sc.text(width / 2, row * (1 + 2 * L.steps.length) + 4, `= ${qr(L.q, L.r)}`, { step: fin, cls: 'answer', size: DRAW.font });
  sc.caption(fin, `${n} ÷ ${d} = ${qr(L.q, L.r)}`);
  return sc.fit();
}

function drawShort(n: number, d: number): Scene {
  const sc = new Scene();
  const S = shortDivision(n, d);
  const cw = DIV.busStopCol;
  const width = S.digits.length * cw;
  const digitN = S.digits.map((v, j) => sc.text(j * cw + cw / 2 + 4, 0, String(v), { size: DRAW.font }));
  sc.text(-10, 0, String(d), { anchor: 'end', size: DRAW.font });
  sc.line(-5, -14, width + 4, -14);
  sc.line(-5, -14, -5, 12);
  sc.caption(0, `${n} ÷ ${d}: the bus stop, carrying each remainder`);
  S.steps.forEach((s, k) => {
    const step = k + 1;
    const lead = s.qDigit === 0 && S.steps.slice(0, k).every((p) => p.qDigit === 0);
    sc.text(k * cw + cw / 2 + 4, -28, String(s.qDigit), { step, cls: lead ? 'muted-text' : 'answer', size: DRAW.font });
    const t = digitN[k];
    if (t) sc.heat(t, [step]);
    if (s.carryOut && k < S.steps.length - 1) sc.text((k + 1) * cw + 2, -8, String(s.carryOut), { step, cls: 'carry', size: DIV.carrySize });
    sc.caption(step, `${d} into ${s.value} goes ${s.qDigit}, ${s.carryOut} left${k < S.steps.length - 1 && s.carryOut ? ' (carried)' : ''}`);
  });
  const fin = S.steps.length + 1;
  sc.text(width + 8, -28, S.r ? `r ${S.r}` : '', { step: fin, anchor: 'start', cls: 'carry', size: 13 });
  sc.text(width / 2, 30, `= ${qr(S.q, S.r)}`, { step: fin, cls: 'answer', size: DRAW.font });
  sc.caption(fin, `${n} ÷ ${d} = ${qr(S.q, S.r)}`);
  return sc.fit();
}

/** Chunking and partial quotients share a layout: take-away | what's left | how many lots of d. */
function drawChunks(n: number, d: number, chunks: Chunk[], q: number, r: number, intro: string): Scene {
  const sc = new Scene();
  const takeX = 0;
  const leftX = 66;
  const lotsX = 78;
  const row = DRAW.rowH - 2;
  sc.text(leftX, 0, String(n), { anchor: 'end', size: 14 });
  sc.text(lotsX, 0, `÷ ${d}`, { anchor: 'start', size: 12, cls: 'muted-text' });
  sc.caption(0, intro);
  const lots: SVGElement[] = [];
  chunks.forEach((c, k) => {
    const step = k + 1;
    const y = (k + 1) * row;
    sc.text(takeX, y, `−${c.value}`, { step, anchor: 'end', size: 13 });
    sc.text(leftX, y, String(c.left), { step, anchor: 'end', size: 14 });
    lots.push(sc.text(lotsX, y, `${c.count} × ${d}`, { step, anchor: 'start', size: 12, cls: 'muted-text' }));
    sc.caption(step, `Take away ${lotsOf(c.count)} of ${d} (${c.value}), ${c.left} left`);
  });
  const fin = chunks.length + 1;
  for (const l of lots) sc.heat(l, [fin]);
  const y = (chunks.length + 1) * row + 6;
  sc.text(leftX, y, `= ${qr(q, r)}`, { step: fin, anchor: 'end', cls: 'answer', size: DRAW.font });
  sc.caption(fin, chunks.length ? `Add the lots: ${chunks.map((c) => c.count).join(' + ')} = ${q}${r ? `, ${r} left over` : ''}` : tooBig(n, d));
  return sc.fit();
}

function drawChunking(n: number, d: number): Scene {
  const C = chunking(n, d);
  return drawChunks(n, d, C.chunks, C.q, C.r, `Take away easy lots of ${d} (100s, 50s, 10s…)`);
}

function drawPartial(n: number, d: number): Scene {
  const P = partialQuotients(n, d);
  return drawChunks(n, d, P.chunks, P.q, P.r, `Take away the biggest place-value lots of ${d}`);
}

function drawDoubling(n: number, d: number): Scene {
  const sc = new Scene();
  const D = doubling(n, d);
  const right = 110;
  const row = DRAW.rowH - 4;
  sc.text(0, 0, 'lots', { anchor: 'end', size: 11, cls: 'muted-text' });
  sc.text(right, 0, `× ${d}`, { anchor: 'end', size: 11, cls: 'muted-text' });
  sc.caption(0, `Double ${d} until the next double passes ${n}`);
  const build = D.rows.length;
  const nodes = D.rows.map((r, k) => {
    const step = k + 1;
    const y = (k + 1) * row;
    const a = sc.text(0, y, String(r.times), { step, anchor: 'end', size: 13 });
    const b = sc.text(right, y, String(r.value), { step, anchor: 'end', size: 13 });
    sc.caption(step, k === 0 ? `1 × ${d} = ${d}` : `Double: ${D.rows[k - 1]?.value} + ${D.rows[k - 1]?.value} = ${r.value}`);
    return { r, a, b, y };
  });
  let left = n;
  let step = build;
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    if (!node) continue;
    step++;
    if (node.r.take) {
      sc.heat(node.a, [step]);
      sc.heat(node.b, [step]);
      sc.text(right + 8, node.y, '✓', { step, anchor: 'start', size: 12, cls: 'carry' });
      sc.caption(step, `${node.r.value} fits in ${left}: take it, ${left - node.r.value} left`);
      left -= node.r.value;
    } else {
      sc.line(-30, node.y, right + 4, node.y, { step, cls: 'stroke strike' });
      sc.caption(step, `${node.r.value} is more than ${left}: skip it`);
    }
  }
  const fin = step + 1;
  const taken = D.rows.filter((r) => r.take).map((r) => r.times).reverse();
  sc.text(right, (D.rows.length + 1) * row + 6, `= ${qr(D.q, D.r)}`, { step: fin, anchor: 'end', cls: 'answer', size: DRAW.font });
  sc.caption(fin, taken.length ? `Add the lots taken: ${taken.join(' + ')} = ${D.q}${D.r ? `, ${D.r} left over` : ''}` : tooBig(n, d));
  return sc.fit();
}

function drawArea(n: number, d: number): Scene {
  const sc = new Scene();
  const A = areaModel(n, d);
  const H = DIV.areaH;
  const total = Math.max(1, A.q);
  const widths = A.pieces.map((p) => Math.max(DIV.areaMinPiece, (p.count / total) * DIV.areaW));
  sc.text(-6, H / 2, String(d), { anchor: 'end', size: 14 });
  sc.caption(0, `A rectangle ${d} tall with area ${n}: how wide is it?`);
  let x = 0;
  A.pieces.forEach((p, k) => {
    const step = k + 1;
    const w = widths[k] ?? DIV.areaMinPiece;
    const r = sc.rect(x, 0, w, H, { step, cls: 'box grid' });
    sc.heat(r, [step]);
    sc.text(x + w / 2, -12, String(p.count), { step, cls: 'answer', size: 13 });
    sc.text(x + w / 2, H / 2, String(p.value), { step, size: 13 });
    sc.caption(step, `${p.count} × ${d} = ${p.value}, ${p.left} of the area left`);
    x += w;
  });
  const fin = A.pieces.length + 1;
  if (A.r) {
    const rx = x + (x ? 4 : 0);
    sc.rect(rx, H / 2, 30, H / 2, { step: fin, cls: 'box grid' });
    sc.text(rx + 15, H * 0.75, `r${A.r}`, { step: fin, size: 11, cls: 'carry' });
    x = rx + 30;
  }
  sc.text(x / 2, H + 16, `= ${qr(A.q, A.r)}`, { step: fin, cls: 'answer', size: DRAW.font });
  sc.text(x / 2, H + 34, `area ${n}`, { size: 11, cls: 'muted-text' });
  sc.caption(fin, A.pieces.length ? `Width: ${A.pieces.map((p) => p.count).join(' + ')} = ${A.q}${A.r ? `, ${A.r} doesn't fill a column` : ''}` : tooBig(n, d));
  return sc.fit();
}

export interface DivisionMethod {
  id: DivisionId;
  title: string;
  draw: (n: number, d: number) => Scene;
}

export const DIVISION_METHODS: DivisionMethod[] = [
  { id: 'long', title: 'Long division', draw: drawLong },
  { id: 'short', title: 'Short (bus stop)', draw: drawShort },
  { id: 'chunking', title: 'Chunking', draw: drawChunking },
  { id: 'partial', title: 'Partial quotients', draw: drawPartial },
  { id: 'doubling', title: 'Doubling', draw: drawDoubling },
  { id: 'area', title: 'Area model', draw: drawArea },
];
