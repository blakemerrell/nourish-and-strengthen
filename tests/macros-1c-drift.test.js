/* Step 1c: Quiet bottom bar + secondary menu tools + Smart Drift Banner.
 *
 * Verifies:
 *  1) .mday-acts renders ONLY #macroFill across states (Craft my plan -> Fill -> Mark all complete / Complete the day).
 *  2) #macroMore opens #macroMenu with #macroRebal, #macroSweep, and #macroAddMeal, and activating each closes #macroMenu.
 *  3) No false-alarm drift banner on a freshly Filled day or partial morning with empty later slots.
 *  4) Finished meal drifting >10% while open unlocked plates exist shows #macroDrift at top of #macroSlots.
 *  5) Dismiss (x) hides #macroDrift for that day state; subsequent food changes allow it to re-appear.
 *  6) 1-tap Rebalance on #macroDrift adjusts unlocked open items, preserves eaten & locked (l === 2) items, clears banner, shows toast.
 *  7) Narrow 320x700 audit: zero overflow, >= 44x44 targets, >= 13px text, no mid-word breaks, scrollable #macroMenu. */
const { nourish, todayOn } = require('./fixtures/nourish.js');

module.exports = nourish({
  name: 'Macros — Step 1c: quiet footer, menu tools & smart drift banner',
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

    const driftInfo = await p.evaluate(() => {
      const dr = document.getElementById('macroDrift');
      const firstChild = document.getElementById('macroSlots').firstElementChild;
      return {
        exists: !!dr,
        isFirst: dr && firstChild && dr.id === firstChild.id,
        text: dr ? dr.querySelector('.mdrift-go').textContent.replace(/\s+/g, ' ').trim() : '',
        sig: dr ? dr.dataset.sig : '',
        hasDismiss: !!(dr && dr.querySelector('[data-mdrift="dismiss"]')),
      };
    });
    t.ok('finished meal >10% off target with unlocked open meals shows #macroDrift at top of #macroSlots',
      driftInfo.exists && driftInfo.isFirst && /Meals are off target/.test(driftInfo.text) &&
        driftInfo.hasDismiss && !!driftInfo.sig,
      JSON.stringify(driftInfo));

    /* 6) Dismiss hides banner & preserves focus; skipping a slot or modifying a food changes signature */
    await p.focus('#macroDrift [data-mdrift="dismiss"]');
    await p.keyboard.press('Enter');
    await p.waitForTimeout(250);
    const dismissState = await p.evaluate(() => ({
      hidden: !document.getElementById('macroDrift'),
      focusKept: !!document.activeElement && document.activeElement !== document.body,
    }));
    t.ok('dismissing #macroDrift hides it for current signature and restores focus off body',
      dismissState.hidden && dismissState.focusKept,
      JSON.stringify(dismissState));

    await p.click('#macroSlots [data-mskipask="s"]');
    await p.waitForTimeout(250);
    const skipDrift = await p.evaluate((oldSig) => {
      const dr = document.getElementById('macroDrift');
      return { exists: !!dr, sig: dr ? dr.dataset.sig : '', changed: dr ? dr.dataset.sig !== oldSig : false };
    }, driftInfo.sig);
    t.ok('skipping a slot updates drift signature and allows #macroDrift to re-appear',
      skipDrift.exists && skipDrift.changed && /#s/.test(skipDrift.sig),
      JSON.stringify(skipDrift));

    await p.click('#macroSlots [data-mskip="s"]');
    await p.waitForTimeout(250);
    await p.click('#macroSlots [data-mamt$="|l:1"]');
    await p.waitForTimeout(200);
    await p.click('#macroSlots [data-mstep="l:1:down"]');
    await p.waitForTimeout(300);
    const driftReappeared = await p.evaluate((oldSig) => {
      const dr = document.getElementById('macroDrift');
      return { exists: !!dr, newSig: dr ? dr.dataset.sig : '', changed: dr ? dr.dataset.sig !== oldSig : false };
    }, driftInfo.sig);
    t.ok('subsequent plate change updates signature and allows #macroDrift to appear again',
      driftReappeared.exists && driftReappeared.changed,
      JSON.stringify(driftReappeared));

    /* 7) 1-tap Rebalance preserves eaten & locked items, resizes unlocked items, clears banner, keeps focus & toasts */
    const beforeRebal = await p.evaluate((dk) => JSON.parse(localStorage.getItem('bsc.macroDays'))[dk], dayKey);
    await p.focus('#macroDrift [data-mdrift="rebal"]');
    await p.keyboard.press('Enter');
    await p.waitForTimeout(350);
    const afterRebal = await p.evaluate((dk) => ({
      day: JSON.parse(localStorage.getItem('bsc.macroDays'))[dk],
      hasDrift: !!document.getElementById('macroDrift'),
      focusKept: !!document.activeElement && document.activeElement !== document.body,
      toast: (document.getElementById('mToast') || document.querySelector('.mtoast') || {}).textContent || '',
    }), dayKey);
    const unlockedChanged = (afterRebal.day.l[1].x !== beforeRebal.l[1].x) ||
      (afterRebal.day.d[1].x !== beforeRebal.d[1].x) ||
      (afterRebal.day.l[0].x !== beforeRebal.l[0].x);
    t.ok('1-tap rebalance preserves eaten & locked items, updates unlocked plates, clears banner, keeps focus & toasts',
      afterRebal.day.b[0].x === 6 && afterRebal.day.b[1].x === 6 &&
        afterRebal.day.d[0].x === 2 && afterRebal.day.d[0].l === 2 &&
        unlockedChanged && !afterRebal.hasDrift && afterRebal.focusKept && /rebalanced/i.test(afterRebal.toast),
      JSON.stringify({ unlockedChanged, hasDrift: afterRebal.hasDrift, focusKept: afterRebal.focusKept, toast: afterRebal.toast, afterRebal: afterRebal.day }));

    await p.context().close();

    /* 8) Narrow 320x700 viewport layout audit with #macroDrift visible */
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
      const dr = document.getElementById('macroDrift');
      const go = dr && dr.querySelector('.mdrift-go');
      const dis = dr && dr.querySelector('.mdrift-x');
      const fill = document.getElementById('macroFill');
      const span = go && go.querySelector('span');
      const wordBroken = (() => {
        if (!span || !span.firstChild) return false;
        const txt = span.firstChild.textContent;
        const range = document.createRange();
        let idx = 0;
        for (const word of txt.split(/\s+/)) {
          const at = txt.indexOf(word, idx);
          idx = at + word.length;
          if (!word.trim()) continue;
          range.setStart(span.firstChild, at);
          range.setEnd(span.firstChild, idx);
          if (range.getClientRects().length > 1) return word;
        }
        return false;
      })();
      const goRect = go ? go.getBoundingClientRect() : { width: 0, height: 0 };
      const disRect = dis ? dis.getBoundingClientRect() : { width: 0, height: 0 };
      const fillRect = fill ? fill.getBoundingClientRect() : { width: 0, height: 0 };
      return {
        docOverflow: document.documentElement.scrollWidth > window.innerWidth,
        hasDrift: !!dr,
        goW: goRect.width, goH: goRect.height,
        disW: disRect.width, disH: disRect.height,
        fillW: fillRect.width, fillH: fillRect.height,
        fontPx: span ? parseFloat(getComputedStyle(span).fontSize) : 0,
        wordBroken,
      };
    });
    t.ok('at 320x700: zero overflow, >= 44x44 targets, >= 13px banner text, no broken words',
      layout320.hasDrift && !layout320.docOverflow &&
        layout320.goW >= 44 && layout320.goH >= 44 &&
        layout320.disW >= 44 && layout320.disH >= 44 &&
        layout320.fillH >= 44 && layout320.fontPx >= 12.95 && !layout320.wordBroken,
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
