/**
 * Lock Lattice: the game side of Math Trainer. Each round shows a lattice; the player dials the answer
 * in like a luggage-lock code. A streak grows the multiplier and the problems, a miss shrinks them,
 * so the game keeps itself at the edge of the player's skill.
 *
 * All logic is pure and deterministic (no clock, no Math.random): the problems come from the seed,
 * so the server can replay a run to check its score.
 */
import type { GameModule } from '@app-builder/host';
import config from '../app.config.json';

export interface Level {
  /** Digits in the top number and the side number. */
  aDigits: number;
  bDigits: number;
}

export interface Rules {
  rounds: number;
  basePoints: number;
  /** The multiplier is 1 + the current streak, capped here. */
  maxMultiplier: number;
  /** Correct answers in a row needed to move up a level. */
  levelUpEvery: number;
  levels: Level[];
}

export const DEFAULT_RULES: Rules = {
  rounds: 12,
  basePoints: 10,
  maxMultiplier: 5,
  levelUpEvery: 2,
  levels: [
    { aDigits: 2, bDigits: 1 },
    { aDigits: 2, bDigits: 2 },
    { aDigits: 3, bDigits: 2 },
    { aDigits: 3, bDigits: 3 },
  ],
};

export interface Run {
  seed: number;
  round: number;
  points: number;
  streak: number;
  best: number;
  /** Index into rules.levels. */
  level: number;
  /** Correct answers since the last level change. */
  climb: number;
}

export interface Segment {
  round: number;
  answer: number;
}

export interface Problem {
  a: number;
  b: number;
}

/** A 32-bit mix of (seed, round, salt): same inputs, same output in every JavaScript engine. */
function mix(seed: number, round: number, salt: number): number {
  let h = (seed ^ Math.imul(round + 1, 2654435761) ^ Math.imul(salt + 1, 40503)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 2246822507) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

/** A number with exactly n digits, no zeros (zeros make empty lattice cells, which teach little). */
function nDigits(seed: number, round: number, salt: number, n: number): number {
  let v = 0;
  for (let i = 0; i < n; i++) v = v * 10 + (mix(seed, round, salt * 10 + i) % 9) + 1;
  return v;
}

export function problemFor(rules: Rules, run: Pick<Run, 'seed' | 'level'>, round: number): Problem {
  const lv = rules.levels[Math.min(run.level, rules.levels.length - 1)] ?? { aDigits: 2, bDigits: 1 };
  return { a: nDigits(run.seed, round, 1, lv.aDigits), b: nDigits(run.seed, round, 2, lv.bDigits) };
}

export const startRun = (seed: number): Run => ({ seed, round: 0, points: 0, streak: 0, best: 0, level: 0, climb: 0 });

export const multiplier = (rules: Rules, streak: number): number => Math.min(rules.maxMultiplier, 1 + streak);

export function applySegment(rules: Rules, run: Run, seg: Segment): Run | null {
  if (seg.round !== run.round + 1 || seg.round > rules.rounds) return null;
  const p = problemFor(rules, run, seg.round);
  const right = seg.answer === p.a * p.b;
  if (!right) {
    return { ...run, round: seg.round, streak: 0, level: Math.max(0, run.level - 1), climb: 0 };
  }
  const streak = run.streak + 1;
  const climb = run.climb + 1;
  const up = climb >= rules.levelUpEvery && run.level < rules.levels.length - 1;
  return {
    ...run,
    round: seg.round,
    points: run.points + rules.basePoints * multiplier(rules, run.streak),
    streak,
    best: Math.max(run.best, streak),
    level: up ? run.level + 1 : run.level,
    climb: up ? 0 : climb,
  };
}

export const runOver = (rules: Rules, run: Run): boolean => run.round >= rules.rounds;

const MAX_ANSWER = 999_999;

function parseSegment(raw: unknown): Segment | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (Object.keys(r).length !== 2) return null;
  const { round, answer } = r;
  if (!Number.isInteger(round) || !Number.isInteger(answer)) return null;
  return (answer as number) >= 0 && (answer as number) <= MAX_ANSWER ? { round: round as number, answer: answer as number } : null;
}

export const app: GameModule<Rules, null, never, null> = {
  id: config.id,
  defaultConfig: DEFAULT_RULES,
  // Solo apps have no room; these limits are unused but required by the contract.
  limits: { tickHz: 0, snapshotHz: 0, minPlayers: 1, maxPlayers: 1, maxMsgBytes: 256, maxInputsPerSec: 5 },
  parseInput: () => null,
  init: () => null,
  onInput: () => undefined,
  viewFor: () => null,
  isOver: () => true,
  solo: {
    start: (_rules, seed) => startRun(seed),
    parseSegment,
    apply: (rules, run, seg) => {
      const next = applySegment(rules, run as Run, seg as Segment);
      return next ? { run: next } : { error: 'segment does not fit the rules' };
    },
    isOver: (run) => runOver(DEFAULT_RULES, run as Run),
    score: (run) => (run as Run).points,
    maxSegmentBytes: 256,
    maxSegments: 20,
  },
};
