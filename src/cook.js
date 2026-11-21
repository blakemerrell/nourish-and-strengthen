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
  var esc = app.esc;
  var idOf = app.idOf;
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
    var nBuy = 0;
    if (ents.length) {
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

  function renderChips() {
    var el = $('cookChips');
    if (!el) return;
    var isAll = !S.quickF && S.bookF === 'all' && S.secF === 'all' && S.diffF === 'all' &&
      S.pantryF === 'all' && !S.favOnly && S.sort === 'book';
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
    cardCellHTML: cardCellHTML,
    planWalmartHTML: planWalmartHTML,
    closeQuickAdd: closeQuickAdd,
    syncModal: syncModal,
    wire: wire
  };
};
