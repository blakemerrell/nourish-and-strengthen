/* Opening the app with no signal at all — the storehouse-basement case. */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const site = require('../tools/build-site.js');
const built = require('./site-check.js');

module.exports = {
  name: 'Offline',
  async run(t) {
    /* The worker being served, read by running it: its version, its two
       cache names and the two lists. Everything below is checked against
       these rather than against a number written into this file. Served
       from the repository it is the unbuilt worker, version 0. */
    const sw = built.worker(t.root);
    const ctx = await t.browser.newContext({ viewport: { width: 900, height: 800 } });
    const p = await ctx.newPage();
    p.on('pageerror', (e) => t.ok('no uncaught error on the page', false, e.message));

    // nothing may be fetched from anywhere but here
    const outside = [];
    p.on('request', (r) => {
      const u = new URL(r.url());
      if (u.hostname !== '127.0.0.1' && u.protocol !== 'data:') outside.push(r.url());
    });

    await p.goto(t.base + 'index.html');
    await p.evaluate(() => localStorage.clear());
    await p.reload();
    await p.waitForTimeout(1200);
    t.ok('no font, script or style comes from another host', outside.length === 0, outside.join(' '));

    t.ok('a service worker registers',
      await p.evaluate(() => navigator.serviceWorker.getRegistration().then((r) => !!r)));
    await p.evaluate(() => navigator.serviceWorker.ready);
    await p.waitForTimeout(1500);

    /* Two caches: the app under this build's name, and the pictures and
       typefaces under a name of their own, so that a deploy which does not
       touch them does not send every phone to download them again. */
    const held = await p.evaluate(async (names) => {
      const out = { keys: await caches.keys() };
      for (const n of names) {
        const c = await caches.open(n);
        out[n] = (await c.keys()).map((r) => new URL(r.url).pathname + new URL(r.url).search);
      }
      return out;
    }, [sw.CACHE, sw.ART]);
    const want = (list) => list.map((u) => new URL(u, t.base).pathname + new URL(u, t.base).search);
    const cached = held[sw.CACHE].concat(held[sw.ART]);
    const noCore = want(sw.CORE.concat(sw.COVERS)).filter((u) => held[sw.CACHE].indexOf(u) < 0);
    t.ok('the whole shell is cached, under this build\u2019s name, covers and all',
      held.keys.indexOf(sw.CACHE) >= 0 && noCore.length === 0 && sw.CORE.length >= 11 && sw.COVERS.length === 4,
      noCore.join(' ') || held.keys.join(', '));
    const noArt = want(sw.EXTRAS).filter((u) => held[sw.ART].indexOf(u) < 0);
    t.ok('and the pictures and typefaces in a cache of their own',
      held.keys.indexOf(sw.ART) >= 0 && noArt.length === 0 && held[sw.CACHE].every((u) => want(sw.EXTRAS).indexOf(u) < 0),
      noArt.join(' ') || held.keys.join(', '));
    /* And nothing else of ours: the cache that is not this build's is the
       one a phone would be serving an old app out of. */
    t.ok('and no other build\u2019s cache is left beside them',
      held.keys.filter((k) => /^storehouse-/.test(k)).sort().join(' ') === [sw.ART, sw.CACHE].sort().join(' '),
      held.keys.join(', '));

    /* Every file the page pulls in must carry a version, and the worker must
       ask for the same one. Both halves matter, and neither was true.

       data/recipes.js had no ?v= at all. Its URL therefore never changed, and
       GitHub Pages serves it with max-age=600 — so a new worker installing a
       new cache could fetch it through the browser's HTTP cache, get the copy
       from before the deploy, and then serve that copy cache-first for the
       life of the cache. Add six recipes, push, refresh: 266 in the header and
       257 on the page. The versioned files were never exposed to it, because
       ?v=30 is a URL the HTTP cache has never seen.

       Compared with the query attached, because the old check compared
       pathnames — which is precisely the part of a URL that was fine. */
    const versioning = await p.evaluate(async () => {
      const own = (u) => new URL(u, location.href).origin === location.origin;
      const assets = [
        ...[...document.querySelectorAll('script[src]')].map((e) => e.src),
        ...[...document.querySelectorAll('link[rel=stylesheet]')].map((e) => e.href),
      ].filter(own).map((u) => new URL(u).pathname + new URL(u).search);

      return assets;
    });
    const shell = want(sw.CORE);
    const tokens = (u) => [...u.matchAll(/[?&]v=([\w.-]+)/g)].map((m) => m[1]);
    const unversioned = versioning.filter((a) => tokens(a).length !== 1);
    t.ok('every script and stylesheet the page loads carries a version',
      versioning.length >= 9 && unversioned.length === 0, unversioned.join(' ') || versioning.length + ' found');
    t.ok('and the worker caches that exact version, query and all',
      versioning.every((a) => shell.includes(a)), versioning.filter((a) => !shell.includes(a)).join(' '));

    /* The cache is named for the build it holds.
     *
     * activate deletes every cache but the current one, which is the whole
     * mechanism for getting a phone off an old build — and it only fires when
     * the name has changed. Ship new scripts under the old cache name and a
     * phone that already has the app keeps serving the old ones, forever, with
     * no error and nothing to notice. Deliberately breaking that was the one
     * service-worker change nothing in this suite caught, because the two
     * numbers were free to drift and had already drifted by one.
     * One number now, in both places. */
    const assetV = [...new Set(versioning.concat(sw.CORE).map(tokens).flat())];
    t.ok('the assets carry a single version between them',
      assetV.length === 1 && assetV[0] === sw.VERSION,
      assetV.join(', ') + ' in the files, ' + sw.VERSION + ' in the worker');
    t.ok('and the cache is named for it, so a new build cannot reuse the old cache',
      sw.CACHE === 'storehouse-v' + assetV[0], sw.CACHE + ' vs assets at v' + assetV.join('/'));

    /* And the version moved when the files under it did.
     *
     * The two checks above hold the version together with itself. Neither one
     * can see the failure that actually happened: a *generated file's contents*
     * changing while the version stays put. The URL is what the cache is keyed
     * by, so if data/art.js grows four engravings at the same ?v=, every phone
     * with the app installed goes on serving the twelve-entry copy — not for
     * ten minutes, indefinitely, because there is nothing to invalidate.
     *
     * That produced a 180-page book on screen underneath a button offering a
     * 184-page file: the four openers the manifest did not know about. Two
     * numbers disagreeing on one screen with nothing to explain why, and no
     * amount of reloading fixes it, because the reload asks for the same URL.
     *
     * It was answered with a stamp file and a bump somebody had to remember
     * to run, and checked here by comparing the two. There is neither now:
     * tools/build-site.js writes a hash of the files in as the version when
     * the site is built, so a changed file is a changed version by
     * construction. What is left to check is that the build does what it
     * says — tests/site-check.js has the list — and that it says the same
     * thing twice.
     *
     * Checked on what is being served when that is a built site, which is
     * what CI and the deploy serve. Served from the repository instead,
     * version 0, the same checks run over a site built here: not skipped
     * because nobody happened to build one. */
    let dir = t.root;
    const tmp = [];
    const scratch = () => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'sr-site-')); tmp.push(d); return d; };
    if (!t.site) {
      t.ok('served from the repository, the worker knows it is unbuilt',
        sw.VERSION === site.UNBUILT && sw.DEV, 'VERSION ' + sw.VERSION);
      dir = scratch();
      execFileSync(process.execPath, [path.join(__dirname, '..', 'tools', 'build-site.js'), dir], { stdio: 'pipe' });
    }
    built.check(dir).forEach(([name, cond, detail]) => t.ok(name, cond, detail));

    /* The same files, the same version. Built again here, in this process,
       and compared byte for byte with a site built by another — which also
       says, when a built site is what is being served, that it is the site
       the repository builds today and not one left over from before an
       edit. */
    const w = built.worker(dir);
    const liftFiles = fs.readdirSync(path.join(dir, 'art', 'lifts')).filter((f) => f.endsWith('.gif')).map((f) => 'art/lifts/' + f);
    const theirs = w.CORE.concat(w.EXTRAS, w.COVERS).map(site.fileOf).concat(liftFiles, 'sw.js', 'share/index.html');
    const again = await site.build({ out: scratch(), include: (f) => theirs.indexOf(f) >= 0 });
    const differ = theirs.filter((f) => !fs.readFileSync(path.join(dir, f)).equals(fs.readFileSync(path.join(again.out, f))));
    t.ok('building the same files again gives the same version, byte for byte',
      again.version === w.VERSION && again.art === w.ART_VERSION && differ.length === 0,
      again.version + ' / ' + w.VERSION + (differ.length ? '; differs: ' + differ.join(' ') +
        (t.site ? ' — the site served is not what the repository builds now: node tools/build-site.js' : '') : ''));
    tmp.forEach((d) => fs.rmSync(d, { recursive: true, force: true }));

    /* Every engraving the book draws, cached with it.
     *
     * data/art.js is generated by tools/prep-art.js; the paths in sw.js were
     * typed alongside it. Add a section illustration and the manifest knows
     * about it while the worker does not — so the picture is there online and
     * gone in a storehouse basement, and gone quietly, because EXTRAS are
     * allowed to fail by design so one missing image cannot take an install
     * down. prep-art.js writes both now; this is what says it did. */
    const artCached = await p.evaluate(async (name) => {
      const c = await caches.open(name);
      const have = (await c.keys()).map((r) => new URL(r.url).pathname);
      const want = Object.values(window.SECTION_ART || {});
      return want.filter((a) => !have.some((h) => h.indexOf(a) >= 0));
    }, sw.ART);
    t.ok('every section engraving is cached for a phone with no signal',
      artCached.length === 0, artCached.join(', '));

    t.ok('recipes, nutrition and typefaces included',
      cached.some((u) => /recipes\.js/.test(u)) &&
      cached.some((u) => /nutrition\.js/.test(u)) &&
      cached.filter((u) => /woff2/.test(u)).length === 3,
      cached.filter((u) => /recipes|nutrition|woff2/.test(u)).join(' '));

    await p.evaluate(() => window.Store.addToDay(12, 'wed'));
    await p.waitForTimeout(300);

    // the network goes away: the page's and the service worker's alike
    await ctx.setOffline(true);
    if (t.down) t.down(true);
    await p.goto(t.base + 'index.html');
    await p.waitForTimeout(1500);
    const reach = await p.evaluate(() => fetch('tests/run.js?x=' + Date.now()).then((r) => r.status, () => 'refused'));
    t.ok('and it really is offline: nothing reaches the server, the worker\u2019s own requests included', reach === 'refused', String(reach));
    const alive = await p.evaluate(() => ({
      // it opens on Today; every recipe is there the moment Recipes is
      cards: (document.querySelector('.tab[data-view="browse"]').click(), document.querySelectorAll('.card').length),
      font: document.fonts.check('700 20px "Source Serif 4"'),
      planned: window.Store.day('wed').length,
      total: window.RECIPES.length,
    }));
    t.ok('it opens with no network at all', alive.cards === alive.total, alive.cards + ' of ' + alive.total);
    t.ok('in its own typeface rather than a fallback', alive.font);
    t.ok('and the week is where you left it', alive.planned === 1);

    // a cold tab, as if from the home screen
    const p2 = await ctx.newPage();
    await p2.goto(t.base + 'index.html');
    await p2.waitForTimeout(1200);
    t.ok('a fresh tab opens offline too',
      await p2.evaluate(() => (document.querySelector('.tab[data-view="browse"]').click(), document.querySelectorAll('.card').length === window.RECIPES.length)),
      await p2.evaluate(() => document.querySelectorAll('.card').length + ' of ' + window.RECIPES.length));
    await p2.click('.tab[data-view="browse"]'); await p2.click('#bookBtn');
    await p2.waitForTimeout(3500);
    t.ok('and the whole book still prints',
      (await p2.evaluate(() => document.querySelectorAll('.pg:not(.no-print)').length)) > 150);

    /* The ready-made PDFs are left to the network by design, and with no
       signal a tap on "PDF · 312 pages" did nothing at all: no file, no
       word. The buttons say they need signal, and a tap says it again. */
    const pdfs = () => p2.evaluate(() => [...document.querySelectorAll('#printRows [data-get], #printRows [data-fold]')].map((a) => a.textContent));
    const off = await pdfs();
    t.ok('offline, every PDF button says it needs signal', off.length >= 6 && off.every((x) => /needs signal$/.test(x)), JSON.stringify(off));
    const downloads = [];
    p2.on('download', (d) => downloads.push(d.url()));
    await p2.click('#printRows [data-get="all"]');
    await p2.waitForTimeout(300);
    const said = await p2.evaluate(() => { const el = document.getElementById('mToast'); return el && !el.hidden ? el.textContent : ''; });
    t.ok('and a tap on one says so, rather than doing nothing', /signal/.test(said) && !downloads.length, JSON.stringify({ said, downloads }));

    /* A phone that looks unchanged after a deploy is the hardest thing here to
       tell apart from a deploy that has not landed. The Sharing sheet carries
       the build, read off the ?v= index.html actually loaded — so it cannot say
       one thing while the phone is running another. Checked offline, where the
       page came out of the cache, which is exactly when the question is asked. */
    await p.click('#syncBtn');
    await p.waitForTimeout(300);
    const stamped = await p.evaluate(() => {
      const el = document.querySelector('.sync-build');
      const src = document.querySelector('script[src*="app.js"]').getAttribute('src');
      return { shown: el && el.textContent.trim(), src };
    });
    /* And it is the worker's build, not merely a number: on a built site the
       thirteen digits of the hash, served from the repository the 0 it says
       there. */
    t.ok('the sheet names the build it is actually running',
      /^Build \d+$/.test(stamped.shown || '') && stamped.shown === 'Build ' + sw.VERSION &&
      stamped.src.indexOf('v=' + stamped.shown.split(' ')[1]) > 0,
      JSON.stringify(stamped) + ' — the worker is ' + sw.VERSION);
    await p.click('.sheet-x');
    await p.waitForTimeout(200);

    // the manifest is what makes it installable rather than a bookmark
    const mf = await p.evaluate(() => fetch('manifest.webmanifest').then((r) => r.json()).catch(() => null));
    t.ok('the manifest is served and complete',
      mf && mf.name && mf.start_url && mf.display === 'standalone' && mf.icons.length >= 2,
      mf ? mf.name : 'not served');

    await ctx.setOffline(false);
    if (t.down) t.down(false);
    await p2.waitForTimeout(200);
    const on = await pdfs();
    t.ok('with signal back, the buttons are plain downloads again', on.length >= 6 && on.every((x) => !/signal/.test(x)), JSON.stringify(on));

    /* ---- the app asks for new builds while it is running ------------------
     *
     * Everything downstream of the check was already right: sw.js is
     * registered with updateViaCache 'none' so the browser cannot serve a
     * stale worker, the worker calls skipWaiting so it takes over at once,
     * and controllerchange reloads the page once so the new scripts are the
     * ones on screen.
     *
     * What was missing was the asking. reg.update() ran on load and never
     * again, so a phone with the app left open stayed on whatever build it
     * started with, through any number of deploys, until it was cold-started.
     * Blake, after a morning of it: "I'm still not seeing the changes live on
     * my app and it's been awhile. What's going on."
     *
     * Asserted against the registration itself rather than the source text: a
     * grep for "visibilitychange" would pass on a listener wired to nothing.
     * The page is hidden and shown, and the check is that update() was
     * actually called on the live registration. */
    const upd = await p.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return { reg: false };
      let calls = 0;
      const real = reg.update.bind(reg);
      reg.update = function () { calls++; return real(); };
      /* A minute has to look like it passed, or the gap guard swallows the
         call — which is its job, and is why flicking between apps does not
         turn into a request per flick. */
      const now = Date.now;
      Date.now = function () { return now() + 120000; };
      document.dispatchEvent(new Event('visibilitychange'));
      await new Promise((r) => setTimeout(r, 120));
      Date.now = now;
      return { reg: true, calls: calls, hidden: document.hidden };
    });
    t.ok('coming back to the app asks whether there is a new build',
      upd.reg && upd.calls >= 1, JSON.stringify(upd));

    /* The other half of the same rule: it must not ask on every flick. */
    const spam = await p.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      let calls = 0;
      const real = reg.update.bind(reg);
      reg.update = function () { calls++; return real(); };
      for (let i = 0; i < 6; i++) document.dispatchEvent(new Event('visibilitychange'));
      await new Promise((r) => setTimeout(r, 120));
      return calls;
    });
    t.ok('and six flicks in a second are not six requests',
      spam <= 1, spam + ' calls');

    await ctx.close();
  },
};
