/* ---------------------------------------------------------------------------
 * A phone that has the app, meeting the next build.
 *
 * Everything else in the suite opens one build and looks at it. The failures
 * that reached phones were all between two: scripts shipped under an old
 * cache name, a new page kept without its scripts, an install on a flaky
 * connection that deleted the only working cache. This builds a few sites
 * that differ the way real deploys differ, serves them one after another at
 * the same address, and watches the worker move between them.
 *
 * The sites are built here, from the repository, by tools/build-site.js —
 * the same build the deploy runs — with a line added to src/config.js to
 * make each one a different build, and without the books, which no step
 * here opens.
 * ------------------------------------------------------------------------- */

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const site = require('../tools/build-site.js');
const built = require('./site-check.js');

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp',
};

/* One address, whichever build is behind it — a service worker is tied to
   its origin, so the builds have to take turns at the same one. Every
   request is written down, so a test can say what was asked for; `fail`
   answers matching requests with a 404, `from` serves particular paths out
   of another build, and `down` refuses every connection. */
function server() {
  const s = { root: null, log: [], fail: null, from: {}, down: false };
  s.http = http.createServer((req, res) => {
    if (s.down) { req.socket.destroy(); return; }
    s.log.push(req.url);
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    if (s.fail && s.fail.test(req.url)) { res.writeHead(404); res.end('not found'); return; }
    const file = path.join(s.from[p] || s.root, path.normalize(p).replace(/^(\.\.[/\\])+/, ''));
    fs.readFile(file, (err, body) => {
      if (err) { res.writeHead(404); res.end('not found'); return; }
      res.writeHead(200, {
        'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      res.end(body);
    });
  });
  return new Promise((ok) => s.http.listen(0, '127.0.0.1', () => {
    s.base = 'http://127.0.0.1:' + s.http.address().port + '/';
    ok(s);
  }));
}

/* What the page can see: our caches and what is in them, and which build it
   is running. */
function look() {
  return (async () => {
    const out = { keys: (await caches.keys()).filter((k) => /^storehouse-/.test(k)).sort(), held: {} };
    for (const k of out.keys) {
      out.held[k] = (await (await caches.open(k)).keys()).map((r) => new URL(r.url).pathname + new URL(r.url).search);
    }
    out.tag = window.__BUILD_TAG || null;
    // the app opens on Today; the recipes are all there the moment Recipes is
    const rec = document.querySelector('.tab[data-view="browse"]');
    if (rec) rec.click();
    out.cards = document.querySelectorAll('.card').length;
    return out;
  })();
}

/* Ask for an update and wait for the new worker to finish one way or the
   other: 'activated', or 'redundant' when its install failed. */
function update() {
  return new Promise((resolve) => {
    navigator.serviceWorker.getRegistration().then((reg) => {
      const st = (w) => (w ? w.state : '-');
      const timer = setTimeout(() => resolve('no new worker (installing ' + st(reg.installing) + ', waiting ' + st(reg.waiting) +
        ', active ' + st(reg.active) + ')'), 20000);
      const follow = (w) => {
        const seen = () => {
          if (w.state === 'activated' || w.state === 'redundant') { clearTimeout(timer); resolve(w.state); }
        };
        w.addEventListener('statechange', seen);
        seen();
      };
      reg.addEventListener('updatefound', () => follow(reg.installing));
      /* The page asks for updates itself too (src/boot.js, on load and on
         focus), and one of its asks can find the new worker a moment before
         this listener is on: updatefound has been and gone. One already
         under way, or installed and waiting to take over, is followed
         rather than waited for. */
      if (reg.installing || reg.waiting) { follow(reg.installing || reg.waiting); return; }
      reg.update().catch(() => { /* a failed install may reject it; the state says */ });
    });
  });
}

module.exports = {
  name: 'Updating the app',
  async run(t) {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sr-upgrade-'));
    const only = (f) => !/^(print|welcome|store|privacy|share)\//.test(f);
    /* A build is made different by one line in config.js, which also lets
       the page say which one it is running. */
    const make = (tag, also) => site.build({
      out: path.join(tmp, tag), include: only,
      edit: (rel, buf) => {
        if (rel === 'src/config.js') return Buffer.concat([buf, Buffer.from('\n;window.__BUILD_TAG = ' + JSON.stringify(tag) + ';\n')]);
        return also ? also(rel, buf) : buf;
      },
    });
    const A = await make('A');
    const B = await make('B');
    const C = await make('C');
    const D = await make('D');
    /* E changes a picture as well: a few bytes after the end of an icon,
       which every decoder ignores and every hash does not. */
    const E = await make('E', (rel, buf) => rel === 'icons/icon-192.png' ? Buffer.concat([buf, Buffer.from('E')]) : buf);
    /* F changes a cover thumbnail, which is what a print run that changed a
       book's cover does — adding a recipe changes the count on it. */
    const F = await make('D', (rel, buf) => rel === 'art/covers/1.webp' ? Buffer.concat([buf, Buffer.from('F')]) : buf);

    t.ok('a changed script is a new version, and pictures that did not change keep theirs',
      new Set([A.version, B.version, C.version, D.version, E.version]).size === 5 &&
      A.art === B.art && B.art === C.art && C.art === D.art,
      [A, B, C, D, E].map((x) => x.version + '/' + x.art).join(' '));
    t.ok('and a changed picture is a new art version, and a new app version with it',
      E.art !== D.art && E.version !== D.version, D.art + ' -> ' + E.art);
    t.ok('while a new cover thumbnail is a new app version and leaves the art alone',
      F.version !== D.version && F.art === D.art, D.version + ' -> ' + F.version + ', art ' + D.art + ' -> ' + F.art);
    const wA = built.worker(A.out), wB = built.worker(B.out), wE = built.worker(E.out);
    const wC = built.worker(C.out), wD = built.worker(D.out);

    const srv = await server();
    const ctx = await t.browser.newContext({ viewport: { width: 900, height: 800 } });
    const p = await ctx.newPage();
    p.on('pageerror', (e) => t.ok('no uncaught error on the page', false, e.message));
    const see = async () => {
      /* The page may be reloading itself onto a new build; ask again. */
      for (let i = 0; i < 40; i++) {
        try { return await p.evaluate(look); } catch (e) { await p.waitForTimeout(250); }
      }
      return await p.evaluate(look);
    };
    const whole = (s, w) => w.CORE.every((u) => (s.held[w.CACHE] || []).indexOf(new URL(u, srv.base).pathname + new URL(u, srv.base).search) >= 0);
    const pictures = (s, w) => w.EXTRAS.every((u) => (s.held[w.ART] || []).indexOf(new URL(u, srv.base).pathname) >= 0);
    const asked = (re) => srv.log.filter((u) => re.test(u));
    /* The files the art cache holds, by the requests that would fetch them:
       the engravings and typefaces. The covers live under art/ too but go
       with the app and are fetched with it; the icons are left out for the
       favicon's sake, as above. */
    const ART_LIST = wA.EXTRAS.filter((u) => !/^\.\/icons\//.test(u)).map((u) => new URL(u, 'http://x/').pathname);
    const ART_FILES = new RegExp('^(' + ART_LIST.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')$');

    /* The app asks for an update itself, on load and on coming back. One
       still in flight when the server switches builds is merged with the
       test's own ask by the browser, and both answer for the OLD build: the
       new one is never seen, and the test waits out its timer on a phone
       that did nothing wrong. So before the switch that follows a reload:
       the page loaded, and any ask it made answered. Only there — settling
       asks again, and anywhere the server is already on another build than
       the phone, that ask would install it. */
    const settle = async () => {
      // the page may be reloading itself onto the build it just took
      for (let i = 0; i < 40; i++) {
        try {
          return await p.evaluate(async () => {
            if (document.readyState !== 'complete') await new Promise((r) => addEventListener('load', r, { once: true }));
            const reg = await navigator.serviceWorker.getRegistration();
            if (reg) { try { await reg.update(); } catch (e) { /* no signal, or an install that failed: either way, settled */ } }
          });
        } catch (e) { await p.waitForTimeout(250); }
      }
    };
    try {
      /* ---- the first visit ------------------------------------------- */
      srv.root = A.out;
      await p.goto(srv.base + 'index.html');
      await p.evaluate(() => navigator.serviceWorker.ready);
      await p.reload();
      await p.waitForTimeout(800);
      let s = await see();
      t.ok('the first visit keeps the app in one cache and its pictures in another',
        s.keys.join(' ') === [wA.ART, wA.CACHE].sort().join(' ') && whole(s, wA) && pictures(s, wA) && s.tag === 'A',
        JSON.stringify(s.keys) + ' running ' + s.tag);

      /* ---- opening it again -------------------------------------------
       *
       * Every open used to fetch every file again behind the page, to keep
       * the cache fresh: a dozen requests and two and a half megabytes of
       * cache writes, for files whose URL already says they cannot have
       * changed. The page is still asked for, network first; the worker is
       * asked after, as it should be; the rest comes out of the cache and
       * stays there. The icons are left out of the count because the
       * browser fetches a favicon for itself, around the worker. */
      srv.log = [];
      await p.reload();
      await p.waitForTimeout(1500);
      const again = asked(/[?&]v=|^\/(art|fonts)\//);
      t.ok('opening it again fetches none of its versioned files, pictures or typefaces',
        again.length === 0 && asked(/^\/(index\.html)?$/).length >= 1, again.join(' ') || srv.log.join(' '));

      /* ---- the next build, pictures unchanged -------------------------
       *
       * window.__editing holds the reload the page does once a new worker
       * takes over — the same hold a half-finished edit gets — so the caches
       * can be read before the page moves. */
      await p.evaluate(() => { window.__editing = true; });
      await settle();
      srv.root = B.out; srv.log = [];
      let st = await p.evaluate(update);
      s = await see();
      t.ok('the next build installs and takes over', st === 'activated', st + ' · asked: ' + srv.log.filter((u) => /sw\.js/.test(u)).join(' '));
      t.ok('and the previous build’s cache is deleted',
        s.keys.indexOf(wA.CACHE) < 0 && whole(s, wB), JSON.stringify(s.keys));
      t.ok('while the pictures stay where they were, not downloaded again',
        wB.ART === wA.ART && s.keys.indexOf(wB.ART) >= 0 && pictures(s, wB) && asked(ART_FILES).length === 0,
        JSON.stringify(s.keys) + ' ' + asked(ART_FILES).length + ' picture requests');
      /* Waited for, not timed. The page looks again every two seconds
         (src/boot.js), and on a loaded machine the reload landed after a
         fixed 2.6 s — inside the next step, where it tore down the context
         that step was evaluating in, and its own update check on load found
         the next build's worker before the step was listening for one. */
      const reloaded = p.waitForEvent('load', { timeout: 20000 }).catch(() => null);
      await p.evaluate(() => { window.__editing = false; });
      await reloaded;
      await p.waitForTimeout(300);
      s = await see();
      t.ok('and once nothing is in progress the page reloads onto it', s.tag === 'B' && s.cards > 100, s.tag + ', ' + s.cards + ' cards');

      /* ---- a build that cannot all be fetched -------------------------
       *
       * One bar of signal, or a deploy half propagated: app.js does not
       * arrive. The install has to fail rather than half-succeed, and the
       * phone has to be left exactly as it was — worker, cache and all — or
       * the next open with no signal is a blank page. */
      srv.root = C.out; srv.fail = /^\/src\/app\.js/; srv.log = [];
      st = await p.evaluate(update);
      s = await see();
      t.ok('a build whose scripts do not all arrive does not install',
        st === 'redundant' && asked(/^\/src\/app\.js\?v=/).length >= 1, st + '; ' + asked(/app\.js/).join(' '));
      t.ok('and the phone keeps the build it had, whole, with nothing half-filled beside it',
        s.keys.join(' ') === [wB.ART, wB.CACHE].sort().join(' ') && whole(s, wB) && pictures(s, wB) && s.keys.indexOf(wC.CACHE) < 0,
        JSON.stringify(s.keys));
      srv.fail = null;

      /* ---- a new worker handed the old page ---------------------------
       *
       * The CDN in front of Pages keeps copies for ten minutes, so for a
       * while after a deploy one request can get the new sw.js and the next
       * the old index.html. Cached together they are a page asking for
       * scripts no cache holds. */
      srv.root = D.out; srv.from = { '/index.html': B.out }; srv.log = [];
      st = await p.evaluate(update);
      s = await see();
      t.ok('a new worker handed the previous build’s page does not install over it',
        st === 'redundant' && s.keys.join(' ') === [wB.ART, wB.CACHE].sort().join(' ') && whole(s, wB) &&
        s.keys.indexOf(wD.CACHE) < 0, st + ' ' + JSON.stringify(s.keys));
      srv.from = {};

      /* And after both, it still opens with no signal at all, on B. */
      srv.down = true;
      await ctx.setOffline(true);
      await p.reload();
      await p.waitForTimeout(1500);
      s = await see();
      t.ok('after both, it still opens with no signal, on the build it kept',
        s.tag === 'B' && s.cards > 100, s.tag + ', ' + s.cards + ' cards');

      /* ---- new pictures ---------------------------------------------- */
      /* E is put up before the signal comes back, not after. The page asks
         for an update itself as it loads (src/boot.js), and on a busy runner
         the offline reload above can finish loading late: its ask reached
         the server in the moment between the signal coming back and E going
         up, fetched D, and was mid-install when the files under it changed
         to E's. It gave up, update() below followed it rather than asking
         again, and the check read "redundant, 0 picture requests" on main's
         run of #118 while passing everywhere else. With E already up, an
         early ask finds E, and is the update this check is waiting for. */
      await p.evaluate(() => { window.__editing = true; });
      srv.root = E.out; srv.log = [];
      await ctx.setOffline(false);
      srv.down = false;
      st = await p.evaluate(update);
      s = await see();
      t.ok('a build with a new picture gets a new art cache, and both old caches go',
        st === 'activated' && s.keys.join(' ') === [wE.ART, wE.CACHE].sort().join(' ') &&
        whole(s, wE) && pictures(s, wE) && ART_LIST.every((f) => srv.log.indexOf(f) >= 0),
        st + ' ' + JSON.stringify(s.keys) + ', ' + asked(ART_FILES).length + ' picture requests');
      await p.evaluate(() => { window.__editing = false; });
    } finally {
      await ctx.close();
    }

    /* ---- the phones out there now --------------------------------------
     *
     * Every installed copy of the app is running build 568's worker, which
     * is kept in tests/fixtures. The first build deployed by Actions meets
     * that worker, not this one, and it has its own idea of which pages to
     * keep: it reads a page's version with /v=(\d+)/ and keeps any page it
     * cannot read a number from. A hex hash starting with a letter would be
     * such a page, kept offline over the one that works while its scripts
     * sat in no cache; the version is written in decimal for that reason.
     * Here the old worker meets a built site and has to let go cleanly. */
    const old = path.join(tmp, 'old');
    fs.cpSync(A.out, old, { recursive: true });
    fs.copyFileSync(path.join(__dirname, 'fixtures', 'sw-568.js'), path.join(old, 'sw.js'));
    fs.writeFileSync(path.join(old, 'index.html'),
      fs.readFileSync(path.join(A.out, 'index.html'), 'utf8').split(wA.VERSION).join('568'));
    const ctx2 = await t.browser.newContext({ viewport: { width: 900, height: 800 } });
    const q = await ctx2.newPage();
    q.on('pageerror', (e) => t.ok('no uncaught error on the page', false, e.message));
    const seeQ = async () => {
      for (let i = 0; i < 40; i++) {
        try { return await q.evaluate(look); } catch (e) { await q.waitForTimeout(250); }
      }
      return await q.evaluate(look);
    };
    try {
      srv.root = old; srv.log = [];
      await q.goto(srv.base + 'index.html');
      await q.evaluate(() => navigator.serviceWorker.ready);
      await q.reload();
      await q.waitForTimeout(800);
      let s = await seeQ();
      t.ok('build 568’s worker, as installed on phones today, is running', s.keys.join(' ') === 'storehouse-v568', JSON.stringify(s.keys));

      /* The deploy lands. The next open is served by the old worker, which
         fetches the new page — and must not keep it, since none of the
         scripts it names are in the old cache. The new worker is held back
         for that open (sw.js does not answer), so that what the old worker
         kept can be read before anything replaces it. */
      srv.root = B.out; srv.fail = /^\/sw\.js/;
      await q.reload();
      await q.waitForTimeout(1500);
      const held = await q.evaluate(async () => {
        const hit = await caches.match('./index.html', { cacheName: 'storehouse-v568' });
        return hit ? ((await hit.text()).match(/[?&]v=(\d+)/) || [])[1] : null;
      });
      s = await seeQ();
      t.ok('the old worker opens the new build online',
        s.tag === 'B' && s.cards > 100, s.tag + ', ' + s.cards + ' cards');
      t.ok('but does not keep its page in place of the one whose scripts it has',
        held === '568', 'the old cache holds the page of build ' + held);
      srv.fail = null;
      await q.reload();
      /* The install fetches the whole build, five megabytes of it, before the
         new worker can take over and reload the page: a fixed three and a half
         seconds was usually enough and, on a loaded machine, once not. So it
         is waited for, up to twenty seconds, rather than guessed. */
      const over = (x) => x.keys.join(' ') === [wB.ART, wB.CACHE].sort().join(' ') && whole(x, wB) && pictures(x, wB) && x.tag === 'B';
      await q.waitForTimeout(1000);
      s = await seeQ();
      for (let i = 0; i < 38 && !over(s); i++) { await q.waitForTimeout(500); s = await seeQ(); }
      t.ok('the new worker takes over, deletes build 568’s cache, and the page reloads onto the new build',
        over(s), JSON.stringify(s.keys) + ' running ' + s.tag);

      srv.down = true;
      await ctx2.setOffline(true);
      await q.reload();
      await q.waitForTimeout(1500);
      s = await seeQ();
      t.ok('and opens with no signal afterwards', s.tag === 'B' && s.cards > 100, s.tag + ', ' + s.cards + ' cards');
    } finally {
      srv.down = false;
      await ctx2.close();
      srv.http.close();
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  },
};
