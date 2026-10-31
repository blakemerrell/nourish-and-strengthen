/* The day with everything the app knows about it (2026-10-30). Blake, with
 * Health Connect and Strengthen both feeding Nourish: "Workout lifting day I
 * feel should show some interesting stats from my workout today/plan for the
 * day", and "the how the day went and other trend stats I feel can get a
 * major lift now ... enhance and simplify". So:
 *
 *   - the workout tile reads Strengthen: the session in numbers once done,
 *     today's planned session before it;
 *   - the day card adds the one thing that moved the day, move and recover,
 *     the week's lifting and sleep, and where it is all heading;
 *   - Trends folds from five tabs to three: Weight, Body, Vs plan.
 */
const p2 = (n) => (n < 10 ? '0' : '') + n;

async function seed(p, { lifted }) {
  await p.evaluate((lifted) => {
    const p2 = (n) => (n < 10 ? '0' : '') + n;
    const K = (d) => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
    const ago = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
    localStorage.setItem('sh.door', 'test');
    const g = new Date(); g.setDate(g.getDate() + 120);
    localStorage.setItem('bsc.macroProfile', JSON.stringify({
      sex: 'm', age: 43, ft: 5, inch: 10, lb: 205, act: 1.375, goal: 'cut1',
      goalLb: 180, goalBy: K(g), workouts: 4, steps: 7000 }));
    localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 170, f: 60, c: 120 }));
    // a heavy evening on top of a light day: over, and the snack is why
    const rs = window.RECIPES.filter((r) => r.macro && r.macro.kcal > 300);
    const sweet = rs.slice().sort((a, b) => b.macro.c / b.macro.kcal - a.macro.c / a.macro.kcal)[0];
    const lean = rs.slice().sort((a, b) => b.macro.p / b.macro.kcal - a.macro.p / a.macro.kcal)[0];
    const days = {};
    for (let i = 6; i >= 0; i--) {
      days[K(ago(i))] = { b: [{ id: lean.id, x: 1, eaten: 1 }] };
    }
    days[K(ago(0))].s = [{ id: sweet.id, x: Math.ceil(2600 / sweet.macro.kcal), eaten: 1 }];
    localStorage.setItem('bsc.macroDays', JSON.stringify(days));
    // a fortnight of mornings, drifting up: the trend says so
    const ws = {}, am = {};
    for (let i = 14; i >= 0; i--) {
      ws[K(ago(i))] = Math.round((203 + (14 - i) * 0.12) * 10) / 10;
      am[K(ago(i))] = { sl: 7 + (i % 3) * 0.5, sy: 6000 + i * 100 };
    }
    localStorage.setItem('bsc.macroWeights', JSON.stringify(ws));
    localStorage.setItem('bsc.macroAm', JSON.stringify(am));
    const st0 = ago(0); st0.setHours(6, 0, 0, 0);
    const st3 = ago(3); st3.setHours(6, 0, 0, 0);
    const wo = {
      w0: { id: 'w0', n: 'Upper A', st: st3.getTime(), en: st3.getTime() + 2700000, dk: K(ago(3)), u: 'lb',
        x: [{ e: 'db-bench', s: [{ w: 60, r: 8 }, { w: 60, r: 8 }, { w: 60, r: 8 }] }] },
    };
    if (lifted) {
      wo.w1 = { id: 'w1', n: 'Upper A', st: st0.getTime(), en: st0.getTime() + 3120000, dk: K(ago(0)), u: 'lb',
        x: [{ e: 'db-bench', s: [{ w: 65, r: 8 }, { w: 65, r: 8 }, { w: 65, r: 9 }] }] };
    }
    localStorage.setItem('bsc.train', JSON.stringify({ act: 'b1', pr: { ld: [], qz: 1, u: 'lb' }, wo,
      ms: { b1: { n: 'Upper / lower', acc: 4, days: [{ n: 'Upper A', s: [{ e: 'db-bench', n: 3 }] }] } } }));
  }, lifted);
  await p.reload();
  await p.waitForTimeout(500);
  await p.click('.tab[data-view="macros"]');
  await p.waitForTimeout(400);
}

module.exports = { name: 'The day, with Strengthen and Health in it', async run(t) {
  /* ---- done: the workout tile is the session in numbers ---------------- */
  const p = await t.fresh({ viewport: { width: 390, height: 844 } });
  await seed(p, { lifted: true });
  await p.click('#macroSum');
  await p.waitForTimeout(300);
  const wo = await p.evaluate(() => {
    const e = document.querySelector('.mpt-wo');
    return e ? { mode: e.dataset.mwo, text: e.innerText.replace(/\s+/g, ' ') } : null;
  });
  t.ok('a workout done in Strengthen shows on the day as its sets, its weight moved and its records',
    !!wo && wo.mode === 'done' && /Upper A/.test(wo.text) && /\b3\s*sets/.test(wo.text) && /52 min/.test(wo.text),
    JSON.stringify(wo));
  // 65×8 + 65×8 + 65×9 = 1625 against 60×8×3 = 1440: +13%
  t.ok('and the weight moved is against the last time that workout was done (+13%)',
    !!wo && /\+13%/.test(wo.text), wo && wo.text);
  if (process.env.SHOT) await p.locator('#macroPillTray').screenshot({ path: process.env.SHOT.replace('.png', '-tile.png') });

  /* ---- the day card ---------------------------------------------------- */
  await p.click('#macroMore');
  await p.waitForTimeout(120);
  await p.click('[data-mmore="went"]');
  await p.waitForTimeout(400);
  const card = await p.evaluate(() => {
    const sh = document.querySelector('.ds-sheet');
    if (!sh) return null;
    return {
      says: sh.querySelector('.ds-says').textContent,
      heads: [...sh.querySelectorAll('.ds-h')].map((h) => h.textContent),
      one: (sh.querySelector('.ds-one') || {}).textContent || '',
      minis: [...sh.querySelectorAll('.ds-mini span')].map((s) => s.textContent),
      lift: (sh.querySelector('.ds-lift') || {}).textContent || '',
      wrows: [...sh.querySelectorAll('.ds-wrow')].map((r) => r.children.length),
      trend: [...sh.querySelectorAll('.ds-tr')].map((r) => r.textContent),
      wide: sh.scrollWidth <= sh.clientWidth + 1,
    };
  });
  t.ok('the day card names the one thing that moved the day, and where the day lands without it',
    !!card && card.heads.includes('The one thing that moved the day') && /Without it you’d have been \d/.test(card.one),
    JSON.stringify(card && { heads: card.heads, one: card.one }));
  t.ok('and calls a lifting day a lifting day, bluntly',
    !!card && /lifting day/i.test(card.says + card.one), card && card.says);
  t.ok('and shows move and recover as three rings: steps, sleep, lifting',
    !!card && card.minis.join() === 'steps,sleep,sets lifted' && /Upper A/.test(card.lift), JSON.stringify(card && { m: card.minis, l: card.lift }));
  t.ok('and the week carries who lifted and how long they slept, a day to a column',
    !!card && card.wrows.length === 2 && card.wrows.every((n) => n === 7), JSON.stringify(card && card.wrows));
  t.ok('and says where it is heading: the weight’s week-on-week, the waist, and strength',
    !!card && card.trend.some((r) => /^Weight\+0\.\d/.test(r)) && card.trend.some((r) => /^Waist/.test(r)),
    JSON.stringify(card && card.trend));
  t.ok('and none of it runs off the side of a phone', !!card && card.wide);
  if (process.env.SHOT) {
    await p.locator('.ds-sheet').screenshot({ path: process.env.SHOT });
  }
  await p.click('.ds-sheet .sheet-x');
  await p.waitForTimeout(300);

  /* ---- Trends: three tabs ------------------------------------------------ */
  await p.click('#macroMore'); await p.click('#macroMenu [data-mchartopen]');
  await p.waitForTimeout(300);
  const tabs = await p.evaluate(() => ({
    top: [...document.querySelectorAll('.mc-tabs [data-mchart]')].map((b) => b.textContent),
    sub: [...document.querySelectorAll('.mc-sub [data-mchart]')].map((b) => b.textContent),
  }));
  t.ok('Trends is three tabs, Weight, Body and Vs plan, with the scale’s three readings under Weight',
    tabs.top.join() === 'Weight,Body,Vs plan' && tabs.sub.join() === 'Trend,Weekly rate,Overnight', JSON.stringify(tabs));
  await p.click('.mc-sub [data-mchart="rate"]');
  await p.waitForTimeout(200);
  t.ok('and the weekly rate is still Weight, lit as such',
    await p.evaluate(() => document.querySelector('.mc-tabs [data-mchart="weight"]').getAttribute('aria-pressed') === 'true' &&
      document.querySelector('.mc-sub [data-mchart="rate"]').getAttribute('aria-pressed') === 'true'));
  await p.click('.mc-tabs [data-mchart="off"]');
  await p.waitForTimeout(200);
  t.ok('and Vs plan has no Weight row under it',
    await p.evaluate(() => !document.querySelector('.mc-sub')));
  if (process.env.SHOT) await p.screenshot({ path: process.env.SHOT.replace('.png', '-trends.png') });
  await p.context().close();

  /* ---- not done yet: the planned session -------------------------------- */
  const q = await t.fresh({ viewport: { width: 390, height: 844 } });
  await seed(q, { lifted: false });
  await q.click('#macroSum');
  await q.waitForTimeout(300);
  const plan = await q.evaluate(() => {
    const e = document.querySelector('.mpt-wo');
    return e ? { mode: e.dataset.mwo, text: e.innerText.replace(/\s+/g, ' ') } : null;
  });
  const tdy = await q.evaluate(() => JSON.stringify(window.Train && window.Train.today ? window.Train.today() : null));
  /* With no lifting days picked the block's next session is due today, so the
     tile shows it; on a day the block calls rest it falls back to the tick. */
  t.ok('before the workout, the tile is today’s planned session from the block',
    !!plan && plan.mode === 'plan' && /Upper A/.test(plan.text) && /1 lift/.test(plan.text), JSON.stringify({ plan, tdy }));
  if (process.env.SHOT) await q.locator('#macroPillTray').screenshot({ path: process.env.SHOT.replace('.png', '-plan.png') });
  await q.context().close();
} };
