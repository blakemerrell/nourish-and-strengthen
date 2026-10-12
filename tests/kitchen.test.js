/* My kitchen: what the household has, wherever it came from.
 *
 * Blake: "I should just be able to tell it what I have in my pantry, whether
 * I pick it up from the storehouse or not." The kitchen answers before the
 * storehouse; the storehouse is one switch; each list line says Have,
 * Storehouse or Buy. And Plan my week's leftovers nights. */

module.exports = {
  name: 'My kitchen',
  async run(t) {
    const p = await t.fresh({ viewport: { width: 390, height: 844 } });
    /* A Sunday morning: every day of the week is still ahead, so a plan
       written in this test is never a plan for a day already gone. */
    await p.clock.setFixedTime(new Date(2026, 8, 27, 9, 0, 0));
    await p.reload();
    await p.waitForTimeout(900);
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));

    /* A dinner that needs something bought. */
    const pick = await p.evaluate(() => {
      const P = window.PANTRY;
      const r = window.RECIPES.find((x) => x.book === 2 && x.secNum === 3 &&
        x.ingp.some((i) => P[i.k] && !P[i.k].s && !P[i.k].sp && !i.o));
      const k = r.ingp.find((i) => P[i.k] && !P[i.k].s && !P[i.k].sp && !i.o).k;
      const s = r.ingp.find((i) => P[i.k] && P[i.k].s && !P[i.k].sp && !i.o).k;
      window.Store.addToDay(r.id, 'mon', 1);
      return { id: r.id, k, s, kl: P[k].l, sl: P[s].l };
    });
    const groupOf = (k) => p.evaluate((k) => {
      const i = document.querySelector('#listBody [data-check="' + k + '"]');
      return i ? i.closest('.list-group').querySelector('.list-group-title').textContent.trim() : '';
    }, k);
    await p.click('.tab[data-view="plan"]').then(() => p.evaluate(() => window.Hive.go('list')));
    await p.waitForTimeout(300);
    const g0 = { buy: await groupOf(pick.k), store: await groupOf(pick.s) };

    /* Into the kitchen from the Pantry tab's search. */
    await p.click('.tab[data-view="plan"]').then(() => p.evaluate(() => window.Hive.go('pantry'))).then(() => p.evaluate(() => { const d = document.getElementById('storePart'); if (d) d.open = true; }));
    await p.waitForTimeout(250);
    await p.fill('#kitFind', pick.kl.slice(0, 5));
    await p.waitForTimeout(150);
    await p.click('[data-kitpill="' + pick.k + '"]');
    await p.waitForTimeout(250);
    const chip = await p.evaluate((k) => (document.querySelector('[data-kitpill="' + k + '"]') || {}).getAttribute('aria-pressed') === 'true', pick.k);
    await p.click('.tab[data-view="plan"]').then(() => p.evaluate(() => window.Hive.go('list')));
    await p.waitForTimeout(250);
    const g1 = await groupOf(pick.k);
    const need = await p.evaluate(([id, l]) => {
      const r = window.RECIPES.find((x) => x.id === id);
      return document.body.contains(document.getElementById('listBody')) && l;
    }, [pick.id, pick.kl]);
    t.ok('a food bought until now, added to the kitchen, moves off To buy into In your kitchen',
      g0.buy === 'To buy' && chip && g1 === 'In your kitchen' && !!need, JSON.stringify({ g0, chip, g1 }));

    /* The kitchen is the household's, and outlives the page. */
    await p.reload();
    await p.waitForTimeout(1200);
    const kept = await p.evaluate((k) => window.Store.kitchen(k), pick.k);
    t.ok('and it is still there after a reload', kept === 1, String(kept));

    /* A storehouse line moved to Buy. The switch opens from the line's tag;
       done from the page rather than by a visible click, since a line
       already in the kitchen sits folded away. */
    const srcTap = (k, v) => p.evaluate(async ([k, v]) => {
      document.querySelector('#listBody [data-srctag="' + k + '"]').click();
      await new Promise((r) => setTimeout(r, 150));
      document.querySelector('#listBody [data-src="' + k + '"][data-v="' + v + '"]').click();
    }, [k, v]);
    await p.click('.tab[data-view="plan"]').then(() => p.evaluate(() => window.Hive.go('list')));
    await p.waitForTimeout(250);
    await srcTap(pick.s, 'b');
    await p.waitForTimeout(250);
    const g2 = await groupOf(pick.s);
    const inCart = await p.evaluate((k) => {
      const a = document.querySelector('#view-list .wm-btn');
      return !!a && a.getAttribute('href').indexOf(window.PANTRY[k].wm ? window.PANTRY[k].wm[0] : 'none') >= 0;
    }, pick.s);
    t.ok('a storehouse line set to Buy moves to To buy', g0.store === 'Storehouse order' && g2 === 'To buy',
      JSON.stringify({ was: g0.store, now: g2, inCart }));

    /* One tap is one change: the two writes behind Have are saved and drawn
       once, not once each. */
    const saves = await p.evaluate(async (k) => {
      document.querySelector('#listBody [data-srctag="' + k + '"]').click();
      await new Promise((r) => setTimeout(r, 150));
      let n = 0;
      const was = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, v) { if (key === 'bsc.kitchen') n++; return was.call(this, key, v); };
      document.querySelector('#listBody [data-src="' + k + '"][data-v="h"]').click();
      await new Promise((r) => setTimeout(r, 200));
      Storage.prototype.setItem = was;
      return n;
    }, pick.s);
    t.ok('marking a line Have saves once, not once per write behind it', saves === 1, 'saves: ' + saves);
    await srcTap(pick.s, 'b');
    await p.waitForTimeout(200);

    /* Off the kitchen: tap its pill again. */
    await p.click('.tab[data-view="plan"]').then(() => p.evaluate(() => window.Hive.go('pantry'))).then(() => p.evaluate(() => { const d = document.getElementById('storePart'); if (d) d.open = true; }));
    await p.waitForTimeout(250);
    await p.fill('#kitFind', pick.kl.slice(0, 5));
    await p.waitForTimeout(150);
    await p.click('[data-kitpill="' + pick.k + '"]');
    await p.waitForTimeout(250);
    await p.click('.tab[data-view="plan"]').then(() => p.evaluate(() => window.Hive.go('list')));
    await p.waitForTimeout(250);
    t.ok('taken out of the kitchen, it is bought again', await groupOf(pick.k) === 'To buy');

    /* Leftovers nights in Plan my week. */
    await p.evaluate(() => {
      window.Store.clearPlan();
      localStorage.setItem('sh.pw', JSON.stringify({ days: ['mon', 'tue', 'wed', 'thu'], ppl: 4, t: 0, lo: 1, shelf: true, wk: window.Store.activeWeek().id }));
    });
    await p.click('.tab[data-view="plan"]');
    await p.waitForTimeout(250);
    await p.click('#planMyWeek');
    await p.waitForTimeout(250);
    await p.click('[data-pwsee]');
    await p.click('[data-pwpick="all"]');
    await p.waitForTimeout(400);
    const lo = await p.evaluate(() => ['mon', 'tue', 'wed', 'thu'].map((d) => {
      const row = document.querySelector('#planGrid [data-dayopen][data-day="' + d + '"]');
      return row ? { day: d.toUpperCase(), id: row.dataset.dayopen, left: !!row.querySelector('.day-tag'),
        swap: !!row.closest('.day-item').querySelector('[data-pswap]'), meta: (row.querySelector('small') || {}).textContent || '' } : null;
    }).filter(Boolean));
    const L = lo.filter((x) => x.left);
    const cooked = L[0] && lo[lo.findIndex((x) => x === L[0]) - 1];
    t.ok('one leftovers night on the week: the dinner the night before, again, with nothing to swap, and the night before says so',
      lo.length === 4 && L.length === 1 && cooked && cooked.id === L[0].id && !L[0].swap && /cooked ×[0-9.]+ · leftovers /.test(cooked.meta), JSON.stringify(lo));
    const plan = await p.evaluate(() => ['mon', 'tue', 'wed', 'thu'].map((d) => window.Store.day(d)[0] || null));
    const lod = plan.find((e) => e && e.lo), src = plan.find((e) => e && !e.lo && lod && e.id === lod.id);
    t.ok('added to the week, the leftovers night is marked and the night before is cooked double',
      !!lod && !!src && src.x >= 2 && lod.x === 1, JSON.stringify(plan));
    t.ok('with no error on the page', errs.length === 0, errs.join(' | '));
    await p.context().close();
  },
};
