/* What you usually have (Blake, 2026-11-16: "Mock up your idea of the food
 * logging page. I touch that page the most", then "Ok. Let's try it").
 *
 * The meal whose time it is, while it is still empty, shows the foods he has
 * logged at that meal on at least two days of the last four weeks, most often
 * first (logged, ticked or not, since 1k; never a Fill draft nobody ate). One tap puts one on at the portion he last had, and the toast's Undo
 * takes it back off. Nowhere else: not on a meal whose time has not come, not
 * on a meal with food on it, not on a day that is not today, and nothing from
 * a draft nobody ate.
 *
 * Part of the Nourish suite: tests/fixtures/nourish.js gives every page a plan. */
const { nourish, stepDay } = require('./fixtures/nourish.js');

/* Fourteen days of history and a today with breakfast eaten and dinner
   planned. Lunch was the snack pack (4) every day, the canned chicken bowl
   (3) on most and roast beef roll-ups (9) on the rest; the tuna boats (2)
   were Filled onto lunch every day and never eaten; the tuna salad (12) he
   logged himself on the last six days and never ticked. */
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
const lunch = (pg) => pg.evaluate(() => {
  const p2 = (n) => (n < 10 ? '0' : '') + n, d = new Date();
  const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
  return JSON.parse(localStorage.getItem('bsc.macroDays'))[k].l;
});

module.exports = nourish({
  name: 'Macros — what you usually have, one tap on the meal whose time it is',
  async suite(t) {
    const pg = await t.fresh({ viewport: { width: 390, height: 844 } });
    await seed(12)(pg);

    const c = await chips(pg);
    t.ok('at twenty to one, the empty lunch offers what he usually has there, most often first',
      c.length === 3 && c.every((x) => x.meal === 'l') && c.map((x) => x.v.split('|')[1]).join(',') === '4,3,12', JSON.stringify(c));
    t.ok('a Filled food nobody ate is not a habit', !c.some((x) => x.v.split('|')[1] === '2'), JSON.stringify(c));
    t.ok('a food he logged himself counts whether or not he ticked it (1k)', c.some((x) => x.v.split('|')[1] === '12'), JSON.stringify(c));
    t.ok('each at the portion he last had it', c[0] && c[0].v === 'l|4|1.5', JSON.stringify(c[0]));

    const size = await pg.evaluate(() => {
      const r = [...document.querySelectorAll('#macroSlots .mtray-uchip')].map((b) => b.getBoundingClientRect());
      return { h: Math.min(...r.map((x) => x.height)), w: document.documentElement.scrollWidth };
    });
    t.ok('the chips are thumb-sized and the page no wider than the phone', size.h >= 44 && size.w <= 390, JSON.stringify(size));

    await pg.click('#macroSlots [data-musual^="l|3|"]');
    await pg.waitForTimeout(200);
    const added = await lunch(pg);
    const toast = await pg.evaluate(() => { const e = document.getElementById('mToast'); return e && !e.hidden ? e.textContent : ''; });
    t.ok('one tap puts it on lunch, planned like any add, at its portion',
      added.length === 1 && added[0].id === 3 && added[0].x === 1 && !added[0].eaten, JSON.stringify(added));
    t.ok('and says so, with Undo', /Quick Canned Chicken/.test(toast) && /Lunch/.test(toast) && /Undo/.test(toast), toast);
    t.ok('lunch is under way now, so the chips go', (await chips(pg)).length === 0);

    await pg.click('#mToast [data-musualundo]');
    await pg.waitForTimeout(200);
    t.ok('Undo takes that plate back off', (await lunch(pg)).length === 0, JSON.stringify(await lunch(pg)));
    t.ok('and the chips are back', (await chips(pg)).length === 3);

    /* ---- where they do not show ---- */
    const morning = await t.fresh({ viewport: { width: 390, height: 844 } });
    await seed(9)(morning);
    t.ok('at twenty to ten it is breakfast’s time, and breakfast is already eaten: no chips anywhere', (await chips(morning)).length === 0, JSON.stringify(await chips(morning)));

    const night = await t.fresh({ viewport: { width: 390, height: 844 } });
    await seed(18)(night);
    t.ok('at twenty to seven it is dinner’s time, and dinner has its plan on it: no chips on an empty lunch either', (await chips(night)).length === 0, JSON.stringify(await chips(night)));

    await stepDay(pg, 1);
    const tmr = await pg.evaluate(() => document.querySelectorAll('#macroSlots .mtray-empty[data-mslot="l"]').length);
    t.ok('tomorrow\u2019s lunch is empty too, but it is a day being planned, not a meal happening now: no chips',
      tmr === 1 && (await chips(pg)).length === 0, JSON.stringify({ tmr, c: await chips(pg) }));
  }
});
