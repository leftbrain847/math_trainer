import { DIVISION_METHODS } from '../division-methods';
import type { GridSpec } from '../grid';

export const grid: GridSpec = {
  id: 'division',
  sliders: [
    { label: 'n', start: 1597, min: 2, max: 9999 },
    { label: 'd', start: 12, min: 2, max: 99 },
  ],
  methods: DIVISION_METHODS.map((m) => ({ id: m.id, title: m.title, draw: ([n = 2, d = 2]) => m.draw(n, d) })),
  problem: ([n = 2, d = 2]) => `${n} ÷ ${d} = ${Math.floor(n / d)}${n % d ? ` r ${n % d}` : ''}`,
};
