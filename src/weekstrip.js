/* The week you are in, seven pills wide (mWeekHTML): each day's letter,
 * its date, and how it went — calories as the fill, full at target
 * (mPillFillHTML), macros as the dots round the rim, fibre, salt and the
 * lift glowing inside. No words on it: the colour is the verdict,
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

  /* What a day's calories pour into its pill.
   *
     The target used to sit two thirds of the way up, so a day could read
     past it — and a day eaten exactly to plan stopped at two thirds, which
     looks like a day that came up short. Blake, on a 1,399 of 1,413 Thursday
     drawn as a half-full glass: "I did good yesterday. I want that pill to be
     full and I want it to be green."
   *
     So the TOP of the pill is the target now. A day under it fills to its
     share. A day the verdict calls on target fills to the brim, even at 99%,
     because the verdict is the one rule (mVerdict) and a 1% gap drawn as a
     sliver of empty glass is the verdict contradicting itself. A day over it
     is still full, and what says how far over is a hairline dropped down to
     where the target was (.mwk-g), with everything above that line running
     warm. Two over days are told apart by how far down the line sits rather
     than by how tall the fill stands, which is what the old two-thirds rail
     was for.
   *
     The colour is one ramp painted across the whole pill and uncovered from
     the bottom: cool blue at the foot, green at the target, then amber and
     on to red past it. The blue is only the foot: green from a little past
     half way, so a day on target reads as a green pill, which is what was
     asked for. "Blue to green to orange-red if I really go over" —
     so a fill's colour is where it got to, not a verdict stamped on a block,
     and an over day fades into the warm end instead of wearing a hard cap.
     The background is sized to the pill rather than to the fill, so a
     half-full day shows the lower half of the ramp instead of the whole ramp
     squeezed into half the height. */
  function mPillFillHTML(gotRaw, tK) {
    var ratio = gotRaw / tK;
    var v = mVerdict('kcal', gotRaw, tK);
    if (v !== 'over') {
      var h = v === 'on' ? 100 : Math.max(2, Math.min(100, ratio * 100));
      return '<i style="height:' + h.toFixed(1) + '%;background:linear-gradient(to top, var(--pill-cool), var(--pill-fill) 55%);' +
        'background-size:100% ' + (10000 / h).toFixed(1) + '%;background-position:bottom"></i>';
    }
    /* Where the target falls in a full pill, and the band above it. Red only
       arrives when the day is well past the line (a fifth over); a day a few
       per cent over shades to amber and stops at fire-orange. */
    var tPct = 100 / ratio;
    var band = 100 - tPct;
    var stops = 'var(--pill-cool) 0%, var(--pill-fill) ' + (tPct * 0.55).toFixed(1) + '%, var(--pill-fill) ' +
      tPct.toFixed(1) + '%, var(--pill-amber) ' +
      (tPct + band * 0.35).toFixed(1) + '%, var(--pill-fire) ' +
      (ratio >= 1.2 ? (tPct + band * 0.7).toFixed(1) + '%, var(--pill-red) 100%' : '100%');
    return '<i class="is-over" style="height:100%;background:linear-gradient(to top, ' + stops + ')"></i>' +
      '<span class="mwk-g" style="bottom:' + tPct.toFixed(1) + '%"></span>';
  }

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
      var spark = got && tK ? mPillFillHTML(gotRaw, tK) : '';
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
          '</span>' +
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
