/* Today: the one screen a day is run from.
 *
 * Blake, on who it is for: "a heavy user who loves to track food and eat
 * clean and workout... and a busy mom wanting to eat well, and get a simple
 * workout in... and anyone in between." It shows what Plan, Nourish,
 * Strengthen and the list already hold, ordered by the clock, and every
 * button is a door into the full tab. Expectations are read off the app's
 * own data (window.Hive.today(), window.Train.today()), never typed in. */
const { openSync } = require('./fixtures/nourish.js');
const MORNING = new Date(2026, 9, 1, 9, 0, 0);     // a Thursday
const EVENING = new Date(2026, 9, 1, 16, 10, 0);

async function at(t, when, setup) {
  const p = await t.fresh({ viewport: { width: 390, height: 844 } });
  await p.clock.setFixedTime(when);
  await p.reload();
  await p.waitForTimeout(700);
  if (setup) {
    await p.evaluate(setup);
    await p.reload();
    await p.waitForTimeout(800);
  }
  return p;
}
const look = (p) => p.evaluate(() => ({
  view: (document.querySelector('.tab[aria-selected="true"]') || {}).dataset.view,
  first: (document.querySelector('.tab') || {}).dataset.view,
  h: (document.querySelector('#todayRoot h1') || {}).textContent,
  date: (document.querySelector('#todayRoot .step-k') || {}).textContent,
  cards: [...document.querySelectorAll('#todayRoot .td-card')].map((c) => c.dataset.card),
  primary: [...document.querySelectorAll('#todayRoot .btn-primary')].map((b) => b.closest('.td-card').dataset.card),
  titles: [...document.querySelectorAll('#todayRoot .td-title')].map((x) => x.textContent),
}));

module.exports = {
  name: 'Today',
  async run(t) {
    /* ---- a phone that has never been here ---- */
    let p = await at(t, MORNING);
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    let s = await look(p);
    t.ok('a new phone opens on Today, the first tab', s.view === 'today' && s.first === 'today' && s.h === 'Today', JSON.stringify(s));
    t.ok('dated in words: Thursday · October 1', s.date === 'Thursday · October 1', s.date);
    t.ok('in the morning: eating, then the workout, then dinners', s.cards.join() === 'eating,workout,tonight', JSON.stringify(s.cards));
    t.ok('one main button, on the first card', s.primary.join() === 'eating', JSON.stringify(s.primary));
    t.ok('nothing set up says what to set up, with no empty week strip',
      s.titles.join('|') === 'Set your numbers|Find your program|Plan this week’s dinners' && !s.cards.includes('week'), JSON.stringify(s.titles));

    // the doors
    await p.click('#todayRoot [data-td="planweek"]');
    await p.waitForTimeout(300);
    let d = await p.evaluate(() => ({ view: document.querySelector('.tab[aria-selected="true"]').dataset.view, pw: !!document.querySelector('[data-pwq]') }));
    t.ok('Plan my week opens Plan with Plan my week up', d.view === 'plan' && d.pw, JSON.stringify(d));
    await p.click('.sheet-x');
    await p.waitForTimeout(250);
    await p.click('.tab[data-view="today"]');
    await p.click('#todayRoot [data-td="train"]');
    await p.waitForTimeout(250);
    d = await p.evaluate(() => document.querySelector('.tab[aria-selected="true"]').dataset.view);
    t.ok('Find my program opens Strengthen', d === 'train', d);
    await p.click('.tab[data-view="today"]');
    await p.click('#todayRoot [data-td="numbers"]');
    await p.waitForTimeout(300);
    d = await p.evaluate(() => document.querySelector('.tab[aria-selected="true"]').dataset.view);
    t.ok('Set my numbers opens Nourish', d === 'macros', d);
    await p.context().close();

    /* ---- the evening, with dinners planned ---- */
    p = await at(t, EVENING, () => {
      localStorage.setItem('sh.view', 'today'); localStorage.setItem('sh.viewAt', String(Date.now()));
      const S = window.Store, din = window.RECIPES.filter((r) => /^(Salsa Chicken & Bean Bowls|Taco Pasta Skillet)$/.test(r.name))
        .sort((a, b) => a.name.localeCompare(b.name));
      S.setOpt('setup', true);
      S.addToDay(din[0].id, 'thu', 2); S.addToDay(din[0].id, 'fri', 1, true); S.addToDay(din[1].id, 'sat', 1);
    });
    p.on('pageerror', (e) => errs.push(e.message));
    s = await look(p);
    const H = await p.evaluate(() => { const h = window.Hive.today(); return { tonight: h.tonight, next: h.next, shop: h.shop }; });
    t.ok('from mid-afternoon, tonight’s dinner comes first and holds the main button',
      s.cards[0] === 'tonight' && s.primary.join() === 'tonight' && s.titles[0] === H.tonight.name, JSON.stringify(s));
    const tn = await p.evaluate(() => ({
      facts: (document.querySelector('[data-card="tonight"] .td-facts') || {}).textContent || '',
      next: (document.querySelector('[data-card="tonight"] .td-next') || {}).textContent || '',
    }));
    t.ok('it says it is cooked double, and what the next nights are, leftovers included',
      /cooked ×2/.test(tn.facts) && tn.next === H.next.map((n) => n.day + ': ' + n.name).join(' · ') && /Friday: leftovers/.test(tn.next), JSON.stringify(tn));
    const shopTxt = await p.evaluate(() => (document.querySelector('[data-card="shop"]') || {}).textContent || '');
    t.ok('the list, in a line: what is left to buy and what comes from the storehouse',
      H.shop.items > 0 && (H.shop.src ? shopTxt.indexOf(H.shop.src + ' from the storehouse') >= 0 : true), shopTxt);
    t.ok('the week strip shows the dinners planned', await p.evaluate(() => document.querySelectorAll('[data-card="week"] .td-now, [data-card="week"] .td-plan').length >= 3));
    // Cook it opens the recipe
    await p.click('[data-card="tonight"] [data-td="open"]');
    await p.waitForTimeout(400);
    const sheet = await p.evaluate(() => ((document.querySelector('.sheet .sheet-name, .sheet h2') || {}).textContent || ''));
    t.ok('Cook it opens the recipe', sheet.indexOf(H.tonight.name) >= 0, sheet);
    await p.click('.sheet-x');
    await p.waitForTimeout(300);
    // swap: a different dinner, still cooked double, its leftovers night with it
    await p.click('[data-card="tonight"] [data-td="swap"]');
    await p.waitForTimeout(300);
    const sw = await p.evaluate(() => ({ thu: window.Store.day('thu'), fri: window.Store.day('fri'), title: document.querySelector('[data-card="tonight"] .td-title').textContent }));
    t.ok('↻ swaps tonight by Plan’s rules: a new dinner, cooked double, and tomorrow’s leftovers follow it',
      sw.thu.length === 1 && String(sw.thu[0].id) !== String(H.tonight.id) && sw.thu[0].x === 2 &&
      sw.fri.length === 1 && sw.fri[0].id === sw.thu[0].id && sw.fri[0].lo, JSON.stringify(sw));
    // buying it all: the Walmart cart is on Today too
    await p.evaluate(() => window.Store.setOpt('store', false));
    await p.waitForTimeout(300);
    const wm = await p.evaluate(() => { const a = document.querySelector('[data-card="shop"] a.wm-btn'); return a ? { href: a.href, txt: a.textContent } : null; });
    t.ok('buying everything, the Walmart cart button is on Today, filled', !!wm && /walmart\.com\/sc\/cart\/addToCart\?items=/.test(wm.href) && /to Walmart cart/.test(wm.txt), JSON.stringify(wm));
    /* Cook it marked nothing done, and the card asked all evening. Cooked
       it folds it to one line, at the bottom, for the rest of the day; it is
       the household's word (Store.cooked, on the week), and it asks how it
       was. */
    const tname = await p.evaluate(() => document.querySelector('[data-card="tonight"] .td-title').textContent);
    await p.click('[data-card="tonight"] [data-td="cooked"]');
    await p.waitForTimeout(250);
    const asked = await p.evaluate(() => ({ eyebrow: (document.querySelector('.td-sheet .sheet-eyebrow') || {}).textContent,
      rates: [...document.querySelectorAll('[data-tdrate]')].map((b) => b.textContent).join() }));
    t.ok('Cooked it asks how it was: Favourite, Good, Not again', asked.eyebrow === 'Dinner cooked' && /Favourite.*Good.*Not again/.test(asked.rates), JSON.stringify(asked));
    await p.click('.td-sheet [data-tdrate="2"]');
    await p.click('.td-sheet .td-done-btn');
    await p.waitForTimeout(250);
    const folded = async () => {
      const l = await look(p);
      return Object.assign(l, await p.evaluate(() => {
        const c = document.querySelector('[data-card="tonight"]');
        return { fin: !!(c && c.classList.contains('td-fin')), label: c ? c.querySelector('.td-label').textContent : '',
          line: c ? (c.querySelector('.td-doneline') || {}).textContent : '', btns: c ? c.querySelectorAll('button').length : -1,
          shared: window.Store.cooked(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date().getDay()]) };
      }));
    };
    let ck = await folded();
    t.ok('Cooked it folds tonight to one done line at the bottom, said for the household, with the rating; the main button moves on',
      ck.fin && ck.label === 'Dinner cooked' && ck.line === tname + ' · ★ favourite' && ck.btns === 1 && ck.cards[ck.cards.length - 1] === 'tonight' &&
      ck.primary.length === 1 && ck.primary[0] !== 'tonight' && ck.shared, JSON.stringify(ck));
    await p.reload();
    await p.waitForTimeout(700);
    ck = await folded();
    t.ok('and stays folded the rest of the evening', ck.fin && ck.line === tname + ' · ★ favourite', JSON.stringify(ck));
    await p.clock.setFixedTime(new Date(2026, 9, 2, 17, 0, 0));
    await p.reload();
    await p.waitForTimeout(700);
    ck = await folded();
    t.ok('the next day it asks again', !ck.fin && ck.cards[0] === 'tonight' && !ck.shared, JSON.stringify(ck));
    await p.context().close();

    /* ---- the morning, with a plan to eat to and a block to train ---- */
    p = await at(t, MORNING, () => {
      localStorage.setItem('sh.view', 'today'); localStorage.setItem('sh.viewAt', String(Date.now()));
      const p2 = (n) => (n < 10 ? '0' : '') + n, d0 = new Date(), k = d0.getFullYear() + '-' + p2(d0.getMonth() + 1) + '-' + p2(d0.getDate());
      localStorage.setItem('bsc.macroProfile', JSON.stringify({ sex: 'm', age: 43, ft: 5, inch: 11, lb: 190, act: 1.55, goal: 'cut1' }));
      localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 190, f: 70, c: 230 }));
      localStorage.setItem('bsc.macroDays', JSON.stringify({ [k]: { b: [{ id: 1, x: 1, eaten: 1 }] } }));
      const _ = window.Train._, ms = _.build({ goal: 'grow', dpw: 4, kit: 'gym', lvl: 1, acc: 4, pri: [] });
      ms.id = 'b'; ms.n = 'Fall block'; ms.at = Date.now() - 3 * 864e5;
      localStorage.setItem('bsc.train', JSON.stringify({ pr: { u: 'lb', qz: 1, lvl: 1, ld: [0, 1, 3, 4] }, act: 'b', ms: { b: ms }, cx: {}, ax: {}, wo: {} }));
    });
    p.on('pageerror', (e) => errs.push(e.message));
    const E = await p.evaluate(() => ({ e: window.Hive.today().eating, w: window.Train.today() }));
    const eat = await p.evaluate(() => ({
      big: (document.querySelector('[data-card="eating"] .td-big b') || {}).textContent,
      meta: (document.querySelector('[data-card="eating"] .td-lift') || {}).textContent || '',
      bars: [...document.querySelectorAll('[data-card="eating"] .td-bar-t span:last-child')].map((x) => x.textContent),
    }));
    const fmt = (n) => Math.round(n).toLocaleString('en-US');
    t.ok('eating says what is left today, from the day’s own target',
      eat.big === fmt(E.e.kcal.want - E.e.kcal.have) && eat.bars[0] === fmt(E.e.kcal.have) + ' of ' + fmt(E.e.kcal.want) &&
      eat.bars[1] === fmt(E.e.p.have) + ' of ' + fmt(E.e.p.want) + ' g', JSON.stringify(eat));
    t.ok('and says when it is a lifting day', (eat.meta === 'Lifting day') === !!E.e.training, eat.meta + ' / ' + E.e.training);
    const wk = await p.evaluate(() => ({
      title: (document.querySelector('[data-card="workout"] .td-title') || {}).textContent,
      lifts: document.querySelectorAll('[data-card="workout"] .td-lifts li:not(.td-more)').length,
      facts: (document.querySelector('[data-card="workout"] .td-facts') || {}).textContent || '',
      tab: (document.querySelector('[data-card="workout"] .td-tab') || {}).textContent || '',
    }));
    t.ok('the workout is the block’s next session, by name, with its lifts and its week', wk.title === E.w.name && wk.lifts === Math.min(5, E.w.lifts.length) &&
      wk.facts.indexOf(E.w.week) === 0 && /^Strengthen/.test(wk.tab), JSON.stringify(wk));
    await p.click('[data-card="workout"] [data-td="start"]');
    await p.waitForTimeout(400);
    const st = await p.evaluate(() => ({ view: document.querySelector('.tab[aria-selected="true"]').dataset.view, live: !!window.Train._.state().LIVE }));
    t.ok('Start starts that session, in Strengthen', st.view === 'train' && st.live, JSON.stringify(st));
    // a workout is full screen; made small, the tabs are back
    if (await p.$('#trTop:not(.hide) [data-t="minim"]')) await p.click('#trTop [data-t="minim"]');
    await p.click('.tab[data-view="today"]');
    await p.waitForTimeout(250);
    t.ok('and Today then says a workout is going', (await p.evaluate(() => document.querySelector('[data-card="workout"] .td-title').textContent)) === 'A workout is going');
    await p.context().close();

    /* ---- a rest day: something easy, not another session ----
       Blake: "If it is a rest day, maybe add some suggested activity. 30 min
       walk. Golf, yoga, whatever... besides sneak in another workout." */
    p = await at(t, MORNING, () => {
      localStorage.setItem('sh.view', 'today'); localStorage.setItem('sh.viewAt', String(Date.now()));
      const _ = window.Train._, ms = _.build({ goal: 'grow', dpw: 2, kit: 'gym', lvl: 1, acc: 4, pri: [] });
      ms.id = 'b'; ms.n = 'Fall block'; ms.at = Date.now() - 3 * 864e5;
      localStorage.setItem('bsc.train', JSON.stringify({ pr: { u: 'lb', qz: 1, lvl: 1, ld: [0, 2], hab: ['golfw'] }, act: 'b', ms: { b: ms }, cx: {}, ax: {}, wo: {} }));
    });
    p.on('pageerror', (e) => errs.push(e.message));
    const rest = await p.evaluate(() => ({ w: window.Train.today(), title: (document.querySelector('[data-card="workout"] .td-title') || {}).textContent,
      label: (document.querySelector('[data-card="workout"] .td-label') || {}).textContent,
      sugg: [...document.querySelectorAll('[data-card="workout"] [data-td="act"]')].map((b) => b.dataset.k).join(),
      next: (document.querySelector('[data-card="workout"] .td-next') || {}).textContent || '',
      mins: (document.querySelector('[data-card="workout"] .td-bar-t') || {}).textContent || '',
      start: !!document.querySelector('[data-card="workout"] [data-td="start"]') }));
    t.ok('on a Thursday with Monday and Wednesday the lifting days, Today says Rest day: something easy, and offers no Start',
      rest.w.due > 0 && rest.label === 'Workout · rest day' && rest.title === 'Rest day: something easy' && !rest.start, JSON.stringify(rest));
    t.ok('a walk first, then your own sport, then yoga and a ride', rest.sugg === 'walk,golfw,yoga,cycle', rest.sugg);
    t.ok('with the week’s active minutes and the next lift named', /^Active minutes this week0 of 150$/.test(rest.mins) && rest.next === 'Next lift: ' + rest.w.name + ', Monday', JSON.stringify(rest));
    await p.click('[data-card="workout"] [data-td="act"][data-k="walk"]');
    await p.waitForTimeout(300);
    const walked = await p.evaluate(() => {
      const c = document.querySelector('[data-card="workout"]');
      const ax = window.Train._.state().T.ax, all = Object.keys(ax).map((k) => ax[k]);
      return { logged: all.length === 1 && all[0].k === 'walk' && all[0].min === 30, fin: c.classList.contains('td-fin'), label: c.querySelector('.td-label').textContent,
        line: (c.querySelector('.td-doneline') || {}).textContent, small: (c.querySelector('.td-small') || {}).textContent,
        last: [...document.querySelectorAll('#todayRoot .td-card')].pop() === c };
    });
    t.ok('a tap logs a 30-minute walk in Strengthen, and the card folds green to the bottom: Rest day, Walking 30 min, the week’s minutes',
      walked.logged && walked.fin && walked.label === 'Rest day' && walked.line === 'Walking 30 min' && /30 of 150 active minutes/.test(walked.small) && walked.last, JSON.stringify(walked));
    await p.click('[data-card="workout"] [data-td="actedit"]');
    await p.waitForTimeout(300);
    t.ok('Change it opens that activity in Strengthen', await p.evaluate(() => !document.getElementById('view-train').classList.contains('hide') && !!document.querySelector('#trainRoot .sheet')));
    await p.context().close();

    /* ---- Today is about today ---- */
    p = await at(t, EVENING, () => {
      localStorage.setItem('sh.view', 'today'); localStorage.setItem('sh.viewAt', String(Date.now()));
      localStorage.setItem('bsc.macroProfile', JSON.stringify({ sex: 'm', age: 43, ft: 5, inch: 11, lb: 190, act: 1.55, goal: 'cut1' }));
      localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 190, f: 70, c: 230 }));
    });
    p.on('pageerror', (e) => errs.push(e.message));
    // Nourish parked on yesterday; a door from Today opens on today
    await p.click('.tab[data-view="macros"]');
    await p.waitForTimeout(300);
    await p.click('[data-mweek="2026-09-30"]');
    await p.waitForTimeout(300);
    const parked = await p.evaluate(() => document.querySelector('[data-mweek][aria-pressed="true"]').dataset.mweek);
    await p.click('.tab[data-view="today"]');
    await p.waitForTimeout(300);
    await p.click('[data-card="eating"] [data-td="addfood"]');
    await p.waitForTimeout(400);
    const back = await p.evaluate(() => ({ day: document.querySelector('[data-mweek][aria-pressed="true"]').dataset.mweek, view: document.querySelector('.tab[aria-selected="true"]').dataset.view, picker: !!document.getElementById('mpFind') }));
    t.ok('Nourish parked on yesterday, Add food from Today opens the picker on today', parked === '2026-09-30' && back.view === 'macros' && back.day === '2026-10-01' && back.picker, JSON.stringify({ parked, back }));
    await p.keyboard.press('Escape');
    await p.waitForTimeout(200);
    await p.click('.tab[data-view="today"]');
    await p.waitForTimeout(200);
    await p.click('[data-card="eating"] [data-td="eatout"]');
    await p.waitForTimeout(400);
    const eatOut = await p.evaluate(() => ({
      view: document.querySelector('.tab[aria-selected="true"]').dataset.view,
      shelf: ((document.querySelector('[data-mpshelf][aria-pressed="true"]') || {}).dataset || {}).mpshelf,
      kinds: [...document.querySelectorAll('#mpSpots [data-mpkind]')].map((b) => b.dataset.mpkind).join(),
      spotsCount: document.querySelectorAll('#mpSpots [data-mpspot]').length,
    }));
    t.ok('Eating out from Today opens the picker directly on the Eating out shelf with restaurant group chips',
      eatOut.view === 'macros' && eatOut.shelf === 'eatout' && eatOut.kinds === 'fast,sit,grab' && eatOut.spotsCount > 20, JSON.stringify(eatOut));
    await p.keyboard.press('Escape');
    await p.waitForTimeout(200);
    // whatever is planned tonight is tonight's dinner, a breakfast or a recipe of your own included
    const bk = await p.evaluate(() => {
      const r = window.RECIPES.find((x) => /oatmeal|pancake|granola|smoothie/i.test(x.name));
      window.Store.addToDay(r.id, 'thu');
      const h = window.Hive.today();
      return { name: r.name, tonight: h.tonight && h.tonight.name, planned: h.planned };
    });
    t.ok('a breakfast planned for tonight is tonight’s dinner on Today', bk.tonight === bk.name && bk.planned, JSON.stringify(bk));
    await p.evaluate(() => window.Store.clearPlan());
    // brought back after midnight, Today is the new day
    await p.click('.tab[data-view="today"]');
    await p.waitForTimeout(200);
    await p.clock.setFixedTime(new Date(2026, 9, 2, 0, 1, 0));
    await p.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    await p.waitForTimeout(200);
    const dated = await p.evaluate(() => document.querySelector('#todayRoot .step-k').textContent);
    t.ok('brought back after midnight, Today is the new day', dated === 'Friday · October 2', dated);
    await p.context().close();

    // a tick on a card drawn before midnight lands on the day the card was about
    p = await at(t, new Date(2026, 9, 1, 23, 58, 0), () => {
      localStorage.setItem('sh.view', 'today'); localStorage.setItem('sh.viewAt', String(Date.now()));
      localStorage.setItem('bsc.macroProfile', JSON.stringify({ sex: 'm', age: 43, ft: 5, inch: 11, lb: 190, act: 1.55, goal: 'cut1' }));
      localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 190, f: 70, c: 230 }));
      localStorage.setItem('bsc.macroDays', JSON.stringify({ '2026-10-01': { d: [{ id: 1, x: 1 }] } }));
    });
    p.on('pageerror', (e) => errs.push(e.message));
    const tick0 = await p.evaluate(() => !!document.querySelector('[data-td="eat"][data-k="d"]'));
    await p.clock.setFixedTime(new Date(2026, 9, 2, 0, 1, 0));
    await p.click('[data-td="eat"][data-k="d"]');
    await p.waitForTimeout(200);
    const ate = await p.evaluate(() => { const d = JSON.parse(localStorage.getItem('bsc.macroDays')); return { thu: d['2026-10-01'].d[0].eaten, date: document.querySelector('#todayRoot .step-k').textContent }; });
    t.ok('a tick on Thursday’s card after midnight marks Thursday’s dinner eaten, and the card moves on to Friday', tick0 && ate.thu === 1 && ate.date === 'Friday · October 2', JSON.stringify(ate));
    await p.context().close();

    /* ---- where the app opens: where you were, unless you have been away an hour ----
       Seeded before the app's own script runs, as a phone's storage would be
       on a cold start: a reload of a page that is up counts as now. */
    for (const [ago, want, say] of [[10 * 60e3, 'macros', 'back within the hour, it opens where you were'],
      [2 * 3600e3, 'today', 'away for two hours, it opens on Today']]) {
      const ctx = await t.browser.newContext({ viewport: { width: 390, height: 844 } });
      await ctx.addInitScript((ms) => {
        try { localStorage.setItem('sh.view', 'macros'); localStorage.setItem('sh.viewAt', String(Date.now() - ms)); } catch (e) { /* none */ }
      }, ago);
      const q = await ctx.newPage();
      q.on('pageerror', (e) => errs.push(e.message));
      await q.goto(t.base + 'index.html');
      await q.waitForTimeout(800);
      const v = await q.evaluate(() => document.querySelector('.tab[aria-selected="true"]').dataset.view);
      t.ok(say, v === want, v);
      await ctx.close();
    }

    /* ---- and the same on a resume, not only a cold start ----
       A phone that never closes the app is resumed far more often than it
       is started: three hours on Nourish and it came back to Nourish. The
       page is put away (which writes sh.viewAt, the time it left) and
       brought back, as a phone does it. */
    p = await at(t, MORNING, () => { localStorage.setItem('sh.view', 'macros'); localStorage.setItem('sh.viewAt', String(Date.now())); });
    p.on('pageerror', (e) => errs.push(e.message));
    const flip = (hidden) => p.evaluate((h) => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => h });
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (h ? 'hidden' : 'visible') });
      document.dispatchEvent(new Event('visibilitychange'));
    }, hidden);
    const tab = () => p.evaluate(() => document.querySelector('.tab[aria-selected="true"]').dataset.view);
    const v0 = await tab();
    await flip(true);
    await p.clock.setFixedTime(new Date(MORNING.getTime() + 20 * 60e3));
    await flip(false);
    await p.waitForTimeout(200);
    const v1 = await tab();
    await flip(true);
    await p.clock.setFixedTime(new Date(MORNING.getTime() + 20 * 60e3 + 3 * 3600e3));
    await flip(false);
    await p.waitForTimeout(200);
    const v2 = await tab();
    t.ok('resumed within the hour it stays where you were; resumed after three hours away it is on Today',
      v0 === 'macros' && v1 === 'macros' && v2 === 'today' && await p.evaluate(() => !!document.querySelector('#todayRoot .td-card')), JSON.stringify({ v0, v1, v2 }));
    /* A sheet left open is something in the middle of being done: the
       tab stays under it. */
    await p.click('.tab[data-view="macros"]');
    await openSync(p);
    await p.waitForSelector('#modalRoot .scrim');
    await flip(true);
    await p.clock.setFixedTime(new Date(MORNING.getTime() + 20 * 60e3 + 6 * 3600e3));
    await flip(false);
    await p.waitForTimeout(200);
    const v3 = await tab(), still = await p.evaluate(() => !!document.querySelector('#modalRoot .scrim'));
    t.ok('but not from under a sheet left open', v3 === 'macros' && still, JSON.stringify({ v3, still }));
    await p.context().close();

    /* ---- Unified Health OS: Vitals strip, Dual-Ring eating card, +24oz water & 120d Hub jump ---- */
    p = await at(t, MORNING, () => {
      localStorage.setItem('bsc.macroProfile', JSON.stringify({ sex: 'm', age: 43, ft: 5, inch: 11, lb: 190, act: 1.55, goal: 'cut1' }));
      localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 190, f: 70, c: 230 }));
      localStorage.setItem('bsc.macroDays', JSON.stringify({ '2026-10-01': { b: [{ id: 1, x: 1, eaten: 1 }] } }));
      localStorage.setItem('bsc.macroAM', JSON.stringify({ '2026-10-01': { sl: 7.8, sy: 9420 } }));
      localStorage.setItem('bsc.health', JSON.stringify({
        d: {
          '2026-09-29': { rhr: 54, hrv: 60 },
          '2026-09-30': { rhr: 53, hrv: 62 },
          '2026-10-01': {
            bodyFat: 15.2, leanLb: 160.6, actKcal: 520, totKcal: 2650,
            sleepStages: { deep: 95, rem: 110, light: 245, awake: 18 },
            rhr: 51, hrv: 68, vo2: 49.5, spo2: 98, resp: 14.2
          }
        },
        ex: [{ d: '2026-10-01', st: Date.now() - 3600000, min: 45, type: 'Running', title: 'Morning Run', kcal: 410 }]
      }));
    });
    p.on('pageerror', (e) => errs.push(e.message));
    const vitals0 = await p.evaluate(() => ({
      hasStrip: !!document.querySelector('#todayRoot .td-vitals'),
      hasRing: !!document.querySelector('#todayRoot .td-dual-ring'),
      mpills: document.querySelectorAll('#todayRoot .td-mpill').length,
      has24oz: !!document.querySelector('#todayRoot [data-td="water"][data-oz="24"]'),
      trayOpen: !!document.querySelector('#todayRoot .td-vitals-tray')
    }));
    t.ok('Today renders Health Connect vitals strip, concentric Cal+Protein ring, P/C/F pills, and +24 oz button',
      vitals0.hasStrip && vitals0.hasRing && vitals0.mpills === 3 && vitals0.has24oz && !vitals0.trayOpen, JSON.stringify(vitals0));

    await p.click('#todayRoot [data-td="vitals"]');
    const vitals1 = await p.evaluate(() => ({
      trayOpen: !!document.querySelector('#todayRoot .td-vitals-tray'),
      hasStages: !!document.querySelector('#todayRoot .td-stage-bar'),
      cells: document.querySelectorAll('#todayRoot .td-vt-cell').length,
      exTxt: (document.querySelector('#todayRoot .td-vt-ex') || {}).textContent || ''
    }));
    t.ok('tapping Vitals strip expands sleep stages, biometric cells, and watch workout summary',
      vitals1.trayOpen && vitals1.hasStages && vitals1.cells >= 5 && /Morning Run|Running/.test(vitals1.exTxt), JSON.stringify(vitals1));

    await p.click('#todayRoot [data-td="eatenfold"]');
    const foldOpen = await p.evaluate(() => !!document.querySelector('#todayRoot .td-eaten-list'));
    t.ok('tapping Eaten so far toggles inline eaten meal list without leaving Today', foldOpen);

    await p.click('#todayRoot [data-td="hub"]');
    await p.waitForTimeout(200);
    const hubJump = await p.evaluate(() => ({
      view: document.querySelector('.tab[aria-selected="true"]').dataset.view,
      sub: window.Train._.state().S.sub,
      rvSpan: window.Train._.state().S.rvSpan,
      hasHub: !!document.querySelector('#trSnapshotCard [data-hc-hub="1"]')
    }));
    // the review is Strengthen's Progress tab since 2026-11-01 (Workout, Progress, History)
    t.ok('120d Hub jump navigates to Strengthen Progress on This block span with 120d Biometrics Hub rendered',
      hubJump.view === 'train' && hubJump.sub === 'progress' && hubJump.rvSpan === 'block' && hubJump.hasHub, JSON.stringify(hubJump));

    const edgeChecks = await p.evaluate(() => {
      // 1) Yesterday fallback + todaySteps priority
      localStorage.setItem('bsc.macroAM', JSON.stringify({ '2026-09-30': { sl: 7.5, sy: 6100 }, '2026-10-01': {} }));
      window.HealthData.wipe();
      window.Health.onData({
        status: 'granted',
        syncedAt: Date.now(),
        days: {
          '2026-09-30': { rhr: 52, hrv: 64, sleepHours: 7.5, steps: 6100 },
          '2026-10-01': { steps: 11250 }
        },
        ex: []
      });
      window.Hive.go('today');
      window.Today.render();
      const inlineYesterday = (document.querySelector('#todayRoot .td-vitals-inline') || {}).textContent || '';

      // 2) Sleep-only recovery badge ("Recovered (from sleep)")
      window.HealthData.wipe();
      window.Health.onData({
        status: 'granted',
        syncedAt: Date.now(),
        days: { '2026-10-01': { sleepHours: 8.0, actKcal: 300 } },
        ex: []
      });
      window.Today.render();
      const recBadge = (document.querySelector('#todayRoot .td-rec-pill') || {}).textContent || '';

      return { inlineYesterday, recBadge };
    });
    t.ok('Vitals strip labels yesterday fallback clearly, prioritizes todaySteps, and shows "(from sleep)" when recovery is sleep-only',
      /Yesterday/.test(edgeChecks.inlineYesterday) && /11\.3k steps/.test(edgeChecks.inlineYesterday) && /from sleep/.test(edgeChecks.recBadge),
      JSON.stringify(edgeChecks));
    await p.context().close();

    t.ok('no page errors', errs.length === 0, errs.join(' | '));
  },
};

