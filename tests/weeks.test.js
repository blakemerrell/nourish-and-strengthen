/* Weeks, the plan, and the multiplier a planned recipe carries. */

/* Every sheet answers the back gesture the same way.
 *
 * A recipe was made a history entry when a reader complained that swiping back
 * out of a cross-reference dumped him on the grid. That fixed the case he hit
 * and left three that look identical to him: the Share sheet, the editor and a
 * confirm dialog all fill the screen and all have an ×, and backing out of any
 * of them navigated clean out of the app. Same gesture, same-looking thing,
 * three different outcomes.
 *
 * The check is that back closes the sheet and leaves you where you were —
 * which means starting somewhere else, so that leaving the app is visible as a
 * change of address rather than as nothing happening. */
async function backLeavesYouHere(t, open) {
  const ctx = await t.browser.newContext({ viewport: { width: 1000, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(t.base + 'welcome/index.html');
  await p.waitForTimeout(200);
  await p.goto(t.base + 'index.html');
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(700);
  await open(p);
  const opened = await p.evaluate(() =>
    !!document.querySelector('.sheet') || !!document.querySelector('#dialogRoot .dlg'));
  await p.goBack();
  await p.waitForTimeout(600);
  const after = await p.evaluate(() => ({
    path: location.pathname,
    sheet: !!document.querySelector('.sheet') || !!document.querySelector('#dialogRoot .dlg'),
  }));
  await ctx.close();
  return { opened, after };
}

module.exports = {
  name: 'Weeks and the plan',
  async run(t) {
    /* ---- weeks have dates ------------------------------------------------
     * Blake: "a calendar type view... move forward or backward to see my
     * history or my planning." A week is Sunday to Saturday and its id says
     * which Sunday. The clock is fixed on Wednesday 30 September 2026, so this
     * week is Sep 27 – Oct 3 and Sunday to Tuesday are gone. */
    const WED = new Date(2026, 8, 30, 9, 0, 0);
    let p = await t.fresh({ viewport: { width: 390, height: 844 } });
    await p.clock.setFixedTime(WED);
    await p.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('bsc.plan', JSON.stringify({ mon: [1, 2], wed: [3] }));
      localStorage.setItem('bsc.favs', JSON.stringify([7]));
    });
    await p.reload();
    await p.waitForTimeout(700);
    await p.click('.tab[data-view="plan"]');
    await p.waitForTimeout(250);
    const look = () => p.evaluate(() => ({
      id: window.Store.activeWeek().id,
      title: document.getElementById('weekTitle').textContent,
      sub: document.getElementById('calSub').textContent,
      items: document.querySelectorAll('#planGrid .day-item-name').length,
      weeks: Object.keys(window.Store.state.weeks).sort().join(','),
    }));
    let s = await look();
    const plan0 = await p.evaluate(() => window.Store.state.plan);
    t.ok('the old single week lands on this week’s dates',
      s.id === 'd20260927' && s.title === 'Sep 27 – Oct 3' && s.sub === 'This week' && s.weeks === 'd20260927', JSON.stringify(s));
    t.ok('with its plan intact', (plan0.mon || []).join() === '1,2' && (plan0.wed || []).join() === '3');
    t.ok('and its favorites', (await p.evaluate(() => window.Store.state.favs.join())) === '7');
    t.ok('the calendar shows them', s.items === 3, s.items);

    /* ---- next week is its own, and looking writes nothing ----------------- */
    await p.click('#calNext');
    await p.waitForTimeout(200);
    s = await look();
    t.ok('› shows next week, empty, and looking at it writes nothing',
      s.id === 'd20261004' && s.title === 'Oct 4 – Oct 10' && s.sub === 'Next week' && s.items === 0 && s.weeks === 'd20260927', JSON.stringify(s));
    await p.evaluate(() => window.Store.addToDay(2, 'tue'));
    await p.waitForTimeout(150);
    s = await p.evaluate(() => ({ here: window.Store.day('tue').map((e) => e.id).join(), there: JSON.stringify(window.Store.state.weeks.d20260927.plan) }));
    t.ok('planning lands in the week showing and leaves this week alone',
      s.here === '2' && /"mon":\[1,2\]/.test(s.there) && !/"tue"/.test(s.there), JSON.stringify(s));

    /* ---- the days gone by are history ------------------------------------ */
    await p.click('#calToday');
    await p.waitForTimeout(200);
    const days = await p.evaluate(() => [...document.querySelectorAll('#planGrid .cal-day')].map((d) => ({
      n: d.querySelector('.cal-date b').textContent, past: d.classList.contains('past'), today: d.classList.contains('today'),
      add: !!d.querySelector('[data-addday]'), drop: !!d.querySelector('[data-pswap]') })));
    t.ok('the week runs Sunday 27 to Saturday 3, with today marked',
      days.map((d) => d.n).join() === '27,28,29,30,1,2,3' && days[3].today && !days[2].today, JSON.stringify(days.map((d) => d.n)));
    t.ok('days gone by keep what was planned but take no + Add; today and after do',
      days[1].past && !days[1].add && !days[1].drop && !days[3].past && days[3].add && days[4].add, JSON.stringify(days));
    const acts = async (d) => {
      await p.click('#planGrid [data-dayopen][data-day="' + d + '"]');
      await p.waitForTimeout(200);
      const a = await p.evaluate(() => [...document.querySelectorAll('[data-dsact]')].map((b) => b.dataset.dsact).join());
      await p.click('.dsh-sheet .sheet-x');
      await p.waitForTimeout(200);
      return a;
    };
    const past = await acts('mon'), now = await acts('wed');
    t.ok('a day gone by opens to the recipe alone; today can still add and take off', past === 'open' && /open,.*remove/.test(now), JSON.stringify({ past, now }));
    await p.click('#calPrev');
    await p.waitForTimeout(200);
    s = await p.evaluate(() => ({ sub: document.getElementById('calSub').textContent, pmw: document.getElementById('planMyWeek').disabled }));
    t.ok('a week gone by says so, and Plan my week is off for it', s.sub === 'Last week' && s.pmw, JSON.stringify(s));
    await p.click('#calToday');

    /* ---- the list is the week's ------------------------------------------ */
    const listOf = async () => {
      await p.evaluate(() => window.Hive.go('list'));
      await p.waitForTimeout(200);
      const l = await p.evaluate(() => ({ week: document.getElementById('listWeek').textContent, rows: document.querySelectorAll('.list-row').length,
        done: document.querySelectorAll('.list-row.done').length }));
      await p.evaluate(() => window.Hive.go('plan'));
      await p.waitForTimeout(150);
      return l;
    };
    const l1 = await listOf();
    await p.click('#calNext');
    await p.waitForTimeout(150);
    const l2 = await listOf();
    t.ok('Shop is for the week on screen, and says which',
      l1.week === 'Sep 27 – Oct 3' && l2.week === 'Oct 4 – Oct 10' && l1.rows !== l2.rows && l2.rows > 0, JSON.stringify({ l1, l2 }));
    await p.evaluate(() => window.Hive.go('list'));
    await p.click('#listBody .list-row >> nth=0');
    await p.waitForTimeout(150);
    await p.evaluate(() => window.Hive.go('plan'));
    await p.click('#calToday');
    await p.waitForTimeout(150);
    t.ok('a tick belongs to its week', (await listOf()).done === 0);

    /* ---- the multiplier, on a day still ahead ---------------------------- */
    await p.evaluate(() => { window.Store.addToDay(1, 'thu'); });
    await p.waitForTimeout(150);
    const qty = async () => {
      await p.evaluate(() => window.Hive.go('list'));
      await p.waitForTimeout(150);
      const q = await p.evaluate(() => [...document.querySelectorAll('.list-row')].map((r) => r.textContent).join('|'));
      await p.evaluate(() => window.Hive.go('plan'));
      await p.waitForTimeout(150);
      return q;
    };
    await p.evaluate(() => { window.Store.clearPlan(); window.Store.addToDay(1, 'thu'); });
    const at1 = await qty();
    await p.evaluate(() => window.Store.addToDay(1, 'thu', 2));
    const at2 = await qty();
    t.ok('doubling a recipe doubles the shopping', /1 cup/.test(at1) && /2 cups/.test(at2), at1 + '  ->  ' + at2);
    t.ok('the plan shows the multiplier', /cooked ×2/.test(await p.textContent('#planGrid [data-dayopen][data-day="thu"] small')));
    await p.click('#planGrid [data-dayopen][data-day="thu"]');
    await p.waitForTimeout(200);
    await p.click('[data-dsact="double"]');
    await p.waitForTimeout(250);
    let dbl = await p.evaluate(() => ({ thu: window.Store.day('thu')[0], fri: window.Store.day('fri')[0] || null,
      row: document.querySelector('#planGrid [data-dayopen][data-day="thu"] small').textContent }));
    t.ok('Cook double doubles it and puts its leftovers on Friday', dbl.thu.x === 4 && dbl.fri && dbl.fri.lo && dbl.fri.id === 1 && /cooked ×4 · leftovers Friday/.test(dbl.row), JSON.stringify(dbl));
    await p.click('#planGrid [data-dayopen][data-day="thu"]');
    await p.waitForTimeout(200);
    await p.click('[data-dsact="single"]');
    await p.waitForTimeout(250);
    dbl = await p.evaluate(() => ({ thu: window.Store.day('thu')[0], fri: window.Store.day('fri').length }));
    t.ok('Back to one batch halves it and takes the leftovers night off', dbl.thu.x === 2 && dbl.fri === 0, JSON.stringify(dbl));
    /* The leftovers night taken off on its own: the dinner goes back to one
       batch. Left doubled, its sheet offered Cook double again, and ×2
       became ×4 and never ×1. */
    await p.click('#planGrid [data-dayopen][data-day="thu"]');
    await p.waitForTimeout(200);
    await p.click('[data-dsact="double"]');
    await p.waitForTimeout(250);
    await p.click('#planGrid [data-dayopen][data-day="fri"]');
    await p.waitForTimeout(200);
    await p.click('[data-dsact="remove"]');
    await p.waitForTimeout(250);
    dbl = await p.evaluate(() => ({ thu: window.Store.day('thu')[0], fri: window.Store.day('fri').length }));
    t.ok('taking the leftovers night off on its own puts the dinner back to one batch', dbl.thu.x === 2 && !dbl.thu.lo && dbl.fri === 0, JSON.stringify(dbl));

    /* ---- anywhere but Plan, "the week" is this week ----------------------- */
    await p.click('#calNext');
    await p.waitForTimeout(150);
    await p.click('.tab[data-view="browse"]');
    const opened = await p.evaluate(() => Number(document.querySelector('#grid .card').dataset.open));
    await p.click('#grid .card >> nth=0');
    await p.click('[data-scale="up"]');
    await p.click('[data-scale="up"]');
    await p.click('.daybtn[data-day="fri"]');
    await p.waitForTimeout(150);
    s = await p.evaluate((id) => ({ wk: window.Store.activeWeek().id, x: window.Store.scaleOf(id, 'fri') }), opened);
    t.ok('a recipe added from Recipes lands on this week, at the size you were looking at',
      s.wk === 'd20260927' && s.x === 4, JSON.stringify(s));
    await p.click('.sheet-x');

    /* ---- cook this again, and templates ---------------------------------- */
    await p.click('.tab[data-view="plan"]');
    await p.click('#calNext');
    await p.waitForTimeout(150);
    await p.click('[data-calagain]');
    await p.waitForTimeout(150);
    await p.click('[data-calfrom="d20260927"]');
    await p.waitForTimeout(250);
    s = await p.evaluate(() => ({ tue: window.Store.day('tue').map((e) => e.id).join(), thu: window.Store.day('thu').map((e) => e.id + 'x' + e.x).join(),
      fri: window.Store.day('fri').length }));
    t.ok('Cook this again fills next week’s empty days from this one, sizes and all, and leaves a planned day alone',
      s.tue === '2' && s.thu === '1x2' && s.fri === 1, JSON.stringify(s));
    await p.click('[data-caltpl]');
    await p.waitForSelector('#dlgInput');
    await p.fill('#dlgInput', 'Freezer week');
    await p.click('[data-dlg="ok"]');
    await p.waitForTimeout(200);
    t.ok('and a week can be saved as a template to cook again',
      await p.evaluate(() => window.Store.sources().some((w) => w.tpl && w.name === 'Freezer week')));

    /* ---- the month ------------------------------------------------------- */
    await p.click('[data-cal="m"]');
    await p.waitForTimeout(200);
    s = await p.evaluate(() => ({ title: document.getElementById('weekTitle').textContent,
      cells: document.querySelectorAll('.cal-cell').length, named: document.querySelectorAll('.cal-cell em').length }));
    t.ok('Month shows October at a glance, with the planned dinners in it',
      s.title === 'October 2026' && s.cells === 35 && s.named >= 5, JSON.stringify(s));
    await p.click('.cal-cell[data-calweek="d20261011"] >> nth=0');
    await p.waitForTimeout(200);
    s = await look();
    t.ok('and tapping a day opens its week', s.id === 'd20261011' && s.title === 'Oct 11 – Oct 17', JSON.stringify(s));

    /* ---- reload ---------------------------------------------------------- */
    await p.reload();
    await p.waitForTimeout(700);
    await p.click('.tab[data-view="plan"]');
    await p.waitForTimeout(200);
    s = await p.evaluate(() => ({ id: window.Store.activeWeek().id, weeks: Object.keys(window.Store.state.weeks).length }));
    t.ok('all of which survives a reload, opening on this week', s.id === 'd20260927' && s.weeks === 3, JSON.stringify(s));
    await p.context().close();

    /* ---- a leftovers night with nothing cooked the night before ----------
     * The other phone swapped Wednesday's dinner, or took it off, and
     * Thursday's leftovers stayed behind saying "nothing to cook or buy"
     * over a night with nothing to eat. Seeded as that phone leaves it. */
    {
      const q = await t.fresh({ viewport: { width: 390, height: 844 } });
      const errs = [];
      q.on('pageerror', (e) => errs.push(e.message));
      await q.clock.setFixedTime(WED);
      await q.evaluate(() => { localStorage.clear(); localStorage.setItem('sh.pw', JSON.stringify({ ppl: 6 })); });
      await q.reload();
      await q.waitForTimeout(700);
      const din = await q.evaluate(() => {
        const r = window.RECIPES.find((x) => x.book === 2 && x.secNum === 3);
        window.Store.addToDay(r.id, 'thu', 1, true);
        return { id: r.id, x: Math.max(1, Math.round((6 / (Number(r.servN) || 4)) * 2) / 2) * 2 };
      });
      await q.click('.tab[data-view="plan"]');
      await q.waitForTimeout(250);
      const sheet = async (d) => {
        await q.click('#planGrid [data-dayopen][data-day="' + d + '"]');
        await q.waitForTimeout(200);
        return q.evaluate(() => ({ m: document.querySelector('.dsh-m').textContent,
          acts: [...document.querySelectorAll('[data-dsact]')].map((b) => b.dataset.dsact + ':' + b.querySelector('b').textContent) }));
      };
      let o = await sheet('thu');
      t.ok('a leftovers night whose dinner is cooked nowhere says so, and offers to cook it the night before',
        o.m === 'Leftovers — but nothing is cooked on Wednesday' && o.acts.includes('cook:Cook it Wednesday'), JSON.stringify(o));
      await q.click('[data-dsact="cook"]');
      await q.waitForTimeout(250);
      const days = await q.evaluate(() => ({ wed: window.Store.day('wed'), thu: window.Store.day('thu'),
        row: document.querySelector('#planGrid [data-dayopen][data-day="wed"] small').textContent }));
      t.ok('Cook it Wednesday puts the dinner on Wednesday at double the household’s size, Thursday its leftovers',
        days.wed.length === 1 && days.wed[0].id === din.id && !days.wed[0].lo && days.wed[0].x === din.x &&
        days.thu.length === 1 && days.thu[0].lo && /leftovers Thursday/.test(days.row), JSON.stringify({ days, din }));
      o = await sheet('thu');
      t.ok('and Thursday is a plain leftovers night again', o.m === 'Leftovers · nothing to cook or buy' && !o.acts.some((a) => /^cook:/.test(a)), JSON.stringify(o));
      t.ok('no page errors on the orphaned night', !errs.length, errs.join(' | '));
      await q.context().close();
    }

    /* ---- Saturday cooks double into next week ----------------------------
     * Saturday never offered "Cook double, leftovers Sunday": the day after
     * it was looked up in a list of seven and was not there. Its Sunday is
     * next week's, and the leftovers go there, onto a Sunday with nothing on
     * it, and follow the dinner when it is swapped or taken off. */
    {
      const SAT = new Date(2026, 9, 3, 11, 0, 0);
      const q = await t.fresh({ viewport: { width: 390, height: 844 } });
      const errs = [];
      q.on('pageerror', (e) => errs.push(e.message));
      await q.clock.setFixedTime(SAT);
      await q.evaluate(() => localStorage.clear());
      await q.reload();
      await q.waitForTimeout(700);
      const ids = await q.evaluate(() => {
        const rs = window.RECIPES.filter((x) => x.book === 2 && x.secNum === 3);
        window.Store.addToDay(rs[0].id, 'sat', 1);
        return rs.slice(0, 2).map((r) => r.id);
      });
      await q.click('.tab[data-view="plan"]');
      await q.waitForTimeout(250);
      const NEXT = 'd20261004';
      const acts = async (d) => {
        await q.click('#planGrid [data-dayopen][data-day="' + d + '"]');
        await q.waitForTimeout(200);
        return q.evaluate(() => [...document.querySelectorAll('[data-dsact]')].map((b) => b.dataset.dsact + ':' + b.querySelector('b').textContent));
      };
      const state = () => q.evaluate((nx) => ({ sat: window.Store.day('sat'), sun: window.Store.dayOf(nx, 'sun'),
        row: ((document.querySelector('#planGrid [data-dayopen][data-day="sat"] small') || {}).textContent) || '' }), NEXT);
      let a = await acts('sat');
      t.ok('Saturday offers Cook double, its leftovers on Sunday', a.includes('double:Cook double, leftovers Sunday'), JSON.stringify(a));
      await q.click('[data-dsact="double"]');
      await q.waitForTimeout(250);
      let s2 = await state();
      t.ok('and doubles Saturday, with the leftovers on next week’s Sunday',
        s2.sat.length === 1 && s2.sat[0].x === 2 && s2.sun.length === 1 && s2.sun[0].id === ids[0] && s2.sun[0].lo &&
        /cooked ×2 · leftovers Sunday/.test(s2.row) && (await q.evaluate(() => window.Store.activeWeek().id)) === 'd20260927', JSON.stringify(s2));
      await q.click('#planGrid [data-pswap][data-day="sat"]');
      await q.waitForTimeout(300);
      s2 = await state();
      t.ok('swapped, Saturday’s new dinner is still cooked double, and Sunday’s leftovers follow it into next week',
        s2.sat.length === 1 && s2.sat[0].id !== ids[0] && s2.sat[0].x === 2 && s2.sun.length === 1 && s2.sun[0].id === s2.sat[0].id && s2.sun[0].lo, JSON.stringify(s2));
      // next week, its Sunday: leftovers of last week's Saturday, not an orphan
      await q.click('#calNext');
      await q.waitForTimeout(200);
      await q.click('#planGrid [data-dayopen][data-day="sun"]');
      await q.waitForTimeout(200);
      const m = await q.evaluate(() => document.querySelector('.dsh-m').textContent);
      t.ok('next week’s Sunday knows its dinner is cooked on Saturday, the week before', m === 'Leftovers · nothing to cook or buy', m);
      await q.click('[data-dsact="remove"]');
      await q.waitForTimeout(250);
      s2 = await q.evaluate((nx) => ({ sat: window.Store.dayOf('d20260927', 'sat'), sun: window.Store.dayOf(nx, 'sun') }), NEXT);
      t.ok('taken off there on its own, Saturday goes back to one batch', s2.sun.length === 0 && s2.sat.length === 1 && s2.sat[0].x === 1, JSON.stringify(s2));
      await q.click('#calToday');
      await q.waitForTimeout(200);
      await acts('sat');
      await q.click('[data-dsact="double"]');
      await q.waitForTimeout(250);
      await acts('sat');
      await q.click('[data-dsact="remove"]');
      await q.waitForTimeout(250);
      s2 = await state();
      t.ok('Take it off Saturday takes its leftovers off next week’s Sunday', s2.sat.length === 0 && s2.sun.length === 0, JSON.stringify(s2));
      // a Sunday already planned is not doubled into from here, out of sight
      await q.evaluate((a2) => { window.Store.addToDay(a2[0], 'sat', 1); window.Store.addToWeekDay('d20261004', 'sun', a2[1], 1); }, ids);
      await q.waitForTimeout(150);
      a = await acts('sat');
      t.ok('but not onto a Sunday that already has a dinner', !a.some((x) => /^double:/.test(x)) && a.some((x) => /^remove:/.test(x)), JSON.stringify(a));
      t.ok('no page errors across the end of the week', !errs.length, errs.join(' | '));
      await q.context().close();
    }

    /* ---- named weeks from before ------------------------------------------ */
    p = await t.fresh();
    await p.clock.setFixedTime(WED);
    await p.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('bsc.weeks', JSON.stringify({
        w1: { name: 'This Week', ord: 0, plan: { mon: [1] }, checked: {} },
        wb: { name: 'Thanksgiving', ord: 1, plan: { thu: [5] }, checked: {} } }));
      localStorage.setItem('bsc.active', JSON.stringify('wb'));
    });
    await p.reload();
    await p.waitForTimeout(700);
    s = await p.evaluate(() => ({ weeks: window.Store.state.weeks, src: window.Store.sources().map((w) => (w.tpl ? 'tpl:' : '') + w.name) }));
    t.ok('"This Week" moves onto this week; another named week becomes a template to cook again',
      s.weeks.d20260927 && (s.weeks.d20260927.plan.mon || []).join() === '1' && !s.weeks.w1 && s.weeks.wb && s.weeks.wb.tpl === 1 &&
        s.src.indexOf('tpl:Thanksgiving') >= 0, JSON.stringify(s));
    await p.context().close();

    p = await t.fresh({ viewport: { width: 390, height: 780 } });
    await p.click('.tab[data-view="plan"]');
    await p.click('#calNext');
    await p.click('[data-cal="m"]');
    await p.waitForTimeout(200);
    const over = await p.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    t.ok('and nothing runs off the side of a phone, week or month', over <= 0, over + 'px');

    /* Every tab reachable without knowing to swipe. Five tabs and the sync
       button shared one row, which put 230px of it off the right-hand edge at
       390px: "Pantry" cut to "Pant", "Print Book" not on screen at all, and no
       scrollbar or fade to say there was more. Two of the five were, in
       practice, undiscoverable.

       Asserted by geometry rather than by overflow, because the fix is not
       "it scrolls" — it is that nothing needs to. */
    const tabs = await p.evaluate(() => {
      const t = document.querySelector('.tabs');
      const box = t.getBoundingClientRect();
      const s = document.querySelector('.synbtn').getBoundingClientRect();
      return {
        labels: [...t.querySelectorAll('.tab')].filter((b) => b.offsetParent).map((b) => b.innerText.trim()),
        offscreen: [...t.querySelectorAll('.tab')]
          .filter((b) => b.getBoundingClientRect().right > box.right + 1)
          .map((b) => b.innerText.trim()),
        // the skep logo button leads on the left of the same single row
        sameRow: s.right <= box.left + 1 && Math.abs((s.top + s.height / 2) - (box.top + box.height / 2)) < 8,
      };
    });
    t.ok('every tab is on the screen without scrolling for it',
      tabs.offscreen.length === 0, 'off the edge: ' + tabs.offscreen.join(', '));
    t.ok('under a short name each, on a phone',
      tabs.labels.join('|') === 'Today|Recipes|Plan|Nourish|Strengthen', tabs.labels.join(' '));
    t.ok('with the skep logo button leading the same single row on the left', tabs.sameRow);

    /* It used to say "Local", which is a state and not an invitation, and
       nothing on the screen said that pressing it was how two phones end up on
       one list. On a device that is not sharing it has to name the thing you
       can do, and it has to carry the sentence there is no room to print. */
    const badge = await p.evaluate(() => ({
      label: document.getElementById('syncLabel').textContent.trim(),
      tip: document.getElementById('syncBtn').getAttribute('title') || '',
    }));
    t.ok('and it offers to share rather than reporting that it is local',
      badge.label === 'Share', badge.label);
    t.ok('with the whole sentence in its title',
      /tap to share/i.test(badge.tip), badge.tip);

    /* Every state the badge can be in has a word and a sentence, because the
       one that had neither is the one that sent somebody asking what "Offline"
       meant. Read straight off the app rather than restated here, so a new
       state cannot be added without one. */
    const vocab = await p.evaluate(() => {
      const w = window.__syncWords, t = window.__syncTips;
      if (!w || !t) return null;
      return Object.keys(w).filter((k) => !w[k] || !t[k]);
    });
    t.ok('and every sync state has a word and a sentence of its own',
      vocab !== null && vocab.length === 0,
      vocab === null ? 'not exposed' : vocab.join(', '));

    /* Nobody reads the top right corner of a header on their way to a recipe,
       so the app says it once in the run of the page. What matters is that it
       is a door rather than a sign — pressing it opens the sharing sheet — and
       that it goes away for good, because a hint that comes back is a nag. */
    const hint = await p.evaluate(() => {
      const el = document.getElementById('shareHint');
      return { shown: el && !el.classList.contains('hide'),
        words: el ? el.textContent.replace(/\s+/g, ' ').trim() : '' };
    });
    t.ok('a new phone is told where sharing lives', hint.shown, hint.words.slice(0, 60));

    await p.click('#shareHintGo');
    await p.waitForTimeout(300);
    t.ok('and pressing it opens the sharing sheet rather than pointing at it',
      await p.evaluate(() => !!document.querySelector('.sync-sheet')));

    await p.click('.sheet-x');
    await p.waitForTimeout(200);
    t.ok('asking the question puts the hint away',
      await p.evaluate(() => document.getElementById('shareHint').classList.contains('hide')));

    await p.reload();
    await p.waitForTimeout(700);
    t.ok('and it stays away across a reload',
      await p.evaluate(() => document.getElementById('shareHint').classList.contains('hide')));

    // and the long names come back where there is room for them
    await p.setViewportSize({ width: 1280, height: 900 });
    await p.waitForTimeout(400);
    const wide = await p.evaluate(() =>
      [...document.querySelectorAll('.tab')].filter((b) => b.offsetParent).map((b) => b.innerText.trim()));
    t.ok('and the full names return on a wider screen',
      // Nourish and Strengthen have no short forms — the book left the row
      // to make room for them
      wide.join('|') === 'Today|Recipes|Meal Plan|Nourish|Strengthen', wide.join(' '));

    /* ---- text somebody typed is text, not markup -------------------------
     *
     * Nothing in this suite tested escaping at all. Removing every replace()
     * from esc() and running the lot came back green, which is as good as
     * saying the app has no opinion on the difference between a week called
     * "Mum's" and a week called "<img onerror=...>".
     *
     * It matters more here than on most pages, because a household is other
     * people's writing: a week name, a recipe, a shelf item typed on one phone
     * is rendered on every other phone in the house. So the strings below go in
     * through the same doors that text arrives through and are looked for as
     * elements, which is the only version of this question that has an answer —
     * "does it appear escaped" can be true of markup that also ran.
     */
    const HOSTILE = '<img src=x onerror="window.__ran=1">&"\'';
    await p.evaluate((s) => {
      window.__ran = 0;
      window.Store.saveTemplate(s);
      window.Store.addPantryItem(s, 'Yours');
    }, HOSTILE);
    await p.waitForTimeout(300);
    await p.click('.tab[data-view="plan"]').then(() => p.evaluate(() => window.Hive.go('pantry'))).then(() => p.evaluate(() => { const d = document.getElementById('storePart'); if (d) d.open = true; }));
    await p.waitForTimeout(300);

    const hostile = await p.evaluate((s) => ({
      ran: window.__ran,
      injected: document.querySelectorAll('img[src="x"]').length,
      weekName: (window.Store.weeks().find((w) => w.name === s) || {}).name,
      shownSomewhere: document.body.textContent.indexOf(s) >= 0,
    }), HOSTILE);

    t.ok('a week named like an attack does not become one',
      hostile.ran === 0 && hostile.injected === 0, JSON.stringify(hostile));
    t.ok('and is kept and shown as the words that were typed',
      hostile.weekName === HOSTILE && hostile.shownSomewhere, JSON.stringify(hostile));

    /* ---- what another phone in the household can send ----
     *
     * A household code can be read aloud, so what arrives under it is input.
     * A recipe id with a quote and an img tag in it went straight into four
     * attributes of the plan grid and ran script on every member's phone; a
     * day that was not a list took the plan and the list down for good. */
    {
      const q = await t.fresh();
      const errs = [];
      q.on('pageerror', (e) => errs.push(e.message));
      await q.evaluate(() => {
        // __pw is the plan-my-week test hook; this marker is its own
        const bad = 'u1"><img src=x onerror="window.__idRan=1">';
        const rec = (name) => ({ book: 3, secNum: 1, secName: 'Ours', name, servings: '2 servings', servN: 2,
          ing: ['1 cup rice'], steps: ['Cook it.'], macro: { kcal: 300, p: 20, c: 30, f: 8, na: 300, fib: 3 } });
        const mine = {}; mine[bad] = rec('Trap'); mine.uok1 = rec('Fine rice'); mine.constructor = rec('Proto');
        localStorage.setItem('bsc.mine', JSON.stringify(mine));
        localStorage.setItem('bsc.weeks', JSON.stringify({ w1: { name: 'This Week', ord: 0, checked: {},
          plan: { mon: [bad, { i: 'uok1', x: 2 }], tue: 'not a list', wed: [{ i: {} }, 'constructor', null, 27], thu: [{ i: 27, x: 'lots' }] } } }));
        localStorage.setItem('bsc.active', JSON.stringify('w1'));
        localStorage.setItem('bsc.pantryNew', JSON.stringify({ a: { l: 5, c: 'constructor' }, b: { l: 'Rice', c: 'Grains' }, c: 'x' }));
      });
      await q.reload();
      await q.click('.tab[data-view="plan"]');
      await q.waitForTimeout(300);
      const r = await q.evaluate(() => ({
        ran: !!window.__idRan || !!document.querySelector('img[src="x"]'),
        mon: window.Store.day('mon').map((e) => e.id + 'x' + e.x).join(),
        tue: window.Store.day('tue').length, wed: window.Store.day('wed').map((e) => e.id).join(), thu: window.Store.day('thu').map((e) => e.x).join(),
        mine: Object.keys(window.Store.state.mine).sort().join(), pn: Object.keys(window.Store.state.pantryNew).join(),
        drawn: document.querySelectorAll('.day-item-name').length,
      }));
      t.ok('a hostile recipe id from the household never runs, and never arrives', !r.ran && r.mine === 'uok1', JSON.stringify(r));
      t.ok('a day that is not a list, and entries that are not ids, are dropped; the rest of the week stands',
        r.mon === 'uok1x2' && r.tue === 0 && r.wed === '27' && r.thu === '1' && r.drawn >= 3, JSON.stringify(r));
      t.ok('a pantry item without a label is dropped', r.pn === 'b', r.pn);
      t.ok('and nothing on the page threw', !errs.length, errs.join(' | '));
      await q.context().close();
    }

    /* Back out of "Back to the storehouse list?" is Cancel, not Reset. */
    {
      const ctx = await t.browser.newContext({ viewport: { width: 1000, height: 900 } });
      const q = await ctx.newPage();
      await q.goto(t.base + 'index.html');
      await q.evaluate(() => localStorage.clear());
      await q.reload();
      await q.waitForTimeout(500);
      await q.click('.tab[data-view="plan"]').then(() => q.evaluate(() => window.Hive.go('where')));
      await q.waitForTimeout(300);
      await q.evaluate(() => window.Store.setPantry('cottage_cheese', false));
      await q.waitForTimeout(300);
      await q.click('#pantryReset');
      await q.waitForTimeout(300);
      await q.goBack();
      await q.waitForTimeout(500);
      const r = await q.evaluate(() => ({ kept: window.Store.pantryHas('cottage_cheese', true), dlg: !!document.querySelector('#dialogRoot .dlg') }));
      t.ok('swiping back on the reset question keeps what you ticked off', r.kept === false && !r.dlg, JSON.stringify(r));
      await ctx.close();
    }

    /* ---- the back gesture, on every sheet there is ---- */
    for (const [what, open] of [
      ['a recipe', async (q) => { await q.click('.tab[data-view="browse"]'); await q.evaluate(() =>
        document.querySelector('.card[data-open]').click()); await q.waitForTimeout(350); }],
      ['the Share sheet', async (q) => { await q.click('#syncBtn'); await q.waitForTimeout(350); }],
      ['the editor', async (q) => { await q.click('.tab[data-view="browse"]'); await q.click('#newRecipe'); await q.waitForTimeout(450); }],
      ['a confirm dialog', async (q) => {
        await q.click('.tab[data-view="plan"]').then(() => q.evaluate(() => window.Hive.go('where'))); await q.waitForTimeout(350);
        await q.evaluate(() => window.Store.setPantry('cottage_cheese', false));
        await q.waitForTimeout(350);
        await q.click('#pantryReset'); await q.waitForTimeout(350);
      }],
    ]) {
      const r = await backLeavesYouHere(t, open);
      t.ok('back out of ' + what + ' closes it without leaving the app',
        r.opened && r.after.path.indexOf('welcome') < 0 && !r.after.sheet,
        JSON.stringify(r));
    }

    await p.context().close();
  },
};
