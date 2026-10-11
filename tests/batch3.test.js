/* Batch 3 tests:
 * 1. Plan my week: Saturday big cook pairs with Sunday leftovers (pwLoNights).
 * 2. cookAgain: Saturday cook with Sunday leftovers correctly preserves Sunday leftovers.
 * 3. Today dashboard: dinnerOf always reads from the current calendar week (thisWeek), not viewed week.
 * 4. Multi-device meal slot deep merge in MSYNC_KEYED part 'd'.
 */

module.exports = {
  name: 'Batch 3: Weekend leftovers, Today week sync, and meal slot merge',
  async run(t) {
    const p = await t.fresh({ viewport: { width: 390, height: 844 } });
    await p.clock.setFixedTime(new Date(2026, 8, 27, 9, 0, 0)); // Sunday Sep 27 2026
    await p.reload();
    await p.waitForTimeout(600);

    // 1. pwLoNights Saturday -> Sunday pairing
    const loRes = await p.evaluate(() => {
      const a = { lo: 1 };
      const nights = ['sat', 'sun'];
      return window.__pw ? window.__pw.loNights(a, nights) : null;
    });
    t.ok('pwLoNights pairs Saturday cook with Sunday leftovers',
      loRes && loRes.sun === 'sat', JSON.stringify(loRes));

    // 2. cookAgain Sunday leftovers test
    const cookAgainRes = await p.evaluate(() => {
      const r = window.RECIPES.find((x) => x.book === 1 && x.secNum === 4);
      const rid = r ? r.id : 1;

      // Plan Saturday cook and Sunday leftovers on active week
      window.Store.clearPlan();
      window.Store.addToDay(rid, 'sat', 2, false);
      window.Store.addToDay(rid, 'sun', 1, true);

      // Save template and verify
      const tplId = window.Store.saveTemplate('Weekend Cook');

      // Clear active plan
      window.Store.clearPlan();

      // Cook again from template
      window.Store.cookAgain(tplId);

      const satPlan = window.Store.day('sat');
      const sunPlan = window.Store.day('sun');
      return {
        sat: satPlan,
        sun: sunPlan,
        sunHasLo: sunPlan.some((e) => e.id === rid && e.lo === true)
      };
    });
    t.ok('cookAgain preserves Sunday leftovers when Saturday cook is filled',
      cookAgainRes.sunHasLo === true, JSON.stringify(cookAgainRes));

    // 3. Today dashboard dinnerOf always reads thisWeek()
    const todayRes = await p.evaluate(() => {
      const curWk = window.Store.thisWeek();
      const r1 = window.RECIPES.find((x) => x.book === 1 && x.secNum === 4);
      const r2 = window.RECIPES.find((x) => x.book === 2 && x.secNum === 3);

      // Add r1 to today on current week
      const now = new Date();
      const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      const dk = DAYS[now.getDay()];
      window.Store.addToWeekDay(curWk, dk, r1.id, 1, false);

      // Create another week and switch view to it
      const nextWk = window.Store.addWeek('Next Week', false);
      window.Store.addToWeekDay(nextWk, dk, r2.id, 1, false);
      window.Store.setWeek(nextWk);

      // Check todayData()
      const td = window.Hive ? window.Hive.today() : null;
      return {
        active: window.Store.activeWeek().id,
        curWk: curWk,
        nextWk: nextWk,
        todayDinner: td && td.tonight ? td.tonight.id : null,
        r1Id: String(r1.id),
        r2Id: String(r2.id)
      };
    });
    t.ok('Today dashboard reads dinner from current week, not active next week',
      todayRes.todayDinner === todayRes.r1Id, JSON.stringify(todayRes));

    // 4. Multi-device meal slot deep merge
    // Case A: Remote has newer stamp (stamp 2000 > 1000) with Lunch. Local had Breakfast. Both slots should be preserved.
    await p.evaluate(() => {
      const k = '2026-09-27';
      const curDays = {};
      curDays[k] = { b: [{ id: 'plate_b', x: 1 }] };
      localStorage.setItem('bsc.macroDays', JSON.stringify(curDays));
      localStorage.setItem('bsc.myStamps', JSON.stringify({ d: { [k]: 1000 } }));
    });
    await p.reload();
    await p.waitForTimeout(600);

    const mergedA = await p.evaluate(() => {
      const k = '2026-09-27';
      const enc = k.replace(/-/g, '_');
      const remotePayload = {
        d: {
          [enc]: {
            at: 2000,
            v: { l: [{ id: 'plate_l', x: 1 }] }
          }
        }
      };
      window.__macroLab.merge(remotePayload);
      const days = JSON.parse(localStorage.getItem('bsc.macroDays') || '{}');
      return days[k];
    });
    t.ok('slot merge preserves local breakfast when remote arrives with newer lunch',
      mergedA && mergedA.b && mergedA.b.length === 1 && mergedA.l && mergedA.l.length === 1,
      JSON.stringify(mergedA));

    // Case B: Remote has older stamp (stamp 500 <= 2000) with Dinner, local had no Dinner. Dinner should be merged in.
    const mergedB = await p.evaluate(() => {
      const k = '2026-09-27';
      const enc = k.replace(/-/g, '_');
      const remotePayload = {
        d: {
          [enc]: {
            at: 500,
            v: { d: [{ id: 'plate_d', x: 1 }] }
          }
        }
      };
      window.__macroLab.merge(remotePayload);
      const days = JSON.parse(localStorage.getItem('bsc.macroDays') || '{}');
      return days[k];
    });
    t.ok('slot merge takes dinner from older remote when local had dinner empty',
      mergedB && mergedB.b && mergedB.l && mergedB.d && mergedB.d.length === 1,
      JSON.stringify(mergedB));

    await p.context().close();
  }
};
