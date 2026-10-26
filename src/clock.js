/* Whose clock, and whose day: every stamp is this device's clock and newest
 * wins, so the clock is corrected against the server's (mNow, mClockHear,
 * MCLOCK_ID, MCLOCK_SLACK) and stamps are taken by it (mStamp, mClaimAll);
 * and whose My Day this phone is holding, the account's or a guest's
 * (mAccount, mSuspectAccount, mOwner, mSetOwner, mAccountMark), with the one
 * way a day is forgotten (mForgetDay). The longer account is with the code.
 *
 * A part of app.js (Nourish) in a file of its own. app.js calls
 * HiveParts.clock(app) once, as it starts, and keeps what it gives back under
 * the same names. The stores it stamps are declared below it in app.js and
 * mClkSent and mAuthKnown stay declared there, so all of those it reaches
 * through LIVE (tests/scope.test.js holds the lists to each other). The one
 * line that hands Strengthen this clock stays in app.js, where it ran.
 * Loaded before app.js.
 */
(window.HiveParts = window.HiveParts || {}).clock = function (app) {
  'use strict';

  // what it reads of the app's, and (LIVE) what the app replaces as it goes: MAM, MBATCHG, MDAYS, MDAYT, MDONE, MHUSH, MINTAKE, MNEVER, MSEND, MSKIP, MTRAINED, MWEIGHTS, mClkSent, mDirty
  var MSTAMPS = app.MSTAMPS;
  var mBuildFoods = app.mBuildFoods;
  var mPut = app.mPut;
  var mSyncPush = app.mSyncPush;
  var LIVE = app.LIVE;

  /* ------------------------------------------------------ whose clock
   *
     Every stamp is this device's clock, and newest wins — so a device whose
     clock is wrong is wrong about everything it writes. A phone set a day
     fast won every merge for a day; one set a day slow lost every edit it
     made to the copy already on the account. Phones mostly keep good time,
     but "mostly" is a person who set theirs by hand once, and a tablet that
     has been off the network for a month.
   *
     So the clock is corrected against the server's. Each push to the
     account carries a server timestamp, labelled with this device's id;
     when the account hands it back, the difference between it and the local
     clock at the moment it was written is how far out this device is. Only
     a real error is corrected — two minutes and more — so ordinary network
     delay never moves a stamp. It is kept, so a device opened with no signal
     still stamps with what it last learned. */
  var MCLOCK_SLACK = 5 * 60000;       // how far ahead of us a stamp is let be
  var MCLOCK_ID = (function () {
    var id = '';
    try { id = localStorage.getItem('bsc.clockId') || ''; } catch (e) { /* private mode */ }
    if (!/^[a-z0-9]{6,16}$/.test(id)) {
      id = (Math.random().toString(36) + '000000').slice(2, 12);
      try { localStorage.setItem('bsc.clockId', id); } catch (e2) { /* this session only */ }
    }
    return id;
  })();
  var MSKEW = (function () {
    var v = 0;
    try { v = Number(localStorage.getItem('bsc.clockSkew')) || 0; } catch (e) { v = 0; }
    return isFinite(v) && Math.abs(v) < 366 * 86400000 ? v : 0;
  })();
  function mNow() { return Date.now() + (MSKEW || 0); }   // || 0: asked before this line has run

  /* The server's answer to a push this device stamped. Only our own label
     counts — the other device's push carries its own — and only a round
     trip short enough that half of it is a small error. */
  function mClockHear(data, pending) {
    var c = data && data.clk;
    if (pending || !LIVE.mClkSent || !c || c.by !== MCLOCK_ID || !c.at || typeof c.at.toMillis !== 'function') return;
    var back = Date.now(), trip = back - LIVE.mClkSent;
    LIVE.mClkSent = 0;
    if (!(trip >= 0 && trip < 15000)) return;
    var off = c.at.toMillis() - (back - trip / 2);
    MSKEW = Math.abs(off) >= 120000 ? Math.round(off) : 0;
    try { localStorage.setItem('bsc.clockSkew', String(MSKEW)); } catch (e) { /* this session only */ }
  }

  function mStamp(part, sub) {
    var now = mNow();
    if (sub) {
      /* Per-key stamps, for the parts that are maps of days rather than one
         value: the day log, and which days you have closed. Keyed by part
         rather than hardcoded to 'd', so two of them can coexist without one
         quietly writing into the other's stamps. */
      MSTAMPS[part] = MSTAMPS[part] || {};
      MSTAMPS[part][sub] = now;
      if (LIVE.mDirty[part] !== true) {
        LIVE.mDirty[part] = LIVE.mDirty[part] || {};
        LIVE.mDirty[part][sub] = 1;
      }
    } else {
      MSTAMPS[part] = now;
      LIVE.mDirty[part] = true;
    }
    mPut('bsc.myStamps', MSTAMPS);
    mSyncPush();
  }

  /* Every part stamped as of now, each in the shape it keeps its stamps: one
     number for a single value, a map for a part keyed by day or by morning.
     The first version of "this device is right" wrote a number over the
     weight map. Every morning then shipped with a stamp of zero, which no
     other device would take, and the next weigh-in tried to set a property
     on a number and threw. A part's stamp has one shape, and this is the
     only place that writes all of them at once. */
  function mClaimAll() {
    var now = mNow();
    ['t', 'pr', 'sl', 'mf', 'nv', 'bg', 'dk'].forEach(function (k) { MSTAMPS[k] = now; });
    [['d', LIVE.MDAYS], ['dn', LIVE.MDONE], ['sp', LIVE.MSKIP], ['sn', LIVE.MSEND], ['w', LIVE.MWEIGHTS],
      ['tn', LIVE.MTRAINED], ['am', LIVE.MAM]].forEach(function (pair) {
      var part = pair[0];
      var map = (MSTAMPS[part] && typeof MSTAMPS[part] === 'object') ? MSTAMPS[part] : {};
      MSTAMPS[part] = map;
      Object.keys(map).concat(Object.keys(pair[1])).forEach(function (k) { map[k] = now; });
    });
    mPut('bsc.myStamps', MSTAMPS);
  }

  /* This used to be a private code, which was the right shape for one person
     with two phones and the wrong shape the moment the app went to a
     congregation. A code can be read aloud, forwarded, or guessed, and what
     it was guarding is a weight history. It is an account now: the document
     is the signed-in person's own, and the rule that guards it is whose it
     is rather than what you can recite. */
  function mAccount() { return window.Store.user ? window.Store.user() : null; }

  function mSuspectAccount() {
    try { return localStorage.getItem('bsc.myAccount') === '1'; } catch (e) { return false; }
  }

  /* This device has an account, remembered without asking the network — the
     one thing that has to be known before deciding whether to reach for it. */
  /* Whose day is on this device. Written beside the data rather than kept in
     the account, because it has to be answerable before the network is. */
  function mOwner() {
    try { return localStorage.getItem('bsc.myOwner') || ''; } catch (e) { return ''; }
  }
  function mSetOwner(uid) {
    try {
      if (uid) localStorage.setItem('bsc.myOwner', uid);
      else localStorage.removeItem('bsc.myOwner');
    } catch (e) { /* private mode */ }
  }

  /* Signing out has to take the day with it.
   *
     It did not, and the next person to sign in on the same device inherited
     it: mSyncStart pushes once on connect, mSyncPayload reads whatever is
     still in memory and in storage, and Firestore accepts it because the
     write is honestly authenticated as the new person. A weight history and a
     food log would land in a stranger's account and follow them onto their
     own devices, where the person it belonged to could never reach it again.
     Clearing storage alone is not enough — the payload is rebuilt from the
     module-level copies, so those have to go too. */
  function mForgetDay() {
    ['bsc.macroDays', 'bsc.macroWeights', 'bsc.myStamps', 'bsc.macroTargets',
      'bsc.macroProfile', 'bsc.macroSlots', 'bsc.myFoods', 'bsc.myOwner',
      'bsc.macroDone', 'bsc.macroSkip', 'bsc.macroSend', 'bsc.macroTrained',
      'bsc.macroHush', 'bsc.macroIntake', 'bsc.macroDayT', 'bsc.macroNever', 'bsc.macroBatchG',
      'bsc.macroCoachSeen', 'bsc.macroAm', 'bsc.macroDrinks'].forEach(function (k) {
      try { localStorage.removeItem(k); } catch (e) { /* private mode */ }
    });
    Object.keys(LIVE.MDAYS).forEach(function (k) { delete LIVE.MDAYS[k]; });
    Object.keys(LIVE.MWEIGHTS).forEach(function (k) { delete LIVE.MWEIGHTS[k]; });
    Object.keys(LIVE.MINTAKE).forEach(function (k) { delete LIVE.MINTAKE[k]; });
    Object.keys(LIVE.MDAYT).forEach(function (k) { delete LIVE.MDAYT[k]; });
    Object.keys(LIVE.MNEVER).forEach(function (k) { delete LIVE.MNEVER[k]; });
    Object.keys(LIVE.MBATCHG).forEach(function (k) { delete LIVE.MBATCHG[k]; });
    Object.keys(MSTAMPS).forEach(function (k) { delete MSTAMPS[k]; });
    Object.keys(LIVE.MDONE).forEach(function (k) { delete LIVE.MDONE[k]; });
    Object.keys(LIVE.MSKIP).forEach(function (k) { delete LIVE.MSKIP[k]; });
    Object.keys(LIVE.MHUSH).forEach(function (k) { delete LIVE.MHUSH[k]; });
    Object.keys(LIVE.MSEND).forEach(function (k) { delete LIVE.MSEND[k]; });
    Object.keys(LIVE.MTRAINED).forEach(function (k) { delete LIVE.MTRAINED[k]; });
    // and the mornings' check-ins, which are as much yours as the weigh-ins
    Object.keys(LIVE.MAM).forEach(function (k) { delete LIVE.MAM[k]; });
    /* And the training log, which is kept beside the day in the same record
       and has to leave with it for exactly the same reason. */
    if (window.Train) window.Train.forget();
    /* And the foods built from what was just cleared: the picker offered the
       last person's own foods to the next until something else redrew it. */
    mBuildFoods();
  }

  function mAccountMark() {
    try {
      if (mAccount()) localStorage.setItem('bsc.myAccount', '1');
      else localStorage.removeItem('bsc.myAccount');
    } catch (e) { /* private mode: this session only */ }
  }

  /* What this device would send. Read fresh each time so it never ships a
     stale copy of something edited in another tab. */

  return { mNow: mNow, mClockHear: mClockHear, mStamp: mStamp, mClaimAll: mClaimAll, mAccount: mAccount, mSuspectAccount: mSuspectAccount, mOwner: mOwner, mSetOwner: mSetOwner, mForgetDay: mForgetDay, mAccountMark: mAccountMark, MCLOCK_SLACK: MCLOCK_SLACK, MCLOCK_ID: MCLOCK_ID };
};
