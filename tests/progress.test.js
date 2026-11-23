/* Progress & Insights Hub: Overview · Body · Recovery · Lab (Blake, 2026-10-26, reorganized 2026-11-23).
 *
 * Keeps 100% of every chart, correlation, citation, and metric across focused lenses:
 *  - Overview: calm summary (This week card, muscle map, 3-row Insights directory, recovery checks) — zero chart wall or "PhD" jargon.
 *  - Body: On pace, Keeping muscle, Simple|The math, and Wheeler Scale & body chart shortcuts (2-way bridge with Trends).
 *  - Recovery: Readiness & coaching, Health Connect Biometrics Hub, and Training & recovery checks.
 *  - Lab: What helps your lifts, Muscles grown/lagging map, Simple|The math, and research citations (#trRefs). */
const SEED = require('./fixtures/progress-seed.js');
const txt = (p, sel) => p.evaluate((s) => (document.querySelector(s) || {}).textContent || '', sel);
const cards = (p) => p.evaluate(() => [...document.querySelectorAll('#view-train .tr-pg')].map((c) => ({
  eye: (c.querySelector('.tr-eyebrow') || {}).textContent, text: c.textContent, stats: c.querySelectorAll('.tr-pg-stats > div').length })));

module.exports = {
  name: 'Progress: 4-lens Insights Hub (Overview · Body · Recovery · Lab), Simple & The math',
  async run(t) {
    const errs = [];
    const p = await t.fresh({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    p.on('pageerror', (e) => errs.push(e.message));
    await p.clock.setFixedTime(new Date(2026, 9, 26, 7, 30, 0));
    await p.reload();
    await p.waitForTimeout(500);
    await p.evaluate(SEED);
    await p.reload();
    await p.waitForTimeout(900);
    await p.click('.tab[data-view="train"]');
    await p.waitForTimeout(500);
    await p.click('.tr-seg [data-v="progress"]');
    await p.waitForTimeout(400);

    const tabs = await p.evaluate(() => [...document.querySelectorAll('.tr-pg-tabs [data-t="pgtab"]')].map((b) => b.textContent + ':' + b.getAttribute('aria-pressed')));
    const segs = await p.evaluate(() => [...document.querySelectorAll('[data-t="rvspan"]')].map((b) => b.textContent + ':' + b.getAttribute('aria-pressed')));
    t.ok('Progress opens on Overview with Body, Recovery and Lab tabs', tabs.join('|') === 'Overview:true|Body:false|Recovery:false|Lab:false', tabs.join('|'));
    t.ok('and This week with This block and All time beside it', segs.join('|') === 'This week:true|This block:false|All time:false', segs.join('|'));
    t.ok('Overview shows the week card, body map, 3-row Insights directory, and zero chart wall or PhD button', await p.evaluate(() =>
      !!document.querySelector('#view-train .tr-week') &&
      document.querySelectorAll('#view-train .tr-hm-card').length === 1 &&
      document.querySelectorAll('#view-train .tr-pg-dirb').length === 3 &&
      !document.querySelector('#view-train .tr-pg') &&
      !document.querySelector('#view-train [data-t="pgexpall"]')));

    /* ---- Body lens (This block) ---- */
    await p.click('[data-t="rvspan"][data-v="block"]');
    await p.waitForTimeout(250);
    t.ok('with no block running it says it is the last six weeks', /No block running/.test(await txt(p, '#view-train .tr-pg-head')));
    await p.click('.tr-pg-dirb[data-v="body"]');
    await p.waitForTimeout(300);

    let bcs = await cards(p);
    t.ok('Body shows On pace and Keeping muscle in Simple mode',
      bcs.map((c) => c.eye).join('|') === 'On pace|Keeping muscle' && bcs.every((c) => c.stats === 0), bcs.map((c) => c.eye).join('|'));
    t.ok('On pace says how far along, and when, in a sentence', /of the way to 180 lb/.test(bcs[0].text) && /get there around/.test(bcs[0].text), bcs[0].text);
    t.ok('Keeping muscle draws weight against strength, and says what it means',
      /Weight is going down and strength is going up/.test(bcs[1].text) && await p.evaluate(() => !!document.querySelector('.tr-pg .tr-pg-w') && !!document.querySelector('.tr-pg .tr-pg-s')), bcs[1].text);
    const km = await p.evaluate(() => {
      const c = [...document.querySelectorAll('#view-train .tr-pg')].find((x) => /Keeping muscle/.test(x.querySelector('.tr-eyebrow').textContent));
      return { head: (c.querySelector('.tr-pg-head2') || {}).textContent || '', charts: c.querySelectorAll('svg.tr-pg-mini').length,
        wpts: c.querySelectorAll('.tr-pg-w-dot').length, weeks: Math.max(1, Math.round((Date.now() - new Date(2026, 8, 14)) / 6048e5)),
        lbl: [...c.querySelectorAll('.tr-pg-mlbl b')].map((b) => b.textContent) };
    });
    t.ok('it says both in a headline, then draws weight and strength as two small charts, a point a week',
      /^Strength (up|down|holding)/.test(km.head) && km.charts === 2 && km.wpts >= 2 && km.wpts <= km.weeks + 1, JSON.stringify(km));
    t.ok('weight in pounds, strength as a percent of the start', /^\d[\d,.]* lb$/.test(km.lbl[0]) && /%$/.test(km.lbl[1]), km.lbl.join(' | '));
    t.ok('Body renders the pace trend SVG and Wheeler Trends shortcut buttons', await p.evaluate(() =>
      !!document.querySelector('#view-train .tr-pg-wchart .tr-pg-wtrend') &&
      document.querySelectorAll('#view-train .tr-pg-tbtn').length === 5));

    await p.click('[data-t="rvdeep"][data-v="1"]');
    await p.waitForTimeout(250);
    bcs = await cards(p);
    t.ok('The math puts numbers under Body cards with the 95% rate interval',
      bcs.every((c) => c.stats > 0) && /lb\/wk/.test(bcs[0].text) && /95% CI/.test(bcs[0].text), bcs[0].text);

    // 2-way bridge between Train Body lens and Eat Trends modal
    await p.click('[data-t="opentrends"][data-v="weight"]');
    await p.waitForTimeout(250);
    const trendsOpen = await p.evaluate(() => !!document.querySelector('#modalRoot .mc-sheet'));
    t.ok('tapping Weight trend in Body opens the Wheeler Trends chart sheet', trendsOpen);
    await p.click('#modalRoot [data-mchartgo="body"]');
    await p.waitForTimeout(300);
    const returnedToBody = await p.evaluate(() =>
      !document.querySelector('#modalRoot .mc-sheet') &&
      (document.querySelector('[data-t="pgtab"][data-v="body"]') || {}).getAttribute('aria-pressed') === 'true');
    t.ok('tapping "Open Progress & Lab in Train" closes Trends and returns cleanly to Progress Body', returnedToBody);

    /* ---- Recovery lens ---- */
    await p.click('[data-t="pgtab"][data-v="recovery"]');
    await p.waitForTimeout(250);
    t.ok('Recovery shows readiness coaching banner and recovery checks', await p.evaluate(() =>
      !!document.querySelector('#view-train .tr-readiness .tr-rd-badge') && !!document.getElementById('trRefs')));

    /* ---- Lab lens ---- */
    await p.click('[data-t="pgtab"][data-v="lab"]');
    await p.waitForTimeout(250);
    const lcs = await cards(p);
    t.ok('Lab shows What helps your lifts and Muscles cards with The math active',
      lcs.map((c) => c.eye).join('|') === 'What helps your lifts|Muscles' && lcs.every((c) => c.stats > 0) && /n = \d+/.test(lcs[0].text),
      lcs.map((c) => c.eye + ':' + c.stats).join('|'));
    t.ok('Muscles colours the body map by how the lifts moved', await p.evaluate(() =>
      document.querySelectorAll('.tr-pg .tr-hm-svg .pg-up').length > 0 && document.querySelectorAll('.tr-pg .tr-hm-svg .pg-down').length > 0));
    t.ok('and names the one slipping: the overhead press is front delts', /Front delts slipped/.test(lcs[1].text), lcs[1].text);
    t.ok('the list of every muscle is folded away, a tap from the map', await p.evaluate(() => {
      const d = document.querySelector('.tr-pg details.tr-pg-more');
      return !!d && !d.open && /^See all \d+ muscles$/.test(d.querySelector('summary').textContent) && d.querySelectorAll('.tr-pg-chip').length > 0;
    }));
    const hl = await p.evaluate(() => {
      const c = [...document.querySelectorAll('#view-train .tr-pg')].find((x) => /What helps/.test(x.querySelector('.tr-eyebrow').textContent));
      const rows = [...c.querySelectorAll('.tr-hl-row')];
      return { names: rows.map((r) => r.querySelector('.tr-hl-h span').textContent),
        bars: rows.map((r) => r.querySelectorAll('.tr-hl-bar').length), tags: rows.map((r) => r.querySelector('.tr-hl-tag').textContent),
        dots: c.querySelectorAll('.tr-pg-dots, .tr-lev-sure').length || /[\u25cf\u25cb]/.test(c.textContent), text: c.textContent };
    });
    t.ok('What helps your lifts has a row for each habit with workouts after it, sleep and protein among them',
      hl.names.includes('7+ hours of sleep') && hl.names.includes('Protein at target'), JSON.stringify(hl.names));
    t.ok('each row two bars, after days with it and without, and a word for what that means, with no dots',
      hl.bars.every((n) => n === 2) && hl.tags.every((x) => /^(Helps|Went with weaker|No real difference|Too early to tell)$/.test(x)) && !hl.dots,
      JSON.stringify(hl.tags));
    t.ok('and it says these went together, not that one caused the other', /don’t prove cause/.test(hl.text));

    await p.click('[data-t="rvspan"][data-v="all"]');
    await p.waitForTimeout(300);
    t.ok('All time starts at the first day anything was logged', /Since Sep 14/.test(await txt(p, '#view-train .tr-pg-head')), await txt(p, '#view-train .tr-pg-head'));

    await p.reload();
    await p.waitForTimeout(800);
    await p.click('.tab[data-view="train"]');
    await p.waitForTimeout(400);
    t.ok('the span is remembered on this phone', await p.evaluate(() =>
      (document.querySelector('[data-t="rvspan"][aria-pressed="true"]') || {}).textContent === 'All time'));

    /* ---- Empty state & 320px light + dark layout audit across all 4 tabs ---- */
    const q = await t.fresh({ viewport: { width: 320, height: 700 } });
    q.on('pageerror', (e) => errs.push(e.message));
    await q.evaluate(() => localStorage.setItem('bsc.trainSpan', 'block'));
    await q.reload();
    await q.waitForTimeout(700);
    await q.click('.tab[data-view="train"]');
    await q.waitForTimeout(400);
    await q.click('.tr-seg [data-v="progress"]').catch(() => {});
    await q.waitForTimeout(300);

    for (const scheme of ['light', 'dark']) {
      await q.emulateMedia({ colorScheme: scheme });
      for (const tab of ['overview', 'body', 'recovery', 'lab']) {
        await q.click('.tr-pg-tabs [data-t="pgtab"][data-v="' + tab + '"]');
        await q.waitForTimeout(180);
        const audit = await q.evaluate(() => {
          const btns = [...document.querySelectorAll('#trSnapshotCard .tr-pg-tabs button, #trSnapshotCard .tr-pg-seg button, #trSnapshotCard .tr-pg-dirb, #trSnapshotCard .tr-pg-tbtn')];
          const minH = btns.length ? Math.min.apply(null, btns.map((b) => Math.round(b.getBoundingClientRect().height))) : 0;
          const minFont = btns.length ? Math.min.apply(null, btns.map((b) => parseFloat(getComputedStyle(b).fontSize))) : 0;
          const waits = [...document.querySelectorAll('#view-train .tr-pg')].map((c) => !!c.querySelector('.tr-pg-wait'));
          return {
            over: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            minH, minFont, waits, nBtns: btns.length,
          };
        });
        t.ok('320px ' + scheme + ' (' + tab + '): 0px overflow, >=44px controls, >=13px font',
          audit.over <= 0 && audit.nBtns >= 4 && audit.minH >= 44 && audit.minFont >= 12.95 &&
          ((tab === 'body' || tab === 'lab') ? (audit.waits.length === 2 && audit.waits.every(Boolean)) : true),
          JSON.stringify(audit));
      }
    }

    // when remote database records arrive while viewing Progress, cards redraw live
    await q.setViewportSize({ width: 390, height: 844 });
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
    await q.click('[data-t="pgtab"][data-v="body"]');
    await q.waitForTimeout(150);
    const liveBody = await cards(q);
    await q.click('[data-t="pgtab"][data-v="lab"]');
    await q.waitForTimeout(150);
    const liveLab = await cards(q);
    t.ok('and when database records sync in, Body and Lab automatically redraw with the live stats',
      liveBody[0] && /of the way to 180 lb/.test(liveBody[0].text) &&
      liveLab[0] && /Protein at target/.test(liveLab[0].text) && /7\+ hours of sleep/.test(liveLab[0].text),
      JSON.stringify({ body: liveBody[0], lab: liveLab[0] }));

    /* A workout keeps the bodyweight it used in its own unit. */
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
    await k.waitForTimeout(250);
    await k.click('[data-t="pgtab"][data-v="body"]');
    await k.waitForTimeout(250);
    const kg = await k.evaluate(() => {
      const c = [...document.querySelectorAll('#view-train .tr-pg')].find((x) => /Keeping muscle/.test(x.querySelector('.tr-eyebrow').textContent));
      const svg = c && c.querySelector('svg.tr-pg-mini');
      return c && { head: c.querySelector('.tr-pg-head2').textContent, ys: [...svg.querySelectorAll('text')].map((x) => +x.textContent.replace(/,/g, '')) };
    });
    t.ok('bodyweight a workout kept in kilograms is counted in pounds beside the weigh-ins, not as a 130% jump',
      kg && kg.ys.every((v) => v > 180 && v < 215) && !/gained (\d{2,}|[3-9])/.test(kg.head), JSON.stringify(kg));
    t.ok('zero page errors in Progress suite', errs.length === 0, JSON.stringify(errs));
  }
};
