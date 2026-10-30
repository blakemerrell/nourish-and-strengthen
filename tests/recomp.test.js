/* Trends › Recomp (Blake, 2026-10-30): with weight holding near maintenance
 * while he lifts, "am I getting stronger and thinning up in other places?"
 * The scale, the weekly tape and Strengthen's lifts, week by week, and one
 * sentence saying which way they point. */
const seed = (weeks) => {
  const p2 = (n) => (n < 10 ? '0' : '') + n, K = (d) => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
  const ws = {}, am = {}, wo = {}; const now = new Date();
  for (let i = weeks * 7; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i); const k = K(d);
    ws[k] = 205 + (i % 3) * 0.3;                                   // holding, with a little water noise
    if (i % 7 === 0) am[k] = { bm: { wa: Math.round((36.5 - (weeks * 7 - i) * 0.02) * 4) / 4 } };
    if (i % 2 === 0) {
      const st = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 17).getTime();
      wo['w' + i] = { id: 'w' + i, n: 'Full Body A', st, en: st + 3600000, dk: k,
        x: [{ e: 'db-bench', s: [{ w: 60 + (weeks * 7 - i) * 0.15, r: 8, t: st }] }] };
    }
  }
  localStorage.setItem('bsc.macroWeights', JSON.stringify(ws));
  localStorage.setItem('bsc.macroAm', JSON.stringify(am));
  localStorage.setItem('bsc.train', JSON.stringify({ act: 'b1', pr: { ld: [], qz: 1 }, wo,
    ms: { b1: { n: 'Full body', acc: 4, days: [{ n: 'Full Body A', s: [{ e: 'db-bench', n: 3 }] }] } } }));
};
const openRecomp = async (p) => {
  await p.click('.tab[data-view="macros"]');
  await p.waitForTimeout(300);
  await p.click('#macroMore');
  await p.click('#macroMenu [data-mchartopen]');
  await p.waitForTimeout(300);
  await p.click('[data-mchart="recomp"]');
  await p.waitForTimeout(300);
};

module.exports = {
  name: 'Recomp: the scale, the tape and the bar',
  async run(t) {
    const empty = await t.fresh({ viewport: { width: 390, height: 844 } });
    await openRecomp(empty);
    t.ok('with nothing measured or lifted, it says what it needs rather than guessing',
      await empty.evaluate(() => /Two weekly tapes and two weeks of logged lifts/.test(
        (document.querySelector('.mc-rc-say') || {}).textContent || '')));
    await empty.context().close();

    const p = await t.fresh({ viewport: { width: 390, height: 844 } });
    await p.evaluate(seed, 8);
    await p.reload();
    await p.waitForTimeout(600);
    await openRecomp(p);
    const r = await p.evaluate(() => ({
      say: (document.querySelector('.mc-rc-say') || {}).textContent || '',
      lines: document.querySelectorAll('.mc-recomp .mc-rc-svg').length,
      strength: (document.querySelectorAll('.mc-rc-h b')[2] || {}).textContent || '' }));
    t.ok('eight weeks of weight holding, waist shrinking and lifts climbing read as recomposition',
      /^Recomposition over the last \d+ weeks: weight holding, waist down [\d.]+″, strength up [\d.]+%\.$/.test(r.say), r.say);
    t.ok('three lines, weight, waist and strength, and strength said against where it started',
      r.lines === 3 && Number(r.strength) > 100, JSON.stringify(r));
    await p.context().close();
  },
};
