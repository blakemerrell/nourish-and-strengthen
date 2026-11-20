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
keeps its own look** (its fonts, `src/style.css` tokens, dark mode) unless
Blake decides otherwise in step 6; take the structure from the mockups,
not the styling.

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

## The plan, in order

Small steps, one PR each, each one useful on its own. Ship the cheap,
high-value ones first; the navigation change is last because it is the
biggest and riskiest.

### Step 1 — Eat (Blake uses this most)
- 1a. **"You usually have"** one-tap chips with Undo on the meal happening
  now. **Done: #200.**
- 1b. **Amount sheet**: tap a logged food → big − / +, ½ · 1 · 1½ · 2,
  macros update live, Remove / Done (`eat-4-amount.png`). Today a tap
  opens the line's own controls (`src/myday.js` `mOpenRow`); this is a
  bigger, simpler version of that.
- 1c. **Quiet the foot**: one primary button (Fill / Mark all complete /
  Complete the day, as now); Rebalance, Sweep and Add meal move under ⋯.
- 1d. **Log bar**: an always-there "What did you eat?" bar above the foot
  that opens typed logging (#198 already reads a whole meal typed into the
  picker's search; this puts that box on the day itself) plus barcode.
- 1e. **What's left at the top** (calories left and P/C/F bars). Ask
  Blake first: the header shows eaten / target today.

### Step 2 — Workout (Strengthen live logger)
- 2a. The **aim line** at the top of each lift card: weight × reps and the
  reps to spare, in one line, plus "last time" under the sets.
- 2b. Warm, Swap, Note, Plates, Remove move under the card's ⋯; **+ Add
  set** stays.
- 2c. **Weigh-in** leaves the workout (it belongs on Today in the morning).
- 2d. Rest timer as a bar at the bottom with −30 s and Skip.

### Step 3 — Train home
- Four boxes for this week instead of the 24-cell grid on the first view
  (the grid stays one tap away), one sentence about effort, one Start.

### Step 4 — Cook
- Recipes, Plan, List and Pantry become one **Cook** tab with a Recipes /
  This week / List switch. One row of filter chips replaces the four
  dropdowns; the rest goes in a Filter sheet.

### Step 5 — Today
- Three cards: next workout with Start, what's left to eat with Log food,
  tonight's dinner and the shopping list.

### Step 6 — Navigation and look (last)
- Four tabs at the bottom: **Today · Cook · Eat · Train**.
- Then decide the visual pass with Blake (keep the serif / cream look, or
  move toward the system font). Do not start this without asking him.

## Status

Update this table in the same PR as the work. Claim a step by putting
your name and the branch in it before you start, so two agents never
build the same thing.

| Step | Status | Who | PR |
|---|---|---|---|
| 1a "You usually have" chips | Done | Claude | #200 |
| 1b Amount sheet | Not started | | |
| 1c Quiet the foot | Not started | | |
| 1d Log bar | Not started | | |
| 1e What's left at the top | Waiting on Blake | | |
| 2a Aim line | Not started | | |
| 2b Card buttons under ⋯ | Not started | | |
| 2c Weigh-in out of the workout | Not started | | |
| 2d Rest bar | Not started | | |
| 3 Train home | Not started | | |
| 4 Cook | Not started | | |
| 5 Today | Not started | | |
| 6 Navigation and look | Ask Blake first | | |

## Questions waiting on Blake

- Should tapping a "You usually have" chip mark the food eaten at once?
  (Today nothing arrives eaten until ticked: `src/mealtime.js`,
  `M_ADDS_EATEN`, his rule since 2026-09-27.)
- Should the chips count food he logged but never ticked?
- Should the top of Eat say "calories left" instead of eaten / target?
- Step 6's look: keep the app's own fonts and colours, or go flatter?

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
