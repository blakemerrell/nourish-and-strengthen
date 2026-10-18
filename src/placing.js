/* Where a dish goes on the day, and the day's one way in: whether a food
 * belongs at a meal at all (mFoodMealOK); every meal a dish could go on,
 * and the one it goes on (mSlotsForRecipe, mSlotForRecipe); a day read and
 * a day changed, stamped and saved (mDay, mEditDay); and a plate's
 * calories from its grams (kcalOf). The longer account is with the code.
 *
 * A part of app.js (Nourish) in a file of its own. app.js calls
 * HiveParts.placing(app) once, as it starts, and keeps what it gives back
 * under the same names. Loaded before app.js.
 */
(window.HiveParts = window.HiveParts || {}).placing = function (app) {
  'use strict';

  // what it reads of the app's
  var MDAYS = app.MDAYS;
  var mFoldDue = app.mFoldDue;
  var mPut = app.mPut;
  var mSetSkip = app.mSetSkip;
  var mSkipped = app.mSkipped;
  var mSlotKind = app.mSlotKind;
  var mSlotSecs = app.mSlotSecs;
  var mStamp = app.mStamp;

  /* Whether a food belongs at this meal at all.
   *
     `meals` on a food names the meals it is ordinarily eaten at on its own,
     and only exceptions carry one — so a food without the field is fine
     anywhere, which is most food. A custom meal has no kind to judge against
     and is never withheld from: somebody who built their own meal has said
     more about it than this table knows. See the note in tools/food-db.js.
   *
     Recipes are untouched. They have always been placed by section, which is
     the same fact stated for a dish. */
  function mFoodMealOK(r, slot) {
    if (!r || !r.meals) return true;
    var t = mSlotKind(slot);
    if (!t || t === 'x') return true;
    return r.meals.indexOf(t) >= 0;
  }

  /* Sections no meal offers unasked, and the meal a dish from one belongs at
     when you add it yourself. With no meal claiming Batch Prep, a container
     added from the book fell through to the snack below. */
  var MSEC_HOME = { '1-7': ['l', 'd'] };

  /* Every meal a dish could go on, in the order it should be tried: the
     meals whose sections name it, then its home types. */
  function mSlotsForRecipe(r, slots) {
    var sec = r.book + '-' + r.secNum, out = [];
    slots.list.forEach(function (s) { if (mSlotSecs(s).indexOf(sec) >= 0) out.push(s); });
    (MSEC_HOME[sec] || []).forEach(function (t) {
      slots.list.forEach(function (s) { if (s.t === t && out.indexOf(s) < 0) out.push(s); });
    });
    return out;
  }

  /* Which meal a planned dish belongs to. The week assigns a dish to a DAY
     and says nothing about when in it — so the dish's own section decides,
     using the map Fill already steers by. A breakfast recipe lands on
     breakfast. Anything the map does not place falls to the slot the reader
     keeps for everything else, which is where an unclassifiable dish would
     have been put by hand. */
  function mSlotForRecipe(r, slots) {
    var sec = r.book + '-' + r.secNum, found = null;
    slots.list.forEach(function (s) {
      if (found) return;
      if (mSlotSecs(s).indexOf(sec) >= 0) found = s;
    });
    if (found) return found;
    if (MSEC_HOME[sec]) {
      MSEC_HOME[sec].forEach(function (t) {
        slots.list.forEach(function (s) { if (!found && s.t === t) found = s; });
      });
      if (found) return found;
    }
    var last = null;
    slots.list.forEach(function (s) { if (s.t === 's') last = last || s; });
    return last || slots.list[slots.list.length - 1] || null;
  }

  function mDay(k) {
    // a fresh object when the day is empty — browsing ‹ › never writes a key
    return MDAYS[k] || {};
  }

  /* `seed` is the routine placing itself on a new today, which is not
     anybody's edit — see the pin pass in mRenderDay. */
  function mEditDay(k, fn, seed) {
    mFoldDue();                           // the other copy's change first: see mFoldStored
    var day = MDAYS[k] || (MDAYS[k] = {});
    fn(day);
    /* Food on a meal un-skips it.
     *
       The rest of the app already assumes a skipped meal is an empty one: the
       skip button is only drawn on a meal with nothing on it, the struck-out
       line only stands in for a card with nothing on it, and Fill walks past a
       skipped meal without looking. Nothing enforced it. The chooser on the add
       sheet lists skipped meals like any other, so two taps put a plate on a
       lunch that was still marked not-happening.

       What that costs is the day itself. Every OTHER meal divides the day by
       the weights of the meals still in play, so a skipped lunch is subtracted
       from their divisor — and then paid its own share on top, out of a divisor
       that counts it. On the default weights a skipped-but-filled lunch hands
       the four cards 20/65, 25/90, 35/65 and 10/65: 128 per cent of a day, with
       every card free to say it landed on its share.

       Enforced here rather than at the doors food comes in by, because there
       are four of them — the tick on the picker, a new food saved straight onto a
       meal, Keep-these-as-one, and the pins a fresh day is seeded with — and a
       rule that has to be remembered at four doors is a rule that will be
       missed at the fifth. The food is the newer statement about the meal, so
       it wins; and mSetSkip stamps, so the un-skip travels to the other device
       instead of losing to the skip still sitting there. */
    Object.keys(day).forEach(function (sk) {
      if ((day[sk] || []).length && mSkipped(k, sk)) mSetSkip(k, sk, false);
    });
    /* Only the past falls out of the window. A plan for Thursday is not a
       stale record, and pruning by one bound would have eaten it.
     *
       And nothing falls off the far end. It used to — past a week ahead was
       pruned too — but the only way to have a day out there is for the
       phone's clock to have gone back, and then the "future" days are the
       real ones: set the date back ten days and the next plate logged erased
       everything eaten since. Nothing on screen can reach past a week ahead,
       so a day out there costs nothing to keep. */
    /* Every day is kept, however old (2026-10-18, app.js mEarliestKey): it
       was pruned here to the last 120. */
    mPut('bsc.macroDays', MDAYS);
    if (!seed) mStamp('d', k);
  }

  function kcalOf(t) { return Math.round(4 * t.p + 4 * t.c + 9 * t.f); }

  return { mFoodMealOK: mFoodMealOK, mSlotsForRecipe: mSlotsForRecipe, mSlotForRecipe: mSlotForRecipe, mDay: mDay, mEditDay: mEditDay, kcalOf: kcalOf };
};
