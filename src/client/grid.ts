/**
 * The contract every topic grid follows. A topic is one file in src/client/topics/ that exports `grid`;
 * src/client/grids.ts picks it up automatically, so adding a topic never touches shared code.
 */
import type { Scene } from './scene';

/** One number the viewer can change. Whole numbers only; a topic maps them to whatever it needs (e.g. v / 10). */
export interface Slider {
  label: string;
  start: number;
  min: number;
  max: number;
}

export interface GridMethod {
  id: string;
  title: string;
  /** Draw the method for the current slider values (same order as `sliders`). Must be pure apart from building the Scene. */
  draw: (v: number[]) => Scene;
}

export interface GridSpec {
  /** Matches the topic id in src/catalog.ts. */
  id: string;
  sliders: Slider[];
  methods: GridMethod[];
  /** The problem and its answer, shown above the grid. */
  problem: (v: number[]) => string;
}
