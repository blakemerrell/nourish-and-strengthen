/* The Plan page, worked from: + Add on a day, ↻ on a dinner, a rating once
 * it has been eaten, and the week's numbers at the top.
 *
 * Blake: "Can I add a meal from this page to a day?" Everything is read back
 * from window.Store and window.RECIPES, never from what the page says. */

module.exports = {
  name: 'Plan page',
  async run(t) {
    const p = await t.fresh({ viewport: { width: 390, height: 844 } });
    /* A Sunday morning: every day of the week is still ahead, so a plan
       written in this test is never a plan for a day already gone. */
    await p.clock.setFixedTime(new Date(2026, 8, 27, 9, 0, 0));
    await p.reload();
    await p.waitForTimeout(900);
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    const ids = await p.evaluate(() => {
      const d = window.RECIPES.filter((r) => r.book === 2 && r.secNum === 3).slice(0, 3);
      window.Store.addToDay(d[0].id, 'mon', 1);
      window.Store.addToDay(d[1].id, 'tue', 1);
      window.Store.addToDay(d[2].id, 'wed', 1);
      localStorage.setItem('sh.pw', JSON.stringify({ days: ['mon', 'tue', 'wed', 'thu', 'fri'], ppl: 6, t: 0 }));
      return d.map((r) => r.id);
    });
    await p.evaluate(() => window.Hive.go('plan'));
    await p.waitForTimeout(300);
    const sum = await p.evaluate(() => document.getElementById('planSum').textContent);
    t.ok('the week’s numbers sit at the top: three of seven nights planned', /3 of 7\s*nights planned/.test(sum), sum);

    /* + Add on Thursday */
    await p.click('[data-addday="thu"]');
    await p.waitForTimeout(300);
    const s1 = await p.evaluate(() => {
      const b = document.querySelector('.ad-sug [data-adadd]');
      return { eyebrow: document.querySelector('.ad-sheet .sheet-eyebrow').textContent, sug: b ? b.dataset.adadd : '' };
    });
    await p.click('[data-adsw]');
    await p.waitForTimeout(200);
    const s2 = await p.evaluate(() => (document.querySelector('.ad-sug [data-adadd]') || {}).dataset.adadd);
    const sugOk = await p.evaluate(([a, b]) => {
      const R = (id) => window.RECIPES.find((r) => String(r.id) === String(id));
      const din = (r) => ['1-4', '2-3', '2-4'].includes(r.book + '-' + r.secNum) || (r.book === 2 && r.secNum === 7);
      return !!R(a) && !!R(b) && din(R(a)) && din(R(b));
    }, [s1.sug, s2]);
    t.ok('+ Add opens on that day with a dinner suggested, and ↻ Another suggests a different one',
      s1.eyebrow === 'Add to Thursday' && sugOk && s1.sug !== s2, JSON.stringify({ s1, s2 }));

    await p.fill('#adFind', 'burrito');
    await p.waitForTimeout(150);
    const found = await p.evaluate(() => [...document.querySelectorAll('#adList .ad-n')].map((e) => e.textContent));
    t.ok('the search finds every recipe by name, whatever section it is in',
      found.length > 0 && found.every((n) => /burrito/i.test(n)), JSON.stringify(found));
    await p.fill('#adFind', '');
    await p.click('[data-adf="breakfast"]');
    await p.waitForTimeout(150);
    const bf = await p.evaluate(() => [...document.querySelectorAll('#adList [data-adadd]')].map((b) => {
      const r = window.RECIPES.find((x) => String(x.id) === b.dataset.adadd); return r.book + '-' + r.secNum; }));
    t.ok('Breakfast lists the breakfast sections only', bf.length > 0 && bf.every((k) => k === '1-1' || k === '2-1'), bf.slice(0, 5).join());

    await p.click('[data-adf="dinner"]');
    await p.waitForTimeout(150);
    await p.click('.ad-sug [data-adadd]');
    await p.waitForTimeout(300);
    const thu = await p.evaluate(() => ({ day: window.Store.day('thu'), open: !!document.querySelector('.ad-sheet') }));
    const want = await p.evaluate((id) => {
      const r = window.RECIPES.find((x) => String(x.id) === String(id));
      return Math.max(1, Math.round((6 / (Number(r.servN) || 4)) * 2) / 2);
    }, s2);
    t.ok('+ puts it on Thursday at the household’s size, and the sheet closes onto the week',
      thu.day.length === 1 && String(thu.day[0].id) === String(s2) && thu.day[0].x === want && !thu.open,
      JSON.stringify({ thu, want }));

    /* Leftovers on Friday: an earlier dinner again, not bought again. The
       list's amounts are read before and after, on the List tab. */
    const qty = async () => {
      await p.evaluate(() => window.Hive.go('list'));
      await p.waitForTimeout(200);
      const q = await p.evaluate(() => [...document.querySelectorAll('#listBody .qty')].map((e) => e.textContent).join('|'));
      await p.evaluate(() => window.Hive.go('plan'));
      await p.waitForTimeout(200);
      return q;
    };
    const qBefore = await qty();
    const before = await p.evaluate(() => document.getElementById('planSum').textContent);
    await p.click('[data-addday="fri"]');
    await p.waitForTimeout(250);
    await p.click('[data-adf="left"]');
    await p.waitForTimeout(150);
    const left = await p.evaluate(() => [...document.querySelectorAll('#adList [data-adadd]')].map((b) => b.dataset.adadd + (b.dataset.lo ? 'L' : '')));
    await p.click('#adList [data-adadd="' + ids[0] + '"]');
    await p.waitForTimeout(300);
    const fri = await p.evaluate(() => ({ day: window.Store.day('fri'), sum: document.getElementById('planSum').textContent,
      tag: !!document.querySelector('.day-item.lo .day-tag') }));
    const listN = (s) => (s.match(/(\d+)\s*items/) || [])[1];
    const qAfter = await qty();
    t.ok('Leftovers offers the week’s earlier dinners, and one added is marked and adds nothing to the list',
      left.length >= 3 && left.every((x) => /L$/.test(x)) && fri.day[0] && fri.day[0].lo === true && fri.tag &&
        listN(fri.sum) === listN(before) && /5 of 7/.test(fri.sum) && qAfter === qBefore && qBefore.length > 0,
      JSON.stringify({ left, fri, before, same: qAfter === qBefore }));

    /* ↻ on Wednesday */
    const wedWas = await p.evaluate(() => window.Store.day('wed').map((e) => e.id));
    await p.click('[data-pswap="' + ids[2] + '"]');
    await p.waitForTimeout(300);
    const wk = await p.evaluate(() => ['mon', 'tue', 'wed'].map((d) => window.Store.day(d).map((e) => e.id)));
    t.ok('↻ swaps that dinner for another on the same night and leaves the rest',
      wk[2].length === 1 && wk[2][0] !== wedWas[0] && wk[0][0] === ids[0] && wk[1][0] === ids[1], JSON.stringify({ wedWas, wk }));

    /* Ratings: today's dinner (the clock is a Sunday) can be rated; a day
       still ahead cannot. */
    const rateId = await p.evaluate(() => {
      const r = window.RECIPES.filter((x) => x.book === 2 && x.secNum === 3)[5];
      window.Store.addToDay(r.id, 'sun', 1);
      return r.id;
    });
    await p.waitForTimeout(250);
    const open = (sel) => p.evaluate(async (sel) => {
      document.querySelector(sel).click();
      await new Promise((r) => setTimeout(r, 200));
    }, sel);
    const shut = () => p.evaluate(async () => { document.querySelector('.dsh-sheet .sheet-x').click(); await new Promise((r) => setTimeout(r, 200)); });
    await open('#planGrid [data-dayopen="' + ids[0] + '"]');
    const ahead = await p.evaluate((id) => !!document.querySelector('.dsh-sheet [data-prate="' + id + '"]'), ids[0]);
    await shut();
    await open('#planGrid [data-dayopen="' + rateId + '"][data-day="sun"]');
    const rated = await p.evaluate(async (id) => {
      const b = document.querySelector('.dsh-sheet [data-prate="' + id + '"][data-v="-1"]');
      if (!b) return 'no buttons';
      b.click();
      await new Promise((r) => setTimeout(r, 250));
      const W = window.__pw;
      const a = { days: ['mon'], ppl: 4, bud: 150, t: 0, prot: [], kind: [], fit: false, avoid: [], ing: [], rec: 0, shelf: true };
      const out = { r: window.Store.rating(id), inPool: W.pool(a, false).some((r) => r.id === id),
        row: (document.querySelector('#planGrid [data-dayopen="' + id + '"] small') || {}).textContent || '' };
      document.querySelector('.dsh-sheet [data-prate="' + id + '"][data-v="-1"]').click();
      await new Promise((r) => setTimeout(r, 250));
      out.cleared = window.Store.rating(id);
      return out;
    }, rateId);
    await shut();
    t.ok('👎 on today\u2019s dinner keeps it out of the picks, tapping it again takes it back, and a day ahead has nothing to rate',
      rated.r === -1 && rated.inPool === false && rated.cleared === 0 && !ahead, JSON.stringify({ rated, ahead }));
    t.ok('with no error on the page', errs.length === 0, errs.join(' | '));
    await p.context().close();
  },
};
