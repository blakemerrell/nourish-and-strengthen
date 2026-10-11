/* What a meal draws from, and the day around it: the pool of dishes a meal
 * is filled from (mMealPool, widened on asking, mWideOpen, and to your own
 * extra foods, mExtOk), the summary a day is drawn and judged by
 * (mDaySummary), Try again on a meal (mTryAgain) and the step from one day
 * to the next (mNavDay).
 *
 * A part of app.js (Nourish) in a file of its own. app.js calls
 * HiveParts.pool(app) once, as it starts, handing over what it reads of the
 * app's, and through LIVE the recipes, the foods and the section list the
 * app rebuilds as they change (tests/scope.test.js holds the lists to each
 * other), and keeps the six under their own names. Loaded before app.js.
 */
(window.HiveParts = window.HiveParts || {}).pool = function (app) {
  'use strict';

  // what it reads of the app's, and (LIVE) what the app replaces as it goes: BY_ID, MFOODS, M_ALL_SECS, RECIPES
  var MTRY_WIDE = app.MTRY_WIDE;
  var M_WDAYS = app.M_WDAYS;
  var S = app.S;
  var dayKey = app.dayKey;
  var kcalOf = app.kcalOf;
  var keepingFocus = app.keepingFocus;
  var keyDate = app.keyDate;
  var mDay = app.mDay;
  var mDayTargets = app.mDayTargets;
  var mDoneAt = app.mDoneAt;
  var mEarliestKey = app.mEarliestKey;
  var mEditDay = app.mEditDay;
  var mLatestKey = app.mLatestKey;
  var mNearIds = app.mNearIds;
  var mNever = app.mNever;
  var mOnDay = app.mOnDay;
  var mRank = app.mRank;
  var mReadProfileRaw = app.mReadProfileRaw;
  var mReadSlots = app.mReadSlots;
  var mSlotSecs = app.mSlotSecs;
  var mTotals = app.mTotals;
  var mVerdict = app.mVerdict;
  var mViewKey = app.mViewKey;
  var renderMacros = app.renderMacros;
  var todayKey = app.todayKey;
  var LIVE = app.LIVE;

  function mExtOk() { return !!mReadProfileRaw().extFill; }

  function mMealPool(slot, wide) {
    var secs = wide ? mAllSecs() : mSlotSecs(slot);
    var pool = LIVE.RECIPES.filter(function (r) {
      return secs.indexOf(r.book + '-' + r.secNum) >= 0;
    });
    var ext = mExtOk();
    /* No meal filter here, deliberately. This pool is what the picker LETS
       YOU LOOK THROUGH for a meal, and `meals` is about what gets SUGGESTED —
       the same line the ext gate is held to a few lines up in mpFitsHTML.
       Filtering here emptied whole shelves out of the rail at breakfast while
       the search box went on finding every one of them, which is a shelf that
       disagrees with itself. The tag does its work in mComboFor, mTopUp and
       mSideUp, which are the three places something is offered unasked. */
    LIVE.MFOODS.forEach(function (r) {
      if (r.ext && !ext) return;
      if (r.eat || r.side) pool.push(r);
    });
    return pool;
  }

  /* Every section there is, from the data rather than from a list here — a
     book gaining a section should not need this remembering.
   *
     Cached because a widened meal rebuilds its pool on every "not that one",
     and dropped by rebuild() whenever RECIPES is replaced. The list is an
     answer ABOUT RECIPES; it can only outlive that array by lying, and the
     lie is silent — a section missing from here is a recipe that is simply
     never offered, with nothing anywhere to say it was skipped. */
  function mAllSecs() {
    if (!LIVE.M_ALL_SECS) {
      var seen = {};
      LIVE.RECIPES.forEach(function (r) { seen[r.book + '-' + r.secNum] = 1; });
      LIVE.M_ALL_SECS = Object.keys(seen);
    }
    return LIVE.M_ALL_SECS;
  }

  /* Whether this meal has been opened up, for the card to say so. */
  /* The cursor is zero-based — the first press stores 0 — so the tenth press
     stores 9. Both readers compare against the same expression rather than
     each doing its own arithmetic and disagreeing by one. */
  function mWideOpen(sk) {
    return (S.mTry[mViewKey() + ':' + sk] || 0) >= MTRY_WIDE - 1;
  }

  /* How the day landed, and where it sits in the week.
   *
     Everything here is read back through mTotals and mDayTargets — the same
     two the pills at the top of the screen use — so the card and the strip
     can never disagree about what you ate. It computes nothing of its own.

     Seven days back from the one being looked at, not Monday-to-Sunday: on a
     Wednesday a calendar week is three days and answers nothing. */
  function mDaySummary(k) {
    var T = mDayTargets(k);
    var day = mDay(k);
    var tot = mTotals(day).all;
    /* Eaten calories are CARRIED. A target's are DERIVED. They are two
       different quantities and only one of them has a second answer.
     *
       A plate states its own energy: a packet's label uses factors particular
       to that food, and a food typed in with nothing but its calories has no
       grams to derive from at all. A target is grams and has nothing else it
       could be.
     *
       This sheet ran 4P + 4C + 9F over both. The day bar carries, so the two
       disagreed about the same day — 2,006 on the bar against 2,005 here on
       an ordinary one — and a calories-only plate scored nothing at all: a
       700 kcal salad logged at breakfast read "Nothing was written down on
       this day" underneath a bar that said 700. That is the whole of what a
       person who ate out has to show for writing it down.
     *
       The same rule is already written out above mDayEaten, where the picker
       was fixed for exactly this. It never reached this function. The local
       helper that made the mistake possible is deleted rather than corrected:
       kcalOf is the one way to turn a target into calories, and there is now
       nothing in scope that will quietly do it to a plate. */
    var got = Math.round(tot.kcal || 0), want = kcalOf(T);

    var rows = [
      { n: 'Protein', kk: 'p', got: Math.round(tot.p), want: Math.round(T.p) },
      { n: 'Fat', kk: 'f', got: Math.round(tot.f), want: Math.round(T.f) },
      { n: 'Carbs', kk: 'c', got: Math.round(tot.c), want: Math.round(T.c) }
    ];

    /* Where the day actually went. The one number you cannot read off the
       cards is how much of it landed in a single meal. */
    var meals = [];
    mReadSlots().list.forEach(function (s) {
      var kc = 0;
      (day[s.k] || []).forEach(function (it) {
        var r = LIVE.BY_ID[it.id];
        if (r && r.macro) kc += (r.macro.kcal || 0) * it.x;
      });
      if (kc > 0) meals.push({ n: s.n, kcal: Math.round(kc) });
    });
    var mTot = 0, biggest = null;
    meals.forEach(function (m) {
      mTot += m.kcal;
      if (!biggest || m.kcal > biggest.kcal) biggest = m;
    });

    /* The week behind it, each day against ITS OWN target — a day on a
       different plan is not made to look like a miss. A day never filled in
       draws nothing: nothing logged is a gap in the record, not a day of no
       food, and counting it as a zero would quietly tell you the cut is going
       better than it is. */
    var week = [], onP = 0, kept = 0, sumK = 0;
    var d = keyDate(k), todayK = todayKey();
    for (var i = 6; i >= 0; i--) {
      var dd = new Date(d.getFullYear(), d.getMonth(), d.getDate() - i);
      var dk = dayKey(dd);
      var dt = mTotals(mDay(dk)).all;
      var dT = mDayTargets(dk);
      /* Calories count as something written down, here as everywhere else on
         this sheet. A week of eating out was a week of blank bars. */
      var has = (dt.p + dt.f + dt.c + (dt.kcal || 0)) > 0;
      /* A day still being eaten is drawn but not counted: today at two in
         the afternoon is half a day, and averaging it in pulled "your
         seven-day average" down and scored the protein a miss before dinner.
         The week strip's dots already refuse to call today a miss; this
         agrees with them. Today counts once you have closed it, and a day
         you are planning ahead never does. */
      var over = dk < todayK || (dk === todayK && mDoneAt(dk) > 0);
      var hit = null;
      if (has && over) {
        kept++;
        sumK += (dt.kcal || 0);
        hit = mVerdict('p', dt.p, dT.p) === 'on' ? 1 : 0;
        if (hit) onP++;
      }
      week.push({ k: dk, kcal: has ? Math.round(dt.kcal || 0) : null,
        want: kcalOf(dT), hit: hit, today: dk === k,
        v: has ? mVerdict('kcal', dt.kcal || 0, kcalOf(dT)) : null,
        lab: M_WDAYS[dd.getDay()].slice(0, 1) });
    }

    /* A day barely written down is not a day of great restraint, and this is
       the one state these cards usually lie about. It does not guess which it
       was — it says it cannot tell. */
    var thin = got > 0 && got < want * 0.45;
    return { rows: rows, week: week, onP: onP, kept: kept, meals: meals,
      biggest: biggest, mTot: mTot, got: got, want: want, thin: thin,
      avg: kept ? Math.round(sumK / kept) : 0,
      any: (tot.p + tot.f + tot.c + (tot.kcal || 0)) > 0 };
  }

  /* Another suggestion for one meal, and then the next one after that.
   *
   * Fill my day drafts everything at once and picks at random from the top
   * three; the picker is for when you know what you want. Between them sits
   * the commonest move of all — "not that, what else?" — which until now
   * meant deleting a plate and opening the picker to take the next line down.
   *
   * So this walks the ranked list a step at a time, keeping a cursor per
   * meal per day, and leaves alone the three kinds of plate that are not the
   * machine's to swap: what you have eaten, what you have locked, and what
   * you have pinned, because a pin is a standing instruction and this would
   * only be arguing with it. */
  function mTryAgain(sk) {
    var k = mViewKey();
    S.mTouched = sk;                   // keep the meal you are cycling open
    // and its card showing what it now holds, if it was shut to its status
    if (S.mView[k] && S.mView[k][sk] === 1) S.mView[k][sk] = 2;
    var targets = mDayTargets(k);
    var slots = mReadSlots();
    var srec = null;
    slots.list.forEach(function (sl) { if (sl.k === sk) srec = sl; });
    if (!srec) return;
    var pins = (srec.pins || []).map(function (pn) { return pn.id; });
    var cursorKey = k + ':' + sk;

    mEditDay(k, function (day) {
      var had = (day[sk] || []).length;
      var keep = (day[sk] || []).filter(function (it) {
        return it.eaten || it.l || pins.indexOf(it.id) >= 0;
      });
      /* Nothing here is the machine's to swap, so there is nothing to try
         again at. Adding a second plate instead would be answering a
         question nobody asked — and would quietly hand Rebalance something
         to move on a meal that was deliberately pinned down. */
      if (had && keep.length === had) return;
      /* Whatever is being swapped out is out. The cursor starts at the top of
         a list the removed plate has just rejoined, so the first press could
         hand you back the very thing you pressed it to be rid of — "not that
         one" answered with that one. */
      var dropped = (day[sk] || []).filter(function (it) {
        return keep.indexOf(it) < 0;
      }).map(function (it) { return it.id; });
      day[sk] = keep;
      /* Ten presses is not exhaustion — a lunch has forty-odd recipes to walk
         and the cursor wraps long before you run out. It is disagreement.
         You have said "not that one" ten times, which is the clearest signal
         anybody gives that the sections this meal is allowed to look at are
         not where the answer is. So it stops being allowed to look only there.

         It stays open for the rest of the day on that meal, and says so on
         the card — a roast beef breakfast arriving unannounced reads as a
         bug rather than as an answer to what you asked for. */
      var tries = (S.mTry[cursorKey] === undefined ? -1 : S.mTry[cursorKey]) + 1;
      /* The repeat guard Fill uses, so "not that one" does not answer with
         yesterday's dinner — unless it is all that is left to offer. */
      var near = mNearIds(k);
      var pool0 = mMealPool(srec, tries >= MTRY_WIDE - 1).filter(function (r) {
        return !mOnDay(day, r.id) && dropped.indexOf(r.id) < 0 && !mNever(r.id);
      });
      var fresh = pool0.filter(function (r) { return !near[r.id]; });
      var pool = fresh.length ? fresh : pool0;

      var ranked = mRank(pool, day, targets, srec).filter(function (e) { return e.score !== null; });
      if (!ranked.length) return;
      S.mTry[cursorKey] = tries;
      var pick = ranked[tries % ranked.length];
      /* The machine's pick, marked as the machine's: without `by` it read as
         placed by hand, and Fill never sized it again. */
      day[sk].push({ id: pick.r.id, x: pick.x, eaten: 0, by: 'f' });
    });
    keepingFocus(renderMacros);
  }

  function mNavDay(step) {
    var d = keyDate(mViewKey());
    d.setDate(d.getDate() + step);
    var k = dayKey(d);
    if (k > mLatestKey() || k < mEarliestKey()) return;
    S.macroDate = k === todayKey() ? null : k;
    S.mEdit = '';                    // a different day, a different plate
    renderMacros();
  }

  return { mExtOk: mExtOk, mMealPool: mMealPool, mWideOpen: mWideOpen, mDaySummary: mDaySummary, mTryAgain: mTryAgain, mNavDay: mNavDay };
};
