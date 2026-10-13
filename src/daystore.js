/* My Day's store and the shape of a day: what you have said never to
 * suggest (MNEVER, mNever, mSetNever) and what a serving weighs finished
 * (MBATCHG, mSetBatchG, mServeG); the days themselves (MDAYS); which meals
 * a day holds and what each draws from (mReadSlots, mWriteSlots,
 * mAllSections, mSlotSecs, mSlotKind); whether a meal is spoken for or
 * over (mSlotSpokenFor, mSlotClosed); how much room Fill has left
 * (mFillRoom); and why Fill put a plate there, as the chip that asks and
 * the strip it opens, and taking that plate off for another
 * (mWhyChip, mBatchStrip, mWhyStrip, mReplacePlate). The longer account is
 * with the code.
 *
 * A part of app.js (Nourish) in a file of its own. app.js calls
 * HiveParts.daystore(app) once, as it starts, and keeps what it gives back
 * under the same names; the stores are only ever written into, so app.js
 * declares them again from the part. The recipes (RECIPES, BY_ID) are
 * replaced as they change, so the part reads them through LIVE
 * (tests/scope.test.js holds the lists to each other). Loaded before
 * app.js.
 */
(window.HiveParts = window.HiveParts || {}).daystore = function (app) {
  'use strict';

  // what it reads of the app's, and (LIVE) what the app replaces as it goes: BY_ID, RECIPES
  var MEAL_SECS = app.MEAL_SECS;
  var MSLOT_DEFS = app.MSLOT_DEFS;
  var S = app.S;
  var dinerKeep = app.dinerKeep;
  var kcalOf = app.kcalOf;
  var mDay = app.mDay;
  var mDayTargets = app.mDayTargets;
  var mEditDay = app.mEditDay;
  var mFoldDue = app.mFoldDue;
  var mNearIds = app.mNearIds;
  var mPut = app.mPut;
  var mSideUp = app.mSideUp;
  var mStamp = app.mStamp;
  var mTopUp = app.mTopUp;
  var mTotals = app.mTotals;
  var mTryAgain = app.mTryAgain;
  var todayKey = app.todayKey;
  var LIVE = app.LIVE;

  /* What you have said not to suggest. Blake, on the endive Fill kept adding
     for fibre: the logic is fine, "it's just invisible in the app and a food
     i might want to stop from suggesting somehow." Keyed id -> the day it was
     said. Suggestions only: Fill's dishes, its sides and toppers, "Try
     another", and the picker's lists before you type — searching still finds
     everything, and anything you add yourself is yours. Synced as part `nv`,
     so every device leaves it out. */
  var MNEVER = (function () {
    try {
      var v = JSON.parse(localStorage.getItem('bsc.macroNever'));
      if (v && typeof v === 'object' && !Array.isArray(v)) return v;
    } catch (e) { /* none yet */ }
    return {};
  })();
  function mNever(id) { return !!MNEVER[String(id)]; }

  /* What one serving of a recipe weighs, finished. Blake, on the Cafe Rio
     pork: the plate said half a serving and he had to open the recipe, switch
     it to grams and do the division on his phone's calculator. The weight
     that matters is the COOKED one, which only the cook can know — pork
     loses about a third in the pot — so the plate shows an estimate from the
     raw ingredients, marked "~", until the batch is weighed once. Then it is
     exact for the way he makes it. Keyed recipe id -> { s: grams a serving,
     on: day }. Synced as part `bg`. */
  var MBATCHG = (function () {
    try {
      var v = JSON.parse(localStorage.getItem('bsc.macroBatchG'));
      if (v && typeof v === 'object' && !Array.isArray(v)) return v;
    } catch (e) { /* none yet */ }
    return {};
  })();
  function mSetBatchG(id, perServing) {
    mFoldDue();
    var k = String(id);
    if (perServing > 0) MBATCHG[k] = { s: Math.round(perServing * 10) / 10, on: todayKey() };
    else delete MBATCHG[k];
    mStamp('bg');
    mPut('bsc.macroBatchG', MBATCHG);
  }
  /* { g: grams a serving, est: true when it is the ingredient estimate }, or
     null when there is nothing to go on. The estimate counts what the recipe
     says is eaten of each line (the dredge's third, the frying oil's share). */
  function mServeG(r) {
    if (!r || r.food) return null;
    var w = MBATCHG[String(r.id)];
    if (w && w.s > 0) return { g: w.s, est: false };
    var tot = 0;
    (r.ingp || []).forEach(function (x) { tot += (Number(x.g) || 0) * (x.pe > 0 ? x.pe : 1); });
    return tot > 0 ? { g: tot / (r.servN || 1), est: true } : null;
  }
  function mSetNever(id, on) {
    mFoldDue();
    var k = String(id);
    if (on) MNEVER[k] = todayKey(); else delete MNEVER[k];
    mStamp('nv');
    mPut('bsc.macroNever', MNEVER);
  }

  /* The days live in memory and persist best-effort, so a browser that refuses
     localStorage still gets a working tab for the session. */
  var MDAYS = (function () {
    try {
      var d = JSON.parse(localStorage.getItem('bsc.macroDays'));
      if (d && typeof d === 'object' && !Array.isArray(d)) return d;
    } catch (e) { /* fall through */ }
    return {};
  })();

  /* Which meals a day holds, and what each is called. list is the day as the
     reader shaped it; names remembers every key that ever had one, so a meal
     removed from the plan can still caption the plates it left on old days. */
  function mReadSlots() {
    try {
      var s = JSON.parse(localStorage.getItem('bsc.macroSlots'));
      if (s && s.list && s.list.length) return s;
    } catch (e) { /* private mode or corrupt — the defaults below */ }
    var names = {};
    MSLOT_DEFS.forEach(function (d) { names[d[0]] = d[1]; });
    return {
      list: MSLOT_DEFS.map(function (d) { return { k: d[0], n: d[1], t: d[2] }; }),
      names: names
    };
  }
  function mWriteSlots(s) {
    /* and dinner's share of the day moves the dinner you share (pwFitCaps):
       Save writes the targets first, so their own dinerKeep saw the old
       meals. */
    if (mPut('bsc.macroSlots', s)) { mStamp('sl'); dinerKeep(); }   // see mWriteMyFoods
  }

  /* Every section there is, in book order, straight off the live data — the
     same source the browse filter reads, so the two can never drift apart. */
  /* Every consumer of this escapes the key. It is built from secNum, which
     arrives from the household document, and a section key that reaches an
     HTML attribute unescaped is a script tag in somebody else's app. sane()
     in sync.js now rebuilds the record rather than trusting it, which is the
     fix that holds; this is the one that holds if that one is ever loosened. */
  function mAllSections() {
    var seen = {}, out = [];
    LIVE.RECIPES.forEach(function (r) {
      var key = r.book + '-' + r.secNum;
      if (!seen[key]) { seen[key] = true; out.push({ key: key, book: r.book, name: r.secName }); }
    });
    return out;
  }

  /* Which sections a meal draws from. The four kinds are named bundles of
     sections; 'x' means the reader chose their own boxes under Craft my plan.
     A custom set that lost all its boxes falls back to snacks rather than to
     a meal that can hold nothing. */
  function mSlotSecs(slot) {
    if (slot.t === 'x' && slot.secs && slot.secs.length) return slot.secs;
    return MEAL_SECS[slot.t] || MEAL_SECS.s;
  }

  /* A meal's KIND, from a slot or a bare slot key. The four defaults are
     their own kind; a meal somebody made themselves is 'x' and has none. */
  function mSlotKind(slot) {
    if (!slot) return '';
    if (typeof slot === 'object') return slot.t || '';
    var t = '';
    mReadSlots().list.forEach(function (sl) { if (sl.k === slot) t = sl.t || ''; });
    return t;
  }

  /* Whether a meal is spoken for, as far as drafting is concerned.
   *
     Food on a meal means Fill leaves it alone: what you put there is your
     business. A PIN is not that kind of statement. It says "I have this every
     day", not "this meal is finished" — and a seven-calorie Crio Bru pinned to
     breakfast was making Fill step over breakfast altogether, so the day came
     back with a seven-calorie breakfast and every other meal carrying what it
     should have held. */
  function mSlotSpokenFor(day, s) {
    var items = day[s.k] || [];
    if (!items.length) return false;
    if (mSlotClosed(day, s.k)) return true;
    var pinned = (s.pins || []).map(function (p) { return p.id; });
    return items.some(function (it) {
      /* Eaten or locked means hands off, whatever else is true of it.
       *
         This carve-out was written for pins alone — "a pin says I have this
         every day, not this meal is finished" — and it forgot that a pin can
         be eaten like anything else. A meal holding one pinned food you had
         already ticked read as EMPTY to the drafter, so Fill put a second
         dish on a breakfast that was over. Blake, finding it: "Fill is
         putting foods into meals that are complete".
       *
         A tick is the strongest statement on this screen. Nothing may be
         added to a meal carrying one. */
      if (it.eaten || it.l) return true;
      return pinned.indexOf(it.id) < 0;
    });
  }

  /* A meal you have started recording is over, as far as any machine is
     concerned. A tick is the strongest statement on this screen and a lock is
     the second; either one means nothing may be put on that meal. Stated once
     here because two passes need it and they were not agreeing. */
  function mSlotClosed(day, k) {
    return (day[k] || []).some(function (it) { return !!(it.eaten || it.l); });
  }

  /* How much of the day Fill could still put food into. The macros still
     short, priced, but never more than the calories still short: unused
     carbohydrate on a day already over used to count as room, so Fill
     added a 300 kcal crisp to a day 120 over. */
  function mFillRoom(day, targets) {
    var had = mTotals(day).all;
    var short = 4 * Math.max(0, targets.p - had.p) +
      4 * Math.max(0, targets.c - had.c) +
      9 * Math.max(0, targets.f - had.f);
    var kcalLeft = kcalOf(targets) - (had.kcal || 0);
    if (kcalLeft <= 0 || short <= 0) return Math.min(short, kcalLeft);
    return kcalOf(targets) >= 100 ? Math.max(100, short) : short;
  }

  /* Why Fill put it there, as the button that asks about it. The chip is
     the question's own place: Blake picked this over a ⋯ menu ("so out of
     place in the app") and over the plate's sheet. A dish Fill chose for an
     empty meal is "Fill's pick"; a food it added says what it was for. */
  var MWHY = { fib: 'Added for fiber', p: 'Added for protein', f: 'Added for fat', c: 'Added for carbs',
    pick: 'Fill\u2019s pick' };
  var MWHY_SAY = { fib: 'to reach your fiber', p: 'to close your protein', f: 'to close your fat',
    c: 'to close your carbs', pick: 'for this meal' };
  function mWhyOf(it) {
    if (it.by !== 'f') return '';
    if (MWHY[it.why]) return it.why;
    var r = LIVE.BY_ID[it.id];
    return r && !r.food ? 'pick' : '';
  }
  function mWhyChip(it, tag) {
    var w = mWhyOf(it);
    if (!w) return '';
    return '<button class="mwhy mwhy-' + w + ' no-print" data-mwhy="' + tag + '" aria-expanded="' +
      (S.mWhyOpen === tag ? 'true' : 'false') + '">' + MWHY[w] +
      '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 3.5 5 6.5 8 3.5" fill="none" ' +
      'stroke="currentColor" stroke-width="1.5"/></svg></button>';
  }
  /* The strip the chip opens, inside the plate, in the green-edged style of
     the app's other in-meal cards. */
  function mBatchStrip(r, it, tag) {
    if (S.mBatchOpen !== tag) return '';
    var sg = mServeG(r);
    if (!sg) return '';
    var n = r.servN || 1;
    var fmt = function (g) { return Math.round(g).toLocaleString(); };
    return '<div class="mwhy-strip mbatch-strip no-print">' +
      (sg.est
        ? '<p>About ' + fmt(sg.g) + ' g a serving, from the raw ingredients. Weigh the finished ' +
          (n > 1 ? 'batch' : 'dish') + ' once and this becomes exact.</p>' +
          '<span class="mbatch-in"><label>Whole batch <input type="text" inputmode="decimal" id="mBatchIn" ' +
            'maxlength="6" autocomplete="off" aria-label="Finished batch weight in grams"> g</label>' +
            '<span class="mbatch-n">makes ' + n + '</span>' +
            '<button class="btn-primary" data-mbsave="' + tag + '">Save</button></span>'
        : '<p>Your batch: ' + fmt(sg.g * n) + ' g for ' + n + (n === 1 ? ' serving' : ' servings') +
          ', so ' + fmt(sg.g) + ' g each.</p>' +
          '<span class="mwhy-acts"><button class="ghost" data-mbforget="' + tag + '">Weigh again</button></span>') +
    '</div>';
  }

  function mWhyStrip(it, tag) {
    var w = mWhyOf(it);
    if (!w || S.mWhyOpen !== tag) return '';
    return '<div class="mwhy-strip no-print">' +
      '<p>' + (w === 'pick' ? 'Fill picked this ' : 'Fill added this ') + MWHY_SAY[w] + '.' +
        (it.eaten ? '' : ' It stays unless you change it.') + '</p>' +
      '<span class="mwhy-acts">' +
        (it.eaten ? '' : '<button class="ghost" data-mdo="swap:' + tag + '">Swap</button>') +
        '<button class="ghost" data-mdo="never:' + tag + '">Don\u2019t suggest</button>' +
      '</span></div>';
  }

  /* Take a plate Fill put there off the day and let the same pass choose
     again — the side pass for a fibre side, the topper for a gap — so what
     it was covering stays covered. A dish goes back through "Try another". */
  function mReplacePlate(k, sk, idx) {
    var it = (mDay(k)[sk] || [])[idx];
    if (!it) return;
    var r = LIVE.BY_ID[it.id];
    if (!r || !r.food) { mTryAgain(sk); return; }
    var targets = mDayTargets(k);
    var near = mNearIds(k);
    near[it.id] = 1;
    mEditDay(k, function (day) {
      (day[sk] || []).splice(idx, 1);
      if (it.why === 'fib') mSideUp(day, targets, near);
      else if (it.why) mTopUp(day, targets, near);
    });
  }

  return { mNever: mNever, mSetBatchG: mSetBatchG, mServeG: mServeG, mSetNever: mSetNever, mReadSlots: mReadSlots, mWriteSlots: mWriteSlots, mAllSections: mAllSections, mSlotSecs: mSlotSecs, mSlotKind: mSlotKind, mSlotSpokenFor: mSlotSpokenFor, mSlotClosed: mSlotClosed, mFillRoom: mFillRoom, mWhyChip: mWhyChip, mBatchStrip: mBatchStrip, mWhyStrip: mWhyStrip, mReplacePlate: mReplacePlate, MNEVER: MNEVER, MBATCHG: MBATCHG, MDAYS: MDAYS };
};
