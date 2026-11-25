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
  var mToast = app.mToast;
  var itemNeedsBuying = window.Shelf.itemNeedsBuying, foodSource = window.Shelf.foodSource,
    restockSource = window.Shelf.restockSource;
  var SHOP = window.SHOP || {};       // food key -> shopping-list name and unit
  var wakeSentinel = null;

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
            c: s.s ? 'Seasonings' : ((window.PANTRY || {})[it.k] || {}).c || '',
            meals: []
          };
        }
        if (e.r && e.r.name && bucket[key].meals.indexOf(e.r.name) < 0) bucket[key].meals.push(e.r.name);
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
      if (!bucket[k]) bucket[k] = { key: k, g: d.wm ? d.wm[1] : 0, unit: s.u, per: s.p, lad: s.d, label: s.l, c: d.c || '', meals: [] };
      bucket[k].src = from; bucket[k].extra = from === 'b'; bucket[k].low = true;
    });
    /* Quick-added household items stored on the active week sit beside
       recipe ingredients in To buy, auto-filed by aisle. */
    var extras = window.Store.extras ? window.Store.extras() : {};
    Object.keys(extras).forEach(function (ek) {
      var ex = extras[ek];
      if (!ex || !ex.l || bucket[ek]) return;
      bucket[ek] = {
        key: ek, extra: true, src: 'b', g: 1,
        unit: '', per: 0, lad: null,
        label: ex.l, qty: ex.q || '', c: '',
        aisle: ex.a || guessAisle(ex.l),
        custom: true, meals: []
      };
    });
    /* To buy first, since that is the trip; then the storehouse pick-up;
       then what is already in the kitchen, there to move if it has run out. */
    var bySrc = function (title, want) {
      var items = Object.keys(bucket).map(function (k) { return bucket[k]; })
        .filter(function (b) { return b.src === want; })
        .sort(function (a, b) { return a.label.localeCompare(b.label); });
      items.forEach(function (b) {
        if (b.custom) return;
        b.qty = b.g ? shopQty(b.g, b.unit, b.per, b.lad) : '';
        if (b.low) b.qty = (b.qty ? b.qty + ' \u00b7 ' : '') + 'ran out';
      });
      return { title: title, src: want, items: items };
    };
    return {
      groups: [bySrc(canBuy() ? 'To buy' : 'Needs a store', 'b'), bySrc(srcW().list, 's'), bySrc('In your kitchen', 'h')]
        .filter(function (g) { return g.items.length; }),
      recipeCount: entries.length
    };
  }

  /* To buy, by aisle, in the order a trip through a store goes: fresh things
     first, household & baby beside drinks before Other, spices last and folded. */
  var AISLES = [['Produce', ['Fresh']], ['Meat', ['Meat']], ['Dairy & eggs', ['Dairy and eggs']], ['Bread', ['Bread']],
    ['Canned', ['Canned soups', 'Canned veg', 'Canned fruit', 'Canned meats']],
    ['Rice, beans & pasta', ['Beans, rice, potatoes', 'Flour and pasta', 'Cereal']], ['Baking', ['Baking', 'Sugars']],
    ['Sauces & condiments', ['Condiments']], ['Drinks & treats', ['Drinks and desserts']],
    ['Household & Paper', []], ['Baby & Kids', []], ['Other', []], ['Spices', ['Seasonings']]];
  var AISLE_ICONS = {
    'Produce': '<path d="M12 3c3 0 5 2 5 5 0 4-3 7-5 7S7 12 7 8c0-3 2-5 5-5z"/><path d="M12 3c1-1.5 2.5-2 4-1.5"/>',
    'Meat': '<ellipse cx="12" cy="12" rx="7" ry="4.5"/><circle cx="14.5" cy="11.5" r="1.2"/>',
    'Dairy & eggs': '<path d="M8 3h8l1 4v11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V7l1-4z"/><path d="M7 9h10"/>',
    'Bread': '<path d="M5 12c0-3.5 3-6 7-6s7 2.5 7 6v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-4z"/>',
    'Canned': '<rect x="6" y="4" width="12" height="16" rx="2"/><path d="M6 9h12M6 15h12"/>',
    'Rice, beans & pasta': '<path d="M5 11h14l-1.5 8h-11z"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    'Baking': '<path d="M6 19h12l-1-9H7l-1 9z"/><path d="M9 10V7a3 3 0 0 1 6 0v3"/>',
    'Sauces & condiments': '<path d="M9 3h6l1 4v12a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V7l1-4z"/>',
    'Drinks & treats': '<path d="M7 6h10l-1 13H8L7 6z"/><path d="M9 6V3h6v3"/>',
    'Household & Paper': '<path d="M7 4h10l1 16H6L7 4z"/><path d="M9 9h6"/>',
    'Baby & Kids': '<circle cx="12" cy="10" r="5"/><path d="M6 19c1.5-2.5 3.7-3.5 6-3.5s4.5 1 6 3.5"/>',
    'Other': '<circle cx="12" cy="12" r="8"/><path d="M12 8v8M8 12h8"/>',
    'Spices': '<path d="M8 7h8v12H8z"/><path d="M9 4h6v3H9z"/>'
  };
  var SUGGESTIONS = ['Bananas', 'Milk', 'Paper towels', 'Diapers', 'Dish soap', 'School snacks'];

  function guessAisle(text) {
    var s = String(text || '').toLowerCase();
    if (/\b(diapers?|wipes?|pull-?ups?|baby|formula|pacifiers?|infant)\b/.test(s)) return 'Baby & Kids';
    if (/\b(towels?|toilet|tissues?|soaps?|detergents?|sponges?|trash|foil|parchment|ziplocs?|baggies?|cleaners?|bleach|napkins?|dish|laundry|paper|shampoo|toothpaste|deodorant|lysol|bags)\b/.test(s)) return 'Household & Paper';
    if (/\b(bananas?|apples?|berr(?:y|ies)|strawberr|blueberr|raspberr|oranges?|grapes?|avocados?|lettuce|spinach|tomatoes?|onions?|peppers?|carrots?|broccoli|lemons?|limes?|fruit|potatoes?|cilantro|garlic|cucumbers?|celery|salad|greens)\b/.test(s)) return 'Produce';
    if (/\b(chicken|beef|pork|turkey|bacon|sausage|steak|salmon|fish|shrimp|ham|meat|ground)\b/.test(s)) return 'Meat';
    if (/\b(bread|tortillas?|buns?|bagels?|muffins?|rolls?|croissants?|pita)\b/.test(s)) return 'Bread';
    if (/\b(peanut butter|almond butter|sauce|ketchup|mustard|mayo|mayonnaise|salsa|dressing|vinegar|syrup|jam|jelly|bbq|ranch)\b/.test(s)) return 'Sauces & condiments';
    if (/\b(milk|eggs?|cheese|butter|yogurt|cream|creamer|dairy|cottage)\b/.test(s)) return 'Dairy & eggs';
    if (/\b(snacks?|chips?|crackers?|goldfish|pretzels?|granola|juice|coffee|tea|soda|drinks?|cookies?|candy|popcorn|ice cream|treats?)\b/.test(s)) return 'Drinks & treats';
    if (/\b(canned|soups?|broth|stock|tomato paste)\b/.test(s)) return 'Canned';
    if (/\b(flour|sugar|baking|yeast|cocoa|chocolate chips?|vanilla|honey)\b/.test(s)) return 'Baking';
    if (/\b(pasta|rice|beans?|noodles?|penne|spaghetti|oats?|oatmeal|cereal|quinoa|lentils?)\b/.test(s)) return 'Rice, beans & pasta';
    return 'Other';
  }

  function parseQuickAdd(raw) {
    var s = String(raw || '').trim();
    if (!s) return null;
    var qty = '';
    var name = s;
    var m = s.match(/^(\d+(?:\s*\/\s*\d+)?(?:\.\d+)?\s*(?:gal|gallon|gallons|lb|lbs|oz|ct|count|rolls?|bags?|box|boxes|cans?|pk|pack|pkg|bunches?|dozen|bottles?)?)\s+(.+)$/i);
    if (m && !/^size\s+\d+/i.test(s)) {
      qty = m[1].trim();
      name = m[2].trim();
    }
    name = name.charAt(0).toUpperCase() + name.slice(1);
    return { label: name, qty: qty, aisle: guessAisle(s) };
  }

  function byAisle(items) {
    var at = {};
    items.forEach(function (it) {
      var n = it.aisle;
      if (!n) {
        var a = AISLES.filter(function (x) { return x[1].indexOf(it.c) >= 0; })[0];
        n = a ? a[0] : 'Other';
      }
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

  function addQuickItem(raw) {
    var p = parseQuickAdd(raw);
    if (!p) return;
    var extras = window.Store.extras ? window.Store.extras() : {};
    var low = p.label.toLowerCase();
    var matchKey = Object.keys(extras).filter(function (k) {
      return extras[k] && extras[k].l && extras[k].l.toLowerCase() === low;
    })[0];
    if (matchKey) {
      if (window.Store.isChecked(matchKey)) {
        window.Store.toggleChecked(matchKey);
        if (mToast) mToast('Moved ' + esc(extras[matchKey].l) + ' back to To buy.');
      } else if (mToast) {
        mToast(esc(extras[matchKey].l) + ' is already on your list.');
      }
      return;
    }
    window.Store.addExtra(p.label, p.qty, p.aisle);
    if (mToast) mToast('Added ' + esc(p.label) + ' to ' + esc(p.aisle) + '.');
  }

  function acquireWake() {
    if (!S.listAwake || S.view !== 'list' || wakeSentinel || !navigator.wakeLock || document.hidden) return;
    navigator.wakeLock.request('screen').then(function (lock) {
      wakeSentinel = lock;
      if (lock && lock.addEventListener) {
        lock.addEventListener('release', function () { wakeSentinel = null; });
      }
    }, function () { /* unsupported or battery saver */ });
  }

  function releaseWake() {
    S.listAwake = false;
    if (wakeSentinel && wakeSentinel.release) {
      try { wakeSentinel.release(); } catch (e) { /* already released */ }
    }
    wakeSentinel = null;
  }

  function toggleWake() {
    if (S.listAwake) {
      releaseWake();
      renderList();
      if (mToast) mToast('Screen lock returned to normal.');
      return;
    }
    S.listAwake = true;
    acquireWake();
    renderList();
    if (mToast) mToast('Keeping screen awake while you shop.');
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        if (mToast) mToast('Shopping list copied \u2014 paste anywhere to share.');
      }, function () {
        if (mToast) mToast('Couldn\u2019t copy automatically.');
      });
    } else if (mToast) {
      mToast('Share is not available in this browser.');
    }
  }

  function shareList() {
    var built = buildList();
    var parts = [];
    built.groups.forEach(function (g) {
      if (g.src !== 'b' && g.src !== 's') return;
      var items = g.items.filter(function (it) { return !window.Store.isChecked(it.key); });
      if (!items.length) return;
      if (g.src === 'b') {
        byAisle(items).forEach(function (a) {
          parts.push(a.name + ':\n' + a.items.map(function (it) {
            return '\u2022 ' + it.label + (it.qty ? ' (' + it.qty + ')' : '');
          }).join('\n'));
        });
      } else {
        parts.push(g.title + ':\n' + items.map(function (it) {
          return '\u2022 ' + it.label + (it.qty ? ' (' + it.qty + ')' : '');
        }).join('\n'));
      }
    });
    if (!parts.length) {
      if (mToast) mToast('Nothing left on the list to share.');
      return;
    }
    var text = window.Store.activeWeek().name + ' Shopping List\n\n' + parts.join('\n\n');
    if (navigator.share) {
      navigator.share({ title: 'Shopping List', text: text }).catch(function (err) {
        if (err && err.name === 'AbortError') return;
        copyText(text);
      });
      return;
    }
    copyText(text);
  }

  function renderList() {
    var built = buildList();

    var total = built.groups.reduce(function (n, g) { return n + g.items.length; }, 0);
    // which week this list came out of — there can be several
    $('listWeek').textContent = window.Store.activeWeek().name;
    var nBuy = 0, nBuyDone = 0, nSh = 0, usd = listUsd(built);
    built.groups.forEach(function (g) {
      if (g.src === 's') nSh = g.items.length;
      if (g.src === 'b') {
        nBuy = g.items.length;
        g.items.forEach(function (it) { if (window.Store.isChecked(it.key)) nBuyDone++; });
      }
    });
    $('listCount').innerHTML = total
      ? '<b>' + total + '</b> ' + (total === 1 ? 'item' : 'items') + (nSh ? ' \u00b7 <b>' + nSh + '</b> from ' + srcW().the : '') +
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
    var chipBar = '<div class="list-qchips no-print" role="group" aria-label="Common household items">' +
      SUGGESTIONS.map(function (label) {
        var on = built.groups.some(function (g) {
          return g.src === 'b' && g.items.some(function (it) {
            return it.label.toLowerCase() === label.toLowerCase() && !window.Store.isChecked(it.key);
          });
        });
        return '<button type="button" class="list-qchip' + (on ? ' added' : '') + '" data-listchip="' + esc(label) +
          '" aria-pressed="' + on + '">' + (on ? '&#10003; ' : '+ ') + esc(label) + '</button>';
      }).join('') + '</div>';
    var quick = '<form class="list-qadd no-print" id="listQuickForm">' +
      '<input type="text" class="list-qadd-in" id="listQuickIn" placeholder="+ Add milk, paper towels, diapers\u2026" autocomplete="off" aria-label="Add item to shopping list">' +
      '<button type="submit" class="list-qadd-btn">Add</button>' +
    '</form>' + chipBar;
    /* A line is a box, the thing (plus a quiet meal note), and how much. Under
       Mark what I have, each item gets a Have / Staples / Buy switch. */
    var mark = !!S.listMark;
    var line = function (it) {
      var on = window.Store.isChecked(it.key), food = !!(window.PANTRY || {})[it.key];
      var store = window.Store.opt('store', true), opts = [['h', 'Have'], ['s', srcW().name], ['b', 'Buy']].filter(function (o) { return o[0] !== 's' || store; });
      var seg = !mark || !food ? '' :
        '<span class="src-seg no-print" role="group" aria-label="Where ' + esc(it.label) + ' comes from">' + opts.map(function (o) {
          return '<button class="src-' + o[0] + '" data-src="' + esc(it.key) + '" data-v="' + o[0] + '" aria-pressed="' + (it.src === o[0]) + '">' + o[1] + '</button>';
        }).join('') + '</span>';
      var del = !mark && it.custom
        ? '<button type="button" class="list-del no-print" data-delextra="' + esc(it.key) + '" aria-label="Remove ' + esc(it.label) + '">&times;</button>'
        : '';
      var sub = it.custom
        ? '<small class="list-for list-for-added">Added</small>'
        : (it.meals && it.meals.length
            ? '<small class="list-for">' + esc(it.meals.slice(0, 2).join(' \u00b7 ') + (it.meals.length > 2 ? ' + ' + (it.meals.length - 2) + ' more' : '')) + '</small>'
            : '');
      return '<div class="list-line' + (it.src === 'h' ? ' have' : '') + (it.custom ? ' custom' : '') + '"><div class="list-line-body"><label class="list-row' + (on ? ' done' : '') + '">' +
        '<input type="checkbox" data-check="' + esc(it.key) + '"' + (on ? ' checked' : '') + '>' +
        '<span>' + esc(it.label) + '</span>' +
        '<span class="qty">' + esc(it.qty) + '</span>' +
      '</label>' + sub + '</div>' + del + seg + '</div>';
    };
    var rows = function (items) { return '<div class="list-items">' + items.map(line).join('') + '</div>'; };
    var aisleHTML = function (a) {
      var ic = AISLE_ICONS[a.name] || AISLE_ICONS.Other;
      var head = '<div class="list-aisle-t"><svg class="list-aisle-ic" viewBox="0 0 24 24" aria-hidden="true">' + ic + '</svg><span>' + esc(a.name) + '</span></div>' +
        '<small>' + (a.name === 'Spices' ? 'you may have these \u00b7 ' : '') + a.items.length + '</small>';
      return a.name === 'Spices' && !mark
        ? '<details class="list-aisle" data-fold="aisle:Spices"' + (S.listFold['aisle:Spices'] ? ' open' : '') + '><summary class="list-aisle-h">' + head + '</summary>' + rows(a.items) + '</details>'
        : '<div class="list-aisle"><div class="list-aisle-h">' + head + '</div>' + rows(a.items) + '</div>';
    };
    var group = function (g) {
      var body = '';
      if (g.src !== 'b') {
        body = rows(g.items);
      } else if (mark) {
        body = byAisle(g.items).map(aisleHTML).join('');
      } else {
        var todo = g.items.filter(function (it) { return !window.Store.isChecked(it.key); });
        var done = g.items.filter(function (it) { return window.Store.isChecked(it.key); });
        var cartOpen = S.listFold.incart !== false;
        body = byAisle(todo).map(aisleHTML).join('') +
          (done.length ? '<details class="list-cart-box" data-fold="incart"' + (cartOpen ? ' open' : '') + '>' +
            '<summary class="list-cart-h"><span>In cart</span><small>' + done.length + '</small></summary>' +
            rows(done) +
            '<div class="list-cart-foot no-print"><button type="button" class="nut-ask" data-uncheckall="1">Uncheck all</button></div>' +
          '</details>' : '');
      }
      return '<div class="list-group where-' + g.src + '">' +
        '<div class="list-group-title">' + esc(g.title) + '</div>' +
        (g.src === 's' ? '<button class="copy-order no-print" data-copyorder="1">' + srcW().copy + '</button>' : '') +
        body + (g.src === 'b' ? wm : '') + '</div>';
    };
    var nBuyLeft = nBuy - nBuyDone;
    var pct = nBuy ? Math.round((nBuyDone / nBuy) * 100) : 0;
    var prog = nBuy && !mark
      ? '<div class="list-prog no-print">' +
          '<div class="list-prog-m"><span><b>' + nBuyLeft + '</b> left to get' + (nBuyDone ? ' \u00b7 ' + nBuyDone + ' in cart' : '') + '</span>' +
            (usd >= 0.5 ? '<span>~' + pwMoney(usd) + ' est.</span>' : '') + '</div>' +
          '<div class="list-prog-track"><div class="list-prog-fill" style="width:' + pct + '%"></div></div>' +
        '</div>'
      : '';
    var have = built.groups.filter(function (g) { return g.src === 'h'; })[0];
    var tools = !total ? '' : mark
      ? '<div class="list-tools list-marking no-print" role="status"><span>Tap <b>Have</b> on anything already in your kitchen. It comes off the list and the cart.</span>' +
        '<button class="nut-ask" data-listmark="0">Done</button></div>'
      : '<div class="list-tools no-print">' +
          '<button type="button" class="list-pill" data-listmark="1">Mark what I have</button>' +
          '<button type="button" class="list-pill" data-sharelist="1">Share list</button>' +
          '<button type="button" class="list-pill" data-listawake="1" aria-pressed="' + (!!S.listAwake) + '">' +
            (S.listAwake ? 'Awake on' : 'Keep awake') + '</button>' +
        '</div>';
    $('listBody').classList.toggle('marking', mark);
    $('listBody').innerHTML = quick + prog + tools + built.groups.filter(function (g) { return g.src !== 'h'; }).map(group).join('') +
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

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && S.listAwake && S.view === 'list') acquireWake();
  });

  return {
    buildList: buildList,
    listUsd: listUsd,
    renderList: renderList,
    addQuickItem: addQuickItem,
    toggleWake: toggleWake,
    releaseWake: releaseWake,
    shareList: shareList
  };
};
