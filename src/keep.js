/* Keeping plates together as one food of your own (mKeepHTML): naming it,
 * and choosing who gets it, the household's Ours shelf or your own foods,
 * asked rather than assumed. The longer account is with the code.
 *
 * A part of app.js (Nourish) in a file of its own. app.js calls
 * HiveParts.keep(app) once, as it starts, and keeps what it gives back
 * under the same name. The recipes by id (BY_ID) are read through LIVE
 * (tests/scope.test.js holds the lists to each other). Loaded before
 * app.js.
 */
(window.HiveParts = window.HiveParts || {}).keep = function (app) {
  'use strict';

  // what it reads of the app's, and (LIVE) what the app replaces as it goes: BY_ID
  var S = app.S;
  var fmtNum = app.fmtNum;
  var mDay = app.mDay;
  var mInfoBtn = app.mInfoBtn;
  var mInfoText = app.mInfoText;
  var mReadSlots = app.mReadSlots;
  var mViewKey = app.mViewKey;
  var LIVE = app.LIVE;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* Naming it, and choosing who gets it. Asked rather than assumed, because
     the two answers go to different places: the Ours shelf is the household's
     and your own foods are yours, and neither is obviously the right home for
     four scanned packets. */
  function mKeepHTML() {
    var sk = S.keepMeal, day = mDay(mViewKey());
    /* Foods heard in the picker (S.keepItems, heard.js) are asked about on
       their own, not mixed with whatever the meal already holds. */
    var items = (S.keepItems || day[sk] || []).filter(function (it) { return LIVE.BY_ID[it.id]; });
    var mac = { kcal: 0, p: 0, f: 0, c: 0 };
    items.forEach(function (it) {
      var r = LIVE.BY_ID[it.id];
      ['kcal', 'p', 'f', 'c'].forEach(function (m) { mac[m] += ((r.macro || {})[m] || 0) * it.x; });
    });
    var slots = mReadSlots(), nm = slots.names[sk] || 'Meal';
    slots.list.forEach(function (sl) { if (sl.k === sk) nm = sl.n; });
    return '<div class="scrim no-print" data-close="1">' +
      '<div class="sheet mt-sheet" role="dialog" aria-modal="true" aria-label="Save this meal">' +
        '<div class="sheet-top">' +
          /* Named for the button that opens it. */
          '<div class="sheet-eyebrow">' + (S.keepItems ? 'Keep as one food' : 'Save ' + esc(nm.toLowerCase())) + '</div>' +
          '<button class="sheet-x" data-close="1" aria-label="Close">&times;</button>' +
        '</div>' +
        '<div class="mtl-row"><span class="mtl-lab">Call it</span>' +
          '<span class="mtl-val"><input type="text" id="mkName" ' +
            'placeholder="Morning Crio Br\u00fc" aria-label="What to call it"></span></div>' +
        '<div class="mk-parts">' + items.map(function (it) {
          var r = LIVE.BY_ID[it.id];
          return '<div class="mk-p"><span>' + esc(r.name) + '</span><span>&times;' +
            fmtNum(it.x) + '</span></div>';
        }).join('') + '</div>' +
        '<div class="mk-tot">' + Math.round(mac.kcal) + ' kcal &middot; ' +
          Math.round(mac.p) + 'P &middot; ' + Math.round(mac.f) + 'F &middot; ' +
          Math.round(mac.c) + 'C</div>' +
        '<div class="mt-div m-divi">Where it goes' + mInfoBtn('keep', 'Ours or yours') + '</div>' +
        mInfoText('keep', 'Ours is a recipe everyone with the pantry code can see. ' +
          'The other stays in your account.', 'mt-cap') +
        '<div class="sync-row">' +
          '<button class="btn-primary" data-mkdo="share">Add to Ours</button>' +
          '<button class="ghost" data-mkdo="mine">Keep it to myself</button>' +
        '</div>' +
        '<div class="mt-cap" id="mkNote"></div>' +
      '</div></div>';
  }

  return { mKeepHTML: mKeepHTML };
};
