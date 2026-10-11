/* A portion: what one is called, in the recipe's own words (mPortion,
 * mPortionText); counted in grams or in the food's own unit (mByGram,
 * mDialUnit, mUnitWord); the sizes the solver may propose and one step
 * either way (mLadder, mStepX); and the portion as a number you could type,
 * and back (mTypedFromX, mXFromTyped). The longer account is with the code.
 *
 * A part of app.js (Nourish) in a file of its own. app.js calls
 * HiveParts.portion(app) once, as it starts, and keeps what it gives back
 * under the same names. The full list of sizes (MX_ALL) is declared further
 * down app.js, so the part reads it through LIVE (tests/scope.test.js holds
 * the lists to each other). Loaded before app.js.
 */
(window.HiveParts = window.HiveParts || {}).portion = function (app) {
  'use strict';

  // what it reads of the app's, and (LIVE) what the app replaces as it goes: MX_ALL
  var fixUnit = app.fixUnit;
  var fmtNum = app.fmtNum;
  var mFixNoun = app.mFixNoun;
  var mServeG = app.mServeG;
  var LIVE = app.LIVE;

  /* What one portion of this is CALLED, in the recipe's own words. A recipe's
     servings line is a yield — "6 Small Oat Bites", "4 Servings", "2 Loaves"
     — and the noun on the end of it is the name of one of them. The last word
     is what keeps it short enough to sit on the stepper: a day counted in
     "Meal Prep Containers" is counted in containers. A food carries its unit
     outright. */
  function mUnitWord(r) {
    if (r.food) {
      var ls = mLabelServing(r);
      if (ls && ls.noun && MSTEP_COUNT[ls.noun.toLowerCase()]) return ls.noun.toLowerCase();
      return String(r.unit || 'serving');
    }
    /* The word is only the serving's word when the count in front of it IS
       the serving count. "8 Pancakes (4 Servings)" named a plate "1 pancake"
       and charged two; "About 1 Cup (8 Servings)" of syrup read "1 cup" for
       an eighth of one. The book's lines lead with the count now, and a line
       that does not — an own recipe reading "Makes a dozen" — gets the plain
       word rather than a wrong one. */
    var lead = parseFloat(String(r.servings || '').replace(/^\s*about\s+/i, ''));
    if (!(lead > 0) || Math.abs(lead - (r.servN || 1)) > 0.01) return 'serving';
    // a parenthetical or an aside after a dash describes the yield, it is not the yield
    var s = String(r.servings || '').split(' (')[0].split('—')[0].split('–')[0];
    // strip the count off the front — digits, fractions and an optional "about"
    s = s.replace(/^\s*(?:about\s+)?[\d\s.\/¼-¾⅐-⅞-]*/i, '');
    var w = (s.match(/[A-Za-z][A-Za-z'’]*\s*$/) || [''])[0].trim().toLowerCase();
    return w || 'serving';
  }

  /* How much of a plate this is, in two halves.
   *
     `head` is the portion itself — "1¾ bites", "¾ serving", "1 cup" — and
     goes on the stepper, beside the buttons that change it. `detail` is
     whatever else is worth knowing about that much: a weight, or how many
     things went into a meal you kept together. A bare unit was the original
     complaint — "serving" next to a kept-together salad said nothing about
     how much salad.
   *
     `x` is servings EATEN, so the portion is x of them and nothing else.
     This used to multiply by servN as well, which counted the recipe's whole
     yield a second time: a plate holding 1¾ of a six-bite batch announced
     itself as "10½ servings" while the macro line beside it — correctly —
     charged for 1¾. Every macro, bar and solver in the app has always used x
     straight, so only this line was ever wrong; it was wrong on every recipe
     that makes more than one serving. */
  /* How far a portion may be stepped, and by how much.
   *
     Blake, logging his lunch: "the limit on the qty I can select. Is it
     limiting me to 4 nuts and won't let me add more." It was, and not only
     nuts — his day had bacon at 4 slices, gummies at 4 pieces, hard candy at
     4 pieces and ground beef at 4 oz, every one of them sitting on the same
     ceiling. Both steppers, the plate's and the picker's, carried their own
     copy of Math.min(4, x + 0.25).
   *
     Four is a sane ceiling for a RECIPE, where x is a multiple of a serving —
     the recipe panel has scaled a dish a quarter to eight times since the app
     was built, so eight is the app's own answer to "how much of one dish is
     still a portion". It was never a ceiling for a FOOD, where x is a count
     of the thing itself: four nuts is not a snack, it is a rounding error.
   *
     A quarter is the wrong STEP for those too. You cannot eat a quarter of a
     nut, a quarter of a slice of bacon or a quarter of a gummy; you can very
     easily eat a quarter of a cup. So the countable things step by one and
     the measurable ones keep their quarters. */
  var MSTEP_COUNT = { nut: 1, piece: 1, slice: 1, each: 1, whole: 1, egg: 1,
    bar: 1, cookie: 1, cracker: 1, chip: 1, wrap: 1, tortilla: 1, link: 1,
    patty: 1, scoop: 0.25, packet: 1, can: 1, bag: 1 };
  /* A scoop is counted in quarters (Blake, 2026-10-04, of whey: "I might
     want a quarter scoop or half a scoop or 3/4 scoop. So whatever that is in
     grams"). Nobody halves an egg; plenty of people take half a scoop. */

  /* Dialled by the gram, or counted in ones.
   *
     Blake weighs: "sometimes it's just easier for me to measure the food on
     a scale than using cups" — and then, of the dial, "adjust grams with the
     +/- and show the serving size where the grams are being shown now." So a
     food measured by the cup, the spoon, the ounce or the pound is dialled by
     the gram: the weight is the number on the stepper, and the unit it came
     in is the chip beside it — the old arrangement turned around. A food
     that comes in ones — an egg, a slice, a nut, a bar — still counts in
     ones with its weight on the chip, because nobody weighs an egg. A food
     you typed yourself has no weight to dial. */
  var MGRAM_STEP = 5;
  function mByGram(r) {
    if (!r || !r.food) return false;
    var unit = String(mUnitWord(r) || '').toLowerCase();
    /* A food you typed yourself in grams has no weight per unit and needs
       none: its unit IS the gram (mGramBase says a hundred of them). */
    if (unit === 'g') return true;
    return !!r.grams && !MSTEP_COUNT[unit];
  }
  /* What the number on the dial is counted in: grams, or the food's own
     unit with "each" said as "whole". */
  function mDialUnit(r) {
    if (mByGram(r)) return 'g';
    /* Typing still counts servings; say what one is, "× ½ cup". */
    var ls = mLabelServing(r);
    if (ls) return '\u00d7 ' + fmtNum(ls.q) + ' ' + ls.noun;
    var u = mUnitWord(r);
    return u === 'each' ? 'whole' : u;
  }

  function mStepRule(r) {
    /* A dish keeps a ceiling, because x means MULTIPLES OF A SERVING there
       and the recipe panel has scaled one a quarter to eight times since the
       app was built. Eight servings of one dish is the end of the question. */
    if (!r || !r.food) return { step: 0.25, max: 8 };
    var unit = String(mUnitWord(r) || '').toLowerCase();
    var step = MSTEP_COUNT[unit] || 0.25;
    /* A food has NO ceiling. Blake: "why even have a cap? Probably can remove
       it for foods." He is right, and the reasoning is the same one that made
       four wrong: x is a count of the thing itself, so a ceiling is the app
       deciding how much of it a person may eat. Ninety-nine was as arbitrary
       as four; it only bit less often.
     *
       Nothing downstream wanted the bound either. The cost line and the day's
       bars are computed from x and redraw as it moves, the bars clamp their
       own fills, and a number typed wrong is one tap from right. Only the
       ARITHMETIC has to hold, which is what the guard below is for: a portion
       must stay a positive, finite number. */
    return { step: step, max: Infinity };
  }

  /* The sizes the solver may PROPOSE for one plate.
   *
     Coordinate descent used a single global ladder — MX_ALL, a quarter to
     four — for every plate on the day. That is the right ladder for servings
     of a dish and the wrong one for a count of a thing: it could never offer
     eighteen nuts or two hundred grams, only snap toward four. Hand-stepping
     past it survived by luck rather than design, because `best` starts at the
     plate's current size and a bigger one wins on a day still under target —
     on a day gone OVER the same code walks it back down to four.
   *
     So the ladder follows the food: its own step, the low end kept so the
     solver can still shrink a plate to nothing much, and a dozen rungs either
     side of where the plate actually sits so it can be tuned rather than
     replaced. Bounded in length because the descent runs this for every free
     plate on every pass. */
  function mLadder(r, x) {
    if (!r || !r.food) return LIVE.MX_ALL;
    var step = mStepRule(r).step;
    var here = Number(x) > 0 ? Number(x) : step;
    var seen = {}, out = [];
    var put = function (v) {
      v = Math.round(v / step) * step;
      v = Math.round(v * 1000) / 1000;
      if (v >= step && !seen[v]) { seen[v] = 1; out.push(v); }
    };
    for (var i = 1; i <= 12; i++) put(i * step);        // the low end, always
    for (var j = -6; j <= 6; j++) put(here + j * step); // and where it sits now
    return out.sort(function (a, b) { return a - b; });
  }

  /* One step, in whichever direction, under that rule. Shared because the two
     steppers that need it were already two copies of one line. */
  function mStepX(r, x, dir) {
    /* Five grams a tap, on the five-gram grid, never below five. A weight
       that arrives off the grid — 113 g, a cup of cheddar the solver sized —
       goes to the NEXT grid point in the direction pressed (115, then 120),
       so no tap ever moves more than five grams. Only the hand dial: the
       solver's ladder (mLadder) keeps stepping in the food's own unit, where
       a rung is a kitchen-sized move rather than a nudge. */
    if (mByGram(r)) {
      /* Whole grams first. x is kept to four decimals, and 145 g of a
         140 g cup is 1.0357 of it — which times 140 is 144.998, one grid
         point SHORT of where the dial says it is, so the next tap up landed
         on 145 again and chicken breast stuck there for good. The dial
         rounds to the gram; the step starts from the same number. */
      var g = Math.round((Number(x) || 0) * mGramBase(r)), st = MGRAM_STEP;
      g = dir > 0 ? Math.floor(g / st) * st + st : Math.ceil(g / st) * st - st;
      g = Math.max(st, g);
      return Math.round(g / mGramBase(r) * 10000) / 10000;
    }
    var rule = mStepRule(r);
    var next = (Number(x) || 0) + (dir > 0 ? rule.step : -rule.step);
    /* Land back on the grid when a portion arrives off it — a food solved to
       1.75 nuts by the balancer should step to 2, not to 2.75. */
    next = Math.round(next / rule.step) * rule.step;
    next = Math.max(rule.step, Math.min(rule.max, next));
    return Math.round(next * 1000) / 1000;
  }

  /* The portion as a number you could type, and back again.
   *
     They are not the same number. For everything counted in its own units — a
     nut, a slice, a serving, a cup — x IS the count and the conversion is the
     identity. For a food measured in grams it is not: mPortion shows
     r.grams * x, so the 185 on screen is a weight and the x behind it is a
     multiple of one portion of that food. Typing 185 and storing 185 would be
     storing a hundred and eighty-five servings. */
  function mGramBase(r) { return (r && r.grams) || 100; }

  function mTypedFromX(r, x) {
    var n = mByGram(r) ? (Number(x) || 0) * mGramBase(r) : (Number(x) || 0);
    return Math.round(n * 100) / 100;
  }

  function mXFromTyped(r, n) {
    var v = mByGram(r) ? (Number(n) || 0) / mGramBase(r) : (Number(n) || 0);
    /* The only bound left, and it is arithmetic rather than policy: a portion
       has to be a positive, finite number or every figure downstream of it is
       NaN. There is no ceiling — see mStepRule. */
    if (!isFinite(v) || v <= 0) return null;
    return Math.round(v * 10000) / 10000;
  }

  /* The meal sheet's dial: grams, for everything that has a weight.
   *
     Blake, 2026-10-04: "I dial in grams of food not kitchen measurements" —
     and recipes too, from their serving weight. So the number between − and
     + is a weight wherever one is known: a food by its own grams, a counted
     food (an egg, a scoop) by the weight of one, a recipe by what one
     serving weighs (mServeG, an estimate until the batch is weighed). The
     kitchen measure is the small print under the name. x is still what is
     stored; this is only how it is dialled and shown.
   *
     The step is five grams, except where nobody eats a fraction: a counted
     food steps one of it (an egg is 50 g, so 100 g → 150 g) and a scoop a
     quarter of one (8 g of whey) — the count rule mStepX already keeps,
     said in grams. A food with no weight at all, typed in by hand, keeps its
     own unit. */
  function mDialG(r) {
    if (!r) return 0;
    if (r.food) {
      if (String(mUnitWord(r)).toLowerCase() === 'g') return mGramBase(r);
      if (r.grams) return r.grams;
      var ls = mLabelServing(r);
      // x counts label servings, so one x is the label's own weight (as mPortion)
      return ls && ls.g ? ls.g : 0;
    }
    var sg = mServeG ? mServeG(r) : null;
    return sg && sg.g > 0 ? sg.g : 0;
  }
  function mDialEst(r) {
    if (!r || r.food || !mServeG) return false;
    var sg = mServeG(r);
    return !!(sg && sg.est);
  }
  // the dial's own words: "~212 g", or the unit when there is no weight
  function mDialText(r, x) {
    var g = mDialG(r);
    if (!g) return mPortion(r, x).head;
    return (mDialEst(r) ? '~' : '') + Math.round(x * g).toLocaleString('en-US') + ' g';
  }
  // the kitchen's word for the same amount, for the small print
  function mDialMeasure(r, x) {
    var p = mPortion(r, x);
    if (!mDialG(r)) return p.detail;
    /* A recipe dialled by the gram lands between servings — 215 g of a
       212 g serving is 1.01 of it — so the word is said to the nearest
       quarter and counted by what is shown: "1 serving", not "1 servings". */
    if (!r.food) {
      var q = Math.round(x * 4) / 4;
      return q > 0 ? fmtNum(q) + ' ' + mFixNoun(mUnitWord(r), q) : 'less than ¼ ' + mFixNoun(mUnitWord(r), 1);
    }
    return /\d g$/.test(p.head) ? p.detail : p.head;
  }
  function mDialStep(r, x, dir) {
    var G = mDialG(r);
    var unit = String(mUnitWord(r) || '').toLowerCase();
    if (!G || (r.food && MSTEP_COUNT[unit])) return mStepX(r, x, dir);
    var g = Math.round((Number(x) || 0) * G), st = MGRAM_STEP;
    g = dir > 0 ? Math.floor(g / st) * st + st : Math.ceil(g / st) * st - st;
    g = Math.max(st, g);
    return Math.round(g / G * 10000) / 10000;
  }
  function mDialFromX(r, x) {
    var G = mDialG(r);
    return G ? Math.round((Number(x) || 0) * G) : mTypedFromX(r, x);
  }
  function mXFromDial(r, n) {
    var G = mDialG(r);
    if (!G) return mXFromTyped(r, n);
    var v = (Number(n) || 0) / G;
    if (!isFinite(v) || v <= 0) return null;
    return Math.round(v * 10000) / 10000;
  }

  /* A label's noun, counted. fixUnit knows the kitchen's words ("2 cups")
     and not the yield nouns a packet uses, so "1 bar (40 g)" at two read
     "2 bar"; mFixNoun knows those. Only the first word is counted —
     "slice bread" is two slices of bread. */
  function mLabelNoun(noun, n) {
    var out = fixUnit(noun, n);
    if (out !== noun) return out;
    var m = /^([a-z]+)(.*)$/.exec(noun);
    return m ? mFixNoun(m[1], n) + m[2] : noun;
  }
  /* A serving off a label that says its own amount: "0.5 cup (113 g)".
     Four of those were shown as "4 0.5 cup (113 g)" — two numbers side by
     side, neither of them the amount. Multiplied out, it is "2 cups". */
  function mLabelServing(r) {
    if (!r || !r.food) return null;
    /* The aside in brackets is the serving's weight when it is grams,
       "2 Tbsp (32 g)", and otherwise only words: a scanned can of soda says
       "1 can (335 ml)". That one used to miss this pattern altogether, and
       the plate read "1 1 can (335 ml)" (Blake's Snacks, 2026-10-08): the
       count put in front of a unit that already had one. */
    var m = /^\s*(\d+(?:\.\d+)?|\d+\/\d+)\s+([^()]+?)\s*(?:\(([^()]*)\))?\s*$/i.exec(String(r.unit || ''));
    if (!m) return null;
    var q = m[1].indexOf('/') > 0 ? Number(m[1].split('/')[0]) / Number(m[1].split('/')[1]) : Number(m[1]);
    if (!(q > 0)) return null;
    var gm = /^\s*(\d+(?:\.\d+)?)\s*(?:g|grams?|ml|milliliters?)\s*$/i.exec(m[3] || '');
    /* "1 order, NS as to size" is the USDA saying it does not know the
       size; the noun is the order. Kept, it filled a dial too narrow for it
       and showed ", NS as t" (Blake's french fries, the same day). */
    var noun = m[2].replace(/,?\s*\bNS as to\b.*$/i, '').trim() || m[2].trim();
    /* A serving already said in grams weighs what it says. The USDA quotes a
       food with no household measure per "100 g", and so does Open Food
       Facts for a product with no serving size (src/foodsearch.js,
       src/lookup.js); read as a serving called "g" with no weight, the dial
       showed "50 g" and then asked for multiples of 100 g once tapped, in a
       box squeezed to one digit. Blake typed the 5 he could see: five
       hundred grams of butter replacement. */
    if (!gm && /^(g|grams?|ml|milliliters?)$/i.test(noun)) return { q: q, noun: noun, g: q };
    return { q: q, noun: noun, g: gm ? Number(gm[1]) : 0 };
  }
  function mPortion(r, x) {
    var unit = mUnitWord(r);
    var ls = !mByGram(r) && mLabelServing(r);
    if (ls) {
      var tot = Math.round(x * ls.q * 8) / 8;
      var gl = ls.g ? Math.round(ls.g * x) : (r.grams ? Math.round(r.grams * x) : 0);
      // a serving said in grams has said its weight already: not "30 g · 30 g"
      if (/^(g|grams?|ml|milliliters?)$/i.test(ls.noun)) gl = 0;
      return { head: fmtNum(tot) + ' ' + mLabelNoun(ls.noun, tot), detail: gl ? gl + ' g' : '' };
    }
    var grams = r.grams ? Math.round(r.grams * x) : 0;
    if (unit === 'g') return { head: (grams || Math.round(100 * x)) + ' g', detail: '' };
    /* The chip is the weight said in the kitchen's word, to the nearest
       eighth: 145 g of chicken is "1 cup", 21 g of peanut butter "1⅜ tbsp".
       Plural by the eighth that is SHOWN, not by x — 145 g is 1.04 cups, and
       the live site said "1 cups" of it. */
    if (mByGram(r)) {
      var lg = mLabelServing(r);
      if (lg) { var tl = Math.round(x * lg.q * 8) / 8; return { head: grams + ' g', detail: fmtNum(tl) + ' ' + mLabelNoun(lg.noun, tl) }; }
      var shown = Math.round(x * 8) / 8;
      return { head: grams + ' g', detail: fmtNum(shown) + ' ' + fixUnit(unit, shown) };
    }
    var head = unit === 'each' ? fmtNum(x) + ' whole'
      : fmtNum(x) + ' ' + (r.food ? fixUnit(unit, x) : mFixNoun(unit, x));
    if (r.parts && r.parts.length) {
      return { head: head, detail: r.parts.length + (r.parts.length === 1 ? ' part' : ' parts') };
    }
    return { head: head, detail: grams ? grams + ' g' : '' };
  }

  // the whole phrase, for the places that have room for it
  function mPortionText(r, x) {
    var p = mPortion(r, x);
    return p.detail ? p.head + ' · ' + p.detail : p.head;
  }

  /* mYieldText — "makes 4" — went with the provenance row it was the middle
     third of. The plate had one caller and there was never a second; the
     recipe says what it makes, on the recipe, where you read it while
     cooking rather than while eating. Deleted rather than left standing: a
     function nothing calls is a claim that something does. */

  return { mUnitWord: mUnitWord, mByGram: mByGram, mDialUnit: mDialUnit, mLadder: mLadder, mStepX: mStepX, mTypedFromX: mTypedFromX, mXFromTyped: mXFromTyped, mPortion: mPortion, mPortionText: mPortionText,
    mDialG: mDialG, mDialEst: mDialEst, mDialText: mDialText, mDialMeasure: mDialMeasure, mDialStep: mDialStep, mDialFromX: mDialFromX, mXFromDial: mXFromDial };
};
