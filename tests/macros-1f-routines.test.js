/* Step 1f: My Foods & Routines Manager (#mFoodsSheet).
 *
 * Verifies:
 *  1) Eat's menu entry [data-mmore="foods"] reads "My foods & routines" and opens
 *     #mFoodsSheet showing Pins, Saved meals, Custom foods, and Staples.
 *  2) Filter tabs (All / Pins / Saved meals / Custom foods / Staples) toggle cleanly.
 *  3) Everyday Pins: Unpin removes the routine pin from bsc.macroSlots while leaving
 *     today's already-logged plate intact, and Undo restores the pin.
 *  4) Saved Meals: shows components + macros, tapping opens "What went in" with
 *     Android Back returning to #mFoodsSheet, Delete + Undo work, and + Log adds
 *     an unchecked (eaten === 0) serving to mNextMeal() with Undo.
 *  5) Custom Foods: + New food saves without adding to today and returns to #mFoodsSheet,
 *     Edit renames & updates label macros and returns to #mFoodsSheet, Delete + Undo work.
 *  6) Narrow 320x640 Light & Dark audit: zero overflow, >= 44px tap targets,
 *     >= 13px visible text, zero broken words inside buttons. */
const { nourish, todayOn } = require('./fixtures/nourish.js');

const SEED_DATA = ({ dk, yk }) => {
  localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 185, f: 65, c: 205 }));
  localStorage.setItem('bsc.macroSlots', JSON.stringify({
    list: [
      { k: 'b', n: 'Breakfast', t: 'b', pins: [{ id: 'f:egg_white', x: 3 }] },
      { k: 'l', n: 'Lunch', t: 'l' },
      { k: 'd', n: 'Dinner', t: 'd' },
      { k: 's', n: 'Snacks', t: 's' },
    ],
    names: { b: 'Breakfast', l: 'Lunch', d: 'Dinner', s: 'Snacks' },
  }));
  localStorage.setItem('bsc.mine', JSON.stringify({
    u_house_chili: {
      id: 'u_house_chili',
      own: true,
      book: 3,
      secNum: 1,
      secName: 'Ours',
      name: 'House Chili',
      servings: '1 Serving',
      servN: 1,
      time: '0 mins',
      diff: 'Easy',
      ing: ['1 x cup Beans', '1 x serving Beef'],
      steps: [],
      extras: '',
      macro: { kcal: 410, p: 32, f: 14, c: 38, na: 320, fib: 8 },
      typedMacro: true,
    },
  }));
  localStorage.setItem('bsc.myFoods', JSON.stringify({
    morning_bowl: {
      name: 'Morning Bowl',
      unit: 'plate',
      kcal: 360,
      p: 30,
      f: 8,
      c: 42,
      na: 220,
      fib: 5,
      parts: [
        { id: 'f:egg_white', x: 3, name: 'Egg white', unit: 'whole' },
        { id: 'f:oats', x: 1, name: 'Oats, rolled', unit: 'cup' },
      ],
    },
    protein_shake: {
      name: 'Vanilla Shake',
      unit: 'scoop',
      kcal: 120,
      p: 24,
      f: 1,
      c: 3,
      na: 110,
    },
  }));
  const days = {
    [dk]: { b: [{ id: 'f:egg_white', x: 3, eaten: 1 }], l: [], d: [], s: [] },
  };
  if (yk) days[yk] = { b: [{ id: 'f:my:morning_bowl', x: 1, eaten: 1 }], l: [], d: [], s: [] };
  localStorage.setItem('bsc.macroDays', JSON.stringify(days));
};

module.exports = nourish({
  name: 'Macros — Step 1f: My foods & routines manager',
  async suite(t) {
    const errs = [];
    const p = await t.fresh({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    p.on('pageerror', (e) => errs.push(e.message));
    await p.clock.setFixedTime(new Date(2026, 10, 20, 12, 30, 0));
    await p.reload();
    await p.waitForTimeout(400);

    const dk = await todayOn(p);
    const yk = '2026-11-19';
    await p.evaluate(SEED_DATA, { dk, yk });
    await p.reload();
    await p.waitForTimeout(450);
    await p.click('.tab[data-view="macros"]');
    await p.waitForTimeout(300);

    await p.evaluate(() => {
      if (!window.Store.isFav('u_house_chili')) window.Store.toggleFav('u_house_chili');
      window.Store.addToDay('u_house_chili', 'mon', 2, false);
    });

    /* 1) Menu entry & unified sheet */
    await p.click('#macroMore');
    await p.waitForTimeout(150);
    const menuLabel = await p.textContent('#macroMenu [data-mmore="foods"]');
    t.ok('Eat menu entry [data-mmore="foods"] reads "My foods & routines"',
      menuLabel.trim() === 'My foods & routines', menuLabel);

    await p.click('#macroMenu [data-mmore="foods"]');
    await p.waitForTimeout(300);

    const opened = await p.evaluate(() => {
      const sh = document.getElementById('mFoodsSheet');
      if (!sh) return null;
      return {
        tabs: [...sh.querySelectorAll('.mf-tab')].map((b) => b.dataset.mfsec),
        pins: [...sh.querySelectorAll('#mfPins .mf-row')].map((r) => r.textContent.replace(/\s+/g, ' ').trim()),
        meals: [...sh.querySelectorAll('#mfMeals .mf-row')].map((r) => r.textContent.replace(/\s+/g, ' ').trim()),
        custom: [...sh.querySelectorAll('#mfCustom .mf-row')].map((r) => r.textContent.replace(/\s+/g, ' ').trim()),
        staples: sh.querySelectorAll('#mfStaples .fp-shelf').length,
      };
    });
    t.ok('#mFoodsSheet opens on All showing filter tabs plus Pins, Saved meals, Custom foods, and Staples',
      !!opened && opened.tabs.join() === 'all,pins,meals,custom,staples' &&
        opened.pins.some((x) => /Egg white/.test(x) && /Breakfast/.test(x)) &&
        opened.meals.some((x) => /Morning Bowl/.test(x)) &&
        opened.custom.some((x) => /Vanilla Shake/.test(x)) &&
        opened.staples >= 3,
      JSON.stringify(opened));

    /* 2) Filter tabs */
    for (const [sec, presentId, hiddenIds] of [
      ['pins', 'mfPins', ['mfMeals', 'mfCustom', 'mfStaples']],
      ['meals', 'mfMeals', ['mfPins', 'mfCustom', 'mfStaples']],
      ['custom', 'mfCustom', ['mfPins', 'mfMeals', 'mfStaples']],
      ['staples', 'mfStaples', ['mfPins', 'mfMeals', 'mfCustom']],
      ['all', 'mfPins', []],
    ]) {
      await p.click('#mFoodsSheet [data-mfsec="' + sec + '"]');
      await p.waitForTimeout(120);
      const vis = await p.evaluate(({ sec, presentId, hiddenIds }) => ({
        pressed: document.querySelector('#mFoodsSheet [data-mfsec="' + sec + '"]').getAttribute('aria-pressed'),
        hasPresent: !!document.getElementById(presentId),
        anyHidden: hiddenIds.some((id) => !!document.getElementById(id)),
      }), { sec, presentId, hiddenIds });
      t.ok('filter tab "' + sec + '" toggles section visibility and aria-pressed cleanly',
        vis.pressed === 'true' && vis.hasPresent && !vis.anyHidden, JSON.stringify(vis));
    }

    /* 3) Everyday Pins: Unpin without deleting today's plate + Undo */
    await p.click('#mFoodsSheet [data-mfunpin^="b|f:egg_white"]');
    await p.waitForTimeout(200);
    const afterUnpin = await p.evaluate((dk) => {
      const slots = JSON.parse(localStorage.getItem('bsc.macroSlots') || '{}');
      const bSlot = (slots.list || []).find((s) => s.k === 'b') || {};
      const day = JSON.parse(localStorage.getItem('bsc.macroDays') || '{}')[dk] || {};
      const toast = document.getElementById('mToast');
      return {
        pinCount: (bSlot.pins || []).length,
        todayCount: (day.b || []).length,
        toastOpen: !!toast && !toast.hidden,
        hasUndo: !!(toast && toast.querySelector('[data-mfundo]')),
      };
    }, dk);
    t.ok('Unpin removes routine pin from Breakfast while keeping today\'s logged item and showing Undo toast',
      afterUnpin.pinCount === 0 && afterUnpin.todayCount === 1 && afterUnpin.toastOpen && afterUnpin.hasUndo,
      JSON.stringify(afterUnpin));

    await p.click('#mToast [data-mfundo]');
    await p.waitForTimeout(200);
    const afterPinUndo = await p.evaluate(() => {
      const slots = JSON.parse(localStorage.getItem('bsc.macroSlots') || '{}');
      const bSlot = (slots.list || []).find((s) => s.k === 'b') || {};
      return {
        pinCount: (bSlot.pins || []).length,
        uiCount: document.querySelectorAll('#mfPins [data-mfpin]').length,
      };
    });
    t.ok('tapping Undo restores the unpinned routine in storage and #mFoodsSheet',
      afterPinUndo.pinCount === 1 && afterPinUndo.uiCount === 1, JSON.stringify(afterPinUndo));

    /* 4) Saved Meals: inspect parts + Android Back, Delete + Undo, + Log unchecked */
    await p.click('#mFoodsSheet [data-mffood="f:my:morning_bowl"]');
    await p.waitForTimeout(250);
    const mealDetail = await p.evaluate(() => ({
      name: (document.querySelector('.mfs-name') || {}).textContent || '',
      hasParts: /What went in/.test((document.querySelector('.mfs-sheet') || {}).textContent || ''),
      partCount: document.querySelectorAll('.mfs-sheet .mfs-p').length,
    }));
    t.ok('tapping a Saved meal opens its food sheet showing component parts',
      mealDetail.name === 'Morning Bowl' && mealDetail.hasParts && mealDetail.partCount === 2,
      JSON.stringify(mealDetail));

    await p.goBack();
    await p.waitForTimeout(250);
    t.ok('Android Back from Saved meal detail returns to #mFoodsSheet rather than closing to the day',
      !!(await p.$('#mFoodsSheet')));

    await p.click('#mFoodsSheet [data-mfdel="f:my:morning_bowl"]');
    await p.waitForTimeout(200);
    const afterMealDel = await p.evaluate(() => {
      const mine = JSON.parse(localStorage.getItem('bsc.myFoods') || '{}');
      return {
        recordExists: !!mine.morning_bowl,
        archivedFlag: !!(mine.morning_bowl && mine.morning_bowl.archived),
        uiHas: !!document.querySelector('#mfMeals [data-mfmeal="f:my:morning_bowl"]'),
        hasUndo: !!document.querySelector('#mToast [data-mfundo]'),
      };
    });
    t.ok('Delete soft-archives Saved meal (keeps record for past days), hides it from manager, and shows Undo toast',
      afterMealDel.recordExists && afterMealDel.archivedFlag && !afterMealDel.uiHas && afterMealDel.hasUndo,
      JSON.stringify(afterMealDel));

    await p.evaluate((yk) => {
      document.getElementById('macroDayPick').value = yk;
      document.getElementById('macroDayPick').dispatchEvent(new Event('change', { bubbles: true }));
    }, yk);
    await p.waitForTimeout(200);
    const pastAfterArchive = await p.evaluate(() => {
      const b = document.querySelector('#macroTrayHead .mpillwk-k b');
      return {
        yesterdayKcal: b ? Number(b.textContent.replace(/[^\d]/g, '')) : 0,
      };
    });
    t.ok('archived Saved meal keeps yesterday\'s logged calories intact (360 kcal)',
      pastAfterArchive.yesterdayKcal === 360, JSON.stringify(pastAfterArchive));
    await p.evaluate((dk) => {
      document.getElementById('macroDayPick').value = dk;
      document.getElementById('macroDayPick').dispatchEvent(new Event('change', { bubbles: true }));
    }, dk);
    await p.waitForTimeout(200);

    await p.click('#mToast [data-mfundo]');
    await p.waitForTimeout(200);
    t.ok('Undo clears archived flag and restores Saved meal into #mFoodsSheet',
      await p.evaluate(() => {
        const mb = (JSON.parse(localStorage.getItem('bsc.myFoods') || '{}')).morning_bowl;
        return !!mb && !mb.archived && !!document.querySelector('#mfMeals [data-mfmeal="f:my:morning_bowl"]');
      }));

    /* 4b) Shared household saved meal delete asks confirmation and Undo restores recipe, fav star, and week plan */
    await p.click('#mFoodsSheet [data-mfdel="u_house_chili"]');
    await p.waitForTimeout(200);
    const confirmOwn = await p.evaluate(() => ({
      dlgOpen: !!document.querySelector('#dialogRoot .dlg'),
      dlgTitle: (document.querySelector('#dialogRoot .dlg-t') || {}).textContent || '',
      stillListed: !!document.querySelector('#mfMeals [data-mfmeal="u_house_chili"]'),
    }));
    t.ok('deleting a shared household saved meal asks confirmation before removing',
      confirmOwn.dlgOpen && /everyone/i.test(confirmOwn.dlgTitle) && confirmOwn.stillListed,
      JSON.stringify(confirmOwn));
    await p.click('#dialogRoot [data-dlg="ok"]');
    await p.waitForTimeout(250);
    const afterOwnDel = await p.evaluate(() => ({
      sheetOpen: !!document.getElementById('mFoodsSheet'),
      stillListed: !!document.querySelector('#mfMeals [data-mfmeal="u_house_chili"]'),
      isFav: window.Store.isFav('u_house_chili'),
      monCount: window.Store.day('mon').length,
      hasUndo: !!document.querySelector('#mToast [data-mfundo]'),
    }));
    t.ok('confirming shared household delete removes recipe, fav star, and planned week entry while keeping #mFoodsSheet open and offering Undo',
      afterOwnDel.sheetOpen && !afterOwnDel.stillListed && !afterOwnDel.isFav &&
        afterOwnDel.monCount === 0 && afterOwnDel.hasUndo,
      JSON.stringify(afterOwnDel));
    await p.click('#mToast [data-mfundo]');
    await p.waitForTimeout(250);
    const afterOwnUndo = await p.evaluate(() => ({
      restoredInSheet: !!document.querySelector('#mfMeals [data-mfmeal="u_house_chili"]'),
      isFav: window.Store.isFav('u_house_chili'),
      monEntries: window.Store.day('mon'),
    }));
    t.ok('Undo restores deleted shared household saved meal, its favorite star, and its Monday week-plan entry',
      afterOwnUndo.restoredInSheet && afterOwnUndo.isFav &&
        afterOwnUndo.monEntries.some((e) => e.id === 'u_house_chili' && e.x === 2 && !e.lo),
      JSON.stringify(afterOwnUndo));

    await p.click('#mFoodsSheet [data-mfadd="f:my:morning_bowl"]');
    await p.waitForTimeout(250);
    const afterMealLog = await p.evaluate((dk) => {
      const day = JSON.parse(localStorage.getItem('bsc.macroDays') || '{}')[dk] || {};
      const lItems = day.l || [];
      return {
        sheetClosed: !document.getElementById('mFoodsSheet'),
        lItems,
        hasUndo: !!document.querySelector('#mToast [data-mfundo]'),
      };
    }, dk);
    t.ok('+ Log closes #mFoodsSheet to Eat, adds eaten item to next meal on today (Lunch), and offers Undo',
      afterMealLog.sheetClosed && afterMealLog.lItems.length === 1 &&
        afterMealLog.lItems[0].id === 'f:my:morning_bowl' && afterMealLog.lItems[0].eaten === 1 &&
        afterMealLog.hasUndo,
      JSON.stringify(afterMealLog));

    await p.click('#mToast [data-mfundo]');
    await p.waitForTimeout(200);
    t.ok('Undo on + Log removes the newly logged Saved meal from Lunch',
      await p.evaluate((dk) => ((JSON.parse(localStorage.getItem('bsc.macroDays') || '{}')[dk] || {}).l || []).length === 0, dk));

    /* 5) Custom Foods: + New food, Edit rename + macro update, Delete + Undo */
    await p.click('#macroMore');
    await p.waitForTimeout(150);
    await p.click('#macroMenu [data-mmore="foods"]');
    await p.waitForTimeout(250);
    await p.click('#mFoodsSheet [data-mfnew="1"]');
    await p.waitForTimeout(250);

    const newFormBtn = await p.textContent('#modalRoot [data-nf="save"]');
    t.ok('+ New food from #mFoodsSheet opens custom food form with "Save custom food" CTA',
      newFormBtn.trim() === 'Save custom food', newFormBtn);

    await p.fill('#nfName', 'Protein Waffle');
    await p.fill('#nfUnit', '1 waffle');
    await p.fill('#nfKcal', '210');
    await p.fill('#nfP', '22');
    await p.fill('#nfF', '6');
    await p.fill('#nfC', '17');
    await p.click('#modalRoot [data-nf="save"]');
    await p.waitForTimeout(300);

    const afterCreate = await p.evaluate((dk) => {
      const mine = JSON.parse(localStorage.getItem('bsc.myFoods') || '{}');
      const day = JSON.parse(localStorage.getItem('bsc.macroDays') || '{}')[dk] || {};
      const key = Object.keys(mine).find((k) => mine[k].name === 'Protein Waffle');
      const totalItems = Object.values(day).filter(Array.isArray).reduce((s, a) => s + a.length, 0);
      return {
        sheetBack: !!document.getElementById('mFoodsSheet'),
        key,
        inList: !!document.querySelector('#mfCustom [data-mfcustom="f:my:' + key + '"]'),
        totalItems,
      };
    }, dk);
    t.ok('saving + New food stores custom food, adds nothing to today, and returns to #mFoodsSheet',
      afterCreate.sheetBack && !!afterCreate.key && afterCreate.inList && afterCreate.totalItems === 1,
      JSON.stringify(afterCreate));

    await p.click('#mFoodsSheet [data-mfedit="f:my:' + afterCreate.key + '"]');
    await p.waitForTimeout(250);
    await p.fill('#mffName', 'Kodiak Protein Waffle');
    await p.fill('#mffP', '25');
    await p.click('#modalRoot [data-mffsave="1"]');
    await p.waitForTimeout(300);

    const afterEdit = await p.evaluate((key) => {
      const mine = JSON.parse(localStorage.getItem('bsc.myFoods') || '{}');
      const rec = mine[key] || {};
      const rowText = (document.querySelector('#mfCustom [data-mfcustom="f:my:' + key + '"]') || {}).textContent || '';
      return {
        sheetBack: !!document.getElementById('mFoodsSheet'),
        name: rec.name,
        p: rec.p,
        rowText: rowText.replace(/\s+/g, ' ').trim(),
      };
    }, afterCreate.key);
    t.ok('Edit updates custom food name & macros and returns to #mFoodsSheet',
      afterEdit.sheetBack && afterEdit.name === 'Kodiak Protein Waffle' && afterEdit.p === 25 &&
        /Kodiak Protein Waffle/.test(afterEdit.rowText) && /25P/.test(afterEdit.rowText),
      JSON.stringify(afterEdit));

    await p.click('#mFoodsSheet [data-mfdel="f:my:' + afterCreate.key + '"]');
    await p.waitForTimeout(200);
    const afterCustDel = await p.evaluate((key) => {
      const rec = JSON.parse(localStorage.getItem('bsc.myFoods') || '{}')[key];
      return {
        archivedFlag: !!(rec && rec.archived),
        uiGone: !document.querySelector('#mfCustom [data-mfcustom="f:my:' + key + '"]'),
        hasUndo: !!document.querySelector('#mToast [data-mfundo]'),
      };
    }, afterCreate.key);
    t.ok('Delete soft-archives custom food, hides it from #mFoodsSheet, and offers Undo',
      afterCustDel.archivedFlag && afterCustDel.uiGone && afterCustDel.hasUndo, JSON.stringify(afterCustDel));

    await p.click('#mToast [data-mfundo]');
    await p.waitForTimeout(200);
    t.ok('Undo clears archived flag and restores custom food',
      await p.evaluate((key) => {
        const rec = JSON.parse(localStorage.getItem('bsc.myFoods') || '{}')[key];
        return !!rec && !rec.archived && !!document.querySelector('#mfCustom [data-mfcustom="f:my:' + key + '"]');
      }, afterCreate.key));

    await p.context().close();

    /* 6) 320x640 Light & Dark layout + a11y audit */
    for (const scheme of ['light', 'dark']) {
      const np = await t.fresh({ viewport: { width: 320, height: 640 }, hasTouch: true, isMobile: true, colorScheme: scheme });
      np.on('pageerror', (e) => errs.push(e.message));
      const ndk = await todayOn(np);
      await np.evaluate(SEED_DATA, { dk: ndk });
      await np.reload();
      await np.waitForTimeout(400);
      await np.click('.tab[data-view="macros"]');
      await np.waitForTimeout(250);
      await np.click('#macroMore');
      await np.waitForTimeout(150);
      await np.click('#macroMenu [data-mmore="foods"]');
      await np.waitForTimeout(300);

      const audit = await np.evaluate(() => {
        const sh = document.getElementById('mFoodsSheet');
        const btns = [...sh.querySelectorAll('button')].filter((b) => {
          const r = b.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && !b.closest('.hide, [hidden]');
        });
        const minW = Math.min(...btns.map((b) => b.getBoundingClientRect().width));
        const minH = Math.min(...btns.map((b) => b.getBoundingClientRect().height));
        const minFont = Math.min(...btns.map((b) => parseFloat(getComputedStyle(b).fontSize)));
        const broken = [];
        btns.forEach((b) => {
          const w = document.createTreeWalker(b, NodeFilter.SHOW_TEXT);
          let n;
          while ((n = w.nextNode())) {
            const re = /\S+/g; let m;
            while ((m = re.exec(n.textContent))) {
              const rg = document.createRange();
              rg.setStart(n, m.index);
              rg.setEnd(n, m.index + m[0].length);
              const lines = new Set([...rg.getClientRects()].map((q) => Math.round(q.top)));
              if (lines.size > 1) broken.push(m[0]);
            }
          }
        });
        return {
          pageOverflow: document.documentElement.scrollWidth > window.innerWidth,
          sheetOverflow: sh.scrollWidth > sh.clientWidth + 1,
          minW: Math.round(minW * 10) / 10,
          minH: Math.round(minH * 10) / 10,
          minFont,
          broken,
        };
      });
      t.ok('320x640 ' + scheme + ': #mFoodsSheet has no overflow, >= 44px controls, >= 13px text, zero broken words',
        !audit.pageOverflow && !audit.sheetOverflow && audit.minW >= 43.9 && audit.minH >= 43.9 &&
          audit.minFont >= 12.95 && audit.broken.length === 0,
        JSON.stringify(audit));
      await np.context().close();
    }

    t.ok('no uncaught page errors', errs.length === 0, errs.join(' | '));
  },
});
