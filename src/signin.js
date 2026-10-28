/* Signed in, and keeping up: the listener on your record that starts at
 * sign-in and takes in what the account sends (mSyncStart), asking again
 * once there is signal (mSyncRetry, mWatchUser), the push of what changed
 * here (mSyncPush), and everything of yours gone from both ends
 * (mDeleteAccount). The longer account is with the code.
 *
 * A part of app.js (Nourish) in a file of its own. app.js calls
 * HiveParts.signin(app) once, as it starts, and keeps what it gives back
 * under the same names. Whether the server could be reached
 * (mSyncUnreachable) stays declared in app.js, and so do the record, its
 * listener and timer, what is dirty and whether the account has been
 * heard from; the part reaches all of those through LIVE
 * (tests/scope.test.js holds the lists to each other). The two listeners
 * that retry on signal and on coming back to the app stay in app.js, where
 * they ran. Loaded before app.js.
 */
(window.HiveParts = window.HiveParts || {}).signin = function (app) {
  'use strict';

  // what it reads of the app's, and (LIVE) what the app replaces as it goes: mAuthKnown, mClkSent, mDirty, mDirtyAll, mSyncDoc, mSyncHeard, mSyncOff, mSyncTimer, mSyncUnreachable
  var MCLOCK_ID = app.MCLOCK_ID;
  var MSTAMPS = app.MSTAMPS;
  var MSYNC_KEYED = app.MSYNC_KEYED;
  var S = app.S;
  var dinerKeep = app.dinerKeep;
  var dinerWatch = app.dinerWatch;
  var mAccount = app.mAccount;
  var mAccountMark = app.mAccountMark;
  var mBootTargets = app.mBootTargets;
  var mClockHear = app.mClockHear;
  var mCreditWeek = app.mCreditWeek;
  var mForgetDay = app.mForgetDay;
  var mHouseReconcile = app.mHouseReconcile;
  var mInviteTry = app.mInviteTry;
  var mMergeRemote = app.mMergeRemote;
  var mOwner = app.mOwner;
  var mSetOwner = app.mSetOwner;
  var mSuspectAccount = app.mSuspectAccount;
  var mSyncState = app.mSyncState;
  var mSyncTake = app.mSyncTake;
  var mTrainSig = app.mTrainSig;
  var pwFitCaps = app.pwFitCaps;
  var renderMacros = app.renderMacros;
  var renderModal = app.renderModal;
  var LIVE = app.LIVE;

  var mSyncAsking = false;

  /* ---- the day log, a year to a record
   *
     Blake, 2026-10-18: "I would assume that I'm keeping everything", and
     since then nothing is let go of. The account kept every day already —
     its writes merge — but all of it in your one record, users/{uid}, and
     a record holds a megabyte: a day with its flags is about a kilobyte, so
     two or three years, and then every save from every phone refused.
     Strengthen met the same ceiling with its workouts and answered it the
     same way (src/train.js, "A record a year").
   *
     So the parts kept by day (MSYNC_KEYED: the days, weigh-ins, closed days,
     training ticks, skips, what went to the household) go one record per
     calendar year under yours, users/{uid}/days/2026, and everything else
     (profile, targets, slots, your foods) stays in the one record. It needs
     the rule for them in firestore.rules; until that is published the
     listener below is refused and everything carries on in the one record
     exactly as before. Once it is, what the one record still holds is copied
     to its years and taken out only once the copy has landed, and only where
     the year holds it at least as new: nothing is ever in neither place.
   *
     on:    null not yet known, true by year, false all in the one record
     heard: the years (or their refusal) have answered, so a push knows where
     seenY: what each year's record holds, part, day, stamp
     seenM: the same of the one record, used while there are no years
     main:  the days the one record still holds, part, day, stamp
     purge: the ones of those to take out of it once their year has them */
  var KEYED = MSYNC_KEYED.map(function (row) { return row.part; });
  var DY = { on: null, heard: false, off: null, fv: null, seenY: {}, seenM: {}, main: {}, purge: {} };
  function dyYear(enc) { var y = String(enc).slice(0, 4); return /^\d{4}$/.test(y) ? y : ''; }
  /* Each kept part's days and stamps, as a record holds them. Weigh-ins in
     the shape before v288 ({ v, at } for the whole map) are not a day each,
     and are left as they are, where mMergeRemote reads them. */
  function dyStamps(md) {
    var out = {};
    KEYED.forEach(function (p) {
      var m = md && md[p];
      if (!m || typeof m !== 'object' || typeof m.at === 'number') return;
      Object.keys(m).forEach(function (enc) {
        var r = m[enc];
        if (dyYear(enc) && r && typeof r.at === 'number') (out[p] = out[p] || {})[enc] = r.at;
      });
    });
    return out;
  }
  function dyHolds(map, p, enc, at) { return !!(map[p] && map[p][enc] >= at); }
  /* What the one record holds goes to its year: marked to come out of it,
     and sent from here where this phone has it newer than the years do (the
     merge has just given it the one record's copy, if that was newer still).
   *
     Only where this phone has something to say. A day the years cannot come
     to hold at the one record's stamp — one stamped in the future by a phone
     whose clock was wrong, which the merge takes in capped (dayup.js) — was
     marked again on every echo of every write, and sent, and its write
     echoed: a phone pushing the same day every second. Such a day stays in
     the one record, where it harms nothing, and its year has it too.
   *
     And not from this phone's own write coming back to it (`quiet`): that
     echo arrives before the server has said the year's copy landed, so
     every day it moved still looked owed, and went again. */
  function dyPurgeMark(quiet) {
    if (DY.on !== true) return [];
    var owed = [];
    Object.keys(DY.main).forEach(function (p) {
      Object.keys(DY.main[p]).forEach(function (enc) {
        (DY.purge[p] = DY.purge[p] || {})[enc] = 1;
        var k = String(enc).replace(/_/g, '-'), mine = (MSTAMPS[p] || {})[k] || 0;
        if (quiet || !(mine > ((DY.seenY[p] || {})[enc] || 0))) return;
        owed.push(k);
        if (LIVE.mDirty[p] === true) return;
        (LIVE.mDirty[p] = LIVE.mDirty[p] || {})[k] = 1;
      });
    });
    return owed;
  }
  /* The years, listened to beside the one record. Called with the record at
     sign-in, and with nothing at sign-out. */
  function mDaysAttach(doc, fv) {
    if (DY.off) { try { DY.off(); } catch (e) { /* already gone */ } }
    DY = { on: null, heard: false, off: null, fv: fv || null, seenY: {}, seenM: {}, main: {}, purge: {} };
    if (!doc || typeof doc.collection !== 'function') { DY.on = false; DY.heard = true; return; }
    try {
      DY.off = doc.collection('days').onSnapshot({ includeMetadataChanges: true }, function (qs) {
        var moved = false;
        qs.forEach(function (ds) {
          var md = (ds.data() || {}).myday;
          if (!md || typeof md !== 'object') return;
          var st = dyStamps(md);
          Object.keys(st).forEach(function (p) {
            Object.keys(st[p]).forEach(function (enc) {
              DY.seenY[p] = DY.seenY[p] || {};
              DY.seenY[p][enc] = Math.max(DY.seenY[p][enc] || 0, st[p][enc]);
            });
          });
          if (mMergeRemote(md)) moved = true;
        });
        var live = !(qs.metadata && qs.metadata.fromCache);
        if (live && !DY.heard) {
          DY.heard = true; DY.on = true;
          dyPurgeMark();
          mSyncPush(true);
        }
        if (moved && S.view === 'macros') renderMacros();
      }, function () {
        // refused: the rule is not published yet, so the one record it is
        DY.on = false; DY.heard = true; DY.off = null;
        mSyncPush(true);
      });
    } catch (e) {
      DY.on = false; DY.heard = true;
    }
  }
  /* Out of the one record: each day its year holds at least as new. */
  function dyPurge(d0) {
    var fv = DY.fv;
    if (DY.on !== true || !fv || typeof fv.delete !== 'function' || d0 !== LIVE.mSyncDoc) return null;
    var del = {}, done = [];
    Object.keys(DY.purge).forEach(function (p) {
      Object.keys(DY.purge[p]).forEach(function (enc) {
        var was = (DY.main[p] || {})[enc] || 0;
        if (!dyHolds(DY.seenY, p, enc, was)) return;
        (del[p] = del[p] || {})[enc] = fv.delete();
        done.push([p, enc]);
      });
    });
    if (!done.length) return null;
    return d0.set({ myday: del }, { merge: true }).then(function () {
      done.forEach(function (x) {
        delete DY.purge[x[0]][x[1]];
        if (DY.main[x[0]]) delete DY.main[x[0]][x[1]];
      });
    });
  }

  /* Signal back, or the app back in front of you: try again.
   *
     A signed-in phone opened with no signal asked once, failed, and then
     never asked again. mAuthKnown was true after that first answer, and
     every later mSyncStart — the Sync button, a sheet — read it as "we
     already know nobody is signed in". The household half of sync.js
     retried on 'online'; My Day and Strengthen did not, so nothing logged in
     the basement reached the account until the app was killed and reopened.
     Only the unreachable case retries; a device that got an answer has one. */
  function mSyncRetry() {
    if (mSyncAsking || !LIVE.mSyncUnreachable || !mSuspectAccount()) return;
    mSyncStart();
  }

  /* Hearing about sign-in and sign-out from the SDK, once it can be heard.
     Asked at boot, it gave up silently with no signal, and nothing asked
     again once there was one. */
  var mUserWatch = false;
  function mWatchUser() {
    if (mUserWatch || !window.Store.onUser) return;
    mUserWatch = true;
    Promise.resolve(window.Store.onUser(function () { mSyncStart(); })).then(function (ok) {
      if (ok === false) mUserWatch = false;
    });
  }

  function mSyncStart() {
    if (LIVE.mSyncOff) { LIVE.mSyncOff(); LIVE.mSyncOff = null; LIVE.mSyncDoc = null; }
    mDaysAttach(null);
    if (window.Train) window.Train.attach(null);
    if (!window.Store || !window.Store.configured) {
      LIVE.mAuthKnown = true;
      mSyncState('off');
      return;
    }
    if (!mAccount()) {
      /* Nobody is signed in as far as this page can see — but if the device
         remembers an account, the SDK may simply not have loaded yet, and
         saying "signed out" now would be a guess. Ask, then answer. And ask
         again after an attempt that could not reach anybody: that answer
         was "no signal", not "nobody". */
      if (mSuspectAccount() && (!LIVE.mAuthKnown || LIVE.mSyncUnreachable)) {
        if (mSyncAsking) return;
        mSyncAsking = true;
        window.Store.ready().then(function () {
          mSyncAsking = false;
          LIVE.mAuthKnown = true;
          /* The device's answer, corrected by the real one.
           *
             This flag decides whether Firebase loads at all, so it is written
             locally at sign-in and believed at boot. Believed is the problem:
             it was never checked again. Android clears site data on a PWA it
             considers idle, and the flag and the session do not have to go
             together — leaving a device that says "I have an account",
             loads the SDK, finds nobody, and quietly signs in anonymously
             underneath while showing the signed-out sheet. Which reads as a
             sign-in that did not take. Now the truth wins on every load. */
          mAccountMark();
          LIVE.mSyncUnreachable = false;                 // the server answered
          mWatchUser();
          if (mAccount()) mSyncStart();
          /* The device said it had an account and the server says otherwise.
             That is the drift this whole re-affirmation exists to catch, so
             it has to reach the gear and not just the sheet. */
          else mSyncState('off');
        }, function () {
          mSyncAsking = false;
          LIVE.mAuthKnown = true;
          LIVE.mSyncUnreachable = true;
          mSyncState('error');
        });
        return;
      }
      LIVE.mAuthKnown = true;
      /* Signed out, or unreachable and this device remembers an account.
         Only the second of those is worth a warning, and only that one keeps
         the error it already has. */
      mSyncState(LIVE.mSyncUnreachable && mSuspectAccount() ? 'error' : 'off');
      return;
    }
    mSyncState('connecting');
    window.Store.ready().then(function (db) {
      LIVE.mAuthKnown = true;
      LIVE.mSyncUnreachable = false;             // it answered
      mAccountMark();                       // the truth, again, now that it is knowable
      var uid = window.Store.uid();
      if (!uid || !mAccount()) {
        // the answer is known now even though it is "nobody"; say so
        mSyncState('off');
        return;
      }
      /* Carrying the day up into an account is for one case only: the
         anonymous identity this device has been using all along becoming a
         named one. If what is here belonged to somebody else, this device
         takes what the account has and offers it nothing. */
      var owner = mOwner();
      var mine = !owner || owner === uid;
      if (!mine) {
        mForgetDay();
        if (S.view === 'macros') renderMacros();
      }
      mSetOwner(uid);
      if (window.Store.enrol) window.Store.enrol();
      dinerWatch();
      mInviteTry();
      mSyncAttach(db.collection('users').doc(uid), window.firebase && window.firebase.firestore && window.firebase.firestore.FieldValue);
    }, function () { mSyncState('error'); });
  }

  /* Your record, listened to, with what hangs off it. Apart from mSyncStart
     so a test can hand it a record of its own (app.js, __macroLab.acct) and
     run exactly this. */
  function mSyncAttach(doc, fvx) {
    if (LIVE.mSyncOff) { LIVE.mSyncOff(); LIVE.mSyncOff = null; }
    LIVE.mSyncHeard = false;
    LIVE.mSyncDoc = doc;
    /* Train keeps its log in the same document, under `train`, and rides
       this listener rather than opening a second one on the same record. */
    /* Its workouts go a year to a record under this one (see attach in
       train.js), and moving them out of this record needs Firestore's
       delete marker, which only the loaded SDK has. */
    if (window.Train) window.Train.attach(doc, fvx);
    // the day log's years, beside it (DY, above)
    mDaysAttach(doc, fvx);
    /* includeMetadataChanges for the same reason as the household
       listener in sync.js: the step from a cache answer to a server answer
       changes no data, and without it that step is never heard. */
    LIVE.mSyncOff = doc.onSnapshot({ includeMetadataChanges: true }, mMainSnap, function () { mSyncState('error'); });
  }

  /* The one record, as the account sends it. */
  function mMainSnap(snap) {
    var data = snap.exists ? (snap.data() || {}) : null;
    /* Only when the server actually answered. A snapshot served from the
       local cache is Firestore handing back what this device already had,
       and calling that "Synced" told you the other phone had your day
       when nothing had left the building. The household half of this app
       has always checked; My Day never did, so the two sides of one
       screen gave different answers to the same question. */
    mSyncState(snap.metadata && snap.metadata.fromCache ? 'connecting' : 'on');
    var live = !(snap.metadata && snap.metadata.fromCache);
    if (live) mHouseReconcile(data || {});
    /* Strengthen's half moves Nourish too — the lifting days, and the
       workouts that make a day a training day — and nothing redrew for
       it: a session logged on the other phone left this one's day on its
       rest-day carbs until something else happened to draw. */
    mClockHear(data, snap.metadata && snap.metadata.hasPendingWrites);
    var trWas = mTrainSig();
    if (window.Train) window.Train.remote(data && data.train, live);
    var trMoved = mTrainSig() !== trWas;
    if (trMoved) mCreditWeek();
    /* What the one record still holds by day, and at what stamp: by year,
       it is on its way out to the years (dyPurgeMark); without them, it is
       what a whole push need not send again. */
    var mainSt = dyStamps(data && data.myday);
    DY.main = mainSt;
    DY.seenM = mainSt;
    if (!data || !data.myday) {
      if (live) { mBootTargets(); LIVE.mSyncHeard = true; mSyncPush(true); }
      if (trMoved && S.view === 'macros') renderMacros();
      return;
    }
    /* Targets from another of your devices move the dinner you share. */
    var capWas = JSON.stringify(pwFitCaps());
    if ((mMergeRemote(data.myday) || trMoved) && S.view === 'macros') renderMacros();
    if (JSON.stringify(pwFitCaps()) !== capWas) dinerKeep();
    if (live) mBootTargets();
    // after the merge, so the phone's stamps are the newest it knows of
    var owed = dyPurgeMark(!live || !!(snap.metadata && snap.metadata.hasPendingWrites));
    // the account's copy is in: now what is newer here can go up, all of it
    if (live && !LIVE.mSyncHeard) { LIVE.mSyncHeard = true; mSyncPush(true); }
    /* a day an older version of the app put in the one record mid-session,
       on its way to its year */
    else if (owed.length) mSyncPush();
    if (S.syncOpen) renderModal();
  }

  /* Everything of yours, gone from both ends.

     The remote record first, through the sync layer, and this device's copy
     inside it — mForgetDay wipes the local stores AND the module-level
     objects the payload is rebuilt from, which matters: clearing storage
     alone would leave the next push to write it all straight back up.

     The household is deliberately untouched, but for your name on its
     members list, which Store.deleteAccount takes off. It is a shared thing,
     the rules do not permit deleting it, and taking a spouse's meal plan
     away because you closed your own account would be a surprise nobody
     asked for. */
  function mDeleteAccount() {
    if (!window.Store || !window.Store.deleteAccount) return Promise.reject(new Error('no-account'));
    return window.Store.deleteAccount(function () {
      if (LIVE.mSyncOff) { LIVE.mSyncOff(); LIVE.mSyncOff = null; }
      LIVE.mSyncDoc = null;
      if (window.Train) window.Train.attach(null);
      mDaysAttach(null);
      mForgetDay();
      return null;
    }).then(function () {
      mSyncState('local');
      mAccountMark();
      if (S.view === 'macros') renderMacros();
      if (S.syncOpen) renderModal();
    });
  }

  function mSyncPush(now) {
    if (!LIVE.mSyncDoc) return;
    /* `now` is also "and whole". Its three callers are the moments a partial
       push cannot answer for: the first sight of the document, a document
       with nothing in it, and a device that has just been handed the day. */
    if (now) LIVE.mDirtyAll = true;
    // before the account has answered, changes wait, marked; its first answer sends them
    // (and its years, or their refusal: until then it is not known where a day goes)
    if (!LIVE.mSyncHeard || !DY.heard) return;
    clearTimeout(LIVE.mSyncTimer);
    LIVE.mSyncTimer = setTimeout(function () {
      // signed out or deleted in the meantime: nothing to send it to
      if (!LIVE.mSyncDoc) return;
      var d0 = LIVE.mSyncDoc;
      var body = mSyncTake(DY.on === true ? DY.seenY : DY.on === false ? DY.seenM : null);
      if (!body) {
        // nothing new, but the one record may still hold days their years now have
        Promise.resolve(dyPurge(d0)).then(function () { mSyncState('on'); }, function () { mSyncState('error'); });
        return;
      }
      /* By year: each day of each kept part to its year's record (DY). */
      var years = {};
      if (DY.on === true) {
        KEYED.forEach(function (p) {
          var m = body[p];
          if (!m || typeof m !== 'object') return;
          Object.keys(m).forEach(function (enc) {
            var y = dyYear(enc);
            if (!y) return;
            years[y] = years[y] || {};
            (years[y][p] = years[y][p] || {})[enc] = m[enc];
            delete m[enc];
          });
          if (!Object.keys(m).length) delete body[p];
        });
      }
      var writes = Object.keys(years).map(function (y) {
        return d0.collection('days').doc(y).set({ myday: years[y] }, { merge: true }).then(function () {
          Object.keys(years[y]).forEach(function (p) {
            Object.keys(years[y][p]).forEach(function (enc) {
              DY.seenY[p] = DY.seenY[p] || {};
              DY.seenY[p][enc] = Math.max(DY.seenY[p][enc] || 0, years[y][p][enc].at || 0);
            });
          });
        });
      });
      /* The one record only when there is something for it: a push that was
         all days, each gone to its year, has nothing to say to it, and an
         empty write ({ myday: {}, clk }) in Firestore set(merge:true) would
         treat the empty myday map as a leaf value and wipe myday on the one
         record. */
      if (Object.keys(body).length) {
        var out = { myday: body };
        /* And the server's own time, under this device's name, so mClockHear
           can tell how far out this device's clock is. Absent from an SDK that
           cannot give one, which only costs the correction. */
        var fv = window.firebase && window.firebase.firestore && window.firebase.firestore.FieldValue;
        if (fv && typeof fv.serverTimestamp === 'function') {
          out.clk = { by: MCLOCK_ID, at: fv.serverTimestamp() };
          LIVE.mClkSent = Date.now();
        }
        writes.push(d0.set(out, { merge: true }));
      }
      /* Landed in their years: now, and only now, out of the one record. */
      Promise.all(writes).then(function () { return dyPurge(d0); }).then(function () {
        mSyncState('on');
      }, function () {
        /* A write that never landed leaves this device unable to say what the
           far end is missing, so the next one says everything. */
        LIVE.mDirtyAll = true;
        mSyncState('error');
      });
    }, now ? 0 : 900);
  }

  return { mSyncRetry: mSyncRetry, mWatchUser: mWatchUser, mSyncStart: mSyncStart, mDeleteAccount: mDeleteAccount, mSyncPush: mSyncPush, mSyncAttach: mSyncAttach };
};
