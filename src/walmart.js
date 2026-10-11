/* Walmart: the shopping list, sent to a Walmart cart.
 *
 * Blake: "When I am no longer using the storehouse I'll need to buy the
 * items." Walmart has no open API for a cart, but it has a link that opens
 * one already filled: walmart.com/sc/cart/addToCart?items=ID_QTY,ID_QTY — the
 * one MacroRx used. Each food carries the pack it is bought as
 * (tools/walmart.js, into PANTRY); the packs are the grams over the grams in
 * one, rounded up. A food with no pack gets a grocery search, and an item
 * number pasted here is this device's (sh.wm) and wins over the book's.
 *
 * Out of app.js, whole: it reads window.PANTRY and localStorage and nothing
 * of the app's own. app.js asks it for the block (Walmart.html) on the list
 * and the plan sheet, for the lines and the link on Today, and hands it what
 * is typed in an item-number box (Walmart.parse, Walmart.setOwn), then draws
 * again. Loaded before app.js.
 */
window.Walmart = (function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  var WM_KEY = 'sh.wm';
  function wmOwn() {
    try { var o = JSON.parse(localStorage.getItem(WM_KEY)); return o && typeof o === 'object' ? o : {}; }
    catch (e) { return {}; }
  }
  function wmSetOwn(k, id) {
    var o = wmOwn();
    if (id) o[k] = id; else delete o[k];
    try { localStorage.setItem(WM_KEY, JSON.stringify(o)); } catch (e) { /* private */ }
  }
  /* An item number from what was pasted: the number itself, or a product
     address, which ends in it (walmart.com/ip/name/10447842?...). */
  function wmParseId(v) {
    v = String(v || '').trim().replace(/^(?:item\s*#?\s*|#\s*)/i, '');
    var m = v.match(/\/ip\/(?:[^\/?#]*\/)?(\d{5,12})/) || v.match(/^(\d{5,12})$/);
    return m ? m[1] : '';
  }
  function wmSearchURL(q) {
    return 'https://www.walmart.com/search?q=' + encodeURIComponent(String(q).replace(/\(.*?\)/g, '').trim()) + '&cat_id=976759';
  }
  /* items: [{ key, label, g }] as the list builds them. */
  function wmLines(items) {
    var P = window.PANTRY || {}, own = wmOwn(), by = {}, order = [];
    items.forEach(function (b) {
      var k = b.key, g = b.g || 0, d = P[k];
      if (d && d.wa) { g *= d.wa[1]; k = d.wa[0]; d = P[k]; }
      if (!by[k]) {
        var wm = d && d.wm;
        by[k] = { key: k, label: (d && d.l) || b.label, g: 0, id: own[k] || (wm ? wm[0] : ''),
          pack: wm ? wm[1] : 0, name: own[k] ? '' : (wm ? wm[2] : ''), own: !!own[k] };
        order.push(k);
      }
      by[k].g += g;
    });
    var cart = [], find = [], away = [];
    order.forEach(function (k) {
      var l = by[k], we = P[k] && P[k].we;
      /* Not a Walmart food at all: where it is bought instead. */
      if (we && !l.own) { away.push({ key: k, label: l.label, where: we[0], url: we[1] }); return; }
      if (l.g <= 0) return;
      l.qty = l.pack ? Math.min(12, Math.max(1, Math.ceil(l.g / l.pack - 0.1))) : 1;
      (l.id ? cart : find).push(l);
    });
    return { cart: cart, find: find, away: away };
  }
  function wmCartURL(cart) {
    return 'https://www.walmart.com/sc/cart/addToCart?items=' +
      cart.map(function (l) { return l.id + '_' + l.qty; }).join(',');
  }
  var WM_MARK = '<svg class="wm-spark" viewBox="0 0 24 24" aria-hidden="true"><g fill="currentColor">' +
    [0, 60, 120, 180, 240, 300].map(function (a) {
      return '<rect x="10.8" y="1.5" width="2.4" height="7.5" rx="1.2" transform="rotate(' + a + ' 12 12)"/>';
    }).join('') + '</g></svg>';
  /* The block: one button for everything matched, a search for what is not,
     and under a fold, the product each line goes in as, to change. */
  function wmHTML(items) {
    var L = wmLines(items);
    if (!L.cart.length && !L.find.length && !L.away.length) return '';
    var n = L.cart.reduce(function (t, l) { return t + l.qty; }, 0);
    var row = function (l) {
      return '<div class="wm-row"><div class="wm-rt"><b>' + esc(l.label) + '</b>' +
        '<span>' + (l.id ? (l.qty > 1 ? l.qty + ' × ' : '') + esc(l.name || 'item ' + l.id) : 'not matched yet') + '</span></div>' +
        '<a class="wm-look" href="' + esc(wmSearchURL(l.label)) + '" target="_blank" rel="noopener">Find ↗</a>' +
        '<input class="wm-id" data-wmid="' + esc(l.key) + '" inputmode="numeric" placeholder="Item # or link" value="' + (l.own ? esc(l.id) : '') + '" aria-label="Walmart item number for ' + esc(l.label) + '">' +
      '</div>';
    };
    return '<div class="wm">' +
      (L.cart.length ? '<a class="wm-btn" href="' + esc(wmCartURL(L.cart)) + '" target="_blank" rel="noopener">' + WM_MARK +
        'Add ' + L.cart.length + (L.cart.length === 1 ? ' item' : ' items') + ' to Walmart cart</a>' : '') +
      '<div class="wm-sub">' + (L.cart.length ? 'Opens Walmart with ' + (n === L.cart.length ? 'them' : n + ' packs') + ' in your cart. ' : '') +
        (L.find.length ? L.find.length + ' to find yourself: ' + L.find.map(function (l) {
          return '<a href="' + esc(wmSearchURL(l.label)) + '" target="_blank" rel="noopener">' + esc(l.label) + '</a>';
        }).join(', ') : '') +
        (L.away.length ? '<span class="wm-away">' + L.away.map(function (l) {
          return esc(l.label) + ': <a href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(l.where) + ' \u2197</a>';
        }).join(' \u00b7 ') + '</span>' : '') + '</div>' +
      '<details class="wm-fix"><summary>Check the products \u203a</summary>' +
        '<p>Paste an item number, or the product’s walmart.com link, to use a different product.</p>' +
        L.find.concat(L.cart).map(row).join('') + '</details>' +
    '</div>';
  }

  // the suite's door in (tests/walmart.test.js)
  window.__wm = { lines: wmLines, url: wmCartURL, parse: wmParseId };

  return { html: wmHTML, lines: wmLines, url: wmCartURL, parse: wmParseId, setOwn: wmSetOwn, mark: WM_MARK };
})();
