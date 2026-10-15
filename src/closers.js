/* Three foods that close the day, one per macro: the gap they answer
 * (mComboGap), and the rows that offer them in the picker's list
 * (mpComboHTML). The longer account is with the code.
 *
 * A part of app.js (Nourish) in a file of its own. app.js calls
 * HiveParts.closers(app) once, as it starts, and keeps what it gives back
 * under the same names. Loaded before app.js.
 */
(window.HiveParts = window.HiveParts || {}).closers = function (app) {
  'use strict';

  // what it reads of the app's
  var S = app.S;
  var kcalOf = app.kcalOf;
  var mComboFor = app.mComboFor;
  var mDayTargets = app.mDayTargets;
  var mMealAsk = app.mMealAsk;
  var mMealHolds = app.mMealHolds;
  var mReadSlots = app.mReadSlots;
  var mViewKey = app.mViewKey;
  var mpMatches = app.mpMatches;
  var mpQ = app.mpQ;
  var mpRowHTML = app.mpRowHTML;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* Three foods that close the day, one per macro.
   *
     A food taking most of its energy from ONE macro is a knob you can turn
     without disturbing the other two, and three such knobs reach any
     combination of P/F/C exactly. That is the whole trick behind "egg
     whites, cheese and salsa" — not a recipe, a basis.

     So this is not a suggestion engine and it is not ranked. It is three
     slots, each holding the day's gap in that one macro, each swappable
     without resizing the meal into something else: walk the protein rung to
     tuna and the cheese and salsa resize around it. Which is why ‹ › sits on
     each row rather than one button re-rolling all three — re-rolling loses
     the one you had already decided about.

     Nothing here is offered when the day is nearly closed. Three foods to
     take off the last four grams is not help.

     Aimed at THIS MEAL's share of the day's gap, not the whole gap. Pointed
     at the day it asked three foods to be a day: every portion pegged at the
     ×4 ceiling — four cans of tuna, four scoops of whey — and still came up
     short, because no three foods are 180 g of protein. The bars measure the
     day; a plate is still a meal. */
  var MCOMBO_MIN = 10;                  // grams of gap worth three foods

  function mComboSlotName() {
    var slots = mReadSlots(), sk = S.macroPick && S.macroPick.slot;
    var nm = (slots.names || {})[sk] || 'this meal';
    slots.list.forEach(function (sl) { if (sl.k === sk) nm = sl.n; });
    return nm;
  }

  function mComboGap(k) {
    var targets = mDayTargets(k);
    if (!targets.p && !targets.f && !targets.c) return null;
    /* The SAME question the header above it asks, from the same two numbers.
     *
       This used to read mShares(...).T — the meal's static slice of the day —
       and subtract only the basket, never what was already on the plate. So a
       meal the header had just called closed still had a full share of gap
       down here, and the band offered a food to close something with nothing
       left in it. Blake's screenshot: BREAKFAST IS CLOSED, four zero pills,
       and under them "one food that closes breakfast: tuna steak".
     *
       mMealAsk is also the cascade-aware number, which mShares is not: overrun
       dinner and this meal is owed less than its slice; share a light
       breakfast onto it and it is owed more. The header has read that all
       along. This is the argument the panel and the footer already had, in a
       new place — one question, one source.
     *
       A food picked in the sheet is on the meal already, so mMealHolds
       counts it and there is nothing further to subtract here. */
    var sk2 = S.macroPick && S.macroPick.slot;
    if (!sk2) return null;
    var ask2 = mMealAsk(sk2, targets, mReadSlots());
    var want2 = ask2 ? (ask2.now || ask2.plan) : null;
    if (!want2) return null;
    var got2 = mMealHolds(k, sk2);
    var gap = {};
    ['p', 'f', 'c'].forEach(function (m) {
      gap[m] = Math.max(0, (want2[m] || 0) - (got2[m] || 0));
    });
    /* The ask rides along so the band can tell a top-up from a whole meal. */
    gap.askK = kcalOf({ p: want2.p || 0, f: want2.f || 0, c: want2.c || 0 });
    gap.gapK = kcalOf({ p: gap.p, f: gap.f, c: gap.c });
    return gap;
  }

  /* The foods that close this meal, as rows in the list rather than a panel
     of their own.
   *
     They used to be a widget above everything: a caption, up to three rows
     with a pair of arrows each for cycling alternatives, a macro summary line
     and an "Add all three" button. That is a second way to read a food and a
     second way to add one, sitting on top of the list that already does both
     — and it pushed the list itself most of a screen down. Blake: "instead of
     the three foods that close the day, just put them in my suggested foods
     area."
   *
     So they are ordinary picker rows now: same tick, same portion, same tap
     into the basket. What goes with the panel is the cycling and the add-all,
     and neither is missed — the basket already accumulates and the bar along
     the bottom already totals what it will add.
   *
     Drawn before Fits best and marked into `shown`, so a food that closes the
     meal is never offered again further down at a different portion. */
  function mpComboHTML(shown) {
    if (S.mpSec === 'foods' || S.mpShelf) return '';
    var k = mViewKey();
    var gap = mComboGap(k);
    if (!gap) return '';
    if (gap.p + gap.f + gap.c < MCOMBO_MIN) return '';
    var combo = mComboFor(gap, { p: 0, f: 0, c: 0 }, S.macroPick && S.macroPick.slot);
    if (!combo || !combo.length) return '';
    /* Anything a band above already drew keeps its first heading, and the
       count in this one follows what is actually left to draw — the panel
       used to say "Three" over two rows, which is the same bug in its own
       shape. */
    var fresh = combo.filter(function (c) {
      return !(shown && shown[c.r.id]) && mpMatches(c.r, mpQ());
    });
    if (!fresh.length) return '';
    fresh.forEach(function (c) { if (shown) shown[c.r.id] = 1; });
    var rows = fresh.map(function (c) { return mpRowHTML(c.r, c.x); }).join('');
    var nWord = ['', 'One', 'Two', 'Three'][fresh.length] || String(fresh.length);
    return '<div class="mt-div">' + nWord +
      (fresh.length === 1 ? ' food that closes ' : ' foods that close ') +
      esc(mComboSlotName().toLowerCase()) + '</div>' + rows;
  }

  return { mComboGap: mComboGap, mpComboHTML: mpComboHTML };
};
