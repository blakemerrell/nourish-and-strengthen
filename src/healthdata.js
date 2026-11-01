/* What Health Connect knows beyond steps, sleep and weight, kept on this
 * phone (window.HealthData). Blake, 2026-10-30: "get it so we get ALL of
 * health connect data that makes sense to get on this end". The Android app
 * reads it (MainActivity.readExtras) and hands it over with the rest through
 * Health.onData; this keeps it and answers questions about it.
 *
 * Kept under bsc.health in localStorage, which the household sync does not
 * carry (src/sync.js syncs named keys only): heart rate and the like stay on
 * the phone they were read on, as the privacy page says.
 *
 * Per day, any of:
 *   rhr       resting heart rate, bpm
 *   hrv       heart rate variability, RMSSD in ms
 *   actKcal   active calories burned
 *   totKcal   total calories burned (the watch's estimate, resting included)
 *   distM     distance, metres
 *   bodyFat   per cent, from a scale that measures it
 *   leanLb    lean mass, lb
 *   vo2       VO2 max, ml/kg/min
 *   spo2      blood oxygen, per cent
 *   resp      breaths a minute
 *   sleepStages { deep, rem, light, awake } in minutes
 * and the workouts other apps recorded (the watch's golf, a run), each with
 * its day, type, minutes, heart rate and calories.
 *
 * Not a part of app.js: Strengthen reads it too. Loaded before both.
 */
(function () {
  'use strict';

  var KEY = 'bsc.health';
  var KEEP_DAYS = 120;
  var FIELDS = ['rhr', 'hrv', 'actKcal', 'totKcal', 'distM', 'bodyFat', 'leanLb', 'vo2', 'spo2', 'resp'];
  var RANGE = {
    rhr: [25, 140], hrv: [1, 300], actKcal: [1, 8000], totKcal: [500, 12000], distM: [1, 200000],
    bodyFat: [2, 70], leanLb: [40, 400], vo2: [10, 95], spo2: [70, 100], resp: [4, 40]
  };

  function load() {
    try {
      var o = JSON.parse(localStorage.getItem(KEY) || '{}');
      return { d: o && typeof o.d === 'object' && o.d ? o.d : {}, ex: Array.isArray(o.ex) ? o.ex : [] };
    } catch (e) { return { d: {}, ex: [] }; }
  }
  var H = load();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(H)); } catch (e) { /* full or private: kept in memory */ }
  }
  function okDay(k) { return /^\d{4}-\d{2}-\d{2}$/.test(String(k || '')); }
  function num(v, f) {
    var n = Number(v);
    if (!isFinite(n)) return null;
    var r = RANGE[f];
    return r && (n < r[0] || n > r[1]) ? null : n;
  }
  function dayKeyOf(d) {
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }

  var _seriesCache = {};

  /* Take what the Android app sent. Fields it sent for a day replace that
     day's; workouts are replaced over the window the read covered, so one
     deleted on the watch goes here too. Returns whether anything changed. */
  function take(data) {
    if (!data || typeof data !== 'object') return false;
    var before = JSON.stringify(H), days = data.days && typeof data.days === 'object' ? data.days : {};
    var minDay = '';
    Object.keys(days).forEach(function (k) {
      if (!okDay(k)) return;
      if (!minDay || k < minDay) minDay = k;
      var src = days[k] || {}, out = H.d[k] || {};
      FIELDS.forEach(function (f) {
        if (src[f] === undefined) return;
        var v = num(src[f], f);
        if (v === null) delete out[f]; else out[f] = Math.round(v * 10) / 10;
      });
      if (src.sleepStages && typeof src.sleepStages === 'object') {
        var st = {};
        ['deep', 'rem', 'light', 'awake'].forEach(function (s) {
          var m = Number(src.sleepStages[s]);
          if (isFinite(m) && m > 0 && m < 1440) st[s] = Math.round(m);
        });
        if (Object.keys(st).length) out.sleepStages = st;
        else delete out.sleepStages;
      } else if (src.sleepStages === null || (src.sleepHours !== undefined && !src.sleepStages)) {
        delete out.sleepStages;
      }
      if (Object.keys(out).length) H.d[k] = out;
      else delete H.d[k];
    });
    if (Array.isArray(data.ex)) {
      var fresh = data.ex.filter(function (e) { return e && okDay(e.d) && Number(e.st) > 0; }).map(function (e) {
        var o = { d: e.d, type: String(e.type || 'Workout').slice(0, 40), st: Number(e.st), en: Number(e.en) || Number(e.st),
          min: Math.max(0, Math.round(Number(e.min) || 0)) };
        if (e.title) o.title = String(e.title).slice(0, 80);
        if (e.src) o.src = String(e.src).slice(0, 80);
        ['hrAvg', 'hrMax', 'kcal', 'distM'].forEach(function (f) { var n = Number(e[f]); if (isFinite(n) && n > 0) o[f] = Math.round(n); });
        return o;
      });
      var from = minDay || (fresh.length ? fresh.map(function (e) { return e.d; }).sort()[0] : '');
      H.ex = H.ex.filter(function (e) { return from && e.d < from; }).concat(fresh)
        .sort(function (a, b) { return a.st - b.st; });
    }
    // a season of it, no more
    var cut = new Date(); cut.setDate(cut.getDate() - KEEP_DAYS);
    var ck = dayKeyOf(cut);
    Object.keys(H.d).forEach(function (k) { if (k < ck) delete H.d[k]; });
    H.ex = H.ex.filter(function (e) { return e.d >= ck; });
    var changed = JSON.stringify(H) !== before;
    if (changed) { _seriesCache = {}; save(); }
    return changed;
  }

  function day(k) {
    var src = H.d[k];
    if (!src) return {};
    var cp = Object.assign({}, src);
    if (src.sleepStages) cp.sleepStages = Object.assign({}, src.sleepStages);
    return cp;
  }
  function sessions(k) { return H.ex.filter(function (e) { return e.d === k; }); }

  /* Your normal: the median of the thirty days before k (k itself left out,
     so a bad morning is not its own yardstick), once there are seven. */
  function normal(f, k) {
    var end = new Date(k + 'T12:00:00'), vs = [];
    for (var i = 1; i <= 30; i++) {
      var d = new Date(end); d.setDate(d.getDate() - i);
      var v = (H.d[dayKeyOf(d)] || {})[f];
      if (typeof v === 'number') vs.push(v);
    }
    if (vs.length < 7) return null;
    vs.sort(function (a, b) { return a - b; });
    var m = vs.length >> 1;
    return vs.length % 2 ? vs[m] : (vs[m - 1] + vs[m]) / 2;
  }

  /* Ordered time-series of field `f` across [fromK..toK] (or all stored days),
     paired with its 30-day rolling median baseline when f is 'rhr' or 'hrv'. */
  function series(f, fromK, toK) {
    var ck = (f || '') + '|' + (fromK || '') + '|' + (toK || '');
    if (_seriesCache[ck]) return _seriesCache[ck].map(function (p) { return Object.assign({}, p); });
    var ks = Object.keys(H.d).sort();
    var out = [];
    var needBase = (f === 'rhr' || f === 'hrv');
    for (var i = 0; i < ks.length; i++) {
      var k = ks[i];
      if (fromK && k < fromK) continue;
      if (toK && k > toK) continue;
      var v = H.d[k] && H.d[k][f];
      if (typeof v !== 'number') continue;
      var b = needBase ? normal(f, k) : null;
      out.push({ k: k, v: v, norm: b, base: b, m: b });
    }
    _seriesCache[ck] = out;
    return out.map(function (p) { return Object.assign({}, p); });
  }

  /* Watch exercise sessions within [fromK..toK]. */
  function sessionsBetween(fromK, toK) {
    return H.ex.filter(function (e) {
      if (fromK && e.d < fromK) return false;
      if (toK && e.d > toK) return false;
      return true;
    });
  }

  /* Summary of how many days of Health Connect history are stored. */
  function spanInfo() {
    var ks = Object.keys(H.d).sort();
    return {
      minKey: ks.length ? ks[0] : null,
      maxKey: ks.length ? ks[ks.length - 1] : null,
      count: ks.length,
      days: ks.length
    };
  }

  /* How recovered you are this morning, from what the watch can tell:
     resting heart rate against your normal (up five or more is the body
     working on something), heart rate variability against yours (down a
     fifth is the same signal from the other side), and last night's sleep.
     Three words, and the reasons, never a score pretending to precision.
     null when there is nothing to judge. */
  function recovery(k, sleepH) {
    var d = day(k), why = [], bad = 0, meh = 0, seen = 0;
    var rN = normal('rhr', k), hN = normal('hrv', k);
    if (typeof d.rhr === 'number' && rN) {
      seen++;
      var dr = Math.round(d.rhr - rN);
      if (dr >= 5) { bad++; why.push('resting HR ' + Math.round(d.rhr) + ', ' + dr + ' above your normal'); }
      else if (dr >= 3) { meh++; why.push('resting HR ' + Math.round(d.rhr) + ', ' + dr + ' above normal'); }
      else why.push('resting HR ' + Math.round(d.rhr) + (dr <= -2 ? ', below normal' : ', normal'));
    }
    if (typeof d.hrv === 'number' && hN) {
      seen++;
      var dh = (d.hrv - hN) / hN;
      if (dh <= -0.2) { bad++; why.push('HRV ' + Math.round(d.hrv) + ' ms, well under your ' + Math.round(hN)); }
      else if (dh <= -0.1) { meh++; why.push('HRV ' + Math.round(d.hrv) + ' ms, under your ' + Math.round(hN)); }
      else why.push('HRV ' + Math.round(d.hrv) + ' ms' + (dh >= 0.1 ? ', above normal' : ', normal'));
    }
    if (sleepH > 0) {
      seen++;
      var shLbl = (Math.round(sleepH * 10) / 10) + ' h sleep';
      if (sleepH < 6) { bad++; why.push(shLbl); }
      else if (sleepH < 7) { meh++; why.push(shLbl); }
      else why.push(shLbl);
    }
    if (!seen) return null;
    var level = bad ? 'low' : meh ? 'fair' : 'good';
    return {
      level: level,
      word: level === 'good' ? 'Recovered' : level === 'fair' ? 'Part recovered' : 'Under-recovered',
      why: why,
      sleepOnly: seen === 1 && sleepH > 0
    };
  }

  function wipe() { H = { d: {}, ex: [] }; _seriesCache = {}; try { localStorage.removeItem(KEY); } catch (e) { /* private */ } }

  window.HealthData = {
    take: take, day: day, sessions: sessions, sessionsBetween: sessionsBetween,
    series: series, spanInfo: spanInfo, normal: normal, recovery: recovery, wipe: wipe
  };
})();
