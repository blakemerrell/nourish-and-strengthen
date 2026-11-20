/* Step 1c: Quiet bottom bar + secondary menu tools, and (since 1i) no drift banner.
 *
 * Blake, 2026-11-20, of the "Meals are off target — tap to rebalance" strip
 * this step added: "Remove it." It fired at lunchtime on a day whose dinner
 * was planned under its share. Rebalance stays in the ☰ menu, so the checks
 * that the banner appeared, could be dismissed and re-appeared became checks
 * that it never appears, and that the menu's Rebalance does what its 1-tap
 * did: unlocked open plates move, eaten and locked ones stay.
 *
 * Verifies:
 *  1) .mday-acts renders ONLY #macroFill across states (Craft my plan -> Fill -> Mark all complete / Complete the day).
 *  2) #macroMore opens #macroMenu with #macroRebal, #macroSweep, and #macroAddMeal, and activating each closes #macroMenu.
 *  3) No drift banner, on a freshly Filled day, a partial morning, or a day really off target.
 *  4) Rebalance from #macroMenu adjusts unlocked open items and keeps eaten & locked (l === 2) ones.
 *  5) Narrow 320x700 audit: zero overflow, a >= 44px primary button, #macroMenu inside the viewport. */
const { nourish, todayOn } = require('./fixtures/nourish.js');

module.exports = nourish({
  name: 'Macros — Step 1c: quiet footer and menu tools; no drift banner (1i)',
  async suite(t) {
    const p = await t.fresh({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));

    /* 1) Cold start ("Craft my plan") has ONLY #macroFill in .mday-acts */
    await p.evaluate(() => {
      localStorage.removeItem('bsc.macroTargets');
      localStorage.removeItem('bsc.macroDays');
    });
    await p.reload();
    await p.waitForTimeout(400);
    await p.click('.tab[data-view="macros"]');
    await p.waitForTimeout(350);
    const coldBar = await p.evaluate(() => ({
      ids: [...document.querySelectorAll('.mday-acts button')].map((b) => b.id),
      text: (document.getElementById('macroFill') || {}).textContent.trim(),
    }));
    t.ok('cold day bottom bar holds only #macroFill (Craft my plan)',
      coldBar.ids.join() === 'macroFill' && /Craft my plan/.test(coldBar.text),
      JSON.stringify(coldBar));

    /* Seed targets & slots -> planned empty day -> Fill -> Mark all complete */
    const dayKey = await todayOn(p);
    await p.evaluate((dk) => {
      localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 180, f: 60, c: 200 }));
      localStorage.setItem('bsc.macroSlots', JSON.stringify({
        list: [
          { k: 'b', n: 'Breakfast', t: 'b' },
          { k: 'l', n: 'Lunch', t: 'l' },
          { k: 'd', n: 'Dinner', t: 'd' },
          { k: 's', n: 'Snacks', t: 's' },
        ],
        names: { b: 'Breakfast', l: 'Lunch', d: 'Dinner', s: 'Snacks' },
      }));
      localStorage.setItem('bsc.macroDays', JSON.stringify({ [dk]: { b: [], l: [], d: [], s: [] } }));
    }, dayKey);
    await p.reload();
    await p.waitForTimeout(450);
    await p.click('.tab[data-view="macros"]');
    await p.waitForTimeout(350);

    const fillBar = await p.evaluate(() => ({
      ids: [...document.querySelectorAll('.mday-acts button')].map((b) => b.id),
      text: (document.getElementById('macroFill') || {}).textContent.trim(),
    }));
    t.ok('empty planned day bottom bar holds only #macroFill (Fill)',
      fillBar.ids.join() === 'macroFill' && /^Fill$/.test(fillBar.text),
      JSON.stringify(fillBar));

    /* 2) Click Fill -> freshly Filled day has ONLY #macroFill AND no drift banner */
    await p.click('#macroFill');
    await p.waitForTimeout(400);
    const afterFill = await p.evaluate(() => ({
      ids: [...document.querySelectorAll('.mday-acts button')].map((b) => b.id),
      text: (document.getElementById('macroFill') || {}).textContent.trim(),
      hasDrift: !!document.getElementById('macroDrift'),
      filledSlots: [...document.querySelectorAll('#macroSlots .mtray.filled')].length,
    }));
    t.ok('freshly Filled day shows only #macroFill, populates meals, and shows no drift banner',
      afterFill.ids.join() === 'macroFill' && afterFill.filledSlots >= 3 && !afterFill.hasDrift &&
        /Mark all complete|Complete the day/.test(afterFill.text),
      JSON.stringify(afterFill));

    /* 3) Open #macroMore -> Add meal / Rebalance / Sweep live inside #macroMenu and auto-close it */
    await p.click('#macroMore');
    await p.waitForTimeout(200);
    const menuCheck = await p.evaluate(() => {
      const m = document.getElementById('macroMenu');
      const items = [...m.querySelectorAll('[role="menuitem"]')].map((b) => b.id || b.dataset.mmore || '');
      return { open: !m.classList.contains('hide'), items };
    });
    t.ok('#macroMenu opens and lists Rebalance, Sweep, Add meal before Copy day',
      menuCheck.open && menuCheck.items.indexOf('macroRebal') >= 0 &&
        menuCheck.items.indexOf('macroSweep') > menuCheck.items.indexOf('macroRebal') &&
        menuCheck.items.indexOf('macroAddMeal') > menuCheck.items.indexOf('macroSweep') &&
        menuCheck.items[menuCheck.items.length - 1] === 'macroCopy',
      JSON.stringify(menuCheck));

    await p.click('#macroMenu #macroAddMeal');
    await p.waitForTimeout(250);
    const afterAddMeal = await p.evaluate(() => ({
      menuClosed: document.getElementById('macroMenu').classList.contains('hide'),
      addPopOpen: !document.getElementById('macroAddPop').hidden && !document.getElementById('macroAddPop').classList.contains('hide'),
    }));
    t.ok('clicking Add meal inside #macroMenu closes menu and opens #macroAddPop',
      afterAddMeal.menuClosed && afterAddMeal.addPopOpen,
      JSON.stringify(afterAddMeal));

    await p.click('#macroMore');
    await p.waitForTimeout(200);
    await p.click('#macroMenu #macroSweep');
    await p.waitForTimeout(300);
    const afterSweep = await p.evaluate((dk) => {
      const d = JSON.parse(localStorage.getItem('bsc.macroDays'))[dk] || {};
      const count = Object.keys(d).reduce((s, k) => s + (d[k] || []).length, 0);
      return { menuClosed: document.getElementById('macroMenu').classList.contains('hide'), count };
    }, dayKey);
    t.ok('clicking Sweep inside #macroMenu closes menu and clears un-eaten/unlocked plates',
      afterSweep.menuClosed && afterSweep.count === 0,
      JSON.stringify(afterSweep));

    /* 4) Partial morning on target (later meals empty) -> no false-alarm drift banner */
    await p.evaluate((dk) => {
      localStorage.setItem('bsc.macroDays', JSON.stringify({
        [dk]: {
          b: [{ id: 'f:egg_white', x: 3, eaten: 0 }, { id: 'f:oats', x: 1, eaten: 0 }],
          l: [],
          d: [],
          s: [],
        },
      }));
    }, dayKey);
    await p.reload();
    await p.waitForTimeout(450);
    await p.click('.tab[data-view="macros"]');
    await p.waitForTimeout(300);
    const partialMorningDrift = await p.evaluate(() => !!document.getElementById('macroDrift'));
    t.ok('partial morning with empty later meals does not trigger drift banner',
      !partialMorningDrift, String(partialMorningDrift));

    /* 5) Earlier eaten meal over target (>10%) while open unlocked meals exist -> #macroDrift appears */
    await p.evaluate((dk) => {
      localStorage.setItem('bsc.macroDays', JSON.stringify({
        [dk]: {
          b: [
            { id: 'f:oats', x: 6, eaten: 1 },
            { id: 'f:peanut_butter', x: 6, eaten: 1 },
          ],
          l: [
            { id: 'f:egg_white', x: 3, eaten: 0 },
            { id: 'f:oats', x: 2, eaten: 0 },
          ],
          d: [
            { id: 'f:peanut_butter', x: 2, eaten: 0, l: 2 },
            { id: 'f:egg_white', x: 4, eaten: 0 },
          ],
          s: [],
        },
      }));
    }, dayKey);
    await p.reload();
    await p.waitForTimeout(450);
    await p.click('.tab[data-view="macros"]');
    await p.waitForTimeout(350);

    const noBanner = await p.evaluate(() => ({
      drift: !!document.getElementById('macroDrift'),
      any: document.querySelectorAll('.mdrift, [data-mdrift]').length,
      text: /off target/i.test(document.getElementById('macroSlots').textContent),
    }));
    t.ok('a finished meal well off target, with open meals still to adjust, draws no banner (1i)',
      !noBanner.drift && noBanner.any === 0 && !noBanner.text, JSON.stringify(noBanner));

    /* 7) Rebalance from the menu keeps eaten & locked items and resizes unlocked ones */
    const beforeRebal = await p.evaluate((dk) => JSON.parse(localStorage.getItem('bsc.macroDays'))[dk], dayKey);
    await p.click('#macroMore');
    await p.waitForTimeout(200);
    await p.click('#macroRebal');
    await p.waitForTimeout(350);
    const afterRebal = await p.evaluate((dk) => ({
      day: JSON.parse(localStorage.getItem('bsc.macroDays'))[dk],
      menuShut: document.getElementById('macroMenu').hidden || document.getElementById('macroMenu').classList.contains('hide'),
    }), dayKey);
    const unlockedChanged = (afterRebal.day.l[1].x !== beforeRebal.l[1].x) ||
      (afterRebal.day.d[1].x !== beforeRebal.d[1].x) ||
      (afterRebal.day.l[0].x !== beforeRebal.l[0].x);
    t.ok('Rebalance from the menu keeps eaten & locked plates and moves unlocked ones',
      afterRebal.day.b[0].x === 6 && afterRebal.day.b[1].x === 6 &&
        afterRebal.day.d[0].x === 2 && afterRebal.day.d[0].l === 2 &&
        unlockedChanged && afterRebal.menuShut,
      JSON.stringify({ unlockedChanged, menuShut: afterRebal.menuShut, afterRebal: afterRebal.day }));

    await p.context().close();

    /* 8) Narrow 320x700 viewport layout audit on a drifting day (no banner since 1i) */
    const np = await t.fresh({ viewport: { width: 320, height: 700 }, hasTouch: true, isMobile: true });
    np.on('pageerror', (e) => errs.push(e.message));
    const npDay = await todayOn(np);
    await np.evaluate((dk) => {
      localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 180, f: 60, c: 200 }));
      localStorage.setItem('bsc.macroSlots', JSON.stringify({
        list: [
          { k: 'b', n: 'Breakfast', t: 'b' },
          { k: 'l', n: 'Lunch', t: 'l' },
          { k: 'd', n: 'Dinner', t: 'd' },
        ],
        names: { b: 'Breakfast', l: 'Lunch', d: 'Dinner' },
      }));
      localStorage.setItem('bsc.macroDays', JSON.stringify({
        [dk]: {
          b: [{ id: 'f:oats', x: 6, eaten: 1 }, { id: 'f:peanut_butter', x: 5, eaten: 1 }],
          l: [{ id: 'f:egg_white', x: 3, eaten: 0 }, { id: 'f:oats', x: 2, eaten: 0 }],
          d: [{ id: 'f:egg_white', x: 4, eaten: 0 }],
        },
      }));
    }, npDay);
    await np.reload();
    await np.waitForTimeout(450);
    await np.click('.tab[data-view="macros"]');
    await np.waitForTimeout(350);

    const layout320 = await np.evaluate(() => {
      const fill = document.getElementById('macroFill');
      const fillRect = fill ? fill.getBoundingClientRect() : { width: 0, height: 0 };
      return {
        docOverflow: document.documentElement.scrollWidth > window.innerWidth,
        hasDrift: !!document.getElementById('macroDrift'),
        fillH: fillRect.height,
      };
    });
    t.ok('at 320x700: zero overflow, no banner, and the primary button is >= 44px tall',
      !layout320.hasDrift && !layout320.docOverflow && layout320.fillH >= 44,
      JSON.stringify(layout320));

    await np.click('#macroMore');
    await np.waitForTimeout(250);
    const menu320 = await np.evaluate(() => {
      const m = document.getElementById('macroMenu');
      const r = m.getBoundingClientRect();
      const btns = [...m.querySelectorAll('button')];
      return {
        open: !m.hidden && !m.classList.contains('hide'),
        fitsViewport: r.bottom <= window.innerHeight + 1 && r.height <= window.innerHeight,
        minBtnH: Math.min(...btns.map((b) => b.getBoundingClientRect().height)),
      };
    });
    t.ok('at 320x700: #macroMenu stays inside viewport height and all items are >= 44px',
      menu320.open && menu320.fitsViewport && menu320.minBtnH >= 43.9,
      JSON.stringify(menu320));

    await np.context().close();
    t.ok('no page errors', errs.length === 0, errs.join(' | '));
  },
});
