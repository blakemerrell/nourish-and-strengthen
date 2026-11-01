/* Review over more than a week: This block and All time (Blake, 2026-10-26).
 *
 * "Visuals that my 11 year old can understand but comprehensive enough that a
 * PhD would be proud": am I on pace, am I keeping muscle, which muscles are
 * growing, does eating (and sleep, once the check-in existed) help my lifts.
 * Simple says it in a sentence and a picture; The math adds the numbers, and
 * never a correlation without its n. Inside Review, not a fifth tab.
 * Mockup: https://claude.ai/artifact/F95PhNPeLVtGRVhi7ynvqe (Main.dc.html) */
const SEED = require('./fixtures/progress-seed.js');
const txt = (p, sel) => p.evaluate((s) => (document.querySelector(s) || {}).textContent || '', sel);
const cards = (p) => p.evaluate(() => [...document.querySelectorAll('#view-train .tr-pg')].map((c) => ({
  eye: (c.querySelector('.tr-eyebrow') || {}).textContent, text: c.textContent, stats: c.querySelectorAll('.tr-pg-stats > div').length })));

module.exports = {
  name: 'Review: This block and All time, Simple and The math',
  async run(t) {
    const p = await t.fresh({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    await p.clock.setFixedTime(new Date(2026, 9, 26, 7, 30, 0));
    await p.reload();
    await p.waitForTimeout(500);
    await p.evaluate(SEED);
    await p.reload();
    await p.waitForTimeout(900);
    // Open Strengthen -> Block (which embeds unified Review & Biometrics Hub) directly
    await p.click('.tab[data-view="train"]');
    await p.waitForTimeout(500);
    await p.click('.tr-seg [data-v="block"]');
    await p.waitForTimeout(400);

    const segs = await p.evaluate(() => [...document.querySelectorAll('[data-t="rvspan"]')].map((b) => b.textContent + ':' + b.getAttribute('aria-pressed')));
    t.ok('Review opens on This week, with This block and All time beside it', segs.join('|') === 'This week:true|This block:false|All time:false', segs.join('|'));
    t.ok('and This week is the Review as it was: the week card and the body map', await p.evaluate(() =>
      !!document.querySelector('#view-train .tr-week') && !!document.querySelector('#view-train .tr-hm-card') && !document.querySelector('#view-train .tr-pg')));

    await p.click('[data-t="rvspan"][data-v="block"]');
    await p.waitForTimeout(300);
    let cs = await cards(p);
    t.ok('This block: five cards, in the order the questions were asked',
      cs.map((c) => c.eye).join('|') === 'On pace|Keeping muscle|Muscles|Food → lifts|Sleep & steps → lifts', cs.map((c) => c.eye).join('|'));
    t.ok('with no block running it says it is the last six weeks', /No block running/.test(await txt(p, '#view-train .tr-pg-head')));
    t.ok('On pace says how far along, and when, in a sentence', /of the way to 180 lb/.test(cs[0].text) && /get there around/.test(cs[0].text), cs[0].text);
    t.ok('Keeping muscle draws weight against strength, and says what it means',
      /Weight is going down and strength is going up/.test(cs[1].text) && await p.evaluate(() => !!document.querySelector('.tr-pg .tr-pg-w') && !!document.querySelector('.tr-pg .tr-pg-s')), cs[1].text);
    t.ok('Muscles colours the body map by how the lifts moved', await p.evaluate(() =>
      document.querySelectorAll('.tr-pg .tr-hm-svg .pg-up').length > 0 && document.querySelectorAll('.tr-pg .tr-hm-svg .pg-down').length > 0));
    t.ok('and names the one slipping: the overhead press is front delts', /Front delts slipped/.test(cs[2].text), cs[2].text);
    t.ok('Food → lifts splits the workouts by the day before, protein and carbs',
      /After you ate your protein/.test(cs[3].text) && /After a short protein day/.test(cs[3].text) && /After a day at your carbs/.test(cs[3].text), cs[3].text);
    t.ok('Sleep & steps → lifts splits them by the night before', /After 7 or more hours of sleep/.test(cs[4].text) && /After under 7 hours/.test(cs[4].text), cs[4].text);
    t.ok('and says the steps and the creatine', /Steps: [\d,]+ a day lately/.test(cs[4].text) && /Creatine: \d+ of \d+ mornings/.test(cs[4].text), cs[4].text);
    const viz = await p.evaluate(() => ({
      readiness: !!document.querySelector('#view-train .tr-readiness .tr-rd-badge'),
      wchart: !!document.querySelector('#view-train .tr-pg-wchart .tr-pg-wtrend'),
      sfill: !!document.querySelector('#view-train .tr-pg-s-fill'),
      cbars: document.querySelectorAll('#view-train .tr-pg-cbar').length,
      fchart: !!document.querySelector('#view-train .tr-pg-fchart'),
      schart: !!document.querySelector('#view-train .tr-pg-schart'),
    }));
    t.ok('renders Readiness & coaching hero banner plus visual trend, fuel, sleep and comparison charts',
      viz.readiness && viz.wchart && viz.sfill && viz.cbars >= 4 && viz.fchart && viz.schart, JSON.stringify(viz));
    t.ok('Simple shows no statistics', cs.every((c) => c.stats === 0));

    await p.click('[data-t="rvdeep"][data-v="1"]');
    await p.waitForTimeout(300);
    cs = await cards(p);
    t.ok('The math puts numbers under every card', cs.every((c) => c.stats > 0), cs.map((c) => c.stats).join(','));
    t.ok('the rate with its 95% interval', /lb\/wk/.test(cs[0].text) && /95% CI/.test(cs[0].text), cs[0].text);
    t.ok('and a correlation is never shown without its n and p', [cs[3].text, cs[4].text].every((x) => !/r = /.test(x) || (/n = \d+/.test(x) && /p = /.test(x))));

    await p.click('[data-t="rvspan"][data-v="all"]');
    await p.waitForTimeout(300);
    t.ok('All time starts at the first day anything was logged', /Since Sep 14/.test(await txt(p, '#view-train .tr-pg-head')), await txt(p, '#view-train .tr-pg-head'));

    await p.reload();
    await p.waitForTimeout(800);
    await p.click('.tab[data-view="train"]');
    await p.waitForTimeout(400);
    t.ok('the span is remembered on this phone', await p.evaluate(() =>
      (document.querySelector('[data-t="rvspan"][aria-pressed="true"]') || {}).textContent === 'All time'));

    // nothing to show: every card waits, and says what it is waiting for
    const q = await t.fresh({ viewport: { width: 320, height: 700 } });
    await q.evaluate(() => localStorage.setItem('bsc.trainSpan', 'block'));
    await q.reload();
    await q.waitForTimeout(700);
    await q.click('.tab[data-view="train"]');
    await q.waitForTimeout(400);
    await q.click('.tr-seg [data-v="block"]').catch(() => {});
    await q.waitForTimeout(300);
    const empty = await q.evaluate(() => [...document.querySelectorAll('.tr-pg')].map((c) => !!c.querySelector('.tr-pg-wait')));
    t.ok('with nothing logged, each card says what it needs instead of drawing nothing', empty.length === 5 && empty.every(Boolean), JSON.stringify(empty));
    t.ok('and nothing is wider than a 320 px phone', await q.evaluate(() => document.documentElement.scrollWidth <= 320), String(await q.evaluate(() => document.documentElement.scrollWidth)));

    // when remote database records arrive while viewing Review, the stats cards redraw live
    await q.clock.setFixedTime(new Date(2026, 9, 26, 7, 30, 0));
    await q.evaluate(SEED);
    await q.evaluate(() => {
      const at = Date.now();
      const tr = JSON.parse(localStorage.getItem('bsc.train') || '{}');
      const wo = {};
      Object.keys(tr.wo || {}).forEach((k) => { wo[k] = { v: tr.wo[k], at }; });
      if (window.Train && window.Train.remote) window.Train.remote({ wo }, true);
      const mapAt = (obj) => { const m = {}; Object.keys(obj || {}).forEach((k) => { m[k] = at; }); return m; };
      localStorage.setItem('bsc.myStamps', JSON.stringify({
        profile: at, targets: at, slots: at, drinks: at,
        w: mapAt(JSON.parse(localStorage.getItem('bsc.macroWeights') || '{}')),
        d: mapAt(JSON.parse(localStorage.getItem('bsc.macroDays') || '{}')),
        am: mapAt(JSON.parse(localStorage.getItem('bsc.macroAm') || '{}'))
      }));
      window.dispatchEvent(new StorageEvent('storage', { key: 'bsc.myStamps' }));
    });
    await q.clock.runFor(200);
    const liveCards = await cards(q);
    t.ok('and when database records sync in, Review automatically redraws with the live stats',
      /of the way to 180 lb/.test(liveCards[0].text) && /After you ate your protein/.test(liveCards[3].text) && /After 7 or more hours of sleep/.test(liveCards[4].text),
      liveCards.map((c) => c.text).join(' || '));
  }
};
