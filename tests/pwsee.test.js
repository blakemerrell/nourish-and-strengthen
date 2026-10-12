/* Plan my week: pick from what fits, see what landed.
 *
 * Blake: "I tried to plan my week and pick my dinners and it just auto put
 * some stuff there and didn't let me see the 11 that it selected", then "I
 * expect that when I click pick my dinners it would give me a selection to
 * pick my dinners". So Pick my dinners opens the dinners that fit: tick one
 * a night, Add them to the week, in the order ticked; or have the rest, or
 * all of them, picked by the usual rules. What lands is marked New, and the
 * toast's Undo takes it all off. Nothing sits under the bar at the bottom. */
module.exports = {
  name: 'Plan my week, see what fits',
  async run(t) {
    const p = await t.fresh({ viewport: { width: 390, height: 844 } });
    /* A Sunday morning: every night of the week is still ahead. */
    await p.clock.setFixedTime(new Date(2026, 8, 27, 9, 0, 0));
    await p.reload();
    await p.waitForTimeout(800);
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    /* Nights are kept for the week they were picked for (wk), so the four
       asked for here are this week's. */
    await p.evaluate(() => localStorage.setItem('sh.pw', JSON.stringify({ days: ['mon', 'tue', 'wed', 'thu'], ppl: 4, t: 45, prot: ['Chicken'], lo: 0, shelf: true, wk: window.Store.activeWeek().id })));
    await p.click('.tab[data-view="plan"]');
    await p.waitForTimeout(300);
    await p.click('#planMyWeek');
    await p.waitForTimeout(300);

    const bar = await p.evaluate(() => {
      const b = document.querySelector('.pw-sheet .pw-bar'), sh = document.querySelector('.pw-sheet .pw-body');
      return { n: Number(b.querySelector('.pw-cnt b').textContent), go: b.querySelector('.pw-go').textContent, see: !!b.querySelector('.pw-go[data-pwsee]'),
        after: (() => { let n = b.nextElementSibling, k = 0; while (n) { k++; n = n.nextElementSibling; } return k; })() };
    });
    t.ok('the count says how many fit, and Pick my dinners opens them; nothing sits under the bar',
      bar.n > 4 && bar.go === 'Pick my dinners' && bar.see && bar.after === 0, JSON.stringify(bar));
    await p.click('.pw-sheet .pw-go');
    await p.waitForTimeout(300);
    const list = await p.evaluate(() => ({
      h: document.querySelector('.pw-sheet .pw-h').textContent,
      rows: [...document.querySelectorAll('.pw-fit')].map((r) => ({ id: r.querySelector('[data-pwwant]').dataset.pwwant, name: r.querySelector('.pw-fn b').textContent,
        facts: r.querySelector('.pw-fn span').textContent })),
      pool: (() => { const a = window.__pw.answers(); return window.__pw.pool(a, false).length; })(),
    }));
    t.ok('it opens the dinners that fit, as many as it said, each with its time, calories and protein',
      list.h === 'The ' + bar.n + ' that fit' && list.rows.length === bar.n && list.rows.every((r) => /cal · \d+ g protein$/.test(r.facts)), JSON.stringify(list).slice(0, 400));

    /* A name opens the recipe; back comes back to the list. */
    await p.click('.pw-fit:nth-child(1) .pw-fn');
    await p.waitForTimeout(300);
    const rec = await p.evaluate(() => !!document.querySelector('.sheet:not(.pw-sheet)'));
    await p.goBack();
    await p.waitForTimeout(300);
    t.ok('a name opens its recipe, and back is the list again', rec && await p.evaluate(() => !!document.querySelector('.pw-fit')));

    /* Tick the third, then the first: that is their order. */
    const third = list.rows[2], first = list.rows[0];
    await p.click('[data-pwwant="' + third.id + '"]');
    await p.click('[data-pwwant="' + first.id + '"]');
    const ticked = await p.evaluate(() => ({ n: document.querySelector('.pw-sheet .pw-bar .pw-cnt b').textContent, go: document.querySelector('.pw-sheet .pw-bar .pw-go').textContent,
      or: document.querySelector('[data-pwpick="all"]').textContent, note: document.querySelector('.pw-tickl').textContent,
      after: !document.querySelector('.pw-sheet .pw-bar').nextElementSibling }));
    t.ok('2 ticked: Add 2 to my week, or add mine and pick the other 2, and nothing under the bar',
      ticked.n === '2' && ticked.go === 'Add 2 to my week' && ticked.or === 'Add mine, and pick the other 2 for me' && /2 nights still open/.test(ticked.note) && ticked.after, JSON.stringify(ticked));
    await p.click('[data-pwback]');
    await p.waitForTimeout(200);
    await p.click('.pw-sheet .pw-go');
    t.ok('back and in again, the ticks are kept', await p.evaluate(() => document.querySelectorAll('.pw-want[aria-pressed="true"]').length === 2));
    await p.click('[data-pwpick="all"]');
    await p.waitForTimeout(500);

    const wk = await p.evaluate(() => ({
      days: ['mon', 'tue', 'wed', 'thu'].map((d) => String((window.Store.day(d)[0] || {}).id || '')),
      fresh: [...document.querySelectorAll('#planGrid .day-item.new .day-new')].length,
      toast: (document.querySelector('#mToast:not([hidden])') || {}).textContent || '',
    }));
    t.ok('the ticked ones go on first, in the order ticked, and the other nights are filled',
      wk.days[0] === third.id && wk.days[1] === first.id && wk.days[2] && wk.days[3] && new Set(wk.days).size === 4, JSON.stringify(wk));
    t.ok('all four are marked New on the week', wk.fresh === 4, JSON.stringify(wk));
    t.ok('and the toast says so: 4 dinners added, your 2 and 2 picked for you, with Undo',
      /^4 dinners added/.test(wk.toast) && /Your 2, and 2 picked for you/.test(wk.toast) && /Undo$/.test(wk.toast), wk.toast);

    await p.click('#mToast [data-pwundo]');
    await p.waitForTimeout(300);
    const after = await p.evaluate(() => ({ days: ['mon', 'tue', 'wed', 'thu'].map((d) => window.Store.day(d).length).join(), fresh: document.querySelectorAll('#planGrid .day-item.new').length }));
    t.ok('Undo takes all four back off', after.days === '0,0,0,0' && after.fresh === 0, JSON.stringify(after));

    /* Only the ones ticked: one a night, and no more than the nights. */
    await p.click('#planMyWeek');
    await p.waitForTimeout(300);
    await p.click('.pw-sheet .pw-go');
    await p.waitForTimeout(300);
    const ids = await p.evaluate(() => [...document.querySelectorAll('[data-pwwant]')].map((b) => b.dataset.pwwant));
    for (const i of [0, 1, 2, 3]) await p.click('[data-pwwant="' + ids[i] + '"]');
    const cap = await p.evaluate(() => ({ on: document.querySelectorAll('.pw-want[aria-pressed="true"]').length, off: document.querySelectorAll('.pw-want:disabled').length,
      all: document.querySelectorAll('.pw-want').length, note: document.querySelector('.pw-tickl').textContent }));
    t.ok('four nights, four ticks: the rest grey out, and it says that is every night',
      cap.on === 4 && cap.off === cap.all - 4 && /every night/.test(cap.note), JSON.stringify(cap));
    await p.click('[data-pwwant="' + ids[3] + '"]');
    await p.click('[data-pwpick="mine"]');
    await p.waitForTimeout(500);
    const mine = await p.evaluate(() => ({ days: ['mon', 'tue', 'wed', 'thu'].map((d) => String((window.Store.day(d)[0] || {}).id || '')),
      fresh: document.querySelectorAll('#planGrid .day-new').length, toast: (document.querySelector('#mToast:not([hidden])') || {}).textContent || '' }));
    t.ok('Add 3 to my week: the three, on the first three nights, in the order ticked, and the fourth left open',
      mine.days.slice(0, 3).join() === ids.slice(0, 3).join() && mine.days[3] === '' && mine.fresh === 3 && /^3 dinners added/.test(mine.toast) && !/picked for you/.test(mine.toast), JSON.stringify(mine));
    await p.click('#mToast [data-pwundo]');
    await p.waitForTimeout(300);

    /* All of them picked for you: still marked New, and said so. */
    await p.click('#planMyWeek');
    await p.waitForTimeout(300);
    await p.click('.pw-sheet .pw-go');
    await p.click('[data-pwpick="all"]');
    await p.waitForTimeout(500);
    const plain = await p.evaluate(() => ({ fresh: document.querySelectorAll('#planGrid .day-new').length, toast: (document.querySelector('#mToast:not([hidden])') || {}).textContent || '' }));
    t.ok('picked for you, the four are marked New and the toast says so', plain.fresh === 4 && /^4 dinners added/.test(plain.toast) && /Picked for you/.test(plain.toast), JSON.stringify(plain));
    await p.click('.tab[data-view="browse"]');
    await p.click('.tab[data-view="plan"]');
    await p.waitForTimeout(300);
    t.ok('New is for the visit: away and back, the marks are gone', await p.evaluate(() => document.querySelectorAll('#planGrid .day-new').length === 0));

    t.ok('no page errors', errs.length === 0, errs.join(' | '));
    await p.context().close();
  },
};
