/* What is on the day, in grams (mDayEaten), and what one meal holds
 * (mMealHolds), as the picker's ranking reads them. The longer account is
 * with the code.
 *
 * A part of app.js (Nourish) in a file of its own. app.js calls
 * HiveParts.pickgap(app) once, as it starts, and keeps what it gives back
 * under the same names. The recipes by id (BY_ID) are read through LIVE
 * (tests/scope.test.js holds the lists to each other). Loaded before
 * app.js.
 */
(window.HiveParts = window.HiveParts || {}).pickgap = function (app) {
  'use strict';

  // what it reads of the app's, and (LIVE) what the app replaces as it goes: BY_ID
  var mDay = app.mDay;
  var LIVE = app.LIVE;

  /* What this meal still has room for. mShares works the day's remainder into
     a share per empty meal; this is that share, in the words the plate rows
     already use. */
  /* The DAY, and what the basket would do to it.
   *
     It used to draw this meal against this meal's share. That is gone with
     the chips and the bars on the cards, and for the same reason: a share is
     a planning device, not a thing anybody eats against. You are shopping to
     close the DAY, wherever the food ends up sitting.

     Which also settles an argument this sheet was having with itself. The
     panel spoke one share and the footer under it spoke another, so the top
     invited food the bottom called a bust. There is one number now and both
     halves read it.

     The basket counts before it is committed, because a tick redraws this
     whole sheet — and the bars visibly redrawing WITHOUT moving, while the
     line directly beneath them changed by that same tick, is one gesture
     answered twice with the bigger drawing stale. Whole grams the day is
     still owed, and what the basket would take off that. */
  /* Everything on the day plus everything in the basket, in grams.
   *
     Extracted because the bars and the three-food combo underneath them have
     to be answering the same question. When each worked out the day's
     position for itself the combo could offer food the bars called a bust,
     which is the same argument the panel and the footer used to have. */
  /* Calories are carried, not re-derived.
   *
     4P + 4C + 9F is how a TARGET becomes calories — a target is grams and has
     no other answer. A plate is different: it states its own energy, and that
     is the number mTotals sums for the day bar. Deriving it again here made
     the picker and the day bar disagree about the same day — 1,655 against
     1,554 on an ordinary one, and 250 against nothing at all for a food typed
     in with only its calories, which has no grams to derive from and so was
     invisible to the sheet that exists to say what is left. */
  function mDayEaten(k) {
    var day = mDay(k);
    var sub = { p: 0, f: 0, c: 0, kcal: 0 };
    var addTo = function (r, x) {
      if (!r || !r.macro) return;
      sub.p += (r.macro.p || 0) * x;
      sub.f += (r.macro.f || 0) * x;
      sub.c += (r.macro.c || 0) * x;
      sub.kcal += (r.macro.kcal || 0) * x;
    };
    /* Every meal on the day, not just the one being filled — the gap is the
       day's, and food added here counts against it wherever it lands. */
    Object.keys(day).forEach(function (sk) {
      (day[sk] || []).forEach(function (it) { addTo(LIVE.BY_ID[it.id], it.x); });
    });
    return sub;
  }

  /* Everything already on one meal. (The basket that used to join it here
     went in 2026-10-04: a tap in the picker puts food on the meal itself.) */
  function mMealHolds(k, sk) {
    var day = mDay(k);
    var sub = { p: 0, f: 0, c: 0, kcal: 0 };
    var addTo = function (r, x) {
      if (!r || !r.macro) return;
      sub.p += (r.macro.p || 0) * x; sub.f += (r.macro.f || 0) * x;
      sub.c += (r.macro.c || 0) * x; sub.kcal += (r.macro.kcal || 0) * x;
    };
    (day[sk] || []).forEach(function (it) { addTo(LIVE.BY_ID[it.id], it.x); });
    return sub;
  }

  return { mDayEaten: mDayEaten, mMealHolds: mMealHolds };
};
