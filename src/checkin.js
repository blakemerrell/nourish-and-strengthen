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
  var MDAYS = app.MDAYS;
  var S = app.S;
  var dayKey = app.dayKey;
  var keyDate = app.keyDate;
  var mFoldDue = app.mFoldDue;
  var mPut = app.mPut;
  var mReadSlots = app.mReadSlots;
  var mServeG = app.mServeG;
  var mStamp = app.mStamp;
  var LIVE = app.LIVE;

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
       bm  body measurements, inches: { wa waist, ch chest, ar arm, th thigh }.
           Weekly, not daily (Blake, 2026-10-30): with his weight holding
           while he lifts, the scale cannot tell fat lost from muscle gained,
           and a tape at the navel can.
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
    if (plain(v.vs)) {
      var vs = {};
      ['v8', 'v16', 'v24', 'v42'].forEach(function (vk) {
        var n = v.vs[vk];
        if (fin(n) && n > 0 && n <= 40) vs[vk] = Math.round(n);
      });
      if (Object.keys(vs).length) out.vs = vs;
    }
    if (plain(v.cf)) {
      var cf = {};
      Object.keys(v.cf).forEach(function (id) {
        var n = v.cf[id];
        if (/^[a-z0-9_]{1,24}$/.test(id) && fin(n) && n > 0 && n <= 40) cf[id] = Math.round(n);
      });
      if (Object.keys(cf).length) out.cf = cf;
    }
    /* Body measurements, in inches to the quarter: waist, chest, arm,
       thigh. A tape outside 10 to 80 inches is a typo, not a body. */
    if (plain(v.bm)) {
      var bm = {};
      ['wa', 'ch', 'ar', 'th'].forEach(function (f) {
        var n = v.bm[f];
        if (fin(n) && n >= 10 && n <= 80) bm[f] = Math.round(n * 4) / 4;
      });
      if (Object.keys(bm).length) out.bm = bm;
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
    { id: 'crio', n: 'Crio Bru', mg: 10, oz: 8 },
    { id: 'coffee', n: 'Coffee', mg: 95, oz: 8 },
    { id: 'pre', n: 'Pre-workout', mg: 200, oz: 12 },
    { id: 'energy', n: 'Energy drink', mg: 160, oz: 16 },
    { id: 'soda', n: 'Diet soda', mg: 45, oz: 12 },
    { id: 'tea', n: 'Black tea', mg: 47, oz: 8 }
  ];
  function defDrinkOz(id) {
    for (var i = 0; i < DRINKS0.length; i++) if (DRINKS0[i].id === id) return DRINKS0[i].oz;
    return 12;
  }
  function mDrinksClean(v) {
    if (!plain(v) || !Array.isArray(v.list)) return null;
    var seen = {};
    var list = v.list.filter(function (d) {
      var ok = plain(d) && /^[a-z0-9_]{1,24}$/.test(d.id) && !seen[d.id] && typeof d.n === 'string' &&
        d.n.trim() && fin(d.mg) && d.mg >= 0 && d.mg <= 1000;
      if (ok) seen[d.id] = 1;
      return ok;
    }).map(function (d) {
      var oz = fin(d.oz) && d.oz >= 0 && d.oz <= 64 ? Math.round(d.oz) : defDrinkOz(d.id);
      return { id: d.id, n: d.n.trim().slice(0, 30), mg: Math.round(d.mg), oz: oz };
    });
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
  var VESSELS0 = [
    { id: 'v8', oz: 8, n: 'Little cup', short: '8oz cup' },
    { id: 'v16', oz: 16, n: 'Bottle / glass', short: '16oz bottle' },
    { id: 'v24', oz: 24, n: 'Shaker', short: '24oz shaker' },
    { id: 'v42', oz: 42, n: 'Stanley mug', short: '42oz Stanley' }
  ];
  function mVesselSVG(id) {
    if (id === 'v8') {
      return '<svg class="mhyd-vsvg" viewBox="0 0 28 28" aria-hidden="true">' +
        '<path d="M5 9.5h13.5l-1.3 11a2.5 2.5 0 0 1-2.5 2.2H8.8a2.5 2.5 0 0 1-2.5-2.2L5 9.5Z" fill="currentColor" fill-opacity="0.16" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>' +
        '<path d="M18.5 11.5h2.3a2.7 2.7 0 0 1 0 5.4h-2.9" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>' +
      '</svg>';
    }
    if (id === 'v16') {
      return '<svg class="mhyd-vsvg" viewBox="0 0 28 28" aria-hidden="true">' +
        '<path d="M7.2 5.5h13.6l-1.6 17a2 2 0 0 1-2 1.8h-6.4a2 2 0 0 1-2-1.8l-1.6-17Z" fill="currentColor" fill-opacity="0.14" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>' +
        '<path d="M8.1 12.5h11.8l-.9 10a1.5 1.5 0 0 1-1.5 1.3h-7a1.5 1.5 0 0 1-1.5-1.3l-.9-10Z" fill="currentColor" fill-opacity="0.24"/>' +
      '</svg>';
    }
    if (id === 'v24') {
      return '<svg class="mhyd-vsvg" viewBox="0 0 28 28" aria-hidden="true">' +
        '<path d="M9.5 3.5h9l1 3h-11l1-3Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>' +
        '<path d="M7.5 6.5h13l-1.3 16a2 2 0 0 1-2 1.8h-6.4a2 2 0 0 1-2-1.8l-1.3-16Z" fill="currentColor" fill-opacity="0.16" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>' +
        '<line x1="17" y1="11" x2="19" y2="11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' +
        '<line x1="16.7" y1="15" x2="18.7" y2="15" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' +
        '<line x1="16.4" y1="19" x2="18.4" y2="19" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' +
      '</svg>';
    }
    return '<svg class="mhyd-vsvg" viewBox="0 0 28 28" aria-hidden="true">' +
      '<line x1="13.5" y1="1.8" x2="13.5" y2="6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' +
      '<path d="M6.8 6h13.4v8.2l-1.6 3v5.3a1.8 1.8 0 0 1-1.8 1.8h-6.6a1.8 1.8 0 0 1-1.8-1.8v-5.3l-1.6-3V6Z" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>' +
      '<path d="M20.2 8.2h2.6a1.8 1.8 0 0 1 1.8 1.8v4.2a1.8 1.8 0 0 1-1.8 1.8h-3.6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';
  }
  function mVesselsOf(k) {
    var r = mAmOf(k), raw = plain(r.vs) ? r.vs : {};
    var out = { v8: raw.v8 || 0, v16: raw.v16 || 0, v24: raw.v24 || 0, v42: raw.v42 || 0 };
    var plainWt = fin(r.wt) ? r.wt : 0;
    var sumOz = out.v8 * 8 + out.v16 * 16 + out.v24 * 24 + out.v42 * 42;
    if (plainWt > sumOz) {
      var rem = plainWt - sumOz;
      [42, 24, 16, 8].forEach(function (sz) {
        if (rem >= sz && (rem % sz === 0 || sz === 8)) {
          var add = Math.floor(rem / sz);
          out['v' + sz] += add;
          rem -= add * sz;
        }
      });
    }
    return out;
  }

  /* What counts as a drink by its name. A food or a recipe whose name says
     milk, coffee, a shake, Crio Bru — "Bru" or "Brew", because Blake's own is
     Protein Crio Brew and it counted nothing while the name had to say "Bru".
     The first list is what a name can say and still be food: milk in a
     gelatin cup or a pudding is in the name, and nobody drinks either. */
  function mIsMealDrink(r) {
    if (!r) return false;
    var id = String(r.id || '');
    if (id === 'f:milk' || id === 'f:evaporated_milk' || id === 'f:crio_bru' || id === 'f:tomato_soup' ||
        id === 'f:cream_soup_chx' || id === 'f:cream_soup_mush' || id === 'f:soup_rts') return true;
    var nm = String(r.name || '');
    if (/\b(?:oil|butter|syrup|honey|vinegar|sauce|dressing|ranch|mayo|mustard|ketchup|salsa|gravy|egg\s*whites?|egg\s*substitute|liquid\s*eggs?|cream\s*cheese|oats|oatmeal|porridge|yogurt|cottage\s*cheese|ice\s*cream|gelatin|pudding|custard|whip|fluff)\b/i.test(nm)) return false;
    /* A food whose label measures it in millilitres or fluid ounces is a
       drink, whatever its flavour is called. Blake's energy drinks are named
       for their flavours — "Gorilla Mind Red Gummy Fish", "Bucked Up Rainbow
       Candy" — and the name test found nothing to drink in either, while
       the label said 220 mL. The list above still keeps oil, syrup and
       sauces out, which are poured by the millilitre too. */
    if (r.food && /(?:^|\d|\s|\()(?:ml|millilit(?:er|re)s?|fl\.?\s*oz)\b/i.test(String(r.unit || ''))) return true;
    return /\b(?:crio\s*br(?:[uü]|ew)|milk|fairlife|kefir|protein\s*shake|shake|smoothie|energy\s*drink|celsius|monster|alani|red\s*bull|ghost|reign|coffee|espresso|latte|cold\s*brew|tea|chai|matcha|soda|diet\s*soda|cola|pop|sparkling\s*water|seltzer|water|electrolyte|liquid\s*i\.?v\.?|lmnt|gatorade|powerade|juice|lemonade|limeade|bone\s*broth|broth|stock)\b/i.test(nm);
  }
  /* Soup is not a drink and is still mostly water you take in, so a bowl of
     it counts (Antigravity's catch, 2026-10-30: the chicken noodle soup's
     fourteen ounces were going nowhere). A stew and a chowder the same. */
  function mIsSoup(r) {
    return !!r && !r.food && /\b(?:soup|stew|chowder|bisque)\b/i.test(String(r.name || ''));
  }

  /* The fluid a recipe carries, read from its own ingredients.
   *
     Before this a recipe only counted if its NAME sounded like a drink, and
     then it counted a flat cup. Blake's own "Protein Crio Brew" — two cups of
     brewed Crio Bru and a cup of milk, about 24 oz — counted nothing at all.
     The six Crio Bru recipes in the book counted 8 oz each though most pour 12.
   *
     Every recipe, the book's and your own, already carries its ingredients
     parsed to grams (ingp), so the honest number is right there: add up the
     lines that are a drinkable liquid, per serving, times what you ate.
   *
     Only for a drink (the Power Drinks section, or a drink by its name) or a
     soup, and only when the liquid is most of the recipe (FLUID_SHARE of its
     weight). Run across the book without those two guards, it counted ten
     ounces from soft pretzels and cheddar bagels — the pot of water they are
     boiled in is an ingredient line — four from rice that drinks its water
     up, and six from the milk in a rice pudding. Water in a recipe is almost
     always cooking water; water in a drink or a soup is the point of it. */
  var FLUIDS = { crio_bru: 1, milk: 1, water: 1, broth: 1 };
  var FLUID_SHARE = 0.6;
  function mRecipeFluidOz(r, x) {
    if (!r || r.food || !Array.isArray(r.ingp) || !r.ingp.length) return 0;
    if (!(r.secName === 'Power Drinks' || mIsMealDrink(r) || mIsSoup(r))) return 0;
    var wet = 0, all = 0;
    r.ingp.forEach(function (it) {
      var g = (Number(it && it.g) || 0) * (it && it.pe > 0 ? it.pe : 1);
      all += g;
      if (it && FLUIDS[it.k]) wet += g;
    });
    if (!(wet > 0) || wet < all * FLUID_SHARE) return 0;
    var mult = fin(x) && x > 0 ? x : 1;
    return Math.max(1, Math.round(wet / (r.servN || 1) / 29.5735 * mult));
  }

  /* How many ounces one line of a meal adds to the day's water: a saved
     combo by its parts, a recipe by its ingredients, and anything else that
     is a drink by its name and its unit. One answer, read by the Water card
     and by the badge on the meal row, so the two cannot disagree. */
  function mItemFluidOz(r, x) {
    if (!r) return 0;
    var mult = fin(x) && x > 0 ? x : 1;
    if (Array.isArray(r.parts) && r.parts.length && LIVE && LIVE.BY_ID) {
      var partOz = 0;
      r.parts.forEach(function (pt) {
        var pr = LIVE.BY_ID[pt.id];
        if (pr) partOz += mItemFluidOz(pr, (pt.x || 1) * mult);
      });
      if (partOz > 0) return partOz;
    }
    var recOz = mRecipeFluidOz(r, mult);
    if (recOz > 0) return recOz;
    if (!mIsMealDrink(r)) return 0;
    var id = String(r.id || ''), nm = String(r.name || ''), u = String(r.unit || '');
    if (id === 'f:crio_bru' || /\b(?:crio\s*br(?:[uü]|ew)|coffee|espresso|latte|cold\s*brew|tea|chai|matcha)\b/i.test(nm)) {
      if (u === 'oz' && mult < 3) return 8;
      if (u === 'oz') return Math.max(1, Math.round(mult));
      if (u === 'cup' || u === 'cups') return Math.max(1, Math.round(8 * mult));
      return Math.max(1, Math.round(8 * (mult < 1 ? 1 : mult)));
    }
    var mOz = /(\d+(?:\.\d+)?)\s*(?:fl\.?\s*)?oz\b/i.exec(u) || /(\d+(?:\.\d+)?)\s*(?:fl\.?\s*)?oz\b/i.exec(nm);
    if (mOz) return Math.max(1, Math.round(Number(mOz[1]) * mult));
    if (/^(?:fl\.?\s*)?oz$/i.test(u.trim())) return Math.max(1, Math.round(mult < 3 ? 8 : mult));
    if (/^cups?$/i.test(u.trim())) return Math.max(1, Math.round(8 * mult));
    var mCup = /(\d+(?:\.\d+)?)\s*cups?\b/i.exec(u);
    if (mCup) return Math.max(1, Math.round(Number(mCup[1]) * 8 * mult));
    var mMl = /(\d+(?:\.\d+)?)\s*m[lL]\b/.exec(u);
    if (mMl) return Math.max(1, Math.round((Number(mMl[1]) / 29.5735) * mult));
    var grams = fin(r.grams) ? r.grams : fin(r.g) ? r.g : 0;
    if (r.food && grams >= 60) return Math.max(1, Math.round((grams / 29.5735) * mult));
    if (!r.food && mServeG) {
      var sg = mServeG(r);
      if (sg && sg.g >= 60) return Math.max(1, Math.round((sg.g / 29.5735) * mult));
    }
    if (/\b(?:energy\s*drink|celsius|monster|alani|red\s*bull|ghost|reign|soda|diet\s*soda|cola|pop|sparkling\s*water|seltzer|protein\s*shake|fairlife|shake|smoothie)\b/i.test(nm)) {
      return Math.max(1, Math.round(12 * mult));
    }
    return Math.max(1, Math.round(8 * mult));
  }
  function mHydChip(r, x) {
    var oz = mItemFluidOz(r, x);
    if (!(oz > 0)) return '';
    return '<span class="mhyd-chip num">' +
      '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2C8 2 3.8 6.8 3.8 10a4.2 4.2 0 0 0 8.4 0C12.2 6.8 8 2 8 2Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>' +
      oz + ' oz fluid</span>';
  }
  function mMealLiquids(k) {
    if (!MDAYS || !LIVE || !LIVE.BY_ID) return { oz: 0, items: [] };
    var day = MDAYS[k];
    if (!plain(day)) return { oz: 0, items: [] };
    var slots = mReadSlots ? mReadSlots() : { names: {} };
    var list = [], totalOz = 0;
    Object.keys(day).forEach(function (sk) {
      var arr = day[sk];
      if (!Array.isArray(arr)) return;
      var mName = (slots.names && slots.names[sk]) || sk;
      arr.forEach(function (it) {
        if (!it || !it.id) return;
        var r = LIVE.BY_ID[it.id];
        if (!r) return;
        var oz = mItemFluidOz(r, it.x);
        if (oz > 0) {
          totalOz += oz;
          list.push({ name: r.name, meal: mName, oz: oz, eaten: !!it.eaten });
        }
      });
    });
    return { oz: totalOz, items: list };
  }

  function mDrinksOz(k) {
    var dk = mDrinks(), cf = mAmOf(k).cf || {}, oz = 0;
    dk.list.forEach(function (d) {
      var dOz = fin(d.oz) ? d.oz : defDrinkOz(d.id);
      oz += (cf[d.id] || 0) * dOz;
    });
    return oz;
  }
  function mWaterOz(k) {
    var r = mAmOf(k);
    return (fin(r.wt) ? r.wt : 0) + mDrinksOz(k) + mMealLiquids(k).oz;
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
    var wOz = mWaterOz(k);
    if (wOz > 0) out.push(wOz + ' oz water');
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
      var dOz = fin(d.oz) ? d.oz : defDrinkOz(d.id);
      var sub = (dOz > 0 ? dOz + ' oz · ' : '') + d.mg + ' mg';
      return '<div class="am-drink"><span><b>' + esc(d.n) + '</b><small>' + sub + '</small></span>' +
        '<button class="am-b" ' + attr + '="cf:' + d.id + ':-1" aria-label="One less ' + esc(low) + '"' + (c ? '' : ' disabled') + '>−</button>' +
        '<b class="am-n">' + c + '</b>' +
        '<button class="am-b" ' + attr + '="cf:' + d.id + ':1" aria-label="One more ' + esc(low) + '">+</button></div>';
    }).join('');
  }
  /* ---- body measurements ---- */
  var BM_FIELDS = [['wa', 'Waist', 'at the navel'], ['ch', 'Chest', ''], ['ar', 'Arm', 'flexed'], ['th', 'Thigh', '']];
  /* The last morning on or before k with a waist on it, or ''. */
  function mBodyLastKey(k, field) {
    var f = field || 'wa', best = '';
    Object.keys(MAM).forEach(function (d) {
      var r = MAM[d];
      if (d <= k && d > best && plain(r) && plain(r.bm) && fin(r.bm[f])) best = d;
    });
    return best;
  }
  function mDaysBetween(a, b) { return Math.round((keyDate(b) - keyDate(a)) / 864e5); }
  /* Every morning with a measurement, oldest first, for the trend. */
  function mBodyDays() {
    return Object.keys(MAM).filter(function (d) { return plain(MAM[d]) && plain(MAM[d].bm); }).sort()
      .map(function (d) { return { k: d, bm: MAM[d].bm }; });
  }
  function mInch(n) { return fin(n) ? (Math.round(n * 4) / 4) + '' : ''; }
  /* Asked once a week. Open on a morning when the last waist is six days
     old or more (or never), or when this morning already has one; folded to
     a single line otherwise, so the other six mornings stay as short as
     they were. */
  function mBodyHTML(k) {
    var r = mAmOf(k), bm = plain(r.bm) ? r.bm : {};
    var last = mBodyLastKey(k);
    var age = last ? mDaysBetween(last, k) : -1;
    var due = !last || age >= 6;
    var open = due || last === k || S.amBodyOpen;
    var lastBm = last ? MAM[last].bm : {};
    var say = last === k ? 'Measured this morning ✓'
      : last ? 'Last ' + (age === 1 ? 'yesterday' : age + ' days ago') + (lastBm.wa ? ' · waist ' + mInch(lastBm.wa) + '″' : '')
      : 'Once a week, same morning, before eating';
    if (!open) {
      return '<div class="am-body">' + row('Measurements', say,
        '<button class="am-tog" data-am="bmopen" aria-expanded="false">Measure</button>') + '</div>';
    }
    var inputs = BM_FIELDS.map(function (f) {
      var v = fin(bm[f[0]]) ? mInch(bm[f[0]]) : '';
      var prev = last && last !== k && fin(lastBm[f[0]]) ? mInch(lastBm[f[0]]) : '';
      return '<label class="am-bm"><span class="am-bm-l">' + f[1] + (f[2] ? ' <small>' + f[2] + '</small>' : '') + '</span>' +
        '<input type="text" class="am-in am-bm-in" id="amBm_' + f[0] + '" data-bm="' + f[0] + '" inputmode="decimal" maxlength="5" autocomplete="off" value="' +
        v + '" placeholder="' + (prev || 'in') + '"></label>';
    }).join('');
    return '<div class="am-body open">' +
      row('Measurements' + (due && last !== k ? ' <span class="am-due">this week</span>' : ''), say, '') +
      '<div class="am-bm-grid">' + inputs + '</div>' +
      '<div class="am-bm-act"><span class="am-bm-err" id="amBmErr" role="alert"></span>' +
        '<button type="button" class="am-save' + (last === k ? ' saved' : '') + '" data-am="bmsave">' + (last === k ? 'Saved ✓' : 'Save') + '</button></div>' +
    '</div>';
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
    return '<div class="am no-print" data-amkey="' + k + '">' + sleep + steps + cre + caf + mBodyHTML(k) + '</div>';
  }
  /* Dedicated Water & Drinks card for Nourish day view (src/myday.js):
     ounces of water (plain water + fluid from drinks) with +8 / +16 / +24 / −8 oz
     1-tap controls, live caffeine drink counters, and collapsible header like
     the meal sections above it. */
  function mHydrationCardHTML(k, goalOz) {
    var r = mAmOf(k);
    var plainWt = fin(r.wt) ? r.wt : 0;
    var drinkWt = mDrinksOz(k);
    var mealLiq = mMealLiquids(k);
    var mealWt = mealLiq.oz;
    var wt = plainWt + drinkWt + mealWt;
    var goal = mWaterGoalOz(goalOz ? goalOz * 2 : 200);
    if (fin(goalOz) && goalOz >= 40 && goalOz <= 200) goal = Math.round(goalOz);
    var pct = goal > 0 ? Math.max(0, Math.min(100, Math.round(wt / goal * 100))) : 0;
    var shown = mDrinksShown(k), cf = r.cf || {}, mg = mCafMg(k);
    var drinks = mDrinksRowsHTML(shown, cf, true);
    /* Shut until you open it. It used to arrive open, a meter, four vessels
       and a drinks drawer under the last meal, on every visit; Blake
       (2026-10-30): "The water and drinks tab at the bottom opens expanded. I
       don't want it to open expanded." The header already carries the
       ounces and the caffeine, which is what a glance wants. Opening is per
       day, like the meal cards, and print (mViewAll) still shows it all. */
    var shut = !(S.mHydOpen && S.mHydOpen[k]) && !S.mViewAll;
    var vs = mVesselsOf(k);
    var vParts = [];
    VESSELS0.forEach(function (v) {
      if (vs[v.id] > 0) vParts.push(vs[v.id] + '\u00d7 ' + v.short);
    });
    var subPieces = [];
    if (drinkWt > 0 || mealWt > 0) {
      subPieces.push(plainWt + ' oz water' +
        (drinkWt > 0 ? ' + ' + drinkWt + ' oz from drinks' : '') +
        (mealWt > 0 ? ' + ' + mealWt + ' oz from meals' : ''));
    }
    if (vParts.length) subPieces.push(vParts.join(', '));
    var subLine = subPieces.length
      ? '<div class="mhyd-sub">' + subPieces.join(' · ') + '</div>'
      : '';
    var vesselsHTML = VESSELS0.map(function (v) {
      var c = vs[v.id] || 0;
      var canSub = c > 0 || plainWt >= v.oz;
      return '<div class="mhyd-vcard' + (c > 0 ? ' on' : '') + '">' +
        (c > 0 ? '<span class="mhyd-vcnt num" aria-label="' + c + ' ' + esc(v.n) + '">&times;' + c + '</span>' : '') +
        '<button type="button" class="mhyd-wbtn" data-hyd="wt:' + v.oz + '" aria-label="Add ' + v.oz + ' oz water (' + esc(v.n) + ')">' +
          mVesselSVG(v.id) +
          '<b>+' + v.oz + ' oz</b><small>' + esc(v.n) + '</small></button>' +
        '<div class="mhyd-vstep">' +
          '<button type="button" class="mhyd-vminus" data-hyd="wt:-' + v.oz + '" aria-label="Remove ' + v.oz + ' oz water"' + (canSub ? '' : ' disabled') + '>&minus;</button>' +
          '<span class="mhyd-voz num">' + (c * v.oz) + ' oz</span>' +
        '</div>' +
      '</div>';
    }).join('');
    var mealLiqHTML = mealLiq.items.length
      ? '<div class="mhyd-meals"><span class="mhyd-meals-lbl">Auto-counted from meals:</span>' +
          mealLiq.items.map(function (it) {
            return '<span class="mhyd-mchip num"><b>+' + it.oz + ' oz</b> ' + esc(it.name) + ' <small>(' + esc(it.meal) + ')</small></span>';
          }).join('') +
        '</div>'
      : '';
    var cafOpen = !!(S.hydCafOpen || S.hydAdd);
    return '<section class="mhyd-card' + (shut ? ' shut' : '') + ' no-print" data-amkey="' + esc(k) + '" aria-label="Water and drinks">' +
      '<button type="button" class="mhyd-head" data-hyd="fold" aria-expanded="' + (!shut) + '" aria-label="Water and Drinks, ' + wt + ' of ' + goal + ' oz' + (mg > 0 ? ', ' + mg + ' mg caffeine' : '') + '. ' + (shut ? 'Expand' : 'Collapse') + '">' +
        '<span class="mhyd-title"><svg class="mhyd-ic" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.5C10 2.5 4.5 8.6 4.5 12.6a5.5 5.5 0 0 0 11 0C15.5 8.6 10 2.5 10 2.5Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>' +
          '<b>Water &amp; Drinks</b><span class="mhyd-chev" aria-hidden="true">' + (shut ? '▸' : '▾') + '</span></span>' +
        '<span class="mhyd-badges">' +
          '<span class="mhyd-pill' + (wt >= goal ? ' hit' : '') + '"><b>' + wt + '</b> / ' + goal + ' oz' + (wt >= goal ? ' ✓' : '') + '</span>' +
          (mg > 0 ? '<span class="mhyd-pill caf' + (mg > 400 ? ' over' : '') + '"><b>' + mg + '</b> mg caf</span>' : '') +
        '</span>' +
      '</button>' +
      (shut ? '' :
        '<div class="mhyd-body">' +
          '<div class="mhyd-meter" role="meter" aria-label="Water intake" aria-valuemin="0" aria-valuemax="' + goal + '" aria-valuenow="' + wt + '">' +
            '<i style="width:' + pct + '%"></i>' +
          '</div>' +
          subLine +
          '<div class="mhyd-water-btns">' + vesselsHTML + '</div>' +
          mealLiqHTML +
          '<div class="mhyd-caf' + (cafOpen ? ' open' : '') + '">' +
            '<button type="button" class="mhyd-caf-tog" data-hyd="caftog" aria-expanded="' + cafOpen + '">' +
              '<span class="mhyd-caf-t">Ad-hoc caffeine &amp; drinks</span>' +
              '<span class="mhyd-caf-s">' + (mg ? mg + ' mg' : 'Scan or log drinks in meals, or tap here') + ' <i aria-hidden="true">' + (cafOpen ? '▾' : '▸') + '</i></span>' +
            '</button>' +
            (cafOpen
              ? (drinks ? '<div class="am-drinks">' + drinks + '</div>' : '') +
                (S.hydAdd ? mDrinkPanelHTML(true) : '<button type="button" class="nut-ask am-add" data-hyd="hadd">' + (shown.length ? 'Edit or add drinks' : '+ Add a drink') + '</button>')
              : '') +
          '</div>' +
        '</div>') +
    '</section>';
  }
  /* Your drinks, their ounces & milligrams, and a new one. Edited here rather
     than in a settings screen of their own, because this is the only place a
     drink is ever used. */
  function mDrinkPanelHTML(inHyd) {
    var dk = mDrinks();
    var mine = dk.list.filter(function (d) { return dk.on.indexOf(d.id) >= 0; });
    var rest = dk.list.filter(function (d) { return dk.on.indexOf(d.id) < 0; });
    var attr = inHyd ? 'data-hyd' : 'data-am';
    var mgAttr = inHyd ? 'data-hydmg' : 'data-ammg';
    var ozAttr = inHyd ? 'data-hydoz' : 'data-amoz';
    var nId = inHyd ? 'hydNewN' : 'amNewN';
    var mId = inHyd ? 'hydNewMg' : 'amNewMg';
    var oId = inHyd ? 'hydNewOz' : 'amNewOz';
    var noteId = inHyd ? 'hydNote' : 'amNote';
    var doneAct = inHyd ? 'hdone' : 'done';
    return '<div class="am-panel">' +
      (mine.length ? '<div class="am-ph">Your drinks</div>' + mine.map(function (d) {
        var dOz = fin(d.oz) ? d.oz : defDrinkOz(d.id);
        return '<div class="am-prow"><span>' + esc(d.n) + '</span>' +
          '<label class="am-mg"><input type="text" class="am-in" inputmode="numeric" maxlength="2" ' + ozAttr + '="' + d.id + '" value="' + dOz + '" ' +
            'aria-label="Ounces in a ' + esc(d.n.toLowerCase()) + ', oz"> oz</label>' +
          '<label class="am-mg"><input type="text" class="am-in" inputmode="numeric" maxlength="4" ' + mgAttr + '="' + d.id + '" value="' + d.mg + '" ' +
            'aria-label="Caffeine in a ' + esc(d.n.toLowerCase()) + ', mg"> mg</label>' +
          '<button class="nut-ask" ' + attr + '="off:' + d.id + '">Hide</button></div>';
      }).join('') : '') +
      (rest.length ? '<div class="am-ph">Add</div><div class="am-chips">' + rest.map(function (d) {
        var dOz = fin(d.oz) ? d.oz : defDrinkOz(d.id);
        return '<button class="am-chip" ' + attr + '="on:' + d.id + '">' + esc(d.n) + ' <small>' + d.mg + ' mg · ' + dOz + ' oz</small></button>';
      }).join('') + '</div>' : '') +
      '<div class="am-ph">A drink of your own</div>' +
      '<div class="am-prow am-new"><input type="text" class="am-in am-nn" id="' + nId + '" maxlength="30" placeholder="Name" aria-label="Drink name">' +
        '<label class="am-mg"><input type="text" class="am-in am-new-oz" id="' + oId + '" inputmode="numeric" maxlength="2" placeholder="12" aria-label="Ounces, oz"> oz</label>' +
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
    if (a[0] === 'fold') {
      S.mHydOpen = S.mHydOpen || {};
      S.mHydOpen[k] = !S.mHydOpen[k];
    } else if (a[0] === 'caftog') {
      S.hydCafOpen = !S.hydCafOpen;
    } else if (a[0] === 'sl') {
      var h = fin(r.sl) ? r.sl + 0.25 * Number(a[1]) : 7;
      mAmWrite(k, 'sl', Math.max(0, Math.min(14, Math.round(h * 4) / 4)));
    } else if (a[0] === 'sysave') {
      var stIn = document.getElementById('amSteps');
      if (stIn) {
        if (!mCheckinInput(stIn, k)) return false;
        stIn.blur();
      }
    } else if (a[0] === 'bmopen') {
      S.amBodyOpen = true;
    } else if (a[0] === 'bmsave') {
      /* Inches, a point allowed ("34.5", "34,5"); empty leaves that one out.
         Nothing is written while any box holds something that is not a
         measurement, and the box that is wrong says so. */
      var bmNew = {}, bad = '';
      BM_FIELDS.forEach(function (f) {
        var el = document.getElementById('amBm_' + f[0]);
        if (!el) return;
        var t = String(el.value || '').replace(',', '.').replace(/[\s"″]|in$/g, '');
        el.setAttribute('aria-invalid', 'false');
        if (!t) return;
        var n = Number(t);
        if (!/^\d{1,2}(\.\d{1,2})?$/.test(t) || n < 10 || n > 80) {
          el.setAttribute('aria-invalid', 'true');
          if (!bad) bad = f[1];
          return;
        }
        bmNew[f[0]] = Math.round(n * 4) / 4;
      });
      var errEl = document.getElementById('amBmErr');
      if (bad) { if (errEl) errEl.textContent = bad + ': enter inches, 10 to 80'; return false; }
      if (errEl) errEl.textContent = '';
      mAmWrite(k, 'bm', Object.keys(bmNew).length ? bmNew : undefined);
      S.amBodyOpen = false;
    } else if (a[0] === 'cr') {
      mAmWrite(k, 'cr', r.cr === 1 ? 0 : 1);
    } else if (a[0] === 'wt') {
      var dOz = Number(a[1]);
      var vs = mVesselsOf(k);
      var vk = 'v' + Math.abs(dOz);
      if (vs[vk] !== undefined) vs[vk] = Math.max(0, (vs[vk] || 0) + (dOz > 0 ? 1 : -1));
      var vsClean = {};
      ['v8', 'v16', 'v24', 'v42'].forEach(function (key) { if (vs[key] > 0) vsClean[key] = vs[key]; });
      var wNext = Math.max(0, Math.min(500, (fin(r.wt) ? r.wt : 0) + dOz));
      mAmWrite(k, 'vs', Object.keys(vsClean).length ? vsClean : undefined);
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
      var no = box.querySelector('.am-new-oz') || document.getElementById('amNewOz');
      var note = box.querySelector('.am-note') || document.getElementById('amNote');
      var name = nn ? nn.value.trim() : '', mgS = nm ? nm.value.trim() : '', ozS = no ? no.value.trim() : '';
      if (!name || !/^\d{1,4}$/.test(mgS) || Number(mgS) > 1000) {
        if (note) note.textContent = !name ? 'Give it a name.' : 'Milligrams take digits, up to 1,000.';
        return false;
      }
      var newOz = ozS && /^\d{1,2}$/.test(ozS) && Number(ozS) <= 64 ? Number(ozS) : 12;
      var d3 = mDrinks(), id = 'my_' + Date.now().toString(36);
      d3.list.push({ id: id, n: name.slice(0, 30), mg: Number(mgS), oz: newOz });
      d3.on.push(id);
      mDrinksWrite(d3);
    } else {
      return false;
    }
    return true;
  }
  /* Typing: steps, a drink's milligrams, and a drink's ounces. Saved without a
     redraw, so the box you are typing in is not rebuilt under your thumb;
     refused while it holds something that is not a number, and then false, so
     the caller does not redraw either: a redraw put the last good number back
     and took the warning with it, and the box looked as if it had taken the
     word. */
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
    var ozId = el.getAttribute('data-amoz') || el.getAttribute('data-hydoz');
    if (ozId) {
      if (!/^\d{1,2}$/.test(t) || Number(t) > 64) { el.setAttribute('aria-invalid', 'true'); return false; }
      el.setAttribute('aria-invalid', 'false');
      var dkOz = mDrinks();
      dkOz.list.forEach(function (d) { if (d.id === ozId) d.oz = Number(t); });
      mDrinksWrite(dkOz);
      return true;
    }
    return false;
  }

  /* Every morning with anything said, for Review: { key: record }, the drinks'
     milligrams already added up as `mg` and total hydration (water + drinks) as `wt`. */
  function mAmDays() {
    var out = {};
    Object.keys(MAM).forEach(function (k) {
      var r = mAmOf(k), wOz = mWaterOz(k);
      out[k] = { sl: r.sl, sy: r.sy, cr: r.cr, wt: wOz > 0 ? wOz : r.wt, mg: r.cf ? mCafMg(k) : undefined };
    });
    return out;
  }

  return { MAM: MAM, mAmOf: mAmOf, mAmWrite: mAmWrite, mAmClean: mAmClean, mAmSum: mAmSum, mAmDays: mAmDays, mDrinksClean: mDrinksClean,
    mWaterGoalOz: mWaterGoalOz, mWaterOz: mWaterOz, mDrinksOz: mDrinksOz, mCafMg: mCafMg, mHydrationCardHTML: mHydrationCardHTML,
    mItemFluidOz: mItemFluidOz, mHydChip: mHydChip, mBodyDays: mBodyDays,
    mCheckinHTML: mCheckinHTML, mCheckinClick: mCheckinClick, mCheckinInput: mCheckinInput };
};
