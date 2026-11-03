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

  // what it reads of the app's, and (LIVE) what the app replaces as it goes: BY_ID, MFOODS, MSHELF
  var MNEVER = app.MNEVER;
  var S = app.S;
  var mExtOk = app.mExtOk;
  var mInfoBtn = app.mInfoBtn;
  var mInfoText = app.mInfoText;
  var mIsFav = app.mIsFav;
  var mPretty = app.mPretty;
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
    var list = (by[key] || []).sort(function (a, b) {
      return ((a.ext ? 1 : 0) - (b.ext ? 1 : 0)) ||
        String(a.name).localeCompare(String(b.name));
    });
    shelf.outerHTML = mFavShelfHTML(sh, list);
  }

  function mFavPickInner() {
    var by = mFavPickShelves(), total = 0;
    var blocks = LIVE.MSHELF.map(function (sh) {
      /* What the storehouse carries first, then the rest, then alphabetical.
         Straight A-Z opened Protein on calamari, catfish and clams — eight
         chips of the most obscure things in the table, with chicken and eggs
         below the fold. The order has to put the likely answer in the part
         you can see. */
      var list = (by[sh[0]] || []).sort(function (a, b) {
        return ((a.ext ? 1 : 0) - (b.ext ? 1 : 0)) ||
          String(a.name).localeCompare(String(b.name));
      });
      if (!list.length) return '';
      list.forEach(function (r) { if (mIsFav(r)) total++; });
      return mFavShelfHTML(sh, list);
    }).join('');
    /* Said, not done quietly. Ticking a food the storehouse does not carry
       turns on Fill-may-shop, because a favourite that can never be drafted
       is a tap that did nothing — but the app changing what it drafts is not
       something to learn by noticing. */
    var shopping = mExtOk();
    return { blocks: (shopping
        ? '<div class="fp-note">You\u2019ve picked food that isn\u2019t one of your ' +
          'staples, so Fill may now shop outside them.</div>' : '') + blocks,
      total: total };
  }

  function mFavPickHTML() {
    var inner = mFavPickInner();
    var total = inner.total;
    return '<div class="scrim no-print" data-close="1">' +
      '<div class="sheet mt-sheet" role="dialog" aria-modal="true" aria-label="What you eat">' +
        '<div class="sheet-top">' +
          '<div class="sheet-eyebrow m-eyei">What do you actually eat?' + mInfoBtn('fp', 'How this list is used') + '</div>' +
          '<button class="sheet-x" data-close="1" aria-label="Close">&times;</button>' +
        '</div>' +
        mInfoText('fp', 'Tap anything you eat regularly. Nourish leans toward ' +
          'these when it suggests food &mdash; it does not stop offering anything ' +
          'else. You can change your mind on any food, any time.', 'mt-cap') +
        inner.blocks +
        (function () {
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
        })() +
        /* sheet-done, not data-close. The attribute is decorative — it sits
           on the scrim too, so closest() would find it from anywhere inside
           the card and every tap would shut the sheet. The class is the wire.
           The note on that handler says so, and says it was written because
           a Done button had already been built wearing the decoration once. */
        '<div class="sync-row"><button class="btn-primary sheet-done">' +
          (total ? 'Done &middot; ' + total + ' chosen' : 'Skip for now') +
        '</button></div>' +
      '</div></div>';
  }

  return { mFavDoneLabel: mFavDoneLabel, mFavChipSync: mFavChipSync, mFavMoreSync: mFavMoreSync, mFavPickBodyHTML: mFavPickBodyHTML, mFavPickHTML: mFavPickHTML };
};
