/* When a meal is: the hour each kind of meal opens (a meal of no fixed kind
 * takes its time from where it sits between the ones that have one), the
 * clock that is read against it, and the two questions the day asks of it:
 * whether food added now counts as eaten (it no longer does: M_ADDS_EATEN,
 * kept for the old rule), and whether today is far enough along to be given
 * a verdict.
 *
 * A part of app.js (Nourish) in a file of its own. app.js calls
 * HiveParts.mealtime(app) once, as it starts, handing over what it reads of
 * the app's (named below; tests/scope.test.js holds the lists to each other),
 * and keeps mSlotOpens, mNowMins, mAddsEaten and mDayJudged under their own
 * names. Loaded before app.js.
 */
(window.HiveParts = window.HiveParts || {}).mealtime = function (app) {
  'use strict';

  // what it reads of the app's
  var mDoneAt = app.mDoneAt;
  var mReadSlots = app.mReadSlots;
  var todayKey = app.todayKey;

  /* ------------------------------------------------------- when a meal is
   *
     Meals have never had times: a meal is a name, a kind and a share, and the
     order you put them in. But "is this meal happening yet" is a question the
     day has to answer twice now — whether food added to it was eaten, and
     whether today is far enough along to be judged — and both want a clock.
     So each kind carries the hour its meal opens, and a meal of no fixed kind
     takes its time from where it sits between the ones that have one.
   *
     A little early rather than late, because at a meal's own hour the usual
     act is logging it, not planning it: a breakfast added at half six is
     breakfast, and a lunch added at quarter past eleven is almost always lunch
     being eaten. Either way a wrong guess is one tap on the tick to put
     right. */
  var MMEAL_OPENS = { b: 5 * 60, l: 11 * 60, d: 17 * 60 };

  /* Minutes after midnight that the meal at `i` in `list` opens.
   *
     The day's first meal is open from midnight, whatever it is called: the
     day has started. A snack or a meal of your own opens halfway between the
     timed meals either side of it — an afternoon snack between lunch and
     dinner is a two o'clock thing. One with no timed meal after it is the
     day's catch-all, which is what the default Snacks at the foot of the list
     is: open all day, because a snack logged at three was eaten at three. */
  function mSlotOpens(list, i) {
    if (!list || !list[i] || i === 0) return 0;
    var own = MMEAL_OPENS[list[i].t];
    if (own !== undefined) return own;
    var before = null, after = null, j;
    for (j = i - 1; j >= 0 && before === null; j--) {
      if (MMEAL_OPENS[list[j].t] !== undefined) before = MMEAL_OPENS[list[j].t];
    }
    for (j = i + 1; j < list.length && after === null; j++) {
      if (MMEAL_OPENS[list[j].t] !== undefined) after = MMEAL_OPENS[list[j].t];
    }
    if (before === null || after === null) return 0;
    return Math.round((before + after) / 2);
  }

  function mNowMins() {
    var d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  }

  /* Whether food added to meal `sk` of day `k` goes on as eaten.
   *
     Smart split (Blake, 2026-11-21): manually logging a food on today or a
     past day marks it eaten at once so normal food logging takes zero
     checkboxes. App-planned items (Fill, Autofill, Everyday pins, Week
     dinners) never come through here and stay planned (`eaten: 0`), and
     anything added to a future day stays planned too until ticked. Kept
     behind M_ADDS_EATEN in case a global toggle is ever wanted back. */
  var M_ADDS_EATEN = true;
  function mAddsEaten(k, sk) {
    if (!M_ADDS_EATEN) return 0;
    return k > todayKey() ? 0 : 1;
  }

  /* When today is far enough along to be judged: once dinner's time has come
     and gone — three hours after the last timed meal opens, which is eight in
     the evening on the default day, and eight too when no meal has a time. */
  function mDaySettled() {
    var list = mReadSlots().list, last = null;
    list.forEach(function (s) {
      var t = MMEAL_OPENS[s.t];
      if (t !== undefined && (last === null || t > last)) last = t;
    });
    return mNowMins() >= (last === null ? 20 * 60 : last + 3 * 60);
  }

  /* Whether a day may be given a verdict — under, close, short on protein.
     A day behind you, yes. Today only once you have closed it or dinner is
     over: at half past one it said "under" and "131 g short on protein" about
     a day with dinner still to come, which is not a verdict but a count of
     what is left. Over stays over whenever it happens — that one is already
     a fact. Blake: "No verdict on today until it's closed or dinner time has
     passed." */
  function mDayJudged(k) {
    var today = todayKey();
    if (k < today) return true;
    if (k > today) return false;
    return mDoneAt(k) > 0 || mDaySettled();
  }

  return { mSlotOpens: mSlotOpens, mNowMins: mNowMins, mAddsEaten: mAddsEaten, mDayJudged: mDayJudged };
};
