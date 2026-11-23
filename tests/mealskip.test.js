/* Skip on the meal's card, and where each card starts (Blake, 2026-10-10).
 *
 * "I need a way to easily skip a meal on the main day menu. Somehow that got
 * buried in the food selector." It was in the meal sheet's ⋯, and only on an
 * empty meal, because a skip counts only on an empty one. So the card has ⊘:
 * an empty meal skips at once, a meal with food on it asks on the card, and
 * either way the toast has Undo — he chose "clear it, with Undo". A skipped
 * meal's row says Put back. A meal anything was eaten from has no ⊘.
 *
 * And the cards' three views (tests/daylines.test.js steps them): each
 * starts where he chose ("B") — an eaten meal on Status, the next meal on
 * Details, the rest on Foods — and paper shows every meal whole.
 * Mockup: https://claude.ai/artifact/Vn1dzLvzzUgVBxKNPdUc8c */
const DAY = '2026-10-10';

const SETUP = () => {
  localStorage.setItem('bsc.macroProfile', JSON.stringify({ sex: 'm', age: 43, ft: 5, inch: 11, lb: 192, act: 1.55, goal: 'cut1' }));
  localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 190, f: 70, c: 230 }));
  localStorage.setItem('bsc.macroSlots', JSON.stringify({ list: [{ k: 'b', n: 'Breakfast', t: 'b' }, { k: 'l', n: 'Lunch', t: 'l' },
    { k: 'd', n: 'Dinner', t: 'd' }, { k: 's', n: 'Snacks', t: 's' }], names: { b: 'Breakfast', l: 'Lunch', d: 'Dinner', s: 'Snacks' } }));
  const f = (k, x, e) => ({ id: 'f:' + k, x: x, eaten: e ? 1 : 0 });
  // a meal saved to yourself (Save meal), for the empty meal's Saved meals
  localStorage.setItem('bsc.myFoods', JSON.stringify({ salad: { name: 'House side salad', unit: 'plate', kcal: 150, p: 4, f: 11, c: 9,
    parts: [{ id: 'f:apple', x: 1, name: 'Apples', unit: 'whole' }] } }));
  localStorage.setItem('bsc.macroDays', JSON.stringify({
    // a snack on the day before, for Repeat a day
    '2026-10-09': { s: [f('apple', 1, 1)] },
    '2026-10-10': {
    // four eggs on breakfast: protein well past its share, and fat
    b: [f('greek_yogurt', 1, 1), f('oats', 0.75, 1), f('egg', 4, 1)],
    l: [f('chicken_breast', 1), f('green_beans', 1), f('apple', 1)],
    d: [{ id: 66, x: 1, eaten: 0 }, f('egg', 2)],
    s: [] } }));
};
const dayOf = (p) => p.evaluate((k) => JSON.parse(localStorage.getItem('bsc.macroDays'))[k], DAY);
const skips = (p) => p.evaluate((k) => (JSON.parse(localStorage.getItem('bsc.macroSkip') || '{}')[k]) || [], DAY);
const card = (sk) => '#macroSlots .mtray[data-mslot="' + sk + '"]';
const wantOf = (p, sk) => p.evaluate((sel) => Number((document.querySelector(sel + ' .mtray-caps .mcap') || { dataset: {} }).dataset.want), card(sk));

module.exports = {
  name: 'Skip on the meal card, and where each card starts',
  async run(t) {
    const p = await t.fresh({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    await p.clock.setFixedTime(new Date(2026, 9, 10, 12, 0, 0));
    await p.reload();
    await p.waitForTimeout(600);
    await p.evaluate(SETUP);
    await p.reload();
    await p.waitForTimeout(900);
    await p.click('.tab[data-view="macros"]');
    await p.waitForTimeout(500);

    /* ---- where each card starts ---- */
    const shutSheet = async () => {
      await p.evaluate(() => { const b = document.querySelector('#modalRoot .msh-done') || document.querySelector('#modalRoot .sheet-x'); if (b) b.click(); });
      await p.waitForTimeout(400);
    };
    const skipInSheet = async (sk) => {
      await p.evaluate((s) => {
        const d = document.querySelector('#macroSlots [data-mslot="' + s + '"] .mtray-b[data-mopen]') ||
          document.querySelector('#macroSlots [data-mslot="' + s + '"] [data-mopen]');
        if (d) d.click();
      }, sk);
      await p.waitForTimeout(300);
      await p.click('#modalRoot [data-mmenu="' + sk + '"]');
      await p.waitForTimeout(200);
      await p.click('#modalRoot .msh-menu [data-mskip="' + sk + '"]');
      await p.waitForTimeout(300);
    };
    const start = await p.evaluate(() => [...document.querySelectorAll('#macroSlots .mtray[data-mslot]')].map((c) => ({
      k: c.dataset.mslot, v: (c.className.match(/\bmv-(\d)/) || [])[1], beads: c.querySelectorAll('.mbd').length,
      skip: !!c.querySelector('[data-mskipask]'), bal: !!c.querySelector('[data-mbal]'), door: !!c.querySelector('.mtray-b[data-mopen]') })));
    t.ok('all populated meals start open on State 2 (Foods) with zero .mbd circles; empty Snacks is one calm row',
      start.map((c) => c.k + (c.v || '-')).join() === 'b2,l2,d2,s-' && start.every((c) => !c.beads) &&
      await p.evaluate(() => document.querySelector('#macroSlots [data-mslot="s"]').classList.contains('mtray-empty')), JSON.stringify(start));
    t.ok('every card keeps its door to the meal, Status too, with no card-level ⊘ or ⚖ clutter',
      start.every((c) => c.door && !c.skip && !c.bal), JSON.stringify(start));

    /* ---- empty meal skips from its ⋯ menu, with Undo ---- */
    const lunchWant0 = await wantOf(p, 'l');
    await skipInSheet('s');
    await shutSheet();
    const toast1 = await p.evaluate(() => { const el = document.getElementById('mToast'); return { shown: !el.hidden, text: el.textContent, undo: !!el.querySelector('[data-mskipundo]') }; });
    t.ok('Skip today on empty Snacks skips it with a toast + Undo',
      (await skips(p)).join() === 's' && toast1.shown && /^Snacks skipped\.Undo$/.test(toast1.text) && toast1.undo, JSON.stringify(toast1));
    const row = await p.evaluate(() => {
      const el = document.querySelector('#macroSlots .mtray-skip');
      const pill = el && el.querySelector('.mtray-spread-pill');
      return el && { door: (el.querySelector('[data-mopen]') || { dataset: {} }).dataset.mopen,
        back: (el.querySelector('[data-mskip]') || {}).textContent,
        pill: pill ? pill.textContent : '' };
    });
    t.ok('and its row says skipped with a short spread pill (kcal → Lunch +1), opens its sheet, and has Put back on it',
      !!row && row.door === 's' && row.back === 'Put back' && /\d+ → Lunch \+1/.test(row.pill), JSON.stringify(row));
    const lunchWant1 = await wantOf(p, 'l');
    t.ok('its share goes to the meals still open: Lunch is asked for more', lunchWant1 > lunchWant0, JSON.stringify({ lunchWant0, lunchWant1 }));
    await p.click('#mToast [data-mskipundo]');
    await p.waitForTimeout(300);
    t.ok('Undo puts it back', (await skips(p)).length === 0 && !(await p.$('#macroSlots .mtray-skip')) && (await wantOf(p, 'l')) === lunchWant0);

    /* Put back, on the row */
    await skipInSheet('s');
    await shutSheet();
    await p.click('#macroSlots .mtray-skip [data-mskip="s"]');
    await p.waitForTimeout(300);
    t.ok('and Put back on the row puts it back too', (await skips(p)).length === 0 && !!(await p.$(card('s'))));

    /* ---- a planned meal skips from its ⋯ menu, while an eaten meal cannot ---- */
    await p.evaluate((sel) => document.querySelector(sel + ' .mtray-b[data-mopen]').click(), card('b'));
    await p.waitForTimeout(300);
    await p.click('#modalRoot [data-mmenu="b"]');
    await p.waitForTimeout(200);
    t.ok('an eaten meal has no Skip today in its ⋯ menu', !(await p.$('#modalRoot .msh-menu [data-mskip="b"]')));
    await shutSheet();

    const d0 = (await dayOf(p)).d;
    await skipInSheet('d');
    await shutSheet();
    const gone = await dayOf(p);
    t.ok('Skip today on planned Dinner takes its food off and skips it, and the toast says so with Undo',
      (gone.d || []).length === 0 && (await skips(p)).join() === 'd' &&
      /^Dinner skipped, and its 2 foods came off\.Undo$/.test(await p.evaluate(() => document.getElementById('mToast').textContent)), JSON.stringify(gone.d));
    await p.click('#mToast [data-mskipundo]');
    await p.waitForTimeout(300);
    t.ok('Undo puts its food back as it was, and the skip comes off',
      JSON.stringify((await dayOf(p)).d) === JSON.stringify(d0) && (await skips(p)).length === 0, JSON.stringify((await dayOf(p)).d));

    /* ---- paper shows every meal whole ---- */
    await p.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
    await p.waitForTimeout(200);
    const paper = await p.evaluate(() => [...document.querySelectorAll('#macroSlots .mtray[data-mslot]')].map((c) => (c.className.match(/\bmv-(\d)/) || [])[1]).join());
    await p.evaluate(() => window.dispatchEvent(new Event('afterprint')));
    await p.waitForTimeout(200);
    const back = await p.evaluate(() => [...document.querySelectorAll('#macroSlots .mtray[data-mslot]')].map((c) => (c.className.match(/\bmv-(\d)/) || [])[1]).join());
    // all populated meals stay open (mv-2) before, during, and after printing
    t.ok('printing shows every meal with food open, and the cards stay open after', paper === '2,2,2,' && back === '2,2,2,', JSON.stringify({ paper, back }));

    /* ---- pills: protein past its share stays green, fat past it amber ---- */
    const bPills = await p.evaluate((sel) => [...document.querySelectorAll(sel + ' .mtray-caps .mcap')].map((c) => ({
      want: Number(c.dataset.want),
      have: Number(c.querySelector('.mcap-t').childNodes[1].textContent.replace(/,/g, '')),
      on: c.classList.contains('on'),
      over: c.classList.contains('over'),
    })), card('b'));
    const bNoBeads = await p.evaluate((sel) => ({
      beads: document.querySelectorAll(sel + ' .mbd').length,
      mview: document.querySelectorAll(sel + ' [data-mview]').length,
    }), card('b'));
    t.ok('on the eaten breakfast, protein past its share is still green and fat past it is amber, rendered via pills with no circles',
      bPills.length === 4 && bPills[1].have > bPills[1].want * 1.1 && bPills[1].on && !bPills[1].over &&
      bPills[2].have > bPills[2].want * 1.1 && bPills[2].over && !bNoBeads.beads && !bNoBeads.mview,
      JSON.stringify({ bPills, bNoBeads }));

    /* ---- an empty meal: one calm row; tapping it or + opens food search ---- */
    const emp = () => p.evaluate((sel) => {
      const c = document.querySelector(sel);
      return { open: c.classList.contains('open'), h: Math.round(c.getBoundingClientRect().height), pills: c.querySelectorAll('.mcap').length,
        none: !!c.querySelector('.mtray-none'), aim: (c.querySelector('.mtray-aim') || {}).textContent || '',
        acts: c.querySelectorAll('.mtray-acts button').length,
        verbs: [...c.querySelectorAll('.mtray-vbs button')].map((b) => Object.keys(b.dataset)[0]) };
    }, card('s'));
    const e0 = await emp();
    t.ok('an empty Snacks is one calm row: its name, what it is for, +, and no pills, ⊘, "Nothing yet", or .mtray-acts wall',
      !e0.open && e0.h < 70 && !e0.pills && !e0.none && /^\d[\d,]* kcal$/.test(e0.aim) && !e0.acts && e0.verbs.join() === 'mopen', JSON.stringify(e0));
    await p.click(card('s') + ' .mtray-hd[data-mopen]');
    await p.waitForTimeout(450);
    t.ok('tapping an empty meal name opens food search directly, offering Same as yesterday when yesterday had that meal',
      !!(await p.$('#modalRoot .msheet #mpFind')) &&
      await p.evaluate(() => {
        const b = document.querySelector('#modalRoot .msheet .msh-on-empty .msh-yest[data-mcopy="2026-10-09"]');
        return !!b && /^Same as yesterday/.test(b.getAttribute('aria-label') || '');
      }));
    /* Saved meals lens inside the picker, Repeat a day & Autofill via ⋯ in the empty meal sheet */
    await p.selectOption('#modalRoot #mpSec', 'saved');
    await p.waitForTimeout(250);
    const sv = await p.evaluate(() => ({ lens: (document.getElementById('mpSec') || {}).value,
      rows: [...document.querySelectorAll('#modalRoot #mpList [data-mpick]')].map((r) => ((r.closest('.mp-row') || r).querySelector('.mp-name') || {}).textContent) }));
    t.ok('Saved meals lens inside the sheet lists saved meals cleanly',
      sv.lens === 'saved' && sv.rows.length === 1 && /House side salad/.test(sv.rows[0]), JSON.stringify(sv));
    await p.click('#modalRoot [data-mmenu="s"]');
    await p.waitForTimeout(200);
    await p.click('#modalRoot [data-mfrom="s"]');
    await p.waitForTimeout(400);
    t.ok('Repeat a day in the meal sheet ⋯ opens the days Snacks can be copied from', !!(await p.$('#modalRoot [data-mcopy="2026-10-09"]')));
    await p.goBack();
    await p.waitForTimeout(400);
    await p.click('#modalRoot [data-mmenu="s"]');
    await p.waitForTimeout(200);
    await p.click('#modalRoot [data-mtry="s"]');
    await p.waitForTimeout(450);
    const auto = (await dayOf(p)).s || [];
    t.ok('Autofill in empty meal sheet ⋯ drafts Snacks from the plan, planned and not a card wall',
      auto.length === 1 && auto[0].by === 'f' && auto[0].eaten === 0 &&
      await p.evaluate((sel) => !document.querySelector(sel).classList.contains('mtray-empty'), card('s')), JSON.stringify(auto));
    await p.click('#modalRoot [data-mmenu="s"]');
    await p.waitForTimeout(200);
    await p.click('#modalRoot [data-mtry="s"]');
    await p.waitForTimeout(350);
    const auto2 = (await dayOf(p)).s || [];
    await shutSheet();
    t.ok('once filled, the card header has no ↻ of its own and ⋯ › Try another moves on to another suggestion',
      !(await p.$(card('s') + ' .mtray-ib[data-mtry]')) && auto2.length === 1 && auto2[0].id !== auto[0].id, JSON.stringify({ auto, auto2 }));

    /* ---- the narrowest phone: one line a head, a thumb a button, no sideways scroll ---- */
    await p.setViewportSize({ width: 320, height: 760 });
    const fit = await p.evaluate(() => {
      const heads = [...document.querySelectorAll('#macroSlots .mtray-hr')].map((h) => Math.round(h.getBoundingClientRect().height));
      const small = [...document.querySelectorAll('#macroSlots .mtray button, #macroSlots .mtray-skip button')].filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width && r.height && Math.min(r.width, r.height) < 43.5 && !e.classList.contains('mtray-b') && !e.classList.contains('mtray-fn');
      }).map((e) => e.className + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height));
      return { heads, small, wide: document.documentElement.scrollWidth };
    });
    t.ok('at 320 px: every head one line, every button a thumb, nothing sideways',
      fit.heads.every((h) => h <= 50) && !fit.small.length && fit.wide <= 320, JSON.stringify(fit));
    /* Double-tapping Same as yesterday before the sheet closes lands yesterday's foods only once. */
    await p.evaluate(SETUP);
    await p.reload();
    await p.waitForTimeout(600);
    await p.click('.tab[data-view="macros"]');
    await p.waitForTimeout(300);
    await p.click(card('s') + ' [data-mopen]');
    await p.waitForTimeout(400);
    const yestCopy = await p.evaluate(() => {
      const b = document.querySelector('#modalRoot .msheet .msh-yest[data-mcopy="2026-10-09"]');
      if (b) { b.click(); b.click(); }
      const d = JSON.parse(localStorage.getItem('bsc.macroDays') || '{}');
      return (d['2026-10-10'] && d['2026-10-10'].s) || [];
    });
    await p.waitForTimeout(300);
    t.ok('and tapping Same as yesterday copies the meal once (even on a double-tap) and closes the sheet',
      yestCopy.length === 1 && yestCopy[0].id === 'f:apple' && !(await p.$('#modalRoot .msheet')), JSON.stringify(yestCopy));

    /* Add meal button in bottom bar opens quick-add & 3–7 meal presets, and allows moving/removing snack slots */
    await p.click('#macroMore');
  await p.click('#macroAddMeal');
    await p.waitForTimeout(200);
    t.ok('Add meal button in bottom bar opens the inline meal manager with 3–7 presets and quick-add chips',
      await p.evaluate(() => {
        const pop = document.getElementById('macroAddPop');
        return pop && !pop.classList.contains('hide') && pop.querySelectorAll('[data-mslotpreset]').length === 5;
      }));
    await p.click('#macroAddPop [data-maddslot^="Mid-Morning Snack"]');
    await p.waitForTimeout(200);
    const afterAdd = await p.evaluate(() => JSON.parse(localStorage.getItem('bsc.macroSlots')).list.map((s) => s.n));
    t.ok('+ Mid-Morning Snack inserts the snack right after Breakfast',
      afterAdd.length === 5 && afterAdd[1] === 'Mid-Morning Snack', JSON.stringify(afterAdd));
    const midKey = await p.evaluate(() => JSON.parse(localStorage.getItem('bsc.macroSlots')).list[1].k);
    await p.click('#macroAddPop [data-mslotmove="' + midKey + ':1"]');
    await p.waitForTimeout(200);
    const afterMove = await p.evaluate(() => JSON.parse(localStorage.getItem('bsc.macroSlots')).list.map((s) => s.n));
    t.ok('moving a snack slot reorders it in the day around anchored meals',
      afterMove[2] === 'Mid-Morning Snack', JSON.stringify(afterMove));
    await p.click('#macroAddPop [data-mslotdel="' + midKey + '"]');
    await p.waitForTimeout(200);
    const afterDel = await p.evaluate(() => JSON.parse(localStorage.getItem('bsc.macroSlots')).list.map((s) => s.n));
    t.ok('removing a meal slot takes it out of the daily plan cleanly',
      afterDel.length === 4 && afterDel.indexOf('Mid-Morning Snack') < 0, JSON.stringify(afterDel));
  },
};
