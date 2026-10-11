/*
 * The nutrition score, on its own so that three things can share it: the build
 * that scores the 266 printed recipes, the browser that scores the ones you
 * write yourself, and anyone auditing either.
 */

/*
 * This edition's score. Six things, out of 100.
 *
 * The first three are the original book's, rescaled. Sodium and fiber came
 * next: the old score awarded nothing for fiber and counted salt as free, in a
 * collection built on canned chicken, canned soup and boxed mixes. A can of
 * tuna with mayonnaise scored 98 while a pot of beans and vegetables scored in
 * the sixties.
 *
 * Carbohydrate is the sixth, and it was free in exactly the same way salt used
 * to be. Across the whole collection the correlation between carbohydrate's
 * share of a recipe's calories and its score was 0.012 — not weak, nothing.
 * Worse than nothing, in fact: the fat part rewards a low fat share, so
 * trading fat for sugar at the same calories and the same protein moved a
 * recipe from 65 to 70. Two hundred and fifty calories of sugar dissolved in
 * water scored 55. A hot milk with brown sugar in it scored 75.
 *
 * What is measured is not carbohydrate. Oats and frosting are both
 * carbohydrate, and a score that cannot tell them apart is worse than no score
 * at all — it would mark down the one recipe in the collection built on rolled
 * oats and slow protein.
 *
 * So: a gram of fiber earns ten grams of carbohydrate, which is roughly the
 * ratio a whole food arrives in. Whatever carbohydrate is left over came with
 * nothing attached to it, and that is what costs points. Overnight oats come
 * out at 6% of calories and lose nothing; the same size mug of hot milk and
 * brown sugar comes out at 49% and loses the lot. No new data was needed for
 * it — fiber was already estimated for every recipe, and this asks a second
 * question of a number that was already there.
 *
 * Making room for it: every one of the five existing parts keeps its shape and
 * its band exactly, and only its maximum is scaled down. Nothing about what
 * earns sodium points or fiber points has changed, so the ordering within each
 * part is identical to the previous edition — the parts simply add to 88
 * before carbohydrate has its say.
 */
const MAX = { p: 27, k: 18, f: 8, s: 22, b: 13, c: 12 };   // 100

function scoreFrom(macro) {
  if (!macro || !(macro.kcal > 0)) {
    return {
      score: 0,
      sc: {
        p: 0, k: MAX.k, f: 0, s: MAX.s, b: 0, c: 0,
        pPct: 0, fPct: 0, cPct: 0,
        na: Math.round((macro && macro.na) || 0),
        fib: Math.round(((macro && macro.fib) || 0) * 10) / 10,
      },
    };
  }
  const pPct = (macro.p * 4) / macro.kcal * 100;
  const fPct = (macro.f * 9) / macro.kcal * 100;
  const na = macro.na || 0;
  const fib = macro.fib || 0;
  const clamp = (x, hi) => Math.max(0, Math.min(hi, x));

  /* Carbohydrate arriving with no fiber beside it, as a share of the calories.
     The collection's median is 6% and its ninetieth percentile is 43%, so full
     marks to 10% and nothing left by 50% sits either side of where the recipes
     actually are rather than at a round number chosen in advance. */
  const bare = Math.max(0, (macro.c || 0) - fib * 10);
  const cPct = (bare * 4) / macro.kcal * 100;

  const p = clamp((pPct / 45) * MAX.p, MAX.p);                       // protein share of energy
  const k = clamp(MAX.k - Math.max(0, macro.kcal - 300) / (25 * 20 / MAX.k), MAX.k);  // calorie load
  const f = clamp((MAX.f * (45 - fPct)) / 35, MAX.f);                // fat share of energy
  const s = clamp(MAX.s * (1200 - na) / 900, MAX.s);                 // sodium: full to 300 mg, none by 1200
  const b = clamp(MAX.b * (fib / 7), MAX.b);                         // fiber: full marks at 7 g
  const c = clamp(MAX.c * (50 - cPct) / 40, MAX.c);                  // unfibered carbohydrate

  return {
    score: Math.round(p + k + f + s + b + c),
    sc: {
      p: Math.round(p), k: Math.round(k), f: Math.round(f), s: Math.round(s),
      b: Math.round(b), c: Math.round(c),
      pPct: Math.round(pPct), fPct: Math.round(fPct), cPct: Math.round(cPct),
      na: Math.round(na), fib: Math.round(fib * 10) / 10,
    },
  };
}

/*
 * Everything a recipe's ingredient list is worth: calories and macros per
 * serving, sodium, fiber, and the parsed lines the shopping list adds up.
 * The build uses this for the printed books; the app uses it the moment you
 * finish typing a recipe of your own, so both are measured the same way.
 */
function nutritionFor(ing, servN, extras, parseLine, FOODS, SPICE_NAMES) {
  let p = 0, c = 0, f = 0, na = 0, fib = 0;
  const unmatched = [], assumed = [], items = [];
  const names = String(extras || '').toLowerCase().split(/,\s*/).map((x) => x.trim()).filter(Boolean);

  /* One slot per ingredient line, always. The app pairs them by position —
     line i of `ing` asks about item i of `ingp` — and a line that could not be
     parsed used to be left out of `items` altogether, which shifted every
     later pairing by one. The printed collection parses cleanly so it never
     showed there; a recipe somebody writes with one ingredient the table does
     not know had its grams labelled with the wrong names from that line on.
     A placeholder keeps the two lists the same length, and every consumer
     already skips an item with no food key or ignores it. */
  const blank = () => items.push({ k: '', g: 0, u: '' });

  (ing || []).forEach((line) => {
    const r = parseLine(line);
    if (!r) { blank(); return; }
    if (r.unmatched) { unmatched.push(r.unmatched); blank(); return; }
    if (r.assumed) assumed.push(line + ' \u2014 ' + r.assumed);
    const food = FOODS[r.key];
    /* `pe`: the share of a dredge or a soak that reaches the plate (parse-lib,
       EATEN). Every macro scales with it; `g` below stays what you buy. */
    const pe = r.pe === undefined ? 1 : Math.round(r.pe * 1000) / 1000;
    const k = r.grams / 100 * pe;
    /* A trimmed line (parse-lib) keeps a fraction of the food's fat, and only
       the fat — the lean keeps every gram of its protein, which is why this
       scales `f` alone rather than the whole row. The calories used to need
       their own correction here, subtracting the removed fat at nine a gram
       from a figure that already counted it; they no longer do, because the
       calorie is now derived from these macros further down and a gram of fat
       that is not in `f` cannot be in it. */
    const fx = r.fx === undefined ? 1 : r.fx;
    const fat = food.f * fx;
    p += food.p * k; c += food.c * k; f += fat * k;
    na += (food.na || 0) * k; fib += (food.fib || 0) * k;
    const it = { k: r.key, g: Math.round(r.grams * 10) / 10, u: r.unit || '' };
    /* How much of the fat survived the knife, when the line said "trimmed".
       `g` is what you buy and carry home, so it stays the untrimmed weight —
       the shopping list would send you out for too little otherwise — which
       means a reader adding this row up from `g` alone lands above what the
       recipe actually feeds you, by about a quarter on a roast. Recording the
       factor makes the row say so instead of leaving the difference to be
       rediscovered. Absent on every line that was not trimmed, so the common
       case costs nothing. */
    if (r.fx !== undefined && r.fx !== 1) it.pr = r.fx;
    /* And how much of a dredge or a soak was eaten, so a reader adding the row
       up from `g` lands on the recipe's figure rather than on the bowl's. */
    if (pe !== 1) it.pe = pe;
    if (food.split) it.a = SPICE_NAMES[r.alias] || r.alias;
    if (names.some((n) => line.toLowerCase().indexOf(n) >= 0)) it.x = 1;
    /* "(optional)" on the line, meaning it. Two recipes exist so that somebody
       with nothing but the storehouse order can still make barbecue sauce and
       gravy, and both listed celery salt — which the order does not carry. So
       the rescue recipe sent you shopping, which is the one thing it must not
       do. Marked optional, the line still counts toward the nutrition (you may
       well add it) but never toward what you have to go out for. */
    if (/\(\s*optional\s*\)/i.test(line)) it.o = 1;
    items.push(it);
  });

  const n = servN && servN > 0 ? servN : 1;
  /* One calorie, and it is four-four-nine of the macros printed beside it.
   *
   * The table's own kcal is the better nutritional figure — it knows that a
   * third of cocoa's carbohydrate never gets digested, so 228 a hundred grams
   * and not the 434 the arithmetic says — and summing it is what this used to
   * do. But the app asks "how many calories is this" in exactly one voice
   * everywhere else: every target is 4p+4c+9f of macros a person typed, and
   * there is no label to read for food not yet chosen. So the eaten side
   * summed a fibre-aware figure while the target side derived a blind one,
   * and every gauge in My Day compared the two — about twelve calories on a
   * day, and it is the same twelve that made a meal ask for 41 g of protein
   * inside 113 calories.
   *
   * Deriving costs a median of 6 kcal a recipe and at most 25. Mixing costs
   * the property that the numbers add up, which is the one a person checks by
   * hand. The refinement is real and the app has nowhere to put it: no screen
   * asks what a dish's energy is independently of what it does to the day.
   *
   * Derived from the ROUNDED macros deliberately, not from the running sums,
   * so that the four figures a card shows are four figures that add up. A
   * kcal rounded off its own unrounded parts lands a calorie or two away from
   * the arithmetic the reader can do, which is the whole complaint. */
  const P = Math.round(p / n), C = Math.round(c / n), F = Math.round(f / n);
  return {
    perServing: {
      kcal: 4 * P + 4 * C + 9 * F, p: P, c: C, f: F,
      na: Math.round(na / n), fib: Math.round((fib / n) * 10) / 10,
    },
    items, unmatched, assumed,
  };
}

module.exports = { scoreFrom, nutritionFor, MAX };
