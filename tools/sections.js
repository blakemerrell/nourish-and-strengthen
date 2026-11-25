/*
 * Run and Not Be Weary, re-sectioned.
 *
 * The book shipped in four sections named after how the food was made —
 * Zero-Cook, Morning Brews, Batch Preps, Cut Snacks. That is the author's
 * view. Somebody standing in a kitchen at six in the evening has a different
 * question, and it is always the same one: what am I eating now. So the
 * sections are meals and moments instead, and the four old names go.
 *
 * "Brews" in particular was doing badly. It meant the Crio Bru drinks, and it
 * sat over nineteen recipes that are eggs, oats and pancakes — so the one
 * word on the divider named the smallest thing behind it.
 *
 * Nothing is rewritten here except sixteen servings lines, below. Every recipe
 * keeps its number, its ingredients, its method and its score; what changes is
 * which divider it sits behind. Like recipe-fixes.js, this leaves the export in
 * design/project/ untouched and keeps the change legible in one file.
 *
 * The seven, and what each is for:
 *
 *   Breakfasts        the morning food, with the drinks taken out
 *   Snacks            small, cold, no cooking — from both old halves
 *   Lunch             the cold assemblies that are a meal, not a handful
 *   Dinner            cooked tonight, eaten tonight
 *   Best Before Bed   cottage cheese, puddings, a warm mug. Slow protein and
 *                     nothing that will keep you up
 *   Power Drinks      the Crio Bru brews, the shakes, the smoothies
 *   Batch Prep        cook once, eat the week: slow-cooker, sheet-pan, the
 *                     six-container ones
 *
 * Sizes are deliberately uneven. Snacks is the biggest because that is what
 * the collection actually holds, and padding a section to make a contents page
 * look tidy would be arranging the book around the furniture.
 */

'use strict';

/* Order is the order they print in, and secNum follows from it: through the
   day, then the two that sit outside it. */
const SECTIONS = [
  { n: 1, name: 'Breakfasts', short: 'Breakfasts',
    note: 'Enough protein that eleven o’clock is not a problem.' },
  { n: 2, name: 'Snacks', short: 'Snacks',
    note: 'Small, cold, and nothing to cook.' },
  { n: 3, name: 'Lunch', short: 'Lunch',
    note: 'Cold, assembled, and enough to be a meal.' },
  { n: 4, name: 'Dinner', short: 'Dinner',
    note: 'Cooked tonight, eaten tonight.' },
  { n: 5, name: 'Best Before Bed', short: 'Best Before Bed',
    note: 'Slow protein late on, and nothing that will keep you up.' },
  { n: 6, name: 'Power Drinks', short: 'Power Drinks',
    note: 'Brews, shakes and smoothies, when a cup is easier than a plate.' },
  { n: 7, name: 'Batch Prep', short: 'Batch Prep',
    note: 'Cook once, eat the week.' },
];

/* Which recipes go where. Numbers, because a number is the one thing about a
   recipe that never changes — names get corrected, sections get rethought. */
const ASSIGN = {
  /* 278-283 and 284-289 were written for this edition rather than carried
     over — the two sections a hard cut is usually lost at. */
  Breakfasts: [27, 28, 29, 30, 32, 33, 34, 36, 37, 38, 39, 41, 42, 43, 45, 46, 48, 49, 50,
    278, 279, 280, 281, 282, 283,
    290, 291, 292, 293, 294,
    366, 368, 369, 370, 371, 372, 385, 399, 403],
  Snacks: [1, 4, 6, 8, 10, 11, 13, 14, 17, 19, 20, 22, 24, 25,
    77, 79, 80, 83, 84, 87, 88, 90, 91, 95, 96, 97, 99,
    284, 285, 286, 287, 288, 289,
    373, 381, 405, 410, 411],
  Lunch: [2, 3, 5, 7, 9, 12, 15, 16, 18, 21, 23,
    295, 296, 297, 298, 299,
    302, 303, 304, 305, 306, 307,
    400],
  Dinner: [51, 52, 55, 57, 61, 62, 65, 66, 67, 69, 70, 71, 72, 73, 74, 75,
    300, 301,
    308, 309, 310, 311, 312, 313, 314, 315, 316,
    401, 407],
  'Best Before Bed': [76, 78, 81, 82, 85, 86, 89, 92, 93, 98, 100,
    367, 374, 375, 386, 387, 409],
  /* The last six are the storehouse-only drinks, moved here from the end of
     Around the Table now that a recipe can be renumbered without moving its
     id — see the note at the top of tools/added-recipes.js. */
  'Power Drinks': [26, 31, 35, 40, 44, 47, 94, 258, 259, 260, 261, 262, 263,
    267, 268, 269, 270, 271,
    402, 404, 412],
  'Batch Prep': [53, 54, 56, 58, 59, 60, 63, 64, 68,
    406, 408],
};

/* The sixteen.
 *
 * All twenty-five of the old Batch Preps were written as meal prep — "4 Meal
 * Prep Containers" on every one of them — because that was the section they
 * were in. Sixteen of them are now under Dinner, and a page headed Dinner that
 * tells you it makes four containers is the book arguing with itself.
 *
 * Only the words change. servN stays exactly as it was, so the per-serving
 * calories, the protein, the score and the shopping list are all untouched —
 * four containers and four servings are four either way. What moves is what
 * the line calls them.
 *
 * The parenthetical says what a serving actually is, in the same shape the
 * rest of the collection uses: "4 Servings (1 Bowl Each)".
 */
const SERVINGS = {
  51: '4 Servings (1 Rice Bowl Each)',
  52: '4 Servings (1 Plate Each)',
  55: '4 Servings (2 Pepper Halves Each)',
  57: '4 Servings (1 Rice Bowl Each)',
  61: '4 Servings (1 Plate Each)',
  62: '4 Servings (1 Bowl Each)',
  65: '4 Servings (1 Plate Each)',
  66: '4 Servings (1 Skillet Plate Each)',
  67: '4 Servings (1 Plate Each)',
  69: '4 Servings (1 Bowl Each)',
  70: '4 Servings (1 Bowl Each)',
  71: '4 Servings (1 Skillet Plate Each)',
  72: '4 Servings (1 Bowl Each)',
  73: '4 Servings (1 Plate Each)',
  74: '4 Servings (1 Rice Bowl Each)',
  75: '4 Servings (1 Plate Each)',
};

/* Applied to the recipes in place, after the corrections in recipe-fixes.js.
   Throws rather than guesses: a recipe this file does not mention, or mentions
   twice, is a mistake in the map and not something to paper over at build
   time — the whole point is that the seven sections account for all hundred. */
function apply(recipes) {
  const byName = {};
  SECTIONS.forEach((s) => { byName[s.name] = s; });

  const target = {};
  Object.keys(ASSIGN).forEach((name) => {
    if (!byName[name]) throw new Error('sections: no section called ' + name);
    ASSIGN[name].forEach((id) => {
      if (target[id]) throw new Error('sections: recipe ' + id + ' is in two sections');
      target[id] = byName[name];
    });
  });

  const book1 = recipes.filter((r) => r.book === 1);
  const missed = book1.filter((r) => !target[r.id]).map((r) => r.id);
  if (missed.length) throw new Error('sections: no section for ' + missed.join(', '));
  const strays = Object.keys(target).map(Number).filter((id) => !book1.some((r) => r.id === id));
  if (strays.length) throw new Error('sections: ' + strays.join(', ') + ' are not in book 1');

  book1.forEach((r) => {
    const s = target[r.id];
    r.secNum = s.n;
    r.secName = s.name;
    if (SERVINGS[r.id]) r.servings = SERVINGS[r.id];
  });

  /* Order, and the number on the page.
   *
   * The old sections were blocks of consecutive ids — 1 to 25 was Zero-Cook,
   * 26 to 50 Morning Brews — so printing in id order printed in section order
   * for free. These seven cut across that: recipe 1 is a snack, 2 and 3 are
   * lunch, 4 is a snack again. Printed in id order the book changes section on
   * almost every recipe, which is exactly what it did: eighty-eight pages
   * instead of fifty-two, a divider every page or two.
   *
   * So the printed order is by section, and `no` — a field the renderer has
   * always preferred over the id and which nothing has ever set — carries the
   * number on the page. The book reads 001 to 100 straight through again.
   *
   * The id does not move. It is what a favorite, a day of a week and a
   * household document are all keyed by, and renumbering those would empty a
   * phone that had been in use. So the number in the book changes and the
   * thing underneath it does not, which is the only version of this that
   * costs nobody their meal plan. */
  const order = book1.slice().sort((a, b) => a.secNum - b.secNum || a.id - b.id);
  order.forEach((r, i) => { r.no = i + 1; });

  const unused = Object.keys(SERVINGS).map(Number).filter((id) => !target[id]);
  if (unused.length) throw new Error('sections: servings given for ' + unused.join(', ') + ', which is not in book 1');

  return { order, sections: SECTIONS.length, moved: book1.length,
    relabelled: Object.keys(SERVINGS).length };
}

/* The whole collection, in the order it prints: Volume One by its new sections,
   then everything else exactly as it was. Volume One's recipes have to end up
   contiguous — six of them now arrive from added-recipes.js at the far end of
   the array, and leaving them there would print them after Around the Table.
 *
 * And then numbered, both volumes, straight through.
 *
 * Volume One was renumbered when it was re-sectioned and Volume Two was not,
 * because Volume Two had never needed it: its printed number had always been
 * its id, and its ids happened to run 101 to 266 in order. Both halves of that
 * stopped being true on the same afternoon. Six recipes left for Volume One,
 * which put a six-number hole at 257, and Volume One grew to a hundred and
 * eleven, which ran its numbers straight into Volume Two's — so the collection
 * printed eleven numbers twice over. Two recipes called 105. The front matter
 * one page earlier promises a number "running from 001 straight through both
 * volumes", and a reader looking one up would have found two.
 *
 * Numbering the whole run here is what makes that impossible rather than
 * fixed: there is one counter, it does not skip, and it cannot reach the same
 * number twice. Volume Three is left alone — it is numbered from one at
 * runtime because it is somebody's own recipes and it grows. */
function order(recipes) {
  const run = apply(recipes);
  module.exports.lastRun = run;
  /* Volume Two is numbered in section order, not in the order the sources
     happen to be concatenated in. It used to be the second of those, which
     worked only for as long as every recipe written for this edition belonged
     to a section at the end of the book: add a breakfast to section 1 and it
     numbered 335, printing between 175 and 176 with three hundred numbers
     between it and its neighbours. A stable sort by section fixes it for any
     section, and cannot reorder anything inside one. */
  const rest = recipes.filter((r) => r.book !== 1);
  const b2 = rest.filter((r) => r.book === 2)
    .map((r, i) => [r, i])
    .sort((a, b) => (a[0].secNum - b[0].secNum) || (a[1] - b[1]))
    .map((x) => x[0]);
  const all = run.order.concat(b2, rest.filter((r) => r.book !== 2));

  let n = 0;
  all.forEach((r) => { if (r.book === 1 || r.book === 2) r.no = ++n; });

  /* The id still does not move. It is what a favorite, a day of a week, a
     household document and now a cross-reference from one recipe to another
     are all keyed by; the number on the page is what the reader is given. */
  const seen = new Set();
  all.forEach((r) => {
    const k = r.book + '/' + r.no;
    if (r.no !== undefined && seen.has(k)) throw new Error('sections: two recipes numbered ' + r.no);
    seen.add(k);
  });
  return all;
}

module.exports = { SECTIONS, ASSIGN, SERVINGS, apply, order, lastRun: null };
