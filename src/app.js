/* ---------------------------------------------------------------------------
 * Hive & Hearth Recipes
 * Browse, plan a week, build a shopping list, print the book.
 * ------------------------------------------------------------------------- */
(function () {
  'use strict';

  /* Which build this is, read off the ?v= that index.html loads this file with,
     so it can never drift from the truth by being forgotten. Shown in the
     Sharing sheet: when a change is pushed and a phone still looks the same,
     that number answers whether the phone has it yet or the deploy is late. */
  var BUILD = (function () {
    var s = document.querySelector('script[src*="app.js"]');
    var m = s && /[?&]v=([\w.-]+)/.exec(s.getAttribute('src') || '');
    return m ? m[1] : 'dev';
  })();

  /* What the collection is called, in one place. It appears on both covers,
     both title pages, both back covers, the browser tab and the home screen,
     and it has already been renamed once — a volume in this repository went
     from Strong & Simple to Run and Not Be Weary and the change had to be
     chased through nine files. Not twice. */
  var APP_NAME = 'Hive & Hearth';
  var APP_LINE = 'Recipes';           // the second line on a cover

  var BASE = window.RECIPES || [];    // the 271 in the two printed books
  var RECIPES = BASE;                 // those, with your changes, plus your own
  var BY_ID = {};

  /* The printed recipes are read-only; a change to one is stored beside it and
     laid over the top here, so the book's own version is never lost and can be
     put back by deleting the change. Recipes written here follow after. */
  /* For the parts in files of their own (window.HiveParts): rebuild() replaces
     RECIPES and BY_ID rather than changing them, so a part asks for them
     each time instead of keeping the pair it was handed. */
  /* What the parts in files of their own (window.HiveParts) read and write
     of the app's that the app also replaces as it goes: a getter and a setter
     each, so a part reads the value now and its writes land here. */
  var LIVE = {
    get MDAYS() { return MDAYS; },
    get MDONE() { return MDONE; },
    get MSEND() { return MSEND; },
    get MSKIP() { return MSKIP; },
    get MTRAINED() { return MTRAINED; },
    get MAM() { return MAM; },
    get MWEIGHTS() { return MWEIGHTS; },
    get MFOODS() { return MFOODS; },
    get BY_ID() { return BY_ID; },
    get M_ALL_SECS() { return M_ALL_SECS; },
    set M_ALL_SECS(v) { M_ALL_SECS = v; },
    get RECIPES() { return RECIPES; },
    get S_SYNC_STATE() { return S_SYNC_STATE; },
    set S_SYNC_STATE(v) { S_SYNC_STATE = v; },
    get mAuthKnown() { return mAuthKnown; },
    get mBootTargetsDue() { return mBootTargetsDue; },
    set mBootTargetsDue(v) { mBootTargetsDue = v; },
    get mSyncUnreachable() { return mSyncUnreachable; },
    get MBATCHG() { return MBATCHG; },
    get MDAYT() { return MDAYT; },
    get MHUSH() { return MHUSH; },
    get MINTAKE() { return MINTAKE; },
    get MNEVER() { return MNEVER; },
    get mClkSent() { return mClkSent; },
    set mClkSent(v) { mClkSent = v; },
    get mDirty() { return mDirty; },
    set mDirty(v) { mDirty = v; },
    get mDirtyAll() { return mDirtyAll; },
    set mDirtyAll(v) { mDirtyAll = v; },
    get mFoldTimer() { return mFoldTimer; },
    set mFoldTimer(v) { mFoldTimer = v; },
    get mAcctHouse() { return mAcctHouse; },
    set mAcctHouse(v) { mAcctHouse = v; },
    get mHouseTellNext() { return mHouseTellNext; },
    set mHouseTellNext(v) { mHouseTellNext = v; },
    get mInviteBusy() { return mInviteBusy; },
    get mSyncDoc() { return mSyncDoc; },
    set mInviteBusy(v) { mInviteBusy = v; },
    set mAuthKnown(v) { mAuthKnown = v; },
    set mSyncDoc(v) { mSyncDoc = v; },
    get mSyncHeard() { return mSyncHeard; },
    set mSyncHeard(v) { mSyncHeard = v; },
    get mSyncOff() { return mSyncOff; },
    set mSyncOff(v) { mSyncOff = v; },
    get mSyncTimer() { return mSyncTimer; },
    set mSyncTimer(v) { mSyncTimer = v; },
    set mSyncUnreachable(v) { mSyncUnreachable = v; },
    get MX_ALL() { return MX_ALL; },
    get MINTAKE_DAYS() { return MINTAKE_DAYS; },
    get MC_GAP() { return MC_GAP; },
    get MGOAL_WORDS() { return MGOAL_WORDS; },
    get MCASCADE_MIN() { return MCASCADE_MIN; },
    get mDrawnToday() { return mDrawnToday; },
    set mDrawnToday(v) { mDrawnToday = v; },
    get MSHELF() { return MSHELF; },
    get MP_LASTX() { return MP_LASTX; },
    get MP_KNOWN() { return MP_KNOWN; },
    set MP_KNOWN(v) { MP_KNOWN = v; },
    set MP_LASTX(v) { MP_LASTX = v; },
    get MLOOKUP() { return MLOOKUP; },
    set MLOOKUP(v) { MLOOKUP = v; },
    get mLookSeq() { return mLookSeq; },
    set mLookSeq(v) { mLookSeq = v; },
    get mCamDone() { return mCamDone; },
    set mCamDone(v) { mCamDone = v; },
    get MNA_CAP() { return MNA_CAP; }
  };

  function recipesNow() { return RECIPES; }
  function byIdNow() { return BY_ID; }

  function rebuild() {
    var st = window.Store.state;
    var edits = st.edits || {}, mine = st.mine || {};
    RECIPES = BASE.map(function (r) {
      return edits[r.id] ? Object.assign({}, r, edits[r.id], { id: r.id, edited: true }) : r;
    });
    Object.keys(mine).map(function (k) { return mine[k]; })
      .sort(function (a, b) {
        return String(a.secName).localeCompare(String(b.secName)) || String(a.id).localeCompare(String(b.id));
      })
      .forEach(function (r) { RECIPES.push(r); });
    BY_ID = {};
    var n = 0;
    RECIPES.forEach(function (r) {
      if (r.book === 3) r.no = ++n;
      BY_ID[r.id] = r;
    });
    mBuildFoods();          // and the plain foods, addable but never shelved
    /* And forget which sections there are, because that answer has just
       changed. mAllSecs caches the section list off RECIPES, and RECIPES is
       replaced on the line above — a household member's first shared recipe,
       or the first one you write yourself, brings section 3-1 into a world
       that until then held only the two printed books.
     *
       A meal widened by ten "not that one"s draws from that cached list and
       from nothing else: 3-1 is in no entry of MEAL_SECS, so your own recipes
       reach a meal through the wide pool or they do not reach it at all. A
       stale copy therefore makes the recipe you have just written the one
       dish the machine will never offer, for the rest of the session, while
       the card goes on saying it is looking everywhere.
     *
       Cleared here rather than guarded inside mAllSecs because this is the
       only place RECIPES is ever reassigned: the cache goes stale exactly
       when this function runs, and at no other moment. */
    M_ALL_SECS = null;
  }

  /* The hundred and seventeen plain foods the recipes are costed from, made
     addable in their own right.
   *
     A day rarely divides into six whole recipes. What fills the last two
     hundred calories is a spoon of honey, an apple, half a tin of tuna — and
     until now the only way to log one was to find a recipe that happened to
     contain it. The food table was already in the browser, being used to
     price everything else; it just had no door.
   *
     They are shaped as recipes so nothing downstream has to learn a second
     kind of thing — the totals, the copy, the pins, the dials all keep
     working — but they are NOT in RECIPES, so they never appear in the
     collection, the printed book or the shopping list, none of which are
     about a spoon of honey. */
  var MFOODS = [];

  function mFoodName(key, f) {
    if (f.label) return f.label;
    return key.replace(/_/g, ' ').replace(/^./, function (c) { return c.toUpperCase(); });
  }

  /* Which unit to call one of. Aim near a hundred and thirty calories: a cup
     of milk, a tablespoon of honey, one apple — rather than a cup of butter
     or a tablespoon of milk, which is what any single fixed unit produces. */
  function mFoodServing(f) {
    /* Where the table says what a portion of this IS, that is the answer, and
       it was being ignored. A hundred and twenty-four foods carry a `def`
       written by somebody who knew the food, and the guess below was overruling all of
       them: cheddar came out as "1 whole" — a whole cheddar cheese — because
       a 28 g slice happened to land nearest the calorie target, and ketchup,
       mustard, soy and hot sauce all defaulted to a CUP.
     *
       Only the unit is taken, not the quantity. A `def` of half a cup means
       half of the unit this food is counted in, and the portion is the
       stepper's business — the fit scorer picks it against the day, the way
       it does for everything else. What the table settles here is the WORD:
       cheese is measured in cups, ketchup in spoons, and neither of them
       comes as a whole one. */
    if (f.def && f.def.unit && f.g && f.g[f.def.unit]) {
      return { unit: f.def.unit, grams: f.g[f.def.unit] };
    }
    var units = f.g || {};
    var best = null;
    Object.keys(units).forEach(function (u) {
      var grams = units[u];
      if (!grams) return;
      var kcal = (f.kcal || 0) * grams / 100;
      var miss = Math.abs(kcal - 130) + (u === 'each' ? -25 : 0);   // a whole one reads best
      if (!best || miss < best.miss) best = { unit: u, grams: grams, miss: miss };
    });
    return best || { unit: 'g', grams: 100 };
  }

  /* Food you ate that no book and no table has heard of.
   *
     The collection is a cookbook and the food table is what its recipes are
     costed from; neither has heard of a tamale bought from a cart. But the
     day has to add up, and a plate you cannot log is a plate that quietly
     makes every number on the screen wrong. So: a name, whatever you know of
     its macros, and it joins the single foods for good — typed once, tapped
     ever after. */
  /* The key and name for a food being saved, never one already taken.
     The key was the name, slugged, and written over whatever held it: a
     second "Lunch", or "Café" beside "Caf", replaced the first, and every
     past day holding it took the new numbers, which moved the intake log
     and the measured burn behind them. A name in use gets a number instead. */
  function mNewFoodKey(name, mine) {
    var base = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') ||
      ('x' + Date.now().toString(36));
    var key = base, nm = name, n = 1;
    while (Object.prototype.hasOwnProperty.call(mine, key)) { n++; key = base + '_' + n; nm = name + ' ' + n; }
    return { key: key, name: nm };
  }
  function mReadMyFoods() {
    try {
      var v = JSON.parse(localStorage.getItem('bsc.myFoods'));
      if (v && typeof v === 'object' && !Array.isArray(v)) return v;
    } catch (e) { /* private mode or corrupt */ }
    return {};
  }
  /* Stamped only once it is really written — for all three of these, which
     used to disagree about the order. The payload reads the value back out
     of storage, so a stamp over a write that failed (storage full) sent the
     OLD value up as the newest one, and every other device took it. mPut has
     already said the storage is full. */
  function mWriteMyFoods(v) {
    if (mPut('bsc.myFoods', v)) mStamp('mf');
  }

  /* A star, kept where the thing it stars is kept.
   *
     The book's favourites belong to the household — everyone on the code sees
     the same stars, which is the point of them. Your own foods do not: they
     live in your account, and putting "f:my:chicken_tamale" into the shared
     document to mark it would post the name of your food to everybody with
     the code. So a personal food carries its own star, in its own record. */
  /* A food of your own carries its own flag, because it lives in your own
     store. Everything else — a book recipe, a food out of the reference
     table — is kept in the household's favourites, which is a list of ids
     and has never cared what kind of id it is given. */
  function mIsFav(r) {
    if (r.food && String(r.id).indexOf('f:my:') === 0) return !!r.fav;
    return window.Store.isFav(r.id);
  }

  /* Everything can be kept.
   *
     The rule was "a book recipe is yours to keep and so is a food you typed
     in, but a food out of the reference table is the table's" — and Blake,
     looking at a breakfast of it: "I am not seeing a star on Greek yogurt.
     Why? ... if I select a food from the USDA food list and then favorite
     it, can it add to my database of foods that I like?"
   *
     Nothing was ever stopping it. Store.toggleFav takes an id and puts it in
     a list; the block was a judgement about whose the table is, and a list
     of foods you like is yours by definition. Kept as a function rather than
     deleted, because the picker and the plate both ask the question and must
     not come to differ about it again. */
  function mCanFav(r) {
    return !!r;
  }

  function mToggleFav(r) {
    if (!r.food) { window.Store.toggleFav(r.id); return; }
    var key = String(r.id).indexOf('f:my:') === 0 ? String(r.id).slice(5) : '';
    /* A table food is kept the way a recipe is: in the household's list, so
       it syncs, and so the fit scorer's favourite bonus reaches it. */
    if (!key) { window.Store.toggleFav(r.id); return; }
    var mine = mReadMyFoods();
    if (!mine[key]) return;
    mine[key].fav = !mine[key].fav;
    mWriteMyFoods(mine);
    mBuildFoods();
  }

  /* src/shelves.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var SHELVES = window.HiveParts.shelves({});
  function mShelfKey(r) { return SHELVES.mShelfKey(r); }
  var MSHELF = SHELVES.MSHELF;

  function mBuildFoods() {
    MFOODS = [];
    var mine = mReadMyFoods();
    Object.keys(mine).forEach(function (key) {
      var f = mine[key];
      if (!f || typeof f !== 'object') return;
      /* A meal you kept to yourself remembers what went into it. The parts
         ride along as their own list so the plate can open and show them
         (a salad that was five things and became one line was the complaint),
         and they double as the ingredient lines the search reads, so "beans"
         still finds the salad they went into. */
      var parts = Array.isArray(f.parts) ? f.parts.filter(function (pt) {
        return pt && typeof pt === 'object' && pt.name;
      }).map(function (pt) {
        return { id: pt.id, x: Number(pt.x) || 1, name: String(pt.name),
          unit: String(pt.unit || 'serving') };
      }) : [];
      var name = String(f.name || 'Something');
      var rec = {
        id: 'f:my:' + key, food: true, book: 0, secNum: 0, secName: 'Single foods',
        name: name, servings: '1 ' + String(f.unit || 'serving'),
        servN: 1, unit: String(f.unit || 'serving'),
        ing: parts.length ? parts.map(function (pt) {
          return fmtNum(pt.x) + ' × ' + pt.unit + ' ' + pt.name;
        }) : [name],
        parts: parts,
        steps: [], est: true, score: null, diff: 'Easy', time: '0 mins', fav: !!f.fav,
        /* Four-four-nine, like everything else the day counts — see the long
           note in score-lib. A food you typed yourself carries a calorie
           figure you copied off a packet, and honouring it would put one item
           on the day speaking a different language from every other: the
           meal's pills, the day's bars and the targets they are measured
           against are all macros times four and nine. The packet is not
           wrong, it is answering a question no screen here asks.

           Unless there are no macros to derive from. A food logged as
           calories alone keeps them — see the note at the save, and note that
           deriving here regardless would silently zero every one of those
           foods already saved on somebody's phone. */
        macro: (function () {
          var fp = Number(f.p) || 0, fc = Number(f.c) || 0, ff2 = Number(f.f) || 0;
          /* Not rounded per unit, since 2026-10-11: a drink kept per 100 mL
             came to 30 kcal a unit for 29.7, and 540 mL of it read 162 for
             160. Every screen rounds what it shows. */
          return { kcal: (fp || fc || ff2)
            ? Math.round((4 * fp + 4 * fc + 9 * ff2) * 100) / 100 + (Number(f.kx) > 0 ? Math.round(Number(f.kx)) : 0)
            : Number(f.kcal) || 0,
          p: fp, c: fc, f: ff2,
          na: Number(f.na) || 0, fib: Number(f.fib) || 0 };
        }())
      };
      // what the packet declared, off the scan that made it (src/camera.js); not a nutrient, so not in macro
      if (Array.isArray(f.alg) && f.alg.length) rec.alg = f.alg.map(String).slice(0, 8);
      /* The barcode it was scanned from, so the same packet scanned again
         opens this food rather than asking Open Food Facts for the numbers
         you may have fixed (mOwnScan); and the label's own serving, from a
         fix (src/foodsheet.js), offered as a unit on the food's page. */
      if (/^\d{6,14}$/.test(String(f.code || ''))) rec.code = String(f.code);
      if (f.sz && typeof f.sz === 'object' && Number(f.sz.n) > 0) rec.sz = { t: String(f.sz.t || ''), n: Number(f.sz.n) };
      // and its grades, the same way (Nutri-Score a–e, NOVA 1–4)
      if (/^[a-e]$/.test(String(f.ns || ''))) rec.ns = String(f.ns);
      if (Number(f.nova) >= 1 && Number(f.nova) <= 4) rec.nova = Math.round(Number(f.nova));
      // the rest of its label, per serving, for its own page (src/foodsheet.js); never counted by the day
      if (f.lab && typeof f.lab === 'object') {
        var lab = {};
        ['sat', 'chol', 'sug', 'ca', 'fe', 'k'].forEach(function (k3) { if (Number(f.lab[k3]) >= 0 && f.lab[k3] !== null && f.lab[k3] !== '') lab[k3] = Number(f.lab[k3]); });
        if (Object.keys(lab).length) rec.lab = lab;
      }
      MFOODS.push(rec);
      BY_ID[rec.id] = rec;
    });
    var N = window.Nutrition;
    if (!N || !N.FOODS) return;
    Object.keys(N.FOODS).forEach(function (key) {
      var f = N.FOODS[key];
      if (!f || f.split || !(f.kcal > 0 || f.p > 0)) return;      // 'free' stands for seasonings
      var sv = mFoodServing(f);
      var per = sv.grams / 100;
      var name = mFoodName(key, f);
      /* grams rides along so a plate can say "1 cup · 130 g": a unit alone
         is a meaningful portion for an egg, not for "1 serving" of beans. */
      MFOODS.push({
        id: 'f:' + key, food: true, side: !!f.side, eat: !!f.eat, lever: !!f.lever,
        meals: f.meals || '',
        /* which shelf a cook would reach on, carried through from the food
           table so mShelfKey does not have to keep its own list */
        veg: !!f.veg, starch: !!f.starch, shelf: f.shelf || '',
        /* Not on the storehouse order. Carried so the picker can offer it to
           log — Blake will happily go and buy salmon tomorrow — while Fill
           stays out of it unless he says otherwise, because a day drafted out
           of food that is not in the house is not a day.
         *
           `zone` is the Zone table's own block for the food, which is a
           judgement about what it is FOR rather than anything derivable from
           the macros, and it is the axis the shelf rail speaks. */
        ext: !!f.ext, zone: f.zone || '',
        book: 0, secNum: 0, secName: 'Single foods',
        name: name, servings: '1 ' + sv.unit, servN: 1, unit: sv.unit, grams: sv.grams,
        ing: [name], steps: [], est: true, score: null, diff: 'Easy', time: '0 mins',
        /* Derived from the ROUNDED macros beside it, not from the food
           table's own kcal — one calorie, the same one the recipes and the
           targets use. Rounded first so the four figures on the card add up
           to each other in the hand. */
        macro: (function () {
          var mp = Math.round((f.p || 0) * per * 10) / 10;
          var mc = Math.round((f.c || 0) * per * 10) / 10;
          var mf = Math.round((f.f || 0) * per * 10) / 10;
          return { kcal: Math.round(4 * mp + 4 * mc + 9 * mf), p: mp, c: mc, f: mf,
            na: Math.round((f.na || 0) * per), fib: Math.round((f.fib || 0) * per * 10) / 10 };
        }())
      });
      BY_ID[MFOODS[MFOODS.length - 1].id] = MFOODS[MFOODS.length - 1];
    });
    var eo = SHELVES.mEatoutCatalog(), pSpot = {}, pSpots = {}, pMeals = {};
    /* The kinds of place a record is from (fast, sit or grab), for the type
       chips under Eating out: a menu item two places share can be both. */
    var kindsOf = function (names) {
      var out = [];
      names.forEach(function (nm) {
        var kd = (eo.kinds || {})[nm] || 'fast';
        if (out.indexOf(kd) < 0) out.push(kd);
      });
      return out;
    };
    // the same, place by place, for a menu item more than one place sells
    var spotKindsOf = function (names) {
      var out = {};
      names.forEach(function (nm) { out[nm] = (eo.kinds || {})[nm] || 'fast'; });
      return out;
    };
    eo.combos.forEach(function (cf) {
      var sp0 = cf.spot || '';
      var spClean = String(sp0).split(/\s*\u00b7\s*/)[0].trim();
      (cf.parts || []).forEach(function (pt) {
        var pk = pt[0];
        if (!pSpot[pk]) pSpot[pk] = sp0;
        if (!pSpots[pk]) pSpots[pk] = [];
        if (spClean && pSpots[pk].indexOf(spClean) < 0) pSpots[pk].push(spClean);
        pMeals[pk] = (pMeals[pk] || '') + (cf.meals || 'bld');
      });
    });
    Object.keys(eo.parts).forEach(function (pk) {
      var pf = eo.parts[pk];
      var mp = Math.round((pf.p || 0) * 10) / 10;
      var mc = Math.round((pf.c || 0) * 10) / 10;
      var mf = Math.round((pf.f || 0) * 10) / 10;
      var spots = pf.spots || (pSpots[pk] && pSpots[pk].length <= 2 ? pSpots[pk] : []);
      var spotRaw = pf.spot || (spots.length === 1 ? pSpot[pk] : spots.length === 2 ? spots.join(' / ') : spots.length > 2 ? 'Eating out' : '');
      var isMenu = !pf.partOnly && !!spotRaw;
      var sp = isMenu && spotRaw !== 'Eating out' ? String(spotRaw).split(/\s*\u00b7\s*/)[0].trim() : '';
      var dname = sp && pf.name.indexOf(sp) !== 0 ? (sp + ' \u2014 ' + pf.name) : pf.name;
      var prec = {
        id: 'f:' + pk, food: true, side: false, eat: false, lever: false,
        eatoutPart: true, eatoutMenu: isMenu, spot: isMenu ? spotRaw : '', spots: isMenu ? spots : [],
        kinds: isMenu ? kindsOf(spots.length ? spots : [sp]) : [], spotKinds: isMenu ? spotKindsOf(spots.length ? spots : [sp]) : {},
        meals: pf.meals || pMeals[pk] || 'blds', veg: !!pf.veg, starch: !!pf.starch, shelf: isMenu ? 'eatout' : (pf.shelf || ''),
        ext: true, zone: '', book: 0, secNum: 0, secName: (isMenu && spotRaw) || 'Eating out',
        name: dname, rawName: pf.name, servings: '1 ' + (pf.unit || 'serving'), servN: 1,
        unit: pf.unit || 'serving', grams: pf.grams || 0,
        ing: isMenu ? [spotRaw, dname] : [pf.name], steps: [], est: pf.est !== false, score: null, diff: 'Easy', time: '0 mins',
        macro: { kcal: Math.round(4 * mp + 4 * mc + 9 * mf), p: mp, c: mc, f: mf,
          na: Math.round(pf.na || 0), fib: Math.round((pf.fib || 0) * 10) / 10 }
      };
      if (isMenu) MFOODS.push(prec);
      BY_ID[prec.id] = prec;
    });
    eo.combos.forEach(function (cf) {
      var cparts = [];
      var cp = 0, cc = 0, cf2 = 0, cna = 0, cfib = 0, cg = 0;
      (cf.parts || []).forEach(function (pt) {
        var pid = 'f:' + pt[0], px = Number(pt[1]) || 1;
        var pr = BY_ID[pid];
        if (!pr) return;
        cparts.push({ id: pid, x: px, name: pr.rawName || pr.name, unit: pr.unit });
        cp += (pr.macro.p || 0) * px;
        cc += (pr.macro.c || 0) * px;
        cf2 += (pr.macro.f || 0) * px;
        cna += (pr.macro.na || 0) * px;
        cfib += (pr.macro.fib || 0) * px;
        cg += (pr.grams || 0) * px;
      });
      cp = Math.round(cp * 10) / 10;
      cc = Math.round(cc * 10) / 10;
      cf2 = Math.round(cf2 * 10) / 10;
      var crec = {
        id: 'f:rc_' + cf.id, food: true, side: false, eat: false, lever: false,
        eatout: true, spot: cf.spot || 'Eating out', kinds: kindsOf([String(cf.spot || '').split(/\s*\u00b7\s*/)[0].trim()]),
        meals: cf.meals || 'bld', veg: false, starch: false, shelf: 'eatout',
        ext: true, zone: '', book: 0, secNum: 0, secName: cf.spot || 'Eating out',
        name: cf.name, servings: '1 order', servN: 1, unit: 'order', grams: Math.round(cg),
        ing: [cf.spot || '', cf.name].concat(cparts.map(function (pt) {
          return fmtNum(pt.x) + ' \u00d7 ' + pt.unit + ' ' + pt.name;
        })),
        parts: cparts, steps: [], est: !!cf.est, score: null, diff: 'Easy', time: '0 mins',
        macro: { kcal: Math.round(4 * cp + 4 * cc + 9 * cf2), p: cp, c: cc, f: cf2,
          na: Math.round(cna), fib: Math.round(cfib * 10) / 10 }
      };
      MFOODS.push(crec);
      BY_ID[crec.id] = crec;
    });
    MFOODS.sort(function (a2, b2) { return a2.name.localeCompare(b2.name); });
  }

  var DAYS = [
    ['mon', 'Monday', 'Mon'], ['tue', 'Tuesday', 'Tue'], ['wed', 'Wednesday', 'Wed'],
    ['thu', 'Thursday', 'Thu'], ['fri', 'Friday', 'Fri'], ['sat', 'Saturday', 'Sat'],
    ['sun', 'Sunday', 'Sun']
  ];

  /* The Macros tab's default meals. Slots organize the day; the arithmetic is
     daily — a breakfast is not scolded for failing to be a whole day. The
     day's actual meal list is the reader's to shape under Craft my plan
     (a morning brew, an afternoon snack, one before bed); these four are only
     where everyone starts, and their keys are load-bearing — days already
     saved under b/l/d/s must keep meaning what they meant. [key, name, type] */
  var MSLOT_DEFS = [['b', 'Breakfast', 'b'], ['l', 'Lunch', 'l'], ['d', 'Dinner', 'd'], ['s', 'Snacks', 's']];

  /* Which sections count as "this meal" in the picker's default filter, keyed
     book-secNum. Not a new field on the recipes: the sections are already
     meal-shaped, and a map here can be corrected without a data rebuild. The
     snack list is broad on purpose — a treat is a snack, and the fit ranking
     is what sinks it on a cut, not the filter. */
  var MEAL_SECS = {
    b: ['1-1', '2-1'],
    /* Not 1-7. Batch Prep went onto lunch and dinner for one build (v466)
       and Fill served its containers at two and a half — chili at 1,303 mg
       from one bowl — so days over the salt ceiling went from 3 in 300 to 53.
       Meal-prep containers are sized to be eaten as one; the fitter sizes
       whatever it offers. So it is not offered unasked. Where one lands when
       you add it yourself is MSEC_HOME below. */
    l: ['1-3', '2-2'],
    d: ['1-4', '2-3', '2-4'],
    /* Not 2-6 and not 2-7. "A treat is a snack" held for churros; it did not
       hold for Worth the Afternoon — bread, cinnamon rolls, braised beef,
       chicken pot pie, 326 kcal a serving — or for the Copycat Shelf, where
       barbacoa and taco beef live. A fourteen-day audit on Blake's own plan
       had Snacks' Fits best opening on Braised Beef with Onion Gravy and Fill
       putting Taco Beef ×2¾ into an evening snack. The treats those shelves
       do hold are reachable by name and by the Every-recipe lens; they are
       just not offered unasked at ten at night. */
    s: ['1-2', '1-5', '1-6', '2-5', '2-8']
  };

  var BOOKS = {
    1: {
      /* Doctrine and Covenants 89:20 — the Word of Wisdom's own promise, and the
         only name on the shelf where the title and the food make the same claim.
         What protein and fiber buy you is the afternoon. */
      name: 'Run and Not Be Weary', short: 'RUN',
      blurb: '{N1} recipes built on protein, fiber and staying full, with primary ingredients from the bishops’\u00a0storehouse. Every one carries real macros and a computed nutrition score.',
      epigraph: {
        t: ['And shall run and not be weary,', 'and shall walk and not faint.'],
        r: 'Doctrine and Covenants 89:20',
      },
    },
    2: {
      name: 'Around the Table', short: 'TABLE',
      blurb: '{N2} family recipes with primary ingredients from the bishops’\u00a0storehouse: three‑minute breakfasts to Sunday roasts, by way of an afternoon at the stove, the restaurant favourites worked out at home, and a section for chocolate alone.',
      epigraph: {
        t: ['And did eat their meat with gladness', 'and singleness of heart.'],
        r: 'Acts 2:46',
      },
    },
    3: {
      name: 'Ours', short: 'OURS',
      blurb: 'The ones we worked out ourselves, or were given, or changed until they were right. This volume grows; the other two do not.'
    }
  };

  /* The combined edition. Not a fourth volume — the same recipes as one object,
     for anyone spiral-binding them rather than folding two booklets. It needs
     its own cover copy because every word of Volume One's is about being one
     of two. */
  var ONE_BOOK = {
    name: APP_NAME + ' ' + APP_LINE,
    blurb: '{N} recipes with primary ingredients from the bishops\u2019\u00a0storehouse, ' +
      'in two parts: {n1} built on protein and fiber, and {n2} for the family table.',
    epigraph: {
      t: ['And shall run and not be weary,', 'and shall walk and not faint.'],
      r: 'Doctrine and Covenants 89:20',
    },
  };

  /* And the same courtesy for the view that is not a book. Someone opening the
     app for the first time lands here, and until this line existed the whole
     answer to "what are the two volumes" was the words "two volumes" in the
     bar at the top. */
  var COLLECTION_BLURB = 'Two volumes, built on staples that keep: canned, dry and frozen, plus a little fresh. Run and ' +
    'Not Be Weary is {n1} recipes built on protein and fiber; Around the Table is {n2} ' +
    'family recipes, from three-minute breakfasts to Sunday roasts.';

  /* ------------------------------------------------------------------------
   * The counts in those four blurbs.
   *
   * Every one of them used to be typed out — "One hundred recipes", "One
   * hundred sixty-six", "Two hundred and seventy-one" — and every one of them
   * was correct on the day it was written. Then six drinks were added, then
   * five more, and the numbers stayed where they were: the browse heading said
   * a hundred while the count under it said a hundred and eleven, and the same
   * wrong sentence was printed on the cover and the title page of the book. A
   * number nobody can see going stale, on the one page you pay a copy shop to
   * make permanent.
   *
   * So the blurbs hold a token and the collection holds the number. {n1} and
   * {n2} are the two volumes, {n} is whatever is being printed; the capital
   * forms start a sentence. The rest of the app already counts this way —
   * the header, the browse count, the contents page — and these were the last
   * four places carrying a second copy of the answer.
   * --------------------------------------------------------------------- */
  var ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight',
    'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen',
    'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  var TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy',
    'eighty', 'ninety'];

  function spell(n) {
    n = Math.max(0, Math.round(n || 0));
    if (n > 999) return String(n);         // no book is going to reach this
    var small = function (x) {
      if (x < 20) return ONES[x];
      return TENS[Math.floor(x / 10)] + (x % 10 ? '-' + ONES[x % 10] : '');
    };
    if (n < 100) return small(n) || 'no';
    var h = ONES[Math.floor(n / 100)] + ' hundred';
    return n % 100 ? h + ' and ' + small(n % 100) : h;
  }

  /* Mid-sentence English prefers "a hundred and eleven" to "one hundred and
     eleven"; the start of a sentence takes the capital and keeps the "one". */
  function fillCounts(s, list) {
    var by = { 1: 0, 2: 0, 3: 0 };
    (list || []).forEach(function (r) { if (by[r.book] !== undefined) by[r.book]++; });
    return String(s).replace(/\{([nN])([123]?)\}/g, function (_, c, b) {
      var w = spell(b ? by[b] : (list || []).length);
      if (c === 'N') return w.charAt(0).toUpperCase() + w.slice(1);
      return w.replace(/^one hundred/, 'a hundred');
    });
  }

  /* What the section picker calls each section. The full names are written
     for a printed contents page, where "Low-Calorie Cut Snacks & Late-Night
     Treats" has a line to itself and room to spare. In a native picker on a
     phone they wrap to two lines each and twelve of them becomes a wall you
     have to read rather than scan. These are for the picker alone — the book,
     the headings and the section pages all keep the full name. */
  /* Keyed by book and section number, which is the part that moves. Warm
     Drinks was section 2-9 until its six recipes went to Power Drinks in
     Volume One; Made, Not Bought slid up from 2-10 to fill the gap, and this
     list did not. Filtering on "Warm Drinks" returned three sauces.

     tests/browse.test.js now holds the two lists against the sections that
     actually exist, so an orphaned key or a section with no label fails rather
     than mislabelling a filter. */
  var SEC_SHORT = {
    '1-1': 'Breakfasts', '1-2': 'Snacks', '1-3': 'Lunch', '1-4': 'Dinner',
    '1-5': 'Best Before Bed', '1-6': 'Power Drinks', '1-7': 'Batch Prep',
    '2-1': 'Weekday Breakfasts', '2-2': 'Lunches & Wraps', '2-3': 'Weeknight Dinners',
    '2-4': 'Sunday Feasts', '2-5': 'Treats & Desserts', '2-6': 'Worth the Afternoon',
    '2-7': 'The Copycat Shelf', '2-8': 'Chocolate', '2-9': 'Made, Not Bought'
  };

  var SEC_NOTE = {
    '1-1': 'Enough protein that eleven o’clock is not a problem.',
    '1-2': 'Small, cold, and nothing to cook.',
    '1-3': 'Cold, assembled, and enough to be a meal.',
    '1-4': 'Cooked tonight, eaten tonight.',
    '1-5': 'Slow protein late on, and nothing that will keep you up.',
    '1-6': 'Brews, shakes and smoothies, when a cup is easier than a plate.',
    '1-7': 'Cook once, eat the week.',
    '2-1': 'Weekday mornings, on the clock.',
    '2-2': 'Lunches, wraps, and the after‑school hour.',
    '2-3': 'Weeknight dinners the children will actually finish.',
    '2-4': 'Sunday, when there is time to do it properly.',
    '2-5': 'Sweets, made from what is on the shelf.',
    '2-6': 'Nothing quick here. Bread that rises, gravy that thickens, custard that sets.',
    '2-7': 'The restaurant version, worked out at home.',
    '2-8': 'For when only chocolate will do.',
    '2-9': 'The three bottles the storehouse does not carry, made from what it does.'
  };

  /* The app says staples where the printed books say the storehouse. The
     books are the storehouse edition and keep every word, and their page
     counts are tested; these are only what the Recipes tab shows. */
  var APP_BLURB = {
    1: '{N1} recipes built on protein, fiber and staying full, from staples that keep. Every one carries real macros and a computed nutrition score.',
    2: '{N2} family recipes from staples that keep: three\u2011minute breakfasts to Sunday roasts, by way of an afternoon at the stove, the restaurant favourites worked out at home, and a section for chocolate alone.'
  };
  var APP_SEC_NOTE = { '2-9': 'Three bottles you\u2019d otherwise buy, made from staples.' };

  /* One line under each part title in the combined edition, doing the job the
     volume blurb does on a cover it no longer has. */
  var SEC_PART = {
    1: 'Built on protein, fiber and staying full.',
    2: 'The family table, from three-minute breakfasts to Sunday roasts.',
  };

  var FRAC = {
    '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3,
    '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875
  };

  // ------------------------------------------------------------------ utils
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function $(id) { return document.getElementById(id); }

  /* A printed recipe's id is its number in the book. One you wrote is a string.
     Both arrive from the DOM as text, so put each back the way it started. */
  function idOf(v) { return /^\d+$/.test(v) ? Number(v) : v; }

  /* What to print on the recipe. The book's own number for the printed ones;
     for yours, where it falls in your volume. */
  function no(r) { return String(r.no || r.id).padStart(3, '0'); }

  /* The score, in a leaf.
   *
   * Three bands, because a number on its own is a number and a colour is a
   * glance: green worth eating often, blue worth eating, dark grey worth
   * knowing about. The thresholds sit either side of the median, which is 60
   * across the 271, so the bands divide the collection rather than flattering
   * it. Drawn rather than set in a font so it prints as a shape at any size.
   */
  function scoreBand(n) { return n >= 70 ? 'good' : n >= 45 ? 'ok' : 'low'; }

  function leaf(n, cls) {
    if (n === null || n === undefined) return '';
    /* The band is in the colour and, now, in the words. Green, blue and grey
       were the whole of it, so the one thing the collection sorts by was the
       one thing a reader who cannot separate those colours could not read —
       and a title attribute never reaches a screen reader on a span. The
       number is the honest label; the band is what it means. */
    var band = scoreBand(n);
    var says = 'Nutrition score ' + n + ' out of 100, ' +
      (band === 'good' ? 'worth eating often' : band === 'ok' ? 'worth eating' : 'worth knowing about');
    return '<span class="leaf leaf-' + band + (cls ? ' ' + cls : '') + '" ' +
      'role="img" aria-label="' + says + '" title="' + says + '">' +
      /* A blade with shoulders, a pointed tip and a stem that kicks left at the
         base — the shape a leaf actually is, rather than the pointed oval that
         reads as an eye. No midrib: it ran straight through the number. */
      '<svg viewBox="0 0 44 54" aria-hidden="true" focusable="false">' +
        '<path class="leaf-body" d="M22 2C17 9 5 16 5 26c0 9 7 15 17 18 10-3 17-9 17-18 0-10-12-17-17-24Z"/>' +
        '<path class="leaf-stem" d="M22 44c0 4-1 6-3.5 7.5"/>' +
      '</svg>' +
      '<span class="leaf-n">' + n + '</span>' +
      '<span class="leaf-sr">out of 100</span>' +
    '</span>';
  }

  function fmtNum(n) {
    if (!isFinite(n)) return '';
    var whole = Math.floor(n + 1e-9);
    var eighths = Math.round((n - whole) * 8);
    if (eighths === 0) return String(whole || 0);
    if (eighths === 8) return String(whole + 1);
    var map = { 1: '⅛', 2: '¼', 3: '⅜', 4: '½', 5: '⅝', 6: '¾', 7: '⅞' };
    return (whole ? whole + ' ' : '') + map[eighths];
  }

  /* Units that read wrong when a scaled quantity crosses one: "2 cup" -> "2 cups",
     "½ cups" -> "½ cup". Abbreviations such as tsp, tbsp and oz never change. */
  var PLURAL = {
    cup: 'cups', can: 'cans', slice: 'slices', clove: 'cloves', package: 'packages',
    packet: 'packets', stick: 'sticks', pint: 'pints', quart: 'quarts', scoop: 'scoops',
    head: 'heads', bunch: 'bunches', link: 'links', spear: 'spears', lb: 'lbs', box: 'boxes',
    serving: 'servings', plate: 'plates', egg: 'eggs', piece: 'pieces',
    order: 'orders', bowl: 'bowls', tortilla: 'tortillas', patty: 'patties', bottle: 'bottles', bag: 'bags', portion: 'portions'
  };
  var SINGULAR = {};
  Object.keys(PLURAL).forEach(function (k) { SINGULAR[PLURAL[k]] = k; });

  /* The nouns the books actually yield in — "6 Small Oat Bites", "4 Wrap
     Rolls", "2 Loaves" — read off the servings lines in data/recipes.js
     rather than guessed at. Deliberately NOT merged into PLURAL above:
     that map is also run over ingredient text, where "1 cake flour" doubled
     would come out "2 cakes flour". A yield is not an ingredient. */
  var YIELDS = {
    bite: 'bites', bowl: 'bowls', roll: 'rolls', sandwich: 'sandwiches',
    glass: 'glasses', mug: 'mugs', square: 'squares', burrito: 'burritos',
    cookie: 'cookies', jar: 'jars', quesadilla: 'quesadillas', pop: 'pops',
    popsicle: 'popsicles', half: 'halves', pancake: 'pancakes', taco: 'tacos',
    boat: 'boats', meal: 'meals', taquito: 'taquitos', wrap: 'wraps',
    pizza: 'pizzas', tomato: 'tomatoes', sub: 'subs', dumpling: 'dumplings',
    waffle: 'waffles', loaf: 'loaves', cake: 'cakes', bar: 'bars',
    tortilla: 'tortillas', container: 'containers'
  };
  var YIELD_ONE = {};
  Object.keys(YIELDS).forEach(function (k) { YIELD_ONE[YIELDS[k]] = k; });

  // plural above one, singular at or below it: "1¾ bites", "¾ bite"
  function mFixNoun(w, n) {
    return n > 1 ? (YIELDS[w] || PLURAL[w] || w) : (YIELD_ONE[w] || SINGULAR[w] || w);
  }

  function fixUnit(rest, n) {
    var m = rest.match(/^([a-z]+)\b/i);
    if (!m) return rest;
    var w = m[1], lower = w.toLowerCase(), want;
    if (n > 1) want = PLURAL[lower] || (SINGULAR[lower] ? lower : null);
    else want = SINGULAR[lower] || (PLURAL[lower] ? lower : null);
    if (!want || want === lower) return rest;
    return want + rest.slice(w.length);
  }

  function scaleIng(str, f) {
    if (f === 1) return str;
    var m = str.match(/^(\d+(?:\.\d+)?)\s*([½¼¾⅓⅔⅛⅜⅝⅞])?\s+/) ||
      str.match(/^([½¼¾⅓⅔⅛⅜⅝⅞])\s+/);
    if (!m) return str;
    var base;
    if (FRAC[m[1]] !== undefined) base = FRAC[m[1]];
    else base = parseFloat(m[1]) + (m[2] ? FRAC[m[2]] : 0);
    if (!base) return str;
    var scaled = base * f;
    return fmtNum(scaled) + ' ' + fixUnit(str.slice(m[0].length), scaled);
  }

  /* The same line by weight. Every recipe already carries a gram figure per
     ingredient — it is what the scores and the shopping list are computed from
     — so this is showing work that was always there rather than new arithmetic.
     ingp runs parallel to ing across all 271 recipes; the tests hold that.

     What gets stripped is the written amount and, where the ingredient is
     measured by volume, the unit word and any parenthetical sizing after it:
     "1 can (5 oz) tuna" is 121 g of tuna and the tin is no longer the point.
     Countables keep their trailing note, because "119 g bell pepper (halved)"
     still wants halving. The eighty-six lines with no weight — a dash of
     vanilla, salt, pepper — are left exactly as written, since rendering them
     as 0 g would be worse than saying nothing. */
  function gramIng(str, it, f) {
    if (!it || !it.g) return str;
    var m = str.match(/^(\d+(?:\.\d+)?)\s*([½¼¾⅓⅔⅛⅜⅝⅞])?\s+/) ||
      str.match(/^([½¼¾⅓⅔⅛⅜⅝⅞])\s+/);
    var rest = m ? str.slice(m[0].length) : str;
    if (it.u && it.u !== 'each') {
      rest = rest.replace(new RegExp('^' + it.u + 's?\\b\\s*(\\([^)]*\\))?\\s*', 'i'), '');
    }
    var g = it.g * f;
    // a tenth of a gram of cinnamon is spurious precision; ten grams of flour is not
    return (g >= 10 ? Math.round(g) : Math.round(g * 10) / 10) + ' g ' + rest;
  }

  /* Units the shopping list writes out. Anything countable is rounded up and
     shown as a bare number — you cannot buy four fifths of a tin. */
  var UNIT_WORD = { each: '', cup: 'cup', tbsp: 'tbsp', tsp: 'tsp', lb: 'lb', oz: 'oz', g: 'g',
    can: 'can', pkg: 'pkg', box: 'box', jar: 'jar', scoop: 'scoop' };
  var WHOLE = { each: 1, can: 1, pkg: 1, box: 1, jar: 1 };

  function shopQty(grams, unit, per, ladder) {
    if (!unit || !per) return '';
    /* Spoons stop being a useful way to say it somewhere around eight of them:
       "8 tbsp ranch dressing" is half a cup, and "16 tbsp" is a cup. Six stays
       six, because a quarter of a cup is not clearer than four tablespoons. */
    if (ladder) {
      for (var i = ladder.length - 1; i >= 0; i--) {
        if (ladder[i][0] !== unit) continue;
        while (i > 0 && grams / per >= 8) { i--; unit = ladder[i][0]; per = ladder[i][1]; }
        break;
      }
    }
    var n = grams / per;
    if (WHOLE[unit]) n = Math.max(1, Math.ceil(n - 0.15));
    else if (n < 0.06) return '';                     // a trace of something
    var num = fmtNum(n);
    var word = UNIT_WORD[unit];
    if (!word) return num;
    return num + ' ' + fixUnit(word, n);
  }

  function macroLine(r) {
    if (!r.macro) return '';
    return r.macro.kcal + ' kcal · ' + r.macro.p + 'g protein · ' +
      r.macro.c + 'g carbs · ' + r.macro.f + 'g fat';
  }
  function diffLabel(d) { return d === 'In-Depth' ? 'In-depth' : d; }

  // ------------------------------------------------------------------ state
  var S = {
    /* The tab you were on is the tab you come back to. A refresh that threw
       somebody tracking their day back onto the recipe grid read as the app
       forgetting them; device-local like sh.units, because which tab you
       live on is yours, not the household's. */
    /* ...but only for a while. Opened again after an hour away, the app
       starts on Today, the screen a day is run from; a refresh, or a
       return within the hour, is still where you were (sh.viewAt, written
       whenever the page is put away). A phone that has never been here
       starts on Today too. */
    view: (function () {
      try {
        var v = localStorage.getItem('sh.view'), at = Number(localStorage.getItem('sh.viewAt')) || 0;
        var ok = ['today', 'browse', 'plan', 'macros', 'train', 'list', 'pantry', 'book'].indexOf(v) >= 0;
        return ok && Date.now() - at < 3600e3 ? v : 'today';
      } catch (e) { return 'today'; }
    })(),
    bookF: 'all', secF: 'all', diffF: 'all', pantryF: 'all',
    favOnly: false, qy: '', sort: 'book', openId: null, scale: 1, printSet: 'all',
    filtPop: false,
    /* The list's folds and the one line whose source switch is open; a
       day's dinner opened on the week. None of it is saved. */
    listFold: {}, listMark: false, daySheet: null,
    /* Cups or grams. Persisted on the device rather than shared, because it is
       a preference about reading, not about the plan — one of you can cook by
       weight while the other cooks by cup without either overruling the other. */
    units: (function () {
      try { return localStorage.getItem('sh.units') === 'grams' ? 'grams' : 'cups'; }
      catch (e) { return 'cups'; }
    })(),
    syncOpen: false, pendingCode: '', joinDraft: '', joinMsg: '', joinBack: null, why: false, dinerDraft: null, dinerMsg: '',
    /* The Macros tab. macroDate null means "today, worked out at render time",
       so a phone left open across midnight lands on the new day by itself;
       an explicit key means the reader pressed ‹ and wants to stay there. */
    macroDate: null, macroPick: null, macroTargOpen: false, newFood: null, mpQuery: '',
    /* A food opened from its plate: {id, x}. Foods have no recipe sheet, so
       this is the sheet that answers "what is one of it, and what went in". */
    foodOpen: null, mCopyFrom: null,
    myJoin: '', mySent: false, myErr: '', myNote: '',
    mpSec: 'meal', mpSort: 'fit',
    /* Which of the three ways in the picker is showing. It opens on 'home',
       where the ways are the screen — scanning used to be the fourth button
       on a second sheet, which is three taps of ceremony in front of the
       fastest way to name a food. */
    mpMode: 'home', mpAt: {},
    /* Which meals you have pressed open or shut, against the default of
       folding one you have eaten. Ephemeral: a new day starts fresh. */
    mFold: {}, mFoldFor: '', mTouched: '', mtOpen: '',
    // each meal's view on the day, by day (myday.js, mViewOf); the skip a card is asking about; Undo's copy
    mView: {}, mViewAll: 0, mSkipAsk: '', mSkipUndo: null,
    // which empty meals have their line of ways to fill them open, by day (myday.js, emptyHTML)
    mEmptyOpen: {},
    chartOpen: false, chartWhich: 'weight', mcRange: 'all', keepMeal: '',
    /* What the picker has been told to add, before it is told to stop. A meal
       assembled from parts — a scoop of whey, a splash of half and half, a
       spoon of honey — used to cost one full trip through this sheet per
       part, because picking anything closed it. The basket holds them all
       and one ✓ commits the lot. Keyed id -> portion. */
    mpBasket: {},
    /* Which rung of each ladder the three-food combo is standing on. One
       index per macro so ‹ › walks ONE of them and the other two resize
       around it — walking all three at once is a different combo every
       press and no way to keep the half you liked. Ephemeral: the day moves
       under it, so yesterday's rung means nothing this morning. */
    mpCombo: { p: 0, f: 0, c: 0 },
    /* How far down each meal's ranked list Try again has walked, keyed day
       and meal. Ephemeral on purpose: tomorrow starts at the top again. */
    mTry: {},
    /* Which eaten plate has had its portion woken up for a correction. One at
       a time, and never persisted: it is a gesture, not a setting. */
    mEdit: '',
    mRowOpen: null,
    /* Which plate has its portion open as a typed box, or null for none. One
       at a time and never persisted, for the same reason mEdit is not: it is
       a gesture. null rather than '' so "nothing is being typed" and "the box
       holds an empty string" can never be the same state. */
    mType: null,
    /* Which day's summary card is open, or '' for none. A day key rather than
       a boolean, because the card can be opened for any day from the menu and
       not only for the one just closed. */
    mDoneOpen: ''
  };

  // ------------------------------------------------------------------ browse
  /** "1 hr 20 mins" -> 80. Used for sorting by how long something takes. */
  function timeMins(r) {
    var h = r.time.match(/(\d+(?:\.\d+)?)\s*hr/i);
    var m = r.time.match(/(\d+)\s*min/i);
    return (h ? parseFloat(h[1]) * 60 : 0) + (m ? parseInt(m[1], 10) : 0);
  }

  var SORTS = {
    book: null,
    /* a missing score sorts last rather than to the top */
    healthy: function (a, b) { return (b.score === null ? -1 : b.score) - (a.score === null ? -1 : a.score); },
    protein: function (a, b) { return ((b.macro && b.macro.p) || 0) - ((a.macro && a.macro.p) || 0); },
    quick: function (a, b) { return timeMins(a) - timeMins(b); }
  };

  /* Why a recipe matched, which is not the same question as whether it did.
     3 its name, 2 an ingredient, 1 only its section, 0 not at all.

     Searching "breakfast" used to return fifty recipes of which seven were
     named for one — the other forty-three came along because their section is
     called Morning Brews & High-Protein Breakfasts, and arrived interleaved
     with the ones actually wanted. Section is still worth matching, because
     "chocolate" ought to find the chocolate section, but it is the weakest
     reason to appear and belongs at the bottom rather than in the middle. */
  /* Within a name match there are grades now (see searchScore), so a name
     returns between 3 and 4 — the better the match, the nearer 4 — and the
     three reasons keep their order and their meaning: `=== 1` is still
     “only its section”. The ingredient and section grades read the name's
     words too, so “chicken rice” finds the chicken bowl with rice in it,
     and neither of them forgives a typo: a misspelling matched against
     forty ingredient lines finds something in nearly every recipe. */
  function matchRank(r, qs) {
    var s = searchScore(r.name, qs);
    if (s >= 0) return 4 - s / 400;
    if (searchScore(r.name + ' ' + r.ing.join(' '), qs, true) >= 0) return 2;
    if (searchScore(r.name + ' ' + r.secName, qs, true) >= 0) return 1;
    return 0;
  }

  /* ------------------------------------------------------------ one search
   *
     Both searches used to be one indexOf of the whole phrase: “vanilla oat”
     found nothing — no name has those nine characters in a row — and “egg”
     put Eggplant above the Eggs you had starred: both contain it, and
     nothing said which was the one you meant. Blake: “Any word order;
     ★ and recent foods ranked first, then exact, then word-starts; common
     variants (oatmeal/oats, yoghurt/yogurt) and one-letter typos still match.
     Recipes search the same way.”
   *
     So a query is words, and every word has to find a word in the name. It
     can find it whole, or as the start of one (“oa” in oats), or inside one
     (“berr” in strawberries, which the old match found and this must not
     lose), or — for a word of four letters or more — one letter off. Words
     are compared in two forms: as typed, so the prefix of a word being typed
     still matches, and folded, so a plural, a British spelling or a variant
     name meets its twin. The grade is the weakest word's: one typo makes the
     whole hit a typo hit. */
  var SEARCH_VARIANT = {
    yoghurt: 'yogurt', yoghurts: 'yogurt', grey: 'gray', greys: 'gray',
    chilli: 'chili', chillies: 'chili', chile: 'chili', chiles: 'chili',
    oatmeal: 'oat', oatmeals: 'oat', donut: 'doughnut', donuts: 'doughnut',
    catsup: 'ketchup', courgette: 'zucchini', courgettes: 'zucchini',
    aubergine: 'eggplant', aubergines: 'eggplant', garbanzo: 'chickpea',
    garbanzos: 'chickpea', capsicum: 'pepper', capsicums: 'pepper'
  };

  /* Lower case, accents off, apostrophes out — “Hershey's” is one word, and
     jalapeño is the word people type as jalapeno. */
  function searchFold(s) {
    s = String(s || '').toLowerCase();
    if (s.normalize) s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return s.replace(/[\u0027\u2019]/g, '');
  }

  /* A plural and its singular, folded to one stem: eggs and egg, berries and
     berry, tomatoes and tomato, peaches and peach, cookies and cookie. Not a
     stemmer, and it does not need to be one: both sides go through it, so it
     only has to be consistent, never grammatical. */
  function searchCanon(w) {
    w = SEARCH_VARIANT[w] || w;
    if (w.length >= 4) {
      if (/ies$/.test(w)) w = w.slice(0, -3) + 'i';
      else if (/(s|x|z|o|ch|sh)es$/.test(w)) w = w.slice(0, -2);
      else if (/[^su]s$/.test(w) && !/is$/.test(w)) w = w.slice(0, -1);
    }
    if (w.length >= 3) {
      if (/y$/.test(w)) w = w.slice(0, -1) + 'i';
      else if (/e$/.test(w)) w = w.slice(0, -1);
    }
    return w;
  }

  /* A name's words, worked out once per name and kept: the picker asks on
     every keystroke over the whole food table and the whole book, and the
     names do not change between keystrokes. Keyed by the text itself, so a
     renamed food of your own simply becomes a new entry. */
  var SEARCH_WORDS = {};
  function searchWords(text) {
    var k = String(text || '');
    var got = SEARCH_WORDS[k];
    if (got) return got;
    got = searchFold(k).split(/[^a-z0-9]+/).filter(Boolean).map(function (w) {
      return { w: w, c: searchCanon(w) };
    });
    SEARCH_WORDS[k] = got;
    return got;
  }

  /* One letter off, and no further: a letter wrong, added, dropped, or two
     neighbours swapped — the four slips a thumb makes. */
  function searchNear(a, b) {
    var la = a.length, lb = b.length;
    if (Math.abs(la - lb) > 1 || a === b) return a === b;
    var i = 0;
    while (i < la && i < lb && a.charAt(i) === b.charAt(i)) i++;
    if (la === lb) {
      if (a.slice(i + 1) === b.slice(i + 1)) return true;                  // changed
      return a.charAt(i) === b.charAt(i + 1) && a.charAt(i + 1) === b.charAt(i) &&
        a.slice(i + 2) === b.slice(i + 2);                                  // swapped
    }
    return la > lb ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
  }

  /* How well `text` answers the query `q`: -1 for not at all, else a score
     where lower is better and the hundreds say the grade —
       0  the whole name, word for word in any order (“oats egg” for Egg oats)
       1  every word at the start of a name word
       2  some word found inside a name word
       3  some word one letter off
     and below that, words only begun (tens) and name words left over (units),
     so “egg” puts Egg whites — a whole word and one to spare — before
     Eggplant, which only begins with it. `strict` refuses the typo grade, for
     text too long to guess against. */
  function searchScore(text, q, strict) {
    var qw = searchWords(q);
    if (!qw.length) return -1;
    var nw = searchWords(text);
    var worst = 0, begun = 0, used = {};
    for (var i = 0; i < qw.length; i++) {
      var best = 9, at = -1;
      for (var j = 0; j < nw.length && best > 0; j++) {
        var a = qw[i], b = nw[j], g = 9;
        if (a.c === b.c || a.w === b.w) g = 0;
        else if (b.w.indexOf(a.w) === 0 || b.c.indexOf(a.c) === 0) g = 1;
        else if (a.w.length >= 3 && b.w.indexOf(a.w) > 0) g = 2;
        else if (!strict && a.w.length >= 4 && (searchNear(a.c, b.c) || searchNear(a.w, b.w))) g = 3;
        if (g < best) { best = g; at = j; }
      }
      if (best === 9) return -1;
      used[at] = 1;
      if (best === 1) begun++;
      if (best > worst) worst = best;
    }
    var spare = nw.length - Object.keys(used).length;
    /* The whole name, not merely whole words: “egg” is Eggs exactly and
       Egg whites only partly, and the starred Eggs must not tie with it. */
    var tier = worst === 0 ? (spare ? 1 : 0) : worst;
    return tier * 100 + Math.min(9, begun) * 10 + Math.min(9, spare);
  }

  function filtered() {
    var qs = S.qy.trim().toLowerCase();
    /* Each recipe's grade worked out once, not twice per comparison — the
       sort below asks for it n log n times. */
    var rank = {};
    return RECIPES.filter(function (r) {
      if (S.bookF !== 'all' && r.book !== S.bookF) return false;
      if (S.secF !== 'all' && (r.book + '-' + r.secNum + '-' + r.secName) !== S.secF) return false;
      if (S.diffF !== 'all' && r.diff !== S.diffF) return false;
      if (S.pantryF === 'base' && missingFor(r).length) return false;
      if (S.pantryF === 'extras' && !missingFor(r).length) return false;
      if (S.favOnly && !window.Store.isFav(r.id)) return false;
      if (qs && !(rank[r.id] = matchRank(r, qs))) return false;
      return true;
    }).sort(function (a, b) {
      /* While searching, how well a recipe matches outranks book order — but
         not a sort the reader chose on purpose. Asking for "most protein" and
         getting relevance instead would be the app overruling them. */
      if (qs) {
        /* A chosen order still sorts inside each reason — name, ingredient,
           section — as it always did; only the finer grade within a name
           match steps aside for it. Ceil, because a name is (3, 4]. */
        var d = SORTS[S.sort] ? Math.ceil(rank[b.id]) - Math.ceil(rank[a.id]) : rank[b.id] - rank[a.id];
        if (d) return d;
      }
      return SORTS[S.sort] ? SORTS[S.sort](a, b) : 0;
    });
  }

  function ours() {
    return RECIPES.filter(function (r) { return r.book === 3; });
  }

  /* The three words on the storehouse filter, which had been wrong twice over.
     "Needs pantry extras" arrived before the Pantry tab did, and once that tab
     existed the same word meant two opposite things one tab apart: the tab is
     what you keep, the filter meant what you do not. And the labels described
     the storehouse when the pantry had become the thing actually answering —
     take Crio Bru off your shelf and this filter changes behaviour while its
     wording does not.

     So it follows the pantry: Store.pantryChanged() decides which word is
     true. Untouched, it talks about the storehouse,
     because that is true out of the box. Edit your pantry and it talks about
     your shelf, because that is true from then on. So does "I keep my own":
     no source, nothing but the shelf, and "Just my staples" over 0 recipes
     read as a broken filter. */
  function renderPantryFilterLabels() {
    var mine = window.Store.pantryChanged() || !window.Store.opt('store', true);
    var sel = $('pantrySel');
    var words = mine
      ? ['Everything', "Only what's on my shelf", 'Needs a shop']
      : ['Everything', 'Just my staples', 'Needs a shop'];
    ['all', 'base', 'extras'].forEach(function (v, i) {
      var o = sel.querySelector('option[value="' + v + '"]');
      if (o) o.textContent = words[i];
    });
    sel.setAttribute('aria-label', mine ? 'What you keep' : 'Staples');
  }

  function renderSections() {
    /* Grouped by volume rather than prefixed with it. Every option used to
       begin "Run and Not Be Weary · " or "Around the Table · ", which on a
       phone is twenty characters of the same words twelve times over, pushing
       the part you are actually reading past the edge of the picker. An
       optgroup says it once and iOS and Android both render it as a heading. */
    var sel = $('secSel');
    var seen = {}, opts = ['<option value="all">All sections</option>'], lastBook = null;
    RECIPES.forEach(function (r) {
      var key = r.book + '-' + r.secNum + '-' + r.secName;
      if (seen[key]) return;
      seen[key] = 1;
      if (S.bookF !== 'all' && r.book !== S.bookF) return;
      if (r.book !== lastBook) {
        if (lastBook !== null) opts.push('</optgroup>');
        opts.push('<optgroup label="' + esc((BOOKS[r.book] || BOOKS[3]).name) + '">');
        lastBook = r.book;
      }
      opts.push('<option value="' + esc(key) + '">' +
        esc(SEC_SHORT[r.book + '-' + r.secNum] || r.secName) + '</option>');
    });
    if (lastBook !== null) opts.push('</optgroup>');
    sel.innerHTML = opts.join('');
    sel.value = S.secF;
    if (sel.value !== S.secF) { S.secF = 'all'; sel.value = 'all'; }

    // the third volume only exists once there is something in it
    var n = ours().length;
    $('bookOurs').classList.toggle('hide', !n);
    /* The Ours card is written by renderDownloads, which draws the whole
       shelf — writing into it from here would clobber its markup. */
    if (!n && S.printSet === '3') S.printSet = 'all';
    if (!n && S.bookF === 3) { S.bookF = 'all'; }
    document.querySelector('.brand-sub').textContent =
      RECIPES.length + ' recipes · ' + (n ? 'three volumes' : 'two volumes');
  }

  function renderBrowse() {
    var list = filtered();
    $('browseTitle').textContent = BOOKS[S.bookF] ? BOOKS[S.bookF].name : 'The whole collection';
    var order = { healthy: ' · healthiest first', protein: ' · most protein first', quick: ' · quickest first' };
    var qs = S.qy.trim().toLowerCase();
    /* Not while searching. Once you have typed "chicken" the heading is no
       longer about a book and the line under it is in the way of the answer. */
    $('browseBlurb').textContent = qs ? ''
      : fillCounts(BOOKS[S.bookF] ? (APP_BLURB[S.bookF] || BOOKS[S.bookF].blurb) : COLLECTION_BLURB, RECIPES);
    /* Say how many are here on their own merits and how many arrived because
       their section is named for the search. Without it, "breakfast" returning
       fifty recipes reads as fifty breakfasts, and the reader scrolls looking
       for the mistake. */
    var loose = qs ? list.filter(function (r) { return matchRank(r, qs) === 1; }).length : 0;
    $('browseCount').textContent = list.length + (list.length === 1 ? ' recipe' : ' recipes') +
      (loose ? ' · ' + (list.length - loose) + ' matching, ' + loose + ' more from sections named for it'
             : (order[S.sort] || ''));
    $('browseEmpty').classList.toggle('hide', list.length !== 0);
    /* Your own shelf, and nothing on it covers a whole recipe yet: say where
       the shelf is, not that the filters are wrong. Named the way the door
       names it; On hand is reached from Share now, not a Pantry tab. */
    $('browseEmpty').textContent = S.pantryF === 'base' && !window.Store.opt('store', true)
      ? 'Nothing on your shelf yet \u2014 tick what you keep on hand, under Share \u203a Your kitchen' : 'Nothing matches those filters.';
    /* The strip's button says how many filters are on, so "Filters" with two
       set does not read the same as "Filters" with none. Sort counts: a list
       in protein order is not the book, and the reader may have forgotten. */
    var fn = filtCount();
    $('filtCount').textContent = fn ? String(fn) : '';
    $('filtBtn').setAttribute('aria-label', fn ? 'Filters, ' + fn + ' on' : 'Filters');

    /* Section headings down the grid.
     *
     * The collection is two hundred and seventy-seven cards and, in book
     * order, it is also fourteen sections that mean something — Breakfasts,
     * then Snacks, then Lunch. None of that was on the page: the card says
     * RUN · 042 and nothing says why 042 sits between 041 and 043, so
     * scrolling the whole collection was scrolling a wall.
     *
     * Only in book order, and only when there is more than one section in
     * what is showing. Sorted by score or by time the recipes are no longer
     * in sections, and a divider claiming otherwise would be a lie about the
     * order underneath it. Searching, the same. */
    var secKey = function (r) { return r.book + '-' + r.secNum; };
    var secCount = {};
    list.forEach(function (r) { secCount[secKey(r)] = (secCount[secKey(r)] || 0) + 1; });
    var showSecs = S.sort === 'book' && !qs && Object.keys(secCount).length > 1;
    var lastSec = null;

    $('grid').innerHTML = list.map(function (r) {
      var head = '';
      if (showSecs && secKey(r) !== lastSec) {
        lastSec = secKey(r);
        var n = secCount[lastSec];
        head = '<div class="grid-sec">' +
          '<span class="grid-sec-b">' + esc((BOOKS[r.book] || BOOKS[3]).short) + '</span>' +
          '<b>' + esc(SEC_SHORT[lastSec] || r.secName) + '</b>' +
          '<span class="grid-sec-n">' + n + '</span>' +
          ((APP_SEC_NOTE[lastSec] || SEC_NOTE[lastSec]) ? '<span class="grid-sec-s">' + esc(APP_SEC_NOTE[lastSec] || SEC_NOTE[lastSec]) + '</span>' : '') +
        '</div>';
      }
      var fav = window.Store.isFav(r.id);
      var chip = r.score === null
        ? '<span class="chip plain">' + esc(diffLabel(r.diff)) + '</span>'
        : leaf(r.score);
      /* esc, like every other interpolation on this card. A recipe id is
         generated locally and is safe — but a recipe arriving from the shared
         household document was typed by somebody else, and the whole point of
         a household is that it holds other people's writing. */
      var card = '<button class="card" data-open="' + esc(r.id) + '">' +
        '<span class="card-top">' +
          '<span class="card-num">' + (BOOKS[r.book] || BOOKS[3]).short + ' · ' + no(r) + '</span>' +
          '<span class="card-fav">' + (fav ? '★ Saved' : '') + '</span>' +
        '</span>' +
        '<span class="card-name">' + esc(r.name) + '</span>' +
        '<span class="card-sub">' + esc(r.tagline || macroLine(r)) + '</span>' +
        '<span class="card-foot">' +
          '<span class="card-meta">' + esc(r.time + ' · ' + r.servings.split(' (')[0]) + '</span>' +
          chip +
        '</span>' +
      '</button>';
      return head + card;
    }).join('');
    /* A search that leaves twelve cards can pull the page back up past the
       rail, and the strip should go with it. */
    syncStrip();
  }

  // ---------------------------------------------------------------- planning
  /* Everything in the week, once each. The same recipe on two days at different
     sizes is one shopping trip for the sum of the two. */
  function planEntries() {
    var out = [], at = {};
    DAYS.forEach(function (d) {
      window.Store.day(d[0]).forEach(function (e) {
        if (!BY_ID[e.id] || e.lo) return;    // leftovers are eaten, not bought
        if (at[e.id] === undefined) { at[e.id] = out.length; out.push({ r: BY_ID[e.id], x: e.x }); }
        else out[at[e.id]].x += e.x;
      });
    });
    return out;
  }

  function planIds() {
    return planEntries().map(function (e) { return e.r.id; });
  }

  /* The strip of weeks above the grid. Everything to do with which week is
     showing lives here; the grid below never knows there is more than one. */
  /* The calendar's head: which week (or month) is on screen, how far it is
     from this one, and the actions that make sense for it. A past week is
     history, so it is not planned into. */
  var CAL_DAYS = [DAYS[6]].concat(DAYS.slice(0, 6));        // Sunday first
  function calMidnight(d) { var x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
  function calDate(key) {
    var st = window.Store.activeWeek().start;
    if (!st) return null;
    var d = new Date(st); d.setDate(d.getDate() + CAL_DAYS.map(function (x) { return x[0]; }).indexOf(key));
    return calMidnight(d);
  }
  function calPastDay(key) { var d = calDate(key); return !!d && d < calMidnight(new Date()); }
  function calIsToday(key) { var d = calDate(key); return !!d && d.getTime() === calMidnight(new Date()).getTime(); }
  function calOffset() {
    var st = window.Store.activeWeek().start, now = window.Store.weekStart(window.Store.thisWeek());
    return st && now ? Math.round((st - now) / (7 * 864e5)) : 0;
  }
  function calPastWeek() { return calOffset() < 0; }
  function renderWeeks() {
    var wk = window.Store.activeWeek(), off = calOffset(), month = S.calMode === 'm';
    if (month) {
      var mf = S.calMonth || calMidnight(wk.start || new Date());
      $('weekTitle').textContent = mf.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if ($('calSub')) $('calSub').textContent = 'tap a day to open its week';
    } else {
      $('weekTitle').textContent = wk.name;
      if ($('calSub')) $('calSub').textContent = off === 0 ? 'This week' : off === 1 ? 'Next week' : off === -1 ? 'Last week'
        : off > 0 ? 'In ' + off + ' weeks' : (-off) + ' weeks ago';
    }
    document.querySelectorAll('#calMode [data-cal]').forEach(function (b) {
      b.setAttribute('aria-pressed', String((b.dataset.cal === 'm') === month));
    });
    if ($('planMyWeek')) {
      $('planMyWeek').disabled = off < 0 || month;
      $('planMyWeek').classList.toggle('hide', off < 0 || month);      // a week gone by is not planned into
    }
  }

  // taps cycle through these, so a Sunday roast for twice the family is two taps
  var SCALES = [1, 2, 3, 4, 0.5];

  /* Which day of the plan's week is today, Monday 0. The week has no dates,
     but the days before today are the ones that have been eaten. */
  /* Drawn, not emoji: the same thin ink line as the rest of the app's
     icons. Star comes back often, thumb up a little more often, thumb down
     never — and once one is chosen, the row says so. */
  var RATE_ICON = {
    2: '<path d="M8 1.9l1.85 3.8 4.2.6-3.05 2.95.72 4.17L8 11.45l-3.72 1.97.72-4.17L1.95 6.3l4.2-.6z"/>',
    1: '<path d="M5.2 7.2v6.6M5.2 7.2 8 2.4c1.1 0 1.9.9 1.6 2.1L9.2 6.2h3.3c.9 0 1.6.9 1.3 1.8l-1.1 4.6c-.2.7-.8 1.2-1.5 1.2H5.2M2.2 7.2h3v6.6h-3z"/>',
    '-1': '<g transform="rotate(180 8 8)"><path d="M5.2 7.2v6.6M5.2 7.2 8 2.4c1.1 0 1.9.9 1.6 2.1L9.2 6.2h3.3c.9 0 1.6.9 1.3 1.8l-1.1 4.6c-.2.7-.8 1.2-1.5 1.2H5.2M2.2 7.2h3v6.6h-3z"/></g>'
  };
  var RATE_BTN = [[2, 'Favourite', 'comes back often'], [1, 'Good', 'comes back a little more'], [-1, 'Not again', 'never suggested again']];
  function rateHTML(id, rt) {
    var on = RATE_BTN.filter(function (b) { return b[0] === rt; })[0];
    return '<div class="day-rate no-print" role="group" aria-label="How was it?">' + RATE_BTN.map(function (b) {
      return '<button data-prate="' + esc(String(id)) + '" data-v="' + b[0] + '" aria-pressed="' + (rt === b[0]) + '" aria-label="' + b[1] + ': ' + b[2] + '" title="' + b[1] + ': ' + b[2] + '">' +
        '<svg viewBox="0 0 16 16" aria-hidden="true">' + RATE_ICON[b[0]] + '</svg></button>';
    }).join('') + (on ? '<span class="day-rate-say">' + on[1] + ' \u00b7 ' + on[2] + '</span>' : '') + '</div>';
  }
  var PROT_VAR = { Chicken: 'var(--p-ch)', Beef: 'var(--p-bf)', Pork: 'var(--p-pk)', Meatless: 'var(--p-ml)' };
  function renderPlan() {
    renderWeeks();
    var month = S.calMode === 'm', past = calPastWeek();
    ['planSum', 'calActs', 'calAgain'].forEach(function (id) { if ($(id)) $(id).classList.toggle('hide', month); });
    $('planGrid').classList.toggle('cal-month', month);
    if (month) { $('planGrid').innerHTML = calMonthHTML(); return; }
    /* The week at a glance: nights with a dinner, what is left to buy, and
       how long the list is — or, for a week gone by, what it was. */
    var nights = DAYS.filter(function (d) {
      return window.Store.day(d[0]).some(function (e) { return BY_ID[e.id] && pwIsDinner(BY_ID[e.id]); });
    }).length;
    var ents = planEntries(), built = buildList(ents), cost = listUsd(built);
    var nList = built.groups.reduce(function (n, g) { return n + g.items.length; }, 0);
    var favs = 0;
    DAYS.forEach(function (d) { window.Store.day(d[0]).forEach(function (e) { if (window.Store.rating(e.id) === 2) favs++; }); });
    if ($('planSetup')) $('planSetup').innerHTML = planSetUp() ? '' :
      '<div class="setup-card"><b>Where do your staples come from?</b><span>The storehouse, a food bank, a big shop or your own shelf. Set it once; it decides which dinners are suggested and how the list is split.</span>' +
      '<button class="pw-go" data-stepgo="where">Set it once</button></div>';
    /* The status line: the week's numbers, after "This week". */
    if ($('planSum')) $('planSum').innerHTML = ents.length ?
      ' \u00b7 <b>' + nights + ' of 7</b> nights planned' +
      (past ? ' \u00b7 <b>' + favs + '</b> \u2605' :
        ' \u00b7 <b>' + (cost < 0.5 ? '$0' : '~' + pwMoney(cost)) + '</b> to buy \u00b7 <b>' + nList + '</b> items') : '';
    /* A day is a row: its dinner is one button that opens the day's sheet
       (open, swap, cook double, take off, rate), and ↻ beside it swaps on
       the spot. The ×N, × and rating that used to crowd the row live in the
       sheet now, so the week reads as a week. */
    $('planGrid').innerHTML = CAL_DAYS.map(function (d) {
      var key = d[0], dt = calDate(key), gone = calPastDay(key), now = calIsToday(key);
      var list = window.Store.day(key).filter(function (e) { return BY_ID[e.id]; });
      var items = list.map(function (e) {
        var r = BY_ID[e.id], rt = window.Store.rating(r.id), din = pwIsDinner(r), twin = e.lo ? null : planTwin(e.id, key);
        var meta = e.lo ? '' : [r.time || '', e.x !== 1 ? 'cooked \u00d7' + fmtNum(e.x) : '', twin ? 'leftovers ' + calDayName(twin.d) : '',
          (gone || now) && rt ? (rt === 2 ? '\u2605 favourite' : rt === 1 ? 'good' : 'not again') : ''].filter(Boolean).join(' \u00b7 ');
        var nw = S.pwNew && S.pwNew[key + '|' + e.id];
        return '<div class="day-item' + (e.lo ? ' lo' : '') + (din ? '' : ' mini') + (nw ? ' new' : '') + '" style="--pc:' + (din ? PROT_VAR[pwProt(r)] : 'transparent') + '">' +
          '<button class="day-item-name" data-dayopen="' + esc(String(e.id)) + '" data-day="' + key + '" aria-label="' + esc(r.name) + ', ' + d[1] + '">' + esc(r.name) +
            (e.lo ? ' <span class="day-tag">leftovers</span>' : '') + (nw ? ' <span class="day-new">New</span>' : '') +
            (meta ? '<small>' + esc(meta) + '</small>' : '') + '</button>' +
          (gone || !din || e.lo ? '' : '<span class="day-ctl no-print"><button class="day-sw" data-pswap="' + esc(String(e.id)) + '" data-day="' + key + '" ' +
              'aria-label="Swap ' + esc(r.name) + ' for another dinner">\u21bb</button></span>') +
        '</div>';
      }).join('');
      return '<div class="day cal-day' + (now ? ' today' : '') + (gone ? ' past' : '') + '">' +
        '<div class="cal-date" aria-label="' + d[1] + (dt ? ' ' + dt.getDate() : '') + '"><small>' + d[2].toUpperCase() + '</small><b>' + (dt ? dt.getDate() : '') + '</b></div>' +
        '<div class="day-body">' + items +
          (gone ? (list.length ? '' : '<div class="day-empty">Nothing planned</div>')
            : '<button class="day-add no-print" data-addday="' + key + '" aria-label="Add to ' + d[1] + '">+ Add' + (list.length ? '' : ' a dinner') + '</button>') +
        '</div></div>';
    }).join('');
    /* The foot: what the week comes to, and the door to the list. */
    var nBuy = 0, nSrc = 0;
    built.groups.forEach(function (g) { if (g.src === 'b') nBuy = g.items.length; if (g.src === 's') nSrc = g.items.length; });
    if ($('planNext')) $('planNext').innerHTML = ents.length && !past ?
      '<button class="plan-next" data-stepgo="list"><b>The list</b><span>' +
        (nBuy ? nBuy + ' to buy' + (cost >= 0.5 ? ', ~' + pwMoney(cost) : '') : 'nothing to buy') +
        (nSrc ? ' \u00b7 ' + nSrc + ' from ' + srcW().the : '') + '</span></button>' : '';
    if ($('calActs')) $('calActs').innerHTML =
      (past ? '' : '<button class="nut-ask" data-calagain="1" aria-expanded="' + !!S.calAgain + '">Cook this again…</button>') +
      (ents.length ? '<button class="nut-ask" data-caltpl="1">Save as a template</button>' : '') +
      (past ? '' : '<button class="nut-ask" id="clearPlan">Clear week</button>');
    if ($('calAgain')) $('calAgain').innerHTML = S.calAgain && !past ? calAgainHTML() : '';
  }
  /* Cook this again: a template or a week gone by, onto this one. */
  function calAgainHTML() {
    var src = window.Store.sources();
    return '<div class="cal-again"><b>Cook this again</b><p>Put a past week or a saved template on this week. Only empty days still to come are filled.</p>' +
      (src.length ? src.slice(0, 12).map(function (w) {
        var nm = w.tpl ? w.name : (function () {
          var e = new Date(w.start); e.setDate(e.getDate() + 6);
          var f = function (d) { return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); };
          return f(w.start) + ' – ' + f(e);
        })();
        return '<div class="cal-src"><span>' + esc(nm) + '<small>' + (w.tpl ? 'template' : 'week') + ' · ' + w.n + (w.n === 1 ? ' meal' : ' meals') + '</small></span>' +
          '<button class="ghost" data-calfrom="' + esc(w.id) + '">Use</button></div>';
      }).join('') : '<p>Nothing to copy yet. Weeks you plan will show up here.</p>') + '</div>';
  }
  /* A month at a glance: each day's dinner as a bar in its protein's
     colour and its name, so a run of the same one stands out. */
  function calMonthHTML() {
    var mf = S.calMonth || calMidnight(window.Store.activeWeek().start || new Date());
    var first = new Date(mf.getFullYear(), mf.getMonth(), 1), start = new Date(first);
    start.setDate(1 - first.getDay());
    var days = new Date(mf.getFullYear(), mf.getMonth() + 1, 0).getDate();
    var cells = Math.ceil((first.getDay() + days) / 7) * 7, today = calMidnight(new Date()), wk = window.Store.activeWeek().id;
    var out = '<div class="cal-dow">' + CAL_DAYS.map(function (d) { return '<span>' + d[2].charAt(0) + '</span>'; }).join('') + '</div><div class="cal-grid">';
    for (var i = 0; i < cells; i++) {
      var d = new Date(start); d.setDate(start.getDate() + i); d = calMidnight(d);
      var wid = window.Store.weekIdOf(d), key = CAL_DAYS[d.getDay()][0];
      var ents = window.Store.dayOf(wid, key).filter(function (e) { return BY_ID[e.id]; });
      var din = ents.filter(function (e) { return pwIsDinner(BY_ID[e.id]); })[0] || ents[0];
      var r = din && BY_ID[din.id];
      out += '<button class="cal-cell' + (d.getMonth() !== mf.getMonth() ? ' out' : '') + (d.getTime() === today.getTime() ? ' now' : '') +
        (d < today ? ' gone' : '') + (wid === wk ? ' wk' : '') + '" data-calweek="' + wid + '" aria-label="' +
        esc(d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) + (r ? ': ' + r.name : '')) + '">' +
        '<b>' + d.getDate() + '</b>' +
        (r ? '<i style="background:' + (pwIsDinner(r) ? PROT_VAR[pwProt(r)] : 'var(--line-firm)') + '"></i><em>' + esc(din.lo ? 'Leftovers' : r.name) + '</em>' : '') +
        '</button>';
    }
    return out + '</div><div class="cal-legend">' + Object.keys(PROT_VAR).map(function (k) {
      return '<span><i style="background:' + PROT_VAR[k] + '"></i>' + k + '</span>';
    }).join('') + '</div>';
  }
  function calMove(dir) {
    S.pwNew = null;                          // New is this week's, as just filled
    if (S.calMode === 'm') {
      var m = S.calMonth || calMidnight(window.Store.activeWeek().start || new Date());
      S.calMonth = new Date(m.getFullYear(), m.getMonth() + dir, 1);
      renderPlan();
      return;
    }
    var st = window.Store.activeWeek().start || new Date();
    var d = new Date(st); d.setDate(d.getDate() + 7 * dir);
    S.calAgain = false;
    window.Store.setWeek(window.Store.weekIdOf(d));
  }
  document.addEventListener('click', function (e) {
    if (!e.target.closest || S.view !== 'plan') return;
    var t = e.target;
    if (t.closest('#calPrev')) { calMove(-1); return; }
    if (t.closest('#calNext')) { calMove(1); return; }
    if (t.closest('#calToday')) { S.calMonth = null; S.calAgain = false; window.Store.setWeek(window.Store.thisWeek()); renderPlan(); return; }
    var md = t.closest('[data-cal]');
    if (md) {
      S.calMode = md.dataset.cal;
      if (S.calMode === 'm') S.calMonth = calMidnight(window.Store.activeWeek().start || new Date());
      renderPlan();
      return;
    }
    var cw = t.closest('[data-calweek]');
    if (cw) { S.calMode = 'w'; window.Store.setWeek(cw.dataset.calweek); renderPlan(); return; }
    if (t.closest('[data-calagain]')) { S.calAgain = !S.calAgain; renderPlan(); return; }
    var cf = t.closest('[data-calfrom]');
    if (cf) {
      window.Store.cookAgain(cf.dataset.calfrom, CAL_DAYS.filter(function (d) { return !calPastDay(d[0]); }).map(function (d) { return d[0]; }));
      S.calAgain = false;
      return;
    }
    if (t.closest('[data-caltpl]')) {
      ask({ title: 'Save this week as…', value: 'Week of ' + window.Store.activeWeek().name, ok: 'Save' }, function (name) {
        if (name && name.trim()) window.Store.saveTemplate(name.trim());
      });
    }
  });
  /* A swipe across the week moves a week (or a month). */
  (function () {
    var x0 = null, y0 = null;
    document.addEventListener('touchstart', function (e) {
      if (S.view !== 'plan' || !e.target.closest || !e.target.closest('#planGrid')) { x0 = null; return; }
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
    }, { passive: true });
    document.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      x0 = null;
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) calMove(dx < 0 ? 1 : -1);
    }, { passive: true });
  })();

  /* One night swapped, by the same rules Plan my week picks with: the rest
     of the week stays, the answers are the ones last given. */
  function planSwap(id, day) {
    var a = pwAnswers(), picks = [];
    DAYS.forEach(function (d) {
      window.Store.day(d[0]).forEach(function (e) {
        var r = BY_ID[e.id];
        if (r && pwIsDinner(r) && !e.lo && !(d[0] === day && e.id === id)) picks.push({ r: r, x: e.x });
      });
    });
    S.pswapSeen = S.pswapSeen || {};
    var seen = S.pswapSeen[day] = S.pswapSeen[day] || [];
    seen.push(id);
    var nx = pwNext(a, picks, seen, day);
    if (!nx) { S.pswapSeen[day] = [id]; nx = pwNext(a, picks, [id], day); }
    if (!nx) return;
    var x = window.Store.scaleOf(id, day), twin = planTwin(id, day);
    window.Store.batch(function () {
      window.Store.removeFromDay(id, day);
      window.Store.addToDay(nx.r.id, day, x);
      /* Its leftovers night follows it, and it is still cooked double —
         into next week, when it is Saturday's. */
      if (twin) { window.Store.removeFromWeekDay(twin.wk, twin.d, id); window.Store.addToWeekDay(twin.wk, twin.d, nx.r.id, 1, true); }
    });
  }
  /* The day beside a day of the week on screen, one step either way, and
     the week it is in: {wk, d, at}, `at` its date. A week ends on Saturday
     and the cooking does not, so Saturday's next is next week's Sunday and
     Sunday's before is last week's Saturday. Saturday never offered Cook
     double at all: the day after it was looked up in a list of seven and
     was not there. */
  function calBeside(day, step) {
    var at = calDate(day);
    if (!at) {                               // a week with no dates: its own seven
      var j = PW_DAYS.indexOf(day) + step;
      return PW_DAYS[j] ? { wk: window.Store.activeWeek().id, d: PW_DAYS[j], at: null } : null;
    }
    at.setDate(at.getDate() + step);
    return { wk: window.Store.weekIdOf(at), d: PW_DAYS[at.getDay()], at: at };
  }
  function calGone(b) { return !!b.at && b.at < calMidnight(new Date()); }
  /* The leftovers night a cooked dinner feeds: the same recipe, eaten the
     next day, Saturday's on next week's Sunday. The day beside, or null. */
  function planTwin(id, day) {
    var n = calBeside(day, 1);
    if (!n) return null;
    var cooked = window.Store.day(day).some(function (e) { return e.id === id && !e.lo; });
    var lo = window.Store.dayOf(n.wk, n.d).some(function (e) { return e.id === id && e.lo; });
    return cooked && lo ? n : null;
  }
  /* And back the other way: the dinner a leftovers night is the second
     half of, cooked the day before. The day beside and its count, or null
     when nothing is cooked there — the other phone swapped it, or took it
     off. */
  function planCooked(id, day) {
    var b = calBeside(day, -1);
    var es = b ? window.Store.dayOf(b.wk, b.d).filter(function (e) { return e.id === id && !e.lo; }) : [];
    return es.length ? { wk: b.wk, d: b.d, at: b.at, x: es[es.length - 1].x } : null;
  }

  function calDayName(key) { var d = DAYS.filter(function (x) { return x[0] === key; })[0]; return d ? d[1] : key; }
  /* A day's dinner, opened: everything that could be done to it, in one
     place. Open the recipe, swap it, cook it double for a leftovers night,
     add another to the day, take it off — and, once it has been eaten, how
     it was. The week's rows carry none of this, so they stay rows. */
  function dayOpen(id, day) {
    S.daySheet = { id: id, day: day };
    pushSheet({ ds: 1 });
    renderModal();
    var x = document.querySelector('.sheet-x');
    if (x) x.focus();
  }
  function daySheetHTML() {
    var D = S.daySheet, r = BY_ID[D.id], key = D.day;
    var e = window.Store.day(key).filter(function (x) { return x.id === D.id; })[0];
    if (!r || !e) return '';
    var dt = calDate(key), gone = calPastDay(key), now = calIsToday(key), din = pwIsDinner(r);
    var twin = e.lo ? null : planTwin(e.id, key), nxt = calBeside(key, 1);
    var row = function (act, t, sub, cls) {
      return '<button class="dsh-row' + (cls ? ' ' + cls : '') + '" data-dsact="' + act + '"><span><b>' + t + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</span></button>';
    };
    var a = pwAnswers(), plans = pwPlans();
    /* A leftovers night with nothing cooked the night before: the other
       phone swapped that dinner, or took it off, and this one went on saying
       "nothing to cook or buy" over a night with nothing to eat. */
    var prv = e.lo && !planCooked(e.id, key) ? calBeside(key, -1) : null;
    var meta = e.lo ? (prv ? 'Leftovers \u2014 but nothing is cooked on ' + calDayName(prv.d) : 'Leftovers \u00b7 nothing to cook or buy') :
      [r.time || '', e.x !== 1 ? 'cooked \u00d7' + fmtNum(e.x) : 'the recipe as written', twin ? 'leftovers ' + calDayName(twin.d) : ''].filter(Boolean).join(' \u00b7 ');
    /* Saturday's leftovers land in next week, out of sight from here, so
       only onto a Sunday with nothing on it yet. */
    var dbl = nxt && !calGone(nxt) && (nxt.wk === window.Store.activeWeek().id ||
      !window.Store.dayOf(nxt.wk, nxt.d).some(function (x) { return BY_ID[x.id]; }));
    return '<div class="scrim no-print" data-close="1">' +
      '<div class="sheet dsh-sheet" role="dialog" aria-modal="true" aria-label="' + esc(calDayName(key)) + '\u2019s dinner">' +
        '<div class="sheet-top"><div class="sheet-eyebrow">' + esc(calDayName(key)) + (dt ? ' \u00b7 ' + dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '') + '</div>' +
          '<button class="sheet-x" data-close="1" aria-label="Close">&times;</button></div>' +
        '<div class="dsh-body"><h2 class="dsh-h">' + esc(r.name) + '</h2><p class="dsh-m">' + esc(meta) + '</p>' +
        (din && !e.lo ? pwPlateHTML(r, pwFitNorm(a.fit, plans), plans) : '') +
        ((gone || now) && !e.lo ? '<div class="dsh-rate"><div class="dsh-rl">How was it?</div>' + rateHTML(e.id, window.Store.rating(e.id)) + '</div>' : '') +
        '<div class="dsh-rows">' +
        row('open', 'Open the recipe', '') +
        (gone || !prv || calGone(prv) ? '' : row('cook', 'Cook it ' + calDayName(prv.d), 'Double, so ' + calDayName(key) + ' is its leftovers \u00b7 the list follows')) +
        (gone || e.lo || !din ? '' : row('swap', 'Swap for another dinner', 'By the same rules as Plan my week')) +
        (gone || e.lo ? '' : (twin ? row('single', e.x / 2 > 1 ? 'Back to ×' + fmtNum(e.x / 2) : 'Back to one batch', 'Takes the leftovers off ' + calDayName(twin.d)) :
          dbl ? row('double', 'Cook double, leftovers ' + calDayName(nxt.d), nxt.wk === window.Store.activeWeek().id ? 'The list follows' : 'Into next week \u00b7 the list follows') : '')) +
        (gone ? '' : row('add', 'Add another to ' + calDayName(key), '')) +
        (gone ? '' : row('remove', 'Take it off ' + calDayName(key), twin ? 'And its leftovers night' : '', 'dsh-danger')) +
        '</div></div></div></div>';
  }
  document.addEventListener('click', function (e) {
    if (!S.daySheet || S.openId || !e.target.closest) return;
    var rt = e.target.closest('[data-prate]');
    if (rt) {
      var rid = idOf(rt.dataset.prate), v = Number(rt.dataset.v);
      window.Store.setRating(rid, window.Store.rating(rid) === v ? 0 : v);
      renderModal();
      return;
    }
    var b = e.target.closest('[data-dsact]');
    if (!b) return;
    var D = S.daySheet, id = D.id, day = D.day, act = b.dataset.dsact;
    if (act === 'open') { openRecipe(id); return; }
    if (act === 'add') { S.daySheet = null; addOpen(day, true); return; }
    var was = window.Store.day(day).filter(function (x) { return x.id === id; })[0] || { x: 1 };
    var twin = planTwin(id, day), nxt = calBeside(day, 1), prv = calBeside(day, -1);
    /* The leftovers night taken off on its own: nobody is eating the second
       batch, so the dinner goes back to one. Left doubled, its sheet offered
       Cook double again, and ×2 became ×4 and never ×1. Looked up before the
       batch, which changes the days under it. */
    var half = function (x) { return x / 2 >= 1 ? x / 2 : 1; };
    var cooked = was.lo ? planCooked(id, day) : null;
    window.Store.batch(function () {
      if (act === 'swap') planSwap(id, day);
      if (act === 'double' && nxt) {
        var cook = { r: BY_ID[id], x: was.x, day: day }, left = pwLeftovers(cook, nxt.d);
        window.Store.addToDay(id, day, cook.x);
        window.Store.addToWeekDay(nxt.wk, left.day, id, left.x, true);
      }
      /* The orphan's dinner put back the night before, cooked double for
         the household by the one rule a leftovers night has. */
      if (act === 'cook' && prv && !cooked) {
        var r0 = BY_ID[id], first = { r: r0, x: pwX(r0, pwAnswers().ppl), day: prv.d };
        pwLeftovers(first, day);
        window.Store.addToWeekDay(prv.wk, prv.d, id, first.x);
      }
      if (act === 'single') { window.Store.addToDay(id, day, half(was.x)); if (twin) window.Store.removeFromWeekDay(twin.wk, twin.d, id); }
      if (act === 'remove') {
        window.Store.removeFromDay(id, day);
        if (twin) window.Store.removeFromWeekDay(twin.wk, twin.d, id);
        else if (cooked) window.Store.addToWeekDay(cooked.wk, cooked.d, id, half(cooked.x));
      }
    });
    close();
  });

  // ------------------------------------------------------------- add to day
  /* + Add on a day: a suggestion, a search of every recipe, and a few ways
     in. What it adds goes on at the household's size (Plan my week's "how
     many are eating"), like everything the sheet picks. */
  var AD_SECS = { breakfast: ['1-1', '2-1'], lunch: ['1-3', '2-2'] };
  function adPool(f, day) {
    var R = RECIPES;   // with your edits laid over, and your own recipes after
    if (f === 'dinner') return R.filter(pwIsDinner);
    if (AD_SECS[f]) return R.filter(function (r) { return AD_SECS[f].indexOf(r.book + '-' + r.secNum) >= 0; });
    if (f === 'fav') return R.filter(function (r) { return window.Store.isFav(r.id) || window.Store.rating(r.id) === 2; });
    if (f === 'before') {
      var seen = pwRecent(52);
      return R.filter(function (r) { return seen[String(r.id)]; });
    }
    if (f === 'left') {
      var before = PW_DAYS.slice(0, PW_DAYS.indexOf(day)), ids = {};
      before.forEach(function (d) { window.Store.day(d).forEach(function (e) { if (!e.lo) ids[e.id] = 1; }); });
      return R.filter(function (r) { return ids[r.id]; });
    }
    return R;
  }
  function adSuggest() {
    var A = S.add, a = pwAnswers(), picks = [];
    DAYS.forEach(function (d) {
      window.Store.day(d[0]).forEach(function (e) { var r = BY_ID[e.id]; if (r && pwIsDinner(r)) picks.push({ r: r, x: e.x }); });
    });
    var nx = pwNext(a, picks, A.seen, A.day);
    if (!nx && A.seen.length) { A.seen = []; nx = pwNext(a, picks, [], A.day); }
    A.sug = nx ? nx.r.id : null;
  }
  /* Why this one: what it shares with the rest of the week, or that the
     kitchen already has it. */
  function adWhy(r) {
    var have = 0, n = 0, shared = {};
    DAYS.forEach(function (d) {
      if (d[0] === S.add.day) return;
      window.Store.day(d[0]).forEach(function (e) {
        var o = BY_ID[e.id];
        if (o && !e.lo) (o.ingp || []).forEach(function (it) { if (pwMain(o) === it.k) shared[it.k] = d[2]; });
      });
    });
    var sh = pwMain(r) && shared[pwMain(r)];
    (r.ingp || []).forEach(function (it) {
      if (!it.k || it.k === 'water' || it.k === 'free' || it.o) return;
      n++; if (!itemNeedsBuying(it)) have++;
    });
    if (sh) return 'Uses ' + sh + '’s ' + pwIngName(pwMain(r)).toLowerCase();
    if (n && have === n) return 'Everything’s on hand';
    if (n && have / n >= 0.7) return 'You have ' + have + ' of ' + n;
    return '';
  }
  function adRow(r, lo, ppl) {
    var x = lo ? 1 : pwX(r, ppl || pwAnswers().ppl), c = pwCost([{ r: r, x: x }], true), why = lo ? '' : adWhy(r);
    return '<div class="ad-row"><button class="ad-mt" data-adopen="' + esc(String(r.id)) + '">' +
      '<span class="ad-n">' + esc(r.name) + '</span>' +
      '<span class="ad-m">' + esc(r.time || '') + (lo ? ' · leftovers, nothing to buy' : ' · ' + (c < 0.5 ? 'nothing to buy' : '~' + pwMoney(c))) + '</span>' +
      (why ? '<span class="ad-why">' + esc(why) + '</span>' : '') + '</button>' +
      '<button class="ad-plus" data-adadd="' + esc(String(r.id)) + '"' + (lo ? ' data-lo="1"' : '') + ' aria-label="Add ' + esc(r.name) + '">+</button></div>';
  }
  function adListHTML() {
    var A = S.add, q = String(A.q || '').trim().toLowerCase();
    var pool = q ? RECIPES.filter(function (r) { return r.name.toLowerCase().indexOf(q) >= 0; }) : adPool(A.f, A.day);
    pool = pool.filter(function (r) { return window.Store.rating(r.id) !== -1 || q; });
    if (!pool.length) return '<p class="pw-note">' + (q ? 'No recipe called that.' : A.f === 'left' ? 'Nothing earlier in the week to have again.' : 'Nothing here yet.') + '</p>';
    var ppl = pwAnswers().ppl;
    return pool.slice(0, 40).map(function (r) { return adRow(r, !q && A.f === 'left', ppl); }).join('') +
      (pool.length > 40 ? '<p class="pw-note">' + (pool.length - 40) + ' more. Search to narrow them.</p>' : '');
  }
  function addHTML() {
    var A = S.add, dn = DAYS.filter(function (d) { return d[0] === A.day; })[0], r = A.sug && BY_ID[A.sug];
    var chips = [['dinner', 'Dinner'], ['breakfast', 'Breakfast'], ['lunch', 'Lunch'], ['fav', 'Favourites'], ['before', 'Made before'], ['left', 'Leftovers']];
    return '<div class="scrim no-print" data-close="1">' +
      '<div class="sheet pw-sheet ad-sheet" role="dialog" aria-modal="true" aria-label="Add to ' + dn[1] + '">' +
        '<div class="sheet-top"><div class="sheet-eyebrow">Add to ' + dn[1] + '</div>' +
          '<button class="sheet-x" data-close="1" aria-label="Close">&times;</button></div>' +
        '<div class="pw-body">' +
          (r ? '<div class="ad-sug"><div class="ad-sl">Suggested</div>' + adRow(r) +
            '<button class="ad-again" data-adsw="1">↻ Another</button></div>' : '') +
          '<input class="pw-find" id="adFind" type="search" placeholder="Search every recipe…" autocomplete="off" aria-label="Search recipes" value="' + esc(A.q || '') + '">' +
          '<div class="pw-chips ad-chips" role="group">' + chips.map(function (c) {
            return '<button class="pw-chip" data-adf="' + c[0] + '" aria-pressed="' + (A.f === c[0]) + '">' + c[1] + '</button>';
          }).join('') + '</div>' +
          '<div id="adList">' + adListHTML() + '</div>' +
        '</div></div></div>';
  }
  /* From a day's sheet it takes that sheet's place in the history rather
     than stacking on it, so one back lands on the week, not on a sheet that
     was already left. */
  function addOpen(day, inPlace) {
    S.add = { day: day, f: 'dinner', q: '', seen: [], sug: null };
    adSuggest();
    S.addOpen = true;
    if (inPlace && !popping) history.replaceState({ ad: 1, life: LIFE }, ''); else pushSheet({ ad: 1 });
    renderModal();
  }
  document.addEventListener('click', function (e) {
    if (!S.addOpen || !e.target.closest) return;
    var A = S.add;
    var f = e.target.closest('[data-adf]');
    if (f) { A.f = f.dataset.adf; A.q = ''; renderModal(); return; }
    if (e.target.closest('[data-adsw]')) { if (A.sug) A.seen.push(A.sug); adSuggest(); renderModal(); return; }
    var op = e.target.closest('[data-adopen]');
    if (op) { openRecipe(idOf(op.dataset.adopen)); return; }
    var ad = e.target.closest('[data-adadd]');
    if (ad) {
      var r = BY_ID[idOf(ad.dataset.adadd)];
      if (!r) return;
      var lo = ad.dataset.lo === '1';
      window.Store.addToDay(r.id, A.day, lo ? 1 : pwX(r, pwAnswers().ppl), lo);
      close();
      if (S.view === 'plan') renderPlan();
    }
  });

  // ------------------------------------------------------------ plan my week
  /* A few questions, then the week's dinners and what they cost. Chantel,
     trying Tapcook: answer some questions and get a list of meals to make
     for the week; Blake: "Let's just stick to what we have in app." So the
     prices are the book's own estimates (tools/prices.js, per 100 g) and the
     shelf counts as free. The answers are this device's, remembered; what
     the sheet puts on the week goes through the Store like any other add,
     so it lands on every phone in the household. */
  var PW_SECS = ['1-4', '2-3', '2-4'];
  var PW_KEY = 'sh.pw';
  var PW_AVOID = {
    Spicy: { k: ['hot_sauce', 'jalapeno'], n: /spicy|buffalo|jalape|chipotle|sriracha|hot sauce/i },
    Pork: { k: ['pork_roast', 'pork_sausage', 'ham', 'sweet_pork'], n: /pork|\bham\b|sausage|carnitas|bacon/i },
    Fish: { k: ['tuna', 'salmon'], n: /tuna|salmon|fish|shrimp/i },
    Beans: { k: ['black_beans', 'pinto_beans', 'white_beans', 'kidney_beans', 'refried_beans'], n: /\bbeans?\b(?! & )/i },
    Mushrooms: { k: ['cream_soup_mush', 'mushrooms'], n: /mushroom/i },
    Dairy: { k: ['cheddar', 'milk', 'sour_cream', 'cottage_cheese', 'butter', 'evaporated_milk', 'cream_soup_chx', 'cream_soup_mush', 'mozzarella', 'parmesan', 'cream_cheese'], n: /chees|creamy|alfredo/i }
  };
  /* What a dinner is built on: its heaviest meat. A dinner with no meat in
     it at all is Meatless, beans and tuna included. */
  var PW_PROT = ['Chicken', 'Beef', 'Pork', 'Meatless'];
  function pwProt(r) {
    var m = pwMain(r);
    if (!m) return 'Meatless';
    if (/chicken/.test(m)) return 'Chicken';
    if (/pork|ham|sausage/.test(m)) return 'Pork';
    return 'Beef';
  }
  /* The kind of night, from the section of the book a dinner sits in. */
  var PW_KIND = [['Weeknight', '2-3', 'Weeknight comfort'], ['Sunday', '2-4', 'Sunday feast'],
    ['Copycat', '2-7', 'Copycat'], ['Everyday', '1-4', 'Everyday']];
  function pwKind(r) {
    var at = r.book + '-' + r.secNum;
    return (PW_KIND.filter(function (k) { return k[1] === at; })[0] || [''])[0];
  }
  var PW_WEEKEND = ['sat', 'sun'];
  var PW_DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];   // the calendar's order
  var PW_WEEKNIGHTS = ['mon', 'tue', 'wed', 'thu', 'fri'];
  /* The nights in one tap, and the leftovers with them. Blake: "add some
     pills like M-W-F w/ leftovers". M-W-F is Monday to Friday with two
     leftovers nights, which pwLoNights lays on Tuesday and Thursday: the
     night after each of the first two cooks. */
  var PW_PRESETS = [['wk', 'Weeknights', PW_WEEKNIGHTS, 0], ['mwf', 'M-W-F + leftovers', PW_WEEKNIGHTS, 2],
    ['all', 'Whole week', PW_DAYS, 0], ['we', 'Weekend', PW_WEEKEND, 0]];
  function pwPreDays(pre) { return pre[2].filter(function (d) { return !calPastDay(d); }); }
  // the week strip says a day the way a calendar heads its columns
  var PW_LETTER = { sun: 'S', mon: 'M', tue: 'T', wed: 'W', thu: 'Th', fri: 'F', sat: 'S' };
  /* Nights said the short way, in the week's order: three or more in a row
     are a span, "Mon–Fri"; the rest by name, "Mon, Wed & Fri". */
  function pwDaysSay(ds) {
    var idx = ds.map(function (d) { return PW_DAYS.indexOf(d); }).filter(function (i) { return i >= 0; }).sort(function (x, y) { return x - y; });
    var short = function (i) { var d = PW_DAYS[i]; return DAYS.filter(function (x) { return x[0] === d; })[0][2]; };
    var pieces = [], run = [];
    var flush = function () {
      if (run.length >= 3) pieces.push(short(run[0]) + '\u2013' + short(run[run.length - 1]));
      else run.forEach(function (i) { pieces.push(short(i)); });
      run = [];
    };
    idx.forEach(function (i) { if (run.length && i !== run[run.length - 1] + 1) flush(); run.push(i); });
    flush();
    return pieces.length > 1 ? pieces.slice(0, -1).join(', ') + ' & ' + pieces[pieces.length - 1] : (pieces[0] || '');
  }
  /* What the bar says of the nights: the ones it will cook for, by name, and
     an asked-for night that already has its dinner. A count alone ("for 1
     night") was how a week of one night went unnoticed. */
  function pwForSay(a) {
    var nights = pwNights(a.days), lo = pwLoNights(a, nights);
    var cook = nights.filter(function (d) { return !lo[d]; });
    var full = a.days.filter(function (d) { return !calPastDay(d) && nights.indexOf(d) < 0; });
    return { cook: cook, full: full,
      say: cook.length ? 'for ' + pwDaysSay(cook) + (cook.length === 1 ? ' only' : '') : '',
      fullSay: full.length ? pwDaysSay(full) + (full.length === 1 ? ' has a dinner' : ' have dinners') : '' };
  }
  function pwAnswers() {
    var a = null;
    try { a = JSON.parse(localStorage.getItem(PW_KEY)); } catch (e) { a = null; }
    a = a && typeof a === 'object' ? a : {};
    var list = function (v, ok) { return Array.isArray(v) ? v.filter(ok) : []; };
    /* The nights belong to the week they were picked for; everything else
       here is a habit. They were kept like the rest, and a visit on a
       Saturday, when only Saturday is left to light, saved "Saturday" for
       good: the next Monday opened on one night, and the bar said only "for
       1 night" (Blake, 2026-10-12: "I think I just had one day selected at
       the beginning... it was too confusing"). So the nights are stamped
       with the week (wk) and come back only in that week; any other week
       opens on the weeknights. Answers saved before the nights were days
       said how many; that many from Monday is what they meant. */
    var days = Array.isArray(a.days) && a.wk === window.Store.activeWeek().id ? list(a.days, function (d) { return PW_DAYS.indexOf(d) >= 0; })
      : !Array.isArray(a.days) && [3, 4, 5, 7].indexOf(a.n) >= 0 ? ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].slice(0, a.n)
      : PW_WEEKNIGHTS.slice();
    return {
      days: days,
      /* Picked dinners with these answers at least once: they are "your
         usual" from then on, and the sheet opens on the nights with the
         rest said in one line. */
      used: a.used ? 1 : 0,
      ppl: [2, 3, 4, 6, 8].indexOf(a.ppl) >= 0 ? a.ppl : 4,
      bud: a.bud >= 20 && a.bud <= 150 ? a.bud : 50,
      t: [20, 30, 45, 0].indexOf(a.t) >= 0 ? a.t : 45,
      prot: list(a.prot, function (x) { return PW_PROT.indexOf(x) >= 0; }),
      kind: list(a.kind, function (x) { return PW_KIND.some(function (k) { return k[0] === x; }); }),
      fit: pwFitNorm(a.fit, pwPlans()),
      avoid: list(a.avoid, function (x) { return PW_AVOID[x]; }),
      ing: list(a.ing, function (x) { return typeof x === 'string' && !!(window.PANTRY || {})[x]; }),
      rec: [0, 2, 4].indexOf(a.rec) >= 0 ? a.rec : 0,
      lo: [0, 1, 2].indexOf(a.lo) >= 0 ? a.lo : 0,
      /* What is on hand and what the storehouse gives are free. Whether the
         storehouse is part of it at all is Plan's step 1 now, not a
         question here. */
      shelf: true
    };
  }
  function pwSave(a) {
    a.wk = window.Store.activeWeek().id;
    try { localStorage.setItem(PW_KEY, JSON.stringify(a)); } catch (e) { /* private */ }
  }
  function pwMins(r) {
    var t = String(r.time || ''), h = t.match(/(\d+(?:\.\d+)?)\s*hr/), m = t.match(/(\d+)\s*min/);
    var v = (h ? Number(h[1]) * 60 : 0) + (m ? Number(m[1]) : 0);
    return v || 60;
  }
  function pwIsDinner(r) {
    if (PW_SECS.indexOf(r.book + '-' + r.secNum) >= 0) return true;
    return r.book === 2 && r.secNum === 7 && !(r.makes || []).length && !!r.macro && r.macro.kcal >= 350;
  }
  function pwAvoids(r, avoid, ing) {
    if ((ing || []).length && (r.ingp || []).some(function (it) { return ing.indexOf(it.k) >= 0; })) return true;
    return avoid.some(function (w) {
      var rule = PW_AVOID[w];
      return rule.n.test(r.name) || (r.ingp || []).some(function (it) { return rule.k.indexOf(it.k) >= 0; });
    });
  }
  function pwX(r, ppl) {
    var n = Number(r.servN) || 4;
    return Math.max(1, Math.round((ppl / n) * 2) / 2);
  }
  /* What a set of recipes costs to buy: grams of every line, times its
     price, skipping what is on the shelf when the shelf counts. */
  function pwPrice(k) { var d = (window.PANTRY || {})[k]; return d && d.usd !== undefined ? d.usd : null; }
  function pwBuys(it, shelf) {
    if (!it || !it.k || it.k === 'water' || it.k === 'free' || it.o) return false;
    return shelf ? itemNeedsBuying(it) : true;
  }
  function pwCost(entries, shelf) {
    var usd = 0;
    entries.forEach(function (e) {
      if (e.lo) return;                 // eaten again, not bought again
      (e.r.ingp || []).forEach(function (it) {
        var p = pwBuys(it, shelf) ? pwPrice(it.k) : null;
        if (p) usd += it.g * e.x * p / 100;
      });
    });
    return usd;
  }
  function pwMain(r) {
    var best = '', g = 0;
    (r.ingp || []).forEach(function (it) {
      var c = ((window.PANTRY || {})[it.k] || {}).c;
      if ((c === 'Meat' || c === 'Canned meats') && it.g > g) { g = it.g; best = it.k; }
    });
    return best;
  }
  /* A dinner's share of a day on the Nourish plan, per serving: dinner's
     share of the calories at most, and at least its share of the protein.
     Nothing set in Nourish, and a plain 600 calories and 35 g.
   *
     It was a flat third of the day, which is no meal Nourish has: Plan's
     sheet said "Your plate: 1.6 servings · 771 cal" of a dinner that Fill,
     sharing the day by the meals' own weights, put on the plate at 1½ and
     723. So the share is dinner's weight among the meals (mSlotW), the one
     Fill shares by — of the plan's base targets, not the day's training or
     rest-day ones, because these are the numbers a household shares and
     they should not move every morning. */
  function pwFitCaps() {
    var t = mReadTargets(), kc = t.p * 4 + t.c * 4 + t.f * 9;
    if (!kc) return { kc: 600, p: 35 };
    var sh = pwDinnerShare();
    return { kc: Math.round(kc * sh / 25) * 25, p: Math.round(t.p * sh / 5) * 5 };
  }
  // dinner's fraction of the day: the slot keyed d, else the first of dinner's kind
  function pwDinnerShare() {
    var list = mReadSlots().list, din = null, sum = 0;
    list.forEach(function (s) {
      sum += mSlotW(s);
      if (!din && s.k === 'd') din = s;
    });
    if (!din) list.forEach(function (s) { if (!din && s.t === 'd') din = s; });
    return din && sum > 0 ? mSlotW(din) / sum : 1 / 3;
  }
  /* Whose plans a dinner can be held to. Blake: "Fits my Nourish plan is
     applicable to me right now, but what if my wife has a different plan?"
     So: this phone's own, first, and then everybody in the household who
     shares a dinner's numbers from Sync & sharing (Store.diners), by name.
   *
     Mine always comes from this phone's own targets, never back from the
     household, so my own entry there is left out of the others. "Mine" is
     the account signed in, or, signed out, the account whose day is on this
     device (mOwner) — the targets here are that person's. With neither,
     everybody sharing is somebody else. */
  function pwPlans() {
    var mine = pwFitCaps(), me = (mAccount() || {}).uid || mOwner();
    var d = window.Store.diners ? window.Store.diners() : {};
    var others = Object.keys(d).filter(function (uid) { return uid !== me; }).map(function (uid) {
      return { k: 'u:' + uid, n: d[uid].n, kc: d[uid].kc, p: d[uid].p, nth: '' };
    }).sort(function (x, y) { return x.n < y.n ? -1 : x.n > y.n ? 1 : x.k < y.k ? -1 : 1; });
    /* Two people sharing under one name made two chips that both said
       "Hits Blake’s plan", with no telling which was which. The second of a
       name (in account order, so it is the same one every time) is (2), and
       so on; my own name, shared, is the first of it. */
    var seen = Object.create(null);
    if (me && d[me]) seen[d[me].n] = 1;
    others.forEach(function (o) { var c = seen[o.n] = (seen[o.n] || 0) + 1; if (c > 1) o.nth = ' (' + c + ')'; });
    return [{ k: 1, n: '', kc: mine.kc, p: mine.p, nth: '' }].concat(others);
  }
  /* An answer, as the plans stand now: 1 hits mine, 'u:' and an account
     hits that person's, 3 everybody's, 2 high protein. Saved as true or
     false, it was the first. Somebody who has stopped sharing is Don't mind
     again, and everybody's with nobody else sharing is simply mine. */
  function pwFitNorm(v, plans) {
    if (v === true || v === 1) return 1;
    if (v === 2) return 2;
    if (v === 3) return plans.length > 1 ? 3 : 1;
    if (typeof v === 'string' && plans.some(function (pl) { return pl.k === v; })) return v;
    return 0;
  }
  /* The share an answer holds a dinner to. Everybody's is the strictest of
     them, the most protein for the calories: a dinner that meets it meets
     every other plan's too. */
  function pwCapFor(mode, plans) {
    if (mode === 3) return plans.reduce(function (b, pl) { return pl.p / pl.kc > b.p / b.kc ? pl : b; });
    return plans.filter(function (pl) { return pl.k === mode; })[0] || plans[0];
  }
  /* Whether a dinner meets that share, judged on protein for its calories,
     because a plate can be more or less than one serving. Held to a single
     serving, a 210 g day let nothing in: the best dinner in the books is 69 g
     a serving, and Blake "toggled on that selector and nothing was
     presented". A plan's answer (mine, theirs, everybody's): a plate within
     the dinner's calories reaches its protein. 2, High protein: at least 40%
     of the calories are protein, and Fill my day tops up the rest. */
  var PW_HIGH_P = 0.40;
  function pwFits(r, mode, cap) {
    if (!mode) return true;
    var m = r.macro;
    if (!m || !(m.kcal > 0)) return false;
    return mode === 2 ? 4 * (m.p || 0) / m.kcal >= PW_HIGH_P : (m.p || 0) / m.kcal >= cap.p / cap.kc;
  }
  /* The plate that meets it: enough for the protein, or the dinner's
     calories, whichever comes first, to a quarter of a serving — the step
     Nourish's own plate takes. It was a tenth, and "1.6 servings" is an
     amount the dial on the day cannot show; the plate said one thing here
     and another the moment it reached the day. */
  function pwPlate(r, cap) {
    var m = r.macro;
    if (!m || !(m.kcal > 0) || !(m.p > 0)) return null;
    var x0 = Math.min(cap.p / m.p, cap.kc / m.kcal), x = Math.ceil(x0 * 4 - 1e-9) / 4;
    if (x * m.kcal > cap.kc * 1.02) x = Math.floor(x0 * 4 + 1e-9) / 4;
    x = Math.round(Math.max(0.5, x) * 4) / 4;
    // and said in the plate's own words, "1 ¾ servings", as the day says it
    return { x: x, kc: Math.round(x * m.kcal), p: Math.round(x * m.p), say: mPortion(r, x).head };
  }
  /* What was eaten or planned in the last few weeks: the dated Nourish days,
     and what this sheet has put on nights before. */
  var PW_HIST = 'sh.pwHist';
  function pwHist() {
    try { var h = JSON.parse(localStorage.getItem(PW_HIST)); return h && typeof h === 'object' ? h : {}; }
    catch (e) { return {}; }
  }
  function pwRecent(weeks) {
    var out = {};
    if (!weeks) return out;
    var cut = new Date(); cut.setDate(cut.getDate() - weeks * 7);
    var cutK = dayKey(cut), h = pwHist();
    Object.keys(h).forEach(function (id) { if (h[id] >= cutK) out[id] = 1; });
    Object.keys(MDAYS).forEach(function (k) {
      if (k < cutK) return;
      var day = MDAYS[k] || {};
      Object.keys(day).forEach(function (sk) {
        if (Array.isArray(day[sk])) day[sk].forEach(function (it) { if (it && it.id !== undefined) out[String(it.id)] = 1; });
      });
    });
    return out;
  }
  /* weekend lifts the weeknight time limit; skip leaves one question out,
     so a chip can say how many dinners it would let in. */
  function pwPool(a, weekend, skip) {
    var fit = skip === 'fit' ? 0 : a.fit, cap = fit ? pwCapFor(fit, pwPlans()) : null, recent = pwRecent(a.rec);
    return RECIPES.filter(function (r) {
      if (!pwIsDinner(r)) return false;
      if (!weekend && a.t && pwMins(r) > a.t) return false;
      if (skip !== 'prot' && a.prot.length && a.prot.indexOf(pwProt(r)) < 0) return false;
      if (skip !== 'kind' && a.kind.length && a.kind.indexOf(pwKind(r)) < 0) return false;
      if (!pwFits(r, fit, cap)) return false;
      if (recent[String(r.id)]) return false;
      if (window.Store.rating(r.id) === -1) return false;     // "not again"
      if (!modeAllows(r)) return false;                        // storehouse only
      return !pwAvoids(r, a.avoid, a.ing);
    });
  }
  /* One more dinner for a week that already has `picks`: cheap, sharing
     what the week already buys, not the same meat three nights running, and
     a little chance so two runs are two weeks. Anything that would carry the
     week past the budget is passed over while something else fits. */
  /* `week` is the dinners already on the week, outside the sheet's picks:
     not picked again, their shared foods and meats counted, their cost in
     the budget, which is for the week. */
  function pwNext(a, newPicks, not, day, week) {
    var picks = newPicks.concat(week || []);
    var pool = pwPool(a, PW_WEEKEND.indexOf(day) >= 0).filter(function (r) {
      return not.indexOf(r.id) < 0 && !picks.some(function (e) { return e.r.id === r.id; });
    });
    if (!pool.length) return null;
    var have = {}, mains = {};
    picks.forEach(function (e) {
      (e.r.ingp || []).forEach(function (it) { if (pwBuys(it, a.shelf) && pwPrice(it.k)) have[it.k] = 1; });
      var m = pwMain(e.r); if (m) mains[m] = (mains[m] || 0) + 1;
    });
    var base = pwCost(picks, a.shelf);
    var scored = pool.map(function (r) {
      var x = pwX(r, a.ppl), inc = pwCost([{ r: r, x: x }], a.shelf), shared = 0;
      (r.ingp || []).forEach(function (it) { if (have[it.k]) shared++; });
      var m = pwMain(r), same = m ? (mains[m] || 0) : 0;
      /* Cook from what you have: the share of it already on hand. And the
         household's say: a favourite comes back often, a good one a little. */
      var hv = 0, hn = 0;
      (r.ingp || []).forEach(function (it) {
        if (!it.k || it.k === 'water' || it.k === 'free' || it.o) return;
        hn++; if (!itemNeedsBuying(it)) hv++;
      });
      var rt = window.Store.rating(r.id), liked = rt === 2 ? 2 : rt === 1 ? 0.8 : 0;
      return { r: r, x: x, inc: inc,
        fits: base + inc <= a.bud * (picks.length + 1) / Math.max(1, a.days.length, picks.length + 1) + 0.01,
        score: inc - shared * 0.8 + same * same * 3 - (hn ? hv / hn : 0) * 3 - liked + Math.random() * 2.5 };
    });
    var ok = scored.filter(function (c) { return c.fits; });
    var from = ok.length ? ok : scored.slice().sort(function (p, q) { return p.inc - q.inc; }).slice(0, 5);
    from.sort(function (p, q) { return p.score - q.score; });
    return { r: from[0].r, x: from[0].x };
  }
  /* The nights asked for that have no dinner yet, Monday first. */
  function pwNights(days) {
    return PW_DAYS.filter(function (d) {
      return (!days || days.indexOf(d) >= 0) && !calPastDay(d) &&
        !window.Store.day(d).some(function (e) { return BY_ID[e.id] && pwIsDinner(BY_ID[e.id]); });
    });
  }
  /* The dinners already planned on the week, cooked ones only. */
  function pwWeekDinners() {
    var out = [];
    PW_DAYS.forEach(function (d) {
      window.Store.day(d).forEach(function (e) {
        var r = BY_ID[e.id];
        if (r && pwIsDinner(r) && !e.lo) out.push({ r: r, x: e.x });
      });
    });
    return out;
  }
  /* Which asked-for nights are the night before's dinner again: the nights
     that follow another asked-for night, the weekend's big cook first. */
  function pwLoNights(a, nights) {
    var lo = {}, left = a.lo;
    var pairs = nights.filter(function (d) {
      var nxt = PW_DAYS[(PW_DAYS.indexOf(d) + 1) % 7];
      return nights.indexOf(nxt) >= 0;
    });
    pairs.sort(function (x, y) { return (PW_WEEKEND.indexOf(y) >= 0) - (PW_WEEKEND.indexOf(x) >= 0); });
    pairs.forEach(function (d) {
      var nxt = PW_DAYS[(PW_DAYS.indexOf(d) + 1) % 7];
      if (left > 0 && !lo[d] && !lo[nxt]) { lo[nxt] = d; left--; }
    });
    return lo;
  }
  /* A leftovers night, the one rule for it: the dinner the night before is
     cooked double, and the next night is the same dish, nothing to cook.
     Plan my week's picks and a day's "Cook double" both come through here. */
  function pwLeftovers(cooked, nxt) {
    cooked.x *= 2;
    return { r: cooked.r, x: 1, day: nxt, lo: true };
  }
  function pwPick(mine) {
    var a = S.pw.a, picks = [], nights = pwNights(a.days), week = pwWeekDinners();
    var lo = pwLoNights(a, nights);
    // the ones ticked on the list, in the order ticked, and not already on the week
    var wanted = (S.pw.want || []).map(function (id) { return BY_ID[id]; }).filter(function (r) {
      return r && !week.some(function (e) { return e.r.id === r.id; });
    });
    S.pw.used = 0;
    for (var i = 0; i < nights.length; i++) {
      if (lo[nights[i]]) {
        var from = picks.filter(function (e) { return e.day === lo[nights[i]]; })[0];
        if (from) picks.push(pwLeftovers(from, nights[i]));
        continue;
      }
      if (wanted.length) {
        var w = wanted.shift();
        picks.push({ r: w, x: pwX(w, a.ppl), day: nights[i] });
        S.pw.used++;
        continue;
      }
      if (mine) continue;
      var nx = pwNext(a, picks.filter(function (e) { return !e.lo; }), [], nights[i], week);
      if (nx) picks.push({ r: nx.r, x: nx.x, day: nights[i] });
    }
    S.pw.picks = picks;
    S.pw.seen = {};
  }
  function pwMoney(v) { return v < 0.5 ? '$0' : '$' + (v < 10 ? v.toFixed(2) : Math.round(v)); }
  /* A third item on an option is how many dinners it holds, said small. */
  // each row of chips named for a reader, as the question above it names it
  var PW_QN = { days: 'Which nights', ppl: 'How many are eating', prot: 'Protein', kind: 'Kind of night', t: 'Time on a weeknight',
    fit: 'Fits my Nourish plan', avoid: 'Leave out', lo: 'Leftovers nights', rec: 'Variety' };
  function pwChips(q, opts, cur, cls) {
    return '<div class="pw-chips" role="group"' + (PW_QN[q] ? ' aria-label="' + PW_QN[q] + '"' : '') + '>' + opts.map(function (o) {
      var on = Array.isArray(cur) ? cur.indexOf(o[0]) >= 0 : cur === o[0];
      // o[3]: a choice that has gone (a night already past), shown but not for taking
      return '<button class="pw-chip' + (cls ? ' ' + cls : '') + (o[3] ? ' pw-gone' : '') + '" data-pwq="' + q + '" data-pwv="' + esc(String(o[0])) + '" aria-pressed="' + on + '"' + (o[3] ? ' disabled' : '') + '>' + o[1] +
        (o[2] !== undefined ? ' <i>' + o[2] + '</i>' : '') + '</button>';
    }).join('') + '</div>';
  }
  function pwIngName(k) { var d = (window.PANTRY || {})[k]; return d && d.l ? d.l : String(k).replace(/_/g, ' '); }
  /* Every ingredient any dinner uses, for the leave-out search. */
  function pwIngKeys() {
    var seen = {};
    RECIPES.forEach(function (r) {
      if (pwIsDinner(r)) (r.ingp || []).forEach(function (it) { if (it.k && it.k !== 'water' && it.k !== 'free' && it.k !== 'salt') seen[it.k] = (seen[it.k] || 0) + 1; });
    });
    return seen;
  }
  function pwSugHTML(q) {
    var a = S.pw.a, all = pwIngKeys();
    q = String(q || '').trim().toLowerCase();
    if (!q) return '';
    return Object.keys(all).filter(function (k) {
      return a.ing.indexOf(k) < 0 && pwIngName(k).toLowerCase().indexOf(q) >= 0;
    }).sort(function (x, y) { return all[y] - all[x]; }).slice(0, 6).map(function (k) {
      return '<button class="pw-chip" data-pwing="' + esc(k) + '">' + esc(pwIngName(k)) + ' <i>' + all[k] + '</i></button>';
    }).join('');
  }
  /* The count the bar shows: dinners that fit every answer on a weeknight
     (a weekend-only week is held to no time limit), against the nights
     still to fill. */
  function pwCount(a) {
    var wk = a.days.some(function (d) { return PW_WEEKEND.indexOf(d) < 0; });
    /* Different dinners needed: the leftovers nights are the night before's again. */
    var nights = pwNights(a.days);
    return { n: pwPool(a, !wk).length, need: nights.length - Object.keys(pwLoNights(a, nights)).length };
  }
  /* Everything but the nights, said once, the way you would say it: "4
     eating · up to $50 · 45 min on weeknights · any protein…". Change opens
     the questions that say it. */
  function pwUsualSay(a, plans) {
    var kinds = a.kind.map(function (k) { return (PW_KIND.filter(function (x) { return x[0] === k; })[0] || [k, '', k])[2].toLowerCase(); });
    var fit = a.fit === 1 ? 'hits my plan' : a.fit === 2 ? 'high protein' : a.fit === 3 ? (plans.length > 2 ? 'hits everyone\u2019s plan' : 'hits both plans')
      : typeof a.fit === 'string' ? 'hits ' + esc((plans.filter(function (pl) { return pl.k === a.fit; })[0] || {}).n || 'their') + '\u2019s plan' : '';
    var out = a.ing.map(function (k) { return pwIngName(k).toLowerCase(); }).concat(a.avoid.map(function (k) { return k.toLowerCase(); }));
    return [(a.ppl === 8 ? '8+' : a.ppl) + ' eating', 'up to $' + a.bud,
      a.t ? a.t + ' min on weeknights' : 'any time',
      a.prot.length ? a.prot.join(' or ').toLowerCase() : 'any protein',
      kinds.length ? kinds.join(' or ') : 'any kind of night',
      fit, out.length ? 'no ' + out.map(esc).join(', no ') : '',
      a.lo ? a.lo + (a.lo === 1 ? ' leftovers night' : ' leftovers nights') : '',
      a.rec ? 'nothing from the last ' + a.rec + ' weeks' : 'repeats are fine'].filter(Boolean).join(' \u00b7 ');
  }
  function pwStep1(a) {
    var cnt = pwCount(a), plans = pwPlans(), fit = plans[0], others = plans.slice(1);
    var byProt = {}, byKind = {};
    pwPool(a, false, 'prot').forEach(function (r) { var k = pwProt(r); byProt[k] = (byProt[k] || 0) + 1; });
    pwPool(a, false, 'kind').forEach(function (r) { var k = pwKind(r); byKind[k] = (byKind[k] || 0) + 1; });
    /* One chip a plan, everybody's once somebody else shares, then High
       protein; each with how many dinners it lets in. */
    var modes = [1].concat(others.map(function (o) { return o.k; }), others.length ? [3] : [], [2]);
    var byFit = {}, caps = {};
    modes.forEach(function (m) { byFit[m] = 0; caps[m] = pwCapFor(m, plans); });
    pwPool(a, false, 'fit').forEach(function (r) {
      modes.forEach(function (m) { if (pwFits(r, m, caps[m])) byFit[m]++; });
    });
    /* No plan in Nourish yet, and the chip said "Hits my plan" of a plan
       nobody had made: it is the plain 600 and 35 of pwFitCaps, and says so. */
    var noPlan = !kcalOf(mReadTargets());
    var fitChips = [[0, 'Don’t mind'], [1, noPlan ? 'Hits ' + fit.p + ' g in ' + fit.kc + ' cal' : 'Hits my plan', byFit[1]]].concat(
      others.map(function (o) { return [o.k, 'Hits ' + esc(o.n) + '’s plan' + o.nth, byFit[o.k]]; }),
      others.length ? [[3, others.length > 1 ? 'Hits everyone’s' : 'Hits both', byFit[3]]] : [],
      [[2, 'High protein', byFit[2]]]);
    // whose shares they are, said small; mine alone needs no name
    var shares = others.length ? plans.map(function (pl, i) {
      return (i ? esc(pl.n) + pl.nth : 'You') + ' ' + pl.kc + ' cal · ' + pl.p + ' g';
    }).join(' · ') : noPlan ? 'no plan yet — set your numbers in Nourish; a plain ' + fit.kc + ' cal · ' + fit.p + ' g protein a dinner until then'
      : fit.kc + ' cal · ' + fit.p + ' g protein a dinner';
    var low = cnt.n < cnt.need * 2, none = cnt.n < cnt.need || !cnt.need;
    /* The nights first, because they are the one answer that is different
       every week: the presets, then the week as one strip a calendar's way,
       S M T W Th F S, with a leftovers night hatched (Blake, 2026-10-12:
       "Shorten the days to S M T W Th F S... add some pills like m-w-f w/
       leftovers"). The rest is the usual, in one line, once there is one. */
    var nights = pwNights(a.days), lo = pwLoNights(a, nights), fs = pwForSay(a);
    var sorted = a.days.slice().sort().join();
    /* One preset lit at most: late in the week two can come to the same
       nights (on a Saturday, Whole week and Weekend are both just Saturday),
       and the narrower one is what was meant. */
    var preOn = PW_PRESETS.filter(function (pr) {
      var ds = pwPreDays(pr);
      return ds.length && ds.slice().sort().join() === sorted && (a.lo || 0) === pr[3];
    }).sort(function (x, y) { return x[2].length - y[2].length; })[0];
    var preHTML = '<div class="pw-chips pw-pre" role="group" aria-label="Quick picks">' + PW_PRESETS.map(function (pr) {
      return '<button class="pw-chip" data-pwpre="' + pr[0] + '" aria-pressed="' + (pr === preOn) + '"' + (pwPreDays(pr).length ? '' : ' disabled') + '>' + pr[1] + '</button>';
    }).join('') + '</div>';
    var stripHTML = '<div class="pw-days" role="group" aria-label="Which nights">' + CAL_DAYS.map(function (d) {
      var gone = calPastDay(d[0]), on = a.days.indexOf(d[0]) >= 0, isLo = !!lo[d[0]], has = on && !gone && nights.indexOf(d[0]) < 0;
      return '<button class="pw-chip pw-day' + (isLo ? ' lo' : '') + (has ? ' has' : '') + (gone ? ' pw-gone' : '') + '" data-pwq="days" data-pwv="' + d[0] + '" aria-pressed="' + on + '"' +
        ' aria-label="' + d[1] + (isLo ? ', leftovers' : has ? ', has a dinner' : '') + '"' + (gone ? ' disabled' : '') + '>' + PW_LETTER[d[0]] + '</button>';
    }).join('') + '</div>';
    var los = PW_DAYS.filter(function (d) { return lo[d]; });
    var loHTML = los.length ? '<p class="pw-lokey">\u21ba ' + pwDaysSay(los).replace(' & ', ' and ') + (los.length === 1 ? ' is' : ' are') + ' leftovers: ' +
      los.map(function (d) { return DAYS.filter(function (x) { return x[0] === lo[d]; })[0][2] + '\u2019s'; }).join(' and ') +
      (los.length === 1 ? ' dinner' : ' dinners') + ', cooked double.</p>' : '';
    var usualHTML = '<div class="pw-q pw-usual"><div class="pw-ql">Your usual <button class="nut-ask" data-pwmore="1" aria-expanded="false">Change</button></div>' +
      '<p>' + pwUsualSay(a, plans) + '</p></div>';
    var cntHTML = !cnt.need ? '<b>0</b> nights to fill<span>' + (!a.days.length ? 'pick a night above' : a.days.every(calPastDay) ? 'those nights have gone'
        : pwDaysSay(fs.full) + (fs.full.length === 1 ? ' already has a dinner' : ' already have dinners')) + '</span>'
      : '<b>' + cnt.n + '</b> ' + (cnt.n === 1 ? 'dinner fits' : 'dinners fit') + '<span>' +
        (cnt.n < cnt.need ? 'need ' + cnt.need + ', loosen a filter' : fs.say + (low ? ' \u00b7 not many to choose from' : fs.fullSay ? ' \u00b7 ' + fs.fullSay : '')) + '</span>';
    var rest = !S.pw.more ? usualHTML :
      '<div class="pw-q"><div class="pw-ql">How many are eating?</div>' + pwChips('ppl', [[2, '2'], [3, '3'], [4, '4'], [6, '6'], [8, '8+']], a.ppl) + '</div>' +
      '<div class="pw-q"><div class="pw-ql">Spend no more than</div><div class="pw-money">' +
        '<input type="range" id="pwBud" min="20" max="150" step="5" value="' + a.bud + '" aria-label="Budget in dollars">' +
        '<b id="pwBudV">$' + a.bud + '</b></div></div>' +
      '<div class="pw-q"><div class="pw-ql">Protein <small>any you pick</small></div>' +
        pwChips('prot', PW_PROT.map(function (k) { return [k, k, byProt[k] || 0]; }), a.prot) + '</div>' +
      '<div class="pw-q"><div class="pw-ql">Kind of night <small>any you pick</small></div>' +
        pwChips('kind', PW_KIND.map(function (k) { return [k[0], k[2], byKind[k[0]] || 0]; }), a.kind) + '</div>' +
      '<div class="pw-q"><div class="pw-ql">Time on a weeknight <small>Sat and Sun can take longer</small></div>' +
        pwChips('t', [[20, '20 min'], [30, '30 min'], [45, '45 min'], [0, 'Anything']], a.t) + '</div>' +
      '<div class="pw-q"><div class="pw-ql">Fits my Nourish plan <small>' + shares + '</small></div>' +
        pwChips('fit', fitChips, a.fit) + '</div>' +
      '<div class="pw-q"><div class="pw-ql">Leave out</div>' +
        pwChips('avoid', Object.keys(PW_AVOID).map(function (k) { return [k, k]; }), a.avoid, 'pw-x') +
        (a.ing.length ? '<div class="pw-chips pw-ings">' + a.ing.map(function (k) {
          return '<button class="pw-chip pw-x" aria-pressed="true" data-pwingx="' + esc(k) + '" aria-label="Stop leaving out ' + esc(pwIngName(k)) + '">' + esc(pwIngName(k)) + ' ✕</button>';
        }).join('') + '</div>' : '') +
        '<input class="pw-find" id="pwIng" type="search" placeholder="Any ingredient: onion, cheddar…" autocomplete="off" aria-label="Leave out an ingredient">' +
        '<div class="pw-chips pw-sug" id="pwSug"></div></div>' +
      '<div class="pw-q"><div class="pw-ql">Leftovers nights <small>cook double, eat it again the next night</small></div>' +
        pwChips('lo', [[0, 'None'], [1, 'One'], [2, 'Two']], a.lo) + '</div>' +
      '<div class="pw-q"><div class="pw-ql">Variety</div>' +
        pwChips('rec', [[0, 'Repeats are fine'], [2, 'Nothing from the last 2 weeks'], [4, 'Last 4 weeks']], a.rec) + '</div>';
    return '<h2 class="pw-h">Which nights?</h2>' +
      '<div class="pw-q pw-nights">' + preHTML + stripHTML + loHTML + '</div>' + rest +

      /* The count is a door: "See the 11" lists the dinners that fit, to
         tick the ones wanted. Blake, after a pick he could not see: "it just
         auto put some stuff there and didn't let me see the 11 that it
         selected". */
      /* Pick my dinners is picking: it opens the dinners that fit, to tick
         one a night. Blake: "I expect that when I click pick my dinners it
         would give me a selection to pick my dinners." */
      '<div class="pw-bar"><div class="pw-cnt' + (low && cnt.need ? ' low' : '') + '" role="status">' + cntHTML +
        '</div><button class="pw-go" data-pwsee="1"' + (none ? ' disabled' : '') + '>Pick my dinners</button></div>';
  }
  /* The dinners that fit, to tick the ones wanted. Pick my dinners puts the
     ticked ones on first, in the order ticked, and fills the nights left
     from the rest by its own rules. */
  function pwSeeHTML() {
    var a = S.pw.a, cnt = pwCount(a), want = S.pw.want;
    var wk = a.days.some(function (d) { return PW_WEEKEND.indexOf(d) < 0; });
    var pool = pwPool(a, !wk).slice().sort(function (x, y) { return x.name.localeCompare(y.name); });
    var left = Math.max(0, cnt.need - want.length);
    return '<button class="nut-ask pw-toq" data-pwback="1">\u2039 Back to the questions</button>' +
      '<h2 class="pw-h">The ' + (pool.length === 1 ? 'one' : pool.length) + ' that fit</h2>' +
      '<p class="pw-note pw-lede">Tick the ones you want this week. Tap a name to see the recipe.</p>' +
      '<div class="pw-fits">' + pool.map(function (r) {
        var on = want.indexOf(r.id) >= 0, m = r.macro || {}, full = !on && want.length >= cnt.need;
        return '<div class="pw-fit' + (full ? ' full' : '') + '" style="--pc:' + PROT_VAR[pwProt(r)] + '">' +
          '<button class="pw-want" data-pwwant="' + esc(String(r.id)) + '" aria-pressed="' + on + '"' + (full ? ' disabled' : '') + ' aria-label="Want ' + esc(r.name) + '"></button>' +
          '<button class="pw-fn" data-pwopen="' + esc(String(r.id)) + '"><b>' + esc(r.name) + '</b><span>' +
            esc([r.time || '', m.kcal ? Math.round(m.kcal) + ' cal' : '', m.p ? Math.round(m.p) + ' g protein' : ''].filter(Boolean).join(' \u00b7 ')) +
          '</span></button><i aria-hidden="true">\u203a</i></div>';
      }).join('') + '</div>' +
      '<p class="pw-note pw-tickl">' + (!want.length ? 'One a night: ' + cnt.need + (cnt.need === 1 ? ' night' : ' nights') + ' to fill.'
        : !left ? 'That\u2019s every night. They go on in the order you ticked them.'
        : left + (left === 1 ? ' night' : ' nights') + ' still open.') + '</p>' +
      '<div class="pw-or"><button class="nut-ask" data-pwpick="all">' +
        (want.length && left ? 'Add mine, and pick the other ' + (left === 1 ? 'night' : left) + ' for me' : 'Or pick them all for me') + '</button></div>' +
      '<div class="pw-bar"><div class="pw-cnt"><b>' + want.length + '</b> ticked<span>' + pwForSay(a).say + '</span></div>' +
        '<button class="pw-go" data-pwpick="mine"' + (want.length ? '' : ' disabled') + '>' +
          (want.length ? 'Add ' + want.length + ' to my week' : 'Tick the ones you want') + '</button></div>';
  }
  /* With a Nourish answer, each dinner says the plate that meets it, for
     whoever the answer is about: mine for mine, theirs for theirs, and
     everybody's for everybody's. High protein is about nobody in
     particular, so it shows mine, or everybody's once anybody else shares. */
  function pwPlateHTML(r, mode, plans) {
    if (!mode) return '';
    var show = mode === 3 || (mode === 2 && plans.length > 1) ? plans
      : plans.filter(function (pl) { return pl.k === (mode === 2 ? 1 : mode); });
    return show.map(function (pl) {
      var x = pwPlate(r, pl);
      return x ? '<div class="pw-mm pw-plate">' + (pl.k === 1 ? 'Your' : esc(pl.n) + '’s') + ' plate' + pl.nth + ': ' + esc(x.say) +
        ' · ' + x.kc + ' cal · ' + x.p + ' g protein</div>' : '';
    }).join('');
  }
  /* One page: the answers, and one button. The dinners it picks land on
     the week itself, where every one of them can be opened, swapped or taken
     off like any other — Blake: "I don't like having two separate engines."
     The old second and third pages (the picks, their list) were that second
     engine. */
  function pwHTML() {
    var a = S.pw.a, plans = pwPlans();
    // somebody may have stopped sharing since the sheet opened
    a.fit = pwFitNorm(a.fit, plans);
    var body = S.pw.see ? pwSeeHTML() : pwStep1(a);
    return '<div class="scrim no-print" data-close="1">' +
      '<div class="sheet pw-sheet" role="dialog" aria-modal="true" aria-label="Plan my week">' +
        '<div class="sheet-top"><div class="sheet-eyebrow">Plan my week</div>' +
          '<button class="sheet-x" data-close="1" aria-label="Close">&times;</button></div>' +
        '<div class="pw-body">' + body + '</div></div></div>';
  }
  /* For the tests: the rules without the sheet, so a picker with chance in it
     can be run forty times and held to what it promises every time. */
  window.__pw = { pool: pwPool, next: pwNext, cost: pwCost, avoids: pwAvoids, prot: pwProt, kind: pwKind, fit: pwFitCaps, fits: pwFits, plate: pwPlate, answers: pwAnswers,
    loNights: pwLoNights, plans: pwPlans, capFor: pwCapFor,
    count: pwCount, pick: function (a) { var keep = S.pw; S.pw = { a: a, picks: [], seen: {} }; pwPick(); var out = S.pw.picks; S.pw = keep; return out; } };
  function pwOpen() {
    var a = pwAnswers();
    /* The nights left this week, not the nights remembered from last time:
       on a Saturday, Monday to Friday came up lit, every one of them gone,
       and the bar said those nights already had dinners. */
    var left = PW_DAYS.filter(function (d) { return !calPastDay(d); });
    a.days = a.days.filter(function (d) { return !calPastDay(d); });
    if (!a.days.length && left.length) a.days = left;
    S.pw = { a: a, picks: [], seen: {}, want: [], see: false, more: !a.used };
    S.pwOpen = true;
    pushSheet({ pw: 1 });
    renderModal();
    // the sheet takes the focus, as the recipe sheet does; it was left on the button behind
    var x = document.querySelector('.pw-sheet .sheet-x, .sheet-x[data-close="1"]');
    if (x && x.focus) x.focus();
  }
  document.addEventListener('click', function (e) {
    if (!S.pwOpen || !e.target.closest) return;
    var pre = e.target.closest('[data-pwpre]');
    if (pre) {
      var pr = PW_PRESETS.filter(function (x) { return x[0] === pre.dataset.pwpre; })[0];
      if (pr) { S.pw.a.days = pwPreDays(pr); S.pw.a.lo = pr[3]; pwSave(S.pw.a); renderModal(); }
      return;
    }
    if (e.target.closest('[data-pwmore]')) { S.pw.more = true; renderModal(); return; }
    var q = e.target.closest('[data-pwq]');
    if (q) {
      var a = S.pw.a, k = q.dataset.pwq, v = q.dataset.pwv;
      if (k === 'avoid' || k === 'prot' || k === 'kind' || k === 'days') {
        var at = a[k].indexOf(v);
        if (at >= 0) a[k].splice(at, 1); else a[k].push(v);
        if (k === 'days') a.days.sort(function (x, y) { return PW_DAYS.indexOf(x) - PW_DAYS.indexOf(y); });
      } else if (k === 'fit' && /^u:/.test(v)) a.fit = v;      // somebody else's plan, by account
      else a[k] = Number(v);
      pwSave(a);
      renderModal();
      return;
    }
    var ig = e.target.closest('[data-pwing]') || e.target.closest('[data-pwingx]');
    if (ig) {
      var ia = S.pw.a, ik = ig.dataset.pwing || ig.dataset.pwingx, ii = ia.ing.indexOf(ik);
      if (ig.dataset.pwing && ii < 0) ia.ing.push(ik);
      if (ig.dataset.pwingx && ii >= 0) ia.ing.splice(ii, 1);
      pwSave(ia);
      renderModal();
      if (ig.dataset.pwing && $('pwIng')) $('pwIng').focus();
      return;
    }
    if (e.target.closest('[data-pwsee]')) { S.pw.see = true; renderModal(); var sc = document.querySelector('#modalRoot .scrim'); if (sc) sc.scrollTop = 0; return; }
    if (e.target.closest('[data-pwback]')) { S.pw.see = false; renderModal(); return; }
    var wt = e.target.closest('[data-pwwant]');
    if (wt) {
      var wid = idOf(wt.dataset.pwwant), wi = S.pw.want.indexOf(wid);
      if (wi >= 0) S.pw.want.splice(wi, 1); else if (S.pw.want.length < pwCount(S.pw.a).need) S.pw.want.push(wid);
      renderModal();
      return;
    }
    var po = e.target.closest('[data-pwopen]');
    if (po) { rememberOpener(); openRecipe(idOf(po.dataset.pwopen)); return; }
    var pk = e.target.closest('[data-pwpick]');
    if (pk) {
      pwPick(pk.dataset.pwpick === 'mine');
      if (!S.pw.picks.length) { renderModal(); return; }
      var h = pwHist(), today = todayKey();
      window.Store.batch(function () {
        S.pw.picks.forEach(function (p) { window.Store.addToDay(p.r.id, p.day, p.x, p.lo); h[String(p.r.id)] = today; });
      });
      try { localStorage.setItem(PW_HIST, JSON.stringify(h)); } catch (err) { /* private */ }
      S.pw.a.used = 1;
      pwSave(S.pw.a);
      /* What landed is marked New on the week, and the toast can take it
         all back off again. */
      var added = S.pw.picks.slice(), used = S.pw.used || 0, cooked = added.filter(function (p) { return !p.lo; }).length;
      S.pwNew = {};
      added.forEach(function (p) { S.pwNew[p.day + '|' + p.r.id] = 1; });
      S.pwUndo = added.map(function (p) { return [p.r.id, p.day]; });
      close();
      if (S.view === 'plan') renderPlan();
      /* Picked for you can cost more than the budget asked for, when nothing
         cheaper fits (pwNext falls back to the cheapest): said here, not
         found on the list. */
      var usd = pwCost(added, S.pw.a.shelf), over = usd > S.pw.a.bud + 0.5;
      /* A phone whose storage is full keeps none of this: it said "3
         dinners added" over a week that was empty again on the next open. */
      if (window.Store.storageFull) {
        mToast('<b>Not kept on this phone</b><small>Its storage for the app is full' +
          (window.Store.house ? '; the dinners still go to the shared pantry while there’s signal' : '. Free some space to keep them') + '</small>');
        return;
      }
      mToast('<b>' + cooked + (cooked === 1 ? ' dinner' : ' dinners') + ' added</b>' +
        (used && used < cooked ? '<small>Your ' + used + ', and ' + (cooked - used) + ' picked for you</small>' : !used ? '<small>Picked for you</small>' : '') +
        (over ? '<small>About ' + pwMoney(usd) + ' to buy, over your $' + S.pw.a.bud + '</small>' : ''),
        'pw', 'data-pwundo');
    }
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest || !e.target.closest('[data-pwundo]') || !S.pwUndo) return;
    var undo = S.pwUndo;
    S.pwUndo = null; S.pwNew = {};
    window.Store.batch(function () { undo.forEach(function (u) { window.Store.removeFromDay(u[0], u[1]); }); });
    var el = $('mToast'); if (el) el.hidden = true;
    if (S.view === 'plan') renderPlan();
  });

  // ---------------------------------------------------------------- kitchen
  /* Moving a food: to the kitchen, to the storehouse, or to the shop. Said
     once, it holds for every week after, on every phone in the household. */
  function setFoodSource(k, v) {
    var d = (window.PANTRY || {})[k];
    if (!d) return;
    window.Store.batch(function () {
      if (v === 'h') { window.Store.setKitchen(k, 1); window.Store.setSrc(k, null); return; }
      window.Store.setKitchen(k, d.sp ? 0 : null);
      window.Store.setSrc(k, v);
    });
  }
  document.addEventListener('click', function (e) {
    if (!e.target.closest) return;
    var lm = e.target.closest('[data-listmark]');
    if (lm) { S.listMark = lm.dataset.listmark === '1'; if (S.view === 'list') renderList(); return; }
    var b = e.target.closest('[data-src]');
    if (b) { e.preventDefault(); setFoodSource(b.dataset.src, b.dataset.v); if (S.view === 'list') renderList(); return; }
  });
  document.addEventListener('input', function (e) {
    if (e.target && e.target.id === 'kitFind') {
      S.kitQ = e.target.value;
      var g = $('kitchenBody'); if (g) g.innerHTML = kitGroupsHTML();
    }
  });

  // ------------------------------------------------------------ plan steps
  /* Plan, as the order you think in: where the food comes from, what you
     keep on hand, the week's meals, then getting it. Blake: "There's a
     natural flow to this." The first two are set once and remembered for the
     household; the bar is how you get back to them. */
  var PLAN_STEPS = [['where', 'Where'], ['pantry', 'On hand'], ['plan', 'Meals'], ['list', 'Shop']];
  function planSetUp() { return window.Store.opt('setup', false); }
  /* The four used to be a step bar across the top of Plan. Now the week is
     Plan, the list is one tap below it, and Where and On hand are settings,
     set once from the Sync & sharing sheet; the bar stays hidden. */
  function renderSteps() {
    var bar = $('planSteps');
    if (bar) bar.classList.add('hide');
  }
  function goStep(v) {
    if (v === 'plan' && (S.view === 'pantry' || S.view === 'where')) window.Store.setOpt('setup', true);
    S.view = v;
    try { localStorage.setItem('sh.view', S.view); } catch (e) { /* private mode */ }
    renderView();
    window.scrollTo(0, 0);
  }
  document.addEventListener('click', function (e) {
    if (!e.target.closest) return;
    var st = e.target.closest('.pstep[data-view]') || e.target.closest('[data-stepgo]');
    if (st) { goStep(st.dataset.view || st.dataset.stepgo); return; }
    var sp = e.target.closest('[data-srcpick]');
    if (sp) { setSrcKind(sp.dataset.srcpick); return; }
    var wk = e.target.closest('[data-weekbuy]');
    if (wk) { window.Store.setOpt('buy', wk.dataset.weekbuy === '1'); return; }
    if (e.target.closest('[data-near]')) { window.Store.setOpt('near', !window.Store.opt('near', false)); return; }
    var lw = e.target.closest('[data-low]');
    if (lw) { window.Store.setLow(lw.dataset.low, !window.Store.low(lw.dataset.low)); return; }
    var more = e.target.closest('[data-kitmore]');
    if (more) { S.kitOpen = S.kitOpen || {}; S.kitOpen[more.dataset.kitmore] = !S.kitOpen[more.dataset.kitmore]; renderPantry(); return; }
    var pill = e.target.closest('[data-kitpill]');
    if (pill) {
      var k = pill.dataset.kitpill, d = (window.PANTRY || {})[k];
      if (!d && window.Store.pantryOwn()[k]) { window.Store.removePantryItem(k); return; }
      if (foodSource(k) === 'h') {
        window.Store.batch(function () { window.Store.setKitchen(k, d && d.sp ? 0 : null); window.Store.setSrc(k, null); });
      } else setFoodSource(k, 'h');
      return;
    }
    var cp = e.target.closest('[data-copyorder]');
    if (cp) {
      /* Name, then how much, with something between: the two spans sit
         flush, so their text ran together ("Bell peppers6", "Chicken
         breasts9 ½ lbs") on the bishop's copy. */
      var lines = [].map.call(document.querySelectorAll('.list-group.where-s .list-row'), function (r) {
        var n = r.querySelector('span:not(.qty)'), q = r.querySelector('.qty');
        var name = (n ? n.textContent : r.textContent).replace(/\s+/g, ' ').trim();
        var qty = q ? q.textContent.replace(/\s+/g, ' ').trim() : '';
        return qty ? name + ' — ' + qty : name;
      }).join('\n');
      var say = function (t) { cp.textContent = t; setTimeout(function () { cp.textContent = srcW().copy; }, 1800); };
      var fail = function () { say('Couldn\u2019t copy \u2014 select the list instead'); };
      try { navigator.clipboard.writeText(lines).then(function () { say('Copied'); }, fail); } catch (err) { fail(); }
    }
  });
  /* Where a household's staples come from: the foods that keep, canned, dry
     and frozen. The bishops' storehouse was the only answer once; a food bank,
     a big monthly shop or nothing but your own shelf are the same idea, so the
     list a source carries, the half of the shopping list that comes from it
     and the middle of Have / Storehouse / Buy all work the same for each,
     under its own name. Which one is two more household switches beside
     `store` (on/off, as the rules already allow), so nothing is migrated:
     a household that never chose is the storehouse, as it always was. */
  var SRC_WORDS = {
    sh: { pick: 'The bishops\u2019 storehouse', why: 'Its order list, ready to copy for your bishop.', name: 'Storehouse',
      the: 'the storehouse', your: 'your storehouse', list: 'Storehouse order', copy: 'Copy the order',
      reset: 'Back to the storehouse list?', back: 'back to the book\u2019s list' },
    fb: { pick: 'A food bank or pantry', why: 'What they give, and a store for the rest.', name: 'Food bank',
      the: 'the food bank', your: 'your food bank', list: 'From the food bank', copy: 'Copy the list',
      reset: 'Back to the starting list?', back: 'back to the starting list' },
    big: { pick: 'A big monthly shop', why: 'Stock up once a month, and a quick shop for fresh.', name: 'Big shop',
      the: 'the big shop', your: 'your big shop', list: 'The big shop', copy: 'Copy the list',
      reset: 'Back to the starting list?', back: 'back to the starting list' },
    own: { pick: 'I keep my own', why: 'No outside source. What isn\u2019t on the shelf gets bought.' }
  };
  /* Where the staples come from, set: the one way it is set, from Where and
     from the front door alike. Two household switches beside `store`. */
  function setSrcKind(kind, more) {
    window.Store.batch(function () {
      window.Store.setOpt('store', kind !== 'own');
      window.Store.setOpt('fb', kind === 'fb');
      window.Store.setOpt('big', kind === 'big');
      if (more) more();
    });
  }
  function srcKind() {
    if (!window.Store.opt('store', true)) return 'own';
    return window.Store.opt('fb', false) ? 'fb' : window.Store.opt('big', false) ? 'big' : 'sh';
  }
  /* The words for the source in use; the storehouse's when there is none, so
     a line about the source never reads "undefined" on a shelf-only phone. */
  function srcW() { var k = srcKind(); return SRC_WORDS[k === 'own' ? 'sh' : k]; }
  window.__src = { kind: srcKind, words: srcW };
  /* The answers to "where do your staples come from" and "this week", as the
     three modes the rest of Plan reads: both (a source and a store), sh (only
     what I have, the source's included), w (no source). */
  function planMode() {
    var st = window.Store.opt('store', true), buy = window.Store.opt('buy', true);
    return st && buy ? 'both' : st ? 'sh' : 'w';
  }
  function canBuy() { return window.Store.opt('buy', true) || window.Store.opt('near', false); }
  /* How many things a recipe needs from a store, the storehouse and the
     shelf aside. Storehouse only, a dinner that needs any (or, allowed,
     more than two) is not suggested. */
  function storeNeeds(r) {
    var n = 0, seen = {};
    (r.ingp || []).forEach(function (it) {
      if (!it.k || it.k === 'water' || it.k === 'free' || it.o || seen[it.k]) return;
      seen[it.k] = 1;
      if (itemNeedsBuying(it)) n++;
    });
    return n;
  }
  function modeAllows(r) {
    if (window.Store.opt('buy', true)) return true;
    return storeNeeds(r) <= (window.Store.opt('near', false) ? 2 : 0);
  }
  window.__mPortion = function (r, x) { return mPortion(r, x); };
  window.__flow = { needs: storeNeeds, mode: planMode, source: foodSource };
  function renderWhere() {
    var kind = srcKind(), W = srcW(), buy = window.Store.opt('buy', true), near = window.Store.opt('near', false);
    var opt = function (attr, v, on, t, d) {
      return '<button class="wh-opt" ' + attr + '="' + v + '" aria-pressed="' + on + '"><span class="wh-dot"></span>' +
        '<span><b>' + t + '</b><span>' + d + '</span></span></button>';
    };
    /* The step's question is the view's title here — Where has no title bar
       of its own the way Plan, List and Pantry do — so it is the h1. */
    $('whereBody').innerHTML = '<div class="step-k">Settings \u00b7 your kitchen</div>' +
      '<h1 class="step-h">Where do your staples come from?</h1>' +
      '<p class="step-sub">Staples are the foods that keep: canned, dry and frozen. This decides which meals Plan suggests and how your list is split.</p>' +
      ['sh', 'fb', 'big', 'own'].map(function (k) {
        return opt('data-srcpick', k, kind === k, SRC_WORDS[k].pick, SRC_WORDS[k].why);
      }).join('') +
      '<h2 class="step-h2 wh-week">This week</h2>' +
      opt('data-weekbuy', '1', buy, 'Buy what\u2019s missing', kind === 'own'
        ? 'Anything not on my shelf gets bought.' : 'Take what ' + W.the + ' has, buy the rest at Walmart.') +
      opt('data-weekbuy', '0', !buy, 'Only what I have', 'Nothing to buy. Only suggest meals I can make from ' +
        (kind === 'own' ? 'my shelf' : W.the + ' and my shelf') + '.') +
      (!buy ? '<label class="wh-near"><button class="kit-tog" data-near="1" role="switch" aria-checked="' + near + '" aria-label="Allow meals that need one or two things from a store"></button>' +
        ' Allow meals that need 1–2 things from a store</label>' : '') +
      '<p class="step-sub">Shared with your household: set it on one phone and the others follow.</p>' +
      (kind !== 'own' ? carryHTML() : '') +
      '<div class="step-next"><button class="pw-go" data-stepgo="plan">Done</button></div>';
  }

  // ------------------------------------------------------------ walmart cart
  /* The cart itself is src/walmart.js. What stays here is the app's part: an
     item number typed in one of its boxes is checked and kept there, and the
     list or the plan sheet it was typed on is drawn again, the fold left
     open. */
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (!t || !t.dataset) return;
    if (t.dataset.wmid !== undefined) {
      var id = window.Walmart.parse(t.value);
      if (t.value.trim() && !id) { t.setCustomValidity('That is not a Walmart item number or product link'); t.reportValidity(); return; }
      t.setCustomValidity('');
      window.Walmart.setOwn(t.dataset.wmid, id);
    } else return;
    var open = !!(t.closest && t.closest('details[open]'));
    if (S.pwOpen) renderModal(); else if (S.view === 'list') renderList();
    if (open) { var dd = document.querySelectorAll('.wm-fix'); for (var i = 0; i < dd.length; i++) dd[i].open = true; }
  });

  // ----------------------------------------------------------------- macros
  /* An RP-Diet-style day, kept as simple as the idea: targets in grams, four
     meals, tick off what you eat. The picker below suggests a portion of each
     recipe sized to what the day still needs.
   *
   * Everything here is deliberately personal and deliberately local. The keys
   * are read and written in this file rather than through sync.js, because the
   * LS map there is precisely the list of things saveLocal() mirrors into the
   * household document — and a personal cut diary must never ride along into
   * the merge and join paths. sh.units set the precedent for "device-local,
   * app-owned"; these follow it under the bsc. prefix. */

  var S_SYNC_STATE = 'off';
  var mBootTargetsDue = false;

  /* src/daysync.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var DAYSYNC = window.HiveParts.daysync({ S: S, mAccount: mAccount, mFollowScale: mFollowScale, mHealTargets: mHealTargets, mSuspectAccount: mSuspectAccount, mToast: mToast, renderMacros: renderMacros, renderModal: renderModal, LIVE: LIVE });
  function mBootTargets() { return DAYSYNC.mBootTargets(); }
  function mSyncState(next) { return DAYSYNC.mSyncState(next); }
  function mMarkAccountUI() { return DAYSYNC.mMarkAccountUI(); }
  function mSyncAway() { return DAYSYNC.mSyncAway(); }
  function mPut(key, v) { return DAYSYNC.mPut(key, v); }
  function mLsFull() { return DAYSYNC.mLsFull(); }
  function mLsFullSay() { return DAYSYNC.mLsFullSay(); }
  var MSTAMPS = DAYSYNC.MSTAMPS;

  var mClkSent = 0;                    // when the last stamped push left, by the local clock
  /* Whether the question "who is signed in?" can be answered yet. It cannot
     until Firebase has loaded, and Firebase loads asynchronously — so a
     device that IS signed in shows the signed-out sheet for the moment in
     between, which reads as "there is no way to sign out" rather than as
     "wait". Say wait. */
  var mAuthKnown = false;

  /* src/clock.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var CLOCK = window.HiveParts.clock({ MSTAMPS: MSTAMPS, mBuildFoods: mBuildFoods, mPut: mPut, mSyncPush: mSyncPush, LIVE: LIVE });
  function mNow() { return CLOCK.mNow(); }
  function mClockHear(data, pending) { return CLOCK.mClockHear(data, pending); }
  function mStamp(part, sub) { return CLOCK.mStamp(part, sub); }
  function mClaimAll() { return CLOCK.mClaimAll(); }
  function mAccount() { return CLOCK.mAccount(); }
  function mSuspectAccount() { return CLOCK.mSuspectAccount(); }
  function mOwner() { return CLOCK.mOwner(); }
  function mSetOwner(uid) { return CLOCK.mSetOwner(uid); }
  function mForgetDay() { return CLOCK.mForgetDay(); }
  function mAccountMark() { return CLOCK.mAccountMark(); }
  var MCLOCK_SLACK = CLOCK.MCLOCK_SLACK;
  var MCLOCK_ID = CLOCK.MCLOCK_ID;
  // Strengthen stamps by the same corrected clock; it reads MSKEW live through mNow
  if (window.Train && window.Train.clock) window.Train.clock(mNow);

  /* src/mydayparts.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var MYDAYPARTS = window.HiveParts.mydayparts({ mAmClean: mAmClean, mDoneAt: mDoneAt, mDrinksClean: mDrinksClean, mTrainedAt: mTrainedAt, LIVE: LIVE });
  function mSyncKey(k) { return MYDAYPARTS.mSyncKey(k); }
  function mPlainObj(v) { return MYDAYPARTS.mPlainObj(v); }
  function mNum(v) { return MYDAYPARTS.mNum(v); }
  function mSyncUnkey(e) { return MYDAYPARTS.mSyncUnkey(e); }
  function mLsJson(key) { return MYDAYPARTS.mLsJson(key); }
  var MSYNC_SHAPE = MYDAYPARTS.MSYNC_SHAPE;
  var MSYNC_SIMPLE = MYDAYPARTS.MSYNC_SIMPLE;
  var MSYNC_KEYED = MYDAYPARTS.MSYNC_KEYED;

  var mDirty = {}, mDirtyAll = true;
  /* Whether the account has answered since this device started listening.
     Nothing goes up before it has: a device signing in for the first time
     sent everything it had straight away, before it had read a word of the
     account, and what it had was nothing, stamped zero. A write lands
     whatever its stamp says, so the account's targets and profile became
     null on the server, and this device then refused the account's real
     copy, which was no newer than zero. Held until the first answer is
     merged, the whole push carries only what is newer or the same. */
  var mSyncHeard = false;

  /* src/dayup.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var DAYUP = window.HiveParts.dayup({ MCLOCK_SLACK: MCLOCK_SLACK, MSTAMPS: MSTAMPS, MSYNC_KEYED: MSYNC_KEYED, MSYNC_SHAPE: MSYNC_SHAPE, MSYNC_SIMPLE: MSYNC_SIMPLE, mBuildFoods: mBuildFoods, mDrinksClean: mDrinksClean, mLsJson: mLsJson, mNow: mNow, mNum: mNum, mPut: mPut, mSyncKey: mSyncKey, mSyncUnkey: mSyncUnkey, LIVE: LIVE });
  function mSyncPayload(seen) { return DAYUP.mSyncPayload(seen); }
  function mSyncPartial() { return DAYUP.mSyncPartial(); }
  function mSyncTake(seen) { return DAYUP.mSyncTake(seen); }
  function mMergeRemote(md) {
    var moved = DAYUP.mMergeRemote(md);
    if (moved) {
      try { mLogIntake(); } catch (e) {}
      if (S.view === 'train' && window.Train && window.Train.render) window.Train.render();
      if (S.view === 'today' && window.Today && window.Today.render) window.Today.render();
    }
    return moved;
  }

  var mFoldTimer = null;

  /* src/twocopies.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var TWOCOPIES = window.HiveParts.twocopies({ MSYNC_KEYED: MSYNC_KEYED, MSYNC_SIMPLE: MSYNC_SIMPLE, S: S, mLsJson: mLsJson, mMergeRemote: mMergeRemote, mNum: mNum, mPlainObj: mPlainObj, mSyncKey: mSyncKey, renderMacros: renderMacros, LIVE: LIVE });
  function mFoldNow() { return TWOCOPIES.mFoldNow(); }
  function mFoldDue() { return TWOCOPIES.mFoldDue(); }

  window.addEventListener('storage', function (e) {
    if (!e || !e.key || !/^bsc\.(macro|my)/.test(e.key)) return;
    clearTimeout(mFoldTimer);
    mFoldTimer = setTimeout(mFoldNow, 60);
  });

  var mSyncDoc = null, mSyncOff = null, mSyncTimer = null;
  var mAcctHouse;               // undefined until the server has said
  var mHouseTellNext = false;   // a join or create was asked for here: report it once it is real

  /* src/kitchen.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var KITCHEN = window.HiveParts.kitchen({ ask: ask, LIVE: LIVE });
  function mHouseTell(code) { return KITCHEN.mHouseTell(code); }
  function mHouseReconcile(data) { return KITCHEN.mHouseReconcile(data); }

  var mInviteBusy = false;

  /* src/invites.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var INVITES = window.HiveParts.invites({ S: S, ask: ask, mAccount: mAccount, mHouseTell: mHouseTell, renderAll: renderAll, LIVE: LIVE });
  function mInviteGet() { return INVITES.mInviteGet(); }
  function mInviteSet(tok) { return INVITES.mInviteSet(tok); }
  function mInviteTry() { return INVITES.mInviteTry(); }
  function mHouseAlone() { return INVITES.mHouseAlone(); }
  function mJoinBack() { return INVITES.mJoinBack(); }
  function mHouseWatch() { return INVITES.mHouseWatch(); }

  /* The last attempt to reach the server failed, rather than answering
     "nobody". The two are different facts and the sheet has different
     words for them, but only one of them survived: ready() rejects, the
     state goes to 'error', and then the NEXT mSyncStart — opening the
     sheet, pressing a button — finds mAuthKnown true and nobody signed in,
     falls through to the signed-out branch and writes 'off' straight over
     it. "Cannot reach the server" could never reach the screen it was
     written for; a dead network read as a fresh invitation to sign in. */
  var mSyncUnreachable = false;

  /* src/signin.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var SIGNIN = window.HiveParts.signin({ MCLOCK_ID: MCLOCK_ID, MSTAMPS: MSTAMPS, MSYNC_KEYED: MSYNC_KEYED, S: S, dinerKeep: dinerKeep, dinerWatch: dinerWatch, mAccount: mAccount, mAccountMark: mAccountMark, mBootTargets: mBootTargets, mClockHear: mClockHear, mCreditWeek: mCreditWeek, mForgetDay: mForgetDay, mHouseReconcile: mHouseReconcile, mInviteTry: mInviteTry, mMergeRemote: mMergeRemote, mOwner: mOwner, mSetOwner: mSetOwner, mSuspectAccount: mSuspectAccount, mSyncState: mSyncState, mSyncTake: mSyncTake, mTrainSig: mTrainSig, pwFitCaps: pwFitCaps, renderMacros: renderMacros, renderModal: renderModal, LIVE: LIVE });
  function mSyncRetry() { return SIGNIN.mSyncRetry(); }
  function mWatchUser() { return SIGNIN.mWatchUser(); }
  function mSyncStart() { return SIGNIN.mSyncStart(); }
  function mDeleteAccount() { return SIGNIN.mDeleteAccount(); }
  function mSyncPush(now) { return SIGNIN.mSyncPush(now); }
  function mSyncAttach(doc, fv) { return SIGNIN.mSyncAttach(doc, fv); }

  window.addEventListener('online', mSyncRetry);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) return;
    mSyncRetry();
    if (mFoldTimer) mFoldNow();
  });

  function dayKey(d) {
    /* Built from the local calendar, never toISOString() — that is UTC, and it
       files an evening snack in Mountain time under tomorrow. */
    var p2 = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
  }
  function todayKey() { return dayKey(new Date()); }
  /* A day key as a count of days, for spacing points and measuring gaps.
     From the calendar date itself, not from local midnight's instant: that
     was Math.round(midnight / one day), which is a whole number only where
     midnight falls near midnight UTC. East of +11 it falls at noon UTC the
     day before, where a daylight-saving hour tips the rounding either way —
     in Auckland two days in September came out as the same number and one
     in April was skipped, which bent the measured burn, the seven-day
     average and the plan line, and could divide the chart by zero. */
  function mDayN(k) {
    var m = String(k).split('-');
    return Math.round(Date.UTC(Number(m[0]), Number(m[1]) - 1, Number(m[2])) / 86400000);
  }
  function keyDate(k) {
    var m = k.split('-');
    return new Date(Number(m[0]), Number(m[1]) - 1, Number(m[2]));
  }
  var M_WDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var M_WDAY = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];   // Monday first, as mWkIx counts
  var M_MONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /* The day on screen. With no day chosen it is today — but "today" as of
     the last time the screen was DRAWN, not as of the tap: a phone left on
     My Day across midnight still shows yesterday's plates, and a tap on one
     used to tick or delete the plate in that slot on the NEW day. The next
     draw moves the screen on; until then, taps go where the eye is. */
  var mDrawnToday = '';
  function mViewKey() { return S.macroDate || mDrawnToday || todayKey(); }

  /* The oldest day there is to go to: the first one anything was logged on,
     food or a weigh-in, and never less than the last 120 days, so a phone
     with nothing on it yet can still go back and log yesterday.
   *
     It was a window, the last 120 days (a fortnight before that), and the
     day log, the weigh-ins (399 days), the closed days, the skips and the
     training ticks were all pruned to it on every write, and older days
     coming back from the account were turned away. Blake, 2026-10-18: "What
     about the other historical data? I lose everything after 4 months. I
     would assume that I'm keeping everything." He chose to keep everything.
     Nothing is pruned now (dayflags.js, placing.js, weighin.js, and the
     account's days in mydayparts.js are all taken in), so this only says
     where the calendar and the arrows stop. YYYY-MM-DD sorts as it dates,
     so the oldest is the least key. */
  function mEarliestKey() {
    var d = new Date();
    d.setDate(d.getDate() - 119);
    var first = dayKey(d);
    Object.keys(MDAYS).forEach(function (k) { if (k < first) first = k; });
    Object.keys(MWEIGHTS).forEach(function (k) { if (k < first && MWEIGHTS[k] > 0) first = k; });
    return first;
  }

  /* How far forward the day travels. A week is as far as a plan is worth
     making: the shopping happens on a horizon like that, and pinned routine
     lands on a day the moment you first look at it, so a fortnight of empty
     Thursdays would be a fortnight of half-written days you never meant. */
  function mLatestKey() {
    var d = new Date();
    d.setDate(d.getDate() + 7);
    return dayKey(d);
  }

  /* A day you have not lived yet. You can plan one — put food on it, fill it,
     rebalance it — but you cannot have eaten it, and the scale has nothing to
     say about a morning that has not happened. */
  /* Over, in one place. The bar and the week strip both answer "is this day
     past its target" and used to answer it differently, which put a red
     square above a green bar about the same day. */
  /* Blake, on a week he felt had gone fine and a strip that said otherwise:
     "widen the threshold for what the target is. ±125 cals, or possibly a
     reasonable %?" A percentage, so it scales with the plan: 6.5% is 125
     calories on his 1,910 and 90 on a 1,400 cut. The strip, the day's bars
     and the pills all read this one number, so one verdict is one verdict. */
  var MKCAL_OVER = 106.5;

  /* On, over or under, for one macro of one day — the bars' rule, so that
     anything else judging a day says what the bars say. Calories are on
     within MKCAL_OVER of the line either side; the grams within 10 g; past
     that, over at 106.5% for calories, 110% for protein (the one a cut
     wants overshot) and 100% for the rest, and under below 90%. */
  function mVerdict(m, got, target) {
    if (!(target > 0)) return 'on';
    var diff = got - target, pct = 100 * got / target;
    var near = m === 'kcal' ? Math.abs(diff) <= target * ((MKCAL_OVER - 100) / 100)
      : Math.abs(diff) <= 10;
    var overAt = m === 'p' ? 110 : m === 'kcal' ? MKCAL_OVER : 100;
    return near ? 'on' : pct > overAt ? 'over' : pct >= 90 ? 'on' : 'under';
  }

  function mAhead(k) { return k > todayKey(); }

  /* src/mealtime.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var MEALTIME = window.HiveParts.mealtime({ mDoneAt: mDoneAt, mReadSlots: mReadSlots, todayKey: todayKey });
  function mSlotOpens(list, i) { return MEALTIME.mSlotOpens(list, i); }
  function mNowMins() { return MEALTIME.mNowMins(); }
  function mAddsEaten(k, sk) { return MEALTIME.mAddsEaten(k, sk); }
  function mDayJudged(k) { return MEALTIME.mDayJudged(k); }

  function mReadTargets() {
    var t = null, hand = false;
    try {
      var raw = JSON.parse(localStorage.getItem('bsc.macroTargets'));
      if (raw && isFinite(raw.p) && isFinite(raw.f) && isFinite(raw.c)) {
        t = { p: Number(raw.p), f: Number(raw.f), c: Number(raw.c) };
        hand = raw.auto === 0;
      }
    } catch (e) { /* private mode or a corrupt value — nothing is stored */ }
    /* Nothing stored is not the same as a plan of 180/50/50. That triple was
       a placeholder that hardened into an assertion: it belongs to nobody —
       not even to the person it was typed for, whose own profile works out to
       something else — and every screen that reads a target rendered it in
       exactly the shape it renders a plan somebody made. A first run opened on
       "No plan yet." above a full week of 1,370-kcal budgets, four bars
       reading 0 / 180 g, and a Fill button that would draft a real day out of
       real recipes against a target nobody had set.
     *
       Zero is what the rest of this file was already written for. Both empty
       states downstream — macroFootHTML's "Craft your plan." and the meal
       pills' silent strip — guard on all three being falsy, and with a
       placeholder in their way neither could ever fire; they were written
       correctly, twice, and defeated here. mShares denominates with
       Math.max(1, targets[m]) for the same reason, so an unset target still
       divides. Handing back zeros does not add an empty state. It lets the
       two that were always here start working. */
    if (!t) return { p: 0, f: 0, c: 0 };
    /* A day saved before the deficit was capped can be below what the body
       spends at rest — the arithmetic that wrote it has since been fixed,
       but the number it wrote is still sitting in storage being served every
       morning. Only that case is corrected, and only back up to what the
       same profile works out to now; a plan somebody typed by hand and can
       actually eat is left exactly as they typed it. */
    var pr = mReadProfile();
    var tdee = mTdee(pr);
    /* Two ways a stored day can be uneatable, and the total is only one of
       them. 226P/62F/13C comes to 1,514 kcal — over the floor, and still a
       day with three percent of itself left for everything that is not
       protein or fat, which no dinner in the book fits inside. A deliberate
       very-low-carb day typed by hand used to be corrected by this too.
     *
       Not any more: a record marked as the person's own (auto 0) is theirs.
       P 400 / F 10 / C 0 saved with "= 1690 kcal" under it, and the day read
       190 / 57 / 93 with no word, and after a reload storage itself had been
       rewritten. A day Nourish cannot plan is now refused at Save, with a
       line saying why (mtRefusal), so what reaches storage by hand is kept;
       this heals only what a plan wrote, or what an older build left. */
    var starved = 4 * t.c < MCARB_EAT * kcalOf(t);
    if (!hand && tdee !== null && (kcalOf(t) < mFloorK(pr) || starved)) {
      var fresh = mPlanCalc(pr);
      if (fresh && (kcalOf(fresh) > kcalOf(t) || fresh.c > t.c)) {
        t = { p: fresh.p, f: fresh.f, c: fresh.c };
      }
    }
    return t;
  }

  /* And the same correction, WRITTEN, which is a different act.
   *
     mReadTargets used to do both: it worked the day out, then saved it, then
     stamped it, and a stamp pushes. So a render could put a request on the
     network. It healed once and then stopped, so it was never a loop — but a
     read that writes is a read you cannot reason about, and the next person
     to call it from somewhere unexpected inherits the surprise.
   *
     Called where a decision is actually being made: once at boot, and again
     whenever the profile changes, which is the only thing that can turn a
     stored plan into an uneatable one. */
  function mHealTargets() {
    var was = null;
    try { was = JSON.parse(localStorage.getItem('bsc.macroTargets')); } catch (e) { /* none */ }
    if (!was) return false;
    var now = mReadTargets();
    if (!kcalOf(now)) return false;
    if (Number(was.p) === now.p && Number(was.f) === now.f && Number(was.c) === now.c) {
      return false;
    }
    /* The grams change; what the record says about itself does not. */
    mWriteTargets(Object.assign({}, was, { p: now.p, f: now.f, c: now.c }));
    return true;
  }
  function mWriteTargets(t) {
    if (mPut('bsc.macroTargets', t)) { mStamp('t'); dinerKeep(); }   // see mWriteMyFoods
  }

  /* src/follow.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var FOLLOW = window.HiveParts.follow({ MSTAMPS: MSTAMPS, dayKey: dayKey, kcalOf: kcalOf, keyDate: keyDate, mLineHTML: mLineHTML, mPlanCalc: mPlanCalc, mReadProfile: mReadProfile, mReadTargets: mReadTargets, mWriteTargets: mWriteTargets, todayKey: todayKey, LIVE: LIVE });
  function mTargRec() { return FOLLOW.mTargRec(); }
  function mFollowScale() { return FOLLOW.mFollowScale(); }
  function mMovedHTML() { return FOLLOW.mMovedHTML(); }

  /* src/daystore.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var DAYSTORE = window.HiveParts.daystore({ MEAL_SECS: MEAL_SECS, MSLOT_DEFS: MSLOT_DEFS, S: S, dinerKeep: dinerKeep, kcalOf: kcalOf, mDay: mDay, mDayTargets: mDayTargets, mEditDay: mEditDay, mFoldDue: mFoldDue, mNearIds: mNearIds, mPut: mPut, mSideUp: mSideUp, mStamp: mStamp, mTopUp: mTopUp, mTotals: mTotals, mTryAgain: mTryAgain, todayKey: todayKey, LIVE: LIVE });
  function mNever(id) { return DAYSTORE.mNever(id); }
  function mSetBatchG(id, perServing) { return DAYSTORE.mSetBatchG(id, perServing); }
  function mServeG(r) { return DAYSTORE.mServeG(r); }
  function mSetNever(id, on) { return DAYSTORE.mSetNever(id, on); }
  function mReadSlots() { return DAYSTORE.mReadSlots(); }
  function mWriteSlots(s) { return DAYSTORE.mWriteSlots(s); }
  function mAllSections() { return DAYSTORE.mAllSections(); }
  function mSlotSecs(slot) { return DAYSTORE.mSlotSecs(slot); }
  function mSlotKind(slot) { return DAYSTORE.mSlotKind(slot); }
  function mSlotSpokenFor(day, s) { return DAYSTORE.mSlotSpokenFor(day, s); }
  function mSlotClosed(day, k) { return DAYSTORE.mSlotClosed(day, k); }
  function mFillRoom(day, targets) { return DAYSTORE.mFillRoom(day, targets); }
  function mWhyChip(it, tag) { return DAYSTORE.mWhyChip(it, tag); }
  function mBatchStrip(r, it, tag) { return DAYSTORE.mBatchStrip(r, it, tag); }
  function mWhyStrip(it, tag) { return DAYSTORE.mWhyStrip(it, tag); }
  function mReplacePlate(k, sk, idx) { return DAYSTORE.mReplacePlate(k, sk, idx); }
  var MNEVER = DAYSTORE.MNEVER;
  var MBATCHG = DAYSTORE.MBATCHG;
  var MDAYS = DAYSTORE.MDAYS;

  /* src/toast.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var TOAST = window.HiveParts.toast({});
  function mToastEls() { return TOAST.mToastEls(); }
  function mToast(text, undo, attr) { return TOAST.mToast(text, undo, attr); }

  /* src/placing.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var PLACING = window.HiveParts.placing({ MDAYS: MDAYS, mFoldDue: mFoldDue, mPut: mPut, mSetSkip: mSetSkip, mSkipped: mSkipped, mSlotKind: mSlotKind, mSlotSecs: mSlotSecs, mStamp: mStamp });
  function mFoodMealOK(r, slot) { return PLACING.mFoodMealOK(r, slot); }
  function mSlotsForRecipe(r, slots) { return PLACING.mSlotsForRecipe(r, slots); }
  function mSlotForRecipe(r, slots) { return PLACING.mSlotForRecipe(r, slots); }
  function mDay(k) { return PLACING.mDay(k); }
  /* The marks a meal card shows — what Balance moved ("was 1 cup") and what
     the picker just put down ("New") — last until the next change to the
     day, whatever it is. Every change goes through here, so this is where
     they end. */
  function mAllSlotsDone(k) {
    var d = mDay(k);
    if (!mDayDone(d)) return false;
    return mReadSlots().list.every(function (s) {
      if (mSkipped(k, s.k)) return true;
      var items = (d[s.k] || []).filter(function (it) { return !!LIVE.BY_ID[it.id]; });
      return items.length > 0 && items.every(function (it) { return !!it.eaten; });
    });
  }
  function mEditDay(k, fn, seed) {
    S.mMarks = null;
    var res = PLACING.mEditDay(k, fn, seed);
    if (!seed && mDoneAt(k) > 0 && !mAllSlotsDone(k)) mSetDone(k, false);
    if (!seed) mHealthPushMeals(k);
    if (!seed && S.view === 'today' && window.Today) window.Today.render();
    return res;
  }
  function kcalOf(t) { return PLACING.kcalOf(t); }

  /* src/training.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var TRAINING = window.HiveParts.training({ dayKey: dayKey, keyDate: keyDate, mBlockN: mBlockN, mFloorK: mFloorK, mPut: mPut, mReadProfile: mReadProfile, mReadProfileRaw: mReadProfileRaw, mReadTargets: mReadTargets, mStrengthOn: mStrengthOn, mTrainedAt: mTrainedAt, mTrainedSaid: mTrainedSaid, todayKey: todayKey, LIVE: LIVE });
  function mWkIx(d) { return TRAINING.mWkIx(d); }
  function mTrainDays() { return TRAINING.mTrainDays(); }
  function mTrainDaysOwn() { return TRAINING.mTrainDaysOwn(); }
  function mSnapTargets() { return TRAINING.mSnapTargets(); }
  function mCreditDay(k) { return TRAINING.mCreditDay(k); }
  function mCreditWeek() { return TRAINING.mCreditWeek(); }
  function mTrainSig() { return TRAINING.mTrainSig(); }
  function mDayTargets(k) { return TRAINING.mDayTargets(k); }
  function mCycleOf(base) { return TRAINING.mCycleOf(base); }
  function mIsTrainingDay(k) { return TRAINING.mIsTrainingDay(k); }
  function mSynced() { return TRAINING.mSynced(); }
  function mCanSync() { return TRAINING.mCanSync(); }
  var MCARB_EAT = TRAINING.MCARB_EAT;
  var MDAYT = TRAINING.MDAYT;

  /* src/plans.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var PLANS = window.HiveParts.plans({ mHealTargets: mHealTargets, mPut: mPut, mStamp: mStamp, mWeightStats: mWeightStats, todayKey: todayKey, LIVE: LIVE });
  function mReadProfileRaw() { return PLANS.mReadProfileRaw(); }
  function mScaleLb() { return PLANS.mScaleLb(); }
  function mReadProfile() { return PLANS.mReadProfile(); }
  function mWriteProfile(pr) { return PLANS.mWriteProfile(pr); }
  function mBodyFat(pr) { return PLANS.mBodyFat(pr); }
  function mProtLevel(pr) { return PLANS.mProtLevel(pr); }
  function mProtRefLb(pr) { return PLANS.mProtRefLb(pr); }
  function mProtGrams(pr) { return PLANS.mProtGrams(pr); }
  function mProtFloorG(pr) { return PLANS.mProtFloorG(pr); }
  function mFloorK(pr) { return PLANS.mFloorK(pr); }
  var MFAT_MAX = PLANS.MFAT_MAX;
  var MGOALS = PLANS.MGOALS;
  var MPROT_LEVELS = PLANS.MPROT_LEVELS;
  var MPROT_WORDS = PLANS.MPROT_WORDS;
  var MFAT_FLOOR = PLANS.MFAT_FLOOR;
  var MCARB_SHARE = PLANS.MCARB_SHARE;

  /* src/burn.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var BURN = window.HiveParts.burn({ MCARB_EAT: MCARB_EAT, MCARB_SHARE: MCARB_SHARE, MDAYS: MDAYS, MFAT_FLOOR: MFAT_FLOOR, MFAT_MAX: MFAT_MAX, MGOALS: MGOALS, dayKey: dayKey, kcalOf: kcalOf, keyDate: keyDate, mBodyFat: mBodyFat, mDayN: mDayN, mDoneAt: mDoneAt, mFloorK: mFloorK, mProtFloorG: mProtFloorG, mProtGrams: mProtGrams, mPut: mPut, mTotals: mTotals, todayKey: todayKey, LIVE: LIVE });
  function mBurn(pr) { return BURN.mBurn(pr); }
  function mLogIntake() { return BURN.mLogIntake(); }
  function mMeasuredTdee() { return BURN.mMeasuredTdee(); }
  function mTdee(pr) { return BURN.mTdee(pr); }
  function mProject(pr) { return BURN.mProject(pr); }
  function mLever(pr, extraKcal) { return BURN.mLever(pr, extraKcal); }
  function mGoalPace(pr) { return BURN.mGoalPace(pr); }
  function mSplitKcal(kcal, t, pr) { return BURN.mSplitKcal(kcal, t, pr); }
  function mPlanCalc(pr) { return BURN.mPlanCalc(pr); }
  var MSTEP_BASE = BURN.MSTEP_BASE;
  var MINTAKE_DAYS = BURN.MINTAKE_DAYS;
  var MINTAKE = BURN.MINTAKE;

  /* src/dayflags.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var DAYFLAGS = window.HiveParts.dayflags({ MSTAMPS: MSTAMPS, M_WDAY: M_WDAY, keyDate: keyDate, mDayTargets: mDayTargets, mFoldDue: mFoldDue, mIsTrainingDay: mIsTrainingDay, mPut: mPut, mReadProfileRaw: mReadProfileRaw, mReadTargets: mReadTargets, mStamp: mStamp, mSynced: mSynced, mTrainDays: mTrainDays, mWkIx: mWkIx, todayKey: todayKey });
  function mDoneAt(k) { return DAYFLAGS.mDoneAt(k); }
  function mTrainedAt(k) { return DAYFLAGS.mTrainedAt(k); }
  function mTrainedSaid(k) { return DAYFLAGS.mTrainedSaid(k); }
  function mTrainRow(k) { return DAYFLAGS.mTrainRow(k); }
  function mTrainWord(k) { return DAYFLAGS.mTrainWord(k); }
  function mStrengthOn(k) { return DAYFLAGS.mStrengthOn(k); }
  function mSetTrained(k, on) { return DAYFLAGS.mSetTrained(k, on); }
  function mSetDone(k, on) {
    var res = DAYFLAGS.mSetDone(k, on);
    mHealthPushMeals(k);
    return res;
  }
  function mSkipped(k, sk) { return DAYFLAGS.mSkipped(k, sk); }
  function mHushed(k, sig) { return DAYFLAGS.mHushed(k, sig); }
  function mSetHush(k, sig) { return DAYFLAGS.mSetHush(k, sig); }
  function mSetSkip(k, sk, on) {
    var res = DAYFLAGS.mSetSkip(k, sk, on);
    if (!on && mDoneAt(k) > 0 && !mAllSlotsDone(k)) mSetDone(k, false);
    return res;
  }
  function mSendOf(k) { return DAYFLAGS.mSendOf(k); }
  function mSetSend(k, v) { return DAYFLAGS.mSetSend(k, v); }
  var MDONE = DAYFLAGS.MDONE;
  var MTRAINED = DAYFLAGS.MTRAINED;
  var MSKIP = DAYFLAGS.MSKIP;
  var MHUSH = DAYFLAGS.MHUSH;
  var MSEND = DAYFLAGS.MSEND;

  /* src/weighin.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var WEIGHIN = window.HiveParts.weighin({ MSTAMPS: MSTAMPS, mFoldDue: mFoldDue, mPut: mPut, mStamp: mStamp });
  function mWUnit() { return WEIGHIN.mWUnit(); }
  function mWShow(lb) { return WEIGHIN.mWShow(lb); }
  function mWriteWeight(k, lb) {
    var res = WEIGHIN.mWriteWeight(k, lb);
    mHealthPushWeight(k, lb);
    return res;
  }
  var WGAPI = WEIGHIN.WGAPI;
  var MWEIGHTS = WEIGHIN.MWEIGHTS;
  var MKG_LB = WEIGHIN.MKG_LB;

  /* src/checkin.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var CHECKIN = window.HiveParts.checkin({ S: S, dayKey: dayKey, keyDate: keyDate, mFoldDue: mFoldDue, mPut: mPut, mStamp: mStamp });
  function mAmOf(k) { return CHECKIN.mAmOf(k); }
  function mAmWrite(k, field, v) { return CHECKIN.mAmWrite(k, field, v); }
  function mAmClean(v) { return CHECKIN.mAmClean(v); }
  function mAmSum(k) { return CHECKIN.mAmSum(k); }
  function mAmDays() { return CHECKIN.mAmDays(); }
  function mDrinksClean(v) { return CHECKIN.mDrinksClean(v); }
  function mWaterGoalOz(lb) { return CHECKIN.mWaterGoalOz(lb); }
  function mWaterOz(k) { return CHECKIN.mWaterOz(k); }
  function mCafMg(k) { return CHECKIN.mCafMg(k); }
  function mHydrationCardHTML(k, goalOz) { return CHECKIN.mHydrationCardHTML(k, goalOz); }
  function mCheckinHTML(k) { return CHECKIN.mCheckinHTML(k); }
  function mCheckinClick(b, k) { return CHECKIN.mCheckinClick(b, k); }
  function mCheckinInput(el, k) { return CHECKIN.mCheckinInput(el, k); }
  var MAM = CHECKIN.MAM;

  /* ---- Android Health Connect bridge (window.Health) ----
   *
     Two-way sync when running inside the Android app (window.NourishAndroid):
       Read:  Steps (into MAM[nextDay].sy for completed days), Sleep (into
              MAM[day].sl), and Scale Weight (into MWEIGHTS[day]).
       Write: Morning weigh-ins (WeightRecord), eaten meals (NutritionRecord),
              and completed workouts (ExerciseSessionRecord).
     Quiet fallback everywhere else: manual entry works as usual. */
  var healthPulling = false;
  var healthMealSig = {};
  var healthDaySynced = {};
  var healthMeta = { status: '', lastSync: 0, todaySteps: 0 };
  var MHEALTH_LABELS = { b: 'Breakfast', l: 'Lunch', d: 'Dinner', s: 'Snacks' };

  function mHealthMealType(sl) {
    if (!sl) return 's';
    if (sl.t === 'b' || sl.t === 'l' || sl.t === 'd' || sl.t === 's') return sl.t;
    if (sl.k === 'b' || sl.k === 'l' || sl.k === 'd' || sl.k === 's') return sl.k;
    var nm = String(sl.n || '').toLowerCase();
    if (/snack/.test(nm)) return 's';
    if (/breakfast|morning|wake/.test(nm)) return 'b';
    if (/lunch|midday|mid-day/.test(nm)) return 'l';
    if (/dinner|supper/.test(nm)) return 'd';
    return 's';
  }

  function mHealthPushWeight(k, lb) {
    if (healthPulling || !(window.NourishAndroid && window.NourishAndroid.writeWeight)) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(k || ''))) return;
    try {
      window.NourishAndroid.writeWeight(JSON.stringify({
        id: 'nourish-weight-' + k,
        dayKey: k,
        lb: lb > 0 ? Math.round(Number(lb) * 10) / 10 : 0
      }));
    } catch (e) { /* native bridge unavailable */ }
  }

  function mHealthPushMeals(k, forceClean) {
    if (!(window.NourishAndroid && window.NourishAndroid.writeNutrition)) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(k || ''))) return;
    var day = mDay(k), done = mDoneAt(k) > 0, slots = mReadSlots();
    var buckets = { b: [], l: [], d: [], s: [] }, seenSk = {};
    slots.list.forEach(function (sl) {
      seenSk[sl.k] = 1;
      var mt = mHealthMealType(sl);
      var items = (day[sl.k] || []).filter(function (it) { return BY_ID[it.id] && BY_ID[it.id].macro; });
      var eaten = done ? items : items.filter(function (it) { return it.eaten; });
      eaten.forEach(function (it) { buckets[mt].push(it); });
    });
    Object.keys(day || {}).forEach(function (sk) {
      if (seenSk[sk] || !Array.isArray(day[sk])) return;
      var mt = mHealthMealType({ k: sk, n: (slots.names && slots.names[sk]) || '', t: '' });
      var items = day[sk].filter(function (it) { return BY_ID[it.id] && BY_ID[it.id].macro; });
      var eaten = done ? items : items.filter(function (it) { return it.eaten; });
      eaten.forEach(function (it) { buckets[mt].push(it); });
    });
    ['b', 'l', 'd', 's'].forEach(function (mt) {
      var eaten = buckets[mt];
      var one = {}; one[mt] = eaten;
      var tot = eaten.length ? mTotals(one).all : { kcal: 0, p: 0, f: 0, c: 0 };
      var kcal = eaten.length ? Math.round(tot.kcal) : 0;
      var p = eaten.length ? Math.round(tot.p * 10) / 10 : 0;
      var f = eaten.length ? Math.round(tot.f * 10) / 10 : 0;
      var c = eaten.length ? Math.round(tot.c * 10) / 10 : 0;
      var name = eaten.map(function (it) { return BY_ID[it.id].name; }).join(', ');
      var sig = mt + ':' + kcal + ':' + p + ':' + f + ':' + c + ':' + name;
      var key = k + ':' + mt;
      var forceS = forceClean && mt === 's' && !healthMealSig[key];
      if (!forceS && (healthMealSig[key] === sig || (!healthMealSig[key] && kcal === 0))) return;
      healthMealSig[key] = sig;
      try {
        window.NourishAndroid.writeNutrition(JSON.stringify({
          id: 'nourish-meal-' + k + '-' + mt,
          dayKey: k,
          slot: mt,
          mealType: mt,
          name: name || MHEALTH_LABELS[mt],
          kcal: kcal,
          p: p,
          f: f,
          c: c
        }));
      } catch (e) { /* native bridge unavailable */ }
    });
  }

  function mHealthSyncRecentMeals() {
    if (!(window.NourishAndroid && window.NourishAndroid.writeNutrition)) return;
    var keys = Object.keys(MDAYS || {}).filter(function (k) { return /^\d{4}-\d{2}-\d{2}$/.test(k); }).sort().slice(-7);
    keys.forEach(function (k) {
      if (healthDaySynced[k]) return;
      var day = mDay(k), done = mDoneAt(k) > 0, hasEaten = done;
      if (!hasEaten) {
        Object.keys(day || {}).forEach(function (sk) {
          if (Array.isArray(day[sk]) && day[sk].some(function (it) { return it && it.eaten; })) hasEaten = true;
        });
      }
      if (hasEaten) {
        healthDaySynced[k] = 1;
        mHealthPushMeals(k, true);
      }
    });
  }

  function mHealthPushWorkout(k, wo) {
    if (!(wo && window.NourishAndroid && window.NourishAndroid.writeWorkout)) return;
    var dk = /^\d{4}-\d{2}-\d{2}$/.test(String(k || '')) ? k : todayKey();
    try {
      window.NourishAndroid.writeWorkout(JSON.stringify({
        id: 'nourish-wo-' + (wo.id || dk),
        dayKey: dk,
        startMs: Number(wo.st) || (Date.now() - 3600000),
        endMs: Number(wo.en) || Date.now(),
        title: wo.n ? 'Strengthen \u00b7 ' + wo.n : 'Strengthen Workout',
        notes: wo.nt || ''
      }));
    } catch (e) { /* native bridge unavailable */ }
  }

  function healthRefreshStatus() {
    if (!(window.NourishAndroid && window.NourishAndroid.getHealthStatus)) return null;
    try {
      var raw = window.NourishAndroid.getHealthStatus();
      var obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (obj && typeof obj === 'object') {
        if (obj.status) healthMeta.status = String(obj.status);
        if (obj.lastSync) healthMeta.lastSync = Number(obj.lastSync) || healthMeta.lastSync;
      }
    } catch (e) { /* ignore malformed status */ }
    return healthMeta;
  }

  window.Health = {
    available: function () { return !!(window.NourishAndroid && window.NourishAndroid.getHealthStatus); },
    state: function () {
      var m = healthRefreshStatus();
      return m && m.status ? m.status : 'unavailable';
    },
    lastSync: function () { return healthMeta.lastSync; },
    todaySteps: function () { return healthMeta.todaySteps; },
    connect: function () {
      if (window.NourishAndroid && window.NourishAndroid.requestHealthPermissions) {
        try { window.NourishAndroid.requestHealthPermissions(); } catch (e) { /* ignore */ }
      }
    },
    sync: function () {
      if (window.NourishAndroid && window.NourishAndroid.syncHealthNow) {
        try { window.NourishAndroid.syncHealthNow(); } catch (e) { /* ignore */ }
      }
    },
    openStore: function () {
      if (window.NourishAndroid && window.NourishAndroid.openHealthConnect) {
        try { window.NourishAndroid.openHealthConnect(); } catch (e) { /* ignore */ }
      }
    },
    onData: function (raw) {
      var data = null;
      try { data = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch (e) { data = null; }
      if (!data || typeof data !== 'object') return false;
      if (data.status) healthMeta.status = String(data.status);
      if (data.syncedAt) healthMeta.lastSync = Number(data.syncedAt) || Date.now();
      var changed = false;
      if (data.days && typeof data.days === 'object') {
        var tk = todayKey();
        Object.keys(data.days).sort().forEach(function (d) {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return;
          var rec = data.days[d] || {};
          if (typeof rec.sleepHours === 'number' && isFinite(rec.sleepHours) && rec.sleepHours > 0 && rec.sleepHours <= 24) {
            var sl = Math.round(rec.sleepHours * 4) / 4;
            if (sl > 0 && mAmOf(d).sl !== sl) { mAmWrite(d, 'sl', sl); changed = true; }
          }
          if (typeof rec.steps === 'number' && isFinite(rec.steps) && rec.steps > 0 && rec.steps <= 200000) {
            var stp = Math.round(rec.steps);
            if (d === tk) healthMeta.todaySteps = stp;
            if (d < tk) {
              var nx = keyDate(d); nx.setDate(nx.getDate() + 1);
              var nk = dayKey(nx);
              if (mAmOf(nk).sy !== stp) { mAmWrite(nk, 'sy', stp); changed = true; }
            }
          }
          if (typeof rec.weightLb === 'number' && isFinite(rec.weightLb) && rec.weightLb >= 60 && rec.weightLb <= 700) {
            var wlb = Math.round(rec.weightLb * 10) / 10;
            if (MWEIGHTS[d] !== wlb) {
              healthPulling = true;
              try { mWriteWeight(d, wlb); } finally { healthPulling = false; }
              changed = true;
            }
          }
        });
      }
      if (changed) dinerKeep();
      if (healthMeta.status === 'granted') mHealthSyncRecentMeals();
      if (S.view === 'today' && window.Today) window.Today.render();
      if (S.view === 'macros') renderMacros();
      if (S.view === 'train' && window.Train) window.Train.render();
      if (S.syncOpen) renderModal();
      return changed;
    }
  };

  /* One drawn set for every verb on the tab — the bottom bar's tools and
     each meal's own — so they read as one family: a 20px box, a 1.5 stroke,
     in the colour of the word beside it. */
  var MICONS = {
    scales: '<path d="M10 3v14M6.5 17h7M4 5.5h12M4 5.5 1.8 11a2.2 2.2 0 0 0 4.4 0zM16 5.5 13.8 11a2.2 2.2 0 0 0 4.4 0z"/>',
    another: '<path d="M15.8 11.5A6 6 0 1 1 14.2 5.7M15.6 2.8v3.4h-3.4"/>',
    skip: '<circle cx="10" cy="10" r="6.5"/><path d="M5.4 14.6 14.6 5.4"/>',
    plus: '<path d="M10 4v12M4 10h12"/>',
    /* Two links of a chain: these plates, kept together. Blake picked it, and
       Save for its word, after the word Keep alone left him asking what the
       button did. */
    keep: '<g transform="rotate(-45 10 10)"><rect x="1" y="7.25" width="10.5" height="5.5" rx="2.75"/>' +
      '<rect x="8.5" y="7.25" width="10.5" height="5.5" rx="2.75"/></g>',
    fromday: '<rect x="3" y="4.5" width="14" height="12.5" rx="1.5"/><path d="M3 8.5h14M7 2.5v4M13 2.5v4M7.5 12.8h5M10.5 10.6l2.2 2.2-2.2 2.2"/>'
  };
  function mIcon(name) {
    return '<svg class="mday-ic" viewBox="0 0 20 20" aria-hidden="true">' + MICONS[name] + '</svg>';
  }

  /* src/scale.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var SCALE = window.HiveParts.scale({ MDAYS: MDAYS, MFAT_MAX: MFAT_MAX, MWEIGHTS: MWEIGHTS, M_MONS: M_MONS, M_WDAYS: M_WDAYS, kcalOf: kcalOf, keyDate: keyDate, mBodyFat: mBodyFat, mDayN: mDayN, mFloorK: mFloorK, mGoalPace: mGoalPace, mMeasuredTdee: mMeasuredTdee, mPlanCalc: mPlanCalc, mReadProfile: mReadProfile, mReadTargets: mReadTargets, mTargRec: mTargRec, mTdee: mTdee, mTotals: mTotals, mcDaysApart: mcDaysApart, todayKey: todayKey, LIVE: LIVE });
  function mWeightStats() { return SCALE.mWeightStats(); }
  function mSparkSVG() { return SCALE.mSparkSVG(); }
  function mLbWord(d) { return SCALE.mLbWord(d); }
  function mPretty(k) { return SCALE.mPretty(k); }
  function mLongDate(k) { return SCALE.mLongDate(k); }
  function mPlanFace() { return SCALE.mPlanFace(); }
  function mPlanDetail() { return SCALE.mPlanDetail(); }
  function mPlanWeight(k, pr) { return SCALE.mPlanWeight(k, pr); }
  function mJump(k) { return SCALE.mJump(k); }
  function mSodiumOn(k) { return SCALE.mSodiumOn(k); }
  function mPaceFacts(k, draft) { return SCALE.mPaceFacts(k, draft); }
  var MSALT_JUMP = SCALE.MSALT_JUMP;
  var MSALT_DAY = SCALE.MSALT_DAY;

  /* src/morning.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var MORNING = window.HiveParts.morning({ MSALT_DAY: MSALT_DAY, MSALT_JUMP: MSALT_JUMP, kcalOf: kcalOf, mAhead: mAhead, mBurn: mBurn, mDayTargets: mDayTargets, mHushed: mHushed, mIsTrainingDay: mIsTrainingDay, mJump: mJump, mLsJson: mLsJson, mMeasuredTdee: mMeasuredTdee, mPaceFacts: mPaceFacts, mPlanWeight: mPlanWeight, mPretty: mPretty, mReadProfile: mReadProfile, mReadTargets: mReadTargets, mSodiumOn: mSodiumOn, mTrainDays: mTrainDays, todayKey: todayKey });
  function mMorningHTML(k, where) { return MORNING.mMorningHTML(k, where); }
  function mLineHTML(kind, icon, text, sub, acts, why) { return MORNING.mLineHTML(kind, icon, text, sub, acts, why); }
  function mInfoBtn(key, label) { return MORNING.mInfoBtn(key, label); }
  function mWhyBtn(key) { return MORNING.mWhyBtn(key); }
  function mInfoText(key, html, cls) { return MORNING.mInfoText(key, html, cls); }
  function mWeekOn() { return MORNING.mWeekOn(); }
  var MLINE_NEAR = MORNING.MLINE_NEAR;
  var MINFO = MORNING.MINFO;

  /* src/weighcard.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var WEIGHCARD = window.HiveParts.weighcard({ MWEIGHTS: MWEIGHTS, S: S, WGAPI: WGAPI, kcalOf: kcalOf, mAhead: mAhead, mDayTargets: mDayTargets, mIsTrainingDay: mIsTrainingDay, mLbWord: mLbWord, mLineHTML: mLineHTML, mLsFull: mLsFull, mLsFullSay: mLsFullSay, mCheckinHTML: mCheckinHTML, mMorningHTML: mMorningHTML, mMovedHTML: mMovedHTML, mPlanDetail: mPlanDetail, mPlanFace: mPlanFace, mSparkSVG: mSparkSVG, mSynced: mSynced, mTrainDays: mTrainDays, mTrainRow: mTrainRow, mTrainWord: mTrainWord, mTrainedSaid: mTrainedSaid, mWShow: mWShow, mWUnit: mWUnit, mWeekOn: mWeekOn, mWeightStats: mWeightStats, todayKey: todayKey });
  function macroWeighHTML(k) { return WEIGHCARD.macroWeighHTML(k); }

  /* src/budget.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var BUDGET = window.HiveParts.budget({ mReadSlots: mReadSlots, mSkipped: mSkipped, mViewKey: mViewKey, LIVE: LIVE });
  function mTotals(day) { return BUDGET.mTotals(day); }
  function mDayDone(day) { return BUDGET.mDayDone(day); }
  function mSlotW(slot) { return BUDGET.mSlotW(slot); }
  function mShares(day, targets, slot) { return BUDGET.mShares(day, targets, slot); }

  /* src/fit.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var FIT = window.HiveParts.fit({ mDayEaten: mDayEaten, mDayTargets: mDayTargets, mIsFav: mIsFav, mShares: mShares, mViewKey: mViewKey });
  function macroFit(r, R, T, D) { return FIT.macroFit(r, R, T, D); }
  function mSaltChip(r, x) { return FIT.mSaltChip(r, x); }
  function mSaltNote(r, x) { return FIT.mSaltNote(r, x); }
  function mSaltFibre(r, x) { return FIT.mSaltFibre(r, x); }
  function mRank(list, day, targets, slot) { return FIT.mRank(list, day, targets, slot); }
  function mGapFresh() { return FIT.mGapFresh(); }
  function mMacLine(r, x, vsGap) { return FIT.mMacLine(r, x, vsGap); }
  function mClosesIt(r, x) { return FIT.mClosesIt(r, x); }
  var MW = FIT.MW;
  var MX = FIT.MX;
  var MFOOD_G_MAX = FIT.MFOOD_G_MAX;

  /* src/portion.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var PORTION = window.HiveParts.portion({ fixUnit: fixUnit, fmtNum: fmtNum, mFixNoun: mFixNoun, mServeG: mServeG, LIVE: LIVE });
  function mByGram(r) { return PORTION.mByGram(r); }
  function mDialUnit(r) { return PORTION.mDialUnit(r); }
  function mLadder(r, x) { return PORTION.mLadder(r, x); }
  function mStepX(r, x, dir) { return PORTION.mStepX(r, x, dir); }
  function mPortion(r, x) { return PORTION.mPortion(r, x); }
  function mPortionText(r, x) { return PORTION.mPortionText(r, x); }
  function mDialG(r) { return PORTION.mDialG(r); }
  function mDialText(r, x) { return PORTION.mDialText(r, x); }
  function mDialMeasure(r, x) { return PORTION.mDialMeasure(r, x); }
  function mDialStep(r, x, dir) { return PORTION.mDialStep(r, x, dir); }
  function mDialFromX(r, x) { return PORTION.mDialFromX(r, x); }
  function mXFromDial(r, n) { return PORTION.mXFromDial(r, n); }

  /* src/weekstrip.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var WEEKSTRIP = window.HiveParts.weekstrip({ MDAYS: MDAYS, M_MONS: M_MONS, M_WDAYS: M_WDAYS, dayKey: dayKey, kcalOf: kcalOf, keyDate: keyDate, mDay: mDay, mDayDone: mDayDone, mDayJudged: mDayJudged, mDayTargets: mDayTargets, mEarliestKey: mEarliestKey, mIsTrainingDay: mIsTrainingDay, mLatestKey: mLatestKey, mTotals: mTotals, mVerdict: mVerdict });
  function mWeekHTML(k, todayK) { return WEEKSTRIP.mWeekHTML(k, todayK); }

  /* src/myday.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var MYDAY = window.HiveParts.myday({ MDAYS: MDAYS, MWEIGHTS: MWEIGHTS, M_MONS: M_MONS, S: S, WGAPI: WGAPI, dayKey: dayKey, kcalOf: kcalOf, keyDate: keyDate, mpIcon: mpIcon, leaf: leaf, mAhead: mAhead, mBatchStrip: mBatchStrip, mCanFav: mCanFav, mCascadeLineHTML: mCascadeLineHTML, mCopyItems: mCopyItems, mDay: mDay, mDayTargets: mDayTargets, mDialUnit: mDialUnit, mDoneAt: mDoneAt, mEarliestKey: mEarliestKey, mEditDay: mEditDay, mFillRoom: mFillRoom, mFoldForget: mFoldForget, mHydrationCardHTML: mHydrationCardHTML, mIcon: mIcon, mIsFav: mIsFav, mLatestKey: mLatestKey, mLongDate: mLongDate, mMacLine: mMacLine, mMarkAccountUI: mMarkAccountUI, mMealAsk: mMealAsk, mMealPillsSay: mMealPillsSay, mReadProfile: mReadProfile, mReadSlots: mReadSlots, mSaltChip: mSaltChip, mServeG: mServeG, mSkipped: mSkipped, mSnapTargets: mSnapTargets, mViewKey: mViewKey, mWaterGoalOz: mWaterGoalOz, mWeekHTML: mWeekHTML, mWhyChip: mWhyChip, mWhyStrip: mWhyStrip, macroFootHTML: macroFootHTML, macroWeighHTML: macroWeighHTML, syncShrunk: syncShrunk, todayKey: todayKey, mDialFromX: mDialFromX, mDialG: mDialG, mDialMeasure: mDialMeasure, mDialText: mDialText, LIVE: LIVE });
  function renderMacros() {
    var r = MYDAY.renderMacros();
    if (S.view === 'today' && window.Today) window.Today.render();
    return r;
  }
  function mMealSheetParts(sk) { return MYDAY.mMealSheetParts(sk); }
  function mMealNowHTML(sk, add) { return MYDAY.mMealNowHTML(sk, add); }

  /* src/gauges.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var GAUGES = window.HiveParts.gauges({ kcalOf: kcalOf, mMealAsk: mMealAsk, mReadSlots: mReadSlots, mSkipped: mSkipped, mSlotW: mSlotW, mViewKey: mViewKey });
  function mAssumed(day, targets, slots) { return GAUGES.mAssumed(day, targets, slots); }
  function mGauge(got, want, dayT) { return GAUGES.mGauge(got, want, dayT); }
  function mFillPill(cls, tone, pct, body) { return GAUGES.mFillPill(cls, tone, pct, body); }
  function mMealPillsSay(sub, ask, targets) { return GAUGES.mMealPillsSay(sub, ask, targets); }
  var MPILL_TONE = GAUGES.MPILL_TONE;

  /* src/shares.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var SHARES = window.HiveParts.shares({ kcalOf: kcalOf, mDay: mDay, mInfoText: mInfoText, mSendOf: mSendOf, mSkipped: mSkipped, mSlotW: mSlotW, mTotals: mTotals, mViewKey: mViewKey, mWhyBtn: mWhyBtn, LIVE: LIVE });
  function mMealDone(sk) { return SHARES.mMealDone(sk); }
  function mMealAsk(sk, targets, slots, adjust) { return SHARES.mMealAsk(sk, targets, slots, adjust); }
  function mLastFinished(targets, slots) { return SHARES.mLastFinished(targets, slots); }
  function mCascadeLineHTML(sk, targets, slots) { return SHARES.mCascadeLineHTML(sk, targets, slots); }
  var MCASCADE_MIN = SHARES.MCASCADE_MIN;

  /* src/charts.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var CHARTS = window.HiveParts.charts({ MDAYS: MDAYS, MSALT_DAY: MSALT_DAY, MWEIGHTS: MWEIGHTS, S: S, dayKey: dayKey, keyDate: keyDate, mDayN: mDayN, mInfoBtn: mInfoBtn, mInfoText: mInfoText, mPlanWeight: mPlanWeight, mPretty: mPretty, mReadProfile: mReadProfile, mSodiumOn: mSodiumOn });
  function mcDaysApart(a, b) { return CHARTS.mcDaysApart(a, b); }
  function mcRead(svg, clientX) { return CHARTS.mcRead(svg, clientX); }
  function macroChartHTML() { return CHARTS.macroChartHTML(); }
  var MC_GAP = CHARTS.MC_GAP;

  /* src/keep.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var KEEP = window.HiveParts.keep({ S: S, fmtNum: fmtNum, mDay: mDay, mInfoBtn: mInfoBtn, mInfoText: mInfoText, mReadSlots: mReadSlots, mViewKey: mViewKey, LIVE: LIVE });
  function mKeepHTML() { return KEEP.mKeepHTML(); }

  /* src/favpick.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var FAVPICK = window.HiveParts.favpick({ MNEVER: MNEVER, S: S, mExtOk: mExtOk, mInfoBtn: mInfoBtn, mInfoText: mInfoText, mIsFav: mIsFav, mPretty: mPretty, mShelfKey: mShelfKey, LIVE: LIVE });
  function mFavDoneLabel() { return FAVPICK.mFavDoneLabel(); }
  function mFavChipSync(btn, r) { return FAVPICK.mFavChipSync(btn, r); }
  function mFavPickBodyHTML() { return FAVPICK.mFavPickBodyHTML(); }
  function mFavPickHTML() { return FAVPICK.mFavPickHTML(); }

  /* src/copyfrom.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var COPYFROM = window.HiveParts.copyfrom({ MDAYS: MDAYS, S: S, mEarliestKey: mEarliestKey, mIcon: mIcon, mLatestKey: mLatestKey, mLongDate: mLongDate, mPortionText: mPortionText, mPretty: mPretty, mReadSlots: mReadSlots, mViewKey: mViewKey, todayKey: todayKey, LIVE: LIVE });
  function mCopyItems(fromK, sk) { return COPYFROM.mCopyItems(fromK, sk); }
  function mSlotName(sk) { return COPYFROM.mSlotName(sk); }
  function mCopyFromHTML() { return COPYFROM.mCopyFromHTML(); }

  /* src/foodsheet.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var FOODSHEET = window.HiveParts.foodsheet({ S: S, fixUnit: fixUnit, fmtNum: fmtNum, mByGram: mByGram, mDialUnit: mDialUnit, mMacLine: mMacLine, mNextMeal: mNextMeal, mPortionText: mPortionText, mReadSlots: mReadSlots, mSlotName: mSlotName, mpLastXs: mpLastXs, LIVE: LIVE });
  function mFsAmt(r, x, unit) { return FOODSHEET.mFsAmt(r, x, unit); }
  function mFsState(r) { return FOODSHEET.mFsState(r); }
  function mFsRefresh() { return FOODSHEET.mFsRefresh(); }
  function mFoodSheetHTML() { return FOODSHEET.mFoodSheetHTML(); }
  function mFsFixRead(r) { return FOODSHEET.mFsFixRead(r); }
  function mFsFixRefresh() { return FOODSHEET.mFsFixRefresh(); }

  /* src/dayfoot.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var DAYFOOT = window.HiveParts.dayfoot({ MPILL_TONE: MPILL_TONE, S: S, kcalOf: kcalOf, mAssumed: mAssumed, mFillPill: mFillPill, mTotals: mTotals, mVerdict: mVerdict, pushSheet: pushSheet, rememberOpener: rememberOpener, renderModal: renderModal });
  function mOpenTargets() { return DAYFOOT.mOpenTargets(); }
  function macroFootHTML(day, targets, slots) { return DAYFOOT.macroFootHTML(day, targets, slots); }

  /* What you logged last time, food by food, and what you reach for — one
     walk of the day log per list rather than one per row. Newest day first,
     and only days you have lived: a plan for Thursday is not "last time". */
  var MP_LASTX = {};

  /* src/pickrow.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var PICKROW = window.HiveParts.pickrow({ MDAYS: MDAYS, S: S, fmtNum: fmtNum, keyDate: keyDate, leaf: leaf, mCanFav: mCanFav, mClosesIt: mClosesIt, mDay: mDay, mDialG: mDialG, mDialMeasure: mDialMeasure, mDialText: mDialText, mDayTargets: mDayTargets, mIsFav: mIsFav, mMacLine: mMacLine, mMealFitX: mMealFitX, mPortionText: mPortionText, mRank: mRank, mReadSlots: mReadSlots, mSaltNote: mSaltNote, mViewKey: mViewKey, todayKey: todayKey, LIVE: LIVE });
  function mFamilyIds(k) { return PICKROW.mFamilyIds(k); }
  function mpIcon(k) { return PICKROW.mpIcon(k); }
  function mpRowHTML(r, x, fitText, fitX) { return PICKROW.mpRowHTML(r, x, fitText, fitX); }
  function mpLastXs() { return PICKROW.mpLastXs(); }
  function mDefaultX(r) { return PICKROW.mDefaultX(r); }

  /* What you already reach for: starred, or on a plate in the last fortnight.
     Worked out once per list, not per row — see mpHomeBodyHTML. */
  var MP_KNOWN = {};

  /* src/pickbands.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var PICKBANDS = window.HiveParts.pickbands({ BOOKS: BOOKS, MDAYS: MDAYS, S: S, dayKey: dayKey, fmtNum: fmtNum, idOf: idOf, mAllSections: mAllSections, mDay: mDay, mDayTargets: mDayTargets, mDefaultX: mDefaultX, mFamilyIds: mFamilyIds, mGapFresh: mGapFresh, mIsFav: mIsFav, mMacLine: mMacLine, mMealAsk: mMealAsk, mMealHolds: mMealHolds, mMealPool: mMealPool, mNever: mNever, mRank: mRank, mReadSlots: mReadSlots, mShelfKey: mShelfKey, mViewKey: mViewKey, mWideOpen: mWideOpen, matchRank: matchRank, mpRowHTML: mpRowHTML, searchScore: searchScore, todayKey: todayKey, LIVE: LIVE });
  function mpQ() { return PICKBANDS.mpQ(); }
  function mpShelvesHTML() { return PICKBANDS.mpShelvesHTML(); }
  function mpMatches(r, qs) { return PICKBANDS.mpMatches(r, qs); }
  function mpKnownIds() { return PICKBANDS.mpKnownIds(); }
  function mpNamedHTML(shown) { return PICKBANDS.mpNamedHTML(shown); }
  function mpFavsHTML(shown) { return PICKBANDS.mpFavsHTML(shown); }
  function mpPinsHTML(shown) { return PICKBANDS.mpPinsHTML(shown); }
  function mpElseHTML(shown) { return PICKBANDS.mpElseHTML(shown); }
  function mpFitsHTML(skip) { return PICKBANDS.mpFitsHTML(skip); }
  function mpRecentHTML(shown) { return PICKBANDS.mpRecentHTML(shown); }


  /* src/picksheet.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var PICKSHEET = window.HiveParts.picksheet({ S: S, mDay: mDay, mMealSheetParts: mMealSheetParts, mNowMins: mNowMins, mReadSlots: mReadSlots, mSlotOpens: mSlotOpens, mSlotSecs: mSlotSecs, mSlotW: mSlotW, mViewKey: mViewKey, mpHomeBodyHTML: mpHomeBodyHTML, mpIcon: mpIcon, mpShelvesHTML: mpShelvesHTML, pushSheet: pushSheet, rememberOpener: rememberOpener, renderModal: renderModal, todayKey: todayKey });
  function mNextMeal() { return PICKSHEET.mNextMeal(); }
  function mOpenPicker(slotKey, mode) { return PICKSHEET.mOpenPicker(slotKey, mode); }
  function macroPickerHTML() { return PICKSHEET.macroPickerHTML(); }

  /* src/pickgap.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var PICKGAP = window.HiveParts.pickgap({ mDay: mDay, LIVE: LIVE });
  function mDayEaten(k) { return PICKGAP.mDayEaten(k); }
  function mMealHolds(k, sk) { return PICKGAP.mMealHolds(k, sk); }

  /* src/closers.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var CLOSERS = window.HiveParts.closers({ S: S, kcalOf: kcalOf, mComboFor: mComboFor, mDayTargets: mDayTargets, mMealAsk: mMealAsk, mMealHolds: mMealHolds, mReadSlots: mReadSlots, mViewKey: mViewKey, mpMatches: mpMatches, mpQ: mpQ, mpRowHTML: mpRowHTML });
  function mComboGap(k) { return CLOSERS.mComboGap(k); }
  function mpComboHTML(shown) { return CLOSERS.mpComboHTML(shown); }

  /* src/query.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var QUERY = window.HiveParts.query({ fmtNum: fmtNum, mDefaultX: mDefaultX, mMacLine: mMacLine, mRank: mRank, mSaltNote: mSaltNote, mpRowHTML: mpRowHTML, LIVE: LIVE });
  function mQueryKind(q) { return QUERY.mQueryKind(q); }
  function mQueryTopHTML(q, day, targets, pick) { return QUERY.mQueryTopHTML(q, day, targets, pick); }

  /* src/pickhome.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var PICKHOME = window.HiveParts.pickhome({ S: S, keepingFocus: keepingFocus, mDay: mDay, mDayTargets: mDayTargets, mQueryKind: mQueryKind, mQueryTopHTML: mQueryTopHTML, mViewKey: mViewKey, mpComboHTML: mpComboHTML, mpElseHTML: mpElseHTML, mpFitsHTML: mpFitsHTML, mpKnownIds: mpKnownIds, mpLastXs: mpLastXs, mpFavsHTML: mpFavsHTML, mpNamedHTML: mpNamedHTML, mpPinsHTML: mpPinsHTML, mpQ: mpQ, mpRecentHTML: mpRecentHTML, mpShelvesHTML: mpShelvesHTML, LIVE: LIVE });
  function mpHomeBodyHTML() { return PICKHOME.mpHomeBodyHTML(); }
  function refreshMacroPicker() { return PICKHOME.refreshMacroPicker(); }

  /* src/goalwords.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var GOALWORDS = window.HiveParts.goalwords({ MGOALS: MGOALS, mBurn: mBurn });
  function mtGoalWhat(val, pr) { return GOALWORDS.mtGoalWhat(val, pr); }
  function mtPlanLine(plan, pr) { return GOALWORDS.mtPlanLine(plan, pr); }
  var MGOAL_WORDS = GOALWORDS.MGOAL_WORDS;

  /* src/account.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var ACCOUNT = window.HiveParts.account({ S: S, mAccount: mAccount, mSuspectAccount: mSuspectAccount, mSyncAway: mSyncAway, LIVE: LIVE });
  function mAccountBlockHTML() { return ACCOUNT.mAccountBlockHTML(); }

  /* src/foodsearch.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var FOODSEARCH = window.HiveParts.foodsearch({});
  function mNutrients(list) { return FOODSEARCH.mNutrients(list); }
  function mFoodSearch(q, packaged) { return FOODSEARCH.mFoodSearch(q, packaged); }
  function mUsdaBarcode(code) { return FOODSEARCH.mUsdaBarcode(code); }

  /* src/barcode.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var BARCODE = window.HiveParts.barcode({});
  function mDecodeRow(row) { return BARCODE.mDecodeRow(row); }
  function mDecodeFrame(img, w, h) { return BARCODE.mDecodeFrame(img, w, h); }

  window.__ean = mDecodeRow;      // so the tests can read a barcode without a camera

  var MLOOKUP = {};
  /* The food tables, asked once you have stopped typing. Late answers are
     dropped rather than drawn: a slow reply to "tam" must not land on top of
     the results for "tamale". */
  var mLookSeq = 0;

  /* src/lookup.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var LOOKUP = window.HiveParts.lookup({ BUILD: BUILD, S: S, mFoodSearch: mFoodSearch, mUsdaBarcode: mUsdaBarcode, mQueryKind: mQueryKind, LIVE: LIVE });
  function mBarcodeLookup(code) { return LOOKUP.mBarcodeLookup(code); }
  function mLookSay(err, code) { return LOOKUP.mLookSay(err, code); }
  function mLookupRows(list) { return LOOKUP.mLookupRows(list); }
  function mpLookSoon() { return LOOKUP.mpLookSoon(); }
  function mLookNet(term) { return LOOKUP.mLookNet(term); }

  var mCamDone = false;

  /* src/camera.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  /* A barcode you have already saved a food for opens that food: its page,
     over the meal, with the meal's Add on it. Blake fixed a scan's numbers
     from the can (2026-10-11), and the next scan of the same can went back
     to Open Food Facts and offered the wrong ones again as a new food. Your
     own record wins, and nothing is sent anywhere to find it. */
  function mOwnScan(code) {
    var c = String(code || '').replace(/\D/g, '');
    if (!c || !S.macroPick) return false;
    var r = null;
    MFOODS.forEach(function (f) { if (!r && f.code === c) r = f; });
    if (!r) return false;
    S.mpMode = 'home';
    S.foodOpen = { id: r.id, x: 1, slot: S.macroPick.slot, onPlate: false };
    pushSheet({ m: 1 });
    renderModal();
    return true;
  }
  var CAMERA = window.HiveParts.camera({ S: S, mBarcodeLookup: mBarcodeLookup, mDecodeFrame: mDecodeFrame, mLookSay: mLookSay, mLookupRows: mLookupRows, mMealNowHTML: mMealNowHTML, mOwnScan: mOwnScan, renderModal: renderModal, LIVE: LIVE });
  function mScanStop() { return CAMERA.mScanStop(); }
  function mScanStart() { return CAMERA.mScanStart(); }
  function mScanGot(code, typed) { return CAMERA.mScanGot(code, typed); }
  function mNewFoodHTML() { return CAMERA.mNewFoodHTML(); }
  function mNfRefresh() { return CAMERA.mNfRefresh(); }
  function mNfFill(got) { return CAMERA.mNfFill(got); }
  function mNfSize(i) { return CAMERA.mNfSize(i); }
  function mNfAmount(d) { return CAMERA.mNfAmount(d); }
  function mNfAt(pre, i) { return CAMERA.mNfAt(pre, i); }
  function mNfSized(pre) { return CAMERA.mNfSized(pre); }

  /* src/plandays.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var PLANDAYS = window.HiveParts.plandays({ mBurn: mBurn, mLbWord: mLbWord, mMeasuredTdee: mMeasuredTdee, mPlanCalc: mPlanCalc, mReadProfile: mReadProfile, mTargRec: mTargRec, mTrainDays: mTrainDays, mWriteProfile: mWriteProfile, mWriteTargets: mWriteTargets });
  function mMeasuredRowHTML(pr) { return PLANDAYS.mMeasuredRowHTML(pr); }
  function mTrainNSay(n) { return PLANDAYS.mTrainNSay(n); }
  function mBlockN() { return PLANDAYS.mBlockN(); }
  function mSetTrainDays(days) { return PLANDAYS.mSetTrainDays(days); }
  function mDaysChanged() { return PLANDAYS.mDaysChanged(); }
  function mTrainRowHTML() { return PLANDAYS.mTrainRowHTML(); }

  /* src/summary.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var SUMMARY = window.HiveParts.summary({ mDayJudged: mDayJudged, mDaySummary: mDaySummary, mLongDate: mLongDate, mVerdict: mVerdict });
  function mSummaryHTML(k) { return SUMMARY.mSummaryHTML(k); }

  /* src/plansheet.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var PLANSHEET = window.HiveParts.plansheet({ MGOAL_WORDS: MGOAL_WORDS, MPROT_WORDS: MPROT_WORDS, M_WDAY: M_WDAY, S: S, kcalOf: kcalOf, mBlockN: mBlockN, mBodyFat: mBodyFat, mCanSync: mCanSync, mCoachHTML: mCoachHTML, mFavDoneLabel: mFavDoneLabel, mFavPickBodyHTML: mFavPickBodyHTML, mGoalNote: mGoalNote, mGoalPace: mGoalPace, mInfoBtn: mInfoBtn, mInfoText: mInfoText, mMeasuredRowHTML: mMeasuredRowHTML, mPlanCalc: mPlanCalc, mProtLevel: mProtLevel, mReadProfile: mReadProfile, mReadSlots: mReadSlots, mReadTargets: mReadTargets, mScaleLb: mScaleLb, mTrainDays: mTrainDays, mTrainNSay: mTrainNSay, mTrainRowHTML: mTrainRowHTML, mtActNear: mtActNear, mtDash: mtDash, mtFactsHTML: mtFactsHTML, mtGoalWhat: mtGoalWhat, mtMealRow: mtMealRow, mtMealSumHTML: mtMealSumHTML, mtPlanLine: mtPlanLine, mtProtSay: mtProtSay, mtSaidBase: mtSaidBase, mtSaidBurn: mtSaidBurn, mtSaidGoal: mtSaidGoal, mtStatusHTML: mtStatusHTML, mtWhoLine: mtWhoLine });
  function macroTargetsHTML() { return PLANSHEET.macroTargetsHTML(); }

  // keeps two meals added in the same millisecond from sharing a key
  var mtMealSeq = 0;

  /* src/plansteps.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var PLANSTEPS = window.HiveParts.plansteps({ BOOKS: BOOKS, MGOALS: MGOALS, SEC_SHORT: SEC_SHORT, kcalOf: kcalOf, mAllSections: mAllSections, mBurn: mBurn, mGoalPace: mGoalPace, mPlanCalc: mPlanCalc, mProtLevel: mProtLevel, mReadProfile: mReadProfile, mSlotW: mSlotW, mtRefreshPlan: mtRefreshPlan });
  function mtwGo(n) { return PLANSTEPS.mtwGo(n); }
  function mtSaidBase(pr) { return PLANSTEPS.mtSaidBase(pr); }
  function mtActNear(act) { return PLANSTEPS.mtActNear(act); }
  function mtSaidGoal(pr) { return PLANSTEPS.mtSaidGoal(pr); }
  function mtSaidBurn(pr) { return PLANSTEPS.mtSaidBurn(pr); }
  function mtSecSummary(checked) { return PLANSTEPS.mtSecSummary(checked); }
  function mtSecsHTML(checked, open) { return PLANSTEPS.mtSecsHTML(checked, open); }
  function mtMealRow(s) { return PLANSTEPS.mtMealRow(s); }
  function mtProfileFromDom() { return PLANSTEPS.mtProfileFromDom(); }

  /* src/planfacts.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var PLANFACTS = window.HiveParts.planfacts({ MGOAL_WORDS: MGOAL_WORDS, MLINE_NEAR: MLINE_NEAR, MPROT_LEVELS: MPROT_LEVELS, MSTEP_BASE: MSTEP_BASE, M_MONS: M_MONS, kcalOf: kcalOf, mBurn: mBurn, mGoalPace: mGoalPace, mLever: mLever, mMeasuredRowHTML: mMeasuredRowHTML, mPaceFacts: mPaceFacts, mPlanCalc: mPlanCalc, mPretty: mPretty, mProject: mProject, mProtGrams: mProtGrams, mProtLevel: mProtLevel, mProtRefLb: mProtRefLb, mReadSlots: mReadSlots, mReadTargets: mReadTargets, mSlotW: mSlotW, mWeightStats: mWeightStats, todayKey: todayKey });
  function mtProtSay(pr) { return PLANFACTS.mtProtSay(pr); }
  function mtWhoLine(pr) { return PLANFACTS.mtWhoLine(pr); }
  function mtFactsHTML(pr) { return PLANFACTS.mtFactsHTML(pr); }
  function mtStatusHTML(pr) { return PLANFACTS.mtStatusHTML(pr); }
  function mtMealSumHTML() { return PLANFACTS.mtMealSumHTML(); }
  function mCoachHTML(pr) { return PLANFACTS.mCoachHTML(pr); }
  function mGoalNote(pr) { return PLANFACTS.mGoalNote(pr); }

  /* src/planlive.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var PLANLIVE = window.HiveParts.planlive({ MCARB_EAT: MCARB_EAT, kcalOf: kcalOf, mCoachHTML: mCoachHTML, mFloorK: mFloorK, mGoalNote: mGoalNote, mGoalPace: mGoalPace, mPlanCalc: mPlanCalc, mTdee: mTdee, mtFactsHTML: mtFactsHTML, mtGoalWhat: mtGoalWhat, mtMealSumHTML: mtMealSumHTML, mtPlanLine: mtPlanLine, mtProfileFromDom: mtProfileFromDom, mtProtSay: mtProtSay, mtSaidBase: mtSaidBase, mtSaidBurn: mtSaidBurn, mtSaidGoal: mtSaidGoal, mtSecSummary: mtSecSummary, mtStatusHTML: mtStatusHTML, mtWhoLine: mtWhoLine });
  function mtDash(v) { return PLANLIVE.mtDash(v); }
  function mtRefreshAnswer() { return PLANLIVE.mtRefreshAnswer(); }
  function mtRefusal(t, pr, mine) { return PLANLIVE.mtRefusal(t, pr, mine); }
  function mtSecSumSync(row) { return PLANLIVE.mtSecSumSync(row); }
  function mtmShowTotal() { return PLANLIVE.mtmShowTotal(); }
  function mtSyncSave() { return PLANLIVE.mtSyncSave(); }
  function mtRefreshPlan(holdBoxes) { return PLANLIVE.mtRefreshPlan(holdBoxes); }

  /* src/fillday.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var FILLDAY = window.HiveParts.fillday({ MDAYS: MDAYS, dayKey: dayKey, fmtNum: fmtNum, keyDate: keyDate, mBalanceDay: mBalanceDay, mDayTargets: mDayTargets, mEditDay: mEditDay, mExtOk: mExtOk, mFamilyIds: mFamilyIds, mFillRoom: mFillRoom, mNever: mNever, mRank: mRank, mReadSlots: mReadSlots, mSideUp: mSideUp, mSkipped: mSkipped, mSlotClosed: mSlotClosed, mSlotSecs: mSlotSecs, mSlotSpokenFor: mSlotSpokenFor, mSlotsForRecipe: mSlotsForRecipe, mTopUp: mTopUp, mViewKey: mViewKey, renderMacros: renderMacros, LIVE: LIVE });
  function mOnDay(day, id) { return FILLDAY.mOnDay(day, id); }
  function mNearIds(k) { return FILLDAY.mNearIds(k); }
  function mCookScale(x, servN) { return FILLDAY.mCookScale(x, servN); }
  function mScaleWords(f, r) { return FILLDAY.mScaleWords(f, r); }
  function mDraftDay() { return FILLDAY.mDraftDay(); }
  function mFillDay() { return FILLDAY.mFillDay(); }

  /* src/toppers.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var TOPPERS = window.HiveParts.toppers({ MX: MX, mExtOk: mExtOk, mFoodMealOK: mFoodMealOK, mNever: mNever, mOnDay: mOnDay, mReadSlots: mReadSlots, mSaltFibre: mSaltFibre, mSlotClosed: mSlotClosed, mSlotW: mSlotW, mTotals: mTotals, macroFit: macroFit, LIVE: LIVE });
  function mSideUp(day, targets, near) { return TOPPERS.mSideUp(day, targets, near); }
  function mTopUp(day, targets, near) { return TOPPERS.mTopUp(day, targets, near); }
  var MTOP_NA = TOPPERS.MTOP_NA;

  /* src/balance.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var BALANCE = window.HiveParts.balance({ MFOOD_G_MAX: MFOOD_G_MAX, MTOP_NA: MTOP_NA, MW: MW, kcalOf: kcalOf, mDayTargets: mDayTargets, mEditDay: mEditDay, mLadder: mLadder, mMealAsk: mMealAsk, mReadSlots: mReadSlots, mSkipped: mSkipped, mSlotClosed: mSlotClosed, mTotals: mTotals, mViewKey: mViewKey, renderMacros: renderMacros, LIVE: LIVE });
  function mMealWants(day, targets) { return BALANCE.mMealWants(day, targets); }
  function mBalanceDay(day, targets, own) { return BALANCE.mBalanceDay(day, targets, own); }
  function mRebalance() { return BALANCE.mRebalance(); }
  var MX_ALL = BALANCE.MX_ALL;
  var MNA_CAP = BALANCE.MNA_CAP;
  var MNA_W = BALANCE.MNA_W;

  /* src/daycopy.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var DAYCOPY = window.HiveParts.daycopy({ MWEIGHTS: MWEIGHTS, kcalOf: kcalOf, keyDate: keyDate, mDay: mDay, mDayTargets: mDayTargets, mLongDate: mLongDate, mPortionText: mPortionText, mReadSlots: mReadSlots, mTotals: mTotals, mViewKey: mViewKey, LIVE: LIVE });
  function mCopyDay(btn) { return DAYCOPY.mCopyDay(btn); }

  /* src/mealtools.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var MEALTOOLS = window.HiveParts.mealtools({ MFOOD_G_MAX: MFOOD_G_MAX, MNA_CAP: MNA_CAP, MNA_W: MNA_W, MW: MW, fmtNum: fmtNum, kcalOf: kcalOf, keepingFocus: keepingFocus, mBuildFoods: mBuildFoods, mByGram: mByGram, mDay: mDay, mDayTargets: mDayTargets, mEditDay: mEditDay, mLadder: mLadder, mMealAsk: mMealAsk, mNewFoodKey: mNewFoodKey, mReadMyFoods: mReadMyFoods, mReadSlots: mReadSlots, mViewKey: mViewKey, mWriteMyFoods: mWriteMyFoods, renderMacros: renderMacros, LIVE: LIVE });
  function mBalanceMeal(sk, opt) { return MEALTOOLS.mBalanceMeal(sk, opt); }
  function mMealFitX(sk, r) { return MEALTOOLS.mMealFitX(sk, r); }
  function mSaveMeal(sk, name, share) { return MEALTOOLS.mSaveMeal(sk, name, share); }

  /* How many "not that one"s it takes before a meal is allowed to look
     outside its own sections. */
  var MTRY_WIDE = 10;

  /* src/combos.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var COMBOS = window.HiveParts.combos({ MDAYS: MDAYS, mExtOk: mExtOk, mFoodMealOK: mFoodMealOK, LIVE: LIVE });
  function mLevers() { return COMBOS.mLevers(); }
  function mComboFor(share, pick, slot) { return COMBOS.mComboFor(share, pick, slot); }

  /* src/pool.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var M_ALL_SECS = null;
  var POOL = window.HiveParts.pool({ MTRY_WIDE: MTRY_WIDE, M_WDAYS: M_WDAYS, S: S, dayKey: dayKey, kcalOf: kcalOf, keepingFocus: keepingFocus, keyDate: keyDate, mDay: mDay, mDayTargets: mDayTargets, mDoneAt: mDoneAt, mEarliestKey: mEarliestKey, mEditDay: mEditDay, mLatestKey: mLatestKey, mNearIds: mNearIds, mNever: mNever, mOnDay: mOnDay, mRank: mRank, mReadProfileRaw: mReadProfileRaw, mReadSlots: mReadSlots, mSlotSecs: mSlotSecs, mTotals: mTotals, mVerdict: mVerdict, mViewKey: mViewKey, renderMacros: renderMacros, todayKey: todayKey, LIVE: LIVE });
  function mExtOk() { return POOL.mExtOk(); }
  function mMealPool(slot, wide) { return POOL.mMealPool(slot, wide); }
  function mWideOpen(sk) { return POOL.mWideOpen(sk); }
  function mDaySummary(k) { return POOL.mDaySummary(k); }
  function mTryAgain(sk) { return POOL.mTryAgain(sk); }
  function mNavDay(step) { return POOL.mNavDay(step); }

  // ----------------------------------------------------------- shopping list
  /* The list itself is src/list.js. It is handed what it reads of the app's
     and gives back its three, kept under their own names for the callers
     here; none of them is called before the app is up. */
  var LIST = window.HiveParts.list({
    S: S,
    planEntries: planEntries,
    shopQty: shopQty,
    canBuy: canBuy,
    srcW: srcW,
    pwPrice: pwPrice,
    pwMoney: pwMoney
  });
  function buildList(given) { return LIST.buildList(given); }
  function listUsd(built) { return LIST.listUsd(built); }
  function renderList() { LIST.renderList(); }

  // ------------------------------------------------------------- print book
  /* The book itself is src/book.js, handed what it reads of the app's and
     giving back renderBook, kept under its own name for the callers here. */
  var BOOK = window.HiveParts.book({
    S: S,
    BOOKS: BOOKS,
    ONE_BOOK: ONE_BOOK,
    SEC_NOTE: SEC_NOTE,
    SEC_PART: SEC_PART,
    APP_NAME: APP_NAME,
    APP_LINE: APP_LINE,
    diffLabel: diffLabel,
    fillCounts: fillCounts,
    leaf: leaf,
    liftHTML: liftHTML,
    macroLine: macroLine,
    makerHTML: makerHTML,
    no: no,
    ours: ours,
    planIds: planIds,
    varyHTML: varyHTML,
    xref: xref,
    recipes: recipesNow,
    byId: byIdNow
  });
  function renderBook() { BOOK.renderBook(); }

  /* ---- what this household would have to go out for -----------------------
     src/shelf.js, under the names app.js has always called them by. As
     declarations, so they answer from anywhere in this file. */
  function foodSource(key) { return window.Shelf.foodSource(key); }
  function restockSource(key) { return window.Shelf.restockSource(key); }
  function storeCarries(key) { return window.Shelf.storeCarries(key); }
  function itemNeedsBuying(it) { return window.Shelf.itemNeedsBuying(it); }
  function alsoNeeds(r) { return window.Shelf.alsoNeeds(r); }
  function missingFor(r) { return window.Shelf.missingFor(r); }
  function lineNeedsBuying(r, ix) { return window.Shelf.lineNeedsBuying(r, ix); }

  /* src/strip.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var STRIP = window.HiveParts.strip({ S: S });
  function syncStick() { return STRIP.syncStick(); }
  function filtCount() { return STRIP.filtCount(); }
  function syncStrip() { return STRIP.syncStrip(); }
  function onScrollStrip() { return STRIP.onScrollStrip(); }
  function filtersPop(open) { return STRIP.filtersPop(open); }

  /* src/fold.js, handed what it reads of the app's and kept under its own
     names here, as declarations, so they answer from anywhere in this file. */
  var FOLD = window.HiveParts.fold({ S: S });
  function mFoldForget() { return FOLD.mFoldForget(); }
  function mReduced() { return FOLD.mReduced(); }
  function syncShrunk() { return FOLD.syncShrunk(); }
  function onScrollShrink() { return FOLD.onScrollShrink(); }
  function onResizeFold() { return FOLD.onResizeFold(); }

  /* The print downloads and the page scale are the book's (src/book.js). */
  function fitPages() { BOOK.fitPages(); }
  function renderDownloads() { BOOK.renderDownloads(); }

  // --------------------------------------------------------------- detail
  /* The nutrition panel.
   *
   * The score is a sum of five things, and a sum tells you nothing about which
   * of the five it came from — a 60 that is short on sodium and a 60 that is
   * short on protein are different dinners. So show the parts: what each one
   * measured, how much of it the recipe earned, and a bar you can read without
   * doing the division. The bar takes its colour from its own share, so the
   * component that is dragging the score down is the one that looks different.
   */
  /* The maxima come from the scorer, which is where the weights are decided.
     They were written out again here, and a weight changed in one place and
     not the other draws every bar in the panel against the wrong length —
     silently, and looking perfectly reasonable. */
  var W = (window.Nutrition && window.Nutrition.MAX) ||
    { p: 27, k: 18, f: 8, s: 22, b: 13, c: 12 };

  /* ------------------------------------------------------------------------
   * One recipe pointing at another.
   *
   * Nine steps already did this — "No packet? Recipe 265, browned dark, does
   * the same job" — and every one of them had the number typed into the
   * sentence. Which worked exactly until the collection was renumbered, at
   * which point all ten sent the reader to the wrong page, silently, in the
   * printed book. Recipe 265 became recipe 270 and nothing said so.
   *
   * So a step writes {r:265} — the id, which never moves — and the number is
   * filled in where the sentence is drawn, from the same table the contents
   * page is built from. In print it reads "Recipe 270". In the app it is the
   * same words and you can press them.
   * --------------------------------------------------------------------- */
  function xref(text, live) {
    return String(text).replace(/\{r:(\d+)\}/g, function (whole, id) {
      var t = BY_ID[id];
      /* A reference to something that is not there any more. Better a sentence
         that reads a little short than one that sends somebody looking for a
         page that does not exist. */
      if (!t) return 'another recipe';
      var label = 'Recipe ' + String(t.no || t.id).padStart(3, '0');
      if (!live) return label;
      return '<button class="xref" data-open="' + esc(t.id) + '" ' +
        'title="' + esc(t.name) + '">' + esc(label) + '</button>';
    });
  }

  /* Steps carry markup only where xref put it, so the text is escaped first
     and the reference substituted after — never the other way round. */
  function stepHTML(t) { return xref(esc(t), true); }

  /* "Better with a few extras".
   *
   * Everything above this block comes off the storehouse order, and the recipe
   * has to be worth cooking with only that — the whole promise of the book is
   * that the order is enough. But most kitchens have a jar of something, and a
   * cook with garlic and a wedge of parmesan should not have to guess where
   * they would go.
   *
   * So: named, numbered from where the method left off, and separate. Never
   * counted in the macros, never on the shopping list. A recipe that needs its
   * lift to be any good is a recipe that has not been written properly yet. */
  /* Another way to make it, from what the order already carries. Listed
     under the method rather than inside a step, because inside a step it
     read as part of the recipe: Blake, on the sour cream in the waffles,
     "it was hard for me to see that that was even an option." Above the
     lift, since it needs no shopping. Never counted — the numbers are the
     recipe as written. */
  function varyHTML(r, live) {
    var V = r.vary;
    if (!V || !V.length) return '';
    if (!live) {
      return '<div class="vary"><span class="vary-h">' + (V.length > 1 ? 'Variations' : 'Variation') +
        '</span> <span class="vary-p">' + V.map(function (t) { return xref(esc(t), false); }).join(' ') +
        '</span></div>';
    }
    return '<div class="vary">' +
      '<div class="vary-h">' + (V.length > 1 ? 'Variations' : 'Variation') + '</div>' +
      V.map(function (t) { return '<div class="vary-i">' + xref(esc(t), true) + '</div>'; }).join('') +
    '</div>';
  }

  function liftHTML(r, live) {
    var L = r.lift;
    if (!L || !L.steps || !L.steps.length) return '';
    var n = (r.steps || []).length;

    /* On paper it is one dense paragraph; on screen it is numbered steps.
       Same words either way — this is typesetting, not a second copy of the
       text. A screen scrolls and a page does not, and the first version of
       this set the alfredo bake 935px tall against 720 of paper, off the
       bottom of its own sheet even squeezed to the floor. Circles and the gaps
       between them are what a page cannot afford. */
    if (!live) {
      return '<div class="lift"><span class="lift-h">Better with</span> ' +
        '<span class="lift-w">' + esc(L.with) + '</span> ' +
        '<span class="lift-p">' + L.steps.map(function (t) {
          return xref(esc(t), false);
        }).join(' ') + '</span></div>';
    }

    return '<div class="lift">' +
      '<div class="lift-h">Better with a few extras</div>' +
      '<div class="lift-w">' + esc(L.with) + '</div>' +
      '<div class="lift-steps">' + L.steps.map(function (t, i) {
        return '<div class="lift-step"><div class="lift-step-n">' + (n + i + 1) + '</div>' +
          '<div class="lift-step-t">' + xref(esc(t), true) + '</div></div>';
      }).join('') + '</div>' +
    '</div>';
  }

  /* An ingredient this collection has a recipe for.
   *
   * Fifty ingredient lines name something Made, Not Bought produces, and the
   * only version of this that scales is the ingredient line carrying the link
   * itself. The alternative was fifty hand-written sentences, which is the
   * same paragraph printed fifty times and still silent on the fifty-first.
   *
   * Never a recipe pointing at itself: a tortilla recipe pointing at the
   * tortilla recipe is noise, and so is the gravy telling you where to get
   * gravy. */
  function makerFor(r, ix) {
    var M = window.MAKERS;
    var it = (r.ingp || [])[ix];
    if (!M || !it || !it.k) return null;
    var id = M[it.k];
    if (!id || id === r.id) return null;
    if (r.nomake && r.nomake.indexOf(it.k) >= 0) return null;
    /* Any section. This refused a maker from the reader's own section, to
       keep the tortilla recipe from pointing at the tortilla recipe — which
       the line above already does by id — and it also hid the one link that
       mattered most on the Copycat Shelf: taco beef to the taco seasoning
       beside it. */
    return BY_ID[id] || null;
  }

  /* Rendered small and after the line rather than around it, because the
     ingredient is what somebody is reading down the column for. On paper it is
     the number alone — there is nothing to press, and "Recipe" in front of it
     four times in one list is four words nobody needs. */
  function makerHTML(r, ix, live) {
    var t = makerFor(r, ix);
    if (!t) return '';
    var num = String(t.no || t.id).padStart(3, '0');
    if (!live) return ' <i class="ing-make">' + num + '</i>';
    return ' <button class="ing-make" data-open="' + esc(t.id) + '" ' +
      'title="' + esc('Make it yourself: ' + t.name) + '">' + num + '</button>';
  }

  function scoreParts(r) {
    return [
      { k: 'Protein', ab: 'Prot', v: r.sc.pPct + '%', p: r.sc.p, max: W.p, t: r.sc.pPct + '% of the calories come from protein' },
      { k: 'Calories', ab: 'Cal', v: r.macro.kcal, p: r.sc.k, max: W.k, t: r.macro.kcal + ' kcal a serving' },
      { k: 'Fat', ab: 'Fat', v: r.sc.fPct + '%', p: r.sc.f, max: W.f, t: r.sc.fPct + '% of the calories come from fat' },
      { k: 'Sodium', ab: 'Sod', v: r.sc.na + ' mg', p: r.sc.s, max: W.s, t: r.sc.na + ' mg of sodium a serving' },
      { k: 'Fiber', ab: 'Fib', v: r.sc.fib + ' g', p: r.sc.b, max: W.b, t: r.sc.fib + ' g of fiber a serving' },
      /* Named for what it measures rather than for carbohydrate, because
         carbohydrate is not what costs the points. A recipe can be most of the
         way to a hundred grams of it and lose nothing here, so long as the
         fiber came with it. */
      { k: 'Refined carbs', ab: 'Carb', v: r.sc.cPct + '%', p: r.sc.c, max: W.c,
        t: r.sc.cPct + '% of the calories are carbohydrate with no fiber beside it' }
    ];
  }

  function nutritionHTML(r) {
    if (r.score === null || !r.sc) return '';

    /* Shut, this is a score and a line of figures. No chart: a bar you have to
       decode is not a summary, and every version that tried to be both ended up
       taller than the recipe it belonged to.

       The reasoning lives behind the leaf, where it can afford to be legible —
       one part per row, what the recipe actually did, how far that got it, and
       a bar you can read across at a glance. Nobody is charged for it until
       they ask, and the leaf is what they will press when they wonder. */
    var parts = scoreParts(r);
    var bandOf = function (c) {
      var share = c.max ? c.p / c.max : 0;
      return share >= 0.8 ? 'good' : share >= 0.45 ? 'ok' : 'low';
    };

    /* Each track is the same length and fills by the share of that part's
       points the recipe earned, so six rows can be compared straight down the
       column. What each part is worth is in the number beside it — tracks
       scaled to the weights made fat, at ten points, too short to read. */
    var why = S.why
      ? '<div class="nut-why">' +
          '<div class="why-head">Why ' + r.score + ' out of 100</div>' +
          parts.map(function (c) {
            var b = bandOf(c);
            return '<div class="why-part">' +
              '<div class="why-top">' +
                '<b>' + esc(c.k) + '</b>' +
                '<span class="why-fact">' + esc(c.t) + '</span>' +
                '<span class="why-pts wp-' + b + '">' + c.p + '<u>/' + c.max + '</u></span>' +
              '</div>' +
              '<div class="why-bar"><i class="nb-' + b + '" style="width:' +
                ((c.max ? c.p / c.max : 0) * 100).toFixed(1) + '%"></i></div>' +
            '</div>';
          }).join('') +
          '<div class="why-note">Protein and fiber earn points. Calories, fat, ' +
            'sodium and refined carbs spend them. A gram of fiber covers ten ' +
            'grams of carbohydrate, so oats cost nothing here and sugar costs ' +
            'the lot. Every figure is an estimate from a food table, not a ' +
            'label.</div>' +
        '</div>'
      : '';

    var m = r.macro;
    return '<div class="nut nut-' + scoreBand(r.score) + (S.why ? ' nut-open' : '') + '">' +
      /* The leaf is the control. It is the thing you are already looking at
         when you wonder why, so it is the thing that answers. */
      '<button class="nut-leaf" data-why aria-expanded="' + (S.why ? 'true' : 'false') +
        '" title="' + (S.why ? 'Hide the breakdown' : 'Why this score?') + '">' +
        leaf(r.score, 'leaf-big') +
      '</button>' +
      '<div class="nut-body">' +
        why +
        /* Whole grams. These are estimates off a food table, so 28.5g of protein
           claims a precision that is not there — and the half gram was the
           difference between one line and two on a phone. Fiber keeps its
           decimal below a gram, where rounding would print 0.2g as none. */
        '<div class="nut-foot" title="' + esc(m.kcal + ' kcal, ' + m.p + 'g protein, ' +
          m.c + 'g carbohydrate, ' + m.f + 'g fat, ' + m.na + ' mg sodium, ' + m.fib + 'g fiber') + '">' +
          [m.kcal + ' kcal', Math.round(m.p) + 'g P', Math.round(m.c) + 'g C',
            Math.round(m.f) + 'g F', m.na + 'mg S',
            (m.fib < 1 ? m.fib : Math.round(m.fib)) + 'g Fib']
            .map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('<i>&middot;</i>') +
        '</div>' +
        /* A leaf gives no sign it can be pressed, and a control nobody finds is
           a control nobody has. Shut, there is room to spare under the leaf, so
           saying it in words costs nothing. */
        '<button class="nut-ask" data-why aria-expanded="' + (S.why ? 'true' : 'false') + '">' +
          (S.why ? 'Hide the breakdown' : 'Why this score?') +
        '</button>' +
      '</div>' +
    '</div>';
  }

  /* ------------------------------------------------------------ focus
   * Keeping the keyboard where the hands left it.
   *
   * Every control in here changes state and then re-renders its whole
   * container with innerHTML, which throws away the element that was pressed.
   * With a mouse nobody notices. On a keyboard the focus falls to the body, so
   * ticking one thing off the shopping list means tabbing back through
   * everything above it to reach the next — and the same for scaling a recipe,
   * changing units, or opening the breakdown.
   *
   * The control is found again by its own data attributes, which are what make
   * it that control rather than another one: the tick for milk is
   * [data-check="milk"] before the render and after it.
   */
  var FOCUS_ATTRS = ['data-am', 'data-check', 'data-add', 'data-day', 'data-fav', 'data-why', 'data-td',
    'data-pwq', 'data-pwing', 'data-pwingx', 'data-wmid',
    'data-src', 'data-srcpick', 'data-weekbuy', 'data-near', 'data-low', 'data-kitmore', 'data-kitpill', 'data-copyorder', 'data-stepgo',
    'data-cal', 'data-calweek', 'data-calagain', 'data-calfrom', 'data-caltpl',
    'data-addday', 'data-pswap', 'data-prate', 'data-adf', 'data-adadd', 'data-adsw', 'data-adopen', 'data-pwpick', 'data-pwsee', 'data-pwback', 'data-pwpre', 'data-pwmore', 'data-pwwant', 'data-pwopen', 'data-dayopen', 'data-dsact', 'data-listmark', 'data-fold',
    'data-scale', 'data-units', 'data-sync', 'data-edit', 'data-open', 'data-close', 'data-ed',
    'data-mopen', 'data-mview', 'data-meopen', 'data-msaved', 'data-mskipask', 'data-mskipgo', 'data-mskipno', 'data-mtray', 'data-mswapx', 'data-mstep', 'data-mdel', 'data-mpick', 'data-mtarg', 'data-mlock', 'data-mpin', 'data-mfav', 'data-mtry', 'data-mdot', 'data-medit', 'data-mskip', 'data-msend',
    'data-mtsex', 'data-mtgoal', 'data-mtext', 'data-mtact', 'data-mtprot', 'data-mtedit', 'data-mtmfold', 'data-mtsec', 'data-mtfree', 'data-mtuse', 'data-mtw', 'data-mysync', 'data-mpnew', 'data-mplook', 'data-nf', 'data-nfpick', 'data-nfsize', 'data-nfamt', 'data-scan',
    'data-mmore', 'data-fppick', 'data-fpmore', 'data-nfcode', 'data-mpmode', 'data-mpshelf', 'data-mpkind', 'data-mpspot', 'data-mweek', 'data-mfold', 'data-mtrain', 'data-mtdee', 'data-mpfav', 'data-mline', 'data-mchart', 'data-mchartopen', 'data-mbal', 'data-mfmenu', 'data-mmenu', 'data-mamt', 'data-mswap', 'data-mmove', 'data-mmoveto', 'data-mexplode', 'data-mkeep', 'data-mkdo', 'data-mfood', 'data-mpills', 'data-mtrained', 'data-mgotrain', 'data-mtsync', 'data-mwhy', 'data-mdo', 'data-mallow', 'data-mbatch', 'data-mbsave', 'data-mbforget', 'data-minfo', 'data-mcrng', 'data-mfrom', 'data-mcopy', 'data-mfsadd', 'data-mfsmeal', 'data-mffix', 'data-mffno', 'data-mffsave'];

  function focusKey(el) {
    if (!el || el === document.body || !el.getAttribute) return null;
    /* The view tabs are written once in index.html and never re-rendered, so
       there is nothing to find again — and they carry ids now, for the panels
       that name themselves after them. Keyed by those ids, a tab still holding
       focus from the click that opened a sheet pulled it straight back out of
       the sheet: New recipe lost its Name box to the Recipes tab. */
    if (el.getAttribute('role') === 'tab') return null;
    var parts = [];
    FOCUS_ATTRS.forEach(function (a) {
      if (el.hasAttribute && el.hasAttribute(a)) {
        parts.push('[' + a + '="' + String(el.getAttribute(a)).replace(/"/g, '\\"') + '"]');
      }
    });
    if (parts.length) return parts.join('');
    return el.id ? '#' + el.id : null;
  }

  /* Which control opened the overlay that is up. Focus is moved into a sheet
     when it opens and Escape closes it — both already true — but closing it
     dropped the keyboard on the body, so leaving a recipe meant tabbing back
     down the whole collection to reach the card you had just been on. */
  var opener = null;
  function rememberOpener() { opener = focusKey(document.activeElement); }
  function restoreOpener() {
    if (!opener) return;
    var el;
    try { el = document.querySelector(opener); } catch (e) { el = null; }
    opener = null;
    if (el && el.focus) el.focus();
  }

  function keepingFocus(fn) {
    var key = focusKey(document.activeElement);
    fn();
    if (!key) return;
    var back;
    try { back = document.querySelector(key); } catch (e) { back = null; }
    if (!back || !back.focus) return;
    /* Focus without scrolling to it.
     *
       A plain focus() brings its element into view, and this runs AFTER the
       scroll position has been restored — so it overrode the restore and
       moved the list under the finger. It went unnoticed while the element
       usually vanished on a re-render (focus fell to the body and nothing
       scrolled); the moment picked rows started staying put, every tap on a
       picker row jumped the list to wherever that row had moved to.
     *
       preventScroll is ignored by browsers that do not know it, which leaves
       them exactly where they were before. */
    try { back.focus({ preventScroll: true }); } catch (e) { back.focus(); }
  }

  function renderModalInner() {
    /* Read by the service-worker reload in index.html, which must not throw
       away a recipe somebody is in the middle of typing. */
    window.__editing = !!S.editId;
    var root = $('modalRoot');
    /* Nourish's sheets carry its sizes — a thumb's worth for every control,
       13 pixels at the least for type — without restyling every other tab's
       sheets, which share this root. */
    root.classList.toggle('m-sheets', S.view === 'macros');

    // a re-render triggered by a sync update should not scroll the sheet back
    // to the top, lose a half-typed code, or reroll the suggested one
    var prev = root.querySelector('.scrim');
    var keepScroll = prev ? prev.scrollTop : 0;
    var draft = root.querySelector('#joinCode');
    if (draft) S.joinDraft = draft.value;
    // and the name being typed for a dinner share; once left, it has been kept (or refused)
    var dname = root.querySelector('#dinerName');
    if (dname) S.dinerDraft = dname === document.activeElement ? dname.value : null;
    // same bargain for the picker's search: a sync emit must not eat the query
    /* One box. It was three — #mpFind, #mpSearch and #mpLookIn — one per
       screen, back when the picker had three. Two of those screens went in
       v283 and the fallbacks outlived them, quietly asking for elements that
       can no longer be rendered. */
    var mq = root.querySelector('#mpFind');
    if (mq) S.mpQuery = mq.value;

    /* Re-rendering the editor would throw away half-typed text, so it is drawn
       once when it opens and left alone; the only thing that redraws is the
       nutrition preview under the ingredients. */
    if (S.editId) {
      if (!prev || !prev.querySelector('.ed-sheet')) {
        root.innerHTML = editorHTML();
        document.body.style.overflow = 'hidden';
        var nm = root.querySelector('#edName');
        if (nm) nm.focus();
      }
      return;
    }

    /* A recipe opened from the picks draws over them; back comes back. */
    if (S.addOpen && !S.openId) {
      root.innerHTML = addHTML();
      document.body.style.overflow = 'hidden';
      if (keepScroll) root.querySelector('.scrim').scrollTop = keepScroll;
      return;
    }
    if (S.tdSheet && !S.openId) {
      root.innerHTML = tdSheetHTML();
      document.body.style.overflow = 'hidden';
      return;
    }
    if (S.daySheet && !S.openId) {
      root.innerHTML = daySheetHTML();
      document.body.style.overflow = 'hidden';
      return;
    }
    if (S.pwOpen && !S.openId) {
      root.innerHTML = pwHTML();
      document.body.style.overflow = 'hidden';
      if (keepScroll) root.querySelector('.scrim').scrollTop = keepScroll;
      return;
    }
    if (S.syncOpen) {
      root.innerHTML = syncHTML();
      document.body.style.overflow = 'hidden';
      var j = root.querySelector('#joinCode');
      if (j) j.value = S.joinDraft;
      if (keepScroll) root.querySelector('.scrim').scrollTop = keepScroll;
      return;
    }

    if (S.newFood) {
      if (!prev || !prev.querySelector('#nfName')) {
        root.innerHTML = mNewFoodHTML();
        mNfRefresh();                  // the % Daily Values of what arrived filled in
        document.body.style.overflow = 'hidden';
        /* The caret in the name only when there is a name to type. A food
           that arrived looked up already has one, and on a phone the focus
           put the keyboard over the page, hiding the amount and its Add
           (2026-10-18). */
        var nn = root.querySelector('#nfName');
        if (nn && !S.newFood.pre) nn.focus();
      }
      return;
    }

    if (S.keepMeal) {
      if (!prev || !prev.querySelector('#mkName')) {
        root.innerHTML = mKeepHTML();
        document.body.style.overflow = 'hidden';
        var mk = root.querySelector('#mkName');
        if (mk) mk.focus();
      }
      return;
    }

    if (S.chartOpen) {
      root.innerHTML = macroChartHTML();
      document.body.style.overflow = 'hidden';
      if (keepScroll) root.querySelector('.scrim').scrollTop = keepScroll;
      return;
    }

    if (S.favPick) {
      root.innerHTML = mFavPickHTML();
      document.body.style.overflow = 'hidden';
      if (keepScroll) root.querySelector('.scrim').scrollTop = keepScroll;
      return;
    }

    if (S.mCopyFrom) {
      root.innerHTML = mCopyFromHTML();
      document.body.style.overflow = 'hidden';
      if (keepScroll) root.querySelector('.scrim').scrollTop = keepScroll;
      return;
    }

    if (S.foodOpen) {
      root.innerHTML = mFoodSheetHTML();
      if (!root.innerHTML) { S.foodOpen = null; }       // the food is gone; nothing to show
      else {
        if (S.foodOpen.fix) mFsFixRefresh();            // what the fix changes, read off the boxes just drawn
        document.body.style.overflow = 'hidden';
        if (keepScroll) root.querySelector('.scrim').scrollTop = keepScroll;
        return;
      }
    }

    if (S.macroPick && !S.openId) {
      /* The camera is a live device, not markup: re-rendering the sheet
         underneath it would tear down the stream and start a second one on
         every keystroke elsewhere. So scan mode is drawn once, and left. */
      /* Drawn once and left, for as long as scan's own markup is up — not
         only while the video is, which a finished scan takes away with the
         lookup result still to be read beneath it. */
      var already = prev && prev.querySelector('#scanRoot');
      if (!(S.mpMode === 'scan' && already)) {
        /* The list holds still when the meal's foods above it change. They
           are up in the page now (myday.js, sheetOnHTML), so a food added
           from the list grows them by a row and a removed one shrinks them,
           and putting the scroll back where it was would slide the list
           under your thumb by that much. iPhones do not anchor the scroll
           themselves, and the sheet is a new element each draw anyway; so
           the list's top is measured before and put back after. At the top
           of the sheet there is nothing to hold. */
        var oldList = keepScroll && prev.querySelector('#mpList');
        var listAt = oldList ? oldList.getBoundingClientRect().top : null;
        root.innerHTML = macroPickerHTML();
        document.body.style.overflow = 'hidden';
        /* The second pin (search and shelves) sits under the first (the
           meal's header and pills), whatever height that came out. */
        var mtop = root.querySelector('.msh-top'), msht = root.querySelector('.msheet');
        if (mtop && msht) msht.style.setProperty('--msh-top', mtop.offsetHeight + 'px');
        if (keepScroll) root.querySelector('.scrim').scrollTop = keepScroll;
        var newList = listAt !== null && root.querySelector('#mpList');
        if (newList) root.querySelector('.scrim').scrollTop += newList.getBoundingClientRect().top - listAt;
        // Scan is a way in, not a button inside one: choosing it opens the lens
        if (S.mpMode === 'scan' && !mCamDone && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          mScanStart();
        }
      }
      return;
    }

    /* How the day went. Read-only, so unlike the sheets below it there is
       nothing to protect from a redraw — it can be rebuilt whenever. */
    if (S.mDoneOpen) {
      root.innerHTML = mSummaryHTML(S.mDoneOpen);
      document.body.style.overflow = 'hidden';
      root.classList.remove('hide');
      var xb = root.querySelector('.sheet-x');
      if (xb) xb.focus();
      return;
    }

    if (S.macroTargOpen) {
      /* Drawn once and left alone, like the editor: the profile boxes are a
         draft, and a sync emit arriving mid-keystroke must not reset them to
         whatever is saved. */
      if (!prev || !prev.querySelector('.mt-sheet')) {
        root.innerHTML = macroTargetsHTML();
        document.body.style.overflow = 'hidden';
        mtmShowTotal();
      }
      return;
    }

    var r = S.openId ? BY_ID[S.openId] : null;
    if (!r) { root.innerHTML = ''; document.body.style.overflow = ''; return; }
    document.body.style.overflow = 'hidden';

    var f = S.scale;
    var fav = window.Store.isFav(r.id);
    /* fmtNum for every size, not just the halves: a recipe opened from the
       Macros day can arrive at 2½× or ⅝×, and "2.5×" beside quantities
       printed in fraction glyphs read as two different apps. */
    var scaleLabel = mScaleWords(f, r) || (fmtNum(f) + '×');

    root.innerHTML = '<div class="scrim no-print" data-close="1">' +
      '<div class="sheet" role="dialog" aria-modal="true" aria-label="' + esc(r.name) + '">' +
        '<div class="sheet-top">' +
          '<div class="sheet-eyebrow">' + esc([(BOOKS[r.book] || BOOKS[3]).name, r.secName]
            .filter(function (x, i, a) { return i === 0 || x !== a[0]; })
            .concat('No. ' + no(r)).join(' · ')) + '</div>' +
          '<button class="sheet-x" data-close="1" aria-label="Close">&times;</button>' +
        '</div>' +
        '<h2 class="sheet-name">' + esc(r.name) + '</h2>' +
        (r.tagline ? '<div class="sheet-tag">' + esc(r.tagline) + '</div>' : '') +
        '<div class="sheet-meta"><span>' + esc(r.time) + '</span><span>' + esc(diffLabel(r.diff)) + '</span>' +
          '<span>' + esc(r.macro ? r.macro.kcal + ' kcal · ' + r.macro.p + 'g protein' : 'No nutrition data') + '</span>' +
        '</div>' +
        nutritionHTML(r) +
        '<div class="sheet-h-row">' +
          /* Both options shown, not just the current one. A single pill reading
             "cups" is indistinguishable from a label — nothing about it says
             there is another state to get to, so it reads as a caption on the
             ingredients rather than a control over them. Showing the pair makes
             the choice visible before it is made. */
          '<div class="sheet-h">Ingredients' +
            '<span class="unitseg" role="group" aria-label="Show ingredients in">' +
              '<button data-units="cups" aria-pressed="' + (S.units === 'cups') + '">cups</button>' +
              '<button data-units="grams" aria-pressed="' + (S.units === 'grams') + '">grams</button>' +
            '</span>' +
          '</div>' +
          '<div class="scaler">' +
            '<span class="sheet-serv">' + esc(r.servings) + '</span>' +
            '<div class="scaler-box">' +
              '<button data-scale="down" aria-label="Halve">&minus;</button>' +
              '<div class="scaler-val">' + scaleLabel + '</div>' +
              '<button data-scale="up" aria-label="Double">+</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="sheet-ing">' + r.ing.map(function (i, ix) {
          return '<div' + (lineNeedsBuying(r, ix) ? ' class="ing-buy"' : '') + '>' +
            esc(S.units === 'grams'
              ? gramIng(i, (r.ingp || [])[ix], f)
              : scaleIng(i, f)) + makerHTML(r, ix, true) + '</div>';
        }).join('') + '</div>' +
        '<div class="sheet-h" style="margin-top:24px;margin-bottom:10px">Method</div>' +
        '<div class="sheet-steps">' + r.steps.map(function (t, i) {
          return '<div class="sheet-step"><div class="sheet-step-n">' + (i + 1) + '</div>' +
            '<div class="sheet-step-t">' + stepHTML(t) + '</div></div>';
        }).join('') + '</div>' +
        varyHTML(r, true) +
        liftHTML(r, true) +
        /* The line that answers "do I have to go out for anything?", asked of
           the pantry rather than of the storehouse order the book was written
           against. This is the whole point of the pantry being editable: stop
           keeping salsa verde and every recipe using it starts saying so. */
        (function () {
          var m = missingFor(r);
          if (!m.length) return '';
          return '<div class="sheet-extras">' +
            (window.Store.pantryChanged() || srcKind() === 'own' ? 'Not on your shelf: '
              : srcKind() === 'sh' ? 'Needs items not on the standard storehouse list: '
                : 'Needs things ' + srcW().the + ' doesn\u2019t carry: ') +
            esc(m.join(', ')) + '.</div>';
        })() +
        (function () {
          var also = alsoNeeds(r);
          return also.length ? '<div class="sheet-extras" data-also="1">Also needs: ' + esc(also.join(', ')) + '.</div>' : '';
        })() +
        '<div class="sheet-actions"><div class="sheet-actions-in">' +
          /* Icons, not words. "Save" and "Edit" spelled out took enough of the
             row that the seven days wrapped onto a second line on a phone, and
             the days are the thing this row is for. */
          '<button class="iconbtn" data-fav="' + esc(r.id) + '" aria-pressed="' + fav + '" ' +
            'title="' + (fav ? 'Saved to favorites' : 'Save to favorites') + '" ' +
            'aria-label="' + (fav ? 'Saved to favorites' : 'Save to favorites') + '">' +
            (fav ? '★' : '☆') + '</button>' +
          '<button class="iconbtn" data-edit="' + esc(r.id) + '" title="Edit this recipe" ' +
            'aria-label="Edit this recipe">✎</button>' +
          '<span class="addto">Add to</span>' +
          /* Seven equal columns rather than seven things that wrap. A week that
             breaks across two lines reads as two groups of days, and which days
             land together depends on the width of the phone. */
          '<div class="daybar">' +
            DAYS.map(function (d) {
              var on = window.Store.day(d[0]).some(function (e) { return e.id === r.id; });
              return '<button class="daybtn" data-add="' + esc(r.id) + '" data-day="' + d[0] +
                '" aria-pressed="' + on + '">' + d[2] + '</button>';
            }).join('') +
          '</div>' +
          (f !== 1 ? '<span class="addto addto-x">' + (mScaleWords(f, r) || ('at &times;' + fmtNum(f))) + '</span>' : '') +
        '</div></div>' +
      '</div></div>';

    if (keepScroll) root.querySelector('.scrim').scrollTop = keepScroll;
  }

  // ------------------------------------------------------------- asking
  /* The browser's own prompt() and confirm() work, but on a phone they arrive
     looking like a warning from the browser rather than a question from the
     app, and they cannot be styled or read out sensibly. These are the same
     three questions in the app's own voice. They sit above everything else,
     including the editor, so "delete this recipe?" can be asked while it is
     open. */
  var D = null;

  function ask(opts, done) {
    D = { title: opts.title, body: opts.body || '', value: opts.value,
      ok: opts.ok || 'OK', danger: !!opts.danger, done: done, pushed: !popping };
    pushSheet({ d: 1 });
    renderDialog();
  }

  function closeDialog(answer) {
    var d = D;
    D = null;
    /* The entry this dialog pushed, unwound — unless we are already inside a
       popstate, which is what removed it. */
    if (d && d.pushed && !popping) { depth = Math.max(0, depth - 1); history.back(); }
    renderDialog();
    if (d && d.done) d.done(answer);
  }

  function renderDialog() {
    var root = $('dialogRoot');
    if (!D) { root.innerHTML = ''; return; }
    /* The question names the dialog and the box it asks you to fill: a box
       with only a value in it was read out as "edit text, This Week", which
       says what is there and not what is being asked. */
    root.innerHTML = '<div class="scrim dlg-scrim no-print" data-dlg="cancel">' +
      '<div class="dlg" role="dialog" aria-modal="true" aria-labelledby="dlgT"' +
        (D.body ? ' aria-describedby="dlgB"' : '') + '>' +
        '<h2 class="dlg-t" id="dlgT">' + esc(D.title) + '</h2>' +
        (D.body ? '<div class="dlg-b" id="dlgB">' + esc(D.body) + '</div>' : '') +
        (D.value !== undefined
          ? '<input class="txt" id="dlgInput" aria-labelledby="dlgT" value="' + esc(D.value) + '">' : '') +
        '<div class="dlg-a">' +
          '<button class="btn-primary' + (D.danger ? ' danger' : '') + '" data-dlg="ok">' + esc(D.ok) + '</button>' +
          '<button class="ghost" data-dlg="cancel">Cancel</button>' +
        '</div>' +
      '</div></div>';
    var i = $('dlgInput');
    if (i) { i.focus(); i.select(); }
    else root.querySelector('[data-dlg="ok"]').focus();
  }

  function dialogAnswer() {
    var i = $('dlgInput');
    return i ? i.value : true;
  }

  // ------------------------------------------------------------ the editor
  /* A recipe you write is measured exactly as the printed ones were: its
     ingredient lines go through the same parser and the same food table, and
     the score comes out of the same five-part formula. That is what
     data/nutrition.js is — see tools/build-data.js. If the parser cannot place
     an ingredient the panel says which, because a recipe half-priced is worse
     than one not priced at all if you do not know it happened. */
  function measured(form) {
    var N = window.Nutrition;
    var ing = lines(form.ing), steps = lines(form.steps);
    var servN = parseFloat(form.servings) || 1;
    var est = N ? N.nutritionFor(ing, servN, form.extras, N.parseLine, N.FOODS, N.SPICE_NAMES)
      : { perServing: { kcal: 0, p: 0, c: 0, f: 0, na: 0, fib: 0 }, items: [], unmatched: [] };

    var macro = est.perServing;
    var typed = form.kcal !== '' && !isNaN(parseFloat(form.kcal));
    if (typed) {
      macro = {
        kcal: num(form.kcal), p: num(form.p), c: num(form.c), f: num(form.f),
        na: macro.na, fib: macro.fib   // sodium and fiber still come from the ingredients
      };
    }
    var s = macro.kcal > 0 && N ? N.scoreFrom(macro) : null;

    /* No undefined anywhere in here. Firestore refuses a write that carries one
       and takes the whole update down with it, while localStorage quietly drops
       it — so a recipe that saved perfectly well on one device would fail to
       reach the other, and only the sync test would ever have found out. */
    var rec = {
      id: form.id,
      book: form.book, secNum: form.secNum,
      secName: form.secName || 'Ours',
      name: form.name || 'Untitled',
      servings: form.servings || '1 Serving', servN: servN,
      ing: ing, steps: steps, ingp: est.items,
      macro: macro, tagline: form.tagline !== undefined ? form.tagline : null,
      score: s ? s.score : null, sc: s ? s.sc : null,
      diff: form.diff || 'Easy', time: form.time || '',
      extras: form.extras || null,
      est: !typed, own: !!form.own
    };
    if (est.unmatched.length) rec.unpriced = est.unmatched;
    return rec;
  }

  function lines(s) {
    return String(s || '').split('\n').map(function (x) { return x.trim(); })
      .filter(function (x) { return x.length; });
  }
  function num(v) { var n = parseFloat(v); return isFinite(n) ? Math.round(n) : 0; }

  function editorForm() {
    // whatever is on screen right now, so the preview can follow the typing
    var g = function (id) { var e = $(id); return e ? e.value : ''; };
    var base = S.editBase || {};
    return {
      id: base.id, book: base.book, secNum: base.secNum, own: base.own,
      name: g('edName'),
      /* The Section field is only drawn for a recipe you wrote, so on a
         printed one g() found no element and returned '' — which measured()
         then read as "no section given" and replaced with 'Ours'. Correcting a
         typo in No. 12 moved it out of its own section and into yours. */
      secName: $('edSection') ? g('edSection') : (base.secName || ''),
      /* Same shape of loss: the tagline is not on the form at all, and
         measured() used to hard-code it to null, so editing a printed recipe
         threw away the line under its name on every card. */
      tagline: base.tagline,
      servings: g('edServings'),
      time: g('edTime'), diff: g('edDiff'), ing: g('edIng'), steps: g('edSteps'),
      extras: g('edExtras'), kcal: g('edKcal'), p: g('edP'), c: g('edC'), f: g('edF')
    };
  }

  function editorHTML() {
    var b = S.editBase;
    var own = !!b.own;
    var preview = S.editPreview;
    var scoreBit = preview && preview.score !== null
      ? '<div class="ed-score"><strong>' + preview.score + '</strong> out of 100 · ' +
        preview.macro.kcal + ' kcal · ' + preview.macro.p + 'g protein · ' +
        preview.macro.na + ' mg sodium · ' + preview.macro.fib + 'g fiber' +
        '<div class="ed-hint">Worked out from the ingredients, the same way the printed ones were.</div>' +
        (preview.unpriced
          ? '<div class="ed-warn">Not counted, because the food table has no entry: ' +
            esc(preview.unpriced.join(', ')) + '. Everything else is in.</div>' : '') +
        '</div>'
      : '<div class="ed-score ed-score-none">Add ingredients and the calories, sodium, fiber and ' +
        'score work themselves out.</div>';

    var row = function (label, id, val, ph, cls) {
      return '<label class="ed-f' + (cls ? ' ' + cls : '') + '"><span>' + label + '</span>' +
        '<input class="txt" id="' + id + '" value="' + esc(val || '') + '" placeholder="' + esc(ph || '') + '"></label>';
    };

    return '<div class="scrim no-print" data-close="1">' +
      '<div class="sheet ed-sheet" role="dialog" aria-modal="true" aria-label="Recipe">' +
        '<div class="sheet-top">' +
          '<div class="sheet-eyebrow">' + (own ? (b.isNew ? 'A new recipe' : 'Yours') :
            BOOKS[b.book].name + ' &middot; changing a printed recipe') + '</div>' +
          '<button class="sheet-x" data-close="1" aria-label="Close">&times;</button>' +
        '</div>' +

        row('Name', 'edName', b.name, 'Grandma’s rolls') +
        (own ? row('Section', 'edSection', b.secName, 'Ours') : '') +
        '<div class="ed-row">' +
          row('Servings', 'edServings', b.servings, '4 Servings') +
          row('Time', 'edTime', b.time, '35 mins') +
          '<label class="ed-f"><span>Effort</span><select class="txt" id="edDiff">' +
            ['Easy', 'Medium', 'In-Depth'].map(function (d) {
              return '<option value="' + d + '"' + (b.diff === d ? ' selected' : '') + '>' + diffLabel(d) + '</option>';
            }).join('') +
          '</select></label>' +
        '</div>' +

        '<label class="ed-f"><span>Ingredients &mdash; one a line</span>' +
          '<textarea class="txt ed-ta" id="edIng" rows="7" placeholder="2 cups flour&#10;1 tsp salt&#10;1 packet yeast">' +
          esc((b.ing || []).join('\n')) + '</textarea></label>' +

        scoreBit +

        '<label class="ed-f"><span>Method &mdash; one step a line</span>' +
          '<textarea class="txt ed-ta" id="edSteps" rows="7" placeholder="Warm the milk to blood heat.&#10;Stir in the yeast and leave ten minutes.">' +
          esc((b.steps || []).join('\n')) + '</textarea></label>' +

        row('Needs beyond the staples', 'edExtras', b.extras, 'Nothing, or: Buttermilk, Nutmeg') +

        '<details class="ed-more"' + (S.editMacros ? ' open' : '') + '><summary>Set the calories yourself</summary>' +
          '<div class="ed-hint">Only if you have real numbers. Leave these empty and they come from the ' +
          'ingredients. Sodium and fiber always do.</div>' +
          '<div class="ed-row ed-row4">' +
            row('kcal', 'edKcal', b.typedMacro ? b.macro.kcal : '', '') +
            row('Protein g', 'edP', b.typedMacro ? b.macro.p : '', '') +
            row('Carbs g', 'edC', b.typedMacro ? b.macro.c : '', '') +
            row('Fat g', 'edF', b.typedMacro ? b.macro.f : '', '') +
          '</div>' +
        '</details>' +

        '<div class="ed-actions">' +
          '<button class="btn-primary" data-ed="save">Save</button>' +
          '<button class="ghost" data-ed="cancel">Cancel</button>' +
          (own && !b.isNew ? '<button class="ghost ed-del" data-ed="delete">Delete this recipe</button>' : '') +
          (!own && b.edited ? '<button class="ghost ed-del" data-ed="revert">Put the book’s version back</button>' : '') +
        '</div>' +
      '</div></div>';
  }

  function editorAction(what) {
    if (what === 'cancel') { S.editId = null; S.editBase = null; renderModal(); restoreOpener(); return; }

    if (what === 'delete' || what === 'revert') {
      var id = S.editBase.id;
      ask(what === 'delete'
        ? { title: 'Delete “' + (S.editBase.name || 'this recipe') + '”?',
            body: 'It goes from both phones, and from any week it is in.',
            ok: 'Delete it', danger: true }
        : { title: 'Put the printed version back?',
            body: 'Your changes are dropped. The recipe returns to what the book says.',
            ok: 'Undo my changes', danger: true },
        function (yes) {
          if (!yes) return;
          window.Store.deleteRecipe(id);
          S.editId = null; S.editBase = null;
          renderModal();
        });
      return;
    }

    var rec = measured(editorForm());
    if (!rec.name || rec.name === 'Untitled') { ask({ title: 'Give it a name first.' }); return; }
    if (!rec.ing.length) { ask({ title: 'A recipe needs at least one ingredient.' }); return; }
    window.Store.saveRecipe(rec);
    S.editId = null; S.editBase = null;
    S.openId = rec.id;          // straight into the recipe you just wrote
    S.scale = 1;
    renderAll();
  }

  /* Only the preview under the ingredients redraws while you type, so nothing
     you have typed anywhere else can be lost to a re-render. */
  function refreshPreview() {
    var box = document.querySelector('.ed-score');
    if (!box) return;
    S.editPreview = measured(editorForm());
    var p = S.editPreview;
    if (p.score === null) {
      box.className = 'ed-score ed-score-none';
      box.innerHTML = 'Add ingredients and the calories, sodium, fiber and score work themselves out.';
      return;
    }
    box.className = 'ed-score';
    box.innerHTML = '<strong>' + p.score + '</strong> out of 100 · ' +
      p.macro.kcal + ' kcal · ' + p.macro.p + 'g protein · ' +
      p.macro.na + ' mg sodium · ' + p.macro.fib + 'g fiber' +
      '<div class="ed-hint">Worked out from the ingredients, the same way the printed ones were.</div>' +
      (p.unpriced ? '<div class="ed-warn">Not counted, because the food table has no entry: ' +
        esc(p.unpriced.join(', ')) + '. Everything else is in.</div>' : '');
  }

  function openEditor(id) {
    var b;
    if (id === 'new') {
      b = {
        id: window.Store.newRecipeId(), own: true, isNew: true, book: 3, secNum: 1,
        secName: 'Ours', name: '', servings: '4 Servings', time: '', diff: 'Easy',
        ing: [], steps: [], extras: '', macro: {}
      };
    } else {
      var r = BY_ID[id];
      if (!r) return;
      b = Object.assign({}, r, { own: typeof r.id === 'string', typedMacro: !r.est });
      b.book = r.book; b.secNum = r.secNum;
    }
    S.editBase = b;
    S.editMacros = !!b.typedMacro;
    S.editPreview = b.ing && b.ing.length ? measured(Object.assign({}, b, {
      ing: b.ing.join('\n'), steps: (b.steps || []).join('\n'),
      /* All four, or none. kcal was carried across and the other three were
         not, so the panel that opens with the editor recomputed a recipe with
         its calories and no protein at all — a score tens of points below the
         one on the card the reader had just tapped, until they touched a
         field and refreshPreview put it right. */
      kcal: b.typedMacro ? b.macro.kcal : '',
      p: b.typedMacro ? b.macro.p : '',
      c: b.typedMacro ? b.macro.c : '',
      f: b.typedMacro ? b.macro.f : ''
    })) : null;
    S.openId = null;
    rememberOpener();
    S.editId = id;
    pushSheet({ e: String(id) });
    renderModal();
  }

  // ----------------------------------------------------------------- sync UI
  /* What the household lost that this phone kept (Store.removed — see
     keepRemoved in sync.js), and the two answers to it. It does not say
     who removed it: most often it is the other person deleting their own
     recipe, and this is only here for the times it was not. */
  function syncGoneHTML() {
    var gone = window.Store.removed ? window.Store.removed() : [];
    if (!gone.length) return '';
    var KIND = { mine: 'recipe', edits: 'change to a printed recipe', weeks: 'week' };
    var names = gone.slice(0, 6).map(function (x) {
      return '<li>' + esc(x.name || 'Untitled') + ' <span class="sync-note">(' + KIND[x.k] + ')</span></li>';
    }).join('') + (gone.length > 6 ? '<li>and ' + (gone.length - 6) + ' more</li>' : '');
    return '<div class="sync-gone">' +
      '<p class="sync-p">Taken out of the shared pantry on another phone. This one kept ' +
        (gone.length === 1 ? 'a copy' : 'copies') + ':</p>' +
      '<ul class="sync-gone-l">' + names + '</ul>' +
      '<div class="sync-row">' +
        '<button class="btn-primary" data-sync="restore">Put ' + (gone.length === 1 ? 'it' : 'them') + ' back</button>' +
        '<button class="ghost" data-sync="forgetgone">Leave ' + (gone.length === 1 ? 'it' : 'them') + ' out</button>' +
      '</div></div>';
  }

  /* Said once each, when it first happens, wherever you are: something the
     household lost, and this phone's storage refusing a save. The sheet
     says the first for as long as it stands; the second has no other
     place to be seen. */
  var mGoneSeen = -1, mHouseFullSaid = false;
  function mHouseNotices() {
    var n = window.Store.removed ? window.Store.removed().length : 0;
    if (mGoneSeen >= 0 && n > mGoneSeen) {
      mToast(n === 1 ? 'Something was taken out of the shared pantry on another phone. Sync &amp; sharing can put it back.'
        : n + ' things were taken out of the shared pantry on another phone. Sync &amp; sharing can put them back.');
    }
    mGoneSeen = n;
    /* Joining a pantry that had already planned this phone's week: the
       household's dinners stand, and hers went to a template with nothing
       on screen to say so. Said once, with where to find them. */
    var parked = window.Store.parkedNote ? window.Store.parkedNote() : null;
    if (parked && parked.length) {
      var and = function (l) { return l.length > 1 ? l.slice(0, -1).join(', ') + ' and ' + l[l.length - 1] : l[0]; };
      mToast('Your dinners for ' + esc(and(parked.map(function (x) { return x.dates; }))) +
        ' are kept as the template' + (parked.length > 1 ? 's ' : ' ') +
        esc(and(parked.map(function (x) { return '‘' + x.name + '’'; }))) + ' — Plan › Cook this again');
    }
    var full = !!window.Store.storageFull;
    if (full && !mHouseFullSaid) {
      mToast('This phone’s storage for the app is full, so changes to the plan and recipes aren’t kept on it' +
        (window.Store.house ? ' — they still go to the shared pantry while there’s signal.' : '. Free some space to keep them.'));
    }
    mHouseFullSaid = full;
  }

  /* ---------------------------------------------------- a dinner's numbers
   *
     Plan my week holds a dinner to a Nourish plan, and a household can have
     more than one in it. Blake: "what if my wife has a different plan?" She
     makes hers on her own phone, signed in, and shares it from here.
   *
     Here and not in the plan's own sheet, because this is the sheet that
     says what goes where — your day is private, the pantry is shared — and
     this is the one thing that crosses from the first to the second. The two
     things it needs, an account and a pantry, are set up on this same sheet,
     so whatever is missing is one look up.
   *
     Only a dinner's calories and protein go, a third of the day as Plan my
     week works it out (pwFitCaps), under a name the person chooses.
     Remembered on this phone and for this account only: somebody else
     signing in here shares nothing until they say so. */
  var DINER_PREF = 'sh.diner';
  function dinerPref() {
    try { var v = JSON.parse(localStorage.getItem(DINER_PREF)); return v && typeof v === 'object' ? v : {}; }
    catch (e) { return {}; }
  }
  function dinerPrefSave(v) { try { localStorage.setItem(DINER_PREF, JSON.stringify(v)); } catch (e) { /* private */ } }
  function dinerOn() { var me = mAccount(), pr = dinerPref(); return !!me && pr.on === 1 && pr.u === me.uid; }
  // the name it goes under: the one given here, or the first word of the account's
  function dinerName() {
    var me = mAccount(), pr = dinerPref();
    if (!me) return '';
    if (pr.u === me.uid && typeof pr.n === 'string' && pr.n.trim()) return pr.n.trim().slice(0, 30);
    return String(me.name || '').trim().split(/\s+/)[0].slice(0, 30);
  }
  // what would go: nothing at all before there is a plan to take it from
  function dinerEntry(n) {
    if (!kcalOf(mReadTargets())) return null;
    var c = pwFitCaps();
    return { n: n, kc: Math.max(150, Math.min(3000, c.kc)), p: Math.max(0, Math.min(400, c.p)) };
  }
  /* The household's copy of mine, made what this phone's targets say now.
     Written only when it differs, so it is safe to call after any change. */
  function dinerKeep() {
    if (!window.Store.setMyDiner || !window.Store.house || !dinerOn()) return;
    var me = mAccount(), e = dinerEntry(dinerName());
    if (!e || !e.n) return;
    var had = window.Store.diners()[me.uid];
    if (had && had.n === e.n && had.kc === e.kc && had.p === e.p) return;
    window.Store.setMyDiner(e);
  }
  /* Once for each account and household as they become known: a phone
     with the switch on that joins a pantry, or signs in to one, brings its
     numbers with it. Not on every snapshot, or a phone with the switch on
     would put back what the same account had taken away on another. */
  /* And once more after a refusal, each time the household comes back from
     the server changed. The switch said "the household didn't take them",
     the rules were published, and nothing was sent again until the app was
     reopened. Never on the refusal's own echo, which changes nothing: a
     household still on the old rules costs one refused write per change in
     it, not a loop of them. */
  var dinerSeen = '', dinerRetry = -1;
  function dinerWatch() {
    var me = mAccount(), key = (me ? me.uid : '') + '|' + (window.Store.house || '');
    if (!me || window.Store.status !== 'synced') return;
    if (!window.Store.dinerRefused) dinerRetry = -1;
    else if (dinerRetry < 0) dinerRetry = window.Store.heard;
    else if (window.Store.heard !== dinerRetry) { dinerRetry = window.Store.heard; dinerSeen = ''; }
    if (key === dinerSeen) return;
    dinerSeen = key;
    dinerKeep();
  }
  function syncDinerHTML() {
    if (!window.Store.configured || !window.Store.setMyDiner) return '';
    var me = mAccount(), house = window.Store.house;
    if (!me || !house) {
      return '<p class="sync-note sync-diner">' + (!me && !house
        ? 'Sign in and join a pantry to share your dinner numbers with the household.'
        : !me ? 'Sign in above to share your dinner numbers with the household.'
          : 'Join a pantry to share your dinner numbers with the household.') + '</p>';
    }
    var on = dinerOn(), e = dinerEntry('');
    if (!e && !on) {
      return '<p class="sync-note sync-diner">Make your plan in Nourish, then share your dinner numbers from here.</p>';
    }
    var name = typeof S.dinerDraft === 'string' ? S.dinerDraft : dinerName();
    return '<div class="sync-diner">' +
      '<div class="sync-dinrow"><span id="dinerL">Share my dinner numbers with the household</span>' +
        '<button class="kit-tog" data-sync="diner" role="switch" aria-checked="' + on + '" aria-labelledby="dinerL"></button></div>' +
      '<div class="sync-row"><input class="txt" id="dinerName" maxlength="30" autocomplete="given-name" ' +
        'placeholder="Your name" aria-label="The name to share them under" value="' + esc(name) + '"></div>' +
      '<p class="sync-note">Only a dinner’s calories and protein go to the household — not your weight or what you eat.' +
        (e ? ' Yours: ' + e.kc + ' cal · ' + e.p + ' g protein a dinner.' : '') + '</p>' +
      (S.dinerMsg ? '<div class="sync-warn">' + esc(S.dinerMsg) + '</div>' : '') +
      (on && window.Store.dinerRefused ? '<div class="sync-warn">The household didn’t take them. Its sharing rules ' +
        'need publishing again: see SETUP.md, step 4.</div>' : '') +
    '</div>';
  }

  /* On your home screen: installing the app from inside it, with the offer
     the browser made on this visit (src/boot.js keeps it, and says why: the
     ⋮ menu's install once refused it as "already installed" when it was
     not). A button only when there is an offer to take; the
     rest is one line saying where things stand, so a phone that is never
     offered one says so, rather than the section quietly not being there.
     A note, not a paragraph (kit-say, not sync-p): the sheet keeps its
     paragraphs to the two that say what is private and what is shared. */
  function installHTML() {
    var I = window.Install;
    if (!I) return '';
    var st = I.state();
    var say = {
      app: 'You are in the installed app.',
      done: 'Installed. Open Hive &amp; Hearth from your home screen; it works with no signal.',
      wait: 'Installing. It appears on your home screen in a moment.',
      no: 'Not installed. Open the app again to be offered it again.',
      ios: 'On an iPhone or iPad: in Safari, tap Share, then <b>Add to Home Screen</b>.',
      '': 'This browser is not offering to install the app on this visit. If it is on your home screen already, open it from there.'
    };
    return '<div class="mt-div">On your home screen</div>' +
      (st === 'offer'
        ? '<p class="kit-say">Hive &amp; Hearth as an app of its own: on your home screen, without the browser around it, and working with no signal.</p>' +
          '<div class="sync-row"><button class="btn-primary" data-sync="install">Install the app</button></div>'
        : '<p class="kit-say" role="status">' + say[st] + '</p>');
  }
  function healthSyncHTML() {
    if (!window.Health || !window.Health.available()) return '';
    var st = window.Health.state();
    var ago = window.Health.lastSync() ? agoWords(window.Health.lastSync()) : '';
    var tSteps = window.Health.todaySteps();
    if (st === 'granted') {
      return '<div class="mt-div">Health Connect</div>' +
        '<div class="kit-row"><span><b>Google Health Connect</b><small>Steps, sleep, weight, meals &amp; workouts' +
        (tSteps > 0 ? ' \u00b7 ' + Math.round(tSteps).toLocaleString('en-US') + ' steps today' : '') +
        (ago ? ' \u00b7 ' + ago : '') + '</small></span>' +
        '<button class="ghost" data-mysync="health-sync">Sync now</button></div>';
    }
    if (st === 'update_required') {
      return '<div class="mt-div">Health Connect</div>' +
        '<p class="kit-say">Update Health Connect in Google Play to sync your steps, sleep, weight, meals and workouts.</p>' +
        '<div class="sync-row"><button class="ghost" data-mysync="health-install">Open Health Connect</button></div>';
    }
    if (st === 'unavailable') {
      return '<div class="mt-div">Health Connect</div>' +
        '<p class="kit-say">Health Connect is not available on this device. Manual entry works as usual.</p>';
    }
    return '<div class="mt-div">Health Connect</div>' +
      '<p class="kit-say">Sync steps, sleep and scale weight from your phone or watch, and log your meals, weigh-ins and workouts to Health Connect.</p>' +
      '<div class="sync-row"><button class="btn-primary" data-mysync="health-connect">Connect Health Connect</button></div>';
  }
  function syncHTML() {
    var st = window.Store.status;
    var configured = window.Store.configured;
    var house = window.Store.house;
    var dotCls = st === 'synced' ? 'dot on' : st === 'error' ? 'dot off'
      : (st === 'sending' || st === 'waiting') ? 'dot wait' : 'dot';
    var ago = window.Store.lastSync ? agoWords(window.Store.lastSync) : '';
    /* Sync is a thing that either works or has visibly stopped — so the line
       says which, and nothing else. It used to narrate every intermediate
       state in a full sentence apiece, which is a lot of prose about a
       background job that is almost always simply fine. */
    var label = !configured ? 'On this device only'
      : st === 'synced' ? 'Shared' + (ago ? ' · ' + ago : '')
        : st === 'connecting' ? 'Connecting…'
          : st === 'sending' ? 'Sending…'
            : st === 'waiting' ? 'Offline · sent when there is signal'
              : st === 'error' ? 'Sharing stopped' : 'On this device only';

    var body;
    if (!configured) {
      body = '<p class="sync-p">No server behind this copy. See <strong>SETUP.md</strong>.</p>';
    } else if (!house) {
      body = '<div class="sync-code" id="newCode">' + esc(S.pendingCode) + '</div>' +
        '<div class="sync-row">' +
          '<button class="btn-primary" data-sync="use">Use this code</button>' +
          '<button class="ghost" data-sync="reroll">Another</button>' +
        '</div>' +
        '<div class="sync-row">' +
          '<input class="txt" id="joinCode" placeholder="Or type a code you have" aria-label="Pantry code">' +
          '<button class="ghost" data-sync="join">Join</button>' +
        '</div>' +
        /* The one thing worth a sentence, because anyone who has the code can
           write to the list and there is no undoing having handed it out. */
        '<div class="sync-warn">Anyone with the code can see and change the list.</div>';
    } else {
      /* An invite link replaces reading the code out: it lets in one person,
         once, and is dead in a week. Only for an account — the rules want to
         know who is handing out the door. */
      var invite = !mAccount()
        ? '<p class="sync-note">Sign in above to invite someone with a link.</p>'
        : S.inviteUrl
          ? '<div class="sync-row"><input class="txt" id="inviteUrl" readonly value="' + esc(S.inviteUrl) +
              '" aria-label="Invite link"></div>' +
            '<div class="sync-row">' +
              (navigator.share ? '<button class="btn-primary" data-sync="inviteshare">Send</button>' : '') +
              '<button class="ghost" data-sync="invitecopy">' + (S.inviteCopied ? 'Copied' : 'Copy link') + '</button>' +
            '</div>' +
            '<p class="sync-note">Works once, for 7 days.</p>'
          : '<div class="sync-row"><button class="btn-primary" data-sync="invite"' +
              (S.inviteMaking ? ' disabled' : '') + '>' +
              (S.inviteMaking ? 'Making a link\u2026' : 'Invite someone') + '</button></div>';
      body = invite +
        '<div class="sync-code">' + esc(house) + '</div>' +
        (window.Store.statusNote ? '<div class="sync-warn">' + esc(window.Store.statusNote) + '</div>' : '') +
        /* The box to type somebody else's code, kept. A second phone signed
           in to its own account makes a pantry of its own the moment it has
           a favourite (mHouseReconcile), and the box went with the screen
           for having none: she was read the code, and had nowhere to type
           it but behind Stop sharing here. */
        '<div class="sync-row">' +
          '<input class="txt" id="joinCode" placeholder="Join another pantry: its code" aria-label="Code of another pantry to join">' +
          '<button class="ghost" data-sync="join">Join</button>' +
        '</div>' +
        (S.joinMsg ? '<div class="sync-warn">' + esc(S.joinMsg) + '</div>' : '') +
        syncGoneHTML() +
        '<div class="sync-row"><button class="ghost" data-sync="leave">Stop sharing here</button></div>';
    }
    var inviteLine = S.inviteMsg ? '<div class="sync-warn">' + esc(S.inviteMsg) + '</div>'
      : mInviteGet() && !mAccount()
        ? '<div class="sync-warn">You have been invited to a pantry. Sign in above to join it.</div>' : '';

    /* Two things travel and they are not the same promise: the pantry is
       shared with PEOPLE by handing out a code, and My Day is carried between
       YOUR OWN devices by being you. Merging them into one undifferentiated
       sheet made the app read as one confusing thing with two kinds of
       secret. Two cards, split by whose it is, each saying who can see it —
       and the personal one first, because it is the one with a name on it. */
    return '<div class="scrim no-print" data-close="1">' +
      '<div class="sheet sync-sheet" role="dialog" aria-modal="true" aria-label="Sync and sharing">' +
        '<div class="sheet-top">' +
          '<div class="sheet-eyebrow">Sync &amp; sharing</div>' +
          '<button class="sheet-x" data-close="1" aria-label="Close">&times;</button>' +
        '</div>' +

        '<div class="mt-div">Your day</div>' +
        '<p class="sync-p">Your plan, meals and weigh-ins. Private to you. Signed in, ' +
        'your pantry comes with you to every device too.</p>' +
        mAccountBlockHTML() +
        healthSyncHTML() +

        (window.Door ? '<div class="mt-div">What you want help with</div>' +
          [['d', 'Dinners and the shopping', 'Tonight\u2019s dinner and the list'], ['e', 'Eating well', 'What is left to eat'], ['w', 'A workout that fits', 'The next workout']].map(function (o) {
            var on = window.Door.help()[o[0]];
            return '<div class="kit-row"><span><b>' + o[1] + '</b><small>' + (on ? 'Today shows ' + o[2].charAt(0).toLowerCase() + o[2].slice(1) : 'Off: not on Today') + '</small></span>' +
              '<button class="kit-tog" role="switch" data-sync="help" data-v="' + o[0] + '" aria-checked="' + on + '" aria-label="' + o[1] + ' on Today"></button></div>';
          }).join('') + '<p class="kit-say">Only what Today shows. Every tab stays where it is.</p>' : '') +
        '<div class="mt-div">Your kitchen</div>' +
        '<button class="kit-row" data-sync="where"><span><b>Where your staples come from</b><small>' + esc(SRC_WORDS[srcKind()].pick) +
          (window.Store.opt('buy', true) ? '' : ' \u00b7 only what I have') + '</small></span><i aria-hidden="true">\u203a</i></button>' +
        '<button class="kit-row" data-sync="pantry"><span><b>What you keep on hand</b><small>' + kitItems().filter(function (i) { return i.on; }).length + ' on hand</small></span><i aria-hidden="true">\u203a</i></button>' +

        '<div class="mt-div">Your pantry</div>' +
        '<p class="sync-p">The shopping list, the week&rsquo;s meals and your favorites &mdash; shared ' +
        'with whoever you invite. Without an account or a code they stay on this device.</p>' +
        inviteLine +
        body +
        syncDinerHTML() +
        '<div class="sync-status"><span class="' + dotCls + '"></span>' + esc(label) +
          '<span class="sync-build">Build ' + esc(BUILD) + '</span></div>' +
        // said here for as long as it is so, not only in the one toast
        (window.Store.storageFull ? '<p class="sync-warn">This phone’s storage for the app is full, so changes to the plan and recipes aren’t kept on it' +
          (house ? '; they still go to the shared pantry while there’s signal.' : '. Free some space to keep them.') + '</p>' : '') +

        installHTML() +

        /* The app's one screen of settings for the whole of it, so the
           light-or-dark choice lives here. Auto is the phone's own. */
        (window.Theme ? '<div class="mt-div" id="syncThemeH">Appearance</div>' +
          '<div class="sync-theme"><span class="seg" role="group" aria-labelledby="syncThemeH">' +
            [['', 'Auto'], ['light', 'Light'], ['dark', 'Dark']].map(function (o) {
              return '<button data-sync="theme" data-v="' + o[0] + '" aria-pressed="' + (window.Theme.get() === o[0]) + '">' + o[1] + '</button>';
            }).join('') + '</span>' +
            '<span class="sync-theme-say" role="status">' + (window.Theme.get() ? 'On this device' : 'Follows your phone') + '</span></div>' : '') +

        /* The one screen somebody opens to find out what this thing is, so it
           is where the app says who it is not. */
        '<div class="sync-disclaim">Not an official product of The Church of Jesus Christ of ' +
          'Latter-day Saints, and not affiliated with or endorsed by the Church.</div>' +
      '</div></div>';
  }

  /* Two questions, and the badge was answering neither.

     "Is this the thing I press to share with my wife?" — it said Local, which
     is a state, and nothing suggested it could be pressed at all.

     "Have my changes reached her?" — it said Offline, which is network
     jargon for a Firestore snapshot served out of the local cache, and covers
     three situations a person would want told apart: an app half a second old
     that has not heard back yet, a phone holding a change that has not gone
     anywhere, and a phone that has lost signal but has nothing waiting. Only
     the middle one means anything is at risk, and it was the one nobody could
     see.

     So: the word is always about sharing, and the state answers whether the
     others have it.

       Share       not sharing at all — press this
       Syncing…    joined, waiting on the first word from the server
       Sending…    a change here has not been acknowledged yet
       No signal   nothing of ours is waiting; we may be missing theirs
       Synced      the others have everything this phone has
       Sync issue  it has stopped, and the sheet says why
  */
  var SYNC_WORD = {
    local: 'Share', connecting: 'Syncing…', sending: 'Sending…',
    waiting: 'No signal', synced: 'Synced', error: 'Sync issue'
  };
  var SYNC_TIP = {
    local: 'Saving on this phone only. Tap to share one list with other phones.',
    connecting: 'Joined. Waiting to hear back — tap for the code.',
    sending: 'A change on this phone has not reached the others yet. It will go by itself.',
    waiting: 'No signal. Everything here has been sent; you may not have their latest yet.',
    synced: 'The other phones have everything this one has. Tap for the code.',
    error: 'Sharing has stopped. Tap to see why — nothing has been lost.'
  };

  /* "Synced" on its own is a claim without a date on it, and the question
     underneath it is always how long ago. Minutes for the first hour, then
     hours; past a day it stops being reassurance and the sheet says so. */
  function agoWords(ms) {
    if (!ms) return '';
    var s = Math.max(0, Math.round((Date.now() - ms) / 1000));
    if (s < 45) return 'just now';
    var m = Math.round(s / 60);
    if (m < 60) return m + (m === 1 ? ' minute ago' : ' minutes ago');
    var h = Math.round(m / 60);
    if (h < 24) return h + (h === 1 ? ' hour ago' : ' hours ago');
    var d = Math.round(h / 24);
    return d + (d === 1 ? ' day ago' : ' days ago');
  }

  /* The bench for the day planner, in the spirit of __ean above: the barcode
     tests need a reader without a camera, and this needs a day without a
     screen.
   *
     Fill picks at random from the top three fits, so two settings can only be
     compared honestly over the SAME days — which means hundreds of them, which
     is only affordable with nothing rendering in between. Seeding is the
     bench's own job: it overrides Math.random before calling in, so no source
     of randomness has to be plumbed through the app to be controlled.

     Read-only from the app's point of view — nothing here is reachable from
     the interface, and nothing in the interface calls it. */
  window.__macroLab = {
    forget: function () { delete MDAYS[mViewKey()]; },
    // a stand-in for your account's record, listened to as sign-in listens to the real one (tests/dayyears.test.js)
    acct: mSyncAttach,
    newFoodKey: mNewFoodKey,
    draft: mDraftDay,
    balance: function () {
      var t = mDayTargets(mViewKey());
      mEditDay(mViewKey(), function (d) { mBalanceDay(d, t); });
    },
    targets: function () { return mDayTargets(mViewKey()); },
    dayTargets: mDayTargets,
    // the week's carb cycle, floor and all, so a test reads the floor the app uses
    cycle: function () { return mCycleOf(mReadTargets()); },
    measured: mMeasuredTdee,
    tryAgain: mTryAgain,
    assumed: function () { var k = mViewKey(); return mAssumed(mDay(k), mDayTargets(k), mReadSlots()); },
    face: mPlanFace,
    tdee: mTdee,
    summary: mSummaryHTML,
    daySummary: mDaySummary,
    ask: function (sk) { return mMealAsk(sk, mDayTargets(mViewKey()), mReadSlots()); },
    // a meal's pills and a card's ring for given figures, as myday.js colours them (tests/macros-meal.test.js)
    caps: function (sub, aim) { return MYDAY.capsHTML(sub, aim, null, false); },
    ring: function (got, want, m) { return MYDAY.mRingOf(got, want, m); },
    beadsSay: function (M) { return MYDAY.mBeadsSay(M, MYDAY.mBeadsOf(M)); },
    // the menu's sync dot, from a sync state, account trouble and an account (tests/mealviews.test.js)
    syncTone: function (st, bad, acct) { return DAYSYNC.mSyncTone(st, bad, acct); },
    // what a tap puts down for a food never logged, sized to this meal (mMealFitX): the app's own number, not a test's copy
    mealFit: function (sk, id) { return mMealFitX(sk, BY_ID[id]); },
    slotFor: function (id) { var sl = mSlotForRecipe(BY_ID[id], mReadSlots()); return sl ? sl.k : null; },
    /* The profile as the app reads it — weight from the scale, not the stale
       copy in storage. Exposed so a test can check the arithmetic against the
       number actually used instead of keeping its own copy of the averaging
       rule, which is how the mFoodServing duplicate drifted. */
    profile: mReadProfile,
    /* The merge, so the rules that decide what survives a second device can
       be asserted without one. The closed-day rule in particular is easy to
       get wrong in a way no single-device test would ever notice. */
    merge: mMergeRemote,
    /* And what this device would SEND, for the same reason. Half of a sync
       bug lives on the sending side — a day the payload never mentions is a
       day the other phone never hears has changed — and that half is
       invisible to a test that only exercises the merge. */
    payload: mSyncPayload,
    // every keyed part, off the one table, whether or not this device has anything stamped in it yet
    keyedParts: function () { return MSYNC_KEYED.map(function (r) { return r.part; }); },
    // the corrected clock and what corrects it, the day count, and what a lookup says
    now: function () { return mNow(); },
    clockHear: mClockHear,
    clockSent: function (t) { mClkSent = t; },
    dayN: mDayN,
    lookSay: mLookSay,
    nutrients: mNutrients,
    foodSearch: mFoodSearch,
    /* What the next push would actually send, so a test can weigh it against
       the whole. */
    partial: function () { return mSyncPartial(); },
    /* Exactly what a push takes, and taking it counts — so a test walks the
       same states a real session does. */
    takePush: function () { return mSyncTake(); },
    dirty: function () { return mDirty; },
    /* And "this device is right", because the sheet that carries the button
       only renders signed in, and the bug it once had — a number written
       over the weight map — was invisible until the next weigh-in. */
    claim: mClaimAll,
    /* The plan calculator and the pace facts, so a test can ask for the
       figures instead of re-deriving the arithmetic beside them. */
    plan: mPlanCalc,
    pace: mPaceFacts,
    /* And what the solver prices each meal against, so a test can hold it
       to the figure on the meal's own pills without re-running the descent
       — which the day-level terms can win on their own. */
    wants: function () { return mMealWants(mDay(mViewKey()), mDayTargets(mViewKey())); },
    /* The account half's state, and the door that sets it. A reachability
       failure used to be overwritten by the next call to this, and that
       overwrite is only visible if a test can make the second call. */
    syncState: function () { return S_SYNC_STATE; },
    syncStart: function () { return mSyncStart(); },
    bodyFat: mBodyFat,
    /* Protein as the plan counts it: the grams, the pounds they are counted
       against, how far a squeezed cut may take them, and the level chosen. */
    protein: function (pr) {
      return { g: mProtGrams(pr), ref: mProtRefLb(pr), floor: mProtFloorG(pr), level: mProtLevel(pr) };
    },
    /* When each meal opens, in minutes after midnight, and what an add to
       one would be — so the clock rule can be asked about without a picker. */
    opens: function () {
      var list = mReadSlots().list;
      return list.map(function (sl, i) { return { k: sl.k, at: mSlotOpens(list, i) }; });
    },
    addsEaten: mAddsEaten,
    judged: mDayJudged,
    trained: function (k) { return { said: mTrainedSaid(k), on: mIsTrainingDay(k) }; },
    setTrained: mSetTrained,
    floorK: mFloorK,
    /* The gauge's band rule, because it only bites in a narrow window and no
       arbitrary day's plates land in it — asked through the DOM the test
       passed with the rule removed. */
    gauge: mGauge,
    /* Every single food the day can draw on, as records. A food reaches a
       plate by a different road from a recipe — built here at boot rather
       than in the build — so "one calorie, four-four-nine" has to be provable
       on this road too, and MFOODS is a closure variable no test could see.
       A test that reached for `window.MFOODS` found undefined and passed on
       an empty list, which is the vacuous green this seam exists to stop. */
    foods: function () { return MFOODS; },
    /* The lever bench and the combo builder, so how CLOSE a combo lands can be
       measured over hundreds of shares rather than eyeballed on one. */
    levers: function () {
      var b = mLevers(), out = {};
      ['p', 'f', 'c'].forEach(function (d) {
        out[d] = b[d].map(function (e) {
          return { id: e.r.id, name: e.r.name, purity: e.pur };
        });
      });
      return out;
    },
    /* The foods that close the open meal, in the order the levers rank them,
       BEFORE the list dedupes them against the bands above. What a row ends
       up under is a rendering question; which food each rung opens on is the
       rule, and it stopped being observable in the DOM the moment a food you
       ate yesterday started being claimed by "Recent" instead. */
    closers: function () {
      var gap = mComboGap(mViewKey());
      if (!gap) return null;
      var c = mComboFor(gap, { p: 0, f: 0, c: 0 }, S.macroPick && S.macroPick.slot);
      return c && c.map(function (e) {
        return { m: e.m, id: e.r.id, name: e.r.name, x: e.x };
      });
    },
    combo: function (share, pick) {
      var c = mComboFor(share, pick);
      return c && c.map(function (e) {
        return { m: e.m, id: e.r.id, name: e.r.name, x: e.x,
          p: (e.r.macro.p || 0) * e.x, f: (e.r.macro.f || 0) * e.x,
          c: (e.r.macro.c || 0) * e.x, kcal: (e.r.macro.kcal || 0) * e.x };
      });
    },
    /* Why was this dish not chosen? The ranking, for one meal, on the day as
       it currently stands — the same call Fill makes, so the answer is the
       real one. */
    rank: function (slotKey, top) {
      var day = MDAYS[mViewKey()] || {};
      var targets = mDayTargets(mViewKey());
      var slot = null;
      mReadSlots().list.forEach(function (s) { if (s.k === slotKey) slot = s; });
      if (!slot) return [];
      var pool = mMealPool(slot, mWideOpen(slotKey));
      return mRank(pool, day, targets, slot).slice(0, top || 12).map(function (e) {
        var m = (e.r.macro) || {};
        return { id: e.r.id, name: e.r.name, score: e.score, x: e.x,
          kcal: m.kcal || 0, p: m.p || 0, f: m.f || 0, c: m.c || 0, na: m.na || 0 };
      });
    },
    /* Everything a scoring pass needs, per meal: the share it was given, and
       for each plate the dish's own numbers beside the portion chosen — so a
       reader can tell "a big dish at ×1" from "a small dish at ×3", which is
       the distinction every question about portioning turns on. */
    read: function () {
      var day = MDAYS[mViewKey()] || {};
      var out = { meals: [], tot: mTotals(day).all };
      mReadSlots().list.forEach(function (s) {
        out.meals.push({
          k: s.k, name: s.n, w: mSlotW(s),
          items: (day[s.k] || []).map(function (it) {
            var r = BY_ID[it.id];
            var m = (r && r.macro) || {};
            return { id: it.id, x: it.x, why: it.why || '', name: r ? r.name : '(gone)',
              sec: r ? r.book + '-' + r.secNum : '',
              kcal: m.kcal || 0, p: m.p || 0, f: m.f || 0, c: m.c || 0,
              na: m.na || 0, fib: m.fib || 0 };
          })
        });
      });
      return out;
    }
  };

  /* Exposed so tests/weeks.test.js can check every state has both, rather than
     keeping its own copy of the list and going stale the moment one is added. */
  window.__secShort = SEC_SHORT;
  window.__secNote = SEC_NOTE;
  window.__bookBlurbs = { 1: BOOKS[1].blurb, 2: BOOKS[2].blurb, all: ONE_BOOK.blurb };
  window.__syncWords = SYNC_WORD;
  window.__syncTips = SYNC_TIP;

  /* Shown only where it can be acted on and only until it has been. Three
     conditions, and each of them is a way of not nagging:

       configured   a copy with no Firebase behind it cannot share at all, and
                    advertising it would be advertising a dead end
       no household this phone is not already on a list
       not dismissed either button puts it away permanently

     It is deliberately not tied to first run. Somebody who has used this alone
     for a month and then wants their wife on it is the same person with the
     same question, and a hint that expired on day one would not be there. */
  var HINT_OFF = 'sh.hintShare';
  function hintDismissed() {
    try { return localStorage.getItem(HINT_OFF) === '1'; } catch (e) { return false; }
  }
  function dismissHint() {
    try { localStorage.setItem(HINT_OFF, '1'); } catch (e) { /* private mode */ }
    renderShareHint();
  }
  function renderShareHint() {
    var el = $('shareHint');
    if (!el) return;
    /* Only where the household is: Nourish and Strengthen are yours alone,
       and on a phone the banner was 130 pixels above your own day. And not
       the moment the front door closes: a new phone answered four questions
       and landed on a fifth. From the next open on. */
    var show = window.Store.configured && !window.Store.house && !hintDismissed() &&
      S.view !== 'macros' && S.view !== 'train' && !(window.Door && window.Door.closed && window.Door.closed());
    el.classList.toggle('hide', !show);
  }

  function renderSyncBadge() {
    var st = window.Store.status;
    var label = $('syncLabel');
    label.textContent = SYNC_WORD[st] || SYNC_WORD.local;
    var tip = SYNC_TIP[st] || SYNC_TIP.local;
    if (st === 'synced' && window.Store.lastSync) tip += ' Last confirmed ' + agoWords(window.Store.lastSync) + '.';
    $('syncBtn').setAttribute('title', tip);
    renderShareHint();
    // mMarkAccountUI paints the skep logo's sync tone for both household and account
    if (DAYSYNC) mMarkAccountUI();
  }

  // ----------------------------------------------------------------- pantry
  /* My kitchen: what the household has, wherever it came from, and one
     switch for whether the storehouse is part of the week at all. */
  /* One pill grid for every "is this so" question about foods: what the
     storehouse carries (step 1) and what you keep on hand (step 2). Grouped
     by shelf, six showing and "+N more", the ones that are so first. Blake:
     "It's all the same action, pretty much just different categories." */
  function pillGroupsHTML(o) {
    var q = String(o.q || '').trim().toLowerCase(), groups = {}, order = [];
    o.items.forEach(function (i) {
      if (q && i.l.toLowerCase().indexOf(q) < 0) return;
      if (!groups[i.c]) { groups[i.c] = []; order.push(i.c); }
      groups[i.c].push(i);
    });
    return order.map(function (c) {
      var items = groups[c].sort(function (x, y) { return (y.on - x.on) || x.l.localeCompare(y.l); });
      var on = items.filter(function (i) { return i.on; }).length, all = o.open[c] || q;
      var show = all ? items : items.slice(0, Math.max(6, on));
      var rest = items.length - show.length;
      return '<div class="kit-grp"><div class="kit-gh"><span>' + esc(c) + '</span><small>' + on + ' of ' + items.length + '</small></div>' +
        '<div class="pw-chips">' + show.map(function (i) {
          return '<button class="pw-chip kit-pill' + (i.ext ? ' ext' : '') + '" ' + o.attr + '="' + esc(i.k) + '" aria-pressed="' + i.on + '">' +
            esc(i.l) + '</button>';
        }).join('') +
        (rest > 0 ? '<button class="kit-more" ' + o.more + '="' + esc(c) + '">+' + rest + ' more</button>'
          : o.open[c] && !q && items.length > 6 ? '<button class="kit-more" ' + o.more + '="' + esc(c) + '">Show less</button>' : '') +
        '</div></div>';
    }).join('');
  }
  /* Step 2: what you keep. Your own foods (ones the books never mention)
     are a shelf of their own; a food the search cannot find can be added. */
  function kitItems() {
    var P = window.PANTRY || {}, both = planMode() === 'both', own = window.Store.pantryOwn();
    var out = Object.keys(P).map(function (k) {
      return { k: k, l: P[k].l, c: P[k].c || 'Other', on: foodSource(k) === 'h', ext: both && restockSource(k) !== 's' };
    });
    Object.keys(own).forEach(function (k) { out.push({ k: k, l: own[k].l, c: 'Yours', on: true, ext: false }); });
    return out;
  }
  function kitGroupsHTML() {
    var q = String(S.kitQ || '').trim(), items = kitItems(), add = '';
    if (q.length >= 2 && !items.some(function (i) { return i.l.toLowerCase() === q.toLowerCase(); })) {
      add = '<div class="kit-grp"><div class="pw-chips"><button class="pw-chip kit-pill kit-new" data-kitnew="' + esc(q) + '">+ Add \u201c' + esc(q) + '\u201d</button></div></div>';
    }
    return add + pillGroupsHTML({ items: items, q: q, open: S.kitOpen || {}, attr: 'data-kitpill', more: 'data-kitmore' });
  }
  function renderPantry() {
    var items = kitItems(), n = items.filter(function (i) { return i.on; }).length;
    if ($('kitNote')) $('kitNote').innerHTML = '<b class="kit-n">' + n + '</b> on hand \u00b7 tap one to change it' +
      (planMode() === 'both' ? ' \u00b7 a dashed edge is one ' + srcW().the + ' doesn\u2019t carry' : '');
    if ($('kitchenBody')) $('kitchenBody').innerHTML = kitGroupsHTML();
  }
  /* Step 1, when the storehouse is in it: what yours carries, as the same
     pills. Taking one off sends it to the shop; the book's list is one tap
     back. */
  function carryItems() {
    var P = window.PANTRY || {};
    return Object.keys(P).map(function (k) { return { k: k, l: P[k].l, c: P[k].c || 'Other', on: storeCarries(k) }; });
  }
  function carryGroupsHTML() {
    return pillGroupsHTML({ items: carryItems(), q: S.carryQ, open: S.carryOpen || {}, attr: 'data-carry', more: 'data-carrymore' });
  }
  function carryHTML() {
    var n = carryItems().filter(function (i) { return i.on; }).length;
    var W = srcW();
    return '<div class="step-sec"><h2 class="step-h2">What ' + W.your + ' carries</h2>' +
      '<p class="step-sub"><b id="carryN">' + n + '</b> carried \u00b7 tap one off if yours has stopped stocking it' +
        (window.Store.pantryChanged() ? ' \u00b7 <button class="nut-ask" id="pantryReset">' + W.back + '</button>' : '') + '</p>' +
      '<input class="pw-find" id="carryFind" type="search" placeholder="Find a food\u2026" autocomplete="off" aria-label="Find a food ' + W.the + ' carries" value="' + esc(S.carryQ || '') + '">' +
      '<div id="carryGroups">' + carryGroupsHTML() + '</div></div>';
  }

  // ------------------------------------------------------------------ views
  function renderView() {
    if (S.view !== 'plan') { S.pwNew = null; S.pwUndo = null; }
    ['today', 'browse', 'plan', 'macros', 'train', 'list', 'pantry', 'book', 'where'].forEach(function (v) {
      $('view-' + v).classList.toggle('hide', S.view !== v);
    });
    /* The book has no tab of its own any more; it opens from Recipes, so
       Recipes is the tab that stays lit while it is up. Plan stays lit
       through all four of its steps. */
    var lit = S.view === 'book' ? 'browse' : PLAN_STEPS.some(function (p) { return p[0] === S.view; }) ? 'plan' : S.view;
    renderSteps();
    /* Anywhere but Plan, "the week" is this week: a recipe added from
       Recipes, or the list, must not land in a week you had scrolled back to. */
    if (lit !== 'plan' && S.view !== 'list' && window.Store.activeWeek().id !== window.Store.thisWeek()) {
      window.Store.setWeek(window.Store.thisWeek());
      return;
    }
    if (S.view === 'where') renderWhere();
    document.querySelectorAll('.tab').forEach(function (b) {
      b.setAttribute('aria-selected', String(b.dataset.view === lit));
      // one stop in the Tab order for the whole row: the lit tab
      b.tabIndex = b.dataset.view === lit ? 0 : -1;
    });
    if (S.view === 'today' && window.Today) window.Today.render();
    if (S.view === 'browse') renderBrowse();
    if (S.view === 'plan') renderPlan();
    if (S.view === 'macros') renderMacros();
    /* Train draws itself — src/train.js — and is only told when to. */
    if (S.view === 'train' && window.Train) window.Train.render();
    if (S.view === 'list') renderList();
    if (S.view === 'pantry') renderPantry();
    if (S.view === 'book') renderBook();
    renderShareHint();
    syncShrunk();
    syncStrip();
  }

  /* The six tabs fit a 360px phone, so the fade would be a lie there. It
     appears only where the row is actually wider than its box — the narrowest
     phones — and only until you have scrolled to the end of it. */
  function syncTabsFade() {
    var tabs = document.querySelector('.tabs');
    var fade = $('tabsFade');
    if (!tabs || !fade) return;
    var over = tabs.scrollWidth - tabs.clientWidth;
    fade.classList.toggle('hide', over <= 1 || tabs.scrollLeft >= over - 1);
  }

  function renderModal() {
    keepingFocus(renderModalInner);
    /* The sheet is redrawn from scratch, so Google's button has to be drawn
       into it again each time — and only ever after the sheet exists. Ours
       stays visible until theirs is actually there, so a failure to load
       leaves a way in rather than a gap. */
    var slot = $('myGoogleBtn');
    if (!slot || !window.Store || !window.Store.mountGoogleButton) return;
    window.Store.mountGoogleButton(slot, function () {
      S.mySent = false; mAccountMark(); mSyncStart(); renderModal();
    }, function () {
      S.myErr = 'That did not go through. Try again, or use the email link.';
      renderModal();
    }).then(function () {
      /* Theirs is up, so ours steps back — but does not leave, because a
         rendered button and a working one are not the same thing. */
      var fb = $('myGoogleFallback');
      if (fb) fb.classList.add('hide');
      var alt = $('myGoogleAlt');
      if (alt) alt.classList.remove('hide');
    }, function () { /* theirs never arrived; ours is already showing */ });
  }

  function renderAll() { keepingFocus(renderAllInner); }

  function renderAllInner() {
    rebuild();                    // your changes and your own recipes, folded in
    renderSections();             // which can add a section, or a whole volume
    renderPantryFilterLabels();   // which follow your shelf once you have one
    /* Forget ticks for anything no longer on the list. This has to happen on
       every change, not just while the list is on screen — a recipe is usually
       dropped from the Meal Plan tab, and by the time you look at the list the
       tick would already have been reapplied to a fresh copy of the item. */
    var live = [];
    buildList().groups.forEach(function (g) {
      g.items.forEach(function (it) { live.push(it.key); });
    });
    if (window.Store.pruneChecked(live)) return;   // the store will call back

    $('favCount').textContent = window.Store.state.favs.length ? '(' + window.Store.state.favs.length + ')' : '';
    renderWeeks();          // the week strip and the print menu, whichever tab is up
    renderSyncBadge();
    renderView();
    renderModal();
  }

  // ----------------------------------------------------------------- events
  function wire() {
    /* A finger on a Nourish chart, or dragged along it, reads out the
       morning under it; the page still scrolls up and down under it. */
    var mcDown = null;
    document.addEventListener('pointerdown', function (e) {
      var svg = e.target && e.target.closest && e.target.closest('svg.mc-svg[data-pts]');
      mcDown = svg || null;
      if (svg) mcRead(svg, e.clientX);
    });
    document.addEventListener('pointermove', function (e) { if (mcDown) mcRead(mcDown, e.clientX); });
    document.addEventListener('pointerup', function () { mcDown = null; });
    document.addEventListener('pointercancel', function () { mcDown = null; });
    document.querySelectorAll('.tab').forEach(function (b) {
      b.addEventListener('click', function () {
        S.view = b.dataset.view;
        try { localStorage.setItem('sh.view', S.view); viewSeen(); } catch (e) { /* private mode */ }
        renderView();
      });
    });
    /* The row, from the keyboard: Left and Right move along it and wrap,
       Home and End go to the ends. They move the focus and nothing else —
       showing a view is Enter or Space, which is the button's own click —
       because Nourish and Strengthen take a moment to draw and arrowing past
       them should not make you wait for each. Only the tabs that are there:
       List and Pantry are Plan's steps now and their tabs are never shown. */
    document.querySelector('.tabs').addEventListener('keydown', function (e) {
      var go = { ArrowRight: 1, ArrowLeft: -1, Home: 'home', End: 'end' }[e.key];
      if (!go) return;
      var tabs = Array.prototype.filter.call(this.querySelectorAll('[role="tab"]'),
        function (t) { return t.offsetParent !== null; });
      var i = tabs.indexOf(document.activeElement);
      if (i < 0 || !tabs.length) return;
      e.preventDefault();
      var j = go === 'home' ? 0 : go === 'end' ? tabs.length - 1 : (i + go + tabs.length) % tabs.length;
      tabs[j].focus();
    });
    if ($('planMyWeek')) $('planMyWeek').addEventListener('click', pwOpen);
    $('bookBtn').addEventListener('click', function () {
      S.view = 'book';
      try { localStorage.setItem('sh.view', S.view); } catch (e) { /* private mode */ }
      renderView();
      window.scrollTo(0, 0);
    });

    $('bookSeg').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-book]');
      if (!b) return;
      S.bookF = b.dataset.book === 'all' ? 'all' : Number(b.dataset.book);
      S.secF = 'all';
      Array.prototype.forEach.call(this.querySelectorAll('button'), function (x) {
        x.setAttribute('aria-pressed', String(x === b));
      });
      renderSections();
      renderBrowse();
    });

    $('secSel').addEventListener('change', function () { S.secF = this.value; renderBrowse(); });
    $('diffSel').addEventListener('change', function () { S.diffF = this.value; renderBrowse(); });
    $('pantrySel').addEventListener('change', function () { S.pantryF = this.value; renderBrowse(); });
    /* The two pill grids, and the way back to the book's storehouse list. */
    document.addEventListener('click', function (e) {
      if (!e.target.closest) return;
      var c = e.target.closest('[data-carry]');
      if (c) { window.Store.setPantry(c.dataset.carry, !storeCarries(c.dataset.carry)); return; }
      var cm = e.target.closest('[data-carrymore]');
      if (cm) { S.carryOpen = S.carryOpen || {}; S.carryOpen[cm.dataset.carrymore] = !S.carryOpen[cm.dataset.carrymore]; renderWhere(); return; }
      var nw = e.target.closest('[data-kitnew]');
      if (nw) { window.Store.addPantryItem(nw.dataset.kitnew, 'Yours'); S.kitQ = ''; var kf = $('kitFind'); if (kf) kf.value = ''; return; }
      if (e.target.closest('#pantryReset')) {
        ask({ title: srcW().reset,
          body: 'Everything you took off comes back. Foods you added yourself stay.',
          ok: 'Reset', danger: true }, function (ok) { if (ok) window.Store.resetPantry(); });
      }
    });
    document.addEventListener('input', function (e) {
      if (e.target && e.target.id === 'carryFind') { S.carryQ = e.target.value; var g = $('carryGroups'); if (g) g.innerHTML = carryGroupsHTML(); }
    });

    $('search').addEventListener('input', function () { S.qy = this.value; renderBrowse(); });
    $('filtBtn').addEventListener('click', function () { filtersPop(!S.filtPop); });
    $('filtersDone').addEventListener('click', function () { filtersPop(false); });
    $('brwScrim').addEventListener('click', function () { filtersPop(false); });
    $('sortSel').addEventListener('change', function () { S.sort = this.value; renderBrowse(); });

    $('favBtn').addEventListener('click', function () {
      S.favOnly = !S.favOnly;
      this.setAttribute('aria-pressed', String(S.favOnly));
      renderBrowse();
    });

    $('grid').addEventListener('click', function (e) {
      var c = e.target.closest('[data-open]');
      if (!c) return;
      rememberOpener();
      openRecipe(idOf(c.dataset.open));
    });

    $('planGrid').addEventListener('click', function (e) {
      var ad = e.target.closest('[data-addday]');
      if (ad) { rememberOpener(); addOpen(ad.dataset.addday); return; }
      var dz = e.target.closest('[data-dayopen]');
      if (dz) { rememberOpener(); dayOpen(idOf(dz.dataset.dayopen), dz.dataset.day); return; }
      var op = e.target.closest('[data-open]');
      if (op) { rememberOpener(); openRecipe(idOf(op.dataset.open)); return; }
      var sw = e.target.closest('[data-pswap]');
      if (sw) { planSwap(idOf(sw.dataset.pswap), sw.dataset.day); return; }
    });

    /* The Macros day. Items are addressed slot:index into the stored arrays,
       so duplicates of the same recipe stay two separate plates. */
    /* One redraw for a change to the day: the day behind, and the meal's
       sheet over it when one is open — it shows the same meal. */
    function mRedraw() {
      keepingFocus(function () {
        renderMacros();
        if (S.macroPick) renderModal();
      });
    }

    /* Where the plate a picker tap put down sits now: where it went, if it
       is still that food, else the last of that food on the meal. */
    function mpPlateAt(k, sk, id) {
      var list = mDay(k)[sk] || [], at = S.mpAt[id];
      if (at !== undefined && list[at] && String(list[at].id) === String(id)) return at;
      for (var i = list.length - 1; i >= 0; i--) if (String(list[i].id) === String(id)) return i;
      return -1;
    }
    // a plate gone from a meal moves every remembered one after it up a place
    function mpForget(sk, i) {
      if (!S.macroPick || S.macroPick.slot !== sk) return;
      Object.keys(S.mpAt).forEach(function (id) {
        if (S.mpAt[id] === i) { delete S.mpAt[id]; delete S.mpBasket[id]; }
        else if (S.mpAt[id] > i) S.mpAt[id]--;
      });
    }
    function mpFresh(i, id) { var f = {}; f[i] = id; return f; }

    /* The rest of the open meal re-fits around a change (mBalanceMeal), and
       what moved is remembered so its row can say "was". `hold` is the plate
       just put down or just set by hand: it stays where it went.
     *
       Blake, 2026-10-05, of filling a meal: "This needs to feel like magic"
       — tap what the pills say is missing and watch them fill, with the
       amounts dialled for you. Only on the sheet, and only for the meal it
       is open on: the day's trays have no dials. */
    /* `fromDay`: the scale on the meal's card (myday.js), which balances
       with no sheet open — the re-fit is otherwise the open sheet's alone. */
    function mRefitMeal(k, sk, hold, fromDay, addedAt) {
      if (!fromDay && (!S.macroPick || S.macroPick.slot !== sk)) return {};
      var before = (mDay(k)[sk] || []).map(function (it) { return { id: it.id, x: it.x }; });
      mBalanceMeal(sk, { hold: hold, quiet: true });
      var after = mDay(k)[sk] || [], was = {};
      before.forEach(function (b, i) {
        if (i === hold || i === addedAt || !after[i] || String(after[i].id) !== String(b.id)) return;
        if (Math.abs(after[i].x - b.x) > 1e-9) was[i] = b;
      });
      return was;
    }

    $('macroSlots').addEventListener('click', mDayClick);
    /* The meal sheet carries the meal's own controls — its tick, Balance,
       the ⋯ menus and every food's dial — and they mean exactly what they
       meant on the day, so the same handler answers them there. An open ⋯
       closes on any tap outside it. */
    $('modalRoot').addEventListener('click', function (e) {
      if (!S.macroPick || S.openId || S.foodOpen || S.keepMeal || S.mCopyFrom || S.newFood) return;
      if (!e.target.closest || !e.target.closest('.msheet')) return;
      // × closes the sheet, menu or no menu: the document's listener does it
      if (e.target.closest('.sheet-x, .sheet-done')) return;
      /* A food opened because it was just added stays open once you use it:
         its dial, its amount or its ⋯ pin it open, so the first − does not
         shut it as the "just added" mark is cleared. Here, before an open
         menu is shut and the sheet drawn again, or the tap's own button is
         no longer in the page to say which food it was. */
      var inRow = e.target.closest('#modalRoot .mrow-open [data-mstep], #modalRoot .mrow-open [data-mtype], #modalRoot .mrow-open [data-mfmenu]');
      if (inRow) {
        var pinB = inRow.closest('.mrow').querySelector('[data-mrowopen]');
        if (pinB) {
          var pp = pinB.dataset.mrowopen.split(':'), pi = Number(pp.pop()), psk = pp.join(':');
          var pit = (mDay(mViewKey())[psk] || [])[pi];
          if (pit) S.mRowOpen = { k: mViewKey(), sk: psk, i: pi, id: pit.id };
        }
      }

      if (S.mMenu && !e.target.closest('.mfood-menu, [data-mfmenu], [data-mmenu]')) {
        S.mMenu = '';
        if (!e.target.closest('button, input, select')) { renderModal(); return; }
        renderModal();
      }
      /* The tray along the bottom opens and shuts in place. */
      var trb = e.target.closest('[data-mtray]');
      if (trb) {
        S.mTrayOpen = trb.dataset.mtray === '1'; S.mMenu = ''; S.mType = null;
        /* Up means up in the page (myday.js, sheetOnHTML), above the search,
           so the word that was hiding them goes, and the sheet goes back to
           its top where they are. renderModal reads the box back into
           S.mpQuery, so the box is emptied as well as the state. */
        if (S.mTrayOpen) {
          S.mpQuery = '';
          if ($('mpFind')) $('mpFind').value = '';
        }
        renderModal();
        if (S.mTrayOpen) { var tsc = document.querySelector('#modalRoot .scrim'); if (tsc) tsc.scrollTop = 0; }
        return;
      }
      if (e.target.closest('.msh-top, .mrows, .msh-tray, .msh-skipped')) mDayClick(e);
    });

    /* Skip, from the meal's card (Blake, 2026-10-10: "I need a way to
       easily skip a meal on the main day menu. Somehow that got buried in
       the food selector"). The sheet's ⋯ only ever offered it on an empty
       meal, because a skip counts only on an empty one (myday.js). So the
       card takes the food off and puts the skip on together, and Undo in the
       toast puts both back — he chose "clear it, with Undo". */
    function mSkipMeal(k, sk) {
      var had = mDay(k)[sk] || [];
      if (had.some(function (it) { return it.eaten; })) return;
      had = JSON.parse(JSON.stringify(had));
      if (had.length) mEditDay(k, function (day) { day[sk] = []; });
      mSetSkip(k, sk, true);
      S.mSkipAsk = '';
      if (S.mAmt && S.mAmt.indexOf(k + '|' + sk + ':') === 0) { S.mAmt = ''; S.mType = null; }
      S.mSkipUndo = { k: k, sk: sk, items: had };
      renderMacros();
      var n = had.filter(function (it) { return BY_ID[it.id]; }).length;
      mToast(esc(mSlotName(sk)) + ' skipped' + (n ? ', and its ' + (n === 1 ? 'food' : n + ' foods') + ' came off.' : '.'), sk, 'data-mskipundo');
    }
    document.addEventListener('click', function (e) {
      if (!e.target.closest || !e.target.closest('[data-mskipundo]') || !S.mSkipUndo) return;
      var u = S.mSkipUndo;
      S.mSkipUndo = null;
      if (u.items.length) mEditDay(u.k, function (day) { day[u.sk] = (day[u.sk] || []).concat(u.items); });
      mSetSkip(u.k, u.sk, false);
      var el = $('mToast'); if (el) el.hidden = true;
      if (S.view === 'macros') renderMacros();
    });

    /* Holding + down on an empty meal opens its line of ways to fill it
       (myday.js, emptyHTML; Blake: "or I long press the plus button, it'll
       open up the view"). A plain tap on + is still the way to food search,
       so the click that ends a hold is swallowed — once, and only on +. */
    /* The swallow is a window opened as the finger lifts, not a flag left
       waiting for a click: the hold redraws the card, the click that would
       have ended it may land on the new + or on nothing, and a flag left up
       ate the next honest tap on + instead. */
    var mHoldT = null, mHoldFired = false, mHeldNow = false;
    $('macroSlots').addEventListener('pointerdown', function (e) {
      var hb = e.target.closest && e.target.closest('[data-mhold]');
      if (!hb) return;
      clearTimeout(mHoldT);
      mHoldFired = false;
      mHoldT = setTimeout(function () {
        var hk = mViewKey(), hsk = hb.dataset.mhold;
        (S.mEmptyOpen[hk] = S.mEmptyOpen[hk] || {})[hsk] = true;
        mHoldFired = true;
        renderMacros();
        if (navigator.vibrate) { try { navigator.vibrate(10); } catch (err) { /* not on this phone */ } }
      }, 450);
    });
    $('macroSlots').addEventListener('pointerup', function () {
      clearTimeout(mHoldT);
      if (mHoldFired) {
        mHoldFired = false; mHeldNow = true;
        setTimeout(function () { mHeldNow = false; }, 400);
      }
    });
    ['pointercancel', 'pointerleave'].forEach(function (ev) {
      $('macroSlots').addEventListener(ev, function () { clearTimeout(mHoldT); });
    });
    $('macroSlots').addEventListener('contextmenu', function (e) {
      if (e.target.closest && e.target.closest('[data-mhold]')) e.preventDefault();
    });

    function mDayClick(e) {
      if (mHeldNow && e.target.closest('[data-mhold]')) { mHeldNow = false; e.preventDefault(); return; }
      /* An empty meal's name opens and shuts its line of ways to fill it. */
      var meo = e.target.closest('[data-meopen]');
      if (meo) {
        var ok2 = mViewKey(), osk = meo.dataset.meopen;
        var om = (S.mEmptyOpen[ok2] = S.mEmptyOpen[ok2] || {});
        om[osk] = !om[osk];
        keepingFocus(renderMacros);
        return;
      }
      /* Saved meals, from an empty meal's line: its sheet, on the Saved meals
         lens (pickbands.js). */
      var svd = e.target.closest('[data-msaved]');
      if (svd) {
        rememberOpener();
        S.mEdit = null;
        mOpenPicker(svd.dataset.msaved, 'home');
        S.mpSec = 'saved';
        renderModal();
        return;
      }
      /* A meal's name steps its card through Status, Foods and Details
         (myday.js, mViewOf), held for the day it was pressed on. What the
         view hides goes shut: an open line, a box being typed in. */
      var mvw = e.target.closest('[data-mview]');
      if (mvw) {
        var vk = mViewKey(), vsk = mvw.dataset.mview, nv = (Number(mvw.dataset.mv) || 2) % 3 + 1;
        (S.mView[vk] = S.mView[vk] || {})[vsk] = nv;
        if (nv !== 3 && S.mAmt && S.mAmt.indexOf(vk + '|' + vsk + ':') === 0) { S.mAmt = ''; S.mType = null; }
        keepingFocus(renderMacros);
        return;
      }
      var ska = e.target.closest('[data-mskipask]');
      if (ska) {
        var ak = mViewKey(), ask = ska.dataset.mskipask;
        if ((mDay(ak)[ask] || []).some(function (it) { return BY_ID[it.id]; })) {
          S.mSkipAsk = S.mSkipAsk === ak + '|' + ask ? '' : ak + '|' + ask;
          keepingFocus(renderMacros);
        } else mSkipMeal(ak, ask);
        return;
      }
      var skg = e.target.closest('[data-mskipgo]');
      if (skg) { mSkipMeal(mViewKey(), skg.dataset.mskipgo); return; }
      var skn = e.target.closest('[data-mskipno]');
      if (skn) {
        S.mSkipAsk = '';
        renderMacros();
        var back = document.querySelector('#macroSlots [data-mskipask="' + skn.dataset.mskipno + '"]');
        if (back) back.focus();
        return;
      }
      /* A tray opens its meal's sheet: the one place food is added or
         changed (Blake, 2026-10-04: "ONE way to add and select food"). */
      var mop = e.target.closest('[data-mopen]');
      if (mop) {
        rememberOpener();
        S.mEdit = null;
        mOpenPicker(mop.dataset.mopen, 'home');
        return;
      }
      /* The name is a door to the recipe itself. It goes through openRecipe
         like every other door, so the back gesture walks home to the day. */
      var op = e.target.closest('[data-open]');
      if (op) {
        rememberOpener();
        var opr = BY_ID[idOf(op.dataset.open)];
        /* The sheet opens scaled to MAKE the portion on the plan, not to the
           whole batch — that is the number the plate was budgeted at. */
        openRecipe(idOf(op.dataset.open),
          opr ? mCookScale(Number(op.dataset.mx) || 1, opr.servN) : 1);
        return;
      }
      /* The whole meal, in one press. Locked plates are the machine's
         business, not yours — a hand on this is you saying you ate it. */
      var dot = e.target.closest('[data-mdot]');
      if (dot) {
        if (dot.dataset.mdot === 'weigh') {
          var wb = $('mWeight');
          if (wb) { wb.focus(); wb.select(); }
          return;
        }
        var dk = dot.dataset.mdot;
        mEditDay(mViewKey(), function (day) {
          var list = day[dk] || [];
          var allOn = list.length && list.every(function (it) { return it.eaten; });
          list.forEach(function (it) { it.eaten = allOn ? 0 : 1; });
        });
        S.mEdit = null;
        mRedraw();
        return;
      }

      /* One tap on a spent portion hands its stepper back. Only one plate at a
         time is awake, so tapping another puts the first away — the day never
         drifts into a state where half of it is quietly editable. */
      var ed = e.target.closest('[data-medit]');
      if (ed) { S.mEdit = ed.dataset.medit; mRedraw(); return; }

      /* Tap the number, type a number. The render puts a box where the words
         were; this focuses it and selects what is in it, so the first key
         replaces the portion rather than appending to it — nobody taps a
         portion in order to add a digit to the end of it. */
      /* A food's line in a meal's sheet: tap it open for its amount, its
         macros and its ⋯; tap it again, or another, and it shuts (myday.js,
         mOpenRow). */
      function mScrollRowIn(el) {
        var row = el && el.closest && el.closest('.mrow');
        var list = row && row.closest('.mrows');
        if (!row || !list || list.scrollHeight <= list.clientHeight) return;
        var rb = row.getBoundingClientRect(), lb = list.getBoundingClientRect();
        if (rb.bottom > lb.bottom) list.scrollTop += rb.bottom - lb.bottom + 4;
        else if (rb.top < lb.top) list.scrollTop -= lb.top - rb.top + 4;
      }
      var ro = e.target.closest('[data-mrowopen]');
      if (ro) {
        var rp = ro.dataset.mrowopen.split(':'), ri = Number(rp.pop()), rsk = rp.join(':');
        var rit = (mDay(mViewKey())[rsk] || [])[ri];
        var wasOpen = ro.getAttribute('aria-expanded') === 'true';
        S.mRowOpen = { k: mViewKey(), sk: rsk, i: ri, id: wasOpen || !rit ? null : rit.id };
        S.mMenu = ''; S.mType = null; S.mEdit = '';
        renderMacros();
        if (S.macroPick) renderModal();
        var back = document.querySelector((S.macroPick ? '#modalRoot ' : '#macroSlots ') + '[data-mrowopen="' + ro.dataset.mrowopen + '"]');
        if (back) { back.focus(); mScrollRowIn(back); }
        return;
      }

      var ty = e.target.closest('[data-mtype]');
      if (ty) {
        S.mType = ty.dataset.mtype;
        renderMacros();
        if (S.macroPick) renderModal();
        var box = document.querySelector(S.macroPick ? '#modalRoot .mstep-in' : '#macroSlots .mstep-in');
        if (box) { box.focus(); box.select(); mScrollRowIn(box); }
        return;
      }

      /* Not eating this one today. It toggles, and the share it was holding
         goes back to the meals that are actually happening — which is the
         difference between a skip and an empty meal. */
      var skp = e.target.closest('[data-mskip]');
      if (skp) {
        var sKey = skp.dataset.mskip;
        mSetSkip(mViewKey(), sKey, !mSkipped(mViewKey(), sKey));
        S.mMenu = '';
        mRedraw();
        return;
      }

      /* Where a meal's miss goes. Tapping a meal adds it to the queue rather
         than replacing what is there, because one tap takes only what that
         meal can hold — if it did not cover the miss the line says how much is
         still to place and the next tap continues it. Tapping the same meal
         twice takes it back out, so a mis-tap costs one tap and not a trip
         through Start over. */
      var snd = e.target.closest('[data-msend]');
      if (snd) {
        var sv = snd.dataset.msend;
        var sKey2 = mViewKey();
        var slots2 = mReadSlots();
        var ev2 = mLastFinished(mDayTargets(sKey2), slots2);
        var cur = mSendOf(sKey2);
        if (!cur || !ev2 || cur.f !== ev2.k) {
          cur = { f: ev2 ? ev2.k : '', to: [], off: false, ack: false };
        }
        /* Which meals the list is offering. Needed because an empty `to` is
           stored for "all of them" — the default — and a checkbox list has
           to turn that into every box ticked before one can be cleared. */
        var dayN2 = mDay(sKey2);
        var openK = [];
        slots2.list.forEach(function (s2) {
          if (mMealDone(s2.k)) return;
          if (mSkipped(sKey2, s2.k) && !(dayN2[s2.k] || []).length) return;
          openK.push(s2.k);
        });

        if (sv === 'ack') cur.ack = true;
        else if (sv === 'open') cur.ack = false;
        else if (sv === 'all') { cur.to = []; cur.off = false; }
        else if (sv === 'none') { cur.to = []; cur.off = true; }
        else if (openK.indexOf(sv) >= 0) {
          /* A tick, not a queue position. An empty `to` means every box is
             ticked, so clearing the first one has to write out the rest. */
          var set = cur.off ? [] : (cur.to.length ? cur.to.slice() : openK.slice());
          var at = set.indexOf(sv);
          if (at >= 0) set.splice(at, 1); else set.push(sv);
          /* Two normalisations, so one state has one spelling: every meal
             ticked is the default, and no meal ticked is None. */
          var all = openK.every(function (k) { return set.indexOf(k) >= 0; });
          cur.to = (all || !set.length) ? [] : set;
          cur.off = !set.length;
        }
        mSetSend(sKey2, cur);
        keepingFocus(renderMacros);
        return;
      }

      var tr = e.target.closest('[data-mtry]');
      if (tr) { S.mMenu = ''; mTryAgain(tr.dataset.mtry); if (S.macroPick) renderModal(); return; }

      /* Balance: the meal re-fits as a whole, clearing manual −/+ tweaks
         (it.l === 1) while respecting explicit ⋯ -> Lock items (it.l === 2). */
      var bal = e.target.closest('[data-mbal]');
      if (bal) {
        var bk = mViewKey(), bsk = bal.dataset.mbal;
        if (S.mAmt && S.mAmt !== '*') S.mAmt = '';
        mEditDay(bk, function (day) { (day[bsk] || []).forEach(function (it) { if (!it.eaten && it.l === 1) it.l = 0; }); });
        var bwas = mRefitMeal(bk, bsk, undefined, !S.macroPick);
        S.mMarks = { k: bk, sk: bsk, was: bwas, fresh: {}, snap: null };
        S.mMenu = '';
        mRedraw();
        /* From the card's scale the amounts change under it without a word
           (the sheet marks each row that moved), so the toast says what
           happened, nothing included. */
        if (!S.macroPick) {
          var bn = Object.keys(bwas).length;
          mToast(bn ? esc(mSlotName(bsk)) + ' balanced: ' + bn + (bn === 1 ? ' food' : ' foods') + ' moved.'
            : 'Nothing on ' + esc(mSlotName(bsk)) + ' could move any closer.');
        }
        return;
      }
      /* A food's line on the day opens under itself; one at a time. */
      var amt = e.target.closest('[data-mamt]');
      if (amt) {
        S.mAmt = S.mAmt === amt.dataset.mamt ? '' : amt.dataset.mamt;
        S.mType = null;
        keepingFocus(renderMacros);
        return;
      }
      /* The whole line is the handle, not just the amount at its end: a thumb
         lands where the line is, and the line's only other doors are its name
         and its tick. The amount stays the button, so a keyboard and a screen
         reader have the one control to find. */
      var fl = e.target.closest('.mfl-r');
      if (fl && !e.target.closest('button, input')) {
        var fla = fl.querySelector('[data-mamt]');
        if (fla) fla.click();
        return;
      }
      /* Swap marks the plate; the next food tapped in the list below takes
         its place. Cancel on the mark lets it go. */
      var swp = e.target.closest('[data-mswap]');
      if (swp) {
        var sq = swp.dataset.mswap.split(':');
        var sit = (mDay(mViewKey())[sq[0]] || [])[Number(sq[1])];
        S.mMenu = '';
        if (!sit) return;
        S.mpSwap = { slot: sq[0], i: Number(sq[1]), id: sit.id, n: (BY_ID[sit.id] || {}).name || '' };
        renderModal();
        var fnd = $('mpFind');
        if (fnd && fnd.scrollIntoView) fnd.scrollIntoView({ block: 'start' });
        return;
      }
      if (e.target.closest('[data-mswapx]')) { S.mpSwap = null; renderModal(); return; }

      var mv = e.target.closest('[data-mmove]');
      if (mv) {
        S.mMenu = 'move:' + mv.dataset.mmove;
        mRedraw();
        return;
      }
      var mvt = e.target.closest('[data-mmoveto]');
      if (mvt) {
        var mp2 = mvt.dataset.mmoveto.split(':'); // fromSlot : index : toSlot
        var mvk = mViewKey(), fromSk = mp2[0], fromIdx = Number(mp2[1]), toSk = mp2[2];
        var movedItem = null, fromSnap = null, toSnap = null;
        S.mMenu = '';
        S.mAmt = '';
        mEditDay(mvk, function (day) {
          var arr = day[fromSk] || [];
          if (!arr[fromIdx]) return;
          fromSnap = JSON.parse(JSON.stringify(arr));
          toSnap = JSON.parse(JSON.stringify(day[toSk] || []));
          movedItem = arr.splice(fromIdx, 1)[0];
          day[toSk] = day[toSk] || [];
          day[toSk].push(movedItem);
        });
        if (movedItem) {
          mpForget(fromSk, fromIdx);
          var mwas1 = mRefitMeal(mvk, fromSk);
          if (S.macroPick && S.macroPick.slot === fromSk) S.mMarks = { k: mvk, sk: fromSk, was: mwas1, fresh: {}, snap: null };
          var mvr = BY_ID[movedItem.id];
          var mslots = mReadSlots(), destName = (mslots.names || {})[toSk] || 'Meal';
          mslots.list.forEach(function (sl) { if (sl.k === toSk && sl.n) destName = sl.n; });
          S.mLastMove = { k: mvk, fromSk: fromSk, toSk: toSk, fromSnap: fromSnap, toSnap: toSnap };
          mToast('Moved ' + esc(mvr ? mvr.name : 'food') + ' to ' + esc(destName) + '.', '1', 'data-mmoveundo');
        }
        mRedraw();
        return;
      }
      var exp = e.target.closest('[data-mexplode]');
      if (exp) {
        var ep = exp.dataset.mexplode.split(':'); // slot : index
        var evk = mViewKey(), esk = ep[0], eidx = Number(ep[1]);
        var exItem = (mDay(evk)[esk] || [])[eidx];
        var exRec = exItem && BY_ID[exItem.id];
        S.mMenu = '';
        S.mAmt = '';
        var liveParts = (exRec && exRec.parts ? exRec.parts : []).filter(function (pt) { return !!BY_ID[pt.id]; });
        if (exItem && liveParts.length) {
          var newItems = liveParts.map(function (pt) {
            var px = Math.round((Number(pt.x) || 1) * (Number(exItem.x) || 1) * 1000) / 1000;
            var obj = { id: pt.id, x: px || 1, eaten: exItem.eaten ? 1 : 0 };
            if (exItem.l) obj.l = exItem.l;
            return obj;
          });
          var exSnap = null;
          mEditDay(evk, function (day) {
            var earr = day[esk] || [];
            if (!earr[eidx]) return;
            exSnap = JSON.parse(JSON.stringify(earr));
            Array.prototype.splice.apply(earr, [eidx, 1].concat(newItems));
          });
          if (exSnap) {
            S.mLastExplode = { k: evk, sk: esk, snap: exSnap };
            mToast('Exploded ' + esc(exRec.name) + ' into ' + newItems.length + ' foods.', '1', 'data-mexplodeundo');
          }
        }
        mRedraw();
        return;
      }

      var keep = e.target.closest('[data-mkeep]');
      if (keep) {
        S.mMenu = '';
        S.keepMeal = keep.dataset.mkeep;
        rememberOpener();
        pushSheet({ m: 1 });
        renderModal();
        var nm2 = $('mkName');
        if (nm2) nm2.focus();
        return;
      }

      /* A food's name opens the food, the way a recipe's name opens the
         recipe. For a kept meal that is the only place its parts can be
         seen again: the plate shows one line for the whole thing. */
      var mfr = e.target.closest('[data-mfrom]');
      if (mfr) {
        S.mMenu = '';
        rememberOpener();
        S.mCopyFrom = { slot: mfr.dataset.mfrom, day: '' };
        pushSheet({ m: 1 });
        renderModal();
        return;
      }

      var fd = e.target.closest('[data-mfood]');
      if (fd) {
        rememberOpener();
        S.foodOpen = { id: fd.dataset.mfood, x: Number(fd.dataset.mx) || 1, slot: fd.dataset.mfslot || '' };
        pushSheet({ m: 1 });
        renderModal();
        return;
      }

      /* The ⋯ on a food, and the ⋯ on the meal: one menu open at a time. */
      var fm = e.target.closest('[data-mfmenu], [data-mmenu]');
      if (fm) {
        var want = fm.dataset.mfmenu || ('meal:' + fm.dataset.mmenu);
        S.mMenu = (S.mMenu === want || S.mMenu === 'move:' + want) ? '' : want;
        mRedraw();
        return;
      }

      var st = e.target.closest('[data-mstep]');
      if (st) {
        var sp = st.dataset.mstep.split(':');           // slot : index : direction
        mEditDay(mViewKey(), function (day) {
          var it = (day[sp[0]] || [])[Number(sp[1])];
          if (!it) return;
          // the disabled attribute is paint; this is the rule
          if (it.eaten && S.mEdit !== sp.slice(0, 2).join(':')) return;
          /* Quarter-serving steps land on eighths, so fmtNum always has a
             glyph and never falls back to a decimal. */
          it.x = mDialStep(BY_ID[it.id], it.x, sp[2] === 'up' ? 1 : -1);
          if (S.macroPick && S.macroPick.slot === sp[0] && !it.l) it.l = 1;
        });
        mRedraw();
        return;
      }
      var bw = e.target.closest('[data-mbatch]');
      if (bw) {
        S.mBatchOpen = S.mBatchOpen === bw.dataset.mbatch ? '' : bw.dataset.mbatch;
        S.mMenu = '';
        mRedraw();
        if (S.mBatchOpen) { var bi = $('mBatchIn'); if (bi) bi.focus(); }
        return;
      }
      var bsv = e.target.closest('[data-mbsave], [data-mbforget]');
      if (bsv) {
        var bq = (bsv.dataset.mbsave || bsv.dataset.mbforget).split(':');
        var bit = (mDay(mViewKey())[bq[0]] || [])[Number(bq[1])];
        var brr = bit && BY_ID[bit.id];
        if (!brr) return;
        if (bsv.dataset.mbforget) {
          mSetBatchG(brr.id, 0);             // back to the estimate, box open for a new weight
          mRedraw();
          var bi2 = $('mBatchIn'); if (bi2) bi2.focus();
          return;
        }
        var bv = Number(String(($('mBatchIn') || {}).value || '').replace(/,/g, '').trim());
        if (!(bv > 0) || bv > 50000) { var bi3 = $('mBatchIn'); if (bi3) bi3.focus(); return; }
        mSetBatchG(brr.id, bv / (brr.servN || 1));
        mRedraw();
        return;
      }
      var why = e.target.closest('[data-mwhy]');
      if (why) {
        S.mWhyOpen = S.mWhyOpen === why.dataset.mwhy ? '' : why.dataset.mwhy;
        mRedraw();
        return;
      }
      var mdo = e.target.closest('[data-mdo]');
      if (mdo) {
        var dq = mdo.dataset.mdo.split(':');       // action:slot:index
        var dk = mViewKey(), dsk = dq[1], dix = Number(dq[2]);
        var dit = (mDay(dk)[dsk] || [])[dix], dr = dit && BY_ID[dit.id];
        S.mWhyOpen = '';
        if (!dit || !dr) { mRedraw(); return; }
        if (dq[0] === 'swap') {
          mReplacePlate(dk, dsk, dix);
        } else if (dq[0] === 'never') {
          mSetNever(dr.id, true);
          /* Off today too when it was only ever a suggestion; kept when you
             put it there or already ate it — the rule is about suggesting. */
          if (!dit.eaten && !dit.l && (dit.by === 'f' || dit.by === 'w')) mReplacePlate(dk, dsk, dix);
          mToast(esc(dr.name) + ' won\u2019t be suggested.', dr.id);
        }
        mRedraw();
        return;
      }
      var del = e.target.closest('[data-mdel]');
      if (del) {
        S.mMenu = '';
        // the plates after it move up a place, so no line is left open on the wrong one
        S.mAmt = '';
        var dp = del.dataset.mdel.split(':');
        mEditDay(mViewKey(), function (day) {
          (day[dp[0]] || []).splice(Number(dp[1]), 1);
        });
        mpForget(dp[0], Number(dp[1]));
        var dwas = mRefitMeal(mViewKey(), dp[0]);
        if (S.macroPick && S.macroPick.slot === dp[0]) S.mMarks = { k: mViewKey(), sk: dp[0], was: dwas, fresh: {}, snap: null };
        mRedraw();
        return;
      }
      /* The star, on a plate. It only lived in the picker before, so you
         could keep a dish while shopping for it but not on the day you ate
         it — and the day you ate it is the day you know. */
      var mfv = e.target.closest('[data-mfav]');
      if (mfv) {
        var fvr = BY_ID[idOf(mfv.dataset.mfav)];
        S.mMenu = '';
        if (fvr && mCanFav(fvr)) { mToggleFav(fvr); mRedraw(); }
        return;
      }

      var pn = e.target.closest('[data-mpin]');
      if (pn) {
        var pp = pn.dataset.mpin.split(':');
        var pit = (mDay(mViewKey())[pp[0]] || [])[Number(pp[1])];
        if (!pit) return;
        var pslots = mReadSlots();
        var psrec = null;
        pslots.list.forEach(function (s) { if (s.k === pp[0]) psrec = s; });
        if (!psrec) return;
        psrec.pins = psrec.pins || [];
        var pat = -1;
        psrec.pins.forEach(function (p, i2) { if (p.id === pit.id) pat = i2; });
        if (pat >= 0) psrec.pins.splice(pat, 1);
        else psrec.pins.push({ id: pit.id, x: pit.x });
        mWriteSlots(pslots);
        S.mMenu = '';
        mRedraw();
        return;
      }

      var lk = e.target.closest('[data-mlock]');
      if (lk) {
        var lp = lk.dataset.mlock.split(':');
        var freed = false;
        mEditDay(mViewKey(), function (day) {
          var it = (day[lp[0]] || [])[Number(lp[1])];
          if (it) { it.l = it.l ? 0 : 2; freed = !it.l; }
        });
        if (freed) {
          var lwas = mRefitMeal(mViewKey(), lp[0]);
          if (S.macroPick && S.macroPick.slot === lp[0]) S.mMarks = { k: mViewKey(), sk: lp[0], was: lwas, fresh: {}, snap: null };
        }
        S.mMenu = '';
        mRedraw();
      }
    }

    /* Committing a typed portion, and the two ways out of it.
     *
       Enter commits and blur commits, because a phone has no Enter worth
       relying on and tapping elsewhere is what "I am done" looks like there.
       Escape leaves the portion as it was. Nothing is written while typing:
       a re-render mid-keystroke would take the box away under the thumb. */
    function mCommitTyped(box) {
      if (!box || !box.dataset.mtypein) return;
      var sp = box.dataset.mtypein.split(':');
      var typed = parseFloat(String(box.value).replace(/[^0-9.]/g, ''));
      S.mType = null;
      mEditDay(mViewKey(), function (day) {
        var it = (day[sp[0]] || [])[Number(sp[1])];
        if (!it) return;
        var nx = mXFromDial(BY_ID[it.id], typed);
        /* Nonsense is not a portion. An empty box, a stray letter or a nought
           leaves the plate exactly as it was rather than writing a zero and
           quietly taking the food off the day's arithmetic. */
        if (nx !== null) { it.x = nx; if (S.macroPick && S.macroPick.slot === sp[0] && !it.l) it.l = 1; }
      });
      S.mEdit = null;
      mRedraw();
    }

    /* The day and the meal's sheet, both: the box lives in the sheet now. */
    var mTypedKeys = function (e) {
      if (!e.target.classList || !e.target.classList.contains('mstep-in')) return;
      if (e.key === 'Enter') { e.preventDefault(); mCommitTyped(e.target); return; }
      if (e.key === 'Escape') { e.preventDefault(); S.mType = null; mRedraw(); }
    };
    var mTypedOut = function (e) {
      if (!e.target.classList || !e.target.classList.contains('mstep-in')) return;
      if (S.mType === null) return;                 // already committed by Enter
      mCommitTyped(e.target);
    };
    $('macroSlots').addEventListener('keydown', mTypedKeys);
    $('macroSlots').addEventListener('focusout', mTypedOut);
    $('modalRoot').addEventListener('keydown', mTypedKeys);
    $('modalRoot').addEventListener('focusout', mTypedOut);

    $('macroSlots').addEventListener('change', function (e) {
      var c = e.target.closest('[data-meat]');
      if (!c) return;
      var cp = c.dataset.meat.split(':');
      mEditDay(mViewKey(), function (day) {
        var it = (day[cp[0]] || [])[Number(cp[1])];
        if (it) it.eaten = c.checked ? 1 : 0;
      });
      keepingFocus(renderMacros);
    });

    $('macroWeek').addEventListener('click', function (e) {
      var d = e.target.closest('[data-mweek]');
      if (!d || d.disabled) return;
      S.macroDate = d.dataset.mweek === todayKey() ? null : d.dataset.mweek;
      keepingFocus(renderMacros);
    });
    /* A week each, and the week strip swiped the same way (Blake, 2026-10-18,
       "a way for me to scroll to future or past weeks within reason": the
       arrows a week, he chose, and a swipe on the bars). The same day of the
       week, so the strip moves and the day lit in it stays put. */
    $('macroPrev').addEventListener('click', function () { mNavDay(-7); });
    $('macroNext').addEventListener('click', function () { mNavDay(7); });
    /* A swipe across the week, not a scroll down past it: more across than
       down, and far enough to mean it. A tap on a day is a click, and
       still opens that day. */
    var wkX = null, wkY = 0;
    $('macroWeek').addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) { wkX = null; return; }
      wkX = e.touches[0].clientX; wkY = e.touches[0].clientY;
    }, { passive: true });
    $('macroWeek').addEventListener('touchend', function (e) {
      if (wkX === null) return;
      var t = e.changedTouches[0], dx = t.clientX - wkX, dy = t.clientY - wkY;
      wkX = null;
      if (Math.abs(dx) < 48 || Math.abs(dx) < 1.5 * Math.abs(dy)) return;
      mNavDay(dx < 0 ? 7 : -7);
    }, { passive: true });
    /* Every meal's view at once (myday.js, mViewsNow): each meal of the day
       set to the next view round from the one they share, or to Status
       when they differ. Set per meal, as a meal's name sets it, so a name
       still steps its own meal afterwards; what Status and Foods hide goes
       shut, as it does there. */
    $('macroViews').addEventListener('click', function () {
      var vk = mViewKey(), nv = MYDAY.mViewsAll().next;
      var held = (S.mView[vk] = S.mView[vk] || {});
      Array.prototype.forEach.call(document.querySelectorAll('#macroSlots [data-mview]'), function (b) {
        held[b.getAttribute('data-mview')] = nv;
      });
      S.mHydShut = S.mHydShut || {};
      S.mHydShut[vk] = nv === 1;
      if (nv !== 3 && S.mAmt && S.mAmt.indexOf(vk + '|') === 0) { S.mAmt = ''; S.mType = null; }
      keepingFocus(renderMacros);
    });

    /* Any day the log keeps, by date. The box opens its own calendar where
       the phone has one; typed or picked, a day inside the window goes. */
    $('macroDayPick').addEventListener('change', function () {
      var v = this.value;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || v < mEarliestKey() || v > mLatestKey()) return;
      S.macroDate = v === todayKey() ? null : v;
      S.mEdit = '';
      renderMacros();
    });
    /* A phone opens its calendar for a tap on the box; a desktop browser
       only for one on its own small icon, so the whole box asks for it. */
    $('macroDayPick').addEventListener('click', function () {
      try { if (this.showPicker) this.showPicker(); } catch (e) { /* the box itself is the way in */ }
    });
    /* One button, two jobs, and which one it is doing is written on its face.
       With no plan there is nothing to fill and the press opens the sheet
       that makes one — see the note where the label is set. */
    $('macroFill').addEventListener('click', function () {
      var mode = $('macroFill').dataset.mode;
      if (mode === 'plan') { mOpenTargets(); return; }
      if (mode === 'fill') { mFillDay(); return; }
      /* The meal dot one level up: it ticks a whole meal, this ticks the
         whole day. Recording that you ate it is exactly what it claims to
         do, so a meal you did not eat wants the skip rather than this. */
      if (mode === 'tickall') {
        mEditDay(mViewKey(), function (d2) {
          Object.keys(d2).forEach(function (sk) {
            (d2[sk] || []).forEach(function (it) { it.eaten = 1; });
          });
        });
        renderMacros();
        return;
      }
      /* Done for the day. A statement, not a change: nothing is deleted,
         food can still be added, and pressing it again takes it back. The
         card comes up on the way IN and not on the way out — closing is the
         moment you want to be told how it went; reopening is a correction. */
      var dk = mViewKey();
      var was = mDoneAt(dk) > 0;
      mSetDone(dk, !was);
      if (!was) {
        rememberOpener();
        S.mDoneOpen = dk;
        pushSheet({ m: 1 });
        renderModal();
      }
      renderMacros();
    });

    /* Sweep the day back to what you actually ate.
     *
       Keeps every plate you ticked — clearing those would destroy a record
       rather than a plan, and the morning is usually the part you are not
       trying to change — and keeps anything you locked, because a lock is
       you saying this one stays. Everything else goes, so Fill redrafts only
       the meals it emptied.
     *
       It does not ask. Blake's call, and the same bargain the meal dot and
       the tick beside it already make: this bar acts, it does not negotiate.
       Worth knowing that there is no undo anywhere in this app, so a mis-tap
       here costs the un-eaten half of a day. */
    $('macroSweep').addEventListener('click', function () {
      /* Pinned plates stay too: a pin is your routine for that meal, and
         Blake expected the sweep to leave "locked or pinned items". */
      var pinsOf = {};
      mReadSlots().list.forEach(function (sl) {
        pinsOf[sl.k] = (sl.pins || []).map(function (pn) { return String(pn.id); });
      });
      mEditDay(mViewKey(), function (d2) {
        Object.keys(d2).forEach(function (sk) {
          d2[sk] = (d2[sk] || []).filter(function (it) {
            return it.eaten || it.l || (pinsOf[sk] || []).indexOf(String(it.id)) >= 0;
          });
        });
      });
      renderMacros();
    });
    $('macroRebal').addEventListener('click', mRebalance);

    /* The three that are not the morning. Craft is a once-a-season job, Copy
       is a once-a-day one, and the account is neither — none of them belong
       in front of the two buttons pressed every time the tab is opened. */
    /* A menu, and it behaves like one now. It said role=menu and then did
       none of what that promises: opening it left the focus on the gear, so
       a keyboard had to Tab through the day to find the items, the arrows did
       nothing, and Escape did not close it. Open, the focus goes to the first
       item and Up and Down walk the items round (Home and End jump); Escape
       closes it and hands the focus back to the gear; Tab closes it and goes
       on its way. The items are out of the Tab order themselves — the menu
       is one stop, the way a native one is. */
    function mMenuItems() {
      return Array.prototype.filter.call($('macroMenu').querySelectorAll('[role="menuitem"]'),
        function (b) { return b.offsetParent !== null && !b.disabled; });
    }
    function mMenu(open, back) {
      var m = $('macroMenu');
      if (!m) return;
      var was = !m.classList.contains('hide');
      m.classList.toggle('hide', !open);
      $('macroMore').setAttribute('aria-expanded', String(!!open));
      if (open && !was) { var its = mMenuItems(); if (its[0]) its[0].focus(); }
      if (!open && was && back) $('macroMore').focus();
    }
    /* The bar's Add food has gone, and Open all with it (2026-10-04): a
       meal's tray is the one door to adding food, and every tray already
       shows its foods. Blake: "ONE way to add and select food". */

    /* The pills are the bars folded up. Pressing them goes back to the top,
       where the bars are open again — they are the same numbers, not a
       second readout. Smoothly, so the card unrolls on the way up the same
       way it rolled shut on the way down; a jump to the top would open it in
       one frame, which is the hard switch this fold exists to be rid of. */
    $('macroPills').addEventListener('click', function () {
      if (mReduced()) { window.scrollTo(0, 0); return; }
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); }
      catch (e) { window.scrollTo(0, 0); }
    });

    $('macroFoot').addEventListener('click', function (e) {
      if (!e.target.closest('[data-mchartopen]')) return;
      rememberOpener();
      S.chartOpen = true;
      pushSheet({ m: 1 });
      renderModal();
    });

    $('macroMore').addEventListener('click', function (e) {
      e.stopPropagation();
      mMenu($('macroMenu').classList.contains('hide'));
    });
    // the gear itself: Down opens onto the first item, Up onto the last
    $('macroMore').addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      mMenu(true);
      var its = mMenuItems();
      if (e.key === 'ArrowUp' && its.length) its[its.length - 1].focus();
    });
    $('macroMenu').addEventListener('keydown', function (e) {
      var its = mMenuItems(), i = its.indexOf(document.activeElement);
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); mMenu(false, true); return; }
      if (e.key === 'Tab') { mMenu(false); return; }
      var j = e.key === 'ArrowDown' ? i + 1 : e.key === 'ArrowUp' ? i - 1 :
        e.key === 'Home' ? 0 : e.key === 'End' ? its.length - 1 : null;
      if (j === null || !its.length) return;
      e.preventDefault();
      its[(j + its.length) % its.length].focus();
    });
    /* Copy came out of the menu and onto the bar. It reports success by
       renaming itself, and a control whose only feedback is its own label
       cannot live somewhere that closes on the way out. */
    $('macroCopy').addEventListener('click', function () { mCopyDay(this); });



    $('macroMenu').addEventListener('click', function (e) {
      var b = e.target.closest('[data-mmore]');
      if (!b) return;
      mMenu(false);
      rememberOpener();
      S.macroTargOpen = true;
      if (b.dataset.mmore === 'foods') {
        S.macroTargOpen = false; S.favPick = true; S.fpOpen = {};
        renderModal();
        return;
      }
      if (b.dataset.mmore === 'eatout') {
        S.macroTargOpen = false;
        mOpenPicker(null, 'home');
        S.mpShelf = 'eatout';
        renderModal();
        return;
      }
      /* The same as the top line's pill does, which is not shown on
         Nourish since 2026-10-24: wake a stuck account, and have a code
         ready to share. */
      if (b.dataset.mmore === 'you') {
        S.macroTargOpen = false; S.syncOpen = true; S.myErr = '';
        if ((!mAuthKnown || mSyncUnreachable) && mSuspectAccount()) mSyncStart();
        if (!S.pendingCode) S.pendingCode = window.Store.newCode();
      }
      /* Any day, closed or not — the card is a reading of the day, and a day
         does not have to be finished with to be read. */
      if (b.dataset.mmore === 'went') { S.macroTargOpen = false; S.mDoneOpen = mViewKey(); }
      /* The plan sheet is one entry now. "Meals & shares" and "How My Day
         works" were two more doors into it — three in a six-item menu
         landing in one room — and both of their destinations are accordions
         the sheet already shows. */
      S.mtOpen = '';
      pushSheet({ m: 1 });
      renderModal();
      if (S.mtOpen) {
        var jump = $(S.mtOpen === 'meals' ? 'mtMeals' : 'mtHelp');
        /* Open it, not merely scroll to it. "How My Day works" pointed at a
           shut accordion at the foot of the sheet — and a shut accordion that
           has been scrolled to looks exactly like nothing having happened, so
           the entry landed a reader in the same place "Craft my plan" did and
           appeared to be the same command twice. */
        if (jump && jump.tagName === 'DETAILS') jump.open = true;
        if (jump) jump.scrollIntoView({ block: 'start' });
      }
    });
    // anywhere else is "not that, then" — the ordinary way out of a menu
    document.addEventListener('click', function () { mMenu(false); });
    /* Nothing here reaches for the network unless there is a reason.
     *
       Asking who we are means loading the Firebase SDK, and loading it on
       every page load would put a request to another host in front of every
       reader who never signs in and never asked for one — which is the
       property this app has kept since it was built, and which its own
       offline test guards. So a device that has signed in remembers that it
       did, locally, and only that device goes looking. The other door is an
       email link landing back on this page, which is visible in the URL
       without asking anybody. */
    var linkBack = /[?&](oobCode=|mode=signIn)/.test(location.search);
    var invited = /[?&]invite=([a-z0-9]{8,64})/.exec(location.search);
    if (invited) {
      mInviteSet(invited[1]);
      try {
        var q = new URLSearchParams(location.search);
        q.delete('invite');
        var rest = q.toString();
        history.replaceState(history.state, '', location.pathname + (rest ? '?' + rest : '') + location.hash);
      } catch (e) { /* older browser: the token stays in the bar */ }
    }
    var hasAcct = false;
    try { hasAcct = localStorage.getItem('bsc.myAccount') === '1'; } catch (e) { /* private */ }
    if (linkBack && window.Store.completeEmailLink) {
      window.Store.completeEmailLink().then(function (res) {
        if (res) { S.mySent = false; mAccountMark(); renderModal(); }
        mSyncStart();
      }, function () { mSyncStart(); });
    } else if (hasAcct) {
      mSyncStart();
      mWatchUser();
    }
    /* Somebody sent a link. Signed in, it is spent by mSyncStart above; signed
       out, the sheet opens on the one thing to do about it. */
    if (mInviteGet() && !hasAcct) {
      S.syncOpen = true;
      if (!S.pendingCode) S.pendingCode = window.Store.newCode();
      pushSheet({ s: 1 });
      renderModal();
    }

    /* The scale's number, filed under the day being looked at — ‹ lets a
       missed morning be filled in after the fact. An emptied box un-logs it.
     *
     * Two saves, one truth. The quiet one runs a beat after each keystroke,
     * so a phone pocketed mid-entry has still kept the number — but it does
     * NOT redraw, because redrawing the box being typed in eats the trailing
     * "." of 187.4 as it passes through 187. The loud one runs on leaving the
     * box, cancels any quiet save still pending, and redraws the stats. The
     * day key is captured when typing starts: a pending save must not follow
     * the ‹ › onto a different morning. */
    var mwTimer = null;
    /* The weigh-in folds like a meal, but it is its own container — the
       meals' delegated handler never sees it. */
    /* Eat this instead. It rewrites the day's grams at the same split the
       plan already uses, so the shape of the day survives the change — only
       its size moves. */
    $('macroWeigh').addEventListener('click', function (e) {
      var b = e.target.closest('[data-mline]');
      if (!b) return;
      var parts = b.dataset.mline.split(':');
      if (parts[1] === 'moved') {
        var rec0 = mTargRec();
        if (!rec0 || !rec0.moved) return;
        if (parts[2] === 'undo') {
          /* Back to what was there, and left there: somebody who undid the
             weekly change has said these grams are theirs. */
          var pv = rec0.moved.prev || {};
          mWriteTargets({ p: pv.p, f: pv.f, c: pv.c, auto: 0, set: todayKey() });
        } else {
          mWriteTargets(Object.assign({}, rec0, { moved: Object.assign({}, rec0.moved, { ok: 1 }) }));
        }
        renderMacros();
        return;
      }
      /* Not a class on a node this time: the node is about to be replaced.
         Hiding it was the whole bug. */
      if (parts[1] !== 'eat') {
        mSetHush(mViewKey(), parts.slice(2).join(':'));
        renderMacros();
        return;
      }
      var want = Number(parts[2]);
      var t = mReadTargets(), now = kcalOf(t);
      if (!want || !now) return;
      /* Protein holds its grams: it is the thing a cut protects, and scaling
         it with the calories would give back exactly what the deficit is for.
         Fat keeps its floor. The rest lands on carbohydrate. */
      var pr = mReadProfile();
      var sp = mSplitKcal(want, t, pr);
      /* A choice, like grams typed into the boxes: the weekly follow must not
         put the plan's number back over it a week later and then offer this
         same button again. The morning line goes on coaching from here. */
      mWriteTargets({ p: sp.p, f: sp.f, c: sp.c, auto: 0, set: todayKey() });
      renderMacros();
    });

    $('macroWeigh').addEventListener('click', function (e) {
      /* The way into the plan, wherever the card is showing it: on the face
         while there is no plan to adjust, behind the press once there is. */
      if (e.target.closest('#macroTargBtn')) { if (WGAPI.hide) WGAPI.hide(); mOpenTargets(); return; }
      if (e.target.closest('#macroWeekBtn')) { if (mWeekOn()) { if (WGAPI.hide) WGAPI.hide(); window.Train.openCheckin(); } return; }
      var mws = e.target.closest('[data-mwsave]');
      if (mws) {
        var wIn0 = $('mWeight');
        if (wIn0) {
          clearTimeout(mwTimer);
          var k0 = mViewKey(), gotw = mWeightOf(wIn0.value, k0);
          mWeightSay(gotw.big ? 'big' : !!gotw.bad, gotw.odd ? gotw : null);
          if (!gotw.bad && !gotw.odd && !gotw.empty) {
            mWriteWeight(k0, gotw.lb);
            mws.classList.add('saved');
            mws.textContent = 'Saved ✓';
            if (WGAPI.week) WGAPI.week();
          }
          wIn0.blur();
        }
        return;
      }
      /* The check-in's rows (src/checkin.js): it changes the record, this
         redraws. The day is the one on screen, which in the sheet is today. */
      var am = e.target.closest('[data-am]');
      if (am) {
        if (mCheckinClick(am, mViewKey())) keepingFocus(renderMacros);
        return;
      }
      var tr = e.target.closest('[data-mtrained]');
      if (tr) {
        var tk = tr.dataset.mtrained;
        mSetTrained(tk, !mIsTrainingDay(tk));
        keepingFocus(renderMacros);
        return;
      }
      var wf = e.target.closest('[data-mfold]');
      if (!wf) return;
      S.mFold.weigh = !(wf.getAttribute('aria-expanded') === 'false');
      keepingFocus(renderMacros);
    });

    /* Water & Drinks card on Nourish (#macroSlots): delegates [data-hyd] and [data-hydmg]
       to the same checkin handlers as the morning card. */
    $('macroSlots').addEventListener('click', function (e) {
      var hm = e.target.closest && e.target.closest('[data-hyd]');
      if (!hm) return;
      if (mCheckinClick(hm, mViewKey())) keepingFocus(renderMacros);
    });
    var hydAmTimer = null;
    $('macroSlots').addEventListener('input', function (e) {
      if (!e.target.hasAttribute || (!e.target.hasAttribute('data-hydmg') && !e.target.hasAttribute('data-hydoz'))) return;
      clearTimeout(hydAmTimer);
      var el = e.target, key = mViewKey();
      hydAmTimer = setTimeout(function () { mCheckinInput(el, key); }, 500);
    });
    $('macroSlots').addEventListener('change', function (e) {
      if (!e.target.hasAttribute || (!e.target.hasAttribute('data-hydmg') && !e.target.hasAttribute('data-hydoz'))) return;
      clearTimeout(hydAmTimer);
      if (mCheckinInput(e.target, mViewKey())) renderMacros();
    });

    /* What counts as a weight, in one place.
     *
       Digits, optionally a point and up to two more. A comma fails it, and so
       does anything else that is not a number — which is the whole point:
       "80,5" used to reach here as "805" because the number input had already
       thrown the comma away, and eight hundred and five pounds passed every
       guard there was. Nothing is stored while the box holds something that
       is not a weight, and the box says so rather than guessing which number
       you meant.
     *
       An empty box is not bad input — it is how you clear a morning. */
    function mWeightOf(raw, key) {
      var t = String(raw == null ? '' : raw).trim();
      if (!t) return { empty: true, lb: 0 };
      if (!/^\d{1,4}(\.\d{1,2})?$/.test(t)) return { bad: true, lb: 0 };
      var typed = Number(t), u = mWUnit();
      if (!isFinite(typed) || typed <= 0) return { bad: true, lb: 0 };
      // typed in the box's unit, kept in pounds (see mWUnit)
      var n = u === 'kg' ? typed * MKG_LB : typed;
      if (n > 1500) return { bad: true, big: true, lb: 0 };
      /* A number that could be a weight but is not likely to be yours.
         "1905" for 190.5 used to be clamped to 1,500 and stored in silence;
         the seven-day average went to 377, the plan was healed up by 600 kcal
         to match, and correcting the morning afterwards did not bring it back
         down — the heal only ever raises. Far from your own average, or far
         from any adult's, it is asked about before it is written. */
      /* And the first morning ever is asked about under 90 lb, not 60: with
         nothing on record to compare it to, a kilogram reading typed into a
         box in pounds — 86 for 190 — is the likely mistake, and it would
         become the weight the whole plan is worked out for. */
      var st = mWeightStats();
      var ref = st && st.n >= 3 ? st.avg7 : 0;
      var first = !Object.keys(MWEIGHTS).some(function (k2) { return k2 !== key; });
      var odd = n < (first ? 90 : 60) || n > 700 || (ref > 0 && Math.abs(n - ref) > ref * 0.15);
      return { lb: n, odd: odd, ref: ref, first: first, shown: typed, u: u };
    }
    /* ---- the weigh-in, on Today ----
     * Nourish's morning card, borrowed: opening Today's weigh-in moves the
     * card itself (#macroWeigh, with every handler it has) into the sheet,
     * and closing puts it back where it lives. One card, one set of rules,
     * the comma refused and the odd number asked about wherever it is typed.
     * Under it, the week before today, any morning fixable in place. */
    var WG = { open: false, home: null, next: null, fold: undefined, fix: '', histOpen: false };
    /* The sheet exists only while it is open: built here, and gone when it
       shuts, so nothing hidden is left on the page to be found instead. */
    function wgFrame() {
      var el = document.createElement('div');
      el.id = 'weighSheet';
      el.className = 'scrim no-print';
      el.setAttribute('data-wclose', '1');
      /* "Good morning", since the check-in joined the scale: the sheet asks
         about the night and the day before as well as the weight. */
      el.innerHTML = '<div class="sheet wg-sheet" role="dialog" aria-modal="true" aria-label="Good morning: weigh in and check in">' +
        '<div class="sheet-top"><div class="sheet-eyebrow">Good morning</div>' +
          '<button class="sheet-x" data-wclose="1" aria-label="Close">&times;</button></div>' +
        '<div id="weighHost"></div><div id="weighWeek"></div><div id="weighFoot"></div></div>';
      el.addEventListener('click', wgClick);
      el.addEventListener('keydown', function (e) {
        if (e.target.id === 'wFixIn' && e.key === 'Enter') { var b = el.querySelector('[data-wsave]'); if (b) b.click(); }
      });
      document.body.appendChild(el);
      return el;
    }
    function wgPut(back) {
      var card = $('macroWeigh');
      if (!card) return;
      if (back) { if (WG.home) WG.home.insertBefore(card, WG.next); }
      else { WG.home = card.parentNode; WG.next = card.nextSibling; $('weighHost').appendChild(card); }
    }
    function wgKeyBack(n) { var d = keyDate(todayKey()); d.setDate(d.getDate() - n); return dayKey(d); }
    function wgWeek() {
      var el = $('weighWeek');
      if (!el || !WG.open) return;
      var u = mWUnit(), rows = '';
      for (var i = 1; i <= 7; i++) {
        var key = wgKeyBack(i), v = MWEIGHTS[key], d = keyDate(key);
        var day = '<b>' + d.toLocaleDateString('en-US', { weekday: 'short' }) + '</b> ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        rows += WG.fix === key
          ? '<div class="wg-row wg-fixing"><span>' + day + '</span><label class="wg-in"><input type="text" id="wFixIn" maxlength="6" inputmode="decimal" autocomplete="off" ' +
              'aria-label="Weight on ' + esc(d.toDateString()) + ' in ' + (u === 'kg' ? 'kilograms' : 'pounds') + '" value="' + (v ? mWShow(v) : '') + '"> ' + u + '</label>' +
              '<button class="btn-primary" data-wsave="' + key + '">Save</button><button class="nut-ask" data-wcancel="1">Cancel</button>' +
              '<span class="wg-note" id="wFixNote" role="status"></span></div>'
          : '<button class="wg-row" data-wfix="' + key + '"><span>' + day + '</span><b>' + (v ? mWShow(v) + ' ' + u : '<i>none</i>') + '</b><i aria-hidden="true">\u203a</i></button>';
      }
      var hOpen = !!(WG.histOpen || WG.fix);
      var st = mWeightStats();
      var avgBadge = st && st.n >= 2 ? ' \u00b7 ' + mWShow(st.avg7) + ' ' + u + ' 7-day avg' : '';
      el.innerHTML = '<button type="button" class="dsh-rl wg-hist-tog" data-wtoggle="1" aria-expanded="' + hOpen + '">' +
        '<span>The last week' + avgBadge + ' \u00b7 tap one to fix it</span><i aria-hidden="true">' + (hOpen ? '\u25b4' : '\u25be') + '</i></button>' +
        '<div class="wg-hist-list' + (hOpen ? ' open' : '') + '">' + rows + '</div>';
      var foot = $('weighFoot');
      if (foot) {
        var tk = todayKey(), amR = mAmOf(tk), doneN = 0;
        if (MWEIGHTS[tk] > 0) doneN++;
        if (typeof amR.sl === 'number') doneN++;
        if (typeof amR.sy === 'number') doneN++;
        if (amR.cr === 1) doneN++;
        foot.innerHTML = '<div class="wg-foot-bar">' +
          '<span class="wg-prog' + (doneN === 4 ? ' all' : '') + '">' +
            (doneN === 4 ? 'All 4 checked in ✓' : doneN + ' of 4 checked in') +
          '</span>' +
          '<button type="button" class="btn-primary wg-done-btn" data-wdone="1">Save &amp; Done ✓</button>' +
        '</div>';
      }
    }
    function wgOpen() {
      if (WG.open || !$('macroWeigh')) return;
      /* The card as it always is: a morning not weighed is the box and
         nothing else, weighing opens it, its own handle folds it. */
      S.macroDate = null;                // the sheet is about this morning
      WG.fix = '';
      WG.histOpen = false;
      wgFrame();
      wgPut(false);
      WG.open = true;
      document.body.style.overflow = 'hidden';
      pushSheet({ wg: 1 });
      renderMacros();
      var w = $('mWeight');
      if (w && !MWEIGHTS[todayKey()]) w.focus(); else { var x = document.querySelector('#weighSheet .sheet-x'); if (x) x.focus(); }
    }
    /* Shut, and the card goes home. hide() is the same without touching the
       history: a sheet opened from inside it (the plan, the week) takes its
       place, and back from that one lands on Today. */
    function wgHide() {
      if (!WG.open) return;
      wgPut(true);
      WG.open = false;
      var fr = $('weighSheet');
      if (fr) fr.parentNode.removeChild(fr);
      if (!document.querySelector('#modalRoot .scrim')) document.body.style.overflow = '';
      if (S.view === 'macros') renderMacros();
      if (S.view === 'today' && window.Today) window.Today.render();
    }
    WGAPI.open = wgOpen; WGAPI.hide = wgHide; WGAPI.close = wgHide; WGAPI.week = wgWeek;
    WGAPI.isOpen = function () { return WG.open; };
    function wgClick(e) {
      if (e.target.closest('[data-wclose]') && (e.target === e.currentTarget || e.target.closest('.sheet-x'))) { close(); return; }
      if (e.target.closest('[data-wtoggle]')) { WG.histOpen = !WG.histOpen; wgWeek(); return; }
      if (e.target.closest('[data-wdone]')) {
        var tk = todayKey(), wBox = $('mWeight'), stBox = $('amSteps');
        if (wBox) {
          var got0 = mWeightOf(wBox.value, tk);
          if (!got0.bad && !got0.odd && !got0.empty) mWriteWeight(tk, got0.lb);
        }
        if (stBox) mCheckinInput(stBox, tk);
        close();
        return;
      }
      var fx = e.target.closest('[data-wfix]');
      if (fx) { WG.fix = fx.dataset.wfix; WG.histOpen = true; wgWeek(); var fi = $('wFixIn'); if (fi) { fi.focus(); fi.select(); } return; }
      if (e.target.closest('[data-wcancel]')) { WG.fix = ''; wgWeek(); return; }
      var sv = e.target.closest('[data-wsave]');
      if (sv) {
        var key = sv.dataset.wsave, raw = ($('wFixIn') || {}).value, got = mWeightOf(raw, key);
        var note = $('wFixNote');
        if (got.bad) { if (note) note.textContent = got.big ? 'More than anyone weighs. A point missing?' : 'Weights take digits and a point.'; return; }
        var write = function () { mWriteWeight(key, got.empty ? 0 : got.lb); WG.fix = ''; renderMacros(); };
        if (got.odd) {
          ask({ title: 'Keep ' + got.shown + ' ' + got.u + '?', body: got.ref ? 'Your average lately is ' + mWShow(got.ref) + ' ' + got.u + '.' : 'That is outside what a weight usually is.', ok: 'Keep it' },
            function (yes) { if (yes) write(); });
          return;
        }
        write();
      }
    }

    function mWeightSay(bad, odd) {
      var el = $('mWeightNote');
      if (el) el.textContent = bad === 'big' ? 'More than anyone weighs. A point missing?'
        : bad ? 'Weights take digits and a point.'
        : odd ? 'That is ' + odd.shown + ' ' + odd.u + (odd.ref ? ', against ' + mWShow(odd.ref) +
          ' lately' : '') + '. Enter to keep it.' : '';
      var box = $('mWeight');
      if (box) box.setAttribute('aria-invalid', bad ? 'true' : 'false');
    }
    /* Steps and a drink's milligrams save as they are typed, and redraw only
       when the box is left: a redraw mid-number would rebuild the box under
       the thumb typing into it. */
    var amTimer = null;
    $('macroWeigh').addEventListener('input', function (e) {
      if (e.target.id !== 'amSteps' && !e.target.hasAttribute('data-ammg') && !e.target.hasAttribute('data-amoz')) return;
      clearTimeout(amTimer);
      var el = e.target, key = mViewKey();
      if (el.id === 'amSteps') {
        var sb = document.querySelector('#macroWeigh [data-am="sysave"]');
        if (sb) { sb.classList.remove('saved'); sb.textContent = 'Save'; }
      }
      amTimer = setTimeout(function () {
        if (mCheckinInput(el, key) && el.id === 'amSteps') {
          var sb2 = document.querySelector('#macroWeigh [data-am="sysave"]');
          if (sb2) { sb2.classList.add('saved'); sb2.textContent = 'Saved ✓'; }
          if (WGAPI.week) WGAPI.week();
        }
      }, 500);
    });
    $('macroWeigh').addEventListener('change', function (e) {
      if (e.target.id !== 'amSteps' && !e.target.hasAttribute('data-ammg') && !e.target.hasAttribute('data-amoz')) return;
      clearTimeout(amTimer);
      if (mCheckinInput(e.target, mViewKey())) renderMacros();
    });
    $('macroWeigh').addEventListener('input', function (e) {
      if (e.target.id !== 'mWeight') return;
      clearTimeout(mwTimer);
      var key = mViewKey(), got = mWeightOf(e.target.value, key);
      mWeightSay(got.big ? 'big' : !!got.bad, got.odd ? got : null);
      var wb = document.querySelector('#macroWeigh [data-mwsave]');
      if (wb) { wb.classList.remove('saved'); wb.textContent = 'Save'; }
      if (got.bad || got.odd) return;            // nothing is written from nonsense, or unasked
      mwTimer = setTimeout(function () {
        mWriteWeight(key, got.lb);
        var wb2 = document.querySelector('#macroWeigh [data-mwsave]');
        if (wb2) { wb2.classList.add('saved'); wb2.textContent = 'Saved ✓'; }
        if (WGAPI.week) WGAPI.week();
      }, 600);
    });
    $('macroWeigh').addEventListener('change', function (e) {
      if (e.target.id !== 'mWeight') return;
      clearTimeout(mwTimer);
      var got = mWeightOf(e.target.value, mViewKey());
      mWeightSay(got.big ? 'big' : !!got.bad, got.odd ? got : null);
      if (got.bad) return;
      if (got.odd) {
        var oddKey = mViewKey();
        ask({
          title: 'Keep ' + got.shown + ' ' + got.u + '?',
          body: got.ref ? 'Your average lately is ' + mWShow(got.ref) + ' ' + got.u + '.'
            : got.first && got.u === 'lb' && got.lb < 90
            ? 'That is light for a first weigh-in. If your scale reads kilograms, choose Kilograms ' +
              'under \u201cWeights in\u201d in Strengthen and this box will ask in kg.'
            : 'That is outside what a weight usually is.',
          ok: 'Keep it'
        }, function (yes) {
          if (!yes) return;
          mWriteWeight(oddKey, got.lb);
          mWeightSay(false, null);
          S.mFold.weigh = false;
          renderMacros();
        });
        return;
      }
      mWriteWeight(mViewKey(), got.lb);
      /* Committing a weight opens the card, once.
       *
         The card sits shut on a morning you have not weighed yet, because
         until you have there is nothing for it to say — it used to open on
         "not yet" and then talk for three lines about an average, a week and
         a pace, all of it evidence for a number that was not there. Handing
         it the number is the one moment that evidence is worth the room, so
         that is the moment it answers. After this the row is the handle and
         it stays wherever you last put it. */
      S.mFold.weigh = false;
      keepingFocus(renderMacros);
    });

    /* Paper has no fold. A folded meal is a list of dish names with no numbers
       on them, which is not a day anybody can read off a page — and CSS cannot
       open it, because the plates are not in the document at all while it is
       shut. So the day opens for the printer and closes again afterwards.
     *
       Opening it costs something, though, and that cost went unpaid for a
       while: an open meal says its verdict in the bars, and the bars are
       background colour a printer drops. Opening every meal therefore threw
       away the one thing on the card that was printable — the chips. So the
       day is also marked as being drawn for paper, which puts them back on
       the open card. Same verdict, in ink.
     *
       `mOnPaper` was never DECLARED, and under 'use strict' an assignment to
       a name that does not exist throws. It threw on the line before
       renderMacros(), so the whole point of the handler — opening the day
       for the printer — never happened: a day with a folded meal printed as
       dish names with no numbers, which is the exact thing the paragraph
       above says this exists to prevent. Two uncaught ReferenceErrors per
       print, on every print from My Day, since the day it was written.
     *
       Declared here. Note that nothing READS it yet: the "chips back on the
       open card" half of the paragraph above is still unbuilt, and is left
       visible rather than quietly deleted, because the fold half is the half
       that was doing the damage. */
    var mOnPaper = false;
    var mPrintFold = null;
    if (window.addEventListener) {
      window.addEventListener('beforeprint', function () {
        if (S.view !== 'macros') return;
        mPrintFold = S.mFold;
        S.mFold = {};
        // every meal whole on paper, whatever view each card is in
        S.mViewAll = 3;
        mOnPaper = true;
        /* Held on the day it is already on, so the arrival seed does not run
           and fold everything straight back down. */
        S.mFoldFor = mViewKey();
        renderMacros();
      });
      window.addEventListener('afterprint', function () {
        if (mPrintFold === null) return;
        S.mFold = mPrintFold;
        mPrintFold = null;
        S.mViewAll = 0;
        mOnPaper = false;
        renderMacros();
      });
    }

    /* A phone that sat open overnight should show the new day the moment it is
       looked at again, not yesterday's finished plan. Only when the reader has
       not deliberately navigated somewhere else. */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) return;
      /* The weekly follow ran at boot only, and an installed app is resumed
         far more often than it is started: a phone that never closed it never
         followed the scale. Asked again on coming back — once the boot-time
         decision has been made, so a device with an account still waits for
         it. It moves nothing unless a week has passed. */
      var followed = !mBootTargetsDue && mFollowScale();
      if (S.view === 'macros' && (!S.macroDate || followed)) renderMacros();
      /* Today too: resumed after midnight it went on showing yesterday's
         dinner and "2,035 left today" until a tab was switched. */
      if (S.view === 'today' && window.Today) window.Today.render();
    });

    document.addEventListener('click', function (ev) {
      if (!ev.target.closest || !ev.target.closest('#clearPlan')) return;
      if (!planIds().length) { window.Store.clearPlan(); return; }
      ask({
        title: 'Clear every recipe from this week?',
        body: 'The shopping list starts over with it.',
        ok: 'Clear the week', danger: true
      }, function (yes) { if (yes) window.Store.clearPlan(); });
    });

    $('dialogRoot').addEventListener('click', function (e) {
      var b = e.target.closest('[data-dlg]');
      if (!b || (b.dataset.dlg === 'cancel' && b !== e.target && !e.target.closest('button'))) return;
      closeDialog(b.dataset.dlg === 'ok' ? dialogAnswer() : null);
    });

    $('dialogRoot').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.id === 'dlgInput') { e.preventDefault(); closeDialog(dialogAnswer()); }
    });

    $('listBody').addEventListener('change', function (e) {
      var c = e.target.closest('[data-check]');
      if (!c) return;
      window.Store.toggleChecked(c.dataset.check);
    });

    /* Tapping a cover downloads it — the anchor does that by itself — and
       also brings it up in the preview underneath, so what you just took is
       what you are looking at. The fold-and-staple link beside it is a
       download and nothing else; it must not move the preview, or reaching
       for the booklet would silently change the book on screen. */
    var pick = function (e) {
      /* No signal: the download would go nowhere and say nothing. */
      if (e.target.closest('[data-fold], [data-get]') && navigator.onLine === false) {
        e.preventDefault();
        mToast('The PDFs download from the internet. Try again with signal.');
        return;
      }
      if (e.target.closest('[data-fold], [data-get], #doPrint')) return;
      var b = e.target.closest('[data-print]');
      if (!b || b.dataset.print === S.printSet) return;
      S.printSet = b.dataset.print;
      renderBook();
    };
    $('printRows').addEventListener('click', pick);
    // and the buttons say so as the signal comes and goes
    var signal = function () { if (S.view === 'book') renderDownloads(); };
    window.addEventListener('online', signal);
    window.addEventListener('offline', signal);
    /* The picked sets moved out of the shelf into their own row and very
       nearly moved out of reach with it — the handler was bound to the shelf
       alone, so Favorites and the week were buttons that did nothing. */
    $('printPicked').addEventListener('click', pick);

    // the browser's install offer arrives when it likes, often after the sheet is open
    window.addEventListener('hiveinstall', function () { if (S.syncOpen) renderModal(); });
    window.addEventListener('resize', fitPages);
    window.addEventListener('resize', syncTabsFade);
    window.addEventListener('resize', syncStick);
    syncStick();
    /* The app draws itself after the page loads, so a scroll position the
       browser puts back belongs to a page that does not exist yet: it lands
       in whatever happens to be there, and then everything that renders
       afterwards pushes it further. Opening at the top is both what a day
       wants and what lets the fold take its one honest measurement before it
       is asked to do anything. */
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.addEventListener('scroll', onScrollShrink, { passive: true });
    window.addEventListener('scroll', onScrollStrip, { passive: true });
    window.addEventListener('resize', onResizeFold);
    window.addEventListener('resize', onScrollStrip);
    document.querySelector('.tabs').addEventListener('scroll', syncTabsFade, { passive: true });
    syncTabsFade();

    /* The hint is the door as well as the sign — "where do I go" should be
       answered by going there, not by being pointed at a corner. Opening it
       also puts the hint away: the question has been asked. */
    $('shareHintGo').addEventListener('click', function () {
      dismissHint();
      rememberOpener();
      S.syncOpen = true;
      if (!S.pendingCode) S.pendingCode = window.Store.newCode();
      pushSheet({ s: 1 });
      renderModal();
      var x = document.querySelector('.sheet-x');
      if (x) x.focus();
    });
    $('shareHintX').addEventListener('click', dismissHint);

    $('syncBtn').addEventListener('click', function () {
      rememberOpener();
      S.syncOpen = true;
      S.myErr = '';
      if ((!mAuthKnown || mSyncUnreachable) && mSuspectAccount()) mSyncStart();
      if (!S.pendingCode) S.pendingCode = window.Store.newCode();
      pushSheet({ s: 1 });
      renderModal();
      var x = document.querySelector('.sheet-x');
      if (x) x.focus();
    });

    document.addEventListener('click', function (e) {
      var root = $('modalRoot');
      if (!root.contains(e.target)) return;

      // the backdrop itself, or the × — anything inside the sheet falls through
      /* The × and the scrim have always closed a sheet; a button that says
         Done now does too. NOT keyed on [data-close], which is on the scrim
         as well — closest() would find it from anywhere inside the sheet and
         every click in the card would shut it. That attribute turns out to be
         decorative everywhere it appears, which is exactly why the Done
         button did nothing: it was wearing a wire that was never connected. */
      /* One × goes back rather than out: a looked-up food's page, opened
         from a meal's sheet, returns to that meal as its Cancel did
         (camera.js, mNfShortHTML), so it carries data-nf and is answered
         there. */
      if (e.target.classList.contains('scrim') ||
        e.target.closest('.sheet-x:not([data-nf]), .sheet-done')) { close(); return; }

      /* A reference in a step, followed. Each hop is a history entry, so the
         back gesture walks the trail home. Scale resets, because the gravy
         does not inherit the roast's. */
      var xr = e.target.closest('.xref[data-open], .ing-make[data-open]');
      if (xr) { openRecipe(idOf(xr.dataset.open)); return; }

      var ed = e.target.closest('[data-edit]');
      if (ed) { openEditor(idOf(ed.dataset.edit)); return; }

      var act = e.target.closest('[data-ed]');
      if (act) { editorAction(act.dataset.ed); return; }

      var fav = e.target.closest('[data-fav]');
      if (fav) { window.Store.toggleFav(idOf(fav.dataset.fav)); return; }

      var add = e.target.closest('[data-add]');
      if (add) {
        var id = idOf(add.dataset.add), day = add.dataset.day;
        /* Whatever size you are looking at is the size that goes into the
           week — but only in sizes the week understands. A recipe opened
           from My Day arrives scaled to make ONE PERSON'S portion, which can
           be an eighth of a roast; letting that through planned an eighth of
           a roast for the whole family and shrank the shopping list to
           match. Snap to the batch sizes the week is built from. */
        var batch = SCALES.reduce(function (best, v) {
          return Math.abs(v - S.scale) < Math.abs(best - S.scale) ? v : best;
        }, SCALES[0]);
        if (window.Store.day(day).some(function (x) { return x.id === id; })) window.Store.removeFromDay(id, day);
        else window.Store.addToDay(id, day, batch);
        return;
      }

      var w = e.target.closest('[data-why]');
      if (w) { S.why = !S.why; renderModal(); return; }

      var sc = e.target.closest('[data-scale]');
      if (sc) {
        /* Halving stops at a quarter, but a sheet that arrived below that
           from a plate must not go UP on the minus key: it stays. */
        S.scale = sc.dataset.scale === 'up' ? Math.min(8, S.scale * 2)
          : Math.max(Math.min(0.25, S.scale), S.scale / 2);
        renderModal();
        return;
      }

      var un = e.target.closest('[data-units]');
      if (un) {
        // pressing the one already chosen is a no-op, not a flip back
        if (un.dataset.units === S.units) return;
        S.units = un.dataset.units;
        try { localStorage.setItem('sh.units', S.units); } catch (err) { /* private mode */ }
        renderModal();
        return;
      }

      var fsm = e.target.closest('[data-mfsmeal]');
      if (fsm && S.foodOpen) {
        mFsRefresh();
        S.foodOpen.pick = fsm.dataset.mfsmeal;
        renderModal();
        return;
      }
      /* A food of your own, its numbers fixed from the label (foodsheet.js,
         mFoodFixHTML): the form over the food's page, and back to it. */
      if (e.target.closest('[data-mffix]') && S.foodOpen) {
        S.foodOpen.fix = 1;
        renderModal();
        return;
      }
      if (e.target.closest('[data-mffno]') && S.foodOpen) {
        S.foodOpen.fix = 0;
        renderModal();
        return;
      }
      if (e.target.closest('[data-mffsave]') && S.foodOpen) {
        var xr = BY_ID[S.foodOpen.id], xgot = xr && mFsFixRead(xr);
        if (!xgot) return;
        if (xgot.err) { if ($('mffNote')) $('mffNote').textContent = xgot.err; return; }
        var xkey = String(xr.id).replace(/^f:my:/, ''), xmine = mReadMyFoods(), xrec = xmine[xkey];
        if (!xrec || String(xr.id).indexOf('f:my:') !== 0) return;
        var xp = xgot.per;
        /* Over the food's own unit, so every plate keeps its amount. The
           calories typed are kept for a food with no macros to count them
           from; with macros, the day counts four, four and nine (mBuildFoods). */
        xrec.kcal = xp.kcal || 0; xrec.p = xp.p; xrec.f = xp.f; xrec.c = xp.c;
        ['na', 'fib'].forEach(function (k4) { if (xp[k4] === undefined) delete xrec[k4]; else xrec[k4] = xp[k4]; });
        var xlab = {};
        ['sat', 'chol', 'sug', 'ca', 'fe', 'k'].forEach(function (k4) { if (xp[k4] !== undefined) xlab[k4] = xp[k4]; });
        if (Object.keys(xlab).length) xrec.lab = xlab; else delete xrec.lab;
        if (xgot.sz) xrec.sz = xgot.sz; else delete xrec.sz;
        if (xgot.code) xrec.code = xgot.code; else delete xrec.code;
        mWriteMyFoods(xmine);
        mBuildFoods();
        S.foodOpen.fix = 0;
        S.foodOpen.amt = undefined;
        mToast(esc(xr.name) + ' fixed. Every day it is on counts the label’s numbers now.');
        renderMacros();
        renderModal();
        return;
      }
      var fsa = e.target.closest('[data-mfsadd]');
      if (fsa && S.foodOpen) {
        mFsRefresh();
        var fr = BY_ID[S.foodOpen.id], fx = fr && mFsState(fr).x, fsk = fsa.dataset.mfsadd, fk = mViewKey();
        if (!fr || !fx || !fsk) return;
        var fate = mAddsEaten(fk, fsk);
        // disarmed first: close() lands later, and a second tap in between added it again
        S.foodOpen = null;
        S.mBackPending = !!S.macroPick;
        mEditDay(fk, function (d5) {
          (d5[fsk] = d5[fsk] || []).push({ id: fr.id, x: fx, eaten: fate });
        });
        mToast(esc(fr.name) + ' added to ' + esc(mSlotName(fsk)) + '.');
        close();
        renderMacros();
        return;
      }
      var mcp = e.target.closest('[data-mcopy]');
      if (mcp && (S.mCopyFrom || S.macroPick)) {
        var toK = mViewKey(), csk = S.mCopyFrom ? S.mCopyFrom.slot : S.macroPick.slot, fromK = mcp.dataset.mcopy;
        var wasFrom = !!S.mCopyFrom;
        /* Disarm a second tap on the empty-header shortcut before the sheet
           finishes closing so yesterday's meal cannot be added twice. */
        if (!wasFrom && (mDay(toK)[csk] || []).some(function (it) { return !!BY_ID[it.id]; })) return;
        var its = mCopyItems(fromK, csk);
        S.mCopyFrom = null;
        if (its.length) {
          var cate = mAddsEaten(toK, csk);
          mEditDay(toK, function (d6) {
            d6[csk] = (d6[csk] || []).concat(its.map(function (it) {
              return { id: it.id, x: it.x, eaten: cate };
            }));
          });
          mToast(its.length + (its.length === 1 ? ' plate' : ' plates') + ' from ' + esc(mLongDate(fromK)) +
            ' added to ' + esc(mSlotName(csk)) + '.');
        }
        S.mBackPending = wasFrom && !!S.macroPick;
        close();
        renderMacros();
        return;
      }

      var mkd = e.target.closest('[data-mkdo]');
      if (mkd && S.keepMeal) {
        var nm3 = String((($('mkName') || {}).value) || '').trim();
        if (!nm3) { $('mkNote').textContent = 'It needs a name to be found again.'; return; }
        var sk3 = S.keepMeal;
        var newId = mSaveMeal(sk3, nm3, mkd.dataset.mkdo === 'share');
        if (!newId) { $('mkNote').textContent = 'Nothing on this meal to keep.'; return; }
        /* The meal becomes the thing it just became: four rows collapse into
           the one they were always describing, at the portion they add up to.
           Leaving the parts behind would double the day. */
        /* Eaten if every part was. Written as un-eaten regardless, a lunch
           already finished came back as a plan: off the eaten bar, back in
           the meal's ask, and first in line for the sweeper. */
        mEditDay(mViewKey(), function (day) {
          var had = (day[sk3] || []).filter(function (it) { return BY_ID[it.id]; });
          var all = had.length > 0 && had.every(function (it) { return !!it.eaten; });
          day[sk3] = [{ id: newId, x: 1, eaten: all ? 1 : 0 }];
        });
        S.keepMeal = '';
        S.mBackPending = !!S.macroPick;
        close();
        renderMacros();
        return;
      }

      var mch = e.target.closest('[data-mchart]');
      if (mch && S.chartOpen) {
        S.chartWhich = mch.dataset.mchart;
        renderModal();
        return;
      }
      var mcr = e.target.closest('[data-mcrng]');
      if (mcr && S.chartOpen) {
        S.mcRange = mcr.dataset.mcrng;
        renderModal();
        return;
      }

      /* A chip flips its own pressed state and refreshes the list. NOT a
         renderModal: that would rebuild the sheet, and the sheet now holds
         the search box — a chip pressed mid-word would redraw the input and
         take the caret with it. Same rule the keystroke path follows. */
      var msh = e.target.closest('[data-mpshelf]');
      if (msh && S.macroPick) {
        var want = msh.dataset.mpshelf;
        S.mpShelf = S.mpShelf === want ? '' : want;
        S.mpSpot = '';
        S.mpKind = '';
        var rail = $('mpShelves');
        if (rail) {
          Array.prototype.forEach.call(rail.querySelectorAll('[data-mpshelf]'), function (b2) {
            var on = b2.dataset.mpshelf === S.mpShelf;
            b2.setAttribute('aria-pressed', String(on));
            b2.classList.toggle('on', on);
          });
        }
        refreshMacroPicker();
        return;
      }

      /* A type chip (fast food, sit-down, grab & go) narrows the places after
         it as well as the list, so the row is drawn again, not just re-lit;
         a place picked under another type is let go. */
      var mkd = e.target.closest('[data-mpkind]');
      if (mkd && S.macroPick) {
        var wantKind = mkd.dataset.mpkind;
        S.mpKind = (!wantKind || S.mpKind === wantKind) ? '' : wantKind;
        S.mpSpot = '';
        var kSpots = $('mpSpots');
        if (kSpots) kSpots.setAttribute('data-q', '\u0001');   // stale, so mRailSync draws it again
        refreshMacroPicker();
        return;
      }

      var msp = e.target.closest('[data-mpspot]');
      if (msp && S.macroPick) {
        var wantSpot = msp.dataset.mpspot;
        S.mpSpot = (!wantSpot || S.mpSpot === wantSpot) ? '' : wantSpot;
        // All lets go of a type too, and the row is drawn again to show every place
        if (!wantSpot && S.mpKind) {
          S.mpKind = '';
          var aSpots = $('mpSpots');
          if (aSpots) aSpots.setAttribute('data-q', '\u0001');
          refreshMacroPicker();
          return;
        }
        var spots = $('mpSpots');
        if (spots) {
          Array.prototype.forEach.call(spots.querySelectorAll('[data-mpspot]'), function (b2) {
            var on = b2.dataset.mpspot === S.mpSpot;
            b2.setAttribute('aria-pressed', String(on));
            b2.classList.toggle('on', on);
          });
        }
        refreshMacroPicker();
        return;
      }

      var mpm = e.target.closest('[data-mpmode]');
      if (mpm && S.macroPick) {
        // leaving scan means letting go of the camera, whichever way you leave
        if (S.mpMode === 'scan') mScanStop();
        S.mpMode = mpm.dataset.mpmode === S.mpMode ? 'home' : mpm.dataset.mpmode;
        mCamDone = false;               // a fresh visit to scan opens the lens again
        renderModal();
        return;
      }

      /* The picker stays alive underneath. It used to be torn down here, which
         threw away a basket somebody had spent four taps filling the moment
         they went to name a fifth thing — silently, with no way back. The
         form draws over it (renderModal checks newFood first) and hands what
         it makes to the basket rather than to the day. */
      /* Ask the food tables about the words in the box. The results land in
         #nfResults under the row, and taking one goes through the same
         [data-nfpick] path a scanned packet does — it carries the numbers
         over to the sheet that asks how much, rather than making a per-100 g
         figure the answer to a question nobody asked. */
      var mpl = e.target.closest('[data-mplook]');
      if (mpl && S.macroPick) {
        mLookNet(mpl.dataset.mplook);
        return;
      }

      var fpp = e.target.closest('[data-fppick]');
      if (fpp) {
        var fpr = BY_ID[idOf(fpp.dataset.fppick)];
        if (fpr && mCanFav(fpr)) {
          mToggleFav(fpr);
          /* A favourite the drafter may never use is a tap that did nothing,
             so choosing food the storehouse does not carry turns shopping on.
             The sheet says so above the shelves; it is not done in silence. */
          if (fpr.ext && mIsFav(fpr) && !mExtOk()) {
            var pr9 = mReadProfileRaw();
            pr9.extFill = true;
            mWriteProfile(pr9);
          }
          /* The gear sheet is cheap to redraw and has nothing to lose by it.
             The wizard is not, so it gets the surgical version. */
          if (S.favPick) renderModal();
          else mFavChipSync(fpp, fpr);
        }
        return;
      }
      var fpm = e.target.closest('[data-fpmore]');
      if (fpm) {
        S.fpOpen = S.fpOpen || {};
        S.fpOpen[fpm.dataset.fpmore] = !S.fpOpen[fpm.dataset.fpmore];
        renderModal();
        return;
      }

      var mpn = e.target.closest('[data-mpnew]');
      if (mpn && S.macroPick) {
        mScanStop();
        S.newFood = { slot: S.macroPick.slot, back: 1 };
        renderModal();
        return;
      }

      /* A result, taken. It fills the form rather than saving itself: the
         numbers are per 100 g or per packet serving, and only you know how
         much of it you actually ate. */
      var sc = e.target.closest('[data-scan]');
      if (sc && (S.newFood || S.macroPick)) {
        if (sc.dataset.scan === 'go') mScanStart();
        else mScanStop();
        return;
      }

      /* A row of the label is the thing to tap, not only its box: the boxes
         are as narrow as their figures now (camera.js, mNfRefresh), and the
         row is a thumb tall. */
      var nlr = e.target.closest('.nfl-row');
      if (nlr && S.newFood && !e.target.closest('input, label')) {
        var nli = nlr.querySelector('input');
        if (nli) { nli.focus(); return; }
      }
      // the form's size and amount, changed in place: the name being typed stays as it is
      var nfz = e.target.closest('[data-nfsize]');
      if (nfz && S.newFood) { mNfSize(Number(nfz.dataset.nfsize)); return; }
      var nfa = e.target.closest('[data-nfamt]');
      if (nfa && S.newFood) { mNfAmount(Number(nfa.dataset.nfamt)); return; }

      var nfp = e.target.closest('[data-nfpick]');
      if (nfp && (S.newFood || S.macroPick)) {
        var got = MLOOKUP[Number(nfp.dataset.nfpick)];
        /* Picked from inside the picker, where there is no form to fill: carry
           it over to the one screen that asks how much, rather than making the
           packet's numbers the answer to a question nobody asked. */
        if (got && S.macroPick && !$('nfName')) {
          mScanStop();
          S.newFood = { slot: S.macroPick.slot, pre: got, alg: got.alg || [], back: 1, size: 0, n: 1 };
          renderModal();
          return;
        }
        if (got) {
          mNfFill(got);
          if ($('nfResults')) $('nfResults').innerHTML = '';
          /* A serving said with its number, "2 Tbsp (32 g)", is not "one 2
             Tbsp (32 g)". */
          $('nfNote').textContent = 'Filled in from ' + (got.note || 'the USDA') +
            '. Change the amount if you had more or less than ' +
            (/^\d/.test(String(got.unit)) ? '' : 'one ') + got.unit + '.';
        }
        return;
      }

      /* A barcode typed into the search box is the same request the camera
         makes, so it goes to the same place rather than growing a second
         path beside it. */
      var nfc = e.target.closest('[data-nfcode]');
      if (nfc) {
        var code = nfc.dataset.nfcode;
        S.mpMode = 'scan';
        /* The number is already in hand, so this visit to scan is finished
           before it is drawn — drawing it must not ask for the camera. */
        mCamDone = true;
        renderModal();
        mScanGot(code, true);   // typed, not decoded
        return;
      }

      var nf = e.target.closest('[data-nf]');
      if (nf && (S.newFood || S.macroPick)) {
        if (nf.dataset.nf === 'cancel') {
          mScanStop();
          var wasBack = S.newFood && S.newFood.back && S.macroPick;
          S.newFood = null;
          // back to the meal's sheet, not out of it
          if (wasBack) { renderModal(); return; }
          close();
          return;
        }
        if (nf.dataset.nf === 'find' || nf.dataset.nf === 'code' || nf.dataset.nf === 'brand') {
          var term = String((($('nfFind') || {}).value) || '').trim();
          var byCode = nf.dataset.nf === 'code';
          var packaged = nf.dataset.nf === 'brand';
          if (!term) {
            $('nfResults').innerHTML = '<div class="mslot-empty">' +
              (byCode ? 'Type the number under the barcode.' : 'Type what it was.') + '</div>';
            return;
          }
          /* The number typed beside the lens is the scan's answer, the same
             as the row that offers a typed barcode: it goes the same way, and
             lets go of the camera, rather than asking with the light left on. */
          if (byCode && S.macroPick && S.mpMode === 'scan') { mScanGot(term, true); return; }
          $('nfResults').innerHTML = '<div class="mslot-empty">Looking&hellip;</div>';
          MLOOKUP = {};
          var asked = ++mLookSeq;       // a slower answer to the question before is dropped
          (byCode ? mBarcodeLookup(term.replace(/\D/g, '')) : mFoodSearch(term, packaged))
            .then(function (list) {
              if (asked !== mLookSeq || !$('nfResults')) return;
              $('nfResults').innerHTML = mLookupRows(list);
            }, function (err) {
              if (asked !== mLookSeq || !$('nfResults')) return;
              $('nfResults').innerHTML = '<div class="mslot-empty">' +
                esc(mLookSay(err, byCode ? term : '')) + '</div>';
            });
          return;
        }
        var nval = function (id) { return String((($(id) || {}).value) || '').trim(); };
        var nnum = function (id) { return Math.max(0, Math.round(Number(($(id) || {}).value) || 0)); };
        /* Protein, fat and carbs to a tenth (2026-10-11). Whole grams turned
           a drink's 0.15 g of fat per 100 mL into none, and its 0.92 g of
           carbs into one; the smaller the unit, the more of the food the
           rounding ate. */
        var ndec = function (id) { return Math.max(0, Math.round((Number(($(id) || {}).value) || 0) * 10) / 10); };
        var nm = nval('nfName');
        if (!nm) { $('nfNote').textContent = 'It needs a name to be findable again.'; return; }
        var kc = nnum('nfKcal'), pp = ndec('nfP'), ff = ndec('nfF'), cc = ndec('nfC');
        var nfAny = ['nfKcal', 'nfP', 'nfF', 'nfC'].some(function (id) { return nval(id) !== ''; });
        if (!kc && !pp && !ff && !cc && !nfAny) {
          $('nfNote').textContent = 'Give it at least the calories, or it counts for nothing.';
          return;
        }
        /* The calories follow from the macros whenever there are macros to
           follow from — not only when the calories box was left empty, which
           is all this used to do.

           Typing both is typing two answers to one question. A packet says
           190 and its own grams say 205, because a label uses factors
           particular to that food and this app uses four and nine; store the
           190 and the day's bars, its meal pills and the targets they are
           measured against are all speaking the other language, with one
           plate on the day quietly out of step. The stored figure has to be
           the one the day will count, or the record and the arithmetic
           disagree in the file.

           Calories alone still stand as typed. "I know it was 250 and I know
           nothing else" is honest and common — a plate at a friend's table —
           and deriving there would zero it, which is the one outcome worse
           than approximating it. Such a food carries calories with no macros
           to check them against; that is a gap in what is known, not two
           answers to the same question. */
        if (pp || ff || cc) kc = Math.round(4 * pp + 4 * cc + 9 * ff);
        var allF = mReadMyFoods(), ffresh = mNewFoodKey(nm, allF), fkey = ffresh.key;
        nm = ffresh.name;
        allF[fkey] = { name: nm, unit: nval('nfUnit') || 'serving', kcal: kc, p: pp, f: ff, c: cc };
        /* Sodium and fiber when the label gave them: whole milligrams, fiber
           to a tenth. An empty box is left out rather than kept as 0, which
           is what an own food without them has always counted as anyway —
           but a 0 written down would claim it was read off the packet. The
           allergens ride along from the lookup that filled the form. */
        if (nval('nfNa') !== '') allF[fkey].na = nnum('nfNa');
        if (nval('nfFib') !== '') allF[fkey].fib = Math.max(0, Math.round((Number($('nfFib').value) || 0) * 10) / 10);
        if (S.newFood.alg && S.newFood.alg.length) allF[fkey].alg = S.newFood.alg.slice(0, 8);
        /* The two grades too, a letter and a number, so the food's own page
           can say them again. Not the ingredients or the traffic lights:
           those are long, or per 100 g, and every saved food rides in the
           one household document that syncs. */
        var noff = (S.newFood.pre && S.newFood.pre.off) || {};
        if (noff.ns) allF[fkey].ns = noff.ns;
        if (noff.nova) allF[fkey].nova = noff.nova;
        // the barcode it came from, so a scan of the same packet opens this food (mOwnScan)
        var ncode = String((S.newFood.pre && S.newFood.pre.code) || '').replace(/\D/g, '');
        if (/^\d{6,14}$/.test(ncode)) allF[fkey].code = ncode;
        /* A food looked up with its sizes is saved as the size picked, and
           goes on the plate as the servings asked for; the rest of its label
           (saturated fat, cholesterol, sugars, calcium, iron, potassium)
           rides along per serving for its own page. */
        var nsized = mNfSized(S.newFood.pre), nx = nsized ? (S.newFood.n || 1) : 1;
        if (nsized) {
          var nat2 = mNfAt(S.newFood.pre, S.newFood.size || 0), nlab = {};
          ['sat', 'chol', 'sug', 'ca', 'fe', 'k'].forEach(function (k2) { if (typeof nat2[k2] === 'number') nlab[k2] = nat2[k2]; });
          if (Object.keys(nlab).length) allF[fkey].lab = nlab;
        }
        mWriteMyFoods(allF);
        mBuildFoods();
        /* Named from inside a meal's sheet, so it goes on that meal, the way
           a tap on any row does, and the sheet comes back with it ticked. */
        if (S.newFood.back && S.macroPick) {
          var nk = mViewKey(), nsk = S.macroPick.slot, nid = 'f:my:' + fkey, nat = -1, nfe = mAddsEaten(nk, nsk);
          /* At the servings you gave it, Kept, with the rest of the meal
             re-fitting around it. A tapped row goes on at what fits and
             balances with the others (#103); one you have just typed in
             comes with its amount said, and balancing it away undid that:
             1½ servings asked for went on as 1, a packet's one serving as a
             quarter (tests/scanlabel.test.js). Kept is what the − / + and a
             typed amount leave too. */
          mEditDay(nk, function (day) {
            var list = (day[nsk] = day[nsk] || []);
            list.push({ id: nid, x: nx, eaten: nfe, l: 1 });
            nat = list.length - 1;
          });
          S.mpAt[nid] = nat;
          S.mMarks = { k: nk, sk: nsk, was: mRefitMeal(nk, nsk, nat, false, nat), fresh: mpFresh(nat, nid), snap: null };
          S.mRowOpen = null;
          S.mpBasket[nid] = ((mDay(nk)[nsk] || [])[nat] || {}).x || nx;
          S.newFood = null;
          S.mpMode = 'home';
          renderMacros();
          renderModal();
          return;
        }
        var nslot = S.newFood.slot;
        var nate = mAddsEaten(mViewKey(), nslot);
        mEditDay(mViewKey(), function (day) {
          (day[nslot] = day[nslot] || []).push({ id: 'f:my:' + fkey, x: nx, eaten: nate });
        });
        S.newFood = null;
        close();
        renderMacros();
        return;
      }

      /* Onto the meal, in one tap (Blake, 2026-10-04: no basket, no "Add N").
         The row adds what fits the meal (mDefaultX), and all unlocked plates
         on the meal balance together (mRefitMeal); pressed again it takes the
         plate back off and re-balances what remains. With a plate marked for
         Swap, what you tap takes its place instead. */
      var mp = e.target.closest('[data-mpick]');
      if (mp && S.macroPick) {
        var pel = mp;
        var pid = idOf(pel.dataset.mpick), px = Number(pel.dataset.mpx) || 1;
        var pk = mViewKey(), psk = S.macroPick.slot, held = S.mpBasket[pid];
        var pat = mpPlateAt(pk, psk, pid);
        if (held !== undefined && pat >= 0) {
          mEditDay(pk, function (day) { (day[psk] || []).splice(pat, 1); });
          mpForget(psk, pat);
          delete S.mpBasket[pid];
          S.mMarks = { k: pk, sk: psk, was: mRefitMeal(pk, psk), fresh: {}, snap: null };
        } else {
          var pate = mAddsEaten(pk, psk), swap = S.mpSwap && S.mpSwap.slot === psk ? S.mpSwap : null, at2 = -1;
          mEditDay(pk, function (day) {
            var list = (day[psk] = day[psk] || []);
            var plate = { id: pid, x: px, eaten: pate };
            if (swap && list[swap.i] && String(list[swap.i].id) === String(swap.id)) {
              list.splice(swap.i, 1, plate);
              at2 = swap.i;
            } else { list.push(plate); at2 = list.length - 1; }
          });
          S.mpSwap = null;
          S.mpAt[pid] = at2;
          S.mMarks = { k: pk, sk: psk, was: mRefitMeal(pk, psk, undefined, false, at2), fresh: mpFresh(at2, pid), snap: null };
          S.mRowOpen = null;
          S.mpBasket[pid] = ((mDay(pk)[psk] || [])[at2] || {}).x || px;
        }
        if (S.mAmt && S.mAmt !== '*') S.mAmt = '';
        var pSel = '#mpList [data-mpick="' + String(pid).replace(/"/g, '') + '"]';
        var pBefore = (document.querySelector(pSel) || pel).getBoundingClientRect().top;
        renderMacros();
        renderModal();
        var pAfter = document.querySelector(pSel), pScr = document.querySelector('#modalRoot .scrim');
        if (pAfter && pScr) pScr.scrollTop += pAfter.getBoundingClientRect().top - pBefore;
        return;
      }

      var mpf = e.target.closest('[data-mpfav]');
      if (mpf && S.macroPick) {
        var fr = BY_ID[idOf(mpf.dataset.mpfav)];
        if (fr) { mToggleFav(fr); renderModal(); }
        return;
      }

      /* The sex and goal pickers flip in place rather than re-rendering the
         sheet — the sheet is a draft, and a redraw would cost the other boxes. */
      var mtd = e.target.closest('[data-mtdee]');
      if (mtd && S.macroTargOpen) {
        var prD = mReadProfile();
        prD.useTdee = mtd.dataset.mtdee === '1';
        mWriteProfile(prD);
        /* renderModal stood here and did nothing. The plan sheet is drawn
           once and left alone — so a sync arriving mid-keystroke cannot
           reset the draft boxes — and a second call while it is open returns
           without touching the DOM. The tap wrote useTdee to storage and the
           screen kept the old state: the pill still read "In use" after
           turning the measured burn off, while the plan underneath had
           already changed. This is the mechanism the sheet has for exactly
           that — repaint the answers from the profile, leave the questions
           and, here, the grams alone. */
        mtRefreshPlan(true);
        if (S.view === 'macros') renderMacros();
        return;
      }

      if (e.target.closest('[data-mgotrain]')) {
        close();
        try { if (window.Train && window.Train.openDays) window.Train.openDays(); } catch (e2) { /* Strengthen is not up */ }
        var tb = document.querySelector('.tab[data-view="train"]');
        if (tb) tb.click();
        return;
      }
      var tsy = e.target.closest('[data-mtsync]');
      if (tsy && S.macroTargOpen) {
        var prS = mReadProfile();
        prS.syncTrain = tsy.dataset.mtsync === '1';
        mWriteProfile(prS);
        Array.prototype.forEach.call(tsy.parentElement.querySelectorAll('[data-mtsync]'), function (b) {
          b.setAttribute('aria-pressed', String(b === tsy));
        });
        var cap = tsy.parentElement.nextElementSibling;
        if (cap) cap.textContent = prS.syncTrain ? 'Your plan and logged workouts set each day' : 'You set each day yourself';
        if (S.view === 'macros') renderMacros();
        return;
      }
      var trn = e.target.closest('[data-mtrain]');
      if (trn && S.macroTargOpen) {
        var ti = Number(trn.dataset.mtrain);
        var days = mTrainDays(), at = days.indexOf(ti);
        if (at >= 0) days.splice(at, 1); else days.push(ti);
        mSetTrainDays(days);
        trn.setAttribute('aria-pressed', at >= 0 ? 'false' : 'true');
        if ($('mtWorkouts')) $('mtWorkouts').value = days.length;
        if ($('mtTrainN')) $('mtTrainN').textContent = mTrainNSay(days.length);
        mtRefreshPlan();
        if (S.view === 'macros') renderMacros();
        return;
      }


      var mseg = e.target.closest('[data-mtsex], [data-mtgoal], [data-mtext], [data-mtact], [data-mtprot]');
      if (mseg && S.macroTargOpen) {
        /* Which segment this is, asked of the element instead of guessed from
           a pair. The ternary that used to sit here had to grow a branch for
           every segment added, and the failure when one is missed is silent:
           the press lands, the wrong row's buttons are queried, and nothing
           moves. */
        var segAttr = ['mtsex', 'mtgoal', 'mtext', 'mtact', 'mtprot'].filter(function (a) {
          return mseg.dataset[a] !== undefined;
        })[0];
        Array.prototype.forEach.call(mseg.parentElement.querySelectorAll('button[data-' +
          segAttr + ']'), function (b) {
          b.setAttribute('aria-pressed', String(b === mseg));
        });
        // the three activity words write the select the profile is read from
        if (segAttr === 'mtact' && $('mtAct')) $('mtAct').value = mseg.dataset.mtact;
        mtRefreshPlan();
        if (segAttr === 'mtprot') {
          var protRow = mseg.closest('.mt-prot');
          if (protRow) protRow.setAttribute('data-moved', '1');
          mtSyncSave();
        }
        return;
      }

      /* The meal rows are edited in place — add, remove, move up — because the
         sheet is a draft and a re-render would eat every half-typed box. */
      var msc = e.target.closest('[data-mtsec]');
      if (msc && S.macroTargOpen) {
        var scrow = msc.closest('.mtm-row');
        var list = scrow.querySelector('.mtm-secs');
        var summ = scrow.querySelector('.mtm-secsum');
        var openNow = msc.dataset.mtsec === 'show';
        list.classList.toggle('hide', !openNow);
        summ.classList.toggle('hide', openNow);
        if (!openNow) mtSecSumSync(scrow);
        return;
      }

      var mm = e.target.closest('[data-mtmeal]');
      if (mm && S.macroTargOpen) {
        var mact = mm.dataset.mtmeal;
        if (mact === 'add') {
          var holder = document.createElement('div');
          holder.innerHTML = mtMealRow({ k: 'k' + Date.now().toString(36) + (mtMealSeq++), n: '', t: 's' });
          $('mtMeals').appendChild(holder.firstChild);
          var nn = $('mtMeals').lastChild.querySelector('.mtm-name');
          if (nn) nn.focus();
        }
        var mrow = mm.closest('.mtm-row');
        if (mact === 'del' && mrow) mrow.parentNode.removeChild(mrow);
        if (mact === 'up' && mrow && mrow.previousElementSibling) {
          mrow.parentNode.insertBefore(mrow, mrow.previousElementSibling);
          mm.focus();
        }
        mtmShowTotal();
        return;
      }

      var med = e.target.closest('[data-mtedit]');
      if (med && S.macroTargOpen) {
        var shutNow = $('mtEditor').classList.toggle('hide');
        med.setAttribute('aria-expanded', String(!shutNow));
        mtSyncSave();
        return;
      }

      var mmf = e.target.closest('[data-mtmfold]');
      if (mmf && S.macroTargOpen) {
        var mShutNow = $('mtMealsWrap').classList.toggle('hide');
        mmf.setAttribute('aria-expanded', String(!mShutNow));
        /* Opening it is the moment the shares stop being a summary and start
           being boxes, so the total under them has to be right from the
           first look rather than from the first keystroke. */
        if (!mShutNow) mtmShowTotal();
        mtSyncSave();
        return;
      }

      var ms = e.target.closest('[data-mysync]');
      if (ms) {
        var act2 = ms.dataset.mysync;
        S.myErr = '';
        S.myNote = '';
        var failed = function (err) {
          S.myErr = (err && err.code === 'auth/popup-blocked')
            ? 'The sign-in window was blocked. Allow pop-ups for this site, or use the email link.'
            : 'That did not go through. Try again, or use the other way in.';
          renderModal();
        };
        if (act2 === 'retry') { mSyncStart(); renderModal(); return; }
        if (act2 === 'health-connect') { if (window.Health) window.Health.connect(); return; }
        if (act2 === 'health-sync') { if (window.Health) window.Health.sync(); return; }
        if (act2 === 'health-install') { if (window.Health) window.Health.openStore(); return; }
        if (act2 === 'google') {
          /* On the redirect path this page is about to be replaced, and the
             flag that decides whether the next load reaches for Firebase at
             all is written on the way BACK — which never runs. So claim it
             now, before leaving. If the sign-in does not happen, the next
             load asks who we are, finds nobody, and clears it again. */
          if (window.Store.wantsRedirect && window.Store.wantsRedirect()) {
            try { localStorage.setItem('bsc.myAccount', '1'); } catch (er2) { /* private */ }
          }
          window.Store.signInGoogle().then(function () {
            S.mySent = false; mAccountMark(); mSyncStart(); renderModal();
          }, failed);
        }
        if (act2 === 'email') {
          var addr = String((($('myJoin') || {}).value) || '').trim();
          if (!/.+@.+\..+/.test(addr)) {
            S.myErr = 'That does not look like an email address.';
            renderModal();
            return;
          }
          window.Store.sendEmailLink(addr).then(function () {
            S.myJoin = addr; S.mySent = true; renderModal();
          }, failed);
        }
        /* Asked properly, because it cannot be undone and the button sits a
           centimetre from Sign out, which can. */
        if (act2 === 'delete') {
          ask({
            title: 'Delete your account?',
            body: 'Your weigh-ins, your food log, your plan and any foods you added ' +
              'go from this device and from the account. This cannot be undone.',
            ok: 'Delete everything',
            danger: true
          }, function (yes) {
            if (!yes) return;
            mDeleteAccount().then(function () {
              S.myErr = '';
              S.myNote = 'Your account and everything in it are gone.';
              renderModal();
            }, function (err) {
              /* Firebase will not delete an identity that has not signed in
                 recently. Saying so is the only useful thing to do with it —
                 the alternative is a button that silently does nothing. */
              /* Three outcomes, and two of them used to read the same. The
                 data goes first and cannot go second — once the identity is
                 deleted there is no uid left to authorise it — so a refusal
                 at the identity step leaves everything already destroyed.
                 Saying "sign in again first, then delete" over that reads as
                 "nothing happened", which is the opposite of the truth. */
              S.myErr = (err && err.message === 'recent-login-wiped')
                ? 'Everything in your account has been deleted. The account itself needs a recent sign-in before Firebase will remove it \u2014 sign out, sign back in, and press delete once more.'
                : (err && err.message === 'recent-login')
                ? 'Sign out and sign in again first, then delete. Firebase asks for a recent sign-in before it will remove an account. Nothing has been deleted.'
                : 'Could not delete the account. Check your signal and try again.';
              renderModal();
            });
          });
          return;
        }
        if (act2 === 'push') {
          /* Restamp everything as of now so this device's copy is the newest
             on every part, then send it. Nothing is deleted anywhere else;
             it is simply outvoted. */
          mClaimAll();
          mSyncPush(true);
          S.myErr = '';
          S.myNote = 'Sent. Your other devices will take this the next time they look.';
        }
        if (act2 === 'pull') {
          /* Forget what is here and let the next snapshot fill it back in.
             The push that follows carries stamps of zero, so it cannot
             overwrite the account on the way past. Asked first: a day logged
             while the signal was down has never reached the account, and
             this is the button that throws it away. */
          ask({
            title: 'Take the account\u2019s copy?',
            body: 'Nourish and Strengthen on this device are replaced by what your account holds. ' +
              'Anything logged here that has not reached the account is lost.',
            ok: 'Use the account\u2019s copy'
          }, function (yes) {
            if (!yes) return;
            mForgetDay();
            renderMacros();
            mSyncStart();
            S.myNote = 'Cleared. Whatever your account holds is on its way down.';
            renderModal();
          });
          return;
        }
        if (act2 === 'out') {
          /* Signing out clears My Day from this device, so it is asked like
             anything else that removes what you typed. The account keeps what
             it has already received. */
          ask({
            title: 'Sign out of this device?',
            body: 'Nourish and Strengthen are cleared from this device. Your account keeps everything ' +
              'it has already received; anything not yet sent is lost.',
            ok: 'Sign out'
          }, function (yes) {
            if (!yes) return;
            /* The dinner numbers go with the account, as on delete: left in
               the household, with nobody signed in to own them, this phone
               showed them back as somebody else's plan ("Hits both"). */
            if (dinerOn() && window.Store.setMyDiner) {
              window.Store.setMyDiner(null);
              dinerPrefSave({ on: 0, u: mAccount().uid, n: dinerName() });
            }
            window.Store.signOutAccount().then(function () {
              S.mySent = false;
              mForgetDay();
              mAccountMark();
              mSyncStart();
              renderMacros();
              renderModal();
            }, failed);
          });
          return;
        }
        renderModal();
        return;
      }

      var use = e.target.closest('[data-mtuse]');
      if (use && S.macroTargOpen) {
        var np = mPlanCalc(mtProfileFromDom());
        if (np && $('mtP')) {
          $('mtP').value = np.p; $('mtF').value = np.f; $('mtC').value = np.c;
          mtRefreshAnswer();
          $('mtCoach').innerHTML = mCoachHTML(mtProfileFromDom());
        }
        return;
      }

      var free = e.target.closest('[data-mtfree]');
      if (free && S.macroTargOpen) {
        // the weight stays; only the deadline goes, so it can be typed back
        if ($('mtGoalBy')) $('mtGoalBy').value = '';
        Array.prototype.forEach.call(document.querySelectorAll('#mtGoalSeg [data-mtgoal]'),
          function (b2) { b2.disabled = false; });
        $('mtGoalSeg').classList.remove('spent');
        mtRefreshPlan();
        return;
      }

      /* Stepping the first run. The steps are all in the document and three
         of them are hidden, so this only ever changes which one is shown —
         nothing is built, nothing is thrown away, and every field stays
         readable by mtProfileFromDom the whole way through.

         Next on the last step is Save, because a wizard that ends on a step
         called "here is your plan" and then asks you to find a button is a
         wizard with one screen too many. */
      var mtw = e.target.closest('[data-mtw]');
      if (mtw) {
        var steps = document.querySelectorAll('[data-mtwstep]');
        if (!steps.length) return;
        var at = 1;
        Array.prototype.forEach.call(steps, function (sc) {
          if (!sc.hidden) at = Number(sc.dataset.mtwstep);
        });
        /* Done is the end of the wizard, so it is also its Save: the plan
           step's quiet line is the one Save button, and Done presses it. A
           wizard finished on the foods step used to close without writing
           the plan the four steps before it had built. */
        if (mtw.dataset.mtw === 'done') {
          var sv = document.querySelector('[data-mtarg="save"]');
          if (sv) sv.click(); else close();
          return;
        }
        mtwGo(at + (mtw.dataset.mtw === 'next' ? 1 : -1));
        return;
      }

      var mt = e.target.closest('[data-mtarg]');
      if (mt) {
        if (mt.dataset.mtarg === 'save') {
          // whole grams, never negative; 999 is not a limit anyone meets honestly
          var gv = function (id) {
            var el = $(id);
            var n = Math.round(Number(el && el.value) || 0);
            return Math.max(0, Math.min(999, n));
          };
          var saved = { p: gv('mtP'), f: gv('mtF'), c: gv('mtC') };
          /* Grams Nourish cannot plan a day on are refused here, whole: no
             profile, no targets, no meals written, and the line under the
             total says why (mtRefusal). Saving them used to mean the read
             that followed quietly served different ones. */
          var prSave = mtProfileFromDom(), planSave = mPlanCalc(prSave);
          var refused = mtRefusal(saved, prSave, !(planSave && Math.abs(planSave.p - saved.p) <= 1 &&
            Math.abs(planSave.f - saved.f) <= 1 && Math.abs(planSave.c - saved.c) <= 1));
          if (refused) {
            var rf = $('mtRefuse');
            if (rf) {
              rf.innerHTML = '<span class="mt-warn">' + esc(refused) + '</span>';
              // where it can be read: the wizard's fold, or the shut editor
              var rfFold = rf.closest('details');
              if (rfFold) rfFold.open = true;
              var rfEd = $('mtEditor');
              if (rfEd && rfEd.contains(rf) && rfEd.classList.contains('hide')) {
                rfEd.classList.remove('hide');
                var rfEdB = document.querySelector('[data-mtedit]');
                if (rfEdB) rfEdB.setAttribute('aria-expanded', 'true');
                mtSyncSave();
              }
              if (rf.scrollIntoView) rf.scrollIntoView({ block: 'nearest' });
            }
            return;
          }
          // the profile rides along, so next time the sheet already knows you
          mWriteProfile(prSave);
          /* Whether these are the plan's grams or somebody's own. Within a
             gram, because the boxes are whole numbers and so is the plan. */
          var planNow = mPlanCalc(mReadProfile());
          saved.auto = planNow && Math.abs(planNow.p - saved.p) <= 1 &&
            Math.abs(planNow.f - saved.f) <= 1 && Math.abs(planNow.c - saved.c) <= 1 ? 1 : 0;
          saved.set = todayKey();
          mWriteTargets(saved);
          /* And the meals, as the rows now stand. A nameless row was a
             mistake rather than a meal, and an empty list would be a day
             with nowhere to put food — both fall back rather than save. */
          var mlist = [];
          Array.prototype.forEach.call(document.querySelectorAll('#mtMeals .mtm-row'), function (row) {
            var mname = row.querySelector('.mtm-name').value.trim();
            if (!mname) return;
            var mrec = { k: row.dataset.mtmk, n: mname, t: row.querySelector('.mtm-type').value };
            var mw = Math.round(Number(row.querySelector('.mtm-share').value) || 0);
            if (mw >= 1 && mw <= 99) mrec.w = mw;   // else the kind's default speaks
            if (mrec.t === 'x') {
              var msecs = [];
              Array.prototype.forEach.call(row.querySelectorAll('.mtm-secs input:checked'), function (cb) {
                msecs.push(cb.value);
              });
              // a meal that can draw from nothing is a mistake — fall back to snacks
              if (msecs.length) mrec.secs = msecs;
              else mrec.t = 's';
            }
            mlist.push(mrec);
          });
          if (mlist.length) {
            // pins ride along under the same key — saving the sheet must not
            // cost anybody their morning routine
            var keepPins = mReadSlots();
            mlist.forEach(function (s) {
              keepPins.list.forEach(function (ps) {
                if (ps.k === s.k && ps.pins && ps.pins.length) s.pins = ps.pins;
              });
            });
            /* Whatever the boxes added to, the saved shares add to 100 — a
               proportional rescale, rounded, with the drift handed to the
               biggest meal, where a point is least felt. */
            var sumW = 0;
            mlist.forEach(function (s) { sumW += mSlotW(s); });
            if (sumW > 0) {
              var acc = 0, biggest = mlist[0];
              mlist.forEach(function (s) {
                s.w = Math.max(1, Math.round(100 * mSlotW(s) / sumW));
                acc += s.w;
                if (s.w > biggest.w) biggest = s;
              });
              biggest.w += 100 - acc;
            }
            var prevSlots = mReadSlots();
            var mnames = prevSlots.names || {};
            mlist.forEach(function (s) { mnames[s.k] = s.n; });
            mWriteSlots({ list: mlist, names: mnames });
          }
        }
        close();
        renderMacros();
        return;
      }

      var sy = e.target.closest('[data-sync]');
      if (sy) {
        var act = sy.dataset.sync;
        if (act === 'where' || act === 'pantry') { close(); goStep(act); return; }
        if (act === 'help' && window.Door) {
          var hp = window.Door.help();
          hp[sy.dataset.v] = !hp[sy.dataset.v];
          window.Door.setHelp(hp);
          renderModal();
          if (S.view === 'today' && window.Today) window.Today.render();
          return;
        }
        if (act === 'reroll') { S.pendingCode = window.Store.newCode(); }
        if (act === 'invite') {
          S.inviteMaking = true;
          S.inviteMsg = '';
          window.Store.invite().then(function (url) {
            S.inviteMaking = false; S.inviteUrl = url; S.inviteCopied = false;
            renderModal();
          }, function () {
            S.inviteMaking = false;
            S.inviteMsg = 'Could not make a link. Check your signal and try again.';
            renderModal();
          });
        }
        if (act === 'inviteshare' && S.inviteUrl && navigator.share) {
          navigator.share({ title: 'Hive & Hearth', text: 'Join my pantry on Hive & Hearth', url: S.inviteUrl })
            .catch(function () { /* dismissed */ });
        }
        if (act === 'invitecopy' && S.inviteUrl) {
          var done = function () { S.inviteCopied = true; renderModal(); };
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(S.inviteUrl).then(done, function () {
              var el = $('inviteUrl'); if (el) { el.select(); }
            });
          } else {
            var el2 = $('inviteUrl'); if (el2) { el2.select(); try { document.execCommand('copy'); done(); } catch (er) { /* selected, at least */ } }
          }
        }
        /* Async because the code is checked against the server before it is
           handed over. It resolves with the code actually claimed, which is
           the one on screen unless it turned out to be taken. */
        if (act === 'use') {
          mHouseTellNext = true;
          window.Store.createHousehold(S.pendingCode).then(function (code) {
            S.pendingCode = code;
            renderModal();
          });
        }
        if (act === 'join') {
          var v = ($('joinCode') || {}).value || '', from = window.Store.house;
          var to = v.trim().toUpperCase().replace(/\s+/g, '-');
          S.joinMsg = '';
          if (to && to !== from) {
            var go = function () {
              // the box is on the next screen too: empty there, not holding the code just used
              var jb = $('joinCode'); if (jb) jb.value = '';
              S.joinDraft = '';
              S.joinBack = from ? { code: from, mine: window.Store.houseIsMine } : null;
              mHouseTellNext = true; window.Store.join(v);
            };
            /* From inside a pantry other people share, asked first, as an
               invite and the account's own pantry are: it takes this phone
               out of theirs. One that is only this account's own is left
               without a word. */
            if (from && !mHouseAlone()) {
              ask({ title: 'Leave this pantry?',
                body: 'This device is sharing ' + from + '. Joining ' + to + ' takes it out of that one, and brings what is on this device along.',
                ok: 'Join ' + to }, function (yes) { if (yes) go(); renderModal(); });
            } else go();
          }
        }
        /* On needs a name to go under; off takes the numbers back out of the
           household, not just this phone's say-so. */
        if (act === 'diner' && mAccount()) {
          var dme = mAccount(), dnm = String(($('dinerName') || {}).value || '').trim().slice(0, 30);
          S.dinerMsg = '';
          if (dinerOn()) {
            dinerPrefSave({ on: 0, u: dme.uid, n: dnm || dinerName() });
            window.Store.setMyDiner(null);
          } else if (!dnm) {
            S.dinerMsg = 'Add a name to share them under.';
          } else {
            dinerPrefSave({ on: 1, u: dme.uid, n: dnm });
            dinerKeep();
          }
          S.dinerDraft = null;
        }
        if (act === 'restore' && window.Store.restoreRemoved) window.Store.restoreRemoved();
        if (act === 'forgetgone' && window.Store.forgetRemoved) window.Store.forgetRemoved();
        if (act === 'theme' && window.Theme) window.Theme.set(sy.dataset.v || '');
        if (act === 'install' && window.Install) window.Install.ask();
        /* Signed in, stopping here stops it for the account too; otherwise
           the next snapshot would put this device straight back in. */
        if (act === 'leave') {
          S.inviteUrl = ''; S.inviteMsg = ''; S.joinMsg = ''; S.joinBack = null;
          /* The switch was "share with the household", and that household
             is being left: off, so the numbers do not follow this account
             into the next pantry it joins, unasked. */
          if (dinerOn()) dinerPrefSave({ on: 0, u: mAccount().uid, n: dinerName() });
          window.Store.leave();
          mHouseTellNext = false;
          if (mAccount() && mSyncDoc) mHouseTell('');
        }
        renderModal();
        /* Said as well as shown: "On this device" is a status now. The sheet
           is drawn afresh, and a live region that arrives with its words is
           one nobody was listening to yet, so they go in a frame later. */
        var tsay = act === 'theme' && document.querySelector('.sync-theme-say');
        if (tsay) {
          var tw = tsay.textContent;
          tsay.textContent = '';
          requestAnimationFrame(function () { tsay.textContent = tw; });
        }
      }
    });

    /* The name, once it is typed: kept, and sent if the switch is on. An
       empty box keeps the name it had, since a share needs one.
     *
       Sent a moment later rather than now. The box loses focus to whatever
       is pressed next, and a write redraws the sheet — so sending at once
       redrew the switch, or the ×, out from under the finger pressing it,
       and the press went nowhere. */
    var dinerLater = 0;
    $('modalRoot').addEventListener('change', function (e) {
      if (e.target.id !== 'dinerName' || !mAccount()) return;
      var nm = String(e.target.value || '').trim().slice(0, 30), pr = dinerPref();
      S.dinerDraft = null;
      if (nm) {
        dinerPrefSave({ on: dinerOn() ? 1 : 0, u: mAccount().uid, n: nm });
        clearTimeout(dinerLater);
        dinerLater = setTimeout(dinerKeep, 300);
      } else if (pr.on !== 1) dinerPrefSave({ on: 0, u: mAccount().uid, n: '' });
    });

    // the nutrition preview follows the ingredients as they are typed
    $('modalRoot').addEventListener('input', function (e) {
      if (e.target.id === 'pwBud' && S.pwOpen) {
        S.pw.a.bud = Number(e.target.value) || 50;
        pwSave(S.pw.a);
        var bv = $('pwBudV'); if (bv) bv.textContent = '$' + S.pw.a.bud;
        return;
      }
      if (e.target.id === 'adFind' && S.addOpen) {
        S.add.q = e.target.value;
        var al = $('adList'); if (al) al.innerHTML = adListHTML();
        return;
      }
      if (e.target.id === 'pwIng' && S.pwOpen) {
        var sg = $('pwSug'); if (sg) sg.innerHTML = pwSugHTML(e.target.value);
        return;
      }
      if (S.foodOpen && e.target.id === 'mfsAmt') mFsRefresh();
      if (S.foodOpen && S.foodOpen.fix && /^mff/.test(e.target.id || '')) mFsFixRefresh();
      if (S.editId && (e.target.id === 'edIng' || e.target.id === 'edServings' ||
        e.target.id === 'edExtras' || /^ed(Kcal|P|C|F)$/.test(e.target.id))) refreshPreview();
      if (S.syncOpen && e.target.id === 'myJoin') S.myJoin = e.target.value;
      if (S.newFood && e.target.id === 'nfFind') { /* typed; the buttons ask */ }
      // the label panel's % Daily Values and what the day will count, as you type
      if (S.newFood && e.target.closest && e.target.closest('.nfl')) mNfRefresh();
      if (S.macroPick && e.target.id === 'mpFind') {
        S.mpQuery = e.target.value;
        /* A word sends the meal's foods, if they are up in the page, down
           to the tray's chips, and an emptied box brings them back: a class,
           not a redraw, which would take the box being typed in with it. */
        var mqs = e.target.closest('.msheet');
        if (mqs) mqs.classList.toggle('mpq', !!S.mpQuery.trim());
        refreshMacroPicker();
        mpLookSoon();
      }
      /* One box over two speeds. What is already on this device answers on
         the keystroke; the food tables are a request over a network, so they
         answer when they answer, underneath, and only once you have stopped
         typing long enough to mean it. */
      // the derived-kcal line follows the three targets as they are typed
      if (S.macroTargOpen && /^mt[PFC]$/.test(e.target.id)) mtRefreshAnswer();
      // and the plan preview follows the profile boxes
      if (S.macroTargOpen && /^mt(Age|Ft|In|Lb|GoalLb|GoalBy|Workouts|Steps)$/.test(e.target.id)) mtRefreshPlan();
      // and the share total follows the share boxes
      if (S.macroTargOpen && e.target.classList.contains('mtm-share')) mtmShowTotal();
      // and the folded summary follows the ticks, ready for when it folds
      if (S.macroTargOpen && e.target.closest('.mtm-secs')) mtSecSumSync(e.target.closest('.mtm-row'));
    });

    // a select fires change, not input, in enough browsers to matter
    /* A nought you have not answered yet is a placeholder, and tapping it
       should not leave you typing AROUND it.
     *
       The plan sheet's About-you boxes open at 0 on a first run, and a tap
       puts the caret wherever the thumb landed — usually left of the digit,
       because the digit sits right-aligned at the far end of the row. Typing
       180 into the weight box then produced "1800", which the sheet accepted
       (max=999 is the browser's business, not mtProfileFromDom's) and built a
       ten-thousand-calorie plan out of. The first number a new reader types
       into this app came back wrong by a factor of ten.
     *
       Only an exact "0", so a real figure you tapped into to correct keeps
       its caret where you put it. focusin because focus does not bubble. */
    $('modalRoot').addEventListener('focusin', function (e) {
      var el = e.target;
      if (!S.macroTargOpen || !el || el.tagName !== 'INPUT' || el.type !== 'number') return;
      if (el.value !== '0') return;
      try { el.select(); } catch (e2) { /* older webviews: leave the caret be */ }
    });

    $('modalRoot').addEventListener('change', function (e) {
      if (S.mCopyFrom && e.target.id === 'mcfDate') {
        var cv = e.target.value;
        S.mCopyFrom.day = /^\d{4}-\d{2}-\d{2}$/.test(cv) ? cv : '';
        renderModal();
        return;
      }
      if (S.foodOpen && e.target.id === 'mfsUnit') {
        // the same amount of food, said in the new unit
        var ur = BY_ID[S.foodOpen.id];
        if (ur) {
          var was = mFsState(ur), ni = Number(e.target.value) || 0;
          S.foodOpen.u = ni;
          S.foodOpen.amt = was.x ? mFsAmt(ur, was.x, was.units[ni]) : S.foodOpen.amt;
          renderModal();
        }
        return;
      }
      if (S.macroTargOpen && (e.target.id === 'mtAct' || e.target.id === 'mtGoalBy')) mtRefreshPlan();
      /* The picker's two lenses redraw only the list, like the search box —
         here on change and not also on input, where they were handled a
         second time: a select fires both, and every choice drew the list
         twice.
       *
         Held, because these two live INSIDE #mpList. They used to sit in
         .mp-controls, a sibling of the list, where replacing the list could
         not touch them. They moved onto the "Fits best / On the shelf"
         divider, which mpFitsHTML returns as part of the list — so redrawing
         the list destroys the very select that asked for the redraw, and
         focus falls to the body. A keyboard or screen-reader user had to tab
         from the top of the sheet back down for every single change.
         focusKey falls back to #id, so there is nothing to add to
         FOCUS_ATTRS; there was simply nothing holding on. */
      if (S.macroPick && e.target.id === 'mpSec') {
        S.mpSec = e.target.value; keepingFocus(refreshMacroPicker);
      }
      if (S.macroPick && e.target.id === 'mpSort') {
        S.mpSort = e.target.value; keepingFocus(refreshMacroPicker);
      }
      /* Choosing "Choose sections…" unfolds the checklist under that meal,
         seeded with whatever the previous kind drew from — a starting point
         to edit, not a blank sheet. Choosing a kind folds it away. */
      if (S.macroTargOpen && e.target.classList.contains('mtm-type')) {
        var trow = e.target.closest('.mtm-row');
        Array.prototype.forEach.call(trow.querySelectorAll('.mtm-secs, .mtm-secsum'),
          function (el) { el.parentNode.removeChild(el); });
        if (e.target.value === 'x') {
          var seed = MEAL_SECS[e.target.dataset.prev] || MEAL_SECS.s;
          var holder = document.createElement('div');
          // just chosen, so it opens ready to tick
          holder.innerHTML = mtSecsHTML(seed, true);
          while (holder.firstChild) trow.appendChild(holder.firstChild);
        }
        e.target.dataset.prev = e.target.value;
      }
    });

    $('newRecipe').addEventListener('click', function () { openEditor('new'); });

    document.addEventListener('keydown', function (e) {
      /* Tab stays inside whatever is up. A sheet, the editor and the dialog
         are all drawn over the collection rather than in place of it, so
         tabbing off the last control walked into the hundreds of cards behind
         — with no way back but Shift-Tab through all of them, and nothing on
         screen to say where the keyboard had gone. */
      if (e.key === 'Tab') {
        /* The top one, when more than one is up. A question is asked from
           #dialogRoot, over everything — a sheet included — and the trap used
           to look only in #modalRoot, so with "Clear the week?" on screen Tab
           walked straight out of the question and into the page behind it.
           Strengthen's sheets are drawn in #trainRoot, which sits after
           #modalRoot and so above it; they had no trap at all. */
        var scrim = document.querySelector('#dialogRoot .dlg') ||
          document.querySelector('#trainRoot .scrim') ||
          document.querySelector('#weighSheet.scrim') ||
          document.querySelector('#modalRoot .scrim, #modalRoot .dlg');
        if (scrim) {
          var f = Array.prototype.filter.call(
            scrim.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'),
            function (el) { return el.offsetParent !== null; });
          if (f.length) {
            var first = f[0], last = f[f.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
            else if (!scrim.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
          }
        }
      }
      if (e.key === 'Escape' && D) { closeDialog(null); return; }
      if (e.key === 'Escape' && S.editId) { editorAction('cancel'); return; }
      if (e.key === 'Escape' && S.filtPop) { filtersPop(false); return; }
      // Plan's sheets too: Plan my week, a day's dinner, Add to a day stayed up on Escape
      if (e.key === 'Escape' && (S.openId || S.syncOpen || S.macroPick || S.macroTargOpen || S.newFood ||
        S.keepMeal || S.chartOpen || S.foodOpen || S.mCopyFrom || S.pwOpen || S.daySheet || S.addOpen ||
        S.favPick || S.tdSheet || S.mDoneOpen || (WGAPI && WGAPI.isOpen && WGAPI.isOpen()))) close();
    });
  }

  /* ------------------------------------------------------------------------
   * The back gesture.
   *
   * There was no history here at all: the open recipe lived in a variable, so
   * swiping back did the only thing left to it and navigated out of the app.
   * Coming forward again landed on the grid with nothing open, and the recipe
   * you had been reading had to be found a second time.
   *
   * That got worse when recipes started pointing at each other. Following a
   * reference from the meatball feast to the breadcrumbs replaced the sheet —
   * deliberately, on the grounds that two recipes open at once is a back
   * button nobody asked for. Which was wrong twice over: somebody had asked
   * for it by swiping, and the gesture was already there.
   *
   * So each opened recipe is a history entry. Back walks the trail: from the
   * breadcrumbs to the feast to the grid. The × closes the lot in one, which
   * is what a close button means, so it jumps the whole depth rather than
   * unwinding it a page at a time.
   * --------------------------------------------------------------------- */
  var depth = 0;                 // history entries this modal has pushed
  var popping = false;           // inside a popstate, so do not push back
  /* This page's own entries, told from the ones a previous load left behind.
     The history outlives the page: a phone that drops the app in the
     background and reopens it, or a reload, comes back on the same entry
     with nothing open and depth at 0, and whatever entry it was standing on
     is still there. Blake looked at the meatloaf, the app was reloaded, and
     the next meal sheet he opened pushed on top of that old {r:351}; Done
     stepped back onto it, and the popstate below restored the meatloaf at
     1x over a sheet he had just closed. An entry from another life of the
     page is read as the bottom of the stack, which is what it is now. */
  var LIFE = String(Date.now()) + Math.random().toString(36).slice(2);

  /* Every sheet is an entry, not just a recipe.
   *
   * The first version of this pushed only when a recipe opened, which fixed
   * the case that was reported and left three that behave identically to a
   * reader: the Share sheet, the editor, and a confirm dialog all fill the
   * screen and all have an ×, and backing out of any of them navigated
   * straight out of the app. Same gesture, same-looking thing, three different
   * outcomes.
   *
   * The state carries the recipe id when there is one, so landing back on that
   * entry restores the recipe; anything else pops to a closed modal. Which
   * means the editor needs no special case: opened from a recipe it sits on
   * top of that entry and back lands on the recipe, opened from the header it
   * sits on the base entry and back closes. */
  function pushSheet(state) {
    if (popping) return;
    var st = state || {};
    st.life = LIFE;
    history.pushState(st, '');
    depth++;
  }

  function openRecipe(id, scale) {
    if (id === S.openId) return;
    S.openId = id;
    // the Macros day hands in the batch that makes its portion; every other
    // door means the recipe as written
    S.scale = scale || 1;
    S.why = false;
    pushSheet({ r: String(id) });
    renderModal();
    var x = document.querySelector('.sheet-x');
    if (x) x.focus();
  }

  window.addEventListener('popstate', function (e) {
    // an entry this load did not push is the base, whatever it carries
    var st = e.state && e.state.life === LIFE ? e.state : null;
    var id = st && st.r;
    popping = true;
    /* A dialog is not part of the modal, so closing the modal would leave the
       question sitting there over a page it no longer belongs to. */
    /* Back is Cancel, as Escape is: null, the one answer every question
       reads as no. false read as yes to the pantry reset, which tested only
       for null, so swiping back on "Back to the storehouse list?" emptied
       the shelf it was asking about. */
    if (D) closeDialog(null);
    if (id && BY_ID[id]) {
      depth = Math.max(0, depth - 1);
      S.openId = idOf(id);
      S.scale = 1;
      S.why = false;
      renderModal();
    } else if (st && st.m && S.macroPick && (mOverMeal() || S.mBackPending)) {
      /* Back from a recipe, a food, Save meal or Repeat a day opened from a
         meal's sheet lands on the meal's sheet, not on the day under it. */
      depth = Math.max(0, depth - 1);
      S.mBackPending = false;
      mOffMeal();
      renderModal();
      if (S.view === 'macros') renderMacros();
    } else if (st && ((st.pw && S.pwOpen) || (st.ad && S.addOpen) || (st.ds && S.daySheet) || (st.td && S.tdSheet))) {
      /* Back from a recipe opened over Plan my week's list, + Add or a day's
         sheet lands on that sheet, not on the page under all of them. */
      depth = Math.max(0, depth - 1);
      S.openId = null;
      renderModal();
    } else {
      depth = 0;
      close();
    }
    popping = false;
  });

  /* A sheet standing over a meal's sheet, and taking it down. */
  function mOverMeal() { return !!(S.openId || S.foodOpen || S.keepMeal || S.mCopyFrom || S.newFood); }
  function mOffMeal() {
    S.openId = null;
    S.foodOpen = null;
    S.keepMeal = '';
    S.mCopyFrom = null;
    if (S.newFood) mScanStop();
    S.newFood = null;
  }

  function close() {
    /* Over a meal's sheet, × and Done close the one sheet on top: the meal
       is what you came to work on. One step back, and popstate does it. */
    if (S.macroPick && (mOverMeal() || S.mBackPending) && depth > 1 && !popping) {
      history.back();
      return;
    }
    S.mBackPending = false;
    /* Unwind every entry this modal pushed, so one press of × does not leave
       a trail of recipes behind the back gesture. */
    if (depth > 0 && !popping) {
      var n = depth;
      depth = 0;
      history.go(-n);
      return;
    }
    S.openId = null;
    S.syncOpen = false;
    S.dinerDraft = null; S.dinerMsg = '';
    S.pwOpen = false;
    S.addOpen = false;
    S.daySheet = null;
    S.tdSheet = null;
    if (WGAPI.close) WGAPI.close();
    S.mDoneOpen = '';
    /* The editor too. Without these the × and the backdrop looked broken:
       renderModal saw S.editId still set, drew the editor again, and the only
       way out was the Cancel button. */
    S.editId = null;
    S.editBase = null;
    // and the Macros sheets, for exactly the same reason
    if (S.macroPick) mScanStop();        // never leave the camera running
    S.macroPick = null;
    S.mpSwap = null;
    S.chartOpen = false;
    S.keepMeal = '';
    S.foodOpen = null;
    S.mCopyFrom = null;
    S.macroTargOpen = false;
    /* And the food grid. It was added without this line and the sheet became
       a room with no door: × and the backdrop both call close(), close() left
       S.favPick standing, and renderModal drew the grid straight back. Blake,
       stuck in it: "when I click done or try to exit out of this screen it
       doesn't let me go anywhere." Exactly the failure the note above this
       block describes, made again four sheets later. */
    S.favPick = false;
    S.fpOpen = null;
    if (S.newFood) mScanStop();
    S.newFood = null;
    S.syncOpen = false;
    S.mDoneOpen = '';
    S.mpQuery = '';
    S.mpShelf = '';
    S.mpSpot = '';
    S.mpKind = '';
    // a basket left behind would silently refill the next meal you opened
    S.mpBasket = {};
    /* A Train sheet is an entry in the same history, so the same back
       gesture and the same × close it. */
    if (window.Train) window.Train.sheetClosed();
    renderModal();
    restoreOpener();
  }

  /* What src/train.js borrows from here. The history entry a sheet needs so
     that back closes it, the one confirm dialog the app has, and the "I
     trained today" tick on My Day, which a finished workout presses for
     you. Narrow on purpose: Train keeps its own data and draws its own
     screen; it only needs the things there must be one of. */
  /* When the view on screen was last on screen: written as the page is put
     away, which is what a refresh or leaving the app does, and on a change
     of tab. See S.view. */
  function viewSeen() {
    try { localStorage.setItem('sh.viewAt', String(Date.now())); } catch (e) { /* private mode */ }
  }
  /* And brought back after an hour away, the same: Today. Only a cold start
     did it, and a phone that never closes the app is resumed, not started —
     three hours on Nourish and it was still Nourish. sh.viewAt was written
     as the page was put away, so on the way back it is the time it left.
     Registered before the other resume handlers, so they draw Today.
     Not from under a sheet left open, the recipe being written above all:
     what was in the middle of being done is still there to finish. */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { viewSeen(); return; }
    var at = 0;
    try { at = Number(localStorage.getItem('sh.viewAt')) || 0; } catch (e) { /* private mode */ }
    if (S.editId || document.querySelector('.scrim')) return;
    if (at && Date.now() - at >= 3600e3 && S.view !== 'today') goView('today');
  });
  window.addEventListener('pagehide', viewSeen);
  function goView(v) {
    if (PLAN_STEPS.some(function (p) { return p[0] === v; }) && v !== 'plan') { goStep(v); viewSeen(); return; }
    S.view = v;
    try { localStorage.setItem('sh.view', v); } catch (e) { /* private mode */ }
    viewSeen();
    renderView();
    window.scrollTo(0, 0);
  }

  /* What Today shows of Plan, Nourish and the list: read here, where those
     live, and handed over as plain values. src/today.js draws them; its
     buttons come back through the doors below. */
  /* The day's meals for Today, in the order Nourish holds them: what is on
     each, its calories and protein, and whether all of it has been eaten.
     A skipped meal is left out; an empty one says so. */
  function todayMeals(tk) {
    var day = mDay(tk);
    return mReadSlots().list.filter(function (sl) { return !mSkipped(tk, sl.k); }).map(function (sl) {
      var its = (day[sl.k] || []).filter(function (it) { return BY_ID[it.id] && BY_ID[it.id].macro; });
      // counted the way Nourish counts its own day, one meal at a time
      var one = {}; one[sl.k] = its;
      var tot = mTotals(one).all, names = its.map(function (it) { return BY_ID[it.id].name; });
      return { k: sl.k, n: sl.n, kcal: tot.kcal, p: tot.p, empty: !its.length,
        eaten: !!its.length && its.every(function (it) { return it.eaten; }),
        name: names.length > 2 ? names.slice(0, 2).join(', ') + ' +' + (names.length - 2) : names.join(', ') };
    });
  }
  /* Your plate tonight: what Nourish has on your day for that dinner, when
     it has it (Fill sizes it to your numbers); otherwise the plate Plan my
     week works out for your plan. Nothing, with no plan to size it for. */
  function tonightPlate(id, tk) {
    var day = mDay(tk), hit = null;
    Object.keys(day).forEach(function (sk) {
      (day[sk] || []).forEach(function (it) { if (!hit && String(it.id) === String(id) && BY_ID[it.id] && BY_ID[it.id].macro) hit = it; });
    });
    if (hit) {
      var tot = mTotals({ d: [hit] }).all;
      return { x: hit.x, kcal: tot.kcal, p: tot.p };
    }
    var r = BY_ID[idOf(id)];
    if (!r || kcalOf(mReadTargets()) <= 0) return null;
    var pl = pwPlate(r, pwPlans()[0]);
    return pl ? { x: pl.x, kcal: pl.kc, p: pl.p } : null;
  }
  /* This morning's weight for Today's line: whether you have weighed, what
     the scale said, and the week it sits in. Nourish's own numbers. */
  function todayWeigh(tk) {
    var st = mWeightStats(), had = MWEIGHTS[tk];
    return { done: !!had, now: had ? mWShow(had) : null, unit: mWUnit(),
      avg: st && st.n >= 2 ? mWShow(st.avg7) : null, week: st && st.n >= 2 && st.dWeek !== null ? mLbWord(st.dWeek) : '',
      last: st && st.lastKey !== tk && st.latest ? mWShow(st.latest) : null, lastKey: st ? st.lastKey : '',
      // the rest of the morning, as the check-in under the box said it (src/checkin.js)
      am: mAmSum(tk), slept: mAmOf(tk).sl !== undefined };
  }
  function todayData() {
    var now = new Date(), tk = todayKey(), dk = CAL_DAYS[now.getDay()][0];
    /* Tonight is the day's dinner-section recipe or, failing one, whatever
       is planned: a recipe of your own, or a breakfast for dinner, was on
       the Plan grid and not on Today at all. */
    var curWk = window.Store.thisWeek();
    var dinnerOf = function (key) {
      var all = window.Store.dayOf(curWk, key).filter(function (e) { return BY_ID[e.id]; });
      return all.filter(function (e) { return pwIsDinner(BY_ID[e.id]); })[0] || all[0] || null;
    };
    var t = dinnerOf(dk), r = t && BY_ID[t.id];
    var next = CAL_DAYS.slice(now.getDay() + 1).map(function (d) {
      var e = dinnerOf(d[0]);
      return e ? { day: d[1], name: e.lo ? 'leftovers' : BY_ID[e.id].name } : null;
    }).filter(Boolean).slice(0, 2);
    var T = mReadTargets(), set = kcalOf(T) > 0, want = set ? mDayTargets(tk) : null, tot = mTotals(mDay(tk));
    var built = buildList(planEntries()), buy = [], items = 0, nSrc = 0;
    built.groups.forEach(function (g) {
      items += g.items.length;
      if (g.src === 'b') buy = g.items;
      if (g.src === 's') nSrc = g.items.length;
    });
    var left = buy.filter(function (b) { return !window.Store.isChecked(b.key); });
    var wl = canBuy() && left.length ? window.Walmart.lines(left) : null;
    return {
      date: now,
      help: window.Door ? window.Door.help() : { d: true, e: true, w: true },
      tonight: t ? { id: String(t.id), day: dk, name: r.name, time: r.time || '', x: t.x, lo: !!t.lo, twin: !!planTwin(t.id, dk),
        cooked: window.Store.cooked(dk), rating: window.Store.rating(t.id), plate: t.lo ? null : tonightPlate(t.id, tk) } : null,
      weigh: set ? todayWeigh(tk) : null,
      next: next,
      planned: CAL_DAYS.some(function (d) { return !!dinnerOf(d[0]); }),
      eating: set ? {
        set: true, key: tk, target: kcalOf(T), training: mIsTrainingDay(tk),
        kcal: { have: tot.eaten.kcal, want: kcalOf(want) }, p: { have: tot.eaten.p, want: want.p },
        water: { have: mWaterOz(tk), want: mWaterGoalOz(mReadProfile().lb), plain: mAmOf(tk).wt || 0, caf: mCafMg(tk) },
        room: tot.all.kcal < kcalOf(want) * 0.9, meals: todayMeals(tk)
      } : { set: false },
      shop: { items: items, buy: left.length, usd: listUsd(built), src: nSrc, srcName: srcW().the,
        wm: wl && wl.cart.length ? { href: window.Walmart.url(wl.cart), n: wl.cart.length } : null },
      wmMark: window.Walmart.mark,
      week: CAL_DAYS.map(function (d, i) {
        var dt = calDate(d[0]);
        return { key: d[0], dow: i, letter: d[2].charAt(0), date: dt ? dt.getDate() : '', tk: dt ? dayKey(dt) : '',
          dinner: !!dinnerOf(d[0]), past: calPastDay(d[0]), today: calIsToday(d[0]) };
      })
    };
  }

  // ------------------------------------------------------------ Today's sheets
  /* Today does; Nourish tunes. A meal, or tonight's dinner once cooked,
     tapped on Today opens a small sheet over it, and every row is Nourish's
     or Plan's own function, on today. */
  function tdSheetOpen(o) {
    S.tdSheet = o;
    pushSheet({ td: 1 });
    renderModal();
    var x = document.querySelector('#modalRoot .sheet-x');
    if (x) x.focus();
  }
  function tdItems(sk) { return (mDay(todayKey())[sk] || []).filter(function (it) { return BY_ID[it.id] && BY_ID[it.id].macro; }); }
  function tdRow(act, t, sub, cls) {
    return '<button class="dsh-row' + (cls ? ' ' + cls : '') + '" data-tdact="' + act + '"><span><b>' + t + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</span></button>';
  }
  function tdSheetHTML() {
    var T = S.tdSheet, body, kick;
    if (T.k === 'rate') {
      var r = BY_ID[T.id];
      if (!r) return '';
      var rt = window.Store.rating(T.id), ate = false, dd = mDay(T.tk);
      Object.keys(dd).forEach(function (sk) { (dd[sk] || []).forEach(function (it) { if (String(it.id) === String(T.id) && it.eaten) ate = true; }); });
      kick = 'Dinner cooked';
      body = '<h2 class="dsh-h">' + esc(r.name) + '</h2>' +
        (ate ? '<p class="dsh-m">Your dinner is ticked eaten in Nourish.</p>' : '') +
        '<div class="dsh-rl">How was it?</div><div class="td-rates" role="group" aria-label="How was it?">' +
        [[2, '\u2605', 'Favourite'], [1, '\ud83d\udc4d', 'Good'], [-1, '\ud83d\udc4e', 'Not again']].map(function (o) {
          return '<button class="td-rate" data-tdrate="' + o[0] + '" aria-pressed="' + (rt === o[0]) + '"><span aria-hidden="true">' + o[1] + '</span>' + o[2] + '</button>';
        }).join('') + '</div>' +
        '<p class="pw-note">Favourites come back more often in Plan my week; Not again never does.</p>' +
        (window.Store.house ? '<p class="td-shared">Your household sees \u201cDinner cooked\u201d on their Today too.</p>' : '') +
        '<div class="dsh-rows">' + tdRow('uncook', 'Not cooked after all', '') + '</div>' +
        '<button class="btn-primary td-done-btn" data-close="1">Done</button>';
    } else {
      var slot = mReadSlots().list.filter(function (sl) { return sl.k === T.sk; })[0] || { n: 'Meal' };
      var its = tdItems(T.sk), one = {}; one[T.sk] = its;
      var tot = mTotals(one).all, single = its.length === 1 ? its[0] : null;
      var allEaten = its.length && its.every(function (it) { return it.eaten; });
      kick = slot.n;
      body = its.length ? '<h2 class="dsh-h">' + esc(its.map(function (it) { return BY_ID[it.id].name; }).join(', ')) + '</h2>' +
        '<p class="dsh-m">' + Math.round(tot.kcal).toLocaleString('en-US') + ' cal \u00b7 ' + Math.round(tot.p) + ' g protein' +
          (single ? ' \u00b7 ' + fmtNum(single.x) + (single.x === 1 ? ' serving' : ' servings') : '') + '</p>' +
        '<div class="dsh-rows">' +
          (allEaten ? tdRow('uneat', 'Not eaten after all', 'Unticks it in Nourish too') : tdRow('eat', 'I ate it', 'Ticks it in Nourish too', 'dsh-main')) +
          (single && !single.eaten ? '<div class="dsh-row td-steprow"><span><b>A bit more or less</b><small>Your numbers follow</small></span>' +
            '<span class="td-step"><button data-tdstep="-1" aria-label="Less">\u2212</button><b>' + fmtNum(single.x) + '</b><button data-tdstep="1" aria-label="More">+</button></span></div>' : '') +
          (allEaten ? '' : tdRow('swap', 'Swap for another that fits', 'Near the same calories and protein')) +
          tdRow('else', 'I ate something else', 'Search the food list, or build it') +
          tdRow('eatout', 'Eating out', 'Fast food, sit-down & grab-and-go spots') +
          (single ? tdRow('recipe', 'Open the recipe', '') : '') +
          tdRow('nourish', 'Open the day in Nourish', 'Portions, shares, Fill, your plan') +
        '</div>'
        : '<h2 class="dsh-h">Nothing planned for ' + esc(slot.n.toLowerCase()) + '</h2><div class="dsh-rows">' +
          tdRow('else', 'Add food', 'Search the food list, or build it', 'dsh-main') +
          tdRow('eatout', 'Eating out', 'Fast food, sit-down & grab-and-go spots') +
          tdRow('nourish', 'Open the day in Nourish', 'Fill it there, to your numbers') + '</div>';
    }
    return '<div class="scrim no-print" data-close="1">' +
      '<div class="sheet ds-sheet dsh-sheet td-sheet" role="dialog" aria-modal="true" aria-label="' + esc(kick) + '">' +
        '<div class="sheet-top"><div class="sheet-eyebrow">' + esc(kick) + '</div>' +
          '<button class="sheet-x" data-close="1" aria-label="Close">&times;</button></div>' +
        '<div class="dsh-body">' + body + '</div></div></div>';
  }
  document.addEventListener('click', function (e) {
    if (!S.tdSheet || S.openId || !e.target.closest) return;
    var T = S.tdSheet, rt = e.target.closest('[data-tdrate]');
    if (rt) {
      var v = Number(rt.dataset.tdrate);
      window.Store.setRating(T.id, window.Store.rating(T.id) === v ? 0 : v);
      renderModal();
      return;
    }
    var stp = e.target.closest('[data-tdstep]');
    if (stp) {
      mEditDay(todayKey(), function (day) {
        var it = (day[T.sk] || []).filter(function (x) { return BY_ID[x.id] && BY_ID[x.id].macro; })[0];
        if (it && !it.eaten) it.x = mStepX(BY_ID[it.id], it.x, Number(stp.dataset.tdstep));
      });
      renderModal();
      return;
    }
    var b = e.target.closest('[data-tdact]');
    if (!b) return;
    var act = b.dataset.tdact;
    if (act === 'uncook') { window.Store.setCooked(T.day, false); close(); return; }
    if (act === 'eat' || act === 'uneat') {
      mEditDay(todayKey(), function (day) { (day[T.sk] || []).forEach(function (it) { it.eaten = act === 'eat' ? 1 : 0; }); });
      close();
      return;
    }
    if (act === 'swap') { S.macroDate = null; mTryAgain(T.sk); renderModal(); return; }
    if (act === 'else') { S.macroDate = null; var sk = T.sk; S.tdSheet = null; mOpenPicker(sk, 'home'); return; }
    if (act === 'eatout') { S.macroDate = null; var esk = T.sk; S.tdSheet = null; mOpenPicker(esk, 'home'); S.mpShelf = 'eatout'; renderModal(); return; }
    if (act === 'recipe') { var one = tdItems(T.sk)[0]; if (one) { rememberOpener(); openRecipe(idOf(one.id)); } return; }
    if (act === 'nourish') { close(); S.macroDate = null; goView('macros'); }
  });

  window.Hive = {
    /* Today's reading of the app, and its doors back into it. */
    today: todayData,
    /* Today is about today: a door from it into Nourish opens on today,
       not on the day Nourish was left parked on — Add food from Today
       was adding to Sep 30 while the card went on saying nothing planned. */
    go: function (v) { if (v === 'macros') S.macroDate = null; goView(v); },
    open: function (id) { rememberOpener(); openRecipe(idOf(id)); },
    swap: function (id, day) { planSwap(idOf(id), day); },
    planWeek: function () { goView('plan'); pwOpen(); },
    addTonight: function () { goView('plan'); rememberOpener(); addOpen(CAL_DAYS[new Date().getDay()][0]); },
    addFood: function () { S.macroDate = null; goView('macros'); mOpenPicker(null, 'home'); },
    eatOut: function (sk) { S.macroDate = null; goView('macros'); mOpenPicker(sk || null, 'home'); S.mpShelf = 'eatout'; renderModal(); },
    /* Nourish on today (not whichever day it was last left on), and its own
       answer to whether today can be filled, then its own Fill. */
    fill: function () {
      S.macroDate = null;
      goView('macros');
      var b = $('macroFill');
      if (b && b.dataset.mode === 'fill' && !b.disabled) mFillDay();
    },
    numbers: function () { S.macroDate = null; goView('macros'); mOpenTargets(); },
    /* The front door's answers (src/door.js), each to what owns it: the
       household's staples switches, as Where sets them, and Plan my week's
       "how many are eating"; Nourish's goal; Nourish's numbers sheet. */
    kitchen: function (ppl, kind) {
      setSrcKind(kind, function () { window.Store.setOpt('setup', true); });
      var a = pwAnswers();
      a.ppl = ppl;
      pwSave(a);
    },
    goal: function (g) {
      if (!MGOAL_WORDS[g]) return;
      var pr = mReadProfileRaw();
      pr.goal = g;
      mWriteProfile(pr);
    },
    numbersSetup: function () { S.macroDate = null; goView('macros'); mOpenTargets(); },
    /* Tonight's dinner, cooked: said for the household (Store.setCooked),
       your own plate of it ticked eaten in Nourish, and asked how it was. */
    cooked: function (id, day, tk) {
      var k = /^\d{4}-\d{2}-\d{2}$/.test(tk || '') ? tk : todayKey();
      /* The whole meal the dinner is on, not just its plate: a meal is
         completed as one (Blake, 2026-10-04: "I'll complete the whole
         meal"), so sides on that dinner are eaten with it. */
      mEditDay(k, function (d) {
        Object.keys(d).forEach(function (sk) {
          var list = d[sk] || [];
          if (list.some(function (it) { return String(it.id) === String(id); })) list.forEach(function (it) { it.eaten = 1; });
        });
      });
      window.Store.setCooked(day, true);
      tdSheetOpen({ k: 'rate', id: idOf(id), day: day, tk: k });
    },
    rate: function (id, day) { tdSheetOpen({ k: 'rate', id: idOf(id), day: day, tk: todayKey() }); },
    meal: function (sk) { S.macroDate = null; tdSheetOpen({ k: 'meal', sk: sk }); },
    // the weigh-in sheet on Today (Hive.weigh is the write, used by Strengthen)
    weighOpen: function () { if (WGAPI.open) WGAPI.open(); },
    /* A meal ticked on Today: everything on it eaten, as its boxes on the
       Nourish day would be. `tk` is the day the card was drawn for: past
       midnight on a card nobody had redrawn, the tick went to a day with no
       dinner on it and did nothing. */
    eat: function (sk, tk) {
      mEditDay(/^\d{4}-\d{2}-\d{2}$/.test(tk || '') ? tk : todayKey(), function (day) { (day[sk] || []).forEach(function (it) { it.eaten = 1; }); });
      if (S.view === 'today' && window.Today) window.Today.render();
    },
    addWater: function (oz, tk) {
      var k = /^\d{4}-\d{2}-\d{2}$/.test(tk || '') ? tk : todayKey();
      var cur = mAmOf(k).wt || 0;
      var nx = Math.max(0, Math.min(500, cur + (Number(oz) || 0)));
      mAmWrite(k, 'wt', nx > 0 ? Math.round(nx) : undefined);
      if (S.view === 'today' && window.Today) window.Today.render();
      if (S.view === 'macros') renderMacros();
    },
    ask: ask,
    openSheet: function () { pushSheet({ tr: 1 }); },
    closeSheet: function () { close(); },
    /* Where the account stands, for Strengthen's own line about it. With no
       document to write to it could only say "Only on this phone. Sign in
       under Nourish", which a signed-in phone with no signal is not:
         'on'          attached to the account
         'connecting'  an account is remembered and its answer is pending
         'offline'     an account is remembered and the server is out of reach
         'signedout'   nobody is signed in on this device */
    syncState: function () {
      if (mAccount() && mSyncDoc) return S_SYNC_STATE === 'error' ? 'offline' : 'on';
      if (mSyncAway()) return 'offline';
      if (mSuspectAccount() && (!mAuthKnown || mAccount())) return 'connecting';
      return 'signedout';
    },
    /* A workout saved. Nothing is copied: whether a day was trained is read
       from Strengthen's own log when Nourish asks (mIsTrainingDay), so a
       workout deleted or moved to another day takes its training day with
       it. What is written is the day's target, whichever tab is showing. */
    trained: function (k, wo) {
      mCreditDay(k);
      mHealthPushWorkout(k, wo);
      if (S.view === 'macros') renderMacros();
    },
    /* Nourish's own days, for Strengthen to start its picker from. */
    trainDays: function () { return mTrainDaysOwn(); },
    /* How far under maintenance you are eating, for Strengthen's weekly
       climb: calories a day, and what that comes to a week as a share of
       what you weigh (positive is losing).
     *
       What you actually ate these two weeks, once seven of them are logged
       and your burn has been measured from the same logs: a snack never
       written down then counts on both sides and cancels. Until then, the
       target you are eating to, against the burn Nourish plans by. Null
       with neither. */
    phase: function () {
      var pr = mReadProfile();
      var tdee = mTdee(pr);
      if (!(pr.lb > 0) || tdee === null) return null;
      var meas = mMeasuredTdee();
      var from = new Date(); from.setDate(from.getDate() - 14);
      var fromK = dayKey(from), today = todayKey();
      var ks = Object.keys(MINTAKE).filter(function (k) { return k >= fromK && k < today && MINTAKE[k] > 0; });
      var ate = meas && ks.length >= 7 ? ks.reduce(function (s0, k) { return s0 + MINTAKE[k]; }, 0) / ks.length : null;
      var target = kcalOf(mReadTargets());
      if (ate === null && !target) return null;
      var under = Math.round(ate !== null ? meas.tdee - ate : tdee - target);
      return { kcal: under, rate: Math.round(under * 7 / 3500 / pr.lb * 10000) / 10000,
        src: ate !== null ? 'ate' : 'plan', days: ks.length };
    },
    /* The last seven days as Nourish saw them, for the weekly check-in both
       tabs open: the seven before today, since today is not over.
     *
       Weight is the week's average against the week before's, a morning on
       its own being mostly water. Calories are what was eaten on the days
       logged, the same count the measured burn is built on, against each
       day's own target. Protein is hit at nine-tenths of the day's target.
       Maintenance is the burn measured from your logs when there is one,
       the estimate otherwise, and says which. Null with nothing at all. */
    week: function () {
      var keyAgo = function (n) { var d = new Date(); d.setDate(d.getDate() - n); return dayKey(d); };
      var wk = [], pw = [], i;
      for (i = 7; i >= 1; i--) wk.push(keyAgo(i));
      for (i = 14; i >= 8; i--) pw.push(keyAgo(i));
      var avgOf = function (ks) {
        var v = ks.map(function (k) { return MWEIGHTS[k]; }).filter(function (x) { return x > 0; });
        return { n: v.length, avg: v.length ? Math.round(v.reduce(function (s0, x) { return s0 + x; }, 0) / v.length * 10) / 10 : null };
      };
      var now = avgOf(wk), was = avgOf(pw);
      var f = { days: 0, kcal: 0, tk: 0, tn: 0, p: 0, tp: 0, hit: 0, pDays: 0, pd: [] };
      mLogIntake();
      wk.forEach(function (k) {
        var kc = MINTAKE[k];
        if (!(kc > 0)) return;
        var t = mDayTargets(k), tk = kcalOf(t);
        f.days++; f.kcal += kc;
        if (tk > 0) { f.tk += tk; f.tn++; }
        var day = MDAYS[k];
        if (day && t.p > 0) {
          var tot = mTotals(day), got = (mDoneAt(k) ? tot.all : tot.eaten).p;
          f.pDays++; f.p += got; f.tp += t.p;
          if (got >= 0.9 * t.p) f.hit++;
          f.pd.push(got >= 0.9 * t.p ? 1 : 0);
        }
      });
      if (!now.n && !was.n && !f.days) return null;
      var pr = mReadProfile(), meas = mMeasuredTdee(), tdee = mTdee(pr), base = kcalOf(mReadTargets());
      return {
        from: wk[0], to: wk[6], lb: pr.lb > 0 ? pr.lb : null,
        w: { now: now.avg, n: now.n, was: was.avg, m: was.n },
        days: f.days, kcal: f.days ? Math.round(f.kcal / f.days) : null,
        target: f.tn ? Math.round(f.tk / f.tn) : base || null,
        curTarget: base || null,
        p: f.pDays ? Math.round(f.p / f.pDays) : null, tp: f.pDays ? Math.round(f.tp / f.pDays) : null,
        // a day each, oldest first: 1 where protein reached nine-tenths of target
        hit: f.hit, pDays: f.pDays, pd: f.pd,
        maint: meas ? meas.tdee : tdee !== null ? Math.round(tdee) : null, measured: !!meas,
        // the pace the plan is built for, as a share of your weight a week; positive is losing
        plan: tdee !== null && base && pr.lb > 0 ? Math.round((tdee - base) * 7 / 3500 / pr.lb * 10000) / 10000 : null,
        cutWeeks: pr.goalSet && (pr.goal === 'cut1' || pr.goal === 'cut2' || (pr.goalLb > 0 && pr.lb > pr.goalLb))
          ? Math.max(0, Math.floor((mDayN(todayKey()) - mDayN(pr.goalSet)) / 7)) : 0
      };
    },
    /* Every day from `from` to `to` as Nourish saw it, for Review's longer
       spans (This block, All time): the morning's weight, what was eaten
       against the day's own target, and what the morning check-in said
       (src/checkin.js). Steps are said the morning AFTER the day they were
       walked, so they are moved back onto that day here, once, rather than
       in every chart that reads them. A day with nothing to say is left out:
       a gap, not a zero. */
    progress: function (from, to) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(from || '') || !/^\d{4}-\d{2}-\d{2}$/.test(to || '') || from > to) return null;
      mLogIntake();
      var am = mAmDays(), tk = todayKey(), out = [], guard = 0;
      for (var d = keyDate(from); dayKey(d) <= to && guard < 3700; d.setDate(d.getDate() + 1), guard++) {
        var k = dayKey(d), nx = new Date(d); nx.setDate(nx.getDate() + 1);
        var row = { k: k }, any = false, t = mDayTargets(k), day = MDAYS[k];
        if (MWEIGHTS[k] > 0) { row.w = MWEIGHTS[k]; any = true; }
        if (day) {
          var tot = mTotals(day), done = mDoneAt(k);
          var got = done ? tot.all : (tot.eaten.kcal > 400 ? tot.eaten : (k < tk && tot.all.kcal > 400 ? tot.all : null));
          var kc = MINTAKE[k] > 0 ? MINTAKE[k] : (got && got.kcal > 400 ? Math.round(got.kcal) : 0);
          if (kc > 0 && got) {
            row.kc = kc; row.p = Math.round(got.p); row.c = Math.round(got.c);
            row.tp = t.p || 0; row.tc = t.c || 0; row.tk = kcalOf(t) || 0;
            any = true;
          }
        } else if (MINTAKE[k] > 0) {
          row.kc = MINTAKE[k]; row.tp = t.p || 0; row.tc = t.c || 0; row.tk = kcalOf(t) || 0;
          any = true;
        }
        var a = am[k] || {}, an = am[dayKey(nx)] || {};
        if (a.sl !== undefined) { row.sl = a.sl; any = true; }
        if (a.cr !== undefined) { row.cr = a.cr; any = true; }
        if (a.wt !== undefined) { row.wt = a.wt; any = true; }
        if (a.mg !== undefined) { row.mg = a.mg; any = true; }
        if (an.sy !== undefined) { row.sy = an.sy; any = true; }
        if (any) out.push(row);
      }
      var pr = mReadProfile(), nw = window.Hive.week();
      return { days: out, goalLb: pr.goalLb > 0 ? pr.goalLb : null, lb: pr.lb > 0 ? pr.lb : null,
        waterGoalOz: mWaterGoalOz(pr.lb), plan: nw && nw.plan !== null ? nw.plan : null };
    },
    // the earliest day Nourish has anything for: All time starts there
    firstDay: function () {
      mLogIntake();
      var ks = Object.keys(MWEIGHTS).filter(function (k) { return MWEIGHTS[k] > 0; }).concat(
        Object.keys(MINTAKE).filter(function (k) { return MINTAKE[k] > 0; }),
        Object.keys(MDAYS).filter(function (k) { var t = mTotals(MDAYS[k]); return (t.all && t.all.kcal > 0) || (t.eaten && t.eaten.kcal > 0); }),
        Object.keys(MAM)
      ).filter(function (k) { return /^\d{4}-\d{2}-\d{2}$/.test(k); }).sort();
      return ks[0] || null;
    },
    daysMoved: function () {
      /* Strengthen's list as Strengthen now has it. This read mTrainDays(),
         which falls back to the profile's copy when Strengthen's list is
         empty — so days cleared there were read back from the profile and
         written straight into it again. None picked is an answer. */
      var ld = null;
      try { ld = window.Train && window.Train.liftDays ? window.Train.liftDays() : null; } catch (e) { /* Strengthen is not up */ }
      var pr = mReadProfile();
      var days = (ld || []).filter(function (n) { return n >= 0 && n <= 6; });
      if (Number(pr.workouts) !== days.length || JSON.stringify(pr.train) !== JSON.stringify(days)) {
        pr.workouts = days.length; pr.train = days; mWriteProfile(pr);
      }
      mDaysChanged();
      if (S.view === 'macros') renderMacros();
    },
    /* A weigh-in from Strengthen, which asks for one on a pull-up day with
       nothing better to go on. The box on Nourish's guard: a weight far from
       your own average, or from any adult's, comes back to be confirmed
       rather than written. It never writes over a day already weighed,
       except to correct the number Strengthen itself put there (o.was). */
    weigh: function (k, lb, o) {
      o = o || {};
      var n = Math.round(Number(lb) * 10) / 10;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(k)) || !isFinite(n) || n <= 0 || n > 1500) return { ok: false, bad: true };
      if (MWEIGHTS[k] && MWEIGHTS[k] !== o.was) return { ok: false, had: MWEIGHTS[k] };
      var st = mWeightStats(), ref = st && st.n >= 3 ? st.avg7 : 0;
      if (!o.force && (n < 60 || n > 700 || (ref > 0 && Math.abs(n - ref) > ref * 0.15))) {
        return { ok: false, odd: true, ref: Math.round(ref * 10) / 10 };
      }
      mWriteWeight(k, n);
      if (S.view === 'macros') renderMacros();
      return { ok: true, lb: n };
    },
    setKcal: function (want) {
      var n = Math.round(Number(want));
      var t = mReadTargets(), now = kcalOf(t);
      if (!(n > 0) || !now) return false;
      var pr = mReadProfile(), sp = mSplitKcal(n, t, pr);
      mWriteTargets({ p: sp.p, f: sp.f, c: sp.c, auto: 0, set: todayKey() });
      if (S.view === 'macros') renderMacros();
      return true;
    }
  };

  // ------------------------------------------------------------------- boot
  renderSections();
  /* Before the first paint: a stored plan written by an older build can be
     below this body's floor or have no carbohydrate in it, and the correction
     belongs here rather than inside whichever read happened to run first. */
  /* An i or a "why?" opens its words in place and closes them again, with
     no redraw, so nothing moves but the words. */
  document.addEventListener('click', function (e) {
    var ib = e.target.closest && e.target.closest('[data-minfo]');
    if (!ib) return;
    var key = ib.dataset.minfo, open = !MINFO[key];
    MINFO[key] = open;
    document.querySelectorAll('[data-minfo="' + key + '"]').forEach(function (b) {
      b.setAttribute('aria-expanded', String(open));
    });
    var tx = document.getElementById('mi-' + key);
    if (tx) tx.hidden = !open;
  });
  document.addEventListener('click', function (e) {
    var mvu = e.target.closest && e.target.closest('[data-mmoveundo]');
    if (mvu && S.mLastMove) {
      var lm = S.mLastMove;
      S.mLastMove = null;
      S.mMarks = { k: '', sk: '', was: {}, fresh: {}, snap: null };
      mEditDay(lm.k, function (day) {
        day[lm.fromSk] = lm.fromSnap || [];
        day[lm.toSk] = lm.toSnap || [];
      });
      var tt1 = $('mToast');
      if (tt1) tt1.hidden = true;
      if (S.macroPick) renderModal();
      if (S.view === 'macros') renderMacros();
      return;
    }
    var exu = e.target.closest && e.target.closest('[data-mexplodeundo]');
    if (exu && S.mLastExplode) {
      var le = S.mLastExplode;
      S.mLastExplode = null;
      S.mMarks = { k: '', sk: '', was: {}, fresh: {}, snap: null };
      mEditDay(le.k, function (day) {
        day[le.sk] = le.snap || [];
      });
      var tt2 = $('mToast');
      if (tt2) tt2.hidden = true;
      if (S.macroPick) renderModal();
      if (S.view === 'macros') renderMacros();
      return;
    }
    var al = e.target.closest('[data-mallow]');
    if (!al) return;
    var aid = al.dataset.mallow;
    mSetNever(BY_ID[aid] ? aid : (isNaN(Number(aid)) ? aid : Number(aid)), false);
    var tt = $('mToast');
    if (tt && tt.contains(al)) tt.hidden = true;
    if (S.favPick) renderModal();
    if (S.view === 'macros') renderMacros();
  });
  mBootTargetsDue = true;
  if (!mSuspectAccount()) mBootTargets();
  // before anything can have something to say: see mToastEls
  mToastEls();
  wire();
  window.Store.init(function () { renderAll(); mHouseWatch(); mJoinBack(); mHouseNotices(); dinerWatch(); });
  renderAll();
  if (window.Health && window.Health.available() && window.Health.state() === 'granted') {
    window.Health.sync();
  }
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && window.Health && window.Health.available() && window.Health.state() === 'granted') {
      window.Health.sync();
    }
  });
})();
