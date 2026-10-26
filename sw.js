/* ---------------------------------------------------------------------------
 * Service worker — so the app opens with no signal.
 *
 * Firestore already keeps the data offline. What it could not do was hand you
 * the app itself: tapping the icon on a home screen in a storehouse basement
 * meant a browser error page, because index.html, the stylesheet, the scripts
 * and the recipes all had to come off the network first. They are cached here.
 *
 * Three rules, because they answer different questions:
 *
 *   the page itself   network first, cache as a fallback. Online, you always
 *                     get the current index.html, so a deployment lands on the
 *                     very next load. Offline, you get the last one that worked.
 *   a versioned file  from the cache, and nothing else. Its URL carries the
 *                     build (?v=), so the copy under that URL cannot be out of
 *                     date — a new build is a new URL. Fetching it again on
 *                     every open to find it identical was a dozen requests and
 *                     two and a half megabytes of cache writes a load, for
 *                     nothing.
 *   everything else   cache first, and quietly fetch a fresh copy afterwards
 *                     for next time. Nothing waits on the network.
 *
 * Anything not on this origin — the Firebase SDK, Firestore itself — is left
 * alone entirely and goes straight to the network, where the SDK's own offline
 * handling takes over.
 * ------------------------------------------------------------------------- */

/* Which build this is. Nobody types it: tools/build-site.js writes it in when
   it builds the site for deployment, as a hash of the files it covers — the
   shell, the scripts, the data and this worker — so the same files always come
   out as the same version and different files never do.
 *
   It used to be a number bumped by hand, and that was two problems. A bump
   forgotten left phones on the old files indefinitely, which reached main
   eleven times. And two branches cut from one commit both picked the next
   number, so every merge conflicted on ten lines of index.html and eleven of
   this file that nobody had meant to change.
 *
   '0' is what the repository itself says, before a build. A worker served
   straight from the files — a local server, or Pages still set to deploy from
   the branch — knows it is unbuilt and behaves as one: see DEV below. Zero
   rather than a word, for the sake of the workers already on phones: they
   read a page's version as digits, and a page with no digits there looks to
   them like a page with no version at all, which they would keep over the
   one that works. */
var VERSION = '0';

/* The pictures and typefaces have a version of their own, a hash of just
   those files. They are three and a half megabytes of the four, and they
   hardly ever change: a deploy that moves a comma in app.js should not have
   every phone download every engraving again. */
var ART_VERSION = '0';

var CACHE = 'storehouse-v' + VERSION;
var ART = 'storehouse-art-' + ART_VERSION;

/* Unbuilt. Every URL says ?v=0 whatever is in the file, so a URL no longer
   names a set of bytes and "versioned means never stale" stops being true.
   Everything goes to the network first here, and the cache is what is left
   when there is no network: local work shows on the next reload, and a site
   served raw from the branch still takes every push rather than pinning
   phones to whatever they happened to cache first. */
var DEV = VERSION === '0';

/* The app itself. If any one of these does not arrive, the install fails and
   the phone keeps the worker and the caches it already had.
 *
   './' is not listed, only './index.html'. They are the same file, and
   listing both downloaded it twice on every install. A navigation to the
   app's address finds './index.html' in the handler below, which is what
   answers for the root when nothing is kept under the root itself. */
var CORE = [
  './index.html',
  './src/style.css?v=0',
  './src/theme.js?v=0',
  './src/config.js?v=0',
  './src/sync.js?v=0',
  './src/train.js?v=0',
  './src/door.js?v=0',
  './src/today.js?v=0',
  './src/shelf.js?v=0',
  './src/walmart.js?v=0',
  './src/list.js?v=0',
  './src/book.js?v=0',
  './src/strip.js?v=0',
  './src/fold.js?v=0',
  './src/mealtime.js?v=0',
  './src/mydayparts.js?v=0',
  './src/combos.js?v=0',
  './src/pool.js?v=0',
  './src/daysync.js?v=0',
  './src/clock.js?v=0',
  './src/dayup.js?v=0',
  './src/twocopies.js?v=0',
  './src/kitchen.js?v=0',
  './src/invites.js?v=0',
  './src/signin.js?v=0',
  './src/fit.js?v=0',
  './src/portion.js?v=0',
  './src/shares.js?v=0',
  './src/training.js?v=0',
  './src/plans.js?v=0',
  './src/burn.js?v=0',
  './src/dayflags.js?v=0',
  './src/weighin.js?v=0',
  './src/scale.js?v=0',
  './src/morning.js?v=0',
  './src/weighcard.js?v=0',
  './src/checkin.js?v=0',
  './src/budget.js?v=0',
  './src/follow.js?v=0',
  './src/daystore.js?v=0',
  './src/toast.js?v=0',
  './src/placing.js?v=0',
  './src/weekstrip.js?v=0',
  './src/myday.js?v=0',
  './src/gauges.js?v=0',
  './src/charts.js?v=0',
  './src/keep.js?v=0',
  './src/favpick.js?v=0',
  './src/copyfrom.js?v=0',
  './src/foodsheet.js?v=0',
  './src/dayfoot.js?v=0',
  './src/pickrow.js?v=0',
  './src/pickbands.js?v=0',
  './src/picksheet.js?v=0',
  './src/pickgap.js?v=0',
  './src/closers.js?v=0',
  './src/query.js?v=0',
  './src/shelves.js?v=0',
  './src/pickhome.js?v=0',
  './src/goalwords.js?v=0',
  './src/account.js?v=0',
  './src/foodsearch.js?v=0',
  './src/barcode.js?v=0',
  './src/lookup.js?v=0',
  './src/camera.js?v=0',
  './src/plandays.js?v=0',
  './src/summary.js?v=0',
  './src/plansheet.js?v=0',
  './src/plansteps.js?v=0',
  './src/planfacts.js?v=0',
  './src/planlive.js?v=0',
  './src/fillday.js?v=0',
  './src/toppers.js?v=0',
  './src/balance.js?v=0',
  './src/daycopy.js?v=0',
  './src/mealtools.js?v=0',
  './src/app.js?v=0',
  './src/boot.js?v=0',
  './data/recipes.js?v=0',
  './data/nutrition.js?v=0',
  './data/art.js?v=0',
  './data/qr.js?v=0',
  './manifest.webmanifest'
];

/* Pictures and typefaces, kept in ART. Worth having offline, not worth
   failing over. */
var EXTRAS = [
  './art/batch-prep.png',
  './art/best-before-bed.png',
  './art/breakfasts.png',
  './art/dinner.png',
  './art/easy-lunches-wraps-and-after-school-favorites.png',
  './art/elaborate-sunday-feasts-and-roasts.png',
  './art/for-the-love-of-chocolate.png',
  './art/kid-approved-weeknight-comfort-dinners.png',
  './art/lunch.png',
  './art/made-not-bought.png',
  './art/power-drinks.png',
  './art/simple-family-treats-and-desserts.png',
  './art/snacks.png',
  './art/speedy-weekday-breakfasts-and-morning-treats.png',
  './art/the-copycat-shelf.png',
  './art/worth-the-afternoon.png',
  './fonts/source-serif-4-latin-wght-normal.woff2',
  './fonts/source-serif-4-latin-wght-italic.woff2',
  './fonts/work-sans-latin-wght-normal.woff2',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-180.png',
  './icons/icon-32.png'
];

/* The cover thumbnails on the print screen, which go with the app rather than
   with the engravings. A cover is page one of a printed book, and it changes
   whenever the book's cover does — every time a recipe is added, since the
   count is on it. In the art cache, twenty-eight kilobytes of covers would
   have moved the art version and sent every phone for the three and a half
   megabytes beside them. Here they are fetched fresh into this build's cache
   at every install, where the app's version covers them, and like the
   pictures they are allowed to fail.
 *
   Their own list, not the end of EXTRAS: prep-art.js rewrites the run of
   './art/...' lines at the top of that array from the engraving manifest,
   and would write anything else of that shape straight out again. */
var COVERS = [
  './art/covers/all.webp',
  './art/covers/one.webp',
  './art/covers/1.webp',
  './art/covers/2.webp'
];

/* The builds a page was written for: every ?v= it carries. A page is this
   worker's own when it names this build and no other. A page with none —
   the privacy notice — belongs to no build in particular. */
function pageVersions(html) {
  var seen = {}, out = [], re = /[?&]v=([\w.-]+)/g, m;
  while ((m = re.exec(html))) if (!seen[m[1]]) { seen[m[1]] = 1; out.push(m[1]); }
  return out;
}

/* The pictures, by the address a request for one will arrive with. */
var IS_ART = {};
EXTRAS.forEach(function (u) {
  var a = new URL(u, self.location);
  IS_ART[a.pathname + a.search] = true;
});

self.addEventListener('install', function (e) {
  e.waitUntil(
    Promise.all([caches.open(CACHE), caches.open(ART)])
      .then(function (open) {
        var core = open[0], art = open[1];
        /* Split, because "one missing file must not take the whole install
           down with it" was only half right. It is true of a section
           illustration and false of app.js: every fetch failure was swallowed,
           install resolved anyway, and activate then deleted the previous
           cache — so a phone updating on a flaky connection ended up with a
           new cache missing the scripts and no old cache to fall back on. The
           app it had been opening offline for months stopped opening at all.
           The core must all arrive or the install fails, which leaves the
           working worker and its cache exactly where they were. */
        /* 'reload' for the same reason the navigate handler uses 'no-cache':
           GitHub Pages serves these with max-age=600, and cache.add() goes
           through the browser's own HTTP cache. So a new service worker could
           seed its brand-new cache with files up to ten minutes old, and then
           serve them from the cache for as long as that cache lived. The
           versioned URLs were never at risk — a new ?v= is a URL the HTTP
           cache has never seen — but the page and the pictures carry none, so
           the shell does not trust the HTTP cache to say what is current. */
        var get = function (c, u) {
          return fetch(u, { cache: 'reload' }).then(function (res) {
            if (!res || !res.ok) throw new Error(u);
            return c.put(u, res);
          });
        };
        /* The page first, and it has to be this build's page.
         *
           A deploy is not one moment everywhere. The CDN in front of Pages
           holds a copy for up to ten minutes, so a worker from the new build
           can be handed the old index.html. Kept, that is a page asking for
           scripts under a version this cache does not hold: fine online, a
           blank screen in a basement. So an install handed another build's
           page fails, the phone keeps the worker it has, and the browser
           tries again at its next check, by which time the edge has caught
           up. */
        return fetch('./index.html', { cache: 'reload' }).then(function (res) {
          if (!res || !res.ok) throw new Error('./index.html');
          return res.clone().text().then(function (html) {
            var v = pageVersions(html);
            if (v.length !== 1 || v[0] !== VERSION) {
              throw new Error('index.html is build ' + (v.join(', ') || 'none') +
                '; this worker is ' + VERSION);
            }
            return core.put('./index.html', res);
          });
        }).then(function () {
          return Promise.all(CORE.filter(function (u) { return u !== './index.html'; })
            .map(function (u) { return get(core, u); }));
        }).then(function () {
          /* The rest is pictures and typefaces: nice to have offline, not
             the app. Most installs find them here already — the art cache is
             named for the pictures, so a deploy that did not touch them
             opens the same cache the last worker filled — and only what is
             missing is fetched, which is usually nothing at all. The covers
             are always fetched, into this build's own cache. */
          return Promise.all(EXTRAS.map(function (u) {
            return art.match(u).then(function (hit) {
              return hit || get(art, u).catch(function () {});
            });
          }).concat(COVERS.map(function (u) {
            return get(core, u).catch(function () {});
          })));
        });
      })
      .then(function () { return self.skipWaiting(); }, function (err) {
        /* Nothing half-filled left behind. The name belongs to this build
           alone — a different worker is a different hash — so it is nobody
           else's cache being emptied. Unbuilt, every worker is version 0
           and they share the one name, so there it is left alone. The
           pictures are kept either way: they are right for the next try. */
        return (DEV ? Promise.resolve() : caches.delete(CACHE))
          .then(function () { throw err; });
      })
  );
});

/* Asked again to take over. The install above ends by saying skipWaiting,
   and nearly always the new worker then takes over at once. But while the
   old worker is still serving the page's scripts the browser holds the
   switch back, and now and then it never returns to it: the new worker sat
   installed and waiting for a minute and more with no request open, the
   phone on the old build until the app was closed. Asked again once it is
   quiet, it takes over within a second; src/boot.js does the asking. */
self.addEventListener('message', function (e) {
  if (e.data === 'skip') self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      /* Every other build's caches go. This build's stay, and so does the
         art cache it opened, which is usually the one the last worker had.
         Only ours: every project page on <someone>.github.io shares one
         origin and so one set of caches, and deleting everything that was
         not this worker's took theirs along with it. */
      return Promise.all(keys.filter(function (k) {
        return k.indexOf('storehouse-') === 0 && k !== CACHE && k !== ART;
      }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* The network's answer, unless it fails or is so slow that the last copy that
   worked should be shown instead. A network that neither answers nor fails —
   a captive portal, one bar in a basement — held a white screen until it gave
   up, twenty seconds on, and then showed its error page. After four seconds
   the kept copy is shown; a deploy still lands, the next time. */
function netOrKept(net, kept, none) {
  return new Promise(function (resolve) {
    var done = false;
    var give = function (r) { if (!done && r) { done = true; resolve(r); } };
    var slow = setTimeout(function () { kept().then(give); }, 4000);
    net.then(function (res) {
      clearTimeout(slow);
      // a server error is not the file either, when there is one to show
      if (res.status >= 500) return kept().then(function (hit) { give(hit || res); });
      give(res);
    }, function () {
      clearTimeout(slow);
      kept().then(function (hit) { give(hit || none()); });
    });
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // Firestore and the SDK

  /* The rendered books are five megabytes and are wanted once, at a desk, on
     the way to a print shop. Keeping them on a phone for a shopping trip would
     be the wrong five megabytes. */
  if (url.pathname.indexOf('/print/') >= 0) return;

  /* And the landing page, for a subtler reason. Its markup is network-first
     like any navigation, so the words on it are never stale — but the eight
     demo frames beside them are ordinary sub-resources, which the handler below
     serves cache-first and only refreshes for next time. Their filenames do not
     change when they are rebuilt, so a phone that had seen the page once would
     go on showing frames from the previous build while the text around them was
     current: exactly the failure data/recipes.js had, one directory over.

     Versioning eight filenames would fix it, and so does this, which also costs
     nothing anyone wants. Nobody opens a landing page with no signal — it is
     the page you send to somebody who has not got the app yet. */
  if (url.pathname.indexOf('/welcome/') >= 0) return;

  if (req.mode === 'navigate') {
    /* 'no-cache' revalidates with the server instead of trusting the browser's
       own HTTP cache. GitHub Pages serves index.html with max-age=600, so
       without this a deployment could not land for ten minutes: the fetch below
       would be answered out of the HTTP cache with the previous index.html,
       still pointing at the previous ?v= of the scripts, and the app would go
       on looking unchanged for no reason anyone could see. The server answers
       304 when nothing moved, so this costs a round trip, not a download. */
    /* The copy kept for no signal: this page's own, or for the app's
       address, the shell. */
    var kept = function () {
      return caches.match(req).then(function (hit) {
        /* The shell answers for the app's own address and nothing else.
           It used to answer for any same-origin path, so a mistyped or
           dead URL came back as a working-looking cookbook rather than as
           a page that could not be found. */
        if (hit) return hit;
        var root = new URL('./', self.location).pathname;
        if (url.pathname === root || url.pathname === root + 'index.html') return caches.match('./index.html');
        return null;
      });
    };
    var net = fetch(req, { cache: 'no-cache' }).then(function (res) {
      /* Only a real answer from this origin gets kept. Anything that came
         back was being written over the cached page before — so a hotel
         wifi login screen, which is a perfectly successful 200 for a
         document that is not this one, or a 502 from a bad deploy, became
         the copy the phone opened with no signal from then on. A page that
         will not load is recoverable; a page that loads and is wrong is
         the one somebody stands in a basement arguing with.
       *
         And only a page whose scripts are this worker's own. A deploy met
         on one bar of signal brought the new index.html but not the new
         scripts it points at; kept here over the last page, it left a
         phone with no signal holding a page whose scripts were in no
         cache: a blank, dead shell until the signal came back. The new
         page is kept by the new worker, which caches it with its scripts
         or not at all. */
      if (res && res.ok && res.type === 'basic') {
        var copy = res.clone(), probe = res.clone();
        probe.text().then(function (html) {
          var v = pageVersions(html);
          if (v.length && (v.length > 1 || v[0] !== VERSION)) return;
          return caches.open(CACHE).then(function (c) { return c.put(req, copy); });
        }).catch(function () { /* kept next time */ });
      }
      return res;
    });
    e.respondWith(netOrKept(net, kept, function () {
      return new Response('Not available offline.', { status: 404, headers: { 'content-type': 'text/plain' } });
    }));
    return;
  }

  var key = url.pathname + url.search;
  var isArt = IS_ART[key] || url.pathname.indexOf('/art/lifts/') >= 0;

  /* Unbuilt: the network first for everything, and the cache for no signal. */
  if (DEV) {
    var into = isArt ? ART : CACHE;
    e.respondWith(netOrKept(
      fetch(req, { cache: 'no-cache' }).then(function (res) {
        if (res && res.status === 200 && res.type === 'basic') {
          var fresh = res.clone();
          caches.open(into).then(function (c) { c.put(req, fresh); });
        }
        return res;
      }),
      function () { return caches.match(req); },
      function () { return Response.error(); }));
    return;
  }

  /* A picture or a typeface: from its own cache, which is named for exactly
     these bytes, so there is nothing to go and check. Fetched and kept only
     when the install missed it. */
  if (isArt) {
    e.respondWith(caches.open(ART).then(function (c) {
      return c.match(req).then(function (hit) {
        return hit || fetch(req).then(function (res) {
          if (res && res.status === 200) c.put(req, res.clone());
          return res;
        });
      });
    }));
    return;
  }

  /* A file whose address carries a build. The cache is the answer, and the
     network is asked only when it has nothing. Only this build's own files
     are kept: an old page still open mid-update, or a new one ahead of its
     worker, must not leave another build's files in this build's cache. */
  var v = url.searchParams.get('v');
  if (v) {
    e.respondWith(caches.match(req).then(function (hit) {
      return hit || fetch(req).then(function (res) {
        if (res && res.status === 200 && v === VERSION) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      });
    }));
    return;
  }

  e.respondWith(
    caches.match(req).then(function (hit) {
      var live = fetch(req).then(function (res) {
        // the same-origin answer only: a captive portal's 200 would be kept until the next build
        if (res && res.status === 200 && res.type === 'basic') {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return hit; });
      return hit || live;
    })
  );
});
