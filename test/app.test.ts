import { describe, expect, it } from 'vitest';
import { app, applySegment, DEFAULT_RULES, multiplier, problemFor, runOver, startRun, type Run } from '../src/app';
import { TOPICS } from '../src/catalog';
import { area, carryColumns, digits, lattice, lines, parts, peasant, solveAll, standard } from '../src/math';

describe('six multiplication methods', () => {
  it('all six land on a × b across a sweep of inputs', () => {
    for (let a = 1; a <= 999; a += 7) {
      for (const b of [1, 2, 9, 10, 23, 47, 99, 100, 305, 999]) {
        const all = solveAll(a, b);
        for (const [method, got] of Object.entries(all)) expect(got, `${method} ${a}×${b}`).toBe(a * b);
      }
    }
  });

  it('splits numbers into digits and place-value parts', () => {
    expect(digits(347)).toEqual([3, 4, 7]);
    expect(parts(347)).toEqual([300, 40, 7]);
    expect(parts(305)).toEqual([300, 5]);
    expect(parts(0)).toEqual([0]);
  });

  it('lattice: 47 × 23 has the textbook cells and diagonal sums', () => {
    const l = lattice(47, 23);
    expect(l.cells.find((c) => c.row === 0 && c.col === 1)).toMatchObject({ tens: 1, ones: 4, diag: 1 }); // 7×2 = 14
    expect(l.columns.map((c) => c.digit)).toEqual([1, 8, 0, 1]); // 1081 read right to left
    expect(l.columns[2]).toMatchObject({ sum: 10, carryIn: 0, digit: 0, carryOut: 1 }); // 1 + 1 + 8 on the hundreds diagonal
  });

  it('carries columns: [12, 15] → 162', () => {
    expect(carryColumns([12, 15]).result).toBe(162);
  });

  it('standard shifts each partial row by its place', () => {
    expect(standard(47, 23).rows.map((r) => r.value)).toEqual([141, 940]);
  });

  it('area boxes are place-value products', () => {
    expect(area(47, 23).boxes.map((b) => b.value)).toEqual([800, 140, 120, 21]);
  });

  it('halve & double keeps only the odd rows', () => {
    const p = peasant(13, 7);
    expect(p.rows.map((r) => r.half)).toEqual([13, 6, 3, 1]);
    expect(p.rows.filter((r) => r.keep).map((r) => r.double)).toEqual([7, 28, 56]);
  });

  it('lines counts crossings per place', () => {
    const l = lines(12, 13);
    expect(l.crossings.map((c) => c.count)).toEqual([1, 3, 2, 6]);
    expect(l.result).toBe(156);
  });
});

describe('catalog', () => {
  it('every topic has at least two methods and a unique id', () => {
    expect(new Set(TOPICS.map((t) => t.id)).size).toBe(TOPICS.length);
    for (const t of TOPICS) expect(t.methods.length, t.id).toBeGreaterThanOrEqual(2);
  });
});

describe('Lock Lattice rules', () => {
  const answer = (run: Run, round: number, right = true) => {
    const p = problemFor(DEFAULT_RULES, run, round);
    return { round, answer: right ? p.a * p.b : p.a * p.b + 1 };
  };

  it('is deterministic and sizes problems by level', () => {
    const run = startRun(42);
    expect(problemFor(DEFAULT_RULES, run, 1)).toEqual(problemFor(DEFAULT_RULES, run, 1));
    const p = problemFor(DEFAULT_RULES, run, 1);
    expect(digits(p.a)).toHaveLength(2);
    expect(digits(p.b)).toHaveLength(1);
    const p3 = problemFor(DEFAULT_RULES, { seed: 42, level: 3 }, 1);
    expect(digits(p3.a)).toHaveLength(3);
    expect(digits(p3.b)).toHaveLength(3);
    expect(String(p3.a)).not.toContain('0');
  });

  it('a streak grows the multiplier and the level; a miss resets the streak and drops a level', () => {
    let run = startRun(7);
    run = applySegment(DEFAULT_RULES, run, answer(run, 1))!;
    expect(run).toMatchObject({ points: 10, streak: 1, level: 0 });
    run = applySegment(DEFAULT_RULES, run, answer(run, 2))!;
    expect(run).toMatchObject({ points: 30, streak: 2, level: 1 });
    run = applySegment(DEFAULT_RULES, run, answer(run, 3, false))!;
    expect(run).toMatchObject({ points: 30, streak: 0, level: 0, best: 2 });
    expect(multiplier(DEFAULT_RULES, 99)).toBe(DEFAULT_RULES.maxMultiplier);
  });

  it('rejects rounds out of order and ends after the last round', () => {
    let run = startRun(1);
    expect(applySegment(DEFAULT_RULES, run, { round: 2, answer: 0 })).toBeNull();
    for (let r = 1; r <= DEFAULT_RULES.rounds; r++) run = applySegment(DEFAULT_RULES, run, answer(run, r))!;
    expect(runOver(DEFAULT_RULES, run)).toBe(true);
    expect(applySegment(DEFAULT_RULES, run, { round: DEFAULT_RULES.rounds + 1, answer: 0 })).toBeNull();
  });

  it('the server replays a run to the same score the client shows', () => {
    const solo = app.solo!;
    let server = solo.start(app.defaultConfig, 9);
    let client = startRun(9);
    for (let round = 1; round <= DEFAULT_RULES.rounds; round++) {
      const seg = answer(client, round, round % 4 !== 0);
      const parsed = solo.parseSegment(JSON.parse(JSON.stringify(seg)));
      expect(parsed).not.toBeNull();
      const out = solo.apply(app.defaultConfig, server, parsed!);
      if ('error' in out) throw new Error(out.error);
      server = out.run;
      client = applySegment(DEFAULT_RULES, client, seg)!;
    }
    expect(solo.isOver(server)).toBe(true);
    expect(solo.score(server)).toBe(client.points);
  });

  it('rejects malformed segments', () => {
    const solo = app.solo!;
    for (const bad of [null, [], { round: 1 }, { round: 1, answer: -1 }, { round: 1, answer: 1e7 }, { round: '1', answer: 2 }, { round: 1, answer: 2, extra: 1 }])
      expect(solo.parseSegment(bad)).toBeNull();
  });
});
