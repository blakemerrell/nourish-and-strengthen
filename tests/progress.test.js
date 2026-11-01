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
    await p.click('.tr-seg [data-v="progress"]');
    await p.waitForTimeout(400);

    const segs = await p.evaluate(() => [...document.querySelectorAll('[data-t="rvspan"]')].map((b) => b.textContent + ':' + b.getAttribute('aria-pressed')));
    t.ok('Review opens on This week, with This block and All time beside it', segs.join('|') === 'This week:true|This block:false|All time:false', segs.join('|'));
    t.ok('and This week is the Review as it was: the week card and the body map', await p.evaluate(() =>
      !!document.querySelector('#view-train .tr-week') && !!document.querySelector('#view-train .tr-hm-card') && !document.querySelector('#view-train .tr-pg')));

    await p.click('[data-t="rvspan"][data-v="block"]');
    await p.waitForTimeout(300);
    let cs = await cards(p);
    /* 2026-11-01: Helping or hurting, Food → lifts and Sleep & steps → lifts
       asked one question three ways, in dots; Blake: "Redo this with better
       charts so I don't get confused by all the dots". Now one card. */
    t.ok('This block: four cards, in the order the questions were asked',
      cs.map((c) => c.eye).join('|') === 'On pace|Keeping muscle|Muscles|What helps your lifts', cs.map((c) => c.eye).join('|'));
    t.ok('with no block running it says it is the last six weeks', /No block running/.test(await txt(p, '#view-train .tr-pg-head')));
    t.ok('On pace says how far along, and when, in a sentence', /of the way to 180 lb/.test(cs[0].text) && /get there around/.test(cs[0].text), cs[0].text);
    t.ok('Keeping muscle draws weight against strength, and says what it means',
      /Weight is going down and strength is going up/.test(cs[1].text) && await p.evaluate(() => !!document.querySelector('.tr-pg .tr-pg-w') && !!document.querySelector('.tr-pg .tr-pg-s')), cs[1].text);
    const km = await p.evaluate(() => {
      const c = [...document.querySelectorAll('#view-train .tr-pg')].find((x) => /Keeping muscle/.test(x.querySelector('.tr-eyebrow').textContent));
      return { head: (c.querySelector('.tr-pg-head2') || {}).textContent || '', charts: c.querySelectorAll('svg.tr-pg-mini').length,
        wpts: c.querySelectorAll('.tr-pg-w-dot').length, weeks: Math.max(1, Math.round((Date.now() - new Date(2026, 8, 14)) / 6048e5)),
        lbl: [...c.querySelectorAll('.tr-pg-mlbl b')].map((b) => b.textContent) };
    });
    t.ok('it says both in a headline, then draws weight and strength as two small charts, a point a week',
      /^Strength (up|down|holding)/.test(km.head) && km.charts === 2 && km.wpts >= 2 && km.wpts <= km.weeks + 1, JSON.stringify(km));
    t.ok('weight in pounds, strength as a percent of the start', /^\d[\d,.]* lb$/.test(km.lbl[0]) && /%$/.test(km.lbl[1]), km.lbl.join(' | '));
    t.ok('Muscles colours the body map by how the lifts moved', await p.evaluate(() =>
      document.querySelectorAll('.tr-pg .tr-hm-svg .pg-up').length > 0 && document.querySelectorAll('.tr-pg .tr-hm-svg .pg-down').length > 0));
    t.ok('and names the one slipping: the overhead press is front delts', /Front delts slipped/.test(cs[2].text), cs[2].text);
    t.ok('the list of every muscle is folded away, a tap from the map', await p.evaluate(() => {
      const d = document.querySelector('.tr-pg details.tr-pg-more');
      return !!d && !d.open && /^See all \d+ muscles$/.test(d.querySelector('summary').textContent) && d.querySelectorAll('.tr-pg-chip').length > 0;
    }));
    /* What helps your lifts: a row a habit, two bars (how often the next
       workout was stronger after days with it, and without) and a word. */
    const hl = await p.evaluate(() => {
      const c = [...document.querySelectorAll('#view-train .tr-pg')].find((x) => /What helps/.test(x.querySelector('.tr-eyebrow').textContent));
      const rows = [...c.querySelectorAll('.tr-hl-row')];
      return { names: rows.map((r) => r.querySelector('.tr-hl-h span').textContent),
        bars: rows.map((r) => r.querySelectorAll('.tr-hl-bar').length), tags: rows.map((r) => r.querySelector('.tr-hl-tag').textContent),
        dots: c.querySelectorAll('.tr-pg-dots, .tr-lev-sure').length || /[\u25cf\u25cb]/.test(c.textContent), text: c.textContent };
    });
    t.ok('What helps your lifts has a row for each habit with workouts after it, sleep and protein among them',
      hl.names.includes('7+ hours of sleep') && hl.names.includes('Protein at target'), JSON.stringify(hl.names));
    t.ok('each row two bars, after days with it and without, and a word for what that means',
      hl.bars.every((n) => n === 2) && hl.tags.every((x) => /^(Helps|Went with weaker|No real difference|Too early to tell)$/.test(x)), JSON.stringify(hl.tags));
    t.ok('no dots anywhere in it', !hl.dots);
    t.ok('and it says these went together, not that one caused the other', /don’t prove cause/.test(hl.text));
    const viz = await p.evaluate(() => ({
      readiness: !!document.querySelector('#view-train .tr-readiness .tr-rd-badge'),
      wchart: !!document.querySelector('#view-train .tr-pg-wchart .tr-pg-wtrend'),
      hlbars: document.querySelectorAll('#view-train .tr-hl-bar').length,
      old: document.querySelectorAll('#view-train .tr-pg-cbar, #view-train .tr-pg-fchart, #view-train .tr-pg-schart, #view-train .tr-pg-dots').length,
    }));
    t.ok('renders the readiness banner, the pace chart and the habit bars, and none of the old dotted charts',
      viz.readiness && viz.wchart && viz.hlbars >= 4 && viz.old === 0, JSON.stringify(viz));
    t.ok('Simple shows no statistics', cs.every((c) => c.stats === 0));

    await p.click('[data-t="rvdeep"][data-v="1"]');
    await p.waitForTimeout(300);
    cs = await cards(p);
    t.ok('The math puts numbers under every card', cs.every((c) => c.stats > 0), cs.map((c) => c.stats).join(','));
    t.ok('the rate with its 95% interval', /lb\/wk/.test(cs[0].text) && /95% CI/.test(cs[0].text), cs[0].text);
    t.ok('and a gap is never shown without its n', /n = \d+/.test(cs[3].text), cs[3].text);

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
    await q.click('.tr-seg [data-v="progress"]').catch(() => {});
    await q.waitForTimeout(300);
    const empty = await q.evaluate(() => [...document.querySelectorAll('.tr-pg')].map((c) => !!c.querySelector('.tr-pg-wait')));
    t.ok('with nothing logged, each card says what it needs instead of drawing nothing', empty.length === 4 && empty.every(Boolean), JSON.stringify(empty));
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
      /of the way to 180 lb/.test(liveCards[0].text) && liveCards[3] && /Protein at target/.test(liveCards[3].text) && /7\+ hours of sleep/.test(liveCards[3].text),
      liveCards.map((c) => c.text).join(' || '));

    /* A workout keeps the bodyweight it used in its own unit. Blake's Keeping
       muscle drew weight up 137.8% (85.6 to 203.5): kilograms from workouts
       taken as pounds beside his weigh-ins. Four weeks lifted in kg with no
       weigh-in, then two weeks of weigh-ins in lb: the line stays near 200. */
    const k = await t.fresh({ viewport: { width: 390, height: 844 } });
    await k.clock.setFixedTime(new Date(2026, 9, 26, 7, 30, 0));
    await k.reload();
    await k.evaluate(SEED);
    await k.evaluate(() => {
      const T = JSON.parse(localStorage.getItem('bsc.train')), ws = JSON.parse(localStorage.getItem('bsc.macroWeights'));
      Object.values(T.wo).forEach((wo) => {
        if (wo.dk >= '2026-10-12') return;
        wo.u = 'kg'; wo.bw = Math.round((ws[wo.dk] || 202) / 2.20462 * 10) / 10;
        wo.x.forEach((x) => x.s.forEach((st) => { st.w = Math.round(st.w / 2.20462 * 2) / 2; }));
      });
      Object.keys(ws).forEach((d) => { if (d < '2026-10-12') delete ws[d]; });
      localStorage.setItem('bsc.train', JSON.stringify(T));
      localStorage.setItem('bsc.macroWeights', JSON.stringify(ws));
      localStorage.setItem('bsc.trainSpan', 'all');
    });
    await k.reload();
    await k.waitForTimeout(700);
    await k.click('.tab[data-view="train"]');
    await k.click('.tr-seg [data-v="progress"]');
    await k.waitForTimeout(300);
    const kg = await k.evaluate(() => {
      const c = [...document.querySelectorAll('#view-train .tr-pg')].find((x) => /Keeping muscle/.test(x.querySelector('.tr-eyebrow').textContent));
      const svg = c && c.querySelector('svg.tr-pg-mini');
      return c && { head: c.querySelector('.tr-pg-head2').textContent, ys: [...svg.querySelectorAll('text')].map((x) => +x.textContent.replace(/,/g, '')) };
    });
    t.ok('bodyweight a workout kept in kilograms is counted in pounds beside the weigh-ins, not as a 130% jump',
      kg && kg.ys.every((v) => v > 180 && v < 215) && !/gained (\d{2,}|[3-9])/.test(kg.head), JSON.stringify(kg));
  }
};
