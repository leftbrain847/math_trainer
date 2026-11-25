import { describe, expect, it } from 'vitest';
import { archimedes, area, CIRCLE_IDS, cos2Integral, countSquares, integration, onionRings, polygonArea, ringArea, sliceCircle, slices, sliceStrip, unrolledRing } from '../src/topics/circle-area';

// Slider range in src/client/topics/circle-area.ts: r 1–20.
const RS = Array.from({ length: 20 }, (_, i) => i + 1);

describe('area of a circle', () => {
  it('rearranged slices: πr wide × r tall, and the strip holds the same pieces as the circle', () => {
    for (const r of RS) expect(slices(r).answer).toBeCloseTo(area(r), 9);
    for (const K of [8, 24]) {
      const strip = sliceStrip(K, 64).reduce((s, p) => s + polygonArea(p), 0);
      const circle = sliceCircle(K, 64).reduce((s, p) => s + polygonArea(p), 0);
      expect(strip).toBeCloseTo(circle, 9);
      expect(circle).toBeCloseTo(Math.PI, 2);
    }
  });

  it('Archimedes: inner < πr² < outer, and the gap shrinks to under 0.2% at 96 sides', () => {
    for (const r of RS) {
      const rows = archimedes(r);
      for (const row of rows) {
        expect(row.inner).toBeLessThan(area(r));
        expect(row.outer).toBeGreaterThan(area(r));
      }
      for (let i = 1; i < rows.length; i++) expect((rows[i]?.outer ?? 0) - (rows[i]?.inner ?? 0)).toBeLessThan((rows[i - 1]?.outer ?? 0) - (rows[i - 1]?.inner ?? 0));
      const last = rows[rows.length - 1];
      expect(((last?.outer ?? 0) - (last?.inner ?? 0)) / area(r)).toBeLessThan(2e-3);
    }
  });

  it('onion rings: each ring unrolls with its area intact; the staircase over-counts by exactly πr²/k', () => {
    expect(unrolledRing(2, 3)).toBeCloseTo(ringArea(2, 3), 12);
    for (const r of RS) {
      const O = onionRings(r);
      expect(O.answer).toBeCloseTo(area(r), 9);
      for (const row of O.rows) expect(row.staircase - area(r)).toBeCloseTo(area(r) / row.k, 6);
    }
  });

  it('integration: strips close in on πr² (within 0.01% at 1000) and the substitution integral is π', () => {
    expect(cos2Integral()).toBeCloseTo(Math.PI, 6);
    for (const r of RS) {
      const I = integration(r);
      expect(I.answer).toBeCloseTo(area(r), 9);
      const errs = I.rows.map((x) => Math.abs(x.value - area(r)));
      for (let i = 1; i < errs.length; i++) expect(errs[i]).toBeLessThan(errs[i - 1] ?? 0);
      expect((errs[errs.length - 1] ?? 1) / area(r)).toBeLessThan(1e-4);
    }
  });

  it('counting squares: inside ≤ πr² ≤ touching, with at most 8r squares between, so the gap shrinks like 1/r', () => {
    for (const r of RS) {
      const C = countSquares(r);
      expect(C.inside).toBeLessThanOrEqual(area(r));
      expect(C.touching).toBeGreaterThanOrEqual(area(r));
      expect(C.touching - C.inside).toBeLessThanOrEqual(8 * r);
      expect(Math.abs(C.estimate - area(r)) / area(r)).toBeLessThanOrEqual(4 / (Math.PI * r));
    }
  });

  it('textbook cases: r = 5 counts 60 inside and 88 touching; r = 1 is π', () => {
    expect(countSquares(5)).toMatchObject({ inside: 60, touching: 88 });
    expect(slices(1).answer).toBeCloseTo(Math.PI, 12);
    expect(archimedes(1, [6])[0]?.inner).toBeCloseTo((3 * Math.sqrt(3)) / 2, 12);
  });

  it('has five methods', () => expect(CIRCLE_IDS).toHaveLength(5));
});
