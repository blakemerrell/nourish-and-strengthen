/* Cook: the unified shell across Recipes, This week, List and On hand,
 * one horizontal row of quick filter chips on Recipes, quick + planning
 * on cards, direct Walmart cart from This week, and hash routes.
 *
 * A part of app.js in a file of its own (window.HiveParts.cook). Loaded before
 * app.js. Strict ES5.
 */
(window.HiveParts = window.HiveParts || {}).cook = function (app) {
  'use strict';

  var S = app.S;
  var LIVE = app.LIVE;
  var DAYS = app.DAYS;
  var CAL_DAYS = app.CAL_DAYS;
  var BOOKS = app.BOOKS;
  var SEC_SHORT = app.SEC_SHORT;
  var SEC_NOTE = app.SEC_NOTE;
  var APP_SEC_NOTE = app.APP_SEC_NOTE;
  var esc = app.esc;
  var idOf = app.idOf;
  var no = app.no;
  var leaf = app.leaf;
  var timeMins = app.timeMins;
  var pwIsDinner = app.pwIsDinner;
  var pwAnswers = app.pwAnswers;
  var pwX = app.pwX;
  var canBuy = app.canBuy;
  var planEntries = app.planEntries;
  var buildList = app.buildList;
  var calPastDay = app.calPastDay;
  var openRecipe = app.openRecipe;
  var goView = app.goView;
  var goStep = app.goStep;
  var renderBrowse = app.renderBrowse;
  var renderSections = app.renderSections;
  var rememberOpener = app.rememberOpener;
  var restoreOpener = app.restoreOpener;

  var SITE_HOST = 'blakemerrell.github.io', SITE_ROOT = 'https://blakemerrell.github.io/nourish-and-strengthen/';
  var quickId = null;

  var HASH_MAP = {
    cook: 'browse', recipes: 'browse', browse: 'browse',
    book: 'book',
    plan: 'plan', week: 'plan', 'this-week': 'plan',
    where: 'where',
    list: 'list',
    pantry: 'pantry', 'on-hand': 'pantry',
    eat: 'macros', macros: 'macros', nourish: 'macros',
    train: 'train', strengthen: 'train',
    today: 'today'
  };

  function $(id) { return document.getElementById(id); }

  function dayFullName(key) {
    for (var i = 0; i < DAYS.length; i++) {
      if (DAYS[i][0] === key) return DAYS[i][1];
    }
    return key;
  }

  function viewFromHash() {
    var h = String(window.location.hash || '').replace(/^#\/?/, '').trim().toLowerCase();
    return HASH_MAP[h] || '';
  }

  function applyInitialHash() {
    var v = viewFromHash();
    if (v) S.view = v;
  }

  function weekIds() {
    var wk = window.Store.thisWeek();
    var out = {};
    DAYS.forEach(function (d) {
      window.Store.dayOf(wk, d[0]).forEach(function (e) {
        out[String(e.id)] = true;
      });
    });
    return out;
  }

  function matchQuick(r) {
    if (!S.quickF) return true;
    if (S.quickF === 'dinner') return !!pwIsDinner(r);
    if (S.quickF === 'under30') {
      var m = r && r.time ? timeMins(r) : 0;
      return m > 0 && m <= 30;
    }
    if (S.quickF === 'protein') return !!(r.macro && r.macro.p >= 30);
    return true;
  }

  function renderNav() {
    var hosts = document.querySelectorAll('[data-cooknav]');
    if (!hosts.length) return;
    var BY_ID = LIVE.BY_ID;
    var wk = window.Store.activeWeek();
    var wkId = (wk && wk.id) || window.Store.thisWeek();
    var nights = 0;
    CAL_DAYS.forEach(function (d) {
      if (window.Store.dayOf(wkId, d[0]).some(function (e) { return !!BY_ID[e.id]; })) {
        nights++;
      }
    });
    var ents = planEntries();
    var hasExtras = window.Store.extras && Object.keys(window.Store.extras()).length > 0;
    var nBuy = 0;
    if (ents.length || hasExtras) {
      buildList(ents).groups.forEach(function (g) {
        if (g.src === 'b') {
          g.items.forEach(function (it) {
            if (!window.Store.isChecked(it.key)) nBuy++;
          });
        }
      });
    }
    var isBrowse = S.view === 'browse' || S.view === 'book';
    var isPlan = S.view === 'plan' || S.view === 'where';
    var isList = S.view === 'list';
    var isPantry = S.view === 'pantry';
    var html = '<nav class="cook-nav no-print" aria-label="Cook">' +
      '<div class="seg cook-seg" role="group" aria-label="Cook sections">' +
        '<button type="button" data-cookgo="browse" aria-pressed="' + isBrowse + '">Recipes</button>' +
        '<button type="button" data-cookgo="plan" aria-pressed="' + isPlan + '">This week' +
          (nights ? '<span class="cook-badge">' + nights + '/7</span>' : '') + '</button>' +
        '<button type="button" data-cookgo="list" aria-pressed="' + isList + '">List' +
          (nBuy ? '<span class="cook-badge">' + nBuy + '</span>' : '') + '</button>' +
      '</div>' +
      '<button type="button" class="ghost cook-pantry" data-stepgo="pantry" aria-pressed="' + isPantry + '">On hand</button>' +
    '</nav>';
    for (var i = 0; i < hosts.length; i++) hosts[i].innerHTML = html;
  }

  var MEAL_OF = {
    '1-1': 'morning', '2-1': 'morning', '1-6': 'morning',
    '1-3': 'mains', '2-2': 'mains', '1-4': 'mains', '2-3': 'mains', '2-4': 'mains', '2-7': 'mains',
    '1-2': 'snacks', '1-5': 'snacks', '1-7': 'snacks',
    '2-5': 'sweets', '2-6': 'sweets', '2-8': 'sweets', '2-9': 'sweets', '2-10': 'sweets'
  };
  var MEAL_GROUPS = [
    { id: 'morning', title: 'Mornings & Drinks' },
    { id: 'mains', title: 'Lunches & Dinners' },
    { id: 'snacks', title: 'Snacks & Batch Prep' },
    { id: 'sweets', title: 'Sweets & Pantry Crafts' },
    { id: 'ours', title: 'Ours' }
  ];

  function secSlug(s) {
    return String(s || '').toLowerCase().replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function secArt(secName) {
    return (window.SECTION_ART || {})[secSlug(secName)] || '';
  }

  function chapMeta(r) {
    var shortKey = r.book + '-' + r.secNum;
    return {
      val: shortKey + '-' + r.secName,
      shortKey: shortKey,
      book: r.book,
      secNum: r.secNum,
      secName: r.secName,
      title: SEC_SHORT[shortKey] || r.secName,
      note: APP_SEC_NOTE[shortKey] || SEC_NOTE[shortKey] || (r.book === 3 ? 'Written by your household.' : ''),
      art: secArt(r.secName),
      count: 0
    };
  }

  /* Group the visible recipes into chapters in book order so Cook > Recipes
     opens on illustrated chapters instead of a 365-item scroll wall. */
  function buildChapters(list) {
    var out = [], byVal = {};
    list.forEach(function (r) {
      var val = r.book + '-' + r.secNum + '-' + r.secName;
      if (!byVal[val]) {
        byVal[val] = chapMeta(r);
        out.push(byVal[val]);
      }
      byVal[val].count++;
    });
    return out;
  }

  function chaptersHTML(list, onWeek) {
    var savedList = list.filter(function (r) { return window.Store.isFav(r.id); });
    var savedHTML = '';
    if (savedList.length) {
      savedHTML = '<div class="chap-sec chap-saved-sec">' +
        '<div class="chap-grp-hd"><h2>&#9733; Saved</h2><span>' +
        savedList.length + (savedList.length === 1 ? ' recipe' : ' recipes') + '</span></div>' +
        '<div class="chap-saved-rail">' + savedList.map(function (r) {
          var id = esc(String(r.id));
          var on = !!onWeek[String(r.id)];
          var lbl = on ? 'Planned: ' + r.name + ' (edit days)' : 'Add ' + r.name + ' to this week';
          var meta = r.time || ((BOOKS[r.book] || BOOKS[3]).short + ' \u00b7 ' + no(r));
          var score = r.score !== null && r.score !== undefined ? leaf(r.score) : '';
          return '<div class="chap-saved-cell">' +
            '<button type="button" class="chap-saved-card" data-open="' + id + '">' +
              '<span class="chap-saved-name">' + esc(r.name) + '</span>' +
              '<span class="chap-saved-foot">' +
                '<span class="chap-saved-meta">' + esc(meta) + '</span>' +
                score +
              '</span>' +
            '</button>' +
            '<button type="button" class="card-add no-print' + (on ? ' on' : '') + '" data-cardadd="' + id +
            '" aria-pressed="' + on + '" aria-label="' + esc(lbl) + '">' +
            (on ? '&#10003;' : '+') + '</button></div>';
        }).join('') + '</div></div>';
    }

    var grpMode = S.chapGroup === 'meal' ? 'meal' : 'book';
    var barHTML = S.bookF === 'all'
      ? '<div class="chap-bar no-print">' +
          '<div class="seg chap-grp-seg" role="group" aria-label="Group chapters">' +
            '<button type="button" data-chapgrp="book" aria-pressed="' + (grpMode === 'book') + '">By book</button>' +
            '<button type="button" data-chapgrp="meal" aria-pressed="' + (grpMode === 'meal') + '">By meal</button>' +
          '</div>' +
        '</div>'
      : '';

    var chapters = buildChapters(list);
    var groups = [];
    if (S.bookF === 'all' && grpMode === 'meal') {
      var byMeal = {};
      chapters.forEach(function (ch) {
        var mid = MEAL_OF[ch.shortKey] || (ch.book === 3 ? 'ours' : 'mains');
        if (!byMeal[mid]) byMeal[mid] = [];
        byMeal[mid].push(ch);
      });
      MEAL_GROUPS.forEach(function (mg) {
        if (byMeal[mg.id] && byMeal[mg.id].length) {
          groups.push({ title: mg.title, chaps: byMeal[mg.id] });
        }
      });
    } else {
      var byBook = {}, bookOrder = [];
      chapters.forEach(function (ch) {
        if (!byBook[ch.book]) { byBook[ch.book] = []; bookOrder.push(ch.book); }
        byBook[ch.book].push(ch);
      });
      bookOrder.forEach(function (b) {
        groups.push({ title: (BOOKS[b] || BOOKS[3]).name, chaps: byBook[b] });
      });
    }

    var idx = 0;
    var groupsHTML = groups.map(function (g) {
      var tot = g.chaps.reduce(function (sum, c) { return sum + c.count; }, 0);
      var cards = g.chaps.map(function (ch) {
        var lazy = idx >= 4 ? ' loading="lazy"' : '';
        idx++;
        var artHTML = ch.art
          ? '<img class="chap-art" src="' + esc(ch.art) + '" alt="" decoding="async"' + lazy + '>'
          : '<span class="chap-art-mono" aria-hidden="true">&#9998;</span>';
        return '<button type="button" class="chap-card" data-chap="' + esc(ch.val) + '">' +
          '<span class="chap-art-wrap">' + artHTML +
            '<span class="chap-cnt">' + ch.count + '</span>' +
          '</span>' +
          '<span class="chap-txt">' +
            '<span class="chap-title">' + esc(ch.title) + '</span>' +
            (ch.note ? '<span class="chap-sub">' + esc(ch.note) + '</span>' : '') +
          '</span>' +
        '</button>';
      }).join('');
      return '<div class="chap-sec">' +
        '<div class="chap-grp-hd"><h2>' + esc(g.title) + '</h2><span>' +
          g.chaps.length + (g.chaps.length === 1 ? ' chapter' : ' chapters') + ' &middot; ' +
          tot + (tot === 1 ? ' recipe' : ' recipes') + '</span></div>' +
        '<div class="chap-grid">' + cards + '</div>' +
      '</div>';
    }).join('');

    var footHTML = '<div class="chap-all-foot no-print">' +
      '<button type="button" class="ghost chap-all-btn" data-browseall="1">Browse all ' + list.length + ' recipes</button>' +
    '</div>';

    return savedHTML + barHTML + groupsHTML + footHTML;
  }

  function drillHeroHTML(list) {
    if (!list || !list.length) return '';
    var ch = chapMeta(list[0]);
    var bookName = (BOOKS[ch.book] || BOOKS[3]).name;
    var artHTML = ch.art
      ? '<img src="' + esc(ch.art) + '" alt="" decoding="async">'
      : '<span class="chap-art-mono" aria-hidden="true">&#9998;</span>';
    var sorts = [['book', 'Book'], ['protein', 'Protein'], ['healthy', 'Score']];
    var sortHTML = '<div class="chap-sorts no-print" role="group" aria-label="Sort chapter">' +
      sorts.map(function (s) {
        return '<button type="button" class="chap-sort" data-chapsort="' + s[0] +
          '" aria-pressed="' + (S.sort === s[0]) + '">' + s[1] + '</button>';
      }).join('') + '</div>';
    return '<div class="chap-drill">' +
      '<div class="chap-drill-top">' +
        '<button type="button" class="ghost chap-back" data-chapback="1">&lsaquo; All chapters</button>' +
        sortHTML +
      '</div>' +
      '<div class="chap-hero">' +
        '<div class="chap-thumb">' + artHTML + '</div>' +
        '<div class="chap-hero-info">' +
          '<div class="chap-hero-book">' + esc(bookName) + ' &middot; ' + list.length + (list.length === 1 ? ' recipe' : ' recipes') + '</div>' +
          '<h2 class="chap-hero-title">' + esc(ch.title) + '</h2>' +
          (ch.note ? '<p class="chap-hero-sub">' + esc(ch.note) + '</p>' : '') +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function allBarHTML() {
    return '<div class="chap-all-bar no-print">' +
      '<button type="button" class="ghost chap-back" data-chapback="1">&lsaquo; Chapters</button>' +
    '</div>';
  }

  function renderChips() {
    var el = $('cookChips');
    if (!el) return;
    var isAll = !S.quickF && S.bookF === 'all' && S.secF === 'all' && S.diffF === 'all' &&
      S.pantryF === 'all' && !S.favOnly && S.sort === 'book' && !S.browseAll;
    var chips = [
      ['all', 'All', isAll],
      ['dinner', 'Dinner', S.quickF === 'dinner'],
      ['under30', 'Under 30 min', S.quickF === 'under30'],
      ['protein', 'High protein', S.quickF === 'protein'],
      ['pantry', 'From my pantry', S.pantryF === 'base'],
      ['fav', '\u2605 Favorites', !!S.favOnly]
    ];
    el.innerHTML = chips.map(function (c) {
      return '<button type="button" class="cook-chip" data-qchip="' + c[0] +
        '" aria-pressed="' + (!!c[2]) + '">' + c[1] + '</button>';
    }).join('');
  }

  function applyChip(k) {
    if (k === 'all') {
      S.quickF = '';
      S.bookF = 'all';
      S.secF = 'all';
      S.diffF = 'all';
      S.pantryF = 'all';
      S.favOnly = false;
      S.sort = 'book';
      S.browseAll = false;
      document.querySelectorAll('#bookSeg button[data-book]').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.dataset.book === 'all'));
      });
      if ($('diffSel')) $('diffSel').value = 'all';
      if ($('pantrySel')) $('pantrySel').value = 'all';
      if ($('sortSel')) $('sortSel').value = 'book';
      if ($('favBtn')) $('favBtn').setAttribute('aria-pressed', 'false');
      renderSections();
    } else if (k === 'pantry') {
      S.pantryF = S.pantryF === 'base' ? 'all' : 'base';
      if ($('pantrySel')) $('pantrySel').value = S.pantryF;
    } else if (k === 'fav') {
      S.favOnly = !S.favOnly;
      if ($('favBtn')) $('favBtn').setAttribute('aria-pressed', String(S.favOnly));
    } else {
      if (k === 'dinner' && S.quickF !== 'dinner' && S.secF !== 'all') {
        S.secF = 'all';
        if ($('secSel')) $('secSel').value = 'all';
      }
      S.quickF = S.quickF === k ? '' : k;
    }
    renderBrowse();
  }

  function cardCellHTML(r, cardHTML, onWeek) {
    var id = esc(String(r.id));
    var lbl = onWeek ? 'Planned: ' + r.name + ' (edit days)' : 'Add ' + r.name + ' to this week';
    return '<div class="card-cell">' + cardHTML +
      '<button type="button" class="card-add no-print' + (onWeek ? ' on' : '') + '" data-cardadd="' + id +
      '" aria-pressed="' + (!!onWeek) + '" aria-label="' + esc(lbl) + '">' +
      (onWeek ? '&#10003;' : '+') + '</button></div>';
  }

  function planWalmartHTML(built) {
    if (!canBuy() || !window.Walmart || !built || !built.groups) return '';
    var items = [].concat.apply([], built.groups.map(function (g) { return g.items; }))
      .filter(function (b) { return b.src === 'b' && !window.Store.isChecked(b.key); });
    if (!items.length) return '';
    var L = window.Walmart.lines(items);
    if (!L.cart.length) return '';
    var n = L.cart.reduce(function (t, l) { return t + l.qty; }, 0);
    return '<div class="wm-bar plan-wm-bar no-print">' +
      '<a class="wm-btn" href="' + esc(window.Walmart.url(L.cart)) + '" target="_blank" rel="noopener">' +
      window.Walmart.mark + 'Add ' + L.cart.length + (L.cart.length === 1 ? ' item' : ' items') + ' to Walmart cart</a>' +
      '<div class="wm-sub">Opens Walmart with ' + (n === L.cart.length ? 'them' : n + ' packs') + ' in your cart</div></div>';
  }

  function nextOpenDayKey() {
    var BY_ID = LIVE.BY_ID;
    var todayIdx = new Date().getDay();
    var ordered = CAL_DAYS.slice(todayIdx).concat(CAL_DAYS.slice(0, todayIdx));
    var future = ordered.filter(function (d) { return !calPastDay(d[0]); });
    var pool = future.length ? future : ordered;
    for (var i = 0; i < pool.length; i++) {
      var list = window.Store.day(pool[i][0]).filter(function (e) { return !!BY_ID[e.id]; });
      if (!list.length) return pool[i][0];
    }
    return pool[0][0];
  }

  function renderQuickAdd() {
    var root = $('cookRoot');
    if (!root) return;
    var r = quickId !== null ? LIVE.BY_ID[quickId] : null;
    if (!r) {
      quickId = null;
      root.innerHTML = '';
      if (!document.querySelector('#modalRoot .scrim, #trainRoot .scrim')) {
        document.body.style.overflow = '';
      }
      return;
    }
    var BY_ID = LIVE.BY_ID;
    var nx = nextOpenDayKey();
    var meta = [r.time || '', r.servings ? r.servings.split(' (')[0] : ''].filter(Boolean).join(' \u00b7 ');
    var dayButtons = CAL_DAYS.map(function (d) {
      var k = d[0];
      var list = window.Store.day(k).filter(function (e) { return !!BY_ID[e.id]; });
      var on = list.some(function (e) { return e.id === r.id; });
      var sub = on ? 'Planned \u2713' : list.length ? BY_ID[list[0].id].name : 'Open';
      return '<button type="button" class="cook-daybtn' + (on ? ' on' : '') + '" data-cookday="' + k +
        '" aria-pressed="' + on + '"><b>' + d[2] + '</b><small>' + esc(sub) + '</small></button>';
    }).join('');
    root.innerHTML = '<div class="scrim no-print" data-cookscrim="1">' +
      '<div class="sheet dsh-sheet" role="dialog" aria-modal="true" aria-labelledby="cookAddTitle">' +
        '<div class="sheet-top"><div class="sheet-eyebrow">This week</div>' +
          '<button type="button" class="sheet-x" data-cookclose="1" aria-label="Close">&times;</button></div>' +
        '<div class="dsh-body">' +
          '<h2 class="dsh-h" id="cookAddTitle">' + esc(r.name) + '</h2>' +
          (meta ? '<p class="dsh-m">' + esc(meta) + '</p>' : '') +
          '<button type="button" class="btn-primary cook-next-btn" data-cooknext="' + esc(nx) + '">Add to ' + esc(dayFullName(nx)) + '</button>' +
          '<div class="cook-daygrid" role="group" aria-label="Choose days">' + dayButtons + '</div>' +
          '<div class="cook-sheet-foot">' +
            '<button type="button" class="ghost" data-cookopen="' + esc(String(r.id)) + '">Open recipe</button>' +
            '<button type="button" class="btn-primary" data-cookclose="1">Done</button>' +
          '</div>' +
        '</div>' +
      '</div></div>';
    document.body.style.overflow = 'hidden';
  }

  function closeQuickAdd(keepFocus) {
    if (quickId === null) return;
    quickId = null;
    renderQuickAdd();
    if (!keepFocus) restoreOpener();
  }

  function openQuickAdd(id) {
    if (!LIVE.BY_ID[id]) return;
    if (window.Store.activeWeek().id !== window.Store.thisWeek()) {
      window.Store.setWeek(window.Store.thisWeek());
    }
    rememberOpener();
    quickId = id;
    renderQuickAdd();
    var x = document.querySelector('#cookRoot .sheet-x');
    if (x) x.focus();
  }

  function syncModal() {
    if (quickId === null) return;
    renderQuickAdd();
  }

  function wire() {
    document.addEventListener('click', function (e) {
      if (!e.target || !e.target.closest) return;

      var cg = e.target.closest('[data-cookgo]');
      if (cg) {
        var dest = cg.dataset.cookgo;
        var kbd = e.detail === 0;
        closeQuickAdd(true);
        if (dest === 'list') goStep('list');
        else goView(dest);
        if (kbd) {
          var target = document.querySelector('#view-' + dest + ' [data-cookgo="' + dest + '"]');
          if (target && target.focus) target.focus();
        }
        return;
      }

      var qc = e.target.closest('#cookChips [data-qchip]');
      if (qc) {
        applyChip(qc.dataset.qchip);
        return;
      }

      var ca = e.target.closest('#grid [data-cardadd]');
      if (ca) {
        openQuickAdd(idOf(ca.dataset.cardadd));
        return;
      }

      var ch = e.target.closest('#grid [data-chap]');
      if (ch) {
        S.secF = ch.dataset.chap;
        S.browseAll = false;
        if ($('secSel')) $('secSel').value = S.secF;
        renderBrowse();
        window.scrollTo(0, 0);
        return;
      }

      var cs = e.target.closest('#grid [data-chapsort]');
      if (cs) {
        S.sort = cs.dataset.chapsort || 'book';
        if ($('sortSel')) $('sortSel').value = S.sort;
        renderBrowse();
        return;
      }

      var cb = e.target.closest('#grid [data-chapback]');
      if (cb) {
        S.secF = 'all';
        S.sort = 'book';
        S.browseAll = false;
        if ($('secSel')) $('secSel').value = 'all';
        if ($('sortSel')) $('sortSel').value = 'book';
        renderBrowse();
        window.scrollTo(0, 0);
        return;
      }

      var grp = e.target.closest('#grid [data-chapgrp]');
      if (grp) {
        S.chapGroup = grp.dataset.chapgrp === 'meal' ? 'meal' : 'book';
        try { localStorage.setItem('sh.chapGroup', S.chapGroup); } catch (ex) { /* private mode */ }
        renderBrowse();
        return;
      }

      var ba = e.target.closest('#grid [data-browseall]');
      if (ba) {
        S.browseAll = true;
        renderBrowse();
        window.scrollTo(0, 0);
        return;
      }

      var cr = $('cookRoot');
      if (cr && cr.contains(e.target)) {
        if (e.target.dataset && e.target.dataset.cookscrim) { closeQuickAdd(); return; }
        if (e.target.closest('[data-cookclose]')) { closeQuickAdd(); return; }
        var cn = e.target.closest('[data-cooknext]');
        if (cn && quickId !== null) {
          var nr = LIVE.BY_ID[quickId];
          if (nr) {
            var dk = cn.dataset.cooknext;
            var has = window.Store.day(dk).some(function (x) { return x.id === nr.id; });
            if (!has) window.Store.addToDay(nr.id, dk, pwX(nr, pwAnswers().ppl));
          }
          closeQuickAdd();
          return;
        }
        var cd = e.target.closest('[data-cookday]');
        if (cd && quickId !== null) {
          var dr = LIVE.BY_ID[quickId];
          var dkey = cd.dataset.cookday;
          if (dr) {
            var already = window.Store.day(dkey).some(function (x) { return x.id === dr.id; });
            if (already) window.Store.removeFromDay(dr.id, dkey);
            else window.Store.addToDay(dr.id, dkey, pwX(dr, pwAnswers().ppl));
          }
          return;
        }
        var co = e.target.closest('[data-cookopen]');
        if (co) {
          var rid = idOf(co.dataset.cookopen);
          closeQuickAdd(true);
          openRecipe(rid);
          return;
        }
      }
    });

    document.addEventListener('keydown', function (e) {
      if (quickId === null) return;
      if (document.querySelector('#dialogRoot .dlg')) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        closeQuickAdd();
        return;
      }
      if (e.key === 'Tab') {
        var scrim = document.querySelector('#cookRoot .scrim');
        if (!scrim) return;
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
    });

    /* Android OTA syncs CORE scripts and data/art.js without updating the older
       APK's bundled EXTRAS art. When a newly added chapter engraving is missing
       from the phone's local copy, fetch it once from GitHub Pages (already
       allowed in CSP img-src); if that also fails (offline), swap to the quiet
       pencil monogram instead of showing a broken image icon. */
    document.addEventListener('error', function (e) {
      var el = e.target;
      if (!el || el.tagName !== 'IMG') return;
      if (!el.closest || !el.closest('#grid .chap-art-wrap, #grid .chap-thumb')) return;
      var own = el.getAttribute('src') || '';
      if (!el.getAttribute('data-web') && /^art\//.test(own) && location.hostname !== SITE_HOST) {
        el.setAttribute('data-web', '1');
        el.src = SITE_ROOT + own;
        return;
      }
      var mono = document.createElement('span');
      mono.className = 'chap-art-mono';
      mono.setAttribute('aria-hidden', 'true');
      mono.innerHTML = '&#9998;';
      if (el.parentNode) el.parentNode.replaceChild(mono, el);
    }, true);

    window.addEventListener('hashchange', function () {
      var v = viewFromHash();
      if (v && v !== S.view) {
        closeQuickAdd(true);
        goView(v);
      }
    });
  }

  return {
    applyInitialHash: applyInitialHash,
    weekIds: weekIds,
    matchQuick: matchQuick,
    renderNav: renderNav,
    renderChips: renderChips,
    buildChapters: buildChapters,
    chaptersHTML: chaptersHTML,
    drillHeroHTML: drillHeroHTML,
    allBarHTML: allBarHTML,
    cardCellHTML: cardCellHTML,
    planWalmartHTML: planWalmartHTML,
    closeQuickAdd: closeQuickAdd,
    syncModal: syncModal,
    wire: wire
  };
};
