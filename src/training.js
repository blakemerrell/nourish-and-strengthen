/* Which days you train, and what that does to the day: the lifting days,
 * kept in Strengthen or spread from workouts-a-week (mTrainDays,
 * mTrainDaysOwn, mWkIx); the targets for one day, and the targets a past
 * day was lived against (mDayTargets, MDAYT, mSnapTargets); a workout
 * written into the day it landed on (mCreditDay, mCreditWeek, mTrainSig);
 * a training day's carbohydrate, with the week kept whole (mCycleOf,
 * MCARB_EAT); whether a day is a training day (mIsTrainingDay); and whether
 * there is a Strengthen to follow (mSynced, mCanSync). The longer account
 * is with the code.
 *
 * A part of app.js (Nourish) in a file of its own. app.js calls
 * HiveParts.training(app) once, as it starts, and keeps what it gives back
 * under the same names. How long the day log keeps its days
 * (MINTAKE_DAYS) is declared further down app.js, so the part reads it
 * through LIVE (tests/scope.test.js holds the lists to each other). Loaded
 * before app.js.
 */
(window.HiveParts = window.HiveParts || {}).training = function (app) {
  'use strict';

  // what it reads of the app's, and (LIVE) what the app replaces as it goes: MINTAKE_DAYS
  var dayKey = app.dayKey;
  var keyDate = app.keyDate;
  var mBlockN = app.mBlockN;
  var mFloorK = app.mFloorK;
  var mPut = app.mPut;
  var mReadProfile = app.mReadProfile;
  var mReadProfileRaw = app.mReadProfileRaw;
  var mReadTargets = app.mReadTargets;
  var mStrengthOn = app.mStrengthOn;
  var mTrainedAt = app.mTrainedAt;
  var mTrainedSaid = app.mTrainedSaid;
  var todayKey = app.todayKey;
  var LIVE = app.LIVE;

  /* Which days you train, and what that does to the day.
   *
     RP does not eat the same thing seven days a week: a training day earns
     more carbohydrate and a rest day gives it back, so the WEEK averages to
     the plan while the days differ. Protein and fat hold steady — protein is
     the thing a cut protects and fat has a floor — so the carbohydrate
     carries the whole swing.
   *
     The days themselves are derived from the workouts-a-week already in the
     profile, spread evenly from Monday, and then overridden by tapping. The
     override is stored as its own list so a change to workouts-a-week does
     not silently rearrange days somebody has set by hand. */
  /* The least carbohydrate, as a share of a day's calories, that a day can
     carry and still be eaten from this book. Under it mReadTargets calls a
     stored plan starved and replaces it, and a cycled rest day may not go
     there either. The plan aims higher (MCARB_SHARE); this is the edge. */
  var MCARB_EAT = 0.12;
  var MCYCLE_SWING = 0.25;         // a training day's carbs, over the average

  function mTrainDefault(n) {
    var out = [];
    n = Math.max(0, Math.min(7, Math.round(Number(n) || 0)));
    if (!n) return out;
    // evenly spread across Mon..Sun, so 3 lands on Mon/Wed/Fri rather than Mon/Tue/Wed
    for (var i = 0; i < n; i++) out.push(Math.round(i * 7 / n) % 7);
    return out.sort(function (a, b) { return a - b; });
  }

  /* Monday-based index, because a training week starts on Monday and
     getDay() starts on Sunday. */
  function mWkIx(d) { return (d.getDay() + 6) % 7; }

  /* The lifting days: one list, kept in Strengthen and carried by the
     account. Until anything is picked there, the days the profile implies. */
  function mTrainDays() {
    try {
      var ld = window.Train && window.Train.liftDays ? window.Train.liftDays() : null;
      if (ld && ld.length) return ld.filter(function (n) { return n >= 0 && n <= 6; });
    } catch (e) { /* Strengthen is not up */ }
    return mTrainDaysOwn();
  }
  function mTrainDaysOwn() {
    var pr = mReadProfile();
    if (pr.train && Object.prototype.toString.call(pr.train) === '[object Array]') {
      return pr.train.filter(function (n) { return n >= 0 && n <= 6; });
    }
    return mTrainDefault(pr.workouts);
  }

  /* The targets for one day rather than for every day. With no training days
     — or with all seven — there is nothing to cycle and this is the plan. */
  /* The targets a past day was lived against.
   *
     Targets were never stored per day: every day in the week strip and the
     summary was judged against TODAY's plan, re-derived. Change carbohydrate
     today and yesterday — eaten, closed — turned from on target to over,
     against a number that did not exist yesterday. So what each day was
     aiming at is written down the first time the day is drawn as today, and
     kept; a past day reads its own. Local, like the intake log, and kept as
     long as it is; a day never drawn here falls back to the plan as it is. */
  var MDAYT = (function () {
    try {
      var v = JSON.parse(localStorage.getItem('bsc.macroDayT'));
      if (v && typeof v === 'object' && !Array.isArray(v)) return v;
    } catch (e) { /* none yet */ }
    return {};
  })();
  function mSnapTargets() {
    var k = todayKey(), t = mDayTargetsLive(k), was = MDAYT[k];
    if (was && was.p === t.p && was.f === t.f && was.c === t.c) return;
    MDAYT[k] = { p: t.p, f: t.f, c: t.c };
    var cut = new Date(); cut.setDate(cut.getDate() - LIVE.MINTAKE_DAYS);
    var cutK = dayKey(cut);
    Object.keys(MDAYT).forEach(function (d) { if (d < cutK) delete MDAYT[d]; });
    mPut('bsc.macroDayT', MDAYT);
  }
  /* A workout landing on a day, written into what the day was aiming at.
   *
     The snapshot is taken when Nourish draws today, and a workout saved in
     Strengthen draws nothing here — so an evening session logged with
     Strengthen on screen left the day on its morning rest-day number for
     good, and whether a day counted as trained came down to which tab had
     been showing. Today is snapped again; a day already behind you (a
     session saved after midnight, or its date edited back) is raised to its
     training-day number if it was drawn lower. Only raised: a planned day
     drawn as a training day and then skipped keeps what it was shown, which
     is what stops the week paying its carbs out twice. */
  function mCreditDay(k) {
    var today = todayKey();
    if (k === today) { mSnapTargets(); return; }
    var was = MDAYT[k];
    if (!(k < today) || !was || !mIsTrainingDay(k)) return;
    var t = mDayTargetsLive(k);
    if (!(t.c > was.c) || t.p !== was.p || t.f !== was.f) return;
    MDAYT[k] = { p: t.p, f: t.f, c: t.c };
    mPut('bsc.macroDayT', MDAYT);
  }
  /* The same for every day the window still draws, when Strengthen's log has
     arrived from somewhere else and any of them may have been trained. */
  function mCreditWeek() {
    for (var i = 0; i < 7; i++) {
      var d = new Date(); d.setDate(d.getDate() - i);
      mCreditDay(dayKey(d));
    }
  }
  /* What Nourish reads from Strengthen, in one string, so a change to it
     can be noticed: the lifting days, the block, and which of the last
     fortnight's days have a workout on them. */
  function mTrainSig() {
    if (!window.Train) return '';
    var out = [mTrainDays(), mBlockN(), mFirstLogged()];
    for (var i = 0; i < 14; i++) {
      var d = new Date(); d.setDate(d.getDate() - i);
      out.push(mStrengthOn(dayKey(d)).length);
    }
    return JSON.stringify(out);
  }
  function mDayTargets(k) {
    var snap = k < todayKey() ? MDAYT[k] : null;
    if (snap && isFinite(snap.p) && isFinite(snap.f) && isFinite(snap.c)) {
      return { p: snap.p, f: snap.f, c: snap.c };
    }
    return mDayTargetsLive(k);
  }

  /* The day's carbohydrate, with the week kept whole.
   *
     Blake: "the plan might be planned but I also might ad hoc go to the gym,
     or skip a day sometimes." A day that went differently from the plan —
     skipped, or an extra one — leaves the week owing or owed, and the days
     after it make it up in even shares: skip Thursday's 90 and Friday to
     Sunday each get about 12 more. Walked from Monday so every day, looked at
     any morning, gets the same share it was given on its own; a day's own
     change lands only on the days after it, never on itself. Days still to
     come count as planned.
   *
     Owed, never owing. An extra day used to be paid back too, out of the
     days after it, and that turned training more than planned into eating
     less than planned: a newcomer's first workout on an unplanned Saturday
     took Sunday from 217 g to 100, and two sessions on Thursday and Friday
     cut the weekend to 178 each. A day trained over the plan now runs the
     week a little high, which is what training more than you said you would
     costs. What it owes is still counted — an extra Tuesday and a skipped
     Wednesday are one moved session, and nothing is handed out for the
     Wednesday — it is only never taken out of a later day. */
  function mDayTargetsLive(k) {
    var base = mReadTargets();
    var cy = mCycleOf(base);
    if (!cy) return base;
    /* With no days planned there is nothing to skip, so nothing is ever owed:
       the day is the plan, or a training day's lift over it. Asked only of a
       day with a workout or a tick on it, which is most people's none. */
    if (!cy.T) {
      if (!mTrainedSaid(k) && !mStrengthOn(k).length) return base;
      return { p: base.p, f: base.f, c: mCycleC(base, cy, mIsTrainingDay(k)) };
    }
    var own = mCycleC(base, cy, mIsTrainingDay(k));
    var kd = keyDate(k), ws = new Date(kd);
    ws.setDate(ws.getDate() - mWkIx(kd));
    var today = todayKey(), owed = 0, adj = 0;
    for (var i = 0; i < 7; i++) {
      var d = new Date(ws); d.setDate(d.getDate() + i);
      var dk = dayKey(d);
      var planned = cy.train.indexOf(i) >= 0;
      var hard = mIsTrainingDay(dk);
      var share = Math.round(Math.max(0, owed) / (7 - i));
      var c0 = mCycleC(base, cy, hard);
      var c1 = Math.min(cy.hiC, Math.max(cy.loC, c0 + share));
      if (dk === k) { adj = c1 - c0; break; }
      /* What the day was actually given, against what the plan meant it to
         have. A past day that was drawn is read from its snapshot: a planned
         training day shown as one all day and eaten to, then counted as rest
         because nothing was logged, owes the week nothing — it had its carbs.
         Reading its status instead handed them out twice (549 g on a 525 g
         week). A snapshot from a different plan (the weekly follow moved the
         protein or fat) is not comparable, so then the status stands in. */
      var given = c1;
      if (dk < today) {
        var sn = MDAYT[dk];
        if (sn && isFinite(sn.c) && sn.p === base.p && sn.f === base.f) given = sn.c;
      }
      var meant = mCycleC(base, cy, dk <= today ? planned : hard);
      owed += meant - given;
    }
    return { p: base.p, f: base.f, c: Math.max(0, own + adj) };
  }
  function mCycleC(base, cy, hard) {
    return Math.max(0, Math.round(base.c * (hard ? 1 + cy.swing : 1 - cy.swing * cy.T / cy.R)));
  }
  function mCycleOf(base) {
    var train = mTrainDays();
    var T = train.length, R = 7 - T;
    if (!R || !base.c) return null;
    /* No lifting days planned is not "no training": a block can be running
       before its days are picked, and Strengthen promises "Saving marks today
       as a training day in Nourish". With nothing planned there is nothing
       for a rest day to give back, so every day is the plan and a day you
       train takes the lift a planned one would, on top. No floor to hold:
       nothing is ever taken off a day here. */
    if (!T) {
      return { train: train, T: 0, R: 7, swing: MCYCLE_SWING, loC: 0,
        hiC: Math.round(base.c * (1 + 2 * MCYCLE_SWING)) };
    }
    /* Whatever the training days gain, the rest days give back, so seven of
       these still add up to seven of the plan.
     *
       But the rest days pay T/R times the swing, and at six training days
       that is a hundred and fifty percent: the rest day's carbohydrate went
       negative, was clamped to nothing, and the day sat under the calorie
       floor with the week no longer averaging to plan. So the swing is the
       most the rest day can afford — its carbohydrate kept at the plan's own
       eatable line (MCARB_EAT) and its calories at the floor — and the training
       days take the same smaller swing, so the week still adds up. */
    var pr = mReadProfile();
    var other = 4 * base.p + 9 * base.f;
    var restMinC = Math.max(
      (mFloorK(pr) - other) / 4,
      MCARB_EAT * other / (4 * (1 - MCARB_EAT)));
    var swing = Math.min(MCYCLE_SWING, Math.max(0, (1 - restMinC / base.c) * R / T));
    /* What making up the week may do to one day: never under the rest day's
       own edge, never more than twice a training day's lift. */
    return { train: train, T: T, R: R, swing: swing, loC: Math.ceil(restMinC),
      hiC: Math.round(base.c * (1 + 2 * MCYCLE_SWING)) };
  }

  /* Ticked if you ticked it, planned otherwise.
   *
     The week's COUNT stays the planned one, which is what mDayTargets
     divides by — so the rest days give back exactly what the training days
     take and the week still averages to plan. The tick only moves which days
     are which. Tick more mornings than you planned for and the week runs a
     little high on carbohydrate, which is a true consequence of training
     more than you said you would. */
  function mIsTrainingDay(k) {
    var train = mTrainDays();
    if (train.length >= 7) return true;
    var planned = train.indexOf(mWkIx(keyDate(k))) >= 0;
    /* Not synced, the tick is how Nourish hears; unticked, a workout
       Strengthen has on the day, read from Strengthen when asked; otherwise
       the plan. The workout used to be copied in as a tick when it was saved,
       and the copy stayed when the workout was deleted or moved to another
       day, and was written even with sync switched off. Off, it is not read. */
    if (!mSynced()) {
      if (mTrainedSaid(k)) return mTrainedAt(k) > 0;
      if (mReadProfileRaw().syncTrain !== false && mStrengthOn(k).length) return true;
      return planned;
    }
    /* Synced, Strengthen is the whole answer — there is nothing on Nourish
       to press. Blake: "If sync with strength is on I don't want to see the
       toggle in Nourish." A workout logged that day is a yes. */
    if (mStrengthOn(k).length) return true;
    /* Synced with Strengthen, a planned day that ended with nothing logged
       was a rest day, and the rest of the week makes up for it — nothing to
       press. Blake: "with sync on I would just go there and load my actual
       workout." Only from the first workout Strengthen has on record, so the
       weeks before you logged anything there are not all counted as skips. */
    if (planned && k < todayKey() && mSynced()) {
      var first = mFirstLogged();
      if (first && k >= first) return false;
    }
    return planned;
  }
  /* Synced: a block is running in Strengthen, or days have been picked
     there. Either way Strengthen is where the workout is logged. */
  function mSynced() {
    if (mReadProfile().syncTrain === false) return false;
    return mCanSync();
  }
  /* Whether there is anything in Strengthen to sync with. */
  function mCanSync() {
    try { return !!(window.Train && ((window.Train.liftDays && window.Train.liftDays()) || mBlockN() > 0)); } catch (e) { return false; }
  }
  function mFirstLogged() {
    try { return window.Train && window.Train.firstLogged ? window.Train.firstLogged() : ''; } catch (e) { return ''; }
  }

  return { mWkIx: mWkIx, mTrainDays: mTrainDays, mTrainDaysOwn: mTrainDaysOwn, mSnapTargets: mSnapTargets, mCreditDay: mCreditDay, mCreditWeek: mCreditWeek, mTrainSig: mTrainSig, mDayTargets: mDayTargets, mCycleOf: mCycleOf, mIsTrainingDay: mIsTrainingDay, mSynced: mSynced, mCanSync: mCanSync, MCARB_EAT: MCARB_EAT, MDAYT: MDAYT };
};
