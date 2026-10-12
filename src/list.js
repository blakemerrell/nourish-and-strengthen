/* The shopping list: the week's, added up in grams and said back in cups,
 * grouped by where each thing comes from (to buy, the storehouse pick-up,
 * already in the kitchen), To buy in aisles, with the staples that have run
 * out, and the Walmart button pinned to the foot of the screen while To buy
 * is on it. Where a line comes from is changed under Mark what I have.
 *
 * A part of app.js in a file of its own. app.js calls HiveParts.list(app)
 * once, as it starts, handing over the few things of its own the list reads
 * (named just below; tests/scope.test.js holds the two lists to each other)
 * and gets back buildList, listUsd and renderList. Loaded before app.js.
 */
(window.HiveParts = window.HiveParts || {}).list = function (app) {
  'use strict';

  // what the list reads of the app's, and of the shelf (src/shelf.js)
  var S = app.S;
  var planEntries = app.planEntries;
  var shopQty = app.shopQty;
  var canBuy = app.canBuy;
  var srcW = app.srcW;
  var pwPrice = app.pwPrice;
  var pwMoney = app.pwMoney;
  var itemNeedsBuying = window.Shelf.itemNeedsBuying, foodSource = window.Shelf.foodSource,
    restockSource = window.Shelf.restockSource;
  var SHOP = window.SHOP || {};       // food key -> shopping-list name and unit

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function $(id) { return document.getElementById(id); }

  /* The list works in grams and converts back at the end. It is the only way
     "1 cup", "1 cup" and "2 tbsp" of the same thing can come to 2¼ cups, and it
     is what lets one line cover a diced apple and a sliced one. Which food a
     line is, and how much of it, were worked out at build time — see
     tools/build-data.js — so the browser only has to add up. */
  /* The week's shopping list — or, given entries, the list for those: Plan
     My Week builds its list with this same function, so the two can never
     disagree about what a week needs. */
  function buildList(given) {
    var entries = given || planEntries();
    var bucket = {};
    entries.forEach(function (e) {
      (e.r.ingp || []).forEach(function (it) {
        var s = SHOP[it.k];
        if (!s || it.k === 'water') return;
        /* "(optional)" means you are not being sent out for it. */
        if (it.o) return;
        // seasonings share one food key, so they go by their own name instead
        /* The food key, and nothing about which heading it lands under.
        
           It used to be prefixed with the heading — base| or extra| — which
           made a ticked item's identity depend on where it was filed. Take
           something off your pantry shelf mid-shop and every tick against it
           vanished, because "base|ground beef" and "extra|ground beef" are two
           different things to a checklist and one thing to a person. Nothing
           needed the prefix: a food key can only be under one heading at a
           time, so there was never a collision for it to prevent. */
        var alias = (typeof it.a === 'string' && it.a.trim()) ? it.a.trim() : 'Seasoning';
        var key = s.s ? alias : it.k;
        if (!bucket[key]) {
          bucket[key] = {
            key: key, extra: true, g: 0,
            unit: s.u, per: s.p, lad: s.d,
            label: s.s ? alias.charAt(0).toUpperCase() + alias.slice(1) : s.l,
            // the shelf the food sits on, which is the aisle it is bought from
            c: s.s ? 'Seasonings' : ((window.PANTRY || {})[it.k] || {}).c || ''
          };
        }
        /* One line per thing, and the same predicate every other part of the
           app uses to answer the same question. This used to be decided
           per-recipe, so a recipe that called chocolate chips an extra and one
           that did not put them on the list twice; asking the shelf instead
           fixed that and introduced a quieter fault, because asking the shelf
           is not the whole question.
           
           A line the food table cannot weigh carries the key "free" — every
           seasoning shares it — and the pantry has never heard of "free", so
           it defaults to kept. That is right for salt and vanilla, which the
           storehouse does carry. It is wrong for the ones the recipe itself
           marked as an extra: five grams of creatine came out of a Crio Bru
           drink and landed under "From the storehouse", telling a reader the
           storehouse stocks creatine. It does not.
           
           itemNeedsBuying reads the recipe's own flag for those and the shelf
           for everything else, and it is what the coloured ingredient line and
           the "Also needs" foot already use. One question, one answer. */
        bucket[key].extra = itemNeedsBuying(it);
        bucket[key].src = bucket[key].extra ? 'b' : (s.s ? 'h' : foodSource(it.k) === 's' ? 's' : 'h');
        bucket[key].g += it.g * e.x;
      });
    });
    /* A staple that has run out comes back onto the list whether or not a
       recipe this week calls for it, from wherever it is restocked. */
    Object.keys(window.Store.lowAll()).forEach(function (k) {
      var s = SHOP[k], d = (window.PANTRY || {})[k];
      if (!s || !d) return;
      var from = restockSource(k);
      if (!bucket[k]) bucket[k] = { key: k, g: d.wm ? d.wm[1] : 0, unit: s.u, per: s.p, lad: s.d, label: s.l, c: d.c || '' };
      bucket[k].src = from; bucket[k].extra = from === 'b'; bucket[k].low = true;
    });
    /* To buy first, since that is the trip; then the storehouse pick-up;
       then what is already in the kitchen, there to move if it has run out. */
    var bySrc = function (title, want) {
      var items = Object.keys(bucket).map(function (k) { return bucket[k]; })
        .filter(function (b) { return b.src === want; })
        .sort(function (a, b) { return a.label.localeCompare(b.label); });
      items.forEach(function (b) { b.qty = b.g ? shopQty(b.g, b.unit, b.per, b.lad) : ''; if (b.low) b.qty = (b.qty ? b.qty + ' \u00b7 ' : '') + 'ran out'; });
      return { title: title, src: want, items: items };
    };
    return {
      groups: [bySrc(canBuy() ? 'To buy' : 'Needs a store', 'b'), bySrc(srcW().list, 's'), bySrc('In your kitchen', 'h')]
        .filter(function (g) { return g.items.length; }),
      recipeCount: entries.length
    };
  }

  /* To buy, by aisle, in the order a trip through a store goes: fresh things
     first, the spices last and folded, since most kitchens have them. The
     aisles are the shelves the food table already files every food under.
     Blake, of the list as one A-to-Z run with a price and a tag on every
     line: "Rows too busy... No aisles... Just feels unintuitive". */
  var AISLES = [['Produce', ['Fresh']], ['Meat', ['Meat']], ['Dairy & eggs', ['Dairy and eggs']], ['Bread', ['Bread']],
    ['Canned', ['Canned soups', 'Canned veg', 'Canned fruit', 'Canned meats']],
    ['Rice, beans & pasta', ['Beans, rice, potatoes', 'Flour and pasta', 'Cereal']], ['Baking', ['Baking', 'Sugars']],
    ['Sauces & condiments', ['Condiments']], ['Drinks & treats', ['Drinks and desserts']], ['Other', []], ['Spices', ['Seasonings']]];
  function byAisle(items) {
    var at = {};
    items.forEach(function (it) {
      var a = AISLES.filter(function (x) { return x[1].indexOf(it.c) >= 0; })[0];
      var n = a ? a[0] : 'Other';
      (at[n] = at[n] || []).push(it);
    });
    return AISLES.filter(function (a) { return at[a[0]]; }).map(function (a) { return { name: a[0], items: at[a[0]] }; });
  }

  /* What the list's to-buy part costs: the one figure for "to buy", on the
     list and on the plan, ran-out staples included. */
  function listUsd(built) {
    var usd = 0;
    built.groups.forEach(function (g) {
      if (g.src === 'b') g.items.forEach(function (b) { var pr = pwPrice(b.key); if (pr && b.g) usd += b.g * pr / 100; });
    });
    return usd;
  }

  function renderList() {
    var built = buildList();

    var total = built.groups.reduce(function (n, g) { return n + g.items.length; }, 0);
    // which week this list came out of — there can be several
    $('listWeek').textContent = window.Store.activeWeek().name;
    var nBuy = 0, nSh = 0, usd = listUsd(built);
    built.groups.forEach(function (g) {
      if (g.src === 's') nSh = g.items.length;
      if (g.src === 'b') nBuy = g.items.length;
    });
    $('listCount').innerHTML = total
      ? '<b>' + total + '</b> items' + (nSh ? ' \u00b7 <b>' + nSh + '</b> from ' + srcW().the : '') +
        (nBuy ? ' \u00b7 <b>' + nBuy + '</b> to buy' + (usd >= 0.5 ? ', ~' + pwMoney(usd) : '') : '')
      : '';
    $('listEmpty').classList.toggle('hide', total !== 0);
    /* To Walmart: what is left to get — not ticked, and off the shelf only
       when the shelf is asked to come too. It sits at the foot of To buy. */
    var wm = total && canBuy() ? window.Walmart.html([].concat.apply([], built.groups.map(function (g) { return g.items; }))
      .filter(function (b) { return b.src === 'b' && !window.Store.isChecked(b.key); })) : '';
    if ($('listWm')) $('listWm').innerHTML = '';
    /* The list, in the order the trip goes: to buy, then the source's
       pick-up, then what the kitchen already has, folded. Blake: "The first
       thing I see is a wall of pills... I think it should be flipped." */
    var fold = function (id, title, sub, inner, open) {
      return '<details class="list-fold" data-fold="' + id + '"' + (open ? ' open' : '') + '><summary><span>' + title + '</span><small>' + sub + '</small></summary>' + inner + '</details>';
    };
    /* A line is a box, the thing, and how much: nothing else. It used to
       carry its price and a small tag for where it comes from on every row,
       which made 21 lines read as 63 things. The price is the one total in
       the head; where a thing comes from is changed for the whole list at
       once, under Mark what I have, which puts the Have / Storehouse / Buy
       switch on every line until Done. */
    var mark = !!S.listMark;
    var line = function (it) {
      var on = window.Store.isChecked(it.key), food = !!(window.PANTRY || {})[it.key];
      var store = window.Store.opt('store', true), opts = [['h', 'Have'], ['s', srcW().name], ['b', 'Buy']].filter(function (o) { return o[0] !== 's' || store; });
      var seg = !mark || !food ? '' :
        '<span class="src-seg no-print" role="group" aria-label="Where ' + esc(it.label) + ' comes from">' + opts.map(function (o) {
          return '<button class="src-' + o[0] + '" data-src="' + esc(it.key) + '" data-v="' + o[0] + '" aria-pressed="' + (it.src === o[0]) + '">' + o[1] + '</button>';
        }).join('') + '</span>';
      return '<div class="list-line' + (it.src === 'h' ? ' have' : '') + '"><label class="list-row' + (on ? ' done' : '') + '">' +
        '<input type="checkbox" data-check="' + esc(it.key) + '"' + (on ? ' checked' : '') + '>' +
        '<span>' + esc(it.label) + '</span>' +
        '<span class="qty">' + esc(it.qty) + '</span>' +
      '</label>' + seg + '</div>';
    };
    var rows = function (items) { return '<div class="list-items">' + items.map(line).join('') + '</div>'; };
    var group = function (g) {
      var body = g.src !== 'b' ? rows(g.items) : byAisle(g.items).map(function (a) {
        var head = '<span>' + esc(a.name) + '</span><small>' + (a.name === 'Spices' ? 'you may have these \u00b7 ' : '') + a.items.length + '</small>';
        return a.name === 'Spices' && !mark
          ? '<details class="list-aisle" data-fold="aisle:Spices"' + (S.listFold['aisle:Spices'] ? ' open' : '') + '><summary class="list-aisle-h">' + head + '</summary>' + rows(a.items) + '</details>'
          : '<div class="list-aisle"><div class="list-aisle-h">' + head + '</div>' + rows(a.items) + '</div>';
      }).join('');
      return '<div class="list-group where-' + g.src + '">' +
        '<div class="list-group-title">' + esc(g.title) + '</div>' +
        (g.src === 's' ? '<button class="copy-order no-print" data-copyorder="1">' + srcW().copy + '</button>' : '') +
        body + (g.src === 'b' ? wm : '') + '</div>';
    };
    var have = built.groups.filter(function (g) { return g.src === 'h'; })[0];
    var tools = !total ? '' : mark
      ? '<div class="list-tools list-marking no-print" role="status"><span>Tap <b>Have</b> on anything already in your kitchen. It comes off the list and the cart.</span>' +
        '<button class="nut-ask" data-listmark="0">Done</button></div>'
      : '<div class="list-tools no-print"><button class="nut-ask" data-listmark="1">Mark what I have</button></div>';
    $('listBody').classList.toggle('marking', mark);
    $('listBody').innerHTML = tools + built.groups.filter(function (g) { return g.src !== 'h'; }).map(group).join('') +
      (have ? fold('have', 'Already in your kitchen', have.items.length + (have.items.length === 1 ? ' thing' : ' things'), group(have), S.listFold.have || mark) : '');
    /* Anything run out? The kitchen's staples, folded by shelf, one tap
       each — and the whole shelf under Settings for the rest. */
    var P = window.PANTRY || {};
    var staples = Object.keys(P).filter(function (k) { return (foodSource(k) === 'h' && !P[k].sp) || window.Store.low(k); })
      .sort(function (a, b) { return P[a].l.localeCompare(P[b].l); });
    var shelves = {}, order = [];
    staples.forEach(function (k) { var c = P[k].c || 'Other'; if (!shelves[c]) { shelves[c] = []; order.push(c); } shelves[c].push(k); });
    var nLow = staples.filter(function (k) { return window.Store.low(k); }).length;
    if ($('listLow')) $('listLow').innerHTML = staples.length ? fold('low', 'Anything run out?', nLow ? nLow + ' low' : staples.length + ' staples',
      '<div class="low-card"><p class="low-p">Tap what\u2019s low. It goes on the list from where you restock it.</p>' +
      order.map(function (c) {
        var ks = shelves[c], low = ks.filter(function (k) { return window.Store.low(k); }).length;
        return '<details class="list-shelf" data-fold="low:' + esc(c) + '"' + (S.listFold['low:' + c] || low ? ' open' : '') + '><summary><span>' + esc(c) + '</span><small>' + (low ? low + ' low' : ks.length) + '</small></summary>' +
          '<div class="pw-chips">' + ks.map(function (k) {
            return '<button class="pw-chip low-pill" data-low="' + esc(k) + '" aria-pressed="' + window.Store.low(k) + '">' + esc(P[k].l) + '</button>';
          }).join('') + '</div></details>';
      }).join('') +
      '<button class="nut-ask" data-stepgo="pantry">All your staples, under Settings</button></div>', S.listFold.low) : '';
    if ($('listNext')) $('listNext').innerHTML = '<button class="plan-next plan-back" data-stepgo="plan"><b>Back to the week</b></button>';
  }
  /* The folds remember themselves across redraws (a tick redraws the list). */
  document.addEventListener('toggle', function (e) {
    var d = e.target;
    if (!d || !d.dataset || !d.dataset.fold) return;
    S.listFold[d.dataset.fold] = d.open;
  }, true);

  return { buildList: buildList, listUsd: listUsd, renderList: renderList };
};
