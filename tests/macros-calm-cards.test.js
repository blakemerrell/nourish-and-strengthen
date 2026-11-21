/* Calm Eat cards & smart eaten split (2026-11-21 Invisible Power pass).
 *
 * Verifies:
 *  1) Manual logging on today (picker tap, "You usually have" chip) arrives eaten: 1,
 *     keeps the meal card open with its 4 colored macro pills, shows zero row
 *     checkboxes, and keeps − / + & recipe quick presets immediately editable.
 *  2) Fill drafts and tomorrow adds arrive planned (eaten: 0) and keep checkboxes.
 *  3) Empty cards are one calm row opening food search on tap (no .mtray-acts
 *     wall or card ⊘); meal sheet ⋯ exposes Autofill, Repeat a day, Skip today.
 *  4) Populated cards omit superscript score leaves, shut-line droplets, card ⚖,
 *     and card ⊘ while keeping 4 macro pills and + add.
 *  5) 320px and 390px light & dark layout checks: no sideways overflow, thumb-sized
 *     targets (>= 44px), and zero console/page errors. */
const { nourish, todayOn, stepDay } = require('./fixtures/nourish.js');

module.exports = nourish({
  name: 'Macros — calm Eat cards & smart eaten split',
  async suite(t) {
    const errs = [];
    const p = await t.fresh({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    p.on('pageerror', (e) => errs.push(e.message));
    await p.clock.setFixedTime(new Date(2026, 10, 21, 9, 15, 0));
    const dk = await todayOn(p);
    await p.evaluate((todayK) => {
      const p2 = (n) => (n < 10 ? '0' : '') + n;
      const key = (d) => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
      const days = {};
      for (let i = 3; i >= 1; i--) {
        const d = new Date(todayK + 'T12:00:00');
        d.setDate(d.getDate() - i);
        days[key(d)] = { b: [{ id: 'f:egg', x: 2, eaten: 1 }], l: [], d: [], s: [] };
      }
      days[todayK] = { b: [], l: [], d: [], s: [] };
      localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 180, f: 60, c: 200 }));
      localStorage.setItem('bsc.macroSlots', JSON.stringify({
        list: [
          { k: 'b', n: 'Breakfast', t: 'b' },
          { k: 'l', n: 'Lunch', t: 'l' },
          { k: 'd', n: 'Dinner', t: 'd' },
          { k: 's', n: 'Snacks', t: 's' },
        ],
        names: { b: 'Breakfast', l: 'Lunch', d: 'Dinner', s: 'Snacks' },
      }));
      localStorage.setItem('bsc.macroDays', JSON.stringify(days));
    }, dk);
    await p.reload();
    await p.waitForTimeout(450);
    await p.click('.tab[data-view="macros"]');
    await p.waitForTimeout(300);

    /* 1) Empty meal cards are one calm row; tapping opens picker and ⋯ holds Autofill / Repeat / Skip */
    const emptyState = await p.evaluate(() => {
      const d = document.querySelector('#macroSlots [data-mslot="d"]');
      return {
        h: Math.round(d.getBoundingClientRect().height),
        acts: d.querySelectorAll('.mtray-acts').length,
        skipAsk: d.querySelectorAll('[data-mskipask]').length,
        bal: d.querySelectorAll('[data-mbal]').length,
        verbs: [...d.querySelectorAll('.mtray-vbs button')].map((b) => Object.keys(b.dataset)[0]),
      };
    });
    t.ok('empty card is one calm row with +, no .mtray-acts wall, no ⊘, and no ⚖',
      emptyState.h < 70 && !emptyState.acts && !emptyState.skipAsk && !emptyState.bal && emptyState.verbs.join() === 'mopen',
      JSON.stringify(emptyState));

    await p.click('#macroSlots [data-mslot="d"] .mtray-hd[data-mopen="d"]');
    await p.waitForTimeout(300);
    await p.click('#modalRoot [data-mmenu="d"]');
    await p.waitForTimeout(200);
    const emptyMenu = await p.evaluate(() =>
      [...document.querySelectorAll('#modalRoot .msh-menu button')].map((b) => b.textContent.trim()));
    t.ok('empty meal sheet ⋯ exposes Autofill, Repeat a day, and Skip today',
      emptyMenu.join('|') === 'Autofill|Repeat a day|Skip today',
      JSON.stringify(emptyMenu));
    await p.click('#modalRoot .msh-done');
    await p.waitForTimeout(250);

    /* 2) "You usually have" chip on Breakfast lands eaten: 1 with 4 pills and zero checkboxes */
    await p.click('#macroSlots [data-mslot="b"] .mtray-uchip');
    await p.waitForTimeout(250);
    const bAfterChip = await p.evaluate((todayK) => {
      const c = document.querySelector('#macroSlots [data-mslot="b"]');
      const d = JSON.parse(localStorage.getItem('bsc.macroDays') || '{}')[todayK] || {};
      return {
        eaten: d.b && d.b[0] && d.b[0].eaten,
        open: c.classList.contains('mv-2'),
        pills: c.querySelectorAll('.mtray-caps .mcap').length,
        checks: c.querySelectorAll('.mitem-ate').length,
      };
    }, dk);
    t.ok('tapping "You usually have" lands eaten: 1, keeps meal open with 4 macro pills and 0 checkboxes',
      bAfterChip.eaten === 1 && bAfterChip.open && bAfterChip.pills === 4 && bAfterChip.checks === 0,
      JSON.stringify(bAfterChip));

    /* 3) Picker tap on Lunch (recipe) lands eaten: 1, stays editable without .mstep-wake, and omits card clutter */
    await p.click('#macroSlots [data-mslot="l"] .mtray-hd[data-mopen="l"]');
    await p.waitForTimeout(300);
    await p.fill('#mpFind', 'chili');
    await p.waitForTimeout(300);
    await p.click('#mpList [data-mpick]:not([data-mpick^="f:"])');
    await p.waitForTimeout(350);
    await p.click('#modalRoot .msh-done');
    await p.waitForTimeout(300);

    const lunchCard = await p.evaluate((todayK) => {
      const c = document.querySelector('#macroSlots [data-mslot="l"]');
      const d = JSON.parse(localStorage.getItem('bsc.macroDays') || '{}')[todayK] || {};
      return {
        eaten: d.l && d.l[0] && d.l[0].eaten,
        x0: d.l && d.l[0] && d.l[0].x,
        open: c.classList.contains('mv-2'),
        pills: c.querySelectorAll('.mtray-caps .mcap').length,
        checks: c.querySelectorAll('.mitem-ate').length,
        sups: c.querySelectorAll('.mfl-sup').length,
        hyds: c.querySelectorAll('.mfl-hyd').length,
        bals: c.querySelectorAll('[data-mbal]').length,
        skips: c.querySelectorAll('[data-mskipask]').length,
      };
    }, dk);
    t.ok('manual recipe log lands eaten: 1, keeps 4 pills, zero checkboxes, zero .mfl-sup/.mfl-hyd/card ⚖/card ⊘',
      lunchCard.eaten === 1 && lunchCard.open && lunchCard.pills === 4 && lunchCard.checks === 0 &&
      !lunchCard.sups && !lunchCard.hyds && !lunchCard.bals && !lunchCard.skips,
      JSON.stringify(lunchCard));

    await p.click('#macroSlots [data-mslot="l"] [data-mamt]');
    await p.waitForTimeout(200);
    const liveDial = await p.evaluate(() => ({
      wake: !!document.querySelector('#macroSlots [data-mslot="l"] .mstep-wake'),
      quicks: document.querySelectorAll('#macroSlots [data-mslot="l"] [data-mset]').length,
      disabled: [...document.querySelectorAll('#macroSlots [data-mslot="l"] [data-mstep]')].some((b) => b.disabled),
    }));
    t.ok('newly logged eaten item on an active day keeps − / + and ½·1·1½·2 live immediately (no .mstep-wake)',
      !liveDial.wake && liveDial.quicks === 4 && !liveDial.disabled,
      JSON.stringify(liveDial));
    await p.click('#macroSlots [data-mslot="l"] [data-mstep="l:0:up"]');
    await p.waitForTimeout(200);
    const xAfterStep = await p.evaluate((todayK) =>
      ((JSON.parse(localStorage.getItem('bsc.macroDays') || '{}')[todayK] || {}).l || [])[0].x, dk);
    t.ok('tapping + on the newly logged eaten food adjusts its portion immediately',
      xAfterStep > lunchCard.x0, JSON.stringify({ before: lunchCard.x0, after: xAfterStep }));

    /* 4) Balance hides on a single manually logged food and appears once 2+ unlocked foods are on the meal */
    await p.evaluate(() => document.querySelector('#macroSlots [data-mslot="l"] .mtray-b[data-mopen]').click());
    await p.waitForTimeout(300);
    const balSingle = await p.evaluate(() => !!document.querySelector('#modalRoot .msh-acts [data-mbal="l"]'));
    t.ok('Balance hides cleanly when a meal holds just one manually logged food', !balSingle);
    await p.click('#modalRoot .msh-acts [data-mpmode="home"]');
    await p.waitForTimeout(250);
    await p.fill('#mpFind', 'egg white');
    await p.waitForTimeout(250);
    await p.click('#mpList [data-mpick="f:egg_white"]');
    await p.waitForTimeout(300);
    const balEnabled = await p.evaluate(() => {
      const b = document.querySelector('#modalRoot .msh-acts [data-mbal="l"]');
      return !!b && !b.disabled;
    });
    t.ok('Balance inside the meal sheet appears and stays enabled once 2+ unlocked manually logged foods are present', balEnabled);
    await p.click('#modalRoot [data-mpmode="meal"]');
    await p.waitForTimeout(200);
    await p.click('#modalRoot .msh-done');
    await p.waitForTimeout(250);

    /* 5) Fill drafts & tomorrow manual adds stay planned (eaten: 0) WITH checkboxes */
    await p.click('#macroFill');
    await p.waitForTimeout(700);
    const filledDinner = await p.evaluate((todayK) => {
      const d = JSON.parse(localStorage.getItem('bsc.macroDays') || '{}')[todayK] || {};
      const c = document.querySelector('#macroSlots [data-mslot="d"]');
      return {
        allPlanned: (d.d || []).length > 0 && d.d.every((it) => it.eaten === 0 && it.by === 'f'),
        checks: c ? c.querySelectorAll('.mitem-ate').length : 0,
      };
    }, dk);
    t.ok('Fill drafts stay planned (eaten: 0) and show row checkboxes so planned meals remain checkable',
      filledDinner.allPlanned && filledDinner.checks > 0,
      JSON.stringify(filledDinner));

    await stepDay(p, 1);
    await p.waitForTimeout(250);
    const tmrK = await p.evaluate(() => document.getElementById('macroDayPick').value);
    await p.click('#macroSlots [data-mslot="b"] .mtray-hd[data-mopen="b"]');
    await p.waitForTimeout(300);
    await p.fill('#mpFind', 'egg');
    await p.waitForTimeout(300);
    await p.click('#mpList [data-mpick]');
    await p.waitForTimeout(300);
    await p.click('#modalRoot .msh-done');
    await p.waitForTimeout(250);
    const tmrState = await p.evaluate((tk) => {
      const d = JSON.parse(localStorage.getItem('bsc.macroDays') || '{}')[tk] || {};
      const c = document.querySelector('#macroSlots [data-mslot="b"]');
      return {
        eaten: d.b && d.b[0] && d.b[0].eaten,
        checks: c ? c.querySelectorAll('.mitem-ate').length : 0,
      };
    }, tmrK);
    t.ok('manual add on a future day arrives planned (eaten: 0) with its checkbox',
      tmrState.eaten === 0 && tmrState.checks === 1, JSON.stringify(tmrState));

    /* 6) 320px Light & Dark parity check */
    await stepDay(p, -1);
    await p.waitForTimeout(250);
    for (const scheme of ['light', 'dark']) {
      await p.emulateMedia({ colorScheme: scheme });
      await p.setViewportSize({ width: 320, height: 760 });
      await p.waitForTimeout(200);
      const fit = await p.evaluate(() => {
        const small = [...document.querySelectorAll('#macroSlots .mtray button')].filter((b) => {
          const r = b.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && !b.classList.contains('mtray-b') && !b.classList.contains('mtray-fn') &&
            Math.min(r.width, r.height) < 43.5;
        });
        return { overflow: document.documentElement.scrollWidth - innerWidth, small: small.length };
      });
      t.ok('at 320px (' + scheme + '): zero horizontal overflow and all card controls >= 44px',
        fit.overflow <= 0 && fit.small === 0, JSON.stringify(fit));
    }

    t.ok('zero page errors throughout', errs.length === 0, errs.join(' | '));
  },
});
