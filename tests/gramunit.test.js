const { openRow } = require('./fixtures/nourish.js');
/* A food whose serving is already a weight (Blake, 2026-10-06).
 *
 * "Typing in grams in this view is impossible." The food was a butter
 * replacement found on the USDA, which quotes a food with no household
 * measure per "100 g" (src/foodsearch.js; Open Food Facts does the same for
 * a product with no serving size). That unit has no grams of its own, so the
 * dial read it as a serving called "g": it showed "50 g", and once tapped
 * asked for multiples of 100 g in a box the "× 100 g" beside it had squeezed
 * to 7px. Typing the 50 on the dial logged five kilos. The food's own page
 * offered the same "× 100 g". A unit said in grams is now a weight on both,
 * and the typed box keeps room for four digits whatever its unit says. */
const SETUP = () => {
  localStorage.setItem('bsc.macroProfile', JSON.stringify({ sex: 'm', age: 43, ft: 5, inch: 11, lb: 192, act: 1.55, goal: 'cut1' }));
  localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 190, f: 70, c: 230 }));
  localStorage.setItem('bsc.macroSlots', JSON.stringify({ list: [{ k: 'b', n: 'Breakfast', t: 'b' }, { k: 'l', n: 'Lunch', t: 'l' },
    { k: 'd', n: 'Dinner', t: 'd' }], names: { b: 'Breakfast', l: 'Lunch', d: 'Dinner' } }));
  localStorage.setItem('bsc.myFoods', JSON.stringify({
    butter_replacement: { name: 'Butter replacement, without fat, powder', unit: '100 g', kcal: 373, p: 2, f: 1, c: 89, note: 'the USDA' },
    // a serving with no weight at all still counts servings, and its long unit must not crush the box
    trail_mix: { name: 'Trail mix', unit: '1 handful', kcal: 170, p: 5, f: 11, c: 15 } }));
  localStorage.setItem('bsc.macroDays', JSON.stringify({ '2026-10-06': {
    b: [{ id: 'f:my:butter_replacement', x: 0.5, eaten: 0, l: 1 }, { id: 'f:my:trail_mix', x: 1, eaten: 0, l: 1 }], l: [], d: [] } }));
};
const plate = (p, id) => p.evaluate((i) => JSON.parse(localStorage.getItem('bsc.macroDays'))['2026-10-06'].b.find((x) => x.id === i), id);
const row = (name) => [...document.querySelectorAll('#modalRoot .mrow')].find((r) => r.textContent.indexOf(name) >= 0);

module.exports = {
  name: 'A serving said in grams',
  async run(t) {
    const p = await t.fresh({ viewport: { width: 412, height: 915 }, hasTouch: true, isMobile: true });
    await p.clock.setFixedTime(new Date(2026, 9, 6, 8, 30, 0));
    await p.reload();
    await p.waitForTimeout(600);
    await p.evaluate(SETUP);
    await p.reload();
    await p.waitForTimeout(900);
    await p.click('.tab[data-view="macros"]');
    await p.waitForTimeout(500);
    await p.click('[data-mopen="b"]');
    await p.waitForTimeout(500);
    // a meal with food on it opens on its foods (2026-10-08); the tray's strip would be hidden
    if (!(await p.$('#modalRoot .msh-on'))) { await p.click('#modalRoot .msh-tray [data-mtray="1"]'); }
    await p.waitForTimeout(400);

    const dial = await p.evaluate((rowSrc) => {
      const row = eval(rowSrc);
      const r = row('Butter replacement');
      return { dial: r.querySelector('[data-mtype]').textContent, tag: r.querySelector('[data-mtype]').dataset.mtype,
        small: (r.querySelector('.mitem-uom') || {}).textContent || '' };
    }, '(' + row.toString() + ')');
    t.ok('a “100 g” food dials in grams: half of it is 50 g', dial.dial === '50 g', JSON.stringify(dial));
    t.ok('and the small print does not say the same 50 g again', dial.small === '', JSON.stringify(dial));

    await openRow(p, dial.tag);
    await p.click('[data-mtype="' + dial.tag + '"]');
    await p.waitForTimeout(300);
    const box = await p.evaluate((tag) => {
      const i = document.querySelector('[data-mtypein="' + tag + '"]');
      const u = i.parentElement.querySelector('i');
      return { w: i.getBoundingClientRect().width, unit: u ? u.textContent : '', ph: i.placeholder };
    }, dial.tag);
    t.ok('tapped, it asks for grams, with the 50 behind the box', box.unit === 'g' && box.ph === '50', JSON.stringify(box));
    t.ok('and the box has room for four digits', box.w >= 30, JSON.stringify(box));
    await p.keyboard.type('30');
    await p.keyboard.press('Enter');
    await p.waitForTimeout(400);
    const typed = await plate(p, 'f:my:butter_replacement');
    t.ok('typing 30 puts down 30 g, not thirty hundreds of grams', !!typed && Math.abs(typed.x - 0.3) < 1e-6, JSON.stringify(typed));

    // a long unit beside the box goes under it rather than squeezing it
    const tm = await p.evaluate((rowSrc) => { const row = eval(rowSrc); return row('Trail mix').querySelector('[data-mtype]').dataset.mtype; }, '(' + row.toString() + ')');
    await openRow(p, tm);
    await p.click('[data-mtype="' + tm + '"]');
    await p.waitForTimeout(300);
    const box2 = await p.evaluate((tag) => {
      const i = document.querySelector('[data-mtypein="' + tag + '"]');
      const u = i.parentElement.querySelector('i');
      const col = i.closest('.mrow-g').getBoundingClientRect();
      const ub = u.getBoundingClientRect();
      return { w: i.getBoundingClientRect().width, unit: u.textContent, inCol: ub.left >= col.left - 1 && ub.right <= col.right + 1 };
    }, tm);
    t.ok('a food counted in servings keeps a four-digit box beside a long unit, and the unit stays in its column',
      box2.w >= 30 && /handful/.test(box2.unit) && box2.inCol, JSON.stringify(box2));
    // left empty, the box changes nothing
    await p.keyboard.press('Enter');
    await p.waitForTimeout(300);
    const tmx = await plate(p, 'f:my:trail_mix');
    t.ok('and an empty box left alone changes nothing', !!tmx && tmx.x === 1, JSON.stringify(tmx));
    if (!(await p.$('#modalRoot .mrow [data-mfood]'))) { await p.click('#modalRoot .msh-tray [data-mtray="1"]').catch(() => {}); await p.waitForTimeout(300); }

    // the food's own page: the same food, the same unit
    await p.evaluate((rowSrc) => { const row = eval(rowSrc); row('Butter replacement').querySelector('[data-mfood]').click(); }, '(' + row.toString() + ')');
    await p.waitForTimeout(500);
    const fs = await p.evaluate(() => ({
      amt: (document.getElementById('mfsAmt') || {}).value,
      unit: ((document.querySelector('.mfs-u') || document.querySelector('#mfsUnit option:checked')) || {}).textContent,
    }));
    t.ok('the food’s own page offers it in grams too', fs.unit === 'g', JSON.stringify(fs));
    // the plate's line since the page went compact (2026-10-11): "On your plate · 30 g"
    const one = await p.evaluate(() => (document.querySelector('#modalRoot .mfs-plate .mfs-k') || {}).textContent || '');
    t.ok('and says the plate once: “30 g”, not “30 g · 30 g”', /On your plate · 30 g$/.test(one.trim()), one);
    await p.fill('#mfsAmt', '40');
    await p.waitForTimeout(200);
    await p.click('#mfsAdd');
    await p.waitForTimeout(500);
    const all = await p.evaluate(() => JSON.parse(localStorage.getItem('bsc.macroDays'))['2026-10-06'].b
      .filter((x) => x.id === 'f:my:butter_replacement').reduce((n, x) => n + x.x, 0));
    t.ok('and 40 typed there adds 40 g: 70 g of it in all, not four kilos', Math.abs(all - 0.7) < 1e-6, String(all));

    await p.context().close();
  },
};
