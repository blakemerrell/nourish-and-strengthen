/* The plate counter, both ways round.
 *
 * Blake, 2026-10-23: "a weight counter. there are some exersize like a leg
 * press, or my home cable machine, that use plates instead of weight stack...
 * and i oculd use a plate counter modal somewher on the app". Count plates as
 * they go on, or type a weight and see the plates; on a lift's Plates, and
 * from the top of Strengthen. His home cable is a 2:1 pulley, logged at the
 * handle; a sled's own weight is counted only if he enters one. */

async function seed(p, T) {
  await p.evaluate((T) => {
    localStorage.setItem('bsc.train', JSON.stringify(T));
    localStorage.removeItem('bsc.trainStamps');
    window.Train._.reload();
  }, T);
}
const sheet = (p) => p.evaluate(() => {
  const s = document.querySelector('.tr-sheet') || document.getElementById('modalRoot');
  return {
    text: (s.textContent || '').replace(/\s+/g, ' '),
    tot: (document.getElementById('trPlTot') || {}).textContent || '',
    rail: [...document.querySelectorAll('.tr-plrail .tr-plate')].map((e) => e.textContent).join(','),
    plates: [...document.querySelectorAll('.tr-plates .tr-plate')].map((e) => e.textContent).join(','),
    use: (document.querySelector('[data-t="pluse"]') || {}).textContent || '',
    mode: (document.querySelector('[data-t="plm"][aria-pressed="true"]') || {}).textContent || '',
  };
});
const tap = async (p, ...plates) => { for (const v of plates) await p.click(`[data-t="pladd"][data-v="${v}"]`); };

module.exports = {
  name: 'The plate counter',
  async run(t) {
    const errs = [];
    const open = async (T, vp, opts) => {
      const p = await t.fresh({ viewport: vp || { width: 390, height: 844 }, ...(opts || {}) });
      p.on('pageerror', (e) => errs.push(e.message));
      await seed(p, T);
      await p.click('.tab[data-view="train"]');
      return p;
    };
    const start = async (p, ...lifts) => {
      await p.click('[data-t="empty"]');
      for (const e of lifts) { await p.click('[data-t="addex"]'); await p.click(`.tr-pick[data-e="${e}"]`); }
    };
    const BASE = { pr: { qz: 1 }, act: '', ms: {}, cx: {}, ax: {}, wo: {} };

    /* ---- a leg press at the gym: count the plates on, and use the total */
    let p = await open(BASE);
    await start(p, 'leg-press', 'bb-bench', 'cb-row');
    let r = await p.evaluate(() => ['leg-press', 'bb-bench', 'cb-row'].map((e, i) => !!document.querySelector(`.tr-ex [data-t="plates"][data-x="${i}"]`)).join());
    t.ok('at the gym, Plates is on the leg press and the bench, not on a cable stack', r === 'true,true,false', r);
    await p.click('[data-t="plates"][data-x="0"]');
    r = await sheet(p);
    t.ok('with no weight in the set yet, it opens on counting, at nothing', r.mode === 'Count plates' && r.tot === '0 lb' && r.rail === '' && !r.use, JSON.stringify(r));
    await tap(p, 45, 45, 25);
    r = await sheet(p);
    t.ok('three plates a side on a sled: 45, 45, 25 is 230, the sled not counted', r.rail === '45,45,25' && r.tot === '230 lb' && /each side counted twice/.test(r.text) && r.use === 'Use 230 lb', JSON.stringify(r));
    await p.click('[data-t="plpop"]');
    r = await sheet(p);
    t.ok('− Last plate takes the last one off', r.rail === '45,45' && r.tot === '180 lb', JSON.stringify(r));
    await p.click('[data-t="pluse"]');
    r = await p.evaluate(() => ({ w: window.Train._.state().LIVE.x[0].s[0].w, input: document.getElementById('trw-0-0').value, sheet: !!document.querySelector('.tr-plrail') }));
    t.ok('Use puts it in the first set not yet done, and closes', r.w === '180' && r.input === '180' && !r.sheet, JSON.stringify(r));

    /* ---- a sled's own weight, if you want it counted */
    await p.click('[data-t="plates"][data-x="0"]');
    r = await sheet(p);
    t.ok('the set has a weight now, so it opens on its plates: 180 is two 45s a side', r.mode === 'Plates for a weight' && r.plates === '45,45' && /plates only/.test(r.text) && /Not counted: the weight you log is the plates/.test(r.text), JSON.stringify(r));
    await p.fill('#trSledW', '100');
    await p.click('[data-t="sledset"]');
    r = await sheet(p);
    const sled = await p.evaluate(() => window.Train._.barFor('leg-press'));
    t.ok('a sled weight typed is counted: 180 is then 100 of sled and 40 a side, a 35 and a 5', sled === 100 && /100 lb, counted in the weight you log/.test(r.text) && r.plates === '35,5', JSON.stringify({ sled, r }));
    await p.click('[data-t="plm"][data-v="c"]');
    await tap(p, 45);
    r = await sheet(p);
    t.ok('and counting starts from it: one 45 a side on a 100 lb sled is 190', r.tot === '190 lb' && /100 lb sled, and each side counted twice/.test(r.text), JSON.stringify(r));
    await p.click('[data-t="sledclr"]');
    r = await p.evaluate(() => window.Train._.barFor('leg-press'));
    t.ok('Don’t count it puts it back to plates only', r === 0, r);
    await p.click('.sheet-x');

    /* ---- a bar, the other way round: type it, see it, use it */
    await p.click('[data-t="plates"][data-x="1"]');
    await p.click('[data-t="plm"][data-v="w"]');
    await p.fill('#trPlateW', '225');
    r = await sheet(p);
    t.ok('225 on a 45 bar is two 45s a side, and Use is there for it', r.plates === '45,45' && /on a 45 lb bar/.test(r.text) && r.use === 'Use 225 lb', JSON.stringify(r));
    await p.click('[data-t="pluse"]');
    r = await p.evaluate(() => window.Train._.state().LIVE.x[1].s[0].w);
    t.ok('and Use fills the bench’s set', r === '225', r);

    /* ---- from the top, with no lift: what the plates go on is yours to pick */
    await p.click('#trTop [data-t="plfree"]');
    r = await sheet(p);
    t.ok('the top bar of a workout has the plate counter, on a bar, with no Use (no set to put it in)',
      r.mode === 'Count plates' && /A bar, 45 lb/.test(r.text) && !r.use, JSON.stringify(r));
    await p.click('[data-t="plld"][data-v="pull"]');
    await tap(p, 45, 25);
    r = await sheet(p);
    t.ok('on a 2:1 pulley, 70 on the post is 35 at the handle', r.tot === '35 lb' && /70 lb on the post; the handle carries half/.test(r.text), JSON.stringify(r));
    await p.click('[data-t="plld"][data-v="post"]');
    r = await sheet(p);
    t.ok('on one post, the same plates are 70', r.tot === '70 lb' && /Every plate counted once/.test(r.text), JSON.stringify(r));
    await p.click('[data-t="plclr"]');
    await p.click('.sheet-x');
    await p.context().close();

    /* ---- home: the cable on a 2:1 pulley, set in Settings */
    p = await open({ pr: { qz: 1, gy: { on: 1, u: 'lb', bar: 45, pl: { 45: 1, 25: 1, 10: 1, 5: 1 }, last: 'gym' } }, act: '', ms: {}, cx: {}, ax: {}, wo: {} });
    r = await p.evaluate(() => !!document.querySelector('#trHead [data-t="plfree"]'));
    t.ok('with no workout open, the plate counter is in Strengthen’s header, beside Settings', r);
    await p.click('[data-t="settings"]');
    await p.click('[data-t="s-gycb"][data-v="p2"]');
    r = await p.evaluate(() => ({ cb: window.Train._.state().T.pr.gy.cb,
      chips: [...document.querySelectorAll('[data-t="s-gycb"]')].map((b) => b.textContent + (b.getAttribute('aria-pressed') === 'true' ? '*' : '')).join('|') }));
    t.ok('Settings, home: the cable is a stack, plates on a 2:1 pulley, or plates 1:1', r.cb === 'p2' && r.chips === 'Weight stack|Plates, 2:1 pulley*|Plates, 1:1', JSON.stringify(r));
    await p.click('.sheet-x');
    await start(p, 'cb-row');
    r = await p.evaluate(() => !!document.querySelector('.tr-ex [data-t="plates"][data-x="0"]'));
    t.ok('at the gym the cable row is still a stack, with no Plates', !r);
    await p.click('[data-t="gyat"][data-v="home"]');
    r = await p.evaluate(() => !!document.querySelector('.tr-ex [data-t="plates"][data-x="0"]'));
    t.ok('at home it has Plates', r);
    await p.click('[data-t="plates"][data-x="0"]');
    r = await p.evaluate(() => [...document.querySelectorAll('[data-t="pladd"]')].map((b) => b.dataset.v).join());
    t.ok('at home the plates to tap are the ones you own', r === '45,25,10,5', r);
    await tap(p, 25, 10, 5);
    r = await sheet(p);
    t.ok('25, 10 and 5 on the post is 20 at the handle', r.tot === '20 lb' && /40 lb on the post/.test(r.text) && r.use === 'Use 20 lb', JSON.stringify(r));
    await p.click('[data-t="plm"][data-v="w"]');
    await p.fill('#trPlateW', '45');
    r = await sheet(p);
    t.ok('and the other way: 45 at the handle is 90 on the post, from every plate you own of a pair', r.plates === '45,45' && /On the post, 90 lb for 45 at the handle/.test(r.text), JSON.stringify(r));
    await p.context().close();

    /* ---- 320 px, dark: it fits, and every plate is a thumb tall */
    p = await open(BASE, { width: 320, height: 640 }, { colorScheme: 'dark' });
    await p.click('#trHead [data-t="plfree"]');
    await tap(p, 45, 45, 35, 25, 10, 5, 2.5);
    r = await p.evaluate(() => ({ page: document.documentElement.scrollWidth <= innerWidth,
      pads: Math.min(...[...document.querySelectorAll('[data-t="pladd"]')].map((b) => Math.min(b.getBoundingClientRect().height, b.getBoundingClientRect().width))),
      small: [...document.querySelectorAll('.tr-sheet *')].filter((el) => el.children.length === 0 && el.textContent.trim() && el.getBoundingClientRect().width &&
        parseFloat(getComputedStyle(el).fontSize) < 11).map((el) => el.textContent).slice(0, 5) }));
    t.ok('at 320 px in the dark the counter fits, and each plate button is at least 44 px', r.page && r.pads >= 44, JSON.stringify(r));
    await p.context().close();

    t.ok('with no error on the page', errs.length === 0, errs.join(' | '));
  },
};
