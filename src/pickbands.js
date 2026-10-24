/* The picker's bands: the query every band asks (mpQ), the shelf rail and
 * the lens with its sorts (mpShelvesHTML), what a typed word matches and
 * where it ranks (mpMatches), what you already reach for (mpKnownIds), and
 * the bands themselves: the thing you named, what you starred, your pins,
 * everything else the query finds, what closes the day from this meal's own
 * pool, and what you ate lately (mpNamedHTML, mpFavsHTML, mpPinsHTML,
 * mpElseHTML, mpFitsHTML, mpRecentHTML). The longer account is with the code.
 *
 * A part of app.js (Nourish) in a file of its own. app.js calls
 * HiveParts.pickbands(app) once, as it starts, and keeps what it gives
 * back under the same names. What you reach for (MP_KNOWN) stays declared
 * in app.js, which empties it; the part reaches it, the recipes and foods
 * (replaced as they change) and the shelves (declared further down)
 * through LIVE (tests/scope.test.js holds the lists to each other). Loaded
 * before app.js.
 */
(window.HiveParts = window.HiveParts || {}).pickbands = function (app) {
  'use strict';

  // what it reads of the app's, and (LIVE) what the app replaces as it goes: BY_ID, MFOODS, MP_KNOWN, MP_LASTX, MSHELF, RECIPES
  var BOOKS = app.BOOKS;
  var MDAYS = app.MDAYS;
  var S = app.S;
  var dayKey = app.dayKey;
  var fmtNum = app.fmtNum;
  var idOf = app.idOf;
  var mAllSections = app.mAllSections;
  var mDay = app.mDay;
  var mDayTargets = app.mDayTargets;
  var mDefaultX = app.mDefaultX;
  var mFamilyIds = app.mFamilyIds;
  var mGapFresh = app.mGapFresh;
  var mIsFav = app.mIsFav;
  var mMacLine = app.mMacLine;
  var mMealAsk = app.mMealAsk;
  var mMealHolds = app.mMealHolds;
  var mMealPool = app.mMealPool;
  var mNever = app.mNever;
  var mRank = app.mRank;
  var mReadSlots = app.mReadSlots;
  var mShelfKey = app.mShelfKey;
  var mViewKey = app.mViewKey;
  var mWideOpen = app.mWideOpen;
  var matchRank = app.matchRank;
  var mpRowHTML = app.mpRowHTML;
  var searchScore = app.searchScore;
  var todayKey = app.todayKey;
  var LIVE = app.LIVE;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* What you ate lately, newest first, one row each. The everyday case is a
     thing you have already named once — the tamale from last week — and it
     should not need any of the three ways to reach. */
  /* The two bands the home screen was missing.
   *
     Opening this sheet used to offer six things you ate lately and a way to
     go looking. What it never offered was the answer to the question you
     opened it with — what would close the day — even though the app has
     worked that out for every dish since the tab was built. It was one
     option inside a sort dropdown, two taps and a mode away, called "Best
     fit".

     Now it is a band, on arrival, with the portions already solved. */
  /* The one question every band asks of the query.
   *
     Searching used to REPLACE the ranked bands, because Every day / Recent /
     the closers / Fits best were emitted only in the home branch and typing
     switched you out of it. So the moment you looked for something, the
     thinking the sheet had done for you vanished — which is most of what
     "bouncing around" was.
   *
     Now the bands NARROW instead. One predicate, so a dish cannot pass in one
     band and fail in another: foods match on their name, the way the look-up
     box has always matched them, and recipes go through matchRank, which
     reads the ingredient list too — searching "honey" should find the dish
     that uses it, not just a spoon of it. */
  function mpQ() { return (S.mpQuery || '').trim().toLowerCase(); }

  /* The shelf rail. One chip at a time, '' meaning all of them.
   *
     It NARROWS what is already on screen rather than replacing it, exactly as
     the search box does, and the two compose: 🥩 with "chicken" typed is the
     chicken that is mostly protein. That is the whole reason a chip is a
     filter and not a mode — Recipes as a MODE could never have been crossed
     with a macro.
   *
     Not persisted. A shelf is a thought you are having about this meal, not a
     setting; the sheet opens showing everything, the way it always has. */
  var MP_PILLS = [
    ['protein', '\uD83E\uDD69', 'Protein'],
    ['fat',     '\uD83E\uDD51', 'Fats'],
    ['carb',    '\uD83C\uDF5A', 'Carbs']
  ];
  function mpMacroDomKey(r) {
    if (!r || !r.food) return '';
    var m = r.macro || {};
    var pk = (m.p || 0) * 4, fk = (m.f || 0) * 9, ck = (m.c || 0) * 4;
    if (pk <= 0 && fk <= 0 && ck <= 0) {
      var sk = mShelfKey(r);
      return (sk === 'protein' || sk === 'fat' || sk === 'carb') ? sk : 'carb';
    }
    if (pk >= fk && pk >= ck) return 'protein';
    if (fk >= pk && fk >= ck) return 'fat';
    return 'carb';
  }
  function mpEatoutPool() {
    return LIVE.MFOODS.filter(function (r) { return !!r.eatout; });
  }
  function mpSpotOf(r) {
    return r && r.spot ? String(r.spot).split(/\s*\u00b7\s*/)[0].trim() : '';
  }
  function mpShelfOK(r) {
    if (!S.mpShelf) return true;
    if (S.mpShelf === 'eatout') return !!r.eatout && (!S.mpSpot || mpSpotOf(r) === S.mpSpot);
    if (r.eatout) return false;
    if (S.mpShelf === 'recipes') return !r.food;
    if (S.mpShelf === 'protein' || S.mpShelf === 'fat' || S.mpShelf === 'carb') {
      return !!r.food && mpMacroDomKey(r) === S.mpShelf;
    }
    return mShelfKey(r) === S.mpShelf;
  }

  function mpSortsOn() {
    return !(S.mpSec === 'foods' || (S.mpShelf && S.mpShelf !== 'recipes' && S.mpShelf !== 'eatout'));
  }
  function mpSortNow() { return mpSortsOn() ? S.mpSort : 'fit'; }

  function mpSavedMeals() {
    var out = [];
    LIVE.MFOODS.forEach(function (r) { if (r.parts && r.parts.length && !r.eatout) out.push(r); });
    LIVE.RECIPES.forEach(function (r) {
      if (r.own && r.typedMacro && !(r.steps || []).length && (r.ing || []).length) out.push(r);
    });
    return out;
  }
  function mpLensHTML() {
    var fam = mFamilyIds(mViewKey());
    var saved = mpSavedMeals().length;
    return '<span class="mp-lens">' +
      '<select id="mpSec" aria-label="Which recipes">' +
        '<option value="meal"' + (S.mpSec === 'meal' ? ' selected' : '') + '>For this meal</option>' +
        (fam.length ? '<option value="family"' + (S.mpSec === 'family' ? ' selected' : '') +
          '>On the family\u2019s plan (' + fam.length + ')</option>' : '') +
        '<option value="all"' + (S.mpSec === 'all' ? ' selected' : '') + '>Every recipe</option>' +
        '<option value="foods"' + (S.mpSec === 'foods' ? ' selected' : '') + '>Single foods</option>' +
        (saved || S.mpSec === 'saved' ? '<option value="saved"' + (S.mpSec === 'saved' ? ' selected' : '') + '>Saved meals</option>' : '') +
        (function () {
          var out = '', bk = 0;
          mAllSections().forEach(function (sec) {
            if (sec.book !== bk) {
              out += (bk ? '</optgroup>' : '') + '<optgroup label="' +
                esc(sec.book === 3 ? 'Ours' : BOOKS[sec.book].name) + '">';
              bk = sec.book;
            }
            out += '<option value="' + esc(sec.key) + '"' + (S.mpSec === sec.key ? ' selected' : '') + '>' +
              esc(sec.name) + '</option>';
          });
          return out + (bk ? '</optgroup>' : '');
        })() +
      '</select>' +
      (mpSortsOn()
        ? '<select id="mpSort" aria-label="Order">' +
          '<option value="fit"' + (S.mpSort === 'fit' ? ' selected' : '') + '>Best fit</option>' +
          '<option value="protein"' + (S.mpSort === 'protein' ? ' selected' : '') + '>Most protein</option>' +
          '<option value="healthy"' + (S.mpSort === 'healthy' ? ' selected' : '') + '>Nutrition score</option>' +
          '</select>'
        : '') + '</span>';
  }

  var MP_SPOT_ORDER = [
    'McDonald\u2019s', 'Chick-fil-A', 'Wendy\u2019s', 'Arby\u2019s', 'KFC', 'Dairy Queen',
    'Costa Vida', 'Cafe Rio', 'Chipotle', 'Subway', 'Jersey Mike\u2019s', 'Jimmy John\u2019s',
    'Taco Bell', 'Taco Time', 'Culver\u2019s', 'In-N-Out', 'Panda Express', 'Cafe Zupas',
    'R&R BBQ', 'Kneaders', 'Mo\u2019 Bettahs', 'Teriyaki Grill', 'Cupbop', 'Sonic Drive-In',
    'Burger King', 'Maverik', 'Walmart Deli', 'Grogg\u2019s Pinnacle Brewing',
    'JB\u2019s Restaurant', 'Wingers', 'Sherald\u2019s', 'Domino\u2019s', 'Little Caesars'
  ];
  function mpSpotsHTML(slot, q) {
    if (S.mpShelf !== 'eatout') return '';
    var mt = (slot && (slot.t || slot.k)) || 'l';
    var counts = {}, mealHit = {}, seen = [];
    mpEatoutPool().forEach(function (r) {
      var sp = mpSpotOf(r);
      if (!sp) return;
      if (counts[sp] === undefined) { counts[sp] = 0; seen.push(sp); }
      if (String(r.meals || 'bld').indexOf(mt) >= 0) mealHit[sp] = 1;
      if (!q || mpTextMatch(r, q)) counts[sp]++;
    });
    seen.sort(function (a, b) {
      var ma = mealHit[a] ? 0 : 1, mb = mealHit[b] ? 0 : 1;
      if (ma !== mb) return ma - mb;
      var ia = MP_SPOT_ORDER.indexOf(a), ib = MP_SPOT_ORDER.indexOf(b);
      return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
    });
    var chips = '<button class="mp-spot' + (S.mpSpot ? '' : ' on') +
      '" data-mpspot="" aria-pressed="' + (S.mpSpot ? 'false' : 'true') + '">All</button>';
    seen.forEach(function (sp) {
      var c = counts[sp] || 0;
      if (q && c < 1 && S.mpSpot !== sp) return;
      var on = S.mpSpot === sp;
      chips += '<button class="mp-spot' + (on ? ' on' : '') +
        '" data-mpspot="' + esc(sp) + '" aria-pressed="' + (on ? 'true' : 'false') + '">' +
        esc(sp) + '</button>';
    });
    return '<div class="mp-shelves mp-spots" id="mpSpots" role="group" aria-label="Restaurant">' + chips + '</div>';
  }
  function mpShelvesHTML() {
    if (!S.macroPick) return '';
    var slot = null;
    mReadSlots().list.forEach(function (sl) { if (sl.k === S.macroPick.slot) slot = sl; });
    if (!slot) return '';
    var q = mpQ();
    var n = { protein: 0, fat: 0, carb: 0 }, anyRecipe = false, anyEatout = false, total = 0, cooked = 0, eatout = 0;
    mMealPool(slot, true).concat(mpEatoutPool()).forEach(function (r) {
      if (!r.food) anyRecipe = anyRecipe || !q;
      if (r.eatout) anyEatout = anyEatout || !q;
      if (q && !mpTextMatch(r, q)) return;
      total++;
      if (!r.food) { anyRecipe = true; cooked++; return; }
      if (r.eatout) { anyEatout = true; eatout++; return; }
      var k = mpMacroDomKey(r);
      if (k) n[k] = (n[k] || 0) + 1;
    });
    var tag = function (c) {
      return q ? '<b class="mp-shn">' + c + '</b>' : '';
    };
    var chips = '<button class="mp-shelf' + (S.mpShelf ? '' : ' on') +
      '" data-mpshelf="" aria-pressed="' + (S.mpShelf ? 'false' : 'true') + '">All' +
      tag(total) + '</button>';
    MP_PILLS.forEach(function (sh) {
      var c = n[sh[0]] || 0;
      if (q && c < 1 && S.mpShelf !== sh[0]) return;
      chips += '<button class="mp-shelf' + (q ? ' counted' : '') +
        (S.mpShelf === sh[0] ? ' on' : '') +
        '" data-mpshelf="' + sh[0] + '" aria-pressed="' + (S.mpShelf === sh[0] ? 'true' : 'false') +
        '" aria-label="' + esc(sh[2]) + (q ? ', ' + c + ' of them' : '') +
        '"><i>' + sh[1] + '</i><span class="mp-shl"> ' + esc(sh[2]) + '</span>' + tag(c) + '</button>';
    });
    if (anyRecipe || S.mpShelf === 'recipes') {
      chips += '<button class="mp-shelf' + (q ? ' counted' : '') +
        (S.mpShelf === 'recipes' ? ' on' : '') +
        '" data-mpshelf="recipes" aria-pressed="' + (S.mpShelf === 'recipes' ? 'true' : 'false') +
        '" aria-label="Recipes' + (q ? ', ' + cooked + ' of them' : '') +
        '"><i>\uD83C\uDF72</i><span class="mp-shl"> Recipes</span>' + tag(cooked) + '</button>';
    }
    if ((anyEatout && (!q || eatout > 0)) || S.mpShelf === 'eatout') {
      chips += '<button class="mp-shelf' + (q ? ' counted' : '') +
        (S.mpShelf === 'eatout' ? ' on' : '') +
        '" data-mpshelf="eatout" aria-pressed="' + (S.mpShelf === 'eatout' ? 'true' : 'false') +
        '" aria-label="Eating out' + (q ? ', ' + eatout + ' of them' : '') +
        '"><i>\uD83E\uDD61</i><span class="mp-shl"> Eating out</span>' + tag(eatout) + '</button>';
    }
    return '<div class="mp-shelves" id="mpShelves">' + chips + '</div>' + mpSpotsHTML(slot, q);
  }
  function mpTextMatch(r, qs) {
    if (!qs) return true;
    if (r.eatout) return searchScore(r.name + ' ' + (r.spot || ''), qs) >= 0;
    return r.food ? searchScore(r.name, qs) >= 0 : !!matchRank(r, qs);
  }
  function mpMatches(r, qs) {
    if (!r || !mpShelfOK(r)) return false;
    return mpTextMatch(r, qs);
  }

  function mpMacroShare(r, sh) {
    var m = (r && r.macro) || {};
    var kcal = Math.max(m.kcal || ((m.p || 0) * 4 + (m.f || 0) * 9 + (m.c || 0) * 4), 1);
    if (sh === 'protein') return ((m.p || 0) * 4) / kcal;
    if (sh === 'fat') return ((m.f || 0) * 9) / kcal;
    if (sh === 'carb') return ((m.c || 0) * 4) / kcal;
    return 0;
  }

  function mpKnownIds() {
    var out = {}, today = todayKey();
    var from = new Date(); from.setDate(from.getDate() - 14);
    var fromK = dayKey(from);
    Object.keys(MDAYS).forEach(function (k) {
      if (k > today || k < fromK) return;
      var day = MDAYS[k] || {};
      Object.keys(day).forEach(function (sk) {
        (day[sk] || []).forEach(function (it) { out[it.id] = 1; });
      });
    });
    return out;
  }

  /* Where a typed word puts a row, lower first; -1 when it does not match.
   *
     Blake's order: "★ and recent foods ranked first, then exact, then
     word-starts" — then the rest, then the guesses. The guesses stay last
     even when starred: a typo hit is the app wondering what you meant, and a
     favourite it wondered its way to must not sit above the thing you
     actually typed. A recipe that only mentions the word in its ingredients
     or its section comes after every name. `coarse` drops the fine grades
     inside each band, for a list that has its own order (fit) to keep. */
  function mpHitRank(r, q, coarse) {
    var s = searchScore(r.eatout ? r.name + ' ' + (r.spot || '') : r.name, q);
    if (s < 0) {
      if (r.food) return -1;
      var m = matchRank(r, q);
      return m === 2 ? 1500 : m === 1 ? 1600 : -1;
    }
    var typo = s >= 300, known = !!(LIVE.MP_KNOWN[r.id] || mIsFav(r));
    if (coarse) s = Math.floor(s / 100) * 100;
    /* Three groups — what you reach for, everything else, the guesses — and
       inside the guesses your own come first too. */
    return (typo ? 1000 : known ? 0 : 500) + (typo && !known ? 100 : 0) + s;
  }

  /* The thing you actually named, before anything that merely mentions it.
   *
     Ranked on fit alone a spoonful loses to every dinner that lists honey
     among its ingredients, so the row the search was FOR sinks below a
     screenful of recipes. The old Look up screen had this rule and it went
     out with the screen; the bands that replaced it rank by fit, which is the
     right question when you are browsing and the wrong one the moment you
     have typed a word. A search is not a browse: the word is the whole of the
     question. */
  function mpNamedHTML(shown) {
    var q = mpQ();
    if (!q || !S.macroPick) return '';
    /* Every food the words find, ranked, and then the best six — not the
       first six in table order, which is how Eggplant came above the Eggs
       you had starred. */
    var hits = [];
    LIVE.MFOODS.forEach(function (r, i) {
      if (r.eatout || shown[r.id] || !mpShelfOK(r)) return;
      var rk = mpHitRank(r, q);
      if (rk >= 0) hits.push({ r: r, rk: rk, i: i });
    });
    hits.sort(function (a, b) { return a.rk - b.rk || a.i - b.i; });
    var rows = hits.slice(0, 6).map(function (h) { return h.r; });
    if (!rows.length) return '';
    rows.forEach(function (r) { shown[r.id] = 1; });
    return '<div class="mt-div">Foods</div>' + rows.map(function (r) {
      return mpRowHTML(r, mDefaultX(r));
    }).join('');
  }

  /* What you starred, first, both when typing and when browsing a macro shelf.
   *
     Blake, 2026-10-08 & 2026-10-15: "my first priority is to find proteins I
     like. and then I find fats, then I find carbs. and I would like to see
     the best sources of those macros first. my favs, then most recommended
     from my actual pantry, then it can show the rest." */
  function mpFavsHTML(shown) {
    var q = mpQ();
    if (!S.macroPick) return '';
    if (!q && !S.mpShelf) return '';
    var hits = [];
    if (!q) {
      var slot = null;
      mReadSlots().list.forEach(function (sl) { if (sl.k === S.macroPick.slot) slot = sl; });
      if (!slot) return '';
      mMealPool(slot, true).concat(mpEatoutPool()).forEach(function (r, i) {
        if (shown[r.id] || !mIsFav(r) || !mpMatches(r, '')) return;
        hits.push({ r: r, rk: (r.food && !r.eatout ? 0 : 1) - mpMacroShare(r, S.mpShelf) * 0.5, i: i });
      });
    } else {
      var look = function (r, i) {
        if (shown[r.id] || !mIsFav(r) || !mpMatches(r, q)) return;
        var rk = mpHitRank(r, q);
        if (rk >= 0) hits.push({ r: r, rk: rk, i: i });
      };
      LIVE.MFOODS.forEach(look);
      LIVE.RECIPES.forEach(function (r, i) { look(r, LIVE.MFOODS.length + i); });
    }
    hits.sort(function (a, b) { return a.rk - b.rk || a.i - b.i; });
    var rows = hits.slice(0, 6).map(function (h) { return h.r; });
    if (!rows.length) return '';
    rows.forEach(function (r) { shown[r.id] = 1; });
    return '<div class="mt-div">Favorites</div>' + rows.map(function (r) {
      return mpRowHTML(r, mDefaultX(r));
    }).join('');
  }

  function mpPinsHTML(shown) {
    mGapFresh();
    if (!S.macroPick) return '';
    var slot = null;
    mReadSlots().list.forEach(function (sl) { if (sl.k === S.macroPick.slot) slot = sl; });
    var pins = (slot && slot.pins) || [];
    var rows = pins.map(function (pn) {
      var r = LIVE.BY_ID[idOf(pn.id)];
      if (!r) return '';
      if (!mpMatches(r, mpQ())) return '';
      if (shown) shown[r.id] = 1;
      return mpRowHTML(r, pn.x || 1);
    }).filter(Boolean).join('');
    return rows ? '<div class="mt-div">Every day</div>' + rows : '';
  }

  /* What closes the day, from this meal's own pool, portions solved.
   *
     Skips anything the bands above already drew: a pin that is also a recent
     and also the best fit would otherwise be three rows saying the same
     thing, and a list that repeats itself reads as a list that is not
     thinking. */
  /* Everything else the query finds.
   *
     Without this, narrowing the bands would be worse than replacing them:
     the bands hold a few dozen dishes, so typing "salmon" would filter all
     four to nothing and the sheet would say there is no salmon — while the
     table holds it. This is the old look-up result, folded in underneath
     rather than shown instead.
   *
     Only when something is typed. With an empty box the ranked bands ARE the
     answer and a fifth band of everything in the book underneath them is not
     help. */
  function mpElseHTML(shown) {
    var q = mpQ();
    if (!q || !S.macroPick) return '';
    var day = mDay(mViewKey()), targets = mDayTargets(mViewKey());
    var slot = null;
    mReadSlots().list.forEach(function (sl) { if (sl.k === S.macroPick.slot) slot = sl; });
    var pool = [];
    LIVE.MFOODS.forEach(function (r) { if (!shown[r.id] && mpMatches(r, q)) pool.push(r); });
    LIVE.RECIPES.forEach(function (r) { if (!shown[r.id] && mpMatches(r, q)) pool.push(r); });
    if (!pool.length) return '';
    var ranked = mRank(pool, day, targets, slot || { k: S.macroPick.slot, w: S.macroPick.w });
    /* The thing you named before the dishes that merely mention it: ranked
       purely on fit, a spoon of honey loses to a dozen recipes listing honey
       among their ingredients and the row you typed the word for never
       appears. So the search's own order goes first, in its broad grades,
       then foods before dishes as the look-up box always had it, and fit
       only after that — which is still the order most of a grade is in. */
    var rows = ranked.map(function (e, i) {
      return { e: e, rk: mpHitRank(e.r, q, true), f: (e.r.food && !e.r.eatout) ? 0 : 1, i: i };
    }).sort(function (a, b) {
      return a.rk - b.rk || a.f - b.f || a.i - b.i;
    }).map(function (h) { return h.e; }).slice(0, 12);
    if (!rows.length) return '';
    rows.forEach(function (e) { shown[e.r.id] = 1; });
    return '<div class="mt-div">Everything else</div>' + rows.map(function (e) {
      var r = e.r, x0 = mDefaultX(r);
      var xx = S.mpBasket[r.id] !== undefined ? S.mpBasket[r.id] : x0;
      var src = r.id && String(r.id).indexOf('f:my:') === 0 ? 'Yours' : r.eatout ? 'Eat out' : r.food ? 'Food' : 'Recipe';
      return mpRowHTML(r, x0,
        '<span class="mp-src">' + src + '</span> &times;' + fmtNum(xx) +
        (r.food ? ' ' + esc(r.unit) : '') + ' &middot; ' + mMacLine(r, xx, S.mpBasket[r.id] === undefined),
        e.score !== null && e.score !== undefined ? e.x : null);
    }).join('');
  }

  /* Which pills are still empty, named on the band that is ranked to fill
     them: "Fits best for carbs" once the egg whites and the cheese are on.
     Short is the pills' own line (under 92% of the share, mcap's "on").
     Only once something is on the meal and only for one or two of the
     three — an empty meal is short of everything, and saying so says
     nothing. */
  function mpForWhat() {
    var k = mViewKey(), sk = S.macroPick && S.macroPick.slot;
    if (!sk) return '';
    var ask = mMealAsk(sk, mDayTargets(k), mReadSlots()), want = ask && (ask.now || ask.plan);
    var got = mMealHolds(k, sk);
    if (!want || !(got.p + got.f + got.c > 0)) return '';
    var short = [['p', 'protein'], ['f', 'fat'], ['c', 'carbs']].filter(function (m) {
      // short as the meal's pills have it: more than 8% or 2 g under (myday.js, mSlack)
      return (want[m[0]] || 0) > 0 && (got[m[0]] || 0) < want[m[0]] - Math.max(want[m[0]] * 0.08, 2);
    }).map(function (m) { return m[1]; });
    if (!short.length || short.length === 3) return '';
    return ' <span class="mt-div-for">for ' + short.join(' and ') + '</span>';
  }

  function mpFitsHTML(skip) {
    mGapFresh();
    if (!S.macroPick) return '';
    var targets = mDayTargets(mViewKey());
    var slot = null;
    mReadSlots().list.forEach(function (sl) { if (sl.k === S.macroPick.slot) slot = sl; });
    if (!slot) return '';
    /* With no plan there is no fit to rank by, but there is still a whole
       book and a whole food table, and logging what you ate cannot wait on
       making a plan. This band used to return '' here and the "Single foods"
       lens was the only other way in — so when that lens went to the shelf
       rail, an unplanned day lost its last door and the picker opened on
       nothing at all. It offers the pool in book order instead, and says so
       rather than claiming a fit it cannot compute. */
    var planned = !!(targets.p || targets.f || targets.c);
    /* The slot OBJECT, not its key. mSlotSecs reads slot.t, and a string has
       no .t — so it fell through to MEAL_SECS.s and every meal, breakfast
       included, was ranked against the snack sections. Nothing threw; the
       band just quietly offered the wrong pool. */
    /* The lens decides the pool; the rail and the box narrow it afterwards.
       "For this meal" is the meal's own sections, which is what this band has
       always meant; anything else widens or names a section outright. */
    var pool;
    if (S.mpSec === 'foods') {
      /* Every food with macros on it, condiments included. The ranked bands
         gate on `eat || side` — nobody wants a spoon of oil OFFERED as a
         snack — but this lens is somebody going to look through the shelf,
         and a tablespoon of oil is a real thing to have eaten and to log.
         They sort under the foods rather than out of the list: a thing that
         goes ON food is not the answer to "what shall I eat", which is the
         same rule the combo's rungs follow.
     *
         EVERY food, including the ones the storehouse does not stock. "Fill
         from: the storehouse" says what the SOLVER may shop from — a day
         drafted out of salmon that is not in the house is not a day — and it
         has never had anything to say about what you may look at or log.
         Gating this lens on it hid all twenty-eight of the outside foods
         from the one lens whose whole job is "let me look through the
         shelf", while the same foods came straight back the moment you typed
         their name, which is a shelf that disagrees with its own search box.
         The gate belongs in mMealPool, mSideUp, mTopUp and mLevers, and it is
         still in all four. */
      pool = [];
      LIVE.MFOODS.forEach(function (r) {
        if (!r.macro || !(r.macro.kcal > 0 || r.macro.p > 0)) return;
        if (r.eatout && S.mpShelf !== 'eatout') return;
        pool.push(r);
      });
    } else if (S.mpSec === 'saved') {
      pool = mpSavedMeals();
    } else if (S.mpSec === 'meal') {
      pool = mMealPool(slot, mWideOpen(S.macroPick.slot));
      if (S.mpShelf === 'eatout' || mpQ()) pool = pool.concat(mpEatoutPool());
    } else {
      var fam = S.mpSec === 'family' ? mFamilyIds(mViewKey()) : null;
      pool = LIVE.RECIPES.filter(function (r) {
        if (fam) return fam.indexOf(r.id) >= 0;
        return S.mpSec === 'all' || (r.book + '-' + r.secNum) === S.mpSec;
      });
      /* Foods ride along only where they were asked for. Naming a section is
         naming what you want to look through — answering "Sunday Feasts" with
         the Sunday Feasts and then the entire food table is answering a
         question nobody asked. A typed word is different: somebody who types
         "honey" has already said what they want, and it should reach them
         from whatever lens they happen to be standing in. */
      /* And a typed word reaches the outside foods too, for the same reason
         the lens does: the setting is about drafting, not about looking. */
      if (mpQ() || S.mpShelf === 'eatout') {
        LIVE.MFOODS.forEach(function (r) {
          if (r.eat || r.side || r.eatout) pool.push(r);
        });
      }
    }
    var q = mpQ();
    var ranked = planned
      ? mRank(pool, mDay(mViewKey()), targets, slot)
        .filter(function (e) {
          /* Blocked is a rule about SUGGESTING: a typed word still finds it. */
          return e.score !== null && !skip[e.r.id] && mpMatches(e.r, q) && (q || !mNever(e.r.id));
        })
      : (function () {
        /* Foods and dishes alternated, not a prefix of the pool. mMealPool
           puts every recipe before every food, so a plain slice of ten was
           ten recipes and the 🥩 chip showed no foods at all — the chip is
           mostly there to reach the foods. Without a plan there is no fit to
           order by, so the only honest order is "some of each". */
        var ok = pool.filter(function (r) { return !skip[r.id] && mpMatches(r, q); });
        var fd = [], rc = [], out = [];
        ok.forEach(function (r) { (r.food ? fd : rc).push(r); });
        if (!q && (S.mpShelf === 'protein' || S.mpShelf === 'fat' || S.mpShelf === 'carb')) {
          var byShare = function (a, b) { return mpMacroShare(b, S.mpShelf) - mpMacroShare(a, S.mpShelf); };
          fd.sort(byShare);
          rc.sort(byShare);
        }
        for (var i = 0; i < Math.max(fd.length, rc.length); i++) {
          if (fd[i]) out.push({ r: fd[i], x: 1 });
          if (rc[i]) out.push({ r: rc[i], x: 1 });
        }
        return out;
      })();
    /* An order is a lens, not a different picker: every row keeps the portion
       the fit worked out, whatever order they arrive in. On the primary macro
       shelves (Protein, Fats, Carbs), rank by macro share of calories so the
       purest sources of that macro lead before mixed dishes. */
    var order = mpSortNow();
    if (order === 'protein') {
      ranked.sort(function (a, b) {
        return ((b.r.macro && b.r.macro.p) || 0) - ((a.r.macro && a.r.macro.p) || 0);
      });
    } else if (order === 'healthy') {
      ranked.sort(function (a, b) { return (b.r.score || 0) - (a.r.score || 0); });
    } else if (planned && !q && (S.mpShelf === 'protein' || S.mpShelf === 'fat' || S.mpShelf === 'carb')) {
      ranked.sort(function (a, b) {
        return mpMacroShare(b.r, S.mpShelf) - mpMacroShare(a.r, S.mpShelf);
      });
    }
    /* Ten while the lens is where it opens, forty once it or a shelf chip has
       been chosen.
     *
       Ten is the right length for "here are the best fits" — a shortlist you
       read rather than a catalogue you scroll. But choosing a lens or a shelf
       is asking a different question: "Single foods", "Protein", or "Sunday
       Feasts" is somebody going to look through a shelf, and answering that
       with the top ten is answering the shortlist question again. The old
       Recipes screen showed forty for exactly this reason and it went out
       with the mode. */
    if (S.mpShelf === 'eatout' && S.mpSec === 'meal' && !q) {
      var mt = (slot && (slot.t || slot.k)) || 'l';
      var mHit = [], mRest = [];
      ranked.forEach(function (e) {
        (String(e.r.meals || 'bld').indexOf(mt) >= 0 ? mHit : mRest).push(e);
      });
      ranked = mHit.concat(mRest);
    }
    if (S.mpSec === 'foods' || (S.mpShelf && S.mpShelf !== 'recipes')) {
      /* Stable: the fit/macro order is kept inside each group, and the
         condiments simply move below the foods. */
      var eats = [], cond = [];
      ranked.forEach(function (e) { ((!e.r.food || e.r.eat || e.r.side || e.r.eatout) ? eats : cond).push(e); });
      ranked = eats.concat(cond);
    }
    /* Anything already in the basket stays on screen, outside the cap.
     *
       Picking something used to make it VANISH: a closer stops being a closer
       once it is in the basket, and it fits worse afterwards — the gap it
       filled is gone — so it fell out of the ranking too. Measured, the list
       went 13 rows to 12 to 11 to 10 over three taps, `.mpick-wrap.in` was
       never once on screen, and the scrollport's maximum collapsed from 162
       to 4 — so the browser clamped the position and the list crawled up
       under the finger. The ✓ and the green wash a picked row wears had
       nothing to wear them.
     *
       Held at the end rather than the top: it is no longer a suggestion, and
       promoting it would push the actual suggestions down. */
    var held = [], offer = [];
    ranked.forEach(function (e) {
      (S.mpBasket[e.r.id] !== undefined ? held : offer).push(e);
    });
    ranked = offer.slice(0, S.mpSec === 'meal' && !S.mpShelf ? 10 : 40).concat(held);
    /* An empty band still draws its divider, because the divider is where the
       lens and the order live and they are the way back out.
     *
       A shelf chip and a lens compose — that is the whole point of a chip
       being a filter — and some pairs have nothing in them: press 🥦 while
       the lens says "Every recipe" and you are asking for a recipe that is a
       vegetable. The band returned '' and took the two controls with it, so
       the sheet showed an empty list and no way to undo the thing that
       emptied it. It says what it has none of instead, and keeps the handles. */
    if (!ranked.length) {
      /* Empty because of the LENS: keep the divider, because the lens and the
         order live on it and they are the way back out. Press 🥦 while the
         lens says "Every recipe" and you have asked for a recipe that is a
         vegetable — the band used to return '' and take both controls with
         it, leaving an empty list and no way to undo the thing that emptied
         it.
       *
         Empty because of a QUERY is not that: the box is right there with the
         caret in it, so the way out is already under your hands, and a "Fits
         best" heading standing over no rows would be a band claiming content
         it does not have. No divider, and the list says "Nothing matches" in
         its own words.
       *
         No message here either way. A band that returns any string at all
         makes the list look non-empty, and that is what buried the honest
         sentence the first time this was tried. */
      if (mpQ()) return '';
      return '<div class="mt-div mt-div-x">' + (planned ? 'Fits best' : 'On the shelf') +
        mpLensHTML() + '</div>';
    }
    /* Writes into the shared set, which it never used to — safe only while it
       was composed last, and it is not last any more. */
    ranked.forEach(function (e) { skip[e.r.id] = 1; });
    /* The lens and the order ride the divider rather than the pinned header:
       a header has to earn every pixel and these are asked for rarely, but
       they are asked for — "show me the Sunday Feasts" is a real thing to
       want and no macro chip can say it. */
    return '<div class="mt-div mt-div-x">' + (planned ? 'Fits best' + mpForWhat() : 'On the shelf') +
      mpLensHTML() + '</div>' +
      ranked.map(function (e) {
      /* Ranked by how well it fits the day, offered at what a tap puts
         down: what you have, or what fits this meal (mDefaultX). */
      return mpRowHTML(e.r, mDefaultX(e.r));
    }).join('');
  }

  /* `shown` is shared with the bands above and below, so the same dish is
     never drawn three times under three headings. Passed in rather than kept
     here, because whoever composes the screen is the only thing that knows
     what order the bands ran in. */
  function mpRecentHTML(shown) {
    mGapFresh();
    var seen = shown || {}, out = [];
    var keys = Object.keys(MDAYS).sort().reverse();
    var take = function (it) {
      if (seen[it.id] || out.length >= 6) return;
      var r = LIVE.BY_ID[it.id];
      if (!r) return;
      if (!mpMatches(r, mpQ())) return;
      seen[it.id] = 1;
      out.push({ r: r, x: it.x });
    };
    /* This meal first. Adding to dinner, it is what you had at dinner
       on the days behind you, newest first, and only then anything else you
       ate lately. Blake: "Recents per meal (dinner shows dinner foods)". The
       day being built is left out of that pass: what is on this meal already
       is in the bar at the foot of the sheet. */
    var slot = S.macroPick && S.macroPick.slot, viewK = mViewKey(), today = todayKey();
    if (slot) {
      keys.forEach(function (k) {
        if (k === viewK || k > today) return;
        ((MDAYS[k] || {})[slot] || []).forEach(take);
      });
    }
    keys.forEach(function (k) {
      if (k > today) return;
      var day = MDAYS[k] || {};
      Object.keys(day).forEach(function (sk) {
        (day[sk] || []).forEach(take);
      });
    });
    if (!out.length) return '';
    return '<div class="mt-div">Recent</div>' + out.map(function (e) {
      return mpRowHTML(e.r, LIVE.MP_LASTX[e.r.id] || e.x);
    }).join('');
  }

  return { mpQ: mpQ, mpShelvesHTML: mpShelvesHTML, mpMatches: mpMatches, mpKnownIds: mpKnownIds, mpNamedHTML: mpNamedHTML, mpFavsHTML: mpFavsHTML, mpPinsHTML: mpPinsHTML, mpElseHTML: mpElseHTML, mpFitsHTML: mpFitsHTML, mpRecentHTML: mpRecentHTML };
};
