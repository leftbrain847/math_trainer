/** Every built topic grid, found automatically: each file in ./topics/ exports `grid`. */
import type { GridSpec } from './grid';

const modules = import.meta.glob<{ grid: GridSpec }>('./topics/*.ts', { eager: true });

export const GRIDS: Record<string, GridSpec> = Object.fromEntries(Object.values(modules).map((m) => [m.grid.id, m.grid]));
