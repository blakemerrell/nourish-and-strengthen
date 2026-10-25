/* A row in the food picker, and what a tap on it adds: what the household
 * is cooking today (mFamilyIds); the icons for the three ways to name a
 * food (mpIcon); one row, wherever it is listed (mpRowHTML); what you
 * logged last time and the amount a tap puts down (mpLastXs, mDefaultX); and
 * the portion that fits the meal being filled (mpFitX). The longer account
 * is with the code.
 *
 * A part of app.js (Nourish) in a file of its own. app.js calls
 * HiveParts.pickrow(app) once, as it starts, and keeps what it gives back
 * under the same names. What you logged last time (MP_LASTX) stays
 * declared in app.js, which empties it; the part reaches it, and the
 * recipes by id, through LIVE (tests/scope.test.js holds the lists to each
 * other). Loaded before app.js.
 */
(window.HiveParts = window.HiveParts || {}).pickrow = function (app) {
  'use strict';

  // what it reads of the app's, and (LIVE) what the app replaces as it goes: BY_ID, MP_LASTX
  var MDAYS = app.MDAYS;
  var S = app.S;
  var fmtNum = app.fmtNum;
  var keyDate = app.keyDate;
  var leaf = app.leaf;
  var mCanFav = app.mCanFav;
  var mClosesIt = app.mClosesIt;
  var mDay = app.mDay;
  var mDialG = app.mDialG;
  var mDialMeasure = app.mDialMeasure;
  var mDialText = app.mDialText;
  var mDayTargets = app.mDayTargets;
  var mIsFav = app.mIsFav;
  var mMacLine = app.mMacLine;
  var mMealFitX = app.mMealFitX;
  var mPortionText = app.mPortionText;
  var mRank = app.mRank;
  var mReadSlots = app.mReadSlots;
  var mSaltNote = app.mSaltNote;
  var mViewKey = app.mViewKey;
  var todayKey = app.todayKey;
  var LIVE = app.LIVE;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* What the household is cooking on this weekday, per the active week's
     plan. The family plan has no dates — Monday is just Monday — so the
     macro day borrows its weekday. Nothing new to enter anywhere: if the
     family planned it, it is on offer, portioned for your own targets. */
  /* The household's dishes for this day come from mFamilyIds, which the
     picker's family lens has used since it was built — and which I duplicated
     here before finding it, because the grep that found "the two halves never
     touch" was for Store.plan and Store.weeks and this reads Store.day. The
     halves DID touch: manually adding food already offered what the family
     planned. What was missing was the automatic path. */
  function mFamilyIds(k) {
    var wd = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][keyDate(k).getDay()];
    var ids = [];
    /* The week that day belongs to, now that weeks have dates — not whichever
       week the Plan tab happens to be showing. */
    window.Store.dayOf(window.Store.weekIdOf(keyDate(k)), wd).forEach(function (e) {
      if (LIVE.BY_ID[e.id] && ids.indexOf(e.id) < 0) ids.push(e.id);
    });
    return ids;
  }

  /* The three ways to name a piece of food, as the first thing the sheet
     says rather than as modes buried behind each other. Scanning is one tap
     from + Add; it used to be four. */
  var MP_ICON = {
    // a barcode, a magnifier, a stack of pages — drawn rather than borrowed
    // from a font, because the glyphs that mean these things are not in every
    // face and the fallbacks are boxes
    scan: '<path d="M2 3v10M4.5 3v10M7 3v7M9.5 3v10M12 3v7M14 3v10"/>',
    look: '<circle cx="7" cy="7" r="4.2"/><path d="M10.2 10.2 14 14"/>',
    recipes: '<rect x="2.5" y="2.5" width="11" height="11" rx="1.5"/><path d="M5 6h6M5 8.5h6M5 11h3.5"/>'
  };

  function mpIcon(k) {
    return '<svg class="mp-way-i" viewBox="0 0 16 16" aria-hidden="true" fill="none" ' +
      'stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">' +
      MP_ICON[k] + '</svg>';
  }

  /* One row, wherever it is listed. The picker, the look-up and the recent
     list all offer the same thing — a dish at a portion — so they offer it
     in the same shape, and the shape knows whether it is already in the
     basket. */
  /* `x` is what a tap on the row adds (mDefaultX: what you had last time,
     else what fits). There was a Fits chip beside it for the other amount;
     it went when every tap began re-fitting the meal around what it put
     down, because that is the job the chip did. */
  function mpRowHTML(r, x, fitText) {
    var inB = S.mpBasket[r.id] !== undefined;
    var inB2 = mIsFav(r);
    if (inB) x = S.mpBasket[r.id];
    /* A food says its amount in the plate's own words. "×4 0.5 cup (113 g)"
       was the label's serving with a count in front of it — the two numbers
       side by side that mLabelServing exists to stop — while the plate it
       made read "2 cups · 452 g". */
    /* Grams first, as the meal sheet dials it (Blake: "I dial in grams"),
       with the kitchen's word for it after; a thing with no weight keeps its
       own unit. */
    var meas = mDialG(r) ? mDialMeasure(r, x) : '';
    var fit = fitText !== undefined && fitText !== null ? fitText
      : (mDialG(r) ? esc(mDialText(r, x)) + (meas ? ' &middot; ' + esc(meas) : '')
        : r.food ? esc(mPortionText(r, x)) : '&times;' + fmtNum(x)) + ' &middot; ' +
        mMacLine(r, x, !inB) + mSaltNote(r, x);
    var rName = (S.mpShelf === 'eatout' && S.mpSpot && r.eatoutMenu && r.spots && r.spots.length > 1 && r.spots.indexOf(S.mpSpot) >= 0 && r.rawName)
      ? (S.mpSpot + ' \u2014 ' + r.rawName) : r.name;
    return '<div class="mpick-wrap' + (inB ? ' in' : '') + '">' +
      '<button class="mpick-row" data-mpick="' + esc(String(r.id)) + '" data-mpx="' + x + '"' +
        ' aria-pressed="' + (inB ? 'true' : 'false') + '">' +
        '<span class="mp-tick" aria-hidden="true">' + (inB ? '&#10003;' : '&#43;') + '</span>' +
        leaf(r.score, 'leaf-sm') +
        '<span class="mp-body">' +
          '<span class="mp-name">' +
            (mIsFav(r) ? '<span class="mp-fav">&#9733;</span> ' : '') +
            esc(rName) +
            /* The badge sits with the NAME, not out on the row's edge: it is
               a fact about this dish at this portion, and a column of its own
               would have to be reserved on every row that cannot earn it. */
            (!inB && mClosesIt(r, x) ? ' <span class="mp-closes">closes</span>' : '') +
          '</span>' +
          '<span class="mp-fit">' + fit + '</span>' +
        '</span>' +
      '</button>' +
      /* The star is a control here, not a badge. Finding a thing once and
         having to find it again tomorrow is the whole reason to keep one. */
      '<span class="mp-side no-print">' +
        (!mCanFav(r) ? '' :
          '<button class="mp-star" data-mpfav="' + esc(String(r.id)) + '" aria-pressed="' +
            (inB2 ? 'true' : 'false') + '" aria-label="' +
            (inB2 ? 'Remove from favorites' : 'Keep as a favorite') + '">&#9733;</button>') +
      '</span>' +
    '</div>';
  }

  function mpLastXs() {
    var out = {}, today = todayKey();
    Object.keys(MDAYS).sort().reverse().forEach(function (k) {
      if (k > today) return;
      var day = MDAYS[k] || {};
      Object.keys(day).forEach(function (sk) {
        (day[sk] || []).forEach(function (it) {
          if ((it.by === 'f' || it.why) && !it.eaten && !it.l) return;
          if (out[it.id] === undefined && it.x > 0) out[it.id] = it.x;
        });
      });
    });
    return out;
  }
  /* What a tap puts down: what you had last time, and for a food you have
     never logged, the amount that fits this meal (else one serving).
   *
     Blake asked for last time's amount first — the fit gave 1⅜ eggs and
     140 g of oats, and the usual portion had to be dialled back in every
     morning — and then, on 2026-10-05, for a tap that adds what fits. Both
     hold: a food you have an amount for keeps it, a new one comes in sized
     to the gap, and either way the rest of the meal re-fits around it
     (mRefitMeal), which is what the Fits chip beside the row used to ask
     you to do by hand. "Sized to the gap" is the meal's own judge
     (mMealFitX), not the picker's ranking fit, which measures room in the
     whole day. */
  function mDefaultX(r) {
    var f = S.macroPick ? mMealFitX(S.macroPick.slot, r) : mpFitX(r);
    if (f > 0) return f;
    var v = r ? LIVE.MP_LASTX[r.id] : 0;
    return v > 0 ? v : 1;
  }

  /* The portion that would fit the meal the sheet is filling, by the same
     solver the Fits best band ranks with. Null with no plan to fit against. */
  function mpFitX(r) {
    if (!S.macroPick || !r) return null;
    var k = mViewKey(), slot = null;
    mReadSlots().list.forEach(function (sl) { if (sl.k === S.macroPick.slot) slot = sl; });
    /* A food a tap has already put on this meal is fitted as if it were not
       there yet: the chip beside it says what size THIS plate should be, not
       how much room is left for a second one (which, on a meal it filled, is
       none — and the chip vanished). The plate steps off the live day for
       the length of the sum and straight back on: the share and the gap it
       reads are worked out from the stored day, not from a copy handed in.
       Nothing draws or saves in between. */
    var day = mDay(k), sk = S.macroPick.slot, at = S.mpAt && S.mpAt[r.id], off = null;
    if (S.mpBasket[r.id] !== undefined && at !== undefined && day[sk] && day[sk][at] && String(day[sk][at].id) === String(r.id)) {
      off = day[sk].splice(at, 1)[0];
    }
    var e;
    try { e = mRank([r], day, mDayTargets(k), slot || { k: sk, w: S.macroPick.w })[0]; }
    finally { if (off) day[sk].splice(at, 0, off); }
    return e && e.score !== null ? e.x : null;
  }

  return { mFamilyIds: mFamilyIds, mpIcon: mpIcon, mpRowHTML: mpRowHTML, mpLastXs: mpLastXs, mDefaultX: mDefaultX };
};
