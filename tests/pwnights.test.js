/* Plan my week opens on the nights.
 *
 * Blake, 2026-10-12: Plan my week "didn't seem to work"; on a second try it
 * did — "I think I just had one day selected at the beginning... it was too
 * confusing". A visit on a Saturday had lit Saturday alone (the other nights
 * had gone), tapping any answer saved every answer, and the next Monday the
 * sheet opened on "Saturday" with a bar that said only "for 1 night". Then:
 * "Shorten the days to S M T W Th F S... add some pills like m-w-f w/
 * leftovers". So the nights are kept for the week they were picked for, the
 * week is a strip of seven, presets set the nights and the leftovers in one
 * tap, the bar names the nights it will fill, and once dinners have been
 * picked the rest of the answers fold into one line. */

module.exports = {
  name: 'Plan my week: the nights',
  async run(t) {
    const p = await t.fresh({ viewport: { width: 390, height: 844 } });
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    const open = async () => {
      if (!await p.$('#planMyWeek:visible')) { await p.click('.tab[data-view="plan"]'); await p.waitForTimeout(300); }
      await p.click('#planMyWeek');
      await p.waitForTimeout(300);
    };
    const read = () => p.evaluate(() => ({
      pre: [...document.querySelectorAll('[data-pwpre]')].filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.dataset.pwpre),
      on: [...document.querySelectorAll('.pw-day[aria-pressed="true"]')].map((b) => b.dataset.pwv),
      lo: [...document.querySelectorAll('.pw-day.lo')].map((b) => b.dataset.pwv),
      has: [...document.querySelectorAll('.pw-day.has')].map((b) => b.dataset.pwv),
      letters: [...document.querySelectorAll('.pw-day')].map((b) => b.textContent).join(' '),
      labels: [...document.querySelectorAll('.pw-day')].map((b) => b.getAttribute('aria-label')),
      lokey: (document.querySelector('.pw-lokey') || {}).textContent || '',
      usual: (document.querySelector('.pw-usual p') || {}).textContent || '',
      ppl: !!document.querySelector('[data-pwq="ppl"]'),
      b: Number((document.querySelector('.pw-cnt b') || {}).textContent),
      cnt: (document.querySelector('.pw-cnt') || {}).textContent || '',
      say: (document.querySelector('.pw-cnt span') || {}).textContent || '',
      go: !(document.querySelector('.pw-go[data-pwsee]') || {}).disabled,
    }));

    /* ---- last Saturday: only Saturday is left, and it is picked for ---- */
    await p.clock.install({ time: new Date(2026, 9, 10, 17, 0, 0) });
    await p.reload();
    await p.waitForTimeout(900);
    await open();
    let s = await read();
    t.ok('the sheet opens on the nights, a week of seven as S M T W Th F S, each called by its full name',
      s.letters === 'S M T W Th F S' && s.labels[4] === 'Thursday' && await p.evaluate(() => document.querySelector('.pw-h').textContent) === 'Which nights?',
      JSON.stringify(s));
    t.ok('on a Saturday only Saturday is lit, the bar names it, and of the presets only Weekend is lit (Whole week comes to the same night)',
      s.on.join() === 'sat' && s.say === 'for Sat only' && s.pre.join() === 'we', JSON.stringify(s));
    t.ok('with no usual yet, every question is on the sheet', s.ppl && !s.usual, JSON.stringify(s));
    await p.click('[data-pwq="ppl"][data-pwv="4"]');
    await p.click('.pw-go[data-pwsee]');
    await p.click('[data-pwpick="all"]');
    await p.waitForTimeout(500);
    const saved = await p.evaluate(() => JSON.parse(localStorage.getItem('sh.pw')));
    t.ok('the answers are saved with the week they were for, and as a usual once dinners went on',
      saved.days.join() === 'sat' && /^d\d{8}$/.test(saved.wk) && saved.used === 1, JSON.stringify(saved));

    /* ---- the Monday after: a new week starts on the weeknights ---- */
    await p.clock.setSystemTime(new Date(2026, 9, 12, 9, 0, 0));
    await p.reload();
    await p.waitForTimeout(900);
    await open();
    s = await read();
    t.ok('the next Monday opens on Monday to Friday, not last week’s Saturday, and the bar says so',
      s.on.join() === 'mon,tue,wed,thu,fri' && s.say === 'for Mon–Fri' && s.pre.join() === 'wk' && s.go, JSON.stringify(s));
    t.ok('the rest is the usual, said in one line, with the questions folded away',
      !s.ppl && /^4 eating · up to \$\d+ · /.test(s.usual) && /repeats are fine$/.test(s.usual), JSON.stringify(s));
    await p.click('[data-pwmore]');
    await p.waitForTimeout(200);
    t.ok('Change opens the questions', (await read()).ppl);

    /* ---- presets ---- */
    await p.click('[data-pwpre="mwf"]');
    await p.waitForTimeout(200);
    s = await read();
    t.ok('M-W-F + leftovers: Monday to Friday, with Tuesday and Thursday hatched as the leftovers of the night before',
      s.on.join() === 'mon,tue,wed,thu,fri' && s.lo.join() === 'tue,thu' && s.pre.join() === 'mwf' &&
        s.labels[2] === 'Tuesday, leftovers' && /^↺ Tue and Thu are leftovers: Mon’s and Wed’s dinners, cooked double\.$/.test(s.lokey) &&
        s.say === 'for Mon, Wed & Fri', JSON.stringify(s));
    await p.click('[data-pwpre="all"]');
    await p.waitForTimeout(200);
    s = await read();
    t.ok('Whole week: every night left (Sunday has gone), no leftovers', s.on.join() === 'mon,tue,wed,thu,fri,sat' && !s.lo.length && s.say === 'for Mon–Sat',
      JSON.stringify(s));
    await p.click('.pw-day[data-pwv="wed"]');
    await p.waitForTimeout(200);
    s = await read();
    t.ok('a day tapped after a preset changes just that day, and no preset stays lit', s.on.join() === 'mon,tue,thu,fri,sat' && !s.pre.length &&
      s.say === 'for Mon, Tue & Thu–Sat', JSON.stringify(s));
    t.ok('three nights in a row read as a span, the rest by name', s.say === 'for Mon, Tue & Thu–Sat', s.say);

    /* ---- a night that already has its dinner ---- */
    await p.evaluate(() => { const r = window.RECIPES.find((x) => x.book === 2 && x.secNum === 3); window.Store.addToDay(r.id, 'thu', 1); });
    await p.click('[data-pwpre="wk"]');
    await p.waitForTimeout(200);
    s = await read();
    t.ok('a lit night with a dinner already is marked, and the bar names it beside the nights it will fill',
      s.has.join() === 'thu' && s.say === 'for Mon–Wed & Fri · Thu has a dinner', JSON.stringify(s));
    await p.evaluate(() => {
      const r = window.RECIPES.find((x) => x.book === 2 && x.secNum === 3);
      ['mon', 'tue', 'wed', 'fri'].forEach((d) => window.Store.addToDay(r.id, d, 1));
    });
    await p.click('[data-pwpre="all"]');
    await p.click('[data-pwpre="wk"]');
    await p.waitForTimeout(200);
    s = await read();
    t.ok('every lit night already has one: 0 nights to fill, said by name, and the button waits',
      s.b === 0 && /^0 nights to fill/.test(s.cnt) && s.say === 'Mon–Fri already have dinners' && !s.go, JSON.stringify(s));

    /* ---- the same week: the nights picked are the nights kept ---- */
    await p.click('[data-pwpre="we"]');
    await p.waitForTimeout(200);
    await p.keyboard.press('Escape');
    await p.waitForTimeout(250);
    await open();
    s = await read();
    t.ok('reopened in the same week, the nights are the ones last picked', s.on.join() === 'sat' && s.pre.join() === 'we', JSON.stringify(s));
    await p.keyboard.press('Escape');
    await p.waitForTimeout(250);

    /* ---- 320 px: seven across, a thumb tall, and the bar's words whole ---- */
    const q = await t.fresh({ viewport: { width: 320, height: 700 }, colorScheme: 'dark' });
    await q.clock.setFixedTime(new Date(2026, 9, 12, 9, 0, 0));
    await q.reload();
    await q.waitForTimeout(900);
    await q.click('.tab[data-view="plan"]');
    await q.waitForTimeout(300);
    await q.click('#planMyWeek');
    await q.waitForTimeout(300);
    const narrow = await q.evaluate(() => {
      const strip = document.querySelector('.pw-days'), days = [...strip.querySelectorAll('.pw-day')].map((b) => b.getBoundingClientRect());
      const sb = strip.getBoundingClientRect(), cnt = document.querySelector('.pw-cnt').getBoundingClientRect(), go = document.querySelector('.pw-bar .pw-go').getBoundingClientRect();
      return { n: days.length, inside: days.every((r) => r.left >= sb.left - 0.5 && r.right <= sb.right + 0.5), tall: days.every((r) => r.height >= 44),
        rows: new Set(days.map((r) => Math.round(r.top))).size, apart: cnt.right <= go.left + 0.5 || go.top >= cnt.bottom - 0.5,
        page: document.documentElement.scrollWidth <= innerWidth };
    });
    t.ok('at 320 px the seven days sit on one row inside the strip, each 44 px tall, and the count never runs under the button',
      narrow.n === 7 && narrow.inside && narrow.tall && narrow.rows === 1 && narrow.apart && narrow.page, JSON.stringify(narrow));
    await q.context().close();

    t.ok('with no error on the page', errs.length === 0, errs.join(' | '));
    await p.context().close();
  },
};
