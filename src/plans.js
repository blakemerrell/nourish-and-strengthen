/* The profile and the plans it makes: what is stored and what the rest of
 * the app sees (mReadProfileRaw, mReadProfile, mWriteProfile), the scale
 * as one number (mScaleLb), how much of you is fat and how fast it can be
 * spent (mBodyFat, MFAT_MAX), the four plans (MGOALS), protein by the body
 * you are building and how far it may give (MPROT_LEVELS, MPROT_WORDS,
 * mProtLevel, mProtRefLb, mProtGrams, mProtFloorG), and the floor under
 * every plan (mFloorK, MFAT_FLOOR, MCARB_SHARE). The longer account is
 * with the code.
 *
 * A part of app.js (Nourish) in a file of its own. app.js calls
 * HiveParts.plans(app) once, as it starts, and keeps what it gives back
 * under the same names. The weight log (MWEIGHTS) is declared further
 * down app.js, so the part reads it through LIVE (tests/scope.test.js
 * holds the lists to each other). Loaded before app.js.
 */
(window.HiveParts = window.HiveParts || {}).plans = function (app) {
  'use strict';

  // what it reads of the app's, and (LIVE) what the app replaces as it goes: MWEIGHTS
  var mHealTargets = app.mHealTargets;
  var mPut = app.mPut;
  var mStamp = app.mStamp;
  var mWeightStats = app.mWeightStats;
  var todayKey = app.todayKey;
  var LIVE = app.LIVE;

  /* What is actually in storage. Only the plan sheet's Save has any business
     with this — everything else wants mReadProfile below, which reads the
     weight off the scale. */
  function mReadProfileRaw() {
    try {
      var pr = JSON.parse(localStorage.getItem('bsc.macroProfile'));
      if (pr && typeof pr === 'object') return pr;
    } catch (e) { /* private mode or corrupt */ }
    return { sex: 'm', age: 0, ft: 0, inch: 0, lb: 0, act: 1.55, goal: 'cut1',
      goalLb: 0, goalBy: '', workouts: 0, steps: 0 };
  }

  /* The scale, as one number.
   *
     Bodyweight was stored twice and the two disagreed: 57 mornings falling
     205 -> 190 in the weigh-in log, and `lb: 205` still sitting in the profile
     because the plan sheet is the only thing that has ever written it. Every
     target built on bodyweight — protein by the pound, the 0.3 g/lb fat
     floor, the pace cap — was being worked out against a weight fifteen
     pounds stale, and no screen said so.
   *
     The seven-day average rather than this morning's number: a target that
     moved with a night's water would be noise wearing a decimal point, and
     the average is already what mPlanFace steers by, so this makes one number
     out of two rather than adding a third. Guarded on MWEIGHTS because it is
     assigned by an IIFE further down the file. */
  function mScaleLb() {
    if (typeof LIVE.MWEIGHTS === 'undefined' || !LIVE.MWEIGHTS) return 0;
    var st = mWeightStats();
    return st && st.avg7 ? Math.round(st.avg7 * 10) / 10 : 0;
  }

  /* The profile as the rest of the app should see it: what you told it, with
     the weight overwritten by what the scale has since said. The stored `lb`
     survives as the fallback for the case it is genuinely for — the first
     plan, before there is a log to read. */
  function mReadProfile() {
    var pr = mReadProfileRaw();
    var lb = mScaleLb();
    if (lb) pr.lb = lb;
    return pr;
  }
  /* A profile change is the one thing that can turn a stored plan into a day
     nobody can eat, so it is the one place besides boot that has to ask. */
  function mWriteProfile(pr) {
    /* A goal remembers the morning it was set and what the scale read then,
       so the plan line has somewhere true to start from. Only a CHANGED goal
       is stamped: a training-day toggle must not quietly move the line. */
    var was = mReadProfileRaw();
    if (pr.goalLb && pr.goalBy && (pr.goalLb !== was.goalLb || pr.goalBy !== was.goalBy)) {
      pr.goalSet = todayKey();
      pr.goalFrom = mScaleLb() || Math.round((Number(pr.lb) || 0) * 10) / 10;
    }
    if (!pr.goalLb || !pr.goalBy) { delete pr.goalSet; delete pr.goalFrom; }
    mStamp('pr');
    mPut('bsc.macroProfile', pr);
    if (window.Train && window.Train.syncProfile) window.Train.syncProfile(pr);
    /* A new profile is the one thing that can turn a stored plan into a day
       nobody can eat — a heavier body raises its own floor. Asked here, where
       the change is made, rather than inside whichever read ran first. */
    mHealTargets();
  }

  /* Kilocalories a day per pound of fat. Alpert measured a ceiling on how
     fast the fat store can hand energy over — 290 kJ per kg of fat a day,
     about 31 kcal a pound — and later corrected it to roughly 22. Past it
     the shortfall has to come from somewhere that is not fat, which on a
     cut is the muscle the protein target exists to keep. The lower figure
     is the one used here: it is his own correction, and a ceiling guessed
     too high is the only direction that costs anything. */
  var MFAT_MAX = 22;

  /* How much of you is fat, in pounds.
   *
     Typed if you have typed one, because a caliper or a scan beats any
     formula. Otherwise Deurenberg 1991 off BMI, age and sex, which is the
     standard estimate from figures already asked for — and which carries a
     standard error of about 4 points, so it is stated as an estimate and
     can be typed over. Blake's call: "estimate it and then let me get more
     precise if I want to." */
  function mBodyFat(pr) {
    if (!pr || !pr.lb || !pr.age || !(pr.ft || pr.inch)) return null;
    var told = Number(pr.bf) || 0;
    var pct = told;
    if (!pct) {
      var m = (pr.ft * 12 + pr.inch) * 0.0254;
      if (!(m > 0)) return null;
      var bmi = (pr.lb * 0.45359237) / (m * m);
      pct = 1.20 * bmi + 0.23 * pr.age - 10.8 * (pr.sex === 'f' ? 0 : 1) - 5.4;
    }
    pct = Math.max(3, Math.min(70, pct));
    return { pct: Math.round(pct * 10) / 10,
      lb: Math.round(pr.lb * pct) / 100, told: !!told };
  }

  /* The four plans. The swing off maintenance is all a plan says now: the
     protein each one carried (1.1 g a pound on the hard cut, down to 0.85 on
     maintenance) went to mProtGrams, which asks about the body you are
     building rather than the pace you are going at. */
  /* The four, as Renaissance Periodization frames them: a cut is a RATE, not
     a percentage off the day's burn.
   *
     This matters because the two scale differently. A flat quarter off the
     day gives a 205 lb man 1,905 kcal and a 120 lb woman 1,200 — the same
     fraction, wildly different propositions. A pound a week per hundred of
     bodyweight gives him 1,515 and her 1,000, which is the number the
     literature actually argues about, and which is what an app that says
     "hard cut" is expected to mean.
   *
     RP's own tiers run about 0.5% of bodyweight a week for slow, 0.75% for
     moderate and 1% for aggressive, and they stop there: past a percent, the
     weight coming off stops being mostly fat. Lean gain is slower still.
     rate is bodyweight fraction per week; positive takes weight off. */
  var MGOALS = {
    cut2: { rate: 0.0100 },
    cut1: { rate: 0.0075 },
    keep: { rate: 0.0000 },
    gain: { rate: -0.0025 }
  };

  /* Protein, by the pound of the body you are building rather than the one
     you are carrying.
   *
     It was 1.0 to 1.1 g a pound of TOTAL weight, which on a big frame spends
     the day before the plate gets to it: a 212 lb lifter was asked for 212 g,
     which left 96 g of carbohydrate on a lifting day and a dinner budgeted at
     none. The pound that matters is the muscle's. So the reference is the
     lean mass when a body fat has been typed, the goal weight when one is set,
     and today's weight only when there is nothing better to go on — a formula's
     estimate of body fat is not "known", and a protein target built on a
     four-point guess would be wrong in the way nobody could see.
   *
     Blake's call: "Default ~1 g per lb of goal weight (or of lean mass if body
     fat is known), never more than 1 g/lb of total weight; plus a 'Protein
     level' choice on the plan step." High is the default; `cap` is the most
     each level may ask per pound of what you weigh today. */
  var MPROT_LEVELS = {
    mod: { per: 0.8, cap: 1.0 },
    high: { per: 1.0, cap: 1.0 },
    vhigh: { per: 1.2, cap: 1.1 }
  };
  var MPROT_WORDS = [['mod', 'Moderate'], ['high', 'High'], ['vhigh', 'Very high']];

  // a profile that never chose has chosen High
  function mProtLevel(pr) {
    return pr && MPROT_LEVELS[pr.prot] ? pr.prot : 'high';
  }

  /* The pounds protein is counted against. A goal under half of today's
     weight is a typing slip — 18 for 185 — and would have planned 18 g, so
     it is read as half; a goal that high is a years-long plan anyway. */
  function mProtRefLb(pr) {
    var lb = Number(pr && pr.lb) || 0;
    var bf = Number(pr && pr.bf) || 0;
    if (bf > 0 && bf < 70) return lb * (1 - bf / 100);
    var goal = Number(pr && pr.goalLb) || 0;
    if (goal > 0) return Math.max(goal, lb * 0.5);
    return lb;
  }

  function mProtGrams(pr) {
    var L = MPROT_LEVELS[mProtLevel(pr)];
    var lb = Number(pr && pr.lb) || 0;
    return Math.round(Math.min(L.per * mProtRefLb(pr), L.cap * lb));
  }

  /* How far protein may give ground when a cut is squeezed for carbohydrate:
     0.8 g a pound, as it always was, but a pound of the SAME reference the
     target is counted in. Left on total weight it sat above the Moderate
     level for anybody with a goal — 170 g under a 148 g choice for the 212 lb
     lifter aiming at 185 — and would have quietly overruled it. Never more
     than the target itself, so the floor can only ever hold protein, not
     raise it. mFloorK still prices the calorie floor at 0.8 g a pound of what
     you weigh: a floor priced higher than the planner needs is only cautious,
     and moving it would have moved every hard cut's calories with it. */
  function mProtFloorG(pr) {
    return Math.min(mProtGrams(pr), Math.round(MPROT_FLOOR * mProtRefLb(pr)));
  }

  /* The floor under every plan this app will write. It is an absolute
     number, not a fraction of anything: a quarter off a big man's day is a
     different proposition from a quarter off a small woman's, and the danger
     is in the absolute.
   *
     It used to be the basal rate, which sounds stricter and is — too strict
     to say what a hard cut means. A hard cut IS below basal; that is the
     whole of what makes it hard. What made the old below-basal day
     uneatable was not the calories but the split: protein held 1.1 g a pound
     whatever was left, so three percent of the day remained for everything
     else. Protein gives ground now, so the floor can be honest about what a
     cut is and the plate still fills. */
  /* The lowest a plan is allowed to be, and the only calorie floor in the
     literature with anything under it.
   *
     1,200 comes from clinical work in the 1960s and 70s: roughly the point
     below which a day cannot meet its micronutrient needs without
     supplements. It is a nutrient floor, not a weight-loss target. The
     1,500 that used to sit here for men has no equivalent behind it — it is
     a magazine number — and it was the thing standing between Blake and the
     1,300-kcal day an RP-style hard cut actually asks him for. His call:
     "the plan I need to meet my plan. Sometimes that will be really low."
   *
     What keeps a plan sane is not this. It is the rate cap in mGoalPace —
     0.5 to 1% of bodyweight a week, which is what Helms, Aragon and
     Fitschen recommend for holding muscle — and the fat ceiling below. */
  /* The three constants the floor and the planner BOTH stand on. They were
     literals inside mPlanCalc and the floor knew nothing about them, which is
     how the floor came to sit below what the planner's own minimums cost. Two
     definitions of one quantity, and the plan lost the argument. */
  var MK_CLINICAL = 1200;   // the nutrient floor above
  var MPROT_FLOOR = 0.8;    // g a pound: the least a cut may ask of protein
  var MFAT_FLOOR = 0.3;     // g a pound: the floor hormones care about
  var MCARB_SHARE = 0.15;   // the least of the day left for carbohydrate
  /* Kilocalories a day per kilogram of fat-free mass. Below roughly thirty,
     the sports-medicine literature on relative energy deficiency finds the
     endocrine picture people mean by "it wrecks your hormones": testosterone
     down in men, cycles disrupted in women, T3 and leptin suppressed, bone
     and recovery with them. It is a threshold from studies of athletes, most
     of them women, so it is a population line and not a promise. */
  var MEA_KCAL_KG = 30;

  function mFloorK(pr) {
    if (!pr || !(pr.lb > 0)) return MK_CLINICAL;
    /* What the day's own minimums cost. Protein at its floor and fat at its
       floor are 5.9 kcal a pound between them, and leaving MCARB_SHARE of the
       day for carbohydrate makes the whole day that over 0.85. Under this
       number the planner cannot build the day it just promised: it spends
       everything on protein and fat and hands back zero carbohydrate. Which
       it did, for nineteen per cent of profiles. Blake, looking at one of
       them: "I feel I should have some carbs to eat for the day." */
    var macro = (4 * MPROT_FLOOR * pr.lb + 9 * MFAT_FLOOR * pr.lb) / (1 - MCARB_SHARE);
    /* And what the lean mass wants, less what the fat store can hand over —
       the same Alpert ceiling the pace cap already runs on. This is the term
       that does the hormone protecting, and its shape is the point: somebody
       with fat to spend barely feels it, and it tightens on its own as they
       lean out, which is when it starts to matter. */
    var ea = 0, fat = mBodyFat(pr);
    if (fat) {
      ea = MEA_KCAL_KG * (pr.lb - fat.lb) * 0.45359237 - fat.lb * MFAT_MAX;
    }
    return Math.round(Math.max(MK_CLINICAL, macro, ea));
  }

  return { mReadProfileRaw: mReadProfileRaw, mScaleLb: mScaleLb, mReadProfile: mReadProfile, mWriteProfile: mWriteProfile, mBodyFat: mBodyFat, mProtLevel: mProtLevel, mProtRefLb: mProtRefLb, mProtGrams: mProtGrams, mProtFloorG: mProtFloorG, mFloorK: mFloorK, MFAT_MAX: MFAT_MAX, MGOALS: MGOALS, MPROT_LEVELS: MPROT_LEVELS, MPROT_WORDS: MPROT_WORDS, MFAT_FLOOR: MFAT_FLOOR, MCARB_SHARE: MCARB_SHARE };
};
