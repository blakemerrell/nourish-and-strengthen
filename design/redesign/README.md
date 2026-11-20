# The redesign: easier to use, just as powerful

Blake asked (2026-11-07): "If you were an Apple engineer and designer, how
would you design this?" — for the whole app. This folder is the plan that
came out of it, the mockups, and the status of each step. It is the shared
brief for every agent working on it (Claude Code, Antigravity, anyone else):
read it before starting a step, and update the **Status** table when you
start or finish one.

The rule over all of it: **cut clutter, not capability.** Every power
feature the app has today stays. What changes is that the one thing a
screen is for is obvious, and everything else is one tap away instead of
on screen all the time.

## Look at the mockups first

`screens/` holds pictures of the tap-through mockups (phone size, 390×844):

| Screen | What it shows |
|---|---|
| `app-1-today.png` | Today: next workout with Start, rings for calories and protein left, tonight's dinner, the shopping list |
| `app-2-cook-recipes.png` | Cook: search, one row of filter chips (not four dropdowns), recipes with their score and a + to plan |
| `app-3-cook-list.png` | Cook › List: the shopping list by aisle, tap to tick |
| `app-4-train.png` | Train: this week's four sessions, one plain sentence about effort, one Start button, Progress / History as rows |
| `app-5-workout.png` | The workout: one lift's card, the aim at the top ("125 lb × 10 · stop with 3 to spare"), big number cells, a big tick, rest timer as a bar at the bottom, the other lifts in an Up next list |
| `eat-1-day.png` | Eat: what's left at the top, meals in order, the meal happening now marked NOW with "You usually have" chips, planned dinner with "Ate it", a log bar always at the bottom |
| `eat-2-usual-tapped.png` | After one tap on a chip: the food is on lunch, with Undo in the toast |
| `eat-3-type-it.png` | The log bar opened: typed food read back as foods with − / + steppers and the effect on the day, one button to add |
| `eat-4-amount.png` | Tapping a logged food: big − / +, ½ · 1 · 1½ · 2, the macros as you change it, Remove / Done |

`mockups/` holds their source (`Main.dc.html` is the whole app,
`Eat.dc.html` the food-logging screen). They are written for Claude's
design canvas and need its runtime to run; read them as markup for the
exact copy, spacing and states. The live, clickable version is
https://claude.ai/artifact/8bmu2EX5DvW2QNB45cBVY5 (private to Blake).
Numbers in the mockups are a sample day, not real data.

The mockups use the phone's system font and a flatter look. **The app
permanently keeps its own Warm Editorial Look 1** (`src/style.css`
tokens, `Source Serif 4` + `Work Sans`, warm cream/dark surfaces, and
real-iron plate colours). Take structure and simplification from the
mockups and RP Diet ergonomics, not visual restyling.

## What was wrong (the review, short)

1. **Too many places.** Six tabs across the top (Today, Recipes, Plan,
   Nourish, Strengthen, plus the logo) and two more hidden (List, Pantry).
2. **Many equal buttons per screen.** Recipes: four dropdowns, three
   buttons and a book picker before the first recipe. Nourish's foot:
   Rebalance, Sweep, Add meal and Fill side by side. A lift card: seven
   buttons.
3. **The answer is buried.** In a workout the question is "what do I
   lift?"; the answer was split across faint placeholders.
4. **Interruptions in the wrong place.** Weigh-in at the top of a
   workout; banners on Recipes and Plan.
5. **Paragraphs instead of clarity.** Screens that open with a paragraph
   explaining themselves.

## Non-Negotiable Preservation Invariants

Enforced by `tests/redesign-invariants.test.js` and audit gates across every step:

1. **Look 1 (Warm Editorial) stays permanently.** Do not replace `src/style.css` typography, warm paper/dark tokens, or plate colours in Step 6.
2. **Strengthen set row & rest timer (`src/train.js`) stay intact:**
   - Keep the **6-column set row**: `Set | Previous + Live Colored Plate Stack (plCell / stackHTML) | lb | Reps | Spare (Target RIR via rqSel) | ✓`. Never collapse set rows to 3 columns and never remove Target RIR (card cue or per-set `Spare` selector) or the inline barbell plate stack.
   - Keep the **inline divider line + centered rest timer pill** (`.tr-rdiv` / `.tr-rdiv-b`) between working sets. Tapping the pill may offer `−30s / +30s / Skip`; **Step `2d` (floating bottom rest bar) is dropped**.
3. **Cook → Shopping List → Automatic Walmart Cart (`src/walmart.js`, `src/list.js`, `src/today.js`) stays front-and-center:**
   - Keep the full Recipes / `Plan my week` → `buildList()` gram aggregation (`In your kitchen` subtraction + `From the storehouse` split) → `Mark what I have` → `Check the products ›` (`sh.wm` item-# overrides) → **Pinned `#0053E2` blue + `#FFC220` yellow spark `Add N items to Walmart cart`** (`walmart.com/sc/cart/addToCart?items=ID_QTY,...`) across **Today**, **Cook › This week**, and **Cook › List**. Never bury Walmart under `⋯`.
4. **Eat / Nourish logging & pin semantics (`src/myday.js`, `src/mydayparts.js`, `src/picksheet.js`):**
   - Newly added foods ALWAYS arrive **unchecked** (`M_ADDS_EATEN` stays off) until explicitly ticked.
   - Delete (`data-mdel`) removes from **today only**; only `Unpin` (`data-mpin`) removes an everyday pin (`#204`).
   - `Lock` (`data-mlock`) holds an item's amount during automatic `Balance` / `Rebalance` while still allowing manual `− / +` or typed edits.

## The plan, in order

Small steps, one PR each, each one useful on its own. Ship the cheap,
high-value ones first; the 4-tab navigation switch (`Today · Cook · Eat · Train`)
with legacy hash redirects (`#recipes`, `#plan`, `#list`, `#pantry`, `#macros`, `#train`)
ships last.

### Step 1 — Eat (Blake uses this most)
- 1a. **"You usually have"** one-tap chips with Undo on the meal happening
  now. **Done: #200.**
- 1b. **RP-Style Inline Meal View & Separated Food Search** (`data-mode="meal" | "find" | "scan"` on `.msheet`):
  - **Mode transitions**:
    - Tapping a populated meal card (`.mtray-b[data-mopen]`) opens `data-mode="meal"`: per-meal `current / target` + `"N kcal left/over"` badge, every food row open simultaneously with 1-tap `🔒 Lock`, tappable `grams/servings` + `− / +` steppers, 1-tap `Split into N foods` badge on composite saved meals (`data-mexplode` + toast Undo), row `⋯` menu, and bottom `+ Add foods` | `Balance` | `Done` (food search list stays hidden until `+ Add foods` is tapped).
    - Tapping an empty meal (`items.length === 0`), a meal card's `+` icon (`.mtray-ib[data-mopen][data-madd="1"]`), `[data-msaved]`, or `addFood` / `eatOut` opens `data-mode="find"` (`#mpFind` visible).
    - Tapping `+ Add foods` from `meal` mode enters `find` mode (`S.mpFromMeal = true`) with `&lsaquo; Back to <Meal>`. Pressing Android Back, `&lsaquo; Back to <Meal>`, or `Done` returns to `meal` mode instead of closing the sheet. Deleting the last food via `data-mdel` while in `meal` mode stays calmly in `meal` mode (empty state + `+ Add foods`).
- 1c. **Quiet the foot + Smart Drift Banner**: one primary button (`Craft my plan` / `Fill` / `Mark all complete` / `Complete the day`); `Rebalance`, `Sweep` and `Add meal` move under `⋯`, plus a dismissible 1-line `"Meals are off target — tap to rebalance"` banner when earlier meals drift >10% from target.
- 1d. **Log bar & local scanner**: an always-there `"What did you eat?"` bar above the foot (`#198` typed meal parsing) plus camera button opening local Barcode scanner + Nutrition Facts manual entry (`src/camera.js`; cloud AI photo scan deferred).
- 1e. **Eat Day Header (`current / goal` + `left/over`)**: show both eaten/target and a highlighted `"N left/over"` badge side-by-side at the top of Eat.
- 1f. **My Foods & Routines Manager**: opened from `⋯` on Eat to manage `Everyday Pins`, `Saved Meals`, and `Custom Foods` in one sheet.

### Step 2 — Workout (Strengthen live logger)
- 2a. The **aim line** at the top of each lift card (preserving the 6-column set row, Target RIR `Spare` column, and live `plCell` barbell plate stack).
- 2b. Prune leftover duplicate inline buttons (`Warm`, `Swap`, `Note`, `Plates`, `Remove`) from `.tr-ex-a` at the bottom of the card (`#trPop` `⋯` already holds them from `#194`); **+ Set** and **− Set** stay.
- 2c. **Weigh-in** leaves the live workout into **Step 5 (Today)** (never remove until Today's morning weigh-in card lands; fall back to last logged bodyweight on weighted bodyweight lifts).
- ~~2d. Bottom rest bar~~ — **Dropped** (keep `.tr-rdiv` inline rest divider pill between sets; tapping the pill offers `−30s / +30s / Skip`).

### Step 3 — Train home
- Four boxes for this week above the collapsible full-block calendar (`#194`), one sentence about effort, one Start button.

### Step 4 — Cook
- Recipes, Plan, List and Pantry become one **Cook** tab (`Recipes | This week | List` + `Pantry` access within 2 taps), one row of filter chips + Filter sheet, **100% preserving `src/walmart.js` + `src/list.js` auto-cart & hash redirects**.

### Step 5 — Today
- Cards for morning weigh-in (old `2c`), next workout + Start, today's macros (`current / goal` + `left`) + Log food, tonight's dinner, and Shopping (`Add N items to Walmart cart` + `Open list`).

### Step 6 — 4-Tab Bottom Navigation (last)
- Four tabs at the bottom: **Today · Cook · Eat · Train**, preserving Look 1 and adding hash redirects from legacy tab routes.

## Status & File Ownership

Split ownership by file so agents work in parallel without merge collisions:
- **Antigravity**: Owns `src/myday.js`, `src/mydayparts.js`, `src/picksheet.js` (Eat `1b`–`1f`).
- **Claude**: Owns `src/train.js` (`2a`, `2b`, `3`) and Steps `4–6` prep (`Cook`, `Today`, bottom nav).

| Step | Status | Who | PR / Branch |
|---|---|---|---|
| 1a "You usually have" chips | Done | Claude | #200 |
| 1b Inline meal view & search split | Done | Antigravity | #206 |
| 1c Quiet foot + drift banner | Done | Antigravity | #207 |
| 1d Log bar + local scanner | Done | Antigravity | #208 |
| 1e Eat header (`current/goal` + `left`) | Done | Antigravity | #209 |
| 1f My Foods & Routines manager | Not started | | |
| 2a Aim line (keep plates & RIR) | Not started | | |
| 2b Prune duplicate `.tr-ex-a` buttons | Not started | | |
| 2c Weigh-in to Today (with Step 5) | Bundled into 5 | | |
| 2d Bottom rest bar | Dropped | | Keep `.tr-rdiv` pill |
| 3 Train 4-box week summary | Not started | | |
| 4 Cook (preserve Walmart flow) | Not started | | |
| 5 Today (includes 2c weigh-in) | Not started | | |
| 6 4-tab bottom bar (Look 1 kept) | Not started | | |

## Resolved decisions (2026-11-19)

- **Look 1 stays permanently** (`src/style.css` warm editorial cream/dark palette & fonts).
- **Separated Meal View vs Search** (`1b`): populated meals open cleanly on open inline RP rows (`Lock`, grams, `− / +`, `Split into foods`); search opens only for empty meals or `+ Add foods`.
- **Unchecked until eaten**: `M_ADDS_EATEN` stays off everywhere (habit chips, picker, scanner, `"What did you eat?"` bar).
- **Headers**: show both `current / goal` and `"N left"` together.
- **Rebalance banner**: show a quiet 1-line dismissible banner when meals drift off target.
- **Scanner**: local Barcode + Nutrition Facts label entry first (AI plate photo scan deferred).
- **Workout invariants**: keep Look 1, 6-column set row, Target RIR (`Spare`), live row plate stacks (`plCell`), and inline rest divider pill (`.tr-rdiv`).
- **Shopping invariants**: keep automatic Recipes → Aisle List → Pinned Blue/Spark Walmart Cart pipeline across Today, This week, and List.

## How to work on this (both agents)

- **Read `CLAUDE.md` first.** It is the repo's rulebook and applies to
  every agent, not just Claude: `src/` is ES5 (no `const`, `let`, arrow
  functions), no build step, no inline scripts (CSP), never hand-edit
  `data/*.js` or `AUDIT.md`, never bump a `?v=` version, comments are
  prose that explain why, commit messages are `Area: plain sentence`.
- **Where to work.** This plan was pushed on `claude/gallant-rubin-mbsbh7`.
  Once it is on `main`, build each step on its own branch off `main`
  (for example `redesign/1b-amount-sheet`), one step per PR, small enough
  to review on a phone. Two agents committing to one long-lived branch
  collide; one branch per step does not. Pull `main` before you start and
  merge it in before you push.
- **Tests come with the change.** Add a `tests/<name>.test.js` for the new
  behaviour (see `tests/macros-usual.test.js` for the shape), and run the
  suites you touch: `FAST=1 node tests/run.js macros today train` etc.
  Layout rules the suite enforces: tap targets ≥ 44 px, type ≥ 13 px,
  nothing wider than the phone at 320 px, dark mode via tokens.
- **Watch for the card's invisible door.** Meal cards have a full-card
  tap target (`.mtray-b::after`); anything new and clickable inside a
  card needs `position: relative; z-index: 1` or the tap opens the meal
  sheet instead (this bit #200).
- **The app updates itself** on phones from GitHub Pages once `main`
  deploys (about 20–25 minutes after a merge); the Android shell only
  needs a new Play build for things outside the web code.
- **Don't** run `node tests/run.js sync --live`, write to Firestore, or
  change `privacy/index.html` behaviour without Blake.
