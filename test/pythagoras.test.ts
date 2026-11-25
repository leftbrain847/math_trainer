import { describe, expect, it } from 'vitest';
import { bhaskara, cText, euclid, garfield, hypotenuse, polygonArea, PYTHAGORAS_IDS, rearranged, similar } from '../src/topics/pythagoras';

// Slider ranges in src/client/topics/pythagoras.ts: a 1–12, b 1–12.
const VALUES = Array.from({ length: 12 }, (_, i) => i + 1);
const sum = (polys: [number, number][][]) => polys.reduce((s, p) => s + polygonArea(p), 0);

describe('five proofs of a² + b² = c²', () => {
  for (const a of VALUES)
    for (const b of VALUES) {
      it(`a=${a}, b=${b}`, () => {
        const c2 = a * a + b * b;
        const R = rearranged(a, b);
        expect(sum(R.leftTris) + polygonArea(R.tilted)).toBeCloseTo(R.big, 9);
        expect(sum(R.rightTris) + polygonArea(R.a2) + polygonArea(R.b2)).toBeCloseTo(R.big, 9);
        expect(polygonArea(R.tilted)).toBeCloseTo(c2, 9);

        const S = similar(a, b);
        expect(S.left + S.right).toBeCloseTo(S.wholeArea, 9);
        expect(S.left / S.wholeArea).toBeCloseTo(S.ratioA ** 2, 9);
        expect(S.right / S.wholeArea).toBeCloseTo(S.ratioB ** 2, 9);
        expect(S.ratioA ** 2 + S.ratioB ** 2).toBeCloseTo(1, 12);

        const G = garfield(a, b);
        expect(polygonArea(G.trapezoid)).toBeCloseTo(G.trapArea, 9);
        expect(polygonArea(G.tri1) + polygonArea(G.tri2) + polygonArea(G.middle)).toBeCloseTo(G.trapArea, 9);
        expect(2 * polygonArea(G.middle)).toBeCloseTo(c2, 9);

        const E = euclid(a, b);
        expect(polygonArea(E.sqA)).toBeCloseTo(a * a, 9);
        expect(polygonArea(E.sqB)).toBeCloseTo(b * b, 9);
        expect(polygonArea(E.rectA)).toBeCloseTo(a * a, 9);
        expect(polygonArea(E.rectB)).toBeCloseTo(b * b, 9);
        expect(polygonArea(E.sqC)).toBeCloseTo(c2, 9);

        const B = bhaskara(a, b);
        expect(polygonArea(B.outer)).toBeCloseTo(c2, 9);
        expect(sum(B.tris) + polygonArea(B.inner)).toBeCloseTo(c2, 9);
        expect(B.tris4 + B.innerArea).toBe(c2);

        expect(hypotenuse(a, b).c).toBeCloseTo(Math.hypot(a, b), 12);
      });
    }

  it('textbook cases: 3-4-5, 5-12-13, 1-1-√2', () => {
    expect(cText(3, 4)).toBe('5');
    expect(cText(5, 12)).toBe('13');
    expect(cText(1, 1)).toBe('1.41');
    expect(cText(2, 3)).toBe('3.61');
    expect(hypotenuse(6, 8)).toEqual({ c2: 100, c: 10, whole: true });
  });

  it('has five proofs', () => expect(PYTHAGORAS_IDS).toHaveLength(5));
});
