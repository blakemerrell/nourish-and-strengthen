/* Light it up, and the stats around it (Blake, 2026-11-01).
 *
 * "One of the main graphics that motivates me is seeing the body map. I want
 * to see the whole body light up green! Then I like to see that I'm on track
 * with my plan, then all the metrics showing me how my health metrics and
 * nutrition are all helping or hurting." And: "Add mini charts or spark
 * lines in some of the data boxes in Nourish." Shown drawn into the app
 * first; he chose all of it, the Nourish tiles only behind the week's button.
 *
 * Here: the map lit by the week's sets, its ring, what is left, a figure a
 * week and the streak; a week just finished staying on the map; the map by
 * recovery; a muscle tapped; the On track chips and sparklines; records by
 * name; Nourish's week in charts; and the small map on Today. Helping or
 * hurting is in tests/progress.test.js beside the longer view it is part of. */
const BLOCK = require('./fixtures/block-seed.js');
const FULL = [[0, 1], [1, 1], [2, 1], [3, 1]];

async function open(t, weeks, theme) {
  const p = await t.fresh({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, colorScheme: theme || 'light' });
  await p.evaluate(BLOCK, { weeks });
  await p.click('.tab[data-view="train"]');
  await p.click('[data-t="sub"][data-v="block"]');
  await p.waitForTimeout(200);
  return p;
}
const card = (p) => p.evaluate(() => {
  const c = document.querySelector('.tr-hm-card');
  return c && {
    head: (c.querySelector('.tr-lit-h b') || {}).textContent || '',
    ring: (c.querySelector('.tr-lit-ring text') || {}).textContent || '',
    next: [...c.querySelectorAll('.tr-lit-next span')].map((s) => s.textContent),
    figs: c.querySelectorAll('.tr-hm-pill .tr-hm-mini').length,
    big: c.querySelectorAll('.tr-hm-svg').length,
    lit: c.querySelectorAll('.tr-hm-svg .hm-hit').length,
    streak: (c.querySelector('.tr-lit-streak') || {}).textContent || '',
    all: c.classList.contains('all-lit'),
    title: (c.querySelector('.tr-title') || {}).textContent || ''
  };
});

module.exports = {
  name: 'Light it up: the body map going green, and the stats around it',
  async run(t) {
    /* ---- partway through a week ---- */
    let p = await open(t, [FULL, [[0, 1], [1, 0.6], [2, 1], [3, 1]], FULL, [[0, 1], [1, 1], [2, 0.7]]]);
    let c = await card(p);
    t.ok('the map says how many of the week’s muscles are lit, and the ring agrees',
      /^\d+ of \d+ muscles lit$/.test(c.head) && c.ring === c.head.replace(/^(\d+) of (\d+).*/, '$1/$2'), JSON.stringify(c));
    t.ok('the ones still to light up are named with the sets each needs', c.next.length > 0 && c.next.every((s) => /· \d+ more sets?$/.test(s)), c.next.join(' | '));
    t.ok('every block week reached carries a small figure of itself, outside the two big ones', c.figs === 4 && c.big === 2, JSON.stringify(c));
    t.ok('the week’s title stays where the review had it', /Week 4 muscle coverage/.test(c.title), c.title);
    // weeks 1 and 3 lit, week 2 not: the run is week 3 alone, and so was the best
    t.ok('and the streak counts whole weeks lit, broken by the one that was not', /1 week fully lit/.test(c.streak) && !/best is/.test(c.streak), c.streak);

    // a muscle tapped: its own sheet
    await p.click('.tr-mus-row[data-v="chest"]');
    await p.waitForTimeout(200);
    const sh = await p.evaluate(() => {
      const s = document.querySelector('#trainRoot .tr-mus-sheet');
      return s && { text: s.textContent, bars: s.querySelectorAll('.tr-mus-sets-svg rect').length, line: !!s.querySelector('.tr-spk-l'), lifts: s.querySelectorAll('.tr-mus-lifts li').length };
    });
    t.ok('a muscle in the list opens its sheet: sets week by week, a strength line, its lifts, how rested',
      sh && sh.bars === 4 && sh.line && sh.lifts >= 1 && /(ready|Resting)/.test(sh.text), JSON.stringify(sh));
    await p.click('#trainRoot .sheet-x');
    await p.waitForTimeout(100);
    t.ok('and a muscle on the figure is a way in too', await p.evaluate(() => !!document.querySelector('.tr-hm-card .tr-hm-svg g[data-mus="chest"][data-t="musopen"]')));

    // the map by recovery
    await p.click('[data-t="hmmode"][data-v="rec"]');
    await p.waitForTimeout(100);
    const rec = await p.evaluate(() => {
      const c2 = document.querySelector('.tr-hm-card');
      return { head: c2.querySelector('.tr-lit-h b').textContent, title: !!c2.querySelector('.tr-title'), pills: !!c2.querySelector('.tr-hm-pills'),
        rows: [...c2.querySelectorAll('.tr-mus-sets')].map((s) => s.textContent) };
    });
    t.ok('Recovery colours the same map by how rested each muscle is', /ready to train$/.test(rec.head) && rec.rows.every((r) => /^(ready ✓|in \d+ h)$/.test(r)), JSON.stringify(rec));
    t.ok('without the week’s title and weeks, which belong to the sets', !rec.title && !rec.pills);
    await p.click('[data-t="hmmode"][data-v="sets"]');

    // the week card: on track, and a sparkline under the numbers
    const wk = await p.evaluate(() => {
      const w = document.querySelector('.tr-week');
      return { chips: [...w.querySelectorAll('.tr-ot-chips span')].map((s) => s.textContent), spk: w.querySelectorAll('.tr-kpi-card .tr-spk').length };
    });
    t.ok('the week card says which parts of the plan are on track, as chips', wk.chips.some((x) => /Workouts/.test(x)) && wk.chips.every((x) => /^[✓✕] /.test(x)), wk.chips.join(' | '));
    t.ok('and the training and lifts boxes draw their week under the number', wk.spk >= 2, String(wk.spk));

    // Today: this week, small
    await p.click('.tab[data-view="today"]');
    await p.waitForTimeout(300);
    const td = await p.evaluate(() => {
      const l = document.querySelector('.td-card[data-card="workout"] .td-lit');
      return l && { say: l.textContent, figs: l.querySelectorAll('.tr-hm-mini').length, label: l.getAttribute('aria-label') };
    });
    t.ok('Today’s workout card shows this week’s body, front and back, and how many are lit',
      td && td.figs === 2 && /\d+ of \d+ muscles lit/.test(td.say) && /muscles lit this week/.test(td.label), JSON.stringify(td));
    await p.context().close();

    /* ---- a week just finished: the whole body, for two days ---- */
    p = await open(t, [FULL, FULL, FULL, [[0, 2], [1, 2], [2, 2], [3, 2]]], 'dark');
    c = await card(p);
    t.ok('the last workout of a week leaves the whole body lit on the map, not next week’s empty one',
      c.all && c.head === 'Whole body lit' && c.lit > 0 && /Week 4/.test(c.title), JSON.stringify(c));
    t.ok('with the run of whole weeks counted', /4 weeks/.test(c.streak), c.streak);
    t.ok('and nothing is wider than the phone', await p.evaluate(() => document.documentElement.scrollWidth <= 390));
    await p.click('.tab[data-view="today"]');
    await p.waitForTimeout(300);
    t.ok('Today says it too', /Whole body lit/.test(await p.evaluate(() => (document.querySelector('.td-lit') || {}).textContent || '')));

    // a saved workout that set records names them
    await p.click('.tab[data-view="train"]');
    await p.evaluate(() => {
      const T = JSON.parse(localStorage.getItem('bsc.train'));
      const ws = Object.values(T.wo).sort((a, b) => a.st - b.st), a = ws[ws.length - 1];
      a.x.forEach((x) => x.s.forEach((s) => { s.w += 40; }));
      localStorage.setItem('bsc.train', JSON.stringify(T));
      window.Train._.reload();
      window.Train._.state().S.justSaved = a.id;
      window.Train._.draw();
    });
    await p.waitForTimeout(200);
    const pr = await p.evaluate(() => {
      const b = document.querySelector('.tr-pr-party');
      return b && { head: b.querySelector('b').textContent, items: [...b.querySelectorAll('li')].map((l) => l.textContent) };
    });
    t.ok('a saved workout that set records names each one and what it beat',
      pr && /New record/.test(pr.head) && pr.items.length >= 1 && pr.items.every((x) => / · (heaviest|best est\. max|most reps)/.test(x)), JSON.stringify(pr));
    await p.context().close();

    /* ---- Nourish: the week in charts, behind its button ---- */
    const q = await t.fresh({ viewport: { width: 320, height: 700 } });
    await q.clock.setFixedTime(new Date(2026, 9, 25, 20, 0, 0));
    await q.reload();
    await q.evaluate(() => {
      localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 190, f: 70, c: 230 }));
      const ws = {}, am = {}, days = {};
      for (let i = 0; i < 7; i++) {
        const k = '2026-10-' + (19 + i);
        ws[k] = 200 - i * 0.2;
        am[k] = { sl: 6.5 + i * 0.25, sy: 6000 + i * 500 };
        days[k] = { l: [{ id: 'f:chicken_breast', x: 2, eaten: 1 }, { id: 'f:oats', x: 1, eaten: 1 }] };
      }
      localStorage.setItem('bsc.macroWeights', JSON.stringify(ws));
      localStorage.setItem('bsc.macroAm', JSON.stringify(am));
      localStorage.setItem('bsc.macroDays', JSON.stringify(days));
    });
    await q.reload();
    await q.waitForTimeout(600);
    await q.click('.tab[data-view="macros"]');
    await q.waitForTimeout(400);
    t.ok('My Day starts with the charts folded: one button under the week strip',
      await q.evaluate(() => !!document.querySelector('#macroWeekTiles [data-mwtiles][aria-expanded="false"]') && !document.querySelector('.mwt-tile')));
    await q.click('[data-mwtiles]');
    await q.waitForTimeout(300);
    const tl = await q.evaluate(() => [...document.querySelectorAll('.mwt-tile')].map((x) => ({ k: x.querySelector('.mwt-k').textContent, chart: !!x.querySelector('svg.mwt-sp'), s: x.querySelector('.mwt-s').textContent })));
    t.ok('open, six tiles: weight, calories, protein, sleep, steps, water', tl.map((x) => x.k).join() === 'Weight,Calories,Protein,Sleep,Steps,Water', JSON.stringify(tl));
    t.ok('each with its week drawn where there is one', tl.filter((x) => x.chart).length >= 5, JSON.stringify(tl));
    t.ok('and a line of what it means: sleep counts the nights at 7h+', /of \d+ nights at 7h\+/.test(tl[3].s), tl[3].s);
    t.ok('nothing runs off a 320 px phone', await q.evaluate(() => document.documentElement.scrollWidth <= 320));
    await q.reload();
    await q.waitForTimeout(500);
    await q.click('.tab[data-view="macros"]');
    await q.waitForTimeout(300);
    t.ok('and it stays open on this phone until folded again', await q.evaluate(() => document.querySelectorAll('.mwt-tile').length === 6));
  }
};
