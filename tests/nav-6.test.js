/* Step 6: 4-tab bottom navigation (Today · Cook · Eat · Train), Look 1
 * Warm Editorial tokens in light and dark, slim utility topbar with Share,
 * Cook active state across Recipes / This week / List / On hand / Book,
 * bottom clearance above sticky footers, live-workout hiding, and all legacy
 * hash redirects. */

const { nourish, todayOn } = require('./fixtures/nourish.js');

module.exports = nourish({
  name: 'Navigation Step 6: 4-tab bottom bar, clearance, Look 1 dark mode, and hash routes',
  async suite(t) {
    const errs = [];
    const p = await t.fresh({ viewport: { width: 412, height: 915 }, hasTouch: true, isMobile: true });
    p.on('pageerror', (e) => errs.push(e.message));

    /* 1. Four bottom tabs pinned to the foot; slim topbar holds #syncBtn + brand */
    const bar = await p.evaluate(() => {
      const nav = document.querySelector('.bottom-tabs');
      const tb = document.querySelector('.topbar');
      const sync = document.getElementById('syncBtn').getBoundingClientRect();
      const brand = document.querySelector('.topbar .brand-name').getBoundingClientRect();
      const tabs = [...document.querySelectorAll('.bottom-tabs [role="tab"]')];
      const info = tabs.map((b) => {
        const r = b.getBoundingClientRect();
        const cs = getComputedStyle(b);
        return {
          k: b.dataset.view,
          lbl: b.innerText.replace(/\s+/g, ' ').trim(),
          ico: !!b.querySelector('svg.tab-ico'),
          w: Math.round(r.width),
          h: Math.round(r.height),
          top: Math.round(r.top),
          bot: Math.round(r.bottom),
          font: parseFloat(cs.fontSize),
          sel: b.getAttribute('aria-selected'),
          idx: b.tabIndex,
        };
      });
      const nr = nav.getBoundingClientRect(), tr = tb.getBoundingClientRect();
      return {
        tbTop: Math.round(tr.top), tbBot: Math.round(tr.bottom),
        syncOk: sync.width >= 44 && sync.height >= 44 && sync.right <= brand.left + 1,
        brandVis: brand.width > 80 && brand.height > 12,
        navBot: Math.round(nr.bottom), vh: window.innerHeight,
        navPos: getComputedStyle(nav).position,
        labels: info.map((x) => x.lbl).join('|'),
        info,
      };
    });
    t.ok('four bottom tabs (Today, Cook, Eat, Train) pin to the viewport foot with >=48px targets, >=13px type, icons, and slim header above',
      bar.labels === 'Today|Cook|Eat|Train' &&
      bar.navPos === 'fixed' && bar.navBot >= bar.vh - 2 && bar.navBot <= bar.vh + 1 &&
      bar.tbBot < 90 && bar.syncOk && bar.brandVis &&
      bar.info.every((x) => x.ico && x.h >= 48 && x.w >= 44 && x.font >= 13) &&
      bar.info[0].sel === 'true' && bar.info[0].idx === 0 &&
      bar.info.slice(1).every((x) => x.sel === 'false' && x.idx === -1),
      JSON.stringify(bar));

    /* 2. Cook stays lit across Recipes, Book, This week, Where, List, On hand;
          week browsing persists inside Cook steps and resets on leaving */
    await p.click('.tab[data-view="browse"]');
    await p.waitForTimeout(150);
    await p.click('#view-browse [data-cookgo="plan"]');
    await p.waitForTimeout(150);
    await p.click('#calNext');
    await p.waitForTimeout(150);
    const nextWk = await p.evaluate(() => window.Store.activeWeek().id);
    const cookSubLit = {};
    for (const dest of ['list', 'pantry', 'where', 'plan']) {
      await p.evaluate((d) => window.Hive.go(d), dest);
      await p.waitForTimeout(120);
      cookSubLit[dest] = await p.evaluate(() => ({
        lit: document.querySelector('.tab[aria-selected="true"]').dataset.view,
        wk: window.Store.activeWeek().id,
      }));
    }
    await p.click('#view-plan [data-cookgo="browse"]');
    await p.waitForTimeout(150);
    await p.click('#bookBtn');
    await p.waitForTimeout(200);
    const bookAndReset = await p.evaluate(() => ({
      lit: document.querySelector('.tab[aria-selected="true"]').dataset.view,
      wk: window.Store.activeWeek().id,
      thisWk: window.Store.thisWeek(),
      bookOpen: !document.getElementById('view-book').classList.contains('hide'),
    }));
    t.ok('Cook keeps aria-selected across This week/List/On hand/Where/Book, keeps browsed week across Cook steps, and resets week when leaving to Recipes',
      nextWk !== bookAndReset.thisWk &&
      ['list', 'pantry', 'where', 'plan'].every((k) => cookSubLit[k].lit === 'browse' && cookSubLit[k].wk === nextWk) &&
      bookAndReset.bookOpen && bookAndReset.lit === 'browse' && bookAndReset.wk === bookAndReset.thisWk,
      JSON.stringify({ nextWk, cookSubLit, bookAndReset }));

    /* 3. Sticky / fixed footers sit above .bottom-tabs (Eat #macroDock, List .wm-bar, Train minimized #trRest) */
    const dk = await todayOn(p);
    await p.evaluate((dayKey) => {
      localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 180, f: 60, c: 200 }));
      localStorage.setItem('bsc.macroDays', JSON.stringify({ [dayKey]: { b: [{ n: 'Eggs', g: 120, k: 170, p: 14, f: 12, c: 1, u: 'g', gr: 1, e: 0 }], l: [], d: [], s: [] } }));
      const d = window.RECIPES.filter((r) => r.book === 2 && r.secNum === 3).slice(0, 3);
      ['mon', 'tue', 'wed'].forEach((day, i) => window.Store.addToDay(d[i].id, day, 1));
    }, dk);
    await p.reload();
    await p.waitForTimeout(450);

    // 3a. Eat #macroDock clears .bottom-tabs and buttons respond to elementFromPoint
    await p.click('.tab[data-view="macros"]');
    await p.waitForTimeout(250);
    const eatFoot = await p.evaluate(() => {
      const nav = document.querySelector('.bottom-tabs').getBoundingClientRect();
      const ids = ['macroLogOpen', 'macroLogScan', 'macroFill'];
      const hits = ids.map((id) => {
        const el = document.getElementById(id);
        const r = el.getBoundingClientRect();
        const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return { id, bot: Math.round(r.bottom), navTop: Math.round(nav.top), hit: !!top && (top === el || el.contains(top)) };
      });
      return { hits };
    });
    t.ok('Eat sticky log dock (#macroLogOpen, #macroLogScan, #macroFill) sits above .bottom-tabs and is directly clickable',
      eatFoot.hits.every((h) => h.hit && h.bot <= h.navTop + 1), JSON.stringify(eatFoot));

    // 3b. Cook > List .wm-bar clears .bottom-tabs
    await p.evaluate(() => {
      window.Hive.go('where');
      const own = document.querySelector('[data-srcpick="own"]');
      if (own) own.click();
      window.Hive.go('list');
    });
    await p.waitForTimeout(300);
    const listFoot = await p.evaluate(() => {
      const nav = document.querySelector('.bottom-tabs').getBoundingClientRect();
      const btn = document.querySelector('#view-list .wm-btn');
      if (btn) btn.scrollIntoView({ block: 'end' });
      const r = btn ? btn.getBoundingClientRect() : null;
      const hit = btn ? document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) : null;
      return {
        exists: !!btn,
        bot: r ? Math.round(r.bottom) : 9999,
        navTop: Math.round(nav.top),
        hit: !!btn && !!hit && (hit === btn || btn.contains(hit)),
      };
    });
    t.ok('Cook › List sticky Walmart cart bar clears .bottom-tabs cleanly',
      listFoot.exists && listFoot.hit && listFoot.bot <= listFoot.navTop + 1, JSON.stringify(listFoot));

    // 3c. Full-screen workout hides .bottom-tabs; minimizing restores it above .tr-rest
    await p.evaluate(() => {
      const _ = window.Train._;
      const pr = { qz: 1, kit: 'gym', lvl: 1, rq: 1, pl: 'row', bk: '', jt: '', avoid: [], en: {} };
      const ms = _.build(Object.assign({ prog: 'grow', dpw: 4, min: 60, acc: 4, pri: [] }, pr));
      ms.id = 'navms';
      localStorage.setItem('bsc.train', JSON.stringify({ pr, act: 'navms', ms: { navms: ms }, ax: {}, cx: {}, wo: {}, nt: {} }));
      localStorage.removeItem('sh.trainLive');
      _.reload();
    });
    await p.click('.tab[data-view="train"]');
    await p.waitForTimeout(200);
    await p.click('#view-train .tr-next [data-t="start"]');
    await p.waitForTimeout(200);
    const fullScreen = await p.evaluate(() => ({
      focus: document.getElementById('view-train').classList.contains('tr-focus'),
      navH: Math.round(document.querySelector('.bottom-tabs').getBoundingClientRect().height),
      topH: Math.round(document.querySelector('.topbar').getBoundingClientRect().height),
    }));
    t.ok('full-screen live workout hides both .topbar and .bottom-tabs',
      fullScreen.focus && fullScreen.navH === 0 && fullScreen.topH === 0, JSON.stringify(fullScreen));

    await p.click('#trTop [data-t="minim"]');
    await p.waitForTimeout(200);
    const minWorkout = await p.evaluate(() => {
      const nav = document.querySelector('.bottom-tabs').getBoundingClientRect();
      const rest = document.getElementById('trRest').getBoundingClientRect();
      const fin = document.querySelector('#trRest .tr-wbar [data-t="finish"]');
      const fr = fin ? fin.getBoundingClientRect() : null;
      const fHit = fin && fr ? document.elementFromPoint(fr.left + fr.width / 2, fr.top + fr.height / 2) : null;
      return {
        navH: Math.round(nav.height),
        restBot: Math.round(rest.bottom),
        navTop: Math.round(nav.top),
        finHit: !!fin && !!fHit && (fHit === fin || fin.contains(fHit)),
      };
    });
    t.ok('minimizing workout restores .bottom-tabs and parks #trRest Finish bar cleanly above it',
      minWorkout.navH >= 48 && minWorkout.restBot <= minWorkout.navTop + 1 && minWorkout.finHit, JSON.stringify(minWorkout));

    /* 4. Legacy hash routes route to the right view and light the matching bottom tab */
    for (const [hash, viewId, litTab] of [
      ['#today', 'view-today', 'today'],
      ['#cook', 'view-browse', 'browse'],
      ['#recipes', 'view-browse', 'browse'],
      ['#book', 'view-book', 'browse'],
      ['#plan', 'view-plan', 'browse'],
      ['#where', 'view-where', 'browse'],
      ['#list', 'view-list', 'browse'],
      ['#pantry', 'view-pantry', 'browse'],
      ['#eat', 'view-macros', 'macros'],
      ['#macros', 'view-macros', 'macros'],
      ['#nourish', 'view-macros', 'macros'],
      ['#train', 'view-train', 'train'],
      ['#strengthen', 'view-train', 'train'],
    ]) {
      await p.goto(t.base + 'index.html' + hash);
      await p.waitForTimeout(350);
      const got = await p.evaluate((vid) => ({
        shown: !document.getElementById(vid).classList.contains('hide'),
        lit: (document.querySelector('.bottom-tabs [aria-selected="true"]') || {}).dataset.view,
      }), viewId);
      t.ok('legacy route ' + hash + ' opens ' + viewId + ' with bottom tab ' + litTab + ' lit',
        got.shown && got.lit === litTab, JSON.stringify(got));
    }
    await p.context().close();

    /* 5. Narrow 320x700 Light + Dark Look 1 parity */
    for (const scheme of ['light', 'dark']) {
      const q = await t.fresh({ viewport: { width: 320, height: 700 }, hasTouch: true, isMobile: true, colorScheme: scheme });
      q.on('pageerror', (e) => errs.push(scheme + ': ' + e.message));
      const look = await q.evaluate(() => {
        const nav = document.querySelector('.bottom-tabs');
        const c = getComputedStyle(nav).backgroundColor;
        const m = c.match(/oklch\(([\d.]+)/);
        const lum = m ? parseFloat(m[1]) : 0.5;
        const tabs = [...nav.querySelectorAll('.tab')];
        return {
          theme: document.documentElement.getAttribute('data-theme'),
          overflow: document.documentElement.scrollWidth > window.innerWidth,
          minH: Math.min(...tabs.map((b) => Math.round(b.getBoundingClientRect().height))),
          minW: Math.min(...tabs.map((b) => Math.round(b.getBoundingClientRect().width))),
          minFont: Math.min(...tabs.map((b) => parseFloat(getComputedStyle(b).fontSize))),
          lum,
        };
      });
      t.ok('320px ' + scheme + ' keeps Look 1 surface, zero overflow, >=48px tall & >=13px label on bottom bar',
        look.theme === scheme && !look.overflow && look.minH >= 48 && look.minW >= 44 && look.minFont >= 13 &&
        (scheme === 'light' ? look.lum > 0.85 : look.lum < 0.35),
        JSON.stringify(look));
      await q.context().close();
    }

    t.ok('no uncaught page errors', errs.length === 0, errs.join(' | '));
  },
});
