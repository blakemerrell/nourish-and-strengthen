/* What a scanned packet becomes: the "How much?" form drawn as the
 * Nutrition Facts panel, with the sodium, fiber and allergens a lookup
 * brings back kept rather than thrown away, and the USDA's packaged foods
 * asked about a barcode Open Food Facts does not know.
 *
 * Both services are answered from here; nothing leaves the machine. The
 * runner refuses the USDA in every fresh page, and a route added after that
 * one is the one Playwright asks first, so a test can answer it instead. */

const { openTray } = require('./fixtures/nourish.js');

const OFF = /world\.openfoodfacts\.org/;
const USDA = /api\.nal\.usda\.gov/;

// Great Value pork and beans, as Open Food Facts had it on 2026-10-06, allergens added for the test
const BEANS = { status: 1, product: { product_name: 'Pork & Beans', brands: 'Great Value', serving_size: '1/2 cup (130 g)',
  allergens_tags: ['en:milk', 'en:soybeans', 'en:sesame-seeds'],
  nutriments: { 'energy-kcal_serving': 110, proteins_serving: 6, fat_serving: 1, carbohydrates_serving: 23,
    sodium_serving: 0.39, fiber_serving: 6, 'energy-kcal_100g': 85, proteins_100g: 4.6, fat_100g: 0.8,
    carbohydrates_100g: 17.7, sodium_100g: 0.3, fiber_100g: 4.6 } } };

// a peanut butter by its barcode, per 100 g as the USDA keeps every packet; and one beside it with another barcode
const nutr = (kc, p, f, c, na, fib) => [
  { nutrientName: 'Energy', unitName: 'KCAL', value: kc }, { nutrientName: 'Protein', unitName: 'G', value: p },
  { nutrientName: 'Total lipid (fat)', unitName: 'G', value: f }, { nutrientName: 'Carbohydrate, by difference', unitName: 'G', value: c },
  { nutrientName: 'Sodium, Na', unitName: 'MG', value: na }, { nutrientName: 'Fiber, total dietary', unitName: 'G', value: fib }];
const PB = { foods: [
  { dataType: 'Branded', gtinUpc: '051500255162', description: 'CREAMY PEANUT BUTTER', brandName: 'OTHER',
    servingSize: 32, servingSizeUnit: 'g', householdServingFullText: '2 Tbsp', foodNutrients: nutr(600, 20, 50, 20, 400, 5) },
  { dataType: 'Branded', gtinUpc: '0044444444444', description: 'CREAMY PEANUT BUTTER', brandName: 'JIF',
    servingSize: 32, servingSizeUnit: 'g', householdServingFullText: '2 Tbsp', foodNutrients: nutr(588, 22, 50, 22, 422, 6.2) }] };

module.exports = {
  name: 'Scan label',
  async run(t) {
    /* A meal's sheet, open on its picker, with Open Food Facts answered by
       `off` and the USDA, when `usda` is given, by that. */
    async function open(off, usda) {
      const p = await t.fresh({ viewport: { width: 390, height: 844 } });
      p.usdaAsked = [];
      await p.context().route(OFF, async (r) => {
        const code = (r.request().url().match(/product\/(\d+)/) || [])[1];
        const body = off(code);
        if (body === null) { await r.abort(); return; }            // Open Food Facts out of reach
        await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
      });
      if (usda) {
        await p.context().route(USDA, async (r) => {
          p.usdaAsked.push(r.request().postData() || '');
          await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(usda) });
        });
      }
      await p.reload();
      await p.click('.tab[data-view="macros"]');
      await p.waitForTimeout(250);
      await p.evaluate(() => { const b = document.querySelector('#macroSlots .mtray .mtray-ib[data-mopen]'); b.scrollIntoView({ block: 'center' }); });
      await p.click('#macroSlots .mtray .mtray-ib[data-mopen]');
      await p.waitForTimeout(500);
      return p;
    }
    /* A scan with one answer opens its label at once (2026-10-08: "a scan
       needs to show me exactly what it scanned right away"); two that
       disagree, or none, stay in the results under the lens. Either way
       this says what is on screen: the label's name, calories and source
       line, or the results' words. */
    async function ask(p, code) {
      await p.fill('#mpFind', code);
      await p.waitForTimeout(150);
      await p.click('[data-nfcode]');
      await p.waitForFunction(() => {
        if (document.getElementById('nfName')) return true;
        const r = document.getElementById('nfResults');
        return r && /\S/.test(r.textContent) && !/Looking/.test(r.textContent);
      }, null, { timeout: 5000 });
      return p.evaluate(() => {
        const nm = document.getElementById('nfName');
        if (!nm) return document.getElementById('nfResults').textContent;
        return 'LABEL ' + nm.value + ' · ' + document.getElementById('nfKcal').value + ' kcal · ' +
          ((document.querySelector('.nf-sheet .mfs-meta') || document.querySelector('.mt-sheet .mt-cap') || {}).textContent || '');
      });
    }
    // the label, if a scan has not already opened it
    /* The label is folded under the amount and its Add since 2026-10-18
       (tests/foodfind.test.js), so a figure to be corrected is reached the
       way a person reaches it: Full label & ingredients, opened. */
    async function take(p) {
      if (!(await p.$('#nfName'))) await p.click('[data-nfpick="0"]');
      await p.waitForSelector('#nfName');
      if (await p.$('.nf-more:not([open]) > summary')) await p.click('.nf-more > summary');
    }
    const panel = (p) => p.evaluate(() => {
      const v = (id) => (document.getElementById(id) || {}).value;
      const dv = {};
      document.querySelectorAll('.nfl [data-dv]').forEach((c) => { dv[c.dataset.dv] = c.textContent; });
      return { panel: !!document.querySelector('.nfl[role="group"]'), head: (document.getElementById('nflH') || {}).textContent,
        name: v('nfName'), unit: v('nfUnit'), kcal: v('nfKcal'), p: v('nfP'), f: v('nfF'), c: v('nfC'), na: v('nfNa'), fib: v('nfFib'),
        dv, counts: (document.getElementById('nfCounts') || {}).textContent || '',
        alg: (document.getElementById('nfAlg') || {}).textContent || '' };
    });

    // ---- a packet Open Food Facts knows, with all of its label --------------
    const a = await open(() => BEANS);
    const row = await ask(a, '0078742370842');
    t.ok('a scanned packet opens straight onto its label, the figures off the packet', /^LABEL /.test(row) && /Great Value Pork & Beans/.test(row) && /110 kcal/.test(row), row);
    await take(a);
    await a.waitForTimeout(250);
    let got = await panel(a);
    t.ok('taking it opens the form drawn as a Nutrition Facts panel, the label’s order and words',
      got.panel && got.head === 'Nutrition Facts' && await a.evaluate(() =>
        [...document.querySelectorAll('.nfl label')].map((l) => l.textContent).join('|') ===
          'Serving size|Calories|Total Fat|Sodium|Total Carbohydrate|Dietary Fiber|Protein'), JSON.stringify(got));
    t.ok('with the sodium and fiber the lookup always brought back, no longer thrown away',
      got.kcal === '110' && got.p === '6' && got.f === '1' && got.c === '23' && got.na === '390' && got.fib === '6' &&
        got.unit === '1/2 cup (130 g)', JSON.stringify(got));
    t.ok('and each figure’s % Daily Value, the FDA’s, as the packet prints it',
      got.dv.nfF === '1%' && got.dv.nfNa === '17%' && got.dv.nfC === '8%' && got.dv.nfFib === '21%', JSON.stringify(got.dv));
    t.ok('the allergens the packet declares are said above it, in plain words and as Open Food Facts’ list',
      /Contains\s*milk, soy, sesame/.test(got.alg) && /Open Food Facts/.test(got.alg), got.alg);
    /* 4 × 6 + 4 × 23 + 9 × 1 = 125, where the can says 110: its fiber,
       counted at four by the day and at less by the label. Said, rather than
       swapped in silently at the save as it always was. */
    const noTarget = await a.evaluate(() => ({ pills: document.getElementById('nfWith').innerHTML, h: document.getElementById('nfWithH').hidden }));
    t.ok('with no targets set, the meal\u2019s pills are left out rather than drawn against nothing ("69/0")',
      noTarget.pills === '' && noTarget.h === true, JSON.stringify(noTarget));
    t.ok('and what the day will count, when it is not what the label says, with why',
      /counts 125 kcal, not 110/.test(got.counts) && /6 g of fiber/.test(got.counts), got.counts);
    await a.fill('#nfNa', '460');
    await a.fill('#nfFib', '2.5');
    got = await panel(a);
    t.ok('the percentages follow the boxes as they are typed in',
      got.dv.nfNa === '20%' && got.dv.nfFib === '9%', JSON.stringify(got.dv));
    await a.fill('#nfNa', '');
    got = await panel(a);
    t.ok('and an emptied box shows no percentage rather than 0%', got.dv.nfNa === '', JSON.stringify(got.dv));
    await a.fill('#nfNa', '460');
    await a.click('[data-nf="save"]');
    await a.waitForTimeout(350);
    const kept = await a.evaluate(() => JSON.parse(localStorage.getItem('bsc.myFoods') || '{}'));
    const beans = Object.values(kept).find((f) => /Pork & Beans/.test(f.name)) || {};
    t.ok('saved, the food keeps its sodium, its fiber to a tenth and its allergens',
      beans.na === 460 && beans.fib === 2.5 && JSON.stringify(beans.alg) === '["milk","soy","sesame"]' &&
        beans.kcal === 125, JSON.stringify(beans));
    // the meal's sheet is back, the food on it; the tray opened on its rows, its name opens the food
    await openTray(a);
    await a.evaluate(() => {
      const b = [...document.querySelectorAll('#modalRoot .mitem-food')].find((x) => /Pork/.test(x.closest('.mitem').textContent));
      b.scrollIntoView({ block: 'center' }); b.click();
    });
    await a.waitForTimeout(250);
    /* One line under the name since the page went compact (2026-10-11),
       whose list it is said once at its end; the sodium in the label's grid. */
    const page = await a.evaluate(() => ({ alg: (document.querySelector('.mfs-meta') || {}).textContent || '',
      micro: [...document.querySelectorAll('.mfs-grid .mfs-nr')].map((c) => c.textContent).find((x) => /^Sodium/.test(x)) || '' }));
    t.ok('and its own page says what it contains, and counts the sodium typed',
      /Contains milk, soy, sesame/.test(page.alg) && /Open Food Facts$/.test(page.alg.trim()) && /^Sodium460 mg$/.test(page.micro),
      JSON.stringify(page));
    if (process.env.SHOT) {
      await a.screenshot({ path: process.env.SHOT + '/foodpage.png', fullPage: false });
      await a.keyboard.press('Escape');
      await a.waitForTimeout(150);
      await a.keyboard.press('Escape');
      await a.waitForTimeout(150);
      await a.evaluate(() => { const b = document.querySelector('#macroSlots .mtray .mtray-ib[data-mopen]'); b.scrollIntoView({ block: 'center' }); });
      await a.click('#macroSlots .mtray .mtray-ib[data-mopen]');
      await a.waitForTimeout(400);
      await ask(a, '0078742370842');
      await take(a);
      await a.waitForTimeout(300);
      await a.screenshot({ path: process.env.SHOT + '/label-light.png', fullPage: false });
      await a.evaluate(() => document.querySelector('.scrim').scrollTo(0, 400));
      await a.screenshot({ path: process.env.SHOT + '/label-light-2.png', fullPage: false });
      await a.evaluate(() => { document.documentElement.setAttribute('data-theme', 'dark'); });
      await a.waitForTimeout(100);
      await a.evaluate(() => document.querySelector('.scrim').scrollTo(0, 0));
      await a.screenshot({ path: process.env.SHOT + '/label-dark.png', fullPage: false });
    }
    await a.context().close();

    // ---- what else Open Food Facts says: grades, tags, levels, ingredients ----
    /* The same can as Open Food Facts had it on 2026-10-06, with the rest of
       its record: the mockup Blake picked ("D"). The ingredients carry a tag
       of their own, which has to arrive as text. */
    const FULL = JSON.parse(JSON.stringify(BEANS));
    Object.assign(FULL.product, { nutriscore_grade: 'b', nova_group: 4,
      nutrient_levels: { fat: 'low', 'saturated-fat': 'low', sugars: 'moderate', salt: 'moderate' },
      ingredients_analysis_tags: ['en:palm-oil-free', 'en:non-vegan', 'en:non-vegetarian'],
      additives_tags: ['en:e500ii'],
      ingredients_text: 'Prepared white beans, water, high fructose corn syrup, salt, <b>pork</b>, baking soda.',
      nova_groups_markers: { 3: [['ingredients', 'en:salt']], 4: [['ingredients', 'en:high-fructose-corn-syrup'], ['additives', 'en:e500ii']] },
      image_front_small_url: 'https://images.openfoodfacts.org/images/products/007/874/237/0859/front_en.3.200.jpg' });
    // a one-pixel PNG standing in for the photo, so nothing leaves the machine
    const PIXEL = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    let g = await open(() => BEANS);
    await ask(g, '0078742370842');
    await take(g);
    await g.waitForTimeout(250);
    const bare = await g.evaluate(() => ['nfOffTop', 'nfOffMid', 'nfOffEnd', 'nfOffSrc'].map((id) => document.getElementById(id).innerHTML).join(''));
    t.ok('a packet with no grades, tags or ingredients in its record shows none of them', bare === '', bare);
    await g.context().close();
    g = await open(() => FULL);
    await g.context().route(/images\.openfoodfacts\.org/, (r) => r.fulfill({ status: 200, contentType: 'image/png', body: PIXEL }));
    await ask(g, '0078742370859');
    await take(g);
    await g.waitForTimeout(250);
    /* Loaded, not merely drawn: the page's own policy is enforced here, so
       an image host it did not admit would leave the picture empty. */
    const pic = await g.evaluate(() => {
      const f = document.querySelector('.nfp'), i = f && f.querySelector('img');
      return f ? { shown: !f.hidden, src: i.getAttribute('src'), alt: i.alt, loaded: i.naturalWidth > 0,
        credit: f.querySelector('figcaption').textContent } : null;
    });
    t.ok('the packet\u2019s photo from Open Food Facts is shown, loaded under the page\u2019s policy, and credited as its licence asks',
      !!pic && pic.shown && pic.loaded && /front_en\.3\.200\.jpg$/.test(pic.src) && pic.alt === 'The front of the packet' &&
        /Open Food Facts contributors, CC BY-SA/.test(pic.credit), JSON.stringify(pic));
    const more = await g.evaluate(() => {
      const q = (s) => document.querySelector(s);
      // the short page's chips (camera.js, mOffTopHTML): a grade's letter in its colour, said in words
      return { ns: (q('.nf-chip[role="img"]') || {}).getAttribute && q('.nf-chip[role="img"]').getAttribute('aria-label'),
        on: (q('.nf-chip .nf-chip-b.nfs-b') || {}).textContent, why: (q('.nf-why') || {}).textContent || '',
        grades: [...document.querySelectorAll('.nfs-grade')].map((x) => x.textContent.replace(/\s+/g, ' ').trim()),
        tags: [...document.querySelectorAll('.nfs-tag')].map((x) => x.textContent),
        lv: [...document.querySelectorAll('.nfs-lvi')].map((x) => x.textContent),
        open: (q('.nfs-ingr') || {}).open, marks: [...document.querySelectorAll('.nfs-ingr mark')].map((m) => m.textContent),
        injected: !!document.querySelector('.nfs-ingr p b'), ingr: (q('.nfs-ingr p') || {}).textContent || '',
        link: q('.nfs-src a') && [q('.nfs-src a').href, q('.nfs-src a').target, q('.nfs-src a').rel].join(' '),
        leaf: !!document.querySelector('.mt-sheet .leaf') };
    });
    t.ok('the Nutri-Score is its letter in the colour of its place from A to E, and said in words',
      more.on === 'B' && /^Nutri-Score B, on a scale from A/.test(more.ns) && /Nutri-Score/.test(more.grades[0]), JSON.stringify(more));
    t.ok('the NOVA group says what it is and, for an ultra-processed food, what made it so',
      /Ultra-processed/.test(more.grades[1]) && /NOVA 4 of 4\), for high fructose corn syrup, baking soda/.test(more.why), JSON.stringify([more.grades, more.why]));
    t.ok('the ingredients\u2019 own tags: vegetarian or not, palm oil, and the additive by its name',
      JSON.stringify(more.tags) === '["Not vegetarian","No palm oil","1 additive: baking soda"]', JSON.stringify(more.tags));
    t.ok('the traffic lights per 100 g, each in words',
      JSON.stringify(more.lv) === '["FatLow","Sat. fatLow","SugarsModerate","SaltModerate"]', JSON.stringify(more.lv));
    t.ok('the ingredients folded away, the words that made it ultra-processed marked in them',
      more.open === false && JSON.stringify(more.marks) === '["high fructose corn syrup","baking soda"]', JSON.stringify(more));
    t.ok('and a tag in the ingredients arrives as text, never as markup', !more.injected && /<b>pork<\/b>/.test(more.ingr), more.ingr);
    t.ok('said as Open Food Facts\u2019 and volunteers\u2019, with a way to fix it there that opens on its own',
      more.link === 'https://world.openfoodfacts.org/product/0078742370859 _blank noopener', more.link);
    t.ok('and no Leaf score on a packet: it was tuned for a plate, and would call a can of cola worth eating', !more.leaf);
    const cola = await g.evaluate(() => window.Nutrition.scoreFrom({ kcal: 140, p: 0, f: 0, c: 39, na: 45, fib: 0 }).score);
    t.ok('(which it would: the Leaf gives a can of cola ' + cola + ')', cola >= 45, String(cola));
    await g.click('[data-nf="save"]');
    await g.waitForTimeout(350);
    const kept2 = await g.evaluate(() => Object.values(JSON.parse(localStorage.getItem('bsc.myFoods') || '{}')));
    const full = kept2.find((f) => f.ns) || {};
    t.ok('saved, the food keeps its two grades and nothing longer',
      full.ns === 'b' && full.nova === 4 && !('ingr' in full) && !('lv' in full) && !('off' in full), JSON.stringify(full));
    await openTray(g);
    await g.evaluate(() => {
      const b = [...document.querySelectorAll('#modalRoot .mitem-food')].find((x) => /Pork/.test(x.closest('.mitem').textContent));
      b.scrollIntoView({ block: 'center' }); b.click();
    });
    await g.waitForTimeout(250);
    const grades = await g.evaluate(() => (document.querySelector('.mfs-meta') || {}).textContent || '');
    t.ok('and its own page says them again', /Nutri-Score B · Ultra-processed \(NOVA 4\) · Open Food Facts/.test(grades), grades);
    if (process.env.SHOT) {
      await g.keyboard.press('Escape');
      await g.waitForTimeout(150);
      await g.keyboard.press('Escape');
      await g.waitForTimeout(150);
      await g.evaluate(() => { const b = document.querySelector('#macroSlots .mtray .mtray-ib[data-mopen]'); b.scrollIntoView({ block: 'center' }); });
      await g.click('#macroSlots .mtray .mtray-ib[data-mopen]');
      await g.waitForTimeout(400);
      await ask(g, '0078742370859');
      await take(g);
      await g.waitForTimeout(300);
      await g.screenshot({ path: process.env.SHOT + '/off-1.png' });
      await g.evaluate(() => { document.querySelector('.nfs-ingr').open = true; document.querySelector('.scrim').scrollTo(0, 700); });
      await g.screenshot({ path: process.env.SHOT + '/off-2.png' });
      await g.evaluate(() => { document.documentElement.setAttribute('data-theme', 'dark'); document.querySelector('.scrim').scrollTo(0, 0); });
      await g.waitForTimeout(100);
      await g.screenshot({ path: process.env.SHOT + '/off-dark.png' });
    }
    await g.context().close();

    // ---- what is not known is not said --------------------------------------
    const UNK = JSON.parse(JSON.stringify(BEANS));
    Object.assign(UNK.product, { nutriscore_grade: 'unknown', nova_group: '', additives_tags: [],
      ingredients_analysis_tags: ['en:palm-oil-content-unknown', 'en:vegan-status-unknown', 'en:vegetarian-status-unknown'],
      image_front_small_url: 'https://elsewhere.example/front.jpg' });
    const k = await open(() => UNK);
    await ask(k, '0078742370842');
    await take(k);
    await k.waitForTimeout(250);
    const unk = await k.evaluate(() => ['nfOffTop', 'nfOffMid', 'nfOffEnd', 'nfOffSrc'].map((id) => document.getElementById(id).textContent).join(''));
    t.ok('an ungraded packet gets no grade, an unknown status no tag, and no ingredient list no claim of "no additives"', unk === '', unk);
    t.ok('and a photo from anywhere but Open Food Facts\u2019 image server is not shown', await k.evaluate(() => !document.querySelector('.nfp')));
    await k.context().close();

    // a photo that cannot load (no signal, or gone) is taken away rather than left broken
    const nopic = await open(() => FULL);
    await nopic.context().route(/images\.openfoodfacts\.org/, (r) => r.abort());
    await ask(nopic, '0078742370859');
    await take(nopic);
    await nopic.waitForTimeout(400);
    t.ok('a packet photo that cannot load is taken away, not left as a broken picture',
      await nopic.evaluate(() => { const f = document.querySelector('.nfp'); return !!f && f.hidden; }));
    await nopic.context().close();

    // ---- typed in by hand: an empty panel claims nothing ---------------------
    const h = await open(() => ({ status: 0 }));
    await h.click('[data-mpnew]');
    await h.waitForTimeout(250);
    got = await panel(h);
    t.ok('the empty form is the same panel, with no percentages, no allergens and nothing said about the day',
      got.panel && Object.values(got.dv).every((x) => x === '') && got.alg === '' && got.counts === '' &&
        got.na === '' && got.fib === '', JSON.stringify(got));
    await h.fill('#nfName', 'Tamale');
    await h.click('[data-nf="save"]');
    const blankNote = await h.evaluate(() => (document.getElementById('nfNote') || {}).textContent || '');
    t.ok('an empty form with all four boxes left blank is still refused', /counts for nothing/.test(blankNote), blankNote);
    await h.fill('#nfKcal', '250');
    await h.fill('#nfP', '10');
    await h.fill('#nfF', '12');
    await h.fill('#nfC', '25');
    await h.click('[data-nf="save"]');
    await h.waitForTimeout(300);
    const tam = await h.evaluate(() => JSON.parse(localStorage.getItem('bsc.myFoods') || '{}').tamale || null);
    t.ok('and a food saved with its sodium and fiber left empty keeps no 0 it was never told',
      !!tam && !('na' in tam) && !('fib' in tam) && !('alg' in tam), JSON.stringify(tam));
    await h.context().close();

    // ---- a 0-calorie sweetener (Blake, 2026-10-23: Great Value Splenda) ----
    const SPLENDA_OFF = { status: 1, product: { product_name: 'Granulated No Calorie Sweetener', brands: 'Great Value',
      serving_size: '2 tsp (1 g)', nova_group: 4,
      nutriments: { 'energy-kcal_serving': 0, proteins_serving: 0, fat_serving: 0, carbohydrates_serving: 0.01,
        'energy-kcal_100g': 0, proteins_100g: 0, fat_100g: 0, carbohydrates_100g: 1 } } };
    const SPLENDA_USDA = { foods: [{ dataType: 'Branded', gtinUpc: '078742123769',
      description: 'GRANULATED NO CALORIE SWEETENER', brandName: 'GREAT VALUE',
      servingSize: 1, servingSizeUnit: 'g', householdServingFullText: '2 tsp',
      foodNutrients: nutr(0, 0, 0, 0, 0, 0) }] };
    const z = await open(() => SPLENDA_OFF, SPLENDA_USDA);
    const zRow = await ask(z, '078742123769');
    t.ok('a 0-calorie sweetener opens its label at 0 kcal', /^LABEL /.test(zRow) && /No Calorie Sweetener/i.test(zRow) && /\b0 kcal\b/.test(zRow), zRow);
    await z.click('[data-nf="save"]');
    await z.waitForTimeout(300);
    const zSaved = await z.evaluate(() => {
      const mine = Object.values(JSON.parse(localStorage.getItem('bsc.myFoods') || '{}'));
      const days = JSON.parse(localStorage.getItem('bsc.macroDays') || '{}'), d = days[Object.keys(days)[0]] || {};
      const items = [].concat(...Object.values(d).filter(Array.isArray));
      return { food: mine.find((f) => /No Calorie Sweetener/i.test(f.name)), items };
    });
    t.ok('and logs to the meal with 0 kcal and 0 macros instead of being refused',
      !!zSaved.food && zSaved.food.kcal === 0 && zSaved.food.p === 0 && zSaved.food.f === 0 && zSaved.food.c === 0 &&
        zSaved.items.some((it) => /^f:my:/.test(it.id) && it.x === 1), JSON.stringify(zSaved));
    await z.context().close();

    // ---- a barcode Open Food Facts does not know, the USDA does ------------
    const u = await open(() => ({ status: 0, status_verbose: 'product not found' }), PB);
    const pb = await ask(u, '044444444444');
    t.ok('a barcode Open Food Facts has never seen is asked of the USDA’s packaged foods',
      /Jif Creamy Peanut Butter/.test(pb) && /USDA/.test(pb) && u.usdaAsked.length === 1 &&
        JSON.parse(u.usdaAsked[0]).query === '044444444444', pb + ' / ' + u.usdaAsked.join());
    t.ok('and only the packet with that barcode is taken, not the first that came back',
      !/Other/i.test(pb) && /188 kcal/.test(pb), pb);
    await take(u);
    await u.waitForTimeout(250);
    got = await panel(u);
    t.ok('per its own serving, the label’s words and weight, sodium and fiber with it',
      got.unit === '2 Tbsp (32 g)' && got.kcal === '188' && got.p === '7' && got.f === '16' && got.c === '7' &&
        got.na === '135' && got.fib === '2', JSON.stringify(got));
    t.ok('the USDA lists no allergens, so none are claimed', got.alg === '', got.alg);
    await u.context().close();

    // ---- known nowhere, and the USDA out of reach -------------------------------
    const n = await open(() => ({ status: 0 }), { foods: [] });
    const none = await ask(n, '055555555555');
    t.ok('a barcode neither knows is said as that', /not in Open Food Facts or the USDA/.test(none), none);
    await n.context().close();
    const o = await open(() => ({ status: 0 }));                // the runner's refusal of the USDA stands
    const off = await ask(o, '055555555555');
    t.ok('a USDA that cannot be reached leaves Open Food Facts’ answer as it was, not "known nowhere"',
      /is not in Open Food Facts\./.test(off) && !/USDA/.test(off), off);
    await o.context().close();

    // ---- both asked at once, and weighed against each other -------------------
    /* The can again, this time known to both. Open Food Facts lacks its
       fiber; the USDA's packaged foods have the same can at 85 kcal per
       100 g, near enough to agree. */
    const NOFIB = JSON.parse(JSON.stringify(BEANS));
    delete NOFIB.product.nutriments.fiber_serving;
    delete NOFIB.product.nutriments.fiber_100g;
    const CAN = { foods: [{ dataType: 'Branded', gtinUpc: '078742370842', description: 'PORK & BEANS', brandName: 'GREAT VALUE',
      servingSize: 130, servingSizeUnit: 'g', householdServingFullText: '1/2 cup', foodNutrients: nutr(85, 4.6, 0.8, 17.7, 300, 4.6) }] };
    const ag = await open(() => NOFIB, CAN);
    const agRows = await ask(ag, '078742370842');
    t.ok('a barcode both know and agree on comes back once, as Open Food Facts\u2019 answer, the USDA asked alongside',
      (agRows.match(/Pork & Beans/gi) || []).length === 1 && /Open Food Facts/.test(agRows) && !/Two different/.test(agRows) &&
        ag.usdaAsked.length === 1, agRows);
    await take(ag);
    await ag.waitForTimeout(250);
    got = await panel(ag);
    const agCap = await ag.evaluate(() => (document.querySelector('.nf-sheet .mfs-meta') || document.querySelector('.mt-sheet .mt-cap') || {}).textContent || '');
    t.ok('said as checked, with the fiber it lacked filled in from the USDA at the same serving',
      /checked against the USDA/.test(agCap) && got.fib === '6' && got.na === '390', agCap + ' ' + JSON.stringify(got));
    await ag.context().close();

    /* The peanut butter the probe of 2026-10-06 found: "Yellowfin Tuna" in
       Open Food Facts at a sixth of its calories, its own checks faulting
       them, and right in the USDA's packaged foods. */
    const TUNA = { status: 1, product: { product_name: 'Yellowfin Tuna', brands: 'Nature\u2019s Promise', serving_size: '32 g',
      allergens_tags: ['en:fish'], nutriscore_grade: 'a', nova_group: 1,
      data_quality_errors_tags: ['en:energy-value-in-kcal-does-not-match-value-computed-from-other-nutrients'],
      nutriments: { 'energy-kcal_serving': 34, proteins_serving: 7, fat_serving: 1, carbohydrates_serving: 0,
        'energy-kcal_100g': 106, proteins_100g: 22, fat_100g: 3, carbohydrates_100g: 0 } } };
    const JAR = { foods: [{ dataType: 'Branded', gtinUpc: '688267151866', description: 'CREAMY PEANUT BUTTER', brandName: 'NATURE\'S PROMISE',
      servingSize: 32, servingSizeUnit: 'g', householdServingFullText: '2 Tbsp', foodNutrients: nutr(625, 21.9, 53.1, 18.8, 328, 6.2) }] };
    const cl = await open(() => TUNA, JAR);
    const clRows = await ask(cl, '688267151866');
    const clash = await cl.evaluate(() => ({ note: (document.querySelector('.mlook-clash') || {}).textContent || '',
      rows: [...document.querySelectorAll('#nfResults [data-nfpick]')].map((r) => r.textContent) }));
    t.ok('two answers far apart are both shown, said as two, the maker\u2019s label first',
      /Two different answers/.test(clash.note) && /106 kcal per 100 g/.test(clash.note) && /say 625/.test(clash.note) &&
        clash.rows.length === 2 && /Creamy Peanut Butter/.test(clash.rows[0]) && /Yellowfin Tuna/.test(clash.rows[1]), JSON.stringify(clash));
    t.ok('and Open Food Facts\u2019 own checks faulting its figures is said too', /own checks fault its figures/.test(clash.note), clash.note);
    await take(cl);
    await cl.waitForTimeout(250);
    got = await panel(cl);
    const clOff = await cl.evaluate(() => ['nfOffTop', 'nfOffMid', 'nfOffEnd', 'nfOffSrc'].map((id) => document.getElementById(id).textContent).join(''));
    t.ok('taking the USDA\u2019s answer takes none of the other record\u2019s grades or allergens, which may be another product\u2019s',
      /Creamy Peanut Butter/.test(got.name) && got.kcal === '200' && got.alg === '' && clOff === '', JSON.stringify(got) + clOff);
    await cl.context().close();

    // Open Food Facts out of reach, the USDA not: the USDA's answer stands
    const dn = await open(() => null, JAR);
    const dnRows = await ask(dn, '688267151866');
    t.ok('with Open Food Facts out of reach, the USDA\u2019s answer is used rather than "did not answer"',
      /Creamy Peanut Butter/.test(dnRows) && !/did not answer/.test(dnRows), dnRows);
    await dn.context().close();

    // ---- a food searched for: its sizes, its whole label, how much ----------
    /* The USDA's own record for a grilled chicken breast, as the probe of
       2026-10-06 fetched it: per 100 g, with eleven ways it is weighed. */
    const CHICKEN = { foods: [{ dataType: 'Survey (FNDDS)', description: 'Chicken breast, grilled with sauce, skin eaten',
      foodNutrients: nutr(202, 21.15, 9.15, 7.34, 454, 0.2).concat([
        { nutrientName: 'Fatty acids, total saturated', unitName: 'G', value: 2.105 }, { nutrientName: 'Cholesterol', unitName: 'MG', value: 78 },
        { nutrientName: 'Total Sugars', unitName: 'G', value: 5.98 }, { nutrientName: 'Calcium, Ca', unitName: 'MG', value: 12 },
        { nutrientName: 'Iron, Fe', unitName: 'MG', value: 0.55 }, { nutrientName: 'Potassium, K', unitName: 'MG', value: 280 }]),
      foodMeasures: [['Quantity not specified', 175, 11], ['1 small breast', 150, 2], ['1 breast, NS as to size', 175, 5],
        ['1 cup, cooked, diced', 165, 1], ['1 large breast', 195, 4], ['1 medium slice', 60, 7], ['1 large or thick slice', 85, 8],
        ['1 small or thin slice', 30, 6], ['1 oz, cooked', 28.35, 9], ['1 medium breast', 175, 3]]
        .map((m) => ({ disseminationText: m[0], gramWeight: m[1], rank: m[2] })) }] };
    const sp = await t.fresh({ viewport: { width: 390, height: 844 } });
    await sp.context().route(USDA, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CHICKEN) }));
    await sp.evaluate(() => localStorage.setItem('bsc.macroTargets', JSON.stringify({ p: 190, f: 60, c: 170 })));
    await sp.reload();
    await sp.click('.tab[data-view="macros"]');
    await sp.waitForTimeout(250);
    await sp.evaluate(() => { const b = document.querySelector('#macroSlots .mtray .mtray-ib[data-mopen]'); b.scrollIntoView({ block: 'center' }); });
    await sp.click('#macroSlots .mtray .mtray-ib[data-mopen]');
    await sp.waitForTimeout(400);
    await sp.evaluate(() => window.Store.toggleFav('f:chicken_breast'));     // a food you starred
    await sp.fill('#mpFind', 'chicken breast');
    await sp.waitForSelector('#nfResults [data-nfpick]', { timeout: 8000 });
    /* Blake, 2026-10-08: "what I'd rather see are the foods that are in my
       favorites. Recents in my pantry and then finally USDA food at the very
       bottom." */
    const order = await sp.evaluate(() => {
      const list = document.getElementById('mpList'), box = document.getElementById('nfResults');
      const mine = [...list.querySelectorAll('.mt-div, [data-mpick]')].filter((e) => !box.contains(e));
      const fav = list.querySelector('.mt-div');
      return { first: fav ? fav.textContent.trim() : '', favRow: (fav && fav.nextElementSibling ? fav.nextElementSibling.textContent : '').replace(/\s+/g, ' '),
        rows: mine.length, after: mine.filter((e) => box.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING).length };
    });
    t.ok('a word typed lists what you starred first', /^Favorites/.test(order.first) && /Chicken breast/i.test(order.favRow), JSON.stringify(order));
    t.ok('and the USDA\u2019s answers last, under every row the app itself has', order.rows > 2 && order.after === 0, JSON.stringify(order));
    /* Blake, 2026-10-07, searching "bread": the USDA's rows "popped up in a
       different way than the rest of the foods on the list". They are the
       app's own row now, with only the word in front to say where from. */
    const rowLook = await sp.evaluate(() => {
      const mine = document.querySelector('#mpList .mpick-wrap .mpick-row[data-mpick]');
      const usda = document.querySelector('#nfResults .mpick-wrap .mpick-row[data-nfpick]');
      const parts = (r) => r ? ['.mp-tick', '.mp-name', '.mp-fit', '.mgc .mb-p', '.mgc .mb-f', '.mgc .mb-c'].map((q) => !!r.querySelector(q)) : null;
      return { mine: parts(mine), usda: parts(usda), fit: usda && usda.querySelector('.mp-fit').textContent.replace(/\s+/g, ' ').trim(),
        sub: !!document.querySelector('#nfResults .mlook-sub, #nfResults .mlook-tags, #nfResults svg') };
    });
    t.ok('a USDA result is drawn as the app\u2019s own food rows are: the +, the name, grams first and the coloured macros',
      JSON.stringify(rowLook.usda) === JSON.stringify(rowLook.mine) && rowLook.usda.every(Boolean) && !rowLook.sub &&
        /^USDA 165 g · 1 cup, cooked, diced · 333 kcal · 35P · 15F · 12C$/.test(rowLook.fit), JSON.stringify(rowLook));
    await sp.click('#nfResults [data-nfpick="0"]');
    await sp.waitForTimeout(300);
    await sp.click('.nf-more > summary');
    const card = () => sp.evaluate(() => {
      const v = (id) => (document.getElementById(id) || {}).value, x = (id) => (document.getElementById(id) || {}).textContent;
      return { sizes: [...document.querySelectorAll('[data-nfsize]')].map((b) => b.textContent.replace(/\s+/g, ' ').trim()),
        on: (document.querySelector('[data-nfsize][aria-pressed="true"]') || {}).textContent,
        unit: v('nfUnit'), kcal: v('nfKcal'), p: v('nfP'), f: v('nfF'), c: v('nfC'), na: v('nfNa'), fib: v('nfFib'),
        sat: x('nfx-sat'), chol: x('nfx-chol'), cholDv: x('nfx-chol-dv'), sug: x('nfx-sug'), ca: x('nfx-ca'), fe: x('nfx-fe'),
        k: x('nfx-k'), kDv: x('nfx-k-dv'), n: x('nfAmtN'), g: x('nfAmtG'), salt: x('nfSalt'),
        pills: [...document.querySelectorAll('#nfWith .mcap')].map((m) => m.textContent) };
    });
    let cd = await card();
    t.ok('a food searched for offers the sizes the USDA weighs it in, best first and its shrugs left out, with 100 g last',
      cd.sizes.length === 7 && /^1 cup, cooked, diced 165 g$/.test(cd.sizes[0]) && /^1 small breast 150 g$/.test(cd.sizes[1]) &&
        cd.sizes[6] === '100 g' && !cd.sizes.some((z) => /NS|not specified/.test(z)) && /1 cup/.test(cd.on), JSON.stringify(cd.sizes));
    // protein, fat and carbs to a tenth since 2026-10-11, as the label prints a gram
    t.ok('the panel is that size\u2019s label, with the rest of the label the USDA gives',
      cd.unit === '1 cup, cooked, diced (165 g)' && cd.kcal === '333' && cd.p === '34.9' && cd.f === '15.1' && cd.c === '12.1' &&
        cd.na === '749' && cd.sat === '3.5' && cd.chol === '129' && cd.cholDv === '43%' && cd.sug === '10' && cd.ca === '20' &&
        cd.fe === '0.9' && cd.k === '462' && cd.kDv === '10%', JSON.stringify(cd));
    const look = await sp.evaluate(() => {
      const inp = document.getElementById('nfF'), lab = inp.closest('.nfl-row').querySelector('label');
      return { gap: inp.getBoundingClientRect().left - lab.getBoundingClientRect().right, w: inp.getBoundingClientRect().width,
        btn: document.querySelector('[data-nf="save"]').textContent };
    });
    /* As wide as its figure: "15.1" now that fat comes to a tenth, where it
       was "15" under 44 px. */
    t.ok('each typed figure sits just after its name, as the read rows\u2019 do, and the button names the meal',
      look.gap < 12 && look.w < 56 && /^Add to Breakfast$/.test(look.btn), JSON.stringify(look));
    await sp.evaluate(() => { document.getElementById('nfC').blur(); document.getElementById('nfC').closest('.nfl-row').querySelector('.nfl-dv').click(); });
    t.ok('and a tap anywhere on a row puts the caret in its box', await sp.evaluate(() => document.activeElement && document.activeElement.id === 'nfC'));
    t.ok('with how much, and the meal\u2019s own pills with it on, and its salt against a day\u2019s',
      cd.n === '1' && cd.g === '165 g' && cd.pills.length === 4 && /749 mg of sodium: 33% of a day/.test(cd.salt), JSON.stringify(cd));
    await sp.click('[data-nfsize="1"]');
    await sp.click('[data-nfamt="1"]');
    await sp.waitForTimeout(100);
    cd = await card();
    t.ok('another size makes the panel that size\u2019s, and + is half a serving more',
      cd.unit === '1 small breast (150 g)' && cd.kcal === '303' && cd.na === '681' && /1 small breast/.test(cd.on) &&
        cd.n === '1\u00bd' && cd.g === '225 g' && /1,022 mg of sodium: 44%/.test(cd.salt), JSON.stringify(cd));
    if (process.env.SHOT) {
      const scrollAll = (y) => sp.evaluate((yy) => { document.querySelectorAll('.scrim, .mt-sheet').forEach((el) => { el.scrollTop = yy; }); }, y);
      await scrollAll(0);
      await sp.screenshot({ path: process.env.SHOT + '/card-1.png' });
      await scrollAll(560);
      await sp.screenshot({ path: process.env.SHOT + '/card-2.png' });
    }
    await sp.click('[data-nf="save"]');
    await sp.waitForTimeout(350);
    const ck = await sp.evaluate(() => {
      const mine = Object.values(JSON.parse(localStorage.getItem('bsc.myFoods') || '{}'));
      const days = JSON.parse(localStorage.getItem('bsc.macroDays') || '{}'), d = days[Object.keys(days)[0]] || {};
      const items = [].concat(...Object.values(d).filter(Array.isArray));
      return { food: mine.find((f) => /Chicken breast/.test(f.name)), x: (items.find((it) => /^f:my:/.test(it.id)) || {}).x };
    });
    t.ok('saved as the size picked, its label per serving kept, and on the plate as the servings asked for',
      ck.food && ck.food.unit === '1 small breast (150 g)' && ck.food.p === 31.7 && ck.food.f === 13.7 &&
        ck.food.kcal === Math.round(4 * 31.7 + 4 * 11 + 9 * 13.7) && ck.x === 1.5 &&
        ck.food.lab && ck.food.lab.chol === 117 && ck.food.lab.k === 420 && ck.food.lab.sat === 3, JSON.stringify(ck));
    await sp.context().close();

    // ---- what the USDA's answers carry ---------------------------------------
    const e = await t.fresh();
    const nut = await e.evaluate(() => {
      const N = window.__macroLab.nutrients;
      return [N([{ nutrientName: 'Sodium, Na', unitName: 'MG', value: 1200 }, { nutrientName: 'Fiber, total dietary', unitName: 'G', value: 3.5 },
        { nutrientName: 'Protein', unitName: 'G', value: 2 }]), N([{ nutrientName: 'Protein', unitName: 'G', value: 2 }])];
    });
    t.ok('the USDA’s sodium and fiber are read, and stay null when an answer has none',
      nut[0].na === 1200 && nut[0].fib === 3.5 && nut[1].na === null && nut[1].fib === null, JSON.stringify(nut));
    await e.context().close();

    /* A reference food quoted per its household measure, which the USDA
       often words with a bracket of its own. The weight goes in brackets
       after it, so that one has to come off, or the serving is one no label
       reader can parse and the plate printed "1 1 medium (…)". */
    const s = await t.fresh();
    await s.context().route(USDA, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ foods: [
      { dataType: 'Survey (FNDDS)', description: 'Apple, raw', foodNutrients: nutr(52, 0.3, 0.2, 14, 1, 2.4),
        foodMeasures: [{ disseminationText: '1 medium (2-3/4" dia)', gramWeight: 182, rank: 1 }] },
      { dataType: 'SR Legacy', description: 'Apple, dried', foodNutrients: nutr(243, 0.9, 0.3, 66, 87, 8.7),
        foodMeasures: [{ disseminationText: 'cup', gramWeight: 86, rank: 1 }] }] }) }));
    const rows = await s.evaluate(() => window.__macroLab.foodSearch('apple'));
    t.ok('a reference food’s measure keeps its count and loses its own aside, the weight after it',
      rows[0].unit === '1 medium (182 g)' && rows[1].unit === '1 cup (86 g)', JSON.stringify(rows.map((r) => r.unit)));
    t.ok('and its sodium and fiber come per that measure',
      rows[0].na === 2 && rows[0].fib === 4.4 && rows[1].na === 75 && rows[1].fib === 7.5, JSON.stringify(rows));
    await s.context().close();
  }
};
