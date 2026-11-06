# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Nourish & Strengthen (formerly Hive & Hearth Recipes): a static, offline-first web app (PWA) holding the
recipe books, built from everyday pantry staples (originally the Bishops' Storehouse books) — browse, plan weeks, a self-building shopping list, printable half-letter books —
plus Nourish (macro tracking, the "My Day" screens) and Strengthen (an RP-style lifting block
and logger). It is used on phones, often with no signal. Sharing between devices is optional,
through Firebase.

There is **no build step for development**: `index.html` opens straight off the disk, and
plain-script JavaScript runs in the browser. No framework, no modules, no bundler, no
TypeScript. `README.md` is the long-form manual; `SETUP.md` covers Firebase.

## Commands

```sh
npm ci                                 # Playwright, sharp, pdf-lib, terser… (tooling only; nothing ships from node_modules)
node tests/run.js                      # full offline suite against the repo as-is (several minutes)
node tests/run.js weeks                # one file: args are substrings of tests/*.test.js names
node tests/run.js macros-meal csp      # several files
node tests/run.js --headed             # watch it in a real browser
FAST=1 node tests/run.js               # caps sub-500 ms waits to two animation frames (CI uses this)
npm run test:site                      # build _site/ then run everything against it: what CI runs
SITE=_site FAST=1 node tests/run.js offline upgrade   # CI's quick gate, after `npm run site`

npm run build                          # tools/build-data.js: regenerate data/*.js and AUDIT.md
npm run print                          # re-render the PDFs in print/ (needed after any recipe change)
npm run handout                        # re-render print/Storehouse-Handout.pdf (also after any recipe change)
node tools/build-demo.js               # re-shoot welcome/demo/ from the new PDFs and app (also after any recipe change)
npm run site                           # tools/build-site.js → _site/ (add --no-minify to keep comments)
npm run check                          # recipes vs. standard kitchen ratios (--all is the default here)

for f in src/*.js sw.js tools/*.js tests/*.js; do node --check "$f" || exit 1; done   # CI's parse check
cd tests/rules && npm ci && npm test   # firestore.rules + src/sync.js under the Firestore emulator (needs Java 21)
```

`node tests/run.js sync --live` (any `sync*.test.js`) talks to the **live** Firebase project.
It never runs by default and should not be run without asking.

There is no linter or formatter. CI (`.github/workflows/tests.yml`) runs: parse check, "committed
data equals a fresh `build-data.js`" (`git diff --exit-code -- data AUDIT.md`), build, the gate,
the full suite on `_site/`, and the rules/emulator job. `deploy.yml` publishes `_site/` to GitHub
Pages from `main` only after tests pass; `rules.yml` publishes `firestore.rules` from `main`.

## Architecture

### Script loading and globals

`index.html` loads classic `<script>` tags in a fixed order and everything communicates through
globals: `data/recipes.js` → `window.RECIPES`, `data/nutrition.js` (food table, parser and score
for the browser), `src/config.js` (Firebase + USDA keys), `src/sync.js` → `window.Store`,
`src/train.js` (Strengthen, self-contained), `src/today.js`, then ~70 "parts", then `src/app.js`,
then `src/boot.js` (service-worker registration).

### app.js and HiveParts

`src/app.js` was a single IIFE holding browse, plan, list, print and Nourish, and is being split
**one part at a time** into files of their own. Each part registers a factory:

```js
(window.HiveParts = window.HiveParts || {}).fold = function (app) { 'use strict'; var S = app.S; … };
```

`app.js` calls it once at startup, passing exactly what the part needs, e.g.
`window.HiveParts.clock({ MSTAMPS: MSTAMPS, mPut: mPut, …, LIVE: LIVE })`, and keeps what comes
back under the same names. `LIVE` holds getter/setter pairs for values app.js *replaces* rather
than mutates (e.g. `RECIPES`/`BY_ID` after `rebuild()`), so a part reads them each time instead of
holding a stale copy. Each part's header comment says what it reads and what it hands back.

Splitting a part out is done with `tools/split-part.js`, which parses `app.js` (acorn) and works
out what to hand over, what goes through `LIVE` and what comes back:
`node tools/split-part.js <name> <VAR> "<first line of range>" "<first line after it>" <header.txt> [--dry]`.
`tests/scope.test.js` reads every script without a browser and fails on any name a split left dangling.

**Adding a `src/` file** means: a `<script src="src/x.js?v=0">` in `index.html` (before `app.js` if
it is a part), the same `./src/x.js?v=0` in the `CORE` list in `sw.js`, and a line in the README's
Layout list. `tests/offline.test.js` fails if a loaded script is missing from the worker's cache list.

### Versioning and the built site

The repo says `?v=0` on every asset, everywhere. `tools/build-site.js` writes a content hash in when
it builds `_site/` (minified, comments stripped, `EXCLUDE` list leaves out tests, tools, design,
`art/src`, Markdown, etc.). **Never bump a version by hand**; a PR never touches a version line.
`sw.js` serves `?v=` URLs from cache; a worker that sees `v=0` knows it's unbuilt and fetches fresh.

### Content-security policy

The CSP meta in `index.html` refuses inline script. No inline `<script>`, no `onclick=`-style
attributes; that is why `src/theme.js` and `src/boot.js` exist. `tests/csp.test.js` also checks that
every host the code fetches from is in the policy, so a new external host means updating the meta.

### Data pipeline (generated files)

Recipe text lives in `design/project/recipes.js` (original two books, kept exactly as they
arrived; don't edit it), `tools/added-recipes.js` (written for this edition) and
`tools/recipe-fixes.js` / `tools/sections.js` (corrections and section changes applied at build time).
Nutrition comes from `tools/food-db.js`, parsed by `tools/parse-lib.js`, scored by
`tools/score-lib.js`. `npm run build` regenerates `data/recipes.js`, `data/nutrition.js` and
`AUDIT.md`: **never edit those three by hand**. A recipe change also needs `npm run print`, or
`tests/pdfs.test.js` fails because `print/*.pdf` is behind, and `npm run handout`, or
`tests/share.test.js` fails because the sheet the page sets no longer matches the stamped PDF,
and `node tools/build-demo.js`, or `tests/welcome.test.js` fails because the landing page's demo
frames were taken of an older build. Run them in that order (the demo photographs the PDFs).
Commit the PDFs and their stamps (`print/Storehouse-Handout.json`, `welcome/demo/stamp.json`) with the data.

### Storage and sync

`src/sync.js` (`window.Store`) has two modes: **local** (localStorage, keys prefixed `bsc.`) and
**synced** (one Firestore household document that phones watch; localStorage still mirrors
everything for offline use). Writes are field-level on purpose so two people editing at once don't
overwrite each other. Nourish's per-person data syncs through the `daysync`/`dayup`/`clock`/
`signin`/`twocopies` parts. `firestore.rules` is near Firestore's per-request expression limit;
`tests/rules/` checks it. `SETUP.md` embeds a comment-stripped copy made by `tools/setup-rules.js`,
and `tests/setuprules.test.js` fails when they differ.

### design/

`design/` is the original Claude Design prototype. Its `HANDOFF.md` ("CODING AGENTS: READ THIS
FIRST") was for the initial build and is no longer instructions. The app exists now; only
`design/project/recipes.js` is still live input to the build.

## Tests

The runner (`tests/run.js`) is custom, not Jest or Mocha. It serves the repo (or `SITE=` dir) over
HTTP, drives a real Chromium, and asserts on what renders. A test file exports:

```js
module.exports = { name: 'Weeks', async run(t) {
  const p = await t.fresh({ viewport: { width: 390, height: 844 } });   // fresh context, errors watched
  t.ok('what should be true, in words', cond, detailOnFailure);
} };
```

Any uncaught page error fails the run even when assertions pass. USDA lookups are blocked and Google
sign-in is stubbed inside `t.fresh()`. `t.down(true)` refuses every connection (real offline).

`tests/mutants.test.js` checks that every mutation in `tools/mutate.js` still finds its target code
**by exact text**. Rewriting code a mutation aims at fails this test: update the mutation's
`from` text in `tools/mutate.js` to match. (`node tools/mutate.js` itself runs the whole suite per
mutant, ~20 min each; don't run it casually.)

UI rules enforced by tests (`a11y`, `macros-ux`, `macros-audits`, …): tap targets ≥ 44 px, type
≥ 13 px, layouts hold at 320 px wide, dark mode via `src/theme.js`.

## Conventions

- **`src/` and `sw.js` are ES5**: `var`, `function`, IIFEs, `'use strict'`; no `const`/`let`/arrow
  functions anywhere in them. Tests and tools use modern Node syntax.
- **Comments are prose that explain why**, often with the history of the bug that caused the code
  (what broke, for whom, what was tried). Match that density in new code; don't strip existing ones.
- **Commit messages**: `Area: plain sentence of what changed` (e.g. `Nourish sheet: typing a
  portion opens an empty box`), body in plain language about what the user saw and why it changed.
- `privacy/index.html` describes what the code actually does with data. Change data handling
  (what is sent where, kept how long, deleted when) and the privacy page must change with it.
