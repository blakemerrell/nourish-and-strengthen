/* Installing the app from inside it: Sync & sharing → On your home screen.
 *
 * Blake, 2026-10-12, after the repository was renamed: Chrome's ⋮ → Install
 * said "This app is already installed", and opening it said "Could not open
 * app". Nothing was installed at the new address; two Treasure Up apps were,
 * on the same site. The page's own offer (beforeinstallprompt) is the other
 * way in, so the app keeps it and puts a button on it. Chrome makes that offer
 * only when it would install the app, which the suite cannot make it do, so
 * the offer here is a stand-in with the same shape: prompt() and userChoice. */

module.exports = {
  name: 'Install from inside the app',
  async run(t) {
    const open = async (opts) => {
      const p = await t.fresh({ viewport: { width: 390, height: 844 }, ...opts });
      await p.waitForTimeout(600);
      await p.click('#syncBtn');
      await p.waitForTimeout(250);
      return p;
    };
    const read = (p) => p.evaluate(() => {
      const h = [...document.querySelectorAll('.sync-sheet .mt-div')].find((d) => d.textContent === 'On your home screen');
      const btn = document.querySelector('.sync-sheet [data-sync="install"]');
      const r = btn && btn.getBoundingClientRect();
      const heads = [...document.querySelectorAll('.sync-sheet .mt-div')].map((d) => d.textContent);
      return { head: !!h, says: h ? h.nextElementSibling.textContent : '', btn: btn ? btn.textContent : '', tall: r ? r.height : 0,
        before: heads.indexOf('On your home screen') === heads.indexOf('Appearance') - 1 };
    });
    // the browser's offer, as Chrome hands it over
    const offer = (p, outcome) => p.evaluate((outcome) => {
      const e = new Event('beforeinstallprompt', { cancelable: true });
      window.__asked = 0;
      e.prompt = () => { window.__asked++; return Promise.resolve(); };
      e.userChoice = new Promise((res) => { window.__choose = () => res({ outcome, platform: 'web' }); });
      window.dispatchEvent(e);
      return e.defaultPrevented;
    }, outcome);

    const p = await open();
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    let s = await read(p);
    t.ok('with no offer from the browser, the sheet says so in one line, with no button, just above Appearance',
      s.head && /not offering to install/.test(s.says) && !s.btn && s.before, JSON.stringify(s));

    const prevented = await offer(p, 'accepted');
    await p.waitForTimeout(150);
    s = await read(p);
    t.ok('the offer arriving with the sheet open puts the button on it, a thumb tall',
      s.btn === 'Install the app' && s.tall >= 44 && /app of its own/.test(s.says), JSON.stringify(s));
    t.ok('and the browser’s own install pop-up is left alone (the offer is kept, not taken over)', prevented === false);

    await p.click('[data-sync="install"]');
    await p.waitForTimeout(150);
    s = await read(p);
    const asked = await p.evaluate(() => window.__asked);
    t.ok('the button asks the browser once, and the sheet says it is installing',
      asked === 1 && !s.btn && /^Installing/.test(s.says), JSON.stringify({ asked, s }));
    await p.evaluate(() => { window.__choose(); window.dispatchEvent(new Event('appinstalled')); });
    await p.waitForTimeout(150);
    s = await read(p);
    t.ok('once the browser says it is installed, the sheet says where to open it', /^Installed\. Open Hive & Hearth from your home screen/.test(s.says), s.says);

    /* Turned down: no button until the browser offers again. */
    const q = await open();
    q.on('pageerror', (e) => errs.push(e.message));
    await offer(q, 'dismissed');
    await q.waitForTimeout(100);
    await q.click('[data-sync="install"]');
    await q.evaluate(() => window.__choose());
    await q.waitForTimeout(150);
    s = await read(q);
    t.ok('turned down, it says so and offers nothing it cannot keep', /^Not installed/.test(s.says) && !s.btn, JSON.stringify(s));
    await offer(q, 'accepted');
    await q.waitForTimeout(150);
    t.ok('and a fresh offer from the browser brings the button back', (await read(q)).btn === 'Install the app');
    await q.context().close();

    /* Safari on an iPhone never offers; it installs from Share. */
    const ios = await open({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' });
    ios.on('pageerror', (e) => errs.push(e.message));
    s = await read(ios);
    t.ok('on an iPhone it says Share, then Add to Home Screen', /tap Share, then Add to Home Screen/.test(s.says) && !s.btn, s.says);
    await ios.context().close();

    /* Opened from the home screen: nothing to install. */
    const inApp = await t.fresh({ viewport: { width: 390, height: 844 } });
    await inApp.addInitScript(() => {
      const mm = window.matchMedia.bind(window);
      window.matchMedia = (q) => (/display-mode:\s*standalone/.test(q) ? { matches: true, media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} } : mm(q));
    });
    await inApp.reload();
    await inApp.waitForTimeout(600);
    await inApp.click('#syncBtn');
    await inApp.waitForTimeout(250);
    await offer(inApp, 'accepted');
    await inApp.waitForTimeout(100);
    s = await read(inApp);
    t.ok('in the installed app it says so, and offers no install even when the browser does', /^You are in the installed app/.test(s.says) && !s.btn, JSON.stringify(s));
    await inApp.context().close();

    /* 320 px, dark: the button and its line fit. */
    const n = await open({ viewport: { width: 320, height: 700 }, colorScheme: 'dark' });
    await offer(n, 'accepted');
    await n.waitForTimeout(150);
    const fit = await n.evaluate(() => {
      const b = document.querySelector('[data-sync="install"]').getBoundingClientRect(), sh = document.querySelector('.sync-sheet').getBoundingClientRect();
      return { inside: b.left >= sh.left && b.right <= sh.right, oneLine: b.height <= 52, page: document.documentElement.scrollWidth <= innerWidth };
    });
    t.ok('at 320 px in the dark the button fits the sheet on one line', fit.inside && fit.oneLine && fit.page, JSON.stringify(fit));
    await n.context().close();

    t.ok('with no error on the page', errs.length === 0, errs.join(' | '));
    await p.context().close();
  },
};
