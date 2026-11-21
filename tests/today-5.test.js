/* Step 5 (Today + 2c morning weigh-in):
 *   1. Inline 1-tap morning weigh-in on Today (including lifters with a training
 *      block and no macro targets), plus outlier confirmation.
 *   2. Today Eating/Macros card shows kcal left, current/goal kcal + g protein to go,
 *      and an always-visible >=44px "+ Log food" CTA even when meals are populated.
 *   3. Today Workout card leads with Start <Name> above a collapsible exercise list
 *      (tapping the summary expands exercises without navigating away).
 *   4. Tonight ("Plan >") and Shopping ("List >", #0053E2 Walmart cart CTA,
 *      "Open the list") headers and doors work end-to-end. */

const { nourish } = require('./fixtures/nourish.js');

const MORNING = new Date(2026, 9, 1, 9, 0, 0); // Thursday, Oct 1 2026

module.exports = nourish({
  name: 'Today Step 5: 2c inline weigh-in, current/goal + Log food, Start-first workout, doors & Walmart',
  async suite(t) {
    const errs = [];

    /* 1. Lifter without macro targets sees inline 2c weigh-in & Start above folded lifts */
    {
      const p = await t.fresh({ viewport: { width: 412, height: 915 } });
      p.on('pageerror', (e) => errs.push('lifter: ' + e.message));
      await p.clock.setFixedTime(MORNING);
      await p.reload();
      await p.waitForTimeout(600);
      await p.evaluate(() => {
        localStorage.setItem('sh.view', 'today');
        localStorage.setItem('sh.viewAt', String(Date.now()));
        localStorage.setItem('bsc.macroWeights', JSON.stringify({
          '2026-09-28': 190,
          '2026-09-29': 190,
          '2026-09-30': 190,
        }));
        const _ = window.Train._, ms = _.build({ goal: 'grow', dpw: 4, kit: 'gym', lvl: 1, acc: 4, pri: [] });
        ms.id = 'b5'; ms.n = 'Fall block'; ms.at = Date.now() - 3 * 864e5;
        localStorage.setItem('bsc.train', JSON.stringify({
          pr: { u: 'lb', qz: 1, lvl: 1, ld: [0, 1, 3, 4] },
          act: 'b5', ms: { b5: ms }, cx: {}, ax: {}, wo: {},
        }));
      });
      await p.reload();
      await p.waitForTimeout(700);

      const init = await p.evaluate(() => ({
        hasInput: !!document.querySelector('#todayRoot .td-morning #tdWeightIn'),
        hasSave: !!document.querySelector('#todayRoot [data-td="weighsave"]'),
      }));
      t.ok('lifter with training block and no macro targets sees inline 2c weigh-in on Today',
        init.hasInput && init.hasSave, JSON.stringify(init));

      // Outlier confirmation flow (150 vs 190 average -> weighforce -> saved)
      await p.fill('#tdWeightIn', '150');
      await p.click('#todayRoot [data-td="weighsave"]');
      await p.waitForTimeout(150);
      const oddState = await p.evaluate(() => ({
        forceBtn: !!document.querySelector('#todayRoot [data-td="weighforce"]'),
        oddMsg: (document.querySelector('#todayRoot .td-weigh-odd') || {}).textContent || '',
        stored: JSON.parse(localStorage.getItem('bsc.macroWeights') || '{}')['2026-10-01'] || null,
      }));
      t.ok('outlier weigh-in asks for confirmation before saving',
        oddState.forceBtn && /190/.test(oddState.oddMsg) && oddState.stored === null,
        JSON.stringify(oddState));

      await p.click('#todayRoot [data-td="weighforce"]');
      await p.waitForTimeout(150);
      const saved = await p.evaluate(() => ({
        stored: JSON.parse(localStorage.getItem('bsc.macroWeights') || '{}')['2026-10-01'],
        rowTxt: (document.querySelector('#todayRoot .td-weigh.done') || {}).textContent || '',
        formGone: !document.querySelector('#todayRoot .td-weigh-quick'),
      }));
      t.ok('confirming inline weigh-in saves to bsc.macroWeights and folds to Weighed in line',
        saved.stored === 150 && /150/.test(saved.rowTxt) && saved.formGone,
        JSON.stringify(saved));

      // Workout card leads with Start above folded lift list; toggling summary does not navigate
      const wo = await p.evaluate(() => {
        const start = document.querySelector('[data-card="workout"] [data-td="start"]');
        const fold = document.querySelector('[data-card="workout"] .td-lifts-fold');
        return {
          startTop: start ? Math.round(start.getBoundingClientRect().top) : -1,
          startH: start ? Math.round(start.getBoundingClientRect().height) : -1,
          foldTop: fold ? Math.round(fold.getBoundingClientRect().top) : -1,
          openBefore: fold ? fold.open : null,
        };
      });
      t.ok('Workout card places >=44px Start CTA above folded exercise list',
        wo.startTop > 0 && wo.foldTop > wo.startTop && wo.startH >= 44 && wo.openBefore === false,
        JSON.stringify(wo));

      await p.click('[data-card="workout"] .td-lifts-fold > summary');
      await p.waitForTimeout(150);
      const afterFold = await p.evaluate(() => ({
        stillToday: !document.getElementById('view-today').classList.contains('hide'),
        openAfter: document.querySelector('[data-card="workout"] .td-lifts-fold').open,
        visibleLifts: document.querySelectorAll('[data-card="workout"] .td-lifts li:not(.td-more)').length,
      }));
      t.ok('tapping See exercises expands the lift list while staying on Today',
        afterFold.stillToday && afterFold.openAfter === true && afterFold.visibleLifts >= 1,
        JSON.stringify(afterFold));

      await p.context().close();
    }

    /* 2. Macros current/goal + left + always-there + Log food + Tonight/Shop doors */
    {
      const p = await t.fresh({ viewport: { width: 412, height: 915 } });
      p.on('pageerror', (e) => errs.push('macros+shop: ' + e.message));
      await p.clock.setFixedTime(MORNING);
      await p.reload();
      await p.waitForTimeout(600);
      await p.evaluate(() => {
        localStorage.setItem('sh.view', 'today');
        localStorage.setItem('sh.viewAt', String(Date.now()));
        localStorage.setItem('bsc.macroProfile', JSON.stringify({ sex: 'm', age: 43, ft: 5, inch: 11, lb: 190, act: 1.55, goal: 'cut1' }));
        localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 190, f: 70, c: 230 }));
        localStorage.setItem('bsc.macroDays', JSON.stringify({
          '2026-10-01': { b: [{ id: 1, x: 1, eaten: 1 }], l: [{ id: 2, x: 1, eaten: 0 }] },
        }));
        const d = window.RECIPES.filter((r) => r.book === 2 && r.secNum === 3).slice(0, 2);
        window.Store.setOpt('setup', true);
        window.Store.setOpt('store', false);
        window.Store.addToDay(d[0].id, 'thu', 1);
        window.Store.addToDay(d[1].id, 'fri', 1);
      });
      await p.reload();
      await p.waitForTimeout(700);

      // Test non-outlier 1-tap inline weigh-in
      await p.fill('#tdWeightIn', '188.4');
      await p.click('#todayRoot [data-td="weighsave"]');
      await p.waitForTimeout(150);
      t.ok('normal weight saves in 1 tap without outlier prompt',
        await p.evaluate(() => JSON.parse(localStorage.getItem('bsc.macroWeights') || '{}')['2026-10-01'] === 188.4 &&
          /188\.4 lb/.test((document.querySelector('#todayRoot .td-weigh.done') || {}).textContent || '')));

      const eat = await p.evaluate(() => {
        const cur = (document.querySelector('[data-card="eating"] .td-eat-cur') || {}).textContent || '';
        const logBtn = document.querySelector('[data-card="eating"] [data-td="addfood"]');
        const logH = logBtn ? Math.round(logBtn.getBoundingClientRect().height) : 0;
        const logTxt = logBtn ? logBtn.textContent.trim() : '';
        return { cur, logH, logTxt };
      });
      t.ok('Eating card shows current/goal kcal + protein to go and >=44px + Log food even with populated meals',
        /\d[\d,]*\s*\/\s*\d[\d,]*\s*kcal/.test(eat.cur) && /g\s*protein (to go|over)/.test(eat.cur) &&
        eat.logH >= 44 && eat.logTxt === '+ Log food', JSON.stringify(eat));

      const doors = await p.evaluate(() => {
        const tonDoor = (document.querySelector('[data-card="tonight"] .td-tab') || {}).textContent || '';
        const shpDoor = (document.querySelector('[data-card="shop"] .td-tab') || {}).textContent || '';
        const wm = document.querySelector('[data-card="shop"] a.wm-btn');
        const listBtn = document.querySelector('[data-card="shop"] [data-td="list"]');
        return {
          tonDoor: tonDoor.trim(),
          shpDoor: shpDoor.trim(),
          wmHref: wm ? wm.getAttribute('href') : '',
          listTxt: listBtn ? listBtn.textContent.trim() : '',
        };
      });
      t.ok('Tonight (Cook >) and Shopping (List > + Walmart cart + Open the list) expose expected doors',
        /^Cook/.test(doors.tonDoor) && /^List/.test(doors.shpDoor) &&
        /^https:\/\/www\.walmart\.com\/sc\/cart\/addToCart\?items=\d+_\d+/.test(doors.wmHref) &&
        doors.listTxt === 'Open the list', JSON.stringify(doors));

      // Verify tapping + Log food opens picker on today
      await p.click('[data-card="eating"] [data-td="addfood"]');
      await p.waitForTimeout(300);
      t.ok('+ Log food opens food picker in Nourish',
        await p.evaluate(() => !!document.getElementById('mpFind')));
      await p.keyboard.press('Escape');
      await p.waitForTimeout(150);

      // Return to Today and verify Open the list navigates to #view-list
      await p.click('.tab[data-view="today"]');
      await p.waitForTimeout(150);
      await p.click('[data-card="shop"] [data-td="list"]');
      await p.waitForTimeout(150);
      t.ok('Open the list navigates to view-list',
        await p.evaluate(() => !document.getElementById('view-list').classList.contains('hide')));

      await p.context().close();
    }

    t.ok('no uncaught page errors', errs.length === 0, errs.join(' | '));
  },
});
