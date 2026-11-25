import { describe, expect, it } from 'vitest';
import { TOPICS } from '../src/catalog';
import { GRIDS } from '../src/client/grids';

describe('topic grids', () => {
  const grids = Object.values(GRIDS);

  it('finds the built grids, each matching a catalog topic', () => {
    expect(GRIDS.multiplication).toBeDefined();
    expect(GRIDS.division).toBeDefined();
    for (const g of grids) expect(TOPICS.map((t) => t.id), g.id).toContain(g.id);
  });

  it('every grid has 2-6 methods with unique ids, sane sliders and a problem line', () => {
    for (const g of grids) {
      expect(g.methods.length, g.id).toBeGreaterThanOrEqual(2);
      expect(g.methods.length, g.id).toBeLessThanOrEqual(6);
      expect(new Set(g.methods.map((m) => m.id)).size, g.id).toBe(g.methods.length);
      expect(g.sliders.length, g.id).toBeGreaterThanOrEqual(1);
      for (const s of g.sliders) {
        expect(Number.isInteger(s.min) && Number.isInteger(s.max) && Number.isInteger(s.start), `${g.id} ${s.label}`).toBe(true);
        expect(s.min <= s.start && s.start <= s.max, `${g.id} ${s.label}`).toBe(true);
      }
      const corners = [g.sliders.map((s) => s.start), g.sliders.map((s) => s.min), g.sliders.map((s) => s.max)];
      for (const v of corners) expect(g.problem(v).length, `${g.id} ${v}`).toBeGreaterThan(0);
    }
  });
});
