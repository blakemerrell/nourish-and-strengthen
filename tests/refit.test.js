const { openRow } = require('./fixtures/nourish.js');
/* The meal re-fits itself as you add (Blake, 2026-10-05).
 *
 * "This needs to feel like magic. The pills are the way it's communicating...
 * I see my protein is full with my egg whites. But I need some fat so I'm
 * going to add some cheese and I need some carbs so I'm going to add a little
 * bit of salsa... and eventually I'm going to have this perfect planned meal."
 *
 * So every change on a meal's sheet re-fits the rest of it (mRefitMeal, by
 * mBalanceMeal's judge); a tap puts down your usual amount, or for a food
 * you have never logged what fits this meal (mMealFitX), and that plate stays
 * where it went; − + and typing mark a plate Kept; Balance lets everything
 * move. The judge keeps three limits: a plateful (400 g), no running more
 * than 3% over the meal's calories to chase a macro, and the day's salt. The
 * foods live in a tray along the bottom with Balance and Done; ⚖, × and the
 * line under the pills left the top. The day's trays carry each meal's pills
 * and every food in cups and spoons before grams.
 *
 * Mockup: https://claude.ai/artifact/TQTp3xjDsvsEabnWYfFF7y */
const DAY = '2026-10-06';

const SETUP = (opt) => {
  localStorage.setItem('bsc.macroProfile', JSON.stringify({ sex: 'm', age: 43, ft: 5, inch: 11, lb: 192, act: 1.55, goal: 'cut1' }));
  localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 190, f: 70, c: 230 }));
  localStorage.setItem('bsc.macroSlots', JSON.stringify({ list: [{ k: 'w', n: 'Wake Up', t: 's' }, { k: 'b', n: 'Breakfast', t: 'b' },
    { k: 'l', n: 'Lunch', t: 'l' }, { k: 'd', n: 'Dinner', t: 'd' }], names: { w: 'Wake Up', b: 'Breakfast', l: 'Lunch', d: 'Dinner' } }));
  localStorage.setItem('bsc.macroSkip', JSON.stringify({ '2026-10-06': ['w'] }));
  const f = (k, x, e) => ({ id: 'f:' + k, x: x, eaten: e ? 1 : 0 });
  const days = { '2026-10-06': { b: [f('greek_yogurt', 1, 1), f('oats', 0.75, 1)].concat(opt.salty ? [f('roast_beef_deli', 8, 1)] : []), l: [], d: [] } };
  // a past day holding the egg whites you usually have
  if (opt.usual) days['2026-10-05'] = { l: [f('egg_white', 1, 1)] };
  localStorage.setItem('bsc.macroDays', JSON.stringify(days));
};

async function sheet(t, opt) {
  const p = await t.fresh({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.clock.setFixedTime(new Date(2026, 9, 6, 11, 30, 0));
  await p.reload();
  await p.waitForTimeout(700);
  await p.evaluate(SETUP, opt || {});
  await p.reload();
  await p.waitForTimeout(900);
  await p.click('.tab[data-view="macros"]');
  await p.waitForTimeout(600);
  await p.click('[data-mopen="l"]');
  await p.waitForTimeout(500);
  return { p, errs };
}
// what a search-and-tap would put down, and then puts it down
async function tap(p, q, id) {
  await p.fill('#mpFind', q);
  await p.waitForTimeout(400);
  const row = p.locator('#mpList [data-mpick="' + id + '"]').first();
  const x = Number(await row.getAttribute('data-mpx'));
  await row.click();
  await p.waitForTimeout(400);
  return x;
}
const lunch = (p) => p.evaluate((d) => JSON.parse(localStorage.getItem('bsc.macroDays'))[d].l || [], DAY);
// the pills' have / want, by their letter
const pills = (p) => p.evaluate(() => {
  const out = {};
  document.querySelectorAll('#modalRoot .msh-top .mcap').forEach((c) => {
    const m = /^(\S+?)([\d,]+)\/([\d,]+)/.exec(c.textContent.replace(/\s+/g, ''));
    if (m) out[{ '🔥': 'k', P: 'p', F: 'f', C: 'c' }[m[1]]] = [Number(m[2].replace(/,/g, '')), Number(m[3].replace(/,/g, ''))];
  });
  return out;
});
const gramsOf = (p) => p.evaluate(() => [...document.querySelectorAll('#modalRoot .msh-on .mrow')].map((r) => ({
  name: r.querySelector('.mrow-nm').textContent, g: Number(r.querySelector('.mstep-x').textContent.replace(/[^\d]/g, '')),
  held: r.classList.contains('held'), was: (r.querySelector('.mrow-g small') || {}).textContent || '' })));

module.exports = {
  name: 'The meal re-fits itself as you add, and its foods ride in a tray',
  async run(t) {
    /* ---- the flow: egg whites, then cheese, then fruit ---- */
    let { p, errs } = await sheet(t);
    const top = await p.evaluate(() => {
      const s = document.querySelector('#modalRoot .msheet');
      return { bal: !!s.querySelector('.msh-top [data-mbal]'), x: !!s.querySelector('.msh-top .sheet-x'),
        say: !!s.querySelector('.mscreen-say'), trayBal: !!s.querySelector('.msh-tray .msh-bal'), done: !!s.querySelector('.msh-tray .msh-done'),
        chip: document.querySelectorAll('#mpList .mp-fitx').length };
    });
    t.ok('Balance and Done ride in the tray along the bottom; the top keeps no ⚖ and no ×', !top.bal && !top.x && top.trayBal && top.done, JSON.stringify(top));
    t.ok('and no line under the pills: the pills say it', !top.say, JSON.stringify(top));
    t.ok('no row carries a Fits chip: a tap does that job now', top.chip === 0, JSON.stringify(top));

    await tap(p, 'egg white', 'f:egg_white');
    const ew = (await lunch(p))[0];
    const pl1 = await pills(p);
    t.ok('egg whites never logged go on at what fits the meal: protein mostly filled, nothing over', ew && ew.x > 1 && pl1.p[0] >= pl1.p[1] * 0.5 &&
      pl1.f[0] <= pl1.f[1] && pl1.c[0] <= pl1.c[1], JSON.stringify({ ew, pl1 }));

    const chx = await tap(p, 'cheddar', 'f:cheddar');
    const l2 = await lunch(p);
    const pl2 = await pills(p);
    t.ok('cheddar goes on sized to this meal, not to the room left in the whole day (it was a cup and a half)', chx > 0 && chx <= 0.875 &&
      pl2.f[0] <= pl2.f[1] * 1.2, JSON.stringify({ chx, pl2 }));
    t.ok('and stays exactly where it went', l2[1] && Math.abs(l2[1].x - chx) < 1e-9, JSON.stringify(l2));
    const head = await p.evaluate(() => (document.querySelector('#mpList .mt-div-for') || {}).textContent || '');
    t.ok('Fits best names the pills still empty', /carbs/.test(head) && !/fat/.test(head), head);

    const onTop = await p.evaluate(() => ({
      sub: (document.querySelector('#modalRoot .msh-on .msh-trt small') || {}).textContent || '',
      rows: [...document.querySelectorAll('#modalRoot .msh-on .mrow .mrow-nm')].map((c) => c.textContent),
    }));
    t.ok('the plate card at the top counts the foods and shows both rows', /2 foods/.test(onTop.sub) && onTop.rows[0] === 'Egg whites' && onTop.rows[1] === 'Cheddar cheese', JSON.stringify(onTop));

    await tap(p, 'banana', 'f:banana');
    const pl3 = await pills(p);
    /* Not every gram of carbs: a third banana would take the meal past its
       calories, and calories win when a plate cannot hit both. */
    t.ok('a banana closes most of the carbs, and the meal lands near its calories without running over them',
      pl3.c[0] >= pl3.c[1] * 0.75 && pl3.k[0] <= pl3.k[1] * 1.03 && pl3.k[0] >= pl3.k[1] * 0.85, JSON.stringify(pl3));

    let rows = await gramsOf(p);
    t.ok('the plate card is open at the top of the page, with each food’s dial', rows.length === 3 && rows.every((r) => r.g > 0), JSON.stringify(rows));
    t.ok('no food past a plateful', rows.every((r) => r.g <= 400), JSON.stringify(rows));

    await openRow(p, 'l:1');
    await p.click('#modalRoot .msh-on [data-mstep="l:1:up"]');
    await p.waitForTimeout(300);
    rows = await gramsOf(p);
    t.ok('− or + on a food makes it yours: it is Kept', rows[1].held, JSON.stringify(rows));

    await p.click('#modalRoot .msh-bal');
    await p.waitForTimeout(300);
    rows = await gramsOf(p);
    const undo = await p.evaluate(() => !!document.querySelector('#modalRoot .mcard-undo, #modalRoot [data-mbalundo]'));
    t.ok('Balance lets everything move again, with no Undo to press', rows.every((r) => !r.held) && !undo, JSON.stringify({ rows, undo }));

    await p.click('#modalRoot .msh-done');
    await p.waitForTimeout(500);
    const day = await p.evaluate(() => {
      const tr = document.querySelector('[data-mopen="l"]').closest('.mtray');
      return { open: !!document.querySelector('#modalRoot .msheet'), caps: tr.querySelectorAll('.mtray-caps .mcap').length,
        lines: [...tr.querySelectorAll('.mtray-f')].map((l) => l.textContent) };
    });
    t.ok('Done takes you back to the day', !day.open, JSON.stringify(day));
    t.ok('where the meal’s tray carries its pills: calories, protein, fat, carbs', day.caps === 4, JSON.stringify(day));
    t.ok('and each food in the kitchen’s words first, then its single best metric measure (mL for liquid egg whites, g for solid cheese)',
      day.lines.some((l) => /Egg whites.*cups?\s*\d+ mL$/.test(l)) &&
      day.lines.some((l) => /Cheddar cheese.*cups?\s*[\d,]+ g$/.test(l)), JSON.stringify(day.lines));
    t.ok('no page errors along the way', errs.length === 0, errs.join(' / '));

    /* ---- an amount you set stays put without jumping the other plates ---- */
    ({ p, errs } = await sheet(t));
    await tap(p, 'egg white', 'f:egg_white');
    await tap(p, 'greek yogurt', 'f:greek_yogurt');
    const ewBefore = (await gramsOf(p))[0].g;
    await openRow(p, 'l:1');
    await p.click('#modalRoot .msh-on [data-mtype="l:1"]');
    await p.waitForTimeout(200);
    await p.fill('#modalRoot [data-mtypein="l:1"]', '100');
    await p.keyboard.press('Enter');
    await p.waitForTimeout(300);
    rows = await gramsOf(p);
    t.ok('an amount you type is yours: it is Kept at it, and the other plates do not jump while you adjust',
      rows[1].held && rows[1].g === 100 && rows[0].g === ewBefore && !rows[0].was, JSON.stringify({ ewBefore, rows }));
    await tap(p, 'cheddar', 'f:cheddar');
    rows = await gramsOf(p);
    t.ok('when another food is added, the Kept food stays at 100 g while unlocked plates auto-balance around it',
      rows[1].held && rows[1].g === 100 && rows[0].g > ewBefore && /was/.test(rows[0].was), JSON.stringify({ ewBefore, rows }));

    /* ---- even if logged before, adding to a planned meal fits the meal ---- */
    ({ p, errs } = await sheet(t, { usual: true }));
    await tap(p, 'egg white', 'f:egg_white');
    const ul = await lunch(p);
    t.ok('a food you have logged still sizes to the meal’s macros when added to a planned meal', ul[0] && ul[0].x > 1, JSON.stringify({ ul }));

    /* ---- salt: the same tap on a salty day puts down less ---- */
    ({ p, errs } = await sheet(t));
    await tap(p, 'egg white', 'f:egg_white');
    const plain = await tap(p, 'salsa', 'f:salsa');
    ({ p, errs } = await sheet(t, { salty: true }));
    await tap(p, 'egg white', 'f:egg_white');
    const salty = await tap(p, 'salsa', 'f:salsa');
    t.ok('salsa after a salty breakfast goes on smaller than on an ordinary day', salty < plain && salty <= 0.25, JSON.stringify({ plain, salty }));
    t.ok('and nothing threw', errs.length === 0, errs.join(' / '));
  },
};
