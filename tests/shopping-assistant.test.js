/* Shopping Assistant (Option 1): quick-add auto-aisles, meal attribution, trip progress,
 * In cart drawer + Uncheck all, Share list, Keep awake, 320px & Dark mode. */

module.exports = {
  name: 'Shopping assistant: quick-add, auto-aisles, meal tags, In cart, Share, Keep awake, 320px & dark',
  async run(t) {
    const errs = [];
    const p = await t.fresh({ viewport: { width: 412, height: 915 } });
    p.on('pageerror', (e) => errs.push(e.message));

    await p.click('.tab[data-view="browse"]');
    await p.click('#view-browse [data-cookgo="list"]');
    await p.waitForTimeout(200);

    /* 1. Empty week still offers quick-add bar + chips */
    const empty = await p.evaluate(() => ({
      hasForm: !!document.getElementById('listQuickForm'),
      chips: document.querySelectorAll('#listBody .list-qchip').length,
      emptyShown: !document.getElementById('listEmpty').classList.contains('hide'),
    }));
    t.ok('empty week keeps quick-add bar and household chips ready',
      empty.hasForm && empty.chips >= 6 && empty.emptyShown, JSON.stringify(empty));

    /* 2. Quick-add parsing + auto-aisles + 1-tap chip + reload persistence + delete */
    await p.fill('#listQuickIn', '2 gal milk');
    await p.click('#listQuickForm button[type="submit"]');
    await p.waitForTimeout(150);
    await p.fill('#listQuickIn', 'size 4 diapers');
    await p.click('#listQuickForm button[type="submit"]');
    await p.waitForTimeout(150);
    await p.click('#listBody [data-listchip="Paper towels"]');
    await p.waitForTimeout(150);

    const added = await p.evaluate(() => {
      const byAisle = {};
      document.querySelectorAll('#listBody .list-aisle').forEach((card) => {
        const name = (card.querySelector('.list-aisle-h span') || {}).textContent;
        byAisle[name] = [...card.querySelectorAll('.list-line')].map((r) => ({
          label: (r.querySelector('.list-row span:not(.qty)') || {}).textContent,
          qty: (r.querySelector('.list-row .qty') || {}).textContent,
          sub: (r.querySelector('.list-for') || {}).textContent,
        }));
      });
      return {
        byAisle,
        emptyHidden: document.getElementById('listEmpty').classList.contains('hide'),
        badge: (document.querySelector('#view-list [data-cookgo="list"] .cook-badge') || {}).textContent,
        chipOn: document.querySelector('#listBody [data-listchip="Paper towels"]').getAttribute('aria-pressed'),
        findLinks: [...document.querySelectorAll('#listBody .wm-sub a')].map((a) => a.textContent),
      };
    });
    t.ok('quick-added items auto-sort into Dairy & eggs, Baby & Kids, and Household & Paper with parsed quantities',
      added.emptyHidden && added.badge === '3' && added.chipOn === 'true' &&
      added.byAisle['Dairy & eggs'] && added.byAisle['Dairy & eggs'][0].label === 'Milk' &&
      added.byAisle['Dairy & eggs'][0].qty === '2 gal' &&
      added.byAisle['Baby & Kids'] && added.byAisle['Baby & Kids'][0].label === 'Size 4 diapers' &&
      added.byAisle['Household & Paper'] && added.byAisle['Household & Paper'][0].label === 'Paper towels' &&
      added.findLinks.indexOf('Paper towels') >= 0,
      JSON.stringify(added));

    await p.reload();
    await p.waitForTimeout(450);
    t.ok('quick-added items survive a reload',
      await p.evaluate(() => document.querySelectorAll('#listBody .list-line.custom').length === 3));

    const diapersDel = await p.evaluate(() => {
      const row = [...document.querySelectorAll('#listBody .list-line.custom')].find((l) => /diapers/i.test(l.textContent));
      return row ? row.querySelector('[data-delextra]').dataset.delextra : '';
    });
    await p.click('#listBody [data-delextra="' + diapersDel + '"]');
    await p.waitForTimeout(150);
    t.ok('tapping remove drops a quick-added item cleanly',
      await p.evaluate(() => document.querySelectorAll('#listBody .list-line.custom').length === 2 &&
        !/Baby & Kids/.test(document.getElementById('listBody').textContent)));

    /* 3. Planned dinners add meal attribution under recipe items + In cart drawer + Uncheck all */
    await p.evaluate(() => {
      window.Store.setOpt('store', false);
      const d = window.RECIPES.filter((r) => r.book === 2 && r.secNum === 3).slice(0, 2);
      window.Store.addToDay(d[0].id, 'mon', 1);
      window.Store.addToDay(d[1].id, 'tue', 1);
    });
    await p.waitForTimeout(250);

    const mealsCheck = await p.evaluate(() => {
      const recipeLines = [...document.querySelectorAll('#listBody .where-b .list-line:not(.custom)')];
      const withMeal = recipeLines.filter((l) => l.querySelector('.list-for') && !/Added/.test(l.querySelector('.list-for').textContent));
      const cleanNames = recipeLines.every((l) => l.querySelectorAll('.list-row span:not(.qty)').length === 1);
      return { total: recipeLines.length, withMeal: withMeal.length, cleanNames };
    });
    t.ok('planned recipe lines carry meal attribution in <small class="list-for"> without polluting span:not(.qty)',
      mealsCheck.total > 2 && mealsCheck.withMeal === mealsCheck.total && mealsCheck.cleanNames, JSON.stringify(mealsCheck));

    const chkKeys = await p.evaluate(() => [...document.querySelectorAll('#listBody .where-b .list-aisle:not(details) [data-check]')].slice(0, 2).map((c) => c.dataset.check));
    await p.click('#listBody [data-check="' + chkKeys[0] + '"]');
    await p.waitForTimeout(150);
    await p.click('#listBody [data-check="' + chkKeys[1] + '"]');
    await p.waitForTimeout(150);

    const cart = await p.evaluate(() => {
      const box = document.querySelector('#listBody .list-cart-box');
      const fill = document.querySelector('#listBody .list-prog-fill');
      return {
        hasBox: !!box,
        open: !!(box && box.open),
        count: box ? box.querySelectorAll('.list-line').length : 0,
        progText: (document.querySelector('#listBody .list-prog-m') || {}).textContent || '',
        fillW: fill ? parseFloat(fill.style.width) : 0,
      };
    });
    t.ok('checking items moves them into an open In cart drawer and advances progress bar',
      cart.hasBox && cart.open && cart.count === 2 && /2 in cart/.test(cart.progText) && cart.fillW > 0, JSON.stringify(cart));

    await p.click('#listBody [data-uncheckall="1"]');
    await p.waitForTimeout(150);
    t.ok('Uncheck all restores all ticked items back to active aisles',
      await p.evaluate(() => !document.querySelector('#listBody .list-cart-box') &&
        document.querySelectorAll('#listBody input[data-check]:checked').length === 0));

    /* 4. Keep awake & Share list */
    await p.evaluate(() => {
      window.__copiedList = '';
      try { delete navigator.share; } catch (e) {}
      Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: (txt) => { window.__copiedList = txt; return Promise.resolve(); } },
      });
    });
    await p.click('#listBody [data-listawake="1"]');
    await p.waitForTimeout(100);
    const awakeOn = await p.evaluate(() => document.querySelector('#listBody [data-listawake]').getAttribute('aria-pressed'));
    await p.click('#listBody [data-sharelist="1"]');
    await p.waitForTimeout(150);
    const shared = await p.evaluate(() => window.__copiedList || '');
    t.ok('Keep awake toggles cleanly and Share list formats remaining aisles for texting',
      awakeOn === 'true' && /Shopping List/.test(shared) && /Dairy & eggs:/.test(shared) && /Milk \(2 gal\)/.test(shared),
      JSON.stringify({ awakeOn, shared: shared.slice(0, 140) }));

    await p.click('#view-list [data-cookgo="plan"]');
    await p.waitForTimeout(150);
    await p.click('#view-plan [data-cookgo="list"]');
    await p.waitForTimeout(150);
    t.ok('leaving List releases Keep awake automatically',
      await p.evaluate(() => document.querySelector('#listBody [data-listawake]').getAttribute('aria-pressed') === 'false'));
    await p.context().close();

    /* 5. 320px Dark mode touch & layout audit */
    const dctx = await t.browser.newContext({ viewport: { width: 320, height: 640 }, colorScheme: 'dark' });
    const dp = await dctx.newPage();
    dp.on('pageerror', (e) => errs.push('dark320: ' + e.message));
    await dp.goto(t.base + 'index.html#list');
    await dp.waitForTimeout(350);
    await dp.evaluate(() => {
      const d = window.RECIPES.find((r) => r.book === 2 && r.secNum === 3);
      window.Store.setOpt('store', false);
      window.Store.addToDay(d.id, 'mon', 1);
      window.Store.addExtra('Bananas', '2 bunches', 'Produce');
    });
    await dp.waitForTimeout(250);
    const mobile = await dp.evaluate(() => {
      const card = document.querySelector('#listBody .list-aisle');
      const bg = card ? getComputedStyle(card).backgroundColor : '';
      const ok = bg.match(/oklch\(([\d.]+)/);
      const lum = ok ? parseFloat(ok[1]) : 1;
      const btns = [...document.querySelectorAll('#listBody .list-qadd-in, #listBody .list-qadd-btn, #listBody .list-qchip, #listBody .list-pill, #listBody .list-del, #listBody .wm-btn')];
      const rows = [...document.querySelectorAll('#listBody .list-line')];
      return {
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        rowOverflow: rows.some((r) => r.scrollWidth > r.clientWidth + 1),
        minBtnH: Math.min(...btns.map((b) => Math.round(b.getBoundingClientRect().height))),
        minRowH: Math.min(...rows.filter((r) => r.offsetParent).map((r) => Math.round(r.getBoundingClientRect().height))),
        lum,
      };
    });
    t.ok('at 320px wide in Dark mode, aisle cards have dark surfaces, 0px overflow, and >=44px targets',
      mobile.overflow <= 1 && !mobile.rowOverflow && mobile.minBtnH >= 44 && mobile.minRowH >= 44 && mobile.lum < 0.35,
      JSON.stringify(mobile));
    await dctx.close();

    t.ok('no uncaught page errors', errs.length === 0, errs.join(' | '));
  },
};
