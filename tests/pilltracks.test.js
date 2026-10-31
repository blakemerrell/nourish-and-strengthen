/* The pill's rim as three equal tracks, P, F and C (src/weekstrip.js,
 * mPillDotsSVG): each a third of the way round with its letter at the head,
 * the plan drawn faint, what was eaten drawn strong, and an over macro
 * stopping at the end of its own third and glowing orange.
 *
 * Blake, 2026-10-30: "make each a equal size track around the pill and just
 * the letter at the start of its 1/3 share of the track and it subtle fills
 * based on plan foods and strong fills with heat map on actual logged", and
 * for overages, "stop and glow orange". */
module.exports = { name: 'Week pills — three equal tracks round the rim', async run(t) {
  const p = await t.fresh({ viewport: { width: 390, height: 844 } });
  await p.evaluate(() => {
    const p2 = (n) => (n < 10 ? '0' : '') + n;
    const key = (d) => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
    localStorage.setItem('sh.door', 'test');
    const g = new Date(); g.setDate(g.getDate() + 120);
    localStorage.setItem('bsc.macroProfile', JSON.stringify({
      sex: 'm', age: 43, ft: 5, inch: 10, lb: 195, act: 1.375, goal: 'cut1',
      goalLb: 175, goalBy: key(g), workouts: 3, steps: 8000 }));
    localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 190, f: 60, c: 120 }));
    const rs = window.RECIPES.filter((r) => r.macro && r.macro.kcal > 250);
    const fatty = rs.slice().sort((a, b) => b.macro.f / b.macro.kcal - a.macro.f / a.macro.kcal)[0];
    const lean = rs.slice().sort((a, b) => b.macro.p / b.macro.kcal - a.macro.p / a.macro.kcal)[0];
    const today = new Date();
    const yday = new Date(); yday.setDate(today.getDate() - 1);
    if (yday.getDay() === 0) yday.setDate(yday.getDate() + 2);   // keep it in this week (Mon start)
    const days = {};
    /* Today: one plate eaten, one still on the plan. */
    days[key(today)] = { b: [{ id: lean.id, x: 1, eaten: 1 }], d: [{ id: lean.id, x: 1.5 }] };
    /* Another day of this week, eaten, with fat well past its target. */
    if (key(yday) !== key(today)) days[key(yday)] = { d: [{ id: fatty.id, x: Math.ceil(90 / fatty.macro.f), eaten: 1 }] };
    localStorage.setItem('bsc.macroDays', JSON.stringify(days));
    window.__pt = { today: key(today), other: key(yday) };
  });
  await p.reload();
  await p.waitForTimeout(400);
  await p.click('.tab[data-view="macros"]');
  await p.waitForTimeout(400);

  const keys = await p.evaluate(() => {
    const p2 = (n) => (n < 10 ? '0' : '') + n;
    const key = (d) => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
    const y = new Date(); y.setDate(y.getDate() - 1); if (y.getDay() === 0) y.setDate(y.getDate() + 2);
    return { today: key(new Date()), other: key(y) };
  });
  const rim = (dk) => p.evaluate((dk) => {
    const b = document.querySelector('[data-mweek="' + dk + '"]');
    if (!b) return null;
    const len = (sel) => [...b.querySelectorAll(sel)].map((e) => ({
      len: parseFloat(e.getAttribute('stroke-dasharray')), off: -parseFloat(e.getAttribute('stroke-dashoffset')),
      cls: e.getAttribute('class') }));
    return {
      track: len('.mwk-tr'), plan: len('.mwk-tr-plan'), ate: len('.mwk-tr-ate'),
      letters: [...b.querySelectorAll('.mwk-tr-l')].map((e) => e.textContent),
    };
  }, dk);

  const now = await rim(keys.today);
  t.ok('every pill has three tracks, P, F and C, in that order', !!now && now.track.length === 3 &&
    now.letters.join('') === 'PFC', JSON.stringify(now && now.letters));
  t.ok('and the three are the same length, a third of the rim each, starting a third apart',
    now && now.track.every((s) => s.len === now.track[0].len) &&
      Math.abs(now.track[1].off - now.track[0].off - 100) < 0.01 &&
      Math.abs(now.track[2].off - now.track[1].off - 100) < 0.01,
    JSON.stringify(now && now.track));
  t.ok('today’s plan reaches further round than what has been eaten of it',
    now && now.plan.length === 3 && now.ate.length >= 1 &&
      now.ate.every((a, i) => a.len < (now.plan.find((pl) => pl.off === a.off) || { len: 0 }).len),
    JSON.stringify(now && { plan: now.plan, ate: now.ate }));

  if (keys.other !== keys.today) {
    const over = await rim(keys.other);
    const fat = over && over.ate.find((a) => Math.abs(a.off - over.track[1].off) < 0.01);
    t.ok('a macro past its target stops at the end of its own third, and glows',
      !!fat && Math.abs(fat.len - over.track[1].len) < 0.01 && /is-over/.test(fat.cls),
      JSON.stringify(over && over.ate));
  }

  /* The tray's big pill draws the same rim. */
  await p.click('#macroSum');
  await p.waitForTimeout(300);
  const big = await p.evaluate(() => {
    const s = document.querySelector('.mpt-bigpill .mwk-dots-svg, #macroTray .mwk-dots-svg');
    return s ? [...s.querySelectorAll('.mwk-tr-l')].map((e) => e.textContent).join('') : '';
  });
  t.ok('and the big pill in the day’s detail has the same three tracks', big === 'PFC', big);

  if (process.env.SHOT) {
    await p.click('#macroSum'); await p.waitForTimeout(300);
    await p.locator('.mweek, #macroWeek').first().screenshot({ path: process.env.SHOT });
    await p.click('#macroSum'); await p.waitForTimeout(300);
    await p.screenshot({ path: process.env.SHOT.replace('.png', '-tray.png') });
  }
  await p.context().close();
} };
