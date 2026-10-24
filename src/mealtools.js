/* One meal at a time: its portions solved against its own share, never
 * moving what is eaten or locked (mBalanceMeal), and the meal kept as a
 * food of your own (mSaveMeal). The longer account is with the code.
 *
 * A part of app.js (Nourish) in a file of its own. app.js calls
 * HiveParts.mealtools(app) once, as it starts, and keeps what it gives back
 * under the same names. The recipe index, which the app replaces as it
 * goes, is read through LIVE (tests/scope.test.js holds the lists to each
 * other). Loaded before app.js.
 */
(window.HiveParts = window.HiveParts || {}).mealtools = function (app) {
  'use strict';

  // what it reads of the app's, and (LIVE) what the app replaces as it goes: BY_ID
  var MFOOD_G_MAX = app.MFOOD_G_MAX;
  var MNA_CAP = app.MNA_CAP;
  var MNA_W = app.MNA_W;
  var MW = app.MW;
  var fmtNum = app.fmtNum;
  var kcalOf = app.kcalOf;
  var keepingFocus = app.keepingFocus;
  var mBuildFoods = app.mBuildFoods;
  var mByGram = app.mByGram;
  var mDay = app.mDay;
  var mDayTargets = app.mDayTargets;
  var mEditDay = app.mEditDay;
  var mLadder = app.mLadder;
  var mMealAsk = app.mMealAsk;
  var mNewFoodKey = app.mNewFoodKey;
  var mReadMyFoods = app.mReadMyFoods;
  var mReadSlots = app.mReadSlots;
  var mViewKey = app.mViewKey;
  var mWriteMyFoods = app.mWriteMyFoods;
  var renderMacros = app.renderMacros;
  var LIVE = app.LIVE;

  /* Solve the portions of one meal against that meal's own share.
   *
     Rebalance does this for the whole day, where the question is "which of
     twelve plates gives way". Here the question is the one you actually have
     after putting chicken, rice and broccoli on a plate: how much of each.
     Same weights the picker fits with, same eighth-of-a-portion steps, and
     the same two exemptions — what you have eaten and what you have locked
     are not the machine's to move.
   *
     It is not only the button any more. Blake, 2026-10-05: "This needs to
     feel like magic... I see my protein is full with my egg whites. But I
     need some fat so I'm going to add some cheese... and eventually I'm going
     to have this perfect planned meal." So the sheet runs this after every
     change (mRefitMeal in app.js), with one food on the plate as well as
     several, and hands it the plate it just put down or set as `hold`: that
     one stays exactly where it went, and the rest re-fit around it.
   *
     Three ceilings came with that, and none of them is new to the app:
     a single food stops at a plateful (MFOOD_G_MAX, what the picker and the
     day's Rebalance already stop at; with no top, salsa was walked to four
     and a half cups to find carbohydrate); the meal does not run more than
     MKCAL_OVER past its calories to chase a macro ("calories win" when the
     plate cannot hit both); and salt is priced against the day's ceiling the
     way mBalanceDay prices it, MNA_W, so it stops a pile of salsa and never
     starves a meal of its protein (Blake: "Bend is fine"). */
  var MKCAL_OVER = 1.03;

  /* How far one meal's plates sit from its share T, as one number: the
     picker's weights on protein, fat and carbohydrate (MW), the calorie
     guard, and the day's salt. `extra` is a plate not on the day yet, so a
     food can be sized before it is put down (mMealFitX). */
  function judge(day, sk, T) {
    var K = kcalOf(T);
    // the salt the rest of the day already carries, which this meal adds to
    var naElse = 0;
    Object.keys(day).forEach(function (s2) {
      if (s2 === sk) return;
      (day[s2] || []).forEach(function (it) {
        var r = LIVE.BY_ID[it.id];
        if (r && r.macro) naElse += (r.macro.na || 0) * it.x;
      });
    });
    return function (extra) {
      var got = { p: 0, f: 0, c: 0, kcal: 0, na: 0 };
      var add = function (r, x) {
        if (!r || !r.macro) return;
        got.p += (r.macro.p || 0) * x; got.f += (r.macro.f || 0) * x; got.c += (r.macro.c || 0) * x;
        got.kcal += (r.macro.kcal || 0) * x; got.na += (r.macro.na || 0) * x;
      };
      (day[sk] || []).forEach(function (it) { add(LIVE.BY_ID[it.id], it.x); });
      if (extra) add(extra.r, extra.x);
      var sum = 0;
      ['p', 'f', 'c'].forEach(function (m) {
        var D = Math.max(1, T[m]);
        sum += MW[m][0] * Math.max(0, T[m] - got[m]) / D;
        sum += MW[m][1] * Math.max(0, got[m] - T[m]) / D;
      });
      if (K > 0) sum += 2 * Math.max(0, got.kcal - K * MKCAL_OVER) / K;
      sum += MNA_W * Math.max(0, naElse + got.na - MNA_CAP) / MNA_CAP;
      return sum;
    };
  }

  /* For gram-dialled single foods (mByGram), step in 5 g increments up to
     MFOOD_G_MAX so auto-balance lands on the exact 5 g dial grid and matches
     the − / + buttons. Counted foods and recipes keep mLadder's rungs. */
  function rungsFor(rf, x, keep) {
    if (rf && mByGram(rf)) {
      var G = rf.grams || 100, out = [], seen = {};
      for (var g = 5; g <= MFOOD_G_MAX; g += 5) {
        var v = Math.round(g / G * 10000) / 10000;
        if (v > 0 && !seen[v]) { seen[v] = 1; out.push(v); }
      }
      if (keep > 0 && !seen[keep]) out.push(keep);
      return out.sort(function (a, b) { return a - b; });
    }
    var rungs = mLadder(rf, x);
    if (rf && rf.food && rf.grams) {
      var gX = MFOOD_G_MAX / rf.grams;
      rungs = rungs.filter(function (v) { return v <= gX + 1e-9 || v === keep; });
    }
    return rungs;
  }

  /* What a food you have never logged goes on at: the amount of it that
     brings this meal closest to its share by the same judge the re-fit uses.
     The picker's own fit (mpFitX) answers a different question — room left
     in the DAY — and at lunch it offered a cup and a half of cheddar,
     because the day still had the fat for it.
   *
     When no amount helps — the meal is full, or the day's salt is spent and
     this is salsa — it is the smallest step of it, a spoonful, not a
     serving: a tap is still a tap, and the pills show what it cost. Falling
     through to "one serving" put a whole cup of salsa on a salty day. */
  function mMealFitX(sk, r) {
    if (!r || !r.macro || !(r.macro.kcal > 0 || r.macro.p > 0 || r.macro.f > 0 || r.macro.c > 0)) return null;
    if (r.eatout || r.eatoutPart) return 1;
    var k = mViewKey();
    var ask = mMealAsk(sk, mDayTargets(k), mReadSlots());
    if (!ask) return null;
    var sh = ask.now || ask.plan;
    /* No plan, no fit: a day of 0/0/0 has nothing to fit against, and every
       amount would "help" least at the smallest — the half-serving the app
       promised not to invent on an unplanned day. One serving, from the caller. */
    if (!sh || !((sh.p || 0) + (sh.f || 0) + (sh.c || 0) > 0)) return null;
    var pen = judge(mDay(k), sk, { p: sh.p, f: sh.f, c: sh.c });
    var base = pen(), best = base, bx = null;
    var rungs = rungsFor(r, 1);
    rungs.forEach(function (v) {
      var e = pen({ r: r, x: v });
      if (e < best - 1e-9) { best = e; bx = v; }
    });
    return bx !== null ? bx : (rungs.length ? rungs[0] : null);
  }

  function mBalanceMeal(sk, opt) {
    opt = opt || {};
    var k = mViewKey();
    var targets = mDayTargets(k);
    var slots = mReadSlots();
    mEditDay(k, function (day) {
      var held = opt.hold !== undefined ? (day[sk] || [])[opt.hold] : null;
      var free = (day[sk] || []).filter(function (it) {
        var r = LIVE.BY_ID[it.id];
        return it !== held && !it.eaten && !it.l && r && !r.eatout && r.macro && r.macro.kcal > 0;
      });
      if (!free.length) return;
      /* The meal's FULL share of the day, not what is left of the day after
         it. mShares answers the picker's question — "how much room is there
         for one more thing" — and subtracts what this meal already holds. Ask
         it here and a meal sitting exactly on target is told its target is
         nearly zero, and gets solved down to a quarter of itself. Which is
         what happened: 545 kcal, on target, balanced to 252 and called short.
         The target of a meal is its weight's worth of the day.
     *
         And that weight's worth is mMealShare's to say, not this function's.
         It was worked out here a second time — over EVERY slot, where
         mMealShare drops the ones you have skipped and left empty — so on a
         day with skips the button solved a meal to roughly half of what the
         pills directly above it were printing as its share. Same button, same
         card, two answers. A skipped meal is not still coming; the pills, the
         verdict, the basket foot and the day's assumption all already know
         that, and now so does the one control that acts on it.
     *
         Null means the meal is not in the slot list at all, which the card
         this button sits on cannot be — there is nothing to solve against, so
         nothing is solved rather than a share being invented. */
      /* Toward what the meal is asked for NOW, not what it was planned for.
       *
         This is the button Blake had in mind when he asked to see the slack
         move: solving dinner to a 677-kcal plan after a breakfast that ran a
         thousand over would push the day further past itself while claiming
         to balance it. Aimed at the live share, the plates walk toward the
         number on the card — which is also the first time this button has
         shown what it was aiming at. */
      var ask = mMealAsk(sk, targets, slots);
      if (!ask) return;
      var sh = ask.now;
      var pen = judge(day, sk, { p: sh.p, f: sh.f, c: sh.c });
      for (var pass = 0; pass < 8; pass++) {
        var moved = false;
        free.forEach(function (it) {
          var was = it.x, best = it.x, bestPen = pen();
          var rungs = rungsFor(LIVE.BY_ID[it.id], it.x, was);
          for (var i = 0; i < rungs.length; i++) {
            it.x = rungs[i];
            var pv = pen();
            if (pv < bestPen - 1e-9) { bestPen = pv; best = rungs[i]; }
          }
          it.x = best;
          if (best !== was) moved = true;
        });
        if (!moved) break;
      }
    });
    if (!opt.quiet) keepingFocus(renderMacros);
  }

  /* Everything on one meal, kept as one thing.
   *
     Assembled meals are the case recipes were always for — four scanned
     packets that go together every Tuesday are a dish, they just have not
     been named yet. The macros come from the parts as they stand rather than
     from re-reading the ingredient text, because the parts already carry
     measured numbers and re-deriving them would only lose accuracy. */
  function mSaveMeal(sk, name, share) {
    var day = mDay(mViewKey());
    var items = (day[sk] || []).filter(function (it) { return LIVE.BY_ID[it.id]; });
    if (!items.length || !name) return null;
    var mac = { kcal: 0, p: 0, f: 0, c: 0, na: 0, fib: 0 };
    var ing = [], parts = [], est = false;
    items.forEach(function (it) {
      var r = LIVE.BY_ID[it.id];
      ['kcal', 'p', 'f', 'c', 'na', 'fib'].forEach(function (m) {
        mac[m] += ((r.macro || {})[m] || 0) * it.x;
      });
      if (r.est) est = true;
      var unit = r.food ? r.unit : 'serving';
      ing.push(fmtNum(it.x) + ' \u00d7 ' + unit + ' ' + r.name);
      /* The parts keep their own id, amount and unit so the kept meal can be
         opened later and read back as what it was \u2014 not just as a total. */
      parts.push({ id: it.id, x: it.x, name: r.name, unit: unit });
    });
    ['kcal', 'p', 'f', 'c', 'na', 'fib'].forEach(function (m) { mac[m] = Math.round(mac[m]); });

    if (share) {
      /* Onto the Ours shelf, where it gets everything a recipe gets — the
         picker's fit ranking, portion scaling, the printed book. And where
         everyone with the pantry code can see it, which is why this is asked
         rather than assumed. */
      var id = window.Store.newRecipeId();
      window.Store.saveRecipe({
        id: id, own: true, book: 3, secNum: 1, secName: 'Ours',
        name: name, servings: '1 Serving', servN: 1, time: '0 mins', diff: 'Easy',
        ing: ing, steps: [], extras: '', macro: mac, est: est, typedMacro: true
      });
      return id;
    }
    /* Or into your own foods, which live in your account and go nowhere near
       the household. One of it is one plate — the whole meal as it stood —
       and it remembers its parts, sodium and fibre, so the kept salad still
       reads as beans, dressing and greens when you open it next Tuesday. */
    var mine = mReadMyFoods(), fresh = mNewFoodKey(name, mine), key = fresh.key;
    name = fresh.name;
    /* kx: the calories no gram accounts for. mBuildFoods works a food's
       calories out from its grams whenever it has any, and a part that was
       only ever a number of calories — "700 at a friend's" — has none, so a
       kept lunch of that plus a chicken breast came back as the chicken
       breast: 858 kcal saved, 164 counted. Carried beside the grams so the
       rebuild can add it back, and only when it is more than rounding. */
    var kx = mac.kcal - kcalOf({ p: mac.p, f: mac.f, c: mac.c });
    mine[key] = { name: name, unit: 'plate', kcal: mac.kcal, p: mac.p, f: mac.f, c: mac.c,
      na: mac.na, fib: mac.fib, parts: parts };
    if (kx >= 5) mine[key].kx = kx;
    mWriteMyFoods(mine);
    mBuildFoods();
    return 'f:my:' + key;
  }

  return { mBalanceMeal: mBalanceMeal, mMealFitX: mMealFitX, mSaveMeal: mSaveMeal };
};
