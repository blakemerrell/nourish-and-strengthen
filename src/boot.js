/* The worker's registration and the reload onto a new build, and the
   browser's offer to install the app, kept for Sync & sharing. An inline
   script in index.html until the content-security policy refused inline
   scripts; see src/theme.js. */
/* Keeps the app openable with no signal. Needs a real server, so it is skipped
   when the page is opened straight off the disk.

   updateViaCache:'none' stops the browser serving sw.js itself out of its HTTP
   cache, which is the thing that pins a phone to an old build: the worker never
   changes, so it never activates, so the new cache is never built.

   And when a new worker does take over, reload once. Without that, a deployment
   is only visible on the *second* open — you look, see the old app, and have no
   reason to look again. hadWorker keeps the first install quiet, where there is
   nothing to update to. */
if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
  var hadWorker = !!navigator.serviceWorker.controller;
  var reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (!hadWorker || reloading) return;
    reloading = true;
    /* Not while somebody is halfway through anything. The new worker is
       already in charge either way; this reload only swaps the scripts on
       screen, and it can wait for the length of an edit rather than throwing
       one away with no warning and no draft. It was only the recipe editor;
       a past workout being corrected, a dish in the Nourish basket, a block
       being built or a number half typed went too. Any open sheet or dialog,
       a box with the cursor in it, or Strengthen saying it is mid-way, and
       the reload waits for the next plain screen. */
    var busy = function () {
      if (window.__editing) return true;
      var a = document.activeElement;
      if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return true;
      if (document.querySelector('#modalRoot .sheet, #trainRoot .sheet, #dialogRoot .dlg')) return true;
      try { if (window.Train && window.Train.busy && window.Train.busy()) return true; } catch (e) { /* not up */ }
      return false;
    };
    (function go() {
      if (busy()) { setTimeout(go, 2000); return; }
      location.reload();
    })();
  });
  addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' })
      .then(function (reg) {
        /* A promise, so the try below it could never have caught it: with no
           signal it rejected on every open, as an uncaught error. */
        var ask1 = function () { var u = reg.update(); if (u && u.catch) u.catch(function () { /* no signal; the next one will do */ }); };
        ask1();
        /* And a new worker left waiting is asked again to take over.
         *
           It is meant to take over the moment it has installed, and nearly
           always does. Now and then the browser holds the switch while the
           old worker is still serving this page's scripts and never comes
           back to it: measured, under load, eight opens in thirty-two left
           the new build installed and waiting for a minute and more with
           nothing in flight, and the six of those asked again (sw.js listens
           for 'skip') each took over within a second. So while one waits it is
           asked every two seconds, half a minute at most, and once more each
           time another finishes installing. */
        var nudges = 0;
        var nudge = function () {
          if (!reg.waiting || nudges >= 15) return;
          nudges++;
          reg.waiting.postMessage('skip');
          setTimeout(nudge, 2000);
        };
        var watch = function (w) {
          if (!w) return;
          w.addEventListener('statechange', function () {
            if (w.state === 'installed') { nudges = 0; nudge(); }
          });
        };
        reg.addEventListener('updatefound', function () { watch(reg.installing); });
        watch(reg.installing);
        nudge();
        /* And keep asking. Everything downstream of this was already right —
           the worker is not HTTP-cached, it takes over the moment it installs,
           and the page reloads itself once it does — but the browser only ever
           ASKED on load. A phone with the app left open sat on whatever build
           it had started with, through any number of deploys, until it was
           cold-started. Blake, after a morning of it: "I'm still not seeing
           the changes live on my app and it's been awhile. What's going on."
         *
           Two triggers, both cheap. Coming back to the app is the moment a
           check is worth most and costs least: one conditional request against
           sw.js, which is a few hundred bytes and answers 304 almost always.
           The timer covers the app being left in front of you.
         *
           Not more often than MIN_GAP, whichever trigger fires — flicking
           between apps must not turn into a request per flick. */
        /* Only once this page is already controlled by a worker. On a first
           install there is nothing to update FROM: the worker is mid-install,
           asking again races its own activation, and the reload above is
           deliberately disabled for exactly that case (hadWorker). Arming the
           checks anyway made a fresh page reload itself out from under
           whatever was happening on it, which in the suite was a click. */
        if (!hadWorker) return;
        var MIN_GAP = 60000, EVERY = 900000, last = Date.now();
        var ask = function () {
          if (Date.now() - last < MIN_GAP) return;
          last = Date.now();
          try { ask1(); } catch (e) { /* torn down; the next one will do */ }
        };
        document.addEventListener('visibilitychange', function () {
          if (!document.hidden) ask();
        });
        addEventListener('focus', ask);
        setInterval(ask, EVERY);
      })
      .catch(function () {});
  });
}

/* Installing the app from inside it: Sync & sharing → On your home screen.
 *
   Blake, 2026-10-12, after the repository was renamed and the app moved to
   a new address: Chrome's ⋮ → Install said "This app is already installed —
   open the app instead", and opening it said "Could not open app". Nothing
   was installed at the new address (chrome://webapks had no Hive at all).
   What fixed it, the next day, was clearing Chrome's cache: Chrome had been
   holding a stale record that the app was installed, most likely from the
   old address, and its menu went by that. (It was first put down to Treasure
   Up, another app on the same blakemerrell.github.io; that the cache cleared
   it says otherwise.) The page's own offer, beforeinstallprompt, is a
   separate way in, so it is kept here for a button in the app's one sheet
   of settings, which also says plainly when no offer was made.
 *
   Kept, not taken over: no preventDefault, so Chrome's own install pop-up
   still shows when it would have. An offer can be used once; after that the
   browser makes a new one on a later visit, or does not. The sheet is told
   of every change with a 'hiveinstall' event on window, because app.js is
   up before this file and cannot ask for it by name at start.
 *
   Never offered by Safari on an iPhone, which installs only from Share → Add
   to Home Screen, so that is said instead. */
window.Install = (function () {
  'use strict';
  var offer = null, step = '';
  var tell = function () {
    try { window.dispatchEvent(new window.Event('hiveinstall')); } catch (e) { /* too old to draw the sheet anyway */ }
  };
  addEventListener('beforeinstallprompt', function (e) {
    offer = e;
    if (step !== 'wait') step = '';
    tell();
  });
  addEventListener('appinstalled', function () {
    offer = null;
    step = 'done';
    tell();
  });
  function standalone() {
    try { if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true; } catch (e) { /* no media queries */ }
    return navigator.standalone === true;
  }
  function ios() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }
  return {
    /* 'app' running as the installed app; 'done' just installed; 'wait'
       asked, not yet on the home screen; 'offer' the browser will install it
       now; 'no' turned down this time; 'ios' Safari's own way; '' nothing
       offered on this visit. */
    state: function () {
      if (standalone()) return 'app';
      if (step) return step;
      if (offer) return 'offer';
      return ios() ? 'ios' : '';
    },
    ask: function () {
      var o = offer;
      if (!o) return;
      offer = null;
      step = 'wait';
      tell();
      try { o.prompt(); } catch (e) { step = ''; tell(); return; }
      if (o.userChoice && o.userChoice.then) {
        o.userChoice.then(function (c) {
          if (step === 'wait' && (!c || c.outcome !== 'accepted')) { step = 'no'; tell(); }
        }, function () { step = 'no'; tell(); });
      }
    }
  };
})();
