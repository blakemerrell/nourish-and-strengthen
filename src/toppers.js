/* What Fill adds to finish a day once the dishes are placed: a side of
 * vegetables (mSideUp) and a single food on top of a meal, honey on the
 * oatmeal or cottage cheese for the protein the dishes did not carry
 * (mTopUp), never saltier than the meals it finishes. The longer account
 * is with the code.
 *
 * A part of app.js (Nourish) in a file of its own. app.js calls
 * HiveParts.toppers(app) once, as it starts, and keeps what it gives back
 * under the same names. The food list and the recipe index, and the day's
 * sodium ceiling (declared further down, with the balancing), are read
 * through LIVE (tests/scope.test.js holds the lists to each other). Loaded
 * before app.js.
 */
(window.HiveParts = window.HiveParts || {}).toppers = function (app) {
  'use strict';

  // what it reads of the app's, and (LIVE) what the app replaces as it goes: BY_ID, MFOODS, MNA_CAP
  var MX = app.MX;
  var mExtOk = app.mExtOk;
  var mFoodMealOK = app.mFoodMealOK;
  var mNever = app.mNever;
  var mOnDay = app.mOnDay;
  var mReadSlots = app.mReadSlots;
  var mSaltFibre = app.mSaltFibre;
  var mSlotClosed = app.mSlotClosed;
  var mSlotW = app.mSlotW;
  var mTotals = app.mTotals;
  var macroFit = app.macroFit;
  var LIVE = app.LIVE;

  /* The topper: honey on the oatmeal, butter for the fat, cottage cheese for
     the protein the dishes did not carry.
   *
     One dish per meal leaves a day short. Four plates chosen to fit their own
     share land 300-odd calories under the target at every goal, and there is
     no fifth meal to put the rest in — the book has the food, the day has run
     out of slots to serve it on. Which is how anybody actually eats: the meal
     is the dish plus the thing you added to it.
   *
     So after the dishes are placed, the gap is closed with a single food
     rather than a second recipe. It is judged day-level — under and over both
     measured against what the day still has room for, the same stance
     Rebalance takes — because a topper exists to finish the day, not to fill
     a share of it. The same salt-and-fibre nudge applies, which is what keeps
     the fruit and the cottage cheese ahead of the soy sauce.
   *
     Two at most, and only onto a meal still in the future: a day topped up
     five times is not a meal plan, and adding food to a breakfast already
     eaten would be the app claiming he ate it. */
  var MTOP_GAP = 120;         // a gap smaller than this is not worth a topper
  /* A day can land on its calories and still leave the protein behind. The
     gap above is counted in calories, and when the dishes brought their fat
     and carbohydrate but not enough protein there are no calories left to
     count: one drafted day in twenty came in under 88% of its protein — the
     worst at 73% — with the calorie line sitting right on target, and the
     topper never asked. So a protein shortfall this deep earns a topper on
     its own. The fit then picks it against the protein alone, which is lean
     food (cottage cheese, chicken, egg whites, whey), and the balance that
     follows trims Fill's own plates to make the calories room for it. */
  var MTOP_P_SHORT = 0.10;    // protein this far under the day's target
  var MTOP_P_DENSE = 0.30;    // share of its calories a protein topper carries as protein
  var MTOP_MIN = 40;          // a serving under this is a seasoning, not a topper
  var MTOP_MAX = 2;
  /* A topper has to be food, and the fit score alone cannot tell the
     difference. A cup of soy sauce is a hundred and thirty-five calories at
     fifteen grams of protein per hundred — denser than chicken breast, on
     paper — and fourteen thousand milligrams of sodium, which is six days'
     worth. It cleared the calorie floor, scored beautifully against a protein
     gap, and the salt-and-fibre nudge that was supposed to catch it is
     clamped at six points, because it was built to separate two dinners and
     not to veto a condiment. So the ceiling is stated outright rather than
     left to a ranking: a spoonful added to finish a day cannot carry more
     salt than the meals it is finishing, and never more than the day has
     left. */
  var MTOP_NA = 400;

  /* The side of vegetables.
   *
     Seventeen hard-cut days in twenty-eight were finishing under the fibre
     line, and no weight in the portion solver could fix it: a solver resizes
     what is on the plate, and if none of the four dishes brought fibre there
     is nothing to make bigger. The day needed another thing on it.
   *
     Which is how anyone actually eats a cut — the meat, and a pile of
     vegetables beside it. So when the day comes in under the line, a side is
     added: steamed broccoli, peppers, carrots, a tomato. They cost almost
     nothing in calories, which is the whole reason this works where a fifth
     dish would not.
   *
     Ranked on fibre per calorie, with the salt it brings charged against it.
     That prefers peppers to green beans without being told to: a pound of
     peppers carries nine grams of fibre and eighteen milligrams of sodium, a
     can of beans six grams and five hundred. The density floor keeps it to
     vegetables and fruit — a potato is mostly not fibre, and a day short of
     roughage does not want more starch. */
  var MFIB_PER_K = 14;          // grams per thousand calories, the strip's own line
  var MSIDE_GAP = 4;            // a shortfall smaller than this is not worth a side
  var MSIDE_DENS = 6;           // g of fibre per 100 kcal to count as a vegetable
  var MSIDE_MAX = 2;
  /* What a milligram of sodium costs in grams of fibre, per hundred calories.
     Ranked on fibre alone the pass took canned green beans six times a month
     — thirteen grams of fibre per hundred calories, the best in the building,
     and five hundred milligrams of salt a tin with it, which moved the median
     day from twelve hundred milligrams to eighteen. At a hundred to one a
     pound of peppers wins on its own merits and the tin has to earn its
     place. */
  var MSIDE_NA_W = 100;

  function mSideSlot(day) {
    // the meal with the least roughage on it, and still open to changing
    var list = mReadSlots().list, best = null;
    list.forEach(function (s) {
      var items = day[s.k] || [], open = false, fib = 0;
      items.forEach(function (it) {
        var r = LIVE.BY_ID[it.id];
        if (!it.eaten) open = true;
        if (r && r.macro) fib += (r.macro.fib || 0) * it.x;
      });
      /* Closed by the one definition the other passes use: a tick OR a
         lock. "Any plate un-eaten" let a side onto a locked dinner, and onto
         a breakfast with one plate eaten and one still to come. */
      if (!items.length || !open || mSlotClosed(day, s.k)) return;
      if (!best || fib < best.fib) best = { s: s, fib: fib };
    });
    return best ? best.s : null;
  }

  function mSideUp(day, targets, near) {
    var added = 0;
    var floor = (4 * targets.p + 4 * targets.c + 9 * targets.f) * MFIB_PER_K / 1000;
    for (var n = 0; n < MSIDE_MAX; n++) {
      var tot = mTotals(day);
      var gap = floor - (tot.all.fib || 0);
      if (gap < MSIDE_GAP) return added;
      var slot = mSideSlot(day);
      if (!slot) return added;
      /* The topper's ceiling applies here too. A side is also something Fill
         put on the plate that nobody asked for, and "never a condiment's worth
         of salt from one addition" is a rule about additions, not toppers. It
         was the day's remaining room alone, so a double helping of a canned
         vegetable could bring six hundred milligrams on its own — which the
         suite's salt guard caught on some draws and not others. */
      var naRoom = Math.min(MTOP_NA, Math.max(0, LIVE.MNA_CAP - (tot.all.na || 0)));
      var best = null;
      LIVE.MFOODS.forEach(function (r) {
        if (r.eatout) return;
        var mac = r.macro || {};
        if (r.ext && !mExtOk()) return;     // Fill does not shop
        if (!r.side) return;
        if (mNever(r.id)) return;
        if (!mFoodMealOK(r, slot)) return;
        if (!(mac.fib > 0) || !(mac.kcal > 0)) return;
        if (mac.fib * 100 / mac.kcal < MSIDE_DENS) return;
        if (mOnDay(day, r.id) || (near && near[r.id])) return;
        /* The smallest helping on the ladder that closes the gap — and if
           none of them does, the largest, because most of a shortfall closed
           beats none of it. */
        var x = MX[MX.length - 1], i;
        for (i = 0; i < MX.length; i++) {
          if (mac.fib * MX[i] >= gap) { x = MX[i]; break; }
        }
        if ((mac.na || 0) * x > naRoom) return;
        /* Ranked on fibre per calorie outright, not on the picker's
           salt-and-fibre reading. That reading is clamped at four points of
           fibre, which every vegetable here reaches, so it called a pound of
           peppers and an apple equally good and then took whichever came
           first alphabetically. Seventeen apples in twenty-eight days, and
           the fibre got WORSE — an apple spends ninety-five calories to buy
           four grams, and the solver pays for those calories by shrinking the
           dishes that were carrying the fibre already.
         *
           And fibre per calorie alone is not enough of a test either: ranked
           on it, the pass reached for cinnamon and cocoa, which are fibrous
           the way a spice is fibrous. A side has to be something you would
           put on a plate, so the food itself says whether it is one. */
        var sc = mac.fib * 100 / mac.kcal - (mac.na * 100 / mac.kcal) / MSIDE_NA_W;
        if (!best || sc > best.score) best = { r: r, x: x, score: sc };
      });
      if (!best) return added;
      (day[slot.k] = day[slot.k] || []).push({ id: best.r.id, x: best.x, eaten: 0, by: 'f', why: 'fib' });
      added++;
    }
    return added;
  }

  /* Every meal a topper could go on, the emptiest first. */
  function mTopSlots(day, targets) {
    var list = mReadSlots().list, sumW = 0, cand = [];
    var dayKcal = 4 * targets.p + 4 * targets.c + 9 * targets.f;
    list.forEach(function (s) { sumW += mSlotW(s); });
    if (!sumW) return [];
    list.forEach(function (s) {
      var items = day[s.k] || [], open = false, have = 0;
      items.forEach(function (it) {
        var r = LIVE.BY_ID[it.id];
        if (!it.eaten) open = true;
        if (r && r.macro) have += (r.macro.kcal || 0) * it.x;
      });
      // a meal with nothing on it is Fill's job; a tick or a lock closes one
      if (!items.length || !open || mSlotClosed(day, s.k)) return;
      cand.push({ s: s, gap: dayKcal * (mSlotW(s) / sumW) - have });
    });
    // a stable sort: equal gaps keep the meals' own order, as before
    return cand.map(function (o, i) { o.i = i; return o; })
      .sort(function (a, b) { return b.gap - a.gap || a.i - b.i; })
      .map(function (o) { return o.s; });
  }

  function mTopUp(day, targets, near) {
    var added = 0;
    for (var n = 0; n < MTOP_MAX; n++) {
      var tot = mTotals(day), R = {}, D = {};
      ['p', 'f', 'c'].forEach(function (m) {
        R[m] = Math.max(0, targets[m] - tot.all[m]);
        D[m] = Math.max(1, targets[m]);
      });
      var pShort = R.p >= MTOP_P_SHORT * D.p;
      if (4 * R.p + 4 * R.c + 9 * R.f < MTOP_GAP && !pShort) return added;
      /* Why it is there: the gap it was closing, the largest of the three in
         calories. Said on the plate ("Added for protein"). */
      var gapK = { p: 4 * R.p, f: 9 * R.f, c: 4 * R.c };
      var why = ['p', 'f', 'c'].reduce(function (a, m) { return gapK[m] > gapK[a] ? m : a; }, 'p');
      var slots = mTopSlots(day, targets), slot = null, best = null;
      var naRoom = Math.min(MTOP_NA, Math.max(0, LIVE.MNA_CAP - (tot.all.na || 0)));
      /* The emptiest meal first, and the next when that one has nothing
         that answers: a breakfast whose protein foods are all on the day
         already should not stop a protein topper from landing on lunch. */
      for (var si = 0; si < slots.length && !best; si++) {
        slot = slots[si];
        best = mTopPick(day, slot, R, D, near, naRoom, why);
      }
      if (!best) return added;
      (day[slot.k] = day[slot.k] || []).push({ id: best.r.id, x: best.x, eaten: 0, by: 'f', why: why });
      added++;
    }
    return added;
  }

  /* The best single food for one meal's topper, or null. */
  function mTopPick(day, slot, R, D, near, naRoom, why) {
      var best = null;
      LIVE.MFOODS.forEach(function (r) {
        if (r.eatout) return;
        var mac = r.macro || {};
        if (r.ext && !mExtOk()) return;     // Fill does not shop
        if (!mFoodMealOK(r, slot)) return;
        if ((mac.kcal || 0) < MTOP_MIN) return;
        if (((mac.p || 0) + (mac.c || 0) + (mac.f || 0)) <= 0) return;
        /* Something you would eat, not something you cook in. On a very low
           carbohydrate day the fat gap is the one left, and the best fit for
           a fat gap is oil: it was a topper on one day in six, and on some
           the solver then shrank the dish to a quarter to make room for two
           tablespoons of it. A topper carries at least a tenth of itself as
           protein or carbohydrate — nuts qualify, oil and butter do not. */
        if (4 * ((mac.p || 0) + (mac.c || 0)) < 0.10 * (mac.kcal || 0)) return;
        /* Added for protein means it brings protein. With only protein left
           to close and the carbohydrate and fat already spent, the fit could
           find nothing that helped and took the least harm instead — half a
           spoon of sugar, an orange — and labelled it "Added for protein". A
           third of its calories as protein, at least: cottage cheese, yogurt,
           egg whites, whey and chicken clear it, fruit and sugar do not. */
        if (why === 'p' && 4 * (mac.p || 0) < MTOP_P_DENSE * (mac.kcal || 0)) return;
        if (mNever(r.id)) return;
        if (mOnDay(day, r.id) || (near && near[r.id])) return;
        var fit = macroFit(r, R, R, D);
        // priced at the portion actually being added, not per hundred grams
        if ((mac.na || 0) * fit.x > naRoom) return;
        var sc = fit.score + mSaltFibre(r, fit.x);
        if (!best || sc > best.score) best = { r: r, x: fit.x, score: sc };
      });
      return best;
  }

  return { mSideUp: mSideUp, mTopUp: mTopUp, MTOP_NA: MTOP_NA };
};
