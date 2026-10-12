/* Plan as one engine: the week, the list one tap below it, and the two
 * settings (where your staples come from, what you keep on hand) set once
 * from the Sync & sharing sheet.
 *
 * Blake: "There's a natural flow to this and we need to get this plan
 * feature flowing in a natural way", and later: "I don't like having two
 * separate engines." The step bar is gone; the week is Plan. */

module.exports = {
  name: 'Plan flow',
  async run(t) {
    const p = await t.fresh({ viewport: { width: 390, height: 844 } });
    /* A Sunday morning: every day of the week is still ahead, so a plan
       written in this test is never a plan for a day already gone. */
    await p.clock.setFixedTime(new Date(2026, 8, 27, 9, 0, 0));
    await p.reload();
    await p.waitForTimeout(900);
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await p.evaluate(() => {
      const d = window.RECIPES.filter((r) => r.book === 2 && r.secNum === 3).slice(4, 8);
      ['mon', 'tue', 'wed', 'thu'].forEach((day, i) => window.Store.addToDay(d[i].id, day, 1));
    });
    await p.click('.tab[data-view="plan"]');
    await p.waitForTimeout(300);
    const s0 = await p.evaluate(() => ({
      steps: document.querySelectorAll('.pstep, #planSteps').length,
      k: document.querySelector('#view-plan .step-k').textContent,
      banner: (document.querySelector('.setup-card b') || {}).textContent,
      next: (document.querySelector('#planNext .plan-next') || {}).textContent || '',
      rows: [...document.querySelectorAll('#planGrid .day-item-name')].map((b) => ({ open: b.dataset.dayopen, day: b.dataset.day })),
      ctl: document.querySelectorAll('#planGrid [data-mult], #planGrid [data-drop], #planGrid [data-prate]').length,
      tabs: [...document.querySelectorAll('.tabs .tab')].filter((b) => b.offsetParent).map((b) => b.dataset.view),
    }));
    t.ok('Plan opens on the week, with no step bar, List and Pantry no longer tabs of their own, and Today first',
      s0.steps === 0 && s0.k === 'Plan · the week' && s0.tabs.join() === 'today,browse,plan,macros,train', JSON.stringify(s0));
    t.ok('each dinner is one button that opens its day; the ×N, × and rating are off the rows',
      s0.rows.length === 4 && s0.rows.every((r) => r.open && r.day) && s0.ctl === 0, JSON.stringify(s0.rows));
    t.ok('the foot is the list: what to buy and what comes from the storehouse', /^The list/.test(s0.next) && /from the storehouse/.test(s0.next), s0.next);
    t.ok('and, not set up yet, it asks where your staples come from', s0.banner === 'Where do your staples come from?', s0.banner);

    await p.click('.setup-card [data-stepgo="where"]');
    await p.waitForTimeout(250);
    await p.click('[data-weekbuy="0"]');
    await p.waitForTimeout(250);
    const where = await p.evaluate(() => ({ mode: window.__flow.mode(), near: !!document.querySelector('[data-near]'),
      lit: document.querySelector('.tab[aria-selected="true"]').dataset.view }));
    t.ok('Only what I have (the storehouse and my shelf) is remembered, offers the one-or-two allowance, and Plan stays the lit tab',
      where.mode === 'sh' && where.near && where.lit === 'plan', JSON.stringify(where));

    /* Storehouse only: every suggestion can be made without a store. */
    const only = await p.evaluate(() => {
      const a = { days: ['mon'], ppl: 4, bud: 150, t: 0, prot: [], kind: [], fit: false, avoid: [], ing: [], rec: 0, shelf: true };
      const pool = window.__pw.pool(a, false);
      return { n: pool.length, bad: pool.filter((r) => window.__flow.needs(r) > 0).map((r) => r.name) };
    });
    await p.click('[data-near]');
    await p.waitForTimeout(200);
    const near = await p.evaluate(() => {
      const a = { days: ['mon'], ppl: 4, bud: 150, t: 0, prot: [], kind: [], fit: false, avoid: [], ing: [], rec: 0, shelf: true };
      const pool = window.__pw.pool(a, false);
      return { n: pool.length, max: Math.max.apply(null, pool.map((r) => window.__flow.needs(r))) };
    });
    t.ok('storehouse only suggests only what needs nothing from a store; allowing one or two widens it, and no further',
      only.n > 0 && only.bad.length === 0 && near.n > only.n && near.max <= 2, JSON.stringify({ only, near }));

    const wk = await p.evaluate(() => ({ k: document.querySelector('#whereBody .step-k').textContent, done: (document.querySelector('#whereBody [data-stepgo]') || {}).dataset }));
    t.ok('Where is a setting now, and ends with Done', wk.k === 'Settings · your kitchen' && wk.done && wk.done.stepgo === 'plan', JSON.stringify(wk));
    await p.click('#whereBody [data-stepgo="plan"]');
    await p.waitForTimeout(250);
    t.ok('Done goes back to the week, and the set-up card is gone for good',
      await p.evaluate(() => !document.querySelector('.setup-card') && window.Store.opt('setup', false) && !document.getElementById('view-plan').classList.contains('hide')));

    /* On hand, from the Sync & sharing sheet. */
    await p.click('#syncBtn');
    await p.waitForTimeout(250);
    const rows = await p.evaluate(() => [...document.querySelectorAll('button.kit-row')].map((b) => b.dataset.sync + ':' + b.querySelector('small').textContent));
    t.ok('the sheet has the two settings, each saying what it is set to', rows.length === 2 && /^where:The bishops’ storehouse · only what I have$/.test(rows[0]) && /^pantry:\d+ on hand$/.test(rows[1]), JSON.stringify(rows));
    await p.click('button.kit-row[data-sync="pantry"]');
    await p.waitForTimeout(400);
    t.ok('tapping one closes the sheet and opens it', await p.evaluate(() => !document.querySelector('.sync-sheet') && !document.getElementById('view-pantry').classList.contains('hide') &&
      document.querySelector('#view-pantry .step-k').textContent === 'Settings · what you keep'));
    const more = await p.evaluate(() => {
      const m = document.querySelector('#view-pantry [data-kitmore]');
      const g = m.closest('.kit-grp');
      return { c: m.dataset.kitmore, before: g.querySelectorAll('.kit-pill').length, says: m.textContent };
    });
    await p.click('[data-kitmore="' + more.c + '"]');
    await p.waitForTimeout(200);
    const after = await p.evaluate((c) => [...document.querySelectorAll('#view-pantry .kit-grp')].find((g) => g.querySelector('.kit-gh span').textContent === c).querySelectorAll('.kit-pill').length, more.c);
    t.ok('each shelf shows a few, and +N more opens the rest', after === more.before + Number(more.says.replace(/\D/g, '')), JSON.stringify({ more, after }));
    const pill = await p.evaluate(() => {
      const b = [...document.querySelectorAll('#view-pantry .kit-pill[data-kitpill]')].find((x) => x.getAttribute('aria-pressed') === 'false' && window.PANTRY[x.dataset.kitpill].s);
      return b.dataset.kitpill;
    });
    await p.click('[data-kitpill="' + pill + '"]');
    await p.waitForTimeout(200);
    const on = await p.evaluate((k) => ({ k: window.Store.kitchen(k), pressed: document.querySelector('[data-kitpill="' + k + '"]').getAttribute('aria-pressed') }), pill);
    t.ok('tapping a pill puts that food in the kitchen', on.k === 1 && on.pressed === 'true', JSON.stringify(on));

    await p.click('#view-pantry [data-stepgo="plan"]');
    await p.waitForTimeout(250);
    t.ok('Done goes back to the week', await p.evaluate(() => !document.getElementById('view-plan').classList.contains('hide')));

    /* The list */
    await p.click('#planNext [data-stepgo="list"]');
    await p.waitForTimeout(300);
    const shop = await p.evaluate(() => ({
      k: document.querySelector('#view-list .step-k').textContent,
      titles: [...document.querySelectorAll('.list-group-title')].map((e) => e.textContent),
      order: [...document.querySelectorAll('#view-list .list-group-title, #view-list .list-fold > summary > span')].map((e) => e.textContent),
      folded: [...document.querySelectorAll('#view-list .list-fold')].map((d) => d.dataset.fold + ':' + d.open),
      cart: !!document.querySelector('#view-list .wm-btn'),
      low: [...document.querySelectorAll('[data-low]')].map((b) => b.dataset.low),
      shelves: document.querySelectorAll('#listLow .list-shelf').length,
      tags: document.querySelectorAll('#view-list [data-srctag]').length, segs: document.querySelectorAll('#view-list .src-seg').length,
      mark: !!document.querySelector('#view-list [data-listmark="1"]'),
      back: (document.querySelector('#listNext [data-stepgo="plan"]') || {}).textContent || '',
    }));
    t.ok('storehouse only: the storehouse order leads, and there is no Walmart cart',
      shop.k === 'Plan · the list' && shop.titles.indexOf('Storehouse order') >= 0 && !shop.cart, JSON.stringify(shop));
    t.ok('"Anything run out?" comes last, folded, the staples by shelf — no wall of pills before the food',
      shop.order[0] === 'Storehouse order' && shop.order[shop.order.length - 1] === 'Anything run out?' &&
      shop.folded.every((f) => /:false$/.test(f)) && shop.shelves >= 1, JSON.stringify(shop));
    t.ok('a line is the thing and how much, with no tag and no switch; Mark what I have is where a line changes where it comes from',
      shop.tags === 0 && shop.segs === 0 && shop.mark, JSON.stringify(shop));
    t.ok('and the foot goes back to the week', shop.back === 'Back to the week', shop.back);
    t.ok('Anything run out? offers the kitchen’s staples', shop.low.indexOf(pill) >= 0, JSON.stringify(shop.low));
    await p.evaluate(() => document.querySelectorAll('#listLow details').forEach((d) => { d.open = true; }));
    await p.click('[data-low="' + pill + '"]');
    await p.waitForTimeout(250);
    const ran = await p.evaluate((k) => {
      const i = document.querySelector('#listBody [data-check="' + k + '"]');
      return i ? { g: i.closest('.list-group').querySelector('.list-group-title').textContent, q: i.closest('.list-row').querySelector('.qty').textContent } : null;
    }, pill);
    t.ok('a staple marked as run out goes on the storehouse order, said so', !!ran && ran.g === 'Storehouse order' && /ran out/.test(ran.q), JSON.stringify(ran));
    t.ok('the fold stays open through the redraw', await p.evaluate(() => document.querySelector('[data-fold="low"]').open));
    await p.click('[data-low="' + pill + '"]');
    await p.waitForTimeout(250);
    t.ok('and tapped again, it comes off', await p.evaluate((k) => !document.querySelector('#listBody [data-check="' + k + '"]') || !window.Store.low(k), pill));
    t.ok('with no error on the page', errs.length === 0, errs.join(' | '));
    await p.context().close();
  },
};
