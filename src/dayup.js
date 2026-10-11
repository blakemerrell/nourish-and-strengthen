/* What actually goes up, and what comes down: My Day's payload for the
 * account (mSyncPayload, and the partial one a first push after a gap
 * sends, mSyncPartial), the merge of what another device sent, part by part
 * and newest winning (mMergeRemote), and what is taken from the queue to
 * push (mSyncTake). Every part is described in src/mydayparts.js; this is
 * the reading and writing of them. The longer account is with the code.
 *
 * A part of app.js (Nourish) in a file of its own. app.js calls
 * HiveParts.dayup(app) once, as it starts, and keeps what it gives back under
 * the same names. What is dirty (mDirty, mDirtyAll) and whether the account
 * has been heard from (mSyncHeard) stay declared in app.js, which reads them
 * elsewhere; the part reaches those, and the stores declared below it,
 * through LIVE (tests/scope.test.js holds the lists to each other). Loaded
 * before app.js.
 */
(window.HiveParts = window.HiveParts || {}).dayup = function (app) {
  'use strict';

  // what it reads of the app's, and (LIVE) what the app replaces as it goes: MBATCHG, MNEVER, MWEIGHTS, mDirty, mDirtyAll
  var MCLOCK_SLACK = app.MCLOCK_SLACK;
  var MSTAMPS = app.MSTAMPS;
  var MSYNC_KEYED = app.MSYNC_KEYED;
  var MSYNC_SHAPE = app.MSYNC_SHAPE;
  var MSYNC_SIMPLE = app.MSYNC_SIMPLE;
  var mBuildFoods = app.mBuildFoods;
  var mLsJson = app.mLsJson;
  var mNow = app.mNow;
  var mNum = app.mNum;
  var mPut = app.mPut;
  var mSyncKey = app.mSyncKey;
  var mSyncUnkey = app.mSyncUnkey;
  var LIVE = app.LIVE;

  /* ------------------------------------------------- what actually goes up
   *
   * Everything, once, and then only what moved.
   *
   * Every change used to re-serialise and re-upload the whole of My Day:
   * fourteen days of meals, a year of mornings, every stamp — eight to twenty
   * kilobytes to record that one plate was ticked, which is two hundred bytes
   * of news. Firestore bills per document WRITE rather than per byte, and the
   * writes were already debounced to one per burst, so this never cost money.
   * It cost the phone: mobile data, radio time and battery, forty to a hundred
   * times over, on every tap.
   *
   * set(merge:true) deep-merges nested maps, so naming one day inside one part
   * leaves every other day in that part exactly where it was. No field paths,
   * no update() that fails on a document which does not exist yet.
   *
   * mStamp already knows precisely what changed — it is the function that
   * records it — so the dirty set costs nothing to keep.
   *
   * The FIRST push of a session is always whole, because the far end may be
   * missing things this device has and a partial push cannot say so. And a
   * failed push goes back to whole: the dirty set is cleared as the write
   * leaves, so that changes made while it is in flight are not swallowed, and
   * the only safe thing to do with a write that never landed is to send
   * everything next time. */

  /* Only what this device has actually stamped. An unstamped part or key
     can win nowhere, since a far end takes only what is newer than its own,
     but it could still be written over the account's real copy on the way
     past; and an empty map has nothing to say. */
  function mSyncPayload() {
    var raw = mLsJson;
    var out = {};
    MSYNC_SIMPLE.forEach(function (row) {
      if (!(MSTAMPS[row[0]] > 0)) return;
      out[row[0]] = { v: raw(row[1]), at: MSTAMPS[row[0]] };
    });
    MSYNC_KEYED.forEach(function (row) {
      var keys = {}, map = {};
      Object.keys(row.store()).forEach(function (k) { keys[k] = 1; });
      if (row.stamps) {
        Object.keys(MSTAMPS[row.part] || {}).forEach(function (k) { keys[k] = 1; });
      }
      Object.keys(keys).forEach(function (k) {
        var at = (MSTAMPS[row.part] || {})[k] || 0;
        if (at > 0) map[mSyncKey(k)] = { v: row.value(k), at: at };
      });
      if (Object.keys(map).length) out[row.part] = map;
    });
    return out;
  }

  /* Only what moved since the last push, in the same shape as the whole. Off
     the same table, so a part cannot be in one builder and not the other. */
  function mSyncPartial() {
    var out = {}, any = false;
    MSYNC_SIMPLE.forEach(function (row) {
      if (!LIVE.mDirty[row[0]] || !(MSTAMPS[row[0]] > 0)) return;
      out[row[0]] = { v: mLsJson(row[1]), at: MSTAMPS[row[0]] };
      any = true;
    });
    MSYNC_KEYED.forEach(function (row) {
      var marks = LIVE.mDirty[row.part];
      if (!marks) return;
      var keys = marks === true ? Object.keys(row.store()) : Object.keys(marks);
      var map = {};
      keys.forEach(function (k) {
        /* A cleared key still goes up, carrying whatever its part calls
           nothing — a zero weight, an empty skip list, a null send. That is
           the only way a DELETION crosses: an absent key is indistinguishable
           from a key the far end never heard of. */
        var at = (MSTAMPS[row.part] || {})[k] || 0;
        if (at > 0) map[mSyncKey(k)] = { v: row.value(k), at: at };
      });
      if (Object.keys(map).length) { out[row.part] = map; any = true; }
    });
    return any ? out : null;
  }

  /* What goes up, and the marking of it as gone — one act, because they have
     to happen together and a caller that could do one without the other is a
     caller that will.
   *
     The CHOICE lives here rather than inline in mSyncPush so a test can ask
     the real question. A guard that asked the partial BUILDER proved the
     builder works and nothing about whether anything calls it, which is
     exactly what a mutation found: every push was made whole again and the
     guard went on passing.
   *
     Cleared as the body is taken, not when the write lands, so a change made
     while it is in flight is dirty again rather than swallowed. */
  function mSyncTake() {
    var body = LIVE.mDirtyAll ? mSyncPayload() : mSyncPartial();
    LIVE.mDirtyAll = false;
    LIVE.mDirty = {};
    return body;
  }

  /* Newer wins, part by part. Returns true when anything here changed, so the
     caller knows whether to redraw. Pure enough to test without a network. */
  function mMergeRemote(md) {
    if (!md) return false;
    var moved = false;
    /* A stamp that says it was written in the future is a device whose clock
       is wrong, and believed as written it wins every merge until the real
       time catches up with it: a phone set a day fast pinned its day, and
       everything the other devices did for the next twenty-four hours was
       quietly refused. Nothing honest is more than a few minutes ahead of
       this device's corrected clock (see mNow), so nothing is let be. What is
       kept is the capped stamp, and the next whole push carries it back up,
       which takes the far end's future stamp down with it. */
    var cap = mNow() + MCLOCK_SLACK;
    var when = function (at) { return at > cap ? cap : at; };
    var take = function (part, key, apply) {
      var r = md[part];
      if (!r || !r.v || !mNum(r.at) || !(when(r.at) > (MSTAMPS[part] || 0))) return;
      if (MSYNC_SHAPE[part] && !MSYNC_SHAPE[part](r.v)) return;
      /* Stamped only once it is really kept. A value that could not be
         written (storage full) under a stamp that was would tell the next
         load it already has what the account is holding for it — and the
         account's copy would be refused from then on as no newer. */
      if (apply(r.v) === false) return;
      MSTAMPS[part] = when(r.at);
      moved = true;
    };
    take('mf', 'bsc.myFoods', function (v) {
      if (!mPut('bsc.myFoods', v)) return false;
      /* The foods on screen are built from storage once, at boot and on a
         household change. Foods arriving from your other device were written
         to storage and never built, so a day holding one of them counted it
         as nothing — mTotals skips an id it cannot find — and the intake log
         recorded the undercount. */
      mBuildFoods();
    });
    take('t', 'bsc.macroTargets', function (v) {
      return mPut('bsc.macroTargets', v);
    });
    take('pr', 'bsc.macroProfile', function (v) {
      return mPut('bsc.macroProfile', v);
    });
    take('sl', 'bsc.macroSlots', function (v) {
      return mPut('bsc.macroSlots', v);
    });
    take('bg', 'bsc.macroBatchG', function (v) {
      Object.keys(LIVE.MBATCHG).forEach(function (k) { delete LIVE.MBATCHG[k]; });
      Object.keys(v).forEach(function (k) {
        if (v[k] && v[k].s > 0) LIVE.MBATCHG[k] = { s: Number(v[k].s), on: String(v[k].on || '') };
      });
      return mPut('bsc.macroBatchG', LIVE.MBATCHG);
    });
    take('nv', 'bsc.macroNever', function (v) {
      Object.keys(LIVE.MNEVER).forEach(function (k) { delete LIVE.MNEVER[k]; });
      Object.keys(v).forEach(function (k) { LIVE.MNEVER[k] = v[k]; });
      return mPut('bsc.macroNever', v);
    });
    /* Per morning, newest wins, and zero is a real answer — the same three
       rules the closed-day log runs on, and for the same reason. A morning
       cleared on one phone used to come straight back from the other's next
       push: the map was unioned in wholesale and nothing in it could say a
       morning had been taken away. Since v271 that also quietly moved the
       targets, because the plan is built on the seven-day average.
     *
       The old single-stamped shape is still read, because a phone that has
       not been opened since v288 is still pushing it. Unioned, exactly as it
       used to be: those payloads genuinely cannot express a deletion, and
       guessing one from an absent key would delete every morning that phone
       has not heard of yet. Handled apart from the table because it is not a
       shape the table describes — it is the shape that came before it. */
    var wRemote = md.w;
    var legacyW = wRemote && wRemote.v && typeof wRemote.at === 'number';
    if (legacyW) {
      MSTAMPS.w = MSTAMPS.w || {};
      Object.keys(wRemote.v).forEach(function (k) {
        if (!(when(wRemote.at) > (MSTAMPS.w[k] || 0))) return;
        /* Checked like every other morning: a number, and a real weight.
           This path let anything in — a string, a zero — and a zero here is
           not a cleared morning (that shape cannot say so) but a weigh-in of
           nothing, which the trend then averaged in. */
        var v = wRemote.v[k];
        if (!mNum(v) || !(v > 0)) return;
        LIVE.MWEIGHTS[k] = v;
        MSTAMPS.w[k] = when(wRemote.at);
        moved = true;
      });
    }

    /* And every keyed part, by the one description of it. Newer wins, per
       key, and what "newer" and "sayable" mean is the part's own business —
       see MSYNC_KEYED. This was five hand-written blocks that differed only
       in which guard they used and which map they wrote, and the one thing
       they had in common, remembering to persist afterwards, is the thing one
       of them did not do. */
    MSYNC_KEYED.forEach(function (row) {
      if (row.part === 'w' && legacyW) return;
      var from = md[row.part] || {};
      Object.keys(from).forEach(function (enc) {
        var k = mSyncUnkey(enc), r = from[enc];
        if (!r || !mNum(r.at) || !row.accept(r)) return;
        if (row.keep && !row.keep(k)) return;      // aged out here; it stays out
        var localStamp = (MSTAMPS[row.part] || {})[k] || 0;
        if (!(when(r.at) > localStamp)) {
          if (localStamp > 0 && row.merge && row.merge(k, r.v)) {
            MSTAMPS[row.part] = MSTAMPS[row.part] || {};
            MSTAMPS[row.part][k] = Math.max(localStamp, when(r.at));
            moved = true;
          }
          return;
        }
        row.put(k, r.v, localStamp);
        MSTAMPS[row.part] = MSTAMPS[row.part] || {};
        MSTAMPS[row.part][k] = when(r.at);
        moved = true;
      });
    });
    /* Persisted off the same table that merged them. This was a hand-written
       list of five setItem calls beside a merge that touched six stores, and
       the missing one was `bsc.macroTrained`: a training tick from the other
       phone moved the day's carbohydrate and then went back on the next
       reload, 118 g to 63 with nothing said. A list that is data cannot
       forget a member. */
    /* The stamps only once every store has landed: a stamp kept for a day
       that was not would tell the next load it already has what the account
       is still holding for it. */
    if (moved && MSYNC_KEYED.every(function (row) { return mPut(row.ls, row.store()); })) {
      mPut('bsc.myStamps', MSTAMPS);
    }
    return moved;
  }

  return { mSyncPayload: mSyncPayload, mSyncPartial: mSyncPartial, mSyncTake: mSyncTake, mMergeRemote: mMergeRemote };
};
