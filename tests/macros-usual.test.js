/* What you usually have (Blake, 2026-11-16, expanded 2026-11-23 for multi-select).
 *
 * The meal whose time it is offers up to six foods logged at that meal on at
 * least two days of the last four weeks, most often first (logged, ticked or
 * not; never a Fill draft nobody ate). One tap puts a food on eaten at the
 * portion last had, AND keeps the remaining un-added chips open under the meal
 * with a Done button so multi-item meals (coffee, cream, eggs) take rapid taps.
 * Auto-hides when no usual chips remain, on Done, on opening a meal sheet, on
 * switching tabs, or on reload. Nowhere else: not on an already-eaten meal on
 * arrival, not on a meal whose time has not come, not on tomorrow.
 *
 * Part of the Nourish suite: tests/fixtures/nourish.js gives every page a plan. */
const { nourish, stepDay } = require('./fixtures/nourish.js');

/* Fourteen days of history and a today with breakfast eaten and dinner
   planned. Lunch was the snack pack (4) every day (14d), the canned chicken bowl
   (3) on 10d and roast beef roll-ups (9) on 4d; the tuna boats (2) were Filled
   onto lunch every day and never eaten; the tuna salad (12) was logged manually
   on the last 6d and never ticked. Frequency order: 4, 3, 12, 9. */
const seed = (hour) => async (pg) => {
  await pg.clock.setFixedTime(new Date(2026, 10, 16, hour, 40));
  await pg.evaluate(() => {
    const p2 = (n) => (n < 10 ? '0' : '') + n;
    const key = (d) => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
    const days = {};
    for (let i = 14; i >= 1; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      days[key(d)] = {
        b: [{ id: 27, x: 1, eaten: 1 }],
        l: [{ id: i % 3 ? 3 : 9, x: 1, eaten: 1 }, { id: 4, x: i === 1 ? 1.5 : 1, eaten: 1 }, { id: 2, x: 1, eaten: 0, by: 'f' }]
          .concat(i <= 6 ? [{ id: 12, x: 1, eaten: 0 }] : []),
        d: [{ id: 51, x: 1, eaten: 1 }], s: [{ id: 6, x: 1, eaten: 1 }] };
    }
    days[key(new Date())] = { b: [{ id: 27, x: 1, eaten: 1 }], l: [], d: [{ id: 310, x: 1, eaten: 0 }], s: [] };
    localStorage.setItem('bsc.macroDays', JSON.stringify(days));
  });
  await pg.reload();
  await pg.click('.tab[data-view="macros"]');
  await pg.waitForTimeout(300);
};

const chips = (pg) => pg.evaluate(() => [...document.querySelectorAll('#macroSlots .mtray-uchip')].map((b) => ({
  meal: b.closest('.mtray').dataset.mslot, v: b.dataset.musual, name: b.querySelector('.mtray-uchip-n').textContent })));
const doneBtn = (pg) => pg.evaluate(() => {
  const b = document.querySelector('#macroSlots [data-musualdone]');
  if (!b) return null;
  const r = b.getBoundingClientRect();
  return { sk: b.dataset.musualdone, h: Math.round(r.height), text: b.textContent.trim() };
});
const lunch = (pg) => pg.evaluate(() => {
  const p2 = (n) => (n < 10 ? '0' : '') + n, d = new Date();
  const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
  return JSON.parse(localStorage.getItem('bsc.macroDays'))[k].l;
});

module.exports = nourish({
  name: 'Macros — what you usually have, multi-select quick chips on the meal whose time it is',
  async suite(t) {
    const errs = [];
    const pg = await t.fresh({ viewport: { width: 390, height: 844 } });
    pg.on('pageerror', (e) => errs.push(e.message));
    await seed(12)(pg);

    const c = await chips(pg);
    t.ok('at twenty to one, the empty lunch offers all 4 non-draft habits, most often first',
      c.length === 4 && c.every((x) => x.meal === 'l') && c.map((x) => x.v.split('|')[1]).join(',') === '4,3,12,9', JSON.stringify(c));
    t.ok('a Filled food nobody ate is not a habit', !c.some((x) => x.v.split('|')[1] === '2'), JSON.stringify(c));
    t.ok('a food he logged himself counts whether or not he ticked it (1k)', c.some((x) => x.v.split('|')[1] === '12'), JSON.stringify(c));
    t.ok('each at the portion he last had it', c[0] && c[0].v === 'l|4|1.5', JSON.stringify(c[0]));
    t.ok('empty state has no Done dismiss button', (await doneBtn(pg)) === null);

    const size = await pg.evaluate(() => {
      const r = [...document.querySelectorAll('#macroSlots .mtray-uchip')].map((b) => b.getBoundingClientRect());
      return { h: Math.min(...r.map((x) => x.height)), w: document.documentElement.scrollWidth };
    });
    t.ok('the chips are thumb-sized and the page no wider than the phone', size.h >= 44 && size.w <= 390, JSON.stringify(size));

    /* ---- 1) Tap chip 1 -> adds to meal AND keeps remaining chips + Done open ---- */
    await pg.click('#macroSlots [data-musual^="l|3|"]');
    await pg.waitForTimeout(200);
    const added1 = await lunch(pg);
    const toast = await pg.evaluate(() => { const e = document.getElementById('mToast'); return e && !e.hidden ? e.textContent : ''; });
    const after1 = await chips(pg);
    const done1 = await doneBtn(pg);
    t.ok('first tap puts food 3 on lunch, marked eaten immediately at its portion',
      added1.length === 1 && added1[0].id === 3 && added1[0].x === 1 && added1[0].eaten === 1, JSON.stringify(added1));
    t.ok('and says so, with Undo', /Quick Canned Chicken/.test(toast) && /Lunch/.test(toast) && /Undo/.test(toast), toast);
    t.ok('remaining 3 chips stay visible on populated lunch with thumb-sized Done button',
      after1.map((x) => x.v.split('|')[1]).join(',') === '4,12,9' && done1 && done1.sk === 'l' && done1.h >= 44,
      JSON.stringify({ after1, done1 }));

    /* ---- 2) Undo from 1-item lunch restores empty lunch + all 4 chips (no Done) ---- */
    await pg.click('#mToast [data-musualundo]');
    await pg.waitForTimeout(200);
    const cAfterUndoEmpty = await chips(pg);
    t.ok('Undo on 1st chip restores empty lunch, all 4 chips, and no Done button',
      (await lunch(pg)).length === 0 && cAfterUndoEmpty.map((x) => x.v.split('|')[1]).join(',') === '4,3,12,9' && (await doneBtn(pg)) === null,
      JSON.stringify(cAfterUndoEmpty));

    /* ---- 3) Multi-select tap 1 + tap 2 + Undo 2nd keeps strip open ---- */
    await pg.click('#macroSlots [data-musual^="l|3|"]');
    await pg.waitForTimeout(200);
    await pg.click('#macroSlots [data-musual^="l|4|"]');
    await pg.waitForTimeout(200);
    const added2 = await lunch(pg);
    const after2 = await chips(pg);
    t.ok('second rapid tap logs food 4 alongside food 3 at last portion (1.5)',
      added2.length === 2 && added2[0].id === 3 && added2[1].id === 4 && added2[1].x === 1.5 && added2[1].eaten === 1,
      JSON.stringify(added2));
    t.ok('remaining 2 chips (12,9) stay open for a third pick',
      after2.map((x) => x.v.split('|')[1]).join(',') === '12,9', JSON.stringify(after2));

    await pg.click('#mToast [data-musualundo]');
    await pg.waitForTimeout(200);
    const afterUndo2 = await chips(pg);
    t.ok('Undo on 2nd chip removes food 4 (food 3 stays) and restores food 4 into the still-open strip',
      (await lunch(pg)).length === 1 && afterUndo2.map((x) => x.v.split('|')[1]).join(',') === '4,12,9' && (await doneBtn(pg)) !== null,
      JSON.stringify({ l: await lunch(pg), afterUndo2 }));

    /* ---- 4) Adding all remaining chips auto-hides the strip ---- */
    await pg.click('#macroSlots [data-musual^="l|4|"]');
    await pg.waitForTimeout(150);
    await pg.click('#macroSlots [data-musual^="l|12|"]');
    await pg.waitForTimeout(150);
    await pg.click('#macroSlots [data-musual^="l|9|"]');
    await pg.waitForTimeout(150);
    t.ok('tapping all remaining chips adds all 4 foods and auto-hides the strip',
      (await lunch(pg)).length === 4 && (await chips(pg)).length === 0 && (await doneBtn(pg)) === null,
      JSON.stringify({ count: (await lunch(pg)).length, left: await chips(pg) }));

    /* ---- 5) Done button, reload, meal sheet open, and tab switch all dismiss cleanly ---- */
    const pgDone = await t.fresh({ viewport: { width: 390, height: 844 } });
    await seed(12)(pgDone);
    await pgDone.click('#macroSlots [data-musual^="l|3|"]');
    await pgDone.waitForTimeout(200);
    await pgDone.click('#macroSlots [data-musualdone="l"]');
    await pgDone.waitForTimeout(200);
    t.ok('tapping Done hides the strip immediately while keeping added food on lunch',
      (await chips(pgDone)).length === 0 && (await doneBtn(pgDone)) === null && (await lunch(pgDone)).length === 1);
    await pgDone.reload();
    await pgDone.waitForTimeout(300);
    t.ok('reloading with lunch already logged shows zero usual chips', (await chips(pgDone)).length === 0);

    const pgSheet = await t.fresh({ viewport: { width: 390, height: 844 } });
    await seed(12)(pgSheet);
    await pgSheet.click('#macroSlots [data-musual^="l|3|"]');
    await pgSheet.waitForTimeout(200);
    await pgSheet.click('#macroSlots [data-mslot="l"] .mtray-hd[data-mopen="l"]');
    await pgSheet.waitForTimeout(250);
    await pgSheet.click('#modalRoot .msh-done');
    await pgSheet.waitForTimeout(200);
    t.ok('opening and closing the meal sheet dismisses the inline strip', (await chips(pgSheet)).length === 0);

    const pgTab = await t.fresh({ viewport: { width: 390, height: 844 } });
    await seed(12)(pgTab);
    await pgTab.click('#macroSlots [data-musual^="l|3|"]');
    await pgTab.waitForTimeout(200);
    await pgTab.click('.tab[data-view="today"]');
    await pgTab.waitForTimeout(200);
    await pgTab.click('.tab[data-view="macros"]');
    await pgTab.waitForTimeout(200);
    t.ok('switching away to another tab and back dismisses the inline strip', (await chips(pgTab)).length === 0);

    /* ---- 6) 320px light & dark layout check with multi-select strip open on populated lunch ---- */
    const mob = await t.fresh({ viewport: { width: 320, height: 760 } });
    mob.on('pageerror', (e) => errs.push(e.message));
    await seed(12)(mob);
    await mob.click('#macroSlots [data-musual^="l|3|"]');
    await mob.waitForTimeout(200);
    for (const scheme of ['light', 'dark']) {
      await mob.emulateMedia({ colorScheme: scheme });
      await mob.waitForTimeout(150);
      const layout = await mob.evaluate(() => {
        const slot = document.querySelector('#macroSlots [data-mslot="l"]');
        const strip = slot.querySelector('.mtray-usual-more');
        const fs = slot.querySelector('.mtray-fs');
        const done = slot.querySelector('[data-musualdone]');
        const row = slot.querySelector('.mtray-usual-row');
        const chipHs = [...slot.querySelectorAll('.mtray-uchip')].map((b) => Math.round(b.getBoundingClientRect().height));
        const sr = strip.getBoundingClientRect();
        const fsr = fs.getBoundingClientRect();
        const dr = done.getBoundingClientRect();
        const rr = row.getBoundingClientRect();
        return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          hasStrip: !!strip,
          minChipH: chipHs.length ? Math.min.apply(null, chipHs) : 0,
          doneH: Math.round(dr.height),
          doneInside: dr.right <= 320 && dr.left >= 0,
          stripBelowFs: sr.top >= fsr.bottom - 1,
          doneAboveRow: dr.bottom <= rr.top + 1,
        };
      });
      t.ok('320px ' + scheme + ': 0px overflow, >=44px targets, no overlap when multi-select strip is open',
        layout.overflow <= 0 && layout.hasStrip && layout.minChipH >= 44 && layout.doneH >= 44 &&
          layout.doneInside && layout.stripBelowFs && layout.doneAboveRow,
        JSON.stringify(layout));
    }

    /* ---- 7) where they do not show ---- */
    const morning = await t.fresh({ viewport: { width: 390, height: 844 } });
    await seed(9)(morning);
    t.ok('at twenty to ten it is breakfast\u2019s time, and breakfast is already eaten: no chips anywhere', (await chips(morning)).length === 0, JSON.stringify(await chips(morning)));

    const night = await t.fresh({ viewport: { width: 390, height: 844 } });
    await seed(18)(night);
    t.ok('at twenty to seven it is dinner\u2019s time, and dinner has its plan on it: no chips on an empty lunch either', (await chips(night)).length === 0, JSON.stringify(await chips(night)));

    await stepDay(pg, 1);
    const tmr = await pg.evaluate(() => document.querySelectorAll('#macroSlots .mtray-empty[data-mslot="l"]').length);
    t.ok('tomorrow\u2019s lunch is empty too, but it is a day being planned, not a meal happening now: no chips',
      tmr === 1 && (await chips(pg)).length === 0, JSON.stringify({ tmr, c: await chips(pg) }));

    t.ok('zero page errors during multi-select usual chips suite', errs.length === 0, JSON.stringify(errs));
  }
});
