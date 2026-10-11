/* My Day, drawn: renderMacros, which keeps the weight box's focus across a
 * redraw, the day picker (mDayPick), and the day itself (mRenderDay), its
 * week strip, weigh-in card, meals with their plates, pills and the line
 * that says where the slack went, and the foot. The longer account is with
 * the code.
 *
 * A part of app.js (Nourish) in a file of its own. app.js calls
 * HiveParts.myday(app) once, as it starts, and keeps what it gives back
 * under the same names. The recipes by id (BY_ID) are replaced as they
 * change, the day last drawn (mDrawnToday) is set as it draws, and
 * MCASCADE_MIN is declared further down app.js, so the part reaches those
 * through LIVE (tests/scope.test.js holds the lists to each other). Loaded
 * before app.js.
 */
(window.HiveParts = window.HiveParts || {}).myday = function (app) {
  'use strict';

  // what it reads of the app's, and (LIVE) what the app replaces as it goes: BY_ID, MCASCADE_MIN, mDrawnToday
  var MDAYS = app.MDAYS;
  var MWEIGHTS = app.MWEIGHTS;
  var M_MONS = app.M_MONS;
  var S = app.S;
  var WGAPI = app.WGAPI;
  var dayKey = app.dayKey;
  var kcalOf = app.kcalOf;
  var leaf = app.leaf;
  var mAhead = app.mAhead;
  var mBatchStrip = app.mBatchStrip;
  var mCanFav = app.mCanFav;
  var mCascadeLineHTML = app.mCascadeLineHTML;
  var mDay = app.mDay;
  var mDayTargets = app.mDayTargets;
  var mDialUnit = app.mDialUnit;
  var mDialFromX = app.mDialFromX;
  var mDialG = app.mDialG;
  var mDialMeasure = app.mDialMeasure;
  var mDialText = app.mDialText;
  var mDoneAt = app.mDoneAt;
  var mEarliestKey = app.mEarliestKey;
  var mEditDay = app.mEditDay;
  var mFillRoom = app.mFillRoom;
  var mFoldForget = app.mFoldForget;
  var mIcon = app.mIcon;
  var mIsFav = app.mIsFav;
  var mLatestKey = app.mLatestKey;
  var mLongDate = app.mLongDate;
  var mMacLine = app.mMacLine;
  var mMarkAccountUI = app.mMarkAccountUI;
  var mMealAsk = app.mMealAsk;
  var mMealPillsSay = app.mMealPillsSay;
  var mReadSlots = app.mReadSlots;
  var mSaltChip = app.mSaltChip;
  var mServeG = app.mServeG;
  var mSkipped = app.mSkipped;
  var mSnapTargets = app.mSnapTargets;
  var mViewKey = app.mViewKey;
  var mWeekHTML = app.mWeekHTML;
  var mWhyChip = app.mWhyChip;
  var mWhyStrip = app.mWhyStrip;
  var macroFootHTML = app.macroFootHTML;
  var macroWeighHTML = app.macroWeighHTML;
  var syncShrunk = app.syncShrunk;
  var todayKey = app.todayKey;
  var LIVE = app.LIVE;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function $(id) { return document.getElementById(id); }

  /* Redrawing the day removes the box the weight is typed into, and removing
     a focused input fires blur, and blur fires change, and change asks for
     another redraw — arriving in the middle of the first one, whose own
     removal then finds its node already gone. The browser says so plainly:
     "the node to be removed is no longer a child of this node". One redraw
     at a time. */
  var mRendering = false;
  function renderMacros() {
    if (mRendering) return;
    LIVE.mDrawnToday = todayKey();
    mSnapTargets();
    mRendering = true;
    try { mRenderDay(); } finally { mRendering = false; }
  }

  function mDayPick(open) {
    var row = $('macroDayPick').closest('.mday-pick');
    row.classList.toggle('hide', !open);
    if (!open) return;
    var inp = $('macroDayPick');
    inp.value = mViewKey();
    inp.focus();
    try { if (inp.showPicker) inp.showPicker(); } catch (e) { /* the box itself is the way in */ }
  }

  /* ---- one meal, as the tray and the sheet both read it ---- */

  var LOCK_SM = '<svg class="mcard-lk" viewBox="0 0 16 16" aria-hidden="true"><rect x="3.4" y="7" width="9.2" height="6.4" rx="1.6" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M5.6 7V5.1a2.4 2.4 0 0 1 4.8 0V7" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
  var ICO = function (d) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + d + '</g></svg>';
  };
  var I_LOCK = ICO('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>');
  var I_OPEN = ICO('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.6-1.7"/>');
  var I_SWAP = ICO('<path d="M4 8h13"/><path d="M14 4.5 17.5 8 14 11.5"/><path d="M20 16H7"/><path d="M10 12.5 6.5 16l3.5 3.5"/>');
  var I_PIN = ICO('<path d="M8.5 3.5h7M12 3.5v6.4M9.6 9.9c-.6 2.5-2.2 4-3.9 4.6h12.6c-1.7-.6-3.3-2.1-3.9-4.6Z"/><path d="M12 14.5v6"/>');
  var I_STAR = ICO('<path d="M12 3.8l2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8Z"/>');
  var I_WEIGH = ICO('<path d="M4 20h16l-2-11H6z"/><circle cx="12" cy="6" r="2"/><path d="M10 14h4"/>');
  var I_BIN = ICO('<path d="M4 7h16"/><path d="M9.5 7V4.5h5V7"/><path d="M6.5 7l1 12.5h9l1-12.5"/><path d="M10.5 11v5"/><path d="M13.5 11v5"/>');
  var I_DOTS = '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="currentColor"><circle cx="5" cy="12" r="1.9"/><circle cx="12" cy="12" r="1.9"/><circle cx="19" cy="12" r="1.9"/></g></svg>';
  var I_MINUS = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 6h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  var I_PLUS = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 2v8M2 6h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  var I_UP = ICO('<path d="M6 15l6-6 6 6"/>');
  var I_DOWN = ICO('<path d="M6 9l6 6 6-6"/>');

  var fmtK = function (n) { return Math.round(n).toLocaleString('en-US'); };

  /* Millilitres beside a cup or a spoon, for eyeballing with a measuring
     jug: "1 ½ cups · 355 mL". Read off the measure as it is printed
     (fmtNum's eighths), so the two can never disagree. US cup and spoons. */
  var ML_PER = { cup: 236.6, cups: 236.6, tbsp: 14.8, tsp: 4.9 };
  var EIGHTHS = { '⅛': 0.125, '¼': 0.25, '⅜': 0.375, '½': 0.5, '⅝': 0.625, '¾': 0.75, '⅞': 0.875 };
  function mlOf(measure) {
    var m = /^(\d+)?\s?([⅛¼⅜½⅝¾⅞])?\s+(cups?|tbsp|tsp)$/.exec(String(measure || ''));
    if (!m || (!m[1] && !m[2])) return '';
    var ml = ((m[1] ? Number(m[1]) : 0) + (m[2] ? EIGHTHS[m[2]] : 0)) * ML_PER[m[3]];
    return (ml >= 50 ? Math.round(ml / 5) * 5 : Math.max(1, Math.round(ml))) + ' mL';
  }

  /* What Balance moved and what the picker just put down, on this meal, if
     the plates are still the plates they were (a sync can reorder them). */
  function marksFor(k, sk, items) {
    var m = S.mMarks, out = { was: {}, fresh: {}, snap: null, n: 0 };
    if (!m || m.k !== k || m.sk !== sk) return out;
    Object.keys(m.was || {}).forEach(function (i) {
      var w = m.was[i];
      if (items[i] && String(items[i].id) === String(w.id) && items[i].x !== w.x) { out.was[i] = w.x; out.n++; }
    });
    Object.keys(m.fresh || {}).forEach(function (i) {
      if (items[i] && String(items[i].id) === String(m.fresh[i])) out.fresh[i] = 1;
    });
    if (m.snap) out.snap = m.snap;
    return out;
  }

  /* The meal's four, against its share: the figure over the target, filled
     toward it and coloured by where it stands. */
  function capsHTML(sub, aim, spent, capped) {
    if (!aim) return '';
    spent = spent || {};
    var c = [['kcal', '🔥', ''], ['p', 'P', 'mb-p'], ['f', 'F', 'mb-f'], ['c', 'C', 'mb-c']].map(function (x) {
      /* A macro the day can no longer pay for says so: a dashed pill and the
         figure on the plate (or a dash), never "N/0" — the old day pills'
         rule (mMealPillsHTML), kept for the sheet. The words "none left" went
         from the face on 2026-10-06 (Blake: "Remove the text 'none left' from
         in the pills"): cut to "none l" by a narrow pill, they were the
         loudest thing on a meal with nothing to do. The dash and the dashed
         edge say it; a screen reader still hears it. */
      if (spent[x[0]]) {
        var hv = sub[x[0]] || 0;
        return '<span class="mcap spent" data-want="0"><span class="mcap-t num"><i class="' + x[2] + '">' + x[1] + '</i>' +
          (hv > 0 ? fmtK(hv) : '&mdash;') + '<span class="vis-hidden"> none left</span></span></span>';
      }
      var have = sub[x[0]] || 0, a = x[0] === 'kcal' ? (aim.kcal || (4 * aim.p + 9 * aim.f + 4 * aim.c)) : (aim[x[0]] || 0);
      var pct = a > 0 ? Math.min(100, have * 100 / a) : 0;
      var cls = x[0] !== 'p' && have > a * 1.08 ? 'over' : have >= a * 0.92 ? 'on' : '';
      /* The calorie pill of a meal asked for as much (or as little) as a meal
         can be: the number is the limit the arithmetic ran into, not its
         answer — the old day pills' mark (mmp-cap), kept. */
      if (capped && x[0] === 'kcal') cls += ' mcap-max';
      return '<span class="mcap ' + cls + '" data-want="' + Math.round(a) + '"' +
        (capped && x[0] === 'kcal' ? ' title="The most this meal can be asked for"' : '') + '><span class="mcap-fl" style="width:' + pct.toFixed(1) + '%"></span>' +
        '<span class="mcap-t num"><i class="' + x[2] + '">' + x[1] + '</i>' + fmtK(have) + '<em>/' + fmtK(a) + '</em></span></span>';
    });
    /* In twos, so that when the sheet's row has to break (a big meal, a
       narrow phone) it breaks into two and two rather than leaving carbs
       alone on a line of its own; the day's trays lay the four out on their
       own grid and never see the pairs. */
    return '<span class="mcaps-two">' + c[0] + c[1] + '</span><span class="mcaps-two">' + c[2] + c[3] + '</span>';
  }

  /* ---- a meal's three views (Blake, 2026-10-10) ----
   *
     "I would like a way to triple toggle the meals": a tap on a meal's name
     steps its card through Status (closed to its name and a circle each for
     calories, protein, fat and carbs), Foods (each food's leaf, name and
     what it costs, "clean and uncluttered") and Details (the lines as they
     were, each opening to its keys), and round again. The two-way fold of
     2026-10-08 (names only, or everything) is what it replaced. Mockups he
     approved, round 3b the last:
     https://claude.ai/artifact/Vn1dzLvzzUgVBxKNPdUc8c
   *
     Each of calories, protein, fat and carbs is a thin ring round its
     letter that fills toward what the meal is asked for NOW (M.aim, the
     number its own pills show), so a meal the day re-planned is judged by
     its new share. Grey while it fills, soft green once on plan (within a
     tenth), soft amber once over. Protein over stays green, as the pills
     have always had it, and as Blake had it: "over on protein is good".
   *
     Round 3 (2026-10-11). The first circles lit in the macro's own colour,
     and protein's is a red: "I am seeing bright red on my meals and nothing
     in the other colours. Was I good on those, or bad?" Grey said off
     without saying over or under. A ring says how full; its colour says
     only whether that is good. "The glow doesn't have to be loud", so
     there is none. */
  var MBD = [['kcal', 'calories'], ['p', 'protein'], ['f', 'fat'], ['c', 'carbs']];
  var RING_C = 2 * Math.PI * 11;
  /* A flame drawn rather than the emoji, so it can go grey like the letters. */
  var I_FLAME = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.6 2.5c.5 3.1 4.9 5.2 4.9 10.3a5.5 5.5 0 0 1-11 0c0-2.6 1.3-4.3 2.7-5.5.1 1.7.9 2.9 2.1 3.4-.3-3.5.6-6.1 1.3-8.2Z"/></svg>';
  function mRingOf(got, want, m) {
    if (!(want > 0)) return { s: 'none', f: 0, r: 0 };
    var r = got / want;
    return { s: r >= 0.9 && (m === 'p' || r <= 1.1) ? 'on' : r > 1.1 ? 'over' : 'under', f: Math.min(1, r), r: r };
  }
  function mBeadsOf(M) {
    var spent = (M.ask && M.ask.spent) || {};
    return MBD.map(function (x) {
      var m = x[0], got = M.sub[m] || 0, R;
      var want = !M.aim ? 0 : m === 'kcal' ? (M.aim.kcal || (4 * M.aim.p + 9 * M.aim.f + 4 * M.aim.c)) : (M.aim[m] || 0);
      /* A macro the day can no longer pay for is asked for nought: none on
         the plate is as it should be, and any is over (protein aside). */
      if (!M.live) R = { s: 'none', f: 0, r: 0 };
      else if (spent[m]) R = got >= 0.5 ? { s: m === 'p' ? 'on' : 'over', f: 1, r: 2 } : { s: 'none', f: 0, r: 0 };
      else R = mRingOf(got, want, m);
      return { m: m, word: x[1], s: R.s, f: R.f, r: R.r };
    });
  }
  function mBeadsHTML(B) {
    return '<span class="mbds" aria-hidden="true">' + B.map(function (b) {
      return '<span class="mbd mbd-' + b.m + ' rg-' + b.s + '"><svg class="mbd-r" viewBox="0 0 26 26"><circle class="mbd-t" cx="13" cy="13" r="11"/>' +
        (b.f > 0 ? '<circle class="mbd-f" cx="13" cy="13" r="11" stroke-dasharray="' + (b.f * RING_C).toFixed(2) + ' ' + RING_C.toFixed(2) +
          '" transform="rotate(-90 13 13)"/>' : '') +
        '</svg><b>' + (b.m === 'kcal' ? I_FLAME : b.m.toUpperCase()) + '</b></span>';
    }).join('') + '</span>';
  }
  function mBeadsSay(M, B) {
    if (!M.live) return 'nothing on it yet';
    if (!M.aim) return fmtK(M.sub.kcal) + ' kcal';
    return (M.eatenAll ? 'eaten: ' : 'planned: ') + B.map(function (b) {
      return b.word + ' ' + (b.s === 'none' ? 'none left' : b.s === 'over' ? 'over'
        : b.s === 'on' ? (b.r > 1.1 ? 'over, which is fine' : 'on plan') : Math.round(b.r * 100) + '% there');
    }).join(', ');
  }
  var VIEW_SAY = ['', 'its status', 'its foods', 'its details'];
  function mPipsHTML(v) {
    return '<span class="mtray-pips" aria-hidden="true">' + [1, 2, 3].map(function (i) {
      return '<i' + (i === v ? ' class="on"' : '') + '></i>';
    }).join('') + '</span>';
  }
  /* Where each meal starts, until its name is tapped (Blake's "B"): a meal
     eaten on its status, the next meal with food still to eat on its
     details, and the meals after it on their foods. A tap holds for the day
     it was made on (S.mView), and printing shows every meal whole. */
  function mViewOf(k, sk, M, nextSk) {
    if (S.mViewAll) return S.mViewAll;
    var held = S.mView[k] && S.mView[k][sk];
    if (held) return held;
    return M.eatenAll ? 1 : sk === nextSk ? 3 : 2;
  }
  /* A food's mark beside its name: the leaf, or for a meal you saved, the
     two links Save meal is drawn with. */
  function mBadgeHTML(r) {
    if (r.score !== null && r.score !== undefined) return leaf(r.score, 'leaf-sm');
    return r.parts && r.parts.length ? '<span class="mtray-kept" role="img" aria-label="A saved meal" title="A saved meal">' + mIcon('keep') + '</span>' : '';
  }

  /* Everything the tray and the sheet say about one meal, worked out once. */
  function mMealModel(k, sk, name, onPlan, day, targets, slots) {
    var items = day[sk] || [];
    var srec = null;
    slots.list.forEach(function (s) { if (s.k === sk) srec = s; });
    var sub = { kcal: 0, p: 0, f: 0, c: 0 };
    items.forEach(function (it) {
      var r = LIVE.BY_ID[it.id];
      if (!r || !r.macro) return;
      sub.kcal += (r.macro.kcal || 0) * it.x; sub.p += (r.macro.p || 0) * it.x;
      sub.f += (r.macro.f || 0) * it.x; sub.c += (r.macro.c || 0) * it.x;
    });
    var eatenAll = !!items.length && items.every(function (it) { return it.eaten || !LIVE.BY_ID[it.id]; });
    var live = items.filter(function (it) { return LIVE.BY_ID[it.id]; }).length;
    if (!onPlan && !live) return null;        // a bygone meal with nothing left says nothing
    var ask = mMealAsk(sk, targets, slots);
    var aim = ask ? (ask.now || ask) : null;
    /* The tick completes the whole meal, and pressed again it is not. */
    var dot = '<button class="mday-dot no-print" data-mdot="' + esc(sk) + '"' +
      (items.length && !mAhead(k) ? '' : ' disabled') +
      ' aria-pressed="' + (eatenAll ? 'true' : 'false') + '"' +
      ' aria-label="' + (eatenAll ? 'Mark ' + esc(name) + ' not eaten' : 'Mark all of ' + esc(name) + ' eaten') + '"></button>';
    return { k: k, sk: sk, name: name, onPlan: onPlan, items: items, pins: (srec && srec.pins) || [],
      sub: sub, ask: ask, aim: aim, eatenAll: eatenAll, live: live, dot: dot,
      pillsSay: mMealPillsSay(sub, ask, targets) };
  }

  /* A food's line on the day, opened: what it costs, then its four verbs and
     the sheet's dial. The verbs are the ones the sheet keeps behind ⋯; here
     there is room for them in a row, and the line is already the one tap.
     The handlers are the sheet's (mDayClick answers both), so a step here
     is a step there. Eaten is a record, as in the sheet: the keys go quiet
     and a tap on the amount hands them back. */
  function mLineOpenHTML(M, r, it, i) {
    var sk = M.sk, tag = sk + ':' + i, name = esc(r.name);
    var pinned = M.pins.some(function (p) { return p.id === it.id; });
    var spent = it.eaten && S.mEdit !== tag;
    var dialU = mDialG(r) ? 'g' : mDialUnit(r);
    var amount = S.mType === tag
      ? '<span class="mstep-x mitem-amt mitem-typing"><input class="mstep-in" type="text" inputmode="decimal" autocomplete="off" data-mtypein="' + tag + '" ' +
          'aria-label="' + name + ', in ' + esc(dialU) + '" value="" placeholder="' + esc(String(mDialFromX(r, it.x))) + '"><i>' + esc(dialU) + '</i></span>'
      : '<button class="mstep-x mitem-amt ' + (spent ? 'mstep-wake" data-medit="' : 'mstep-type" data-mtype="') + tag + '" aria-label="' +
          name + ', ' + esc(mDialText(r, it.x)) + '. ' + (spent ? 'Correct it' : 'Type an amount') + '">' + esc(mDialText(r, it.x)) + '</button>';
    return '<div class="mfl-x no-print">' +
        '<div class="mfl-mac"><span class="mitem-mac">' + mMacLine(r, it.x) + '</span>' + mSaltChip(r, it.x) + '</div>' +
        '<div class="mfl-ctl">' +
          '<span class="mfl-ics">' +
            '<button class="mfl-ic" data-mdel="' + tag + '" aria-label="Remove ' + name + '">' + I_BIN + '</button>' +
            '<button class="mfl-ic" data-mlock="' + tag + '" aria-pressed="' + (it.l ? 'true' : 'false') + '" aria-label="' +
              (it.l ? 'Let ' + name + ' move again' : 'Lock the amount of ' + name) + '">' + I_LOCK + '</button>' +
            (M.onPlan ? '<button class="mfl-ic" data-mpin="' + tag + '" aria-pressed="' + (pinned ? 'true' : 'false') + '" aria-label="' +
              (pinned ? 'Unpin ' + name + ' from ' + esc(M.name) : 'Pin ' + name + ' to ' + esc(M.name) + ' every day') + '">' + I_PIN + '</button>' : '') +
            (mCanFav(r) ? '<button class="mfl-ic" data-mfav="' + esc(String(r.id)) + '" aria-pressed="' + (mIsFav(r) ? 'true' : 'false') + '" aria-label="' +
              (mIsFav(r) ? 'Take ' + name + ' out of favourites' : 'Favourite ' + name) + '">' + I_STAR + '</button>' : '') +
          '</span>' +
          '<span class="mfl-dial' + (spent ? ' spent' : '') + '">' +
            '<button class="mfl-k" data-mstep="' + tag + ':down"' + (spent ? ' disabled' : '') + ' aria-label="Less ' + name + '">' + I_MINUS + '</button>' +
            '<span class="mfl-g">' + amount + '</span>' +
            '<button class="mfl-k" data-mstep="' + tag + ':up"' + (spent ? ' disabled' : '') + ' aria-label="More ' + name + '">' + I_PLUS + '</button>' +
          '</span>' +
        '</div>' +
      '</div>';
  }

  /* One food in the meal sheet: its name (the door to the recipe or the
     food), the kitchen measure and what it costs in small print, and the
     dial — −, the grams, + — with ⋯ for the rest. Eaten is a record, not a
     dial: the keys go quiet and a tap on the grams hands them back.
     .mstep, .mstep-x and .mstep-in keep their names — they are what the
     portion tests reach for. */
  function foodRowHTML(M, r, it, i, mk) {
    var sk = M.sk, tag = sk + ':' + i;
    var pinned = M.pins.some(function (p) { return p.id === it.id; });
    var was = mk.was[i], fresh = !!mk.fresh[i];
    var spent = it.eaten && S.mEdit !== tag;
    var menuOpen = S.mMenu === tag;
    var sg = !r.food && mServeG(r);
    var measure = mDialMeasure(r, it.x);
    var dialU = mDialG(r) ? 'g' : mDialUnit(r);
    return '<div class="mitem mfood mrow' + (it.eaten ? ' eaten' : '') + (it.l ? ' held' : '') +
        (was !== undefined ? ' moved' : fresh ? ' fresh' : '') + (S.mpSwap && S.mpSwap.slot === sk && S.mpSwap.i === i ? ' swapping' : '') + '">' +
      (S.mpSwap && S.mpSwap.slot === sk && S.mpSwap.i === i
        ? '<div class="mrow-swap">Tap its replacement below<button class="ghost" data-mswapx="1">Cancel</button></div>' : '') +
      '<div class="mrow-n">' +
        '<span class="mitem-nm">' + (r.food
          ? '<button class="mitem-name mitem-food" data-mfood="' + esc(String(r.id)) + '" data-mx="' + it.x + '" data-mfslot="' + esc(sk) + '">'
          : '<button class="mitem-name" data-open="' + esc(String(r.id)) + '" data-mx="' + it.x + '">') +
          (r.score === null || r.score === undefined ? '' : leaf(r.score, 'leaf-sm')) +
          '<span class="mrow-nm">' + esc(r.name) + '</span></button>' +
          (fresh ? '<span class="mrow-mk new">New</span>' : '') +
          (it.l ? '<span class="mrow-mk kept">' + LOCK_SM + 'Kept</span>' : '') +
          (pinned ? '<span class="mrow-mk kept">Pinned</span>' : '') +
        '</span>' +
        '<span class="mrow-m mitem-r2">' + (measure ? '<span class="mitem-uom">' + esc(measure) + '</span> &middot; ' : '') +
          '<span class="mitem-mac">' + mMacLine(r, it.x) + '</span>' + mSaltChip(r, it.x) + mWhyChip(it, tag) + '</span>' +
      '</div>' +
      /* Typing opens an EMPTY box with the amount shown faint behind it, so
         what you type is the amount. Opened holding the number, it relied on
         the phone selecting it, and an iPhone often does not: Blake had to
         type "005" to get 5 g of oil. Left empty, it changes nothing. */
      '<span class="mstep mrow-dial no-print' + (spent ? ' spent' : '') + '">' +
        '<button class="mrow-k" data-mstep="' + tag + ':down"' + (spent ? ' disabled' : '') + ' aria-label="Less ' + esc(r.name) + '">' + I_MINUS + '</button>' +
        '<span class="mrow-g">' +
          (S.mType === tag
            ? '<span class="mstep-x mitem-amt mitem-typing"><input class="mstep-in" type="text" inputmode="decimal" autocomplete="off" data-mtypein="' + tag + '" ' +
                'aria-label="' + esc(r.name) + ', in ' + esc(dialU) + '" value="" placeholder="' + esc(String(mDialFromX(r, it.x))) + '"><i>' + esc(dialU) + '</i></span>'
            : '<button class="mstep-x mitem-amt ' + (spent ? 'mstep-wake" data-medit="' : 'mstep-type" data-mtype="') + tag + '" aria-label="' +
                esc(r.name) + ', ' + esc(mDialText(r, it.x)) + '. ' + (spent ? 'Correct it' : 'Type an amount') + '">' + esc(mDialText(r, it.x)) + '</button>') +
          '<small>' + (was !== undefined ? 'was ' + esc(mDialText(r, was)) : '') + '</small>' +
        '</span>' +
        '<button class="mrow-k" data-mstep="' + tag + ':up"' + (spent ? ' disabled' : '') + ' aria-label="More ' + esc(r.name) + '">' + I_PLUS + '</button>' +
      '</span>' +
      (M.onPlan ? '<button class="mrow-more mfood-more no-print" data-mfmenu="' + tag + '" aria-haspopup="true" aria-expanded="' + menuOpen + '" aria-label="More for ' + esc(r.name) + '">' + I_DOTS + '</button>' : '<span></span>') +
      // the why and Weigh the batch open the row's full width, under it
      mWhyStrip(it, tag) + mBatchStrip(r, it, tag) +
      (menuOpen ? '<div class="mfood-menu mrow-menu no-print" role="menu">' +
        '<button class="mfood-mi mlock" role="menuitem" data-mlock="' + tag + '" aria-pressed="' + (it.l ? 'true' : 'false') + '">' +
          (it.l ? I_OPEN + 'Let it move' : I_LOCK + 'Lock the amount') + '</button>' +
        '<button class="mfood-mi mswap" role="menuitem" data-mswap="' + tag + '">' + I_SWAP + 'Swap</button>' +
        '<button class="mfood-mi mpin" role="menuitem" data-mpin="' + tag + '" aria-pressed="' + (pinned ? 'true' : 'false') + '" aria-label="' +
          (pinned ? 'Unpin from ' + esc(M.name) : 'Pin to ' + esc(M.name) + ' every day') + '">' + I_PIN + (pinned ? 'Unpin' : 'Pin to ' + esc(M.name)) + '</button>' +
        (mCanFav(r) ? '<button class="mfood-mi mfav" role="menuitem" data-mfav="' + esc(String(r.id)) + '" aria-pressed="' + (mIsFav(r) ? 'true' : 'false') + '">' +
          I_STAR + (mIsFav(r) ? 'Remove from favourites' : 'Favourite') + '</button>' : '') +
        (sg ? '<button class="mfood-mi" role="menuitem" data-mbatch="' + tag + '">' + I_WEIGH + 'Weigh the batch</button>' : '') +
        '<button class="mfood-mi mdel" role="menuitem" data-mdel="' + tag + '" aria-label="Remove ' + esc(r.name) + '">' + I_BIN + 'Remove</button>' +
      '</div>' : '') +
    '</div>';
  }

  /* The meal sheet's own half: its header (the tick, the name and the
     meal's ⋯), the pills, and the tray of its foods along the bottom. The
     picker between them is picksheet.js's.
   *
     Blake, 2026-10-05: the foods "at the bottom. The top needs to be sticky
     so I can see the scanner... and the search... Obviously the macro pill
     so I can see that the foods that I'm selecting are auto balancing as I
     select them." The rows used to sit between the pills and the search and
     scrolled away the moment you went looking for something; in a tray
     pinned to the bottom they stay in sight while you pick. Balance and
     Done ride in it, "so it's not at the very top where my thumb has to
     stretch to reach it", which is why ⚖ and × left the header. The line
     under the pills went too: "I can see visually in the pills what I need
     to do still." Mockup: https://claude.ai/artifact/TQTp3xjDsvsEabnWYfFF7y */
  function mMealSheetParts(sk) {
    var k = mViewKey(), day = mDay(k), targets = mDayTargets(k), slots = mReadSlots();
    var rec = null;
    slots.list.forEach(function (s) { if (s.k === sk) rec = s; });
    var name = rec ? rec.n : (slots.names[sk] || 'Meal');
    var M = mMealModel(k, sk, name, !!rec, day, targets, slots);
    if (!M) M = mMealModel(k, sk, name, true, day, targets, slots);
    var items = M.items, mk = marksFor(k, sk, items);
    var skipped = !items.length && mSkipped(k, sk);
    var menuOpen = S.mMenu === 'meal:' + sk;
    var head = '<div class="msh-h">' +
        (skipped ? '<span class="msh-gap"></span>' : M.dot) +
        '<span class="msh-t"><span class="mslot-name">' + esc(name) + '</span><small>' + esc(mLongDate(k)) + '</small></span>' +
        (skipped || !M.onPlan ? '<button class="msh-i sheet-x" data-close="1" aria-label="Close">&times;</button>' :
          '<button class="msh-i" data-mmenu="' + esc(sk) + '" aria-haspopup="true" aria-expanded="' + menuOpen + '" aria-label="More for ' + esc(name) + '">' + I_DOTS + '</button>') +
        (menuOpen ? '<div class="mfood-menu msh-menu no-print" role="menu">' +
          (items.length
            ? '<button class="mfood-mi mslot-try" role="menuitem" data-mtry="' + esc(sk) + '">' + mIcon('another') + 'Try another</button>'
            : '<button class="mfood-mi mslot-skip" role="menuitem" data-mskip="' + esc(sk) + '">' + mIcon('skip') + 'Skip today</button>') +
          (items.length >= 2 ? '<button class="mfood-mi mslot-keep" role="menuitem" data-mkeep="' + esc(sk) + '" aria-label="Save these plates as one food you can reuse">' + mIcon('keep') + 'Save meal</button>' : '') +
          '<button class="mfood-mi mslot-from" role="menuitem" data-mfrom="' + esc(sk) + '" aria-label="Repeat ' + esc(name) + ' from another day">' + mIcon('fromday') + 'Repeat a day</button>' +
        '</div>' : '') +
      '</div>';
    if (skipped) {
      return { name: name, head: head, skipped: true,
        body: '<div class="msh-skipped">' + esc(name) + ' is skipped today. Its share went to the rest.' +
          '<button class="ghost mslot-unskip" data-mskip="' + esc(sk) + '">Put ' + esc(name) + ' back</button></div>' };
    }
    var stick = '<div class="mcaps">' + capsHTML(M.sub, M.aim, M.ask && M.ask.spent, !!(M.ask && M.ask.capped)) + '</div>';
    var rows = items.map(function (it, i) {
      var r = LIVE.BY_ID[it.id];
      return r ? foodRowHTML(M, r, it, i, mk) : '';
    }).join('');
    rows = '<div class="mrows mslot-items">' + (rows || '<div class="mscreen-empty">Nothing on ' + esc(name.toLowerCase()) + ' yet. Tap a food above.</div>') + '</div>';
    return { name: name, head: head, stick: stick, skipped: false, onPlan: M.onPlan, rows: rows,
      on: sheetOnHTML(M, rows), tray: sheetTrayHTML(M, mk) };
  }

  /* The meal's foods, open, in the page: under the pills and above the
     search, one row a food with its dial.
   *
     Blake, 2026-10-08: "when I'm on the nourish tab looking at all my meals
     and I click on a meal to update the food. It takes me to the food
     search page and the foods that I have in my basket are collapsed and
     it's really hard to edit them. I have to uncollapse that field and try
     to edit and the edit is awful." The rows lived inside the tray pinned
     to the bottom (2026-10-05), shut until asked and, once open, scrolling
     in a box under half the screen tall. On a phone the keyboard comes up
     over exactly that place, so typing an amount meant typing into a row
     the keyboard hid, in a box that could not scroll it clear.
   *
     So the rows are part of the page again, where a phone scrolls a box it
     is typing into above the keyboard, and a meal with food on it opens on
     them (picksheet.js). What the tray was for on the 5th still holds while
     you look for something to add: a word in the search hides this and the
     tray's strip of chips shows the same foods along the bottom (the
     .mpq class, app.js), and a chip brings them back up here. Drawn only
     while open; the strip in the tray is drawn either way and hidden by
     CSS while this shows, so typing can swap them without a redraw. */
  function sheetOnHTML(M, rows) {
    if (!S.mTrayOpen) return '';
    var n = 0;
    M.items.forEach(function (it) { if (LIVE.BY_ID[it.id]) n++; });
    if (!n) return '';
    return '<section class="msh-on no-print" aria-label="On ' + esc(M.name) + '">' +
      '<div class="msh-trh"><span class="msh-trt"><b>On ' + esc(M.name) + '</b><small class="num">' +
        n + (n === 1 ? ' food' : ' foods') + ' &middot; ' + fmtK(M.sub.kcal) + ' kcal</small></span>' +
        '<button class="msh-i" data-mtray="0" aria-expanded="true" aria-label="Put the foods on ' + esc(M.name) + ' away, to the bottom">' + I_DOWN + '</button></div>' +
      rows + '</section>';
  }

  /* The tray along the bottom: Balance and Done, and over them the meal's
     foods as a strip of chips, newest first, each with its amount, ↑ or ↓
     when the last re-fit moved it and a lock when you set it. A chip, the
     count or the arrow puts the foods up in the page (sheetOnHTML), where
     they are edited; the strip itself is hidden while they are up there
     and nothing has been typed (.open, style.css). */
  function sheetTrayHTML(M, mk) {
    var sk = M.sk, open = !!S.mTrayOpen;
    var live = [];
    M.items.forEach(function (it, i) { if (LIVE.BY_ID[it.id]) live.push(i); });
    var n = live.length;
    var said = n + (n === 1 ? ' food' : ' foods') + ' &middot; ' + fmtK(M.sub.kcal) + ' kcal';
    var chips = live.slice().reverse().map(function (i) {
      var it = M.items[i], r = LIVE.BY_ID[it.id], was = mk.was[i];
      var arrow = was === undefined ? '' : it.x > was ? '&uarr;' : '&darr;';
      return '<button class="msh-chip' + (mk.fresh[i] ? ' fresh' : '') + '" data-mtray="1" aria-label="' + esc(r.name) + ', ' +
          esc(mDialText(r, it.x)) + '. Show the foods on ' + esc(M.name) + '">' +
        '<span class="msh-chn">' + esc(r.name) + '</span>' +
        '<span class="msh-chg num">' + (it.l ? LOCK_SM : '') + esc(mDialText(r, it.x)) + (arrow ? '<em>' + arrow + '</em>' : '') + '</span></button>';
    }).join('');
    var body = '<div class="msh-trc">' +
        '<button class="msh-trn" data-mtray="1" aria-expanded="false" aria-label="' + said.replace('&middot;', 'and') + ' on ' + esc(M.name) + '. Show them">' +
          '<b class="num">' + n + '</b><small>' + (n === 1 ? 'food' : 'foods') + '</small></button>' +
        '<span class="msh-chips">' + (chips || '<span class="msh-none">Tap a food above to put it here.</span>') + '</span>' +
        '<button class="msh-i" data-mtray="1" aria-expanded="false" aria-label="Show the foods on ' + esc(M.name) + '">' + I_UP + '</button></div>';
    return '<div class="msh-tray no-print' + (open && n ? ' open' : '') + '">' + body +
      '<div class="msh-acts">' +
        '<button class="msh-bal" data-mbal="' + esc(sk) + '"' + (n ? '' : ' disabled') +
          ' aria-label="Balance every food on ' + esc(M.name) + ', the amounts you set included">' + mIcon('scales') + 'Balance</button>' +
        '<button class="btn-primary msh-done sheet-done">Done</button>' +
      '</div></div>';
  }

  function mRenderDay() {
    var todayK = todayKey();
    var k = mViewKey();
    /* Midnight passed while the tab sat on a day. Forward was already
       handled; backward matters more — the oldest day the tab keeps falls
       out of the window at midnight, and an edit to it would have been
       written and then pruned away by the same save. */
    if (k > mLatestKey() || k < mEarliestKey()) { S.macroDate = null; k = todayK; }
    /* The day is a control, not a caption: every day the tab remembers, named
       the way you would say it, with the arrows for single steps either side. */
    var opts = [];
    for (var step = 7; step > -14; step--) {
      var od = new Date();
      od.setDate(od.getDate() + step);
      var ok = dayKey(od);
      /* Month first, the one form the app writes a date in: "Mon, Sep 28",
         or the word for it when there is one. */
      var word = step === 0 ? 'Today' : step === -1 ? 'Yesterday'
        : step === 1 ? 'Tomorrow' : '';
      opts.push('<option value="' + ok + '"' + (ok === k ? ' selected' : '') + '>' +
        (word ? word + ' &middot; ' + M_MONS[od.getMonth()] + ' ' + od.getDate() : mLongDate(ok)) + '</option>');
    }
    /* A day further back than the list, reached by the date box or the
       arrows, is named at the foot so the box still says where you are; and
       the last entry opens the date box, for any day the log keeps. */
    var listFrom = new Date(); listFrom.setDate(listFrom.getDate() - 13);
    if (k < dayKey(listFrom)) opts.push('<option value="' + k + '" selected>' + mLongDate(k) + '</option>');
    opts.push('<option value="pick">Earlier day\u2026</option>');
    $('macroDaySel').innerHTML = opts.join('');
    var dp = $('macroDayPick');
    if (dp) { dp.min = mEarliestKey(); dp.max = mLatestKey(); }
    $('macroPrev').disabled = k <= mEarliestKey();
    $('macroNext').disabled = k >= mLatestKey();
    $('macroWeek').innerHTML = mWeekHTML(k, todayK);
    /* A day you are planning rather than living looks identical otherwise,
       and quietly ticking Thursday's breakfast off on Tuesday is exactly the
       mistake that would cost. */
    $('view-macros').classList.toggle('mday-ahead', mAhead(k));

    var targets = mDayTargets(k);
    var slots = mReadSlots();

    /* A new today arrives with the routine already on it: anything pinned to
       a meal is placed at its pinned portion the first time today is looked
       at. Only today, and only when the day does not exist yet — history and
       half-built days are never re-seeded, and unpinning tomorrow is done by
       unpinning, not by deleting today's copy. */
    /* `===`, as the comment says: `>=` wrote the routine onto every future
       day merely browsed to — a write to a day nobody asked to change, sent
       to the account. Planning a future day still gets its pins, from Fill,
       which runs the pin pass itself. */
    /* And unstamped. The pins are this device's guess at a day it has not
       seen, not a change to it, and a guess stamped "now" beat the real day:
       a second device opened at lunch drew before its first word from the
       account, found no today, placed the routine, stamped it newer than the
       breakfast logged on the phone that morning, and sent it — and a day
       travels whole, so breakfast was gone on both. Unstamped, the seeded
       day is never sent on its own and the account's copy of today, when it
       comes, simply replaces it. The first real edit stamps it, pins and all. */
    if (k === todayK && !MDAYS[k]) {
      var anyPins = false;
      slots.list.forEach(function (s) { if (s.pins && s.pins.length) anyPins = true; });
      if (anyPins) {
        mEditDay(k, function (day0) {
          slots.list.forEach(function (s) {
            (s.pins || []).forEach(function (p) {
              if (LIVE.BY_ID[p.id]) (day0[s.k] = day0[s.k] || []).push({ id: p.id, x: p.x || 1, eaten: 0 });
            });
          });
        }, true);
      }
    }
    var day = mDay(k);

    /* Nothing to draft once every meal has something on it — or before there
       is a plan to draft against. Fill reads mDayTargets and portion-solves
       against whatever comes back, so with nothing set it would build a real
       day out of real recipes and present it as the answer to a question
       nobody asked.
     *
       But it does not sit there DEAD and green either. Driven cold, the first
       thing this tab shows a newcomer is the biggest, brightest control on
       the screen, disabled, with nothing saying why — and behind it the whole
       of My Day: the targets, the favourites, the best fits, and now the
       family's own week. Every one of those is reached through this button.
       A front door that cannot be opened and will not say so is the worst
       thing in the app, and it costs one branch to fix: with no plan, the
       button IS the way to make one, and says so. */
    /* One button, saying the next thing the day needs.
     *
       It used to be Fill beside a tick, and Fill went DEAD the moment every
       meal had something on it: the biggest, brightest control on the screen,
       disabled, for most of the day — the same fault the paragraph above
       describes for the no-plan case and fixes only there. Blake: "when all
       the foods are check marked I get to see a complete button for a day
       instead of a fill, because fill at that point doesn't make sense
       anymore."
     *
       Four states in order of what is left to do: make a plan, draft the
       day, close it, reopen it. The tick that used to carry the last two is
       gone from the bar; this is the same verb in the slot that was going to
       waste. */
    var fillBtn = $('macroFill');
    var noPlan = !kcalOf(targets);
    /* A skipped meal counts as dealt with. It asked only whether every meal
       had food on it, and a skipped meal never will — so one skip pinned the
       button to "Fill" for the rest of the day, through every plate being
       ticked, and neither "Mark all complete" nor "Complete the day" could
       ever be reached. Blake: "when all foods are marked complete, it's still
       showing fill. I'd expect to see something else." */
    /* And a day with no room left has nothing to fill either. An empty
       snack on a day already over its calories kept the button on "Fill",
       which then added nothing — pressed three times, it stayed "Fill", and
       "Mark all complete" could only be reached by skipping the snack. Asked
       by the same test Fill asks itself. */
    var nothingToFill = !noPlan && (mFillRoom(day, targets) < 100 ||
      slots.list.every(function (s) {
        return (day[s.k] || []).length || mSkipped(mViewKey(), s.k);
      }));
    var dayDone = mDoneAt(mViewKey()) > 0;
    var future = mViewKey() > todayKey();
    /* Is there a plate left to tick? Blake: "the done for the day button
       should be something like Mark all as complete. And once everything is
       completed I get the options to complete the day." Which is better than
       what this slot shipped with this morning: Done appeared as soon as
       every meal had FOOD, so it could be pressed having eaten nothing. Now
       the two are separate steps and each one is the literal next thing. */
    /* Two different counts, and conflating them left the sweeper lit with
       nothing it was willing to take: a LOCKED un-eaten plate can still be
       ticked, so it counts toward "mark all complete", but the sweeper
       leaves it alone, so it must not count toward "there is something to
       sweep". The test caught this by locking one. */
    var unticked = 0, loose = 0;
    slots.list.forEach(function (s0) {
      var pinned0 = (s0.pins || []).map(function (pn) { return String(pn.id); });
      (day[s0.k] || []).forEach(function (it) {
        if (!it.eaten) unticked++;
        // what the sweep would take: not eaten, not locked, not pinned
        if (!it.eaten && !it.l && pinned0.indexOf(String(it.id)) < 0) loose++;
      });
    });
    var mode = noPlan ? 'plan' : dayDone ? 'open'
      : !nothingToFill ? 'fill' : unticked ? 'tickall' : 'done';
    var SAY = { plan: 'Craft my plan', fill: 'Fill', tickall: 'Mark all complete',
      done: 'Complete the day', open: 'Reopen the day' };
    var TELL = {
      plan: 'Craft my plan — Nourish needs one before it can draft anything',
      fill: 'Fill the day',
      tickall: 'Mark every plate on the day as eaten',
      done: 'I am done for today',
      open: 'Day closed — press to reopen it'
    };
    fillBtn.classList.toggle('to-plan', noPlan);
    fillBtn.classList.toggle('to-done', mode === 'done' || mode === 'open');
    fillBtn.classList.toggle('to-tick', mode === 'tickall');
    fillBtn.dataset.mode = mode;
    if (fillBtn.textContent !== SAY[mode]) fillBtn.textContent = SAY[mode];
    fillBtn.setAttribute('aria-label', TELL[mode]);
    fillBtn.title = TELL[mode];
    /* A day that has not happened cannot be finished with, and there is
       nothing to draft against on it either. */
    fillBtn.disabled = future && mode !== 'fill';

    /* The gear and its menu are static markup, so a state change paints them
       once and they stay painted. Painting again here costs a class check and
       covers the day this header stops being static. */
    mMarkAccountUI();

    // and nothing to re-size when every plate is eaten, locked, or absent
    var freeCount = 0;
    Object.keys(day).forEach(function (sk) {
      (day[sk] || []).forEach(function (it) {
        var r = LIVE.BY_ID[it.id];
        if (!it.eaten && !it.l && r && r.macro) freeCount++;
      });
    });
    $('macroRebal').disabled = !freeCount;
    /* Any day, tomorrow included. Blake swept tomorrow's plan to start it
       again and nothing happened: the button was switched off on every
       future day, with nothing to say why — and planning a day ahead is
       exactly when you want to clear it. */
    $('macroSweep').disabled = !loose;

    /* One tray per meal on the plan, then one for anything a bygone meal
       left on this day — removed from the plan is not removed from history.
     *
       Blake, 2026-10-04, of the RP-style day: "Way to fat and tall... hard
       to know where to add food... Many ways." So the day is small trays:
       the meal's tick, its name, its calories against its share, and its
       foods as small lines. The meal's sheet (data-mopen) is where food is
       found and added. Mockup (Tray A):
       https://claude.ai/artifact/SseR1TPa4JAFNanYYsGP4k */
    var ahead = mAhead(k);
    /* An empty meal (Blake, 2026-10-11: "I don't like seeing that expanded
       and 'nothing yet'... when the bar is not tapped it's clean and just a
       single row"). Its name, what it is for in faint type, + and ⊘. A plain
       tap on + goes to food search, the way + does on any card; its name,
       or holding + down (app.js), opens one quiet line of ways to fill it:
       Add food, Autofill (Try another, from the meal's ⋯, which drafts this
       one meal from the plan), Repeat a day and Saved meals (the picker on
       its Saved meals lens). Open is held for the day, like a card's view.
       It keeps its door, empty, as Status does. Mockup round 3b:
       https://claude.ai/artifact/Vn1dzLvzzUgVBxKNPdUc8c */
    var emptyHTML = function (M, sk, name) {
      var open = !!(S.mEmptyOpen[k] && S.mEmptyOpen[k][sk]);
      /* The faint target is the calorie pill's figure, worked the same way
         (capsHTML), and carries the same data-want the pill did, so whatever
         read a meal's share off its pill reads it here. A day whose calories
         are spent shows none, as the pill showed a dash. */
      var spent = (M.ask && M.ask.spent) || {};
      var want = M.aim && !spent.kcal ? (M.aim.kcal || (4 * M.aim.p + 9 * M.aim.f + 4 * M.aim.c)) : 0;
      return '<div class="mslot mtray mtray-empty' + (open ? ' open' : '') + '" data-mslot="' + esc(sk) + '">' +
          M.dot +
          '<div class="mtray-c">' +
            '<div class="mtray-hr">' +
              '<button class="mtray-hd" data-meopen="' + esc(sk) + '" aria-expanded="' + open + '" aria-label="' + esc(name) +
                ', nothing on it yet' + (want > 0 ? ', ' + fmtK(want) + ' kcal to plan' : '') + '. ' + (open ? 'Hide' : 'Show') + ' the ways to fill it">' +
                '<span class="mtray-n">' + esc(name) + '</span>' + (want > 0 ? '<span class="mtray-aim num" data-want="' + Math.round(want) + '">' + fmtK(want) + ' kcal</span>' : '') + '</button>' +
              '<span class="mtray-vbs">' +
                '<button class="mtray-ib mtray-hold" data-mopen="' + esc(sk) + '" data-mhold="' + esc(sk) + '" aria-label="Add food to ' + esc(name) +
                  '. Press and hold for more ways to fill it" title="Add food">' + mIcon('plus') + '</button>' +
                '<button class="mtray-ib" data-mskipask="' + esc(sk) + '" aria-label="Skip ' + esc(name) + ' today" title="Skip today">' + mIcon('skip') + '</button>' +
              '</span>' +
            '</div>' +
            '<button class="mtray-b" data-mopen="' + esc(sk) + '" aria-label="Open ' + esc(name) + (M.pillsSay ? ' — ' + esc(M.pillsSay) : '') + '"></button>' +
            (!open ? '' : '<div class="mtray-acts">' +
              '<button data-mopen="' + esc(sk) + '">Add food</button>' +
              '<button data-mtry="' + esc(sk) + '" aria-label="Autofill ' + esc(name) + ' from your plan">Autofill</button>' +
              '<button data-mfrom="' + esc(sk) + '" aria-label="Repeat ' + esc(name) + ' from another day">Repeat<span class="mtray-lg"> a day</span></button>' +
              '<button data-msaved="' + esc(sk) + '" aria-label="Saved meals, for ' + esc(name) + '">Saved<span class="mtray-lg"> meals</span></button>' +
            '</div>') +
          '</div>' +
        '</div>';
    };
    /* The next meal, for where each card starts (mViewOf): the first on the
       plan with food on it still to eat. An empty meal is not it — a
       breakfast never logged would otherwise hold the place all day. */
    var nextSk = '';
    slots.list.forEach(function (s) {
      if (!nextSk && (day[s.k] || []).some(function (it) { return !it.eaten && LIVE.BY_ID[it.id]; })) nextSk = s.k;
    });
    var trayHTML = function (sk, name, onPlan) {
      var M = mMealModel(k, sk, name, onPlan, day, targets, slots);
      if (!M) return '';
      var items = M.items;

      /* Skipped: one line, with its way back on it (Put back, since
         2026-10-10, now that skipping is on the card too) as well as in its
         sheet; the chooser for where its share goes (the largest cascade
         there is) rides under it. */
      if (onPlan && !items.length && mSkipped(k, sk)) {
        /* With the card under it asking where the share goes, the line does
           not claim it simply went to the rest. */
        var skSend = mCascadeLineHTML(sk, targets, slots);
        return '<div class="mtray-skip">' +
            '<button class="mtray-skb" data-mopen="' + esc(sk) + '" aria-label="' + esc(name) + ', skipped. Open it">' +
              '<span class="mtray-n">' + esc(name) + '</span>' +
              '<span class="mtray-sw">' + (skSend ? 'skipped' : 'skipped &middot; its share went to the rest') + '</span>' +
            '</button>' +
            '<button class="mtray-unskip" data-mskip="' + esc(sk) + '" aria-label="Put ' + esc(name) + ' back">Put back</button>' +
          '</div>' + skSend;
      }

      /* Each food is a line of its own again (Blake, 2026-10-08), the way the
         day had them before the trays: its leaf, its name, the kitchen measure
         and the grams at the far right, and its tick. He had to open a meal's
         sheet to change anything on it, and then could not see the day: "How
         am I supposed to see how this meal and the daily macros at the same
         time?" A tap on the line opens it where it is — what it costs, the
         bin, the lock, the pin, the star and the sheet's own dial — under the
         day's pills, so both move together. One open at a time, and only
         ever one tap deep, so a big meal is still a column of quiet lines and
         not a wall of keys. Mockup he approved:
         https://claude.ai/artifact/XfZHLy1Fhphi8BCPb6CdZe
       *
         The kitchen's words first and the weight after, as before (Blake,
         2026-10-05: "If I just want to eyeball it I can... The grams is there
         for sure if I want to weigh it"), a cup's mL small under the cup: on
         a line of its own beside it, it left a long name four letters. The
         name is the door to the food, or to the recipe (2026-10-06: "I need
         easy links to the recipes when I click on the recipe names"); the
         pills and + are the door to the meal, where food is added. S.mAmt
         says which line is open, with the day in it, so a line left open on
         one day is not open on the next. These lines are the card's Details
         now; its Foods and Status are below. */
      var live = M.live, anyEaten = items.some(function (it) { return it.eaten; });
      if (!live && onPlan) return emptyHTML(M, sk, name) + mCascadeLineHTML(sk, targets, slots);
      var view = mViewOf(k, sk, M, nextSk);
      var lines = '';
      if (view === 2) {
        /* Foods: the leaf, the name (still the door to the food or the
           recipe) and what it costs, and nothing else to press. */
        lines = items.map(function (it) {
          var r = LIVE.BY_ID[it.id];
          if (!r) return '';
          var name = esc(r.name), mc = r.macro || {};
          var door = r.food
            ? '<button class="mtray-fn" data-mfood="' + esc(String(r.id)) + '" data-mx="' + it.x + '" data-mfslot="' + esc(sk) + '" aria-label="' + name + ', the food">'
            : '<button class="mtray-fn" data-open="' + esc(String(r.id)) + '" data-mx="' + it.x + '" aria-label="' + name + ', the recipe">';
          return '<div class="mtray-f mtray-cl' + (r.food ? '' : ' mtray-go') + (it.eaten ? ' eaten' : '') + '">' +
              '<span class="mfl-lf">' + mBadgeHTML(r) + '</span>' +
              door + '<span class="mfl-nm">' + name + '</span></button>' +
              '<span class="mtray-ck num">' + fmtK((mc.kcal || 0) * it.x) + '<small> kcal</small></span>' +
              '<span class="mtray-cm num"><span>' + Math.round((mc.p || 0) * it.x) + '<i class="mb-p">P</i></span>' +
                '<span>' + Math.round((mc.f || 0) * it.x) + '<i class="mb-f">F</i></span>' +
                '<span>' + Math.round((mc.c || 0) * it.x) + '<i class="mb-c">C</i></span></span>' +
            '</div>';
        }).join('');
      } else if (view === 3) {
        lines = items.map(function (it, i) {
          var r = LIVE.BY_ID[it.id];
          if (!r) return '';
          var tag = sk + ':' + i, open = S.mAmt === k + '|' + tag;
          var byG = mDialG(r);
          var kitchen = byG ? mDialMeasure(r, it.x) : mDialText(r, it.x);
          var weight = byG ? mDialText(r, it.x) : mDialMeasure(r, it.x);
          if (kitchen === weight) kitchen = '';
          var ml = mlOf(kitchen);
          var name = esc(r.name);
          var door = r.food
            ? '<button class="mtray-fn" data-mfood="' + esc(String(r.id)) + '" data-mx="' + it.x + '" data-mfslot="' + esc(sk) + '" aria-label="' + name + ', the food">'
            : '<button class="mtray-fn" data-open="' + esc(String(r.id)) + '" data-mx="' + it.x + '" aria-label="' + name + ', the recipe">';
          var line = '<div class="mfl-r">' +
              '<span class="mfl-lf">' + mBadgeHTML(r) + '</span>' +
              door + '<span class="mfl-nm">' + name + '</span></button>' +
              '<button class="mfl-amt" data-mamt="' + esc(k + '|' + tag) + '" aria-expanded="' + open + '" aria-label="' + name + ', ' +
                esc(kitchen ? kitchen + ', ' + weight : weight) + (it.l ? ', locked' : '') + '. ' + (open ? 'Close' : 'Change it') + '">' +
                '<span class="mtray-fm"><b>' + (it.l ? LOCK_SM : '') + esc(kitchen) + '</b>' + (ml ? '<small><i> &middot; </i>' + ml + '</small>' : '') + '</span>' +
                '<em class="num">' + esc(weight) + '</em></button>' +
              '<input class="mitem-ate" type="checkbox" data-meat="' + esc(tag) + '" aria-label="Eaten, ' + name + '"' +
                (it.eaten ? ' checked' : '') + (ahead ? ' disabled' : '') + '>' +
            '</div>';
          return '<div class="mtray-f' + (r.food ? '' : ' mtray-go') + (it.eaten ? ' eaten' : '') + (it.l ? ' held' : '') + (open ? ' open' : '') + '">' +
            line + (open ? mLineOpenHTML(M, r, it, i) : '') + '</div>';
        }).join('');
      }

      /* The head: the name steps the views; an empty meal has nothing to
         step through, so its name is the way to food, the same as its pills
         (Blake: "clicking a meal that is empty just takes me to food
         selection, right?"). The circles ride in the name on Status. */
      var B = mBeadsOf(M);
      var head = live
        ? '<button class="mtray-hd" data-mview="' + esc(sk) + '" data-mv="' + view + '" aria-label="' + esc(name) + ', ' + esc(mBeadsSay(M, B)) +
            '. Showing ' + VIEW_SAY[view] + '; tap for ' + VIEW_SAY[view % 3 + 1] + '">' +
            '<span class="mtray-n">' + esc(name) + '</span>' + mPipsHTML(view) +
            (view !== 1 ? '' : M.aim ? mBeadsHTML(B) : '<span class="mtray-k num"><b>' + fmtK(M.sub.kcal) + '</b> kcal</span>') + '</button>'
        : '<button class="mtray-hd" data-mopen="' + esc(sk) + '" aria-label="' + esc(name) + ', nothing on it yet. Add food">' +
            '<span class="mtray-n">' + esc(name) + '</span></button>';
      /* The card's own verbs, drawings alone, "minimal inside the cards":
         + adds (the meal's sheet, where food is found), the scale balances
         this meal (the sheet's Balance), and ⊘ skips it. The bar along the
         bottom names the scale and the rest. Status keeps only Skip; the
         scale is in Details, with the amounts it moves. A meal anything was
         eaten from is not skippable: that food happened. */
      var canBal = items.some(function (it) { return !it.eaten && LIVE.BY_ID[it.id]; });
      var verbs = (view === 1 || !onPlan ? '' : '<button class="mtray-ib" data-mopen="' + esc(sk) + '" aria-label="Add food to ' + esc(name) + '" title="Add food">' + mIcon('plus') + '</button>') +
        (view === 3 && canBal ? '<button class="mtray-ib" data-mbal="' + esc(sk) + '" aria-label="Balance every food on ' + esc(name) +
          ', the amounts you set included" title="Balance">' + mIcon('scales') + '</button>' : '') +
        (onPlan && !anyEaten ? '<button class="mtray-ib" data-mskipask="' + esc(sk) + '" aria-label="Skip ' + esc(name) + ' today" title="Skip today">' + mIcon('skip') + '</button>' : '');

      /* Skipping a meal with food on it asks first, on the card, and says
         what goes: its plates come off and its share moves to the meals
         still open. Undo in the toast after puts both back. */
      var ask = '';
      if (S.mSkipAsk === k + '|' + sk && live && !anyEaten) {
        var to = slots.list.filter(function (s) {
          var its = day[s.k] || [];
          return s.k !== sk && !(!its.length && mSkipped(k, s.k)) && !(its.length && its.every(function (it) { return it.eaten; }));
        }).map(function (s) { return esc(s.n); });
        var where = to.length > 1 ? to.slice(0, -1).join(', ') + ' and ' + to[to.length - 1] : to[0];
        ask = '<div class="mtray-ask" role="group" aria-label="Skip ' + esc(name) + '?">' +
          '<p>Skip ' + esc(name) + ' today? ' + (live === 1 ? 'Its planned food comes off' : 'Its ' + live + ' planned foods come off') +
            (where ? ', and its share goes to ' + where + '.' : '. No meal is left to take its share.') + '</p>' +
          '<div class="mtray-askb"><button class="btn-primary" data-mskipgo="' + esc(sk) + '">Skip ' + esc(name) + '</button>' +
            '<button class="ghost" data-mskipno="' + esc(sk) + '">Keep it</button></div></div>';
      }

      /* The pills are the door to the meal's sheet, and the door reaches
         over the card (.mtray-b::after, the length of .mtray-c); the head
         and the foods' lines stand above that reach, so a tap on a food is
         the food's and on the card's margins is still the meal's. Status
         keeps the door with nothing in it: its reach, and a way into the
         meal for a keyboard, on a card with no pills and no +. */
      return '<div class="mslot mtray mv-' + view + (items.length ? ' filled' : '') + (M.eatenAll ? ' done' : '') + '" data-mslot="' + esc(sk) + '">' +
          M.dot +
          '<div class="mtray-c">' +
            '<div class="mtray-hr">' + head + '<span class="mtray-vbs">' + verbs + '</span></div>' +
            '<button class="mtray-b" data-mopen="' + esc(sk) + '" aria-label="Open ' + esc(name) + (M.pillsSay ? ' — ' + esc(M.pillsSay) : '') + '">' +
            (view === 1 ? '</button>' :
                /* The meal's pills, small: what it holds against its share,
                   the way its sheet says it (Blake: "adding back the subtle
                   pills that show me that meal's calories and macros"). An
                   empty meal shows them too: 0 of its share is what it is
                   for. */
                (M.aim ? '<span class="mtray-caps">' + capsHTML(M.sub, M.aim, M.ask && M.ask.spent, !!(M.ask && M.ask.capped)) + '</span>'
                  : '<span class="mtray-k num"><b>' + fmtK(M.sub.kcal) + '</b> kcal</span>') +
              '</button>' +
              '<div class="mtray-fs">' + (lines || '<span class="mtray-f mtray-none">Nothing yet</span>') + '</div>') +
            ask +
          '</div>' +
        '</div>' + (onPlan ? mCascadeLineHTML(sk, targets, slots) : '');
    };
    var html = slots.list.map(function (s) { return trayHTML(s.k, s.n, true); }).join('');
    var onPlanKeys = slots.list.map(function (s) { return s.k; });
    Object.keys(day).forEach(function (sk) {
      if (onPlanKeys.indexOf(sk) < 0) html += trayHTML(sk, slots.names[sk] || 'Meal', false);
    });
    $('macroSlots').innerHTML = html;

    var readout = macroFootHTML(day, targets, slots);
    $('macroFoot').innerHTML = readout.foot;
    /* Contents only — the region itself must outlive the redraw or it
       announces nothing. */
    $('macroLimits').innerHTML = readout.limits;
    /* The pills are the folded copy of the bars, so they are rebuilt with
       them. The row itself is static markup and keeps its own handler; only
       what is inside it changes. */
    $('macroPills').innerHTML = readout.pills;
    /* The scale's box is a draft like the join code and the picker's search:
       a sync emit arriving mid-keystroke must not replace "187.4" with the
       last saved value while the pending save still holds what was typed. */
    var wIn = $('macroWeigh').querySelector('#mWeight');
    var wDraft = wIn && document.activeElement === wIn ? wIn.value : null;
    $('macroWeigh').innerHTML = macroWeighHTML(k);
    if (WGAPI.week) WGAPI.week();
    if (wDraft !== null) {
      var wBack = $('macroWeigh').querySelector('#mWeight');
      if (wBack) { wBack.value = wDraft; wBack.focus(); }
    }
    // the first stop of the day fills in once the scale has been read
    $('macroWeigh').classList.toggle('done', MWEIGHTS[k] > 0);

    /* A day with a different plan is a card of a different height, so the
       fold's measurements go out with the markup they were taken from and
       the card is laid out again from the scroll position it is at. Without
       this, ticking a meal off while the card is folded would leave it
       clipped to yesterday's numbers. */
    mFoldForget();
    syncShrunk();
  }

  /* A meal's pills with a food added that is not on it yet: the "How
     much?" form's "Dinner, with this" (src/camera.js), drawn by the same
     capsHTML as the meal sheet's own so the two read alike. `add` is what
     the food would put on the plate, in the day's own 4-4-9 calories. */
  function mMealNowHTML(sk, add) {
    var k = mViewKey(), day = mDay(k), targets = mDayTargets(k), slots = mReadSlots();
    var M = mMealModel(k, sk, '', true, day, targets, slots);
    if (!M || !M.aim || !(M.aim.kcal || M.aim.p || M.aim.f || M.aim.c)) return '';
    var sub = {};
    ['kcal', 'p', 'f', 'c'].forEach(function (m) { sub[m] = (M.sub[m] || 0) + ((add && add[m]) || 0); });
    return '<div class="mcaps">' + capsHTML(sub, M.aim, M.ask && M.ask.spent, !!(M.ask && M.ask.capped)) + '</div>';
  }

  return { renderMacros: renderMacros, mDayPick: mDayPick, mMealSheetParts: mMealSheetParts, mMealNowHTML: mMealNowHTML };
};
