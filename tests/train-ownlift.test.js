/* A lift you made yourself, with a back setting in your answers.
 *
 * Built-in lifts carry their back triggers (bk); one you make has none.
 * barred() read ex.bk.indexOf without a guard, so with any back answer and
 * any lift of your own, every list of exercises threw while it drew: Pick a
 * ready workout, Add an exercise, and so starting a workout at all. Blake,
 * 2026-10-15: "I tried to add exercises and nothing is opening." */
module.exports = {
  name: 'Train: your own lift with a back setting',
  async run(t) {
    const p = await t.fresh();
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await p.evaluate(() => {
      const _ = window.Train._;
      const pr = { qz: 1, kit: 'gym', lvl: 1, bk: 'fcx', jt: 'SK', avoid: [] };
      const ms = _.build(Object.assign({ dpw: 3, acc: 4, pri: [] }, pr));
      ms.id = 'blk'; ms.n = 'My block';
      localStorage.setItem('bsc.train', JSON.stringify({ pr, act: 'blk', ms: { blk: ms }, ax: {}, wo: {},
        cx: { c1: { n: 'Sled push', m: 'quads', k: 'c', q: 'mc' } } }));
      localStorage.removeItem('bsc.trainStamps');
      _.reload();
    });
    await p.click('.tab[data-view="train"]');
    await p.waitForTimeout(150);

    await p.click('.tr-more [data-t="ready"]');
    t.ok('Pick a ready workout opens', await p.isVisible('#trainRoot .sheet .tr-rdb[data-v="fba"]'));
    await p.click('.tr-rdb[data-v="fba"]');
    await p.click('[data-t="rdgo"][data-v="fba"][data-e="1"]');
    let live = await p.evaluate(() => { const L = window.Train._.state().LIVE; return L ? L.x.length : 0; });
    t.ok('and starts one', live > 0, String(live));

    await p.click('[data-t="addex"]');
    t.ok('Add an exercise opens, your own lift in the list',
      await p.isVisible('#trainRoot .sheet [data-t="pickex"][data-e="c1"]'));
    await p.click('#trainRoot .sheet [data-t="pickex"][data-e="c1"]');
    const after = await p.evaluate(() => window.Train._.state().LIVE.x.map((x) => x.e));
    t.ok('and adds it', after.length === live + 1 && after.indexOf('c1') >= 0, after.join());
    t.ok('no page errors through any of it', errs.length === 0, errs.join(' | '));
    await p.close();
  },
};
