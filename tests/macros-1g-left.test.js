/* What's left, big (redesign 1g). Blake, 2026-11-20, asked what he looks at
 * first when Eat opens: "What's left, big". The day's calories left lead the
 * box at display size, protein, fat and carbohydrate left under them, and
 * the week strip folds behind "This week", remembered on this phone.
 *
 * Part of the Nourish suite (tests/fixtures/nourish.js, which opens the
 * strip for the older suites; this one starts it folded). */
const { nourish } = require('./fixtures/nourish.js');

module.exports = nourish({
  name: 'Macros — what’s left, big, with the week folded behind This week (1g)',
  async suite(t) {
    const p = await t.fresh({ viewport: { width: 390, height: 844 } });
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await p.evaluate(() => {
      localStorage.removeItem('sh.mweek');
      const p2 = (n) => (n < 10 ? '0' : '') + n, d = new Date();
      const k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
      localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 180, f: 70, c: 230 }));
      localStorage.setItem('bsc.macroDays', JSON.stringify({ [k]: { b: [{ id: 27, x: 1, eaten: 1 }], l: [], d: [{ id: 310, x: 1, eaten: 0 }], s: [] } }));
    });
    await p.reload();
    await p.click('.tab[data-view="macros"]');
    await p.waitForTimeout(300);

    const read = () => p.evaluate(() => {
      const L = document.querySelector('#macroLeft .mleft');
      const big = L && L.querySelector('.mleft-k > b');
      const head = document.querySelector('#macroTrayHead .mpillwk-rem');
      const rows = L ? [...L.querySelectorAll('.mleft-row')].map((r) => ({ m: r.dataset.mleft, v: r.querySelector('.mleft-rv').textContent.trim() })) : [];
      const wk = document.getElementById('macroWeek');
      const btn = L && L.querySelector('[data-mweekfold]');
      return { big: big ? big.textContent.trim() : '', bigPx: big ? parseFloat(getComputedStyle(big).fontSize) : 0,
        kt: L ? L.querySelector('.mleft-kt').textContent.trim() : '', head: head ? head.textContent.trim() : '', rows,
        weekShown: !!wk && !wk.hidden && wk.getBoundingClientRect().height > 0, exp: btn && btn.getAttribute('aria-expanded'),
        btnH: btn ? btn.getBoundingClientRect().height : 0, w: document.documentElement.scrollWidth,
        dataMacro: L ? L.querySelectorAll('[data-macro]').length : -1 };
    });
    let r = await read();
    t.ok('calories left lead the box at display size, saying "calories left" and the target',
      /^[\d,]+$/.test(r.big) && r.bigPx >= 30 && /^calories left/.test(r.kt) && /of [\d,]+/.test(r.kt), JSON.stringify(r));
    t.ok('the same number as the head’s "N left" badge, so the two never disagree',
      r.head === r.big + ' left', JSON.stringify({ big: r.big, head: r.head }));
    t.ok('protein, fat and carbs each say what is left in grams',
      r.rows.map((x) => x.m).join() === 'p,f,c' && r.rows.every((x) => /^\d+ g (left|over)$/.test(x.v)), JSON.stringify(r.rows));
    t.ok('and none of it wears data-macro, which the day’s bars answer to', r.dataMacro === 0, String(r.dataMacro));
    t.ok('the week strip starts folded, with This week saying so, a thumb wide',
      !r.weekShown && r.exp === 'false' && r.btnH >= 44, JSON.stringify(r));

    await p.click('#macroLeft [data-mweekfold]');
    await p.waitForTimeout(250);
    r = await read();
    t.ok('This week opens the strip', r.weekShown && r.exp === 'true', JSON.stringify(r));
    await p.reload();
    await p.click('.tab[data-view="macros"]');
    await p.waitForTimeout(300);
    r = await read();
    t.ok('and it stays open on this phone after a reload', r.weekShown && r.exp === 'true', JSON.stringify(r));
    await p.click('#macroLeft [data-mweekfold]');
    await p.waitForTimeout(250);
    r = await read();
    t.ok('and folds again', !r.weekShown && r.exp === 'false', JSON.stringify(r));

    await p.setViewportSize({ width: 320, height: 700 });
    await p.waitForTimeout(200);
    r = await read();
    t.ok('at 320 px nothing is wider than the phone', r.w <= 320, String(r.w));
    t.ok('no page errors', errs.length === 0, errs.join(' | '));
  }
});
