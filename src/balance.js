/* Balancing the day: the plates still in play re-sized, in quarter steps,
 * until the day lands back on target, never touching what is eaten or
 * locked (mBalanceDay); what each open meal is asked for as the solver
 * prices it (mMealWants); and the button that asks for it (mRebalance).
 * The longer account is with the code.
 *
 * A part of app.js (Nourish) in a file of its own. app.js calls
 * HiveParts.balance(app) once, as it starts, and keeps what it gives back
 * under the same names. The recipe index, which the app replaces as it
 * goes, is read through LIVE (tests/scope.test.js holds the lists to each
 * other). Loaded before app.js.
 */
(window.HiveParts = window.HiveParts || {}).balance = function (app) {
  'use strict';

  // what it reads of the app's, and (LIVE) what the app replaces as it goes: BY_ID
  var MFOOD_G_MAX = app.MFOOD_G_MAX;
  var MTOP_NA = app.MTOP_NA;
  var MW = app.MW;
  var kcalOf = app.kcalOf;
  var mDayTargets = app.mDayTargets;
  var mEditDay = app.mEditDay;
  var mLadder = app.mLadder;
  var mMealAsk = app.mMealAsk;
  var mReadSlots = app.mReadSlots;
  var mSkipped = app.mSkipped;
  var mSlotClosed = app.mSlotClosed;
  var mTotals = app.mTotals;
  var mViewKey = app.mViewKey;
  var renderMacros = app.renderMacros;
  var LIVE = app.LIVE;

  /* Re-size the plates still in play so the day lands back on target. Keeps
     every dish exactly where it is — swapping food is Fill my day's job, and
     a button that quietly replaced your dinner would be the app overruling
     you — and never touches what is eaten (the past has no portion control)
     or what is locked (the dinner you promised the family).
   *
   * The judging is the picker's own weights applied to the WHOLE day against
     the targets — no fair shares here, because the plates already exist and
     the only question left is how big each should be. Coordinate descent in
     quarter steps: each free plate in turn tries every size and keeps the one
     that hurts the day least, until a pass moves nothing. Ties keep the
     smaller portion, as everywhere else on a cut. */
  var MX_ALL = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75, 4];

  /* The day's sodium ceiling, and what going past it costs the solver. The
     cap is the ordinary guideline the bars already show. The weight is set
     against the macro weights either side of it: a day a full ceiling over
     carries the same penalty as missing every gram of protein, which is
     enough to lose an argument about a fourth serving and not enough to
     starve a day of the protein it is for. */
  var MNA_CAP = 2300;
  var MNA_W = 1.0;

  /* What a meal landing away from its share costs the solver.
   *
     pen() priced four things — protein, fat, carbohydrate and salt — and all
     four are day-level. Nothing in it said where the food should land, so a
     day could put a seven-calorie plate on the last meal and a thousand on
     dinner and score as a perfect day. On a plan shaped like Blake's, over
     fourteen consecutive days, the evening snack came in at 0.59 of its share
     and was a token on thirteen of them: a quarter of a churro and two bell
     peppers, on a day that still finished two hundred under. Meals draft in
     order, and by the last slot the asymmetric weights — over at 1.2, under
     at 0.55 — make leaving calories on the table cheaper than overshooting.
   *
     Priced against the meal's own ask, read off mMealAsk so this and the
     meal's pills agree about the same meal, and normalised on the day's
     calories so a 150-kcal snack and an 800-kcal dinner get the same rule.
     Symmetric, because a 90-kcal snack and a 1,000-kcal dinner are one fault
     seen from either end.
   *
     One, measured on Blake's own plan over fourteen consecutive days rather
     than on the bench, whose default profile is an extreme cut and whose
     knee sat at two. On his plan two bought one fewer token evening than one
     did and paid four grams of protein and twenty-five calories a day for it;
     one took the evening snack from 0.59 of its share to 0.86, cleared every
     oversized plate, and moved day accuracy by one calorie. */
  var MSHARE_W = 1;

  /* What each open meal is asked for, as the solver prices it. Read once
     before the descent — mMealAsk walks the day, and pen() runs once per
     rung per plate per pass. Skipped-and-empty meals are not in play; a meal
     with plates already eaten still has its ask, because the plates still
     on it are what this is sizing.
   *
     `now`, not `plan`: what the meal is asked for once the day so far is
     paid for, which is the figure on its pills. Priced at the plan share, a
     dinner was pulled toward 533 while its pill asked 383 after a heavy
     breakfast — the scale and the card disagreeing about one meal. `now`
     reads only what has been EATEN, so it does not move while the plates
     below are solved. */
  function mMealWants(day, targets) {
    var asks = [];
    if (!MSHARE_W || kcalOf(targets) <= 0) return asks;
    var slots0 = mReadSlots(), vk0 = mViewKey();
    slots0.list.forEach(function (s0) {
      if (mSkipped(vk0, s0.k) && !(day[s0.k] || []).length) return;
      var a0 = mMealAsk(s0.k, targets, slots0);
      var w0 = a0 && (a0.now || a0.plan);
      if (w0 && w0.kcal > 0) {
        var main = s0.t === 'b' || s0.t === 'l' || s0.t === 'd';
        asks.push({ k: s0.k, want: w0.kcal, wantP: main && w0.p > 0 ? Math.min(w0.p, 30) : 0 });
      }
    });
    return asks;
  }

  /* `own` narrows the solver to the plates FILL ITSELF PUT THERE (`by:'f'`).
   *
     Fill is an offer to build out the empty meals. It was also quietly
     resizing the full ones: a hand-placed 1,139 kcal pulled beef put on
     dinner at one serving came back at ×0.25 after a single press, and the
     day then read 184/180 P in green while being some 850 kcal wrong. The
     day's arithmetic was right — the plate was not the plate you put down.
   *
     Nothing here can tell whose a plate is, because nothing was recording it:
     every free-list frees whatever is neither eaten nor locked, and Fill's
     plates and yours are the same shape. So Fill now signs its own work and
     asks only for that back. Note the DEFAULT is unsigned, which means a day
     drafted before this shipped reads as entirely hand-placed — the safe
     direction, since the cost is a solver with less to move rather than a
     portion silently overwritten.
   *
     Rebalance is deliberately NOT narrowed, here or in mBalanceMeal. Pressing
     ⚖ is asking the machine to move things; answering "only my own" would be
     refusing the request. The rule is about what Fill may do UNASKED, not
     about the plates. */
  function mBalanceDay(day, targets, own) {
    /* Walked in the meals' own order, never in the order the day object
       happened to be built in. Coordinate descent visits one plate at a
       time, so the order is part of the answer: the same three plates
       solved forward and backward landed a day at 1,254 and at 1,322 kcal.
       A pinned meal was inserted first, a hand-built day in tap order, a
       synced day as it was stored — three roads in, three answers. */
    var order = mReadSlots().list.map(function (s1) { return s1.k; });
    Object.keys(day).forEach(function (sk) { if (order.indexOf(sk) < 0) order.push(sk); });
    var free = [];
    order.forEach(function (sk) {
      /* Fill leaves a meal you have started alone — the same rule that keeps
         it from adding to one. A plate it placed beside the one you ticked
         was being resized while you ate. Rebalance, pressed by hand, still
         reaches every un-eaten plate. */
      if (own && mSlotClosed(day, sk)) return;
      (day[sk] || []).forEach(function (it) {
        var r = LIVE.BY_ID[it.id];
        /* Asked to size only its own work, Fill's own work includes the
           plate the family plan seeded — placed at ×1 by the machine on the
           promise that the solver would size it, a promise this line used
           to break. What a hand placed stays where the hand put it. */
        if (own && it.by !== 'f' && it.by !== 'w') return;
        if (!it.eaten && !it.l && r && r.macro) free.push(it);
      });
    });
    if (!free.length) return;
    var asks = mMealWants(day, targets), dayK = kcalOf(targets);
    var pen = function () {
      var tot = mTotals(day);
      var s = 0;
      ['p', 'f', 'c'].forEach(function (mm) {
        var D = Math.max(1, targets[mm]);
        s += MW[mm][0] * Math.max(0, targets[mm] - tot.all[mm]) / D;
        s += MW[mm][1] * Math.max(0, tot.all[mm] - targets[mm]) / D;
      });
      /* Salt, because the solver was blind to it and a portion is exactly
         where that blindness costs most. Chasing protein, it took a chicken
         salad carrying fourteen hundred milligrams a serving to four
         servings — five and a half grams of sodium out of one bowl, more than
         twice the day's whole ceiling, and every macro bar green. Nothing in
         the arithmetic objected because sodium was not in it.
       *
         Only overshoot is priced. There is no virtue in a day coming in
         under on salt the way there is in hitting protein, so this is a
         ceiling and not a target: free until the day reaches it, then steep
         enough that a fourth serving of the salty thing loses to a third of
         something else. */
      s += MNA_W * Math.max(0, (tot.all.na || 0) - MNA_CAP) / MNA_CAP;
      /* And where it lands. See MSHARE_W. */
      for (var ai = 0; ai < asks.length; ai++) {
        var kc = 0, mp = 0, items = day[asks[ai].k] || [];
        for (var ii = 0; ii < items.length; ii++) {
          var ri = LIVE.BY_ID[items[ii].id];
          if (ri && ri.macro) {
            kc += (ri.macro.kcal || 0) * items[ii].x;
            mp += (ri.macro.p || 0) * items[ii].x;
          }
        }
        s += MSHARE_W * Math.abs(kc - asks[ai].want) / dayK;
        if (items.length && asks[ai].wantP > 0 && mp < asks[ai].wantP) {
          s += 0.35 * (asks[ai].wantP - mp) / Math.max(1, targets.p);
        }
      }
      return s;
    };
    for (var pass = 0; pass < 3; pass++) {
      var moved = false;
      free.forEach(function (it) {
        var was = it.x, best = it.x, bestPen = pen();
        /* Per plate, not one ladder for the day: a dish is sized in servings
           and a food in whatever it is counted in. See mLadder. */
        var rf = LIVE.BY_ID[it.id];
        var rungs = mLadder(rf, it.x);
        /* A single food Fill put there was chosen under two ceilings — the
           topper's salt (MTOP_NA) and a portion you would serve (MFOOD_G_MAX)
           — and this solver then walked it up a ladder with no top, pricing
           salt only against the whole day's cap: tuna chosen at one can came
           out at two (720 mg), whey at six scoops. The rungs it may try are
           the ones those ceilings allow; where it already sits stays allowed,
           so a hand-typed portion is never forced to move. */
        if (it.by === 'f' && rf && rf.food) {
          var naX = rf.macro && rf.macro.na > 0 ? MTOP_NA / rf.macro.na : Infinity;
          var gX = rf.grams ? MFOOD_G_MAX / rf.grams : Infinity;
          var topX = Math.max(Math.min(naX, gX), 0);
          rungs = rungs.filter(function (v) { return v <= topX + 1e-9 || v === was; });
        }
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
  }

  function mRebalance() {
    var targets = mDayTargets(mViewKey());
    mEditDay(mViewKey(), function (day) { mBalanceDay(day, targets); });
    renderMacros();
  }

  return { mMealWants: mMealWants, mBalanceDay: mBalanceDay, mRebalance: mRebalance, MX_ALL: MX_ALL, MNA_CAP: MNA_CAP, MNA_W: MNA_W };
};
