/* The charts: four process behaviour charts over the mornings and the
 * meals (weight, off plan, day to day, rate), by Wheeler's arithmetic, with
 * limits taken from a baseline and held flat so they do not chase the
 * trend; the series, the ranges, the ticks and the drawing, the reading
 * under a finger (mcRead), the gap a series is allowed (MC_GAP, mcDaysApart),
 * and the sheet that holds them (macroChartHTML). The longer account is
 * with the code.
 *
 * A part of app.js (Nourish) in a file of its own. app.js calls
 * HiveParts.charts(app) once, as it starts, and keeps what it gives back
 * under the same names. Loaded before app.js.
 */
(window.HiveParts = window.HiveParts || {}).charts = function (app) {
  'use strict';

  // what it reads of the app's
  var MDAYS = app.MDAYS;
  var MSALT_DAY = app.MSALT_DAY;
  var MWEIGHTS = app.MWEIGHTS;
  var S = app.S;
  var dayKey = app.dayKey;
  var keyDate = app.keyDate;
  var mDayN = app.mDayN;
  var mInfoBtn = app.mInfoBtn;
  var mInfoText = app.mInfoText;
  var mPlanWeight = app.mPlanWeight;
  var mPretty = app.mPretty;
  var mReadProfile = app.mReadProfile;
  var mSodiumOn = app.mSodiumOn;
  var mBodyDays = app.mBodyDays;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ------------------------------------------------------ the charts
   * Four process behaviour charts over the mornings and the meals, behind
   * the bars they belong to. Wheeler's arithmetic throughout: the centre
   * comes from the values, the spread from the moving ranges, and the limits
   * sit 2.660 average moving ranges either side of the centre.
   *
   * Limits are taken from a BASELINE — the first three weeks — and held flat
   * afterwards, rather than recomputed over everything. Recomputing lets the
   * limits chase the trend until nothing can ever be outside them, which on
   * a cut means the chart goes quiet exactly when it should be speaking.
   */
  var MC_KEYS = [
    ['weight', 'Weight'], ['off', 'Off plan'], ['jump', 'Day to day'], ['rate', 'Rate'], ['recomp', 'Recomp']
  ];

  /* ---- Recomp: the scale, the tape and the bar, week by week ----
   *
     Blake, 2026-10-30, eating near maintenance while he lifts: "Even though
     I'm maintaining, am I getting stronger and thinning up in other places?"
     The scale alone cannot answer that — a pound of fat gone and a pound of
     muscle come reads as nothing — so three lines share the weeks: the
     week's average weight, the waist from the weekly tape, and strength
     from Strengthen (each lift against its own first week, 100 = where you
     started). Each is drawn on its own scale, so it is the direction that
     compares, never the height. */
  function mcMonday(k) {
    var d = keyDate(k);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return dayKey(d);
  }
  function mcRecompData() {
    var wByWk = {};
    Object.keys(MWEIGHTS).forEach(function (k) {
      var v = MWEIGHTS[k];
      if (!(v > 0)) return;
      var wk = mcMonday(k);
      (wByWk[wk] = wByWk[wk] || []).push(v);
    });
    var weight = Object.keys(wByWk).sort().map(function (wk) {
      return { wk: wk, v: Math.round(mcMean(wByWk[wk]) * 10) / 10 };
    });
    var waByWk = {};
    (mBodyDays ? mBodyDays() : []).forEach(function (d) {
      if (d.bm && d.bm.wa > 0) waByWk[mcMonday(d.k)] = d.bm.wa;      // the week's last tape
    });
    var waist = Object.keys(waByWk).sort().map(function (wk) { return { wk: wk, v: waByWk[wk] }; });
    var strength = [];
    try {
      strength = window.Train && window.Train.strengthWeeks
        ? window.Train.strengthWeeks().map(function (r) { return { wk: r.wk, v: r.idx }; }) : [];
    } catch (e) { strength = []; }
    return { weight: weight, waist: waist, strength: strength };
  }
  /* The change from the first of the last few weeks to the latest, over the
     same span for all three, so they are read over the same stretch. */
  function mcSpan(sr, weeks) {
    if (sr.length < 2) return null;
    var tail = sr.slice(-weeks);
    if (tail.length < 2) return null;
    return { from: tail[0].v, to: tail[tail.length - 1].v, n: tail.length };
  }
  function mcRecompSay(d) {
    var W = 8;
    var w = mcSpan(d.weight, W), wa = mcSpan(d.waist, W), st = mcSpan(d.strength, W);
    if (!wa || !st) {
      return 'Two weekly tapes and two weeks of logged lifts, and this says which way you are going.';
    }
    var wPct = w ? (w.to - w.from) / w.from * 100 : 0;
    var waD = wa.to - wa.from, stD = st.to - st.from;
    var steady = Math.abs(wPct) < 1;
    var leaner = waD <= -0.25, wider = waD >= 0.25, stronger = stD >= 1, weaker = stD <= -1;
    var span = 'over the last ' + Math.max(wa.n, st.n) + ' weeks';
    if (steady && leaner && stronger) return 'Recomposition ' + span + ': weight holding, waist down ' + Math.abs(waD) + '″, strength up ' + stD.toFixed(1) + '%.';
    if (leaner && stronger) return 'Leaner and stronger ' + span + ': waist down ' + Math.abs(waD) + '″, strength up ' + stD.toFixed(1) + '%.';
    if (leaner && weaker) return 'Waist down ' + Math.abs(waD) + '″ but strength down ' + Math.abs(stD).toFixed(1) + '% ' + span + ': watch protein and sleep.';
    if (wider && !stronger) return 'Waist up ' + waD + '″ without strength to show for it ' + span + '.';
    if (stronger) return 'Strength up ' + stD.toFixed(1) + '% ' + span + ', waist ' + (waD === 0 ? 'unchanged' : (waD > 0 ? 'up ' : 'down ') + Math.abs(waD) + '″') + '.';
    return 'No clear change ' + span + '. A few more weeks of tape and logged lifts will tell.';
  }
  // one small line on its own scale, with its first and last values said
  /* minSpan keeps a scale from magnifying noise: a pound of water up and
     down across a week drew as a mountain range when the line had only its
     own few tenths to fill the height with. */
  function mcSpark(sr, label, unit, color, wks, minSpan) {
    var head = '<div class="mc-rc-h"><span>' + label + '</span>';
    if (sr.length < 2) {
      return '<div class="mc-rc">' + head + '<b>' + (sr.length ? sr[0].v + unit : '—') + '</b></div>' +
        '<div class="mc-rc-none">' + (sr.length ? 'One week so far.' : 'Nothing yet.') + '</div></div>';
    }
    var W = 300, H = 56, P = 4;
    var xs = function (wk) { var i = wks.indexOf(wk); return P + (W - 2 * P) * (wks.length > 1 ? i / (wks.length - 1) : 0.5); };
    var vs = sr.map(function (r) { return r.v; });
    var lo = Math.min.apply(null, vs), hi = Math.max.apply(null, vs);
    var need = Math.max(minSpan || 0, 1e-9);
    if (hi - lo < need) { var mid = (hi + lo) / 2; lo = mid - need / 2; hi = mid + need / 2; }
    var ys = function (v) { return P + (H - 2 * P) * (1 - (v - lo) / (hi - lo)); };
    var pts = sr.map(function (r) { return xs(r.wk).toFixed(1) + ',' + ys(r.v).toFixed(1); }).join(' ');
    var last = sr[sr.length - 1];
    return '<div class="mc-rc">' + head + '<b>' + last.v + unit + '</b></div>' +
      '<svg class="mc-rc-svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img" aria-label="' +
        esc(label) + ' from ' + sr[0].v + unit + ' to ' + last.v + unit + ' over ' + sr.length + ' weeks">' +
        '<polyline points="' + pts + '" fill="none" stroke="' + color + '" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"/>' +
        '<circle cx="' + xs(last.wk).toFixed(1) + '" cy="' + ys(last.v).toFixed(1) + '" r="3" fill="' + color + '"/>' +
      '</svg></div>';
  }
  function mcRecompHTML() {
    var d = mcRecompData();
    var wks = {};
    [d.weight, d.waist, d.strength].forEach(function (sr) { sr.forEach(function (r) { wks[r.wk] = 1; }); });
    var all = Object.keys(wks).sort().slice(-16);                 // the last sixteen weeks
    var cut = function (sr) { return sr.filter(function (r) { return all.indexOf(r.wk) >= 0; }); };
    return '<div class="mc-recomp">' +
      '<p class="mc-rc-say" role="status">' + esc(mcRecompSay(d)) + '</p>' +
      mcSpark(cut(d.weight), 'Weight, the week\u2019s average', ' lb', 'var(--ink-2)', all, 6) +
      mcSpark(cut(d.waist), 'Waist', '″', 'var(--pill-water)', all, 1.5) +
      mcSpark(cut(d.strength), 'Strength, 100 = where you started', '', 'var(--pill-p)', all, 8) +
      '<p class="mc-rc-foot">Each line on its own scale: compare directions, not heights. The last 16 weeks.</p>' +
      (window.HHPhotos ? window.HHPhotos.slotsHTML() : '') +
    '</div>';
  }

  function mcMean(a) {
    return a.reduce(function (s2, x) { return s2 + x; }, 0) / (a.length || 1);
  }
  /* A moving range measures how far the process moves in ONE step. Pairing
     two readings a fortnight apart and calling the difference a moving range
     is a category error: it is a fortnight of drift wearing a day's clothes,
     and it goes straight into mR-bar, which widens every limit on the chart
     and makes the salt warning fire LESS often than it should.

     These arrays came in as bare numbers, so nothing here could see that two
     adjacent entries were two weeks apart. They carry their dates now.

     One missed morning still pairs — a two-day step is the same process seen
     a little later, and refusing it would throw away most of a real series.
     Beyond that the pair is dropped rather than stretched. */
  var MC_GAP = 2;

  function mcDaysApart(a, b) {
    if (!a || !b) return 1;
    return Math.round((keyDate(b) - keyDate(a)) / 86400000);
  }

  /* The ranges, each carrying the key it ends on — so a caller that PLOTS the
     ranges can label them without re-deriving which pairs survived. */
  function mcRangePairs(v, keys) {
    var o = [];
    for (var i = 1; i < v.length; i++) {
      if (keys && mcDaysApart(keys[i - 1], keys[i]) > MC_GAP) continue;
      o.push({ k: keys ? keys[i] : null, r: Math.abs(v[i] - v[i - 1]) });
    }
    return o;
  }
  function mcRanges(v, keys) {
    return mcRangePairs(v, keys).map(function (p) { return p.r; });
  }
  function mcLimits(v, keys) {
    if (v.length < 5) return null;
    var n = Math.min(21, v.length);
    var base = v.slice(0, n);
    var bkeys = keys ? keys.slice(0, n) : null;
    var ranges = mcRanges(base, bkeys);
    if (ranges.length < 4) return null;      // too little of it was consecutive
    var bar = mcMean(ranges), cl = mcMean(base);
    return { cl: cl, bar: bar, unpl: cl + 2.660 * bar, lnpl: cl - 2.660 * bar };
  }

  /* The series each chart draws, and the sentence under it. Every one can
     come back empty, and says why rather than drawing an empty box. */
  function mcSeries(which) {
    var keys = Object.keys(MWEIGHTS).sort();
    var pr = mReadProfile();
    var vals = keys.map(function (k) { return MWEIGHTS[k]; });
    if (which === 'weight') {
      if (vals.length < 2) return { need: 'Two mornings on the scale and this draws.' };
      var plan = [];
      var okPlan = true;
      keys.forEach(function (k) {
        var pw = mPlanWeight(k, pr);
        if (!pw) okPlan = false; else plan.push(pw.lb);
      });
      /* No limits on this one. Baseline limits held across a cut saturate —
         you leave the band in week two and every morning after is "outside",
         which flags thirty points and means none of them. Weight is the chart
         you came to look at; Off plan is the one that signals. */
      return {
        v: vals, keys: keys, lim: null, plan: okPlan ? plan : null, dp: 1, trend: mcTrend(keys),
        say: function (v) { return v.toFixed(1) + ' lb'; },
        note: 'The line is your seven-day average, the one the plan reads; the dots are the mornings. ' +
          (okPlan ? 'The dashed line is the plan. The gap between them is the whole story.'
            : 'Name a weight and a date under the gear and the plan draws alongside.')
      };
    }
    if (which === 'off') {
      var res = [], ok2 = true;
      keys.forEach(function (k) {
        var pw = mPlanWeight(k, pr);
        if (!pw) { ok2 = false; return; }
        res.push(Math.round((MWEIGHTS[k] - pw.lb) * 100) / 100);
      });
      if (!ok2 || res.length < 5) {
        return { need: ok2 ? 'Five mornings and this draws.'
          : 'This one needs a goal weight and a date, under the gear.' };
      }
      return { v: res, keys: keys, lim: mcLimits(res, keys), zero: true, dp: 1,
        say: function (v) { return Math.abs(v).toFixed(1) + ' lb ' + (v > 0 ? 'above' : v < 0 ? 'below' : 'on') + ' the plan'; },
        note: 'Zero is on pace. Above the line is losing slower than you meant to.' };
    }
    if (which === 'jump') {
      if (vals.length < 6) return { need: 'Six mornings and this draws.' };
      /* The pairs, not a bare list: a pair that straddled a gap is dropped
         now, so the keys have to come from the same filter or every point
         after the first missed morning is labelled with the wrong date. */
      var pairs = mcRangePairs(vals, keys);
      if (pairs.length < 5) return { need: 'Six mornings close together and this draws.' };
      var mr = pairs.map(function (pp) { return pp.r; });
      var mkeys = pairs.map(function (pp) { return pp.k; });
      var bar = mcMean(mr.slice(0, Math.min(21, mr.length)));
      /* Salty relative to YOUR days, not to a public ceiling. A storehouse
         pantry runs over 2,300 mg most days, so a fixed line marked every
         point on the chart and told you nothing. What moves the scale is a
         day well above your own usual, followed by a jump big enough to
         notice — both, or it is not an explanation. */
      var mine = [];
      Object.keys(MDAYS).forEach(function (dk) {
        var na = mSodiumOn(dk);
        if (na > 0) mine.push(na);
      });
      mine.sort(function (a, b) { return a - b; });
      var mid = mine.length ? mine[Math.floor(mine.length / 2)] : MSALT_DAY;
      var high = Math.max(MSALT_DAY, mid * 1.3);
      /* The day BEFORE the jump — found from the key the range ENDS on rather
         than from a parallel index, which only lined up while every pair
         survived. One dropped pair used to shift every salt flag after it by
         a day, quietly blaming the wrong dinner. */
      var salt = mkeys.map(function (k, i) {
        var at2 = keys.indexOf(k);
        return mr[i] > bar && at2 > 0 && mSodiumOn(keys[at2 - 1]) >= high;
      });
      return { v: mr, keys: mkeys, salt: salt, dp: 1,
        say: function (v) { return v.toFixed(1) + ' lb overnight'; },
        lim: { cl: bar, bar: bar, unpl: 3.268 * bar, lnpl: 0 },
        note: 'Overnight change. Ochre points follow a day well above your own usual salt.' };
    }
    if (vals.length < 15) return { need: 'A fortnight of mornings and this draws.' };
    var rate = [], rkeys = [];
    for (var i = 13; i < vals.length; i++) {
      rate.push(Math.round((mcMean(vals.slice(i - 6, i + 1)) -
        mcMean(vals.slice(i - 13, i - 6))) * 100) / 100);
      rkeys.push(keys[i]);
    }
    return { v: rate, keys: rkeys, lim: mcLimits(rate, rkeys), zero: true, dp: 1,
      say: function (v) { return (v > 0 ? '+' : v < 0 ? '\u2212' : '') + Math.abs(v).toFixed(1) + ' lb on the week before'; },
      note: 'A week against the week before it. A working cut sits below zero.' };
  }

  /* The seven-day average at every morning: the mornings in the seven days
     up to and including it, the same window mWeightStats reads for the plan,
     taken at each morning rather than only at the last. It is the line the
     weight chart draws, because a single morning is water and salt. */
  function mcTrend(keys) {
    var dayN = mDayN;
    return keys.map(function (k, i) {
      var n = dayN(k), sum = 0, c = 0;
      for (var j = i; j >= 0 && n - dayN(keys[j]) < 7; j--) { sum += MWEIGHTS[keys[j]]; c++; }
      return Math.round(sum / c * 100) / 100;
    });
  }

  /* The last month, three, six, or everything, counted back from today: a
     year of mornings on one line flattens this month's loss to nothing. The
     limits stay the ones the whole series set, so a range cannot move them. */
  var MC_RANGES = [['1m', '1M', 31], ['3m', '3M', 92], ['6m', '6M', 183], ['all', 'All', 0]];
  function mcInRange(sr, rng) {
    var days = 0;
    MC_RANGES.forEach(function (r) { if (r[0] === rng) days = r[2]; });
    if (!days || sr.need) return sr;
    var from = new Date(); from.setDate(from.getDate() - days);
    var fromK = dayKey(from), keep = [];
    sr.keys.forEach(function (k, i) { if (k >= fromK) keep.push(i); });
    var pick = function (a) { return a ? keep.map(function (i) { return a[i]; }) : a; };
    var out = {};
    Object.keys(sr).forEach(function (f) { out[f] = sr[f]; });
    out.v = pick(sr.v); out.keys = pick(sr.keys); out.plan = pick(sr.plan);
    out.trend = pick(sr.trend); out.salt = pick(sr.salt);
    return out;
  }

  /* Round numbers for an axis: a step of 1, 2, 2.5 or 5 of some power of
     ten, about n of them across the range — "208, 210, 212", never
     "207.6, 211.7, 215.8". */
  function mcNiceTicks(lo, hi, n) {
    var span = hi - lo || 1, raw = span / (n || 4);
    var mag = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), f = raw / mag;
    var step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * mag;
    var out = [];
    for (var v = Math.floor(lo / step) * step; v <= Math.ceil(hi / step) * step + step / 2; v += step) {
      out.push(Math.round(v * 1000) / 1000);
    }
    return out;
  }

  /* Drawn to be read on a phone: spaced by date, so a week off the scale
     looks like a week; the axis on round numbers; a viewBox about a phone's
     width, so its type is the size it says; and a finger on it (or a drag
     along it) reads the morning under it out above the chart, with a ring on
     the point. The weight chart draws the seven-day average as its line and
     each morning as a faint dot; the others draw their own values. */
  function mcChartSVG(sr) {
    var W = 350, H = 200, PL = 42, PR = 10, PT = 12, PB = 26;
    var all = sr.v.slice();
    if (sr.trend) all = all.concat(sr.trend);
    if (sr.plan) all = all.concat(sr.plan);
    if (sr.lim) { all.push(sr.lim.unpl); all.push(sr.lim.lnpl); }
    if (sr.zero) all.push(0);
    var tk = mcNiceTicks(Math.min.apply(null, all), Math.max.apply(null, all), 4);
    if (tk.length < 2) tk = [tk[0] - 1, tk[0] + 1];
    var lo = tk[0], hi = tk[tk.length - 1], step = tk[1] - tk[0];
    var dayN = mDayN;
    var t0 = dayN(sr.keys[0]), t1 = dayN(sr.keys[sr.keys.length - 1]);
    var px = function (i) {
      var t = dayN(sr.keys[i]);
      return t1 > t0 ? PL + (t - t0) / (t1 - t0) * (W - PL - PR) : (PL + W - PR) / 2;
    };
    var py = function (v) { return PT + (H - PT - PB) * (1 - (v - lo) / (hi - lo)); };
    var tick = function (v) { return step < 1 ? v.toFixed(1) : String(Math.round(v)); };
    var out = [];
    var rule = function (v, cls) {
      out.push('<line x1="' + PL + '" x2="' + (W - PR) + '" y1="' + py(v).toFixed(1) +
        '" y2="' + py(v).toFixed(1) + '" class="' + cls + '"/>');
    };
    tk.forEach(function (v) {
      rule(v, 'mc-grid');
      out.push('<text x="' + (PL - 6) + '" y="' + (py(v) + 4).toFixed(1) +
        '" text-anchor="end" class="mc-ax">' + tick(v) + '</text>');
    });
    if (sr.zero) rule(0, 'mc-zero');
    if (sr.lim) { rule(sr.lim.unpl, 'mc-lim'); rule(sr.lim.lnpl, 'mc-lim'); rule(sr.lim.cl, 'mc-cl'); }
    var line = function (vals, cls) {
      out.push('<polyline class="' + cls + '" points="' + vals.map(function (v, i) {
        return px(i).toFixed(1) + ',' + py(v).toFixed(1); }).join(' ') + '"/>');
    };
    if (sr.plan) line(sr.plan, 'mc-plan');
    line(sr.trend || sr.v, sr.trend ? 'mc-line mc-trend' : 'mc-line');
    var say = function (i) {
      return mPretty(sr.keys[i]) + ' · ' + (sr.say ? sr.say(sr.v[i]) : sr.v[i].toFixed(sr.dp)) +
        (sr.trend ? ' · average ' + sr.trend[i].toFixed(1) : '');
    };
    sr.v.forEach(function (v, i) {
      var out2 = sr.lim && (v > sr.lim.unpl || v < sr.lim.lnpl);
      var sa = sr.salt && sr.salt[i];
      out.push('<circle cx="' + px(i).toFixed(1) + '" cy="' + py(v).toFixed(1) + '" r="' +
        (out2 || sa ? 3.6 : sr.trend ? 2.4 : 2.2) + '" class="' +
        (sa ? 'mc-salt' : out2 ? 'mc-sig' : sr.trend ? 'mc-day' : 'mc-dot') + '"><title>' +
        esc(mPretty(sr.keys[i])) + ' · ' + v.toFixed(sr.dp) + '</title></circle>');
    });
    out.push('<circle class="mc-hl" r="6.5" cx="-20" cy="-20"/>');
    [0, sr.v.length - 1].forEach(function (i) {
      if (i === 0 && sr.v.length === 1) return;
      out.push('<text x="' + px(i).toFixed(1) + '" y="' + (H - 7) + '" text-anchor="' +
        (i ? 'end' : 'start') + '" class="mc-ax">' + esc(mPretty(sr.keys[i])) + '</text>');
    });
    var pts = sr.v.map(function (v, i) {
      return [Math.round(px(i) * 10) / 10, Math.round(py(v) * 10) / 10, say(i)];
    });
    return '<div class="mc-read" aria-live="polite">Latest: ' + esc(say(sr.v.length - 1)) + '</div>' +
      '<svg class="mc-svg" viewBox="0 0 ' + W + ' ' + H + '" data-pts="' + esc(JSON.stringify(pts)) +
      '" role="img" aria-label="' + esc(sr.note) + '">' + out.join('') + '</svg>';
  }
  // the finger on a chart: the morning nearest it, read out and ringed
  function mcRead(svg, clientX) {
    var pts;
    try { pts = JSON.parse(svg.getAttribute('data-pts') || '[]'); } catch (e) { return; }
    if (!pts.length) return;
    var r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
    var x = (clientX - r.left) / r.width * vb.width, near = pts[0];
    pts.forEach(function (q) { if (Math.abs(q[0] - x) < Math.abs(near[0] - x)) near = q; });
    var hl = svg.querySelector('.mc-hl'), rd = svg.parentNode.querySelector('.mc-read');
    if (hl) { hl.setAttribute('cx', near[0]); hl.setAttribute('cy', near[1]); }
    if (rd && rd.textContent !== near[2]) rd.textContent = near[2];
  }

  function macroChartHTML() {
    if (S.chartWhich === 'recomp') {
      return '<div class="scrim no-print" data-close="1">' +
        '<div class="sheet mc-sheet" role="dialog" aria-modal="true" aria-label="The numbers over time">' +
          '<div class="sheet-top">' +
            '<div class="sheet-eyebrow">Over time</div>' +
            '<button class="sheet-x" data-close="1" aria-label="Close">&times;</button>' +
          '</div>' +
          '<div class="mc-tabs">' + MC_KEYS.map(function (t) {
            return '<button data-mchart="' + t[0] + '" aria-pressed="' +
              (S.chartWhich === t[0] ? 'true' : 'false') + '">' + t[1] + '</button>';
          }).join('') + '</div>' +
          mcRecompHTML() +
        '</div></div>';
    }
    var full = mcSeries(S.chartWhich);
    var rng = S.mcRange || 'all';
    var sr = mcInRange(full, rng);
    var body = full.need
      ? '<div class="mslot-empty">' + esc(full.need) + '</div>'
      : sr.v.length < 2
        ? '<div class="mslot-empty">Fewer than two mornings in this range. Pick a longer one.</div>'
        : mcChartSVG(sr);
    var why = full.need ? '' : esc(full.note) +
      (full.lim ? ' Limits ' + full.lim.lnpl.toFixed(1) + ' to ' + full.lim.unpl.toFixed(1) +
        ', from the first three weeks: a point outside them is a change rather than a Tuesday.' : '');
    return '<div class="scrim no-print" data-close="1">' +
      '<div class="sheet mc-sheet" role="dialog" aria-modal="true" aria-label="The numbers over time">' +
        '<div class="sheet-top">' +
          '<div class="sheet-eyebrow">Over time</div>' +
          '<button class="sheet-x" data-close="1" aria-label="Close">&times;</button>' +
        '</div>' +
        '<div class="mc-tabs">' + MC_KEYS.map(function (t) {
          return '<button data-mchart="' + t[0] + '" aria-pressed="' +
            (S.chartWhich === t[0] ? 'true' : 'false') + '">' + t[1] + '</button>';
        }).join('') + '</div>' +
        (full.need ? '' : '<div class="mc-rng">' + MC_RANGES.map(function (r) {
          return '<button data-mcrng="' + r[0] + '" aria-pressed="' + (rng === r[0]) + '">' + r[1] + '</button>';
        }).join('') + mInfoBtn('mc-' + S.chartWhich, 'What this chart shows') + '</div>' +
          mInfoText('mc-' + S.chartWhich, why, 'mc-note')) +
        body +
      '</div></div>';
  }

  return { mcDaysApart: mcDaysApart, mcRead: mcRead, macroChartHTML: macroChartHTML, MC_GAP: MC_GAP };
};
