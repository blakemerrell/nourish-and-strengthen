/* Today: what is done, at a glance, and a card is a door.
 *
 * Blake: "it is also hard for me to visually see that my workout is done,
 * and what meals i have eaten", then "even more simple... when done, it is
 * collapsed as well", and "i want to click on the eating card and have it
 * just take me to nourish. same with workout". So: the day's meals on the
 * Eating card, each ticked eaten from Today; eaten ones fold into one green
 * line; the calories and protein stay; a finished workout is one green card;
 * a tap on either card goes to its tab, and its own buttons still do their
 * own thing. With nothing planned, the Eating card says so. */
const { goDay, stepDay } = require('./fixtures/nourish.js');
const EVENING = new Date(2026, 9, 1, 18, 0, 0);     // a Thursday, 6 pm

async function at(t, setup) {
  const p = await t.fresh({ viewport: { width: 390, height: 844 } });
  await p.clock.setFixedTime(EVENING);
  await p.reload();
  await p.waitForTimeout(600);
  await p.evaluate(SETUP, setup.toString());
  await p.reload();
  await p.waitForTimeout(900);
  return p;
}
/* Run in the page, with the day handed over as source: a function sent to
   the page loses everything it closed over. */
const SETUP = (src) => {
  const days = (0, eval)('(' + src + ')');
  localStorage.setItem('sh.view', 'today'); localStorage.setItem('sh.viewAt', String(Date.now()));
  const p2 = (n) => (n < 10 ? '0' : '') + n, d0 = new Date(), k = d0.getFullYear() + '-' + p2(d0.getMonth() + 1) + '-' + p2(d0.getDate());
  localStorage.setItem('bsc.macroProfile', JSON.stringify({ sex: 'm', age: 43, ft: 5, inch: 11, lb: 190, act: 1.55, goal: 'cut1' }));
  localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 190, f: 70, c: 230 }));
  const R = window.RECIPES.filter((r) => r.macro && r.macro.kcal > 150);
  const day = days(R);
  if (day) localStorage.setItem('bsc.macroDays', JSON.stringify({ [k]: day }));
  const _ = window.Train._, ms = _.build({ goal: 'grow', dpw: 4, kit: 'gym', lvl: 1, acc: 4, pri: [] });
  ms.id = 'b'; ms.n = 'Fall block'; ms.at = Date.now() - 3 * 864e5;
  const wo = {};
  if (day && day.done) {
    const st = Date.now() - 42 * 60000;
    wo.w1 = { id: 'w1', n: 'Upper A', st: st, en: Date.now(), x: [] };
    delete day.done;
    localStorage.setItem('bsc.macroDays', JSON.stringify({ [k]: day }));
  }
  localStorage.setItem('bsc.train', JSON.stringify({ pr: { u: 'lb', qz: 1, lvl: 1, ld: [0, 1, 3, 4] }, act: 'b', ms: { b: ms }, cx: {}, ax: {}, wo: wo }));
};
const read = (p) => p.evaluate(() => {
  const c = document.querySelector('[data-card="eating"]');
  return {
    fold: (c.querySelector('.td-fold b') || {}).textContent || '',
    foldSub: (c.querySelector('.td-fold small') || {}).textContent || '',
    open: [...c.querySelectorAll('.td-meal')].map((m) => m.querySelector('.td-ms').textContent + ':' + m.querySelector('.td-kc').textContent + (m.querySelector('.td-tag') ? ':next' : '')),
    bars: [...c.querySelectorAll('.td-bar-t span:first-child')].map((x) => x.textContent),
    tab: (c.querySelector('.td-tab') || {}).textContent || '',
    title: (c.querySelector('.td-title') || {}).textContent || '',
  };
});

module.exports = {
  name: 'Today, done at a glance',
  async run(t) {
    const errs = [];
    /* ---- breakfast eaten, lunch, dinner and a snack still to go, the workout done ---- */
    let p = await at(t, ((R) => ({ b: [{ id: R[0].id, x: 1, eaten: 1 }], l: [{ id: R[1].id, x: 1, eaten: 0 }],
      d: [{ id: R[2].id, x: 1, eaten: 0 }], s: [{ id: R[3].id, x: 1, eaten: 0 }], done: 1 })));
    p.on('pageerror', (e) => errs.push(e.message));
    let s = await read(p);
    const want = await p.evaluate(() => window.Hive.today().eating.meals.map((m) => ({ n: m.n, kcal: Math.round(m.kcal).toLocaleString('en-US') })));
    t.ok('what is eaten folds into one green line, with its calories and protein',
      s.fold === 'Breakfast eaten' && new RegExp('^' + want[0].kcal + ' cal · \\d+ g protein$').test(s.foldSub), JSON.stringify(s));
    t.ok('the rest stay open, each with its calories, the first one next',
      s.open.join() === ['Lunch:' + want[1].kcal + ' cal:next', 'Dinner:' + want[2].kcal + ' cal', 'Snacks:' + want[3].kcal + ' cal'].join(), JSON.stringify(s.open));
    t.ok('the calories and protein stay on the card, and its corner says Nourish',
      s.bars.join() === 'Calories,Protein' && /^Nourish/.test(s.tab), JSON.stringify(s));

    /* Ticked from Today: eaten in Nourish too, and folded in with breakfast. */
    await p.click('[data-td="eat"][data-k="l"]');
    await p.waitForTimeout(300);
    s = await read(p);
    const ate = await p.evaluate(() => window.Hive.today().eating.meals.find((m) => m.k === 'l').eaten);
    t.ok('a tick marks the meal eaten, and it folds in: Breakfast and lunch eaten',
      ate && s.fold === 'Breakfast and lunch eaten' && s.open[0] === 'Dinner:' + want[2].kcal + ' cal:next', JSON.stringify(s));
    t.ok('and the tick did not leave Today', await p.evaluate(() => !document.getElementById('view-today').classList.contains('hide')));

    /* ---- the finished workout ---- */
    const w = await p.evaluate(() => {
      const c = document.querySelector('[data-card="workout"]');
      return c ? { done: c.classList.contains('td-fin'), label: c.querySelector('.td-label').textContent, line: (c.querySelector('.td-doneline') || {}).textContent,
        last: [...document.querySelectorAll('#todayRoot .td-card')].pop() === c, buttons: c.querySelectorAll('.btn-primary, .ghost').length } : null;
    });
    t.ok('a finished workout is one green card at the bottom: Workout done, its name and its minutes',
      w && w.done && w.label === 'Workout done' && /^Upper A · 42 min/.test(w.line) && w.last && w.buttons === 0, JSON.stringify(w));

    const lift = await p.evaluate(() => {
      const c = document.querySelector('[data-card="week"]');
      return c ? [...c.querySelectorAll('.td-mk')].filter((m) => m.classList.contains('td-done')).length : -1;
    });
    t.ok('and the week strip marks today’s lift done, a plain green dot', lift >= 1, String(lift));

    /* ---- a card is a door ---- */
    await p.click('[data-card="eating"] .td-big');
    await p.waitForTimeout(300);
    t.ok('a tap on the Eating card goes to Nourish', await p.evaluate(() => !document.getElementById('view-macros').classList.contains('hide')));
    await p.click('.tab[data-view="today"]');
    await p.waitForTimeout(300);
    await p.click('[data-card="workout"] .td-doneline');
    await p.waitForTimeout(300);
    t.ok('and on the finished workout, Strengthen', await p.evaluate(() => !document.getElementById('view-train').classList.contains('hide')));
    await p.click('.tab[data-view="today"]');
    await p.waitForTimeout(300);
    await p.click('[data-card="eating"] .td-fold');
    await p.waitForTimeout(300);
    t.ok('the green eaten line goes to Nourish too', await p.evaluate(() => !document.getElementById('view-macros').classList.contains('hide')));
    await p.context().close();

    /* ---- every meal eaten ---- */
    p = await at(t, ((R) => ({ b: [{ id: R[0].id, x: 1, eaten: 1 }, { id: R[4].id, x: 1, eaten: 1 }], l: [{ id: R[1].id, x: 1, eaten: 1 }],
      d: [{ id: R[2].id, x: 1, eaten: 1 }], s: [{ id: R[3].id, x: 1, eaten: 1 }] })));
    p.on('pageerror', (e) => errs.push(e.message));
    s = await read(p);
    t.ok('all four eaten: one green line, nothing left open, the numbers still there',
      s.fold === 'Breakfast, lunch, dinner and snacks eaten' && s.open.length === 0 && s.bars.length === 2, JSON.stringify(s));
    /* N4: deleting one of two eaten items on Breakfast keeps bsc.macroDone[k] set because all remaining slots/items are still eaten. */
    await p.click('.tab[data-view="macros"]');
    await p.waitForTimeout(250);
    await p.click('#macroFill');
    await p.waitForTimeout(200);
    await p.goBack();
    await p.waitForTimeout(150);
    await p.click('[data-mview="b"]');
    await p.waitForTimeout(150);
    await p.click('[data-mamt$="|b:1"]');
    await p.waitForTimeout(150);
    await p.click('[data-mdel="b:1"]');
    await p.waitForTimeout(200);
    const stillClosed = await p.evaluate(() => {
      const days = JSON.parse(localStorage.getItem('bsc.macroDays') || '{}');
      const done = JSON.parse(localStorage.getItem('bsc.macroDone') || '{}');
      const k = Object.keys(days)[0];
      return { closed: !!(done[k] > 0), bLen: ((days[k] || {}).b || []).length };
    });
    t.ok('deleting an extra eaten item when every meal remains 100% eaten keeps the day closed (N4)',
      stillClosed.closed && stillClosed.bLen === 1, JSON.stringify(stillClosed));
    await p.context().close();

    /* ---- nothing planned ---- */
    p = await at(t, (() => null));
    p.on('pageerror', (e) => errs.push(e.message));
    s = await read(p);
    const acts = await p.evaluate(() => [...document.querySelectorAll('[data-card="eating"] [data-td]')].map((b) => b.dataset.td).join());
    t.ok('nothing planned: the Eating card says so, with the numbers, Fill my day and Add food',
      s.title === 'Nothing planned for today' && s.bars.length === 2 && /fill/.test(acts) && /addfood/.test(acts), JSON.stringify({ s, acts }));
    /* Nourish left on yesterday: Today's Fill still fills today. */
    await p.click('.tab[data-view="macros"]');
    await p.waitForTimeout(300);
    await stepDay(p, -1);
    await p.waitForTimeout(150);
    await p.click('.tab[data-view="today"]');
    await p.waitForTimeout(300);
    await p.click('[data-card="eating"] [data-td="fill"]');
    await p.waitForTimeout(700);
    const filled = await p.evaluate(() => {
      const p2 = (n) => (n < 10 ? '0' : '') + n, d = new Date(), k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
      const y = new Date(d); y.setDate(d.getDate() - 1);
      const yk = y.getFullYear() + '-' + p2(y.getMonth() + 1) + '-' + p2(y.getDate());
      const days = JSON.parse(localStorage.getItem('bsc.macroDays') || '{}');
      const n = (o) => Object.keys(o || {}).reduce((t, sk) => t + (Array.isArray(o[sk]) ? o[sk].length : 0), 0);
      return { macros: !document.getElementById('view-macros').classList.contains('hide'), today: n(days[k]), yesterday: n(days[yk]) };
    });
    t.ok('and Fill my day fills today in Nourish, even with Nourish left on yesterday',
      filled.macros && filled.today > 0 && filled.yesterday === 0, JSON.stringify(filled));

    /* N2: pressing Try another repeatedly on Breakfast never oscillates back to an already-rejected recipe. */
    const readB0 = () => p.evaluate(() => {
      const days = JSON.parse(localStorage.getItem('bsc.macroDays') || '{}');
      const d = days[Object.keys(days)[0]] || {};
      return ((d.b || [])[0] || {}).id;
    });
    const b0 = await readB0();
    await p.click('[data-mtry="b"]');
    await p.waitForTimeout(200);
    const b1 = await readB0();
    await p.click('[data-mtry="b"]');
    await p.waitForTimeout(200);
    const b2 = await readB0();
    t.ok('Try another advances through distinct suggestions without oscillating A -> B -> A (N2)',
      b0 && b1 && b2 && b0 !== b1 && b1 !== b2 && b0 !== b2, JSON.stringify([b0, b1, b2]));
    await p.context().close();

    t.ok('no page errors', errs.length === 0, errs.join(' | '));
  },
};
