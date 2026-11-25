import type { GridSpec } from '../grid';
import { METHODS } from '../methods';

export const grid: GridSpec = {
  id: 'multiplication',
  sliders: [
    { label: 'a', start: 47, min: 2, max: 999 },
    { label: 'b', start: 23, min: 2, max: 999 },
  ],
  methods: METHODS.map((m) => ({ id: m.id, title: m.title, draw: ([a = 2, b = 2]) => m.draw(a, b) })),
  problem: ([a = 2, b = 2]) => `${a} × ${b} = ${a * b}`,
};
