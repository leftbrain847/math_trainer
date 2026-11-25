#!/usr/bin/env node
// Score this app's depth spec (depth.json) against the platform rubric (platform/depth.config.json).
//
//   npm run depth            # in an app repo
//   node depth-check.mjs <app dir> [--config <path>]
//
// Prints a table and any warnings. With "enforce": "warn" (the default) it always exits 0;
// with "enforce": "block" it exits 1 when the app fails the gate. Copied into every app by sync.
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/** Score a spec against a rubric. Pure: no I/O, so it is easy to test. */
export function scoreDepth(spec, config) {
  const { min, max } = config.scale;
  const rows = [];
  const problems = [];
  let total = 0;
  let maxTotal = 0;
  for (const [name, pillar] of Object.entries(config.pillars)) {
    const entry = spec?.pillars?.[name];
    const raw = entry?.score;
    const score = Number.isInteger(raw) ? raw : null;
    if (score === null || score < min || score > max) problems.push(`${name}: score must be a whole number from ${min} to ${max}`);
    const s = score === null ? 0 : Math.min(Math.max(score, min), max);
    const plan = typeof entry?.plan === 'string' ? entry.plan.trim() : '';
    if (!plan) problems.push(`${name}: no plan written`);
    total += s * pillar.weight;
    maxTotal += max * pillar.weight;
    rows.push({ name, score: s, weight: pillar.weight, plan });
  }
  const zero = (n) => (rows.find((r) => r.name === n)?.score ?? 0) === 0;
  const rejected = config.reject_if_zero.filter(zero);
  const otherZeros = rows.filter((r) => r.score === 0 && !config.reject_if_zero.includes(r.name) && !config.allow_zero.includes(r.name)).map((r) => r.name);
  const hypercasual = rejected.length > 0;
  const belowBar = total < config.ship_min_total;
  const pass = !hypercasual && !belowBar && otherZeros.length === 0 && problems.length === 0;
  return { rows, total, maxTotal, rejected, otherZeros, hypercasual, belowBar, problems, pass };
}

/** Human-readable report lines for scoreDepth's result. */
export function report(result, config) {
  const lines = ['Depth score', ''];
  for (const r of result.rows) lines.push(`  ${r.name.padEnd(12)} ${r.score}/${config.scale.max}${r.weight === 1 ? '' : ` ×${r.weight}`}  ${r.plan || '(no plan)'}`);
  lines.push('', `  total ${result.total}/${result.maxTotal} (bar: ${config.ship_min_total})`, '');
  if (result.hypercasual) lines.push(`WARNING hypercasual: 0 on ${result.rejected.join(', ')}. Depth needs all of: ${config.reject_if_zero.join(', ')}.`);
  if (result.belowBar) lines.push(`WARNING below the ship bar: ${result.total} < ${config.ship_min_total}.`);
  if (result.otherZeros.length) lines.push(`WARNING zero on ${result.otherZeros.join(', ')}.`);
  for (const p of result.problems) lines.push(`WARNING ${p}`);
  if (result.pass) lines.push('PASS: meets the depth bar.');
  return lines;
}

function main() {
  const args = process.argv.slice(2);
  const ci = args.indexOf('--config');
  const dir = resolve(args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--config') ?? '.');
  const configPath = ci >= 0 ? resolve(args[ci + 1]) : join(dir, 'platform', 'depth.config.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  let spec;
  try {
    spec = JSON.parse(readFileSync(join(dir, 'depth.json'), 'utf8'));
  } catch {
    spec = null;
    console.log('WARNING no depth.json: copy it from app_builder/template and fill it in.');
  }
  const result = scoreDepth(spec, config);
  console.log(report(result, config).join('\n'));
  if (config.enforce === 'block' && !result.pass) process.exit(1);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();
