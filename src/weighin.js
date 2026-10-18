/* The weigh-in's store: the mornings you weighed, kept for a year and a
 * bit for the trend (MWEIGHTS), written and stamped
 * (mWriteWeight); the unit the box asks in, Strengthen's (mWUnit, mWShow,
 * MKG_LB); and the weigh-in on Today, filled in beside the weight box's own
 * rules (WGAPI). The longer account is with the code.
 *
 * A part of app.js (Nourish) in a file of its own. app.js calls
 * HiveParts.weighin(app) once, as it starts, and keeps what it gives back
 * under the same names. Loaded before app.js.
 */
(window.HiveParts = window.HiveParts || {}).weighin = function (app) {
  'use strict';

  // what it reads of the app's
  var MSTAMPS = app.MSTAMPS;
  var mFoldDue = app.mFoldDue;
  var mPut = app.mPut;
  var mStamp = app.mStamp;

  /* The weigh-in on Today: its open and close live beside the weight box's
     own rules (mWeightOf), filled in there. */
  var WGAPI = {};
  /* The scale, once a day if you feel like it. Weights keep their own store
     with their own horizon: a day of meals is stale in two weeks, but a weight
     trend is the whole point of writing the number down, so these live for a
     year. Same privacy bargain as the rest of the tab — this phone only. */
  var MWEIGHTS = (function () {
    try {
      var w = JSON.parse(localStorage.getItem('bsc.macroWeights'));
      if (w && typeof w === 'object' && !Array.isArray(w)) return w;
    } catch (e) { /* fall through */ }
    return {};
  })();

  /* The unit the weigh-in box asks in: Strengthen's. With its weights in
     kilograms the box still said "lb", and 86 — a kilogram reading — was
     stored as 86 lb without a question, and next week's plan would have
     been built for a body of 86 lb. Storage stays in pounds, because every
     figure downstream reads MWEIGHTS as pounds; the box and its folded line
     are what speak kilograms. The charts and the coaching lines still say
     pounds. */
  var MKG_LB = 2.20462;
  function mWUnit() { return window.Train && window.Train.unit && window.Train.unit() === 'kg' ? 'kg' : 'lb'; }
  // a stored morning, said in the box's unit, to the tenth the box takes
  function mWShow(lb) { return Math.round((mWUnit() === 'kg' ? lb / MKG_LB : lb) * 10) / 10; }

  function mWriteWeight(k, lb) {
    mFoldDue();
    if (lb) MWEIGHTS[k] = Math.round(lb * 10) / 10;
    else delete MWEIGHTS[k];              // clearing the box un-logs the day
    /* Every morning is kept, however old, and its stamp with it (2026-10-18;
       both were pruned to a year and a bit). */
    mPut('bsc.macroWeights', MWEIGHTS);
    /* Per morning, so that clearing this one is a thing the payload can say
       without claiming anything about any other. */
    mStamp('w', k);
  }

  return { mWUnit: mWUnit, mWShow: mWShow, mWriteWeight: mWriteWeight, WGAPI: WGAPI, MWEIGHTS: MWEIGHTS, MKG_LB: MKG_LB };
};
