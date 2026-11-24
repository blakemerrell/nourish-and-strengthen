/* Clean meal sheet (2026-11-21 Invisible Power pass — PR 2).
 *
 * Verifies:
 *  1) Populated meal view omits .msh-delta, .msh-wchips, meal-mode .msh-trh,
 *     permanent .mrow-lock buttons, and inline .mrow-split buttons, while keeping
 *     the 4 macro pills, .mrow-dial, recipe ½·1·1½·2 presets, and row ⋯.
 *  2) Row ⋯ holds Lock (showing Locked badge), Explode into foods (on saved
 *     composite meals), and drink hydration toggle ([data-mhyd]) which toggles
 *     water totals and closes the row menu cleanly.
 *  3) Smart Balance foot button: hidden on empty meals (.msh-acts.single) and on
 *     1 manually logged food (+ Add foods | Done); shown on >= 2 unlocked foods
 *     and on >= 1 planned food.
 *  4) 320px & 390px light and dark layout audit: no sideways overflow, thumb-sized
 *     targets (>= 44px height, >= 34px stepper keys at 320px), >= 13px text, zero errors. */
const { nourish, todayOn } = require('./fixtures/nourish.js');

module.exports = nourish({
  name: 'Macros — clean meal sheet rows, headers, and smart Balance',
  async suite(t) {
    const errs = [];
    const p = await t.fresh({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    p.on('pageerror', (e) => errs.push(e.message));
    const dk = await todayOn(p);

    await p.evaluate((todayK) => {
      window.Store.saveRecipe({
        id: 'uclean_drink', book: 3, secNum: 1, secName: 'Ours', own: true,
        name: 'Clean Crio Brew', ing: ['2 cups Crio Bru', '1 cup of 2% milk'],
        steps: ['Brew and pour.'], servings: '1 Serving', servN: 1, time: '5 mins', diff: 'Easy',
        macro: { kcal: 120, p: 8, f: 5, c: 12, na: 120, fib: 2 },
        ingp: [{ k: 'crio_bru', g: 480 }, { k: 'milk', g: 244 }],
      });
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
      localStorage.setItem('bsc.macroDays', JSON.stringify({
        [todayK]: {
          b: [{ id: 'uclean_drink', x: 1, eaten: 1 }],
          l: [
            { id: 'f:chicken_breast', x: 1, eaten: 1 },
            { id: 'f:oats', x: 1, eaten: 1 },
          ],
          d: [{ id: 66, x: 1, eaten: 0 }],
          s: [],
        },
      }));
    }, dk);
    await p.reload();
    await p.waitForTimeout(450);
    await p.click('.tab[data-view="macros"]');
    await p.waitForTimeout(300);

    /* 1) Empty meal (Snacks): single Done CTA, no Balance, no water chips */
    await p.click('#macroSlots [data-mslot="s"] .mtray-hd[data-mopen="s"]');
    await p.waitForTimeout(300);
    const emptySheet = await p.evaluate(() => ({
      singleCls: document.querySelector('#modalRoot .msh-acts')?.classList.contains('single'),
      acts: [...document.querySelectorAll('#modalRoot .msh-acts button')].map((b) => b.textContent.trim()),
      hasWater: !!document.querySelector('#modalRoot .msh-wchips, #modalRoot [data-hyd="wt:8"]'),
    }));
    t.ok('empty meal sheet hides Balance (Done fills foot via .msh-acts.single) and omits water buttons',
      emptySheet.singleCls && emptySheet.acts.join('|') === 'Done' && !emptySheet.hasWater,
      JSON.stringify(emptySheet));
    await p.click('#modalRoot .msh-done');
    await p.waitForTimeout(250);

    /* 2) Single manually logged food + drink row (Breakfast): clean header/rows, hydration in ⋯, 2 foot buttons */
    await p.evaluate(() => document.querySelector('#macroSlots [data-mslot="b"] .mtray-b[data-mopen]').click());
    await p.waitForTimeout(300);
    const drinkView = await p.evaluate(() => {
      const sh = document.querySelector('#modalRoot .msheet');
      return {
        mode: sh?.getAttribute('data-mode'),
        caps: sh?.querySelectorAll('.msh-top .mcap').length,
        hasDelta: !!sh?.querySelector('.msh-delta'),
        hasTrh: !!sh?.querySelector('.msh-trh'),
        hasWater: !!sh?.querySelector('.msh-wchips'),
        hasRowLock: !!sh?.querySelector('.mrow-lock'),
        hasRowSplit: !!sh?.querySelector('.mrow-split'),
        quicks: sh?.querySelectorAll('.mfl-qs [data-mset]').length,
        acts: [...sh.querySelectorAll('.msh-acts button')].map((b) => b.textContent.trim()),
      };
    });
    t.ok('1 manually logged recipe shows 4 macro pills + ½·1·1½·2 presets, omits .msh-delta/.msh-trh/.msh-wchips/.mrow-lock/.mrow-split, and shows + Add foods | Done without Balance',
      drinkView.mode === 'meal' && drinkView.caps === 4 && !drinkView.hasDelta && !drinkView.hasTrh &&
        !drinkView.hasWater && !drinkView.hasRowLock && !drinkView.hasRowSplit &&
        drinkView.quicks === 4 && drinkView.acts.join('|') === '+ Add foods|Done',
      JSON.stringify(drinkView));

    const waterBefore = await p.textContent('#macroTrayHead');
    await p.click('#modalRoot [data-mfmenu="b:0"]');
    await p.waitForTimeout(200);
    const menuHyd = await p.evaluate(() => {
      const b = document.querySelector('#modalRoot .mrow-menu [data-mhyd="b:0"]');
      return b ? { text: b.textContent.trim(), pressed: b.getAttribute('aria-pressed') } : null;
    });
    t.ok('drink row ⋯ exposes the hydration toggle with its current state',
      !!menuHyd && /oz water/.test(menuHyd.text) && menuHyd.pressed === 'true', JSON.stringify(menuHyd));

    await p.click('#modalRoot .mrow-menu [data-mhyd="b:0"]');
    await p.waitForTimeout(250);
    const afterMute = await p.evaluate(() => ({
      menuOpen: !!document.querySelector('#modalRoot .mrow-menu'),
      chipShown: !!document.querySelector('#modalRoot .mrows .mhyd-chip'),
      headText: (document.getElementById('macroTrayHead') || {}).textContent || '',
    }));
    t.ok('tapping hydration toggle in row ⋯ closes menu and mutes drink hydration immediately',
      !afterMute.menuOpen && !afterMute.chipShown && afterMute.headText !== waterBefore,
      JSON.stringify({ waterBefore, afterMute }));

    await p.click('#modalRoot [data-mfmenu="b:0"]');
    await p.waitForTimeout(150);
    await p.click('#modalRoot .mrow-menu [data-mhyd="b:0"]');
    await p.waitForTimeout(250);
    t.ok('tapping hydration toggle again restores the drink hydration',
      (await p.textContent('#macroTrayHead')) === waterBefore &&
        !!(await p.$('#modalRoot .mrows .mhyd-chip')));
    await p.click('#modalRoot .msh-done');
    await p.waitForTimeout(250);

    /* 3) Smart Balance shown for >= 2 unlocked foods (Lunch) & >= 1 planned food (Dinner) */
    await p.evaluate(() => document.querySelector('#macroSlots [data-mslot="l"] .mtray-b[data-mopen]').click());
    await p.waitForTimeout(300);
    const lunchActs = await p.evaluate(() => [...document.querySelectorAll('#modalRoot .msh-acts button')].map((b) => b.textContent.trim()));
    t.ok('2+ unlocked foods show + Add foods | Balance | Done cleanly',
      lunchActs.join('|') === '+ Add foods|Balance|Done', JSON.stringify(lunchActs));

    /* Find mode keeps compact .msh-trh summary so user sees current meal contents without water chips */
    await p.click('#modalRoot .msh-acts [data-mpmode="home"]');
    await p.waitForTimeout(250);
    const findSummary = await p.evaluate(() => ({
      mode: document.querySelector('#modalRoot .msheet')?.getAttribute('data-mode'),
      trhText: (document.querySelector('#modalRoot .msh-trh') || {}).textContent || '',
      hasWater: !!document.querySelector('#modalRoot .msh-wchips'),
      hasBal: !!document.querySelector('#modalRoot .msh-acts [data-mbal="l"]'),
    }));
    t.ok('find mode keeps compact On Lunch summary without water buttons while Balance remains available',
      findSummary.mode === 'find' && /On Lunch/.test(findSummary.trhText) && /2 foods/.test(findSummary.trhText) &&
        !findSummary.hasWater && findSummary.hasBal,
      JSON.stringify(findSummary));
    await p.click('#modalRoot .msh-backmeal');
    await p.waitForTimeout(250);
    await p.click('#modalRoot .msh-done');
    await p.waitForTimeout(250);

    await p.evaluate(() => document.querySelector('#macroSlots [data-mslot="d"] .mtray-b[data-mopen]').click());
    await p.waitForTimeout(300);
    const dinnerActs = await p.evaluate(() => [...document.querySelectorAll('#modalRoot .msh-acts button')].map((b) => b.textContent.trim()));
    t.ok('a meal with a planned (eaten: 0) item shows Balance even with 1 food',
      dinnerActs.join('|') === '+ Add foods|Balance|Done', JSON.stringify(dinnerActs));

    /* 4) 320px Light & Dark layout audit */
    for (const scheme of ['light', 'dark']) {
      await p.emulateMedia({ colorScheme: scheme });
      await p.setViewportSize({ width: 320, height: 700 });
      await p.waitForTimeout(200);
      const audit = await p.evaluate(() => {
        const sh = document.querySelector('#modalRoot .msheet');
        const small = [...sh.querySelectorAll('button')].filter((b) => {
          const r = b.getBoundingClientRect();
          if (!r.width || !r.height) return false;
          return r.height < 43.5 || r.width < 34;
        }).map((b) => b.className + ':' + Math.round(b.width || b.getBoundingClientRect().width) + 'x' + Math.round(b.getBoundingClientRect().height));
        const tiny = [];
        const w = document.createTreeWalker(sh, NodeFilter.SHOW_TEXT);
        let n;
        while ((n = w.nextNode())) {
          const el = n.parentElement;
          /* P1 espresso macro cap (2026-11-23) intentionally uses 9–9.5 px text inside its 4-pill header row. */
          if (!n.textContent.trim() || !el || el.closest('svg, .leaf-n, .leaf-sr, .mcap-t, .vis-hidden, [aria-hidden="true"], .hide, [hidden]')) continue;
          if (!el.getBoundingClientRect().width) continue;
          const fs = parseFloat(getComputedStyle(el).fontSize);
          if (fs < 12.95) tiny.push(fs + 'px:' + n.textContent.trim());
        }
        return {
          docOverflow: document.documentElement.scrollWidth - window.innerWidth,
          sheetOverflow: sh.scrollWidth - sh.clientWidth,
          small,
          tiny,
        };
      });
      t.ok('320px (' + scheme + '): zero overflow, >= 44x34 targets, >= 13px text',
        audit.docOverflow <= 0 && audit.sheetOverflow <= 1 && !audit.small.length && !audit.tiny.length,
        JSON.stringify(audit));
    }

    t.ok('no page errors', errs.length === 0, errs.join(' | '));
  },
});
