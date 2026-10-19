/* Finding a food and saying how much of it, made shorter.
 *
 * Blake, 2026-10-18: "I don't like the fact I have to scroll down to the
 * bottom to adjust the qty ... I just need to see p f c and it's nice to see
 * the nova and other stuff... But make it much shorter", "Searching and
 * scanning for food needs to get much easier", and the first food he could
 * not find was "Tyson Chicken nugget". Three changes, mockup
 * https://claude.ai/artifact/KnJS2zNRXw4MyVM6N4VrNm:
 *
 *   - (a search box and a barcode at the top of the day, for the next meal,
 *     taken off again on 2026-10-19: "I didn't need that search box in the
 *     day tab for meals... I get that by clicking a plus button on the meal
 *     card." The meal's sheet keeps its own search and barcode);
 *   - a name typed asks the USDA's packaged foods too, so a brand is found;
 *   - a looked-up food's page has its amount and Add on the first screen,
 *     and the whole label folded under them.
 *
 * The USDA is answered from here, with what it said for "tyson chicken
 * nugget" on 2026-10-18 (tests/fixtures/usda-tyson-*.json, trimmed). */
const USDA = /api\.nal\.usda\.gov/;
const OFF = /world\.openfoodfacts\.org/;
const BRANDED = require('./fixtures/usda-tyson-branded.json');
const PLAIN = require('./fixtures/usda-tyson-plain.json');
const { openMeal } = require('./fixtures/nourish');

// Tyson's nuggets by their barcode, as Open Food Facts had them on 2026-10-18
const NUGGETS = { status: 1, product: { product_name: 'Chicken Nuggets', brands: 'Tyson', serving_size: '5 PIECES (90 g)',
  nova_group: 4, nutriscore_grade: 'd', allergens_tags: ['en:gluten'],
  nutriments: { 'energy-kcal_serving': 270, proteins_serving: 14, fat_serving: 17, carbohydrates_serving: 15,
    sodium_serving: 0.47, fiber_serving: 0, 'energy-kcal_100g': 300, proteins_100g: 15.6, fat_100g: 18.9,
    carbohydrates_100g: 16.7, sodium_100g: 0.522, fiber_100g: 0 } } };

module.exports = {
  name: 'Finding a food, and how much',
  async run(t) {
    const errs = [];
    async function open(vp, opts) {
      const p = await t.fresh({ viewport: vp || { width: 390, height: 844 }, ...(opts || {}) });
      p.on('pageerror', (e) => errs.push(e.message));
      p.asked = [];
      await p.context().route(USDA, async (r) => {
        const body = r.request().postData() || '';
        p.asked.push(/Branded/.test(body) ? 'branded' : 'plain');
        await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(/Branded/.test(body) ? BRANDED : PLAIN) });
      });
      await p.context().route(OFF, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(NUGGETS) }));
      /* Half past seven in the morning, so the next meal is Breakfast. On the
         real clock this passed on the morning it was written and failed on
         main that afternoon, when the next meal was Lunch. */
      await p.clock.setFixedTime(new Date(2026, 9, 18, 7, 30, 0));
      await p.reload();
      await p.click('.tab[data-view="macros"]');
      await p.waitForTimeout(300);
      return p;
    }

    /* ---- the day has no search bar of its own: a meal's + is the way in */
    const p = await open();
    t.ok('the day has no search box or barcode of its own above the meals (2026-10-19)',
      await p.evaluate(() => !document.getElementById('macroFind') && !document.querySelector('[data-mfind]')));
    await openMeal(p, 'b');
    const opened = await p.evaluate(() => ({ sheet: (document.querySelector('.msheet') || { getAttribute: () => '' }).getAttribute('aria-label'),
      find: !!document.getElementById('mpFind') }));
    t.ok('a meal’s sheet has the search', opened.sheet === 'Breakfast' && opened.find, JSON.stringify(opened));

    /* ---- a brand, by name */
    await p.fill('#mpFind', 'tyson chicken nugget');
    await p.waitForFunction(() => /Store brands/i.test((document.getElementById('nfResults') || {}).textContent || ''), null, { timeout: 5000 }).catch(() => {});
    const found = await p.evaluate(() => {
      const res = document.getElementById('nfResults');
      const heads = [...res.querySelectorAll('.mt-div')].map((d) => d.textContent);
      const brandRows = [], plainRows = [];
      let into = null;
      [...res.children].forEach((el) => {
        if (el.classList.contains('mt-div')) into = /Store/.test(el.textContent) ? brandRows : plainRows;
        else if (into && el.querySelector('.mp-name')) into.push({ n: el.querySelector('.mp-name').textContent, fit: el.querySelector('.mp-fit').textContent });
      });
      const idx = [...res.querySelectorAll('[data-nfpick]')].map((b) => Number(b.dataset.nfpick));
      return { heads, brandRows, plainRows, idx };
    });
    t.ok('a brand typed asks the USDA’s packaged foods as well as its plain ones', p.asked.includes('branded') && p.asked.includes('plain'), p.asked.join());
    t.ok('and lists the store brands first, under their own heading, then the plain foods',
      found.heads[0] === 'Store brands' && found.heads[1] === 'From the USDA' && found.brandRows.length && found.plainRows.length, JSON.stringify(found.heads));
    t.ok('only packets with every word typed, the brand included, four at most',
      found.brandRows.length <= 4 && found.brandRows.every((r) => /tyson/i.test(r.n) && /chicken/i.test(r.n) && /nugget/i.test(r.n)), JSON.stringify(found.brandRows));
    t.ok('each named once by its brand ("Tyson Chicken Nuggets", not "Tyson Tyson, ...")',
      found.brandRows[0].n === 'Tyson Chicken Nuggets' && !found.brandRows.some((r) => /tyson,?\s+tyson/i.test(r.n)), JSON.stringify(found.brandRows.map((r) => r.n)));
    t.ok('and its serving in small letters and its first clause only ("5 pieces", not "3.21 OZ SERVING, About 10 ...")',
      /90 g · 5 pieces · 270 kcal/.test(found.brandRows[0].fit) && !found.brandRows.some((r) => /[A-Z]{3,}|Per Container/.test(r.fit.replace(/USDA/, ''))), JSON.stringify(found.brandRows.map((r) => r.fit)));
    t.ok('the rows of both lists are numbered on, so a tap on either opens the one it shows',
      found.idx.length === new Set(found.idx).size && found.idx.every((v, i) => v === i), JSON.stringify(found.idx));

    /* ---- the food's page: how much and Add on the first screen */
    await p.click('[data-nfpick="0"]');
    await p.waitForTimeout(300);
    const page = await p.evaluate(() => {
      const add = document.querySelector('.nf-sheet [data-nf="save"]'), more = document.querySelector('.nf-sheet .nf-more');
      const tx = (id) => ((document.getElementById(id) || {}).textContent || '').replace(/\s+/g, ' ').trim();
      return { name: (document.getElementById('nfName') || {}).value, focus: document.activeElement && document.activeElement.id,
        one: tx('nfOne'), amt: tx('nfAmtN') + ' × ' + tx('nfAmtU'), plate: tx('nfPlate'), add: add && add.textContent,
        addBottom: add && add.getBoundingClientRect().bottom, vh: innerHeight, open: more && more.open,
        panelFolded: !!(more && more.querySelector('.nfl #nfKcal')),
        grid: [...document.querySelectorAll('#nfNow .mfs-nr')].map((r) => [...r.children].map((c) => c.textContent).join(' ')) };
    });
    t.ok('a food from the list opens on its page, named, and with no keyboard over it',
      page.name === 'Tyson Chicken Nuggets' && page.focus !== 'nfName', JSON.stringify(page));
    t.ok('what one of it is, how much, the plate’s P, F and C, and Add, all on the first screen',
      page.one === 'One of it: 5 pieces (90 g)' && page.amt === '1 × 5 pieces' && /269 kcal · 14P · 17F · 15C/.test(page.plate) &&
      page.add === 'Add to Breakfast' && page.addBottom <= page.vh, JSON.stringify(page));
    t.ok('the figures for that amount as the food page’s grid',
      page.grid.includes('Calories 269') && page.grid.includes('Protein 14 g') && page.grid.includes('Sodium 470 mg'), JSON.stringify(page.grid));
    t.ok('and the packet’s whole label folded under them, every box still there', page.open === false && page.panelFolded, JSON.stringify(page));

    await p.click('[data-nfamt="1"]');
    const more = await p.evaluate(() => [document.getElementById('nfAmtN').textContent, document.getElementById('nfPlate').textContent.replace(/\s+/g, ' ')]);
    t.ok('+ is half a serving more, and the plate follows', more[0] === '1½' && /404 kcal · 21P · 26F · 23C/.test(more[1]), JSON.stringify(more));
    await p.click('.nf-sheet [data-nf="save"]');
    await p.waitForTimeout(300);
    const saved = await p.evaluate(() => {
      const day = JSON.parse(localStorage.getItem('bsc.macroDays') || '{}');
      const k = Object.keys(day).sort().pop();
      const items = [].concat(...Object.values(day[k] || {}).filter(Array.isArray)).filter((it) => /^f:my:/.test(it.id));
      return { items: items.map((it) => it.x), sheet: !!document.querySelector('.msheet') };
    });
    t.ok('Add puts it on the meal at the amount said, and the meal’s sheet comes back', saved.sheet && saved.items.length === 1 && saved.items[0] === 1.5, JSON.stringify(saved));

    /* ---- the barcode, from the meal's own sheet */
    const q = await open();
    await openMeal(q, 'd');
    await q.click('#modalRoot .mp-cam');
    await q.waitForTimeout(300);
    const scan = await q.evaluate(() => ({ sheet: document.querySelector('.msheet').getAttribute('aria-label'), lens: !!document.getElementById('scanRoot') }));
    t.ok('the meal’s barcode opens its sheet on the camera', scan.sheet === 'Dinner' && scan.lens, JSON.stringify(scan));

    /* A scanned packet: its two grades and its allergens as one line of chips */
    await q.fill('#nfFind', '0023700014498');
    await q.click('[data-nf="code"]');
    await q.waitForFunction(() => document.getElementById('nfName'), null, { timeout: 5000 });
    await q.waitForTimeout(200);
    const scanned = await q.evaluate(() => ({ eyebrow: document.querySelector('.nf-sheet .sheet-eyebrow').textContent,
      chips: [...document.querySelectorAll('#nfOffTop .nf-chip')].map((c) => c.textContent.replace(/\s+/g, ' ').trim()),
      alg: document.getElementById('nfAlg').textContent, add: document.querySelector('[data-nf="save"]').getBoundingClientRect().bottom <= innerHeight }));
    t.ok('a scanned packet says so, with its Nutri-Score, NOVA group and allergens as one short line',
      scanned.eyebrow === 'A food you scanned' && scanned.chips.length === 2 && /^D\s*Nutri-Score$/.test(scanned.chips[0]) &&
      /^4\s*Ultra-processed \(NOVA 4 of 4\)$/.test(scanned.chips[1]) && /Contains gluten/.test(scanned.alg) && scanned.add, JSON.stringify(scanned));
    await q.click('.nf-sheet .sheet-x');
    await q.waitForTimeout(200);
    const back = await q.evaluate(() => ({ form: !!document.getElementById('nfName'), sheet: !!document.querySelector('.msheet'), html: document.getElementById('modalRoot').innerHTML.slice(0, 200) }));
    t.ok('its × goes back to the meal, as Cancel did', !back.form && back.sheet, JSON.stringify(back));
    await q.context().close();

    /* ---- 320 px, dark: the food's page fits */
    const n = await open({ width: 320, height: 640 }, { colorScheme: 'dark' });
    await openMeal(n, 'b');
    await n.fill('#mpFind', 'tyson chicken nugget');
    await n.waitForFunction(() => document.querySelector('[data-nfpick]'), null, { timeout: 5000 });
    await n.click('[data-nfpick="0"]');
    await n.waitForTimeout(300);
    const fitPage = await n.evaluate(() => ({ page: document.documentElement.scrollWidth <= innerWidth,
      sheet: document.querySelector('.nf-sheet').scrollWidth <= document.querySelector('.nf-sheet').clientWidth,
      add: document.querySelector('[data-nf="save"]').getBoundingClientRect().bottom <= innerHeight }));
    t.ok('at 320 px in the dark the food’s page fits, with Add still on the first screen',
      fitPage.page && fitPage.sheet && fitPage.add, JSON.stringify(fitPage));
    await n.context().close();

    t.ok('with no error on the page', errs.length === 0, errs.join(' | '));
    await p.context().close();
  },
};
