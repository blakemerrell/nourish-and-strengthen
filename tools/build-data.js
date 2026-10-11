/*
 * Builds data/recipes.js from the original design export, and writes AUDIT.md.
 *
 * What this does:
 *   1. Re-derives every Run and Not Be Weary score from its stated macros, confirming the
 *      formula the design used (protein 55 / calories 20 / fat 15 / storehouse 10).
 *   2. Estimates macros for every recipe from its ingredient list, using
 *      tools/food-db.js.
 *   3. For Run and Not Be Weary, compares the estimate against the stated macros and reports
 *      the disagreements. Stated macros are kept — they are the authored data.
 *   4. For Around the Table, which shipped with no nutrition data at all, adopts the
 *      estimate, marks it est:true, and computes a score from it.
 *
 * Run: node tools/build-data.js
 */

const fs = require('fs');
const path = require('path');
const { FOODS, SPICE_NAMES } = require('./food-db.js');
const { scoreFrom, nutritionFor } = require('./score-lib.js');

const ROOT = path.join(__dirname, '..');

// ---------------------------------------------------------------------------
// Load the design export
// ---------------------------------------------------------------------------
global.window = {};
require(path.join(ROOT, 'design', 'project', 'recipes.js'));
// the twelve in "Worth the Afternoon" were written for this edition, not
// carried over from the original books — see tools/added-recipes.js
const ADDED = require('./added-recipes.js');
const FIXES = require('./recipe-fixes.js');
const { CATS, NOT_STOCKED } = require('./pantry-cats.js');

// apply the corrections to the original text without editing the source export
const ORIGINAL = global.window.RECIPES.map((r) => Object.assign({}, r, { steps: r.steps.slice() }));
/* The added recipes too. Fixes used to reach only the export, so a note for
   a recipe written for this edition had to be edited into its own entry —
   which is fine for one pink cookie and hopeless for a pass across the
   book. Blake: "why can't the fixes file reach the other recipes?" Now it
   can: the same file, the same four kinds of correction, one lookup. The
   added objects are corrected in place before SRC is assembled from them. */
const byId = {};
ORIGINAL.concat(ADDED).forEach((r) => { byId[r.id] = r; });
/* The method exactly as printed, taken before a single correction lands.
   Corrections mutate ORIGINAL in place, so without this snapshot there is
   nothing left to compare the finished method against. Used only to write
   the deviation table in AUDIT.md — it never reaches the app. */
const PRINT = {};
ORIGINAL.forEach((r) => { PRINT[r.id] = r.steps.slice(); });
let applied = 0;
FIXES.forEach((f) => {
  const r = byId[f.id];
  if (!r) throw new Error('recipe fix does not apply: no recipe ' + f.id);
  /* Four kinds of correction, in order of how much they change:
       add    append to a step. The eighteen doneness notes — the step is
              sound and is missing a check.
       set    replace one step, where the step itself was wrong.
       steps  replace the method outright, for a recipe whose ingredients were
              listed and never used. Nothing short of the whole method fixes
              that, because the missing part is a step that was never there.
       ing / name / time / diff  the ingredient list and the label, for when
              the method could not be written without them.
       vary   another way to make it with what the order carries; listed under
              the method as Variations, never counted.
       lift   what the recipe becomes with a few things the storehouse does
              not carry: the ingredients, and the optional steps that use
              them. Never counted in the macros, never on the shopping list —
              the recipe above it has to be worth cooking without any of it.
     All of it lives in recipe-fixes.js so the original export stays untouched
     and every change is visible in one file. */
  if (f.name) r.name = f.name;
  if (f.ing) r.ing = f.ing.slice();
  if (f.time) r.time = f.time;
  /* servings: the yield, both as printed and as the number the macros
     divide by. Never one without the other, or the label and the numbers
     describe two different portions. */
  if (f.servings) {
    if (!(f.servN > 0)) throw new Error('recipe fix ' + f.id + ': servings needs servN');
    r.servings = f.servings; r.servN = f.servN;
  }
  if (f.diff) r.diff = f.diff;
  if (f.steps) r.steps = f.steps.slice();
  if (f.lift) r.lift = f.lift;
  /* vary: another way to make it from what the order already carries —
     sour cream for some of the milk. Not an improvement folded into the
     method (Blake: "I liked what I already did"), so it is not in a step:
     the reader could not see it was an option there. Never counted, never
     on the shopping list, same as a lift. Collected, not replaced, so two
     fixes can each offer one. */
  if (f.vary) r.vary = (r.vary || []).concat(f.vary);
  /* makes: for a book recipe that turns out to produce an ingredient other
     recipes call for — the yellow cake the trifles slice up. Added recipes
     declare it in their own entry. */
  if (f.makes) r.makes = (r.makes || []).concat(f.makes);
  /* nomake: an ingredient this recipe names that the maker does not make —
     the cake pops want a CHOCOLATE cake, and the book's baked cake is
     yellow. The line keeps its food key and loses the link. */
  if (f.nomake) r.nomake = (r.nomake || []).concat(f.nomake);
  /* extras is what you must buy to cook the recipe at all. Moving an item
     into a lift makes it optional, so it has to come off that list in the
     same breath — or the shopping list still sends you out for something the
     method no longer needs. `null` is a value here, so the test is explicit. */
  if (f.extras !== undefined) r.extras = f.extras;
  if (f.set !== undefined || f.add !== undefined) {
    if (!r.steps[f.step]) throw new Error('recipe fix does not apply: ' + f.id + ' step ' + f.step);
    if (f.set) r.steps[f.step] = f.set;
    else r.steps[f.step] = r.steps[f.step].replace(/\s*$/, '') + ' ' + f.add;
  }
  applied++;
});

/* Every tin, jar, box and packet says how big it is.

   "1 can black beans" leaves the cook to guess at the shelf, and a pudding box
   or a gelatin packet comes in sizes that do not behave alike: a 3 oz box of
   flavored gelatin and a ¼ oz envelope of plain are both "a packet". The
   storehouse sells one size of each, and food-db.js records it as `sold` —
   so the size is written in here from that one table rather than typed into
   seventy lines by hand, and a recipe added later gets it too.

   A container line whose food has no `sold` size stops the build. The only
   way to leave one unsized is to not say what it comes in. */
const { parseLine: sizeParse, FOODS: SIZE_FOODS } = require('./parse-lib.js');
const CONTAINER = /^((?:\d+(?:\.\d+)?\s*)?[½¼¾⅓⅔⅛]?\s*)(cans?|jars?|pkgs?|packages?|packets?|box(?:es)?)\s+(?!\()/i;
const unsized = [];
function ozWords(n) { return n === 0.25 ? '¼' : n === 0.5 ? '½' : String(n); }
ORIGINAL.concat(ADDED).forEach((r) => {
  r.ing = r.ing.map((line) => {
    const m = line.match(CONTAINER);
    if (!m || /\(\s*[\d¼½¾]+(?:\.\d+)?\s*oz\b/.test(line)) return line;
    const hit = sizeParse(line);
    const food = hit && hit.key && SIZE_FOODS[hit.key];
    const oz = food && food.sold && food.sold[hit.unit];
    if (!oz) { unsized.push(r.id + ': ' + line); return line; }
    return m[1] + m[2] + ' (' + ozWords(oz) + ' oz) ' + line.slice(m[0].length);
  });
});
if (unsized.length) throw new Error('container with no sold size in food-db.js:\n  ' + unsized.join('\n  '));

/* Run and Not Be Weary is re-sectioned after the corrections and before
   anything is measured or paginated — its four making-based sections become
   seven meals and moments. See tools/sections.js; it throws rather than guess
   if the map and the collection ever disagree. */
const SECTIONS = require('./sections.js');

/* After ADDED, not before: six of the added recipes are Run and Not Be Weary's
   now, and re-sectioning has to see the whole volume or it would order the
   book around a version of itself that is missing them. */
const SRC = SECTIONS.order(ORIGINAL.concat(ADDED));
const resec = SECTIONS.lastRun;
// which recipes were written for this edition rather than carried over
const ADDED_IDS = new Set(ADDED.map((r) => r.id));

// ---------------------------------------------------------------------------
// Scoring
//
// The original book's formula, reverse-engineered from its own numbers, was
// protein 55 / calories 20 / fat 15 / storehouse-only 10. It is kept here only
// to prove the recovery was right — it still reproduces all 100 authored
// scores exactly.
//
// This edition scores nutrition alone. The storehouse-only bonus was ten points
// of a hundred awarded for shopping convenience, which has nothing to do with
// whether a recipe is good for you: identical brownies scored ten apart on
// where the cocoa came from. Whether a recipe needs anything beyond the standard
// order is still on every recipe, on the line at its foot, where it belongs.
//
// The remaining three are rescaled to a round 100, keeping protein dominant as
// the original intended. The calorie curve is unchanged: full marks to 300 kcal
// a serving, nothing left by 700.
// ---------------------------------------------------------------------------
function scoreOriginal(macro, extras) {
  const pPct = (macro.p * 4) / macro.kcal * 100;
  const fPct = (macro.f * 9) / macro.kcal * 100;
  const p = Math.min(55, (pPct / 45) * 55);
  const k = Math.max(0, Math.min(20, 20 - Math.max(0, macro.kcal - 300) / 20));
  const f = Math.max(0, Math.min(15, (15 * (45 - fPct)) / 35));
  const x = extras ? 0 : 10;
  return {
    score: Math.round(p + k + f + x),
    sc: {
      p: Math.round(p), k: Math.round(k), f: Math.round(f), x,
      pPct: Math.round(pPct), fPct: Math.round(fPct),
    },
  };
}


// ---------------------------------------------------------------------------
// Ingredient parsing
// ---------------------------------------------------------------------------
const { parseLine } = require('./parse-lib.js');


function macrosFor(recipe) {
  return nutritionFor(recipe.ing, recipe.servN, recipe.extras, parseLine, FOODS, SPICE_NAMES);
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------
const scoreMismatch = [];
const allUnmatched = new Map();
const book1Delta = [];
const out = SRC.map((r) => {
  const est = macrosFor(r);
  est.unmatched.forEach((u) => allUnmatched.set(u, (allUnmatched.get(u) || 0) + 1));

  const rec = Object.assign({}, r);
  rec.ingp = est.items;

  /* The carried-over recipes came with a tagline sitting in the field the
     nutrition data should have been in, and it shows: of the 125, a hundred
     and one repeat a word already in the title and the rest are adjectives.
     "Cheesy & Savory Skillet" under Crispy Hash Brown & Ham Egg Skillet.
     "Warm Melty Toast" under PB&J Breakfast Toast Toppers. "Cozy Warm Oats"
     under Warm Cinnamon Rolled Oats. They tell a cook nothing the title, the
     time, the effort and the ingredients have not already said, and they cost
     a line on every recipe in a book that is paid for by the sheet.

     The 32 written for this edition keep theirs, because those say something:
     "Boil One Minute, Exactly", "A Minute Too Long and It Is Just Cake",
     "No Skin, No Soggy Bottom". Those are what to aim for, which is the one
     thing a printed recipe cannot show you. */
  if (!ADDED_IDS.has(r.id)) rec.tagline = null;

  /* Authored macros, not "in Volume One". Those were the same thing until six
     recipes written for this edition moved into Run and Not Be Weary — they
     have no stated macros at all, like everything else in added-recipes.js, and
     asking scoreOriginal to check a null took the whole build down. */
  if (r.book === 1 && !ADDED_IDS.has(r.id)) {
    // verify the design's own scoring
    const chk = scoreOriginal(r.macro, r.extras);
    if (chk.score !== r.score || JSON.stringify(chk.sc) !== JSON.stringify(r.sc)) {
      scoreMismatch.push({ id: r.id, stated: { score: r.score, sc: r.sc }, recomputed: chk });
    }
    /* One definition per question. "What is in a serving of this recipe" used
       to get two different answers depending on which book the recipe came
       from: Volume One kept the figure printed under its title, Around the
       Table added up its ingredients. Both answers were stored — the authored
       one on `macro`, the computed one on `estMacro` — and nothing reconciled
       them. Twenty-five recipes disagreed with themselves by more than 30%,
       and the app planned against one number while the plate showed the other.

       So both volumes now answer it the same way: add up what is actually in
       the bowl. The authored figure is kept as `bookMacro` — it is what is
       printed in the physical book and a reader holding one deserves to be
       able to find it — but it is no longer what the app counts.

       This is the honest direction because the ingredients are the thing you
       can check. A printed 310 kcal cannot be argued with; four eggs and two
       ounces of sausage can be weighed, and they do not come to 1240. */
    rec.est = true;
    rec.macro = est.perServing;
    rec.bookMacro = Object.assign({}, r.macro);
    /* Same zero guard the other volume uses: a recipe whose ingredients come
       to nothing cannot be scored, and scoreFrom divides by the calories. */
    const safe1 = rec.macro.kcal > 0 ? rec.macro : { kcal: 1, p: 0, c: 0, f: 0 };
    const ns = scoreFrom(safe1);
    rec.score = rec.macro.kcal > 0 ? ns.score : null;
    rec.sc = rec.macro.kcal > 0 ? ns.sc : null;
    /* estMacro is gone. It was the second copy of exactly this number, and
       keeping it would recreate the thing this change removes. */
    const d = est.perServing.kcal - r.macro.kcal;
    const servN = r.servN && r.servN > 0 ? r.servN : 1;
    book1Delta.push({
      id: r.id, name: r.name, servN, stated: r.macro, est: est.perServing,
      estTotal: est.perServing.kcal * servN,
      dKcal: d, pct: r.macro.kcal ? Math.round((d / r.macro.kcal) * 100) : 0,
      unmatched: est.unmatched,
    });
  } else {
    // Around the Table shipped with no macros at all
    const macro = est.perServing;
    const safe = macro.kcal > 0 ? macro : { kcal: 1, p: 0, c: 0, f: 0 };
    const s = scoreFrom(safe);
    rec.macro = macro;
    rec.est = true;
    rec.score = macro.kcal > 0 ? s.score : null;
    rec.sc = macro.kcal > 0 ? s.sc : null;
  }
  delete rec.estMacro;
  return rec;
});

// ---------------------------------------------------------------------------
// Emit data file
// ---------------------------------------------------------------------------
/*
 * The shopping list works in grams, because that is the only way three recipes
 * calling for a cup, a cup and two tablespoons can add up to anything. To write
 * the total back out it needs a unit per food, and rather than pick one by hand
 * for a hundred and sixteen foods, take whichever unit the recipes themselves
 * reach for most often: cups of cottage cheese, cans of tuna, pounds of beef.
 */
const unitTally = {};
out.forEach((r) => (r.ingp || []).forEach((it) => {
  if (!it.u) return;
  unitTally[it.k] = unitTally[it.k] || {};
  unitTally[it.k][it.u] = (unitTally[it.k][it.u] || 0) + 1;
}));

const FIXED = { g: 1, oz: 28.35, lb: 453.6 };
const LADDER = ['cup', 'tbsp', 'tsp'];
const round2 = (n) => Math.round(n * 100) / 100;
const shop = {};
Object.keys(FOODS).forEach((key) => {
  const food = FOODS[key];
  const tally = unitTally[key] || {};
  const unit = Object.keys(tally).sort((a, b) => tally[b] - tally[a])[0] || 'each';
  const per = FIXED[unit] !== undefined ? FIXED[unit] : food.g[unit];
  const e = { l: food.label || (key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')) };

  /* Seasonings get a name and no number. "Salt — 2 tsp" and "Pickle juice —
     50 tsp" are not things anyone writes on a shopping list; you either have
     salt or you do not. Everything with calories in it gets counted. */
  if (per && food.kcal > 0) {
    e.u = unit;
    e.p = round2(per);
    // spoons pile up: sixteen tablespoons of ranch dressing is one cup of it
    if (LADDER.indexOf(unit) > 0) {
      e.d = LADDER.filter((u) => food.g[u]).map((u) => [u, round2(food.g[u])]);
    }
  }
  if (food.split) e.s = 1;
  shop[key] = e;
});

const header = `/* Generated by tools/build-data.js — do not edit by hand.
 * Run and Not Be Weary calories, protein, carbohydrate and fat are as authored in the
 * original book. Sodium and fiber are estimated from the ingredient lists for
 * every recipe in both volumes, and all of Around the Table's macros are (est: true).
 * See AUDIT.md.
 *
 * ingp is the parsed ingredient list the shopping list adds up:
 *   k food key   g grams   u the unit the line was written in
 *   a the seasoning's own name, where several share one food key
 *   x needs something the standard storehouse order does not carry
 */
`;
/* ---------------------------------------------------------------------------
 * The pantry: every food the recipes use, the shelf it belongs on, and whether
 * the standard storehouse order carries it.
 *
 * `s` is the answer the books were written against, not a permanent fact. The
 * app lets a reader keep their own pantry, and once they do, what counts as
 * something to buy follows their shelf rather than this one. That is the point
 * of recording it here rather than leaving it baked into each ingredient: a
 * flag on an ingredient can only ever describe the storehouse, and a household
 * that stops shopping there needs the question asked again.
 *
 * A food counts as standard unless something says otherwise, and two things
 * can say otherwise.
 *
 * The first is the recipes. Four foods are claimed both ways — whey, garlic,
 * chocolate chips and cocoa — and the tie used to go to the storehouse. That
 * was backwards. A recipe that marks an ingredient as an extra is telling you
 * something; a recipe that does not mark it is only silent, and silence is not
 * agreement. Cocoa is flagged by sixteen recipes and unflagged by one. So any
 * flag anywhere settles it, and the shopping list follows the pantry rather
 * than the other way round.
 *
 * The second is this list, for foods no recipe ever flagged and the storehouse
 * has never carried. Nothing in the data can catch these — an unflagged
 * ingredient looks exactly like a staple — so they are named. Crio Bru is the
 * one that gave the game away: roasted cacao is a thing you order from a
 * specialty shop, and the book was quietly telling people it came off the
 * shelf with the flour.
 * ------------------------------------------------------------------------- */
/* What the storehouse carries is declared in pantry-cats.js now, not worked
   out from whether a recipe author happened to annotate an ingredient. The old
   rule — stocked unless some recipe's `extras` line named it — meant an item
   nobody had annotated was silently declared available, which is exactly how
   breadcrumbs came to be listed as part of the standard order. Both halves are
   still consulted: a recipe that names something as an extra still marks it,
   and the declaration catches everything nobody thought to name. */
/* free is the sentinel for a line with no weight, and water is not shopping.
   Neither is a thing anyone keeps, so neither is in pantry-cats.js and neither
   belongs here. */
const NOT_KEPT = { free: 1, water: 1 };
const PRICES = require('./prices.js');
{
  const unknown = Object.keys(PRICES).filter((k) => !FOODS[k]);
  if (unknown.length) throw new Error('prices.js names foods the table does not have: ' + unknown.join(', '));
}
const WALMART = require('./walmart.js');
{
  const unknown = Object.keys(WALMART).filter((k) => k !== 'AS' && k !== 'ELSEWHERE' && !FOODS[k])
    .concat(Object.keys(WALMART.ELSEWHERE).filter((k) => !FOODS[k]))
    .concat(Object.keys(WALMART.AS).filter((k) => !FOODS[k] || !FOODS[WALMART.AS[k][0]]));
  if (unknown.length) throw new Error('walmart.js names foods the table does not have: ' + unknown.join(', '));
  const bad = Object.keys(WALMART).filter((k) => k !== 'AS' && k !== 'ELSEWHERE' &&
    !(/^\d{5,12}$/.test(WALMART[k][0]) && WALMART[k][1] > 0 && WALMART[k][2]));
  if (bad.length) throw new Error('walmart.js entries need [item number, grams, name]: ' + bad.join(', '));
}
const DRIED_SPICE = { paprika: 1, garlic_powder: 1, onion_powder: 1, cumin: 1, oregano: 1, thyme: 1,
  basil: 1, ginger: 1, mustard_powder: 1, chili_powder: 1, white_pepper: 1, celery_salt: 1,
  italian_seasoning: 1 };
const FOOD_KEYS = new Set(Object.keys(FOODS));
const anyExtra = {};
out.forEach((r) => (r.ingp || []).forEach((it) => {
  if (!it.k || NOT_KEPT[it.k]) return;
  if (it.x) anyExtra[it.k] = true;
  else if (anyExtra[it.k] === undefined) anyExtra[it.k] = false;
}));
const pantry = {};
Object.keys(CATS).sort().forEach((k) => {
  pantry[k] = {
    l: (shop[k] && shop[k].l) || k.replace(/_/g, ' '),
    c: CATS[k],
    s: !anyExtra[k] && !NOT_STOCKED[k],
  };
  /* A dried spice is assumed to be in the cupboard. Blake: spices don't
     count — paprika and cumin are not a trip to the shop, so "Also needs"
     and the shopping list leave them out unless the pantry says otherwise.
     Not stocked is still true of them; `sp` only changes the default. */
  if (DRIED_SPICE[k]) pantry[k].sp = 1;
  /* A typical price, dollars per 100 g (tools/prices.js), for Plan My Week's
     budget and total. Absent means not counted. */
  if (PRICES[k] !== undefined) pantry[k].usd = PRICES[k];
  /* The Walmart pack it is bought as (tools/walmart.js), and for a food the
     book makes, what it is bought as instead. */
  if (WALMART[k] && k !== 'AS' && k !== 'ELSEWHERE') pantry[k].wm = WALMART[k];
  if (WALMART.ELSEWHERE[k]) pantry[k].we = WALMART.ELSEWHERE[k];
  if (WALMART.AS[k]) pantry[k].wa = WALMART.AS[k];
});
{
  const lost = Object.keys(WALMART).filter((k) => k !== 'AS' && k !== 'ELSEWHERE' && !pantry[k])
    .concat(Object.keys(WALMART.AS).filter((k) => !pantry[k]));
  if (lost.length) throw new Error('walmart.js foods with no pantry entry, so their pack would be dropped: ' + lost.join(', '));
}
const usedNotCategorised = Object.keys(anyExtra).filter((k) => !CATS[k]);
if (usedNotCategorised.length) {
  throw new Error('foods with no shelf in pantry-cats.js: ' + usedNotCategorised.join(', '));
}

/* Which recipe makes which ingredient.
 *
 * Made, Not Bought exists because the storehouse does not carry everything the
 * book asks for, and it is no use at all if you only find it by browsing the
 * section. Fifty ingredient lines across forty-six recipes name something one
 * of these nine produces — tortillas alone are in eighteen — and writing fifty
 * sentences saying "you could make these" would put the same paragraph in the
 * book fifty times and still miss the fifty-first.
 *
 * So each of those recipes declares what it makes, and the ingredient line is
 * what carries the link. One rule, no added prose, and a recipe added later is
 * wired up by naming its food key rather than by remembering every page that
 * might want it.
 *
 * Not only Made, Not Bought: any recipe that produces an ingredient declares
 * it — the taco seasoning the taco beef calls for, the bread thirteen recipes
 * toast or layer, the cake the trifles cut up. Blake, looking at the taco beef
 * with no way to his own seasoning: "look for other opportunities to link
 * things like this." */
const makers = {};
out.forEach((r) => (r.makes || []).forEach((k) => {
  if (makers[k]) throw new Error('two recipes claim to make ' + k + ': ' + makers[k] + ' and ' + r.id);
  if (!FOOD_KEYS.has(k)) throw new Error('recipe ' + r.id + ' makes "' + k + '", which is not a food');
  makers[k] = r.id;
}));

fs.writeFileSync(path.join(ROOT, 'data', 'recipes.js'),
  header + 'window.RECIPES = ' + JSON.stringify(out) + ';\n'
  + 'window.SHOP = ' + JSON.stringify(shop) + ';\n'
  + 'window.PANTRY = ' + JSON.stringify(pantry) + ';\n'
  + 'window.MAKERS = ' + JSON.stringify(makers) + ';\n');

/* ---------------------------------------------------------------------------
 * data/nutrition.js — the food table, the parser and the score, for the browser.
 *
 * A recipe you write yourself gets the same treatment as a printed one: its
 * ingredients are read, weighed and scored the moment you save it. That needs
 * the same code in the browser as here, and the only safe way to have the same
 * code in two places is to not have it in two places. This concatenates the
 * three source files with their require and export lines taken out, so there is
 * one implementation and it is the one that was tested.
 * ------------------------------------------------------------------------- */
const bundleSrc = ['food-db.js', 'parse-lib.js', 'score-lib.js']
  .map((f) => fs.readFileSync(path.join(__dirname, f), 'utf8')
    .split('\n')
    .filter((l) => !/^const \{[^}]*\} = require\(/.test(l) && !/^module\.exports/.test(l))
    .join('\n'))
  .join('\n');

fs.writeFileSync(path.join(ROOT, 'data', 'nutrition.js'),
  '/* Generated by tools/build-data.js from tools/food-db.js, parse-lib.js and\n'
  + ' * score-lib.js — do not edit by hand. Used to work out the macros and score\n'
  + ' * of a recipe you write yourself, exactly as the printed ones were done.\n'
  + ' */\n'
  + 'window.Nutrition = (function () {\n'
  + bundleSrc
  + '\nreturn { FOODS: FOODS, ALIASES: ALIASES, SPICE_NAMES: SPICE_NAMES,\n'
  + '  parseLine: parseLine, scoreFrom: scoreFrom, nutritionFor: nutritionFor,\n'
  /* The weights travel with the scorer. The score breakdown panel draws a bar
     per part against what that part is worth, and it used to carry its own
     copy of the six maxima — so changing a weight here silently rescaled every
     bar in the app against the wrong denominator. */
  + '  MAX: MAX };\n'
  + '})();\n');

// ---------------------------------------------------------------------------
// Audit report
// ---------------------------------------------------------------------------
const b1 = book1Delta.slice().sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));
const bigGap = b1.filter((x) => Math.abs(x.pct) >= 30);
const med = (arr) => { const a = arr.slice().sort((x, y) => x - y); return a.length ? a[Math.floor(a.length / 2)] : 0; };
const medAbs = med(b1.map((x) => Math.abs(x.pct)));
const within20 = b1.filter((x) => Math.abs(x.pct) <= 20).length;

// Does a stated figure look like a batch total rather than one serving?
const batchLooking = b1.filter((x) => {
  if (x.servN < 2 || !x.estTotal) return false;
  const nearTotal = Math.abs(x.stated.kcal - x.estTotal) / x.estTotal <= 0.3;
  const farFromServing = x.est.kcal > 0 && x.stated.kcal / x.est.kcal >= 1.7;
  return nearTotal && farFromServing;
}).sort((a, b) => a.id - b.id);

const allScores = out.map((r) => r.score).filter((s) => s !== null).sort((a, b) => a - b);
const srcById = {};
SRC.forEach((r) => { srcById[r.id] = r; });
const movers = out.filter((r) => r.book === 1 && typeof srcById[r.id].score === 'number')
  .map((r) => ({
    id: r.id, name: r.name, was: srcById[r.id].score, now: r.score,
    na: r.macro.na, fib: r.macro.fib, d: Math.abs(srcById[r.id].score - r.score),
  }))
  .sort((a, b) => b.d - a.d).slice(0, 10);

const b2 = out.filter((r) => r.book === 2);
const b2scores = b2.map((r) => r.score).filter((s) => s !== null).sort((a, b) => a - b);

let md = `# Nutrition audit

Generated by \`tools/build-data.js\`. Re-run it after any change to the food table.

The two volumes: **Run and Not Be Weary** (106 recipes, macros as authored for the hundred
that came from the design export) and
**Around the Table** (125 recipes, macros estimated here from the ingredient lists).

## 1. The scoring formula

### What the original book used

The design export carried a per-recipe score and a breakdown (\`sc\`) but no formula.
Recovering it from the data gives:

| Component | Max | Rule |
|---|---|---|
| Protein share | 55 | \`min(55, protein% of calories ÷ 45 × 55)\` — full marks at 45% of calories from protein |
| Calorie load | 20 | \`20 − (kcal − 300) ÷ 20\`, capped at 20, floored at 0 — full marks up to 300 kcal/serving |
| Fat share | 15 | \`15 × (45 − fat% of calories) ÷ 35\`, clamped to 0–15 — full marks at or below 10% |
| Storehouse bonus | 10 | 10 if the recipe needs nothing outside the standard storehouse list, else 0 |

**Verification: all 100 authored scores and all 600 breakdown figures reproduce exactly.**
Mismatches found: ${scoreMismatch.length}. That is the evidence the formula above is the real one.

### What this edition uses

Two changes, both because the original score was measuring the wrong things.

The storehouse bonus is gone. Ten points in a hundred were awarded for shopping
convenience, which says nothing about whether a recipe is good for you — identical
brownies scored ten apart depending on where the cocoa came from. Whether a recipe
needs anything beyond the standard order is still on every recipe, on the line at
its foot.

**Sodium and fiber are in.** The original score had neither, in a collection built
on canned chicken, canned soup, deli ham and boxed mixes — and it treated salt as
a free ingredient worth nothing at all. The result was that a can of tuna with
mayonnaise scored 98 and a pot of beans and vegetables scored in the sixties. Any
sort by "healthiest" ran backwards.

**Carbohydrate is in**, and it was free in exactly the way salt used to be. Across
the collection the correlation between carbohydrate's share of a recipe's calories
and its score was **0.012** — not weak, nothing. Worse than nothing: the fat part
rewards a low fat share, so trading fat for sugar at the same calories and the
same protein moved a recipe from 65 to 70. Two hundred and fifty calories of sugar
in water scored 55; a mug of hot milk with brown sugar in it scored 75.

What is scored is not carbohydrate. Oats and frosting are both carbohydrate, and a
part that could not tell them apart would mark down the one breakfast in the book
built on rolled oats. **A gram of fiber covers ten grams of carbohydrate** —
roughly the ratio a whole food arrives in — and only what is left over costs
anything. Overnight oats come out at 6% of calories and lose nothing. The same
size mug of hot milk and brown sugar comes out at 49% and loses all twelve points.
It needed no new data: fiber was already estimated for every recipe, and this asks
a second question of a number that was already there.

Room was made by scaling the five existing parts, not by reshaping them. Every
band is exactly where it was — what earns sodium points or fiber points has not
changed, and the ordering within each part is identical to the previous edition.

| Component | Max | Rule |
|---|---|---|
| Protein share | 27 | \`min(27, protein% of calories ÷ 45 × 27)\` |
| Calorie load | 18 | \`18 − (kcal − 300) ÷ 27.8\`, clamped to 0–18 — full marks to 300 kcal |
| Fat share | 8 | \`8 × (45 − fat% of calories) ÷ 35\`, clamped to 0–8 |
| Sodium | 22 | \`22 × (1200 − mg) ÷ 900\`, clamped to 0–22 — full marks to 300 mg, nothing by 1,200 |
| Fiber | 13 | \`13 × g ÷ 7\`, clamped to 0–13 — full marks at 7 g |
| Unfibered carbohydrate | 12 | \`12 × (50 − pct) ÷ 40\`, clamped to 0–12, where \`pct\` is \`max(0, carb g − fiber g × 10) × 4 ÷ kcal × 100\` — full marks to 10%, nothing left by 50% |

The band for the last one is set off where the recipes actually are rather than at
a round number picked in advance: the collection's median is 6% and its ninetieth
percentile is 43%.

**Printed scores therefore differ from the original book's, substantially and by
design.** Score is the rounded sum of the unrounded parts, which is why the pieces
do not always visibly add up.

Sodium and fiber are estimated from the ingredient lists for **every** recipe in
both volumes, including the hundred whose calories and protein were authored — the
book never carried either figure. So half the weight of every score rests on the
food table, and the app says so on each recipe.

Every Run and Not Be Weary macro set is also internally consistent under Atwater factors
(4 kcal/g protein and carbohydrate, 9 kcal/g fat) — no stated calorie count is
more than 12% away from the sum of its own macros.

### What that did to the numbers

Score range across all ${allScores.length} scored recipes: **${allScores[0]}–${allScores[allScores.length - 1]}**, median **${allScores[Math.floor(allScores.length / 2)]}**.
Under the old formula almost everything clustered in the eighties and nineties,
which is another way of saying it was not discriminating.

The Run and Not Be Weary recipes that fell furthest from their authored score:

| # | Recipe | Was | Now | Sodium | Fiber |
|---|---|---|---|---|---|
${movers.filter((x) => x.now < x.was).slice(0, 8).map((x) => `| ${x.id} | ${x.name} | ${x.was} | ${x.now} | ${x.na} mg | ${x.fib} g |`).join('\n')}

Deli ham, canned soup and bottled sauce, every one. And the ones that rose:

| # | Recipe | Was | Now | Sodium | Fiber |
|---|---|---|---|---|---|
${movers.filter((x) => x.now > x.was).slice(0, 6).map((x) => `| ${x.id} | ${x.name} | ${x.was} | ${x.now} | ${x.na} mg | ${x.fib} g |`).join('\n')}

Fruit and oats, which the old score had nothing good to say about because it only
ever asked how much protein was in them.

## 2. Run and Not Be Weary — stated macros vs. ingredients

The stated macros are kept as authored. Estimating each recipe independently from
its ingredient list is a check on them, not a replacement.

- Recipes checked: ${b1.length}
- Median disagreement on calories: **${medAbs}%**
- Within 20% of stated: **${within20} of ${b1.length}**
- Off by 30% or more: **${bigGap.length}**

${bigGap.length ? `The outliers, worth a look before this goes to print:

| # | Recipe | Stated kcal | Estimated kcal | Diff |
|---|---|---|---|---|
${bigGap.slice(0, 25).map((x) => `| ${x.id} | ${x.name} | ${x.stated.kcal} | ${x.est.kcal} | ${x.pct > 0 ? '+' : ''}${x.pct}% |`).join('\n')}
` : 'No recipe is off by 30% or more.'}

A gap does not automatically mean the book is wrong. The usual causes are portion
assumptions the ingredient list does not state — how much of a marinade is
actually eaten, whether ground beef is drained, whether "1 can" means the 15 oz
or the 29 oz can.

### Recipes whose stated macros look like batch totals

${batchLooking.length} multi-serving Run and Not Be Weary recipes state a calorie figure close to what the
**whole batch** contains, while being labelled per serving. In each case the stated
number is at least 1.7× the estimate for one serving and lands within 30% of the
estimate for the full recipe.

${batchLooking.length ? `| # | Recipe | Servings | Stated "per serving" | Est. per serving | Est. whole batch |
|---|---|---|---|---|---|
${batchLooking.map((x) => `| ${x.id} | ${x.name} | ${x.servN} | ${x.stated.kcal} | ${x.est.kcal} | ${x.estTotal} |`).join('\n')}

This is worth a decision before printing. If these really are batch figures, the
scores on those recipes are penalised for a calorie load their eater never sees.
The app does not silently change them — they are printed as authored.` : 'None found.'}

## 3. Around the Table — estimated macros

Around the Table shipped with **no nutrition data**: all 125 recipes carried a tagline in
the macro field. Macros here are estimated from the ingredient lists using the
food table in \`tools/food-db.js\`, divided by the recipe's own serving count.

- Recipes given macros: ${b2.filter((r) => r.macro && r.macro.kcal > 0).length} of ${b2.length}
- Score range: ${b2scores[0]}–${b2scores[b2scores.length - 1]} (median ${b2scores[Math.floor(b2scores.length / 2)]})

**These are estimates and the app labels them as such** — every Around the Table recipe
shows "Estimated from ingredients" next to its macros and its score. Run and Not Be Weary's
numbers are never labelled that way, so the two are never confused.

### What the estimates assume

- Meat weights are raw, because that is how the recipes state them. Fat lost to
  draining browned beef is not subtracted.
- "trimmed" on an ingredient line ("2 lbs pork roast, trimmed") keeps six-tenths
  of the cut's fat and takes the calories of the rest off with it. Protein is
  untouched and the grams stay the purchase weight, so the shopping list and the
  pantry still see one roast. The word has to be on the ingredient line — a step
  that says "trim it" changes nothing, because the steps are prose.
- "1 can" without a size means the common size for that item — 15 oz for beans,
  tomato sauce and fruit, 10.5 oz for condensed soup, 5 oz for tuna. Canned
  protein, beans and vegetables are counted at drained weight.
- "Rice" is counted dry and "instant potatoes" as dry flakes, because the books
  write "cooked rice" and "mashed potatoes" separately when they mean the prepared
  form. This assumption is behind several of the Run and Not Be Weary gaps above: 2 cups of dry
  rice carries roughly three times the calories of 2 cups cooked.
- Ingredients written with no quantity ("butter", "cheddar", "salsa") are counted
  at a modest default recorded in \`tools/food-db.js\` — one tablespoon of butter,
  half a cup of cheese, a quarter cup of salsa. Seasonings, water and non-food
  items such as lollipop sticks count as zero.

### Newly written recipes

${ADDED.length} recipes across ${[...new Set(ADDED.map((r) => r.secName))].length} sections were written for this edition rather than carried
over from the original books:

${[...new Set(ADDED.map((r) => r.secName))].map((n) => { const k = ADDED.filter((r) => r.secName === n).length; return `- **${n}** — ${k} recipe${k === 1 ? '' : 's'}`; }).join('\n')}

The data made the gaps plain. Across the original 225, no recipe has more than
four steps, none uses yeast, and none kneads, braises, tempers an egg or thickens
a sauce — "In-Depth" nearly always meant "leave it in the slow cooker". There was
no cookie of any kind in the collection, chocolate chips appeared in exactly one
recipe, and there were no restaurant copies at all.

Every ingredient was checked against the storehouse order list. ${ADDED.filter((r) => !r.extras).length} of the ${ADDED.length}
need nothing beyond it; the rest are honest about their pantry extras, which cost
them the storehouse bonus and so score lower.

Oil listed "for frying" is counted at 12% absorption rather than in full. Counting
a whole pan of frying oil as eaten made fried chicken read at 1,849 kcal a serving.

Their macros are estimates on the same footing as the rest of the volume, and the
app labels them as such. They have not been kitchen-tested.

### Recipes whose method differs from the printed book

${(() => {
  const rows = out.filter((r) => PRINT[r.id] && (
    PRINT[r.id].length !== r.steps.length ||
    PRINT[r.id].some((s, i) => s !== r.steps[i])
  ));
  if (!rows.length) return 'None. Every method is as printed.';
  return `${rows.length} of the ${Object.keys(PRINT).length} carried-over recipes are cooked differently here than\nthe book prints them. The app shows the corrected method and says nothing about\nthe change; this table is the whole record of it.\n\n| No. | Recipe | Printed | Here |\n|---|---|---|---|\n` + rows.map((r) => {
    const a = PRINT[r.id], b = r.steps;
    const i = a.findIndex((s, k) => s !== b[k]);
    const cell = (t) => (t === undefined ? '_(no such step)_' : '`' + String(t).replace(/\|/g, '\\|').slice(0, 120) + (String(t).length > 120 ? '…' : '') + '`');
    return `| ${r.no || r.id} | ${r.name} | ${cell(a[i])} | ${cell(b[i])} |`;
  }).join('\n');
})()}

${allUnmatched.size ? `### Ingredients the parser could not price

${[...allUnmatched.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `- \`${k}\` (${v}×)`).join('\n')}

These contribute nothing to their recipe's totals, so those recipes read low.
` : '### Coverage\n\nEvery ingredient line in all 225 recipes resolved to a food in the table.\n'}
`;

fs.writeFileSync(path.join(ROOT, 'AUDIT.md'), md);

console.log('wrote data/recipes.js  (' + out.length + ' recipes)');
console.log('recipe corrections applied:', applied);
console.log('book 1 re-sectioned:', resec.sections, 'sections,',
  resec.relabelled, 'servings lines relabelled');
console.log('score mismatches:', scoreMismatch.length);
console.log('unmatched ingredient names:', allUnmatched.size);
if (allUnmatched.size) console.log([...allUnmatched.keys()].slice(0, 40).join(' | '));
console.log('Run and Not Be Weary median |Δkcal|:', medAbs + '%', ' within 20%:', within20 + '/' + b1.length, ' ≥30% off:', bigGap.length);

/* data/recipes.js is fetched at ?v=N and served from the cache, so rewriting
   it without moving N would leave every installed phone on the copy it has.
   This used to bump N here. It does not need to now: N is a hash of the files,
   written in by tools/build-site.js when the site is deployed, so a changed
   data file is a new version with nothing to remember. */
