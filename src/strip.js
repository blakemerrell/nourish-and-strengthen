/* The top of the page, held still: the header's height for everything that
 * pins under it (syncStick), and on Recipes the search + quick-chip strip
 * whose Filters button is always ready to unfold the filter drawer right below
 * it (filtCount, syncStrip, onScrollStrip, filtersPop).
 *
 * A part of app.js in a file of its own. app.js calls HiveParts.strip(app)
 * once, as it starts, handing over the one thing of its own it reads, the
 * app's state S, and keeps the five under their own names for the scroll,
 * resize and click handlers there. Loaded before app.js.
 */
(window.HiveParts = window.HiveParts || {}).strip = function (app) {
  'use strict';

  // what it reads of the app's
  var S = app.S;

  function $(id) { return document.getElementById(id); }

  function syncStripH() {
    var st = $('brwStrip'), sec = $('view-browse');
    if (!st || !sec || S.view !== 'browse') return;
    var sh = Math.round(st.getBoundingClientRect().height);
    if (sh > 0) sec.style.setProperty('--brw-strip-h', sh + 'px');
  }

  function syncStick() {
    var tb = document.querySelector('.topbar');
    if (tb) {
      /* Hidden, as it is while a workout runs full screen, it measures
         nothing, and nothing is what every view would then pin to. */
      var h = Math.round(tb.getBoundingClientRect().height);
      if (h) document.documentElement.style.setProperty('--topbar-h', h + 'px');
    }
    var bn = document.querySelector('.bottom-tabs');
    if (bn) {
      var bh = Math.round(bn.getBoundingClientRect().height);
      if (bh) document.documentElement.style.setProperty('--bottom-nav-h', bh + 'px');
    }
    syncStripH();
  }

  /* ---- The search + quick-chip row on Recipes ---- */
  var stripRaf = 0;
  function filtCount() {
    var n = 0;
    if (S.bookF !== 'all') n++;
    if (S.secF !== 'all') n++;
    if (S.diffF !== 'all') n++;
    if (S.pantryF !== 'all') n++;
    if (S.sort !== 'book') n++;
    if (S.favOnly) n++;
    if (S.quickF) n++;
    return n;
  }
  function syncStrip() {
    stripRaf = 0;
    var st = $('brwStrip'), sec = $('view-browse');
    var bar = document.querySelector('#view-browse .filters');
    if (!st || !sec || !bar) return;
    if (S.view !== 'browse') {
      sec.classList.remove('stripped');
      filtersPop(false);
      return;
    }
    syncStripH();
    if (bar.classList.contains('pop')) return;
    var on = (window.scrollY || window.pageYOffset || 0) > 4;
    if (on !== sec.classList.contains('stripped')) sec.classList.toggle('stripped', on);
  }
  function onScrollStrip() {
    if (stripRaf) return;
    stripRaf = requestAnimationFrame(syncStrip);
  }
  /* The real filter drawer, unfolded right below the search + quick-chip strip. */
  function filtersPop(open) {
    var bar = document.querySelector('#view-browse .filters');
    var scrim = $('brwScrim');
    var btn = $('filtBtn');
    var st = $('brwStrip');
    if (open && bar && st) {
      var top = Math.round(st.getBoundingClientRect().bottom);
      var bn = document.querySelector('.bottom-tabs');
      var bh = bn ? Math.round(bn.getBoundingClientRect().height) : 0;
      bar.style.top = top + 'px';
      bar.style.maxHeight = 'calc(100vh - ' + (top + bh) + 'px)';
      if (scrim) {
        scrim.style.top = top + 'px';
        scrim.style.bottom = bh + 'px';
      }
    } else if (bar) {
      bar.style.top = '';
      bar.style.maxHeight = '';
      if (scrim) {
        scrim.style.top = '';
        scrim.style.bottom = '';
      }
    }
    if (open === S.filtPop) return;
    S.filtPop = open;
    if (bar) bar.classList.toggle('pop', open);
    if (scrim) scrim.classList.toggle('hide', !open);
    if (btn) btn.setAttribute('aria-expanded', String(open));
  }

  return { syncStick: syncStick, filtCount: filtCount, syncStrip: syncStrip, onScrollStrip: onScrollStrip, filtersPop: filtersPop };
};
