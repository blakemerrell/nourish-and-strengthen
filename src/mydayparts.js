/* My Day's parts: every part of My Day that travels between your devices,
 * described once as data (MSYNC_SHAPE, MSYNC_SIMPLE, MSYNC_KEYED), with the
 * key encoding both ways (mSyncKey, mSyncUnkey) and the small readers the
 * payload and the merge share (mPlainObj, mNum, mLsJson). The long account
 * of why it is data is with it below.
 *
 * A part of app.js (Nourish) in a file of its own. app.js calls
 * HiveParts.mydayparts(app) once, as it starts, handing over the stores and
 * readers it describes (named below; tests/scope.test.js holds the lists to
 * each other), and keeps what it gives back under the same names, the three
 * tables included. Loaded before app.js.
 */
(window.HiveParts = window.HiveParts || {}).mydayparts = function (app) {
  'use strict';

  // what it reads of the app's, and (LIVE) what the app replaces as it goes: MDAYS, MDONE, MSEND, MSKIP, MTRAINED, MWEIGHTS
  var mDoneAt = app.mDoneAt;
  var mEarliestKey = app.mEarliestKey;
  var mTrainedAt = app.mTrainedAt;
  var mWeightFloor = app.mWeightFloor;
  var LIVE = app.LIVE;

  /* ---------------------------------------------------------------- the parts
   *
   * Every part of My Day that travels, described once.
   *
   * It used to be described four times: once in the payload builder, once in
   * the merge, once in the list of stores to persist, and once more in
   * whichever writer stamped it. Five near-identical blocks on each side, the
   * same key-encoding written out six times in each direction, and 210 lines
   * between them. Adding anything that syncs meant writing that block a
   * seventh time in two places and hoping the two matched.
   *
   * They did not. `tn` — "trained today" — was merged and then left out of the
   * list of stores to persist, so a tick arriving from the other phone moved
   * the day's carbohydrate and then vanished on the next reload: 118 g back to
   * 63 with nothing said. A list that is DATA cannot forget a member; a list
   * that is four hand-written blocks can, and did.
   *
   *   value(k)  what this device says about that key — or, handed a map as
   *             read from storage, what that map says about it
   *   stamps    whether the payload also speaks for keys it has a STAMP for
   *             but no value. That is how a DELETION crosses: an absent key is
   *             indistinguishable from a key never heard of, so a part that
   *             can be deleted has to keep speaking about it. `d` does not
   *             need to: nothing in the interface deletes a day. Emptying one
   *             leaves the day in place, empty, and that travels; the only
   *             deletion is the fourteen-day window, which every device
   *             applies to itself.
   *   accept(r) whether a remote entry is sayable at all
   *   put(k,v)  how a remote value lands
   *   keep(k)   whether a key is inside the window this part is kept for.
   *             Outside it, nothing from another device is taken — see
   *             mPruneWindow for why that is what lets the stamps be pruned
   *   ls        where it is kept, so the persist step cannot miss one
   *
   * The stores are reached through a function because several of them are
   * assigned by IIFEs further down the file, and a table that captured them
   * at definition time would capture undefined. */
  function mSyncKey(k) { return String(k).replace(/-/g, '_'); }

  /* What a value from another device has to look like before it is let in.
     The merge used to check only that something was there, so a string where
     a list belongs landed in storage and broke the next render — on every
     device, until somebody cleared it. Found when a test fixture put a string
     in `sn.to`. A value of the wrong shape is ignored, as if it never came:
     the next push from a device that has it right corrects the record. */
  function mPlainObj(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }
  function mNum(v) { return typeof v === 'number' && isFinite(v); }
  function mStrList(v) {
    return Array.isArray(v) && v.every(function (x) { return typeof x === 'string'; });
  }
  var MSYNC_SHAPE = {
    mf: mPlainObj,
    nv: mPlainObj,
    bg: mPlainObj,
    t: function (v) { return mPlainObj(v) && mNum(v.p) && mNum(v.f) && mNum(v.c); },
    pr: mPlainObj,
    sl: function (v) { return mPlainObj(v) && Array.isArray(v.list); }
  };
  function mSyncUnkey(e) { return String(e).replace(/_/g, '-'); }

  var MSYNC_SIMPLE = [
    ['mf', 'bsc.myFoods'], ['t', 'bsc.macroTargets'], ['nv', 'bsc.macroNever'], ['bg', 'bsc.macroBatchG'],
    ['pr', 'bsc.macroProfile'], ['sl', 'bsc.macroSlots']
  ];

  var MSYNC_KEYED = [
    { part: 'w', ls: 'bsc.macroWeights', stamps: true,
      store: function () { return LIVE.MWEIGHTS; },
      keep: function (k) { return k >= mWeightFloor(); },
      value: function (k, m) { return (m || LIVE.MWEIGHTS)[k] || 0; },
      /* Zero is a real answer: it is the morning you cleared. */
      accept: function (r) { return mNum(r.v) && r.v >= 0; },
      put: function (k, v) { if (v > 0) LIVE.MWEIGHTS[k] = v; else delete LIVE.MWEIGHTS[k]; } },

    { part: 'd', ls: 'bsc.macroDays', stamps: false,
      store: function () { return LIVE.MDAYS; },
      keep: function (k) { return k >= mEarliestKey(); },
      value: function (k, m) { return (m || LIVE.MDAYS)[k]; },
      /* A day is meals keyed by slot, each a list of plates. */
      accept: function (r) {
        return mPlainObj(r.v) && Object.keys(r.v).every(function (sk) {
          var m = r.v[sk];
          return m === null || m === undefined || (Array.isArray(m) && m.every(mPlainObj));
        });
      },
      merge: function (k, v) {
        var cur = LIVE.MDAYS[k], changed = false;
        if (!cur || typeof cur !== 'object') {
          LIVE.MDAYS[k] = v;
          return true;
        }
        Object.keys(v || {}).forEach(function (sk) {
          var remotePlates = v[sk];
          var localPlates = cur[sk];
          if (Array.isArray(remotePlates) && remotePlates.length > 0) {
            if (!localPlates || !localPlates.length) {
              cur[sk] = remotePlates.slice();
              changed = true;
            }
          }
        });
        return changed;
      },
      put: function (k, v, localStamp) {
        var cur = LIVE.MDAYS[k];
        if (!cur || typeof cur !== 'object' || !localStamp) {
          LIVE.MDAYS[k] = v;
          return;
        }
        var next = Object.assign({}, cur);
        Object.keys(v || {}).forEach(function (sk) {
          var remotePlates = v[sk];
          var localPlates = cur[sk];
          if (Array.isArray(remotePlates) && remotePlates.length > 0) {
            next[sk] = remotePlates;
          } else if (!localPlates || !localPlates.length) {
            next[sk] = remotePlates;
          }
        });
        LIVE.MDAYS[k] = next;
      } },

    { part: 'dn', ls: 'bsc.macroDone', stamps: false,
      store: function () { return LIVE.MDONE; },
      keep: function (k) { return k >= mEarliestKey(); },
      value: function (k, m) { return m ? Number(m[k]) || 0 : mDoneAt(k); },
      /* Zero means "I reopened this", so a falsy value must still land. */
      accept: function (r) { return mNum(r.v); },
      put: function (k, v) { LIVE.MDONE[k] = Number(v) || 0; } },

    { part: 'tn', ls: 'bsc.macroTrained', stamps: false,
      store: function () { return LIVE.MTRAINED; },
      keep: function (k) { return k >= mEarliestKey(); },
      value: function (k, m) { return m ? Number(m[k]) || 0 : mTrainedAt(k); },
      /* And zero here means "I un-ticked it". */
      accept: function (r) { return mNum(r.v); },
      put: function (k, v) { LIVE.MTRAINED[k] = Number(v) || 0; } },

    { part: 'sp', ls: 'bsc.macroSkip', stamps: true,
      store: function () { return LIVE.MSKIP; },
      keep: function (k) { return k >= mEarliestKey(); },
      value: function (k, m) { return (m || LIVE.MSKIP)[k] || []; },
      /* An empty list is a real answer: it means "I un-skipped them all". */
      accept: function (r) { return mStrList(r.v); },
      put: function (k, v) { if (v.length) LIVE.MSKIP[k] = v.slice(); else delete LIVE.MSKIP[k]; } },

    { part: 'sn', ls: 'bsc.macroSend', stamps: true,
      store: function () { return LIVE.MSEND; },
      keep: function (k) { return k >= mEarliestKey(); },
      value: function (k, m) { return (m || LIVE.MSEND)[k] || null; },
      /* Null is a real answer: it means "I cleared that day's choice". */
      accept: function (r) {
        var v = r.v;
        if (v === null || v === undefined) return true;
        return mPlainObj(v) && (v.to === undefined || mStrList(v.to)) &&
          (v.f === undefined || typeof v.f === 'string');
      },
      put: function (k, v) {
        if (v && typeof v === 'object' && !Array.isArray(v)) LIVE.MSEND[k] = v;
        else delete LIVE.MSEND[k];
      } }
  ];

  function mLsJson(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; }
  }

  return { mSyncKey: mSyncKey, mPlainObj: mPlainObj, mNum: mNum, mSyncUnkey: mSyncUnkey, mLsJson: mLsJson, MSYNC_SHAPE: MSYNC_SHAPE, MSYNC_SIMPLE: MSYNC_SIMPLE, MSYNC_KEYED: MSYNC_KEYED };
};
