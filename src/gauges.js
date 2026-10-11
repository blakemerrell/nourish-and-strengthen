/* A meal's numbers at a glance: what the day would come to if the empty
 * meals landed on their share (mAssumed); one gauge, the plate against a
 * tick where the plan is, coloured only when the miss moves the day
 * (mGauge); the four in order with their marks (MGAUGE); and the pills that
 * fill toward a target, drawn and said (mFillPill, MPILL_TONE,
 * mMealPillsSay). The longer account is with the code.
 *
 * A part of app.js (Nourish) in a file of its own. app.js calls
 * HiveParts.gauges(app) once, as it starts, and keeps what it gives back
 * under the same names. Loaded before app.js.
 */
(window.HiveParts = window.HiveParts || {}).gauges = function (app) {
  'use strict';

  // what it reads of the app's
  var kcalOf = app.kcalOf;
  var mMealAsk = app.mMealAsk;
  var mReadSlots = app.mReadSlots;
  var mSkipped = app.mSkipped;
  var mSlotW = app.mSlotW;
  var mViewKey = app.mViewKey;

  /* What the day would come to if the meals with nothing on them landed on
     their share of it. An unplanned lunch is not a lunch you will skip — it
     is one you have not decided yet — and counting it as zero made a day
     half-planned at nine in the morning read as a catastrophe. It is drawn
     as its own hatched band so it is never mistaken for food. */
  function mAssumed(day, targets, slots) {
    var out = { p: 0, f: 0, c: 0, kcal: 0 };
    var sumW = 0;
    slots = slots || mReadSlots();
    var vk = mViewKey();
    /* A SKIPPED meal assumes nothing, and is not in the denominator either.
     *
       This counted every meal with no food on it as one still to come, which
       is exactly what a skipped meal is not: skipping says the food is not
       coming and hands the share to the rest, which is the whole point of the
       gesture. So a day with four of six meals skipped had roughly half the
       day's target quietly added to the delta — Blake's Monday read
       "1802 / 1745" beside "+930", the bar and the number on the same row
       disagreeing by 873 kcal of food he had already said he was not eating.
       Fibre and sodium were right throughout, because they are a different
       code path and never asked about assumptions.
     *
       The rule is copied from mMealShare on purpose, down to the clause about
       a skipped meal that somehow has food on it. Two definitions of a share
       is how this file has been bitten before; the comment there says a share
       still dividing by a skipped meal calls a breakfast "over" when Fill had
       deliberately made it bigger. This is the same error one level up. */
    var counts = function (s) {
      return !(mSkipped(vk, s.k) && !(day[s.k] || []).length);
    };
    slots.list.forEach(function (s) { if (counts(s)) sumW += mSlotW(s); });
    if (!sumW) return out;
    slots.list.forEach(function (s) {
      if (!counts(s)) return;
      if ((day[s.k] || []).length) return;
      /* What the meal's own pill is asking for, not its share of the plan
         as written. After a breakfast of 1,360 the empty meals are asked for
         640 between them, and the headline added up their ORIGINAL shares
         instead — "+916" over the day, painted as under, above three meals
         whose asks landed it on target. One forecast, the meals' own. */
      var ask = mMealAsk(s.k, targets, slots);
      if (ask && ask.now) {
        ['p', 'f', 'c'].forEach(function (m) { out[m] += ask.now[m] || 0; });
        return;
      }
      var fr = mSlotW(s) / sumW;
      ['p', 'f', 'c'].forEach(function (m) { out[m] += targets[m] * fr; });
    });
    out.kcal = kcalOf(out);
    return out;
  }

  /* Whether a meal wants you, at a glance. The arithmetic for a meal's own
     share has existed since the picker was built, but it only ever showed
     INSIDE the picker — so the only way to learn that dinner was two hundred
     short was to open dinner and go shopping. Now the header says it. */
  /* What a meal was meant to hold, and — while it is still empty — an
     invitation to fill it.
   *
     Once there is food on it the header says nothing: the macro pills on the
     row below carry the verdict now, per macro, which is the thing this pill
     could never do. It answered calories, so a lunch five times over on fat
     and fine on protein read as one number with no name on it.

     Over the meals that are actually happening. A skipped meal releases its
     share to the rest — that is what the skip DOES — so a share still
     dividing by it would call a breakfast "over" when Fill had deliberately
     made it bigger.

     But only while it is still EMPTY. A skip releases a share; food on the
     meal takes it back, and a divisor that dropped a meal WITH FOOD ON IT
     while that same meal was still paid its own share gave the day away
     twice — 128 per cent of it on the default weights, every card able to
     read "on". mEditDay un-skips on the way in, so the two can only disagree
     when a skip arrives from the other device after the food did. This is the
     arithmetic refusing to hand out more than a day even then. */
  /* One gauge: what is on the plate, against a tick where the plan is.
   *
     A meal was judged here once before, by chips and by bars, and both were
     taken off on the grounds that you steer by the DAY. They are back at
     Blake's asking, and the thing that killed them the first time was not
     the idea — it was that "the meal's share" had two definitions that
     disagreed, so a panel could invite food its own footer called a bust.
     There is one definition now, mMealShare, and every gauge on this screen
     reads it. If a second one ever appears, this is the comment that was
     supposed to stop it.

     The BAND is measured against the day, not against the share, and that is
     also hard-won: a meal's share of fat is eleven to nineteen grams, no real
     dish lands within three of that, and a bar judged against its own share
     was coloured on every meal of every day. Colour that is always on has
     stopped saying anything. The band asks the only question worth asking —
     did this meal miss by enough to move the DAY.

     The tick is drawn at the share and the track is scaled so it has somewhere
     to sit: fifteen per cent of headroom past the plan when the plate is
     under it, and the plate's own size when it has run past. So a bar that
     has blown through the tick still shows HOW far through, which a bar
     pinned at its own maximum cannot. */
  function mGauge(got, want, dayT) {
    if (!(want > 0)) return null;
    /* The day-relative floor stops tiny shares going always-red; the cap
       stops the colour contradicting the length.
     *
       Floor alone gave a protein bar filled to 55% of its track, with the
       tick at 87%, painted GREEN — because a fifteen gram miss is only seven
       per cent of the day and the band forgave it. Both facts were true and
       the bar said them at once: short means "not there", green means
       "there". A reader cannot hold that.

       So the band may not exceed 40% of the meal's own share. Below roughly
       three fifths of the tick a bar is ochre whatever the day thinks, which
       is exactly where it stops LOOKING landed. */
    var band = Math.min(Math.max(want * 0.15, (dayT || want) * 0.1), want * 0.4);
    var scale = Math.max(got, want * 1.15);
    return {
      fill: scale > 0 ? Math.min(100, (got / scale) * 100) : 0,
      tick: scale > 0 ? Math.min(100, (want / scale) * 100) : 0,
      st: got < want - band ? 'u' : got > want + band ? 'x' : 'o',
    };
  }

  /* The four, in the order they are said everywhere else, with the mark each
     is known by. Calories keep the FLAME \u2014 Blake's call, and the older
     comment's argument too: P, F and C are the three things food is made of
     and the flame is what the three add up to, so a fourth letter would make
     the sum look like a fourth component. It was briefly a word here, on the
     grounds that three altitudes ought to read as one sentence \u2014 but what
     makes them one sentence is four cells in one order wearing one set of
     colours, and a mark saying "this one is not like those three" is
     information rather than noise.

     The SPOKEN form stays the word: MGAUGE_SAY feeds the head's label, so a
     screen reader hears "983 of 290 calories" and never a glyph's name. */
  var MGAUGE = [['kcal', '\uD83D\uDD25'], ['p', 'P'], ['f', 'F'], ['c', 'C']];
  var MGAUGE_SAY = { kcal: 'calories', p: 'grams of protein', f: 'grams of fat', c: 'grams of carbohydrate' };

  /* A pill that is its own bar. Two rows of them draw this now — the day's
     folded readout and the picker's "still wants" — and a gradient written
     out twice is a gradient that drifts. */
  function mFillPill(cls, tone, pct, body) {
    return '<span class="' + cls + '" style="background:linear-gradient(90deg,' +
      tone + ' 0 ' + pct.toFixed(1) + '%,var(--paper-soft) ' + pct.toFixed(1) + '%)">' +
      body + '</span>';
  }
  var MPILL_TONE = { under: 'var(--dial-under-pale)', on: 'var(--dial-on-pale)',
    over: 'var(--dial-over-pale)', short: 'var(--dial-under-pale)',
    met: 'var(--dial-on-pale)', quiet: 'var(--mlim-quiet-pale)',
    near: 'var(--dial-under-pale)', past: 'var(--dial-over-pale)' };

  /* The same four numbers, in words, for the label of whatever carries them.
   *
     The strip has been aria-hidden since it was built and nothing ever said
     the numbers instead, so a screen reader got "Open Breakfast" and not one
     figure off the card — and the head is a <button>, whose accessible name
     comes from its own label and overrides anything inside it, so no amount
     of marking up the pills could have fixed that from within. The target
     figure that came off the glyph lands here, where it is finally said at a
     size that has nothing to do with pixels. */
  function mMealPillsSay(sub, ask, targets) {
    if (!ask) return '';
    var sh = ask.now || ask;
    var spent = ask.spent || {};
    var day = { kcal: kcalOf(targets), p: targets.p, f: targets.f, c: targets.c };
    var parts = [];
    MGAUGE.forEach(function (g) {
      var m = g[0], want = sh[m] || 0, got = Math.round(sub[m] || 0);
      if (spent[m]) { parts.push(got + ' ' + MGAUGE_SAY[m] + ', none left to spend'); return; }
      if (!mGauge(sub[m] || 0, want, day[m])) return;
      parts.push(got + ' of ' + Math.round(want) + ' ' + MGAUGE_SAY[m]);
    });
    return parts.join(', ');
  }

  return { mAssumed: mAssumed, mGauge: mGauge, mFillPill: mFillPill, mMealPillsSay: mMealPillsSay, MPILL_TONE: MPILL_TONE };
};
