/* The week you are in, seven blocks wide (mWeekHTML): each day's letter,
 * its date, and the colour of how it went, with the target's place along
 * each square's rail (MWK_GOAL). No words on it: the colour is the verdict,
 * and the button's label says it to a listener. The longer account is with
 * the code.
 *
 * A part of app.js (Nourish) in a file of its own. app.js calls
 * HiveParts.weekstrip(app) once, as it starts, and keeps what it gives back
 * under the same name. Loaded before app.js.
 */
(window.HiveParts = window.HiveParts || {}).weekstrip = function (app) {
  'use strict';

  // what it reads of the app's
  var MDAYS = app.MDAYS;
  var M_MONS = app.M_MONS;
  var M_WDAYS = app.M_WDAYS;
  var dayKey = app.dayKey;
  var kcalOf = app.kcalOf;
  var keyDate = app.keyDate;
  var mDay = app.mDay;
  var mDayDone = app.mDayDone;
  var mDayJudged = app.mDayJudged;
  var mDayTargets = app.mDayTargets;
  var mEarliestKey = app.mEarliestKey;
  var mIsTrainingDay = app.mIsTrainingDay;
  var mLatestKey = app.mLatestKey;
  var mTotals = app.mTotals;
  var mTrainedAt = app.mTrainedAt;
  var mVerdict = app.mVerdict;

  /* The strip carries no words (Blake, 2026-09-27: "It's visual for a
     reason"): each day's verdict is its colour, and the button's label says
     it to a listener. */

  /* Where the target sits along each square's rail, as a fraction of it. Two
     thirds: enough of the rail before it to read a half-eaten day, enough
     after it to tell 103% from 140%. */
  var MWK_GOAL = 0.66;

  function mPillDotsSVG(w, h, n, d, targets, tot) {
    var rDot = (d / 2).toFixed(2);
    var a = d / 2, R = w / 2 - a, L = h - w, cx = w / 2, cyT = a + R, cyB = a + R + L;
    var q = Math.PI * R / 2, Pm = 2 * L + 2 * Math.PI * R;
    function at(s) {
      var f;
      if (s < q) { f = s / R; return [cx + R * Math.sin(f), cyT - R * Math.cos(f)]; }
      s -= q; if (s < L) return [w - a, cyT + s];
      s -= L; if (s < 2 * q) { f = s / R; return [cx + R * Math.cos(f), cyB + R * Math.sin(f)]; }
      s -= 2 * q; if (s < L) return [a, cyB - s];
      s -= L; f = s / R; return [cx - R * Math.cos(f), cyT - R * Math.sin(f)];
    }
    var pK = (targets.p || 0) * 4, fK = (targets.f || 0) * 9, cK = (targets.c || 0) * 4;
    var totK = pK + fK + cK;
    var shP = totK > 0 ? pK / totK : 0.40;
    var shF = totK > 0 ? fK / totK : 0.30;
    var shC = totK > 0 ? Math.max(0, 1 - shP - shF) : 0.30;
    var arcs = [
      ['p', shP, 'var(--pill-p)'],
      ['f', shF, 'var(--pill-f)'],
      ['c', shC, 'var(--pill-c)']
    ];
    var slots = n + 3, out = [];
    var i = 0, used = 0;
    arcs.forEach(function (arc, si) {
      var m = arc[0], sh = arc[1], col = arc[2];
      var cnt = si === 2 ? Math.max(1, n - used) : Math.max(1, Math.round(n * sh));
      if (si < 2 && used + cnt >= n) cnt = Math.max(1, n - used - (2 - si));
      used += cnt;
      var want = Math.max(1, targets[m] || 1);
      var got = tot ? (tot[m] || 0) : 0;
      var prog = got > 0 && targets[m] > 0 ? got / want : 0;
      var v = got > 0 && targets[m] > 0 ? mVerdict(m, got, want) : '';
      var lit = Math.round(cnt * Math.min(prog, 1));
      for (var j = 0; j < cnt; j++, i++) {
        var pt = at((i / slots) * Pm);
        var st = 'fill:var(--pill-off);opacity:0.45';
        var cls = 'mwk-dot';
        if (j < lit) {
          if (v === 'over') {
            st = 'fill:var(--pill-fire)';
            cls += ' is-over';
          } else if (v === 'on') {
            st = 'fill:' + col;
            cls += ' is-on';
          } else {
            st = 'fill:' + col + ';opacity:' + (0.28 + 0.57 * Math.min(1, prog)).toFixed(2);
          }
        }
        out.push('<circle class="' + cls + '" cx="' + pt[0].toFixed(1) + '" cy="' + pt[1].toFixed(1) + '" r="' + rDot + '" style="' + st + '"/>');
      }
      i++;
    });
    return '<svg class="mwk-dots-svg" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true">' + out.join('') + '</svg>';
  }

  function mFibreIconStyle(fib, fibFloor) {
    if (!fib || !fibFloor) return 'stroke:var(--pill-ico);opacity:0.18';
    var p = fib / fibFloor;
    if (p >= 1) return 'stroke:var(--pill-ico);filter:drop-shadow(0 0 3px var(--pill-ico))';
    return 'stroke:var(--pill-ico);opacity:' + (0.18 + 0.67 * Math.min(1, p)).toFixed(2);
  }

  function mSaltIconStyle(na, naCap) {
    if (!na || !naCap) return 'stroke:var(--pill-ico);opacity:0.15';
    var p = na / naCap;
    if (p > 1) return 'stroke:var(--pill-fire);filter:drop-shadow(0 0 4px var(--pill-fire))';
    if (p >= 0.8) return 'stroke:var(--pill-amber);filter:drop-shadow(0 0 3px var(--pill-amber))';
    if (p >= 0.65) return 'stroke:var(--pill-amber);opacity:' + (0.42 + (p - 0.65) * 3.2).toFixed(2);
    return 'stroke:var(--pill-ico);opacity:0.20';
  }

  function mGymIconStyle(train, trained) {
    if (trained) return 'stroke:var(--pill-ico);filter:drop-shadow(0 0 3px var(--pill-ico))';
    if (train) return 'stroke:var(--pill-ico);opacity:0.32';
    return 'stroke:var(--pill-ico);opacity:0';
  }

  function mWeekHTML(k, todayK) {
    var cur = keyDate(k);
    var mon = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate());
    mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));       // week starts Monday
    var out = [];
    for (var i = 0; i < 7; i++) {
      var d = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + i);
      var dk = dayKey(d);
      var ahead = dk > mLatestKey(), tooOld = dk < mEarliestKey();
      var targets = mDayTargets(dk);
      var tK = kcalOf(targets);
      var train = mIsTrainingDay(dk);
      var trained = mTrainedAt ? mTrainedAt(dk) > 0 : false;
      var dayObj = MDAYS[dk] ? mDay(dk) : null;
      var totAll = dayObj ? mTotals(dayObj).all : null;
      var gotRaw = totAll ? totAll.kcal : 0;
      var got = Math.round(gotRaw);
      var state = !got || !tK ? '' : ' ' + mVerdict('kcal', gotRaw, tK);
      var done = dayObj ? mDayDone(dayObj) : false;
      var word = '';
      if (dk === k && state && state !== ' over' && got < tK && !mDayJudged(dk)) {
        state = ' open';
      }
      var spark = '';
      if (got && tK) {
        var ratio = got / tK;
        var vK = mVerdict('kcal', gotRaw, tK);
        var bg = vK === 'over'
          ? 'background:linear-gradient(var(--pill-fire) 0 14%, var(--pill-fill) 14% 100%);'
          : 'background:var(--pill-fill);';
        spark = '<i style="' + bg + 'height:' + Math.min(100, ratio * 100 * MWK_GOAL).toFixed(1) + '%"></i>';
      }
      var fibFloor = Math.max(1, Math.round(tK * 14 / 1000));
      var naCap = 2300;
      var fibVal = totAll ? totAll.fib : 0;
      var naVal = totAll ? totAll.na : 0;
      var dotsSVG = mPillDotsSVG(40, 112, 32, 3.5, targets, totAll);
      var fibStyle = mFibreIconStyle(fibVal, fibFloor);
      var saltStyle = mSaltIconStyle(naVal, naCap);
      var gymStyle = mGymIconStyle(train, trained);
      out.push('<button class="mwk-d' + (dk === k ? ' now' : '') + state +
        (train ? ' train' : '') + (done ? ' done' : '') + '"' +
        (ahead || tooOld ? ' disabled' : '') +
        ' data-mweek="' + dk + '" aria-pressed="' + (dk === k ? 'true' : 'false') + '"' +
        ' aria-label="' + M_WDAYS[d.getDay()] + ' ' + M_MONS[d.getMonth()] + ' ' + d.getDate() +
        (train ? ', lifting day' : '') + ', ' + tK + ' calorie target' +
        (got ? ', ' + got + (done ? ' eaten, all done' : ' on the day') : '') + '">' +
        '<span class="mwk-w">' + M_WDAYS[d.getDay()].slice(0, 1) + '</span>' +
        '<span class="mwk-c" aria-hidden="true">' +
          dotsSVG +
          '<span class="mwk-b">' + spark +
            '<span class="mwk-icos">' +
              '<svg class="mwk-ico mwk-ico-fib" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="' + fibStyle + '"><path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14z"/><path d="M5 19l8-8"/></svg>' +
              '<svg class="mwk-ico mwk-ico-salt" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="' + saltStyle + '"><path d="M8 10h8l-1 10H9z"/><path d="M8 10c0-3 2-6 4-6s4 3 4 6"/><path d="M11 7h.01M13 7h.01"/></svg>' +
              (train || trained ? '<svg class="mwk-ico mwk-lift" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="' + gymStyle + '"><title>Lifting day</title><path d="M3 12h18M6 8v8M18 8v8M3 10v4M21 10v4"/></svg>' : '<span class="mwk-ico-sp"></span>') +
            '</span>' +
          '</span><span class="mwk-g"></span>' +
        '</span>' +
        '<span class="mwk-n"><b>' + d.getDate() + '</b></span>' +
        '<span class="mwk-s">' + (word || '&nbsp;') + '</span>' +
      '</button>');
    }
    return out.join('');
  }

  return {
    mWeekHTML: mWeekHTML,
    mPillDotsSVG: mPillDotsSVG,
    mFibreIconStyle: mFibreIconStyle,
    mSaltIconStyle: mSaltIconStyle,
    mGymIconStyle: mGymIconStyle
  };
};
