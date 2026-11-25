# Math Trainer

Every maths problem, solved more than one way. Pick a topic and its methods play side by side in a 2×3 grid; drag the sliders and every drawing updates as it plays. All 18 topics are live, each solved 4–6 ways: multiplication, division, addition, subtraction, adding fractions, percentages, squaring, square roots, GCD, sum 1 to n, two equations, quadratics, derivatives, integrals, area of a circle, Pythagoras, counting choices, and primes. **Pace** sets how fast the drawings step (default ½×). **Lock Lattice** is the game: dial each lattice diagonal's total into a luggage-lock wheel; a streak grows the multiplier and the problems.

Each topic is three files: `src/topics/<id>.ts` (maths), `test/<id>.test.ts`, `src/client/topics/<id>.ts` (drawings). `src/catalog.ts` lists the topics and their method titles.

Built on [app_builder](https://github.com/leftbrain847/app_builder).

- **Friends:** behind your Cloudflare login at `/<id>/` on your apps hostname (see `platform/platform.config.json`).
- **Google Play:** only if `targets.play.enabled` is true in `app.config.json`. Tag `vX.Y.Z` to build and upload to the internal track.

## Run

```sh
npm ci
npm run dev      # local dev server
npm test         # the rules' tests
```

| Command | Does |
| --- | --- |
| `npm run dev` | local dev server (no login, no host) |
| `npm test` | the rules' tests |
| `npm run worker:dev` | the full Worker locally (uses no Cloudflare quota) |
| `npm run build:play` | the offline Play bundle, checked for network code |

Deploys happen in CI on every push to `main`, followed by a smoke test that rolls the deploy back if the app isn't behind the login wall.

## Test

```sh
npm ci
npm run typecheck && npm test && npm run build && npm run build:play && npm run build:demo
```

## Deployed

- Live (friends): not yet; needs the `CLOUDFLARE_API_TOKEN` secret and a real `platform.config.json`.
- Day snapshot: `snapshots/2026-11-25 - Math Trainer.html` (frozen; never edited).

## Budget

Every app shares one free Cloudflare pool per day (resets 00:00 UTC). This app's rough cost:

- **Solo:** about 2 requests per ranked play, plus a few per run.
- **Turn-based:** 1 request to join, plus 1 request per 20 moves. The room sleeps between moves and costs nothing while idle.
