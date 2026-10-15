/* Trays and the meal sheet (Blake, 2026-10-04).
 *
 * Blake, of the RP-style day: "The main page is worse now. Way to fat and
 * tall... hard to know where to add food... Many ways." So the day is small
 * trays (the meal's tick, its name, its calories against its share, its foods
 * as small lines) and a meal opens as ONE sheet: its pills, its foods dialled
 * in grams ("I dial in grams of food not kitchen measurements"), and the
 * picker under them, where a tap puts a food straight on the meal. No basket,
 * no "Add N", no per-meal Add, no Open all. Mockup:
 * https://claude.ai/artifact/SseR1TPa4JAFNanYYsGP4k */
const DAY = '2026-10-06';
const LUNCH = ['chicken_breast', 'rice_cooked', 'broccoli', 'black_beans', 'salsa', 'avocado', 'olive_oil'];

const SETUP = (lunch) => {
  localStorage.setItem('bsc.macroProfile', JSON.stringify({ sex: 'm', age: 43, ft: 5, inch: 11, lb: 192, act: 1.55, goal: 'cut1' }));
  localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 190, f: 70, c: 230 }));
  localStorage.setItem('bsc.macroSlots', JSON.stringify({ list: [{ k: 'w', n: 'Wake Up', t: 's' }, { k: 'b', n: 'Breakfast', t: 'b' },
    { k: 'l', n: 'Lunch', t: 'l' }, { k: 'd', n: 'Dinner', t: 'd' }], names: { w: 'Wake Up', b: 'Breakfast', l: 'Lunch', d: 'Dinner' } }));
  localStorage.setItem('bsc.macroSkip', JSON.stringify({ '2026-10-06': ['w'] }));
  const f = (k, x, e) => ({ id: 'f:' + k, x: x, eaten: e ? 1 : 0 });
  const wrap = window.RECIPES.find((r) => /Buffalo Chicken Lettuce/i.test(r.name)) || window.RECIPES.find((r) => r.macro && r.name.length > 24);
  localStorage.setItem('bsc.macroDays', JSON.stringify({
    '2026-10-05': { d: [f('banana', 1, 1), f('egg', 2, 1)] },
    '2026-10-06': {
      b: [f('greek_yogurt', 1, 1), f('oats', 0.75, 1)],
      l: lunch.map((k) => f(k, 1)),
      d: [{ id: wrap.id, x: 1, eaten: 0 }, f('whey', 1)],
    } }));
};
// the meal's rows live in its tray along the bottom (2026-10-05), which opens shut
const openTray = async (p) => {
  // pressed whenever it shows: the tray shut, or a word in the search (2026-10-08)
  if (await p.isVisible('#modalRoot .msh-tray .msh-trn')) { await p.click('#modalRoot .msh-tray .msh-trn'); await p.waitForTimeout(250); }
};
const mealOf = (p, sk) => p.evaluate((a) => JSON.parse(localStorage.getItem('bsc.macroDays'))[a[0]][a[1]] || [], [DAY, sk]);

module.exports = {
  name: 'Trays and the meal sheet: one way to add food, grams for everything',
  async run(t) {
    const p = await t.fresh({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await p.clock.setFixedTime(new Date(2026, 9, 6, 11, 30, 0));
    await p.reload();
    await p.waitForTimeout(700);
    await p.evaluate(SETUP, LUNCH);
    await p.reload();
    await p.waitForTimeout(900);
    await p.click('.tab[data-view="macros"]');
    await p.waitForTimeout(600);

    /* ---- the day: trays ---- */
    const day = await p.evaluate(() => {
      const tr = [...document.querySelectorAll('#macroSlots .mtray')];
      const lunch = document.querySelector('[data-mopen="l"]').closest('.mtray');
      const lines = [...lunch.querySelectorAll('.mtray-f')].map((x) => x.textContent);
      return { trays: tr.length, skip: document.querySelectorAll('#macroSlots .mtray-skip').length,
        skipText: (document.querySelector('.mtray-skip') || {}).textContent,
        lines: lines, grams: lines.every((l) => / (g|mL)$/.test(l)),
        caps: lunch.querySelectorAll('.mtray-caps .mcap').length,
        measured: lines.filter((l) => /(cups?|tbsp|whole|lb)/.test(l)).length,
        tick: !!lunch.querySelector('.mday-dot[data-mdot="l"]'),
        controls: lunch.querySelectorAll('button').length, ticks: lunch.querySelectorAll('input.mitem-ate[data-meat]').length,
        add: !!document.getElementById('macroAdd'), openAll: !!document.getElementById('macroOpenAll'),
        bar: [...document.querySelectorAll('.mday-acts button')].filter((b) => b.offsetParent).map((b) => b.id) };
    });
    t.ok('the day is one small tray a meal, and a skipped meal is one line', day.trays === 3 && day.skip === 1 &&
      /Wake Up/i.test(day.skipText) && /skipped/.test(day.skipText), JSON.stringify(day));
    t.ok('a tray: the tick, the meal\u2019s four pills, and its foods as lines ending in grams', day.tick && day.lines.length === 7 &&
      day.grams && day.caps === 4, JSON.stringify(day));
    t.ok('each food in the kitchen\u2019s words before its weight (Blake: "if I just want to eyeball it I can")', day.measured === 7, JSON.stringify(day.lines));
    /* Since 2026-10-08 each food is a line of its own (tests/daylines.test.js):
       its name, the line itself and its own tick. Since 2026-10-10 the
       card's head is its name (which steps its views) and three drawings:
       +, the scale and ⊘. Lunch is the next meal, so it is on Details. */
    t.ok('and nothing else to press on it: the tick, its name, + ⚖ ⊘, the tray itself, and each food’s name, line and tick',
      day.controls === 6 + 2 * day.lines.length && day.ticks === day.lines.length, JSON.stringify(day));
    t.ok('the bar is Rebalance, Sweep, Copy day and the one primary: no Add food, no Open all', !day.add && !day.openAll &&
      day.bar.join() === 'macroRebal,macroSweep,macroCopy,macroFill', JSON.stringify(day.bar));

    /* ---- the sheet ---- */
    await p.click('[data-mopen="l"]');
    await p.waitForTimeout(500);
    /* A meal with food on it opens on its foods, up in the page over the
       search (Blake, 2026-10-08: "the foods that I have in my basket are
       collapsed and it's really hard to edit them"), and the tray's strip of
       chips steps out while they are there. */
    const up = await p.evaluate(() => {
      const on = document.querySelector('#modalRoot .msh-on'), find = document.querySelector('#modalRoot .msh-find');
      const strip = document.querySelector('#modalRoot .msh-tray .msh-trc');
      return { rows: on ? on.querySelectorAll('.mrow').length : 0,
        above: !!on && !!find && on.getBoundingClientRect().bottom <= find.getBoundingClientRect().top + 1,
        strip: !!strip && getComputedStyle(strip).display !== 'none' };
    });
    t.ok('the sheet opens on its foods, one row a food, above the search; the tray’s chips step out',
      up.rows === 7 && up.above && !up.strip, JSON.stringify(up));
    await openTray(p);
    const sh = await p.evaluate(() => {
      const s = document.querySelector('#modalRoot .msheet');
      if (!s) return null;
      const rows = [...s.querySelectorAll('.mrows .mrow')];
      return { caps: s.querySelectorAll('.msh-top .mcap').length, rows: rows.length,
        ticks: s.querySelectorAll('.mrows [data-meat], .mrows .mday-dot').length,
        dial: rows.every((r) => r.querySelector('[data-mstep$=":down"]') && r.querySelector('[data-mstep$=":up"]') && r.querySelector('[data-mfmenu]') &&
          / g$/.test(r.querySelector('.mstep-x').textContent)),
        find: !!s.querySelector('.msh-find #mpFind'), shelves: !!s.querySelector('.msh-find #mpShelves'),
        basket: !!s.querySelector('[data-mpdone], [data-mpbasket]'), tall: Math.max.apply(null, rows.map((r) => r.offsetHeight)) };
    });
    t.ok('opened, the tray is one row a food, under the meal\'s four pills', !!sh && sh.caps === 4 && sh.rows === 7, JSON.stringify(sh));
    t.ok('every food: − grams + and ⋯, and no tick of its own', sh && sh.dial && sh.ticks === 0, JSON.stringify(sh));
    t.ok('the rows are compact', sh && sh.tall <= 72, JSON.stringify(sh));
    t.ok('under them, the picker: the search box and the shelves, and no basket or Add', sh && sh.find && sh.shelves && !sh.basket, JSON.stringify(sh));

    /* + dials five grams */
    const x0 = (await mealOf(p, 'l'))[0].x;
    await p.click('#modalRoot [data-mstep="l:0:up"]');
    await p.waitForTimeout(250);
    const x1 = (await mealOf(p, 'l'))[0].x;
    const g = await p.evaluate(() => document.querySelector('#modalRoot [data-mtype="l:0"]').textContent);
    t.ok('+ dials it up five grams, in the sheet', Math.round(x1 * 140) === Math.round(x0 * 140) + 5 &&
      g === Math.round(x1 * 140) + ' g' && !!(await p.$('#modalRoot .msheet')), JSON.stringify({ x0, x1, g }));
    t.ok('and an amount you dial is yours: Kept, so the re-fit works around it', (await mealOf(p, 'l'))[0].l === 1);

    /* the food's ⋯ */
    await p.click('#modalRoot [data-mfmenu="l:5"]');
    await p.waitForTimeout(250);
    const menu = await p.evaluate(() => [...document.querySelectorAll('#modalRoot .mrow-menu .mfood-mi')].map((b) => b.textContent.trim()));
    t.ok('⋯ on a food holds Lock, Swap, Move to…, Pin, Favourite and Remove', menu.join('|') === 'Lock the amount|Swap|Move to\u2026|Pin to Lunch|Favourite|Remove', JSON.stringify(menu));
    await p.click('#modalRoot .mrow-menu [data-mlock="l:5"]');
    await p.waitForTimeout(250);
    t.ok('Lock holds the avocado, and the menu closes', (await mealOf(p, 'l'))[5].l === 1 &&
      !(await p.$('#modalRoot .mrow-menu')), '');

    /* Balance, in the tray: everything moves again, what you set included,
       and what moved says what it was. No Undo (Blake: "No need for undo.
       I can simply remove that from my tray"). */
    const before = await mealOf(p, 'l');
    await p.click('#modalRoot .msh-tray [data-mbal="l"]');
    await p.waitForTimeout(400);
    const after = await mealOf(p, 'l');
    const bal = await p.evaluate(() => ({ was: [...document.querySelectorAll('#modalRoot .mrow-g small')].filter((s) => /^was /.test(s.textContent)).length,
      undo: !!document.querySelector('#modalRoot [data-mbalundo], #modalRoot .mcard-undo') }));
    const changed = after.filter((it, i) => it.x !== before[i].x).length;
    t.ok('Balance lets go of what you kept and locked: nothing on the meal is held after it', after.every((it) => !it.l), JSON.stringify(after));
    t.ok('what moved says what it was, and there is no Undo', changed > 0 && bal.was === changed && !bal.undo, JSON.stringify({ changed, bal }));

    /* the meal's ⋯ */
    await p.click('#modalRoot [data-mmenu="l"]');
    await p.waitForTimeout(250);
    const mm = await p.evaluate(() => [...document.querySelectorAll('#modalRoot .msh-menu .mfood-mi')].map((b) => b.textContent.trim()));
    t.ok('the meal\'s ⋯ holds Try another, Save meal and Repeat a day', mm.join('|') === 'Try another|Save meal|Repeat a day', JSON.stringify(mm));
    await p.click('#modalRoot .msh-t');
    await p.waitForTimeout(200);
    t.ok('a tap elsewhere closes it', !(await p.$('#modalRoot .msh-menu')));

    /* the tick, in the sheet, completes the meal; Done goes back to the day */
    await p.click('#modalRoot .msh-h [data-mdot="l"]');
    await p.waitForTimeout(300);
    t.ok('the sheet\'s tick marks every food on the meal eaten', (await mealOf(p, 'l')).every((it) => it.eaten));
    const spent = await p.evaluate(() => [...document.querySelectorAll('#modalRoot [data-mstep="l:0:up"]')].every((b) => b.disabled));
    t.ok('and an eaten meal\'s dials go quiet', spent);
    await p.click('#modalRoot .msheet .msh-done');
    await p.waitForTimeout(400);
    t.ok('Done goes back to the day, the tray ticked', !(await p.$('#modalRoot .msheet')) &&
      await p.evaluate(() => document.querySelector('[data-mopen="l"]').closest('.mtray').classList.contains('done')));

    /* ---- adding: one tap, straight onto the meal ---- */
    await p.click('[data-mopen="d"]');
    await p.waitForTimeout(500);
    await openTray(p);
    const n0 = (await mealOf(p, 'd')).length;
    const ban = await p.$('#modalRoot [data-mpick="f:banana"]');
    t.ok('Recent offers what dinner has had', !!ban);
    if (ban) {
      await p.click('#modalRoot [data-mpick="f:banana"]');
      await p.waitForTimeout(400);
      const d1 = await mealOf(p, 'd');
      const on = await p.evaluate(() => {
        const freshRow = [...document.querySelectorAll('#modalRoot .mrows .mrow')].find((r) => /Banana/i.test(r.textContent) && r.classList.contains('fresh'));
        const otherRow = [...document.querySelectorAll('#modalRoot .mrows .mrow')].find((r) => !r.classList.contains('fresh'));
        return {
          pressed: (document.querySelector('#modalRoot [data-mpick="f:banana"]') || {}).getAttribute('aria-pressed'),
          row: !!freshRow,
          freshTint: !!freshRow && !!otherRow && getComputedStyle(freshRow).backgroundColor !== getComputedStyle(otherRow).backgroundColor,
        };
      });
      t.ok('a tap puts it on dinner at once, at what you had last time, marked New and tinted in the tray',
        d1.length === n0 + 1 && d1[d1.length - 1].id === 'f:banana' && d1[d1.length - 1].x === 1 && on.pressed === 'true' && on.row && on.freshTint, JSON.stringify({ d1, on }));
      await p.click('#modalRoot [data-mpick="f:banana"]');
      await p.waitForTimeout(400);
      t.ok('a second tap takes it back off', (await mealOf(p, 'd')).length === n0);
    }

    /* Swap: the marked plate is replaced by the next tap */
    await p.click('#modalRoot [data-mfmenu="d:1"]');
    await p.waitForTimeout(200);
    await p.click('#modalRoot .mrow-menu [data-mswap="d:1"]');
    await p.waitForTimeout(300);
    t.ok('Swap marks the plate and says what to do', !!(await p.$('#modalRoot .mrow.swapping .mrow-swap')));
    await p.click('#modalRoot [data-mpick="f:banana"]');
    await p.waitForTimeout(400);
    const sw = await mealOf(p, 'd');
    t.ok('and the next tap takes its place', sw.length === n0 && sw[1].id === 'f:banana', JSON.stringify(sw));

    /* grams for everything, each by its own step */
    const st = await p.evaluate(() => {
      const r = [...document.querySelectorAll('#modalRoot .mrows .mrow')];
      return r.map((x) => x.querySelector('.mstep-x').textContent);
    });
    await p.click('#modalRoot [data-mstep="d:0:up"]');
    await p.waitForTimeout(250);
    const st2 = await p.evaluate(() => document.querySelector('#modalRoot [data-mtype="d:0"]').textContent);
    const g0 = parseInt(st[0].replace(/[^\d]/g, ''), 10), g1 = parseInt(st2.replace(/[^\d]/g, ''), 10);
    t.ok('a recipe dials in grams from its serving weight, five at a time', /^~?[\d,]+ g$/.test(st[0]) && g1 - g0 >= 1 && g1 - g0 <= 5 && g1 % 5 === 0, JSON.stringify({ st, st2 }));

    /* the pins: the header and pills always; the search under them once scrolled */
    await p.evaluate(() => { const s = document.querySelector('#modalRoot .scrim'); s.scrollTop = 900; });
    await p.waitForTimeout(250);
    const pin = await p.evaluate(() => {
      const top = document.querySelector('#modalRoot .msh-top').getBoundingClientRect();
      const find = document.querySelector('#modalRoot .msh-find').getBoundingClientRect();
      const sheet = document.querySelector('#modalRoot .msheet').getBoundingClientRect();
      const scrim = document.querySelector('#modalRoot .scrim');
      return { scrolled: scrim.scrollTop, topAt: Math.round(top.top), findAt: Math.round(find.top), topBottom: Math.round(top.bottom), sheetTop: Math.round(sheet.top) };
    });
    t.ok('scrolled, the meal\'s header and pills stay pinned, and the search and shelves under them',
      pin.scrolled > 200 && pin.topAt <= 2 && Math.abs(pin.findAt - pin.topBottom) <= 2, JSON.stringify(pin));
    const trayAt = await p.evaluate(() => Math.round(innerHeight - document.querySelector('#modalRoot .msh-tray').getBoundingClientRect().bottom));
    t.ok('and the tray stays pinned along the bottom, Balance and Done under the thumb', Math.abs(trayAt) <= 2 &&
      !!(await p.$('#modalRoot .msh-tray .msh-bal')) && !!(await p.$('#modalRoot .msh-tray .msh-done')), String(trayAt));

    /* Typing in the search keeps the plate card anchored at the top without
       flopping to the bottom strip; explicitly collapsing [data-mtray="0"]
       sends it to the bottom chips and tapping a chip brings it back up. */
    await p.fill('#mpFind', 'egg');
    await p.waitForTimeout(300);
    const whileTyping = await p.evaluate(() => {
      const on = document.querySelector('#modalRoot .msh-on');
      return {
        on: !!on && getComputedStyle(on).display !== 'none',
        strip: getComputedStyle(document.querySelector('#modalRoot .msh-tray .msh-trc')).display !== 'none',
      };
    });
    t.ok('typing in the search keeps the plate card anchored at the top without flopping to the bottom strip',
      whileTyping.on && !whileTyping.strip, JSON.stringify(whileTyping));
    await p.click('#modalRoot .msh-on [data-mtray="0"]');
    await p.waitForTimeout(250);
    const typing = await p.evaluate(() => ({ on: !!document.querySelector('#modalRoot .msh-on'),
      strip: getComputedStyle(document.querySelector('#modalRoot .msh-tray .msh-trc')).display !== 'none',
      chips: document.querySelectorAll('#modalRoot .msh-tray .msh-chip').length }));
    t.ok('collapsing the plate card puts the foods in the tray\u2019s chips, one a food', !typing.on && typing.strip &&
      typing.chips > 0, JSON.stringify(typing));
    await p.click('#modalRoot .msh-tray .msh-chip');
    await p.waitForTimeout(300);
    const back = await p.evaluate(() => {
      const on = document.querySelector('#modalRoot .msh-on');
      return { on: !!on && getComputedStyle(on).display !== 'none', q: document.getElementById('mpFind').value,
        top: document.querySelector('#modalRoot .scrim').scrollTop };
    });
    t.ok('and a chip brings them back up, the word cleared, the sheet at its top', back.on && back.q === '' && back.top === 0, JSON.stringify(back));

    /* With the foods up in the page a food added from the list lands above
       it, and the list must not slide under the thumb that added it. */
    // a row not already put on this visit, which a second tap would take back off
    const fresh = '#mpList .mpick-wrap:not(.in) [data-mpick]';
    await p.evaluate((sel) => document.querySelector(sel).scrollIntoView({ block: 'center' }), fresh);
    await p.waitForTimeout(200);
    const listAt = () => p.evaluate(() => ({ y: Math.round(document.getElementById('mpList').getBoundingClientRect().top),
      n: document.querySelectorAll('#modalRoot .msh-on .mrow').length, s: document.querySelector('#modalRoot .scrim').scrollTop }));
    const at0 = await listAt();
    await p.locator(fresh).first().click();
    await p.waitForTimeout(400);
    const at1 = await listAt();
    t.ok('a food added from the list goes up with the others, and the list holds still under the thumb',
      at0.s > 0 && at1.n === at0.n + 1 && Math.abs(at1.y - at0.y) <= 1, JSON.stringify({ at0, at1 }));

    /* a recipe's name opens the recipe; back lands on the meal's sheet */
    await p.evaluate(() => { const s = document.querySelector('#modalRoot .scrim'); s.scrollTop = 0; });
    await p.click('#modalRoot .mrows [data-open]');
    await p.waitForTimeout(400);
    const rec = await p.evaluate(() => !document.querySelector('#modalRoot .msheet') && !!document.querySelector('#modalRoot .sheet'));
    await p.goBack();
    await p.waitForTimeout(400);
    t.ok('a recipe\'s name opens the recipe, and back lands on the meal\'s sheet', rec && !!(await p.$('#modalRoot .msheet')));

    /* Whey: a quarter scoop, said in grams */
    await p.evaluate(() => {
      const d = JSON.parse(localStorage.getItem('bsc.macroDays'));
      d['2026-10-06'].d = [{ id: 'f:whey', x: 1, eaten: 0 }];
      localStorage.setItem('bsc.macroDays', JSON.stringify(d));
    });
    await p.reload();
    await p.waitForTimeout(800);
    await p.click('.tab[data-view="macros"]');
    await p.waitForTimeout(500);
    await p.click('[data-mopen="d"]');
    await p.waitForTimeout(400);
    await openTray(p);
    const wi = (await mealOf(p, 'd')).findIndex((it) => it.id === 'f:whey');
    let whey = null;
    if (wi >= 0) {
      await p.click('#modalRoot [data-mstep="d:' + wi + ':down"]');
      await p.waitForTimeout(250);
      whey = await p.evaluate((i) => ({ val: document.querySelector('#modalRoot [data-mtype="d:' + i + '"]').textContent,
        m: document.querySelectorAll('#modalRoot .mrows .mrow')[i].querySelector('.mitem-uom').textContent }), wi);
    }
    t.ok('a scoop steps a quarter at a time and says it in grams, the scoop in the small print', !!whey && whey.val === '24 g' && whey.m === '¾ scoop', JSON.stringify(whey));

    /* ---- the pills hold their numbers on the narrowest phone ----
       Four equal pills cut the target short at 320 px — "581/89" for 581 of
       898, a number that is not there — and on a big meal on any phone. A
       pill takes the room its numbers need; an ordinary meal stays one row,
       and a big one breaks two and two rather than lose a digit. */
    const pillsAt320 = async (targets, foods) => {
      const q = await t.fresh({ viewport: { width: 320, height: 640 }, hasTouch: true, isMobile: true });
      await q.evaluate(([tg, fs]) => {
        localStorage.setItem('bsc.macroTargets', JSON.stringify(tg));
        const d = new Date(), p2 = (n) => (n < 10 ? '0' : '') + n;
        const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
        localStorage.setItem('bsc.macroDays', JSON.stringify({ [k]: { d: fs.map(([id, x]) => ({ id: 'f:' + id, x: x, eaten: 0 })) } }));
      }, [targets, foods]);
      await q.reload();
      await q.waitForTimeout(500);
      await q.click('.tab[data-view="macros"]');
      await q.waitForTimeout(400);
      await q.click('[data-mopen="d"]');
      await q.waitForTimeout(400);
      const out = await q.evaluate(() => {
        const caps = [...document.querySelectorAll('#modalRoot .msh-top .mcap')];
        const R = (e) => e.getBoundingClientRect();
        return { n: caps.length, rows: new Set(caps.map((c) => Math.round(R(c).top))).size,
          cut: caps.filter((c) => { const tx = R(c.querySelector('.mcap-t')); return tx.left < R(c).left || tx.right > R(c).right; })
            .map((c) => c.textContent),
          said: caps.map((c) => c.textContent), wide: document.documentElement.scrollWidth > innerWidth };
      });
      await q.context().close();
      return out;
    };
    const usual = await pillsAt320({ p: 190, f: 70, c: 230 }, [['egg_white', 3], ['cheddar', 0.25], ['banana', 1]]);
    t.ok('at 320 an ordinary meal’s four pills say every digit, on one row', usual.n === 4 && usual.cut.length === 0 && usual.rows === 1 && !usual.wide,
      JSON.stringify(usual));
    const big = await pillsAt320({ p: 250, f: 110, c: 400 }, [['egg_white', 6], ['cheddar', 1], ['banana', 3], ['oats', 2]]);
    t.ok('and a big meal’s break two and two rather than lose one', big.n === 4 && big.cut.length === 0 && big.rows === 2 && !big.wide,
      JSON.stringify(big));

    /* ---- a meal the day has nothing left for ----
       Blake, 2026-10-06, of an evening snack after a day over its calories:
       "Remove the text 'none left' from in the pills." A narrow pill cut it
       to "none l". The dash and a dashed edge say it now, on the day's tray
       as in the sheet, and only a screen reader hears the words. */
    const sp = await t.fresh({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    await sp.clock.setFixedTime(new Date(2026, 9, 6, 19, 30, 0));
    await sp.reload();
    await sp.waitForTimeout(600);
    await sp.evaluate(() => {
      localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 190, f: 70, c: 230 }));
      localStorage.setItem('bsc.macroSlots', JSON.stringify({ list: [{ k: 'b', n: 'Breakfast', t: 'b' }, { k: 'l', n: 'Lunch', t: 'l' },
        { k: 'd', n: 'Dinner', t: 'd' }, { k: 'e', n: 'Evening Snack', t: 's' }], names: { b: 'Breakfast', l: 'Lunch', d: 'Dinner', e: 'Evening Snack' } }));
      const f = (k, x) => ({ id: 'f:' + k, x: x, eaten: 1 });
      localStorage.setItem('bsc.macroDays', JSON.stringify({ '2026-10-06': { b: [f('greek_yogurt', 3), f('oats', 3)],
        l: [f('chicken_breast', 4), f('rice_cooked', 3)], d: [f('ground_beef', 4), f('potato', 4), f('peanut_butter', 4)], e: [] } }));
    });
    await sp.reload();
    await sp.waitForTimeout(800);
    await sp.click('.tab[data-view="macros"]');
    await sp.waitForTimeout(500);
    const spentPills = (scope) => sp.evaluate((sel) => [...document.querySelectorAll(sel + ' .mcap.spent')].map((c) => {
      const t2 = c.querySelector('.mcap-t'), hid = c.querySelector('.vis-hidden');
      const shown = [...t2.childNodes].filter((n) => !(n.classList && n.classList.contains('vis-hidden'))).map((n) => n.textContent).join('');
      return { shown: shown, heard: hid ? hid.textContent.trim() : '', dashed: getComputedStyle(c).borderTopStyle === 'dashed' };
    }), scope);
    /* Since 2026-10-11 an empty meal on the day is one row with no pills
       (myday.js, emptyHTML), and with nothing left for it no target either:
       its name, + and ⊘. The dashed pills are its sheet's. */
    const onTray = await sp.evaluate(() => { const c = document.querySelector('#macroSlots [data-mslot="e"]');
      return c && { empty: c.classList.contains('mtray-empty'), pills: c.querySelectorAll('.mcap').length, aim: !!c.querySelector('.mtray-aim') }; });
    await sp.click('[data-mopen="e"]');
    await sp.waitForTimeout(400);
    const onSheet = await spentPills('#modalRoot .msh-top');
    const quiet = (a) => a.length === 4 && a.every((x) => !/none|left/i.test(x.shown) && /—$/.test(x.shown) && x.heard === 'none left' && x.dashed);
    t.ok('a meal with nothing left is one quiet row on the day: no pills, and no target to aim at', !!onTray && onTray.empty && !onTray.pills && !onTray.aim, JSON.stringify(onTray));
    t.ok('and the same in its sheet, the words kept for a screen reader', quiet(onSheet), JSON.stringify(onSheet));

    /* ---- Move to… and Explode into foods (with Undo) ---- */
    await sp.click('#modalRoot .msheet .msh-done');
    await sp.waitForTimeout(300);
    await sp.evaluate(() => {
      const d = JSON.parse(localStorage.getItem('bsc.macroDays'));
      d['2026-10-06'].b = [
        { id: 'f:greek_yogurt', x: 1, eaten: 0, by: 'fill' },
        { id: 'f:oats', x: 1, eaten: 0, by: 'fill' },
      ];
      localStorage.setItem('bsc.macroDays', JSON.stringify(d));
    });
    await sp.reload();
    await sp.waitForTimeout(600);
    await sp.click('.tab[data-view="macros"]');
    await sp.waitForTimeout(400);
    await sp.evaluate(() => document.querySelector('[data-mopen="b"]').click());
    await sp.waitForTimeout(400);
    await sp.click('#modalRoot .msh-h [data-mmenu="b"]');
    await sp.waitForTimeout(200);
    await sp.click('#modalRoot .msh-menu [data-mkeep="b"]');
    await sp.waitForTimeout(300);
    await sp.fill('#mkName', 'Morning Bowl');
    await sp.click('[data-mkdo="mine"]');
    await sp.waitForTimeout(400);
    const railOrder = await sp.evaluate(() =>
      [...document.querySelectorAll('#mpShelves [data-mpshelf]')].slice(0, 5).map((b) => b.dataset.mpshelf));
    t.ok('the shelf rail leads with All, Protein, Fats, Carbs, Recipes in macro-priority order',
      railOrder.join(',') === ',protein,fat,carb,recipes', JSON.stringify(railOrder));
    const savedBefore = await sp.evaluate(() => JSON.parse(localStorage.getItem('bsc.macroDays'))['2026-10-06'].b);
    await sp.click('#modalRoot [data-mfmenu="b:0"]');
    await sp.waitForTimeout(200);
    t.ok('Save meal collapses the two breakfast foods into one saved meal row with Explode into foods in its ⋯ menu',
      savedBefore.length === 1 && !!(await sp.$('#modalRoot .mrow-menu [data-mexplode="b:0"]')), JSON.stringify(savedBefore));
    await sp.click('#modalRoot .mrow-menu [data-mexplode="b:0"]');
    await sp.waitForTimeout(350);
    const exploded = await sp.evaluate(() => JSON.parse(localStorage.getItem('bsc.macroDays'))['2026-10-06'].b.map((x) => x.id));
    t.ok('Explode breaks the saved meal back into its individual foods on the plate',
      exploded.join() === 'f:greek_yogurt,f:oats', JSON.stringify(exploded));
    await sp.click('#mToast [data-mexplodeundo]');
    await sp.waitForTimeout(350);
    const unexploded = await sp.evaluate(() => JSON.parse(localStorage.getItem('bsc.macroDays'))['2026-10-06'].b);
    t.ok('and Undo restores the grouped saved meal identically',
      JSON.stringify(unexploded) === JSON.stringify(savedBefore), JSON.stringify({ savedBefore, unexploded }));
    /* Explode it again so we have two foods on Breakfast, then Move one to Evening Snack
       and verify Undo restores both the moved food (including its properties) and the
       refitted sibling food on Breakfast, with no undefined values in the day. */
    await sp.click('#modalRoot [data-mfmenu="b:0"]');
    await sp.waitForTimeout(200);
    await sp.click('#modalRoot .mrow-menu [data-mexplode="b:0"]');
    await sp.waitForTimeout(350);
    const beforeMove = await sp.evaluate(() => JSON.parse(localStorage.getItem('bsc.macroDays'))['2026-10-06'].b);
    await sp.click('#modalRoot [data-mfmenu="b:0"]');
    await sp.waitForTimeout(200);
    await sp.click('#modalRoot .mrow-menu [data-mmove="b:0"]');
    await sp.waitForTimeout(200);
    await sp.click('#modalRoot .mrow-menu [data-mmoveto="b:0:e"]');
    await sp.waitForTimeout(350);
    const moved = await sp.evaluate(() => {
      const d = JSON.parse(localStorage.getItem('bsc.macroDays'))['2026-10-06'];
      return { b: d.b || [], e: d.e || [] };
    });
    t.ok('Move to… moves the plate to Evening Snack and re-fits the remaining food on Breakfast',
      moved.b.length === 1 && moved.e.length === 1 && moved.b[0].x !== beforeMove[1].x, JSON.stringify({ beforeMove, moved }));
    await sp.click('#mToast [data-mmoveundo]');
    await sp.waitForTimeout(350);
    const unmoved = await sp.evaluate(() => {
      const d = JSON.parse(localStorage.getItem('bsc.macroDays'))['2026-10-06'];
      return { b: d.b || [], e: d.e || [] };
    });
    t.ok('and Undo puts the moved plate back on Breakfast and restores the sibling to its pre-move portion',
      unmoved.b.length === 2 && unmoved.e.length === 0 && JSON.stringify(unmoved.b) === JSON.stringify(beforeMove),
      JSON.stringify({ beforeMove, unmoved }));
    await sp.context().close();

    t.ok('no page errors', errs.length === 0, errs.join(' | '));
  },
};
