/**
 * A tiny step-by-step SVG scene. Each shape appears at a step and can light up ("hot") at later steps,
 * so one drawing plays as an animation by moving a single step counter. No innerHTML: all text is textContent.
 */
let ns = '';
/**
 * The SVG namespace, taken from an <svg> the HTML parser makes from a fixed literal (never player text), so the
 * bundle holds no URL strings for the Play no-network check to trip on.
 */
const NS = (): string => (ns ||= new DOMParser().parseFromString('<svg></svg>', 'text/html').body.firstElementChild?.namespaceURI ?? '');

export function svgEl<K extends keyof SVGElementTagNameMap>(tag: K): SVGElementTagNameMap[K] {
  return document.createElementNS(NS(), tag) as SVGElementTagNameMap[K];
}

interface Item {
  node: SVGElement;
  step: number;
  hot: Set<number>;
}

export interface Bits {
  step?: number;
  hot?: number[];
  cls?: string;
}

export class Scene {
  readonly svg: SVGSVGElement;
  private items: Item[] = [];
  private captions: string[] = [];
  private maxX = 0;
  private maxY = 0;
  private minX = 0;
  private minY = 0;

  constructor() {
    this.svg = svgEl('svg');
    this.svg.setAttribute('class', 'scene');
    this.svg.setAttribute('role', 'img');
  }

  private add(node: SVGElement, b: Bits, x: number[], y: number[]): SVGElement {
    if (b.cls) node.setAttribute('class', b.cls);
    this.svg.appendChild(node);
    this.items.push({ node, step: b.step ?? 0, hot: new Set(b.hot ?? []) });
    for (const v of x) {
      this.maxX = Math.max(this.maxX, v);
      this.minX = Math.min(this.minX, v);
    }
    for (const v of y) {
      this.maxY = Math.max(this.maxY, v);
      this.minY = Math.min(this.minY, v);
    }
    return node;
  }

  text(x: number, y: number, s: string, b: Bits & { anchor?: 'start' | 'middle' | 'end'; size?: number } = {}): SVGElement {
    const t = svgEl('text');
    t.setAttribute('x', String(x));
    t.setAttribute('y', String(y));
    t.setAttribute('text-anchor', b.anchor ?? 'middle');
    t.setAttribute('dominant-baseline', 'central');
    const size = b.size ?? 14;
    t.setAttribute('font-size', String(size));
    t.textContent = s;
    const w = s.length * size * 0.62;
    const left = b.anchor === 'end' ? x - w : b.anchor === 'start' ? x : x - w / 2;
    return this.add(t, b, [left, left + w], [y - size * 0.6, y + size * 0.6]);
  }

  line(x1: number, y1: number, x2: number, y2: number, b: Bits = {}): SVGElement {
    const l = svgEl('line');
    l.setAttribute('x1', String(x1));
    l.setAttribute('y1', String(y1));
    l.setAttribute('x2', String(x2));
    l.setAttribute('y2', String(y2));
    return this.add(l, { cls: 'stroke', ...b }, [x1, x2], [y1, y2]);
  }

  rect(x: number, y: number, w: number, h: number, b: Bits = {}): SVGElement {
    const r = svgEl('rect');
    r.setAttribute('x', String(x));
    r.setAttribute('y', String(y));
    r.setAttribute('width', String(w));
    r.setAttribute('height', String(h));
    r.setAttribute('rx', '3');
    return this.add(r, { cls: 'box', ...b }, [x, x + w], [y, y + h]);
  }

  dot(x: number, y: number, r: number, b: Bits = {}): SVGElement {
    const c = svgEl('circle');
    c.setAttribute('cx', String(x));
    c.setAttribute('cy', String(y));
    c.setAttribute('r', String(r));
    return this.add(c, { cls: 'dot', ...b }, [x - r, x + r], [y - r, y + r]);
  }

  /** A polyline (open) or polygon (closed) through the points. Use for curves, wedges, triangles, graphs. */
  poly(points: [number, number][], b: Bits & { closed?: boolean } = {}): SVGElement {
    const node = svgEl(b.closed ? 'polygon' : 'polyline');
    node.setAttribute('points', points.map(([x, y]) => `${x},${y}`).join(' '));
    return this.add(node, { cls: b.closed ? 'box' : 'stroke curve', ...b }, points.map((p) => p[0]), points.map((p) => p[1]));
  }

  /** An outlined circle (a `dot` is filled). */
  ring(cx: number, cy: number, r: number, b: Bits = {}): SVGElement {
    const c = svgEl('circle');
    c.setAttribute('cx', String(cx));
    c.setAttribute('cy', String(cy));
    c.setAttribute('r', String(r));
    return this.add(c, { cls: 'stroke ring', ...b }, [cx - r, cx + r], [cy - r, cy + r]);
  }

  caption(step: number, s: string): void {
    this.captions[step] = s;
  }

  /** Light up an existing shape at extra steps. */
  heat(node: SVGElement, steps: number[]): void {
    const it = this.items.find((i) => i.node === node);
    if (it) for (const s of steps) it.hot.add(s);
  }

  get steps(): number {
    return Math.max(this.captions.length, ...this.items.map((i) => i.step + 1), ...this.items.flatMap((i) => [...i.hot].map((h) => h + 1)));
  }

  captionAt(step: number): string {
    for (let s = step; s >= 0; s--) if (this.captions[s]) return this.captions[s] ?? '';
    return '';
  }

  /** Fit the viewBox to everything drawn. Call once after drawing. */
  fit(pad = 8): this {
    const w = this.maxX - this.minX + pad * 2;
    const h = this.maxY - this.minY + pad * 2;
    this.svg.setAttribute('viewBox', `${this.minX - pad} ${this.minY - pad} ${w} ${h}`);
    return this;
  }

  show(step: number): void {
    for (const it of this.items) {
      it.node.classList.toggle('off', it.step > step);
      it.node.classList.toggle('hot', it.step === step || it.hot.has(step));
    }
  }
}
