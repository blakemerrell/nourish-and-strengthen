/* Step 1b: RP-style always-open inline meal view & separated food search.
 *
 * Verifies:
 *  1) Populated meal card opens separated Meal View (data-mode="meal"), hiding #mpFind/#mpList
 *     and rendering every food open simultaneously with Lock, dial, dot menu, and kcal delta.
 *  2) Empty meal / + icon / Saved meals open Food Search (data-mode="find") with #mpFind.
 *  3) meal -> + Add foods -> find transitions cleanly back to meal on Back to <Meal>, Done, or goBack().
 *  4) 1-tap Lock (l === 2) holds during Balance while permitting manual - / + edits.
 *  5) 1-tap Saved Meal Split (.mrow-split[data-mexplode]) explodes composite meal + toast Undo restores.
 *  6) Deleting the last food in meal mode stays in meal mode and preserves everyday pins.
 *  7) Narrow 320px touch viewport has zero horizontal overflow, >= 44x34 tap targets, single-line dials,
 *     and >= 13px visible text. */
const { nourish, todayOn } = require('./fixtures/nourish.js');

module.exports = nourish({
  name: 'Macros — Step 1b: inline meal view, 1-tap lock & split, separated search',
  async suite(t) {
    const p = await t.fresh({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));

    const dayKey = await todayOn(p);
    await p.evaluate((dk) => {
      localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 180, f: 60, c: 200 }));
      localStorage.setItem('bsc.macroSlots', JSON.stringify({
        list: [
          { k: 'b', n: 'Breakfast', t: 'b', pins: [{ id: 'f:egg_white', x: 2 }] },
          { k: 'l', n: 'Lunch', t: 'l' },
          { k: 'd', n: 'Dinner', t: 'd' },
          { k: 's', n: 'Snacks', t: 's' },
        ],
        names: { b: 'Breakfast', l: 'Lunch', d: 'Dinner', s: 'Snacks' },
      }));
      localStorage.setItem('bsc.macroDays', JSON.stringify({
        [dk]: {
          b: [
            { id: 'f:egg_white', x: 2, eaten: 0 },
            { id: 'f:oats', x: 1, eaten: 0 },
            { id: 'f:peanut_butter', x: 2, eaten: 0 },
          ],
          l: [],
          d: [],
          s: [],
        },
      }));
    }, dayKey);
    await p.reload();
    await p.waitForTimeout(500);
    await p.click('.tab[data-view="macros"]');
    await p.waitForTimeout(350);

    /* 1) Populated meal card opens separated Meal View (data-mode="meal") */
    await p.evaluate(() => {
      const b = document.querySelector('#macroSlots .mtray-b[data-mopen="b"]');
      if (b) { b.scrollIntoView({ block: 'center' }); b.click(); }
    });
    await p.waitForTimeout(300);

    const mealView = await p.evaluate(() => {
      const sh = document.querySelector('#modalRoot .msheet');
      const rows = [...document.querySelectorAll('#modalRoot .mrows .mrow')];
      return {
        mode: sh ? sh.getAttribute('data-mode') : '',
        hasFind: !!document.querySelector('#modalRoot #mpFind'),
        hasList: !!document.querySelector('#modalRoot #mpList'),
        hasDelta: !!document.querySelector('#modalRoot .msh-delta'),
        remText: (document.querySelector('#modalRoot .msh-rem') || {}).textContent || '',
        nRows: rows.length,
        allOpen: rows.every((r) => r.classList.contains('mrow-open') &&
          !!r.querySelector('.mrow-lock') &&
          !!r.querySelector('.mrow-dial') &&
          !!r.querySelector('[data-mfmenu]') &&
          !r.querySelector('[data-mrowopen]')),
        acts: [...document.querySelectorAll('#modalRoot .msh-acts button')].map((b) => b.textContent.trim()),
      };
    });
    t.ok('populated meal card opens separated meal mode with no #mpFind/#mpList',
      mealView.mode === 'meal' && !mealView.hasFind && !mealView.hasList,
      JSON.stringify(mealView));
    t.ok('meal header displays kcal delta pill and every food row opens simultaneously',
      mealView.hasDelta && /kcal (left|over)/.test(mealView.remText) &&
        mealView.nRows === 3 && mealView.allOpen,
      JSON.stringify(mealView));
    t.ok('bottom bar offers + Add foods, Balance, and Done',
      mealView.acts.join('|') === '+ Add foods|Balance|Done',
      JSON.stringify(mealView.acts));

    /* 3) meal -> + Add foods -> find transitions back cleanly via Back button, Done, and goBack() */
    await p.click('#modalRoot .msh-acts [data-mpmode="home"]');
    await p.waitForTimeout(300);
    const findFromMeal = await p.evaluate(() => ({
      mode: document.querySelector('#modalRoot .msheet')?.getAttribute('data-mode') || '',
      find: !!document.querySelector('#modalRoot #mpFind'),
      backText: (document.querySelector('#modalRoot .msh-backmeal') || {}).textContent || '',
    }));
    t.ok('+ Add foods enters find mode with Back to Breakfast button',
      findFromMeal.mode === 'find' && findFromMeal.find && /Back to Breakfast/.test(findFromMeal.backText),
      JSON.stringify(findFromMeal));

    await p.click('#modalRoot .msh-backmeal');
    await p.waitForTimeout(250);
    t.ok('Back to Breakfast returns to meal mode instead of closing the sheet',
      await p.evaluate(() => document.querySelector('#modalRoot .msheet')?.getAttribute('data-mode') === 'meal' &&
        !document.querySelector('#modalRoot #mpFind')));

    await p.click('#modalRoot .msh-acts [data-mpmode="home"]');
    await p.waitForTimeout(250);
    await p.click('#modalRoot .msh-done');
    await p.waitForTimeout(250);
    t.ok('Done inside find opened from meal returns to meal mode',
      await p.evaluate(() => document.querySelector('#modalRoot .msheet')?.getAttribute('data-mode') === 'meal'));

    await p.click('#modalRoot .msh-acts [data-mpmode="home"]');
    await p.waitForTimeout(250);
    await p.goBack();
    await p.waitForTimeout(250);
    t.ok('browser/Android back inside find opened from meal returns to meal mode',
      await p.evaluate(() => document.querySelector('#modalRoot .msheet')?.getAttribute('data-mode') === 'meal'));

    /* 4) 1-tap Lock holds during Balance while permitting manual +/- */
    await p.click('#modalRoot .mrow-lock[data-mlock="b:0"]');
    await p.waitForTimeout(200);
    const locked0 = await p.evaluate((dk) => {
      const btn = document.querySelector('#modalRoot .mrow-lock[data-mlock="b:0"]');
      const b = JSON.parse(localStorage.getItem('bsc.macroDays'))[dk].b;
      return { pressed: btn?.getAttribute('aria-pressed'), l: b[0].l, x0: b[0].x };
    }, dayKey);
    await p.click('#modalRoot [data-mstep="b:0:up"]');
    await p.waitForTimeout(200);
    const steppedWhileLocked = await p.evaluate((dk) => {
      const b = JSON.parse(localStorage.getItem('bsc.macroDays'))[dk].b;
      return { l: b[0].l, x: b[0].x, x1: b[1].x };
    }, dayKey);
    await p.click('#modalRoot .msh-acts [data-mbal="b"]');
    await p.waitForTimeout(300);
    const afterBalance = await p.evaluate((dk) => {
      const b = JSON.parse(localStorage.getItem('bsc.macroDays'))[dk].b;
      return { l: b[0].l, x: b[0].x, x1: b[1].x };
    }, dayKey);
    t.ok('1-tap Lock allows manual +/- adjustments while keeping l === 2 and holding during Balance',
      locked0.pressed === 'true' && locked0.l === 2 &&
        steppedWhileLocked.x > locked0.x0 && steppedWhileLocked.l === 2 &&
        Math.abs(afterBalance.x - steppedWhileLocked.x) < 1e-9 &&
        Math.abs(afterBalance.x1 - steppedWhileLocked.x1) > 1e-4,
      JSON.stringify({ locked0, steppedWhileLocked, afterBalance }));

    /* Close meal back to day and check empty meal & + icon direct find mode */
    await p.click('#modalRoot .msh-done');
    await p.waitForTimeout(250);
    t.ok('Done in meal mode closes the sheet back to the day',
      !(await p.$('#modalRoot .msheet')));

    /* 2) Empty meal card and + icon on populated meal open find mode directly */
    await p.click('#macroSlots [data-mopen="l"]');
    await p.waitForTimeout(250);
    t.ok('tapping an empty meal opens find mode directly',
      await p.evaluate(() => document.querySelector('#modalRoot .msheet')?.getAttribute('data-mode') === 'find' &&
        !!document.querySelector('#modalRoot #mpFind')));
    await p.click('#modalRoot .msh-done');
    await p.waitForTimeout(250);

    await p.click('#macroSlots .mtray-ib[data-mopen="b"][data-madd="1"]');
    await p.waitForTimeout(250);
    t.ok('tapping the + icon on a populated meal card opens find mode directly',
      await p.evaluate(() => document.querySelector('#modalRoot .msheet')?.getAttribute('data-mode') === 'find' &&
        !!document.querySelector('#modalRoot #mpFind')));
    await p.click('#modalRoot .msh-done');
    await p.waitForTimeout(250);

    /* 5) 1-tap Saved Meal Split (.mrow-split[data-mexplode]) + toast Undo */
    await p.evaluate(() => {
      const b = document.querySelector('#macroSlots .mtray-b[data-mopen="b"]');
      if (b) { b.scrollIntoView({ block: 'center' }); b.click(); }
    });
    await p.waitForTimeout(250);
    await p.click('#modalRoot [data-mmenu="b"]');
    await p.waitForTimeout(200);
    await p.click('#modalRoot .msh-menu [data-mkeep="b"]');
    await p.waitForTimeout(250);
    await p.fill('#mkName', 'Morning Protein Mix');
    await p.click('[data-mkdo="mine"]');
    await p.waitForTimeout(350);

    const splitShown = await p.evaluate(() => {
      const btn = document.querySelector('#modalRoot .mrow-split[data-mexplode="b:0"]');
      return { exists: !!btn, text: btn ? btn.textContent.trim() : '' };
    });
    t.ok('saved composite meal displays a 1-tap Split into foods button directly on the row',
      splitShown.exists && /Recipe with 3 foods/.test(splitShown.text) && /Split into foods/.test(splitShown.text),
      JSON.stringify(splitShown));

    await p.click('#modalRoot .mrow-split[data-mexplode="b:0"]');
    await p.waitForTimeout(300);
    const explodedIds = await p.evaluate((dk) =>
      JSON.parse(localStorage.getItem('bsc.macroDays'))[dk].b.map((x) => x.id), dayKey);
    t.ok('1-tap Split breaks the saved meal into its 3 component foods',
      explodedIds.join(',') === 'f:egg_white,f:oats,f:peanut_butter',
      JSON.stringify(explodedIds));

    await p.click('#mToast [data-mexplodeundo]');
    await p.waitForTimeout(300);
    const undoIds = await p.evaluate((dk) =>
      JSON.parse(localStorage.getItem('bsc.macroDays'))[dk].b.map((x) => x.id), dayKey);
    t.ok('toast Undo restores the saved composite meal',
      undoIds.length === 1 && /^f:my:/.test(undoIds[0]),
      JSON.stringify(undoIds));

    /* 7) 320px narrow phone layout, >= 44x34 targets, and >= 13px typography */
    await p.setViewportSize({ width: 320, height: 700 });
    await p.waitForTimeout(250);
    const narrowAudit = await p.evaluate(() => {
      const sh = document.querySelector('#modalRoot .msheet');
      if (!sh) return null;
      const small = [];
      sh.querySelectorAll('button').forEach((b) => {
        const r = b.getBoundingClientRect();
        if (!r.width || !r.height) return;
        if (r.height < 43.5 || r.width < 34) small.push((b.className || b.tagName) + ':' + Math.round(r.width) + 'x' + Math.round(r.height));
      });
      const dialsOk = [...sh.querySelectorAll('.mrows .mrow')].every((row) => {
        const parts = [row.querySelector('[data-mstep$=":down"]'), row.querySelector('.mstep-x'), row.querySelector('[data-mstep$=":up"]')].map((e) => e.getBoundingClientRect());
        const bar = row.querySelector('.mrow-dial').getBoundingClientRect();
        return parts.every((r) => r.top >= bar.top - 1 && r.bottom <= bar.bottom + 1) &&
          parts[1].left >= parts[0].right - 1 && parts[2].left >= parts[1].right - 1;
      });
      const tinyText = [];
      const w = document.createTreeWalker(sh, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = w.nextNode())) {
        const el = n.parentElement;
        if (!n.textContent.trim() || !el || el.closest('svg, .leaf-n, .leaf-sr, .vis-hidden, [aria-hidden="true"], .hide, [hidden]')) continue;
        if (!el.getBoundingClientRect().width) continue;
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs < 12.95) tinyText.push(fs + 'px:' + n.textContent.trim().slice(0, 16));
      }
      return {
        docOverflow: document.documentElement.scrollWidth > window.innerWidth,
        sheetOverflow: sh.scrollWidth > sh.clientWidth + 1,
        small,
        dialsOk,
        tinyText,
      };
    });
    t.ok('at 320px width: no overflow, >= 44x34 buttons, single-line dials, >= 13px text',
      !!narrowAudit && !narrowAudit.docOverflow && !narrowAudit.sheetOverflow &&
        narrowAudit.small.length === 0 && narrowAudit.dialsOk && narrowAudit.tinyText.length === 0,
      JSON.stringify(narrowAudit));

    /* 6) Deleting last item (pinned item) stays calmly in meal mode and preserves pin */
    await p.click('#modalRoot [data-mfmenu="b:0"]');
    await p.waitForTimeout(200);
    await p.click('#modalRoot .mrow-menu [data-mdel="b:0"]');
    await p.waitForTimeout(250);
    const afterDelLast = await p.evaluate((dk) => {
      const sh = document.querySelector('#modalRoot .msheet');
      const d = JSON.parse(localStorage.getItem('bsc.macroDays'))[dk] || {};
      const slots = JSON.parse(localStorage.getItem('bsc.macroSlots')) || {};
      const bPins = ((slots.list || []).find((s) => s.k === 'b') || {}).pins || [];
      return {
        mode: sh ? sh.getAttribute('data-mode') : '',
        emptyText: (document.querySelector('#modalRoot .msh-on-empty') || {}).textContent || '',
        hasAddFoods: !!document.querySelector('#modalRoot .msh-acts [data-mpmode="home"]'),
        hasFind: !!document.querySelector('#modalRoot #mpFind'),
        bLen: (d.b || []).length,
        hasEggPin: bPins.some((pn) => pn.id === 'f:egg_white'),
      };
    }, dayKey);
    t.ok('deleting the last item stays in meal mode, prompts Add foods, and preserves everyday pins',
      afterDelLast.mode === 'meal' && !afterDelLast.hasFind && afterDelLast.hasAddFoods &&
        /0 foods/.test(afterDelLast.emptyText) && afterDelLast.bLen === 0 && afterDelLast.hasEggPin,
      JSON.stringify(afterDelLast));

    t.ok('no page errors', errs.length === 0, errs.join(' | '));
    await p.context().close();
  },
});
