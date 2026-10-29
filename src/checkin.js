/* The morning check-in, under the weigh-in: last night's sleep, yesterday's
 * steps, this morning's creatine and the day's caffeine counted by the drink
 * (MAM, mCheckinHTML, mCheckinClick, mCheckinInput), the line Today says it
 * in (mAmSum), and what Strengthen's Review reads back (mAmOf, mAmDays). The
 * drinks are yours: the ones you use, at the milligrams you set (MDRINKS).
 * The longer account is with the code.
 *
 * A part of app.js (Nourish) in a file of its own. app.js calls
 * HiveParts.checkin(app) once, as it starts, and keeps what it gives back
 * under the same names. Loaded before app.js.
 */
(window.HiveParts = window.HiveParts || {}).checkin = function (app) {
  'use strict';

  // what it reads of the app's
  var S = app.S;
  var mFoldDue = app.mFoldDue;
  var mPut = app.mPut;
  var mStamp = app.mStamp;
  var keyDate = app.keyDate;
  var dayKey = app.dayKey;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function plain(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }
  function fin(v) { return typeof v === 'number' && isFinite(v); }

  /* ---- the store ----
   *
     One record a morning, beside the weigh-in and synced the same way: per
     morning, newest wins (the 'am' row in MSYNC_KEYED). Blake asked for the
     four things the research says move a cut — sleep, steps, creatine and
     caffeine — typed in until a Fitbit can hand them over, and asked for them
     in the place he already stops every morning: "One place to do it all as
     far as stats go."
   *
       sl  hours slept last night, to the quarter hour
       sy  steps YESTERDAY. This morning's count is near nothing, so the
           morning asks about the day that has finished. Review moves it back
           onto that day before comparing it with anything.
       cr  creatine taken: 1, or 0 for "not today" (zero is an answer, as it
           is for the training tick, so a phone can un-say it to another)
       cf  drinks: { drink id: how many }
   *
     A field left out has not been answered, which is not the same as zero:
     a morning you skipped the check-in must be a gap on Review's charts, not
     a night of no sleep. */
  var MAM = (function () {
    try {
      var v = JSON.parse(localStorage.getItem('bsc.macroAm'));
      if (plain(v)) return v;
    } catch (e) { /* fall through */ }
    return {};
  })();
  function mAmOf(k) { return plain(MAM[k]) ? MAM[k] : {}; }
  function mAmWrite(k, field, v) {
    mFoldDue();
    var rec = Object.assign({}, mAmOf(k));
    if (v === undefined) delete rec[field]; else rec[field] = v;
    if (Object.keys(rec).length) MAM[k] = rec; else delete MAM[k];
    mPut('bsc.macroAm', MAM);
    mStamp('am', k);
  }
  /* What another phone sent is let in only in this shape, field by field, so
     a stray string cannot reach a chart (mydayparts.js runs it). */
  function mAmClean(v) {
    if (!plain(v)) return null;
    var out = {};
    if (fin(v.sl) && v.sl >= 0 && v.sl <= 24) out.sl = v.sl;
    if (fin(v.sy) && v.sy >= 0 && v.sy <= 200000) out.sy = Math.round(v.sy);
    if (v.cr === 0 || v.cr === 1) out.cr = v.cr;
    if (fin(v.wt) && v.wt >= 0 && v.wt <= 500) out.wt = Math.round(v.wt);
    if (plain(v.cf)) {
      var cf = {};
      Object.keys(v.cf).forEach(function (id) {
        var n = v.cf[id];
        if (/^[a-z0-9_]{1,24}$/.test(id) && fin(n) && n > 0 && n <= 40) cf[id] = Math.round(n);
      });
      if (Object.keys(cf).length) out.cf = cf;
    }
    return out;
  }

  function mWaterGoalOz(lb) {
    var n = fin(lb) && lb > 60 ? Math.round((lb * 0.5) / 5) * 5 : 100;
    return Math.max(64, Math.min(160, n));
  }

  /* ---- the drinks ----
   *
     Milligrams are the ordinary cup, and yours to change, because the one
     drink in this list Blake actually drinks is not coffee. Crio Bru is brewed
     cacao: about 10 mg of caffeine a cup (about decaf), and theobromine,
     which is what it advertises. Theobromine is a milder, slower stimulant
     and is not counted — the 400 mg ceiling and the sleep research are both
     about caffeine. Asked "does it count?", the honest answer is "barely".
   *
     Only the drinks you use are on the card (`on`), with "Add a drink" for
     the rest. Four counters for drinks you never have was a card twice the
     height of the weigh-in it sits under. */
  var DRINKS0 = [
    { id: 'crio', n: 'Crio Bru', mg: 10 },
    { id: 'coffee', n: 'Coffee', mg: 95 },
    { id: 'pre', n: 'Pre-workout', mg: 200 },
    { id: 'energy', n: 'Energy drink', mg: 160 },
    { id: 'soda', n: 'Diet soda', mg: 45 },
    { id: 'tea', n: 'Black tea', mg: 47 }
  ];
  function mDrinksClean(v) {
    if (!plain(v) || !Array.isArray(v.list)) return null;
    var seen = {};
    var list = v.list.filter(function (d) {
      var ok = plain(d) && /^[a-z0-9_]{1,24}$/.test(d.id) && !seen[d.id] && typeof d.n === 'string' &&
        d.n.trim() && fin(d.mg) && d.mg >= 0 && d.mg <= 1000;
      if (ok) seen[d.id] = 1;
      return ok;
    }).map(function (d) { return { id: d.id, n: d.n.trim().slice(0, 30), mg: Math.round(d.mg) }; });
    var on = Array.isArray(v.on) ? v.on.filter(function (id) { return seen[id]; }) : [];
    return { list: list, on: on };
  }
  function mDrinks() {
    var v = null;
    try { v = mDrinksClean(JSON.parse(localStorage.getItem('bsc.macroDrinks'))); } catch (e) { v = null; }
    return v || { list: DRINKS0.map(function (d) { return Object.assign({}, d); }), on: [] };
  }
  function mDrinksWrite(v) {
    mFoldDue();
    mPut('bsc.macroDrinks', v);
    mStamp('dk');
  }
  // the drinks on the card this morning: the ones you use, and any counted today
  function mDrinksShown(k) {
    var dk = mDrinks(), cf = mAmOf(k).cf || {};
    return dk.list.filter(function (d) { return dk.on.indexOf(d.id) >= 0 || cf[d.id] > 0; });
  }
  function mCafMg(k) {
    var dk = mDrinks(), cf = mAmOf(k).cf || {}, mg = 0;
    dk.list.forEach(function (d) { mg += (cf[d.id] || 0) * d.mg; });
    return mg;
  }

  /* ---- what it says ---- */
  function mSleepTxt(h) {
    var hh = Math.floor(h), mm = Math.round((h - hh) * 60);
    if (mm === 60) { hh++; mm = 0; }
    return hh + 'h ' + (mm < 10 ? '0' : '') + mm + 'm';
  }
  function mKeyBack(k, n) { var d = keyDate(k); d.setDate(d.getDate() - n); return dayKey(d); }
  // the average of the mornings before this one that said, over a week
  function mStepsAvg(k) {
    var sum = 0, n = 0;
    for (var i = 1; i <= 7; i++) {
      var r = mAmOf(mKeyBack(k, i));
      if (fin(r.sy)) { sum += r.sy; n++; }
    }
    return n >= 3 ? Math.round(sum / n) : 0;
  }
  // mornings in a row with creatine, this one included once it is said
  function mCreStreak(k) {
    var n = 0, i = mAmOf(k).cr === 1 ? 0 : 1;
    for (; i < 400; i++) {
      if (mAmOf(mKeyBack(k, i)).cr === 1) n++; else break;
    }
    return n;
  }
  function mStepsTxt(n) { return Math.round(n).toLocaleString('en-US'); }
  function mStepsShort(n) { return n >= 10000 ? Math.round(n / 1000) + 'k' : n >= 1000 ? (Math.round(n / 100) / 10) + 'k' : String(n); }

  /* The line Today carries under the weigh-in: whatever was answered, in the
     order the card asks. Nothing said is nothing shown. */
  function mAmSum(k) {
    var r = mAmOf(k), out = [];
    if (fin(r.sl)) out.push(mSleepTxt(r.sl) + ' sleep');
    if (fin(r.sy)) out.push(mStepsShort(r.sy) + ' steps');
    if (r.cr === 1) out.push('creatine ✓');
    if (fin(r.wt) && r.wt > 0) out.push(r.wt + ' oz water');
    var mg = mCafMg(k);
    if (mg > 0) out.push(mg + ' mg caffeine');
    return out.join(' · ');
  }

  /* ---- the card ----
   *
     Rows under the weigh-in box, on the card itself, so it is one stop and
     not two. Each row's own control saves as it changes; there is no Save. */
  function row(label, sub, ctl, cls) {
    return '<div class="am-row' + (cls ? ' ' + cls : '') + '"><span class="am-l"><span>' + label + '</span>' +
      (sub ? '<small>' + sub + '</small>' : '') + '</span>' + ctl + '</div>';
  }
  function mDrinksRowsHTML(shown, cf, inHyd) {
    var attr = inHyd ? 'data-hyd' : 'data-am';
    return shown.map(function (d) {
      var c = cf[d.id] || 0, low = d.n.toLowerCase();
      return '<div class="am-drink"><span><b>' + esc(d.n) + '</b><small>' + d.mg + ' mg</small></span>' +
        '<button class="am-b" ' + attr + '="cf:' + d.id + ':-1" aria-label="One less ' + esc(low) + '"' + (c ? '' : ' disabled') + '>−</button>' +
        '<b class="am-n">' + c + '</b>' +
        '<button class="am-b" ' + attr + '="cf:' + d.id + ':1" aria-label="One more ' + esc(low) + '">+</button></div>';
    }).join('');
  }
  function mCheckinHTML(k) {
    var r = mAmOf(k);
    // sleep: a stepper by the quarter hour, from 7 the first time it is touched
    var sl = fin(r.sl);
    var sleepSay = !sl ? 'Tap + or − to set'
      : r.sl >= 7 ? '7–9 hours protects muscle on a cut'
      : 'Under 7 hours: on a cut, short sleep costs muscle';
    var sleep = row('Sleep last night', sleepSay,
      '<span class="am-step"><button class="am-b" data-am="sl:-1" aria-label="Less sleep">−</button>' +
        '<b aria-live="polite">' + (sl ? mSleepTxt(r.sl) : '—') + '</b>' +
        '<button class="am-b" data-am="sl:1" aria-label="More sleep">+</button></span>', sl && r.sl < 7 ? 'am-short' : '');
    /* Steps in a text box with the number keypad, for the same reason the
       weight box is one: a number input swallows a comma before any script
       sees it, and "8,412" is how a step count is written. */
    var avg = mStepsAvg(k);
    var hasSy = fin(r.sy);
    var steps = row('<label for="amSteps">Steps yesterday</label>', avg ? '7-day average ' + mStepsTxt(avg) : '',
      '<span class="am-step-in"><input type="text" id="amSteps" class="am-in" inputmode="numeric" maxlength="7" autocomplete="off" value="' +
        (hasSy ? mStepsTxt(r.sy) : '') + '" placeholder="0">' +
        '<button type="button" class="am-save' + (hasSy ? ' saved' : '') + '" data-am="sysave" aria-label="Save steps">' +
        (hasSy ? 'Saved ✓' : 'Save') + '</button></span>');
    var streak = mCreStreak(k);
    var cre = row('Creatine', streak >= 2 ? streak + ' days in a row' : '',
      '<button class="am-tog" data-am="cr" aria-pressed="' + (r.cr === 1) + '">' + (r.cr === 1 ? 'Taken ✓' : 'Not yet') + '</button>');
    var shown = mDrinksShown(k), cf = r.cf || {}, mg = mCafMg(k);
    var drinks = mDrinksRowsHTML(shown, cf, false);
    var caf = '<div class="am-caf">' +
      row('Caffeine today', mg ? mg + ' mg' + (mg > 400 ? ' · over the usual 400 mg ceiling' : '') : shown.length ? '' : 'Add the drinks you have', '', 'am-cafh') +
      (drinks ? '<div class="am-drinks">' + drinks + '</div>' : '') +
      (S.amAdd ? mDrinkPanelHTML(false) : '<button class="nut-ask am-add" data-am="add">Add a drink</button>') +
      '</div>';
    return '<div class="am no-print" data-amkey="' + k + '">' + sleep + steps + cre + caf + '</div>';
  }
  /* Dedicated Water & Drinks card for Nourish day view (src/myday.js):
     ounces of water with +8 / +16 / +24 / −8 oz 1-tap controls and live
     caffeine drink counters in one place alongside meals. */
  function mHydrationCardHTML(k, goalOz) {
    var r = mAmOf(k);
    var wt = fin(r.wt) ? r.wt : 0;
    var goal = mWaterGoalOz(goalOz ? goalOz * 2 : 200);
    if (fin(goalOz) && goalOz >= 40 && goalOz <= 200) goal = Math.round(goalOz);
    var pct = goal > 0 ? Math.max(0, Math.min(100, Math.round(wt / goal * 100))) : 0;
    var shown = mDrinksShown(k), cf = r.cf || {}, mg = mCafMg(k);
    var drinks = mDrinksRowsHTML(shown, cf, true);
    return '<section class="mhyd-card no-print" data-amkey="' + esc(k) + '" aria-label="Water and drinks">' +
      '<div class="mhyd-head">' +
        '<span class="mhyd-title"><svg class="mhyd-ic" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.5C10 2.5 4.5 8.6 4.5 12.6a5.5 5.5 0 0 0 11 0C15.5 8.6 10 2.5 10 2.5Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>' +
          '<b>Water &amp; Drinks</b></span>' +
        '<span class="mhyd-badges">' +
          '<span class="mhyd-pill' + (wt >= goal ? ' hit' : '') + '"><b>' + wt + '</b> / ' + goal + ' oz' + (wt >= goal ? ' ✓' : '') + '</span>' +
          (mg > 0 ? '<span class="mhyd-pill caf' + (mg > 400 ? ' over' : '') + '"><b>' + mg + '</b> mg caf</span>' : '') +
        '</span>' +
      '</div>' +
      '<div class="mhyd-meter" role="meter" aria-label="Water intake" aria-valuemin="0" aria-valuemax="' + goal + '" aria-valuenow="' + wt + '">' +
        '<i style="width:' + pct + '%"></i>' +
      '</div>' +
      '<div class="mhyd-water-btns">' +
        '<button type="button" class="mhyd-wbtn" data-hyd="wt:8" aria-label="Add 8 oz water"><b>+8 oz</b><small>cup</small></button>' +
        '<button type="button" class="mhyd-wbtn" data-hyd="wt:16" aria-label="Add 16 oz water"><b>+16 oz</b><small>bottle</small></button>' +
        '<button type="button" class="mhyd-wbtn" data-hyd="wt:24" aria-label="Add 24 oz water"><b>+24 oz</b><small>shaker</small></button>' +
        '<button type="button" class="mhyd-wbtn mhyd-wsub" data-hyd="wt:-8" aria-label="Remove 8 oz water"' + (wt > 0 ? '' : ' disabled') + '><b>−8 oz</b></button>' +
      '</div>' +
      '<div class="mhyd-caf">' +
        '<div class="mhyd-caf-h"><span class="mhyd-caf-t">Caffeine today</span>' +
          '<span class="mhyd-caf-s">' + (mg ? mg + ' mg' + (mg > 400 ? ' · over the usual 400 mg ceiling' : '') : shown.length ? '0 mg' : 'Tap Add a drink for Crio Bru, Coffee, Pre-workout…') + '</span></div>' +
        (drinks ? '<div class="am-drinks">' + drinks + '</div>' : '') +
        (S.hydAdd ? mDrinkPanelHTML(true) : '<button type="button" class="nut-ask am-add" data-hyd="hadd">' + (shown.length ? 'Edit or add drinks' : '+ Add a drink') + '</button>') +
      '</div>' +
    '</section>';
  }
  /* Your drinks, their milligrams, and a new one. The milligrams are edited
     here rather than in a settings screen of their own, because this is the
     only place a drink is ever used. */
  function mDrinkPanelHTML(inHyd) {
    var dk = mDrinks();
    var mine = dk.list.filter(function (d) { return dk.on.indexOf(d.id) >= 0; });
    var rest = dk.list.filter(function (d) { return dk.on.indexOf(d.id) < 0; });
    var attr = inHyd ? 'data-hyd' : 'data-am';
    var mgAttr = inHyd ? 'data-hydmg' : 'data-ammg';
    var nId = inHyd ? 'hydNewN' : 'amNewN';
    var mId = inHyd ? 'hydNewMg' : 'amNewMg';
    var noteId = inHyd ? 'hydNote' : 'amNote';
    var doneAct = inHyd ? 'hdone' : 'done';
    return '<div class="am-panel">' +
      (mine.length ? '<div class="am-ph">Your drinks</div>' + mine.map(function (d) {
        return '<div class="am-prow"><span>' + esc(d.n) + '</span>' +
          '<label class="am-mg"><input type="text" class="am-in" inputmode="numeric" maxlength="4" ' + mgAttr + '="' + d.id + '" value="' + d.mg + '" ' +
            'aria-label="Caffeine in a ' + esc(d.n.toLowerCase()) + ', mg"> mg</label>' +
          '<button class="nut-ask" ' + attr + '="off:' + d.id + '">Hide</button></div>';
      }).join('') : '') +
      (rest.length ? '<div class="am-ph">Add</div><div class="am-chips">' + rest.map(function (d) {
        return '<button class="am-chip" ' + attr + '="on:' + d.id + '">' + esc(d.n) + ' <small>' + d.mg + ' mg</small></button>';
      }).join('') + '</div>' : '') +
      '<div class="am-ph">A drink of your own</div>' +
      '<div class="am-prow am-new"><input type="text" class="am-in am-nn" id="' + nId + '" maxlength="30" placeholder="Name" aria-label="Drink name">' +
        '<label class="am-mg"><input type="text" class="am-in am-new-mg" id="' + mId + '" inputmode="numeric" maxlength="4" placeholder="mg" aria-label="Caffeine, mg"> mg</label>' +
        '<button class="ghost" ' + attr + '="new">Add</button></div>' +
      '<span class="am-note" id="' + noteId + '" role="status"></span>' +
      '<button class="nut-ask am-add" ' + attr + '="' + doneAct + '">Done</button></div>';
  }

  /* A tap on the card. True when it was one of these, so the card's other
     handler can leave it alone; the caller redraws. */
  function mCheckinClick(b, k) {
    var raw = b.getAttribute('data-am') || b.getAttribute('data-hyd') || '';
    var a = raw.split(':'), r = mAmOf(k);
    if (a[0] === 'sl') {
      var h = fin(r.sl) ? r.sl + 0.25 * Number(a[1]) : 7;
      mAmWrite(k, 'sl', Math.max(0, Math.min(14, Math.round(h * 4) / 4)));
    } else if (a[0] === 'sysave') {
      var stIn = document.getElementById('amSteps');
      if (stIn) {
        if (!mCheckinInput(stIn, k)) return false;
        stIn.blur();
      }
    } else if (a[0] === 'cr') {
      mAmWrite(k, 'cr', r.cr === 1 ? 0 : 1);
    } else if (a[0] === 'wt') {
      var wNext = Math.max(0, Math.min(500, (fin(r.wt) ? r.wt : 0) + Number(a[1])));
      mAmWrite(k, 'wt', wNext > 0 ? Math.round(wNext) : undefined);
    } else if (a[0] === 'cf') {
      var cf = Object.assign({}, r.cf || {});
      cf[a[1]] = Math.max(0, Math.min(40, (cf[a[1]] || 0) + Number(a[2])));
      if (!cf[a[1]]) delete cf[a[1]];
      mAmWrite(k, 'cf', Object.keys(cf).length ? cf : undefined);
      /* A drink counted is a drink you use: it stays on the card. */
      var dk = mDrinks();
      if (Number(a[2]) > 0 && dk.on.indexOf(a[1]) < 0) { dk.on.push(a[1]); mDrinksWrite(dk); }
    } else if (a[0] === 'add') {
      S.amAdd = true;
    } else if (a[0] === 'done') {
      S.amAdd = false;
    } else if (a[0] === 'hadd') {
      S.hydAdd = true;
    } else if (a[0] === 'hdone') {
      S.hydAdd = false;
    } else if (a[0] === 'on' || a[0] === 'off') {
      var d2 = mDrinks();
      d2.on = d2.on.filter(function (id) { return id !== a[1]; });
      if (a[0] === 'on') d2.on.push(a[1]);
      mDrinksWrite(d2);
    } else if (a[0] === 'new') {
      var box = (b && b.closest && b.closest('.am-panel, .am, .mhyd-card')) || document;
      var nn = box.querySelector('.am-nn') || document.getElementById('amNewN');
      var nm = box.querySelector('.am-new-mg') || document.getElementById('amNewMg');
      var note = box.querySelector('.am-note') || document.getElementById('amNote');
      var name = nn ? nn.value.trim() : '', mgS = nm ? nm.value.trim() : '';
      if (!name || !/^\d{1,4}$/.test(mgS) || Number(mgS) > 1000) {
        if (note) note.textContent = !name ? 'Give it a name.' : 'Milligrams take digits, up to 1,000.';
        return false;
      }
      var d3 = mDrinks(), id = 'my_' + Date.now().toString(36);
      d3.list.push({ id: id, n: name.slice(0, 30), mg: Number(mgS) });
      d3.on.push(id);
      mDrinksWrite(d3);
    } else {
      return false;
    }
    return true;
  }
  /* Typing: steps and a drink's milligrams. Saved without a redraw, so the box
     you are typing in is not rebuilt under your thumb; refused while it holds
     something that is not a number, and then false, so the caller does not
     redraw either: a redraw put the last good number back and took the
     warning with it, and the box looked as if it had taken the word. */
  function mCheckinInput(el, k) {
    var t = String(el.value || '').replace(/[,\s]/g, '');
    if (el.id === 'amSteps') {
      if (!t) { mAmWrite(k, 'sy', undefined); return true; }
      if (!/^\d{1,6}$/.test(t)) { el.setAttribute('aria-invalid', 'true'); return false; }
      el.setAttribute('aria-invalid', 'false');
      mAmWrite(k, 'sy', Number(t));
      return true;
    }
    var id = el.getAttribute('data-ammg') || el.getAttribute('data-hydmg');
    if (id) {
      if (!/^\d{1,4}$/.test(t) || Number(t) > 1000) { el.setAttribute('aria-invalid', 'true'); return false; }
      el.setAttribute('aria-invalid', 'false');
      var dk = mDrinks();
      dk.list.forEach(function (d) { if (d.id === id) d.mg = Number(t); });
      mDrinksWrite(dk);
      return true;
    }
    return false;
  }

  /* Every morning with anything said, for Review: { key: record }, the drinks'
     milligrams already added up as `mg`. */
  function mAmDays() {
    var out = {};
    Object.keys(MAM).forEach(function (k) {
      var r = mAmOf(k);
      out[k] = { sl: r.sl, sy: r.sy, cr: r.cr, wt: r.wt, mg: r.cf ? mCafMg(k) : undefined };
    });
    return out;
  }

  return { MAM: MAM, mAmOf: mAmOf, mAmWrite: mAmWrite, mAmClean: mAmClean, mAmSum: mAmSum, mAmDays: mAmDays, mDrinksClean: mDrinksClean,
    mWaterGoalOz: mWaterGoalOz, mCafMg: mCafMg, mHydrationCardHTML: mHydrationCardHTML,
    mCheckinHTML: mCheckinHTML, mCheckinClick: mCheckinClick, mCheckinInput: mCheckinInput };
};
