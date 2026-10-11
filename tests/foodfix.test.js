/* A scan's numbers fixed from the label (Blake, 2026-10-11).
 *
 * He scanned a can of Spylt chocolate milk and the day said 540 mL of it was
 * 43 kcal and 11 g of protein. The can says 90 kcal and 20 g for 325 mL:
 * Open Food Facts had the figures per fluid ounce filed as per 100 mL, and
 * a saved food's numbers could not be changed. He chose to correct the scan
 * himself: the label typed as it is printed, for its serving, put back over
 * the food's own unit so every plate keeps its amount, and kept for next
 * time — the barcode remembered, so the same can scanned again opens his
 * food and asks nobody. The food's own page went compact with it ("this
 * whole think is really hard to use, make this a lot more compact please").
 *
 * Open Food Facts is answered from here; the USDA is refused by t.fresh. */
const SLOTS = { list: [{ k: 'b', n: 'Breakfast', t: 'b' }, { k: 'l', n: 'Lunch', t: 'l' }, { k: 'd', n: 'Dinner', t: 'd' },
  { k: 's', n: 'Evening Snack', t: 's' }], names: { b: 'Breakfast', l: 'Lunch', d: 'Dinner', s: 'Evening Snack' } };
const SETUP = ({ foods, days }) => {
  localStorage.setItem('bsc.macroProfile', JSON.stringify({ sex: 'm', age: 43, ft: 5, inch: 11, lb: 192, act: 1.55, goal: 'cut1' }));
  localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 190, f: 70, c: 230 }));
  localStorage.setItem('bsc.macroSlots', JSON.stringify(foods.slots));
  localStorage.setItem('bsc.myFoods', JSON.stringify(foods.mine));
  localStorage.setItem('bsc.macroDays', JSON.stringify(days));
};
// what the scan saved: per 100 mL, a fluid ounce's worth
const WRONG = { name: 'Spylt Chocolate milk', unit: '100 mL', kcal: 8, p: 2, f: 0, c: 0, alg: ['milk'], ns: 'b', nova: 4 };
const LABEL = { mffServ: '1 can', mffN: '325', mffKcal: '90', mffP: '20', mffF: '0.5', mffC: '3', mffFib: '1', mffSug: '0',
  mffNa: '320', mffSat: '0', mffChol: '15', mffCa: '483', mffFe: '1', mffK: '247', mffCode: '850045887018' };
const stored = (p) => p.evaluate(() => ({ food: JSON.parse(localStorage.getItem('bsc.myFoods')).spylt_chocolate_milk,
  days: JSON.parse(localStorage.getItem('bsc.macroDays')) }));

module.exports = {
  name: 'A scan fixed from its label',
  async run(t) {
    async function page(width, mine, days) {
      const p = await t.fresh({ viewport: { width, height: 860 }, hasTouch: true, isMobile: true });
      p.offAsked = 0;
      await p.context().route(/world\.openfoodfacts\.org/, async (r) => {
        p.offAsked++;
        await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 1, product: {
          product_name: 'Chocolate milk', brands: 'Spylt', serving_size: '1 fl oz (30 ml)', allergens_tags: ['en:milk'],
          nutriments: { 'energy-kcal_100g': 8.2, proteins_100g: 1.8, fat_100g: 0.05, carbohydrates_100g: 0.3 } } }) });
      });
      await p.clock.setFixedTime(new Date(2026, 9, 11, 21, 0, 0));
      await p.reload();
      await p.waitForTimeout(500);
      await p.evaluate(SETUP, { foods: { slots: SLOTS, mine }, days });
      await p.reload();
      await p.waitForTimeout(800);
      await p.click('.tab[data-view="macros"]');
      await p.waitForTimeout(500);
      return p;
    }
    // the snack's food, opened from its line on the day (the card's Foods)
    async function openFood(p) {
      for (let i = 0; i < 3 && !(await p.$('#macroSlots [data-mslot="s"] [data-mfood]')); i++) {
        await p.click('[data-mview="s"]');
        await p.waitForTimeout(250);
      }
      await p.click('#macroSlots [data-mslot="s"] [data-mfood="f:my:spylt_chocolate_milk"]');
      await p.waitForTimeout(500);
    }

    // ---- the food's page, compact -----------------------------------------
    const days = { '2026-10-11': { b: [{ id: 'f:greek_yogurt', x: 1, eaten: 1 }], l: [], d: [],
      s: [{ id: 'f:my:spylt_chocolate_milk', x: 5.4, eaten: 1 }] },
      '2026-10-09': { s: [{ id: 'f:my:spylt_chocolate_milk', x: 3.25, eaten: 1 }] } };
    const p = await page(390, { spylt_chocolate_milk: WRONG }, days);
    await openFood(p);
    const before = await p.evaluate(() => {
      const sh = document.querySelector('#modalRoot .sheet');
      const kids = [...sh.children];
      const fix = document.querySelector('[data-mffix]');
      return { plate: (document.querySelector('.mfs-plate') || {}).textContent || '',
        amt: (document.getElementById('mfsAmt') || {}).value, unit: (document.querySelector('.mfs-u') || {}).textContent,
        meta: (document.querySelector('.mfs-meta') || {}).textContent || '',
        grid: [...document.querySelectorAll('.mfs-grid .mfs-nr span')].map((x) => x.textContent).join(),
        tall: Math.round(kids[kids.length - 1].getBoundingClientRect().bottom - sh.getBoundingClientRect().top),
        fixH: fix ? Math.round(fix.getBoundingClientRect().height) : 0 };
    });
    t.ok('the scanned food\'s page says what the day said: 540 mL is 43 kcal and 11 g of protein',
      /On your plate · 540 mL/.test(before.plate) && /43 kcal · 11P/.test(before.plate), before.plate);
    t.ok('and offers more of it in millilitres, starting at the 540 you had, not “5.4 × 100 mL”',
      before.amt === '540' && before.unit === 'mL', JSON.stringify(before));
    t.ok('what it is and where it came from on one line',
      /^One of it: 100 mL · Contains milk · Nutri-Score B · Ultra-processed \(NOVA 4\) · Open Food Facts$/.test(before.meta.trim()), before.meta);
    t.ok('the label a grid, the four the day counts first', before.grid === 'Calories,Protein,Fat,Carbs,Sodium,Fiber', before.grid);
    t.ok('and the whole page fits well inside a phone screen', before.tall > 0 && before.tall < 560, String(before.tall));
    t.ok('a food of your own can be fixed, from a thumb-tall line', before.fixH >= 44, String(before.fixH));

    // ---- the fix --------------------------------------------------------
    await p.click('[data-mffix]');
    await p.waitForTimeout(300);
    const pre = await p.evaluate(() => ({ n: document.getElementById('mffN').value, p: document.getElementById('mffP').value,
      serv: document.getElementById('mffServ').value }));
    t.ok('the form opens on the food as it stands: 100 mL, 2 g of protein', pre.n === '100' && pre.p === '2' && pre.serv === '',
      JSON.stringify(pre));
    /* Filled from the boxes once they are drawn: it was worked out before
       they existed, and opened saying the serving had no size. */
    const opening = await p.evaluate(() => document.getElementById('mffWhat').textContent);
    t.ok('and opens saying what the food is now, not an error', /^100 mL8 kcal · 2P · 0F · 0C/.test(opening), opening);
    for (const [id, v] of Object.entries(LABEL)) await p.fill('#' + id, v);
    await p.waitForTimeout(200);
    const what = await p.evaluate(() => document.getElementById('mffWhat').textContent);
    t.ok('as the can is typed, it says what one of the food becomes, in decimals',
      /^100 mL30 kcal · 6\.2P · 0\.2F · 0\.9C/.test(what), what);
    t.ok('and what the plate becomes, against what it was', /540 mL on your plate160 kcal · 33Pwas 43 kcal · 11P/.test(what), what);
    t.ok('and why it counts 97 kcal a can where the can says 90', /label says 90 kcal; the app counts 97/.test(what), what);
    t.ok('and that the barcode will open these numbers next time', /Scan 850045887018 again/.test(what), what);
    // a serving with no size cannot be put over 100 mL
    await p.fill('#mffN', '');
    await p.click('[data-mffsave]');
    await p.waitForTimeout(200);
    const refused = await p.evaluate(() => ({ note: document.getElementById('mffNote').textContent, open: !!document.getElementById('mffN') }));
    t.ok('a serving with no size is refused, and says so', refused.open && /how many mL/.test(refused.note), JSON.stringify(refused));
    t.ok('and nothing was saved', (await stored(p)).food.p === 2);
    await p.fill('#mffN', '325');
    await p.click('[data-mffsave]');
    await p.waitForTimeout(500);
    const after = await stored(p);
    const f = after.food;
    t.ok('saved over the food\'s own 100 mL, to four figures: 6.154 g of protein, 0.1538 of fat, 0.9231 of carbs',
      f.unit === '100 mL' && f.p === 6.154 && f.f === 0.1538 && f.c === 0.9231, JSON.stringify(f));
    t.ok('with the rest of the label: sodium, fiber, and calcium and the others for its page',
      f.na === 98.46 && f.fib === 0.3077 && f.lab && f.lab.ca === 148.6 && f.lab.k === 76 && f.lab.chol === 4.615, JSON.stringify(f));
    t.ok('the can remembered as its serving, and the barcode', f.sz && f.sz.t === '1 can' && f.sz.n === 325 && f.code === '850045887018',
      JSON.stringify(f));
    t.ok('and what the scan knew kept: its allergens and grades', f.alg.join() === 'milk' && f.ns === 'b' && f.nova === 4, JSON.stringify(f));
    t.ok('every plate keeps its amount: 540 mL tonight, a can on Friday',
      after.days['2026-10-11'].s[0].x === 5.4 && after.days['2026-10-09'].s[0].x === 3.25, JSON.stringify(after.days));
    const fixed = await p.evaluate(() => ({ plate: (document.querySelector('.mfs-plate') || {}).textContent || '',
      units: [...document.querySelectorAll('#mfsUnit option')].map((o) => o.textContent),
      grid: [...document.querySelectorAll('.mfs-grid .mfs-nr')].map((x) => x.textContent) }));
    t.ok('back on its page, tonight\'s 540 mL is 160 kcal and 33 g of protein',
      /160 kcal · 33P · 1F · 5C/.test(fixed.plate), fixed.plate);
    t.ok('and it can be added by the can now', fixed.units.join() === 'mL,can (325 mL)', fixed.units.join());
    t.ok('and its label is the whole can\'s, to the milligram', fixed.grid.indexOf('Calcium802 mg') >= 0 && fixed.grid.indexOf('Fat0.8 g') >= 0,
      fixed.grid.join(' | '));
    await p.keyboard.press('Escape');
    await p.waitForTimeout(400);
    const card = await p.evaluate(() => (document.querySelector('#macroSlots [data-mslot="s"]') || {}).textContent || '');
    t.ok('and the day\'s snack says it too', /160/.test(card) && !/\b43\b/.test(card), card);
    t.ok('with no long decimals anywhere on the day', !/\d\.\d{3}/.test(await p.evaluate(() => document.getElementById('macroSlots').textContent)));

    // ---- the same can, scanned again -----------------------------------
    await p.click('#macroSlots [data-mslot="s"] .mtray-ib[data-mopen]');
    await p.waitForTimeout(500);
    await p.fill('#mpFind', '850045887018');
    await p.waitForTimeout(400);
    await p.click('[data-nfcode]');
    await p.waitForTimeout(600);
    const again = await p.evaluate(() => ({ name: (document.querySelector('.mfs-name') || {}).textContent,
      add: (document.getElementById('mfsAdd') || {}).textContent, amt: (document.getElementById('mfsAmt') || {}).value,
      form: !!document.getElementById('nfName') }));
    t.ok('scanning the can again opens your food, fixed, with the meal\'s Add on it',
      again.name === 'Spylt Chocolate milk' && again.add === 'Add to Evening Snack' && !again.form, JSON.stringify(again));
    t.ok('and asks Open Food Facts nothing', p.offAsked === 0, String(p.offAsked));
    await p.click('#mfsAdd');
    await p.waitForTimeout(500);
    const added = (await stored(p)).days['2026-10-11'].s;
    t.ok('its Add puts another 540 mL on the snack', added.length === 2 && added[1].id === 'f:my:spylt_chocolate_milk' &&
      Math.abs(added[1].x - 5.4) < 1e-9, JSON.stringify(added));
    // the book's foods are the book's
    await p.keyboard.press('Escape');
    await p.waitForTimeout(300);
    for (let i = 0; i < 3 && !(await p.$('#macroSlots [data-mslot="b"] [data-mfood]')); i++) {
      await p.click('[data-mview="b"]');
      await p.waitForTimeout(250);
    }
    await p.click('#macroSlots [data-mslot="b"] [data-mfood]');
    await p.waitForTimeout(400);
    t.ok('a food from the book has its page but no fix', !!(await p.$('.mfs-name')) && !(await p.$('[data-mffix]')));
    await p.context().close();

    // ---- a new scan keeps its barcode, and a tenth of a gram -------------
    const q = await page(390, {}, { '2026-10-11': { b: [], l: [], d: [], s: [] } });
    await q.click('#macroSlots [data-mslot="s"] .mtray-ib[data-mopen]');
    await q.waitForTimeout(500);
    await q.fill('#mpFind', '850045887018');
    await q.waitForTimeout(400);
    await q.click('[data-nfcode]');
    await q.waitForTimeout(900);
    const form = await q.evaluate(() => ({ p: (document.getElementById('nfP') || {}).value, c: (document.getElementById('nfC') || {}).value }));
    t.ok('a scan keeps a tenth of a gram: 1.8 g of protein, not 2', form.p === '1.8' && form.c === '0.3', JSON.stringify(form));
    await q.click('[data-nf="save"]');
    await q.waitForTimeout(600);
    const saved = await q.evaluate(() => Object.values(JSON.parse(localStorage.getItem('bsc.myFoods')))[0]);
    t.ok('and the food it saves remembers the barcode it came from, and the 1.8',
      !!saved && saved.code === '850045887018' && saved.p === 1.8, JSON.stringify(saved));
    const asked = q.offAsked;
    await q.fill('#mpFind', '850045887018');
    await q.waitForTimeout(400);
    await q.click('[data-nfcode]');
    await q.waitForTimeout(600);
    t.ok('so the next scan of it opens that food rather than asking again',
      q.offAsked === asked && !!(await q.$('.mfs-name')) && !(await q.$('#nfName')), JSON.stringify({ asked, now: q.offAsked }));
    await q.context().close();

    // ---- at 320 px -------------------------------------------------------
    const n = await page(320, { spylt_chocolate_milk: WRONG }, days);
    await openFood(n);
    await n.click('[data-mffix]');
    await n.waitForTimeout(300);
    for (const [id, v] of Object.entries(LABEL)) await n.fill('#' + id, v);
    const narrow = await n.evaluate(() => ({
      wide: document.documentElement.scrollWidth > innerWidth,
      boxes: [...document.querySelectorAll('.mff-iw input')].map((i) => Math.round(i.getBoundingClientRect().width)),
      small: [...document.querySelectorAll('#modalRoot button, #modalRoot input')].filter((b) => {
        const r = b.getBoundingClientRect(); return r.width && Math.min(r.width, r.height) < 44; }).map((b) => b.id || b.className || b.textContent),
      type: [...document.querySelectorAll('#modalRoot .mff-sheet *')].filter((e) => e.childNodes.length && [...e.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim()) &&
        parseFloat(getComputedStyle(e).fontSize) < 13).map((e) => e.className || e.tagName) }));
    t.ok('at 320 px the fix fits the width', !narrow.wide, JSON.stringify(narrow));
    t.ok('with every box wide enough for “1,200 mg”', narrow.boxes.length === 12 && narrow.boxes.every((w) => w >= 72), narrow.boxes.join());
    t.ok('every button and box a thumb tall', narrow.small.length === 0, narrow.small.join());
    t.ok('and no type under 13 px', narrow.type.length === 0, narrow.type.join());
    await n.context().close();
  },
};
