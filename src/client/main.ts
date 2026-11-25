/**
 * Math Trainer client. Three views, picked by the URL hash:
 *   #            topics
 *   #<topic>     a topic page: a built topic shows its six-method grid with live sliders
 *   #play        Lock Lattice, the game
 * On the friends host the game asks the server for a seed and sends each answer to be replayed, so the score on
 * the board is the server's. In the Play and demo builds (`VITE_TARGET=play`) every network path is compiled out.
 */
import { api, configureClient, type ScoresResponse } from '@app-builder/client-sdk';
import config from '../../app.config.json';
import { applySegment, DEFAULT_RULES, multiplier, problemFor, runOver, startRun, type Run } from '../app';
import { TOPICS, type Topic } from '../catalog';
import { digits, lattice } from '../math';
import type { GridSpec, Slider } from './grid';
import { GRIDS } from './grids';
import { svgEl, type Scene } from './scene';
import { el, render } from './ui';

const ONLINE = import.meta.env.VITE_TARGET !== 'play';

/**
 * Pace: how fast the method drawings step. 1 = one step every `baseStepMs`. The default is half the first
 * release's speed. The viewer's choice is remembered in this browser only (a convenience, never required).
 */
export const PACE = {
  baseStepMs: 1100,
  levels: [0.25, 0.5, 0.75, 1, 1.5, 2],
  defaultLevel: 0.5,
  storageKey: 'math-trainer.pace',
};

function loadPace(): number {
  try {
    const v = Number(localStorage.getItem(PACE.storageKey));
    if (PACE.levels.includes(v)) return v;
  } catch {
    /* storage blocked: use the default */
  }
  return PACE.defaultLevel;
}

function savePace(v: number): void {
  try {
    localStorage.setItem(PACE.storageKey, String(v));
  } catch {
    /* storage blocked: the choice lasts for this page only */
  }
}

const paceLabel = (v: number): string => `${v === 0.25 ? '¼' : v === 0.5 ? '½' : v === 0.75 ? '¾' : String(v)}×`;

/** Everything tunable about the client. */
export const UI = {
  /** Ticks to hold the finished drawing before it replays. */
  holdTicks: 3,
  /** Each tile plays this many times on its own; ↻ plays it again. */
  autoPlays: 2,
  /** Delay before the next round, after a right or wrong answer. */
  nextRoundMs: { right: 700, wrong: 1800 },
  /** The multiplier orb grows with the streak (scale = base + perMultiplier × multiplier). */
  orb: { base: 0.8, perMultiplier: 0.08 },
};

// ---------- topics ----------

function topicsView(): void {
  const cards = TOPICS.map((t) =>
    el('button', { className: `topic${GRIDS[t.id] ? ' built' : ''}`, onClick: () => go(t.id) }, [
      el('span', { className: 'sym', text: t.symbol }),
      el('span', { className: 'name', text: t.title }),
      el('span', { className: 'count', text: GRIDS[t.id] ? `${GRIDS[t.id]?.methods.length} ways` : `${t.methods.length} ways · soon` }),
    ]),
  );
  render(
    el('main', {}, [
      el('h1', { text: config.title }),
      el('p', { className: 'muted', text: 'Every problem, solved more than one way. Pick a topic.' }),
      el('button', { className: 'play-cta', text: '🔒 Play Lock Lattice', onClick: () => go('play') }),
      el('div', { className: 'topics' }, cards),
    ]),
  );
}

function plannedTopicView(t: Topic): void {
  render(
    el('main', {}, [
      backButton(),
      el('h1', { text: `${t.symbol}  ${t.title}` }),
      el('p', { className: 'muted', text: `${t.methods.length} methods. This grid isn't built yet; here's what it will show.` }),
      el('ol', { className: 'methods-list' }, t.methods.map((m) => el('li', { text: m }))),
    ]),
  );
}

const backButton = () => el('button', { className: 'back', text: '← Topics', onClick: () => go('') });

// ---------- the six-method grid ----------

interface Tile {
  method: GridSpec['methods'][number];
  scene: Scene;
  step: number;
  hold: number;
  plays: number;
  node: HTMLElement;
  frame: HTMLElement;
  caption: HTMLElement;
}

let timer: ReturnType<typeof setInterval> | undefined;
const stopTimer = () => {
  if (timer !== undefined) clearInterval(timer);
  timer = undefined;
};

function gridView(spec: GridSpec): void {
  const problem = el('p', { className: 'problem' });
  const showProblem = () => {
    problem.textContent = spec.problem(values);
  };

  const values = spec.sliders.map((s) => s.start);
  const tiles: Tile[] = spec.methods.map((method) => {
    const frame = el('div', { className: 'frame' });
    const caption = el('p', { className: 'caption' });
    const tile: Tile = { method, scene: method.draw(values), step: 0, hold: 0, plays: 0, frame, caption, node: el('div') };
    const replay = el('button', {
      className: 'replay',
      text: '↻',
      onClick: () => {
        tile.step = 0;
        tile.hold = 0;
        tile.plays = UI.autoPlays - 1;
        paint(tile);
      },
    });
    replay.setAttribute('aria-label', `Replay ${method.title}`);
    const head = el('div', { className: 'tile-head' }, [el('span', { text: method.title }), replay]);
    tile.node = el('section', { className: 'tile' }, [head, frame, caption]);
    tile.node.dataset.method = method.id;
    frame.addEventListener('click', () => {
      const open = !tile.node.classList.contains('big');
      for (const t of tiles) t.node.classList.remove('big');
      if (open) {
        tile.node.classList.add('big');
        const parent = tile.node.parentElement;
        if (parent) parent.insertBefore(tile.node, parent.firstChild);
        tile.node.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });
    frame.appendChild(tile.scene.svg);
    return tile;
  });

  function paint(t: Tile): void {
    t.scene.show(t.step);
    t.caption.textContent = t.scene.captionAt(t.step);
  }

  /** Redraw every tile for new numbers, keeping each one's place in its animation. */
  function redraw(): void {
    showProblem();
    for (const t of tiles) {
      t.scene = t.method.draw(values);
      t.step = Math.min(t.step, t.scene.steps - 1);
      t.frame.replaceChildren(t.scene.svg);
      paint(t);
    }
  }

  function tick(): void {
    for (const t of tiles) {
      if (t.plays >= UI.autoPlays) continue;
      if (t.step < t.scene.steps - 1) t.step++;
      else if (++t.hold >= UI.holdTicks) {
        t.hold = 0;
        t.plays++;
        if (t.plays < UI.autoPlays) t.step = 0;
      }
      paint(t);
    }
  }

  const slider = (range: Slider, get: () => number, set: (v: number) => void) => {
    const label = range.label;
    const input = el('input');
    input.type = 'range';
    input.min = String(range.min);
    input.max = String(range.max);
    input.value = String(get());
    input.setAttribute('aria-label', label);
    const out = el('output', { text: String(get()) });
    const apply = (v: number) => {
      const n = Math.max(range.min, Math.min(range.max, Math.round(v)));
      set(n);
      input.value = String(n);
      out.textContent = String(n);
      redraw();
    };
    input.addEventListener('input', () => apply(Number(input.value)));
    const minus = el('button', { className: 'nudge', text: '−', onClick: () => apply(get() - 1) });
    const plus = el('button', { className: 'nudge', text: '+', onClick: () => apply(get() + 1) });
    minus.setAttribute('aria-label', `${label} minus one`);
    plus.setAttribute('aria-label', `${label} plus one`);
    return el('div', { className: 'slider' }, [el('span', { className: 'lbl', text: label }), minus, input, plus, out]);
  };

  let pace = loadPace();
  const startTimer = () => {
    stopTimer();
    timer = setInterval(tick, PACE.baseStepMs / pace);
  };
  const paceInput = el('input');
  paceInput.type = 'range';
  paceInput.min = '0';
  paceInput.max = String(PACE.levels.length - 1);
  paceInput.value = String(Math.max(0, PACE.levels.indexOf(pace)));
  paceInput.setAttribute('aria-label', 'Pace');
  const paceOut = el('output', { text: paceLabel(pace) });
  const setPace = (i: number) => {
    const k = Math.max(0, Math.min(PACE.levels.length - 1, i));
    pace = PACE.levels[k] ?? PACE.defaultLevel;
    paceInput.value = String(k);
    paceOut.textContent = paceLabel(pace);
    savePace(pace);
    startTimer();
  };
  paceInput.addEventListener('input', () => setPace(Number(paceInput.value)));
  const slower = el('button', { className: 'nudge', text: '🐢', onClick: () => setPace(PACE.levels.indexOf(pace) - 1) });
  const faster = el('button', { className: 'nudge', text: '🐇', onClick: () => setPace(PACE.levels.indexOf(pace) + 1) });
  slower.setAttribute('aria-label', 'Slower');
  faster.setAttribute('aria-label', 'Faster');
  const paceRow = el('div', { className: 'slider pace' }, [el('span', { className: 'lbl', text: 'Pace' }), slower, paceInput, faster, paceOut]);

  render(
    el('main', { className: 'wide' }, [
      el('div', { className: 'bar' }, [backButton(), el('button', { className: 'small', text: '🔒 Play', onClick: () => go('play') })]),
      problem,
      el('div', { className: 'sliders' }, [
        ...spec.sliders.map((r, i) => slider(r, () => values[i] ?? r.start, (v) => (values[i] = v))),
        paceRow,
      ]),
      el('div', { className: 'grid' }, tiles.map((t) => t.node)),
      el('p', { className: 'muted', text: 'Tap a drawing to enlarge it. Each plays twice; ↻ plays it again. Drag the sliders and every method updates as it plays.' }),
    ]),
  );
  showProblem();
  for (const t of tiles) paint(t);
  startTimer();
}

// ---------- Lock Lattice ----------

interface Session {
  run: Run;
  ranked: { runId: string } | null;
  wheels: number[];
  focus: number;
  busy: boolean;
  flash: 'right' | 'wrong' | null;
  last: string;
}

const randomSeed = (): number => crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;

async function newSession(): Promise<Session> {
  const fresh = (run: Run, ranked: Session['ranked']): Session => ({ run, ranked, wheels: [], focus: 0, busy: false, flash: null, last: '' });
  if (ONLINE) {
    configureClient({ basePath: `/${config.id}` });
    const start = await api.soloStart(config.id);
    if (start) return fresh(startRun(start.seed), { runId: start.runId });
  }
  return fresh(startRun(randomSeed()), null);
}

const currentProblem = (s: Session) => problemFor(DEFAULT_RULES, s.run, s.run.round + 1);

function resetWheels(s: Session): void {
  const p = currentProblem(s);
  const n = digits(p.a * p.b).length;
  s.wheels = new Array<number>(n).fill(0);
  s.focus = n - 1;
}

async function submit(s: Session): Promise<void> {
  if (s.busy) return;
  s.busy = true;
  const p = currentProblem(s);
  const seg = { round: s.run.round + 1, answer: Number(s.wheels.join('')) };
  const next = applySegment(DEFAULT_RULES, s.run, seg);
  if (!next) {
    s.busy = false;
    return;
  }
  const mine = gen;
  const right = next.streak > 0;
  const gained = next.points - s.run.points;
  s.flash = right ? 'right' : 'wrong';
  s.last = right ? `+${gained}` : `${p.a} × ${p.b} = ${p.a * p.b}`;
  s.run = next;
  gameView(s, p);
  if (ONLINE && s.ranked) {
    const res = await api.soloSegment(config.id, s.ranked.runId, seg);
    if (!res || !res.ok) s.ranked = null;
    if (mine !== gen) return;
  }
  nextRound = setTimeout(() => {
    s.flash = null;
    s.busy = false;
    if (!runOver(DEFAULT_RULES, s.run)) resetWheels(s);
    void drawGame(s);
  }, right ? UI.nextRoundMs.right : UI.nextRoundMs.wrong);
}

/** The lattice for the problem, with the active wheel's diagonal lit. */
function latticeBoard(a: number, b: number, focusPlace: number): SVGSVGElement {
  const L = lattice(a, b);
  const c = 40;
  const m = L.top.length;
  const n = L.side.length;
  const svg = svgEl('svg');
  svg.setAttribute('class', 'scene board');
  svg.setAttribute('viewBox', `-30 -30 ${m * c + 60} ${n * c + 60}`);
  const text = (x: number, y: number, s: string, cls = '') => {
    const t = svgEl('text');
    t.setAttribute('x', String(x));
    t.setAttribute('y', String(y));
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('dominant-baseline', 'central');
    t.setAttribute('font-size', cls.includes('big') ? '16' : '13');
    if (cls) t.setAttribute('class', cls);
    t.textContent = s;
    svg.appendChild(t);
  };
  L.top.forEach((d, col) => text(col * c + c / 2, -12, String(d), 'big'));
  L.side.forEach((d, row) => text(m * c + 12, row * c + c / 2, String(d), 'big'));
  for (const cell of L.cells) {
    const x = cell.col * c;
    const y = cell.row * c;
    const r = svgEl('rect');
    for (const [k, v] of [['x', x], ['y', y], ['width', c], ['height', c], ['rx', 3]] as const) r.setAttribute(k, String(v));
    r.setAttribute('class', 'box grid');
    svg.appendChild(r);
    const l = svgEl('line');
    for (const [k, v] of [['x1', x + c], ['y1', y], ['x2', x], ['y2', y + c]] as const) l.setAttribute(k, String(v));
    l.setAttribute('class', 'stroke thin');
    svg.appendChild(l);
    text(x + c * 0.3, y + c * 0.32, String(cell.tens), cell.diag + 1 === focusPlace ? 'hot' : '');
    text(x + c * 0.7, y + c * 0.7, String(cell.ones), cell.diag === focusPlace ? 'hot' : '');
  }
  return svg;
}

function wheel(s: Session, i: number, p: { a: number; b: number }): HTMLElement {
  const strip = el('div', { className: 'strip' }, Array.from({ length: 10 }, (_, d) => el('span', { text: String(d) })));
  strip.style.transform = `translateY(${-s.wheels[i]! * 10}%)`;
  const spin = (delta: number) => {
    if (s.busy) return;
    s.wheels[i] = (((s.wheels[i] ?? 0) + delta) % 10 + 10) % 10;
    s.focus = i;
    gameView(s, p);
  };
  const up = el('button', { className: 'spin', text: '▲', onClick: () => spin(1) });
  const down = el('button', { className: 'spin', text: '▼', onClick: () => spin(-1) });
  up.setAttribute('aria-label', `Digit ${i + 1} up`);
  down.setAttribute('aria-label', `Digit ${i + 1} down`);
  const win = el('div', { className: 'window' }, [strip]);
  win.addEventListener('click', () => {
    s.focus = i;
    gameView(s, p);
  });
  // Swipe a wheel up or down to roll it, like a luggage lock.
  let startY: number | null = null;
  win.addEventListener('pointerdown', (e) => {
    startY = e.clientY;
    win.setPointerCapture(e.pointerId);
  });
  win.addEventListener('pointerup', (e) => {
    if (startY === null) return;
    const dy = e.clientY - startY;
    startY = null;
    if (Math.abs(dy) > 12) spin(dy < 0 ? Math.max(1, Math.round(-dy / 24)) : -Math.max(1, Math.round(dy / 24)));
  });
  win.addEventListener('wheel', (e) => {
    e.preventDefault();
    spin(e.deltaY < 0 ? 1 : -1);
  });
  return el('div', { className: `wheel${s.focus === i ? ' focus' : ''}` }, [up, win, down]);
}

let keyHandler: ((e: KeyboardEvent) => void) | null = null;
/** Bumped on every navigation; async game work started under an older value is dropped. */
let gen = 0;
let nextRound: ReturnType<typeof setTimeout> | undefined;

function gameView(s: Session, p: { a: number; b: number }): void {
  const place = s.wheels.length - 1 - s.focus;
  const mult = multiplier(DEFAULT_RULES, s.run.streak);
  const lv = DEFAULT_RULES.levels[s.run.level];
  const orb = el('div', { className: 'orb', text: `×${mult}` });
  orb.style.transform = `scale(${UI.orb.base + UI.orb.perMultiplier * mult})`;
  const lock = el('div', { className: `lock${s.flash ? ` ${s.flash}` : ''}` }, s.wheels.map((_, i) => wheel(s, i, p)));
  render(
    el('main', { className: 'game' }, [
      el('div', { className: 'bar' }, [backButton(), el('span', { className: 'muted', text: `Round ${Math.min(s.run.round + 1, DEFAULT_RULES.rounds)}/${DEFAULT_RULES.rounds}` })]),
      el('div', { className: 'hud' }, [
        el('span', { className: 'pts', text: String(s.run.points) }),
        orb,
        el('span', { className: 'muted', text: `Level ${s.run.level + 1}: ${lv?.aDigits}-digit × ${lv?.bDigits}-digit · streak ${s.run.streak}` }),
      ]),
      el('p', { className: 'problem', text: `${p.a} × ${p.b}` }),
      latticeBoard(p.a, p.b, s.flash ? -1 : place),
      el('p', { className: 'muted center', text: 'Roll each wheel to its diagonal\'s total (carry the tens left).' }),
      lock,
      el('p', { className: `flash ${s.flash ?? ''}`, text: s.flash ? s.last : ' ' }),
      el('button', { className: 'unlock', text: 'Unlock', onClick: () => void submit(s) }),
    ]),
  );
}

async function drawGame(s: Session): Promise<void> {
  if (runOver(DEFAULT_RULES, s.run)) {
    const mine = gen;
    const board: ScoresResponse | null = ONLINE ? await api.scores(config.id) : null;
    if (mine !== gen) return;
    render(
      el('main', { className: 'game' }, [
        backButton(),
        el('h1', { text: 'Unlocked!' }),
        el('p', { className: 'problem', text: `${s.run.points} points` }),
        el('p', { className: 'muted', text: `Best streak ${s.run.best} · reached level ${s.run.level + 1}` }),
        el('p', { className: 'muted', text: s.ranked ? 'Ranked run: the server checked every answer.' : 'Unranked run.' }),
        el('button', { className: 'unlock', text: 'Play again', onClick: () => void startGame() }),
        ...(board ? [el('h2', { text: 'Best scores' }), el('ol', {}, board.scores.map((e) => el('li', { text: `${e.player}: ${e.score}` })))] : []),
      ]),
    );
    return;
  }
  gameView(s, currentProblem(s));
}

async function startGame(): Promise<void> {
  const mine = gen;
  const s = await newSession();
  if (mine !== gen) return;
  resetWheels(s);
  keyHandler = (e: KeyboardEvent) => {
    if (s.busy || runOver(DEFAULT_RULES, s.run) || location.hash !== '#play') return;
    const p = currentProblem(s);
    if (/^[0-9]$/.test(e.key)) {
      s.wheels[s.focus] = Number(e.key);
      s.focus = Math.max(0, s.focus - 1);
    } else if (e.key === 'ArrowLeft') s.focus = Math.max(0, s.focus - 1);
    else if (e.key === 'ArrowRight') s.focus = Math.min(s.wheels.length - 1, s.focus + 1);
    else if (e.key === 'ArrowUp') s.wheels[s.focus] = ((s.wheels[s.focus] ?? 0) + 1) % 10;
    else if (e.key === 'ArrowDown') s.wheels[s.focus] = ((s.wheels[s.focus] ?? 0) + 9) % 10;
    else if (e.key === 'Enter') return void submit(s);
    else return;
    e.preventDefault();
    gameView(s, p);
  };
  await drawGame(s);
}

// ---------- routing ----------

function go(hash: string): void {
  location.hash = hash;
}

function route(): void {
  stopTimer();
  gen++;
  if (nextRound !== undefined) clearTimeout(nextRound);
  keyHandler = null;
  const id = decodeURIComponent(location.hash.slice(1));
  if (id === 'play') return void startGame();
  const t = TOPICS.find((x) => x.id === id);
  if (!t) return topicsView();
  const grid = GRIDS[t.id];
  if (grid) return gridView(grid);
  plannedTopicView(t);
}

document.addEventListener('keydown', (e) => keyHandler?.(e));
window.addEventListener('hashchange', route);
route();
window.scrollTo(0, 0);
