/* A workout of your own, with a block running.
 *
 * Blake, 2026-10-16: he did one exercise of the morning's session and saved
 * it; that evening he wanted to train again with an exercise of his own, and
 * there was no way in. Saving had made the day done, the card under the
 * calendar offered only the next session, and the empty workout (where Make
 * your own lives) was only offered with no block at all. */
const MORNING_DONE = new Date(2026, 9, 15, 19, 0, 0);   // a Thursday evening

const SETUP = () => {
  localStorage.setItem('sh.view', 'train'); localStorage.setItem('sh.viewAt', String(Date.now()));
  const _ = window.Train._, ms = _.build({ goal: 'grow', dpw: 4, kit: 'gym', lvl: 1, acc: 4, pri: [] });
  ms.id = 'b'; ms.n = 'Fall block'; ms.at = Date.now() - 3 * 864e5;
  const e = ms.days[0].s[0].e;
  const st = Date.now() - 10 * 3600e3;
  const wo = { w1: { id: 'w1', n: ms.days[0].n, st: st, en: st + 15 * 60000, u: 'lb', ms: 'b', w: 0, d: 0,
    x: [{ e: e, s: [{ w: 100, r: 10, q: 2 }, { w: 100, r: 9, q: 1 }] }] } };
  localStorage.setItem('bsc.train', JSON.stringify({ pr: { u: 'lb', qz: 1, lvl: 1, ld: [0, 1, 3, 4] }, act: 'b', ms: { b: ms }, cx: {}, ax: {}, wo: wo }));
};

module.exports = {
  name: 'Strengthen: an empty workout with a block running',
  async run(t) {
    const p = await t.fresh({ viewport: { width: 390, height: 844 } });
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await p.clock.setFixedTime(MORNING_DONE);
    await p.reload();
    await p.waitForTimeout(600);
    await p.evaluate(SETUP);
    await p.reload();
    await p.waitForTimeout(900);
    if (!(await p.$('#view-train:not(.hide)'))) { await p.click('.tab[data-view="train"]'); await p.waitForTimeout(400); }

    const card = await p.evaluate(() => {
      const c = document.getElementById('trSesh');
      const b = c && c.querySelector('[data-t="empty"]');
      const r = b && b.getBoundingClientRect();
      return { title: c ? (c.querySelector('.tr-title') || {}).textContent : '', btn: b ? b.textContent : '', h: r ? r.height : 0 };
    });
    t.ok('a session saved this morning leaves the day done, and its card offers an empty workout, a thumb tall',
      /Done for today/.test(card.title) && card.btn === 'Start an empty workout' && card.h >= 44, JSON.stringify(card));

    await p.click('#trSesh [data-t="empty"]');
    await p.waitForTimeout(300);
    const live = await p.evaluate(() => {
      const L = JSON.parse(localStorage.getItem('sh.trainLive') || 'null');
      return { ms: L && L.ms, n: L && L.x.length, add: !!document.querySelector('#view-train [data-t="addex"]') };
    });
    t.ok('it starts a workout that belongs to no block, empty, with + Add an exercise', live.ms === '' && live.n === 0 && live.add, JSON.stringify(live));

    await p.click('#view-train [data-t="addex"]');
    await p.waitForTimeout(300);
    await p.click('[data-t="own"]');
    await p.waitForTimeout(200);
    await p.fill('#trOwnN', 'Sled push');
    await p.click('[data-t="ownsave"]');
    await p.waitForTimeout(300);
    const own = await p.evaluate(() => {
      const L = JSON.parse(localStorage.getItem('sh.trainLive') || 'null');
      return { n: L && L.x.length, names: [...document.querySelectorAll('#view-train .tr-ex .tr-title, #view-train .tr-ex-n')].map((x) => x.textContent).join('|') };
    });
    t.ok('and an exercise of your own goes into it', own.n === 1 && /Sled push/.test(own.names), JSON.stringify(own));

    // the morning's session is still the block's, and still the only one for that day
    const block = await p.evaluate(() => {
      const T = JSON.parse(localStorage.getItem('bsc.train'));
      return Object.keys(T.wo).map((k) => T.wo[k]).filter((w) => w.ms === 'b').length;
    });
    t.ok('the block is untouched: the morning is still its one session that day', block === 1, String(block));

    /* The other way in: the morning's saved workout, Edit, + Add an exercise,
       Make your own. */
    const q = await t.fresh({ viewport: { width: 390, height: 844 } });
    q.on('pageerror', (e) => errs.push(e.message));
    await q.clock.setFixedTime(MORNING_DONE);
    await q.reload();
    await q.waitForTimeout(600);
    await q.evaluate(SETUP);
    await q.reload();
    await q.waitForTimeout(900);
    if (!(await q.$('#view-train:not(.hide)'))) { await q.click('.tab[data-view="train"]'); await q.waitForTimeout(400); }
    const steps = [];
    const tap = async (sel) => { const ok = !!(await q.$(sel)); steps.push(sel + ':' + ok); if (ok) { await q.click(sel); await q.waitForTimeout(300); } return ok; };
    await q.evaluate(() => { const c = [...document.querySelectorAll('[data-t="gridsel"], .tr-grid [data-w="0"][data-d="0"]')][0]; if (c) c.click(); });
    await q.waitForTimeout(300);
    (await tap('[data-t="woedit"]')) && (await tap('[data-t="edaddx"]')) && (await tap('[data-t="own"]'));
    if (await q.$('#trOwnN')) { await q.fill('#trOwnN', 'Sled push'); await tap('[data-t="ownsave"]'); }
    const ed = await q.evaluate(() => ({
      sheet: (document.querySelector('#trainRoot .sheet .sheet-eyebrow, #trainRoot .sheet-top') || {}).textContent || '',
      names: document.querySelector('#trainRoot') ? document.querySelector('#trainRoot').textContent.indexOf('Sled push') >= 0 : false,
    }));
    steps.push(JSON.stringify(ed));
    // saved before any reps are typed: it says why, and the exercise is still there
    await tap('[data-t="edsave"]');
    const warn = await q.evaluate(() => ({ text: document.querySelector('#trainRoot').textContent, open: !!document.querySelector('[data-t="edsave"]') }));
    t.ok('saved before its reps are typed, it says so and keeps the edit open, rather than dropping the exercise',
      warn.open && /Sled push has no reps yet/.test(warn.text), warn.text.slice(0, 300));
    const xi = await q.evaluate(() => { const ins = [...document.querySelectorAll('[data-ed="r"]')]; return ins.length ? ins[ins.length - 1].dataset.x : null; });
    await q.fill('[data-ed="w"][data-x="' + xi + '"]', '90');
    await q.fill('[data-ed="r"][data-x="' + xi + '"]', '12');
    await tap('[data-t="edsave"]');
    const saved = await q.evaluate(() => {
      const T = JSON.parse(localStorage.getItem('bsc.train'));
      const cx = Object.keys(T.cx || {}).find((k) => T.cx[k].n === 'Sled push');
      return { cx: !!cx, inWo: !!(cx && T.wo.w1.x.some((x) => x.e === cx)) };
    });
    t.ok('Edit on the saved workout, + Add an exercise, Make your own: it goes into that workout and is kept',
      saved.cx && saved.inWo, JSON.stringify({ saved, steps }));
    await q.context().close();

    t.ok('with no error on the page', errs.length === 0, errs.join(' | '));
    await p.context().close();
  },
};
