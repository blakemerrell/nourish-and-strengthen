/* Step 4 (Cook): unified Cook sub-nav (Recipes | This week | List + On hand),
 * single row of quick filter chips + on-demand Filter drawer, + planning on cards,
 * direct Walmart auto-cart on This week & List & Today, and hash routes. */

const { nourish } = require('./fixtures/nourish.js');

module.exports = nourish({
  name: 'Cook Step 4: unified sub-nav, quick chips, card + plan, Walmart CTA, hash routes',
  async suite(t) {
    const errs = [];
    const p = await t.fresh({ viewport: { width: 412, height: 915 } });
    p.on('pageerror', (e) => errs.push(e.message));

    /* 1. Bare index.html starts on Today; <= 2 taps to On hand (Pantry) via Cook */
    t.ok('bare index.html starts on Today',
      await p.evaluate(() => !document.getElementById('view-today').classList.contains('hide')));

    await p.click('.tab[data-view="browse"]');
    await p.waitForTimeout(200);
    await p.click('#view-browse [data-stepgo="pantry"]');
    await p.waitForTimeout(150);
    t.ok('Pantry (On hand) is reachable in 2 taps from Today via Cook sub-nav',
      await p.evaluate(() => !document.getElementById('view-pantry').classList.contains('hide') &&
        document.querySelector('#view-pantry [data-stepgo="pantry"]').getAttribute('aria-pressed') === 'true'));

    /* 2. Cook sub-bar navigation & 44px touch targets & no extra [role="tab"] */
    await p.click('#view-pantry [data-cookgo="browse"]');
    await p.waitForTimeout(150);
    await p.evaluate(() => {
      const sx = document.getElementById('shareHintX');
      if (sx && sx.offsetParent) sx.click();
    });
    await p.waitForTimeout(100);
    const nav = await p.evaluate(() => {
      const btns = [...document.querySelectorAll('#view-browse [data-cookgo], #view-browse [data-stepgo="pantry"]')];
      const labels = btns.map((b) => b.textContent.replace(/\s+/g, ' ').trim());
      const minH = Math.min(...btns.map((b) => Math.round(b.getBoundingClientRect().height)));
      const tabs = [...document.querySelectorAll('.tabs [role="tab"]')].filter((b) => b.offsetParent !== null).length;
      const cookTabs = document.querySelectorAll('#view-browse [role="tab"]').length;
      const firstCard = document.querySelector('#grid .card-cell');
      const cardTop = firstCard ? Math.round(firstCard.getBoundingClientRect().top) : 9999;
      const chipRow = document.querySelector('#cookChips');
      const chipTops = new Set([...chipRow.querySelectorAll('.cook-chip')].map((c) => Math.round(c.getBoundingClientRect().top)));
      return { labels, minH, tabs, cookTabs, cardTop, chipCount: chipRow.querySelectorAll('.cook-chip').length, chipRows: chipTops.size };
    });
    t.ok('Cook sub-bar keeps 4 visible app tabs, 0 Cook tabs, >=44px targets, 1-row quick chips, and first card near the top on Pixel 9 Pro',
      nav.tabs === 4 && nav.cookTabs === 0 && nav.minH >= 44 && nav.chipCount >= 6 && nav.chipRows === 1 && nav.cardTop < 410 &&
      nav.labels.slice(0, 3).join('|') === 'Recipes|This week|List' && nav.labels[3] === 'On hand',
      JSON.stringify(nav));

    /* 3. Quick filter chips filter recipes and sync with Filter drawer */
    const totalCards = await p.evaluate(() => document.querySelectorAll('#grid .card').length);
    for (const [chip, check] of [
      ['dinner', (r) => r.book === 2 && [3, 4, 7].indexOf(r.secNum) >= 0 || r.book === 1 && r.secNum === 4],
      ['under30', (r) => {
        const h = r.time.match(/(\d+(?:\.\d+)?)\s*hr/i), m = r.time.match(/(\d+)\s*min/i);
        const mins = (h ? parseFloat(h[1]) * 60 : 0) + (m ? parseInt(m[1], 10) : 0);
        return mins > 0 && mins <= 30;
      }],
      ['protein', (r) => !!(r.macro && r.macro.p >= 30)],
    ]) {
      await p.click('#cookChips [data-qchip="' + chip + '"]');
      await p.waitForTimeout(150);
      const shown = await p.evaluate(() => [...document.querySelectorAll('#grid .card')].map((c) => c.dataset.open));
      const all = await p.evaluate(() => { const m = {}; window.RECIPES.forEach((r) => { m[String(r.id)] = r; }); return m; });
      t.ok('quick chip "' + chip + '" shows matching recipes',
        shown.length > 0 && shown.length < totalCards && shown.every((id) => check(all[id])),
        shown.length + ' of ' + totalCards);
    }

    await p.click('#cookChips [data-qchip="pantry"]');
    await p.waitForTimeout(150);
    const syncPan = await p.evaluate(() => ({
      sel: document.getElementById('pantrySel').value,
      chip: document.querySelector('#cookChips [data-qchip="pantry"]').getAttribute('aria-pressed'),
      count: document.getElementById('filtCount').textContent,
    }));
    t.ok('From my pantry chip syncs with #pantrySel and #filtCount',
      syncPan.sel === 'base' && syncPan.chip === 'true' && Number(syncPan.count) >= 1, JSON.stringify(syncPan));

    await p.click('#cookChips [data-qchip="all"]');
    await p.waitForTimeout(150);
    t.ok('All chip resets filters back to the full collection',
      (await p.evaluate(() => document.querySelectorAll('#grid .card').length)) === totalCards);

    /* 4. Recipe card + quick-plan flow, Tab trap, Escape, and nav badges */
    const cardGeom = await p.evaluate(() => {
      const cell = document.querySelector('#grid .card-cell');
      const card = cell.querySelector('button.card');
      const add = cell.querySelector('button.card-add');
      const r = add.getBoundingClientRect();
      return {
        nested: card.contains(add),
        w: Math.round(r.width),
        h: Math.round(r.height),
        id: add.dataset.cardadd,
      };
    });
    t.ok('card-add + button is a 44x44 sibling outside <button class="card">',
      !cardGeom.nested && cardGeom.w >= 44 && cardGeom.h >= 44 && !!cardGeom.id, JSON.stringify(cardGeom));

    await p.click('#grid .card-add[data-cardadd="' + cardGeom.id + '"]');
    await p.waitForTimeout(150);
    const sheetOpen = await p.evaluate(() => !!document.querySelector('#cookRoot [role="dialog"]'));
    t.ok('tapping + on a card opens the This week quick-plan sheet', sheetOpen);

    // Tab stays trapped inside #cookRoot
    const trap = [];
    for (let i = 0; i < 12; i++) {
      await p.keyboard.press('Tab');
      trap.push(await p.evaluate(() => !!document.querySelector('#cookRoot .scrim').contains(document.activeElement)));
    }
    t.ok('Tab stays trapped inside the quick-plan sheet', trap.every(Boolean), JSON.stringify(trap));

    await p.keyboard.press('Escape');
    await p.waitForTimeout(100);
    t.ok('Escape closes the quick-plan sheet',
      !(await p.evaluate(() => !!document.querySelector('#cookRoot .scrim'))));

    // Plan onto a dinner recipe so Walmart ingredients are present
    const dinnerId = await p.evaluate(() => {
      const r = window.RECIPES.find((x) => x.book === 2 && x.secNum === 3);
      return String(r.id);
    });
    await p.click('#grid .card-add[data-cardadd="' + dinnerId + '"]');
    await p.waitForTimeout(150);
    await p.click('#cookRoot [data-cooknext]');
    await p.waitForTimeout(200);
    const afterPlan = await p.evaluate((id) => ({
      closed: !document.querySelector('#cookRoot .scrim'),
      onBtn: document.querySelector('#grid .card-add[data-cardadd="' + id + '"]').classList.contains('on'),
      weekBadge: document.querySelector('#view-browse [data-cookgo="plan"] .cook-badge').textContent,
    }), dinnerId);
    t.ok('Add to <Day> plans the recipe, marks card +, and updates This week badge',
      afterPlan.closed && afterPlan.onBtn && afterPlan.weekBadge === '1/7', JSON.stringify(afterPlan));

    /* 5. Direct Walmart cart CTA preserved across Cook -> This week, Cook -> List, and Today */
    await p.click('#view-browse [data-cookgo="plan"]');
    await p.waitForTimeout(150);
    await p.click('#view-plan [data-cookgo="list"]'); // ensure where canBuy defaults true or switch source to own
    await p.waitForTimeout(150);
    await p.evaluate(() => window.Hive.go('where'));
    await p.click('[data-srcpick="own"]');
    await p.waitForTimeout(150);

    await p.click('#view-where [data-cookgo="plan"]');
    await p.waitForTimeout(200);
    const planWm = await p.evaluate(() => {
      const a = document.querySelector('#view-plan .wm-btn');
      const cs = a ? getComputedStyle(a) : null;
      return {
        visible: !document.getElementById('view-plan').classList.contains('hide'),
        href: a ? a.getAttribute('href') : '',
        bg: cs ? cs.backgroundColor : '',
        spark: !!(a && a.querySelector('.wm-spark')),
      };
    });
    t.ok('Cook › This week shows the #0053E2 Walmart cart button with spark icon',
      planWm.visible && /^https:\/\/www\.walmart\.com\/sc\/cart\/addToCart\?items=\d+_\d+/.test(planWm.href) &&
      planWm.bg === 'rgb(0, 83, 226)' && planWm.spark, JSON.stringify(planWm));

    await p.click('#view-plan [data-cookgo="list"]');
    await p.waitForTimeout(200);
    const beforeMark = await p.evaluate(() => document.querySelector('#view-list .wm-btn').getAttribute('href'));
    await p.click('#view-list [data-listmark="1"]');
    await p.waitForTimeout(120);
    await p.click('#view-list .src-h >> nth=0');
    await p.waitForTimeout(150);
    const afterMark = await p.evaluate(() => {
      const a = document.querySelector('#view-list .wm-btn');
      return a ? a.getAttribute('href') : '';
    });
    t.ok('Cook › List preserves Mark what I have -> Have subtraction on the Walmart cart URL',
      /^https:\/\/www\.walmart\.com\/sc\/cart\/addToCart\?items=\d+_\d+/.test(beforeMark) && beforeMark !== afterMark,
      beforeMark.length + ' -> ' + afterMark.length);

    /* 6. Hash routing on load and hashchange */
    await p.evaluate(() => { window.location.hash = '#plan'; });
    await p.waitForTimeout(150);
    t.ok('hashchange #plan switches to Cook › This week',
      await p.evaluate(() => !document.getElementById('view-plan').classList.contains('hide')));

    for (const [hash, viewId] of [
      ['#cook', 'view-browse'],
      ['#recipes', 'view-browse'],
      ['#list', 'view-list'],
      ['#pantry', 'view-pantry'],
    ]) {
      await p.goto(t.base + 'index.html' + hash);
      await p.waitForTimeout(450);
      t.ok('loading index.html' + hash + ' opens ' + viewId,
        await p.evaluate((vid) => !document.getElementById(vid).classList.contains('hide'), viewId));
    }

    t.ok('no uncaught page errors', errs.length === 0, errs.join(' | '));
    await p.context().close();
  },
});
