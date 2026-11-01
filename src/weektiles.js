/* Your week in charts, under My Day's week strip (mWeekTilesHTML): six tiles
 * for the week on screen — weight, calories, protein, sleep, steps, water —
 * each a number with the week drawn under it. Folded behind one button by
 * default, so My Day starts on the meals as it always has; the phone
 * remembers whether you leave it open. The longer account is with the code.
 *
 * A part of app.js (Nourish) in a file of its own. app.js calls
 * HiveParts.weektiles(app) once, as it starts, and keeps what it gives back
 * under the same names. Loaded before app.js.
 */
(window.HiveParts = window.HiveParts || {}).weektiles = function (app) {
  'use strict';

  // what it reads of the app's
  var dayKey = app.dayKey;
  var keyDate = app.keyDate;
  var todayKey = app.todayKey;
  var mWaterOz = app.mWaterOz;
  var mWaterGoalOz = app.mWaterGoalOz;
  var mReadProfile = app.mReadProfile;

  function fin(v) { return typeof v === 'number' && isFinite(v); }
  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }
  function mean(a) { return a.length ? a.reduce(function (s, v) { return s + v; }, 0) / a.length : 0; }

  /* Blake, 2026-11-01: "Add mini charts or spark lines in some of the data
     boxes in Nourish", and, asked where: only in the week view, so My Day is
     not made longer to scroll past on the way to breakfast. Turned on from
     the menu (Week in charts) and off from the panel's own Hide: folded, it
     takes no room at all. It was a button under the strip first, and that
     row alone was enough to push a phone's first meal off the screen. */
  var OPEN_KEY = 'bsc.weekTiles';
  function isOpen() { try { return localStorage.getItem(OPEN_KEY) === '1'; } catch (e) { return false; } }
  function setOpen(on) { try { localStorage.setItem(OPEN_KEY, on ? '1' : '0'); } catch (e) { /* this session only */ } }

  // a week as a line, with a dot on the last day that has one
  function line(vals, t, cls) {
    var pts = [];
    vals.forEach(function (v, i) { if (fin(v)) pts.push([i, v]); });
    if (pts.length < 2) return '<div class="mwt-none">Not enough this week yet</div>';
    var W = 140, H = 30, ys = pts.map(function (q) { return q[1]; });
    var lo = Math.min.apply(null, ys), hi = Math.max.apply(null, ys);
    if (fin(t)) { lo = Math.min(lo, t); hi = Math.max(hi, t); }
    if (hi - lo < 1e-9) { hi += 1; lo -= 1; }
    var x = function (i) { return 3 + i * (W - 6) / 6; }, y = function (v) { return 3 + (hi - v) / (hi - lo) * (H - 6); };
    var d = pts.map(function (q, i) { return (i ? 'L' : 'M') + x(q[0]).toFixed(1) + ' ' + y(q[1]).toFixed(1); }).join(' ');
    var last = pts[pts.length - 1];
    return '<svg class="mwt-sp ' + (cls || '') + '" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' +
      (fin(t) ? '<line x1="0" x2="' + W + '" y1="' + y(t).toFixed(1) + '" y2="' + y(t).toFixed(1) + '" class="mwt-t"/>' : '') +
      '<path d="' + d + ' L' + x(last[0]).toFixed(1) + ' ' + H + ' L' + x(pts[0][0]).toFixed(1) + ' ' + H + ' Z" class="mwt-a"/>' +
      '<path d="' + d + '" class="mwt-l"/><circle cx="' + x(last[0]).toFixed(1) + '" cy="' + y(last[1]).toFixed(1) + '" r="2.8" class="mwt-d"/></svg>';
  }
  /* A bar a day. With a target, a day within a tenth of it (or past it, for
     the ones where more is the point) is green, else ochre; a day not yet
     come or not logged is a flat stub, not a zero bar. */
  function bars(vals, t, atLeast, cls) {
    if (!vals.some(function (v) { return v > 0; })) return '<div class="mwt-none">Nothing logged this week yet</div>';
    var W = 140, H = 30, bw = W / 7, hi = Math.max.apply(null, vals.concat([fin(t) ? t : 0])) * 1.08, out = '';
    vals.forEach(function (v, i) {
      if (!(v > 0)) { out += '<rect x="' + (i * bw + 2).toFixed(1) + '" y="' + (H - 1.5) + '" width="' + (bw - 4).toFixed(1) + '" height="1.5" class="mwt-z"/>'; return; }
      var bh = Math.max(2, v / hi * (H - 2)), ok = !fin(t) || (atLeast ? v >= 0.9 * t : Math.abs(v / t - 1) <= 0.1);
      out += '<rect x="' + (i * bw + 2).toFixed(1) + '" y="' + (H - bh).toFixed(1) + '" width="' + (bw - 4).toFixed(1) + '" height="' + bh.toFixed(1) + '" rx="2" class="' + (ok ? 'mwt-ok' : 'mwt-off') + '"/>';
    });
    var ty = fin(t) && t > 0 ? (H - t / hi * (H - 2)).toFixed(1) : null;
    return '<svg class="mwt-sp ' + (cls || '') + '" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' + out +
      (ty ? '<line x1="0" x2="' + W + '" y1="' + ty + '" y2="' + ty + '" class="mwt-t"/>' : '') + '</svg>';
  }
  function tile(k, v, unit, sub, chart, say) {
    return '<div class="mwt-tile" role="group" aria-label="' + say + '"><div class="mwt-k">' + k + '</div>' +
      '<div class="mwt-v">' + v + (unit ? ' <small>' + unit + '</small>' : '') + '</div>' + chart +
      '<div class="mwt-s">' + sub + '</div></div>';
  }

  function mWeekTilesHTML(k) {
    if (!isOpen()) return '';
    var btn = '<div class="mwt-h"><span>Your week in charts</span><button class="nut-ask no-print" data-mwtiles="1">Hide</button></div>';
    // the strip's week: Monday to Sunday around the day on screen, nothing past today
    var cur = keyDate(k), mon = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate());
    mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
    var keys = [], tk = todayKey();
    for (var i = 0; i < 7; i++) keys.push(dayKey(new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + i)));
    var H = window.Hive, pr = null;
    try { pr = H && H.progress ? H.progress(keys[0], keys[6] < tk ? keys[6] : tk) : null; } catch (e) { pr = null; }
    var by = {};
    (pr ? pr.days : []).forEach(function (d) { by[d.k] = d; });
    var col = function (f) { return keys.map(function (dk) { var d = by[dk]; return d && fin(d[f]) ? d[f] : null; }); };
    var w = col('w'), kc = col('kc'), p = col('p'), sl = col('sl'), sy = col('sy');
    var tkc = mean(keys.map(function (dk) { return by[dk] && by[dk].tk; }).filter(function (v) { return v > 0; }));
    var tp = mean(keys.map(function (dk) { return by[dk] && by[dk].tp; }).filter(function (v) { return v > 0; }));
    var water = keys.map(function (dk) { return dk <= tk ? mWaterOz(dk) || 0 : 0; });
    var prof = mReadProfile(), goalOz = mWaterGoalOz(prof && prof.lb > 0 ? prof.lb : 0);
    var has = function (a) { return a.filter(fin); };
    var wv = has(w), kv = has(kc), pv = has(p), sv = has(sl), yv = has(sy), ov = water.filter(function (v) { return v > 0; });
    var near = function (a, t, lo) { return a.filter(function (v) { return lo ? v >= 0.9 * t : Math.abs(v / t - 1) <= 0.1; }).length; };
    var slH = function (h) { var hh = Math.floor(h), mm = Math.round((h - hh) * 60); return hh + 'h ' + (mm < 10 ? '0' : '') + mm + 'm'; };
    var tiles =
      tile('Weight', wv.length ? (Math.round(mean(wv) * 10) / 10) : '—', wv.length ? 'lb avg' : '',
        wv.length >= 2 ? ((wv[wv.length - 1] - wv[0] <= 0 ? '▼ ' : '▲ ') + Math.abs(Math.round((wv[wv.length - 1] - wv[0]) * 10) / 10) + ' this week') : 'Weigh in to see the line',
        line(w), 'Weight this week') +
      tile('Calories', kv.length ? fmt(mean(kv)) : '—', kv.length ? 'avg' : '',
        kv.length && tkc ? near(kv, tkc) + ' of ' + kv.length + ' days within 10%' : 'Log food to see the week',
        bars(kc.map(function (v) { return v || 0; }), tkc || null), 'Calories this week') +
      tile('Protein', pv.length ? fmt(mean(pv)) : '—', pv.length ? 'g avg' : '',
        pv.length && tp ? near(pv, tp, true) + ' of ' + pv.length + ' days at ' + fmt(tp) + ' g' : 'Log food to see the week',
        bars(p.map(function (v) { return v || 0; }), tp || null, true), 'Protein this week') +
      tile('Sleep', sv.length ? slH(mean(sv)) : '—', sv.length ? 'avg' : '',
        sv.length ? sv.filter(function (h) { return h >= 7; }).length + ' of ' + sv.length + ' nights at 7h+' : 'Fill in the morning check-in',
        bars(sl.map(function (v) { return v || 0; }), 7, true, 'mwt-sleep'), 'Sleep this week') +
      tile('Steps', yv.length ? fmt(mean(yv)) : '—', yv.length ? 'a day' : '',
        yv.length ? yv.filter(function (n) { return n >= 8000; }).length + ' of ' + yv.length + ' days at 8,000+' : 'Fill in the morning check-in',
        line(sy, 8000, 'mwt-g'), 'Steps this week') +
      tile('Water', ov.length ? fmt(mean(ov)) : '—', ov.length ? 'oz avg' : '',
        ov.length && goalOz ? near(ov, goalOz, true) + ' of ' + ov.length + ' days at ' + fmt(goalOz) + ' oz' : 'Log water to see the week',
        bars(water, goalOz || null, true, 'mwt-water'), 'Water this week');
    return btn + '<div class="mwt-grid">' + tiles + '</div>';
  }
  function mWeekTilesToggle() { setOpen(!isOpen()); }

  return { mWeekTilesHTML: mWeekTilesHTML, mWeekTilesToggle: mWeekTilesToggle };
};
