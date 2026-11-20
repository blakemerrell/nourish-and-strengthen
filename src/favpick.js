/* "What do you actually eat": the favourite star laid out as a grid of
 * chips, shelf by shelf, so a screen of taps improves every suggestion in
 * the app before there is any history to read (mFavPickHTML,
 * mFavPickBodyHTML, mFavChipSync, mFavMoreSync, mFavDoneLabel). The longer
 * account is with the code.
 *
 * A part of app.js (Nourish) in a file of its own. app.js calls
 * HiveParts.favpick(app) once, as it starts, and keeps what it gives back
 * under the same names. The recipes and foods (BY_ID, MFOODS) are replaced
 * as they change, and the shelves (MSHELF) are declared further down
 * app.js, so the part reads them through LIVE (tests/scope.test.js holds
 * the lists to each other). Loaded before app.js.
 */
(window.HiveParts = window.HiveParts || {}).favpick = function (app) {
  'use strict';

  // what it reads of the app's, and (LIVE) what the app replaces as it goes: BY_ID, MFOODS, MSHELF, RECIPES
  var MNEVER = app.MNEVER;
  var S = app.S;
  var fmtNum = app.fmtNum;
  var idOf = app.idOf;
  var mExtOk = app.mExtOk;
  var mInfoBtn = app.mInfoBtn;
  var mInfoText = app.mInfoText;
  var mIsFav = app.mIsFav;
  var mMacLine = app.mMacLine;
  var mPortionText = app.mPortionText;
  var mPretty = app.mPretty;
  var mReadSlots = app.mReadSlots;
  var mShelfKey = app.mShelfKey;
  var LIVE = app.LIVE;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* "What do you actually eat" — the screen that gives the ranker something
     to go on before there is any history to read.
   *
     It is the favourite star, laid out as a grid. That is the whole trick:
     mRank already pays a favourite six points, favourites already travel to
     the other phone, and mCanFav already says any food may wear one — so a
     screen of taps improves every suggestion in the app the moment it is
     closed, with no new ranking anywhere. Blake asked for it as onboarding,
     "that way they get favorited early... and then they seed my food
     selector", and the cheapest true version of that is the star.
   *
     Chips rather than rows: you are scanning for names you recognise, not
     reading macros, and a shelf you can see all of at once is a shelf you
     answer in one look. Rows put six on a screen; this puts a category.
   *
     Truncated per shelf rather than scrolled forever, because the table runs
     past a hundred foods once the ones the storehouse does not stock are in
     it. What you have already chosen is always drawn, open or shut — a
     screen that hides your own answers is worse than a long one. */
  var MFP_SHOWN = 8;                   // chips before a shelf offers the rest

  var STAPLES = {
    'f:egg': 1, 'f:egg_white': 1, 'f:chicken_breast': 1, 'f:chicken_canned': 1,
    'f:cooked_beef': 1, 'f:tuna': 1, 'f:black_beans': 1, 'f:pinto_beans': 1,
    'f:milk': 1, 'f:cottage_cheese': 1, 'f:cheddar': 1, 'f:vanilla_yogurt': 1,
    'f:cereal_o': 1, 'f:potato': 1, 'f:carrot': 1, 'f:green_beans': 1,
    'f:corn': 1, 'f:broccoli': 1, 'f:apple': 1, 'f:banana': 1,
    'f:orange': 1, 'f:peaches_canned': 1, 'f:applesauce': 1, 'f:peanut_butter': 1
  };

  function mFavStapleList() {
    return LIVE.MFOODS.filter(function (r) { return r.food && STAPLES[r.id]; });
  }

  function mFavPickShelves() {
    var by = {};
    LIVE.MFOODS.forEach(function (r) {
      if (!r.food || !(r.eat || r.side)) return;
      if (String(r.id).indexOf('f:my:') === 0) return;   // your own foods are already yours
      var sh = mShelfKey(r) || 'protein';
      (by[sh] = by[sh] || []).push(r);
    });
    return by;
  }

  /* The shelves alone. Two screens draw them — the fifth step of the first
     run, and "Food I eat" in the gear menu ever after — and a second copy of
     a hundred-food grid is a second copy that drifts. */
  /* What the button that finishes this screen should say. It is the same
     sentence on the gear sheet and on the wizard's last step, and it has to
     be true in both: nothing chosen is a skip, and a skip is a real answer
     here rather than a failure to answer. */
  function mFavDoneLabel() {
    var n = 0;
    LIVE.MFOODS.forEach(function (r) { if (r.food && mIsFav(r)) n++; });
    return n ? 'Done &middot; ' + n + ' chosen' : 'Skip for now';
  }

  /* The wizard's sheet is drawn once and left — the same bargain the editor
     strikes, and for the same reason: a redraw would throw away half-typed
     answers on four other steps and put you back on the first. So a tap here
     repaints what the tap changed and nothing else.
   *
     Without this the chip did not visibly move. The favourite was written —
     bsc.favs had it — and the screen said nothing, so the honest reading was
     that the tap had missed, and the next tap took it back off again. */
  function mFavChipSync(btn, r) {
    var on = mIsFav(r);
    btn.classList.toggle('on', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    var shelf = btn.closest('.fp-shelf');
    if (shelf) {
      var tag = shelf.querySelector('.fp-shelf-h i');
      if (tag) {
        /* The total is whatever it already said — the chips in the document
           are only the ones this shelf has been asked to show. */
        var all = Number(String(tag.textContent).split(/\s+/).pop()) || 0;
        var chosen = shelf.querySelectorAll('.fp-chip.on').length;
        tag.textContent = chosen ? chosen + ' of ' + all : String(all);
      }
    }
    var done = document.querySelector('[data-mtw="done"]');
    if (done) done.innerHTML = mFavDoneLabel();
    /* Turning shopping on has to say so here too; the sheet's own copy of
       this line is written at render time and there is no render. */
    if (mExtOk() && !document.querySelector('.fp-note')) {
      var first = document.querySelector('.fp-shelf');
      if (first && first.parentNode) {
        var note = document.createElement('div');
        note.className = 'fp-note';
        note.textContent = 'You\u2019ve picked food that isn\u2019t one of your staples, ' +
          'so Fill may now shop outside them.';
        first.parentNode.insertBefore(note, first);
      }
    }
  }

  function mFavPickBodyHTML() {
    return mFavPickInner().blocks;
  }

  function mFavShelfHTML(sh, list) {
    if (!list.length) return '';
    var on = [], off = [];
    list.forEach(function (r) { (mIsFav(r) ? on : off).push(r); });
    /* Chosen first and always drawn; the rest up to the cap, and the cap
       lifts for this shelf alone once it is asked to. */
    var open = S.fpOpen && S.fpOpen[sh[0]];
    var room = Math.max(0, MFP_SHOWN - on.length);
    var rest = open ? off : off.slice(0, room);
    var hidden = off.length - rest.length;
    var chip = function (r) {
      return '<button class="fp-chip' + (mIsFav(r) ? ' on' : '') +
        (r.ext ? ' ext' : '') + '" data-fppick="' + esc(String(r.id)) +
        '" aria-pressed="' + (mIsFav(r) ? 'true' : 'false') + '">' +
        esc(r.name) + '</button>';
    };
    return '<div class="fp-shelf">' +
      '<div class="fp-shelf-h"><span class="fp-emo" aria-hidden="true">' + sh[1] +
        '</span>' + esc(sh[2]) + '<i>' +
        (on.length ? on.length + ' of ' + list.length : String(list.length)) +
        '</i></div>' +
      '<div class="fp-chips">' + on.map(chip).join('') + rest.map(chip).join('') +
        (hidden > 0
          ? '<button class="fp-more" data-fpmore="' + esc(sh[0]) + '">+ ' +
            hidden + ' more</button>'
          : (open && off.length > MFP_SHOWN
            ? '<button class="fp-more" data-fpmore="' + esc(sh[0]) + '">Fewer</button>'
            : '')) +
      '</div></div>';
  }

  /* What the storehouse carries first, then the rest, then alphabetical.
     Straight A-Z opened Protein on calamari, catfish and clams — eight
     chips of the most obscure things in the table, with chicken and eggs
     below the fold. The order has to put the likely answer in the part
     you can see. */
  function mFavShelfSort(list) {
    return (list || []).slice().sort(function (a, b) {
      return ((a.ext ? 1 : 0) - (b.ext ? 1 : 0)) ||
        String(a.name).localeCompare(String(b.name));
    });
  }

  /* Same bargain for "+ N more" / "Fewer" on the wizard's last step:
     renderModal() leaves .mt-sheet untouched when S.macroTargOpen is true,
     so expanding or folding a shelf replaces just that shelf in place. */
  function mFavMoreSync(btn, key) {
    var shelf = btn.closest('.fp-shelf');
    if (!shelf) return;
    var sh = null;
    LIVE.MSHELF.forEach(function (s) { if (s[0] === key) sh = s; });
    if (!sh) return;
    var by = mFavPickShelves();
    var list = mFavShelfSort(by[key]);
    var parent = shelf.parentElement;
    shelf.outerHTML = mFavShelfHTML(sh, list);
    var fresh = parent && parent.querySelector('[data-fpmore="' + esc(key) + '"]');
    if (fresh) try { fresh.focus(); } catch (e) {}
  }

  function mFavPickInner() {
    var by = mFavPickShelves(), total = 0;
    var blocks = LIVE.MSHELF.map(function (sh) {
      var list = mFavShelfSort(by[sh[0]]);
      if (!list.length) return '';
      list.forEach(function (r) { if (mIsFav(r)) total++; });
      return mFavShelfHTML(sh, list);
    }).join('');
    /* Said, not done quietly. Ticking a food the storehouse does not carry
       turns on Fill-may-shop, because a favourite that can never be drafted
       is a tap that did nothing — but the app changing what it drafts is not
       something to learn by noticing. */
    var shopping = mExtOk();
    var unstarred = mFavStapleList().filter(function (r) { return !mIsFav(r); }).length;
    var quick = unstarred > 0
      ? '<div class="sync-row fp-quick"><button type="button" class="ghost fp-staples" data-fpstaples="1">Auto-select common pantry staples</button></div>'
      : '';
    return { blocks: '<div id="fpBody">' + quick + (shopping
        ? '<div class="fp-note">You\u2019ve picked food that isn\u2019t one of your ' +
          'staples, so Fill may now shop outside them.</div>' : '') + blocks + '</div>',
      total: total };
  }

  function mFavPickHTML() {
    var inner = mFavPickInner();
    var total = inner.total;
    var sec = S.mfSec || 'all';
    var slots = mReadSlots ? mReadSlots() : { list: [] };
    var pinsList = [];
    (slots.list || []).forEach(function (sl) {
      (sl.pins || []).forEach(function (pn) {
        var pr = LIVE.BY_ID[idOf(pn.id)];
        if (!pr) return;
        pinsList.push({ sk: sl.k, sn: sl.n, id: pn.id, x: Number(pn.x) || 1, r: pr });
      });
    });

    var mealsList = [];
    var customList = [];
    (LIVE.MFOODS || []).forEach(function (r) {
      if (r.parts && r.parts.length && !r.eatout) {
        mealsList.push(r);
      } else if (String(r.id).indexOf('f:my:') === 0 && !r.eatout) {
        customList.push(r);
      }
    });
    (LIVE.RECIPES || []).forEach(function (r) {
      if (r.own && r.typedMacro && !(r.steps || []).length && (r.ing || []).length) {
        mealsList.push(r);
      }
    });

    var tabBtn = function (k, label, n) {
      var on = sec === k;
      return '<button type="button" class="mf-tab' + (on ? ' on' : '') + '" data-mfsec="' + k + '" aria-pressed="' + (on ? 'true' : 'false') + '">' +
        esc(label) + (typeof n === 'number' && n > 0 ? ' <span class="mf-cnt num">' + n + '</span>' : '') +
      '</button>';
    };
    var tabsHTML = '<div class="mf-tabs" role="group" aria-label="Filter foods and routines">' +
      tabBtn('all', 'All', null) +
      tabBtn('pins', 'Pins', pinsList.length) +
      tabBtn('meals', 'Saved meals', mealsList.length) +
      tabBtn('custom', 'Custom foods', customList.length) +
      tabBtn('staples', 'Staples', total) +
    '</div>';

    var pinsHTML = '';
    if (sec === 'all' || sec === 'pins') {
      pinsHTML = '<div id="mfPins">' +
        '<div class="mt-div mf-sec-h"><span>Everyday pins</span></div>' +
        (pinsList.length
          ? '<div class="mf-list">' + pinsList.map(function (p) {
              return '<div class="mf-row" data-mfpin="' + esc(p.sk + '|' + String(p.id)) + '">' +
                '<div class="mf-info">' +
                  '<div class="mf-title"><b>' + esc(p.r.name) + '</b> <span class="mf-badge">' + esc(p.sn) + '</span></div>' +
                  '<div class="mf-sub num">' + esc(mPortionText(p.r, p.x)) + ' &middot; ' + mMacLine(p.r, p.x) + '</div>' +
                '</div>' +
                '<div class="mf-acts">' +
                  '<button type="button" class="ghost mf-btn mf-danger" data-mfunpin="' + esc(p.sk + '|' + String(p.id)) + '" aria-label="Unpin ' + esc(p.r.name) + ' from ' + esc(p.sn) + '">Unpin</button>' +
                '</div>' +
              '</div>';
            }).join('') + '</div>'
          : '<div class="mf-empty">No everyday pins yet. Pin any food from a meal\u2019s row menu so Fill includes it every day.</div>') +
      '</div>';
    }

    var mealsHTML = '';
    if (sec === 'all' || sec === 'meals') {
      mealsHTML = '<div id="mfMeals">' +
        '<div class="mt-div mf-sec-h"><span>Saved meals</span></div>' +
        (mealsList.length
          ? '<div class="mf-list">' + mealsList.map(function (r) {
              var comp = r.parts && r.parts.length
                ? r.parts.slice(0, 3).map(function (pt) { return fmtNum(pt.x || 1) + '\u00d7 ' + pt.name; }).join(', ') + (r.parts.length > 3 ? '\u2026' : '')
                : (r.ing || []).slice(0, 3).join(', ');
              return '<div class="mf-row" data-mfmeal="' + esc(String(r.id)) + '">' +
                '<button type="button" class="mf-name" data-mffood="' + esc(String(r.id)) + '">' +
                  '<span class="mf-title"><b>' + esc(r.name) + '</b></span>' +
                  (comp ? '<span class="mf-comp">' + esc(comp) + '</span>' : '') +
                  '<span class="mf-sub num">' + mMacLine(r, 1) + '</span>' +
                '</button>' +
                '<div class="mf-acts">' +
                  '<button type="button" class="ghost mf-btn" data-mfadd="' + esc(String(r.id)) + '" aria-label="Log ' + esc(r.name) + '">+ Log</button>' +
                  '<button type="button" class="ghost mf-btn mf-danger" data-mfdel="' + esc(String(r.id)) + '" aria-label="Delete ' + esc(r.name) + '">Delete</button>' +
                '</div>' +
              '</div>';
            }).join('') + '</div>'
          : '<div class="mf-empty">No saved meals yet. Build a plate on any meal, then choose <b>Save meal</b> in its &hellip; menu.</div>') +
      '</div>';
    }

    var customHTML = '';
    if (sec === 'all' || sec === 'custom') {
      customHTML = '<div id="mfCustom">' +
        '<div class="mt-div mf-sec-h"><span>Custom foods</span><button type="button" class="ghost mf-newbtn" data-mfnew="1">+ New food</button></div>' +
        (customList.length
          ? '<div class="mf-list">' + customList.map(function (r) {
              return '<div class="mf-row" data-mfcustom="' + esc(String(r.id)) + '">' +
                '<button type="button" class="mf-name" data-mffood="' + esc(String(r.id)) + '">' +
                  '<span class="mf-title"><b>' + esc(r.name) + '</b></span>' +
                  '<span class="mf-sub num">' + esc(mPortionText(r, 1)) + ' &middot; ' + mMacLine(r, 1) + '</span>' +
                '</button>' +
                '<div class="mf-acts">' +
                  '<button type="button" class="ghost mf-btn" data-mfedit="' + esc(String(r.id)) + '" aria-label="Edit ' + esc(r.name) + '">Edit</button>' +
                  '<button type="button" class="ghost mf-btn mf-danger" data-mfdel="' + esc(String(r.id)) + '" aria-label="Delete ' + esc(r.name) + '">Delete</button>' +
                '</div>' +
              '</div>';
            }).join('') + '</div>'
          : '<div class="mf-empty">No custom foods yet. Tap <b>+ New food</b> to add a Nutrition Facts label of your own.</div>') +
      '</div>';
    }

    var neverHTML = (function () {
      var ids = Object.keys(MNEVER);
      if (!ids.length) return '';
      return '<div class="mt-div m-divi">Not suggested' + mInfoBtn('never', 'What this means') + '</div>' +
        mInfoText('never', 'Fill won\u2019t add these. You can still add them yourself by searching.', 'mt-cap') +
        ids.map(function (id) {
          var rr = LIVE.BY_ID[id] || LIVE.BY_ID[Number(id)];
          return '<div class="mnv-row"><span class="mnv-n">' + esc(rr ? rr.name : id) +
            '<small>since ' + esc(mPretty(MNEVER[id])) + '</small></span>' +
            '<button class="ghost" data-mallow="' + esc(id) + '">Allow</button></div>';
        }).join('');
    })();

    var staplesHTML = '';
    if (sec === 'all' || sec === 'staples') {
      staplesHTML = '<div id="mfStaples">' +
        '<div class="mt-div m-divi">What do you actually eat?' + mInfoBtn('fp', 'How this list is used') + '</div>' +
        mInfoText('fp', 'Tap anything you eat regularly. Nourish leans toward ' +
          'these when it suggests food &mdash; it does not stop offering anything ' +
          'else. You can change your mind on any food, any time.', 'mt-cap') +
        inner.blocks +
        neverHTML +
      '</div>';
    }

    return '<div class="scrim no-print" data-close="1">' +
      '<div class="sheet mt-sheet mf-sheet" id="mFoodsSheet" role="dialog" aria-modal="true" aria-label="My foods and routines">' +
        '<div class="sheet-top">' +
          '<div class="sheet-eyebrow m-eyei">My foods &amp; routines</div>' +
          '<button class="sheet-x" data-close="1" aria-label="Close">&times;</button>' +
        '</div>' +
        tabsHTML +
        pinsHTML +
        mealsHTML +
        customHTML +
        staplesHTML +
        /* sheet-done, not data-close. The attribute is decorative — it sits
           on the scrim too, so closest() would find it from anywhere inside
           the card and every tap would shut the sheet. The class is the wire.
           The note on that handler says so, and says it was written because
           a Done button had already been built wearing the decoration once. */
        '<div class="sync-row"><button class="btn-primary sheet-done">' +
          (total ? 'Done &middot; ' + total + ' chosen' : 'Done') +
        '</button></div>' +
      '</div></div>';
  }

  return { mFavDoneLabel: mFavDoneLabel, mFavChipSync: mFavChipSync, mFavMoreSync: mFavMoreSync, mFavPickBodyHTML: mFavPickBodyHTML, mFavPickHTML: mFavPickHTML, mFavStapleList: mFavStapleList };
};
