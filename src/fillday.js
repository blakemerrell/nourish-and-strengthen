/* Fill my day: the empty meals drafted in one press, each seeing what the
 * ones before it took (mDraftDay, mFillDay), kept from echoing the days
 * either side (mNearIds), and a plate's portion said as the recipe's scale
 * (mCookScale, mScaleWords). The longer account is with the code.
 *
 * A part of app.js (Nourish) in a file of its own. app.js calls
 * HiveParts.fillday(app) once, as it starts, and keeps what it gives back
 * under the same names. The recipe list and its index, which the app
 * replaces as it goes, are read through LIVE (tests/scope.test.js holds the
 * lists to each other). Loaded before app.js.
 */
(window.HiveParts = window.HiveParts || {}).fillday = function (app) {
  'use strict';

  // what it reads of the app's, and (LIVE) what the app replaces as it goes: BY_ID, RECIPES
  var MDAYS = app.MDAYS;
  var dayKey = app.dayKey;
  var fmtNum = app.fmtNum;
  var keyDate = app.keyDate;
  var mBalanceDay = app.mBalanceDay;
  var mDayTargets = app.mDayTargets;
  var mEditDay = app.mEditDay;
  var mExtOk = app.mExtOk;
  var mFamilyIds = app.mFamilyIds;
  var mFillRoom = app.mFillRoom;
  var mNever = app.mNever;
  var mRank = app.mRank;
  var mReadSlots = app.mReadSlots;
  var mSideUp = app.mSideUp;
  var mSkipped = app.mSkipped;
  var mSlotClosed = app.mSlotClosed;
  var mSlotSecs = app.mSlotSecs;
  var mSlotSpokenFor = app.mSlotSpokenFor;
  var mSlotsForRecipe = app.mSlotsForRecipe;
  var mTopUp = app.mTopUp;
  var mViewKey = app.mViewKey;
  var renderMacros = app.renderMacros;
  var LIVE = app.LIVE;

  function mOnDay(day, id) {
    var found = false;
    Object.keys(day).forEach(function (sk) {
      (day[sk] || []).forEach(function (it) { if (it.id === id) found = true; });
    });
    return found;
  }

  /* What the days either side of this one already hold.
   *
     Fill knew what was on the day it was drafting and nothing else, so
     "press it again for a different day" was true within a day and false
     across a week: seven drafted days ran to thirty plates and nineteen
     dishes, one of them served four times. A cook notices that long before
     they notice a macro.
   *
     Three days in each direction, not seven — the pool of dishes that are
     both lean enough and clean enough for a hard cut is small, and a week-long
     memory would empty it and leave meals blank. Three is far enough apart
     that a repeat reads as a rotation rather than a rut. Both directions,
     because days can be drafted in any order and Thursday planned before
     Wednesday should still not echo it. */
  var MNEAR_DAYS = 3;

  function mNearIds(k) {
    var out = {}, base = keyDate(k);
    for (var d = -MNEAR_DAYS; d <= MNEAR_DAYS; d++) {
      if (!d) continue;
      var t = new Date(base.getFullYear(), base.getMonth(), base.getDate() + d);
      var day = MDAYS[dayKey(t)];
      if (!day) continue;
      Object.keys(day).forEach(function (sk) {
        (day[sk] || []).forEach(function (it) { out[it.id] = 1; });
      });
    }
    return out;
  }

  /* The batch that makes exactly your portion: your servings over the
     recipe's. ×2½ of a one-jar shake is 2½ jars; two plates of a four-plate
     roast is half the roast; one plate of a six-serving bake is a sixth.
   *
     This used to snap to the eighths the quantities print in, which is
     exact only when the yield is 1, 2, 4 or 8: a sixth became an eighth,
     so one plate of a six-serving dish opened a sheet that made three
     quarters of it, and a twelfth became an eighth and made one and a half.
     A hundred and nine recipes yield something else. The quantities still
     print in eighths — each one is rounded where it is printed — but the
     factor between them is the true one, and the sheet says the portion
     in servings rather than a fraction that was never quite right. */
  /* The batch a plate asks the cook for — the plate itself, down to a
     twelfth of the recipe. Below that is a batch you bake and a plate you
     eat from it: one cookie of forty-eight scaled to 0.02 printed "0 cup
     butter", under a heading that (clamped at a twentieth) claimed 2⅜
     servings for a plate of one. A plate that small opens the recipe as
     written. At one serving that is only the thirteen recipes that make
     more than twelve. */
  function mCookScale(x, servN) {
    var f = x / (servN || 1);
    return f < 1 / 12 - 1e-9 ? 1 : f;
  }

  /* What the sheet calls its scale. A factor the dial can reach — a half,
     a double, an eighth — is said as one; a factor that came from a plate
     is said as the servings it makes, which is what it was asked for. */
  function mScaleWords(f, r) {
    var eighth = Math.abs(f * 8 - Math.round(f * 8)) < 1e-9;
    if (eighth) return null;
    var n = f * ((r && r.servN) || 1);
    return 'for ' + fmtNum(n) + (Math.abs(n - 1) < 1e-9 ? ' serving' : ' servings');
  }

  /* Draft the empty meals in one press. Slots fill in day order, each seeing
     what the ones before it took, so the four picks land as a combination
     rather than four separate best breakfasts. Only EMPTY slots are touched —
     what you placed yourself is your business — and each pick comes from the
     top three fits at random, so pressing it again offers a different day
     rather than insisting on the same one. Favorites carry their ranking
     bonus here too, which is what "favorites first when they fit" means. */
  /* The draft itself, with no screen attached.
   *
     Split out so the bench can run a few thousand days without a render
     between each one — see window.__macroLab. Splitting rather than copying:
     a second copy of this would drift from the first, and the whole point of
     measuring is that the thing measured is the thing that ships. */
  function mDraftDay() {
    var targets = mDayTargets(mViewKey());
    var near = mNearIds(mViewKey());
    mEditDay(mViewKey(), function (day) {
      /* Whether this day has room for a draft at all — asked once, and asked
         of what was already on it.
       *
         This check used to sit inside the loop and read the day's remaining
         live, which meant the dishes Fill had just placed were the reason the
         next meal got refused. Meals are walked in order, so it was always the
         ones at the bottom: an evening snack last in the list came up empty on
         nearly half of all runs, and pressing Fill again sometimes filled it,
         which is the tell — nothing about that meal had changed.

         Those dishes were never final. Every one of them is resized by
         mBalanceDay a few lines down; the draft overshoots by design, and its
         own comment says so. Refusing a meal over a portion that has not been
         settled yet is refusing it over a number that does not exist.

         What does justify refusing is a day already accounted for — press Fill
         at nine at night with everything logged and it should add nothing. So
         that is the question, and it can only be asked from up here, before
         the draft has had a chance to answer it for us. */
      if (mFillRoom(day, targets) < 100) return;

      /* Pins get the first claim of all.
       *
         A pin is a standing instruction and Fill is the machine acting on
         your instructions, so it has to be able to read them. It could not:
         pins were placed in exactly one moment, the first time a day was ever
         looked at, and nowhere else. Empty a day and its key survives as an
         object with empty arrays, which is truthy, so that branch never ran
         again — the pin was gone from that day for good, through Fill and
         through a reload both. Blake, who found it: "I cleared a day and then
         filled and I have my crio bru pinned and it did not show up."
       *
         At the pinned portion rather than at 1x. mRenderDay's seeding has
         always honoured p.x, and this is the same statement arriving by a
         different road; the two must not disagree about what a pin says.
       *
         Before the family's plan, because a pin is the older promise. They
         rarely contend — a pin is an item and the family's dish is placed by
         its section — and mSlotSpokenFor keeps either from shutting a meal. */
      var pinSlots = mReadSlots();
      pinSlots.list.forEach(function (ps) {
        if (mSkipped(mViewKey(), ps.k)) return;        // you said you are not eating it
        /* Not onto a meal you have already ticked. Every other pass asks this
           and this one never did, so a pin was the one thing that could land
           on a finished meal — and landing there re-opened it, which handed
           the topper a meal it would otherwise have left alone. Blake, after
           sweeping and filling: "Breakfast was marked complete and it did it
           and added more foods."
         *
           mSlotSpokenFor is deliberately NOT the test here. It also counts a
           hand-placed dish, and a pin is supposed to outrank one — pins get
           the first claim of all, which is why this pass runs before the
           others. What a pin must not outrank is a tick. */
        if (mSlotClosed(day, ps.k)) return;
        (ps.pins || []).forEach(function (p) {
          var pr = LIVE.BY_ID[p.id];
          if (!pr || !pr.macro) return;                // no macros, nothing to solve
          if (mOnDay(day, p.id)) return;               // already there, by any route
          // and its hydration switch, as mRenderDay's seeding keeps it: a pin
          // muted for water (a powder in an already-counted drink) stays muted
          var seeded = { id: p.id, x: p.x || 1, eaten: 0 };
          if (p.nh) seeded.nh = 1;
          (day[ps.k] = day[ps.k] || []).push(seeded);
        });
      });

      /* The family's plan gets first claim.
       *
         Before a single best-fit is chosen, whatever the house is having
         today is placed on the meal its section names. Everything below then
         steps over those meals by the rule it already had — "a meal with food
         on it is left alone" — so the draft builds AROUND the family dinner
         rather than instead of it, and mBalanceDay sizes it against your own
         targets along with everything else. Blake, on the flow he wants:
         "seeding my day with family recipes planned for that day would be
         good... auto fill a day based on my favorites and best fits."
       *
         At 1x to begin with. The portion is not guessed here because it is
         not guessed anywhere — the solver at the foot of this function sizes
         every plate on the day at once, which is the only place that can see
         what the rest of the day came to. */
      var wSlots = mReadSlots();
      mFamilyIds(mViewKey()).forEach(function (fid) {
        var r = LIVE.BY_ID[fid];
        if (!r || !r.macro) return;                    // no macros, nothing to solve
        if (mOnDay(day, r.id)) return;                 // already there, by any route
        /* Tried on every meal it could go on, not only the first: with one
           candidate, a Batch Prep container was dropped because lunch had a
           plate on it while dinner sat empty. And a meal holding only what
           this pass just put there is still the family's — two dishes
           planned for one dinner both go on it, where the second used to be
           dropped because the first had "spoken for" the meal. */
        var placed = false;
        mSlotsForRecipe(r, wSlots).forEach(function (s) {
          if (placed) return;
          var items = day[s.k] || [];
          var ours = items.length && items.every(function (it) { return it.by === 'w' && !it.eaten && !it.l; });
          if (mSlotSpokenFor(day, s) && !ours) return; // that meal is spoken for
          if (mSkipped(mViewKey(), s.k)) return;         // you said you are not eating it
          (day[s.k] = day[s.k] || []).push({ id: r.id, x: 1, eaten: 0, by: 'w' });
          placed = true;
        });
      });

      mReadSlots().list.forEach(function (s) {
          if (mSlotSpokenFor(day, s)) return;
          // you said you are not eating this one
          if (mSkipped(mViewKey(), s.k)) return;
          var secs = mSlotSecs(s);
          var inSec = LIVE.RECIPES.filter(function (r) {
            return secs.indexOf(r.book + '-' + r.secNum) >= 0 && !mOnDay(day, r.id);
          });
          /* What the neighbouring days have not already used — but only while
             that leaves something to choose from. A meal left empty to avoid a
             repeat is a worse answer than the repeat. */
          inSec = inSec.filter(function (r) { return (!r.ext || mExtOk()) && !mNever(r.id); });
          var fresh = inSec.filter(function (r) { return !near[r.id]; });
          var pool = fresh.length ? fresh : inSec;
          var ranked = mRank(pool, day, targets, s).filter(function (e) { return e.score !== null; });
          if (!ranked.length) return;
          var top = ranked.slice(0, 3);
          var pick = top[Math.floor(Math.random() * top.length)];
          (day[s.k] = day[s.k] || []).push({ id: pick.r.id, x: pick.x, eaten: 0, by: 'f' });
      });

      /* Settle the portions before asking whether anything is missing. Each
         dish was sized against its own share while the slots were still being
         filled, so the raw draft usually sits ON or over the day — the gap
         only opens once the plates are solved against the finished day. A
         topper chosen before that would be answering a question nobody asked;
         one chosen after gets sized in the second pass along with everything
         else it now sits beside. */
      mBalanceDay(day, targets, true);

      /* The side first, and the day settled around it, THEN the question of
         what is missing. Asked the other way round, the topper judged a day
         that was about to change: the vegetables add their carbohydrate, the
         balance takes it back out of the dishes, and the protein went with it
         — 164 g when the topper looked, 147 once the plates were settled,
         with nothing left to notice. */
      if (mSideUp(day, targets, near)) mBalanceDay(day, targets, true);
      if (mTopUp(day, targets, near)) mBalanceDay(day, targets, true);
    });
  }

  function mFillDay() { mDraftDay(); renderMacros(); }

  return { mOnDay: mOnDay, mNearIds: mNearIds, mCookScale: mCookScale, mScaleWords: mScaleWords, mDraftDay: mDraftDay, mFillDay: mFillDay };
};
