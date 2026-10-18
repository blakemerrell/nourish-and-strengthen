/* What you have said about a day, each its own small store kept for the
 * day log's window (mPruneWindow): finished (MDONE, mDoneAt, mSetDone),
 * trained, as it happened, and the one row and word Today says about it
 * (MTRAINED, mTrainedAt, mTrainedSaid, mSetTrained, mTrainRow, mTrainWord,
 * mStrengthOn), meals you are not eating (MSKIP, mSkipped, mSetSkip), a
 * morning card sent away (MHUSH, mHushed, mSetHush), and where a meal's
 * miss went (MSEND, mSendOf, mSetSend). The longer account is with the
 * code.
 *
 * A part of app.js (Nourish) in a file of its own. app.js calls
 * HiveParts.dayflags(app) once, as it starts, and keeps what it gives back
 * under the same names; the stores are never replaced, only written into,
 * so app.js declares them again from the part and LIVE reads them there.
 * Loaded before app.js.
 */
(window.HiveParts = window.HiveParts || {}).dayflags = function (app) {
  'use strict';

  // what it reads of the app's
  var MSTAMPS = app.MSTAMPS;
  var M_WDAY = app.M_WDAY;
  var keyDate = app.keyDate;
  var mDayTargets = app.mDayTargets;
  var mFoldDue = app.mFoldDue;
  var mIsTrainingDay = app.mIsTrainingDay;
  var mPut = app.mPut;
  var mReadProfileRaw = app.mReadProfileRaw;
  var mReadTargets = app.mReadTargets;
  var mStamp = app.mStamp;
  var mSynced = app.mSynced;
  var mTrainDays = app.mTrainDays;
  var mWkIx = app.mWkIx;
  var todayKey = app.todayKey;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* Which days you have said you are finished with.
   *
     Keyed day -> the moment you closed it, so the card can say when and a
     zero can mean "reopened" rather than "never closed" — which is what lets
     a reopen travel between devices instead of being silently re-closed by
     whichever one still remembers the original. */
  var MDONE = (function () {
    try {
      var d = JSON.parse(localStorage.getItem('bsc.macroDone'));
      if (d && typeof d === 'object' && !Array.isArray(d)) return d;
    } catch (e) { /* fall through */ }
    return {};
  })();
  function mDoneAt(k) { return Number(MDONE[k]) || 0; }
  /* Both day-keyed flag maps fall out of the same window the day log lives in
     — see mEditDay — and on the same schedule, when something is written.
   *
     That window is the right one because it is the only one anything ever
     reads. A closed-day flag is asked for exactly once, about mViewKey(), and
     a skip likewise; mRenderDay clamps that key into [mEarliestKey(),
     mLatestKey()] before it draws and mNavDay refuses to leave it. The week
     strip's filled dot is not this map at all — it is mDayDone() off the
     plates — and the review card's seven days behind read mDay(). So nothing
     on screen can want a flag from outside the window, and a flag kept past it
     is an orphan: a note that Tuesday was closed, for a Tuesday whose plates
     were pruned a fortnight ago, riding in the sync payload forever. Only
     behind: the day log keeps days past a week ahead now (a clock set back
     makes the real ones look like that — see mEditDay), and their flags stay
     with them.

     The stamps can go with them, and do (mSetSkip, mSetSend, mWriteWeight),
     because the merge refuses anything outside a part's window (`keep` in
     MSYNC_KEYED). That refusal is what has to hold, not the stamp. The
     remote document keeps every key it was ever sent — the push is a merge
     write — so before the refusal, a pruned stamp made the copy still sitting
     in Firestore look new on the next read and the pruned flag walked
     straight back in: an extra merge, save and redraw on every write, and a
     window that never held on a device with an account. Keeping the stamps
     instead would have held it, at the price of a payload announcing empty
     days forever. */
  /* Nothing ages out since 2026-10-18: everything is kept (app.js,
     mEarliestKey). Kept as the one place the flags would be trimmed, should
     a day ever need to be let go of again. */
  function mPruneWindow() {}
  /* Mornings you trained, as they happened.
   *
     The profile already carries how many sessions a week, and mBurn spreads
     those calories across all seven days — rest days included. So a tick here
     buys NO calories: it would be the same session paid for twice, which is
     the fault this whole audit has been pulling out of the app all day. What
     it buys is WHERE the carbohydrate lands. Carb cycling picks its training
     days from an evenly-spread pattern, so somebody who says three and lifts
     Tuesday, Thursday and Saturday gets the high-carb days on Monday,
     Wednesday and Friday — every week, silently.
   *
     Day -> 1, and zero is a real answer meaning "I ticked this and then
     un-ticked it", the same bargain the closed-day log strikes. */
  var MTRAINED = (function () {
    try {
      var t = JSON.parse(localStorage.getItem('bsc.macroTrained'));
      if (t && typeof t === 'object' && !Array.isArray(t)) return t;
    } catch (e) { /* fall through */ }
    return {};
  })();
  function mTrainedAt(k) { return Number(MTRAINED[k]) || 0; }
  function mTrainedSaid(k) { return MTRAINED[k] !== undefined; }
  /* Today's training, in one row: what's planned, done, or a rest day, and
     the one tap that changes it. Blake: "the plan might be planned but I
     also might ad hoc go to the gym, or skip a day sometimes." */
  function mTrainRow(k) {
    var hard = mIsTrainingDay(k), dt = mDayTargets(k), base = mReadTargets();
    var carbs = dt.c + ' g carbs';
    /* Not synced: the checkbox, as it was, and what the tick did in one
       line under it. */
    if (!mSynced()) {
      return '<div class="mw-train no-print">' +
        '<button class="mw-tick" data-mtrained="' + esc(k) + '" aria-pressed="' + hard + '">' +
          '<span class="mw-tick-l">Trained today' +
            (base.c && dt.c !== base.c ? '<span class="mw-tick-s">' + dt.c + ' g carbs today · ' + base.c +
              ' on an average day</span>' : '') + '</span>' +
          '<span class="mw-tick-b" aria-hidden="true"></span></button></div>';
    }
    /* Synced: what Strengthen says, and nothing to press. "Training", not
       "lifting" — the session is whatever the block says it is. */
    var done = hard ? mSessionsOn(k) : [];
    var hm = function (ts) {
      var d = new Date(ts), h = d.getHours(), m = d.getMinutes();
      return (h % 12 || 12) + ':' + (m < 10 ? '0' : '') + m + (h < 12 ? ' am' : ' pm');
    };
    var nm = '';
    try { nm = window.Train && window.Train.nextName ? window.Train.nextName() : ''; } catch (e) { nm = ''; }
    var ic, t1, t2;
    if (done.length) {
      var w0 = done[0], mins = w0.en > w0.st ? Math.round((w0.en - w0.st) / 60000) : 0;
      ic = '<span class="mw-tr-ic is-done" aria-hidden="true">✓</span>';
      t1 = esc(done.map(function (w) { return w.n; }).join(', ')) + ' · done ' + hm(w0.st);
      t2 = carbs + ' · ' + w0.sets + (w0.sets === 1 ? ' set' : ' sets') + (mins ? ', ' + mins + ' min' : '');
    } else if (hard) {
      ic = '<span class="mw-tr-ic is-lift" aria-hidden="true"><svg width="11" height="10" viewBox="0 0 11 10"><path d="M5.5 0L11 10H0z" fill="currentColor"/></svg></span>';
      t1 = k === todayKey() ? (nm ? esc(nm) + ' today' : 'Training day') : 'Training day';
      t2 = carbs + (base.c && base.c !== dt.c ? ' · ' + base.c + ' on an average day' : '');
    } else {
      /* Where the next session lands: the next of your days after this one. */
      var days = mTrainDays(), ix0 = mWkIx(keyDate(k)), nxt = '', gap = 0;
      for (var n = 1; n <= 7 && !nxt; n++) if (days.indexOf((ix0 + n) % 7) >= 0) { nxt = M_WDAY[(ix0 + n) % 7]; gap = n; }
      ic = '<span class="mw-tr-ic is-rest" aria-hidden="true">–</span>';
      t1 = 'Rest day';
      t2 = carbs + (nxt && k === todayKey() ? ' · ' + (nm ? esc(nm) : 'next session') + ' ' + (gap === 1 ? 'tomorrow' : nxt) : '');
    }
    return '<div class="mw-train no-print">' + ic +
      '<span class="mw-tr-t"><span class="mw-tr-1">' + t1 + '</span><span class="mw-tr-2">' + t2 + '</span></span></div>';
  }
  /* The folded card's word on training, which said "trained" the moment a
     lifting day began — before anybody had been near a bar. Blake: "'Lifting
     day · 96 g carbs' before training, 'Trained ✓ 5:40 pm' after; 'Rest day'
     label." Before is a plan and says what the plan gives you; after is a
     fact and says when. The time is the one Strengthen logged; a tick given
     here by hand has none to give. Nothing at all when there is no week to
     cycle — no lifting days picked, or all seven — unless a session was
     logged anyway, because then it did happen. */
  function mTrainWord(k) {
    var raw = mReadProfileRaw();
    var sess = raw.syncTrain === false ? [] : mSessionsOn(k);
    /* The same order of say-so mIsTrainingDay keeps: synced, Strengthen's log
       is the whole answer; not synced, a tick given here outranks it. */
    var did = mSynced() || !mTrainedSaid(k) ? sess.length > 0 : mTrainedAt(k) > 0;
    if (did) {
      var at = '';
      if (sess.length && sess[0].st) {
        var d = new Date(sess[0].st), h = d.getHours(), m = d.getMinutes();
        at = ' ' + (h % 12 || 12) + ':' + (m < 10 ? '0' : '') + m + (h < 12 ? ' am' : ' pm');
      }
      return 'Trained &#10003;' + at;
    }
    var n = mTrainDays().length;
    if (!n || n >= 7) return '';
    if (mIsTrainingDay(k)) return 'Lifting day &middot; ' + mDayTargets(k).c + ' g carbs';
    return 'Rest day';
  }
  function mSessionsOn(k) {
    try { return window.Train && window.Train.sessionsOn ? window.Train.sessionsOn(k) || [] : []; } catch (e) { return []; }
  }
  function mStrengthOn(k) {
    try { return window.Train && window.Train.trainedOn ? window.Train.trainedOn(k) || [] : []; } catch (e) { return []; }
  }
  function mSetTrained(k, on) {
    mFoldDue();
    MTRAINED[k] = on ? 1 : 0;
    mPruneWindow(MTRAINED);
    mPut('bsc.macroTrained', MTRAINED);
    mStamp('tn', k);
  }

  function mSetDone(k, on) {
    mFoldDue();
    MDONE[k] = on ? Date.now() : 0;
    mPruneWindow(MDONE);
    mPut('bsc.macroDone', MDONE);
    mStamp('dn', k);
  }

  /* Meals you have said you are not eating today.
   *
     Keyed day -> the slot keys skipped, with a stamp beside them so a skip
     travels the way a closed day does. Not a scalar on the day object: the
     day is a map of slot -> plates and half the app walks it with
     `(day[k] || []).forEach`, so a stray number in there is a thrown error
     three files away.

     It has to reach the arithmetic and not only the card. An empty meal still
     RESERVES its share — mShares divides the day across every empty slot — so
     a lunch you have decided against goes on holding a quarter of the day and
     quietly aims every other meal lower. Skipping releases it. */
  var MSKIP = (function () {
    try {
      var d = JSON.parse(localStorage.getItem('bsc.macroSkip'));
      if (d && typeof d === 'object' && !Array.isArray(d)) return d;
    } catch (e) { /* fall through */ }
    return {};
  })();
  function mSkipped(k, sk) {
    var a = MSKIP[k];
    return !!a && a.indexOf(sk) >= 0;
  }

  /* A morning card that was sent away, and the advice it was sent away over.

     "Leave it" used to add a class that set display:none and nothing else.
     The class was written nowhere and read nowhere, so it lasted exactly as
     long as the element did — and every check, portion nudge, weigh-in and
     arriving sync rebuilds this region. The card came back within a tap or
     two, every time, which reads as the app not listening.

     Stored against the advice and not just the day, because the two are
     different statements. Sending away "eat 1,903" is a decision about 1,903;
     if tomorrow's weigh-in makes it 2,050, or the day flips from behind to
     ahead, that is news and has not been refused yet. Same day, same number,
     stays gone.

     Local, not synced. It is what one person did to one card on one phone,
     and it has no business travelling. */
  var MHUSH = (function () {
    try {
      var h = JSON.parse(localStorage.getItem('bsc.macroHush'));
      if (h && typeof h === 'object' && !Array.isArray(h)) return h;
    } catch (e) { /* fall through */ }
    return {};
  })();
  function mHushed(k, sig) { return MHUSH[k] === sig; }
  function mSetHush(k, sig) {
    MHUSH[k] = sig;
    mPruneWindow(MHUSH);        // the day log's window, like the skips
    mPut('bsc.macroHush', MHUSH);
  }
  function mSetSkip(k, sk, on) {
    mFoldDue();
    var a = (MSKIP[k] || []).filter(function (x) { return x !== sk; });
    if (on) a.push(sk);
    if (a.length) MSKIP[k] = a; else delete MSKIP[k];
    mPruneWindow(MSKIP);       // the day log's window, for the reason above it
    /* The stamps go through the same window as the skips they stamp. The
       payload is built from these now, so a stamp left behind for a day that
       has fallen out of the fortnight would go on announcing an empty skip
       list for that day forever. */
    if (MSTAMPS.sp) mPruneWindow(MSTAMPS.sp);
    mPut('bsc.macroSkip', MSKIP);
    mStamp('sp', k);
  }

  /* Where a meal's miss went, and which meal's miss it was.
   *
     A meal that comes in light or heavy changes what every meal after it is
     asked for — that has always happened, on every render, silently. This is
     the record of what you did about it: nothing (the slack shares out across
     the meals left, by size), or one meal at a time (`to`, in the order you
     tapped them), or nothing at all (`off`, every meal keeps its plan and the
     day is allowed to end where it fell).

     Beside the day and never on it. Twelve places walk a day with
     `Object.keys(day).forEach(function (sk) { (day[sk] || []).forEach(...) })`
     and a string sitting among the plate lists throws in mTotals on the very
     next render. MSKIP solved the same problem the same way and this follows
     it exactly, down to the pruning window and the stamp.

     `f` is the meal whose miss this is about. It is what lets the line clear
     itself: once a LATER meal is finished the question has moved on, and four
     buttons parked under breakfast at nine at night are just clutter. */
  var MSEND = (function () {
    try {
      var d = JSON.parse(localStorage.getItem('bsc.macroSend'));
      if (d && typeof d === 'object' && !Array.isArray(d)) return d;
    } catch (e) { /* fall through */ }
    return {};
  })();
  function mSendOf(k) {
    var v = MSEND[k];
    if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
    /* `ack` rides back out as well as in. It did not, for one commit, and
       the symptom was the whole point of the flag: Done wrote ack to
       storage, the next read dropped it on the floor, and the card opened
       again — a dismissal that does not survive the read is the pace card's
       bug wearing a different name. */
    return { f: v.f || '', to: (v.to || []).slice(), off: !!v.off, ack: !!v.ack };
  }
  function mSetSend(k, v) {
    mFoldDue();
    /* `f` — which meal the question is about — is what keeps the row, and it
       is set for every card there is, so an answer of any kind survives:
       a set of meals, a None, or a fold. `|| v.ack` was here for a commit
       and could not be made to fail, because there is no path that acks a
       card without naming the meal it is about. A clause no mutation can
       reach is not a safeguard, it is a comment claiming credit for one. */
    if (v && (v.f || (v.to && v.to.length) || v.off)) MSEND[k] = v;
    else delete MSEND[k];
    mPruneWindow(MSEND);
    if (MSTAMPS.sn) mPruneWindow(MSTAMPS.sn);
    mPut('bsc.macroSend', MSEND);
    mStamp('sn', k);
  }

  return { mDoneAt: mDoneAt, mTrainedAt: mTrainedAt, mTrainedSaid: mTrainedSaid, mTrainRow: mTrainRow, mTrainWord: mTrainWord, mStrengthOn: mStrengthOn, mSetTrained: mSetTrained, mSetDone: mSetDone, mSkipped: mSkipped, mHushed: mHushed, mSetHush: mSetHush, mSetSkip: mSetSkip, mSendOf: mSendOf, mSetSend: mSetSend, MDONE: MDONE, MTRAINED: MTRAINED, MSKIP: MSKIP, MHUSH: MHUSH, MSEND: MSEND };
};
