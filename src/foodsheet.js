/* The food sheet, opened from a plate: what one of it is, the parts of a
 * meal kept together, and an amount in any unit the table weighs the food
 * in, with its nutrients and an Add (mFoodSheetHTML, mFsAmt, mFsState,
 * mFsRefresh); and, for a food of your own, its numbers fixed from the
 * label in your hand (mFoodFixHTML, mFsFixRefresh, mFsFixRead). The longer
 * account is with the code.
 *
 * A part of app.js (Nourish) in a file of its own. app.js calls
 * HiveParts.foodsheet(app) once, as it starts, and keeps what it gives back
 * under the same names. The recipes by id (BY_ID) are read through LIVE
 * (tests/scope.test.js holds the lists to each other). Loaded before
 * app.js.
 */
(window.HiveParts = window.HiveParts || {}).foodsheet = function (app) {
  'use strict';

  // what it reads of the app's, and (LIVE) what the app replaces as it goes: BY_ID
  var S = app.S;
  var fixUnit = app.fixUnit;
  var fmtNum = app.fmtNum;
  var mByGram = app.mByGram;
  var mDialUnit = app.mDialUnit;
  var mMacLine = app.mMacLine;
  var mNextMeal = app.mNextMeal;
  var mPortionText = app.mPortionText;
  var mReadSlots = app.mReadSlots;
  var mSlotName = app.mSlotName;
  var mpLastXs = app.mpLastXs;
  var LIVE = app.LIVE;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function $(id) { return document.getElementById(id); }

  /* ---- the food sheet: an amount, and Add
   *
     Blake: "An amount/unit box and an Add button on the food detail screen,
     plus fibre/sodium and any other nutrients the table has." The amount
     starts where every add starts (what you logged last time, else one of
     it) and can be said in any unit the table weighs the food in; the Add
     goes to the meal the plate was on, or to the meal you choose. */
  /* How much of a measure one x of a food is, when its unit is itself a
     measure: "100 g", which is how the USDA and Open Food Facts hand over a
     food with no household measure, and "100 mL", which is how they hand
     over a drink. It carries no grams of its own, so this page offered it in
     "× 100 g" servings, where 50 typed meant five kilos; the millilitres
     went on being offered that way until 2026-10-11, when a scanned
     chocolate milk asked "5.4 × 100 mL" of Blake for what he knew as 540 mL.
     The meal's sheet reads the same unit the same way (mLabelServing,
     src/portion.js). */
  function mFsBase(r) {
    var m = r && r.food && !r.grams && /^\s*(\d+(?:\.\d+)?)\s*(g|grams?|ml|millilit(?:er|re)s?)\s*$/i.exec(String(r.unit || ''));
    if (!m || !(Number(m[1]) > 0)) return null;
    return { n: Number(m[1]), u: /^g/i.test(m[2]) ? 'g' : 'mL' };
  }
  function mFsPer(r) { var b = mFsBase(r); return r.grams || (b ? b.n : 0); }
  // the label's own serving, once a fix has said what it is: "can (325 mL)"
  function mFsSzWord(sz, u) { return String(sz.t).replace(/^\s*1\s+/, '') + ' (' + fmtNum(sz.n) + ' ' + u + ')'; }
  function mFsUnits(r) {
    var base = mFsBase(r);
    if (base) {
      var bu = [{ u: base.u, g: 1 }];
      if (r.sz && r.sz.n > 0 && r.sz.t) bu.push({ u: mFsSzWord(r.sz, base.u), g: r.sz.n });
      return bu;
    }
    if (!r.food || !r.grams) return [{ u: mDialUnit(r), g: 0 }];
    var key = String(r.id).slice(2), N = window.Nutrition;
    var f = N && N.FOODS && N.FOODS[key];
    var own = { u: r.unit === 'each' ? 'whole' : String(r.unit), g: r.grams };
    var out = mByGram(r) ? [{ u: 'g', g: 1 }, own] : [own, { u: 'g', g: 1 }];
    if (r.unit === 'g') out = [{ u: 'g', g: 1 }];
    Object.keys((f && f.g) || {}).forEach(function (u) {
      var w = u === 'each' ? 'whole' : u;
      if (!(f.g[u] > 0) || out.some(function (o) { return o.u === w; })) return;
      out.push({ u: w, g: f.g[u] });
    });
    return out;
  }
  function mFsX(r, amt, unit) {
    var n = Number(amt);
    if (!isFinite(n) || n <= 0) return null;
    var per = mFsPer(r);
    var x = unit && unit.g && per ? n * unit.g / per : n;
    return Math.round(x * 10000) / 10000;
  }
  function mFsAmt(r, x, unit) {
    var per = mFsPer(r);
    var n = unit && unit.g && per ? x * per / unit.g : x;
    return unit && (unit.u === 'g' || unit.u === 'mL') ? Math.round(n) : Math.round(n * 100) / 100;
  }
  /* The amount in the box, as a grid of two columns: the four the day
     counts first and heavier, then the rest of a label, wherever a scan or a
     search kept it on the food (`lab`, app.js). It was a Nutrition Facts
     panel in the packet's own order (mockup F, 2026-10-07), a screen tall
     with the % Daily Values; Blake, on the scan-fix mockup, 2026-10-11:
     "this whole think is really hard to use, make this a lot more compact
     please". The cells keep .mfs-nr, which is what the tests reach for. */
  var FS_ROWS = [['kcal', 'Calories', ''], ['p', 'Protein', 'g'], ['f', 'Fat', 'g'], ['c', 'Carbs', 'g'],
    ['na', 'Sodium', 'mg'], ['fib', 'Fiber', 'g'], ['sug', 'Sugars', 'g'], ['sat', 'Sat. fat', 'g'],
    ['chol', 'Cholesterol', 'mg'], ['ca', 'Calcium', 'mg'], ['fe', 'Iron', 'mg'], ['k', 'Potassium', 'mg']];
  // grams to a tenth under ten ("0.8 g", "33 g"); iron the same; other milligrams and calories whole
  function mFsShow(k, unit, n) {
    if ((unit === 'g' || k === 'fe') && n < 10) return String(Math.round(n * 10) / 10);
    return Math.round(n).toLocaleString();
  }
  function mFsNutrHTML(r, x) {
    var mac = r.macro || {}, lab = r.lab || {};
    var cells = FS_ROWS.map(function (row, i) {
      var k = row[0];
      var v = Object.prototype.hasOwnProperty.call(mac, k) ? mac[k] : lab[k];
      if (typeof v !== 'number') return '';
      return '<div class="mfs-nr' + (i < 4 ? ' key' : '') + '"><span>' + row[1] + '</span>' +
        '<b>' + mFsShow(k, row[2], (Number(v) || 0) * x) + (row[2] ? ' ' + row[2] : '') + '</b></div>';
    }).join('');
    return '<div class="mfs-grid" role="group" aria-label="What ' + esc(mPortionText(r, x)) + ' holds">' + cells + '</div>';
  }
  function mFsState(r) {
    var o = S.foodOpen, units = mFsUnits(r);
    var ui = Math.min(units.length - 1, Math.max(0, Number(o.u) || 0));
    var amt = o.amt !== undefined ? o.amt : mFsAmt(r, mpLastXs()[r.id] || 1, units[ui]);
    return { units: units, ui: ui, amt: amt, x: mFsX(r, amt, units[ui]) };
  }
  // the numbers under the box, as it is typed in
  function mFsRefresh() {
    var o = S.foodOpen, r = o && LIVE.BY_ID[o.id], box = $('mfsAmt');
    if (!r || !box) return;
    o.amt = box.value;
    o.u = Number(($('mfsUnit') || {}).value) || 0;
    var st = mFsState(r), now = $('mfsNow'), go = $('mfsAdd');
    if (now) now.innerHTML = st.x ? mFsNutrHTML(r, st.x) : '<div class="mslot-empty">Type how much.</div>';
    if (go) go.disabled = !st.x;
  }

  /* A food, opened from its plate. Recipes have a sheet with steps in it;
     a food has nothing to cook, so this is the sheet that answers the two
     things a plate cannot: what one of it is (a cup, 130 grams), and for a
     meal you kept together, the parts it was made of and what each brought.
     The totals are at the plate's own portion, so they match the row that
     was pressed rather than a nominal "one". Compact since 2026-10-11: what
     it is and where it came from on one line, the plate on one, the amount
     and its Add on one, and the label as a grid (mFsNutrHTML). */
  function mFoodSheetHTML() {
    var o = S.foodOpen || {}, r = LIVE.BY_ID[o.id];
    if (!r) return '';
    if (o.fix) return mFoodFixHTML(r);
    var x = o.x > 0 ? o.x : 1;
    var parts = r.parts || [];
    var partRows = parts.map(function (pt) {
      /* Each part at the portion it was kept at, scaled by how much of the
         plate is on the day. The part's own record may be gone (a table
         food renamed, an own food deleted), so the macro line is only drawn
         when it can still be worked out. */
      var pr = LIVE.BY_ID[pt.id];
      var px = (Number(pt.x) || 1) * x;
      var amount = pt.unit === 'each' ? fmtNum(px) + ' whole'
        : fmtNum(px) + ' ' + fixUnit(String(pt.unit || 'serving'), px);
      return '<div class="mfs-p">' +
        '<span class="mfs-pn">' + esc(pt.name) + '</span>' +
        '<span class="mfs-px">' + esc(amount) + '</span>' +
        (pr ? '<span class="mfs-pm">' + mMacLine(pr, px) + '</span>' : '') +
      '</div>';
    }).join('');
    /* What the packet declared, and its two grades, kept from the scan that
       made the food (src/camera.js), said once as whose list it is. */
    var tags = [];
    if (r.alg && r.alg.length) tags.push('<span class="mfs-alg"><b>Contains</b> ' + esc(r.alg.join(', ')) + '</span>');
    if (r.ns || r.nova) {
      tags.push('<span class="mfs-alg">' + [r.ns ? 'Nutri-Score <b>' + r.ns.toUpperCase() + '</b>' : '',
        r.nova ? '<b>' + ['', 'Unprocessed', 'Culinary ingredient', 'Processed', 'Ultra-processed'][r.nova] +
          '</b> (NOVA ' + r.nova + ')' : ''].filter(Boolean).join(' &middot; ') + '</span>');
    }
    /* Only a food of your own can be fixed: the book's are the book's, and a
       kept meal's numbers are its parts'. */
    var mine = /^f:my:/.test(String(r.id)) && !parts.length;
    return '<div class="scrim no-print" data-close="1">' +
      '<div class="sheet mt-sheet mfs-sheet" role="dialog" aria-modal="true" aria-label="' + esc(r.name) + '">' +
        '<div class="sheet-top">' +
          '<div class="sheet-eyebrow">' + ((r.eatout || r.eatoutMenu) ? esc(r.spot || 'Eating out') : parts.length ? 'A meal you kept' : 'A food') + '</div>' +
          '<button class="sheet-x" data-close="1" aria-label="Close">&times;</button>' +
        '</div>' +
        '<div class="mfs-name">' + esc(r.name) + '</div>' +
        '<div class="mfs-meta"><span class="mfs-one">One of it: ' + esc(mPortionText(r, 1)) + '</span>' +
          (tags.length ? ' &middot; ' + tags.join(' &middot; ') + ' &middot; <span class="mfs-src">Open Food Facts</span>' : '') +
        '</div>' +
        (mine ? '<button class="mfs-fix" data-mffix="1">Numbers look wrong? <b>Fix them from the label</b></button>' : '') +
        (partRows ? '<div class="mt-div">What went in</div><div class="mfs-parts">' + partRows + '</div>' : '') +
        (o.onPlate === false ? '' :
          '<div class="mfs-plate"><span class="mfs-k">On your plate &middot; ' + esc(mPortionText(r, x)) + '</span>' +
            '<span class="mk-tot">' + mMacLine(r, x) + '</span></div>') +
        mFsAddHTML(r) +
      '</div></div>';
  }
  function mFsAddHTML(r) {
    var o = S.foodOpen, st = mFsState(r);
    var slots = mReadSlots().list;
    // the plate's own meal when it is still on the plan; otherwise, choose
    var own = !!o.slot && slots.some(function (sl) { return sl.k === o.slot; });
    var sk = own ? o.slot : (o.pick || (mNextMeal() || {}).k || '');
    return (own ? '' : '<div class="mp-meals mfs-meals" role="group" aria-label="Which meal">' + slots.map(function (sl) {
        return '<button data-mfsmeal="' + esc(sl.k) + '" aria-pressed="' + (sl.k === sk) + '">' + esc(sl.n) + '</button>';
      }).join('') + '</div>') +
      '<div class="mfs-amt">' +
        '<input id="mfsAmt" type="text" inputmode="decimal" autocomplete="off" aria-label="Amount" value="' +
          esc(String(st.amt)) + '">' +
        (st.units.length > 1
          ? '<select id="mfsUnit" aria-label="Unit">' + st.units.map(function (u, i) {
              return '<option value="' + i + '"' + (i === st.ui ? ' selected' : '') + '>' + esc(u.u) + '</option>';
            }).join('') + '</select>'
          : '<span class="mfs-u">' + esc(st.units[0].u) + '</span>') +
        '<button class="btn-primary" id="mfsAdd" data-mfsadd="' + esc(sk) + '"' + (st.x ? '' : ' disabled') + '>' +
          'Add to ' + esc(mSlotName(sk)) + '</button>' +
      '</div>' +
      '<div class="mfs-nutr" id="mfsNow">' + (st.x ? mFsNutrHTML(r, st.x) : '<div class="mslot-empty">Type how much.</div>') + '</div>';
  }

  /* ---- fixing a food's numbers from its label
   *
     Blake scanned a can of chocolate milk (2026-10-11) and the day said 540
     mL of it was 43 kcal and 11 g of protein; the can says 90 kcal and 20 g
     for 325 mL. Open Food Facts had the figures per fluid ounce filed as per
     100 mL, and nothing in the app could be changed once a food was saved
     but its name. He chose "let me correct a scan": the label typed as it is
     printed, for the serving it prints, and kept for next time.
   *
     The serving is said in the food's own measure when it has one (a food
     kept "per 100 mL" is fixed from "1 can = 325 mL") and the numbers are
     put back over the food's own unit, so every plate already on a day keeps
     its amount and only what one of it is worth changes. A food whose unit
     is a thing (a tamale, a serving) is fixed per one of it. */
  var FIX_BOX = [['Kcal', 'kcal', 'Calories', '', 1], ['P', 'p', 'Protein', 'g', 1], ['F', 'f', 'Fat', 'g', 1],
    ['C', 'c', 'Carbs', 'g', 1], ['Fib', 'fib', 'Fiber', 'g'], ['Sug', 'sug', 'Sugars', 'g'],
    ['Na', 'na', 'Sodium', 'mg'], ['Sat', 'sat', 'Sat. fat', 'g'], ['Chol', 'chol', 'Cholesterol', 'mg'],
    ['Ca', 'ca', 'Calcium', 'mg'], ['Fe', 'fe', 'Iron', 'mg'], ['K', 'k', 'Potassium', 'mg']];
  // what one of the food's units holds, as the form fills its boxes from it
  function mFsFixHas(r, k) {
    var mac = r.macro || {}, lab = r.lab || {};
    if (/^(kcal|p|f|c|na|fib)$/.test(k)) return Number(mac[k]) || 0;
    return typeof lab[k] === 'number' ? lab[k] : null;
  }
  function mFoodFixHTML(r) {
    var base = mFsBase(r), sz = r.sz && r.sz.n > 0 ? r.sz : null;
    var servN = base ? (sz ? sz.n : base.n) : 1;
    var scale = base ? servN / base.n : 1;
    var box = function (b) {
      var v = mFsFixHas(r, b[1]);
      var shown = v === null ? '' : b[3] === 'g' || b[1] === 'fe' ? String(Math.round(v * scale * 10) / 10) : String(Math.round(v * scale));
      return '<label class="mff-in' + (b[4] ? ' key' : '') + '" for="mff' + b[0] + '"><span>' + b[2] + '</span>' +
        '<span class="mff-iw' + (b[3] ? '' : ' nu') + '"><input type="number" id="mff' + b[0] + '" min="0" max="99999" step="any" ' +
          'inputmode="decimal" value="' + esc(shown) + '">' + (b[3] ? '<em>' + b[3] + '</em>' : '') + '</span></label>';
    };
    return '<div class="scrim no-print" data-close="1">' +
      '<div class="sheet mt-sheet mfs-sheet mff-sheet" role="dialog" aria-modal="true" aria-label="Fix the numbers for ' + esc(r.name) + '">' +
        '<div class="sheet-top">' +
          '<div class="sheet-eyebrow">Fix the numbers</div>' +
          '<button class="sheet-x" data-mffno="1" aria-label="Back to the food">&times;</button>' +
        '</div>' +
        '<div class="mfs-name">' + esc(r.name) + '</div>' +
        '<div class="mfs-meta">Type the label as printed, for its serving.</div>' +
        (base
          ? '<div class="mff-serv"><label for="mffServ">Serving</label>' +
              '<input type="text" id="mffServ" autocomplete="off" placeholder="1 can" aria-label="The serving, as the label says it" value="' +
                esc(sz ? sz.t : '') + '"><span>=</span>' +
              '<input type="number" id="mffN" min="0" step="any" inputmode="decimal" aria-label="How many ' + base.u + ' that is" value="' +
                esc(String(servN)) + '"><em>' + base.u + '</em></div>'
          : '<div class="mff-serv"><span class="mff-sl">Serving</span><b>' + esc(mPortionText(r, 1)) + '</b></div>') +
        '<div class="mff-form">' + FIX_BOX.map(box).join('') + '</div>' +
        '<label class="mff-code" for="mffCode"><span>Barcode</span>' +
          '<input type="text" id="mffCode" inputmode="numeric" autocomplete="off" placeholder="optional" value="' + esc(r.code || '') + '"></label>' +
        // filled once the boxes are on the page (mFsFixRefresh, from renderModal): it reads them
        '<div class="mff-what" id="mffWhat" aria-live="polite"></div>' +
        '<div class="mt-cap" id="mffNote"></div>' +
        '<div class="mff-go"><button class="btn-primary" data-mffsave="1">Save the fix</button>' +
          '<button class="ghost" data-mffno="1">Cancel</button></div>' +
      '</div></div>';
  }
  /* What the boxes say, put over the food's own unit: per unit, ready to
     save, or a reason it cannot be. Kept to four figures, so a food kept
     per millilitre does not lose its protein to rounding (0.0615 g a mL is
     33 g in a 540 mL glass; 0.1 would be 54 g), which is what the whole
     grams the form used to keep did to every small unit. */
  function mFsFixRead(r) {
    var base = mFsBase(r), val = function (id) { return String((($(id) || {}).value) || '').trim(); };
    var servN = base ? Number(val('mffN')) : 1;
    if (base && !(servN > 0)) return { err: 'Say how many ' + base.u + ' the label’s serving is.' };
    var factor = base ? base.n / servN : 1;
    var sig = function (v) { return v ? Number(v.toPrecision(4)) : 0; };
    var per = {}, bad = '';
    FIX_BOX.forEach(function (b) {
      var t = val('mff' + b[0]);
      if (t === '') return;
      var n = Number(t);
      if (!isFinite(n) || n < 0) { bad = bad || b[2]; return; }
      per[b[1]] = sig(n * factor);
    });
    if (bad) return { err: bad + ' needs a number.' };
    var any = per.kcal !== undefined || per.p !== undefined || per.f !== undefined || per.c !== undefined;
    ['p', 'f', 'c'].forEach(function (k) { if (per[k] === undefined) per[k] = 0; });
    if (!any) return { err: 'Give it at least the calories, or it counts for nothing.' };
    var t2 = val('mffServ'), code = val('mffCode').replace(/\D/g, '');
    return { per: per, sz: base ? { t: t2, n: servN } : null, code: code };
  }
  // the day counts calories as four, four and nine, as it does for every food
  function mFsFixKcal(p) { return p.p || p.f || p.c ? 4 * p.p + 4 * p.c + 9 * p.f : (p.kcal || 0); }
  function mFsFixWhatHTML(r) {
    var o = S.foodOpen || {}, got = mFsFixRead(r);
    if (!got || got.err) return '<p>' + esc((got && got.err) || '') + '</p>';
    var p = got.per, k = mFsFixKcal(p), mac = r.macro || {};
    // decimals, not the kitchen's fractions fmtNum draws: "6.2P", never "6 ¼P"
    var t = function (v) { return String(Math.round(v * 10) / 10); };
    var line = function (x) {
      return Math.round(k * x) + ' kcal &middot; ' + t(p.p * x) + 'P &middot; ' + t(p.f * x) + 'F &middot; ' + t(p.c * x) + 'C';
    };
    var x = o.x > 0 ? o.x : 1;
    var typed = Number((($('mffKcal') || {}).value)) || 0, base = mFsBase(r);
    var servN = base ? Number((($('mffN') || {}).value)) || 0 : 1;
    var counts = base ? k * servN / base.n : k;
    return '<div><span>' + esc(mPortionText(r, 1)) + '</span><b>' + line(1) + '</b></div>' +
      (o.onPlate === false ? '' : '<div><span>' + esc(mPortionText(r, x)) + ' on your plate</span><b>' +
        Math.round(k * x) + ' kcal &middot; ' + Math.round(p.p * x) + 'P' +
        '<small>was ' + Math.round((mac.kcal || 0) * x) + ' kcal &middot; ' + Math.round((mac.p || 0) * x) + 'P</small></b></div>') +
      (typed && (p.p || p.f || p.c) && Math.abs(typed - counts) >= 3
        ? '<p>The label says ' + typed + ' kcal; the app counts ' + Math.round(counts) +
          ' from its protein, carbs and fat, as it does for every food.</p>' : '') +
      (got.code ? '<p>Scan ' + esc(got.code) + ' again and it opens these numbers, without asking Open Food Facts.</p>' : '');
  }
  function mFsFixRefresh() {
    var o = S.foodOpen, r = o && LIVE.BY_ID[o.id], w = $('mffWhat');
    if (!r || !w) return;
    w.innerHTML = mFsFixWhatHTML(r);
    var nt = $('mffNote');
    if (nt) nt.textContent = '';
  }

  return { mFsAmt: mFsAmt, mFsState: mFsState, mFsRefresh: mFsRefresh, mFoodSheetHTML: mFoodSheetHTML,
    mFsFixRead: mFsFixRead, mFsFixRefresh: mFsFixRefresh };
};
