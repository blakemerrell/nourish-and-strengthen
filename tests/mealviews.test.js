/* Every meal's view at once, the day said as a date that opens a calendar,
 * and the week strip moved a week at a time.
 *
 * Blake, 2026-10-18, pointing at the day's head: "Add a button here that lets
 * me cycle through the triple tap for all meals. Collapse, show foods, show.
 * Edit foods" (beside the gear, he chose), "make that date box look. Like
 * it belongs. And shorter", and then "simply just show the date right there
 * and let it be clickable so I can get a calendar ... Also be a way for me
 * to scroll to Future or past weeks within reason" (a swipe on the week, and
 * the arrows a week, he chose). */
const SETUP = () => {
  localStorage.setItem('bsc.macroProfile', JSON.stringify({ sex: 'm', age: 43, ft: 5, inch: 11, lb: 192, act: 1.55, goal: 'cut1' }));
  localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 190, f: 70, c: 230 }));
  localStorage.setItem('bsc.macroSlots', JSON.stringify({ list: [{ k: 'b', n: 'Breakfast', t: 'b' }, { k: 'l', n: 'Lunch', t: 'l' },
    { k: 'd', n: 'Dinner', t: 'd' }, { k: 's', n: 'Snacks', t: 's' }], names: { b: 'Breakfast', l: 'Lunch', d: 'Dinner', s: 'Snacks' } }));
  const f = (k, x) => ({ id: 'f:' + k, x: x, eaten: 0 });
  localStorage.setItem('bsc.macroDays', JSON.stringify({ '2026-10-08': {
    b: [f('egg', 2)], l: [f('chicken_breast', 1), f('green_beans', 1)], d: [{ id: 66, x: 1, eaten: 0 }] },
    // the first day ever logged, four months back: older than the 120 days that used to be all there was
    '2026-06-01': { b: [f('egg', 1)] } }));
};
// the three meals with food on them, Breakfast, Lunch and Dinner: an empty meal has nothing to fold
const views = (p) => p.evaluate(() => [...document.querySelectorAll('#macroSlots [data-mview]')].map((b) => Number(b.dataset.mv)).join(''));
const button = (p) => p.evaluate(() => {
  const b = document.getElementById('macroViews'), r = b.getBoundingClientRect();
  return { icon: !!b.querySelector('svg.mday-ic'),
    say: b.getAttribute('aria-label'), w: r.width, h: r.height, hidden: b.hidden };
});

/* Every meal's view is back on the head row beside the menu (2026-10-30). */
const pressViews = async (p) => {
  await p.click('#macroViews');
  await p.waitForTimeout(80);
};

module.exports = {
  name: 'Every meal’s view at once, and the day box',
  async run(t) {
    const errs = [];
    const open = async (vp, opts) => {
      const p = await t.fresh({ viewport: vp, ...(opts || {}) });
      p.on('pageerror', (e) => errs.push(e.message));
      await p.clock.setFixedTime(new Date(2026, 9, 8, 10, 0, 0));
      await p.reload();
      await p.waitForTimeout(500);
      await p.evaluate(SETUP);
      await p.reload();
      await p.waitForTimeout(700);
      await p.click('.tab[data-view="macros"]');
      await p.waitForTimeout(400);
      return p;
    };
    const p = await open({ width: 390, height: 844 });

    const head = await p.evaluate(() => {
      const ids = [...document.querySelectorAll('.mday-head > :not(.mday-menu)')].filter((e) => !e.hidden).map((e) => e.id || e.className);
      const sel = document.getElementById('macroDate'), cs = getComputedStyle(sel), r = sel.getBoundingClientRect();
      const box = document.getElementById('macroDayPick').getBoundingClientRect();
      const tops = [...document.querySelectorAll('.mday-head > :not(.mday-menu)')].filter((e) => !e.hidden && e.getBoundingClientRect().height)
        .map((e) => Math.round(e.getBoundingClientRect().top + e.getBoundingClientRect().height / 2));
      return { ids, said: document.getElementById('macroDateTx').textContent, w: r.width, h: r.height, bg: cs.backgroundColor,
        ring: cs.boxShadow, oneRow: Math.max(...tops) - Math.min(...tops) <= 2,
        over: box.left <= r.left + 1 && box.right >= r.right - 1 && box.height >= 30,
        title: document.querySelector('.mday-title').getBoundingClientRect().width,
        listen: document.getElementById('macroDayPick').getAttribute('aria-label') };
    });
    /* One row (2026-10-30): the day's box (holding the calendar date badge
       and the day's calories + filling water droplet), every meal's view
       button (•••), and the menu (☰). */
    const sum = await p.evaluate(() => {
      const b = document.getElementById('macroSum'), cs = getComputedStyle(b);
      const kc = document.getElementById('macroTrayHead');
      const calIc = b.querySelector('.mday-cal-ic');
      const drop = kc ? kc.querySelector('.mpillwk-drop') : null;
      return { ring: cs.boxShadow, h: b.getBoundingClientRect().height,
        holds: !!b.querySelector('#macroDate') && !!kc && !!calIc && !!drop,
        kcal: kc ? kc.textContent : '',
        kh: kc ? kc.getBoundingClientRect().height : 0 };
    });
    t.ok('the row is the day\u2019s box, the meal views button and the menu, on one line',
      head.ids.slice(1).join() === 'macroSum,macroViews,macroMore' && head.oneRow, JSON.stringify(head));
    t.ok('the day\u2019s box holds the calendar date badge and the calories + filling water droplet, a thumb tall, and no box round it',
      sum.holds && /kcal/.test(sum.kcal) && /oz/.test(sum.kcal) && sum.kh >= 44 && sum.h >= 44 &&
        /* no box round it since 2026-10-30 (Blake: "I don't need a box around that") */
        !/1\.5px/.test(sum.ring), JSON.stringify(sum));
    t.ok('the day is said as its date, a thumb tall, today told as Today to a listener',
      head.said === 'Thu, Oct 8' && head.h >= 44 && head.listen === 'Today, Thu, Oct 8. Choose a day', JSON.stringify(head));
    t.ok('with the calendar\u2019s box over the whole of the date',
      /rgba\(0, 0, 0, 0\)|transparent/.test(head.bg) && head.over, JSON.stringify(head));
    t.ok('on a 390 px phone the title gives the row its room (the tab above says Nourish)', head.title <= 1 && head.w >= 44, JSON.stringify(head));


    /* Blake, 2026-10-24: the gear a hamburger, no "Nourish" word on the row,
       and the top-left skep logo button carries the sync colour across every tab. */
    const hdr = await p.evaluate(() => {
      const g = document.getElementById('macroMore'), sb = document.getElementById('syncBtn');
      return { burger: !!g.querySelector('svg.mday-burger') && !/\u2699/.test(g.textContent),
        label: g.getAttribute('aria-label'),
        skep: !!sb.querySelector('svg.brand-skep'), tone: sb.getAttribute('data-tone'),
        pill: getComputedStyle(sb).display,
        say: (document.getElementById('macroSyncSay') || {}).textContent };
    });
    t.ok('the menu is three lines, and the top-left skep logo button stays visible on Nourish with its sync tone',
      hdr.burger && hdr.skep && hdr.tone === 'local' && hdr.pill !== 'none', JSON.stringify(hdr));
    t.ok('the sync status says what it means, on the menu and inside it: on this phone only',
      hdr.label === 'Nourish menu. On this phone only' && hdr.say === 'On this phone only', JSON.stringify(hdr));
    const tones = await p.evaluate(() => {
      const f = window.__macroLab.syncTone, r = (a, b, c) => { const x = f(a, b, c); return (x.tone || 'grey') + ':' + x.say; };
      return [r('synced', false, false), r('local', false, true), r('sending', false, true), r('waiting', false, false),
        r('error', false, true), r('synced', true, true), r('local', false, false)].join('|');
    });
    t.ok('green when the household or your account has it all, amber on its way or with no signal, red when it stopped, grey on this phone only',
      tones === 'on:All synced|on:All synced|wait:Sending\u2026|wait:No signal|off:Sync has stopped|off:Sync has stopped|grey:On this phone only', tones);
    await p.click('.tab[data-view="browse"]');
    const pillBack = await p.evaluate(() => getComputedStyle(document.getElementById('syncBtn')).display);
    await p.click('.tab[data-view="macros"]');
    await p.waitForTimeout(200);
    t.ok('every tab keeps the top-left skep logo button visible', pillBack !== 'none', pillBack);
    const wide = await open({ width: 1280, height: 900 });
    const wideTitle = await wide.evaluate(() => document.querySelector('.mday-title').getBoundingClientRect().width);
    t.ok('and the title is for a screen reader at every width, not only on a phone', wideTitle <= 1, wideTitle);
    await wide.context().close();

    /* Two views since 2026-11-06 (Blake: the third "just shows me macros.
       It's really not that helpful"): a meal's name opens and folds it, and
       the button beside the menu folds every meal, or opens them all when
       every one is folded. */
    let b = await button(p);
    t.ok('meals all open: the button draws its icon and offers to fold every meal',
      (await views(p)) === '222' && b.icon && b.say === 'Fold every meal' && b.w >= 44 && b.h >= 44, JSON.stringify(b));
    await pressViews(p);
    t.ok('pressed, every meal folds to its rings, and the button offers to open them all',
      (await views(p)) === '111' && (await button(p)).say === 'Open every meal');
    await pressViews(p);
    t.ok('again, every meal opens to its foods', (await views(p)) === '222');

    await p.click('#macroSlots [data-mview="l"]');
    b = await button(p);
    const lunchSays = await p.evaluate(() => document.querySelector('#macroSlots [data-mview="l"]').getAttribute('aria-expanded'));
    t.ok('a meal’s own name folds that meal alone and says so, and the button still offers to fold the rest',
      (await views(p)) === '212' && lunchSays === 'false' && b.say === 'Fold every meal', JSON.stringify([b, lunchSays]));
    await pressViews(p);
    t.ok('pressed with meals in both views, every meal folds', (await views(p)) === '111');
    await p.click('#macroSlots [data-mview="d"]');
    t.ok('a name opens its meal again from there', (await views(p)) === '112', await views(p));
    await p.click('#macroSlots [data-mview="d"]');
    t.ok('and folds it on the next press: two views, never a third', (await views(p)) === '111', await views(p));
    await p.click('#macroSlots [data-mview="d"]');

    /* What the third view held moved: the scale (Balance) is on an open
       card now, and no shut food carries a line of numbers under it. */
    const opened = await p.evaluate(() => {
      const d = document.querySelector('#macroSlots .mtray[data-mslot="d"]');
      return { bal: !!d.querySelector('[data-mbal]'), quiet: document.querySelectorAll('#macroSlots .mfl-q').length,
        chev: !!d.querySelector('.mtray-hd .mtray-chev') };
    });
    t.ok('an open meal has the scale beside + and ⊘, a chevron on its name, and no line of numbers under its shut foods',
      opened.bal && opened.quiet === 0 && opened.chev, JSON.stringify(opened));

    /* Ticking a meal's last food folds it to its rings, a beat later, so
       the tick is seen landing first; a meal opened or folded by its own
       name today is left as it was set. */
    const q = await open({ width: 390, height: 844 });
    await q.click('#macroSlots .mtray[data-mslot="b"] input[data-meat]');
    const atOnce = (await views(q)).charAt(0);
    await q.waitForTimeout(1200);
    const later = (await views(q)).charAt(0);
    t.ok('ticking breakfast’s last food leaves it open a beat, then folds it', atOnce === '2' && later === '1', atOnce + later);
    await q.click('#macroSlots [data-mview="l"]');
    await q.click('#macroSlots [data-mview="l"]');
    // each tick redraws the card, so the next box is found afresh
    for (let i = 0; i < 2; i++) await q.click('#macroSlots .mtray[data-mslot="l"] input[data-meat]:not(:checked)');
    await q.waitForTimeout(1200);
    t.ok('a meal opened by its own name stays open when its last food is ticked', (await views(q)).charAt(1) === '2', await views(q));
    await q.context().close();

    /* ---- the date's calendar, and weeks ---- */
    const day = () => p.evaluate(() => [document.getElementById('macroDayPick').value, document.getElementById('macroDateTx').textContent,
      [...document.querySelectorAll('#macroWeek [data-mweek]')].map((b) => b.dataset.mweek.slice(8)).join(' ')]);
    const cal = await p.evaluate(() => { const b = document.getElementById('macroDayPick'); return [b.type, b.min, b.max]; });
    t.ok('the date is a calendar, from the first day ever logged to a week ahead', cal.join() === 'date,2026-06-01,2026-10-15', cal.join());
    const swipe = (dx) => p.evaluate((dx2) => {
      const w = document.getElementById('macroWeek'), r = w.getBoundingClientRect(), y = r.top + r.height / 2, x = r.left + r.width / 2;
      const touch = (cx) => new Touch({ identifier: 1, target: w, clientX: cx, clientY: y });
      w.dispatchEvent(new TouchEvent('touchstart', { touches: [touch(x)], changedTouches: [touch(x)], bubbles: true }));
      w.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [touch(x + dx2)], bubbles: true }));
    }, dx);
    await p.evaluate(() => { const b = document.getElementById('macroDayPick'); b.value = '2026-07-04'; b.dispatchEvent(new Event('change', { bubbles: true })); });
    await p.waitForTimeout(200);
    let d = await day();
    t.ok('a date picked on it, months back, goes there, and the week strip shows that week', d[0] === '2026-07-04' && d[1] === 'Sat, Jul 4' && d[2] === '29 30 01 02 03 04 05', JSON.stringify(d));
    await swipe(-120);
    await p.waitForTimeout(150);
    d = await day();
    t.ok('swiping left steps a week on, the same day of the week', d[0] === '2026-07-11' && d[2] === '06 07 08 09 10 11 12', JSON.stringify(d));
    await swipe(120);
    await swipe(120);
    await p.waitForTimeout(150);
    t.ok('and swiping right a week back', (await day())[0] === '2026-06-27');
    // Jun 20, Jun 13, Jun 6, and then a week back would be May 30, before the first day logged (Jun 1)
    for (let i = 0; i < 4; i++) await swipe(120);
    await p.waitForTimeout(150);
    d = await day();
    t.ok('a week back past the first day logged stops on it, rather than doing nothing', d[0] === '2026-06-01', JSON.stringify(d));
    await p.evaluate(() => { const b = document.getElementById('macroDayPick'); b.value = '2026-10-08'; b.dispatchEvent(new Event('change', { bubbles: true })); });
    await swipe(-120);
    await p.waitForTimeout(150);
    t.ok('a swipe left across the week strip goes to the week after', (await day())[0] === '2026-10-15');
    await swipe(120);
    await swipe(120);
    await p.waitForTimeout(150);
    t.ok('and a swipe right, the week before', (await day())[0] === '2026-10-01');
    await swipe(20);
    await p.waitForTimeout(150);
    t.ok('a nudge too small to mean it moves nothing', (await day())[0] === '2026-10-01');
    await p.context().close();

    /* 320 px, dark: one row, nothing wider than the screen */
    const n = await open({ width: 320, height: 640 }, { colorScheme: 'dark' });
    const narrow = await n.evaluate(() => {
      const kids = [...document.querySelectorAll('.mday-head > :not(.mday-menu)')].filter((e) => !e.hidden && e.getBoundingClientRect().height);
      const tops = kids.map((e) => Math.round(e.getBoundingClientRect().top + e.getBoundingClientRect().height / 2));
      const head = document.querySelector('.mday-head').getBoundingClientRect();
      const sum = document.getElementById('macroSum').getBoundingClientRect(), kc = document.getElementById('macroTrayHead');
      return { oneRow: Math.max(...tops) - Math.min(...tops) <= 2, inside: kids.every((e) => e.getBoundingClientRect().right <= head.right + 0.5),
        kcalIn: [...kc.querySelectorAll('span, b')].every((e) => !e.getBoundingClientRect().width || e.getBoundingClientRect().right <= sum.right + 0.5),
        page: document.documentElement.scrollWidth <= innerWidth, day: document.getElementById('macroDate').getBoundingClientRect().width,
        whole: (() => { const tx = document.getElementById('macroDateTx'); return tx.scrollWidth <= tx.clientWidth; })(),
        // the fold-every-meal button keeps its icon this narrow
        icon: (() => { const ic = document.querySelector('#macroViews svg'); return ic ? ic.getBoundingClientRect().width : 0; })() };
    });
    t.ok('at 320 px in the dark the head stays one row, inside the screen, the calories inside their box, the date whole and the fold button\u2019s icon shown',
      narrow.oneRow && narrow.inside && narrow.kcalIn && narrow.page && narrow.day >= 44 && narrow.whole && narrow.icon >= 16, JSON.stringify(narrow));
    await n.context().close();

    t.ok('with no error on the page', errs.length === 0, errs.join(' | '));
  },
};
