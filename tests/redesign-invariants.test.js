/* Non-negotiable redesign invariants (2026-11-19).
 *
 * Ensures future redesign steps (1b-6) never remove:
 *   1. Strengthen live workout 6-column set row, Target RIR (Spare),
 *      inline colored Olympic plate stack (#trpl-* .tr-stk), and inline
 *      rest divider pill (.tr-rdiv).
 *   2. Cook -> List -> Today automatic Walmart cart pipeline (.wm-btn,
 *      addToCart URL, Mark what I have, Check the products).
 *   3. Nourish delete-today vs Unpin routine preservation (#204).
 */
const { nourish } = require('./fixtures/nourish.js');

module.exports = nourish({
  name: 'Redesign invariants: Strengthen plates & RIR, Walmart auto-cart, and pin deletion',
  async suite(t) {
    const errs = [];

    /* 1. Strengthen Live Workout invariants */
    const tr = await t.fresh({ viewport: { width: 390, height: 844 } });
    tr.on('pageerror', (e) => errs.push('train: ' + e.message));
    await tr.evaluate(() => {
      const _ = window.Train._;
      const pr = { qz: 1, kit: 'gym', lvl: 1, rq: 1, pl: 'row', bk: '', jt: '', avoid: [], en: {} };
      const ms = _.build(Object.assign({ prog: 'grow', dpw: 4, min: 60, acc: 4, pri: [] }, pr));
      ms.id = 'invms';
      localStorage.setItem('bsc.train', JSON.stringify({ pr, act: 'invms', ms: { invms: ms }, ax: {}, cx: {}, wo: {}, nt: {} }));
      localStorage.removeItem('sh.trainLive');
      _.reload();
    });
    await tr.click('.tab[data-view="train"]');
    await tr.waitForTimeout(150);
    const woOk = await tr.evaluate(() => {
      const _ = window.Train._;
      document.querySelector('#view-train .tr-next [data-t="start"]').click();
      const st = _.state();
      st.LIVE.x[0].e = 'bb-bench';
      st.LIVE.x[0].s[0].w = 185;
      st.LIVE.x[0].s[1].w = 185;
      _.draw();
      const ex = document.querySelector('#view-train .tr-ex[data-xi="0"]');
      const row = ex && ex.querySelector('.tr-set:not(.tr-set-h)');
      const plates = ex && ex.querySelectorAll('#trpl-0-0 .tr-stk .tr-stk-p');
      const rirSel = row && row.querySelector('[data-in="q"]');
      const rirWrap = row && row.querySelector('.tr-rqw');
      return {
        rowCols: !!(row && row.querySelector('[data-t="sty"]') && row.querySelector('.tr-prev') &&
          row.querySelector('[data-in="w"]') && row.querySelector('[data-in="r"]') && rirSel && row.querySelector('.tr-tick')),
        plates: plates ? plates.length : 0,
        rirAim: rirWrap ? rirWrap.dataset.aim : null,
        restPill: !!ex.querySelector('.tr-rdiv .tr-rdiv-b'),
        popBtn: !!ex.querySelector('[data-t="expop"]'),
      };
    });
    t.ok('Strengthen keeps 6-column set row, Target RIR (Spare), inline colored plate stack, and inline rest pill',
      woOk.rowCols && woOk.plates >= 2 && woOk.rirAim !== null && woOk.restPill && woOk.popBtn,
      JSON.stringify(woOk));
    await tr.context().close();

    /* 2. Cook -> List -> Today Walmart auto-cart invariants */
    const wm = await t.fresh({ viewport: { width: 390, height: 844 } });
    wm.on('pageerror', (e) => errs.push('walmart: ' + e.message));
    await wm.clock.setFixedTime(new Date(2026, 8, 27, 9, 0, 0));
    await wm.reload();
    await wm.waitForTimeout(600);
    await wm.evaluate(() => {
      const d = window.RECIPES.filter((r) => r.book === 2 && r.secNum === 3).slice(0, 3);
      ['mon', 'tue', 'wed'].forEach((day, i) => window.Store.addToDay(d[i].id, day, 1));
    });
    await wm.click('.tab[data-view="plan"]');
    await wm.evaluate(() => window.Hive.go('where'));
    await wm.waitForTimeout(200);
    await wm.click('[data-srcpick="own"]');
    await wm.waitForTimeout(200);
    await wm.evaluate(() => window.Hive.go('list'));
    await wm.waitForTimeout(300);
    const listWm = await wm.evaluate(() => {
      const btn = document.querySelector('#view-list .wm-btn');
      return {
        href: btn ? btn.getAttribute('href') : '',
        markBtn: !!document.querySelector('#listBody [data-listmark="1"]'),
        checkProd: !!document.querySelector('#view-list .wm-fix'),
      };
    });
    t.ok('List preserves Walmart cart URL button, Mark what I have, and Check the products',
      /^https:\/\/www\.walmart\.com\/sc\/cart\/addToCart\?items=\d+_\d+/.test(listWm.href) &&
      listWm.markBtn && listWm.checkProd, JSON.stringify(listWm));
    await wm.click('.tab[data-view="today"]');
    await wm.waitForTimeout(250);
    const todayWm = await wm.evaluate(() => {
      const btn = document.querySelector('#view-today .td-wm');
      return btn ? btn.getAttribute('href') : '';
    });
    t.ok('Today preserves the direct Walmart cart button when items are left to buy',
      /^https:\/\/www\.walmart\.com\/sc\/cart\/addToCart\?items=\d+_\d+/.test(todayWm), JSON.stringify(todayWm));
    await wm.context().close();

    /* 3. Nourish delete-today vs Unpin invariant (#204) */
    const nu = await t.fresh({ viewport: { width: 390, height: 844 } });
    nu.on('pageerror', (e) => errs.push('nourish: ' + e.message));
    await nu.evaluate(() => {
      localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 180, f: 60, c: 200 }));
      localStorage.setItem('bsc.macroSlots', JSON.stringify({
        list: [{ k: 'b', n: 'Breakfast', t: 'b', pins: [{ id: 'f:egg', x: 2 }] },
          { k: 'l', n: 'Lunch', t: 'l' }, { k: 'd', n: 'Dinner', t: 'd' }],
        names: { b: 'Breakfast', l: 'Lunch', d: 'Dinner' }
      }));
      localStorage.removeItem('bsc.macroDays');
    });
    await nu.reload();
    await nu.click('.tab[data-view="macros"]');
    await nu.waitForTimeout(300);
    await nu.click('#macroSlots [data-mamt$="|b:0"]');
    await nu.waitForTimeout(150);
    await nu.click('#macroSlots [data-mdel="b:0"]');
    await nu.waitForTimeout(200);
    const pinState = await nu.evaluate(() => {
      const days = JSON.parse(localStorage.getItem('bsc.macroDays') || '{}');
      const todayKey = Object.keys(days)[0];
      const slots = JSON.parse(localStorage.getItem('bsc.macroSlots') || '{}');
      const bSlot = (slots.list || []).find((s) => s.k === 'b');
      return {
        todayBreakfast: todayKey ? days[todayKey].b : null,
        pinCount: bSlot && bSlot.pins ? bSlot.pins.length : 0,
        pinId: bSlot && bSlot.pins && bSlot.pins[0] ? bSlot.pins[0].id : null,
      };
    });
    t.ok('Deleting a pinned food removes it from today while keeping its everyday pin',
      Array.isArray(pinState.todayBreakfast) && pinState.todayBreakfast.length === 0 &&
      pinState.pinCount === 1 && pinState.pinId === 'f:egg', JSON.stringify(pinState));
    await nu.context().close();

    t.ok('no page errors', errs.length === 0, errs.join(' | '));
  },
});
