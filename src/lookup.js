/* Looking a code or a name up: a barcode in the open food databases
 * (mBarcodeLookup), what a failed lookup says, in one place (mLookSay), the
 * rows an answer becomes (mLookupRows), and the food tables asked once you
 * have stopped typing, one request per word, late answers dropped
 * (mpLookSoon, mLookNet). The longer account is with the code.
 *
 * A part of app.js (Nourish) in a file of its own. app.js calls
 * HiveParts.lookup(app) once, as it starts, and keeps what it gives back
 * under the same names. The answers kept so far and the count that drops
 * late ones (MLOOKUP, mLookSeq) stay declared in app.js; the part reaches
 * them through LIVE (tests/scope.test.js holds the lists to each other).
 * Loaded before app.js.
 */
(window.HiveParts = window.HiveParts || {}).lookup = function (app) {
  'use strict';

  // what it reads of the app's, and (LIVE) what the app replaces as it goes: MLOOKUP, mLookSeq
  var BUILD = app.BUILD;
  var S = app.S;
  var mFoodSearch = app.mFoodSearch;
  var mUsdaBarcode = app.mUsdaBarcode;
  var mQueryKind = app.mQueryKind;
  var LIVE = app.LIVE;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function $(id) { return document.getElementById(id); }

  /* A barcode, asked of Open Food Facts and the USDA's packaged foods at
     once (mUsdaBarcode), and the two answers weighed against each other
     (mTwoAnswers). The USDA used to be asked only when Open Food Facts had
     nothing, which caught the packets it did not know and none of the ones
     it knew wrongly: Blake picked mockup "E" (2026-10-07) after a probe
     found a US peanut butter there as "Yellowfin Tuna" at a sixth of its
     calories, a record the USDA had right by the same barcode.
   *
     Asked together, so a scan waits for the slower of two answers rather
     than for one after the other. Either alone is the answer when the other
     does not know the packet or cannot be reached. Neither knowing it is
     said as that; a USDA out of reach leaves Open Food Facts' own failure
     standing, so "did not answer" is never upgraded to "does not exist". */
  function mBarcodeLookup(code) {
    var settle = function (p) {
      return p.then(function (l) { return { ok: l[0] }; }, function (e) { return { err: e }; });
    };
    return Promise.all([settle(mOffLookup(code)), settle(mUsdaBarcode(code))]).then(function (r) {
      var o = r[0], u = r[1];
      if (o.ok && u.ok) return mTwoAnswers(o.ok, u.ok);
      if (o.ok || u.ok) return [o.ok || u.ok];
      if (o.err && o.err.message === 'none' && u.err && u.err.message === 'none') throw new Error('nowhere');
      throw o.err;
    });
  }

  /* Two answers for one barcode. Calories per 100 g are the one figure both
     always give on the same basis, so they are what is compared: apart by
     more than a fifth (and by 30 kcal, so a can of broth at 8 against 11 is
     not a quarrel), the two are shown side by side, the USDA's first since
     it is the maker's own label, and you pick the one that matches the
     packet in your hand. Open Food Facts runs checks of its own and says
     when its calories fail them; that is said too.
   *
     Agreeing, Open Food Facts' answer is the one used, because it is the
     one with the grades and the allergens, and anything it is missing that
     the USDA has (sodium and fiber, most often) is filled in from the USDA
     at the same serving. The form says it was checked. */
  function mTwoAnswers(o, u) {
    var a = o.k100, b = u.k100;
    var both = typeof a === 'number' && typeof b === 'number' && a > 0 && b > 0;
    var calClash = both && Math.abs(a - b) > Math.max(30, 0.2 * Math.max(a, b));
    var op = o.per100 || {}, up = u.per100 || {};
    var macroClash = both && ['p', 'f', 'c'].some(function (k) {
      var v1 = op[k], v2 = up[k];
      return typeof v1 === 'number' && typeof v2 === 'number' && Math.abs(v1 - v2) > Math.max(5, 0.25 * Math.max(v1, v2));
    });
    if (calClash || (both && (o.flag || macroClash))) {
      var list = [u, o];
      list.clash = { off: Math.round(a), usda: Math.round(b), flagged: !!o.flag };
      return list;
    }
    var g = o.g, h = u.per100 || {};
    if (g && o.na === null && typeof h.na === 'number') o.na = Math.round(h.na * g / 100);
    if (g && o.fib === null && typeof h.fib === 'number') o.fib = Math.round(h.fib * g / 10) / 10;
    // and the same gaps in the label per 100 g that the sizes are worked from
    if (o.per100) Object.keys(h).forEach(function (k) {
      if (o.per100[k] === null && typeof h[k] === 'number') o.per100[k] = h[k];
    });
    if (both) o.note = 'Open Food Facts, checked against the USDA\u2019s packaged foods';
    return [o];
  }
  function mOffLookup(code) {
    /* Open Food Facts asks callers to say who they are. A browser cannot set
       its own User-Agent, so their documented alternative is to name the app
       in the query — which costs nothing and is the difference between
       being a known caller and being anonymous traffic to be throttled.
     *
       Fifteen product reads a minute per address is the published limit, and
       a supermarket aisle is exactly where somebody scans four things in a
       row, so being turned away has to read as "wait a moment" rather than
       as "this is broken". Their full-text search lives in a separate
       service and is not part of this API, which is why the searching here
       is the USDA's job and the barcodes are theirs. */
    var url = 'https://world.openfoodfacts.org/api/v2/product/' +
      encodeURIComponent(code) + '.json?fields=product_name,brands,nutriments,serving_size,serving_quantity,serving_quantity_unit,allergens_tags,' +
      'nutriscore_grade,nova_group,nova_groups_markers,nutrient_levels,ingredients_analysis_tags,' +
      'additives_tags,ingredients_text,ingredients_text_en,data_quality_errors_tags,image_front_small_url' +
      '&app_name=' + encodeURIComponent('Hive and Hearth') +
      '&app_version=' + encodeURIComponent(BUILD);
    return fetch(url).then(function (r) {
      if (r.status === 429 || r.status === 503) throw new Error('toofast');
      return r.json();
    }).then(function (d) {
      var p = d && d.product;
      if (!p) throw new Error('none');
      var nu = p.nutriments || {};
      /* One basis for all four figures. Each used to fall back on its own —
         per serving where the packet gave one, per 100 g where it did not —
         and the label was chosen from the energy alone, so a product listing
         calories per serving and protein only per 100 g arrived as one row
         mixing the two under "per serving". Per serving only when every
         figure the packet gives has a serving value; otherwise all of them
         per 100 g, which is the one basis Open Food Facts always fills. */
      var has = function (k, b) { return typeof nu[k + '_' + b] === 'number'; };
      var serving = has('energy-kcal', 'serving') &&
        ['proteins', 'fat', 'carbohydrates'].every(function (k) {
          return has(k, 'serving') || !has(k, '100g');
        });
      var per = function (k) { return { v: nu[k + (serving ? '_serving' : '_100g')], serving: serving }; };
      var e = per('energy-kcal');
      var pr2 = per('proteins'), fa = per('fat'), ca = per('carbohydrates');
      /* A great many products in Open Food Facts are photographs and a name
         with no nutrition table behind them yet. Every figure comes back
         missing, and rounding a missing figure gives zero — which would put
         a plate on the day claiming to be free, and quietly wrong the whole
         day's arithmetic. Missing is not zero, and has to say so. */
      var known = [e.v, pr2.v, fa.v, ca.v].some(function (v) { return typeof v === 'number'; });
      if (!known) throw new Error('nonutrition');
      /* To a tenth, as the label prints a gram: whole grams made a drink's
         0.5 g of fat per can none at all per 100 mL (2026-10-11). */
      var num2 = function (v) { return typeof v === 'number' ? Math.round(v * 10) / 10 : 0; };
      /* Sodium and fiber on the same basis as the rest, from the same reply:
         they were always in it, and thrown away. Open Food Facts keeps sodium
         in grams, and sometimes only salt, which is sodium times 2.5. One the
         packet does not give stays null, so the form leaves its box empty
         rather than printing a 0 nobody read off a label. */
      var na = per('sodium').v, sa = per('salt').v, fb = per('fiber').v;
      var naMg = typeof na === 'number' ? na * 1000 : typeof sa === 'number' ? sa / 2.5 * 1000 : null;
      /* The whole label per 100 g, for the sizes the form offers
         (src/camera.js): the packet's serving and 100 g. Grams of sodium,
         cholesterol and minerals are milligrams on a label. */
      var h = function (k, mult) { var v = nu[k + '_100g']; return typeof v === 'number' ? v * (mult || 1) : null; };
      var per100 = ['energy-kcal', 'proteins', 'fat', 'carbohydrates'].some(function (k) { return h(k) !== null; }) ? {
        kcal: h('energy-kcal') || 0, p: h('proteins') || 0, f: h('fat') || 0, c: h('carbohydrates') || 0,
        na: h('sodium', 1000) !== null ? h('sodium', 1000) : h('salt') !== null ? h('salt') / 2.5 * 1000 : null,
        fib: h('fiber'), sat: h('saturated-fat'), sug: h('sugars'), chol: h('cholesterol', 1000),
        ca: h('calcium', 1000), fe: h('iron', 1000), k: h('potassium', 1000) } : null;
      var sg = e.serving ? mServingGrams(p.serving_size, p) : 100;
      /* The first size is the packet's own serving, and keeps the packet's
         own figures for it (`row`): 85 kcal per 100 g times 130 g is 111,
         and the can says 110. A serving with no weight given cannot be one
         of the sizes, and the form is the plain one it was. */
      var isMl = /ml|milliliters?|fl\s*oz/i.test(String((p && p.serving_quantity_unit) || p.serving_size || ''));
      var uLabel = isMl ? 'mL' : 'g';
      var words = String(p.serving_size || '').replace(/\s*\([^)]*\)/g, '').trim();
      var sizes = !per100 || !sg ? null : e.serving
        ? [{ t: words && !/^\d+(?:[.,]\d+)?\s*(?:g|grams?|ml|milliliters?)$/i.test(words) ? words : sg + ' ' + uLabel, g: sg, u: uLabel, row: 1 }, { t: '100 ' + uLabel, g: 100, u: uLabel }]
        : [{ t: '100 ' + uLabel, g: 100, u: uLabel, row: 1 }];
      return [{
        name: [p.brands, p.product_name].filter(Boolean).join(' ') || ('Barcode ' + code),
        unit: e.serving ? (p.serving_size || 'serving') : ('100 ' + uLabel),
        kcal: num2(e.v), p: num2(pr2.v), f: num2(fa.v), c: num2(ca.v),
        na: naMg === null ? null : Math.round(naMg), fib: typeof fb === 'number' ? Math.round(fb * 10) / 10 : null,
        alg: mAllergens(p.allergens_tags),
        off: mOffMore(p),
        code: String(code),
        /* What the USDA's answer is weighed against (mTwoAnswers): the
           calories per 100 g, the grams the row's figures are for when the
           packet says, and whether Open Food Facts' own checks fault its
           numbers. */
        k100: typeof nu['energy-kcal_100g'] === 'number' ? nu['energy-kcal_100g'] : null,
        g: sg, per100: per100, sizes: sizes,
        flag: (Array.isArray(p.data_quality_errors_tags) ? p.data_quality_errors_tags : []).some(function (t) {
          return /energy|nutrition|nutrient/.test(String(t));
        }),
        src: 'Open Food Facts',
        note: 'Open Food Facts'
      }];
    });
  }

  /* What the packet declares, in plain words. Open Food Facts tags them
     "en:peanuts", "en:sesame-seeds"; a tag in another language is kept as
     its word. A short list on purpose: this is the label's "Contains" line,
     not a medical record, and twenty tags on a phone is a paragraph. */
  var ALLERGEN_WORD = { nuts: 'tree nuts', soybeans: 'soy', 'sesame-seeds': 'sesame', crustaceans: 'shellfish',
    'sulphur-dioxide-and-sulphites': 'sulphites' };
  function mAllergens(tags) {
    var out = [];
    (Array.isArray(tags) ? tags : []).forEach(function (t) {
      var w = String(t || '').replace(/^[a-z]{2}:/, '');
      w = ALLERGEN_WORD[w] || w.replace(/-/g, ' ');
      if (w && out.indexOf(w) < 0 && out.length < 8) out.push(w);
    });
    return out;
  }

  // the grams or mL in a serving as Open Food Facts writes it: "1/2 cup (130 g)", "30g", "330 ml"
  function mServingGrams(s, p) {
    var u = String((p && p.serving_quantity_unit) || '').toLowerCase();
    var isWeight = /^(g|grams?|ml|milliliters?)$/i.test(u);
    if (p && isWeight && Number(p.serving_quantity) > 0) return Number(p.serving_quantity);
    var m = /(\d+(?:[.,]\d+)?)\s*(?:g|grams?|ml|milliliters?)\b/i.exec(String(s || ''));
    if (m) return Number(m[1].replace(',', '.'));
    var fl = /(\d+(?:[.,]\d+)?)\s*(?:fl\s*oz|fluid\s*ounces?)\b/i.exec(String(s || ''));
    if (fl) return Math.round(Number(fl[1].replace(',', '.')) * 29.57);
    var oz = /(\d+(?:[.,]\d+)?)\s*(?:oz|ounces?)\b/i.exec(String(s || ''));
    if (oz) return Math.round(Number(oz[1].replace(',', '.')) * 28.35);
    if (p && Number(p.serving_quantity) > 0 && (!u || isWeight)) return Number(p.serving_quantity);
    return null;
  }

  /* The rest of what Open Food Facts says about a packet, read the way the
     mockup Blake picked (2026-10-07, "D") shows it: the two grades, the
     traffic lights, what the ingredients say about it, and the ingredients
     themselves. Every part is optional and most US packets lack some of it,
     so an absent answer is left out rather than guessed at: no grade is no
     badge, an unknown vegetarian status is no tag, and "no additives" is
     only said when there is an ingredient list for that to be true of.
   *
     A Leaf score is deliberately not among them. It was tuned for a plate
     of food (tools/score-lib.js) and gives a can of cola 48, "worth
     eating": three of its six parts are full marks for a modest calorie
     count, no fat and no salt, which is a plate's virtue and a soda's whole
     description. The Nutri-Score grades the same can E. */
  function mOffMore(p) {
    var out = {};
    var ns = String(p.nutriscore_grade || '').toLowerCase();
    if (/^[a-e]$/.test(ns)) out.ns = ns;
    var nova = Number(p.nova_group);
    if (nova >= 1 && nova <= 4) out.nova = Math.round(nova);
    var lv = p.nutrient_levels || {}, levels = {};
    ['fat', 'saturated-fat', 'sugars', 'salt'].forEach(function (k) {
      if (/^(low|moderate|high)$/.test(lv[k])) levels[k] = lv[k];
    });
    if (Object.keys(levels).length) out.lv = levels;
    var an = Array.isArray(p.ingredients_analysis_tags) ? p.ingredients_analysis_tags : [];
    var has = function (t) { return an.indexOf('en:' + t) >= 0; };
    var tags = [];
    if (has('vegan')) tags.push('Vegan');
    else if (has('vegetarian')) tags.push('Vegetarian');
    else if (has('non-vegetarian')) tags.push('Not vegetarian');
    if (has('palm-oil')) tags.push('Palm oil');
    else if (has('palm-oil-free')) tags.push('No palm oil');
    else if (has('may-contain-palm-oil')) tags.push('May contain palm oil');
    var ingr = String(p.ingredients_text_en || p.ingredients_text || '').replace(/\s+/g, ' ').trim().slice(0, 1200);
    var adds = Array.isArray(p.additives_tags) ? p.additives_tags.map(mAdditive) : [];
    if (adds.length) tags.push(adds.length === 1 ? '1 additive: ' + adds[0] : adds.length + ' additives');
    else if (ingr && Array.isArray(p.additives_tags)) tags.push('No additives');
    if (tags.length) out.tags = tags;
    if (adds.length > 1) out.adds = adds.slice(0, 12);
    if (ingr) out.ingr = ingr;
    /* The front of the packet, so you can see the scan found the right
       thing (Blake picked the photo, mockup D, 2026-10-07). Only from Open
       Food Facts' own image server, which is the one host the page's policy
       lets an image come from; anything else in the field is ignored. */
    var img = String(p.image_front_small_url || '');
    if (/^https:\/\/images\.openfoodfacts\.org\/[^\s"'<>()\\]+$/.test(img)) out.img = img;
    /* What made it NOVA 4, in Open Food Facts' own markers: an ingredient,
       an additive or the kind of food. Said in words, so the line can say
       why and the ingredients can be marked where the words appear. */
    var mk = p.nova_groups_markers && p.nova_groups_markers['4'];
    if (out.nova === 4 && Array.isArray(mk)) {
      var why = [];
      mk.forEach(function (m) {
        if (!Array.isArray(m) || m.length < 2) return;
        var w = m[0] === 'additives' ? mAdditive(m[1]) : String(m[1] || '').replace(/^[a-z]{2}:/, '').replace(/-/g, ' ');
        if (w && why.indexOf(w) < 0 && why.length < 6) why.push(w);
      });
      if (why.length) out.why = why;
    }
    return out;
  }

  /* An additive by the name on an American label rather than its E number.
     The common ones only; anything else keeps its number, which is at
     least searchable. */
  var ADDITIVE = { e100: 'turmeric colour', e101: 'riboflavin', e102: 'Yellow 5', e110: 'Yellow 6', e120: 'carmine',
    e129: 'Red 40', e133: 'Blue 1', e150: 'caramel colour', e160a: 'beta-carotene', e160b: 'annatto', e160c: 'paprika extract',
    e171: 'titanium dioxide', e200: 'sorbic acid', e202: 'potassium sorbate', e211: 'sodium benzoate', e250: 'sodium nitrite',
    e260: 'acetic acid', e270: 'lactic acid', e282: 'calcium propionate', e296: 'malic acid', e300: 'vitamin C',
    e306: 'tocopherols', e319: 'TBHQ', e320: 'BHA', e321: 'BHT', e322: 'lecithin', e330: 'citric acid',
    e331: 'sodium citrate', e339: 'sodium phosphate', e341: 'calcium phosphate', e407: 'carrageenan', e412: 'guar gum',
    e415: 'xanthan gum', e440: 'pectin', e450: 'diphosphates', e460: 'cellulose', e466: 'cellulose gum',
    e471: 'mono- and diglycerides', e472e: 'DATEM', e481: 'sodium stearoyl lactylate', e500: 'sodium carbonates',
    e500ii: 'baking soda', e509: 'calcium chloride', e551: 'silicon dioxide', e621: 'MSG', e627: 'disodium guanylate',
    e631: 'disodium inosinate', e950: 'acesulfame K', e951: 'aspartame', e955: 'sucralose', e1422: 'modified starch' };
  function mAdditive(tag) {
    var t = String(tag || '').replace(/^[a-z]{2}:/, '').toLowerCase();
    return ADDITIVE[t] || ADDITIVE[t.replace(/^(e\d+)[a-z]*$/, '$1')] || t.toUpperCase();
  }

  /* What a failed lookup says, in one place. It was written out three times
     — the picker's search, the barcode scan and the new-food form — and the
     copies had drifted: the scan called every failure "not in Open Food
     Facts", including no signal at all, which sent people to type in a
     product the database did have. `code` is the barcode, when there is one. */
  function mLookSay(err, code) {
    var why = err && err.message;
    if (why === 'nokey') return 'No USDA key in src/config.js, so only barcodes can be looked up.';
    if (why === 'toofast') return (code ? 'Open Food Facts is asking us to slow down.' : 'Asked too often just now.') +
      ' Wait a minute, or type it in below.';
    if (why === 'nonutrition') return (code ? code + ' is in Open Food Facts, but' : 'That one is known, but') +
      ' with no nutrition table yet. Read it off the packet below.';
    if (why === 'nowhere') return (code || 'That') + ' is not in Open Food Facts or the USDA\u2019s packaged foods. Type what it was below.';
    if (why === 'none') return (code || 'That') + ' is not in Open Food Facts. Type what it was below.';
    return (code ? 'Open Food Facts' : 'The USDA') + ' did not answer. Type it in below, or try again.';
  }

  function mLookupRows(list) {
    if (!list.length) return '<div class="mslot-empty">Nothing came back.</div>';
    var k = list.clash;
    return (k ? '<div class="mlook-clash" role="note"><b>Two different answers for this barcode.</b> ' +
        'Open Food Facts says ' + k.off + ' kcal per 100 g; the USDA\u2019s packaged foods, from the maker\u2019s label, say ' +
        k.usda + '.' + (k.flagged ? ' Open Food Facts\u2019 own checks fault its figures.' : '') +
        ' Pick the one that matches the packet in your hand.</div>' : '') +
      list.map(function (x, i) {
      LIVE.MLOOKUP[i] = x;
      /* The same row as the app's own foods (src/pickrow.js, mpRowHTML):
         a + in a circle, the name, then grams first and the kitchen's word
         for it, the calories and the coloured P, F and C, and the salt only
         when it passes the same 800 mg the recipes flag. Where it comes from
         is a word in front, the way "Recipe" and "Yours" are. Blake, on
         2026-10-07, searching "bread": the USDA's rows "popped up in a
         different way than the rest of the foods on the list". They had
         their own layout, tags and a chevron; now only the word differs, and
         a tap opens the label to say how much rather than adding at once. */
      var z = x.sizes && x.sizes[0];
      var amt = z && z.g ? Math.round(z.g) + ' g' + (/^\d+(?:[.,]\d+)?\s*g$/.test(z.t) ? '' : ' &middot; ' + esc(z.t))
        : esc(x.unit);
      var cell = function (v, m, lb) { return '<span class="mgc">' + v + '<i class="mb-' + m + '">' + lb + '</i></span>'; };
      var na = typeof x.na === 'number' ? x.na : 0;
      return '<div class="mpick-wrap">' +
        '<button class="mpick-row" data-nfpick="' + i + '">' +
          '<span class="mp-tick" aria-hidden="true">&#43;</span>' +
          '<span class="mp-body"><span class="mp-name">' + esc(x.name) + '</span>' +
            '<span class="mp-fit"><span class="mp-src">' + (/^Open Food Facts/.test(x.src || '') ? 'Open Food Facts' : 'USDA') +
              '</span> ' + amt + ' &middot; ' + x.kcal + ' kcal &middot; ' + cell(x.p, 'p', 'P') + ' &middot; ' +
              cell(x.f, 'f', 'F') + ' &middot; ' + cell(x.c, 'c', 'C') +
              (na >= 800 ? ' <span class="mp-salt">' + na.toLocaleString() + ' mg salt</span>' : '') + '</span>' +
          '</span>' +
        '</button><span class="mp-side no-print"></span></div>';
    }).join('');
  }

  /* One request per word you finish typing, not one per keystroke.
   *
     600ms because it has to outlast the gap between two letters typed by a
     thumb and not feel like a pause. The query is re-read when the timer
     fires rather than captured when it is set, so backspacing to something
     shorter than three characters cancels the request that was in flight for
     the longer one. */
  var mpLookTimer = null;
  function mpLookSoon() {
    if (mpLookTimer) clearTimeout(mpLookTimer);
    mpLookTimer = setTimeout(function () {
      mpLookTimer = null;
      if (!S.macroPick) return;                    // the sheet closed under it
      var q = (S.mpQuery || '').trim();
      if (q.length < 3 || mQueryKind(q).k === 'barcode') return;
      if (!$('nfResults')) return;                 // nothing on screen wants it
      mLookNet(q);
    }, 600);
  }

  function mLookNet(term) {
    var mine = ++LIVE.mLookSeq;
    var res = $('nfResults');
    if (!res) return;
    /* Said by name, as the rows are tagged: "the food tables" told nobody
       whose tables, or that they are not the app's own (Blake picked the
       search list in mockup I, 2026-10-07). */
    res.innerHTML = '<div class="mt-div">From the USDA</div><div class="mslot-empty">Asking the USDA&hellip;</div>';
    LIVE.MLOOKUP = {};
    mFoodSearch(term, false).then(function (list) {
      if (mine !== LIVE.mLookSeq || !$('nfResults')) return;
      $('nfResults').innerHTML = list.length
        ? '<div class="mt-div">From the USDA</div>' + mLookupRows(list) : '';
    }, function (err) {
      if (mine !== LIVE.mLookSeq || !$('nfResults')) return;
      $('nfResults').innerHTML = '<div class="mslot-empty">' + esc(mLookSay(err)) + '</div>' +
        /* The one place a tap is still the right answer: the network failed
           and only you know whether it is worth asking again. */
        (err && err.message === 'nokey' ? ''
          : '<button class="mpick-row mpick-new" data-mplook="' + esc(term) +
            '"><span class="mp-body"><span class="mp-name">Ask the USDA again' +
            '</span></span></button>');
    });
  }

  return { mBarcodeLookup: mBarcodeLookup, mLookSay: mLookSay, mLookupRows: mLookupRows, mpLookSoon: mpLookSoon, mLookNet: mLookNet };
};
