/* The week you are in, seven pills wide (mWeekHTML): each day's letter,
 * its date, and how it went — calories as the fill, full at target
 * (mPillFillHTML), macros as three tracks round the rim, fibre, salt and the
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
  var mStrengthOn = app.mStrengthOn;
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

  /* The rim: three equal tracks, P, F and C, a third of the way round each,
     starting at the top and running clockwise, with the letter at the head
     of its own third (Blake, 2026-10-30, after the rim of letters: "make each
     a equal size track around the pill and just the letter at the start of
     its 1/3 share of the track"). Equal, not shared out by calories: the
     arcs used to be sized by each macro's share of the day, so protein's
     arc was twice fat's and a glance could not compare them.
   *
     Two fills on each track. Faint is the plan: what the day's planned food
     would bring that macro to, eaten or not — "where today ends if I stick
     to it". Strong is what has been ticked eaten, on the heat map: cool
     while it is low, the pill's green as it nears the target, glowing green
     on it. Over, it stops at the end of its own third and glows orange
     rather than running on into the next macro's track (his call: "Stop and
     glow orange").
   *
     tots is mTotals(day): { all, eaten }. sw is the track's width and fs the
     letter's size, both in the pill's own units. */
  function mPillDotsSVG(w, h, sw, fs, targets, tots) {
    var all = tots && tots.all ? tots.all : null, ate = tots && tots.eaten ? tots.eaten : null;
    var i = sw / 2 + 0.5, r = w / 2, rr = r - i, x0 = i, x1 = w - i, y0 = i, y1 = h - i;
    var d = 'M' + r + ',' + y0 + ' A' + rr + ',' + rr + ' 0 0 1 ' + x1 + ',' + (y0 + rr) +
      ' V' + (y1 - rr) + ' A' + rr + ',' + rr + ' 0 0 1 ' + x0 + ',' + (y1 - rr) +
      ' V' + (y0 + rr) + ' A' + rr + ',' + rr + ' 0 0 1 ' + r + ',' + y0;
    /* Where a share of the way round falls on the track's own line, for the
       letters, which sit on the track at the head of their third — set
       inside the rim they were hidden under the pill's body. */
    function at(frac, ins) {
      var R = r - ins, L = h - w, cx = r, cyT = r, cyB = r + L;
      var q = Math.PI * R / 2, s = frac * (2 * L + 4 * q), f;
      if (s < q) { f = s / R; return [cx + R * Math.sin(f), cyT - R * Math.cos(f)]; }
      s -= q; if (s < L) return [w - ins, cyT + s];
      s -= L; if (s < 2 * q) { f = s / R; return [cx + R * Math.cos(f), cyB + R * Math.sin(f)]; }
      s -= 2 * q; if (s < L) return [ins, cyB - s];
      s -= L; f = s / R; return [cx - R * Math.cos(f), cyT - R * Math.sin(f)];
    }
    /* The letter's room at the head of each third, in the path's units (the
       whole rim is 300): its own width and a little air either side. */
    var per = 2 * (h - w) + 2 * Math.PI * rr;
    var LET = (fs * 1.5) * 300 / per;
    function arc(cls, start, len, st) {
      if (len <= 0.2) return '';
      return '<path class="' + cls + '" d="' + d + '" pathLength="300" fill="none" stroke-width="' + sw +
        '" stroke-linecap="round" stroke-dasharray="' + len.toFixed(1) + ' 300" stroke-dashoffset="' +
        (-start).toFixed(1) + '" style="' + st + '"/>';
    }
    var GAP = 3, SEG = 100 - GAP - LET, out = [];
    ['p', 'f', 'c'].forEach(function (m, k) {
      var head = k * 100 + GAP / 2, start = head + LET;
      var want = targets && targets[m] > 0 ? targets[m] : 0;
      var plan = want && all ? all[m] / want : 0;
      var got = want && ate ? ate[m] : 0;
      var prog = want ? got / want : 0;
      var v = got > 0 && want ? mVerdict(m, got, want) : '';
      var col = v === 'over' ? 'var(--pill-fire)' : v === 'on' || prog >= 0.5 ? 'var(--pill-fill)' : 'var(--pill-cool)';
      out.push(arc('mwk-tr', start, SEG, 'stroke:var(--pill-off);opacity:0.2'));
      out.push(arc('mwk-tr-plan', start, SEG * Math.min(plan, 1), 'stroke:var(--pill-cool);opacity:0.45'));
      out.push(arc('mwk-tr-ate' + (v === 'over' ? ' is-over' : v === 'on' ? ' is-on' : ''), start,
        SEG * Math.min(prog, 1), 'stroke:' + col + (v ? '' : ';opacity:0.85')));
      var pt = at((head + LET / 2) / 300, i);
      out.push('<text class="mwk-tr-l' + (v === 'over' ? ' is-over' : '') + '" data-m="' + m + '" x="' + pt[0].toFixed(1) +
        '" y="' + pt[1].toFixed(1) + '" font-size="' + fs + '" text-anchor="middle" dominant-baseline="central" style="fill:' +
        (got > 0 ? col : 'var(--pill-off)') + '">' + m.toUpperCase() + '</text>');
    });
    return '<svg class="mwk-dots-svg" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true">' + out.join('') + '</svg>';
  }

  function mFibreIconStyle(fib, fibFloor) {
    if (!fib || !fibFloor) return 'stroke:var(--pill-ico);opacity:0.18';
    var p = fib / fibFloor;
    if (p >= 1) return 'stroke:var(--pill-ico);filter:drop-shadow(0 0 3px var(--pill-ico))';
    return 'stroke:var(--pill-ico);opacity:' + (0.18 + 0.67 * Math.min(1, p)).toFixed(2);
  }

  /* Sodium as its periodic-table tile, Na (Blake, 2026-10-30: the shaker read
     as a cup, then "use an icon with the periodic table for sodium"). The
     tile's letters are drawn in fill, so whatever colour the stroke takes,
     the text takes too. */
  function mSaltIconStyle(na, naCap) {
    var st = mSaltIconStroke(na, naCap), m = /stroke:([^;]+)/.exec(st);
    return m ? st + ';color:' + m[1] : st;
  }
  function mSaltIconStroke(na, naCap) {
    if (!na || !naCap) return 'stroke:var(--pill-ico);opacity:0.15';
    var p = na / naCap;
    if (p > 1) return 'stroke:var(--pill-fire);filter:drop-shadow(0 0 4px var(--pill-fire))';
    if (p >= 0.8) return 'stroke:var(--pill-amber);filter:drop-shadow(0 0 3px var(--pill-amber))';
    if (p >= 0.65) return 'stroke:var(--pill-amber);opacity:' + (0.42 + (p - 0.65) * 3.2).toFixed(2);
    return 'stroke:var(--pill-ico);opacity:0.20';
  }

  function mGymIconStyle(train, trained) {
    /* Done is the brightest thing in the pill: full strength and a wider
       glow than fibre met, because a workout is a yes or a no. */
    if (trained) return 'stroke:var(--pill-ico);opacity:1;filter:drop-shadow(0 0 4px var(--pill-ico)) drop-shadow(0 0 1px var(--pill-ico))';
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
      /* Trained is either tick: the "Trained today" box on Nourish, or a
         workout logged in Strengthen that day. It read the box alone, so a
         week of lifting logged in Strengthen — Blake, Monday to Friday —
         drew seven dim dumbbells: "Make the workout icon glow when I have
         done it." */
      var trained = (mTrainedAt ? mTrainedAt(dk) > 0 : false) ||
        (mStrengthOn ? mStrengthOn(dk).length > 0 : false);
      var dayObj = MDAYS[dk] ? mDay(dk) : null;
      var tots = dayObj ? mTotals(dayObj) : null;
      var totAll = tots ? tots.all : null;
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
      /* 40 × 92, the pill's own box (--mwk-h), so the tracks trace its edge
         rather than a taller shape shrunk to fit. Shortened from 104
         (Blake, 2026-10-30: "shorten the pills just a little"), which gives
         the meals below another twelve pixels; still room for the three
         icons inside. */
      var dotsSVG = mPillDotsSVG(40, 92, 3, 8, targets, tots);
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
              '<svg class="mwk-ico mwk-ico-salt" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="' + saltStyle + '"><rect x="3" y="3" width="18" height="18" rx="2.5"/><text x="12" y="15.6" text-anchor="middle" font-size="9.5" font-weight="800" stroke="none" fill="currentColor">Na</text><text x="6" y="8.4" font-size="4.6" font-weight="700" stroke="none" fill="currentColor">11</text></svg>' +
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
