/**
 * Counting choices: how many ways to choose r things from n (n choose r), five ways.
 * Every function is pure and returns its working plus the count; the tests check them against each other
 * and against textbook values. Items are numbered 0..n−1; the client names them A, B, C…
 */

export const factorial = (k: number): number => (k <= 1 ? 1 : k * factorial(k - 1));

// 1. List them: write every choice in order, grouped by its first item.
export function listChoices(n: number, r: number): { sets: number[][]; count: number } {
  const sets: number[][] = [];
  const pick = (from: number, chosen: number[]) => {
    if (chosen.length === r) {
      sets.push(chosen);
      return;
    }
    for (let k = from; k <= n - (r - chosen.length); k++) pick(k + 1, [...chosen, k]);
  };
  if (r >= 0 && r <= n) pick(0, []);
  return { sets, count: sets.length };
}

// 2. Tree diagram: for each item decide in or out, pruning branches that can no longer end with exactly r in.
export interface TreeNode {
  depth: number;
  /** How many items are in so far. */
  taken: number;
  /** Index of the parent node, −1 for the root. */
  parent: number;
  /** Was the last item taken (in) or left (out)? Root: false. */
  inn: boolean;
  /** The items taken on the way here. */
  path: number[];
}
export function tree(n: number, r: number): { nodes: TreeNode[]; leaves: number[]; count: number } {
  const nodes: TreeNode[] = [{ depth: 0, taken: 0, parent: -1, inn: false, path: [] }];
  const leaves: number[] = [];
  const grow = (i: number) => {
    const node = nodes[i];
    if (!node) return;
    if (node.depth === n) {
      if (node.taken === r) leaves.push(i);
      return;
    }
    const left = n - node.depth - 1;
    if (node.taken < r) {
      nodes.push({ depth: node.depth + 1, taken: node.taken + 1, parent: i, inn: true, path: [...node.path, node.depth] });
      grow(nodes.length - 1);
    }
    if (left >= r - node.taken) {
      nodes.push({ depth: node.depth + 1, taken: node.taken, parent: i, inn: false, path: node.path });
      grow(nodes.length - 1);
    }
  };
  if (r >= 0 && r <= n) grow(0);
  return { nodes, leaves, count: leaves.length };
}

// 3. Formula: n! / (r! (n − r)!). The (n − r)! cancels, leaving r falling factors over r!.
export function formula(n: number, r: number): { top: number[]; bottom: number[]; num: number; den: number; count: number } {
  const k = Math.min(r, n - r);
  const top = Array.from({ length: k }, (_, i) => n - i);
  const bottom = Array.from({ length: k }, (_, i) => k - i);
  const num = top.reduce((s, x) => s * x, 1);
  const den = bottom.reduce((s, x) => s * x, 1);
  return { top, bottom, num, den, count: num / den };
}

// 4. Pascal's triangle: each entry is the sum of the two above it; row n, place r is the answer.
export function pascal(n: number, r: number): { rows: number[][]; count: number } {
  const rows: number[][] = [[1]];
  for (let i = 1; i <= n; i++) {
    const prev = rows[i - 1] ?? [];
    rows.push(Array.from({ length: i + 1 }, (_, k) => (prev[k - 1] ?? 0) + (prev[k] ?? 0)));
  }
  return { rows, count: rows[n]?.[r] ?? 0 };
}

// 5. Ordered picks ÷ orders: pick one at a time (n, then n − 1…), then divide out the r! orders of each choice.
export function orderedPicks(n: number, r: number): { slots: number[]; ordered: number; orders: number; count: number } {
  const slots = Array.from({ length: r }, (_, i) => n - i);
  const ordered = slots.reduce((s, x) => s * x, 1);
  const orders = factorial(r);
  return { slots, ordered, orders, count: ordered / orders };
}

export const COUNTING_IDS = ['list', 'tree', 'formula', 'pascal', 'ordered'] as const;
export type CountingId = (typeof COUNTING_IDS)[number];

export function countAll(n: number, r: number): Record<CountingId, number> {
  return {
    list: listChoices(n, r).count,
    tree: tree(n, r).count,
    formula: formula(n, r).count,
    pascal: pascal(n, r).count,
    ordered: orderedPicks(n, r).count,
  };
}

/** The first `max` orderings of items 0..r−1, in dictionary order: the r! ways one choice gets counted when order matters. */
export function firstOrders(r: number, max: number): number[][] {
  const out: number[][] = [];
  const go = (rest: number[], built: number[]) => {
    if (out.length >= max) return;
    if (!rest.length) {
      out.push(built);
      return;
    }
    for (const x of rest) go(rest.filter((y) => y !== x), [...built, x]);
  };
  go(Array.from({ length: r }, (_, i) => i), []);
  return out;
}
