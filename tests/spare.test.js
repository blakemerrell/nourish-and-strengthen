/* Reps to spare, from the plan to the last set (Blake, 2026-11-03).
 *
 * Week 1 of a new block asks for three to spare. His row's last set of the
 * block before was 120 x 15 near failure, and the plan said 125 x 13: about
 * none to spare at 125, and over the 8-12 range. Then, a set done at 120 x 10
 * with two to spare, the next still said 10. And the box for reps to spare
 * said "–", so the number that says how hard a set should be was nowhere on
 * it. "I don't feel like the workout is suggesting the right weight at the
 * rep target. Today should be RIR 3."
 *
 * Here: today's weight at today's reps to spare, reps kept inside the range,
 * the next set following the spare you logged, and the aim in the box. */
const BLOCK = require('./fixtures/block-seed.js');

module.exports = {
  name: 'Reps to spare: planned at today’s effort, followed set to set, shown on the set',
  async run(t) {
    const p = await t.fresh({ viewport: { width: 390, height: 844 } });

    /* ---- the plan, from last time's sets ---- */
    const plan = await p.evaluate(() => {
      const _ = window.Train._, now = Date.now();
      const run = (e, sets, pq, want) => {
        const wo = { o1: { id: 'o1', st: now - 3 * 864e5, en: now - 3 * 864e5 + 3600e3, u: 'lb', ms: 'old', w: 4, d: 0, n: 'x', x: [{ e, pq, s: sets }], sr: {}, fb: {} } };
        localStorage.setItem('bsc.train', JSON.stringify({ pr: { u: 'lb', qz: 1, lvl: 1 }, ms: {}, cx: {}, ax: {}, wo }));
        _.reload();
        return _.target(_.lib(e), null, 0, 0, false, want);
      };
      const row = [{ w: 120, r: 15, q: 0, t: 1 }, { w: 120, r: 12, q: 0, t: 1 }];
      return {
        week1: run('cb-row', row, 0, 3),
        same: run('cb-row', row, 0, 0),
        unsaid: run('cb-row', row.map((s) => ({ w: s.w, r: s.r, t: 1 })), 0, 3),
        harder: run('cb-row', [{ w: 120, r: 10, q: 3, t: 1 }], 3, 1),
        short: run('bb-bench', [{ w: 185, r: 6, q: 0, t: 1 }], 0, 3),
        // Oct 22 kind: no spare logged and no pq saved (before 2026-10-27), and no block to read: assume two
        unknown: run('cb-rev-x', [{ w: 15, r: 14, t: 1 }, { w: 15, r: 12, t: 1 }], undefined, 3),
        rr: window.Train._.lib('cb-row').rr,
        // the same session, kept with the block it belonged to: its week's reps to spare are read from the block
        fromBlock: (() => {
          const _ = window.Train._, ms = _.build({ goal: 'grow', dpw: 4, kit: 'gym', lvl: 1, acc: 4, pri: [] });
          ms.id = 'old'; const lastW = 3;
          const wo = { o1: { id: 'o1', st: now - 15 * 864e5, en: now - 15 * 864e5 + 3600e3, u: 'lb', ms: 'old', w: lastW, d: 0, n: 'x',
            x: [{ e: 'cb-rev-x', s: [{ w: 15, r: 14, t: 1 }, { w: 15, r: 12, t: 1 }] }], sr: {}, fb: {} } };
          localStorage.setItem('bsc.train', JSON.stringify({ pr: { u: 'lb', qz: 1, lvl: 1 }, ms: { old: ms }, cx: {}, ax: {}, wo }));
          _.reload();
          return { t: _.target(_.lib('cb-rev-x'), null, 0, 0, false, 3), asked: _.rirFor(ms, lastW) };
        })()
      };
    });
    t.ok('after 120 x 15 with none to spare, a week asking for three plans 125 x 10, not 125 x 13',
      plan.week1.tw === 125 && plan.week1.tr === 10 && plan.week1.ef && plan.week1.ef.k === 'aim' && plan.week1.ef.q === 0 && plan.week1.ef.a === 3, JSON.stringify(plan.week1));
    t.ok('the step up never plans reps past the top of the range', plan.same.tw === 125 && plan.same.tr === plan.rr[1] && !plan.same.ef, JSON.stringify(plan.same));
    t.ok('with no spare logged, what last time’s plan asked stands in for it', plan.unsaid.tw === 125 && plan.unsaid.tr === 10, JSON.stringify(plan.unsaid));
    t.ok('a week asking for less to spare is left to double progression: never moved up by this', !plan.harder.ef || plan.harder.ef.k !== 'aim', JSON.stringify(plan.harder));
    t.ok('an old session with no plan saved has its week\u2019s reps to spare read from its block',
      plan.fromBlock.t.ef && plan.fromBlock.t.ef.q === plan.fromBlock.asked && plan.fromBlock.t.tr < 15, JSON.stringify(plan.fromBlock));
    t.ok('a session with no spare logged and no plan saved is taken as two to spare, so week one still eases off',
      plan.unknown.tr < 15 && plan.unknown.ef && plan.unknown.ef.k === 'aim' && plan.unknown.ef.q === 2, JSON.stringify(plan.unknown));
    t.ok('when the weight is worth fewer reps than the range starts at, the reps go to the bottom and the weight comes down, no more than a tenth',
      plan.short.tr === 6 && plan.short.tw < 185 && plan.short.tw >= 185 - 20 && plan.short.ef.k === 'aim', JSON.stringify(plan.short));

    /* ---- in the workout ---- */
    await p.evaluate(BLOCK, { weeks: [] });
    await p.evaluate(() => { const T = JSON.parse(localStorage.getItem('bsc.train')); T.pr.rq = 1; localStorage.setItem('bsc.train', JSON.stringify(T)); window.Train._.reload(); });
    await p.click('.tab[data-view="train"]');
    await p.evaluate(() => { const b = document.querySelector('[data-t="start"], [data-t="go"]'); if (b) b.click(); });
    await p.waitForTimeout(300);
    const live = await p.evaluate(() => {
      const L = window.Train._.state().LIVE;
      const xi = L.x.findIndex((x) => !x.fix && Number.isFinite(x.rir) && x.s.filter((s) => !s.wu).length >= 3 && !/pull-up|chin|dip/i.test(x.e));
      return { xi, rir: xi >= 0 ? L.x[xi].rir : null, j: xi >= 0 ? L.x[xi].s.findIndex((s) => !s.wu) : -1 };
    });
    t.ok('week 1 of the block asks for three to spare', live.rir === 3, JSON.stringify(live));
    const x = live.xi, j = live.j;
    const aim = await p.evaluate(([x, j]) => {
      const w = document.querySelector(`[data-in="q"][data-x="${x}"][data-s="${j}"]`).closest('.tr-rqw');
      return w && { aim: w.dataset.aim, list: [...w.querySelectorAll('option')].map((o) => o.textContent).join(' ') };
    }, [x, j]);
    t.ok('an unset spare box shows the aim, faint, and the list to pick from still reads – 0 1 2 3 4 5+',
      aim && aim.aim === '3' && aim.list === '– 0 1 2 3 4 5+', JSON.stringify(aim));

    const sel = `[data-in="q"][data-x="${x}"][data-s="${j}"]`;
    await p.selectOption(sel, '1');
    const picked = await p.evaluate((s) => { const e = document.querySelector(s); return { v: e.value, off: e.closest('.tr-rqw').classList.contains('off') }; }, sel);
    t.ok('picking one logs it and the aim goes', picked.v === '1' && picked.off, JSON.stringify(picked));

    await p.fill(`#trw-${x}-${j}`, '100');
    await p.fill(`#trr-${x}-${j}`, '10');
    await p.click(`[data-t="tick"][data-x="${x}"][data-s="${j}"]`);
    await p.waitForTimeout(150);
    const next = await p.evaluate(([x, j]) => document.getElementById(`trr-${x}-${j + 1}`).placeholder, [x, j]);
    t.ok('ten reps with one to spare, on a day asking for three: the next set says eight, not ten', next === '8', next);

    await p.click(`[data-t="tick"][data-x="${x}"][data-s="${j + 1}"]`).catch(() => {});
    await p.waitForTimeout(150);
    await p.evaluate(([x, j]) => { const L = window.Train._.state().LIVE; L.x[x].s[j + 1].q = '5'; window.Train._.draw(); }, [x, j]);
    const up = await p.evaluate(([x, j]) => ({ r: document.getElementById(`trr-${x}-${j + 2}`).placeholder, top: window.Train._.state().LIVE.x[x].rr[1] }), [x, j]);
    t.ok('five or more to spare: the next set asks for more, up to the top of the range', +up.r > 8 && +up.r <= Math.max(8, up.top), JSON.stringify(up));
    t.ok('nothing is wider than the phone', await p.evaluate(() => document.documentElement.scrollWidth <= 390));
  }
};
