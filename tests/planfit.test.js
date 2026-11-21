/* The plan's pieces agreeing with each other.
 *
 * Found by a review on 1 October 2026: each of these worked on its own and
 * went wrong where it met another — a leftovers night and the ×N button, a
 * dinner taken off and the night it fed, Cook this again and the days already
 * gone, the steps and the week on screen, Plan my week and the dinners
 * already planned, the plan's "to buy" and the list's. The clock is fixed on
 * Thursday 1 October 2026: this week is Sep 27 – Oct 3, Sunday to Wednesday
 * are gone. */

const THU = new Date(2026, 9, 1, 9, 0, 0);

module.exports = {
  name: 'Plan pieces that fit together',
  async run(t) {
    const p = await t.fresh({ viewport: { width: 390, height: 844 } });
    await p.clock.setFixedTime(THU);
    await p.evaluate(() => localStorage.clear());
    await p.reload();
    await p.waitForTimeout(900);
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    const dinners = await p.evaluate(() => {
      const a = window.__pw.answers();
      a.avoid = []; a.ing = []; a.t = 0; a.fit = 0; a.kind = [];
      return window.__pw.pool(a, true).slice(0, 6).map((r) => r.id);
    });
    t.ok('there are dinners to plan with', dinners.length === 6, dinners.length);
    const [X, Y, Z] = dinners;
    await p.evaluate(() => window.Hive.go('plan'));
    await p.waitForTimeout(300);
    const day = (d) => p.evaluate((d) => window.Store.day(d), d);

    /* ---- a leftovers night has no ×N ---- */
    await p.evaluate(([X]) => window.Store.batch(() => {
      window.Store.addToDay(X, 'thu', 2);
      window.Store.addToDay(X, 'fri', 1, true);
    }), [X]);
    await p.waitForTimeout(200);
    const sheet = async (d) => {
      await p.click('#planGrid [data-dayopen][data-day="' + d + '"]');
      await p.waitForTimeout(200);
      const out = await p.evaluate(() => ({ m: document.querySelector('.dsh-m').textContent, acts: [...document.querySelectorAll('[data-dsact]')].map((b) => b.dataset.dsact) }));
      await p.click('.dsh-sheet .sheet-x');
      await p.waitForTimeout(200);
      return out;
    };
    const mult = { thu: await sheet('thu'), fri: await sheet('fri') };
    t.ok('the dinner’s sheet says cooked ×2 with leftovers Friday and offers one batch, swap and off; the leftovers night’s offers only open, add and off',
      /cooked ×2 · leftovers Friday/.test(mult.thu.m) && mult.thu.acts.join() === 'open,swap,single,add,remove' &&
      /^Leftovers/.test(mult.fri.m) && mult.fri.acts.join() === 'open,add,remove', JSON.stringify(mult));

    /* ---- swapping the dinner carries its leftovers night ---- */
    await p.click('[data-pswap][data-day="thu"]');
    await p.waitForTimeout(250);
    let thu = await day('thu'), fri = await day('fri');
    t.ok('↻ on a cooked-double dinner: the new one is cooked double and the leftovers night follows it',
      thu.length === 1 && thu[0].id !== X && thu[0].x === 2 && !thu[0].lo &&
      fri.length === 1 && fri[0].id === thu[0].id && fri[0].lo, JSON.stringify({ thu, fri }));

    /* ---- removing the dinner takes its leftovers night ---- */
    await p.click('#planGrid [data-dayopen][data-day="thu"]');
    await p.waitForTimeout(200);
    await p.click('[data-dsact="remove"]');
    await p.waitForTimeout(300);
    thu = await day('thu'); fri = await day('fri');
    t.ok('Take it off on that dinner takes its leftovers night off too, and closes the sheet',
      thu.length === 0 && fri.length === 0 && await p.evaluate(() => !document.querySelector('.dsh-sheet')), JSON.stringify({ thu, fri }));

    /* ---- the ×N button on a dinner keeps it a dinner; one set on a leftovers night by
            an older phone keeps it leftovers ---- */
    await p.evaluate(([X]) => window.Store.batch(() => {
      window.Store.addToDay(X, 'sat', 1, true);
    }), [X]);
    await p.waitForTimeout(150);
    const loKept = await p.evaluate(([X]) => {
      window.Store.addToDay(X, 'sat', 2, window.Store.day('sat')[0].lo);
      return window.Store.day('sat')[0];
    }, [X]);
    t.ok('rescaling an entry keeps whether it is leftovers', loKept.lo === true, JSON.stringify(loKept));
    await p.evaluate(() => window.Store.clearPlan());

    /* ---- Cook this again fills only the days still to come ---- */
    await p.evaluate(([X, Y, Z]) => {
      window.Store.setWeek('d20260920');
      window.Store.batch(() => {
        ['sun', 'mon', 'tue'].forEach((d) => window.Store.addToDay(Y, d, 1));
        window.Store.addToDay(Z, 'wed', 2);
        window.Store.addToDay(Z, 'thu', 1, true);   // its cooked night falls on a day gone by here
        window.Store.addToDay(X, 'fri', 1);
      });
      window.Store.setWeek(window.Store.thisWeek());
    }, [X, Y, Z]);
    await p.waitForTimeout(250);
    await p.click('[data-calagain]');
    await p.waitForTimeout(200);
    await p.click('[data-calfrom="d20260920"]');
    await p.waitForTimeout(300);
    const after = await p.evaluate(() => Object.fromEntries(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map((d) => [d, window.Store.day(d).map((e) => e.id + (e.lo ? 'lo' : ''))])));
    t.ok('Cook this again leaves the days gone by alone, and a leftovers night without its dinner stays behind',
      ['sun', 'mon', 'tue', 'wed', 'thu'].every((d) => after[d].length === 0) && after.fri.join() === String(X), JSON.stringify(after));

    /* ---- a week gone by offers no Cook this again ---- */
    await p.click('#calPrev');
    await p.waitForTimeout(250);
    const pastActs = await p.evaluate(() => ({
      id: window.Store.activeWeek().id,
      again: !!document.querySelector('[data-calagain]'),
      clear: !!document.getElementById('clearPlan'),
    }));
    t.ok('last week: no Cook this again and no Clear, its history is kept', pastActs.id === 'd20260920' && !pastActs.again && !pastActs.clear, JSON.stringify(pastActs));

    /* ---- the steps keep the week on screen ---- */
    await p.click('#calNext');
    await p.click('#calNext');
    await p.waitForTimeout(250);
    await p.evaluate(([Y]) => window.Store.addToDay(Y, 'mon', 1), [Y]);
    await p.evaluate(() => window.Hive.go('pantry'));
    await p.waitForTimeout(250);
    await p.evaluate(() => window.Hive.go('where'));
    await p.waitForTimeout(250);
    await p.evaluate(() => window.Hive.go('list'));
    await p.waitForTimeout(300);
    const shop = await p.evaluate(() => ({ id: window.Store.activeWeek().id, head: document.getElementById('listWeek').textContent }));
    t.ok('next week → On hand → Where → Shop: the list is next week’s', shop.id === 'd20261004' && /Oct 4/.test(shop.head), JSON.stringify(shop));
    await p.click('.tab[data-view="browse"]');
    await p.waitForTimeout(250);
    t.ok('leaving Plan altogether is back on this week', (await p.evaluate(() => window.Store.activeWeek().id)) === 'd20260927');

    /* ---- Plan my week knows the dinners already planned ---- */
    const picked = await p.evaluate(([X]) => {
      window.Store.addToDay(X, 'thu', 1);
      const a = window.__pw.answers();
      a.days = ['fri', 'sat']; a.avoid = []; a.ing = []; a.t = 0; a.fit = 0; a.kind = []; a.lo = 0;
      let again = 0;
      for (let i = 0; i < 60; i++) if (window.__pw.pick(a).some((e) => e.r.id === X)) again++;
      return again;
    }, [X]);
    t.ok('Plan my week never picks a dinner already on the week', picked === 0, picked + ' of 60');

    const need = await p.evaluate(() => {
      window.Store.clearPlan();
      const a = window.__pw.answers();
      a.days = ['thu', 'fri', 'sat']; a.lo = 1;
      return window.__pw.count(a).need;
    });
    t.ok('with one leftovers night, three nights need two different dinners', need === 2, need);

    /* ---- one "to buy" figure ---- */
    await p.evaluate(([X]) => {
      window.Store.setOpt('store', false);
      window.Store.addToDay(X, 'fri', 1);
      const k = Object.keys(window.PANTRY).find((k) => window.PANTRY[k].usd > 0.5 && window.PANTRY[k].stap);
      window.Store.setLow(k || 'butter', true);
    }, [X]);
    await p.evaluate(() => window.Hive.go('plan'));
    await p.waitForTimeout(300);
    const plan$ = await p.evaluate(() => (document.getElementById('planSum').textContent.match(/\$[\d.]+/) || [''])[0]);
    await p.evaluate(() => window.Hive.go('list'));
    await p.waitForTimeout(300);
    const list$ = await p.evaluate(() => (document.getElementById('listCount').textContent.match(/\$[\d.]+/) || [''])[0]);
    t.ok('the plan’s “to buy” is the list’s, ran-out staples and all', plan$ && plan$ === list$, plan$ + ' vs ' + list$);

    /* ---- a dangerous confirm looks dangerous ---- */
    await p.evaluate(() => window.Hive.go('plan'));
    await p.waitForTimeout(250);
    await p.click('#clearPlan');
    await p.waitForTimeout(300);
    const col = await p.evaluate(() => {
      const probe = document.createElement('i');
      probe.style.background = 'var(--danger)';
      document.body.appendChild(probe);
      const want = getComputedStyle(probe).backgroundColor;
      probe.remove();
      const b = document.querySelector('#dialogRoot .btn-primary.danger');
      return { want, got: b && getComputedStyle(b).backgroundColor };
    });
    t.ok('“Clear the week” is the danger colour, not the plain one', col.got && col.got === col.want, JSON.stringify(col));

    t.ok('no page errors', errs.length === 0, errs.join(' | '));
    await p.context().close();
  },
};
