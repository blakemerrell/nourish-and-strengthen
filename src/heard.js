/* A meal said in one breath, in the picker's box: "two eggs, toast with
 * butter, coffee with half and half" read as the foods it names, each with
 * the amount it heard (mHeard), and the band that shows them above the list,
 * with − and + on each, a choice where a word could be more than one food,
 * and the three ways on: add them all, keep them as one food, or save them
 * as a recipe (mHeardHTML). The longer account is with the code.
 *
 * A part of app.js (Nourish) in a file of its own. app.js calls
 * HiveParts.heard(app) once, as it starts, and keeps what it gives back
 * under the same names. The foods by id (BY_ID) and what you already reach
 * for (MP_KNOWN) are replaced as they change, so the part reads them through
 * LIVE (tests/scope.test.js holds the lists to each other). Loaded before
 * app.js.
 *
 * Why it is here (Blake, 2026-11-06, mockup
 * https://claude.ai/artifact/RwSruTSHpsPMeTWDVrByZV): logging three foods
 * was three searches. Said into the box with the keyboard's own microphone
 * (the phone's dictation, which works with no signal and sends nothing
 * anywhere new), a meal is one sentence. Nothing is added until a button is
 * pressed, and every line says what it heard, because a guess made quietly
 * is worse than a search.
 */
(window.HiveParts = window.HiveParts || {}).heard = function (app) {
  'use strict';

  // what it reads of the app's, and (LIVE) what the app replaces as it goes: BY_ID, MP_KNOWN
  var S = app.S;
  var fmtNum = app.fmtNum;
  var mMacLine = app.mMacLine;
  var mReadSlots = app.mReadSlots;
  var searchScore = app.searchScore;
  var LIVE = app.LIVE;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* Words for a number, the way a number is said rather than typed. */
  var WORDN = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
    nine: 9, ten: 10, twelve: 12, half: 0.5, couple: 2, few: 3, dozen: 12 };
  /* Units as said, to the units the food table measures in. A slice, a
     piece and a large one are each one of the thing. */
  var UNITS = { cup: 'cup', cups: 'cup', c: 'cup', tbsp: 'tbsp', tbs: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp',
    tsp: 'tsp', teaspoon: 'tsp', teaspoons: 'tsp', oz: 'oz', ounce: 'oz', ounces: 'oz', lb: 'lb', lbs: 'lb',
    pound: 'lb', pounds: 'lb', g: 'g', gram: 'g', grams: 'g', slice: 'each', slices: 'each', piece: 'each',
    pieces: 'each', whole: 'each', each: 'each', large: 'each', medium: 'each', small: 'each', bar: 'each', bars: 'each',
    scoop: 'scoop', scoops: 'scoop', can: 'can', cans: 'can', serving: 'serving', servings: 'serving' };
  /* Amounts nobody measures. Each is read as one plain measure, and the line
     says so, so "a splash" that was really a pour can be put right with +. */
  var VAGUE = { splash: [1, 'tbsp'], drizzle: [0.5, 'tbsp'], dollop: [2, 'tbsp'], spoonful: [1, 'tbsp'],
    pat: [1, 'tsp'], handful: [1, 'oz'], glass: [1, 'cup'], mug: [1, 'cup'], bowl: [1, 'cup'] };
  /* Words that say how a food was made or how much was felt about it, not
     which food it is. "Cooked" stays: cooked rice and dry rice are two
     foods, a cup apart by a factor of three. */
  var SKIP = { of: 1, the: 1, some: 1, my: 1, little: 1, bit: 1, i: 1, had: 1, ate: 1, have: 1, just: 1,
    scrambled: 1, fried: 1, poached: 1, boiled: 1, hard: 1, soft: 1, over: 1, easy: 1, sunny: 1, side: 1, up: 1 };
  /* A few things are said by a name no food in the table carries. */
  var SAID = [[/\bhalfnhalf\b/g, 'half and half'], [/\btoast\b/g, 'bread'], [/\boatmeal\b/g, 'oats'], [/\bpb\b/g, 'peanut butter'], [/\boj\b/g, 'orange juice']];
  /* How far − and + move each kind of amount. */
  var STEP = { cup: 0.25, g: 10 };

  /* A sentence is two or more foods, split where people join foods: commas,
     "and", "with", "plus". A name that has one of those joins in it (half and
     half, a recipe called "Chicken with rice") is kept whole: it is found
     among the names first and held together before the split. */
  function mHeardSplit(q) {
    var t = ' ' + String(q || '').toLowerCase().replace(/&/g, ' and ').replace(/[.!?]/g, ' ').replace(/\s+/g, ' ') + ' ';
    var keep = [/half and half/g];
    var seen = {};
    Object.keys(LIVE.BY_ID).forEach(function (id) {
      var r = LIVE.BY_ID[id];
      if (!r || !r.name || seen[r.name]) return;
      seen[r.name] = 1;
      var n = r.name.toLowerCase().replace(/&/g, ' and ').replace(/\s+/g, ' ').trim();
      if (/ (and|with|plus) /.test(n) && t.indexOf(' ' + n + ' ') >= 0) keep.push(n);
    });
    keep.forEach(function (k) {
      t = t.replace(k, function (m) { return m.replace(/ /g, '_'); });
    });
    return t.split(/,|;|\n|\band\b|\bwith\b|\bplus\b|\bthen\b/).map(function (c) {
      return c.replace(/_/g, ' ').trim();
    }).filter(function (c) { return c.length; });
  }

  /* One part: its amount, its unit, and the words left for the food. */
  function mHeardPart(raw) {
    var qty = null, unit = null, note = '', vague = null;
    /* "Half and half" is a cream, not a half of anything: held as one word
       before "half a" is read as an amount. */
    var ws = raw.replace(/half and half/g, 'halfnhalf').replace(/\bhalf an?\b|\ban? half\b/g, ' ½ ')
      .split(/\s+/).filter(Boolean);
    var food = [];
    ws.forEach(function (w, i) {
      var n = null;
      if (/^\d+(\.\d+)?$/.test(w)) n = parseFloat(w);
      else if (/^\d+\/\d+$/.test(w)) n = Number(w.split('/')[0]) / Number(w.split('/')[1]);
      else if (w === '½') n = 0.5;
      else if (w === '¼') n = 0.25;
      else if (WORDN[w] !== undefined && qty === null && food.length === 0) n = WORDN[w];
      if (n !== null && qty === null) { qty = n; return; }
      if (!unit && VAGUE[w]) { vague = w; unit = VAGUE[w][1]; return; }
      if (!unit && UNITS[w] && (qty !== null || i < 2 || w === 'whole')) { unit = UNITS[w]; return; }
      if (SKIP[w]) return;
      food.push(w);
    });
    if (vague) {
      if (qty === null || qty === 1) qty = VAGUE[vague][0];
      note = 'a ' + vague + ' read as ' + fmtNum(VAGUE[vague][0]) + ' ' + VAGUE[vague][1];
    }
    var words = ' ' + food.join(' ') + ' ';
    // toast is had by the slice, whatever portion bread is offered in
    if (!unit && /\btoast\b/.test(words)) unit = 'each';
    SAID.forEach(function (s) { words = words.replace(s[0], s[1]); });
    return { qty: qty, unit: unit, words: words.trim(), note: note };
  }

  /* The foods a part's words could be, best first. Your own things win a
     tie: what you starred or ate this fortnight (MP_KNOWN), then a single
     food over a dish, a dish over a restaurant's, then the shorter name.
   *
     Two foods in the table are what a recipe buys, not what a plate holds:
     dry rice and the like (key ending _dry). "A cup of rice" said at a meal
     is cooked rice, and dry rice counted for it was 656 kcal where 205 was
     eaten, so those go after everything else that matches. */
  var HALF = /half\s*(&|and|n)\s*half/i;
  function mHeardFind(words) {
    if (!words) return [];
    var out = [], seen = {}, hh = words === 'half and half';
    Object.keys(LIVE.BY_ID).forEach(function (id) {
      var r = LIVE.BY_ID[id];
      if (!r || seen[r.id] || !r.name) return;
      seen[r.id] = 1;
      /* Half and half is one food by name or none: as words it matched every
         dish with "half" in it twice, a restaurant's half side of rice first. */
      if (hh) { if (HALF.test(r.name)) out.push({ r: r, s: 0, known: 0, rank: 0 }); return; }
      var s = searchScore(r.name, words, true);
      if (s < 0) return;
      var rank = /_dry$/.test(String(r.id)) ? 3 : (r.eatout || r.eatoutMenu) ? 2 : r.food ? 0 : 1;
      out.push({ r: r, s: s, known: LIVE.MP_KNOWN && LIVE.MP_KNOWN[r.id] ? 0 : 1, rank: rank });
    });
    out.sort(function (a, b) {
      var ta = Math.floor(a.s / 100), tb = Math.floor(b.s / 100);
      return (a.rank === 3) - (b.rank === 3) || ta - tb || a.known - b.known || a.rank - b.rank ||
        a.s - b.s || a.r.name.length - b.r.name.length;
    });
    return out;
  }

  /* How many of the food's own portion an amount is. A food from the food
     table converts through its grams for that unit; anything else (a recipe,
     a food of your own) is counted in its own servings. */
  function mHeardX(r, qty, unit) {
    var q = qty === null ? 1 : qty;
    var N = window.Nutrition;
    var key = r.food && typeof r.id === 'string' && r.id.indexOf('f:') === 0 && r.id.indexOf('f:my:') !== 0 ? r.id.slice(2) : '';
    var f = key && N && N.FOODS ? N.FOODS[key] : null;
    if (!f || !r.grams) return { x: q, grams: 0, as: unit && unit !== 'serving' && unit !== 'each' ? 'servings' : '' };
    var g = f.g || {}, per;
    if (unit === 'g') per = 1;
    else if (unit === 'oz') per = 28.35;
    else if (unit === 'lb') per = 453.6;
    else if (unit === 'tsp') per = g.tsp || (g.tbsp ? g.tbsp / 3 : g.cup ? g.cup / 48 : undefined);
    else if (unit === 'tbsp') per = g.tbsp || (g.cup ? g.cup / 16 : g.tsp ? g.tsp * 3 : undefined);
    else if (unit === 'cup') per = g.cup || (g.tbsp ? g.tbsp * 16 : undefined);
    else if (unit && g[unit]) per = g[unit];
    else if (unit === 'each') per = g.each;
    /* No unit said: one of the food's own portion, the one the picker
       offers it in (a tablespoon of butter, a slice of bread). The table's
       "each" for butter is the stick, and "butter" said with toast was
       counted as 828 kcal of it. */
    if (!unit || unit === 'serving') return { x: q, grams: q * r.grams, as: '' };
    /* Said in a unit this food is not measured in (a "cup" of eggs): counted
       as that many of its own portion, and the line says so. */
    if (!per) return { x: q, grams: q * r.grams, as: unit && unit !== 'serving' ? 'servings' : '' };
    var grams = q * per;
    return { x: Math.round(grams / r.grams * 100) / 100, grams: grams, as: '' };
  }

  /* The whole sentence read: null unless it names two or more things, so a
     single food searches exactly as it always has. Choices made on the band
     (S.mpHeard) are kept by the part's own words, so typing on past one food
     leaves the ones before it as they were set. */
  function mHeard(q) {
    var parts = mHeardSplit(q);
    /* One thing named is a search, and whatever was chosen on a band for a
       sentence that is gone goes with it. */
    if (parts.length < 2) { S.mpHeard = null; return null; }
    var set = S.mpHeard || (S.mpHeard = { pick: {}, qty: {} });
    var lines = parts.map(function (raw, i) {
      var p = mHeardPart(raw), key = raw;
      var found = mHeardFind(p.words);
      if (!found.length) return { k: key, i: i, raw: raw, unk: true };
      /* The other foods it could as well be, offered as a choice under the
         line: up to two more single foods or dishes the words name as
         plainly. A food named exactly ("eggs" is Eggs) is not asked about;
         "rice" that names no rice exactly asks which. */
      var tier = Math.floor(found[0].s / 100);
      var alts = found.filter(function (o) { return Math.floor(o.s / 100) <= tier && o.rank < 2; })
        .slice(0, 3).map(function (o) { return o.r; });
      var r = (set.pick[key] && LIVE.BY_ID[set.pick[key]]) || found[0].r;
      if (alts.length < 2) alts = [];
      else if (alts.indexOf(r) < 0) alts[alts.length - 1] = r;
      var qty = set.qty[key] !== undefined ? set.qty[key] : p.qty;
      var amt = mHeardX(r, qty, p.unit);
      var note = p.note || (p.qty === null && set.qty[key] === undefined ? 'no amount heard, so 1' : '') ||
        (amt.as ? 'read as ' + fmtNum(qty === null ? 1 : qty) + ' of its servings' : '');
      return { k: key, i: i, raw: raw, r: r, qty: qty === null ? 1 : qty, unit: p.unit, x: amt.x, grams: amt.grams, alts: alts, note: note };
    });
    return { lines: lines, known: lines.filter(function (l) { return !l.unk; }) };
  }

  function mHeardTotals(H) {
    var t = { kcal: 0, p: 0, f: 0, c: 0, na: 0, fib: 0 };
    H.known.forEach(function (l) {
      var m = l.r.macro || {};
      Object.keys(t).forEach(function (k) { t[k] += (m[k] || 0) * l.x; });
    });
    return t;
  }

  /* What each line says it is: the amount in the words it was said in, then
     the grams where the food table knows them. */
  function mHeardAmt(l) {
    var u = l.unit && l.unit !== 'each' && l.unit !== 'serving' ? ' ' + l.unit
      : !l.unit && l.r.food && l.r.unit && l.r.unit !== 'each' ? ' ' + l.r.unit : '';
    return fmtNum(l.qty) + u + (l.grams ? ' · ' + Math.round(l.grams) + ' g' : '');
  }

  /* A line as an ingredient, for a recipe saved from the band: what was
     said, the food's name, and its weight where it is known, the way a
     recipe card writes it ("2 Eggs (100 g)", "1 tbsp Butter (14 g)"). */
  function mHeardIng(l) {
    var u = l.unit && l.unit !== 'each' && l.unit !== 'serving' ? ' ' + l.unit
      : !l.unit && l.r.food && l.r.unit && l.r.unit !== 'each' ? ' ' + l.r.unit : '';
    return fmtNum(l.qty) + u + ' ' + l.r.name + (l.grams ? ' (' + Math.round(l.grams) + ' g)' : '');
  }

  /* The band, above the list, the way a recipe number's band is: it does not
     take the list away, because the sentence may have been meant as a name. */
  function mHeardHTML(q) {
    var H = mHeard(q);
    if (!H) return '';
    var set = S.mpHeard, t = mHeardTotals(H), n = H.known.length;
    var slots = mReadSlots(), sk = S.macroPick && S.macroPick.slot, meal = 'this meal';
    slots.list.forEach(function (s) { if (s.k === sk) meal = s.n; });
    var h = '<div class="mt-div mh-head">Heard ' + n + ' food' + (n === 1 ? '' : 's') +
      (n ? '<span class="mh-tot num">' + Math.round(t.kcal) + ' kcal · ' + Math.round(t.p) + 'P</span>' : '') + '</div>' +
      '<div class="mh-box" id="mpHeard">';
    H.lines.forEach(function (l) {
      if (l.unk) {
        h += '<div class="mh-row mh-unk"><span class="mh-name">“' + esc(l.raw) + '”' +
          '<small>Not one of the foods here. Search it on its own to find it, or add it.</small></span>' +
          '<button class="mh-find" data-mhfind="' + esc(l.raw) + '">Search it</button></div>';
        return;
      }
      h += '<div class="mh-row"><span class="mh-name">' + esc(l.r.name) +
          '<small class="num">' + mHeardAmt(l) + ' · ' + mMacLine(l.r, l.x) + (l.note ? ' · ' + esc(l.note) : '') + '</small></span>' +
        '<span class="mh-step"><button data-mhq="' + esc(l.k) + '" data-mhd="-1" aria-label="Less ' + esc(l.r.name) + '">−</button>' +
          '<button data-mhq="' + esc(l.k) + '" data-mhd="1" aria-label="More ' + esc(l.r.name) + '">+</button></span></div>';
      if (l.alts.length) {
        h += '<div class="mh-alts" role="group" aria-label="Which ' + esc(l.raw) + '?">' + l.alts.map(function (r) {
          return '<button class="mh-alt" data-mhpick="' + esc(l.k) + '" data-mhid="' + esc(String(r.id)) + '" aria-pressed="' + (r === l.r) + '">' + esc(r.name) + '</button>';
        }).join('') + '</div>';
      }
    });
    if (n) {
      var sv = set.serves || 1;
      h += '<div class="mh-acts">' +
        '<button class="btn-primary mh-all" data-mhdo="all">Add ' + (n === 1 ? 'it' : 'all ' + n) + ' to ' + esc(meal) + '</button>' +
        '<div class="mh-two"><button class="ghost" data-mhdo="keep">Keep as one food</button>' +
        '<button class="ghost" data-mhdo="recipe" aria-pressed="' + (set.mode === 'recipe') + '">Save as a recipe</button></div>';
      if (set.mode === 'recipe') {
        h += '<div class="mh-form"><div class="mh-serve"><span><b>Makes</b> ' + sv + ' serving' + (sv === 1 ? '' : 's') + '</span>' +
          '<span class="mh-step"><button data-mhserve="-1" aria-label="Fewer servings">−</button>' +
          '<button data-mhserve="1" aria-label="More servings">+</button></span></div>' +
          '<p class="num">One serving: ' + Math.round(t.kcal / sv) + ' kcal · ' + Math.round(t.p / sv) + 'P · ' +
            Math.round(t.f / sv) + 'F · ' + Math.round(t.c / sv) + 'C. It opens in the recipe editor to name and finish, ' +
            'then one serving goes on ' + esc(meal) + '.</p>' +
          '<button class="btn-primary" data-mhdo="recipego">Name it and save</button></div>';
      }
      h += '</div>';
    }
    return h + '</div>';
  }

  return { mHeard: mHeard, mHeardHTML: mHeardHTML, mHeardTotals: mHeardTotals, mHeardIng: mHeardIng };
};
