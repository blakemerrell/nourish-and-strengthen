/* Everything Health Connect has that the app has a use for (src/healthdata.js,
 * 2026-10-30). Blake: "get it so we get ALL of health connect data that makes
 * sense to get on this end". The Android app reads it and hands it to
 * Health.onData; this feeds that the same payload shape and checks it is kept
 * on the phone only, and shows where it should: recovery, the watch's own
 * workouts, active calories, sleep stages and body fat in Move and recover;
 * recovery and the watch's workout on the day card; and a recovery line over
 * Strengthen's next session.
 */
module.exports = { name: 'Health Connect, all of it that makes sense', async run(t) {
  const p = await t.fresh({ viewport: { width: 390, height: 844 } });
  const today = await p.evaluate(() => {
    const p2 = (n) => (n < 10 ? '0' : '') + n;
    const K = (d) => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
    localStorage.setItem('sh.door', 'test');
    const g = new Date(); g.setDate(g.getDate() + 120);
    localStorage.setItem('bsc.macroProfile', JSON.stringify({
      sex: 'm', age: 43, ft: 5, inch: 10, lb: 205, act: 1.375, goal: 'cut1',
      goalLb: 180, goalBy: K(g), workouts: 4, steps: 7000 }));
    localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 170, f: 60, c: 120 }));
    const r = window.RECIPES.find((x) => x.macro && x.macro.kcal > 300);
    localStorage.setItem('bsc.macroDays', JSON.stringify({ [K(new Date())]: { b: [{ id: r.id, x: 1, eaten: 1 }] } }));
    const st = new Date(); st.setHours(6, 0, 0, 0);
    localStorage.setItem('bsc.train', JSON.stringify({ act: 'b1', pr: { ld: [], qz: 1, u: 'lb' }, wo: {},
      ms: { b1: { n: 'Upper / lower', acc: 4, days: [{ n: 'Upper A', s: [{ e: 'db-bench', n: 3 }] }] } } }));
    return K(new Date());
  });
  await p.reload();
  await p.waitForTimeout(500);
  await p.click('.tab[data-view="macros"]');
  await p.waitForTimeout(300);

  /* A month the shape MainActivity sends: a normal resting heart rate of 55
     and HRV of 45, then this morning 61 and 34 — a body working on something. */
  const kept = await p.evaluate((tk) => {
    const p2 = (n) => (n < 10 ? '0' : '') + n;
    const K = (d) => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
    const days = {};
    for (let i = 30; i >= 1; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      days[K(d)] = { rhr: 55 + (i % 3) - 1, hrv: 45 + (i % 5) - 2, steps: 7000 };
    }
    const st = new Date(); st.setHours(9, 0, 0, 0);
    days[tk] = { rhr: 61, hrv: 34, sleepHours: 6.5, actKcal: 812, totKcal: 2950, distM: 9800, bodyFat: 24.6,
      leanLb: 152.3, vo2: 41.2, spo2: 95.5, resp: 14.2, steps: 11200, weightLb: 204.8,
      sleepStages: { deep: 62, rem: 95, light: 220, awake: 13 } };
    window.Health.onData(JSON.stringify({ status: 'granted', syncedAt: Date.now(), days,
      ex: [{ d: tk, type: 'Golf', st: st.getTime(), en: st.getTime() + 3 * 3600000, min: 180, hrAvg: 104, hrMax: 141, kcal: 790, distM: 7400, src: 'com.google.android.apps.fitness' }] }));
    const raw = JSON.parse(localStorage.getItem('bsc.health') || '{}');
    return { today: raw.d && raw.d[tk], ex: raw.ex, normal: window.HealthData.normal('rhr', tk) };
  }, today);
  t.ok('what Health Connect sends is kept: heart, calories, body, breathing, stages and the watch’s workouts',
    !!kept.today && kept.today.rhr === 61 && kept.today.hrv === 34 && kept.today.actKcal === 812 &&
      kept.today.bodyFat === 24.6 && kept.today.sleepStages.deep === 62 && kept.ex.length === 1 && kept.ex[0].type === 'Golf',
    JSON.stringify(kept).slice(0, 300));
  t.ok('and your normal is your own month, not this morning (resting HR 55)', kept.normal === 55, String(kept.normal));
  /* The sync names the keys it carries (src/sync.js); this one is not among
     them, and nothing in it builds a key from a prefix. */
  t.ok('and none of it is in a key the household sync carries',
    await p.evaluate(async () => { const src = await (await fetch('src/sync.js?v=0')).text();
      return src.length > 1000 && !/bsc\.health/.test(src); }));

  /* Move and recover */
  if (!(await p.$('#macroPillTray'))) { await p.click('#macroSum'); await p.waitForTimeout(300); }
  const mr = await p.evaluate(() => {
    const tray = document.getElementById('macroPillTray');
    const g = (sel) => { const e = tray && tray.querySelector(sel); return e ? e.innerText.replace(/\s+/g, ' ') : ''; };
    return { rec: g('[data-mrec]'), level: (tray.querySelector('[data-mrec]') || {}).dataset?.mrec || '', golf: g('[data-mwatch]'),
      act: g('[data-mact]'), all: tray ? tray.innerText.replace(/\s+/g, ' ') : '' };
  });
  t.ok('Move and recover says how recovered you are, and why, against your own normal',
    mr.level === 'low' && /Under-recovered|under-recovered/.test(mr.rec) && /resting HR 61, 6 above your normal/.test(mr.rec) && /HRV 34 ms/.test(mr.rec),
    JSON.stringify(mr.rec));
  t.ok('and shows the watch’s golf with its heart rate and calories',
    /Golf/.test(mr.golf) && /3h/.test(mr.golf) && /avg 104 bpm/.test(mr.golf) && /790 kcal/.test(mr.golf), mr.golf);
  t.ok('and the calories the watch saw you burn moving', /812/.test(mr.act), mr.act);
  t.ok('and the night’s deep sleep and REM, and body fat beside the weight',
    /deep 1h 2m/.test(mr.all) && /REM 1h 35m/.test(mr.all) && /24\.6% body fat/.test(mr.all), mr.all.slice(-400));
  if (process.env.SHOT) await p.locator('#macroPillTray').screenshot({ path: process.env.SHOT });

  /* The day card */
  await p.click('#macroMore'); await p.waitForTimeout(120);
  await p.click('[data-mmore="went"]'); await p.waitForTimeout(400);
  const card = await p.evaluate(() => [...document.querySelectorAll('.ds-sheet .ds-lift')].map((e) => e.textContent));
  t.ok('the day card carries the recovery and the watch’s workout under its rings',
    card.some((l) => /^Under-recovered/.test(l)) && card.some((l) => /^Golf · 180 min · avg 104 bpm · 790 kcal \(watch\)$/.test(l)),
    JSON.stringify(card));
  await p.click('.ds-sheet .sheet-x'); await p.waitForTimeout(300);

  /* Strengthen */
  await p.click('.tab[data-view="train"]');
  await p.waitForTimeout(500);
  const ready = await p.evaluate(() => (document.querySelector('.tr-ready') || {}).textContent || '');
  t.ok('Strengthen says it over the session you are about to start',
    /^Under-recovered · resting HR 61/.test(ready) && /flat day is information/.test(ready), ready);
  if (process.env.SHOT) await p.screenshot({ path: process.env.SHOT.replace('.png', '-train.png') });
  await p.context().close();
} };
